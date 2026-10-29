import type { RenderedFile } from './render/types';

const API = 'https://api.cloudflare.com/client/v4';

export interface DeployResult {
  ok: boolean;
  provider: 'cloudflare' | 'manual';
  url?: string;
  deploymentId?: string;
  error?: string;
}

function token(): string {
  return (process.env.CLOUDFLARE_API_TOKEN || '').trim();
}

function accountId(): string {
  return (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
}

export function isCloudflareConfigured(): boolean {
  return !!(token() && accountId());
}

async function cf<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token()}`,
      ...(init.headers as Record<string, string> | undefined),
    };
    if (init.body && !(init.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const res = await fetch(`${API}${path}`, { ...init, headers, signal: controller.signal });
    const data = (await res.json().catch(() => ({}))) as any;
    if (!res.ok || data?.success === false) {
      const details = Array.isArray(data?.errors)
        ? data.errors.map((e: any) => `${e.code ?? ''}: ${e.message ?? ''}`).join('; ')
        : '';
      const err: any = new Error(`Cloudflare ${res.status}${details ? ` — ${details}` : ''}`);
      err.status = res.status;
      err.details = details;
      throw err;
    }
    return data.result as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureProject(name: string): Promise<void> {
  try {
    const project = await cf<any>(`/accounts/${accountId()}/pages/projects/${encodeURIComponent(name)}`);
    const sourceType = project?.source?.type;
    if (sourceType && sourceType !== 'direct_upload') {
      throw new Error(`المشروع ${name} مرتبط بـ ${sourceType} ولا يقبل الرفع المباشر. اختر اسماً فرعياً آخر.`);
    }
    return;
  } catch (err: any) {
    if (err?.status !== 404) throw err;
  }
  await cf(`/accounts/${accountId()}/pages/projects`, {
    method: 'POST',
    body: JSON.stringify({ name, production_branch: 'main' }),
  });
}

function extOf(path: string): string {
  const base = path.split('/').pop() || '';
  const dot = base.lastIndexOf('.');
  return dot === -1 ? '' : base.slice(dot + 1);
}

function hashFile(file: RenderedFile, path: string): string {
  // Mirrors wrangler: blake3(base64(contents) + extension), first 32 hex chars.
  const { hash } = require('blake3-wasm');
  const base64 = file.encoding === 'base64'
    ? file.content
    : Buffer.from(file.content, 'utf8').toString('base64');
  return hash(base64 + extOf(path)).toString('hex').slice(0, 32);
}

interface Asset {
  path: string;
  hash: string;
  size: number;
  type: string;
  content: string;
  encoding: 'utf8' | 'base64';
}

function assetsFromFiles(files: Record<string, RenderedFile>): Asset[] {
  return Object.entries(files)
    .filter(([path]) => !path.endsWith('/') && !path.startsWith('_'))
    .map(([path, file]) => ({
      path: `/${path}`,
      hash: hashFile(file, path),
      size: file.encoding === 'base64' ? Math.ceil(file.content.length * 0.75) : Buffer.byteLength(file.content, 'utf8'),
      type: file.type,
      content: file.content,
      encoding: file.encoding,
    }));
}

async function uploadToken(project: string): Promise<string> {
  const result = await cf<{ jwt: string }>(
    `/accounts/${accountId()}/pages/projects/${encodeURIComponent(project)}/upload-token`,
  );
  if (!result?.jwt) throw new Error('تعذر الحصول على رمز رفع Cloudflare.');
  return result.jwt;
}

async function assetsPost<T>(jwt: string, path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as any;
  if (!res.ok || data?.success === false) {
    const details = Array.isArray(data?.errors)
      ? data.errors.map((e: any) => `${e.code ?? ''}: ${e.message ?? ''}`).join('; ')
      : '';
    throw new Error(`Cloudflare upload ${res.status}${details ? ` — ${details}` : ''}`);
  }
  return data.result as T;
}

export async function deployToCloudflare(
  projectName: string,
  files: Record<string, RenderedFile>,
  message = 'Website update',
): Promise<DeployResult> {
  if (!isCloudflareConfigured()) {
    return {
      ok: false,
      provider: 'manual',
      error: 'لم تُضبط بيانات Cloudflare بعد. نزّل ملف ZIP وارفعه يدوياً أو أضف CLOUDFLARE_API_TOKEN و CLOUDFLARE_ACCOUNT_ID في إعدادات السيرفر.',
    };
  }

  try {
    await ensureProject(projectName);
    let jwt = await uploadToken(projectName);
    const assets = assetsFromFiles(files);
    if (assets.length > 19_000) throw new Error('عدد الملفات يتجاوز حد Cloudflare المجاني.');

    const hashes = Array.from(new Set(assets.map((a) => a.hash)));
    let missing: string[] | null = null;
    try {
      missing = await assetsPost<string[]>(jwt, '/pages/assets/check-missing', { hashes });
    } catch (err: any) {
      if (err?.message?.includes('401')) {
        jwt = await uploadToken(projectName);
        missing = await assetsPost<string[]>(jwt, '/pages/assets/check-missing', { hashes });
      } else {
        // Caching is an optimisation; if it fails, upload everything.
        missing = null;
      }
    }
    const missingSet = new Set(missing === null ? hashes : missing);
    const toUpload = assets.filter((a) => missingSet.has(a.hash));

    const batches: Asset[][] = [];
    let batch: Asset[] = [];
    let batchSize = 0;
    for (const asset of toUpload.sort((a, b) => b.size - a.size)) {
      if (batch.length >= 15 || batchSize + asset.size > 20 * 1024 * 1024) {
        if (batch.length) batches.push(batch);
        batch = [];
        batchSize = 0;
      }
      batch.push(asset);
      batchSize += asset.size;
    }
    if (batch.length) batches.push(batch);

    for (const group of batches) {
      const payload = group.map((asset) => ({
        key: asset.hash,
        value: asset.encoding === 'base64' ? asset.content : Buffer.from(asset.content, 'utf8').toString('base64'),
        metadata: { contentType: asset.type },
        base64: true,
      }));
      try {
        await assetsPost(jwt, '/pages/assets/upload', payload);
      } catch (err: any) {
        if (err?.message?.includes('401')) {
          jwt = await uploadToken(projectName);
          await assetsPost(jwt, '/pages/assets/upload', payload);
        } else {
          throw err;
        }
      }
    }

    try {
      await assetsPost(jwt, '/pages/assets/upsert-hashes', { hashes });
    } catch {
      // Non-fatal.
    }

    const manifest: Record<string, string> = {};
    for (const asset of assets) manifest[asset.path] = asset.hash;
    const form = new FormData();
    form.append('manifest', JSON.stringify(manifest));
    form.append('branch', 'main');
    form.append('commit_message', message.slice(0, 300));
    const deployment = await cf<any>(
      `/accounts/${accountId()}/pages/projects/${encodeURIComponent(projectName)}/deployments`,
      { method: 'POST', body: form },
    );

    const deploymentId = deployment?.id;
    let url: string = deployment?.url || `https://${projectName}.pages.dev`;
    const aliases: string[] = Array.isArray(deployment?.aliases) ? deployment.aliases : [];
    const productionAlias = aliases.find((a) => a.includes(`${projectName}.pages.dev`));
    if (productionAlias) url = productionAlias;
    else url = `https://${projectName}.pages.dev`;

    // Wait briefly for the deploy stage; a timeout is not a failure.
    if (deploymentId) {
      const started = Date.now();
      while (Date.now() - started < 30_000) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        try {
          const current = await cf<any>(
            `/accounts/${accountId()}/pages/projects/${encodeURIComponent(projectName)}/deployments/${deploymentId}`,
          );
          const stage = current?.latest_stage;
          if (stage?.name === 'deploy' && stage?.status === 'success') break;
          if (stage?.status === 'failure' || stage?.status === 'canceled') {
            return {
              ok: false,
              provider: 'cloudflare',
              deploymentId,
              url,
              error: `فشل نشر Cloudflare في المرحلة ${stage?.name || 'deploy'}.`,
            };
          }
        } catch {
          // Keep polling; the deployment may already be live.
        }
      }
    }

    return { ok: true, provider: 'cloudflare', url, deploymentId };
  } catch (err: any) {
    return {
      ok: false,
      provider: 'cloudflare',
      error: String(err?.message || err).slice(0, 1200),
    };
  }
}

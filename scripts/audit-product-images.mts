/**
 * Product image audit — read-only.
 *
 * Checks every image referenced by the bundled catalog and by the live API
 * (the server copy is what visitors actually see), reports whether local
 * files exist and probes external URLs with HEAD (GET fallback).
 */
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { products as fileProducts } from '../src/app/data/products';

const PUBLIC_DIR = resolve('public');
const API_URL = 'https://iueefgma6y.onrender.com/api/products';

type Row = {
  product: string;
  url: string;
  kind: 'local' | 'external' | 'empty';
  exists: string;
  status: string;
  size: string;
  ms: string;
};

function localPath(url: string): string | null {
  let path = url;
  try {
    if (/^https?:\/\//i.test(path)) path = new URL(path).pathname;
  } catch {
    return null;
  }
  path = path.split('?')[0].split('#')[0].replace(/^\/+/, '');
  if (!path) return null;
  return resolve(PUBLIC_DIR, path);
}

function fmtBytes(bytes: number | null): string {
  if (bytes == null || Number.isNaN(bytes)) return '—';
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

async function probe(url: string): Promise<{ status: string; bytes: number | null; ms: number }> {
  const started = Date.now();
  let status = 'ERR';
  let bytes: number | null = null;
  try {
    let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
    if (!res.ok) {
      res = await fetch(url, { method: 'GET', redirect: 'follow' });
      if (res.body) {
        const buf = await res.arrayBuffer();
        bytes = buf.byteLength;
      }
    } else {
      const length = res.headers.get('content-length');
      bytes = length ? Number(length) : null;
    }
    status = String(res.status);
  } catch (error: any) {
    status = `ERR:${error?.name || 'fetch'}`;
  }
  return { status, bytes, ms: Date.now() - started };
}

async function audit(
  products: any[],
  source: string,
): Promise<Row[]> {
  const rows: Row[] = [];
  const seen = new Set<string>();
  for (const product of products) {
    const name =
      product.nameAr || product.nameFr || product.nameEn || `#${product.id}`;
    const urls: string[] = [product.image, ...(Array.isArray(product.images) ? product.images : [])]
      .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0);
    const unique = [...new Set(urls)];
    if (!unique.length) {
      rows.push({ product: name, url: '(none)', kind: 'empty', exists: '—', status: 'NO IMAGE', size: '—', ms: '—' });
      continue;
    }
    for (const url of unique) {
      const key = `${source}:${name}:${url}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const external = /^https?:\/\//i.test(url);
      if (!external) {
        const path = localPath(url);
        const exists = !!path && existsSync(path);
        const size = exists ? statSync(path!).size : null;
        rows.push({
          product: name,
          url,
          kind: 'local',
          exists: exists ? 'YES' : 'MISSING',
          status: exists ? 'file' : '404 (file)',
          size: fmtBytes(size),
          ms: '—',
        });
      } else {
        const result = await probe(url);
        rows.push({
          product: name,
          url,
          kind: 'external',
          exists: 'n/a',
          status: result.status,
          size: fmtBytes(result.bytes),
          ms: `${result.ms} ms`,
        });
      }
    }
  }
  return rows;
}

function print(rows: Row[], source: string) {
  console.log(`\n### ${source} (${rows.length} image references)\n`);
  console.log('| المنتج | رابط الصورة | النوع | موجود في public | الحالة HTTP | الحجم | الزمن |');
  console.log('|---|---|---|---|---|---|---|');
  for (const row of rows) {
    console.log(
      `| ${row.product} | \`${row.url}\` | ${row.kind} | ${row.exists} | ${row.status} | ${row.size} | ${row.ms} |`,
    );
  }
}

async function main() {
  const fileRows = await audit(fileProducts, 'products.ts (bundled)');
  print(fileRows, 'products.ts (bundled)');

  let apiRows: Row[] = [];
  let apiNote = '';
  try {
    const res = await fetch(API_URL, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { products?: any[] };
    const list = Array.isArray(data.products) ? data.products : [];
    apiRows = await audit(list, 'live API (server copy)');
    print(apiRows, `live API (server copy) — ${list.length} products`);
  } catch (error: any) {
    apiNote = `live API unreachable: ${error?.message || error}`;
    console.log(`\n### live API\n\n${apiNote}`);
  }

  const all = [...fileRows, ...apiRows];
  const missingLocal = all.filter((r) => r.kind === 'local' && r.exists === 'MISSING');
  const brokenExternal = all.filter((r) => r.kind === 'external' && !/^2xx?$/.test(r.status) && !/^[23]/.test(r.status));
  const slowExternal = all.filter((r) => r.kind === 'external' && Number(r.ms.replace(/[^\d]/g, '')) > 2000);
  const heavy = all.filter((r) => {
    const value = r.size;
    if (value.endsWith('MB')) return parseFloat(value) > 0.5;
    if (value.endsWith('KB')) return parseFloat(value) > 500;
    return false;
  });
  const empty = all.filter((r) => r.kind === 'empty');

  const uniqueMissing = [...new Set(missingLocal.map((r) => r.url))];
  const uniqueBroken = [...new Set(brokenExternal.map((r) => r.url))];

  console.log('\n### Summary');
  console.log(`- missing local files: ${uniqueMissing.length} (${uniqueMissing.join(', ') || 'none'})`);
  console.log(`- broken external links: ${uniqueBroken.length} (${uniqueBroken.join(', ') || 'none'})`);
  console.log(`- slow external (>2s): ${slowExternal.length} (${[...new Set(slowExternal.map((r) => r.url))].join(', ') || 'none'})`);
  console.log(`- heavy images (>500KB): ${[...new Set(heavy.map((r) => r.url))].join(', ') || 'none'}`);
  console.log(`- products without image: ${empty.length}`);

  const brokenRows = all.filter((r) => (r.kind === 'local' && r.exists === 'MISSING') || (r.kind === 'external' && !/^[23]/.test(r.status)));
  console.log('\n### Impacted products');
  console.log(JSON.stringify([...new Set(brokenRows.map((r) => `${r.product} -> ${r.url} (${r.status})`))], null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

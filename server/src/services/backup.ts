import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../utils/prisma';
import {
  BACKUP_KEY_MIN_LENGTH,
  isValidBackupKey,
  packBackupJson,
} from './backupCrypto';

const SETTING_KEY = 'backup_last_run_v1';
const MAX_BACKUP_BYTES = 90 * 1024 * 1024;
const GITHUB_API = 'https://api.github.com';
const FILE_PREFIX = 'aos-backup-';

export interface BackupMeta {
  filename: string;
  createdAt: string;
  size: number;
  sha256: string;
  tables: number;
  rows: number;
}

export interface BackupRunResult extends BackupMeta {
  destination: 'github' | 'disk';
  storedAt: string;
}

interface StoredBackupStatus {
  at: string;
  status: 'ok' | 'error';
  destination?: 'github' | 'disk' | null;
  filename?: string;
  size?: number;
  sha256?: string;
  tables?: number;
  rows?: number;
  error?: string;
}

export type BackupDestination = 'github' | 'disk';

function backupKey(): string | null {
  const value = (process.env.BACKUP_ENCRYPTION_KEY || '').trim();
  return isValidBackupKey(value) ? value : null;
}

export function isBackupEncryptionConfigured(): boolean {
  return backupKey() !== null;
}

function githubConfig(): { repo: string; token: string; dir: string; branch: string } | null {
  const repo = (process.env.BACKUP_GITHUB_REPO || '').trim();
  const token = (process.env.BACKUP_GITHUB_TOKEN || '').trim();
  if (!repo || !token) return null;
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) return null;
  const dir = (process.env.BACKUP_GITHUB_PATH || 'backups').trim().replace(/^\/+|\/+$/g, '');
  if (dir && !dir.split('/').every((part) => /^[A-Za-z0-9_.-]+$/.test(part))) return null;
  return { repo, token, dir, branch: (process.env.BACKUP_GITHUB_BRANCH || '').trim() };
}

export function getBackupDestination(): BackupDestination {
  return githubConfig() ? 'github' : 'disk';
}

export function isAutoBackupEnabled(): boolean {
  return (process.env.BACKUP_AUTO || '').trim().toLowerCase() === 'true';
}

function backupDir(): string {
  return path.resolve(process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'));
}

function backupKeep(): number {
  const parsed = Number.parseInt(process.env.BACKUP_KEEP || '7', 10);
  if (!Number.isFinite(parsed)) return 7;
  return Math.min(Math.max(parsed, 1), 60);
}

function backupFilename(createdAt: Date): string {
  const stamp = createdAt.toISOString().replace(/[:.]/g, '-');
  return `${FILE_PREFIX}${stamp}.json.gz.enc`;
}

function sanitizeBackupError(err: unknown): string {
  let message = err instanceof Error ? err.message : String(err);
  for (const secret of [
    backupKey(),
    (process.env.BACKUP_GITHUB_TOKEN || '').trim(),
  ]) {
    if (secret) message = message.split(secret).join('***');
  }
  return message.replace(/[\r\n]+/g, ' ').slice(0, 300);
}

function jsonSafe(value: any): any {
  if (value === null || value === undefined) return null;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return { type: 'Buffer', base64: value.toString('base64') };
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (typeof value === 'object') {
    // Prisma Decimal values stringify through their own representation.
    if (typeof value.toFixed === 'function' && typeof value.toNumber === 'function') {
      return value.toString();
    }
    const out: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) out[key] = jsonSafe(item);
    return out;
  }
  return value;
}

async function readSetting(key: string): Promise<string | null> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row?.value ?? null;
  } catch {
    return null;
  }
}

async function writeSetting(key: string, value: string): Promise<void> {
  await prisma.setting
    .upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
    .catch(() => {
      /* status persistence is best effort */
    });
}

async function recordStatus(status: StoredBackupStatus): Promise<void> {
  await writeSetting(SETTING_KEY, JSON.stringify(status).slice(0, 2_000));
}

function parseStoredStatus(raw: string | null): StoredBackupStatus | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      at: typeof parsed.at === 'string' ? parsed.at : '',
      status: parsed.status === 'ok' ? 'ok' : 'error',
      destination: parsed.destination === 'github' || parsed.destination === 'disk'
        ? parsed.destination
        : null,
      filename: typeof parsed.filename === 'string' ? parsed.filename.slice(0, 200) : undefined,
      size: Number.isFinite(parsed.size) ? Number(parsed.size) : undefined,
      sha256: typeof parsed.sha256 === 'string' ? parsed.sha256.slice(0, 64) : undefined,
      tables: Number.isFinite(parsed.tables) ? Number(parsed.tables) : undefined,
      rows: Number.isFinite(parsed.rows) ? Number(parsed.rows) : undefined,
      error: typeof parsed.error === 'string' ? parsed.error.slice(0, 300) : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Reads the whole public schema through Prisma so the dump works on Render
 * without pg_dump. Only table names returned by pg_tables are interpolated,
 * and each one must match a strict identifier pattern.
 */
export async function createEncryptedBackup(): Promise<{ buffer: Buffer; meta: BackupMeta }> {
  const key = backupKey();
  if (!key) {
    throw new Error(
      `Backup encryption is not configured. Set BACKUP_ENCRYPTION_KEY (${BACKUP_KEY_MIN_LENGTH}+ characters) on the server.`
    );
  }

  const createdAt = new Date();
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
    ORDER BY tablename
  `;

  const data: Record<string, Array<Record<string, any>>> = {};
  let rowCount = 0;
  for (const { tablename } of tables) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(tablename)) continue;
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, any>>>(
      `SELECT * FROM "${tablename}"`
    );
    data[tablename] = rows.map(jsonSafe);
    rowCount += rows.length;
  }

  const payload = {
    format: 'aos-tech-store-backup',
    version: 1,
    createdAt: createdAt.toISOString(),
    tables: data,
  };
  const plain = Buffer.from(JSON.stringify(payload), 'utf8');
  if (plain.length > MAX_BACKUP_BYTES) {
    throw new Error('The database is too large for this backup format (limit 90 MB).');
  }

  const buffer = packBackupJson(payload, key);
  const meta: BackupMeta = {
    filename: backupFilename(createdAt),
    createdAt: createdAt.toISOString(),
    size: buffer.length,
    sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
    tables: Object.keys(data).length,
    rows: rowCount,
  };
  return { buffer, meta };
}

async function saveToDisk(buffer: Buffer, filename: string): Promise<string> {
  const dir = backupDir();
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const target = path.join(dir, filename);
  await fs.writeFile(target, buffer, { mode: 0o600 });
  const entries = await fs.readdir(dir).catch(() => [] as string[]);
  const backups = entries
    .filter((name) => name.startsWith(FILE_PREFIX) && name.endsWith('.enc'))
    .sort();
  const old = backups.slice(0, Math.max(0, backups.length - backupKeep()));
  await Promise.all(old.map((name) => fs.unlink(path.join(dir, name)).catch(() => undefined)));
  return target;
}

async function uploadToGitHub(buffer: Buffer, filename: string): Promise<string> {
  const config = githubConfig();
  if (!config) throw new Error('GitHub backup destination is not configured');
  if (buffer.length > MAX_BACKUP_BYTES) {
    throw new Error('The encrypted backup is too large for the GitHub contents API.');
  }
  const relative = config.dir ? `${config.dir}/${filename}` : filename;
  const url = `${GITHUB_API}/repos/${config.repo}/contents/${relative
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`;
  const body: Record<string, unknown> = {
    message: `chore(backup): ${filename}`,
    content: buffer.toString('base64'),
  };
  if (config.branch) body.branch = config.branch;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'aos-tech-store-backup',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 200);
    throw new Error(`GitHub upload failed (${response.status}): ${detail}`);
  }
  return `github:${config.repo}/${relative}`;
}

/**
 * Creates a backup and stores it off the server when possible. The admin
 * download route uses createEncryptedBackup directly, so a missing external
 * destination never blocks a manual backup.
 */
export async function runBackup(): Promise<BackupRunResult> {
  const { buffer, meta } = await createEncryptedBackup();
  let destination: BackupDestination = 'disk';
  let storedAt: string;

  try {
    if (githubConfig()) {
      destination = 'github';
      storedAt = await uploadToGitHub(buffer, meta.filename);
    } else {
      storedAt = await saveToDisk(buffer, meta.filename);
    }
    await recordStatus({
      at: new Date().toISOString(),
      status: 'ok',
      destination,
      filename: meta.filename,
      size: meta.size,
      sha256: meta.sha256,
      tables: meta.tables,
      rows: meta.rows,
    });
  } catch (err) {
    const message = sanitizeBackupError(err);
    await recordStatus({ at: new Date().toISOString(), status: 'error', error: message });
    throw new Error(message);
  }

  return { ...meta, destination, storedAt };
}

export interface BackupStatus {
  encryptionConfigured: boolean;
  autoEnabled: boolean;
  destination: BackupDestination;
  githubConfigured: boolean;
  diskPath: string;
  keep: number;
  last: StoredBackupStatus | null;
}

export async function getBackupStatus(): Promise<BackupStatus> {
  return {
    encryptionConfigured: isBackupEncryptionConfigured(),
    autoEnabled: isAutoBackupEnabled(),
    destination: getBackupDestination(),
    githubConfigured: githubConfig() !== null,
    diskPath: backupDir(),
    keep: backupKeep(),
    last: parseStoredStatus(await readSetting(SETTING_KEY)),
  };
}

let schedulerStarted = false;

async function runScheduledBackup(reason: string): Promise<void> {
  try {
    const result = await runBackup();
    console.log(`[Backup] ${reason}: stored ${result.filename} (${result.size} bytes) at ${result.storedAt}`);
  } catch (err) {
    console.error(`[Backup] ${reason} failed:`, err instanceof Error ? err.message : err);
  }
}

/**
 * Runs once a day at BACKUP_HOUR_UTC. Render Free may restart the instance,
 * so the job is intentionally idempotent: a failed run is recorded in the
 * settings table and the next boot schedules a new attempt. A stale backup is
 * also refreshed shortly after boot, because a sleep can swallow the timer.
 */
export function startBackupScheduler(): void {
  if (schedulerStarted) return;
  if (!isAutoBackupEnabled()) return;
  if (!isBackupEncryptionConfigured()) {
    console.warn('[Backup] BACKUP_AUTO is enabled but BACKUP_ENCRYPTION_KEY is missing or short');
    return;
  }
  schedulerStarted = true;

  const hour = Math.min(
    Math.max(Number.parseInt(process.env.BACKUP_HOUR_UTC || '3', 10) || 3, 0),
    23
  );

  // A free instance can be asleep when the daily timer would fire. If the
  // last successful backup is older than 30 hours, take one after the boot
  // settles instead of waiting a full day.
  void (async () => {
    const last = parseStoredStatus(await readSetting(SETTING_KEY));
    const lastOk = last?.status === 'ok' && last.at ? Date.parse(last.at) : 0;
    const stale = !Number.isFinite(lastOk) || Date.now() - lastOk > 30 * 60 * 60 * 1000;
    if (!stale) return;
    const timer = setTimeout(() => {
      void runScheduledBackup('Post-boot catch-up');
    }, 2 * 60 * 1000);
    timer.unref();
    console.log('[Backup] Last successful backup is stale; catch-up scheduled after boot');
  })();

  const scheduleNext = () => {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(hour, 0, 0, 0);
    if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
    const timer = setTimeout(async () => {
      await runScheduledBackup('Scheduled backup');
      scheduleNext();
    }, Math.max(next.getTime() - now.getTime(), 1_000));
    timer.unref();
    console.log(`[Backup] Next automatic backup at ${next.toISOString()}`);
  };

  scheduleNext();
}

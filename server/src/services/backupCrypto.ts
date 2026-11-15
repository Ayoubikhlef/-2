import crypto from 'crypto';
import { gzipSync, gunzipSync } from 'zlib';

/**
 * Backup file layout:
 *
 *   "AOSBAK1" | salt (16) | iv (12) | auth tag (16) | AES-256-GCM ciphertext
 *
 * The JSON payload is gzipped before encryption. The passphrase never leaves
 * the environment: only the encrypted blob is written to disk or uploaded.
 */
export const BACKUP_MAGIC = Buffer.from('AOSBAK1', 'ascii');
export const BACKUP_KEY_MIN_LENGTH = 32;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export function isValidBackupKey(passphrase: string | undefined | null): boolean {
  return typeof passphrase === 'string' && passphrase.trim().length >= BACKUP_KEY_MIN_LENGTH;
}

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, 32, SCRYPT_OPTIONS);
}

export function encryptBackupPayload(plain: Buffer, passphrase: string): Buffer {
  if (!isValidBackupKey(passphrase)) {
    throw new Error(`BACKUP_ENCRYPTION_KEY must be at least ${BACKUP_KEY_MIN_LENGTH} characters`);
  }
  const salt = crypto.randomBytes(SALT_BYTES);
  const iv = crypto.randomBytes(IV_BYTES);
  const key = deriveKey(passphrase, salt);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([BACKUP_MAGIC, salt, iv, cipher.getAuthTag(), ciphertext]);
}

export function decryptBackupPayload(payload: Buffer, passphrase: string): Buffer {
  if (!isValidBackupKey(passphrase)) {
    throw new Error(`BACKUP_ENCRYPTION_KEY must be at least ${BACKUP_KEY_MIN_LENGTH} characters`);
  }
  const headerLength = BACKUP_MAGIC.length + SALT_BYTES + IV_BYTES + TAG_BYTES;
  if (!Buffer.isBuffer(payload) || payload.length <= headerLength) {
    throw new Error('Backup file is empty or truncated');
  }
  if (!payload.subarray(0, BACKUP_MAGIC.length).equals(BACKUP_MAGIC)) {
    throw new Error('Not an AOS backup file');
  }
  let offset = BACKUP_MAGIC.length;
  const salt = payload.subarray(offset, (offset += SALT_BYTES));
  const iv = payload.subarray(offset, (offset += IV_BYTES));
  const tag = payload.subarray(offset, (offset += TAG_BYTES));
  const ciphertext = payload.subarray(offset);
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function packBackupJson(value: unknown, passphrase: string): Buffer {
  return encryptBackupPayload(gzipSync(Buffer.from(JSON.stringify(value), 'utf8')), passphrase);
}

export function unpackBackupJson(payload: Buffer, passphrase: string): any {
  return JSON.parse(gunzipSync(decryptBackupPayload(payload, passphrase)).toString('utf8'));
}

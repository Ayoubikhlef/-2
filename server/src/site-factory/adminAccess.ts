import crypto from 'crypto';

/**
 * The site-owner dashboard link is a bearer credential: whoever holds it can
 * claim the dashboard session. We keep only its hash in `Site.adminTokenHash`,
 * but the owner and the customer also need to be able to see the link again in
 * the order details. A reversible copy is therefore stored inside
 * `Site.config.dashboardAccess`, encrypted with a server-only key. Never send
 * this field to the generated (public) site bundle.
 */

const MAGIC = Buffer.from('AOSDASH1', 'ascii');
const SALT_BYTES = 16;
const IV_BYTES = 12;
const TAG_BYTES = 16;
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function secret(): string {
  return String(
    process.env.BACKUP_ENCRYPTION_KEY || process.env.JWT_SECRET || ''
  ).trim();
}

function deriveKey(passphrase: string, salt: Buffer): Buffer {
  return crypto.scryptSync(passphrase, salt, 32, SCRYPT_OPTIONS);
}

export function encryptDashboardToken(token: string): string | null {
  const passphrase = secret();
  if (!passphrase || !/^[A-Za-z0-9_-]{40,80}$/.test(token)) return null;
  const salt = crypto.randomBytes(SALT_BYTES);
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}

export function decryptDashboardToken(value: unknown): string | null {
  const passphrase = secret();
  if (!passphrase || typeof value !== 'string' || !value) return null;
  let payload: Buffer;
  try {
    payload = Buffer.from(value, 'base64url');
  } catch {
    return null;
  }
  const header = MAGIC.length + SALT_BYTES + IV_BYTES + TAG_BYTES;
  if (payload.length <= header || !payload.subarray(0, MAGIC.length).equals(MAGIC)) return null;

  let offset = MAGIC.length;
  const salt = payload.subarray(offset, (offset += SALT_BYTES));
  const iv = payload.subarray(offset, (offset += IV_BYTES));
  const tag = payload.subarray(offset, (offset += TAG_BYTES));
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv);
    decipher.setAuthTag(tag);
    const token = Buffer.concat([decipher.update(payload.subarray(offset)), decipher.final()]).toString('utf8');
    return /^[A-Za-z0-9_-]{40,80}$/.test(token) ? token : null;
  } catch {
    return null;
  }
}

import crypto from 'crypto';

// RFC 4648 base32 (no padding), used by authenticator apps for TOTP secrets.
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const TOTP_DIGITS = 6;
const TOTP_PERIOD_SECONDS = 30;
const TOTP_WINDOW = 1;
const BACKUP_CODE_BYTES = 8;

export const TWO_FACTOR_ISSUER = 'AOS Tech Store';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  return output;
}

export function base32Decode(input: string): Buffer {
  const clean = String(input || '')
    .toUpperCase()
    .replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const character of clean) {
    const index = BASE32_ALPHABET.indexOf(character);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

export function generateTwoFactorSecret(): string {
  return base32Encode(crypto.randomBytes(20));
}

export function generateTotp(secret: string, counter: number): string {
  const key = base32Decode(secret);
  if (!key.length) return '';
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(Math.max(0, Math.floor(counter))));
  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binary % 10 ** TOTP_DIGITS).padStart(TOTP_DIGITS, '0');
}

function safeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/**
 * A phone keyboard set to Arabic or Persian can produce U+0660..U+0669 or
 * U+06F0..U+06F9 digits. They are valid numerals to the user but would fail a
 * plain /^\d{6}$/ check, so every numeric code is mapped to ASCII first.
 * Zero-width and bidi marks are removed at the same time because copy/paste
 * from a right-to-left page can add them.
 */
export function normalizeNumericCode(input: string): string {
  return String(input || '')
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06f0-\u06f9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\u200c\u200d\u200e\u200f\u202a-\u202e]/g, '')
    .replace(/\s+/g, '');
}

/**
 * Verifies a 6-digit TOTP code with a one-step clock-skew window in each
 * direction, matching the behaviour of common authenticator apps.
 */
export function verifyTotp(secret: string, token: string, window = TOTP_WINDOW): boolean {
  const normalized = normalizeNumericCode(token);
  if (!/^\d{6}$/.test(normalized) || !secret) return false;
  const counter = Math.floor(Date.now() / (TOTP_PERIOD_SECONDS * 1000));
  for (let offset = -window; offset <= window; offset += 1) {
    if (safeEqualText(generateTotp(secret, counter + offset), normalized)) return true;
  }
  return false;
}

export function buildOtpauthUrl(secret: string, accountName: string): string {
  const label = encodeURIComponent(`${TWO_FACTOR_ISSUER}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer: TWO_FACTOR_ISSUER,
    algorithm: 'SHA1',
    digits: String(TOTP_DIGITS),
    period: String(TOTP_PERIOD_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

function normalizeBackupCode(code: string): string {
  return String(code || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(normalizeBackupCode(code)).digest('hex');
}

/**
 * Backup codes are shown once and stored only as SHA-256 hashes. Each code is
 * 64 bits of randomness, so a fast hash is sufficient here (unlike passwords).
 */
export function generateBackupCodes(count = 10): { codes: string[]; hashes: string[] } {
  const codes: string[] = [];
  const hashes: string[] = [];
  for (let index = 0; index < count; index += 1) {
    const raw = crypto.randomBytes(BACKUP_CODE_BYTES).toString('hex');
    const formatted = raw.match(/.{1,4}/g)?.join('-') || raw;
    codes.push(formatted);
    hashes.push(hashBackupCode(formatted));
  }
  return { codes, hashes };
}

/** Returns the unused hashes after consuming one valid backup code. */
export function consumeBackupCode(
  hashes: string[],
  input: string
): { ok: boolean; remaining: string[] } {
  if (!normalizeBackupCode(input)) return { ok: false, remaining: hashes };
  const wanted = Buffer.from(hashBackupCode(input), 'hex');
  let matchIndex = -1;
  for (let index = 0; index < hashes.length; index += 1) {
    const candidate = Buffer.from(String(hashes[index] || ''), 'hex');
    if (candidate.length === wanted.length && crypto.timingSafeEqual(candidate, wanted)) {
      matchIndex = index;
    }
  }
  if (matchIndex === -1) return { ok: false, remaining: hashes };
  const remaining = hashes.slice();
  remaining.splice(matchIndex, 1);
  return { ok: true, remaining };
}

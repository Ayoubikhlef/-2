/**
 * Generates a strong BACKUP_ENCRYPTION_KEY.
 *
 *   npx tsx scripts/generate-backup-key.ts
 *   npx tsx scripts/generate-backup-key.ts --length 64
 *
 * The key is printed once to stdout. Paste it into the Render dashboard
 * (aos-api -> Environment -> BACKUP_ENCRYPTION_KEY) and keep a copy in a
 * password manager: losing the key makes every encrypted snapshot
 * unrecoverable.
 */
import crypto from 'crypto';

const DEFAULT_LENGTH = 64;
const MIN_LENGTH = 32;
const MAX_LENGTH = 128;
// URL-safe alphabet: easy to paste into dashboards and .env files without
// quoting or escaping problems.
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function parseLength(argv: string[]): number {
  const index = argv.indexOf('--length');
  if (index === -1) return DEFAULT_LENGTH;
  const raw = argv[index + 1];
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < MIN_LENGTH || parsed > MAX_LENGTH) {
    console.error(`--length must be an integer between ${MIN_LENGTH} and ${MAX_LENGTH}.`);
    process.exit(2);
  }
  return parsed;
}

function generateKey(length: number): string {
  // crypto.randomInt is uniformly distributed, unlike `random % alphabet.length`.
  let key = '';
  for (let i = 0; i < length; i++) {
    key += ALPHABET[crypto.randomInt(0, ALPHABET.length)];
  }
  return key;
}

const length = parseLength(process.argv.slice(2));
const key = generateKey(length);

if (process.argv.includes('--quiet')) {
  process.stdout.write(key);
} else {
  console.log(key);
  console.error(
    [
      '',
      `Key length: ${length} characters (minimum ${MIN_LENGTH}).`,
      'Store it in a password manager now: without it every snapshot is unreadable.',
      'Render -> aos-api -> Environment -> BACKUP_ENCRYPTION_KEY, then redeploy.',
    ].join('\n')
  );
}

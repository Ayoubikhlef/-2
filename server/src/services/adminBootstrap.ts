import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';

// Store a salted bcrypt hash of the seed password, never its SHA-256 digest.
// A bare SHA-256 fingerprint of a password can be brute-forced offline almost
// instantly if the database leaks; bcrypt keeps the same "did the env value
// change?" check without that weakness.
const FINGERPRINT_KEY = 'admin_seed_password_hash_v2';
const LEGACY_FINGERPRINT_KEY = 'admin_seed_password_fingerprint';

function legacyFingerprint(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Creates the first admin account. An existing account is never updated from
 * the environment unless the stored fingerprint proves that the environment
 * value actually changed, so a restart cannot silently revert a password that
 * was changed through the admin panel.
 */
export async function ensureSeedAdmin(): Promise<void> {
  const password = process.env.SEED_ADMIN_PASSWORD;
  // `hydra` is a legacy username, not a credential. It stays as a fallback so
  // an existing installation does not lose its owner account after an upgrade.
  const email = (process.env.SEED_ADMIN_EMAIL || 'hydra').trim().toLowerCase();

  if (!password) {
    console.warn(
      '[Admin] SEED_ADMIN_PASSWORD is not set - skipping admin provisioning. ' +
        'Set it in the server environment to create or update the admin account.'
    );
    return;
  }

  if (!email || (!email.includes('@') && email !== 'hydra')) {
    console.warn(
      '[Admin] SEED_ADMIN_EMAIL must be a real email address - skipping admin provisioning.'
    );
    return;
  }

  if (password.length < 12) {
    console.warn(
      '[Admin] SECURITY: SEED_ADMIN_PASSWORD must be at least 12 characters. ' +
        'Change it in the Render dashboard, then restart the service.'
    );
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    const stored = await prisma.setting
      .findUnique({ where: { key: FINGERPRINT_KEY } })
      .catch(() => null);
    const legacy = await prisma.setting
      .findUnique({ where: { key: LEGACY_FINGERPRINT_KEY } })
      .catch(() => null);

    const matchesNew = stored?.value
      ? await bcrypt.compare(password, stored.value).catch(() => false)
      : false;
    const matchesLegacy = Boolean(legacy?.value) && legacy?.value === legacyFingerprint(password);
    const hasFingerprint = Boolean(stored?.value || legacy?.value);
    const seedUnchanged = matchesNew || matchesLegacy;
    // The legacy public default must be replaced as soon as a valid seed
    // password exists, even before a fingerprint was ever recorded.
    const usesKnownDefaultPassword = existing?.passwordHash
      ? await bcrypt.compare('hydra', existing.passwordHash).catch(() => false)
      : false;

    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: 'Admin AOS',
          role: 'SUPER_ADMIN',
          phone: process.env.SEED_ADMIN_PHONE || '',
          isActive: true,
        },
      });
      await prisma.setting.upsert({
        where: { key: FINGERPRINT_KEY },
        update: { value: passwordHash },
        create: { key: FINGERPRINT_KEY, value: passwordHash },
      });
      console.log(`[Admin] Created admin account for ${email}`);
      return;
    }

    // Never leave an existing owner account without access.
    if (existing.role !== 'SUPER_ADMIN' || !existing.isActive) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'SUPER_ADMIN', isActive: true, tokenVersion: { increment: 1 } },
      });
      console.log(`[Admin] Restored SUPER_ADMIN access for ${email}`);
    }

    if (seedUnchanged) {
      if (matchesLegacy && !matchesNew) {
        const migratedHash = await bcrypt.hash(password, 12);
        await prisma.setting.upsert({
          where: { key: FINGERPRINT_KEY },
          update: { value: migratedHash },
          create: { key: FINGERPRINT_KEY, value: migratedHash },
        });
        console.log('[Admin] Migrated the legacy password fingerprint to bcrypt');
      } else {
        console.log('[Admin] Admin account already exists; password unchanged');
      }
      return;
    }

    if (!hasFingerprint && !usesKnownDefaultPassword) {
      // First boot after an upgrade with no recorded fingerprint: adopt the
      // current environment value as the baseline WITHOUT changing the
      // account password. This avoids a surprise lockout.
      const baselineHash = await bcrypt.hash(password, 12);
      await prisma.setting.upsert({
        where: { key: FINGERPRINT_KEY },
        update: { value: baselineHash },
        create: { key: FINGERPRINT_KEY, value: baselineHash },
      });
      console.log('[Admin] Stored a password baseline; existing password left unchanged');
      return;
    }

    // A fingerprint exists and the environment value differs: apply the new
    // password and terminate every existing session.
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, refreshToken: null, tokenVersion: { increment: 1 } },
    });
    await prisma.setting.upsert({
      where: { key: FINGERPRINT_KEY },
      update: { value: passwordHash },
      create: { key: FINGERPRINT_KEY, value: passwordHash },
    });
    console.log(`[Admin] Applied new SEED_ADMIN_PASSWORD for ${email}`);
  } catch (error) {
    console.error('[Admin] Admin provisioning failed:', error);
  }
}

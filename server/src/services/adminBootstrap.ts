import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';

const FINGERPRINT_KEY = 'admin_seed_password_fingerprint';

function passwordFingerprint(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Creates the first admin account, and only applies SEED_ADMIN_PASSWORD again
 * when the environment value actually changes. This prevents a restart from
 * silently reverting a password that was changed through the admin panel.
 */
export async function ensureSeedAdmin(): Promise<void> {
  const password = process.env.SEED_ADMIN_PASSWORD;
  const email = (process.env.SEED_ADMIN_EMAIL || 'hydra').trim().toLowerCase();

  if (!password) {
    console.warn(
      '[Admin] SEED_ADMIN_PASSWORD is not set - skipping admin provisioning. ' +
        'Set it in the server environment to create or update the admin account.'
    );
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    const fingerprint = passwordFingerprint(password);
    const stored = await prisma.setting
      .findUnique({ where: { key: FINGERPRINT_KEY } })
      .catch(() => null);

    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: 'Admin AOS',
          role: 'SUPER_ADMIN',
          phone: process.env.SEED_ADMIN_PHONE || '',
        },
      });
      await prisma.setting.upsert({
        where: { key: FINGERPRINT_KEY },
        update: { value: fingerprint },
        create: { key: FINGERPRINT_KEY, value: fingerprint },
      });
      console.log(`[Admin] Created admin account for ${email}`);
      return;
    }

    if (stored?.value === fingerprint) {
      console.log('[Admin] Admin account already exists; password unchanged');
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: existing.id }, data: { passwordHash } });
    await prisma.setting.upsert({
      where: { key: FINGERPRINT_KEY },
      update: { value: fingerprint },
      create: { key: FINGERPRINT_KEY, value: fingerprint },
    });
    console.log(`[Admin] Applied new SEED_ADMIN_PASSWORD for ${email}`);
  } catch (error) {
    console.error('[Admin] Admin provisioning failed:', error);
  }
}

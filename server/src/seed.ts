import bcrypt from 'bcryptjs';
import { prisma } from './utils/prisma';

async function seed() {
  console.log('[Seed] Starting...');

  const seedPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@AOS2025!';

  const adminPassword = await bcrypt.hash(seedPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: process.env.SEED_ADMIN_EMAIL || 'admin@aos.dz' },
    update: { passwordHash: adminPassword },
    create: {
      email: process.env.SEED_ADMIN_EMAIL || 'admin@aos.dz',
      passwordHash: adminPassword,
      name: 'Admin AOS',
      role: 'SUPER_ADMIN',
      phone: process.env.SEED_ADMIN_PHONE || '',
    },
  });

  console.log(`[Seed] Admin created: ${admin.email.slice(0, 3)}***@***`);

  await prisma.setting.upsert({
    where: { key: 'site_name' },
    update: {},
    create: { key: 'site_name', value: 'Ayoub Office Services' },
  });

  console.log('[Seed] Default settings created');
  console.log('[Seed] Done!');
}

seed()
  .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

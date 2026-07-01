import bcrypt from 'bcryptjs';
import { prisma } from './utils/prisma';

async function seed() {
  console.log('[Seed] Starting...');

  const adminPassword = await bcrypt.hash('admin123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@aos.dz' },
    update: {},
    create: {
      email: 'admin@aos.dz',
      passwordHash: adminPassword,
      name: 'Admin AOS',
      role: 'SUPER_ADMIN',
      phone: '0674113290',
    },
  });

  console.log(`[Seed] Admin created: ${admin.email} / admin123`);

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

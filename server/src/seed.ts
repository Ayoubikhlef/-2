import { prisma } from './utils/prisma';
import { ensureSeedAdmin } from './services/adminBootstrap';

async function seed() {
  console.log('[Seed] Starting...');

  await ensureSeedAdmin();

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

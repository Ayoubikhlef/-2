import { prisma } from './utils/prisma';
import { ensureSeedAdmin } from './services/adminBootstrap';

const DIGITAL_MIGRATION_KEY = 'aos_services_migrated_v2';

const DIGITAL_SERVICES_CATEGORY = {
  key: 'digital',
  label: {
    ar: '💻 الخدمات الرقمية',
    fr: '💻 Services numériques',
    en: '💻 Digital Services',
  },
  options: [
    { value: 'digital-store', ar: 'متجر إلكتروني كامل', fr: 'Boutique en ligne complète', en: 'Complete online store' },
    { value: 'digital-website', ar: 'موقع تعريفي احترافي', fr: 'Site vitrine professionnel', en: 'Professional presentation website' },
    { value: 'digital-social', ar: 'إدارة السوشيال ميديا والإعلانات', fr: 'Réseaux sociaux et publicités', en: 'Social media & ads management' },
    { value: 'digital-hosting', ar: 'استضافة ونطاق وبريد ونسخ احتياطي', fr: 'Hébergement, domaine, e-mail et sauvegardes', en: 'Hosting, domain, email & backups' },
    { value: 'digital-pos', ar: 'نظام نقاط البيع والمحاسبة', fr: 'Système de caisse et comptabilité', en: 'POS & accounting system' },
    { value: 'digital-network', ar: 'شبكات وكاميرات مراقبة', fr: 'Réseaux et caméras de surveillance', en: 'Networks & CCTV cameras' },
    { value: 'digital-training', ar: 'تكوين Excel وCanva والذكاء الاصطناعي', fr: 'Formation Excel, Canva et IA', en: 'Excel, Canva & AI training' },
    { value: 'digital-maintenance', ar: 'صيانة وحماية الموقع', fr: 'Maintenance et protection du site', en: 'Website maintenance & protection' },
  ],
};

/**
 * One-time data migration for stores created before the digital-services
 * category existed. The category is edited from the admin panel afterwards, so
 * a marker prevents the migration from resurrecting it after a deliberate
 * deletion. Safe to run on every boot: it is a no-op once the marker is set.
 */
async function ensureDigitalServicesCategory() {
  const alreadyMigrated = await prisma.setting.findUnique({ where: { key: DIGITAL_MIGRATION_KEY } });
  if (alreadyMigrated) return;

  const setting = await prisma.setting.findUnique({ where: { key: 'aos_services' } });
  if (setting) {
    try {
      const parsed = JSON.parse(setting.value);
      if (Array.isArray(parsed) && parsed.length > 0 && !parsed.some((entry: any) => entry?.key === 'digital')) {
        const nextId = parsed.reduce((max: number, entry: any) => Math.max(max, Number(entry?.id) || 0), 0) + 1;
        const merged = [...parsed, { ...DIGITAL_SERVICES_CATEGORY, id: nextId }];
        await prisma.setting.update({
          where: { key: 'aos_services' },
          data: { value: JSON.stringify(merged) },
        });
        console.log('[Seed] Added the digital services category to aos_services');
      }
    } catch (err) {
      console.error('[Seed] Could not migrate aos_services:', err);
      // Leave the marker unset so the next boot can retry after the bad data
      // is fixed instead of silently shipping a partial services list.
      return;
    }
  }

  await prisma.setting.upsert({
    where: { key: DIGITAL_MIGRATION_KEY },
    update: {},
    create: { key: DIGITAL_MIGRATION_KEY, value: 'true' },
  });
}

async function seed() {
  console.log('[Seed] Starting...');

  await ensureSeedAdmin();

  await prisma.setting.upsert({
    where: { key: 'site_name' },
    update: {},
    create: { key: 'site_name', value: 'AOS Tech Store' },
  });

  await ensureDigitalServicesCategory();

  console.log('[Seed] Default settings created');
  console.log('[Seed] Done!');
}

seed()
  .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

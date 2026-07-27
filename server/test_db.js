const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const tables = await p.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('Tables:', tables.map(t => t.table_name).join(', '));
  
  try {
    const setting = await p.setting.findUnique({ where: { key: 'aos_products' } });
    console.log('Setting query:', JSON.stringify(setting));
  } catch(e) { console.error('Setting error:', e.message); }
}
main().catch(console.error);

const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({
  log: ['error'],
  datasources: { db: { url: process.env.DATABASE_URL } }
});
async function test() {
  try {
    const setting = await p.setting.findUnique({ where: { key: 'aos_products' } });
    console.log('OK:', JSON.stringify(setting));
  } catch(e) {
    console.error('ERROR:', e.message, e.code);
  }
  await p.$disconnect();
}
test();

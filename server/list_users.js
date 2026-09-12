const { PrismaClient } = require('@prisma/client');

async function listUsers() {
  const p = new PrismaClient();
  try {
    const users = await p.user.findMany({
      select: { email: true, role: true, isActive: true }
    });
    console.log('All users:');
    users.forEach(u => console.log(`- ${u.email} | ${u.role} | ${u.isActive}`));
  } catch (e) {
    console.error('Error listing users:', e);
  } finally {
    await p.$disconnect();
  }
}

listUsers();

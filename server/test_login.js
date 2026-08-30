const {PrismaClient} = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function test() {
  const p = new PrismaClient();
  await p.$connect();
  
  const user = await p.user.findUnique({where: {email: 'admin@aos.dz'}});
  console.log('User found:', user ? user.email : 'NOT FOUND');
  console.log('User role:', user?.role);
  console.log('isActive:', user?.isActive);
  
  if (user) {
    const valid = await bcrypt.compare('Admin@AOS2025!', user.passwordHash);
    console.log('Password valid:', valid);
  }
  
  await p.$disconnect();
}

test().catch(e => console.error('Error:', e));
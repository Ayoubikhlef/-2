const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function verify() {
  const p = new PrismaClient();
  try {
    const user = await p.user.findUnique({ where: { email: 'hydra' } });
    if (!user) {
      console.log('User "hydra" NOT FOUND in database.');
      return;
    }
    console.log('User "hydra" found:');
    console.log(' - ID:', user.id);
    console.log(' - Name:', user.name);
    console.log(' - Role:', user.role);
    console.log(' - isActive:', user.isActive);

    const password = 'hydra';
    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password "hydra" valid: ${valid}`);

    if (!valid) {
      console.log('Password mismatch detected.');
    }
  } catch (e) {
    console.error('Error verifying user:', e);
  } finally {
    await p.$disconnect();
  }
}

verify();

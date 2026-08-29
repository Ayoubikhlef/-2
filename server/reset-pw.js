const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetPassword() {
  const hash = await bcrypt.hash('Admin@AOS2025!', 12);
  try {
    const result = await prisma.user.update({
      where: { email: 'admin@aos.dz' },
      data: { passwordHash: hash }
    });
    console.log('Password reset for:', result.email);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
resetPassword();

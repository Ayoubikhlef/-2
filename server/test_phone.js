const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$connect().then(() => prisma.user.findUnique({where: {email: 'admin@aos.dz'}}).then(u => {console.log('Phone:', u?.phone); console.log('Email:', u?.email); prisma.$disconnect();}).catch(e => console.error(e)));
import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || '';
const sslUrl = databaseUrl.includes('sslmode')
  ? databaseUrl
  : `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}sslmode=require`;

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: sslUrl,
    },
  },
});

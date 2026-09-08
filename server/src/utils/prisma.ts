import { PrismaClient } from '@prisma/client';

const base = process.env.DATABASE_URL || '';
let url = base;
if (url.startsWith('postgres://')) {
  url = url.replace('postgres://', 'postgresql://');
}
if (!url.includes('sslmode')) {
  url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
}

export const prisma = new PrismaClient({
  log: ['error'],
  datasourceUrl: url,
});

prisma.$connect().catch((e) => {
  console.error('[Prisma] Initial connection failed:', e.message);
});

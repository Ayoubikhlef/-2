import { PrismaClient } from '@prisma/client';

const base = process.env.DATABASE_URL || '';
let url = base;
if (url.startsWith('postgres://')) {
  url = url.replace('postgres://', 'postgresql://');
}
if (!url.includes('sslmode')) {
  url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
}

console.log('[Prisma] DATABASE_URL set:', !!process.env.DATABASE_URL, 'starts with:', process.env.DATABASE_URL?.substring(0, 20));

export const prisma = new PrismaClient({
  log: ['error'],
  datasourceUrl: url,
});

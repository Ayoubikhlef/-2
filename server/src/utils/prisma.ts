import { PrismaClient } from '@prisma/client';

const base = process.env.DATABASE_URL || '';
let url = base;
if (!url.includes('sslmode')) {
  url = url + (url.includes('?') ? '&' : '?') + 'sslmode=require';
}

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasourceUrl: url,
});

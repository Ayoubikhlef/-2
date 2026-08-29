import { PrismaClient } from '@prisma/client';

const base = process.env.DATABASE_URL || '';
const url = base.includes('sslmode') ? base : `${base}${base.includes('?') ? '&' : '?'}sslmode=require`;

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasourceUrl: url,
});

import { PrismaClient } from '@prisma/client';

const datasourceUrl = process.env.DATABASE_URL?.includes('connection_limit')
  ? process.env.DATABASE_URL
  : `${process.env.DATABASE_URL}${process.env.DATABASE_URL?.includes('?') ? '&' : '?'}connection_limit=5&pool_timeout=10`;

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasourceUrl,
});

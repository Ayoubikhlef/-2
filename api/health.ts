import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool, ensureTables } from './lib/db';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  let dbOk = false;
  try {
    await ensureTables();
    const { rows } = await getPool().sql`SELECT 1 AS ok`;
    dbOk = rows[0]?.ok === 1;
  } catch {}

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbOk ? 'connected' : 'not configured (create Postgres in Vercel Dashboard → Storage)',
  });
}

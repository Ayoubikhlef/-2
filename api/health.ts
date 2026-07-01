import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb, ensureTables } from './lib/db';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  let dbOk = false;
  let dbError = '';
  try {
    await ensureTables();
    const result = await getDb()`SELECT 1 AS ok`;
    dbOk = result[0]?.ok === 1;
  } catch (err: any) {
    dbError = err.message;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbOk ? 'connected' : `error: ${dbError}`,
  });
}

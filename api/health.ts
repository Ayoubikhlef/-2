import { query, ensureTables } from './lib/db';

export default async function handler(_req: any, res: any) {
  let dbOk = false;
  let dbError = '';
  try {
    await ensureTables();
    const result = await query(`SELECT 1 AS ok`);
    dbOk = result.rows[0]?.ok === 1;
  } catch (err: any) {
    dbError = err.message;
  }

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbOk ? 'connected' : `error: ${dbError}`,
  });
}

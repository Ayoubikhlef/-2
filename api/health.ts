import { query } from '../shared/db';

export default async function handler(_req: any, res: any) {
  try {
    const result = await query(`SELECT 1 AS ok`);
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: result.rows[0]?.ok === 1 ? 'connected' : 'error' });
  } catch (err: any) {
    res.json({ status: 'error', timestamp: new Date().toISOString(), database: `error: ${err.message}` });
  }
}

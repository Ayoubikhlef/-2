import { query } from './lib/db';

export default async function handler(_req: any, res: any) {
  try {
    const result = await query(`SELECT 1 AS ok`);
    res.json({ ok: true, row: result.rows[0] });
  } catch (err: any) {
    res.json({ ok: false, error: err.message, stack: err.stack?.split('\n').slice(0, 3).join('; ') });
  }
}

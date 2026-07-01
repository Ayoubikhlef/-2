import { Pool } from 'pg';

export default async function handler(_req: any, res: any) {
  try {
    const pool = new Pool({ connectionString: process.env.POSTGRES_URL, max: 1 });
    const client = await pool.connect();
    const result = await client.query('SELECT 1 AS ok');
    client.release();
    await pool.end();
    res.json({ ok: true, row: result.rows[0] });
  } catch (err: any) {
    res.json({ ok: false, error: err.message, stack: err.stack?.split('\n').slice(0, 3).join('; ') });
  }
}

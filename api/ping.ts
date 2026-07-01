import { Pool } from 'pg';

export default async function handler(_req: any, res: any) {
  try {
    const url = process.env.POSTGRES_URL!;
    const pool = new Pool({ connectionString: url, max: 1 });
    const client = await pool.connect();
    const result = await client.query('SELECT 1 AS ok');
    client.release();
    await pool.end();
    res.json({ ok: true, row: result.rows[0] });
  } catch (err: any) {
    res.json({ ok: false, error: err.message, code: err.code });
  }
}

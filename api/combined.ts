import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

export default async function handler(_req: any, res: any) {
  try {
    const pool = new Pool({ connectionString: process.env.POSTGRES_URL, max: 1 });
    const client = await pool.connect();
    const r1 = await client.query('SELECT 1 AS ok');
    client.release();
    await pool.end();

    const hash = await bcrypt.hash('test', 4);

    res.json({ ok: true, pg: r1.rows[0], hash: hash.slice(0, 10) });
  } catch (err: any) {
    res.json({ ok: false, error: err.message });
  }
}

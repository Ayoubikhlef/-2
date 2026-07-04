import { Pool } from 'pg';

let pool: Pool | null = null;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.POSTGRES_URL, max: 3 });
  return pool;
}

async function query(text: string, params?: any[]) {
  const c = await getPool().connect();
  try { return await c.query(text, params); } finally { c.release(); }
}

async function ensureTables() {
  await query(`CREATE TABLE IF NOT EXISTS aos_newsletter (id SERIAL PRIMARY KEY, email TEXT UNIQUE NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW())`);
}

export default async function handler(req: any, res: any) {
  try {
    await ensureTables();

    if (req.method === 'POST') {
      const { email } = req.body || {};
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Invalid email' });
      }
      await query(`INSERT INTO aos_newsletter (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`, [email]);
      return res.json({ ok: true });
    }

    if (req.method === 'GET') {
      const r = await query(`SELECT email, created_at FROM aos_newsletter ORDER BY created_at DESC`);
      return res.json(r.rows);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Newsletter]', err);
    res.status(500).json({ error: err.message });
  }
}

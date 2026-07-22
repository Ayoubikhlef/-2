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
  await query(`CREATE TABLE IF NOT EXISTS aos_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
}

export default async function handler(req: any, res: any) {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const parts = url.pathname.replace(/^\/api\/data\/?/, '').split('/').filter(Boolean);

  try {
    await ensureTables();

    // POST /api/data/save
    if (req.method === 'POST' && parts.length === 1 && parts[0] === 'save') {
      const { key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: 'Missing key' });

      await query(
        `INSERT INTO aos_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, JSON.stringify(value)]
      );
      return res.json({ ok: true, key });
    }

    // GET /api/data/:key
    if (req.method === 'GET' && parts.length === 1) {
      const key = decodeURIComponent(parts[0]);
      const r = await query(`SELECT value FROM aos_settings WHERE key = $1`, [key]);
      if (!r.rows.length) {
        return res.json({ value: null });
      }
      return res.json({ value: JSON.parse(r.rows[0].value) });
    }

    // DELETE /api/data/:key
    if (req.method === 'DELETE' && parts.length === 1) {
      const key = decodeURIComponent(parts[0]);
      const result = await query(`DELETE FROM aos_settings WHERE key = $1 RETURNING key`, [key]);
      if (!result.rows.length) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.json({ deleted: true, key });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Data API]', err);
    res.status(500).json({ error: err.message });
  }
}

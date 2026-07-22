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
  const parts = url.pathname.replace(/^\/api\/products\/?/, '').split('/').filter(Boolean);

  try {
    await ensureTables();

    if (req.method === 'POST' && parts.length === 1 && parts[0] === 'sync') {
      const { products } = req.body || {};
      if (!Array.isArray(products)) return res.status(400).json({ error: 'Invalid products data' });

      await query(
        `INSERT INTO aos_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ['aos_products', JSON.stringify(products)]
      );
      return res.json({ ok: true, indexed: products.length });
    }

    if (req.method === 'GET') {
      const r = await query(`SELECT value FROM aos_settings WHERE key = $1`, ['aos_products']);
      if (!r.rows.length) {
        return res.json({ products: [] });
      }
      return res.json({ products: JSON.parse(r.rows[0].value) });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Products API]', err);
    res.status(500).json({ error: err.message });
  }
}

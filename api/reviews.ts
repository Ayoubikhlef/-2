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
  await query(`CREATE TABLE IF NOT EXISTS aos_reviews (id TEXT PRIMARY KEY, product_id INTEGER NOT NULL, customer TEXT NOT NULL, rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), comment TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT NOW())`);
}

function mapReview(row: any) {
  return {
    id: row.id, productId: row.product_id,
    customer: row.customer, rating: row.rating,
    comment: row.comment || '',
    createdAt: row.created_at?.toISOString?.() ?? row.created_at,
  };
}

export default async function handler(req: any, res: any) {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const parts = url.pathname.replace(/^\/api\/reviews\/?/, '').split('/').filter(Boolean);

  try {
    await ensureTables();

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.productId || !b.customer || !b.rating) return res.status(400).json({ error: 'Missing fields (productId, customer, rating)' });
      if (b.rating < 1 || b.rating > 5) return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      const id = crypto.randomUUID();
      const r = await query(`INSERT INTO aos_reviews (id,product_id,customer,rating,comment) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [id, b.productId, b.customer, b.rating, b.comment || '']);
      return res.status(201).json(mapReview(r.rows[0]));
    }

    if (req.method === 'GET' && parts.length >= 1) {
      const productId = parseInt(parts[0], 10);
      if (isNaN(productId)) return res.status(400).json({ error: 'Invalid productId' });
      const r = await query(`SELECT * FROM aos_reviews WHERE product_id = $1 ORDER BY created_at DESC`, [productId]);
      return res.json(r.rows.map(mapReview));
    }

    if (req.method === 'GET') {
      const r = await query(`SELECT * FROM aos_reviews ORDER BY created_at DESC`);
      return res.json(r.rows.map(mapReview));
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Reviews]', err);
    res.status(500).json({ error: err.message });
  }
}

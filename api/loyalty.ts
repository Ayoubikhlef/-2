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
  await query(`CREATE TABLE IF NOT EXISTS aos_loyalty (customer_phone TEXT PRIMARY KEY, customer_name TEXT NOT NULL, points INTEGER DEFAULT 0, total_spent REAL DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT NOW())`);
}

function mapLoyalty(row: any) {
  return {
    customerPhone: row.customer_phone,
    customerName: row.customer_name,
    points: row.points || 0,
    totalSpent: row.total_spent || 0,
    updatedAt: row.updated_at?.toISOString?.() ?? row.updated_at,
  };
}

export default async function handler(req: any, res: any) {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const parts = url.pathname.replace(/^\/api\/loyalty\/?/, '').split('/').filter(Boolean);

  try {
    await ensureTables();

    if (req.method === 'POST' && parts.length === 1 && parts[0] === 'add') {
      const b = req.body || {};
      if (!b.phone || !b.name || b.amount == null) return res.status(400).json({ error: 'Missing fields (phone, name, amount)' });
      const points = Math.floor(b.amount / 100);
      const existing = await query(`SELECT * FROM aos_loyalty WHERE customer_phone = $1`, [b.phone]);
      let r;
      if (existing.rows.length) {
        r = await query(`UPDATE aos_loyalty SET points = points + $1, total_spent = total_spent + $2, customer_name = $3, updated_at = NOW() WHERE customer_phone = $4 RETURNING *`, [points, b.amount, b.name, b.phone]);
      } else {
        r = await query(`INSERT INTO aos_loyalty (customer_phone, customer_name, points, total_spent) VALUES ($1,$2,$3,$4) RETURNING *`, [b.phone, b.name, points, b.amount]);
      }
      return res.json(mapLoyalty(r.rows[0]));
    }

    if (req.method === 'POST' && parts.length === 1 && parts[0] === 'redeem') {
      const b = req.body || {};
      if (!b.phone || b.points == null) return res.status(400).json({ error: 'Missing fields (phone, points)' });
      if (b.points <= 0) return res.status(400).json({ error: 'Points must be positive' });
      const existing = await query(`SELECT * FROM aos_loyalty WHERE customer_phone = $1`, [b.phone]);
      if (!existing.rows.length) return res.status(404).json({ error: 'Customer not found' });
      const record = existing.rows[0];
      if (record.points < b.points) return res.status(400).json({ error: 'Insufficient points' });
      const discount = b.points;
      await query(`UPDATE aos_loyalty SET points = points - $1, updated_at = NOW() WHERE customer_phone = $2`, [b.points, b.phone]);
      return res.json({ success: true, discount });
    }

    if (req.method === 'GET' && parts.length >= 1) {
      const phone = decodeURIComponent(parts[0]);
      const r = await query(`SELECT * FROM aos_loyalty WHERE customer_phone = $1`, [phone]);
      if (!r.rows.length) return res.json(null);
      return res.json(mapLoyalty(r.rows[0]));
    }

    if (req.method === 'GET') {
      const r = await query(`SELECT * FROM aos_loyalty ORDER BY updated_at DESC`);
      return res.json(r.rows.map(mapLoyalty));
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Loyalty]', err);
    res.status(500).json({ error: err.message });
  }
}

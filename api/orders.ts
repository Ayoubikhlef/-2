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
  await query(`CREATE TABLE IF NOT EXISTS aos_orders (
    id TEXT PRIMARY KEY, 
    customer TEXT NOT NULL, 
    phone TEXT NOT NULL, 
    email TEXT DEFAULT '', 
    wilaya TEXT DEFAULT '', 
    municipality TEXT DEFAULT '', 
    address TEXT DEFAULT '', 
    note TEXT DEFAULT '', 
    items JSONB DEFAULT '[]', 
    total REAL DEFAULT 0, 
    source TEXT DEFAULT 'form', 
    status TEXT DEFAULT 'new', 
    payment_method TEXT DEFAULT 'cod',
    payment_id TEXT DEFAULT '',
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(), 
    updated_at TIMESTAMPTZ DEFAULT NOW()
  )`);
  await query(`ALTER TABLE aos_orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cod'`);
  await query(`ALTER TABLE aos_orders ADD COLUMN IF NOT EXISTS payment_id TEXT DEFAULT ''`);
  await query(`ALTER TABLE aos_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ`);
}

function mapOrder(row: any) {
  return {
    id: row.id, createdAt: row.created_at?.toISOString?.() ?? row.created_at,
    customer: row.customer, phone: row.phone, email: row.email || '',
    wilaya: row.wilaya || '', municipality: row.municipality || '', address: row.address || '',
    note: row.note || '', items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    total: row.total || 0, source: row.source || 'form', status: row.status || 'new',
    paymentMethod: row.payment_method || 'cod', paymentId: row.payment_id || '', paidAt: row.paid_at || null
  };
}

export default async function handler(req: any, res: any) {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const parts = url.pathname.replace(/^\/api\/orders\/?/, '').split('/').filter(Boolean);

  try {
    await ensureTables();

    if (req.method === 'PATCH' && parts.length === 2 && parts[1] === 'status') {
      const result = await query(`UPDATE aos_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [req.body.status, parts[0]]);
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      return res.json(mapOrder(result.rows[0]));
    }

    if (req.method === 'DELETE' && parts.length === 1) {
      const result = await query(`DELETE FROM aos_orders WHERE id = $1 RETURNING id`, [parts[0]]);
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      return res.json({ deleted: true, id: parts[0] });
    }

    if (req.method === 'POST' && parts.length === 1 && parts[0] === 'delete') {
      const id = req.body?.id;
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const result = await query(`DELETE FROM aos_orders WHERE id = $1 RETURNING id`, [id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      return res.json({ deleted: true, id });
    }

    if (req.method === 'POST' && parts.length === 2 && parts[1] === 'delete') {
      const result = await query(`DELETE FROM aos_orders WHERE id = $1 RETURNING id`, [parts[0]]);
      if (!result.rows.length) return res.status(404).json({ error: 'Not found' });
      return res.json({ deleted: true, id: parts[0] });
    }

    if (req.method === 'POST' && parts.length === 1 && parts[0] === 'clear-all') {
      const result = await query(`DELETE FROM aos_orders RETURNING id`);
      return res.json({ deleted: true, count: result.rows.length });
    }

    if (req.method === 'POST') {
      const b = req.body || {};
      if (!b.customer || !b.phone) return res.status(400).json({ error: 'Missing fields' });
      const id = b.id || crypto.randomUUID();
      const r = await query(`INSERT INTO aos_orders (id,customer,phone,email,wilaya,municipality,address,note,items,total,source,payment_method) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [id, b.customer, b.phone, b.email||'', b.wilaya||'', b.municipality||'', b.address||'', b.note||'', JSON.stringify(b.items||[]), b.total||0, b.source||'form', b.paymentMethod||'cod']);
      return res.status(201).json(mapOrder(r.rows[0]));
    }

    if (req.method === 'GET') {
      const r = await query(`SELECT * FROM aos_orders ORDER BY created_at DESC`);
      return res.json(r.rows.map(mapOrder));
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('[Orders]', err);
    res.status(500).json({ error: err.message });
  }
}

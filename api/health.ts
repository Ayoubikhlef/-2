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

export default async function handler(_req: any, res: any) {
  try {
    await query(`CREATE TABLE IF NOT EXISTS aos_orders (id TEXT PRIMARY KEY, customer TEXT NOT NULL, phone TEXT NOT NULL, email TEXT DEFAULT '', wilaya TEXT DEFAULT '', municipality TEXT DEFAULT '', address TEXT DEFAULT '', note TEXT DEFAULT '', items JSONB DEFAULT '[]', total REAL DEFAULT 0, source TEXT DEFAULT 'form', status TEXT DEFAULT 'new', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`);
    await query(`CREATE TABLE IF NOT EXISTS aos_users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL, phone TEXT DEFAULT '', role TEXT DEFAULT 'CUSTOMER', created_at TIMESTAMPTZ DEFAULT NOW())`);
    const r = await query(`SELECT 1 AS ok`);
    res.json({ status: 'ok', database: 'connected' });
  } catch (err: any) {
    res.json({ status: 'error', database: err.message });
  }
}

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) throw new Error('Database not configured');
    pool = new Pool({ connectionString: url, max: 5 });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function ensureTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS aos_orders (
      id TEXT PRIMARY KEY,
      customer TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL DEFAULT '',
      wilaya TEXT NOT NULL DEFAULT '',
      municipality TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      items JSONB NOT NULL DEFAULT '[]',
      total REAL NOT NULL DEFAULT 0,
      source TEXT NOT NULL DEFAULT 'form',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS aos_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  const existing = await query(`SELECT id FROM aos_users WHERE email = $1`, ['admin@aos.dz']);
  if (existing.rows.length === 0) {
    const hash = await bcrypt.hash('admin123', 10);
    await query(
      `INSERT INTO aos_users (id, email, password_hash, name, role) VALUES ($1, $2, $3, $4, $5)`,
      [crypto.randomUUID(), 'admin@aos.dz', hash, 'Admin AOS', 'SUPER_ADMIN']
    );
  }
}

export function mapOrder(row: any) {
  return {
    id: row.id,
    createdAt: typeof row.created_at === 'object' ? row.created_at.toISOString() : row.created_at,
    customer: row.customer,
    phone: row.phone,
    email: row.email || '',
    wilaya: row.wilaya || '',
    municipality: row.municipality || '',
    address: row.address || '',
    note: row.note || '',
    items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
    total: row.total || 0,
    source: row.source || 'form',
    status: row.status || 'new',
  };
}

import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

let sql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (!sql) {
    const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    if (!url) throw new Error('Database not configured');
    sql = neon(url);
  }
  return sql;
}

export async function ensureTables() {
  const db = getSql();
  await db`
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
  `;
  await db`
    CREATE TABLE IF NOT EXISTS aos_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'CUSTOMER',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  const existing: any = await db`SELECT id FROM aos_users WHERE email = ${'admin@aos.dz'}`;
  if (!existing.length) {
    const hash = await bcrypt.hash('admin123', 10);
    await db`
      INSERT INTO aos_users (id, email, password_hash, name, role)
      VALUES (${crypto.randomUUID()}, ${'admin@aos.dz'}, ${hash}, ${'Admin AOS'}, ${'SUPER_ADMIN'})
    `;
  }
}

export function getDb() {
  return getSql();
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

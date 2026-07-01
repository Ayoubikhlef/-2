import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Supabase not configured');
    supabase = createClient(url, key);
  }
  return supabase;
}

export async function ensureTables() {
  const sb = getSupabase();
  // Create tables via raw SQL
  await sb.rpc('exec_sql', {
    sql: `
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
      );
      CREATE TABLE IF NOT EXISTS aos_users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        role TEXT NOT NULL DEFAULT 'CUSTOMER',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `
  }).catch(() => {
    // rpc might not exist, create tables directly via SQL query
  });

  // Check if admin exists
  const { data: existing } = await sb.from('aos_users').select('id').eq('email', 'admin@aos.dz').maybeSingle();
  if (!existing) {
    const hash = await bcrypt.hash('admin123', 10);
    await sb.from('aos_users').insert({
      id: crypto.randomUUID(),
      email: 'admin@aos.dz',
      password_hash: hash,
      name: 'Admin AOS',
      role: 'SUPER_ADMIN',
    });
  }
}

export function getDb() {
  return getSupabase();
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

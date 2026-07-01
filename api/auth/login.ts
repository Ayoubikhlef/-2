import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'aos-jwt-secret-change-in-production';
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
  await query(`CREATE TABLE IF NOT EXISTS aos_users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL, phone TEXT DEFAULT '', role TEXT DEFAULT 'CUSTOMER', created_at TIMESTAMPTZ DEFAULT NOW())`);
  const r = await query(`SELECT id FROM aos_users WHERE email = $1`, ['admin@aos.dz']);
  if (!r.rows.length) {
    const hash = await bcrypt.hash('admin123', 10);
    await query(`INSERT INTO aos_users (id,email,password_hash,name,role) VALUES ($1,$2,$3,$4,$5)`,
      [crypto.randomUUID(), 'admin@aos.dz', hash, 'Admin AOS', 'SUPER_ADMIN']);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    await ensureTables();
    const r = await query(`SELECT * FROM aos_users WHERE email = $1`, [email]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = r.rows[0];
    if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' as any });
    res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone || '' }, accessToken });
  } catch (err: any) {
    console.error('[Login]', err);
    res.status(500).json({ error: err.message });
  }
}

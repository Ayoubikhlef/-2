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

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name, phone } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, name required' });

  try {
    const existing = await query(`SELECT id FROM aos_users WHERE email = $1`, [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    await query(`INSERT INTO aos_users (id,email,password_hash,name,phone,role) VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, email, hash, name, phone || '', 'CUSTOMER']);

    const accessToken = jwt.sign({ userId: id, role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '15m' as any });
    res.status(201).json({ user: { id, email, name, role: 'CUSTOMER', phone: phone || '' }, accessToken });
  } catch (err: any) {
    console.error('[Register]', err);
    res.status(500).json({ error: err.message });
  }
}

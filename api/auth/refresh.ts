import { Pool } from 'pg';
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

  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET, { ignoreExpiration: true }) as { userId: string; role: string };
    const r = await query(`SELECT id, email, name, role, phone FROM aos_users WHERE id = $1`, [payload.userId]);
    if (!r.rows.length) return res.status(404).json({ error: 'User not found' });

    const user = r.rows[0];
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' as any });
    res.json({ user, accessToken });
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { query, ensureTables } from '../../shared/db';

const JWT_SECRET = process.env.JWT_SECRET || 'aos-jwt-secret-change-in-production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string; role: string };
    await ensureTables();
    const result = await query(`SELECT id, email, name, role, phone FROM aos_users WHERE id = $1`, [payload.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

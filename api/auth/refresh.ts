import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { getDb, ensureTables } from '../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'aos-jwt-secret-change-in-production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: string; role: string };
    await ensureTables();
    const db = getDb();
    const users: any = await db`SELECT id, email, name, role, phone FROM aos_users WHERE id = ${payload.userId}`;
    if (users.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = users[0];
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' as any });

    res.json({ user, accessToken });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

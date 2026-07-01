import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, ensureTables } from '../lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'aos-jwt-secret-change-in-production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name, phone } = req.body || {};
  if (!email || !password || !name) return res.status(400).json({ error: 'Email, password, and name required' });

  try {
    await ensureTables();
    const db = getDb();

    const existing: any[] = await db`SELECT id FROM aos_users WHERE email = ${email}`;
    if (existing.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();
    await db`
      INSERT INTO aos_users (id, email, password_hash, name, phone, role)
      VALUES (${id}, ${email}, ${hash}, ${name}, ${phone || ''}, ${'CUSTOMER'})
    `;

    const accessToken = jwt.sign({ userId: id, role: 'CUSTOMER' }, JWT_SECRET, { expiresIn: '15m' as any });

    res.status(201).json({
      user: { id, email, name, role: 'CUSTOMER', phone: phone || '' },
      accessToken,
    });
  } catch (err: any) {
    console.error('[Register]', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, ensureTables } from '../../shared/db';

const JWT_SECRET = process.env.JWT_SECRET || 'aos-jwt-secret-change-in-production';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    await ensureTables();

    const result = await query(`SELECT * FROM aos_users WHERE email = $1`, [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const payload = { userId: user.id, role: user.role };
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' as any });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone || '' },
      accessToken,
    });
  } catch (err: any) {
    console.error('[Login]', err);
    res.status(500).json({ error: err.message || 'Internal error' });
  }
}

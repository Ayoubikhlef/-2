import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { BadRequest, Conflict, Unauthorized } from '../utils/errors';
import { requireAuth, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const gateSchema = z.object({
  code: z.string().min(1),
});

authRouter.post('/admin-gate', async (req, res: Response) => {
  try {
    const { code } = gateSchema.parse(req.body);
    const expected = process.env.ADMIN_GATE_CODE || '';
    if (!expected) {
      return res.status(503).json({ error: 'Gate not configured' });
    }
    if (code !== expected) {
      return res.status(401).json({ error: 'Invalid gate code' });
    }
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Auth] Gate error:', err);
    res.status(500).json({ error: 'Gate check failed' });
  }
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/register', async (req, res: Response) => {
  const { email, password, name, phone } = registerSchema.parse(req.body);

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) throw new Conflict('Email already registered');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, phone },
  });

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
  });
});

authRouter.post('/login', async (req, res: Response) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new BadRequest('Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new BadRequest('Invalid email or password');

  if (!user.isActive) throw new Unauthorized('Account is deactivated');

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
  });
});

const forgotSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().min(4).max(8),
  password: z.string().min(8),
});

const resetCodes = new Map<string, { code: string; expiresAt: number }>();

function sendSmsNotification(phone: string, message: string) {
  const phoneClean = phone.replace(/[^0-9]/g, '');
  const country = phoneClean.startsWith('213') ? phoneClean : `213${phoneClean.replace(/^0/, '')}`;
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const fetchPromise = webhookUrl
    ? fetch(webhookUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: country,
          type: 'text',
          text: { body: message },
        }),
      })
    : Promise.resolve();
  fetchPromise.catch(err => console.error('[Auth] WhatsApp reset code error:', err));
}

authRouter.post('/forgot-password', async (req, res: Response) => {
  try {
    const { email } = forgotSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email' });
    }

    const code = String(crypto.randomInt(100000, 999999));
    resetCodes.set(email.toLowerCase(), { code, expiresAt: Date.now() + 10 * 60 * 1000 });

    if (user.phone) {
      const message = `رمز استرجاع كلمة المرور: ${code} (صالح 10 دقائق)`;
      sendSmsNotification(user.phone, message);
    }

    console.log(`[Auth] Reset code generated for ${email.slice(0, 3)}*** (${user.phone ? 'sent via WhatsApp' : 'no phone on file'})`);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Auth] Forgot password error:', err);
    res.status(500).json({ error: 'Failed to send reset code' });
  }
});

authRouter.post('/reset-password', async (req, res: Response) => {
  try {
    const { email, code, password } = resetSchema.parse(req.body);
    const key = email.toLowerCase();
    const entry = resetCodes.get(key);

    if (!entry || entry.expiresAt < Date.now()) {
      resetCodes.delete(key);
      return res.status(400).json({ error: 'Code expired. Request a new one.' });
    }
    if (entry.code !== code) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'No account found with this email' });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, refreshToken: null } });

    resetCodes.delete(key);
    res.clearCookie('refreshToken');
    console.log(`[Auth] Password reset for ${email.slice(0, 3)}***`);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Auth] Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

const adminResetSchema = z.object({
  code: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

authRouter.post('/admin-reset-password', async (req, res: Response) => {
  try {
    const { code, email, password } = adminResetSchema.parse(req.body);
    const expected = process.env.ADMIN_GATE_CODE || '';
    if (!expected || code !== expected) {
      return res.status(401).json({ error: 'Invalid gate code' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash, refreshToken: null } });
    res.clearCookie('refreshToken');
    console.log(`[Auth] Admin reset password for ${email.slice(0, 3)}***`);
    res.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Auth] Admin reset error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

authRouter.post('/refresh', async (req, res: Response) => {
  const token = req.cookies?.refreshToken;
  if (!token) throw new Unauthorized('No refresh token');

  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw new Unauthorized('Invalid refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.refreshToken !== token || !user.isActive) {
    throw new Unauthorized('Invalid refresh token');
  }

  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id });

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
  });
});

authRouter.post('/logout', requireAuth, async (req: AuthRequest, res: Response) => {
  await prisma.user.update({
    where: { id: req.userId },
    data: { refreshToken: null },
  });

  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
});

authRouter.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { addresses: true },
  });
  if (!user) throw new Unauthorized('User not found');

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    addresses: user.addresses,
  });
});

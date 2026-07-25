import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';

export const newsletterRouter = Router();

const subscribeSchema = z.object({
  email: z.string().email(),
});

prisma.$executeRaw`CREATE TABLE IF NOT EXISTS aos_newsletter (email TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW())`.catch(() => {});

newsletterRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { email } = subscribeSchema.parse(req.body);
    await prisma.$executeRaw`INSERT INTO aos_newsletter (email) VALUES (${email}) ON CONFLICT (email) DO NOTHING`;
    console.log(`[Newsletter] Subscribed ${email.slice(0, 3)}***@${email.split('@')[1] || '***'}`);
    res.status(201).json({ subscribed: true, email });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Newsletter] Subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

newsletterRouter.get('/', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const subscribers = await prisma.$queryRaw`SELECT * FROM aos_newsletter ORDER BY created_at DESC`;
    console.log(`[Newsletter] Fetched subscribers`);
    res.json(subscribers);
  } catch (err) {
    console.error('[Newsletter] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

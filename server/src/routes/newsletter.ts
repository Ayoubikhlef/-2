import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';

export const newsletterRouter = Router();

const subscribeSchema = z.object({
  email: z.string().email().max(254, 'Email is too long'),
});

newsletterRouter.delete('/:email', async (req: Request, res: Response) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase().trim();
    if (!email || email.length > 254 || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    const result = await prisma.newsletterSubscriber.deleteMany({ where: { email } });
    console.log(`[Newsletter] Unsubscribed ${email.slice(0, 3)}***@${email.split('@')[1] || '***'} (removed ${result.count})`);
    res.json({ unsubscribed: true, email });
  } catch (err) {
    console.error('[Newsletter] Unsubscribe error:', err);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

newsletterRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { email } = subscribeSchema.parse(req.body);
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });
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
    const subscribers = await prisma.newsletterSubscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log(`[Newsletter] Fetched ${subscribers.length} subscribers`);
    res.json(subscribers);
  } catch (err) {
    console.error('[Newsletter] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

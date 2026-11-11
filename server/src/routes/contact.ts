import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { sendContactTelegramAlert } from '../services/telegram';

export const contactRouter = Router();

const SUBJECTS = ['general', 'order', 'product', 'repair', 'web', 'other'] as const;

const createSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(6).max(24),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  subject: z.enum(SUBJECTS).optional(),
  message: z.string().trim().min(10).max(2000),
  language: z.enum(['ar', 'fr', 'en']).optional(),
  // Honeypot. Real users never see or fill this field.
  website: z.string().max(200).optional(),
});

const statusSchema = z.object({
  status: z.enum(['new', 'read', 'replied']),
});

contactRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = createSchema.parse(req.body);

    // Bots that fill the hidden field get a normal-looking response and are
    // dropped silently, so they do not retry with a different strategy.
    if (data.website && data.website.trim()) {
      return res.status(201).json({ id: 'ok', received: true });
    }

    // A double click or a retry after a timeout must not create two messages.
    const recent = await prisma.contactMessage.findFirst({
      where: {
        phone: data.phone,
        message: data.message,
        createdAt: { gte: new Date(Date.now() - 2 * 60 * 1000) },
      },
      select: { id: true },
      orderBy: { createdAt: 'desc' },
    });
    if (recent) {
      return res.status(200).json({ id: recent.id, duplicate: true });
    }

    const created = await prisma.contactMessage.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        subject: data.subject || 'general',
        message: data.message,
        language: data.language || null,
      },
    });

    console.log(`[Contact] New message ${created.id} from ${data.name}`);
    sendContactTelegramAlert(created);

    res.status(201).json({ id: created.id, received: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Contact] Create error:', err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

contactRouter.get('/', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const messages = await prisma.contactMessage.findMany({
      where: status && ['new', 'read', 'replied'].includes(status) ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    res.json({ messages, unread: messages.filter((message) => message.status === 'new').length });
  } catch (err) {
    console.error('[Contact] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

contactRouter.patch('/:id', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = statusSchema.parse(req.body);
    const updated = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Contact] Update error:', err);
    res.status(500).json({ error: 'Failed to update message' });
  }
});

contactRouter.delete('/:id', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.contactMessage.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (err) {
    console.error('[Contact] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

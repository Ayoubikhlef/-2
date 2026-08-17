import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { getCached, setCache, clearCache } from '../utils/cache';

export const maintenanceRouter = Router();

const MAINTENANCE_KEY = 'aos_maintenance';

const messageSchema = z.object({
  ar: z.string().max(500).default(''),
  fr: z.string().max(500).default(''),
  en: z.string().max(500).default(''),
});

const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: messageSchema,
});

maintenanceRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const cacheKey = `maintenance:flag`;
    const cached = getCached<{ value: unknown }>(cacheKey);
    if (cached) return res.json(cached);

    const setting = await prisma.setting.findUnique({ where: { key: MAINTENANCE_KEY } });
    const data = setting ? { value: JSON.parse(setting.value) } : { value: null };
    setCache(cacheKey, data, 10_000);
    res.json(data);
  } catch (err) {
    console.error('[Maintenance] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch maintenance' });
  }
});

maintenanceRouter.post('/', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const body = maintenanceSchema.parse(req.body);
    const value = { enabled: body.enabled, message: body.message };
    await prisma.setting.upsert({
      where: { key: MAINTENANCE_KEY },
      update: { value: JSON.stringify(value) },
      create: { key: MAINTENANCE_KEY, value: JSON.stringify(value) },
    });
    clearCache('maintenance:flag');
    console.log(`[Maintenance] Set enabled=${body.enabled}`);
    res.json({ ok: true, enabled: body.enabled });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Maintenance] Save error:', err);
    res.status(500).json({ error: 'Failed to save maintenance' });
  }
});
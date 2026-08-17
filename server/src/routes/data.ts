import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { getCached, setCache, clearCache } from '../utils/cache';

export const dataRouter = Router();

const ALLOWED_KEYS = new Set([
  'aos_products',
  'aos_services',
  'aos_coupons',
  'aos_site_settings',
  'aos_site_content',
]);

const saveSchema = z.object({
  key: z.string().min(1).max(64),
  value: z.any(),
});

dataRouter.post('/save', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { key, value } = saveSchema.parse(req.body);
    if (!ALLOWED_KEYS.has(key)) {
      return res.status(400).json({ error: 'Unknown data key' });
    }
    const serialized = JSON.stringify(value);
    if (serialized.length > 5_000_000) {
      return res.status(413).json({ error: 'Value too large (max 5MB)' });
    }
    clearCache(`data:${key}`);
    clearCache(`data:all`);
    await prisma.setting.upsert({
      where: { key },
      update: { value: serialized },
      create: { key, value: serialized },
    });
    console.log(`[Data] Saved ${key} (${serialized.length} bytes)`);
    res.json({ ok: true, key });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Data] Save error:', err);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

dataRouter.get('/:key', async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    if (!ALLOWED_KEYS.has(key)) {
      return res.status(400).json({ error: 'Unknown data key' });
    }
    const cacheKey = `data:${key}`;
    const cached = getCached<{ value: any }>(cacheKey);
    if (cached) return res.json(cached);

    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) {
      return res.json({ value: null });
    }
    const data = { value: JSON.parse(setting.value) };
    setCache(cacheKey, data, 30_000);
    res.json(data);
  } catch (err) {
    console.error('[Data] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

dataRouter.delete('/:key', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    await prisma.setting.delete({ where: { key } });
    console.log(`[Data] Deleted ${key}`);
    res.json({ deleted: true, key });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error('[Data] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete data' });
  }
});

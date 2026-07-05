import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

export const dataRouter = Router();

const saveSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
});

dataRouter.post('/save', async (req: Request, res: Response) => {
  try {
    const { key, value } = saveSchema.parse(req.body);
    await prisma.setting.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) },
    });
    console.log(`[Data] Saved ${key}`);
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
    const setting = await prisma.setting.findUnique({ where: { key } });
    if (!setting) {
      return res.json({ value: null });
    }
    res.json({ value: JSON.parse(setting.value) });
  } catch (err) {
    console.error('[Data] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

dataRouter.delete('/:key', async (req: Request, res: Response) => {
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

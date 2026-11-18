import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, type AuthRequest } from '../middleware/auth';

export const calculatorRouter = Router();

const MAX_SAVED = 20;

function view(row: any) {
  return {
    id: row.id,
    calc: row.calc,
    label: row.label,
    values: row.values as Record<string, string>,
    createdAt: row.createdAt,
  };
}

calculatorRouter.get('/results', requireAuth, async (req: AuthRequest, res: Response) => {
  const results = await prisma.savedCalculation.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: MAX_SAVED,
  });
  res.json({ results: results.map(view), limit: MAX_SAVED });
});

calculatorRouter.post('/results', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = z
    .object({
      calc: z.string().min(1).max(40),
      label: z.string().max(120).optional(),
      values: z.record(z.string(), z.string().max(120)),
      createdAt: z.number().optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid calculation',
      code: 'invalid_calculation',
      details: parsed.error.issues,
    });
  }

  const result = await prisma.savedCalculation.create({
    data: {
      userId: req.userId!,
      calc: parsed.data.calc,
      label: parsed.data.label || null,
      values: parsed.data.values,
    },
  });

  // Keep the newest 20 only: delete the extra rows the insert pushed out.
  const extra = await prisma.savedCalculation.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    skip: MAX_SAVED,
    select: { id: true },
  });
  if (extra.length > 0) {
    await prisma.savedCalculation.deleteMany({ where: { id: { in: extra.map((row) => row.id) } } });
  }

  res.status(201).json({ result: view(result) });
});

calculatorRouter.delete('/results/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const result = await prisma.savedCalculation.findFirst({
    where: { id: req.params.id, userId: req.userId },
  });
  if (!result) return res.status(404).json({ error: 'Result not found', code: 'not_found' });
  await prisma.savedCalculation.delete({ where: { id: result.id } });
  res.json({ ok: true });
});

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';

export const paymentRouter = Router();

const initSchema = z.object({
  orderId: z.string(),
  method: z.enum(['cib', 'edahabia', 'baridimob', 'cod']),
  phone: z.string().optional(),
});

paymentRouter.post('/init', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { orderId, method } = initSchema.parse(req.body);
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!['new', 'pending', 'NEW'].includes(order.status)) return res.status(400).json({ error: 'Order already processed' });

    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'processing', paymentMethod: method, paymentStatus: paymentId },
    });

    console.log(`[Payment] Initiated ${method.toUpperCase()} for order ${orderId}: ${order.total} DZD`);

    res.json({
      success: true,
      paymentId,
      amount: order.total,
      method,
      instructions: getInstructions(method),
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Invalid data', details: err.errors });
    console.error('[Payment] Init error:', err);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

paymentRouter.post('/confirm', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = z.object({ paymentId: z.string() }).parse(req.body);
    const order = await prisma.order.findFirst({ where: { paymentStatus: paymentId } });
    if (!order) return res.status(404).json({ error: 'Payment not found' });

    await prisma.order.update({
      where: { id: order.id },
      data: { status: 'completed', paymentStatus: 'paid' },
    });
    console.log(`[Payment] Confirmed ${paymentId}`);
    res.json({ success: true, status: 'paid' });
  } catch {
    res.status(500).json({ error: 'Confirmation failed' });
  }
});

function getInstructions(method: string): string {
  switch (method) {
    case 'cib':
      return 'Pay by CIB card via the secure payment gateway. You will be redirected after confirmation.';
    case 'edahabia':
      return 'Pay with Edahabia card. You will be redirected to the CIP portal.';
    case 'baridimob':
      return 'Pay with BaridiMob mobile wallet. You will receive an SMS to confirm.';
    case 'cod':
      return 'Cash on delivery. Pay when you receive your order.';
    default:
      return '';
  }
}

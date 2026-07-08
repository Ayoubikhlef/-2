import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

export const paymentRouter = Router();

const initSchema = z.object({
  orderId: z.string(),
  method: z.enum(['cib', 'edahabia', 'baridimob', 'cod']),
  phone: z.string().optional(),
});

paymentRouter.post('/init', async (req: Request, res: Response) => {
  try {
    const { orderId, method, phone } = initSchema.parse(req.body);
    const order = await prisma.$queryRaw<{ id: string; total: number; status: string; wilaya: string }[]>`SELECT id, total, status, wilaya FROM aos_orders WHERE id = ${orderId}`;
    if (!order.length) return res.status(404).json({ error: 'Order not found' });
    if (order[0].status !== 'pending') return res.status(400).json({ error: 'Order already processed' });

    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    await prisma.$executeRaw`UPDATE aos_orders SET status = 'processing', payment_method = ${method}, payment_id = ${paymentId} WHERE id = ${orderId}`;

    console.log(`[Payment] Initiated ${method.toUpperCase()} for order ${orderId}: ${order[0].total} DZD`);

    res.json({
      success: true,
      paymentId,
      amount: order[0].total,
      method,
      instructions: getInstructions(method),
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Invalid data', details: err.errors });
    console.error('[Payment] Init error:', err);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

paymentRouter.post('/confirm', async (req: Request, res: Response) => {
  try {
    const { paymentId } = z.object({ paymentId: z.string() }).parse(req.body);
    const order = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM aos_orders WHERE payment_id = ${paymentId}`;
    if (!order.length) return res.status(404).json({ error: 'Payment not found' });

    await prisma.$executeRaw`UPDATE aos_orders SET status = 'paid', paid_at = NOW() WHERE payment_id = ${paymentId}`;
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

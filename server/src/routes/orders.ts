import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendWhatsAppNotification } from '../services/whatsapp';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';

export const orderRouter = Router();

const orderItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

const createOrderSchema = z.object({
  customer: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().optional(),
  wilaya: z.string(),
  municipality: z.string(),
  address: z.string(),
  note: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
  total: z.number().nonnegative(),
  source: z.enum(['form', 'quick-order', 'service-booking']),
  discountCode: z.string().optional(),
});

orderRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);

    let finalTotal = data.items.reduce((sum, item) => sum + item.total, 0);
    let discountAmount = 0;
    let appliedCode: string | undefined;

    if (data.discountCode) {
      const setting = await prisma.setting.findUnique({ where: { key: 'aos_coupons' } });
      if (setting) {
        const coupons = JSON.parse(setting.value);
        const coupon = Array.isArray(coupons) ? coupons.find(
          (c: any) => c.code?.toLowerCase() === data.discountCode?.toLowerCase() && c.active
        ) : null;
        if (!coupon) {
          return res.status(400).json({ error: 'Invalid or inactive coupon code' });
        }
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
          return res.status(400).json({ error: 'Coupon has expired' });
        }
        if (coupon.minOrder > 0 && finalTotal < coupon.minOrder) {
          return res.status(400).json({ error: `Minimum order amount is ${coupon.minOrder}` });
        }
        discountAmount = coupon.type === 'percentage'
          ? Math.round(finalTotal * (coupon.value / 100))
          : Math.min(coupon.value, finalTotal);
        finalTotal -= discountAmount;
        appliedCode = coupon.code;
      }
    }

    const order = await prisma.order.create({
      data: {
        customer: data.customer,
        phone: data.phone,
        email: data.email || '',
        wilaya: data.wilaya,
        municipality: data.municipality,
        address: data.address,
        note: data.note || '',
        total: finalTotal,
        status: 'new',
        source: data.source,
        paymentMethod: appliedCode ? ('discount:' + appliedCode) : undefined,
        items: {
          create: data.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        },
      },
      include: { items: true },
    });

    console.log(`[Orders] Created order ${order.id} (${order.total} DZD)`);
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Orders] Create error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

orderRouter.get('/track/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error('[Orders] Track error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

orderRouter.get('/', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`[Orders] Fetched ${orders.length} orders`);
    res.json(orders);
  } catch (err) {
    console.error('[Orders] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

orderRouter.patch('/:id/status', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['new', 'processing', 'completed', 'cancelled']) }).parse(req.body);

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });

    sendWhatsAppNotification(updated.phone, updated.customer, id, status, updated.total);
    console.log(`[Orders] Updated order ${id} status to ${status}`);
    res.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Orders] Status update error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

orderRouter.post('/delete', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = z.object({ id: z.string().min(1) }).parse(req.body);
    await prisma.order.delete({ where: { id } });
    console.log(`[Orders] Deleted order ${id}`);
    res.json({ deleted: true, id });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error('[Orders] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

orderRouter.post('/clear-all', requireAuth, requireRole('SUPER_ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({ select: { id: true } });
    const ids = orders.map(o => o.id);
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    console.log(`[Orders] Cleared all ${ids.length} orders`);
    res.json({ deleted: true, count: ids.length, ids });
  } catch (err) {
    console.error('[Orders] Clear all error:', err);
    res.status(500).json({ error: 'Failed to clear orders' });
  }
});

orderRouter.delete('/:id', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.order.delete({ where: { id } });
    console.log(`[Orders] Deleted order ${id}`);
    res.json({ deleted: true, id });
  } catch (err: any) {
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error('[Orders] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

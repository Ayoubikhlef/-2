import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

export const orderRouter = Router();

const orderItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().nonnegative(),
  total: z.number().nonnegative(),
});

const createOrderSchema = z.object({
  id: z.string().optional(),
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
});

orderRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);

    const order = await prisma.order.create({
      data: {
        ...(data.id ? { id: data.id } : {}),
        customer: data.customer,
        phone: data.phone,
        email: data.email || '',
        wilaya: data.wilaya,
        municipality: data.municipality,
        address: data.address,
        note: data.note || '',
        total: data.total,
        status: 'new',
        source: data.source,
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

    console.log(`[Orders] Created order ${order.id} for ${order.customer} (${order.total} DZD)`);
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Orders] Create error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

orderRouter.get('/', async (_req: Request, res: Response) => {
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

orderRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = z.object({ status: z.enum(['new', 'processing', 'completed', 'cancelled']) }).parse(req.body);

    const updated = await prisma.order.update({
      where: { id },
      data: { status },
    });

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

orderRouter.post('/delete', async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: 'Missing id' });
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

orderRouter.delete('/:id', async (req: Request, res: Response) => {
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

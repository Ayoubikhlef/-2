import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { sendWhatsAppNotification, sendNewOrderAlert } from '../services/whatsapp';
import { sendNewOrderTelegramAlert, sendNewOrderDiscordAlert } from '../services/telegram';
import { emitNewOrder } from '../services/live';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { getCached, setCache, clearCache } from '../utils/cache';

export const orderRouter = Router();

const orderItemSchema = z.object({
  name: z.string(),
  quantity: z.number().int().positive().max(10000),
  price: z.number().nonnegative(),
  total: z.number().nonnegative(),
  productId: z.number().optional(),
});

const createOrderSchema = z.object({
  customer: z.string().min(1).max(200),
  phone: z.string().min(1).max(20),
  email: z.string().email().optional(),
  wilaya: z.string().min(1),
  municipality: z.string().min(1),
  address: z.string().min(1).max(500),
  note: z.string().max(500).optional(),
  items: z.array(orderItemSchema).min(1).max(50),
  total: z.number().nonnegative().max(10000000),
  source: z.enum(['form', 'quick-order', 'service-booking']),
  discountCode: z.string().max(50).optional(),
});

orderRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);

    const setting = await prisma.setting.findUnique({ where: { key: 'aos_products' } });
    const products: any[] = setting ? JSON.parse(setting.value) : [];

    let serverTotal = 0;
    const validatedItems: { name: string; quantity: number; price: number; total: number; productId?: number }[] = [];

    for (const item of data.items) {
      const product = item.productId
        ? products.find((p: any) => p.id === item.productId)
        : products.find((p: any) => p.nameAr === item.name || p.nameFr === item.name || p.nameEn === item.name);

      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.name}` });
      }

      const stock = product.stock ?? 0;
      if (stock <= 0) {
        return res.status(400).json({ error: `Out of stock: ${product.nameAr || item.name}` });
      }
      if (item.quantity > stock) {
        return res.status(400).json({ error: `Insufficient stock for ${product.nameAr || item.name}: requested ${item.quantity}, available ${stock}` });
      }

      const serverPrice = product.salePrice && product.saleEnd && new Date(product.saleEnd) > new Date()
        ? product.salePrice
        : product.price;

      const itemTotal = Math.round(serverPrice * item.quantity);
      serverTotal += itemTotal;

      validatedItems.push({
        name: product.nameAr || item.name,
        quantity: item.quantity,
        price: serverPrice,
        total: itemTotal,
        productId: product.id,
      });
    }

    let finalTotal = serverTotal;
    let discountAmount = 0;
    let appliedCode: string | undefined;

    if (data.discountCode) {
      const couponSetting = await prisma.setting.findUnique({ where: { key: 'aos_coupons' } });
      if (couponSetting) {
        const coupons = JSON.parse(couponSetting.value);
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

    const orderId = crypto.randomUUID();
    const order = await prisma.$transaction(async (tx) => {
      for (const item of validatedItems) {
        if (item.productId) {
          const [updated] = await tx.$queryRaw<{ stock: number }[]>`
            UPDATE aos_products SET value = json_set(value, '$.stock', CAST(json_extract(value, '$.stock') AS INTEGER) - ${item.quantity})
            WHERE key = 'aos_products'
            RETURNING json_extract(value, '$.stock') as stock
          `;
          if (updated && updated.stock < 0) {
            throw new Error(`Insufficient stock for ${item.name}`);
          }
        }
      }

      return tx.order.create({
        data: {
          id: orderId,
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
            create: validatedItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              productId: item.productId,
            })),
          },
        },
        include: { items: true },
      });
    });

    if (order) {
      const updatedSetting = await prisma.setting.findUnique({ where: { key: 'aos_products' } });
      if (updatedSetting) {
        clearCache('products');
      }
    }

    console.log(`[Orders] Created order ${order.id} (${order.total} DZD)`);
    clearCache('orders:list');
    emitNewOrder(order);
    sendNewOrderAlert({
      id: order.id,
      customer: order.customer,
      phone: order.phone,
      wilaya: order.wilaya,
      municipality: order.municipality,
      address: order.address,
      total: order.total,
      items: order.items,
    });
    sendNewOrderTelegramAlert({
      id: order.id,
      customer: order.customer,
      phone: order.phone,
      wilaya: order.wilaya,
      municipality: order.municipality,
      address: order.address,
      total: order.total,
      items: order.items,
    });
    sendNewOrderDiscordAlert({
      id: order.id,
      customer: order.customer,
      phone: order.phone,
      wilaya: order.wilaya,
      municipality: order.municipality,
      address: order.address,
      total: order.total,
      items: order.items,
    });
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    if (err instanceof Error && err.message.includes('Insufficient stock')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('[Orders] Create error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

orderRouter.get('/user', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const requesterId = req.userId;
    if (!requesterId) return res.status(401).json({ error: 'Authentication required' });

    const requester = await prisma.user.findUnique({ where: { id: requesterId }, select: { email: true, phone: true, role: true } });
    if (!requester) return res.status(401).json({ error: 'Authentication required' });

    const isAdmin = requester.role === 'SUPER_ADMIN' || requester.role === 'ADMIN';
    const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';
    const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone query required' });
    }

    if (!isAdmin) {
      const matchesEmail = email && requester.email && requester.email.toLowerCase() === email.toLowerCase();
      const matchesPhone = phone && requester.phone === phone;
      if (!matchesEmail && !matchesPhone) {
        return res.status(403).json({ error: 'You can only view your own orders' });
      }
    }

    const where: any = {};
    if (email) where.email = email;
    if (phone) where.phone = phone;

    const orders = await prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    console.error('[Orders] Customer fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch customer orders' });
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

    const authReq = req as AuthRequest;
    let isAdmin = false;
    let isOwner = false;
    if (authReq.userId) {
      const requester = await prisma.user.findUnique({ where: { id: authReq.userId }, select: { email: true, phone: true, role: true } });
      if (requester) {
        isAdmin = requester.role === 'SUPER_ADMIN' || requester.role === 'ADMIN';
        isOwner = Boolean(
          (order.email && requester.email && order.email.toLowerCase() === requester.email.toLowerCase()) ||
          (order.phone && requester.phone && order.phone === requester.phone)
        );
      }
    }

    if (isAdmin || isOwner) {
      return res.json(order);
    }

    const { customer, email, phone, address, note, userId, ...publicOrder } = order as any;
    res.json(publicOrder);
  } catch (err) {
    console.error('[Orders] Track error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

orderRouter.get('/', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const cached = getCached<{ orders: any[] }>('orders:list');
    if (cached) return res.json(cached.orders);

    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    console.log(`[Orders] Fetched ${orders.length} orders`);
    setCache('orders:list', { orders }, 5_000);
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
    clearCache('orders:list');
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
    clearCache('orders:list');
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
    clearCache('orders:list');
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


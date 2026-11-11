import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { securityRateLimitHandler } from '../services/security';
import { sendWhatsAppNotification, sendNewOrderAlert } from '../services/whatsapp';
import { sendNewOrderTelegramAlert, sendNewOrderDiscordAlert } from '../services/telegram';
import { emitNewOrder } from '../services/live';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { getCached, setCache, clearCache } from '../utils/cache';
import { fixMojibakeData } from '../utils/encoding';
import { quoteOrderDelivery, parseLocalityIdFromLabel } from '../services/delivery';
import type { PricedItemInput } from '../data/deliveryTariff';

export const orderRouter = Router();

const PRODUCTS_SETTING_KEY = 'aos_products';
const PRODUCTS_CACHE_KEY = 'products';
const PRODUCTS_CACHE_TTL_MS = 30_000;

type CatalogProduct = {
  id: number;
  nameAr?: string;
  nameFr?: string;
  nameEn?: string;
  price: number;
  salePrice?: number;
  saleEnd?: string;
  stock?: number | string | null;
  weight?: string;
  dimensions?: string;
};

/**
 * Product catalog is normally served from `/api/products`, which caches it
 * under the same key. Reusing that cache keeps checkout from reading the same
 * multi-kilobyte setting row on every order during a rush.
 */
async function loadProductCatalog(): Promise<CatalogProduct[]> {
  const cached = getCached<{ products: CatalogProduct[] }>(PRODUCTS_CACHE_KEY);
  if (cached?.products) return cached.products;

  const setting = await prisma.setting.findUnique({ where: { key: PRODUCTS_SETTING_KEY } });
  const products = setting
    ? fixMojibakeData(JSON.parse(setting.value)) as CatalogProduct[]
    : [];
  setCache(PRODUCTS_CACHE_KEY, { products }, PRODUCTS_CACHE_TTL_MS);
  return products;
}

/** Only a finite numeric stock is enforced; missing stock means unlimited. */
function finiteStock(product: CatalogProduct): number | null {
  if (typeof product.stock === 'number' && Number.isFinite(product.stock)) {
    return product.stock;
  }
  if (typeof product.stock === 'string' && product.stock.trim() !== '') {
    const parsed = Number(product.stock);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function productLabel(product: CatalogProduct): string {
  return product.nameAr || product.nameEn || product.nameFr || `#${product.id}`;
}

/** Order identity used to absorb a double submit that generated two ids. */
function itemsSignature(items: Array<{ name: string; quantity: number }>): string {
  return items
    .map((item) => `${item.name.trim().toLowerCase()}:${item.quantity}`)
    .sort()
    .join('|');
}

const DUPLICATE_ORDER_WINDOW_MS = 120_000;
const COUPON_USAGE_KEY = 'aos_coupon_usage';
const AUTO_CANCEL_HOURS = Math.max(1, Number(process.env.ORDER_AUTO_CANCEL_HOURS) || 72);
// Never sweep orders older than this on the first run after a deploy: very old
// "new" rows were probably fulfilled and simply never marked completed.
const AUTO_CANCEL_MAX_AGE_DAYS = Math.max(1, Number(process.env.ORDER_AUTO_CANCEL_MAX_AGE_DAYS) || 30);
const TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

// A shopper never needs more than a handful of orders in ten minutes. The
// broad /api/orders limiter stays for reads and admin traffic; this one only
// guards the public create endpoint against stock-draining bots.
const createOrderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 12,
  handler: securityRateLimitHandler('orders-create'),
  validate: { xForwardedForHeader: false },
});

async function readCouponUsage(tx: Prisma.TransactionClient): Promise<Record<string, number>> {
  const setting = await tx.setting.findUnique({ where: { key: COUPON_USAGE_KEY } });
  if (!setting) return {};
  try {
    const parsed = JSON.parse(setting.value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? parsed as Record<string, number>
      : {};
  } catch {
    return {};
  }
}

type RestorableOrder = {
  id: string;
  status: string;
  stockRestoredAt: Date | null;
  items: Array<{ catalogProductId: number | null; name: string; quantity: number }>;
};

/**
 * Returns reserved units to the JSON product catalog exactly once per order.
 * Completed orders are left alone: their stock was genuinely sold, and
 * deleting old history must not inflate the inventory.
 */
async function restoreStockForOrders(
  tx: Prisma.TransactionClient,
  orders: RestorableOrder[],
): Promise<CatalogProduct[] | null> {
  const eligible = orders.filter((order) => !order.stockRestoredAt && order.status !== 'completed');
  if (eligible.length === 0) return null;

  const rows = await tx.$queryRaw<Array<{ value: string }>>`
    SELECT "value" FROM "Setting" WHERE "key" = ${PRODUCTS_SETTING_KEY} FOR UPDATE
  `;
  if (rows.length === 0) return null;

  const catalog = fixMojibakeData(JSON.parse(rows[0].value)) as CatalogProduct[];
  let changed = false;

  for (const order of eligible) {
    for (const item of order.items) {
      const product = item.catalogProductId != null
        ? catalog.find((p) => p.id === item.catalogProductId)
        : catalog.find((p) => p.nameAr === item.name || p.nameFr === item.name || p.nameEn === item.name);
      if (!product) continue;
      const available = finiteStock(product);
      if (available === null) continue; // unlimited stock stays unlimited
      product.stock = Math.max(0, available) + item.quantity;
      changed = true;
    }
  }

  if (changed) {
    await tx.setting.update({
      where: { key: PRODUCTS_SETTING_KEY },
      data: { value: JSON.stringify(catalog) },
    });
  }

  await tx.order.updateMany({
    where: { id: { in: eligible.map((order) => order.id) } },
    data: { stockRestoredAt: new Date() },
  });

  return changed ? catalog : null;
}

async function restoreOrderStock(
  tx: Prisma.TransactionClient,
  orderId: string,
): Promise<CatalogProduct[] | null> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return null;
  return restoreStockForOrders(tx, [order]);
}

/**
 * Cancels product orders that stayed "new" for too long and returns their
 * reserved stock. Runs hourly from the server bootstrap. A transaction-level
 * re-check keeps an admin action from racing the cleanup.
 */
export async function cancelStaleOrders(): Promise<number> {
  const cutoff = new Date(Date.now() - AUTO_CANCEL_HOURS * 60 * 60 * 1000);
  const oldest = new Date(Date.now() - AUTO_CANCEL_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
  let cancelled = 0;

  for (let pass = 0; pass < 5; pass++) {
    const stale = await prisma.order.findMany({
      where: {
        status: 'new',
        source: { not: 'service-booking' },
        stockRestoredAt: null,
        createdAt: { lt: cutoff, gte: oldest },
      },
      select: { id: true },
      take: 100,
    });
    if (stale.length === 0) break;

    for (const { id } of stale) {
      const result = await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id },
          include: { items: true },
        });
        if (!order || order.status !== 'new' || order.stockRestoredAt) return null;

        const catalog = await restoreStockForOrders(tx, [order]);
        const updated = await tx.order.update({
          where: { id },
          data: { status: 'cancelled' },
        });
        await tx.orderStatusEvent.create({
          data: {
            orderId: id,
            status: 'cancelled',
            note: `auto-cancel: unconfirmed for ${AUTO_CANCEL_HOURS}h`,
          },
        });
        return { order: updated, catalog };
      }, TX_OPTIONS);

      if (!result) continue;
      cancelled++;
      if (result.catalog) {
        setCache(PRODUCTS_CACHE_KEY, { products: result.catalog }, PRODUCTS_CACHE_TTL_MS);
      }
      console.log(`[Orders] Auto-cancelled stale order ${id}`);
      sendWhatsAppNotification(
        result.order.phone,
        result.order.customer,
        id,
        'cancelled',
        result.order.total,
      );
    }

    if (stale.length < 100) break;
  }

  if (cancelled > 0) {
    clearCache('orders:list');
    console.log(`[Orders] Auto-cancelled ${cancelled} stale order(s)`);
  }
  return cancelled;
}

const orderItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().positive().max(10000),
  price: z.number().nonnegative(),
  total: z.number().nonnegative(),
  productId: z.number().optional(),
});

// Empty string email is common on mobile autofill-off — treat as omitted.
const optionalEmail = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
  z.string().email().optional()
);

const createOrderSchema = z
  .object({
    id: z.string().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/),
    createdAt: z.string().datetime().optional(),
    customer: z.string().min(1).max(200),
    phone: z.string().min(1).max(20),
    email: optionalEmail,
    wilaya: z.string().max(200),
    municipality: z.string().max(200),
    address: z.string().max(500),
    note: z.string().max(500).optional(),
    wilayaId: z.number().int().min(1).max(69).optional(),
    municipalityId: z.string().max(20).optional(),
    deliveryMethod: z.enum(['home', 'desk']).optional(),
    deliveryFee: z.number().nonnegative().max(1000000).optional(),
    items: z.array(orderItemSchema).min(1).max(50),
    total: z.number().nonnegative().max(10000000),
    source: z.enum(['form', 'quick-order', 'service-booking']),
    discountCode: z.string().max(50).optional(),
  })
  .superRefine((data, ctx) => {
    // Product orders require delivery address; service bookings do not.
    if (data.source === 'service-booking') return;
    if (!data.wilaya.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['wilaya'], message: 'Wilaya is required' });
    }
    if (!data.municipality.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['municipality'], message: 'Municipality is required' });
    }
    if (!data.address.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['address'], message: 'Address is required' });
    }
  });

orderRouter.post('/', createOrderLimiter, async (req: Request, res: Response) => {
  try {
    const data = createOrderSchema.parse(req.body);
    console.log(
      `[Orders] POST create source=${data.source} email=${data.email ? 'yes' : 'empty'} ` +
      `wilaya=${JSON.stringify(data.wilaya)} items=${data.items.length} ua=${req.headers['user-agent'] || 'n/a'}`
    );
    const isService = data.source === 'service-booking';

    // The client sends a stable id. If the same submit is retried (timeout,
    // double click, sync retry), return the existing order instead of
    // creating a duplicate and sending duplicate notifications.
    const requestedId = data.id;
    if (requestedId) {
      const existing = await prisma.order.findUnique({
        where: { id: requestedId },
        select: { id: true },
      });
      if (existing) {
        console.log(`[Orders] Duplicate submit ignored: ${requestedId}`);
        return res.status(200).json({ id: existing.id, duplicate: true });
      }
    }

    let serverTotal = 0;
    const validatedItems: { name: string; quantity: number; price: number; total: number; productId?: number }[] = [];
    const deliveryItems: PricedItemInput[] = [];

    if (isService) {
      // Service bookings are free-form (no product catalog entry).
      for (const item of data.items) {
        const itemTotal = Math.round(item.price * item.quantity);
        serverTotal += itemTotal;
        validatedItems.push({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: itemTotal,
          productId: item.productId,
        });
      }
      if (data.total > 0 && Math.abs(serverTotal - data.total) > 1) {
        serverTotal = data.total;
      }
    } else {
      const products = await loadProductCatalog();

      for (const item of data.items) {
        const product = item.productId
          ? products.find((p) => p.id === item.productId)
          : products.find((p) => p.nameAr === item.name || p.nameFr === item.name || p.nameEn === item.name);

        if (!product) {
          console.warn(`[Orders] Product not found (source=${data.source}): ${item.name} productId=${item.productId ?? 'none'}`);
          return res.status(400).json({ error: `Product not found: ${item.name}` });
        }

        const serverPrice = product.salePrice && product.saleEnd && new Date(product.saleEnd) > new Date()
          ? product.salePrice
          : product.price;

        // Advisory fast-fail for sold-out items; the authoritative check runs
        // inside the locked transaction below.
        const available = finiteStock(product);
        if (available !== null && available < item.quantity) {
          return res.status(400).json({
            error: `Insufficient stock: ${productLabel(product)} (available ${Math.max(0, available)})`,
          });
        }

        const itemTotal = Math.round(serverPrice * item.quantity);
        serverTotal += itemTotal;

        validatedItems.push({
          name: product.nameAr || item.name,
          quantity: item.quantity,
          price: serverPrice,
          total: itemTotal,
          productId: product.id,
        });

        deliveryItems.push({
          quantity: item.quantity,
          weight: product.weight ?? '',
          dimensions: product.dimensions ?? '',
        });
      }
    }

    // The client estimate is never trusted: delivery is recomputed here from
    // the catalog weight/dimensions and the admin tariff.
    let deliveryFee = 0;
    let deliveryMethod: 'home' | 'desk' = 'home';
    let localityId: number | null = null;

    if (!isService) {
      // The wilaya label always starts with its official number ("18 Jijel").
      // Trusting the numeric id sent by the browser let a cheap locality pay
      // for a remote one; derive the id from the label and reject any mismatch.
      const localityFromLabel = parseLocalityIdFromLabel(data.wilaya);
      if (localityFromLabel === null) {
        return res.status(400).json({
          error: 'Wilaya must include its official number (e.g. 18 Jijel)',
        });
      }
      if (data.wilayaId !== undefined && data.wilayaId !== localityFromLabel) {
        return res.status(400).json({ error: 'Wilaya does not match the delivery locality' });
      }
      localityId = localityFromLabel;
      deliveryMethod = data.deliveryMethod ?? 'home';

      const quote = await quoteOrderDelivery({
        localityId,
        method: deliveryMethod,
        subtotal: serverTotal,
        items: deliveryItems,
      });
      deliveryFee = quote.deliveryFee;
      console.log(
        `[Orders] Delivery locality=${localityId} method=${deliveryMethod} ` +
        `weight=${quote.billedWeightKg}kg fee=${deliveryFee} ` +
        `(base=${quote.baseFee} weightFee=${quote.weightFee} oversize=${quote.oversizeSurcharge})`
      );
    }

    let finalTotal = serverTotal;
    let discountAmount = 0;
    let appliedCode: string | undefined;
    let appliedCoupon: any = null;

    if (data.discountCode) {
      const couponSetting = await prisma.setting.findUnique({ where: { key: 'aos_coupons' } });
      if (couponSetting) {
        const coupons = fixMojibakeData(JSON.parse(couponSetting.value));
        const coupon = Array.isArray(coupons) ? coupons.find(
          (c: any) => c.code?.toLowerCase() === data.discountCode?.toLowerCase() && c.active
        ) : null;
        if (!coupon) {
          return res.status(400).json({ error: 'Invalid or inactive coupon code' });
        }
        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
          return res.status(400).json({ error: 'Coupon has expired' });
        }
        if (coupon.minOrder > 0 && serverTotal < coupon.minOrder) {
          return res.status(400).json({ error: `Minimum order amount is ${coupon.minOrder}` });
        }
        discountAmount = coupon.type === 'percentage'
          ? Math.round(serverTotal * (coupon.value / 100))
          : Math.min(coupon.value, serverTotal);
        discountAmount = Math.min(discountAmount, serverTotal);
        finalTotal = Math.max(0, serverTotal - discountAmount);
        appliedCode = String(coupon.code).trim().toUpperCase();
        appliedCoupon = coupon;
      }
    }

    finalTotal = Math.max(0, finalTotal) + deliveryFee;

    // The server total is authoritative; log disagreements instead of
    // rejecting legitimate orders from a slightly stale client bundle.
    if (!isService && Math.abs(data.total - finalTotal) > 1) {
      console.warn(`[Orders] Client total ${data.total} != server total ${finalTotal} (delivery ${deliveryFee})`);
    }

    // Aggregate quantities per product so two lines of the same item can not
    // bypass the stock check. Quantities are validated in one locked
    // transaction: read-modify-write under concurrency is what oversells.
    const stockQuantities = new Map<number, number>();
    if (!isService) {
      for (const item of validatedItems) {
        if (item.productId == null) continue;
        stockQuantities.set(
          item.productId,
          (stockQuantities.get(item.productId) ?? 0) + item.quantity,
        );
      }
    }

    const orderId = requestedId || crypto.randomUUID();
    const result = await prisma.$transaction(async (tx) => {
      // The catalog row doubles as the submission lock: it serializes stock
      // checks and the recent-duplicate check across concurrent requests.
      const rows = await tx.$queryRaw<Array<{ value: string }>>`
        SELECT "value" FROM "Setting" WHERE "key" = ${PRODUCTS_SETTING_KEY} FOR UPDATE
      `;
      if (rows.length === 0 && stockQuantities.size > 0) {
        return { stockError: 'Product catalog unavailable' };
      }

      // A retry can arrive after the first attempt committed but before the
      // client saw the response. Return the winner instead of charging stock
      // twice or answering "sold out" for an order that already exists.
      if (requestedId) {
        const existing = await tx.order.findUnique({
          where: { id: requestedId },
          select: { id: true },
        });
        if (existing) return { duplicateOrderId: existing.id };
      }

      // Safety net for clients still running an old bundle: two submits can
      // create two different ids. An identical phone + name + items + total
      // around the original submission time is a double submit, not a second
      // purchase. The client timestamp also covers orders queued offline and
      // pushed hours later, which must still match their server twin.
      const clientCreatedAt = data.createdAt ? new Date(data.createdAt) : null;
      const duplicateAnchor =
        clientCreatedAt && Number.isFinite(clientCreatedAt.getTime())
          ? clientCreatedAt
          : new Date();
      const recent = await tx.order.findFirst({
        where: {
          phone: data.phone,
          total: finalTotal,
          createdAt: {
            gte: new Date(duplicateAnchor.getTime() - DUPLICATE_ORDER_WINDOW_MS),
            lte: new Date(duplicateAnchor.getTime() + DUPLICATE_ORDER_WINDOW_MS),
          },
        },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      });
      if (
        recent &&
        recent.customer.trim().toLowerCase() === data.customer.trim().toLowerCase() &&
        recent.address.trim().toLowerCase() === data.address.trim().toLowerCase() &&
        recent.wilaya === data.wilaya &&
        recent.municipality === data.municipality &&
        itemsSignature(recent.items) === itemsSignature(validatedItems)
      ) {
        return { duplicateOrderId: recent.id };
      }

      let updatedCatalog: CatalogProduct[] | null = null;

      if (stockQuantities.size > 0) {
        const catalog = fixMojibakeData(JSON.parse(rows[0].value)) as CatalogProduct[];

        for (const [productId, quantity] of stockQuantities) {
          const product = catalog.find((p) => p.id === productId);
          if (!product) {
            return { stockError: `Product not found: #${productId}` };
          }
          const available = finiteStock(product);
          if (available === null) continue; // unlimited stock
          if (available < quantity) {
            return {
              stockError: `Insufficient stock: ${productLabel(product)} (available ${Math.max(0, available)})`,
            };
          }
          product.stock = available - quantity;
          updatedCatalog = catalog;
        }
      }

      // Coupon usage is checked only after the stock checks pass, so a stock
      // rejection has no write to commit. The increment commits with the order
      // and rolls back if the insert fails.
      if (appliedCoupon && appliedCode) {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${appliedCode}))`;
        const usage = await readCouponUsage(tx);
        const used = Number(usage[appliedCode] ?? 0);
        if (appliedCoupon.maxUses > 0 && used >= appliedCoupon.maxUses) {
          return { couponError: 'Coupon usage limit reached' };
        }
        usage[appliedCode] = used + 1;
        await tx.setting.upsert({
          where: { key: COUPON_USAGE_KEY },
          create: { key: COUPON_USAGE_KEY, value: JSON.stringify(usage) },
          update: { value: JSON.stringify(usage) },
        });
      }

      // Persist the decremented catalog in the same transaction as the order:
      // if the insert fails, both the stock change and the coupon use roll back.
      if (updatedCatalog) {
        await tx.setting.update({
          where: { key: PRODUCTS_SETTING_KEY },
          data: { value: JSON.stringify(updatedCatalog) },
        });
      }

      const created = await tx.order.create({
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
          subtotal: serverTotal,
          deliveryMethod: isService ? null : deliveryMethod,
          deliveryFee,
          wilayaId: isService ? null : localityId,
          status: 'new',
          source: data.source,
          paymentMethod: isService ? null : 'cod',
          discountAmount,
          discountCode: appliedCode ?? null,
          statusEvents: { create: { status: 'new' } },
          items: {
            create: validatedItems.map(item => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
              catalogProductId: item.productId ?? null,
            })),
          },
        },
        include: { items: true },
      });

      return { order: created, products: updatedCatalog };
    }, TX_OPTIONS).catch((err) => {
      // Two simultaneous retries can both pass the checks above; the primary
      // key then rejects the second insert. Treat it as a duplicate, not 500.
      if (requestedId && (err?.code === 'P2002' || String(err?.message || '').includes('Unique constraint'))) {
        return { duplicateOrderId: requestedId };
      }
      throw err;
    });

    if ('duplicateOrderId' in result) {
      console.log(`[Orders] Duplicate order ignored: ${result.duplicateOrderId}`);
      return res.status(200).json({ id: result.duplicateOrderId, duplicate: true });
    }

    if ('couponError' in result) {
      console.warn(`[Orders] Coupon rejected: ${result.couponError}`);
      return res.status(400).json({ error: result.couponError });
    }

    if ('stockError' in result) {
      console.warn(`[Orders] Rejected by stock check: ${result.stockError}`);
      return res.status(400).json({ error: result.stockError });
    }

    const order = result.order;

    // Keep the catalog cache in sync with the decremented stock we just
    // committed, so the next shopper sees the real availability immediately.
    if (result.products) {
      setCache(PRODUCTS_CACHE_KEY, { products: result.products }, PRODUCTS_CACHE_TTL_MS);
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
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      deliveryMethod: order.deliveryMethod,
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
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      deliveryMethod: order.deliveryMethod,
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
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      deliveryMethod: order.deliveryMethod,
      items: order.items,
    });
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof z.ZodError) {
      console.warn('[Orders] Create validation failed:', JSON.stringify(err.errors), 'body keys:', Object.keys(req.body || {}));
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
    const { status } = z.object({
      status: z.enum(['new', 'processing', 'completed', 'cancelled']),
    }).parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!existing) return { notFound: true as const };

      const changed = existing.status !== status;
      const updated = changed
        ? await tx.order.update({ where: { id }, data: { status } })
        : existing;

      if (changed) {
        await tx.orderStatusEvent.create({ data: { orderId: id, status } });
      }

      // Cancelling returns reserved stock once. A cancellation recorded before
      // this deploy has stockRestoredAt=null and is repaired here too.
      const catalog = status === 'cancelled' && !existing.stockRestoredAt
        ? await restoreOrderStock(tx, id)
        : null;

      return { updated, catalog, changed };
    }, TX_OPTIONS);

    if ('notFound' in result) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (result.catalog) {
      setCache(PRODUCTS_CACHE_KEY, { products: result.catalog }, PRODUCTS_CACHE_TTL_MS);
    }
    if (result.changed) {
      sendWhatsAppNotification(
        result.updated.phone,
        result.updated.customer,
        id,
        status,
        result.updated.total,
      );
    }
    clearCache('orders:list');
    console.log(`[Orders] Updated order ${id} status to ${status}`);
    res.json(result.updated);
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
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) return { notFound: true as const };
      const catalog = await restoreStockForOrders(tx, [order]);
      await tx.order.delete({ where: { id } });
      return { catalog };
    }, TX_OPTIONS);

    if ('notFound' in result) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (result.catalog) {
      setCache(PRODUCTS_CACHE_KEY, { products: result.catalog }, PRODUCTS_CACHE_TTL_MS);
    }
    clearCache('orders:list');
    console.log(`[Orders] Deleted order ${id}`);
    res.json({ deleted: true, id });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: 'Not found' });
    }
    console.error('[Orders] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

orderRouter.post('/clear-all', requireAuth, requireRole('SUPER_ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const orders = await tx.order.findMany({
        include: { items: true },
      });
      const catalog = await restoreStockForOrders(tx, orders);
      await tx.order.deleteMany({});
      return { catalog, ids: orders.map((order) => order.id) };
    }, TX_OPTIONS);

    if (result.catalog) {
      setCache(PRODUCTS_CACHE_KEY, { products: result.catalog }, PRODUCTS_CACHE_TTL_MS);
    }
    clearCache('orders:list');
    console.log(`[Orders] Cleared all ${result.ids.length} orders`);
    res.json({ deleted: true, count: result.ids.length, ids: result.ids });
  } catch (err) {
    console.error('[Orders] Clear all error:', err);
    res.status(500).json({ error: 'Failed to clear orders' });
  }
});

orderRouter.delete('/:id', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });
      if (!order) return { notFound: true as const };
      const catalog = await restoreStockForOrders(tx, [order]);
      await tx.order.delete({ where: { id } });
      return { catalog };
    }, TX_OPTIONS);

    if ('notFound' in result) {
      return res.status(404).json({ error: 'Not found' });
    }
    if (result.catalog) {
      setCache(PRODUCTS_CACHE_KEY, { products: result.catalog }, PRODUCTS_CACHE_TTL_MS);
    }
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


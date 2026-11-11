import { Router, Request, Response } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { getCached, setCache, clearCache } from '../utils/cache';
import { fixMojibakeData } from '../utils/encoding';

export const dataRouter = Router();

const ALLOWED_KEYS = new Set([
  'aos_products',
  'aos_services',
  'aos_coupons',
  'aos_site_settings',
  'aos_site_content',
]);

const PRODUCTS_KEY = 'aos_products';
const TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 };

const saveSchema = z.object({
  key: z.string().min(1).max(64),
  value: z.any(),
});

const stockAdjustSchema = z.object({
  id: z.number().int().positive(),
  delta: z.number().int().min(-1_000_000).max(1_000_000),
});

function parseCatalog(value: string): any[] | null {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * A catalog save is a whole-array snapshot. If an order decremented stock after
 * the admin opened the form, that snapshot carries the old quantity and would
 * put sold units back. Keep the database quantity for existing products; stock
 * changes go through the dedicated delta endpoint below.
 */
async function saveProductsPreservingStock(value: any[]): Promise<void> {
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const rows = await tx.$queryRaw<Array<{ value: string }>>`
      SELECT "value" FROM "Setting" WHERE "key" = ${PRODUCTS_KEY} FOR UPDATE
    `;
    const current = rows.length > 0 ? parseCatalog(rows[0].value) : null;
    const stockById = new Map<string, unknown>();
    for (const product of current ?? []) {
      if (product && product.id !== undefined) {
        stockById.set(String(product.id), product.stock);
      }
    }
    const merged = current
      ? value.map((product) => {
          if (!product || product.id === undefined || !stockById.has(String(product.id))) {
            return product;
          }
          return { ...product, stock: stockById.get(String(product.id)) };
        })
      : value;

    await tx.setting.upsert({
      where: { key: PRODUCTS_KEY },
      update: { value: JSON.stringify(merged) },
      create: { key: PRODUCTS_KEY, value: JSON.stringify(merged) },
    });
  }, TX_OPTIONS);
}

// Atomic stock delta. The catalog row is locked, so a concurrent order cannot
// decrement between the read and the write, and the admin never sends an
// absolute quantity that could overwrite a sale made while the page was open.
dataRouter.post('/products/stock', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { id, delta } = stockAdjustSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const rows = await tx.$queryRaw<Array<{ value: string }>>`
        SELECT "value" FROM "Setting" WHERE "key" = ${PRODUCTS_KEY} FOR UPDATE
      `;
      const catalog = rows.length > 0 ? parseCatalog(rows[0].value) : null;
      if (!catalog) return { notFound: true as const };

      const product = catalog.find((entry) => entry && Number(entry.id) === id);
      if (!product) return { notFound: true as const };

      const current = Number.isFinite(Number(product.stock))
        ? Math.max(0, Math.floor(Number(product.stock)))
        : 0;
      product.stock = Math.max(0, current + delta);

      await tx.setting.update({
        where: { key: PRODUCTS_KEY },
        data: { value: JSON.stringify(catalog) },
      });

      return { stock: product.stock as number, catalog };
    }, TX_OPTIONS);

    if ('notFound' in result) {
      return res.status(404).json({ error: 'Product not found' });
    }

    setCache('products', { products: result.catalog }, 30_000);
    setCache(`data:${PRODUCTS_KEY}`, { value: result.catalog }, 30_000);
    console.log(`[Data] Product ${id} stock ${delta >= 0 ? '+' : ''}${delta} -> ${result.stock}`);
    res.json({ id, stock: result.stock });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Data] Stock update error:', err);
    res.status(500).json({ error: 'Failed to update stock' });
  }
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
    if (key === PRODUCTS_KEY) clearCache('products');
    if (key === 'aos_site_settings') clearCache('delivery:');
    if (key === PRODUCTS_KEY && Array.isArray(value)) {
      await saveProductsPreservingStock(value);
    } else {
      await prisma.setting.upsert({
        where: { key },
        update: { value: serialized },
        create: { key, value: serialized },
      });
    }
    // Clear again after the write: a concurrent request may have repopulated
    // the cache with the previous value between the first clear and the write.
    if (key === PRODUCTS_KEY) clearCache('products');
    if (key === 'aos_site_settings') clearCache('delivery:');
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
    const parsed = JSON.parse(setting.value);
    const fixed = fixMojibakeData(parsed);

    const fixedJson = JSON.stringify(fixed);
    if (fixedJson !== setting.value) {
      console.log(`[Data] Mojibake detected in ${key}, re-saving to database`);
      await prisma.setting.update({
        where: { key },
        data: { value: fixedJson },
      });
    }

    const data = { value: fixed };
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

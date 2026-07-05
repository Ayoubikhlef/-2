import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { syncProducts, isReady } from '../services/rag';

export const productRouter = Router();

const productSchema = z.object({
  id: z.number(),
  nameAr: z.string(),
  nameFr: z.string(),
  nameEn: z.string(),
  descAr: z.string(),
  descFr: z.string(),
  descEn: z.string(),
  shortDescAr: z.string().optional(),
  shortDescFr: z.string().optional(),
  shortDescEn: z.string().optional(),
  price: z.number(),
  salePrice: z.number().nullable().optional(),
  saleEnd: z.string().nullable().optional(),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  warranty: z.string().optional(),
  seoKeywords: z.string().optional(),
  image: z.string(),
  images: z.array(z.string()).optional(),
  category: z.string(),
  brand: z.string().optional(),
  hidden: z.boolean().optional(),
  specs: z.array(z.object({
    label: z.object({ ar: z.string(), fr: z.string(), en: z.string() }),
    value: z.object({ ar: z.string(), fr: z.string(), en: z.string() }),
  })).optional(),
  relatedIds: z.array(z.number()).optional(),
});

const syncSchema = z.object({
  products: z.array(productSchema),
});

const SETTINGS_KEY_PRODUCTS = 'aos_products';

productRouter.post('/sync', async (req, res: Response) => {
  try {
    const { products } = syncSchema.parse(req.body);
    // Persist products as JSON in the Setting model
    await prisma.setting.upsert({
      where: { key: SETTINGS_KEY_PRODUCTS },
      update: { value: JSON.stringify(products) },
      create: { key: SETTINGS_KEY_PRODUCTS, value: JSON.stringify(products) },
    });
    // Also sync to RAG for AI search
    await syncProducts(products);
    res.json({ ok: true, indexed: products.length });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Product Sync Error]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

productRouter.get('/', async (_req, res: Response) => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: SETTINGS_KEY_PRODUCTS } });
    if (!setting) {
      return res.json({ products: [] });
    }
    res.json({ products: JSON.parse(setting.value) });
  } catch (err) {
    console.error('[Products Fetch Error]', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

productRouter.get('/status', (_req, res: Response) => {
  res.json({ ragReady: isReady() });
});

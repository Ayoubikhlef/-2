import { Router, Response } from 'express';
import { z } from 'zod';
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
  price: z.number(),
  image: z.string(),
  brand: z.string().optional(),
  category: z.string(),
  hidden: z.boolean().optional(),
});

const syncSchema = z.object({
  products: z.array(productSchema),
});

productRouter.post('/sync', async (req, res: Response) => {
  try {
    const { products } = syncSchema.parse(req.body);
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

productRouter.get('/status', (_req, res: Response) => {
  res.json({ ragReady: isReady() });
});

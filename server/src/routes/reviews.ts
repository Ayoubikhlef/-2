import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, requireRole, type AuthRequest } from '../middleware/auth';
import { getCached, setCache, clearCache } from '../utils/cache';

export const reviewRouter = Router();

const PRODUCTS_KEY = 'aos_products';
const MAX_PUBLIC_REVIEWS = 50;
const PUBLIC_TTL = 60_000;
const ADMIN_TTL = 15_000;

const createReviewSchema = z.object({
  productId: z.number().int().positive(),
  name: z.string().trim().min(2).max(50),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(500),
  // Honeypot: real users never see this field; bots usually fill it.
  website: z.string().max(200).optional(),
});

const moderationSchema = z.object({
  approved: z.boolean(),
});

type ReviewRow = {
  id: string;
  productId: string;
  name: string;
  rating: number;
  comment: string;
  approved: boolean;
  createdAt: Date;
};

function toPublicReview(review: ReviewRow) {
  return {
    id: review.id,
    productId: Number(review.productId),
    name: review.name,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt.toISOString(),
  };
}

function toAdminReview(review: ReviewRow) {
  return {
    ...toPublicReview(review),
    approved: review.approved,
  };
}

function invalidateReviewCaches() {
  clearCache('reviews:');
}

async function catalogHasProduct(productId: number): Promise<boolean> {
  const setting = await prisma.setting.findUnique({ where: { key: PRODUCTS_KEY } });
  if (!setting) return false;
  try {
    const catalog = JSON.parse(setting.value);
    return Array.isArray(catalog) && catalog.some((item: any) => Number(item?.id) === productId);
  } catch {
    return false;
  }
}

// Admin routes must stay above /:productId so "admin" is never parsed as an id.
reviewRouter.get('/admin/all', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const cached = getCached<{ reviews: ReturnType<typeof toAdminReview>[] }>('reviews:admin');
    if (cached) return res.json(cached.reviews);

    const reviews = await prisma.productReview.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
    const payload = reviews.map(toAdminReview);
    setCache('reviews:admin', { reviews: payload }, ADMIN_TTL);
    res.json(payload);
  } catch (err) {
    console.error('[Reviews] Admin fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

reviewRouter.patch('/admin/:id', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { approved } = moderationSchema.parse(req.body);
    const existing = await prisma.productReview.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Review not found' });

    const updated = await prisma.productReview.update({
      where: { id: existing.id },
      data: { approved },
    });
    invalidateReviewCaches();
    console.log(`[Reviews] Review ${updated.id} ${approved ? 'approved' : 'unapproved'}`);
    res.json(toAdminReview(updated));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Reviews] Moderation error:', err);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

reviewRouter.delete('/admin/:id', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.productReview.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Review not found' });

    await prisma.productReview.delete({ where: { id: existing.id } });
    invalidateReviewCaches();
    console.log(`[Reviews] Review ${existing.id} deleted`);
    res.json({ deleted: true });
  } catch (err) {
    console.error('[Reviews] Delete error:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

reviewRouter.get('/:productId', async (req: Request, res: Response) => {
  const productId = Number(req.params.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return res.status(400).json({ error: 'Invalid product id' });
  }

  try {
    const cacheKey = `reviews:${productId}`;
    const cached = getCached<{ reviews: ReturnType<typeof toPublicReview>[] }>(cacheKey);
    if (cached) return res.json(cached.reviews);

    const reviews = await prisma.productReview.findMany({
      where: { productId: String(productId), approved: true },
      orderBy: { createdAt: 'desc' },
      take: MAX_PUBLIC_REVIEWS,
    });
    const payload = reviews.map(toPublicReview);
    setCache(cacheKey, { reviews: payload }, PUBLIC_TTL);
    res.json(payload);
  } catch (err) {
    console.error('[Reviews] Fetch by product error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

reviewRouter.post('/', async (req: Request, res: Response) => {
  try {
    const data = createReviewSchema.parse(req.body);

    // Silently accept honeypot hits so bots do not learn the check.
    if (data.website) {
      return res.status(201).json({ ok: true, pending: true });
    }

    if (/(https?:\/\/|www\.)/i.test(data.comment)) {
      return res.status(400).json({ error: 'Links are not allowed in reviews' });
    }

    if (!(await catalogHasProduct(data.productId))) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const recentDuplicate = await prisma.productReview.findFirst({
      where: {
        productId: String(data.productId),
        name: data.name,
        comment: data.comment,
        createdAt: { gte: new Date(Date.now() - 10 * 60_000) },
      },
    });
    if (recentDuplicate) {
      return res.status(200).json({ ok: true, pending: true, id: recentDuplicate.id, duplicate: true });
    }

    const review = await prisma.productReview.create({
      data: {
        productId: String(data.productId),
        name: data.name,
        rating: data.rating,
        comment: data.comment,
        approved: false,
      },
    });
    invalidateReviewCaches();
    console.log(`[Reviews] Pending review ${review.id} for product ${review.productId}`);
    res.status(201).json({ ok: true, pending: true, id: review.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Reviews] Create error:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

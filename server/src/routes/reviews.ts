import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { requireAuth, type AuthRequest } from '../middleware/auth';

export const reviewRouter = Router();

const createReviewSchema = z.object({
  productId: z.number(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

reviewRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const data = createReviewSchema.parse(req.body);

    const review = await prisma.review.create({
      data: {
        userId: req.userId!,
        productId: String(data.productId),
        rating: data.rating,
        comment: data.comment || '',
      },
    });

    console.log(`[Reviews] Created review ${review.id} for product ${review.productId}`);
    res.status(201).json(review);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Reviews] Create error:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

reviewRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log(`[Reviews] Fetched ${reviews.length} reviews`);
    res.json(reviews);
  } catch (err) {
    console.error('[Reviews] Fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

reviewRouter.get('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const reviews = await prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
    console.log(`[Reviews] Fetched ${reviews.length} reviews for product ${productId}`);
    res.json(reviews);
  } catch (err) {
    console.error('[Reviews] Fetch by product error:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

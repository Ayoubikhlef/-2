"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
const cache_1 = require("../utils/cache");
exports.reviewRouter = (0, express_1.Router)();
const createReviewSchema = zod_1.z.object({
    productId: zod_1.z.number(),
    rating: zod_1.z.number().int().min(1).max(5),
    comment: zod_1.z.string().max(500, 'Comment is too long').optional(),
});
exports.reviewRouter.post('/', auth_1.requireAuth, async (req, res) => {
    try {
        const data = createReviewSchema.parse(req.body);
        const review = await prisma_1.prisma.review.create({
            data: {
                userId: req.userId,
                productId: String(data.productId),
                rating: data.rating,
                comment: data.comment || '',
            },
        });
        console.log(`[Reviews] Created review ${review.id} for product ${review.productId}`);
        (0, cache_1.clearCache)('reviews:all');
        (0, cache_1.clearCache)(`reviews:${review.productId}`);
        res.status(201).json(review);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Reviews] Create error:', err);
        res.status(500).json({ error: 'Failed to create review' });
    }
});
exports.reviewRouter.get('/', async (_req, res) => {
    try {
        const cached = (0, cache_1.getCached)('reviews:all');
        if (cached)
            return res.json(cached.reviews);
        const reviews = await prisma_1.prisma.review.findMany({
            orderBy: { createdAt: 'desc' },
        });
        console.log(`[Reviews] Fetched ${reviews.length} reviews`);
        (0, cache_1.setCache)('reviews:all', { reviews }, 30_000);
        res.json(reviews);
    }
    catch (err) {
        console.error('[Reviews] Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});
exports.reviewRouter.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const cacheKey = `reviews:${productId}`;
        const cached = (0, cache_1.getCached)(cacheKey);
        if (cached)
            return res.json(cached.reviews);
        const reviews = await prisma_1.prisma.review.findMany({
            where: { productId },
            orderBy: { createdAt: 'desc' },
        });
        console.log(`[Reviews] Fetched ${reviews.length} reviews for product ${productId}`);
        (0, cache_1.setCache)(cacheKey, { reviews }, 30_000);
        res.json(reviews);
    }
    catch (err) {
        console.error('[Reviews] Fetch by product error:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});
//# sourceMappingURL=reviews.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const rag_1 = require("../services/rag");
const auth_1 = require("../middleware/auth");
const cache_1 = require("../utils/cache");
exports.productRouter = (0, express_1.Router)();
const productSchema = zod_1.z.object({
    id: zod_1.z.number(),
    nameAr: zod_1.z.string(),
    nameFr: zod_1.z.string(),
    nameEn: zod_1.z.string(),
    descAr: zod_1.z.string(),
    descFr: zod_1.z.string(),
    descEn: zod_1.z.string(),
    shortDescAr: zod_1.z.string().optional(),
    shortDescFr: zod_1.z.string().optional(),
    shortDescEn: zod_1.z.string().optional(),
    price: zod_1.z.number(),
    salePrice: zod_1.z.number().nullable().optional(),
    saleEnd: zod_1.z.string().nullable().optional(),
    sku: zod_1.z.string().optional(),
    barcode: zod_1.z.string().optional(),
    weight: zod_1.z.string().optional(),
    dimensions: zod_1.z.string().optional(),
    warranty: zod_1.z.string().optional(),
    seoKeywords: zod_1.z.string().optional(),
    image: zod_1.z.string(),
    images: zod_1.z.array(zod_1.z.string()).optional(),
    category: zod_1.z.string(),
    brand: zod_1.z.string().optional(),
    hidden: zod_1.z.boolean().optional(),
    specs: zod_1.z.array(zod_1.z.object({
        label: zod_1.z.object({ ar: zod_1.z.string(), fr: zod_1.z.string(), en: zod_1.z.string() }),
        value: zod_1.z.object({ ar: zod_1.z.string(), fr: zod_1.z.string(), en: zod_1.z.string() }),
    })).optional(),
    relatedIds: zod_1.z.array(zod_1.z.number()).optional(),
});
const syncSchema = zod_1.z.object({
    products: zod_1.z.array(productSchema),
});
const SETTINGS_KEY_PRODUCTS = 'aos_products';
exports.productRouter.post('/sync', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const { products } = syncSchema.parse(req.body);
        // Persist products as JSON in the Setting model
        await prisma_1.prisma.setting.upsert({
            where: { key: SETTINGS_KEY_PRODUCTS },
            update: { value: JSON.stringify(products) },
            create: { key: SETTINGS_KEY_PRODUCTS, value: JSON.stringify(products) },
        });
        (0, cache_1.clearCache)('products');
        await (0, rag_1.syncProducts)(products);
        res.json({ ok: true, indexed: products.length });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Product Sync Error]', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.productRouter.get('/', async (_req, res) => {
    try {
        const cached = (0, cache_1.getCached)('products');
        if (cached)
            return res.json(cached);
        const setting = await prisma_1.prisma.setting.findUnique({ where: { key: SETTINGS_KEY_PRODUCTS } });
        if (!setting) {
            return res.json({ products: [] });
        }
        const data = { products: JSON.parse(setting.value) };
        (0, cache_1.setCache)('products', data, 30_000);
        res.json(data);
    }
    catch (err) {
        console.error('[Products Fetch Error]', err);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
exports.productRouter.get('/status', (_req, res) => {
    res.json({ ragReady: (0, rag_1.isReady)() });
});
//# sourceMappingURL=products.js.map
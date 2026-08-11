"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
const cache_1 = require("../utils/cache");
exports.dataRouter = (0, express_1.Router)();
const ALLOWED_KEYS = new Set([
    'aos_products',
    'aos_services',
    'aos_coupons',
    'aos_site_settings',
    'aos_site_content',
]);
const saveSchema = zod_1.z.object({
    key: zod_1.z.string().min(1).max(64),
    value: zod_1.z.any(),
});
exports.dataRouter.post('/save', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const { key, value } = saveSchema.parse(req.body);
        if (!ALLOWED_KEYS.has(key)) {
            return res.status(400).json({ error: 'Unknown data key' });
        }
        const serialized = JSON.stringify(value);
        if (serialized.length > 5_000_000) {
            return res.status(413).json({ error: 'Value too large (max 5MB)' });
        }
        (0, cache_1.clearCache)(`data:${key}`);
        (0, cache_1.clearCache)(`data:all`);
        await prisma_1.prisma.setting.upsert({
            where: { key },
            update: { value: serialized },
            create: { key, value: serialized },
        });
        console.log(`[Data] Saved ${key} (${serialized.length} bytes)`);
        res.json({ ok: true, key });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Data] Save error:', err);
        res.status(500).json({ error: 'Failed to save data' });
    }
});
exports.dataRouter.get('/:key', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const { key } = req.params;
        const cacheKey = `data:${key}`;
        const cached = (0, cache_1.getCached)(cacheKey);
        if (cached)
            return res.json(cached);
        const setting = await prisma_1.prisma.setting.findUnique({ where: { key } });
        if (!setting) {
            return res.json({ value: null });
        }
        const data = { value: JSON.parse(setting.value) };
        (0, cache_1.setCache)(cacheKey, data, 30_000);
        res.json(data);
    }
    catch (err) {
        console.error('[Data] Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});
exports.dataRouter.delete('/:key', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const { key } = req.params;
        await prisma_1.prisma.setting.delete({ where: { key } });
        console.log(`[Data] Deleted ${key}`);
        res.json({ deleted: true, key });
    }
    catch (err) {
        if (err?.code === 'P2025') {
            return res.status(404).json({ error: 'Not found' });
        }
        console.error('[Data] Delete error:', err);
        res.status(500).json({ error: 'Failed to delete data' });
    }
});
//# sourceMappingURL=data.js.map
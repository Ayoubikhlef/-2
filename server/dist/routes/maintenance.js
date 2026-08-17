"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maintenanceRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
const cache_1 = require("../utils/cache");
exports.maintenanceRouter = (0, express_1.Router)();
const MAINTENANCE_KEY = 'aos_maintenance';
const messageSchema = zod_1.z.object({
    ar: zod_1.z.string().max(500).default(''),
    fr: zod_1.z.string().max(500).default(''),
    en: zod_1.z.string().max(500).default(''),
});
const maintenanceSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
    message: messageSchema,
});
exports.maintenanceRouter.get('/', async (_req, res) => {
    try {
        const cacheKey = `maintenance:flag`;
        const cached = (0, cache_1.getCached)(cacheKey);
        if (cached)
            return res.json(cached);
        const setting = await prisma_1.prisma.setting.findUnique({ where: { key: MAINTENANCE_KEY } });
        const data = setting ? { value: JSON.parse(setting.value) } : { value: null };
        (0, cache_1.setCache)(cacheKey, data, 10_000);
        res.json(data);
    }
    catch (err) {
        console.error('[Maintenance] Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch maintenance' });
    }
});
exports.maintenanceRouter.post('/', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const body = maintenanceSchema.parse(req.body);
        const value = { enabled: body.enabled, message: body.message };
        await prisma_1.prisma.setting.upsert({
            where: { key: MAINTENANCE_KEY },
            update: { value: JSON.stringify(value) },
            create: { key: MAINTENANCE_KEY, value: JSON.stringify(value) },
        });
        (0, cache_1.clearCache)('maintenance:flag');
        console.log(`[Maintenance] Set enabled=${body.enabled}`);
        res.json({ ok: true, enabled: body.enabled });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Maintenance] Save error:', err);
        res.status(500).json({ error: 'Failed to save maintenance' });
    }
});
//# sourceMappingURL=maintenance.js.map
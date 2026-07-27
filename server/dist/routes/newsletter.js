"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newsletterRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
exports.newsletterRouter = (0, express_1.Router)();
const subscribeSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
prisma_1.prisma.$executeRaw `CREATE TABLE IF NOT EXISTS aos_newsletter (email TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW())`.catch(() => { });
exports.newsletterRouter.post('/', async (req, res) => {
    try {
        const { email } = subscribeSchema.parse(req.body);
        await prisma_1.prisma.$executeRaw `INSERT INTO aos_newsletter (email) VALUES (${email}) ON CONFLICT (email) DO NOTHING`;
        console.log(`[Newsletter] Subscribed ${email.slice(0, 3)}***@${email.split('@')[1] || '***'}`);
        res.status(201).json({ subscribed: true, email });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Newsletter] Subscribe error:', err);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});
exports.newsletterRouter.get('/', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (_req, res) => {
    try {
        const subscribers = await prisma_1.prisma.$queryRaw `SELECT * FROM aos_newsletter ORDER BY created_at DESC`;
        console.log(`[Newsletter] Fetched subscribers`);
        res.json(subscribers);
    }
    catch (err) {
        console.error('[Newsletter] Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
});
//# sourceMappingURL=newsletter.js.map
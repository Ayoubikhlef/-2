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
exports.newsletterRouter.post('/', async (req, res) => {
    try {
        const { email } = subscribeSchema.parse(req.body);
        await prisma_1.prisma.newsletterSubscriber.upsert({
            where: { email },
            update: {},
            create: { email },
        });
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
        const subscribers = await prisma_1.prisma.newsletterSubscriber.findMany({
            orderBy: { createdAt: 'desc' },
        });
        console.log(`[Newsletter] Fetched ${subscribers.length} subscribers`);
        res.json(subscribers);
    }
    catch (err) {
        console.error('[Newsletter] Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch subscribers' });
    }
});
//# sourceMappingURL=newsletter.js.map
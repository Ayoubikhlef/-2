"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const auth_1 = require("../middleware/auth");
exports.paymentRouter = (0, express_1.Router)();
const initSchema = zod_1.z.object({
    orderId: zod_1.z.string(),
    method: zod_1.z.enum(['cib', 'edahabia', 'baridimob', 'cod']),
    phone: zod_1.z.string().optional(),
});
exports.paymentRouter.post('/init', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const { orderId, method, phone } = initSchema.parse(req.body);
        const order = await prisma_1.prisma.$queryRaw `SELECT id, total, status, wilaya FROM aos_orders WHERE id = ${orderId}`;
        if (!order.length)
            return res.status(404).json({ error: 'Order not found' });
        if (order[0].status !== 'pending')
            return res.status(400).json({ error: 'Order already processed' });
        const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        await prisma_1.prisma.$executeRaw `UPDATE aos_orders SET status = 'processing', payment_method = ${method}, payment_id = ${paymentId} WHERE id = ${orderId}`;
        console.log(`[Payment] Initiated ${method.toUpperCase()} for order ${orderId}: ${order[0].total} DZD`);
        res.json({
            success: true,
            paymentId,
            amount: order[0].total,
            method,
            instructions: getInstructions(method),
        });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError)
            return res.status(400).json({ error: 'Invalid data', details: err.errors });
        console.error('[Payment] Init error:', err);
        res.status(500).json({ error: 'Payment initialization failed' });
    }
});
exports.paymentRouter.post('/confirm', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const { paymentId } = zod_1.z.object({ paymentId: zod_1.z.string() }).parse(req.body);
        const order = await prisma_1.prisma.$queryRaw `SELECT id FROM aos_orders WHERE payment_id = ${paymentId}`;
        if (!order.length)
            return res.status(404).json({ error: 'Payment not found' });
        await prisma_1.prisma.$executeRaw `UPDATE aos_orders SET status = 'paid', paid_at = NOW() WHERE payment_id = ${paymentId}`;
        console.log(`[Payment] Confirmed ${paymentId}`);
        res.json({ success: true, status: 'paid' });
    }
    catch {
        res.status(500).json({ error: 'Confirmation failed' });
    }
});
function getInstructions(method) {
    switch (method) {
        case 'cib':
            return 'Pay by CIB card via the secure payment gateway. You will be redirected after confirmation.';
        case 'edahabia':
            return 'Pay with Edahabia card. You will be redirected to the CIP portal.';
        case 'baridimob':
            return 'Pay with BaridiMob mobile wallet. You will receive an SMS to confirm.';
        case 'cod':
            return 'Cash on delivery. Pay when you receive your order.';
        default:
            return '';
    }
}
//# sourceMappingURL=payment.js.map
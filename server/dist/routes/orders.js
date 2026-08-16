"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const whatsapp_1 = require("../services/whatsapp");
const telegram_1 = require("../services/telegram");
const live_1 = require("../services/live");
const auth_1 = require("../middleware/auth");
const cache_1 = require("../utils/cache");
exports.orderRouter = (0, express_1.Router)();
const orderItemSchema = zod_1.z.object({
    name: zod_1.z.string(),
    quantity: zod_1.z.number().int().positive(),
    price: zod_1.z.number().nonnegative(),
    total: zod_1.z.number().nonnegative(),
});
const createOrderSchema = zod_1.z.object({
    id: zod_1.z.string().optional(),
    customer: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(1),
    email: zod_1.z.string().optional(),
    wilaya: zod_1.z.string(),
    municipality: zod_1.z.string(),
    address: zod_1.z.string(),
    note: zod_1.z.string().optional(),
    items: zod_1.z.array(orderItemSchema).min(1),
    total: zod_1.z.number().nonnegative(),
    source: zod_1.z.enum(['form', 'quick-order', 'service-booking']),
    discountCode: zod_1.z.string().optional(),
});
exports.orderRouter.post('/', async (req, res) => {
    try {
        const data = createOrderSchema.parse(req.body);
        let finalTotal = data.items.reduce((sum, item) => sum + item.total, 0);
        let discountAmount = 0;
        let appliedCode;
        if (data.discountCode) {
            const setting = await prisma_1.prisma.setting.findUnique({ where: { key: 'aos_coupons' } });
            if (setting) {
                const coupons = JSON.parse(setting.value);
                const coupon = Array.isArray(coupons) ? coupons.find((c) => c.code?.toLowerCase() === data.discountCode?.toLowerCase() && c.active) : null;
                if (!coupon) {
                    return res.status(400).json({ error: 'Invalid or inactive coupon code' });
                }
                if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
                    return res.status(400).json({ error: 'Coupon has expired' });
                }
                if (coupon.minOrder > 0 && finalTotal < coupon.minOrder) {
                    return res.status(400).json({ error: `Minimum order amount is ${coupon.minOrder}` });
                }
                discountAmount = coupon.type === 'percentage'
                    ? Math.round(finalTotal * (coupon.value / 100))
                    : Math.min(coupon.value, finalTotal);
                finalTotal -= discountAmount;
                appliedCode = coupon.code;
            }
        }
        const order = await prisma_1.prisma.order.create({
            data: {
                id: data.id || undefined,
                customer: data.customer,
                phone: data.phone,
                email: data.email || '',
                wilaya: data.wilaya,
                municipality: data.municipality,
                address: data.address,
                note: data.note || '',
                total: finalTotal,
                status: 'new',
                source: data.source,
                paymentMethod: appliedCode ? ('discount:' + appliedCode) : undefined,
                items: {
                    create: data.items.map(item => ({
                        name: item.name,
                        quantity: item.quantity,
                        price: item.price,
                        total: item.total,
                    })),
                },
            },
            include: { items: true },
        });
        console.log(`[Orders] Created order ${order.id} (${order.total} DZD)`);
        (0, cache_1.clearCache)('orders:list');
        (0, live_1.emitNewOrder)(order);
        (0, whatsapp_1.sendNewOrderAlert)({
            id: order.id,
            customer: order.customer,
            phone: order.phone,
            wilaya: order.wilaya,
            municipality: order.municipality,
            address: order.address,
            total: order.total,
            items: order.items,
        });
        (0, telegram_1.sendNewOrderTelegramAlert)({
            id: order.id,
            customer: order.customer,
            phone: order.phone,
            wilaya: order.wilaya,
            municipality: order.municipality,
            address: order.address,
            total: order.total,
            items: order.items,
        });
        res.status(201).json(order);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Orders] Create error:', err);
        res.status(500).json({ error: 'Failed to create order' });
    }
});
exports.orderRouter.get('/user', auth_1.requireAuth, async (req, res) => {
    try {
        const requesterId = req.userId;
        if (!requesterId)
            return res.status(401).json({ error: 'Authentication required' });
        const requester = await prisma_1.prisma.user.findUnique({ where: { id: requesterId }, select: { email: true, phone: true, role: true } });
        if (!requester)
            return res.status(401).json({ error: 'Authentication required' });
        const isAdmin = requester.role === 'SUPER_ADMIN' || requester.role === 'ADMIN';
        const email = typeof req.query.email === 'string' ? req.query.email.trim() : '';
        const phone = typeof req.query.phone === 'string' ? req.query.phone.trim() : '';
        if (!email && !phone) {
            return res.status(400).json({ error: 'Email or phone query required' });
        }
        if (!isAdmin) {
            const matchesEmail = email && requester.email && requester.email.toLowerCase() === email.toLowerCase();
            const matchesPhone = phone && requester.phone === phone;
            if (!matchesEmail && !matchesPhone) {
                return res.status(403).json({ error: 'You can only view your own orders' });
            }
        }
        const where = {};
        if (email)
            where.email = email;
        if (phone)
            where.phone = phone;
        const orders = await prisma_1.prisma.order.findMany({
            where,
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(orders);
    }
    catch (err) {
        console.error('[Orders] Customer fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch customer orders' });
    }
});
exports.orderRouter.get('/track/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma_1.prisma.order.findUnique({
            where: { id },
            include: { items: true },
        });
        if (!order)
            return res.status(404).json({ error: 'Order not found' });
        const authReq = req;
        let isAdmin = false;
        let isOwner = false;
        if (authReq.userId) {
            const requester = await prisma_1.prisma.user.findUnique({ where: { id: authReq.userId }, select: { email: true, phone: true, role: true } });
            if (requester) {
                isAdmin = requester.role === 'SUPER_ADMIN' || requester.role === 'ADMIN';
                isOwner = Boolean((order.email && requester.email && order.email.toLowerCase() === requester.email.toLowerCase()) ||
                    (order.phone && requester.phone && order.phone === requester.phone));
            }
        }
        if (isAdmin || isOwner) {
            return res.json(order);
        }
        const { customer, email, phone, address, note, userId, ...publicOrder } = order;
        res.json(publicOrder);
    }
    catch (err) {
        console.error('[Orders] Track error:', err);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});
exports.orderRouter.get('/', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (_req, res) => {
    try {
        const cached = (0, cache_1.getCached)('orders:list');
        if (cached)
            return res.json(cached.orders);
        const orders = await prisma_1.prisma.order.findMany({
            include: { items: true },
            orderBy: { createdAt: 'desc' },
            take: 500,
        });
        console.log(`[Orders] Fetched ${orders.length} orders`);
        (0, cache_1.setCache)('orders:list', { orders }, 5_000);
        res.json(orders);
    }
    catch (err) {
        console.error('[Orders] Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
exports.orderRouter.patch('/:id/status', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = zod_1.z.object({ status: zod_1.z.enum(['new', 'processing', 'completed', 'cancelled']) }).parse(req.body);
        const updated = await prisma_1.prisma.order.update({
            where: { id },
            data: { status },
        });
        (0, whatsapp_1.sendWhatsAppNotification)(updated.phone, updated.customer, id, status, updated.total);
        (0, cache_1.clearCache)('orders:list');
        console.log(`[Orders] Updated order ${id} status to ${status}`);
        res.json(updated);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Orders] Status update error:', err);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});
exports.orderRouter.post('/delete', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const { id } = zod_1.z.object({ id: zod_1.z.string().min(1) }).parse(req.body);
        await prisma_1.prisma.order.delete({ where: { id } });
        (0, cache_1.clearCache)('orders:list');
        console.log(`[Orders] Deleted order ${id}`);
        res.json({ deleted: true, id });
    }
    catch (err) {
        if (err?.code === 'P2025') {
            return res.status(404).json({ error: 'Not found' });
        }
        console.error('[Orders] Delete error:', err);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});
exports.orderRouter.post('/clear-all', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN'), async (_req, res) => {
    try {
        const orders = await prisma_1.prisma.order.findMany({ select: { id: true } });
        const ids = orders.map(o => o.id);
        await prisma_1.prisma.orderItem.deleteMany({});
        await prisma_1.prisma.order.deleteMany({});
        (0, cache_1.clearCache)('orders:list');
        console.log(`[Orders] Cleared all ${ids.length} orders`);
        res.json({ deleted: true, count: ids.length, ids });
    }
    catch (err) {
        console.error('[Orders] Clear all error:', err);
        res.status(500).json({ error: 'Failed to clear orders' });
    }
});
exports.orderRouter.delete('/:id', auth_1.requireAuth, (0, auth_1.requireRole)('SUPER_ADMIN', 'ADMIN'), async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.prisma.order.delete({ where: { id } });
        console.log(`[Orders] Deleted order ${id}`);
        res.json({ deleted: true, id });
    }
    catch (err) {
        if (err?.code === 'P2025') {
            return res.status(404).json({ error: 'Not found' });
        }
        console.error('[Orders] Delete error:', err);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});
//# sourceMappingURL=orders.js.map
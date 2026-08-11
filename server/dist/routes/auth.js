"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = require("../utils/prisma");
const jwt_1 = require("../utils/jwt");
const errors_1 = require("../utils/errors");
const auth_1 = require("../middleware/auth");
exports.authRouter = (0, express_1.Router)();
const gateSchema = zod_1.z.object({
    code: zod_1.z.string().min(1),
});
exports.authRouter.post('/admin-gate', async (req, res) => {
    try {
        const { code } = gateSchema.parse(req.body);
        const expected = process.env.ADMIN_GATE_CODE || '';
        if (!expected) {
            return res.status(503).json({ error: 'Gate not configured' });
        }
        if (code !== expected) {
            return res.status(401).json({ error: 'Invalid gate code' });
        }
        res.json({ ok: true });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Auth] Gate error:', err);
        res.status(500).json({ error: 'Gate check failed' });
    }
});
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8),
    name: zod_1.z.string().min(2),
    phone: zod_1.z.string().optional(),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
exports.authRouter.post('/register', async (req, res) => {
    const { email, password, name, phone } = registerSchema.parse(req.body);
    const exists = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (exists)
        throw new errors_1.Conflict('Email already registered');
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const user = await prisma_1.prisma.user.create({
        data: { email, passwordHash, name, phone },
    });
    const accessToken = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role });
    const refreshToken = (0, jwt_1.signRefreshToken)({ userId: user.id });
    await prisma_1.prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
    });
});
exports.authRouter.post('/login', async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw new errors_1.BadRequest('Invalid email or password');
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid)
        throw new errors_1.BadRequest('Invalid email or password');
    if (!user.isActive)
        throw new errors_1.Unauthorized('Account is deactivated');
    const accessToken = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role });
    const refreshToken = (0, jwt_1.signRefreshToken)({ userId: user.id });
    await prisma_1.prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
    });
});
const forgotSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
const resetSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string().min(4).max(8),
    password: zod_1.z.string().min(8),
});
const resetCodes = new Map();
function sendSmsNotification(phone, message) {
    const phoneClean = phone.replace(/[^0-9]/g, '');
    const country = phoneClean.startsWith('213') ? phoneClean : `213${phoneClean.replace(/^0/, '')}`;
    const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL;
    const fetchPromise = webhookUrl
        ? fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: country,
                type: 'text',
                text: message,
            }),
        })
        : Promise.resolve();
    fetchPromise.catch(err => console.error('[Auth] WhatsApp reset code error:', err));
}
exports.authRouter.post('/forgot-password', async (req, res) => {
    try {
        const { email } = forgotSchema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: 'No account found with this email' });
        }
        const code = String(Math.floor(100000 + Math.random() * 900000));
        resetCodes.set(email.toLowerCase(), { code, expiresAt: Date.now() + 10 * 60 * 1000 });
        if (user.phone) {
            const message = `رمز استرجاع كلمة المرور: ${code} (صالح 10 دقائق)`;
            sendSmsNotification(user.phone, message);
        }
        console.log(`[Auth] Reset code generated for ${email.slice(0, 3)}*** (${user.phone ? 'sent via WhatsApp' : 'no phone on file'})`);
        res.json({ ok: true });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Auth] Forgot password error:', err);
        res.status(500).json({ error: 'Failed to send reset code' });
    }
});
exports.authRouter.post('/reset-password', async (req, res) => {
    try {
        const { email, code, password } = resetSchema.parse(req.body);
        const key = email.toLowerCase();
        const entry = resetCodes.get(key);
        if (!entry || entry.expiresAt < Date.now()) {
            resetCodes.delete(key);
            return res.status(400).json({ error: 'Code expired. Request a new one.' });
        }
        if (entry.code !== code) {
            return res.status(400).json({ error: 'Invalid code' });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user)
            return res.status(404).json({ error: 'No account found with this email' });
        const passwordHash = await bcryptjs_1.default.hash(password, 12);
        await prisma_1.prisma.user.update({ where: { id: user.id }, data: { passwordHash, refreshToken: null } });
        resetCodes.delete(key);
        res.clearCookie('refreshToken');
        console.log(`[Auth] Password reset for ${email.slice(0, 3)}***`);
        res.json({ ok: true });
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: err.errors });
        }
        console.error('[Auth] Reset password error:', err);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});
exports.authRouter.post('/refresh', async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token)
        throw new errors_1.Unauthorized('No refresh token');
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(token);
    }
    catch {
        throw new errors_1.Unauthorized('Invalid refresh token');
    }
    const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || user.refreshToken !== token || !user.isActive) {
        throw new errors_1.Unauthorized('Invalid refresh token');
    }
    const accessToken = (0, jwt_1.signAccessToken)({ userId: user.id, role: user.role });
    const refreshToken = (0, jwt_1.signRefreshToken)({ userId: user.id });
    await prisma_1.prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        accessToken,
    });
});
exports.authRouter.post('/logout', auth_1.requireAuth, async (req, res) => {
    await prisma_1.prisma.user.update({
        where: { id: req.userId },
        data: { refreshToken: null },
    });
    res.clearCookie('refreshToken');
    res.json({ message: 'Logged out' });
});
exports.authRouter.get('/me', auth_1.requireAuth, async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.userId },
        include: { addresses: true },
    });
    if (!user)
        throw new errors_1.Unauthorized('User not found');
    res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        addresses: user.addresses,
    });
});
//# sourceMappingURL=auth.js.map
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
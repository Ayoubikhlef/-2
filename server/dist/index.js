"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const auth_1 = require("./routes/auth");
const chat_1 = require("./routes/chat");
const products_1 = require("./routes/products");
const orders_1 = require("./routes/orders");
const reviews_1 = require("./routes/reviews");
const newsletter_1 = require("./routes/newsletter");
const loyalty_1 = require("./routes/loyalty");
const data_1 = require("./routes/data");
const maintenance_1 = require("./routes/maintenance");
const email_1 = require("./routes/email");
const payment_1 = require("./routes/payment");
const errorHandler_1 = require("./middleware/errorHandler");
const live_1 = require("./services/live");
const rag_1 = require("./services/rag");
const prisma_1 = require("./utils/prisma");
const cors_2 = require("./utils/cors");
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const PORT = Number(process.env.PORT) || 3001;
app.use((0, helmet_1.default)({
    strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: true },
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: (origin, cb) => {
        if ((0, cors_2.isOriginAllowed)(origin))
            cb(null, true);
        else
            cb(null, false);
    },
    credentials: true,
}));
app.use((0, compression_1.default)({ level: 6 }));
app.use(express_1.default.json({ limit: '1mb' }));
app.use((0, cookie_parser_1.default)());
app.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
});
const authLimiter = (0, express_rate_limit_1.default)({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many attempts' }, validate: { xForwardedForHeader: false } });
const orderLimiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, max: 200, message: { error: 'Too many requests' }, validate: { xForwardedForHeader: false } });
const generalLimiter = (0, express_rate_limit_1.default)({ windowMs: 60 * 1000, max: 600, message: { error: 'Too many requests' }, validate: { xForwardedForHeader: false } });
app.use('/api/auth', authLimiter);
app.use('/api/newsletter', generalLimiter);
app.use('/api/chat', generalLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/loyalty', orderLimiter);
app.use('/api/reviews', generalLimiter);
app.use('/api/auth', auth_1.authRouter);
app.use('/api/chat', chat_1.chatRouter);
app.use('/api/products', products_1.productRouter);
app.use('/api/orders', orders_1.orderRouter);
app.use('/api/reviews', reviews_1.reviewRouter);
app.use('/api/newsletter', newsletter_1.newsletterRouter);
app.use('/api/loyalty', loyalty_1.loyaltyRouter);
app.use('/api/data', data_1.dataRouter);
app.use('/api/maintenance', maintenance_1.maintenanceRouter);
app.use('/api/email', email_1.emailRouter);
app.use('/api/payment', payment_1.paymentRouter);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});
const distPath = path_1.default.resolve(__dirname, '../../dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
    app.use(express_1.default.static(distPath, { maxAge: '1h', etag: true, lastModified: true }));
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(distPath, 'index.html'));
    });
}
app.use(errorHandler_1.errorHandler);
async function initDb() {
    try {
        await prisma_1.prisma.$executeRaw `CREATE INDEX IF NOT EXISTS idx_orders_created ON aos_orders (created_at DESC)`;
        await prisma_1.prisma.$executeRaw `CREATE INDEX IF NOT EXISTS idx_orders_status ON aos_orders (status)`;
        await prisma_1.prisma.$executeRaw `CREATE INDEX IF NOT EXISTS idx_newsletter_created ON aos_newsletter (created_at DESC)`;
    }
    catch { /* table may not exist yet */ }
}
(0, live_1.initLive)(server);
(0, rag_1.initRAG)();
initDb();
server.listen(PORT, '0.0.0.0', () => {
    const networkInterfaces = Object.values(require('os').networkInterfaces()).flat();
    const ip = networkInterfaces.find((i) => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
    console.log(`[AOS Server] Running on http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map
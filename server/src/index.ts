import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import http from 'http';
import { authRouter } from './routes/auth';
import { chatRouter } from './routes/chat';
import { productRouter } from './routes/products';
import { orderRouter } from './routes/orders';
import { reviewRouter } from './routes/reviews';
import { newsletterRouter } from './routes/newsletter';
import { loyaltyRouter } from './routes/loyalty';
import { dataRouter } from './routes/data';
import { maintenanceRouter } from './routes/maintenance';
import { emailRouter } from './routes/email';
import { paymentRouter } from './routes/payment';
import { errorHandler } from './middleware/errorHandler';
import { initLive } from './services/live';
import { initRAG } from './services/rag';
import { prisma } from './utils/prisma';
import { isOriginAllowed } from './utils/cors';

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3001;

app.use(helmet({
  strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://va.vercel-scripts.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["https://www.google.com", "https://www.google.dz", "https://www.google.co.dz"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
}));
app.use(cors({
  origin: (origin, cb) => {
    if (isOriginAllowed(origin)) cb(null, true);
    else cb(null, false);
  },
  credentials: true,
}));
app.use(compression({ level: 6 }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: { error: 'Too many attempts' }, validate: { xForwardedForHeader: false } });
const adminGateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many gate attempts' }, validate: { xForwardedForHeader: false } });
const passwordResetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many reset attempts' }, validate: { xForwardedForHeader: false } });
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 200, message: { error: 'Too many requests' }, validate: { xForwardedForHeader: false } });
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 600, message: { error: 'Too many requests' }, validate: { xForwardedForHeader: false } });
app.use('/api/auth', authLimiter);
app.use('/api/auth/admin-gate', adminGateLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/newsletter', generalLimiter);
app.use('/api/chat', generalLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/loyalty', orderLimiter);
app.use('/api/reviews', generalLimiter);

app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/loyalty', loyaltyRouter);
app.use('/api/data', dataRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/email', emailRouter);
app.use('/api/payment', paymentRouter);

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected', uptime: process.uptime(), timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.json({ status: 'ok', db: 'error', dbError: err.message, uptime: process.uptime() });
  }
});

const distPath = path.resolve(__dirname, '../../dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1h', etag: true, lastModified: true }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);

async function initDb() {
  try {
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_orders_created ON "Order" ("createdAt" DESC)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_orders_status ON "Order" (status)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_newsletter_created ON aos_newsletter ("createdAt" DESC)`);
  } catch { /* table may not exist yet */ }
}

async function ensureAdmin() {
  try {
    const bcrypt = await import('bcryptjs');
    const email = process.env.SEED_ADMIN_EMAIL || 'admin@aos.dz';
    const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@AOS2025!';
    const hash = await bcrypt.hash(password, 12);
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      if (existing.passwordHash !== hash) {
        await prisma.user.update({ where: { id: existing.id }, data: { passwordHash: hash } });
        console.log('[AOS] Admin password updated');
      }
    } else {
      await prisma.user.create({
        data: { email, passwordHash: hash, name: 'Admin AOS', role: 'SUPER_ADMIN', phone: '' },
      });
      console.log('[AOS] Admin user created');
    }
  } catch { /* DB may not be ready yet */ }
}

initLive(server);
initRAG();
initDb().then(() => ensureAdmin());

server.listen(PORT, '0.0.0.0', () => {
  const networkInterfaces: any[] = Object.values(require('os').networkInterfaces()).flat();
  const ip: string = networkInterfaces.find((i: any) => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
  console.log(`[AOS Server] Running on http://localhost:${PORT}`);
});

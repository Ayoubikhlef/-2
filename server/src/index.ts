import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
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
import { securityRouter } from './routes/security';
import { errorHandler } from './middleware/errorHandler';
import { securityMonitor, securityRateLimitHandler } from './services/security';
import { ensureSeedAdmin } from './services/adminBootstrap';
import { initLive } from './services/live';
import { initRAG } from './services/rag';
import { prisma } from './utils/prisma';
import { isOriginAllowed } from './utils/cors';
import { fixMojibakeData } from './utils/encoding';

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3001;

// Vercel/Render terminate TLS in front of the API, so trust one proxy hop
// to get the real client IP for rate limiting and security alerts.
app.set('trust proxy', 1);

app.use(helmet({
  strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://va.vercel-scripts.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://iueefgma6y.onrender.com", "https://aos-api-production.up.railway.app", "https://docs.google.com"],
      workerSrc: ["'self'", "blob:"],
      frameSrc: ["https://www.google.com", "https://www.google.dz", "https://www.google.co.dz"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
}));
app.use(cors({
  origin: (origin, cb) => {
    // Same-origin / non-browser clients omit Origin — allow them.
    if (!origin) return cb(null, true);
    if (isOriginAllowed(origin)) cb(null, true);
    else cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
}));
app.use(compression({ level: 6 }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(hpp());

app.use(securityMonitor);

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, handler: securityRateLimitHandler('auth'), validate: { xForwardedForHeader: false } });
const adminGateLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, handler: securityRateLimitHandler('admin-gate'), validate: { xForwardedForHeader: false } });
const passwordResetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, handler: securityRateLimitHandler('password-reset'), validate: { xForwardedForHeader: false } });
const orderLimiter = rateLimit({ windowMs: 60 * 1000, max: 200, handler: securityRateLimitHandler('orders'), validate: { xForwardedForHeader: false } });
const generalLimiter = rateLimit({ windowMs: 60 * 1000, max: 600, handler: securityRateLimitHandler('general'), validate: { xForwardedForHeader: false } });
app.use('/api/auth', authLimiter);
app.use('/api/auth/admin-gate', adminGateLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/newsletter', generalLimiter);
app.use('/api/chat', generalLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/loyalty', orderLimiter);
app.use('/api/reviews', generalLimiter);
app.use('/api/products', generalLimiter);
app.use('/api/data', generalLimiter);
app.use('/api/maintenance', generalLimiter);
app.use('/api/email', generalLimiter);
app.use('/api/payment', orderLimiter);

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
app.use('/api/security', generalLimiter, securityRouter);

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
  } catch { /* table may not exist yet */ }
}

// The production database was created before AuditLog was added to the Prisma
// schema. Keep this idempotent so the Security Center history works even when
// the Render start command does not run `prisma db push`.
async function ensureAuditLogTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT NOT NULL,
        "userId" TEXT,
        "action" TEXT NOT NULL,
        "resource" TEXT,
        "details" JSONB,
        "ipAddress" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog" ("action", "createdAt" DESC)`
    );
    console.log('[AOS] AuditLog table ready');
  } catch (err) {
    console.error('[AOS] Failed to ensure AuditLog table:', err);
  }
}

// Older production databases predate the delivery columns. Render's start
// command may not run `prisma db push`, so add them idempotently at boot.
async function ensureOrderDeliveryColumns() {
  const statements = [
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "wilayaId" INTEGER`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveryMethod" TEXT`,
  ];

  try {
    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('[AOS] Order delivery columns ready');
  } catch (err) {
    console.error('[AOS] Failed to ensure Order delivery columns:', err);
  }
}

async function fixMojibakeSettings() {
  try {
    const settings = await prisma.setting.findMany();
    let fixedCount = 0;
    for (const setting of settings) {
      try {
        const parsed = JSON.parse(setting.value);
        const fixed = fixMojibakeData(parsed);
        const fixedJson = JSON.stringify(fixed);
        if (fixedJson !== setting.value) {
          await prisma.setting.update({
            where: { key: setting.key },
            data: { value: fixedJson },
          });
          fixedCount++;
          console.log(`[AOS] Fixed mojibake in setting: ${setting.key}`);
        }
      } catch { /* not JSON or other error, skip */ }
    }
    if (fixedCount > 0) {
      console.log(`[AOS] Fixed mojibake in ${fixedCount} settings`);
    } else {
      console.log('[AOS] No mojibake detected in settings');
    }
  } catch (e) {
    console.error('[AOS] fixMojibakeSettings error:', e);
  }
}

async function startServer() {
  initLive(server);
  initRAG();
  // Run schema repairs before accepting traffic so an old database cannot
  // produce 500s on the first requests after a deploy.
  await ensureAuditLogTable();
  await ensureOrderDeliveryColumns();
  await ensureSeedAdmin();
  void fixMojibakeSettings();
  initDb();

  server.listen(PORT, '0.0.0.0', () => {
    const networkInterfaces: any[] = Object.values(require('os').networkInterfaces()).flat();
    const ip: string = networkInterfaces.find((i: any) => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
    console.log(`[AOS Server] Running on http://localhost:${PORT}`);
  });
}

void startServer();

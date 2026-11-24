import 'express-async-errors';
import express from 'express';
import type { Request } from 'express';
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
import { aiRouter } from './routes/ai';
import { productRouter } from './routes/products';
import { orderRouter, cancelStaleOrders } from './routes/orders';
import { customersRouter } from './routes/customers';
import { reviewRouter } from './routes/reviews';
import { newsletterRouter } from './routes/newsletter';
import { contactRouter } from './routes/contact';
import { loyaltyRouter } from './routes/loyalty';
import { dataRouter } from './routes/data';
import { maintenanceRouter } from './routes/maintenance';
import { emailRouter } from './routes/email';
import { paymentRouter } from './routes/payment';
import { securityRouter } from './routes/security';
import { backupRouter } from './routes/backup';
import { siteFactoryRouter } from './routes/siteFactory';
import { siteAdminRouter } from './routes/siteAdmin';
import { subscriptionRouter } from './routes/subscription';
import { calculatorRouter } from './routes/calculator';
import { visitRouter } from './routes/visits';
import { errorHandler } from './middleware/errorHandler';
import { securityMonitor, securityRateLimitHandler } from './services/security';
import { ensureSeedAdmin } from './services/adminBootstrap';
import { initLive } from './services/live';
import { initRAG } from './services/rag';
import { startBackupScheduler } from './services/backup';
import { prisma } from './utils/prisma';
import { isOriginAllowed } from './utils/cors';
import { isTrustedProxy, resolveClientIp } from './utils/trustProxy';
import { fixMojibakeData } from './utils/encoding';
import { ensureSiteFactoryDefaults } from './site-factory/service';

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3001;

// Vercel/Render terminate TLS in front of the API and may forward through
// more than one internal hop. Trust only private hops so the real client IP is
// resolved for rate limiting and security alerts, while a public address from
// X-Forwarded-For (attacker-controlled) is never trusted.
app.set('trust proxy', isTrustedProxy);

app.use(helmet({
  strictTransportSecurity: { maxAge: 31536000, includeSubDomains: true, preload: true },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://va.vercel-scripts.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "https://iueefgma6y.onrender.com", "https://docs.google.com"],
      workerSrc: ["'self'", "blob:"],
      frameSrc: ["https://www.google.com", "https://www.google.dz", "https://www.google.co.dz"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
}));
const apiCors = cors({
  origin: (origin, cb) => {
    // Same-origin / non-browser clients omit Origin — allow them.
    if (!origin) return cb(null, true);
    if (isOriginAllowed(origin)) cb(null, true);
    else cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
});

// Generated client websites live on *.pages.dev (and later their own domains),
// so their public endpoints and previews need a wildcard CORS policy. Never
// enable credentials here: these routes are unauthenticated by design.
const factoryCors = cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With'],
  maxAge: 600,
});
app.use(['/api/site-factory/public', '/api/site-factory/preview'], factoryCors);
app.use((req, res, next) => {
  const path = req.path || '';
  if (path.startsWith('/api/site-factory/public') || path.startsWith('/api/site-factory/preview')) {
    return next();
  }
  return apiCors(req, res, next);
});
app.use(compression({ level: 6 }));

// Website requests include compressed logos, covers, product images and
// receipts as data URLs, so only the factory endpoints get the larger limit.
// The raw body is kept for the Chargily webhook signature (HMAC of the exact
// bytes), while every other route keeps using the parsed JSON.
const standardJson = express.json({
  limit: '1mb',
  verify: (req, _res, buffer) => {
    (req as any).rawBody = Buffer.from(buffer);
  },
});
const factoryJson = express.json({ limit: '12mb' });
app.use((req, res, next) => {
  const path = req.path || '';
  if (path.startsWith('/api/site-factory') || path.startsWith('/api/site-admin')) return factoryJson(req, res, next);
  return standardJson(req, res, next);
});
app.use(cookieParser());
app.use(hpp());

// The email-confirmation and password-reset screens submit plain HTML forms
// (no JavaScript), so those endpoints accept form encoding in addition to JSON.
// The reset page cannot rely on an inline script: the edge CSP can override the
// page's nonce policy, which used to turn the form into a native GET that
// dropped the token and leaked the password into the address bar.
app.use(
  ['/api/auth/verify-email', '/api/auth/reset-password'],
  express.urlencoded({ extended: false, limit: '8kb' })
);

app.use(securityMonitor);

app.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});

// Behind Cloudflare -> Vercel -> Render, req.ip stops at the shared edge, so a
// limiter keyed on it would let one visitor exhaust the limit for everyone
// routed through that edge (register allows only 5/hour, for example). Key
// every limiter on the resolved visitor instead.
const visitorKey = (req: Request): string => resolveClientIp(req) || 'unknown';
const limiter = (options: Parameters<typeof rateLimit>[0]) =>
  rateLimit({ ...options, keyGenerator: visitorKey, validate: { xForwardedForHeader: false } });

const authLimiter = limiter({ windowMs: 15 * 60 * 1000, max: 100, handler: securityRateLimitHandler('auth') });
const adminGateLimiter = limiter({ windowMs: 15 * 60 * 1000, max: 20, handler: securityRateLimitHandler('admin-gate') });
const passwordResetLimiter = limiter({ windowMs: 15 * 60 * 1000, max: 10, handler: securityRateLimitHandler('password-reset') });
// Account creation sends an email, so it is limited per visitor as well as per account.
const registerLimiter = limiter({ windowMs: 60 * 60 * 1000, max: 5, handler: securityRateLimitHandler('register') });
const orderLimiter = limiter({ windowMs: 60 * 1000, max: 600, handler: securityRateLimitHandler('orders') });
const generalLimiter = limiter({ windowMs: 60 * 1000, max: 600, handler: securityRateLimitHandler('general') });
const contactLimiter = limiter({ windowMs: 10 * 60 * 1000, max: 12, handler: securityRateLimitHandler('contact') });
// Generation costs a provider quota, so the public generator is stricter than
// the general API limit. Subscribers share the same per-visitor cap (fair use).
const aiLimiter = limiter({ windowMs: 10 * 60 * 1000, max: 30, handler: securityRateLimitHandler('ai') });
const checkoutLimiter = limiter({ windowMs: 15 * 60 * 1000, max: 20, handler: securityRateLimitHandler('checkout') });
// A snapshot contains the whole database, so it is limited to a handful of
// owner-triggered downloads per hour.
const snapshotLimiter = limiter({ windowMs: 60 * 60 * 1000, max: 6, handler: securityRateLimitHandler('snapshot') });
// The public counter is called once per page load; this cap stops a script
// from inflating the number with repeated POSTs.
const visitLimiter = limiter({ windowMs: 60 * 1000, max: 30, handler: securityRateLimitHandler('visits') });
app.use('/api/auth', authLimiter);
app.use('/api/auth/admin-gate', adminGateLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);
app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/resend-verification', passwordResetLimiter);
app.use('/api/newsletter', generalLimiter);
app.use('/api/contact', contactLimiter);
app.use('/api/chat', generalLimiter);
app.use('/api/ai/generate', aiLimiter);
app.use('/api/subscription/checkout', checkoutLimiter);
app.use('/api/subscription', generalLimiter);
app.use('/api/calculator', generalLimiter);
app.use('/api/orders', orderLimiter);
app.use('/api/customers', generalLimiter);
app.use('/api/loyalty', orderLimiter);
app.use('/api/reviews', generalLimiter);
app.use('/api/products', generalLimiter);
app.use('/api/data', generalLimiter);
app.use('/api/maintenance', generalLimiter);
app.use('/api/email', generalLimiter);
app.use('/api/payment', orderLimiter);

app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/ai', aiRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/customers', customersRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/contact', contactRouter);
app.use('/api/loyalty', loyaltyRouter);
app.use('/api/data', dataRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/email', emailRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/security', generalLimiter, securityRouter);
// Deliberately not mounted at /api/backup: the security monitor treats
// /backup as a scanner path and would block the owner. Only the routes that
// touch the whole database share the strict limit; /status is polled by the
// admin panel every 30 seconds and must not exhaust it.
app.use('/api/snapshots/download', snapshotLimiter);
app.use('/api/snapshots/run', snapshotLimiter);
app.use('/api/snapshots', generalLimiter, backupRouter);
app.use('/api/site-factory', siteFactoryRouter);
app.use('/api/site-admin', siteAdminRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/calculator', calculatorRouter);
app.use('/api/visits', visitLimiter, visitRouter);

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    // Public liveness only: no uptime, environment flags or error internals.
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.error('[Health] Database check failed:', err?.message || err);
    res.status(503).json({ status: 'error', timestamp: new Date().toISOString() });
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
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_orders_phone ON "Order" (phone)`);
    await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_orders_email ON "Order" (email)`);
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

// Order hardening runs before traffic is accepted: stock restoration and
// status history must exist even if the host skipped `prisma db push`.
async function ensureOrderHardeningSchema() {
  const statements = [
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountCode" TEXT`,
    `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stockRestoredAt" TIMESTAMP(3)`,
    `ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "catalogProductId" INTEGER`,
    `CREATE TABLE IF NOT EXISTS "OrderStatusEvent" (
      "id" TEXT NOT NULL,
      "orderId" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "note" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "OrderStatusEvent_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "OrderStatusEvent_orderId_fkey" FOREIGN KEY ("orderId")
        REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS "OrderStatusEvent_orderId_createdAt_idx"
      ON "OrderStatusEvent"("orderId", "createdAt")`,
  ];

  try {
    for (const sql of statements) {
      await prisma.$executeRawUnsafe(sql);
    }
    console.log('[AOS] Order hardening schema ready');
  } catch (err) {
    console.error('[AOS] Failed to ensure Order hardening schema:', err);
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

// Render's free instance sleeps after 15 minutes without inbound traffic, so
// the first visitor (or order) of the day waits ~1 minute. A cheap request to
// our own public URL every 10 minutes keeps the API warm. It runs only during
// the store's active hours to stay well inside Render's 750 free hours/month
// (a 24/7 service plus deploy overlaps can otherwise hit the cap and get
// suspended). Set KEEP_ALIVE=off to disable, or override the URL with
// KEEP_ALIVE_URL.
const KEEP_ALIVE_INTERVAL_MS = 10 * 60 * 1000;

function parseKeepAliveHour(value: string | undefined, fallback: number) {
  if (value === undefined || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 24) return fallback;
  return Math.floor(parsed) % 24;
}

// Africa/Algiers (UTC+1). Default 05:00 -> 01:00. Set both to 0 for 24/7.
const KEEP_ALIVE_START_HOUR = parseKeepAliveHour(process.env.KEEP_ALIVE_START_HOUR, 5);
const KEEP_ALIVE_END_HOUR = parseKeepAliveHour(process.env.KEEP_ALIVE_END_HOUR, 1);

// Surfaced by /api/health so the keep-alive can be verified from outside
// Render's dashboard (no secrets are exposed).
const keepAliveStatus = {
  enabled: process.env.KEEP_ALIVE !== 'off',
  intervalMinutes: KEEP_ALIVE_INTERVAL_MS / 60_000,
  window: `${String(KEEP_ALIVE_START_HOUR).padStart(2, '0')}:00-${String(KEEP_ALIVE_END_HOUR).padStart(2, '0')}:00 Africa/Algiers`,
  lastPingAt: null as string | null,
  lastStatus: null as number | null,
  lastError: null as string | null,
};

function isWithinKeepAliveWindow(now = new Date()) {
  if (KEEP_ALIVE_START_HOUR === KEEP_ALIVE_END_HOUR) return true;
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Algiers',
      hour: 'numeric',
      hour12: false,
    }).format(now),
  ) % 24;
  if (KEEP_ALIVE_START_HOUR < KEEP_ALIVE_END_HOUR) {
    return hour >= KEEP_ALIVE_START_HOUR && hour < KEEP_ALIVE_END_HOUR;
  }
  return hour >= KEEP_ALIVE_START_HOUR || hour < KEEP_ALIVE_END_HOUR;
}

function startKeepAlive() {
  if (process.env.KEEP_ALIVE === 'off') return;

  const baseUrl = process.env.RENDER_EXTERNAL_URL || 'https://iueefgma6y.onrender.com';
  const url = process.env.KEEP_ALIVE_URL || `${baseUrl.replace(/\/+$/, '')}/api/health`;

  const ping = async () => {
    if (!isWithinKeepAliveWindow()) return;
    keepAliveStatus.lastPingAt = new Date().toISOString();
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(60_000),
        headers: { 'User-Agent': 'aos-keep-alive' },
      });
      keepAliveStatus.lastStatus = res.status;
      keepAliveStatus.lastError = null;
      console.log(`[keep-alive] ${res.status} ${url}`);
    } catch (err) {
      keepAliveStatus.lastStatus = null;
      keepAliveStatus.lastError = (err as Error).message;
      console.warn('[keep-alive] ping failed:', (err as Error).message);
    }
  };

  // First ping shortly after boot so a deploy re-arms the timer quickly.
  setTimeout(() => void ping(), 60_000).unref();
  setInterval(() => void ping(), KEEP_ALIVE_INTERVAL_MS).unref();
  console.log(`[keep-alive] enabled -> ${url}`);
}

async function startServer() {
  initLive(server);
  initRAG();
  // Run schema repairs before accepting traffic so an old database cannot
  // produce 500s on the first requests after a deploy.
  await ensureAuditLogTable();
  await ensureOrderDeliveryColumns();
  await ensureOrderHardeningSchema();
  await ensureSeedAdmin();
  try {
    await ensureSiteFactoryDefaults();
    console.log('[AOS] Website factory defaults ready');
  } catch (err) {
    console.error('[AOS] Website factory defaults failed (run prisma db push):', err);
  }
  void fixMojibakeSettings();
  initDb();

  server.listen(PORT, '0.0.0.0', () => {
    const networkInterfaces: any[] = Object.values(require('os').networkInterfaces()).flat();
    const ip: string = networkInterfaces.find((i: any) => i.family === 'IPv4' && !i.internal)?.address || 'localhost';
    console.log(`[AOS Server] Running on http://localhost:${PORT}`);
    startKeepAlive();
    startBackupScheduler();

    // Unconfirmed product orders reserve stock; release it after the timeout
    // instead of leaving the catalog permanently drained.
    void cancelStaleOrders().catch((err) => {
      console.error('[AOS] Initial stale-order cleanup failed:', err);
    });
    setInterval(() => {
      void cancelStaleOrders().catch((err) => {
        console.error('[AOS] Stale-order cleanup failed:', err);
      });
    }, 60 * 60 * 1000).unref();
  });
}

void startServer();

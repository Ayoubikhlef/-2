import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError, BadRequest } from '../utils/errors';
import { requireAuth, requireRole } from '../middleware/auth';
import * as factory from '../site-factory/service';
import { isCloudflareConfigured } from '../site-factory/cloudflare';
import { normalizeSubdomain } from '../site-factory/subdomain';

export const siteFactoryRouter = Router();

const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'طلبات كثيرة في وقت قصير. انتظر دقيقة ثم حاول مجدداً.' }),
  validate: { xForwardedForHeader: false },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'تم استلام طلبات كثيرة. انتظر قليلاً قبل المحاولة مجدداً.' }),
  validate: { xForwardedForHeader: false },
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'محاولات رفع كثيرة. انتظر بعض الوقت ثم أعد المحاولة.' }),
  validate: { xForwardedForHeader: false },
});

function parseBody<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue?.path?.length ? `${issue.path.join('.')}: ` : '';
    throw new BadRequest(`${field}${issue?.message || 'بيانات غير صحيحة.'}`);
  }
  return result.data;
}

const phoneField = z
  .string()
  .trim()
  .min(8, 'رقم الهاتف مطلوب.')
  .max(24, 'رقم الهاتف طويل جداً.')
  .refine((value) => {
    const digits = value.replace(/\D/g, '');
    return digits.length >= 8 && digits.length <= 15;
  }, 'رقم الهاتف غير صحيح. مثال: 0674113290');

const optionalEmail = z
  .string()
  .trim()
  .max(160, 'البريد الإلكتروني طويل جداً.')
  .optional()
  .nullable()
  .transform((value) => (value ? value : undefined))
  .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value), 'البريد الإلكتروني غير صحيح.');

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'اللون يجب أن يكون بصيغة #RRGGBB.');

const productSchema = z.object({
  name: z.string().trim().min(1, 'اسم المنتج مطلوب.').max(120, 'اسم المنتج طويل جداً.'),
  description: z.string().max(500, 'وصف المنتج طويل جداً.').optional().nullable(),
  price: z.number().min(0, 'السعر لا يمكن أن يكون سالباً.').max(10_000_000, 'السعر كبير جداً.'),
  imageUrl: z.string().max(250_000, 'صورة المنتج كبيرة جداً.').optional().nullable(),
  category: z.string().max(60, 'اسم التصنيف طويل جداً.').optional().nullable(),
});

const serviceSchema = z.object({
  title: z.string().trim().min(1, 'عنوان الخدمة مطلوب.').max(120, 'عنوان الخدمة طويل جداً.'),
  description: z.string().max(400, 'وصف الخدمة طويل جداً.').optional().default(''),
});

const createRequestSchema = z.object({
  templateSlug: z.string().min(1, 'اختر قالباً.'),
  packageSlug: z.string().min(1, 'اختر باقة.'),
  siteName: z.string().trim().min(2, 'اسم الموقع مطلوب (حرفان على الأقل).').max(80, 'اسم الموقع طويل جداً.'),
  businessName: z.string().max(120, 'اسم النشاط طويل جداً.').optional().nullable(),
  category: z.string().max(60, 'التصنيف طويل جداً.').optional().nullable(),
  tagline: z.string().max(120, 'العبارة التعريفية طويلة جداً.').optional().nullable(),
  description: z.string().max(900, 'الوصف طويل جداً (900 حرف كحد أقصى).').optional().nullable(),
  phone: phoneField,
  email: optionalEmail,
  whatsapp: z.string().max(24, 'رقم واتساب غير صحيح.').optional().nullable(),
  address: z.string().max(220, 'العنوان طويل جداً.').optional().nullable(),
  city: z.string().max(80, 'اسم المدينة طويل جداً.').optional().nullable(),
  language: z.enum(['ar', 'fr', 'en']).default('ar'),
  primaryColor: hexColor.optional(),
  secondaryColor: hexColor.optional(),
  logoUrl: z.string().max(250_000, 'الشعار كبير جداً (120KB كحد أقصى).').optional().nullable(),
  coverUrl: z.string().max(600_000, 'صورة الغلاف كبيرة جداً (300KB كحد أقصى).').optional().nullable(),
  socials: z
    .object({
      facebook: z.string().max(300).optional().nullable(),
      instagram: z.string().max(300).optional().nullable(),
      tiktok: z.string().max(300).optional().nullable(),
    })
    .optional(),
  hours: z.string().max(120, 'أوقات العمل طويلة جداً.').optional().nullable(),
  services: z.array(serviceSchema).max(8, 'الحد الأقصى 8 خدمات.').optional(),
  products: z.array(productSchema).max(30, 'الحد الأقصى 30 منتجاً.').optional(),
  subdomain: z.string().trim().min(3, 'الاسم الفرعي قصير جداً.').max(40, 'الاسم الفرعي طويل جداً.'),
  customDomain: z.string().max(120).optional().nullable(),
  paymentMethod: z.enum(['ccp', 'baridimob', 'cash', 'whatsapp']).optional(),
  website: z.string().max(200).optional(),
});

const receiptSchema = z.object({
  contact: z.string().trim().min(4, 'أدخل رقم الهاتف أو البريد المستعمل في الطلب.'),
  receipt: z.string().min(100, 'ملف الوصل مطلوب.').max(3_000_000, 'ملف الوصل كبير جداً (400KB كحد أقصى).'),
  name: z.string().max(120).optional().nullable(),
});

const orderSchema = z.object({
  customerName: z.string().trim().min(2, 'الاسم الكامل مطلوب.').max(100, 'الاسم طويل جداً.'),
  phone: phoneField,
  wilaya: z.string().trim().min(2, 'الولاية مطلوبة.').max(60, 'اسم الولاية طويل جداً.'),
  city: z.string().max(60).optional().nullable(),
  address: z.string().trim().min(5, 'العنوان مطلوب.').max(240, 'العنوان طويل جداً.'),
  note: z.string().max(600, 'الملاحظة طويلة جداً.').optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.string().min(1, 'معرّف المنتج مطلوب.').max(100),
        quantity: z.number().int('الكمية يجب أن تكون رقماً صحيحاً.').min(1, 'الكمية غير صحيحة.').max(99, 'الحد الأقصى 99 قطعة.'),
      }),
    )
    .min(1, 'سلة الطلب فارغة.')
    .max(40, 'عدد المنتجات كبير جداً.'),
  website: z.string().max(200).optional(),
});

const leadSchema = z.object({
  name: z.string().trim().min(2, 'الاسم مطلوب.').max(100, 'الاسم طويل جداً.'),
  phone: z.string().max(24).optional().nullable(),
  email: z.string().max(160).optional().nullable(),
  message: z.string().trim().min(3, 'الرسالة مطلوبة.').max(1500, 'الرسالة طويلة جداً.'),
  website: z.string().max(200).optional(),
});

/* -------------------------------------------------------------------------
 * Public catalog + subdomain check
 * ---------------------------------------------------------------------- */

siteFactoryRouter.get('/public/config', publicLimiter, async (_req, res) => {
  const catalog = await factory.listCatalog();
  res.json({
    ...catalog,
    cloudflareConfigured: isCloudflareConfigured(),
  });
});

siteFactoryRouter.get('/public/subdomain/:name', publicLimiter, async (req, res) => {
  const { checkSubdomain } = await import('../site-factory/subdomain');
  const result = await checkSubdomain(String(req.params.name || ''));
  res.json(result);
});

/* -------------------------------------------------------------------------
 * Public create request + tracking
 * ---------------------------------------------------------------------- */

siteFactoryRouter.post('/public/requests', writeLimiter, async (req, res) => {
  const input = parseBody(createRequestSchema, req.body);
  if (input.website) throw new BadRequest('تعذر إرسال الطلب.');
  const normalized = normalizeSubdomain(input.subdomain);
  if (normalized !== input.subdomain.toLowerCase()) {
    // The service normalizes too; just make sure the client sees the final name.
    (input as any).subdomain = normalized;
  }
  const result = await factory.createSiteRequest(input as any);
  res.status(201).json(result);
});

siteFactoryRouter.get('/public/requests/:ref', publicLimiter, async (req, res) => {
  const contact = String(req.query.contact || '');
  if (!contact) throw new BadRequest('أدخل رقم الهاتف أو البريد المستعمل في الطلب.');
  const request = await factory.getTrackedRequest(String(req.params.ref), contact);
  res.json(request);
});

siteFactoryRouter.post('/public/requests/:ref/receipt', uploadLimiter, async (req, res) => {
  const input = parseBody(receiptSchema, req.body);
  const result = await factory.uploadReceipt(String(req.params.ref), input.contact, input.receipt, input.name);
  res.json(result);
});

/* -------------------------------------------------------------------------
 * Public runtime used by generated websites
 * ---------------------------------------------------------------------- */

siteFactoryRouter.post('/public/sites/:siteId/orders', writeLimiter, async (req, res) => {
  const input = parseBody(orderSchema, req.body);
  if (input.website) throw new BadRequest('تعذر إرسال الطلب.');
  const result = await factory.createPublicOrder(String(req.params.siteId), input as any);
  res.status(201).json(result);
});

siteFactoryRouter.post('/public/sites/:siteId/leads', writeLimiter, async (req, res) => {
  const input = parseBody(leadSchema, req.body);
  if (input.website) throw new BadRequest('تعذر إرسال الرسالة.');
  const result = await factory.createPublicLead(String(req.params.siteId), input as any);
  res.status(201).json(result);
});

/* -------------------------------------------------------------------------
 * Preview (served from Postgres, no Cloudflare needed)
 * ---------------------------------------------------------------------- */

const PREVIEW_CSP = [
  "default-src 'self' data: https:",
  "script-src 'self' 'unsafe-inline' https:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https:",
  "connect-src 'self' https:",
  'frame-ancestors \'none\'',
].join('; ');

async function servePreview(req: Request, res: Response, requestedPath: string) {
  const site = await prisma.site.findUnique({
    where: { id: String(req.params.siteId) },
    select: { id: true, files: true, status: true },
  });
  if (!site) throw new AppError(404, 'المعاينة غير موجودة.');
  const files = site.files && typeof site.files === 'object' ? (site.files as Record<string, any>) : null;
  if (!files || !Object.keys(files).length) {
    throw new AppError(404, 'المعاينة غير جاهزة بعد. أعد المحاولة بعد لحظات.');
  }

  let path = decodeURIComponent(requestedPath || '').replace(/^\/+/, '');
  if (!path || path.endsWith('/')) path += 'index.html';
  if (path.includes('..') || path.includes('\\')) throw new AppError(400, 'مسار غير صالح.');
  let file = files[path];
  if (!file && !path.includes('.')) file = files[`${path}.html`];
  if (!file) file = files['404.html'];
  if (!file) throw new AppError(404, 'الملف غير موجود.');

  const body = file.encoding === 'base64' ? Buffer.from(String(file.content || ''), 'base64') : String(file.content || '');
  res.setHeader('Content-Type', file.type || 'application/octet-stream');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Security-Policy', PREVIEW_CSP);
  res.setHeader('X-Frame-Options', 'DENY');
  res.send(body);
}

siteFactoryRouter.get('/preview/:siteId', publicLimiter, async (req, res) => {
  const query = req.originalUrl.includes('?') ? req.originalUrl.slice(req.originalUrl.indexOf('?')) : '';
  res.redirect(301, `${req.baseUrl}/preview/${encodeURIComponent(String(req.params.siteId))}/${query}`);
});

siteFactoryRouter.get('/preview/:siteId/', publicLimiter, async (req, res) => {
  await servePreview(req, res, 'index.html');
});

siteFactoryRouter.get('/preview/:siteId/*', publicLimiter, async (req, res) => {
  const wildcard = (req.params as any)[0] || '';
  await servePreview(req, res, wildcard);
});

/* -------------------------------------------------------------------------
 * Admin
 * ---------------------------------------------------------------------- */

siteFactoryRouter.use('/admin', requireAuth, requireRole('SUPER_ADMIN', 'ADMIN'));

siteFactoryRouter.get('/admin/stats', async (_req, res) => {
  res.json(await factory.getFactoryStats());
});

siteFactoryRouter.get('/admin/requests', async (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const page = Number(req.query.page) || 1;
  const pageSize = Number(req.query.pageSize) || 20;
  res.json(await factory.listRequests({ status, q, page, pageSize }));
});

siteFactoryRouter.get('/admin/requests/:id', async (req, res) => {
  res.json(await factory.getRequestDetail(String(req.params.id)));
});

const statusSchema = z.object({
  status: z.enum(factory.REQUEST_STATUSES),
  note: z.string().max(800).optional().nullable(),
});

siteFactoryRouter.patch('/admin/requests/:id/status', async (req, res) => {
  const input = parseBody(statusSchema, req.body);
  const request = await factory.setRequestStatus(String(req.params.id), input.status, input.note);
  res.json({ ok: true, request });
});

siteFactoryRouter.get('/admin/sites', async (_req, res) => {
  const sites = await prisma.site.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      request: { select: { id: true, ref: true, phone: true, status: true, price: true, packageSlug: true } },
      _count: { select: { orders: true, leads: true, products: true } },
    },
  });
  res.json({ sites });
});

siteFactoryRouter.post('/admin/sites/:id/publish', async (req, res) => {
  const result = await factory.publishSite(String(req.params.id));
  res.json(result);
});

siteFactoryRouter.post('/admin/sites/:id/mark-published', async (req, res) => {
  const url = typeof req.body?.url === 'string' ? req.body.url : undefined;
  res.json(await factory.markSitePublished(String(req.params.id), url));
});

siteFactoryRouter.patch('/admin/sites/:id/status', async (req, res) => {
  const input = parseBody(
    z.object({ status: z.enum(['published', 'suspended', 'preview']) }),
    req.body,
  );
  res.json(await factory.setSiteStatus(String(req.params.id), input.status));
});

siteFactoryRouter.post('/admin/sites/:id/regenerate', async (req, res) => {
  res.json(await factory.regenerateSite(String(req.params.id)));
});

siteFactoryRouter.get('/admin/sites/:id/zip', async (req, res) => {
  const zip = await factory.getSiteZip(String(req.params.id));
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${zip.filename.replace(/[^a-zA-Z0-9._-]/g, '-')}"`);
  res.send(zip.buffer);
});

siteFactoryRouter.get('/admin/templates', async (_req, res) => {
  res.json({ templates: await factory.adminListTemplates() });
});

siteFactoryRouter.patch('/admin/templates/:id', async (req, res) => {
  res.json(await factory.updateTemplate(String(req.params.id), req.body || {}));
});

siteFactoryRouter.get('/admin/packages', async (_req, res) => {
  res.json({ packages: await factory.adminListPackages() });
});

siteFactoryRouter.post('/admin/packages', async (req, res) => {
  res.json(await factory.createPackage(req.body || {}));
});

siteFactoryRouter.patch('/admin/packages/:id', async (req, res) => {
  res.json(await factory.updatePackage(String(req.params.id), req.body || {}));
});

siteFactoryRouter.get('/admin/settings', async (_req, res) => {
  const settings = await factory.getFactorySettings();
  res.json({ settings, cloudflareConfigured: isCloudflareConfigured() });
});

siteFactoryRouter.put('/admin/settings', async (req, res) => {
  const settings = await factory.saveFactorySettings(req.body || {});
  res.json({ ok: true, settings });
});

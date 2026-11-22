import { Router, type Request, type Response, type NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { BadRequest } from '../utils/errors';
import { signSiteAdminSession } from '../utils/jwt';
import { resolveClientIp } from '../utils/trustProxy';
import { requireSiteAdmin, SITE_ADMIN_COOKIE, type SiteAdminRequest } from '../middleware/siteAdmin';
import { consumeSiteAdminToken, publishSite, refreshPreview } from '../site-factory/service';

export const siteAdminRouter = Router();

const STORE_URL = (process.env.PUBLIC_SITE_URL || 'https://aos-tech.store').replace(/\/+$/, '');
const COOKIE_MAX_AGE = 12 * 60 * 60 * 1000;

const keyedLimit = (options: Parameters<typeof rateLimit>[0]) =>
  rateLimit({
    ...options,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => resolveClientIp(req) || 'unknown',
    validate: { xForwardedForHeader: false },
  });

const claimLimiter = keyedLimit({
  windowMs: 15 * 60 * 1000,
  max: 12,
  handler: (_req, res) => res.status(429).json({ error: 'محاولات دخول كثيرة. انتظر قليلاً.' }),
});

const writeLimiter = keyedLimit({
  windowMs: 60 * 1000,
  max: 30,
  handler: (_req, res) => res.status(429).json({ error: 'طلبات كثيرة. انتظر دقيقة ثم حاول مجدداً.' }),
});

const publishLimiter = keyedLimit({
  windowMs: 10 * 60 * 1000,
  max: 6,
  handler: (_req, res) => res.status(429).json({ error: 'تم نشر عدة مرات مؤخراً. انتظر قليلاً.' }),
});

function parse<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new BadRequest(`${issue?.path?.length ? `${issue.path.join('.')}: ` : ''}${issue?.message || 'بيانات غير صحيحة.'}`);
  }
  return result.data;
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/site-admin',
    maxAge: COOKIE_MAX_AGE,
  };
}

function asyncRoute(fn: (req: SiteAdminRequest, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as SiteAdminRequest, res)).catch(next);
  };
}

/* -------------------------------------------------------------------------
 * Link claim — public, single use
 * ---------------------------------------------------------------------- */

siteAdminRouter.get('/claim/:token', claimLimiter, async (req, res) => {
  try {
    const claimed = await consumeSiteAdminToken(String(req.params.token || ''));
    if (!claimed) {
      res.redirect(302, `${STORE_URL}/site-admin?error=invalid`);
      return;
    }
    const session = signSiteAdminSession(claimed.siteId, claimed.version);
    res.cookie(SITE_ADMIN_COOKIE, session, cookieOptions());
    // The link token must never survive in the browser history or referrer.
    res.redirect(302, `${STORE_URL}/site-admin`);
  } catch (err) {
    console.error('[SiteAdmin] claim failed:', err);
    res.redirect(302, `${STORE_URL}/site-admin?error=invalid`);
  }
});

/* -------------------------------------------------------------------------
 * Everything below requires a valid site-scoped cookie session
 * ---------------------------------------------------------------------- */

siteAdminRouter.use(requireSiteAdmin);

siteAdminRouter.get('/me', asyncRoute(async (req, res) => {
  const site = await prisma.site.findUnique({
    where: { id: req.siteId! },
    include: { request: { select: { ref: true, phone: true, email: true, status: true } } },
  });
  res.json({
    site: {
      id: site!.id,
      name: site!.name,
      subdomain: site!.subdomain,
      status: site!.status,
      url: site!.url || site!.deployedUrl || `https://${site!.subdomain}.pages.dev`,
      ref: site!.request?.ref || '',
      requestStatus: site!.request?.status || '',
      phone: site!.request?.phone || '',
      email: site!.request?.email || '',
    },
  });
}));

siteAdminRouter.post('/logout', (_req, res) => {
  res.clearCookie(SITE_ADMIN_COOKIE, { path: '/api/site-admin' });
  res.json({ ok: true });
});

/* Orders ----------------------------------------------------------------- */

const ORDER_STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

siteAdminRouter.get('/orders', asyncRoute(async (req, res) => {
  const orders = await prisma.siteOrder.findMany({
    where: { siteId: req.siteId! },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json({ orders });
}));

siteAdminRouter.patch('/orders/:id', writeLimiter, asyncRoute(async (req, res) => {
  const input = parse(z.object({ status: z.enum(ORDER_STATUSES) }), req.body);
  const result = await prisma.siteOrder.updateMany({
    where: { id: String(req.params.id), siteId: req.siteId! },
    data: { status: input.status },
  });
  if (!result.count) throw new BadRequest('الطلب غير موجود.');
  res.json({ ok: true });
}));

/* Leads ------------------------------------------------------------------ */

siteAdminRouter.get('/leads', asyncRoute(async (req, res) => {
  const leads = await prisma.siteLead.findMany({
    where: { siteId: req.siteId! },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  res.json({ leads });
}));

/* Products --------------------------------------------------------------- */

const productSchema = z.object({
  name: z.string().trim().min(1, 'اسم المنتج مطلوب.').max(120),
  description: z.string().trim().max(500).optional().nullable(),
  price: z.coerce.number().min(0, 'السعر لا يمكن أن يكون سالباً.').max(100_000_000),
  imageUrl: z.string().trim().max(600).optional().nullable(),
  category: z.string().trim().max(60).optional().nullable(),
  isActive: z.boolean().optional(),
});

siteAdminRouter.get('/products', asyncRoute(async (req, res) => {
  const products = await prisma.siteProduct.findMany({
    where: { siteId: req.siteId! },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  res.json({ products });
}));

siteAdminRouter.post('/products', writeLimiter, asyncRoute(async (req, res) => {
  const input = parse(productSchema, req.body);
  const count = await prisma.siteProduct.count({ where: { siteId: req.siteId! } });
  if (count >= 60) throw new BadRequest('الحد الأقصى 60 منتجاً في الموقع.');
  const product = await prisma.siteProduct.create({
    data: {
      siteId: req.siteId!,
      name: input.name,
      description: input.description || null,
      price: input.price,
      imageUrl: input.imageUrl || null,
      category: input.category || null,
      isActive: input.isActive !== false,
      sortOrder: count,
    },
  });
  res.json({ product });
}));

siteAdminRouter.patch('/products/:id', writeLimiter, asyncRoute(async (req, res) => {
  const input = parse(productSchema.partial(), req.body);
  const result = await prisma.siteProduct.updateMany({
    where: { id: String(req.params.id), siteId: req.siteId! },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl || null } : {}),
      ...(input.category !== undefined ? { category: input.category || null } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
  });
  if (!result.count) throw new BadRequest('المنتج غير موجود.');
  res.json({ ok: true });
}));

siteAdminRouter.delete('/products/:id', writeLimiter, asyncRoute(async (req, res) => {
  const result = await prisma.siteProduct.deleteMany({
    where: { id: String(req.params.id), siteId: req.siteId! },
  });
  if (!result.count) throw new BadRequest('المنتج غير موجود.');
  res.json({ ok: true });
}));

/* Content + colours ------------------------------------------------------ */

const hex = z.string().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'اللون غير صالح.');

const contentSchema = z.object({
  siteName: z.string().trim().min(1).max(80).optional(),
  businessName: z.string().trim().max(120).optional().nullable(),
  tagline: z.string().trim().max(120).optional().nullable(),
  description: z.string().trim().max(900).optional().nullable(),
  phone: z.string().trim().min(8).max(24).optional(),
  whatsapp: z.string().trim().max(24).optional().nullable(),
  email: z.string().trim().max(160).optional().nullable(),
  address: z.string().trim().max(220).optional().nullable(),
  city: z.string().trim().max(80).optional().nullable(),
  primaryColor: hex.optional(),
  secondaryColor: hex.optional(),
  hours: z.string().trim().max(120).optional().nullable(),
  socials: z.object({
    facebook: z.string().trim().max(300).optional(),
    instagram: z.string().trim().max(300).optional(),
    tiktok: z.string().trim().max(300).optional(),
  }).optional(),
  services: z.array(z.object({
    title: z.string().trim().min(1).max(120),
    description: z.string().trim().max(400).optional(),
  })).max(8).optional(),
});

siteAdminRouter.get('/content', asyncRoute(async (req, res) => {
  const site = await prisma.site.findUnique({
    where: { id: req.siteId! },
    include: { request: true },
  });
  const r = site!.request;
  const content = (r?.content && typeof r.content === 'object' && !Array.isArray(r.content) ? r.content : {}) as Record<string, any>;
  res.json({
    content: {
      siteName: site!.name,
      businessName: r?.businessName || '',
      tagline: r?.tagline || '',
      description: r?.description || '',
      phone: r?.phone || '',
      whatsapp: r?.whatsapp || '',
      email: r?.email || '',
      address: r?.address || '',
      city: r?.city || '',
      primaryColor: r?.primaryColor || '#0b5ed7',
      secondaryColor: r?.secondaryColor || '#1e3a8a',
      hours: typeof r?.hours === 'string' ? r.hours : '',
      socials: (r?.socials && typeof r.socials === 'object' ? r.socials : {}) as Record<string, string>,
      services: Array.isArray(content.services) ? content.services : [],
    },
  });
}));

siteAdminRouter.patch('/content', writeLimiter, asyncRoute(async (req, res) => {
  const input = parse(contentSchema, req.body);
  const site = await prisma.site.findUnique({
    where: { id: req.siteId! },
    select: { requestId: true, request: { select: { content: true, socials: true } } },
  });
  if (!site?.requestId) throw new BadRequest('لا يوجد طلب مرتبط بهذا الموقع.');

  const oldContent = (site.request?.content && typeof site.request.content === 'object' && !Array.isArray(site.request.content)
    ? site.request.content : {}) as Record<string, any>;
  const oldSocials = (site.request?.socials && typeof site.request.socials === 'object' && !Array.isArray(site.request.socials)
    ? site.request.socials : {}) as Record<string, any>;

  await prisma.siteRequest.update({
    where: { id: site.requestId },
    data: {
      ...(input.siteName !== undefined ? { siteName: input.siteName } : {}),
      ...(input.businessName !== undefined ? { businessName: input.businessName || null } : {}),
      ...(input.tagline !== undefined ? { tagline: input.tagline || null } : {}),
      ...(input.description !== undefined ? { description: input.description || null } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.whatsapp !== undefined ? { whatsapp: input.whatsapp || null } : {}),
      ...(input.email !== undefined ? { email: input.email || null } : {}),
      ...(input.address !== undefined ? { address: input.address || null } : {}),
      ...(input.city !== undefined ? { city: input.city || null } : {}),
      ...(input.primaryColor !== undefined ? { primaryColor: input.primaryColor } : {}),
      ...(input.secondaryColor !== undefined ? { secondaryColor: input.secondaryColor } : {}),
      ...(input.hours !== undefined ? { hours: input.hours || null } : {}),
      ...(input.socials !== undefined ? { socials: { ...oldSocials, ...input.socials } } : {}),
      ...(input.services !== undefined ? { content: { ...oldContent, services: input.services } } : {}),
    },
  });
  if (input.siteName !== undefined) {
    await prisma.site.update({ where: { id: req.siteId! }, data: { name: input.siteName } });
  }
  await refreshPreview(req.siteId!);
  res.json({ ok: true, message: 'تم حفظ التغييرات وتحديث المعاينة. اضغط نشر التغييرات لتحديث الموقع المنشور.' });
}));

siteAdminRouter.post('/publish', publishLimiter, asyncRoute(async (req, res) => {
  const result = await publishSite(req.siteId!);
  res.json(result);
}));

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

const CLAIM_TOKEN_RE = /^[A-Za-z0-9_-]{40,80}$/;

type ClaimLang = 'ar' | 'fr' | 'en';

function claimLang(header: string | undefined): ClaimLang {
  const value = String(header || '').toLowerCase();
  if (value.startsWith('fr')) return 'fr';
  if (value.startsWith('en')) return 'en';
  return 'ar';
}

const CLAIM_TEXT: Record<ClaimLang, { title: string; body: string; button: string; note: string; dir: 'rtl' | 'ltr' }> = {
  ar: {
    title: 'دخول لوحة إدارة الموقع',
    body: 'اضغط الزر أدناه للدخول إلى لوحة تحكم موقعك.',
    button: 'الدخول إلى لوحة الموقع',
    note: 'هذا الرابط صالح للاستخدام مرة واحدة فقط.',
    dir: 'rtl',
  },
  fr: {
    title: 'Tableau de bord du site',
    body: 'Cliquez sur le bouton ci-dessous pour ouvrir le tableau de bord de votre site.',
    button: 'Ouvrir le tableau de bord',
    note: 'Ce lien est à usage unique.',
    dir: 'ltr',
  },
  en: {
    title: 'Site dashboard',
    body: 'Click the button below to open your site dashboard.',
    button: 'Open the dashboard',
    note: 'This link can only be used once.',
    dir: 'ltr',
  },
};

/**
 * A GET only shows a confirmation page. Link previews (WhatsApp, Telegram,
 * email scanners) fetch every URL they see, so consuming the token on GET
 * would burn the owner's single-use link before they ever clicked it.
 * The token is exchanged on the form POST instead.
 */
siteAdminRouter.get('/claim/:token', claimLimiter, (req, res) => {
  const token = String(req.params.token || '');
  if (!CLAIM_TOKEN_RE.test(token)) {
    res.redirect(302, `${STORE_URL}/site-admin?error=invalid`);
    return;
  }
  const lang = claimLang(req.headers['accept-language']);
  const copy = CLAIM_TEXT[lang];
  const action = `/api/site-admin/claim/${encodeURIComponent(token)}`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  );
  res.send(`<!DOCTYPE html>
<html lang="${lang}" dir="${copy.dir}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>${copy.title} — AOS Tech Store</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 20%,#1e3a8a 0%,#0f172a 55%,#020617 100%);color:#e2e8f0;font-family:system-ui,-apple-system,"Segoe UI",Tahoma,sans-serif}
main{width:100%;max-width:440px;background:rgba(15,23,42,.82);border:1px solid rgba(96,165,250,.22);border-radius:24px;padding:34px 28px;text-align:center;box-shadow:0 24px 60px rgba(2,6,23,.55)}
.logo{display:inline-grid;place-items:center;width:52px;height:52px;border-radius:16px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;font-weight:900;font-size:15px;letter-spacing:.5px}
h1{margin:18px 0 10px;font-size:1.25rem}
p{margin:0;color:#94a3b8;line-height:1.8;font-size:.95rem}
form{margin-top:24px}
button{width:100%;border:0;cursor:pointer;padding:14px 20px;border-radius:999px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);color:#fff;font-weight:800;font-size:1rem;font-family:inherit}
button:hover{filter:brightness(1.08)}
.note{margin-top:14px;font-size:.78rem;color:#64748b}
</style>
</head>
<body>
<main>
<span class="logo">AOS</span>
<h1>${copy.title}</h1>
<p>${copy.body}</p>
<form method="POST" action="${action}">
<button type="submit">${copy.button}</button>
</form>
<p class="note">${copy.note}</p>
</main>
</body>
</html>`);
});

siteAdminRouter.post('/claim/:token', claimLimiter, async (req, res) => {
  try {
    const claimed = await consumeSiteAdminToken(String(req.params.token || ''));
    if (!claimed) {
      res.redirect(303, `${STORE_URL}/site-admin?error=invalid`);
      return;
    }
    const session = signSiteAdminSession(claimed.siteId, claimed.version);
    res.cookie(SITE_ADMIN_COOKIE, session, cookieOptions());
    // 303 turns the POST into a clean GET; the token is already invalid, so
    // it can no longer be replayed from the browser history.
    res.redirect(303, `${STORE_URL}/site-admin`);
  } catch (err) {
    console.error('[SiteAdmin] claim failed:', err);
    res.redirect(303, `${STORE_URL}/site-admin?error=invalid`);
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
  hideProducts: z.boolean().optional(),
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
      hideProducts: content.hideProducts === true,
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

  const contentChanged = input.services !== undefined || input.hideProducts !== undefined;
  const nextContent = {
    ...oldContent,
    ...(input.services !== undefined ? { services: input.services } : {}),
    ...(input.hideProducts !== undefined ? { hideProducts: input.hideProducts } : {}),
  };

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
      ...(contentChanged ? { content: nextContent } : {}),
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

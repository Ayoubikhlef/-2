import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { AppError, BadRequest, Conflict, NotFound } from '../utils/errors';
import {
  DEFAULT_FACTORY_SETTINGS,
  PACKAGES,
  TEMPLATES,
  type FactorySettings,
  type Lang,
} from './defaults';
import { checkSubdomain, normalizeSubdomain } from './subdomain';
import { renderSite } from './render';
import type { RenderedFile, RenderConfig, RenderProduct, RenderService } from './render/types';
import { deployToCloudflare, isCloudflareConfigured } from './cloudflare';
import { createZip } from './zip';
import { dataUrlAsset } from './render/types';
import {
  notifyNewSiteRequest,
  notifyNewSiteOrder,
  notifyNewSiteLead,
  notifyReceiptUploaded,
} from './notifications';

export const REQUEST_STATUSES = [
  'new',
  'awaiting-payment',
  'payment-review',
  'confirmed',
  'published',
  'rejected',
] as const;

export type RequestStatus = (typeof REQUEST_STATUSES)[number];

const TRANSITIONS: Record<string, RequestStatus[]> = {
  new: ['awaiting-payment', 'payment-review', 'confirmed', 'rejected'],
  'awaiting-payment': ['payment-review', 'confirmed', 'rejected'],
  'payment-review': ['awaiting-payment', 'confirmed', 'rejected'],
  confirmed: ['published', 'rejected', 'confirmed'],
  published: ['confirmed', 'rejected'],
  rejected: ['new', 'awaiting-payment'],
};

export interface CreateSiteInput {
  templateSlug: string;
  packageSlug: string;
  siteName: string;
  businessName?: string | null;
  category?: string | null;
  tagline?: string | null;
  description?: string | null;
  phone: string;
  email?: string | null;
  whatsapp?: string | null;
  address?: string | null;
  city?: string | null;
  language?: Lang;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  socials?: { facebook?: string; instagram?: string; tiktok?: string } | null;
  hours?: string | null;
  services?: RenderService[];
  products?: Array<{
    name: string;
    description?: string | null;
    price: number;
    imageUrl?: string | null;
    category?: string | null;
  }>;
  subdomain: string;
  customDomain?: string | null;
  paymentMethod?: string | null;
}

/* -------------------------------------------------------------------------
 * Defaults / settings
 * ---------------------------------------------------------------------- */

export async function ensureSiteFactoryDefaults(): Promise<void> {
  for (const template of TEMPLATES) {
    await prisma.siteTemplate.upsert({
      where: { slug: template.slug },
      update: {},
      create: {
        slug: template.slug,
        nameAr: template.name.ar,
        nameFr: template.name.fr,
        nameEn: template.name.en,
        descAr: template.description.ar,
        descFr: template.description.fr,
        descEn: template.description.en,
        category: template.category,
        accent: template.accent,
        sortOrder: template.sortOrder,
      },
    });
  }

  for (const pack of PACKAGES) {
    await prisma.sitePackage.upsert({
      where: { slug: pack.slug },
      update: {},
      create: {
        slug: pack.slug,
        nameAr: pack.name.ar,
        nameFr: pack.name.fr,
        nameEn: pack.name.en,
        descAr: pack.description.ar,
        descFr: pack.description.fr,
        descEn: pack.description.en,
        price: pack.price,
        oldPrice: pack.oldPrice || null,
        features: pack.features as any,
        deliveryDays: pack.deliveryDays,
        revisions: pack.revisions,
        isPopular: pack.isPopular,
        sortOrder: pack.sortOrder,
      },
    });
  }

  await prisma.setting.upsert({
    where: { key: 'site_factory_settings' },
    update: {},
    create: { key: 'site_factory_settings', value: JSON.stringify(DEFAULT_FACTORY_SETTINGS) },
  });
}

export async function getFactorySettings(): Promise<FactorySettings> {
  try {
    const row = await prisma.setting.findUnique({ where: { key: 'site_factory_settings' } });
    if (!row) return { ...DEFAULT_FACTORY_SETTINGS };
    const parsed = JSON.parse(row.value);
    return {
      ...DEFAULT_FACTORY_SETTINGS,
      ...parsed,
      paymentNote: { ...DEFAULT_FACTORY_SETTINGS.paymentNote, ...(parsed.paymentNote || {}) },
      customDomainNote: { ...DEFAULT_FACTORY_SETTINGS.customDomainNote, ...(parsed.customDomainNote || {}) },
    };
  } catch {
    return { ...DEFAULT_FACTORY_SETTINGS };
  }
}

export async function saveFactorySettings(input: Partial<FactorySettings>): Promise<FactorySettings> {
  const current = await getFactorySettings();
  const clean: FactorySettings = {
    ...current,
    ...input,
    depositPercent: Math.min(100, Math.max(0, Number(input.depositPercent ?? current.depositPercent) || 0)),
    paymentNote: { ...current.paymentNote, ...(input.paymentNote || {}) },
    customDomainNote: { ...current.customDomainNote, ...(input.customDomainNote || {}) },
  };
  const allowedKeys: (keyof FactorySettings)[] = [
    'ownerName', 'ownerPhone', 'ownerWhatsapp', 'ownerEmail', 'ccp', 'ccpKey',
    'baridimob', 'bankName', 'depositPercent', 'paymentNote', 'customDomainNote',
  ];
  const stored: any = {};
  for (const key of allowedKeys) stored[key] = clean[key];
  await prisma.setting.upsert({
    where: { key: 'site_factory_settings' },
    update: { value: JSON.stringify(stored) },
    create: { key: 'site_factory_settings', value: JSON.stringify(stored) },
  });
  return clean;
}

export function publicSettings(settings: FactorySettings) {
  return {
    ownerName: settings.ownerName,
    ownerPhone: settings.ownerPhone,
    ownerWhatsapp: settings.ownerWhatsapp,
    ownerEmail: settings.ownerEmail,
    ccp: settings.ccp,
    ccpKey: settings.ccpKey,
    baridimob: settings.baridimob,
    bankName: settings.bankName,
    depositPercent: settings.depositPercent,
    paymentNote: settings.paymentNote,
    customDomainNote: settings.customDomainNote,
  };
}

export async function listCatalog() {
  const [templates, packages, settings] = await Promise.all([
    prisma.siteTemplate.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.sitePackage.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    getFactorySettings(),
  ]);
  return { templates, packages, settings: publicSettings(settings) };
}

/* -------------------------------------------------------------------------
 * Config building
 * ---------------------------------------------------------------------- */

function apiBaseUrl(): string {
  const raw = (
    process.env.SITE_FACTORY_API_BASE ||
    process.env.PUBLIC_API_URL ||
    'https://iueefgma6y.onrender.com'
  ).replace(/\/+$/, '');
  return /\/api$/i.test(raw) ? raw : `${raw}/api`;
}

function objectOrNull(value: any): Record<string, any> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value;
}

function cleanCustomDomain(value: string | null | undefined): string | null {
  const domain = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  if (!domain) return null;
  // A hostname is stored here, not a URL. Keeping this strict prevents an
  // invalid custom-domain request from producing a broken canonical URL.
  if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain)) {
    throw new BadRequest('النطاق المخصص غير صالح. أدخل اسماً مثل example.com فقط.');
  }
  return domain;
}

function activeCustomDomain(site: { customDomain: string | null; deployedUrl: string | null }): string | null {
  let customDomain: string | null;
  try {
    customDomain = cleanCustomDomain(site.customDomain);
  } catch {
    return null;
  }
  if (!customDomain || !site.deployedUrl) return null;
  try {
    return new URL(site.deployedUrl).hostname.toLowerCase() === customDomain ? customDomain : null;
  } catch {
    return null;
  }
}

function publicUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequest('رابط النشر غير صالح. أدخل رابطاً يبدأ بـ https://');
  }
  if (!['https:', 'http:'].includes(url.protocol) || !url.hostname || url.username || url.password) {
    throw new BadRequest('رابط النشر غير صالح. أدخل رابطاً عاماً يبدأ بـ https://');
  }
  return url.toString();
}

function servicesFrom(value: any): RenderService[] {
  const list = Array.isArray(value) ? value : [];
  return list
    .filter((item) => item && typeof item.title === 'string' && item.title.trim())
    .slice(0, 8)
    .map((item) => ({
      title: String(item.title).slice(0, 120),
      description: String(item.description || '').slice(0, 400),
    }));
}

function productsFrom(rows: any[]): RenderProduct[] {
  return (rows || [])
    .filter((row) => row.isActive !== false)
    .map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      price: Number(row.price) || 0,
      imageUrl: row.imageUrl,
      category: row.category,
    }));
}

export async function buildConfig(siteId: string, preview: boolean): Promise<RenderConfig> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      products: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      request: true,
    },
  });
  if (!site) throw new NotFound('الموقع غير موجود.');
  const request = site.request;
  if (!request) throw new BadRequest('لا يوجد طلب مرتبط بهذا الموقع.');

  const content = objectOrNull(request.content) || {};
  const socials = objectOrNull(request.socials) || {};
  const hoursRaw = request.hours ?? content.hours;
  const hours = typeof hoursRaw === 'string' ? hoursRaw : null;
  const services = servicesFrom(content.services);

  return {
    siteId: site.id,
    templateSlug: site.templateSlug,
    siteName: site.name,
    tagline: request.tagline || request.category || '',
    description: request.description || request.tagline || '',
    category: request.category || '',
    phone: request.phone,
    whatsapp: request.whatsapp || request.phone,
    email: request.email || '',
    address: request.address || '',
    city: request.city || '',
    language: (['ar', 'fr', 'en'].includes(request.language) ? request.language : 'ar') as Lang,
    primaryColor: request.primaryColor,
    secondaryColor: request.secondaryColor,
    logoUrl: request.logoUrl,
    coverUrl: request.coverUrl,
    socials: {
      facebook: socials.facebook || '',
      instagram: socials.instagram || '',
      tiktok: socials.tiktok || '',
    },
    hours,
    services,
    products: productsFrom(site.products),
    subdomain: site.subdomain,
    // A requested custom domain is not live until its DNS/Pages mapping has
    // actually been confirmed. Until then the generated site must use the
    // working pages.dev URL for its canonical links and runtime data.
    customDomain: activeCustomDomain(site),
    preview,
    apiBase: apiBaseUrl(),
  };
}

function defaultEventMessage(status: RequestStatus): string {
  const messages: Record<RequestStatus, string> = {
    new: 'تم استلام الطلب.',
    'awaiting-payment': 'بانتظار دفع الدفعة الأولى وتأكيدها من طرفنا.',
    'payment-review': 'تم استلام وصل الدفع وهو قيد المراجعة.',
    confirmed: 'تم تأكيد الدفع والطلب. جاري تجهيز الموقع.',
    published: 'تم نشر الموقع بنجاح.',
    rejected: 'تم رفض الطلب. تواصل معنا لمزيد من التفاصيل.',
  };
  return messages[status];
}

async function addEvent(requestId: string, type: string, message: string): Promise<void> {
  try {
    await prisma.siteRequestEvent.create({ data: { requestId, type, message } });
  } catch {
    // Never fail the main workflow because of a log row.
  }
}

function makeRef(prefix: string): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  return `${prefix}-${stamp}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

/* -------------------------------------------------------------------------
 * Create request + preview site
 * ---------------------------------------------------------------------- */

export async function createSiteRequest(input: CreateSiteInput) {
  const [template, pack] = await Promise.all([
    prisma.siteTemplate.findUnique({ where: { slug: String(input.templateSlug || '') } }),
    prisma.sitePackage.findUnique({ where: { slug: String(input.packageSlug || '') } }),
  ]);
  if (!template || !template.isActive) throw new BadRequest('القالب المختار غير متوفر. اختر قالباً آخر.');
  if (!pack || !pack.isActive) throw new BadRequest('الباقة المختارة غير متوفرة. اختر باقة أخرى.');

  const subdomain = normalizeSubdomain(input.subdomain);
  const availability = await checkSubdomain(subdomain);
  if (!availability.available) {
    throw new Conflict(availability.message || 'الاسم الفرعي غير متاح.');
  }

  const lang: Lang = (['ar', 'fr', 'en'].includes(String(input.language)) ? input.language : 'ar') as Lang;
  const socials = objectOrNull(input.socials) || {};
  const products = (input.products || []).slice(0, 30);
  const services = servicesFrom(input.services);

  let request: any = null;
  for (let attempt = 0; attempt < 3 && !request; attempt++) {
    try {
      request = await prisma.siteRequest.create({
        data: {
          ref: makeRef('WEB'),
          templateSlug: template.slug,
          packageSlug: pack.slug,
          status: 'new',
          siteName: input.siteName.trim().slice(0, 80),
          businessName: input.businessName?.trim().slice(0, 120) || null,
          category: input.category?.trim().slice(0, 60) || null,
          tagline: input.tagline?.trim().slice(0, 120) || null,
          description: input.description?.trim().slice(0, 900) || null,
          phone: input.phone.trim().slice(0, 24),
          email: input.email?.trim().slice(0, 160) || null,
          whatsapp: input.whatsapp?.trim().slice(0, 24) || null,
          address: input.address?.trim().slice(0, 220) || null,
          city: input.city?.trim().slice(0, 80) || null,
          language: lang,
          primaryColor: input.primaryColor || template.accent || '#0b5ed7',
          secondaryColor: input.secondaryColor || '#1e3a8a',
          logoUrl: input.logoUrl || null,
          coverUrl: input.coverUrl || null,
          socials: {
            facebook: String(socials.facebook || '').slice(0, 300),
            instagram: String(socials.instagram || '').slice(0, 300),
            tiktok: String(socials.tiktok || '').slice(0, 300),
          },
          hours: input.hours?.trim().slice(0, 120) || null,
          content: { services } as any,
          subdomain,
          customDomain: cleanCustomDomain(input.customDomain),
          price: Number(pack.price) || 0,
          paymentMethod: input.paymentMethod?.slice(0, 40) || null,
        },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new Conflict('هذا الاسم الفرعي أو مرجع الطلب مستعمل بالفعل. جرّب اسماً آخر.');
      }
      throw err;
    }
  }
  if (!request) throw new AppError(500, 'تعذر إنشاء الطلب. حاول مرة أخرى.');

  const site = await prisma.site.create({
    data: {
      requestId: request.id,
      subdomain,
      customDomain: request.customDomain,
      name: request.siteName,
      templateSlug: request.templateSlug,
      status: 'preview',
      config: {
        templateSlug: request.templateSlug,
        packageSlug: request.packageSlug,
        language: lang,
        primaryColor: request.primaryColor,
        secondaryColor: request.secondaryColor,
        price: request.price,
      },
    },
  });

  if (products.length) {
    await prisma.siteProduct.createMany({
      data: products.map((product, index) => ({
        siteId: site.id,
        name: String(product.name || '').trim().slice(0, 120) || `منتج ${index + 1}`,
        description: product.description ? String(product.description).slice(0, 500) : null,
        price: Math.max(0, Number(product.price) || 0),
        imageUrl: product.imageUrl || null,
        category: product.category ? String(product.category).slice(0, 60) : null,
        sortOrder: index,
      })),
    });
  }

  const previewUrl = `/api/site-factory/preview/${site.id}/`;
  await prisma.siteRequest.update({ where: { id: request.id }, data: { previewUrl } });
  await addEvent(request.id, 'created', 'تم إنشاء الطلب وتوليد المعاينة المجانية.');

  try {
    await refreshPreview(site.id);
  } catch (err) {
    console.error('[SiteFactory] Preview render failed:', err);
  }

  void notifyNewSiteRequest(request, template, pack).catch(() => {});

  const fresh = await prisma.siteRequest.findUnique({ where: { id: request.id } });
  return {
    request: fresh,
    siteId: site.id,
    previewUrl,
    ref: request.ref,
    subdomain,
    status: request.status,
    price: request.price,
    packageSlug: request.packageSlug,
    templateSlug: request.templateSlug,
  };
}

export async function refreshPreview(siteId: string) {
  const config = await buildConfig(siteId, true);
  const rendered = renderSite(config);
  const site = await prisma.site.update({
    where: { id: siteId },
    data: {
      files: rendered.files as any,
      deployError: null,
      lastDeployAt: null,
    },
    select: { id: true, subdomain: true, name: true, status: true },
  });
  return { site, rendered };
}

/* -------------------------------------------------------------------------
 * Publish / status management
 * ---------------------------------------------------------------------- */

export async function publishSite(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { request: true },
  });
  if (!site) throw new NotFound('الموقع غير موجود.');
  const request = site.request;
  if (!request) throw new BadRequest('لا يوجد طلب مرتبط بهذا الموقع.');
  if (request.status === 'rejected') throw new BadRequest('لا يمكن نشر طلب مرفوض.');
  if (request.status !== 'confirmed' && request.status !== 'published') {
    throw new BadRequest('يجب تأكيد الدفع أولاً قبل النشر.');
  }

  const config = await buildConfig(siteId, false);
  const rendered = renderSite(config);

  const build = await prisma.siteBuild.create({
    data: {
      siteId,
      status: isCloudflareConfigured() ? 'building' : 'manual',
      provider: isCloudflareConfigured() ? 'cloudflare' : 'manual',
      url: rendered.siteUrl,
    },
  });

  await prisma.site.update({
    where: { id: siteId },
    data: {
      files: rendered.files as any,
      url: rendered.siteUrl,
      lastDeployAt: new Date(),
      deployError: null,
    },
  });

  if (!isCloudflareConfigured()) {
    const message =
      'لم تُضبط بيانات Cloudflare على السيرفر بعد، لذلك تم تجهيز الموقع كملف ZIP جاهز للرفع اليدوي. ' +
      'أضف CLOUDFLARE_API_TOKEN و CLOUDFLARE_ACCOUNT_ID لتفعيل النشر التلقائي.';
    await prisma.site.update({
      where: { id: siteId },
      data: { status: 'ready', deployProvider: 'manual', deployError: message },
    });
    await prisma.siteBuild.update({
      where: { id: build.id },
      data: { status: 'manual', error: message },
    });
    await addEvent(
      request.id,
      'publish-pending',
      'تم تجهيز الموقع للنشر. بانتظار الرفع اليدوي (Cloudflare غير مُهيأ).',
    );
    return {
      ok: false,
      manual: true,
      siteId,
      url: rendered.siteUrl,
      message,
      size: rendered.size,
    };
  }

  const result = await deployToCloudflare(site.subdomain, rendered.files, `AOS website ${request.ref}`);
  if (!result.ok) {
    await prisma.site.update({
      where: { id: siteId },
      data: {
        status: 'ready',
        deployProvider: 'cloudflare',
        deployError: result.error || 'فشل النشر.',
      },
    });
    await prisma.siteBuild.update({
      where: { id: build.id },
      data: { status: 'failed', error: result.error || 'فشل النشر.' },
    });
    await addEvent(request.id, 'publish-failed', `تعذر النشر التلقائي: ${String(result.error || '').slice(0, 300)}`);
    return { ok: false, manual: true, siteId, url: rendered.siteUrl, message: result.error, size: rendered.size };
  }

  const now = new Date();
  await prisma.site.update({
    where: { id: siteId },
    data: {
      status: 'published',
      url: result.url,
      deployedUrl: result.url,
      deployProvider: 'cloudflare',
      deployError: null,
      publishedAt: now,
      lastDeployAt: now,
    },
  });
  await prisma.siteBuild.update({
    where: { id: build.id },
    data: { status: 'success', url: result.url },
  });
  await prisma.siteRequest.update({
    where: { id: request.id },
    data: { status: 'published' },
  });
  await addEvent(request.id, 'published', `تم نشر الموقع على ${result.url}`);

  return {
    ok: true,
    manual: false,
    siteId,
    url: result.url,
    deploymentId: result.deploymentId,
    size: rendered.size,
  };
}

export async function markSitePublished(siteId: string, url?: string | null) {
  const site = await prisma.site.findUnique({ where: { id: siteId }, include: { request: true } });
  if (!site) throw new NotFound('الموقع غير موجود.');
  const confirmedUrl = publicUrl((url || '').trim() || site.url || `https://${site.subdomain}.pages.dev`);
  const now = new Date();
  await prisma.site.update({
    where: { id: siteId },
    data: {
      status: 'published',
      url: confirmedUrl,
      deployedUrl: confirmedUrl,
      deployProvider: 'manual',
      deployError: null,
      publishedAt: now,
      lastDeployAt: now,
    },
  });
  if (site.requestId) {
    await prisma.siteRequest.update({ where: { id: site.requestId }, data: { status: 'published' } });
    await addEvent(site.requestId, 'published', `تم تأكيد النشر يدوياً على ${confirmedUrl}`);
  }
  return { ok: true, url: confirmedUrl };
}

export async function setSiteStatus(siteId: string, status: 'published' | 'suspended' | 'preview') {
  const site = await prisma.site.findUnique({ where: { id: siteId }, include: { request: true } });
  if (!site) throw new NotFound('الموقع غير موجود.');
  const data: any = { status };
  if (status === 'published') {
    // Never mark a preview/ZIP as live. Publishing or manual confirmation is
    // the only point at which we know there is a public deployment.
    const liveUrl = site.deployedUrl || (site.status === 'suspended' ? site.url : null);
    if (!liveUrl) {
      throw new BadRequest('انشر الموقع أولاً أو أكّد رابط الرفع اليدوي قبل تفعيله.');
    }
    data.url = publicUrl(liveUrl);
    data.deployedUrl = data.url;
  }
  await prisma.site.update({ where: { id: siteId }, data });
  if (site.requestId) {
    const message =
      status === 'suspended'
        ? 'تم تعليق الموقع مؤقتاً. تواصل معنا للمزيد من المعلومات.'
        : status === 'published'
          ? 'تم إعادة تفعيل الموقع.'
          : 'تم تحويل الموقع إلى المعاينة.';
    await addEvent(site.requestId, `site-${status}`, message);
  }
  return { ok: true, status };
}

export async function setRequestStatus(requestId: string, status: RequestStatus, note?: string | null) {
  if (!REQUEST_STATUSES.includes(status)) throw new BadRequest('حالة غير معروفة.');
  if (status === 'published') {
    throw new BadRequest('استخدم زر النشر أو أكّد رابط الرفع اليدوي أولاً.');
  }
  const request = await prisma.siteRequest.findUnique({
    where: { id: requestId },
    include: { site: true },
  });
  if (!request) throw new NotFound('الطلب غير موجود.');
  const allowed = TRANSITIONS[request.status] || [];
  if (status !== request.status && !allowed.includes(status)) {
    throw new BadRequest(`لا يمكن الانتقال من الحالة «${request.status}» إلى «${status}».`);
  }

  const updated = await prisma.siteRequest.update({
    where: { id: requestId },
    data: {
      status,
      adminNote: note?.slice(0, 800) || request.adminNote,
    },
  });

  if (status === 'rejected' && request.site) {
    await prisma.site.update({ where: { id: request.site.id }, data: { status: 'rejected' } });
  } else if (status === 'confirmed' && request.site) {
    await prisma.site.update({ where: { id: request.site.id }, data: { status: 'preview' } });
  }

  await addEvent(
    requestId,
    `status:${status}`,
    (note && note.trim()) || defaultEventMessage(status),
  );

  return updated;
}

export async function regenerateSite(siteId: string) {
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { status: true, requestId: true } });
  if (!site) throw new NotFound('الموقع غير موجود.');
  const result = await refreshPreview(siteId);
  if (site.requestId) {
    await addEvent(site.requestId, 'regenerated', 'تم إعادة توليد ملفات الموقع من بيانات الطلب.');
  }
  return {
    ok: true,
    size: result.rendered.size,
    pages: result.rendered.pages,
    siteUrl: result.rendered.siteUrl,
  };
}

export async function getSiteZip(siteId: string): Promise<{ buffer: Buffer; filename: string }> {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    select: { files: true, subdomain: true },
  });
  if (!site) throw new NotFound('الموقع غير موجود.');
  const files = objectOrNull(site.files);
  if (!files || !Object.keys(files).length) {
    throw new BadRequest('لا توجد ملفات جاهزة. أعد توليد الموقع أولاً.');
  }
  let rendered = files as Record<string, RenderedFile>;
  // Published/preview renders are both valid ZIP sources. Regenerate if the
  // stored files predate a data change.
  if (!rendered['index.html']) {
    const generated = renderSite(await buildConfig(siteId, false));
    rendered = generated.files;
  }
  return {
    buffer: createZip(rendered),
    filename: `${site.subdomain}-site.zip`,
  };
}

/* -------------------------------------------------------------------------
 * Public site data, orders, leads
 * ---------------------------------------------------------------------- */

async function publicSite(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      products: { where: { isActive: true }, orderBy: [{ sortOrder: 'asc' }] },
      request: true,
    },
  });
  if (!site || site.status !== 'published') {
    throw new NotFound('هذا الموقع غير متاح حالياً.');
  }
  return site;
}

export async function createPublicOrder(
  siteId: string,
  input: {
    customerName: string;
    phone: string;
    wilaya: string;
    city?: string;
    address: string;
    note?: string;
    items: Array<{ id: string; quantity: number }>;
  },
) {
  const site = await publicSite(siteId);
  const rawItems = (input.items || []).slice(0, 40);
  if (!rawItems.length) throw new BadRequest('سلة الطلب فارغة.');

  const lines: Array<{ product: any; quantity: number }> = [];
  for (const raw of rawItems) {
    const product = site.products.find((p) => String(p.id) === String(raw.id));
    if (!product) throw new BadRequest('أحد المنتجات لم يعد متوفراً. حدّث السلة وحاول مجدداً.');
    const quantity = Math.floor(Number(raw.quantity) || 0);
    if (quantity < 1 || quantity > 99) throw new BadRequest('الكمية غير صحيحة.');
    lines.push({ product, quantity });
  }
  const total = lines.reduce((sum, line) => sum + Number(line.product.price) * line.quantity, 0);
  if (total <= 0) throw new BadRequest('لا يمكن إرسال طلب بمبلغ صفر.');
  if (total > 50_000_000) throw new BadRequest('مبلغ الطلب كبير جداً.');

  const order = await prisma.siteOrder.create({
    data: {
      siteId: site.id,
      ref: makeRef('ORD'),
      customerName: input.customerName.trim().slice(0, 100),
      phone: input.phone.trim().slice(0, 24),
      wilaya: input.wilaya.trim().slice(0, 60),
      city: input.city?.trim().slice(0, 60) || null,
      address: input.address.trim().slice(0, 240),
      note: input.note?.trim().slice(0, 600) || null,
      items: lines.map((line) => ({
        id: line.product.id,
        name: line.product.name,
        price: Number(line.product.price),
        quantity: line.quantity,
      })) as any,
      total,
      status: 'new',
    },
  });

  void notifyNewSiteOrder(site, order).catch(() => {});
  return { ok: true, ref: order.ref, total };
}

export async function createPublicLead(
  siteId: string,
  input: { name: string; phone?: string; email?: string; message: string },
) {
  const site = await publicSite(siteId);
  const lead = await prisma.siteLead.create({
    data: {
      siteId: site.id,
      name: input.name.trim().slice(0, 100),
      phone: input.phone?.trim().slice(0, 24) || null,
      email: input.email?.trim().slice(0, 160) || null,
      message: input.message.trim().slice(0, 1500),
    },
  });
  void notifyNewSiteLead(site, lead).catch(() => {});
  return { ok: true, id: lead.id };
}

/* -------------------------------------------------------------------------
 * Request tracking + receipt
 * ---------------------------------------------------------------------- */

function normalizeDigits(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

function contactMatches(
  request: { phone: string; email: string | null },
  contact: string,
): boolean {
  const clean = String(contact || '').trim().toLowerCase();
  if (!clean) return false;
  if (request.email && request.email.toLowerCase() === clean) return true;
  const digits = normalizeDigits(clean);
  const phone = normalizeDigits(request.phone);
  if (!digits || !phone) return false;
  if (phone === digits) return true;
  const tail = Math.min(6, phone.length);
  return digits.length >= tail && phone.slice(-tail) === digits.slice(-tail);
}

export async function getTrackedRequest(ref: string, contact: string) {
  const request = await prisma.siteRequest.findUnique({
    where: { ref: String(ref || '').toUpperCase() },
    include: {
      site: { select: { id: true, status: true, url: true, subdomain: true } },
      events: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!request) throw new NotFound('لم نجد طلباً بهذا الرقم.');
  if (!contactMatches(request, contact)) {
    throw new AppError(403, 'رقم الهاتف أو البريد لا يطابق صاحب الطلب.');
  }
  const settings = await getFactorySettings();
  return {
    ref: request.ref,
    status: request.status,
    siteName: request.siteName,
    subdomain: request.subdomain,
    customDomain: request.customDomain,
    previewUrl: request.previewUrl,
    templateSlug: request.templateSlug,
    packageSlug: request.packageSlug,
    price: request.price,
    paymentMethod: request.paymentMethod,
    adminNote: request.adminNote,
    hasReceipt: !!request.receiptUrl,
    receiptStatus: request.status === 'payment-review' ? 'review' : request.receiptUrl ? 'received' : 'none',
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    events: request.events.map((event) => ({
      type: event.type,
      message: event.message,
      createdAt: event.createdAt,
    })),
    site: request.site,
    payment: publicSettings(settings),
  };
}

export async function uploadReceipt(ref: string, contact: string, receiptUrl: string, name?: string | null) {
  const asset = dataUrlAsset(receiptUrl);
  if (!asset || !['png', 'jpg', 'webp', 'pdf'].includes(asset.ext)) {
    throw new BadRequest('صيغة الوصل غير مدعومة. أرسل صورة JPG/PNG/WebP أو ملف PDF.');
  }
  if (asset.buffer.length > 2.5 * 1024 * 1024) {
    throw new BadRequest('حجم ملف الوصل يتجاوز 2.5 ميغابايت.');
  }
  const request = await prisma.siteRequest.findUnique({
    where: { ref: String(ref || '').toUpperCase() },
  });
  if (!request) throw new NotFound('لم نجد طلباً بهذا الرقم.');
  if (!contactMatches(request, contact)) {
    throw new AppError(403, 'رقم الهاتف أو البريد لا يطابق صاحب الطلب.');
  }
  const nextStatus: RequestStatus =
    ['new', 'awaiting-payment', 'payment-review'].includes(request.status)
      ? 'payment-review'
      : (request.status as RequestStatus);
  const updated = await prisma.siteRequest.update({
    where: { id: request.id },
    data: {
      receiptUrl,
      receiptName: name?.slice(0, 120) || `receipt.${asset.ext}`,
      status: nextStatus,
    },
  });
  if (nextStatus === 'payment-review') {
    await addEvent(request.id, 'receipt', 'تم استلام وصل الدفع وهو قيد المراجعة.');
  } else {
    await addEvent(request.id, 'receipt', 'تم تحديث وصل الدفع.');
  }
  void notifyReceiptUploaded(updated).catch(() => {});
  return { ok: true, status: updated.status };
}

/* -------------------------------------------------------------------------
 * Admin queries
 * ---------------------------------------------------------------------- */

export async function listRequests(options: { status?: string; q?: string; page?: number; pageSize?: number }) {
  const page = Math.max(1, Number(options.page) || 1);
  const pageSize = Math.min(50, Math.max(5, Number(options.pageSize) || 20));
  const where: any = {};
  if (options.status && options.status !== 'all') where.status = options.status;
  const q = String(options.q || '').trim();
  if (q) {
    where.OR = [
      { ref: { contains: q, mode: 'insensitive' } },
      { siteName: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
      { subdomain: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }
  const [total, rows] = await Promise.all([
    prisma.siteRequest.count({ where }),
    prisma.siteRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        site: { select: { id: true, status: true, url: true, subdomain: true, deployError: true } },
      },
    }),
  ]);
  return {
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    requests: rows.map((row) => ({
      ...row,
      receiptUrl: undefined,
      logoUrl: row.logoUrl ? 'stored' : null,
      coverUrl: row.coverUrl ? 'stored' : null,
      hasReceipt: !!row.receiptUrl,
    })),
  };
}

export async function getRequestDetail(id: string) {
  const request = await prisma.siteRequest.findUnique({
    where: { id },
    include: {
      site: {
        include: {
          products: { orderBy: { sortOrder: 'asc' } },
          builds: { orderBy: { createdAt: 'desc' }, take: 10 },
          orders: { orderBy: { createdAt: 'desc' }, take: 50 },
          leads: { orderBy: { createdAt: 'desc' }, take: 50 },
        },
      },
      events: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!request) throw new NotFound('الطلب غير موجود.');
  return request;
}

export async function getFactoryStats() {
  const [totalRequests, newRequests, awaitingPayment, paymentReview, confirmed, published, rejected, sites, orders, leads, recent] =
    await Promise.all([
      prisma.siteRequest.count(),
      prisma.siteRequest.count({ where: { status: 'new' } }),
      prisma.siteRequest.count({ where: { status: 'awaiting-payment' } }),
      prisma.siteRequest.count({ where: { status: 'payment-review' } }),
      prisma.siteRequest.count({ where: { status: 'confirmed' } }),
      prisma.siteRequest.count({ where: { status: 'published' } }),
      prisma.siteRequest.count({ where: { status: 'rejected' } }),
      prisma.site.count(),
      prisma.siteOrder.count(),
      prisma.siteLead.count(),
      prisma.siteRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        select: { id: true, ref: true, siteName: true, status: true, createdAt: true },
      }),
    ]);
  return {
    requests: {
      total: totalRequests,
      new: newRequests,
      awaitingPayment,
      paymentReview,
      confirmed,
      published,
      rejected,
    },
    sites,
    orders,
    leads,
    recent,
  };
}

/* -------------------------------------------------------------------------
 * Templates and packages
 * ---------------------------------------------------------------------- */

export async function adminListTemplates() {
  return prisma.siteTemplate.findMany({ orderBy: { sortOrder: 'asc' } });
}

export async function updateTemplate(id: string, input: any) {
  const data: any = {};
  for (const key of ['nameAr', 'nameFr', 'nameEn', 'descAr', 'descFr', 'descEn', 'category', 'accent']) {
    if (typeof input[key] === 'string') data[key] = input[key].slice(0, key === 'accent' ? 20 : 400);
  }
  if (input.isActive !== undefined) data.isActive = !!input.isActive;
  if (input.sortOrder !== undefined) data.sortOrder = Number(input.sortOrder) || 0;
  if (data.accent && !/^#[0-9a-f]{6}$/i.test(data.accent)) data.accent = '#0b5ed7';
  return prisma.siteTemplate.update({ where: { id }, data });
}

export async function adminListPackages() {
  return prisma.sitePackage.findMany({ orderBy: { sortOrder: 'asc' } });
}

function packageData(input: any) {
  const data: any = {};
  for (const key of ['nameAr', 'nameFr', 'nameEn', 'descAr', 'descFr', 'descEn']) {
    if (typeof input[key] === 'string') data[key] = input[key].slice(0, 400);
  }
  if (input.price !== undefined) data.price = Math.max(0, Number(input.price) || 0);
  if (input.oldPrice !== undefined) data.oldPrice = input.oldPrice === null ? null : Math.max(0, Number(input.oldPrice) || 0);
  if (Array.isArray(input.features)) {
    data.features = input.features
      .slice(0, 20)
      .map((feature: any) => ({
        ar: String(feature?.ar || '').slice(0, 200),
        fr: String(feature?.fr || '').slice(0, 200),
        en: String(feature?.en || '').slice(0, 200),
      }))
      .filter((feature: any) => feature.ar || feature.fr || feature.en);
  }
  if (input.deliveryDays !== undefined) data.deliveryDays = Math.max(1, Math.min(90, Number(input.deliveryDays) || 3));
  if (input.revisions !== undefined) data.revisions = Math.max(0, Math.min(50, Number(input.revisions) || 0));
  if (input.isPopular !== undefined) data.isPopular = !!input.isPopular;
  if (input.isActive !== undefined) data.isActive = !!input.isActive;
  if (input.sortOrder !== undefined) data.sortOrder = Number(input.sortOrder) || 0;
  return data;
}

export async function createPackage(input: any) {
  const slug = String(input.slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  if (!slug) throw new BadRequest('معرّف الباقة مطلوب (أحرف إنجليزية وأرقام).');
  const exists = await prisma.sitePackage.findUnique({ where: { slug } });
  if (exists) throw new Conflict('هذه الباقة موجودة بالفعل.');
  const data = packageData(input);
  if (!data.price) throw new BadRequest('أدخل سعر الباقة.');
  return prisma.sitePackage.create({
    data: {
      slug,
      nameAr: data.nameAr || slug,
      nameFr: data.nameFr || slug,
      nameEn: data.nameEn || slug,
      descAr: data.descAr || '',
      descFr: data.descFr || '',
      descEn: data.descEn || '',
      price: data.price,
      oldPrice: data.oldPrice ?? null,
      features: data.features || [],
      deliveryDays: data.deliveryDays ?? 3,
      revisions: data.revisions ?? 2,
      isPopular: !!data.isPopular,
      isActive: data.isActive !== false,
      sortOrder: data.sortOrder ?? 99,
    },
  });
}

export async function updatePackage(id: string, input: any) {
  const data = packageData(input);
  return prisma.sitePackage.update({ where: { id }, data });
}

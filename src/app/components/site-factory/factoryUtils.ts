/* Shared types, labels and helpers for the website factory UI. */

export type Lang = 'ar' | 'fr' | 'en';
export type Localized = { ar: string; fr: string; en: string };

export interface FactoryTemplate {
  id: string;
  slug: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  descAr: string;
  descFr: string;
  descEn: string;
  category: string;
  accent: string;
  isActive?: boolean;
}

export interface FactoryPackage {
  id: string;
  slug: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  descAr: string;
  descFr: string;
  descEn: string;
  price: number;
  oldPrice?: number | null;
  features: Localized[] | string | null;
  deliveryDays: number;
  revisions: number;
  isPopular: boolean;
}

export interface FactorySettings {
  ownerName: string;
  ownerPhone: string;
  ownerWhatsapp: string;
  ownerEmail: string;
  ccp: string;
  ccpKey: string;
  baridimob: string;
  bankName: string;
  depositPercent: number;
  paymentNote: Localized;
  customDomainNote: Localized;
}

export interface FactoryConfig {
  templates: FactoryTemplate[];
  packages: FactoryPackage[];
  settings: FactorySettings;
  cloudflareConfigured: boolean;
}

export interface FactoryResult {
  request: any;
  siteId: string;
  previewUrl: string;
  ref: string;
  subdomain: string;
  status: string;
  price: number;
}

export interface ProductDraft {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
}

export interface ServiceDraft {
  title: string;
  description: string;
}

export interface Draft {
  templateSlug: string;
  packageSlug: string;
  siteName: string;
  categoryKey: string;
  tagline: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  hours: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  language: Lang;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  coverUrl: string;
  services: ServiceDraft[];
  products: ProductDraft[];
  subdomain: string;
  customDomain: string;
  paymentMethod: '' | 'ccp' | 'baridimob' | 'cash' | 'whatsapp';
}

export const MAX_SERVICES = 8;
export const MAX_PRODUCTS = 30;
export const IMAGE_LIMITS = {
  logo: 120 * 1024,
  cover: 300 * 1024,
  product: 120 * 1024,
  receipt: 600 * 1024,
};

export const CATEGORY_OPTIONS: Array<{ key: string; label: Localized }> = [
  { key: 'retail', label: { ar: 'تجارة وتجزئة', fr: 'Commerce & retail', en: 'Retail & commerce' } },
  { key: 'services', label: { ar: 'خدمات مهنية', fr: 'Services professionnels', en: 'Professional services' } },
  { key: 'tech', label: { ar: 'إعلام آلي وتقنية', fr: 'Informatique & tech', en: 'IT & technology' } },
  { key: 'food', label: { ar: 'مطعم / مقهى', fr: 'Restaurant / café', en: 'Restaurant / café' } },
  { key: 'health', label: { ar: 'صحة وعيادة', fr: 'Santé & cabinet', en: 'Health & clinic' } },
  { key: 'beauty', label: { ar: 'تجميل وعناية', fr: 'Beauté & soins', en: 'Beauty & care' } },
  { key: 'education', label: { ar: 'تعليم وتكوين', fr: 'Éducation & formation', en: 'Education & training' } },
  { key: 'realestate', label: { ar: 'عقارات', fr: 'Immobilier', en: 'Real estate' } },
  { key: 'crafts', label: { ar: 'صناعة تقليدية', fr: 'Artisanat', en: 'Handicrafts' } },
  { key: 'other', label: { ar: 'نشاط آخر', fr: 'Autre activité', en: 'Other activity' } },
];

export const PAYMENT_OPTIONS: Array<{ value: Draft['paymentMethod']; label: Localized; desc: Localized }> = [
  {
    value: 'ccp',
    label: { ar: 'CCP / بريد الجزائر', fr: 'CCP / Algérie Poste', en: 'CCP / Algérie Poste' },
    desc: { ar: 'تحويل عبر الحساب البريدي الجاري', fr: 'Virement sur compte CCP', en: 'Transfer to the CCP account' },
  },
  {
    value: 'baridimob',
    label: { ar: 'BaridiMob', fr: 'BaridiMob', en: 'BaridiMob' },
    desc: { ar: 'دفع سريع من تطبيق بريدي موب', fr: 'Paiement rapide via l’application', en: 'Quick payment from the app' },
  },
  {
    value: 'cash',
    label: { ar: 'نقداً', fr: 'Espèces', en: 'Cash' },
    desc: { ar: 'في المكتب أو عند التسليم', fr: 'Au bureau ou à la livraison', en: 'At the office or on delivery' },
  },
  {
    value: 'whatsapp',
    label: { ar: 'تنسيق عبر واتساب', fr: 'Via WhatsApp', en: 'Coordinate on WhatsApp' },
    desc: { ar: 'نتفق معك على الطريقة المناسبة', fr: 'Nous convenons de la méthode', en: 'We agree on the best method' },
  },
];

export const COLOR_PRESETS = [
  '#0b5ed7',
  '#0f766e',
  '#7c3aed',
  '#db2777',
  '#b45309',
  '#ea580c',
  '#16a34a',
  '#0f172a',
];

export const STATUS_META: Record<string, { label: Localized; classes: string }> = {
  new: {
    label: { ar: 'طلب جديد', fr: 'Nouveau', en: 'New' },
    classes: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  },
  'awaiting-payment': {
    label: { ar: 'بانتظار الدفع', fr: 'En attente de paiement', en: 'Awaiting payment' },
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  'payment-review': {
    label: { ar: 'مراجعة الوصل', fr: 'Reçu en vérification', en: 'Receipt review' },
    classes: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  },
  confirmed: {
    label: { ar: 'تم تأكيد الدفع', fr: 'Paiement confirmé', en: 'Payment confirmed' },
    classes: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  },
  published: {
    label: { ar: 'منشور', fr: 'Publié', en: 'Published' },
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  rejected: {
    label: { ar: 'مرفوض', fr: 'Rejeté', en: 'Rejected' },
    classes: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
};

export const SITE_STATUS_META: Record<string, { label: Localized; classes: string }> = {
  preview: {
    label: { ar: 'معاينة', fr: 'Aperçu', en: 'Preview' },
    classes: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  },
  ready: {
    label: { ar: 'جاهز للنشر', fr: 'Prêt à publier', en: 'Ready to publish' },
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  },
  published: {
    label: { ar: 'منشور', fr: 'Publié', en: 'Published' },
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  suspended: {
    label: { ar: 'معلّق', fr: 'Suspendu', en: 'Suspended' },
    classes: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
  rejected: {
    label: { ar: 'مرفوض', fr: 'Rejeté', en: 'Rejected' },
    classes: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
};

export function emptyDraft(language: Lang): Draft {
  return {
    templateSlug: '',
    packageSlug: '',
    siteName: '',
    categoryKey: 'services',
    tagline: '',
    description: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    hours: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    language,
    primaryColor: '#0b5ed7',
    secondaryColor: '#1e3a8a',
    logoUrl: '',
    coverUrl: '',
    services: [],
    products: [],
    subdomain: '',
    customDomain: '',
    paymentMethod: '',
  };
}

export function pickLocalized(value: any, lang: Lang, fallback = ''): string {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  return value[lang] || value.ar || value.fr || value.en || fallback;
}

export function templateName(template: FactoryTemplate | undefined, lang: Lang): string {
  if (!template) return '';
  return pickLocalized({ ar: template.nameAr, fr: template.nameFr, en: template.nameEn }, lang, template.slug);
}

export function templateDescription(template: FactoryTemplate | undefined, lang: Lang): string {
  if (!template) return '';
  return pickLocalized({ ar: template.descAr, fr: template.descFr, en: template.descEn }, lang);
}

export function packageName(pack: FactoryPackage | undefined, lang: Lang): string {
  if (!pack) return '';
  return pickLocalized({ ar: pack.nameAr, fr: pack.nameFr, en: pack.nameEn }, lang, pack.slug);
}

export function packageDescription(pack: FactoryPackage | undefined, lang: Lang): string {
  if (!pack) return '';
  return pickLocalized({ ar: pack.descAr, fr: pack.descFr, en: pack.descEn }, lang);
}

export function packageFeatures(pack: FactoryPackage | undefined): Localized[] {
  if (!pack || !pack.features) return [];
  let raw: any = pack.features;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((feature: any) => {
      if (typeof feature === 'string') return { ar: feature, fr: feature, en: feature };
      return {
        ar: String(feature?.ar || ''),
        fr: String(feature?.fr || ''),
        en: String(feature?.en || ''),
      };
    })
    .filter((feature: Localized) => feature.ar || feature.fr || feature.en);
}

export function categoryLabel(key: string, lang: Lang): string {
  const option = CATEGORY_OPTIONS.find((item) => item.key === key);
  return option ? pickLocalized(option.label, lang) : '';
}

export function money(value: number, lang: Lang): string {
  const amount = Number(value) || 0;
  const text = amount.toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' ');
  return lang === 'ar' ? `${text} د.ج` : `${text} DA`;
}

export function formatDate(value: string | Date | null | undefined, lang: Lang): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return date.toLocaleString(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return date.toISOString().slice(0, 16).replace('T', ' ');
  }
}

export function normalizeSubdomain(value: string): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\.pages\.dev$/i, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

export function digitsOnly(value: string): string {
  return String(value || '').replace(/\D/g, '');
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function usesServices(slug: string): boolean {
  return ['company', 'portfolio', 'landing'].includes(slug);
}

export function usesProducts(slug: string): boolean {
  return ['store', 'restaurant'].includes(slug);
}

export function fieldClass(error?: string, extra = ''): string {
  return [
    'w-full rounded-xl border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:ring-4',
    error
      ? 'border-red-400 focus:border-red-400 focus:ring-red-500/10'
      : 'border-border focus:border-primary focus:ring-primary/10',
    extra,
  ].join(' ');
}

export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // Fall through to the legacy path.
  }
  try {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', '');
    area.style.cssText = 'position:fixed;top:0;line-height:0;opacity:0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

export function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
    reader.readAsDataURL(file);
  });
}

export function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('IMAGE_READ_ERROR'));
    image.src = source;
  });
}

/**
 * Downscale and compress an image until it fits under `maxBytes`. The browser
 * only ever receives data URLs, which keeps the API stateless.
 */
export async function compressImage(
  file: File,
  maxBytes: number,
  maxDimension: number,
  alpha = false,
): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('NOT_AN_IMAGE');
  if (file.size > 15 * 1024 * 1024) throw new Error('IMAGE_TOO_LARGE');
  const source = await readAsDataURL(file);
  const image = await loadImage(source);
  let scale = Math.min(1, maxDimension / Math.max(image.width, image.height));

  for (let pass = 0; pass < 7; pass++) {
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('CANVAS_ERROR');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (!alpha) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(image, 0, 0, width, height);

    const type = alpha ? 'image/webp' : 'image/jpeg';
    for (let quality = 0.86; quality >= 0.34; quality -= 0.08) {
      const data = canvas.toDataURL(type, quality);
      if (data.length * 0.75 <= maxBytes) return data;
    }
    scale *= 0.78;
    if (Math.min(width, height) <= 90) break;
  }

  if (alpha) return compressImage(file, maxBytes, maxDimension, false);
  throw new Error('IMAGE_TOO_LARGE');
}

export function ownerWhatsapp(settings?: FactorySettings | null): string {
  const digits = digitsOnly(settings?.ownerWhatsapp || settings?.ownerPhone || '');
  if (!digits) return '';
  return digits.startsWith('213') ? digits : `213${digits.replace(/^0+/, '')}`;
}

export function waLink(settings: FactorySettings | null | undefined, message: string): string {
  const number = ownerWhatsapp(settings);
  if (!number) return '';
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

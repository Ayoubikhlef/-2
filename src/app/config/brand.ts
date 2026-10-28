import rawBrand from './brand.json';

export interface LangString {
  ar: string;
  fr: string;
  en: string;
}

export interface BrandContact {
  phone: string;
  phoneDisplay: string;
  phoneInternational: string;
  email: string;
  address: LangString;
  addressFull: LangString;
  facebookUrl: string;
  facebookName: string;
  workingHours: LangString;
  mapsEmbedUrl: string;
}

export interface BrandConfig {
  name: string;
  /** الاسم بالحروف اللاتينية — يُستعمل في الفواتير وملفات PDF. */
  nameLatin?: string;
  shortName: string;
  initials: string;
  description: string;
  domain: string;
  logo: string;
  colors: {
    primary: string;
    gradientTo: string;
  };
  /**
   * true = بيانات الاتصال والاسم في هذا الملف تتغلب على ما هو محفوظ
   * في لوحة التحكم أو على السيرفر. اجعلها false إذا أردت أن يدير العميل
   * بياناته بنفسه من لوحة التحكم.
   */
  lockIdentity: boolean;
  contact: BrandContact;
  developer: {
    name: LangString;
    url: string;
  };
  currency: LangString;
  /** نص «من نحن» الذي يظهر في صفحة About. */
  about: LangString;
}

export const brand = rawBrand as BrandConfig;

/** يختار لون نص مقروء (أبيض أو داكن) حسب سطوع لون الخلفية. */
export function readableForeground(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean;
  const channel = (offset: number) => parseInt(full.slice(offset, offset + 2), 16) / 255;
  const linear = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear(channel(0)) + 0.7152 * linear(channel(2)) + 0.0722 * linear(channel(4));
  return luminance > 0.55 ? '#0f172a' : '#ffffff';
}

function setMeta(selector: string, value: string) {
  document.querySelector(selector)?.setAttribute('content', value);
}

/**
 * يطبّق الهوية (الألوان، الشعار، وسوم المشاركة) على الصفحة عند الإقلاع.
 * يُستدعى مرة واحدة من main.tsx.
 */
export function applyBrand() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const primary = brand.colors.primary;
  const foreground = readableForeground(primary);

  [
    '--primary',
    '--secondary',
    '--accent',
    '--ring',
    '--sidebar-primary',
    '--sidebar-ring',
    '--chart-1',
  ].forEach((name) => root.style.setProperty(name, primary));

  [
    '--primary-foreground',
    '--secondary-foreground',
    '--accent-foreground',
    '--sidebar-primary-foreground',
  ].forEach((name) => root.style.setProperty(name, foreground));

  root.style.setProperty('--brand-gradient-to', brand.colors.gradientTo);

  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', primary);

  let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!icon) {
    icon = document.createElement('link');
    icon.rel = 'icon';
    document.head.appendChild(icon);
  }
  icon.href = brand.logo;

  const siteUrl = `https://${brand.domain}`;
  setMeta('meta[name="description"]', brand.description);
  setMeta('meta[property="og:site_name"]', brand.name);
  setMeta('meta[property="og:title"]', brand.name);
  setMeta('meta[property="og:description"]', brand.description);
  setMeta('meta[property="og:url"]', siteUrl);
  setMeta('meta[property="og:image"]', `${siteUrl}${brand.logo}`);
  setMeta('meta[name="twitter:title"]', brand.name);
  setMeta('meta[name="twitter:description"]', brand.description);
  setMeta('meta[name="twitter:image"]', `${siteUrl}${brand.logo}`);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', siteUrl);
}

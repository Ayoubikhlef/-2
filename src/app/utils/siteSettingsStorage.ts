const SETTINGS_KEY = 'aos_site_settings';
const DELIVERY_KEY = 'aos_delivery_config';

import { syncToServer, loadFromServer } from './serverSync';
import { brand } from '../config/brand';
import {
  DEFAULT_DELIVERY_RULES,
  buildDefaultFeeMap,
  getDeliveryTariff,
  type DeliveryMethod,
  type DeliveryRules,
} from '../data/deliveryTariff';

export interface LangString {
  ar: string;
  fr: string;
  en: string;
}

export interface ContactInfo {
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

/** Legacy tier shape kept so old saved configs still deserialize. */
export interface DeliveryTier {
  label: string;
  wilayaIds: number[];
  fee: number;
}

export interface DeliveryConfig {
  freeThreshold: number;
  /** Locality id (1..69) -> home delivery fee in DZD. */
  homeFees: Record<string, number>;
  /** Locality id (1..69) -> stop-desk fee in DZD. */
  deskFees: Record<string, number>;
  rules: DeliveryRules;
  /** @deprecated Legacy tiers; pricing no longer reads them. */
  tiers?: DeliveryTier[];
}

export interface NavLink {
  href: string;
  label: LangString;
}

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
  developerName: LangString;
  developerUrl: string;
  copyrightName: string;
  copyrightYear: number;
  heroGradientFrom: string;
  heroGradientVia: string;
  heroGradientTo: string;
  footerGradientFrom: string;
  footerGradientVia: string;
  footerGradientTo: string;
  headerNavLinks: NavLink[];
  footerQuickLinks: NavLink[];
  footerQuickLinksTitle: LangString;
  footerContactTitle: LangString;
  developerPrefix: LangString;
}

export interface SiteSettingsAll {
  contact: ContactInfo;
  delivery: DeliveryConfig;
  settings: SiteSettings;
}

const defaultContact: ContactInfo = {
  phone: brand.contact.phone,
  phoneDisplay: brand.contact.phoneDisplay,
  phoneInternational: brand.contact.phoneInternational,
  email: brand.contact.email,
  address: brand.contact.address,
  addressFull: brand.contact.addressFull,
  facebookUrl: brand.contact.facebookUrl,
  facebookName: brand.contact.facebookName,
  workingHours: brand.contact.workingHours,
  mapsEmbedUrl: brand.contact.mapsEmbedUrl,
};

export function getDefaultDeliveryConfig(): DeliveryConfig {
  return {
    freeThreshold: 5000,
    homeFees: buildDefaultFeeMap('home'),
    deskFees: buildDefaultFeeMap('desk'),
    rules: {
      ...DEFAULT_DELIVERY_RULES,
      remoteLocalityIds: [...DEFAULT_DELIVERY_RULES.remoteLocalityIds],
    },
  };
}

const defaultSettings: SiteSettings = {
  siteName: brand.name,
  logoUrl: brand.logo,
  developerName: brand.developer.name,
  developerUrl: brand.developer.url,
  copyrightName: brand.name,
  copyrightYear: 2026,
  heroGradientFrom: '#2563eb',
  heroGradientVia: '#2563eb',
  heroGradientTo: '#1e3a8a',
  footerGradientFrom: '#2563eb',
  footerGradientVia: '#2563eb',
  footerGradientTo: '#1e3a8a',
  headerNavLinks: [
    { href: '#products', label: { ar: 'منتجات', fr: 'Produits', en: 'Products' } },
    { href: '#booking', label: { ar: 'احجز خدمة', fr: 'Réserver', en: 'Book a Service' } },
    { href: '#wishlist', label: { ar: 'المفضلة', fr: 'Souhaits', en: 'Wishlist' } },
    { href: '#faq', label: { ar: 'الأسئلة الشائعة', fr: 'FAQ', en: 'FAQ' } },
    { href: '#contact', label: { ar: 'اتصل بنا', fr: 'Contact', en: 'Contact' } },
  ],
  footerQuickLinks: [
    { href: '#services', label: { ar: 'خدماتنا', fr: 'Nos services', en: 'Our services' } },
    { href: '#contact', label: { ar: 'اتصل بنا', fr: 'Contactez-nous', en: 'Contact us' } },
    { href: '#about', label: { ar: 'عن المتجر', fr: 'À propos', en: 'About Us' } },
    { href: '#terms', label: { ar: 'الشروط والأحكام', fr: 'Conditions', en: 'Terms' } },
    { href: '#privacy', label: { ar: 'سياسة الخصوصية', fr: 'Confidentialité', en: 'Privacy' } },
    { href: '#', label: { ar: 'طباعة ونسخ', fr: 'Impression et copie', en: 'Printing and copying' } },
    { href: '#', label: { ar: 'خدمات الرقمنة', fr: 'Services de numérisation', en: 'Digitization services' } },
  ],
  footerQuickLinksTitle: { ar: 'روابط سريعة', fr: 'Liens rapides', en: 'Quick Links' },
  footerContactTitle: { ar: 'معلومات الاتصال', fr: 'Coordonnées', en: 'Contact Info' },
  developerPrefix: { ar: 'تم التطوير بواسطة', fr: 'Développé par', en: 'Developed by' },
};

function getContact(): ContactInfo {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY + '_contact');
    const merged = raw ? { ...defaultContact, ...JSON.parse(raw) } : { ...defaultContact };
    // When the brand is locked, the values in brand.json always win, so a
    // cloned deployment can never show the previous client's phone/address.
    if (brand.lockIdentity) Object.assign(merged, brand.contact);
    if (!merged.mapsEmbedUrl || merged.mapsEmbedUrl.includes('/maps/embed?pb=')) {
      merged.mapsEmbedUrl = brand.contact.mapsEmbedUrl;
    }
    return merged;
  } catch { return { ...defaultContact }; }
}
function dispatchAndSync() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  const all = { contact: getContact(), delivery: getDelivery(), settings: getSettings() };
  syncToServer('aos_site_settings', all);
}

function saveContact(data: ContactInfo): void {
  localStorage.setItem(SETTINGS_KEY + '_contact', JSON.stringify(data));
  dispatchAndSync();
}

function getDelivery(): DeliveryConfig {
  const defaults = getDefaultDeliveryConfig();
  try {
    const raw = localStorage.getItem(DELIVERY_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<DeliveryConfig>;
    return {
      ...defaults,
      ...parsed,
      homeFees: { ...defaults.homeFees, ...(parsed.homeFees || {}) },
      deskFees: { ...defaults.deskFees, ...(parsed.deskFees || {}) },
      rules: {
        ...defaults.rules,
        ...(parsed.rules || {}),
        remoteLocalityIds: Array.isArray(parsed.rules?.remoteLocalityIds)
          ? parsed.rules.remoteLocalityIds.map(Number).filter((id) => Number.isFinite(id))
          : defaults.rules.remoteLocalityIds,
      },
    };
  } catch { return defaults; }
}
function saveDelivery(data: DeliveryConfig): void {
  localStorage.setItem(DELIVERY_KEY, JSON.stringify(data));
  dispatchAndSync();
}

function getSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const merged = raw ? { ...defaultSettings, ...JSON.parse(raw) } : { ...defaultSettings };
    if (brand.lockIdentity) {
      merged.siteName = brand.name;
      merged.logoUrl = brand.logo;
      merged.copyrightName = brand.name;
      merged.developerName = brand.developer.name;
      merged.developerUrl = brand.developer.url;
      merged.heroGradientFrom = brand.colors.primary;
      merged.heroGradientVia = brand.colors.primary;
      merged.heroGradientTo = brand.colors.gradientTo;
      merged.footerGradientFrom = brand.colors.primary;
      merged.footerGradientVia = brand.colors.primary;
      merged.footerGradientTo = brand.colors.gradientTo;
    }
    return merged;
  } catch { return { ...defaultSettings }; }
}
function saveSettings(data: SiteSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  dispatchAndSync();
}

export function getSiteSettings(): SiteSettingsAll {
  return { contact: getContact(), delivery: getDelivery(), settings: getSettings() };
}

export function updateContact(data: Partial<ContactInfo>): ContactInfo {
  const cur = getContact(); const next = { ...cur, ...data }; saveContact(next); return next;
}
export function updateDelivery(data: Partial<DeliveryConfig>): DeliveryConfig {
  const cur = getDelivery();
  const next: DeliveryConfig = {
    ...cur,
    ...data,
    homeFees: data.homeFees ? { ...cur.homeFees, ...data.homeFees } : cur.homeFees,
    deskFees: data.deskFees ? { ...cur.deskFees, ...data.deskFees } : cur.deskFees,
    rules: data.rules ? { ...cur.rules, ...data.rules } : cur.rules,
  };
  saveDelivery(next);
  return next;
}
export function updateSiteSettings(data: Partial<SiteSettings>): SiteSettings {
  const cur = getSettings(); const next = { ...cur, ...data }; saveSettings(next); return next;
}

export async function loadSiteSettingsFromServer(): Promise<boolean> {
  try {
    const data = await loadFromServer<SiteSettingsAll>('aos_site_settings');
    if (data) {
      localStorage.setItem(SETTINGS_KEY + '_contact', JSON.stringify(data.contact));
      localStorage.setItem(DELIVERY_KEY, JSON.stringify(data.delivery));
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
      return true;
    }
  } catch {}
  return false;
}

export function getDeliveryConfig(): DeliveryConfig {
  return getDelivery();
}

export function getDeliveryFee(localityId: number, method: DeliveryMethod = 'home'): number {
  const config = getDelivery();
  const fees = method === 'desk' ? config.deskFees : config.homeFees;
  const configured = Number(fees[String(localityId)]);
  if (Number.isFinite(configured) && configured >= 0) return configured;
  const fallback = getDeliveryTariff(localityId);
  return method === 'desk' ? fallback.desk : fallback.home;
}
export function isFreeDelivery(subtotal: number): boolean {
  const threshold = getDelivery().freeThreshold;
  return threshold > 0 && subtotal >= threshold;
}
export const FREE_DELIVERY_THRESHOLD = 5000;

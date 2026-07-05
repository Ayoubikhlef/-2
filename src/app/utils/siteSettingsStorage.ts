const SETTINGS_KEY = 'aos_site_settings';
const DELIVERY_KEY = 'aos_delivery_config';

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

export interface DeliveryTier {
  label: string;
  wilayaIds: number[];
  fee: number;
}

export interface DeliveryConfig {
  tiers: DeliveryTier[];
  freeThreshold: number;
}

export interface SiteSettings {
  siteName: string;
  logoUrl: string;
  developerName: LangString;
  developerUrl: string;
}

export interface SiteSettingsAll {
  contact: ContactInfo;
  delivery: DeliveryConfig;
  settings: SiteSettings;
}

const defaultContact: ContactInfo = {
  phone: '0674113290',
  phoneDisplay: '0674 11 32 90',
  phoneInternational: '213674113290',
  email: 'ayoub.office.services@gmail.com',
  address: {
    ar: 'الشارع الكبير، الميلية، جيجل',
    fr: 'Grand Boulevard, El Milia, Jijel',
    en: 'Grand Boulevard, El Milia, Jijel',
  },
  addressFull: {
    ar: 'الشارع الكبير، الميلية، جيجل 18300',
    fr: 'Grand Boulevard, El Milia, Jijel 18300',
    en: 'Grand Boulevard, El Milia, Jijel 18300',
  },
  facebookUrl: 'https://www.facebook.com/share/1BTrNWjYPx/',
  facebookName: 'Ayoub Office Services',
  workingHours: {
    ar: 'السبت - الخميس: 08:00 - 19:00',
    fr: 'Samedi - Jeudi: 08:00 - 19:00',
    en: 'Sat - Thu: 08:00 - 19:00',
  },
  mapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3194.56!2d6.2718334!3d36.7477532!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12f22300057e0d4b%3A0xb89044f1e5f9512e!2sAyoub+Office+Services!5e0!3m2!1sar!2sdz',
};

const defaultDelivery: DeliveryConfig = {
  freeThreshold: 5000,
  tiers: [
    { label: 'Tier 1 (200 DA)', fee: 200, wilayaIds: [18] },
    { label: 'Tier 2 (400 DA)', fee: 400, wilayaIds: [6, 10, 15, 19, 21, 34, 35, 43, 25, 24, 36, 23, 41, 12, 40, 4] },
    { label: 'Tier 3 (600 DA)', fee: 600, wilayaIds: [16, 9, 26, 42, 44, 2, 27, 48, 29, 31, 46, 22, 13, 20, 14, 38, 17, 28, 5, 7, 3, 32, 45] },
    { label: 'Tier 4 (900 DA)', fee: 900, wilayaIds: [30, 47, 39, 55, 57, 58, 1, 49, 37, 11, 33, 53, 54, 56, 8, 52, 50] },
  ],
};

const defaultSettings: SiteSettings = {
  siteName: 'Ayoub Office Services',
  logoUrl: '/aos-logo3.png',
  developerName: { ar: 'أيوب يخلف', fr: 'Ayoub Ikhlef', en: 'Ayoub Ikhlef' },
  developerUrl: 'https://www.facebook.com/share/1BTrNWjYPx/',
};

function getContact(): ContactInfo {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY + '_contact');
    return raw ? { ...defaultContact, ...JSON.parse(raw) } : defaultContact;
  } catch { return defaultContact; }
}

function saveContact(data: ContactInfo): void {
  localStorage.setItem(SETTINGS_KEY + '_contact', JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

function getDelivery(): DeliveryConfig {
  try {
    const raw = localStorage.getItem(DELIVERY_KEY);
    return raw ? { ...defaultDelivery, ...JSON.parse(raw) } : defaultDelivery;
  } catch { return defaultDelivery; }
}

function saveDelivery(data: DeliveryConfig): void {
  localStorage.setItem(DELIVERY_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

function getSettings(): SiteSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch { return defaultSettings; }
}

function saveSettings(data: SiteSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

export function getSiteSettings(): SiteSettingsAll {
  return {
    contact: getContact(),
    delivery: getDelivery(),
    settings: getSettings(),
  };
}

export function updateContact(data: Partial<ContactInfo>): ContactInfo {
  const current = getContact();
  const next = { ...current, ...data };
  saveContact(next);
  return next;
}

export function updateDelivery(data: Partial<DeliveryConfig>): DeliveryConfig {
  const current = getDelivery();
  const next = { ...current, ...data };
  if (data.tiers) next.tiers = data.tiers;
  saveDelivery(next);
  return next;
}

export function updateSiteSettings(data: Partial<SiteSettings>): SiteSettings {
  const current = getSettings();
  const next = { ...current, ...data };
  saveSettings(next);
  return next;
}

export function getDeliveryFee(wilayaId: number): number {
  const config = getDelivery();
  for (const tier of config.tiers) {
    if (tier.wilayaIds.includes(wilayaId)) return tier.fee;
  }
  return 600;
}

export function isFreeDelivery(subtotal: number): boolean {
  return subtotal >= getDelivery().freeThreshold;
}

export const FREE_DELIVERY_THRESHOLD = 5000;

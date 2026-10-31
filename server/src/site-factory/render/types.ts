import type { Lang, Localized } from '../defaults';

export interface RenderProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  category?: string | null;
}

export interface RenderService {
  title: string;
  description: string;
}

export interface RenderConfig {
  siteId: string;
  templateSlug: string;
  siteName: string;
  tagline: string;
  description: string;
  category: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  language: Lang;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string | null;
  /** Filled by the renderer after the logo has been extracted to a file. */
  logoAssetPath?: string | null;
  coverUrl?: string | null;
  socials?: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  } | null;
  hours?: string | null;
  services: RenderService[];
  products: RenderProduct[];
  subdomain: string;
  customDomain?: string | null;
  preview?: boolean;
  apiBase: string;
}

export interface RenderedFile {
  content: string;
  encoding: 'utf8' | 'base64';
  type: string;
}

export interface RenderedSite {
  files: Record<string, RenderedFile>;
  defaultPage: string;
  pages: Record<string, string>;
  siteUrl: string;
  previewUrl?: string;
  size: number;
}

export interface UiStrings {
  dir: 'rtl' | 'ltr';
  langName: string;
  home: string;
  products: string;
  services: string;
  about: string;
  contact: string;
  menu: string;
  gallery: string;
  reservation: string;
  work: string;
  faq: string;
  order: string;
  orderNow: string;
  call: string;
  whatsapp: string;
  email: string;
  location: string;
  hours: string;
  openNow: string;
  follow: string;
  rights: string;
  quickLinks: string;
  contactUs: string;
  addToCart: string;
  cart: string;
  checkout: string;
  emptyCart: string;
  total: string;
  name: string;
  phone: string;
  wilaya: string;
  city: string;
  address: string;
  note: string;
  send: string;
  sending: string;
  orderSuccess: string;
  orderError: string;
  continueShopping: string;
  delivery: string;
  quality: string;
  support: string;
  secure: string;
  featured: string;
  all: string;
  search: string;
  ourServices: string;
  ourWork: string;
  selectedWork: string;
  skills: string;
  available: string;
  saveContact: string;
  share: string;
  callNow: string;
  bookTable: string;
  guests: string;
  date: string;
  time: string;
  book: string;
  bookSuccess: string;
  getStarted: string;
  sendMessage: string;
  message: string;
  messageSuccess: string;
  formError: string;
  viewMenu: string;
  orderWhatsapp: string;
  openMenu: string;
  closeMenu: string;
  backTop: string;
  offer: string;
  benefits: string;
  testimonials: string;
  years: string;
  clients: string;
  projects: string;
  satisfaction: string;
  process: string;
  step1: string;
  step2: string;
  step3: string;
  step4: string;
  step1d: string;
  step2d: string;
  step3d: string;
  step4d: string;
  whyUs: string;
  previewNote: string;
  required: string;
  invalidPhone: string;
  lightbox: string;
  close: string;
  quantity: string;
  remove: string;
  subtotal: string;
  orderSummary: string;
  poweredBy: string;
  legal: string;
}

const AR: UiStrings = {
  dir: 'rtl', langName: 'العربية',
  home: 'الرئيسية', products: 'المنتجات', services: 'الخدمات', about: 'من نحن',
  contact: 'اتصل بنا', menu: 'القائمة', gallery: 'الصور', reservation: 'حجز طاولة',
  work: 'أعمالنا', faq: 'الأسئلة الشائعة', order: 'اطلب', orderNow: 'اطلب الآن',
  call: 'اتصل', whatsapp: 'واتساب', email: 'البريد', location: 'الموقع',
  hours: 'أوقات العمل', openNow: 'مفتوح الآن', follow: 'تابعنا', rights: 'جميع الحقوق محفوظة',
  quickLinks: 'روابط سريعة', contactUs: 'معلومات الاتصال',
  addToCart: 'أضف للسلة', cart: 'سلة التسوق', checkout: 'إتمام الطلب',
  emptyCart: 'سلتك فارغة', total: 'المجموع', name: 'الاسم الكامل', phone: 'رقم الهاتف',
  wilaya: 'الولاية', city: 'البلدية', address: 'العنوان', note: 'ملاحظة (اختياري)',
  send: 'إرسال الطلب', sending: 'جارٍ الإرسال...', orderSuccess: 'تم استلام طلبك بنجاح! سنتصل بك قريباً.',
  orderError: 'تعذر إرسال الطلب. حاول مرة أخرى أو تواصل معنا عبر واتساب.',
  continueShopping: 'متابعة التسوق', delivery: 'توصيل سريع', quality: 'جودة مضمونة',
  support: 'دعم ومتابعة', secure: 'دفع عند الاستلام', featured: 'منتجات مميزة', all: 'الكل',
  search: 'ابحث عن منتج...', ourServices: 'خدماتنا', ourWork: 'أعمالنا', selectedWork: 'مختارات من أعمالنا',
  skills: 'المهارات', available: 'متاح للعمل', saveContact: 'حفظ جهة الاتصال', share: 'مشاركة',
  callNow: 'اتصل الآن', bookTable: 'احجز طاولة', guests: 'عدد الأشخاص', date: 'التاريخ', time: 'الوقت',
  book: 'تأكيد الحجز', bookSuccess: 'تم استلام حجزك! سنتواصل معك للتأكيد.', getStarted: 'ابدأ الآن',
  sendMessage: 'أرسل رسالة', message: 'رسالتك', messageSuccess: 'تم إرسال رسالتك بنجاح. شكراً لتواصلك!',
  formError: 'تعذر الإرسال. تحقق من البيانات وحاول مجدداً.', viewMenu: 'عرض القائمة', orderWhatsapp: 'اطلب عبر واتساب',
  openMenu: 'فتح القائمة', closeMenu: 'إغلاق القائمة', backTop: 'العودة للأعلى', offer: 'عرض خاص',
  benefits: 'لماذا نحن؟', testimonials: 'آراء عملائنا', years: 'سنوات خبرة', clients: 'عميل سعيد',
  projects: 'مشروع منجز', satisfaction: 'رضا العملاء', process: 'كيف نعمل', step1: 'التواصل',
  step2: 'التصميم', step3: 'التطوير', step4: 'التسليم', step1d: 'نستمع لاحتياجاتك وأهدافك.',
  step2d: 'نصمم واجهة تناسب علامتك.', step3d: 'نبني موقعاً سريعاً وآمناً.', step4d: 'ننشر موقعك ونتابع معك.',
  whyUs: 'لماذا تختارنا؟', previewNote: 'معاينة مجانية — الموقع غير منشور بعد',
  required: 'هذا الحقل مطلوب', invalidPhone: 'رقم الهاتف غير صحيح', lightbox: 'عرض الصورة', close: 'إغلاق',
  quantity: 'الكمية', remove: 'حذف', subtotal: 'المجموع الفرعي', orderSummary: 'ملخص الطلب',
  poweredBy: '', legal: 'سياسة الخصوصية',
};

const FR: UiStrings = {
  dir: 'ltr', langName: 'Français',
  home: 'Accueil', products: 'Produits', services: 'Services', about: 'À propos',
  contact: 'Contact', menu: 'Menu', gallery: 'Galerie', reservation: 'Réservation',
  work: 'Réalisations', faq: 'FAQ', order: 'Commander', orderNow: 'Commander',
  call: 'Appeler', whatsapp: 'WhatsApp', email: 'E-mail', location: 'Adresse',
  hours: 'Horaires', openNow: 'Ouvert', follow: 'Suivez-nous', rights: 'Tous droits réservés',
  quickLinks: 'Liens rapides', contactUs: 'Coordonnées',
  addToCart: 'Ajouter au panier', cart: 'Panier', checkout: 'Commander',
  emptyCart: 'Votre panier est vide', total: 'Total', name: 'Nom complet', phone: 'Téléphone',
  wilaya: 'Wilaya', city: 'Commune', address: 'Adresse', note: 'Note (facultatif)',
  send: 'Envoyer la commande', sending: 'Envoi...', orderSuccess: 'Commande reçue ! Nous vous appellerons bientôt.',
  orderError: 'Échec de l’envoi. Réessayez ou contactez-nous sur WhatsApp.',
  continueShopping: 'Continuer mes achats', delivery: 'Livraison rapide', quality: 'Qualité garantie',
  support: 'Support & suivi', secure: 'Paiement à la livraison', featured: 'Produits vedettes', all: 'Tout',
  search: 'Rechercher un produit...', ourServices: 'Nos services', ourWork: 'Nos réalisations', selectedWork: 'Une sélection de nos travaux',
  skills: 'Compétences', available: 'Disponible', saveContact: 'Enregistrer le contact', share: 'Partager',
  callNow: 'Appeler', bookTable: 'Réserver une table', guests: 'Personnes', date: 'Date', time: 'Heure',
  book: 'Confirmer', bookSuccess: 'Réservation reçue ! Nous vous confirmerons rapidement.', getStarted: 'Commencer',
  sendMessage: 'Envoyer', message: 'Votre message', messageSuccess: 'Message envoyé avec succès. Merci !',
  formError: 'Échec de l’envoi. Vérifiez vos données et réessayez.', viewMenu: 'Voir le menu', orderWhatsapp: 'Commander sur WhatsApp',
  openMenu: 'Ouvrir le menu', closeMenu: 'Fermer le menu', backTop: 'Haut de page', offer: 'Offre spéciale',
  benefits: 'Pourquoi nous ?', testimonials: 'Avis clients', years: 'ans d’expérience', clients: 'clients satisfaits',
  projects: 'projets réalisés', satisfaction: 'satisfaction client', process: 'Notre méthode', step1: 'Échange',
  step2: 'Design', step3: 'Développement', step4: 'Livraison', step1d: 'Nous écoutons vos besoins.',
  step2d: 'Nous créons un design à votre image.', step3d: 'Nous développons un site rapide et sûr.', step4d: 'Nous publions et assurons le suivi.',
  whyUs: 'Pourquoi nous choisir ?', previewNote: 'Aperçu gratuit — site non publié',
  required: 'Champ obligatoire', invalidPhone: 'Numéro invalide', lightbox: 'Voir l’image', close: 'Fermer',
  quantity: 'Quantité', remove: 'Supprimer', subtotal: 'Sous-total', orderSummary: 'Récapitulatif',
  poweredBy: '', legal: 'Confidentialité',
};

const EN: UiStrings = {
  dir: 'ltr', langName: 'English',
  home: 'Home', products: 'Products', services: 'Services', about: 'About',
  contact: 'Contact', menu: 'Menu', gallery: 'Gallery', reservation: 'Reservation',
  work: 'Work', faq: 'FAQ', order: 'Order', orderNow: 'Order now',
  call: 'Call', whatsapp: 'WhatsApp', email: 'Email', location: 'Location',
  hours: 'Opening hours', openNow: 'Open now', follow: 'Follow us', rights: 'All rights reserved',
  quickLinks: 'Quick links', contactUs: 'Contact details',
  addToCart: 'Add to cart', cart: 'Cart', checkout: 'Checkout',
  emptyCart: 'Your cart is empty', total: 'Total', name: 'Full name', phone: 'Phone',
  wilaya: 'Province', city: 'City', address: 'Address', note: 'Note (optional)',
  send: 'Place order', sending: 'Sending...', orderSuccess: 'Order received! We will call you soon.',
  orderError: 'Could not send the order. Try again or contact us on WhatsApp.',
  continueShopping: 'Continue shopping', delivery: 'Fast delivery', quality: 'Guaranteed quality',
  support: 'Support & follow-up', secure: 'Cash on delivery', featured: 'Featured products', all: 'All',
  search: 'Search products...', ourServices: 'Our services', ourWork: 'Our work', selectedWork: 'Selected work',
  skills: 'Skills', available: 'Available for work', saveContact: 'Save contact', share: 'Share',
  callNow: 'Call now', bookTable: 'Book a table', guests: 'Guests', date: 'Date', time: 'Time',
  book: 'Confirm booking', bookSuccess: 'Booking received! We will confirm shortly.', getStarted: 'Get started',
  sendMessage: 'Send message', message: 'Your message', messageSuccess: 'Message sent successfully. Thank you!',
  formError: 'Could not send. Check your details and try again.', viewMenu: 'View menu', orderWhatsapp: 'Order on WhatsApp',
  openMenu: 'Open menu', closeMenu: 'Close menu', backTop: 'Back to top', offer: 'Special offer',
  benefits: 'Why choose us', testimonials: 'Client reviews', years: 'years of experience', clients: 'happy clients',
  projects: 'projects delivered', satisfaction: 'client satisfaction', process: 'How we work', step1: 'Discovery',
  step2: 'Design', step3: 'Build', step4: 'Launch', step1d: 'We listen to your needs and goals.',
  step2d: 'We design around your brand.', step3d: 'We build a fast, secure website.', step4d: 'We publish and support you.',
  whyUs: 'Why choose us?', previewNote: 'Free preview — not published yet',
  required: 'This field is required', invalidPhone: 'Invalid phone number', lightbox: 'View image', close: 'Close',
  quantity: 'Quantity', remove: 'Remove', subtotal: 'Subtotal', orderSummary: 'Order summary',
  poweredBy: '', legal: 'Privacy',
};

export function ui(lang: Lang): UiStrings {
  return lang === 'ar' ? AR : lang === 'fr' ? FR : EN;
}

export function esc(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function attr(value: string | null | undefined): string {
  return esc(value).replace(/`/g, '&#96;');
}

export function jsonForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export function pick(value: Localized | undefined, lang: Lang): string {
  if (!value) return '';
  return value[lang] || value.ar || value.fr || value.en || '';
}

export function normalizePhone(raw: string): string {
  const digits = String(raw || '').replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  if (digits.startsWith('0')) return `+213${digits.slice(1)}`;
  if (digits.startsWith('213')) return `+${digits}`;
  return digits;
}

export function waNumber(raw: string): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('213')) return digits;
  if (digits.startsWith('0')) return `213${digits.slice(1)}`;
  return digits;
}

export function waLink(raw: string, message: string): string {
  const number = waNumber(raw);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '#';
}

export function formatPrice(price: number): string {
  const rounded = Math.round(Number(price) || 0);
  return new Intl.NumberFormat('fr-FR').format(rounded);
}

export function money(price: number, lang: Lang): string {
  const suffix = lang === 'ar' ? 'دج' : 'DA';
  return `${formatPrice(price)} ${suffix}`;
}

export function safeColor(value: string | undefined, fallback: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value) : fallback;
}

export function dataUrlAsset(
  value: string | null | undefined,
): { buffer: Buffer; ext: string; type: string } | null {
  if (!value) return null;
  const match = /^data:([a-zA-Z0-9.+-]+\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(value.trim());
  if (!match) return null;
  const type = match[1].toLowerCase();
  const allowed: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
  };
  const ext = allowed[type];
  if (!ext) return null;
  try {
    const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    if (!buffer.length || buffer.length > 2.5 * 1024 * 1024) return null;
    // Never trust the MIME label alone: a data URL that claims image/png but
    // contains HTML/SVG would otherwise be stored and later served from our
    // own API origin, turning preview files into a stored-XSS vector.
    if (!matchesImageSignature(buffer, ext)) return null;
    return { buffer, ext, type };
  } catch {
    return null;
  }
}

function matchesImageSignature(buffer: Buffer, ext: string): boolean {
  if (ext === 'png') {
    return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (ext === 'jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (ext === 'webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  if (ext === 'gif') {
    const header = buffer.subarray(0, 6).toString('ascii');
    return header === 'GIF87a' || header === 'GIF89a';
  }
  if (ext === 'pdf') {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }
  return false;
}

export const MIME: Record<string, string> = {
  html: 'text/html; charset=utf-8',
  css: 'text/css; charset=utf-8',
  js: 'application/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8',
  xml: 'application/xml; charset=utf-8',
  txt: 'text/plain; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  ico: 'image/x-icon',
  pdf: 'application/pdf',
  webmanifest: 'application/manifest+json',
};

export function mimeFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  return MIME[ext] || 'application/octet-stream';
}

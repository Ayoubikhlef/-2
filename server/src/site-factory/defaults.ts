/**
 * Default templates, packages and factory settings.
 *
 * Everything in this file is editable from the admin panel. The values are
 * upserted on boot, but existing admin edits are never overwritten.
 */

export type Lang = 'ar' | 'fr' | 'en';

export interface Localized {
  ar: string;
  fr: string;
  en: string;
}

export interface TemplateSeed {
  slug: string;
  name: Localized;
  description: Localized;
  category: string;
  accent: string;
  sortOrder: number;
}

export interface PackageSeed {
  slug: string;
  name: Localized;
  description: Localized;
  price: number;
  oldPrice?: number;
  features: Localized[];
  deliveryDays: number;
  revisions: number;
  isPopular: boolean;
  sortOrder: number;
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

export const TEMPLATES: TemplateSeed[] = [
  {
    slug: 'store',
    category: 'store',
    accent: '#0b5ed7',
    sortOrder: 1,
    name: { ar: 'متجر إلكتروني', fr: 'Boutique en ligne', en: 'Online Store' },
    description: {
      ar: 'قالب متجر كامل مع المنتجات، السلة، الطلبات، تصفية المنتجات وزر واتساب. مناسب للمتاجر والمحلات.',
      fr: 'Boutique complète avec produits, panier, commandes, filtres et WhatsApp. Idéale pour les commerces.',
      en: 'A complete store with products, cart, orders, filters and WhatsApp. Perfect for shops and retailers.',
    },
  },
  {
    slug: 'company',
    category: 'company',
    accent: '#0f766e',
    sortOrder: 2,
    name: { ar: 'موقع شركة', fr: 'Site d’entreprise', en: 'Company Website' },
    description: {
      ar: 'موقع مؤسسي أنيق لعرض الخدمات، الأرقام، مراحل العمل وطلب عرض سعر. مناسب للشركات والمكاتب.',
      fr: 'Site institutionnel élégant : services, chiffres, processus et demande de devis. Pour entreprises et cabinets.',
      en: 'A polished corporate site with services, stats, process and quote requests. Built for companies and agencies.',
    },
  },
  {
    slug: 'portfolio',
    category: 'portfolio',
    accent: '#7c3aed',
    sortOrder: 3,
    name: { ar: 'معرض أعمال', fr: 'Portfolio', en: 'Portfolio' },
    description: {
      ar: 'قالب إبداعي لعرض المشاريع والمهارات والشهادات مع صفحة تواصل. مناسب للمصممين والمصورين والمطورين.',
      fr: 'Portfolio créatif pour projets, compétences et contact. Pour designers, photographes et développeurs.',
      en: 'A creative portfolio for projects, skills and contact. Ideal for designers, photographers and developers.',
    },
  },
  {
    slug: 'card',
    category: 'card',
    accent: '#db2777',
    sortOrder: 4,
    name: { ar: 'بطاقة أعمال رقمية', fr: 'Carte de visite numérique', en: 'Digital Business Card' },
    description: {
      ar: 'بطاقة رقمية واحدة تجمع الاتصال، واتساب، البريد، الموقع وحفظ جهة الاتصال. مثالية للمهنيين.',
      fr: 'Une carte numérique avec appel, WhatsApp, e-mail, localisation et enregistrement du contact.',
      en: 'One digital card with call, WhatsApp, email, location and save-contact actions. Perfect for professionals.',
    },
  },
  {
    slug: 'restaurant',
    category: 'restaurant',
    accent: '#b45309',
    sortOrder: 5,
    name: { ar: 'مطعم / مقهى', fr: 'Restaurant / Café', en: 'Restaurant / Café' },
    description: {
      ar: 'قائمة طعام رقمية، أوقات العمل، الموقع، حجز طاولة وطلب عبر واتساب. مناسب للمطاعم والمقاهي.',
      fr: 'Menu numérique, horaires, adresse, réservation et commande WhatsApp. Pour restaurants et cafés.',
      en: 'Digital menu, opening hours, location, table reservation and WhatsApp ordering. For restaurants and cafés.',
    },
  },
  {
    slug: 'landing',
    category: 'landing',
    accent: '#ea580c',
    sortOrder: 6,
    name: { ar: 'صفحة هبوط', fr: 'Page de vente', en: 'Landing Page' },
    description: {
      ar: 'صفحة تسويقية مركزة تحوّل الزوار إلى عملاء: عرض، مزايا، آراء، أسئلة شائعة ونموذج طلب.',
      fr: 'Une page de conversion : offre, avantages, témoignages, FAQ et formulaire de contact.',
      en: 'A conversion-focused page: offer, benefits, testimonials, FAQ and a lead form.',
    },
  },
];

export const PACKAGES: PackageSeed[] = [
  {
    slug: 'basic',
    price: 25000,
    deliveryDays: 3,
    revisions: 2,
    isPopular: false,
    sortOrder: 1,
    name: { ar: 'الباقة الأساسية', fr: 'Essentiel', en: 'Essential' },
    description: {
      ar: 'موقع احترافي من 3 صفحات، مناسب للبداية وحضورك الأول على الإنترنت.',
      fr: 'Un site professionnel de 3 pages pour démarrer votre présence en ligne.',
      en: 'A professional 3-page website to start your online presence.',
    },
    features: [
      { ar: 'نطاق فرعي مجاني name.pages.dev', fr: 'Sous-domaine gratuit name.pages.dev', en: 'Free name.pages.dev subdomain' },
      { ar: '3 صفحات + صفحة تواصل', fr: '3 pages + page contact', en: '3 pages + contact page' },
      { ar: 'تصميم متجاوب مع الهاتف', fr: 'Design responsive mobile', en: 'Mobile-responsive design' },
      { ar: '3 لغات: عربي / فرنسي / إنجليزي', fr: '3 langues : AR / FR / EN', en: '3 languages: AR / FR / EN' },
      { ar: 'زر واتساب وخرائط Google', fr: 'Bouton WhatsApp + Google Maps', en: 'WhatsApp button + Google Maps' },
      { ar: 'تحسين SEO أساسي', fr: 'SEO de base', en: 'Basic SEO' },
      { ar: 'تعديلان مجاناً', fr: '2 révisions gratuites', en: '2 free revisions' },
      { ar: 'تسليم خلال 3 أيام', fr: 'Livraison en 3 jours', en: 'Delivery in 3 days' },
    ],
  },
  {
    slug: 'business',
    price: 45000,
    deliveryDays: 5,
    revisions: 4,
    isPopular: true,
    sortOrder: 2,
    name: { ar: 'باقة الأعمال', fr: 'Business', en: 'Business' },
    description: {
      ar: 'الأكثر طلباً: موقع كامل يعرض خدماتك ويستقبل طلبات العملاء مع تحسين محركات البحث.',
      fr: 'La plus demandée : un site complet avec services, demandes clients et SEO avancé.',
      en: 'The most popular: a full site with services, lead capture and stronger SEO.',
    },
    features: [
      { ar: 'كل ما في الباقة الأساسية', fr: 'Tout l’Essentiel inclus', en: 'Everything in Essential' },
      { ar: '5 صفحات احترافية', fr: '5 pages professionnelles', en: '5 professional pages' },
      { ar: 'نموذج طلبات + إشعار واتساب', fr: 'Formulaire + notification WhatsApp', en: 'Lead form + WhatsApp notification' },
      { ar: 'معرض صور وأعمال', fr: 'Galerie photos et réalisations', en: 'Photo & work gallery' },
      { ar: 'خريطة وأوقات العمل', fr: 'Carte et horaires', en: 'Map & opening hours' },
      { ar: 'تحسين SEO متقدم + Open Graph', fr: 'SEO avancé + Open Graph', en: 'Advanced SEO + Open Graph' },
      { ar: '4 تعديلات مجاناً', fr: '4 révisions gratuites', en: '4 free revisions' },
      { ar: 'تسليم خلال 5 أيام', fr: 'Livraison en 5 jours', en: 'Delivery in 5 days' },
    ],
  },
  {
    slug: 'pro',
    price: 75000,
    deliveryDays: 7,
    revisions: 7,
    isPopular: false,
    sortOrder: 3,
    name: { ar: 'الباقة الاحترافية', fr: 'Pro', en: 'Pro' },
    description: {
      ar: 'للمتاجر والمشاريع الجادة: سلة وطلبات، إدارة منتجات، ربط نطاقك الخاص ودعم موسّع.',
      fr: 'Pour les boutiques et projets sérieux : panier, commandes, gestion produits, domaine et support.',
      en: 'For serious stores and projects: cart, orders, product management, custom domain and support.',
    },
    features: [
      { ar: 'كل ما في باقة الأعمال', fr: 'Tout Business inclus', en: 'Everything in Business' },
      { ar: 'متجر إلكتروني كامل مع سلة وطلبات', fr: 'Boutique complète avec panier et commandes', en: 'Full store with cart & orders' },
      { ar: 'إدارة المنتجات والأسعار', fr: 'Gestion des produits et prix', en: 'Product & price management' },
      { ar: 'ربط نطاقك الخاص (تشترى باسمك)', fr: 'Votre domaine personnalisé', en: 'Your own custom domain' },
      { ar: 'أرشفة الطلبات وتصديرها', fr: 'Archivage et export des commandes', en: 'Order archive & export' },
      { ar: 'تحسين SEO متقدم + خريطة موقع', fr: 'SEO avancé + sitemap', en: 'Advanced SEO + sitemap' },
      { ar: '7 تعديلات مجاناً', fr: '7 révisions gratuites', en: '7 free revisions' },
      { ar: 'دعم 90 يوماً + أولوية التنفيذ', fr: 'Support 90 jours + priorité', en: '90-day support + priority' },
    ],
  },
];

export const DEFAULT_FACTORY_SETTINGS: FactorySettings = {
  ownerName: 'AYOUB OFFICE SERVICES',
  ownerPhone: '0674113290',
  ownerWhatsapp: '213674113290',
  ownerEmail: 'ayoub.office.services@gmail.com',
  // Filled by the owner from the admin panel before promoting the service.
  ccp: '',
  ccpKey: '',
  baridimob: '',
  bankName: 'Algérie Poste',
  depositPercent: 50,
  paymentNote: {
    ar: 'بعد إرسال الطلب سنتواصل معك عبر واتساب لتأكيد التفاصيل. يتم دفع 50% مقدماً و50% عند تسليم الموقع. أرسل صورة الوصل عبر واتساب أو من صفحة تتبع الطلب.',
    fr: 'Après votre demande, nous vous contacterons sur WhatsApp pour confirmer. Paiement 50% à la commande et 50% à la livraison. Envoyez le reçu via WhatsApp ou depuis le suivi.',
    en: 'After submitting, we will contact you on WhatsApp to confirm. Pay 50% upfront and 50% on delivery. Send the receipt via WhatsApp or the tracking page.',
  },
  customDomainNote: {
    ar: 'يمكنك ربط نطاقك الخاص (مثل .com أو .dz) بعد الشراء من أي مزود. الربط مجاني، والنطاق يبقى ملكك.',
    fr: 'Vous pouvez connecter votre propre domaine (.com ou .dz) acheté chez n’importe quel registrar. La connexion est gratuite et le domaine reste votre propriété.',
    en: 'You can connect your own domain (.com or .dz) bought from any registrar. Connection is free and the domain stays yours.',
  },
};

export const RESERVED_SUBDOMAINS = new Set([
  'www', 'mail', 'email', 'smtp', 'ftp', 'api', 'admin', 'app', 'dashboard',
  'support', 'help', 'status', 'dev', 'staging', 'test', 'demo', 'blog',
  'shop', 'store', 'pay', 'payment', 'cdn', 'assets', 'static', 'images',
  'login', 'signup', 'auth', 'account', 'billing', 'files', 'download',
  'cloudflare', 'pages', 'workers', 'docs', 'ns1', 'ns2', 'mx', 'root',
  'aostech', 'aos', 'ayoub', 'ayoub-office', 'contact', 'info', 'sales',
]);

export function pickLocalized(value: Localized | null | undefined, lang: Lang, fallback = ''): string {
  if (!value) return fallback;
  return value[lang] || value.ar || value.fr || value.en || fallback;
}

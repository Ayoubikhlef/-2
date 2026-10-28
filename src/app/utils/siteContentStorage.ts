const STORAGE_KEY = 'aos_site_content';

import { syncToServer, loadFromServer } from './serverSync';
import { brand } from '../config/brand';
const SERVER_KEY = 'aos_site_content';

export interface LangString {
  ar: string;
  fr: string;
  en: string;
}

export interface WhyUsFeature {
  id: string;
  title: LangString;
  description: LangString;
  color: string;
}

export interface FAQItem {
  id: string;
  question: LangString;
  answer: LangString;
}

export interface ServiceCard {
  id: string;
  title: LangString;
  description: LangString;
  image: string;
  color: string;
}

export interface DigitizationItem {
  title: LangString;
  description: LangString;
  color: string;
}

export interface SiteContent {
  hero: {
    title: LangString;
    brandName: LangString;
    subtitle: LangString;
    bgImage: string;
  };
  whyUs: {
    title: LangString;
    subtitle: LangString;
    features: WhyUsFeature[];
  };
  faq: {
    title: LangString;
    subtitle: LangString;
    items: FAQItem[];
  };
  about: {
    title: LangString;
    content: LangString;
  };
  services: {
    title: LangString;
    subtitle: LangString;
    cards: ServiceCard[];
    digitizationItems: DigitizationItem[];
  };
  footer: {
    description: LangString;
  };
}

const defaultContent: SiteContent = {
  hero: {
    title: {
      ar: 'مرحباً بكم في',
      fr: 'Bienvenue chez',
      en: 'Welcome to',
    },
    brandName: {
      ar: brand.name,
      fr: brand.name,
      en: brand.name,
    },
    subtitle: {
      ar: 'نقدم لكم مجموعة واسعة من الخدمات ومستلزمات الإعلام الآلي',
      fr: 'Nous offrons une large gamme de services et fournitures informatiques',
      en: 'We offer a wide range of services and IT supplies',
    },
    bgImage: '/hero-bg.png',
  },
  whyUs: {
    title: {
      ar: `لماذا تختار ${brand.name}؟`,
      fr: `Pourquoi choisir ${brand.name} ?`,
      en: `Why Choose ${brand.name}?`,
    },
    subtitle: {
      ar: 'نحن نقدم أكثر من مجرد خدمات - نقدم تجربة متميزة تجعل عملك أسهل وأسرع',
      fr: 'Nous offrons plus que des services - une expérience exceptionnelle qui facilite et accélère votre travail',
      en: 'We offer more than just services - an exceptional experience that makes your work easier and faster',
    },
    features: [
      {
        id: 'quality',
        title: { ar: 'جودة عالية', fr: 'Haute Qualité', en: 'High Quality' },
        description: { ar: 'نضمن أعلى مستويات الجودة في جميع خدماتنا', fr: 'Nous garantissons les plus hauts niveaux de qualité', en: 'We guarantee the highest quality standards' },
        color: 'from-blue-500 to-blue-600',
      },
      {
        id: 'speed',
        title: { ar: 'سرعة في الإنجاز', fr: 'Rapidité d\'exécution', en: 'Fast Delivery' },
        description: { ar: 'نحترم وقتك ونقدم خدمات سريعة وفعالة', fr: 'Nous respectons votre temps avec des services rapides', en: 'We respect your time with fast and efficient services' },
        color: 'from-green-500 to-green-600',
      },
      {
        id: 'team',
        title: { ar: 'فريق محترف', fr: 'Équipe professionnelle', en: 'Professional Team' },
        description: { ar: 'فريق ذو خبرة واسعة في المجال', fr: 'Une équipe expérimentée dans le domaine', en: 'An experienced team in the field' },
        color: 'from-purple-500 to-purple-600',
      },
      {
        id: 'service',
        title: { ar: 'خدمة عملاء ممتازة', fr: 'Excellent service client', en: 'Excellent Customer Service' },
        description: { ar: 'نهتم بكل عميل ونسعى لتحقيق رضاه التام', fr: 'Nous nous soucions de chaque client', en: 'We care about every customer' },
        color: 'from-orange-500 to-orange-600',
      },
    ],
  },
  faq: {
    title: { ar: 'أسئلة شائعة', fr: 'Questions fréquentes', en: 'Frequently Asked Questions' },
    subtitle: { ar: 'إليك أهم الأسئلة التي نتلقاها عادةً مع إجابات سريعة وواضحة.', fr: 'Voici les questions les plus fréquentes avec des réponses claires et rapides.', en: 'Here are the most frequent questions with clear and quick answers.' },
    items: [
      {
        id: 'order-process',
        question: { ar: 'كيف أطلب منتجاً من الموقع؟', fr: 'Comment commander un produit sur le site ?', en: 'How do I order a product from the site?' },
        answer: { ar: 'اختر المنتج الذي تريد، ثم اضغط زر "اطلب الآن" وأكمل نموذج الطلب. سيصلك تأكيد عبر الهاتف قريباً.', fr: 'Choisissez votre produit, cliquez sur "Commander" et remplissez le formulaire. Vous recevrez une confirmation par téléphone bientôt.', en: 'Select your product, click "Order" and complete the form. You will receive a confirmation by phone shortly.' },
      },
      {
        id: 'payment-options',
        question: { ar: 'ما هي طرق الدفع المتاحة؟', fr: 'Quels sont les modes de paiement disponibles ?', en: 'What payment methods are available?' },
        answer: { ar: 'يمكنك الدفع نقداً عند التسليم أو عبر حوالة بنكية حسب الاتفاق مع فريقنا بعد تأكيد الطلب.', fr: 'Vous pouvez payer en espèces à la livraison ou par virement bancaire selon l\'accord avec notre équipe.', en: 'You can pay cash on delivery or by bank transfer according to the agreement with our team.' },
      },
      {
        id: 'delivery-time',
        question: { ar: 'كم يستغرق الشحن؟', fr: 'Quel est le délai de livraison ?', en: 'How long does delivery take?' },
        answer: { ar: 'الوقت يعتمد على الموقع، لكن عادةً في الجزائر يكون التوصيل خلال 1-3 أيام عمل بعد تأكيد الطلب.', fr: 'Le délai dépend de l\'emplacement, mais généralement en Algérie la livraison se fait sous 1 à 3 jours ouvrables.', en: 'Delivery time depends on location, but usually in Algeria it takes 1-3 business days after order confirmation.' },
      },
      {
        id: 'warranty-support',
        question: { ar: 'هل هناك ضمان أو دعم ما بعد البيع؟', fr: 'Y a-t-il une garantie ou un support après-vente ?', en: 'Is there a warranty or after-sales support?' },
        answer: { ar: 'نعم، نقدم ضمان لبعض المنتجات ودعم فني للمساعدة في أي استفسار بعد الشراء. تواصل معنا وسنرشدك.', fr: 'Oui, nous offrons une garantie sur certains produits et un support après-vente pour toute question après l\'achat.', en: 'Yes, we provide a warranty on some products and after-sales support for any questions after purchase.' },
      },
    ],
  },
  about: {
    title: {
      ar: 'عن المتجر',
      fr: 'À propos',
      en: 'About Us',
    },
    content: {
      ar: brand.about.ar,
      fr: brand.about.fr,
      en: brand.about.en,
    },
  },
  services: {
    title: { ar: 'خدماتنا', fr: 'Nos Services', en: 'Our Services' },
    subtitle: {
      ar: 'مجموعة كاملة من الخدمات المكتبية لتبسيط عملك اليومي و خدمات الرقمنة المتقدمة حلول رقمية احترافية لمستنداتك',
      fr: 'Une gamme complète de services pour simplifier votre quotidien et des solutions numériques professionnelles pour vos documents',
      en: 'A complete range of office services to simplify your daily work and professional digital solutions for your documents',
    },
    cards: [
      {
        id: 'office',
        title: { ar: 'خدمات المكتب', fr: 'Services de bureautique', en: 'Office Services' },
        description: { ar: 'طباعة، مسح ضوئي، نسخ وتغليف المستندات', fr: 'Impression, numérisation, photocopie et plastification', en: 'Printing, scanning, photocopying and lamination' },
        image: '/products/31.jpg',
        color: 'from-blue-500 to-blue-600',
      },
      {
        id: 'documents',
        title: { ar: 'إعداد الوثائق', fr: 'Préparation de documents', en: 'Document Preparation' },
        description: { ar: 'مساعدة في كتابة المذكرات، الأطروحات، الأبحاث والسيرة الذاتية', fr: 'Mémoires, thèses, recherches et CV professionnels', en: 'Dissertations, theses, research and professional CVs' },
        image: '/products/33.jpg',
        color: 'from-green-500 to-green-600',
      },
      {
        id: 'visa',
        title: { ar: 'مواعيد التأشيرة', fr: 'Rendez-vous Visa', en: 'Visa Appointments' },
        description: { ar: 'مساعدة في حجز المواعيد للإجراءات القنصلية', fr: 'Réservation de créneaux pour démarches consulaires', en: 'Booking slots for consular procedures' },
        image: '/products/32.jpg',
        color: 'from-purple-500 to-purple-600',
      },
      {
        id: 'it-supplies',
        title: { ar: 'مستلزمات الإعلام الآلي', fr: 'Fournitures informatiques', en: 'IT Supplies' },
        description: { ar: 'معدات كمبيوتر، قطع غيار، وإكسسوارات للأفراد والشركات في الجزائر', fr: 'Équipements PC, pièces et accessoires pour particuliers et entreprises en Algérie', en: 'Computer equipment, spare parts, and accessories for individuals and businesses across Algeria' },
        image: '/products/05.jpg',
        color: 'from-cyan-500 to-blue-600',
      },
    ],
    digitizationItems: [
      { title: { ar: 'تنسيقات متعددة', fr: 'Formats multiples', en: 'Multiple Formats' }, description: { ar: 'PDF، Word، Excel وجميع التنسيقات الشائعة', fr: 'PDF, Word, Excel et tous les formats courants', en: 'PDF, Word, Excel and all common formats' }, color: 'from-emerald-500 to-emerald-600' },
      { title: { ar: 'خدمة سريعة', fr: 'Service rapide', en: 'Fast Service' }, description: { ar: 'إنجاز سريع دون المساس بالجودة', fr: 'Réalisation rapide sans compromettre la qualité', en: 'Fast delivery without compromising quality' }, color: 'from-purple-500 to-purple-600' },
      { title: { ar: 'سرية تامة', fr: 'Confidentialité totale', en: 'Complete Confidentiality' }, description: { ar: 'نحافظ على خصوصية وأمان مستنداتك', fr: 'Nous protégeons la confidentialité de vos documents', en: 'We protect your documents\' privacy' }, color: 'from-orange-500 to-orange-600' },
    ],
  },
  footer: {
    description: {
      ar: 'نبسّط حياتك المهنية بخدمات مكتبية احترافية',
      fr: 'Simplifions votre vie professionnelle avec des services de bureau professionnels à El Milia',
      en: 'Simplifying your professional life with professional office services in El Milia',
    },
  },
};

const LEGACY_NAMES = ['Ayoub Office Services', 'أيوب أوفيس سيرفيسز', 'AYOUB OFFICE SERVICES'];

/**
 * يستبدل اسم العلامة القديم في أي محتوى محفوظ (محلي أو على السيرفر).
 * ضروري عند نسخ المشروع لعميل جديد، حتى لا يظهر اسم المتجر السابق.
 */
function scrubLegacyBrand<T>(value: T): T {
  if (!brand.lockIdentity) return value;
  let json = JSON.stringify(value);
  for (const legacy of LEGACY_NAMES) json = json.split(legacy).join(brand.name);
  return JSON.parse(json) as T;
}

function getAll(): SiteContent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveAll(defaultContent);
      return defaultContent;
    }
    const parsed = JSON.parse(raw) as Partial<SiteContent>;
    const merged: SiteContent = {
      hero: { ...defaultContent.hero, ...parsed.hero },
      whyUs: { ...defaultContent.whyUs, ...parsed.whyUs, features: parsed.whyUs?.features ?? defaultContent.whyUs.features },
      faq: { ...defaultContent.faq, ...parsed.faq, items: parsed.faq?.items ?? defaultContent.faq.items },
      about: { ...defaultContent.about, ...parsed.about },
      services: { ...defaultContent.services, ...parsed.services, cards: parsed.services?.cards ?? defaultContent.services.cards, digitizationItems: parsed.services?.digitizationItems ?? defaultContent.services.digitizationItems },
      footer: { ...defaultContent.footer, ...parsed.footer },
    };
    return scrubLegacyBrand(applyIdentityOverrides(merged));
  } catch {
    return defaultContent;
  }
}

/** يفرض اسم العلامة ونص «من نحن» عند تفعيل lockIdentity. */
function applyIdentityOverrides(content: SiteContent): SiteContent {
  if (!brand.lockIdentity) return content;
  return {
    ...content,
    hero: {
      ...content.hero,
      brandName: { ar: brand.name, fr: brand.name, en: brand.name },
    },
    whyUs: {
      ...content.whyUs,
      title: {
        ar: `لماذا تختار ${brand.name}؟`,
        fr: `Pourquoi choisir ${brand.name} ?`,
        en: `Why Choose ${brand.name}?`,
      },
    },
    about: {
      ...content.about,
      content: { ar: brand.about.ar, fr: brand.about.fr, en: brand.about.en },
    },
  };
}

function saveAll(content: SiteContent): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
}

function dispatchAndSync() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  const content = getAll();
  syncToServer(SERVER_KEY, content);
}

export function getSiteContent(): SiteContent {
  return getAll();
}

export function updateSiteContent(update: Partial<SiteContent>): SiteContent {
  const current = getAll();
  const next = { ...current };
  if (update.hero) next.hero = { ...current.hero, ...update.hero };
  if (update.whyUs) next.whyUs = { ...current.whyUs, ...update.whyUs, features: update.whyUs.features ?? current.whyUs.features };
  if (update.faq) next.faq = { ...current.faq, ...update.faq, items: update.faq.items ?? current.faq.items };
  if (update.about) next.about = { ...current.about, ...update.about };
  if (update.services) next.services = { ...current.services, ...update.services, cards: update.services.cards ?? current.services.cards, digitizationItems: update.services.digitizationItems ?? current.services.digitizationItems };
  if (update.footer) next.footer = { ...current.footer, ...update.footer };
  saveAll(next);
  dispatchAndSync();
  return next;
}

// FAQ CRUD
export function addFAQItem(item: FAQItem): SiteContent {
  const c = getAll(); c.faq.items.push(item); saveAll(c); dispatchAndSync(); return c;
}
export function updateFAQItem(id: string, upd: Partial<FAQItem>): SiteContent {
  const c = getAll(); const i = c.faq.items.findIndex(x => x.id === id); if (i >= 0) { c.faq.items[i] = { ...c.faq.items[i], ...upd }; saveAll(c); dispatchAndSync(); } return c;
}
export function deleteFAQItem(id: string): SiteContent {
  const c = getAll(); c.faq.items = c.faq.items.filter(x => x.id !== id); saveAll(c); dispatchAndSync(); return c;
}

// WhyUs CRUD
export function addWhyUsFeature(f: WhyUsFeature): SiteContent {
  const c = getAll(); c.whyUs.features.push(f); saveAll(c); dispatchAndSync(); return c;
}
export function updateWhyUsFeature(id: string, upd: Partial<WhyUsFeature>): SiteContent {
  const c = getAll(); const i = c.whyUs.features.findIndex(x => x.id === id); if (i >= 0) { c.whyUs.features[i] = { ...c.whyUs.features[i], ...upd }; saveAll(c); dispatchAndSync(); } return c;
}
export function deleteWhyUsFeature(id: string): SiteContent {
  const c = getAll(); c.whyUs.features = c.whyUs.features.filter(x => x.id !== id); saveAll(c); dispatchAndSync(); return c;
}

// Service Cards CRUD
export function addServiceCard(card: ServiceCard): SiteContent {
  const c = getAll(); c.services.cards.push(card); saveAll(c); dispatchAndSync(); return c;
}
export function updateServiceCard(id: string, upd: Partial<ServiceCard>): SiteContent {
  const c = getAll(); const i = c.services.cards.findIndex(x => x.id === id); if (i >= 0) { c.services.cards[i] = { ...c.services.cards[i], ...upd }; saveAll(c); dispatchAndSync(); } return c;
}
export function deleteServiceCard(id: string): SiteContent {
  const c = getAll(); c.services.cards = c.services.cards.filter(x => x.id !== id); saveAll(c); dispatchAndSync(); return c;
}

export async function loadSiteContentFromServer(): Promise<boolean> {
  try {
    const data = await loadFromServer<SiteContent>(SERVER_KEY);
    if (data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    }
  } catch {}
  return false;
}

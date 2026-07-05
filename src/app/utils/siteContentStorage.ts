const STORAGE_KEY = 'aos_site_content';

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
      ar: 'أيوب أوفيس سيرفيسز',
      fr: 'Ayoub Office Services',
      en: 'Ayoub Office Services',
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
      ar: 'لماذا تختار Ayoub Office Services؟',
      fr: 'Pourquoi choisir Ayoub Office Services ?',
      en: 'Why Choose Ayoub Office Services?',
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
      ar: 'أيوب أوفيس سيرفيسز هو متجر خدمات مكتبية ومستلزمات الإعلام الآلي في بلدية الميلية، ولاية جيجل. نقدم مجموعة متكاملة من الخدمات المكتبية ومنتجات التكنولوجيا لتلبية احتياجات الأفراد والشركات.',
      fr: 'Ayoub Office Services est un magasin de services de bureau et de fournitures informatiques à El Milia, wilaya de Jijel. Nous offrons une gamme complète de services de bureau et de produits technologiques.',
      en: 'Ayoub Office Services is an office services and IT supplies store in El Milia, Jijel. We offer a complete range of office services and technology products.',
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
        image: 'https://images.unsplash.com/photo-1650094980833-7373de26feb6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxwcmludGVyJTIwbW9kZXJuJTIwb2ZmaWNlJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NzY4NzA1NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        color: 'from-blue-500 to-blue-600',
      },
      {
        id: 'documents',
        title: { ar: 'إعداد الوثائق', fr: 'Préparation de documents', en: 'Document Preparation' },
        description: { ar: 'مساعدة في كتابة المذكرات، الأطروحات، الأبحاث والسيرة الذاتية', fr: 'Mémoires, thèses, recherches et CV professionnels', en: 'Dissertations, theses, research and professional CVs' },
        image: 'https://images.unsplash.com/photo-1773525911805-bebab1d3e0e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw0fHxwcmludGVyJTIwbW9kZXJuJTIwb2ZmaWNlJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NzY4NzA1NDd8MA&ixlib=rb-4.1.0&q=80&w=1080',
        color: 'from-green-500 to-green-600',
      },
      {
        id: 'visa',
        title: { ar: 'مواعيد التأشيرة', fr: 'Rendez-vous Visa', en: 'Visa Appointments' },
        description: { ar: 'مساعدة في حجز المواعيد للإجراءات القنصلية', fr: 'Réservation de créneaux pour démarches consulaires', en: 'Booking slots for consular procedures' },
        image: 'https://images.unsplash.com/photo-1758887248912-03a0c34a2f41?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbCUyMHNlcnZpY2VzfGVufDF8fHx8MTc3Njg3MDU1NHww&ixlib=rb-4.1.0&q=80&w=1080',
        color: 'from-purple-500 to-purple-600',
      },
      {
        id: 'it-supplies',
        title: { ar: 'مستلزمات الإعلام الآلي', fr: 'Fournitures informatiques', en: 'IT Supplies' },
        description: { ar: 'معدات كمبيوتر، قطع غيار، وإكسسوارات للأفراد والشركات في الجزائر', fr: 'Équipements PC, pièces et accessoires pour particuliers et entreprises en Algérie', en: 'Computer equipment, spare parts, and accessories for individuals and businesses across Algeria' },
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxjb21wdXRlciUyMHdvcmstc3RhdGlvbnxlbnwwfHx8fDE3NzY4NzA1MjN8MA&ixlib=rb-4.1.0&q=80&w=1080',
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
    return merged;
  } catch {
    return defaultContent;
  }
}

function saveAll(content: SiteContent): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
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
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  return next;
}

// FAQ CRUD
export function addFAQItem(item: FAQItem): SiteContent {
  const c = getAll(); c.faq.items.push(item); saveAll(c); window.dispatchEvent(new CustomEvent('aos:data-changed')); return c;
}
export function updateFAQItem(id: string, upd: Partial<FAQItem>): SiteContent {
  const c = getAll(); const i = c.faq.items.findIndex(x => x.id === id); if (i >= 0) { c.faq.items[i] = { ...c.faq.items[i], ...upd }; saveAll(c); window.dispatchEvent(new CustomEvent('aos:data-changed')); } return c;
}
export function deleteFAQItem(id: string): SiteContent {
  const c = getAll(); c.faq.items = c.faq.items.filter(x => x.id !== id); saveAll(c); window.dispatchEvent(new CustomEvent('aos:data-changed')); return c;
}

// WhyUs CRUD
export function addWhyUsFeature(f: WhyUsFeature): SiteContent {
  const c = getAll(); c.whyUs.features.push(f); saveAll(c); window.dispatchEvent(new CustomEvent('aos:data-changed')); return c;
}
export function updateWhyUsFeature(id: string, upd: Partial<WhyUsFeature>): SiteContent {
  const c = getAll(); const i = c.whyUs.features.findIndex(x => x.id === id); if (i >= 0) { c.whyUs.features[i] = { ...c.whyUs.features[i], ...upd }; saveAll(c); window.dispatchEvent(new CustomEvent('aos:data-changed')); } return c;
}
export function deleteWhyUsFeature(id: string): SiteContent {
  const c = getAll(); c.whyUs.features = c.whyUs.features.filter(x => x.id !== id); saveAll(c); window.dispatchEvent(new CustomEvent('aos:data-changed')); return c;
}

// Service Cards CRUD
export function addServiceCard(card: ServiceCard): SiteContent {
  const c = getAll(); c.services.cards.push(card); saveAll(c); window.dispatchEvent(new CustomEvent('aos:data-changed')); return c;
}
export function updateServiceCard(id: string, upd: Partial<ServiceCard>): SiteContent {
  const c = getAll(); const i = c.services.cards.findIndex(x => x.id === id); if (i >= 0) { c.services.cards[i] = { ...c.services.cards[i], ...upd }; saveAll(c); window.dispatchEvent(new CustomEvent('aos:data-changed')); } return c;
}
export function deleteServiceCard(id: string): SiteContent {
  const c = getAll(); c.services.cards = c.services.cards.filter(x => x.id !== id); saveAll(c); window.dispatchEvent(new CustomEvent('aos:data-changed')); return c;
}

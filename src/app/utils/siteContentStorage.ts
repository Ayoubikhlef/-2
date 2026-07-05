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

export interface ServiceItem {
  id: string;
  title: LangString;
  description: LangString;
  image: string;
  color: string;
}

export interface SiteContent {
  hero: {
    subtitle: LangString;
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
    content: LangString;
  };
  services: {
    title: LangString;
    subtitle: LangString;
  };
  footer: {
    description: LangString;
  };
}

const defaultContent: SiteContent = {
  hero: {
    subtitle: {
      ar: 'نقدم لكم مجموعة واسعة من الخدمات ومستلزمات الإعلام الآلي',
      fr: 'Nous offrons une large gamme de services et fournitures informatiques',
      en: 'We offer a wide range of services and IT supplies',
    },
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
    const parsed = JSON.parse(raw);
    const merged = { ...defaultContent, ...parsed };
    if (parsed?.whyUs?.features) merged.whyUs.features = parsed.whyUs.features;
    if (parsed?.faq?.items) merged.faq.items = parsed.faq.items;
    if (parsed?.hero) merged.hero = { ...merged.hero, ...parsed.hero };
    if (parsed?.whyUs) merged.whyUs = { ...merged.whyUs, ...parsed.whyUs, features: merged.whyUs.features };
    if (parsed?.faq) merged.faq = { ...merged.faq, ...parsed.faq, items: merged.faq.items };
    if (parsed?.about) merged.about = { ...merged.about, ...parsed.about };
    if (parsed?.services) merged.services = { ...merged.services, ...parsed.services };
    if (parsed?.footer) merged.footer = { ...merged.footer, ...parsed.footer };
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
  const next = { ...current, ...update };
  if (update.whyUs) next.whyUs = { ...current.whyUs, ...update.whyUs };
  if (update.faq) next.faq = { ...current.faq, ...update.faq };
  if (update.hero) next.hero = { ...current.hero, ...update.hero };
  if (update.about) next.about = { ...current.about, ...update.about };
  if (update.services) next.services = { ...current.services, ...update.services };
  if (update.footer) next.footer = { ...current.footer, ...update.footer };
  saveAll(next);
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  return next;
}

export function addFAQItem(item: FAQItem): SiteContent {
  const current = getAll();
  current.faq.items.push(item);
  saveAll(current);
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  return current;
}

export function updateFAQItem(id: string, update: Partial<FAQItem>): SiteContent {
  const current = getAll();
  const idx = current.faq.items.findIndex(i => i.id === id);
  if (idx >= 0) {
    current.faq.items[idx] = { ...current.faq.items[idx], ...update };
    saveAll(current);
    window.dispatchEvent(new CustomEvent('aos:data-changed'));
  }
  return current;
}

export function deleteFAQItem(id: string): SiteContent {
  const current = getAll();
  current.faq.items = current.faq.items.filter(i => i.id !== id);
  saveAll(current);
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  return current;
}

export function addWhyUsFeature(feature: WhyUsFeature): SiteContent {
  const current = getAll();
  current.whyUs.features.push(feature);
  saveAll(current);
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  return current;
}

export function updateWhyUsFeature(id: string, update: Partial<WhyUsFeature>): SiteContent {
  const current = getAll();
  const idx = current.whyUs.features.findIndex(f => f.id === id);
  if (idx >= 0) {
    current.whyUs.features[idx] = { ...current.whyUs.features[idx], ...update };
    saveAll(current);
    window.dispatchEvent(new CustomEvent('aos:data-changed'));
  }
  return current;
}

export function deleteWhyUsFeature(id: string): SiteContent {
  const current = getAll();
  current.whyUs.features = current.whyUs.features.filter(f => f.id !== id);
  saveAll(current);
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  return current;
}

import { prisma } from '../utils/prisma';
import { extractKeywords, getLanguage } from './nlp';

export interface ProductResult {
  id: string;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  descAr: string;
  descFr: string;
  descEn: string;
  price: number;
  salePrice: number | null;
  saleEnd: Date | null;
  sku: string;
  stock: number;
  brand: string | null;
  warranty: string | null;
  image: string | null;
}

export interface ChatResponse {
  reply: string;
  matchedProducts: ProductResult[];
  type: 'products' | 'greeting' | 'info' | 'unknown';
}

const greetings: Record<string, string[]> = {
  ar: ['مرحبا', 'اهلا', 'السلام عليكم', 'صباح الخير', 'مساء الخير', 'أهلاً'],
  fr: ['bonjour', 'salut', 'bonsoir', 'coucou', 'hello', 'bonsoir'],
  en: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon'],
};

const greetingReplies: Record<string, string> = {
  ar: 'مرحباً بك في متجر أيوب للتكنولوجيا! 🌟 كيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن المنتجات، أو الاستفسار عن الشحن والدفع.',
  fr: 'Bonjour et bienvenue chez Ayoub Tech Store ! 🌟 Comment puis-je vous aider aujourd\'hui ? Vous pouvez me poser des questions sur nos produits, la livraison ou le paiement.',
  en: 'Hello and welcome to Ayoub Tech Store! 🌟 How can I help you today? You can ask about our products, shipping, or payment.',
};

const infoResponses: Record<string, Record<string, string>> = {
  ar: {
    payment: 'نقبل الدفع عند الاستلام (Cash on Delivery) في جميع أنحاء الجزائر. يمكنك الدفع نقداً عند استلام طلبك مباشرة.',
    shipping: 'نقوم بالتوصيل إلى جميع ولايات الجزائر 🇩🇿. مدة التوصيل عادة من 2 إلى 5 أيام عمل حسب منطقتك. تكلفة التوصيل تعتمد على الولاية.',
    warranty: 'جميع منتجاتنا تأتي مع ضمان رسمي. مدة الضمان وتفاصيله موجودة في صفحة كل منتج، وتختلف حسب المنتج والعلامة التجارية.',
    hours: 'فريق الدعم متاح من السبت إلى الخميس، من 9 صباحاً إلى 6 مساءً. يمكنك التواصل معنا عبر الهاتف أو الواتساب أو من خلال صفحة اتصل بنا.',
    default: 'شكراً لتواصلك! 😊 كيف يمكنني مساعدتك؟ يمكنك البحث عن منتج بكتابة اسمه، أو الاستفسار عن الدفع، الشحن، أو الضمان.',
  },
  fr: {
    payment: 'Nous acceptons le paiement à la livraison (Cash on Delivery) dans toute l\'Algérie. Vous payez en espèces à la réception de votre commande.',
    shipping: 'Nous livrons dans toutes les wilayas d\'Algérie 🇩🇿. La livraison prend généralement 2 à 5 jours ouvrables selon votre région. Les frais de livraison varient selon la wilaya.',
    warranty: 'Tous nos produits sont couverts par une garantie officielle. Les détails de la garantie figurent sur la page de chaque produit et varient selon le produit et la marque.',
    hours: 'Notre équipe est disponible du samedi au jeudi, de 9h à 18h. Vous pouvez nous contacter par téléphone, WhatsApp ou via notre page de contact.',
    default: 'Merci pour votre message ! 😊 Comment puis-je vous aider ? Vous pouvez chercher un produit en tapant son nom, ou vous renseigner sur le paiement, la livraison ou la garantie.',
  },
  en: {
    payment: 'We accept Cash on Delivery throughout Algeria 🇩🇿. You pay in cash when you receive your order.',
    shipping: 'We deliver to all wilayas of Algeria 🇩🇿. Delivery usually takes 2 to 5 business days depending on your area. Shipping fees vary by wilaya.',
    warranty: 'All our products come with an official warranty. Warranty details are available on each product page and vary by product and brand.',
    hours: 'Our support team is available Saturday through Thursday, 9 AM to 6 PM. You can reach us by phone, WhatsApp, or through our contact page.',
    default: 'Thank you for reaching out! 😊 How can I help you? You can search for a product by typing its name, or ask about payment, shipping, or warranty.',
  },
};

function detectInfoType(message: string, lang: string): string | null {
  const lower = message.toLowerCase();
  const patterns: Record<string, Record<string, string[]>> = {
    ar: {
      payment: ['دفع', 'كاش', 'الاستلام', 'الدفع عند', 'cash', 'حساب', 'طرق الدفع', 'الدفع'],
      shipping: ['شحن', 'توصيل', 'ولاية', 'الجزائر', 'بريد', 'توصيل', 'مدة', 'تكلفة', 'الشحن'],
      warranty: ['ضمان', 'الضمان', 'استرجاع', 'تبديل', 'إرجاع'],
      hours: ['ساعة', 'مواعيد', 'وقت', 'دوام', 'متى', 'أوقات', 'الدوام'],
    },
    fr: {
      payment: ['paiement', 'cash', 'payer', 'paye', 'paiement', 'coc', 'cod', 'moyen'],
      shipping: ['livraison', 'expedition', 'transport', 'wilaya', 'algerie', 'delai', 'frais', 'livrer'],
      warranty: ['garantie', 'echange', 'retour', 'remboursement'],
      hours: ['horaire', 'heure', 'ouvert', 'disponible', 'quand', 'horaires'],
    },
    en: {
      payment: ['payment', 'cash', 'pay', 'cod', 'coc', 'method', 'online'],
      shipping: ['shipping', 'delivery', 'ship', 'wilaya', 'algeria', 'time', 'fee', 'cost', 'deliver'],
      warranty: ['warranty', 'guarantee', 'return', 'exchange', 'refund'],
      hours: ['hour', 'open', 'time', 'available', 'when', 'working', 'schedule'],
    },
  };

  const langPatterns = patterns[lang];
  if (!langPatterns) return null;

  for (const [type, keywords] of Object.entries(langPatterns)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return type;
    }
  }
  return null;
}

function isGreeting(message: string, lang: string): boolean {
  const lower = message.toLowerCase().trim();
  const langGreetings = greetings[lang] || [];
  return langGreetings.some(g => lower.includes(g));
}

function getFieldName(lang: string, prefix: string): string {
  const suffix = lang.charAt(0).toUpperCase() + lang.slice(1);
  return `${prefix}${suffix}`;
}

export async function processMessage(
  message: string,
  language?: 'ar' | 'fr' | 'en'
): Promise<ChatResponse> {
  const lang = language || getLanguage(message);
  const lower = message.toLowerCase().trim();

  if (isGreeting(lower, lang)) {
    return { reply: greetingReplies[lang], matchedProducts: [], type: 'greeting' };
  }

  const infoType = detectInfoType(message, lang);
  if (infoType) {
    return { reply: infoResponses[lang][infoType], matchedProducts: [], type: 'info' };
  }

  const keywords = extractKeywords(message, lang);

  if (keywords.length === 0) {
    return { reply: infoResponses[lang].default, matchedProducts: [], type: 'unknown' };
  }

  const nameField = getFieldName(lang, 'name');
  const descField = getFieldName(lang, 'desc');

  const where = {
    hidden: false,
    OR: keywords.flatMap(kw => [
      { [nameField]: { contains: kw } },
      { [descField]: { contains: kw } },
      { brand: { contains: kw } },
    ]),
  };

  const products = await prisma.product.findMany({
    where: where as any,
    include: {
      images: {
        where: { isPrimary: true },
        take: 1,
      },
    },
    take: 20,
  });

  const scored = products.map(p => {
    const searchText = `${(p as any)[nameField]} ${(p as any)[descField]} ${p.brand || ''}`.toLowerCase();
    const score = keywords.filter(kw => searchText.includes(kw)).length;
    return { ...p, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const matchedProducts: ProductResult[] = scored.slice(0, 5).map(p => ({
    id: p.id,
    nameAr: p.nameAr,
    nameFr: p.nameFr,
    nameEn: p.nameEn,
    descAr: p.descAr,
    descFr: p.descFr,
    descEn: p.descEn,
    price: p.price,
    salePrice: p.salePrice,
    saleEnd: p.saleEnd,
    sku: p.sku,
    stock: p.stock,
    brand: p.brand,
    warranty: p.warranty,
    image: p.images[0]?.url || null,
  }));

  if (matchedProducts.length === 0) {
    const notFoundReplies: Record<string, string> = {
      ar: `عذراً، لم أجد منتجات تطابق "${message}". جرب كلمات بحث مختلفة مثل "لابتوب"، "هاتف"، "سماعات"، أو تصفح الأقسام المتوفرة.`,
      fr: `Désolé, je n'ai trouvé aucun produit correspondant à "${message}". Essayez d'autres mots-clés comme "ordinateur", "téléphone", "casque", ou parcourez nos catégories.`,
      en: `Sorry, I didn't find any products matching "${message}". Try different keywords like "laptop", "phone", "headphones", or browse our available categories.`,
    };
    return { reply: notFoundReplies[lang], matchedProducts: [], type: 'unknown' };
  }

  const count = matchedProducts.length;
  const nameFieldShort = getFieldName(lang, 'name') as 'nameAr' | 'nameFr' | 'nameEn';
  const nameList = matchedProducts
    .map((p, i) => `${i + 1}. ${p[nameFieldShort]}`)
    .join('\n');

  const foundReplies: Record<string, string> = {
    ar: `وجدت ${count} منتج${count > 1 ? 'ات' : ''} تطابق بحثك:\n${nameList}\n\nهل تريد معلومات أكثر عن أي منتج؟`,
    fr: `J'ai trouvé ${count} produit${count > 1 ? 's' : ''} correspondant${count > 1 ? 's' : ''} à votre recherche :\n${nameList}\n\nSouhaitez-vous plus d'informations sur un produit ?`,
    en: `I found ${count} product${count > 1 ? 's' : ''} matching your search:\n${nameList}\n\nWould you like more info on any product?`,
  };

  return { reply: foundReplies[lang], matchedProducts, type: 'products' };
}

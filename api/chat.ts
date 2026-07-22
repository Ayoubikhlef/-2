import { Pool } from 'pg';
import { z } from 'zod';

let pool: Pool | null = null;
function getPool() {
  if (!pool) pool = new Pool({ connectionString: process.env.POSTGRES_URL, max: 3 });
  return pool;
}

async function query(text: string, params?: any[]) {
  const c = await getPool().connect();
  try { return await c.query(text, params); } finally { c.release(); }
}

const chatSchema = z.object({
  message: z.string().min(1),
  language: z.enum(['ar', 'fr', 'en']).optional(),
});

// --- NLP & AI Helper Logic ---
const stopWords: Record<string, string[]> = {
  ar: [
    'في', 'من', 'إلى', 'على', 'عن', 'مع', 'كان', 'هذا', 'هذه', 'ذلك', 'تلك',
    'هل', 'ما', 'لم', 'لن', 'إن', 'أن', 'قد', 'لا', 'كل', 'بعض', 'هو', 'هي',
    'هم', 'هن', 'كانت', 'يكون', 'يكونون', 'ليس', 'لكن', 'أو', 'ثم', 'بعد',
    'قبل', 'عند', 'حتى', 'حول', 'بين', 'خلال', 'دون', 'فوق', 'تحت', 'أمام',
    'خلف', 'فقط', 'هناك', 'هنا', 'اذا', 'إذا', 'لقد', 'و', 'ال', 'ب', 'ك',
    'ف', 'س', 'وقد', 'ولا', 'فقد', 'حيث', 'أي', 'اي', 'نعم', 'لا',
    'ولم', 'ولن', 'وما', 'ومن', 'وفي', 'وعن', 'وعلى', 'إذ', 'اذ', 'بينما',
    'حسب', 'نحو', 'بسبب', 'رغم', 'لأن', 'لكيلا', 'كي', 'متى', 'أين', 'كيف',
    'كم', 'أيها', 'أيتها', 'اللذان', 'اللتان', 'الذين', 'اللواتي',
  ],
  fr: [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'ce', 'cet',
    'cette', 'ces', 'mon', 'ton', 'son', 'ma', 'ta', 'sa', 'mes', 'tes', 'ses',
    'notre', 'votre', 'leur', 'nos', 'vos', 'leurs', 'je', 'tu', 'il', 'elle',
    'nous', 'vous', 'ils', 'elles', 'me', 'te', 'se', 'lui', 'leur', 'eux',
    'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi', 'dont',
    'où', 'est', 'sont', 'suis', 'es', 'etes', 'sommes', 'ai', 'as',
    'a', 'avons', 'avez', 'ont', 'ete', 'etre', 'avoir', 'faire', 'fait',
    'pas', 'plus', 'tres', 'trop', 'peu', 'assez', 'si', 'ainsi', 'aussi',
    'non', 'oui', 'avec', 'sans', 'chez', 'dans', 'sur', 'sous', 'pour',
    'par', 'a', 'au', 'aux', 'en', 'vers', 'pendant', 'depuis', 'apres',
    'avant', 'entre', 'parmi', 'sauf', 'selon', 'comme', 'quand', 'puis',
    'alors', 'enfin', 'voici', 'voila', 'quel', 'quelle', 'quels', 'quelles',
    'tout', 'tous', 'toute', 'toutes', 'chaque', 'plusieurs', 'certains',
    'certaines', 'autre', 'autres', 'meme', 'tres', 'vraiment',
  ],
  en: [
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'shall', 'can', 'need', 'dare', 'ought', 'i', 'you', 'he', 'she',
    'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
    'his', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'its',
    'ours', 'theirs', 'this', 'that', 'these', 'those', 'what', 'which',
    'who', 'whom', 'whose', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'because', 'as', 'until', 'while', 'if', 'else', 'then', 'here', 'there',
    'one', 'two', 'also', 'well', 'much', 'many', 'any', 'really', 'quite',
  ],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z\u0600-\u06FF\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractKeywords(text: string, language: string): string[] {
  const normalized = normalize(text);
  const words = normalized.split(/\s+/).filter(w => w.length > 1);
  const stopList = stopWords[language] || stopWords.en;
  return [...new Set(words.filter(w => !stopList.includes(w)))];
}

function getLanguage(text: string): 'ar' | 'fr' | 'en' {
  const trimmed = text.trim();
  if (!trimmed) return 'en';
  if (/[\u0600-\u06FF]/.test(trimmed)) return 'ar';
  const lower = trimmed.toLowerCase();
  const frenchSignals = [
    'bonjour', 'salut', 'merci', 'svp', 's\'il vous', 'livraison',
    'paiement', 'garantie', 'bonsoir', 'coucou', 'prix',
  ];
  for (const w of frenchSignals) {
    if (lower.includes(w)) return 'fr';
  }
  return 'en';
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
    hours: 'فريق الدعم متاح من السبت إلى الخميس، من 8 صباحاً إلى 7 مساءً. يمكنك التواصل معنا عبر الهاتف أو الواتساب أو من خلال صفحة اتصل بنا.',
    default: 'شكراً لتواصلك! 😊 كيف يمكنني مساعدتك؟ يمكنك البحث عن منتج بكتابة اسمه، أو الاستفسار عن الدفع، الشحن، أو الضمان.',
  },
  fr: {
    payment: 'Nous acceptons le paiement à la livraison (Cash on Delivery) dans toute l\'Algérie. Vous payez en espèces à la réception de votre commande.',
    shipping: 'Nous livrons dans toutes les wilayas d\'Algérie 🇩🇿. La livraison prend généralement 2 à 5 jours ouvrables selon votre région. Les frais de livraison varient selon la wilaya.',
    warranty: 'Tous nos produits sont couverts par une garantie officielle. Les détails de la garantie figurent sur la page de chaque produit et varient selon le produit et la marque.',
    hours: 'Notre équipe est disponible du samedi au jeudi, de 8h à 19h. Vous pouvez nous contacter par téléphone, WhatsApp ou via notre page de contact.',
    default: 'Merci pour votre message ! 😊 Comment puis-je vous aider ? Vous pouvez chercher un produit en tapant son nom, ou vous renseigner sur le paiement, la livraison ou la garantie.',
  },
  en: {
    payment: 'We accept Cash on Delivery throughout Algeria 🇩🇿. You pay in cash when you receive your order.',
    shipping: 'We deliver to all wilayas of Algeria 🇩🇿. Delivery usually takes 2 to 5 business days depending on your area. Shipping fees vary by wilaya.',
    warranty: 'All our products come with an official warranty. Warranty details are available on each product page and vary by product and brand.',
    hours: 'Our support team is available Saturday through Thursday, 8 AM to 7 PM. You can reach us by phone, WhatsApp, or through our contact page.',
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

// --- Main Handler ---
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { message, language } = chatSchema.parse(req.body);
    const lang = language || getLanguage(message);
    const lower = message.toLowerCase().trim();

    // 1. Check Greetings
    if (isGreeting(lower, lang)) {
      return res.json({ reply: greetingReplies[lang], matchedProducts: [], type: 'greeting' });
    }

    // 2. Check Static Store Info
    const infoType = detectInfoType(message, lang);
    if (infoType) {
      return res.json({ reply: infoResponses[lang][infoType], matchedProducts: [], type: 'info' });
    }

    // 3. Extract Keywords and Search Products
    const keywords = extractKeywords(message, lang);
    if (keywords.length === 0) {
      return res.json({ reply: infoResponses[lang].default, matchedProducts: [], type: 'unknown' });
    }

    // Load products from DB
    const dbRes = await query(`SELECT value FROM aos_settings WHERE key = $1`, ['aos_products']);
    const productsList = dbRes.rows.length ? JSON.parse(dbRes.rows[0].value) : [];

    const scored = productsList
      .filter((p: any) => !p.hidden)
      .map((p: any) => {
        const nameField = `name${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
        const descField = `desc${lang.charAt(0).toUpperCase() + lang.slice(1)}`;
        const searchText = `${p[nameField] || ''} ${p[descField] || ''} ${p.brand || ''} ${p.category || ''}`.toLowerCase();
        
        const score = keywords.filter(kw => searchText.includes(kw)).length;
        return { ...p, score };
      })
      .filter((p: any) => p.score > 0);

    scored.sort((a: any, b: any) => b.score - a.score);

    const matchedProducts = scored.slice(0, 5).map((p: any) => ({
      id: p.id,
      nameAr: p.nameAr,
      nameFr: p.nameFr,
      nameEn: p.nameEn,
      descAr: p.descAr,
      descFr: p.descFr,
      descEn: p.descEn,
      price: p.price,
      salePrice: p.salePrice || null,
      saleEnd: p.saleEnd || null,
      sku: p.sku || '',
      stock: p.stock || 0,
      brand: p.brand || null,
      warranty: p.warranty || null,
      image: p.image || null,
    }));

    if (matchedProducts.length === 0) {
      const notFoundReplies: Record<string, string> = {
        ar: `عذراً، لم أجد منتجات تطابق "${message}". جرب كلمات بحث مختلفة مثل "لابتوب"، "هاتف"، "سماعات"، أو تصفح الأقسام المتوفرة.`,
        fr: `Désolé, je n'ai trouvé aucun produit correspondant à "${message}". Essayez d'autres mots-clés comme "ordinateur", "téléphone", "casque", ou parcourez nos catégories.`,
        en: `Sorry, I didn't find any products matching "${message}". Try different keywords like "laptop", "phone", "headphones", or browse our available categories.`,
      };
      return res.json({ reply: notFoundReplies[lang], matchedProducts: [], type: 'unknown' });
    }

    const count = matchedProducts.length;
    const nameFieldShort = `name${lang.charAt(0).toUpperCase() + lang.slice(1)}` as 'nameAr' | 'nameFr' | 'nameEn';
    const nameList = matchedProducts
      .map((p: any, i: number) => `${i + 1}. **${p[nameFieldShort]}** — ${p.price.toLocaleString()} د.ج`)
      .join('\n');

    const foundReplies: Record<string, string> = {
      ar: `🎯 وجدت ${count} منتج${count > 1 ? 'ات' : ''} مناسبة لطلبك:\n\n${nameList}\n\nاختر منتجاً لإضافته إلى السلة 🛒`,
      fr: `🎯 J'ai trouvé ${count} produit${count > 1 ? 's' : ''} correspondant à votre recherche :\n\n${nameList}\n\nChoisissez un produit pour l'ajouter au panier 🛒`,
      en: `🎯 I found ${count} product${count > 1 ? 's' : ''} matching your search:\n\n${nameList}\n\nChoose a product to add to cart 🛒`,
    };

    return res.json({
      reply: foundReplies[lang],
      products: matchedProducts,
      type: 'products',
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[Chat API]', err);
    res.status(500).json({ error: err.message });
  }
}

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Bot, Sparkles, ShoppingCart, Copy, Check, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { products as defaultProducts } from '../data/products';
import { getStoredProducts } from '../utils/productStorage';
import { api } from '../utils/api';

function loadProducts() {
  return getStoredProducts(defaultProducts);
}
const STORAGE_KEY = 'aos_chat_history';

const stopWords: Record<string, string[]> = {
  ar: ['في','من','إلى','على','عن','مع','هل','ما','لم','لن','إن','أن','قد','لا','كل','بعض','هو','هي','هم','لكن','أو','ثم','بعد','قبل','عند','فقط','هناك','هنا','اذا','إذا','و','ال','ب','ف','س','ولا','حيث','أي','اي','نعم','لقد','وقد','ولم','ولن','وما','ومن','وفي','متى','كيف','كم','بين'],
  fr: ['le','la','les','un','une','des','du','de','ce','cet','cette','ces','je','tu','il','elle','nous','vous','ils','elles','et','ou','mais','donc','car','ni','que','qui','quoi','où','est','sont','pas','plus','très','trop','peu','non','oui','avec','sans','dans','sur','sous','pour','par','au','aux','en','vers','tout','tous','toute','toutes','chaque','autre','autres','même','vraiment','aussi','si','puis','alors','enfin','voici','voilà'],
  en: ['the','a','an','and','or','but','in','on','at','to','for','of','with','by','from','is','are','was','were','be','been','have','has','do','does','did','will','would','could','should','i','you','he','she','it','we','they','me','him','her','us','them','my','your','his','its','our','their','this','that','these','those','what','which','who','whom','when','where','why','how','all','each','every','few','more','most','other','some','such','no','not','only','own','same','so','than','too','very','just','because','as','until','while','if','else','then','here','there','also','well','much','many','any','really','quite'],
};

function getLang(text: string): 'ar' | 'fr' | 'en' {
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  const l = text.toLowerCase();
  if (['bonjour','salut','merci','svp','livraison','paiement','garantie'].some(w => l.includes(w))) return 'fr';
  return 'en';
}

function extractKeywords(text: string, lang: string): string[] {
  const words = text.toLowerCase().replace(/[^a-z\u0600-\u06FF\s]/g, ' ').split(/\s+/).filter(w => w.length > 1);
  const sw = stopWords[lang] || stopWords.en;
  return [...new Set(words.filter(w => !sw.includes(w)))];
}

interface ProductResult {
  id: number;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  descAr: string;
  descFr: string;
  descEn: string;
  price: number;
  image: string;
  brand?: string;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
  products?: ProductResult[];
}

const infoResponses: Record<string, Record<string, string>> = {
  ar: {
    payment: 'نقبل **الدفع عند الاستلام** (Cash on Delivery) في جميع أنحاء الجزائر 🇩🇿\n\nتدفع نقداً عند استلام طلبك — لا حاجة لبطاقة بنكية.',
    shipping: 'نوصل لجميع ولايات الجزائر 🇩🇿\n\n- المدة: **2-5 أيام عمل** حسب منطقتك\n- التكلفة: حسب الوزن والمسافة',
    warranty: 'جميع منتجاتنا عليها **ضمان رسمي** ✅\n\nالتفاصيل موجودة في صفحة كل منتج. للاستفسار، تواصل معنا.',
    hours: '🕐 **مواعيد العمل:**\n\n- السبت → الخميس: 9:00 صباحاً – 6:00 مساءً\n- الجمعة: إجازة\n\nاتصل بنا عبر الهاتف أو الواتساب.',
    default: 'كيف أقدر أساعدك؟ 😊\n\nاكتب اسم منتج أو اسأل عن:\n- 💳 **الدفع**\n- 🚚 **الشحن والتوصيل**\n- 🛡️ **الضمان**\n- 🕐 **ساعات العمل**',
  },
  fr: {
    payment: 'Nous acceptons le **paiement à la livraison** (Cash on Delivery) dans toute l\'Algérie 🇩🇿\n\nPayez en espèces à la réception.',
    shipping: 'Livraison dans toutes les wilayas 🇩🇿\n\n- Délai: **2-5 jours ouvrables**\n- Frais: selon poids et distance',
    warranty: 'Tous nos produits ont une **garantie officielle** ✅\n\nContactez-nous pour plus d\'infos.',
    hours: '🕐 **Horaires:**\n\n- Samedi → Jeudi: 9h-18h\n- Vendredi: Fermé',
    default: 'Comment puis-je vous aider? 😊\n\nCherchez un produit ou demandez:\n- 💳 **Paiement**\n- 🚚 **Livraison**\n- 🛡️ **Garantie**\n- 🕐 **Horaires**',
  },
  en: {
    payment: 'We accept **Cash on Delivery** throughout Algeria 🇩🇿\n\nPay cash when you receive your order.',
    shipping: 'Delivery to all wilayas 🇩🇿\n\n- Duration: **2-5 business days**\n- Cost: based on weight and distance',
    warranty: 'All products have **official warranty** ✅\n\nDetails on each product page.',
    hours: '🕐 **Working hours:**\n\n- Saturday → Thursday: 9AM–6PM\n- Friday: Closed',
    default: 'How can I help? 😊\n\nSearch for a product or ask about:\n- 💳 **Payment**\n- 🚚 **Shipping**\n- 🛡️ **Warranty**\n- 🕐 **Hours**',
  },
};

function renderMarkdown(text: string): string {
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  html = html.replace(/```([\s\S]*?)```/g, '<pre class="chat-code-block"><code>$1</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="chat-h3">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="chat-h2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="chat-h1">$1</h1>');
  html = html.replace(/^[-*] (.+)$/gm, '<li class="chat-li">$1</li>');
  html = html.replace(/(<li.*<\/li>\n?)+/g, '<ul class="chat-ul">$&</ul>');
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="chat-li">$1</li>');
  html = html.replace(/(?:^|\n)(<li.*<\/li>\n?)+/g, '<ol class="chat-ol">$&</ol>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" class="chat-link">$1</a>');
  html = html.replace(/\n/g, '<br>');
  html = html.replace(/(<br>)+<\/li>/g, '</li>');
  html = html.replace(/<li class="chat-li"><br>/g, '<li class="chat-li">');
  return html;
}

function smartSearch(message: string, lang: 'ar' | 'fr' | 'en'): { reply: string; products: ProductResult[] } {
  const lower = message.toLowerCase().trim();
  const nameKey = `name${lang.charAt(0).toUpperCase() + lang.slice(1)}` as 'nameAr' | 'nameFr' | 'nameEn';
  const descKey = `desc${lang.charAt(0).toUpperCase() + lang.slice(1)}` as 'descAr' | 'descFr' | 'descEn';

  const greetings: Record<string, string[]> = {
    ar: ['مرحبا', 'اهلا', 'السلام', 'صباح', 'مساء', 'أهلاً'],
    fr: ['bonjour', 'salut', 'bonsoir', 'coucou', 'hello'],
    en: ['hello', 'hi', 'hey', 'good morning'],
  };
  if (greetings[lang].some(g => lower.includes(g))) {
    const replies = {
      ar: 'مرحباً بك! 😊 أنا **مساعد أيوب الذكي**.\n\nكيف أقدر أساعدك اليوم؟\n- 🔍 **ابحث عن منتج**\n- 💳 **استفسر عن الدفع**\n- 🚚 **اسأل عن الشحن**',
      fr: 'Bonjour! 😊 Je suis **l\'assistant Ayoub**.\n\nComment puis-je vous aider?\n- 🔍 **Chercher un produit**\n- 💳 **Paiement**\n- 🚚 **Livraison**',
      en: 'Hi! 😊 I\'m the **Ayoub assistant**.\n\nHow can I help you today?\n- 🔍 **Search products**\n- 💳 **Payment info**\n- 🚚 **Shipping info**',
    };
    return { reply: replies[lang], products: [] };
  }

  const infoKeywords: Record<string, string[]> = {
    payment: { ar: ['دفع', 'كاش', 'الاستلام', 'cash'], fr: ['paiement', 'cash', 'payer', 'cod'], en: ['payment', 'cash', 'pay', 'cod'] }[lang],
    shipping: { ar: ['شحن', 'توصيل', 'ولاية', 'الجزائر', 'مدة', 'تكلفة'], fr: ['livraison', 'shipping', 'wilaya', 'frais'], en: ['shipping', 'delivery', 'wilaya', 'fee', 'cost'] }[lang],
    warranty: { ar: ['ضمان', 'استرجاع', 'تبديل'], fr: ['garantie', 'retour', 'échange'], en: ['warranty', 'guarantee', 'return'] }[lang],
    hours: { ar: ['ساعة', 'مواعيد', 'دوام', 'متى', 'أوقات'], fr: ['horaire', 'heure', 'ouvert', 'quand'], en: ['hour', 'open', 'time', 'when', 'schedule'] }[lang],
  };

  for (const [type, keywords] of Object.entries(infoKeywords)) {
    if (keywords.some(k => lower.includes(k))) {
      return { reply: infoResponses[lang][type], products: [] };
    }
  }

  const keywords = extractKeywords(message, lang);
  if (keywords.length === 0) {
    return { reply: infoResponses[lang].default, products: [] };
  }

  const scored = loadProducts().filter(p => !p.hidden).map(p => {
    const text = `${(p as any)[nameKey]} ${(p as any)[descKey]} ${p.brand || ''}`.toLowerCase();
    const score = keywords.filter(kw => text.includes(kw)).length;
    return { ...p, score };
  }).filter(p => p.score > 0).sort((a, b) => b.score - a.score);

  const matched = scored.slice(0, 5).map(p => ({
    id: p.id, nameAr: p.nameAr, nameFr: p.nameFr, nameEn: p.nameEn,
    descAr: p.descAr, descFr: p.descFr, descEn: p.descEn,
    price: p.price, image: p.image, brand: p.brand,
  }));

  if (matched.length === 0) {
    const notFound = {
      ar: `ما لقيت نتائج لـ "**${message}**" 😕\n\nجرب كلمات ثانية أو تصفح المنتجات يدوياً.`,
      fr: `Aucun résultat pour "**${message}**" 😕\n\nEssayez d'autres mots ou parcourez les produits.`,
      en: `No results for "**${message}**" 😕\n\nTry other words or browse products manually.`,
    };
    return { reply: notFound[lang], products: [] };
  }

  const names = matched.map((p, i) => `${i+1}. **${(p as any)[nameKey]}** — ${p.price.toLocaleString()} د.ج`).join('\n');
  const replies = {
    ar: `🎯 لقيت ${matched.length} منتج${matched.length > 1 ? 'ات' : ''}:\n\n${names}\n\nاختر منتج للإضافة إلى السلة 🛒`,
    fr: `🎯 ${matched.length} produit${matched.length > 1 ? 's' : ''} trouvé${matched.length > 1 ? 's' : ''}:\n\n${names}\n\nChoisissez un produit pour l\'ajouter au panier 🛒`,
    en: `🎯 Found ${matched.length} product${matched.length > 1 ? 's' : ''}:\n\n${names}\n\nClick a product to add to cart 🛒`,
  };
  return { reply: replies[lang], products: matched };
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="chat-bubble-assistant flex items-center gap-1 px-4 py-3">
        <motion.span className="w-2 h-2 rounded-full bg-foreground/40" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
        <motion.span className="w-2 h-2 rounded-full bg-foreground/40" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} />
        <motion.span className="w-2 h-2 rounded-full bg-foreground/40" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} />
      </div>
    </div>
  );
}

export function AIAssistant() {
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setMessages(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => { const t2 = setTimeout(() => setShowBubble(false), 15000); return () => clearTimeout(t2); }, []);

  useEffect(() => {
    const p = loadProducts();
    api.syncProducts(p).catch(() => {});
  }, []);

  useEffect(() => {
    if (open && messages.length === 0) {
      const g = {
        ar: '👋 مرحباً بك في **مساعد أيوب الذكي**!\n\nأقدر أساعدك في:\n- 🔍 البحث عن منتجات\n- 💳 الدفع والشحن\n- 🛡️ الضمان وساعات العمل\n\nاكتب سؤالك أو اختر من الاقتراحات 👇',
        fr: '👋 Bienvenue sur **l\'assistant Ayoub**!\n\nJe peux vous aider avec:\n- 🔍 Recherche de produits\n- 💳 Paiement et livraison\n- 🛡️ Garantie et horaires\n\nPosez votre question ou choisissez une suggestion 👇',
        en: '👋 Welcome to **Ayoub Smart Assistant**!\n\nI can help you with:\n- 🔍 Product search\n- 💳 Payment & shipping\n- 🛡️ Warranty & hours\n\nAsk your question or pick a suggestion 👇',
      };
      setMessages([{ role: 'assistant', text: g[language] }]);
    }
  }, [open, language, messages.length]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  }, []);

  const handleSend = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: ChatMsg = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }

    const lang = getLang(text);

    try {
      const data = await api.post<{ reply: string; products: any[]; type: string }>('/chat', { message: text, language: lang });
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply, products: data.products }]);
    } catch {
      const { reply, products } = smartSearch(text, lang);
      await new Promise(r => setTimeout(r, 400));
      setMessages(prev => [...prev, { role: 'assistant', text: reply, products }]);
    }

    setLoading(false);
  }, [loading]);

  const handleRegenerate = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    if (lastUser) handleSend(lastUser.text);
  }, [messages, handleSend]);

  const handleClear = useCallback(() => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const handleCopy = useCallback((text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }, [handleSend, input]);

  const suggestionCards = [
    {
      icon: '🔍',
      title: t({ ar: 'ابحث عن منتج', fr: 'Chercher un produit', en: 'Search products' }),
      desc: t({ ar: 'طابعة، ماوس، كيبورد...', fr: 'Imprimante, souris, clavier...', en: 'Printer, mouse, keyboard...' }),
      prompt: t({ ar: 'أريد طابعة', fr: 'Je cherche une imprimante', en: 'I need a printer' }),
    },
    {
      icon: '💳',
      title: t({ ar: 'طرق الدفع', fr: 'Moyens de paiement', en: 'Payment methods' }),
      desc: t({ ar: 'كاش عند الاستلام', fr: 'Cash à la livraison', en: 'Cash on delivery' }),
      prompt: t({ ar: 'كيف أدفع؟', fr: 'Comment payer?', en: 'How to pay?' }),
    },
    {
      icon: '🚚',
      title: t({ ar: 'الشحن', fr: 'Livraison', en: 'Shipping' }),
      desc: t({ ar: 'الجزائر كلها', fr: 'Toute l\'Algérie', en: 'All Algeria' }),
      prompt: t({ ar: 'مدة التوصيل', fr: 'Délai de livraison', en: 'Delivery time' }),
    },
    {
      icon: '🛡️',
      title: t({ ar: 'الضمان', fr: 'Garantie', en: 'Warranty' }),
      desc: t({ ar: 'ضمان رسمي', fr: 'Garantie officielle', en: 'Official warranty' }),
      prompt: t({ ar: 'هل فيه ضمان؟', fr: 'Y a-t-il une garantie?', en: 'Is there warranty?' }),
    },
  ];

  return (
    <>
      <AnimatePresence>
        {!open && showBubble && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, y: [0, -8, 0] }}
            transition={{ y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => { setOpen(true); setShowBubble(false); }}
            className="fixed bottom-20 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-xl hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center"
          >
            <Sparkles className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            dir={dir}
            className="fixed bottom-4 left-4 z-50 w-[400px] max-w-[calc(100vw-1.5rem)] h-[600px] max-h-[calc(100vh-32px)] rounded-2xl border border-border bg-background shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-tight">AI Assistant</p>
                  <p className="text-[10px] text-muted-foreground">{t({ ar: 'مساعد أيوب الذكي', fr: 'Assistant Ayoub', en: 'Ayoub Smart Assistant' })}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={handleClear}
                    title={t({ ar: 'مسح المحادثة', fr: 'Effacer la conversation', en: 'Clear conversation' })}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`group relative max-w-[88%] ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                    <div
                      className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-primary-foreground' : 'text-foreground'}`}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                    />
                    {msg.products && msg.products.length > 0 && (
                      <div className={`mt-3 space-y-1.5 border-t pt-2 ${msg.role === 'user' ? 'border-white/20' : 'border-border'}`}>
                        {msg.products.map((p) => (
                          <div key={p.id} className={`flex items-center gap-2.5 rounded-xl p-2 ${msg.role === 'user' ? 'bg-white/10' : 'bg-muted/50'} hover:${msg.role === 'user' ? 'bg-white/15' : 'bg-muted'} transition-colors`}>
                            <div className="w-10 h-10 rounded-lg bg-background overflow-hidden flex-shrink-0">
                              <img src={p.image} alt="" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {language === 'ar' ? p.nameAr : language === 'fr' ? p.nameFr : p.nameEn}
                              </p>
                              <p className="text-[10px] opacity-70">{p.price.toLocaleString()} د.ج</p>
                            </div>
                            <button
                              onClick={() => addItem({ productId: p.id, quantity: 1, price: p.price, name: p.nameAr || p.nameFr || p.nameEn })}
                              className="w-7 h-7 rounded-lg bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center transition-all flex-shrink-0"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.role === 'assistant' && (
                      <div className={`absolute ${dir === 'rtl' ? 'left-0' : 'right-0'} -bottom-5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5`}>
                        <button
                          onClick={() => handleCopy(msg.text, i)}
                          className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title={t({ ar: 'نسخ', fr: 'Copier', en: 'Copy' })}
                        >
                          {copiedId === i ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                        {i === messages.length - 1 && !loading && (
                          <button
                            onClick={handleRegenerate}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title={t({ ar: 'إعادة', fr: 'Régénérer', en: 'Regenerate' })}
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              {loading && <TypingIndicator />}
              <div ref={endRef} />
            </div>

            {messages.length < 2 && (
              <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                {suggestionCards.map((card, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i, duration: 0.3 }}
                    onClick={() => handleSend(card.prompt)}
                    className="text-left p-3 rounded-xl border border-border bg-muted/30 hover:bg-muted hover:border-primary/30 transition-all group"
                  >
                    <span className="text-lg">{card.icon}</span>
                    <p className="text-xs font-semibold mt-1 group-hover:text-primary transition-colors">{card.title}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{card.desc}</p>
                  </motion.button>
                ))}
              </div>
            )}

            <div className="border-t border-border bg-background">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                className="flex items-end gap-2 p-3"
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); autoResize(); }}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder={t({ ar: 'اكتب سؤالك...', fr: 'Posez votre question...', en: 'Ask anything...' })}
                  className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none min-h-[40px] max-h-[160px] placeholder:text-muted-foreground/60"
                  dir={dir}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-30 flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[9px] text-muted-foreground/50 text-center pb-2">
                {t({ ar: 'قد يحدث أخطاء. تحقق من المعلومات المهمة.', fr: 'Peut faire des erreurs. Vérifiez les infos.', en: 'May make mistakes. Verify important info.' })}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

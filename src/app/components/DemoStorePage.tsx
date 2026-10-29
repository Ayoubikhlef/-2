import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  Info,
  MapPin,
  MessageCircle,
  Minus,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Star,
  Trash2,
  Truck,
  X,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteSettings } from '../utils/siteSettingsStorage';
import { brand } from '../config/brand';

type LangString = { ar: string; fr: string; en: string };

interface DemoProduct {
  id: string;
  name: LangString;
  desc: LangString;
  price: number;
  oldPrice?: number;
  image: string;
  category: 'computers' | 'accessories' | 'printers';
  rating: number;
  badge?: LangString;
}

const products: DemoProduct[] = [
  {
    id: 'laptop',
    name: { ar: 'حاسوب محمول احترافي 15"', fr: 'Laptop professionnel 15"', en: 'Professional laptop 15"' },
    desc: { ar: 'معالج i7، ذاكرة 16GB، قرص SSD 512GB', fr: 'i7, 16 Go RAM, SSD 512 Go', en: 'i7, 16GB RAM, 512GB SSD' },
    price: 89000,
    oldPrice: 105000,
    image: '/products/17.jpg',
    category: 'computers',
    rating: 4.8,
    badge: { ar: 'الأكثر مبيعاً', fr: 'Best-seller', en: 'Best-seller' },
  },
  {
    id: 'desktop',
    name: { ar: 'حاسوب مكتبي للألعاب', fr: 'PC gamer bureau', en: 'Gaming desktop PC' },
    desc: { ar: 'RTX 4060، Ryzen 7، تبريد مائي', fr: 'RTX 4060, Ryzen 7, watercooling', en: 'RTX 4060, Ryzen 7, water cooling' },
    price: 145000,
    image: '/products/19.jpg',
    category: 'computers',
    rating: 4.9,
  },
  {
    id: 'case',
    name: { ar: 'صندوق حاسوب RGB', fr: 'Boîtier PC RGB', en: 'RGB PC case' },
    desc: { ar: '3 مراوح RGB، زجاج مقسّى', fr: '3 ventilateurs RGB, verre trempé', en: '3 RGB fans, tempered glass' },
    price: 12500,
    oldPrice: 15000,
    image: '/products/14.jpg',
    category: 'accessories',
    rating: 4.6,
  },
  {
    id: 'mouse',
    name: { ar: 'ماوس لاسلكي', fr: 'Souris sans fil', en: 'Wireless mouse' },
    desc: { ar: 'استجابة سريعة، بطارية تدوم 70 ساعة', fr: 'Réponse rapide, 70h d’autonomie', en: 'Fast response, 70h battery' },
    price: 3500,
    image: '/products/07.jpg',
    category: 'accessories',
    rating: 4.7,
  },
  {
    id: 'charger',
    name: { ar: 'شاحن USB-C 65W', fr: 'Chargeur USB-C 65W', en: 'USB-C charger 65W' },
    desc: { ar: 'شحن سريع للحاسوب والهاتف', fr: 'Charge rapide PC et téléphone', en: 'Fast charging for laptop and phone' },
    price: 4200,
    image: '/products/12.jpg',
    category: 'accessories',
    rating: 4.5,
  },
  {
    id: 'printer',
    name: { ar: 'طابعة ليزر A3', fr: 'Imprimante laser A3', en: 'A3 laser printer' },
    desc: { ar: 'طباعة، نسخ، ومسح — 22 صفحة/دقيقة', fr: 'Impression, copie, scan — 22 ppm', en: 'Print, copy, scan — 22 ppm' },
    price: 78000,
    oldPrice: 85000,
    image: '/products/01.jpg',
    category: 'printers',
    rating: 4.8,
  },
];

const categories: { id: 'all' | DemoProduct['category']; label: LangString }[] = [
  { id: 'all', label: { ar: 'كل المنتجات', fr: 'Tous les produits', en: 'All products' } },
  { id: 'computers', label: { ar: 'حواسيب', fr: 'Ordinateurs', en: 'Computers' } },
  { id: 'accessories', label: { ar: 'ملحقات', fr: 'Accessoires', en: 'Accessories' } },
  { id: 'printers', label: { ar: 'طابعات', fr: 'Imprimantes', en: 'Printers' } },
];

const wilayas = ['جيجل', 'الجزائر', 'وهران', 'قسنطينة', 'سطيف', 'عنابة', 'البليدة', 'تلمسان'];

const FREE_DELIVERY_FROM = 10000;
const DELIVERY_FEE = 600;

export function DemoStorePage() {
  const { t, language } = useLanguage();
  const [settings] = useState(() => getSiteSettings());
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [category, setCategory] = useState<'all' | DemoProduct['category']>('all');
  const [orderRef, setOrderRef] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', wilaya: wilayas[0], address: '' });
  const [formError, setFormError] = useState('');

  const phone = settings.contact.phoneInternational;
  const phoneDisplay = settings.contact.phoneDisplay;

  const fmt = (value: number) => value.toLocaleString('en-US').replace(/,/g, ' ');
  const currency = t({ ar: 'دج', fr: 'DZD', en: 'DZD' });

  const visibleProducts = useMemo(
    () => (category === 'all' ? products : products.filter((product) => product.category === category)),
    [category],
  );

  const items = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const product = products.find((item) => item.id === id);
          return product ? { product, qty } : null;
        })
        .filter((entry): entry is { product: DemoProduct; qty: number } => entry !== null),
    [cart],
  );

  const count = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const delivery = subtotal === 0 || subtotal >= FREE_DELIVERY_FROM ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;

  const waLink = (message: string) => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  const demoRequest = t({
    ar: 'السلام عليكم، شفت المتجر التجريبي وأريد متجراً مشابهاً لمحلي.',
    fr: 'Bonjour, j’ai vu la boutique de démonstration et je veux une boutique similaire pour mon commerce.',
    en: 'Hello, I saw the demo store and I want a similar store for my business.',
  });

  const addToCart = (id: string) => {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
    setStep('cart');
    setCartOpen(true);
  };

  const setQty = (id: string, qty: number) => {
    setCart((current) => {
      if (qty <= 0) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: qty };
    });
  };

  const resetOrder = () => {
    setCart({});
    setStep('cart');
    setCartOpen(false);
    setForm({ name: '', phone: '', wilaya: wilayas[0], address: '' });
    setFormError('');
    setOrderRef('');
  };

  const submitOrder = () => {
    if (form.name.trim().length < 3) {
      setFormError(t({ ar: 'أدخل الاسم الكامل (3 أحرف على الأقل).', fr: 'Entrez votre nom complet (3 caractères minimum).', en: 'Enter your full name (at least 3 characters).' }));
      return;
    }
    if (!/^0?\d{9,10}$/.test(form.phone.replace(/\s/g, ''))) {
      setFormError(t({ ar: 'أدخل رقم هاتف صحيح (10 أرقام).', fr: 'Entrez un numéro de téléphone valide (10 chiffres).', en: 'Enter a valid phone number (10 digits).' }));
      return;
    }
    if (form.address.trim().length < 5) {
      setFormError(t({ ar: 'أدخل العنوان بالتفصيل.', fr: 'Entrez une adresse détaillée.', en: 'Enter a detailed address.' }));
      return;
    }
    setFormError('');
    setOrderRef(`DEMO-${Math.floor(1000 + Math.random() * 9000)}`);
    setStep('success');
  };

  return (
    <div className="bg-background">
      {/* Demo banner */}
      <div className="bg-slate-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-center sm:justify-between gap-2 text-xs sm:text-sm">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Info className="w-4 h-4 text-amber-400" />
            {t({ ar: 'نسخة تجريبية — منتجات وبيانات وهمية', fr: 'Version démo — produits et données fictifs', en: 'Demo version — fictional products and data' })}
          </span>
          <a href="/create-website" className="inline-flex items-center gap-1.5 font-bold text-amber-400 hover:text-amber-300">
            {t({ ar: 'أريد متجراً كهذا', fr: 'Je veux une boutique comme celle-ci', en: 'I want a store like this' })}
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </a>
        </div>
      </div>

      {/* Store header */}
      <section className="border-b border-border bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black">TD</div>
            <div>
              <p className="font-black leading-tight">TECH DZ</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{t({ ar: 'متجر تجريبي', fr: 'Boutique démo', en: 'Demo store' })}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <Truck className="w-4 h-4 text-primary" />
            {t({ ar: `توصيل مجاني من ${fmt(FREE_DELIVERY_FROM)} دج`, fr: `Livraison gratuite dès ${fmt(FREE_DELIVERY_FROM)} DZD`, en: `Free delivery from ${fmt(FREE_DELIVERY_FROM)} DZD` })}
          </div>
          <button
            onClick={() => { setStep('cart'); setCartOpen(true); }}
            className="relative inline-flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">{t({ ar: 'السلة', fr: 'Panier', en: 'Cart' })}</span>
            {count > 0 && (
              <span className="absolute -top-1.5 -end-1.5 bg-amber-400 text-slate-900 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </button>
        </div>
      </section>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
        <div className="absolute -top-24 -start-24 w-72 h-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-24 -end-24 w-72 h-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <span className="inline-block bg-amber-400 text-slate-900 text-xs font-black px-3 py-1.5 rounded-full mb-4">
              {t({ ar: 'تخفيضات هذا الأسبوع', fr: 'Promos de la semaine', en: 'This week’s deals' })}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
              {t({ ar: 'كل ما تحتاجه للإعلام الآلي، في مكان واحد', fr: 'Tout l’informatique, au même endroit', en: 'All your tech, in one place' })}
            </h1>
            <p className="text-blue-100/75 max-w-lg mb-6">
              {t({ ar: 'حواسيب، ملحقات، وطابعات — بضمان، توصيل لكل الولايات، والدفع عند الاستلام.', fr: 'Ordinateurs, accessoires et imprimantes — garantie, livraison partout, paiement à la livraison.', en: 'Computers, accessories and printers — warranty, nationwide delivery, cash on delivery.' })}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="#demo-products"
                onClick={(event) => { event.preventDefault(); document.getElementById('demo-products')?.scrollIntoView({ behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 bg-white text-slate-900 px-5 py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-all"
              >
                {t({ ar: 'تسوّق الآن', fr: 'Acheter maintenant', en: 'Shop now' })}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </a>
              <div className="inline-flex items-center gap-2 border border-white/20 px-4 py-3 rounded-xl text-xs font-semibold text-blue-100/80">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                {t({ ar: 'ضمان سنة كاملة', fr: 'Garantie 1 an', en: '1-year warranty' })}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <img src="/products/17.jpg" alt="Laptop" className="rounded-2xl object-cover w-full h-40 md:h-48 border border-white/10" loading="lazy" />
            <img src="/products/07.jpg" alt="Mouse" className="rounded-2xl object-cover w-full h-40 md:h-48 border border-white/10" loading="lazy" />
            <img src="/products/01.jpg" alt="Printer" className="rounded-2xl object-cover w-full h-40 md:h-48 border border-white/10" loading="lazy" />
            <img src="/products/19.jpg" alt="PC" className="rounded-2xl object-cover w-full h-40 md:h-48 border border-white/10" loading="lazy" />
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="demo-products" className="py-12 md:py-16 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black">{t({ ar: 'منتجاتنا', fr: 'Nos produits', en: 'Our products' })}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t({ ar: `${products.length} منتجات — أسعار بالدينار الجزائري`, fr: `${products.length} produits — prix en DZD`, en: `${products.length} products — prices in DZD` })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCategory(item.id)}
                  aria-pressed={category === item.id}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${category === item.id ? 'bg-primary text-white' : 'bg-muted text-foreground/70 hover:bg-muted/80'}`}
                >
                  {t(item.label)}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
            {visibleProducts.map((product) => (
              <div key={product.id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-border overflow-hidden flex flex-col">
                <div className="relative aspect-square bg-slate-100 dark:bg-slate-900/50 overflow-hidden">
                  <img src={product.image} alt={t(product.name)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  {product.badge && (
                    <span className="absolute top-2 start-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-md">
                      {t(product.badge)}
                    </span>
                  )}
                  {product.oldPrice && (
                    <span className="absolute top-2 end-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md">
                      -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                    </span>
                  )}
                </div>
                <div className="p-3 md:p-4 flex flex-col flex-1">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-bold text-muted-foreground">{product.rating}</span>
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm leading-snug mb-1 line-clamp-2">{t(product.name)}</h3>
                  <p className="text-[11px] text-muted-foreground leading-snug mb-3 line-clamp-2">{t(product.desc)}</p>
                  <div className="mt-auto">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-sm sm:text-base font-black">{fmt(product.price)} <span className="text-[10px]">{currency}</span></span>
                      {product.oldPrice && (
                        <span className="text-[11px] text-muted-foreground line-through">{fmt(product.oldPrice)}</span>
                      )}
                    </div>
                    <button
                      onClick={() => addToCart(product.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-2 rounded-lg text-xs font-bold transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {t({ ar: 'أضف إلى السلة', fr: 'Ajouter', en: 'Add to cart' })}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="pb-12 md:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { icon: Truck, title: { ar: 'توصيل سريع', fr: 'Livraison rapide', en: 'Fast delivery' }, text: { ar: '24–72 ساعة لكل الولايات', fr: '24–72h partout en Algérie', en: '24–72h nationwide' } },
              { icon: ShieldCheck, title: { ar: 'دفع عند الاستلام', fr: 'Paiement à la livraison', en: 'Cash on delivery' }, text: { ar: 'تفحص المنتج قبل الدفع', fr: 'Vérifiez avant de payer', en: 'Check before paying' } },
              { icon: Phone, title: { ar: 'دعم مباشر', fr: 'Support direct', en: 'Direct support' }, text: { ar: phoneDisplay, fr: phoneDisplay, en: phoneDisplay } },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-800 border border-border rounded-2xl p-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t(item.title)}</p>
                  <p className="text-xs text-muted-foreground">{t(item.text)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-950 text-white p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-start">
            <div>
              <p className="font-black text-lg md:text-xl mb-1">{t({ ar: 'أعجبك هذا المتجر؟', fr: 'Cette boutique vous plaît ?', en: 'Like this store?' })}</p>
              <p className="text-sm text-blue-100/70">{t({ ar: 'نصنع لك واحداً مشابهاً بمنتجاتك وألوانك، خلال 10–14 يوماً.', fr: 'Nous créons le vôtre avec vos produits et vos couleurs, en 10–14 jours.', en: 'We build yours with your products and colors, in 10–14 days.' })}</p>
            </div>
            <a
              href={waLink(demoRequest)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-slate-900 px-5 py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-all shrink-0"
            >
              <MessageCircle className="w-4 h-4" />
              {t({ ar: 'اطلب متجرك', fr: 'Demander ma boutique', en: 'Request my store' })}
            </a>
          </div>
        </div>
      </section>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-[70]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setCartOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 end-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-black">
                {step === 'checkout'
                  ? t({ ar: 'إتمام الطلب', fr: 'Finaliser la commande', en: 'Checkout' })
                  : step === 'success'
                    ? t({ ar: 'تم الطلب', fr: 'Commande reçue', en: 'Order received' })
                    : t({ ar: 'سلة المشتريات', fr: 'Panier', en: 'Cart' })}
              </h3>
              <button onClick={() => setCartOpen(false)} className="p-2 rounded-lg hover:bg-muted" aria-label={t({ ar: 'إغلاق', fr: 'Fermer', en: 'Close' })}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {step === 'cart' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.length === 0 && (
                    <div className="text-center py-16 text-sm text-muted-foreground">
                      <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      {t({ ar: 'السلة فارغة', fr: 'Votre panier est vide', en: 'Your cart is empty' })}
                    </div>
                  )}
                  {items.map(({ product, qty }) => (
                    <div key={product.id} className="flex gap-3 border border-border rounded-xl p-2.5">
                      <img src={product.image} alt={t(product.name)} className="w-16 h-16 rounded-lg object-cover bg-slate-100" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{t(product.name)}</p>
                        <p className="text-[11px] text-muted-foreground">{fmt(product.price)} {currency}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button onClick={() => setQty(product.id, qty - 1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-muted" aria-label="-">
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{qty}</span>
                          <button onClick={() => setQty(product.id, qty + 1)} className="w-6 h-6 rounded-md border border-border flex items-center justify-center hover:bg-muted" aria-label="+">
                            <Plus className="w-3 h-3" />
                          </button>
                          <button onClick={() => setQty(product.id, 0)} className="ms-auto text-muted-foreground hover:text-red-500" aria-label={t({ ar: 'حذف', fr: 'Supprimer', en: 'Remove' })}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t({ ar: 'المجموع الفرعي', fr: 'Sous-total', en: 'Subtotal' })}</span>
                    <span className="font-bold">{fmt(subtotal)} {currency}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t({ ar: 'التوصيل', fr: 'Livraison', en: 'Delivery' })}</span>
                    <span className="font-bold">{delivery === 0 ? t({ ar: 'مجاني', fr: 'Gratuite', en: 'Free' }) : `${fmt(delivery)} ${currency}`}</span>
                  </div>
                  <div className="flex items-center justify-between text-base border-t border-border pt-3">
                    <span className="font-bold">{t({ ar: 'المجموع', fr: 'Total', en: 'Total' })}</span>
                    <span className="font-black">{fmt(total)} {currency}</span>
                  </div>
                  <button
                    onClick={() => setStep('checkout')}
                    disabled={items.length === 0}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t({ ar: 'إتمام الطلب', fr: 'Passer la commande', en: 'Place order' })}
                  </button>
                </div>
              </>
            )}

            {step === 'checkout' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-[11px] text-amber-700 dark:text-amber-400">
                    {t({ ar: 'هذا نموذج تجريبي. لن يتم إرسال أي طلب أو دفع أي مبلغ.', fr: 'Formulaire de démonstration. Aucune commande ni paiement réels.', en: 'Demo form. No real order or payment is sent.' })}
                  </div>
                  <label className="block">
                    <span className="text-xs font-bold">{t({ ar: 'الاسم الكامل', fr: 'Nom complet', en: 'Full name' })}</span>
                    <input
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      placeholder={t({ ar: 'مثال: أحمد بن علي', fr: 'Ex : Ahmed Benali', en: 'e.g. Ahmed Benali' })}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold">{t({ ar: 'رقم الهاتف', fr: 'Téléphone', en: 'Phone' })}</span>
                    <input
                      value={form.phone}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                      inputMode="tel"
                      placeholder="06 XX XX XX XX"
                      dir="ltr"
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold">{t({ ar: 'الولاية', fr: 'Wilaya', en: 'Wilaya' })}</span>
                    <select
                      value={form.wilaya}
                      onChange={(event) => setForm({ ...form, wilaya: event.target.value })}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                    >
                      {wilayas.map((wilaya) => (
                        <option key={wilaya} value={wilaya}>{wilaya}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold">{t({ ar: 'العنوان', fr: 'Adresse', en: 'Address' })}</span>
                    <textarea
                      value={form.address}
                      onChange={(event) => setForm({ ...form, address: event.target.value })}
                      rows={2}
                      placeholder={t({ ar: 'الشارع، الحي، رقم المنزل', fr: 'Rue, quartier, numéro', en: 'Street, district, number' })}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary resize-none"
                    />
                  </label>
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full border-2 border-primary bg-primary shrink-0" />
                    <div>
                      <p className="text-xs font-bold">{t({ ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison', en: 'Cash on delivery' })}</p>
                      <p className="text-[11px] text-muted-foreground">{t({ ar: 'تدفع نقداً عند استلام الطلب', fr: 'Vous payez à la réception', en: 'Pay when you receive' })}</p>
                    </div>
                  </div>
                  {formError && <p className="text-xs font-semibold text-red-500">{formError}</p>}
                </div>
                <div className="border-t border-border p-4 space-y-3">
                  <div className="flex items-center justify-between text-base">
                    <span className="font-bold">{t({ ar: 'المجموع', fr: 'Total', en: 'Total' })}</span>
                    <span className="font-black">{fmt(total)} {currency}</span>
                  </div>
                  <button
                    onClick={submitOrder}
                    className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
                  >
                    {t({ ar: 'تأكيد الطلب', fr: 'Confirmer la commande', en: 'Confirm order' })}
                  </button>
                  <button onClick={() => setStep('cart')} className="w-full text-xs font-semibold text-muted-foreground hover:text-foreground">
                    {t({ ar: 'رجوع إلى السلة', fr: 'Retour au panier', en: 'Back to cart' })}
                  </button>
                </div>
              </>
            )}

            {step === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="text-lg font-black mb-2">{t({ ar: 'تم استلام طلبك التجريبي', fr: 'Commande démo reçue', en: 'Demo order received' })}</h4>
                <p className="text-sm text-muted-foreground mb-1">
                  {t({ ar: 'رقم الطلب:', fr: 'N° de commande :', en: 'Order number:' })} <span className="font-bold text-foreground">{orderRef}</span>
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  {t({ ar: 'المجموع:', fr: 'Total :', en: 'Total:' })} <span className="font-bold text-foreground">{fmt(total)} {currency}</span>
                </p>
                <p className="text-[11px] text-muted-foreground max-w-xs mb-6">
                  {t({ ar: 'في المتجر الحقيقي، يصلك اتصال هاتفي لتأكيد الطلب خلال 24 ساعة.', fr: 'Dans une vraie boutique, vous recevez un appel de confirmation sous 24h.', en: 'In a real store, you get a confirmation call within 24h.' })}
                </p>
                <button onClick={resetOrder} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary/90">
                  {t({ ar: 'تجربة جديدة', fr: 'Nouvel essai', en: 'Try again' })}
                </button>
                <a href="/create-website" className="mt-3 text-xs font-bold text-primary hover:underline">
                  {t({ ar: 'بغيت متجراً بحال هذا؟', fr: 'Je veux une boutique comme celle-ci', en: 'I want a store like this' })}
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer note */}
      <footer className="border-t border-border bg-slate-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            {t({ ar: `متجر تجريبي من ${brand.name} — جيجل، الجزائر`, fr: `Boutique démo par ${brand.name} — Jijel, Algérie`, en: `Demo store by ${brand.name} — Jijel, Algeria` })}
          </span>
          <a href="/create-website" className="font-bold text-primary hover:underline">
            {t({ ar: 'العودة إلى صفحة الخدمة', fr: 'Retour à la page service', en: 'Back to services' })}
          </a>
        </div>
      </footer>
    </div>
  );
}

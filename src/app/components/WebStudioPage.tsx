import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  Globe,
  Languages,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Truck,
  Wrench,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteSettings } from '../utils/siteSettingsStorage';

type LangString = { ar: string; fr: string; en: string };

interface Tier {
  id: 'presence' | 'boutique' | 'pro';
  name: LangString;
  price: number;
  tagline: LangString;
  delay: LangString;
  features: LangString[];
  popular?: boolean;
}

const tiers: Tier[] = [
  {
    id: 'presence',
    name: { ar: 'موقع تعريفي', fr: 'Présence', en: 'Presence' },
    price: 25000,
    tagline: {
      ar: 'للمحلات والمهن الحرة التي تريد الظهور في Google',
      fr: 'Pour les commerces et indépendants qui veulent être trouvés',
      en: 'For shops and freelancers who want to be found',
    },
    delay: { ar: '7 أيام', fr: '7 jours', en: '7 days' },
    features: [
      { ar: 'موقع من 5 صفحات (الرئيسية، الخدمات، من نحن، المعرض، اتصل بنا)', fr: 'Site 5 pages (Accueil, Services, À propos, Galerie, Contact)', en: '5-page website (Home, Services, About, Gallery, Contact)' },
      { ar: 'تصميم متوافق مع الهاتف والحاسوب', fr: 'Design responsive mobile / tablette / PC', en: 'Responsive design on mobile / tablet / desktop' },
      { ar: 'زر WhatsApp + خريطة Google', fr: 'Bouton WhatsApp + Google Maps', en: 'WhatsApp button + Google Maps' },
      { ar: 'اسم النطاق .com + الاستضافة لمدة سنة', fr: 'Nom de domaine .com + hébergement 1 an', en: '.com domain + 1 year hosting' },
      { ar: 'نموذج تواصل + بريد إلكتروني احترافي', fr: 'Formulaire de contact + e-mail professionnel', en: 'Contact form + professional email' },
    ],
  },
  {
    id: 'boutique',
    name: { ar: 'متجر إلكتروني', fr: 'Boutique', en: 'Online Store' },
    price: 45000,
    popular: true,
    tagline: {
      ar: 'تعرض منتجاتك، تستقبل الطلبات، وتدير كل شيء بنفسك',
      fr: 'Vendez en ligne et gérez tout vous-même',
      en: 'Sell online and manage everything yourself',
    },
    delay: { ar: '10–14 يوماً', fr: '10–14 jours', en: '10–14 days' },
    features: [
      { ar: 'كل ما في الباقة التعريفية', fr: 'Tout le pack Présence', en: 'Everything in Presence' },
      { ar: 'كتالوج المنتجات + سلة المشتريات', fr: 'Catalogue produits + panier', en: 'Product catalog + cart' },
      { ar: 'الطلبات + الدفع عند الاستلام', fr: 'Commandes + paiement à la livraison', en: 'Orders + cash on delivery' },
      { ar: 'لوحة تحكم: المنتجات، المخزون، الطلبات', fr: 'Tableau de bord : produits, stock, commandes', en: 'Dashboard: products, stock, orders' },
      { ar: 'فواتير PDF + تتبع الطلبات', fr: 'Factures PDF + suivi des commandes', en: 'PDF invoices + order tracking' },
      { ar: 'العربية + الفرنسية', fr: 'Arabe + français', en: 'Arabic + French' },
      { ar: 'تكوين لمدة ساعة + دعم 14 يوماً', fr: 'Formation 1h + support 14 jours', en: '1h training + 14 days support' },
    ],
  },
  {
    id: 'pro',
    name: { ar: 'متجر متكامل', fr: 'Pro', en: 'Pro' },
    price: 75000,
    tagline: {
      ar: 'دفع إلكتروني، توصيل، وSEO — نظام متكامل',
      fr: 'Paiement en ligne, livraison et SEO — système complet',
      en: 'Online payment, delivery and SEO — full system',
    },
    delay: { ar: '20–30 يوماً', fr: '20–30 jours', en: '20–30 days' },
    features: [
      { ar: 'كل ما في باقة المتجر الإلكتروني', fr: 'Tout le pack Boutique', en: 'Everything in Boutique' },
      { ar: 'الدفع الإلكتروني CIB / الذهبية / BaridiMob', fr: 'Paiement en ligne CIB / Edahabia / BaridiMob', en: 'Online payment CIB / Edahabia / BaridiMob' },
      { ar: 'ربط التوصيل Yalidine + حساب التكلفة', fr: 'Intégration Yalidine + calcul des frais', en: 'Yalidine integration + shipping fees' },
      { ar: '3 لغات (العربية / الفرنسية / الإنجليزية)', fr: '3 langues (AR / FR / EN)', en: '3 languages (AR / FR / EN)' },
      { ar: 'SEO + Google Search Console', fr: 'SEO + Google Search Console', en: 'SEO + Google Search Console' },
      { ar: 'حسابات العملاء + برنامج الولاء', fr: 'Comptes clients + programme fidélité', en: 'Customer accounts + loyalty program' },
      { ar: 'دعم 30 يوماً + تحسينات', fr: 'Support 30 jours + optimisations', en: '30 days support + optimizations' },
    ],
  },
];

interface Extra {
  id: 'payment' | 'multilang' | 'delivery' | 'logo';
  label: LangString;
  price: number;
  icon: typeof CreditCard;
  includedInPro?: boolean;
}

const extras: Extra[] = [
  { id: 'payment', label: { ar: 'الدفع الإلكتروني (CIB / الذهبية)', fr: 'Paiement en ligne (CIB / Edahabia)', en: 'Online payment (CIB / Edahabia)' }, price: 12000, icon: CreditCard, includedInPro: true },
  { id: 'delivery', label: { ar: 'ربط التوصيل Yalidine', fr: 'Intégration livraison Yalidine', en: 'Yalidine delivery integration' }, price: 8000, icon: Truck, includedInPro: true },
  { id: 'multilang', label: { ar: '3 لغات بدل لغتين', fr: '3 langues au lieu de 2', en: '3 languages instead of 2' }, price: 8000, icon: Languages, includedInPro: true },
  { id: 'logo', label: { ar: 'شعار وهوية بصرية', fr: 'Logo & identité visuelle', en: 'Logo & brand identity' }, price: 7000, icon: Palette },
];

const faqs: { q: LangString; a: LangString }[] = [
  {
    q: { ar: 'كم يستغرق إنجاز الموقع؟', fr: 'Combien de temps pour livrer le site ?', en: 'How long does delivery take?' },
    a: {
      ar: 'الموقع التعريفي: 7 أيام. المتجر الإلكتروني: 10–14 يوماً. المتجر المتكامل: 20–30 يوماً. تبدأ المدة من استلام المحتوى (النصوص، الصور، المنتجات).',
      fr: 'Site vitrine : 7 jours. Boutique : 10–14 jours. Pro : 20–30 jours. Le délai démarre à réception de votre contenu (textes, photos, produits).',
      en: 'Showcase site: 7 days. Store: 10–14 days. Pro: 20–30 days. The countdown starts once we receive your content (texts, photos, products).',
    },
  },
  {
    q: { ar: 'هل يمكنني تعديل المنتجات بنفسي؟', fr: 'Pourrai-je modifier mes produits moi-même ?', en: 'Can I update my products myself?' },
    a: {
      ar: 'نعم. كل متجر يأتي مع لوحة تحكم بالعربية والفرنسية، مع ساعة تكوين كاملة لإضافة منتج، تغيير السعر، وتتبع الطلبات دون الحاجة إلى مطوّر.',
      fr: 'Oui. Chaque boutique inclut un tableau de bord en arabe et français, avec 1h de formation pour ajouter un produit, changer un prix et suivre les commandes sans développeur.',
      en: 'Yes. Every store includes an Arabic/French dashboard plus 1 hour of training so you can add products, change prices and track orders without a developer.',
    },
  },
  {
    q: { ar: 'من يملك الموقع واسم النطاق؟', fr: 'Qui possède le site et le nom de domaine ?', en: 'Who owns the site and the domain?' },
    a: {
      ar: 'أنت. النطاق يُسجَّل باسمك، والكود الكامل يُسلَّم لك. لا يوجد اشتراك إلزامي ولا حجب للموقع.',
      fr: 'Vous. Le domaine est enregistré à votre nom et le code vous est livré. Aucun abonnement obligatoire, aucun blocage.',
      en: 'You do. The domain is registered in your name and the full code is delivered to you. No forced subscription, no lock-in.',
    },
  },
  {
    q: { ar: 'هل الدفع الإلكتروني إلزامي؟', fr: 'Le paiement en ligne est-il obligatoire ?', en: 'Is online payment mandatory?' },
    a: {
      ar: 'لا. في الجزائر يمثل الدفع عند الاستلام أكثر من 80% من الطلبات، وهو كافٍ للبدء. الدفع الإلكتروني يزيد الثقة ويقلل الطلبات الوهمية، ويمكن إضافته لاحقاً.',
      fr: "Non. En Algérie, le paiement à la livraison représente plus de 80 % des commandes et suffit pour démarrer. Le paiement en ligne augmente la confiance et réduit les fausses commandes, mais s'ajoute ensuite.",
      en: 'No. In Algeria, cash on delivery covers over 80% of orders and is enough to start. Online payment builds trust and reduces fake orders, but can be added later.',
    },
  },
  {
    q: { ar: 'كم تكلفة الصيانة والتحديثات؟', fr: 'Combien coûte la maintenance ?', en: 'How much is maintenance?' },
    a: {
      ar: 'الصيانة اختيارية: 8.000 دج/شهر (تحديثات، نسخ احتياطي، تعديلات صغيرة، دعم عبر WhatsApp). وبدونها يبقى الموقع يعمل.',
      fr: 'Optionnelle : 8 000 DZD/mois (mises à jour, sauvegardes, petites modifications, support WhatsApp). Sans maintenance, le site continue de fonctionner.',
      en: 'Optional: 8,000 DZD/month (updates, backups, small changes, WhatsApp support). Without it, the site keeps working.',
    },
  },
  {
    q: { ar: 'هل تعمل خارج جيجل؟', fr: 'Travaillez-vous en dehors de Jijel ?', en: 'Do you work outside Jijel?' },
    a: {
      ar: 'نعم، مع كل الولايات عن بُعد (WhatsApp + مكالمات + Google Meet). الزيارات الحضورية ممكنة في جيجل والمناطق المجاورة.',
      fr: 'Oui, partout en Algérie à distance (WhatsApp, appels, Google Meet). Les rendez-vous en personne sont possibles à Jijel et alentours.',
      en: 'Yes, anywhere in Algeria remotely (WhatsApp, calls, Google Meet). In-person meetings are possible in Jijel and nearby.',
    },
  },
  {
    q: { ar: 'هل هناك ضمان؟', fr: 'Y a-t-il une garantie ?', en: 'Is there a guarantee?' },
    a: {
      ar: 'نعم: 50% مقدماً و50% عند التسليم، مع تعديلات مجانية لمدة 14 يوماً بعد التسليم (أخطاء، تغيير نصوص وصور).',
      fr: 'Oui : 50 % à la commande, 50 % à la livraison, et 14 jours de corrections gratuites après livraison (bugs, textes, images).',
      en: 'Yes: 50% upfront, 50% on delivery, and 14 days of free fixes after delivery (bugs, texts, images).',
    },
  },
];

const trustPoints: { icon: typeof Clock; label: LangString }[] = [
  { icon: Clock, label: { ar: 'تسليم خلال 7 أيام', fr: 'Livraison dès 7 jours', en: 'Delivery from 7 days' } },
  { icon: ShieldCheck, label: { ar: '50% مقدماً / 50% عند التسليم', fr: '50 % / 50 %', en: '50% upfront / 50% on delivery' } },
  { icon: Smartphone, label: { ar: 'متوافق مع الهاتف', fr: '100 % responsive', en: '100% responsive' } },
  { icon: Wrench, label: { ar: 'دعم بعد التسليم', fr: 'Support après livraison', en: 'Post-delivery support' } },
];

export function WebStudioPage() {
  const { t, language } = useLanguage();
  const [settings] = useState(() => getSiteSettings());
  const [selectedTier, setSelectedTier] = useState<Tier['id']>('boutique');
  const [selectedExtras, setSelectedExtras] = useState<Extra['id'][]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const tier = tiers.find((item) => item.id === selectedTier) ?? tiers[1];
  const phone = settings.contact.phoneInternational;
  const phoneDisplay = settings.contact.phoneDisplay;

  const activeExtras = useMemo(
    () => extras.filter((extra) => selectedExtras.includes(extra.id) && !(tier.id === 'pro' && extra.includedInPro)),
    [selectedExtras, tier.id],
  );

  const total = tier.price + activeExtras.reduce((sum, extra) => sum + extra.price, 0);

  const fmt = (value: number) => value.toLocaleString('en-US').replace(/,/g, ' ');
  const currency = t({ ar: 'دج', fr: 'DZD', en: 'DZD' });

  const waLink = (message: string) => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  const quoteMessage =
    language === 'ar'
      ? `السلام عليكم، أريد عرض سعر.\n\nالباقة: ${t(tier.name)} (${fmt(tier.price)} دج)\n${activeExtras.length ? `الخيارات: ${activeExtras.map((e) => t(e.label)).join('، ')}\n` : ''}المجموع التقديري: ${fmt(total)} دج\n\nالاسم: \nالنشاط: \nالمدينة: `
      : language === 'fr'
        ? `Bonjour, je souhaite un devis.\n\nFormule : ${t(tier.name)} (${fmt(tier.price)} DZD)\n${activeExtras.length ? `Options : ${activeExtras.map((e) => t(e.label)).join(', ')}\n` : ''}Total estimé : ${fmt(total)} DZD\n\nNom : \nActivité : \nVille : `
        : `Hello, I'd like a quote.\n\nPackage: ${t(tier.name)} (${fmt(tier.price)} DZD)\n${activeExtras.length ? `Extras: ${activeExtras.map((e) => t(e.label)).join(', ')}\n` : ''}Estimated total: ${fmt(total)} DZD\n\nName: \nBusiness: \nCity: `;

  const toggleExtra = (id: Extra['id']) => {
    setSelectedExtras((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-20%] right-[-10%] w-[45%] h-[55%] rounded-full bg-primary/10 blur-[110px]" />
          <div className="absolute bottom-[-25%] left-[-10%] w-[45%] h-[55%] rounded-full bg-sky-400/10 blur-[110px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs sm:text-sm font-bold px-4 py-2 rounded-full mb-5">
                <Sparkles className="w-4 h-4" />
                {t({ ar: 'إنشاء المواقع والمتاجر · جيجل وكل الجزائر', fr: 'Création de sites & boutiques · Jijel et toute l’Algérie', en: 'Websites & stores · Jijel and all Algeria' })}
              </span>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-[1.15] mb-5">
                {t({ ar: 'موقع إلكتروني يحوّل الزوار إلى عملاء', fr: 'Un site web qui transforme les visiteurs en clients', en: 'A website that turns visitors into customers' })}
              </h1>

              <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-7 max-w-xl">
                {t({
                  ar: 'نصمم ونبرمج مواقع ومتاجر إلكترونية للمحلات والشركات الجزائرية: سريعة، بالعربية والفرنسية، وبلوحة تحكم تتيح لك إدارة كل شيء بنفسك — دون مطوّر.',
                  fr: 'Je conçois et développe des sites et boutiques en ligne pour les commerces et entreprises algériennes : rapides, en arabe et français, avec un tableau de bord que vous gérez vous-même — sans développeur.',
                  en: 'I design and build websites and online stores for Algerian businesses: fast, in Arabic and French, with a dashboard you manage yourself — no developer needed.',
                })}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <a
                  href={waLink(t({
                    ar: 'السلام عليكم، اطّلعت على صفحة إنشاء المواقع. أريد معرفة المزيد والحصول على عرض سعر.',
                    fr: 'Bonjour, j’ai vu votre page de création de sites. Je voudrais plus d’informations et un devis.',
                    en: 'Hello, I saw your web design page. I’d like more information and a quote.',
                  }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t({ ar: 'تواصل عبر WhatsApp', fr: 'Discuter sur WhatsApp', en: 'Chat on WhatsApp' })}
                </a>
                <button
                  onClick={() => scrollTo('pricing')}
                  className="inline-flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border border-border px-6 py-3.5 rounded-xl text-sm sm:text-base font-bold hover:border-primary/40 hover:text-primary transition-all"
                >
                  {t({ ar: 'اطّلع على الأسعار', fr: 'Voir les tarifs', en: 'See pricing' })}
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-3">
                {trustPoints.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground">
                    <point.icon className="w-4 h-4 text-primary" />
                    {t(point.label)}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview mockup */}
            <div className="relative">
              <div className="rounded-2xl border border-border bg-white dark:bg-slate-800 shadow-2xl shadow-black/10 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-slate-50 dark:bg-slate-900/50">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <div className="ms-3 flex-1 rounded-md bg-white dark:bg-slate-800 border border-border px-3 py-1 text-[10px] sm:text-xs text-muted-foreground truncate">
                    aostech.vercel.app
                  </div>
                </div>
                <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white text-[10px] font-black">AOS</div>
                      <span className="text-[10px] sm:text-xs font-bold">AYOUB OFFICE SERVICES</span>
                    </div>
                    <div className="hidden sm:flex gap-2">
                      {['Accueil', 'Produits', 'Contact'].map((item) => (
                        <span key={item} className="text-[9px] text-muted-foreground">{item}</span>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="rounded-xl bg-white dark:bg-slate-800 border border-border p-2">
                        <div className={`h-12 sm:h-16 rounded-lg mb-2 bg-gradient-to-br ${i === 0 ? 'from-blue-200 to-blue-400' : i === 1 ? 'from-emerald-200 to-emerald-400' : 'from-amber-200 to-amber-400'}`} />
                        <div className="h-1.5 w-3/4 rounded bg-muted mb-1" />
                        <div className="h-1.5 w-1/2 rounded bg-muted" />
                        <div className="mt-2 h-4 rounded-md bg-primary/10" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl bg-white dark:bg-slate-800 border border-border p-3 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="h-1.5 w-20 rounded bg-muted" />
                      <div className="h-1.5 w-14 rounded bg-muted" />
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                      {t({ ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison', en: 'Cash on delivery' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -start-3 sm:-start-6 bg-white dark:bg-slate-800 border border-border rounded-xl shadow-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground leading-none mb-1">{t({ ar: 'موقع مباشر', fr: 'Site en ligne', en: 'Live site' })}</p>
                    <p className="text-xs font-bold leading-none">aostech.vercel.app</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why a website */}
      <section className="py-14 md:py-20 bg-slate-50 dark:bg-slate-900/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">
              {t({ ar: '«لدي صفحة Facebook، لماذا أحتاج موقعاً؟»', fr: '« J’ai une page Facebook, pourquoi un site ? »', en: '“I have a Facebook page, why a website?”' })}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t({ ar: 'فيسبوك يجلب الانتباه، والموقع يجلب الطلبات.', fr: 'Facebook attire l’attention. Le site génère les commandes.', en: 'Facebook gets attention. A website gets orders.' })}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[
              {
                icon: Search,
                title: { ar: 'ظهور في Google', fr: 'Visible sur Google', en: 'Found on Google' },
                text: { ar: 'عملاؤك يبحثون عن «مستلزمات إعلام آلي + مدينتك». الموقع يضعك أمام المنافسين.', fr: 'Vos clients cherchent « informatique + votre ville ». Le site vous place devant la concurrence.', en: 'Customers search “computer shop + your city”. A site puts you ahead.' },
              },
              {
                icon: ShieldCheck,
                title: { ar: 'الثقة', fr: 'La confiance', en: 'Trust' },
                text: { ar: 'الموقع الاحترافي يطمئن العميل أكثر من صفحة فيها ثلاث صور. الثقة تعني طلبات أكثر.', fr: 'Un site pro rassure plus qu’une page avec 3 photos. Confiance = plus de commandes.', en: 'A professional site reassures more than a page with 3 photos.' },
              },
              {
                icon: Clock,
                title: { ar: 'يعمل 24/24', fr: 'Ouvert 24h/24', en: 'Open 24/7' },
                text: { ar: 'الطلبات تصل حتى أثناء نومك، دون الرد على كل رسالة يدوياً.', fr: 'Les commandes arrivent même la nuit, sans répondre à chaque message.', en: 'Orders arrive even at night, without answering every message.' },
              },
              {
                icon: LayoutDashboard,
                title: { ar: 'أنت المالك', fr: 'Vous êtes propriétaire', en: 'You own it' },
                text: { ar: 'Facebook قد يوقف الحساب. الموقع واسم النطاق ملكك، ولا يمكن لأحد إيقافهما.', fr: 'Facebook peut suspendre un compte. Le site et le domaine vous appartiennent.', en: 'Facebook can suspend an account. Your site and domain are yours.' },
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl border border-border p-5 md:p-6">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{t(item.title)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(item.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-14 md:py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-4">
              {t({ ar: 'الأسعار', fr: 'Tarifs', en: 'Pricing' })}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">
              {t({ ar: 'أسعار واضحة، بلا مفاجآت', fr: 'Des prix clairs, sans surprise', en: 'Clear pricing, no surprises' })}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t({ ar: 'اختر الباقة المناسبة، أضف الخيارات، وسيُحسب المجموع مباشرة.', fr: 'Choisissez une formule, ajoutez les options, le total se calcule instantanément.', en: 'Pick a package, add options, see the total instantly.' })}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-5 mb-8">
            {tiers.map((item) => {
              const active = item.id === selectedTier;
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTier(item.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedTier(item.id);
                    }
                  }}
                  aria-pressed={active}
                  className={`text-start rounded-2xl border-2 p-5 md:p-6 transition-all relative cursor-pointer ${active ? 'border-primary bg-primary/[0.04] shadow-lg shadow-primary/10' : 'border-border bg-white dark:bg-slate-800 hover:border-primary/40'}`}
                >
                  {item.popular && (
                    <span className="absolute -top-3 end-4 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full">
                      {t({ ar: 'الأكثر طلباً', fr: 'Le plus demandé', en: 'Most popular' })}
                    </span>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black text-lg">{t(item.name)}</h3>
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${active ? 'border-primary bg-primary' : 'border-border'}`}>
                      {active && <Check className="w-3 h-3 text-white" />}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 min-h-[32px]">{t(item.tagline)}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-3xl font-black">{fmt(item.price)}</span>
                    <span className="text-sm font-bold text-muted-foreground">{currency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t({ ar: 'التسليم:', fr: 'Délai :', en: 'Delivery:' })} <span className="font-semibold">{t(item.delay)}</span>
                  </p>
                  <ul className="space-y-2">
                    {item.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-muted-foreground leading-snug">{t(feature)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          {/* Extras + total */}
          <div className="grid lg:grid-cols-5 gap-5">
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-2xl border border-border p-5 md:p-6">
              <h3 className="font-bold mb-1">{t({ ar: 'خيارات إضافية', fr: 'Options', en: 'Add-ons' })}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {t({ ar: 'الخيارات المشمولة في الباقة المتكاملة لا تُحتسب مرتين.', fr: 'Les options déjà incluses dans Pro ne sont pas facturées deux fois.', en: 'Options already included in Pro are not charged twice.' })}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {extras.map((extra) => {
                  const included = tier.id === 'pro' && extra.includedInPro;
                  const checked = selectedExtras.includes(extra.id) || included;
                  return (
                    <button
                      key={extra.id}
                      onClick={() => !included && toggleExtra(extra.id)}
                      disabled={included}
                      aria-pressed={checked}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-start transition-all ${included ? 'border-emerald-500/30 bg-emerald-500/5 cursor-default' : checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}
                    >
                      <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${checked ? 'bg-primary border-primary' : 'border-border'}`}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <extra.icon className="w-4 h-4 text-primary shrink-0" />
                      <span className="flex-1 text-xs sm:text-sm font-medium leading-snug">{t(extra.label)}</span>
                      <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
                        {included ? t({ ar: 'مشمول', fr: 'inclus', en: 'included' }) : `+${fmt(extra.price)}`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl border-2 border-primary bg-primary text-white p-5 md:p-6 flex flex-col">
              <p className="text-xs font-semibold text-white/70 mb-1">{t({ ar: 'تقديرك', fr: 'Votre estimation', en: 'Your estimate' })}</p>
              <p className="text-sm font-bold mb-4">{t(tier.name)}</p>

              <div className="space-y-2 mb-4 text-xs sm:text-sm">
                <div className="flex items-center justify-between text-white/80">
                  <span>{t({ ar: 'الباقة', fr: 'Formule', en: 'Package' })}</span>
                  <span className="font-bold">{fmt(tier.price)} {currency}</span>
                </div>
                {activeExtras.map((extra) => (
                  <div key={extra.id} className="flex items-center justify-between text-white/80">
                    <span className="truncate pe-3">{t(extra.label)}</span>
                    <span className="font-bold whitespace-nowrap">+{fmt(extra.price)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/20 pt-4 mb-5">
                <div className="flex items-end justify-between">
                  <span className="text-xs text-white/70">{t({ ar: 'المجموع', fr: 'Total', en: 'Total' })}</span>
                  <span className="text-3xl font-black leading-none">
                    {fmt(total)} <span className="text-sm">{currency}</span>
                  </span>
                </div>
              </div>

              <a
                href={waLink(quoteMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex items-center justify-center gap-2 bg-white text-primary px-5 py-3 rounded-xl font-bold text-sm hover:bg-white/90 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                {t({ ar: 'اطلب هذا العرض', fr: 'Demander ce devis', en: 'Request this quote' })}
              </a>
              <p className="text-[10px] text-white/60 mt-3 leading-relaxed">
                {t({ ar: 'الأسعار تقديرية. العرض النهائي يُحدَّد بعد التشاور وحسب المحتوى المطلوب.', fr: 'Prix indicatifs. Le devis final est établi après échange et selon le contenu.', en: 'Indicative prices. Final quote after discussion and content review.' })}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-14 md:py-20 bg-slate-50 dark:bg-slate-900/40 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-3">
              {t({ ar: 'كيف نعمل', fr: 'Comment ça se passe', en: 'How it works' })}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t({ ar: '4 خطوات واضحة، من أول رسالة إلى الموقع المباشر.', fr: '4 étapes claires, du premier message à la mise en ligne.', en: '4 clear steps, from first message to launch.' })}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {[
              { n: '01', icon: MessageCircle, title: { ar: 'تشاور', fr: 'Échange', en: 'Discussion' }, text: { ar: 'مكالمة 30 دقيقة: النشاط، الهدف، والمحتوى المتوفر.', fr: '30 min : activité, objectif et contenu disponible.', en: '30 min: business, goal, existing content.' } },
              { n: '02', icon: CreditCard, title: { ar: 'عرض سعر + 50%', fr: 'Devis + 50 %', en: 'Quote + 50%' }, text: { ar: 'عرض مكتوب، وبعد الموافقة 50% مقدماً للانطلاق.', fr: 'Devis écrit, puis 50 % à la commande.', en: 'Written quote, then 50% to start.' } },
              { n: '03', icon: LayoutDashboard, title: { ar: 'تصميم + برمجة', fr: 'Design + dev', en: 'Design + build' }, text: { ar: 'تتابع التقدم كل 2–3 أيام وتقدّم ملاحظاتك.', fr: 'Vous suivez l’avancement tous les 2–3 jours.', en: 'You follow progress every 2–3 days.' } },
              { n: '04', icon: Sparkles, title: { ar: 'تسليم + تكوين', fr: 'Livraison + formation', en: 'Launch + training' }, text: { ar: 'نشر الموقع، تكوين لمدة ساعة، و50% المتبقية.', fr: 'Mise en ligne, formation 1h, solde de 50 %.', en: 'Go live, 1h training, remaining 50%.' } },
            ].map((step, idx) => (
              <div key={idx} className="relative bg-white dark:bg-slate-800 rounded-2xl border border-border p-5 md:p-6">
                <span className="absolute top-4 end-4 text-3xl font-black text-primary/10">{step.n}</span>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold mb-2">{t(step.title)}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(step.text)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof */}
      <section className="py-14 md:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-border bg-white dark:bg-slate-800 overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-6 md:p-8">
                <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full mb-4">
                  <Check className="w-3.5 h-3.5" />
                  {t({ ar: 'عمل حقيقي', fr: 'Réalisation', en: 'Real work' })}
                </span>
                <h3 className="text-xl md:text-2xl font-black mb-3">
                  {t({ ar: 'المتجر الذي تتصفحه الآن', fr: 'La boutique que vous consultez', en: 'The store you are browsing' })}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                  {t({
                    ar: 'هذا الموقع نفسه مبني بالتقنيات التي أستخدمها: React، قاعدة بيانات، لوحة تحكم، تتبع الطلبات، فواتير PDF، وتعدد اللغات. ليس نموذجاً — بل موقع يعمل بطلبات حقيقية.',
                    fr: 'Ce site est construit avec exactement les mêmes technologies : React, base de données, tableau de bord, suivi de commandes, factures PDF et multilingue. Pas une maquette — un site en production.',
                    en: 'This site uses exactly the same stack: React, database, dashboard, order tracking, PDF invoices and multilingual. Not a mockup — a live site.',
                  })}
                </p>
                <a href="#products" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:gap-3 transition-all">
                  {t({ ar: 'تصفح المتجر', fr: 'Voir la boutique', en: 'View the store' })}
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </a>
              </div>
              <div className="bg-gradient-to-br from-primary/10 via-sky-500/10 to-emerald-500/10 p-6 md:p-8 flex items-center">
                <div className="grid grid-cols-2 gap-3 w-full">
                  {[
                    { icon: ShoppingBag, label: { ar: 'الطلبات + السلة', fr: 'Commandes + panier', en: 'Orders + cart' } },
                    { icon: LayoutDashboard, label: { ar: 'لوحة التحكم', fr: 'Tableau de bord', en: 'Dashboard' } },
                    { icon: Truck, label: { ar: 'توصيل Yalidine', fr: 'Livraison Yalidine', en: 'Yalidine delivery' } },
                    { icon: Languages, label: { ar: '3 لغات', fr: '3 langues', en: '3 languages' } },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white/70 dark:bg-slate-900/40 backdrop-blur rounded-xl border border-white/40 dark:border-white/10 p-3">
                      <item.icon className="w-4 h-4 text-primary mb-2" />
                      <p className="text-[11px] font-bold leading-tight">{t(item.label)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="pb-14 md:pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-8">
            {t({ ar: 'أسئلة يتكرر طرحها', fr: 'Questions fréquentes', en: 'Frequently asked questions' })}
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const open = openFaq === idx;
              return (
                <div key={idx} className="rounded-2xl border border-border bg-white dark:bg-slate-800 overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(open ? null : idx)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-3 p-4 md:p-5 text-start font-bold text-sm md:text-base hover:bg-primary/5 transition-colors"
                  >
                    {t(faq.q)}
                    <ChevronDown className={`w-5 h-5 text-primary shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm text-muted-foreground leading-relaxed">
                      {t(faq.a)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-7 md:p-12 text-center">
            <div className="absolute -top-24 -start-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 -end-24 w-72 h-72 rounded-full bg-sky-500/20 blur-3xl" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3">
                {t({ ar: 'لديك محل؟ لنمنحه موقعاً هذا الشهر', fr: 'Vous avez un commerce ? Donnons-lui un site ce mois-ci', en: 'Got a business? Let’s get it online this month' })}
              </h2>
              <p className="text-blue-100/70 max-w-xl mx-auto mb-7 text-sm sm:text-base">
                {t({ ar: 'تشاور مجاني + تحليل مجاني لظهورك على Google، دون أي التزام.', fr: 'Audit gratuit de votre présence Google, sans engagement.', en: 'Free audit of your Google presence, no strings attached.' })}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={waLink(t({
                    ar: 'السلام عليكم، أريد الاستفادة من التشاور المجاني لموقع المحل.',
                    fr: 'Bonjour, je souhaite bénéficier de l’audit gratuit pour le site de mon commerce.',
                    en: 'Hello, I’d like the free audit for my business website.',
                  }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-white text-slate-900 px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-white/90 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t({ ar: 'احجز التشاور المجاني', fr: 'Réserver l’audit gratuit', en: 'Book the free audit' })}
                </a>
                <a
                  href={`tel:${settings.contact.phone}`}
                  className="inline-flex items-center gap-2 border border-white/20 text-white px-6 py-3.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-all"
                  dir="ltr"
                >
                  <Phone className="w-4 h-4" />
                  {phoneDisplay}
                </a>
              </div>
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-blue-200/50">
                <MapPin className="w-3.5 h-3.5" />
                {t(settings.contact.address)}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

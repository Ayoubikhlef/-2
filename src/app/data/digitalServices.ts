export interface LangText {
  ar: string;
  fr: string;
  en: string;
}

export type DigitalServiceIcon =
  | 'store'
  | 'social'
  | 'hosting'
  | 'pos'
  | 'network'
  | 'training';

export interface DigitalService {
  id: string;
  /** Value stored in the service-booking order when the customer asks for a quote. */
  bookingValue: string;
  icon: DigitalServiceIcon;
  title: LangText;
  tagline: LangText;
  description: LangText;
  startingPrice: number;
  priceUnit: LangText;
  features: LangText[];
  delivery: LangText;
  gradient: string;
  badge?: LangText;
}

export interface DigitalPackage {
  id: string;
  name: LangText;
  price: number;
  period: LangText;
  tagline: LangText;
  features: LangText[];
  cta: LangText;
  bookingValue: string;
  featured?: boolean;
  gradient: string;
}

export interface DigitalGuarantee {
  id: string;
  icon: 'shield' | 'clock' | 'wallet' | 'key' | 'headset' | 'file';
  title: LangText;
  description: LangText;
}

export interface DigitalStep {
  id: string;
  title: LangText;
  description: LangText;
}

export interface DigitalFaq {
  id: string;
  question: LangText;
  answer: LangText;
}

export interface QuoteOption {
  value: string;
  label: LangText;
}

export const DIGITAL_SERVICES: DigitalService[] = [
  {
    id: 'ecommerce',
    bookingValue: 'digital-store',
    icon: 'store',
    title: { ar: 'المتاجر الإلكترونية', fr: 'Boutiques en ligne', en: 'Online stores' },
    tagline: {
      ar: 'متجرك يبيع لك 24 ساعة طوال الأسبوع',
      fr: 'Votre boutique vend pour vous 24h/24',
      en: 'Your store sells for you around the clock',
    },
    description: {
      ar: 'متجر احترافي سريع ومتوافق مع الهاتف، مع سلة شراء، دفع عند الاستلام، ولوحة إدارة للطلبات والمنتجات وأسعار التوصيل حسب الولاية.',
      fr: 'Une boutique rapide et mobile : panier, paiement à la livraison, gestion des produits et frais de livraison par wilaya.',
      en: 'A fast mobile-first store with cart, cash-on-delivery checkout, and a dashboard for products, orders and per-wilaya delivery fees.',
    },
    startingPrice: 35000,
    priceUnit: { ar: 'للمشروع', fr: 'par projet', en: 'per project' },
    features: [
      { ar: 'تصميم متوافق مع الجوال وسريع التحميل', fr: 'Design mobile et chargement rapide', en: 'Mobile-first design and fast loading' },
      { ar: 'سلة شراء وطلب مع الدفع عند الاستلام', fr: 'Panier et commande avec paiement à la livraison', en: 'Cart and cash-on-delivery checkout' },
      { ar: 'لوحة إدارة المنتجات والطلبات والمخزون', fr: 'Gestion des produits, commandes et stock', en: 'Products, orders and stock dashboard' },
      { ar: 'ربط واتساب وتتبع الطلبات للعميل', fr: 'WhatsApp et suivi de commande client', en: 'WhatsApp integration and customer order tracking' },
    ],
    delivery: { ar: '5 – 14 يوم عمل', fr: '5 à 14 jours ouvrés', en: '5 – 14 working days' },
    gradient: 'from-blue-500 to-cyan-500',
    badge: { ar: 'الأكثر طلباً', fr: 'Le plus demandé', en: 'Most requested' },
  },
  {
    id: 'social',
    bookingValue: 'digital-social',
    icon: 'social',
    title: { ar: 'إدارة السوشيال ميديا والإعلانات', fr: 'Réseaux sociaux et publicité', en: 'Social media and ads' },
    tagline: {
      ar: 'حضور يومي يبني الثقة ويجلب الطلبات',
      fr: 'Une présence quotidienne qui inspire confiance et génère des commandes',
      en: 'A daily presence that builds trust and brings orders',
    },
    description: {
      ar: 'محتوى وتصميم ونشر وإدارة حملات ممولة على فيسبوك وإنستغرام، مع تقارير شهرية واضحة وقرارات مبنية على الأرقام.',
      fr: 'Contenu, design, publication et campagnes sponsorisées sur Facebook et Instagram, avec des rapports mensuels clairs.',
      en: 'Content, design, publishing and paid campaigns on Facebook and Instagram, with clear monthly reports.',
    },
    startingPrice: 15000,
    priceUnit: { ar: 'شهرياً', fr: 'par mois', en: 'per month' },
    features: [
      { ar: '12 منشوراً و4 ريلز شهرياً', fr: '12 publications et 4 reels par mois', en: '12 posts and 4 reels per month' },
      { ar: 'إدارة حملات موجّهة حسب الولاية والاهتمام', fr: 'Campagnes ciblées par wilaya et centres d’intérêt', en: 'Campaigns targeted by wilaya and interests' },
      { ar: 'تقارير شهرية بالنتائج والتوصيات', fr: 'Rapports mensuels avec résultats et recommandations', en: 'Monthly reports with results and recommendations' },
      { ar: 'نصوص وردود جاهزة لخدمة العملاء', fr: 'Textes et réponses prêts pour le service client', en: 'Ready-to-use customer service scripts' },
    ],
    delivery: { ar: 'انطلاقة خلال 72 ساعة', fr: 'Démarrage sous 72 heures', en: 'Kick-off within 72 hours' },
    gradient: 'from-fuchsia-500 to-rose-500',
    badge: { ar: 'نتائج ملموسة', fr: 'Résultats concrets', en: 'Real results' },
  },
  {
    id: 'hosting',
    bookingValue: 'digital-hosting',
    icon: 'hosting',
    title: { ar: 'الاستضافة والنطاق والبريد والنسخ الاحتياطي', fr: 'Hébergement, domaine, e-mail et sauvegardes', en: 'Hosting, domain, email and backups' },
    tagline: {
      ar: 'بنية تقنية مستقرة وسريعة وآمنة',
      fr: 'Une infrastructure stable, rapide et sécurisée',
      en: 'A stable, fast and secure infrastructure',
    },
    description: {
      ar: 'نطاق باسمك، استضافة سريعة، بريد احترافي، شهادة SSL، ونسخ احتياطي تلقائي مع مراقبة مستمرة ليبقى موقعك دائماً متاحاً.',
      fr: 'Domaine à votre nom, hébergement rapide, e-mail professionnel, SSL et sauvegardes automatiques avec supervision continue.',
      en: 'Domain in your name, fast hosting, professional email, SSL and automatic backups with continuous monitoring.',
    },
    startingPrice: 6000,
    priceUnit: { ar: 'سنوياً', fr: 'par an', en: 'per year' },
    features: [
      { ar: 'نطاق .com أو .dz مسجّل باسمك', fr: 'Domaine .com ou .dz enregistré à votre nom', en: 'A .com or .dz domain registered in your name' },
      { ar: 'استضافة سريعة وشهادة SSL مجانية', fr: 'Hébergement rapide et SSL gratuit', en: 'Fast hosting and free SSL' },
      { ar: 'بريد احترافي باسم موقعك', fr: 'E-mail professionnel avec votre domaine', en: 'Professional email on your domain' },
      { ar: 'نسخ احتياطي تلقائي ومراقبة الجاهزية', fr: 'Sauvegardes automatiques et supervision', en: 'Automatic backups and uptime monitoring' },
    ],
    delivery: { ar: 'تشغيل خلال 24 – 48 ساعة', fr: 'Mise en service sous 24 – 48 h', en: 'Live within 24 – 48 hours' },
    gradient: 'from-sky-500 to-indigo-500',
  },
  {
    id: 'pos',
    bookingValue: 'digital-pos',
    icon: 'pos',
    title: { ar: 'أنظمة نقاط البيع والمحاسبة', fr: 'Caisses et logiciels de comptabilité', en: 'POS and accounting systems' },
    tagline: {
      ar: 'سيطر على مخزونك ومبيعاتك من شاشة واحدة',
      fr: 'Maîtrisez votre stock et vos ventes depuis un seul écran',
      en: 'Control your stock and sales from one screen',
    },
    description: {
      ar: 'نظام بيع ومحاسبة يناسب المحل أو الشركة: فواتير، مخزون، عملاء، تقارير أرباح، وتدريب فريقك على الاستخدام.',
      fr: 'Un système de caisse et comptabilité adapté à votre commerce : factures, stock, clients, rapports et formation de votre équipe.',
      en: 'A POS and accounting system for your shop or company: invoices, stock, customers, profit reports and team training.',
    },
    startingPrice: 45000,
    priceUnit: { ar: 'للمشروع', fr: 'par projet', en: 'per project' },
    features: [
      { ar: 'فواتير ووصولات احترافية', fr: 'Factures et reçus professionnels', en: 'Professional invoices and receipts' },
      { ar: 'إدارة المخزون والتنبيه على النفاد', fr: 'Gestion du stock et alertes de rupture', en: 'Stock management and low-stock alerts' },
      { ar: 'تقارير يومية وشهرية للأرباح', fr: 'Rapports journaliers et mensuels', en: 'Daily and monthly profit reports' },
      { ar: 'تركيب وتكوين وتدريب الفريق', fr: 'Installation, configuration et formation', en: 'Installation, setup and team training' },
    ],
    delivery: { ar: '7 – 21 يوم عمل', fr: '7 à 21 jours ouvrés', en: '7 – 21 working days' },
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'network',
    bookingValue: 'digital-network',
    icon: 'network',
    title: { ar: 'الشبكات وكاميرات المراقبة', fr: 'Réseaux et caméras de surveillance', en: 'Networks and CCTV' },
    tagline: {
      ar: 'اتصال مستقر وحماية على مدار الساعة',
      fr: 'Une connexion stable et une protection 24h/24',
      en: 'Stable connectivity and round-the-clock protection',
    },
    description: {
      ar: 'تجهيز شبكات سلكية ولاسلكية، تركيب كاميرات بدقة عالية، إعداد المشاهدة عن بعد من الهاتف، وصيانة دورية.',
      fr: 'Réseaux filaires et Wi-Fi, caméras haute définition, visionnage à distance sur mobile et maintenance régulière.',
      en: 'Wired and Wi-Fi networks, HD cameras, remote viewing from your phone, and regular maintenance.',
    },
    startingPrice: 12000,
    priceUnit: { ar: 'للمشروع', fr: 'par projet', en: 'per project' },
    features: [
      { ar: 'دراسة الموقع وتخطيط نقاط الشبكة', fr: 'Étude du site et planification des points réseau', en: 'Site survey and network point planning' },
      { ar: 'كاميرات عالية الدقة ورؤية ليلية', fr: 'Caméras haute définition avec vision nocturne', en: 'HD cameras with night vision' },
      { ar: 'مشاهدة مباشرة من الهاتف عن بعد', fr: 'Visionnage en direct à distance sur mobile', en: 'Live remote viewing from your phone' },
      { ar: 'تمديد وتنظيم وتجهيز احترافي', fr: 'Câblage, organisation et installation soignés', en: 'Neat cabling, organisation and installation' },
    ],
    delivery: { ar: 'حسب حجم المشروع — معاينة مجانية', fr: 'Selon le projet — visite gratuite', en: 'Depends on scope — free site visit' },
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'training',
    bookingValue: 'digital-training',
    icon: 'training',
    title: { ar: 'التكوين: Excel وCanva والذكاء الاصطناعي', fr: 'Formation : Excel, Canva et IA', en: 'Training: Excel, Canva and AI' },
    tagline: {
      ar: 'تعلّم المهارات التي توفّر وقتك وتزيد دخلك',
      fr: 'Apprenez les compétences qui vous font gagner du temps et de l’argent',
      en: 'Learn the skills that save time and increase your income',
    },
    description: {
      ar: 'تكوين عملي فردي أو جماعي في Excel وCanva وأدوات الذكاء الاصطناعي، بتمارين مباشرة على ملفاتك ومشاريعك الحقيقية.',
      fr: 'Formation pratique individuelle ou en groupe sur Excel, Canva et les outils IA, avec des exercices sur vos vrais fichiers.',
      en: 'Hands-on one-to-one or group training in Excel, Canva and AI tools, using your real files and projects.',
    },
    startingPrice: 4000,
    priceUnit: { ar: 'للجلسة', fr: 'par séance', en: 'per session' },
    features: [
      { ar: 'جلسات فردية أو جماعية حسب مستواك', fr: 'Séances individuelles ou en groupe adaptées à votre niveau', en: 'One-to-one or group sessions at your level' },
      { ar: 'تمارين تطبيقية على ملفاتك ومشاريعك', fr: 'Exercices sur vos propres fichiers et projets', en: 'Exercises on your own files and projects' },
      { ar: 'دليل عملي وملفات قابلة للاستعمال', fr: 'Guide pratique et fichiers réutilisables', en: 'Practical guide and reusable files' },
      { ar: 'متابعة أسئلتك لمدة 30 يوماً', fr: 'Suivi de vos questions pendant 30 jours', en: 'Follow-up on your questions for 30 days' },
    ],
    delivery: { ar: 'مواعيد مرنة — حضور أو عن بعد', fr: 'Horaires flexibles — sur place ou à distance', en: 'Flexible times — on-site or remote' },
    gradient: 'from-violet-500 to-purple-600',
  },
];

export const DIGITAL_PACKAGES: DigitalPackage[] = [
  {
    id: 'start',
    name: { ar: 'باقة البداية', fr: 'Pack Démarrage', en: 'Starter pack' },
    price: 35000,
    period: { ar: 'مرة واحدة', fr: 'une fois', en: 'one-time' },
    tagline: {
      ar: 'موقع تعريفي احترافي يبني ثقة عملائك من أول زيارة.',
      fr: 'Un site vitrine professionnel qui inspire confiance dès la première visite.',
      en: 'A professional presentation website that builds trust from the first visit.',
    },
    features: [
      { ar: 'موقع من 5 صفحات متجاوبة', fr: 'Site de 5 pages responsives', en: '5-page responsive website' },
      { ar: 'نطاق .com مجاناً لسنة + استضافة سنة', fr: 'Domaine .com offert 1 an + hébergement 1 an', en: 'Free .com domain for 1 year + 1 year hosting' },
      { ar: 'شهادة SSL وزر واتساب مباشر', fr: 'SSL et bouton WhatsApp direct', en: 'SSL and direct WhatsApp button' },
      { ar: 'نموذج تواصل وخريطة الوصول', fr: 'Formulaire de contact et carte', en: 'Contact form and location map' },
      { ar: 'تحسين أساسي لمحركات البحث', fr: 'Optimisation SEO de base', en: 'Basic SEO optimisation' },
      { ar: 'تسليم 5 – 7 أيام + جلسة تكوين', fr: 'Livraison 5 – 7 jours + session de formation', en: 'Delivery in 5 – 7 days + training session' },
    ],
    cta: { ar: 'ابدأ بهذه الباقة', fr: 'Choisir ce pack', en: 'Choose this pack' },
    bookingValue: 'digital-website',
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    id: 'store',
    name: { ar: 'باقة المتجر', fr: 'Pack Boutique', en: 'Store pack' },
    price: 85000,
    period: { ar: 'مرة واحدة', fr: 'une fois', en: 'one-time' },
    tagline: {
      ar: 'متجر إلكتروني كامل يستقبل الطلبات ويحصّل المبيعات نيابة عنك.',
      fr: 'Une boutique complète qui reçoit les commandes et génère des ventes pour vous.',
      en: 'A complete online store that takes orders and generates sales for you.',
    },
    features: [
      { ar: 'كل ما في باقة البداية', fr: 'Tout le pack Démarrage', en: 'Everything in the Starter pack' },
      { ar: 'متجر حتى 50 منتجاً مع تصنيفات', fr: 'Boutique jusqu’à 50 produits avec catégories', en: 'Store with up to 50 products and categories' },
      { ar: 'سلة شراء وطلب بالدفع عند الاستلام', fr: 'Panier et commande en paiement à la livraison', en: 'Cart and cash-on-delivery checkout' },
      { ar: 'أسعار توصيل حسب الولاية', fr: 'Frais de livraison par wilaya', en: 'Per-wilaya delivery fees' },
      { ar: 'لوحة إدارة الطلبات والمخزون', fr: 'Gestion des commandes et du stock', en: 'Orders and stock dashboard' },
      { ar: 'تدريب فريقك + دعم 30 يوماً', fr: 'Formation de votre équipe + support 30 jours', en: 'Team training + 30 days support' },
    ],
    cta: { ar: 'أطلق متجري', fr: 'Lancer ma boutique', en: 'Launch my store' },
    bookingValue: 'digital-store',
    featured: true,
    gradient: 'from-blue-600 via-indigo-600 to-violet-600',
  },
  {
    id: 'growth',
    name: { ar: 'باقة النمو', fr: 'Pack Croissance', en: 'Growth pack' },
    price: 25000,
    period: { ar: 'شهرياً', fr: 'par mois', en: 'per month' },
    tagline: {
      ar: 'حضور وإعلانات شهرية تجلب لك عملاء جدد باستمرار.',
      fr: 'Présence et publicité mensuelles pour attirer de nouveaux clients en continu.',
      en: 'Monthly content and ads that keep bringing in new customers.',
    },
    features: [
      { ar: '12 منشوراً + 4 ريلز شهرياً', fr: '12 publications + 4 reels par mois', en: '12 posts + 4 reels per month' },
      { ar: 'إدارة حملة إعلانية ممولة', fr: 'Gestion d’une campagne sponsorisée', en: 'Management of one paid campaign' },
      { ar: 'تصميم منشورات بهوية موحّدة', fr: 'Design avec une identité cohérente', en: 'Consistent branded post design' },
      { ar: 'تقرير شهري بالنتائج', fr: 'Rapport mensuel des résultats', en: 'Monthly results report' },
      { ar: 'ردود واتساب جاهزة لفريقك', fr: 'Réponses WhatsApp prêtes pour votre équipe', en: 'Ready-made WhatsApp replies for your team' },
      { ar: 'بدون التزام طويل — إشعار 15 يوماً', fr: 'Sans engagement long — préavis de 15 jours', en: 'No long commitment — 15 days notice' },
    ],
    cta: { ar: 'انطلق الآن', fr: 'Démarrer maintenant', en: 'Start now' },
    bookingValue: 'digital-social',
    gradient: 'from-rose-500 to-fuchsia-600',
  },
  {
    id: 'protection',
    name: { ar: 'باقة الحماية', fr: 'Pack Protection', en: 'Protection pack' },
    price: 12000,
    period: { ar: 'سنوياً', fr: 'par an', en: 'per year' },
    tagline: {
      ar: 'موقعك يبقى سريعاً وآمناً ومحدّثاً طوال السنة.',
      fr: 'Votre site reste rapide, sécurisé et à jour toute l’année.',
      en: 'Your site stays fast, secure and up to date all year.',
    },
    features: [
      { ar: 'نسخ احتياطي يومي تلقائي', fr: 'Sauvegarde automatique quotidienne', en: 'Automatic daily backups' },
      { ar: 'تحديثات أمنية دورية', fr: 'Mises à jour de sécurité régulières', en: 'Regular security updates' },
      { ar: 'مراقبة الجاهزية 24/7', fr: 'Supervision de la disponibilité 24h/24', en: '24/7 uptime monitoring' },
      { ar: 'استرجاع سريع عند أي عطل', fr: 'Restauration rapide en cas d’incident', en: 'Fast restore after any incident' },
      { ar: 'ساعتان تعديلات شهرياً', fr: '2 heures de modifications par mois', en: '2 hours of edits per month' },
      { ar: 'دعم أولوية عبر واتساب', fr: 'Support prioritaire via WhatsApp', en: 'Priority WhatsApp support' },
    ],
    cta: { ar: 'احمِ موقعي', fr: 'Protéger mon site', en: 'Protect my site' },
    bookingValue: 'digital-maintenance',
    gradient: 'from-emerald-500 to-cyan-600',
  },
];

export const DIGITAL_STEPS: DigitalStep[] = [
  {
    id: 'consult',
    title: { ar: 'استشارة وعرض سعر', fr: 'Consultation et devis', en: 'Consultation and quote' },
    description: {
      ar: 'نتحدث عن نشاطك وأهدافك وميزانيتك، ثم نرسل عرض سعر مكتوباً بنطاق العمل والمدة والسعر خلال 24 ساعة.',
      fr: 'Nous parlons de votre activité, vos objectifs et votre budget, puis nous envoyons un devis écrit sous 24 h.',
      en: 'We discuss your business, goals and budget, then send a written quote within 24 hours.',
    },
  },
  {
    id: 'contract',
    title: { ar: 'العقد والانطلاق', fr: 'Contrat et lancement', en: 'Contract and kick-off' },
    description: {
      ar: 'نوقّع عقداً واضحاً يحمي الطرفين، وندفع 50% عند البدء، ثم ننطلق فوراً في التنفيذ.',
      fr: 'Nous signons un contrat clair, avec 50 % au démarrage, puis nous lançons immédiatement la production.',
      en: 'We sign a clear contract, with 50% at kick-off, then start production immediately.',
    },
  },
  {
    id: 'build',
    title: { ar: 'التنفيذ والمراجعة', fr: 'Production et révisions', en: 'Build and review' },
    description: {
      ar: 'نشاركك نسخة تجريبية في كل مرحلة، ونستمع لملاحظاتك ونعدّل حتى نصل للنتيجة المتفق عليها.',
      fr: 'Nous partageons une version de test à chaque étape et ajustons jusqu’au résultat convenu.',
      en: 'We share a test version at every stage and refine it until we reach the agreed result.',
    },
  },
  {
    id: 'deliver',
    title: { ar: 'التسليم والتكوين والمتابعة', fr: 'Livraison, formation et suivi', en: 'Delivery, training and follow-up' },
    description: {
      ar: 'ننشر المشروع، نسلّمك كل الحسابات باسمك، نكوّن فريقك، ونبقى معك 30 يوماً بعد التسليم.',
      fr: 'Nous mettons en ligne, remettons tous les accès à votre nom, formons votre équipe et restons 30 jours à vos côtés.',
      en: 'We go live, hand over all accounts in your name, train your team, and stay with you for 30 days.',
    },
  },
];

export const DIGITAL_GUARANTEES: DigitalGuarantee[] = [
  {
    id: 'quality',
    icon: 'shield',
    title: { ar: 'ضمان الجودة', fr: 'Qualité garantie', en: 'Quality guaranteed' },
    description: {
      ar: 'لا نسلم المشروع إلا بعد رضاك عن النتيجة ضمن نطاق العمل المتفق عليه.',
      fr: 'Nous ne livrons qu’après votre satisfaction, dans le périmètre convenu.',
      en: 'We only deliver once you are satisfied, within the agreed scope.',
    },
  },
  {
    id: 'deadline',
    icon: 'clock',
    title: { ar: 'مواعيد منضبطة', fr: 'Délais respectés', en: 'On-time delivery' },
    description: {
      ar: 'مدة التنفيذ مكتوبة في العقد، ونبقيك على اطلاع في كل مرحلة من المشروع.',
      fr: 'Le délai est écrit dans le contrat et nous vous informons à chaque étape.',
      en: 'The timeline is written into the contract, and we keep you updated at every stage.',
    },
  },
  {
    id: 'price',
    icon: 'wallet',
    title: { ar: 'سعر ثابت وشفاف', fr: 'Prix fixe et transparent', en: 'Fixed, transparent pricing' },
    description: {
      ar: 'عرض سعر مكتوب قبل البدء، دون مصاريف خفية أو مفاجآت في الفاتورة.',
      fr: 'Un devis écrit avant de commencer, sans frais cachés ni surprises.',
      en: 'A written quote before we start, with no hidden fees or invoice surprises.',
    },
  },
  {
    id: 'ownership',
    icon: 'key',
    title: { ar: 'ملكية كاملة باسمك', fr: 'Propriété à votre nom', en: 'Full ownership in your name' },
    description: {
      ar: 'النطاق والاستضافة والحسابات تُسجّل باسمك، وتبقى ملكك حتى لو توقفت عن العمل معنا.',
      fr: 'Domaine, hébergement et comptes sont enregistrés à votre nom et restent votre propriété.',
      en: 'Domain, hosting and accounts are registered in your name and remain yours.',
    },
  },
  {
    id: 'payment',
    icon: 'file',
    title: { ar: 'دفع مرن على مراحل', fr: 'Paiement échelonné', en: 'Flexible staged payment' },
    description: {
      ar: '50% عند بدء العمل و50% عند التسليم، مع إمكانية تقسيم أكبر للمشاريع الكبيرة.',
      fr: '50 % au démarrage et 50 % à la livraison, avec un échelonnement possible pour les grands projets.',
      en: '50% at kick-off and 50% on delivery, with more stages available for larger projects.',
    },
  },
  {
    id: 'support',
    icon: 'headset',
    title: { ar: 'دعم حقيقي بعد التسليم', fr: 'Vrai support après livraison', en: 'Real post-delivery support' },
    description: {
      ar: '30 يوماً من الدعم المجاني بعد التسليم + تكوين فريقك على استخدام المشروع.',
      fr: '30 jours de support offert après livraison + formation de votre équipe.',
      en: '30 days of free support after delivery + training for your team.',
    },
  },
];

export const DIGITAL_FAQS: DigitalFaq[] = [
  {
    id: 'pricing',
    question: { ar: 'هل الأسعار المعروضة نهائية؟', fr: 'Les prix affichés sont-ils définitifs ?', en: 'Are the displayed prices final?' },
    answer: {
      ar: 'الأسعار المعروضة هي أسعار ابتدائية واضحة. بعد الاستشارة نرسل عرض سعر ثابتاً ومفصلاً حسب حجم مشروعك، ولا نضيف أي مبلغ غير مذكور في العقد.',
      fr: 'Ce sont des prix de départ clairs. Après la consultation, nous envoyons un devis fixe et détaillé selon votre projet, sans frais non prévus au contrat.',
      en: 'They are clear starting prices. After the consultation we send a fixed, detailed quote based on your project, with nothing extra beyond the contract.',
    },
  },
  {
    id: 'timeline',
    question: { ar: 'كم يستغرق تنفيذ المشروع؟', fr: 'Combien de temps prend la réalisation ?', en: 'How long does a project take?' },
    answer: {
      ar: 'باقة البداية من 5 إلى 7 أيام، باقة المتجر من 10 إلى 14 يوماً، والأنظمة والشبكات من 7 إلى 21 يوماً حسب الحجم. المدة النهائية تُكتب في العقد قبل الانطلاق.',
      fr: 'Pack Démarrage : 5 à 7 jours. Pack Boutique : 10 à 14 jours. Systèmes et réseaux : 7 à 21 jours selon l’ampleur. Le délai final est inscrit au contrat.',
      en: 'Starter pack: 5–7 days. Store pack: 10–14 days. Systems and networks: 7–21 days depending on scope. The final timeline is written into the contract.',
    },
  },
  {
    id: 'payment',
    question: { ar: 'هل يمكنني الدفع على مراحل؟', fr: 'Puis-je payer en plusieurs fois ?', en: 'Can I pay in stages?' },
    answer: {
      ar: 'نعم. الطريقة المعتادة هي 50% عند بدء العمل و50% عند التسليم. المشاريع الكبيرة يمكن تقسيمها على ثلاث دفعات مرتبطة بمراحل واضحة.',
      fr: 'Oui : 50 % au démarrage et 50 % à la livraison. Les grands projets peuvent être divisés en trois paiements liés à des étapes claires.',
      en: 'Yes: 50% at kick-off and 50% on delivery. Larger projects can be split into three payments tied to clear milestones.',
    },
  },
  {
    id: 'ownership',
    question: { ar: 'هل النطاق والاستضافة باسمي؟', fr: 'Le domaine et l’hébergement sont-ils à mon nom ?', en: 'Are the domain and hosting in my name?' },
    answer: {
      ar: 'نعم، 100%. نسجّل النطاق والاستضافة والحسابات باسمك، ونسلّمك كل بيانات الدخول بعد التسليم، وتبقى ملكك بشكل كامل.',
      fr: 'Oui, à 100 %. Domaine, hébergement et comptes sont enregistrés à votre nom et tous les accès vous sont remis après livraison.',
      en: 'Yes, 100%. The domain, hosting and accounts are registered in your name, and all credentials are handed over after delivery.',
    },
  },
  {
    id: 'remote',
    question: { ar: 'أنا خارج الميلية، هل يمكننا العمل عن بعد؟', fr: 'Je suis loin d’El Milia, peut-on travailler à distance ?', en: 'I am outside El Milia — can we work remotely?' },
    answer: {
      ar: 'بالتأكيد. نعمل عن بعد مع كل ولايات الوطن عبر واتساب والاجتماعات المرئية. للشبكات والكاميرات نقوم بزيارة ميدانية عند الحاجة.',
      fr: 'Bien sûr. Nous travaillons à distance dans toutes les wilayas via WhatsApp et visioconférence. Pour les réseaux et caméras, une visite sur site est possible.',
      en: 'Absolutely. We work remotely across all wilayas via WhatsApp and video calls. For networks and cameras we can arrange an on-site visit.',
    },
  },
  {
    id: 'after-support',
    question: { ar: 'ماذا يحدث بعد فترة الدعم المجاني؟', fr: 'Que se passe-t-il après le support gratuit ?', en: 'What happens after the free support period?' },
    answer: {
      ar: 'بعد 30 يوماً يمكنك الاشتراك في باقة الحماية بـ12,000 دج سنوياً للحصول على نسخ احتياطي ومراقبة وتحديثات ودعم أولوية، أو الاستمرار دون اشتراك.',
      fr: 'Après 30 jours, vous pouvez souscrire au Pack Protection à 12 000 DZD/an (sauvegardes, supervision, mises à jour et support prioritaire), ou continuer sans abonnement.',
      en: 'After 30 days you can subscribe to the Protection pack for 12,000 DZD/year (backups, monitoring, updates and priority support), or continue without a subscription.',
    },
  },
];

export const DIGITAL_TRUST: { icon: 'clock' | 'wallet' | 'key' | 'headset'; label: LangText }[] = [
  { icon: 'clock', label: { ar: 'عرض سعر خلال 24 ساعة', fr: 'Devis sous 24 heures', en: 'Quote within 24 hours' } },
  { icon: 'wallet', label: { ar: 'دفع 50% عند البدء فقط', fr: '50 % seulement au démarrage', en: 'Only 50% at kick-off' } },
  { icon: 'key', label: { ar: 'ملكية 100% باسمك', fr: 'Propriété 100 % à votre nom', en: '100% ownership in your name' } },
  { icon: 'headset', label: { ar: 'دعم 30 يوماً بعد التسليم', fr: '30 jours de support après livraison', en: '30 days of support after delivery' } },
];

export const QUOTE_BUDGETS: QuoteOption[] = [
  { value: 'undecided', label: { ar: 'غير محدد بعد — أرغب باستشارة', fr: 'Pas encore défini — je veux un conseil', en: 'Not sure yet — I would like advice' } },
  { value: 'lt-30', label: { ar: 'أقل من 30,000 دج', fr: 'Moins de 30 000 DZD', en: 'Under 30,000 DZD' } },
  { value: '30-80', label: { ar: 'من 30,000 إلى 80,000 دج', fr: 'De 30 000 à 80 000 DZD', en: '30,000 to 80,000 DZD' } },
  { value: '80-150', label: { ar: 'من 80,000 إلى 150,000 دج', fr: 'De 80 000 à 150 000 DZD', en: '80,000 to 150,000 DZD' } },
  { value: 'gt-150', label: { ar: 'أكثر من 150,000 دج', fr: 'Plus de 150 000 DZD', en: 'Over 150,000 DZD' } },
];

export const QUOTE_DEADLINES: QuoteOption[] = [
  { value: 'flexible', label: { ar: 'مرن — غير مستعجل', fr: 'Flexible — pas pressé', en: 'Flexible — no rush' } },
  { value: 'month', label: { ar: 'خلال شهر', fr: 'Dans le mois', en: 'Within a month' } },
  { value: 'two-weeks', label: { ar: 'خلال أسبوعين', fr: 'Dans deux semaines', en: 'Within two weeks' } },
  { value: 'week', label: { ar: 'خلال أسبوع — مستعجل', fr: 'Dans la semaine — urgent', en: 'Within a week — urgent' } },
];

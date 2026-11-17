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
  | 'training'
  | 'ai'
  | 'design'
  | 'content'
  | 'photo'
  | 'video'
  | 'voice'
  | 'translation'
  | 'chatbot'
  | 'automation'
  | 'presentation'
  | 'analytics';

export type DigitalServiceCategory = 'ai' | 'web' | 'marketing' | 'systems' | 'training';

export interface DigitalCategory {
  id: DigitalServiceCategory | 'all';
  label: LangText;
}

export const DIGITAL_CATEGORIES: DigitalCategory[] = [
  { id: 'all', label: { ar: 'كل الخدمات', fr: 'Tous les services', en: 'All services' } },
  { id: 'ai', label: { ar: 'الذكاء الاصطناعي', fr: 'Intelligence artificielle', en: 'Artificial intelligence' } },
  { id: 'web', label: { ar: 'مواقع ومتاجر', fr: 'Sites et boutiques', en: 'Websites & stores' } },
  { id: 'marketing', label: { ar: 'تسويق ومحتوى', fr: 'Marketing et contenu', en: 'Marketing & content' } },
  { id: 'systems', label: { ar: 'أنظمة وشبكات', fr: 'Systèmes et réseaux', en: 'Systems & networks' } },
  { id: 'training', label: { ar: 'تكوين', fr: 'Formation', en: 'Training' } },
];

export interface DigitalService {
  id: string;
  /** Value stored in the service-booking order when the customer asks for a quote. */
  bookingValue: string;
  icon: DigitalServiceIcon;
  category: DigitalServiceCategory;
  title: LangText;
  tagline: LangText;
  description: LangText;
  startingPrice: number;
  priceUnit: LangText;
  features: LangText[];
  delivery: LangText;
  gradient: string;
  badge?: LangText;
  /** Hide the service from the public catalogue without deleting it. */
  visible?: boolean;
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
  /** Hide the pack from the public catalogue without deleting it. */
  visible?: boolean;
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
    category: 'web',
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
    category: 'marketing',
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
    category: 'web',
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
    category: 'systems',
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
    category: 'systems',
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
    category: 'training',
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
  {
    id: 'ai-cv',
    bookingValue: 'ai-cv',
    icon: 'ai',
    category: 'ai',
    title: { ar: 'سيرة ذاتية احترافية بالذكاء الاصطناعي', fr: 'CV professionnel avec IA', en: 'AI-powered professional CV' },
    tagline: {
      ar: 'سيرة ذاتية تجتاز أنظمة الفرز وتبرز خبرتك',
      fr: 'Un CV qui passe les filtres ATS et met en valeur votre expérience',
      en: 'A CV that passes ATS filters and highlights your experience',
    },
    description: {
      ar: 'نكتب ونصمم سيرة ذاتية حديثة بصيغة ATS، مع رسالة تحفيزية وملخص LinkedIn، ونراجعها معك حتى تكون جاهزة للإرسال.',
      fr: 'Nous rédigeons et designons un CV moderne compatible ATS, avec lettre de motivation et résumé LinkedIn, révisé avec vous jusqu’à validation.',
      en: 'We write and design a modern ATS-friendly CV, with a cover letter and LinkedIn summary, revised with you until it is ready to send.',
    },
    startingPrice: 2500,
    priceUnit: { ar: 'للسيرة', fr: 'par CV', en: 'per CV' },
    features: [
      { ar: 'سيرة ذاتية عربية أو فرنسية أو إنجليزية PDF + Word', fr: 'CV en arabe, français ou anglais PDF + Word', en: 'CV in Arabic, French or English, PDF + Word' },
      { ar: 'تحسين الكلمات المفتاحية لأنظمة ATS', fr: 'Optimisation des mots-clés pour les ATS', en: 'Keyword optimisation for ATS systems' },
      { ar: 'رسالة تحفيزية مخصصة لكل عرض عمل', fr: 'Lettre de motivation adaptée à chaque offre', en: 'A tailored cover letter for each job offer' },
      { ar: 'مراجعة وتعديلان مجاناً', fr: 'Relecture et deux révisions offertes', en: 'Proofreading and two free revisions' },
    ],
    delivery: { ar: '24 – 48 ساعة', fr: '24 – 48 heures', en: '24 – 48 hours' },
    gradient: 'from-violet-500 to-purple-600',
    badge: { ar: 'الأكثر طلباً', fr: 'Le plus demandé', en: 'Most requested' },
  },
  {
    id: 'ai-brand',
    bookingValue: 'ai-brand',
    icon: 'design',
    category: 'ai',
    title: { ar: 'شعار وهوية بصرية بالذكاء الاصطناعي', fr: 'Logo et identité visuelle avec IA', en: 'AI logo and visual identity' },
    tagline: {
      ar: 'هوية متكاملة لمشروعك في أيام',
      fr: 'Une identité complète pour votre projet en quelques jours',
      en: 'A complete identity for your project in days',
    },
    description: {
      ar: 'شعار احترافي مع ألوان وخطوط وقوالب سوشيال ميديا متسقة، وملفات مفتوحة وجميع الصيغ التي تحتاجها.',
      fr: 'Un logo professionnel avec couleurs, typographies et modèles réseaux sociaux cohérents, en fichiers ouverts et tous formats.',
      en: 'A professional logo with matching colours, fonts and social templates, delivered in open files and every format you need.',
    },
    startingPrice: 4500,
    priceUnit: { ar: 'للمشروع', fr: 'par projet', en: 'per project' },
    features: [
      { ar: '3 مقترحات شعار مع تعديلين', fr: '3 propositions de logo avec 2 révisions', en: '3 logo concepts with 2 revisions' },
      { ar: 'ألوان وخطوط وهوية موحدة', fr: 'Couleurs, typographies et charte cohérente', en: 'Cohesive colours, fonts and brand guide' },
      { ar: 'قوالب منشورات و Story جاهزة', fr: 'Modèles de posts et stories prêts', en: 'Ready-made post and story templates' },
      { ar: 'ملفات PNG وSVG وPDF', fr: 'Fichiers PNG, SVG et PDF', en: 'PNG, SVG and PDF files' },
    ],
    delivery: { ar: '2 – 3 أيام', fr: '2 – 3 jours', en: '2 – 3 days' },
    gradient: 'from-fuchsia-500 to-pink-600',
  },
  {
    id: 'ai-content',
    bookingValue: 'ai-content',
    icon: 'content',
    category: 'ai',
    title: { ar: 'محتوى سوشيال ميديا بالذكاء الاصطناعي', fr: 'Contenu réseaux sociaux avec IA', en: 'AI social media content' },
    tagline: {
      ar: '30 منشوراً شهرياً بجودة وكالة',
      fr: '30 publications par mois, qualité agence',
      en: '30 posts a month with agency quality',
    },
    description: {
      ar: 'نبني تقويم محتوى شهرياً، نكتب النصوص ونصمم المنشورات بهوية موحدة، جاهزة للنشر على فيسبوك وإنستغرام.',
      fr: 'Un calendrier mensuel, des textes et des visuels cohérents avec votre identité, prêts à publier sur Facebook et Instagram.',
      en: 'A monthly calendar, copy and on-brand visuals, ready to publish on Facebook and Instagram.',
    },
    startingPrice: 6500,
    priceUnit: { ar: 'شهرياً', fr: 'par mois', en: 'per month' },
    features: [
      { ar: '30 منشوراً مع نصوص جاهزة', fr: '30 publications avec textes prêts', en: '30 posts with ready-to-use copy' },
      { ar: '8 ريلز قصيرة شهرياً', fr: '8 reels courts par mois', en: '8 short reels per month' },
      { ar: 'هاشتاغات ونصوص إعلانية', fr: 'Hashtags et textes publicitaires', en: 'Hashtags and ad copy' },
      { ar: 'تقويم نشر شهري واضح', fr: 'Calendrier de publication mensuel', en: 'Clear monthly publishing calendar' },
    ],
    delivery: { ar: 'انطلاقة خلال 72 ساعة', fr: 'Démarrage sous 72 heures', en: 'Kick-off within 72 hours' },
    gradient: 'from-orange-500 to-rose-500',
    badge: { ar: 'وفّر 80% من وقتك', fr: 'Gagnez 80 % de votre temps', en: 'Save 80% of your time' },
  },
  {
    id: 'ai-photos',
    bookingValue: 'ai-photos',
    icon: 'photo',
    category: 'ai',
    title: { ar: 'صور منتجات احترافية بالذكاء الاصطناعي', fr: 'Photos de produits avec IA', en: 'AI product photography' },
    tagline: {
      ar: 'صور تبيع بدل الصور العادية',
      fr: 'Des photos qui vendent, pas de simples images',
      en: 'Photos that sell, not just pictures',
    },
    description: {
      ar: 'نزيل الخلفية، نحسّن الإضاءة والجودة، ونضع منتجك في مشاهد احترافية تناسب متجرك وإعلاناتك.',
      fr: 'Nous supprimons le fond, améliorons la lumière et la qualité, et plaçons votre produit dans des scènes professionnelles.',
      en: 'We remove the background, improve lighting and quality, and place your product in professional scenes for your store and ads.',
    },
    startingPrice: 3500,
    priceUnit: { ar: 'لكل 10 صور', fr: 'pour 10 photos', en: 'per 10 photos' },
    features: [
      { ar: '10 صور بخلفيات ومشاهد متنوعة', fr: '10 photos avec fonds et scènes variés', en: '10 photos with varied backgrounds and scenes' },
      { ar: 'تحسين إضاءة وجودة وحدّة', fr: 'Amélioration de la lumière et de la netteté', en: 'Improved lighting, quality and sharpness' },
      { ar: 'مقاسات جاهزة للمتجر والسوشيال', fr: 'Formats prêts pour boutique et réseaux', en: 'Sizes ready for store and social' },
      { ar: 'تسليم خلال 48 ساعة', fr: 'Livraison sous 48 heures', en: 'Delivery within 48 hours' },
    ],
    delivery: { ar: '48 ساعة', fr: '48 heures', en: '48 hours' },
    gradient: 'from-sky-500 to-cyan-500',
  },
  {
    id: 'ai-video',
    bookingValue: 'ai-video',
    icon: 'video',
    category: 'ai',
    title: { ar: 'ريلز وفيديوهات قصيرة بالذكاء الاصطناعي', fr: 'Reels et vidéos courtes avec IA', en: 'AI reels and short videos' },
    tagline: {
      ar: 'فيديوهات توقف التمرير وتبيع',
      fr: 'Des vidéos qui arrêtent le scroll et vendent',
      en: 'Videos that stop the scroll and sell',
    },
    description: {
      ar: '4 ريلز شهرياً مع كتابة السيناريو، تعليق صوتي، ترجمة مدمجة، ومونتاج عمودي جاهز للنشر.',
      fr: '4 reels par mois avec script, voix off, sous-titres intégrés et montage vertical prêt à publier.',
      en: '4 reels a month with script, voice-over, embedded subtitles and vertical editing ready to publish.',
    },
    startingPrice: 8900,
    priceUnit: { ar: 'شهرياً', fr: 'par mois', en: 'per month' },
    features: [
      { ar: '4 ريلز من 30 إلى 60 ثانية', fr: '4 reels de 30 à 60 secondes', en: '4 reels of 30 to 60 seconds' },
      { ar: 'سيناريو وتعليق صوتي طبيعي', fr: 'Script et voix off naturelle', en: 'Script and natural voice-over' },
      { ar: 'ترجمة عربية أو فرنسية مدمجة', fr: 'Sous-titres arabes ou français intégrés', en: 'Embedded Arabic or French subtitles' },
      { ar: 'مونتاج وتصحيح ألوان', fr: 'Montage et étalonnage des couleurs', en: 'Editing and colour grading' },
    ],
    delivery: { ar: '5 – 7 أيام', fr: '5 – 7 jours', en: '5 – 7 days' },
    gradient: 'from-red-500 to-orange-500',
  },
  {
    id: 'ai-voice',
    bookingValue: 'ai-voice',
    icon: 'voice',
    category: 'ai',
    title: { ar: 'تعليق صوتي طبيعي بالذكاء الاصطناعي', fr: 'Voix off naturelle avec IA', en: 'Natural AI voice-over' },
    tagline: {
      ar: 'صوت احترافي بدون استوديو',
      fr: 'Une voix professionnelle sans studio',
      en: 'Professional voice without a studio',
    },
    description: {
      ar: 'تعليق صوتي عربي أو فرنسي بجودة عالية للإعلانات والفيديوهات، مع اختيار نبرة الصوت المناسبة لعلامتك.',
      fr: 'Voix off arabe ou française de haute qualité pour publicités et vidéos, avec choix du ton adapté à votre marque.',
      en: 'High-quality Arabic or French voice-over for ads and videos, with a tone chosen to fit your brand.',
    },
    startingPrice: 2000,
    priceUnit: { ar: 'لكل 500 كلمة', fr: 'par 500 mots', en: 'per 500 words' },
    features: [
      { ar: 'حتى 500 كلمة لكل ملف', fr: 'Jusqu’à 500 mots par fichier', en: 'Up to 500 words per file' },
      { ar: 'أصوات عربية وفرنسية طبيعية', fr: 'Voix arabes et françaises naturelles', en: 'Natural Arabic and French voices' },
      { ar: 'تسليم MP3 وWAV', fr: 'Livraison MP3 et WAV', en: 'MP3 and WAV delivery' },
      { ar: 'تعديل مجاني واحد', fr: 'Une révision gratuite', en: 'One free revision' },
    ],
    delivery: { ar: '24 ساعة', fr: '24 heures', en: '24 hours' },
    gradient: 'from-indigo-500 to-blue-600',
  },
  {
    id: 'ai-translate',
    bookingValue: 'ai-translate',
    icon: 'translation',
    category: 'ai',
    title: { ar: 'ترجمة احترافية بالذكاء الاصطناعي', fr: 'Traduction professionnelle avec IA', en: 'Professional AI translation' },
    tagline: {
      ar: 'ترجمة دقيقة تحافظ على المعنى والأسلوب',
      fr: 'Une traduction fidèle au sens et au style',
      en: 'Translation that preserves meaning and style',
    },
    description: {
      ar: 'نترجم وثائقك ومقالاتك بين العربية والفرنسية والإنجليزية، مع مراجعة بشرية للمصطلحات الحساسة.',
      fr: 'Traduction de vos documents entre arabe, français et anglais, avec relecture humaine des termes sensibles.',
      en: 'We translate your documents between Arabic, French and English, with human review of sensitive terms.',
    },
    startingPrice: 1200,
    priceUnit: { ar: 'للصفحة', fr: 'par page', en: 'per page' },
    features: [
      { ar: 'ترجمة بين 3 لغات', fr: 'Traduction entre 3 langues', en: 'Translation between 3 languages' },
      { ar: 'مراجعة بشرية للمصطلحات', fr: 'Relecture humaine des termes', en: 'Human review of terminology' },
      { ar: 'الحفاظ على تنسيق الملف الأصلي', fr: 'Mise en page d’origine conservée', en: 'Original file formatting preserved' },
      { ar: 'تسليم Word وPDF', fr: 'Livraison Word et PDF', en: 'Word and PDF delivery' },
    ],
    delivery: { ar: '24 – 48 ساعة', fr: '24 – 48 heures', en: '24 – 48 hours' },
    gradient: 'from-teal-500 to-emerald-600',
  },
  {
    id: 'ai-chatbot',
    bookingValue: 'ai-chatbot',
    icon: 'chatbot',
    category: 'ai',
    title: { ar: 'شات بوت واتساب والموقع', fr: 'Chatbot WhatsApp et site web', en: 'WhatsApp and website chatbot' },
    tagline: {
      ar: 'ردود فورية 24/7 على أسئلة عملائك',
      fr: 'Des réponses instantanées 24h/24 aux questions de vos clients',
      en: 'Instant 24/7 answers to your customers’ questions',
    },
    description: {
      ar: 'بوت ذكي مدرّب على خدماتك وأسعارك، يرد على واتساب والموقع ويحوّل المحادثات الجدية إليك مباشرة.',
      fr: 'Un bot entraîné sur vos services et tarifs, qui répond sur WhatsApp et le site et vous transmet les conversations sérieuses.',
      en: 'A smart bot trained on your services and prices, answering on WhatsApp and your site and forwarding serious leads to you.',
    },
    startingPrice: 15000,
    priceUnit: { ar: 'إعداد + 3000/شهر', fr: 'installation + 3000/mois', en: 'setup + 3000/month' },
    features: [
      { ar: 'تدريب على بيانات نشاطك وأسعارك', fr: 'Entraînement sur vos données et tarifs', en: 'Trained on your business data and prices' },
      { ar: 'ربط واتساب والموقع', fr: 'Connexion WhatsApp et site web', en: 'WhatsApp and website integration' },
      { ar: 'تحويل الطلبات الجدية إليك', fr: 'Transfert des demandes sérieuses vers vous', en: 'Serious requests forwarded to you' },
      { ar: 'لوحة محادثات وتقارير', fr: 'Tableau des conversations et rapports', en: 'Conversations dashboard and reports' },
    ],
    delivery: { ar: '3 – 5 أيام', fr: '3 – 5 jours', en: '3 – 5 days' },
    gradient: 'from-emerald-500 to-lime-600',
    badge: { ar: 'يعمل 24/7', fr: 'Fonctionne 24h/24', en: 'Works 24/7' },
  },
  {
    id: 'ai-automation',
    bookingValue: 'ai-automation',
    icon: 'automation',
    category: 'ai',
    title: { ar: 'أتمتة المهام والتقارير بالذكاء الاصطناعي', fr: 'Automatisation des tâches avec IA', en: 'AI task and report automation' },
    tagline: {
      ar: 'خلّي الروتين يتنفذ وحده',
      fr: 'Laissez la routine s’exécuter toute seule',
      en: 'Let the routine run itself',
    },
    description: {
      ar: 'نؤتمت الفواتير، متابعة العملاء، تقارير Excel، والردود البريدية، ونربط أدواتك ببعضها لتوفير ساعات كل أسبوع.',
      fr: 'Nous automatisons factures, suivi clients, rapports Excel et réponses e-mail, et connectons vos outils pour gagner des heures chaque semaine.',
      en: 'We automate invoices, customer follow-up, Excel reports and email replies, and connect your tools to save hours every week.',
    },
    startingPrice: 9900,
    priceUnit: { ar: 'لكل سير عمل', fr: 'par flux de travail', en: 'per workflow' },
    features: [
      { ar: 'تحليل سير العمل الحالي', fr: 'Analyse de votre flux actuel', en: 'Analysis of your current workflow' },
      { ar: 'أتمتة حتى 3 مهام متكررة', fr: 'Automatisation de 3 tâches répétitives', en: 'Automation of up to 3 repetitive tasks' },
      { ar: 'ربط Excel وGoogle Sheets', fr: 'Connexion Excel et Google Sheets', en: 'Excel and Google Sheets integration' },
      { ar: 'تدريب فريقك على التشغيل', fr: 'Formation de votre équipe', en: 'Training for your team' },
    ],
    delivery: { ar: '5 – 10 أيام', fr: '5 – 10 jours', en: '5 – 10 days' },
    gradient: 'from-slate-600 to-blue-700',
  },
  {
    id: 'ai-ads',
    bookingValue: 'ai-ads',
    icon: 'content',
    category: 'ai',
    title: { ar: 'نصوص إعلانات وصفحات هبوط بالذكاء الاصطناعي', fr: 'Textes publicitaires et landing pages avec IA', en: 'AI ad copy and landing pages' },
    tagline: {
      ar: 'كلمات تجلب النقرات والطلبات',
      fr: 'Des mots qui génèrent des clics et des commandes',
      en: 'Words that bring clicks and orders',
    },
    description: {
      ar: 'نكتب إعلانات فيسبوك وإنستغرام وصفحات هبوط مبنية على بحث الجمهور والعروض الأكثر إقناعاً.',
      fr: 'Nous rédigeons des publicités Facebook et Instagram et des landing pages basées sur la recherche d’audience et les offres les plus convaincantes.',
      en: 'We write Facebook and Instagram ads and landing pages based on audience research and the most persuasive offers.',
    },
    startingPrice: 2900,
    priceUnit: { ar: 'لكل حملة', fr: 'par campagne', en: 'per campaign' },
    features: [
      { ar: '5 نسخ إعلانية جاهزة للاختبار', fr: '5 variantes publicitaires prêtes à tester', en: '5 ad variations ready to test' },
      { ar: 'عنوان ووصف لكل نسخة', fr: 'Titre et description pour chaque variante', en: 'Headline and description for each variation' },
      { ar: 'صفحة هبوط نصية مقنعة', fr: 'Landing page textuelle persuasive', en: 'Persuasive text landing page' },
      { ar: 'توصيات استهداف أولية', fr: 'Recommandations de ciblage initiales', en: 'Initial targeting recommendations' },
    ],
    delivery: { ar: '48 ساعة', fr: '48 heures', en: '48 hours' },
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    id: 'ai-slides',
    bookingValue: 'ai-slides',
    icon: 'presentation',
    category: 'ai',
    title: { ar: 'عروض تقديمية وبروشورات بالذكاء الاصطناعي', fr: 'Présentations et brochures avec IA', en: 'AI presentations and brochures' },
    tagline: {
      ar: 'عرض يقنع المستثمر والعميل',
      fr: 'Une présentation qui convainc investisseurs et clients',
      en: 'A deck that convinces investors and clients',
    },
    description: {
      ar: 'عرض تقديمي احترافي من 10 إلى 15 شريحة مع تصميم متناسق، رسوم بيانية، ونسخة PDF جاهزة للاجتماع.',
      fr: 'Une présentation professionnelle de 10 à 15 slides avec design cohérent, graphiques et version PDF prête pour la réunion.',
      en: 'A professional 10–15 slide deck with cohesive design, charts and a PDF version ready for the meeting.',
    },
    startingPrice: 3900,
    priceUnit: { ar: 'للعرض', fr: 'par présentation', en: 'per deck' },
    features: [
      { ar: 'حتى 15 شريحة مصممة', fr: 'Jusqu’à 15 slides designées', en: 'Up to 15 designed slides' },
      { ar: 'تصميم بهوية مشروعك', fr: 'Design aux couleurs de votre projet', en: 'Design in your brand identity' },
      { ar: 'رسوم وإنفوغرافيك', fr: 'Graphiques et infographies', en: 'Charts and infographics' },
      { ar: 'نسخة PDF وPowerPoint', fr: 'Version PDF et PowerPoint', en: 'PDF and PowerPoint versions' },
    ],
    delivery: { ar: '2 – 3 أيام', fr: '2 – 3 jours', en: '2 – 3 days' },
    gradient: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'ai-data',
    bookingValue: 'ai-data',
    icon: 'analytics',
    category: 'ai',
    title: { ar: 'تحليل بيانات وتقارير بالذكاء الاصطناعي', fr: 'Analyse de données et rapports avec IA', en: 'AI data analysis and reports' },
    tagline: {
      ar: 'حوّل أرقامك إلى قرارات',
      fr: 'Transformez vos chiffres en décisions',
      en: 'Turn your numbers into decisions',
    },
    description: {
      ar: 'نحلل مبيعاتك ومصروفاتك وبيانات عملائك، ونقدم تقريراً واضحاً بتوصيات قابلة للتنفيذ.',
      fr: 'Nous analysons vos ventes, dépenses et données clients, et fournissons un rapport clair avec des recommandations actionnables.',
      en: 'We analyse your sales, expenses and customer data and deliver a clear report with actionable recommendations.',
    },
    startingPrice: 6900,
    priceUnit: { ar: 'للتقرير', fr: 'par rapport', en: 'per report' },
    features: [
      { ar: 'تنظيف ودمج البيانات', fr: 'Nettoyage et fusion des données', en: 'Data cleaning and merging' },
      { ar: 'لوحة مؤشرات واضحة', fr: 'Tableau de bord clair', en: 'Clear KPI dashboard' },
      { ar: 'تقرير PDF بالتوصيات', fr: 'Rapport PDF avec recommandations', en: 'PDF report with recommendations' },
      { ar: 'جلسة شرح 30 دقيقة', fr: 'Session d’explication de 30 minutes', en: '30-minute walkthrough session' },
    ],
    delivery: { ar: '3 – 5 أيام', fr: '3 – 5 jours', en: '3 – 5 days' },
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    id: 'ai-custom',
    bookingValue: 'ai-custom',
    icon: 'ai',
    category: 'ai',
    title: { ar: 'أداة ذكاء اصطناعي مخصصة لنشاطك', fr: 'Outil IA sur mesure pour votre activité', en: 'Custom AI tool for your business' },
    tagline: {
      ar: 'أتمتة مصممة على قياس عملك',
      fr: 'Une automatisation taillée pour votre métier',
      en: 'Automation tailored to your business',
    },
    description: {
      ar: 'نبني لك أداة ويب صغيرة (مولّد محتوى، مصنّف طلبات، مساعد داخلي) تعمل ببياناتك وتوفر ساعات عمل كل أسبوع.',
      fr: 'Nous construisons un petit outil web (générateur de contenu, classificateur de commandes, assistant interne) qui fonctionne avec vos données.',
      en: 'We build a small web tool (content generator, order classifier, internal assistant) that works with your data and saves hours every week.',
    },
    startingPrice: 29900,
    priceUnit: { ar: 'للمشروع', fr: 'par projet', en: 'per project' },
    features: [
      { ar: 'دراسة الاحتياج وتحديد النطاق', fr: 'Étude du besoin et cadrage', en: 'Needs study and scoping' },
      { ar: 'واجهة بسيطة لفريقك', fr: 'Interface simple pour votre équipe', en: 'Simple interface for your team' },
      { ar: 'ربط بالـAPI المناسب', fr: 'Connexion à l’API adaptée', en: 'Integration with the right API' },
      { ar: 'تدريب ودعم 30 يوماً', fr: 'Formation et support 30 jours', en: 'Training and 30 days support' },
    ],
    delivery: { ar: '7 – 14 يوم عمل', fr: '7 – 14 jours ouvrés', en: '7 – 14 working days' },
    gradient: 'from-violet-600 to-indigo-700',
    badge: { ar: 'حل مخصص', fr: 'Sur mesure', en: 'Custom solution' },
  },
  {
    id: 'ai-website',
    bookingValue: 'ai-website',
    icon: 'store',
    category: 'ai',
    title: { ar: 'موقع كامل بالذكاء الاصطناعي', fr: 'Site web complet avec IA', en: 'Complete AI-built website' },
    tagline: {
      ar: 'موقع احترافي في أيام وليس شهور',
      fr: 'Un site professionnel en jours, pas en mois',
      en: 'A professional site in days, not months',
    },
    description: {
      ar: 'ننشئ موقعك التعريفي أو صفحة الهبوط بالكامل باستخدام AI، مع نصوص وصور وتحسين SEO، جاهز للنشر.',
      fr: 'Nous créons votre site vitrine ou landing page avec l’IA : textes, images et SEO de base, prêt à publier.',
      en: 'We build your presentation site or landing page with AI: copy, images and basic SEO, ready to publish.',
    },
    startingPrice: 24900,
    priceUnit: { ar: 'للمشروع', fr: 'par projet', en: 'per project' },
    features: [
      { ar: 'حتى 5 صفحات متجاوبة', fr: 'Jusqu’à 5 pages responsives', en: 'Up to 5 responsive pages' },
      { ar: 'نصوص وصور مولّدة بالذكاء الاصطناعي', fr: 'Textes et images générés par IA', en: 'AI-generated copy and images' },
      { ar: 'تحسين SEO أساسي', fr: 'Optimisation SEO de base', en: 'Basic SEO optimisation' },
      { ar: 'نطاق واستضافة سنة', fr: 'Domaine et hébergement 1 an', en: 'Domain and hosting for one year' },
    ],
    delivery: { ar: '5 – 7 أيام', fr: '5 – 7 jours', en: '5 – 7 days' },
    gradient: 'from-blue-600 to-indigo-700',
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
  {
    id: 'ai-start',
    name: { ar: 'باقة AI للبداية', fr: 'Pack AI Démarrage', en: 'AI Starter pack' },
    price: 7900,
    period: { ar: 'مرة واحدة', fr: 'une fois', en: 'one-time' },
    tagline: {
      ar: 'كل ما تحتاجه للانطلاق: سيرة ذاتية، شعار، محتوى، وترجمة.',
      fr: 'Tout pour démarrer : CV, logo, contenu et traduction.',
      en: 'Everything to get started: CV, logo, content and translation.',
    },
    features: [
      { ar: 'سيرة ذاتية احترافية بصيغة ATS', fr: 'CV professionnel compatible ATS', en: 'Professional ATS-friendly CV' },
      { ar: 'شعار وهوية مبسطة', fr: 'Logo et identité simplifiée', en: 'Logo and simplified identity' },
      { ar: '5 منشورات سوشيال ميديا', fr: '5 publications réseaux sociaux', en: '5 social media posts' },
      { ar: 'ترجمة صفحة واحدة', fr: 'Traduction d’une page', en: 'One-page translation' },
      { ar: 'تسليم خلال 3 – 5 أيام', fr: 'Livraison en 3 – 5 jours', en: 'Delivery in 3 – 5 days' },
    ],
    cta: { ar: 'ابدأ بذكاء', fr: 'Démarrer avec l’IA', en: 'Start smart' },
    bookingValue: 'ai-pack-start',
    gradient: 'from-violet-500 to-fuchsia-600',
  },
  {
    id: 'ai-business',
    name: { ar: 'باقة AI للأعمال', fr: 'Pack AI Business', en: 'AI Business pack' },
    price: 19900,
    period: { ar: 'مرة واحدة', fr: 'une fois', en: 'one-time' },
    tagline: {
      ar: 'هوية + محتوى + شات بوت: حضور كامل يدير نفسه.',
      fr: 'Identité + contenu + chatbot : une présence qui se gère toute seule.',
      en: 'Identity + content + chatbot: a presence that runs itself.',
    },
    features: [
      { ar: 'شعار وهوية بصرية كاملة', fr: 'Logo et identité visuelle complète', en: 'Logo and full visual identity' },
      { ar: '20 منشوراً مع نصوص وتصاميم', fr: '20 publications avec textes et designs', en: '20 posts with copy and designs' },
      { ar: '4 ريلز قصيرة', fr: '4 reels courts', en: '4 short reels' },
      { ar: 'إعداد شات بوت واتساب', fr: 'Installation chatbot WhatsApp', en: 'WhatsApp chatbot setup' },
      { ar: 'تقرير أداء شهري', fr: 'Rapport de performance mensuel', en: 'Monthly performance report' },
    ],
    cta: { ar: 'جهّز أعمالي بالـAI', fr: 'Équiper mon business', en: 'Equip my business' },
    bookingValue: 'ai-pack-business',
    featured: true,
    gradient: 'from-blue-600 via-indigo-600 to-violet-600',
  },
  {
    id: 'ai-growth',
    name: { ar: 'باقة AI للنمو', fr: 'Pack AI Croissance', en: 'AI Growth pack' },
    price: 29900,
    period: { ar: 'شهرياً', fr: 'par mois', en: 'per month' },
    tagline: {
      ar: 'محتوى وإعلانات وأتمتة كل شهر — بدون فريق داخلي.',
      fr: 'Contenu, publicité et automatisation chaque mois — sans équipe interne.',
      en: 'Content, ads and automation every month — without an in-house team.',
    },
    features: [
      { ar: '30 منشوراً و8 ريلز شهرياً', fr: '30 publications et 8 reels par mois', en: '30 posts and 8 reels per month' },
      { ar: 'نصوص إعلانات وصفحات هبوط', fr: 'Textes publicitaires et landing pages', en: 'Ad copy and landing pages' },
      { ar: 'أتمتة مهمة متكررة شهرياً', fr: 'Automatisation d’une tâche répétitive par mois', en: 'One repetitive task automated monthly' },
      { ar: 'تقرير وتحسين شهري', fr: 'Rapport et optimisation mensuels', en: 'Monthly report and optimisation' },
      { ar: 'دعم أولوية عبر واتساب', fr: 'Support prioritaire via WhatsApp', en: 'Priority WhatsApp support' },
    ],
    cta: { ar: 'انطلق مع AI', fr: 'Démarrer avec l’IA', en: 'Grow with AI' },
    bookingValue: 'ai-pack-growth',
    gradient: 'from-rose-500 to-orange-500',
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

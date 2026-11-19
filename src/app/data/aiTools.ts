import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  BadgePercent,
  CalendarCheck,
  Clapperboard,
  ClipboardCheck,
  FileSearch,
  ImageUp,
  LayoutTemplate,
  Megaphone,
  MessagesSquare,
  PackageCheck,
  Rocket,
  Swords,
} from 'lucide-react';
import type { AiTool } from '../utils/api';

export type LangText = { ar: string; fr: string; en: string };

export type AiToolStage = 'prepare' | 'create' | 'improve';

export type AiToolField = {
  key: string;
  label: LangText;
  placeholder: LangText;
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
  rows?: number;
};

export type AiSellerTool = {
  id: AiTool;
  icon: LucideIcon;
  name: LangText;
  tagline: LangText;
  description: LangText;
  badge?: LangText;
  stage: AiToolStage;
  needsImage?: boolean;
  fields: AiToolField[];
};

export const AI_TOOL_STAGES: Array<{
  id: AiToolStage;
  icon: LucideIcon;
  label: LangText;
  blurb: LangText;
}> = [
  {
    id: 'prepare',
    icon: FileSearch,
    label: { ar: 'قبل أن تبيع', fr: 'Avant de vendre', en: 'Before you sell' },
    blurb: {
      ar: 'افحص المنتج، ابنِ العرض، وحلّل المنافس قبل أن تصرف أي دينار.',
      fr: 'Vérifiez le produit, construisez l’offre et analysez la concurrence avant de dépenser.',
      en: 'Check the product, build the offer and study the competition before spending.',
    },
  },
  {
    id: 'create',
    icon: Megaphone,
    label: { ar: 'ما تكتبه', fr: 'Ce que vous rédigez', en: 'What you write' },
    blurb: {
      ar: 'إعلانات، صفحة منتج، سيناريو فيديو، ورسائل جاهزة للإرسال.',
      fr: 'Publicités, page produit, script vidéo et messages prêts à envoyer.',
      en: 'Ads, product pages, video scripts and messages ready to send.',
    },
  },
  {
    id: 'improve',
    icon: Activity,
    label: { ar: 'ما تحلّله وتصحّحه', fr: 'Ce que vous analysez', en: 'What you analyze' },
    blurb: {
      ar: 'قيّم الإعلان والصفحة والحملة، ثم أصلح ما يكلّفك مبيعات.',
      fr: 'Auditez la pub, la page et la campagne, puis corrigez ce qui coûte des ventes.',
      en: 'Audit the ad, page and campaign, then fix what costs you sales.',
    },
  },
];

const J = { ar: 'جديد', fr: 'Nouveau', en: 'New' };

export const aiSellerTools: AiSellerTool[] = [
  {
    id: 'product-check',
    icon: FileSearch,
    stage: 'prepare',
    name: { ar: 'فاحص المنتج', fr: 'Analyseur de produit', en: 'Product Checker' },
    tagline: {
      ar: 'هل يستحق منتجك الإعلانات؟ اعرف قبل أن تصرف.',
      fr: 'Votre produit mérite-t-il la publicité ? Sachez-le avant de dépenser.',
      en: 'Does your product deserve ads? Know before you spend.',
    },
    description: {
      ar: 'يقيّم المنتج من حيث الطلب والسعر والمخاطر، ويعطيك درجة وقراراً واضحاً.',
      fr: 'Évalue la demande, le prix et les risques, avec une note et une décision claire.',
      en: 'Scores demand, pricing and risk, with a clear verdict.',
    },
    fields: [
      {
        key: 'productName',
        label: { ar: 'اسم المنتج', fr: 'Nom du produit', en: 'Product name' },
        placeholder: { ar: 'سماعات بلوتوث Pro', fr: 'Écouteurs Bluetooth Pro', en: 'Bluetooth earbuds Pro' },
        required: true,
        maxLength: 140,
      },
      {
        key: 'productDetails',
        label: { ar: 'الوصف والسعر والمميزات', fr: 'Description, prix et points forts', en: 'Description, price and key features' },
        placeholder: {
          ar: 'ما هو المنتج، أهم المميزات، السعر، وما يميزه عن غيره…',
          fr: 'Ce que c’est, les points forts, le prix et ce qui le différencie…',
          en: 'What it is, key features, the price and what makes it different…',
        },
        required: true,
        multiline: true,
        maxLength: 900,
        rows: 5,
      },
      {
        key: 'price',
        label: { ar: 'السعر الحالي', fr: 'Prix actuel', en: 'Current price' },
        placeholder: { ar: '4 500 دج', fr: '4 500 DA', en: 'DZD 4,500' },
        maxLength: 60,
      },
      {
        key: 'audience',
        label: { ar: 'الجمهور المستهدف', fr: 'Public cible', en: 'Target audience' },
        placeholder: {
          ar: 'شباب، طلبة، موظفون، رياضيون…',
          fr: 'Jeunes, étudiants, employés, sportifs…',
          en: 'Young people, students, employees, athletes…',
        },
        maxLength: 200,
      },
      {
        key: 'market',
        label: { ar: 'قناة البيع', fr: 'Canal de vente', en: 'Sales channel' },
        placeholder: {
          ar: 'فيسبوك، إنستغرام، متجر إلكتروني…',
          fr: 'Facebook, Instagram, boutique en ligne…',
          en: 'Facebook, Instagram, online store…',
        },
        maxLength: 120,
      },
    ],
  },
  {
    id: 'offer-maker',
    icon: BadgePercent,
    stage: 'prepare',
    badge: J,
    name: { ar: 'صانع العروض', fr: 'Générateur d’offres', en: 'Offer Maker' },
    tagline: {
      ar: 'حوّل المنتج إلى عرض لا يُرفض.',
      fr: 'Transformez le produit en une offre irrésistible.',
      en: 'Turn the product into an irresistible offer.',
    },
    description: {
      ar: 'عرض متكامل: الوعد، الحزمة، الهدايا، الضمان، السعر، و3 صيغ جاهزة.',
      fr: 'Une offre complète : promesse, pack, bonus, garantie, prix et 3 variantes.',
      en: 'A complete offer: promise, bundle, bonuses, guarantee, price and 3 variants.',
    },
    fields: [
      {
        key: 'productName',
        label: { ar: 'اسم المنتج', fr: 'Nom du produit', en: 'Product name' },
        placeholder: { ar: 'حقيبة ظهر مقاومة للماء', fr: 'Sac à dos imperméable', en: 'Waterproof backpack' },
        required: true,
        maxLength: 140,
      },
      {
        key: 'productDetails',
        label: { ar: 'تفاصيل المنتج', fr: 'Détails du produit', en: 'Product details' },
        placeholder: {
          ar: 'المميزات، الجودة، ما يشمله المنتج، الفئة التي يناسبها…',
          fr: 'Caractéristiques, qualité, contenu du pack, public concerné…',
          en: 'Features, quality, what is included, who it suits…',
        },
        required: true,
        multiline: true,
        maxLength: 800,
        rows: 4,
      },
      {
        key: 'price',
        label: { ar: 'السعر', fr: 'Prix', en: 'Price' },
        placeholder: { ar: '3 900 دج', fr: '3 900 DA', en: 'DZD 3,900' },
        required: true,
        maxLength: 60,
      },
      {
        key: 'audience',
        label: { ar: 'الجمهور المستهدف', fr: 'Public cible', en: 'Target audience' },
        placeholder: { ar: 'طلبة، مسافرون، موظفون…', fr: 'Étudiants, voyageurs, employés…', en: 'Students, travellers, employees…' },
        maxLength: 200,
      },
      {
        key: 'goal',
        label: { ar: 'هدف العرض', fr: 'Objectif de l’offre', en: 'Offer goal' },
        placeholder: {
          ar: 'زيادة الطلبات، تصريف المخزون، إطلاق منتج جديد…',
          fr: 'Plus de commandes, écouler le stock, lancer un produit…',
          en: 'More orders, clear stock, launch a new product…',
        },
        maxLength: 160,
      },
    ],
  },
  {
    id: 'competitor',
    icon: Swords,
    stage: 'prepare',
    badge: J,
    name: { ar: 'حلّل منافسك', fr: 'Analysez votre concurrent', en: 'Analyze Your Competitor' },
    tagline: {
      ar: 'اعرف نقاط قوته وضعفه واسبقه بعرض أفضل.',
      fr: 'Repérez ses forces et faiblesses, puis dépassez-le.',
      en: 'Spot their strengths and gaps, then beat them.',
    },
    description: {
      ar: 'يحلّل إعلان منافس أو عرضه ويقترح زاوية تميّزك و3 خطافات إعلانية.',
      fr: 'Analyse son annonce ou son offre et propose un angle + 3 accroches.',
      en: 'Analyzes their ad or offer and proposes your angle plus 3 hooks.',
    },
    fields: [
      {
        key: 'competitor',
        label: { ar: 'المنافس أو نص إعلانه', fr: 'Concurrent ou texte de son annonce', en: 'Competitor or their ad text' },
        placeholder: {
          ar: 'اسم المنافس، نص إعلانه، السعر، الوعد، أو رابط الصفحة…',
          fr: 'Nom, texte de l’annonce, prix, promesse ou lien de la page…',
          en: 'Name, ad text, price, promise or page link…',
        },
        required: true,
        multiline: true,
        maxLength: 1200,
        rows: 5,
      },
      {
        key: 'product',
        label: { ar: 'منتجك أو عرضك', fr: 'Votre produit ou offre', en: 'Your product or offer' },
        placeholder: {
          ar: 'ما تبيعه، سعرك، وما يميزك…',
          fr: 'Ce que vous vendez, votre prix et votre différence…',
          en: 'What you sell, your price and your difference…',
        },
        required: true,
        multiline: true,
        maxLength: 900,
        rows: 4,
      },
      {
        key: 'audience',
        label: { ar: 'الجمهور المستهدف', fr: 'Public cible', en: 'Target audience' },
        placeholder: { ar: 'نفس جمهور المنافس أو جمهور مختلف…', fr: 'Le même public ou un autre…', en: 'The same audience or a different one…' },
        maxLength: 200,
      },
      {
        key: 'platform',
        label: { ar: 'المنصة', fr: 'Plateforme', en: 'Platform' },
        placeholder: { ar: 'فيسبوك، إنستغرام، تيك توك…', fr: 'Facebook, Instagram, TikTok…', en: 'Facebook, Instagram, TikTok…' },
        maxLength: 80,
      },
    ],
  },
  {
    id: 'plan',
    icon: CalendarCheck,
    stage: 'prepare',
    name: { ar: 'خطتي', fr: 'Mon plan', en: 'My Plan' },
    tagline: {
      ar: 'خطة تسويق يومية تنفذها وحدك.',
      fr: 'Un plan marketing quotidien à exécuter seul.',
      en: 'A daily marketing plan you can run alone.',
    },
    description: {
      ar: 'خطة 7 أو 14 أو 30 يوماً: المحتوى، الميزانية، المؤشرات، وأول 3 خطوات اليوم.',
      fr: 'Un plan de 7, 14 ou 30 jours : contenu, budget, indicateurs et 3 actions immédiates.',
      en: 'A 7, 14 or 30-day plan: content, budget, metrics and your first 3 actions today.',
    },
    fields: [
      {
        key: 'business',
        label: { ar: 'مشروعك أو متجرك', fr: 'Votre activité ou boutique', en: 'Your business or store' },
        placeholder: {
          ar: 'متجر إلكتروني لبيع عتاد الإعلام الآلي في الجزائر…',
          fr: 'Boutique en ligne de matériel informatique en Algérie…',
          en: 'Online computer-equipment store in Algeria…',
        },
        required: true,
        multiline: true,
        maxLength: 600,
        rows: 3,
      },
      {
        key: 'product',
        label: { ar: 'المنتج أو الخدمة', fr: 'Produit ou service', en: 'Product or service' },
        placeholder: { ar: 'المنتج الذي تريد بيعه أولاً…', fr: 'Le produit à vendre en priorité…', en: 'The product to sell first…' },
        required: true,
        maxLength: 300,
      },
      {
        key: 'goal',
        label: { ar: 'الهدف', fr: 'Objectif', en: 'Goal' },
        placeholder: {
          ar: '10 طلبات في أول 30 يوماً، 500 متابع، إطلاق منتج…',
          fr: '10 commandes en 30 jours, 500 abonnés, lancement…',
          en: '10 orders in 30 days, 500 followers, a launch…',
        },
        required: true,
        maxLength: 260,
      },
      {
        key: 'days',
        label: { ar: 'المدة', fr: 'Durée', en: 'Duration' },
        placeholder: { ar: '7 أو 14 أو 30 يوماً', fr: '7, 14 ou 30 jours', en: '7, 14 or 30 days' },
        maxLength: 40,
      },
      {
        key: 'budget',
        label: { ar: 'الميزانية', fr: 'Budget', en: 'Budget' },
        placeholder: { ar: '20 000 دج إجمالاً أو 1 500 دج يومياً', fr: '20 000 DA au total ou 1 500 DA par jour', en: 'DZD 20,000 total or DZD 1,500 per day' },
        maxLength: 120,
      },
      {
        key: 'channels',
        label: { ar: 'القنوات المتاحة', fr: 'Canaux disponibles', en: 'Available channels' },
        placeholder: { ar: 'فيسبوك، إنستغرام، واتساب، متجر…', fr: 'Facebook, Instagram, WhatsApp, boutique…', en: 'Facebook, Instagram, WhatsApp, store…' },
        maxLength: 200,
      },
    ],
  },
  {
    id: 'ad-copy',
    icon: Megaphone,
    stage: 'create',
    name: { ar: 'اكتب لي إعلاناً', fr: 'Rédigez-moi une pub', en: 'Write My Ad' },
    tagline: {
      ar: '3 نسخ إعلانية بزوايا مختلفة.',
      fr: '3 versions publicitaires avec des angles différents.',
      en: '3 ad variations with different angles.',
    },
    description: {
      ar: 'عناوين ونصوص وأوصاف ودعوات جاهزة للنشر، مع 5 عناوين قصيرة إضافية.',
      fr: 'Titres, textes, descriptions et CTA prêts à publier, avec 5 titres courts.',
      en: 'Headlines, copy, descriptions and CTAs ready to publish, plus 5 short headlines.',
    },
    fields: [
      {
        key: 'product',
        label: { ar: 'المنتج', fr: 'Produit', en: 'Product' },
        placeholder: { ar: 'ما تبيعه بالتفصيل…', fr: 'Ce que vous vendez en détail…', en: 'What you sell, in detail…' },
        required: true,
        multiline: true,
        maxLength: 700,
        rows: 3,
      },
      {
        key: 'offer',
        label: { ar: 'العرض والتفاصيل', fr: 'Offre et détails', en: 'Offer and details' },
        placeholder: {
          ar: 'السعر، ما يشمله العرض، الضمان، التوصيل، سبب الشراء الآن…',
          fr: 'Prix, contenu de l’offre, garantie, livraison, raison d’acheter…',
          en: 'Price, what is included, guarantee, delivery, reason to buy now…',
        },
        required: true,
        multiline: true,
        maxLength: 700,
        rows: 4,
      },
      {
        key: 'audience',
        label: { ar: 'الجمهور المستهدف', fr: 'Public cible', en: 'Target audience' },
        placeholder: { ar: 'من تريد أن يشتري ولماذا…', fr: 'Qui doit acheter et pourquoi…', en: 'Who should buy and why…' },
        required: true,
        maxLength: 220,
      },
      {
        key: 'platform',
        label: { ar: 'المنصة', fr: 'Plateforme', en: 'Platform' },
        placeholder: { ar: 'فيسبوك، إنستغرام، تيك توك…', fr: 'Facebook, Instagram, TikTok…', en: 'Facebook, Instagram, TikTok…' },
        maxLength: 80,
      },
      {
        key: 'tone',
        label: { ar: 'النبرة', fr: 'Ton', en: 'Tone' },
        placeholder: { ar: 'مباشر، ودود، احترافي، فكاهي…', fr: 'Direct, amical, professionnel, drôle…', en: 'Direct, friendly, professional, funny…' },
        maxLength: 80,
      },
      {
        key: 'goal',
        label: { ar: 'الهدف', fr: 'Objectif', en: 'Goal' },
        placeholder: { ar: 'طلبات، رسائل، زيارات للمتجر…', fr: 'Commandes, messages, visites…', en: 'Orders, messages, store visits…' },
        maxLength: 120,
      },
    ],
  },
  {
    id: 'product-page',
    icon: LayoutTemplate,
    stage: 'create',
    badge: J,
    name: { ar: 'اكتب صفحة منتجك', fr: 'Rédigez votre page produit', en: 'Write Your Product Page' },
    tagline: {
      ar: 'صفحة كاملة جاهزة للنسخ.',
      fr: 'Une page complète prête à copier.',
      en: 'A complete page ready to copy.',
    },
    description: {
      ar: 'عنوان، وصف، مميزات، مواصفات، أسئلة شائعة ودعوة شراء — بنصوص بيعية واضحة.',
      fr: 'Titre, description, bénéfices, specs, FAQ et CTA — avec un copywriting clair.',
      en: 'Headline, description, benefits, specs, FAQ and CTA — with clear sales copy.',
    },
    fields: [
      {
        key: 'productName',
        label: { ar: 'اسم المنتج', fr: 'Nom du produit', en: 'Product name' },
        placeholder: { ar: 'طابعة ليزر لاسلكية', fr: 'Imprimante laser sans fil', en: 'Wireless laser printer' },
        required: true,
        maxLength: 140,
      },
      {
        key: 'features',
        label: { ar: 'المميزات والمواصفات', fr: 'Caractéristiques et specs', en: 'Features and specs' },
        placeholder: {
          ar: 'السرعة، الاتصال، استهلاك الحبر، الضمان، محتوى العلبة…',
          fr: 'Vitesse, connexion, encre, garantie, contenu de la boîte…',
          en: 'Speed, connectivity, ink, warranty, box contents…',
        },
        required: true,
        multiline: true,
        maxLength: 900,
        rows: 5,
      },
      {
        key: 'audience',
        label: { ar: 'الجمهور المستهدف', fr: 'Public cible', en: 'Target audience' },
        placeholder: { ar: 'مكاتب، طلبة، أصحاب متاجر…', fr: 'Bureaux, étudiants, commerçants…', en: 'Offices, students, shop owners…' },
        maxLength: 200,
      },
      {
        key: 'price',
        label: { ar: 'السعر', fr: 'Prix', en: 'Price' },
        placeholder: { ar: '28 000 دج', fr: '28 000 DA', en: 'DZD 28,000' },
        maxLength: 60,
      },
      {
        key: 'guarantee',
        label: { ar: 'الضمان والتوصيل', fr: 'Garantie et livraison', en: 'Guarantee and delivery' },
        placeholder: {
          ar: 'ضمان 6 أشهر، توصيل 48 ساعة، دفع عند الاستلام…',
          fr: 'Garantie 6 mois, livraison 48 h, paiement à la livraison…',
          en: '6-month warranty, 48h delivery, cash on delivery…',
        },
        maxLength: 240,
      },
      {
        key: 'tone',
        label: { ar: 'النبرة', fr: 'Ton', en: 'Tone' },
        placeholder: { ar: 'احترافي، بسيط، حماسي…', fr: 'Professionnel, simple, enthousiaste…', en: 'Professional, simple, enthusiastic…' },
        maxLength: 80,
      },
    ],
  },
  {
    id: 'landing-page',
    icon: Rocket,
    stage: 'create',
    badge: J,
    needsImage: true,
    name: { ar: 'صفحة هبوط بالذكاء الاصطناعي', fr: 'Page de vente IA', en: 'AI Landing Page' },
    tagline: {
      ar: 'صورة منتجك تدخل، صفحة بيع كاملة تخرج.',
      fr: 'Votre photo produit entre, une page de vente complète sort.',
      en: 'Your product photo goes in, a complete sales page comes out.',
    },
    description: {
      ar: 'ارفع صورة المنتج واكتب التفاصيل: يولّد الذكاء الاصطناعي صفحة HTML كاملة — عنوان SEO، هيرو، فوائد، عرض، ضمان وأسئلة شائعة — مع معاينة وتنزيل.',
      fr: 'Importez la photo du produit et ses détails : l’IA génère une page HTML complète — titre SEO, hero, bénéfices, offre, garantie et FAQ — avec aperçu et téléchargement.',
      en: 'Upload the product photo and details: the AI generates a complete HTML page — SEO title, hero, benefits, offer, guarantee and FAQ — with preview and download.',
    },
    fields: [
      {
        key: 'productName',
        label: { ar: 'اسم المنتج', fr: 'Nom du produit', en: 'Product name' },
        placeholder: { ar: 'ساعة ذكية رياضية', fr: 'Montre connectée sport', en: 'Sports smartwatch' },
        required: true,
        maxLength: 140,
      },
      {
        key: 'productDetails',
        label: { ar: 'تفاصيل المنتج', fr: 'Détails du produit', en: 'Product details' },
        placeholder: {
          ar: 'ما هو المنتج، أهم المميزات، محتوى العلبة، السعر، وما يميزه…',
          fr: 'Ce que c’est, les points forts, le contenu de la boîte, le prix et ce qui le différencie…',
          en: 'What it is, key features, box contents, price and what makes it different…',
        },
        required: true,
        multiline: true,
        maxLength: 1000,
        rows: 5,
      },
      {
        key: 'audience',
        label: { ar: 'الجمهور المستهدف', fr: 'Public cible', en: 'Target audience' },
        placeholder: { ar: 'شباب، رياضيون، طلبة، موظفون…', fr: 'Jeunes, sportifs, étudiants, employés…', en: 'Young people, athletes, students, employees…' },
        maxLength: 220,
      },
      {
        key: 'price',
        label: { ar: 'السعر', fr: 'Prix', en: 'Price' },
        placeholder: { ar: '5 900 دج', fr: '5 900 DA', en: 'DZD 5,900' },
        maxLength: 60,
      },
      {
        key: 'offer',
        label: { ar: 'العرض والحزمة', fr: 'Offre et pack', en: 'Offer and bundle' },
        placeholder: {
          ar: 'خصم، هدية، حزمة، توصيل مجاني…',
          fr: 'Remise, cadeau, pack, livraison offerte…',
          en: 'Discount, gift, bundle, free delivery…',
        },
        maxLength: 300,
      },
      {
        key: 'guarantee',
        label: { ar: 'الضمان والتوصيل', fr: 'Garantie et livraison', en: 'Guarantee and delivery' },
        placeholder: {
          ar: 'ضمان 6 أشهر، توصيل 48 ساعة، دفع عند الاستلام…',
          fr: 'Garantie 6 mois, livraison 48 h, paiement à la livraison…',
          en: '6-month warranty, 48h delivery, cash on delivery…',
        },
        maxLength: 240,
      },
      {
        key: 'contact',
        label: { ar: 'واتساب أو هاتف للطلب', fr: 'WhatsApp ou téléphone', en: 'WhatsApp or phone' },
        placeholder: { ar: '+213 5xx xx xx xx', fr: '+213 5xx xx xx xx', en: '+213 5xx xx xx xx' },
        required: true,
        maxLength: 160,
      },
      {
        key: 'tone',
        label: { ar: 'النبرة', fr: 'Ton', en: 'Tone' },
        placeholder: { ar: 'احترافي، بسيط، حماسي…', fr: 'Professionnel, simple, enthousiaste…', en: 'Professional, simple, enthusiastic…' },
        maxLength: 80,
      },
    ],
  },
  {
    id: 'video-script',
    icon: Clapperboard,
    stage: 'create',
    badge: J,
    name: { ar: 'سيناريو فيديو إعلاني', fr: 'Script vidéo publicitaire', en: 'Ad Video Script' },
    tagline: {
      ar: 'سيناريو 15-60 ثانية مع اللقطات والتعليق.',
      fr: 'Script 15-60 s avec plans et voix off.',
      en: 'A 15-60s script with shots and voiceover.',
    },
    description: {
      ar: 'خطاف أول 3 ثوانٍ، مشاهد متسلسلة، نص على الشاشة، ونصائح تصوير بالهاتف.',
      fr: 'Accroche de 3 s, scènes, texte à l’écran et conseils de tournage mobile.',
      en: 'A 3-second hook, scene-by-scene shots, on-screen text and phone-filming tips.',
    },
    fields: [
      {
        key: 'product',
        label: { ar: 'المنتج', fr: 'Produit', en: 'Product' },
        placeholder: { ar: 'ما تبيعه وما يميزه…', fr: 'Ce que vous vendez et sa différence…', en: 'What you sell and what makes it different…' },
        required: true,
        multiline: true,
        maxLength: 700,
        rows: 3,
      },
      {
        key: 'audience',
        label: { ar: 'الجمهور المستهدف', fr: 'Public cible', en: 'Target audience' },
        placeholder: { ar: 'من تريد أن يرى الفيديو…', fr: 'Qui doit voir la vidéo…', en: 'Who should see the video…' },
        required: true,
        maxLength: 220,
      },
      {
        key: 'duration',
        label: { ar: 'المدة بالثواني', fr: 'Durée en secondes', en: 'Duration in seconds' },
        placeholder: { ar: '15 أو 30 أو 45 أو 60', fr: '15, 30, 45 ou 60', en: '15, 30, 45 or 60' },
        required: true,
        maxLength: 20,
      },
      {
        key: 'platform',
        label: { ar: 'المنصة', fr: 'Plateforme', en: 'Platform' },
        placeholder: { ar: 'تيك توك، ريلز، ستوري…', fr: 'TikTok, Reels, Story…', en: 'TikTok, Reels, Story…' },
        maxLength: 80,
      },
      {
        key: 'tone',
        label: { ar: 'النبرة', fr: 'Ton', en: 'Tone' },
        placeholder: { ar: 'مباشر، فكاهي، احترافي…', fr: 'Direct, drôle, professionnel…', en: 'Direct, funny, professional…' },
        maxLength: 80,
      },
    ],
  },
  {
    id: 'customer-reply',
    icon: MessagesSquare,
    stage: 'create',
    badge: J,
    name: { ar: 'ردّ على زبائنك', fr: 'Répondez à vos clients', en: 'Reply to Customers' },
    tagline: {
      ar: 'ردود تفتح الطلب وتعالج الاعتراضات.',
      fr: 'Des réponses qui débloquent la commande.',
      en: 'Replies that unlock the order.',
    },
    description: {
      ar: 'رد جاهز + نسخة قصيرة + متابعة بعد 24 ساعة، مع ما يجب تجنّب قوله.',
      fr: 'Une réponse prête, une version courte, un suivi à 24 h et ce qu’il ne faut pas dire.',
      en: 'A ready reply, a short version, a 24h follow-up and what not to say.',
    },
    fields: [
      {
        key: 'customerMessage',
        label: { ar: 'رسالة الزبون', fr: 'Message du client', en: 'Customer message' },
        placeholder: {
          ar: 'الصق رسالة الزبون كما هي…',
          fr: 'Collez le message du client tel quel…',
          en: 'Paste the customer message exactly as received…',
        },
        required: true,
        multiline: true,
        maxLength: 1000,
        rows: 4,
      },
      {
        key: 'product',
        label: { ar: 'المنتج المعني', fr: 'Produit concerné', en: 'Related product' },
        placeholder: { ar: 'المنتج أو الخدمة التي يسأل عنها…', fr: 'Le produit ou service concerné…', en: 'The product or service they ask about…' },
        maxLength: 200,
      },
      {
        key: 'situation',
        label: { ar: 'نوع الاعتراض', fr: 'Type d’objection', en: 'Objection type' },
        placeholder: {
          ar: 'السعر غالٍ، التوصيل، الثقة، المنتج غير متوفر، طلب إرجاع…',
          fr: 'Prix élevé, livraison, confiance, rupture, retour…',
          en: 'Price, delivery, trust, out of stock, return…',
        },
        maxLength: 200,
      },
      {
        key: 'tone',
        label: { ar: 'النبرة', fr: 'Ton', en: 'Tone' },
        placeholder: { ar: 'ودود، مختصر، رسمي…', fr: 'Amical, bref, formel…', en: 'Friendly, brief, formal…' },
        maxLength: 80,
      },
    ],
  },
  {
    id: 'order-confirmation',
    icon: PackageCheck,
    stage: 'create',
    name: { ar: 'نص تأكيد الطلبية', fr: 'Message de confirmation', en: 'Order Confirmation' },
    tagline: {
      ar: 'رسائل تقلّل الطلبات الملغاة.',
      fr: 'Des messages qui réduisent les annulations.',
      en: 'Messages that reduce cancellations.',
    },
    description: {
      ar: 'تأكيد واتساب، نسخة SMS، تذكير بعد 24 ساعة، ورسالة يوم التوصيل.',
      fr: 'Confirmation WhatsApp, version SMS, rappel à 24 h et message du jour de livraison.',
      en: 'WhatsApp confirmation, an SMS version, a 24h reminder and a delivery-day message.',
    },
    fields: [
      {
        key: 'storeName',
        label: { ar: 'اسم المتجر', fr: 'Nom de la boutique', en: 'Store name' },
        placeholder: { ar: 'AOS Tech Store', fr: 'AOS Tech Store', en: 'AOS Tech Store' },
        maxLength: 120,
      },
      {
        key: 'product',
        label: { ar: 'المنتج', fr: 'Produit', en: 'Product' },
        placeholder: { ar: 'المنتج والكمية…', fr: 'Le produit et la quantité…', en: 'The product and quantity…' },
        required: true,
        maxLength: 260,
      },
      {
        key: 'customerName',
        label: { ar: 'اسم الزبون', fr: 'Nom du client', en: 'Customer name' },
        placeholder: { ar: 'أحمد', fr: 'Ahmed', en: 'Ahmed' },
        maxLength: 120,
      },
      {
        key: 'price',
        label: { ar: 'السعر', fr: 'Prix', en: 'Price' },
        placeholder: { ar: '5 400 دج', fr: '5 400 DA', en: 'DZD 5,400' },
        maxLength: 60,
      },
      {
        key: 'deliveryTime',
        label: { ar: 'مدة التوصيل', fr: 'Délai de livraison', en: 'Delivery time' },
        placeholder: { ar: '24 إلى 48 ساعة', fr: '24 à 48 heures', en: '24 to 48 hours' },
        maxLength: 80,
      },
      {
        key: 'paymentMethod',
        label: { ar: 'طريقة الدفع', fr: 'Mode de paiement', en: 'Payment method' },
        placeholder: { ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison', en: 'Cash on delivery' },
        maxLength: 80,
      },
    ],
  },
  {
    id: 'ad-image-review',
    icon: ImageUp,
    stage: 'improve',
    needsImage: true,
    name: { ar: 'حلّل إعلاني من صورته', fr: 'Analysez ma pub par image', en: 'Analyze My Ad Image' },
    tagline: {
      ar: 'ارفع صورة الإعلان واحصل على تقييم.',
      fr: 'Importez l’image de la pub et obtenez un audit.',
      en: 'Upload the ad image and get an audit.',
    },
    description: {
      ar: 'انطباع أول 3 ثوانٍ، درجة، نقاط قوة، أسباب خسارة المبيعات، وأهم 5 تعديلات.',
      fr: 'Impression en 3 s, note, points forts, pertes de ventes et 5 corrections prioritaires.',
      en: 'A 3-second impression, score, strengths, lost sales and the top 5 fixes.',
    },
    fields: [
      {
        key: 'goal',
        label: { ar: 'هدف الإعلان', fr: 'Objectif de la pub', en: 'Ad goal' },
        placeholder: { ar: 'طلبات، رسائل، زيارات…', fr: 'Commandes, messages, visites…', en: 'Orders, messages, visits…' },
        maxLength: 160,
      },
      {
        key: 'audience',
        label: { ar: 'الجمهور المستهدف', fr: 'Public cible', en: 'Target audience' },
        placeholder: { ar: 'من يظهر له الإعلان…', fr: 'À qui la pub s’adresse…', en: 'Who the ad targets…' },
        maxLength: 200,
      },
      {
        key: 'platform',
        label: { ar: 'المنصة', fr: 'Plateforme', en: 'Platform' },
        placeholder: { ar: 'فيسبوك، إنستغرام، تيك توك…', fr: 'Facebook, Instagram, TikTok…', en: 'Facebook, Instagram, TikTok…' },
        maxLength: 80,
      },
    ],
  },
  {
    id: 'page-review',
    icon: ClipboardCheck,
    stage: 'improve',
    name: { ar: 'قيّم صفحة منتجك', fr: 'Auditez votre page produit', en: 'Audit Your Product Page' },
    tagline: {
      ar: 'اعرف ماذا يمنع الزائر من الطلب.',
      fr: 'Découvrez ce qui bloque l’achat.',
      en: 'Find what blocks the sale.',
    },
    description: {
      ar: 'درجة، نقاط قوة، عوائق التحويل، عناوين بديلة، وأهم 5 إصلاحات مرتبة.',
      fr: 'Note, forces, blocages de conversion, titres alternatifs et 5 corrections classées.',
      en: 'Score, strengths, conversion blockers, alternative headlines and the top 5 fixes.',
    },
    fields: [
      {
        key: 'pageText',
        label: { ar: 'نص الصفحة', fr: 'Texte de la page', en: 'Page text' },
        placeholder: {
          ar: 'الصق عنوان الصفحة، الوصف، المميزات، السعر، وكل ما يراه الزائر…',
          fr: 'Collez le titre, la description, les caractéristiques, le prix et ce que voit le visiteur…',
          en: 'Paste the title, description, features, price and everything the visitor sees…',
        },
        required: true,
        multiline: true,
        maxLength: 1200,
        rows: 7,
      },
      {
        key: 'product',
        label: { ar: 'المنتج', fr: 'Produit', en: 'Product' },
        placeholder: { ar: 'اسم المنتج والفئة…', fr: 'Nom du produit et catégorie…', en: 'Product name and category…' },
        maxLength: 220,
      },
      {
        key: 'audience',
        label: { ar: 'الجمهور المستهدف', fr: 'Public cible', en: 'Target audience' },
        placeholder: { ar: 'من تريد أن يشتري…', fr: 'Qui doit acheter…', en: 'Who should buy…' },
        maxLength: 220,
      },
      {
        key: 'price',
        label: { ar: 'السعر', fr: 'Prix', en: 'Price' },
        placeholder: { ar: '4 500 دج', fr: '4 500 DA', en: 'DZD 4,500' },
        maxLength: 60,
      },
    ],
  },
  {
    id: 'campaign-doctor',
    icon: Activity,
    stage: 'improve',
    badge: J,
    name: { ar: 'طبيب الحملة', fr: 'Docteur de campagne', en: 'Campaign Doctor' },
    tagline: {
      ar: 'شخّص أرقام الحملة واعرف الخطوة التالية.',
      fr: 'Diagnostiquez les chiffres et la prochaine étape.',
      en: 'Diagnose the numbers and the next step.',
    },
    description: {
      ar: 'يحلل الصرف والظهور والنقرات والطلبات ويحدد الخلل: الإعلان، الجمهور، العرض، الصفحة أم التتبع.',
      fr: 'Analyse dépenses, impressions, clics et commandes pour trouver le vrai blocage.',
      en: 'Analyzes spend, impressions, clicks and orders to find the real bottleneck.',
    },
    fields: [
      {
        key: 'campaignData',
        label: { ar: 'أرقام الحملة', fr: 'Chiffres de la campagne', en: 'Campaign metrics' },
        placeholder: {
          ar: 'الصرف: 10 000 دج، الظهور: 50 000، النقرات: 800، الطلبات: 12، متوسط الطلب: 4 500 دج…',
          fr: 'Dépenses : 10 000 DA, impressions : 50 000, clics : 800, commandes : 12, panier moyen : 4 500 DA…',
          en: 'Spend: DZD 10,000, impressions: 50,000, clicks: 800, orders: 12, AOV: DZD 4,500…',
        },
        required: true,
        multiline: true,
        maxLength: 1200,
        rows: 6,
      },
      {
        key: 'product',
        label: { ar: 'المنتج', fr: 'Produit', en: 'Product' },
        placeholder: { ar: 'المنتج المعلن عنه…', fr: 'Le produit annoncé…', en: 'The advertised product…' },
        maxLength: 220,
      },
      {
        key: 'price',
        label: { ar: 'السعر', fr: 'Prix', en: 'Price' },
        placeholder: { ar: '4 500 دج', fr: '4 500 DA', en: 'DZD 4,500' },
        maxLength: 60,
      },
      {
        key: 'goal',
        label: { ar: 'الهدف', fr: 'Objectif', en: 'Goal' },
        placeholder: { ar: 'خفض تكلفة الطلب، مضاعفة المبيعات…', fr: 'Réduire le coût par commande, doubler les ventes…', en: 'Lower cost per order, double sales…' },
        maxLength: 200,
      },
      {
        key: 'platform',
        label: { ar: 'المنصة', fr: 'Plateforme', en: 'Platform' },
        placeholder: { ar: 'فيسبوك، إنستغرام، تيك توك…', fr: 'Facebook, Instagram, TikTok…', en: 'Facebook, Instagram, TikTok…' },
        maxLength: 80,
      },
    ],
  },
];

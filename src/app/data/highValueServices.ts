/**
 * High-Value Revenue Services - Premium offerings for TechStore
 * These services have higher margins and recurring revenue potential
 */

export interface PremiumService {
  id: string;
  category: 'recurring' | 'project-based' | 'subscription' | 'marketplace';
  nameAr: string;
  nameFr: string;
  nameEn: string;
  shortDescAr: string;
  shortDescFr: string;
  shortDescEn: string;
  fullDescAr?: string;
  fullDescFr?: string;
  fullDescEn?: string;
  basePrice: number; // in DZD
  prices: {
    basic: number;
    standard: number;
    premium: number;
  };
  margin: number; // percentage (0-100)
  recurringMonthly?: number; // for subscription services
  setupFee?: number;
  implementationTime?: string; // e.g., "3-5 days"
  isActive: boolean;
}

export const premiumServices: PremiumService[] = [
  {
    id: 'cloud-hosting',
    category: 'subscription',
    nameAr: 'استضافة سحابية احترافية',
    nameFr: 'Hébergement cloud professionnel',
    nameEn: 'Professional Cloud Hosting',
    shortDescAr: 'استضافة SSD مع نسخ احتياطي يومي ودعم فني 24/7',
    shortDescFr: 'SSD hosting avec sauvegardes quotidiennes et support 24/7',
    shortDescEn: 'SSD hosting with daily backups and 24/7 support',
    basePrice: 1500,
    prices: { basic: 999, standard: 1999, premium: 3999 },
    margin: 65,
    recurringMonthly: 1500, // maintenance fee
    setupFee: 2500,
    implementationTime: 'immediate',
    isActive: true,
  },
  {
    id: 'domain-registry',
    category: 'recurring',
    nameAr: 'تسجيل النطاقات والاستضافة',
    nameFr: 'Enregistrement de domaine et hébergement',
    nameEn: 'Domain Registration & Hosting',
    shortDescAr: 'نطاق .dz، .com، .org مع استضافة مجانية لمدة سنة',
    shortDescFr: 'Domaine .dz, .com, .org avec hébergement gratuit 1 an',
    shortDescEn: '.dz, .com, .org domain with 1 year free hosting',
    basePrice: 500,
    prices: { basic: 399, standard: 799, premium: 1499 },
    margin: 80,
    setupFee: 500,
    implementationTime: 'immediate',
    isActive: true,
  },
  {
    id: 'email-marketing',
    category: 'subscription',
    nameAr: 'التسويق الإيميلي والمailer الآلي',
    nameFr: 'Marketing emailing et mailer automatique',
    nameEn: 'Email Marketing & Automation',
    shortDescAr: 'إعداد campaigns، segments، and newsletter automation',
    shortDescFr: 'Campagnes, segmentation et automatisation newsletter',
    shortDescEn: 'Campaign setup, segmentation, and newsletter automation',
    basePrice: 2000,
    prices: { basic: 1499, standard: 2999, premium: 5999 },
    margin: 70,
    recurringMonthly: 2500,
    setupFee: 3000,
    implementationTime: '2-3 days',
    isActive: true,
  },
  {
    id: 'ecommerce-magento',
    category: 'project-based',
    nameAr: 'متجر إلكتروني على Magento',
    nameFr: 'Boutique e-commerce sur Magento',
    nameEn: 'Magento E-Commerce Store',
    shortDescAr: 'منصة Magento مع بوابة الدفع، إدارة المخزون، and reporting',
    shortDescFr: 'Plateforme Magento avec paiement, gestion stock, et reporting',
    shortDescEn: 'Magento platform with payment gateway, inventory, and reporting',
    basePrice: 80000,
    prices: { basic: 50000, standard: 80000, premium: 150000 },
    margin: 45,
    setupFee: 100000,
    implementationTime: '3-6 weeks',
    isActive: true,
  },
  {
    id: 'seo-audit',
    category: 'project-based',
    nameAr: 'تدقيق وتحسين موقعك لـ SEO',
    nameFr: 'Audit et optimisation SEO de votre site',
    nameEn: 'SEO Audit & Optimization',
    shortDescAr: 'تحليل شامل لتحسين ترتيب الموقع في محركات البحث',
    shortDescFr: 'Analyse complète pour améliorer le classement dans les moteurs de recherche',
    shortDescEn: 'Comprehensive analysis to improve search engine ranking',
    basePrice: 15000,
    prices: { basic: 9999, standard: 15000, premium: 29999 },
    margin: 85,
    setupFee: 20000,
    implementationTime: '5-7 days',
    isActive: true,
  },
  {
    id: 'content-marketing',
    category: 'subscription',
    nameAr: 'توليد المحتوى التسويقي والإعلانات',
    nameFr: 'Production de contenu marketing et publicité',
    nameEn: 'Content Marketing & Ads',
    shortDescAr: 'كتابة مقالات، إنشاء محتوى فيديو، وإدارة الإعلانات المدفوعة',
    shortDescFr: 'Écriture d\'articles, création vidéo, gestion publicités payantes',
    shortDescEn: 'Writing articles, video content creation, and paid ad management',
    basePrice: 2500,
    prices: { basic: 1999, standard: 3499, premium: 6999 },
    margin: 75,
    recurringMonthly: 3000,
    setupFee: 5000,
    implementationTime: 'immediate',
    isActive: true,
  },
  {
    id: 'pos-system',
    category: 'project-based',
    nameAr: 'نظام نقاط البيع والمحاسبة',
    nameFr: 'Système de caisse et comptabilité',
    nameEn: 'POS & Accounting System',
    shortDescAr: 'نظام متكامل لنقاط البيع مع إدارة المخزون، المبيعات، and المحاسبة',
    shortDescFr: 'Système intégré POS avec gestion stock, ventes, et comptabilité',
    shortDescEn: 'Integrated POS system with inventory, sales, and accounting management',
    basePrice: 35000,
    prices: { basic: 25000, standard: 35000, premium: 55000 },
    margin: 60,
    setupFee: 45000,
    implementationTime: '1-2 weeks',
    isActive: true,
  },
  {
    id: 'cctv-network',
    category: 'project-based',
    nameAr: 'تثبيت الشبكات والكاميرات الأمنية',
    nameFr: 'Installation réseaux et caméras de surveillance',
    nameEn: 'CCTV Network Installation',
    shortDescAr: 'نظام كاميرات مراقبة، شبكات محلية، وتحكم عن بعد عبر الهاتف',
    shortDescFr: 'Système caméras surveillance, réseau local, contrôle distant par téléphone',
    shortDescEn: 'CCTV camera system, local network, and remote phone control',
    basePrice: 45000,
    prices: { basic: 30000, standard: 45000, premium: 75000 },
    margin: 55,
    setupFee: 50000,
    implementationTime: '2-4 days',
    isActive: true,
  },
  {
    id: 'ai-consulting',
    category: 'project-based',
    nameAr: 'الاستشارات والدمج الذكي الاصطناعي',
    nameFr: 'Consultance et intégration intelligence artificielle',
    nameEn: 'AI Consulting & Integration',
    shortDescAr: 'دمج Chatbots، تحليلات الذكاء الاصطناعي، وأتمتة العمليات',
    shortDescFr: 'Intégration Chatbots, analyses IA, et automatisation processus',
    shortDescEn: 'Chatbot integration, AI analytics, and process automation',
    basePrice: 100000,
    prices: { basic: 65000, standard: 100000, premium: 250000 },
    margin: 80,
    setupFee: 120000,
    implementationTime: '1-3 weeks',
    isActive: true,
  },
  {
    id: 'training-certification',
    category: 'subscription',
    nameAr: 'دورات تكوين محوسب مع شهادة',
    nameFr: 'Formation informatique avec certification',
    nameEn: 'Computer Training with Certification',
    shortDescAr: 'دورات Excel، Canva، الذكاء الاصطناعي، والبرمجة مع شهادات معتمدة',
    shortDescFr: 'Cours Excel, Canva, IA, programmation avec certifications reconnues',
    shortDescEn: 'Excel, Canva, AI, and programming courses with recognized certifications',
    basePrice: 800,
    prices: { basic: 599, standard: 800, premium: 1499 },
    margin: 70,
    recurringMonthly: 600, // subscription to platform/content
    setupFee: 1000,
    implementationTime: 'immediate',
    isActive: true,
  },
  {
    id: 'website-maintenance',
    category: 'subscription',
    nameAr: 'صيانة وحماية موقعك الإلكتروني',
    nameFr: 'Maintenance et protection de votre site',
    nameEn: 'Website Maintenance & Protection',
    shortDescAr: 'تحديثات أمنية، نسخ احتياطي يومي، مراقبة الأداء، ودعم فني',
    shortDescFr: 'Mises à jour sécurité, sauvegardes quotidiennes, surveillance performance, et support technique',
    shortDescEn: 'Security updates, daily backups, performance monitoring, and technical support',
    basePrice: 1500,
    prices: { basic: 999, standard: 1500, premium: 2999 },
    margin: 75,
    recurringMonthly: 1200,
    setupFee: 2500,
    implementationTime: 'immediate',
    isActive: true,
  },
  {
    id: 'social-media-management',
    category: 'subscription',
    nameAr: 'إدارة السوشيال ميديا والرد على العملاء',
    nameFr: 'Gestion réseaux sociaux et réponse aux clients',
    nameEn: 'Social Media Management & Response',
    shortDescAr: 'إنشاء محتوى، إدارة حسابات، والتواصل مع العملاء 24/7',
    shortDescFr: 'Création contenu, gestion comptes, et communication avec clients 24/7',
    shortDescEn: 'Content creation, account management, and 24/7 customer communication',
    basePrice: 3000,
    prices: { basic: 2499, standard: 3500, premium: 6999 },
    margin: 80,
    recurringMonthly: 3000,
    setupFee: 4000,
    implementationTime: '1-2 days',
    isActive: true,
  },
  {
    id: 'digital-marketing-package',
    category: 'subscription',
    nameAr: 'حزمة التسويق الرقمي الشاملة',
    nameFr: 'Pack marketing digital complet',
    nameEn: 'Comprehensive Digital Marketing Package',
    shortDescAr: 'شامل: استضافة، نطاق، SEO، إعلانات، content، and إدارة سوشيال ميديا',
    shortDescFr: 'Inclusif: hébergement, domaine, SEO, publicités, contenu, et gestion réseaux sociaux',
    shortDescEn: 'Includes: hosting, domain, SEO, ads, content, and social media management',
    basePrice: 8000,
    prices: { basic: 5999, standard: 8999, premium: 14999 },
    margin: 60,
    recurringMonthly: 7500,
    setupFee: 12000,
    implementationTime: '3-5 days',
    isActive: true,
  },
  {
    id: 'business-automation',
    category: 'project-based',
    nameAr: 'أتمتة العمليات التجارية',
    nameFr: 'Automatisation des processus commerciaux',
    nameEn: 'Business Process Automation',
    shortDescAr: 'ربط الأنظمة، أتمتة المبيعات، وخدمة العملاء عبر Chatbots الذكي',
    shortDescFr: 'Intégration systèmes, automatisation ventes, et service clients via Chatbot IA',
    shortDescEn: 'System integration, sales automation, and AI customer service via Chatbots',
    basePrice: 80000,
    prices: { basic: 50000, standard: 80000, premium: 150000 },
    margin: 70,
    setupFee: 100000,
    implementationTime: '2-4 weeks',
    isActive: true,
  },
  {
    id: 'data-analystics',
    category: 'project-based',
    nameAr: 'تحليلات البيانات والتقارير',
    nameFr: 'Analyse de données et rapports',
    nameEn: 'Data Analytics & Reporting',
    shortDescAr: 'تجهير لوحات تحكم، تحليل أداء، وتقارير مبيعات تفاعلية',
    shortDescFr: 'Configuration tableaux de bord, analyse performance, et rapports ventes interactifs',
    shortDescEn: 'Dashboard setup, performance analysis, and interactive sales reports',
    basePrice: 45000,
    prices: { basic: 30000, standard: 45000, premium: 75000 },
    margin: 85,
    setupFee: 60000,
    implementationTime: '1-2 weeks',
    isActive: true,
  },
];

// Calculate total potential revenue per month for active subscription services
export function calculateMonthlyRevenue(services: PremiumService[]): number {
  return services
    .filter((s) => s.isActive && s.recurringMonthly !== undefined)
    .reduce((sum, s) => sum + (s.recurringMonthly || 0), 0);
}

// Get all active services by category
export function getServicesByCategory(category: string): PremiumService[] {
  return premiumServices.filter((s) => s.category === category && s.isActive);
}

// Get setup fees for quote generation
export function getSetupFees(): Record<string, number> {
  return premiumServices
    .filter((s) => s.setupFee !== undefined)
    .reduce((acc, s) => ({ ...acc, [s.id]: s.setupFee }), {});
}

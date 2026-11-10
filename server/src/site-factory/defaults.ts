/**
 * Default templates, packages and factory settings.
 *
 * Everything in this file is editable from the admin panel. The values are
 * upserted on boot, but existing admin edits are never overwritten.
 */

export type Lang = 'ar' | 'fr' | 'en';

export interface Localized {
  ar: string;
  fr: string;
  en: string;
}

export interface TemplateSeed {
  slug: string;
  name: Localized;
  description: Localized;
  category: string;
  accent: string;
  sortOrder: number;
}

export interface PackageSeed {
  slug: string;
  name: Localized;
  description: Localized;
  price: number;
  oldPrice?: number;
  features: Localized[];
  deliveryDays: number;
  revisions: number;
  isPopular: boolean;
  sortOrder: number;
}

export interface FactorySettings {
  ownerName: string;
  ownerPhone: string;
  ownerWhatsapp: string;
  ownerEmail: string;
  ccp: string;
  ccpKey: string;
  baridimob: string;
  bankName: string;
  depositPercent: number;
  paymentNote: Localized;
  customDomainNote: Localized;
}

export const TEMPLATES: TemplateSeed[] = [
  {
    slug: 'store',
    category: 'store',
    accent: '#0b5ed7',
    sortOrder: 1,
    name: { ar: 'متجر إلكتروني', fr: 'Boutique en ligne', en: 'Online Store' },
    description: {
      ar: 'قالب متجر كامل مع المنتجات، السلة، الطلبات، تصفية المنتجات وزر واتساب. مناسب للمتاجر والمحلات.',
      fr: 'Boutique complète avec produits, panier, commandes, filtres et WhatsApp. Idéale pour les commerces.',
      en: 'A complete store with products, cart, orders, filters and WhatsApp. Perfect for shops and retailers.',
    },
  },
  {
    slug: 'company',
    category: 'company',
    accent: '#0f766e',
    sortOrder: 2,
    name: { ar: 'موقع شركة', fr: 'Site d’entreprise', en: 'Company Website' },
    description: {
      ar: 'موقع مؤسسي أنيق لعرض الخدمات، الأرقام، مراحل العمل وطلب عرض سعر. مناسب للشركات والمكاتب.',
      fr: 'Site institutionnel élégant : services, chiffres, processus et demande de devis. Pour entreprises et cabinets.',
      en: 'A polished corporate site with services, stats, process and quote requests. Built for companies and agencies.',
    },
  },
  {
    slug: 'portfolio',
    category: 'portfolio',
    accent: '#7c3aed',
    sortOrder: 3,
    name: { ar: 'معرض أعمال', fr: 'Portfolio', en: 'Portfolio' },
    description: {
      ar: 'قالب إبداعي لعرض المشاريع والمهارات والشهادات مع صفحة تواصل. مناسب للمصممين والمصورين والمطورين.',
      fr: 'Portfolio créatif pour projets, compétences et contact. Pour designers, photographes et développeurs.',
      en: 'A creative portfolio for projects, skills and contact. Ideal for designers, photographers and developers.',
    },
  },
  {
    slug: 'card',
    category: 'card',
    accent: '#db2777',
    sortOrder: 4,
    name: { ar: 'بطاقة أعمال رقمية', fr: 'Carte de visite numérique', en: 'Digital Business Card' },
    description: {
      ar: 'بطاقة رقمية واحدة تجمع الاتصال، واتساب، البريد، الموقع وحفظ جهة الاتصال. مثالية للمهنيين.',
      fr: 'Une carte numérique avec appel, WhatsApp, e-mail, localisation et enregistrement du contact.',
      en: 'One digital card with call, WhatsApp, email, location and save-contact actions. Perfect for professionals.',
    },
  },
  {
    slug: 'restaurant',
    category: 'restaurant',
    accent: '#b45309',
    sortOrder: 5,
    name: { ar: 'مطعم / مقهى', fr: 'Restaurant / Café', en: 'Restaurant / Café' },
    description: {
      ar: 'قائمة طعام رقمية، أوقات العمل، الموقع، حجز طاولة وطلب عبر واتساب. مناسب للمطاعم والمقاهي.',
      fr: 'Menu numérique, horaires, adresse, réservation et commande WhatsApp. Pour restaurants et cafés.',
      en: 'Digital menu, opening hours, location, table reservation and WhatsApp ordering. For restaurants and cafés.',
    },
  },
  {
    slug: 'landing',
    category: 'landing',
    accent: '#ea580c',
    sortOrder: 6,
    name: { ar: 'صفحة هبوط', fr: 'Page de vente', en: 'Landing Page' },
    description: {
      ar: 'صفحة تسويقية مركزة تحوّل الزوار إلى عملاء: عرض، مزايا، آراء، أسئلة شائعة ونموذج طلب.',
      fr: 'Une page de conversion : offre, avantages, témoignages, FAQ et formulaire de contact.',
      en: 'A conversion-focused page: offer, benefits, testimonials, FAQ and a lead form.',
    },
  },
  {
    slug: 'medical',
    category: 'medical',
    accent: '#0ea5e9',
    sortOrder: 7,
    name: { ar: 'عيادة / طبيب', fr: 'Cabinet médical', en: 'Medical Clinic' },
    description: {
      ar: 'موقع طبيب أو عيادة: التخصصات، أوقات العمل، حجز موعد، الموقع واتصال مباشر. ثقة واحترافية.',
      fr: 'Site médecin ou clinique : spécialités, horaires, rendez-vous, localisation et contact direct.',
      en: 'Doctor or clinic site: specialties, opening hours, appointment booking, location and direct call.',
    },
  },
  {
    slug: 'pharmacy',
    category: 'pharmacy',
    accent: '#16a34a',
    sortOrder: 8,
    name: { ar: 'صيدلية', fr: 'Pharmacie', en: 'Pharmacy' },
    description: {
      ar: 'صيدلية مع عرض المنتجات، الخدمات، أوقات العمل، الطلب عبر واتساب والموقع على الخريطة.',
      fr: 'Pharmacie avec produits, services, horaires, commande WhatsApp et localisation sur la carte.',
      en: 'Pharmacy with products, services, opening hours, WhatsApp ordering and map location.',
    },
  },
  {
    slug: 'lawyer',
    category: 'lawyer',
    accent: '#334155',
    sortOrder: 9,
    name: { ar: 'محاماة / محاسب', fr: 'Avocat / Comptable', en: 'Lawyer / Accountant' },
    description: {
      ar: 'موقع مكتب محاماة أو محاسبة: التخصصات، الخبرة، طلب استشارة واستمارة تواصل.',
      fr: 'Site cabinet d\'avocat ou comptable : domaines, expérience, demande de consultation et contact.',
      en: 'Law or accounting firm site: practice areas, experience, consultation request and contact form.',
    },
  },
  {
    slug: 'realestate',
    category: 'realestate',
    accent: '#0f766e',
    sortOrder: 10,
    name: { ar: 'وكالة عقارية', fr: 'Agence immobilière', en: 'Real Estate Agency' },
    description: {
      ar: 'وكالة عقارية مع عرض العقارات، البيع والإيجار، المعرض، الطلب والموقع.',
      fr: 'Agence immobilière avec annonces, vente et location, galerie et demande de visite.',
      en: 'Real estate agency with listings, sale and rent, gallery and viewing requests.',
    },
  },
  {
    slug: 'education',
    category: 'education',
    accent: '#2563eb',
    sortOrder: 11,
    name: { ar: 'مدرسة / مركز تكوين', fr: 'École / Formation', en: 'School / Training' },
    description: {
      ar: 'موقع مدرسة أو مركز تكوين: البرامج، الأساتذة، التسجيل، الآراء ومعلومات الاتصال.',
      fr: 'Site école ou centre de formation : programmes, formateurs, inscription, avis et contact.',
      en: 'School or training center site: programs, instructors, enrollment, reviews and contact.',
    },
  },
  {
    slug: 'fitness',
    category: 'fitness',
    accent: '#dc2626',
    sortOrder: 12,
    name: { ar: 'قاعة رياضة', fr: 'Salle de sport', en: 'Gym / Fitness' },
    description: {
      ar: 'صفحة قاعة رياضة: البرامج والاشتراكات، المدربون، أوقات العمل والتسجيل عبر واتساب.',
      fr: 'Page salle de sport : programmes, abonnements, coachs, horaires et inscription WhatsApp.',
      en: 'Gym landing page: programs, memberships, coaches, hours and WhatsApp sign-up.',
    },
  },
  {
    slug: 'beauty',
    category: 'beauty',
    accent: '#db2777',
    sortOrder: 13,
    name: { ar: 'صالون تجميل', fr: 'Salon de beauté', en: 'Beauty Salon' },
    description: {
      ar: 'صالون تجميل وحلاقة: الخدمات، معرض الأعمال، قائمة الأسعار وحجز موعد.',
      fr: 'Salon de beauté et coiffure : services, galerie, tarifs et réservation de rendez-vous.',
      en: 'Beauty and hair salon: services, gallery, price list and appointment booking.',
    },
  },
  {
    slug: 'photography',
    category: 'photography',
    accent: '#7c3aed',
    sortOrder: 14,
    name: { ar: 'مصور فوتوغرافي', fr: 'Photographe', en: 'Photographer' },
    description: {
      ar: 'معرض صور احترافي للمصورين: الأعمال، الباقات، آراء العملاء وطلب حجز.',
      fr: 'Portfolio photo professionnel : réalisations, formules, avis et demande de réservation.',
      en: 'Professional photo portfolio: works, packages, client reviews and booking requests.',
    },
  },
  {
    slug: 'wedding',
    category: 'wedding',
    accent: '#c026d3',
    sortOrder: 15,
    name: { ar: 'تنظيم أعراس ومناسبات', fr: 'Mariage / Événementiel', en: 'Wedding Planner' },
    description: {
      ar: 'موقع تنظيم أعراس: الخدمات، معرض الصور، الباقات ونموذج طلب عرض السعر.',
      fr: 'Site organisation de mariages : services, galerie, formules et demande de devis.',
      en: 'Wedding planning site: services, gallery, packages and quote request form.',
    },
  },
  {
    slug: 'travel',
    category: 'travel',
    accent: '#0891b2',
    sortOrder: 16,
    name: { ar: 'وكالة سياحة وسفر', fr: 'Agence de voyage', en: 'Travel Agency' },
    description: {
      ar: 'وكالة أسفار: العروض والرحلات، الفنادق، البرامج وحجز عبر واتساب.',
      fr: 'Agence de voyage : offres, circuits, hôtels, programmes et réservation WhatsApp.',
      en: 'Travel agency: offers, tours, hotels, programs and WhatsApp booking.',
    },
  },
  {
    slug: 'construction',
    category: 'construction',
    accent: '#b45309',
    sortOrder: 17,
    name: { ar: 'مقاولات وبناء', fr: 'Construction / BTP', en: 'Construction' },
    description: {
      ar: 'شركة بناء ومقاولات: الخدمات، المشاريع المنجزة، الضمانات وطلب عرض سعر.',
      fr: 'Entreprise BTP : services, réalisations, garanties et demande de devis.',
      en: 'Construction company: services, completed projects, guarantees and quote requests.',
    },
  },
  {
    slug: 'showroom',
    category: 'showroom',
    accent: '#0f172a',
    sortOrder: 26,
    name: { ar: 'صالة عرض سيارات', fr: 'Showroom Automobile', en: 'Car Showroom' },
    description: {
      ar: 'صالة عرض سيارات فاخرة مع تشكيلة من السيارات الجديدة والمستعملة، خيارات التقسيط، وطلب عرض سعر عبر واتساب.',
      fr: 'Showroom automobile de luxe avec une gamme de voitures neuves et d\'occasion, options de financement et demande de devis WhatsApp.',
      en: 'Luxury car showroom with new and used cars, financing options and WhatsApp quote request.',
    },
  },
  {
    slug: 'clinic',
    category: 'clinic',
    accent: '#059669',
    sortOrder: 27,
    name: { ar: 'مركز طبي متخصص / عيادات أسنان', fr: 'Centre Médical / Cabinet Dentaire', en: 'Medical Center / Dental Clinic' },
    description: {
      ar: 'مركز طبي متخصص مع عيادات أسنان، تحليلات طبية، باقات كشف دورية، وحجز موعد عبر واتساب.',
      fr: 'Centre médical spécialisé avec cabinet dentaire, analyses médicales, forfaits de contrôle et prise de rendez-vous WhatsApp.',
      en: 'Specialized medical center with dental clinic, lab tests, check-up packages and WhatsApp appointment booking.',
    },
  },
  {
    slug: 'digital',
    category: 'digital',
    accent: '#6d28d9',
    sortOrder: 28,
    name: { ar: 'منتجات رقمية', fr: 'Produits numériques', en: 'Digital Products' },
    description: {
      ar: 'متجر منتجات رقمية احترافي: قوالب، كتب إلكترونية، دورات وأدوات مع تحميل فوري، ترخيص واضح وتجربة شراء سهلة.',
      fr: 'Boutique de produits numériques : modèles, e-books, formations et outils avec téléchargement instantané, licence claire et parcours d’achat fluide.',
      en: 'Professional digital product store: templates, e-books, courses and tools with instant download, clear licensing and a smooth buying experience.',
    },
  },
  {
    slug: 'gym',
    category: 'gym',
    accent: '#a16207',
    sortOrder: 29,
    name: { ar: 'صالة رياضية فاخرة', fr: 'Salle de sport de luxe', en: 'Luxury Gym' },
    description: {
      ar: 'نادٍ رياضي فاخر: البرامج، جدول الحصص، العضويات، المدربون، المرافق ونموذج اشتراك.',
      fr: 'Club de sport haut de gamme : programmes, planning, abonnements, coachs, installations et demande d’adhésion.',
      en: 'Luxury fitness club: programs, class schedule, memberships, coaches, facilities and membership request form.',
    },
  },
  {
    slug: 'boutique',
    category: 'boutique',
    accent: '#a87b3f',
    sortOrder: 30,
    name: { ar: 'بوتيك أزياء ومجوهرات فاخرة', fr: 'Boutique mode & joaillerie', en: 'Luxury Fashion & Jewelry Boutique' },
    description: {
      ar: 'بوتيك فاخر للأزياء والمجوهرات: مجموعات، قطع محدودة، لوك بوك، نموذج حجز موعد تسوق خاص وطلب عبر واتساب.',
      fr: 'Boutique de luxe mode et joaillerie : collections, pièces limitées, lookbook, rendez-vous privé et commande WhatsApp.',
      en: 'Luxury fashion and jewelry boutique: collections, limited pieces, lookbook, private appointment form and WhatsApp ordering.',
    },
  },
  {
    slug: 'saas',
    category: 'saas',
    accent: '#2563eb',
    sortOrder: 31,
    name: { ar: 'شركة SaaS / منصة سحابية', fr: 'SaaS / Plateforme cloud', en: 'SaaS / Cloud Platform' },
    description: {
      ar: 'موقع منصة SaaS: مزايا المنتج، لوحة التحكم، خطط الأسعار، خطوات البدء، نموذج تجربة مجانية وأسئلة شائعة.',
      fr: 'Site SaaS : fonctionnalités, tableau de bord, tarifs, étapes de démarrage, essai gratuit et FAQ.',
      en: 'SaaS platform site: product features, dashboard showcase, pricing plans, onboarding steps, free trial form and FAQ.',
    },
  },
  {
    slug: 'bistro',
    category: 'bistro',
    accent: '#9f1239',
    sortOrder: 32,
    name: { ar: 'مطعم / كافيه فاخر', fr: 'Restaurant / Café gastronomique', en: 'Luxury Restaurant / Café' },
    description: {
      ar: 'مطعم فاخر: قصة المطعم، قائمة موسمية بفلاتر، فريق المطبخ، معرض صور، آراء الزوار ونموذج حجز طاولة.',
      fr: 'Restaurant gastronomique : histoire, carte de saison filtrable, brigade, galerie, avis et réservation de table.',
      en: 'Fine dining restaurant: story, filterable seasonal menu, kitchen team, gallery, guest reviews and table reservation form.',
    },
  },
  {
    slug: 'agency',
    category: 'agency',
    accent: '#f43f5e',
    sortOrder: 33,
    name: { ar: 'وكالة تسويق رقمي', fr: 'Agence marketing digital', en: 'Digital Marketing Agency' },
    description: {
      ar: 'موقع وكالة تسويق: الخدمات، دراسات حالة بأرقام، منهجية العمل، الفريق، آراء العملاء ونموذج طلب عرض سعر.',
      fr: 'Site d’agence marketing : services, études de cas chiffrées, méthode, équipe, avis clients et demande de devis.',
      en: 'Marketing agency site: services, case studies with numbers, process, team, client reviews and quote request form.',
    },
  },
  {
    slug: 'cleaning',
    category: 'cleaning',
    accent: '#0ea5e9',
    sortOrder: 34,
    name: { ar: 'شركة تنظيف وصيانة منازل', fr: 'Nettoyage & entretien à domicile', en: 'Home Cleaning & Maintenance' },
    description: {
      ar: 'موقع شركة تنظيف: الخدمات، الباقات، خطوات الحجز، الضمانات، آراء العملاء ونموذج حجز موعد.',
      fr: 'Site de nettoyage : services, formules, étapes de réservation, garanties, avis clients et demande de rendez-vous.',
      en: 'Home cleaning company site: services, packages, booking steps, guarantees, client reviews and appointment form.',
    },
  },
  {
    slug: 'car-showroom-dz',
    category: 'showroom',
    accent: '#c81622',
    sortOrder: 35,
    name: { ar: 'معرض سيارات صينية — الجزائر', fr: 'Showroom Auto Chinois — Algérie', en: 'Chinese Car Showroom — Algeria' },
    description: {
      ar: 'معرض سيارات صينية في الجزائر: بيكانتو، جيتور، شيري، شانجان وجيلي بأسعار السوق الجزائرية، تقسيط ميسّر، ضمان المصنع وطلب عرض سعر عبر واتساب.',
      fr: 'Showroom de voitures chinoises en Algérie : Picanto, Jetour, Chery, Changan et Geely aux prix du marché algérien, financement, garantie et devis via WhatsApp.',
      en: 'Chinese car showroom in Algeria: Picanto, Jetour, Chery, Changan and Geely at Algerian market prices, easy financing, factory warranty and WhatsApp quote requests.',
    },
  },
  {
    slug: 'agriculture',
    category: 'agriculture',
    accent: '#4d7c0f',
    sortOrder: 18,
    name: { ar: 'فلاحة ومنتجات طبيعية', fr: 'Agriculture / Produits', en: 'Agriculture / Farm' },
    description: {
      ar: 'مزرعة أو منتجات فلاحية: المنتجات، الأسعار، الطلب المباشر وقصة المشروع.',
      fr: 'Ferme ou produits agricoles : produits, prix, commande directe et histoire du projet.',
      en: 'Farm or agricultural products: products, prices, direct ordering and project story.',
    },
  },
  {
    slug: 'hotel',
    category: 'hotel',
    accent: '#92400e',
    sortOrder: 25,
    name: { ar: 'فندق / منتجع سياحي', fr: 'Hôtel / Resort', en: 'Hotel / Resort' },
    description: {
      ar: 'فندق ومنتجع سياحي مع غرف وأجنحة، خدمات الضيافة، الحجز عبر واتساب ومعرض صور فاخرة.',
      fr: 'Hôtel et resort avec chambres et suites, services d\'hospitalité, réservation WhatsApp et galerie photos haut de gamme.',
      en: 'Hotel and resort with rooms and suites, hospitality services, WhatsApp booking and luxury photo gallery.',
    },
  },
  {
    slug: 'electronics',
    category: 'electronics',
    accent: '#1d4ed8',
    sortOrder: 19,
    name: { ar: 'متجر إلكترونيات', fr: 'Magasin électronique', en: 'Electronics Store' },
    description: {
      ar: 'متجر إلكترونيات وهواتف: المنتجات، الفئات، السلة، الطلب والضمان.',
      fr: 'Magasin électronique et téléphonie : produits, catégories, panier, commande et garantie.',
      en: 'Electronics and phone store: products, categories, cart, ordering and warranty.',
    },
  },
  {
    slug: 'fashion',
    category: 'fashion',
    accent: '#be123c',
    sortOrder: 20,
    name: { ar: 'أزياء وملابس', fr: 'Mode / Vêtements', en: 'Fashion / Clothing' },
    description: {
      ar: 'متجر أزياء وملابس: تشكيلة المنتجات، المقاسات، السلة والطلب عبر واتساب.',
      fr: 'Boutique mode et vêtements : collection, tailles, panier et commande WhatsApp.',
      en: 'Fashion and clothing store: collection, sizes, cart and WhatsApp ordering.',
    },
  },
  {
    slug: 'bakery',
    category: 'bakery',
    accent: '#d97706',
    sortOrder: 21,
    name: { ar: 'مخبزة وحلويات', fr: 'Boulangerie / Pâtisserie', en: 'Bakery / Pastry' },
    description: {
      ar: 'مخبزة أو محل حلويات: القائمة، الطلبات الخاصة، أوقات العمل وطلب عبر واتساب.',
      fr: 'Boulangerie ou pâtisserie : menu, commandes spéciales, horaires et commande WhatsApp.',
      en: 'Bakery or pastry shop: menu, custom orders, hours and WhatsApp ordering.',
    },
  },
  {
    slug: 'carrental',
    category: 'carrental',
    accent: '#475569',
    sortOrder: 22,
    name: { ar: 'كراء سيارات', fr: 'Location de voitures', en: 'Car Rental' },
    description: {
      ar: 'وكالة كراء سيارات: الأسطول، الأسعار اليومية، الشروط وحجز مباشر.',
      fr: 'Agence de location : flotte, tarifs journaliers, conditions et réservation directe.',
      en: 'Car rental agency: fleet, daily rates, conditions and direct booking.',
    },
  },
  {
    slug: 'nonprofit',
    category: 'nonprofit',
    accent: '#059669',
    sortOrder: 23,
    name: { ar: 'جمعية خيرية', fr: 'Association', en: 'Non-profit' },
    description: {
      ar: 'موقع جمعية: المهمة، المشاريع، التطوع، التبرع ومعلومات التواصل.',
      fr: 'Site association : mission, projets, bénévolat, don et contact.',
      en: 'Non-profit site: mission, projects, volunteering, donation and contact.',
    },
  },
  {
    slug: 'events',
    category: 'events',
    accent: '#9333ea',
    sortOrder: 24,
    name: { ar: 'تنظيم فعاليات', fr: 'Organisation d\'événements', en: 'Event Planning' },
    description: {
      ar: 'شركة تنظيم فعاليات: الخدمات، الأعمال السابقة، الباقات وطلب عرض سعر.',
      fr: 'Société événementielle : services, réalisations, formules et demande de devis.',
      en: 'Event planning company: services, past work, packages and quote requests.',
    },
  },
];

export const PACKAGES: PackageSeed[] = [
  {
    slug: 'basic',
    price: 25000,
    deliveryDays: 3,
    revisions: 2,
    isPopular: false,
    sortOrder: 1,
    name: { ar: 'الباقة الأساسية', fr: 'Essentiel', en: 'Essential' },
    description: {
      ar: 'موقع احترافي من 3 صفحات، مناسب للبداية وحضورك الأول على الإنترنت.',
      fr: 'Un site professionnel de 3 pages pour démarrer votre présence en ligne.',
      en: 'A professional 3-page website to start your online presence.',
    },
    features: [
      { ar: 'نطاق فرعي مجاني name.pages.dev', fr: 'Sous-domaine gratuit name.pages.dev', en: 'Free name.pages.dev subdomain' },
      { ar: '3 صفحات + صفحة تواصل', fr: '3 pages + page contact', en: '3 pages + contact page' },
      { ar: 'تصميم متجاوب مع الهاتف', fr: 'Design responsive mobile', en: 'Mobile-responsive design' },
      { ar: '3 لغات: عربي / فرنسي / إنجليزي', fr: '3 langues : AR / FR / EN', en: '3 languages: AR / FR / EN' },
      { ar: 'زر واتساب وخرائط Google', fr: 'Bouton WhatsApp + Google Maps', en: 'WhatsApp button + Google Maps' },
      { ar: 'تحسين SEO أساسي', fr: 'SEO de base', en: 'Basic SEO' },
      { ar: 'تعديلان مجاناً', fr: '2 révisions gratuites', en: '2 free revisions' },
      { ar: 'تسليم خلال 3 أيام', fr: 'Livraison en 3 jours', en: 'Delivery in 3 days' },
    ],
  },
  {
    slug: 'business',
    price: 45000,
    deliveryDays: 5,
    revisions: 4,
    isPopular: true,
    sortOrder: 2,
    name: { ar: 'باقة الأعمال', fr: 'Business', en: 'Business' },
    description: {
      ar: 'الأكثر طلباً: موقع كامل يعرض خدماتك ويستقبل طلبات العملاء مع تحسين محركات البحث.',
      fr: 'La plus demandée : un site complet avec services, demandes clients et SEO avancé.',
      en: 'The most popular: a full site with services, lead capture and stronger SEO.',
    },
    features: [
      { ar: 'كل ما في الباقة الأساسية', fr: 'Tout l’Essentiel inclus', en: 'Everything in Essential' },
      { ar: '5 صفحات احترافية', fr: '5 pages professionnelles', en: '5 professional pages' },
      { ar: 'نموذج طلبات + إشعار واتساب', fr: 'Formulaire + notification WhatsApp', en: 'Lead form + WhatsApp notification' },
      { ar: 'معرض صور وأعمال', fr: 'Galerie photos et réalisations', en: 'Photo & work gallery' },
      { ar: 'خريطة وأوقات العمل', fr: 'Carte et horaires', en: 'Map & opening hours' },
      { ar: 'تحسين SEO متقدم + Open Graph', fr: 'SEO avancé + Open Graph', en: 'Advanced SEO + Open Graph' },
      { ar: '4 تعديلات مجاناً', fr: '4 révisions gratuites', en: '4 free revisions' },
      { ar: 'تسليم خلال 5 أيام', fr: 'Livraison en 5 jours', en: 'Delivery in 5 days' },
    ],
  },
  {
    slug: 'pro',
    price: 75000,
    deliveryDays: 7,
    revisions: 7,
    isPopular: false,
    sortOrder: 3,
    name: { ar: 'الباقة الاحترافية', fr: 'Pro', en: 'Pro' },
    description: {
      ar: 'للمتاجر والمشاريع الجادة: سلة وطلبات، إدارة منتجات، ربط نطاقك الخاص ودعم موسّع.',
      fr: 'Pour les boutiques et projets sérieux : panier, commandes, gestion produits, domaine et support.',
      en: 'For serious stores and projects: cart, orders, product management, custom domain and support.',
    },
    features: [
      { ar: 'كل ما في باقة الأعمال', fr: 'Tout Business inclus', en: 'Everything in Business' },
      { ar: 'متجر إلكتروني كامل مع سلة وطلبات', fr: 'Boutique complète avec panier et commandes', en: 'Full store with cart & orders' },
      { ar: 'إدارة المنتجات والأسعار', fr: 'Gestion des produits et prix', en: 'Product & price management' },
      { ar: 'ربط نطاقك الخاص (تشترى باسمك)', fr: 'Votre domaine personnalisé', en: 'Your own custom domain' },
      { ar: 'أرشفة الطلبات وتصديرها', fr: 'Archivage et export des commandes', en: 'Order archive & export' },
      { ar: 'تحسين SEO متقدم + خريطة موقع', fr: 'SEO avancé + sitemap', en: 'Advanced SEO + sitemap' },
      { ar: '7 تعديلات مجاناً', fr: '7 révisions gratuites', en: '7 free revisions' },
      { ar: 'دعم 90 يوماً + أولوية التنفيذ', fr: 'Support 90 jours + priorité', en: '90-day support + priority' },
    ],
  },
];

export const DEFAULT_FACTORY_SETTINGS: FactorySettings = {
  ownerName: 'AOS TECH STORE',
  ownerPhone: '0674113290',
  ownerWhatsapp: '213674113290',
  ownerEmail: 'ayoub.office.services@gmail.com',
  // Filled by the owner from the admin panel before promoting the service.
  ccp: '',
  ccpKey: '',
  baridimob: '',
  bankName: 'Algérie Poste',
  depositPercent: 50,
  paymentNote: {
    ar: 'بعد إرسال الطلب سنتواصل معك عبر واتساب لتأكيد التفاصيل. يتم دفع 50% مقدماً و50% عند تسليم الموقع. أرسل صورة الوصل عبر واتساب أو من صفحة تتبع الطلب.',
    fr: 'Après votre demande, nous vous contacterons sur WhatsApp pour confirmer. Paiement 50% à la commande et 50% à la livraison. Envoyez le reçu via WhatsApp ou depuis le suivi.',
    en: 'After submitting, we will contact you on WhatsApp to confirm. Pay 50% upfront and 50% on delivery. Send the receipt via WhatsApp or the tracking page.',
  },
  customDomainNote: {
    ar: 'يمكنك ربط نطاقك الخاص (مثل .com أو .dz) بعد الشراء من أي مزود. الربط مجاني، والنطاق يبقى ملكك.',
    fr: 'Vous pouvez connecter votre propre domaine (.com ou .dz) acheté chez n’importe quel registrar. La connexion est gratuite et le domaine reste votre propriété.',
    en: 'You can connect your own domain (.com or .dz) bought from any registrar. Connection is free and the domain stays yours.',
  },
};

export const RESERVED_SUBDOMAINS = new Set([
  'www', 'mail', 'email', 'smtp', 'ftp', 'api', 'admin', 'app', 'dashboard',
  'support', 'help', 'status', 'dev', 'staging', 'test', 'demo', 'blog',
  'shop', 'store', 'pay', 'payment', 'cdn', 'assets', 'static', 'images',
  'login', 'signup', 'auth', 'account', 'billing', 'files', 'download',
  'cloudflare', 'pages', 'workers', 'docs', 'ns1', 'ns2', 'mx', 'root',
  'aostech', 'aos', 'ayoub', 'ayoub-office', 'contact', 'info', 'sales',
]);

export function pickLocalized(value: Localized | null | undefined, lang: Lang, fallback = ''): string {
  if (!value) return fallback;
  return value[lang] || value.ar || value.fr || value.en || fallback;
}

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
      fr: 'Site cabinet d’avocat ou comptable : domaines, expérience, demande de consultation et contact.',
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
      fr: 'Showroom automobile de luxe avec une gamme de voitures neuves et d’occasion, options de financement et demande de devis WhatsApp.',
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
      fr: 'Hôtel et resort avec chambres et suites, services d’hospitalité, réservation WhatsApp et galerie photos haut de gamme.',
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
    name: { ar: 'تنظيم فعاليات', fr: 'Organisation d’événements', en: 'Event Planning' },
    description: {
      ar: 'شركة تنظيم فعاليات: الخدمات، الأعمال السابقة، الباقات وطلب عرض سعر.',
      fr: 'Société événementielle : services, réalisations, formules et demande de devis.',
      en: 'Event planning company: services, past work, packages and quote requests.',
    },
  },
  // ========== NEW POWERFUL VISUAL TEMPLATES ==========
  {
    slug: 'dark-gallery',
    category: 'visual',
    accent: '#1e293b',
    sortOrder: 40,
    name: { ar: 'معرض أعمال داكن فاخر', fr: 'Dark Gallery Luxe', en: 'Dark Gallery' },
    description: {
      ar: 'قالب بصري قوي مع خلفية داكنة وتأثيرات ضوئية، مثالي لعرض الأعمال الفنية والصور الفوتوغرافية الفاخرة.',
      fr: 'Visuel puissant avec fond sombre et effets lumineux, idéal pour les œuvres d’art et la photographie de luxe.',
      en: 'Strong visual with dark background and light effects. Perfect for art exhibitions and luxury photography.',
    },
  },
  {
    slug: 'gradient-corporate',
    category: 'visual',
    accent: '#6366f1',
    sortOrder: 41,
    name: { ar: 'شركة بتدرجات ملونة', fr: 'Gradient Corporate', en: 'Gradient Corporate' },
    description: {
      ar: 'تصميم مؤسسي مع تدرجات لونية عصرية وتأثيرات زجاجية، مناسب للشركات التقنية والابتكارية.',
      fr: 'Design corporate avec dégradés modernes et effets de verre, pour les entreprises tech et innovantes.',
      en: 'Modern gradient and glassmorphism effects. Built for tech companies and innovative businesses.',
    },
  },
  {
    slug: 'minimalist-portfolio',
    category: 'visual',
    accent: '#000000',
    sortOrder: 42,
    name: { ar: 'معرض أعمال بخلفية بيضاء', fr: 'Minimal Portfolio', en: 'Minimalist Portfolio' },
    description: {
      ar: 'تصميم مينيماليست أنيق مع تباين عالي وعناصر نظيفة، مثالي للمصممين والمطورين والفنانين.',
      fr: 'Design épuré avec fort contraste et éléments propres, idéal pour designers, développeurs et artistes.',
      en: 'Clean minimal design with high contrast. Perfect for designers, developers and artists.',
    },
  },
  {
    slug: 'bold-branding',
    category: 'visual',
    accent: '#ef4444',
    sortOrder: 43,
    name: { ar: 'علامة تجارية جريئة', fr: 'Bold Branding', en: 'Bold Branding' },
    description: {
      ar: 'قالب قوي بصري مع ألوان مشبعة وخطوط عريضة وتأثيرات حركية، مناسب للعلامات التجارية الشابة.',
      fr: 'Visuel fort avec couleurs saturées, polices larges et effets de mouvement, pour les marques jeunes.',
      en: 'Strong visual with saturated colors and bold typography. Built for young, dynamic brands.',
    },
  },
  {
    slug: 'neumorphic',
    category: 'visual',
    accent: '#64748b',
    sortOrder: 44,
    name: { ar: 'تصميم نيومورفيز', fr: 'Neumorphism', en: 'Neumorphic Design' },
    description: {
      ar: 'قالب حديث مع تأثيرات ظل ناعمة وتصميم ثلاثي الأبعاد مبهر، مناسب للتطبيقات والأدوات الرقمية.',
      fr: 'Design moderne avec ombres douces et effet 3D attrayant, pour applications et outils digitaux.',
      en: 'Modern soft shadows and 3D effects. Perfect for apps and digital tools.',
    },
  },
  {
    slug: 'vibrant-commerce',
    category: 'visual',
    accent: '#f97316',
    sortOrder: 45,
    name: { ar: 'متجر بألوان حيوية', fr: 'Vibrant Commerce', en: 'Vibrant Commerce' },
    description: {
      ar: 'قالب متجر بتصميم ملون ومميز مع تأثيرات بصرية قوية، مثالي للتسويق والحملات التسويقية.',
      fr: 'Boutique avec design coloré et distinctif, effets visuels forts pour le marketing.',
      en: 'Colorful and distinctive store template with strong visual effects. Ideal for marketing campaigns.',
    },
  },
  {
    slug: 'elegant-portfolio',
    category: 'visual',
    accent: '#8b5cf6',
    sortOrder: 46,
    name: { ar: 'معرض أعمال أنيق', fr: 'Elegant Portfolio', en: 'Elegant Portfolio' },
    description: {
      ar: 'تصميم أنيق وفخم مع خطوط رقيقة ومعرض صور منسق، مناسب للمصممين والمصورين والعملاء الفخمين.',
      fr: 'Design élégant et luxueux avec des lignes fines et une galerie photos organisée, pour clients haut de gamme.',
      en: 'Elegant and luxurious design with thin lines and organized gallery. Built for premium clients.',
    },
  },
  {
    slug: 'tech-dashboard',
    category: 'visual',
    accent: '#06b6d4',
    sortOrder: 47,
    name: { ar: 'لوحة تحكم تقنية', fr: 'Tech Dashboard', en: 'Tech Dashboard' },
    description: {
      ar: 'واجهة لوحة تحكم عصرية مع رسومات بيانية وأرقام، مثالي لمنصات SaaS والتطبيقات التقنية.',
      fr: 'Interface moderne avec graphiques et chiffres, idéale pour les plateformes SaaS et applications tech.',
      en: 'Modern dashboard interface with charts and numbers. Built for SaaS platforms and tech apps.',
    },
  },
  {
    slug: 'storyteller',
    category: 'visual',
    accent: '#10b981',
    sortOrder: 48,
    name: { ar: 'رواية القصة', fr: 'Storytelling', en: 'Storyteller' },
    description: {
      ar: 'قالب سردي مع أقسام متدفقة وقصصية، مناسب للمدونين وصناع المحتوى والحملات.',
      fr: 'Design narratif avec sections fluides et storytelling, pour blogueurs et campagnes.',
      en: 'Narrative design with flowing sections. Perfect for storytellers and content campaigns.',
    },
  },
  {
    slug: 'premium-lifestyle',
    category: 'visual',
    accent: '#78716c',
    sortOrder: 49,
    name: { ar: 'نمط حياة فاخر', fr: 'Premium Lifestyle', en: 'Premium Lifestyle' },
    description: {
      ar: 'تصميم حياة فاخر مع تباين ناعم وتأثيرات ذهبية، مناسب لعلامات الأزياء وأسلوب الحياة الفاخر.',
      fr: 'Design de luxe avec contraste doux et effets dorés, pour marques mode et lifestyle premium.',
      en: 'Luxury design with soft contrast and gold effects. Built for fashion brands and premium lifestyle.',
    },
  },
  {
    slug: 'bold-portfolio',
    category: 'visual',
    accent: '#ec4899',
    sortOrder: 50,
    name: { ar: 'معرض أعمال جريء', fr: 'Bold Portfolio', en: 'Bold Portfolio' },
    description: {
      ar: 'قالب قوي وجريء مع ألوان مشبعة وعناصر كبيرة، مثالي للشخصيات المبتكرة والمبدعين.',
      fr: 'Visuel fort et audacieux avec couleurs saturées et grands éléments, pour créatifs et innovants.',
      en: 'Strong and bold template with saturated colors. Built for innovative creatives and character brands.',
    },
  },
  // ========== ADDITIONAL POWERFUL VISUAL & NICHE TEMPLATES ==========
  {
    slug: 'automotive-service',
    category: 'automotive',
    accent: '#dc2626',
    sortOrder: 51,
    name: { ar: 'خدمة صيانة سيارات', fr: 'Auto Service', en: 'Automotive Service' },
    description: {
      ar: 'ورشة صيانة وخدمات سيارات: الخدمات، الماركات، التقسيط، آراء العملاء وحجز موعد.',
      fr: 'Garage et services automobiles : services, marques, financement, avis et réservation.',
      en: 'Auto repair and service shop: services, brands, financing, reviews and appointment booking.',
    },
  },
  {
    slug: 'auto-tuning',
    category: 'automotive',
    accent: '#475569',
    sortOrder: 52,
    name: { ar: 'تعديل وقطع غيار سيارات', fr: 'Car Tuning & Parts', en: 'Auto Tuning & Parts' },
    description: {
      ar: 'محل بيع قطع غيار وتعديل أجزاء سيارات مع عرض القطع، الفئات وطلب عبر واتساب.',
      fr: 'Pièces automobiles et tuning : catalogues, catégories et commande WhatsApp.',
      en: 'Auto parts and tuning shop: parts catalog, categories and WhatsApp ordering.',
    },
  },
  {
    slug: 'insurance-company',
    category: 'automotive',
    accent: '#0ea5e9',
    sortOrder: 53,
    name: { ar: 'شركة تأمين سيارات', fr: 'Assurance Auto', en: 'Car Insurance' },
    description: {
      ar: 'شركة تأمين للسيارات: التغطية، الأسعار، العروض والطلب المباشر.',
      fr: 'Assurance automobile : couvertures, tarifs, offres et demande directe.',
      en: 'Car insurance company: coverage options, rates, deals and instant quote request.',
    },
  },
  {
    slug: 'private-clinic',
    category: 'medical',
    accent: '#10b981',
    sortOrder: 54,
    name: { ar: 'عيادة خاصة', fr: 'Cabinet Privé', en: 'Private Clinic' },
    description: {
      ar: 'عيادة خاصة مع الأطباء، التخصصات، الباقات الطبية وحجز موعد.',
      fr: 'Cabinet privé avec médecins, spécialités, forfaits médicaux et rendez-vous.',
      en: 'Private clinic with doctors, specialties, medical packages and appointment booking.',
    },
  },
  {
    slug: 'dental-center',
    category: 'medical',
    accent: '#38bdf8',
    sortOrder: 55,
    name: { ar: 'مركز طب أسنان', fr: 'Centre Dentaire', en: 'Dental Center' },
    description: {
      ar: 'مركز طب أسنان متكامل: العلاجات، التجميل، التقسيط والخطط الدورية.',
      fr: 'Centre dentaire complet : traitements, esthétique, financement et abonnements.',
      en: 'Comprehensive dental center: treatments, cosmetic dentistry, financing and membership plans.',
    },
  },
  {
    slug: 'mental-health',
    category: 'medical',
    accent: '#818cf8',
    sortOrder: 56,
    name: { ar: 'عيادة نفسية وعقلية', fr: 'Cabinet de Santé Mentale', en: 'Mental Health Clinic' },
    description: {
      ar: 'عيادة متخصصة في الصحة النفسية والتوجيه المهني، جلسات العلاج والاستشارات.',
      fr: 'Cabinet spécialisé en santé mentale et orientation, thérapie et conseil.',
      en: 'Specialized mental health clinic with therapy sessions and counseling services.',
    },
  },
  {
    slug: 'hospital',
    category: 'medical',
    accent: '#14b8a6',
    sortOrder: 57,
    name: { ar: 'مستشفى خاص', fr: 'Hôpital Privé', en: 'Private Hospital' },
    description: {
      ar: 'مستشفى خاص كامل الخدمات: الأقسام، التخصصات، الحجوزات والسجل الطبي.',
      fr: 'Hôpital privé complet : départements, spécialités, réservations et dossier médical.',
      en: 'Full-service private hospital: departments, specialties, admissions and medical records.',
    },
  },
  {
    slug: 'bakery-patisserie',
    category: 'bakery',
    accent: '#f97316',
    sortOrder: 58,
    name: { ar: 'مخبز وحلويات تقليدية', fr: 'Boulangerie & Pâtisserie Traditionnelle', en: 'Traditional Bakery & Pastry' },
    description: {
      ar: 'مخبز وحلويات تقليدية: الفطائر، الكيك، الحلوى الشرقية وأوقات العمل.',
      fr: 'Boulangerie et pâtisserie traditionnelle : tourtes, gâteaux, confiseries arabes et horaires.',
      en: 'Traditional bakery and pastry: pies, cakes, Arabic sweets and opening hours.',
    },
  },
  {
    slug: 'pizzeria',
    category: 'food',
    accent: '#ef4444',
    sortOrder: 59,
    name: { ar: 'مطعم بيتزا إيطالي', fr: 'Pizzeria Italienne', en: 'Italian Pizzeria' },
    description: {
      ar: 'مطعم بيتزا إيطالي أصيل: البيتزا، المعكرونة، المشروبات والطلبات عبر واتساب.',
      fr: 'Pizzeria italienne authentique : pizza, pâtes, boissons et commande WhatsApp.',
      en: 'Authentic Italian pizzeria: pizza, pasta, drinks and WhatsApp ordering.',
    },
  },
  {
    slug: 'coffee-cafe',
    category: 'food',
    accent: '#84cc16',
    sortOrder: 60,
    name: { ar: 'مقهى وجبات سريعة', fr: 'Café Rapide', en: 'Fast Food Café' },
    description: {
      ar: 'مقهى وجبات سريعة: الشاورما، البرجر، الحلويات والطلبات السريعة.',
      fr: 'Café fast-food : shawarma, burger, desserts et commandes rapides.',
      en: 'Fast food café: shawarma, burgers, desserts and quick orders.',
    },
  },
  {
    slug: 'restaurant-mediterranean',
    category: 'food',
    accent: '#f59e0b',
    sortOrder: 61,
    name: { ar: 'مطعم البحر الأبيض المتوسط', fr: 'Restaurant Méditerranéen', en: 'Mediterranean Restaurant' },
    description: {
      ar: 'مطعم متخصص في الأطباق المتوسطية، اللحوم، الأسماك وحجز طاولة.',
      fr: 'Restaurant spécialisé dans la cuisine méditerranéenne, viandes, poissons et réservation de table.',
      en: 'Mediterranean specialty restaurant: meats, fish and table reservations.',
    },
  },
  {
    slug: 'delivery-service',
    category: 'food',
    accent: '#f97316',
    sortOrder: 62,
    name: { ar: 'توصيل طلبات غذائية', fr: 'Livraison de Repas', en: 'Food Delivery Service' },
    description: {
      ar: 'خدمة توصيل طعام للمنزل والمكاتب، الطلب عبر التطبيق أو واتساب.',
      fr: 'Service de livraison de repas à domicile et au bureau, commande app ou WhatsApp.',
      en: 'Home and office food delivery service, order via app or WhatsApp.',
    },
  },
  {
    slug: 'personal-trainer',
    category: 'fitness',
    accent: '#22c55e',
    sortOrder: 63,
    name: { ar: 'مدرب شخصي', fr: 'Coach Personnel', en: 'Personal Trainer' },
    description: {
      ar: 'مدرب رياضي شخصي: خطط التدريب، التغذية، متابعة النتائج وحجز جلسات.',
      fr: 'Coach sportif personnel : plans d’entraînement, nutrition, suivi et séances réservables.',
      en: 'Personal fitness trainer: workout plans, nutrition, results tracking and session booking.',
    },
  },
  {
    slug: 'dance-studio',
    category: 'fitness',
    accent: '#ec4899',
    sortOrder: 64,
    name: { ar: 'نادٍ رقص وجيم', fr: 'Studio Danse & Gym', en: 'Dance Studio & Gym' },
    description: {
      ar: 'مدرسة رقص مع جلسات الرقص، اللياقة البدنية والفعاليات.',
      fr: 'École de danse avec cours de danse, fitness et événements.',
      en: 'Dance school with dance classes, fitness and events.',
    },
  },
  {
    slug: 'yoga-studio',
    category: 'fitness',
    accent: '#a3e635',
    sortOrder: 65,
    name: { ar: 'استوديو يوغا وسلامة ذهن', fr: 'Studio Yoga & Bien-être', en: 'Yoga Studio' },
    description: {
      ar: 'استوديو يوغا وتأمل مع جلسات اليوغا، التأمل والاسترخاء.',
      fr: 'Studio yoga et méditation avec séances de yoga, méditation et détente.',
      en: 'Yoga studio with meditation including yoga sessions, mindfulness and relaxation.',
    },
  },
  {
    slug: 'lawyer-corporate',
    category: 'lawyer',
    accent: '#475569',
    sortOrder: 66,
    name: { ar: 'محاماة تجارية وقانون فرنسي', fr: 'Cabinet Juridique & Commercial', en: 'Corporate Law Firm' },
    description: {
      ar: 'مكتب محاماة متخصص في القضايا التجارية والقانون الفرنسي، العقود والتمثيل القانوني.',
      fr: 'Cabinet spécialisé en droit commercial et français, contrats et représentation juridique.',
      en: 'Corporate law firm specializing in commercial and French law, contracts and legal representation.',
    },
  },
  {
    slug: 'accounting-office',
    category: 'lawyer',
    accent: '#64748b',
    sortOrder: 67,
    name: { ar: 'مكتب محاسبة ومال', fr: 'Cabinet Comptable & Finance', en: 'Accounting & Finance Firm' },
    description: {
      ar: 'مكتب محاسبي للمقاولات الصغيرة والمتوسطة، الإيداع السنوي والقوائم المالية.',
      fr: 'Cabinet comptable pour PME, dépôt annuel des bilans et faillites.',
      en: 'Accounting firm for SMEs with annual balance sheet filing and bankruptcy services.',
    },
  },
  {
    slug: 'financial-advisor',
    category: 'lawyer',
    accent: '#1e293b',
    sortOrder: 68,
    name: { ar: 'مستشار مالي واستثماري', fr: 'Conseiller Financier', en: 'Financial Advisor' },
    description: {
      ar: 'استشارات مالية، التوفير، المعاشات، التأمين والاستثمارات.',
      fr: 'Conseils financiers, épargne, retraites, assurances et investissements.',
      en: 'Financial advisory services including savings, pensions, insurance and investments.',
    },
  },
  {
    slug: 'translation-company',
    category: 'service',
    accent: '#3b82f6',
    sortOrder: 69,
    name: { ar: 'مكتب ترجمة وتفسير', fr: 'Bureau de Traduction & Interprétation', en: 'Translation & Interpretation Agency' },
    description: {
      ar: 'شركة ترجمة معتمدة من CNDP: الفرنسية، الإنجليزية، العربية والترجمة الفورية.',
      fr: 'Entreprise de traduction certifiée CNDP : français, anglais, arabe et interprètes.',
      en: 'CNDP certified translation company: French, English, Arabic and interpreter services.',
    },
  },
  {
    slug: 'cleaning-service',
    category: 'service',
    accent: '#22d368',
    sortOrder: 70,
    name: { ar: 'خدمة تنظيف منازل وشركات', fr: 'Service de Nettoyage Domicile & Entreprises', en: 'Home & Office Cleaning Service' },
    description: {
      ar: 'شركة تنظيف معتمدة، منتجات تنظيف، نظافة شاملة للأفراد والمكاتب.',
      fr: 'Entreprise de nettoyage certifiée, produits de nettoyage, ménage complet particuliers et bureaux.',
      en: 'Certified cleaning company, cleaning products, comprehensive home and office cleaning.',
    },
  },
  {
    slug: 'plumbing-service',
    category: 'service',
    accent: '#f59e0b',
    sortOrder: 71,
    name: { ar: 'خدمات سباكة وتصريف مياه', fr: 'Plomberie & Drainage Services', en: 'Plumbing & Drainage Services' },
    description: {
      ar: 'شركة صيانة للمواسير، الانسدادات، سخانات المياه والتدفئة.',
      fr: 'Entreprise de plomberie, égoût, chauffe-eau et chauffage.',
      en: 'Plumbing company specializing in pipes, drains, water heaters and heating systems.',
    },
  },
  {
    slug: 'electrician-service',
    category: 'service',
    accent: '#eab308',
    sortOrder: 72,
    name: { ar: 'شركة كهرباء وصيانة', fr: 'Électricien & Maintenance Services', en: 'Electrical & Maintenance Services' },
    description: {
      ar: 'شركة كهرباء معتمدة، تركيبات كهربائية، صيانة الشبكات والأجهزة.',
      fr: 'Entreprise d’électricité certifiée, installations électriques, maintenance des réseaux et appareils.',
      en: 'Certified electrical company, electrical installations, network and appliance maintenance.',
    },
  },
  {
    slug: 'pest-control',
    category: 'service',
    accent: '#a855f7',
    sortOrder: 73,
    name: { ar: 'مكافحة الحشرات والقوارض', fr: 'Désinsectisation & Dératisation', en: 'Pest Control Service' },
    description: {
      ar: 'شركة مكافحة حشرات وقوارض معتمدة، خدمات شاملة للمنازل والمكاتب.',
      fr: 'Entreprise de désinsectisation et dératisation certifiée, services complets particuliers et professionnels.',
      en: 'Certified pest control and rodent removal company with comprehensive home and office services.',
    },
  },
  {
    slug: 'moving-service',
    category: 'service',
    accent: '#f97316',
    sortOrder: 74,
    name: { ar: 'خدمة نقل وتخزين', fr: 'Service Déménagement & Stockage', en: 'Moving & Storage Service' },
    description: {
      ar: 'شركة نقل محلات ومنازل مع خدمة التخزين المؤقت وإعادة التجهيز.',
      fr: 'Entreprise de déménagement pour commerces et maisons avec stockage temporaire et restructuration.',
      en: 'Moving company for businesses and homes with temporary storage and relocation services.',
    },
  },
  {
    slug: 'landscaping',
    category: 'service',
    accent: '#16a34a',
    sortOrder: 75,
    name: { ar: 'خدمات تنسيق حدائق', fr: 'Services de Paysagisme', en: 'Landscaping Services' },
    description: {
      ar: 'شركة تنسيق حدائق، زراعة الأشجار، الصيانة الدورية للأراضي الخضراء.',
      fr: 'Entreprise de paysagisme, plantation d’arbres, maintenance périodique des espaces verts.',
      en: 'Landscaping company with tree planting and ongoing green space maintenance.',
    },
  },
  {
    slug: 'web-development',
    category: 'digital',
    accent: '#6366f1',
    sortOrder: 76,
    name: { ar: 'تطوير الويب والتطبيقات', fr: 'Développement Web & Apps', en: 'Web Development Agency' },
    description: {
      ar: 'وكالة تطوير مواقع وتطبيقات، تصميم UI/UX، واجهات برمجية وقواعد بيانات.',
      fr: 'Agence de développement web et applications, design UI/UX, APIs, bases de données.',
      en: 'Web development agency for sites and apps, UI/UX design, APIs, databases.',
    },
  },
  {
    slug: 'digital-marketing',
    category: 'agency',
    accent: '#8b5cf6',
    sortOrder: 77,
    name: { ar: 'تسويق رقمي ووسائل تواصل اجتماعي', fr: 'Marketing Digital & Réseaux Sociaux', en: 'Digital Marketing & Social Media Agency' },
    description: {
      ar: 'وكالة تسويق رقمي، إدارة صفحات التواصل الاجتماعي، الإعلانات الممولة وتحليل البيانات.',
      fr: 'Agence de marketing digital, gestion des réseaux sociaux, publicité payante et analyse de données.',
      en: 'Digital marketing agency managing social pages, paid ads and data analytics.',
    },
  },
  {
    slug: 'seo-services',
    category: 'agency',
    accent: '#10b981',
    sortOrder: 78,
    name: { ar: 'تحسين محركات البحث SEO', fr: 'Optimisation SEO', en: 'SEO Services' },
    description: {
      ar: 'خدمات تحسين ظهور المواقع في نتائج البحث، الكلمات المفتاحية والمحتوى.',
      fr: 'Services d’optimisation du référencement, mots-clés et contenu.',
      en: 'SEO services to improve website ranking with keywords and content optimization.',
    },
  },
  {
    slug: 'graphic-design',
    category: 'visual',
    accent: '#ec4899',
    sortOrder: 79,
    name: { ar: 'تصميم جرافيكي وهوية بصرية', fr: 'Design Graphique & Identité Visuelle', en: 'Graphic Design Studio' },
    description: {
      ar: 'استوديو تصميم هوية بصرية، شعارات، خطوط، بروشورات وتصاميم إبداعية.',
      fr: 'Studio de design d’identité visuelle, logos, polices, brochures et designs créatifs.',
      en: 'Graphic design studio for branding, logos, typography, brochures and creative designs.',
    },
  },
  {
    slug: 'photography-studio',
    category: 'photography',
    accent: '#f43f5e',
    sortOrder: 80,
    name: { ar: 'استوديو تصوير احترافي', fr: 'Studio de Photographie Pro', en: 'Professional Photography Studio' },
    description: {
      ar: 'استوديو تصوير احترافي: بورتريه، زفاف، منتجات وفعاليات مع مختبر صور.',
      fr: 'Studio photo pour portraits, mariages, produits et événements avec laboratoire.',
      en: 'Photography studio for portraits, weddings, products and events with digital lab.',
    },
  },
  {
    slug: 'video-production',
    category: 'visual',
    accent: '#ef4444',
    sortOrder: 81,
    name: { ar: 'إنتاج فيديو ومونتاج', fr: 'Production Vidéo & Montage', en: 'Video Production & Editing' },
    description: {
      ar: 'إنتاج مؤثرات بصرية، أفلام ترويجية، مقاطع إعلانية وتعديل الفيديو.',
      fr: 'Production d’effets visuels, films promotionnels, spots publicitaires et montage vidéo.',
      en: 'Visual effects production, promotional films, commercial spots and video editing.',
    },
  },
  {
    slug: 'content-writer',
    category: 'digital',
    accent: '#14b8a6',
    sortOrder: 82,
    name: { ar: 'كتابة محتوى إبداعي وإعلامي', fr: 'Écriture de Contenu Créatif & Média', en: 'Creative Content Writing' },
    description: {
      ar: 'خدمات كتابة المقالات، المحتوى الإخباري، المحتوى التسويقي وروابط التواصل.',
      fr: 'Services d’écriture d’articles, chaînes info, contenu marketing et liens de contact.',
      en: 'Content writing services for articles, news features, marketing copy and social links.',
    },
  },
  {
    slug: 'ecommerce-dz',
    category: 'store',
    accent: '#8b5cf6',
    sortOrder: 83,
    name: { ar: 'متجر إلكتروني للجزائر', fr: 'Boutique Électronique Algérie', en: 'E-commerce Algeria' },
    description: {
      ar: 'متجر إلكتروني مصمم خصيصاً للجزائر: الدفع المحلي، التوصيل الوطني والدعم الكامل.',
      fr: 'Boutique en ligne conçue pour l’Algérie : paiements locaux, livraison nationale et support complet.',
      en: 'E-commerce store designed for Algeria with local payments, nationwide delivery and full support.',
    },
  },
  {
    slug: 'fashion-boutique',
    category: 'boutique',
    accent: '#be123c',
    sortOrder: 84,
    name: { ar: 'بوتيك أزياء عصري', fr: 'Boutique Mode Moderne', en: 'Modern Fashion Boutique' },
    description: {
      ar: 'بوتيك أزياء بتصميم عصري، مجموعات موسمية، عروض خاصة وطلب عبر واتساب.',
      fr: 'Boutique de mode avec designs modernes, collections saisonnières, soldes et commande WhatsApp.',
      en: 'Fashion boutique with modern designs, seasonal collections, sales and WhatsApp ordering.',
    },
  },
  {
    slug: 'jewelry-showroom',
    category: 'boutique',
    accent: '#d97706',
    sortOrder: 85,
    name: { ar: 'معرض مجوهرات فاخر', fr: 'Showroom de Bijoux de Luxe', en: 'Luxury Jewelry Showroom' },
    description: {
      ar: 'معرض مجوهرات فاخرة مع عرض القطع، السلاسل، العقود وطلب عبر واتساب.',
      fr: 'Showroom de bijoux de luxe avec pièces, chaînes, bagues et commande WhatsApp.',
      en: 'Luxury jewelry showroom with piece catalog, chains, rings and WhatsApp ordering.',
    },
  },
  {
    slug: 'handcrafts',
    category: 'boutique',
    accent: '#9f1239',
    sortOrder: 86,
    name: { ar: 'حرف يدوية تقليدية', fr: 'Artisanat Traditionnel', en: 'Traditional Handcrafts' },
    description: {
      ar: 'متجر منتجات حرفية محلية: سجاد، فخاريات، خشب وزخارف.',
      fr: 'Boutique de produits artisanaux locaux, tapis, céramiques, bois et motifs.',
      en: 'Store for local crafts including carpets, ceramics, wood and ornaments.',
    },
  },
  {
    slug: 'digital-products',
    category: 'digital',
    accent: '#6366f1',
    sortOrder: 87,
    name: { ar: 'منتجات رقمية قابلة للتحميل', fr: 'Produits Numériques Téléchargeables', en: 'Downloadable Digital Products' },
    description: {
      ar: 'متجر منتجات رقمية: قوالب، إكسل، كتب إلكترونية، برامج وأدوات.',
      fr: 'Boutique de produits numériques : modèles, Excel, e-books, logiciels et outils.',
      en: 'Digital product store with templates, spreadsheets, e-books and software tools.',
    },
  },
  {
    slug: 'online-courses',
    category: 'education',
    accent: '#0ea5e9',
    sortOrder: 88,
    name: { ar: 'دورات تعليمية أونلاين', fr: 'Cours en Ligne', en: 'Online Courses Platform' },
    description: {
      ar: 'منصة دورات إلكترونية مع دروس فيديو واختبارات وشهادات.',
      fr: 'Plateforme de cours en ligne avec vidéos, examens et certifications.',
      en: 'E-learning platform with video courses, assessments and certificates.',
    },
  },
  {
    slug: 'language-school',
    category: 'education',
    accent: '#14b8a6',
    sortOrder: 89,
    name: { ar: 'مدرسة لغات أجنبية', fr: 'École de Langues Étrangères', en: 'Foreign Language School' },
    description: {
      ar: 'مدرسة تعليم اللغات الفرنسية والإنجليزية، الدروس الجماعية والخاصة.',
      fr: 'École d’enseignement des langues française et anglaise, cours collectifs et privés.',
      en: 'Language school for French and English with group and private lessons.',
    },
  },
  {
    slug: 'tutoring-service',
    category: 'education',
    accent: '#2563eb',
    sortOrder: 90,
    name: { ar: 'خدمة دروس خصوصية وتعليم منزلي', fr: 'Cours Particuliers & Enseignement à Domicile', en: 'Private Tutoring Service' },
    description: {
      ar: 'دروس خصوصية لجميع المستويات، التعليم المنزلي، الدعم الأكاديمي.',
      fr: 'Cours particuliers pour tous les niveaux, enseignement à domicile et soutien académique.',
      en: 'Private tutoring for all levels, home schooling and academic support services.',
    },
  },
  {
    slug: 'travel-tourism',
    category: 'travel',
    accent: '#0891b2',
    sortOrder: 91,
    name: { ar: 'وكالة سياحة وجولات', fr: 'Agence de Tourisme & Voyages', en: 'Tourism & Tour Agency' },
    description: {
      ar: 'وكالة سفر لبرامج محلية ودولية، حزم عطلات، طيران وفنادق.',
      fr: 'Agence de voyage pour programmes locaux et internationaux, paquets vacances, vols et hôtels.',
      en: 'Travel agency for domestic and international tours, vacation packages, flights and hotels.',
    },
  },
  {
    slug: 'hotel-resort',
    category: 'hotel',
    accent: '#78350f',
    sortOrder: 92,
    name: { ar: 'فندق ومنتجع سياحي', fr: 'Hôtel & Resort Touristique', en: 'Hotel & Tourist Resort' },
    description: {
      ar: 'فندق متكامل الخدمات: غرف، مطاعم، مسابح، أنشطة واستقبال ضيوف.',
      fr: 'Hôtel complet : chambres, restaurants, piscines, activités et accueil des invités.',
      en: 'Full-service hotel with rooms, restaurants, pools, activities and guest reception.',
    },
  },
  {
    slug: 'airbnb-property',
    category: 'hotel',
    accent: '#ea580c',
    sortOrder: 93,
    name: { ar: 'إيجار شقق ومنازل', fr: 'Location d’Appartements & Maisons', en: 'Apartment & House Rental' },
    description: {
      ar: 'إيجار شقق وفلل للسياح والعائلات، حجز عبر موقع أو واتساب.',
      fr: 'Location d’appartements et villas pour touristes et familles, réservation via site ou WhatsApp.',
      en: 'Apartment and villa rentals for tourists and families with booking via site or WhatsApp.',
    },
  },
  {
    slug: 'car-wash',
    category: 'automotive',
    accent: '#0ea5e9',
    sortOrder: 94,
    name: { ar: 'غسيل وتلميع سيارات', fr: 'Lavage & Detailing Automobile', en: 'Car Wash & Detailing Service' },
    description: {
      ar: 'خدمة غسيل السيارات الداخلية والخارجية، التلميع والعناية الكاملة.',
      fr: 'Lavage automobile intérieur et extérieur, polissage et detailing complet.',
      en: 'Car washing service including interior and exterior cleaning, polishing and full detailing.',
    },
  },
  {
    slug: 'tire-service',
    category: 'automotive',
    accent: '#dc2626',
    sortOrder: 95,
    name: { ar: 'بيع وتركيب إطارات', fr: 'Vente et Montage de Pneus', en: 'Tire Sales & Mounting Service' },
    description: {
      ar: 'متجر إطارات مع بيع وتركيب جميع أنواع الإطارات، ضغط الهواء.',
      fr: 'Magasin de pneus avec vente et montage de tous types, pression d’air.',
      en: 'Tire store with sales and mounting of all tire types and air pressure services.',
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

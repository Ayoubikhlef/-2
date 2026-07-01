export interface ServiceOption {
  value: string;
  ar: string;
  fr: string;
  en: string;
}

export interface ServiceCategory {
  id: number;
  key: string;
  label: { ar: string; fr: string; en: string };
  options: ServiceOption[];
}

export const defaultServices: ServiceCategory[] = [
  {
    id: 1,
    key: 'print',
    label: { ar: '🖨️ طباعة ونسخ', fr: '🖨️ Impression et copie', en: '🖨️ Printing & Copying' },
    options: [
      { value: 'print-bw', ar: 'طباعة أبيض وأسود', fr: 'Impression noir et blanc', en: 'Black & White Print' },
      { value: 'print-color', ar: 'طباعة ملونة', fr: 'Impression couleur', en: 'Color Print' },
      { value: 'print-books', ar: 'طباعة كتب وأبحاث', fr: 'Impression livres et recherches', en: 'Books & Research Print' },
      { value: 'print-copy', ar: 'نسخ مستندات', fr: 'Copie de documents', en: 'Document Copy' },
    ],
  },
  {
    id: 2,
    key: 'scan',
    label: { ar: '📄 مسح ضوئي', fr: '📄 Numérisation', en: '📄 Scanning' },
    options: [
      { value: 'scan-basic', ar: 'مسح ضوئي عادي', fr: 'Numérisation simple', en: 'Basic Scan' },
      { value: 'scan-hires', ar: 'مسح ضوئي عالي الدقة', fr: 'Numérisation haute résolution', en: 'High-Res Scan' },
      { value: 'scan-books', ar: 'مسح كتب', fr: 'Numérisation de livres', en: 'Book Scanning' },
    ],
  },
  {
    id: 3,
    key: 'translate',
    label: { ar: '🌐 ترجمة الوثائق', fr: '🌐 Traduction', en: '🌐 Translation' },
    options: [
      { value: 'translate-official', ar: 'ترجمة وثيقة رسمية', fr: 'Traduction document officiel', en: 'Official Document Translation' },
      { value: 'translate-simple', ar: 'ترجمة وثيقة عادية', fr: 'Traduction document simple', en: 'Simple Document Translation' },
      { value: 'translate-site', ar: 'ترجمة موقع أو مقال', fr: 'Traduction site ou article', en: 'Website or Article Translation' },
    ],
  },
  {
    id: 4,
    key: 'reg',
    label: { ar: '📝 تسجيل في المواقع', fr: '📝 Inscription en ligne', en: '📝 Online Registration' },
    options: [
      { value: 'reg-job', ar: 'تسجيل في مواقع التوظيف', fr: 'Inscription sites d\'emploi', en: 'Job Site Registration' },
      { value: 'reg-grant', ar: 'تسجيل في منحة جامعية', fr: 'Inscription bourse universitaire', en: 'University Grant Registration' },
      { value: 'reg-contest', ar: 'تسجيل في مسابقة توظيف', fr: 'Inscription concours recrutement', en: 'Recruitment Contest Registration' },
      { value: 'reg-edu', ar: 'تسجيل في منصة تعليمية', fr: 'Inscription plateforme éducative', en: 'Educational Platform Registration' },
      { value: 'reg-service', ar: 'تسجيل في موقع خدمات', fr: 'Inscription site de services', en: 'Service Website Registration' },
    ],
  },
  {
    id: 5,
    key: 'cv',
    label: { ar: '👤 السيرة الذاتية', fr: '👤 CV', en: '👤 CV' },
    options: [
      { value: 'cv-pro', ar: 'سيرة ذاتية احترافية', fr: 'CV professionnel', en: 'Professional CV' },
      { value: 'cv-ar', ar: 'سيرة ذاتية بالعربية', fr: 'CV en arabe', en: 'Arabic CV' },
      { value: 'cv-fr', ar: 'سيرة ذاتية بالفرنسية', fr: 'CV en français', en: 'French CV' },
      { value: 'cv-cover', ar: 'رسالة تحفيزية', fr: 'Lettre de motivation', en: 'Cover Letter' },
    ],
  },
  {
    id: 6,
    key: 'write',
    label: { ar: '✍️ كتابة وتحرير', fr: '✍️ Rédaction', en: '✍️ Writing' },
    options: [
      { value: 'write-thesis', ar: 'كتابة مذكرة تخرج', fr: 'Rédaction mémoire', en: 'Thesis Writing' },
      { value: 'write-report', ar: 'كتابة تقرير', fr: 'Rédaction rapport', en: 'Report Writing' },
      { value: 'write-article', ar: 'كتابة مقال', fr: 'Rédaction article', en: 'Article Writing' },
      { value: 'write-research', ar: 'كتابة بحث علمي', fr: 'Rédaction recherche', en: 'Research Paper' },
    ],
  },
  {
    id: 7,
    key: 'form',
    label: { ar: '📋 الاستمارات', fr: '📋 Formulaires', en: '📋 Forms' },
    options: [
      { value: 'form-passport', ar: 'طلب جواز سفر', fr: 'Demande passeport', en: 'Passport Application' },
      { value: 'form-id', ar: 'طلب بطاقة تعريف', fr: 'Demande carte d\'identité', en: 'ID Card Application' },
      { value: 'form-birth', ar: 'طلب شهادة ميلاد', fr: 'Demande acte de naissance', en: 'Birth Certificate Request' },
      { value: 'form-grades', ar: 'طلب كشف النقاط', fr: 'Demande relevé de notes', en: 'Grade Report Request' },
      { value: 'form-admin', ar: 'استخراج وثائق إدارية', fr: 'Extraction documents admin', en: 'Admin Document Extraction' },
    ],
  },
  {
    id: 8,
    key: 'ad',
    label: { ar: '📢 إعلانات', fr: '📢 Annonces', en: '📢 Ads' },
    options: [
      { value: 'ad-ouedkniss', ar: 'إعلان على واد كنيس', fr: 'Annonce Ouedkniss', en: 'Ouedkniss Ad' },
      { value: 'ad-facebook', ar: 'إعلان على فيسبوك', fr: 'Annonce Facebook', en: 'Facebook Ad' },
      { value: 'ad-rent', ar: 'إعلان كراء', fr: 'Annonce location', en: 'Rental Ad' },
      { value: 'ad-sale', ar: 'إعلان بيع', fr: 'Annonce vente', en: 'Sales Ad' },
    ],
  },
  {
    id: 9,
    key: 'visa',
    label: { ar: '✈️ الفيزا', fr: '✈️ Visa', en: '✈️ Visa' },
    options: [
      { value: 'visa-schengen', ar: 'ملف فيزا شنغن', fr: 'Dossier visa Schengen', en: 'Schengen Visa File' },
      { value: 'visa-canada', ar: 'ملف فيزا كندا', fr: 'Dossier visa Canada', en: 'Canada Visa File' },
      { value: 'visa-appointment', ar: 'حجز موعد سفارة', fr: 'Rendez-vous ambassade', en: 'Embassy Appointment' },
      { value: 'visa-submit', ar: 'تقديم ملف فيزا', fr: 'Soumission dossier visa', en: 'Visa File Submission' },
    ],
  },
  {
    id: 10,
    key: 'net',
    label: { ar: '🌍 خدمات الإنترنت', fr: '🌍 Internet', en: '🌍 Internet' },
    options: [
      { value: 'net-browse', ar: 'تصفح إنترنت', fr: 'Navigation internet', en: 'Internet Browsing' },
      { value: 'net-download', ar: 'تحميل ملفات', fr: 'Téléchargement fichiers', en: 'File Download' },
      { value: 'net-upload', ar: 'رفع ملفات', fr: 'Upload fichiers', en: 'File Upload' },
      { value: 'net-print', ar: 'طباعة عن بعد', fr: 'Impression à distance', en: 'Remote Printing' },
    ],
  },
  {
    id: 11,
    key: 'laminate',
    label: { ar: '📎 تغليف وتجليد', fr: '📎 Plastification et reliure', en: '📎 Lamination & Binding' },
    options: [
      { value: 'laminate-thermal', ar: 'تغليف حراري', fr: 'Plastification thermique', en: 'Thermal Lamination' },
      { value: 'bind-thesis', ar: 'تجليد رسائل', fr: 'Reliure mémoires', en: 'Thesis Binding' },
      { value: 'bind-luxury', ar: 'تجليد فاخر', fr: 'Reliure luxe', en: 'Premium Binding' },
    ],
  },
  {
    id: 12,
    key: 'design',
    label: { ar: '🎨 تصميم', fr: '🎨 Design', en: '🎨 Design' },
    options: [
      { value: 'design-logo', ar: 'تصميم شعار', fr: 'Design logo', en: 'Logo Design' },
      { value: 'design-card', ar: 'تصميم بطاقة عمل', fr: 'Design carte de visite', en: 'Business Card Design' },
      { value: 'design-brochure', ar: 'تصميم بروشور', fr: 'Design brochure', en: 'Brochure Design' },
      { value: 'design-post', ar: 'تصميم منشور فيسبوك', fr: 'Design publication Facebook', en: 'Facebook Post Design' },
      { value: 'design-poster', ar: 'تصميم بوستر', fr: 'Design poster', en: 'Poster Design' },
    ],
  },
];

export function getAllServiceOptions(services: ServiceCategory[]): ServiceOption[] {
  return services.flatMap((cat) => cat.options);
}

export function getServiceByValue(services: ServiceCategory[], value: string): ServiceOption | undefined {
  return getAllServiceOptions(services).find((s) => s.value === value);
}
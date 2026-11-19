import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Calculator,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileCheck,
  GraduationCap,
  Headphones,
  Image,
  KeyRound,
  Languages,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessageSquare,
  Mic,
  Palette,
  Phone,
  Presentation,
  Search,
  Send,
  Server,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Video,
  Wallet,
  Wifi,
  Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { brand } from '../config/brand';
import { describeOrderError, saveOrder } from '../utils/orderStorage';
import { submitOrderToSheet } from '../utils/googleForm';
import { AiStudio } from './AiStudio';
import {
  DIGITAL_CATEGORIES,
  DIGITAL_FAQS,
  DIGITAL_GUARANTEES,
  DIGITAL_STEPS,
  DIGITAL_TRUST,
  QUOTE_BUDGETS,
  QUOTE_DEADLINES,
  type DigitalServiceCategory,
  type DigitalServiceIcon,
  type LangText,
} from '../data/digitalServices';
import {
  getStoredDigitalCatalog,
  loadDigitalCatalogFromServer,
  type DigitalCatalog,
} from '../utils/digitalCatalogStorage';

const serviceIcons: Record<DigitalServiceIcon, LucideIcon> = {
  store: ShoppingCart,
  social: Megaphone,
  hosting: Server,
  pos: Calculator,
  network: Wifi,
  training: GraduationCap,
  ai: Sparkles,
  design: Palette,
  content: MessageSquare,
  photo: Image,
  video: Video,
  voice: Mic,
  translation: Languages,
  chatbot: Bot,
  automation: Workflow,
  presentation: Presentation,
  analytics: BarChart3,
};

const guaranteeIcons: Record<string, LucideIcon> = {
  shield: ShieldCheck,
  clock: Clock3,
  wallet: Wallet,
  key: KeyRound,
  headset: Headphones,
  file: FileCheck,
};

const trustIcons: Record<string, LucideIcon> = {
  clock: Clock3,
  wallet: Wallet,
  key: KeyRound,
  headset: Headphones,
};

const EXTRA_SERVICE_LABELS: Record<string, LangText> = {
  'digital-website': {
    ar: 'موقع تعريفي احترافي',
    fr: 'Site vitrine professionnel',
    en: 'Professional presentation website',
  },
  'digital-maintenance': {
    ar: 'صيانة وحماية موقع',
    fr: 'Maintenance et protection de site',
    en: 'Website maintenance and protection',
  },
  'ai-pack-start': {
    ar: 'باقة AI للبداية',
    fr: 'Pack AI Démarrage',
    en: 'AI Starter pack',
  },
  'ai-pack-business': {
    ar: 'باقة AI للأعمال',
    fr: 'Pack AI Business',
    en: 'AI Business pack',
  },
  'ai-pack-growth': {
    ar: 'باقة AI للنمو',
    fr: 'Pack AI Croissance',
    en: 'AI Growth pack',
  },
  advice: {
    ar: 'لا أعرف بعد — أحتاج استشارة',
    fr: 'Pas encore sûr — je veux un conseil',
    en: 'Not sure yet — I need advice',
  },
};

function buildQuoteServices(catalog: DigitalCatalog): { value: string; label: LangText }[] {
  const options: { value: string; label: LangText }[] = [];
  const seen = new Set<string>();
  const push = (value: string, label: LangText) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    options.push({ value, label });
  };

  catalog.services.forEach((service) => push(service.bookingValue, service.title));
  catalog.packages.forEach((pkg) => push(pkg.bookingValue, pkg.name));
  push('digital-website', EXTRA_SERVICE_LABELS['digital-website']);
  push('digital-maintenance', EXTRA_SERVICE_LABELS['digital-maintenance']);
  push('advice', EXTRA_SERVICE_LABELS.advice);
  return options;
}

type QuoteFormState = {
  name: string;
  phone: string;
  email: string;
  wilaya: string;
  service: string;
  packageId: string;
  budget: string;
  deadline: string;
  details: string;
};

const EMPTY_FORM: QuoteFormState = {
  name: '',
  phone: '',
  email: '',
  wilaya: '',
  service: '',
  packageId: '',
  budget: 'undecided',
  deadline: 'flexible',
  details: '',
};

type QuoteSummary = {
  name: string;
  phone: string;
  service: string;
  packageName: string;
  budget: string;
  deadline: string;
  reference: string;
  whatsappUrl: string;
  price?: string;
  priceUnit?: string;
};

export function DigitalServices() {
  const { t, language } = useLanguage();
  const [form, setForm] = useState<QuoteFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<QuoteSummary | null>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(DIGITAL_FAQS[0]?.id ?? null);
  const [activeCategory, setActiveCategory] = useState<DigitalServiceCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [catalog, setCatalog] = useState<DigitalCatalog>(() => getStoredDigitalCatalog());
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    const refresh = () => setCatalog(getStoredDigitalCatalog());
    window.addEventListener('aos:data-changed', refresh);
    loadDigitalCatalogFromServer()
      .then((next) => {
        if (active) setCatalog(next);
      })
      .catch(() => {
        /* local catalogue is enough when the server is offline */
      });
    return () => {
      active = false;
      window.removeEventListener('aos:data-changed', refresh);
    };
  }, []);

  const services = useMemo(
    () => catalog.services.filter((service) => service.visible !== false),
    [catalog],
  );
  const packages = useMemo(
    () => catalog.packages.filter((pkg) => pkg.visible !== false),
    [catalog],
  );

  // Structured data helps Google show the services with prices and the FAQ
  // directly in search results. It follows the catalogue and the active
  // language, so it always matches what a visitor can actually see.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const origin = window.location.origin;
    const pageUrl = `${origin}/#digital-services`;
    const provider = {
      '@type': 'Organization',
      name: brand.name,
      url: origin,
      telephone: brand.contact.phoneInternational,
      email: brand.contact.email,
    };
    const serviceNodes = services.map((service) => ({
      '@type': 'Service',
      name: service.title[language],
      description: service.description[language] || service.tagline[language],
      serviceType: service.title[language],
      provider,
      areaServed: { '@type': 'Country', name: 'Algeria' },
      offers: {
        '@type': 'Offer',
        price: service.startingPrice,
        priceCurrency: 'DZD',
        availability: 'https://schema.org/InStock',
        url: pageUrl,
      },
    }));
    const faqNode = {
      '@type': 'FAQPage',
      mainEntity: DIGITAL_FAQS.map((item) => ({
        '@type': 'Question',
        name: item.question[language],
        acceptedAnswer: { '@type': 'Answer', text: item.answer[language] },
      })),
    };
    const payload = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [...serviceNodes, faqNode],
    }).replace(/</g, '\\u003c');
    let script = document.getElementById('aos-digital-jsonld') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'aos-digital-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = payload;
    return () => {
      document.getElementById('aos-digital-jsonld')?.remove();
    };
  }, [services, language]);
  const QUOTE_SERVICES = useMemo(() => buildQuoteServices({ services, packages }), [services, packages]);

  const visibleServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return services.filter((service) => {
      if (activeCategory !== 'all' && service.category !== activeCategory) return false;
      if (!query) return true;
      return [
        service.title[language],
        service.tagline[language],
        service.description[language],
        service.title.ar,
        service.title.fr,
        service.title.en,
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [activeCategory, services, search, language]);

  const money = (value: number) => value.toLocaleString('en-US').replace(/,/g, ' ');
  // RTL text flips numeric ranges ("5 – 14" renders as "14 – 5") and
  // space-grouped amounts ("35 000" renders as "000 35"). Unicode isolates
  // keep each number in reading order without changing the Arabic layout.
  const LRI = '\u2066';
  const PDI = '\u2069';
  const bidiRanges = (text: string) =>
    text.replace(/\d+(?:\s\d{3})*\s*[–—-]\s*\d+(?:\s\d{3})*/g, (match) => `${LRI}${match}${PDI}`);
  const priceLabel = (value: number) => `${LRI}${money(value)}${PDI} ${brand.currency[language]}`;

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === form.packageId),
    [form.packageId, packages],
  );

  const selectedService = useMemo(
    () => services.find((service) => service.bookingValue === form.service),
    [form.service, services],
  );

  const quotePrice = useMemo(() => {
    if (selectedPackage) {
      return { amount: selectedPackage.price, unit: t(selectedPackage.period) };
    }
    if (selectedService) {
      return { amount: selectedService.startingPrice, unit: t(selectedService.priceUnit) };
    }
    return null;
  }, [selectedPackage, selectedService, t]);

  const openQuote = (serviceValue?: string, packageId?: string) => {
    setSummary(null);
    setForm((prev) => ({
      ...prev,
      service: serviceValue ?? prev.service,
      packageId: packageId ?? (serviceValue ? '' : prev.packageId),
    }));
    window.setTimeout(() => {
      quoteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const resetQuote = () => {
    setForm(EMPTY_FORM);
    setSummary(null);
    window.setTimeout(() => {
      quoteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    if (!form.name.trim() || !form.phone.trim()) {
      toast.error(t({ ar: 'الرجاء إدخال الاسم ورقم الهاتف', fr: 'Veuillez saisir votre nom et votre téléphone', en: 'Please enter your name and phone number' }));
      return;
    }
    if (!form.service) {
      toast.error(t({ ar: 'الرجاء اختيار الخدمة المطلوبة', fr: 'Veuillez choisir le service souhaité', en: 'Please choose the service you need' }));
      return;
    }
    const phoneDigits = form.phone.replace(/\D/g, '');
    if (phoneDigits.length < 9 || phoneDigits.length > 13) {
      toast.error(t({ ar: 'رقم الهاتف غير صحيح. مثال: 0674 11 32 90', fr: 'Numéro de téléphone invalide. Ex : 0674 11 32 90', en: 'Invalid phone number. Example: 0674 11 32 90' }));
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      toast.error(t({ ar: 'البريد الإلكتروني غير صحيح', fr: 'Adresse e-mail invalide', en: 'Invalid email address' }));
      return;
    }

    const serviceLabel = t(
      QUOTE_SERVICES.find((option) => option.value === form.service)?.label ?? EXTRA_SERVICE_LABELS.advice,
    );
    const packageLabel = selectedPackage ? t(selectedPackage.name) : '';
    const budgetLabel = t(QUOTE_BUDGETS.find((option) => option.value === form.budget)?.label ?? QUOTE_BUDGETS[0].label);
    const deadlineLabel = t(QUOTE_DEADLINES.find((option) => option.value === form.deadline)?.label ?? QUOTE_DEADLINES[0].label);
    const orderPrice = quotePrice?.amount ?? 0;
    const orderPriceUnit = quotePrice?.unit ?? '';
    const orderPriceText = orderPrice
      ? `${orderPrice.toLocaleString('en-US').replace(/,/g, ' ')} ${brand.currency[language]}${orderPriceUnit ? ` ${orderPriceUnit}` : ''}`
      : '';
    const details = form.details.trim().slice(0, 240);
    const fullName = form.name.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const wilaya = form.wilaya.trim();

    setSubmitting(true);
    try {
      const note = [
        `${t({ ar: 'الخدمة', fr: 'Service', en: 'Service' })}: ${serviceLabel}`,
        packageLabel ? `${t({ ar: 'الباقة', fr: 'Pack', en: 'Pack' })}: ${packageLabel}` : '',
        orderPriceText ? `${t({ ar: 'السعر', fr: 'Prix', en: 'Price' })}: ${orderPriceText}` : '',
        `${t({ ar: 'الميزانية', fr: 'Budget', en: 'Budget' })}: ${budgetLabel}`,
        `${t({ ar: 'الأجل', fr: 'Délai', en: 'Timeline' })}: ${deadlineLabel}`,
        wilaya ? `${t({ ar: 'الولاية', fr: 'Wilaya', en: 'Wilaya' })}: ${wilaya}` : '',
        details ? `${t({ ar: 'التفاصيل', fr: 'Détails', en: 'Details' })}: ${details}` : '',
        t({ ar: 'المصدر: طلب عرض سعر رقمي', fr: 'Source : demande de devis numérique', en: 'Source: digital quote request' }),
      ]
        .filter(Boolean)
        .join(' | ')
        .slice(0, 500);

      const order = await saveOrder({
        customer: fullName,
        phone,
        email,
        wilaya,
        municipality: '',
        address: '',
        note,
        items: [
          {
            name: `${serviceLabel}${packageLabel ? ` — ${packageLabel}` : ''}`,
            quantity: 1,
            price: orderPrice,
            total: orderPrice,
          },
        ],
        total: orderPrice,
        source: 'service-booking',
      });

      const reference = order.id.replace(/[^A-Za-z0-9]/g, '').slice(-6).toUpperCase();
      const whatsappText = [
        t({ ar: 'مرحباً AOS، أرسلت طلب عرض سعر رقمي عبر الموقع.', fr: 'Bonjour AOS, j’ai envoyé une demande de devis numérique via le site.', en: 'Hello AOS, I sent a digital quote request through the website.' }),
        `${t({ ar: 'الاسم', fr: 'Nom', en: 'Name' })}: ${fullName}`,
        `${t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}: ${phone}`,
        `${t({ ar: 'الخدمة', fr: 'Service', en: 'Service' })}: ${serviceLabel}${packageLabel ? ` — ${packageLabel}` : ''}`,
        orderPriceText ? `${t({ ar: 'السعر', fr: 'Prix', en: 'Price' })}: ${orderPriceText}` : '',
        reference ? `${t({ ar: 'المرجع', fr: 'Référence', en: 'Reference' })}: #${reference}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      setSummary({
        name: fullName,
        phone,
        service: serviceLabel,
        packageName: packageLabel,
        budget: budgetLabel,
        deadline: deadlineLabel,
        reference,
        whatsappUrl: `https://wa.me/${brand.contact.phoneInternational}?text=${encodeURIComponent(whatsappText)}`,
        price: orderPrice ? priceLabel(orderPrice) : undefined,
        priceUnit: orderPriceUnit,
      });
      toast.success(t({ ar: 'وصلنا طلبك! سنتواصل معك خلال 24 ساعة', fr: 'Demande reçue ! Nous vous contactons sous 24 h', en: 'Request received! We will contact you within 24 hours' }));

      void submitOrderToSheet({
        name: fullName,
        phone,
        email,
        product: `${serviceLabel}${packageLabel ? ` — ${packageLabel}` : ''}`,
        quantity: 1,
        wilaya,
        notes: `الميزانية: ${budgetLabel} | الأجل: ${deadlineLabel}${details ? ` | ${details}` : ''} | المصدر: عرض سعر رقمي`,
      });
    } catch (err: any) {
      console.error('[DigitalServices] quote submit failed:', err);
      toast.error(
        describeOrderError(err, language) ||
          err?.message ||
          t({ ar: 'تعذر إرسال الطلب. حاول مرة أخرى.', fr: 'Impossible d’envoyer la demande. Réessayez.', en: 'Could not send the request. Please try again.' }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';
  const labelClass = 'mb-1.5 block text-sm font-bold';

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      id="digital-services"
      className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 py-16 dark:from-slate-950 dark:via-slate-900/40 dark:to-slate-950 md:py-24"
    >
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-[45%] h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Intro */}
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
            <Sparkles className="h-4 w-4" />
            {t({ ar: 'حلول رقمية 360°', fr: 'Solutions digitales 360°', en: '360° digital solutions' })}
          </span>
          <h2 className="mt-5 text-3xl font-black leading-tight md:text-5xl">
            {t({
              ar: 'خدمات رقمية ترفع مشروعك إلى المستوى التالي',
              fr: 'Des services digitaux qui font passer votre projet au niveau supérieur',
              en: 'Digital services that take your business to the next level',
            })}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {t({
              ar: 'من الفكرة إلى الإطلاق: متاجر ومواقع، محتوى وذكاء اصطناعي، إعلانات، استضافة، أنظمة بيع، شبكات وكاميرات، وتكوين — بفريق واحد، عقد واضح، ومتابعة بعد التسليم.',
              fr: 'De l’idée au lancement : boutiques et sites, contenu et IA, publicité, hébergement, caisses, réseaux et caméras, formation — une seule équipe, un contrat clair et un suivi après livraison.',
              en: 'From idea to launch: stores and websites, content and AI, ads, hosting, POS systems, networks and cameras, training — one team, a clear contract and post-delivery support.',
            })}
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => openQuote()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-blue-700 px-6 py-3.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/25 transition hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
            >
              {t({ ar: 'اطلب عرض سعر مجاني', fr: 'Demander un devis gratuit', en: 'Request a free quote' })}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </button>
            <a
              href={`https://wa.me/${brand.contact.phoneInternational}?text=${encodeURIComponent(
                t({
                  ar: 'مرحباً AOS، أريد استشارة حول الخدمات الرقمية.',
                  fr: 'Bonjour AOS, je souhaite un conseil sur vos services digitaux.',
                  en: 'Hello AOS, I would like advice about your digital services.',
                }),
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-border bg-card px-6 py-3.5 text-sm font-black transition hover:border-primary/40 hover:text-primary sm:w-auto"
            >
              <MessageCircle className="h-4 w-4" />
              {t({ ar: 'استشارة سريعة عبر واتساب', fr: 'Conseil rapide sur WhatsApp', en: 'Quick advice on WhatsApp' })}
            </a>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {DIGITAL_TRUST.map((item) => {
            const Icon = trustIcons[item.icon] || ShieldCheck;
            return (
              <div
                key={item.icon}
                className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3 shadow-sm backdrop-blur"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="text-xs font-bold sm:text-sm">{t(item.label)}</span>
              </div>
            );
          })}
        </div>

        {/* AI highlight */}
        <div id="ai-tools-banner" className="mt-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white shadow-xl shadow-primary/20 md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <Bot className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg font-black md:text-2xl">
                  {t({
                    ar: 'أدوات الذكاء الاصطناعي — بدون اشتراكات تدفعها أنت',
                    fr: 'Outils d’IA — sans abonnements à votre charge',
                    en: 'AI tools — without subscriptions on your side',
                  })}
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/75">
                  {t({
                    ar: 'نستخدم أقوى أدوات الذكاء الاصطناعي نيابة عنك، ونسلّمك النتيجة النهائية جاهزة: سيرة ذاتية، شعار، صور، فيديو، ترجمة، شات بوت أو أتمتة — بسعر خدمة واضح.',
                    fr: 'Nous utilisons les meilleurs outils d’IA pour votre compte et vous livrons le résultat final prêt : CV, logo, photos, vidéo, traduction, chatbot ou automatisation — à un prix clair.',
                    en: 'We use the best AI tools on your behalf and deliver the finished result: CV, logo, photos, video, translation, chatbot or automation — at a clear service price.',
                  })}
                </p>
                <a
                  href="/premium-services"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-white/85 underline underline-offset-4 transition hover:text-white"
                >
                  {t({ ar: 'الخدمات المميزة للشركات', fr: 'Services premium pour entreprises', en: 'Premium services for businesses' })}
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </a>
                <a
                  href="/ai-tools"
                  className="mt-3 ms-4 inline-flex items-center gap-1 text-xs font-bold text-white/85 underline underline-offset-4 transition hover:text-white"
                >
                  {t({ ar: '13 أداة ذكاء اصطناعي للمتاجر', fr: '13 outils IA pour boutiques', en: '13 AI tools for stores' })}
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </a>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:items-center">
              <a
                href="#ai-studio"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/25 transition hover:bg-white/20"
              >
                <Sparkles className="h-4 w-4" />
                {t({ ar: 'جرّب AI Studio', fr: 'Essayer AI Studio', en: 'Try AI Studio' })}
              </a>
              <button
                type="button"
                onClick={() =>
                  openQuote(
                    services.find((service) => service.category === 'ai')?.bookingValue ??
                      services[0]?.bookingValue,
                  )
                }
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-black text-primary shadow-lg transition hover:-translate-y-0.5"
              >
                {t({ ar: 'اطلب خدمة AI', fr: 'Demander un service IA', en: 'Request an AI service' })}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        </div>

        {/* Live generator: the key stays on the server; the browser only gets the text. */}
        <AiStudio
          onRequestService={openQuote}
          cvServiceValue={services.find((service) => service.id === 'ai-cv')?.bookingValue}
          contentServiceValue={services.find((service) => service.id === 'ai-content')?.bookingValue}
        />

        {/* Category filter + search */}
        <div id="digital-filters" className="mt-10 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {DIGITAL_CATEGORIES.map((category) => {
            const isActive = activeCategory === category.id;
            const count = category.id === 'all'
              ? services.length
              : services.filter((service) => service.category === category.id).length;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black transition sm:text-sm ${
                  isActive
                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-primary'
                }`}
              >
                {t(category.label)}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${isActive ? 'bg-white/20' : 'bg-muted'}`}>
                  {count}
                </span>
              </button>
            );
            })}
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t({
                ar: 'ابحث عن خدمة: سيرة ذاتية، شعار، شات بوت...',
                fr: 'Rechercher : CV, logo, chatbot…',
                en: 'Search: CV, logo, chatbot…',
              })}
              aria-label={t({ ar: 'بحث في الخدمات الرقمية', fr: 'Rechercher dans les services digitaux', en: 'Search digital services' })}
              className="w-full rounded-full border-2 border-border bg-card py-2.5 pe-4 ps-11 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Services */}
        <div className="mt-14 md:mt-20">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
                {t({ ar: '01 — الخدمات', fr: '01 — Services', en: '01 — Services' })}
              </span>
              <h3 className="mt-2 text-2xl font-black md:text-3xl">
                {t({ ar: 'خدمات رقمية وذكاء اصطناعي في مكان واحد', fr: 'Services digitaux et IA au même endroit', en: 'Digital services and AI in one place' })}
              </h3>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-end">
              {t({
                ar: 'اختر الخدمة التي تناسبك، وسنرسل لك عرض سعر مفصلاً خلال 24 ساعة عمل — دون أي التزام.',
                fr: 'Choisissez votre service et recevez un devis détaillé sous 24 h ouvrées — sans engagement.',
                en: 'Choose your service and receive a detailed quote within 24 working hours — no obligation.',
              })}
            </p>
          </div>

          <div id="digital-services-grid" className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {visibleServices.map((service, index) => {
              const Icon = serviceIcons[service.icon];
              return (
                <motion.article
                  key={service.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: (index % 3) * 0.08 }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                >
                  <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${service.gradient}`} aria-hidden="true" />

                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${service.gradient} text-white shadow-lg`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    {service.badge && (
                      <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-black text-primary">
                        {t(service.badge)}
                      </span>
                    )}
                  </div>

                  <h4 className="mt-4 text-xl font-black leading-snug">{t(service.title)}</h4>
                  <p className="mt-1 text-sm font-bold text-primary">{t(service.tagline)}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(service.description)}</p>

                  <div className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                    <Clock3 className="h-3.5 w-3.5" />
                    {bidiRanges(t(service.delivery))}
                  </div>

                  <ul className="mt-4 space-y-2">
                    {service.features.map((feature) => (
                      <li key={feature.ar} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                        <span className="text-muted-foreground">{bidiRanges(t(feature))}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto pt-5">
                    <div className="flex items-end justify-between gap-3 border-t border-border pt-4">
                      <div>
                        <span className="block text-[11px] font-semibold text-muted-foreground">
                          {t({ ar: 'تبدأ من', fr: 'À partir de', en: 'Starting from' })}
                        </span>
                        <span className="text-xl font-black text-primary">{priceLabel(service.startingPrice)}</span>
                        <span className="ms-1 text-[11px] font-semibold text-muted-foreground">{t(service.priceUnit)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openQuote(service.bookingValue)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-black text-primary transition group-hover:bg-primary group-hover:text-primary-foreground"
                      >
                        {service.category === 'ai'
                          ? t({ ar: 'اطلب الآن', fr: 'Commander', en: 'Order now' })
                          : t({ ar: 'عرض سعر', fr: 'Devis', en: 'Quote' })}
                        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>

          {visibleServices.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
              <p className="text-lg font-black">
                {t({ ar: 'لا توجد خدمة مطابقة لبحثك', fr: 'Aucun service ne correspond à votre recherche', en: 'No service matches your search' })}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t({ ar: 'جرّب كلمة أخرى أو اعرض كل الخدمات.', fr: 'Essayez un autre mot ou affichez tous les services.', en: 'Try another word or show all services.' })}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setActiveCategory('all');
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground"
              >
                {t({ ar: 'عرض كل الخدمات', fr: 'Voir tous les services', en: 'Show all services' })}
              </button>
            </div>
          )}
        </div>

        {/* Packages */}
        <div className="mt-16 scroll-mt-24 md:mt-24" id="digital-packages">
          <div className="mb-6 text-center">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
              {t({ ar: '02 — الباقات', fr: '02 — Packs', en: '02 — Packs' })}
            </span>
            <h3 className="mt-2 text-2xl font-black md:text-3xl">
              {t({ ar: 'باقات جاهزة بأسعار واضحة', fr: 'Des packs prêts à l’emploi, à prix clair', en: 'Ready-made packs with clear pricing' })}
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t({
                ar: 'كل باقة تشمل ما هو مذكور بالتفصيل. أي إضافة خارج الباقة تُتفق كتابياً قبل البدء — لا مفاجآت.',
                fr: 'Chaque pack inclut tout ce qui est détaillé. Toute addition est convenue par écrit avant le démarrage — aucune surprise.',
                en: 'Every pack includes everything listed. Any extra is agreed in writing before we start — no surprises.',
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {packages.map((pkg, index) => (
              <motion.article
                key={pkg.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
                className={`relative flex h-full flex-col rounded-3xl border p-6 ${
                  pkg.featured
                    ? `border-transparent bg-gradient-to-br ${pkg.gradient} text-white shadow-2xl shadow-primary/25 xl:-translate-y-2`
                    : 'border-border bg-card shadow-sm'
                }`}
              >
                {pkg.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-amber-950 shadow">
                    {t({ ar: 'الأكثر طلباً', fr: 'Le plus demandé', en: 'Most popular' })}
                  </span>
                )}

                <h4 className="text-lg font-black">{t(pkg.name)}</h4>
                <p className={`mt-1 text-xs leading-relaxed ${pkg.featured ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {t(pkg.tagline)}
                </p>

                <div className="mt-4 flex items-end gap-1.5">
                  <span className="text-3xl font-black tracking-tight">{priceLabel(pkg.price)}</span>
                  <span className={`pb-1 text-[11px] font-semibold ${pkg.featured ? 'text-white/75' : 'text-muted-foreground'}`}>
                    {t(pkg.period)}
                  </span>
                </div>

                <ul className="mt-5 space-y-2.5">
                  {pkg.features.map((feature) => (
                    <li key={feature.ar} className="flex items-start gap-2 text-xs leading-relaxed sm:text-[13px]">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          pkg.featured ? 'bg-white/20 text-white' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                      </span>
                      <span className={pkg.featured ? 'text-white/90' : 'text-muted-foreground'}>{bidiRanges(t(feature))}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => openQuote(pkg.bookingValue, pkg.id)}
                  className={`mt-auto inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                    pkg.featured
                      ? 'mt-6 bg-white text-slate-900 hover:bg-white/90'
                      : 'mt-6 bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {t(pkg.cta)}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              </motion.article>
            ))}
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t({
              ar: 'الأسعار بالدينار الجزائري. باقة النمو شهرية بدون التزام طويل، وباقة الحماية سنوية.',
              fr: 'Prix en dinars algériens. Pack Croissance mensuel sans engagement long, Pack Protection annuel.',
              en: 'Prices in Algerian dinars. Growth pack is monthly with no long commitment; Protection pack is annual.',
            })}
          </p>
        </div>

        {/* Process + guarantees */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:mt-24 lg:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
              {t({ ar: '03 — طريقة العمل', fr: '03 — Notre méthode', en: '03 — How we work' })}
            </span>
            <h3 className="mt-2 text-2xl font-black">
              {t({ ar: 'أربع خطوات واضحة من الفكرة إلى الإطلاق', fr: 'Quatre étapes claires, de l’idée au lancement', en: 'Four clear steps from idea to launch' })}
            </h3>

            <ol className="mt-6 space-y-5">
              {DIGITAL_STEPS.map((step, index) => (
                <li key={step.id} className="flex gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black text-primary">
                    {index + 1}
                  </span>
                  <div className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <h4 className="text-sm font-black">{t(step.title)}</h4>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(step.description)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-6 shadow-sm md:p-8">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
              {t({ ar: '04 — ضماناتنا', fr: '04 — Nos garanties', en: '04 — Our guarantees' })}
            </span>
            <h3 className="mt-2 text-2xl font-black">
              {t({ ar: 'التزامات مكتوبة تحمي استثمارك', fr: 'Des engagements écrits qui protègent votre investissement', en: 'Written commitments that protect your investment' })}
            </h3>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {DIGITAL_GUARANTEES.map((item) => {
                const Icon = guaranteeIcons[item.icon] || ShieldCheck;
                return (
                  <div key={item.id} className="rounded-2xl border border-border/70 bg-card/80 p-4">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-[18px] w-[18px]" />
                    </span>
                    <h4 className="mt-2.5 text-sm font-black">{t(item.title)}</h4>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(item.description)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* FAQ + quote form */}
        <div className="mt-16 grid grid-cols-1 gap-6 md:mt-24 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <span className="text-[11px] font-black uppercase tracking-[0.22em] text-primary">
              {t({ ar: '05 — أسئلة شائعة', fr: '05 — Questions fréquentes', en: '05 — FAQ' })}
            </span>
            <h3 className="mt-2 text-2xl font-black md:text-3xl">
              {t({ ar: 'كل ما تحتاج معرفته قبل البدء', fr: 'Tout savoir avant de commencer', en: 'Everything to know before starting' })}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {t({
                ar: 'لم تجد إجابتك؟ اكتب لنا عبر النموذج أو واتساب، وسنجيبك بوضوح دون مصطلحات معقدة.',
                fr: 'Vous ne trouvez pas votre réponse ? Écrivez-nous via le formulaire ou WhatsApp, nous répondons clairement.',
                en: 'Cannot find your answer? Write to us via the form or WhatsApp, and we will answer clearly.',
              })}
            </p>

            <div className="mt-5 space-y-3">
              {DIGITAL_FAQS.map((faq) => {
                const isOpen = openFaq === faq.id;
                return (
                  <div key={faq.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      aria-expanded={isOpen}
                      aria-controls={`digital-faq-${faq.id}`}
                      className="flex w-full items-center justify-between gap-3 p-4 text-start"
                    >
                      <span className="text-sm font-bold">{t(faq.question)}</span>
                      <ChevronDown
                        className={`h-[18px] w-[18px] shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {isOpen && (
                      <motion.div
                        id={`digital-faq-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{bidiRanges(t(faq.answer))}</p>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div ref={quoteRef} id="digital-quote" className="scroll-mt-24 lg:col-span-3">
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-primary/5">
              <div className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-6 text-white sm:p-8">
                <div aria-hidden="true" className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 blur-2xl" />
                <div className="relative">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold ring-1 ring-white/20">
                    <Sparkles className="h-3.5 w-3.5" />
                    {quotePrice
                      ? t({ ar: 'سعر واضح — دفع بعد التسليم', fr: 'Prix clair — paiement à la livraison', en: 'Clear price — pay on delivery' })
                      : t({ ar: 'مجاني وبدون التزام', fr: 'Gratuit et sans engagement', en: 'Free and without obligation' })}
                  </span>
                  <h3 className="mt-3 text-2xl font-black sm:text-3xl">
                    {quotePrice
                      ? t({ ar: 'اطلب خدمتك الآن', fr: 'Commandez votre service', en: 'Order your service' })
                      : t({ ar: 'اطلب عرض سعر مفصلاً', fr: 'Demandez un devis détaillé', en: 'Request a detailed quote' })}
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/80">
                    {quotePrice
                      ? t({
                          ar: 'اختر الخدمة وأدخل بياناتك، ونؤكد الطلب معك عبر واتساب. الدفع بعد التسليم — بدون اشتراكات ولا مصاريف خفية.',
                          fr: 'Choisissez le service et vos coordonnées, nous confirmons la commande sur WhatsApp. Paiement à la livraison — sans abonnement ni frais cachés.',
                          en: 'Choose the service and enter your details; we confirm the order on WhatsApp. Payment on delivery — no subscriptions or hidden fees.',
                        })
                      : t({
                          ar: 'أخبرنا بما تحتاجه، ونعود إليك خلال 24 ساعة عمل بخطة وسعر واضحين. لا نطلب أي دفع في هذه المرحلة.',
                          fr: 'Dites-nous ce dont vous avez besoin : nous revenons sous 24 h ouvrées avec un plan et un prix clairs. Aucun paiement à cette étape.',
                          en: 'Tell us what you need and we will get back within 24 working hours with a clear plan and price. No payment at this stage.',
                        })}
                  </p>
                </div>
              </div>

              {summary ? (
                <div className="p-6 text-center sm:p-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/25">
                    <CheckCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="mt-4 text-2xl font-black">
                    {t({ ar: 'وصلنا طلبك بنجاح!', fr: 'Votre demande est bien reçue !', en: 'Your request was received!' })}
                  </h4>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                    {t({
                      ar: `شكراً ${summary.name}، سيتواصل معك فريقنا خلال 24 ساعة عمل بعرض سعر مفصّل.`,
                      fr: `Merci ${summary.name}, notre équipe vous contactera sous 24 h ouvrées avec un devis détaillé.`,
                      en: `Thank you ${summary.name}, our team will contact you within 24 working hours with a detailed quote.`,
                    })}
                  </p>

                  <div className="mt-5 rounded-2xl border border-border bg-background p-5 text-start">
                    <div className="mb-3 flex items-center justify-between gap-3 border-b border-border pb-3">
                      <span className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                        {t({ ar: 'ملخص الطلب', fr: 'Récapitulatif', en: 'Request summary' })}
                      </span>
                      {summary.reference && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-bold text-primary">
                          #{summary.reference}
                        </span>
                      )}
                    </div>
                    <dl className="space-y-2.5 text-sm">
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-muted-foreground">{t({ ar: 'الخدمة', fr: 'Service', en: 'Service' })}</dt>
                        <dd className="text-end font-bold text-primary">
                          {summary.service}
                          {summary.packageName ? ` — ${summary.packageName}` : ''}
                        </dd>
                      </div>
                      {summary.price && (
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-muted-foreground">{t({ ar: 'السعر', fr: 'Prix', en: 'Price' })}</dt>
                          <dd className="text-end font-black text-primary">
                            {summary.price}
                            {summary.priceUnit ? ` ${summary.priceUnit}` : ''}
                          </dd>
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-muted-foreground">{t({ ar: 'الاسم', fr: 'Nom', en: 'Name' })}</dt>
                        <dd className="font-semibold">{summary.name}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-muted-foreground">{t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}</dt>
                        <dd className="font-semibold" dir="ltr">{summary.phone}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-muted-foreground">{t({ ar: 'الميزانية', fr: 'Budget', en: 'Budget' })}</dt>
                        <dd className="text-end font-semibold">{summary.budget}</dd>
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <dt className="text-muted-foreground">{t({ ar: 'الأجل', fr: 'Délai', en: 'Timeline' })}</dt>
                        <dd className="text-end font-semibold">{summary.deadline}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <a
                      href={summary.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white transition hover:bg-emerald-700"
                    >
                      <MessageCircle className="h-[18px] w-[18px]" />
                      {t({ ar: 'تابع الطلب عبر واتساب', fr: 'Suivre sur WhatsApp', en: 'Follow up on WhatsApp' })}
                    </a>
                    <button
                      type="button"
                      onClick={resetQuote}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-border px-5 py-3.5 text-sm font-black transition hover:border-primary/40 hover:text-primary"
                    >
                      {t({ ar: 'طلب عرض سعر آخر', fr: 'Nouvelle demande', en: 'New request' })}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 p-6 sm:p-8">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="digital-name" className={labelClass}>
                        {t({ ar: 'الاسم الكامل', fr: 'Nom complet', en: 'Full name' })} <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="digital-name"
                        name="name"
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        placeholder={t({ ar: 'مثال: أحمد بن علي', fr: 'Ex : Ahmed Ben Ali', en: 'Ex: Ahmed Ben Ali' })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label htmlFor="digital-phone" className={labelClass}>
                        {t({ ar: 'رقم الهاتف', fr: 'Téléphone', en: 'Phone' })} <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="digital-phone"
                        name="phone"
                        type="tel"
                        required
                        inputMode="tel"
                        autoComplete="tel"
                        dir="ltr"
                        value={form.phone}
                        onChange={(event) => setForm({ ...form, phone: event.target.value })}
                        placeholder="0674 11 32 90"
                        className={`${inputClass} text-start`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="digital-email" className={labelClass}>
                        {t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
                        <span className="ms-1 text-xs font-normal text-muted-foreground">
                          ({t({ ar: 'اختياري', fr: 'facultatif', en: 'optional' })})
                        </span>
                      </label>
                      <input
                        id="digital-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        dir="ltr"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        placeholder="you@example.com"
                        className={`${inputClass} text-start`}
                      />
                    </div>
                    <div>
                      <label htmlFor="digital-wilaya" className={labelClass}>
                        {t({ ar: 'الولاية / المدينة', fr: 'Wilaya / ville', en: 'Wilaya / city' })}
                      </label>
                      <input
                        id="digital-wilaya"
                        name="wilaya"
                        value={form.wilaya}
                        onChange={(event) => setForm({ ...form, wilaya: event.target.value })}
                        placeholder={t({ ar: 'مثال: جيجل', fr: 'Ex : Jijel', en: 'Ex: Jijel' })}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="digital-service" className={labelClass}>
                        {t({ ar: 'الخدمة المطلوبة', fr: 'Service souhaité', en: 'Service needed' })} <span className="text-destructive">*</span>
                      </label>
                      <select
                        id="digital-service"
                        name="service"
                        required
                        value={form.service}
                        onChange={(event) => setForm({ ...form, service: event.target.value, packageId: '' })}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">{t({ ar: '-- اختر الخدمة --', fr: '-- Choisir --', en: '-- Select --' })}</option>
                        {QUOTE_SERVICES.map((option) => (
                          <option key={option.value} value={option.value}>
                            {t(option.label)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="digital-package" className={labelClass}>
                        {t({ ar: 'الباقة', fr: 'Pack', en: 'Pack' })}
                        <span className="ms-1 text-xs font-normal text-muted-foreground">
                          ({t({ ar: 'اختياري', fr: 'facultatif', en: 'optional' })})
                        </span>
                      </label>
                      <select
                        id="digital-package"
                        name="package"
                        value={form.packageId}
                        onChange={(event) => {
                          const pkg = packages.find((item) => item.id === event.target.value);
                          setForm({
                            ...form,
                            packageId: event.target.value,
                            service: pkg ? pkg.bookingValue : form.service,
                          });
                        }}
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="">{t({ ar: 'بدون باقة محددة', fr: 'Sans pack précis', en: 'No specific pack' })}</option>
                        {packages.map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {t(pkg.name)} — {priceLabel(pkg.price)} {t(pkg.period)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="digital-budget" className={labelClass}>
                        {t({ ar: 'الميزانية التقديرية', fr: 'Budget estimé', en: 'Estimated budget' })}
                      </label>
                      <select
                        id="digital-budget"
                        name="budget"
                        value={form.budget}
                        onChange={(event) => setForm({ ...form, budget: event.target.value })}
                        className={`${inputClass} cursor-pointer`}
                      >
                        {QUOTE_BUDGETS.map((option) => (
                          <option key={option.value} value={option.value}>{t(option.label)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="digital-deadline" className={labelClass}>
                        {t({ ar: 'الأجل المطلوب', fr: 'Délai souhaité', en: 'Desired timeline' })}
                      </label>
                      <select
                        id="digital-deadline"
                        name="deadline"
                        value={form.deadline}
                        onChange={(event) => setForm({ ...form, deadline: event.target.value })}
                        className={`${inputClass} cursor-pointer`}
                      >
                        {QUOTE_DEADLINES.map((option) => (
                          <option key={option.value} value={option.value}>{t(option.label)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="digital-details" className="block text-sm font-bold">
                        {t({ ar: 'تفاصيل المشروع', fr: 'Détails du projet', en: 'Project details' })}
                      </label>
                      <span className="text-[11px] text-muted-foreground">{form.details.length}/240</span>
                    </div>
                    <textarea
                      id="digital-details"
                      name="details"
                      rows={4}
                      maxLength={240}
                      value={form.details}
                      onChange={(event) => setForm({ ...form, details: event.target.value })}
                      placeholder={t({
                        ar: 'صف نشاطك وما تحتاجه: عدد الصفحات أو المنتجات، الخدمات، الأهداف... أي تفاصيل تساعدنا على فهم مشروعك.',
                        fr: 'Décrivez votre activité et votre besoin : pages ou produits, services, objectifs… tout détail utile.',
                        en: 'Describe your business and needs: pages or products, services, goals… anything that helps us understand your project.',
                      })}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {quotePrice && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <div>
                        <p className="text-sm font-black">{t({ ar: 'قيمة الخدمة', fr: 'Prix du service', en: 'Service price' })}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {t({ ar: 'الدفع بعد التسليم — بدون اشتراكات', fr: 'Paiement à la livraison — sans abonnement', en: 'Payment on delivery — no subscriptions' })}
                        </p>
                      </div>
                      <p className="text-xl font-black text-primary">
                        {priceLabel(quotePrice.amount)}
                        <span className="ms-1 text-[11px] font-semibold text-muted-foreground">{quotePrice.unit}</span>
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-700 px-6 py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {t({ ar: 'جارٍ إرسال الطلب...', fr: 'Envoi en cours…', en: 'Sending request…' })}
                      </>
                    ) : (
                      <>
                        <Send className="h-[18px] w-[18px] rtl:rotate-180" />
                        {quotePrice
                          ? t({ ar: 'أرسل الطلب — نؤكده عبر واتساب', fr: 'Envoyer — confirmation sur WhatsApp', en: 'Send — confirm on WhatsApp' })
                          : t({ ar: 'أرسل الطلب — رد خلال 24 ساعة', fr: 'Envoyer — réponse sous 24 h', en: 'Send — reply within 24 hours' })}
                      </>
                    )}
                  </button>

                  <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {quotePrice
                      ? t({
                          ar: 'بياناتك تُستعمل فقط للتواصل بخصوص طلبك. الدفع بعد تأكيد الطلب والتسليم، ولا نشارك معلوماتك مع أي طرف.',
                          fr: 'Vos données servent uniquement à traiter votre commande. Paiement après confirmation et livraison, aucune donnée partagée.',
                          en: 'Your data is used only to handle your order. Payment after confirmation and delivery; your data is never shared.',
                        })
                      : t({
                          ar: 'بياناتك تُستعمل فقط للتواصل بخصوص طلبك. لا نطلب أي دفع في هذه المرحلة، ولا نشارك معلوماتك مع أي طرف.',
                          fr: 'Vos données servent uniquement à vous répondre. Aucun paiement à cette étape et aucune donnée partagée.',
                          en: 'Your data is used only to reply to your request. No payment at this stage, and no data shared with third parties.',
                        })}
                  </p>
                </form>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-semibold text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-primary" />
                <a href={`tel:${brand.contact.phoneInternational}`} dir="ltr" className="hover:text-primary">{brand.contact.phoneDisplay}</a>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" />
                <a href={`mailto:${brand.contact.email}`} className="hover:text-primary">{brand.contact.email}</a>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {t(brand.contact.address)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

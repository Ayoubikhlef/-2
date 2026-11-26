import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  LayoutGrid,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { premiumServices, type PremiumService } from '../data/highValueServices';
import { BrutalistCard } from './BrutalistCard';

type Language = 'ar' | 'fr' | 'en';

const CATEGORY_ORDER: PremiumService['category'][] = [
  'subscription',
  'recurring',
  'project-based',
  'marketplace',
];

const CATEGORY_META: Record<
  PremiumService['category'],
  { icon: typeof Repeat; label: { ar: string; fr: string; en: string }; blurb: { ar: string; fr: string; en: string } }
> = {
  subscription: {
    icon: Repeat,
    label: { ar: 'اشتراكات شهرية', fr: 'Abonnements mensuels', en: 'Monthly subscriptions' },
    blurb: {
      ar: 'خدمات مستمرة تُدار نيابة عنك كل شهر.',
      fr: 'Des services gérés pour vous, chaque mois.',
      en: 'Ongoing services managed for you every month.',
    },
  },
  recurring: {
    icon: RefreshCw,
    label: { ar: 'خدمات متكررة', fr: 'Services récurrents', en: 'Recurring services' },
    blurb: {
      ar: 'تجديد دوري مع متابعة كاملة.',
      fr: 'Renouvellement périodique avec suivi complet.',
      en: 'Periodic renewal with full follow-up.',
    },
  },
  'project-based': {
    icon: Briefcase,
    label: { ar: 'مشاريع بمواصفات', fr: 'Projets sur mesure', en: 'Project-based work' },
    blurb: {
      ar: 'تنفيذ كامل من التحليل إلى التسليم.',
      fr: "De l'analyse à la livraison.",
      en: 'End-to-end delivery, from analysis to launch.',
    },
  },
  marketplace: {
    icon: LayoutGrid,
    label: { ar: 'منصات وسوق', fr: 'Plateformes et marketplace', en: 'Platforms & marketplace' },
    blurb: {
      ar: 'حلول جاهزة للتوسّع.',
      fr: 'Des solutions prêtes à évoluer.',
      en: 'Solutions built to scale.',
    },
  },
};

function formatPrice(value: number, language: Language): string {
  const amount = value.toLocaleString('en-US');
  if (language === 'ar') return `${amount} دج`;
  if (language === 'fr') return `${amount} DA`;
  return `${amount} DZD`;
}

function ServiceCard({
  service,
  language,
  t,
}: {
  service: PremiumService;
  language: Language;
  t: (translations: { ar: string; fr: string; en: string }) => string;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = `premium-panel-${service.id}`;
  const name = language === 'ar' ? service.nameAr : language === 'fr' ? service.nameFr : service.nameEn;
  const shortDesc =
    language === 'ar' ? service.shortDescAr : language === 'fr' ? service.shortDescFr : service.shortDescEn;
  const fullDesc =
    language === 'ar' ? service.fullDescAr : language === 'fr' ? service.fullDescFr : service.fullDescEn;

  const tiers = [
    { key: 'basic', price: service.prices.basic, label: t({ ar: 'أساسي', fr: 'Basique', en: 'Basic' }) },
    { key: 'standard', price: service.prices.standard, label: t({ ar: 'قياسي', fr: 'Standard', en: 'Standard' }) },
    { key: 'premium', price: service.prices.premium, label: t({ ar: 'متقدم', fr: 'Premium', en: 'Premium' }) },
  ];

  return (
    <article className="rounded-2xl border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-snug">{name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{shortDesc}</p>
          </div>
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
            {t({ ar: 'من', fr: 'Dès', en: 'From' })} {formatPrice(service.prices.basic, language)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {service.implementationTime && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <Clock className="h-3.5 w-3.5" />
              {service.implementationTime}
            </span>
          )}
          {service.recurringMonthly && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
              <CreditCard className="h-3.5 w-3.5" />
              {formatPrice(service.recurringMonthly, language)} {t({ ar: '/شهر', fr: '/mois', en: '/month' })}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t({ ar: 'دعم بعد التسليم', fr: 'Suivi après livraison', en: 'Post-delivery support' })}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80"
        >
          {expanded
            ? t({ ar: 'إخفاء التفاصيل', fr: 'Masquer les détails', en: 'Hide details' })
            : t({ ar: 'عرض التفاصيل والأسعار', fr: 'Voir les détails et tarifs', en: 'View details and pricing' })}
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {expanded && (
        <div id={panelId} className="border-t border-border px-6 pb-6 pt-4">
          {fullDesc && <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{fullDesc}</p>}

          <div className="grid gap-3 sm:grid-cols-3">
            {tiers.map((tier, index) => (
              <BrutalistCard
                key={tier.key}
                title={tier.label}
                price={formatPrice(tier.price, language)}
                description={t({ ar: 'سعر واضح بدون التزام.', fr: 'Tarif clair, sans engagement.', en: 'Clear price, no commitment.' })}
                badge={index === 1
                  ? t({ ar: 'الأكثر طلباً', fr: 'Le plus demandé', en: 'Most requested' })
                  : undefined}
                actionLabel={t({ ar: 'اطلب الخدمة', fr: 'Commander', en: 'Request service' })}
                backLabel={t({ ar: 'تم الاختيار', fr: 'Choisi', en: 'Selected' })}
                active={index === 1}
                onClick={() => {
                  window.location.assign('/#booking');
                }}
              />
            ))}
          </div>

          {service.setupFee && (
            <p className="mt-4 text-xs text-muted-foreground">
              {t({ ar: 'رسوم التأسيس لمرة واحدة', fr: 'Frais de mise en place uniques', en: 'One-time setup fee' })}:{' '}
              <span className="font-semibold text-foreground">{formatPrice(service.setupFee, language)}</span>
            </p>
          )}

          <a
            href="/#booking"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t({ ar: 'اطلب هذه الخدمة', fr: 'Commander ce service', en: 'Request this service' })}
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      )}
    </article>
  );
}

export function PremiumServicesPage() {
  const { language, t } = useLanguage();
  const activeLanguage = language as Language;

  const grouped = useMemo(() => {
    const active = premiumServices.filter((service) => service.isActive);
    return CATEGORY_ORDER.map((category) => ({
      category,
      services: active.filter((service) => service.category === category),
    })).filter((group) => group.services.length > 0);
  }, []);

  const total = useMemo(() => grouped.reduce((sum, group) => sum + group.services.length, 0), [grouped]);

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-background px-4 pb-14 pt-16">
        <div className="mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-normal text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {t({ ar: 'خدمات مميزة', fr: 'Services premium', en: 'Premium services' })}
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl md:text-5xl">
            {t({
              ar: 'خدماتنا المميزة لنمو أعمالك',
              fr: 'Nos services premium pour développer votre activité',
              en: 'Premium services that grow your business',
            })}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t({
              ar: 'حلول متكاملة للشركات وأصحاب المشاريع في الجزائر: استضافة، متاجر، أمن، أتمتة وذكاء اصطناعي — بأسعار واضحة ومتابعة كاملة.',
              fr: 'Des solutions complètes pour les entreprises et entrepreneurs en Algérie : hébergement, e-commerce, sécurité, automatisation et IA — avec des tarifs clairs et un suivi complet.',
              en: 'Complete solutions for businesses and entrepreneurs in Algeria: hosting, e-commerce, security, automation and AI — with clear pricing and full follow-up.',
            })}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#premium-list"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t({ ar: 'استعرض الخدمات', fr: 'Voir les services', en: 'Browse services' })}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/#booking"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              {t({ ar: 'احجز استشارة', fr: 'Réserver un appel', en: 'Book a consultation' })}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t({ ar: 'نتائج قابلة للقياس', fr: 'Résultats mesurables', en: 'Measurable results' })}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t({ ar: 'موثوقية وأمان', fr: 'Fiabilité et sécurité', en: 'Reliability & security' })}
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {`${total} ${t({ ar: 'خدمة متاحة', fr: 'services disponibles', en: 'available services' })}`}
            </span>
          </div>
        </div>
      </section>

      {/* Services */}
      <div id="premium-list" className="mx-auto mt-12 max-w-6xl space-y-14 px-4">
        {grouped.map((group) => {
          const meta = CATEGORY_META[group.category];
          const Icon = meta.icon;
          return (
            <section key={group.category}>
              <div className="mb-6 flex flex-wrap items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold sm:text-2xl">{t(meta.label)}</h2>
                  <p className="text-sm text-muted-foreground">{t(meta.blurb)}</p>
                </div>
                <span className="ms-auto rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {group.services.length} {t({ ar: 'خدمة', fr: 'services', en: 'services' })}
                </span>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                {group.services.map((service) => (
                  <ServiceCard key={service.id} service={service} language={activeLanguage} t={t} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* CTA */}
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {t({ ar: 'لديك مشروع وتحتاج خطة واضحة؟', fr: 'Un projet en tête ?', en: 'Have a project in mind?' })}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t({
              ar: 'أخبرنا بما تحتاجه وسنقترح عليك الحل الأنسب مع تقدير زمني وسعر واضح قبل البدء.',
              fr: 'Expliquez-nous votre besoin : nous proposerons la solution la plus adaptée avec un devis et un délai clairs avant de commencer.',
              en: 'Tell us what you need and we will propose the best fit with a clear quote and timeline before we start.',
            })}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/#booking"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t({ ar: 'اطلب عرض سعر', fr: 'Demander un devis', en: 'Request a quote' })}
            </a>
            <a
              href="/#digital-services"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              {t({ ar: 'الخدمات الرقمية', fr: 'Services digitaux', en: 'Digital services' })}
            </a>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            {t({
              ar: 'الأسعار المعروضة إرشادية وقابلة للتخصيص حسب حجم المشروع.',
              fr: 'Les tarifs affichés sont indicatifs et ajustables selon la taille du projet.',
              en: 'Listed prices are indicative and can be tailored to the project size.',
            })}
          </p>
        </div>
      </section>
    </div>
  );
}

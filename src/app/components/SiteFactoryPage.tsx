import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  Globe,
  Languages,
  LayoutTemplate,
  Loader2,
  MessageCircle,
  Palette,
  Phone,
  Rocket,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';
import { Footer } from './Footer';
import { TemplatePreview } from './site-factory/FactoryShared';
import { FactoryWizard } from './site-factory/FactoryWizard';
import { SuccessPanel, TrackingPanel } from './site-factory/FactoryPanels';
import {
  waLink,
  type Draft,
  type FactoryConfig,
  type FactoryResult,
} from './site-factory/factoryUtils';

export function SiteFactoryPage() {
  const { t } = useLanguage();
  const [config, setConfig] = useState<FactoryConfig | null>(null);
  const [configError, setConfigError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [view, setView] = useState<'order' | 'track'>('order');
  const [trackSeed, setTrackSeed] = useState({ ref: '', contact: '' });
  const [result, setResult] = useState<FactoryResult | null>(null);
  const [submittedDraft, setSubmittedDraft] = useState<Draft | null>(null);

  useEffect(() => {
    let active = true;
    setConfigError('');
    api.siteFactory
      .config()
      .then((response) => {
        if (!active) return;
        setConfig({
          templates: response.templates || [],
          packages: response.packages || [],
          settings: response.settings,
          cloudflareConfigured: Boolean(response.cloudflareConfigured),
        });
      })
      .catch((error: any) => {
        if (!active) return;
        setConfigError(
          error?.message ||
            t({
              ar: 'تعذر تحميل القوالب. تحقق من اتصالك وأعد المحاولة.',
              fr: 'Impossible de charger les modèles. Vérifiez votre connexion.',
              en: 'Could not load templates. Check your connection and retry.',
            }),
        );
      });
    return () => {
      active = false;
    };
  }, [reloadKey, t]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = (params.get('ref') || '').toUpperCase();
    const contact = params.get('contact') || '';
    if (ref) {
      setView('track');
      setTrackSeed({ ref, contact });
    }
  }, []);

  const heroAccent = useMemo(() => {
    const store = config?.templates.find((template) => template.slug === 'store');
    return store?.accent || '#0b5ed7';
  }, [config]);

  const whatsapp = config
    ? waLink(
        config.settings,
        t({
          ar: 'مرحباً، أريد معلومات عن خدمة إنشاء المواقع.',
          fr: 'Bonjour, je souhaite des informations sur la création de sites.',
          en: 'Hello, I would like information about website creation.',
        }),
      )
    : '';

  const scrollToMain = useCallback(() => {
    window.setTimeout(() => {
      const element = document.getElementById('factory-main');
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 30);
  }, []);

  function startOrder() {
    setView('order');
    setResult(null);
    setSubmittedDraft(null);
    scrollToMain();
  }

  function startTracking() {
    setView('track');
    scrollToMain();
  }

  const faqs = [
    {
      q: t({ ar: 'هل الموقع مجاني بالكامل؟', fr: 'Le site est-il entièrement gratuit ?', en: 'Is the website completely free?' }),
      a: t({
        ar: 'الاستضافة والنطاق الفرعي على pages.dev مجانيان تماماً وبدون بطاقة بنكية. تصميم الموقع وتجهيزه مدفوع حسب الباقة المختارة.',
        fr: 'L’hébergement et le sous-domaine pages.dev sont gratuits, sans carte bancaire. La conception du site est payante selon l’offre.',
        en: 'Hosting and the pages.dev subdomain are free with no card. Website design is paid according to the chosen package.',
      }),
    },
    {
      q: t({ ar: 'كيف أدفع؟', fr: 'Comment payer ?', en: 'How do I pay?' }),
      a: t({
        ar: 'ندعم CCP / بريد الجزائر، BaridiMob، الدفع نقداً، أو التنسيق عبر واتساب. تدفع دفعة أولى، وتُرسل صورة الوصل من صفحة الطلب.',
        fr: 'Nous acceptons CCP / Algérie Poste, BaridiMob, espèces ou coordination WhatsApp. Vous payez un premier versement et envoyez le reçu.',
        en: 'We accept CCP / Algérie Poste, BaridiMob, cash, or WhatsApp coordination. Pay a first installment and upload the receipt.',
      }),
    },
    {
      q: t({ ar: 'متى يُنشر موقعي؟', fr: 'Quand mon site sera-t-il publié ?', en: 'When will my site be published?' }),
      a: t({
        ar: 'بعد تأكيد الدفع نجهز الموقع وننشره خلال المدة المذكورة في الباقة (3 إلى 7 أيام عمل غالباً).',
        fr: 'Après confirmation du paiement, nous préparons et publions le site dans le délai de l’offre (3 à 7 jours ouvrés).',
        en: 'After payment confirmation, we prepare and publish the site within the package timeframe (usually 3–7 working days).',
      }),
    },
    {
      q: t({ ar: 'هل أستطيع ربط نطاق خاص؟', fr: 'Puis-je connecter mon propre domaine ?', en: 'Can I connect a custom domain?' }),
      a: t({
        ar: 'نعم. تشتري النطاق باسمك من أي مزود، والربط مجاني. النطاق يبقى ملكك حتى لو تغير المزود.',
        fr: 'Oui. Vous achetez le domaine à votre nom chez n’importe quel registrar ; la connexion est gratuite et le domaine reste à vous.',
        en: 'Yes. Buy the domain in your name from any registrar; connection is free and the domain stays yours.',
      }),
    },
    {
      q: t({ ar: 'هل يمكنني معاينة الموقع قبل الدفع؟', fr: 'Puis-je voir le site avant de payer ?', en: 'Can I preview before paying?' }),
      a: t({
        ar: 'نعم، بعد إرسال الطلب تُولَّد معاينة مجانية بعلامة مائية. بعد تأكيد الدفع نزيل العلامة وننشر الموقع.',
        fr: 'Oui, un aperçu gratuit filigrané est généré après la demande. Après paiement, nous retirons le filigrane et publions.',
        en: 'Yes, a free watermarked preview is generated after your request. After payment we remove the watermark and publish.',
      }),
    },
    {
      q: t({ ar: 'هل يمكنني تعديل المحتوى لاحقاً؟', fr: 'Puis-je modifier le contenu plus tard ?', en: 'Can I update the content later?' }),
      a: t({
        ar: 'نعم، حسب عدد التعديلات في باقتك. أرسل التعديلات عبر واتساب مع رقم الطلب، وسنحدّث الموقع.',
        fr: 'Oui, selon les révisions incluses. Envoyez les modifications sur WhatsApp avec votre référence.',
        en: 'Yes, according to your package revisions. Send changes on WhatsApp with your reference.',
      }),
    },
  ];

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/85 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                {t({
                  ar: 'مواقع احترافية جاهزة • بدون اشتراكات',
                  fr: 'Sites professionnels • sans abonnement',
                  en: 'Professional websites • no subscriptions',
                })}
              </span>
              <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                {t({
                  ar: 'موقعك الاحترافي جاهز في أيام، وليس شهوراً',
                  fr: 'Votre site professionnel prêt en quelques jours',
                  en: 'Your professional website ready in days, not months',
                })}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                {t({
                  ar: 'اختر قالباً، أدخل معلومات نشاطك، واحجز اسمك المجاني على pages.dev. نجهز الموقع، تعاينه مجاناً، ثم ننشره بعد تأكيد الدفع.',
                  fr: 'Choisissez un modèle, saisissez vos informations et réservez votre nom gratuit sur pages.dev. Nous préparons, vous validez l’aperçu, puis nous publions après paiement.',
                  en: 'Pick a template, add your business details and claim your free pages.dev name. We build it, you preview for free, then we publish after payment.',
                })}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={startOrder}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-slate-900 shadow-xl shadow-black/20 transition hover:bg-white/90"
                >
                  <Rocket className="h-4 w-4" />
                  {t({ ar: 'ابدأ طلبك الآن', fr: 'Commencer maintenant', en: 'Start your request' })}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={startTracking}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-bold text-white backdrop-blur transition hover:bg-white/10"
                >
                  <Search className="h-4 w-4" />
                  {t({ ar: 'تتبع طلبك', fr: 'Suivre ma demande', en: 'Track your request' })}
                </button>
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3.5 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/25"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
              </div>

              <div className="mt-7 grid grid-cols-2 gap-2.5 text-xs text-white/75 sm:grid-cols-4">
                {[
                  { icon: Eye, label: t({ ar: 'معاينة مجانية', fr: 'Aperçu gratuit', en: 'Free preview' }) },
                  { icon: Globe, label: t({ ar: 'نطاق مجاني', fr: 'Domaine gratuit', en: 'Free domain' }) },
                  { icon: ShieldCheck, label: t({ ar: 'دفع آمن', fr: 'Paiement sûr', en: 'Safe payment' }) },
                  { icon: Languages, label: t({ ar: '3 لغات', fr: '3 langues', en: '3 languages' }) },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2">
                    <item.icon className="h-3.5 w-3.5 shrink-0 text-sky-300" />
                    <span className="truncate">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="absolute -inset-6 rounded-[36px] bg-white/5 blur-2xl" />
              <div className="relative rounded-2xl border border-white/15 bg-white/10 p-2 shadow-2xl shadow-black/40 backdrop-blur">
                <div className="rounded-xl bg-white p-2">
                  <TemplatePreview slug="store" accent={heroAccent} large />
                </div>
              </div>
              <div className="absolute -right-3 -top-3 flex items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2 text-[11px] font-bold shadow-xl backdrop-blur">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                SEO + WhatsApp
              </div>
              <div className="absolute -bottom-3 -left-3 flex items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2 text-[11px] font-bold shadow-xl backdrop-blur">
                <Smartphone className="h-3.5 w-3.5 text-sky-400" />
                {t({ ar: 'متجاوب مع الهاتف', fr: 'Mobile responsive', en: 'Mobile responsive' })}
              </div>
              <div className="absolute -bottom-5 right-6 flex items-center gap-1.5 rounded-xl border border-white/20 bg-slate-900/90 px-3 py-2 text-[11px] font-bold shadow-xl backdrop-blur">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                {t({ ar: 'تسليم 3–7 أيام', fr: 'Livraison 3–7 jours', en: 'Delivery 3–7 days' })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main wizard / tracking */}
      <main id="factory-main" className="scroll-mt-20 bg-muted/20 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {configError && (
            <div className="mb-5 flex flex-col items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{configError}</span>
              </div>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="rounded-xl border border-rose-500/30 bg-background px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-500/10"
              >
                {t({ ar: 'إعادة المحاولة', fr: 'Réessayer', en: 'Retry' })}
              </button>
            </div>
          )}

          {!config && !configError && (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card px-6 py-20 text-center shadow-sm">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Loader2 className="h-6 w-6 animate-spin" />
              </span>
              <p className="mt-4 text-sm font-bold">
                {t({ ar: 'جاري تحميل القوالب والباقات...', fr: 'Chargement des modèles et offres...', en: 'Loading templates and packages...' })}
              </p>
              <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                {t({
                  ar: 'قد يستغرق التحميل حتى دقيقة عند أول زيارة. شكراً لصبرك.',
                  fr: 'Le premier chargement peut prendre jusqu’à une minute. Merci de patienter.',
                  en: 'The first load can take up to a minute. Thanks for waiting.',
                })}
              </p>
            </div>
          )}

          {config && view === 'track' && (
            <TrackingPanel
              initialRef={trackSeed.ref}
              initialContact={trackSeed.contact}
              config={config}
              onBack={startOrder}
            />
          )}

          {config && view === 'order' && result && submittedDraft && (
            <SuccessPanel
              result={result}
              draft={submittedDraft}
              config={config}
              onTrack={() => {
                setTrackSeed({ ref: result.ref, contact: submittedDraft.phone });
                setView('track');
                scrollToMain();
              }}
              onNew={startOrder}
            />
          )}

          {config && view === 'order' && !result && (
            <FactoryWizard
              config={config}
              onSuccess={(factoryResult, draft) => {
                setResult(factoryResult);
                setSubmittedDraft(draft);
                scrollToMain();
              }}
              onTrack={(ref, contact) => {
                setTrackSeed({ ref, contact });
                setView('track');
                scrollToMain();
              }}
            />
          )}
        </div>
      </main>

      {/* How it works */}
      <section className="bg-background py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-bold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t({ ar: 'كيف يعمل؟', fr: 'Comment ça marche ?', en: 'How it works' })}
            </span>
            <h2 className="mt-3 text-2xl font-black sm:text-3xl">
              {t({ ar: 'من الفكرة إلى موقع منشور في 4 خطوات', fr: 'De l’idée au site en ligne en 4 étapes', en: 'From idea to live site in 4 steps' })}
            </h2>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: LayoutTemplate,
                title: t({ ar: 'اختر القالب', fr: 'Choisissez le modèle', en: 'Pick a template' }),
                text: t({ ar: 'متجر، شركة، معرض أعمال، بطاقة، مطعم أو صفحة هبوط.', fr: 'Boutique, entreprise, portfolio, carte, restaurant ou page de vente.', en: 'Store, company, portfolio, card, restaurant or landing page.' }),
              },
              {
                icon: Palette,
                title: t({ ar: 'أدخل معلوماتك', fr: 'Ajoutez vos infos', en: 'Add your details' }),
                text: t({ ar: 'الاسم، الهاتف، الخدمات، المنتجات، الشعار والألوان.', fr: 'Nom, téléphone, services, produits, logo et couleurs.', en: 'Name, phone, services, products, logo and colors.' }),
              },
              {
                icon: Globe,
                title: t({ ar: 'احجز النطاق', fr: 'Réservez le domaine', en: 'Claim the domain' }),
                text: t({ ar: 'اسم مجاني على pages.dev مع فحص فوري للتوفر.', fr: 'Nom gratuit sur pages.dev avec vérification instantanée.', en: 'Free pages.dev name with instant availability check.' }),
              },
              {
                icon: Rocket,
                title: t({ ar: 'عاين، ادفع، انشر', fr: 'Aperçu, paiement, publication', en: 'Preview, pay, publish' }),
                text: t({ ar: 'معاينة مجانية، ثم ننشر موقعك بعد تأكيد الدفع.', fr: 'Aperçu gratuit, puis publication après confirmation du paiement.', en: 'Free preview, then we publish after payment confirmation.' }),
              },
            ].map((item, index) => (
              <div key={item.title} className="relative rounded-2xl border border-border bg-card p-5 shadow-sm">
                <span className="absolute end-4 top-4 text-3xl font-black text-muted-foreground/10">{index + 1}</span>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 text-sm font-black">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-black sm:text-3xl">
              {t({ ar: 'أسئلة شائعة', fr: 'Questions fréquentes', en: 'Frequently asked questions' })}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t({ ar: 'كل ما تحتاج معرفته قبل طلب موقعك.', fr: 'Tout ce qu’il faut savoir avant de commander.', en: 'Everything you need to know before ordering.' })}
            </p>
          </div>
          <div className="mt-6 space-y-2.5">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-700 to-indigo-800 p-7 text-center text-white shadow-xl sm:p-10">
            <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-12 -left-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <Store className="mx-auto h-8 w-8 text-white/80" />
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">
                {t({ ar: 'جاهز تطلق موقعك؟', fr: 'Prêt à lancer votre site ?', en: 'Ready to launch your site?' })}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-white/80">
                {t({
                  ar: 'ابدأ الآن مجاناً، عاين موقعك قبل الدفع، ثم اختر الطريقة المناسبة لك. بدون اشتراك شهري وبدون تكاليف خفية.',
                  fr: 'Commencez gratuitement, prévisualisez avant de payer, puis choisissez votre méthode. Sans abonnement ni frais cachés.',
                  en: 'Start free, preview before paying, then choose your method. No subscription and no hidden fees.',
                })}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <button
                  type="button"
                  onClick={startOrder}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-900 transition hover:bg-white/90"
                >
                  <Rocket className="h-4 w-4" />
                  {t({ ar: 'ابدأ طلبك', fr: 'Commencer', en: 'Start now' })}
                </button>
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t({ ar: 'اسأل قبل الطلب', fr: 'Poser une question', en: 'Ask a question' })}
                  </a>
                )}
                <a
                  href={`tel:${config?.settings.ownerPhone || ''}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                  dir="ltr"
                >
                  <Phone className="h-4 w-4" />
                  {config?.settings.ownerPhone || ''}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

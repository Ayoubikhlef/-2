import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Globe,
  Languages,
  LayoutTemplate,
  Loader2,
  Lock,
  MessageCircle,
  Palette,
  Plus,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../utils/api';
import { Field, ImageField, PackageFeatures, PaymentDetails, TemplateCard } from './FactoryShared';
import {
  CATEGORY_OPTIONS,
  COLOR_PRESETS,
  IMAGE_LIMITS,
  MAX_PRODUCTS,
  MAX_SERVICES,
  PAYMENT_OPTIONS,
  categoryLabel,
  digitsOnly,
  emptyDraft,
  fieldClass,
  isEmail,
  money,
  normalizeSubdomain,
  packageDescription,
  packageFeatures,
  packageName,
  templateName,
  usesProducts,
  usesServices,
  type Draft,
  type FactoryConfig,
  type FactoryResult,
  type FactoryTemplate,
  type Lang,
} from './factoryUtils';

type SubdomainState = {
  status: 'idle' | 'checking' | 'available' | 'taken' | 'error';
  message?: string;
  suggestions?: string[];
  normalized?: string;
};

const PAYMENT_ICONS = {
  ccp: CreditCard,
  baridimob: Smartphone,
  cash: Wallet,
  whatsapp: MessageCircle,
} as const;

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: typeof Palette;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-black">{title}</h3>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function FactoryWizard({
  config,
  onSuccess,
  onTrack,
}: {
  config: FactoryConfig;
  onSuccess: (result: FactoryResult, draft: Draft) => void;
  onTrack: (ref: string, contact: string) => void;
}) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(language));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [subdomainState, setSubdomainState] = useState<SubdomainState>({ status: 'idle' });
  const [checkingSubdomain, setCheckingSubdomain] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const checkSeq = useRef(0);

  const selectedTemplate = useMemo(
    () => config.templates.find((item) => item.slug === draft.templateSlug),
    [config.templates, draft.templateSlug],
  );
  const selectedPackage = useMemo(
    () => config.packages.find((item) => item.slug === draft.packageSlug),
    [config.packages, draft.packageSlug],
  );
  const settings = config.settings;
  const price = Number(selectedPackage?.price) || 0;
  const deposit = Math.round((price * (Number(settings.depositPercent) || 0)) / 100);
  const isServiceTemplate = usesServices(draft.templateSlug);
  const isProductTemplate = usesProducts(draft.templateSlug);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!previous[String(key)]) return previous;
      const next = { ...previous };
      delete next[String(key)];
      return next;
    });
    setFormError('');
  }

  function goToStep(nextStep: number) {
    setStep(nextStep);
    setFormError('');
    window.setTimeout(() => {
      const element = document.getElementById('factory-wizard');
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  }

  function selectTemplate(template: FactoryTemplate) {
    setDraft((previous) => ({
      ...previous,
      templateSlug: template.slug,
      primaryColor: previous.templateSlug === template.slug ? previous.primaryColor : template.accent,
    }));
    setErrors((previous) => {
      const next = { ...previous };
      delete next.templateSlug;
      return next;
    });
    setFormError('');
  }

  /* Live subdomain availability check (debounced). */
  useEffect(() => {
    if (step !== 3) return;
    const clean = normalizeSubdomain(draft.subdomain);
    if (clean.length < 3) {
      setSubdomainState({ status: 'idle' });
      return;
    }
    setSubdomainState({ status: 'checking' });
    const sequence = ++checkSeq.current;
    const timer = window.setTimeout(() => {
      api.siteFactory
        .checkSubdomain(clean)
        .then((response) => {
          if (checkSeq.current !== sequence) return;
          setSubdomainState({
            status: response.available ? 'available' : response.reason === 'error' ? 'error' : 'taken',
            message: response.message,
            suggestions: response.suggestions || [],
            normalized: response.normalized || clean,
          });
        })
        .catch(() => {
          if (checkSeq.current !== sequence) return;
          setSubdomainState({
            status: 'error',
            message: t({
              ar: 'تعذر التحقق الآن. يمكنك المتابعة وسنتأكد من الاسم عند النشر.',
              fr: 'Vérification impossible. Vous pouvez continuer, nous confirmerons à la publication.',
              en: 'Could not verify now. You can continue; we will confirm at publishing.',
            }),
            suggestions: [],
            normalized: clean,
          });
        });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [draft.subdomain, step, t]);

  function validateStep2(): boolean {
    const next: Record<string, string> = {};
    const siteName = draft.siteName.trim();
    if (siteName.length < 2) {
      next.siteName = t({ ar: 'اسم الموقع مطلوب (حرفان على الأقل).', fr: 'Le nom du site est requis.', en: 'Site name is required.' });
    } else if (siteName.length > 80) {
      next.siteName = t({ ar: 'اسم الموقع طويل جداً (80 حرفاً كحد أقصى).', fr: 'Nom trop long (80 caractères max).', en: 'Name too long (80 characters max).' });
    }
    const phone = digitsOnly(draft.phone);
    if (!draft.phone.trim()) {
      next.phone = t({ ar: 'رقم الهاتف مطلوب.', fr: 'Le téléphone est requis.', en: 'Phone is required.' });
    } else if (phone.length < 8 || phone.length > 15) {
      next.phone = t({ ar: 'رقم الهاتف غير صحيح. مثال: 0674113290', fr: 'Numéro invalide. Ex : 0674113290', en: 'Invalid phone. Example: 0674113290' });
    }
    if (draft.whatsapp.trim() && (digitsOnly(draft.whatsapp).length < 8 || digitsOnly(draft.whatsapp).length > 15)) {
      next.whatsapp = t({ ar: 'رقم واتساب غير صحيح.', fr: 'Numéro WhatsApp invalide.', en: 'Invalid WhatsApp number.' });
    }
    if (draft.email.trim() && !isEmail(draft.email.trim())) {
      next.email = t({ ar: 'البريد الإلكتروني غير صحيح.', fr: 'E-mail invalide.', en: 'Invalid email.' });
    }
    if (draft.tagline.length > 120) {
      next.tagline = t({ ar: 'العبارة التعريفية طويلة جداً.', fr: 'Slogan trop long.', en: 'Tagline is too long.' });
    }
    if (draft.description.length > 900) {
      next.description = t({ ar: 'الوصف طويل جداً (900 حرف كحد أقصى).', fr: 'Description trop longue (900 max).', en: 'Description too long (900 max).' });
    }

    if (isServiceTemplate) {
      const rows = draft.services.filter((row) => row.title.trim() || row.description.trim());
      if (rows.some((row) => !row.title.trim())) {
        next.services = t({ ar: 'أدخل عنواناً لكل خدمة أو احذف السطر الفارغ.', fr: 'Ajoutez un titre à chaque service ou supprimez la ligne.', en: 'Add a title for each service or remove the empty row.' });
      }
      if (rows.length > MAX_SERVICES) {
        next.services = t({ ar: `الحد الأقصى ${MAX_SERVICES} خدمات.`, fr: `Maximum ${MAX_SERVICES} services.`, en: `Maximum ${MAX_SERVICES} services.` });
      }
    }

    if (isProductTemplate) {
      const rows = draft.products.filter(
        (row) => row.name.trim() || row.price.trim() || row.description.trim() || row.category.trim() || row.imageUrl,
      );
      if (rows.some((row) => !row.name.trim())) {
        next.products = t({ ar: 'اسم المنتج مطلوب لكل سطر.', fr: 'Le nom du produit est requis.', en: 'Product name is required.' });
      } else if (rows.some((row) => row.price.trim() === '' || !Number.isFinite(Number(row.price)) || Number(row.price) < 0)) {
        next.products = t({ ar: 'أدخل سعراً صحيحاً لكل منتج.', fr: 'Entrez un prix valide pour chaque produit.', en: 'Enter a valid price for each product.' });
      }
      if (rows.length > MAX_PRODUCTS) {
        next.products = t({ ar: `الحد الأقصى ${MAX_PRODUCTS} منتجاً.`, fr: `Maximum ${MAX_PRODUCTS} produits.`, en: `Maximum ${MAX_PRODUCTS} products.` });
      }
    }

    setErrors(next);
    if (Object.keys(next).length) {
      setFormError(
        t({
          ar: 'راجع الحقول المطلوبة أعلاه ثم أعد المحاولة.',
          fr: 'Vérifiez les champs obligatoires ci-dessus.',
          en: 'Check the required fields above and try again.',
        }),
      );
      return false;
    }
    return true;
  }

  async function ensureSubdomain(): Promise<boolean> {
    const clean = normalizeSubdomain(draft.subdomain);
    if (clean.length < 3) {
      setErrors({
        subdomain: t({
          ar: 'اختر اسماً من 3 أحرف على الأقل (أحرف إنجليزية وأرقام وشرطات).',
          fr: 'Choisissez un nom d’au moins 3 caractères (lettres, chiffres, tirets).',
          en: 'Choose a name of at least 3 characters (letters, numbers, hyphens).',
        }),
      });
      setFormError(
        t({
          ar: 'الاسم الفرعي مطلوب قبل المتابعة.',
          fr: 'Le sous-domaine est requis.',
          en: 'The subdomain is required.',
        }),
      );
      return false;
    }
    setCheckingSubdomain(true);
    try {
      const response = await api.siteFactory.checkSubdomain(clean);
      setSubdomainState({
        status: response.available ? 'available' : response.reason === 'error' ? 'error' : 'taken',
        message: response.message,
        suggestions: response.suggestions || [],
        normalized: response.normalized || clean,
      });
      if (!response.available && response.reason !== 'error') {
        setErrors({ subdomain: response.message || t({ ar: 'هذا الاسم غير متاح.', fr: 'Ce nom n’est pas disponible.', en: 'This name is unavailable.' }) });
        return false;
      }
      update('subdomain', response.normalized || clean);
      return true;
    } catch {
      setSubdomainState({
        status: 'error',
        message: t({
          ar: 'تعذر التحقق الآن. يمكنك المتابعة وسنتأكد من الاسم عند النشر.',
          fr: 'Vérification impossible. Vous pouvez continuer.',
          en: 'Could not verify now. You can continue.',
        }),
        suggestions: [],
        normalized: clean,
      });
      return true;
    } finally {
      setCheckingSubdomain(false);
    }
  }

  async function next() {
    setFormError('');
    if (step === 1) {
      if (!draft.templateSlug) {
        setErrors({ templateSlug: t({ ar: 'اختر قالباً أولاً.', fr: 'Choisissez d’abord un modèle.', en: 'Choose a template first.' }) });
        setFormError(t({ ar: 'اختر قالباً أولاً.', fr: 'Choisissez d’abord un modèle.', en: 'Choose a template first.' }));
        return;
      }
      goToStep(2);
      return;
    }
    if (step === 2) {
      if (!validateStep2()) return;
      goToStep(3);
      return;
    }
    if (step === 3) {
      if (await ensureSubdomain()) goToStep(4);
    }
  }

  function buildPayload() {
    const services = isServiceTemplate
      ? draft.services
          .filter((row) => row.title.trim())
          .slice(0, MAX_SERVICES)
          .map((row) => ({ title: row.title.trim(), description: row.description.trim() }))
      : [];
    const products = isProductTemplate
      ? draft.products
          .filter((row) => row.name.trim())
          .slice(0, MAX_PRODUCTS)
          .map((row) => ({
            name: row.name.trim(),
            description: row.description.trim() || null,
            price: Math.max(0, Number(row.price) || 0),
            category: row.category.trim() || null,
            imageUrl: row.imageUrl || null,
          }))
      : [];

    return {
      templateSlug: draft.templateSlug,
      packageSlug: draft.packageSlug,
      siteName: draft.siteName.trim(),
      category: categoryLabel(draft.categoryKey, draft.language),
      tagline: draft.tagline.trim() || null,
      description: draft.description.trim() || null,
      phone: draft.phone.trim(),
      email: draft.email.trim() || null,
      whatsapp: draft.whatsapp.trim() || draft.phone.trim(),
      address: draft.address.trim() || null,
      city: draft.city.trim() || null,
      language: draft.language,
      primaryColor: draft.primaryColor,
      secondaryColor: draft.secondaryColor,
      logoUrl: draft.logoUrl || null,
      coverUrl: draft.coverUrl || null,
      socials: {
        facebook: draft.facebook.trim(),
        instagram: draft.instagram.trim(),
        tiktok: draft.tiktok.trim(),
      },
      hours: draft.hours.trim() || null,
      services,
      products,
      subdomain: normalizeSubdomain(draft.subdomain),
      customDomain: draft.customDomain.trim().toLowerCase() || null,
      paymentMethod: draft.paymentMethod || undefined,
      website: honeypot,
    };
  }

  async function submit() {
    setFormError('');
    const stepFourErrors: Record<string, string> = {};
    if (!draft.packageSlug) {
      stepFourErrors.package = t({ ar: 'اختر باقة.', fr: 'Choisissez une offre.', en: 'Choose a package.' });
    }
    if (!draft.paymentMethod) {
      stepFourErrors.payment = t({ ar: 'اختر طريقة الدفع.', fr: 'Choisissez un moyen de paiement.', en: 'Choose a payment method.' });
    }
    if (!accepted) {
      stepFourErrors.terms = t({
        ar: 'يجب الموافقة على الشروط قبل إرسال الطلب.',
        fr: 'Vous devez accepter les conditions.',
        en: 'You must accept the terms before submitting.',
      });
    }
    if (Object.keys(stepFourErrors).length) {
      setErrors(stepFourErrors);
      setFormError(
        t({
          ar: 'أكمل اختيارات الباقة والدفع أولاً.',
          fr: 'Complétez l’offre et le paiement.',
          en: 'Complete the package and payment choices.',
        }),
      );
      return;
    }
    if (!validateStep2()) {
      goToStep(2);
      return;
    }
    if (!(await ensureSubdomain())) {
      goToStep(3);
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.siteFactory.createRequest(buildPayload());
      onSuccess(result, draft);
    } catch (err: any) {
      if (err?.status === 409) {
        goToStep(3);
        setSubdomainState({
          status: 'taken',
          message: err?.message,
          suggestions: [],
          normalized: normalizeSubdomain(draft.subdomain),
        });
        setErrors({ subdomain: err?.message || 'الاسم غير متاح.' });
      }
      setFormError(
        err?.message ||
          t({
            ar: 'تعذر إرسال الطلب. تحقق من اتصالك وحاول مرة أخرى.',
            fr: 'Impossible d’envoyer la demande. Vérifiez votre connexion.',
            en: 'Could not submit the request. Check your connection and retry.',
          }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const steps = [
    { number: 1, label: t({ ar: 'القالب', fr: 'Modèle', en: 'Template' }), icon: LayoutTemplate },
    { number: 2, label: t({ ar: 'المعلومات', fr: 'Infos', en: 'Details' }), icon: Palette },
    { number: 3, label: t({ ar: 'النطاق', fr: 'Domaine', en: 'Domain' }), icon: Globe },
    { number: 4, label: t({ ar: 'الباقة', fr: 'Offre', en: 'Package' }), icon: ShieldCheck },
  ];

  const selectedName = templateName(selectedTemplate, language);
  const packageLabel = packageName(selectedPackage, language);
  const activeServices = draft.services.filter((row) => row.title.trim() || row.description.trim());
  const activeProducts = draft.products.filter(
    (row) => row.name.trim() || row.price.trim() || row.description.trim() || row.category.trim() || row.imageUrl,
  );

  return (
    <div id="factory-wizard" className="scroll-mt-24">
      <input
        tabIndex={-1}
        autoComplete="off"
        name="website"
        aria-hidden="true"
        value={honeypot}
        onChange={(event) => setHoneypot(event.target.value)}
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />

      <div className={step > 1 ? 'grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]' : ''}>
        <div>
          {/* Stepper */}
          <div className="mb-5 rounded-2xl border border-border bg-card px-3 py-4 shadow-sm sm:px-6">
            <div className="relative flex items-start justify-between gap-1">
              <div className="absolute inset-x-0 top-4 h-0.5 rounded-full bg-border" />
              <div
                className="absolute top-4 h-0.5 rounded-full bg-primary transition-all duration-500"
                style={{ insetInlineStart: 0, width: `${((step - 1) / 3) * 100}%` }}
              />
              {steps.map((item) => {
                const Icon = item.icon;
                const done = item.number < step;
                const active = item.number === step;
                return (
                  <button
                    type="button"
                    key={item.number}
                    onClick={() => done && goToStep(item.number)}
                    disabled={!done}
                    className={`relative z-10 flex flex-1 flex-col items-center gap-1.5 ${done ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 bg-card transition-all ${
                        active
                          ? 'border-primary bg-primary text-white shadow-md shadow-primary/25'
                          : done
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                    </span>
                    <span
                      className={`text-[10px] font-bold sm:text-xs ${
                        active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
            {formError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-500/10 px-3.5 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="leading-relaxed">{formError}</span>
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-black sm:text-2xl">
                    {t({ ar: 'اختر قالب موقعك', fr: 'Choisissez votre modèle', en: 'Choose your template' })}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t({
                      ar: 'ستة قوالب احترافية، كلها متجاوبة مع الهاتف وتدعم العربية والفرنسية والإنجليزية.',
                      fr: 'Six modèles professionnels, responsives et disponibles en AR / FR / EN.',
                      en: 'Six professional templates, mobile-ready and available in AR / FR / EN.',
                    })}
                  </p>
                </div>
                {config.templates.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    {t({ ar: 'لا توجد قوالب متاحة حالياً. حاول لاحقاً.', fr: 'Aucun modèle disponible.', en: 'No templates available.' })}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {config.templates.map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        active={draft.templateSlug === template.slug}
                        onSelect={() => selectTemplate(template)}
                      />
                    ))}
                  </div>
                )}
                {errors.templateSlug && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.templateSlug}
                  </p>
                )}
                <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-primary/5 p-4 text-xs leading-relaxed text-foreground/80">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    {t({
                      ar: 'كل القوالب تشمل معاينة مجانية، نطاقاً فرعياً مجانياً، تحسين SEO أساسي، أزرار واتساب وخريطة، وتوليداً تلقائياً للمحتوى.',
                      fr: 'Tous les modèles incluent un aperçu gratuit, un sous-domaine gratuit, le SEO de base, WhatsApp et la carte.',
                      en: 'All templates include a free preview, free subdomain, basic SEO, WhatsApp and map buttons.',
                    })}
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="mb-1">
                  <h2 className="text-xl font-black sm:text-2xl">
                    {t({ ar: 'أدخل معلومات موقعك', fr: 'Les informations de votre site', en: 'Your website details' })}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t({
                      ar: 'كلما كانت المعلومات أدق، كان موقعك جاهزاً أسرع. يمكنك تعديلها لاحقاً قبل النشر.',
                      fr: 'Plus les informations sont précises, plus le site est prêt vite. Modifiables avant publication.',
                      en: 'The more accurate the details, the faster your site is ready. Editable before publishing.',
                    })}
                  </p>
                </div>

                <Section
                  icon={LayoutTemplate}
                  title={t({ ar: 'معلومات النشاط', fr: 'Votre activité', en: 'Your business' })}
                  description={t({
                    ar: 'الاسم والعبارة التي ستظهر في أعلى الموقع.',
                    fr: 'Le nom et la phrase affichés en haut du site.',
                    en: 'The name and tagline shown at the top of the site.',
                  })}
                >
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field
                      label={t({ ar: 'اسم الموقع / النشاط', fr: 'Nom du site / activité', en: 'Site / business name' })}
                      required
                      error={errors.siteName}
                      className="sm:col-span-2"
                    >
                      <input
                        value={draft.siteName}
                        onChange={(event) => update('siteName', event.target.value)}
                        maxLength={80}
                        placeholder={t({ ar: 'مثال: بوتيك النور', fr: 'Ex : Boutique El Nour', en: 'E.g. El Nour Boutique' })}
                        className={fieldClass(errors.siteName)}
                      />
                    </Field>
                    <Field label={t({ ar: 'نوع النشاط', fr: 'Secteur d’activité', en: 'Business category' })}>
                      <select
                        value={draft.categoryKey}
                        onChange={(event) => update('categoryKey', event.target.value)}
                        className={fieldClass()}
                      >
                        {CATEGORY_OPTIONS.map((option) => (
                          <option key={option.key} value={option.key}>
                            {t(option.label)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field
                      label={t({ ar: 'العبارة التعريفية', fr: 'Slogan', en: 'Tagline' })}
                      hint={t({ ar: 'سطر قصير يوضح ما تقدمه.', fr: 'Une courte phrase qui décrit votre offre.', en: 'A short line about what you offer.' })}
                      error={errors.tagline}
                    >
                      <input
                        value={draft.tagline}
                        onChange={(event) => update('tagline', event.target.value)}
                        maxLength={120}
                        placeholder={t({ ar: 'أفضل المنتجات بأفضل الأسعار', fr: 'Les meilleurs produits au meilleur prix', en: 'The best products at the best price' })}
                        className={fieldClass(errors.tagline)}
                      />
                    </Field>
                    <Field
                      label={t({ ar: 'وصف مختصر', fr: 'Description courte', en: 'Short description' })}
                      hint={`${draft.description.length}/900`}
                      error={errors.description}
                      className="sm:col-span-2"
                    >
                      <textarea
                        value={draft.description}
                        onChange={(event) => update('description', event.target.value)}
                        maxLength={900}
                        rows={3}
                        placeholder={t({
                          ar: 'تحدث عن نشاطك، ما يميزك، ولماذا يختارك العملاء.',
                          fr: 'Parlez de votre activité, de vos atouts et de vos clients.',
                          en: 'Describe your business, what makes you different and why clients choose you.',
                        })}
                        className={fieldClass(errors.description, 'resize-none')}
                      />
                    </Field>
                  </div>
                </Section>

                <Section
                  icon={MessageCircle}
                  title={t({ ar: 'التواصل والموقع', fr: 'Contact & localisation', en: 'Contact & location' })}
                  description={t({
                    ar: 'تظهر هذه المعلومات في صفحات التواصل وأزرار الاتصال.',
                    fr: 'Ces informations apparaissent dans les pages contact et les boutons d’appel.',
                    en: 'These details appear on contact sections and call buttons.',
                  })}
                >
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label={t({ ar: 'رقم الهاتف', fr: 'Téléphone', en: 'Phone' })} required error={errors.phone}>
                      <input
                        value={draft.phone}
                        onChange={(event) => update('phone', event.target.value)}
                        placeholder="0674113290"
                        inputMode="tel"
                        dir="ltr"
                        className={fieldClass(errors.phone)}
                      />
                    </Field>
                    <Field
                      label={t({ ar: 'رقم واتساب', fr: 'WhatsApp', en: 'WhatsApp' })}
                      hint={t({ ar: 'اتركه فارغاً لاستعمال رقم الهاتف.', fr: 'Laissez vide pour utiliser le téléphone.', en: 'Leave empty to use the phone number.' })}
                      error={errors.whatsapp}
                    >
                      <input
                        value={draft.whatsapp}
                        onChange={(event) => update('whatsapp', event.target.value)}
                        placeholder="213674113290"
                        inputMode="tel"
                        dir="ltr"
                        className={fieldClass(errors.whatsapp)}
                      />
                    </Field>
                    <Field label={t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })} error={errors.email}>
                      <input
                        value={draft.email}
                        onChange={(event) => update('email', event.target.value)}
                        type="email"
                        placeholder="contact@example.dz"
                        dir="ltr"
                        className={fieldClass(errors.email)}
                      />
                    </Field>
                    <Field label={t({ ar: 'المدينة', fr: 'Ville', en: 'City' })}>
                      <input
                        value={draft.city}
                        onChange={(event) => update('city', event.target.value)}
                        placeholder={t({ ar: 'جيجل', fr: 'Jijel', en: 'Jijel' })}
                        className={fieldClass()}
                      />
                    </Field>
                    <Field label={t({ ar: 'العنوان', fr: 'Adresse', en: 'Address' })} className="sm:col-span-2">
                      <input
                        value={draft.address}
                        onChange={(event) => update('address', event.target.value)}
                        placeholder={t({ ar: '12 شارع ديدوش مراد', fr: '12 rue Didouche Mourad', en: '12 Didouche Mourad Street' })}
                        className={fieldClass()}
                      />
                    </Field>
                    <Field
                      label={t({ ar: 'أوقات العمل', fr: 'Horaires', en: 'Opening hours' })}
                      hint={t({ ar: 'مثال: 09:00 - 18:00، الجمعة مغلق.', fr: 'Ex : 09:00 - 18:00, fermé vendredi.', en: 'E.g. 09:00 - 18:00, closed Friday.' })}
                      className="sm:col-span-2"
                    >
                      <input
                        value={draft.hours}
                        onChange={(event) => update('hours', event.target.value)}
                        placeholder="09:00 - 18:00"
                        className={fieldClass()}
                      />
                    </Field>
                    <Field label="Facebook">
                      <input
                        value={draft.facebook}
                        onChange={(event) => update('facebook', event.target.value)}
                        placeholder="https://facebook.com/..."
                        dir="ltr"
                        className={fieldClass()}
                      />
                    </Field>
                    <Field label="Instagram">
                      <input
                        value={draft.instagram}
                        onChange={(event) => update('instagram', event.target.value)}
                        placeholder="https://instagram.com/..."
                        dir="ltr"
                        className={fieldClass()}
                      />
                    </Field>
                    <Field label="TikTok" className="sm:col-span-2">
                      <input
                        value={draft.tiktok}
                        onChange={(event) => update('tiktok', event.target.value)}
                        placeholder="https://tiktok.com/@..."
                        dir="ltr"
                        className={fieldClass()}
                      />
                    </Field>
                  </div>
                </Section>

                <Section
                  icon={Palette}
                  title={t({ ar: 'الهوية البصرية', fr: 'Identité visuelle', en: 'Visual identity' })}
                  description={t({
                    ar: 'اختر لغة الموقع والألوان. الشعار والغلاف اختياريان ويمكن إضافتهما لاحقاً.',
                    fr: 'Choisissez la langue et les couleurs. Logo et couverture sont optionnels.',
                    en: 'Choose the site language and colors. Logo and cover are optional.',
                  })}
                >
                  <div className="grid gap-3.5 sm:grid-cols-2">
                    <Field label={t({ ar: 'لغة الموقع', fr: 'Langue du site', en: 'Site language' })}>
                      <select
                        value={draft.language}
                        onChange={(event) => update('language', event.target.value as Lang)}
                        className={fieldClass()}
                      >
                        <option value="ar">العربية</option>
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </Field>
                    <Field
                      label={t({ ar: 'اللون الأساسي', fr: 'Couleur principale', en: 'Primary color' })}
                      hint={t({ ar: 'يُستعمل في الأزرار والعناوين.', fr: 'Utilisée pour les boutons et titres.', en: 'Used for buttons and headings.' })}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.primaryColor}
                          onChange={(event) => update('primaryColor', event.target.value)}
                          aria-label="primary color"
                          className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
                        />
                        <span className="font-mono text-xs font-semibold" dir="ltr">
                          {draft.primaryColor.toUpperCase()}
                        </span>
                      </div>
                    </Field>
                    <div className="sm:col-span-2">
                      <div className="flex flex-wrap gap-2">
                        {COLOR_PRESETS.map((color) => (
                          <button
                            type="button"
                            key={color}
                            onClick={() => update('primaryColor', color)}
                            aria-label={color}
                            className={`h-8 w-8 rounded-full transition hover:scale-110 ${
                              draft.primaryColor.toLowerCase() === color ? 'ring-2 ring-primary ring-offset-2 ring-offset-card' : ''
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <Field label={t({ ar: 'اللون الثانوي', fr: 'Couleur secondaire', en: 'Secondary color' })}>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={draft.secondaryColor}
                          onChange={(event) => update('secondaryColor', event.target.value)}
                          aria-label="secondary color"
                          className="h-10 w-14 cursor-pointer rounded-lg border border-border bg-background p-1"
                        />
                        <span className="font-mono text-xs font-semibold" dir="ltr">
                          {draft.secondaryColor.toUpperCase()}
                        </span>
                      </div>
                    </Field>
                    <div className="sm:col-span-2">
                      <ImageField
                        label={t({ ar: 'شعار النشاط', fr: 'Logo de l’activité', en: 'Business logo' })}
                        hint={t({ ar: 'PNG أو JPG، يُضغط تلقائياً. حتى 120KB.', fr: 'PNG ou JPG, compressé automatiquement. Max 120 Ko.', en: 'PNG or JPG, auto-compressed. Max 120 KB.' })}
                        value={draft.logoUrl}
                        onChange={(value) => update('logoUrl', value)}
                        maxBytes={IMAGE_LIMITS.logo}
                        maxDimension={512}
                        alpha
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <ImageField
                        label={t({ ar: 'صورة الغلاف', fr: 'Image de couverture', en: 'Cover image' })}
                        hint={t({ ar: 'تظهر في أعلى الموقع. حتى 300KB.', fr: 'Affichée en haut du site. Max 300 Ko.', en: 'Shown at the top of the site. Max 300 KB.' })}
                        value={draft.coverUrl}
                        onChange={(value) => update('coverUrl', value)}
                        maxBytes={IMAGE_LIMITS.cover}
                        maxDimension={1600}
                      />
                    </div>
                  </div>
                </Section>

                {isServiceTemplate && (
                  <Section
                    icon={Sparkles}
                    title={
                      draft.templateSlug === 'portfolio'
                        ? t({ ar: 'المشاريع والأعمال', fr: 'Projets & réalisations', en: 'Projects & work' })
                        : draft.templateSlug === 'landing'
                          ? t({ ar: 'مزايا العرض', fr: 'Avantages de l’offre', en: 'Offer benefits' })
                          : t({ ar: 'الخدمات', fr: 'Services', en: 'Services' })
                    }
                    description={t({
                      ar: 'أضف حتى 8 عناصر. تظهر في قسم مخصص داخل الموقع.',
                      fr: 'Ajoutez jusqu’à 8 éléments affichés dans une section dédiée.',
                      en: 'Add up to 8 items shown in a dedicated section.',
                    })}
                  >
                    <div className="space-y-2.5">
                      {draft.services.map((row, index) => (
                        <div key={index} className="rounded-xl border border-border bg-background p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground">#{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => update('services', draft.services.filter((_, itemIndex) => itemIndex !== index))}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3 w-3" />
                              {t({ ar: 'حذف', fr: 'Supprimer', en: 'Remove' })}
                            </button>
                          </div>
                          <div className="grid gap-2.5">
                            <input
                              value={row.title}
                              onChange={(event) => {
                                const next = [...draft.services];
                                next[index] = { ...next[index], title: event.target.value };
                                update('services', next);
                              }}
                              maxLength={120}
                              placeholder={
                                draft.templateSlug === 'portfolio'
                                  ? t({ ar: 'اسم المشروع', fr: 'Nom du projet', en: 'Project name' })
                                  : draft.templateSlug === 'landing'
                                    ? t({ ar: 'اسم الميزة', fr: 'Nom de l’avantage', en: 'Benefit name' })
                                    : t({ ar: 'اسم الخدمة', fr: 'Nom du service', en: 'Service name' })
                              }
                              className={fieldClass(errors.services)}
                            />
                            <textarea
                              value={row.description}
                              onChange={(event) => {
                                const next = [...draft.services];
                                next[index] = { ...next[index], description: event.target.value };
                                update('services', next);
                              }}
                              maxLength={400}
                              rows={2}
                              placeholder={t({ ar: 'وصف قصير...', fr: 'Courte description...', en: 'Short description...' })}
                              className={fieldClass(errors.services, 'resize-none')}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.services && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.services}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => update('services', [...draft.services, { title: '', description: '' }])}
                      disabled={activeServices.length >= MAX_SERVICES}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3.5 py-2 text-xs font-bold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      {t({ ar: 'إضافة عنصر', fr: 'Ajouter un élément', en: 'Add item' })}
                      <span className="text-muted-foreground">({activeServices.length}/{MAX_SERVICES})</span>
                    </button>
                  </Section>
                )}

                {isProductTemplate && (
                  <Section
                    icon={Sparkles}
                    title={
                      draft.templateSlug === 'restaurant'
                        ? t({ ar: 'قائمة الطعام', fr: 'Le menu', en: 'The menu' })
                        : t({ ar: 'المنتجات', fr: 'Produits', en: 'Products' })
                    }
                    description={t({
                      ar: 'أضف المنتجات أو الأطباق التي تريد عرضها مع السعر. يمكنك إضافة صورة لكل عنصر.',
                      fr: 'Ajoutez les produits ou plats avec leur prix. Une image par élément est possible.',
                      en: 'Add the products or dishes with prices. An image per item is optional.',
                    })}
                  >
                    <div className="space-y-2.5">
                      {draft.products.map((row, index) => (
                        <div key={index} className="rounded-xl border border-border bg-background p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-muted-foreground">#{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => update('products', draft.products.filter((_, itemIndex) => itemIndex !== index))}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-500 hover:bg-rose-500/10"
                            >
                              <Trash2 className="h-3 w-3" />
                              {t({ ar: 'حذف', fr: 'Supprimer', en: 'Remove' })}
                            </button>
                          </div>
                          <div className="grid gap-2.5 sm:grid-cols-2">
                            <input
                              value={row.name}
                              onChange={(event) => {
                                const next = [...draft.products];
                                next[index] = { ...next[index], name: event.target.value };
                                update('products', next);
                              }}
                              maxLength={120}
                              placeholder={
                                draft.templateSlug === 'restaurant'
                                  ? t({ ar: 'اسم الطبق', fr: 'Nom du plat', en: 'Dish name' })
                                  : t({ ar: 'اسم المنتج', fr: 'Nom du produit', en: 'Product name' })
                              }
                              className={fieldClass(errors.products)}
                            />
                            <input
                              value={row.price}
                              onChange={(event) => {
                                const next = [...draft.products];
                                next[index] = { ...next[index], price: event.target.value };
                                update('products', next);
                              }}
                              type="number"
                              min={0}
                              step={1}
                              placeholder={t({ ar: 'السعر (د.ج)', fr: 'Prix (DA)', en: 'Price (DA)' })}
                              dir="ltr"
                              className={fieldClass(errors.products)}
                            />
                            <input
                              value={row.category}
                              onChange={(event) => {
                                const next = [...draft.products];
                                next[index] = { ...next[index], category: event.target.value };
                                update('products', next);
                              }}
                              maxLength={60}
                              placeholder={t({ ar: 'التصنيف (اختياري)', fr: 'Catégorie (optionnel)', en: 'Category (optional)' })}
                              className={fieldClass()}
                            />
                            <ImageField
                              label={t({ ar: 'صورة', fr: 'Image', en: 'Image' })}
                              value={row.imageUrl}
                              onChange={(value) => {
                                const next = [...draft.products];
                                next[index] = { ...next[index], imageUrl: value };
                                update('products', next);
                              }}
                              maxBytes={IMAGE_LIMITS.product}
                              maxDimension={900}
                              compact
                            />
                            <textarea
                              value={row.description}
                              onChange={(event) => {
                                const next = [...draft.products];
                                next[index] = { ...next[index], description: event.target.value };
                                update('products', next);
                              }}
                              maxLength={500}
                              rows={2}
                              placeholder={t({ ar: 'وصف قصير (اختياري)', fr: 'Courte description (optionnel)', en: 'Short description (optional)' })}
                              className={fieldClass(errors.products, 'resize-none sm:col-span-2')}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    {errors.products && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.products}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        update('products', [...draft.products, { name: '', description: '', price: '', category: '', imageUrl: '' }])
                      }
                      disabled={activeProducts.length >= MAX_PRODUCTS}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3.5 py-2 text-xs font-bold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                      {t({ ar: 'إضافة عنصر', fr: 'Ajouter un élément', en: 'Add item' })}
                      <span className="text-muted-foreground">({activeProducts.length}/{MAX_PRODUCTS})</span>
                    </button>
                  </Section>
                )}

                {!isServiceTemplate && !isProductTemplate && (
                  <div className="rounded-xl border border-dashed border-border p-4 text-xs leading-relaxed text-muted-foreground">
                    <p className="font-bold text-foreground">
                      {t({ ar: 'بطاقة أعمال رقمية', fr: 'Carte de visite numérique', en: 'Digital business card' })}
                    </p>
                    <p className="mt-1">
                      {t({
                        ar: 'هذا القالب يعتمد على معلومات التواصل والهوية البصرية. لا تحتاج إلى إضافة خدمات أو منتجات.',
                        fr: 'Ce modèle utilise vos coordonnées et votre identité visuelle. Aucun produit requis.',
                        en: 'This template relies on your contact details and branding. No products needed.',
                      })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-black sm:text-2xl">
                    {t({ ar: 'احجز اسم موقعك', fr: 'Réservez le nom de votre site', en: 'Claim your website name' })}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t({
                      ar: 'نطاق فرعي مجاني على pages.dev. يمكنك ربط نطاقك الخاص لاحقاً.',
                      fr: 'Un sous-domaine gratuit sur pages.dev. Vous pourrez connecter votre domaine plus tard.',
                      en: 'A free pages.dev subdomain. You can connect your own domain later.',
                    })}
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold">
                    {t({ ar: 'الاسم الفرعي', fr: 'Sous-domaine', en: 'Subdomain' })} <span className="text-rose-500">*</span>
                  </label>
                  <div
                    className={`flex items-stretch overflow-hidden rounded-xl border bg-background ${
                      errors.subdomain ? 'border-rose-400' : 'border-border'
                    }`}
                    dir="ltr"
                  >
                    <span className="flex items-center border-e border-border bg-muted px-3 text-xs text-muted-foreground">https://</span>
                    <input
                      value={draft.subdomain}
                      onChange={(event) => update('subdomain', normalizeSubdomain(event.target.value))}
                      maxLength={40}
                      placeholder="ma-boutique"
                      className="min-w-0 flex-1 bg-background px-3 py-3 text-sm font-semibold outline-none placeholder:font-normal placeholder:text-muted-foreground/60"
                    />
                    <span className="flex items-center border-s border-border bg-muted px-3 text-xs font-semibold text-muted-foreground">
                      .pages.dev
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {t({
                      ar: 'أحرف إنجليزية صغيرة وأرقام وشرطات فقط، من 3 إلى 40 حرفاً. يتوفر فحص فوري.',
                      fr: 'Lettres minuscules, chiffres et tirets uniquement, de 3 à 40 caractères. Vérification instantanée.',
                      en: 'Lowercase letters, numbers and hyphens only, 3–40 characters. Instant availability check.',
                    })}
                  </p>

                  <div className="mt-3">
                    {subdomainState.status === 'idle' && (
                      <div className="flex items-start gap-2 rounded-xl bg-muted/60 px-3.5 py-3 text-xs text-muted-foreground">
                        <Globe className="mt-0.5 h-4 w-4 shrink-0" />
                        {t({
                          ar: 'اكتب الاسم وسنخبرك فوراً إن كان متاحاً.',
                          fr: 'Saisissez un nom pour vérifier sa disponibilité.',
                          en: 'Type a name and we will check availability instantly.',
                        })}
                      </div>
                    )}
                    {subdomainState.status === 'checking' && (
                      <div className="flex items-center gap-2 rounded-xl bg-sky-500/10 px-3.5 py-3 text-xs font-semibold text-sky-700 dark:text-sky-300">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t({ ar: 'جاري التحقق من الاسم...', fr: 'Vérification du nom...', en: 'Checking the name...' })}
                      </div>
                    )}
                    {subdomainState.status === 'available' && (
                      <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3.5 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          {t({ ar: 'الاسم متاح! رابطك سيكون:', fr: 'Nom disponible ! Votre adresse :', en: 'Available! Your address will be:' })}{' '}
                          <span className="font-mono" dir="ltr">
                            {subdomainState.normalized || normalizeSubdomain(draft.subdomain)}.pages.dev
                          </span>
                        </span>
                      </div>
                    )}
                    {(subdomainState.status === 'taken' || subdomainState.status === 'error') && (
                      <div
                        className={`rounded-xl px-3.5 py-3 text-xs ${
                          subdomainState.status === 'taken'
                            ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300'
                            : 'bg-amber-500/10 text-amber-800 dark:text-amber-200'
                        }`}
                      >
                        <div className="flex items-start gap-2 font-semibold">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>
                            {subdomainState.status === 'taken'
                              ? t({
                                  ar: subdomainState.message || 'هذا الاسم غير متاح. جرّب اسماً آخر.',
                                  fr: 'Ce nom est déjà pris. Essayez un autre nom.',
                                  en: 'This name is already taken. Try another name.',
                                })
                              : subdomainState.message ||
                                t({
                                  ar: 'تعذر التحقق الآن. يمكنك المتابعة وسنتأكد من الاسم عند النشر.',
                                  fr: 'Vérification impossible. Vous pouvez continuer.',
                                  en: 'Could not verify now. You can continue.',
                                })}
                          </span>
                        </div>
                        {subdomainState.status === 'taken' && (subdomainState.suggestions?.length || 0) > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5 ps-6">
                            {subdomainState.suggestions!.map((suggestion) => (
                              <button
                                type="button"
                                key={suggestion}
                                onClick={() => update('subdomain', suggestion)}
                                className="rounded-lg border border-rose-500/20 bg-background px-2.5 py-1 font-mono text-[11px] font-bold text-foreground hover:border-primary"
                                dir="ltr"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {errors.subdomain && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.subdomain}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-emerald-500" />
                    <p className="text-sm font-bold">
                      {t({ ar: 'نطاقك الخاص (اختياري)', fr: 'Votre domaine (optionnel)', en: 'Your own domain (optional)' })}
                    </p>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t({
                      ar: 'إذا كنت تملك نطاقاً مثل .com أو .dz، أدخله هنا. الربط مجاني والنطاق يبقى ملكك.',
                      fr: 'Si vous possédez un domaine .com ou .dz, indiquez-le. La connexion est gratuite et le domaine reste à vous.',
                      en: 'If you own a .com or .dz domain, enter it here. Connection is free and the domain stays yours.',
                    })}
                  </p>
                  <input
                    value={draft.customDomain}
                    onChange={(event) => update('customDomain', event.target.value)}
                    placeholder="mon-site.com"
                    dir="ltr"
                    className={fieldClass('', 'mt-3')}
                  />
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                    {t(settings.customDomainNote)}
                  </p>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 p-4 text-xs leading-relaxed">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>
                    {t({
                      ar: 'النطاق الفرعي مجاني ومدعوم من Cloudflare Pages. لا تحتاج بطاقة بنكية. يمكنك تغييره قبل النشر فقط.',
                      fr: 'Le sous-domaine est gratuit via Cloudflare Pages, sans carte bancaire. Modifiable avant publication.',
                      en: 'The subdomain is free on Cloudflare Pages with no card. Changeable before publishing.',
                    })}
                  </p>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-black sm:text-2xl">
                    {t({ ar: 'اختر الباقة وطريقة الدفع', fr: 'Choisissez l’offre et le paiement', en: 'Choose your package and payment' })}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t({
                      ar: 'ادفع دفعة أولى، ننشر موقعك بعد التأكيد. الباقي عند التسليم.',
                      fr: 'Payez un premier versement, nous publions après confirmation. Le solde à la livraison.',
                      en: 'Pay a first installment; we publish after confirmation. Balance on delivery.',
                    })}
                  </p>
                </div>

                <div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {config.packages.map((pack) => {
                      const features = packageFeatures(pack);
                      const active = draft.packageSlug === pack.slug;
                      return (
                        <button
                          type="button"
                          key={pack.id}
                          onClick={() => update('packageSlug', pack.slug)}
                          className={`relative rounded-2xl border-2 bg-background p-4 text-start transition-all ${
                            active
                              ? 'border-primary shadow-lg shadow-primary/10'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          {pack.isPopular && (
                            <span className="absolute -top-2.5 start-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-black text-white">
                              {t({ ar: 'الأكثر طلباً', fr: 'Populaire', en: 'Popular' })}
                            </span>
                          )}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-black">{packageName(pack, language)}</p>
                              <p className="mt-1 text-lg font-black text-primary">{money(pack.price, language)}</p>
                              {pack.oldPrice ? (
                                <p className="text-[11px] text-muted-foreground line-through">{money(pack.oldPrice, language)}</p>
                              ) : null}
                            </div>
                            {active && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                            {packageDescription(pack, language)}
                          </p>
                          <div className="mt-3 border-t border-border pt-2.5">
                            <PackageFeatures features={features} limit={4} />
                          </div>
                          <p className="mt-2 text-[10px] font-semibold text-muted-foreground">
                            {pack.deliveryDays} {t({ ar: 'أيام تسليم', fr: 'jours', en: 'days' })}
                            {' • '}
                            {pack.revisions} {t({ ar: 'تعديلات', fr: 'révisions', en: 'revisions' })}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {errors.package && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-500">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.package}
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-black">{t({ ar: 'طريقة الدفع', fr: 'Moyen de paiement', en: 'Payment method' })}</h3>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {PAYMENT_OPTIONS.map((option) => {
                      const Icon = PAYMENT_ICONS[option.value as keyof typeof PAYMENT_ICONS] || CreditCard;
                      const active = draft.paymentMethod === option.value;
                      return (
                        <button
                          type="button"
                          key={option.value}
                          onClick={() => update('paymentMethod', option.value)}
                          className={`flex items-start gap-2 rounded-xl border-2 p-3 text-start transition ${
                            active ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="min-w-0">
                            <span className="block text-xs font-bold">{t(option.label)}</span>
                            <span className="mt-0.5 block text-[10px] leading-snug text-muted-foreground">{t(option.desc)}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {errors.payment && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rose-500">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {errors.payment}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <h3 className="mb-2.5 text-sm font-black">{t({ ar: 'تفاصيل الدفع', fr: 'Détails du paiement', en: 'Payment details' })}</h3>
                  <PaymentDetails settings={settings} amount={deposit} />
                </div>

                <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border p-3.5 text-xs leading-relaxed">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(event) => {
                      setAccepted(event.target.checked);
                      if (event.target.checked) {
                        setErrors((previous) => {
                          const next = { ...previous };
                          delete next.terms;
                          return next;
                        });
                      }
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span>
                    {t({
                      ar: 'أؤكد أن المعلومات صحيحة، وأوافق على شروط الخدمة وسياسة الخصوصية. النطاق المجاني يبقى على pages.dev، وأي نطاق خاص يُشترى باسمي.',
                      fr: 'Je confirme les informations et j’accepte les conditions et la confidentialité. Le domaine gratuit reste sur pages.dev ; tout domaine personnalisé est acheté à mon nom.',
                      en: 'I confirm the details and accept the terms and privacy policy. The free domain stays on pages.dev; any custom domain is bought in my name.',
                    })}
                  </span>
                </label>
                {errors.terms && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-rose-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.terms}
                  </p>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-muted"
                >
                  <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                  {t({ ar: 'السابق', fr: 'Précédent', en: 'Back' })}
                </button>
              ) : (
                <span />
              )}

              {step < 4 ? (
                <button
                  type="button"
                  onClick={next}
                  disabled={checkingSubdomain}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {checkingSubdomain ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t({ ar: 'التالي', fr: 'Suivant', en: 'Next' })}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting || checkingSubdomain}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  {submitting
                    ? t({ ar: 'جاري إرسال الطلب...', fr: 'Envoi en cours...', en: 'Submitting...' })
                    : t({ ar: 'إرسال الطلب وتوليد المعاينة', fr: 'Envoyer et générer l’aperçu', en: 'Submit and generate preview' })}
                </button>
              )}
            </div>
          </div>
        </div>

        {step > 1 && (
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <p className="text-sm font-black">{t({ ar: 'ملخص الطلب', fr: 'Résumé', en: 'Summary' })}</p>
                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">{t({ ar: 'القالب', fr: 'Modèle', en: 'Template' })}</dt>
                    <dd className="text-end font-semibold">{selectedName || '—'}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">{t({ ar: 'اسم الموقع', fr: 'Nom', en: 'Site name' })}</dt>
                    <dd className="max-w-[160px] truncate text-end font-semibold">{draft.siteName || '—'}</dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">{t({ ar: 'النطاق', fr: 'Domaine', en: 'Domain' })}</dt>
                    <dd className="max-w-[170px] truncate text-end font-mono text-[11px] font-semibold" dir="ltr">
                      {draft.subdomain ? `${draft.subdomain}.pages.dev` : '—'}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-muted-foreground">{t({ ar: 'الباقة', fr: 'Offre', en: 'Package' })}</dt>
                    <dd className="text-end font-semibold">{packageLabel || '—'}</dd>
                  </div>
                </dl>
                <div className="mt-3 border-t border-border pt-3">
                  <p className="text-[11px] text-muted-foreground">{t({ ar: 'الإجمالي', fr: 'Total', en: 'Total' })}</p>
                  <p className="text-xl font-black text-primary">{money(price, language)}</p>
                  {settings.depositPercent > 0 && settings.depositPercent < 100 && (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {t({ ar: 'الدفعة الأولى', fr: 'Premier versement', en: 'First payment' })}: {money(deposit, language)} ({settings.depositPercent}%)
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl bg-primary/5 p-4 text-xs">
                <p className="font-bold">{t({ ar: 'لماذا نحن؟', fr: 'Pourquoi nous ?', en: 'Why us?' })}</p>
                <ul className="mt-2 space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {t({ ar: 'معاينة مجانية قبل الدفع', fr: 'Aperçu gratuit avant paiement', en: 'Free preview before payment' })}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {t({ ar: 'نطاق فرعي مجاني', fr: 'Sous-domaine gratuit', en: 'Free subdomain' })}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {t({ ar: 'بدون اشتراك شهري', fr: 'Sans abonnement mensuel', en: 'No monthly subscription' })}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    {t({ ar: 'متابعة الطلب برقم مرجعي', fr: 'Suivi par référence', en: 'Track by reference' })}
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

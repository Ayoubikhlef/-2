import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Clipboard,
  FileText,
  Globe2,
  Loader2,
  Megaphone,
  Package,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import type { LangText } from '../data/digitalServices';
import {
  api,
  type AiStudioLanguage,
  type AiStudioResult,
  type AiStudioTool,
} from '../utils/api';

type FieldDef = {
  key: string;
  label: LangText;
  placeholder: LangText;
  required?: boolean;
  multiline?: boolean;
  maxLength: number;
};

type ToolDef = {
  id: AiStudioTool;
  icon: LucideIcon;
  label: LangText;
  tagline: LangText;
  serviceValue: string;
  fields: FieldDef[];
};

const TOOLS: ToolDef[] = [
  {
    id: 'cv',
    icon: FileText,
    label: { ar: 'السيرة الذاتية', fr: 'CV', en: 'CV' },
    tagline: {
      ar: 'سيرة منظمة حسب الوظيفة المستهدفة',
      fr: 'Un CV structuré pour le poste visé',
      en: 'A CV structured for the target role',
    },
    serviceValue: 'ai-cv',
    fields: [
      {
        key: 'fullName',
        label: { ar: 'الاسم الكامل', fr: 'Nom complet', en: 'Full name' },
        placeholder: { ar: 'أحمد بن علي', fr: 'Ahmed Ben Ali', en: 'Ahmed Ben Ali' },
        required: true,
        maxLength: 120,
      },
      {
        key: 'jobTitle',
        label: { ar: 'الوظيفة المستهدفة', fr: 'Poste visé', en: 'Target job title' },
        placeholder: {
          ar: 'مسؤول تسويق رقمي',
          fr: 'Chargé de marketing digital',
          en: 'Digital marketing specialist',
        },
        required: true,
        maxLength: 120,
      },
      {
        key: 'experience',
        label: { ar: 'الخبرات العملية', fr: 'Expériences', en: 'Work experience' },
        placeholder: {
          ar: 'آخر منصب، الشركة، المهام والإنجازات بالأرقام إن أمكن...',
          fr: 'Derniers postes, entreprise, missions et résultats chiffrés…',
          en: 'Recent roles, company, responsibilities and measurable results…',
        },
        required: true,
        multiline: true,
        maxLength: 700,
      },
      {
        key: 'skills',
        label: { ar: 'المهارات', fr: 'Compétences', en: 'Skills' },
        placeholder: {
          ar: 'التسويق، Excel، إدارة الفرق، كتابة المحتوى...',
          fr: 'Marketing, Excel, gestion d’équipe, rédaction…',
          en: 'Marketing, Excel, team management, copywriting…',
        },
        required: true,
        maxLength: 500,
      },
      {
        key: 'education',
        label: { ar: 'التكوين والشهادات', fr: 'Formation et diplômes', en: 'Education & training' },
        placeholder: {
          ar: 'ليسانس تسويق، جامعة جيجل، 2022',
          fr: 'Licence marketing, Université de Jijel, 2022',
          en: 'BA in Marketing, University of Jijel, 2022',
        },
        maxLength: 300,
      },
      {
        key: 'contact',
        label: { ar: 'بيانات التواصل', fr: 'Coordonnées', en: 'Contact details' },
        placeholder: {
          ar: 'الهاتف، البريد، المدينة',
          fr: 'Téléphone, e-mail, ville',
          en: 'Phone, email, city',
        },
        maxLength: 200,
      },
    ],
  },
  {
    id: 'post',
    icon: Megaphone,
    label: { ar: 'منشور اجتماعي', fr: 'Post social', en: 'Social post' },
    tagline: {
      ar: 'خطاف ونص دعائي وهاشتاغات جاهزة',
      fr: 'Accroche, texte et hashtags prêts à publier',
      en: 'A hook, body and hashtags ready to publish',
    },
    serviceValue: 'ai-content',
    fields: [
      {
        key: 'topic',
        label: { ar: 'موضوع المنشور', fr: 'Sujet du post', en: 'Post topic' },
        placeholder: {
          ar: 'عرض خاص على الهواتف حتى نهاية الأسبوع',
          fr: 'Promo sur les smartphones jusqu’à la fin de la semaine',
          en: 'Smartphone promotion until the end of the week',
        },
        required: true,
        multiline: true,
        maxLength: 500,
      },
      {
        key: 'platform',
        label: { ar: 'المنصة', fr: 'Plateforme', en: 'Platform' },
        placeholder: {
          ar: 'فيسبوك، إنستغرام، لينكدإن، تيك توك',
          fr: 'Facebook, Instagram, LinkedIn, TikTok',
          en: 'Facebook, Instagram, LinkedIn, TikTok',
        },
        maxLength: 60,
      },
      {
        key: 'audience',
        label: { ar: 'الجمهور المستهدف', fr: 'Public cible', en: 'Target audience' },
        placeholder: {
          ar: 'شباب، طلبة، أصحاب متاجر...',
          fr: 'Jeunes, étudiants, commerçants…',
          en: 'Young people, students, shop owners…',
        },
        maxLength: 200,
      },
      {
        key: 'offer',
        label: { ar: 'العرض والتفاصيل', fr: 'Offre et détails', en: 'Offer and details' },
        placeholder: {
          ar: 'السعر، المدة، ما يميز العرض...',
          fr: 'Prix, durée, ce qui rend l’offre unique…',
          en: 'Price, duration, what makes the offer stand out…',
        },
        multiline: true,
        maxLength: 500,
      },
      {
        key: 'tone',
        label: { ar: 'النبرة', fr: 'Ton', en: 'Tone' },
        placeholder: {
          ar: 'احترافي، ودود، مباشر...',
          fr: 'Professionnel, amical, direct…',
          en: 'Professional, friendly, direct…',
        },
        maxLength: 60,
      },
    ],
  },
  {
    id: 'product',
    icon: Package,
    label: { ar: 'وصف منتج', fr: 'Description produit', en: 'Product description' },
    tagline: {
      ar: 'وصف بيعي جاهز لمتجرك',
      fr: 'Une description prête pour votre boutique',
      en: 'A sales-ready description for your store',
    },
    serviceValue: 'ai-content',
    fields: [
      {
        key: 'productName',
        label: { ar: 'اسم المنتج', fr: 'Nom du produit', en: 'Product name' },
        placeholder: {
          ar: 'سماعات لاسلكية Pro',
          fr: 'Écouteurs sans fil Pro',
          en: 'Wireless earbuds Pro',
        },
        required: true,
        maxLength: 120,
      },
      {
        key: 'features',
        label: { ar: 'المميزات والمواصفات', fr: 'Caractéristiques', en: 'Features & specs' },
        placeholder: {
          ar: 'عمر البطارية، البلوتوث، العزل الصوتي، محتوى العلبة...',
          fr: 'Autonomie, Bluetooth, réduction de bruit, contenu de la boîte…',
          en: 'Battery life, Bluetooth, noise isolation, box contents…',
        },
        required: true,
        multiline: true,
        maxLength: 700,
      },
      {
        key: 'category',
        label: { ar: 'الفئة', fr: 'Catégorie', en: 'Category' },
        placeholder: { ar: 'إلكترونيات، منزل، رياضة...', fr: 'Électronique, maison, sport…', en: 'Electronics, home, sport…' },
        maxLength: 80,
      },
      {
        key: 'price',
        label: { ar: 'السعر', fr: 'Prix', en: 'Price' },
        placeholder: { ar: '4 500 دج', fr: '4 500 DA', en: 'DZD 4,500' },
        maxLength: 60,
      },
      {
        key: 'audience',
        label: { ar: 'الجمهور المستهدف', fr: 'Public cible', en: 'Target audience' },
        placeholder: { ar: 'شباب، طلبة، رياضيون...', fr: 'Jeunes, étudiants, sportifs…', en: 'Young people, students, athletes…' },
        maxLength: 200,
      },
      {
        key: 'tone',
        label: { ar: 'النبرة', fr: 'Ton', en: 'Tone' },
        placeholder: { ar: 'احترافي، حماسي، بسيط...', fr: 'Professionnel, enthousiaste, simple…', en: 'Professional, enthusiastic, simple…' },
        maxLength: 60,
      },
    ],
  },
];

const EMPTY_VALUES: Record<AiStudioTool, Record<string, string>> = {
  cv: {},
  post: {},
  product: {},
};

// Arabic is RTL, so a phone number or an email inside the generated text is
// displayed in reverse (0661 22 33 44 → 44 33 22 0661). Unicode isolates keep
// those Latin/numeric runs in reading order without changing the copied text.
const LRI = '\u2066';
const PDI = '\u2069';

function isolateLtrRuns(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, (match) => `${LRI}${match}${PDI}`)
    .replace(/(\+?\d[\d\s().-]{6,}\d)/g, (match) => `${LRI}${match}${PDI}`);
}

interface AiStudioProps {
  onRequestService?: (serviceValue: string) => void;
  cvServiceValue?: string;
  contentServiceValue?: string;
}

export function AiStudio({ onRequestService, cvServiceValue, contentServiceValue }: AiStudioProps) {
  const { t, language } = useLanguage();
  const [tool, setTool] = useState<AiStudioTool>('cv');
  const [outputLang, setOutputLang] = useState<AiStudioLanguage>(language);
  const [values, setValues] = useState<Record<AiStudioTool, Record<string, string>>>(EMPTY_VALUES);
  const [result, setResult] = useState<AiStudioResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<{ available: boolean; mock: boolean } | null>(null);

  const activeTool = TOOLS.find((item) => item.id === tool) || TOOLS[0];

  useEffect(() => {
    setOutputLang(language);
  }, [language]);

  useEffect(() => {
    let active = true;
    api.ai
      .status()
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch(() => {
        // An older server without /api/ai simply shows the "being activated"
        // badge; the form still explains the state if the user tries.
        if (active) setStatus({ available: false, mock: false });
      });
    return () => {
      active = false;
    };
  }, []);

  const updateField = (key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [tool]: { ...prev[tool], [key]: value },
    }));
  };

  const chooseTool = (id: AiStudioTool) => {
    if (id === tool) return;
    setTool(id);
    setResult(null);
    setError(null);
    setCopied(false);
  };

  const serviceValueFor = (item: ToolDef) => {
    if (item.id === 'cv') return cvServiceValue || item.serviceValue;
    return contentServiceValue || item.serviceValue;
  };

  const requestFullService = (item: ToolDef) => {
    const value = serviceValueFor(item);
    if (onRequestService) {
      onRequestService(value);
    } else if (typeof window !== 'undefined') {
      window.location.hash = '#digital-quote';
    }
  };

  const describeError = (err: any): string => {
    const code = err?.code;
    if (code === 'ai_not_configured') {
      return t({
        ar: 'المولّد التلقائي قيد التفعيل حالياً. يمكنك طلب نفس الخدمة من فريقنا وسننجزها لك.',
        fr: 'Le générateur automatique est en cours d’activation. Demandez le service à notre équipe, nous le réalisons pour vous.',
        en: 'The automatic generator is being activated. Request the same service from our team and we will do it for you.',
      });
    }
    if (code === 'ai_rate_limited' || code === 'ai_daily_limit' || err?.status === 429) {
      return t({
        ar: 'الخدمة مشغولة الآن. حاول بعد دقيقة أو اطلب الخدمة من فريقنا.',
        fr: 'Le service est très sollicité. Réessayez dans une minute ou demandez le service à notre équipe.',
        en: 'The service is busy right now. Try again in a minute or request the service from our team.',
      });
    }
    if (code === 'ai_timeout') {
      return t({
        ar: 'استغرق التوليد وقتاً طويلاً. أعد المحاولة أو اطلب الخدمة من فريقنا.',
        fr: 'La génération a pris trop de temps. Réessayez ou demandez le service à notre équipe.',
        en: 'Generation took too long. Try again or request the service from our team.',
      });
    }
    if (code === 'ai_missing_fields' || code === 'ai_invalid_request') {
      return t({
        ar: 'أكمل الحقول المطلوبة ثم أعد المحاولة.',
        fr: 'Complétez les champs obligatoires puis réessayez.',
        en: 'Complete the required fields and try again.',
      });
    }
    return t({
      ar: 'تعذر التوليد الآن. حاول مرة أخرى أو اطلب الخدمة من فريقنا.',
      fr: 'Génération impossible pour le moment. Réessayez ou demandez le service à notre équipe.',
      en: 'Could not generate right now. Try again or request the service from our team.',
    });
  };

  const handleGenerate = async () => {
    if (loading) return;
    const missing = activeTool.fields.filter(
      (field) => field.required && !(values[tool][field.key] || '').trim(),
    );
    if (missing.length > 0) {
      setError(
        t({
          ar: `أكمل هذه الحقول أولاً: ${missing.map((field) => t(field.label)).join('، ')}`,
          fr: `Complétez d’abord : ${missing.map((field) => t(field.label)).join(', ')}`,
          en: `Complete these fields first: ${missing.map((field) => t(field.label)).join(', ')}`,
        }),
      );
      return;
    }

    setLoading(true);
    setSlow(false);
    setError(null);
    setResult(null);
    setCopied(false);
    // A cold Render instance or a slow provider can take a while; tell the
    // visitor that the request is still running instead of leaving a bare spinner.
    const slowTimer = window.setTimeout(() => setSlow(true), 8000);
    try {
      const data = await api.ai.generate({
        tool,
        language: outputLang,
        fields: values[tool],
      });
      setResult(data);
      setStatus({ available: true, mock: Boolean(data.mock) });
    } catch (err: any) {
      if (err?.code === 'ai_not_configured') {
        setStatus({ available: false, mock: false });
      }
      setError(describeError(err));
    } finally {
      window.clearTimeout(slowTimer);
      setSlow(false);
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.text);
      setCopied(true);
      toast.success(t({ ar: 'تم نسخ النص', fr: 'Texte copié', en: 'Text copied' }));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(
        t({
          ar: 'تعذر النسخ. حدد النص وانسخه يدوياً.',
          fr: 'Copie impossible. Sélectionnez le texte et copiez-le manuellement.',
          en: 'Could not copy. Select the text and copy it manually.',
        }),
      );
    }
  };

  const inputClass =
    'w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';
  const labelClass = 'mb-1.5 block text-xs font-bold sm:text-sm';

  const statusBadge = (() => {
    if (!status) {
      return {
        className: 'bg-white/10 text-white/80 ring-white/20',
        icon: <Loader2 className="h-3 w-3 animate-spin" />,
        label: t({ ar: 'جارٍ التحقق...', fr: 'Vérification…', en: 'Checking…' }),
      };
    }
    if (status.mock) {
      return {
        className: 'bg-amber-400/15 text-amber-200 ring-amber-300/30',
        icon: <Sparkles className="h-3 w-3" />,
        label: t({ ar: 'وضع تجريبي', fr: 'Mode démo', en: 'Demo mode' }),
      };
    }
    if (status.available) {
      return {
        className: 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30',
        icon: <Check className="h-3 w-3" />,
        label: t({ ar: 'متاح الآن', fr: 'Disponible', en: 'Available' }),
      };
    }
    return {
      className: 'bg-amber-400/15 text-amber-200 ring-amber-300/30',
      icon: <AlertCircle className="h-3 w-3" />,
      label: t({ ar: 'قيد التفعيل', fr: 'En activation', en: 'Being activated' }),
    };
  })();

  return (
    <section
      id="ai-studio"
      className="mt-10 scroll-mt-24 overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-xl shadow-primary/5"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary to-indigo-800 p-6 text-white sm:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Wand2 className="h-6 w-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-black md:text-2xl">
                  {t({ ar: 'AI Studio — جرّب التوليد الآن', fr: 'AI Studio — testez la génération', en: 'AI Studio — try generation now' })}
                </h3>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${statusBadge.className}`}>
                  {statusBadge.icon}
                  {statusBadge.label}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
                {t({
                  ar: 'ثلاث أدوات: سيرة ذاتية، منشور لوسائل التواصل، ووصف منتج. النتيجة جاهزة للنسخ، والنسخة الاحترافية المنسقة ننجزها لك.',
                  fr: 'Trois outils : CV, post réseaux sociaux et description produit. Le résultat est prêt à copier ; la version professionnelle mise en forme, c’est nous qui la réalisons.',
                  en: 'Three tools: CV, social post and product description. The result is ready to copy; we deliver the professionally formatted version.',
                })}
              </p>
            </div>
          </div>

          <div dir="ltr" className="flex items-center gap-1 rounded-xl bg-white/10 p-1 ring-1 ring-white/20">
            <Globe2 className="mx-1.5 h-4 w-4 text-white/60" aria-hidden="true" />
            {(['ar', 'fr', 'en'] as const).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setOutputLang(code)}
                aria-pressed={outputLang === code}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase transition ${
                  outputLang === code ? 'bg-white text-slate-900' : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="p-6 sm:p-8 lg:border-e lg:border-border">
          <div className="flex flex-wrap gap-2">
            {TOOLS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === tool;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => chooseTool(item.id)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-black transition sm:text-sm ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.label)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t(activeTool.tagline)}</p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {activeTool.fields.map((field) => {
              const value = values[tool][field.key] || '';
              return (
                <div key={field.key} className={field.multiline ? 'sm:col-span-2' : ''}>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label htmlFor={`ai-${tool}-${field.key}`} className={labelClass}>
                      {t(field.label)}
                      {field.required && <span className="ms-0.5 text-destructive">*</span>}
                    </label>
                    {field.multiline && (
                      <span className="text-[10px] text-muted-foreground">
                        {value.length}/{field.maxLength}
                      </span>
                    )}
                  </div>
                  {field.multiline ? (
                    <textarea
                      id={`ai-${tool}-${field.key}`}
                      rows={3}
                      maxLength={field.maxLength}
                      dir="auto"
                      value={value}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      placeholder={t(field.placeholder)}
                      className={`${inputClass} resize-none`}
                    />
                  ) : (
                    <input
                      id={`ai-${tool}-${field.key}`}
                      type="text"
                      maxLength={field.maxLength}
                      dir="auto"
                      value={value}
                      onChange={(event) => updateField(field.key, event.target.value)}
                      placeholder={t(field.placeholder)}
                      className={inputClass}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="leading-relaxed">{error}</p>
                <button
                  type="button"
                  onClick={() => requestFullService(activeTool)}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-black text-primary hover:underline"
                >
                  {t({ ar: 'اطلبها من فريقنا', fr: 'Demander à notre équipe', en: 'Request it from our team' })}
                  <ArrowRight className="h-3 w-3 rtl:rotate-180" />
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-indigo-700 px-5 py-3.5 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {loading ? (
              <>
                <Loader2 className="h-[18px] w-[18px] animate-spin" />
                {slow
                  ? t({
                      ar: 'جارٍ التوليد… قد يستغرق حتى 30 ثانية',
                      fr: 'Génération… jusqu’à 30 secondes',
                      en: 'Generating… may take up to 30 seconds',
                    })
                  : t({ ar: 'جارٍ التوليد...', fr: 'Génération en cours…', en: 'Generating…' })}
              </>
            ) : (
              <>
                <Wand2 className="h-[18px] w-[18px]" />
                {t({ ar: 'ولّد النص الآن', fr: 'Générer le texte', en: 'Generate the text' })}
              </>
            )}
          </button>

          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
            {t({
              ar: 'لا نخزّن مدخلاتك في قاعدة بياناتنا. تُعالج فقط لتوليد النص. لا تكتب معلومات حساسة.',
              fr: 'Vos saisies ne sont pas stockées dans notre base. Elles servent uniquement à générer le texte. N’écrivez pas de données sensibles.',
              en: 'Your input is not stored in our database. It is used only to generate the text. Do not enter sensitive information.',
            })}
          </p>
        </div>

        <div className="bg-muted/30 p-6 sm:p-8" aria-live="polite">
          {result ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300">
                    <Check className="h-3 w-3" />
                    {t({ ar: 'جاهز', fr: 'Prêt', en: 'Ready' })}
                  </span>
                  {result.mock && (
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-black text-amber-700 dark:text-amber-300">
                      {t({ ar: 'وضع تجريبي', fr: 'Mode démo', en: 'Demo mode' })}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={copyResult}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-black transition hover:border-primary/40 hover:text-primary"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Clipboard className="h-3.5 w-3.5" />}
                  {copied
                    ? t({ ar: 'تم النسخ', fr: 'Copié', en: 'Copied' })
                    : t({ ar: 'نسخ النص', fr: 'Copier', en: 'Copy text' })}
                </button>
              </div>

              <div
                dir={result.language === 'ar' ? 'rtl' : 'ltr'}
                className="mt-3 max-h-[520px] min-h-[220px] flex-1 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed"
              >
                {isolateLtrRuns(result.text)}
              </div>

              <p className="mt-2 text-[11px] text-muted-foreground">
                {t({
                  ar: 'راجع النص قبل النشر؛ التوليد الآلي قد يخطئ. النسخة النهائية المنسقة متاحة كخدمة.',
                  fr: 'Relisez le texte avant publication ; la génération automatique peut se tromper. La version finale mise en forme est disponible comme service.',
                  en: 'Review the text before publishing; automatic generation can make mistakes. The final formatted version is available as a service.',
                })}
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-border bg-background px-4 py-2.5 text-xs font-black transition hover:border-primary/40 hover:text-primary disabled:opacity-60"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  {t({ ar: 'إعادة التوليد', fr: 'Régénérer', en: 'Regenerate' })}
                </button>
                <button
                  type="button"
                  onClick={() => requestFullService(activeTool)}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground transition hover:bg-primary/90"
                >
                  {t({ ar: 'اطلب النسخة الاحترافية', fr: 'Demander la version pro', en: 'Request the pro version' })}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-background/60 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Sparkles className="h-7 w-7" />
              </span>
              <h4 className="mt-4 text-lg font-black">
                {t({ ar: 'نتيجتك تظهر هنا', fr: 'Votre résultat apparaîtra ici', en: 'Your result appears here' })}
              </h4>
              <p className="mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {t({
                  ar: 'املأ الحقول ثم اضغط «ولّد النص الآن». تحصل على نص جاهز للنسخ في ثوانٍ.',
                  fr: 'Remplissez les champs puis cliquez sur « Générer le texte ». Vous obtenez un texte prêt à copier en quelques secondes.',
                  en: 'Fill in the fields and click “Generate the text”. You get a copy-ready text in seconds.',
                })}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

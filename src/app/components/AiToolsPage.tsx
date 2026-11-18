import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Globe2,
  ImageUp,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import {
  AI_TOOL_STAGES,
  aiSellerTools,
  type AiSellerTool,
} from '../data/aiTools';
import { api, type AiStudioLanguage, type AiTool } from '../utils/api';

type TrialRecord = {
  at: number;
  result: string;
  language: AiStudioLanguage;
  mock?: boolean;
};

type TrialMap = Record<string, TrialRecord>;

const TRIAL_KEY = 'aos_ai_tools_trials_v1';
const MAX_SAVED_RESULT = 12000;

function readTrials(): TrialMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(TRIAL_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    const out: TrialMap = {};
    for (const [key, value] of Object.entries(parsed as Record<string, any>)) {
      if (!value || typeof value.result !== 'string' || typeof value.at !== 'number') continue;
      out[key] = {
        at: value.at,
        result: value.result.slice(0, MAX_SAVED_RESULT),
        language: ['ar', 'fr', 'en'].includes(value.language) ? value.language : 'ar',
        mock: Boolean(value.mock),
      };
    }
    return out;
  } catch {
    return {};
  }
}

function persistTrials(trials: TrialMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(TRIAL_KEY, JSON.stringify(trials));
  } catch {
    // Storage full or disabled: the tool still works for this session.
  }
}

// Arabic is RTL, so a phone number or an email inside the generated text is
// displayed in reverse. Unicode isolates keep Latin/numeric runs in order
// without changing the copied text.
const LRI = '\u2066';
const PDI = '\u2069';

function isolateLtrRuns(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, (match) => `${LRI}${match}${PDI}`)
    .replace(/(\+?\d[\d\s().-]{6,}\d)/g, (match) => `${LRI}${match}${PDI}`);
}

/** Read a local file as a data URL. The page CSP blocks `blob:` images, so a
 *  FileReader is used instead of URL.createObjectURL. */
function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('read'));
    };
    reader.onerror = () => reject(new Error('read'));
    reader.readAsDataURL(file);
  });
}

/** Downscale and compress a photo in the browser so the request stays under 1 MB. */
async function compressImage(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) throw new Error('type');
  if (file.size > 15 * 1024 * 1024) throw new Error('size');

  const source = await readAsDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('read'));
    element.src = source;
  });

  const render = (maxSide: number) => {
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas');
    // JPEG has no transparency; white avoids a black background on PNGs.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  let canvas = render(1280);
  let quality = 0.78;
  let data = canvas.toDataURL('image/jpeg', quality);
  while (data.length > 850_000 && quality > 0.4) {
    quality -= 0.08;
    data = canvas.toDataURL('image/jpeg', quality);
  }
  if (data.length > 850_000) {
    canvas = render(900);
    data = canvas.toDataURL('image/jpeg', 0.7);
  }
  if (data.length > 850_000) throw new Error('large');
  return data;
}

function LanguagePicker({
  value,
  onChange,
}: {
  value: AiStudioLanguage;
  onChange: (code: AiStudioLanguage) => void;
}) {
  return (
    <div dir="ltr" className="flex items-center gap-1 rounded-xl bg-white/10 p-1 ring-1 ring-white/20">
      <Globe2 className="mx-1.5 h-4 w-4 text-white/60" aria-hidden="true" />
      {(['ar', 'fr', 'en'] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => onChange(code)}
          aria-pressed={value === code}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-black uppercase transition ${
            value === code ? 'bg-white text-slate-900' : 'text-white/70 hover:bg-white/10 hover:text-white'
          }`}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

export function AiToolsPage() {
  const { t, language } = useLanguage();
  const [activeId, setActiveId] = useState<AiTool | null>(null);
  const [outputLang, setOutputLang] = useState<AiStudioLanguage>(language || 'ar');
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [images, setImages] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    tool: AiTool;
    text: string;
    language: AiStudioLanguage;
    mock?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [trials, setTrials] = useState<TrialMap>(() => readTrials());
  const workspaceRef = useRef<HTMLDivElement | null>(null);

  const activeTool = useMemo(
    () => aiSellerTools.find((tool) => tool.id === activeId) || null,
    [activeId],
  );
  const ActiveIcon = activeTool?.icon;
  const used = activeId ? trials[activeId] : undefined;

  const grouped = useMemo(
    () =>
      AI_TOOL_STAGES.map((stage) => ({
        ...stage,
        tools: aiSellerTools.filter((tool) => tool.stage === stage.id),
      })).filter((group) => group.tools.length > 0),
    [],
  );

  useEffect(() => {
    setOutputLang(language || 'ar');
  }, [language]);

  useEffect(() => {
    const meta = document.querySelector('meta[name="description"]');
    if (!meta) return;
    const previous = meta.getAttribute('content') || '';
    meta.setAttribute(
      'content',
      t({
        ar: '12 أداة ذكاء اصطناعي مجانية لأصحاب المتاجر: فاحص المنتج، صانع العروض، تحليل المنافس، الإعلانات، صفحة المنتج، سيناريو الفيديو، تحليل الحملات والمزيد.',
        fr: '12 outils IA pour les e-commerçants : analyse produit, offres, concurrents, publicités, page produit, script vidéo et audit de campagne.',
        en: '12 AI tools for online sellers: product checks, offers, competitor analysis, ads, product pages, video scripts and campaign audits.',
      }),
    );
    return () => meta.setAttribute('content', previous);
  }, [language]);

  const chooseTool = (tool: AiSellerTool) => {
    setActiveId(tool.id);
    setError(null);
    setCopied(false);
    const record = trials[tool.id];
    setResult(
      record
        ? { tool: tool.id, text: record.result, language: record.language, mock: record.mock }
        : null,
    );
    window.setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const closeTool = () => {
    setActiveId(null);
    setResult(null);
    setError(null);
    setCopied(false);
  };

  const updateField = (key: string, value: string) => {
    if (!activeTool) return;
    setValues((previous) => ({
      ...previous,
      [activeTool.id]: { ...previous[activeTool.id], [key]: value },
    }));
  };

  const setImage = (data: string | null) => {
    if (!activeTool) return;
    setImages((previous) => {
      const next = { ...previous };
      if (data) next[activeTool.id] = data;
      else delete next[activeTool.id];
      return next;
    });
  };

  const pickImage = async (file: File | undefined) => {
    if (!file || !activeTool) return;
    setUploading(true);
    try {
      const data = await compressImage(file);
      setImage(data);
      toast.success(t({ ar: 'تم تجهيز الصورة', fr: 'Image prête', en: 'Image ready' }));
    } catch (err: any) {
      const reason = err?.message;
      toast.error(
        reason === 'size'
          ? t({
              ar: 'الصورة كبيرة جداً. اختر صورة أقل من 15 ميغابايت.',
              fr: 'Image trop lourde. Choisissez une image de moins de 15 Mo.',
              en: 'Image too large. Choose a file under 15 MB.',
            })
          : t({
              ar: 'تعذر قراءة الصورة. جرّب JPG أو PNG أو WebP.',
              fr: 'Impossible de lire l’image. Essayez JPG, PNG ou WebP.',
              en: 'Could not read the image. Try JPG, PNG or WebP.',
            }),
      );
    } finally {
      setUploading(false);
    }
  };

  const describeError = (err: any): string => {
    const code = err?.code;
    if (code === 'ai_image_required') {
      return t({
        ar: 'أضف صورة الإعلان أولاً ثم أعد المحاولة.',
        fr: 'Ajoutez d’abord l’image de la publicité, puis réessayez.',
        en: 'Add the ad image first, then try again.',
      });
    }
    if (code === 'ai_invalid_image') {
      return t({
        ar: 'الصيغة غير مدعومة أو الصورة كبيرة. استعمل JPG أو PNG أو WebP بحجم أقل.',
        fr: 'Format non supporté ou image trop lourde. Utilisez JPG, PNG ou WebP plus léger.',
        en: 'Unsupported format or the image is too large. Use a smaller JPG, PNG or WebP.',
      });
    }
    if (code === 'ai_image_unavailable') {
      return t({
        ar: 'تحليل الصور غير متاح مؤقتاً. اكتب وصف الإعلان في الحقول وسنحلله نصياً.',
        fr: 'L’analyse d’image est momentanément indisponible. Décrivez la pub dans les champs, nous l’analyserons par texte.',
        en: 'Image analysis is temporarily unavailable. Describe the ad in the fields and we will review it as text.',
      });
    }
    if (code === 'ai_not_configured') {
      return t({
        ar: 'الأداة قيد التفعيل حالياً. يمكنك طلب نفس الخدمة من فريقنا وسننجزها لك.',
        fr: 'L’outil est en cours d’activation. Demandez le service à notre équipe, nous le réalisons pour vous.',
        en: 'This tool is being activated. Request the same service from our team and we will do it for you.',
      });
    }
    if (code === 'ai_rate_limited' || code === 'ai_daily_limit' || err?.status === 429) {
      return t({
        ar: 'الأداة مشغولة الآن. انتظر دقيقة ثم أعد المحاولة.',
        fr: 'L’outil est très sollicité. Attendez une minute puis réessayez.',
        en: 'The tool is busy right now. Wait a minute and try again.',
      });
    }
    if (code === 'ai_timeout') {
      return t({
        ar: 'استغرق التوليد وقتاً طويلاً. أعد المحاولة بعد قليل.',
        fr: 'La génération a pris trop de temps. Réessayez dans un instant.',
        en: 'Generation took too long. Try again in a moment.',
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
      ar: 'تعذر التوليد الآن. أعد المحاولة أو اطلب الخدمة من فريقنا.',
      fr: 'Génération impossible pour le moment. Réessayez ou demandez le service à notre équipe.',
      en: 'Could not generate right now. Try again or request the service from our team.',
    });
  };

  const handleGenerate = async () => {
    if (!activeTool || loading) return;
    if (used) {
      setError(
        t({
          ar: 'استعملت التجربة المجانية لهذه الأداة. اطلب النسخة الكاملة من فريقنا.',
          fr: 'Vous avez utilisé l’essai gratuit de cet outil. Demandez la version complète à notre équipe.',
          en: 'You have used this tool’s free trial. Request the full version from our team.',
        }),
      );
      return;
    }

    const missing = activeTool.fields.filter(
      (field) => field.required && !(values[activeTool.id]?.[field.key] || '').trim(),
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
    if (activeTool.needsImage && !images[activeTool.id]) {
      setError(
        t({
          ar: 'ارفع صورة الإعلان أولاً.',
          fr: 'Importez d’abord l’image de la publicité.',
          en: 'Upload the ad image first.',
        }),
      );
      return;
    }

    setLoading(true);
    setSlow(false);
    setError(null);
    setResult(null);
    setCopied(false);
    const slowTimer = window.setTimeout(() => setSlow(true), 8000);

    try {
      const data = await api.ai.generate({
        tool: activeTool.id,
        language: outputLang,
        fields: values[activeTool.id] || {},
        ...(activeTool.needsImage ? { image: images[activeTool.id] } : {}),
      });
      setResult({
        tool: activeTool.id,
        text: data.text,
        language: outputLang,
        mock: Boolean(data.mock),
      });

      // A demo answer must not consume the real free trial.
      if (!data.mock) {
        const record: TrialRecord = {
          at: Date.now(),
          result: data.text.slice(0, MAX_SAVED_RESULT),
          language: outputLang,
        };
        setTrials((previous) => {
          const next = { ...previous, [activeTool.id]: record };
          persistTrials(next);
          return next;
        });
      }
      toast.success(t({ ar: 'النتيجة جاهزة', fr: 'Résultat prêt', en: 'Result ready' }));
    } catch (err: any) {
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

  const downloadResult = () => {
    if (!result || typeof window === 'undefined') return;
    // A data: URL is used instead of a blob: one because the site CSP allows
    // data: and the download then works even with a strict default-src.
    const href = `data:text/plain;charset=utf-8,${encodeURIComponent(result.text)}`;
    const link = document.createElement('a');
    link.href = href;
    link.download = `${result.tool}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const inputClass =
    'w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60';
  const labelClass = 'mb-1.5 block text-xs font-bold sm:text-sm';

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-background px-4 pb-14 pt-16">
        <div className="mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-300">
            <Sparkles className="h-3.5 w-3.5" />
            {t({ ar: 'أدوات الذكاء الاصطناعي', fr: 'Outils d’IA', en: 'AI tools' })}
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl md:text-5xl">
            {t({
              ar: '12 أداة ذكاء اصطناعي لمتجرك',
              fr: '12 outils IA pour votre boutique',
              en: '12 AI tools for your store',
            })}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t({
              ar: 'من فحص المنتج إلى تحليل الحملة: جرّب كل أداة مرة مجاناً، واحصل على نتيجة جاهزة للنسخ. بدون تسجيل وبدون بطاقة بنكية.',
              fr: 'De l’analyse produit à l’audit de campagne : essayez chaque outil gratuitement une fois et obtenez un résultat prêt à copier. Sans inscription ni carte bancaire.',
              en: 'From product checks to campaign audits: try each tool once for free and get a result ready to copy. No sign-up, no card.',
            })}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#ai-tools-grid"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t({ ar: 'اختر أداة وابدأ', fr: 'Choisir un outil', en: 'Choose a tool' })}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </a>
            <a
              href="/#booking"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              {t({ ar: 'اطلب التنفيذ الكامل', fr: 'Demander la version complète', en: 'Request the full service' })}
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" />
              {t({ ar: '12 أداة جاهزة', fr: '12 outils prêts', en: '12 ready tools' })}
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              {t({ ar: 'تجربة مجانية لكل أداة', fr: 'Un essai gratuit par outil', en: 'One free trial per tool' })}
            </span>
            <span className="inline-flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-primary" />
              {t({ ar: 'نتيجة بالعربية أو الفرنسية أو الإنجليزية', fr: 'Résultat en AR, FR ou EN', en: 'Output in AR, FR or EN' })}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              {t({ ar: 'بدون تسجيل', fr: 'Sans inscription', en: 'No sign-up' })}
            </span>
          </div>
        </div>
      </section>

      {/* Tool grid */}
      <div id="ai-tools-grid" className="mx-auto mt-12 max-w-6xl space-y-10 px-4">
        {grouped.map((group) => {
          const Icon = group.icon;
          return (
            <section key={group.id}>
              <div className="mb-5 flex flex-wrap items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold sm:text-2xl">{t(group.label)}</h2>
                  <p className="text-sm text-muted-foreground">{t(group.blurb)}</p>
                </div>
                <span className="ms-auto rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {group.tools.length} {t({ ar: 'أدوات', fr: 'outils', en: 'tools' })}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.tools.map((tool) => {
                  const ToolIcon = tool.icon;
                  const isActive = tool.id === activeId;
                  const isUsed = Boolean(trials[tool.id]);
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => chooseTool(tool)}
                      aria-pressed={isActive}
                      className={`group flex h-full flex-col rounded-2xl border-2 p-5 text-start transition ${
                        isActive
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                          : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                          <ToolIcon className="h-5 w-5" />
                        </span>
                        <span className="flex flex-wrap justify-end gap-1.5">
                          {tool.badge && (
                            <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-[10px] font-bold text-violet-700 dark:text-violet-300">
                              {t(tool.badge)}
                            </span>
                          )}
                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              isUsed
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {isUsed
                              ? t({ ar: 'تمّت التجربة', fr: 'Essai utilisé', en: 'Trial used' })
                              : t({ ar: 'تجربة مجانية', fr: 'Essai gratuit', en: 'Free trial' })}
                          </span>
                        </span>
                      </div>

                      <h3 className="mt-4 text-base font-bold leading-snug">{t(tool.name)}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{t(tool.tagline)}</p>

                      <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 dark:text-sky-300">
                        {isUsed
                          ? t({ ar: 'اعرض النتيجة', fr: 'Voir le résultat', en: 'View result' })
                          : isActive
                            ? t({ ar: 'الأداة مفتوحة', fr: 'Outil ouvert', en: 'Tool open' })
                            : t({ ar: 'ابدأ الآن', fr: 'Commencer', en: 'Start now' })}
                        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 rtl:rotate-180" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Workspace */}
      <div ref={workspaceRef} id="ai-tool-workspace" className="mx-auto mt-14 max-w-6xl scroll-mt-24 px-4">
        {!activeTool ? (
          <div className="rounded-3xl border border-dashed border-border bg-card/60 p-10 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wand2 className="h-7 w-7" />
            </span>
            <h2 className="mt-4 text-xl font-bold">
              {t({ ar: 'اختر أداة من الأعلى', fr: 'Choisissez un outil ci-dessus', en: 'Pick a tool above' })}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {t({
                ar: 'كل أداة تفتح مساحة عمل خاصة بها. املأ التفاصيل، اختر لغة النتيجة، ثم اضغط توليد.',
                fr: 'Chaque outil ouvre son espace de travail. Remplissez les détails, choisissez la langue, puis lancez la génération.',
                en: 'Each tool opens its own workspace. Fill in the details, choose the output language, then generate.',
              })}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-xl shadow-primary/5">
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary to-indigo-800 p-6 text-white sm:p-8">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl"
              />
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                    {ActiveIcon && <ActiveIcon className="h-6 w-6" />}
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black md:text-2xl">{t(activeTool.name)}</h2>
                      {activeTool.badge && (
                        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold ring-1 ring-white/20">
                          {t(activeTool.badge)}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
                          used
                            ? 'bg-amber-400/15 text-amber-200 ring-amber-300/30'
                            : 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30'
                        }`}
                      >
                        {used
                          ? t({ ar: 'التجربة مستهلكة', fr: 'Essai utilisé', en: 'Trial used' })
                          : t({ ar: 'تجربة مجانية', fr: 'Essai gratuit', en: 'Free trial' })}
                      </span>
                    </div>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
                      {t(activeTool.tagline)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <LanguagePicker value={outputLang} onChange={setOutputLang} />
                  <button
                    type="button"
                    onClick={closeTool}
                    aria-label={t({ ar: 'إغلاق الأداة', fr: 'Fermer l’outil', en: 'Close tool' })}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-white/80 ring-1 ring-white/20 transition hover:bg-white/20 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-6 sm:p-8 lg:border-e lg:border-border">
                {used ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                      <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                        <Lock className="h-4 w-4" />
                        {t({
                          ar: 'استعملت التجربة المجانية لهذه الأداة',
                          fr: 'Vous avez utilisé l’essai gratuit de cet outil',
                          en: 'You have used this tool’s free trial',
                        })}
                      </div>
                      <p className="mt-1.5 leading-relaxed text-muted-foreground">
                        {t({
                          ar: 'النتيجة محفوظة في متصفحك. للنسخة الكاملة والمنسقة، اطلبها من فريقنا وسننجزها لك.',
                          fr: 'Votre résultat est conservé dans ce navigateur. Pour la version complète et mise en forme, demandez-la à notre équipe.',
                          en: 'Your result is kept in this browser. For the complete, formatted version, request it from our team.',
                        })}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href="/#booking"
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
                        >
                          {t({ ar: 'اطلب النسخة الكاملة', fr: 'Demander la version complète', en: 'Request the full version' })}
                          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        </a>
                        <a
                          href="/premium-services"
                          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-muted"
                        >
                          {t({ ar: 'الخدمات المميزة', fr: 'Services premium', en: 'Premium services' })}
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      void handleGenerate();
                    }}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold">
                        {t({ ar: 'تفاصيل الطلب', fr: 'Détails de la demande', en: 'Request details' })}
                      </p>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-sky-700 dark:text-sky-300">
                        {t({ ar: 'تجربة واحدة', fr: '1 essai', en: '1 trial' })}
                      </span>
                    </div>

                    {activeTool.needsImage && (
                      <div className="mb-5 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-4">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <ImageUp className="h-4 w-4 text-primary" />
                          {t({ ar: 'صورة الإعلان', fr: 'Image de la publicité', en: 'Ad image' })}
                          <span className="text-destructive">*</span>
                        </div>
                        {images[activeTool.id] ? (
                          <div className="mt-3 flex items-start gap-3">
                            <img
                              src={images[activeTool.id]}
                              alt={t({ ar: 'معاينة الإعلان', fr: 'Aperçu de la publicité', en: 'Ad preview' })}
                              className="h-28 w-28 rounded-xl border border-border object-cover"
                            />
                            <div className="min-w-0">
                              <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t({ ar: 'الصورة جاهزة للتحليل', fr: 'Image prête pour l’analyse', en: 'Image ready for analysis' })}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {t({
                                  ar: 'نضغطها تلقائياً قبل الإرسال حتى يبقى الطلب سريعاً.',
                                  fr: 'Elle est compressée automatiquement avant l’envoi pour garder la requête rapide.',
                                  en: 'It is compressed automatically before sending to keep the request fast.',
                                })}
                              </p>
                              <button
                                type="button"
                                onClick={() => setImage(null)}
                                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-bold transition hover:bg-muted"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                {t({ ar: 'إزالة الصورة', fr: 'Retirer l’image', en: 'Remove image' })}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-6 text-center transition hover:border-primary/40">
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="sr-only"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = '';
                                void pickImage(file);
                              }}
                              disabled={uploading}
                            />
                            {uploading ? (
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            ) : (
                              <ImageUp className="h-6 w-6 text-primary" />
                            )}
                            <span className="text-sm font-bold">
                              {uploading
                                ? t({ ar: 'جارٍ تجهيز الصورة…', fr: 'Préparation de l’image…', en: 'Preparing the image…' })
                                : t({ ar: 'ارفع صورة الإعلان', fr: 'Importer l’image de la pub', en: 'Upload the ad image' })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t({
                                ar: 'PNG أو JPG أو WebP — حتى 15 ميغابايت',
                                fr: 'PNG, JPG ou WebP — jusqu’à 15 Mo',
                                en: 'PNG, JPG or WebP — up to 15 MB',
                              })}
                            </span>
                          </label>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {activeTool.fields.map((field) => {
                        const value = values[activeTool.id]?.[field.key] || '';
                        const wide = Boolean(field.multiline || (field.maxLength && field.maxLength > 500));
                        return (
                          <div key={field.key} className={wide ? 'sm:col-span-2' : ''}>
                            <label className={labelClass} htmlFor={`ai-field-${field.key}`}>
                              {t(field.label)}
                              {field.required && <span className="ms-1 text-destructive">*</span>}
                            </label>
                            {field.multiline ? (
                              <textarea
                                id={`ai-field-${field.key}`}
                                value={value}
                                onChange={(event) => updateField(field.key, event.target.value)}
                                placeholder={t(field.placeholder)}
                                rows={field.rows || 4}
                                maxLength={field.maxLength || 700}
                                className={inputClass}
                              />
                            ) : (
                              <input
                                id={`ai-field-${field.key}`}
                                type="text"
                                value={value}
                                onChange={(event) => updateField(field.key, event.target.value)}
                                placeholder={t(field.placeholder)}
                                maxLength={field.maxLength || 700}
                                className={inputClass}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {error && (
                      <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading || uploading}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {loading
                        ? t({ ar: 'جارٍ التوليد…', fr: 'Génération…', en: 'Generating…' })
                        : t({ ar: 'ولّد النتيجة', fr: 'Générer le résultat', en: 'Generate result' })}
                    </button>

                    <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                      {loading && slow
                        ? t({
                            ar: 'قد يستغرق التوليد حتى 30 ثانية. لا تغلق الصفحة.',
                            fr: 'La génération peut prendre jusqu’à 30 secondes. Ne fermez pas la page.',
                            en: 'Generation can take up to 30 seconds. Do not close the page.',
                          })
                        : t({
                            ar: 'تجربة مجانية واحدة لكل أداة على هذا المتصفح. النتيجة إرشادية — راجعها قبل النشر.',
                            fr: 'Un essai gratuit par outil dans ce navigateur. Le résultat est indicatif — relisez-le avant publication.',
                            en: 'One free trial per tool in this browser. The result is indicative — review it before publishing.',
                          })}
                    </p>
                  </form>
                )}
              </div>

              <div className="border-t border-border p-6 sm:p-8 lg:border-t-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black">{t({ ar: 'النتيجة', fr: 'Résultat', en: 'Result' })}</h3>
                    <p className="text-xs text-muted-foreground">
                      {t({ ar: 'جاهزة للنسخ والتنزيل', fr: 'Prête à copier et télécharger', en: 'Ready to copy and download' })}
                    </p>
                  </div>
                  {result && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void copyResult()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold transition hover:bg-muted"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copied
                          ? t({ ar: 'تم النسخ', fr: 'Copié', en: 'Copied' })
                          : t({ ar: 'نسخ', fr: 'Copier', en: 'Copy' })}
                      </button>
                      <button
                        type="button"
                        onClick={downloadResult}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold transition hover:bg-muted"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {t({ ar: 'تنزيل', fr: 'Télécharger', en: 'Download' })}
                      </button>
                    </div>
                  )}
                </div>

                {result ? (
                  <div className="mt-4">
                    <div className="rounded-2xl border border-border bg-muted/30 p-4">
                      <pre
                        dir={result.language === 'ar' ? 'rtl' : 'ltr'}
                        className="max-h-[560px] overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed"
                      >{isolateLtrRuns(result.text)}</pre>
                    </div>
                    {result.mock && (
                      <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-bold text-amber-700 dark:text-amber-300">
                        {t({
                          ar: 'هذه نسخة تجريبية من الخادم ولم تستهلك تجربتك المجانية.',
                          fr: 'Ceci est un exemple de démonstration du serveur ; votre essai gratuit n’a pas été consommé.',
                          en: 'This is a server demo sample; your free trial was not consumed.',
                        })}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <a
                        href="/#booking"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
                      >
                        {t({ ar: 'أريد النسخة الاحترافية', fr: 'Je veux la version pro', en: 'I want the pro version' })}
                        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                      </a>
                      <a
                        href="#ai-tools-grid"
                        className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-muted"
                      >
                        {t({ ar: 'أداة أخرى', fr: 'Un autre outil', en: 'Another tool' })}
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Wand2 className="h-6 w-6" />
                    </span>
                    <p className="mt-3 text-sm font-bold">
                      {t({ ar: 'نتيجتك ستظهر هنا', fr: 'Votre résultat apparaîtra ici', en: 'Your result will appear here' })}
                    </p>
                    <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                      {t({
                        ar: 'املأ التفاصيل على اليسار ثم اضغط «ولّد النتيجة». يمكنك نسخها أو تنزيلها مباشرة.',
                        fr: 'Remplissez les détails à gauche puis cliquez sur « Générer ». Vous pourrez la copier ou la télécharger.',
                        en: 'Fill in the details on the left, then press Generate. You can copy or download the result.',
                      })}
                    </p>
                  </div>
                )}

                {used && !result && (
                  <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">
                    {t({
                      ar: 'النتيجة السابقة غير محفوظة على هذا المتصفح. اطلب النسخة الكاملة من فريقنا.',
                      fr: 'Le résultat précédent n’est pas conservé sur ce navigateur. Demandez la version complète à notre équipe.',
                      en: 'The previous result is not saved in this browser. Request the full version from our team.',
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Closing CTA */}
      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-8 text-center sm:p-10">
          <h2 className="text-2xl font-bold sm:text-3xl">
            {t({ ar: 'تحتاج النتيجة منفذة بالكامل؟', fr: 'Besoin du résultat entièrement réalisé ?', en: 'Need the result fully done for you?' })}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t({
              ar: 'أرسل لنا المنتج أو الحملة، ونعيدها لك جاهزة: نصوص، تصميم، صفحة منتج، أو خطة تنفيذ كاملة. الأسعار واضحة قبل البدء.',
              fr: 'Envoyez-nous le produit ou la campagne : nous livrons les textes, le design, la page produit ou le plan complet. Tarifs clairs avant de commencer.',
              en: 'Send us the product or campaign and we deliver the copy, design, product page or full plan. Clear pricing before we start.',
            })}
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/#booking"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t({ ar: 'اطلب عرضاً', fr: 'Demander un devis', en: 'Request a quote' })}
            </a>
            <a
              href="/premium-services"
              className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
            >
              {t({ ar: 'الخدمات المميزة', fr: 'Services premium', en: 'Premium services' })}
            </a>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            {t({
              ar: 'نتائج الأدوات إرشادية وتحتاج مراجعة قبل النشر. لا نشارك مدخلاتك مع أي طرف.',
              fr: 'Les résultats sont indicatifs et à relire avant publication. Vos saisies ne sont partagées avec aucun tiers.',
              en: 'Tool results are indicative and need a review before publishing. Your input is not shared with any third party.',
            })}
          </p>
        </div>
      </section>
    </div>
  );
}

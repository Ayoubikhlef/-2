import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calculator,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Download,
  Eye,
  FileText,
  Globe2,
  ImageUp,
  Loader2,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './LoginPage';
import {
  AI_TOOL_STAGES,
  aiSellerTools,
  type AiSellerTool,
} from '../data/aiTools';
import { api, type AiStudioLanguage, type AiTool } from '../utils/api';
import {
  buildFallbackLandingHtml,
  buildLandingPageHtml,
  parseLandingPage,
} from '../utils/landingPage';
import {
  LANDING_THEMES,
  isLandingTheme,
  resolveLandingTheme,
  type LandingThemeChoice,
} from '../utils/landingThemes';

type LandingMeta = {
  productName: string;
  price: string;
  contact: string;
  theme?: LandingThemeChoice;
};

type TrialRecord = {
  at: number;
  result: string;
  language: AiStudioLanguage;
  mock?: boolean;
  meta?: LandingMeta;
};

type TrialMap = Record<string, TrialRecord>;

const TRIAL_KEY = 'aos_ai_tools_trials_v1';
const MAX_SAVED_RESULT = 12000;
const TOOL_COUNT = aiSellerTools.length;

function readLandingMeta(value: unknown): LandingMeta | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const record = value as Record<string, unknown>;
  const productName = typeof record.productName === 'string' ? record.productName.slice(0, 140) : '';
  const price = typeof record.price === 'string' ? record.price.slice(0, 60) : '';
  const contact = typeof record.contact === 'string' ? record.contact.slice(0, 160) : '';
  const theme = isLandingTheme(record.theme) ? record.theme : undefined;
  if (!productName && !price && !contact && !theme) return undefined;
  return { productName, price, contact, theme };
}

function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

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
        meta: readLandingMeta(value.meta),
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
  const extension = (file.name.split('.').pop() || '').toLowerCase();
  const standard =
    /^image\/(png|jpe?g|webp)$/i.test(file.type) ||
    (!file.type && ['jpg', 'jpeg', 'png', 'webp'].includes(extension));
  const heic =
    /^image\/(heic|heif)$/i.test(file.type) || ['heic', 'heif'].includes(extension);
  // iPhones often hand over HEIC files. Safari can decode them, so try before
  // failing; other browsers get a clear message telling them to save as JPG.
  if (!standard && !heic) throw new Error('type');
  if (!file.size) throw new Error('empty');
  if (file.size > 15 * 1024 * 1024) throw new Error('size');

  type DecodedImage = {
    width: number;
    height: number;
    draw: (context: CanvasRenderingContext2D, width: number, height: number) => void;
  };
  let decoded: DecodedImage | null = null;

  // createImageBitmap decodes the File directly, so iOS Safari never has to
  // load a multi-megabyte data: URL into an <img> (which can fail silently).
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      decoded = {
        width: bitmap.width,
        height: bitmap.height,
        draw: (context, width, height) => context.drawImage(bitmap, 0, 0, width, height),
      };
    } catch {
      // Older browsers / unsupported formats use the FileReader fallback.
    }
  }

  if (!decoded) {
    const source = await readAsDataUrl(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error(heic ? 'heic' : 'read'));
      element.src = source;
    });
    decoded = {
      width: image.width,
      height: image.height,
      draw: (context, width, height) => context.drawImage(image, 0, 0, width, height),
    };
  }

  const render = (maxSide: number) => {
    const scale = Math.min(1, maxSide / Math.max(decoded.width, decoded.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(decoded.width * scale));
    canvas.height = Math.max(1, Math.round(decoded.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas');
    // JPEG has no transparency; white avoids a black background on PNGs.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    decoded.draw(context, canvas.width, canvas.height);
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
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold uppercase transition ${
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
    meta?: LandingMeta;
  } | null>(null);
  const [resultView, setResultView] = useState<'preview' | 'text'>('preview');
  const [landingTheme, setLandingTheme] = useState<LandingThemeChoice>('aos');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [slow, setSlow] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const [trials, setTrials] = useState<TrialMap>(() => readTrials());
  const [account, setAccount] = useState<{
    subscribed: boolean;
    remaining: number | null;
    used: number;
    limit: number;
  } | null>(null);
  const [accountLoading, setAccountLoading] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [serverLocked, setServerLocked] = useState(false);
  const [lastPreview, setLastPreview] = useState(false);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLIFrameElement | null>(null);

  const activeTool = useMemo(
    () => aiSellerTools.find((tool) => tool.id === activeId) || null,
    [activeId],
  );
  const ActiveIcon = activeTool?.icon;
  const used = activeId ? trials[activeId] : undefined;

  const landingContent = useMemo(
    () => (result?.tool === 'landing-page' ? parseLandingPage(result.text) : null),
    [result],
  );

  const landingHtml = useMemo(() => {
    if (!result || result.tool !== 'landing-page') return '';
    const options = {
      image: images[result.tool],
      language: result.language,
      productName: result.meta?.productName || '',
      price: result.meta?.price || '',
      contact: result.meta?.contact || '',
      theme: landingTheme,
    };
    return landingContent
      ? buildLandingPageHtml(landingContent, options)
      : buildFallbackLandingHtml(result.text, options);
  }, [result, landingContent, images, landingTheme]);

  const previewKey = useMemo(() => hashText(landingHtml), [landingHtml]);

  useEffect(() => {
    const frame = previewRef.current;
    if (!frame || !landingHtml) return;
    const post = () => {
      frame.contentWindow?.postMessage(
        { type: 'aos-landing-preview', html: landingHtml },
        '*',
      );
    };
    post();
    frame.addEventListener('load', post);
    return () => frame.removeEventListener('load', post);
  }, [landingHtml, previewKey]);

  const refreshEntitlement = useCallback(async () => {
    if (!user) {
      setAccount(null);
      setServerLocked(false);
      setAccountLoading(false);
      return;
    }
    setAccountLoading(true);
    try {
      const data = await api.subscription.me();
      setAccount({
        subscribed: Boolean(data.subscription?.active),
        remaining: data.previews.remaining,
        used: data.previews.used,
        limit: data.previews.limit,
      });
      if (data.subscription?.active) setServerLocked(false);
    } catch {
      // Keep the last known entitlement; the server still enforces the limit.
    } finally {
      setAccountLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refreshEntitlement();
  }, [refreshEntitlement]);

  const accessMode = !user
    ? 'guest'
    : account?.subscribed
      ? 'subscribed'
      : account
        ? account.remaining !== null && account.remaining > 0
          ? 'preview'
          : 'locked'
        : accountLoading
          ? 'loading'
          : 'preview';
  const blockedByServer = Boolean(user && (serverLocked || accessMode === 'locked'));
  const subscribed = Boolean(account?.subscribed);
  const showGuestPaywall = Boolean(used && !user);
  const showMemberPaywall = Boolean(user && blockedByServer);
  const showForm = !showGuestPaywall && !showMemberPaywall;

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
        ar: `${TOOL_COUNT} أداة ذكاء اصطناعي مجانية لأصحاب المتاجر: فاحص المنتج، صانع العروض، تحليل المنافس، الإعلانات، صفحة المنتج، صفحة الهبوط، سيناريو الفيديو، تحليل الحملات والمزيد.`,
        fr: `${TOOL_COUNT} outils IA pour les e-commerçants : analyse produit, offres, concurrents, publicités, page produit, page de vente, script vidéo et audit de campagne.`,
        en: `${TOOL_COUNT} AI tools for online sellers: product checks, offers, competitor analysis, ads, product pages, landing pages, video scripts and campaign audits.`,
      }),
    );
    return () => meta.setAttribute('content', previous);
  }, [language]);

  const chooseTool = (tool: AiSellerTool) => {
    setActiveId(tool.id);
    setError(null);
    setImageError(null);
    setCopied(false);
    const record = trials[tool.id];
    setResult(
      record
        ? {
            tool: tool.id,
            text: record.result,
            language: record.language,
            mock: record.mock,
            meta: record.meta,
          }
        : null,
    );
    setResultView('preview');
    if (tool.id === 'landing-page') {
      setLandingTheme(record?.meta?.theme || 'aos');
    }
    window.setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const closeTool = () => {
    setActiveId(null);
    setResult(null);
    setError(null);
    setImageError(null);
    setCopied(false);
    setResultView('preview');
  };

  const selectLandingTheme = (theme: LandingThemeChoice) => {
    setLandingTheme(theme);
    setResult((previous) =>
      previous?.tool === 'landing-page'
        ? {
            ...previous,
            meta: {
              productName: previous.meta?.productName || '',
              price: previous.meta?.price || '',
              contact: previous.meta?.contact || '',
              theme,
            },
          }
        : previous,
    );
    setTrials((previous) => {
      const record = previous['landing-page'];
      if (!record) return previous;
      const next = {
        ...previous,
        'landing-page': {
          ...record,
          meta: {
            productName: record.meta?.productName || '',
            price: record.meta?.price || '',
            contact: record.meta?.contact || '',
            theme,
          },
        },
      };
      persistTrials(next);
      return next;
    });
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
      else {
        delete next[activeTool.id];
        setImageError(null);
      }
      return next;
    });
  };

  const imageErrorMessage = (reason: string | undefined): string => {
    switch (reason) {
      case 'size':
        return t({
          ar: 'الصورة كبيرة جداً. اختر صورة أقل من 15 ميغابايت.',
          fr: 'Image trop lourde. Choisissez une image de moins de 15 Mo.',
          en: 'Image too large. Choose a file under 15 MB.',
        });
      case 'heic':
        return t({
          ar: 'الصورة بصيغة iPhone HEIC. افتحها في المعرض واختر «حفظ كـ JPG» ثم أعد رفعها.',
          fr: 'Image HEIC d’iPhone. Ouvrez-la dans Photos, choisissez «Enregistrer en JPG», puis réessayez.',
          en: 'This is an iPhone HEIC photo. Open it in Photos, save it as JPG, then upload it again.',
        });
      case 'type':
        return t({
          ar: 'صيغة الصورة غير مدعومة. استخدم JPG أو PNG أو WebP.',
          fr: 'Format non pris en charge. Utilisez JPG, PNG ou WebP.',
          en: 'Unsupported image format. Use JPG, PNG or WebP.',
        });
      case 'empty':
        return t({
          ar: 'الملف فارغ. اختر صورة أخرى.',
          fr: 'Le fichier est vide. Choisissez une autre image.',
          en: 'The file is empty. Choose another image.',
        });
      case 'large':
        return t({
          ar: 'تعذّر تصغير الصورة بما يكفي. اختر صورة أصغر أو أقل تفاصيل.',
          fr: 'Impossible de réduire assez l’image. Choisissez une photo plus petite.',
          en: 'Could not compress the image enough. Choose a smaller photo.',
        });
      default:
        return t({
          ar: 'تعذّر قراءة الصورة. جرّب JPG أو PNG أو WebP.',
          fr: 'Impossible de lire l’image. Essayez JPG, PNG ou WebP.',
          en: 'Could not read the image. Try JPG, PNG or WebP.',
        });
    }
  };

  const pickImage = async (file: File | undefined) => {
    if (!file || !activeTool) return;
    setUploading(true);
    setImageError(null);
    try {
      const data = await compressImage(file);
      setImage(data);
      toast.success(t({ ar: 'تم تجهيز الصورة', fr: 'Image prête', en: 'Image ready' }));
    } catch (err: any) {
      const message = imageErrorMessage(err?.message);
      setImageError(message);
      toast.error(message);
      // On a phone the message can land below the fold; bring it into view.
      window.setTimeout(() => {
        document
          .getElementById('ai-image-error')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
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
    if (code === 'ai_login_required' || err?.status === 403) {
      return t({
        ar: 'انتهت التجربة المجانية لهذه الأداة. سجّل الدخول لتحصل على معاينة إضافية مجانية واحدة.',
        fr: 'L’essai gratuit de cet outil est terminé. Connectez-vous pour une preview gratuite supplémentaire.',
        en: 'The free trial for this tool is over. Sign in for one extra free preview.',
      });
    }
    if (code === 'subscription_required' || err?.status === 402) {
      return t({
        ar: 'انتهت معاينتك المجانية. اختر خطة اشتراك لمتابعة استخدام الأدوات.',
        fr: 'Votre preview gratuite est utilisée. Choisissez une formule pour continuer.',
        en: 'Your free preview is used. Choose a subscription plan to continue.',
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
    if (showGuestPaywall) {
      setAuthOpen(true);
      return;
    }
    if (showMemberPaywall) {
      setError(
        t({
          ar: 'انتهت معاينتك المجانية. اشترك لمتابعة استخدام الأدوات.',
          fr: 'Votre preview gratuite est utilisée. Abonnez-vous pour continuer.',
          en: 'Your free preview is used. Subscribe to keep using the tools.',
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
          ar:
            activeTool.id === 'landing-page'
              ? 'ارفع صورة المنتج أولاً لأنها تظهر داخل صفحة الهبوط.'
              : 'ارفع صورة الإعلان أولاً.',
          fr:
            activeTool.id === 'landing-page'
              ? 'Importez d’abord la photo du produit : elle apparaîtra sur la page de vente.'
              : 'Importez d’abord l’image de la publicité.',
          en:
            activeTool.id === 'landing-page'
              ? 'Upload the product photo first; it will appear on the landing page.'
              : 'Upload the ad image first.',
        }),
      );
      return;
    }

    setLoading(true);
    setSlow(false);
    setError(null);
    setResult(null);
    setCopied(false);
    setLastPreview(false);
    setResultView('preview');
    const slowTimer = window.setTimeout(() => setSlow(true), 8000);

    try {
      const isLandingPage = activeTool.id === 'landing-page';
      const selectedValues = values[activeTool.id] || {};
      const resolvedTheme = isLandingPage
        ? resolveLandingTheme(
            landingTheme,
            `${selectedValues.productName || ''}|${selectedValues.details || ''}`,
          )
        : undefined;
      const landingMeta: LandingMeta | undefined = isLandingPage
        ? {
            productName: (selectedValues.productName || '').trim().slice(0, 140),
            price: (selectedValues.price || '').trim().slice(0, 60),
            contact: (selectedValues.contact || '').trim().slice(0, 160),
            theme: resolvedTheme,
          }
        : undefined;
      if (resolvedTheme) setLandingTheme(resolvedTheme);
      // The landing page keeps the photo in the browser: the AI only writes the
      // copy, and the photo is embedded directly in the generated HTML. Other
      // image tools send it because the model must actually see the picture.
      const sendImage = activeTool.needsImage && !isLandingPage;

      const data = await api.ai.generate({
        tool: activeTool.id,
        language: outputLang,
        fields: selectedValues,
        ...(sendImage ? { image: images[activeTool.id] } : {}),
      });
      setResult({
        tool: activeTool.id,
        text: data.text,
        language: outputLang,
        mock: Boolean(data.mock),
        meta: landingMeta,
      });

      // A demo answer must not consume the real free trial.
      if (!data.mock) {
        const record: TrialRecord = {
          at: Date.now(),
          result: data.text.slice(0, MAX_SAVED_RESULT),
          language: outputLang,
          meta: landingMeta,
        };
        setTrials((previous) => {
          const next = { ...previous, [activeTool.id]: record };
          persistTrials(next);
          return next;
        });
        if (user) {
          // The account has one server-counted preview. When it reaches zero,
          // keep the result visible but show the subscription CTA below it.
          const exhausted = data.previewRemaining === 0 && !data.subscribed;
          setAccount((previous) => ({
            subscribed: Boolean(data.subscribed),
            remaining: typeof data.previewRemaining === 'number' ? data.previewRemaining : previous?.remaining ?? null,
            used: previous?.used ?? 0,
            limit: previous?.limit ?? 1,
          }));
          setLastPreview(exhausted);
          void refreshEntitlement();
        }
      }
      toast.success(t({ ar: 'النتيجة جاهزة', fr: 'Résultat prêt', en: 'Result ready' }));
    } catch (err: any) {
      if (err?.code === 'ai_login_required') {
        setAuthOpen(true);
      }
      if (err?.code === 'subscription_required') {
        setServerLocked(true);
        setAccount((previous) => ({
          subscribed: false,
          remaining: 0,
          used: previous?.used ?? 1,
          limit: previous?.limit ?? 1,
        }));
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

  const saveDataUrl = (href: string, filename: string) => {
    const link = document.createElement('a');
    link.href = href;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadResult = () => {
    if (!result || typeof window === 'undefined') return;
    if (result.tool === 'landing-page' && landingHtml) {
      const base =
        (result.meta?.productName || 'landing-page')
          .normalize('NFKD')
          .replace(/[^\p{L}\p{N}]+/gu, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 60) || 'landing-page';
      // A data: URL keeps the download working under the strict site CSP. The
      // product photo is embedded, so the exported file is fully self-contained.
      saveDataUrl(`data:text/html;charset=utf-8,${encodeURIComponent(landingHtml)}`, `${base}.html`);
      toast.success(t({ ar: 'تم تنزيل صفحة HTML', fr: 'Page HTML téléchargée', en: 'HTML page downloaded' }));
      return;
    }
    saveDataUrl(
      `data:text/plain;charset=utf-8,${encodeURIComponent(result.text)}`,
      `${result.tool}.txt`,
    );
  };

  const downloadText = () => {
    if (!result || typeof window === 'undefined') return;
    saveDataUrl(
      `data:text/plain;charset=utf-8,${encodeURIComponent(result.text)}`,
      `${result.tool}.txt`,
    );
  };

  const inputClass =
    'w-full rounded-xl border-2 border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60';
  const labelClass = 'mb-1.5 block text-xs font-bold sm:text-sm';

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-background px-4 pb-14 pt-16">
        <div className="mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-normal text-sky-700 dark:text-sky-300">
            <Sparkles className="h-3.5 w-3.5" />
            {t({ ar: 'أدوات الذكاء الاصطناعي', fr: 'Outils d’IA', en: 'AI tools' })}
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl md:text-5xl">
            {t({
              ar: `${TOOL_COUNT} أداة ذكاء اصطناعي لمتجرك`,
              fr: `${TOOL_COUNT} outils IA pour votre boutique`,
              en: `${TOOL_COUNT} AI tools for your store`,
            })}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t({
              ar: 'من فحص المنتج إلى تحليل الحملة: جرّب كل أداة مرة مجاناً، ثم سجّل الدخول لتحصل على معاينة إضافية واحدة قبل الاشتراك. بدون بطاقة بنكية.',
              fr: 'De l’analyse produit à l’audit de campagne : essayez chaque outil gratuitement une fois, puis connectez-vous pour une preview supplémentaire avant l’abonnement. Sans carte bancaire.',
              en: 'From product checks to campaign audits: try each tool once for free, then sign in for one extra preview before subscribing. No card required.',
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
              {t({ ar: `${TOOL_COUNT} أداة جاهزة`, fr: `${TOOL_COUNT} outils prêts`, en: `${TOOL_COUNT} ready tools` })}
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
              {t({ ar: 'معاينة إضافية مجانية بعد التسجيل', fr: 'Une preview offerte après inscription', en: 'One extra preview after signing in' })}
            </span>
          </div>
        </div>
      </section>

      {/* Profit calculator banner */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <a
          href="/ai-tools/calculator"
          className="group flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 transition hover:border-emerald-500/45 hover:shadow-sm"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <Calculator className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold sm:text-lg">
              {t({
                ar: 'حاسبة الأرباح: اعرف ربحك وسقف إعلانك قبل أن تبيع',
                fr: 'Calculateur : connaissez votre bénéfice et votre plafond pub avant de vendre',
                en: 'Calculator: know your profit and ad ceiling before you sell',
              })}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t({
                ar: '5 حاسبات مجانية: الربح الصافي، تسعير المنتج، تكلفة الطلبية، سقف الإعلان، وهدف الشهر.',
                fr: '5 calculateurs gratuits : bénéfice net, prix, coût par commande, plafond pub et objectif du mois.',
                en: '5 free calculators: net profit, pricing, order cost, ad ceiling and monthly goal.',
              })}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition group-hover:bg-emerald-700">
            {t({ ar: 'افتح الحاسبة', fr: 'Ouvrir le calculateur', en: 'Open the calculator' })}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </span>
        </a>
      </section>

      {/* Subscription banner */}
      <section className="mx-auto mt-4 max-w-6xl px-4">
        <a
          href="/subscription"
          className="group flex flex-wrap items-center gap-4 rounded-2xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-card to-card p-5 transition hover:border-indigo-500/45 hover:shadow-sm"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-300">
            <Crown className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold sm:text-lg">
              {subscribed
                ? t({
                    ar: 'اشتراكك نشط — كل الأدوات مفتوحة',
                    fr: 'Abonnement actif — tous les outils sont ouverts',
                    en: 'Subscription active — every tool is unlocked',
                  })
                : t({
                    ar: 'بعد التجربة: اشتراك واحد يفتح كل الأدوات',
                    fr: 'Après l’essai : un abonnement ouvre tous les outils',
                    en: 'After the trial: one subscription unlocks every tool',
                  })}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {subscribed
                ? t({
                    ar: `استخدم ${TOOL_COUNT} أداة بدون حدود ضمن الاستخدام العادل. تابع الاشتراك أو اطبعه من صفحة الاشتراك.`,
                    fr: `Utilisez les ${TOOL_COUNT} outils sans limite dans le cadre d’un usage raisonnable. Gérez votre abonnement depuis sa page.`,
                    en: `Use all ${TOOL_COUNT} tools without limits under fair use. Manage your subscription from its page.`,
                  })
                : t({
                    ar: 'معاينة إضافية مجانية بعد تسجيل الدخول، ثم 1 900 دج/شهر أو 4 900 دج/3 أشهر أو 17 900 دج/سنة.',
                    fr: 'Une preview offerte après connexion, puis 1 900 DZD/mois, 4 900 DZD/3 mois ou 17 900 DZD/an.',
                    en: 'One extra preview after signing in, then 1 900 DZD/month, 4 900 DZD/3 months or 17 900 DZD/year.',
                  })}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition group-hover:bg-indigo-700">
            {subscribed
              ? t({ ar: 'إدارة الاشتراك', fr: 'Gérer l’abonnement', en: 'Manage subscription' })
              : t({ ar: 'خطط الاشتراك', fr: 'Voir les formules', en: 'View plans' })}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </span>
        </a>
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
                          ? 'border-primary bg-primary/5 shadow-sm'
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
                              subscribed
                                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                                : isUsed
                                  ? 'bg-muted text-muted-foreground'
                                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            {subscribed
                              ? t({ ar: 'مشترك', fr: 'Abonné', en: 'Subscribed' })
                              : isUsed
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
          <div className="overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-sm">
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
                      <h2 className="text-xl font-semibold md:text-2xl">{t(activeTool.name)}</h2>
                      {activeTool.badge && (
                        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold ring-1 ring-white/20">
                          {t(activeTool.badge)}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
                          accessMode === 'subscribed'
                            ? 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30'
                            : used
                              ? 'bg-amber-400/15 text-amber-200 ring-amber-300/30'
                              : 'bg-emerald-400/15 text-emerald-200 ring-emerald-300/30'
                        }`}
                      >
                        {accessMode === 'subscribed'
                          ? t({ ar: 'اشتراك نشط', fr: 'Abonnement actif', en: 'Subscribed' })
                          : used
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
                {showGuestPaywall ? (
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
                          ar: 'سجّل الدخول بالبريد لتحصل على معاينة إضافية مجانية واحدة. بعدها يلزم الاشتراك لمتابعة استخدام الأدوات.',
                          fr: 'Connectez-vous par e-mail pour recevoir une preview gratuite supplémentaire. Ensuite, un abonnement est nécessaire.',
                          en: 'Sign in with your email to get one extra free preview. After that, a subscription is required.',
                        })}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setAuthOpen(true)}
                          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
                        >
                          <LogIn className="h-3.5 w-3.5" />
                          {t({ ar: 'تسجيل الدخول / إنشاء حساب', fr: 'Connexion / créer un compte', en: 'Sign in / create account' })}
                        </button>
                        <a
                          href="/subscription"
                          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-muted"
                        >
                          <Crown className="h-3.5 w-3.5" />
                          {t({ ar: 'خطط الاشتراك', fr: 'Voir les abonnements', en: 'View plans' })}
                        </a>
                      </div>
                    </div>
                    <p className="rounded-xl border border-border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                      {t({
                        ar: 'النتيجة السابقة محفوظة في متصفحك. سجّل الدخول لتُربط نتائجك بحسابك وتُفتح لك معاينة إضافية.',
                        fr: 'Votre résultat précédent reste dans ce navigateur. Connectez-vous pour le rattacher à votre compte et débloquer une preview.',
                        en: 'Your previous result stays in this browser. Sign in to attach results to your account and unlock one extra preview.',
                      })}
                    </p>
                  </div>
                ) : showMemberPaywall ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm">
                      <div className="flex items-center gap-2 font-bold text-indigo-700 dark:text-indigo-300">
                        <Crown className="h-4 w-4" />
                        {t({
                          ar: 'انتهت معاينتك المجانية',
                          fr: 'Votre preview gratuite est utilisée',
                          en: 'Your free preview is used',
                        })}
                      </div>
                      <p className="mt-1.5 leading-relaxed text-muted-foreground">
                        {t({
                          ar: `اشترك لمتابعة استخدام ${TOOL_COUNT} أداة بدون حدود: 1 900 دج شهرياً، 4 900 دج لـ3 أشهر، أو 17 900 دج سنوياً. اشتراكك يفتح كل الأدوات ويحفظ نتائج الحاسبة في حسابك.`,
                          fr: `Abonnez-vous pour continuer avec les ${TOOL_COUNT} outils sans limite : 1 900 DZD/mois, 4 900 DZD/3 mois ou 17 900 DZD/an. L’abonnement ouvre tous les outils et garde vos calculs.`,
                          en: `Subscribe to keep using all ${TOOL_COUNT} tools without limit: 1 900 DZD/month, 4 900 DZD/3 months or 17 900 DZD/year. The subscription unlocks every tool and keeps your calculations.`,
                        })}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href="/subscription"
                          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                        >
                          <Crown className="h-3.5 w-3.5" />
                          {t({ ar: 'اختر خطة واشترك', fr: 'Choisir une formule', en: 'Choose a plan' })}
                          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        </a>
                        <a
                          href="/ai-tools/calculator"
                          className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs font-bold transition hover:bg-muted"
                        >
                          <Calculator className="h-3.5 w-3.5" />
                          {t({ ar: 'الحاسبة مجانية دائماً', fr: 'Calculateur toujours gratuit', en: 'Calculator stays free' })}
                        </a>
                      </div>
                    </div>
                    <p className="rounded-xl border border-border bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
                      {t({
                        ar: 'نتيجتك المحفوظة تظهر على اليمين. عند الاشتراك تستعيد كل الأدوات فوراً بعد تأكيد الدفع.',
                        fr: 'Votre résultat enregistré reste à droite. Après paiement, tous les outils se débloquent immédiatement.',
                        en: 'Your saved result stays on the right. Once the payment is confirmed, every tool unlocks immediately.',
                      })}
                    </p>
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
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                          accessMode === 'subscribed'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : used
                              ? 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                              : 'bg-primary/10 text-sky-700 dark:text-sky-300'
                        }`}
                      >
                        {accessMode === 'subscribed'
                          ? t({ ar: 'اشتراكك نشط — بلا حدود', fr: 'Abonnement actif — illimité', en: 'Subscription active — unlimited' })
                          : used
                            ? t({ ar: 'معاينة إضافية واحدة', fr: '1 preview supplémentaire', en: '1 extra preview' })
                            : t({ ar: 'تجربة واحدة', fr: '1 essai', en: '1 trial' })}
                      </span>
                    </div>

                    {used && accessMode === 'preview' && (
                      <div className="mb-4 flex items-start gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-3 text-[11px] leading-relaxed text-indigo-800 dark:text-indigo-200">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>
                          {t({
                            ar: 'هذه معاينتك الإضافية الوحيدة بعد التجربة. بعدها تحتاج اشتراكاً لمتابعة التوليد.',
                            fr: 'Ceci est votre unique preview supplémentaire après l’essai. Ensuite, un abonnement sera nécessaire.',
                            en: 'This is your only extra preview after the trial. After it, a subscription is required.',
                          })}
                        </span>
                      </div>
                    )}

                    {activeTool.needsImage && (
                      <div className="mb-5 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-4">
                        <div className="flex items-center gap-2 text-sm font-bold">
                          <ImageUp className="h-4 w-4 text-primary" />
                          {t({
                            ar: activeTool.id === 'landing-page' ? 'صورة المنتج' : 'صورة الإعلان',
                            fr: activeTool.id === 'landing-page' ? 'Photo du produit' : 'Image de la publicité',
                            en: activeTool.id === 'landing-page' ? 'Product photo' : 'Ad image',
                          })}
                          <span className="text-destructive">*</span>
                        </div>
                        {images[activeTool.id] ? (
                          <div className="mt-3 flex items-start gap-3">
                            <img
                              src={images[activeTool.id]}
                              alt={t({
                                ar: activeTool.id === 'landing-page' ? 'معاينة صورة المنتج' : 'معاينة الإعلان',
                                fr: activeTool.id === 'landing-page' ? 'Aperçu de la photo produit' : 'Aperçu de la publicité',
                                en: activeTool.id === 'landing-page' ? 'Product photo preview' : 'Ad preview',
                              })}
                              className="h-28 w-28 rounded-xl border border-border object-cover"
                            />
                            <div className="min-w-0">
                              <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                {t({
                                  ar:
                                    activeTool.id === 'landing-page'
                                      ? 'الصورة جاهزة وستظهر في الصفحة'
                                      : 'الصورة جاهزة للتحليل',
                                  fr:
                                    activeTool.id === 'landing-page'
                                      ? 'La photo est prête et apparaîtra sur la page'
                                      : 'Image prête pour l’analyse',
                                  en:
                                    activeTool.id === 'landing-page'
                                      ? 'The photo is ready and will appear on the page'
                                      : 'Image ready for analysis',
                                })}
                              </p>
                              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                                {t({
                                  ar:
                                    activeTool.id === 'landing-page'
                                      ? 'نضغطها تلقائياً وتبقى داخل صفحتك؛ لا تُرسل إلى مزوّد الذكاء الاصطناعي.'
                                      : 'نضغطها تلقائياً قبل الإرسال حتى يبقى الطلب سريعاً.',
                                  fr:
                                    activeTool.id === 'landing-page'
                                      ? 'Elle est compressée et reste dans votre page ; elle n’est pas envoyée au fournisseur IA.'
                                      : 'Elle est compressée automatiquement avant l’envoi pour garder la requête rapide.',
                                  en:
                                    activeTool.id === 'landing-page'
                                      ? 'It is compressed and stays inside your page; it is not sent to the AI provider.'
                                      : 'It is compressed automatically before sending to keep the request fast.',
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
                                : t({
                                    ar: activeTool.id === 'landing-page' ? 'ارفع صورة المنتج' : 'ارفع صورة الإعلان',
                                    fr: activeTool.id === 'landing-page' ? 'Importer la photo du produit' : 'Importer l’image de la pub',
                                    en: activeTool.id === 'landing-page' ? 'Upload the product photo' : 'Upload the ad image',
                                  })}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {t({
                                ar:
                                  activeTool.id === 'landing-page'
                                    ? 'صورة واضحة للمنتج — PNG أو JPG أو WebP حتى 15 ميغابايت'
                                    : 'PNG أو JPG أو WebP — حتى 15 ميغابايت',
                                fr:
                                  activeTool.id === 'landing-page'
                                    ? 'Une photo nette du produit — PNG, JPG ou WebP jusqu’à 15 Mo'
                                    : 'PNG, JPG ou WebP — jusqu’à 15 Mo',
                                en:
                                  activeTool.id === 'landing-page'
                                    ? 'A clear product photo — PNG, JPG or WebP up to 15 MB'
                                    : 'PNG, JPG or WebP — up to 15 MB',
                              })}
                            </span>
                          </label>
                        )}
                        {imageError && (
                          <p
                            id="ai-image-error"
                            role="alert"
                            className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs font-bold leading-relaxed text-destructive"
                          >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{imageError}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {activeTool.id === 'landing-page' && (
                      <div className="mb-5">
                        <p className={labelClass}>
                          {t({
                            ar: 'شكل الصفحة',
                            fr: 'Style de la page',
                            en: 'Page style',
                          })}
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {LANDING_THEMES.map((theme) => {
                            const selected = landingTheme === theme.id;
                            return (
                              <button
                                key={theme.id}
                                type="button"
                                aria-pressed={selected}
                                onClick={() => selectLandingTheme(theme.id)}
                                className={`rounded-xl border p-3 text-start transition ${
                                  selected
                                    ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                                    : 'border-border bg-background/50 hover:border-primary/40'
                                }`}
                              >
                                <span className="flex items-center gap-2 text-xs font-bold">
                                  <span
                                    className="h-3 w-3 shrink-0 rounded-full"
                                    style={{ background: theme.tone }}
                                    aria-hidden="true"
                                  />
                                  {t(theme.name)}
                                </span>
                                <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">
                                  {t(theme.hint)}
                                </span>
                              </button>
                            );
                          })}
                        </div>
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
                        : t(
                            accessMode === 'subscribed'
                              ? {
                                  ar: 'اشتراكك نشط: ولّد ما تحتاجه ضمن الاستخدام العادل. النتيجة إرشادية — راجعها قبل النشر.',
                                  fr: 'Abonnement actif : générez selon l’usage raisonnable. Le résultat est indicatif — relisez-le avant publication.',
                                  en: 'Subscription active: generate within fair use. The result is indicative — review it before publishing.',
                                }
                              : user
                                ? {
                                    ar: 'معاينتك الإضافية محسوبة على الخادم. النتيجة إرشادية — راجعها قبل النشر.',
                                    fr: 'Votre preview supplémentaire est comptée sur le serveur. Le résultat est indicatif — relisez-le avant publication.',
                                    en: 'Your extra preview is counted on the server. The result is indicative — review it before publishing.',
                                  }
                                : {
                                    ar: 'تجربة مجانية واحدة لكل أداة. بعدها سجّل الدخول لمعاينة إضافية واحدة. النتيجة إرشادية — راجعها قبل النشر.',
                                    fr: 'Un essai gratuit par outil. Ensuite, connectez-vous pour une preview supplémentaire. Le résultat est indicatif — relisez-le avant publication.',
                                    en: 'One free trial per tool. Then sign in for one extra preview. The result is indicative — review it before publishing.',
                                  },
                          )}
                    </p>
                  </form>
                )}
              </div>

              <div className="border-t border-border p-6 sm:p-8 lg:border-t-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{t({ ar: 'النتيجة', fr: 'Résultat', en: 'Result' })}</h3>
                    <p className="text-xs text-muted-foreground">
                      {result?.tool === 'landing-page'
                        ? t({
                            ar: 'معاينة حية وملف HTML جاهز',
                            fr: 'Aperçu en direct et fichier HTML prêt',
                            en: 'Live preview and a ready HTML file',
                          })
                        : t({ ar: 'جاهزة للنسخ والتنزيل', fr: 'Prête à copier et télécharger', en: 'Ready to copy and download' })}
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
                          : result.tool === 'landing-page'
                            ? t({ ar: 'نسخ النص', fr: 'Copier le texte', en: 'Copy text' })
                            : t({ ar: 'نسخ', fr: 'Copier', en: 'Copy' })}
                      </button>
                      <button
                        type="button"
                        onClick={downloadResult}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold transition hover:bg-muted"
                      >
                        <Download className="h-3.5 w-3.5" />
                        {result.tool === 'landing-page'
                          ? t({ ar: 'تنزيل HTML', fr: 'Télécharger HTML', en: 'Download HTML' })
                          : t({ ar: 'تنزيل', fr: 'Télécharger', en: 'Download' })}
                      </button>
                    </div>
                  )}
                </div>

                {result ? (
                  <div className="mt-4">
                    {result.tool === 'landing-page' && landingHtml ? (
                      <>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <div
                            className="inline-flex rounded-xl border border-border bg-background p-1"
                            role="tablist"
                            aria-label={t({
                              ar: 'طريقة عرض النتيجة',
                              fr: 'Mode d’affichage du résultat',
                              en: 'Result view',
                            })}
                          >
                            <button
                              type="button"
                              role="tab"
                              aria-selected={resultView === 'preview'}
                              aria-pressed={resultView === 'preview'}
                              onClick={() => setResultView('preview')}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                                resultView === 'preview'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              <Eye className="h-3.5 w-3.5" />
                              {t({ ar: 'معاينة الصفحة', fr: 'Aperçu de la page', en: 'Page preview' })}
                            </button>
                            <button
                              type="button"
                              role="tab"
                              aria-selected={resultView === 'text'}
                              aria-pressed={resultView === 'text'}
                              onClick={() => setResultView('text')}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${
                                resultView === 'text'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {t({ ar: 'النص', fr: 'Texte', en: 'Text' })}
                            </button>
                          </div>
                          {resultView === 'text' && (
                            <button
                              type="button"
                              onClick={downloadText}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold transition hover:bg-muted"
                            >
                              <Download className="h-3.5 w-3.5" />
                              {t({ ar: 'تنزيل النص', fr: 'Télécharger le texte', en: 'Download text' })}
                            </button>
                          )}
                        </div>
                        <div className="mb-3 flex flex-wrap items-center gap-1.5">
                          <span className="me-1 text-[11px] font-bold text-muted-foreground">
                            {t({ ar: 'الشكل:', fr: 'Style :', en: 'Style:' })}
                          </span>
                          {LANDING_THEMES.map((theme) => (
                            <button
                              key={theme.id}
                              type="button"
                              aria-pressed={landingTheme === theme.id}
                              onClick={() => selectLandingTheme(theme.id)}
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                                landingTheme === theme.id
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border text-muted-foreground hover:border-primary/40'
                              }`}
                            >
                              {t(theme.name)}
                            </button>
                          ))}
                        </div>
                        {resultView === 'preview' ? (
                          <iframe
                            key={previewKey}
                            ref={previewRef}
                            title={t({
                              ar: 'معاينة صفحة الهبوط',
                              fr: 'Aperçu de la page de vente',
                              en: 'Landing page preview',
                            })}
                            src="/landing-preview.html"
                            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
                            referrerPolicy="no-referrer"
                            className="h-[70vh] min-h-[480px] max-h-[820px] w-full rounded-2xl border border-border bg-white shadow-sm"
                          />
                        ) : (
                          <div className="rounded-2xl border border-border bg-muted/30 p-4">
                            <pre
                              dir={result.language === 'ar' ? 'rtl' : 'ltr'}
                              className="max-h-[560px] overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed"
                            >{isolateLtrRuns(result.text)}</pre>
                          </div>
                        )}
                        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                          {t({
                            ar: 'هذه معاينة حية للصفحة الكاملة بمشهد ثلاثي الأبعاد تفاعلي. اختر الشكل من الأعلى لتغيير التصميم، ثم نزّل ملف HTML وارفعه على متجرك — الصورة مضمّنة داخل الملف.',
                            fr: 'Aperçu en direct de la page complète avec une scène 3D interactive. Choisissez le style ci-dessus, puis téléchargez le fichier HTML — la photo est intégrée au fichier.',
                            en: 'Live preview of the complete page with an interactive 3D scene. Pick a style above, then download the HTML file — the photo is embedded in the file.',
                          })}
                        </p>
                        {!images[result.tool] && (
                          <p className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-bold text-amber-700 dark:text-amber-300">
                            {t({
                              ar: 'صورة المنتج غير محفوظة في هذه المعاينة (تبقى في المتصفح فقط). ارفعها من جديد ليظهر المنتج في الصفحة المولّدة.',
                              fr: 'La photo du produit n’est pas conservée dans cet aperçu (elle reste dans le navigateur). Importez-la à nouveau pour l’afficher sur la page générée.',
                              en: 'The product photo is not kept in this preview (it stays in the browser only). Upload it again to show the product on the generated page.',
                            })}
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="rounded-2xl border border-border bg-muted/30 p-4">
                        <pre
                          dir={result.language === 'ar' ? 'rtl' : 'ltr'}
                          className="max-h-[560px] overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed"
                        >{isolateLtrRuns(result.text)}</pre>
                      </div>
                    )}
                    {result.mock && (
                      <p className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs font-bold text-amber-700 dark:text-amber-300">
                        {t({
                          ar: 'هذه نسخة تجريبية من الخادم ولم تستهلك تجربتك المجانية.',
                          fr: 'Ceci est un exemple de démonstration du serveur ; votre essai gratuit n’a pas été consommé.',
                          en: 'This is a server demo sample; your free trial was not consumed.',
                        })}
                      </p>
                    )}
                    {lastPreview && accessMode !== 'subscribed' && (
                      <div className="mt-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4">
                        <p className="flex items-center gap-2 text-sm font-bold text-indigo-800 dark:text-indigo-200">
                          <Crown className="h-4 w-4" />
                          {t({
                            ar: 'هذه كانت معاينتك المجانية الأخيرة',
                            fr: 'C’était votre dernière preview gratuite',
                            en: 'That was your last free preview',
                          })}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {t({
                            ar: 'نتيجتك محفوظة أعلاه. اشترك لمتابعة توليد نتائج جديدة في كل الأدوات، وحفظ حساباتك على الخادم.',
                            fr: 'Votre résultat est conservé ci-dessus. Abonnez-vous pour continuer à générer dans tous les outils et garder vos calculs.',
                            en: 'Your result is kept above. Subscribe to keep generating in every tool and keep your calculations.',
                          })}
                        </p>
                        <a
                          href="/subscription"
                          className="mt-3 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                        >
                          <Crown className="h-3.5 w-3.5" />
                          {t({ ar: 'عرض خطط الاشتراك', fr: 'Voir les formules', en: 'View subscription plans' })}
                          <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                        </a>
                      </div>
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

      {authOpen && (
        <LoginPage
          onClose={() => setAuthOpen(false)}
          onAuthenticated={() => {
            setAuthOpen(false);
            void refreshEntitlement();
          }}
        />
      )}
    </div>
  );
}

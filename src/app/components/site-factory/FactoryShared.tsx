import { useRef, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ImagePlus,
  Loader2,
  MessageCircle,
  Receipt,
  Smartphone,
  Trash2,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../utils/api';
import {
  IMAGE_LIMITS,
  STATUS_META,
  SITE_STATUS_META,
  categoryLabel,
  compressImage,
  copyText,
  fieldClass,
  formatDate,
  money,
  packageFeatures,
  pickLocalized,
  readAsDataURL,
  templateDescription,
  templateName,
  waLink,
  type FactoryPackage,
  type FactorySettings,
  type FactoryTemplate,
  type Localized,
} from './factoryUtils';

export function Field({
  label,
  required,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className || ''}`}>
      <span className="mb-1.5 flex items-center gap-1 text-[13px] font-semibold text-foreground/90">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {children}
      {error ? (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-rose-500">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

export function StatusPill({ status, kind = 'request' }: { status: string; kind?: 'request' | 'site' }) {
  const { t } = useLanguage();
  const meta = (kind === 'site' ? SITE_STATUS_META : STATUS_META)[status] || {
    label: { ar: status, fr: status, en: status },
    classes: 'bg-slate-100 text-slate-600 dark:bg-slate-500/15 dark:text-slate-300',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${meta.classes}`}
    >
      {t(meta.label)}
    </span>
  );
}

const TEMPLATE_ICONS: Record<string, typeof CreditCard> = {
  store: Wallet,
  company: BadgeCheck,
  portfolio: ImagePlus,
  card: Smartphone,
  restaurant: Receipt,
  landing: MessageCircle,
};

export function TemplatePreview({
  slug,
  accent,
  large = false,
}: {
  slug: string;
  accent: string;
  large?: boolean;
}) {
  const tint = `${accent}1f`;
  const stronger = `${accent}33`;
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-white ring-1 ring-slate-900/5 ${large ? 'h-64' : 'h-36'}`}
    >
      <div className="flex h-6 items-center gap-1 border-b border-slate-100 px-2">
        <span className="h-1.5 w-1.5 rounded-full bg-rose-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
        <span className="ms-auto h-1.5 w-8 rounded-full" style={{ backgroundColor: accent }} />
        <span className="ms-1 h-1.5 w-4 rounded-full bg-slate-200" />
      </div>
      <div className="absolute inset-x-0 bottom-0 top-6 p-2.5">
        {slug === 'store' && (
          <div className="flex h-full flex-col gap-1.5">
            <div className="flex flex-1 gap-2">
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
                <div className="h-2 w-11/12 rounded-full bg-slate-300" />
                <div className="h-1.5 w-8/12 rounded-full bg-slate-200" />
                <div className="h-1 w-6/12 rounded-full bg-slate-200" />
                <div className="mt-1 h-3.5 w-14 rounded-md" style={{ backgroundColor: accent }} />
              </div>
              <div
                className="w-2/5 rounded-lg"
                style={{ background: `linear-gradient(135deg, ${stronger}, ${tint})` }}
              />
            </div>
            <div className="grid flex-1 grid-cols-4 gap-1.5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-md bg-slate-50 p-1 ring-1 ring-slate-100">
                  <div className="h-1/2 rounded" style={{ backgroundColor: tint }} />
                  <div className="mt-1 h-1 w-4/5 rounded-full bg-slate-200" />
                  <div className="mt-0.5 h-1 w-2/5 rounded-full" style={{ backgroundColor: accent }} />
                </div>
              ))}
            </div>
          </div>
        )}
        {slug === 'company' && (
          <div className="flex h-full flex-col gap-1.5">
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="h-1 w-10 rounded-full" style={{ backgroundColor: tint }} />
              <div className="h-2 w-2/3 rounded-full bg-slate-300" />
              <div className="h-1.5 w-1/2 rounded-full bg-slate-200" />
              <div className="mt-0.5 h-3 w-12 rounded" style={{ backgroundColor: accent }} />
            </div>
            <div className="grid flex-1 grid-cols-3 gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-md bg-slate-50 p-1.5 ring-1 ring-slate-100">
                  <div className="h-4 w-4 rounded" style={{ backgroundColor: stronger }} />
                  <div className="mt-1 h-1 w-4/5 rounded-full bg-slate-300" />
                  <div className="mt-0.5 h-1 w-3/5 rounded-full bg-slate-200" />
                </div>
              ))}
            </div>
          </div>
        )}
        {slug === 'portfolio' && (
          <div className="grid h-full grid-cols-3 grid-rows-2 gap-1.5">
            <div
              className="col-span-2 row-span-2 flex flex-col justify-end rounded-lg p-2"
              style={{ background: `linear-gradient(140deg, ${stronger}, ${tint})` }}
            >
              <div className="h-1.5 w-3/4 rounded-full bg-white/80" />
              <div className="mt-1 h-1 w-1/2 rounded-full bg-white/60" />
            </div>
            <div className="rounded-lg bg-slate-100 p-1.5">
              <div className="h-1 w-4/5 rounded-full bg-slate-300" />
            </div>
            <div className="rounded-lg p-1.5" style={{ backgroundColor: tint }}>
              <div className="h-1 w-3/5 rounded-full bg-white/70" />
            </div>
          </div>
        )}
        {slug === 'card' && (
          <div className="flex h-full items-center justify-center">
            <div className="w-32 rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200">
              <div className="mx-auto h-6 w-6 rounded-full" style={{ backgroundColor: accent }} />
              <div className="mx-auto mt-1 h-1.5 w-16 rounded-full bg-slate-300" />
              <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-slate-200" />
              <div className="mt-2 grid grid-cols-3 gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-3 rounded" style={{ backgroundColor: tint }} />
                ))}
              </div>
            </div>
          </div>
        )}
        {slug === 'restaurant' && (
          <div className="flex h-full flex-col gap-1.5">
            <div
              className="flex h-1/3 flex-col justify-end rounded-md p-2"
              style={{ background: `linear-gradient(135deg, ${accent}, ${accent}aa)` }}
            >
              <div className="h-1.5 w-20 rounded-full bg-white/90" />
              <div className="mt-1 h-1 w-12 rounded-full bg-white/60" />
            </div>
            <div className="grid flex-1 grid-cols-2 gap-x-3 gap-y-1.5">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-1">
                  <div className="h-1 flex-1 rounded-full bg-slate-200" />
                  <div className="h-1 w-2 rounded-full" style={{ backgroundColor: accent }} />
                </div>
              ))}
            </div>
          </div>
        )}
        {slug === 'landing' && (
          <div className="grid h-full grid-cols-2 items-center gap-2">
            <div className="flex flex-col gap-1.5">
              <div className="h-1 w-8 rounded-full" style={{ backgroundColor: tint }} />
              <div className="h-2 w-full rounded-full bg-slate-300" />
              <div className="h-2 w-4/5 rounded-full bg-slate-300" />
              <div className="h-1 w-3/4 rounded-full bg-slate-200" />
              <div className="mt-1 h-3.5 w-12 rounded" style={{ backgroundColor: accent }} />
            </div>
            <div
              className="h-full min-h-16 rounded-lg"
              style={{ background: `linear-gradient(160deg, ${tint}, ${stronger})` }}
            />
          </div>
        )}
        {!['store', 'company', 'portfolio', 'card', 'restaurant', 'landing'].includes(slug) && (
          <div className="flex h-full items-center justify-center">
            <LayoutFallback accent={accent} />
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutFallback({ accent }: { accent: string }) {
  return (
    <div className="w-2/3 space-y-1.5">
      <div className="h-2 w-3/4 rounded-full bg-slate-300" />
      <div className="h-1.5 w-full rounded-full bg-slate-200" />
      <div className="h-1.5 w-2/3 rounded-full bg-slate-200" />
      <div className="h-3 w-12 rounded" style={{ backgroundColor: accent }} />
    </div>
  );
}

export function TemplateCard({
  template,
  active,
  onSelect,
}: {
  template: FactoryTemplate;
  active: boolean;
  onSelect: () => void;
}) {
  const { t, language } = useLanguage();
  const Icon = TEMPLATE_ICONS[template.slug] || BadgeCheck;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`group relative rounded-2xl border-2 bg-card p-2.5 text-start transition-all ${
        active
          ? 'border-primary shadow-lg shadow-primary/10'
          : 'border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md'
      }`}
    >
      <TemplatePreview slug={template.slug} accent={template.accent} />
      <div className="px-1 pb-0.5 pt-2.5">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${template.accent}1f`, color: template.accent }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="min-w-0 flex-1 truncate text-sm font-bold">{templateName(template, language)}</h3>
          {active && (
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <Check className="h-3 w-3" />
            </span>
          )}
        </div>
        <p className="mt-1.5 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">
          {templateDescription(template, language)}
        </p>
        <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5">
            {t({ ar: 'متجاوب', fr: 'Responsive', en: 'Responsive' })}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5">AR / FR / EN</span>
        </div>
      </div>
    </button>
  );
}

export function ImageField({
  label,
  hint,
  value,
  onChange,
  maxBytes,
  maxDimension,
  alpha = false,
  compact = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  maxBytes: number;
  maxDimension: number;
  alpha?: boolean;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const dataUrl = await compressImage(file, maxBytes, maxDimension, alpha);
      onChange(dataUrl);
    } catch (err: any) {
      const code = err?.message;
      setError(
        code === 'NOT_AN_IMAGE'
          ? t({ ar: 'اختر ملف صورة صالحاً.', fr: 'Choisissez un fichier image valide.', en: 'Choose a valid image file.' })
          : code === 'IMAGE_TOO_LARGE'
            ? t({
                ar: 'الصورة كبيرة جداً. جرّب صورة أصغر أو أقل دقة.',
                fr: 'Image trop lourde. Essayez une image plus petite.',
                en: 'Image is too large. Try a smaller one.',
              })
            : t({
                ar: 'تعذر تجهيز الصورة. جرّب صورة أخرى.',
                fr: 'Impossible de préparer l’image. Essayez-en une autre.',
                en: 'Could not prepare the image. Try another one.',
              }),
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold hover:bg-muted disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {value
              ? t({ ar: 'تغيير', fr: 'Changer', en: 'Change' })
              : t({ ar: 'صورة', fr: 'Image', en: 'Image' })}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        {error && <span className="text-[11px] font-medium text-rose-500">{error}</span>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold">{label}</p>
          {hint && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{hint}</p>}
          {error && <p className="mt-1 text-[11px] font-medium text-rose-500">{error}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold hover:bg-muted disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {value ? t({ ar: 'تغيير', fr: 'Changer', en: 'Change' }) : t({ ar: 'رفع', fr: 'Upload', en: 'Upload' })}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="inline-flex items-center justify-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[11px] font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
            >
              <Trash2 className="h-3 w-3" />
              {t({ ar: 'حذف', fr: 'Retirer', en: 'Remove' })}
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
      />
    </div>
  );
}

export function CopyValue({ label, value }: { label: string; value: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (await copyText(value)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm font-bold" dir="ltr">
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={t({ ar: 'نسخ', fr: 'Copier', en: 'Copy' })}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:text-primary"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function PaymentDetails({
  settings,
  amount,
  showNote = true,
}: {
  settings: FactorySettings;
  amount: number;
  showNote?: boolean;
}) {
  const { t, language } = useLanguage();
  const hasAccount = Boolean(settings.ccp || settings.baridimob);
  const whatsapp = waLink(
    settings,
    t({
      ar: 'مرحباً، أريد معلومات الدفع الخاصة بطلب موقعي.',
      fr: 'Bonjour, je souhaite les informations de paiement pour ma commande de site.',
      en: 'Hello, I would like the payment details for my website order.',
    }),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl bg-primary/5 px-4 py-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {t({ ar: 'الدفعة الأولى المطلوبة', fr: 'Premier versement', en: 'First payment' })}
          </p>
          <p className="text-xl font-black text-primary">{money(amount, language)}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <CreditCard className="h-5 w-5" />
        </div>
      </div>

      {hasAccount ? (
        <div className="space-y-2">
          {settings.ccp && (
            <CopyValue
              label={`CCP${settings.ccpKey ? ` — ${t({ ar: 'المفتاح', fr: 'Clé', en: 'Key' })} ${settings.ccpKey}` : ''}`}
              value={settings.ccp}
            />
          )}
          {settings.baridimob && <CopyValue label="BaridiMob" value={settings.baridimob} />}
          {settings.bankName && (
            <p className="text-[11px] text-muted-foreground">
              {t({ ar: 'البنك:', fr: 'Banque :', en: 'Bank:' })} {settings.bankName}
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-3.5 text-xs leading-relaxed text-muted-foreground">
          {t({
            ar: 'سيتم إرسال معلومات الدفع (CCP / BaridiMob) عبر واتساب بعد إرسال الطلب، مع مرجع الطلب.',
            fr: 'Les informations de paiement (CCP / BaridiMob) seront envoyées sur WhatsApp après votre demande.',
            en: 'Payment details (CCP / BaridiMob) will be sent on WhatsApp after you submit the request.',
          })}
        </div>
      )}

      {showNote && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {pickLocalized(settings.paymentNote, language)}
        </p>
      )}

      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-300"
        >
          <MessageCircle className="h-4 w-4" />
          {t({ ar: 'تواصل عبر واتساب', fr: 'Contacter sur WhatsApp', en: 'Contact on WhatsApp' })}
        </a>
      )}
    </div>
  );
}

export function ReceiptBox({
  refCode,
  defaultContact,
  settings,
  onUploaded,
}: {
  refCode: string;
  defaultContact: string;
  settings?: FactorySettings;
  onUploaded?: () => void;
}) {
  const { t, language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [contact, setContact] = useState(defaultContact);
  const [receipt, setReceipt] = useState<{ dataUrl: string; name: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleFile(file: File | null | undefined) {
    if (!file) return;
    setError('');
    setDone(false);
    try {
      if (file.type === 'application/pdf') {
        if (file.size > 1.5 * 1024 * 1024) {
          setError(
            t({
              ar: 'ملف PDF كبير جداً. الحد الأقصى 1.5 ميغابايت.',
              fr: 'PDF trop volumineux. Maximum 1,5 Mo.',
              en: 'PDF is too large. Maximum 1.5 MB.',
            }),
          );
          return;
        }
        setReceipt({ dataUrl: await readAsDataURL(file), name: file.name });
      } else if (file.type.startsWith('image/')) {
        const dataUrl = await compressImage(file, IMAGE_LIMITS.receipt, 1600, false);
        setReceipt({ dataUrl, name: file.name.replace(/\.[^.]+$/, '') + '.jpg' });
      } else {
        setError(
          t({
            ar: 'أرسل صورة JPG/PNG/WebP أو ملف PDF.',
            fr: 'Envoyez une image JPG/PNG/WebP ou un PDF.',
            en: 'Send a JPG/PNG/WebP image or a PDF.',
          }),
        );
      }
    } catch {
      setError(
        t({
          ar: 'تعذر تجهيز الملف. جرّب صورة أو ملفاً أصغر.',
          fr: 'Impossible de préparer le fichier. Essayez plus petit.',
          en: 'Could not prepare the file. Try a smaller one.',
        }),
      );
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function submit() {
    if (!receipt) {
      setError(t({ ar: 'اختر ملف الوصل أولاً.', fr: 'Choisissez d’abord le reçu.', en: 'Choose the receipt file first.' }));
      return;
    }
    if (contact.trim().length < 4) {
      setError(
        t({
          ar: 'أدخل رقم الهاتف أو البريد المستعمل في الطلب.',
          fr: 'Entrez le téléphone ou l’e-mail utilisé dans la demande.',
          en: 'Enter the phone or email used in the request.',
        }),
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api.siteFactory.uploadReceipt(refCode, {
        contact: contact.trim(),
        receipt: receipt.dataUrl,
        name: receipt.name,
      });
      setDone(true);
      setReceipt(null);
      onUploaded?.();
    } catch (err: any) {
      setError(err?.message || t({ ar: 'تعذر رفع الوصل. حاول مجدداً.', fr: 'Échec de l’envoi.', en: 'Upload failed.' }));
    } finally {
      setBusy(false);
    }
  }

  const whatsapp = settings
    ? waLink(
        settings,
        t({
          ar: `مرحباً، أرسلت وصل الدفع للطلب ${refCode}.`,
          fr: `Bonjour, j’ai envoyé le reçu de la commande ${refCode}.`,
          en: `Hello, I sent the receipt for request ${refCode}.`,
        }),
      )
    : '';

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Receipt className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-bold">{t({ ar: 'رفع وصل الدفع', fr: 'Envoyer le reçu', en: 'Upload the receipt' })}</p>
          <p className="text-[11px] text-muted-foreground">
            {t({
              ar: 'صورة واضحة أو PDF — يُراجع خلال ساعات العمل.',
              fr: 'Photo lisible ou PDF — vérifié pendant les heures de travail.',
              en: 'Clear photo or PDF — reviewed during working hours.',
            })}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <Field label={t({ ar: 'الهاتف أو البريد المستعمل في الطلب', fr: 'Téléphone ou e-mail de la demande', en: 'Phone or email used in the request' })}>
          <input
            value={contact}
            onChange={(event) => setContact(event.target.value)}
            className={fieldClass()}
            placeholder="0674113290"
            dir="ltr"
          />
        </Field>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-dashed border-border px-3.5 py-2.5 text-xs font-bold hover:bg-muted"
          >
            <Upload className="h-4 w-4" />
            {receipt
              ? t({ ar: 'تغيير الملف', fr: 'Changer le fichier', en: 'Change file' })
              : t({ ar: 'اختيار ملف الوصل', fr: 'Choisir le reçu', en: 'Choose receipt' })}
          </button>
          {receipt && (
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-[11px] font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="max-w-[180px] truncate">{receipt.name}</span>
              <button type="button" onClick={() => setReceipt(null)} aria-label="remove">
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-rose-500" />
              </button>
            </span>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />

        {done && (
          <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {t({
                ar: 'تم استلام الوصل بنجاح. سنراجعه ونحدّث حالة الطلب.',
                fr: 'Reçu bien reçu. Nous le vérifierons et mettrons à jour le statut.',
                en: 'Receipt received. We will review it and update the status.',
              })}
            </span>
          </div>
        )}
        {error && (
          <p className="flex items-start gap-1.5 text-xs font-medium text-rose-500">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={busy || !receipt}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {t({ ar: 'إرسال الوصل', fr: 'Envoyer le reçu', en: 'Send receipt' })}
        </button>

        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300"
          >
            <MessageCircle className="h-4 w-4" />
            {t({ ar: 'أو أرسله عبر واتساب', fr: 'Ou envoyer sur WhatsApp', en: 'Or send it on WhatsApp' })}
          </a>
        )}
      </div>
    </div>
  );
}

export function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end font-semibold">{value}</span>
    </div>
  );
}

export function PackageFeatures({ features, limit = 4 }: { features: Localized[]; limit?: number }) {
  const { language } = useLanguage();
  return (
    <ul className="space-y-1.5">
      {features.slice(0, limit).map((feature, index) => (
        <li key={index} className="flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
          <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
          <span>{pickLocalized(feature, language)}</span>
        </li>
      ))}
    </ul>
  );
}

export { formatDate, money, categoryLabel, packageFeatures, templateName, templateDescription };
export type { FactoryPackage, FactorySettings, FactoryTemplate, Localized };

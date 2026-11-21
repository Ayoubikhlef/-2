import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  Crown,
  Landmark,
  Loader2,
  Lock,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './LoginPage';
import {
  api,
  type ManualPaymentDetails,
  type SubscriptionMe,
  type SubscriptionPayment,
  type SubscriptionPaymentMethod,
  type SubscriptionPlan,
  type SubscriptionPlanId,
} from '../utils/api';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const numberFormat = new Intl.NumberFormat('en-US');

function formatDzd(value: number, language: string): string {
  const suffix = language === 'ar' ? 'دج' : 'DA';
  return `${numberFormat.format(Math.round(value))} ${suffix}`;
}

function formatDate(value: string | null | undefined, language: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(
    language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' },
  );
}

function daysLeft(value: string | null | undefined): number | null {
  if (!value) return null;
  const end = new Date(value).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
}

/** Read a local file as a data URL. Production CSP blocks `blob:` images. */
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

/** Downscale a receipt so the data URL stays under the 1 MB request limit. */
async function compressReceipt(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) throw new Error('type');
  if (file.size > 12 * 1024 * 1024) throw new Error('size');
  const source = await readAsDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error('read'));
    element.src = source;
  });
  const scale = Math.min(1, 1100 / Math.max(image.width, image.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  let quality = 0.75;
  let data = canvas.toDataURL('image/jpeg', quality);
  while (data.length > 850_000 && quality > 0.4) {
    quality -= 0.08;
    data = canvas.toDataURL('image/jpeg', quality);
  }
  if (data.length > 850_000) throw new Error('large');
  return data;
}

const STATUS_LABEL: Record<string, { ar: string; fr: string; en: string }> = {
  pending: { ar: 'بانتظار الدفع', fr: 'En attente', en: 'Awaiting payment' },
  paid: { ar: 'مدفوع ومفعّل', fr: 'Payé', en: 'Paid' },
  failed: { ar: 'فشل', fr: 'Échoué', en: 'Failed' },
  rejected: { ar: 'مرفوض', fr: 'Refusé', en: 'Rejected' },
  expired: { ar: 'منتهي', fr: 'Expiré', en: 'Expired' },
};

const METHOD_LABEL: Record<string, { ar: string; fr: string; en: string }> = {
  chargily: { ar: 'بطاقة CIB / الذهبية', fr: 'Carte CIB / Edahabia', en: 'CIB / Edahabia card' },
  ccp: { ar: 'تحويل CCP', fr: 'Virement CCP', en: 'CCP transfer' },
  baridimob: { ar: 'BaridiMob', fr: 'BaridiMob', en: 'BaridiMob' },
  admin: { ar: 'تفعيل من الإدارة', fr: 'Activé par l’admin', en: 'Activated by admin' },
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(t({ ar: 'تم النسخ', fr: 'Copié', en: 'Copied' }));
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          toast.error(t({ ar: 'تعذر النسخ', fr: 'Copie impossible', en: 'Copy failed' }));
        }
      }}
      className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function SubscriptionPage() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [chargily, setChargily] = useState(false);
  const [me, setMe] = useState<SubscriptionMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [plansError, setPlansError] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanId | null>(null);
  const [method, setMethod] = useState<SubscriptionPaymentMethod>('ccp');
  const [checkingOut, setCheckingOut] = useState(false);
  const [manual, setManual] = useState<{
    payment: SubscriptionPayment;
    instructions: ManualPaymentDetails;
  } | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptBusy, setReceiptBusy] = useState(false);
  const [receiptSent, setReceiptSent] = useState(false);
  const checkoutBox = useRef<HTMLDivElement | null>(null);

  const loadMe = useCallback(async () => {
    if (!user) {
      setMe(null);
      return;
    }
    try {
      const data = await api.subscription.me();
      setMe(data);
      setChargily(Boolean(data.chargily));
    } catch {
      // The public plans still render; the account card is optional.
    }
  }, [user]);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setPlansError(false);
    try {
      const data = await api.subscription.plans();
      setPlans(data.plans);
      setChargily(Boolean(data.chargily));
    } catch {
      setPlans([]);
      setPlansError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  // Chargily returns to /subscription?status=success before its webhook has
  // necessarily reached the API, so refresh a few times.
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('status') !== 'success') return;
    let tries = 0;
    const timer = window.setInterval(() => {
      tries += 1;
      void loadMe();
      if (tries >= 6) window.clearInterval(timer);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [user, loadMe]);

  useEffect(() => {
    if (!chargily) setMethod('ccp');
  }, [chargily]);

  const active = me?.subscription || null;
  const previews = me?.previews || null;
  const selected = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan) || null,
    [plans, selectedPlan],
  );
  const returnStatus = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('status')
    : null;

  const choosePlan = (planId: SubscriptionPlanId) => {
    setSelectedPlan(planId);
    setManual(null);
    setReceiptFile(null);
    setReceiptSent(false);
    window.setTimeout(() => {
      checkoutBox.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
  };

  const startCheckout = async () => {
    if (!selected) return;
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setCheckingOut(true);
    try {
      const result = await api.subscription.checkout({ plan: selected.id, method });
      if (result.mode === 'redirect' && result.checkoutUrl) {
        toast.success(t({ ar: 'جاري تحويلك إلى صفحة الدفع الآمنة…', fr: 'Redirection vers le paiement sécurisé…', en: 'Redirecting to the secure checkout…' }));
        window.location.assign(result.checkoutUrl);
        return;
      }
      if (result.instructions) {
        setManual({ payment: result.payment, instructions: result.instructions });
        setReceiptSent(Boolean(result.payment.hasProof));
        toast.success(
          t({
            ar: 'تم إنشاء طلب الاشتراك. أكمل التحويل ثم أرفق الوصل.',
            fr: 'Demande créée. Effectuez le virement puis joignez le reçu.',
            en: 'Request created. Make the transfer, then attach the receipt.',
          }),
        );
      }
      await loadMe();
    } catch (err: any) {
      const code = err?.code;
      toast.error(
        code === 'chargily_not_configured'
          ? t({ ar: 'الدفع بالبطاقة غير مفعّل حالياً. اختر CCP أو BaridiMob.', fr: 'Le paiement par carte n’est pas actif. Choisissez CCP ou BaridiMob.', en: 'Card payment is not enabled. Choose CCP or BaridiMob.' })
          : code === 'chargily_error'
            ? t({ ar: 'تعذر بدء الدفع بالبطاقة. جرّب CCP أو BaridiMob.', fr: 'Impossible de démarrer le paiement carte. Essayez CCP ou BaridiMob.', en: 'Could not start the card payment. Try CCP or BaridiMob.' })
            : t({ ar: 'تعذر إنشاء طلب الاشتراك. حاول مرة أخرى.', fr: 'Impossible de créer la demande. Réessayez.', en: 'Could not create the subscription request. Try again.' }),
      );
    } finally {
      setCheckingOut(false);
    }
  };

  const uploadReceipt = async () => {
    if (!manual || !receiptFile) return;
    setReceiptBusy(true);
    try {
      const proof = await compressReceipt(receiptFile);
      await api.subscription.proof(manual.payment.id, { proof });
      setReceiptSent(true);
      setReceiptFile(null);
      toast.success(
        t({
          ar: 'تم إرسال الوصل. سيُفعّل اشتراكك بعد المراجعة.',
          fr: 'Reçu envoyé. Votre abonnement sera activé après vérification.',
          en: 'Receipt sent. Your subscription will be activated after review.',
        }),
      );
      await loadMe();
    } catch (err: any) {
      const message = err?.message === 'size' || err?.message === 'large'
        ? t({ ar: 'الصورة كبيرة. اختر صورة أصغر.', fr: 'Image trop lourde. Choisissez une image plus légère.', en: 'Image too large. Choose a smaller file.' })
        : t({ ar: 'تعذر إرسال الوصل. جرّب صورة JPG أو PNG أصغر.', fr: 'Envoi impossible. Essayez un JPG ou PNG plus léger.', en: 'Could not send the receipt. Try a smaller JPG or PNG.' });
      toast.error(message);
    } finally {
      setReceiptBusy(false);
    }
  };

  const whatsappMessage = manual
    ? t({
        ar: `مرحباً، دفعت اشتراك ${t(plans.find((p) => p.id === manual.payment.plan)?.name || { ar: manual.payment.plan, fr: manual.payment.plan, en: manual.payment.plan })} بمبلغ ${formatDzd(manual.payment.amount, 'ar')}. المرجع: ${manual.payment.reference}`,
        fr: `Bonjour, j’ai payé l’abonnement ${manual.payment.plan} (${formatDzd(manual.payment.amount, 'fr')}). Référence : ${manual.payment.reference}`,
        en: `Hello, I paid the ${manual.payment.plan} subscription (${formatDzd(manual.payment.amount, 'en')}). Reference: ${manual.payment.reference}`,
      })
    : '';

  return (
    <div className="pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-indigo-500/12 via-background to-background px-4 pb-12 pt-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative mx-auto max-w-6xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold tracking-normal text-indigo-700 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            {t({ ar: 'اشتراك أدوات الذكاء الاصطناعي', fr: 'Abonnement outils IA', en: 'AI tools subscription' })}
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl md:text-5xl">
            {t({
              ar: 'بعد التجربة المجانية… افتح كل الأدوات',
              fr: 'Après l’essai gratuit… débloquez tous les outils',
              en: 'After the free trial… unlock every tool',
            })}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t({
              ar: 'معاينة واحدة إضافية مجانية بعد تسجيل الدخول، ثم اشتراك واحد يفتح لك 13 أداة بدون حدود، مع حفظ نتائج الحاسبة في حسابك.',
              fr: 'Une preview gratuite supplémentaire après connexion, puis un abonnement qui ouvre les 13 outils sans limite et garde vos calculs dans votre compte.',
              en: 'One extra free preview after signing in, then a single subscription unlocks all 13 tools with no limit and keeps your calculator results in your account.',
            })}
          </p>
          {active && (
            <div className="mx-auto mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-bold text-emerald-800 dark:text-emerald-300">
              <BadgeCheck className="h-4 w-4" />
              {t({
                ar: `اشتراكك نشط — ${t(active.planName)} حتى ${formatDate(active.endsAt, language)}`,
                fr: `Abonnement actif — ${t(active.planName)} jusqu’au ${formatDate(active.endsAt, language)}`,
                en: `Subscription active — ${t(active.planName)} until ${formatDate(active.endsAt, language)}`,
              })}
            </div>
          )}
          {!user && !authLoading && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90"
              >
                <Lock className="h-4 w-4" />
                {t({ ar: 'سجّل الدخول أو أنشئ حساباً', fr: 'Se connecter ou créer un compte', en: 'Sign in or create an account' })}
              </button>
              <span className="text-xs text-muted-foreground">
                {t({ ar: 'الحساب مجاني ولا يستهلك بطاقة', fr: 'Compte gratuit, sans carte bancaire', en: 'Free account, no card required' })}
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* Return banner */}
        {returnStatus === 'success' && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">{t({ ar: 'تم استلام الدفع', fr: 'Paiement reçu', en: 'Payment received' })}</p>
              <p className="mt-1 text-xs leading-relaxed">
                {active
                  ? t({ ar: 'اشتراكك مفعّل الآن. استمتع بكل الأدوات.', fr: 'Votre abonnement est actif. Profitez de tous les outils.', en: 'Your subscription is active. Enjoy every tool.' })
                  : t({ ar: 'نتحقق من الدفع ونفعّل اشتراكك خلال لحظات. حدّث الصفحة بعد دقيقة إن لم يظهر.', fr: 'Nous vérifions le paiement. Actualisez la page dans une minute s’il n’apparaît pas.', en: 'We are verifying the payment. Refresh in a minute if it does not appear.' })}
              </p>
            </div>
          </div>
        )}
        {returnStatus === 'failed' && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-800 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-bold">{t({ ar: 'لم يكتمل الدفع', fr: 'Le paiement n’a pas abouti', en: 'Payment was not completed' })}</p>
              <p className="mt-1 text-xs leading-relaxed">
                {t({ ar: 'يمكنك إعادة المحاولة أو اختيار التحويل CCP / BaridiMob.', fr: 'Réessayez ou choisissez le virement CCP / BaridiMob.', en: 'Try again or choose a CCP / BaridiMob transfer.' })}
              </p>
            </div>
          </div>
        )}

        {/* Account summary */}
        {user && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t({ ar: 'حسابك', fr: 'Votre compte', en: 'Your account' })}
              </div>
              <p className="mt-2 break-words text-xs text-muted-foreground">{user.name || user.email}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {active
                  ? t({ ar: 'الاشتراك مفعّل — استخدام غير محدود.', fr: 'Abonnement actif — usage illimité.', en: 'Subscription active — unlimited use.' })
                  : previews && previews.remaining !== null && previews.remaining > 0
                    ? t({
                        ar: `لديك ${previews.remaining} معاينة مجانية متبقية بعد التجربة.`,
                        fr: `Il vous reste ${previews.remaining} preview gratuite après l’essai.`,
                        en: `You have ${previews.remaining} free preview left after the trial.`,
                      })
                    : t({
                        ar: 'انتهت المعاينات المجانية. اختر خطة للمتابعة.',
                        fr: 'Les previews gratuites sont épuisées. Choisissez une formule.',
                        en: 'Free previews are used. Choose a plan to continue.',
                      })}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Clock3 className="h-4 w-4 text-primary" />
                {t({ ar: 'صلاحية الاشتراك', fr: 'Validité', en: 'Subscription period' })}
              </div>
              {active ? (
                <>
                  <p className="mt-2 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    {t(active.planName)}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t({
                      ar: `ينتهي في ${formatDate(active.endsAt, language)} · ${daysLeft(active.endsAt) ?? 0} يوم متبقٍ`,
                      fr: `Se termine le ${formatDate(active.endsAt, language)} · ${daysLeft(active.endsAt) ?? 0} jours restants`,
                      en: `Ends on ${formatDate(active.endsAt, language)} · ${daysLeft(active.endsAt) ?? 0} days left`,
                    })}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {t({ ar: 'لا يوجد اشتراك نشط بعد. الشراء يمدّد تلقائياً إن كان لديك وقت متبقٍ.', fr: 'Aucun abonnement actif. Un achat prolonge automatiquement le temps restant.', en: 'No active subscription yet. A purchase extends any remaining time.' })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Plans */}
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {loading && plans.length === 0 && (
            <div className="col-span-full flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t({ ar: 'جاري تحميل الخطط…', fr: 'Chargement des formules…', en: 'Loading plans…' })}
            </div>
          )}
          {!loading && plansError && plans.length === 0 && (
            <div className="col-span-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                {t({
                  ar: 'تعذر تحميل خطط الاشتراك الآن.',
                  fr: 'Impossible de charger les formules pour le moment.',
                  en: 'Could not load the subscription plans right now.',
                })}
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                {t({
                  ar: 'تحقق من اتصالك ثم أعد المحاولة. يمكنك أيضاً مراسلتنا على واتساب لتفعيل اشتراكك يدوياً.',
                  fr: 'Vérifiez votre connexion puis réessayez. Vous pouvez aussi nous écrire sur WhatsApp pour une activation manuelle.',
                  en: 'Check your connection and try again. You can also message us on WhatsApp for a manual activation.',
                })}
              </p>
              <button
                type="button"
                onClick={() => void loadPlans()}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t({ ar: 'إعادة المحاولة', fr: 'Réessayer', en: 'Try again' })}
              </button>
            </div>
          )}
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-3xl border bg-card p-6 shadow-sm transition ${
                  plan.popular
                    ? 'border-indigo-500/50 shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                    : isSelected
                      ? 'border-primary/50 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-semibold tracking-normal text-white shadow-lg">
                    {t({ ar: 'الأكثر اختياراً', fr: 'Le plus choisi', en: 'Most popular' })}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  {plan.popular ? <Crown className="h-4 w-4 text-indigo-500" /> : <Wallet className="h-4 w-4 text-primary" />}
                  <h2 className="text-lg font-semibold">{t(plan.name)}</h2>
                </div>
                <p className="mt-1 min-h-[2.5rem] text-xs leading-relaxed text-muted-foreground">{t(plan.tagline)}</p>
                <div className="mt-4">
                  <span className="text-3xl font-semibold tabular-nums">{formatDzd(plan.price, language)}</span>
                  <span className="ms-2 text-xs text-muted-foreground">
                    / {t({ ar: plan.months === 1 ? 'شهر' : `${plan.months} أشهر`, fr: plan.months === 1 ? 'mois' : `${plan.months} mois`, en: plan.months === 1 ? 'month' : `${plan.months} months` })}
                  </span>
                </div>
                {plan.months > 1 && (
                  <p className="mt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                    ≈ {formatDzd(plan.perMonth, language)} {t({ ar: 'شهرياً', fr: 'par mois', en: 'per month' })}
                  </p>
                )}
                <ul className="mt-5 space-y-2.5 text-xs leading-relaxed">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{t(feature)}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => choosePlan(plan.id)}
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold transition ${
                    plan.popular
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700'
                      : 'border border-border bg-background hover:border-primary/40 hover:bg-muted'
                  }`}
                >
                  {active
                    ? t({ ar: 'تمديد الاشتراك', fr: 'Prolonger', en: 'Extend subscription' })
                    : t({ ar: 'اشترك الآن', fr: 'S’abonner', en: 'Subscribe now' })}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {t({
            ar: 'كل الأسعار بالدينار الجزائري. لا يوجد تجديد تلقائي مخفي — تختار التمديد بنفسك.',
            fr: 'Tous les prix en dinar algérien. Aucun renouvellement automatique caché — vous choisissez la prolongation.',
            en: 'All prices in Algerian dinar. No hidden auto-renewal — you choose when to extend.',
          })}
        </p>

        {/* Checkout */}
        <div ref={checkoutBox} className="mt-10 scroll-mt-24">
          {!selected && (
            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
              {t({
                ar: 'اختر خطة أعلاه لعرض طرق الدفع وإتمام الاشتراك.',
                fr: 'Choisissez une formule ci-dessus pour voir les moyens de paiement.',
                en: 'Pick a plan above to see the payment methods.',
              })}
            </div>
          )}

          {selected && !manual && (
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold">
                    {t({ ar: 'إتمام الاشتراك', fr: 'Finaliser l’abonnement', en: 'Complete the subscription' })}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t(selected.name)} · {formatDzd(selected.price, language)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={t({ ar: 'إلغاء', fr: 'Annuler', en: 'Cancel' })}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-6 p-5 lg:grid-cols-[1fr_20rem]">
                <div>
                  <p className="text-xs font-bold tracking-normal text-muted-foreground">
                    {t({ ar: 'طريقة الدفع', fr: 'Moyen de paiement', en: 'Payment method' })}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {chargily && (
                      <button
                        type="button"
                        onClick={() => setMethod('chargily')}
                        className={`flex items-center gap-3 rounded-2xl border p-4 text-start transition ${
                          method === 'chargily'
                            ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <CreditCard className="h-5 w-5 shrink-0 text-primary" />
                        <span className="min-w-0">
                          <span className="block text-sm font-bold">{t(METHOD_LABEL.chargily)}</span>
                          <span className="mt-0.5 block text-[11px] text-muted-foreground">
                            {t({ ar: 'دفع فوري آمن عبر Chargily — يُفعّل الاشتراك تلقائياً.', fr: 'Paiement immédiat et sécurisé via Chargily — activation automatique.', en: 'Instant secure payment via Chargily — activated automatically.' })}
                          </span>
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setMethod('ccp')}
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-start transition ${
                        method === 'ccp'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <Landmark className="h-5 w-5 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">{t(METHOD_LABEL.ccp)}</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {t({ ar: 'تحويل إلى الحساب البريدي، ثم أرفق صورة الوصل.', fr: 'Virement CCP puis joignez la photo du reçu.', en: 'Transfer to the CCP account, then attach the receipt photo.' })}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('baridimob')}
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-start transition ${
                        method === 'baridimob'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <Smartphone className="h-5 w-5 shrink-0 text-primary" />
                      <span className="min-w-0">
                        <span className="block text-sm font-bold">{t(METHOD_LABEL.baridimob)}</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          {t({ ar: 'تحويل من تطبيق بريدي موب، ثم أرفق الوصل.', fr: 'Virement depuis BaridiMob puis joignez le reçu.', en: 'Transfer from the BaridiMob app, then attach the receipt.' })}
                        </span>
                      </span>
                    </button>
                  </div>
                  {!chargily && (
                    <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-800 dark:text-amber-200">
                      {t({
                        ar: 'الدفع بالبطاقة غير مفعّل حالياً. استعمل CCP أو BaridiMob وسيُفعّل اشتراكك بعد مراجعة الوصل.',
                        fr: 'Le paiement par carte n’est pas encore actif. Utilisez CCP ou BaridiMob : l’abonnement sera activé après vérification.',
                        en: 'Card payment is not active yet. Use CCP or BaridiMob; the subscription is activated after the receipt is reviewed.',
                      })}
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-bold tracking-normal text-muted-foreground">
                    {t({ ar: 'ملخص الطلب', fr: 'Récapitulatif', en: 'Order summary' })}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span>{t(selected.name)}</span>
                    <span className="font-bold tabular-nums">{formatDzd(selected.price, language)}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{t({ ar: 'المدة', fr: 'Durée', en: 'Duration' })}</span>
                    <span>{t({ ar: `${selected.months} شهر`, fr: `${selected.months} mois`, en: `${selected.months} months` })}</span>
                  </div>
                  <button
                    type="button"
                    onClick={startCheckout}
                    disabled={checkingOut}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {checkingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                    {user
                      ? t({ ar: 'متابعة الدفع', fr: 'Continuer le paiement', en: 'Continue to payment' })
                      : t({ ar: 'سجّل الدخول للمتابعة', fr: 'Se connecter pour continuer', en: 'Sign in to continue' })}
                  </button>
                  <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
                    {t({ ar: 'لا يتم خصم أي مبلغ قبل تأكيدك.', fr: 'Aucun débit avant votre confirmation.', en: 'Nothing is charged before you confirm.' })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Manual payment instructions */}
          {manual && (
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-emerald-500/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      {t({ ar: 'طلب الاشتراك جاهز', fr: 'Demande prête', en: 'Subscription request ready' })}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {t({ ar: 'حوّل المبلغ ثم أرفق الوصل ليُفعّل حسابك.', fr: 'Virez le montant puis joignez le reçu pour activer le compte.', en: 'Transfer the amount then attach the receipt to activate the account.' })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setManual(null)}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  aria-label={t({ ar: 'إغلاق', fr: 'Fermer', en: 'Close' })}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-5 p-5 lg:grid-cols-[1fr_20rem]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] tracking-normal text-muted-foreground">
                          {t({ ar: 'المبلغ المطلوب', fr: 'Montant à payer', en: 'Amount due' })}
                        </p>
                        <p className="mt-1 text-2xl font-semibold tabular-nums">
                          {formatDzd(manual.payment.amount, language)}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-[11px] tracking-normal text-muted-foreground">
                          {t({ ar: 'المرجع', fr: 'Référence', en: 'Reference' })}
                        </p>
                        <p className="mt-1 break-all font-mono text-sm font-bold" dir="ltr">
                          {manual.payment.reference}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <CopyButton value={manual.payment.reference} label={t({ ar: 'نسخ المرجع', fr: 'Copier la référence', en: 'Copy reference' })} />
                      <CopyButton value={String(manual.payment.amount)} label={t({ ar: 'نسخ المبلغ', fr: 'Copier le montant', en: 'Copy amount' })} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {manual.instructions.ccp && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5 text-sm">
                        <span className="text-muted-foreground">CCP</span>
                        <span className="flex items-center gap-2">
                          <span className="font-mono font-bold" dir="ltr">{manual.instructions.ccp}</span>
                          {manual.instructions.ccpKey && <span className="text-xs text-muted-foreground">/ {manual.instructions.ccpKey}</span>}
                          <CopyButton value={manual.instructions.ccp} label={t({ ar: 'نسخ', fr: 'Copier', en: 'Copy' })} />
                        </span>
                      </div>
                    )}
                    {manual.instructions.baridimob && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5 text-sm">
                        <span className="text-muted-foreground">BaridiMob</span>
                        <span className="flex items-center gap-2">
                          <span className="font-mono font-bold" dir="ltr">{manual.instructions.baridimob}</span>
                          <CopyButton value={manual.instructions.baridimob} label={t({ ar: 'نسخ', fr: 'Copier', en: 'Copy' })} />
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5 text-sm">
                      <span className="text-muted-foreground">{t({ ar: 'صاحب الحساب', fr: 'Titulaire', en: 'Account holder' })}</span>
                      <span className="font-bold">{manual.instructions.ownerName}</span>
                    </div>
                  </div>

                  {!manual.instructions.ccp && !manual.instructions.baridimob && (
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                      {t({
                        ar: 'معلومات الحساب البنكي ستُرسل لك على واتساب بعد تأكيد الطلب. أرسل المرجع في الرسالة.',
                        fr: 'Les coordonnées bancaires seront envoyées sur WhatsApp après confirmation. Mentionnez la référence.',
                        en: 'The bank details will be sent on WhatsApp after confirmation. Include the reference.',
                      })}
                    </p>
                  )}

                  <a
                    href={`https://wa.me/${manual.instructions.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-500/20 dark:text-emerald-300"
                  >
                    <Smartphone className="h-4 w-4" />
                    {t({ ar: 'أرسل الوصل على واتساب', fr: 'Envoyer le reçu sur WhatsApp', en: 'Send receipt on WhatsApp' })}
                  </a>
                </div>

                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <p className="text-xs font-bold tracking-normal text-muted-foreground">
                    {t({ ar: 'إرفاق وصل الدفع', fr: 'Joindre le reçu', en: 'Attach the receipt' })}
                  </p>
                  {receiptSent ? (
                    <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        {t({ ar: 'تم استلام الوصل. سيُفعّل الاشتراك بعد مراجعة الإدارة.', fr: 'Reçu reçu. L’abonnement sera activé après vérification.', en: 'Receipt received. The subscription will be activated after review.' })}
                      </span>
                    </div>
                  ) : (
                    <>
                      <label className="mt-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-background/60 px-3 py-6 text-center text-xs text-muted-foreground transition hover:border-primary/40">
                        <Upload className="h-6 w-6 text-primary" />
                        <span className="font-bold">
                          {receiptFile
                            ? receiptFile.name
                            : t({ ar: 'اختر صورة الوصل', fr: 'Choisir la photo du reçu', en: 'Choose receipt photo' })}
                        </span>
                        <span className="text-[10px]">JPG · PNG · WebP</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="sr-only"
                          onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={uploadReceipt}
                        disabled={!receiptFile || receiptBusy}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {receiptBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {t({ ar: 'إرسال الوصل', fr: 'Envoyer le reçu', en: 'Send receipt' })}
                      </button>
                      <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
                        {t({ ar: 'يُحفظ الوصل في حسابك ولا يظهر للزوار.', fr: 'Le reçu reste privé dans votre compte.', en: 'The receipt stays private in your account.' })}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment history */}
        {user && me && me.payments.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold">{t({ ar: 'سجل المدفوعات', fr: 'Historique des paiements', en: 'Payment history' })}</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
              {me.payments.map((payment) => (
                <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3 text-xs last:border-0">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {t(plans.find((plan) => plan.id === payment.plan)?.name || { ar: payment.plan, fr: payment.plan, en: payment.plan })}
                      <span className="ms-2 font-normal text-muted-foreground">{formatDzd(payment.amount, language)}</span>
                    </p>
                    <p className="mt-0.5 break-all font-mono text-[10px] text-muted-foreground" dir="ltr">{payment.reference}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{t(METHOD_LABEL[payment.method] || { ar: payment.method, fr: payment.method, en: payment.method })}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        payment.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : payment.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {t(STATUS_LABEL[payment.status] || { ar: payment.status, fr: payment.status, en: payment.status })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Guarantees */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: { ar: 'تفعيل بعد التحقق', fr: 'Activation vérifiée', en: 'Verified activation' },
              text: { ar: 'كل وصل تحويل يُراجع يدوياً قبل التفعيل.', fr: 'Chaque reçu est vérifié avant activation.', en: 'Every transfer receipt is checked before activation.' },
            },
            {
              icon: BadgeCheck,
              title: { ar: 'بدون تجديد تلقائي', fr: 'Sans renouvellement auto', en: 'No auto-renewal' },
              text: { ar: 'لا نخصم أي مبلغ إلا عندما تختار التمديد.', fr: 'Aucun débit sans votre demande de prolongation.', en: 'Nothing is charged unless you choose to extend.' },
            },
            {
              icon: Smartphone,
              title: { ar: 'دعم مباشر', fr: 'Support direct', en: 'Direct support' },
              text: { ar: 'أي مشكلة في الدفع؟ راسلنا على واتساب.', fr: 'Un souci de paiement ? Écrivez-nous sur WhatsApp.', en: 'A payment problem? Message us on WhatsApp.' },
            },
          ].map((item) => (
            <div key={item.title.en} className="rounded-2xl border border-border bg-card p-5">
              <item.icon className="h-5 w-5 text-primary" />
              <p className="mt-2 text-sm font-bold">{t(item.title)}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(item.text)}</p>
            </div>
          ))}
        </div>
      </div>

      {authOpen && (
        <LoginPage
          onClose={() => setAuthOpen(false)}
          onAuthenticated={() => {
            setAuthOpen(false);
            void loadMe();
          }}
        />
      )}
    </div>
  );
}

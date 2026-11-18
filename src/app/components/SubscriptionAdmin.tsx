import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldOff,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { api, type SubscriptionPlan, type SubscriptionPlanId } from '../utils/api';

type AdminPayment = {
  id: string;
  plan: SubscriptionPlanId;
  amount: number;
  method: 'chargily' | 'ccp' | 'baridimob' | 'admin';
  status: string;
  reference: string;
  note: string | null;
  hasProof: boolean;
  proofUrl: string | null;
  paidAt: string | null;
  createdAt: string;
  user: { id: string; email: string; name: string };
};

type AdminSubscription = {
  id: string;
  plan: SubscriptionPlanId;
  status: string;
  price: number;
  startsAt: string | null;
  endsAt: string | null;
  user: { id: string; email: string; name: string };
};

const numberFormat = new Intl.NumberFormat('en-US');
const money = (value: number) => `${numberFormat.format(Math.round(value))} DA`;

function formatDate(value: string | null, language: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(
    language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' },
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  failed: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  expired: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  cancelled: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export function SubscriptionAdmin() {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState<'pending' | 'paid' | 'all'>('pending');
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [grantEmail, setGrantEmail] = useState('');
  const [grantPlan, setGrantPlan] = useState<SubscriptionPlanId>('monthly');
  const [granting, setGranting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, subsRes, plansRes] = await Promise.all([
        api.subscription.admin.payments(filter === 'all' ? undefined : filter),
        api.subscription.admin.subscriptions(),
        api.subscription.plans(),
      ]);
      setPayments(paymentsRes.payments || []);
      setSubscriptions(subsRes.subscriptions || []);
      setPlans(plansRes.plans || []);
    } catch {
      toast.error(
        t({
          ar: 'تعذر تحميل بيانات الاشتراكات.',
          fr: 'Impossible de charger les abonnements.',
          en: 'Could not load subscription data.',
        }),
      );
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const confirmPayment = async (payment: AdminPayment) => {
    setBusyId(payment.id);
    try {
      await api.subscription.admin.confirm(payment.id);
      toast.success(
        t({
          ar: `تم تفعيل اشتراك ${payment.user.email}.`,
          fr: `Abonnement activé pour ${payment.user.email}.`,
          en: `Subscription activated for ${payment.user.email}.`,
        }),
      );
      await load();
    } catch (err: any) {
      toast.error(
        err?.code === 'already_paid'
          ? t({ ar: 'هذا الدفع مفعّل مسبقاً.', fr: 'Ce paiement est déjà activé.', en: 'This payment is already activated.' })
          : t({ ar: 'تعذر تفعيل الدفع.', fr: 'Activation impossible.', en: 'Could not activate the payment.' }),
      );
    } finally {
      setBusyId(null);
    }
  };

  const rejectPayment = async (payment: AdminPayment) => {
    setBusyId(payment.id);
    try {
      await api.subscription.admin.reject(payment.id);
      toast.success(t({ ar: 'تم رفض الدفع.', fr: 'Paiement refusé.', en: 'Payment rejected.' }));
      await load();
    } catch {
      toast.error(t({ ar: 'تعذر رفض الدفع.', fr: 'Refus impossible.', en: 'Could not reject the payment.' }));
    } finally {
      setBusyId(null);
    }
  };

  const cancelSubscription = async (subscription: AdminSubscription) => {
    if (!window.confirm(
      t({
        ar: `إلغاء اشتراك ${subscription.user.email}؟`,
        fr: `Annuler l’abonnement de ${subscription.user.email} ?`,
        en: `Cancel the subscription of ${subscription.user.email}?`,
      }),
    )) return;
    setBusyId(subscription.id);
    try {
      await api.subscription.admin.cancel(subscription.user.id);
      toast.success(t({ ar: 'تم إلغاء الاشتراك.', fr: 'Abonnement annulé.', en: 'Subscription cancelled.' }));
      await load();
    } catch {
      toast.error(t({ ar: 'تعذر الإلغاء.', fr: 'Annulation impossible.', en: 'Could not cancel.' }));
    } finally {
      setBusyId(null);
    }
  };

  const grant = async () => {
    const email = grantEmail.trim();
    if (!email) {
      toast.error(t({ ar: 'أدخل بريد الحساب.', fr: 'Saisissez l’e-mail du compte.', en: 'Enter the account email.' }));
      return;
    }
    setGranting(true);
    try {
      await api.subscription.admin.grant({ email, plan: grantPlan });
      toast.success(
        t({
          ar: `تم منح اشتراك ${email} يدوياً.`,
          fr: `Abonnement accordé manuellement à ${email}.`,
          en: `Subscription granted manually to ${email}.`,
        }),
      );
      setGrantEmail('');
      await load();
    } catch (err: any) {
      toast.error(
        err?.code === 'no_account'
          ? t({ ar: 'لا يوجد حساب بهذا البريد.', fr: 'Aucun compte avec cet e-mail.', en: 'No account with that email.' })
          : t({ ar: 'تعذر منح الاشتراك.', fr: 'Impossible d’accorder l’abonnement.', en: 'Could not grant the subscription.' }),
      );
    } finally {
      setGranting(false);
    }
  };

  const planName = (id: SubscriptionPlanId) =>
    t(plans.find((plan) => plan.id === id)?.name || { ar: id, fr: id, en: id });

  return (
    <div className="space-y-6">
      {/* Filters + refresh */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <div className="flex flex-wrap gap-2">
          {(['pending', 'paid', 'all'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                filter === value
                  ? 'bg-primary text-slate-950'
                  : 'bg-slate-800 text-white/70 hover:bg-slate-700'
              }`}
            >
              {value === 'pending'
                ? t({ ar: 'بانتظار التفعيل', fr: 'À activer', en: 'Awaiting activation' })
                : value === 'paid'
                  ? t({ ar: 'المدفوعة', fr: 'Payés', en: 'Paid' })
                  : t({ ar: 'الكل', fr: 'Tous', en: 'All' })}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/80 transition hover:bg-slate-800 disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t({ ar: 'تحديث', fr: 'Actualiser', en: 'Refresh' })}
        </button>
      </div>

      {/* Grant manually */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <UserPlus className="h-4 w-4 text-primary" />
          {t({ ar: 'منح اشتراك يدوياً', fr: 'Accorder un abonnement', en: 'Grant a subscription' })}
        </div>
        <p className="mt-1 text-[11px] text-white/50">
          {t({
            ar: 'للتجار الذين دفعوا خارج الموقع أو عبر تحويل يدوي. يُفعّل الحساب مباشرة.',
            fr: 'Pour les clients payés hors site ou par virement manuel. Active le compte immédiatement.',
            en: 'For customers who paid outside the site or by manual transfer. Activates the account immediately.',
          })}
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={grantEmail}
            onChange={(event) => setGrantEmail(event.target.value)}
            placeholder={t({ ar: 'بريد الحساب', fr: 'E-mail du compte', en: 'Account email' })}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-primary/60"
            dir="ltr"
          />
          <select
            value={grantPlan}
            onChange={(event) => setGrantPlan(event.target.value as SubscriptionPlanId)}
            className="rounded-xl border border-white/10 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {t(plan.name)} — {money(plan.price)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => void grant()}
            disabled={granting || !grantEmail.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t({ ar: 'تفعيل', fr: 'Activer', en: 'Activate' })}
          </button>
        </div>
      </div>

      {/* Payments */}
      <div>
        <h2 className="text-lg font-black text-white">
          {t({ ar: 'مدفوعات الاشتراكات', fr: 'Paiements d’abonnement', en: 'Subscription payments' })}
        </h2>
        {loading && payments.length === 0 ? (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-white/60">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t({ ar: 'جارٍ التحميل…', fr: 'Chargement…', en: 'Loading…' })}
          </div>
        ) : payments.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-white/50">
            {filter === 'pending'
              ? t({ ar: 'لا توجد مدفوعات بانتظار التفعيل.', fr: 'Aucun paiement à activer.', en: 'No payments awaiting activation.' })
              : t({ ar: 'لا توجد مدفوعات بعد.', fr: 'Aucun paiement pour le moment.', en: 'No payments yet.' })}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {payments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-white">
                      {payment.user.name || payment.user.email}
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[payment.status] || STATUS_STYLE.expired}`}>
                        {payment.status}
                      </span>
                    </p>
                    <p className="mt-0.5 break-all text-[11px] text-white/50" dir="ltr">{payment.user.email}</p>
                    <p className="mt-1 text-xs text-white/70">
                      {planName(payment.plan)} · {money(payment.amount)} · {payment.method.toUpperCase()}
                    </p>
                    <p className="mt-0.5 break-all font-mono text-[10px] text-white/40" dir="ltr">{payment.reference}</p>
                    <p className="mt-0.5 text-[10px] text-white/40">{formatDate(payment.createdAt, language)}</p>
                    {payment.note && <p className="mt-1 text-[11px] text-white/60">{payment.note}</p>}
                    {payment.proofUrl && (
                      <a
                        href={payment.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-sky-300 transition hover:bg-slate-800"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {t({ ar: 'عرض الوصل', fr: 'Voir le reçu', en: 'View receipt' })}
                      </a>
                    )}
                  </div>
                  {payment.status === 'pending' && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => void confirmPayment(payment)}
                        disabled={busyId === payment.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/30 transition hover:bg-emerald-500/25 disabled:opacity-50"
                      >
                        {busyId === payment.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        {t({ ar: 'تفعيل', fr: 'Activer', en: 'Activate' })}
                      </button>
                      <button
                        type="button"
                        onClick={() => void rejectPayment(payment)}
                        disabled={busyId === payment.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 ring-1 ring-rose-500/30 transition hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        {t({ ar: 'رفض', fr: 'Refuser', en: 'Reject' })}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Subscriptions */}
      <div>
        <h2 className="text-lg font-black text-white">
          {t({ ar: 'الاشتراكات', fr: 'Abonnements', en: 'Subscriptions' })}
        </h2>
        {subscriptions.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-sm text-white/50">
            {t({ ar: 'لا توجد اشتراكات بعد.', fr: 'Aucun abonnement pour le moment.', en: 'No subscriptions yet.' })}
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 px-4 py-3 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{subscription.user.name || subscription.user.email}</p>
                  <p className="break-all text-[11px] text-white/40" dir="ltr">{subscription.user.email}</p>
                  <p className="mt-1 text-xs text-white/70">
                    {planName(subscription.plan)} · {money(subscription.price)} · {t({ ar: 'حتى', fr: 'jusqu’au', en: 'until' })} {formatDate(subscription.endsAt, language)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[subscription.status] || STATUS_STYLE.expired}`}>
                    {subscription.status}
                  </span>
                  {subscription.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => void cancelSubscription(subscription)}
                      disabled={busyId === subscription.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-2.5 py-1.5 text-[11px] font-bold text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      <ShieldOff className="h-3 w-3" />
                      {t({ ar: 'إلغاء', fr: 'Annuler', en: 'Cancel' })}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="flex items-center gap-2 text-[11px] leading-relaxed text-white/40">
        <CreditCard className="h-3.5 w-3.5" />
        {t({
          ar: 'دفع Chargily يُفعّل تلقائياً عبر webhook. تحويل CCP/BaridiMob يبقى بانتظار مراجعتك للوصل.',
          fr: 'Chargily active automatiquement via webhook. Les virements CCP/BaridiMob attendent votre vérification.',
          en: 'Chargily activates automatically via webhook. CCP/BaridiMob transfers wait for your receipt review.',
        })}
      </p>
    </div>
  );
}

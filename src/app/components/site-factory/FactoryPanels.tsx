import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Loader2,
  MessageCircle,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api, resolveApiUrl } from '../../utils/api';
import { PaymentDetails, ReceiptBox, StatusPill, MetaRow } from './FactoryShared';
import {
  formatDate,
  money,
  pickLocalized,
  templateName,
  waLink,
  type Draft,
  type FactoryConfig,
  type FactoryResult,
  type FactorySettings,
  type Localized,
} from './factoryUtils';

const EVENT_LABELS: Record<string, Localized> = {
  created: {
    ar: 'تم إنشاء الطلب وتوليد المعاينة المجانية.',
    fr: 'Demande créée et aperçu gratuit généré.',
    en: 'Request created and free preview generated.',
  },
  'status:new': { ar: 'تم استلام الطلب.', fr: 'Demande reçue.', en: 'Request received.' },
  'status:awaiting-payment': {
    ar: 'بانتظار دفع الدفعة الأولى وتأكيدها.',
    fr: 'En attente du premier versement.',
    en: 'Waiting for the first payment.',
  },
  'status:payment-review': {
    ar: 'تم استلام وصل الدفع وهو قيد المراجعة.',
    fr: 'Reçu reçu, en cours de vérification.',
    en: 'Receipt received and under review.',
  },
  'status:confirmed': {
    ar: 'تم تأكيد الدفع، جاري تجهيز الموقع.',
    fr: 'Paiement confirmé, préparation du site.',
    en: 'Payment confirmed, preparing the site.',
  },
  'status:published': {
    ar: 'تم نشر الموقع.',
    fr: 'Site publié.',
    en: 'Site published.',
  },
  'status:rejected': {
    ar: 'تم رفض الطلب. تواصل معنا للمزيد من المعلومات.',
    fr: 'Demande rejetée. Contactez-nous pour plus d’informations.',
    en: 'Request rejected. Contact us for details.',
  },
  receipt: {
    ar: 'تم استلام وصل الدفع.',
    fr: 'Reçu de paiement reçu.',
    en: 'Payment receipt received.',
  },
  'publish-pending': {
    ar: 'تم تجهيز الموقع، بانتظار النشر النهائي.',
    fr: 'Site prêt, en attente de publication.',
    en: 'Site ready, waiting to be published.',
  },
  'publish-failed': {
    ar: 'تعذر النشر التلقائي، نعالج المشكلة.',
    fr: 'La publication automatique a échoué, nous corrigeons.',
    en: 'Automatic publishing failed, we are fixing it.',
  },
  published: {
    ar: 'تم نشر الموقع بنجاح.',
    fr: 'Site publié avec succès.',
    en: 'Site published successfully.',
  },
  regenerated: {
    ar: 'تم تحديث ملفات الموقع.',
    fr: 'Fichiers du site mis à jour.',
    en: 'Site files regenerated.',
  },
  'site-suspended': {
    ar: 'تم تعليق الموقع مؤقتاً.',
    fr: 'Site temporairement suspendu.',
    en: 'Site temporarily suspended.',
  },
  'site-published': {
    ar: 'تم إعادة تفعيل الموقع.',
    fr: 'Site réactivé.',
    en: 'Site reactivated.',
  },
  'site-preview': {
    ar: 'تم تحويل الموقع إلى المعاينة.',
    fr: 'Site repassé en aperçu.',
    en: 'Site switched back to preview.',
  },
};

const STATUS_HINT: Record<string, Localized> = {
  new: {
    ar: 'سنراجع طلبك ونتواصل معك عبر واتساب لتأكيد التفاصيل والدفع.',
    fr: 'Nous vérifions votre demande et vous contactons sur WhatsApp pour confirmer.',
    en: 'We are reviewing your request and will contact you on WhatsApp to confirm.',
  },
  'awaiting-payment': {
    ar: 'أرسل الدفعة الأولى عبر CCP أو BaridiMob، ثم ارفع صورة الوصل هنا.',
    fr: 'Envoyez le premier versement par CCP ou BaridiMob, puis téléversez le reçu ici.',
    en: 'Send the first payment via CCP or BaridiMob, then upload the receipt here.',
  },
  'payment-review': {
    ar: 'وصل الدفع قيد المراجعة. سنؤكد الطلب ونبدأ تجهيز الموقع بعد التحقق.',
    fr: 'Le reçu est en cours de vérification. Nous confirmerons puis préparerons le site.',
    en: 'Your receipt is being reviewed. We will confirm and start building the site.',
  },
  confirmed: {
    ar: 'تم تأكيد الدفع. جاري تجهيز موقعك، وستصلك رسالة عند نشره.',
    fr: 'Paiement confirmé. Votre site est en préparation, vous serez notifié à la publication.',
    en: 'Payment confirmed. Your site is being prepared; you will be notified when it goes live.',
  },
  published: {
    ar: 'موقعك منشور الآن. شارك الرابط مع عملائك!',
    fr: 'Votre site est en ligne. Partagez le lien avec vos clients !',
    en: 'Your site is live. Share the link with your clients!',
  },
  rejected: {
    ar: 'لم نتمكن من قبول الطلب. راجع ملاحظة الإدارة أو تواصل معنا.',
    fr: 'La demande n’a pas été acceptée. Consultez la note ou contactez-nous.',
    en: 'The request was not accepted. Check the admin note or contact us.',
  },
};

export function SuccessPanel({
  result,
  draft,
  config,
  onTrack,
  onNew,
}: {
  result: FactoryResult;
  draft: Draft;
  config: FactoryConfig;
  onTrack: () => void;
  onNew: () => void;
}) {
  const { t, language } = useLanguage();
  const settings = config.settings;
  const deposit = Math.round((Number(result.price) || 0) * (settings.depositPercent / 100));
  const previewUrl = resolveApiUrl(result.previewUrl);
  const template = config.templates.find((item) => item.slug === draft.templateSlug);
  const whatsapp = waLink(
    settings,
    t({
      ar: `مرحباً، أرسلت طلب موقع جديد.\nالمرجع: ${result.ref}\nالاسم: ${draft.siteName}\nالنطاق: ${result.subdomain}.pages.dev`,
      fr: `Bonjour, j’ai envoyé une demande de site.\nRéférence : ${result.ref}\nNom : ${draft.siteName}\nDomaine : ${result.subdomain}.pages.dev`,
      en: `Hello, I submitted a website request.\nReference: ${result.ref}\nName: ${draft.siteName}\nDomain: ${result.subdomain}.pages.dev`,
    }),
  );

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/5">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-5 py-8 text-center text-white sm:px-10">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h2 className="mt-4 text-2xl font-black sm:text-3xl">
              {t({ ar: 'تم استلام طلبك بنجاح', fr: 'Votre demande est bien reçue', en: 'Your request was received' })}
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/80">
              {t({
                ar: 'معاينتك المجانية جاهزة الآن. راجعها، ثم أرسل وصل الدفعة الأولى لنتابع تجهيز موقعك ونشره.',
                fr: 'Votre aperçu gratuit est prêt. Vérifiez-le puis envoyez le reçu du premier versement.',
                en: 'Your free preview is ready. Review it, then send the first payment receipt.',
              })}
            </p>
            <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 ring-1 ring-white/20">
              <span className="text-xs text-white/70">{t({ ar: 'رقم الطلب', fr: 'Référence', en: 'Reference' })}</span>
              <span className="font-mono text-lg font-black tracking-wide" dir="ltr">
                {result.ref}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-8">
          <div className="rounded-2xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t({ ar: 'معاينة مجانية قبل الدفع', fr: 'Aperçu gratuit avant paiement', en: 'Free preview before payment' })}
                </p>
                <p className="mt-0.5 text-lg font-black">{result.subdomain}.pages.dev</p>
              </div>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
              >
                <Eye className="h-4 w-4" />
                {t({ ar: 'فتح المعاينة', fr: 'Ouvrir l’aperçu', en: 'Open preview' })}
              </a>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              {t({
                ar: 'المعاينة تحمل علامة مائية وتُحدّث تلقائياً بعد أي تعديل. تُزال العلامة عند النشر.',
                fr: 'L’aperçu est filigrané et se met à jour automatiquement. Le filigrane disparaît à la publication.',
                en: 'The preview is watermarked and updates automatically. The watermark is removed on publish.',
              })}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[11px] text-muted-foreground">{t({ ar: 'القالب', fr: 'Modèle', en: 'Template' })}</p>
              <p className="mt-1 text-sm font-bold">{templateName(template, language) || '—'}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[11px] text-muted-foreground">{t({ ar: 'المبلغ الإجمالي', fr: 'Total', en: 'Total' })}</p>
              <p className="mt-1 text-sm font-bold">{money(result.price, language)}</p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[11px] text-muted-foreground">{t({ ar: 'الحالة', fr: 'Statut', en: 'Status' })}</p>
              <div className="mt-1">
                <StatusPill status={result.status} />
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h3 className="mb-2.5 flex items-center gap-2 text-sm font-black">
                <ShieldCheck className="h-4 w-4 text-primary" />
                {t({ ar: 'الدفع', fr: 'Paiement', en: 'Payment' })}
              </h3>
              <PaymentDetails settings={settings} amount={deposit} />
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  {t({ ar: 'أرسل تفاصيل الطلب عبر واتساب', fr: 'Envoyer les détails sur WhatsApp', en: 'Send details on WhatsApp' })}
                </a>
              )}
            </div>
            <div>
              <h3 className="mb-2.5 flex items-center gap-2 text-sm font-black">
                <FileText className="h-4 w-4 text-primary" />
                {t({ ar: 'إثبات الدفع', fr: 'Preuve de paiement', en: 'Proof of payment' })}
              </h3>
              <ReceiptBox refCode={result.ref} defaultContact={draft.phone} settings={settings} />
            </div>
          </div>

          <div className="rounded-xl bg-sky-500/10 p-3.5 text-xs leading-relaxed text-sky-800 dark:text-sky-200">
            <p className="font-bold">
              {t({ ar: 'ماذا بعد؟', fr: 'Et ensuite ?', en: 'What happens next?' })}
            </p>
            <p className="mt-1">
              {t({
                ar: 'بعد التحقق من الوصل نؤكد الطلب وننشر موقعك على النطاق المجاني. يمكنك متابعة كل خطوة من صفحة تتبع الطلب بنفس المرجع ورقم الهاتف.',
                fr: 'Après vérification du reçu, nous confirmons et publions votre site sur le domaine gratuit. Suivez chaque étape avec la référence et votre téléphone.',
                en: 'After verifying the receipt, we confirm and publish your site on the free domain. Track every step with your reference and phone.',
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onTrack}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-muted"
            >
              <Search className="h-4 w-4" />
              {t({ ar: 'تتبع الطلب', fr: 'Suivre la demande', en: 'Track request' })}
            </button>
            <button
              type="button"
              onClick={onNew}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold hover:bg-muted"
            >
              <Rocket className="h-4 w-4" />
              {t({ ar: 'طلب موقع آخر', fr: 'Nouvelle demande', en: 'New request' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrackingPanel({
  initialRef,
  initialContact,
  config,
  onBack,
}: {
  initialRef: string;
  initialContact: string;
  config: FactoryConfig;
  onBack: () => void;
}) {
  const { t, language } = useLanguage();
  const [refInput, setRefInput] = useState(initialRef);
  const [contactInput, setContactInput] = useState(initialContact);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = useCallback(
    async (refValue: string, contactValue: string) => {
      const ref = refValue.trim().toUpperCase();
      const contact = contactValue.trim();
      if (!ref || !contact) {
        setError(
          t({
            ar: 'أدخل رقم الطلب ورقم الهاتف أو البريد.',
            fr: 'Entrez la référence et le téléphone ou l’e-mail.',
            en: 'Enter the reference and the phone or email.',
          }),
        );
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await api.siteFactory.track(ref, contact);
        setData(response);
      } catch (err: any) {
        setData(null);
        setError(err?.message || t({ ar: 'تعذر جلب الطلب.', fr: 'Impossible de charger la demande.', en: 'Could not load the request.' }));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    if (initialRef && initialContact) {
      void lookup(initialRef, initialContact);
    }
    // Only run for the initial deep link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settings: FactorySettings = data?.payment || config.settings;
  const deposit = data ? Math.round((Number(data.price) || 0) * ((settings.depositPercent || 50) / 100)) : 0;
  const siteUrl = data?.site?.url && data.site.status === 'published' ? data.site.url : '';
  const previewUrl = data?.previewUrl ? resolveApiUrl(data.previewUrl) : '';

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t({ ar: 'العودة لطلب موقع', fr: 'Retour à la demande', en: 'Back to request' })}
        </button>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Search className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-black">{t({ ar: 'تتبع طلبك', fr: 'Suivre votre demande', en: 'Track your request' })}</h2>
            <p className="text-xs text-muted-foreground">
              {t({
                ar: 'أدخل رقم الطلب ورقم الهاتف أو البريد الذي استعملته.',
                fr: 'Utilisez la référence et le téléphone ou l’e-mail de la demande.',
                en: 'Use the reference and the phone or email from your request.',
              })}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">
              {t({ ar: 'رقم الطلب', fr: 'Référence', en: 'Reference' })}
            </span>
            <input
              value={refInput}
              onChange={(event) => setRefInput(event.target.value.toUpperCase())}
              placeholder="WEB-20261029-AB12"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              dir="ltr"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">
              {t({ ar: 'الهاتف أو البريد', fr: 'Téléphone ou e-mail', en: 'Phone or email' })}
            </span>
            <input
              value={contactInput}
              onChange={(event) => setContactInput(event.target.value)}
              placeholder="0674113290"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
              dir="ltr"
            />
          </label>
          <button
            type="button"
            onClick={() => lookup(refInput, contactInput)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {t({ ar: 'بحث', fr: 'Rechercher', en: 'Search' })}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-rose-500/10 px-3.5 py-3 text-sm font-semibold text-rose-700 dark:text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-muted/50 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t({ ar: 'جاري جلب الطلب...', fr: 'Chargement...', en: 'Loading request...' })}
          </div>
        )}

        {data && !loading && (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-muted-foreground" dir="ltr">
                    {data.ref}
                  </p>
                  <h3 className="mt-1 text-lg font-black">{data.siteName}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {data.subdomain}.pages.dev
                    {data.customDomain ? ` • ${data.customDomain}` : ''}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusPill status={data.status} />
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(data.createdAt, language)}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    {t({ ar: 'المعاينة', fr: 'Aperçu', en: 'Preview' })}
                  </a>
                )}
                {siteUrl && (
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {t({ ar: 'فتح الموقع', fr: 'Ouvrir le site', en: 'Open site' })}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => lookup(refInput, contactInput)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-bold hover:bg-muted"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t({ ar: 'تحديث', fr: 'Actualiser', en: 'Refresh' })}
                </button>
              </div>
            </div>

            {STATUS_HINT[data.status] && (
              <div className="flex items-start gap-2 rounded-xl bg-primary/5 px-4 py-3 text-sm leading-relaxed text-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t(STATUS_HINT[data.status])}</span>
              </div>
            )}

            {data.adminNote && (
              <div className="rounded-xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">
                  {t({ ar: 'ملاحظة الإدارة', fr: 'Note de l’administration', en: 'Admin note' })}
                </p>
                <p className="mt-1 leading-relaxed">{data.adminNote}</p>
              </div>
            )}

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h4 className="mb-2.5 flex items-center gap-2 text-sm font-black">
                  <Rocket className="h-4 w-4 text-primary" />
                  {t({ ar: 'سجل الطلب', fr: 'Historique', en: 'Timeline' })}
                </h4>
                <div className="space-y-3">
                  {(data.events || []).map((event: any, index: number) => (
                    <div key={index} className="flex gap-2.5">
                      <div className="flex flex-col items-center">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        {index < data.events.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                      </div>
                      <div className="pb-1">
                        <p className="text-xs font-semibold leading-relaxed">
                          {EVENT_LABELS[event.type] ? t(EVENT_LABELS[event.type]) : event.message}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(event.createdAt, language)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {['new', 'awaiting-payment', 'payment-review', 'confirmed'].includes(data.status) && (
                  <div>
                    <h4 className="mb-2.5 flex items-center gap-2 text-sm font-black">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      {t({ ar: 'الدفع', fr: 'Paiement', en: 'Payment' })}
                    </h4>
                    <PaymentDetails settings={settings} amount={deposit} />
                  </div>
                )}

                {data.status !== 'rejected' && data.status !== 'published' && (
                  <ReceiptBox
                    refCode={data.ref}
                    defaultContact={contactInput}
                    settings={settings}
                    onUploaded={() => lookup(refInput, contactInput)}
                  />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-xs text-muted-foreground">
              <MetaRow
                label={t({ ar: 'الباقة', fr: 'Offre', en: 'Package' })}
                value={data.packageSlug}
              />
              <div className="mt-1.5">
                <MetaRow
                  label={t({ ar: 'المبلغ', fr: 'Montant', en: 'Amount' })}
                  value={money(data.price, language)}
                />
              </div>
            </div>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="mt-6 rounded-xl border border-dashed border-border px-4 py-8 text-center">
            <Search className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm font-semibold">
              {t({ ar: 'أدخل معلوماتك لعرض حالة الطلب', fr: 'Entrez vos informations pour voir le statut', en: 'Enter your details to see the status' })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

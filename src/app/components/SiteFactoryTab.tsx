import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Ban,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileArchive,
  FileText,
  Globe,
  History,
  LayoutTemplate,
  Loader2,
  Mail,
  MapPin,
  Package as PackageIcon,
  Phone,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Search,
  Settings,
  ShoppingBag,
  Trash2,
  UploadCloud,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { api, getAccessToken } from '../utils/api';
import { formatDate, money, type Lang, type Localized } from './site-factory/factoryUtils';

type FactoryView = 'requests' | 'sites' | 'templates' | 'packages' | 'settings';

const REQUEST_STATUSES = ['new', 'awaiting-payment', 'payment-review', 'confirmed', 'published', 'rejected'] as const;
type RequestStatus = (typeof REQUEST_STATUSES)[number];

const STATUS_LABELS: Record<string, Localized> = {
  new: { ar: 'جديد', fr: 'Nouveau', en: 'New' },
  'awaiting-payment': { ar: 'بانتظار الدفع', fr: 'En attente de paiement', en: 'Awaiting payment' },
  'payment-review': { ar: 'مراجعة الوصل', fr: 'Reçu en vérification', en: 'Receipt review' },
  confirmed: { ar: 'تم تأكيد الدفع', fr: 'Paiement confirmé', en: 'Payment confirmed' },
  published: { ar: 'منشور', fr: 'Publié', en: 'Published' },
  rejected: { ar: 'مرفوض', fr: 'Rejeté', en: 'Rejected' },
};

const STATUS_CLASSES: Record<string, string> = {
  new: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  'awaiting-payment': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'payment-review': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  confirmed: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  published: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  preview: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  ready: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  suspended: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

const inputCls =
  'w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white placeholder-white/25 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[11px] font-semibold text-white/45">{children}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useLanguage();
  const label = STATUS_LABELS[status] || { ar: status, fr: status, en: status };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        STATUS_CLASSES[status] || STATUS_CLASSES.preview
      }`}
    >
      {t(label)}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-white/45">{label}</p>
    </div>
  );
}

function LocalizedFields({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: Localized;
  onChange: (value: Localized) => void;
  multiline?: boolean;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="grid gap-2 sm:grid-cols-3">
        {(['ar', 'fr', 'en'] as const).map((lang) => (
          <div key={lang} className="relative">
            <span className="absolute end-2 top-2 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-white/35">
              {lang}
            </span>
            {multiline ? (
              <textarea
                value={value[lang] || ''}
                onChange={(event) => onChange({ ...value, [lang]: event.target.value })}
                rows={3}
                className={`${inputCls} resize-none pe-8`}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              />
            ) : (
              <input
                value={value[lang] || ''}
                onChange={(event) => onChange({ ...value, [lang]: event.target.value })}
                className={`${inputCls} pe-8`}
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function featuresToText(features: any): string {
  let list: any = features;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      return features;
    }
  }
  if (!Array.isArray(list)) return '';
  return list
    .map((feature: any) => {
      if (typeof feature === 'string') return feature;
      return [feature?.ar || '', feature?.fr || '', feature?.en || ''].join(' | ');
    })
    .join('\n');
}

function textToFeatures(text: string): Localized[] {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((line) => {
      const [ar, fr, en] = line.split('|').map((part) => part.trim());
      return { ar: ar || fr || en || '', fr: fr || ar || '', en: en || ar || '' };
    });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function SiteFactoryTab() {
  const { t, language } = useLanguage();
  const lang = language as Lang;
  const [view, setView] = useState<FactoryView>('requests');
  const [stats, setStats] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsMeta, setRequestsMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState('');
  const [manualUrl, setManualUrl] = useState('');

  const [sites, setSites] = useState<any[]>([]);
  const [sitesLoaded, setSitesLoaded] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateDrafts, setTemplateDrafts] = useState<Record<string, any>>({});
  const [packages, setPackages] = useState<any[]>([]);
  const [packageDrafts, setPackageDrafts] = useState<Record<string, any>>({});
  const [settings, setSettings] = useState<any>(null);
  const [settingsDraft, setSettingsDraft] = useState<any>(null);
  const [cloudflareConfigured, setCloudflareConfigured] = useState(false);
  const [newPackage, setNewPackage] = useState({ slug: '', ar: '', fr: '', en: '', price: '', deliveryDays: '5' });
  const [showNewPackage, setShowNewPackage] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      setStats(await api.siteFactory.admin.stats());
    } catch {
      // Keep the rest of the panel usable when the server is cold.
    }
  }, []);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const response = await api.siteFactory.admin.requests({
        status: statusFilter,
        q: search.trim() || undefined,
        page,
        pageSize: 20,
      });
      setRequests(response.requests || []);
      setRequestsMeta({ total: response.total || 0, page: response.page || 1, pages: response.pages || 1 });
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر تحميل الطلبات.', fr: 'Impossible de charger les demandes.', en: 'Could not load requests.' }));
    } finally {
      setLoadingRequests(false);
    }
  }, [page, search, statusFilter, t]);

  useEffect(() => {
    void loadStats();
    void loadRequests();
  }, [loadRequests, loadStats]);

  useEffect(() => {
    if (view === 'sites' && !sitesLoaded) {
      setSitesLoaded(true);
      api.siteFactory.admin
        .sites()
        .then((response) => setSites(response.sites || []))
        .catch((error: any) => toast.error(error?.message || 'Sites'));
    }
    if (view === 'templates' && !templates.length) {
      api.siteFactory.admin
        .templates()
        .then((response) => {
          setTemplates(response.templates || []);
          setTemplateDrafts({});
        })
        .catch((error: any) => toast.error(error?.message || 'Templates'));
    }
    if (view === 'packages' && !packages.length) {
      api.siteFactory.admin
        .packages()
        .then((response) => {
          setPackages(response.packages || []);
          setPackageDrafts({});
        })
        .catch((error: any) => toast.error(error?.message || 'Packages'));
    }
    if (view === 'settings' && !settings) {
      api.siteFactory.admin
        .settings()
        .then((response) => {
          setSettings(response.settings);
          setSettingsDraft(response.settings);
          setCloudflareConfigured(Boolean(response.cloudflareConfigured));
        })
        .catch((error: any) => toast.error(error?.message || 'Settings'));
    }
  }, [view, sitesLoaded, templates.length, packages.length, settings]);

  async function openDetail(id: string) {
    setDetail(null);
    setNote('');
    setManualUrl('');
    setLoadingDetail(true);
    try {
      const response = await api.siteFactory.admin.request(id);
      setDetail(response);
      setNote(response.adminNote || '');
      setManualUrl(response.site?.url || '');
      // Reset cached filter counts when a new receipt may have arrived.
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر تحميل تفاصيل الطلب.', fr: 'Impossible de charger le détail.', en: 'Could not load request details.' }));
    } finally {
      setLoadingDetail(false);
    }
  }

  async function refreshDetail(id: string) {
    try {
      const response = await api.siteFactory.admin.request(id);
      setDetail(response);
    } catch {
      // Ignore refresh failures; the action itself already reported.
    }
  }

  async function changeStatus(status: RequestStatus) {
    if (!detail) return;
    setBusy(`status-${status}`);
    try {
      await api.siteFactory.admin.setStatus(detail.id, status, note.trim() || undefined);
      toast.success(
        t({
          ar: 'تم تحديث حالة الطلب.',
          fr: 'Statut de la demande mis à jour.',
          en: 'Request status updated.',
        }),
      );
      await Promise.all([refreshDetail(detail.id), loadRequests(), loadStats()]);
      if (view === 'sites') {
        const response = await api.siteFactory.admin.sites();
        setSites(response.sites || []);
      }
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر تحديث الحالة.', fr: 'Échec de la mise à jour.', en: 'Could not update status.' }));
    } finally {
      setBusy('');
    }
  }

  async function notifyPaymentRequest() {
    if (!detail) return;
    setBusy('status-awaiting');
    try {
      await api.siteFactory.admin.setStatus(
        detail.id,
        'awaiting-payment',
        note.trim() ||
          t({
            ar: 'أرسل الدفعة الأولى عبر CCP أو BaridiMob ثم ارفع صورة الوصل.',
            fr: 'Envoyez le premier versement par CCP ou BaridiMob puis téléversez le reçu.',
            en: 'Send the first payment via CCP or BaridiMob, then upload the receipt.',
          }),
      );
      toast.success(t({ ar: 'تم إرسال طلب الدفع.', fr: 'Demande de paiement envoyée.', en: 'Payment request sent.' }));
      await Promise.all([refreshDetail(detail.id), loadRequests(), loadStats()]);
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر تحديث الحالة.', fr: 'Échec de la mise à jour.', en: 'Could not update status.' }));
    } finally {
      setBusy('');
    }
  }

  async function publish() {
    if (!detail?.site?.id) return;
    setBusy('publish');
    try {
      const result = await api.siteFactory.admin.publish(detail.site.id);
      if (result?.ok) {
        toast.success(t({ ar: 'تم نشر الموقع بنجاح.', fr: 'Site publié avec succès.', en: 'Site published successfully.' }));
      } else if (result?.manual) {
        toast.warning(
          result?.message ||
            t({
              ar: 'تم تجهيز الموقع. حمّل ZIP وارفعه على Cloudflare Pages ثم أكد الرابط.',
              fr: 'Site prêt. Téléchargez le ZIP, uploadez sur Cloudflare Pages puis confirmez l’URL.',
              en: 'Site prepared. Download the ZIP, upload to Cloudflare Pages, then confirm the URL.',
            }),
        );
        setManualUrl(result?.url || detail.site.url || '');
      }
      await Promise.all([refreshDetail(detail.id), loadRequests(), loadStats()]);
      setSitesLoaded(false);
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'فشل النشر.', fr: 'Échec de la publication.', en: 'Publishing failed.' }));
    } finally {
      setBusy('');
    }
  }

  async function regenerate() {
    if (!detail?.site?.id) return;
    setBusy('regenerate');
    try {
      await api.siteFactory.admin.regenerate(detail.site.id);
      toast.success(t({ ar: 'تم تحديث ملفات الموقع.', fr: 'Fichiers du site régénérés.', en: 'Site files regenerated.' }));
      await refreshDetail(detail.id);
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر التحديث.', fr: 'Échec de la régénération.', en: 'Could not regenerate.' }));
    } finally {
      setBusy('');
    }
  }

  async function downloadZip() {
    if (!detail?.site?.id) return;
    setBusy('zip');
    try {
      const token = getAccessToken();
      const response = await fetch(api.siteFactory.admin.zipUrl(detail.site.id), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(`ZIP ${response.status}`);
      const blob = await response.blob();
      downloadBlob(blob, `${detail.subdomain}.zip`);
      toast.success(t({ ar: 'تم تحميل الملف.', fr: 'Archive téléchargée.', en: 'ZIP downloaded.' }));
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر تحميل ZIP.', fr: 'Échec du téléchargement ZIP.', en: 'Could not download ZIP.' }));
    } finally {
      setBusy('');
    }
  }

  async function markPublished() {
    if (!detail?.site?.id) return;
    setBusy('mark-published');
    try {
      await api.siteFactory.admin.markPublished(detail.site.id, manualUrl.trim() || undefined);
      toast.success(t({ ar: 'تم تأكيد النشر.', fr: 'Publication confirmée.', en: 'Publish confirmed.' }));
      await Promise.all([refreshDetail(detail.id), loadRequests(), loadStats()]);
      setSitesLoaded(false);
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر تأكيد النشر.', fr: 'Échec de la confirmation.', en: 'Could not confirm publishing.' }));
    } finally {
      setBusy('');
    }
  }

  async function toggleSite(status: 'published' | 'suspended' | 'preview') {
    if (!detail?.site?.id) return;
    setBusy(`site-${status}`);
    try {
      await api.siteFactory.admin.siteStatus(detail.site.id, status);
      toast.success(t({ ar: 'تم تحديث حالة الموقع.', fr: 'Statut du site mis à jour.', en: 'Site status updated.' }));
      await refreshDetail(detail.id);
      setSitesLoaded(false);
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر التحديث.', fr: 'Échec de la mise à jour.', en: 'Could not update.' }));
    } finally {
      setBusy('');
    }
  }

  function patchTemplate(id: string, patch: any) {
    setTemplateDrafts((previous) => ({ ...previous, [id]: { ...(previous[id] || {}), ...patch } }));
  }

  async function saveTemplate(template: any) {
    const draft = { ...template, ...(templateDrafts[template.id] || {}) };
    setBusy(`template-${template.id}`);
    try {
      const updated = await api.siteFactory.admin.updateTemplate(template.id, {
        nameAr: draft.nameAr,
        nameFr: draft.nameFr,
        nameEn: draft.nameEn,
        descAr: draft.descAr,
        descFr: draft.descFr,
        descEn: draft.descEn,
        accent: draft.accent,
        isActive: draft.isActive,
        sortOrder: draft.sortOrder,
      });
      setTemplates((previous) => previous.map((item) => (item.id === template.id ? updated : item)));
      setTemplateDrafts((previous) => {
        const next = { ...previous };
        delete next[template.id];
        return next;
      });
      toast.success(t({ ar: 'تم حفظ القالب.', fr: 'Modèle enregistré.', en: 'Template saved.' }));
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر الحفظ.', fr: 'Échec de l’enregistrement.', en: 'Could not save.' }));
    } finally {
      setBusy('');
    }
  }

  function patchPackage(id: string, patch: any) {
    setPackageDrafts((previous) => ({ ...previous, [id]: { ...(previous[id] || {}), ...patch } }));
  }

  async function savePackage(pack: any) {
    const draft = { ...pack, ...(packageDrafts[pack.id] || {}) };
    setBusy(`package-${pack.id}`);
    try {
      const updated = await api.siteFactory.admin.updatePackage(pack.id, {
        nameAr: draft.nameAr,
        nameFr: draft.nameFr,
        nameEn: draft.nameEn,
        descAr: draft.descAr,
        descFr: draft.descFr,
        descEn: draft.descEn,
        price: Number(draft.price) || 0,
        oldPrice: draft.oldPrice === '' || draft.oldPrice === null ? null : Number(draft.oldPrice) || 0,
        deliveryDays: Number(draft.deliveryDays) || 3,
        revisions: Number(draft.revisions) || 0,
        isPopular: !!draft.isPopular,
        isActive: draft.isActive !== false,
        features:
          typeof draft.featuresText === 'string' ? textToFeatures(draft.featuresText) : draft.features,
        sortOrder: Number(draft.sortOrder) || 0,
      });
      setPackages((previous) => previous.map((item) => (item.id === pack.id ? updated : item)));
      setPackageDrafts((previous) => {
        const next = { ...previous };
        delete next[pack.id];
        return next;
      });
      toast.success(t({ ar: 'تم حفظ الباقة.', fr: 'Offre enregistrée.', en: 'Package saved.' }));
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر الحفظ.', fr: 'Échec de l’enregistrement.', en: 'Could not save.' }));
    } finally {
      setBusy('');
    }
  }

  async function createPackage() {
    if (!newPackage.slug.trim() || !newPackage.price) {
      toast.error(t({ ar: 'أدخل المعرّف والسعر.', fr: 'Entrez l’identifiant et le prix.', en: 'Enter the slug and price.' }));
      return;
    }
    setBusy('create-package');
    try {
      const created = await api.siteFactory.admin.createPackage({
        slug: newPackage.slug.trim(),
        nameAr: newPackage.ar || newPackage.slug,
        nameFr: newPackage.fr || newPackage.ar || newPackage.slug,
        nameEn: newPackage.en || newPackage.ar || newPackage.slug,
        price: Number(newPackage.price) || 0,
        deliveryDays: Number(newPackage.deliveryDays) || 5,
        features: [],
        isActive: true,
      });
      setPackages((previous) => [...previous, created]);
      setNewPackage({ slug: '', ar: '', fr: '', en: '', price: '', deliveryDays: '5' });
      setShowNewPackage(false);
      toast.success(t({ ar: 'تم إنشاء الباقة.', fr: 'Offre créée.', en: 'Package created.' }));
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر الإنشاء.', fr: 'Échec de la création.', en: 'Could not create.' }));
    } finally {
      setBusy('');
    }
  }

  async function saveSettings() {
    if (!settingsDraft) return;
    setBusy('settings');
    try {
      const response = await api.siteFactory.admin.saveSettings(settingsDraft);
      setSettings(response.settings);
      setSettingsDraft(response.settings);
      toast.success(t({ ar: 'تم حفظ الإعدادات.', fr: 'Paramètres enregistrés.', en: 'Settings saved.' }));
    } catch (error: any) {
      toast.error(error?.message || t({ ar: 'تعذر الحفظ.', fr: 'Échec de l’enregistrement.', en: 'Could not save.' }));
    } finally {
      setBusy('');
    }
  }

  const statCards = useMemo(
    () => [
      {
        icon: PackageIcon,
        label: t({ ar: 'إجمالي الطلبات', fr: 'Demandes', en: 'Total requests' }),
        value: stats?.requests?.total ?? 0,
        tone: 'bg-sky-500/15 text-sky-300',
      },
      {
        icon: Wallet,
        label: t({ ar: 'بانتظار الدفع', fr: 'En attente', en: 'Awaiting payment' }),
        value: stats?.requests?.awaitingPayment ?? 0,
        tone: 'bg-amber-500/15 text-amber-300',
      },
      {
        icon: FileText,
        label: t({ ar: 'وصولات للمراجعة', fr: 'Reçus à vérifier', en: 'Receipts to review' }),
        value: stats?.requests?.paymentReview ?? 0,
        tone: 'bg-violet-500/15 text-violet-300',
      },
      {
        icon: CheckCircle2,
        label: t({ ar: 'منشورة', fr: 'Publiés', en: 'Published' }),
        value: stats?.requests?.published ?? 0,
        tone: 'bg-emerald-500/15 text-emerald-300',
      },
      {
        icon: Globe,
        label: t({ ar: 'مواقع', fr: 'Sites', en: 'Sites' }),
        value: stats?.sites ?? 0,
        tone: 'bg-indigo-500/15 text-indigo-300',
      },
      {
        icon: ShoppingBag,
        label: t({ ar: 'طلبات المواقع', fr: 'Commandes sites', en: 'Site orders' }),
        value: stats?.orders ?? 0,
        tone: 'bg-cyan-500/15 text-cyan-300',
      },
      {
        icon: Users,
        label: t({ ar: 'رسائل العملاء', fr: 'Leads', en: 'Leads' }),
        value: stats?.leads ?? 0,
        tone: 'bg-rose-500/15 text-rose-300',
      },
    ],
    [stats, t],
  );

  const tabs: Array<{ key: FactoryView; label: string; icon: any }> = [
    { key: 'requests', label: t({ ar: 'الطلبات', fr: 'Demandes', en: 'Requests' }), icon: FileText },
    { key: 'sites', label: t({ ar: 'المواقع', fr: 'Sites', en: 'Sites' }), icon: Globe },
    { key: 'templates', label: t({ ar: 'القوالب', fr: 'Modèles', en: 'Templates' }), icon: LayoutTemplate },
    { key: 'packages', label: t({ ar: 'الباقات والأسعار', fr: 'Offres & prix', en: 'Packages & prices' }), icon: Wallet },
    { key: 'settings', label: t({ ar: 'الإعدادات والدفع', fr: 'Réglages & paiement', en: 'Settings & payment' }), icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Rocket className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-black text-white">
              {t({ ar: 'مصنع المواقع', fr: 'Usine à sites', en: 'Website Factory' })}
            </h2>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-white/45">
              {t({
                ar: 'راجع الطلبات، أكّد الدفع، انشر المواقع على pages.dev، وأدر القوالب والباقات والأسعار.',
                fr: 'Vérifiez les demandes, confirmez le paiement, publiez sur pages.dev et gérez modèles, offres et prix.',
                en: 'Review requests, confirm payment, publish to pages.dev and manage templates, packages and prices.',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/create-website"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t({ ar: 'صفحة الطلب', fr: 'Page de commande', en: 'Order page' })}
          </a>
          <button
            type="button"
            onClick={() => {
              void loadStats();
              void loadRequests();
              setSitesLoaded(false);
              setTemplates([]);
              setPackages([]);
              setSettings(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t({ ar: 'تحديث', fr: 'Actualiser', en: 'Refresh' })}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        {statCards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setView(item.key)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition ${
                view === item.key
                  ? 'border-primary bg-primary text-slate-950'
                  : 'border-white/10 bg-slate-900 text-white/65 hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Requests */}
      {view === 'requests' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder={t({
                  ar: 'ابحث بالمرجع، الاسم، الهاتف أو النطاق...',
                  fr: 'Rechercher par référence, nom, téléphone ou domaine...',
                  en: 'Search by reference, name, phone or domain...',
                })}
                className={`${inputCls} ps-9`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as 'all' | RequestStatus);
                setPage(1);
              }}
              className={`${inputCls} lg:w-52`}
            >
              <option value="all">{t({ ar: 'كل الحالات', fr: 'Tous les statuts', en: 'All statuses' })}</option>
              {REQUEST_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(STATUS_LABELS[status])}
                </option>
              ))}
            </select>
            <span className="text-xs font-semibold text-white/40">
              {requestsMeta.total} {t({ ar: 'طلب', fr: 'demandes', en: 'requests' })}
            </span>
          </div>

          {loadingRequests ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-slate-900/60 py-16 text-sm text-white/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t({ ar: 'جاري التحميل...', fr: 'Chargement...', en: 'Loading...' })}
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 py-16 text-center">
              <FileText className="mx-auto mb-3 h-10 w-10 text-white/15" />
              <p className="text-sm font-semibold text-white/50">
                {t({ ar: 'لا توجد طلبات بهذه المعايير.', fr: 'Aucune demande pour ces critères.', en: 'No requests match these filters.' })}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <button
                  key={request.id}
                  type="button"
                  onClick={() => openDetail(request.id)}
                  className="block w-full rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-start transition hover:border-primary/40 hover:bg-slate-900"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={request.status} />
                    <span className="font-mono text-[11px] font-bold text-white/35" dir="ltr">
                      {request.ref}
                    </span>
                    {request.hasReceipt && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                        <Check className="h-3 w-3" />
                        {t({ ar: 'وصل مرفوع', fr: 'Reçu', en: 'Receipt' })}
                      </span>
                    )}
                    <span className="ms-auto text-[11px] text-white/35">{formatDate(request.createdAt, lang)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-black text-white">{request.siteName}</h3>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-white/40" dir="ltr">
                        {request.subdomain}.pages.dev
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-white/50" dir="ltr">
                        {request.phone}
                      </span>
                      <span className="font-bold text-primary">{money(request.price, lang)}</span>
                      <ArrowRight className="h-4 w-4 text-white/30 rtl:rotate-180" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {requestsMeta.pages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {t({ ar: 'السابق', fr: 'Précédent', en: 'Previous' })}
              </button>
              <span className="text-xs text-white/45">
                {requestsMeta.page} / {requestsMeta.pages}
              </span>
              <button
                type="button"
                disabled={page >= requestsMeta.pages}
                onClick={() => setPage((value) => Math.min(requestsMeta.pages, value + 1))}
                className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
              >
                {t({ ar: 'التالي', fr: 'Suivant', en: 'Next' })}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sites */}
      {view === 'sites' && (
        <div className="space-y-3">
          {sites.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 py-16 text-center">
              <Globe className="mx-auto mb-3 h-10 w-10 text-white/15" />
              <p className="text-sm font-semibold text-white/50">
                {t({ ar: 'لا توجد مواقع بعد.', fr: 'Aucun site pour le moment.', en: 'No sites yet.' })}
              </p>
            </div>
          ) : (
            sites.map((site) => (
              <div key={site.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={site.status} />
                  <span className="text-base font-black text-white">{site.name}</span>
                  <span className="font-mono text-[11px] text-white/40" dir="ltr">
                    {site.subdomain}.pages.dev
                  </span>
                  <button
                    type="button"
                    onClick={() => openDetail(site.request?.id || site.requestId)}
                    className="ms-auto inline-flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white/70 hover:bg-slate-800"
                  >
                    <FileText className="h-3 w-3" />
                    {t({ ar: 'الطلب', fr: 'Demande', en: 'Request' })}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-white/40">
                  <span>{site.request?.ref || '—'}</span>
                  <span dir="ltr">{site.request?.phone || ''}</span>
                  <span>{site._count?.orders || 0} {t({ ar: 'طلب', fr: 'commandes', en: 'orders' })}</span>
                  <span>{site._count?.leads || 0} {t({ ar: 'رسالة', fr: 'messages', en: 'leads' })}</span>
                  <span>{site._count?.products || 0} {t({ ar: 'منتج', fr: 'produits', en: 'products' })}</span>
                  {site.deployError && <span className="text-rose-300">{site.deployError.slice(0, 90)}</span>}
                  {site.url && (
                    <a href={site.url} target="_blank" rel="noopener noreferrer" className="ms-auto inline-flex items-center gap-1 font-bold text-primary">
                      {site.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Templates */}
      {view === 'templates' && (
        <div className="grid gap-4 xl:grid-cols-2">
          {templates.map((template) => {
            const draft = { ...template, ...(templateDrafts[template.id] || {}) };
            return (
              <div key={template.id} className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-lg" style={{ backgroundColor: draft.accent }} />
                    <span className="font-mono text-xs font-bold text-white/50">{template.slug}</span>
                  </div>
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-white/60">
                    <input
                      type="checkbox"
                      checked={draft.isActive !== false}
                      onChange={(event) => patchTemplate(template.id, { isActive: event.target.checked })}
                      className="h-4 w-4 accent-primary"
                    />
                    {t({ ar: 'مفعّل', fr: 'Actif', en: 'Active' })}
                  </label>
                </div>
                <LocalizedFields
                  label={t({ ar: 'اسم القالب', fr: 'Nom du modèle', en: 'Template name' })}
                  value={{ ar: draft.nameAr, fr: draft.nameFr, en: draft.nameEn }}
                  onChange={(value) =>
                    patchTemplate(template.id, { nameAr: value.ar, nameFr: value.fr, nameEn: value.en })
                  }
                />
                <LocalizedFields
                  label={t({ ar: 'الوصف', fr: 'Description', en: 'Description' })}
                  value={{ ar: draft.descAr, fr: draft.descFr, en: draft.descEn }}
                  onChange={(value) =>
                    patchTemplate(template.id, { descAr: value.ar, descFr: value.fr, descEn: value.en })
                  }
                  multiline
                />
                <div className="grid grid-cols-2 gap-3">
                  <label>
                    <FieldLabel>{t({ ar: 'اللون', fr: 'Couleur', en: 'Accent' })}</FieldLabel>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={draft.accent}
                        onChange={(event) => patchTemplate(template.id, { accent: event.target.value })}
                        className="h-10 w-14 rounded-lg border border-white/10 bg-slate-800 p-1"
                      />
                      <span className="font-mono text-xs text-white/60" dir="ltr">
                        {draft.accent}
                      </span>
                    </div>
                  </label>
                  <label>
                    <FieldLabel>{t({ ar: 'الترتيب', fr: 'Ordre', en: 'Order' })}</FieldLabel>
                    <input
                      type="number"
                      value={draft.sortOrder}
                      onChange={(event) => patchTemplate(template.id, { sortOrder: Number(event.target.value) })}
                      className={inputCls}
                      dir="ltr"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => saveTemplate(template)}
                  disabled={busy === `template-${template.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"
                >
                  {busy === `template-${template.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  {t({ ar: 'حفظ', fr: 'Enregistrer', en: 'Save' })}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Packages */}
      {view === 'packages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/45">
              {t({
                ar: 'عدّل الأسعار والملامح مباشرة. تُعرض التغييرات في صفحة الطلب فوراً.',
                fr: 'Modifiez prix et caractéristiques. Les changements apparaissent immédiatement.',
                en: 'Edit prices and features. Changes appear on the order page immediately.',
              })}
            </p>
            <button
              type="button"
              onClick={() => setShowNewPackage((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-slate-950"
            >
              <Plus className="h-3.5 w-3.5" />
              {t({ ar: 'باقة جديدة', fr: 'Nouvelle offre', en: 'New package' })}
            </button>
          </div>

          {showNewPackage && (
            <div className="grid gap-2 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:grid-cols-2 lg:grid-cols-6">
              <input
                value={newPackage.slug}
                onChange={(event) => setNewPackage({ ...newPackage, slug: event.target.value })}
                placeholder="slug"
                className={inputCls}
                dir="ltr"
              />
              <input
                value={newPackage.ar}
                onChange={(event) => setNewPackage({ ...newPackage, ar: event.target.value })}
                placeholder="الاسم عربي"
                className={inputCls}
              />
              <input
                value={newPackage.fr}
                onChange={(event) => setNewPackage({ ...newPackage, fr: event.target.value })}
                placeholder="Nom FR"
                className={inputCls}
                dir="ltr"
              />
              <input
                value={newPackage.en}
                onChange={(event) => setNewPackage({ ...newPackage, en: event.target.value })}
                placeholder="Name EN"
                className={inputCls}
                dir="ltr"
              />
              <input
                value={newPackage.price}
                onChange={(event) => setNewPackage({ ...newPackage, price: event.target.value })}
                placeholder={t({ ar: 'السعر', fr: 'Prix', en: 'Price' })}
                type="number"
                className={inputCls}
                dir="ltr"
              />
              <button
                type="button"
                onClick={createPackage}
                disabled={busy === 'create-package'}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"
              >
                {busy === 'create-package' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                {t({ ar: 'إنشاء', fr: 'Créer', en: 'Create' })}
              </button>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            {packages.map((pack) => {
              const draft = {
                ...pack,
                ...(packageDrafts[pack.id] || {}),
                featuresText:
                  packageDrafts[pack.id]?.featuresText !== undefined
                    ? packageDrafts[pack.id].featuresText
                    : featuresToText(pack.features),
              };
              return (
                <div key={pack.id} className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-white/50">{pack.slug}</span>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60">
                        <input
                          type="checkbox"
                          checked={!!draft.isPopular}
                          onChange={(event) => patchPackage(pack.id, { isPopular: event.target.checked })}
                          className="h-4 w-4 accent-primary"
                        />
                        {t({ ar: 'الأكثر طلباً', fr: 'Populaire', en: 'Popular' })}
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-white/60">
                        <input
                          type="checkbox"
                          checked={draft.isActive !== false}
                          onChange={(event) => patchPackage(pack.id, { isActive: event.target.checked })}
                          className="h-4 w-4 accent-primary"
                        />
                        {t({ ar: 'مفعّلة', fr: 'Active', en: 'Active' })}
                      </label>
                    </div>
                  </div>

                  <LocalizedFields
                    label={t({ ar: 'اسم الباقة', fr: 'Nom de l’offre', en: 'Package name' })}
                    value={{ ar: draft.nameAr, fr: draft.nameFr, en: draft.nameEn }}
                    onChange={(value) =>
                      patchPackage(pack.id, { nameAr: value.ar, nameFr: value.fr, nameEn: value.en })
                    }
                  />
                  <LocalizedFields
                    label={t({ ar: 'الوصف', fr: 'Description', en: 'Description' })}
                    value={{ ar: draft.descAr, fr: draft.descFr, en: draft.descEn }}
                    onChange={(value) =>
                      patchPackage(pack.id, { descAr: value.ar, descFr: value.fr, descEn: value.en })
                    }
                    multiline
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <label>
                      <FieldLabel>{t({ ar: 'السعر (د.ج)', fr: 'Prix (DA)', en: 'Price (DA)' })}</FieldLabel>
                      <input
                        type="number"
                        value={draft.price}
                        onChange={(event) => patchPackage(pack.id, { price: event.target.value })}
                        className={inputCls}
                        dir="ltr"
                      />
                    </label>
                    <label>
                      <FieldLabel>{t({ ar: 'السعر القديم', fr: 'Ancien prix', en: 'Old price' })}</FieldLabel>
                      <input
                        type="number"
                        value={draft.oldPrice ?? ''}
                        onChange={(event) => patchPackage(pack.id, { oldPrice: event.target.value })}
                        className={inputCls}
                        dir="ltr"
                      />
                    </label>
                    <label>
                      <FieldLabel>{t({ ar: 'أيام التسليم', fr: 'Jours de livraison', en: 'Delivery days' })}</FieldLabel>
                      <input
                        type="number"
                        value={draft.deliveryDays}
                        onChange={(event) => patchPackage(pack.id, { deliveryDays: event.target.value })}
                        className={inputCls}
                        dir="ltr"
                      />
                    </label>
                    <label>
                      <FieldLabel>{t({ ar: 'التعديلات', fr: 'Révisions', en: 'Revisions' })}</FieldLabel>
                      <input
                        type="number"
                        value={draft.revisions}
                        onChange={(event) => patchPackage(pack.id, { revisions: event.target.value })}
                        className={inputCls}
                        dir="ltr"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <FieldLabel>
                      {t({
                        ar: 'الملامح — سطر لكل ميزة (عربي | فرنسي | إنجليزي)',
                        fr: 'Caractéristiques — une par ligne (AR | FR | EN)',
                        en: 'Features — one per line (AR | FR | EN)',
                      })}
                    </FieldLabel>
                    <textarea
                      value={draft.featuresText}
                      onChange={(event) => patchPackage(pack.id, { featuresText: event.target.value })}
                      rows={4}
                      className={`${inputCls} resize-none font-mono text-[11px]`}
                      dir="ltr"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => savePackage(draft)}
                    disabled={busy === `package-${pack.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"
                  >
                    {busy === `package-${pack.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    {t({ ar: 'حفظ الباقة', fr: 'Enregistrer', en: 'Save package' })}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings */}
      {view === 'settings' && settingsDraft && (
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h3 className="text-sm font-black text-white">
              {t({ ar: 'بيانات صاحب الخدمة', fr: 'Coordonnées du service', en: 'Owner details' })}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <FieldLabel>{t({ ar: 'الاسم', fr: 'Nom', en: 'Name' })}</FieldLabel>
                <input
                  value={settingsDraft.ownerName || ''}
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, ownerName: event.target.value })}
                  className={inputCls}
                />
              </label>
              <label>
                <FieldLabel>{t({ ar: 'البريد', fr: 'E-mail', en: 'Email' })}</FieldLabel>
                <input
                  value={settingsDraft.ownerEmail || ''}
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, ownerEmail: event.target.value })}
                  className={inputCls}
                  dir="ltr"
                />
              </label>
              <label>
                <FieldLabel>{t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}</FieldLabel>
                <input
                  value={settingsDraft.ownerPhone || ''}
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, ownerPhone: event.target.value })}
                  className={inputCls}
                  dir="ltr"
                />
              </label>
              <label>
                <FieldLabel>{t({ ar: 'واتساب (دولي)', fr: 'WhatsApp (international)', en: 'WhatsApp (international)' })}</FieldLabel>
                <input
                  value={settingsDraft.ownerWhatsapp || ''}
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, ownerWhatsapp: event.target.value })}
                  className={inputCls}
                  dir="ltr"
                />
              </label>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-800/50 p-3 text-[11px] leading-relaxed text-white/45">
              {cloudflareConfigured
                ? t({
                    ar: 'النشر التلقائي على Cloudflare Pages مفعّل.',
                    fr: 'La publication automatique Cloudflare Pages est active.',
                    en: 'Automatic Cloudflare Pages deployment is enabled.',
                  })
                : t({
                    ar: 'Cloudflare غير مُهيأ: سيتم تجهيز ZIP للرفع اليدوي. أضف CLOUDFLARE_API_TOKEN و CLOUDFLARE_ACCOUNT_ID في Render.',
                    fr: 'Cloudflare non configuré : ZIP manuel. Ajoutez CLOUDFLARE_API_TOKEN et CLOUDFLARE_ACCOUNT_ID sur Render.',
                    en: 'Cloudflare not configured: manual ZIP. Add CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID on Render.',
                  })}
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h3 className="text-sm font-black text-white">
              {t({ ar: 'الدفع', fr: 'Paiement', en: 'Payment' })}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <FieldLabel>{t({ ar: 'حساب CCP', fr: 'Compte CCP', en: 'CCP account' })}</FieldLabel>
                <input
                  value={settingsDraft.ccp || ''}
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, ccp: event.target.value })}
                  className={inputCls}
                  dir="ltr"
                />
              </label>
              <label>
                <FieldLabel>{t({ ar: 'مفتاح CCP', fr: 'Clé CCP', en: 'CCP key' })}</FieldLabel>
                <input
                  value={settingsDraft.ccpKey || ''}
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, ccpKey: event.target.value })}
                  className={inputCls}
                  dir="ltr"
                />
              </label>
              <label>
                <FieldLabel>BaridiMob</FieldLabel>
                <input
                  value={settingsDraft.baridimob || ''}
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, baridimob: event.target.value })}
                  className={inputCls}
                  dir="ltr"
                />
              </label>
              <label>
                <FieldLabel>{t({ ar: 'البنك', fr: 'Banque', en: 'Bank' })}</FieldLabel>
                <input
                  value={settingsDraft.bankName || ''}
                  onChange={(event) => setSettingsDraft({ ...settingsDraft, bankName: event.target.value })}
                  className={inputCls}
                />
              </label>
              <label>
                <FieldLabel>{t({ ar: 'نسبة الدفعة الأولى %', fr: 'Premier versement %', en: 'Deposit %' })}</FieldLabel>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settingsDraft.depositPercent ?? 50}
                  onChange={(event) =>
                    setSettingsDraft({ ...settingsDraft, depositPercent: Number(event.target.value) })
                  }
                  className={inputCls}
                  dir="ltr"
                />
              </label>
            </div>
            <LocalizedFields
              label={t({ ar: 'ملاحظة الدفع', fr: 'Note de paiement', en: 'Payment note' })}
              value={settingsDraft.paymentNote || { ar: '', fr: '', en: '' }}
              onChange={(value) => setSettingsDraft({ ...settingsDraft, paymentNote: value })}
              multiline
            />
            <LocalizedFields
              label={t({ ar: 'ملاحظة النطاق الخاص', fr: 'Note domaine', en: 'Custom domain note' })}
              value={settingsDraft.customDomainNote || { ar: '', fr: '', en: '' }}
              onChange={(value) => setSettingsDraft({ ...settingsDraft, customDomainNote: value })}
              multiline
            />
            <button
              type="button"
              onClick={saveSettings}
              disabled={busy === 'settings'}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50"
            >
              {busy === 'settings' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {t({ ar: 'حفظ الإعدادات', fr: 'Enregistrer les paramètres', en: 'Save settings' })}
            </button>
          </div>
        </div>
      )}

      {/* Request detail modal */}
      {(detail || loadingDetail) && (
        <div className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-6">
          <div className="my-4 w-full max-w-5xl rounded-3xl border border-white/10 bg-slate-950 shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-mono text-xs font-bold text-white/40" dir="ltr">
                    {detail?.ref || '...'}
                  </p>
                  <h3 className="text-lg font-black text-white">
                    {detail?.siteName || t({ ar: 'جاري التحميل...', fr: 'Chargement...', en: 'Loading...' })}
                  </h3>
                </div>
                {detail && <StatusBadge status={detail.status} />}
              </div>
              <button
                type="button"
                onClick={() => {
                  setDetail(null);
                  setLoadingDetail(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/60 hover:bg-slate-800"
                aria-label="close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetail || !detail ? (
              <div className="flex items-center justify-center gap-2 py-24 text-sm text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t({ ar: 'جاري تحميل التفاصيل...', fr: 'Chargement du détail...', en: 'Loading details...' })}
              </div>
            ) : (
              <div className="space-y-5 p-4 sm:p-5">
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs">
                    <h4 className="text-sm font-black text-white">
                      {t({ ar: 'العميل', fr: 'Client', en: 'Client' })}
                    </h4>
                    <p className="flex items-center gap-2 text-white/65">
                      <Phone className="h-3.5 w-3.5 text-white/30" />
                      <span dir="ltr">{detail.phone}</span>
                      {detail.whatsapp && detail.whatsapp !== detail.phone && (
                        <span className="text-white/35" dir="ltr">• {detail.whatsapp}</span>
                      )}
                    </p>
                    {detail.email && (
                      <p className="flex items-center gap-2 text-white/65">
                        <Mail className="h-3.5 w-3.5 text-white/30" />
                        <span dir="ltr">{detail.email}</span>
                      </p>
                    )}
                    {(detail.address || detail.city) && (
                      <p className="flex items-center gap-2 text-white/65">
                        <MapPin className="h-3.5 w-3.5 text-white/30" />
                        {[detail.address, detail.city].filter(Boolean).join(' — ')}
                      </p>
                    )}
                    {detail.hours && <p className="text-white/40">{detail.hours}</p>}
                    <p className="border-t border-white/5 pt-2 text-[11px] text-white/35">
                      {formatDate(detail.createdAt, lang)} • {detail.templateSlug} • {detail.packageSlug}
                    </p>
                  </div>

                  <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs">
                    <h4 className="text-sm font-black text-white">
                      {t({ ar: 'الموقع والدفع', fr: 'Site & paiement', en: 'Site & payment' })}
                    </h4>
                    <p className="font-mono text-white/70" dir="ltr">
                      {detail.subdomain}.pages.dev
                      {detail.customDomain ? ` • ${detail.customDomain}` : ''}
                    </p>
                    <p className="text-white/60">
                      {t({ ar: 'المبلغ', fr: 'Montant', en: 'Amount' })}:{' '}
                      <strong className="text-primary">{money(detail.price, lang)}</strong>
                    </p>
                    {detail.paymentMethod && (
                      <p className="text-white/45">
                        {t({ ar: 'طريقة الدفع', fr: 'Moyen', en: 'Method' })}: {detail.paymentMethod}
                      </p>
                    )}
                    {detail.site && (
                      <p className="flex flex-wrap items-center gap-2 text-white/45">
                        <StatusBadge status={detail.site.status} />
                        {detail.site.url && (
                          <a
                            href={detail.site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-bold text-primary"
                          >
                            {detail.site.url}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </p>
                    )}
                    {detail.site?.deployError && (
                      <p className="rounded-lg bg-rose-500/10 px-2.5 py-2 text-[11px] leading-relaxed text-rose-300">
                        {detail.site.deployError}
                      </p>
                    )}
                  </div>
                </div>

                {/* Receipt */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-black text-white">
                    <FileText className="h-4 w-4 text-primary" />
                    {t({ ar: 'وصل الدفع', fr: 'Reçu de paiement', en: 'Payment receipt' })}
                  </h4>
                  {detail.receiptUrl ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {String(detail.receiptUrl).startsWith('data:image/') ? (
                        <a href={detail.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <img
                            src={detail.receiptUrl}
                            alt="receipt"
                            className="h-24 w-24 rounded-xl border border-white/10 object-cover"
                          />
                        </a>
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-white/50">
                          <FileText className="h-6 w-6" />
                        </span>
                      )}
                      <div className="text-xs text-white/50">
                        <p className="font-semibold text-white/70">{detail.receiptName || 'receipt'}</p>
                        <p>
                          {t({ ar: 'تم الرفع', fr: 'Reçu le', en: 'Uploaded' })}: {formatDate(detail.receiptUploadedAt || detail.updatedAt, lang)}
                        </p>
                        <a
                          href={detail.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 font-bold text-primary"
                        >
                          {t({ ar: 'فتح الوصل', fr: 'Ouvrir le reçu', en: 'Open receipt' })}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-white/40">
                      {t({ ar: 'لم يُرفع وصل بعد.', fr: 'Aucun reçu pour le moment.', en: 'No receipt uploaded yet.' })}
                    </p>
                  )}
                </div>

                {/* Status controls */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <h4 className="mb-2 text-sm font-black text-white">
                    {t({ ar: 'تحديث الحالة', fr: 'Mettre à jour le statut', en: 'Update status' })}
                  </h4>
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    rows={2}
                    placeholder={t({
                      ar: 'ملاحظة تظهر للعميل في صفحة التتبع (اختياري)',
                      fr: 'Note visible par le client dans le suivi (optionnel)',
                      en: 'Note shown to the client on the tracking page (optional)',
                    })}
                    className={`${inputCls} mb-3 resize-none`}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={notifyPaymentRequest}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      {busy === 'status-awaiting' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
                      {t({ ar: 'طلب الدفع', fr: 'Demander le paiement', en: 'Request payment' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => changeStatus('payment-review')}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-300 hover:bg-violet-500/20 disabled:opacity-50"
                    >
                      {busy === 'status-payment-review' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                      {t({ ar: 'قيد مراجعة الوصل', fr: 'Reçu en vérification', en: 'Receipt review' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => changeStatus('confirmed')}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                    >
                      {busy === 'status-confirmed' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                      {t({ ar: 'تأكيد الدفع', fr: 'Confirmer le paiement', en: 'Confirm payment' })}
                    </button>
                    <button
                      type="button"
                      onClick={() => changeStatus('rejected')}
                      disabled={!!busy}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                    >
                      {busy === 'status-rejected' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                      {t({ ar: 'رفض', fr: 'Rejeter', en: 'Reject' })}
                    </button>
                  </div>
                </div>

                {/* Site actions */}
                {detail.site && (
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-white">
                      <Rocket className="h-4 w-4 text-primary" />
                      {t({ ar: 'النشر والملفات', fr: 'Publication & fichiers', en: 'Publishing & files' })}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={publish}
                        disabled={!!busy}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-slate-950 hover:bg-primary/90 disabled:opacity-50"
                      >
                        {busy === 'publish' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                        {t({ ar: 'توليد ونشر', fr: 'Générer & publier', en: 'Build & publish' })}
                      </button>
                      <button
                        type="button"
                        onClick={downloadZip}
                        disabled={!!busy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        {busy === 'zip' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileArchive className="h-3.5 w-3.5" />}
                        {t({ ar: 'تحميل ZIP', fr: 'Télécharger ZIP', en: 'Download ZIP' })}
                      </button>
                      <button
                        type="button"
                        onClick={regenerate}
                        disabled={!!busy}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        {busy === 'regenerate' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                        {t({ ar: 'إعادة التوليد', fr: 'Régénérer', en: 'Regenerate' })}
                      </button>
                      {detail.site.status === 'published' ? (
                        <button
                          type="button"
                          onClick={() => toggleSite('suspended')}
                          disabled={!!busy}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          {t({ ar: 'تعليق الموقع', fr: 'Suspendre', en: 'Suspend site' })}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleSite('published')}
                          disabled={!!busy}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          <Play className="h-3.5 w-3.5" />
                          {t({ ar: 'تفعيل الموقع', fr: 'Activer', en: 'Activate site' })}
                        </button>
                      )}
                    </div>

                    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-white/10 bg-slate-950/50 p-3 sm:flex-row sm:items-end">
                      <label className="flex-1">
                        <FieldLabel>
                          {t({
                            ar: 'رابط النشر (للتأكيد اليدوي بعد رفع ZIP)',
                            fr: 'URL publiée (confirmation manuelle après ZIP)',
                            en: 'Published URL (manual confirmation after ZIP)',
                          })}
                        </FieldLabel>
                        <input
                          value={manualUrl}
                          onChange={(event) => setManualUrl(event.target.value)}
                          placeholder={`https://${detail.subdomain}.pages.dev`}
                          className={inputCls}
                          dir="ltr"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={markPublished}
                        disabled={!!busy}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {busy === 'mark-published' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        {t({ ar: 'تأكيد النشر', fr: 'Confirmer', en: 'Confirm published' })}
                      </button>
                    </div>
                  </div>
                )}

                {/* Events */}
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-white">
                    <History className="h-4 w-4 text-primary" />
                    {t({ ar: 'السجل', fr: 'Historique', en: 'History' })}
                  </h4>
                  <div className="max-h-56 space-y-3 overflow-y-auto pe-1">
                    {(detail.events || []).map((event: any) => (
                      <div key={event.id} className="flex gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                          <BadgeCheck className="h-3 w-3" />
                        </span>
                        <div>
                          <p className="text-xs text-white/65">{event.message}</p>
                          <p className="mt-0.5 text-[10px] text-white/30">{formatDate(event.createdAt, lang)}</p>
                        </div>
                      </div>
                    ))}
                    {(!detail.events || detail.events.length === 0) && (
                      <p className="text-xs text-white/35">{t({ ar: 'لا يوجد سجل.', fr: 'Aucun historique.', en: 'No history.' })}</p>
                    )}
                  </div>
                </div>

                {(detail.logoUrl || detail.coverUrl) && (
                  <div className="flex flex-wrap gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    {detail.logoUrl && (
                      <div>
                        <p className="mb-1 text-[11px] text-white/40">{t({ ar: 'الشعار', fr: 'Logo', en: 'Logo' })}</p>
                        <img src={detail.logoUrl} alt="logo" className="h-16 w-16 rounded-lg border border-white/10 object-contain bg-white/5" />
                      </div>
                    )}
                    {detail.coverUrl && (
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-[11px] text-white/40">{t({ ar: 'الغلاف', fr: 'Couverture', en: 'Cover' })}</p>
                        <img src={detail.coverUrl} alt="cover" className="h-16 w-full max-w-xs rounded-lg border border-white/10 object-cover" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

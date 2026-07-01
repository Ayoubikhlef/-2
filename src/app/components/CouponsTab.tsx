import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Trash2, Edit3, Save, X, Copy, CheckCircle, Percent, DollarSign, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  maxUses: number;
  expiryDate: string;
  active: boolean;
  createdAt: string;
}

interface CouponUsage {
  code: string;
  usedCount: number;
  totalDiscount: number;
  lastUsed: string;
}

const STORAGE_KEY = 'aos_coupons';
const USAGE_KEY = 'aos_coupon_usage';

function getStoredCoupons(): Coupon[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredCoupons(coupons: Coupon[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
}

function getUsageData(): CouponUsage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setUsageData(usage: CouponUsage[]) {
  localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
}

function getUsageForCode(code: string): CouponUsage {
  const all = getUsageData();
  return all.find((u) => u.code === code) || { code, usedCount: 0, totalDiscount: 0, lastUsed: '' };
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function isExpired(expiryDate: string): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date(new Date().toDateString());
}

function CouponForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Partial<Coupon> | null;
  onSave: (coupon: Coupon) => void;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  const [code, setCode] = useState(initial?.code?.toUpperCase() || '');
  const [type, setType] = useState<'percentage' | 'fixed'>(initial?.type || 'percentage');
  const [value, setValue] = useState(initial?.value?.toString() || '');
  const [minOrder, setMinOrder] = useState(initial?.minOrder?.toString() || '0');
  const [maxUses, setMaxUses] = useState(initial?.maxUses?.toString() || '0');
  const [expiryDate, setExpiryDate] = useState(initial?.expiryDate || '');
  const [active, setActive] = useState(initial?.active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error(t({ ar: 'يرجى إدخال كود الخصم', fr: 'Veuillez entrer le code promo', en: 'Please enter coupon code' }));
      return;
    }
    if (!value || Number(value) <= 0) {
      toast.error(t({ ar: 'يرجى إدخال قيمة الخصم', fr: 'Veuillez entrer la valeur de la réduction', en: 'Please enter discount value' }));
      return;
    }
    if (type === 'percentage' && Number(value) > 100) {
      toast.error(t({ ar: 'قيمة النسبة المئوية يجب أن تكون أقل من 100', fr: 'Le pourcentage doit être inférieur à 100', en: 'Percentage must be less than 100' }));
      return;
    }

    onSave({
      id: initial?.id || generateId(),
      code: code.toUpperCase().trim(),
      type,
      value: Number(value),
      minOrder: Number(minOrder) || 0,
      maxUses: Number(maxUses) || 0,
      expiryDate,
      active,
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-lg font-bold">
          {initial?.id
            ? t({ ar: 'تعديل الكوبون', fr: 'Modifier le coupon', en: 'Edit Coupon' })
            : t({ ar: 'إضافة كوبون جديد', fr: 'Ajouter un coupon', en: 'Add New Coupon' })}
        </h4>
        <button type="button" onClick={onCancel} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-white/10">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">
            {t({ ar: 'كود الخصم', fr: 'Code promo', en: 'Coupon Code' })} *
          </label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="SUMMER20"
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary uppercase"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">
            {t({ ar: 'نوع الخصم', fr: 'Type de réduction', en: 'Discount Type' })} *
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
          >
            <option value="percentage">
              {t({ ar: 'نسبة مئوية (%)', fr: 'Pourcentage (%)', en: 'Percentage (%)' })}
            </option>
            <option value="fixed">
              {t({ ar: 'قيمة ثابتة (د.ج)', fr: 'Montant fixe (DZD)', en: 'Fixed Amount (DZD)' })}
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">
            {t({ ar: 'قيمة الخصم', fr: 'Valeur de réduction', en: 'Discount Value' })} *
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === 'percentage' ? '20' : '500'}
            min="0"
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">
            {t({ ar: 'الحد الأدنى للطلب', fr: 'Montant minimum de commande', en: 'Min Order Amount' })}
          </label>
          <input
            type="number"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">
            {t({ ar: 'الحد الأقصى للاستخدام', fr: 'Utilisations maximales', en: 'Max Uses' })}
          </label>
          <input
            type="number"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="0"
            min="0"
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
          />
          <p className="text-xs text-white/40 mt-1">
            {t({ ar: '0 يعني غير محدود', fr: '0 = illimité', en: '0 = unlimited' })}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">
            {t({ ar: 'تاريخ الانتهاء', fr: 'Date d\'expiration', en: 'Expiry Date' })}
          </label>
          <input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 rounded-full bg-slate-700 peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
        </label>
        <span className="text-sm text-white/80">
          {t({ ar: 'نشط', fr: 'Actif', en: 'Active' })}
        </span>
      </div>

      <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl border border-white/10 text-white/70 hover:bg-slate-800 transition-all text-sm font-semibold"
        >
          {t({ ar: 'إلغاء', fr: 'Annuler', en: 'Cancel' })}
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-primary text-slate-950 px-5 py-2.5 text-sm font-bold hover:bg-primary/90 transition-all"
        >
          <Save className="w-4 h-4" />
          {initial?.id
            ? t({ ar: 'حفظ التعديلات', fr: 'Enregistrer', en: 'Save Changes' })
            : t({ ar: 'إضافة الكوبون', fr: 'Ajouter le coupon', en: 'Add Coupon' })}
        </button>
      </div>
    </form>
  );
}

export function CouponsTab() {
  const { t, language } = useLanguage();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    setCoupons(getStoredCoupons());
  }, []);

  const refresh = () => {
    setCoupons(getStoredCoupons());
  };

  const handleSave = (coupon: Coupon) => {
    const existing = coupons.find((c) => c.id === coupon.id);
    let updated: Coupon[];
    if (existing) {
      updated = coupons.map((c) => (c.id === coupon.id ? coupon : c));
      toast.success(t({ ar: 'تم تحديث الكوبون', fr: 'Coupon mis à jour', en: 'Coupon updated' }));
    } else {
      const duplicate = coupons.find((c) => c.code === coupon.code);
      if (duplicate) {
        toast.error(t({ ar: 'كود الخصم موجود بالفعل', fr: 'Ce code promo existe déjà', en: 'Coupon code already exists' }));
        return;
      }
      updated = [...coupons, coupon];
      toast.success(t({ ar: 'تم إضافة الكوبون', fr: 'Coupon ajouté', en: 'Coupon added' }));
    }
    setStoredCoupons(updated);
    setCoupons(updated);
    setShowForm(false);
    setEditing(null);
  };

  const handleDelete = (coupon: Coupon) => {
    if (!confirm(t({ ar: 'هل أنت متأكد من حذف هذا الكوبون؟', fr: 'Êtes-vous sûr de vouloir supprimer ce coupon?', en: 'Are you sure you want to delete this coupon?' }))) return;
    const updated = coupons.filter((c) => c.id !== coupon.id);
    setStoredCoupons(updated);
    setCoupons(updated);
    toast.success(t({ ar: 'تم حذف الكوبون', fr: 'Coupon supprimé', en: 'Coupon deleted' }));
  };

  const toggleActive = (coupon: Coupon) => {
    const updated = coupons.map((c) =>
      c.id === coupon.id ? { ...c, active: !c.active } : c
    );
    setStoredCoupons(updated);
    setCoupons(updated);
    toast.success(
      !coupon.active
        ? t({ ar: 'تم تفعيل الكوبون', fr: 'Coupon activé', en: 'Coupon activated' })
        : t({ ar: 'تم إيقاف الكوبون', fr: 'Coupon désactivé', en: 'Coupon deactivated' })
    );
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success(t({ ar: 'تم نسخ الكود', fr: 'Code copié', en: 'Code copied' }));
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing(null);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString(
      language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric' }
    );
  };

  const totalActive = coupons.filter((c) => c.active && !isExpired(c.expiryDate)).length;
  const totalExpired = coupons.filter((c) => isExpired(c.expiryDate)).length;

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold">
            {editing?.id
              ? t({ ar: 'تعديل الكوبون', fr: 'Modifier le coupon', en: 'Edit Coupon' })
              : t({ ar: 'إضافة كوبون جديد', fr: 'Nouveau coupon', en: 'New Coupon' })}
          </h3>
        </div>
        <CouponForm initial={editing} onSave={handleSave} onCancel={handleCancel} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">
            {t({ ar: 'إدارة الكوبونات', fr: 'Gestion des coupons', en: 'Coupon Management' })}
          </h3>
          <p className="text-sm text-white/50 mt-1">
            {t({
              ar: `${coupons.length} كوبون - ${totalActive} نشط - ${totalExpired} منتهي`,
              fr: `${coupons.length} coupons - ${totalActive} actifs - ${totalExpired} expirés`,
              en: `${coupons.length} coupons - ${totalActive} active - ${totalExpired} expired`,
            })}
          </p>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-slate-950 px-5 py-2.5 text-sm font-bold hover:bg-primary/90 transition-all self-start"
        >
          <Plus className="w-4 h-4" />
          {t({ ar: 'إضافة كوبون', fr: 'Ajouter coupon', en: 'Add Coupon' })}
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-16 text-center">
          <Percent className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-xl text-white/40">
            {t({ ar: 'لا توجد كوبونات بعد', fr: 'Aucun coupon pour le moment', en: 'No coupons yet' })}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const usage = getUsageForCode(coupon.code);
            const expired = isExpired(coupon.expiryDate);
            const remaining =
              coupon.maxUses > 0 ? Math.max(0, coupon.maxUses - usage.usedCount) : -1;

            return (
              <div
                key={coupon.id}
                className={`rounded-[32px] border transition-all ${
                  expired
                    ? 'border-red-500/20 bg-red-950/10'
                    : !coupon.active
                    ? 'border-amber-500/20 bg-amber-950/10'
                    : 'border-white/10 bg-slate-900/80'
                }`}
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-lg font-bold text-white font-mono tracking-wider">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-all border border-white/10"
                          title={t({ ar: 'نسخ الكود', fr: 'Copier le code', en: 'Copy code' })}
                        >
                          {copiedCode === coupon.code ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-white/60" />
                          )}
                        </button>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            expired
                              ? 'bg-red-500/20 text-red-400 border-red-500/30'
                              : coupon.active
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {expired
                            ? t({ ar: 'منتهي', fr: 'Expiré', en: 'Expired' })
                            : coupon.active
                            ? t({ ar: 'نشط', fr: 'Actif', en: 'Active' })
                            : t({ ar: 'موقف', fr: 'Désactivé', en: 'Disabled' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-white/60 flex-wrap">
                        <span className="inline-flex items-center gap-1.5">
                          {coupon.type === 'percentage' ? (
                            <Percent className="w-3.5 h-3.5" />
                          ) : (
                            <DollarSign className="w-3.5 h-3.5" />
                          )}
                          {coupon.type === 'percentage'
                            ? `${coupon.value}%`
                            : `${coupon.value.toLocaleString()} د.ج`}
                        </span>
                        {coupon.minOrder > 0 && (
                          <span className="inline-flex items-center gap-1.5">
                            {t({ ar: 'الحد الأدنى:', fr: 'Min:', en: 'Min:' })}
                            {coupon.minOrder.toLocaleString()} د.ج
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {coupon.expiryDate ? formatDate(coupon.expiryDate) : t({ ar: 'بدون انتهاء', fr: 'Sans expiration', en: 'No expiry' })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 flex-wrap">
                      <div className="text-center">
                        <p className="text-xs text-white/40">
                          {t({ ar: 'استخدم', fr: 'Utilisé', en: 'Used' })}
                        </p>
                        <p className="text-lg font-bold text-white">
                          {usage.usedCount}
                          {coupon.maxUses > 0 && (
                            <span className="text-sm text-white/40"> / {coupon.maxUses}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/40">
                          {t({ ar: 'الخصم', fr: 'Réduction', en: 'Discount' })}
                        </p>
                        <p className="text-lg font-bold text-emerald-400">
                          {usage.totalDiscount.toLocaleString()} د.ج
                        </p>
                      </div>
                      {remaining >= 0 && (
                        <div className="text-center">
                          <p className="text-xs text-white/40">
                            {t({ ar: 'متبقي', fr: 'Restant', en: 'Remaining' })}
                          </p>
                          <p className={`text-lg font-bold ${remaining > 0 ? 'text-white' : 'text-red-400'}`}>
                            {remaining}
                          </p>
                        </div>
                      )}

                      <button
                        onClick={() => toggleActive(coupon)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          coupon.active
                            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                        }`}
                      >
                        {coupon.active
                          ? t({ ar: 'إيقاف', fr: 'Désactiver', en: 'Disable' })
                          : t({ ar: 'تفعيل', fr: 'Activer', en: 'Enable' })}
                      </button>

                      <button
                        onClick={() => handleEdit(coupon)}
                        className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-white/10"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(coupon)}
                        className="p-3 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

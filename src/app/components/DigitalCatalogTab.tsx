import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  DIGITAL_CATEGORIES,
  type DigitalPackage,
  type DigitalService,
  type DigitalServiceCategory,
  type DigitalServiceIcon,
  type LangText,
} from '../data/digitalServices';
import {
  createDigitalServiceId,
  deleteDigitalPackage,
  deleteDigitalService,
  getStoredDigitalCatalog,
  loadDigitalCatalogFromServer,
  resetDigitalCatalog,
  saveDigitalCatalog,
  type DigitalCatalog,
} from '../utils/digitalCatalogStorage';
import {
  Check,
  Eye,
  EyeOff,
  Edit3,
  Plus,
  RotateCcw,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const ICON_OPTIONS: DigitalServiceIcon[] = [
  'store',
  'social',
  'hosting',
  'pos',
  'network',
  'training',
  'ai',
  'design',
  'content',
  'photo',
  'video',
  'voice',
  'translation',
  'chatbot',
  'automation',
  'presentation',
  'analytics',
];

const CATEGORY_OPTIONS = DIGITAL_CATEGORIES.filter(
  (category): category is { id: DigitalServiceCategory; label: LangText } => category.id !== 'all',
);

const GRADIENT_PRESETS = [
  'from-primary to-blue-700',
  'from-violet-500 to-purple-600',
  'from-fuchsia-500 to-pink-600',
  'from-orange-500 to-rose-500',
  'from-sky-500 to-cyan-500',
  'from-red-500 to-orange-500',
  'from-indigo-500 to-blue-600',
  'from-teal-500 to-emerald-600',
  'from-emerald-500 to-lime-600',
  'from-slate-600 to-blue-700',
  'from-pink-500 to-rose-600',
  'from-amber-500 to-yellow-600',
  'from-cyan-500 to-blue-600',
  'from-violet-600 to-indigo-700',
  'from-blue-600 to-indigo-700',
  'from-rose-500 to-orange-500',
];

const emptyLang = (): LangText => ({ ar: '', fr: '', en: '' });

const newService = (): DigitalService => ({
  id: createDigitalServiceId(),
  bookingValue: '',
  icon: 'ai',
  category: 'ai',
  title: emptyLang(),
  tagline: emptyLang(),
  description: emptyLang(),
  startingPrice: 0,
  priceUnit: { ar: 'للخدمة', fr: 'par service', en: 'per service' },
  features: [],
  delivery: { ar: '48 ساعة', fr: '48 heures', en: '48 hours' },
  gradient: 'from-primary to-blue-700',
  visible: true,
});

const newPackage = (): DigitalPackage => ({
  id: `pack-${Date.now().toString(36)}`,
  name: emptyLang(),
  price: 0,
  period: { ar: 'مرة واحدة', fr: 'une fois', en: 'one-time' },
  tagline: emptyLang(),
  features: [],
  cta: { ar: 'اطلب الباقة', fr: 'Commander le pack', en: 'Order the pack' },
  bookingValue: '',
  featured: false,
  gradient: 'from-primary to-blue-700',
  visible: true,
});

function featuresToLines(features: LangText[]) {
  return {
    ar: features.map((feature) => feature.ar).join('\n'),
    fr: features.map((feature) => feature.fr).join('\n'),
    en: features.map((feature) => feature.en).join('\n'),
  };
}

function linesToFeatures(lines: { ar: string; fr: string; en: string }): LangText[] {
  const ar = lines.ar.split('\n');
  const fr = lines.fr.split('\n');
  const en = lines.en.split('\n');
  const total = Math.max(ar.length, fr.length, en.length);
  return Array.from({ length: total }, (_, index) => ({
    ar: (ar[index] ?? '').trim(),
    fr: (fr[index] ?? '').trim(),
    en: (en[index] ?? '').trim(),
  })).filter((feature) => feature.ar || feature.fr || feature.en);
}

const inputClass =
  'w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none transition focus:border-primary';
const labelClass = 'mb-2 block text-xs font-bold text-white/70';

function LangField({
  label,
  value,
  onChange,
  textarea,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  required?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        {label} {required && <span className="text-rose-400">*</span>}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className={inputClass} />
      )}
    </div>
  );
}

export function DigitalCatalogTab({ onUpdate }: { onUpdate?: () => void }) {
  const { t, language } = useLanguage();
  const [catalog, setCatalog] = useState<DigitalCatalog>(() => getStoredDigitalCatalog());
  const [search, setSearch] = useState('');
  const [editingService, setEditingService] = useState<DigitalService | null>(null);
  const [editingPackage, setEditingPackage] = useState<DigitalPackage | null>(null);

  useEffect(() => {
    let active = true;
    loadDigitalCatalogFromServer()
      .then((next) => {
        if (active) setCatalog(next);
      })
      .catch(() => {
        /* offline: keep the local copy */
      });
    return () => {
      active = false;
    };
  }, []);

  const persist = (next: DigitalCatalog) => {
    saveDigitalCatalog(next);
    setCatalog(next);
    onUpdate?.();
  };

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalog.services;
    return catalog.services.filter((service) =>
      [service.title.ar, service.title.fr, service.title.en, service.bookingValue]
        .join(' ')
        .toLowerCase()
        .includes(query),
    );
  }, [catalog.services, search]);

  const handleReset = () => {
    if (!confirm(t({
      ar: 'إرجاع الكتالوج إلى النسخة الأصلية؟ سيتم حذف كل التعديلات.',
      fr: 'Rétablir le catalogue d’origine ? Toutes les modifications seront perdues.',
      en: 'Restore the original catalogue? All changes will be lost.',
    }))) return;
    setCatalog(resetDigitalCatalog());
    onUpdate?.();
    toast.success(t({ ar: 'تم إرجاع الكتالوج الأصلي', fr: 'Catalogue d’origine restauré', en: 'Original catalogue restored' }));
  };

  const handleSaveService = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingService) return;
    if (!editingService.title.ar || !editingService.title.fr || !editingService.title.en) {
      toast.error(t({ ar: 'اكتب اسم الخدمة باللغات الثلاث', fr: 'Saisissez le nom dans les 3 langues', en: 'Enter the service name in all 3 languages' }));
      return;
    }
    if (!editingService.startingPrice || editingService.startingPrice < 0) {
      toast.error(t({ ar: 'أدخل سعراً صحيحاً', fr: 'Saisissez un prix valide', en: 'Enter a valid price' }));
      return;
    }
    const service: DigitalService = {
      ...editingService,
      bookingValue:
        editingService.bookingValue.trim() ||
        `digital-${editingService.id.replace(/[^a-z0-9-]/gi, '').toLowerCase()}`,
    };
    const exists = catalog.services.some((item) => item.id === service.id);
    persist({
      ...catalog,
      services: exists
        ? catalog.services.map((item) => (item.id === service.id ? service : item))
        : [...catalog.services, service],
    });
    setEditingService(null);
    toast.success(exists
      ? t({ ar: 'تم تحديث الخدمة', fr: 'Service mis à jour', en: 'Service updated' })
      : t({ ar: 'تمت إضافة الخدمة', fr: 'Service ajouté', en: 'Service added' }));
  };

  const handleSavePackage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingPackage) return;
    if (!editingPackage.name.ar || !editingPackage.name.fr || !editingPackage.name.en) {
      toast.error(t({ ar: 'اكتب اسم الباقة باللغات الثلاث', fr: 'Saisissez le nom du pack dans les 3 langues', en: 'Enter the pack name in all 3 languages' }));
      return;
    }
    if (!editingPackage.price || editingPackage.price < 0) {
      toast.error(t({ ar: 'أدخل سعراً صحيحاً', fr: 'Saisissez un prix valide', en: 'Enter a valid price' }));
      return;
    }
    const pkg: DigitalPackage = {
      ...editingPackage,
      bookingValue:
        editingPackage.bookingValue.trim() ||
        `${editingPackage.id.replace(/[^a-z0-9-]/gi, '').toLowerCase()}-pack`,
    };
    const exists = catalog.packages.some((item) => item.id === pkg.id);
    persist({
      ...catalog,
      packages: exists
        ? catalog.packages.map((item) => (item.id === pkg.id ? pkg : item))
        : [...catalog.packages, pkg],
    });
    setEditingPackage(null);
    toast.success(exists
      ? t({ ar: 'تم تحديث الباقة', fr: 'Pack mis à jour', en: 'Pack updated' })
      : t({ ar: 'تمت إضافة الباقة', fr: 'Pack ajouté', en: 'Pack added' }));
  };

  const toggleServiceVisibility = (service: DigitalService) => {
    persist({
      ...catalog,
      services: catalog.services.map((item) =>
        item.id === service.id ? { ...item, visible: item.visible === false } : item,
      ),
    });
  };

  const togglePackageVisibility = (pkg: DigitalPackage) => {
    persist({
      ...catalog,
      packages: catalog.packages.map((item) =>
        item.id === pkg.id ? { ...item, visible: item.visible === false } : item,
      ),
    });
  };

  const handleDeleteService = (service: DigitalService) => {
    if (!confirm(t({
      ar: `حذف الخدمة «${service.title.ar}» نهائياً؟`,
      fr: `Supprimer définitivement « ${service.title.fr} » ?`,
      en: `Permanently delete “${service.title.en}”?`,
    }))) return;
    setCatalog(deleteDigitalService(service.id));
    onUpdate?.();
    toast.success(t({ ar: 'تم حذف الخدمة', fr: 'Service supprimé', en: 'Service deleted' }));
  };

  const handleDeletePackage = (pkg: DigitalPackage) => {
    if (!confirm(t({
      ar: `حذف الباقة «${pkg.name.ar}» نهائياً؟`,
      fr: `Supprimer définitivement « ${pkg.name.fr} » ?`,
      en: `Permanently delete “${pkg.name.en}”?`,
    }))) return;
    setCatalog(deleteDigitalPackage(pkg.id));
    onUpdate?.();
    toast.success(t({ ar: 'تم حذف الباقة', fr: 'Pack supprimé', en: 'Pack deleted' }));
  };

  /* ---------- Service form ---------- */
  if (editingService) {
    const service = editingService;
    const update = (patch: Partial<DigitalService>) => setEditingService({ ...service, ...patch });
    const updateLang = (key: 'title' | 'tagline' | 'description' | 'priceUnit' | 'delivery', lang: keyof LangText, value: string) =>
      update({ [key]: { ...service[key], [lang]: value } } as Partial<DigitalService>);
    const featureLines = featuresToLines(service.features);

    return (
      <form onSubmit={handleSaveService} className="space-y-6 rounded-[32px] border border-white/10 bg-slate-900/80 p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">
              {catalog.services.some((item) => item.id === service.id)
                ? t({ ar: 'تعديل الخدمة الرقمية', fr: 'Modifier le service digital', en: 'Edit digital service' })
                : t({ ar: 'إضافة خدمة رقمية', fr: 'Ajouter un service digital', en: 'Add digital service' })}
            </h3>
            <p className="mt-1 text-sm text-white/50">
              {t({ ar: 'تظهر التغييرات مباشرة في قسم الخدمات الرقمية.', fr: 'Les modifications apparaissent immédiatement dans la section services.', en: 'Changes appear instantly in the digital services section.' })}
            </p>
          </div>
          <button type="button" onClick={() => setEditingService(null)} className="rounded-xl border border-white/10 bg-slate-800 p-3 transition hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LangField label={t({ ar: 'الاسم (عربي)', fr: 'Nom (arabe)', en: 'Name (Arabic)' })} value={service.title.ar} onChange={(value) => updateLang('title', 'ar', value)} required />
          <LangField label={t({ ar: 'الاسم (فرنسي)', fr: 'Nom (français)', en: 'Name (French)' })} value={service.title.fr} onChange={(value) => updateLang('title', 'fr', value)} required />
          <LangField label={t({ ar: 'الاسم (إنجليزي)', fr: 'Nom (anglais)', en: 'Name (English)' })} value={service.title.en} onChange={(value) => updateLang('title', 'en', value)} required />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LangField label={t({ ar: 'العبارة الترويجية (عربي)', fr: 'Accroche (arabe)', en: 'Tagline (Arabic)' })} value={service.tagline.ar} onChange={(value) => updateLang('tagline', 'ar', value)} />
          <LangField label={t({ ar: 'العبارة الترويجية (فرنسي)', fr: 'Accroche (français)', en: 'Tagline (French)' })} value={service.tagline.fr} onChange={(value) => updateLang('tagline', 'fr', value)} />
          <LangField label={t({ ar: 'العبارة الترويجية (إنجليزي)', fr: 'Accroche (anglais)', en: 'Tagline (English)' })} value={service.tagline.en} onChange={(value) => updateLang('tagline', 'en', value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LangField label={t({ ar: 'الوصف (عربي)', fr: 'Description (arabe)', en: 'Description (Arabic)' })} value={service.description.ar} onChange={(value) => updateLang('description', 'ar', value)} textarea />
          <LangField label={t({ ar: 'الوصف (فرنسي)', fr: 'Description (français)', en: 'Description (French)' })} value={service.description.fr} onChange={(value) => updateLang('description', 'fr', value)} textarea />
          <LangField label={t({ ar: 'الوصف (إنجليزي)', fr: 'Description (anglais)', en: 'Description (English)' })} value={service.description.en} onChange={(value) => updateLang('description', 'en', value)} textarea />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className={labelClass}>{t({ ar: 'السعر (دج)', fr: 'Prix (DA)', en: 'Price (DA)' })} *</label>
            <input
              type="number"
              min={0}
              value={service.startingPrice}
              onChange={(event) => update({ startingPrice: Number(event.target.value) })}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t({ ar: 'المجال', fr: 'Catégorie', en: 'Category' })}</label>
            <select
              value={service.category}
              onChange={(event) => update({ category: event.target.value as DigitalServiceCategory })}
              className={`${inputClass} cursor-pointer`}
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category.id} value={category.id}>{t(category.label)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t({ ar: 'الأيقونة', fr: 'Icône', en: 'Icon' })}</label>
            <select
              value={service.icon}
              onChange={(event) => update({ icon: event.target.value as DigitalServiceIcon })}
              className={`${inputClass} cursor-pointer`}
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{t({ ar: 'الألوان', fr: 'Couleurs', en: 'Colours' })}</label>
            <select
              value={service.gradient}
              onChange={(event) => update({ gradient: event.target.value })}
              className={`${inputClass} cursor-pointer`}
            >
              {GRADIENT_PRESETS.map((gradient) => (
                <option key={gradient} value={gradient}>{gradient.replace('from-', '').replace(' to-', ' → ')}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LangField label={t({ ar: 'وحدة السعر (عربي)', fr: 'Unité de prix (arabe)', en: 'Price unit (Arabic)' })} value={service.priceUnit.ar} onChange={(value) => updateLang('priceUnit', 'ar', value)} />
          <LangField label={t({ ar: 'وحدة السعر (فرنسي)', fr: 'Unité de prix (français)', en: 'Price unit (French)' })} value={service.priceUnit.fr} onChange={(value) => updateLang('priceUnit', 'fr', value)} />
          <LangField label={t({ ar: 'وحدة السعر (إنجليزي)', fr: 'Unité de prix (anglais)', en: 'Price unit (English)' })} value={service.priceUnit.en} onChange={(value) => updateLang('priceUnit', 'en', value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LangField label={t({ ar: 'مدة التسليم (عربي)', fr: 'Délai (arabe)', en: 'Delivery (Arabic)' })} value={service.delivery.ar} onChange={(value) => updateLang('delivery', 'ar', value)} />
          <LangField label={t({ ar: 'مدة التسليم (فرنسي)', fr: 'Délai (français)', en: 'Delivery (French)' })} value={service.delivery.fr} onChange={(value) => updateLang('delivery', 'fr', value)} />
          <LangField label={t({ ar: 'مدة التسليم (إنجليزي)', fr: 'Délai (anglais)', en: 'Delivery (English)' })} value={service.delivery.en} onChange={(value) => updateLang('delivery', 'en', value)} />
        </div>

        <div>
          <p className={labelClass}>
            {t({ ar: 'المزايا — ميزة واحدة في كل سطر', fr: 'Avantages — un par ligne', en: 'Features — one per line' })}
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <LangField label={t({ ar: 'عربي', fr: 'Arabe', en: 'Arabic' })} value={featureLines.ar} onChange={(value) => update({ features: linesToFeatures({ ...featureLines, ar: value }) })} textarea />
            <LangField label={t({ ar: 'فرنسي', fr: 'Français', en: 'French' })} value={featureLines.fr} onChange={(value) => update({ features: linesToFeatures({ ...featureLines, fr: value }) })} textarea />
            <LangField label={t({ ar: 'إنجليزي', fr: 'Anglais', en: 'English' })} value={featureLines.en} onChange={(value) => update({ features: linesToFeatures({ ...featureLines, en: value }) })} textarea />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <LangField label={t({ ar: 'شارة (عربي) — اختياري', fr: 'Badge (arabe) — facultatif', en: 'Badge (Arabic) — optional' })} value={service.badge?.ar ?? ''} onChange={(value) => update({ badge: { ar: value, fr: service.badge?.fr ?? '', en: service.badge?.en ?? '' } })} />
          <LangField label={t({ ar: 'شارة (فرنسي)', fr: 'Badge (français)', en: 'Badge (French)' })} value={service.badge?.fr ?? ''} onChange={(value) => update({ badge: { ar: service.badge?.ar ?? '', fr: value, en: service.badge?.en ?? '' } })} />
          <LangField label={t({ ar: 'شارة (إنجليزي)', fr: 'Badge (anglais)', en: 'Badge (English)' })} value={service.badge?.en ?? ''} onChange={(value) => update({ badge: { ar: service.badge?.ar ?? '', fr: service.badge?.fr ?? '', en: value } })} />
          <div>
            <label className={labelClass}>{t({ ar: 'معرّف الطلب', fr: 'Identifiant', en: 'Booking value' })}</label>
            <input
              dir="ltr"
              value={service.bookingValue}
              onChange={(event) => update({ bookingValue: event.target.value })}
              placeholder="auto"
              className={`${inputClass} text-start`}
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3">
          <input
            type="checkbox"
            checked={service.visible !== false}
            onChange={(event) => update({ visible: event.target.checked })}
            className="h-4 w-4 accent-emerald-400"
          />
          <span className="text-sm font-semibold">
            {t({ ar: 'ظاهرة في الموقع', fr: 'Visible sur le site', en: 'Visible on the site' })}
          </span>
        </label>

        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-primary/90">
            <Save className="h-4 w-4" />
            {t({ ar: 'حفظ الخدمة', fr: 'Enregistrer', en: 'Save service' })}
          </button>
          <button type="button" onClick={() => setEditingService(null)} className="rounded-xl border border-white/10 bg-slate-800 px-6 py-3 text-sm font-bold transition hover:bg-slate-700">
            {t({ ar: 'إلغاء', fr: 'Annuler', en: 'Cancel' })}
          </button>
        </div>
      </form>
    );
  }

  /* ---------- Package form ---------- */
  if (editingPackage) {
    const pkg = editingPackage;
    const update = (patch: Partial<DigitalPackage>) => setEditingPackage({ ...pkg, ...patch });
    const updateLang = (key: 'name' | 'tagline' | 'period' | 'cta', lang: keyof LangText, value: string) =>
      update({ [key]: { ...pkg[key], [lang]: value } } as Partial<DigitalPackage>);
    const featureLines = featuresToLines(pkg.features);

    return (
      <form onSubmit={handleSavePackage} className="space-y-6 rounded-[32px] border border-white/10 bg-slate-900/80 p-6 md:p-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold">
              {catalog.packages.some((item) => item.id === pkg.id)
                ? t({ ar: 'تعديل الباقة', fr: 'Modifier le pack', en: 'Edit pack' })
                : t({ ar: 'إضافة باقة', fr: 'Ajouter un pack', en: 'Add pack' })}
            </h3>
            <p className="mt-1 text-sm text-white/50">
              {t({ ar: 'الباقة تظهر في قسم الباقات وتُضاف لقائمة الطلب.', fr: 'Le pack apparaît dans la section packs et dans le formulaire.', en: 'The pack appears in the packs section and the order form.' })}
            </p>
          </div>
          <button type="button" onClick={() => setEditingPackage(null)} className="rounded-xl border border-white/10 bg-slate-800 p-3 transition hover:bg-slate-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LangField label={t({ ar: 'اسم الباقة (عربي)', fr: 'Nom (arabe)', en: 'Name (Arabic)' })} value={pkg.name.ar} onChange={(value) => updateLang('name', 'ar', value)} required />
          <LangField label={t({ ar: 'اسم الباقة (فرنسي)', fr: 'Nom (français)', en: 'Name (French)' })} value={pkg.name.fr} onChange={(value) => updateLang('name', 'fr', value)} required />
          <LangField label={t({ ar: 'اسم الباقة (إنجليزي)', fr: 'Nom (anglais)', en: 'Name (English)' })} value={pkg.name.en} onChange={(value) => updateLang('name', 'en', value)} required />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className={labelClass}>{t({ ar: 'السعر (دج)', fr: 'Prix (DA)', en: 'Price (DA)' })} *</label>
            <input type="number" min={0} value={pkg.price} onChange={(event) => update({ price: Number(event.target.value) })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>{t({ ar: 'الألوان', fr: 'Couleurs', en: 'Colours' })}</label>
            <select value={pkg.gradient} onChange={(event) => update({ gradient: event.target.value })} className={`${inputClass} cursor-pointer`}>
              {GRADIENT_PRESETS.map((gradient) => (
                <option key={gradient} value={gradient}>{gradient.replace('from-', '').replace(' to-', ' → ')}</option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3">
            <input type="checkbox" checked={Boolean(pkg.featured)} onChange={(event) => update({ featured: event.target.checked })} className="h-4 w-4 accent-amber-400" />
            <span className="text-sm font-semibold">{t({ ar: 'باقة مميزة', fr: 'Pack en vedette', en: 'Featured pack' })}</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3 self-end rounded-xl border border-white/10 bg-slate-800/60 px-4 py-3">
            <input type="checkbox" checked={pkg.visible !== false} onChange={(event) => update({ visible: event.target.checked })} className="h-4 w-4 accent-emerald-400" />
            <span className="text-sm font-semibold">{t({ ar: 'ظاهرة', fr: 'Visible', en: 'Visible' })}</span>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LangField label={t({ ar: 'الوصف المختصر (عربي)', fr: 'Accroche (arabe)', en: 'Tagline (Arabic)' })} value={pkg.tagline.ar} onChange={(value) => updateLang('tagline', 'ar', value)} />
          <LangField label={t({ ar: 'الوصف المختصر (فرنسي)', fr: 'Accroche (français)', en: 'Tagline (French)' })} value={pkg.tagline.fr} onChange={(value) => updateLang('tagline', 'fr', value)} />
          <LangField label={t({ ar: 'الوصف المختصر (إنجليزي)', fr: 'Accroche (anglais)', en: 'Tagline (English)' })} value={pkg.tagline.en} onChange={(value) => updateLang('tagline', 'en', value)} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LangField label={t({ ar: 'المدة (عربي)', fr: 'Période (arabe)', en: 'Period (Arabic)' })} value={pkg.period.ar} onChange={(value) => updateLang('period', 'ar', value)} />
          <LangField label={t({ ar: 'المدة (فرنسي)', fr: 'Période (français)', en: 'Period (French)' })} value={pkg.period.fr} onChange={(value) => updateLang('period', 'fr', value)} />
          <LangField label={t({ ar: 'المدة (إنجليزي)', fr: 'Période (anglais)', en: 'Period (English)' })} value={pkg.period.en} onChange={(value) => updateLang('period', 'en', value)} />
        </div>

        <div>
          <p className={labelClass}>{t({ ar: 'ما تشمله الباقة — سطر لكل ميزة', fr: 'Contenu du pack — un par ligne', en: 'What the pack includes — one per line' })}</p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <LangField label={t({ ar: 'عربي', fr: 'Arabe', en: 'Arabic' })} value={featureLines.ar} onChange={(value) => update({ features: linesToFeatures({ ...featureLines, ar: value }) })} textarea />
            <LangField label={t({ ar: 'فرنسي', fr: 'Français', en: 'French' })} value={featureLines.fr} onChange={(value) => update({ features: linesToFeatures({ ...featureLines, fr: value }) })} textarea />
            <LangField label={t({ ar: 'إنجليزي', fr: 'Anglais', en: 'English' })} value={featureLines.en} onChange={(value) => update({ features: linesToFeatures({ ...featureLines, en: value }) })} textarea />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <LangField label={t({ ar: 'زر الطلب (عربي)', fr: 'Bouton (arabe)', en: 'Button (Arabic)' })} value={pkg.cta.ar} onChange={(value) => updateLang('cta', 'ar', value)} />
          <LangField label={t({ ar: 'زر الطلب (فرنسي)', fr: 'Bouton (français)', en: 'Button (French)' })} value={pkg.cta.fr} onChange={(value) => updateLang('cta', 'fr', value)} />
          <LangField label={t({ ar: 'زر الطلب (إنجليزي)', fr: 'Bouton (anglais)', en: 'Button (English)' })} value={pkg.cta.en} onChange={(value) => updateLang('cta', 'en', value)} />
          <div>
            <label className={labelClass}>{t({ ar: 'معرّف الطلب', fr: 'Identifiant', en: 'Booking value' })}</label>
            <input dir="ltr" value={pkg.bookingValue} onChange={(event) => update({ bookingValue: event.target.value })} placeholder="auto" className={`${inputClass} text-start`} />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-primary/90">
            <Save className="h-4 w-4" />
            {t({ ar: 'حفظ الباقة', fr: 'Enregistrer', en: 'Save pack' })}
          </button>
          <button type="button" onClick={() => setEditingPackage(null)} className="rounded-xl border border-white/10 bg-slate-800 px-6 py-3 text-sm font-bold transition hover:bg-slate-700">
            {t({ ar: 'إلغاء', fr: 'Annuler', en: 'Cancel' })}
          </button>
        </div>
      </form>
    );
  }

  /* ---------- Catalogue list ---------- */
  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-2xl font-bold">
              <Sparkles className="h-6 w-6 text-primary" />
              {t({ ar: 'الكتالوج الرقمي', fr: 'Catalogue digital', en: 'Digital catalogue' })}
            </h3>
            <p className="mt-1 text-sm text-white/50">
              {t({
                ar: 'أضف وعدّل الخدمات والباقات الرقمية وأسعارها مباشرة من هنا. كل تعديل يظهر في الموقع لكل الزوار.',
                fr: 'Ajoutez et modifiez les services et packs digitaux, leurs prix et leur visibilité. Chaque changement est publié sur le site.',
                en: 'Add and edit digital services and packs, their prices and visibility. Every change goes live on the site.',
              })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-primary/15 px-3 py-1 font-bold text-primary">
                {catalog.services.length} {t({ ar: 'خدمة', fr: 'services', en: 'services' })}
              </span>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 font-bold text-emerald-400">
                {catalog.services.filter((service) => service.visible !== false).length} {t({ ar: 'ظاهرة', fr: 'visibles', en: 'visible' })}
              </span>
              <span className="rounded-full bg-amber-500/15 px-3 py-1 font-bold text-amber-300">
                {catalog.packages.length} {t({ ar: 'باقة', fr: 'packs', en: 'packs' })}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setEditingService(newService())}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              {t({ ar: 'خدمة جديدة', fr: 'Nouveau service', en: 'New service' })}
            </button>
            <button
              type="button"
              onClick={() => setEditingPackage(newPackage())}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-amber-950 transition hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              {t({ ar: 'باقة جديدة', fr: 'Nouveau pack', en: 'New pack' })}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              {t({ ar: 'استرجاع الأصلي', fr: 'Réinitialiser', en: 'Reset' })}
            </button>
          </div>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t({ ar: 'ابحث عن خدمة...', fr: 'Rechercher un service…', en: 'Search a service…' })}
            className={`${inputClass} ps-11`}
          />
        </div>
      </div>

      <div>
        <h4 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Sparkles className="h-5 w-5 text-primary" />
          {t({ ar: 'الخدمات', fr: 'Services', en: 'Services' })}
        </h4>
        <div className="space-y-2">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`flex flex-col gap-3 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                service.visible === false
                  ? 'border-white/5 bg-slate-900/40 opacity-60'
                  : 'border-white/10 bg-slate-900/80'
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{service.title[language] || service.title.ar}</span>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white/60">
                    {service.category}
                  </span>
                  {service.visible === false && (
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                      {t({ ar: 'مخفية', fr: 'Masquée', en: 'Hidden' })}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-white/50">{service.tagline[language] || service.tagline.ar}</p>
              </div>

              <div className="flex items-center gap-2 sm:shrink-0">
                <span dir="ltr" className="me-2 inline-block text-sm font-bold text-primary">
                  {service.startingPrice.toLocaleString('en-US').replace(/,/g, ' ')} DA
                </span>
                <button
                  type="button"
                  onClick={() => toggleServiceVisibility(service)}
                  title={t({ ar: 'إظهار / إخفاء', fr: 'Afficher / masquer', en: 'Show / hide' })}
                  className="rounded-lg border border-white/10 bg-slate-800 p-2 transition hover:bg-slate-700"
                >
                  {service.visible === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingService({ ...service })}
                  title={t({ ar: 'تعديل', fr: 'Modifier', en: 'Edit' })}
                  className="rounded-lg border border-white/10 bg-slate-800 p-2 transition hover:bg-slate-700"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteService(service)}
                  title={t({ ar: 'حذف', fr: 'Supprimer', en: 'Delete' })}
                  className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {filteredServices.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center text-sm text-white/50">
              {t({ ar: 'لا توجد خدمة مطابقة.', fr: 'Aucun service trouvé.', en: 'No matching service.' })}
            </p>
          )}
        </div>
      </div>

      <div>
        <h4 className="mb-3 flex items-center gap-2 text-lg font-bold">
          <Star className="h-5 w-5 text-amber-300" />
          {t({ ar: 'الباقات', fr: 'Packs', en: 'Packs' })}
        </h4>
        <div className="space-y-2">
          {catalog.packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`flex flex-col gap-3 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${
                pkg.visible === false
                  ? 'border-white/5 bg-slate-900/40 opacity-60'
                  : 'border-white/10 bg-slate-900/80'
              }`}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold">{pkg.name[language] || pkg.name.ar}</span>
                  {pkg.featured && (
                    <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      {t({ ar: 'مميزة', fr: 'En vedette', en: 'Featured' })}
                    </span>
                  )}
                  {pkg.visible === false && (
                    <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                      {t({ ar: 'مخفية', fr: 'Masquée', en: 'Hidden' })}
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-white/50">{pkg.tagline[language] || pkg.tagline.ar}</p>
              </div>

              <div className="flex items-center gap-2 sm:shrink-0">
                <span dir="ltr" className="me-2 inline-block text-sm font-bold text-amber-300">
                  {pkg.price.toLocaleString('en-US').replace(/,/g, ' ')} DA
                </span>
                <button
                  type="button"
                  onClick={() => togglePackageVisibility(pkg)}
                  title={t({ ar: 'إظهار / إخفاء', fr: 'Afficher / masquer', en: 'Show / hide' })}
                  className="rounded-lg border border-white/10 bg-slate-800 p-2 transition hover:bg-slate-700"
                >
                  {pkg.visible === false ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPackage({ ...pkg })}
                  title={t({ ar: 'تعديل', fr: 'Modifier', en: 'Edit' })}
                  className="rounded-lg border border-white/10 bg-slate-800 p-2 transition hover:bg-slate-700"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeletePackage(pkg)}
                  title={t({ ar: 'حذف', fr: 'Supprimer', en: 'Delete' })}
                  className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-rose-300 transition hover:bg-rose-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
          {catalog.packages.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 text-center text-sm text-white/50">
              {t({ ar: 'لا توجد باقات بعد.', fr: 'Aucun pack pour le moment.', en: 'No packs yet.' })}
            </p>
          )}
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-relaxed text-emerald-200/80">
        <Check className="mt-0.5 h-4 w-4 shrink-0" />
        {t({
          ar: 'نصيحة: أخفِ الخدمة بدل حذفها إذا كنت تريد إيقافها مؤقتاً. الحذف نهائي، لكن زر «استرجاع الأصلي» يعيد الكتالوج الأساسي.',
          fr: 'Astuce : masquez un service au lieu de le supprimer pour le suspendre. La suppression est définitive, mais « Réinitialiser » restaure le catalogue de base.',
          en: 'Tip: hide a service instead of deleting it to pause it. Deletion is permanent, but “Reset” restores the base catalogue.',
        })}
      </p>
    </div>
  );
}

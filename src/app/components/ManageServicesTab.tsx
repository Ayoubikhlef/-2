import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getStoredServices, addService, updateService, deleteService, initializeServices } from '../utils/serviceStorage';
import { defaultServices, type ServiceCategory, type ServiceOption } from '../data/services';
import { Plus, Edit3, Trash2, Save, X, Tag, Minus } from 'lucide-react';
import { toast } from 'sonner';

const emptyCategory = (): Partial<ServiceCategory> => ({
  key: '',
  label: { ar: '', fr: '', en: '' },
  options: [],
});

const emptyOption = (): Partial<ServiceOption> => ({
  value: '',
  ar: '',
  fr: '',
  en: '',
});

export function ManageServicesTab({ services, onUpdate }: { services: ServiceCategory[]; onUpdate: () => void }) {
  const { t, language } = useLanguage();
  const [editingCategory, setEditingCategory] = useState<Partial<ServiceCategory> | null>(null);
  const [editingOption, setEditingOption] = useState<{ categoryId: number; option: Partial<ServiceOption> } | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  const handleEditCategory = (category: ServiceCategory) => {
    setEditingCategory({ ...category, options: category.options.map((o) => ({ ...o })) });
    setShowCategoryForm(true);
  };

  const handleNewCategory = () => {
    setEditingCategory(emptyCategory());
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = (id: number) => {
    if (confirm(t({ ar: 'هل أنت متأكد من حذف هذا القسم وجميع خدماته؟', fr: 'Êtes-vous sûr de vouloir supprimer cette catégorie et tous ses services?', en: 'Are you sure you want to delete this category and all its services?' }))) {
      deleteService(id);
      onUpdate();
      toast.success(t({ ar: 'تم حذف القسم', fr: 'Catégorie supprimée', en: 'Category deleted' }));
    }
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editingCategory.key || !editingCategory.label?.ar || !editingCategory.label?.fr || !editingCategory.label?.en) {
      toast.error(t({ ar: 'الرجاء ملء الحقول المطلوبة', fr: 'Veuillez remplir les champs obligatoires', en: 'Please fill required fields' }));
      return;
    }
    const categoryData: Omit<ServiceCategory, 'id'> = {
      key: editingCategory.key!,
      label: editingCategory.label!,
      options: editingCategory.options || [],
    };

    if ('id' in editingCategory && editingCategory.id) {
      updateService(editingCategory.id as number, categoryData);
      toast.success(t({ ar: 'تم تحديث القسم', fr: 'Catégorie mise à jour', en: 'Category updated' }));
    } else {
      addService(categoryData);
      toast.success(t({ ar: 'تم إضافة القسم', fr: 'Catégorie ajoutée', en: 'Category added' }));
    }
    onUpdate();
    setShowCategoryForm(false);
    setEditingCategory(null);
  };

  const handleEditOption = (categoryId: number, option: ServiceOption) => {
    setEditingOption({ categoryId, option: { ...option } });
  };

  const handleNewOption = (categoryId: number) => {
    setEditingOption({ categoryId, option: emptyOption() });
  };

  const handleDeleteOption = (categoryId: number, value: string) => {
    const category = services.find((c) => c.id === categoryId);
    if (!category) return;
    const updatedOptions = category.options.filter((o) => o.value !== value);
    updateService(categoryId, { options: updatedOptions });
    onUpdate();
    toast.success(t({ ar: 'تم حذف الخدمة', fr: 'Service supprimé', en: 'Service deleted' }));
  };

  const handleSaveOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOption) return;
    const { categoryId, option } = editingOption;
    if (!option.value || !option.ar || !option.fr || !option.en) {
      toast.error(t({ ar: 'الرجاء ملء الحقول المطلوبة', fr: 'Veuillez remplir les champs obligatoires', en: 'Please fill required fields' }));
      return;
    }
    const category = services.find((c) => c.id === categoryId);
    if (!category) return;

    const options = [...category.options];
    const idx = options.findIndex((o) => o.value === option.value);
    if (idx >= 0) {
      options[idx] = option as ServiceOption;
      toast.success(t({ ar: 'تم تحديث الخدمة', fr: 'Service mis à jour', en: 'Service updated' }));
    } else {
      options.push(option as ServiceOption);
      toast.success(t({ ar: 'تم إضافة الخدمة', fr: 'Service ajouté', en: 'Service added' }));
    }
    updateService(categoryId, { options });
    onUpdate();
    setEditingOption(null);
  };

  const addOptionField = (categoryId: number) => {
    setEditingOption({ categoryId, option: emptyOption() });
  };

  if (showCategoryForm) {
    return (
      <form onSubmit={handleSaveCategory} className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">
            {editingCategory?.id
              ? t({ ar: 'تعديل القسم', fr: 'Modifier catégorie', en: 'Edit Category' })
              : t({ ar: 'إضافة قسم جديد', fr: 'Ajouter catégorie', en: 'Add Category' })}
          </h3>
          <button type="button" onClick={() => setShowCategoryForm(false)} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'مفتاح القسم (للبرمجة)', fr: 'Clé catégorie (code)', en: 'Category Key (code)' })} *</label>
            <input
              value={editingCategory?.key || ''}
              onChange={(e) => setEditingCategory({ ...editingCategory!, key: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
              placeholder="print, scan, translate..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الاسم (عربي)', fr: 'Nom (Arabe)', en: 'Name (Arabic)' })} *</label>
            <input
              value={editingCategory?.label?.ar || ''}
              onChange={(e) => setEditingCategory({ ...editingCategory!, label: { ...editingCategory!.label!, ar: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الاسم (فرنسي)', fr: 'Nom (Français)', en: 'Name (French)' })} *</label>
            <input
              value={editingCategory?.label?.fr || ''}
              onChange={(e) => setEditingCategory({ ...editingCategory!, label: { ...editingCategory!.label!, fr: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الاسم (إنجليزي)', fr: 'Nom (Anglais)', en: 'Name (English)' })} *</label>
            <input
              value={editingCategory?.label?.en || ''}
              onChange={(e) => setEditingCategory({ ...editingCategory!, label: { ...editingCategory!.label!, en: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-slate-950 px-6 py-3 text-sm font-bold hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" />
            {editingCategory?.id
              ? t({ ar: 'حفظ التعديلات', fr: 'Enregistrer', en: 'Save Changes' })
              : t({ ar: 'إضافة القسم', fr: 'Ajouter', en: 'Add Category' })}
          </button>
        </div>
      </form>
    );
  }

  if (editingOption) {
    const { categoryId, option } = editingOption;
    return (
      <form onSubmit={handleSaveOption} className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">
            {option.value ? t({ ar: 'تعديل الخدمة', fr: 'Modifier service', en: 'Edit Service' }) : t({ ar: 'إضافة خدمة جديدة', fr: 'Ajouter service', en: 'Add Service' })}
          </h3>
          <button type="button" onClick={() => setEditingOption(null)} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'مفتاح الخدمة (فريد)', fr: 'Clé service (unique)', en: 'Service Key (unique)' })} *</label>
            <input
              value={option.value || ''}
              onChange={(e) => setEditingOption({ ...editingOption, option: { ...option, value: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
              placeholder="print-bw, scan-basic..."
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الاسم (عربي)', fr: 'Nom (Arabe)', en: 'Name (Arabic)' })} *</label>
            <input
              value={option.ar || ''}
              onChange={(e) => setEditingOption({ ...editingOption, option: { ...option, ar: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الاسم (فرنسي)', fr: 'Nom (Français)', en: 'Name (French)' })} *</label>
            <input
              value={option.fr || ''}
              onChange={(e) => setEditingOption({ ...editingOption, option: { ...option, fr: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الاسم (إنجليزي)', fr: 'Nom (Anglais)', en: 'Name (English)' })} *</label>
            <input
              value={option.en || ''}
              onChange={(e) => setEditingOption({ ...editingOption, option: { ...option, en: e.target.value } })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10">
          <button type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-slate-950 px-6 py-3 text-sm font-bold hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" />
            {option.value ? t({ ar: 'حفظ التعديلات', fr: 'Enregistrer', en: 'Save Changes' }) : t({ ar: 'إضافة الخدمة', fr: 'Ajouter', en: 'Add Service' })}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-white/60">
          {t({ ar: `${services.length} قسم`, fr: `${services.length} catégories`, en: `${services.length} categories` })}
        </p>
        <button onClick={handleNewCategory}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-slate-950 px-5 py-2.5 text-sm font-bold hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" />
          {t({ ar: 'إضافة قسم', fr: 'Ajouter catégorie', en: 'Add Category' })}
        </button>
      </div>

      <div className="space-y-4">
        {services.map((category) => (
          <div key={category.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Tag className="w-5 h-5 text-white/50" />
                  <span className="text-xl font-bold text-white">
                    {category.label[language]}
                  </span>
                  <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">{category.key}</span>
                </div>
                <p className="text-sm text-white/50">{category.options.length} {t({ ar: 'خدمة', fr: 'services', en: 'services' })}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleEditCategory(category)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-white/10">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteCategory(category.id)}
                  className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/20">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {category.options.map((opt) => (
                <div key={opt.value} className="rounded-xl border border-white/10 bg-slate-800/50 p-3 flex items-center justify-between hover:bg-slate-800/80 transition-all">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{opt[language]}</p>
                    <p className="text-xs text-white/40 font-mono">{opt.value}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleEditOption(category.id, opt)}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteOption(category.id, opt.value)}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => handleNewOption(category.id)}
                className="col-span-full rounded-xl border-2 border-dashed border-white/10 bg-slate-800/50 p-4 text-center text-white/60 hover:border-primary hover:bg-slate-800/80 transition-all">
                <Plus className="w-5 h-5 mx-auto mb-1" />
                <span className="text-sm">{t({ ar: 'إضافة خدمة', fr: 'Ajouter service', en: 'Add Service' })}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
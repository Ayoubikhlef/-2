import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getStoredProducts, addProduct, updateProduct, deleteProduct, copyProduct, toggleProductVisibility } from '../utils/productStorage';
import { getAllCategories, getBuiltInCategories, getCustomCategories, addCustomCategory, removeCustomCategory, type CustomCategory } from '../utils/categoryStorage';
import { products as defaultProducts, type Product, type ProductSpec } from '../data/products';
import { Plus, Edit3, Trash2, Save, X, Tag, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const builtIn = getBuiltInCategories();
const emptyProduct = (): Partial<Product> => ({
  nameAr: '',
  nameFr: '',
  nameEn: '',
  shortDescAr: '',
  shortDescFr: '',
  shortDescEn: '',
  descAr: '',
  descFr: '',
  descEn: '',
  price: 0,
  salePrice: null,
  saleEnd: null,
  sku: '',
  barcode: '',
  weight: '',
  dimensions: '',
  warranty: '',
  seoKeywords: '',
  hidden: false,
  images: [],
  image: '',
  category: 'accessories',
  brand: '',
  specs: [],
  relatedIds: [],
});

export function ManageProductsTab({ products, onUpdate }: { products: Product[]; onUpdate: () => void }) {
  const { t, language } = useLanguage();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [specs, setSpecs] = useState<ProductSpec[]>([]);

  const handleEdit = (product: Product) => {
    setEditing(product);
    setSpecs(product.specs.map((s) => ({ label: s.label, value: s.value })));
    setShowForm(true);
  };

  const handleNew = () => {
    setEditing(emptyProduct());
    setSpecs([]);
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (confirm(t({ ar: 'هل أنت متأكد من حذف هذا المنتج؟', fr: 'Êtes-vous sûr de vouloir supprimer ce produit?', en: 'Are you sure you want to delete this product?' }))) {
      deleteProduct(id);
      onUpdate();
      toast.success(t({ ar: 'تم حذف المنتج', fr: 'Produit supprimé', en: 'Product deleted' }));
    }
  };

  const handleCopy = (id: number) => {
    copyProduct(id);
    onUpdate();
    toast.success(t({ ar: 'تم نسخ المنتج', fr: 'Produit dupliqué', en: 'Product duplicated' }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!editing.nameAr || !editing.nameFr || !editing.nameEn || !editing.price) {
      toast.error(t({ ar: 'الرجاء ملء الحقول المطلوبة', fr: 'Veuillez remplir les champs obligatoires', en: 'Please fill required fields' }));
      return;
    }
    const productData: Omit<Product, 'id'> = {
      nameAr: editing.nameAr!,
      nameFr: editing.nameFr!,
      nameEn: editing.nameEn!,
      shortDescAr: editing.shortDescAr || '',
      shortDescFr: editing.shortDescFr || '',
      shortDescEn: editing.shortDescEn || '',
      descAr: editing.descAr || '',
      descFr: editing.descFr || '',
      descEn: editing.descEn || '',
      price: Number(editing.price),
      salePrice: editing.salePrice ?? null,
      saleEnd: editing.saleEnd || null,
      sku: editing.sku || '',
      barcode: editing.barcode || '',
      weight: editing.weight || '',
      dimensions: editing.dimensions || '',
      warranty: editing.warranty || '',
      seoKeywords: editing.seoKeywords || '',
      hidden: editing.hidden ?? false,
      images: editing.images || [],
      image: editing.image || '',
      category: editing.category || 'accessories',
      brand: editing.brand || '',
      specs: specs.map((s) => ({
        label: s.label,
        value: s.value,
      })),
      relatedIds: editing.relatedIds || [],
    };

    if ('id' in editing && editing.id) {
      updateProduct(editing.id as number, productData);
      toast.success(t({ ar: 'تم تحديث المنتج', fr: 'Produit mis à jour', en: 'Product updated' }));
    } else {
      addProduct(productData);
      toast.success(t({ ar: 'تم إضافة المنتج', fr: 'Produit ajouté', en: 'Product added' }));
    }
    onUpdate();
  };

  const addSpec = () => {
    setSpecs([...specs, { label: { ar: '', fr: '', en: '' }, value: { ar: '', fr: '', en: '' } }]);
  };

  const removeSpec = (index: number) => {
    setSpecs(specs.filter((_, i) => i !== index));
  };

  const updateSpec = (index: number, field: 'label' | 'value', lang: 'ar' | 'fr' | 'en', val: string) => {
    const updated = [...specs];
    updated[index] = { ...updated[index], [field]: { ...updated[index][field], [lang]: val } };
    setSpecs(updated);
  };

  if (showForm) {
    return (
      <form onSubmit={handleSave} className="rounded-[32px] border border-white/10 bg-slate-900/80 p-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">
            {editing?.id
              ? t({ ar: 'تعديل المنتج', fr: 'Modifier produit', en: 'Edit Product' })
              : t({ ar: 'إضافة منتج جديد', fr: 'Ajouter produit', en: 'Add Product' })}
          </h3>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-white/10">
              <X className="w-5 h-5" />
            </button>
            <button type="button" onClick={() => setEditing((prev) => ({ ...prev, key: '' }))}
              className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-all border border-emerald-500/20">
              <Tag className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الاسم (عربي)', fr: 'Nom (Arabe)', en: 'Name (Arabic)' })} *</label>
            <input value={editing?.nameAr || ''} onChange={(e) => setEditing({ ...editing!, nameAr: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الاسم (فرنسي)', fr: 'Nom (Français)', en: 'Name (French)' })} *</label>
            <input value={editing?.nameFr || ''} onChange={(e) => setEditing({ ...editing!, nameFr: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الاسم (إنجليزي)', fr: 'Nom (Anglais)', en: 'Name (English)' })} *</label>
            <input value={editing?.nameEn || ''} onChange={(e) => setEditing({ ...editing!, nameEn: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'السعر (د.ج)', fr: 'Prix (DZD)', en: 'Price (DZD)' })} *</label>
            <input type="number" value={editing?.price || ''} onChange={(e) => setEditing({ ...editing!, price: Number(e.target.value) })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
          </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الصنف', fr: 'Catégorie', en: 'Category' })}</label>
          <select value={editing?.category || 'accessories'} onChange={(e) => setEditing({ ...editing!, category: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary">
            {[...getBuiltInCategories(), ...getCustomCategories()].map((c) => (
              <option key={c.key} value={c.key}>{c.label[language]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'العلامة التجارية', fr: 'Marque', en: 'Brand' })}</label>
          <input value={editing?.brand || ''} onChange={(e) => setEditing({ ...editing!, brand: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الوصف (عربي)', fr: 'Description (Arabe)', en: 'Description (Arabic)' })}</label>
          <textarea rows={3} value={editing?.descAr || ''} onChange={(e) => setEditing({ ...editing!, descAr: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الوصف (فرنسي)', fr: 'Description (Français)', en: 'Description (French)' })}</label>
          <textarea rows={3} value={editing?.descFr || ''} onChange={(e) => setEditing({ ...editing!, descFr: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary resize-none" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الوصف (إنجليزي)', fr: 'Description (Anglais)', en: 'Description (English)' })}</label>
          <textarea rows={3} value={editing?.descEn || ''} onChange={(e) => setEditing({ ...editing!, descEn: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary resize-none" />
        </div>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'وصف مختصر (عربي)', fr: 'Description courte (Arabe)', en: 'Short Description (Arabic)' })}</label>
            <textarea rows={2} value={editing?.shortDescAr || ''} onChange={(e) => setEditing({ ...editing!, shortDescAr: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'وصف مختصر (فرنسي)', fr: 'Description courte (Français)', en: 'Short Description (French)' })}</label>
            <textarea rows={2} value={editing?.shortDescFr || ''} onChange={(e) => setEditing({ ...editing!, shortDescFr: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary resize-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'وصف مختصر (إنجليزي)', fr: 'Description courte (Anglais)', en: 'Short Description (English)' })}</label>
            <textarea rows={2} value={editing?.shortDescEn || ''} onChange={(e) => setEditing({ ...editing!, shortDescEn: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary resize-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'SKU', fr: 'SKU', en: 'SKU' })}</label>
            <input value={editing?.sku || ''} onChange={(e) => setEditing({ ...editing!, sku: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الباركود', fr: 'Code-barres', en: 'Barcode' })}</label>
            <input value={editing?.barcode || ''} onChange={(e) => setEditing({ ...editing!, barcode: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'سعر التخفيض', fr: 'Prix soldé', en: 'Sale Price' })}</label>
            <input type="number" value={editing?.salePrice ?? ''} onChange={(e) => setEditing({ ...editing!, salePrice: e.target.value ? Number(e.target.value) : null })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'مدة التخفيض', fr: 'Fin de promotion', en: 'Sale End' })}</label>
            <input type="date" value={editing?.saleEnd || ''} onChange={(e) => setEditing({ ...editing!, saleEnd: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الوزن', fr: 'Poids', en: 'Weight' })}</label>
            <input value={editing?.weight || ''} onChange={(e) => setEditing({ ...editing!, weight: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الأبعاد', fr: 'Dimensions', en: 'Dimensions' })}</label>
            <input value={editing?.dimensions || ''} onChange={(e) => setEditing({ ...editing!, dimensions: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الضمان', fr: 'Garantie', en: 'Warranty' })}</label>
          <input value={editing?.warranty || ''} onChange={(e) => setEditing({ ...editing!, warranty: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'الكلمات المفتاحية (SEO)', fr: 'Mots-clés (SEO)', en: 'SEO Keywords' })}</label>
          <input value={editing?.seoKeywords || ''} onChange={(e) => setEditing({ ...editing!, seoKeywords: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-semibold text-white/80">{t({ ar: 'إظهار المنتج', fr: 'Afficher le produit', en: 'Show Product' })}</label>
          <button type="button" onClick={() => setEditing({ ...editing!, hidden: !editing?.hidden })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${editing?.hidden ? 'bg-red-500/50' : 'bg-emerald-500/50'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${editing?.hidden ? 'translate-x-1' : 'translate-x-6'}`} />
          </button>
          <span className="text-xs text-white/50">
            {editing?.hidden
              ? t({ ar: 'مخفي', fr: 'Masqué', en: 'Hidden' })
              : t({ ar: 'مرئي', fr: 'Visible', en: 'Visible' })}
          </span>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'صور إضافية (روابط مفصولة بفواصل)', fr: 'Images supplémentaires (URLs séparées par des virgules)', en: 'Additional Images (comma-separated URLs)' })}</label>
          <input value={editing?.images?.join(', ') || ''} onChange={(e) => setEditing({ ...editing!, images: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary" />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-white/80">{t({ ar: 'رابط الصورة', fr: 'URL de l\'image', en: 'Image URL' })}</label>
          <div className="flex gap-3">
            <input value={editing?.image || ''} onChange={(e) => setEditing({ ...editing!, image: e.target.value })}
              className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-primary"
              placeholder="https://..." />
            {editing?.image && (
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 bg-slate-800 flex-shrink-0">
                <img src={editing.image} alt="" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-semibold text-white/80">{t({ ar: 'المواصفات', fr: 'Spécifications', en: 'Specs' })}</label>
            <button type="button" onClick={addSpec} className="inline-flex items-center gap-2 rounded-full bg-primary/20 text-primary px-4 py-2 text-sm font-semibold hover:bg-primary/30 transition-all">
              <Plus className="w-4 h-4" />
              {t({ ar: 'إضافة مواصفة', fr: 'Ajouter spécification', en: 'Add Spec' })}
            </button>
          </div>
          <div className="space-y-3">
            {specs.map((spec, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-slate-800/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-white/50">#{idx + 1}</span>
                  <button type="button" onClick={() => removeSpec(idx)} className="text-red-400 hover:text-red-300 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/50 mb-1">{t({ ar: 'التسمية', fr: 'Étiquette', en: 'Label' })}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="عربي" value={spec.label.ar} onChange={(e) => updateSpec(idx, 'label', 'ar', e.target.value)}
                        className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-primary text-center" />
                      <input placeholder="Français" value={spec.label.fr} onChange={(e) => updateSpec(idx, 'label', 'fr', e.target.value)}
                        className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-primary text-center" />
                      <input placeholder="English" value={spec.label.en} onChange={(e) => updateSpec(idx, 'label', 'en', e.target.value)}
                        className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-primary text-center" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-white/50 mb-1">{t({ ar: 'القيمة', fr: 'Valeur', en: 'Value' })}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <input placeholder="عربي" value={spec.value.ar} onChange={(e) => updateSpec(idx, 'value', 'ar', e.target.value)}
                        className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-primary text-center" />
                      <input placeholder="Français" value={spec.value.fr} onChange={(e) => updateSpec(idx, 'value', 'fr', e.target.value)}
                        className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-primary text-center" />
                      <input placeholder="English" value={spec.value.en} onChange={(e) => updateSpec(idx, 'value', 'en', e.target.value)}
                        className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs text-white outline-none focus:border-primary text-center" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4 border-t border-white/10">
          <button type="button" onClick={() => setShowForm(false)}
            className="px-6 py-3 rounded-xl border border-white/10 text-white/70 hover:bg-slate-800 transition-all text-sm font-semibold">
            {t({ ar: 'إلغاء', fr: 'Annuler', en: 'Cancel' })}
          </button>
          <button type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-slate-950 px-6 py-3 text-sm font-bold hover:bg-primary/90 transition-all">
            <Save className="w-4 h-4" />
            {editing?.id
              ? t({ ar: 'حفظ التعديلات', fr: 'Enregistrer', en: 'Save Changes' })
              : t({ ar: 'إضافة المنتج', fr: 'Ajouter', en: 'Add Product' })}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-white/60">
          {t({ ar: `${products.length} منتج`, fr: `${products.length} produits`, en: `${products.length} products` })}
        </p>
        <button onClick={handleNew}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-slate-950 px-5 py-2.5 text-sm font-bold hover:bg-primary/90 transition-all">
          <Plus className="w-4 h-4" />
          {t({ ar: 'إضافة منتج', fr: 'Ajouter produit', en: 'Add Product' })}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {products.map((product) => (
          <div key={product.id} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 flex items-center gap-4 hover:bg-slate-800/80 transition-all">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
              <img src={product.image} alt="" className="w-full h-full object-contain p-1" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-white truncate">
                  {language === 'ar' ? product.nameAr : language === 'fr' ? product.nameFr : product.nameEn}
                </p>
                {product.hidden && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/20">
                    {t({ ar: 'مخفي', fr: 'Masqué', en: 'Hidden' })}
                  </span>
                )}
                {product.salePrice != null && product.saleEnd && new Date(product.saleEnd).getTime() > Date.now() && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                    {t({ ar: 'تخفيض', fr: 'Soldé', en: 'Sale' })}
                  </span>
                )}
              </div>
              <p className="text-sm text-white/50">
                {product.price.toLocaleString()} د.ج · {product.brand}
                {product.sku && <span className="ml-2 text-white/30">{product.sku}</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { toggleProductVisibility(product.id); onUpdate(); }}
                className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-all border border-amber-500/20">
                {product.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={() => handleCopy(product.id)}
                className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all border border-blue-500/20">
                <Copy className="w-4 h-4" />
              </button>
              <button onClick={() => handleEdit(product)}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-white/10">
                <Edit3 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(product.id)}
                className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all border border-red-500/20">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

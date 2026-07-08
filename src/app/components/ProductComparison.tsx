import { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { products as defaultProducts, type Product } from '../data/products';
import { getStoredProducts } from '../utils/productStorage';
import { X, Plus, Check, Minus } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function ProductComparison({ onClose }: Props) {
  const { t, language } = useLanguage();
  const allProducts = useMemo(() => getStoredProducts(defaultProducts), []);
  const [selected, setSelected] = useState<Product[]>([]);

  const available = allProducts.filter(p => !selected.find(s => s.id === p.id));

  const toggleProduct = (product: Product) => {
    if (selected.find(s => s.id === product.id)) {
      setSelected(prev => prev.filter(s => s.id !== product.id));
    } else if (selected.length < 4) {
      setSelected(prev => [...prev, product]);
    }
  };

  const fields = [
    { label: t({ ar: 'السعر', fr: 'Prix', en: 'Price' }), get: (p: Product) => p.salePrice || p.price },
    { label: t({ ar: 'العلامة التجارية', fr: 'Marque', en: 'Brand' }), get: (p: Product) => p.brand || '-' },
    { label: t({ ar: 'المخزون', fr: 'Stock', en: 'Stock' }), get: (p: Product) => p.stock !== undefined ? (p.stock > 0 ? `${p.stock}` : t({ ar: 'غير متوفر', fr: 'Rupture', en: 'Out of stock' })) : '-' },
    { label: t({ ar: 'الوزن', fr: 'Poids', en: 'Weight' }), get: (p: Product) => p.weight || '-' },
    { label: t({ ar: 'الأبعاد', fr: 'Dimensions', en: 'Dimensions' }), get: (p: Product) => p.dimensions || '-' },
    { label: t({ ar: 'الضمان', fr: 'Garantie', en: 'Warranty' }), get: (p: Product) => p.warranty || '-' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-6xl mt-8 mb-8 rounded-[32px] border border-white/10 bg-slate-900 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">{t({ ar: 'مقارنة المنتجات', fr: 'Comparaison de produits', en: 'Product Comparison' })}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {selected.map(p => (
            <button key={p.id} onClick={() => toggleProduct(p)} className="flex items-center gap-2 bg-primary/20 text-primary px-3 py-1.5 rounded-full text-sm font-semibold border border-primary/30">
              {language === 'ar' ? p.nameAr : language === 'fr' ? p.nameFr : p.nameEn}
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        <div className="mb-6">
          <p className="text-sm text-white/40 mb-2">{t({ ar: 'اختر منتجات للمقارنة (2-4)', fr: 'Sélectionnez 2 à 4 produits', en: 'Select 2-4 products to compare' })}</p>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {available.map(p => (
              <button key={p.id} onClick={() => toggleProduct(p)} disabled={selected.length >= 4}
                className="flex items-center gap-1.5 bg-slate-800 text-white/70 px-3 py-1.5 rounded-full text-xs font-medium hover:bg-slate-700 transition border border-white/10 disabled:opacity-40">
                <Plus className="w-3 h-3" /> {language === 'ar' ? p.nameAr : language === 'fr' ? p.nameFr : p.nameEn}
              </button>
            ))}
          </div>
        </div>

        {selected.length >= 2 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left text-white/40 font-medium px-4 py-3 border-b border-white/10 w-40"></th>
                  {selected.map(p => (
                    <th key={p.id} className="text-center px-4 py-3 border-b border-white/10 min-w-[180px]">
                      <img src={p.image} alt="" className="w-20 h-20 object-contain mx-auto mb-2 rounded-xl bg-slate-800 p-2" />
                      <p className="text-white font-bold text-sm">{language === 'ar' ? p.nameAr : language === 'fr' ? p.nameFr : p.nameEn}</p>
                      <p className="text-primary font-bold mt-1">{p.salePrice || p.price} د.ج</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fields.map(field => (
                  <tr key={field.label}>
                    <td className="text-white/40 font-medium px-4 py-3 border-b border-white/10">{field.label}</td>
                    {selected.map(p => (
                      <td key={p.id} className="text-center text-white/80 px-4 py-3 border-b border-white/10">{field.get(p)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

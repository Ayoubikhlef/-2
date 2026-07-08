import { useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { products as defaultProducts, type Product } from '../data/products';
import { getStoredProducts } from '../utils/productStorage';

interface ProductSuggestionsProps {
  productId: number;
  onSelect: (product: Product) => void;
  max?: number;
}

export function ProductSuggestions({ productId, onSelect, max = 4 }: ProductSuggestionsProps) {
  const { t, language } = useLanguage();
  const allProducts = useMemo(() => getStoredProducts(defaultProducts), []);

  const currentProduct = allProducts.find(p => p.id === productId);
  if (!currentProduct) return null;

  const suggestions = allProducts.filter(
    p => p.id !== productId && p.category === currentProduct.category && !p.hidden
  ).slice(0, max);

  if (suggestions.length === 0) return null;

  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        {t({ ar: '🛒 منتجات من نفس الفئة', fr: '🛒 Produits similaires', en: '🛒 More from this category' })}
      </h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {suggestions.map((product) => (
          <button
            key={product.id}
            onClick={() => onSelect(product)}
            className="group flex-shrink-0 w-40 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all p-3 text-center"
          >
            <div className="h-24 bg-muted rounded-lg mb-2 overflow-hidden">
              <img
                src={product.image}
                alt={language === 'ar' ? product.nameAr : product.nameEn}
                className="w-full h-full object-contain p-2 bg-white/50 dark:bg-white/5"
                loading="lazy"
              />
            </div>
            <p className="text-xs font-semibold leading-tight mb-1 line-clamp-2">
              {language === 'ar' ? product.nameAr : language === 'fr' ? product.nameFr : product.nameEn}
            </p>
            <p className="text-xs text-primary font-bold">
              {product.price.toLocaleString()} د.ج
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import type { Product } from '../data/products';

interface SearchSuggestionsProps {
  query: string;
  products: Product[];
  onSelect: (product: Product) => void;
  onClose: () => void;
}

export function SearchSuggestions({ query, products, onSelect, onClose }: SearchSuggestionsProps) {
  const { language } = useLanguage();

  if (!query.trim() || products.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border bg-background shadow-2xl overflow-hidden z-50"
    >
      <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => { onSelect(product); onClose(); }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted transition text-right"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0">
              <img src={product.image} alt="" className="w-full h-full object-contain" loading="lazy" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {language === 'ar' ? product.nameAr : language === 'fr' ? product.nameFr : product.nameEn}
              </p>
              <p className="text-xs text-muted-foreground">{product.price.toLocaleString()} د.ج</p>
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

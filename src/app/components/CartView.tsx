import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ShoppingCart, X, Trash2 } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { DeliveryCalculator } from './DeliveryCalculator';

export function Cart() {
  const { items, removeItem, updateQuantity, total, clear } = useCart();
  const { t, language } = useLanguage();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
          <ShoppingCart className="w-10 h-10 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground font-medium">
          {t({ ar: 'السلة فارغة', fr: 'Panier vide', en: 'Cart is empty' })}
        </p>
        <p className="text-sm text-muted-foreground/60 mt-1">
          {t({ ar: 'أضف منتجات للبدء', fr: 'Ajoutez des produits', en: 'Add some products' })}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.productId}
          className="flex flex-wrap items-center justify-between bg-card p-4 rounded-lg border border-border hover:border-primary/30 transition-all"
        >
          <div className="flex-1">
            <h4 className="font-semibold truncate">{item.name}</h4>
            <p className="text-sm text-muted-foreground">
              {formatPrice(item.price)} × {item.quantity}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
              className="w-16 px-2 py-1 border border-border rounded text-center"
            />
            <p className="font-semibold w-24 text-right">
              {formatPrice(item.price * item.quantity)}
            </p>
            <button
              onClick={() => removeItem(item.productId)}
              className="text-destructive hover:bg-destructive/10 p-2 rounded transition-colors"
              title={t({ ar: 'إزالة', fr: 'Supprimer', en: 'Remove' })}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}

      <div className="border-t border-border pt-4 mt-4 space-y-3">
        <DeliveryCalculator />
        <div className="flex justify-between">
          <span className="text-lg font-bold">
            {t({ ar: 'المجموع:', fr: 'Total:', en: 'Total:' })}
          </span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(total)}
          </span>
        </div>
        <button
          onClick={clear}
          className="w-full bg-destructive/20 text-destructive hover:bg-destructive/30 px-4 py-2 rounded-lg transition-colors"
        >
          {t({ ar: 'مسح السلة', fr: 'Vider le panier', en: 'Clear Cart' })}
        </button>
      </div>
    </div>
  );
}

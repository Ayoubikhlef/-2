import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { wilayas } from '../data/products';
import { getDeliveryFee, isFreeDelivery, FREE_DELIVERY_THRESHOLD } from '../data/deliveryFees';
import { formatPrice } from '../lib/utils';
import { Truck } from 'lucide-react';

export function DeliveryCalculator() {
  const { deliveryWilaya, setDeliveryWilaya, total } = useCart();
  const { t, language } = useLanguage();

  const fee = isFreeDelivery(total) ? 0 : getDeliveryFee(deliveryWilaya);

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="w-4 h-4 text-primary" />
        {t({ ar: 'حساب التوصيل', fr: 'Calculer la livraison', en: 'Delivery estimate' })}
      </div>
      <select
        value={deliveryWilaya}
        onChange={(e) => setDeliveryWilaya(Number(e.target.value))}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
      >
        {wilayas.map((w) => (
          <option key={w.id} value={w.id}>
            {language === 'ar' ? w.nameAr : language === 'fr' ? w.nameFr : w.nameEn}
          </option>
        ))}
      </select>
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">
          {t({ ar: 'تكلفة التوصيل', fr: 'Frais de livraison', en: 'Delivery fee' })}
        </span>
        <span className={`font-semibold ${fee === 0 ? 'text-green-500' : ''}`}>
          {fee === 0
            ? t({ ar: 'مجاني', fr: 'Gratuit', en: 'Free' })
            : formatPrice(fee)}
        </span>
      </div>
      {!isFreeDelivery(total) && (
        <p className="text-xs text-muted-foreground">
          {t({ ar: `توصيل مجاني للطلبات التي تتجاوز ${formatPrice(FREE_DELIVERY_THRESHOLD)}`, fr: `Livraison gratuite pour les commandes de plus de ${formatPrice(FREE_DELIVERY_THRESHOLD)}`, en: `Free delivery for orders over ${formatPrice(FREE_DELIVERY_THRESHOLD)}` })}
        </p>
      )}
      {isFreeDelivery(total) && (
        <p className="text-xs text-green-500 font-medium">
          {t({ ar: 'تهانينا! طلبك مؤهل للتوصيل المجاني', fr: 'Félicitations! Votre commande est éligible à la livraison gratuite', en: 'Congratulations! Your order qualifies for free delivery' })}
        </p>
      )}
    </div>
  );
}

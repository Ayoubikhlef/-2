import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { wilayas } from '../data/products';
import { formatPrice } from '../lib/utils';
import { Home, Store, Truck } from 'lucide-react';

export function DeliveryCalculator() {
  const {
    deliveryWilaya,
    deliveryMethod,
    setDeliveryMethod,
    deliveryQuote: quote,
  } = useCart();
  const { t, language } = useLanguage();
  const destination = wilayas.find((w) => w.id === deliveryWilaya);
  const destinationName = destination
    ? language === 'ar'
      ? destination.nameAr
      : language === 'fr'
      ? destination.nameFr
      : destination.nameEn
    : String(deliveryWilaya);

  const methods = [
    {
      id: 'home' as const,
      icon: Home,
      label: t({ ar: 'توصيل للمنزل', fr: 'À domicile', en: 'Home delivery' }),
      hint: t({ ar: 'حتى باب المنزل', fr: 'Jusqu\'à votre porte', en: 'To your door' }),
    },
    {
      id: 'desk' as const,
      icon: Store,
      label: t({ ar: 'مكتب التوصيل', fr: 'Point relais', en: 'Stop desk' }),
      hint: t({ ar: 'استلام من المكتب', fr: 'Retrait au bureau', en: 'Pick up at the desk' }),
    },
  ];

  const waivedBase = quote.freeShipping ? quote.baseFee : 0;

  return (
    <div className="bg-muted/50 rounded-lg p-4 space-y-3 border border-border">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Truck className="w-4 h-4 text-primary" />
        {t({ ar: 'طريقة التوصيل', fr: 'Mode de livraison', en: 'Delivery method' })}
        <span className="ms-auto text-xs font-normal text-muted-foreground">
          {t({ ar: 'إلى', fr: 'Vers', en: 'To' })}: {destinationName}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {methods.map((method) => {
          const Icon = method.icon;
          const active = deliveryMethod === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => setDeliveryMethod(method.id)}
              className={`rounded-lg border px-2.5 py-2 text-start transition-colors ${
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              <span className="flex items-center gap-1.5 text-xs font-bold">
                <Icon className="w-3.5 h-3.5" />
                {method.label}
              </span>
              <span className="mt-0.5 block text-[10px] text-muted-foreground">{method.hint}</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-muted-foreground">
            {t({ ar: 'السعر الأساسي', fr: 'Tarif de base', en: 'Base rate' })}
            {quote.parcels > 1 ? ` × ${quote.parcels}` : ''}
          </span>
          <span className="font-semibold">{formatPrice(quote.baseFee)}</span>
        </div>

        {quote.weightFee > 0 && (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">
              {t({ ar: 'زيادة الوزن', fr: 'Supplément poids', en: 'Weight surcharge' })}
            </span>
            <span className="font-semibold">{formatPrice(quote.weightFee)}</span>
          </div>
        )}

        {quote.oversizeSurcharge > 0 && (
          <div className="flex justify-between gap-2">
            <span className="text-muted-foreground">
              {t({ ar: 'منتج كبير الحجم', fr: 'Colis volumineux', en: 'Large item surcharge' })}
            </span>
            <span className="font-semibold">{formatPrice(quote.oversizeSurcharge)}</span>
          </div>
        )}

        {waivedBase > 0 && (
          <div className="flex justify-between gap-2 text-emerald-600 dark:text-emerald-400">
            <span>{t({ ar: 'توصيل مجاني', fr: 'Livraison gratuite', en: 'Free delivery' })}</span>
            <span className="font-semibold">-{formatPrice(waivedBase)}</span>
          </div>
        )}

        <div className="flex justify-between items-center border-t border-border pt-2">
          <span className="text-muted-foreground">
            {t({ ar: 'تكلفة التوصيل', fr: 'Frais de livraison', en: 'Delivery fee' })}
          </span>
          <span className={`font-bold ${quote.deliveryFee === 0 ? 'text-green-500' : ''}`}>
            {quote.deliveryFee === 0
              ? t({ ar: 'مجاني', fr: 'Gratuit', en: 'Free' })
              : formatPrice(quote.deliveryFee)}
          </span>
        </div>
      </div>

      {quote.billedWeightKg > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {t({ ar: 'الوزن المحتسب', fr: 'Poids facturé', en: 'Billed weight' })}: {quote.billedWeightKg} kg
          {quote.excessWeightKg > 0
            ? ` (+${quote.excessWeightKg} kg)`
            : ` ${t({ ar: 'داخل الحد المسموح', fr: 'inclus', en: 'included' })}`}
        </p>
      )}

      {quote.freeShipping ? (
        <p className="text-xs text-green-500 font-medium">
          {quote.deliveryFee > 0
            ? t({
                ar: 'التوصيل الأساسي مجاني؛ تُطبق زيادات الوزن أو الحجم فقط.',
                fr: 'La livraison de base est offerte ; seuls les suppléments poids/volume s\'appliquent.',
                en: 'Base delivery is free; only weight/large-item supplements apply.',
              })
            : t({
                ar: 'تهانينا! طلبك مؤهل للتوصيل المجاني.',
                fr: 'Félicitations ! Votre commande bénéficie de la livraison gratuite.',
                en: 'Congratulations! Your order qualifies for free delivery.',
              })}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">
          {t({
            ar: `توصيل مجاني للطلبات التي تتجاوز ${formatPrice(quote.freeThreshold)}. السعر يشمل أول 5 كغ.`,
            fr: `Livraison gratuite dès ${formatPrice(quote.freeThreshold)}. Tarif valable jusqu'à 5 kg.`,
            en: `Free delivery for orders over ${formatPrice(quote.freeThreshold)}. Rate covers the first 5 kg.`,
          })}
        </p>
      )}

      {deliveryMethod === 'desk' && (
        <p className="text-[11px] text-muted-foreground">
          {t({
            ar: 'سيتم إيداع الطرد في أقرب مكتب توصيل إليك.',
            fr: 'Votre colis sera déposé au point relais le plus proche.',
            en: 'Your parcel will be left at the nearest stop desk.',
          })}
        </p>
      )}
    </div>
  );
}

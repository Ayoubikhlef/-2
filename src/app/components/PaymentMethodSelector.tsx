'use client';

import { Lock } from 'lucide-react';
import { PAYMENT_GATEWAYS, PaymentMethod, getPaymentLabel } from '../utils/paymentProvider';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  selectedMethod: PaymentMethod | null;
  onSelect: (methodId: PaymentMethod) => void;
}

export function PaymentMethodSelector({ selectedMethod, onSelect }: Props) {
  const { t, language } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
        <Lock className="w-4 h-4" />
        {t({ ar: 'اختر طريقة الدفع', fr: 'Choisissez le moyen de paiement', en: 'Choose payment method' })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {PAYMENT_GATEWAYS.map((gateway) => (
          <button
            key={gateway.id}
            type="button"
            onClick={() => onSelect(gateway.id)}
            disabled={!gateway.available}
            aria-pressed={selectedMethod === gateway.id}
            className={`
              relative p-4 rounded-xl border-2 transition-all text-right
              ${selectedMethod === gateway.id
                ? 'border-primary bg-primary/10'
                : !gateway.available
                  ? 'border-gray-300 opacity-50 cursor-not-allowed'
                  : 'border-border hover:border-primary/60 hover:bg-accent/30'
              }
            `}
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl mb-1" aria-hidden="true">{gateway.icon}</span>
              <span className="font-bold text-sm leading-tight">
                {getPaymentLabel(gateway.id, language)}
              </span>
            </div>

            {/* حالة البوابة */}
            {!gateway.available && (
              <div className="absolute top-2 right-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                  {t({ ar: 'قريباً', fr: 'Bientôt', en: 'Coming soon' })}
                </span>
              </div>
            )}

            {/* وصف سريع */}
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
              {gateway.description[language]}
            </p>

            {/* معلومات الرسوم (اختياري) */}
            {(gateway.fees.percentage || 0) > 0 && selectedMethod === gateway.id && (
              <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                ~{gateway.fees.percentage}% {t({ ar: 'رسوم', fr: 'de frais', en: 'fees' })}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* رسالة توضيحية */}
      <p className="text-xs text-muted-foreground text-center">
        {t({
          ar: 'اختر الطريقة المفضلة لديك وسنتواصل معك لتأكيد الدفع',
          fr: 'Choisissez votre moyen de paiement préféré et nous vous contacterons pour confirmer',
          en: 'Choose your preferred payment method and we will contact you to confirm',
        })}
      </p>
    </div>
  );
}

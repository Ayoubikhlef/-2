import { useLanguage } from '../contexts/LanguageContext';
import { Banknote, CheckCircle2 } from 'lucide-react';

interface Props {
  orderId: string;
  onPaid: () => void;
}

export function PaymentForm({ orderId, onPaid }: Props) {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
      <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
      <p className="text-white font-bold text-lg mb-1">{t({ ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison', en: 'Cash on delivery' })}</p>
      <p className="text-sm text-white/60">{t({ ar: 'سيتم الدفع نقداً عند استلام الطلب', fr: 'Vous paierez en espèces à la réception', en: 'You will pay cash on delivery' })}</p>
      <button onClick={onPaid}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary text-white px-6 py-2 text-sm font-semibold hover:bg-primary/90 transition-all">
        <Banknote className="w-4 h-4" />
        {t({ ar: 'تأكيد الطلب', fr: 'Confirmer la commande', en: 'Confirm order' })}
      </button>
    </div>
  );
}

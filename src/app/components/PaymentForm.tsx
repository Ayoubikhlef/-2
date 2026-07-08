import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';
import { CreditCard, Wallet, Smartphone, Banknote, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  orderId: string;
  onPaid: () => void;
}

const methods = [
  { id: 'cib', label: 'CIB', icon: CreditCard, desc: 'Carte bancaire' },
  { id: 'edahabia', label: 'Edahabia', icon: Wallet, desc: 'Carte Edahabia' },
  { id: 'baridimob', label: 'BaridiMob', icon: Smartphone, desc: 'Portefeuille mobile' },
  { id: 'cod', label: 'Cash', icon: Banknote, desc: 'Paiement à la livraison' },
] as const;

export function PaymentForm({ orderId, onPaid }: Props) {
  const { t } = useLanguage();
  const [method, setMethod] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ paymentId: string; instructions: string } | null>(null);

  const submit = async () => {
    if (!method) return;
    setProcessing(true);
    try {
      const r = await api.payment.init({ orderId, method: method as any, phone: phone || undefined });
      setResult(r);
      if (method === 'cod') {
        await api.payment.confirm({ paymentId: r.paymentId });
        toast.success(t({ ar: 'سيتم الدفع عند الاستلام', fr: 'Paiement à la livraison', en: 'Cash on delivery' }));
        onPaid();
      }
    } catch {
      toast.error(t({ ar: 'فشلت عملية الدفع', fr: 'Échec du paiement', en: 'Payment failed' }));
    } finally {
      setProcessing(false);
    }
  };

  if (result) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
        <p className="text-white font-bold text-lg mb-1">{t({ ar: 'تم بدء عملية الدفع', fr: 'Paiement initié', en: 'Payment initiated' })}</p>
        <p className="text-sm text-white/60">{result.instructions}</p>
        <p className="text-xs text-white/40 mt-2">ID: {result.paymentId}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-white">{t({ ar: 'اختيار طريقة الدفع', fr: 'Choisir le mode de paiement', en: 'Select payment method' })}</h3>
      <div className="grid grid-cols-2 gap-2">
        {methods.map(m => {
          const Icon = m.icon;
          const selected = method === m.id;
          return (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`flex items-center gap-3 rounded-xl p-4 text-sm font-semibold border transition-all text-left ${selected ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 bg-slate-800/60 text-white/70 hover:bg-slate-800'}`}>
              <Icon className={`w-5 h-5 ${selected ? 'text-primary' : 'text-white/40'}`} />
              <div>
                <div>{m.label}</div>
                <div className={`text-xs font-normal ${selected ? 'text-primary/70' : 'text-white/40'}`}>{m.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
      {method !== 'cod' && method && (
        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
          placeholder={t({ ar: 'رقم الهاتف (اختياري)', fr: 'Numéro de téléphone (optionnel)', en: 'Phone number (optional)' })}
          className="w-full rounded-xl bg-slate-800 text-white px-4 py-3 text-sm border border-white/10 placeholder:text-white/30 focus:outline-none focus:border-primary" />
      )}
      <button onClick={submit} disabled={!method || processing}
        className="w-full flex items-center justify-center gap-2 rounded-full bg-primary text-white py-3 text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50">
        {processing ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <CreditCard className="w-4 h-4" />}
        {t({ ar: 'تأكيد الدفع', fr: 'Confirmer le paiement', en: 'Confirm payment' })}
      </button>
    </div>
  );
}

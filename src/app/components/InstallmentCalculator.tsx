import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Calculator } from 'lucide-react';

interface Props {
  price: number;
}

export function InstallmentCalculator({ price }: Props) {
  const { t, language } = useLanguage();
  const [months, setMonths] = useState(6);

  const rate = 0.07;
  const monthly = Math.round((price * (1 + rate)) / months);
  const totalInstallment = monthly * months;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mt-3">
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-primary" />
        <span className="text-sm font-bold text-white">{t({ ar: 'احسب التقسيط', fr: 'Calculer mensualité', en: 'Installment calculator' })}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-white/50">{t({ ar: 'عدد الأشهر', fr: 'Mois', en: 'Months' })}:</span>
        <div className="flex gap-1">
          {[3, 6, 9, 12].map(m => (
            <button key={m} onClick={() => setMonths(m)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${months === m ? 'bg-primary text-white' : 'bg-slate-800 text-white/60 hover:bg-slate-700'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-white/60">{t({ ar: 'قسط شهري', fr: 'Mensualité', en: 'Monthly' })}:</span>
        <span className="text-primary font-bold">{monthly.toLocaleString()} د.ج</span>
      </div>
      <div className="flex items-center justify-between text-xs text-white/40 mt-1">
        <span>{t({ ar: 'المجموع', fr: 'Total', en: 'Total' })}:</span>
        <span>{totalInstallment.toLocaleString()} د.ج <span className="text-white/20">(+{Math.round(rate * 100)}%)</span></span>
      </div>
    </div>
  );
}

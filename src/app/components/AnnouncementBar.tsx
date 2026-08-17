import { Truck, BadgeCheck, ShieldCheck, Zap } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ITEMS: { ar: string; fr: string; en: string }[] = [
  { ar: '🚚 توصيل مجاني للطلبات فوق 5000 د.ج', fr: '🚚 Livraison gratuite dès 5000 DA', en: '🚚 Free delivery on orders over 5000 DA' },
  { ar: '💵 الدفع عند الاستلام في 58 ولاية', fr: '💵 Paiement à la livraison dans 58 wilayas', en: '💵 Cash on delivery in all 58 wilayas' },
  { ar: '🔧 خدمات إصلاح وصيانة للمعلوميات', fr: '🔧 Réparation et maintenance informatique', en: '🔧 Computer repair & maintenance services' },
  { ar: '⚡ عروض خاصة أسبوعية على الطابعات والشاشات', fr: '⚡ Offres spéciales chaque semaine', en: '⚡ Weekly deals on printers & monitors' },
];

export function AnnouncementBar() {
  const { t } = useLanguage();
  const langs = ['ar', 'fr', 'en'] as const;
  const all = langs.flatMap(lang => ITEMS.map(i => i[lang]));

  return (
    <div className="relative top-0 z-[60] overflow-hidden bg-gradient-to-r from-blue-800 via-blue-600 to-cyan-600 text-white py-1.5 select-none">
      <div className="flex w-max animate-[aos-marquee_30s_linear_infinite]">
        {[0, 1].map(dup => (
          <div key={dup} className="flex shrink-0" aria-hidden={dup === 1}>
            {all.map((msg, idx) => (
              <span key={`${dup}-${idx}`} className="mx-8 flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm font-semibold tracking-wide">
                {msg}
              </span>
            ))}
          </div>
        ))}
      </div>
      <style>{`@keyframes aos-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

export function TrustBadges() {
  const { t } = useLanguage();
  const badges = [
    { icon: Truck, label: t({ ar: 'توصيل 58 ولاية', fr: 'Livraison 58 wilayas', en: 'Delivery to 58 wilayas' }) },
    { icon: BadgeCheck, label: t({ ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison', en: 'Cash on delivery' }) },
    { icon: ShieldCheck, label: t({ ar: 'منتجات مضمونة', fr: 'Produits garantis', en: 'Guaranteed products' }) },
    { icon: Zap, label: t({ ar: 'تجهيز سريع للطلب', fr: 'Préparation rapide', en: 'Fast order processing' }) },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 pt-1">
      {badges.map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3 py-2 text-[11px] font-bold text-primary">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="leading-tight">{label}</span>
        </div>
      ))}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { ShoppingBag, Calendar, CheckCircle } from 'lucide-react';

type ActivityItem = {
  type: 'purchase' | 'booking';
  name: { ar: string; fr: string; en: string };
  location: { ar: string; fr: string; en: string };
  item: { ar: string; fr: string; en: string };
  timeAgo: { ar: string; fr: string; en: string };
};

const mockActivities: ActivityItem[] = [
  {
    type: 'purchase',
    name: { ar: 'سفيان', fr: 'Sofiane', en: 'Sofiane' },
    location: { ar: 'جيجل (الميلية)', fr: 'Jijel (El Milia)', en: 'Jijel (El Milia)' },
    item: { ar: 'طابعة إبسون L3250', fr: 'Imprimante Epson L3250', en: 'Epson L3250 Printer' },
    timeAgo: { ar: 'منذ دقيقتين', fr: 'il y a 2 min', en: '2 mins ago' },
  },
  {
    type: 'booking',
    name: { ar: 'عبد الرحمن', fr: 'Abderrahmane', en: 'Abderrahmane' },
    location: { ar: 'سطيف', fr: 'Sétif', en: 'Sétif' },
    item: { ar: 'موعد تأشيرة فرنسا (TLSContact)', fr: 'Rendez-vous visa France (TLS)', en: 'France Visa Appointment (TLS)' },
    timeAgo: { ar: 'منذ 5 دقائق', fr: 'il y a 5 min', en: '5 mins ago' },
  },
  {
    type: 'purchase',
    name: { ar: 'مريم', fr: 'Meriem', en: 'Meriem' },
    location: { ar: 'الجزائر العاصمة', fr: 'Alger', en: 'Algiers' },
    item: { ar: 'لوحة مفاتيح ميكانيكية RGB', fr: 'Clavier mécanique RGB', en: 'RGB Mechanical Keyboard' },
    timeAgo: { ar: 'منذ 10 دقائق', fr: 'il y a 10 min', en: '10 mins ago' },
  },
  {
    type: 'booking',
    name: { ar: 'ياسين', fr: 'Yacine', en: 'Yacine' },
    location: { ar: 'جيجل (الميلية)', fr: 'Jijel (El Milia)', en: 'Jijel (El Milia)' },
    item: { ar: 'ترجمة رسمية للوثائق', fr: 'Traduction officielle de documents', en: 'Official Document Translation' },
    timeAgo: { ar: 'منذ 15 دقيقة', fr: 'il y a 15 min', en: '15 mins ago' },
  },
  {
    type: 'purchase',
    name: { ar: 'شيماء', fr: 'Chaima', en: 'Chaima' },
    location: { ar: 'قسنطينة', fr: 'Constantine', en: 'Constantine' },
    item: { ar: 'فأرة ألعاب لاسلكية', fr: 'Souris Gaming sans fil', en: 'Wireless Gaming Mouse' },
    timeAgo: { ar: 'منذ 8 دقائق', fr: 'il y a 8 min', en: '8 mins ago' },
  },
  {
    type: 'booking',
    name: { ar: 'أمين', fr: 'Amine', en: 'Amine' },
    location: { ar: 'بجاية', fr: 'Béjaïa', en: 'Bejaia' },
    item: { ar: 'حجز موعد تأشيرة إسبانيا (BLS)', fr: 'Rendez-vous visa Espagne (BLS)', en: 'Spain Visa Appointment (BLS)' },
    timeAgo: { ar: 'منذ 12 دقيقة', fr: 'il y a 12 min', en: '12 mins ago' },
  },
  {
    type: 'purchase',
    name: { ar: 'سامي', fr: 'Samy', en: 'Samy' },
    location: { ar: 'وهران', fr: 'Oran', en: 'Oran' },
    item: { ar: 'حقيبة ظهر مضادة للسرقة للابتوب', fr: 'Sac à dos antivol pour Laptop', en: 'Anti-theft Laptop Backpack' },
    timeAgo: { ar: 'منذ 4 دقائق', fr: 'il y a 4 min', en: '4 mins ago' },
  },
];

export function LiveActivity() {
  const { language } = useLanguage();
  const [current, setCurrent] = useState<ActivityItem | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showNext = () => {
      const idx = Math.floor(Math.random() * mockActivities.length);
      setCurrent(mockActivities[idx]);
      setVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setVisible(false);
      }, 5500);
    };

    // Initial delay before first popup
    const initialTimeout = setTimeout(showNext, 6000);

    // Periodic intervals of 25 seconds
    const interval = setInterval(showNext, 25000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && current && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-6 z-[90] max-w-sm rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-2xl backdrop-blur-md flex items-center gap-3 text-white"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${
            current.type === 'purchase' ? 'bg-blue-600' : 'bg-amber-500'
          }`}>
            {current.type === 'purchase' ? (
              <ShoppingBag className="h-5 w-5" />
            ) : (
              <Calendar className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed text-slate-100">
              {language === 'ar' ? (
                <>
                  قام <span className="font-bold text-blue-400">{current.name.ar}</span> من{' '}
                  <span className="font-bold text-slate-300">{current.location.ar}</span>{' '}
                  {current.type === 'purchase' ? 'بشراء' : 'بحجز'}{' '}
                  <span className="font-bold text-yellow-400">{current.item.ar}</span> للتو!
                </>
              ) : language === 'fr' ? (
                <>
                  <span className="font-bold text-blue-400">{current.name.fr}</span> de{' '}
                  <span className="font-bold text-slate-300">{current.location.fr}</span> a{' '}
                  {current.type === 'purchase' ? 'acheté' : 'réservé'}{' '}
                  <span className="font-bold text-yellow-400">{current.item.fr}</span> !
                </>
              ) : (
                <>
                  <span className="font-bold text-blue-400">{current.name.en}</span> from{' '}
                  <span className="font-bold text-slate-300">{current.location.en}</span>{' '}
                  {current.type === 'purchase' ? 'purchased' : 'booked'}{' '}
                  <span className="font-bold text-yellow-400">{current.item.en}</span>!
                </>
              )}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-[10px] text-slate-400 font-medium">
                {current.timeAgo[language as 'ar' | 'fr' | 'en']} • {language === 'ar' ? 'تم التأكيد' : language === 'fr' ? 'Vérifié' : 'Verified'}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getStoreStatus, nextOpeningDayOffset } from '../utils/storeHours';

const DAY_NAMES: Record<'ar' | 'fr' | 'en', string[]> = {
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
  fr: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

interface Props {
  /** `compact` fits the header pill, `full` adds the closing/opening sentence. */
  variant?: 'compact' | 'full';
  className?: string;
}

export function OpenStatusBadge({ variant = 'compact', className = '' }: Props) {
  const { language, t } = useLanguage();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // Re-evaluate every 30 s so the badge flips exactly at opening/closing time.
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const status = getStoreStatus(now);
  const dayOffset = nextOpeningDayOffset(now);
  const nextDayName = DAY_NAMES[language][(status.dayIndex + dayOffset) % 7];

  const label = status.open
    ? t({
        ar: `مفتوح الآن — حتى ${status.closesAt}`,
        fr: `Ouvert — jusqu'à ${status.closesAt}`,
        en: `Open now — until ${status.closesAt}`,
      })
    : dayOffset === 0
      ? t({
          ar: `مغلق الآن — نفتح اليوم ${status.opensAt}`,
          fr: `Fermé — ouvre aujourd'hui à ${status.opensAt}`,
          en: `Closed — opens today at ${status.opensAt}`,
        })
      : t({
          ar: `مغلق الآن — نفتح ${nextDayName} ${status.opensAt}`,
          fr: `Fermé — ouvre ${nextDayName} à ${status.opensAt}`,
          en: `Closed — opens ${nextDayName} at ${status.opensAt}`,
        });

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
        status.open
          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      } ${variant === 'full' ? 'text-sm' : ''} ${className}`}
      title={label}
    >
      <span className="relative flex h-2 w-2" aria-hidden="true">
        {status.open && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
        )}
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            status.open ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
        />
      </span>
      <Clock className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
      {label}
    </span>
  );
}

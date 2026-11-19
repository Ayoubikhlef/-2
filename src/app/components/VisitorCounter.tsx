import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';

type VisitStats = { visitors: number; today: number };

// The footer remounts on route and language changes. One request per page load
// is enough, and the cached value renders immediately on remount.
let cached: VisitStats | null = null;
let pending: Promise<VisitStats | null> | null = null;

function loadVisitStats(): Promise<VisitStats | null> {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    // Respect Do Not Track: such visitors still see the public number but are
    // not added to it.
    const dnt =
      typeof navigator !== 'undefined' &&
      (navigator.doNotTrack === '1' || (window as any).doNotTrack === '1');
    pending = (dnt ? api.visits.stats() : api.visits.track())
      .then((data) => {
        const stats = {
          visitors: Number(data?.visitors) || 0,
          today: Number(data?.today) || 0,
        };
        if (stats.visitors > 0) cached = stats;
        return cached;
      })
      .catch(() => null)
      .finally(() => {
        pending = null;
      });
  }
  return pending;
}

export function VisitorCounter() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<VisitStats | null>(cached);

  useEffect(() => {
    let active = true;
    void loadVisitStats().then((next) => {
      if (active && next) setStats(next);
    });
    return () => {
      active = false;
    };
  }, []);

  if (!stats || stats.visitors <= 0) return null;

  const numberFormat = new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US');
  const total = numberFormat.format(stats.visitors);
  const today = numberFormat.format(stats.today);

  return (
    <span
      className="inline-flex items-center gap-1.5"
      title={t({
        ar: `${total} زائر — ${today} اليوم`,
        fr: `${total} visiteurs — ${today} aujourd'hui`,
        en: `${total} visitors — ${today} today`,
      })}
    >
      <span className="hidden sm:inline text-muted-foreground/40" aria-hidden="true">
        •
      </span>
      <Eye className="w-4 h-4 text-primary" aria-hidden="true" />
      <span>
        <span className="font-semibold text-foreground">{total}</span>{' '}
        {t({ ar: 'زائر', fr: 'visiteurs', en: 'visitors' })}
      </span>
      <span className="text-xs text-muted-foreground/70">
        · {t({ ar: 'اليوم', fr: "aujourd'hui", en: 'today' })} {today}
      </span>
    </span>
  );
}

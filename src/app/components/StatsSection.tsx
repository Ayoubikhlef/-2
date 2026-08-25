import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { Users, PackageCheck, Clock3, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

function Counter({ target, suffix }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {value.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  const { t } = useLanguage();

  const stats = [
    { icon: Users, value: 1200, suffix: '+', label: t({ ar: 'عميل سعيد', fr: 'Clients satisfaits', en: 'Happy customers' }) },
    { icon: PackageCheck, value: 3500, suffix: '+', label: t({ ar: 'طلب منجّز', fr: 'Commandes livrées', en: 'Orders delivered' }) },
    { icon: Clock3, value: 8, suffix: '', label: t({ ar: 'سنوات خبرة', fr: "Années d'expérience", en: 'Years of experience' }) },
    { icon: MapPin, value: 58, suffix: '', label: t({ ar: 'ولاية نغطيها', fr: 'Wilayas couvertes', en: 'Wilayas covered' }) },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className="relative py-12 bg-white dark:bg-slate-900 border-y border-border/50"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map(({ icon: Icon, value, suffix, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group text-center p-4 md:p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
            >
              <div className="mx-auto mb-3 w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
              </div>
              <p className="text-2xl md:text-3xl font-black text-primary mb-1">
                <Counter target={value} suffix={suffix} />
              </p>
              <p className="text-xs md:text-sm font-semibold text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

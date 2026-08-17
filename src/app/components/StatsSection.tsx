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
      className="relative py-14"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ icon: Icon, value, suffix, label }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur-md p-6 sm:p-8 text-center hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300"
            >
              <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-cyan-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg shadow-primary/25 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent mb-1">
                <Counter target={value} suffix={suffix} />
              </p>
              <p className="text-sm font-semibold text-muted-foreground">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
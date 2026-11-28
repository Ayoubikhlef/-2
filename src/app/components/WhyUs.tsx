import { useState, useEffect } from 'react';
import { Award, Clock, Users, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteContent } from '../utils/siteContentStorage';
import { motion } from 'motion/react';

const icons = [Award, Clock, Users, Heart];

export function WhyUs() {
  const { t, language } = useLanguage();
  const [content, setContent] = useState(() => getSiteContent());

  useEffect(() => {
    const refresh = () => setContent(getSiteContent());
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  const { features, title, subtitle } = content.whyUs;

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="py-16 md:py-20 bg-gray-50 dark:bg-card/30"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-14">
          <span className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground mb-4">
            {t({ ar: 'لماذا نحن', fr: 'Pourquoi nous', en: 'Why Us' })}
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
            {t(title)}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            {t(subtitle)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {features.map((feature, index) => {
            const Icon = icons[index];
            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group card-copy bg-white dark:bg-card p-5 md:p-6 lg:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border h-full"
              >
                <div className="bg-primary/10 text-primary w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title[language]}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description[language]}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

import { useState, useEffect } from 'react';
import { Printer, FileText, Calendar, Wifi, Server, FileCheck, Zap, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteContent } from '../utils/siteContentStorage';
import { motion } from 'motion/react';

const cardIcons = [Printer, FileText, Calendar, Wifi, Server];
const digiIcons = [FileCheck, Zap, Shield];

export function Services() {
  const { t, language } = useLanguage();
  const [content, setContent] = useState(() => getSiteContent());

  useEffect(() => {
    const refresh = () => setContent(getSiteContent());
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      id="services" className="py-16 md:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-14">
          <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-4">
            {t({ ar: 'خدماتنا', fr: 'Nos Services', en: 'Our Services' })}
          </span>
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {t(content.services.title)}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
            {t(content.services.subtitle)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {content.services.cards.map((service, index) => {
            const Icon = cardIcons[index] || Printer;
            return (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border overflow-hidden"
              >
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title[language]}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-70 group-hover:opacity-60 transition-opacity duration-300`} />
                  <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="p-5 md:p-6">
                  <h3 className="text-lg font-bold mb-2">{service.title[language]}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{service.description[language]}</p>
                </div>
              </motion.div>
            );
          })}

          {content.services.digitizationItems.map((item, index) => {
            const Icon = digiIcons[index] || FileCheck;
            return (
              <motion.div
                key={`dig-${index}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border overflow-hidden"
              >
                <div className={`h-36 sm:h-44 bg-gradient-to-br ${item.color} flex items-center justify-center relative`}>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="p-5 md:p-6">
                  <h3 className="text-lg font-bold mb-2">{item.title[language]}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description[language]}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

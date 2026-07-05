import { Printer, FileText, Calendar, Wifi, Server, FileCheck, Zap, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteContent } from '../utils/siteContentStorage';
import { motion } from 'motion/react';

const cardIcons = [Printer, FileText, Calendar, Wifi, Server];
const digiIcons = [FileCheck, Zap, Shield];

export function Services() {
  const { t, language } = useLanguage();
  const content = getSiteContent();

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      id="services" className="py-20 bg-white/70 dark:bg-slate-950/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="mb-4">
            {t(content.services.title)}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {t(content.services.subtitle)}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.services.cards.map((service, index) => {
            const Icon = cardIcons[index] || Printer;
            return (
              <div
                key={service.id}
                className="group relative bg-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border overflow-hidden"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title[language]}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-60 group-hover:opacity-50 transition-opacity duration-300`}></div>
                  <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="mb-2">{service.title[language]}</h3>
                  <p className="text-sm text-muted-foreground">{service.description[language]}</p>
                </div>
              </div>
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
                className="group relative bg-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border overflow-hidden flex flex-col"
              >
                <div className={`h-44 bg-gradient-to-br ${item.color} flex items-center justify-center relative`}>
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-center">
                  <h3 className="mb-2">{item.title[language]}</h3>
                  <p className="text-sm text-muted-foreground">{item.description[language]}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

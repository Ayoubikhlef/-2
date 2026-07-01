import { Award, Clock, Users, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { whyUsFeatures } from '../data/translations';
import { motion } from 'motion/react';

const icons = [Award, Clock, Users, Heart];

export function WhyUs() {
  const { t, language } = useLanguage();

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="py-16 bg-white/70 dark:bg-slate-950/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="mb-4">
            {t({
              ar: 'لماذا تختار Ayoub Office Services؟',
              fr: 'Pourquoi choisir Ayoub Office Services ?',
              en: 'Why Choose Ayoub Office Services?'
            })}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t({
              ar: 'نحن نقدم أكثر من مجرد خدمات - نقدم تجربة متميزة تجعل عملك أسهل وأسرع',
              fr: 'Nous offrons plus que des services - une expérience exceptionnelle qui facilite et accélère votre travail',
              en: 'We offer more than just services - an exceptional experience that makes your work easier and faster'
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyUsFeatures.map((feature, index) => {
            const Icon = icons[index];
            return (
              <div
                key={feature.id}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-300"></div>
                <div className="relative bg-card p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-border h-full">
                  <div className={`bg-gradient-to-br ${feature.color} w-14 h-14 rounded-xl flex items-center justify-center mb-4 transform group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="mb-2">{feature.title[language]}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description[language]}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}

import { Printer, FileText, Calendar, Wifi, Server, FileCheck, Zap, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { services } from '../data/translations';
import { motion } from 'motion/react';

const icons = [Printer, FileText, Calendar, Wifi, Server];

const digitizationItems = [
  { icon: FileCheck, color: 'from-emerald-500 to-emerald-600', title: { ar: 'تنسيقات متعددة', fr: 'Formats multiples', en: 'Multiple Formats' }, desc: { ar: 'PDF، Word، Excel وجميع التنسيقات الشائعة', fr: 'PDF, Word, Excel et tous les formats courants', en: 'PDF, Word, Excel and all common formats' } },
  { icon: Zap, color: 'from-purple-500 to-purple-600', title: { ar: 'خدمة سريعة', fr: 'Service rapide', en: 'Fast Service' }, desc: { ar: 'إنجاز سريع دون المساس بالجودة', fr: 'Réalisation rapide sans compromettre la qualité', en: 'Fast delivery without compromising quality' } },
  { icon: Shield, color: 'from-orange-500 to-orange-600', title: { ar: 'سرية تامة', fr: 'Confidentialité totale', en: 'Complete Confidentiality' }, desc: { ar: 'نحافظ على خصوصية وأمان مستنداتك', fr: 'Nous protégeons la confidentialité de vos documents', en: 'We protect your documents\' privacy' } },
];

export function Services() {
  const { t, language } = useLanguage();

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
            {t({ ar: 'خدماتنا', fr: 'Nos Services', en: 'Our Services' })}
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            {t({
              ar: 'مجموعة كاملة من الخدمات المكتبية لتبسيط عملك اليومي و خدمات الرقمنة المتقدمة حلول رقمية احترافية لمستنداتك',
              fr: 'Une gamme complète de services pour simplifier votre quotidien et des solutions numériques professionnelles pour vos documents',
              en: 'A complete range of office services to simplify your daily work and professional digital solutions for your documents'
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = icons[index];
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

          {digitizationItems.map((item, index) => (
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
                  <item.icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-center">
                <h3 className="mb-2">{item.title[language]}</h3>
                <p className="text-sm text-muted-foreground">{item.desc[language]}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

import { useState, useEffect } from 'react';
import { Printer, FileText, Calendar, Wifi, Server, FileCheck, Zap, Shield, Globe, ArrowRight, Brain, TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteContent } from '../utils/siteContentStorage';
import { motion } from 'motion/react';

const cardIcons = [Printer, FileText, Calendar, Wifi, Server, Brain, Zap, TrendingUp];
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
          <span className="inline-flex items-center rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground mb-4">
            {t({ ar: 'خدماتنا', fr: 'Nos Services', en: 'Our Services' })}
          </span>
          <h2 className="text-3xl md:text-4xl font-semibold mb-4">
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
                className="group bg-white dark:bg-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border overflow-hidden"
              >
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title[language]}
                    loading="lazy"
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-xl">
                    <Icon className="w-6 h-6 text-primary" />
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
                className="group bg-white dark:bg-card rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-border overflow-hidden"
              >
                <div className="relative h-40 sm:h-48 bg-muted/50 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title[language]}
                      loading="lazy"
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-xl">
                    <Icon className="w-6 h-6 text-primary" />
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

        <motion.a
          href="/create-website"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="group relative mt-6 flex flex-col items-start gap-4 overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-sm transition-all hover:shadow-xl sm:flex-row sm:items-center sm:justify-between md:p-8"
        >
          
          
          <div className="relative flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10 ring-1 ring-primary-foreground/25">
              <Globe className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-lg font-semibold md:text-xl">
                {t({ ar: 'موقعك الاحترافي جاهز خلال أيام', fr: 'Votre site professionnel prêt en quelques jours', en: 'Your professional website ready in days' })}
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-primary-foreground/80">
                {t({
                  ar: '24 قالباً جاهزاً — متجر، شركة، عيادة، مطعم، صيدلية وغيرها — معاينة حية قبل الطلب، ونطاق مجاني على pages.dev.',
                  fr: '24 modèles prêts — boutique, entreprise, clinique, restaurant, pharmacie et plus — aperçu live avant commande et domaine gratuit sur pages.dev.',
                  en: '24 ready templates — store, company, clinic, restaurant, pharmacy and more — live preview before ordering and a free pages.dev domain.',
                })}
              </p>
            </div>
          </div>
          <span className="relative inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary-foreground px-5 py-3 text-sm font-semibold text-primary transition group-hover:bg-primary-foreground/90">
            {t({ ar: 'أنشئ موقعك الآن', fr: 'Créez votre site', en: 'Create your website' })}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </span>
        </motion.a>
      </div>
    </motion.section>
  );
}

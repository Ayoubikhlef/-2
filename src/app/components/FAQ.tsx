import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useLanguage } from '../contexts/LanguageContext';
import { faqItems } from '../data/faq';
import { motion } from 'motion/react';

export function FAQ() {
  const { t, language } = useLanguage();

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      id="faq" className="py-20 bg-gradient-to-b from-white/80 to-slate-50/70 dark:from-slate-950/80 dark:to-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="mb-4">
            {t({ ar: 'أسئلة شائعة', fr: 'Questions fréquentes', en: 'Frequently Asked Questions' })}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t({
              ar: 'إليك أهم الأسئلة التي نتلقاها عادةً مع إجابات سريعة وواضحة.',
              fr: 'Voici les questions les plus fréquentes avec des réponses claires et rapides.',
              en: 'Here are the most frequent questions with clear and quick answers.'
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="rounded-[32px] border border-border bg-card p-8 shadow-lg">
            <Accordion type="single" collapsible defaultValue={faqItems[0]?.id} className="space-y-4">
              {faqItems.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger>
                    {item.question[language]}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{item.answer[language]}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="rounded-[32px] border border-border bg-gradient-to-br from-primary/10 to-transparent p-8 shadow-lg flex flex-col justify-center">
            <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
              {t({ ar: 'دعم العملاء', fr: 'Support client', en: 'Customer Support' })}
            </span>
            <h3 className="text-3xl font-bold mb-4">
              {t({ ar: 'لا تزال تحتاج مساعدة؟', fr: 'Besoin de plus d’aide ?', en: 'Still need help?' })}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t({
                ar: 'فريقنا جاهز للرد على استفساراتك وتقديم حلول سريعة. اتصل بنا عبر الهاتف أو البريد الإلكتروني.',
                fr: 'Notre équipe est prête à répondre à vos questions et à fournir des solutions rapides.',
                en: 'Our team is ready to answer your questions and provide fast solutions.'
              })}
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <span className="font-semibold text-foreground">{t({ ar: 'هاتف', fr: 'Téléphone', en: 'Phone' })}:</span>
                <span className="block">0674 11 32 90</span>
              </div>
              <div>
                <span className="font-semibold text-foreground">{t({ ar: 'بريد إلكتروني', fr: 'Email', en: 'Email' })}:</span>
                <span className="block">ayoub.office.services@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

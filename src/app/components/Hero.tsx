import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { ArrowRight, Phone, Globe, Sparkles } from 'lucide-react';
import { getSiteContent } from '../utils/siteContentStorage';
import { getSiteSettings } from '../utils/siteSettingsStorage';
import { TechHeroBackground } from './TechHeroBackground';

export function Hero() {
  const { t } = useLanguage();
  const [content, setContent] = useState(() => getSiteContent());
  const [settings, setSettings] = useState(() => getSiteSettings());

  useEffect(() => {
    const refresh = () => { setContent(getSiteContent()); setSettings(getSiteSettings()); };
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden">
      {/* Animated technology background (or a custom image set in admin) */}
      <div className="absolute inset-0">
        {content.hero.bgImage?.trim() ? (
          <img
            src={content.hero.bgImage}
            alt=""
            width={1920}
            height={1080}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <TechHeroBackground />
        )}
        {/* Readability gradient follows the page direction: the veil sits
            behind the text, leaving the open side of the hero fully visible
            in both themes. */}
        <div className="hero-readability absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-3xl xl:max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-[clamp(3.5rem,10vw,7rem)] mb-6 text-slate-900 leading-[1.05] font-semibold dark:text-white"
            >
              {t(content.hero.title)}
              <br />
              <span className="text-primary">
                {t(content.hero.brandName)}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg md:text-xl mb-10 text-slate-600 max-w-xl leading-relaxed dark:text-white/80"
            >
              {t(content.hero.subtitle)}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex flex-wrap items-center gap-4"
            >
              <a
                href="#services"
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition-all  active:scale-95 text-base"
              >
                {t({ ar: 'اكتشف خدماتنا', fr: 'Découvrir nos services', en: 'Discover our services' })}
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#products"
                className="inline-flex items-center gap-2 bg-primary/5 backdrop-blur-sm text-slate-800 border border-primary/25 px-8 py-4 rounded-xl font-semibold hover:bg-primary/10 transition-all text-base dark:bg-white/10 dark:text-white dark:border-white/20 dark:hover:bg-white/20"
              >
                {t({ ar: 'تصفح المنتجات', fr: 'Voir nos produits', en: 'View our products' })}
              </a>
              <a
                href="/create-website"
                className="inline-flex items-center gap-2 border border-primary/25 bg-primary/5 text-foreground px-8 py-4 rounded-xl font-semibold hover:bg-primary/10 transition-all active:scale-95 text-base dark:border-white/20 dark:bg-white/10 dark:hover:bg-white/15"
              >
                <Globe className="w-5 h-5" />
                {t({ ar: 'أنشئ موقعك الآن', fr: 'Créez votre site', en: 'Create your website' })}
              </a>
              <a
                href={`tel:${settings.contact.phone}`}
                className="inline-flex items-center gap-2 border border-border bg-background/60 text-foreground px-6 py-4 rounded-xl font-semibold hover:bg-muted transition-all text-base dark:bg-white/10"
              >
                <Phone className="w-5 h-5" />
                {t({ ar: 'اتصل بنا', fr: 'Appelez-nous', en: 'Call us' })}
              </a>
            </motion.div>

            <motion.a
              href="#digital-services"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="group mt-8 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-primary/20 bg-white/80 p-3 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/20 dark:bg-white/10"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1 text-start">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                  {t({
                    ar: 'خدمات الذكاء الاصطناعي — سيرة، شعار، صور، فيديو وشات بوت',
                    fr: 'Services IA — CV, logo, photos, vidéo et chatbot',
                    en: 'AI services — CV, logo, photos, video and chatbot',
                  })}
                </span>
                <span className="mt-0.5 block text-xs text-slate-600 dark:text-white/70">
                  {t({
                    ar: 'نسلّمك النتيجة جاهزة، بدون اشتراكات ولا إعداد معقّد.',
                    fr: 'Résultat livré prêt à l’emploi, sans abonnement ni configuration complexe.',
                    en: 'You get the finished result, with no subscriptions or complex setup.',
                  })}
                </span>
              </span>
              <ArrowRight className="h-5 w-5 shrink-0 text-primary transition group-hover:translate-x-1 rtl:rotate-180" />
            </motion.a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

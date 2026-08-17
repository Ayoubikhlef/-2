import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { ShoppingCart, Phone } from 'lucide-react';
import { getSiteContent } from '../utils/siteContentStorage';

export function Hero() {
  const { t } = useLanguage();
  const [content, setContent] = useState(() => getSiteContent());

  useEffect(() => {
    const refresh = () => setContent(getSiteContent());
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  return (
    <section className="relative min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-primary via-primary to-blue-900 dark:bg-transparent text-white overflow-hidden">
      <div className="absolute inset-0">
        <img src={content.hero.bgImage} alt="" className="w-full h-full object-cover object-center opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/75 to-blue-900/85 dark:from-slate-950/60 dark:via-transparent dark:to-transparent"></div>
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.10)_0%,transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(34,211,238,0.10)_0%,transparent_50%)]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-8" />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl mb-6 text-white leading-tight"
          >
            {t(content.hero.title)}
            <br />
            <span className="bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent inline-block font-black tracking-tight text-5xl sm:text-7xl md:text-8xl lg:text-9xl">
              {t(content.hero.brandName)}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl mb-10 text-white/80 max-w-3xl mx-auto leading-relaxed"
          >
            {t(content.hero.subtitle)}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <a href="#products" className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-xl font-bold hover:bg-white/90 transition-all shadow-lg shadow-black/10 active:scale-95">
              <ShoppingCart className="w-4 h-4" />
              {t({ ar: 'تسوق الآن', fr: 'Acheter maintenant', en: 'Shop Now' })}
            </a>
            <a href="#contact" className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all">
              <Phone className="w-4 h-4" />
              {t({ ar: 'اتصل بنا', fr: 'Contactez-nous', en: 'Contact Us' })}
            </a>
          </motion.div>
        </motion.div>
      </div>


    </section>
  );
}

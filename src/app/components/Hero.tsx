import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
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
    <section className="relative bg-gradient-to-br from-primary via-primary to-blue-900 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950 text-white pt-20 pb-24 sm:pb-32 lg:pb-48 overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={content.hero.bgImage}
          alt=""
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary/70 to-blue-900/80 dark:from-blue-950/85 dark:via-blue-900/80 dark:to-blue-950/85"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl mb-6 sm:mb-8 text-white leading-tight"
          >
            {t(content.hero.title)}
            <br />
            <span className="bg-gradient-to-br from-white via-blue-300 to-amber-300 bg-clip-text text-transparent inline-block font-black tracking-tight text-5xl sm:text-7xl md:text-8xl lg:text-9xl">
              {t(content.hero.brandName)}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-2xl md:text-3xl mb-6 text-white/90 max-w-4xl mx-auto"
          >
            {t(content.hero.subtitle)}
          </motion.p>


        </motion.div>
      </div>


    </section>
  );
}

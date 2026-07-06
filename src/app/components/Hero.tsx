import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { getSiteContent } from '../utils/siteContentStorage';
import Typed from 'typed.js';
import CurvedLoop from './CurvedLoop';

export function Hero() {
  const { t } = useLanguage();
  const [content, setContent] = useState(() => getSiteContent());
  const typedRef = useRef(null);

  useEffect(() => {
    const refresh = () => setContent(getSiteContent());
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  useEffect(() => {
    if (!typedRef.current || !content?.hero?.subtitle) return;
    const typed = new Typed(typedRef.current, {
      strings: [content.hero.subtitle.ar, content.hero.subtitle.fr, content.hero.subtitle.en],
      typeSpeed: 60,
      backSpeed: 30,
      backDelay: 2500,
      loop: true,
      showCursor: true,
      cursorChar: '|',
    });
    return () => typed.destroy();
  }, [content]);

  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

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
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl mb-4 text-white leading-tight"
          >
            {t(content.hero.title)}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, type: 'spring', stiffness: 100 }}
            className="max-w-5xl mx-auto -mt-4 sm:-mt-6 lg:-mt-8 mb-12 sm:mb-16"
          >
            <CurvedLoop
              marqueeText={t(content.hero.brandName) + ' ✦ '}
              speed={1.2}
              curveAmount={350}
              interactive={false}
            />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="text-xl sm:text-2xl md:text-3xl text-white/90 max-w-4xl mx-auto min-h-[3rem]"
          >
            <span ref={typedRef} />
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

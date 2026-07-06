import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { getSiteContent } from '../utils/siteContentStorage';
import CurvedLoop from './CurvedLoop';

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <CurvedLoop
              marqueeText={t(content.hero.title) + ' ✦ '}
              speed={1.8}
              curveAmount={150}
              direction="right"
              interactive={false}
              fill="rgba(255,255,255,0.5)"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, type: 'spring', stiffness: 100 }}
            className="max-w-5xl mx-auto -mt-4 sm:-mt-6 lg:-mt-8 mb-10 sm:mb-14"
          >
            <CurvedLoop
              marqueeText={t(content.hero.brandName) + ' ✦ '}
              speed={1.2}
              curveAmount={350}
              direction="right"
              interactive={false}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <CurvedLoop
              marqueeText={t(content.hero.subtitle) + ' ✦ '}
              speed={1.5}
              curveAmount={200}
              direction="right"
              interactive={false}
              fill="rgba(255,255,255,0.6)"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

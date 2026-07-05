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
  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  return (
    <section className="relative bg-gradient-to-br from-primary via-primary to-blue-900 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950 text-white pt-20 pb-48 overflow-hidden">
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
            className="text-6xl md:text-8xl mb-8 text-white leading-tight"
          >
            {t(content.hero.title)}
            <br />
            <motion.span
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(8px)' }}
              animate={reducedMotion ? {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
              } : {
                opacity: 1,
                scale: 1,
                filter: 'blur(0px)',
                rotateX: [0, 15, 0, -15, 0],
                rotateY: [0, -20, 0, 20, 0],
                z: [0, 50, 0, -50, 0],
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={reducedMotion ? {
                opacity: { delay: 0.3, duration: 0.8 },
                scale: { delay: 0.3, duration: 0.8, type: 'spring', stiffness: 100 },
                filter: { delay: 0.3, duration: 0.8 },
              } : {
                opacity: { delay: 0.3, duration: 0.8 },
                scale: { delay: 0.3, duration: 0.8, type: 'spring', stiffness: 100 },
                filter: { delay: 0.3, duration: 0.8 },
                rotateX: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                rotateY: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                z: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
              }}
              className="bg-gradient-to-br from-white via-blue-300 to-amber-300 bg-clip-text text-transparent inline-block font-black tracking-tight text-8xl md:text-9xl"
              style={{
                backgroundSize: '200% 200%',
                transformStyle: 'preserve-3d',
                perspective: '800px',
                textShadow: `
                  0 1px 0 rgba(147,197,253,0.5),
                  0 2px 0 rgba(147,197,253,0.45),
                  0 3px 0 rgba(96,165,250,0.4),
                  0 4px 0 rgba(96,165,250,0.35),
                  0 5px 0 rgba(59,130,246,0.3),
                  0 6px 0 rgba(59,130,246,0.25),
                  0 8px 10px rgba(0,0,0,0.15),
                  0 12px 20px rgba(59,130,246,0.2),
                  0 20px 40px rgba(245,158,11,0.1)
                `,
              }}
            >
              {t(content.hero.brandName)}
            </motion.span>
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

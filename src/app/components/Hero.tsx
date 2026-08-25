import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { ArrowRight, Phone } from 'lucide-react';
import { getSiteContent } from '../utils/siteContentStorage';
import { getSiteSettings } from '../utils/siteSettingsStorage';

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
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={content.hero.bgImage}
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 w-full">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-block bg-white/10 backdrop-blur-sm text-white/90 text-sm font-semibold px-4 py-2 rounded-full border border-white/20 mb-6"
            >
              {t({ ar: 'خدمات مكتبية وإعلام آلي', fr: 'Services informatiques et bureautiques', en: 'IT & Office Services' })}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6 text-white leading-tight font-black"
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
              className="text-lg md:text-xl mb-10 text-white/80 max-w-xl leading-relaxed"
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
                className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-95 text-base"
              >
                {t({ ar: 'اكتشف خدماتنا', fr: 'Découvrir nos services', en: 'Discover our services' })}
                <ArrowRight className="w-5 h-5" />
              </a>
              <a
                href="#products"
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-all text-base"
              >
                {t({ ar: 'تصفح المنتجات', fr: 'Voir nos produits', en: 'View our products' })}
              </a>
              <a
                href={`tel:${settings.contact.phone}`}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 text-base"
              >
                <Phone className="w-5 h-5" />
                {t({ ar: 'اتصل بنا', fr: 'Appelez-nous', en: 'Call us' })}
              </a>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

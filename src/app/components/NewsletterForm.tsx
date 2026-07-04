import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { subscribe } from '../utils/newsletterStorage';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function NewsletterForm() {
  const { t, language } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t({ ar: 'الرجاء إدخال بريد إلكتروني صحيح', fr: 'Veuillez entrer un email valide', en: 'Please enter a valid email' }));
      return;
    }
    setLoading(true);
    try {
      subscribe(email);
      toast.success(t({ ar: 'تم الاشتراك في النشرة البريدية بنجاح!', fr: 'Inscription à la newsletter réussie!', en: 'Subscribed to newsletter successfully!' }));
      setEmail('');
    } catch {
      toast.error(t({ ar: 'حدث خطأ، حاول مرة أخرى', fr: 'Une erreur est survenue, réessayez', en: 'An error occurred, please try again' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      className="py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-950 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
          <div className="relative px-8 py-14 sm:px-16 sm:py-20">
            <div className="max-w-2xl mx-auto text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm mb-6">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                {t({ ar: 'اشترك في نشرتنا البريدية', fr: 'Abonnez-vous à notre newsletter', en: 'Subscribe to our Newsletter' })}
              </h2>
              <p className="text-blue-100/80 text-lg mb-8 max-w-lg mx-auto">
                {t({
                  ar: 'احصل على أحدث العروض والخدمات مباشرة إلى بريدك الإلكتروني',
                  fr: 'Recevez les dernières offres et services directement dans votre boîte mail',
                  en: 'Get the latest offers and services delivered straight to your inbox'
                })}
              </p>
              <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 max-w-md mx-auto ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
                <div className="relative flex-1">
                  <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 ${language === 'ar' ? 'right-4' : 'left-4'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t({ ar: 'بريدك الإلكتروني', fr: 'Votre adresse email', en: 'Your email address' })}
                    className={`w-full rounded-xl border-0 bg-white/15 backdrop-blur-sm text-white placeholder-blue-200/60 px-12 py-4 text-base outline-none transition focus:bg-white/25 focus:ring-2 focus:ring-white/30`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-white text-blue-700 px-8 py-4 font-bold text-base shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {t({ ar: 'اشتراك', fr: 'S\'abonner', en: 'Subscribe' })}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { subscribe } from '../utils/newsletterStorage';
import { toast } from 'sonner';

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
      toast.success(t({ ar: 'تم الاشتراك بنجاح!', fr: 'Inscription réussie!', en: 'Subscribed successfully!' }));
      setEmail('');
    } catch {
      toast.error(t({ ar: 'حدث خطأ، حاول مرة أخرى', fr: 'Une erreur est survenue', en: 'An error occurred' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-900 dark:from-blue-900 dark:via-blue-800 dark:to-indigo-950 shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
          <div className="relative px-6 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-sm mb-6 mx-auto">
                <Mail className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center mb-3 leading-tight">
                {t({ ar: 'اشترك في نشرتنا البريدية', fr: 'Abonnez-vous à notre newsletter', en: 'Subscribe to our Newsletter' })}
              </h2>
              <p className="text-blue-100/80 text-base sm:text-lg text-center mb-8 leading-relaxed max-w-lg mx-auto">
                {t({
                  ar: 'احصل على أحدث العروض والخدمات مباشرة إلى بريدك الإلكتروني',
                  fr: 'Recevez les dernières offres et services directement dans votre boîte mail',
                  en: 'Get the latest offers and services delivered straight to your inbox'
                })}
              </p>
              <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md mx-auto ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
                <div className="relative flex-1 w-full">
                  <Mail className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 ${language === 'ar' ? 'right-4' : 'left-4'}`} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t({ ar: 'بريدك الإلكتروني', fr: 'Votre adresse email', en: 'Your email address' })}
                    className="w-full rounded-xl border-0 bg-white/15 backdrop-blur-sm text-white placeholder-blue-200/60 px-12 py-4 text-base outline-none transition focus:bg-white/25 focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto rounded-xl bg-white text-blue-700 px-8 py-4 font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                  {t({ ar: 'اشتراك', fr: "S'abonner", en: 'Subscribe' })}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

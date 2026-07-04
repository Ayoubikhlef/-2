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
      toast.success(t({ ar: 'تم الاشتراك في النشرة البريدية بنجاح!', fr: 'Inscription à la newsletter réussie!', en: 'Subscribed to newsletter successfully!' }));
      setEmail('');
    } catch {
      toast.error(t({ ar: 'حدث خطأ، حاول مرة أخرى', fr: 'Une erreur est survenue, réessayez', en: 'An error occurred, please try again' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">
            {t({ ar: 'اشترك في نشرتنا البريدية', fr: 'Abonnez-vous', en: 'Subscribe' })}
          </h3>
          <p className="text-white/60 text-xs">
            {t({
              ar: 'أحدث العروض والخدمات لبريدك',
              fr: 'Offres et services dans votre boîte mail',
              en: 'Offers & services to your inbox'
            })}
          </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className={`flex flex-row gap-2 w-full ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
        <div className="relative flex-1 min-w-0">
          <Mail className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 ${language === 'ar' ? 'right-3' : 'left-3'}`} />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t({ ar: 'بريدك الإلكتروني', fr: 'Votre email', en: 'Your email' })}
            className="w-full rounded-lg border-0 bg-white/15 backdrop-blur-sm text-white placeholder-blue-200/60 pl-10 pr-3 py-3 text-sm outline-none transition focus:bg-white/25 focus:ring-2 focus:ring-white/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white text-blue-700 px-5 py-3 font-bold text-sm shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {t({ ar: 'اشتراك', fr: 'Abonner', en: 'Subscribe' })}
        </button>
      </form>
    </div>
  );
}

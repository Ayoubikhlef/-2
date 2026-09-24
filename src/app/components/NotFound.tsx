import { Home } from 'lucide-react';

function getLang(): 'ar' | 'fr' | 'en' {
  if (typeof window === 'undefined') return 'ar';
  const saved = window.localStorage.getItem('language');
  if (saved === 'ar' || saved === 'fr' || saved === 'en') return saved;
  return 'ar';
}

export function NotFound() {
  const lang = getLang();
  const t = (ar: string, fr: string, en: string) => (lang === 'ar' ? ar : lang === 'fr' ? fr : en);
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background p-8"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="text-center max-w-md">
        <div className="text-9xl font-black text-primary/20 mb-4 select-none">404</div>
        <h1 className="text-3xl font-bold mb-3">
          {t('الصفحة غير موجودة', 'Page introuvable', 'Page Not Found')}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t(
            'عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.',
            'Désolé, la page que vous recherchez est introuvable ou a été déplacée.',
            'Sorry, the page you are looking for does not exist or has been moved.'
          )}
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
        >
          <Home className="w-5 h-5" />
          {t('العودة للرئيسية', "Retour à l'accueil", 'Back to Home')}
        </a>
      </div>
    </div>
  );
}

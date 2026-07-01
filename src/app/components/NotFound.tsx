import { useLanguage } from '../contexts/LanguageContext';
import { Home } from 'lucide-react';

export function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="text-center max-w-md">
        <div className="text-9xl font-black text-primary/20 mb-4 select-none">404</div>
        <h1 className="text-3xl font-bold mb-3">{t({ ar: 'الصفحة غير موجودة', fr: 'Page introuvable', en: 'Page Not Found' })}</h1>
        <p className="text-muted-foreground mb-8">
          {t({ ar: 'عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.', fr: 'Désolé, la page que vous recherchez est introuvable ou a été déplacée.', en: 'Sorry, the page you are looking for does not exist or has been moved.' })}
        </p>
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-all"
        >
          <Home className="w-5 h-5" />
          {t({ ar: 'العودة للرئيسية', fr: 'Retour à l\'accueil', en: 'Back to Home' })}
        </a>
      </div>
    </div>
  );
}

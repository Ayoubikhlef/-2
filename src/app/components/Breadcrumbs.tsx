import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { language } = useLanguage();
  const isRtl = language === 'ar';

  return (
    <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
      <ol className={`flex items-center gap-1.5 text-sm text-muted-foreground ${isRtl ? 'flex-row-reverse' : ''}`}>
        <li>
          <a href="/" className="hover:text-primary transition-colors" aria-label="Home">
            <Home className="w-4 h-4" />
          </a>
        </li>
        {items.map((crumb, i) => (
          <li key={i} className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
            {crumb.href ? (
              <a href={crumb.href} className="hover:text-primary transition-colors">
                {crumb.label}
              </a>
            ) : (
              <span className="text-foreground font-medium">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

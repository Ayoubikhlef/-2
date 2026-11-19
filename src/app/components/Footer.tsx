import { useState, useEffect } from 'react';
import { Phone, MapPin, Mail, Facebook } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteContent } from '../utils/siteContentStorage';
import { getSiteSettings } from '../utils/siteSettingsStorage';
import { brand } from '../config/brand';
import { VisitorCounter } from './VisitorCounter';

export function Footer() {
  const { t, language } = useLanguage();
  const [content, setContent] = useState(() => getSiteContent());
  const [settings, setSettings] = useState(() => getSiteSettings());

  useEffect(() => {
    const refresh = () => { setContent(getSiteContent()); setSettings(getSiteSettings()); };
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  const { contact, settings: s } = settings;
  const pathname = typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') : '';
  const onHomePage = pathname === '' || pathname === '/index.html';
  const pageHref = (href: string) => (!onHomePage && href.startsWith('#') ? `/${href}` : href);

  return (
    <footer className="bg-card border-t border-border text-card-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img src={brand.logo} alt={brand.name} className="h-14 w-auto mb-4" width="56" height="56" />
            <p className="text-foreground text-sm font-extrabold mb-1">{brand.name}</p>
            <p className="text-muted-foreground text-sm leading-relaxed mb-2">
              {t(content.footer.description)}
            </p>
            <p className="text-muted-foreground/80 text-xs leading-relaxed mb-4">
              {language === 'ar'
                ? 'AOS Tech Store (أوس تك / أوس تيك) — الاسم القانوني: أيوب أوفيس سيرفيسز'
                : 'AOS Tech Store (AOS Tech / AOS Store) — Ayoub Office Services'}
            </p>
            <div className="flex items-center gap-3">
              <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-primary transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href={`tel:${contact.phone}`} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-green-600 transition-colors" aria-label="Phone">
                <Phone className="w-4 h-4" />
              </a>
              <a href={`mailto:${contact.email}`} className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-orange-500 transition-colors" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h2 className="text-foreground font-bold mb-4 text-sm uppercase tracking-wider">
              {t(s.footerQuickLinksTitle)}
            </h2>
            <ul className="space-y-2.5">
              {s.footerQuickLinks.map((link, idx) => (
                <li key={idx}>
                  <a href={pageHref(link.href)} className="text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                    {t(link.label)}
                  </a>
                </li>
              ))}
              <li>
                <a href={pageHref('#digital-services')} className="text-violet-600 dark:text-violet-300 font-semibold hover:text-violet-500 text-sm transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-violet-500 shrink-0" />
                  {t({ ar: 'الخدمات الرقمية وAI', fr: 'Services digitaux & IA', en: 'Digital & AI services' })}
                </a>
              </li>
              <li>
                <a href="/create-website" className="text-primary font-semibold hover:text-primary/80 text-sm transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                  {t({ ar: 'إنشاء المواقع', fr: 'Création de sites', en: 'Web design' })}
                </a>
              </li>
              <li>
                <a href="/premium-services" className="text-primary font-semibold hover:text-primary/80 text-sm transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                  {t({ ar: 'الخدمات المميزة', fr: 'Services premium', en: 'Premium services' })}
                </a>
              </li>
              <li>
                <a href="/ai-tools" className="text-sky-600 dark:text-sky-300 font-semibold hover:text-sky-500 text-sm transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-sky-500 shrink-0" />
                  {t({ ar: '13 أداة ذكاء اصطناعي', fr: '13 outils IA', en: '13 AI tools' })}
                </a>
              </li>
              <li>
                <a href="/ai-tools/calculator" className="text-emerald-600 dark:text-emerald-300 font-semibold hover:text-emerald-500 text-sm transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                  {t({ ar: 'حاسبة أرباح المتجر', fr: 'Calculateur de bénéfices', en: 'Store profit calculator' })}
                </a>
              </li>
              <li>
                <a href="/subscription" className="text-indigo-600 dark:text-indigo-300 font-semibold hover:text-indigo-500 text-sm transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-indigo-500 shrink-0" />
                  {t({ ar: 'اشتراك أدوات الذكاء الاصطناعي', fr: 'Abonnement outils IA', en: 'AI tools subscription' })}
                </a>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h2 className="text-foreground font-bold mb-4 text-sm uppercase tracking-wider">
              {t({ ar: 'خدماتنا', fr: 'Services', en: 'Services' })}
            </h2>
            <ul className="space-y-2.5">
              {[
                { href: '#services', label: { ar: 'طباعة ونسخ', fr: 'Impression', en: 'Printing' } },
                { href: '#services', label: { ar: 'خدمات معلوميات', fr: 'Services informatiques', en: 'IT Services' } },
                { href: '#services', label: { ar: 'صيانة', fr: 'Maintenance', en: 'Maintenance' } },
                { href: '#services', label: { ar: 'مستلزمات مكتبية', fr: 'Fournitures', en: 'Supplies' } },
                { href: '#digital-services', label: { ar: 'خدمات الذكاء الاصطناعي', fr: 'Services IA', en: 'AI services' } },
              ].map((item, idx) => (
                <li key={idx}>
                  <a href={pageHref(item.href)} className="text-muted-foreground hover:text-foreground text-sm transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                    {t(item.label)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="text-foreground font-bold mb-4 text-sm uppercase tracking-wider">
              {t(s.footerContactTitle)}
            </h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-muted-foreground">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{t(contact.address)}</span>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Phone className="w-4 h-4 shrink-0" />
                <a href={`tel:${contact.phone}`} dir="ltr" className="hover:text-foreground transition-colors">
                  {contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Mail className="w-4 h-4 shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-foreground transition-colors break-all">
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <p>© {s.copyrightYear} {s.copyrightName}. {t({ ar: 'جميع الحقوق محفوظة', fr: 'Tous droits réservés', en: 'All rights reserved' })}.</p>
              <VisitorCounter />
            </div>
            <p>
              {t(s.developerPrefix)} <a href={s.developerUrl} target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-primary/60 underline-offset-2 hover:text-primary transition-colors">{t(s.developerName)}</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

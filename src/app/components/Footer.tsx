import { useState, useEffect } from 'react';
import { Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteContent } from '../utils/siteContentStorage';
import { getSiteSettings } from '../utils/siteSettingsStorage';

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

  return (
    <footer className="bg-gradient-to-br from-primary via-primary to-blue-900 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className={`flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''} mb-4`}>
              <img src={s.logoUrl} alt="AOS" className="h-36 w-auto rounded-lg" />
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              {t(content.footer.description)}
            </p>
          </div>

          <div>
            <h4 className="text-white mb-4">
              {t(s.footerQuickLinksTitle)}
            </h4>
            <ul className={`space-y-2 text-sm text-white/80`}>
              {s.footerQuickLinks.map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className={`hover:text-white transition-colors flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                    <span>•</span>
                    <span>{t(link.label)}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white mb-4">
              {t(s.footerContactTitle)}
            </h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li className={`flex items-start space-x-3 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{t(contact.address)}</span>
              </li>
              <li className={`flex items-center space-x-3 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href={`tel:${contact.phone}`} className="hover:text-white transition-colors">
                  {contact.phoneDisplay}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-white/70 gap-2">
            <p>© {s.copyrightYear} {s.copyrightName}. {t({ ar: 'جميع الحقوق محفوظة', fr: 'Tous droits réservés', en: 'All rights reserved' })}.</p>
            <p className="text-[#bdbdbd] text-[13px]">
              {t(s.developerPrefix)} <a href={s.developerUrl} target="_blank" rel="noopener noreferrer" aria-label="Developer Facebook Profile" className="text-[#ff8c00] hover:brightness-125 underline-offset-2 hover:underline transition-all duration-300 cursor-pointer">{t(s.developerName)}</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

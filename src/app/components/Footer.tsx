import { useState, useEffect } from 'react';
import { Phone, MapPin, Mail, Facebook } from 'lucide-react';
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
    <footer className="bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <img src="/logo.png" alt="AYOUB OFFICE SERVICES" className="h-14 w-auto mb-4" width="56" height="56" />
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              {t(content.footer.description)}
            </p>
            <div className="flex items-center gap-3">
              <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors" aria-label="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href={`tel:${contact.phone}`} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-green-600 transition-colors" aria-label="Phone">
                <Phone className="w-4 h-4" />
              </a>
              <a href={`mailto:${contact.email}`} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-orange-500 transition-colors" aria-label="Email">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              {t(s.footerQuickLinksTitle)}
            </h4>
            <ul className="space-y-2.5">
              {s.footerQuickLinks.map((link, idx) => (
                <li key={idx}>
                  <a href={link.href} className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                    {t(link.label)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              {t({ ar: 'خدماتنا', fr: 'Services', en: 'Services' })}
            </h4>
            <ul className="space-y-2.5">
              {[
                { ar: 'طباعة ونسخ', fr: 'Impression', en: 'Printing' },
                { ar: 'خدمات معلوميات', fr: 'Services informatiques', en: 'IT Services' },
                { ar: 'صيانة', fr: 'Maintenance', en: 'Maintenance' },
                { ar: 'مستلزمات مكتبية', fr: 'Fournitures', en: 'Supplies' },
              ].map((item, idx) => (
                <li key={idx}>
                  <a href="#services" className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                    {t(item)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">
              {t(s.footerContactTitle)}
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3 text-white/60">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{t(contact.address)}</span>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <Phone className="w-4 h-4 shrink-0" />
                <a href={`tel:${contact.phone}`} className="hover:text-white transition-colors">
                  {contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3 text-white/60">
                <Mail className="w-4 h-4 shrink-0" />
                <a href={`mailto:${contact.email}`} className="hover:text-white transition-colors break-all">
                  {contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/50">
            <p>© {s.copyrightYear} {s.copyrightName}. {t({ ar: 'جميع الحقوق محفوظة', fr: 'Tous droits réservés', en: 'All rights reserved' })}.</p>
            <p>
              {t(s.developerPrefix)} <a href={s.developerUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors">{t(s.developerName)}</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

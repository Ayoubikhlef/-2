import { Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteContent } from '../utils/siteContentStorage';
import { getSiteSettings } from '../utils/siteSettingsStorage';

export function Footer() {
  const { t, language } = useLanguage();
  const content = getSiteContent();
  const settings = getSiteSettings();

  return (
    <footer className="bg-gradient-to-br from-primary via-primary to-blue-900 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <div className={`flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''} mb-4`}>
              <img src="/aos-logo3.png" alt="AOS" className="h-36 w-auto rounded-lg" />
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              {t(content.footer.description)}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white mb-4">
              {t({ ar: 'روابط سريعة', fr: 'Liens rapides', en: 'Quick Links' })}
            </h4>
            <ul className={`space-y-2 text-sm text-white/80`}>
              <li>
                <a href="#services" className={`hover:text-white transition-colors flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                  <span>•</span>
                  <span>{t({ ar: 'خدماتنا', fr: 'Nos services', en: 'Our services' })}</span>
                </a>
              </li>
              <li>
                <a href="#contact" className={`hover:text-white transition-colors flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                  <span>•</span>
                  <span>{t({ ar: 'اتصل بنا', fr: 'Contactez-nous', en: 'Contact us' })}</span>
                </a>
              </li>
              <li>
                <a href="#about" className={`hover:text-white transition-colors flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                  <span>•</span>
                  <span>{t({ ar: 'عن المتجر', fr: 'À propos', en: 'About Us' })}</span>
                </a>
              </li>
              <li>
                <a href="#terms" className={`hover:text-white transition-colors flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                  <span>•</span>
                  <span>{t({ ar: 'الشروط والأحكام', fr: 'Conditions', en: 'Terms' })}</span>
                </a>
              </li>
              <li>
                <a href="#privacy" className={`hover:text-white transition-colors flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                  <span>•</span>
                  <span>{t({ ar: 'سياسة الخصوصية', fr: 'Confidentialité', en: 'Privacy' })}</span>
                </a>
              </li>
              <li className={`flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                <span>•</span>
                <span>{t({ ar: 'طباعة ونسخ', fr: 'Impression et copie', en: 'Printing and copying' })}</span>
              </li>
              <li className={`flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                <span>•</span>
                <span>{t({ ar: 'خدمات الرقمنة', fr: 'Services de numérisation', en: 'Digitization services' })}</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-white mb-4">
              {t({ ar: 'معلومات الاتصال', fr: 'Coordonnées', en: 'Contact Info' })}
            </h4>
            <ul className="space-y-3 text-sm text-white/80">
              <li className={`flex items-start space-x-3 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>
                  {t(settings.contact.address)}
                </span>
              </li>
              <li className={`flex items-center space-x-3 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href={`tel:${settings.contact.phone}`} className="hover:text-white transition-colors">
                  {settings.contact.phoneDisplay}
                </a>
              </li>

            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-white/70 gap-2">
            <p>
              © 2026 Ayoub Office Services. {t({ ar: 'جميع الحقوق محفوظة', fr: 'Tous droits réservés', en: 'All rights reserved' })}.
            </p>
            <p className="text-[#bdbdbd] text-[13px]">
              {language === 'ar' ? (
                <>تم التطوير بواسطة <a href="https://www.facebook.com/share/1BTrNWjYPx/" target="_blank" rel="noopener noreferrer" aria-label="Developer Facebook Profile" className="text-[#ff8c00] hover:brightness-125 underline-offset-2 hover:underline transition-all duration-300 cursor-pointer">أيوب يخلف</a></>
              ) : language === 'fr' ? (
                <>Développé par <a href="https://www.facebook.com/share/1BTrNWjYPx/" target="_blank" rel="noopener noreferrer" aria-label="Developer Facebook Profile" className="text-[#ff8c00] hover:brightness-125 underline-offset-2 hover:underline transition-all duration-300 cursor-pointer">Ayoub Ikhlef</a></>
              ) : (
                <>Developed by <a href="https://www.facebook.com/share/1BTrNWjYPx/" target="_blank" rel="noopener noreferrer" aria-label="Developer Facebook Profile" className="text-[#ff8c00] hover:brightness-125 underline-offset-2 hover:underline transition-all duration-300 cursor-pointer">Ayoub Ikhlef</a></>
              )}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

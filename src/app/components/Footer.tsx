import { Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { NewsletterForm } from './NewsletterForm';

export function Footer() {
  const { t, language } = useLanguage();

  return (
    <footer className="bg-gradient-to-br from-primary via-primary to-blue-900 dark:from-blue-950 dark:via-blue-900 dark:to-blue-950 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <div className={`flex items-center space-x-2 ${language === 'ar' ? 'space-x-reverse' : ''} mb-4`}>
              <img src="/aos-logo3.png" alt="AOS" className="h-36 w-auto rounded-lg" />
            </div>
            <p className="text-white/80 text-sm leading-relaxed">
              {t({
                ar: 'نبسّط حياتك المهنية بخدمات مكتبية احترافية',
                fr: 'Simplifions votre vie professionnelle avec des services de bureau professionnels à El Milia',
                en: 'Simplifying your professional life with professional office services in El Milia'
              })}
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
                  {t({
                    ar: 'الشارع الكبير، الميلية، جيجل',
                    fr: 'Grand Boulevard, El Milia, Jijel',
                    en: 'Grand Boulevard, El Milia, Jijel'
                  })}
                </span>
              </li>
              <li className={`flex items-center space-x-3 ${language === 'ar' ? 'space-x-reverse' : ''}`}>
                <Phone className="w-5 h-5 flex-shrink-0" />
                <a href="tel:0674113290" className="hover:text-white transition-colors">
                  0674 11 32 90
                </a>
              </li>

            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6">
          <div className={`flex flex-col md:flex-row justify-between items-center text-sm text-white/70`}>
            <p>
              © 2026 Ayoub Office Services. {t({ ar: 'جميع الحقوق محفوظة', fr: 'Tous droits réservés', en: 'All rights reserved' })}.
            </p>

          </div>
        </div>
      </div>
    </footer>
  );
}

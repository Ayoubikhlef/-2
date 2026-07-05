import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Facebook } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';
import { getSiteSettings } from '../utils/siteSettingsStorage';

export function Contact() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState(() => getSiteSettings());

  useEffect(() => {
    const refresh = () => setSettings(getSiteSettings());
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      id="contact" className="py-20 bg-gradient-to-br from-slate-50/70 to-blue-50/70 dark:from-slate-900/50 dark:to-blue-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="mb-4">
            {t({ ar: 'أين تجدنا', fr: 'Où nous trouver', en: 'Find Us' })}
          </h2>
          <p className="text-muted-foreground text-lg">
            {t({
              ar: 'قم بزيارتنا أو اتصل بنا لجميع احتياجاتك المكتبية والتقنية في الجزائر',
              fr: 'Visitez-nous ou contactez-nous pour tous vos besoins bureautiques et informatiques en Algérie',
              en: 'Visit us or contact us for all your office and IT needs across Algeria'
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-border group">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-2">
              {t({ ar: 'العنوان', fr: 'Adresse', en: 'Address' })}
            </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t(settings.contact.address)}
            </p>
          </div>

          <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-border group">
            <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-2">
              {t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}
            </h3>
            <p className="text-muted-foreground">
              <a href={`tel:${settings.contact.phone}`} className="text-xl font-semibold hover:text-primary transition-colors block">
                {settings.contact.phoneDisplay}
              </a>
            </p>
          </div>

          <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-border group">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Facebook className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-2">
              {t({ ar: 'فيسبوك', fr: 'Facebook', en: 'Facebook' })}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              {t({
                ar: 'تابعنا على فيسبوك',
                fr: 'Suivez-nous sur Facebook',
                en: 'Follow us on Facebook'
              })}
            </p>
            <a href={settings.contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline break-all">
              {settings.contact.facebookName}
            </a>
          </div>

          <div className="bg-card p-4 sm:p-6 lg:p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-border group">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-2">
              {t({ ar: 'تواصل معنا', fr: 'Contact', en: 'Contact' })}
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-2">
              {t({
                ar: 'نحن هنا لخدمتك',
                fr: 'À votre service',
                en: 'At your service'
              })}
            </p>
            <a href={`mailto:${settings.contact.email}`} className="text-sm font-medium text-primary hover:underline break-all">
              {settings.contact.email}
            </a>
          </div>
        </div>

        {/* Google Maps */}
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-lg border border-border">
          <iframe
            src={settings.contact.mapsEmbedUrl}
            width="100%"
            className="h-[250px] md:h-[380px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={t({ ar: 'موقع المتجر على خرائط جوجل', fr: 'Emplacement du magasin sur Google Maps', en: 'Store location on Google Maps' })}
          />
        </div>
      </div>
    </motion.section>
  );
}

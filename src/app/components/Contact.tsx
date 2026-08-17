import { useState, useEffect } from 'react';
import { MapPin, Phone, Mail, Facebook, Navigation } from 'lucide-react';
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
      id="contact" className="py-20 bg-gradient-to-br from-slate-50/70 to-blue-50/70 dark:from-transparent dark:to-transparent">
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
            src={settings.contact.mapsEmbedUrl || 'https://www.google.com/maps?q=Ayoub+Office+Services,+Grand+Boulevard,+El+Milia,+Jijel+18300&hl=ar&z=15&output=embed'}
            width="100%"
            className="h-[250px] md:h-[380px]"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={t({ ar: 'موقع المتجر على خرائط جوجل', fr: 'Emplacement du magasin sur Google Maps', en: 'Store location on Google Maps' })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-card/80 backdrop-blur-md p-4 border-t border-border">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(t(settings.contact.address) + ', El Milia, Jijel')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-blue-700 text-primary-foreground px-5 py-3.5 font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <Navigation className="w-4 h-4" />
              {t({ ar: 'احصل على الاتجاهات', fr: 'Itinéraire', en: 'Get Directions' })}
            </a>
            <a
              href={`https://wa.me/${settings.contact.phoneInternational}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white px-5 py-3.5 font-bold text-sm shadow-lg shadow-green-500/20 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              {t({ ar: 'تواصل عبر واتساب', fr: 'WhatsApp', en: 'WhatsApp Us' })}
            </a>
          </div>
        </div>
      </div>
    </motion.section>
  );
}

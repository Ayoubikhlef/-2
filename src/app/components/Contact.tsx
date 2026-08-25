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
      id="contact" className="py-16 md:py-20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 md:mb-14">
          <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-4">
            {t({ ar: 'تواصل معنا', fr: 'Contactez-nous', en: 'Contact Us' })}
          </span>
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            {t({ ar: 'أين تجدنا', fr: 'Où nous trouver', en: 'Find Us' })}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            {t({
              ar: 'قم بزيارتنا أو اتصل بنا لجميع احتياجاتك المكتبية والتقنية',
              fr: 'Visitez-nous ou contactez-nous pour tous vos besoins bureautiques et informatiques',
              en: 'Visit us or contact us for all your office and IT needs'
            })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 max-w-6xl mx-auto mb-12">
          <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-center border border-border group">
            <div className="bg-primary/10 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
              <MapPin className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {t({ ar: 'العنوان', fr: 'Adresse', en: 'Address' })}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t(settings.contact.address)}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-center border border-border group">
            <div className="bg-green-500/10 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-green-500/20 transition-colors">
              <Phone className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}
            </h3>
            <a href={`tel:${settings.contact.phone}`} className="text-lg font-bold hover:text-primary transition-colors block">
              {settings.contact.phoneDisplay}
            </a>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-center border border-border group">
            <div className="bg-blue-500/10 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500/20 transition-colors">
              <Facebook className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {t({ ar: 'فيسبوك', fr: 'Facebook', en: 'Facebook' })}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              {t({
                ar: 'تابعنا على فيسبوك',
                fr: 'Suivez-nous sur Facebook',
                en: 'Follow us on Facebook'
              })}
            </p>
            <a href={settings.contact.facebookUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary hover:underline break-all">
              {settings.contact.facebookName}
            </a>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 md:p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 text-center border border-border group">
            <div className="bg-orange-500/10 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-500/20 transition-colors">
              <Mail className="w-7 h-7 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold mb-2">
              {t({ ar: 'البريد الإلكتروني', fr: 'Email', en: 'Email' })}
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              {t({
                ar: 'نحن هنا لخدمتك',
                fr: 'À votre service',
                en: 'At your service'
              })}
            </p>
            <a href={`mailto:${settings.contact.email}`} className="text-sm font-semibold text-primary hover:underline break-all">
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
            title={t({ ar: 'موقع المتجر على خرائط جوجل', fr: 'Emplacement sur Google Maps', en: 'Store location on Google Maps' })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-slate-800 p-4 border-t border-border">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(t(settings.contact.address) + ', El Milia, Jijel')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-5 py-3.5 font-bold text-sm shadow-sm hover:shadow-md transition-all"
            >
              <Navigation className="w-4 h-4" />
              {t({ ar: 'احصل على الاتجاهات', fr: 'Itinéraire', en: 'Get Directions' })}
            </a>
            <a
              href={`https://wa.me/${settings.contact.phoneInternational}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-green-600 text-white px-5 py-3.5 font-bold text-sm shadow-sm hover:shadow-md transition-all"
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

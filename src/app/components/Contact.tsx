import { MapPin, Phone, Mail, Facebook } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'motion/react';

export function Contact() {
  const { t } = useLanguage();

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
          <div className="bg-card p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-border group">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-2">
              {t({ ar: 'العنوان', fr: 'Adresse', en: 'Address' })}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {t({
                ar: 'الشارع الكبير، الميلية، جيجل',
                fr: 'Grand Boulevard, El Milia, Jijel',
                en: 'Grand Boulevard, El Milia, Jijel'
              })}
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-border group">
            <div className="bg-gradient-to-br from-green-500 to-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">
              <Phone className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-2">
              {t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}
            </h3>
            <p className="text-muted-foreground">
              <a href="tel:0674113290" className="text-xl font-semibold hover:text-primary transition-colors block">
                0674 11 32 90
              </a>
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-border group">
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
            <a href="https://www.facebook.com/share/1BTrNWjYPx/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline break-all">
              Ayoub Office Services
            </a>
          </div>

          <div className="bg-card p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-center border border-border group">
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
            <a href="mailto:ayoub.office.services@gmail.com" className="text-sm font-medium text-primary hover:underline break-all">
              ayoub.office.services@gmail.com
            </a>
          </div>
        </div>

        {/* Google Maps */}
        <div className="max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-lg border border-border">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3194.56!2d6.2718334!3d36.7477532!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12f22300057e0d4b%3A0xb89044f1e5f9512e!2sAyoub+Office+Services!5e0!3m2!1sar!2sdz"
            width="100%"
            height="380"
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

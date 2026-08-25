import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Phone, Mail, Clock, CheckCircle } from 'lucide-react';
import { getSiteContent } from '../utils/siteContentStorage';
import { getSiteSettings } from '../utils/siteSettingsStorage';

export function AboutPage() {
  const { t, language } = useLanguage();
  const [content, setContent] = useState(() => getSiteContent());
  const [settings, setSettings] = useState(() => getSiteSettings());

  useEffect(() => {
    const refresh = () => { setContent(getSiteContent()); setSettings(getSiteSettings()); };
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  const values = [
    { ar: 'الجودة', fr: 'Qualité', en: 'Quality' },
    { ar: 'السرعة', fr: 'Rapidité', en: 'Speed' },
    { ar: 'أسعار تنافسية', fr: 'Prix compétitifs', en: 'Competitive prices' },
    { ar: 'خدمة احترافية', fr: 'Service professionnel', en: 'Professional service' },
  ];

  return (
    <section className="py-16 md:py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-4">
            {t({ ar: 'من نحن', fr: 'À propos', en: 'About Us' })}
          </span>
          <h1 className="text-3xl md:text-4xl font-black mb-4">
            {t(content.about.title)}
          </h1>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-border p-6 md:p-8 space-y-6 shadow-sm">
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t(content.about.content)}
          </p>

          {/* Values */}
          <div className="grid grid-cols-2 gap-3">
            {values.map((value, idx) => (
              <div key={idx} className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-semibold">{t(value)}</span>
              </div>
            ))}
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">{t({ ar: 'العنوان', fr: 'Adresse', en: 'Address' })}</p>
                <p className="text-sm text-muted-foreground">{t(settings.contact.address)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <Phone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">{t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}</p>
                <p className="text-sm text-muted-foreground">{settings.contact.phoneDisplay}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">{t({ ar: 'البريد الإلكتروني', fr: 'Email', en: 'Email' })}</p>
                <p className="text-sm text-muted-foreground">{settings.contact.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/50">
              <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm">{t({ ar: 'ساعات العمل', fr: 'Horaires', en: 'Working Hours' })}</p>
                <p className="text-sm text-muted-foreground">
                  {t(settings.contact.workingHours)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

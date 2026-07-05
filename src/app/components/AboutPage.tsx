import { useLanguage } from '../contexts/LanguageContext';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { getSiteContent } from '../utils/siteContentStorage';
import { getSiteSettings } from '../utils/siteSettingsStorage';

export function AboutPage() {
  const { t, language } = useLanguage();
  const content = getSiteContent();
  const settings = getSiteSettings();

  return (
    <section className="py-20 bg-gradient-to-b from-white/80 to-slate-50/70 dark:from-slate-950/80 dark:to-slate-900/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold mb-8 text-center">
          {t({ ar: 'عن المتجر', fr: 'À propos', en: 'About Us' })}
        </h1>
        <div className="bg-card rounded-3xl border border-border p-8 space-y-6">
          <p className="text-lg leading-relaxed text-muted-foreground">
            {t(content.about.content)}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50">
              <MapPin className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-bold">{t({ ar: 'العنوان', fr: 'Adresse', en: 'Address' })}</p>
                <p className="text-sm text-muted-foreground">{t(settings.contact.address)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50">
              <Phone className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-bold">{t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}</p>
                <p className="text-sm text-muted-foreground">{settings.contact.phoneDisplay}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50">
              <Mail className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-bold">{t({ ar: 'البريد الإلكتروني', fr: 'Email', en: 'Email' })}</p>
                <p className="text-sm text-muted-foreground">{settings.contact.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50">
              <Clock className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <p className="font-bold">{t({ ar: 'ساعات العمل', fr: 'Horaires', en: 'Working Hours' })}</p>
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

import { useState, useEffect, useMemo } from 'react';
import { User, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { saveOrder } from '../utils/orderStorage';
import { getStoredServices, initializeServices } from '../utils/serviceStorage';
import { defaultServices, getAllServiceOptions, getServiceByValue } from '../data/services';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function ServiceBooking() {
  const { t, language } = useLanguage();
  const [services, setServices] = useState(() => { initializeServices(defaultServices); return getStoredServices(defaultServices); });
  const [form, setForm] = useState({ name: '', phone: '', service: '', note: '' });
  const [submitted, setSubmitted] = useState(false);
  const serviceOptions = useMemo(() => getAllServiceOptions(services), [services]);

  useEffect(() => {
    const refresh = () => setServices(getStoredServices(defaultServices));
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      toast.error(t({ ar: 'الرجاء ملء الحقول الأساسية', fr: 'Veuillez remplir les champs requis', en: 'Please fill the required fields' }));
      return;
    }
    if (!form.service) {
      toast.error(t({ ar: 'الرجاء اختيار الخدمة', fr: 'Veuillez choisir le service', en: 'Please select a service' }));
      return;
    }

    const option = serviceOptions.find((s) => s.value === form.service)!;

    saveOrder({
      customer: form.name,
      phone: form.phone,
      email: '',
      wilaya: '',
      municipality: '',
      address: '',
      note: `${t({ ar: 'الخدمة', fr: 'Service', en: 'Service' })}: ${option[language]}${form.note ? ` | ${t({ ar: 'ملاحظات', fr: 'Notes', en: 'Notes' })}: ${form.note}` : ''}`,
      items: [{ name: option[language], quantity: 1, price: 0, total: 0 }],
      total: 0,
      source: 'service-booking',
    });

    setSubmitted(true);
    toast.success(t({ ar: 'تم حجز الخدمة بنجاح!', fr: 'Service réservé avec succès!', en: 'Service booked successfully!' }));
  };

  const resetForm = () => {
    setSubmitted(false);
    setForm({ name: '', phone: '', service: '', note: '' });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      id="booking" className="py-20 bg-gradient-to-br from-slate-50/50 to-blue-50/50 dark:from-slate-900/30 dark:to-blue-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="mb-4">
            {t({ ar: '📅 احجز خدمة', fr: '📅 Réserver un service', en: '📅 Book a Service' })}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t({ ar: 'اختر نوع الخدمة التي تحتاجها وسنعود إليك في أقرب وقت', fr: 'Choisissez le service dont vous avez besoin et nous vous recontacterons', en: 'Choose the service you need and we will get back to you' })}
          </p>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {t({ ar: 'تم الحجز!', fr: 'Réservé!', en: 'Booked!' })}
            </h3>
            <p className="text-muted-foreground mb-8">
              {t({ ar: `شكراً ${form.name}، سنتصل بك قريباً لتأكيد الخدمة`, fr: `Merci ${form.name}, nous vous contacterons bientôt`, en: `Thank you ${form.name}, we will contact you soon` })}
            </p>
            <button onClick={resetForm} className="bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all">
              {t({ ar: 'حجز خدمة أخرى', fr: 'Réserver un autre service', en: 'Book another service' })}
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="space-y-4 bg-card rounded-2xl border border-border p-6 sm:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold mb-2">
                    {t({ ar: 'الاسم الكامل', fr: 'Nom complet', en: 'Full Name' })} <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder={t({ ar: 'مثال: أحمد بن علي', fr: 'Ex: Ahmed Ben Ali', en: 'Ex: Ahmed Ben Ali' })}
                      className="w-full rounded-2xl border-2 border-border bg-background pl-12 pr-5 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-base font-bold mb-2">
                    {t({ ar: 'رقم الهاتف', fr: 'Téléphone', en: 'Phone' })} <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="0674 11 32 90"
                      className="w-full rounded-2xl border-2 border-border bg-background pl-12 pr-5 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-base font-bold mb-2">
                  {t({ ar: 'اختر نوع الخدمة', fr: 'Choisissez le type de service', en: 'Select Service Type' })} <span className="text-destructive">*</span>
                </label>
                <select
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  className="w-full rounded-2xl border-2 border-border bg-background px-5 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer"
                >
                  <option value="">{t({ ar: '-- اختر الخدمة --', fr: '-- Choisissez --', en: '-- Select --' })}</option>
                   {services.map(cat => (
                     <optgroup key={cat.id} label={cat.label[language]}>
                       {cat.options.map(o => <option key={o.value} value={o.value}>{o[language]}</option>)}
                     </optgroup>
                   ))}
                </select>
              </div>

              <div>
                <label className="block text-base font-bold mb-2">{t({ ar: 'ملاحظات', fr: 'Notes', en: 'Notes' })}</label>
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-muted-foreground" />
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    rows={3}
                    placeholder={t({ ar: 'أي تفاصيل إضافية عن الخدمة...', fr: 'Détails supplémentaires sur le service...', en: 'Additional details about the service...' })}
                    className="w-full resize-none rounded-2xl border-2 border-border bg-background pl-12 pr-5 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-2xl bg-gradient-to-r from-primary to-blue-700 px-6 py-5 text-primary-foreground font-bold text-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                {t({ ar: 'تأكيد الحجز', fr: 'Confirmer la réservation', en: 'Confirm Booking' })}
              </button>
            </div>
          </form>
        )}
      </div>
    </motion.section>
  );
}

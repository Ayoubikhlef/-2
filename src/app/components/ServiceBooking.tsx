import { useState, useEffect, useMemo } from 'react';
import { User, Phone, MessageSquare, CheckCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { saveOrder } from '../utils/orderStorage';
import { getStoredServices, initializeServices } from '../utils/serviceStorage';
import { defaultServices, getAllServiceOptions, getServiceByValue } from '../data/services';
import { openOrderForm, submitOrderToSheet } from '../utils/googleForm';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export function ServiceBooking() {
  const { t, language } = useLanguage();
  const [services, setServices] = useState(() => { initializeServices(defaultServices); return getStoredServices(defaultServices); });
  const [form, setForm] = useState({ name: '', phone: '', service: '', note: '' });
  const [submitted, setSubmitted] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<{ serviceName: string; name: string; phone: string; note: string } | null>(null);
  const serviceOptions = useMemo(() => getAllServiceOptions(services), [services]);

  useEffect(() => {
    const refresh = () => setServices(getStoredServices(defaultServices));
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      await saveOrder({
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
      setBookingSummary({ serviceName: option[language], name: form.name, phone: form.phone, note: form.note });
      toast.success(t({ ar: 'تم حجز الخدمة بنجاح!', fr: 'Service réservé avec succès!', en: 'Service booked successfully!' }));
      void submitOrderToSheet({
        name: form.name,
        phone: form.phone,
        product: option[language],
        quantity: 1,
        notes: form.note ? `ملاحظات: ${form.note} | المصدر: حجز خدمة` : 'المصدر: حجز خدمة',
      });
      openOrderForm({
        name: form.name,
        phone: form.phone,
        product: option[language],
        notes: form.note,
        quantity: 1,
      });
    } catch (err: any) {
      console.error('[ServiceBooking] submit failed:', err);
      toast.error(err?.message || t({
        ar: 'تعذر إرسال الحجز. حاول مرة أخرى.',
        fr: 'Impossible d\'envoyer la réservation. Réessayez.',
        en: 'Could not send the booking. Please try again.',
      }));
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setBookingSummary(null);
    setForm({ name: '', phone: '', service: '', note: '' });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      id="booking" className="py-20 bg-gradient-to-br from-slate-50/50 to-blue-50/50 dark:from-transparent dark:to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="mb-4">
            {t({ ar: 'احجز خدمة', fr: 'Réserver un service', en: 'Book a Service' })}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t({ ar: 'اختر نوع الخدمة التي تحتاجها وسنعود إليك في أقرب وقت', fr: 'Choisissez le service dont vous avez besoin et nous vous recontacterons', en: 'Choose the service you need and we will get back to you' })}
          </p>
        </div>

        {submitted && bookingSummary ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">
              {t({ ar: 'تم الحجز بنجاح!', fr: 'Réservé avec succès!', en: 'Booked successfully!' })}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t({ ar: `شكراً ${bookingSummary.name}، سنتصل بك قريباً لتأكيد الخدمة`, fr: `Merci ${bookingSummary.name}, nous vous contacterons bientôt`, en: `Thank you ${bookingSummary.name}, we will contact you soon` })}
            </p>

            <div className="rounded-xl bg-card border border-border p-5 mb-6 text-right shadow-lg" dir="auto">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 text-center">
                {t({ ar: 'ملخص الحجز', fr: 'Résumé', en: 'Booking Summary' })}
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t({ ar: 'الخدمة', fr: 'Service', en: 'Service' })}</span>
                  <span className="font-bold text-primary">{bookingSummary.serviceName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t({ ar: 'الاسم', fr: 'Nom', en: 'Name' })}</span>
                  <span className="font-medium">{bookingSummary.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}</span>
                  <span className="font-medium" dir="ltr">{bookingSummary.phone}</span>
                </div>
                {bookingSummary.note && (
                  <div className="pt-2 border-t border-border">
                    <div className="text-muted-foreground text-xs mb-1">{t({ ar: 'ملاحظات', fr: 'Notes', en: 'Notes' })}</div>
                    <div className="text-sm">{bookingSummary.note}</div>
                  </div>
                )}
                <div className="pt-2.5 border-t border-border flex justify-between items-center">
                  <span className="text-muted-foreground">{t({ ar: 'الدفع', fr: 'Paiement', en: 'Payment' })}</span>
                  <span className="font-medium text-emerald-600">{t({ ar: 'عند الاستلام / حسب الخدمة', fr: 'À la livraison', en: 'On delivery' })}</span>
                </div>
              </div>
            </div>

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

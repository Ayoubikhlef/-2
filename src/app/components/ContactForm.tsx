import { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { getSiteSettings } from '../utils/siteSettingsStorage';
import { resolveApiUrl } from '../utils/api';

const SUBJECTS = [
  { value: 'general', ar: 'استفسار عام', fr: 'Question générale', en: 'General question' },
  { value: 'order', ar: 'طلب أو توصيل', fr: 'Commande ou livraison', en: 'Order or delivery' },
  { value: 'product', ar: 'منتج محدد', fr: 'Un produit précis', en: 'A specific product' },
  { value: 'repair', ar: 'صيانة أو إصلاح', fr: 'Maintenance ou réparation', en: 'Maintenance or repair' },
  { value: 'web', ar: 'إنشاء موقع إلكتروني', fr: 'Création de site web', en: 'Website creation' },
  { value: 'other', ar: 'موضوع آخر', fr: 'Autre sujet', en: 'Other' },
];

export function ContactForm() {
  const { t, language } = useLanguage();
  const contact = getSiteSettings().contact;
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    subject: 'general',
    message: '',
    website: '', // honeypot: real visitors never fill this
  });
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const whatsappFallback = () => {
    const text = [
      `${t({ ar: 'الاسم', fr: 'Nom', en: 'Name' })}: ${form.name}`,
      `${t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}: ${form.phone}`,
      form.email ? `${t({ ar: 'البريد', fr: 'Email', en: 'Email' })}: ${form.email}` : '',
      `${t({ ar: 'الموضوع', fr: 'Sujet', en: 'Subject' })}: ${SUBJECTS.find((item) => item.value === form.subject)?.[language] || form.subject}`,
      '',
      form.message,
    ]
      .filter(Boolean)
      .join('\n');
    return `https://wa.me/${contact.phoneInternational}?text=${encodeURIComponent(text)}`;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (form.name.trim().length < 2) {
      setError(t({ ar: 'يرجى كتابة الاسم الكامل.', fr: 'Veuillez saisir votre nom complet.', en: 'Please enter your full name.' }));
      return;
    }
    const digits = form.phone.replace(/[^\d]/g, '');
    if (digits.length < 9 || digits.length > 15) {
      setError(t({ ar: 'رقم الهاتف غير صحيح (مثال: 0674 11 32 90).', fr: 'Numéro de téléphone invalide (ex: 0674 11 32 90).', en: 'Invalid phone number (e.g. 0674 11 32 90).' }));
      return;
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      setError(t({ ar: 'البريد الإلكتروني غير صحيح.', fr: 'Adresse e-mail invalide.', en: 'Invalid email address.' }));
      return;
    }
    if (form.message.trim().length < 10) {
      setError(t({ ar: 'اكتب رسالة من 10 أحرف على الأقل.', fr: 'Écrivez un message de 10 caractères minimum.', en: 'Write a message of at least 10 characters.' }));
      return;
    }

    setSending(true);
    try {
      const response = await fetch(resolveApiUrl('/api/contact'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim() || undefined,
          subject: form.subject,
          message: form.message.trim(),
          website: form.website,
          language,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.error || `HTTP ${response.status}`);
      }
      setSentId(body?.id || 'ok');
      setForm({ name: '', phone: '', email: '', subject: 'general', message: '', website: '' });
      toast.success(t({ ar: 'وصلت رسالتك، سنرد قريبًا.', fr: 'Message reçu, nous répondrons bientôt.', en: 'Message received, we will reply soon.' }));
    } catch {
      setError(
        t({
          ar: 'تعذّر إرسال الرسالة الآن. يمكنك إرسالها مباشرة عبر واتساب بالزر أدناه.',
          fr: "Impossible d'envoyer le message. Envoyez-le directement via WhatsApp ci-dessous.",
          en: 'Could not send the message right now. Send it directly via WhatsApp below.',
        }),
      );
    } finally {
      setSending(false);
    }
  };

  if (sentId) {
    return (
      <div className="mx-auto mb-12 max-w-3xl rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15">
          <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="mb-2 text-xl font-bold">
          {t({ ar: 'تم إرسال رسالتك بنجاح', fr: 'Message envoyé avec succès', en: 'Message sent successfully' })}
        </h3>
        <p className="mb-5 text-sm text-muted-foreground">
          {t({
            ar: 'شكرًا لتواصلك مع AOS Tech Store. سنرد عليك في أقرب وقت خلال ساعات العمل.',
            fr: 'Merci d’avoir contacté AOS Tech Store. Nous vous répondrons dès que possible pendant les heures d’ouverture.',
            en: 'Thank you for contacting AOS Tech Store. We will get back to you as soon as possible during opening hours.',
          })}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setSentId(null)}
            className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-semibold transition hover:border-primary hover:text-primary"
          >
            {t({ ar: 'إرسال رسالة أخرى', fr: 'Envoyer un autre message', en: 'Send another message' })}
          </button>
          <a
            href={`https://wa.me/${contact.phoneInternational}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" />
            {t({ ar: 'واتساب', fr: 'WhatsApp', en: 'WhatsApp' })}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-12 max-w-4xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="mb-6 text-center">
        <h3 id="contact-form-title" className="mb-2 text-2xl font-extrabold">
          {t({ ar: 'أرسل لنا رسالة', fr: 'Envoyez-nous un message', en: 'Send us a message' })}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t({
            ar: 'أجب عن النموذج وسنعاود الاتصال بك. أو راسلنا مباشرة على واتساب إن كان الأمر مستعجلًا.',
            fr: 'Remplissez le formulaire et nous vous rappellerons. Pour une urgence, écrivez-nous sur WhatsApp.',
            en: 'Fill in the form and we will call you back. For anything urgent, message us on WhatsApp.',
          })}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate aria-labelledby="contact-form-title" className="grid gap-4 sm:grid-cols-2">
        {import.meta.env.DEV && (
          <p className="sm:col-span-2 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300">
            {t({
              ar: 'معاينة محلية: إرسال النموذج يُفعّل بعد رفع التحديث. استخدم زر واتساب الآن.',
              fr: "Aperçu local : l'envoi du formulaire sera actif après le déploiement. Utilisez WhatsApp en attendant.",
              en: 'Local preview: form delivery activates after deployment. Use WhatsApp for now.',
            })}
          </p>
        )}
        <div>
          <label htmlFor="contact-name" className="mb-1.5 block text-sm font-bold">
            {t({ ar: 'الاسم الكامل', fr: 'Nom complet', en: 'Full name' })} <span className="text-destructive">*</span>
          </label>
          <input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder={t({ ar: 'مثال: أحمد بن علي', fr: 'Ex: Ahmed Ben Ali', en: 'Ex: Ahmed Ben Ali' })}
            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-bold">
            {t({ ar: 'رقم الهاتف', fr: 'Téléphone', en: 'Phone' })} <span className="text-destructive">*</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            required
            autoComplete="tel"
            dir="ltr"
            value={form.phone}
            onChange={(event) => update('phone', event.target.value)}
            placeholder="0674 11 32 90"
            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-bold">
            {t({ ar: 'البريد الإلكتروني (اختياري)', fr: 'E-mail (optionnel)', en: 'Email (optional)' })}
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            dir="ltr"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div>
          <label htmlFor="contact-subject" className="mb-1.5 block text-sm font-bold">
            {t({ ar: 'الموضوع', fr: 'Sujet', en: 'Subject' })}
          </label>
          <select
            id="contact-subject"
            name="subject"
            value={form.subject}
            onChange={(event) => update('subject', event.target.value)}
            className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-semibold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {SUBJECTS.map((subject) => (
              <option key={subject.value} value={subject.value}>{subject[language]}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="contact-message" className="mb-1.5 block text-sm font-bold">
            {t({ ar: 'رسالتك', fr: 'Votre message', en: 'Your message' })} <span className="text-destructive">*</span>
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={4}
            value={form.message}
            onChange={(event) => update('message', event.target.value)}
            placeholder={t({
              ar: 'اكتب تفاصيل طلبك أو استفسارك...',
              fr: 'Décrivez votre demande ou votre question...',
              en: 'Describe your request or question...',
            })}
            className="w-full resize-y rounded-xl border-2 border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Honeypot: hidden from people, filled by naive bots. */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(event) => update('website', event.target.value)}
          />
        </div>

        {error && (
          <div role="alert" className="sm:col-span-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
            <p className="flex items-start gap-2 font-semibold text-amber-800 dark:text-amber-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
            <a
              href={whatsappFallback()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
            >
              <MessageCircle className="h-4 w-4" />
              {t({ ar: 'إرسال عبر واتساب', fr: 'Envoyer via WhatsApp', en: 'Send via WhatsApp' })}
            </a>
          </div>
        )}

        <div className="flex flex-col items-center gap-3 sm:col-span-2 sm:flex-row sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {t({
              ar: 'بياناتك تُستخدم فقط للرد على رسالتك.',
              fr: 'Vos données servent uniquement à répondre à votre message.',
              en: 'Your details are only used to reply to your message.',
            })}
          </p>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            {sending
              ? t({ ar: 'جارٍ الإرسال...', fr: 'Envoi...', en: 'Sending...' })
              : t({ ar: 'إرسال الرسالة', fr: 'Envoyer le message', en: 'Send message' })}
          </button>
        </div>
      </form>
    </div>
  );
}

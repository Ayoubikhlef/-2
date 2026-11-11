import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';
import { toast } from 'sonner';
import {
  MessageSquare,
  Phone,
  Mail,
  Trash2,
  RefreshCw,
  CheckCheck,
  Clock,
  Reply,
  Loader2,
  Inbox,
} from 'lucide-react';

type ContactStatus = 'new' | 'read' | 'replied';

interface ContactMessage {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  subject: string;
  message: string;
  language: string | null;
  status: ContactStatus;
  createdAt: string;
}

const SUBJECTS: Record<string, { ar: string; fr: string; en: string }> = {
  general: { ar: 'استفسار عام', fr: 'Question générale', en: 'General' },
  order: { ar: 'طلب أو توصيل', fr: 'Commande / livraison', en: 'Order / delivery' },
  product: { ar: 'منتج محدد', fr: 'Produit précis', en: 'Specific product' },
  repair: { ar: 'صيانة أو إصلاح', fr: 'Maintenance', en: 'Repair' },
  web: { ar: 'إنشاء موقع', fr: 'Création de site', en: 'Website' },
  other: { ar: 'موضوع آخر', fr: 'Autre', en: 'Other' },
};

const STATUS_STYLE: Record<ContactStatus, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  read: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  replied: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export function MessagesTab() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState<'all' | ContactStatus>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.contact.list(filter);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setUnread(Number(data.unread) || 0);
    } catch (err: any) {
      setError(err?.status === 401
        ? t({ ar: 'انتهت الجلسة، أعد تسجيل الدخول.', fr: 'Session expirée, reconnectez-vous.', en: 'Session expired, sign in again.' })
        : t({ ar: 'تعذر تحميل الرسائل. تحقق من الاتصال بالخادم.', fr: 'Impossible de charger les messages. Vérifiez la connexion au serveur.', en: 'Could not load messages. Check the server connection.' }));
    } finally {
      setLoading(false);
    }
  }, [filter, t]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (message: ContactMessage, status: ContactStatus) => {
    setBusyId(message.id);
    try {
      const updated = await api.contact.update(message.id, status);
      setMessages((current) => current.map((item) => (item.id === message.id ? { ...item, ...updated } : item)));
      if (status !== 'new' && message.status === 'new') setUnread((count) => Math.max(0, count - 1));
      toast.success(t({ ar: 'تم تحديث حالة الرسالة', fr: 'Statut mis à jour', en: 'Message status updated' }));
    } catch {
      toast.error(t({ ar: 'تعذر تحديث الرسالة', fr: 'Impossible de mettre à jour', en: 'Could not update message' }));
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (message: ContactMessage) => {
    if (!window.confirm(t({ ar: 'حذف هذه الرسالة نهائيًا؟', fr: 'Supprimer définitivement ce message ?', en: 'Delete this message permanently?' }))) return;
    setBusyId(message.id);
    try {
      await api.contact.remove(message.id);
      setMessages((current) => current.filter((item) => item.id !== message.id));
      if (message.status === 'new') setUnread((count) => Math.max(0, count - 1));
      toast.success(t({ ar: 'حُذفت الرسالة', fr: 'Message supprimé', en: 'Message deleted' }));
    } catch {
      toast.error(t({ ar: 'تعذر حذف الرسالة', fr: 'Impossible de supprimer', en: 'Could not delete message' }));
    } finally {
      setBusyId(null);
    }
  };

  const filters: { value: 'all' | ContactStatus; label: { ar: string; fr: string; en: string } }[] = [
    { value: 'all', label: { ar: 'الكل', fr: 'Toutes', en: 'All' } },
    { value: 'new', label: { ar: 'جديدة', fr: 'Nouvelles', en: 'New' } },
    { value: 'read', label: { ar: 'مقروءة', fr: 'Lues', en: 'Read' } },
    { value: 'replied', label: { ar: 'تم الرد', fr: 'Répondues', en: 'Replied' } },
  ];

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(
      language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' },
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            <Inbox className="h-5 w-5 text-primary" />
            {t({ ar: 'رسائل العملاء', fr: 'Messages clients', en: 'Customer messages' })}
            {unread > 0 && (
              <span className="rounded-full bg-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-400">
                {unread} {t({ ar: 'جديدة', fr: 'nouvelles', en: 'new' })}
              </span>
            )}
          </h2>
          <p className="mt-1 text-xs text-white/40">
            {t({ ar: 'الرسائل الواردة من نموذج التواصل في الموقع.', fr: 'Messages reçus via le formulaire de contact du site.', en: 'Messages received from the website contact form.' })}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white/80 transition hover:bg-slate-800 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {t({ ar: 'تحديث', fr: 'Actualiser', en: 'Refresh' })}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              filter === item.value
                ? 'border-primary bg-primary text-slate-950'
                : 'border-white/10 bg-slate-900 text-white/60 hover:bg-slate-800'
            }`}
          >
            {item.label[language]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-slate-900/60 py-20">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-center text-sm text-amber-300">
          {error}
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-14 text-center">
          <MessageSquare className="mx-auto mb-3 h-12 w-12 text-white/20" />
          <p className="text-sm text-white/50">
            {t({ ar: 'لا توجد رسائل في هذا التصنيف.', fr: 'Aucun message dans cette catégorie.', en: 'No messages in this category.' })}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const subject = SUBJECTS[message.subject] || SUBJECTS.general;
            const whatsappReply = `https://wa.me/${message.phone.replace(/[^\d]/g, '').replace(/^0/, '213')}?text=${encodeURIComponent(
              t({
                ar: `مرحبًا ${message.name}، شكرًا لتواصلك مع AOS Tech Store. بخصوص رسالتك:`,
                fr: `Bonjour ${message.name}, merci d'avoir contacté AOS Tech Store. Concernant votre message :`,
                en: `Hello ${message.name}, thank you for contacting AOS Tech Store. Regarding your message:`,
              }),
            )}`;
            const busy = busyId === message.id;

            return (
              <article
                key={message.id}
                className={`rounded-2xl border p-5 transition ${
                  message.status === 'new'
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-white/10 bg-slate-900/60'
                }`}
              >
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-white">{message.name}</h3>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${STATUS_STYLE[message.status]}`}>
                        {filters.find((item) => item.value === message.status)?.label[language] || message.status}
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                        {subject[language]}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/50">
                      <a href={`tel:${message.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary" dir="ltr">
                        <Phone className="h-3.5 w-3.5" /> {message.phone}
                      </a>
                      {message.email && (
                        <a href={`mailto:${message.email}`} className="inline-flex items-center gap-1.5 hover:text-primary" dir="ltr">
                          <Mail className="h-3.5 w-3.5" /> {message.email}
                        </a>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> {formatDate(message.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {message.status !== 'replied' && (
                      <button
                        onClick={() => setStatus(message, 'replied')}
                        disabled={busy}
                        title={t({ ar: 'تحديد كمُجاب عليها', fr: 'Marquer comme répondue', en: 'Mark as replied' })}
                        className="rounded-lg p-2 text-emerald-400 transition hover:bg-emerald-500/10 disabled:opacity-40"
                      >
                        <CheckCheck className="h-4 w-4" />
                      </button>
                    )}
                    {message.status === 'new' && (
                      <button
                        onClick={() => setStatus(message, 'read')}
                        disabled={busy}
                        title={t({ ar: 'تحديد كمقروءة', fr: 'Marquer comme lue', en: 'Mark as read' })}
                        className="rounded-lg p-2 text-amber-400 transition hover:bg-amber-500/10 disabled:opacity-40"
                      >
                        <Mail className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => remove(message)}
                      disabled={busy}
                      title={t({ ar: 'حذف', fr: 'Supprimer', en: 'Delete' })}
                      className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-500/10 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="whitespace-pre-wrap rounded-xl bg-black/20 p-4 text-sm leading-relaxed text-white/80">
                  {message.message}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <a
                    href={whatsappReply}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    <Reply className="h-4 w-4" />
                    {t({ ar: 'رد عبر واتساب', fr: 'Répondre sur WhatsApp', en: 'Reply on WhatsApp' })}
                  </a>
                  {message.email && (
                    <a
                      href={`mailto:${message.email}?subject=${encodeURIComponent('AOS Tech Store')}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-800 px-4 py-2 text-xs font-bold text-white/80 transition hover:bg-slate-700"
                    >
                      <Mail className="h-4 w-4" />
                      {t({ ar: 'رد بالبريد', fr: 'Répondre par e-mail', en: 'Reply by email' })}
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

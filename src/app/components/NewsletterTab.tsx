import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSubscribers, loadSubscribersFromServer } from '../utils/newsletterStorage';
import { Mail, Copy, Download, RefreshCw, Send, Loader2 } from 'lucide-react';
import { api } from '../utils/api';
import { toast } from 'sonner';

export function NewsletterTab() {
  const { t, language } = useLanguage();
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadSubscribersFromServer();
      setSubscribers(list);
    } catch {
      setSubscribers(getSubscribers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onChanged = () => {
      setSubscribers(getSubscribers());
    };
    window.addEventListener('aos:data-changed', onChanged);
    return () => window.removeEventListener('aos:data-changed', onChanged);
  }, []);

  const copyAll = () => {
    navigator.clipboard.writeText(subscribers.join('\n'));
    toast.success(t({ ar: 'تم نسخ القائمة', fr: 'Liste copiée', en: 'List copied' }));
  };

  const exportCSV = () => {
    const csv = 'Email\n' + subscribers.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t({ ar: 'تم التصدير', fr: 'Exporté', en: 'Exported' }));
  };

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [smtpConfigured, setSmtpConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    api.email.configStatus().then(r => setSmtpConfigured(r.configured)).catch(() => setSmtpConfigured(false));
  }, []);

  const sendBroadcast = async () => {
    if (!subject.trim() || !body.trim()) {
      toast.error(t({ ar: 'يرجى ملء العنوان والمحتوى', fr: 'Veuillez remplir le sujet et le contenu', en: 'Please fill subject and body' }));
      return;
    }
    setSending(true);
    try {
      const r = await api.email.send({ subject, body });
      toast.success(r.mode === 'log'
        ? t({ ar: 'تم التسجيل في السجل (SMTP غير مهيأ)', fr: 'Journalisé (SMTP non configuré)', en: 'Logged (SMTP not configured)' })
        : t({ ar: `تم الإرسال إلى ${r.count} مشترك`, fr: `Envoyé à ${r.count} abonnés`, en: `Sent to ${r.count} subscribers` }));
      setSubject('');
      setBody('');
    } catch {
      toast.error(t({ ar: 'فشل الإرسال', fr: 'Échec denvoi', en: 'Send failed' }));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">
            {t({ ar: 'المشتركون في النشرة البريدية', fr: 'Abonnés newsletter', en: 'Newsletter Subscribers' })}
          </h3>
          <p className="text-sm text-white/50">
            {loading
              ? t({ ar: 'جاري التحميل...', fr: 'Chargement...', en: 'Loading...' })
              : `${subscribers.length} ${t({ ar: 'مشترك', fr: 'abonnés', en: 'subscribers' })}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh} disabled={loading}
            className="flex items-center gap-2 rounded-full bg-slate-800 text-white/70 px-4 py-2 text-sm font-semibold hover:bg-slate-700 transition-all border border-white/10 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t({ ar: 'تحديث', fr: 'Actualiser', en: 'Refresh' })}
          </button>
          <button onClick={copyAll}
            className="flex items-center gap-2 rounded-full bg-slate-800 text-white/70 px-4 py-2 text-sm font-semibold hover:bg-slate-700 transition-all border border-white/10">
            <Copy className="w-4 h-4" /> {t({ ar: 'نسخ', fr: 'Copier', en: 'Copy' })}
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 px-4 py-2 text-sm font-semibold hover:bg-emerald-500/30 transition-all border border-emerald-500/20">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-white/40">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-lg">{t({ ar: 'جاري تحميل المشتركين...', fr: 'Chargement des abonnés...', en: 'Loading subscribers...' })}</p>
        </div>
      ) : subscribers.length === 0 ? (
        <div className="text-center py-16 text-white/40">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg">{t({ ar: 'لا يوجد مشتركون بعد', fr: 'Aucun abonné pour le moment', en: 'No subscribers yet' })}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 overflow-hidden">
          <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
            {subscribers.map((email, idx) => (
              <div key={idx} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/50 transition-colors">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-white font-medium">{email}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <h4 className="text-md font-bold text-white mb-4 flex items-center gap-2">
          <Send className="w-4 h-4 text-primary" />
          {t({ ar: 'إرسال بريد جماعي', fr: 'Envoi groupé', en: 'Broadcast Email' })}
          {smtpConfigured === true && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">SMTP OK</span>}
          {smtpConfigured === false && <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">SMTP: {t({ ar: 'غير مهيأ (تسجيل فقط)', fr: 'Non configuré (log)', en: 'Not configured (log only)' })}</span>}
        </h4>
        <input
          type="text" value={subject} onChange={e => setSubject(e.target.value)}
          placeholder={t({ ar: 'عنوان البريد', fr: 'Sujet', en: 'Subject' })}
          className="w-full rounded-xl bg-slate-800 text-white px-4 py-3 text-sm border border-white/10 placeholder:text-white/30 focus:outline-none focus:border-primary mb-3" />
        <textarea
          value={body} onChange={e => setBody(e.target.value)} rows={6}
          placeholder={t({ ar: 'محتوى البريد (HTML)', fr: 'Contenu (HTML)', en: 'Body (HTML)' })}
          className="w-full rounded-xl bg-slate-800 text-white px-4 py-3 text-sm border border-white/10 placeholder:text-white/30 focus:outline-none focus:border-primary resize-y" />
        <button onClick={sendBroadcast} disabled={sending}
          className="mt-3 flex items-center gap-2 rounded-full bg-primary text-white px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {t({ ar: 'إرسال للجميع', fr: 'Envoyer à tous', en: 'Send to all' })}
        </button>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getSubscribers } from '../utils/newsletterStorage';
import { Mail, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

export function NewsletterTab() {
  const { t, language } = useLanguage();
  const [subscribers, setSubscribers] = useState<string[]>([]);

  useEffect(() => {
    setSubscribers(getSubscribers());
  }, []);

  useEffect(() => {
    const refresh = () => setSubscribers(getSubscribers());
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">
            {t({ ar: 'المشتركون في النشرة البريدية', fr: 'Abonnés newsletter', en: 'Newsletter Subscribers' })}
          </h3>
          <p className="text-sm text-white/50">{subscribers.length} {t({ ar: 'مشترك', fr: 'abonnés', en: 'subscribers' })}</p>
        </div>
        <div className="flex gap-2">
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

      {subscribers.length === 0 ? (
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
    </div>
  );
}

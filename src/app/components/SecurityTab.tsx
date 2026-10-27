import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';
import { Shield, ShieldAlert, ShieldCheck, RefreshCw, Ban, Send, AlertTriangle, Clock, Search, Unlock } from 'lucide-react';
import { toast } from 'sonner';

type Severity = 'low' | 'medium' | 'high' | 'critical';

interface Incident {
  id: string;
  type: string;
  severity: Severity;
  ip: string;
  method: string;
  path: string;
  userAgent?: string;
  details?: string;
  createdAt: string;
}

interface BlockedIp {
  ip: string;
  reason: string;
  until: string;
  createdAt: string;
}

interface SecurityData {
  status: {
    alertsConfigured: boolean;
    telegramConfigured: boolean;
    discordConfigured: boolean;
    emailConfigured: boolean;
    autoBlockEnabled: boolean;
    incidentsInMemory: number;
    blockedIps: number;
  };
  incidents: Incident[];
  blockedIps: BlockedIp[];
  history: any[];
}

const severityStyle: Record<Severity, string> = {
  low: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  critical: 'bg-red-500/20 text-red-300 border-red-500/30',
};

export function SecurityTab() {
  const { t } = useLanguage();
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [ipToBlock, setIpToBlock] = useState('');
  const [blockMinutes, setBlockMinutes] = useState(60);
  const [blocking, setBlocking] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.security.events(150);
      setData(result);
    } catch (err: any) {
      toast.error(err?.message || t({ ar: 'تعذر تحميل بيانات الأمان', fr: 'Impossible de charger les données de sécurité', en: 'Could not load security data' }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 30_000);
    return () => clearInterval(timer);
  }, [load]);

  const rows = useMemo<Incident[]>(() => {
    if (!data) return [];
    if (data.incidents.length > 0) return data.incidents;
    return (data.history || []).map((item: any) => ({
      id: item.id,
      type: String(item.action || '').replace(/^SECURITY_/, '').toLowerCase(),
      severity: (item.details?.severity || 'medium') as Severity,
      ip: item.ipAddress || '-',
      method: item.details?.method || '-',
      path: item.resource || '-',
      userAgent: item.details?.userAgent || '',
      details: item.details?.details || '',
      createdAt: item.createdAt,
    }));
  }, [data]);

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      `${row.type} ${row.ip} ${row.path} ${row.details || ''}`.toLowerCase().includes(q)
    );
  }, [rows, query]);

  const handleTestAlert = async () => {
    setTesting(true);
    try {
      const result = await api.security.testAlert();
      const channels = Object.entries(result?.channels || {})
        .filter(([, delivered]) => delivered)
        .map(([channel]) => channel)
        .join(', ');
      toast.success(
        channels
          ? t({
              ar: `تم إرسال التنبيه عبر: ${channels}`,
              fr: `Alerte envoyée via : ${channels}`,
              en: `Alert sent via: ${channels}`,
            })
          : t({ ar: 'تم إرسال تنبيه تجريبي', fr: 'Alerte de test envoyée', en: 'Test alert sent' })
      );
    } catch (err: any) {
      toast.error(err?.message || t({ ar: 'تعذر إرسال التنبيه', fr: "Impossible d'envoyer l'alerte", en: 'Could not send the alert' }));
    } finally {
      setTesting(false);
    }
  };

  const handleBlock = async () => {
    if (!ipToBlock.trim()) return;
    setBlocking(true);
    try {
      await api.security.block(ipToBlock.trim(), blockMinutes);
      toast.success(t({ ar: 'تم حظر عنوان IP', fr: 'Adresse IP bloquée', en: 'IP address blocked' }));
      setIpToBlock('');
      await load();
    } catch (err: any) {
      toast.error(err?.message || t({ ar: 'تعذر حظر العنوان', fr: "Impossible de bloquer l'adresse", en: 'Could not block the address' }));
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (ip: string) => {
    try {
      await api.security.unblock(ip);
      toast.success(t({ ar: 'تم رفع الحظر', fr: 'Blocage levé', en: 'IP unblocked' }));
      await load();
    } catch (err: any) {
      toast.error(err?.message || t({ ar: 'تعذر رفع الحظر', fr: 'Impossible de débloquer', en: 'Could not unblock' }));
    }
  };

  const status = data?.status;

  const cards = [
    {
      label: t({ ar: 'تنبيهات الأمان', fr: 'Alertes de sécurité', en: 'Security alerts' }),
      value: !status
        ? '…'
        : status.alertsConfigured
          ? t({ ar: 'مفعّلة', fr: 'Activées', en: 'Enabled' })
          : t({ ar: 'غير مفعّلة', fr: 'Désactivées', en: 'Disabled' }),
      icon: !status ? Shield : status.alertsConfigured ? ShieldCheck : ShieldAlert,
      color: !status
        ? 'text-slate-400 bg-slate-500/20'
        : status.alertsConfigured
          ? 'text-emerald-400 bg-emerald-500/20'
          : 'text-red-400 bg-red-500/20',
    },
    {
      label: t({ ar: 'حوادث مسجلة', fr: 'Incidents enregistrés', en: 'Recorded incidents' }),
      value: status ? String(rows.length) : '…',
      icon: AlertTriangle,
      color: 'text-amber-400 bg-amber-500/20',
    },
    {
      label: t({ ar: 'عناوين محظورة', fr: 'IP bloquées', en: 'Blocked IPs' }),
      value: status ? String(status.blockedIps) : '…',
      icon: Ban,
      color: 'text-orange-400 bg-orange-500/20',
    },
    {
      label: t({ ar: 'الحظر التلقائي', fr: 'Blocage automatique', en: 'Auto-block' }),
      value: !status
        ? '…'
        : status.autoBlockEnabled
          ? t({ ar: 'مفعّل', fr: 'Activé', en: 'On' })
          : t({ ar: 'معطّل', fr: 'Désactivé', en: 'Off' }),
      icon: Shield,
      color: status?.autoBlockEnabled ? 'text-sky-400 bg-sky-500/20' : 'text-slate-400 bg-slate-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {t({ ar: 'مركز الأمان', fr: 'Centre de sécurité', en: 'Security Center' })}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {t({
              ar: 'مراقبة محاولات الاختراق والتنبيهات الفورية',
              fr: 'Surveillance des tentatives d’intrusion et alertes instantanées',
              en: 'Intrusion monitoring and instant alerts',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-slate-800 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t({ ar: 'تحديث', fr: 'Actualiser', en: 'Refresh' })}
          </button>
          <button
            onClick={() => void handleTestAlert()}
            disabled={testing}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-primary/90 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {t({ ar: 'تنبيه تجريبي', fr: 'Alerte test', en: 'Test alert' })}
          </button>
        </div>
      </div>

      {data && !status?.alertsConfigured && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {t({
            ar: 'التنبيهات غير مفعّلة. أضف إعدادات SMTP (SMTP_HOST و SMTP_USER و SMTP_PASS) وبريد الاستلام SECURITY_ALERT_EMAIL في متغيرات بيئة السيرفر (Render)، أو استخدم Telegram/Discord.',
            fr: 'Les alertes sont désactivées. Ajoutez les réglages SMTP (SMTP_HOST, SMTP_USER, SMTP_PASS) et SECURITY_ALERT_EMAIL aux variables du serveur (Render), ou utilisez Telegram/Discord.',
            en: 'Alerts are disabled. Add SMTP settings (SMTP_HOST, SMTP_USER, SMTP_PASS) and SECURITY_ALERT_EMAIL to the API server environment variables (Render), or use Telegram/Discord.',
          })}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-white">{card.value}</p>
            <p className="text-xs text-white/50 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {status && (
        <div className="flex flex-wrap items-center gap-4 px-1 text-[11px] text-white/40">
          <span>
            Email:{' '}
            <span className={status.emailConfigured ? 'text-emerald-400' : 'text-red-400'}>
              {status.emailConfigured ? '✓' : '✗'}
            </span>
          </span>
          <span>
            Discord:{' '}
            <span className={status.discordConfigured ? 'text-emerald-400' : 'text-red-400'}>
              {status.discordConfigured ? '✓' : '✗'}
            </span>
          </span>
          <span>
            Telegram:{' '}
            <span className={status.telegramConfigured ? 'text-emerald-400' : 'text-red-400'}>
              {status.telegramConfigured ? '✓' : '✗'}
            </span>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-white/10">
            <h3 className="font-bold text-white text-sm">{t({ ar: 'آخر المحاولات المشبوهة', fr: 'Dernières tentatives suspectes', en: 'Latest suspicious attempts' })}</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t({ ar: 'بحث IP أو المسار', fr: 'Chercher IP ou chemin', en: 'Search IP or path' })}
                className="w-48 rounded-xl border border-white/10 bg-slate-800 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-primary"
              />
            </div>
          </div>

          {filteredRows.length === 0 ? (
            <div className="p-10 text-center">
              <ShieldCheck className="w-10 h-10 text-emerald-400/50 mx-auto mb-3" />
              <p className="text-sm text-white/50">
                {loading
                  ? t({ ar: 'جارٍ التحميل...', fr: 'Chargement...', en: 'Loading...' })
                  : t({ ar: 'لا توجد حوادث مسجلة — كل شيء هادئ', fr: 'Aucun incident — tout est calme', en: 'No incidents — all clear' })}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-950/95 text-white/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">{t({ ar: 'النوع', fr: 'Type', en: 'Type' })}</th>
                    <th className="text-left px-4 py-3 font-medium">{t({ ar: 'الخطورة', fr: 'Gravité', en: 'Severity' })}</th>
                    <th className="text-left px-4 py-3 font-medium">IP</th>
                    <th className="text-left px-4 py-3 font-medium">{t({ ar: 'المسار', fr: 'Chemin', en: 'Path' })}</th>
                    <th className="text-left px-4 py-3 font-medium">{t({ ar: 'الوقت', fr: 'Heure', en: 'Time' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-semibold text-white/80 whitespace-nowrap">{row.type || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${severityStyle[row.severity] || severityStyle.medium}`}>
                          {row.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-white/70 whitespace-nowrap">{row.ip}</td>
                      <td className="px-4 py-3 text-white/60 max-w-[260px] truncate" title={row.path}>{row.path}</td>
                      <td className="px-4 py-3 text-white/40 whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Ban className="w-4 h-4 text-orange-400" />
              {t({ ar: 'حظر عنوان IP', fr: 'Bloquer une IP', en: 'Block an IP' })}
            </h3>
            <div className="space-y-2">
              <input
                value={ipToBlock}
                onChange={(event) => setIpToBlock(event.target.value)}
                placeholder="203.0.113.10"
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-primary"
              />
              <select
                value={blockMinutes}
                onChange={(event) => setBlockMinutes(Number(event.target.value))}
                className="w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-primary"
              >
                <option value={15}>15 {t({ ar: 'دقيقة', fr: 'min', en: 'min' })}</option>
                <option value={60}>1 {t({ ar: 'ساعة', fr: 'heure', en: 'hour' })}</option>
                <option value={360}>6 {t({ ar: 'ساعات', fr: 'heures', en: 'hours' })}</option>
                <option value={1440}>24 {t({ ar: 'ساعة', fr: 'heures', en: 'hours' })}</option>
              </select>
              <button
                onClick={() => void handleBlock()}
                disabled={blocking || !ipToBlock.trim()}
                className="w-full rounded-xl bg-orange-500/20 border border-orange-500/30 px-3 py-2 text-sm font-bold text-orange-300 hover:bg-orange-500/30 transition disabled:opacity-40"
              >
                {t({ ar: 'حظر', fr: 'Bloquer', en: 'Block' })}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              {t({ ar: 'عناوين محظورة حالياً', fr: 'IP actuellement bloquées', en: 'Currently blocked IPs' })}
            </h3>
            {(data?.blockedIps.length || 0) === 0 ? (
              <p className="text-xs text-white/40">{t({ ar: 'لا يوجد أي عنوان محظور', fr: 'Aucune adresse bloquée', en: 'No blocked addresses' })}</p>
            ) : (
              <div className="space-y-2">
                {data?.blockedIps.map((item) => (
                  <div key={item.ip} className="rounded-xl border border-white/10 bg-slate-800/70 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs text-white/80">{item.ip}</span>
                      <button
                        onClick={() => void handleUnblock(item.ip)}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300 hover:bg-emerald-500/25 transition"
                      >
                        <Unlock className="w-3 h-3" />
                        {t({ ar: 'رفع', fr: 'Débloquer', en: 'Unblock' })}
                      </button>
                    </div>
                    <p className="text-[10px] text-white/40 mt-1 truncate" title={item.reason}>{item.reason}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {t({ ar: 'حتى', fr: "Jusqu'à", en: 'Until' })} {new Date(item.until).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

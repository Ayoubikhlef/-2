import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Package, Truck, CheckCircle, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { api } from '../utils/api';
import { getOrders } from '../utils/orderStorage';
import type { OrderRecord, OrderStatus } from '../utils/orderStorage';

const statusFlow: OrderStatus[] = ['new', 'processing', 'completed'];

const statusIcons: Record<OrderStatus, typeof Package> = {
  new: Package,
  processing: Truck,
  completed: CheckCircle,
  cancelled: XCircle,
};

const statusColors: Record<OrderStatus, string> = {
  new: 'from-blue-500 to-blue-600',
  processing: 'from-amber-500 to-orange-600',
  completed: 'from-green-500 to-emerald-600',
  cancelled: 'from-red-500 to-rose-600',
};

const statusLabels = {
  ar: { new: 'جديد', processing: 'قيد المعالجة', completed: 'مكتمل', cancelled: 'ملغي' },
  fr: { new: 'Nouveau', processing: 'En cours', completed: 'Terminé', cancelled: 'Annulé' },
  en: { new: 'New', processing: 'Processing', completed: 'Completed', cancelled: 'Cancelled' },
};

const statusBadgeClasses: Record<OrderStatus, string> = {
  new: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30',
  processing: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30',
  completed: 'bg-green-500/15 text-green-600 dark:text-green-400 ring-1 ring-green-500/30',
  cancelled: 'bg-red-500/15 text-red-500 dark:text-red-400 ring-1 ring-red-500/30',
};

function Stepper({ status }: { status: OrderStatus }) {
  const { language } = useLanguage();
  const isCancelled = status === 'cancelled';
  const currentIdx = statusFlow.indexOf(status);

  return (
    <div className="relative flex items-center justify-between w-full max-w-lg mx-auto" dir="ltr">
      {statusFlow.map((step, idx) => {
        const Icon = statusIcons[step];
        const isActive = idx <= currentIdx;
        const isLast = idx === statusFlow.length - 1;
        const isCancelledStep = isCancelled && isActive;

        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.15, type: 'spring', stiffness: 200 }}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 ${
                  isCancelledStep
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 ring-2 ring-red-300/50'
                    : isActive
                      ? `bg-gradient-to-br ${statusColors[step]} ring-2 ring-white/20`
                      : 'bg-muted ring-1 ring-border'
                }`}
              >
                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-colors ${
                  isActive || isCancelledStep ? 'text-white' : 'text-muted-foreground'
                }`} />
              </motion.div>
              <span className={`mt-2 text-xs sm:text-sm font-semibold transition-colors duration-300 ${
                isCancelledStep
                  ? 'text-red-500 dark:text-red-400'
                  : isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
              }`}>
                {statusLabels[language][step]}
              </span>
            </div>

            {!isLast && (
              <div className="flex-1 mx-2 sm:mx-4 relative">
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: isActive ? '100%' : '0%' }}
                    transition={{ duration: 0.6, delay: idx * 0.2 }}
                    className={`h-full rounded-full ${
                      isCancelledStep
                        ? 'bg-gradient-to-r from-red-500 to-rose-600'
                        : 'bg-primary'
                    }`}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {isCancelled && (
        <div className="flex items-center ml-2 sm:ml-4">
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-red-500 to-rose-600 ring-2 ring-red-300/50"
            >
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </motion.div>
            <span className="mt-2 text-xs sm:text-sm font-semibold text-red-500 dark:text-red-400">
              {statusLabels[language].cancelled}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: OrderRecord }) {
  const { t, language } = useLanguage();
  const date = new Date(order.createdAt).toLocaleDateString(
    language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden"
    >
      <div className="p-6 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {t({ ar: 'رقم الطلب', fr: 'Numéro de commande', en: 'Order ID' })}
            </p>
            <p className="text-lg font-mono font-bold text-foreground">{order.id.slice(0, 8)}...</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {t({ ar: 'تاريخ الطلب', fr: 'Date de commande', en: 'Order Date' })}
            </p>
            <p className="font-semibold">{date}</p>
          </div>
        </div>

        <Stepper status={order.status} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground tracking-normal mb-1">
              {t({ ar: 'العميل', fr: 'Client', en: 'Customer' })}
            </p>
            <p className="font-semibold">{order.customer}</p>
          </div>
          <div className="bg-muted rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground tracking-normal mb-1">
              {t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}
            </p>
            <p className="font-semibold" dir="ltr">{order.phone}</p>
          </div>
          {order.email && (
            <div className="bg-muted rounded-xl p-4 sm:col-span-2">
              <p className="text-xs font-semibold text-muted-foreground tracking-normal mb-1">
                {t({ ar: 'البريد الإلكتروني', fr: 'Email', en: 'Email' })}
              </p>
              <p className="font-semibold break-all">{order.email}</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-muted-foreground mb-3">
            {t({ ar: 'المنتجات', fr: 'Produits', en: 'Items' })}
          </p>
          <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Package className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm text-muted-foreground">×{item.quantity}</span>
                  <span className="font-semibold text-sm">{item.total.toLocaleString()} د.ج</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-normal ${
              order.status === 'cancelled'
                ? 'bg-red-500/15 text-red-500 dark:text-red-400 ring-1 ring-red-500/30'
                : order.status === 'completed'
                  ? 'bg-green-500/15 text-green-600 dark:text-green-400 ring-1 ring-green-500/30'
                  : order.status === 'processing'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30'
                    : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30'
            }`}>
              {statusLabels[language][order.status]}
            </span>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {t({ ar: 'المجموع', fr: 'Total', en: 'Total' })}
            </p>
            <p className="text-2xl font-bold text-primary">{order.total.toLocaleString()} د.ج</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function OrderTracking() {
  const { t, language } = useLanguage();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<OrderRecord[]>([]);
  const [showAllOrders, setShowAllOrders] = useState(false);
  const detailsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadLocalOrders = () => {
      const list = getOrders()
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentOrders(list);
    };
    loadLocalOrders();
    window.addEventListener('aos:data-changed', loadLocalOrders);
    window.addEventListener('storage', loadLocalOrders);
    return () => {
      window.removeEventListener('aos:data-changed', loadLocalOrders);
      window.removeEventListener('storage', loadLocalOrders);
    };
  }, []);

  useEffect(() => {
    if (!order) return;
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [order]);

  const handleSelectOrder = useCallback((record: OrderRecord) => {
    setOrder(record);
    setOrderId(record.id);
  }, []);

  const formatShortDate = (value: string) =>
    new Date(value).toLocaleDateString(
      language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-DZ' : 'en-DZ',
      { day: 'numeric', month: 'short', year: 'numeric' }
    );

  const visibleOrders = showAllOrders ? recentOrders : recentOrders.slice(0, 3);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const id = orderId.trim();
    if (!id) {
      toast.error(t({ ar: 'الرجاء إدخال رقم الطلب', fr: 'Veuillez entrer le numéro de commande', en: 'Please enter the order ID' }));
      return;
    }

    setLoading(true);
    setOrder(null);

    // Normalize: strip # prefix, trim, lowercase
    const normalized = id.replace(/^#/, '').trim().toLowerCase();

    // Try local storage first
    const localOrders = getOrders();
    const local = localOrders.find(o => {
      const oid = (o.id || '').toLowerCase();
      return oid === normalized || oid.startsWith(normalized);
    });
    if (local) {
      setOrder(local);
      setLoading(false);
      const refreshRemoteOrder = async () => {
        try {
          const remote = await api.get<OrderRecord>(`/orders/track/${encodeURIComponent(normalized)}`);
          setOrder(remote);
        } catch {
          // ignore remote refresh failures when local order exists
        }
      };
      refreshRemoteOrder();
      return;
    }

    // Fallback to server
    try {
      const found = await api.get<OrderRecord>(`/orders/track/${encodeURIComponent(normalized)}`);
      setOrder(found);
    } catch {
      toast.error(t({
        ar: 'فشل الاتصال بالخادم. تحقق من اتصالك بالإنترنت.',
        fr: 'Échec de connexion au serveur. Vérifiez votre connexion Internet.',
        en: 'Failed to connect to the server. Check your internet connection.',
      }));
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      id="order-tracking"
      className="scroll-mt-24 py-20 bg-gradient-to-b from-white/80 to-slate-50/70 dark:from-transparent dark:to-transparent"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="mb-4">
            {t({ ar: 'تتبع الطلب', fr: 'Suivi de commande', en: 'Order Tracking' })}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t({
              ar: 'أدخل رقم الطلب الخاص بك لتتبع حالة طلبك ومعرفة موقعه الحالي',
              fr: 'Entrez votre numéro de commande pour suivre l\'état de votre commande',
              en: 'Enter your order ID to track the status and current location of your order',
            })}
          </p>
        </div>

        <div className="max-w-xl mx-auto mb-12">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder={t({
                  ar: 'أدخل رقم الطلب',
                  fr: 'Entrez le numéro de commande',
                  en: 'Enter order ID',
                })}
                className="w-full pl-12 pr-4 py-3.5 bg-card border border-border rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-base shadow-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold hover:bg-primary/90 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-lg flex items-center gap-2"
            >
              {loading ? (
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <Search className="w-5 h-5" />
              )}
              {t({ ar: 'بحث', fr: 'Rechercher', en: 'Search' })}
            </button>
          </form>
        </div>

        {recentOrders.length > 0 && (
          <div className="max-w-3xl mx-auto mb-12">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {t({ ar: 'طلباتك على هذا الجهاز', fr: 'Vos commandes sur cet appareil', en: 'Your orders on this device' })}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {t({
                    ar: 'محفوظة في هذا المتصفح فقط. اضغط على أي طلب لعرض تفاصيله.',
                    fr: 'Enregistrées dans ce navigateur uniquement. Cliquez sur une commande pour voir ses détails.',
                    en: 'Saved in this browser only. Click an order to see its details.',
                  })}
                </p>
              </div>
              <span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-bold">
                {recentOrders.length}
              </span>
            </div>

            <div className="space-y-2">
              {visibleOrders.map((record) => {
                const itemCount = (record.items || []).reduce((sum, item) => sum + item.quantity, 0);
                return (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => handleSelectOrder(record)}
                    className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-start shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-normal ${statusBadgeClasses[record.status]}`}>
                        {statusLabels[language][record.status]}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-mono text-sm font-semibold text-foreground">
                          #{record.id.slice(0, 8)}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {formatShortDate(record.createdAt)} · {itemCount} {t({ ar: 'قطعة', fr: 'article(s)', en: 'item(s)' })}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="text-sm font-bold text-primary">
                        {Number(record.total).toLocaleString()} د.ج
                      </p>
                      <p className="text-[11px] font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                        {t({ ar: 'عرض التفاصيل', fr: 'Voir les détails', en: 'View details' })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {recentOrders.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllOrders((value) => !value)}
                className="mt-3 w-full rounded-xl border border-dashed border-border px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {showAllOrders
                  ? t({ ar: 'عرض أقل', fr: 'Voir moins', en: 'Show less' })
                  : t({
                      ar: `عرض كل الطلبات (${recentOrders.length})`,
                      fr: `Voir toutes les commandes (${recentOrders.length})`,
                      en: `Show all orders (${recentOrders.length})`,
                    })}
              </button>
            )}
          </div>
        )}

        {order && (
          <div ref={detailsRef} className="scroll-mt-24">
            <OrderCard order={order} />
          </div>
        )}
      </div>
    </motion.section>
  );
}

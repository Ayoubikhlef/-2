import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrders, type OrderRecord } from '../utils/orderStorage';
import { getStoredProducts } from '../utils/productStorage';
import { products as defaultProducts } from '../data/products';
import { motion } from 'motion/react';
import {
  DollarSign, ShoppingCart, Package, Users, AlertTriangle,
  TrendingUp, Calendar, Clock, ArrowUp, ArrowDown, Eye,
  BarChart3, Bell, Activity
} from 'lucide-react';

const statusBadge: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  processing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const statusLabelMap: Record<string, Record<string, string>> = {
  new: { ar: 'جديد', fr: 'Nouveau', en: 'New' },
  processing: { ar: 'قيد المعالجة', fr: 'En cours', en: 'Processing' },
  completed: { ar: 'مكتمل', fr: 'Terminé', en: 'Completed' },
  cancelled: { ar: 'ملغي', fr: 'Annulé', en: 'Cancelled' },
};

export function AdminDashboard() {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const refresh = () => { setOrders(getOrders()); setProducts(getStoredProducts(defaultProducts)); };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    const interval = setInterval(refresh, 10000);
    window.addEventListener('aos:data-changed', refresh);
    return () => { clearInterval(interval); window.removeEventListener('aos:data-changed', refresh); };
  }, []);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const thisMonthStr = now.toISOString().slice(0, 7);
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  const todayRevenue = orders.filter(o => o.createdAt.slice(0, 10) === todayStr && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const yesterdayRevenue = orders.filter(o => o.createdAt.slice(0, 10) === yesterdayStr && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const monthRevenue = orders.filter(o => o.createdAt.slice(0, 7) === thisMonthStr && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);

  const todayOrders = orders.filter(o => o.createdAt.slice(0, 10) === todayStr).length;
  const yesterdayOrders = orders.filter(o => o.createdAt.slice(0, 10) === yesterdayStr).length;
  const monthOrders = orders.filter(o => o.createdAt.slice(0, 7) === thisMonthStr).length;
  const totalOrders = orders.length;

  const uniquePhones = new Set(orders.map(o => o.phone)).size;
  const totalProductCount = products.length;
  const onSaleCount = products.filter(p => (p as any).salePrice != null).length;

  const recentOrders = [...orders].slice(0, 10);

  const productSales = orders.flatMap(o => o.items).reduce<Record<string, { name: string; qty: number; total: number }>>((acc, item) => {
    if (!acc[item.name]) acc[item.name] = { name: item.name, qty: 0, total: 0 };
    acc[item.name].qty += item.quantity;
    acc[item.name].total += item.total;
    return acc;
  }, {});
  const topProducts = Object.values(productSales).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topMaxQty = Math.max(...topProducts.map(p => p.qty), 1);

  const newOrdersToday = orders.filter(o => o.createdAt.slice(0, 10) === todayStr && o.status === 'new').length;
  const pendingProcessing = orders.filter(o => o.status === 'processing').length;

  const days: { label: string; revenue: number; date: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const revenue = orders.filter(o => o.createdAt.slice(0, 10) === dateStr && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const label = d.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' });
    days.push({ label, revenue, date: dateStr });
  }
  const maxDailyRevenue = Math.max(...days.map(d => d.revenue), 1);

  const months: { label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - i);
    const mStr = d.toISOString().slice(0, 7);
    const revenue = orders.filter(o => o.createdAt.slice(0, 7) === mStr && o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
    const label = d.toLocaleDateString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: '2-digit' });
    months.push({ label, revenue });
  }
  const maxMonthlyRevenue = Math.max(...months.map(m => m.revenue), 1);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(
      language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  const getStatusLabel = (status: string) => statusLabelMap[status]?.[language] || status;

  const fmt = (n: number) => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : n > 0 ? String(n) : '';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {t({ ar: 'نظرة عامة', fr: 'Aperçu du tableau de bord', en: 'Dashboard Overview' })}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {t({ ar: 'ملخص أداء المتجر', fr: 'Résumé des performances', en: 'Store performance summary' })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-white/40">
          <Clock className="w-4 h-4" />
          <span>{formatDate(now.toISOString())}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-white/70">{t({ ar: 'الإيرادات', fr: 'Revenus', en: 'Revenue' })}</span>
            {todayRevenue !== yesterdayRevenue && (
              <span className={`flex items-center text-xs ${todayRevenue > yesterdayRevenue ? 'text-emerald-400' : 'text-red-400'}`}>
                {todayRevenue > yesterdayRevenue ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">{t({ ar: 'اليوم', fr: "Aujourd'hui", en: 'Today' })}</span>
              <span className="font-semibold text-emerald-400">{todayRevenue.toLocaleString()} د.ج</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">{t({ ar: 'هذا الشهر', fr: 'Ce mois', en: 'This month' })}</span>
              <span className="font-semibold text-white">{monthRevenue.toLocaleString()} د.ج</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1.5 border-t border-white/10">
              <span className="text-white/50">{t({ ar: 'الإجمالي', fr: 'Total', en: 'All time' })}</span>
              <span className="font-bold text-emerald-300">{totalRevenue.toLocaleString()} د.ج</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-sm font-semibold text-white/70">{t({ ar: 'الطلبات', fr: 'Commandes', en: 'Orders' })}</span>
            {todayOrders !== yesterdayOrders && (
              <span className={`flex items-center text-xs ${todayOrders > yesterdayOrders ? 'text-emerald-400' : 'text-red-400'}`}>
                {todayOrders > yesterdayOrders ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">{t({ ar: 'اليوم', fr: "Aujourd'hui", en: 'Today' })}</span>
              <span className="font-semibold text-blue-400">{todayOrders}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">{t({ ar: 'هذا الشهر', fr: 'Ce mois', en: 'This month' })}</span>
              <span className="font-semibold text-white">{monthOrders}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-1.5 border-t border-white/10">
              <span className="text-white/50">{t({ ar: 'الإجمالي', fr: 'Total', en: 'All time' })}</span>
              <span className="font-bold text-blue-300">{totalOrders}</span>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-sm font-semibold text-white/70">{t({ ar: 'العملاء', fr: 'Clients', en: 'Customers' })}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">{t({ ar: 'أرقام فريدة', fr: 'Téléphones uniques', en: 'Unique phones' })}</span>
            <span className="text-2xl font-bold text-purple-400">{uniquePhones}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm font-semibold text-white/70">{t({ ar: 'المنتجات', fr: 'Produits', en: 'Products' })}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">{t({ ar: 'الإجمالي', fr: 'Total', en: 'Total' })}</span>
            <span className="text-2xl font-bold text-cyan-400">{totalProductCount}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800/80 p-5 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-sm font-semibold text-white/70">{t({ ar: 'على التخفيض', fr: 'En solde', en: 'On Sale' })}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">{t({ ar: 'المنتجات المخفضة', fr: 'Produits en solde', en: 'Sale items' })}</span>
            <span className="text-2xl font-bold text-rose-400">{onSaleCount}</span>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-300">{t({ ar: 'طلبات جديدة اليوم', fr: "Nouvelles commandes aujourd'hui", en: 'New orders today' })}</p>
            <p className="text-2xl font-bold text-blue-400">{newOrdersToday}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-300">{t({ ar: 'تتطلب المعالجة', fr: 'En attente de traitement', en: 'Needs processing' })}</p>
            <p className="text-2xl font-bold text-amber-400">{pendingProcessing}</p>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-300">{t({ ar: 'منتجات على التخفيض', fr: 'Produits en solde', en: 'Products on sale' })}</p>
            <p className="text-2xl font-bold text-rose-400">{onSaleCount}</p>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
        className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-white">{t({ ar: 'آخر الطلبات', fr: 'Dernières commandes', en: 'Recent Orders' })}</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-2 text-white/50 font-semibold">{t({ ar: 'المعرف', fr: 'ID', en: 'ID' })}</th>
                <th className="text-left py-3 px-2 text-white/50 font-semibold">{t({ ar: 'العميل', fr: 'Client', en: 'Customer' })}</th>
                <th className="text-left py-3 px-2 text-white/50 font-semibold">{t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}</th>
                <th className="text-right py-3 px-2 text-white/50 font-semibold">{t({ ar: 'المجموع', fr: 'Total', en: 'Total' })}</th>
                <th className="text-center py-3 px-2 text-white/50 font-semibold">{t({ ar: 'الحالة', fr: 'Statut', en: 'Status' })}</th>
                <th className="text-right py-3 px-2 text-white/50 font-semibold">{t({ ar: 'التاريخ', fr: 'Date', en: 'Date' })}</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-white/30">{t({ ar: 'لا توجد طلبات بعد', fr: 'Aucune commande', en: 'No orders yet' })}</td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-2 font-mono text-xs text-white/40">#{order.id.slice(0, 6)}</td>
                    <td className="py-3 px-2 font-medium text-white">{order.customer}</td>
                    <td className="py-3 px-2 text-white/60">{order.phone}</td>
                    <td className="py-3 px-2 text-right font-semibold text-emerald-400">{order.total.toLocaleString()} د.ج</td>
                    <td className="py-3 px-2 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusBadge[order.status]}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right text-xs text-white/40">{formatDate(order.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-white">{t({ ar: 'الأكثر مبيعاً', fr: 'Meilleures ventes', en: 'Top Selling Products' })}</h3>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">{t({ ar: 'لا توجد مبيعات بعد', fr: 'Aucune vente', en: 'No sales data yet' })}</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, idx) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
                      <span className="font-medium text-white truncate">{p.name}</span>
                    </div>
                    <span className="text-white/60 text-xs flex-shrink-0 ml-2">{p.qty} {t({ ar: 'وحدة', fr: 'unités', en: 'units' })}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.qty / topMaxQty) * 100}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-white">{t({ ar: 'المبيعات اليومية (7 أيام)', fr: 'Ventes quotidiennes (7 jours)', en: 'Daily Sales (7 days)' })}</h3>
            </div>
            {days.every(d => d.revenue === 0) ? (
              <p className="text-sm text-white/30 text-center py-8">{t({ ar: 'لا توجد بيانات', fr: 'Aucune donnée', en: 'No data' })}</p>
            ) : (
              <div className="flex items-end gap-2 h-32">
                {days.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] text-white/40 leading-none">{d.revenue > 0 ? fmt(d.revenue) : ''}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(d.revenue / maxDailyRevenue) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="w-full rounded-t-sm bg-gradient-to-t from-primary to-primary/30"
                    />
                    <span className="text-[10px] text-white/40 mt-1 leading-none">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}
            className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-white">{t({ ar: 'المبيعات الشهرية (6 أشهر)', fr: 'Ventes mensuelles (6 mois)', en: 'Monthly Sales (6 months)' })}</h3>
            </div>
            {months.every(m => m.revenue === 0) ? (
              <p className="text-sm text-white/30 text-center py-8">{t({ ar: 'لا توجد بيانات', fr: 'Aucune donnée', en: 'No data' })}</p>
            ) : (
              <div className="flex items-end gap-2 h-28">
                {months.map((m) => (
                  <div key={m.label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] text-white/40 leading-none">{m.revenue > 0 ? fmt(m.revenue) : ''}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(m.revenue / maxMonthlyRevenue) * 100}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500 to-emerald-400/30"
                    />
                    <span className="text-[10px] text-white/40 mt-1 leading-none">{m.label}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { getOrders } from '../utils/orderStorage';
import { Package, MapPin, Gift, LogOut, ChevronRight, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { LoginPage } from './LoginPage';

const statusIcons: Record<string, any> = {
  new: Clock, processing: Truck, completed: CheckCircle, cancelled: XCircle,
};

const statusColors: Record<string, string> = {
  new: 'text-blue-400 bg-blue-500/10',
  processing: 'text-amber-400 bg-amber-500/10',
  completed: 'text-emerald-400 bg-emerald-500/10',
  cancelled: 'text-red-400 bg-red-500/10',
};

export function AccountDashboard() {
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'orders' | 'addresses' | 'loyalty'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    api.orders.list().then(all => setOrders(all.filter((o: any) => o.email === user.email))).catch(() => setOrders(getOrders().filter(o => o.email === user.email)));
    if (user.phone) api.loyalty.get(user.phone).then(setLoyalty).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <section className="py-20 min-h-screen bg-gradient-to-b from-slate-50/80 to-white/70 dark:from-slate-900/30 dark:to-slate-950/70">
        <div className="max-w-md mx-auto px-4 text-center">
          <LoginPage onClose={() => {}} standalone />
        </div>
      </section>
    );
  }

  const tabs = [
    { id: 'orders', label: t({ ar: 'طلباتي', fr: 'Mes commandes', en: 'My Orders' }), icon: Package },
    { id: 'addresses', label: t({ ar: 'عناويني', fr: 'Mes adresses', en: 'My Addresses' }), icon: MapPin },
    { id: 'loyalty', label: t({ ar: 'نقاط الولاء', fr: 'Points fidélité', en: 'Loyalty Points' }), icon: Gift },
  ];

  return (
    <section className="py-16 min-h-screen bg-gradient-to-b from-slate-50/80 to-white/70 dark:from-slate-900/30 dark:to-slate-950/70" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">{t({ ar: 'مرحباً', fr: 'Bonjour', en: 'Hello' })} {user.name}</h1>
            <p className="text-sm text-white/50">{user.email}</p>
          </div>
          <button onClick={logout} className="flex items-center gap-2 rounded-full bg-red-500/10 text-red-400 px-5 py-2.5 text-sm font-semibold hover:bg-red-500/20 transition border border-red-500/20">
            <LogOut className="w-4 h-4" /> {t({ ar: 'تسجيل خروج', fr: 'Déconnexion', en: 'Logout' })}
          </button>
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map(tabItem => {
            const Icon = tabItem.icon;
            return (
              <button key={tabItem.id} onClick={() => setTab(tabItem.id as any)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all border whitespace-nowrap ${tab === tabItem.id ? 'bg-primary text-white border-primary' : 'bg-slate-800/60 text-white/70 border-white/10 hover:bg-slate-800'}`}>
                <Icon className="w-4 h-4" /> {tabItem.label}
              </button>
            );
          })}
        </div>

        {tab === 'orders' && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-16 text-white/40">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t({ ar: 'لا توجد طلبات بعد', fr: 'Aucune commande', en: 'No orders yet' })}</p>
              </div>
            ) : orders.map(order => {
              const StatusIcon = statusIcons[order.status] || Clock;
              return (
                <div key={order.id} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-white/40">#{order.id?.slice(0, 8)}</span>
                    <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${statusColors[order.status] || 'text-white/50 bg-white/5'}`}>
                      <StatusIcon className="w-3.5 h-3.5" /> {order.status}
                    </span>
                  </div>
                  <div className="text-sm text-white/80 mb-2">
                    {order.items?.map((item: any, i: number) => (
                      <span key={i}>{item.name || item.productName}{i < order.items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary font-bold">{Number(order.total).toLocaleString()} د.ج</span>
                    <span className="text-white/40 text-xs">{new Date(order.createdAt || order.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'addresses' && (
          <div className="text-center py-16 text-white/40">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t({ ar: 'العناوين المحفوظة', fr: 'Adresses enregistrées', en: 'Saved addresses' })}</p>
            <p className="text-sm mt-2 text-white/30">{t({ ar: 'ستتم إضافة العناوين عند الطلب', fr: 'Les adresses seront ajoutées lors de la commande', en: 'Addresses will be added during checkout' })}</p>
          </div>
        )}

        {tab === 'loyalty' && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
            <Gift className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <p className="text-4xl font-bold text-white mb-2">{loyalty?.points || 0}</p>
            <p className="text-sm text-white/60">{t({ ar: 'نقطة ولاء', fr: 'Points de fidélité', en: 'Loyalty points' })}</p>
            <p className="text-xs text-white/40 mt-3">{t({ ar: 'كل 100 د.ج = نقطة واحدة', fr: '100 DZD = 1 point', en: '100 DZD = 1 point' })}</p>
          </div>
        )}
      </div>
    </section>
  );
}

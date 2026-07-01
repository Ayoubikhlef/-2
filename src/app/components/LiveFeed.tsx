import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Bell, Activity } from 'lucide-react';

const WS_URL = 'http://localhost:3001';

interface LiveOrder {
  id: string;
  customer: string;
  phone: string;
  total: number;
  status: string;
  createdAt: string;
}

export function LiveFeed() {
  const { t, language } = useLanguage();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<LiveOrder[]>([]);
  const [liveCount, setLiveCount] = useState(0);

  useEffect(() => {
    const s = io(WS_URL);
    setSocket(s);

    s.on('connect', () => {
      s.emit('join-admin');
    });

    s.on('new-order', (order: LiveOrder) => {
      setNotifications(prev => [order, ...prev].slice(0, 5));
      setLiveCount(prev => prev + 1);
      setTimeout(() => setLiveCount(prev => Math.max(0, prev - 1)), 5000);
    });

    return () => { s.disconnect(); };
  }, []);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">{t({ ar: 'النشاط المباشر', fr: 'Activité en direct', en: 'Live Activity' })}</h3>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-white/50">
          <span className={`w-2 h-2 rounded-full ${socket?.connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
          {socket?.connected
            ? t({ ar: 'متصل', fr: 'Connecté', en: 'Connected' })
            : t({ ar: 'غير متصل', fr: 'Déconnecté', en: 'Disconnected' })}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
          <p className="text-[10px] text-emerald-400/70">{t({ ar: 'المبيعات الحية', fr: 'Ventes en direct', en: 'Live Sales' })}</p>
          <p className="text-xl font-bold text-emerald-400">{liveCount}</p>
        </div>
        <div className="flex-1 rounded-xl bg-blue-500/10 border border-blue-500/20 p-3">
          <p className="text-[10px] text-blue-400/70">{t({ ar: 'الإشعارات', fr: 'Notifications', en: 'Notifications' })}</p>
          <p className="text-xl font-bold text-blue-400">{notifications.length}</p>
        </div>
      </div>

      <AnimatePresence>
        {notifications.length === 0 ? (
          <div className="text-center py-6">
            <ShoppingCart className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/30">{t({ ar: 'بانتظار الطلبات...', fr: 'En attente de commandes...', en: 'Waiting for orders...' })}</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notifications.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{order.customer}</p>
                  <p className="text-[10px] text-white/40">{order.phone}</p>
                </div>
                <span className="text-sm font-bold text-emerald-400">{order.total.toLocaleString()} د.ج</span>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

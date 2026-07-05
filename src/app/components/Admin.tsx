import { useEffect, useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrders, clearOrders, updateOrderStatus, removeOrder, getOrderStats, loadOrdersFromServer, OrderRecord, OrderStatus } from '../utils/orderStorage';
import { getStoredProducts, initializeProducts } from '../utils/productStorage';
import { products as defaultProducts, type Product } from '../data/products';
import { ManageProductsTab } from './ManageProductsTab';
import { ManageServicesTab } from './ManageServicesTab';
import { AdminDashboard } from './AdminDashboard';
import { LiveFeed } from './LiveFeed';
import { CustomersTab } from './CustomersTab';
import { CouponsTab } from './CouponsTab';
import { ManageContentTab } from './ManageContentTab';
import { SiteSettingsTab } from './SiteSettingsTab';
import { ReviewsTab } from './ReviewsTab';
import { NewsletterTab } from './NewsletterTab';
import { getStoredServices, initializeServices } from '../utils/serviceStorage';
import { defaultServices, type ServiceCategory } from '../data/services';
import { RefreshCw, Trash2, ChevronDown, Phone, MapPin, Mail, DollarSign, Package, Eye, Lightbulb, Wrench, FileText, Globe, Settings, Star, MailOpen } from 'lucide-react';
import { generateInvoice } from './InvoicePDF';
import { toast } from 'sonner';
import { isMaintenanceMode, setMaintenanceMode, getMaintenanceMessage, setMaintenanceMessage } from '../utils/maintenanceStorage';
import { motion, AnimatePresence } from 'motion/react';

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME || 'hydra';
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'hydra';

const statusConfig: Record<OrderStatus, { label: Record<string, string>; color: string; icon: string }> = {
  new: {
    label: { ar: 'جديد', fr: 'Nouveau', en: 'New' },
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    icon: '●',
  },
  processing: {
    label: { ar: 'قيد المعالجة', fr: 'En cours', en: 'Processing' },
    color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    icon: '◐',
  },
  completed: {
    label: { ar: 'مكتمل', fr: 'Terminé', en: 'Completed' },
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    icon: '✓',
  },
  cancelled: {
    label: { ar: 'ملغي', fr: 'Annulé', en: 'Cancelled' },
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: '✕',
  },
};

type FilterMode = 'all' | OrderStatus;

const neumorphic: React.CSSProperties = {
  background: '#e0e5ec',
  borderRadius: 20,
  boxShadow: '10px 10px 20px #a3b1c6, -10px -10px 20px #ffffff',
};

const neumorphicInset: React.CSSProperties = {
  background: '#e0e5ec',
  borderRadius: 20,
  boxShadow: 'inset 10px 10px 20px #a3b1c6, inset -10px -10px 20px #ffffff',
};

const neumorphicCard: React.CSSProperties = {
  ...neumorphic,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 30,
  textAlign: 'center',
};

const darkCard: React.CSSProperties = {
  background: '#0F172A',
  borderRadius: 20,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 30,
  textAlign: 'center',
  boxShadow: '0 0 40px rgba(59,130,246,0.15), 0 0 80px rgba(59,130,246,0.05)',
  border: '1px solid rgba(59,130,246,0.1)',
};

const darkInput: React.CSSProperties = {
  background: '#1e293b',
  borderRadius: 20,
  boxShadow: 'inset 4px 4px 8px #0f172a, inset -4px -4px 8px #2d3a4c',
  width: '100%',
  padding: '14px 18px',
  fontSize: 15,
  color: '#e2e8f0',
  border: 'none',
  outline: 'none',
  fontFamily: 'inherit',
};

const darkButton: React.CSSProperties = {
  background: '#1e293b',
  borderRadius: 20,
  boxShadow: '4px 4px 8px #0f172a, -4px -4px 8px #2d3a4c',
  padding: '14px 40px',
  fontSize: 15,
  fontWeight: 700,
  color: '#e2e8f0',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
};

export function Admin() {
  const { t, language } = useLanguage();
  const [showAdmin, setShowAdmin] = useState(() => window.location.hash === '#admin');
  const [isAuthenticated, setIsAuthenticated] = useState(() => sessionStorage.getItem('admin_auth') === 'true');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isOn, setIsOn] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tab, setTab] = useState<'dashboard' | 'products' | 'services' | 'manage-products' | 'manage-services' | 'customers' | 'coupons' | 'content' | 'settings' | 'reviews' | 'newsletter'>('dashboard');
  const [manageProducts, setManageProducts] = useState<Product[]>([]);
  const [manageServices, setManageServices] = useState<ServiceCategory[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      initializeProducts(defaultProducts);
      setManageProducts(getStoredProducts(defaultProducts));
      initializeServices(defaultServices);
      setManageServices(getStoredServices(defaultServices));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const onHashChange = () => setShowAdmin(window.location.hash === '#admin');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError(false);
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_auth');
  };

  const toggleLamp = () => {
    const next = !isOn;
    setIsOn(next);
    document.documentElement.style.setProperty('--on', next ? '1' : '0');
    document.body.setAttribute('data-on', String(next));
  };

  const loadOrders = useCallback(async () => {
    setOrders(await loadOrdersFromServer());
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadOrders();
      setManageProducts(getStoredProducts(defaultProducts));
      setManageServices(getStoredServices(defaultServices));
      api.syncProducts(getStoredProducts(defaultProducts))
        .then(() => console.log('[Sync] Products synced to server'))
        .catch(() => {});
      api.data.save('aos_services', getStoredServices(defaultServices))
        .then(() => console.log('[Sync] Services synced to server'))
        .catch(() => {});
      window.dispatchEvent(new CustomEvent('aos:data-changed'));
      toast.success(
        t({ ar: 'تم تحديث جميع البيانات', fr: 'Toutes les données actualisées', en: 'All data refreshed' })
      );
    } catch (error) {
      toast.error(
        t({ ar: 'فشل التحديث', fr: 'Échec de la mise à jour', en: 'Failed to refresh' })
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [loadOrders, t]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders();
    setManageProducts(getStoredProducts(defaultProducts));
    setManageServices(getStoredServices(defaultServices));
    const interval = setInterval(loadOrders, 5000);
    const onChanged = () => {
      setManageProducts(getStoredProducts(defaultProducts));
      setManageServices(getStoredServices(defaultServices));
    };
    window.addEventListener('aos:data-changed', onChanged);
    return () => {
      clearInterval(interval);
      window.removeEventListener('aos:data-changed', onChanged);
    };
  }, [isAuthenticated, loadOrders]);

  const handleStatusChange = (id: string, status: OrderStatus) => {
    updateOrderStatus(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    setOpenDropdown(null);
    toast.success(
      t({
        ar: 'تم تحديث حالة الطلب',
        fr: 'Statut de la commande mis à jour',
        en: 'Order status updated',
      })
    );
  };

  const handleDeleteOrder = (id: string) => {
    removeOrder(id);
    setOrders(prev => prev.filter(o => o.id !== id));
    toast.success(
      t({ ar: 'تم حذف الطلب', fr: 'Commande supprimée', en: 'Order deleted' })
    );
  };

  const handleClear = () => {
    clearOrders();
    setOrders([]);
    toast.success(
      t({ ar: 'تم مسح جميع الطلبات', fr: 'Toutes les commandes effacées', en: 'All orders cleared' })
    );
  };

  const productOrders = orders.filter((o) => o.source !== 'service-booking');
  const serviceOrders = orders.filter((o) => o.source === 'service-booking');
  const visibleOrders = tab === 'products' ? productOrders : serviceOrders;
  const stats = getOrderStats(visibleOrders);

  const filteredOrders = filter === 'all'
    ? visibleOrders
    : visibleOrders.filter((o) => o.status === filter);

  const statCards = [
    {
      key: 'total',
      value: stats.total,
      label: t({ ar: 'الكل', fr: 'Total', en: 'Total' }),
      color: 'from-slate-600 to-slate-700',
      icon: Package,
    },
    {
      key: 'pending',
      value: stats.pending,
      label: t({ ar: 'جديد', fr: 'Nouveau', en: 'New' }),
      color: 'from-blue-600 to-blue-700',
      icon: Eye,
    },
    {
      key: 'processing',
      value: stats.processing,
      label: t({ ar: 'قيد المعالجة', fr: 'En cours', en: 'Processing' }),
      color: 'from-amber-600 to-amber-700',
      icon: RefreshCw,
    },
    {
      key: 'completed',
      value: stats.completed,
      label: t({ ar: 'مكتمل', fr: 'Terminé', en: 'Completed' }),
      color: 'from-emerald-600 to-emerald-700',
      icon: DollarSign,
    },
    {
      key: 'revenue',
      value: stats.revenue.toLocaleString(),
      label: t({ ar: 'الإيرادات (د.ج)', fr: 'Revenu (DZD)', en: 'Revenue (DZD)' }),
      color: 'from-purple-600 to-purple-700',
      icon: DollarSign,
    },
  ];

  const filters: { key: FilterMode; label: Record<string, string> }[] = [
    { key: 'all', label: { ar: 'الكل', fr: 'Tous', en: 'All' } },
    { key: 'new', label: { ar: 'جديد', fr: 'Nouveau', en: 'New' } },
    { key: 'processing', label: { ar: 'قيد المعالجة', fr: 'En cours', en: 'Processing' } },
    { key: 'completed', label: { ar: 'مكتمل', fr: 'Terminé', en: 'Completed' } },
    { key: 'cancelled', label: { ar: 'ملغي', fr: 'Annulé', en: 'Cancelled' } },
  ];

  if (!showAdmin && !isAuthenticated) return null;

  if (!isAuthenticated) {
    return (
      <section
        id="admin"
        className="min-h-screen flex items-center justify-center"
        style={{ background: isOn ? '#0B1120' : '#e0e5ec', transition: 'background 0.6s' }}
      >
        <div className="flex flex-col items-center text-center" style={{
          ...(isOn ? darkCard : neumorphicCard),
          width: 320,
          transition: 'background 0.6s, box-shadow 0.6s',
        }}>
          <div className="flex items-center gap-3 mb-6">
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: isOn ? '#f1f5f9' : '#2d3436' }}>
              {t({ ar: 'دخول الأدمين', fr: 'Connexion Admin', en: 'Login' })}
            </h1>
            <button
              type="button"
              onClick={toggleLamp}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer"
              style={{
                background: isOn ? '#fbbf24' : '#e0e5ec',
                boxShadow: isOn
                  ? '0 0 20px rgba(251,191,36,0.5), 0 0 40px rgba(251,191,36,0.2)'
                  : '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff',
              }}
            >
              <Lightbulb
                className="w-5 h-5 transition-all duration-300"
                style={{ color: isOn ? '#1e293b' : '#64748b', fill: isOn ? '#fbbf24' : 'none' }}
              />
            </button>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col items-center gap-4 w-full">
            <input
              type="text"
              placeholder={t({ ar: 'اسم المستخدم', fr: 'Nom d\'utilisateur', en: 'Username' })}
              value={username}
              onChange={(e) => { setUsername(e.target.value); setLoginError(false); }}
              style={isOn ? darkInput : {
                ...neumorphicInset,
                width: '100%',
                padding: '14px 18px',
                fontSize: 15,
                color: '#2d3436',
                border: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
              autoFocus
            />
            <input
              type="password"
              placeholder={t({ ar: 'كلمة المرور', fr: 'Mot de passe', en: 'Password' })}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setLoginError(false); }}
              style={isOn ? darkInput : {
                ...neumorphicInset,
                width: '100%',
                padding: '14px 18px',
                fontSize: 15,
                color: '#2d3436',
                border: 'none',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            {loginError && (
              <p className="text-sm" style={{ color: '#ef4444' }}>
                {t({ ar: 'اسم مستخدم أو كلمة مرور خاطئة', fr: 'Nom d\'utilisateur ou mot de passe incorrect', en: 'Invalid username or password' })}
              </p>
            )}
            <button
              type="submit"
              style={isOn ? darkButton : {
                ...neumorphic,
                padding: '14px 40px',
                fontSize: 15,
                fontWeight: 700,
                color: '#2d3436',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {t({ ar: 'دخول', fr: 'Connexion', en: 'Sign In' })}
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section id="admin" className="py-20 bg-slate-950/90 backdrop-blur-sm text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm uppercase tracking-[0.35em] text-primary font-semibold">
              {t({ ar: 'لوحة الأدمين', fr: 'Tableau d\'administration', en: 'Admin Dashboard' })}
            </p>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full bg-red-500/20 text-red-400 px-5 py-2.5 text-sm font-semibold hover:bg-red-500/30 transition-all"
            >
              {t({ ar: 'تسجيل الخروج', fr: 'Déconnexion', en: 'Logout' })}
            </button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2>
                {t({ ar: 'إدارة الطلبات', fr: 'Gestion des commandes', en: 'Order Management' })}
              </h2>
              <p className="text-muted-foreground mt-1">
                {t({
                  ar: 'استعرض وقم بإدارة طلبات العملاء',
                  fr: 'Consultez et gérez les commandes clients',
                  en: 'View and manage customer orders',
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-5 py-3 text-sm font-semibold hover:bg-slate-800 transition-all disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing
                  ? t({ ar: 'جاري التحديث...', fr: 'Actualisation...', en: 'Refreshing...' })
                  : t({ ar: 'تحديث', fr: 'Actualiser', en: 'Refresh' })}
              </button>
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-2 rounded-full bg-red-500/20 text-red-400 px-5 py-3 text-sm font-semibold hover:bg-red-500/30 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                {t({ ar: 'مسح الكل', fr: 'Tout effacer', en: 'Clear all' })}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {statCards.map((card) => (
            <div
              key={card.key}
              className={`rounded-2xl bg-gradient-to-br ${card.color} p-5 shadow-lg border border-white/10`}
            >
              <card.icon className="w-5 h-5 text-white/60 mb-2" />
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs text-white/70 mt-1">{card.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs: Products / Services */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setTab('products'); setFilter('all'); }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'products'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: '🛒 طلبات المنتجات', fr: '🛒 Commandes produits', en: '🛒 Product Orders' })}
          </button>
          <button
            onClick={() => { setTab('services'); setFilter('all'); }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'services'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: '📅 حجوزات الخدمات', fr: '📅 Réservations services', en: '📅 Service Bookings' })}
          </button>
          <button
            onClick={() => setTab('manage-products')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'manage-products'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: '⚙️ إدارة المنتجات', fr: '⚙️ Gérer produits', en: '⚙️ Manage Products' })}
          </button>
          <button
            onClick={() => setTab('manage-services')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'manage-services'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: '🛠️ إدارة الخدمات', fr: '🛠️ Gérer services', en: '🛠️ Manage Services' })}
          </button>
          <button
            onClick={() => setTab('customers')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'customers'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: '👥 العملاء', fr: '👥 Clients', en: '👥 Customers' })}
          </button>
          <button
            onClick={() => setTab('coupons')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'coupons'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: '🎁 أكواد الخصم', fr: '🎁 Coupons', en: '🎁 Coupons' })}
          </button>
          <button
            onClick={() => setTab('content')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'content'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: '📝 المحتوى', fr: '📝 Contenu', en: '📝 Content' })}
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'settings'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: '⚙️ الإعدادات', fr: '⚙️ Paramètres', en: '⚙️ Settings' })}
          </button>
          <button
            onClick={() => setTab('reviews')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'reviews'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: '⭐ التقييمات', fr: '⭐ Avis', en: '⭐ Reviews' })}
          </button>
          <button
            onClick={() => setTab('newsletter')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'newsletter'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: '📬 النشرة', fr: '📬 Newsletter', en: '📬 Newsletter' })}
          </button>
          <button
            onClick={() => setTab('dashboard')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'dashboard'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: '📊 الإحصائيات', fr: '📊 Statistiques', en: '📊 Dashboard' })}
          </button>
        </div>

        {/* Manage Products */}
        {tab === 'manage-products' ? (
          <ManageProductsTab
            products={manageProducts}
            onUpdate={() => {
              setManageProducts(getStoredProducts(defaultProducts));
            }}
          />
        ) : tab === 'manage-services' ? (
          <ManageServicesTab
            services={manageServices}
            onUpdate={() => {
              setManageServices(getStoredServices(defaultServices));
            }}
          />
        ) : tab === 'dashboard' ? (
          <>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Wrench className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{t({ ar: 'وضع الصيانة', fr: 'Mode maintenance', en: 'Maintenance Mode' })}</p>
                    <p className="text-[10px] text-white/40">{t({ ar: 'منع الوصول العام', fr: 'Empêcher l\'accès public', en: 'Prevent public access' })}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const next = !isMaintenanceMode();
                    setMaintenanceMode(next);
                    window.dispatchEvent(new CustomEvent('aos:data-changed'));
                  }}
                  className={`relative w-12 h-6 rounded-full transition-all cursor-pointer ${isMaintenanceMode() ? 'bg-amber-500' : 'bg-slate-700'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all ${isMaintenanceMode() ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-white/40">{t({ ar: 'رسالة الصيانة (اختياري)', fr: 'Message de maintenance (optionnel)', en: 'Maintenance message (optional)' })}</p>
                <div className="flex gap-2">
                  {(['ar', 'fr', 'en'] as const).map(lang => {
                    const msg = getMaintenanceMessage();
                    return (
                      <input
                        key={lang}
                        value={(msg as any)[lang] || ''}
                        onChange={(e) => {
                          const current = getMaintenanceMessage();
                          setMaintenanceMessage({ ...current, [lang]: e.target.value });
                        }}
                        placeholder={lang === 'ar' ? 'عربي' : lang === 'fr' ? 'Français' : 'English'}
                        className="flex-1 rounded-lg bg-slate-800 border border-white/10 px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-amber-500/50 transition-all"
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <button onClick={() => setTab('manage-products')}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 hover:bg-slate-800/80 transition-all text-white text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t({ ar: 'إضافة منتج', fr: 'Ajouter produit', en: 'Add Product' })}</p>
                  <p className="text-[10px] text-white/40">{t({ ar: 'منتج جديد', fr: 'Nouveau produit', en: 'New product' })}</p>
                </div>
              </button>
              <button onClick={() => setTab('manage-services')}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 hover:bg-slate-800/80 transition-all text-white text-left">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t({ ar: 'إدارة الخدمات', fr: 'Gérer services', en: 'Manage Services' })}</p>
                  <p className="text-[10px] text-white/40">{t({ ar: 'تعديل الخدمات', fr: 'Modifier services', en: 'Edit services' })}</p>
                </div>
              </button>
              <button onClick={() => setTab('coupons')}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 hover:bg-slate-800/80 transition-all text-white text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">{t({ ar: 'كود خصم', fr: 'Code promo', en: 'Add Coupon' })}</p>
                  <p className="text-[10px] text-white/40">{t({ ar: 'خصم جديد', fr: 'Nouveau code', en: 'New coupon' })}</p>
                </div>
              </button>
              <button onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 hover:bg-slate-800/80 transition-all text-white text-left disabled:cursor-not-allowed disabled:opacity-60">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                  <RefreshCw className={`w-5 h-5 text-rose-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </div>
                <div>
                  <p className="text-sm font-bold">{t({ ar: 'تحديث', fr: 'Actualiser', en: 'Refresh' })}</p>
                  <p className="text-[10px] text-white/40">{t({ ar: 'تحديث الطلبات الجديدة', fr: 'Actualiser les nouvelles commandes', en: 'Refresh new orders' })}</p>
                </div>
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
              <AdminDashboard />
              <LiveFeed />
            </div>
          </>
        ) : tab === 'customers' ? (
          <CustomersTab />
        ) : tab === 'coupons' ? (
          <CouponsTab />
        ) : tab === 'content' ? (
          <ManageContentTab />
        ) : tab === 'settings' ? (
          <SiteSettingsTab />
        ) : tab === 'reviews' ? (
          <ReviewsTab />
        ) : tab === 'newsletter' ? (
          <NewsletterTab />
        ) : (
        /* Orders */
        filteredOrders.length === 0 ? (
          <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-16 text-center">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">
              {tab === 'services'
                  ? t({ ar: 'لا توجد حجوزات خدمات حالياً.', fr: 'Aucune réservation de service pour le moment.', en: 'No service bookings yet.' })
                  : filter === 'all'
                  ? t({ ar: 'لا توجد طلبات حالياً.', fr: 'Aucune commande pour le moment.', en: 'No orders yet.' })
                  : t({ ar: 'لا توجد طلبات بهذه الحالة.', fr: 'Aucune commande dans cet état.', en: 'No orders with this status.' })}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredOrders.map((order) => (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`rounded-[32px] border p-6 shadow-lg transition-all ${
                    order.status === 'new'
                      ? 'border-blue-500/30 bg-slate-900/90'
                      : 'border-white/10 bg-slate-900/80'
                  }`}
                >
                  {/* Order Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[order.status].color}`}>
                          <span>{statusConfig[order.status].icon}</span>
                          {statusConfig[order.status].label[language]}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleString(language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US')}
                        </span>
                        <span className="text-xs text-muted-foreground/50">
                          #{order.id.slice(0, 6)}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mt-2">{order.customer}</h3>
                      <p className="text-sm text-muted-foreground">
                        {order.source === 'form'
                          ? t({ ar: 'طلب عبر نموذج السلة', fr: 'Commande via formulaire', en: 'Order via checkout form' })
                          : order.source === 'service-booking'
                          ? t({ ar: '📅 حجز خدمة مكتبية', fr: '📅 Réservation service', en: '📅 Office service booking' })
                          : t({ ar: 'طلب سريع من صفحة المنتج', fr: 'Commande rapide produit', en: 'Quick product order' })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {t({ ar: 'المجموع', fr: 'Total', en: 'Total' })}
                        </p>
                        <p className="text-2xl font-bold text-primary">{(Number(order.total) || 0).toLocaleString()} د.ج</p>
                      </div>

                      {/* Status Dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === order.id ? null : order.id)}
                          className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-white/10"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {openDropdown === order.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)} />
                            <div className="absolute right-0 top-full mt-2 z-20 w-48 rounded-xl bg-slate-800 border border-white/10 shadow-2xl overflow-hidden">
                              {(Object.entries(statusConfig) as [OrderStatus, typeof statusConfig[OrderStatus]][]).map(([key, cfg]) => (
                                <button
                                  key={key}
                                  onClick={() => handleStatusChange(order.id, key)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-slate-700 ${
                                    order.status === key ? 'bg-slate-700/50' : ''
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${
                                    key === 'new' ? 'bg-blue-400' :
                                    key === 'processing' ? 'bg-amber-400' :
                                    key === 'completed' ? 'bg-emerald-400' : 'bg-red-400'
                                  }`} />
                                  {cfg.label[language]}
                                  {order.status === key && (
                                    <span className="ml-auto text-xs text-muted-foreground">✓</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Invoice */}
                      <button
                        onClick={async () => {
                          try {
                            await generateInvoice(order, language);
                          } catch (err) {
                            console.error('Invoice generation failed:', err);
                            toast.error(t({ ar: 'فشل تحميل الفاتورة', fr: 'Échec du téléchargement', en: 'Failed to download invoice' }));
                          }
                        }}
                        className="p-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition-all border border-emerald-500/20"
                        title={t({ ar: 'تحميل الفاتورة', fr: 'Télécharger la facture', en: 'Download Invoice' })}
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-3 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all border border-red-500/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Expand/Collapse */}
                      <button
                        onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                        className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-white/10"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === order.id ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === order.id && (
                    <div className="overflow-hidden mt-6 pt-6 border-t border-white/10">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl bg-slate-800/50 p-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <Phone className="w-4 h-4" />
                                {t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}
                              </div>
                              <p className="font-medium">{order.phone}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 mb-2">
                                <Mail className="w-4 h-4" />
                                {t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}
                              </div>
                              <p className="font-medium">{order.email || '-'}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-800/50 p-4">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                <MapPin className="w-4 h-4" />
                                {t({ ar: 'الولاية', fr: 'Wilaya', en: 'Wilaya' })}
                              </div>
                              <p className="font-medium">{order.wilaya}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-3 mb-2">
                                <MapPin className="w-4 h-4" />
                                {t({ ar: 'البلدية', fr: 'Commune', en: 'Municipality' })}
                              </div>
                              <p className="font-medium">{order.municipality}</p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-2xl bg-slate-800/50 p-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <MapPin className="w-4 h-4" />
                              {t({ ar: 'العنوان الكامل', fr: 'Adresse complète', en: 'Full address' })}
                            </div>
                            <p className="font-medium">{order.address}</p>
                          </div>

                          {order.note && (
                            <div className="mt-4 rounded-2xl bg-slate-800/50 p-4">
                              <p className="text-sm text-muted-foreground mb-2">
                                {t({ ar: 'ملاحظات العميل', fr: 'Notes client', en: 'Customer notes' })}
                              </p>
                              <p className="font-medium">{order.note}</p>
                            </div>
                          )}

                          <div className="mt-4 rounded-2xl bg-slate-800/50 p-4">
                            <p className="text-sm text-muted-foreground mb-3">
                              {t({ ar: 'المنتجات', fr: 'Produits', en: 'Items' })}
                            </p>
                            <div className="space-y-2">
                              {Array.isArray(order.items) ? order.items.map((item, index) => {
                                const price = Number(item.price) || 0;
                                const total = Number(item.total) || 0;
                                return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between rounded-xl bg-slate-900/50 px-4 py-3"
                                >
                                  <div>
                                    <p className="font-medium">{item.name || ''}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {item.quantity || 0} × {price.toLocaleString()} د.ج
                                    </p>
                                  </div>
                                  <p className="font-semibold">{total.toLocaleString()} د.ج</p>
                                </div>
                              )}) : (
                                <p className="text-sm text-muted-foreground">{t({ ar: 'لا توجد منتجات', fr: 'Aucun produit', en: 'No items' })}</p>
                              )}
                            </div>
                          </div>

                          {/* Contact actions */}
                          <div className="mt-4 flex gap-3">
                            <a
                              href={`tel:${order.phone}`}
                              className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500/30 transition-all"
                            >
                              <Phone className="w-4 h-4" />
                              {t({ ar: 'اتصال', fr: 'Appeler', en: 'Call' })}
                            </a>
                            <a
                              href={`https://wa.me/${order.phone.startsWith('+') ? order.phone : '213' + order.phone.slice(order.phone.startsWith('0') ? 1 : 0)}?text=${encodeURIComponent(t({ ar: 'مرحباً، بخصوص طلبك من Ayoub Office Services', fr: 'Bonjour, concerne votre commande chez Ayoub Office Services', en: 'Hello, regarding your order from Ayoub Office Services' }))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 px-5 py-2.5 text-sm font-semibold hover:bg-emerald-500/30 transition-all"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                              WhatsApp
                            </a>
                          </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )
      )}
      </div>
    </section>
  );
}

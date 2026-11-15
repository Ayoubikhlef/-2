import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrders, clearOrders, updateOrderStatus, removeOrder, getOrderStats, loadOrdersFromServer, pushUnsyncedOrders, OrderRecord, OrderStatus } from '../utils/orderStorage';
import { getStoredProducts, initializeProducts, pullProductsFromServer } from '../utils/productStorage';
import { products as defaultProducts, type Product } from '../data/products';
import { getStoredServices, initializeServices } from '../utils/serviceStorage';
import { defaultServices, type ServiceCategory } from '../data/services';
import { RefreshCw, Trash2, ChevronDown, Phone, MapPin, Mail, DollarSign, Package, Eye, EyeOff, Lock, Lightbulb, Wrench, FileText, Globe, Settings, Star, MailOpen, Download, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { isMaintenanceMode, setMaintenanceMode, getMaintenanceMessage, setMaintenanceMessage } from '../utils/maintenanceStorage';
import { syncAllFromServer, getSyncStatus, getLastSyncTime } from '../utils/globalSync';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { brand } from '../config/brand';

const ManageProductsTab = lazy(() => import('./ManageProductsTab').then(m => ({ default: m.ManageProductsTab })));
const ManageServicesTab = lazy(() => import('./ManageServicesTab').then(m => ({ default: m.ManageServicesTab })));
const AdminDashboard = lazy(() => import('./AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const LiveFeed = lazy(() => import('./LiveFeed').then(m => ({ default: m.LiveFeed })));
const CustomersTab = lazy(() => import('./CustomersTab').then(m => ({ default: m.CustomersTab })));
const CouponsTab = lazy(() => import('./CouponsTab').then(m => ({ default: m.CouponsTab })));
const ManageContentTab = lazy(() => import('./ManageContentTab').then(m => ({ default: m.ManageContentTab })));
const SiteSettingsTab = lazy(() => import('./SiteSettingsTab').then(m => ({ default: m.SiteSettingsTab })));
const ReviewsTab = lazy(() => import('./ReviewsTab').then(m => ({ default: m.ReviewsTab })));
const NewsletterTab = lazy(() => import('./NewsletterTab').then(m => ({ default: m.NewsletterTab })));
const MessagesTab = lazy(() => import('./MessagesTab').then(m => ({ default: m.MessagesTab })));
const SecurityTab = lazy(() => import('./SecurityTab').then(m => ({ default: m.SecurityTab })));
const SiteFactoryTab = lazy(() => import('./SiteFactoryTab').then(m => ({ default: m.SiteFactoryTab })));

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

function TabLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-amber-500 animate-spin" />
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce delay-100" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce delay-200" />
        </div>
      </div>
    </div>
  );
}

export function Admin() {
  const { t, language } = useLanguage();
  const { user, isAdmin, login, logout, startTwoFactorSetup, confirmTwoFactorSetup } = useAuth();
  const [showAdmin, setShowAdmin] = useState(() => window.location.hash === '#hqpanel');
  const [isAuthenticated, setIsAuthenticated] = useState(!!user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginStep, setLoginStep] = useState<'credentials' | 'code' | 'enroll' | 'backup'>('credentials');
  const [challengeToken, setChallengeToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUrl: string; account: string } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tab, setTab] = useState<'dashboard' | 'orders' | 'products' | 'services' | 'manage-products' | 'manage-services' | 'customers' | 'coupons' | 'content' | 'settings' | 'reviews' | 'newsletter' | 'messages' | 'security' | 'factory'>('orders');
  const [manageProducts, setManageProducts] = useState<Product[]>([]);
  const [manageServices, setManageServices] = useState<ServiceCategory[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>(getSyncStatus());
  const [lastSyncTime, setLastSyncTime] = useState<number>(getLastSyncTime());

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setSyncStatus(detail.status);
      setLastSyncTime(detail.lastSync);
    };
    window.addEventListener('aos:sync-status', handler);
    return () => window.removeEventListener('aos:sync-status', handler);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      initializeProducts(defaultProducts);
      setManageProducts(getStoredProducts(defaultProducts));
      // The store on the server is what the shop shows; pull it so the panel
      // never lists a stale/local-only copy of the catalogue.
      pullProductsFromServer(defaultProducts).then(setManageProducts).catch(() => {});
      initializeServices(defaultServices);
      setManageServices(getStoredServices(defaultServices));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const preload = () => {
      import('./AdminDashboard');
      import('./ManageProductsTab');
      import('./ManageServicesTab');
      import('./CouponsTab');
      import('./CustomersTab');
      import('./SecurityTab');
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload, { timeout: 6000 });
    } else {
      setTimeout(preload, 2000);
    }
  }, []);

  useEffect(() => {
    const onHashChange = () => setShowAdmin(window.location.hash === '#hqpanel');
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (showAdmin && !isAuthenticated && !isAdmin) {
      // Redirect to login or open login modal
      // For now, we just rely on the return statement below
    }
  }, [showAdmin, isAuthenticated, isAdmin]);

  const resetLoginFlow = () => {
    setLoginStep('credentials');
    setChallengeToken('');
    setTwoFactorCode('');
    setSetupData(null);
    setBackupCodes([]);
    setLoginError('');
  };

  const handleLogout = async () => {
    setIsAuthenticated(false);
    resetLoginFlow();
    await logout();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      if (loginStep === 'credentials') {
        const result = await login(email.trim(), password.trim());
        if (result.setupRequired && result.challengeToken) {
          const setup = await startTwoFactorSetup(result.challengeToken);
          setChallengeToken(result.challengeToken);
          setSetupData(setup);
          setLoginStep('enroll');
          return;
        }
        if (result.twoFactorRequired && result.challengeToken) {
          setChallengeToken(result.challengeToken);
          setLoginStep('code');
          return;
        }
        setIsAuthenticated(true);
        resetLoginFlow();
        toast.success(t({ ar: 'تم تسجيل الدخول بنجاح', fr: 'Connexion réussie', en: 'Login successful' }));
        return;
      }

      if (loginStep === 'code') {
        const result = await login(email.trim(), password.trim(), twoFactorCode.trim());
        if (result.user) {
          setIsAuthenticated(true);
          resetLoginFlow();
          toast.success(t({ ar: 'تم تسجيل الدخول بنجاح', fr: 'Connexion réussie', en: 'Login successful' }));
        }
        return;
      }

      if (loginStep === 'enroll') {
        const result = await confirmTwoFactorSetup(challengeToken, twoFactorCode.trim());
        setBackupCodes(result.backupCodes);
        setTwoFactorCode('');
        setLoginStep('backup');
        return;
      }

      // The recovery codes were displayed; the session already exists.
      setIsAuthenticated(true);
      resetLoginFlow();
      toast.success(
        t({
          ar: 'تم تفعيل التحقق بخطوتين وتسجيل الدخول',
          fr: 'Double authentification activée et connexion réussie',
          en: 'Two-factor authentication enabled and signed in',
        })
      );
    } catch (err: any) {
      setLoginError(err.message || t({ ar: 'بيانات الاعتماد غير صحيحة', fr: 'Identifiants incorrects', en: 'Invalid credentials' }));
    } finally {
      setLoginLoading(false);
    }
  };

  const loadOrders = useCallback(async () => {
    setOrders(getOrders());
    try {
      await pushUnsyncedOrders().catch(() => {});
      const serverOrders = await loadOrdersFromServer();
      setOrders(serverOrders);
    } catch {}
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Refresh is a pull: pushing the local copy here would let a stale
      // browser (or a fresh one seeded with the bundled demo catalogue)
      // overwrite everything the shop is actually selling.
      await syncAllFromServer();
      const serverOrders = await loadOrdersFromServer();
      setOrders(serverOrders);
      setManageProducts(await pullProductsFromServer(defaultProducts));
      setManageServices(getStoredServices(defaultServices));
      toast.success(t({ ar: 'تم تحديث جميع البيانات', fr: 'Toutes les données actualisées', en: 'All data refreshed' }));
    } catch (error) {
      toast.error(t({ ar: 'فشل التحديث', fr: 'Échec de la mise à jour', en: 'Failed to refresh' }));
    } finally {
      setIsRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadOrders();
    setManageProducts(getStoredProducts(defaultProducts));
    setManageServices(getStoredServices(defaultServices));
    const interval = setInterval(loadOrders, 60000);
    const onChanged = () => {
      setOrders(getOrders());
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

  const handleClear = async () => {
    await clearOrders();
    setOrders([]);
    toast.success(
      t({ ar: 'تم مسح جميع الطلبات', fr: 'Toutes les commandes effacées', en: 'All orders cleared' })
    );
  };

  const exportOrdersCsv = () => {
    if (filteredOrders.length === 0) {
      toast.error(t({ ar: 'لا توجد طلبات للتصدير', fr: 'Aucune commande à exporter', en: 'No orders to export' }));
      return;
    }

    const rows = filteredOrders.map((order) => ({
      [t({ ar: 'رقم الطلب', fr: 'N° commande', en: 'Order ID' })]: order.id,
      [t({ ar: 'التاريخ', fr: 'Date', en: 'Date' })]: new Date(order.createdAt).toLocaleString('en-CA'),
      [t({ ar: 'العميل', fr: 'Client', en: 'Customer' })]: order.customer,
      [t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })]: order.phone,
      [t({ ar: 'الولاية', fr: 'Wilaya', en: 'Wilaya' })]: order.wilaya,
      [t({ ar: 'البلدية', fr: 'Commune', en: 'Commune' })]: order.municipality,
      [t({ ar: 'العنوان', fr: 'Adresse', en: 'Address' })]: order.address,
      [t({ ar: 'المنتجات', fr: 'Produits', en: 'Items' })]: order.items.map((i) => `${i.name} x${i.quantity}`).join(' + '),
      [t({ ar: 'الإجمالي (د.ج)', fr: 'Total (DZD)', en: 'Total (DZD)' })]: Number(order.total) || 0,
      [t({ ar: 'الحالة', fr: 'Statut', en: 'Status' })]: statusConfig[order.status].label[language],
      [t({ ar: 'المصدر', fr: 'Source', en: 'Source' })]: order.source,
      [t({ ar: 'الدفع', fr: 'Paiement', en: 'Payment' })]: order.paymentMethod || 'cod',
      [t({ ar: 'ملاحظات', fr: 'Notes', en: 'Notes' })]: order.note || '',
    }));

    // CSV keeps the export dependency-free: the xlsx package has no fixed
    // release for its known denial-of-service/prototype issues.
    const headers = Object.keys(rows[0]);
    const escapeCell = (value: unknown) => {
      const text = String(value ?? '');
      return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const lines = [
      headers.map(escapeCell).join(','),
      ...rows.map((row) =>
        headers.map((header) => escapeCell((row as Record<string, unknown>)[header])).join(',')
      ),
    ];
    // The BOM makes Excel read the Arabic text as UTF-8.
    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success(t({ ar: 'تم تصدير ملف CSV', fr: 'Fichier CSV exporté', en: 'CSV file exported' }));
  };

  const productOrders = orders.filter((o) => o.source !== 'service-booking');
  const serviceOrders = orders.filter((o) => o.source === 'service-booking');
  const visibleOrders = tab === 'orders' ? orders : tab === 'products' ? productOrders : serviceOrders;
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

  if (showAdmin && !isAuthenticated) {
    return (
      <section id="admin" className="relative min-h-screen overflow-hidden bg-[#eef5ff] px-4 py-10 sm:px-6 lg:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-[420px] w-[420px] rounded-full bg-[#8ec4ff]/45 blur-[110px]" />
          <div className="absolute -bottom-32 -right-24 h-[460px] w-[460px] rounded-full bg-[#5aa2ff]/35 blur-[120px]" />
          <div className="absolute left-1/2 top-1/3 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-white/70 blur-[90px]" />
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(29,123,255,0.16) 1.5px, transparent 1.6px)',
              backgroundSize: '34px 34px',
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
          <div className="grid w-full overflow-hidden rounded-[32px] border border-white bg-white/85 shadow-[0_30px_90px_-35px_rgba(11,94,215,0.55)] ring-1 ring-[#0b5ed7]/5 backdrop-blur-xl lg:grid-cols-[1.15fr_0.85fr]">
            <div className="px-6 py-9 sm:px-10 sm:py-11 lg:px-12">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0a49c7] to-[#1d7bff] text-white shadow-lg shadow-blue-600/25">
                    <Shield className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="bg-gradient-to-r from-[#0a49c7] via-[#1d7bff] to-[#0a49c7] bg-clip-text text-xl font-black leading-none tracking-tight text-transparent">
                      AOS
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-[#5b7ba6]">Tech Store</p>
                  </div>
                </div>
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#d5e5f8] bg-white/80 px-3.5 py-2 text-xs font-semibold text-[#3c5a80] transition hover:border-[#9dc4f0] hover:text-[#0a49c7]"
                >
                  <Globe className="h-3.5 w-3.5" />
                  aos-tech.store
                </a>
              </div>

              <div className="mt-7 flex items-center gap-3 rounded-2xl border border-[#dbe9fb] bg-gradient-to-r from-[#f4f9ff] to-white p-3 lg:hidden">
                <span
                  aria-hidden
                  className="h-12 w-12 shrink-0 rounded-full border-2 border-white bg-[#dfeeff] shadow-md"
                  style={{
                    backgroundImage: "url('/aos-login-poster.jpg')",
                    backgroundSize: '190px',
                    backgroundPosition: '26% 24%',
                  }}
                />
                <p className="text-xs leading-relaxed text-[#3c5a80]">
                  {t({
                    ar: 'أهلًا بعودتك. سجّل الدخول لإدارة متجرك بأمان.',
                    fr: 'Bon retour. Connectez-vous pour gérer votre boutique en toute sécurité.',
                    en: 'Welcome back. Sign in to manage your store securely.',
                  })}
                </p>
              </div>

              <h1 className="mt-7 text-[30px] font-black leading-tight text-[#0b2a5b] sm:text-[34px]">
                {t({ ar: 'لوحة التحكم', fr: 'Panneau d’administration', en: 'Admin Panel' })}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-[#5b7ba6]">
                {t({
                  ar: 'مرحبًا بعودتك. سجّل الدخول لإدارة الطلبات والمنتجات وإعدادات المتجر.',
                  fr: 'Bon retour. Connectez-vous pour gérer les commandes, les produits et les paramètres de la boutique.',
                  en: 'Welcome back. Sign in to manage orders, products and store settings.',
                })}
              </p>

              <form onSubmit={handleLogin} className="mt-7 flex flex-col gap-4">
                {loginStep === 'credentials' && (
                  <>
                    <div>
                      <label htmlFor="admin-email" className="text-xs font-bold uppercase tracking-wide text-[#5b7ba6]">
                        {t({ ar: 'البريد الإلكتروني أو اسم المستخدم', fr: 'E-mail ou nom d’utilisateur', en: 'Email or Username' })}
                      </label>
                      <div className="relative mt-2">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8aa6c8]" />
                        <input
                          id="admin-email"
                          type="text"
                          autoComplete="username"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t({ ar: 'name@example.com', fr: 'nom@exemple.com', en: 'name@example.com' })}
                          required
                          className="w-full rounded-2xl border border-[#cfe0f5] bg-white py-3.5 pl-12 pr-4 text-[15px] font-medium text-[#0b2a5b] shadow-sm outline-none transition placeholder:text-[#9db2cd] focus:border-[#1d7bff] focus:ring-4 focus:ring-[#1d7bff]/15"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="admin-password" className="text-xs font-bold uppercase tracking-wide text-[#5b7ba6]">
                        {t({ ar: 'كلمة المرور', fr: 'Mot de passe', en: 'Password' })}
                      </label>
                      <div className="relative mt-2">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8aa6c8]" />
                        <input
                          id="admin-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={t({ ar: '••••••••', fr: '••••••••', en: '••••••••' })}
                          required
                          dir="ltr"
                          className="w-full rounded-2xl border border-[#cfe0f5] bg-white py-3.5 pl-12 pr-12 text-[15px] font-medium text-[#0b2a5b] shadow-sm outline-none transition placeholder:text-[#9db2cd] focus:border-[#1d7bff] focus:ring-4 focus:ring-[#1d7bff]/15"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          aria-label={t({
                            ar: showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور',
                            fr: showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe',
                            en: showPassword ? 'Hide password' : 'Show password',
                          })}
                          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-[#8aa6c8] transition hover:bg-[#eef5ff] hover:text-[#1d7bff]"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {loginStep === 'code' && (
                  <>
                    <p className="rounded-2xl border border-[#dbe9fb] bg-[#f6faff] px-4 py-3 text-sm leading-relaxed text-[#3c5a80]">
                      {t({
                        ar: 'أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة، أو أحد الرموز الاحتياطية.',
                        fr: 'Saisissez le code à 6 chiffres de votre application, ou un code de secours.',
                        en: 'Enter the 6-digit code from your authenticator app, or a backup code.',
                      })}
                    </p>
                    <div>
                      <label htmlFor="admin-code" className="text-xs font-bold uppercase tracking-wide text-[#5b7ba6]">
                        {t({ ar: 'رمز التحقق', fr: 'Code de vérification', en: 'Verification code' })}
                      </label>
                      <div className="relative mt-2">
                        <Shield className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8aa6c8]" />
                        <input
                          id="admin-code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          placeholder={t({ ar: '000 000', fr: '000 000', en: '000 000' })}
                          required
                          autoFocus
                          className="w-full rounded-2xl border border-[#cfe0f5] bg-white py-3.5 pl-12 pr-4 text-center text-lg font-bold tracking-[0.35em] text-[#0b2a5b] shadow-sm outline-none transition placeholder:text-[#9db2cd] focus:border-[#1d7bff] focus:ring-4 focus:ring-[#1d7bff]/15"
                        />
                      </div>
                    </div>
                  </>
                )}

                {loginStep === 'enroll' && setupData && (
                  <>
                    <p className="rounded-2xl border border-[#dbe9fb] bg-[#f6faff] px-4 py-3 text-sm leading-relaxed text-[#3c5a80]">
                      {t({
                        ar: 'التحقق بخطوتين إلزامي. أضف هذا المفتاح إلى Google Authenticator أو Authy ثم أدخل الرمز الظاهر.',
                        fr: 'La double authentification est obligatoire. Ajoutez cette clé à Google Authenticator ou Authy, puis saisissez le code affiché.',
                        en: 'Two-factor authentication is mandatory. Add this key to Google Authenticator or Authy, then enter the displayed code.',
                      })}
                    </p>
                    <code className="block rounded-2xl border border-[#cfe0f5] bg-white px-3 py-3 text-center text-[13px] font-semibold tracking-[0.08em] text-[#0b2a5b] shadow-sm [word-break:break-all]">
                      {setupData.secret}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(setupData.secret).then(
                          () => toast.success(t({ ar: 'تم نسخ المفتاح', fr: 'Clé copiée', en: 'Key copied' })),
                          () => {}
                        );
                      }}
                      className="self-center text-sm font-semibold text-[#1d7bff] underline-offset-4 hover:underline"
                    >
                      {t({ ar: 'نسخ المفتاح', fr: 'Copier la clé', en: 'Copy key' })}
                    </button>
                    <div>
                      <label htmlFor="admin-enroll-code" className="text-xs font-bold uppercase tracking-wide text-[#5b7ba6]">
                        {t({ ar: 'الرمز من التطبيق', fr: 'Code de l’application', en: 'App code' })}
                      </label>
                      <div className="relative mt-2">
                        <Shield className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8aa6c8]" />
                        <input
                          id="admin-enroll-code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          dir="ltr"
                          value={twoFactorCode}
                          onChange={(e) => setTwoFactorCode(e.target.value)}
                          placeholder={t({ ar: '000000', fr: '000000', en: '000000' })}
                          required
                          autoFocus
                          className="w-full rounded-2xl border border-[#cfe0f5] bg-white py-3.5 pl-12 pr-4 text-center text-lg font-bold tracking-[0.35em] text-[#0b2a5b] shadow-sm outline-none transition placeholder:text-[#9db2cd] focus:border-[#1d7bff] focus:ring-4 focus:ring-[#1d7bff]/15"
                        />
                      </div>
                      <p className="mt-2 text-center text-xs leading-relaxed text-[#7c96b7]">
                        {t({
                          ar: 'أدخل الأرقام الستة التي يعرضها التطبيق، وليس المفتاح الطويل أعلاه.',
                          fr: 'Saisissez les 6 chiffres affichés par l’application, et non la clé de configuration ci-dessus.',
                          en: 'Enter the 6 digits shown by the app, not the setup key above.',
                        })}
                      </p>
                    </div>
                  </>
                )}

                {loginStep === 'backup' && (
                  <>
                    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-relaxed text-amber-800">
                      {t({
                        ar: 'احفظ هذه الرموز الاحتياطية الآن. لن تظهر مرة أخرى، وكل رمز يعمل مرة واحدة.',
                        fr: 'Conservez ces codes de secours maintenant. Ils ne seront plus affichés et chaque code ne fonctionne qu’une fois.',
                        en: 'Save these backup codes now. They will not be shown again, and each code works once.',
                      })}
                    </p>
                    <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#cfe0f5] bg-white p-3 font-mono text-xs text-[#0b2a5b] shadow-sm" dir="ltr">
                      {backupCodes.map((code) => (
                        <span key={code}>{code}</span>
                      ))}
                    </div>
                  </>
                )}

                {loginError && (
                  <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
                    {loginError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#0a49c7] via-[#1568f0] to-[#0a49c7] px-6 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-blue-600/30 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loginLoading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      {t({ ar: 'جاري التحقق...', fr: 'Vérification...', en: 'Checking...' })}
                    </>
                  ) : loginStep === 'backup' ? (
                    t({ ar: 'لقد حفظت الرموز — متابعة', fr: 'Codes enregistrés — continuer', en: 'I saved the codes — continue' })
                  ) : loginStep === 'enroll' ? (
                    t({ ar: 'تفعيل ومتابعة', fr: 'Activer et continuer', en: 'Enable and continue' })
                  ) : loginStep === 'code' ? (
                    t({ ar: 'تحقق', fr: 'Vérifier', en: 'Verify' })
                  ) : (
                    t({ ar: 'دخول', fr: 'Connexion', en: 'Login' })
                  )}
                </button>

                {loginStep !== 'credentials' && loginStep !== 'backup' && (
                  <button
                    type="button"
                    onClick={resetLoginFlow}
                    className="self-center text-sm font-semibold text-[#5b7ba6] transition hover:text-[#0a49c7]"
                  >
                    {t({ ar: 'العودة لبيانات الدخول', fr: 'Retour à la connexion', en: 'Back to sign in' })}
                  </button>
                )}
              </form>

              <p className="mt-7 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-[#7c96b7]">
                <Lock className="h-3 w-3" />
                {t({
                  ar: 'اتصال مشفّر ومحمي بالتحقق بخطوتين',
                  fr: 'Connexion chiffrée et protégée par la double authentification',
                  en: 'Encrypted connection protected by two-factor authentication',
                })}
              </p>
            </div>

            <div className="relative hidden bg-[#dcecff] lg:block">
              <img
                src="/aos-login-poster.jpg"
                alt="AOS Tech Store"
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/40" />
            </div>
          </div>
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
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className={`w-2 h-2 rounded-full ${
                  syncStatus === 'syncing' ? 'bg-amber-400 animate-pulse' :
                  syncStatus === 'success' ? 'bg-emerald-400' :
                  syncStatus === 'error' ? 'bg-red-400' : 'bg-white/20'
                }`} />
                {lastSyncTime > 0 && (
                  <span>{t({ ar: 'آخر مزامنة', fr: 'Dernière synchro', en: 'Last sync' })}: {new Date(lastSyncTime).toLocaleTimeString()}</span>
                )}
              </div>
              <button
                onClick={exportOrdersCsv}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-5 py-3 text-sm font-semibold hover:bg-emerald-500/30 transition-all"
              >
                <Download className="w-4 h-4" />
                {t({ ar: 'تصدير CSV', fr: 'Exporter CSV', en: 'Export CSV' })}
              </button>
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
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => { setTab('orders'); setFilter('all'); }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'orders'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'جميع الطلبات', fr: 'Toutes les commandes', en: 'All Orders' })}
          </button>
          <button
            onClick={() => { setTab('products'); setFilter('all'); }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'products'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'طلبات المنتجات', fr: 'Commandes produits', en: 'Product Orders' })}
          </button>
          <button
            onClick={() => { setTab('services'); setFilter('all'); }}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'services'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'حجوزات الخدمات', fr: 'Réservations services', en: 'Service Bookings' })}
          </button>
          <button
            onClick={() => setTab('manage-products')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'manage-products'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'إدارة المنتجات', fr: 'Gérer produits', en: 'Manage Products' })}
          </button>
          <button
            onClick={() => setTab('manage-services')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'manage-services'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'إدارة الخدمات', fr: 'Gérer services', en: 'Manage Services' })}
          </button>
          <button
            onClick={() => setTab('customers')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'customers'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'العملاء', fr: 'Clients', en: 'Customers' })}
          </button>
          <button
            onClick={() => setTab('coupons')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'coupons'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'أكواد الخصم', fr: 'Coupons', en: 'Coupons' })}
          </button>
          <button
            onClick={() => setTab('content')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'content'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'المحتوى', fr: 'Contenu', en: 'Content' })}
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'settings'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'الإعدادات', fr: 'Paramètres', en: 'Settings' })}
          </button>
          <button
            onClick={() => setTab('reviews')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'reviews'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'التقييمات', fr: 'Avis', en: 'Reviews' })}
          </button>
          <button
            onClick={() => setTab('newsletter')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'newsletter'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'النشرة', fr: 'Newsletter', en: 'Newsletter' })}
          </button>
          <button
            onClick={() => setTab('messages')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border flex items-center gap-2 ${
              tab === 'messages'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            <MailOpen className="w-4 h-4" />
            {t({ ar: 'الرسائل', fr: 'Messages', en: 'Messages' })}
          </button>
          <button
            onClick={() => setTab('security')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border flex items-center gap-2 ${
              tab === 'security'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            {t({ ar: 'الأمان', fr: 'Sécurité', en: 'Security' })}
          </button>
          <button
            onClick={() => setTab('dashboard')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
              tab === 'dashboard'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            {t({ ar: 'الإحصائيات', fr: 'Statistiques', en: 'Dashboard' })}
          </button>
          <button
            onClick={() => setTab('factory')}
            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border flex items-center gap-2 ${
              tab === 'factory'
                ? 'bg-primary text-slate-950 border-primary'
                : 'bg-slate-900 text-white/70 border-white/10 hover:bg-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            {t({ ar: 'مصنع المواقع', fr: 'Usine à sites', en: 'Website Factory' })}
          </button>
        </div>

        {/* Manage Products */}
        <Suspense fallback={<TabLoading />}>
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
                  onClick={async () => {
                    const next = !isMaintenanceMode();
                    const synced = await setMaintenanceMode(next);
                    if (synced) {
                      toast.success(t({ ar: 'تم حفظ وضع الصيانة للجميع', fr: 'Mode maintenance enregistré pour tous', en: 'Maintenance mode saved for everyone' }));
                    } else {
                      toast.error(t({ ar: 'تعذر حفظ الحالة على السيرفر — لن يراها الزوار', fr: 'Échec de sauvegarde serveur — invisible pour les visiteurs', en: 'Failed to save to server — visitors will not see it' }));
                    }
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
        ) : tab === 'messages' ? (
          <MessagesTab />
        ) : tab === 'security' ? (
          <SecurityTab />
        ) : tab === 'factory' ? (
          <SiteFactoryTab />
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
                          ? t({ ar: 'حجز خدمة مكتبية', fr: 'Réservation service', en: 'Office service booking' })
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
                            // Loaded on demand: jsPDF + html2canvas must not be
                            // part of the admin (or public) initial download.
                            const { generateInvoice } = await import('./InvoicePDF');
                            await generateInvoice(order, language);
                          } catch (err) {
                            if (import.meta.env.DEV) console.error('Invoice generation failed:', err);
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
                              href={`https://wa.me/${order.phone.startsWith('+') ? order.phone : '213' + order.phone.slice(order.phone.startsWith('0') ? 1 : 0)}?text=${encodeURIComponent(t({ ar: `مرحباً، بخصوص طلبك من ${brand.name}`, fr: `Bonjour, concerne votre commande chez ${brand.name}`, en: `Hello, regarding your order from ${brand.name}` }))}`}
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
      </Suspense>
      </div>
    </section>
  );
}

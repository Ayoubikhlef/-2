import { useState, useMemo, useEffect, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrders, loadOrdersFromServer, type OrderRecord, type OrderStatus } from '../utils/orderStorage';
import { api, type CustomerAccount } from '../utils/api';
import {
  Search, Phone, Mail, ShoppingBag, Calendar, ChevronDown, ChevronUp, Download,
  AlertTriangle, FileText, Users, RefreshCw, BadgeCheck, ShieldCheck, MapPin, UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';

type HistoryOrder = {
  id: string;
  status: OrderStatus;
  createdAt: string;
  total: number;
  items: { name: string; quantity: number }[];
};

type CustomerRow = {
  key: string;
  name: string;
  phone: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  orders: HistoryOrder[];
  account?: CustomerAccount;
};

export function CustomersTab() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<OrderRecord[]>(() => getOrders());
  const [accounts, setAccounts] = useState<CustomerAccount[]>([]);
  const [accountsError, setAccountsError] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchOrders() {
      const localOrders = getOrders();
      if (mounted) setOrders(localOrders);

      try {
        const serverOrders = await loadOrdersFromServer();
        if (mounted) setOrders(serverOrders);
      } catch {
        if (mounted) setOrders(getOrders());
      }
    }

    fetchOrders();

    const onChanged = () => setOrders(getOrders());
    window.addEventListener('aos:data-changed', onChanged);
    return () => {
      mounted = false;
      window.removeEventListener('aos:data-changed', onChanged);
    };
  }, []);

  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true);
    try {
      const data = await api.customers.list();
      setAccounts(data.customers);
      setAccountsError(false);
    } catch {
      setAccountsError(true);
    } finally {
      setLoadingAccounts(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const refreshAll = async () => {
    await Promise.all([
      loadAccounts(),
      loadOrdersFromServer().then(setOrders).catch(() => setOrders(getOrders())),
    ]);
  };

  const customers = useMemo<CustomerRow[]>(() => {
    const claimed = new Set<string>();
    const rows: CustomerRow[] = [];

    for (const account of accounts) {
      for (const id of account.orderIds) claimed.add(id);
      rows.push({
        key: `account:${account.id}`,
        name: account.name,
        phone: account.phone || '',
        email: account.email,
        orderCount: account.ordersCount,
        totalSpent: account.totalSpent,
        lastOrderDate: account.lastOrderAt,
        orders: account.orders.map((order) => ({
          id: order.id,
          status: order.status as OrderStatus,
          createdAt: order.createdAt,
          total: order.total,
          items: order.items.map((item) => ({ name: item.name, quantity: item.quantity })),
        })),
        account,
      });
    }

    // Guests are the customers who ordered without an account; orders that are
    // already attached to an account above must not be counted twice.
    const guests = new Map<string, CustomerRow>();
    for (const order of orders) {
      if (claimed.has(order.id)) continue;
      const key = order.phone || order.id;
      const existing = guests.get(key);
      const history: HistoryOrder = {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt,
        total: order.total,
        items: order.items.map((item) => ({ name: item.name, quantity: item.quantity })),
      };
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
        if (!existing.lastOrderDate || new Date(order.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.createdAt;
        }
        existing.orders.push(history);
      } else {
        guests.set(key, {
          key,
          name: order.customer,
          phone: order.phone,
          email: order.email || '',
          orderCount: 1,
          totalSpent: order.total,
          lastOrderDate: order.createdAt,
          orders: [history],
        });
      }
    }

    for (const guest of guests.values()) {
      guest.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      rows.push(guest);
    }

    return rows.sort((a, b) => {
      const byAccount = Number(Boolean(b.account)) - Number(Boolean(a.account));
      return byAccount || b.totalSpent - a.totalSpent;
    });
  }, [accounts, orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const getBlockedCustomers = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('aos_blocked_customers');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const isBlocked = (key: string) => getBlockedCustomers().includes(key);

  const toggleBlock = (key: string) => {
    const current = getBlockedCustomers();
    const next = current.includes(key)
      ? current.filter((entry) => entry !== key)
      : [...current, key];
    localStorage.setItem('aos_blocked_customers', JSON.stringify(next));
    toast.success(
      current.includes(key)
        ? t({ ar: 'تم إلغاء حظر العميل', fr: 'Client débloqué', en: 'Customer unblocked' })
        : t({ ar: 'تم حظر العميل', fr: 'Client bloqué', en: 'Customer blocked' })
    );
  };

  const getNotes = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem('aos_customer_notes');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const getNote = (key: string) => getNotes()[key] || '';

  const saveNote = (key: string, text: string) => {
    const current = getNotes();
    const next = { ...current, [key]: text };
    localStorage.setItem('aos_customer_notes', JSON.stringify(next));
  };

  const handleNoteChange = (key: string, value: string) => {
    setNoteInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleNoteSave = (key: string) => {
    const text = noteInput[key] || '';
    saveNote(key, text);
    toast.success(t({ ar: 'تم حفظ الملاحظة', fr: 'Note enregistrée', en: 'Note saved' }));
    setNoteInput((prev) => ({ ...prev, [key]: '' }));
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString(
      language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  };

  const exportCsv = () => {
    const header = [
      t({ ar: 'الاسم', fr: 'Nom', en: 'Name' }),
      t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' }),
      t({ ar: 'البريد الإلكتروني', fr: 'Email', en: 'Email' }),
      t({ ar: 'حساب مسجّل', fr: 'Compte', en: 'Account' }),
      t({ ar: 'البريد مؤكد', fr: 'Email vérifié', en: 'Email verified' }),
      t({ ar: 'تاريخ التسجيل', fr: "Date d'inscription", en: 'Registered at' }),
      t({ ar: 'عدد الطلبات', fr: 'Nb commandes', en: 'Order count' }),
      t({ ar: 'المبلغ الإجمالي', fr: 'Total dépensé', en: 'Total spent' }),
      t({ ar: 'آخر طلب', fr: 'Dernière commande', en: 'Last order' }),
      t({ ar: 'الحالة', fr: 'Statut', en: 'Status' }),
    ].join(',');
    const rows = customers.map((c) =>
      [
        `"${c.name}"`,
        c.phone,
        `"${c.email}"`,
        c.account ? t({ ar: 'نعم', fr: 'Oui', en: 'Yes' }) : t({ ar: 'لا', fr: 'Non', en: 'No' }),
        c.account
          ? c.account.emailVerified
            ? t({ ar: 'نعم', fr: 'Oui', en: 'Yes' })
            : t({ ar: 'لا', fr: 'Non', en: 'No' })
          : '—',
        c.account ? new Date(c.account.createdAt).toLocaleDateString('en-CA') : '—',
        c.orderCount,
        c.totalSpent,
        c.lastOrderDate ? new Date(c.lastOrderDate).toLocaleDateString('en-CA') : '—',
        isBlocked(c.key)
          ? t({ ar: 'محظور', fr: 'Bloqué', en: 'Blocked' })
          : t({ ar: 'نشط', fr: 'Actif', en: 'Active' }),
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t({ ar: 'تم تصدير البيانات', fr: 'Données exportées', en: 'Data exported' }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold">
            {t({ ar: 'إدارة العملاء', fr: 'Gestion des clients', en: 'Customer Management' })}
          </h3>
          <p className="text-sm text-white/50 mt-1">
            {t({
              ar: `${customers.length} عميل (${accounts.length} حساب مسجّل) - ${orders.length} طلب`,
              fr: `${customers.length} clients (${accounts.length} comptes) - ${orders.length} commandes`,
              en: `${customers.length} customers (${accounts.length} accounts) - ${orders.length} orders`,
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            onClick={refreshAll}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white/80 hover:bg-slate-700 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAccounts ? 'animate-spin' : ''}`} />
            {t({ ar: 'تحديث', fr: 'Actualiser', en: 'Refresh' })}
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-slate-950 px-5 py-2.5 text-sm font-bold hover:bg-primary/90 transition-all"
          >
            <Download className="w-4 h-4" />
            {t({ ar: 'تصدير CSV', fr: 'Exporter CSV', en: 'Export CSV' })}
          </button>
        </div>
      </div>

      {accountsError && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
          {t({
            ar: 'تعذّر تحميل الحسابات المسجّلة الآن. الطلبات تظهر بشكل طبيعي.',
            fr: 'Impossible de charger les comptes pour le moment.',
            en: 'Could not load registered accounts right now.',
          })}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t({
            ar: 'بحث بالاسم أو الهاتف أو البريد...',
            fr: 'Rechercher par nom, téléphone ou email...',
            en: 'Search by name, phone or email...',
          })}
          className="w-full rounded-2xl border border-white/10 bg-slate-800 pl-12 pr-4 py-3 text-sm text-white outline-none focus:border-primary transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[32px] border border-white/10 bg-slate-900/80 p-16 text-center">
          <Users className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-xl text-white/40">
            {search
              ? t({ ar: 'لا توجد نتائج للبحث', fr: 'Aucun résultat', en: 'No results found' })
              : t({ ar: 'لا يوجد عملاء بعد', fr: 'Aucun client', en: 'No customers yet' })}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((customer) => {
            const blocked = isBlocked(customer.key);
            const isExpanded = expandedKey === customer.key;
            const existingNote = getNote(customer.key);
            const showNoteInput = noteInput[customer.key] !== undefined;
            const account = customer.account;

            return (
              <div
                key={customer.key}
                className={`rounded-[32px] border transition-all ${
                  blocked
                    ? 'border-red-500/20 bg-red-950/20'
                    : account
                      ? 'border-primary/20 bg-slate-900/80'
                      : 'border-white/10 bg-slate-900/80'
                }`}
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-lg font-bold text-white truncate max-w-[250px]">
                          {customer.name}
                        </h4>
                        {account && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/15 text-primary border border-primary/30">
                            <UserPlus className="w-3 h-3" />
                            {t({ ar: 'حساب مسجّل', fr: 'Compte', en: 'Account' })}
                          </span>
                        )}
                        {account && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              account.emailVerified
                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            <BadgeCheck className="w-3 h-3" />
                            {account.emailVerified
                              ? t({ ar: 'بريد مؤكّد', fr: 'Email vérifié', en: 'Email verified' })
                              : t({ ar: 'بريد غير مؤكّد', fr: 'Email non vérifié', en: 'Email unverified' })}
                          </span>
                        )}
                        {account && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              account.twoFactorEnabled
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                : 'bg-white/5 text-white/50 border-white/10'
                            }`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            2FA {account.twoFactorEnabled ? t({ ar: 'مفعّل', fr: 'on', en: 'on' }) : t({ ar: 'غير مفعّل', fr: 'off', en: 'off' })}
                          </span>
                        )}
                        {account?.isLocked && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            {t({ ar: 'مقفل مؤقتاً', fr: 'Verrouillé', en: 'Locked' })}
                          </span>
                        )}
                        {blocked && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            {t({ ar: 'محظور', fr: 'Bloqué', en: 'Blocked' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-white/60 flex-wrap">
                        {customer.phone && (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="inline-flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            {customer.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-5 flex-wrap">
                      <div className="text-center">
                        <p className="text-xs text-white/40">
                          {t({ ar: 'الطلبات', fr: 'Commandes', en: 'Orders' })}
                        </p>
                        <p className="text-lg font-bold text-white">{customer.orderCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/40">
                          {t({ ar: 'المجموع', fr: 'Total', en: 'Total' })}
                        </p>
                        <p className="text-lg font-bold text-emerald-400">
                          {customer.totalSpent.toLocaleString()} د.ج
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-white/40">
                          {t({ ar: 'آخر طلب', fr: 'Dernier', en: 'Last' })}
                        </p>
                        <p className="text-sm font-medium text-white/70 whitespace-nowrap">
                          {customer.lastOrderDate
                            ? new Date(customer.lastOrderDate).toLocaleDateString(
                                language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
                                { day: 'numeric', month: 'short' }
                              )
                            : '—'}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleBlock(customer.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                          blocked
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                        }`}
                      >
                        {blocked
                          ? t({ ar: 'إلغاء الحظر', fr: 'Débloquer', en: 'Unblock' })
                          : t({ ar: 'حظر', fr: 'Bloquer', en: 'Block' })}
                      </button>

                      <button
                        onClick={() => setExpandedKey(isExpanded ? null : customer.key)}
                        className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all border border-white/10"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-white/10 px-5 pb-5 pt-4 space-y-4">
                    {account && (
                      <div className="rounded-2xl bg-slate-800/50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <BadgeCheck className="w-4 h-4 text-white/50" />
                          <span className="text-sm font-semibold text-white/70">
                            {t({ ar: 'بيانات الحساب', fr: 'Informations du compte', en: 'Account details' })}
                          </span>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-white/40">{t({ ar: 'البريد الإلكتروني', fr: 'Email', en: 'Email' })}</p>
                            <p className="text-white/80 break-all">{account.email}</p>
                            <p className={`text-xs mt-1 ${account.emailVerified ? 'text-emerald-400' : 'text-amber-300'}`}>
                              {account.emailVerified
                                ? t({ ar: 'مؤكّد', fr: 'Vérifié', en: 'Verified' })
                                : t({ ar: 'لم يؤكَّد بعد', fr: 'Non vérifié', en: 'Not verified' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40">{t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })}</p>
                            <p className="text-white/80">{account.phone || '—'}</p>
                            {account.failedLoginAttempts > 0 && (
                              <p className="text-xs mt-1 text-orange-300">
                                {t({ ar: `محاولات دخول فاشلة: ${account.failedLoginAttempts}`, fr: `Échecs: ${account.failedLoginAttempts}`, en: `Failed logins: ${account.failedLoginAttempts}` })}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-white/40">{t({ ar: 'تاريخ التسجيل', fr: "Date d'inscription", en: 'Registered' })}</p>
                            <p className="text-white/80">{formatDate(account.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40">{t({ ar: 'آخر نشاط', fr: 'Dernière activité', en: 'Last activity' })}</p>
                            <p className="text-white/80">{formatDate(account.lastActivityAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40">{t({ ar: 'الطلبات', fr: 'Commandes', en: 'Orders' })}</p>
                            <p className="text-white/80">
                              {t({
                                ar: `${account.ordersCount} إجمالاً · ${account.completedCount} مكتمل · ${account.cancelledCount} ملغي`,
                                fr: `${account.ordersCount} au total · ${account.completedCount} terminées · ${account.cancelledCount} annulées`,
                                en: `${account.ordersCount} total · ${account.completedCount} completed · ${account.cancelledCount} cancelled`,
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40">{t({ ar: 'المبلغ الإجمالي', fr: 'Total dépensé', en: 'Total spent' })}</p>
                            <p className="text-emerald-400 font-semibold">{account.totalSpent.toLocaleString()} د.ج</p>
                          </div>
                        </div>

                        {account.addresses.length > 0 && (
                          <div className="mt-4 border-t border-white/10 pt-4">
                            <div className="flex items-center gap-2 mb-2">
                              <MapPin className="w-4 h-4 text-white/40" />
                              <span className="text-xs font-semibold text-white/50">
                                {t({ ar: 'العناوين', fr: 'Adresses', en: 'Addresses' })}
                              </span>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {account.addresses.map((address) => (
                                <div key={address.id} className="rounded-xl border border-white/10 bg-slate-800/40 p-3 text-sm">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-white/80">{address.fullName}</span>
                                    {address.label && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/50">{address.label}</span>
                                    )}
                                    {address.isDefault && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                                        {t({ ar: 'افتراضي', fr: 'Par défaut', en: 'Default' })}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-white/60 mt-1">{address.phone}</p>
                                  <p className="text-white/60">{address.wilaya} · {address.municipality}</p>
                                  <p className="text-white/50 text-xs mt-1">{address.address}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="rounded-2xl bg-slate-800/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-white/50" />
                        <span className="text-sm font-semibold text-white/70">
                          {t({ ar: 'ملاحظات داخلية', fr: 'Notes internes', en: 'Internal notes' })}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={showNoteInput ? noteInput[customer.key] ?? '' : existingNote}
                          onChange={(e) => handleNoteChange(customer.key, e.target.value)}
                          onFocus={() => {
                            if (!showNoteInput) {
                              setNoteInput((prev) => ({ ...prev, [customer.key]: existingNote }));
                            }
                          }}
                          placeholder={t({ ar: 'أضف ملاحظة...', fr: 'Ajouter une note...', en: 'Add a note...' })}
                          className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
                        />
                        <button
                          onClick={() => handleNoteSave(customer.key)}
                          className="px-4 py-2.5 rounded-xl bg-primary text-slate-950 text-sm font-bold hover:bg-primary/90 transition-all"
                        >
                          {t({ ar: 'حفظ', fr: 'Sauvegarder', en: 'Save' })}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ShoppingBag className="w-4 h-4 text-white/50" />
                        <span className="text-sm font-semibold text-white/70">
                          {t({ ar: 'سجل الطلبات', fr: 'Historique des commandes', en: 'Order history' })}
                        </span>
                      </div>
                      {customer.orders.length === 0 ? (
                        <p className="text-sm text-white/40">
                          {t({ ar: 'لا توجد طلبات لهذا الحساب بعد', fr: 'Aucune commande', en: 'No orders yet' })}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {customer.orders.map((order) => (
                            <div
                              key={order.id}
                              className="rounded-xl border border-white/10 bg-slate-800/30 p-4 hover:bg-slate-800/50 transition-all"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className="text-xs font-mono text-white/30">
                                    #{order.id.slice(0, 6)}
                                  </span>
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                    order.status === 'new' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                    order.status === 'processing' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                                    order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                  }`}>
                                    {order.status === 'new' && t({ ar: 'جديد', fr: 'Nouveau', en: 'New' })}
                                    {order.status === 'processing' && t({ ar: 'قيد المعالجة', fr: 'En cours', en: 'Processing' })}
                                    {order.status === 'completed' && t({ ar: 'مكتمل', fr: 'Terminé', en: 'Completed' })}
                                    {order.status === 'cancelled' && t({ ar: 'ملغي', fr: 'Annulé', en: 'Cancelled' })}
                                  </span>
                                  <span className="text-xs text-white/40 inline-flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {formatDate(order.createdAt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-white/60">
                                    {order.items.length} {t({ ar: 'صنف', fr: 'art.', en: 'item(s)' })}
                                  </span>
                                  <span className="text-sm font-bold text-emerald-400">
                                    {order.total.toLocaleString()} د.ج
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {order.items.map((item, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-2 py-0.5 rounded-md bg-slate-700/50 text-xs text-white/60"
                                  >
                                    {item.name} ×{item.quantity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { getOrders } from '../utils/orderStorage';
import { Search, Phone, Mail, ShoppingBag, DollarSign, Calendar, ChevronDown, ChevronUp, Download, AlertTriangle, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  orderIds: string[];
}

export function CustomersTab() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [expandedPhone, setExpandedPhone] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  const orders = useMemo(() => getOrders(), []);

  const customers = useMemo(() => {
    const map = new Map<string, CustomerInfo>();
    for (const order of orders) {
      const existing = map.get(order.phone);
      if (existing) {
        existing.orderCount += 1;
        existing.totalSpent += order.total;
        const existingDate = new Date(existing.lastOrderDate);
        const orderDate = new Date(order.createdAt);
        if (orderDate > existingDate) {
          existing.lastOrderDate = order.createdAt;
        }
        existing.orderIds.push(order.id);
      } else {
        map.set(order.phone, {
          name: order.customer,
          phone: order.phone,
          email: order.email || '',
          orderCount: 1,
          totalSpent: order.total,
          lastOrderDate: order.createdAt,
          orderIds: [order.id],
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [customers, search]);

  const getCustomerOrders = (phone: string) =>
    orders.filter((o) => o.phone === phone).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const getBlockedCustomers = (): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem('aos_blocked_customers');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  };

  const isBlocked = (phone: string) => getBlockedCustomers().includes(phone);

  const toggleBlock = (phone: string) => {
    const current = getBlockedCustomers();
    const next = current.includes(phone)
      ? current.filter((p) => p !== phone)
      : [...current, phone];
    localStorage.setItem('aos_blocked_customers', JSON.stringify(next));
    toast.success(
      current.includes(phone)
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

  const getNote = (phone: string) => getNotes()[phone] || '';

  const saveNote = (phone: string, text: string) => {
    const current = getNotes();
    const next = { ...current, [phone]: text };
    localStorage.setItem('aos_customer_notes', JSON.stringify(next));
  };

  const handleNoteChange = (phone: string, value: string) => {
    setNoteInput((prev) => ({ ...prev, [phone]: value }));
  };

  const handleNoteSave = (phone: string) => {
    const text = noteInput[phone] || '';
    saveNote(phone, text);
    toast.success(t({ ar: 'تم حفظ الملاحظة', fr: 'Note enregistrée', en: 'Note saved' }));
    setNoteInput((prev) => ({ ...prev, [phone]: '' }));
  };

  const exportCsv = () => {
    const header = [
      t({ ar: 'الاسم', fr: 'Nom', en: 'Name' }),
      t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' }),
      t({ ar: 'البريد الإلكتروني', fr: 'Email', en: 'Email' }),
      t({ ar: 'عدد الطلبات', fr: 'Nb commandes', en: 'Order count' }),
      t({ ar: 'المبلغ الإجمالي', fr: 'Total dépensé', en: 'Total spent' }),
      t({ ar: 'آخر طلب', fr: 'Dernière commande', en: 'Last order' }),
      t({ ar: 'الحالة', fr: 'Statut', en: 'Status' }),
    ].join(',');
    const rows = customers.map((c) =>
      [
        `"${c.name}"`,
        c.phone,
        c.email,
        c.orderCount,
        c.totalSpent,
        new Date(c.lastOrderDate).toLocaleDateString('en-CA'),
        isBlocked(c.phone)
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(
      language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
      { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
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
              ar: `${customers.length} عميل - ${orders.length} طلب`,
              fr: `${customers.length} clients - ${orders.length} commandes`,
              en: `${customers.length} customers - ${orders.length} orders`,
            })}
          </p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-full bg-primary text-slate-950 px-5 py-2.5 text-sm font-bold hover:bg-primary/90 transition-all self-start"
        >
          <Download className="w-4 h-4" />
          {t({ ar: 'تصدير CSV', fr: 'Exporter CSV', en: 'Export CSV' })}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t({ ar: 'بحث بالاسم أو رقم الهاتف...', fr: 'Rechercher par nom ou téléphone...', en: 'Search by name or phone...' })}
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
            const blocked = isBlocked(customer.phone);
            const customerOrders = getCustomerOrders(customer.phone);
            const isExpanded = expandedPhone === customer.phone;
            const existingNote = getNote(customer.phone);
            const showNoteInput = noteInput[customer.phone] !== undefined;

            return (
              <div
                key={customer.phone}
                className={`rounded-[32px] border transition-all ${
                  blocked
                    ? 'border-red-500/20 bg-red-950/20'
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
                        {blocked && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            {t({ ar: 'محظور', fr: 'Bloqué', en: 'Blocked' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-white/60 flex-wrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5" />
                          {customer.phone}
                        </span>
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
                          {t({ ar: 'آخر طلب', fr: 'Dernier', en: 'Last order' })}
                        </p>
                        <p className="text-sm font-medium text-white/70 whitespace-nowrap">
                          {new Date(customer.lastOrderDate).toLocaleDateString(
                            language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
                            { day: 'numeric', month: 'short' }
                          )}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleBlock(customer.phone)}
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
                        onClick={() => setExpandedPhone(isExpanded ? null : customer.phone)}
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
                    <div className="rounded-2xl bg-slate-800/50 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-white/50" />
                        <span className="text-sm font-semibold text-white/70">
                          {t({ ar: 'ملاحظات داخلية', fr: 'Notes internes', en: 'Internal notes' })}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={showNoteInput ? noteInput[customer.phone] ?? '' : existingNote}
                          onChange={(e) => handleNoteChange(customer.phone, e.target.value)}
                          onFocus={() => {
                            if (!showNoteInput) {
                              setNoteInput((prev) => ({ ...prev, [customer.phone]: existingNote }));
                            }
                          }}
                          placeholder={t({ ar: 'أضف ملاحظة...', fr: 'Ajouter une note...', en: 'Add a note...' })}
                          className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none focus:border-primary"
                        />
                        <button
                          onClick={() => handleNoteSave(customer.phone)}
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
                      <div className="space-y-2">
                        {customerOrders.map((order) => (
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

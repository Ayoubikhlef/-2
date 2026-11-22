import { useCallback, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  Package,
  Palette,
  Plus,
  RefreshCw,
  Rocket,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { siteAdminApi, type SiteAdminInfo } from '../utils/api';

type Tab = 'orders' | 'leads' | 'products' | 'content';

const ORDER_STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;

const EMPTY_CONTENT: Record<string, any> = {
  siteName: '',
  businessName: '',
  tagline: '',
  description: '',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  primaryColor: '#0b5ed7',
  secondaryColor: '#1e3a8a',
  hours: '',
  socials: { facebook: '', instagram: '', tiktok: '' },
  services: [],
};

function formatMoney(value: any, lang: string) {
  const number = Number(value) || 0;
  try {
    return new Intl.NumberFormat(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-DZ' : 'en-GB', {
      maximumFractionDigits: 0,
    }).format(number);
  } catch {
    return String(number);
  }
}

function formatDate(value: string, lang: string) {
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-DZ' : lang === 'fr' ? 'fr-FR' : 'en-GB', {
      dateStyle: 'medium',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function SiteAdminPage() {
  const { t, language } = useLanguage();
  const [site, setSite] = useState<SiteAdminInfo | null>(null);
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [content, setContent] = useState<Record<string, any>>(EMPTY_CONTENT);
  const [draft, setDraft] = useState<Record<string, any>>({ name: '', description: '', price: '', imageUrl: '', category: '', isActive: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [me, o, l, p, c] = await Promise.all([
        siteAdminApi.me(),
        siteAdminApi.orders(),
        siteAdminApi.leads(),
        siteAdminApi.products(),
        siteAdminApi.content(),
      ]);
      setSite(me.site);
      setOrders(o.orders || []);
      setLeads(l.leads || []);
      setProducts(p.products || []);
      setContent({ ...EMPTY_CONTENT, ...(c.content || {}) });
      setError('');
    } catch (err: any) {
      setError(
        err?.status === 401
          ? t({ ar: 'رابط الدخول غير صالح أو منتهي. اطلب رابطاً جديداً من AOS.', fr: 'Lien invalide ou expiré. Demandez un nouveau lien à AOS.', en: 'Invalid or expired link. Ask AOS for a new one.' })
          : t({ ar: 'تعذّر تحميل البيانات. حاول تحديث الصفحة.', fr: 'Impossible de charger les données. Rechargez la page.', en: 'Could not load data. Refresh the page.' }),
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const reloadSection = async (section: Tab) => {
    if (section === 'orders') setOrders((await siteAdminApi.orders()).orders || []);
    if (section === 'leads') setLeads((await siteAdminApi.leads()).leads || []);
    if (section === 'products') setProducts((await siteAdminApi.products()).products || []);
    if (section === 'content') setContent({ ...EMPTY_CONTENT, ...((await siteAdminApi.content()).content || {}) });
  };

  const changeStatus = async (id: string, status: string) => {
    setBusy(true);
    try {
      await siteAdminApi.setOrderStatus(id, status);
      setOrders((rows) => rows.map((row) => (row.id === id ? { ...row, status } : row)));
      toast.success(t({ ar: 'تم تحديث حالة الطلب', fr: 'Statut mis à jour', en: 'Order status updated' }));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitProduct = async () => {
    if (!String(draft.name || '').trim() || Number(draft.price) < 0) {
      toast.error(t({ ar: 'أدخل اسماً وسعراً صحيحين.', fr: 'Saisissez un nom et un prix valides.', en: 'Enter a valid name and price.' }));
      return;
    }
    setBusy(true);
    try {
      await siteAdminApi.saveProduct(
        {
          name: String(draft.name).trim(),
          description: String(draft.description || '').trim(),
          price: Number(draft.price) || 0,
          imageUrl: String(draft.imageUrl || '').trim(),
          category: String(draft.category || '').trim(),
          isActive: draft.isActive !== false,
        },
        editingId || undefined,
      );
      await reloadSection('products');
      setDraft({ name: '', description: '', price: '', imageUrl: '', category: '', isActive: true });
      setEditingId(null);
      toast.success(t({ ar: 'تم حفظ المنتج', fr: 'Produit enregistré', en: 'Product saved' }));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeProduct = async (id: string) => {
    if (!window.confirm(t({ ar: 'حذف هذا المنتج؟', fr: 'Supprimer ce produit ?', en: 'Delete this product?' }))) return;
    setBusy(true);
    try {
      await siteAdminApi.deleteProduct(id);
      await reloadSection('products');
      toast.success(t({ ar: 'تم حذف المنتج', fr: 'Produit supprimé', en: 'Product deleted' }));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveContent = async () => {
    setBusy(true);
    try {
      const result = await siteAdminApi.saveContent(content);
      await reloadSection('content');
      toast.success(result.message || t({ ar: 'تم حفظ المحتوى', fr: 'Contenu enregistré', en: 'Content saved' }));
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setBusy(true);
    try {
      const result = await siteAdminApi.publish();
      if (result.ok) {
        toast.success(t({ ar: 'تم نشر التغييرات', fr: 'Modifications publiées', en: 'Changes published' }));
        await load();
      } else {
        toast.error(result.message || t({ ar: 'تعذّر النشر', fr: 'Publication impossible', en: 'Publish failed' }));
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const signOut = async () => {
    try { await siteAdminApi.logout(); } catch { /* ignore */ }
    window.location.href = '/';
  };

  const tabs: Array<{ id: Tab; label: string; icon: typeof Package }> = [
    { id: 'orders', label: t({ ar: 'الطلبات', fr: 'Commandes', en: 'Orders' }), icon: Package },
    { id: 'leads', label: t({ ar: 'الرسائل', fr: 'Messages', en: 'Messages' }), icon: MessageSquare },
    { id: 'products', label: t({ ar: 'المنتجات والأسعار', fr: 'Produits et prix', en: 'Products & prices' }), icon: Package },
    { id: 'content', label: t({ ar: 'المحتوى والألوان', fr: 'Contenu et couleurs', en: 'Content & colours' }), icon: Palette },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <RefreshCw className="h-5 w-5 animate-spin" />
          {t({ ar: 'جارٍ التحميل...', fr: 'Chargement...', en: 'Loading...' })}
        </div>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <LayoutDashboard className="h-6 w-6" />
          </span>
          <h1 className="mt-5 text-xl font-black">{t({ ar: 'لوحة إدارة الموقع', fr: 'Tableau de bord du site', en: 'Site dashboard' })}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{error}</p>
          <a href="/" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground">
            {t({ ar: 'العودة إلى المتجر', fr: 'Retour à la boutique', en: 'Back to the store' })}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-sm font-black text-primary-foreground">AOS</span>
            <div>
              <p className="text-sm font-black">{site.name}</p>
              <p className="text-xs text-muted-foreground" dir="ltr">{site.subdomain}.pages.dev</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={site.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold transition-colors hover:border-primary/40">
              <ExternalLink className="h-3.5 w-3.5" />
              {t({ ar: 'عرض الموقع', fr: 'Voir le site', en: 'View site' })}
            </a>
            <button type="button" onClick={signOut} className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground">
              <LogOut className="h-3.5 w-3.5" />
              {t({ ar: 'خروج', fr: 'Déconnexion', en: 'Sign out' })}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <h1 className="text-lg font-black">{t({ ar: 'لوحة إدارة موقعك', fr: 'Tableau de bord de votre site', en: 'Your site dashboard' })}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {t({ ar: 'رقم الطلب', fr: 'Référence', en: 'Reference' })} <span dir="ltr">{site.ref}</span>
              {' · '}
              {t({ ar: 'الحالة', fr: 'Statut', en: 'Status' })} <span dir="ltr">{site.status}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={publish}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Rocket className="h-4 w-4" />
            {t({ ar: 'نشر التغييرات', fr: 'Publier les changements', en: 'Publish changes' })}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-colors ${
                tab === id ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'orders' && (
          <section className="mt-5">
            {orders.length === 0 ? (
              <Empty label={t({ ar: 'لا توجد طلبات بعد.', fr: 'Aucune commande.', en: 'No orders yet.' })} />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {orders.map((order) => (
                  <article key={order.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-black">{order.customerName}</h2>
                        <p className="mt-1 text-xs text-muted-foreground" dir="ltr">{order.phone}</p>
                      </div>
                      <span className="text-sm font-black text-primary" dir="ltr">
                        {formatMoney(order.total, language)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">{order.address} — {order.wilaya}</p>
                    {order.note && <p className="mt-1 text-xs text-muted-foreground">{order.note}</p>}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <span className="text-[11px] text-muted-foreground">{formatDate(order.createdAt, language)}</span>
                      <select
                        value={order.status || 'new'}
                        onChange={(event) => changeStatus(order.id, event.target.value)}
                        disabled={busy}
                        className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-bold outline-none focus:border-primary"
                      >
                        {ORDER_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'leads' && (
          <section className="mt-5">
            {leads.length === 0 ? (
              <Empty label={t({ ar: 'لا توجد رسائل بعد.', fr: 'Aucun message.', en: 'No messages yet.' })} />
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {leads.map((lead) => (
                  <article key={lead.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-black">{lead.name}</h2>
                      <span className="text-[11px] text-muted-foreground">{formatDate(lead.createdAt, language)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed">{lead.message}</p>
                    <div className="mt-3 flex flex-wrap gap-3 border-t border-border pt-3 text-xs font-bold">
                      {lead.phone && <a href={`tel:${lead.phone}`} className="inline-flex items-center gap-1 text-primary" dir="ltr"><ArrowUpRight className="h-3.5 w-3.5" />{lead.phone}</a>}
                      {lead.email && <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-1 text-primary" dir="ltr"><Mail className="h-3.5 w-3.5" />{lead.email}</a>}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'products' && (
          <section className="mt-5">
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="text-sm font-black">{editingId ? t({ ar: 'تعديل المنتج', fr: 'Modifier le produit', en: 'Edit product' }) : t({ ar: 'منتج جديد', fr: 'Nouveau produit', en: 'New product' })}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label={t({ ar: 'الاسم', fr: 'Nom', en: 'Name' })} value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
                <Field label={t({ ar: 'السعر', fr: 'Prix', en: 'Price' })} value={draft.price} type="number" onChange={(value) => setDraft({ ...draft, price: value })} />
                <Field label={t({ ar: 'الصورة (رابط)', fr: 'Image (URL)', en: 'Image (URL)' })} value={draft.imageUrl} onChange={(value) => setDraft({ ...draft, imageUrl: value })} />
                <Field label={t({ ar: 'التصنيف', fr: 'Catégorie', en: 'Category' })} value={draft.category} onChange={(value) => setDraft({ ...draft, category: value })} />
                <label className="sm:col-span-2 block text-xs font-bold">
                  {t({ ar: 'الوصف', fr: 'Description', en: 'Description' })}
                  <textarea
                    rows={2}
                    value={draft.description || ''}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary"
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={submitProduct}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {t({ ar: 'حفظ المنتج', fr: 'Enregistrer', en: 'Save product' })}
                </button>
                {editingId && (
                  <button type="button" onClick={() => { setEditingId(null); setDraft({ name: '', description: '', price: '', imageUrl: '', category: '', isActive: true }); }} className="rounded-xl border border-border px-4 py-2 text-xs font-bold">
                    {t({ ar: 'إلغاء', fr: 'Annuler', en: 'Cancel' })}
                  </button>
                )}
              </div>
            </div>

            {products.length === 0 ? (
              <div className="mt-4"><Empty label={t({ ar: 'لا توجد منتجات بعد.', fr: 'Aucun produit.', en: 'No products yet.' })} /></div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <article key={product.id} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-black">{product.name}</h3>
                      <span className="text-sm font-black text-primary" dir="ltr">{formatMoney(product.price, language)}</span>
                    </div>
                    {product.description && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingId(product.id); setDraft({ name: product.name, description: product.description || '', price: String(product.price), imageUrl: product.imageUrl || '', category: product.category || '', isActive: product.isActive }); }}
                        className="rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold"
                      >
                        {t({ ar: 'تعديل', fr: 'Modifier', en: 'Edit' })}
                      </button>
                      <button type="button" onClick={() => removeProduct(product.id)} className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-3 py-1.5 text-[11px] font-bold text-rose-600">
                        <Trash2 className="h-3 w-3" />
                        {t({ ar: 'حذف', fr: 'Supprimer', en: 'Delete' })}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {tab === 'content' && (
          <section className="mt-5 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-black">{t({ ar: 'بيانات الموقع', fr: 'Informations du site', en: 'Site details' })}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label={t({ ar: 'اسم الموقع', fr: 'Nom du site', en: 'Site name' })} value={content.siteName} onChange={(value) => setContent({ ...content, siteName: value })} />
              <Field label={t({ ar: 'اسم النشاط', fr: 'Nom de l’activité', en: 'Business name' })} value={content.businessName} onChange={(value) => setContent({ ...content, businessName: value })} />
              <Field label={t({ ar: 'الشعار', fr: 'Slogan', en: 'Tagline' })} value={content.tagline} onChange={(value) => setContent({ ...content, tagline: value })} />
              <Field label={t({ ar: 'الهاتف', fr: 'Téléphone', en: 'Phone' })} value={content.phone} onChange={(value) => setContent({ ...content, phone: value })} />
              <Field label={t({ ar: 'واتساب', fr: 'WhatsApp', en: 'WhatsApp' })} value={content.whatsapp} onChange={(value) => setContent({ ...content, whatsapp: value })} />
              <Field label={t({ ar: 'البريد', fr: 'E-mail', en: 'Email' })} value={content.email} onChange={(value) => setContent({ ...content, email: value })} />
              <Field label={t({ ar: 'المدينة', fr: 'Ville', en: 'City' })} value={content.city} onChange={(value) => setContent({ ...content, city: value })} />
              <Field label={t({ ar: 'ساعات العمل', fr: 'Horaires', en: 'Opening hours' })} value={content.hours} onChange={(value) => setContent({ ...content, hours: value })} />
            </div>
            <label className="mt-3 block text-xs font-bold">
              {t({ ar: 'وصف الموقع', fr: 'Description', en: 'Description' })}
              <textarea rows={3} value={content.description || ''} onChange={(event) => setContent({ ...content, description: event.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary" />
            </label>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <ColorField label={t({ ar: 'اللون الأساسي', fr: 'Couleur principale', en: 'Primary colour' })} value={content.primaryColor} onChange={(value) => setContent({ ...content, primaryColor: value })} />
              <ColorField label={t({ ar: 'اللون الثانوي', fr: 'Couleur secondaire', en: 'Secondary colour' })} value={content.secondaryColor} onChange={(value) => setContent({ ...content, secondaryColor: value })} />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              {t({ ar: 'بعد الحفظ اضغط «نشر التغييرات» ليظهر التحديث على موقعك المنشور.', fr: 'Après la sauvegarde, cliquez sur «Publier les changements».', en: 'After saving, click “Publish changes” to update your live site.' })}
            </p>
            <button type="button" onClick={saveContent} disabled={busy} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground disabled:opacity-60">
              <Check className="h-4 w-4" />
              {t({ ar: 'حفظ المحتوى', fr: 'Enregistrer', en: 'Save content' })}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">{label}</div>;
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: any; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block text-xs font-bold">
      {label}
      <input type={type} value={value || ''} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-normal outline-none focus:border-primary" />
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold" dir="ltr">
      <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#0b5ed7'} onChange={(event) => onChange(event.target.value)} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent p-0" aria-label={label} />
      <span className="flex-1 text-start">{label}</span>
      <span className="font-mono text-[11px] text-muted-foreground">{value}</span>
    </label>
  );
}

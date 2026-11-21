import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { api, type SubscriptionMe } from '../utils/api';
import { getOrders } from '../utils/orderStorage';
import {
  Package, MapPin, Gift, LogOut, ChevronRight, Clock, CheckCircle, XCircle, Truck, Lock,
  Crown, Sparkles, CalendarClock, ArrowUpRight,
} from 'lucide-react';

const statusIcons: Record<string, any> = {
  new: Clock, processing: Truck, completed: CheckCircle, cancelled: XCircle,
};

const statusColors: Record<string, string> = {
  new: 'text-blue-600 bg-blue-500/10 dark:text-blue-400',
  processing: 'text-amber-600 bg-amber-500/10 dark:text-amber-400',
  completed: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400',
  cancelled: 'text-red-600 bg-red-500/10 dark:text-red-400',
};

function formatSubscriptionDate(value: string | null, language: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(
    language === 'ar' ? 'ar-DZ' : language === 'fr' ? 'fr-FR' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' },
  );
}

function subscriptionDaysLeft(value: string | null): number | null {
  if (!value) return null;
  const end = new Date(value).getTime();
  if (Number.isNaN(end)) return null;
  return Math.max(0, Math.ceil((end - Date.now()) / (24 * 60 * 60 * 1000)));
}

export function AccountDashboard({ onSignIn }: { onSignIn?: () => void } = {}) {
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<'orders' | 'addresses' | 'loyalty'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [subscription, setSubscription] = useState<SubscriptionMe['subscription']>(null);
  const [subscriptionLoaded, setSubscriptionLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.orders.list({ email: user.email })
      .then(all => setOrders(all))
      .catch(() => setOrders(getOrders().filter(o => o.email === user.email)));
    if (user.phone) api.loyalty.get(user.phone).then(setLoyalty).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setSubscriptionLoaded(false);
      return;
    }
    let active = true;
    api.subscription.me()
      .then((data) => {
        if (active) setSubscription(data.subscription);
      })
      .catch(() => {
        // The subscription API is optional for the account page; the plans page
        // still works if it is temporarily unreachable.
      })
      .finally(() => {
        if (active) setSubscriptionLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const subscriptionActive = Boolean(subscription?.active);
  const subscriptionDays = subscription ? subscriptionDaysLeft(subscription.endsAt) : null;

  if (!user) {
    return (
 <section className="py-20 min-h-screen bg-gradient-to-b from-slate-50/80 to-white/70 dark:from-transparent dark:to-transparent" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 <div className="max-w-md mx-auto px-4">
 <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
 <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5">
 <Lock className="w-8 h-8" />
            </div>
 <h1 className="text-2xl font-semibold text-foreground mb-3">
              {t({ ar: 'سجّل الدخول إلى حسابك', fr: 'Connectez-vous à votre compte', en: 'Sign in to your account' })}
            </h1>
 <p className="text-sm leading-relaxed text-muted-foreground mb-6">
              {t({
                ar: 'سجّل الدخول لتتابع طلباتك وتجمع نقاط الولاء. يمكنك أيضاً الشراء بدون حساب.',
                fr: 'Connectez-vous pour suivre vos commandes et cumuler des points. Vous pouvez aussi commander sans compte.',
                en: 'Sign in to track your orders and collect loyalty points. You can also order without an account.',
              })}
            </p>
            {onSignIn ? (
              <button
                type="button"
                onClick={onSignIn}
 className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t({ ar: 'تسجيل الدخول أو إنشاء حساب', fr: 'Se connecter ou créer un compte', en: 'Sign in or create an account' })}
 <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <a
                href="#account"
 className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t({ ar: 'تسجيل الدخول أو إنشاء حساب', fr: 'Se connecter ou créer un compte', en: 'Sign in or create an account' })}
 <ChevronRight className="w-4 h-4" />
              </a>
            )}
          </div>
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
 <section className="py-16 min-h-screen bg-gradient-to-b from-slate-50/80 to-white/70 dark:from-transparent dark:to-transparent" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 <div className="max-w-6xl mx-auto px-4">
 <div className="flex items-center justify-between mb-8">
          <div>
 <h1 className="text-3xl font-semibold text-foreground">{t({ ar: 'مرحباً', fr: 'Bonjour', en: 'Hello' })} {user.name}</h1>
 <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
 <button onClick={logout} className="flex items-center gap-2 rounded-full bg-red-500/10 text-red-400 px-5 py-2.5 text-sm font-semibold hover:bg-red-500/20 transition border border-red-500/20">
 <LogOut className="w-4 h-4" /> {t({ ar: 'تسجيل خروج', fr: 'Déconnexion', en: 'Logout' })}
          </button>
        </div>

        {subscriptionLoaded && (
          subscriptionActive && subscription ? (
 <div className="relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/12 via-teal-500/5 to-transparent p-5 sm:p-6 mb-6">
 <div className="pointer-events-none absolute -top-16 end-0 h-40 w-40 rounded-full bg-emerald-500/15 blur-3xl" aria-hidden="true" />
 <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-start gap-4">
 <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-500">
 <Crown className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
 <p className="text-[11px] font-semibold tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                      {t({ ar: 'اشتراك أدوات AI نشط', fr: 'Abonnement IA actif', en: 'AI subscription active' })}
                    </p>
 <p className="mt-1 text-lg font-semibold text-foreground">{t(subscription.planName)}</p>
 <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
 <span className="inline-flex items-center gap-1">
 <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                        {subscription.endsAt
                          ? t({
                              ar: `ينتهي في ${formatSubscriptionDate(subscription.endsAt, language)}`,
                              fr: `Se termine le ${formatSubscriptionDate(subscription.endsAt, language)}`,
                              en: `Ends on ${formatSubscriptionDate(subscription.endsAt, language)}`,
                            })
                          : t({ ar: 'اشتراك دائم', fr: 'Abonnement permanent', en: 'Lifetime subscription' })}
                      </span>
                      {subscriptionDays !== null && (
 <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          {t({
                            ar: `${subscriptionDays} يوم متبقٍ`,
                            fr: `${subscriptionDays} jours restants`,
                            en: `${subscriptionDays} days left`,
                          })}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
 <div className="flex flex-wrap gap-2 sm:justify-end">
 <a href="/ai-tools" className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700">
                    {t({ ar: 'استخدم الأدوات', fr: 'Utiliser les outils', en: 'Use the tools' })}
 <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
 <a href="/subscription" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                    {t({ ar: 'إدارة الاشتراك', fr: 'Gérer', en: 'Manage' })}
                  </a>
                </div>
              </div>
            </div>
          ) : (
 <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-6 mb-6">
 <div className="pointer-events-none absolute -top-16 end-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" aria-hidden="true" />
 <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-start gap-4">
 <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
 <Sparkles className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
 <p className="text-[11px] font-semibold tracking-[0.14em] text-primary">
                      {t({ ar: 'أدوات الذكاء الاصطناعي', fr: 'Outils IA', en: 'AI tools' })}
                    </p>
 <p className="mt-1 text-lg font-semibold text-foreground">
                      {t({ ar: '13 أداة جاهزة لبيع منتجاتك', fr: '13 outils prêts pour vos ventes', en: '13 tools ready for your sales' })}
                    </p>
 <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {t({
                        ar: 'جرّب أداة واحدة مجاناً، ثم افتح كل الأدوات بخطة شهرية أو سنوية.',
                        fr: 'Essayez un outil gratuitement, puis débloquez tout avec une offre mensuelle ou annuelle.',
                        en: 'Try one tool for free, then unlock everything with a monthly or yearly plan.',
                      })}
                    </p>
                  </div>
                </div>
 <div className="flex flex-wrap gap-2 sm:justify-end">
 <a href="/ai-tools" className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                    {t({ ar: 'جرّب الأدوات', fr: 'Essayer', en: 'Try the tools' })}
 <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
 <a href="/subscription" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                    {t({ ar: 'عرض الخطط', fr: 'Voir les offres', en: 'View plans' })}
                  </a>
                </div>
              </div>
            </div>
          )
        )}

 <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map(tabItem => {
            const Icon = tabItem.icon;
            return (
              <button key={tabItem.id} onClick={() => setTab(tabItem.id as any)}
 className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all border whitespace-nowrap ${tab === tabItem.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted text-foreground/70 border-border hover:bg-muted/80'}`}>
 <Icon className="w-4 h-4" /> {tabItem.label}
              </button>
            );
          })}
        </div>

        {tab === 'orders' && (
 <div className="space-y-3">
            {orders.length === 0 ? (
 <div className="text-center py-16 text-muted-foreground">
 <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{t({ ar: 'لا توجد طلبات بعد', fr: 'Aucune commande', en: 'No orders yet' })}</p>
              </div>
            ) : orders.map(order => {
              const StatusIcon = statusIcons[order.status] || Clock;
              return (
 <div key={order.id} className="rounded-2xl border border-border bg-card p-5">
 <div className="flex items-center justify-between mb-3">
 <span className="text-xs text-muted-foreground">#{order.id?.slice(0, 8)}</span>
 <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${statusColors[order.status] || 'text-muted-foreground bg-muted'}`}>
 <StatusIcon className="w-3.5 h-3.5" /> {order.status}
                    </span>
                  </div>
 <div className="text-sm text-foreground/80 mb-2">
                    {order.items?.map((item: any, i: number) => (
                      <span key={i}>{item.name || item.productName}{i < order.items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>
 <div className="flex items-center justify-between text-sm">
 <span className="text-primary font-semibold">{Number(order.total).toLocaleString()} د.ج</span>
 <span className="text-muted-foreground text-xs">{new Date(order.createdAt || order.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'addresses' && (
 <div className="text-center py-16 text-muted-foreground">
 <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t({ ar: 'العناوين المحفوظة', fr: 'Adresses enregistrées', en: 'Saved addresses' })}</p>
 <p className="text-sm mt-2 text-muted-foreground">{t({ ar: 'ستتم إضافة العناوين عند الطلب', fr: 'Les adresses seront ajoutées lors de la commande', en: 'Addresses will be added during checkout' })}</p>
          </div>
        )}

        {tab === 'loyalty' && (
 <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
 <Gift className="w-16 h-16 text-amber-400 mx-auto mb-4" />
 <p className="text-4xl font-semibold text-foreground mb-2">{loyalty?.points || 0}</p>
 <p className="text-sm text-muted-foreground">{t({ ar: 'نقطة ولاء', fr: 'Points de fidélité', en: 'Loyalty points' })}</p>
 <p className="text-xs text-muted-foreground mt-3">{t({ ar: 'كل 100 د.ج = نقطة واحدة', fr: '100 DZD = 1 point', en: '100 DZD = 1 point' })}</p>
          </div>
        )}
      </div>
    </section>
  );
}

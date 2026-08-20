import { Suspense, lazy, useState, useEffect } from 'react';
import { isMaintenanceMode, getMaintenanceMessage } from './utils/maintenanceStorage';
import { initCrossTabSync } from './utils/sync';
import { Wrench, Construction } from 'lucide-react';
import { Toaster } from 'sonner';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Products } from './components/Products';
import { Services } from './components/Services';
import { ServiceBooking } from './components/ServiceBooking';
import { WhyUs } from './components/WhyUs';
import { FAQ } from './components/FAQ';
import { Contact } from './components/Contact';
import { Wishlist } from './components/Wishlist';
import { Footer } from './components/Footer';
import { NewsletterForm } from './components/NewsletterForm';
import { AnnouncementBar, TrustBadges } from './components/AnnouncementBar';
import { StatsSection } from './components/StatsSection';
import { Testimonials } from './components/Testimonials';
import { ScrollProgress } from './components/ScrollProgress';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { ScrollToTop } from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NotFound } from './components/NotFound';
import { SkeletonCard } from './components/SkeletonCard';
import { OrderTracking } from './components/OrderTracking';
import { startAutoSync } from './utils/globalSync';
import { getSiteSettings } from './utils/siteSettingsStorage';

const Admin = lazy(() => import('./components/Admin').then(m => ({ default: m.Admin })));
const OrderForm = lazy(() => import('./components/OrderForm').then(m => ({ default: m.OrderForm })));
const AboutPage = lazy(() => import('./components/AboutPage').then(m => ({ default: m.AboutPage })));
const TermsPage = lazy(() => import('./components/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./components/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const AccountDashboard = lazy(() => import('./components/AccountDashboard').then(m => ({ default: m.AccountDashboard })));
const LoginPage = lazy(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
const WABubble = lazy(() => import('./components/WABubble').then(m => ({ default: m.WABubble })));
const AIAssistant = lazy(() => import('./components/AIAssistant').then(m => ({ default: m.AIAssistant })));
const LiquidEther = lazy(() => import('./components/LiquidEther').then(m => ({ default: m.default })));

const LIQUID_COLORS: string[] = ['#1d4ed8', '#3b82f6', '#60a5fa', '#22d3ee'];

function LiquidBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ touchAction: 'pan-y' }} aria-hidden="true">
      <LiquidEther
        colors={LIQUID_COLORS}
        mouseForce={12}
        cursorSize={110}
        resolution={0.4}
        autoDemo
        autoSpeed={0.5}
        autoIntensity={1.9}
        takeoverDuration={0.25}
        autoResumeDelay={2500}
        autoRampDuration={0.6}
        isViscous={false}
        iterationsPoisson={24}
        BFECC
      />
    </div>
  );
}

function AdminFallback() {
  return (
    <section className="py-20 bg-gradient-to-b from-slate-50/80 to-white/70 dark:from-slate-900/30 dark:to-slate-950/70">
      <div className="max-w-6xl mx-auto px-4">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
          <div className="h-64 bg-muted rounded-2xl" />
        </div>
      </div>
    </section>
  );
}

function AdminLoadingPage() {
  const lang = typeof window !== 'undefined'
    ? (localStorage.getItem('language') || (navigator.language.startsWith('ar') ? 'ar' : navigator.language.startsWith('fr') ? 'fr' : 'en'))
    : 'en';
  const t = (ar: string, fr: string, en: string) => lang === 'ar' ? ar : lang === 'fr' ? fr : en;
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-700" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
      </div>
      <div className="relative z-10 text-center px-6">
        <div className="relative mb-8 inline-block">
          <div className="w-24 h-24 rounded-[28px] bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl shadow-blue-500/10">
            <span className="text-3xl font-black bg-gradient-to-br from-sky-300 to-cyan-500 bg-clip-text text-transparent">AOS</span>
          </div>
          <div className="absolute inset-0 rounded-[28px] ring-1 ring-sky-400/30 animate-ping" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t('لوحة التحكم', "Panneau d'administration", 'Admin Panel')}</h1>
        <p className="text-blue-200/60 text-sm mb-8">{t('جارٍ التحميل...', 'Chargement...', 'Loading...')}</p>
        <div className="w-56 mx-auto h-1.5 rounded-full bg-white/10 overflow-hidden" dir="ltr">
          <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-400 animate-[aos-loading_1.2s_ease-in-out_infinite]" />
        </div>
        <div className="mt-8 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce delay-150" />
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce delay-300" />
        </div>
      </div>
      <style>{`@keyframes aos-loading { 0% { margin-left: -50%; } 100% { margin-left: 100%; } }`}</style>
    </div>
  );
}

export default function App() {
  const [hash, setHash] = useState(() => (typeof window !== 'undefined' ? window.location.hash : ''));
  const is404 = typeof window !== 'undefined' && hash && !['#products', '#booking', '#services', '#admin', '#contact', '#checkout', '#about', '#terms', '#privacy', '#loyalty', '#account', '#wishlist', '#faq'].includes(hash);
  const [showLogin, setShowLogin] = useState(false);
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const sectionHash = ['#products', '#booking', '#services', '#contact', '#wishlist', '#faq'];
    if (sectionHash.includes(hash)) {
      const id = hash.slice(1);
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [hash]);

  useEffect(() => {
    initCrossTabSync();
    setMaintenance(isMaintenanceMode());
    startAutoSync();
    const handleChange = () => {
      setMaintenance(isMaintenanceMode());
    };
    window.addEventListener('aos:data-changed', handleChange);
    return () => window.removeEventListener('aos:data-changed', handleChange);
  }, []);

  useEffect(() => {
    const preload = () => {
      import('./components/Admin');
      import('./components/OrderForm');
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(preload, { timeout: 5000 });
    } else {
      setTimeout(preload, 3000);
    }
  }, []);

  useEffect(() => {
    const updateTitle = () => {
      const hash = window.location.hash;
      const lang = (localStorage.getItem('language') || 'en') as 'ar' | 'fr' | 'en';
      const titles: Record<string, Record<string, string>> = {
        '#about':    { ar: 'من نحن', fr: 'À propos', en: 'About Us' },
        '#terms':    { ar: 'الشروط والأحكام', fr: 'Conditions', en: 'Terms & Conditions' },
        '#privacy':  { ar: 'سياسة الخصوصية', fr: 'Confidentialité', en: 'Privacy Policy' },
        '#checkout': { ar: 'إتمام الطلب', fr: 'Finaliser la commande', en: 'Checkout' },
        '#loyalty':  { ar: 'برنامج الولاء', fr: 'Programme de fidélité', en: 'Loyalty Program' },
        '#account':  { ar: 'حسابي', fr: 'Mon compte', en: 'My Account' },
        '#admin':    { ar: 'لوحة الأدمين', fr: 'Administration', en: 'Admin Panel' },
        '#products': { ar: 'المنتجات', fr: 'Produits', en: 'Products' },
        '#services': { ar: 'الخدمات', fr: 'Services', en: 'Services' },
        '#contact':  { ar: 'اتصل بنا', fr: 'Contact', en: 'Contact Us' },
      };
      const name = titles[hash]?.[lang] || 'AOS Tech Store';
      document.title = `${name} | AOS Tech Store`;
    };
    updateTitle();
    window.addEventListener('hashchange', updateTitle);
    return () => window.removeEventListener('hashchange', updateTitle);
  }, []);

  if (maintenance && hash !== '#admin') {
    const savedLang = localStorage.getItem('language') || 'ar';
    const lang = savedLang as 'ar' | 'fr' | 'en';
    const msg = getMaintenanceMessage();
    const slogan = msg?.[lang] || msg?.ar || msg?.fr || msg?.en || '';
    const t = (ar: string, fr: string, en: string) => lang === 'ar' ? ar : lang === 'fr' ? fr : en;
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 flex items-center justify-center" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />
        </div>
        <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
          <div className="relative mb-10">
            <div className="w-28 h-28 mx-auto rounded-[32px] bg-gradient-to-br from-sky-500/30 to-cyan-500/30 backdrop-blur-xl border border-sky-500/20 flex items-center justify-center shadow-2xl shadow-sky-500/10">
              <Wrench className="w-14 h-14 text-sky-400 animate-bounce" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-transparent via-sky-400/50 to-transparent rounded-full blur-sm" />
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold mb-6 bg-gradient-to-r from-white via-sky-200 to-white bg-clip-text text-transparent">
            {t('قيد الصيانة', 'En Maintenance', 'Under Maintenance')}
          </h1>
          <div className="w-24 h-1 mx-auto mb-8 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500" />
          {slogan ? (
            <p className="text-xl sm:text-2xl text-blue-100/80 leading-relaxed mb-6 font-medium">
              {slogan}
            </p>
          ) : (
            <p className="text-lg sm:text-xl text-blue-100/60 leading-relaxed mb-6">
              {t('نعمل على تحسين تجربتك. سنعود قريباً!', 'Nous améliorons votre expérience. À très bientôt!', "We're improving your experience. Be back soon!")}
            </p>
          )}
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            <span className="text-blue-200/50 text-sm">
              {t('جاري التحديث...', 'Mise à jour en cours...', 'Updating...')}
            </span>
          </div>
          <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2" /></svg>
            </div>
            <div className="text-left">
              <p className="text-xs text-blue-300/60">{t('للتواصل', 'Contact', 'Contact')}</p>
              <a href={`tel:${getSiteSettings().contact.phone}`} className="text-sm font-semibold text-white hover:text-amber-400 transition-colors">{getSiteSettings().contact.phoneDisplay}</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (is404) return <NotFound />;

  const currentHash = hash;
  const isPage = ['#about', '#terms', '#privacy', '#checkout', '#loyalty', '#account'].includes(currentHash);

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
        <CartProvider>
          <ErrorBoundary>
            {hash === '#admin' ? (
              <div className="min-h-screen">
                <Suspense fallback={<AdminLoadingPage />}>
                  <Admin />
                </Suspense>
                <ScrollToTop />
              </div>
            ) : (
            <div className="min-h-screen relative">
              <Suspense fallback={null}>
                <LiquidBackground />
              </Suspense>
              <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none">
                {typeof window !== 'undefined' && (navigator.language.startsWith('ar') ? 'تخطى إلى المحتوى' : navigator.language.startsWith('fr') ? 'Aller au contenu' : 'Skip to content')}
              </a>
              {!isPage && <AnnouncementBar />}
              <ScrollProgress />
              <Header onLoginClick={() => setShowLogin(true)} />
              <main id="main-content">
                {isPage ? (
                  <>
                    {hash === '#about' && (
                      <Suspense fallback={<AdminFallback />}>
                        <AboutPage />
                      </Suspense>
                    )}
                    {hash === '#terms' && (
                      <Suspense fallback={<AdminFallback />}>
                        <TermsPage />
                      </Suspense>
                    )}
                    {hash === '#privacy' && (
                      <Suspense fallback={<AdminFallback />}>
                        <PrivacyPage />
                      </Suspense>
                    )}
                    {hash === '#checkout' && (
                      <Suspense fallback={<AdminFallback />}>
                        <OrderForm />
                      </Suspense>
                    )}
                    {hash === '#loyalty' && (
                      <Suspense fallback={<AdminFallback />}>
                        <AccountDashboard />
                      </Suspense>
                    )}
                    {hash === '#account' && (
                      <Suspense fallback={<AdminFallback />}>
                        <AccountDashboard />
                      </Suspense>
                    )}
                  </>
                ) : (
                  <>
                    <Hero />
                    <StatsSection />
                    <Products />
                    <Wishlist />
                    <ServiceBooking />
                    <Services />
                    <WhyUs />
                    <Testimonials />
                    <FAQ />
                    <Contact />
                    <Suspense fallback={<div className="py-20 text-center text-muted-foreground animate-pulse">Loading...</div>}>
                      <OrderForm />
                    </Suspense>
                    <OrderTracking />
                    <NewsletterForm />
                    <Footer />
                  </>
                )}
              </main>
              <ScrollToTop />
              <Suspense fallback={null}><WABubble /></Suspense>
              <Suspense fallback={null}><AIAssistant /></Suspense>
            </div>
            )}
            {showLogin && (
              <Suspense fallback={null}>
                <LoginPage onClose={() => setShowLogin(false)} />
              </Suspense>
            )}
          </ErrorBoundary>
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              duration: 3000,
            }}
          />
        </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

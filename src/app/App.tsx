import { Suspense, lazy, useState, useEffect } from 'react';
import { isMaintenanceMode } from './utils/maintenanceStorage';
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
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { ScrollToTop } from './components/ScrollToTop';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WABubble } from './components/WABubble';
import { NotFound } from './components/NotFound';
import { SkeletonCard } from './components/SkeletonCard';
import { ParticlesBg } from './components/ParticlesBg';
import { LoginPage } from './components/LoginPage';
import { AIAssistant } from './components/AIAssistant';
import { OrderTracking } from './components/OrderTracking';
import { SpeedInsights } from '@vercel/speed-insights/react';

const Admin = lazy(() => import('./components/Admin').then(m => ({ default: m.Admin })));
const OrderForm = lazy(() => import('./components/OrderForm').then(m => ({ default: m.OrderForm })));

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

export default function App() {
  const is404 = typeof window !== 'undefined' && window.location.hash && !['#products', '#booking', '#services', '#admin', '#contact', '#checkout'].includes(window.location.hash);
  const [showLogin, setShowLogin] = useState(false);
  const [maintenance, setMaintenance] = useState(false);

  useEffect(() => {
    setMaintenance(isMaintenanceMode());
    const check = () => setMaintenance(isMaintenanceMode());
    window.addEventListener('aos:data-changed', check);
    return () => window.removeEventListener('aos:data-changed', check);
  }, []);

  if (maintenance && typeof window !== 'undefined' && window.location.hash !== '#admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
        <div className="text-center px-4">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-4xl">🔧</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Maintenance Mode</h1>
          <p className="text-lg text-muted-foreground">We'll be back soon!</p>
        </div>
      </div>
    );
  }

  if (is404) return <NotFound />;
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
        <CartProvider>
          <ErrorBoundary>
            <div className="min-h-screen">
              <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg focus:outline-none">
                {typeof window !== 'undefined' && (navigator.language.startsWith('ar') ? 'تخطى إلى المحتوى' : navigator.language.startsWith('fr') ? 'Aller au contenu' : 'Skip to content')}
              </a>
              <ParticlesBg />
              <Header onLoginClick={() => setShowLogin(true)} />
              <main id="main-content">
                <Hero />
                <Products />
                <Wishlist />
                <ServiceBooking />
                <Services />
                <Suspense fallback={<AdminFallback />}>
                  <Admin />
                </Suspense>
                <WhyUs />
                <FAQ />
                <Contact />
                <Suspense fallback={<div className="py-20 text-center text-muted-foreground animate-pulse">Loading...</div>}>
                  <OrderForm />
                </Suspense>
                <OrderTracking />
                <NewsletterForm />
                <Footer />
              </main>
              <ScrollToTop />
              <WABubble />
              <AIAssistant />
            </div>
            {showLogin && <LoginPage onClose={() => setShowLogin(false)} />}
          </ErrorBoundary>
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              duration: 3000,
            }}
          />
          <SpeedInsights />
        </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
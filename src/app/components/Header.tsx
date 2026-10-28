import { Phone, Menu, X, ShoppingCart, User, LogOut, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Cart } from './CartView';
import { motion, AnimatePresence } from 'motion/react';
import { getSiteSettings } from '../utils/siteSettingsStorage';
import { brand } from '../config/brand';

export function Header({ onLoginClick }: { onLoginClick?: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [logoHits, setLogoHits] = useState(0);
  const [settings, setSettings] = useState(() => getSiteSettings());
  const [scrolled, setScrolled] = useState(false);
  const { t, language } = useLanguage();
  const { items } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const itemCount = items.length;

  useEffect(() => {
    const refresh = () => setSettings(getSiteSettings());
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = () => {
    const next = logoHits + 1;
    if (next >= 5) {
      setLogoHits(0);
      window.location.hash = 'admin';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      setLogoHits(next);
      setTimeout(() => setLogoHits(0), 2000);
    }
  };

  const navLinks = settings.settings.headerNavLinks;

  return (
    <header className={`sticky top-0 z-[var(--z-header)] transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-border/50' : 'bg-white dark:bg-slate-900 border-b border-border/30'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0" onClick={(e) => { e.preventDefault(); handleLogoClick(); }}>
            <img src={brand.logo} alt={brand.name} className="h-10 md:h-12 w-auto" width="48" height="48" />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                className="px-4 py-2 text-sm font-semibold text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-lg transition-all duration-200"
              >
                {t(link.label)}
              </a>
            ))}
            <a
              href="#web"
              className="hidden xl:inline-flex items-center px-3 py-2 text-sm font-bold text-primary hover:bg-primary/5 rounded-lg transition-all duration-200"
            >
              {t({ ar: 'إنشاء المواقع', fr: 'Création de sites', en: 'Web Design' })}
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium bg-primary/5 text-primary px-3 py-2 rounded-lg">
              <Phone className="w-4 h-4" />
              <span className="font-bold whitespace-nowrap">{settings.contact.phoneDisplay}</span>
            </div>

            {user && (
              <a href="#account" className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                <User className="w-4 h-4" />
                {t({ ar: 'حسابي', fr: 'Mon Compte', en: 'My Account' })}
              </a>
            )}

            <LanguageSwitcher />

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg hover:bg-primary/5 transition-colors"
              aria-label={theme === 'dark' ? t({ ar: 'الوضع الفاتح', fr: 'Mode clair', en: 'Light mode' }) : t({ ar: 'الوضع الداكن', fr: 'Mode sombre', en: 'Dark mode' })}
              title={theme === 'dark' ? t({ ar: 'الوضع الفاتح', fr: 'Mode clair', en: 'Light mode' }) : t({ ar: 'الوضع الداكن', fr: 'Mode sombre', en: 'Dark mode' })}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5 text-foreground/70" /> : <Moon className="w-5 h-5 text-foreground/70" />}
            </button>

            <button
              onClick={() => setCartOpen(!cartOpen)}
              className="relative p-2.5 rounded-lg hover:bg-primary/5 transition-colors"
              aria-label={t({ ar: 'سلة التسوق', fr: 'Panier', en: 'Cart' })}
            >
              <ShoppingCart className="w-5 h-5 text-foreground/70" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              )}
            </button>

            <a
              href="#checkout"
              className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/30"
            >
              {t({ ar: 'اطلب الآن', fr: 'Commander', en: 'Order Now' })}
            </a>
          </div>

          {/* Mobile Actions */}
          <div className="flex lg:hidden items-center gap-1 min-[480px]:gap-2">
            <LanguageSwitcher />
            <button
              onClick={toggleTheme}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label={theme === 'dark' ? t({ ar: 'الوضع الفاتح', fr: 'Mode clair', en: 'Light mode' }) : t({ ar: 'الوضع الداكن', fr: 'Mode sombre', en: 'Dark mode' })}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label={t({ ar: 'سلة التسوق', fr: 'Panier', en: 'Cart' })}
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <a
              href={`tel:${settings.contact.phone}`}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-primary text-white rounded-lg"
              aria-label={t({ ar: 'اتصل بنا', fr: 'Appelez-nous', en: 'Call us' })}
            >
              <Phone className="w-5 h-5" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
              aria-label={t({ ar: 'القائمة', fr: 'Menu', en: 'Menu' })}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-t border-border overflow-hidden"
              aria-label={t({ ar: 'القائمة الرئيسية', fr: 'Menu principal', en: 'Main menu' })}
            >
              <div className="py-4 space-y-1">
                {user && (
                  <div className="flex items-center gap-3 px-4 py-3 mb-2 bg-muted rounded-lg mx-2">
                    <User className="w-5 h-5 text-primary" />
                    <span className="font-semibold truncate">{user.name}</span>
                    {isAdmin && (
                      <a href="#hqpanel" className="text-sm text-primary font-bold ms-auto">
                        {t({ ar: 'أدمين', fr: 'Admin', en: 'Admin' })}
                      </a>
                    )}
                    <button onClick={logout} className="p-1 hover:bg-background rounded" title={t({ ar: 'تسجيل خروج', fr: 'Déconnexion', en: 'Logout' })}>
                      <LogOut className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}
                {!user && (
                  <button
                    onClick={() => { onLoginClick?.(); setMobileMenuOpen(false); }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold bg-muted rounded-lg hover:bg-muted/80 transition-colors mx-2 mb-2"
                  >
                    <User className="w-5 h-5 text-primary" />
                    {t({ ar: 'تسجيل الدخول', fr: 'Connexion', en: 'Sign In' })}
                  </button>
                )}
                {navLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.href}
                    className="block px-4 py-3 text-base font-semibold text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors mx-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t(link.label)}
                  </a>
                ))}
                <a
                  href="#web"
                  className="block px-4 py-3 text-base font-bold text-primary hover:bg-primary/5 rounded-lg transition-colors mx-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {t({ ar: 'إنشاء المواقع', fr: 'Création de sites', en: 'Web Design' })}
                </a>
                <div className="pt-2 px-2">
                  <a
                    href="#checkout"
                    className="block w-full text-center bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary/90 transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t({ ar: 'اطلب الآن', fr: 'Commander', en: 'Order Now' })}
                  </a>
                </div>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Cart Drawer */}
        <AnimatePresence>
          {cartOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[var(--z-overlay)]"
                onClick={() => setCartOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, x: language === 'ar' ? -50 : 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: language === 'ar' ? -50 : 50 }}
                className={`fixed top-0 start-0 end-0 ms-auto w-full max-w-sm h-full bg-white dark:bg-slate-900 shadow-2xl z-[var(--z-modal)] overflow-y-auto`}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">
                      {t({ ar: 'سلة التسوق', fr: 'Panier', en: 'Shopping Cart' })}
                    </h3>
                    <button
                      onClick={() => setCartOpen(false)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-muted rounded-lg transition-colors"
                      aria-label={t({ ar: 'إغلاق', fr: 'Fermer', en: 'Close' })}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <Cart />
                  <a
                    href="#checkout"
                    onClick={() => setCartOpen(false)}
                    className="block mt-6 w-full bg-primary text-white text-center py-3 rounded-lg font-bold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
                  >
                    {t({ ar: 'إتمام الطلب', fr: 'Finaliser la commande', en: 'Checkout' })}
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

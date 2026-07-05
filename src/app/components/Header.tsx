import { Phone, Menu, X, ShoppingCart, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { Cart } from './CartView';
import { motion, AnimatePresence } from 'motion/react';
import { getSiteSettings } from '../utils/siteSettingsStorage';

export function Header({ onLoginClick }: { onLoginClick?: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [logoHits, setLogoHits] = useState(0);
  const [settings, setSettings] = useState(() => getSiteSettings());
  const { t, language } = useLanguage();
  const { items } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const itemCount = items.length;

  useEffect(() => {
    const refresh = () => setSettings(getSiteSettings());
    window.addEventListener('aos:data-changed', refresh);
    return () => window.removeEventListener('aos:data-changed', refresh);
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

  return (
    <header className="bg-background/95 backdrop-blur-sm shadow-md sticky top-0 z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <a href="/" className="block" onClick={(e) => { e.preventDefault(); handleLogoClick(); }}>
              <img src={settings.settings.logoUrl} alt="AOS" className="h-16 md:h-20 w-auto" />
            </a>
          </div>

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center space-x-6 space-x-reverse">
            {settings.settings.headerNavLinks.map((link, idx) => (
              <a key={idx} href={link.href} className="text-base font-medium hover:text-primary transition-colors">
                {t(link.label)}
              </a>
            ))}
            <div className="flex items-center space-x-2 space-x-reverse text-base font-medium bg-muted px-4 py-2.5 rounded-lg">
              <Phone className="w-5 h-5 text-primary" />
              <span className="font-semibold">{settings.contact.phoneDisplay}</span>
            </div>
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <LanguageSwitcher />
            <ThemeToggle />
          </nav>

          {/* Mobile Menu */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setCartOpen(!cartOpen)}
              className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <a
              href={`tel:${settings.contact.phone}`}
              className="bg-primary text-primary-foreground p-2 rounded-lg"
            >
              <Phone className="w-5 h-5" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden mt-4 pt-4 border-t border-border space-y-3 overflow-hidden"
          >
            <div className="mb-3 flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-3 text-base font-medium bg-muted px-4 py-3 rounded-lg">
                <User className="w-5 h-5 text-primary" />
                <span className="font-semibold truncate max-w-[140px]">{user.name}</span>
                {isAdmin && (
                  <a href="#admin" className="text-sm text-primary font-bold ml-2">
                    {t({ ar: 'أدمين', fr: 'Admin', en: 'Admin' })}
                  </a>
                )}
                <button onClick={logout} className="p-2 hover:bg-background rounded" title={t({ ar: 'تسجيل خروج', fr: 'Déconnexion', en: 'Logout' })}>
                  <LogOut className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button onClick={onLoginClick} className="flex items-center gap-3 text-base font-semibold bg-muted px-4 py-3 rounded-lg hover:bg-muted/80 transition-colors w-full justify-center">
                <User className="w-5 h-5 text-primary" />
                <span>{t({ ar: 'دخول', fr: 'Connexion', en: 'Sign In' })}</span>
              </button>
            )}
            <LanguageSwitcher />
              <ThemeToggle />
            </div>
            {settings.settings.headerNavLinks.map((link, idx) => (
              <a key={idx} href={link.href}
                className="block py-3 text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}>
                {t(link.label)}
              </a>
            ))}
          </motion.nav>
        )}
        </AnimatePresence>

        {/* Cart Modal */}
        <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setCartOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              className="fixed top-20 right-0 w-full max-w-sm bg-background rounded-b-2xl shadow-2xl z-50 max-h-96 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold">
                    {t({ ar: '🛒 عربة التسويق', fr: '🛒 Panier', en: '🛒 Shopping Cart' })}
                  </h3>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <Cart />
                <a
                  href="#checkout"
                  onClick={() => setCartOpen(false)}
                  className="block mt-4 w-full bg-primary text-primary-foreground text-center py-3 rounded-lg font-semibold hover:bg-primary/90 transition-all"
                >
                  {t({ ar: 'إتمام الطلب', fr: 'Finaliser', en: 'Checkout' })}
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

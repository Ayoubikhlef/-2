import { useEffect, useMemo, useState } from 'react';
import { Heart, Trash2, ArrowRightCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { products as defaultProducts, type Product } from '../data/products';
import { getWishlist, toggleWishlist, clearWishlist } from '../utils/wishlistStorage';
import { motion, AnimatePresence } from 'motion/react';

export function Wishlist() {
  const { t, language } = useLanguage();
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  useEffect(() => {
    setWishlistIds(getWishlist());
  }, []);

  const wishlistItems = useMemo(() => {
    const existingProducts = defaultProducts.filter((product) => wishlistIds.includes(product.id));
    return existingProducts;
  }, [wishlistIds]);

  const handleToggle = (productId: number) => {
    toggleWishlist(productId);
    setWishlistIds(getWishlist());
  };

  const handleClear = () => {
    clearWishlist();
    setWishlistIds([]);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.6 }}
      id="wishlist" className="py-20 bg-gradient-to-b from-slate-50/80 to-white/80 dark:from-slate-950/80 dark:to-slate-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <h2 className="mb-3">
              {t({ ar: 'قائمة المفضلة', fr: 'Ma liste de souhaits', en: 'Wishlist' })}
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              {t({
                ar: 'احفظ المنتجات التي تريدها للرجوع إليها لاحقاً أو لإرسالها إلى عملائك.',
                fr: 'Enregistrez les produits que vous aimez pour y revenir plus tard ou les partager.',
                en: 'Save products you love to revisit later or share with others.'
              })}
            </p>
          </div>

          {wishlistItems.length > 0 && (
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold text-muted-foreground hover:bg-muted transition-all"
            >
              <Trash2 className="w-4 h-4" />
              {t({ ar: 'مسح المفضلة', fr: 'Vider la liste', en: 'Clear wishlist' })}
            </button>
          )}
        </div>

        {wishlistItems.length === 0 ? (
          <div className="rounded-[32px] border border-border bg-card p-12 text-center shadow-lg">
            <Heart className="mx-auto mb-6 w-12 h-12 text-primary" />
            <h3 className="text-2xl font-bold mb-3">
              {t({ ar: 'لا يوجد عناصر بعد', fr: 'Aucun article pour le moment', en: 'No items yet' })}
            </h3>
            <p className="text-muted-foreground mb-6">
              {t({
                ar: 'اضغط على رمز القلب في صفحة المنتجات لحفظ العناصر التي تفضلها.',
                fr: 'Cliquez sur le cœur dans la page produits pour enregistrer vos favoris.',
                en: 'Tap the heart on the product page to save your favorite items.'
              })}
            </p>
            <a
              href="#products"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
            >
              {t({ ar: 'عرض المنتجات', fr: 'Voir les produits', en: 'View products' })}
              <ArrowRightCircle className="w-4 h-4" />
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {wishlistItems.map((product) => (
              <AnimatePresence key={product.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="group overflow-hidden rounded-3xl border border-border bg-card shadow-lg transition-all hover:shadow-2xl"
                >
                  <div className="relative h-56 overflow-hidden bg-muted">
                    <img
                      src={product.image}
                      alt={language === 'ar' ? product.nameAr : language === 'fr' ? product.nameFr : product.nameEn}
                      className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute right-4 top-4 rounded-full bg-background/90 p-2 shadow-sm">
                      <button
                        onClick={() => handleToggle(product.id)}
                        aria-label={t({ ar: 'إزالة من المفضلة', fr: 'Retirer des favoris', en: 'Remove from wishlist' })}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Heart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2">
                      {language === 'ar' ? product.nameAr : language === 'fr' ? product.nameFr : product.nameEn}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {language === 'ar' ? product.descAr : language === 'fr' ? product.descFr : product.descEn}
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-lg text-primary">
                        {product.price.toLocaleString()} د.ج
                      </span>
                      <a
                        href="#products"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
                      >
                        {t({ ar: 'اطلب الآن', fr: 'Commander', en: 'Order' })}
                      </a>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}

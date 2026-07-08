import { useState, useMemo, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, X, User, Phone, Mail, MapPin, CheckCircle, Info, Heart, Search, Camera, Share2, Eye, Banknote, CreditCard, Smartphone } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { products as defaultProducts, wilayas, getMunicipalities, type Product } from '../data/products';
import { getStoredProducts, loadProductsFromServer } from '../utils/productStorage';
import { saveOrder } from '../utils/orderStorage';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { SkeletonGrid } from './SkeletonCard';
import { getWishlist, toggleWishlist, isInWishlist } from '../utils/wishlistStorage';
import { VisualSearch } from './VisualSearch';
import { Reviews } from './Reviews';
import { FlashSaleTimer } from './FlashSaleTimer';
import { ProductComparison } from './ProductComparison';
import { InstallmentCalculator } from './InstallmentCalculator';
import { ProductGallery } from './ProductGallery';
import { SearchSuggestions } from './SearchSuggestions';
import { ProductSuggestions } from './ProductSuggestions';

function loadProducts() {
  return getStoredProducts(defaultProducts);
}

type OrderData = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  wilaya: string;
  municipality: string;
  quantity: number;
  note: string;
};

const categoryLabels: Record<string, { ar: string; fr: string; en: string }> = {
  all: { ar: 'الكل', fr: 'Tous', en: 'All' },
  mice: { ar: 'فأرة', fr: 'Souris', en: 'Mouse' },
  monitors: { ar: 'شاشات', fr: 'Moniteurs', en: 'Monitors' },
  storage: { ar: 'تخزين', fr: 'Stockage', en: 'Storage' },
  printers: { ar: 'طابعات', fr: 'Imprimantes', en: 'Printers' },
  accessories: { ar: 'إكسسوارات', fr: 'Accessoires', en: 'Accessories' },
  laptops: { ar: 'لابتوبات', fr: 'Ordinateurs', en: 'Laptops' },
  networking: { ar: 'شبكات', fr: 'Réseaux', en: 'Networking' },
};

export function Products() {
  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const perPage = 12;

  useEffect(() => {
    const refresh = () => setProducts(loadProducts());
    window.addEventListener('aos:data-changed', refresh);
    loadProductsFromServer(defaultProducts).then(setProducts);
    return () => window.removeEventListener('aos:data-changed', refresh);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => setPage(1), [debouncedSearch, activeCategory]);

  useEffect(() => setLoading(false), []);

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => !p.hidden);
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.nameAr.includes(q) ||
          p.nameFr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, debouncedSearch]);
  const suggestions = useMemo(() => {
    if (!debouncedSearch.trim()) return [];
    const q = debouncedSearch.toLowerCase();
    return products.filter(p => !p.hidden && (
      p.nameAr.includes(q) ||
      p.nameFr.toLowerCase().includes(q) ||
      p.nameEn.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q)
    )).slice(0, 6);
  }, [debouncedSearch, products]);
  const totalPages = Math.ceil(filteredProducts.length / perPage);
  const paginatedProducts = filteredProducts.slice((page - 1) * perPage, page * perPage);
  const [orderData, setOrderData] = useState<OrderData>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    wilaya: '1',
    municipality: '1',
    quantity: 1,
    note: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'cib' | 'edahabia' | 'baridi'>('cod');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: 'percentage' | 'fixed' } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const updateQuantity = (productId: number, delta: number) => {
    const current = quantities[productId] || 1;
    const newQty = Math.max(1, current + delta);
    setQuantities((prev) => ({ ...prev, [productId]: newQty }));
  };

  const openProductDetails = (product: Product) => {
    setViewingProduct(product);
  };

  const closeProductDetails = () => {
    setViewingProduct(null);
  };

  const openQuickView = (product: Product) => {
    setQuickViewProduct(product);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  const shareProduct = (product: Product) => {
    const name = language === 'ar' ? product.nameAr : language === 'fr' ? product.nameFr : product.nameEn;
    const desc = language === 'ar' ? product.shortDescAr : language === 'fr' ? product.shortDescFr : product.shortDescEn;
    const siteUrl = 'https://ayoubtechstore.com';
    const price = product.salePrice || product.price;
    const msg = `*${name}*\n${desc}\n💰 ${price.toLocaleString()} د.ج\n🔗 ${siteUrl}`;

    if (navigator.share) {
      navigator.share({ title: name, text: msg, url: siteUrl }).catch(() => {});
      return;
    }
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const openOrderModal = (product: Product) => {
    const defaultMunicipality = getMunicipalities(1)[0]?.id || '1';
    setSelectedProduct(product);
    setOrderData((prev) => ({
      ...prev,
      wilaya: '1',
      municipality: defaultMunicipality,
      quantity: quantities[product.id] || 1,
    }));
  };

  const closeOrderModal = () => {
    setSelectedProduct(null);
    setViewingProduct(null);
    setSubmitted(false);
    setLastOrderId(null);
  };

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'wilaya') {
      const nextMunicipality = getMunicipalities(Number(value))[0]?.id || '1';
      setOrderData((prev) => ({ ...prev, wilaya: value, municipality: nextMunicipality }));
      return;
    }

    setOrderData((prev) => ({ ...prev, [name]: name === 'quantity' ? Math.max(1, Number(value)) : value }));
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orderData.fullName || !orderData.phone || !orderData.address) {
      toast.error(t({ ar: 'الرجاء ملء الحقول الأساسية', fr: 'Veuillez remplir les champs requis', en: 'Please fill the required fields' }));
      return;
    }

    if (!selectedProduct) return;

    const productName = language === 'ar' ? selectedProduct.nameAr : language === 'fr' ? selectedProduct.nameFr : selectedProduct.nameEn;
    const wilayaName = wilayas.find((w) => w.id.toString() === orderData.wilaya)?.[language === 'ar' ? 'nameAr' : language === 'fr' ? 'nameFr' : 'nameEn'] || '';
    const municipalityName = getMunicipalities(Number(orderData.wilaya)).find((m) => m.id === orderData.municipality)?.[language === 'ar' ? 'nameAr' : language === 'fr' ? 'nameFr' : 'nameEn'] || '';

    const discountAmount = appliedCoupon ? Math.min(appliedCoupon.discount, selectedProduct.price * orderData.quantity) : 0;
    const grandTotal = selectedProduct.price * orderData.quantity - discountAmount;

    addItem({
      productId: selectedProduct.id,
      quantity: orderData.quantity,
      price: selectedProduct.price,
      name: productName,
    });

    const record = await saveOrder({
      customer: orderData.fullName,
      phone: orderData.phone,
      email: orderData.email,
      wilaya: wilayaName,
      municipality: municipalityName,
      address: orderData.address,
      note: orderData.note,
      items: [{ name: productName, quantity: orderData.quantity, price: selectedProduct.price, total: selectedProduct.price * orderData.quantity }],
      total: grandTotal,
      source: 'quick-order',
      paymentMethod,
      discount: discountAmount > 0 ? discountAmount : undefined,
      discountCode: appliedCoupon?.code,
    });

    setSubmitted(true);
    setLastOrderId(record.id);
    toast.success(t({ ar: 'تم تسجيل الطلب بنجاح!', fr: 'Commande enregistrée avec succès!', en: 'Order saved successfully!' }));
  };

  const selectedName = selectedProduct
    ? language === 'ar'
      ? selectedProduct.nameAr
      : language === 'fr'
      ? selectedProduct.nameFr
      : selectedProduct.nameEn
    : '';

  return (
    <section id="products" className="py-20 bg-gradient-to-b from-white/80 to-slate-50/70 dark:from-slate-950/80 dark:to-slate-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="mb-4">
            {t({ ar: '🖥️ منتجات الإعلام الآلي', fr: '🖥️ Produits informatiques', en: '🖥️ IT Products' })}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t({ ar: 'اختر منتجك، ثم قدّم طلبك فوراً.', fr: 'Choisissez votre produit et passez commande immédiatement.', en: 'Pick your product and order instantly.' })}
          </p>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : (
        <>
        {/* Search + Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={t({ ar: 'ابحث عن منتج...', fr: 'Rechercher un produit...', en: 'Search products...' })}
              aria-label="Search products"
              className="w-full rounded-2xl border-2 border-border bg-background pl-12 pr-14 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={() => setVisualSearchOpen(true)}
              className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label={t({ ar: 'بحث بالصورة', fr: 'Recherche par image', en: 'Visual search' })}
            >
              <Camera className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
            </button>
            <button
              onClick={() => setComparisonOpen(true)}
              className="absolute right-24 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted transition-colors"
              aria-label={t({ ar: 'مقارنة', fr: 'Comparer', en: 'Compare' })}
              title={t({ ar: 'مقارنة المنتجات', fr: 'Comparer les produits', en: 'Compare products' })}
            >
              <span className="text-muted-foreground hover:text-primary transition-colors text-lg font-bold">{'<>'}</span>
            </button>
            <AnimatePresence>
              {showSuggestions && (
                <SearchSuggestions
                  query={debouncedSearch}
                  products={suggestions}
                  onSelect={(product) => openProductDetails(product)}
                  onClose={() => setShowSuggestions(false)}
                />
              )}
            </AnimatePresence>
          </div>

          <div className="flex flex-wrap justify-center gap-2" role="tablist">
            {Object.entries(categoryLabels).map(([key, label]) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeCategory === key}
                onClick={() => setActiveCategory(key)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  activeCategory === key
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {label[language]}
              </button>
            ))}
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">
              {t({ ar: 'لا توجد منتجات مطابقة للبحث', fr: 'Aucun produit trouvé', en: 'No products found' })}
            </p>
          </div>
        ) : (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {paginatedProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => openProductDetails(product)}
              className="group bg-card rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-border hover:border-primary/50 cursor-pointer relative"
            >
              <button
                onClick={() => { const added = toggleWishlist(product.id); toast.success(added ? t({ ar: 'أضيف إلى المفضلة', fr: 'Ajouté aux favoris', en: 'Added to wishlist' }) : t({ ar: 'أزيل من المفضلة', fr: 'Retiré des favoris', en: 'Removed from wishlist' })); }}
                className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition shadow-sm z-10"
                aria-label={isInWishlist(product.id) ? t({ ar: 'إزالة من المفضلة', fr: 'Retirer des favoris', en: 'Remove from wishlist' }) : t({ ar: 'إضافة إلى المفضلة', fr: 'Ajouter aux favoris', en: 'Add to wishlist' })}
              >
                <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
              </button>
              {product.salePrice && product.saleEnd && new Date(product.saleEnd) > new Date() && (
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                  <div className="bg-red-500 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg">
                    {language === 'ar' ? 'تخفيض' : language === 'fr' ? 'SOLDE' : 'SALE'}
                  </div>
                  <FlashSaleTimer endDate={product.saleEnd} />
                </div>
              )}
              <div className="relative h-40 sm:h-48 overflow-hidden bg-muted">
                <img
                  src={product.image}
                  alt={language === 'ar' ? product.nameAr : product.nameEn}
                  loading="lazy"
                  className="w-full h-full object-contain p-4 bg-white/50 dark:bg-white/5 product-img-zoom"
                />
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold">
                  {product.price.toLocaleString()} د.ج
                </div>
                <div className="absolute top-4 left-4 flex flex-col gap-1">
                  <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Info className="w-3 h-3" />
                    {t({ ar: 'عرض التفاصيل', fr: 'Voir détails', en: 'View details' })}
                  </div>
                  {product.brand && (
                    <div className="bg-black/40 backdrop-blur-sm text-white/90 px-0.5 py-0.5 rounded-full text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {product.brand}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); openQuickView(product); }}
                    className="flex-1 bg-primary/90 backdrop-blur-sm text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-primary transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {t({ ar: 'معاينة سريعة', fr: 'Aperçu rapide', en: 'Quick view' })}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); shareProduct(product); }}
                    className="bg-white/20 backdrop-blur-sm text-white p-2 rounded-lg hover:bg-white/30 transition"
                    aria-label={t({ ar: 'مشاركة', fr: 'Partager', en: 'Share' })}
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-bold mb-2">
                  {language === 'ar' ? product.nameAr : language === 'fr' ? product.nameFr : product.nameEn}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {language === 'ar' ? product.descAr : language === 'fr' ? product.descFr : product.descEn}
                </p>

                <div className="flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(product.id, -1)}
                      className="p-1 hover:bg-background rounded transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-3 font-semibold w-8 text-center">{quantities[product.id] || 1}</span>
                    <button
                      onClick={() => updateQuantity(product.id, 1)}
                      className="p-1 hover:bg-background rounded transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => openOrderModal(product)}
                    aria-label={t({ ar: 'اطلب الآن', fr: 'Commander', en: 'Order Now' })}
                    className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-105 btn-liquid"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{t({ ar: 'اطلب الآن', fr: 'Commander', en: 'Order Now' })}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-8" role="navigation" aria-label="Pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted transition disabled:opacity-40">
              {t({ ar: 'السابق', fr: 'Précédent', en: 'Previous' })}
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i + 1)}
                className={`w-10 h-10 rounded-xl font-bold transition ${
                  page === i + 1 ? 'bg-primary text-primary-foreground' : 'border border-border bg-card hover:bg-muted'
                }`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted transition disabled:opacity-40">
              {t({ ar: 'التالي', fr: 'Suivant', en: 'Next' })}
            </button>
          </div>
        )}
      </>
      )}
      </>
      )}
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
      {viewingProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={closeProductDetails}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[32px] border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <ProductGallery
                images={[viewingProduct.image, ...viewingProduct.images]}
                name={language === 'ar' ? viewingProduct.nameAr : viewingProduct.nameEn}
              />
              <button
                onClick={closeProductDetails}
                className="absolute top-4 right-4 rounded-full bg-black/50 backdrop-blur-sm p-3 text-white hover:bg-black/70 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  const shareData = {
                    title: language === 'ar' ? viewingProduct.nameAr : language === 'fr' ? viewingProduct.nameFr : viewingProduct.nameEn,
                    text: language === 'ar' ? viewingProduct.descAr : language === 'fr' ? viewingProduct.descFr : viewingProduct.descEn,
                    url: window.location.href,
                  };
                  if (navigator.share) navigator.share(shareData);
                  else navigator.clipboard.writeText(window.location.href);
                }}
                className="absolute top-4 left-4 rounded-full bg-white/20 backdrop-blur-sm p-3 text-white hover:bg-white/30 transition-all"
                aria-label={language === 'ar' ? 'مشاركة' : language === 'fr' ? 'Partager' : 'Share'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
              </button>
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold">
                  {language === 'ar' ? viewingProduct.nameAr : language === 'fr' ? viewingProduct.nameFr : viewingProduct.nameEn}
                </h2>
                <span className="text-2xl font-bold text-primary">
                  {viewingProduct.price.toLocaleString()} د.ج
                </span>
              </div>
              <div className="max-w-xs">
                <InstallmentCalculator price={viewingProduct.salePrice || viewingProduct.price} />
              </div>

              <p className="text-muted-foreground mb-8 text-lg">
                {language === 'ar' ? viewingProduct.descAr : language === 'fr' ? viewingProduct.descFr : viewingProduct.descEn}
              </p>

              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                {t({ ar: 'المواصفات والخصائص', fr: 'Spécifications et caractéristiques', en: 'Specifications & Features' })}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                {viewingProduct.specs.map((spec, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-2xl bg-muted/50 border border-border px-5 py-4">
                    <span className="text-muted-foreground text-sm font-medium">
                      {spec.label[language]}
                    </span>
                    <span className="font-semibold text-sm">
                      {spec.value[language]}
                    </span>
                  </div>
                ))}
              </div>

              <Reviews productId={viewingProduct.id} />

              <ProductSuggestions productId={viewingProduct.id} onSelect={openProductDetails} />

              {viewingProduct.relatedIds.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    {t({ ar: '🔄 منتجات قد تهمك', fr: '🔄 Vous pourriez aimer', en: '🔄 You may also like' })}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {products.filter(p => viewingProduct.relatedIds.includes(p.id) && !p.hidden).map((rel) => (
                      <button
                        key={rel.id}
                        onClick={() => openProductDetails(rel)}
                        className="group bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all p-3 text-center"
                      >
                        <div className="h-20 bg-muted rounded-lg mb-2 overflow-hidden">
                          <img src={rel.image} alt="" className="w-full h-full object-contain p-2 bg-white/50 dark:bg-white/5" loading="lazy" />
                        </div>
                        <p className="text-xs font-semibold leading-tight mb-1 line-clamp-2">
                          {language === 'ar' ? rel.nameAr : language === 'fr' ? rel.nameFr : rel.nameEn}
                        </p>
                        <p className="text-xs text-primary font-bold">{rel.price.toLocaleString()} د.ج</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    const product = viewingProduct;
                    closeProductDetails();
                    setTimeout(() => openOrderModal(product!), 100);
                  }}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg shadow-primary/20 btn-liquid"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {t({ ar: 'اطلب الآن', fr: 'Commander maintenant', en: 'Order Now' })}
                </button>
                <button
                  onClick={closeProductDetails}
                  className="px-8 py-4 rounded-2xl border border-border font-semibold hover:bg-muted transition-all"
                >
                  {t({ ar: 'متابعة التسوق', fr: 'Continuer', en: 'Continue Shopping' })}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Order Form Modal */}
      <AnimatePresence>
      {selectedProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', duration: 0.6 }}
            className="w-full max-w-4xl max-h-[95vh] overflow-y-auto rounded-[40px] border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              /* 🎉 Thank You Screen */
              <div className="p-8 sm:p-12 text-center relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-emerald-500/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] max-w-full bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative">
                  {/* Animated checkmark */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                    className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/30"
                  >
                    <CheckCircle className="w-12 h-12 text-white" />
                  </motion.div>

                  {/* Thank you message */}
                  <motion.h3
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl sm:text-5xl font-bold mb-4"
                  >
                    {t({ ar: 'شكراً لك! 🙏', fr: 'Merci! 🙏', en: 'Thank you! 🙏' })}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-muted-foreground mb-2 font-semibold"
                  >
                    {t({
                      ar: `عزيزي ${orderData.fullName}،`,
                      fr: `Cher ${orderData.fullName},`,
                      en: `Dear ${orderData.fullName},`,
                    })}
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed"
                  >
                    {t({
                      ar: `تم استلام طلبك للمنتج "${selectedName}" بنجاح. سنتصل بك قريباً لتأكيد الطلب والتوصيل.`,
                      fr: `Votre commande pour "${selectedName}" a été reçue avec succès. Nous vous contacterons bientôt pour confirmer.`,
                      en: `Your order for "${selectedName}" has been received. We'll contact you soon to confirm delivery.`,
                    })}
                  </motion.p>

                  {/* Order details card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="max-w-md mx-auto rounded-3xl border border-border bg-gradient-to-br from-card to-muted/50 p-6 mb-10 text-right shadow-lg"
                    dir="auto"
                  >
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{t({ ar: 'رقم الطلب', fr: 'N° commande', en: 'Order ID' })}</p>
                        <p className="font-mono font-bold text-base break-all">#{lastOrderId?.slice(0, 12).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-base">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{selectedName}</span>
                        <span className="text-muted-foreground">{t({ ar: 'المنتج', fr: 'Produit', en: 'Product' })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{orderData.quantity}</span>
                        <span className="text-muted-foreground">{t({ ar: 'الكمية', fr: 'Quantité', en: 'Quantity' })}</span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-border">
                        <span className="font-bold text-primary text-xl">{(selectedProduct.price * orderData.quantity).toLocaleString()} د.ج</span>
                        <span className="text-muted-foreground">{t({ ar: 'المجموع', fr: 'Total', en: 'Total' })}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Actions */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                  >
                    <button
                      onClick={closeOrderModal}
                      className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-blue-700 px-10 py-5 text-primary-foreground font-bold text-xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 hover:scale-105 transition-all duration-300 btn-liquid"
                    >
                      <Heart className="w-6 h-6" />
                      {t({ ar: 'شكراً، تم ✓', fr: 'Merci ✓', en: 'Thank you ✓' })}
                    </button>
                  </motion.div>
                </div>
              </div>
            ) : (
              /* 📝 Order Form */
              <form onSubmit={handleOrderSubmit}>
                {/* Header */}
                <div className="relative px-6 sm:px-8 pt-8 pb-6 border-b border-border bg-gradient-to-br from-primary/[0.04] to-transparent">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-3">
                        <ShoppingCart className="w-4 h-4" />
                        {t({ ar: 'نموذج طلب', fr: 'Formulaire de commande', en: 'Order Form' })}
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-bold mb-1">{selectedName}</h3>
                      <p className="text-base text-muted-foreground">
                        {t({ ar: 'املأ البيانات أدناه لإتمام طلبك', fr: 'Remplissez les informations ci-dessous', en: 'Fill in your details below' })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeOrderModal}
                      className="rounded-2xl border border-border bg-card p-3 text-muted-foreground hover:text-foreground hover:border-primary hover:shadow-lg transition-all shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Form body */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr] gap-0">
                  {/* Left: Form fields */}
                  <div className="p-6 sm:p-8 space-y-6">
                    {/* Section 1: Customer Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-lg font-bold">{t({ ar: 'معلومات العميل', fr: 'Informations client', en: 'Customer Information' })}</p>
                          <p className="text-sm text-muted-foreground">{t({ ar: 'بيانات التواصل الأساسية', fr: 'Coordonnées de base', en: 'Basic contact details' })}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-base font-bold mb-2">
                            {t({ ar: 'الاسم الكامل', fr: 'Nom complet', en: 'Full Name' })}
                            <span className="text-destructive mr-1">*</span>
                          </label>
                          <input
                            name="fullName"
                            value={orderData.fullName}
                            onChange={handleOrderChange}
                            placeholder={t({ ar: 'مثال: أحمد بن علي', fr: 'Ex: Ahmed Ben Ali', en: 'Ex: Ahmed Ben Ali' })}
                            className="w-full rounded-2xl border-2 border-border bg-background px-5 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-bold mb-2">
                            {t({ ar: 'رقم الهاتف', fr: 'Numéro de téléphone', en: 'Phone Number' })}
                            <span className="text-destructive mr-1">*</span>
                          </label>
                          <input
                            name="phone"
                            value={orderData.phone}
                            onChange={handleOrderChange}
                            placeholder="0674 11 32 90"
                            className="w-full rounded-2xl border-2 border-border bg-background px-5 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Address */}
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-400/10 text-amber-600 flex items-center justify-center">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-lg font-bold">{t({ ar: 'عنوان التوصيل', fr: 'Adresse de livraison', en: 'Delivery Address' })}</p>
                          <p className="text-sm text-muted-foreground">{t({ ar: 'اختر الولاية والبلدية', fr: 'Choisissez la wilaya et la commune', en: 'Choose wilaya and municipality' })}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-base font-bold mb-2">{t({ ar: 'الولاية', fr: 'Wilaya', en: 'Wilaya' })}</label>
                          <select
                            name="wilaya"
                            value={orderData.wilaya}
                            onChange={handleOrderChange}
                            className="w-full rounded-2xl border-2 border-border bg-background px-5 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none"
                          >
                            {wilayas.map((wilaya) => (
                              <option key={wilaya.id} value={wilaya.id}>
                                {language === 'ar' ? wilaya.nameAr : language === 'fr' ? wilaya.nameFr : wilaya.nameEn}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-base font-bold mb-2">{t({ ar: 'البلدية', fr: 'Commune', en: 'Municipality' })}</label>
                          <select
                            name="municipality"
                            value={orderData.municipality}
                            onChange={handleOrderChange}
                            className="w-full rounded-2xl border-2 border-border bg-background px-5 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 appearance-none"
                          >
                            {getMunicipalities(Number(orderData.wilaya)).map((municipality) => (
                              <option key={municipality.id} value={municipality.id}>
                                {language === 'ar' ? municipality.nameAr : language === 'fr' ? municipality.nameFr : municipality.nameEn}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-base font-bold mb-2">
                          {t({ ar: 'العنوان الكامل', fr: 'Adresse complète', en: 'Full Address' })}
                          <span className="text-destructive mr-1">*</span>
                        </label>
                        <textarea
                          name="address"
                          value={orderData.address}
                          onChange={handleOrderChange}
                          rows={2}
                          placeholder={t({ ar: 'مثال: حي السلام، رقم 15، الميلية', fr: 'Ex: Cité Salam, N°15, El Milia', en: 'Ex: Salam District, #15, El Milia' })}
                          className="w-full resize-none rounded-2xl border-2 border-border bg-background px-5 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>

                    {/* Section 3: Contact & Notes */}
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                          <Mail className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-lg font-bold">{t({ ar: 'تفاصيل إضافية', fr: 'Détails supplémentaires', en: 'Additional Details' })}</p>
                          <p className="text-sm text-muted-foreground">{t({ ar: 'اختياري - بريد إلكتروني وملاحظات', fr: 'Optionnel - email et notes', en: 'Optional - email and notes' })}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-base font-bold mb-2">{t({ ar: 'البريد الإلكتروني', fr: 'E-mail', en: 'Email' })}</label>
                          <input
                            type="email"
                            name="email"
                            value={orderData.email}
                            onChange={handleOrderChange}
                            placeholder="example@email.com"
                            className="w-full rounded-2xl border-2 border-border bg-background px-5 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div>
                          <label className="block text-base font-bold mb-2">{t({ ar: 'الكمية', fr: 'Quantité', en: 'Quantity' })}</label>
                          <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-background px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setOrderData((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                              className="w-10 h-10 rounded-xl bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-5 h-5" />
                            </button>
                            <span className="flex-1 text-center font-bold text-xl">{orderData.quantity}</span>
                            <button
                              type="button"
                              onClick={() => setOrderData((prev) => ({ ...prev, quantity: prev.quantity + 1 }))}
                              className="w-10 h-10 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-base font-bold mb-2">{t({ ar: 'ملاحظات إضافية', fr: 'Notes supplémentaires', en: 'Additional Notes' })}</label>
                        <textarea
                          name="note"
                          value={orderData.note}
                          onChange={handleOrderChange}
                          rows={2}
                          placeholder={t({ ar: 'أي ملاحظات أو طلبات خاصة...', fr: 'Notes ou demandes spéciales...', en: 'Any special requests...' })}
                          className="w-full resize-none rounded-2xl border-2 border-border bg-background px-5 py-4 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Order Summary Sidebar */}
                  <div className="p-6 sm:p-8 border-t lg:border-t-0 lg:border-r border-border bg-gradient-to-b from-muted/30 to-background">
                    <div className="sticky top-8 space-y-6">
                      <div>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                            <ShoppingCart className="w-5 h-5" />
                          </div>
                          <p className="text-lg font-bold">{t({ ar: 'ملخص الطلب', fr: 'Résumé', en: 'Order Summary' })}</p>
                        </div>

                        <div className="rounded-2xl bg-card border border-border p-5 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                              <img src={selectedProduct.image} alt="" className="w-full h-full object-contain bg-white/50 dark:bg-white/5" loading="lazy" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-base truncate">{selectedName}</p>
                              <p className="text-sm text-muted-foreground">{selectedProduct.price.toLocaleString()} د.ج / {t({ ar: 'للقطعة', fr: 'pièce', en: 'each' })}</p>
                            </div>
                          </div>

                          <div className="border-t border-border pt-4 space-y-3">
                            <div className="flex justify-between text-base">
                              <span className="text-muted-foreground">{t({ ar: 'سعر القطعة', fr: 'Prix unitaire', en: 'Unit Price' })}</span>
                              <span className="font-bold">{selectedProduct.price.toLocaleString()} د.ج</span>
                            </div>
                            <div className="flex justify-between text-base">
                              <span className="text-muted-foreground">{t({ ar: 'الكمية', fr: 'Quantité', en: 'Quantity' })}</span>
                              <span className="font-bold">{orderData.quantity}</span>
                            </div>
                            <div className="flex justify-between text-lg border-t border-border pt-3">
                              <span className="font-bold text-primary">{t({ ar: 'الإجمالي', fr: 'Total', en: 'Total' })}</span>
                              <span className="font-bold text-primary text-xl">{(selectedProduct.price * orderData.quantity).toLocaleString()} د.ج</span>
                            </div>
                            {(() => {
                              const discountAmt = appliedCoupon ? Math.min(appliedCoupon.discount, selectedProduct.price * orderData.quantity) : 0;
                              return discountAmt > 0 ? (
                                <>
                                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400 pt-2">
                                    <span>{t({ ar: 'الخصم', fr: 'Réduction', en: 'Discount' })}</span>
                                    <span className="font-semibold">-{discountAmt.toLocaleString()} د.ج</span>
                                  </div>
                                  <div className="flex justify-between text-lg font-bold text-primary border-t border-border pt-2 mt-2">
                                    <span>{t({ ar: 'المجموع بعد الخصم', fr: 'Total après réduc.', en: 'Total after discount' })}</span>
                                    <span className="text-xl">{(selectedProduct.price * orderData.quantity - discountAmt).toLocaleString()} د.ج</span>
                                  </div>
                                </>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div>
                        <p className="text-sm font-bold mb-2">{t({ ar: 'طريقة الدفع', fr: 'Mode de paiement', en: 'Payment' })}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {([
                            { value: 'cod', labelAr: 'عند الاستلام', labelFr: 'À la livr.', en: 'Cash on Del.', icon: 'Banknote' },
                            { value: 'cib', labelAr: 'CIB', labelFr: 'CIB', en: 'CIB', icon: 'CreditCard' },
                            { value: 'edahabia', labelAr: 'Edahabia', labelFr: 'Edahabia', en: 'Edahabia', icon: 'Smartphone' },
                            { value: 'baridi', labelAr: 'BaridiMob', labelFr: 'BaridiMob', en: 'BaridiMob', icon: 'Smartphone' },
                          ] as const).map((pm) => {
                            const Icon = pm.icon === 'Banknote' ? Banknote : pm.icon === 'CreditCard' ? CreditCard : Smartphone;
                            return (
                              <button
                                key={pm.value}
                                type="button"
                                onClick={() => setPaymentMethod(pm.value)}
                                className={`flex items-center gap-2 p-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                                  paymentMethod === pm.value
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-card hover:border-primary/50'
                                }`}
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span>{pm[language === 'ar' ? 'labelAr' : language === 'fr' ? 'labelFr' : 'en']}</span>
                              </button>
                            );
                          })}
                        </div>
                        {paymentMethod !== 'cod' && (
                          <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                            {t({ ar: 'سنرسل لك معلومات الحساب عبر الواتساب', fr: 'Coordonnées bancaires par WhatsApp', en: 'Bank details via WhatsApp' })}
                          </div>
                        )}
                      </div>

                      {/* Coupon */}
                      <div>
                        <p className="text-sm font-bold mb-2">{t({ ar: 'كود الخصم', fr: 'Code promo', en: 'Coupon' })}</p>
                        {appliedCoupon ? (
                          <div className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-xl p-2 text-xs">
                            <span className="font-bold text-green-700 dark:text-green-400">{appliedCoupon.code} (-{(selectedProduct ? Math.min(appliedCoupon.discount, selectedProduct.price * orderData.quantity) : 0).toLocaleString()} د.ج)</span>
                            <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(''); setCouponError(''); }} className="text-destructive text-xs font-semibold">{t({ ar: 'إلغاء', fr: 'Annuler', en: 'Remove' })}</button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder={t({ ar: 'أدخل الكود', fr: 'Code', en: 'Code' })} className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-xs focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            <button type="button" onClick={() => {
                              if (!couponCode.trim()) return;
                              const raw = localStorage.getItem('aos_coupons');
                              if (!raw) { setCouponError(t({ ar: 'الكود غير صحيح', fr: 'Code invalide', en: 'Invalid code' })); return; }
                              const coupons = JSON.parse(raw);
                              const coupon = coupons.find((c: any) => c.code.toLowerCase() === couponCode.trim().toLowerCase() && c.active);
                              if (!coupon) { setCouponError(t({ ar: 'الكود غير موجود', fr: 'Code inexistant', en: 'Code not found' })); return; }
                              if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) { setCouponError(t({ ar: 'منتهي الصلاحية', fr: 'Expiré', en: 'Expired' })); return; }
                              const sub = selectedProduct ? selectedProduct.price * orderData.quantity : 0;
                              if (coupon.minOrder > 0 && sub < coupon.minOrder) { setCouponError(t({ ar: `الحد الأدنى ${coupon.minOrder.toLocaleString()} د.ج`, fr: `Min ${coupon.minOrder.toLocaleString()} DZD`, en: `Min ${coupon.minOrder.toLocaleString()} DZD` })); return; }
                              const usageRaw = localStorage.getItem('aos_coupon_usage');
                              const usageData = usageRaw ? JSON.parse(usageRaw) : [];
                              const usage = usageData.find((u: any) => u.code === coupon.code);
                              const usedCount = usage?.usedCount || 0;
                              if (coupon.maxUses > 0 && usedCount >= coupon.maxUses) { setCouponError(t({ ar: 'استنفذ', fr: 'Épuisé', en: 'Exhausted' })); return; }
                              const discount = coupon.type === 'percentage' ? Math.round(sub * (coupon.value / 100)) : coupon.value;
                              setAppliedCoupon({ code: coupon.code, discount, type: coupon.type });
                              setCouponError('');
                              toast.success(t({ ar: 'تم تطبيق الكود!', fr: 'Code appliqué!', en: 'Coupon applied!' }));
                            }} className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition">{t({ ar: 'تطبيق', fr: 'Appliquer', en: 'Apply' })}</button>
                          </div>
                        )}
                        {couponError && <p className="text-xs text-destructive mt-1">{couponError}</p>}
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        className="w-full rounded-2xl bg-gradient-to-r from-primary to-blue-700 px-6 py-5 text-primary-foreground font-bold text-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 btn-liquid"
                      >
                        {t({ ar: 'تأكيد الطلب', fr: 'Confirmer la commande', en: 'Confirm Order' })}
                      </button>

                      <p className="text-xs text-center text-muted-foreground">
                        {t({ ar: 'بإتمام الطلب، أنت توافق على شروط الخدمة', fr: 'En commandant, vous acceptez nos conditions', en: 'By ordering, you agree to our terms' })}
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      <AnimatePresence>
        {visualSearchOpen && <VisualSearch onClose={() => setVisualSearchOpen(false)} />}
      </AnimatePresence>

      {/* Quick View Modal */}
      <AnimatePresence>
      {quickViewProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={closeQuickView}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-background border border-border shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img
                src={quickViewProduct.image}
                alt={language === 'ar' ? quickViewProduct.nameAr : quickViewProduct.nameEn}
                className="w-full h-48 sm:h-56 object-contain bg-muted p-6"
              />
              <button
                onClick={closeQuickView}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); shareProduct(quickViewProduct); }}
                className="absolute top-3 left-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <h3 className="text-xl font-bold">
                {language === 'ar' ? quickViewProduct.nameAr : language === 'fr' ? quickViewProduct.nameFr : quickViewProduct.nameEn}
              </h3>
              <p className="text-muted-foreground text-sm">
                {language === 'ar' ? quickViewProduct.shortDescAr : language === 'fr' ? quickViewProduct.shortDescFr : quickViewProduct.shortDescEn}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-primary">
                  {quickViewProduct.price.toLocaleString()} د.ج
                </span>
                {quickViewProduct.salePrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {quickViewProduct.salePrice.toLocaleString()} د.ج
                  </span>
                )}
              </div>
              <InstallmentCalculator price={quickViewProduct.salePrice || quickViewProduct.price} />
              {quickViewProduct.specs.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t({ ar: 'أبرز المواصفات', fr: 'Spécifications', en: 'Specs' })}
                  </p>
                  {quickViewProduct.specs.slice(0, 4).map((spec, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{spec.label[language]}</span>
                      <span className="font-medium">{spec.value[language]}</span>
                    </div>
                  ))}
                </div>
              )}
              <ProductSuggestions productId={quickViewProduct.id} onSelect={(p) => { closeQuickView(); setTimeout(() => openProductDetails(p), 100); }} />
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    const product = quickViewProduct;
                    closeQuickView();
                    setTimeout(() => openProductDetails(product), 100);
                  }}
                  className="flex-1 border border-border hover:bg-muted px-4 py-2.5 rounded-xl font-semibold text-sm transition"
                >
                  {t({ ar: 'عرض التفاصيل', fr: 'Voir détails', en: 'Full details' })}
                </button>
                <button
                  onClick={() => {
                    const product = quickViewProduct;
                    closeQuickView();
                    setTimeout(() => openOrderModal(product), 100);
                  }}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2.5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t({ ar: 'اطلب الآن', fr: 'Commander', en: 'Order Now' })}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {comparisonOpen && <ProductComparison onClose={() => setComparisonOpen(false)} />}
    </section>
  );
}

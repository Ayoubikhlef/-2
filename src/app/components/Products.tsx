import { useState, useMemo, useEffect, useCallback, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, Plus, Minus, X, User, Phone, Mail, MapPin, CheckCircle, Info, Heart, Search, Camera, Share2, Eye, Banknote, Home, Store, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { products as defaultProducts, wilayas, getMunicipalities, type Product } from '../data/products';
import { getStoredProducts, loadProductsFromServer } from '../utils/productStorage';
import { saveOrder, describeOrderError } from '../utils/orderStorage';
import { getDeliveryQuote, type DeliveryMethod } from '../data/deliveryFees';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { SkeletonGrid } from './SkeletonCard';
import { getWishlist, toggleWishlist, isInWishlist } from '../utils/wishlistStorage';
import { VisualSearch } from './VisualSearch';
import { Reviews } from './Reviews';
import { FlashSaleTimer } from './FlashSaleTimer';
import { brand } from '../config/brand';
import { ProductComparison } from './ProductComparison';
import { ProductGallery } from './ProductGallery';
import { SearchSuggestions } from './SearchSuggestions';
import { ProductSuggestions } from './ProductSuggestions';
import TiltedCard from './TiltedCard';
import { TrustBadges } from './AnnouncementBar';
import { submitOrderToSheet } from '../utils/googleForm';
import { productPath } from '../utils/productPath';

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

type ProductCardProps = {
  product: Product;
  quantity: number;
  priority: boolean;
  onDetails: (product: Product) => void;
  onOrder: (product: Product) => void;
  onQuickView: (product: Product) => void;
  onQuantityChange: (productId: number, delta: number) => void;
};

/**
 * A single catalogue card, isolated behind React.memo.
 *
 * The order sheet keeps its form state in the parent component, so without
 * this boundary every keystroke in the order form re-rendered all twelve 3D
 * cards (and re-read localStorage for each wishlist icon). On phones that was
 * the difference between a smooth form and a form that visibly stutters.
 */
const ProductCard = memo(function ProductCard({
  product,
  quantity,
  priority,
  onDetails,
  onOrder,
  onQuickView,
  onQuantityChange,
}: ProductCardProps) {
  const { t, language } = useLanguage();
  const name = language === 'ar' ? product.nameAr : language === 'fr' ? product.nameFr : product.nameEn;
  const description = language === 'ar' ? product.descAr : language === 'fr' ? product.descFr : product.descEn;
  const onSale = Boolean(product.salePrice && product.saleEnd && new Date(product.saleEnd) > new Date());
  const wished = isInWishlist(product.id);

  return (
    <div
      onClick={() => onDetails(product)}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card shadow-sm transition-all duration-500 hover:border-primary/30 hover:shadow-xl cursor-pointer"
    >
      <div className="relative">
        <TiltedCard
          imageSrc={product.image}
          priority={priority}
          altText={language === 'ar' ? product.nameAr : product.nameEn}
          captionText={`${product.price.toLocaleString()} د.ج`}
          containerHeight="180px"
          containerWidth="100%"
          imageHeight="140px"
          imageWidth="180px"
          scaleOnHover={1.05}
          rotateAmplitude={12}
          showMobileWarning={false}
          showTooltip={true}
        />

        {onSale && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <div className="bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg">
              {language === 'ar' ? 'تخفيض' : language === 'fr' ? 'SOLDE' : 'SALE'}
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm">
          {(onSale ? product.salePrice! : product.price).toLocaleString()} د.ج
        </div>
        {product.brand && (
          <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-sm text-white/90 px-2 py-0.5 rounded-lg text-[10px] font-medium">
            {product.brand}
          </div>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
          className="absolute bottom-2 right-2 flex min-h-[36px] min-w-[36px] items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
          aria-label={t({ ar: 'معاينة', fr: 'Aperçu', en: 'Quick view' })}
        >
          <Eye className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-bold leading-tight line-clamp-2 min-h-10 flex-1">{name}</h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const added = toggleWishlist(product.id);
              toast.success(added
                ? t({ ar: 'أضيف إلى المفضلة', fr: 'Ajouté aux favoris', en: 'Added to wishlist' })
                : t({ ar: 'أزيل من المفضلة', fr: 'Retiré des favoris', en: 'Removed from wishlist' }));
            }}
            aria-label={`${wished ? t({ ar: 'إزالة من المفضلة', fr: 'Retirer des favoris', en: 'Remove from wishlist' }) : t({ ar: 'إضافة إلى المفضلة', fr: 'Ajouter aux favoris', en: 'Add to wishlist' })}: ${name}`}
            title={wished ? t({ ar: 'إزالة من المفضلة', fr: 'Retirer des favoris', en: 'Remove from wishlist' }) : t({ ar: 'إضافة إلى المفضلة', fr: 'Ajouter aux favoris', en: 'Add to wishlist' })}
            className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-muted transition"
          >
            <Heart className={`w-4 h-4 ${wished ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
        </div>
        <p className="text-sm text-muted-foreground/80 line-clamp-2 min-h-10 mb-3">{description}</p>

        <div className="flex min-h-8 items-center gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
          {onSale ? (
            <>
              <span className="text-xl font-black text-primary">{product.salePrice!.toLocaleString()} د.ج</span>
              <span className="text-sm font-semibold text-muted-foreground line-through">{product.price.toLocaleString()} د.ج</span>
              <span className="text-[11px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                -{Math.round((1 - product.salePrice! / product.price) * 100)}%
              </span>
            </>
          ) : (
            <span className="text-xl font-black text-primary">{product.price.toLocaleString()} د.ج</span>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            <button
              onClick={() => onQuantityChange(product.id, -1)}
              aria-label={t({ ar: 'إنقاص الكمية', fr: 'Diminuer', en: 'Decrease' })}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-background rounded-md transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="px-1 font-semibold text-sm min-w-[1.5rem] text-center">{quantity}</span>
            <button
              onClick={() => onQuantityChange(product.id, 1)}
              aria-label={t({ ar: 'زيادة الكمية', fr: 'Augmenter', en: 'Increase' })}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-background rounded-md transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => onOrder(product)}
            aria-label={t({ ar: 'اطلب الآن', fr: 'Commander', en: 'Order Now' })}
            className="flex min-h-[44px] min-w-[110px] flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
            <span className="whitespace-nowrap">{t({ ar: 'اطلب الآن', fr: 'Commander', en: 'Order Now' })}</span>
          </button>
        </div>
      </div>
    </div>
  );
});

export function Products() {
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>(loadProducts);
  const [quantities, setQuantities] = useState<{ [key: number]: number }>({});
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'priceAsc' | 'priceDesc' | 'name'>('newest');
  const [brandFilter, setBrandFilter] = useState('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [stockOnly, setStockOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [visualSearchOpen, setVisualSearchOpen] = useState(false);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const perPage = 12;

  useEffect(() => {
    let cancelled = false;
    const refresh = () => setProducts(loadProducts());
    window.addEventListener('aos:data-changed', refresh);

    // Do not paint the grid until the first data source has settled, so the
    // server copy cannot replace the cards mid-load (which restarted images).
    // A late server answer still refreshes the catalog afterwards.
    let fallback: number | undefined;
    const finish = (list: Product[]) => {
      if (cancelled) return;
      if (fallback) {
        window.clearTimeout(fallback);
        fallback = undefined;
      }
      setProducts(list);
      setLoading(false);
    };
    // Never trap the page in a skeleton if the API is cold or unreachable.
    fallback = window.setTimeout(() => finish(loadProducts()), 8000);

    loadProductsFromServer(defaultProducts)
      .then((list) => finish(list && list.length ? list : loadProducts()))
      .catch(() => finish(loadProducts()));

    return () => {
      cancelled = true;
      if (fallback) window.clearTimeout(fallback);
      window.removeEventListener('aos:data-changed', refresh);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => setPage(1), [debouncedSearch, activeCategory, brandFilter, priceMin, priceMax, stockOnly]);

  const brands = useMemo(
    () => Array.from(new Set(products.filter((p) => !p.hidden && p.brand).map((p) => p.brand))).sort((a, b) => a.localeCompare(b)),
    [products],
  );

  const activeFilterCount =
    (brandFilter !== 'all' ? 1 : 0) +
    (priceMin.trim() || priceMax.trim() ? 1 : 0) +
    (stockOnly ? 1 : 0);

  const resetFilters = () => {
    setBrandFilter('all');
    setPriceMin('');
    setPriceMax('');
    setStockOnly(false);
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => !p.hidden);
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (brandFilter !== 'all') {
      result = result.filter((p) => p.brand === brandFilter);
    }
    const min = Number(priceMin);
    const max = Number(priceMax);
    const effectivePrice = (p: Product) =>
      p.salePrice && p.saleEnd && new Date(p.saleEnd) > new Date() ? p.salePrice : p.price;
    if (priceMin.trim() && Number.isFinite(min)) {
      result = result.filter((p) => effectivePrice(p) >= min);
    }
    if (priceMax.trim() && Number.isFinite(max)) {
      result = result.filter((p) => effectivePrice(p) <= max);
    }
    if (stockOnly) {
      result = result.filter((p) => {
        const stock = Number(p.stock);
        return !Number.isFinite(stock) || stock > 0;
      });
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
    const priceOf = (p: Product) => p.salePrice && p.saleEnd && new Date(p.saleEnd) > new Date() ? p.salePrice : p.price;
    if (sortBy === 'priceAsc') result = [...result].sort((a, b) => priceOf(a) - priceOf(b));
    else if (sortBy === 'priceDesc') result = [...result].sort((a, b) => priceOf(b) - priceOf(a));
    else if (sortBy === 'name') result = [...result].sort((a, b) => (language === 'ar' ? a.nameAr : language === 'fr' ? a.nameFr : a.nameEn).localeCompare(language === 'ar' ? b.nameAr : language === 'fr' ? b.nameFr : b.nameEn));
    return result;
  }, [activeCategory, brandFilter, priceMin, priceMax, stockOnly, debouncedSearch, sortBy, language, products]);
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
    wilaya: '18',
    municipality: getMunicipalities(18)[0]?.id || '1',
    quantity: 1,
    note: '',
  });
  const paymentMethod = 'cod' as const;
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: 'percentage' | 'fixed' } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submitLock = useRef(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    const product = products.find(p => p.id === productId);
    const maxStock = product?.stock ?? 10000;
    setQuantities((prev) => {
      const current = prev[productId] || 1;
      return { ...prev, [productId]: Math.max(1, Math.min(current + delta, maxStock)) };
    });
  }, [products]);

  const openProductDetails = useCallback((product: Product) => {
    setViewingProduct(product);
  }, []);

  const closeProductDetails = useCallback(() => {
    setViewingProduct(null);
  }, []);

  const openQuickView = useCallback((product: Product) => {
    setQuickViewProduct(product);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickViewProduct(null);
  }, []);

  const shareProduct = (product: Product) => {
    const name = language === 'ar' ? product.nameAr : language === 'fr' ? product.nameFr : product.nameEn;
    const desc = language === 'ar' ? product.shortDescAr : language === 'fr' ? product.shortDescFr : product.shortDescEn;
    const siteUrl = `https://${brand.domain}`;
    const price = product.salePrice || product.price;
    const msg = `*${name}*\n${desc}\n💰 ${price.toLocaleString()} د.ج\n🔗 ${siteUrl}`;

    if (navigator.share) {
      navigator.share({ title: name, text: msg, url: siteUrl }).catch(() => {});
      return;
    }
    const waUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  };

  const openOrderModal = useCallback((product: Product) => {
    setSelectedProduct(product);
    setViewingProduct(null);
    setQuickViewProduct(null);
    setSubmitted(false);
    setLastOrderId(null);
  }, []);

  const closeOrderModal = useCallback(() => {
    setSelectedProduct(null);
    setViewingProduct(null);
    setSubmitted(false);
    setLastOrderId(null);
  }, []);

  // Order sheet: freeze background scroll, allow Escape, and make the page behind inert.
  const orderSheetOpen = !!selectedProduct;
  useEffect(() => {
    if (!orderSheetOpen) return;
    const scrollY = window.scrollY;
    const opener = document.activeElement as HTMLElement | null;
    document.body.classList.add('modal-open');

    let inerted: HTMLElement[] = [];
    const sheet = document.querySelector('.aos-order-sheet');
    const root = document.getElementById('root');
    if (sheet && root && !root.contains(sheet)) {
      root.inert = true;
      inerted = [root];
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeOrderModal();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
      window.scrollTo({ top: scrollY });
      inerted.forEach((el) => { el.inert = false; });
      opener?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderSheetOpen]);

  const handleOrderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'wilaya') {
      const nextMunicipality = getMunicipalities(Number(value))[0]?.id || '1';
      setOrderData((prev) => ({ ...prev, wilaya: value, municipality: nextMunicipality }));
      return;
    }

    setOrderData((prev) => ({ ...prev, [name]: name === 'quantity' ? Math.max(1, Number(value)) : value }));
  };

  const quickSubtotal = selectedProduct ? selectedProduct.price * orderData.quantity : 0;
  const quickDiscount = appliedCoupon ? Math.min(appliedCoupon.discount, quickSubtotal) : 0;
  const quickDeliveryMethod = deliveryMethod;
  const quickQuote = selectedProduct
    ? getDeliveryQuote({
        localityId: Number(orderData.wilaya),
        method: quickDeliveryMethod,
        subtotal: quickSubtotal,
        items: [{
          quantity: orderData.quantity,
          weight: selectedProduct.weight,
          dimensions: selectedProduct.dimensions,
        }],
      })
    : null;
  const quickDeliveryFee = quickQuote?.deliveryFee ?? 0;
  const quickTotal = quickSubtotal + quickDeliveryFee - quickDiscount;

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitLock.current || submitted) return;

    if (!orderData.fullName || !orderData.phone || !orderData.address) {
      toast.error(t({ ar: 'الرجاء ملء الحقول الأساسية', fr: 'Veuillez remplir les champs requis', en: 'Please fill the required fields' }));
      return;
    }

    if (!selectedProduct) return;

    if (typeof selectedProduct.stock === 'number' && selectedProduct.stock <= 0) {
      toast.error(t({
        ar: 'هذا المنتج نفد من المخزون حالياً. اختر منتجاً آخر.',
        fr: 'Ce produit est en rupture de stock. Choisissez un autre produit.',
        en: 'This product is out of stock. Please choose another one.',
      }));
      return;
    }

    const productName = language === 'ar' ? selectedProduct.nameAr : language === 'fr' ? selectedProduct.nameFr : selectedProduct.nameEn;
    const wilayaName = wilayas.find((w) => w.id.toString() === orderData.wilaya)?.[language === 'ar' ? 'nameAr' : language === 'fr' ? 'nameFr' : 'nameEn'] || '';
    const municipalityName = getMunicipalities(Number(orderData.wilaya)).find((m) => m.id === orderData.municipality)?.[language === 'ar' ? 'nameAr' : language === 'fr' ? 'nameFr' : 'nameEn'] || '';

    const discountAmount = quickDiscount;
    const grandTotal = quickTotal;

    submitLock.current = true;
    setSubmitting(true);
    try {
      const record = await saveOrder({
        customer: orderData.fullName,
        phone: orderData.phone,
        email: orderData.email.trim(),
        wilaya: wilayaName,
        municipality: municipalityName,
        address: orderData.address,
        note: orderData.note,
        wilayaId: Number(orderData.wilaya),
        municipalityId: orderData.municipality,
        items: [{
          name: productName,
          quantity: orderData.quantity,
          price: selectedProduct.price,
          total: selectedProduct.price * orderData.quantity,
          productId: selectedProduct.id,
        }],
        subtotal: quickSubtotal,
        deliveryFee: quickDeliveryFee,
        deliveryMethod: quickDeliveryMethod,
        total: grandTotal,
        source: 'quick-order',
        paymentMethod,
        discount: discountAmount > 0 ? discountAmount : undefined,
        discountCode: appliedCoupon?.code,
      });

      setSubmitted(true);
      setLastOrderId(record.id);
      void submitOrderToSheet({
        name: orderData.fullName,
        phone: orderData.phone,
        product: productName,
        quantity: orderData.quantity,
        address: orderData.address,
        email: orderData.email,
        wilaya: wilayaName,
        total: grandTotal,
        notes: `المصدر: طلب سريع${appliedCoupon ? ` | كود: ${appliedCoupon.code}` : ''}`,
      });
      toast.success(t({ ar: 'تم تسجيل الطلب بنجاح!', fr: 'Commande enregistrée avec succès!', en: 'Order saved successfully!' }));
    } catch (err: any) {
      console.error('[Products] quick-order failed:', err);
      toast.error(describeOrderError(err, language) || err?.message || t({
        ar: 'تعذر إرسال الطلب. حاول مرة أخرى.',
        fr: 'Impossible d\'envoyer la commande. Réessayez.',
        en: 'Could not send the order. Please try again.',
      }));
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  const selectedName = selectedProduct
    ? language === 'ar'
      ? selectedProduct.nameAr
      : language === 'fr'
      ? selectedProduct.nameFr
      : selectedProduct.nameEn
    : '';

  return (
    <section id="products" className="py-20 bg-gradient-to-b from-white/80 to-slate-50/70 dark:from-transparent dark:to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="mb-4">
            {t({ ar: 'منتجات الإعلام الآلي', fr: 'Produits informatiques', en: 'IT Products' })}
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

          <div className="flex flex-wrap items-center justify-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label={t({ ar: 'ترتيب', fr: 'Trier', en: 'Sort' })}
              className="rounded-2xl border-2 border-border bg-card px-4 py-2.5 text-sm font-semibold outline-none transition focus:border-primary cursor-pointer"
            >
              <option value="newest">{t({ ar: 'الأحدث', fr: 'Plus récents', en: 'Newest' })}</option>
              <option value="priceAsc">{t({ ar: 'السعر: من الأقل للأعلى', fr: 'Prix: croissant', en: 'Price: low to high' })}</option>
              <option value="priceDesc">{t({ ar: 'السعر: من الأعلى للأقل', fr: 'Prix: décroissant', en: 'Price: high to low' })}</option>
              <option value="name">{t({ ar: 'الاسم: أ - ي', fr: 'Nom: A - Z', en: 'Name: A - Z' })}</option>
            </select>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="product-filters"
              className={`lg:hidden inline-flex items-center gap-2 rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold transition ${
                activeFilterCount > 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t({ ar: 'الفلاتر', fr: 'Filtres', en: 'Filters' })}
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </button>
            <div
              role="tablist"
              aria-label={t({ ar: 'فئات المنتجات', fr: 'Catégories de produits', en: 'Product categories' })}
              className="contents"
            >
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
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

          {/* Brand / price / availability filters */}
          <div
            id="product-filters"
            className={`mt-4 ${filtersOpen ? 'grid' : 'hidden'} lg:grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end`}
          >
            <div>
              <label htmlFor="filter-brand" className="mb-1.5 block text-xs font-bold text-muted-foreground">
                {t({ ar: 'الماركة', fr: 'Marque', en: 'Brand' })}
              </label>
              <select
                id="filter-brand"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold outline-none transition focus:border-primary"
              >
                <option value="all">{t({ ar: 'كل الماركات', fr: 'Toutes les marques', en: 'All brands' })}</option>
                {brands.map((brandName) => (
                  <option key={brandName} value={brandName}>{brandName}</option>
                ))}
              </select>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-bold text-muted-foreground">
                {t({ ar: 'السعر (د.ج)', fr: 'Prix (DZD)', en: 'Price (DZD)' })}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder={t({ ar: 'من', fr: 'Min', en: 'Min' })}
                  aria-label={t({ ar: 'السعر الأدنى', fr: 'Prix minimum', en: 'Minimum price' })}
                  dir="ltr"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                />
                <span aria-hidden="true" className="text-muted-foreground">—</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder={t({ ar: 'إلى', fr: 'Max', en: 'Max' })}
                  aria-label={t({ ar: 'السعر الأقصى', fr: 'Prix maximum', en: 'Maximum price' })}
                  dir="ltr"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary"
                />
              </div>
            </div>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-semibold">
              <input
                type="checkbox"
                checked={stockOnly}
                onChange={(e) => setStockOnly(e.target.checked)}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              {t({ ar: 'المتوفر في المخزون فقط', fr: 'En stock uniquement', en: 'In stock only' })}
            </label>
            <button
              type="button"
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" />
              {t({ ar: 'مسح الفلاتر', fr: 'Réinitialiser', en: 'Reset filters' })}
            </button>
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
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {paginatedProducts.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 6}
              quantity={quantities[product.id] || 1}
              onDetails={openProductDetails}
              onOrder={openOrderModal}
              onQuickView={openQuickView}
              onQuantityChange={updateQuantity}
            />
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
          className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center sm:p-6 bg-black/60"
          onClick={closeProductDetails}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-full sm:max-w-4xl aos-sheet rounded-t-[28px] sm:rounded-[32px] border border-border bg-background shadow-2xl"
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
                  const shareUrl = `${window.location.origin}${productPath(viewingProduct)}`;
                  const shareData = {
                    title: language === 'ar' ? viewingProduct.nameAr : language === 'fr' ? viewingProduct.nameFr : viewingProduct.nameEn,
                    text: language === 'ar' ? viewingProduct.descAr : language === 'fr' ? viewingProduct.descFr : viewingProduct.descEn,
                    url: shareUrl,
                  };
                  if (navigator.share) navigator.share(shareData);
                  else navigator.clipboard.writeText(shareUrl);
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
                    {t({ ar: 'منتجات قد تهمك', fr: 'Vous pourriez aimer', en: 'You may also like' })}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {products.filter(p => viewingProduct.relatedIds.includes(p.id) && !p.hidden).map((rel) => (
                      <button
                        key={rel.id}
                        onClick={() => openProductDetails(rel)}
                        className="group bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-lg transition-all p-3 text-center"
                      >
                        <div className="h-20 bg-muted rounded-lg mb-2 overflow-hidden">
                          <img src={rel.image} alt={rel.nameEn || ''} className="w-full h-full object-contain p-2 bg-white/50 dark:bg-white/5" loading="lazy" />
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

              <a
                href={productPath(viewingProduct)}
                className="mt-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <Eye className="w-4 h-4" />
                {t({ ar: 'فتح صفحة المنتج', fr: 'Voir la fiche produit', en: 'View product page' })}
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Order Form Modal — portalled to <body> so it escapes the page stacking context */}
      {selectedProduct && createPortal(
        <AnimatePresence>
        <motion.div
          key="order-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center sm:p-6 bg-black/70 sm:bg-black/60 sm:backdrop-blur-sm"
          onClick={closeOrderModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', duration: 0.6 }}
            role="dialog"
            aria-modal="true"
            aria-label={t({ ar: 'نموذج طلب', fr: 'Formulaire de commande', en: 'Order Form' })}
            className="aos-order-sheet aos-sheet w-full sm:max-w-4xl rounded-t-[28px] sm:rounded-[40px] border border-border bg-background shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {submitted ? (
              /* Thank You Screen */
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
                    {t({ ar: 'شكراً لك!', fr: 'Merci!', en: 'Thank you!' })}
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
                {/* Header + compact product summary */}
                <div className="relative px-5 sm:px-8 pt-6 sm:pt-8 pb-6 border-b border-border bg-gradient-to-br from-primary/[0.04] to-transparent safe-area-top">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold mb-3">
                        <ShoppingCart className="w-4 h-4" />
                        {t({ ar: 'نموذج طلب', fr: 'Formulaire de commande', en: 'Order Form' })}
                      </div>

                      {/* Compact summary: image · name · price */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-muted">
                          <img
                            src={selectedProduct!.image}
                            alt={selectedName}
                            loading="lazy"
                            className="w-full h-full object-contain bg-white/50 dark:bg-white/5"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-lg sm:text-2xl font-bold leading-snug line-clamp-2">{selectedName}</h3>
                          <p className="text-sm font-black text-primary">
                            {(selectedProduct!.salePrice && selectedProduct!.saleEnd && new Date(selectedProduct!.saleEnd) > new Date()
                              ? selectedProduct!.salePrice
                              : selectedProduct!.price
                            ).toLocaleString()} د.ج
                          </p>
                        </div>
                      </div>

                      <p className="text-sm sm:text-base text-muted-foreground">
                        {t({ ar: 'املأ البيانات أدناه لإتمام طلبك', fr: 'Remplissez les informations ci-dessous', en: 'Fill in your details below' })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeOrderModal}
                      aria-label={t({ ar: 'إغلاق', fr: 'Fermer', en: 'Close' })}
                      className="shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl border border-border bg-card p-3 text-muted-foreground hover:text-foreground hover:border-primary hover:shadow-lg transition-all"
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

                      <div className="mb-4">
                        <label className="block text-base font-bold mb-2">
                          {t({ ar: 'طريقة التوصيل', fr: 'Mode de livraison', en: 'Delivery method' })}
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {([
                            { id: 'home' as const, icon: Home, label: t({ ar: 'توصيل للمنزل', fr: 'À domicile', en: 'Home delivery' }) },
                            { id: 'desk' as const, icon: Store, label: t({ ar: 'مكتب التوصيل', fr: 'Point relais', en: 'Stop desk' }) },
                          ]).map((method) => {
                            const Icon = method.icon;
                            const active = deliveryMethod === method.id;
                            return (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() => setDeliveryMethod(method.id)}
                                className={`flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-bold transition ${
                                  active
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border bg-background hover:bg-muted'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {method.label}
                              </button>
                            );
                          })}
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
                              onClick={() => setOrderData((prev) => ({ ...prev, quantity: Math.min(prev.quantity + 1, selectedProduct?.stock ?? 10000) }))}
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
                              <img src={selectedProduct.image} alt={selectedProduct.nameEn || ''} className="w-full h-full object-contain bg-white/50 dark:bg-white/5" loading="lazy" />
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
                            <div className="flex justify-between text-base border-t border-border pt-3">
                              <span className="text-muted-foreground">{t({ ar: 'المجموع الفرعي', fr: 'Sous-total', en: 'Subtotal' })}</span>
                              <span className="font-bold">{quickSubtotal.toLocaleString()} د.ج</span>
                            </div>
                            <div className="flex justify-between text-base">
                              <span className="text-muted-foreground">
                                {t({ ar: 'التوصيل', fr: 'Livraison', en: 'Delivery' })}
                                {' · '}
                                {deliveryMethod === 'desk'
                                  ? t({ ar: 'مكتب', fr: 'Point relais', en: 'Stop desk' })
                                  : t({ ar: 'منزل', fr: 'Domicile', en: 'Home' })}
                                {quickQuote && quickQuote.billedWeightKg > 0 ? ` (${quickQuote.billedWeightKg} kg)` : ''}
                              </span>
                              <span className="font-bold">
                                {quickDeliveryFee === 0
                                  ? t({ ar: 'مجاني', fr: 'Gratuit', en: 'Free' })
                                  : `${quickDeliveryFee.toLocaleString()} د.ج`}
                              </span>
                            </div>
                            {quickQuote && quickQuote.oversizeSurcharge > 0 && (
                              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                {t({ ar: 'يشمل زيادة المنتج كبير الحجم', fr: 'Inclut le supplément volumineux', en: 'Includes the large-item surcharge' })}
                              </p>
                            )}
                            {quickDiscount > 0 && (
                              <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                                <span>{t({ ar: 'الخصم', fr: 'Réduction', en: 'Discount' })}</span>
                                <span className="font-semibold">-{quickDiscount.toLocaleString()} د.ج</span>
                              </div>
                            )}
                            <div className="flex justify-between text-lg font-bold text-primary border-t border-border pt-3">
                              <span>{t({ ar: 'الإجمالي', fr: 'Total', en: 'Total' })}</span>
                              <span className="text-xl">{quickTotal.toLocaleString()} د.ج</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                        <Banknote className="w-4 h-4" />
                        {t({ ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison', en: 'Cash on Delivery' })}
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
                              let coupons: any[] = [];
                              try { coupons = JSON.parse(raw); } catch { setCouponError(t({ ar: 'خطأ في البيانات', fr: 'Erreur de données', en: 'Data error' })); return; }
                              const coupon = coupons.find((c: any) => c.code.toLowerCase() === couponCode.trim().toLowerCase() && c.active);
                              if (!coupon) { setCouponError(t({ ar: 'الكود غير موجود', fr: 'Code inexistant', en: 'Code not found' })); return; }
                              if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) { setCouponError(t({ ar: 'منتهي الصلاحية', fr: 'Expiré', en: 'Expired' })); return; }
                              const sub = selectedProduct ? selectedProduct.price * orderData.quantity : 0;
                              if (coupon.minOrder > 0 && sub < coupon.minOrder) { setCouponError(t({ ar: `الحد الأدنى ${coupon.minOrder.toLocaleString()} د.ج`, fr: `Min ${coupon.minOrder.toLocaleString()} DZD`, en: `Min ${coupon.minOrder.toLocaleString()} DZD` })); return; }
                              let usageData: any[] = [];
                              try { const usageRaw = localStorage.getItem('aos_coupon_usage'); usageData = usageRaw ? JSON.parse(usageRaw) : []; } catch { usageData = []; }
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
                      <TrustBadges />
                      <button
                        type="submit"
                        disabled={submitting}
                        className="hidden sm:block w-full rounded-2xl bg-gradient-to-r from-primary to-blue-700 px-6 py-5 text-primary-foreground font-bold text-xl shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 btn-liquid disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        {submitting
                          ? t({ ar: 'جارٍ إرسال الطلب...', fr: 'Envoi en cours...', en: 'Sending order...' })
                          : t({ ar: 'تأكيد الطلب', fr: 'Confirmer la commande', en: 'Confirm Order' })}
                      </button>

                      <p className="hidden sm:block text-xs text-center text-muted-foreground">
                        {t({ ar: 'بإتمام الطلب، أنت توافق على شروط الخدمة', fr: 'En commandant, vous acceptez nos conditions', en: 'By ordering, you agree to our terms' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile: sticky action bar so Confirm is always reachable above the keyboard */}
                <div className="sm:hidden sticky bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-2xl bg-gradient-to-r from-primary to-blue-700 px-6 py-4 min-h-[52px] text-primary-foreground font-bold text-lg shadow-xl shadow-primary/20 transition-all duration-300 btn-liquid disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {submitting
                      ? t({ ar: 'جارٍ إرسال الطلب...', fr: 'Envoi en cours...', en: 'Sending order...' })
                      : t({ ar: 'تأكيد الطلب', fr: 'Confirmer la commande', en: 'Confirm Order' })}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
        </AnimatePresence>,
        document.body
      )}

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
          className="fixed inset-0 z-[var(--z-modal)] flex items-end sm:items-center justify-center sm:p-6 bg-black/50"
          onClick={closeQuickView}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="w-full max-w-md aos-sheet rounded-t-[28px] sm:rounded-2xl bg-background border border-border shadow-2xl"
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
              <div className="flex items-center gap-3">
                {quickViewProduct.salePrice && quickViewProduct.saleEnd && new Date(quickViewProduct.saleEnd) > new Date() ? (
                  <>
                    <span className="text-2xl font-bold text-primary">
                      {quickViewProduct.salePrice.toLocaleString()} د.ج
                    </span>
                    <span className="text-sm text-muted-foreground line-through">
                      {quickViewProduct.price.toLocaleString()} د.ج
                    </span>
                  </>
                ) : (
                  <span className="text-2xl font-bold text-primary">
                    {quickViewProduct.price.toLocaleString()} د.ج
                  </span>
                )}
              </div>

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

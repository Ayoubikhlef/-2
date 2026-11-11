import { useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart,
  MessageCircle,
  ShieldCheck,
  Truck,
  PackageCheck,
  PackageX,
  ChevronLeft,
  ChevronRight,
  Home,
  Phone,
  RotateCcw,
  Banknote,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { products as defaultProducts, type Product } from '../data/products';
import { loadProductsFromServer } from '../utils/productStorage';
import { findProductBySlug, productPath } from '../utils/productPath';
import { applyProductSeo, getProductPricing } from '../utils/productSeo';
import { getSiteSettings } from '../utils/siteSettingsStorage';
import type { Review } from '../utils/reviewStorage';
import { Reviews } from './Reviews';
import { formatPrice } from '../lib/utils';

function productName(product: Product, language: 'ar' | 'fr' | 'en') {
  return language === 'ar' ? product.nameAr : language === 'fr' ? product.nameFr : product.nameEn;
}

function productText(product: Product, language: 'ar' | 'fr' | 'en') {
  return language === 'ar' ? product.descAr : language === 'fr' ? product.descFr : product.descEn;
}

export function ProductPage({ slug }: { slug: string }) {
  const { language, t } = useLanguage();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    let cancelled = false;
    loadProductsFromServer(defaultProducts)
      .then((list) => {
        if (!cancelled && list && list.length) setProducts(list);
      })
      .catch(() => { /* keep the bundled catalog */ });
    return () => { cancelled = true; };
  }, []);

  const product = useMemo(() => {
    const visible = products.filter((item) => !item.hidden);
    return findProductBySlug(visible, slug);
  }, [products, slug]);

  const pricing = useMemo(() => (product ? getProductPricing(product) : null), [product]);

  // Never let the previous product's reviews leak into the next product page.
  useEffect(() => {
    setReviews([]);
  }, [product?.id]);

  useEffect(() => {
    if (!product || !pricing) return;
    applyProductSeo(product, pricing, reviews);
  }, [product, pricing, reviews]);

  if (!product || !pricing) {
    return (
      <section className="pt-28 pb-20">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <PackageX className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-3">
            {t({ ar: 'المنتج غير موجود', fr: 'Produit introuvable', en: 'Product not found' })}
          </h1>
          <p className="text-muted-foreground mb-8">
            {t({
              ar: 'قد يكون المنتج حُذف أو تغيّر رابطه. تصفّح كل المنتجات المتوفرة.',
              fr: "Ce produit a peut-être été supprimé ou son lien a changé. Découvrez tous nos produits disponibles.",
              en: 'This product may have been removed or its link changed. Browse all available products.',
            })}
          </p>
          <a
            href="/#products"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 font-bold text-primary-foreground transition hover:bg-primary/90"
          >
            <Home className="h-5 w-5" />
            {t({ ar: 'كل المنتجات', fr: 'Tous les produits', en: 'All products' })}
          </a>
        </div>
      </section>
    );
  }

  const name = productName(product, language);
  const images = [product.image, ...(product.images || [])].filter(Boolean);
  const contact = getSiteSettings().contact;
  const stock = Number(product.stock);
  const lowStock = Number.isFinite(stock) && stock > 0 && stock <= 3;
  const related = (product.relatedIds || [])
    .map((id) => products.find((item) => item.id === id && !item.hidden))
    .filter((item): item is Product => Boolean(item))
    .slice(0, 4);

  const whatsappText = encodeURIComponent(
    t({
      ar: `مرحبًا، أريد الاستفسار عن: ${name} (${pricing.price.toLocaleString()} د.ج)`,
      fr: `Bonjour, je souhaite des informations sur : ${name} (${pricing.price.toLocaleString()} DZD)`,
      en: `Hello, I would like information about: ${name} (${pricing.price.toLocaleString()} DZD)`,
    }),
  );

  const addToCart = (goToCheckout: boolean) => {
    if (!pricing.inStock) {
      toast.error(t({ ar: 'هذا المنتج غير متوفر حاليًا', fr: 'Produit actuellement en rupture de stock', en: 'This product is currently out of stock' }));
      return;
    }
    addItem({
      productId: product.id,
      quantity,
      price: pricing.price,
      name,
      stock: Number.isFinite(stock) ? stock : undefined,
      weight: product.weight,
      dimensions: product.dimensions,
    });
    if (goToCheckout) {
      // Let CartProvider persist the new line before the full navigation.
      setTimeout(() => { window.location.href = '/#checkout'; }, 120);
      return;
    }
    toast.success(t({ ar: 'أُضيف إلى السلة', fr: 'Ajouté au panier', en: 'Added to cart' }));
  };

  return (
    <>
    <section className="pt-24 pb-28 sm:pb-20 sm:pt-28">
      <div className="mx-auto max-w-6xl px-4">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <a href="/" className="transition hover:text-primary">
            {t({ ar: 'الرئيسية', fr: 'Accueil', en: 'Home' })}
          </a>
          <ChevronLeft className="h-4 w-4 rtl:block ltr:hidden" />
          <ChevronRight className="hidden h-4 w-4 ltr:block" />
          <a href="/#products" className="transition hover:text-primary">
            {t({ ar: 'المنتجات', fr: 'Produits', en: 'Products' })}
          </a>
          <ChevronLeft className="h-4 w-4 rtl:block ltr:hidden" />
          <ChevronRight className="hidden h-4 w-4 ltr:block" />
          <span className="line-clamp-1 font-medium text-foreground">{name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-sm dark:bg-white/5">
              <img
                src={images[activeImage] || product.image}
                alt={name}
                className="aspect-square w-full object-contain p-6"
                loading="eager"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {images.slice(0, 5).map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`${name} ${index + 1}`}
                    className={`overflow-hidden rounded-xl border bg-white p-1 transition dark:bg-white/5 ${
                      activeImage === index ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <img src={image} alt="" className="aspect-square w-full object-contain" loading="lazy" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {product.brand && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{product.brand}</span>
              )}
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                {t({ ar: 'مرجع', fr: 'Réf.', en: 'SKU' })}: {product.sku || `AOS-${product.id}`}
              </span>
            </div>

            <h1 className="mb-4 text-2xl font-extrabold leading-snug sm:text-3xl">{name}</h1>

            <div className="mb-5 flex flex-wrap items-end gap-3">
              <span className="text-3xl font-extrabold text-primary">{formatPrice(pricing.price)}</span>
              {pricing.onSale && (
                <span className="pb-1 text-lg text-muted-foreground line-through">{formatPrice(pricing.originalPrice)}</span>
              )}
            </div>

            <div className="mb-5">
              {pricing.inStock ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <PackageCheck className="h-4 w-4" />
                  {lowStock
                    ? t({ ar: `متبقٍ ${stock} فقط`, fr: `Plus que ${stock} en stock`, en: `Only ${stock} left` })
                    : t({ ar: 'متوفر في المخزون', fr: 'En stock', en: 'In stock' })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-600 dark:text-red-400">
                  <PackageX className="h-4 w-4" />
                  {t({ ar: 'غير متوفر حاليًا', fr: 'Rupture de stock', en: 'Out of stock' })}
                </span>
              )}
            </div>

            <p className="mb-7 text-base leading-relaxed text-muted-foreground">
              {productText(product, language) || product.shortDescFr}
            </p>

            <div className="mb-6 flex items-center gap-4">
              <span className="text-sm font-semibold">{t({ ar: 'الكمية', fr: 'Quantité', en: 'Quantity' })}</span>
              <div className="flex items-center overflow-hidden rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  className="px-4 py-2 text-lg font-bold transition hover:bg-muted"
                  aria-label="-"
                >
                  −
                </button>
                <span className="min-w-12 border-x border-border px-4 py-2 text-center font-semibold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.min(value + 1, Number.isFinite(stock) && stock > 0 ? stock : 999))}
                  className="px-4 py-2 text-lg font-bold transition hover:bg-muted"
                  aria-label="+"
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => addToCart(true)}
                disabled={!pricing.inStock}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-lg font-bold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingCart className="h-5 w-5" />
                {t({ ar: 'اطلب الآن', fr: 'Commander maintenant', en: 'Order now' })}
              </button>
              <button
                type="button"
                onClick={() => addToCart(false)}
                disabled={!pricing.inStock}
                className="flex items-center justify-center gap-2 rounded-2xl border border-border px-6 py-4 font-semibold transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t({ ar: 'أضف إلى السلة', fr: 'Ajouter au panier', en: 'Add to cart' })}
              </button>
            </div>

            <a
              href={`https://wa.me/${contact.phoneInternational}?text=${whatsappText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-7 inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-400"
            >
              <MessageCircle className="h-5 w-5" />
              {t({ ar: 'استفسر عبر واتساب', fr: 'Demander sur WhatsApp', en: 'Ask on WhatsApp' })}
            </a>

            <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Truck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{t({ ar: 'توصيل لكل الولايات', fr: 'Livraison 58 wilayas', en: 'Delivery to all wilayas' })}</p>
                  <p className="text-xs text-muted-foreground">{t({ ar: 'الدفع عند الاستلام', fr: 'Paiement à la livraison', en: 'Cash on delivery' })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <RotateCcw className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{t({ ar: 'إرجاع خلال 7 أيام', fr: 'Retour sous 7 jours', en: '7-day returns' })}</p>
                  <p className="text-xs text-muted-foreground">{t({ ar: 'في حالته الأصلية', fr: 'Dans son état d’origine', en: 'In original condition' })}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{t({ ar: 'ضمان المتجر', fr: 'Garantie magasin', en: 'Store warranty' })}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.warranty || t({ ar: 'منتج أصلي 100%', fr: 'Produit 100% original', en: '100% genuine product' })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold">{t({ ar: 'دفع آمن عند الاستلام', fr: 'Paiement à la réception', en: 'Pay on delivery' })}</p>
                  <p className="text-xs text-muted-foreground">{t({ ar: 'أو الدفع في المتجر', fr: 'Ou en magasin', en: 'Or pay in store' })}</p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{t({ ar: 'للطلب الهاتفي:', fr: 'Commande par téléphone :', en: 'Phone orders:' })}</span>
              <a href={`tel:${contact.phone}`} className="font-bold text-primary" dir="ltr">{contact.phoneDisplay}</a>
            </div>
          </div>
        </div>

        {product.specs?.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-5 text-xl font-bold">
              {t({ ar: 'المواصفات', fr: 'Spécifications', en: 'Specifications' })}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {product.specs.map((spec, index) => (
                <div
                  key={`${spec.label.en}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-5 py-4"
                >
                  <span className="text-sm font-medium text-muted-foreground">{spec.label[language]}</span>
                  <span className="text-sm font-semibold">{spec.value[language]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-14" id="product-reviews">
          <h2 className="mb-5 text-xl font-bold">
            {t({ ar: 'آراء العملاء', fr: 'Avis clients', en: 'Customer reviews' })}
          </h2>
          <Reviews productId={product.id} onReviewsChange={setReviews} />
        </div>

        {related.length > 0 && (
          <div className="mt-14">
            <h2 className="mb-5 text-xl font-bold">
              {t({ ar: 'منتجات ذات صلة', fr: 'Produits similaires', en: 'Related products' })}
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {related.map((item) => {
                const itemPricing = getProductPricing(item);
                return (
                  <a
                    key={item.id}
                    href={productPath(item)}
                    className="group rounded-2xl border border-border bg-card p-3 transition hover:border-primary/50 hover:shadow-lg"
                  >
                    <div className="mb-3 overflow-hidden rounded-xl bg-white dark:bg-white/5">
                      <img
                        src={item.image}
                        alt={productName(item, language)}
                        className="aspect-square w-full object-contain p-3 transition group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <p className="mb-1 line-clamp-2 text-sm font-semibold leading-snug">{productName(item, language)}</p>
                    <p className="text-sm font-bold text-primary">{formatPrice(itemPricing.price)}</p>
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>

    {/* Sticky purchase bar: mobile only, the highest-converting element on a product page. */}
    <div className="fixed inset-x-0 bottom-0 z-[calc(var(--z-float)-1)] border-t border-border bg-background/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-lg sm:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-muted-foreground">{name}</p>
          <p className="text-lg font-extrabold leading-tight text-primary">{formatPrice(pricing.price)}</p>
        </div>
        <button
          type="button"
          onClick={() => addToCart(true)}
          disabled={!pricing.inStock}
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-bold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ShoppingCart className="h-5 w-5" />
          {pricing.inStock
            ? t({ ar: 'اطلب الآن', fr: 'Commander', en: 'Order now' })
            : t({ ar: 'غير متوفر', fr: 'Rupture', en: 'Out of stock' })}
        </button>
      </div>
    </div>
    </>
  );
}

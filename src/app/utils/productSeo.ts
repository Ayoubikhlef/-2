import type { Product } from '../data/products';
import { productPath } from './productPath';

export const SITE_URL = 'https://aos-tech.store';
export const SITE_NAME = 'AOS Tech Store';

export interface ProductPricing {
  /** Price actually charged today (sale price when the sale is running). */
  price: number;
  originalPrice: number;
  onSale: boolean;
  inStock: boolean;
}

export function getProductPricing(product: Product): ProductPricing {
  const originalPrice = Number(product.price) || 0;
  const salePrice = product.salePrice == null ? null : Number(product.salePrice);
  const saleEnded = product.saleEnd ? new Date(product.saleEnd).getTime() <= Date.now() : false;
  const saleActive = salePrice != null && Number.isFinite(salePrice) && salePrice > 0 && salePrice < originalPrice && !saleEnded;
  const stock = Number(product.stock);
  return {
    price: saleActive ? salePrice! : originalPrice,
    originalPrice,
    onSale: saleActive,
    // A missing/!numeric stock means the product is unlimited, not sold out.
    inStock: !Number.isFinite(stock) ? true : stock > 0,
  };
}

export function absoluteUrl(path: string): string {
  if (!path) return `${SITE_URL}/icon-512.png`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export function productUrl(product: Pick<Product, 'id' | 'nameAr' | 'nameFr' | 'nameEn'>): string {
  return `${SITE_URL}${productPath(product)}`;
}

export function productTitle(product: Product): string {
  const name = product.nameFr || product.nameEn || product.nameAr;
  return `${name} | ${SITE_NAME}`;
}

export function productDescription(product: Product, pricing: ProductPricing): string {
  const text = product.descFr || product.descEn || product.descAr || product.shortDescFr || product.shortDescEn;
  const price = `${pricing.price.toLocaleString('fr-FR')} DZD`;
  return `${product.nameAr} (${product.nameFr}) — ${text}. Prix ${price}. Livraison dans les 58 wilayas d'Algérie. AOS Tech Store, El Milia, Jijel.`;
}

export function buildProductJsonLd(product: Product, pricing: ProductPricing) {
  const url = productUrl(product);
  const images = [product.image, ...(product.images || [])]
    .filter(Boolean)
    .map((image) => absoluteUrl(image));

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.nameAr,
    alternateName: [product.nameFr, product.nameEn].filter(Boolean),
    description: product.descAr || product.descFr || product.descEn,
    image: images.length ? images : [absoluteUrl('/icon-512.png')],
    sku: product.sku || `AOS-${product.id}`,
    mpn: product.sku || `AOS-${product.id}`,
    category: product.category || undefined,
    brand: {
      '@type': 'Brand',
      name: product.brand || SITE_NAME,
    },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'DZD',
      price: pricing.price,
      priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
      availability: pricing.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: SITE_NAME },
      // Matches the published Terms page: 7-day returns in store, 2-5 day
      // delivery across Algeria. No fake reviews or invented shipping rates.
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'DZ' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 2, maxValue: 5, unitCode: 'DAY' },
        },
      },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'DZ',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnInStore',
      },
    },
    url,
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };
}

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

function setCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
}

/** Updates the client-side head so SPA navigation and JS-rendered crawls agree with the SSR output. */
export function applyProductSeo(product: Product, pricing: ProductPricing) {
  if (typeof document === 'undefined') return;
  const url = productUrl(product);
  const title = productTitle(product);
  const description = productDescription(product, pricing);
  const image = absoluteUrl(product.image);

  document.title = title;
  setMeta('name', 'description', description);
  setCanonical(url);
  setMeta('property', 'og:type', 'product');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', image);
  setMeta('property', 'product:price:amount', String(pricing.price));
  setMeta('property', 'product:price:currency', 'DZD');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);

  if (!document.querySelector('script[data-aos-product-jsonld]')) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-aos-product-jsonld', 'true');
    script.textContent = JSON.stringify(buildProductJsonLd(product, pricing));
    document.head.appendChild(script);
  }
}

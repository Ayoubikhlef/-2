import type { Product } from '../data/products';

/**
 * Canonical, shareable product URLs.
 *
 * The numeric id is the source of truth (so renamed products never break a
 * link); the readable slug after it is cosmetic and only helps humans and
 * search engines understand the URL.
 */
export type ProductLinkSource = Pick<Product, 'id' | 'nameAr' | 'nameFr' | 'nameEn'>;

export function slugifyProductName(value: string): string {
  return (value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

export function productPath(product: ProductLinkSource): string {
  const slug = slugifyProductName(product.nameEn || product.nameFr || product.nameAr);
  return `/product/${product.id}${slug ? `-${slug}` : ''}`;
}

export function productIdFromSlug(slug: string): number | null {
  const match = /^(\d+)/.exec(decodeURIComponent(slug || ''));
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function findProductBySlug<T extends ProductLinkSource>(products: T[], slug: string): T | undefined {
  const id = productIdFromSlug(slug);
  if (id !== null) {
    const byId = products.find((product) => product.id === id);
    if (byId) return byId;
  }
  const normalized = decodeURIComponent(slug || '')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();
  return products.find(
    (product) => productPath(product).slice('/product/'.length).toLowerCase() === normalized,
  );
}

export function productPathFromUrl(pathname: string): string | null {
  const match = /^\/product\/([^/]+)\/?$/.exec(pathname || '');
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

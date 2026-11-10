/**
 * Server-rendered product pages.
 *
 * Vercel rewrites `/product/<id>-<slug>` here. The function fetches the live
 * catalog (price, stock, images) and injects the correct <head> tags plus
 * Product JSON-LD into the built SPA shell, so Google, Facebook, WhatsApp and
 * other non-JS clients see the real product without executing React.
 * The SPA then boots normally and takes over.
 */

const SITE = 'https://aos-tech.store';
const API = 'https://iueefgma6y.onrender.com/api/products';
const PRODUCT_CACHE_MS = 60_000;
const SHELL_CACHE_MS = 5 * 60_000;

interface Product {
  id: number;
  nameAr: string;
  nameFr: string;
  nameEn: string;
  descAr: string;
  descFr: string;
  descEn: string;
  shortDescAr: string;
  shortDescFr: string;
  shortDescEn: string;
  price: number;
  salePrice: number | null;
  saleEnd: string | null;
  sku: string;
  image: string;
  images: string[];
  category: string;
  brand: string;
  hidden: boolean;
  stock: number;
  specs: { label: Record<string, string>; value: Record<string, string> }[];
}

let productCache: { items: Product[]; at: number } | null = null;
let shellCache: { html: string; at: number } | null = null;

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(value: string): string {
  return (value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

function productIdFromSlug(slug: string): number | null {
  const match = /^(\d+)/.exec(slug);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function absoluteUrl(path: string): string {
  if (!path) return `${SITE}/icon-512.png`;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE}${path.startsWith('/') ? '' : '/'}${path}`;
}

function pricing(product: Product) {
  const originalPrice = Number(product.price) || 0;
  const salePrice = product.salePrice == null ? null : Number(product.salePrice);
  const saleEnded = product.saleEnd ? new Date(product.saleEnd).getTime() <= Date.now() : false;
  const onSale = salePrice != null && Number.isFinite(salePrice) && salePrice > 0 && salePrice < originalPrice && !saleEnded;
  const stock = Number(product.stock);
  return {
    price: onSale ? salePrice! : originalPrice,
    originalPrice,
    onSale,
    inStock: !Number.isFinite(stock) ? true : stock > 0,
  };
}

async function getProducts(): Promise<Product[]> {
  if (productCache && Date.now() - productCache.at < PRODUCT_CACHE_MS) return productCache.items;
  const res = await fetch(API, {
    signal: AbortSignal.timeout(8_000),
    headers: { 'User-Agent': 'aos-product-page', Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`products HTTP ${res.status}`);
  const json: any = await res.json();
  const items: Product[] = (Array.isArray(json) ? json : json?.products) || [];
  const visible = items.filter((item) => item && !item.hidden && Number.isFinite(Number(item.id)));
  productCache = { items: visible, at: Date.now() };
  return visible;
}

async function getShell(): Promise<string> {
  if (shellCache && Date.now() - shellCache.at < SHELL_CACHE_MS) return shellCache.html;
  const res = await fetch(`${SITE}/index.html`, {
    signal: AbortSignal.timeout(8_000),
    headers: { 'User-Agent': 'aos-product-page' },
  });
  if (!res.ok) throw new Error(`shell HTTP ${res.status}`);
  const html = await res.text();
  if (!html.includes('id="root"')) throw new Error('shell missing #root');
  shellCache = { html, at: Date.now() };
  return html;
}

function replaceMeta(html: string, attribute: 'name' | 'property', key: string, content: string): string {
  const pattern = new RegExp(`<meta\\s+${attribute}="${key}"[^>]*>`, 'i');
  const tag = `<meta ${attribute}="${key}" content="${escapeHtml(content)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function removeMeta(html: string, attribute: 'name' | 'property', key: string): string {
  const pattern = new RegExp(`\\s*<meta\\s+${attribute}="${key}"[^>]*>`, 'gi');
  return html.replace(pattern, '');
}

function buildJsonLd(product: Product, price: number, inStock: boolean, url: string) {
  const images = [product.image, ...(product.images || [])].filter(Boolean).map(absoluteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.nameAr || product.nameFr || product.nameEn,
    alternateName: [product.nameFr, product.nameEn].filter(Boolean),
    description: product.descAr || product.descFr || product.descEn,
    image: images.length ? images : [absoluteUrl('/icon-512.png')],
    sku: product.sku || `AOS-${product.id}`,
    mpn: product.sku || `AOS-${product.id}`,
    category: product.category || undefined,
    brand: { '@type': 'Brand', name: product.brand || 'AOS Tech Store' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'DZD',
      price,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'AOS Tech Store' },
    },
    url,
    isPartOf: { '@id': `${SITE}/#website` },
  };
}

function renderFallback(product: Product, price: number, inStock: boolean, url: string): string {
  const name = product.nameAr || product.nameFr;
  const specs = (product.specs || [])
    .slice(0, 8)
    .map((spec) => `<li>${escapeHtml(spec.label?.ar || spec.label?.fr)}: ${escapeHtml(spec.value?.ar || spec.value?.fr)}</li>`)
    .join('');
  return `
        <h1>${escapeHtml(name)} - AOS Tech Store</h1>
        <p>${escapeHtml(product.descAr || product.descFr || '')}</p>
        <p><strong>${escapeHtml(price.toLocaleString('fr-FR'))} DZD</strong> — ${inStock ? 'متوفر في المخزون / En stock' : 'غير متوفر حاليًا / Rupture de stock'}</p>
        ${specs ? `<h2>المواصفات / Spécifications</h2><ul>${specs}</ul>` : ''}
        <p><a href="${escapeHtml(url)}">${escapeHtml(name)}</a> — <a href="/#products">كل المنتجات</a></p>
        <p>AOS Tech Store (أوس تك / Ayoub Office Services) — El Milia, Jijel. الهاتف: <a href="tel:+213674113290">0674 11 32 90</a></p>
        `;
}

function renderProductPage(shell: string, product: Product): string {
  const p = pricing(product);
  const slug = slugify(product.nameEn || product.nameFr || product.nameAr);
  const url = `${SITE}/product/${product.id}${slug ? `-${slug}` : ''}`;
  const title = `${product.nameFr || product.nameEn || product.nameAr} | AOS Tech Store`;
  const description = `${product.nameAr} (${product.nameFr}) — ${product.descFr || product.descEn || ''}. Prix ${p.price.toLocaleString('fr-FR')} DZD. Livraison 58 wilayas. AOS Tech Store, El Milia, Jijel.`;
  const image = absoluteUrl(product.image);

  let html = shell;
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  html = replaceMeta(html, 'name', 'description', description);
  html = html.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(url)}" />`);

  html = replaceMeta(html, 'property', 'og:title', title);
  html = replaceMeta(html, 'property', 'og:description', description);
  html = replaceMeta(html, 'property', 'og:url', url);
  html = replaceMeta(html, 'property', 'og:type', 'product');
  html = replaceMeta(html, 'property', 'og:image', image);
  html = removeMeta(html, 'property', 'og:image:width');
  html = removeMeta(html, 'property', 'og:image:height');
  html = removeMeta(html, 'property', 'og:image:alt');
  html = replaceMeta(html, 'property', 'product:price:amount', String(p.price));
  html = replaceMeta(html, 'property', 'product:price:currency', 'DZD');

  html = replaceMeta(html, 'name', 'twitter:card', 'summary_large_image');
  html = replaceMeta(html, 'name', 'twitter:title', title);
  html = replaceMeta(html, 'name', 'twitter:description', description);
  html = replaceMeta(html, 'name', 'twitter:image', image);

  // The homepage FAQ rich result does not belong on a product URL.
  html = html.replace(/(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/i, (full, open, body, close) => {
    try {
      const data = JSON.parse(body);
      if (Array.isArray(data?.['@graph'])) {
        data['@graph'] = data['@graph'].filter((node: any) => {
          const type = node?.['@type'];
          return Array.isArray(type) ? !type.includes('FAQPage') : type !== 'FAQPage';
        });
      }
      return `${open}${JSON.stringify(data)}${close}`;
    } catch {
      return full;
    }
  });

  const jsonLd = JSON.stringify(buildJsonLd(product, p.price, p.inStock, url));
  html = html.replace(
    '</head>',
    `  <script type="application/ld+json" data-aos-product-jsonld="true">${jsonLd}</script>\n  </head>`,
  );

  const fallbackStart = html.indexOf('<div id="seo-fallback"');
  const fallbackEnd = fallbackStart === -1 ? -1 : html.indexOf('<div id="boot-screen"', fallbackStart);
  if (fallbackStart !== -1 && fallbackEnd !== -1) {
    html =
      html.slice(0, fallbackStart) +
      `<div id="seo-fallback" dir="rtl">${renderFallback(product, p.price, p.inStock, url)}</div>\n      ` +
      html.slice(fallbackEnd);
  }

  return html;
}

function notFoundPage(): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>المنتج غير موجود | AOS Tech Store</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0f172a;color:#e2e8f0;font-family:system-ui,sans-serif;text-align:center;padding:24px} a{color:#60a5fa}</style>
</head>
<body>
<main>
<h1>المنتج غير موجود</h1>
<p>قد يكون المنتج حُذف أو تغيّر رابطه.</p>
<p><a href="https://aos-tech.store/#products">تصفّح كل المنتجات</a></p>
</main>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
  const rawSlug = String(req?.query?.slug || '').replace(/^\/+|\/+$/g, '');
  const slug = (() => {
    try { return decodeURIComponent(rawSlug); } catch { return rawSlug; }
  })();

  try {
    const products = await getProducts();
    const id = productIdFromSlug(slug);
    const product = (id === null ? undefined : products.find((item) => item.id === id))
      || products.find((item) => {
        const itemSlug = slugify(item.nameEn || item.nameFr || item.nameAr);
        return `${item.id}${itemSlug ? `-${itemSlug}` : ''}`.toLowerCase() === slug.toLowerCase();
      });

    if (!product) {
      res.status(404);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      res.send(notFoundPage());
      return;
    }

    const shell = await getShell();
    const html = renderProductPage(shell, product);

    res.status(200);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.send(html);
  } catch (error) {
    // Never take product pages down because the API is cold: serve the plain
    // SPA shell and let the client render it.
    console.error('[product-page] fallback:', (error as Error).message);
    try {
      const shell = await getShell();
      res.status(200);
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, max-age=0, must-revalidate');
      res.send(shell);
    } catch {
      res.status(302);
      res.setHeader('Location', '/#products');
      res.end();
    }
  }
}

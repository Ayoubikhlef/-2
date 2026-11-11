/**
 * Regenerates public/sitemap.xml before every build so new products are
 * discoverable by search engines without touching the file by hand.
 *
 * If the catalog API is unreachable the existing sitemap is kept, so a network
 * hiccup can never break a deployment.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SITE = 'https://aos-tech.store';
const API = 'https://iueefgma6y.onrender.com/api/products';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(root, 'public', 'sitemap.xml');

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function absoluteUrl(value) {
  if (!value) return `${SITE}/icon-512.png`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE}${value.startsWith('/') ? '' : '/'}${value}`;
}

function urlEntry(loc, priority, changefreq, images = []) {
  const imageEntries = images
    .filter((image) => image && image.loc)
    .slice(0, 10)
    .map(
      (image) => `    <image:image>
      <image:loc>${escapeXml(image.loc)}</image:loc>
      <image:title>${escapeXml(image.title || '')}</image:title>
    </image:image>`,
    )
    .join('\n');

  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageEntries ? `\n${imageEntries}` : ''}
  </url>`;
}

async function main() {
  const res = await fetch(API, {
    signal: AbortSignal.timeout(15_000),
    headers: { Accept: 'application/json', 'User-Agent': 'aos-sitemap' },
  });
  if (!res.ok) throw new Error(`catalog HTTP ${res.status}`);

  const json = await res.json();
  const list = Array.isArray(json) ? json : json?.products || [];
  const products = list.filter((product) => product && !product.hidden && Number.isFinite(Number(product.id)));

  const entries = [
    urlEntry(`${SITE}/`, '1.0', 'weekly', [
      { loc: absoluteUrl('/icon-512.png'), title: 'AOS Tech Store - أوس تك' },
    ]),
    ...products.map((product) => {
      const slug = slugify(product.nameEn || product.nameFr || product.nameAr);
      const images = [product.image, ...(product.images || [])]
        .filter(Boolean)
        .map((image) => ({ loc: absoluteUrl(image), title: product.nameAr || product.nameFr || product.nameEn }));
      return urlEntry(
        `${SITE}/product/${product.id}${slug ? `-${slug}` : ''}`,
        '0.8',
        'weekly',
        images,
      );
    }),
    urlEntry(`${SITE}/create-website`, '0.5', 'monthly'),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.join('\n')}
</urlset>
`;

  writeFileSync(target, xml, 'utf8');
  console.log(`[sitemap] wrote ${entries.length} urls`);
}

main().catch((error) => {
  console.warn(`[sitemap] keeping existing file: ${error.message}`);
});

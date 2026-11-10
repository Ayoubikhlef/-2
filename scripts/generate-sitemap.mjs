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

function urlEntry(loc, priority, changefreq) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
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
    urlEntry(`${SITE}/`, '1.0', 'weekly'),
    ...products.map((product) => {
      const slug = slugify(product.nameEn || product.nameFr || product.nameAr);
      return urlEntry(`${SITE}/product/${product.id}${slug ? `-${slug}` : ''}`, '0.8', 'weekly');
    }),
    urlEntry(`${SITE}/create-website`, '0.5', 'monthly'),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;

  writeFileSync(target, xml, 'utf8');
  console.log(`[sitemap] wrote ${entries.length} urls`);
}

main().catch((error) => {
  console.warn(`[sitemap] keeping existing file: ${error.message}`);
});

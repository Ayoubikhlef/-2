import type { Lang } from '../defaults';
import type { RenderedFile, RenderedSite, RenderConfig, RenderProduct } from './types';
import { attr, dataUrlAsset, esc, mimeFor, safeColor } from './types';
import { renderShell, initials } from './shell';
import { jsonLdFor, pageFor } from './sections';
import { SITE_CSS } from './styles';
import { SITE_JS } from './client';

const LANGS: Lang[] = ['ar', 'fr', 'en'];

function langLabel(lang: Lang): string {
  return lang === 'ar' ? 'العربية' : lang === 'fr' ? 'Français' : 'English';
}

function pageFile(lang: Lang, defaultLang: Lang): string {
  return lang === defaultLang ? 'index.html' : `${lang}.html`;
}

function siteTitle(config: RenderConfig, lang: Lang): string {
  const tagline = config.tagline || config.category || '';
  if (!tagline || tagline === config.siteName) return config.siteName;
  return `${config.siteName} — ${tagline}`;
}

function siteDescription(config: RenderConfig): string {
  const text = config.description || config.tagline || config.siteName;
  return text.replace(/\s+/g, ' ').trim().slice(0, 158);
}

export function renderSite(input: RenderConfig): RenderedSite {
  const config: RenderConfig = {
    ...input,
    primaryColor: safeColor(input.primaryColor, '#0b5ed7'),
    secondaryColor: safeColor(input.secondaryColor, '#1e3a8a'),
    products: (input.products || []).map((p) => ({ ...p })),
    services: (input.services || []).filter((s) => s && s.title).map((s) => ({ ...s })),
    socials: {
      facebook: input.socials?.facebook || '',
      instagram: input.socials?.instagram || '',
      tiktok: input.socials?.tiktok || '',
    },
  };

  const files: Record<string, RenderedFile> = {};
  const addFile = (path: string, content: string | Buffer, encoding: 'utf8' | 'base64' = 'utf8') => {
    files[path] = {
      content: typeof content === 'string' ? content : content.toString('base64'),
      encoding,
      type: mimeFor(path),
    };
  };

  // Logo / cover / product images -> real files (or remote URLs kept as-is).
  const logo = dataUrlAsset(config.logoUrl);
  if (logo) {
    const path = `assets/logo.${logo.ext}`;
    addFile(path, logo.buffer, 'base64');
    config.logoAssetPath = path;
  } else if (config.logoUrl && /^https?:\/\//i.test(config.logoUrl)) {
    config.logoAssetPath = config.logoUrl;
  } else {
    config.logoAssetPath = null;
  }

  const cover = dataUrlAsset(config.coverUrl);
  if (cover) {
    const path = `assets/cover.${cover.ext}`;
    addFile(path, cover.buffer, 'base64');
    config.coverUrl = path;
  } else if (config.coverUrl && !/^https?:\/\//i.test(config.coverUrl)) {
    config.coverUrl = null;
  }

  config.products = config.products.map((product: RenderProduct, index: number) => {
    const image = dataUrlAsset(product.imageUrl);
    if (!image) {
      return { ...product, imageUrl: product.imageUrl && /^https?:\/\//i.test(product.imageUrl) ? product.imageUrl : null };
    }
    const path = `assets/product-${index + 1}.${image.ext}`;
    addFile(path, image.buffer, 'base64');
    return { ...product, imageUrl: path };
  });

  const domain = (config.customDomain || `${config.subdomain}.pages.dev`).replace(/^https?:\/\//i, '').replace(/\/+$/, '');
  const siteUrl = `https://${domain}`;
  const defaultLang: Lang = LANGS.includes(config.language) ? config.language : 'ar';
  const alternates: Record<string, string> = {};
  const pagePaths: Record<string, string> = {};
  for (const lang of LANGS) {
    const file = pageFile(lang, defaultLang);
    alternates[lang] = file;
    pagePaths[lang] = file;
  }

  for (const lang of LANGS) {
    const page = pageFor(config.templateSlug, config, lang);
    const html = renderShell({
      config,
      lang,
      pagePath: pagePaths[lang],
      alternates,
      title: siteTitle(config, lang),
      description: siteDescription(config),
      body: page,
      jsonLd: jsonLdFor(config.templateSlug, config, siteUrl),
      siteUrl,
      coverFile: config.coverUrl || null,
      favicon: 'assets/favicon.svg',
      extraHead: config.preview ? '<meta name="robots" content="noindex,nofollow">' : '',
    });
    addFile(pagePaths[lang], html);
  }

  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="${config.primaryColor}"/><text x="32" y="42" font-family="Arial,Helvetica,sans-serif" font-size="27" font-weight="700" text-anchor="middle" fill="#fff">${esc(initials(config.siteName))}</text></svg>`;
  addFile('assets/favicon.svg', faviconSvg);
  addFile('assets/site.css', SITE_CSS);
  addFile('assets/site.js', SITE_JS);

  const manifest = {
    name: config.siteName,
    short_name: config.siteName.slice(0, 30),
    description: siteDescription(config),
    lang: defaultLang,
    dir: defaultLang === 'ar' ? 'rtl' : 'ltr',
    start_url: './',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: config.primaryColor,
    icons: [
      {
        src: 'assets/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
  addFile('manifest.webmanifest', JSON.stringify(manifest, null, 2));

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LANGS.map((lang) => `  <url>
    <loc>${attr(`${siteUrl}/${pagePaths[lang]}`)}</loc>
${LANGS.map((alt) => `    <xhtml:link rel="alternate" hreflang="${alt}" href="${attr(`${siteUrl}/${pagePaths[alt]}`)}"/>`).join('\n')}
    <changefreq>weekly</changefreq>
    <priority>${lang === defaultLang ? '1.0' : '0.8'}</priority>
  </url>`).join('\n')}
</urlset>`;
  addFile('sitemap.xml', sitemap);
  addFile('robots.txt', config.preview ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);

  const notFound = `<!doctype html><html lang="${defaultLang}" dir="${defaultLang === 'ar' ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>404 — ${esc(config.siteName)}</title><link rel="stylesheet" href="assets/site.css"><style>:root{--p:${config.primaryColor};--p2:${config.secondaryColor};--p-ink:#fff;--bg:#f8fafc;--surface:#fff;--ink:#0f172a;--muted:#64748b;--line:#e2e8f0;--font:'Cairo','Outfit',sans-serif}</style></head><body class="tpl-${config.templateSlug}"><main style="min-height:80dvh;display:grid;place-items:center;text-align:center;padding:24px"><div><div style="font-size:5rem;font-weight:900;color:var(--p);line-height:1">404</div><h1 class="h2" style="margin-top:12px">${esc(config.siteName)}</h1><p class="lead" style="margin:12px auto 24px">${esc(config.tagline)}</p><a class="btn btn-primary" href="index.html">${langLabel(defaultLang)}</a></div></main></body></html>`;
  addFile('404.html', notFound);

  let size = 0;
  for (const file of Object.values(files)) {
    size += file.encoding === 'base64' ? Math.ceil(file.content.length * 0.75) : Buffer.byteLength(file.content, 'utf8');
  }

  return {
    files,
    defaultPage: pagePaths[defaultLang],
    pages: pagePaths,
    siteUrl,
    previewUrl: undefined,
    size,
  };
}

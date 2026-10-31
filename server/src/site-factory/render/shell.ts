import { esc, attr, ui, type RenderConfig, type UiStrings } from './types';

type IconName =
  | 'phone' | 'whatsapp' | 'mail' | 'map' | 'clock' | 'arrow' | 'check' | 'star'
  | 'cart' | 'menu' | 'x' | 'globe' | 'shield' | 'truck' | 'spark' | 'instagram'
  | 'facebook' | 'tiktok' | 'chevron' | 'plus' | 'search' | 'send' | 'user'
  | 'calendar' | 'users' | 'briefcase' | 'layers' | 'zap' | 'heart' | 'share'
  | 'download' | 'external' | 'home' | 'award' | 'target';

const ICONS: Record<IconName, string> = {
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
  whatsapp: '<path d="M20.5 3.5A11 11 0 0 0 2.9 16.7L1.5 22l5.4-1.4A11 11 0 1 0 20.5 3.5Z"/><path d="M8.3 7.5c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.5l.8 1.9c.1.3 0 .5-.1.7l-.6.7c-.2.2-.2.4 0 .7a7 7 0 0 0 3.2 2.8c.4.2.6.1.8-.1l.8-1c.2-.2.4-.3.7-.2l2 .9c.3.2.4.3.4.5v.8c-.1.5-.5 1.3-1 1.6-.6.3-1.3.4-2.1.2a12 12 0 0 1-5.7-3.7 11 11 0 0 1-2-4.1c-.2-.9 0-1.6.5-2.1Z" fill="currentColor" stroke="none"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/>',
  map: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2Z" fill="currentColor" stroke="none"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="19" cy="20" r="1.5"/><path d="M2 3h3l2.4 12.1a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 7H6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18Z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  truck: '<path d="M1 4h14v12H1zM15 8h4l3 3v5h-7"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>',
  spark: '<path d="m12 3 1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/>',
  instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"/>',
  tiktok: '<path d="M9 12a4 4 0 1 0 4 4V4c1 2.5 2.5 4 5 4.5"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M17 5a3.5 3.5 0 0 1 0 7M18 15a6 6 0 0 1 4 6"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 13h20"/>',
  layers: '<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
  zap: '<path d="M13 2 3 14h8l-1 8 11-13h-8l1-7Z"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 22l7.8-8.5 1-1.1a5.5 5.5 0 0 0 0-7.8Z"/>',
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4"/>',
  download: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
  external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14 21 3"/>',
  home: '<path d="m3 10 9-7 9 7v11H3V10Z"/><path d="M9 21v-7h6v7"/>',
  award: '<circle cx="12" cy="9" r="6"/><path d="m8.5 14-1.5 8 5-3 5 3-1.5-8"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
};

export function icon(name: IconName, className = 'icon'): string {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;
}

export function foregroundFor(hex: string): string {
  const clean = hex.replace('#', '');
  const channel = (offset: number) => parseInt(clean.slice(offset, offset + 2), 16) / 255;
  const linear = (value: number) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * linear(channel(0)) + 0.7152 * linear(channel(2)) + 0.0722 * linear(channel(4));
  return luminance > 0.58 ? '#0f172a' : '#ffffff';
}

export interface ShellOptions {
  config: RenderConfig;
  lang: 'ar' | 'fr' | 'en';
  pagePath: string;
  alternates: Record<string, string>;
  title: string;
  description: string;
  body: string;
  jsonLd: unknown;
  siteUrl: string;
  coverFile?: string | null;
  favicon: string;
  extraHead?: string;
}

function navItems(config: RenderConfig, s: UiStrings): { href: string; label: string }[] {
  switch (config.templateSlug) {
    case 'store':
      return [
        { href: '#top', label: s.home },
        { href: '#products', label: s.products },
        { href: '#about', label: s.about },
        { href: '#contact', label: s.contact },
      ];
    case 'restaurant':
      return [
        { href: '#top', label: s.home },
        { href: '#menu', label: s.menu },
        { href: '#about', label: s.about },
        { href: '#gallery', label: s.gallery },
        { href: '#reserve', label: s.reservation },
      ];
    case 'company':
      return [
        { href: '#top', label: s.home },
        { href: '#services', label: s.services },
        { href: '#about', label: s.about },
        { href: '#process', label: s.process },
        { href: '#contact', label: s.contact },
      ];
    case 'portfolio':
      return [
        { href: '#top', label: s.home },
        { href: '#work', label: s.work },
        { href: '#about', label: s.about },
        { href: '#contact', label: s.contact },
      ];
    case 'landing':
      return [
        { href: '#top', label: s.home },
        { href: '#benefits', label: s.benefits },
        { href: '#offer', label: s.offer },
        { href: '#faq', label: s.faq },
        { href: '#contact', label: s.contact },
      ];
    default:
      return [];
  }
}

function languageSwitch(config: RenderConfig, lang: string, alternates: Record<string, string>): string {
  const langs: Array<'ar' | 'fr' | 'en'> = ['ar', 'fr', 'en'];
  return `<div class="lang-switch" aria-label="Language">${langs.map((code) => {
    const label = code === 'ar' ? 'AR' : code === 'fr' ? 'FR' : 'EN';
    const href = alternates[code] || (code === config.language ? 'index.html' : `${code}.html`);
    return code === lang
      ? `<span class="active" aria-current="true">${label}</span>`
      : `<a href="${attr(href)}" hreflang="${code}" lang="${code}">${label}</a>`;
  }).join('')}</div>`;
}

function whatsappCta(config: RenderConfig, s: UiStrings): string {
  const number = String(config.whatsapp || config.phone || '').replace(/\D/g, '');
  if (!number) return '';
  const message = `مرحباً ${config.siteName}، أريد الاستفسار عن خدماتكم.`;
  const href = `https://wa.me/${number.startsWith('213') ? number : number.startsWith('0') ? '213' + number.slice(1) : number}?text=${encodeURIComponent(message)}`;
  return `<a class="btn btn-wa btn-sm" href="${attr(href)}" target="_blank" rel="noopener">${icon('whatsapp')}<span>${esc(s.whatsapp)}</span></a>`;
}

export function renderShell(options: ShellOptions): string {
  const { config, lang, pagePath, alternates, title, description, body, jsonLd, siteUrl, coverFile, favicon, extraHead } = options;
  const s = ui(lang);
  const primary = config.primaryColor;
  const secondary = config.secondaryColor;
  const foreground = foregroundFor(primary);
  const font = lang === 'ar'
    ? `'Cairo','Outfit',system-ui,-apple-system,'Segoe UI',sans-serif`
    : `'Outfit','Cairo',system-ui,-apple-system,'Segoe UI',sans-serif`;
  const logo = config.logoAssetPath
    ? `<img class="brand-logo" src="${attr(config.logoAssetPath)}" alt="${attr(config.siteName)}" width="44" height="44">`
    : `<span class="brand-mark" aria-hidden="true">${esc(initials(config.siteName))}</span>`;
  const logoMark = logo.replace('brand-logo', 'vcard-logo');
  const nav = navItems(config, s);
  const hasHeader = config.templateSlug !== 'card';
  const alternateTags = (['ar', 'fr', 'en'] as const)
    .filter((code) => alternates[code])
    .map((code) => `<link rel="alternate" hreflang="${code}" href="${attr(absolute(siteUrl, alternates[code]))}">`)
    .join('\n');
  const canonical = absolute(siteUrl, pagePath);
  const ogImage = coverFile ? absolute(siteUrl, coverFile) : undefined;
  const previewBanner = config.preview
    ? `<div class="preview-banner">${esc(s.previewNote)}</div>`
    : '';
  const headerHtml = hasHeader ? `<header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="index.html" aria-label="${attr(config.siteName)}">
        ${logo}
        <span><span class="brand-name">${esc(config.siteName)}</span><small>${esc(config.category || config.tagline)}</small></span>
      </a>
      <nav class="nav" aria-label="Main navigation">
        ${nav.map((l) => `<a href="${attr(l.href)}">${esc(l.label)}</a>`).join('')}
      </nav>
      <div class="header-actions">
        ${languageSwitch(config, lang, alternates)}
        ${config.templateSlug === 'store' ? `<button class="cart-btn" type="button" data-open-cart aria-label="${attr(s.cart)}">${icon('cart')}<span class="cart-count" data-cart-count style="display:none">0</span></button>` : ''}
        ${whatsappCta(config, s)}
        <button class="menu-toggle" type="button" data-menu-open aria-label="${attr(s.openMenu)}">${icon('menu')}</button>
      </div>
    </div>
    <div class="mobile-panel" id="mobile-panel" role="dialog" aria-modal="true" aria-label="${attr(s.openMenu)}">
      <div class="mobile-sheet">
        <button class="mobile-close" type="button" data-menu-close aria-label="${attr(s.closeMenu)}">${icon('x')}</button>
        <a class="brand" href="index.html">${logo}<span>${esc(config.siteName)}</span></a>
        ${nav.map((l) => `<a class="m-link" href="${attr(l.href)}">${esc(l.label)}</a>`).join('')}
        ${config.templateSlug === 'store' ? `<button class="btn btn-ghost" type="button" data-open-cart>${icon('cart')}${esc(s.cart)}</button>` : ''}
        <a class="btn btn-primary" href="#contact">${icon('send')}${esc(s.contact)}</a>
      </div>
    </div>
  </header>` : '';

  const footerHtml = `<footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <a class="brand" href="index.html">${logo}<span>${esc(config.siteName)}</span></a>
          <p>${esc(config.description || config.tagline)}</p>
          <div class="socials">
            ${socialLinks(config)}
          </div>
        </div>
        <div>
          <h4 class="f-title">${esc(s.quickLinks)}</h4>
          <div class="f-links">
            ${nav.map((l) => `<a href="${attr(l.href)}">${esc(l.label)}</a>`).join('')}
          </div>
        </div>
        <div>
          <h4 class="f-title">${esc(s.contactUs)}</h4>
          <div class="f-contact">
            ${config.phone ? `<a href="tel:${attr(config.phone)}">${icon('phone')}<span dir="ltr">${esc(config.phone)}</span></a>` : ''}
            ${config.email ? `<a href="mailto:${attr(config.email)}">${icon('mail')}<span>${esc(config.email)}</span></a>` : ''}
            ${config.address ? `<a href="${attr(mapsHref(config))}" target="_blank" rel="noopener">${icon('map')}<span>${esc(config.address)}${config.city ? `، ${esc(config.city)}` : ''}</span></a>` : ''}
            ${config.hours ? `<span>${icon('clock')}<span>${esc(config.hours)}</span></span>` : ''}
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span data-year></span> ${esc(config.siteName)} — ${esc(s.rights)}</span>
        <span>${esc(config.customDomain || `${config.subdomain}.pages.dev`)}</span>
      </div>
    </div>
  </footer>`;

  const waFloat = config.whatsapp
    ? `<a class="wa-float" href="${attr(waHref(config, `مرحباً ${config.siteName} 👋`))}" target="_blank" rel="noopener" aria-label="${attr(s.whatsapp)}">${icon('whatsapp')}</a>`
    : '';

  const data = {
    siteId: config.siteId,
    siteName: config.siteName,
    tagline: config.tagline,
    lang,
    domain: config.customDomain || `${config.subdomain}.pages.dev`,
    apiBase: config.apiBase,
    preview: !!config.preview,
    template: config.templateSlug,
    products: config.products,
    contact: {
      phone: config.phone,
      whatsapp: config.whatsapp,
      email: config.email,
      address: config.address,
      city: config.city,
    },
    strings: {
      emptyCart: s.emptyCart,
      remove: s.remove,
      total: s.total,
      addToCart: s.addToCart,
      previewNote: s.previewNote,
      formError: s.formError,
      sending: s.sending,
      orderSuccess: s.orderSuccess,
      orderError: s.orderError,
      messageSuccess: s.messageSuccess,
      saveContact: s.saveContact,
    },
  };

  return `<!doctype html>
<html lang="${lang}" dir="${s.dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<meta name="robots" content="${config.preview ? 'noindex,nofollow' : 'index,follow,max-image-preview:large'}">
<meta name="theme-color" content="${attr(primary)}">
<link rel="canonical" href="${attr(canonical)}">
${alternateTags}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${attr(config.siteName)}">
<meta property="og:title" content="${attr(title)}">
<meta property="og:description" content="${attr(description)}">
<meta property="og:url" content="${attr(canonical)}">
${ogImage ? `<meta property="og:image" content="${attr(ogImage)}">` : ''}
<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${attr(title)}">
<meta name="twitter:description" content="${attr(description)}">
${ogImage ? `<meta name="twitter:image" content="${attr(ogImage)}">` : ''}
<link rel="icon" href="${attr(favicon)}" type="image/svg+xml">
<link rel="manifest" href="manifest.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="assets/site.css">
<style>
:root{--p:${attr(primary)};--p2:${attr(secondary)};--p-ink:${foreground};--bg:#f8fafc;--soft:#f1f5f9;--surface:#fff;--ink:#0f172a;--muted:#64748b;--line:#e2e8f0;--shadow:0 28px 70px -28px rgba(15,23,42,.32);--shadow-sm:0 8px 30px -18px rgba(15,23,42,.22);--radius:20px;--font:${font}}
</style>
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
${extraHead || ''}
</head>
<body class="tpl-${attr(config.templateSlug)}${config.preview ? ' has-preview' : ''}">
${previewBanner}
${headerHtml}
${body}
${footerHtml}
${waFloat}
<button class="to-top" type="button" onclick="window.scrollTo({top:0,behavior:'smooth'})" aria-label="${attr(s.backTop)}">${icon('arrow', 'icon')}</button>
<div class="overlay" id="overlay"></div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
<script type="application/json" id="site-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>
<script src="assets/site.js" defer></script>
</body>
</html>`;
}

export function baseHeader(config: RenderConfig, lang: 'ar' | 'fr' | 'en', alternates: Record<string, string>): string {
  const s = ui(lang);
  const nav = navItems(config, s);
  const logo = config.logoAssetPath
    ? `<img class="brand-logo" src="${attr(config.logoAssetPath)}" alt="${attr(config.siteName)}" width="44" height="44">`
    : `<span class="brand-mark" aria-hidden="true">${esc(initials(config.siteName))}</span>`;
  return `<header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="index.html" aria-label="${attr(config.siteName)}">
        ${logo}
        <span><span class="brand-name">${esc(config.siteName)}</span><small>${esc(config.category || config.tagline)}</small></span>
      </a>
      <nav class="nav" aria-label="Main navigation">${nav.map((l) => `<a href="${attr(l.href)}">${esc(l.label)}</a>`).join('')}</nav>
      <div class="header-actions">
        ${languageSwitch(config, lang, alternates)}
        ${config.templateSlug === 'store' ? `<button class="cart-btn" type="button" data-open-cart aria-label="${attr(s.cart)}">${icon('cart')}<span class="cart-count" data-cart-count style="display:none">0</span></button>` : ''}
        ${whatsappCta(config, s)}
        <button class="menu-toggle" type="button" data-menu-open aria-label="${attr(s.openMenu)}">${icon('menu')}</button>
      </div>
    </div>
    <div class="mobile-panel" id="mobile-panel" role="dialog" aria-modal="true" aria-label="${attr(s.openMenu)}">
      <div class="mobile-sheet">
        <button class="mobile-close" type="button" data-menu-close aria-label="${attr(s.closeMenu)}">${icon('x')}</button>
        <a class="brand" href="index.html">${logo}<span>${esc(config.siteName)}</span></a>
        ${nav.map((l) => `<a class="m-link" href="${attr(l.href)}">${esc(l.label)}</a>`).join('')}
        ${config.templateSlug === 'store' ? `<button class="btn btn-ghost" type="button" data-open-cart>${icon('cart')}${esc(s.cart)}</button>` : ''}
        <a class="btn btn-primary" href="#contact">${icon('send')}${esc(s.contact)}</a>
      </div>
    </div>
  </header>`;
}

export function absolute(siteUrl: string, path: string): string {
  const base = siteUrl.replace(/\/+$/, '');
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}/${path.replace(/^\/+/, '')}`;
}

export function initials(name: string): string {
  const words = String(name || 'S').trim().split(/\s+/).filter(Boolean);
  return (words.slice(0, 2).map((w) => w.charAt(0)).join('') || 'S').slice(0, 2).toUpperCase();
}

export function socialLinks(config: RenderConfig): string {
  const links: string[] = [];
  const socials = config.socials || {};
  const facebook = safeExternalUrl(socials.facebook);
  const instagram = safeExternalUrl(socials.instagram);
  const tiktok = safeExternalUrl(socials.tiktok);
  if (facebook) links.push(`<a href="${attr(facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a>`);
  if (instagram) links.push(`<a href="${attr(instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a>`);
  if (tiktok) links.push(`<a href="${attr(tiktok)}" target="_blank" rel="noopener" aria-label="TikTok">${icon('tiktok')}</a>`);
  if (!links.length && config.phone) {
    links.push(`<a href="tel:${attr(config.phone)}" aria-label="Phone">${icon('phone')}</a>`);
  }
  return links.join('');
}

/** Only http(s) links are safe to place in an href. */
function safeExternalUrl(value: string | null | undefined): string | null {
  const raw = String(value || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function waHref(config: RenderConfig, message: string): string {
  const digits = String(config.whatsapp || config.phone || '').replace(/\D/g, '');
  const number = digits.startsWith('213') ? digits : digits.startsWith('0') ? `213${digits.slice(1)}` : digits;
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : '#';
}

export function mapsHref(config: RenderConfig): string {
  const q = [config.address, config.city, 'Algérie'].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q || config.siteName)}`;
}

export function logoMark(config: RenderConfig): string {
  if (config.logoAssetPath) {
    return `<img src="${attr(config.logoAssetPath)}" alt="${attr(config.siteName)}" width="104" height="104">`;
  }
  return esc(initials(config.siteName));
}

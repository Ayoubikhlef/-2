import type { RenderConfig, RenderProduct, RenderService, UiStrings } from './types';
import { esc, attr, money, ui } from './types';
import {
  icon,
  initials,
  logoMark,
  mapsHref,
  socialLinks,
  waHref,
} from './shell';

type Lang = 'ar' | 'fr' | 'en';

const QUOTES: Record<Lang, { text: string; name: string; role: string }[]> = {
  ar: [
    { text: 'خدمة سريعة واحترافية، والموقع أصبح جاهزاً في الوقت المحدد. أنصح به بشدة.', name: 'أمين ب.', role: 'صاحب متجر' },
    { text: 'التصميم جميل جداً وسهل الاستخدام، والعملاء أصبحوا يتواصلون معنا أكثر.', name: 'سارة م.', role: 'مصممة' },
    { text: 'تعامل راقٍ ومتابعة ممتازة بعد التسليم. شكراً على كل شيء.', name: 'كريم ع.', role: 'مدير شركة' },
  ],
  fr: [
    { text: 'Service rapide et professionnel. Le site était prêt à la date promise. Je recommande.', name: 'Amine B.', role: 'Commerçant' },
    { text: 'Le design est magnifique et très facile à utiliser. Nous recevons plus de demandes.', name: 'Sarah M.', role: 'Designer' },
    { text: 'Un suivi impeccable après la livraison. Merci pour tout !', name: 'Karim A.', role: 'Dirigeant' },
  ],
  en: [
    { text: 'Fast, professional service. The site was ready right on schedule. Highly recommended.', name: 'Amine B.', role: 'Store owner' },
    { text: 'Beautiful, easy-to-use design. We are getting many more enquiries now.', name: 'Sarah M.', role: 'Designer' },
    { text: 'Outstanding follow-up after delivery. Thank you for everything.', name: 'Karim A.', role: 'Business owner' },
  ],
};

function initialsFor(name: string): string {
  return initials(name).slice(0, 1);
}

function productPlaceholder(name: string): string {
  return `<span class="ph" aria-hidden="true">${esc(initialsFor(name))}</span>`;
}

function productCard(p: RenderProduct, s: UiStrings): string {
  const image = p.imageUrl
    ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" width="400" height="400">`
    : productPlaceholder(p.name);
  return `<article class="product-card" data-product-card data-category="${attr(p.category || '')}" data-name="${attr(p.name)}" data-desc="${attr(p.description || '')}">
    <div class="product-thumb">${image}</div>
    <div class="product-body">
      ${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      <div class="price-row">
        <span class="price">${money(p.price, s.dir === 'rtl' ? 'ar' : 'en')}</span>
        <button class="add-btn" type="button" data-add="${attr(p.id)}" aria-label="${attr(s.addToCart)} — ${attr(p.name)}">${icon('plus')}</button>
      </div>
    </div>
  </article>`;
}

function sectionHead(eyebrow: string, title: string, lead?: string, center = false): string {
  return `<div class="section-head${center ? ' center' : ''}" data-reveal>
    <div>${eyebrow ? `<span class="eyebrow">${esc(eyebrow)}</span>` : ''}<h2 class="h2 mt-2">${esc(title)}</h2>${lead ? `<p class="lead">${esc(lead)}</p>` : ''}</div>
  </div>`;
}

function quoteCards(lang: Lang, s: UiStrings): string {
  return `<div class="grid g3">${QUOTES[lang].map((q) => `<div class="quote" data-reveal>
    <div class="stars" aria-label="5/5">★★★★★</div>
    <p>“${esc(q.text)}”</p>
    <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
  </div>`).join('')}</div>`;
}

function contactDetails(config: RenderConfig, s: UiStrings): string {
  return `<div class="contact-list">
    ${config.phone ? `<div class="contact-item"><span class="ci">${icon('phone')}</span><div><strong>${esc(s.phone)}</strong><a href="tel:${attr(config.phone)}" dir="ltr">${esc(config.phone)}</a></div></div>` : ''}
    ${config.whatsapp ? `<div class="contact-item"><span class="ci">${icon('whatsapp')}</span><div><strong>${esc(s.whatsapp)}</strong><a href="${attr(waHref(config, `مرحباً ${config.siteName} 👋`))}" target="_blank" rel="noopener" dir="ltr">${esc(config.whatsapp)}</a></div></div>` : ''}
    ${config.email ? `<div class="contact-item"><span class="ci">${icon('mail')}</span><div><strong>${esc(s.email)}</strong><a href="mailto:${attr(config.email)}">${esc(config.email)}</a></div></div>` : ''}
    ${config.address ? `<div class="contact-item"><span class="ci">${icon('map')}</span><div><strong>${esc(s.location)}</strong><a href="${attr(mapsHref(config))}" target="_blank" rel="noopener">${esc(config.address)}${config.city ? `، ${esc(config.city)}` : ''}</a></div></div>` : ''}
    ${config.hours ? `<div class="contact-item"><span class="ci">${icon('clock')}</span><div><strong>${esc(s.hours)}</strong><span>${esc(config.hours)}</span></div></div>` : ''}
  </div>`;
}

function leadForm(config: RenderConfig, s: UiStrings, kind: 'contact' | 'reservation' = 'contact'): string {
  if (kind === 'reservation') {
    return `<form class="reserve-card" data-lead-form data-lead-kind="reservation" novalidate>
      <h3 class="h3">${esc(s.bookTable)}</h3>
      <p style="opacity:.65;font-size:.85rem;margin:6px 0 20px">${esc(s.bookSuccess)}</p>
      <div class="form-grid">
        <div class="field"><label for="r-name">${esc(s.name)}</label><input id="r-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
        <div class="field"><label for="r-phone">${esc(s.phone)}</label><input id="r-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
        <div class="field"><label for="r-date">${esc(s.date)}</label><input id="r-date" name="date" type="date" required><span class="err">${esc(s.required)}</span></div>
        <div class="field"><label for="r-time">${esc(s.time)}</label><input id="r-time" name="time" type="time" required><span class="err">${esc(s.required)}</span></div>
        <div class="field"><label for="r-guests">${esc(s.guests)}</label><select id="r-guests" name="guests" required><option value="2">2</option><option value="3">3</option><option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="8">8+</option></select></div>
        <div class="field"><label for="r-note">${esc(s.note)}</label><input id="r-note" name="message" maxlength="300"></div>
        <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
      </div>
      <button class="btn btn-primary btn-block mt-3" type="submit">${icon('calendar')}${esc(s.book)}</button>
      <div class="form-status" role="status"></div>
    </form>`;
  }
  return `<form class="contact-form" data-lead-form novalidate>
    <h3 class="h3">${esc(s.sendMessage)}</h3>
    <p class="muted" style="font-size:.85rem;margin:6px 0 18px">${esc(s.messageSuccess)}</p>
    <div class="form-grid">
      <div class="field"><label for="c-name">${esc(s.name)}</label><input id="c-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
      <div class="field"><label for="c-phone">${esc(s.phone)}</label><input id="c-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
      <div class="field full"><label for="c-email">${esc(s.email)}</label><input id="c-email" name="email" type="email" maxlength="120" autocomplete="email" dir="ltr"></div>
      <div class="field full"><label for="c-msg">${esc(s.message)}</label><textarea id="c-msg" name="message" required maxlength="1200"></textarea><span class="err">${esc(s.required)}</span></div>
      <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
    </div>
    <button class="btn btn-primary btn-block mt-3" type="submit">${icon('send')}${esc(s.sendMessage)}</button>
    <div class="form-status" role="status"></div>
  </form>`;
}

function contactSection(config: RenderConfig, s: UiStrings, title?: string): string {
  return `<section class="section" id="contact">
    <div class="container contact-wrap">
      <div data-reveal>
        <span class="eyebrow">${esc(s.contact)}</span>
        <h2 class="h2 mt-2">${esc(title || s.contactUs)}</h2>
        <p class="lead mt-2">${esc(config.tagline || config.description)}</p>
        ${contactDetails(config, s)}
        <div class="socials" style="margin-top:22px">${socialLinks(config)}</div>
      </div>
      ${leadForm(config, s)}
    </div>
  </section>`;
}

function statsBand(config: RenderConfig, s: UiStrings): string {
  return `<section class="stats-band">
    <div class="container stats-grid">
      <div class="stat"><div class="num">+5</div><div class="lbl">${esc(s.years)}</div></div>
      <div class="stat"><div class="num">+120</div><div class="lbl">${esc(s.clients)}</div></div>
      <div class="stat"><div class="num">+180</div><div class="lbl">${esc(s.projects)}</div></div>
      <div class="stat"><div class="num">98%</div><div class="lbl">${esc(s.satisfaction)}</div></div>
    </div>
  </section>`;
}

function ctaBand(config: RenderConfig, s: UiStrings, title: string, text: string, cta?: string, href = '#contact'): string {
  return `<section class="section-sm"><div class="container"><div class="cta-band" data-reveal>
    <div><h2 class="h2">${esc(title)}</h2><p>${esc(text)}</p></div>
    <a class="btn btn-light" href="${attr(href)}">${esc(cta || s.getStarted)}${icon('arrow')}</a>
  </div></div></section>`;
}

/* -------------------------------------------------------------------------
 * STORE
 * ---------------------------------------------------------------------- */
export function storePage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const products = config.products;
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high">`
    : '';
  const cartDrawer = `<div class="drawer" id="cart-drawer" aria-label="${attr(s.cart)}">
    <div class="drawer-head"><h3>${esc(s.cart)}</h3><button class="modal-close" type="button" data-close-cart aria-label="${attr(s.close)}">${icon('x')}</button></div>
    <div class="drawer-body" id="cart-body"></div>
    <div class="drawer-foot">
      <div class="cart-total"><span>${esc(s.total)}</span><span id="cart-total">0</span></div>
      <button class="btn btn-primary btn-block" type="button" id="cart-checkout" data-checkout>${icon('cart')}${esc(s.checkout)}</button>
      <p class="form-note center">${esc(s.secure)}</p>
    </div>
  </div>
  <div class="modal-wrap" id="checkout-modal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div class="modal-head"><h3 id="checkout-title">${esc(s.orderSummary)}</h3><button class="modal-close" type="button" data-close-modal aria-label="${attr(s.close)}">${icon('x')}</button></div>
      <div class="order-lines" id="checkout-lines"></div>
      <form id="order-form" novalidate>
        <div class="form-grid">
          <div class="field"><label for="o-name">${esc(s.name)}</label><input id="o-name" name="customerName" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="o-phone">${esc(s.phone)}</label><input id="o-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field"><label for="o-wilaya">${esc(s.wilaya)}</label><input id="o-wilaya" name="wilaya" required maxlength="60" autocomplete="address-level1"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="o-city">${esc(s.city)}</label><input id="o-city" name="city" required maxlength="60" autocomplete="address-level2"><span class="err">${esc(s.required)}</span></div>
          <div class="field full"><label for="o-address">${esc(s.address)}</label><input id="o-address" name="address" required maxlength="200" autocomplete="street-address"><span class="err">${esc(s.required)}</span></div>
          <div class="field full"><label for="o-note">${esc(s.note)}</label><textarea id="o-note" name="note" maxlength="500"></textarea></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('send')}${esc(s.send)}</button>
        <div class="form-status" id="order-status" role="status"></div>
        <p class="form-note center mt-2">${esc(s.secure)}</p>
      </form>
    </div>
  </div>`;

  return `<section class="hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('spark')}${esc(config.tagline || s.featured)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#products">${icon('cart')}${esc(s.products)}</a>
          <a class="btn btn-wa" href="${attr(waHref(config, `مرحباً ${config.siteName}، أريد الاستفسار عن منتجاتكم.`))}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
        <div class="hero-stats">
          <div><div class="num">+120</div><div class="lbl">${esc(s.clients)}</div></div>
          <div><div class="num">4.9/5</div><div class="lbl">${esc(s.satisfaction)}</div></div>
          <div><div class="num">24h</div><div class="lbl">${esc(s.delivery)}</div></div>
        </div>
      </div>
      <div class="hero-media${heroImage ? '' : ' no-img'}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('truck')}</span><div><strong>${esc(s.delivery)}</strong><span>${esc(s.secure)}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('truck')}${esc(s.delivery)}</span>
    <span class="trust-item">${icon('shield')}${esc(s.quality)}</span>
    <span class="trust-item">${icon('phone')}${esc(s.support)}</span>
    <span class="trust-item">${icon('check')}${esc(s.secure)}</span>
  </div></div>

  <section class="section" id="products">
    <div class="container">
      ${sectionHead(s.products, s.featured, config.tagline)}
      <div class="shop-toolbar">
        <button class="chip active" type="button" data-filter="all">${esc(s.all)}</button>
        ${categories.map((cat) => `<button class="chip" type="button" data-filter="${attr(cat)}">${esc(cat)}</button>`).join('')}
        <div class="search-box">${icon('search')}<input id="product-search" type="search" placeholder="${attr(s.search)}" aria-label="${attr(s.search)}"></div>
      </div>
      <div class="product-grid">
        ${products.length ? products.map((p) => productCard(p, s)).join('') : `<div class="product-empty">${esc(s.emptyCart)}</div>`}
        <div class="product-empty hide" id="product-empty">${esc(s.emptyCart)}</div>
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="about">
    <div class="container about-grid">
      <div class="about-media${config.coverUrl ? '' : ' no-img'}" data-reveal>
        ${config.coverUrl ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" loading="lazy" width="800" height="700">` : ''}
        <div class="about-badge">${icon('award')}${esc(s.quality)}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(config.siteName)}</h2>
        <p class="lead mt-2">${esc(config.description)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(s.quality)} — ${esc(s.support)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(s.delivery)} ${esc(s.location)} — ${esc(config.city || '')}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(s.secure)}</span></li>
        </ul>
        <a class="btn btn-primary mt-4" href="#contact">${icon('send')}${esc(s.contact)}</a>
      </div>
    </div>
  </section>

  ${statsBand(config, s)}
  <section class="section"><div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}${quoteCards(lang, s)}</div></section>
  ${contactSection(config, s)}
  ${cartDrawer}`;
}

/* -------------------------------------------------------------------------
 * COMPANY
 * ---------------------------------------------------------------------- */
export function companyPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const services = config.services.length ? config.services : [
    { title: s.services, description: config.tagline },
  ];
  const heroMedia = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high">`
    : '';
  return `<section class="hero company-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('shield')}${esc(s.quality)}</span>
        <h1 class="h1 mt-3">${esc(config.tagline || config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#contact">${icon('send')}${esc(s.getStarted)}</a>
          <a class="btn btn-ghost" href="#services">${icon('briefcase')}${esc(s.ourServices)}</a>
        </div>
        <div class="hero-stats">
          <div><div class="num">+8</div><div class="lbl">${esc(s.years)}</div></div>
          <div><div class="num">+140</div><div class="lbl">${esc(s.projects)}</div></div>
          <div><div class="num">98%</div><div class="lbl">${esc(s.satisfaction)}</div></div>
        </div>
      </div>
      <div class="hero-media${heroMedia ? '' : ' no-img'}" data-reveal>${heroMedia}
        <div class="float-card"><span class="float-icon">${icon('award')}</span><div><strong>${esc(s.quality)}</strong><span>${esc(config.city || s.clients)}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('shield')}${esc(s.quality)}</span>
    <span class="trust-item">${icon('clock')}${esc(s.support)}</span>
    <span class="trust-item">${icon('target')}${esc(s.satisfaction)}</span>
    <span class="trust-item">${icon('award')}${esc(s.years)}</span>
  </div></div>

  <section class="section" id="services">
    <div class="container">
      ${sectionHead(s.ourServices, s.ourServices, s.whyUs, true)}
      <div class="grid g3">${services.slice(0, 6).map((service, i) => `<article class="service-card" data-reveal>
        <div class="service-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="service-icon">${icon(['briefcase', 'layers', 'target', 'zap', 'shield', 'award'][i % 6] as any)}</div>
        <h3 class="h3">${esc(service.title)}</h3>
        <p>${esc(service.description)}</p>
      </article>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="about">
    <div class="container about-grid">
      <div class="about-media${config.coverUrl ? '' : ' no-img'}" data-reveal>
        ${config.coverUrl ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" loading="lazy" width="800" height="700">` : ''}
        <div class="about-badge">${icon('check')}+8 ${esc(s.years)}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(config.siteName)}</h2>
        <p class="lead mt-2">${esc(config.description)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(s.quality)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(s.support)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(s.satisfaction)}</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section" id="process">
    <div class="container">
      ${sectionHead(s.process, s.process, undefined, true)}
      <div class="steps">
        ${[['step1', 'step1d'], ['step2', 'step2d'], ['step3', 'step3d'], ['step4', 'step4d']].map(([t, d], i) => `<div class="step" data-reveal><div class="n">${i + 1}</div><h3>${esc((s as any)[t])}</h3><p>${esc((s as any)[d])}</p></div>`).join('')}
      </div>
    </div>
  </section>

  ${statsBand(config, s)}
  <section class="section"><div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}${quoteCards(lang, s)}</div></section>
  ${ctaBand(config, s, s.getStarted, s.messageSuccess, s.getStarted)}
  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * PORTFOLIO
 * ---------------------------------------------------------------------- */
export function portfolioPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const projects = config.services.length ? config.services : [{ title: s.ourWork, description: config.tagline }];
  const portrait = config.coverUrl
    ? `<div class="ph"><img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" loading="lazy" width="700" height="780"></div>`
    : `<div class="ph">${esc(initials(config.siteName))}</div>`;
  return `<section class="portfolio-hero" id="top">
    <div class="container hero-grid">
      <div data-reveal>
        <span class="badge"><span class="dot"></span>${esc(s.available)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="role">${esc(config.tagline || config.description)}</p>
        <div class="portfolio-meta">
          <span><strong>${esc(config.city || 'Algérie')}</strong></span>
          <span>${esc(s.projects)} <strong>+30</strong></span>
          <span>${esc(s.clients)} <strong>+25</strong></span>
        </div>
        <div class="hero-actions">
          <a class="btn btn-dark" href="#work">${icon('layers')}${esc(s.selectedWork)}</a>
          <a class="btn btn-ghost" href="#contact">${icon('send')}${esc(s.contact)}</a>
        </div>
      </div>
      <div class="portrait-card" data-reveal>${portrait}<div style="padding:14px 6px 4px"><strong>${esc(config.siteName)}</strong><div class="muted" style="font-size:.8rem">${esc(config.tagline)}</div></div></div>
    </div>
  </section>

  <section class="section" id="work" style="padding-top:20px">
    <div class="container">
      ${sectionHead(s.work, s.selectedWork, s.skills)}
      <div class="work-grid">${projects.slice(0, 8).map((project, i) => `<a class="work-card" href="#contact" data-reveal>
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="go">${icon('arrow')}</span>
        <div><h3>${esc(project.title)}</h3><p>${esc(project.description)}</p></div>
      </a>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="about">
    <div class="container about-grid">
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(config.siteName)}</h2>
        <p class="lead mt-2">${esc(config.description)}</p>
        <div class="skills">${projects.slice(0, 8).map((p) => `<span class="skill">${esc(p.title)}</span>`).join('')}</div>
      </div>
      <div class="card" style="padding:30px" data-reveal>
        <h3 class="h3">${esc(s.whyUs)}</h3>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(s.quality)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(s.support)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(s.satisfaction)}</span></li>
        </ul>
        <a class="btn btn-primary mt-4" href="#contact">${icon('send')}${esc(s.getStarted)}</a>
      </div>
    </div>
  </section>

  <section class="section"><div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}${quoteCards(lang, s)}</div></section>
  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * DIGITAL CARD
 * ---------------------------------------------------------------------- */
export function cardPage(config: RenderConfig, s: UiStrings): string {
  return `<main class="vcard-page" id="top">
    <div>
      <article class="vcard" data-reveal>
        <div class="vcard-cover"></div>
        <div class="vcard-logo">${logoMark(config)}</div>
        <div class="vcard-body">
          <h1>${esc(config.siteName)}</h1>
          <div class="role">${esc(config.tagline || config.category)}</div>
          <p class="bio">${esc(config.description)}</p>
          <div class="quick-actions">
            ${config.phone ? `<a class="btn btn-primary" href="tel:${attr(config.phone)}">${icon('phone')}${esc(s.callNow)}</a>` : ''}
            ${config.whatsapp ? `<a class="btn btn-wa" href="${attr(waHref(config, `مرحباً ${config.siteName} 👋`))}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>` : ''}
            <button class="btn btn-light wide" type="button" id="save-contact">${icon('download')}${esc(s.saveContact)}</button>
          </div>
          <div class="vcard-info">
            ${config.phone ? `<a href="tel:${attr(config.phone)}">${icon('phone')}<span dir="ltr">${esc(config.phone)}</span></a>` : ''}
            ${config.email ? `<a href="mailto:${attr(config.email)}">${icon('mail')}<span>${esc(config.email)}</span></a>` : ''}
            ${config.address ? `<a href="${attr(mapsHref(config))}" target="_blank" rel="noopener">${icon('map')}<span>${esc(config.address)}${config.city ? `، ${esc(config.city)}` : ''}</span></a>` : ''}
            ${config.hours ? `<span>${icon('clock')}<span>${esc(config.hours)}</span></span>` : ''}
          </div>
          <div class="vcard-socials">${socialLinks(config)}</div>
          <div class="quick-actions" style="margin-top:16px">
            <button class="btn btn-ghost" type="button" id="share-site">${icon('share')}${esc(s.share)}</button>
            <a class="btn btn-ghost" href="${attr(waHref(config, `مرحباً ${config.siteName} 👋`))}" target="_blank" rel="noopener">${icon('external')}${esc(s.contact)}</a>
          </div>
        </div>
      </article>
      <div class="powered">${esc(config.siteName)} · ${esc(config.city || '')}</div>
    </div>
  </main>`;
}

/* -------------------------------------------------------------------------
 * RESTAURANT
 * ---------------------------------------------------------------------- */
export function restaurantPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const products = config.products;
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
  const cover = config.coverUrl ? `<img src="${attr(config.coverUrl)}" alt="" aria-hidden="true" width="1600" height="900">` : '';
  return `<section class="rest-hero" id="top">
    <div class="bg">${cover}</div>
    <div class="container">
      <span class="rest-badge"><span class="dot"></span>${esc(s.openNow)} · ${esc(config.hours || '11:00 — 23:00')}</span>
      <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
      <p class="lead mt-3">${esc(config.tagline || config.description)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#menu">${icon('menu')}${esc(s.viewMenu)}</a>
        <a class="btn btn-wa" href="${attr(waHref(config, `مرحباً ${config.siteName}، أريد الحجز أو الطلب.`))}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.orderWhatsapp)}</a>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('spark')}${esc(s.quality)}</span>
    <span class="trust-item">${icon('clock')}${esc(config.hours || s.hours)}</span>
    <span class="trust-item">${icon('phone')}${esc(s.support)}</span>
    <span class="trust-item">${icon('map')}${esc(config.city || s.location)}</span>
  </div></div>

  <section class="section" id="menu">
    <div class="container">
      ${sectionHead(s.menu, s.menu, s.viewMenu, true)}
      <div class="menu-tabs">
        <button class="chip active" type="button" data-filter="all">${esc(s.all)}</button>
        ${categories.map((cat) => `<button class="chip" type="button" data-filter="${attr(cat)}">${esc(cat)}</button>`).join('')}
      </div>
      <div class="menu-grid">
        ${products.map((p) => `<article class="menu-item" data-product-card data-category="${attr(p.category || '')}" data-name="${attr(p.name)}" data-desc="${attr(p.description || '')}" data-reveal>
          <div>
            <h3>${esc(p.name)}</h3>
            ${p.description ? `<p>${esc(p.description)}</p>` : ''}
            <span class="price">${money(p.price, s.dir === 'rtl' ? 'ar' : 'en')}</span>
          </div>
          <div class="menu-thumb">${p.imageUrl ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" width="180" height="180">` : esc(initialsFor(p.name))}</div>
        </article>`).join('')}
        ${products.length === 0 ? `<div class="product-empty">${esc(s.emptyCart)}</div>` : ''}
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="about">
    <div class="container about-grid">
      <div class="about-media${config.coverUrl ? '' : ' no-img'}" data-reveal>${config.coverUrl ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" loading="lazy" width="800" height="700">` : ''}<div class="about-badge">${icon('star')}4.9/5</div></div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(config.siteName)}</h2>
        <p class="lead mt-2">${esc(config.description)}</p>
        <div class="hours-card mt-4">
          <div class="hours-row"><span>${esc(s.hours)}</span><span>${esc(config.hours || '11:00 — 23:00')}</span></div>
          <div class="hours-row"><span>${esc(s.location)}</span><span>${esc(config.city || '')}</span></div>
          <div class="hours-row"><span>${esc(s.phone)}</span><span dir="ltr">${esc(config.phone)}</span></div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" id="gallery">
    <div class="container">
      ${sectionHead(s.gallery, s.gallery, undefined, true)}
      <div class="grid g3">${(products.filter((p) => p.imageUrl).length ? products.filter((p) => p.imageUrl) : products).slice(0, 6).map((p) => `<figure class="work-card" style="min-height:220px;margin:0" data-reveal>
        ${p.imageUrl ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" width="600" height="400" data-lightbox="${attr(p.imageUrl)}" style="cursor:zoom-in">` : ''}
        <figcaption><h3>${esc(p.name)}</h3></figcaption>
      </figure>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="reserve">
    <div class="container contact-wrap">
      <div data-reveal>
        <span class="eyebrow">${esc(s.reservation)}</span>
        <h2 class="h2 mt-2">${esc(s.bookTable)}</h2>
        <p class="lead mt-2">${esc(config.tagline || config.description)}</p>
        ${contactDetails(config, s)}
        <div class="hours-card mt-4">
          <div class="hours-row"><span>${esc(s.hours)}</span><span>${esc(config.hours || '11:00 — 23:00')}</span></div>
          <div class="hours-row"><span>${esc(s.location)}</span><span>${esc(config.address || config.city || '')}</span></div>
        </div>
      </div>
      ${leadForm(config, s, 'reservation')}
    </div>
  </section>

  <div class="lightbox" id="lightbox"><button class="close" type="button" aria-label="${attr(s.close)}">${icon('x')}</button><img alt="" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"></div>`;
}

/* -------------------------------------------------------------------------
 * LANDING
 * ---------------------------------------------------------------------- */
export function landingPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const benefits = config.services.length ? config.services : [
    { title: s.quality, description: s.messageSuccess },
    { title: s.support, description: s.contactUs },
    { title: s.delivery, description: s.secure },
  ];
  const preview = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" loading="lazy" width="1200" height="675">`
    : `<div style="aspect-ratio:16/9;display:grid;place-items:center;background:linear-gradient(145deg,color-mix(in srgb,var(--p) 12%,white),color-mix(in srgb,var(--p2) 22%,white));font-size:2.4rem;font-weight:900;color:var(--p)">${esc(initials(config.siteName))}</div>`;
  return `<section class="landing-hero" id="top">
    <div class="container">
      <span class="badge">${icon('zap')}${esc(config.tagline || s.offer)}</span>
      <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
      <p class="lead">${esc(config.description)}</p>
      <div class="hero-actions">
        <a class="btn btn-primary" href="#contact">${icon('send')}${esc(s.getStarted)}</a>
        <a class="btn btn-wa" href="${attr(waHref(config, `مرحباً ${config.siteName}، أريد معرفة المزيد.`))}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
      </div>
      <div class="landing-preview"><div class="browser"><i></i><i></i><i></i></div>${preview}</div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('check')}${esc(s.quality)}</span>
    <span class="trust-item">${icon('shield')}${esc(s.secure)}</span>
    <span class="trust-item">${icon('clock')}${esc(s.support)}</span>
    <span class="trust-item">${icon('star')}4.9/5</span>
  </div></div>

  <section class="section" id="benefits">
    <div class="container">
      ${sectionHead(s.benefits, s.whyUs, s.messageSuccess, true)}
      <div class="grid g3">${benefits.slice(0, 6).map((b, i) => `<div class="benefit" data-reveal><span class="b-icon">${icon(['zap', 'shield', 'target', 'layers', 'award', 'heart'][i % 6] as any)}</span><div><h3>${esc(b.title)}</h3><p>${esc(b.description)}</p></div></div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="offer">
    <div class="container">
      ${sectionHead(s.offer, s.getStarted, s.messageSuccess, true)}
      <div class="offer-card" data-reveal>
        <span class="badge" style="background:rgba(255,255,255,.12);color:#fff">${icon('spark')}${esc(s.offer)}</span>
        <h2 class="h2 mt-3">${esc(config.siteName)}</h2>
        <p style="opacity:.72;margin-top:10px">${esc(config.tagline || config.description)}</p>
        <div class="offer-list">${benefits.slice(0, 5).map((b) => `<li>${icon('check')}<span>${esc(b.title)}</span></li>`).join('')}</div>
        <a class="btn btn-primary btn-block" href="#contact">${icon('send')}${esc(s.getStarted)}</a>
      </div>
    </div>
  </section>

  ${statsBand(config, s)}
  <section class="section"><div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}${quoteCards(lang, s)}</div></section>

  <section class="section bg-soft" id="faq">
    <div class="container" style="max-width:840px">
      ${sectionHead(s.faq, s.faq, undefined, true)}
      ${[
        [s.whyUs, s.messageSuccess],
        [s.delivery, s.support],
        [s.secure, s.quality],
        [s.contact, `${config.phone} — ${config.email}`],
      ].map(([q, a]) => `<div class="faq-item" data-reveal><button class="faq-q" type="button">${esc(q)}${icon('plus')}</button><div class="faq-a"><p>${esc(a)}</p></div></div>`).join('')}
    </div>
  </section>

  ${contactSection(config, s, s.sendMessage)}`;
}

export function pageFor(template: string, config: RenderConfig, lang: Lang): string {
  const s = ui(lang);
  switch (template) {
    case 'store': return storePage(config, s, lang);
    case 'company': return companyPage(config, s, lang);
    case 'portfolio': return portfolioPage(config, s, lang);
    case 'card': return cardPage(config, s);
    case 'restaurant': return restaurantPage(config, s, lang);
    default: return landingPage(config, s, lang);
  }
}

export function jsonLdFor(template: string, config: RenderConfig, siteUrl: string): unknown {
  const address = config.address
    ? {
        '@type': 'PostalAddress',
        streetAddress: config.address,
        addressLocality: config.city || '',
        addressCountry: 'DZ',
      }
    : undefined;
  const base: Record<string, any> = {
    '@context': 'https://schema.org',
    name: config.siteName,
    description: config.description,
    url: siteUrl,
    telephone: config.phone || undefined,
    email: config.email || undefined,
    address,
    sameAs: [config.socials?.facebook, config.socials?.instagram, config.socials?.tiktok].filter(Boolean),
  };
  switch (template) {
    case 'store': return { ...base, '@type': 'Store', image: config.coverUrl || undefined, priceRange: 'DZD' };
    case 'restaurant': return { ...base, '@type': 'Restaurant', servesCuisine: 'Algerian', image: config.coverUrl || undefined };
    case 'portfolio': return { ...base, '@type': 'Person', jobTitle: config.tagline };
    case 'card': return { ...base, '@type': 'Person', jobTitle: config.tagline };
    case 'company': return { ...base, '@type': 'Organization', logo: config.logoUrl || undefined };
    default: return { ...base, '@type': 'Organization' };
  }
}

import type { RenderConfig, RenderProduct, RenderService, RenderTeamMember, UiStrings } from './types';
import { esc, attr, money, ui } from './types';
import {
  icon,
  initials,
  languageSwitch,
  logoMark,
  mapsHref,
  socialLinks,
  themeToggle,
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
    ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="400" height="400">`
    : productPlaceholder(p.name);
  return `<article class="product-card" data-reveal data-product-card data-category="${attr(p.category || '')}" data-name="${attr(p.name)}" data-desc="${attr(p.description || '')}">
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

/** First gallery photo, falling back to the cover, for about blocks. */
function aboutPhoto(config: RenderConfig): string | null {
  return config.gallery && config.gallery.length ? config.gallery[0] : config.coverUrl || null;
}

/**
 * Image-led packages/projects grid used by company, landing and portfolio
 * style templates that do not have a shopping cart of their own.
 */
function showcaseSection(
  config: RenderConfig,
  s: UiStrings,
  lang: Lang,
  limit = 6,
  title?: string,
  lead?: string,
): string {
  const items = config.products.filter((p) => p.name).slice(0, limit);
  if (!items.length) return '';
  return `<section class="section" id="showcase">
    <div class="container">
      ${sectionHead(s.packages, title || s.packages, lead)}
      <div class="showcase-grid">${items.map((p) => `<article class="showcase-card" data-reveal>
        <div class="showcase-media">${p.imageUrl
          ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="600" height="450">`
          : productPlaceholder(p.name)}</div>
        <div class="showcase-body">
          ${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}
          <h3>${esc(p.name)}</h3>
          ${p.description ? `<p>${esc(p.description)}</p>` : ''}
          ${p.price > 0 ? `<span class="price">${money(p.price, lang)}</span>` : ''}
        </div>
      </article>`).join('')}</div>
    </div>
  </section>`;
}

/* -------------------------------------------------------------------------
 * STORE
 * ---------------------------------------------------------------------- */
export function storePage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const products = config.products;
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
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
      <div class="hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
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
      <div class="about-media${about ? '' : ' no-img'}" data-reveal>
        ${about ? `<img src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="700">` : ''}
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
 * CAR RENTAL
 * ---------------------------------------------------------------------- */

interface RentalCopy {
  heroBadge: string;
  explore: string;
  bookNow: string;
  fleetTitle: string;
  fleetLead: string;
  search: string;
  noResults: string;
  perDay: string;
  seats: string;
  bags: string;
  ac: string;
  auto: string;
  manual: string;
  petrol: string;
  diesel: string;
  hybrid: string;
  electric: string;
  popular: string;
  newCar: string;
  deal: string;
  howTitle: string;
  howLead: string;
  step1: string; step2: string; step3: string; step4: string;
  step1d: string; step2d: string; step3d: string; step4d: string;
  whyTitle: string;
  whyLead: string;
  feat1: string; feat1d: string; feat2: string; feat2d: string;
  feat3: string; feat3d: string; feat4: string; feat4d: string;
  bookingTitle: string;
  bookingLead: string;
  carLabel: string;
  duration: string;
  estimate: string;
  daysLabel: string;
  pickupDate: string;
  returnDate: string;
  pickupPlace: string;
  agency: string;
  airport: string;
  home: string;
  confirm: string;
  note: string;
  terms: string;
  faq: Array<[string, string]>;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
}

const RENTAL: Record<Lang, RentalCopy> = {
  ar: {
    heroBadge: 'تأمين شامل وكيلومترات غير محدودة',
    explore: 'استكشف الأسطول',
    bookNow: 'احجز الآن',
    fleetTitle: 'سيارة لكل رحلة',
    fleetLead: 'من الاقتصادية إلى الفاخرة — سيارات حديثة بصيانة دورية وأسعار يومية واضحة.',
    search: 'ابحث عن سيارة...',
    noResults: 'لا توجد سيارات مطابقة لبحثك.',
    perDay: '/ اليوم',
    seats: 'مقاعد', bags: 'حقائب', ac: 'مكيف',
    auto: 'أوتوماتيك', manual: 'يدوي',
    petrol: 'بنزين', diesel: 'ديزل', hybrid: 'هجين', electric: 'كهربائي',
    popular: 'الأكثر طلباً', newCar: 'جديدة', deal: 'عرض خاص',
    howTitle: 'كيف تحجز سيارتك؟',
    howLead: 'أربع خطوات بسيطة تفصلك عن الانطلاق.',
    step1: 'اختر السيارة', step2: 'حدّد التواريخ', step3: 'أكّد الحجز', step4: 'استلم وانطلق',
    step1d: 'تصفح الأسطول وقارن المواصفات والأسعار.',
    step2d: 'اختر تاريخ ووقت الاستلام والإرجاع.',
    step3d: 'اترك رقمك وسنتصل بك لتأكيد التوفر.',
    step4d: 'تسليم في الوكالة أو المطار مع تأمين شامل.',
    whyTitle: 'لماذا تختارنا؟',
    whyLead: 'خدمة كراء واضحة بدون مفاجآت أو رسوم خفية.',
    feat1: 'تأمين شامل', feat1d: 'كل سيارة مؤمنة بالكامل مع مساعدة على الطريق.',
    feat2: 'كيلومترات غير محدودة', feat2d: 'سافر بدون حساب إضافي على المسافة.',
    feat3: 'تسليم مرن', feat3d: 'في الوكالة، المطار أو عند عنوانك.',
    feat4: 'دعم 24/7', feat4d: 'فريق متاح طوال أيام الأسبوع لمساعدتك.',
    bookingTitle: 'حجز السيارة',
    bookingLead: 'اختر سيارتك والتواريخ وسنتصل بك لتأكيد الحجز والتوفر.',
    carLabel: 'السيارة', duration: 'المدة', estimate: 'التقدير', daysLabel: 'أيام',
    pickupDate: 'تاريخ الاستلام', returnDate: 'تاريخ الإرجاع',
    pickupPlace: 'مكان الاستلام', agency: 'الوكالة', airport: 'المطار', home: 'عنوان الزبون',
    confirm: 'تأكيد الحجز',
    note: 'الدفع عند الاستلام — تأمين مسترد يُعاد عند الإرجاع.',
    terms: 'شروط الكراء',
    faq: [
      ['ما هي شروط السن والرخصة؟', 'السن الأدنى 21 سنة مع رخصة سياقة سارية منذ سنة على الأقل.'],
      ['هل يوجد تأمين أو ضمان؟', 'كل سيارة مؤمنة بالكامل، ويُطلب تأمين مسترد قدره 20 000 دج يُعاد عند الإرجاع.'],
      ['ما هي سياسة الوقود والمسافة؟', 'تُستلم السيارة بخزان ممتلئ وتُعاد كذلك. المسافة غير محدودة داخل الوطن.'],
      ['هل يمكن إلغاء الحجز؟', 'نعم، الإلغاء مجاني حتى 24 ساعة قبل موعد الاستلام.'],
    ],
    stats: [['+8', 'سيارات حديثة'], ['+120', 'عميل سعيد'], ['24/7', 'دعم واستقبال'], ['98%', 'رضا العملاء']],
    quotes: [
      { text: 'استأجرت سيارة عائلية لأسبوع، السيارة نظيفة والتسليم كان في المطار في الوقت المحدد.', name: 'سمير ح.', role: 'زبون' },
      { text: 'أسعار واضحة بدون رسوم خفية، وفريق محترم ساعدني في اختيار السيارة المناسبة.', name: 'ليندة ب.', role: 'زبونة' },
      { text: 'حجزت مرسيدس لمناسبة عمل، خدمة راقية وسيارة بحالة ممتازة.', name: 'ياسين ع.', role: 'رجل أعمال' },
    ],
  },
  fr: {
    heroBadge: 'Assurance tous risques et kilométrage illimité',
    explore: 'Voir la flotte',
    bookNow: 'Réserver',
    fleetTitle: 'Une voiture pour chaque trajet',
    fleetLead: 'De l’économique au premium — des véhicules récents, entretenus, à des tarifs journaliers clairs.',
    search: 'Rechercher une voiture...',
    noResults: 'Aucun véhicule ne correspond à votre recherche.',
    perDay: '/ jour',
    seats: 'places', bags: 'bagages', ac: 'Clim',
    auto: 'Automatique', manual: 'Manuelle',
    petrol: 'Essence', diesel: 'Diesel', hybrid: 'Hybride', electric: 'Électrique',
    popular: 'Populaire', newCar: 'Nouveau', deal: 'Offre',
    howTitle: 'Comment réserver ?',
    howLead: 'Quatre étapes simples avant de prendre la route.',
    step1: 'Choisissez la voiture', step2: 'Dates et heures', step3: 'Confirmez', step4: 'Récupérez et partez',
    step1d: 'Parcourez la flotte et comparez les équipements et les prix.',
    step2d: 'Choisissez la date et l’heure de départ et de retour.',
    step3d: 'Laissez votre numéro, nous vous appelons pour confirmer.',
    step4d: 'Livraison à l’agence ou à l’aéroport, assurance incluse.',
    whyTitle: 'Pourquoi nous choisir ?',
    whyLead: 'Une location claire, sans frais cachés.',
    feat1: 'Assurance tous risques', feat1d: 'Chaque véhicule est assuré, avec assistance routière.',
    feat2: 'Kilométrage illimité', feat2d: 'Roulez sans supplément sur la distance.',
    feat3: 'Livraison flexible', feat3d: 'À l’agence, à l’aéroport ou à votre adresse.',
    feat4: 'Assistance 24/7', feat4d: 'Une équipe disponible tous les jours pour vous aider.',
    bookingTitle: 'Réserver un véhicule',
    bookingLead: 'Choisissez votre voiture et vos dates, nous vous appelons pour confirmer la disponibilité.',
    carLabel: 'Véhicule', duration: 'Durée', estimate: 'Estimation', daysLabel: 'jours',
    pickupDate: 'Date de départ', returnDate: 'Date de retour',
    pickupPlace: 'Lieu de prise en charge', agency: 'Agence', airport: 'Aéroport', home: 'À domicile',
    confirm: 'Confirmer la réservation',
    note: 'Paiement à la prise en charge — caution remboursable au retour.',
    terms: 'Conditions de location',
    faq: [
      ['Quelles sont les conditions d’âge et de permis ?', 'Âge minimum 21 ans avec un permis valide depuis au moins un an.'],
      ['Y a-t-il une assurance ou une caution ?', 'Tous les véhicules sont assurés. Une caution remboursable de 20 000 DA est demandée.'],
      ['Quelle est la politique carburant et kilométrage ?', 'Le véhicule est fourni et rendu avec le plein. Kilométrage illimité en Algérie.'],
      ['Puis-je annuler ma réservation ?', 'Oui, l’annulation est gratuite jusqu’à 24 heures avant la prise en charge.'],
    ],
    stats: [['+8', 'véhicules récents'], ['+120', 'clients satisfaits'], ['24/7', 'accueil & support'], ['98%', 'satisfaction']],
    quotes: [
      { text: 'J’ai loué une voiture familiale une semaine : propre et livrée à l’aéroport pile à l’heure.', name: 'Samir H.', role: 'Client' },
      { text: 'Des prix clairs sans frais cachés, et une équipe qui m’a bien conseillée.', name: 'Lynda B.', role: 'Cliente' },
      { text: 'J’ai réservé une Mercedes pour un déplacement pro : service impeccable.', name: 'Yacine A.', role: 'Chef d’entreprise' },
    ],
  },
  en: {
    heroBadge: 'Full insurance and unlimited mileage',
    explore: 'Explore the fleet',
    bookNow: 'Book now',
    fleetTitle: 'A car for every trip',
    fleetLead: 'From budget to premium — recent, well-maintained cars at clear daily rates.',
    search: 'Search a car...',
    noResults: 'No cars match your search.',
    perDay: '/ day',
    seats: 'seats', bags: 'bags', ac: 'A/C',
    auto: 'Automatic', manual: 'Manual',
    petrol: 'Petrol', diesel: 'Diesel', hybrid: 'Hybrid', electric: 'Electric',
    popular: 'Most popular', newCar: 'New', deal: 'Special offer',
    howTitle: 'How to book your car',
    howLead: 'Four simple steps before you hit the road.',
    step1: 'Choose your car', step2: 'Pick your dates', step3: 'Confirm', step4: 'Collect and drive',
    step1d: 'Browse the fleet and compare specs and prices.',
    step2d: 'Choose pickup and return dates and times.',
    step3d: 'Leave your number and we call you to confirm availability.',
    step4d: 'Pickup at the agency or airport, insurance included.',
    whyTitle: 'Why choose us?',
    whyLead: 'Clear rental terms with no hidden fees.',
    feat1: 'Full insurance', feat1d: 'Every car is fully insured with roadside assistance.',
    feat2: 'Unlimited mileage', feat2d: 'Drive without extra distance charges.',
    feat3: 'Flexible delivery', feat3d: 'At the agency, the airport or your address.',
    feat4: '24/7 support', feat4d: 'A team available every day to help you.',
    bookingTitle: 'Book a car',
    bookingLead: 'Choose your car and dates, and we will call you to confirm availability.',
    carLabel: 'Car', duration: 'Duration', estimate: 'Estimate', daysLabel: 'days',
    pickupDate: 'Pickup date', returnDate: 'Return date',
    pickupPlace: 'Pickup location', agency: 'Agency', airport: 'Airport', home: 'Your address',
    confirm: 'Confirm booking',
    note: 'Payment on pickup — refundable deposit returned on drop-off.',
    terms: 'Rental terms',
    faq: [
      ['What are the age and licence requirements?', 'Minimum age 21 with a valid driving licence held for at least one year.'],
      ['Is insurance or a deposit required?', 'All cars are fully insured. A refundable 20,000 DA deposit is required.'],
      ['What is the fuel and mileage policy?', 'Cars are provided and returned with a full tank. Unlimited mileage in Algeria.'],
      ['Can I cancel my booking?', 'Yes, cancellation is free up to 24 hours before pickup.'],
    ],
    stats: [['+8', 'recent cars'], ['+120', 'happy clients'], ['24/7', 'support'], ['98%', 'satisfaction']],
    quotes: [
      { text: 'I rented a family car for a week. Clean, and delivered to the airport right on time.', name: 'Samir H.', role: 'Customer' },
      { text: 'Clear prices with no hidden fees, and a team that helped me pick the right car.', name: 'Lynda B.', role: 'Customer' },
      { text: 'Booked a Mercedes for a business trip — impeccable service and a pristine car.', name: 'Yacine A.', role: 'Business owner' },
    ],
  },
};

function rentalCard(p: RenderProduct, copy: RentalCopy, lang: Lang): string {
  const r = p.rental;
  const badgeLabel = r?.badge === 'popular' ? copy.popular : r?.badge === 'new' ? copy.newCar : r?.badge === 'deal' ? copy.deal : '';
  const specs: string[] = [];
  if (r) {
    specs.push(`<span class="spec">${icon('users')}<span>${r.seats} ${esc(copy.seats)}</span></span>`);
    specs.push(`<span class="spec">${icon('gearbox')}<span>${esc(r.transmission === 'auto' ? copy.auto : copy.manual)}</span></span>`);
    const fuel = { petrol: copy.petrol, diesel: copy.diesel, hybrid: copy.hybrid, electric: copy.electric }[r.fuel];
    specs.push(`<span class="spec">${icon('fuel')}<span>${esc(fuel)}</span></span>`);
    if (r.luggage) specs.push(`<span class="spec">${icon('suitcase')}<span>${r.luggage} ${esc(copy.bags)}</span></span>`);
    if (r.ac) specs.push(`<span class="spec">${icon('snow')}<span>${esc(copy.ac)}</span></span>`);
    if (r.year) specs.push(`<span class="spec">${icon('calendar')}<span>${r.year}</span></span>`);
  }
  const image = p.imageUrl
    ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="900" height="620">`
    : productPlaceholder(p.name);
  return `<article class="fleet-card" data-reveal data-product-card data-category="${attr(p.category || '')}" data-name="${attr(p.name)}" data-desc="${attr(p.description || '')}">
    <div class="fleet-media">${image}${badgeLabel ? `<span class="fleet-badge ${r?.badge}">${esc(badgeLabel)}</span>` : ''}</div>
    <div class="fleet-body">
      ${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      ${p.description ? `<p class="fleet-desc">${esc(p.description)}</p>` : ''}
      ${specs.length ? `<div class="fleet-specs">${specs.join('')}</div>` : ''}
      <div class="fleet-foot">
        <div class="fleet-price">${money(p.price, lang)}<small>${esc(copy.perDay)}</small></div>
        <button class="btn btn-primary fleet-book" type="button" data-book-car="${attr(p.id)}">${icon('key')}${esc(copy.bookNow)}</button>
      </div>
    </div>
  </article>`;
}

export function carRentalPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = RENTAL[lang];
  const cars = config.products.filter((p) => p.name);
  const categories = Array.from(new Set(cars.map((p) => p.category).filter(Boolean))) as string[];
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const first = cars[0];
  const options = cars.map((p, i) => `<option value="${attr(p.id)}" data-name="${attr(p.name)}" data-price="${p.price}" data-min-days="${p.rental?.minDays || 1}"${i === 0 ? ' selected' : ''}>${esc(p.name)} — ${money(p.price, lang)} ${esc(copy.perDay)}</option>`).join('');

  return `<section class="hero rental-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('shield')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#fleet">${icon('car')}${esc(copy.explore)}</a>
          <a class="btn btn-light" href="#booking">${icon('calendar')}${esc(s.booking)}</a>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('shield')}</span><div><strong>${esc(copy.feat1)}</strong><span>${esc(copy.feat2)}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('shield')}${esc(copy.feat1)}</span>
    <span class="trust-item">${icon('road')}${esc(copy.feat2)}</span>
    <span class="trust-item">${icon('map')}${esc(copy.feat3)}</span>
    <span class="trust-item">${icon('clock')}${esc(copy.feat4)}</span>
  </div></div>

  <section class="section" id="fleet">
    <div class="container">
      ${sectionHead(s.fleet, copy.fleetTitle, copy.fleetLead)}
      <div class="shop-toolbar">
        <button class="chip active" type="button" data-filter="all">${esc(s.all)}</button>
        ${categories.map((cat) => `<button class="chip" type="button" data-filter="${attr(cat)}">${esc(cat)}</button>`).join('')}
        <div class="search-box">${icon('search')}<input id="product-search" type="search" placeholder="${attr(copy.search)}" aria-label="${attr(copy.search)}"></div>
      </div>
      <div class="fleet-grid">
        ${cars.map((p) => rentalCard(p, copy, lang)).join('')}
        <div class="product-empty${cars.length ? ' hide' : ''}" id="product-empty">${esc(copy.noResults)}</div>
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="how">
    <div class="container">
      ${sectionHead(s.process, copy.howTitle, copy.howLead)}
      <div class="rental-steps">
        ${[
          ['car', copy.step1, copy.step1d],
          ['calendar', copy.step2, copy.step2d],
          ['phone', copy.step3, copy.step3d],
          ['key', copy.step4, copy.step4d],
        ].map(([ic, title, desc], i) => `<div class="rental-step" data-reveal>
          <span class="n">0${i + 1}</span>
          <span class="s-ic">${icon(ic as 'car' | 'calendar' | 'phone' | 'key')}</span>
          <h3>${esc(title)}</h3>
          <p>${esc(desc)}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="about">
    <div class="container about-grid">
      <div class="about-media${about ? '' : ' no-img'}" data-reveal>
        ${about ? `<img src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="700">` : ''}
        <div class="about-badge">${icon('award')}${esc(copy.feat1)}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(copy.whyTitle)}</h2>
        <p class="lead mt-2">${esc(copy.whyLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)} — ${esc(copy.feat1d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)} — ${esc(copy.feat2d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)} — ${esc(copy.feat3d)}</span></li>
        </ul>
        <a class="btn btn-primary mt-4" href="#booking">${icon('calendar')}${esc(s.booking)}</a>
      </div>
    </div>
  </section>

  <section class="section bg-soft">
    <div class="container">
      ${sectionHead(s.benefits, copy.whyTitle)}
      <div class="feature-grid">
        ${[
          ['shield', copy.feat1, copy.feat1d],
          ['road', copy.feat2, copy.feat2d],
          ['map', copy.feat3, copy.feat3d],
          ['clock', copy.feat4, copy.feat4d],
        ].map(([ic, title, desc]) => `<div class="feature" data-reveal>
          <span class="f-ic">${icon(ic as 'shield' | 'road' | 'map' | 'clock')}</span>
          <div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="booking">
    <div class="container booking-wrap">
      <div class="booking-copy" data-reveal>
        <span class="eyebrow">${esc(s.booking)}</span>
        <h2 class="h2 mt-2">${esc(copy.bookingTitle)}</h2>
        <p class="lead mt-2">${esc(copy.bookingLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.note)}</span></li>
        </ul>
        ${contactDetails(config, s)}
      </div>
      <form class="booking-card" data-lead-form data-lead-kind="rental" data-rental data-days-label="${attr(copy.daysLabel)}" novalidate>
        <h3>${esc(copy.bookingTitle)}</h3>
        <p class="booking-sub">${esc(copy.bookingLead)}</p>
        <div class="form-grid">
          <div class="field"><label for="rental-name">${esc(s.name)}</label><input id="rental-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="rental-phone">${esc(s.phone)}</label><input id="rental-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field full"><label for="rental-car">${esc(copy.carLabel)}</label><select id="rental-car" name="car" required>${options}</select></div>
          <div class="field"><label for="rental-pickup-date">${esc(copy.pickupDate)}</label><input id="rental-pickup-date" name="pickupDate" type="date" required><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="rental-pickup-time">${esc(s.time)}</label><input id="rental-pickup-time" name="pickupTime" type="time" required value="09:00"></div>
          <div class="field"><label for="rental-return-date">${esc(copy.returnDate)}</label><input id="rental-return-date" name="returnDate" type="date" required><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="rental-return-time">${esc(s.time)}</label><input id="rental-return-time" name="returnTime" type="time" required value="10:00"></div>
          <div class="field"><label for="rental-place">${esc(copy.pickupPlace)}</label><select id="rental-place" name="pickupPlace"><option>${esc(copy.agency)}</option><option>${esc(copy.airport)}</option><option>${esc(copy.home)}</option></select></div>
          <div class="field"><label for="rental-note">${esc(s.note)}</label><input id="rental-note" name="message" maxlength="300"></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <div class="rental-summary" aria-live="polite">
          <div><span>${esc(copy.carLabel)}</span><strong id="rental-car-name">${esc(first?.name || '')}</strong></div>
          <div><span>${esc(copy.duration)}</span><strong id="rental-days">—</strong></div>
          <div class="grand"><span>${esc(copy.estimate)}</span><strong id="rental-total">—</strong></div>
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('check')}${esc(copy.confirm)}</button>
        <div class="form-status" role="status"></div>
        <p class="form-note center mt-2">${esc(copy.note)}</p>
      </form>
    </div>
  </section>

  <section class="section" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.terms, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * MEDICAL
 * ---------------------------------------------------------------------- */
interface MedicalSpecialty {
  icon: string;
  title: string;
  description: string;
}

interface MedicalCopy {
  heroBadge: string;
  bookCta: string;
  specialtiesCta: string;
  ecgLabel: string;
  openToday: string;
  specialtiesTitle: string;
  specialtiesLead: string;
  specialties: MedicalSpecialty[];
  servicesTitle: string;
  servicesLead: string;
  from: string;
  bookService: string;
  teamTitle: string;
  teamLead: string;
  experience: string;
  bookDoctor: string;
  aboutTitle: string;
  aboutLead: string;
  feat1: string; feat1d: string;
  feat2: string; feat2d: string;
  feat3: string; feat3d: string;
  feat4: string; feat4d: string;
  insuranceTitle: string;
  insuranceLead: string;
  insuranceEyebrow: string;
  insurers: string[];
  processTitle: string;
  processLead: string;
  step1: string; step1d: string;
  step2: string; step2d: string;
  step3: string; step3d: string;
  step4: string; step4d: string;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
  appointmentTitle: string;
  appointmentLead: string;
  formTitle: string;
  formSub: string;
  serviceLabel: string;
  doctorLabel: string;
  anyDoctor: string;
  selectService: string;
  summaryService: string;
  summaryDoctor: string;
  summaryWhen: string;
  confirm: string;
  note: string;
  faqTitle: string;
  faq: Array<[string, string]>;
}

const MEDICAL: Record<Lang, MedicalCopy> = {
  ar: {
    heroBadge: 'أطباء معتمدون ورعاية إنسانية',
    bookCta: 'احجز موعدك',
    specialtiesCta: 'تخصصاتنا',
    ecgLabel: 'نبض مطمئن، رعاية مستمرة',
    openToday: 'مواعيد اليوم',
    specialtiesTitle: 'تخصصات تحت سقف واحد',
    specialtiesLead: 'فريق طبي متكامل يرافقك من الفحص الأول إلى المتابعة.',
    specialties: [
      { icon: 'stethoscope', title: 'طب عام', description: 'فحص شامل، تشخيص دقيق ومتابعة للحالات المزمنة.' },
      { icon: 'baby', title: 'طب الأطفال', description: 'متابعة النمو والتلقيح والنصائح الوقائية لكل طفل.' },
      { icon: 'users', title: 'نساء وتوليد', description: 'متابعة الحمل والولادة وصحة المرأة في كل مرحلة.' },
      { icon: 'heart', title: 'أمراض القلب', description: 'تخطيط القلب وضغط الدم والمتابعة الوقائية.' },
      { icon: 'layers', title: 'تحاليل مخبرية', description: 'تحاليل شاملة بنتائج سريعة ودقة عالية.' },
      { icon: 'target', title: 'تصوير طبي', description: 'تصوير بالصدى والأشعة مع تقرير فوري.' },
    ],
    servicesTitle: 'خدمات وأسعار واضحة',
    servicesLead: 'اعرف الخدمة والتكلفة قبل الزيارة، دون مفاجآت.',
    from: 'من',
    bookService: 'احجز هذه الخدمة',
    teamTitle: 'أطباء تعرفهم',
    teamLead: 'اختر طبيبك واحجز معه مباشرة.',
    experience: 'سنوات الخبرة',
    bookDoctor: 'احجز مع الطبيب',
    aboutTitle: 'رعاية تبدأ بالإنصات',
    aboutLead: 'نؤمن أن أفضل علاج يبدأ بفهم المريض، لذلك نمنح كل زيارة وقتها الكافي ونشرح كل خطوة بوضوح.',
    feat1: 'فريق متعدد التخصصات', feat1d: 'أطباء وأخصائيون في تخصصات مترابطة تحت سقف واحد.',
    feat2: 'مواعيد قصيرة الانتظار', feat2d: 'نظام حجز منظم يقلل الانتظار ويحترم وقتك.',
    feat3: 'تجهيزات حديثة', feat3d: 'أجهزة تشخيص وتحاليل معتمدة داخل العيادة.',
    feat4: 'متابعة بعد الزيارة', feat4d: 'نتابع نتيجتك ونوجهك إلى الخطوة التالية.',
    insuranceTitle: 'تأمين مقبول',
    insuranceLead: 'نتعامل مع صناديق التأمين الرئيسية ونساعدك في ملف التعويض.',
    insuranceEyebrow: 'التأمين الطبي',
    insurers: ['CNAS', 'CASNOS', 'AXA', 'SAA', 'CAAT', 'Allianz'],
    processTitle: 'كيف تحجز موعدك؟',
    processLead: 'أربع خطوات بسيطة من الحجز إلى المتابعة.',
    step1: 'اختر الخدمة', step1d: 'حدد الخدمة أو التخصص الذي تحتاجه.',
    step2: 'حدد الطبيب والوقت', step2d: 'اختر الطبيب والتاريخ والساعة المناسبة.',
    step3: 'أكّد الحجز هاتفياً', step3d: 'نتصل بك لتأكيد الموعد وتوضيح التحضيرات.',
    step4: 'زيارة ومتابعة', step4d: 'استقبال، فحص، ثم متابعة النتائج مع طبيبك.',
    stats: [['+12', 'سنة خبرة'], ['+18k', 'مريض'], ['98%', 'رضا المرضى'], ['24/7', 'استقبال']],
    quotes: [
      { text: 'استقبال محترم وطبيبة أنصتت لكل التفاصيل، خرجت وأنا مطمئنة تماماً.', name: 'نسرين ب.', role: 'مريضة' },
      { text: 'حجزت موعداً لابني في نفس اليوم، والفحص كان دقيقاً والمتابعة ممتازة.', name: 'مراد ع.', role: 'أب' },
      { text: 'عيادة نظيفة وتنظيم رائع، والتحاليل وصلت في وقتها دون أي تأخير.', name: 'ليلى ح.', role: 'مريضة' },
    ],
    appointmentTitle: 'احجز موعدك الآن',
    appointmentLead: 'اختر الخدمة والطبيب والوقت المناسب، وسنتصل بك لتأكيد الموعد.',
    formTitle: 'طلب موعد',
    formSub: 'أكمل البيانات وسنتصل بك لتأكيد الموعد.',
    serviceLabel: 'الخدمة',
    doctorLabel: 'الطبيب',
    anyDoctor: 'أي طبيب متاح',
    selectService: 'اختر الخدمة',
    summaryService: 'الخدمة',
    summaryDoctor: 'الطبيب',
    summaryWhen: 'الموعد',
    confirm: 'تأكيد طلب الموعد',
    note: 'الموعد يُؤكد هاتفياً. الإلغاء مجاني قبل 24 ساعة.',
    faqTitle: 'أسئلة قبل الزيارة',
    faq: [
      ['هل أحتاج إلى موعد مسبق؟', 'يُنصح بالحجز لتقليل الانتظار، وتُستقبل الحالات المستعجلة حسب الأولوية.'],
      ['هل تقبلون التأمين؟', 'نعم، نتعامل مع CNAS وCASNOS وشركات التأمين، ونساعدك في ملف التعويض.'],
      ['كم تستغرق الاستشارة؟', 'تتراوح عادة بين 20 و30 دقيقة حسب الحالة، مع وقت كافٍ للأسئلة.'],
      ['هل تحتاج التحاليل إلى صيام؟', 'بعض التحاليل تتطلب صياماً، وسنوضح لك ذلك عند تأكيد الموعد.'],
      ['هل يمكنني إلغاء الموعد؟', 'نعم، الإلغاء مجاني حتى 24 ساعة قبل الموعد.'],
    ],
  },
  fr: {
    heroBadge: 'Médecins agréés et soins humains',
    bookCta: 'Prendre rendez-vous',
    specialtiesCta: 'Nos spécialités',
    ecgLabel: 'Un rythme rassurant, un suivi continu',
    openToday: 'Horaires du jour',
    specialtiesTitle: 'Toutes les spécialités sous un même toit',
    specialtiesLead: 'Une équipe médicale complète vous accompagne du premier examen au suivi.',
    specialties: [
      { icon: 'stethoscope', title: 'Médecine générale', description: 'Bilan complet, diagnostic précis et suivi des maladies chroniques.' },
      { icon: 'baby', title: 'Pédiatrie', description: 'Croissance, vaccination et conseils préventifs pour chaque enfant.' },
      { icon: 'users', title: 'Gynécologie', description: 'Grossesse, accouchement et santé de la femme à chaque étape.' },
      { icon: 'heart', title: 'Cardiologie', description: 'ECG, tension artérielle et suivi préventif du cœur.' },
      { icon: 'layers', title: 'Analyses médicales', description: 'Bilans complets, résultats rapides et fiables.' },
      { icon: 'target', title: 'Imagerie médicale', description: 'Échographie et radiologie avec compte rendu immédiat.' },
    ],
    servicesTitle: 'Des services et des prix clairs',
    servicesLead: 'Connaissez la prestation et son tarif avant la visite, sans surprise.',
    from: 'À partir de',
    bookService: 'Réserver ce service',
    teamTitle: 'Des médecins que vous connaissez',
    teamLead: 'Choisissez votre médecin et réservez directement avec lui.',
    experience: 'Années d’expérience',
    bookDoctor: 'Réserver avec ce médecin',
    aboutTitle: 'Un soin qui commence par l’écoute',
    aboutLead: 'Nous croyons qu’un bon traitement commence par la compréhension du patient : chaque visite a le temps nécessaire et chaque étape est expliquée clairement.',
    feat1: 'Équipe pluridisciplinaire', feat1d: 'Des médecins et spécialistes complémentaires sous un même toit.',
    feat2: 'Des délais d’attente réduits', feat2d: 'Un système de rendez-vous organisé qui respecte votre temps.',
    feat3: 'Équipements récents', feat3d: 'Appareils de diagnostic et d’analyses agréés au cabinet.',
    feat4: 'Suivi après la visite', feat4d: 'Nous suivons vos résultats et vous orientons vers la prochaine étape.',
    insuranceTitle: 'Assurances acceptées',
    insuranceLead: 'Nous travaillons avec les principales caisses et vous aidons dans votre dossier de remboursement.',
    insuranceEyebrow: 'Assurance médicale',
    insurers: ['CNAS', 'CASNOS', 'AXA', 'SAA', 'CAAT', 'Allianz'],
    processTitle: 'Comment prendre rendez-vous ?',
    processLead: 'Quatre étapes simples, du rendez-vous au suivi.',
    step1: 'Choisissez le service', step1d: 'Sélectionnez la prestation ou la spécialité dont vous avez besoin.',
    step2: 'Choisissez le médecin et l’heure', step2d: 'Choisissez le médecin, la date et l’heure qui vous conviennent.',
    step3: 'Confirmez par téléphone', step3d: 'Nous vous appelons pour confirmer et préciser les préparations.',
    step4: 'Visite et suivi', step4d: 'Accueil, examen, puis suivi des résultats avec votre médecin.',
    stats: [['+12', 'ans d’expérience'], ['+18k', 'patients'], ['98%', 'satisfaction'], ['24/7', 'accueil']],
    quotes: [
      { text: 'Un accueil respectueux et une médecin qui a écouté chaque détail. Je suis repartie rassurée.', name: 'Nesrine B.', role: 'Patiente' },
      { text: 'J’ai obtenu un rendez-vous le jour même pour mon fils : examen précis et excellent suivi.', name: 'Mourad A.', role: 'Père de famille' },
      { text: 'Cabinet propre et très bien organisé, analyses reçues à l’heure sans aucun retard.', name: 'Leïla H.', role: 'Patiente' },
    ],
    appointmentTitle: 'Prenez rendez-vous maintenant',
    appointmentLead: 'Choisissez le service, le médecin et l’horaire, nous vous appelons pour confirmer.',
    formTitle: 'Demande de rendez-vous',
    formSub: 'Complétez le formulaire, nous vous appelons pour confirmer.',
    serviceLabel: 'Service',
    doctorLabel: 'Médecin',
    anyDoctor: 'Premier médecin disponible',
    selectService: 'Choisir un service',
    summaryService: 'Service',
    summaryDoctor: 'Médecin',
    summaryWhen: 'Rendez-vous',
    confirm: 'Confirmer la demande',
    note: 'Le rendez-vous est confirmé par téléphone. Annulation gratuite jusqu’à 24 h avant.',
    faqTitle: 'Questions avant la visite',
    faq: [
      ['Faut-il prendre rendez-vous ?', 'La réservation est recommandée pour réduire l’attente ; les urgences sont reçues selon leur priorité.'],
      ['Acceptez-vous les assurances ?', 'Oui, nous travaillons avec la CNAS, la CASNOS et les assureurs, et vous aidons pour le remboursement.'],
      ['Combien de temps dure la consultation ?', 'En général entre 20 et 30 minutes selon le cas, avec le temps nécessaire pour vos questions.'],
      ['Les analyses nécessitent-elles d’être à jeun ?', 'Certaines analyses oui ; nous vous le préciserons lors de la confirmation du rendez-vous.'],
      ['Puis-je annuler mon rendez-vous ?', 'Oui, l’annulation est gratuite jusqu’à 24 heures avant le rendez-vous.'],
    ],
  },
  en: {
    heroBadge: 'Certified doctors, human care',
    bookCta: 'Book your appointment',
    specialtiesCta: 'Our specialties',
    ecgLabel: 'A steady heartbeat, continuous care',
    openToday: 'Today’s hours',
    specialtiesTitle: 'Every specialty under one roof',
    specialtiesLead: 'A complete medical team with you from the first check-up to follow-up.',
    specialties: [
      { icon: 'stethoscope', title: 'General medicine', description: 'Full check-ups, accurate diagnosis and chronic condition follow-up.' },
      { icon: 'baby', title: 'Pediatrics', description: 'Growth, vaccination and preventive advice for every child.' },
      { icon: 'users', title: 'Gynecology', description: 'Pregnancy, delivery and women’s health at every stage.' },
      { icon: 'heart', title: 'Cardiology', description: 'ECG, blood pressure and preventive heart care.' },
      { icon: 'layers', title: 'Lab tests', description: 'Complete panels with fast, reliable results.' },
      { icon: 'target', title: 'Medical imaging', description: 'Ultrasound and X-ray with an immediate report.' },
    ],
    servicesTitle: 'Clear services and prices',
    servicesLead: 'Know the service and its cost before your visit, with no surprises.',
    from: 'From',
    bookService: 'Book this service',
    teamTitle: 'Doctors you know',
    teamLead: 'Choose your doctor and book directly with them.',
    experience: 'Years of experience',
    bookDoctor: 'Book with this doctor',
    aboutTitle: 'Care that starts with listening',
    aboutLead: 'We believe the best treatment starts with understanding the patient, so every visit gets the time it needs and every step is explained clearly.',
    feat1: 'Multidisciplinary team', feat1d: 'Doctors and specialists in connected fields under one roof.',
    feat2: 'Short waiting times', feat2d: 'An organised booking system that respects your time.',
    feat3: 'Modern equipment', feat3d: 'Certified diagnostic and lab equipment inside the clinic.',
    feat4: 'Follow-up after your visit', feat4d: 'We follow your results and guide you to the next step.',
    insuranceTitle: 'Insurance accepted',
    insuranceLead: 'We work with the main insurers and help you with your reimbursement claim.',
    insuranceEyebrow: 'Medical insurance',
    insurers: ['CNAS', 'CASNOS', 'AXA', 'SAA', 'CAAT', 'Allianz'],
    processTitle: 'How to book your appointment',
    processLead: 'Four simple steps from booking to follow-up.',
    step1: 'Choose the service', step1d: 'Select the service or specialty you need.',
    step2: 'Pick a doctor and time', step2d: 'Choose the doctor, date and time that suit you.',
    step3: 'Confirm by phone', step3d: 'We call you to confirm and explain any preparation.',
    step4: 'Visit and follow-up', step4d: 'Reception, examination, then results follow-up with your doctor.',
    stats: [['+12', 'years of experience'], ['+18k', 'patients'], ['98%', 'patient satisfaction'], ['24/7', 'reception']],
    quotes: [
      { text: 'A respectful welcome and a doctor who listened to every detail. I left completely reassured.', name: 'Nesrine B.', role: 'Patient' },
      { text: 'I got a same-day appointment for my son: a precise examination and excellent follow-up.', name: 'Mourad A.', role: 'Parent' },
      { text: 'Clean clinic and great organisation, with lab results delivered on time without delay.', name: 'Leïla H.', role: 'Patient' },
    ],
    appointmentTitle: 'Book your appointment now',
    appointmentLead: 'Choose the service, doctor and time, and we will call you to confirm.',
    formTitle: 'Appointment request',
    formSub: 'Fill in the form and we will call you to confirm.',
    serviceLabel: 'Service',
    doctorLabel: 'Doctor',
    anyDoctor: 'First available doctor',
    selectService: 'Choose a service',
    summaryService: 'Service',
    summaryDoctor: 'Doctor',
    summaryWhen: 'Appointment',
    confirm: 'Confirm appointment request',
    note: 'The appointment is confirmed by phone. Free cancellation up to 24 hours before.',
    faqTitle: 'Questions before your visit',
    faq: [
      ['Do I need an appointment?', 'Booking is recommended to reduce waiting; urgent cases are seen according to priority.'],
      ['Do you accept insurance?', 'Yes, we work with CNAS, CASNOS and insurers, and help you with your reimbursement claim.'],
      ['How long does a consultation take?', 'Usually 20 to 30 minutes depending on the case, with enough time for your questions.'],
      ['Do lab tests require fasting?', 'Some tests do; we will tell you when confirming your appointment.'],
      ['Can I cancel my appointment?', 'Yes, cancellation is free up to 24 hours before the appointment.'],
    ],
  },
};

function medicalServiceCard(p: RenderProduct, copy: MedicalCopy, lang: Lang): string {
  const image = p.imageUrl
    ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="700" height="440">`
    : productPlaceholder(p.name);
  return `<article class="med-service" data-reveal>
    <div class="med-service-media">${image}${p.category ? `<span class="med-tag">${esc(p.category)}</span>` : ''}</div>
    <div class="med-service-body">
      <h3>${esc(p.name)}</h3>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      <div class="med-service-foot">
        <div class="med-price"><small>${esc(copy.from)}</small>${money(p.price, lang)}</div>
        <button class="btn btn-primary btn-sm" type="button" data-book-service="${attr(p.name)}">${icon('calendar')}${esc(copy.bookService)}</button>
      </div>
    </div>
  </article>`;
}

function doctorCard(member: RenderTeamMember, copy: MedicalCopy): string {
  const photo = member.photoUrl
    ? `<img src="${attr(member.photoUrl)}" alt="${attr(member.name)}" loading="lazy" decoding="async" width="700" height="800">`
    : `<span class="doctor-initials">${esc(initialsFor(member.name))}</span>`;
  return `<article class="doctor-card" data-reveal>
    <div class="doctor-media">${photo}${member.specialty ? `<span class="doctor-tag">${esc(member.specialty)}</span>` : ''}</div>
    <div class="doctor-body">
      <h3>${esc(member.name)}</h3>
      <p class="doctor-role">${esc(member.role)}</p>
      ${member.experience ? `<span class="doctor-exp">${icon('award')}${esc(member.experience)} ${esc(copy.experience)}</span>` : ''}
      <button class="btn btn-light btn-sm btn-block" type="button" data-book-doctor="${attr(member.name)}">${icon('calendar')}${esc(copy.bookDoctor)}</button>
    </div>
  </article>`;
}

export function medicalPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = MEDICAL[lang];
  const services = config.products.filter((p) => p.name);
  const team = config.team || [];
  const specialists = team.length ? team : [];
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const serviceOptions = services.map((p, i) => `<option value="${attr(p.name)}"${i === 0 ? ' selected' : ''}>${esc(p.name)} — ${money(p.price, lang)}</option>`).join('');
  const doctorOptions = [
    `<option value="">${esc(copy.anyDoctor)}</option>`,
    ...team.map((m) => `<option value="${attr(m.name)}">${esc(m.name)} — ${esc(m.role)}</option>`),
  ].join('');
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  const firstService = services[0]?.name || '';
  const firstDoctor = team[0]?.name || copy.anyDoctor;

  return `<section class="hero medical-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('stethoscope')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#appointment">${icon('calendar')}${esc(copy.bookCta)}</a>
          <a class="btn btn-light" href="#specialties">${icon('stethoscope')}${esc(copy.specialtiesCta)}</a>
        </div>
        <div class="ecg-card" aria-hidden="true">
          <span class="ecg-label">${icon('heart')}<span>${esc(copy.ecgLabel)}</span></span>
          <svg class="ecg-line" viewBox="0 0 260 64" preserveAspectRatio="none">
            <path class="ecg-base" d="M2 32h38l7-14 9 28 9-22 7 8h33l6-6 8 12 8-6h30l7-16 9 32 8-16h46"/>
            <path class="ecg-pulse" d="M2 32h38l7-14 9 28 9-22 7 8h33l6-6 8 12 8-6h30l7-16 9 32 8-16h46" pathLength="100"/>
          </svg>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('clock')}</span><div><strong>${esc(copy.openToday)}</strong><span>${esc(config.hours || '08:00 — 18:00')}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('stethoscope')}${esc(copy.feat1)}</span>
    <span class="trust-item">${icon('clock')}${esc(copy.feat2)}</span>
    <span class="trust-item">${icon('shield')}${esc(copy.insurers[0])} · ${esc(copy.insurers[1])}</span>
    <span class="trust-item">${icon('heart')}${esc(copy.feat4)}</span>
  </div></div>

  <section class="section" id="specialties">
    <div class="container">
      ${sectionHead(copy.specialtiesCta, copy.specialtiesTitle, copy.specialtiesLead, true)}
      <div class="specialty-grid">
        ${copy.specialties.map((item, i) => `<article class="specialty-card" data-reveal>
          <span class="specialty-icon">${icon(item.icon as any)}</span>
          <span class="specialty-num">0${i + 1}</span>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="services">
    <div class="container">
      ${sectionHead(s.ourServices, copy.servicesTitle, copy.servicesLead)}
      <div class="med-service-grid">
        ${services.map((p) => medicalServiceCard(p, copy, lang)).join('')}
      </div>
    </div>
  </section>

  ${specialists.length ? `<section class="section" id="team">
    <div class="container">
      ${sectionHead(s.team, copy.teamTitle, copy.teamLead, true)}
      <div class="doctor-grid">${specialists.map((m) => doctorCard(m, copy)).join('')}</div>
    </div>
  </section>` : ''}

  <section class="section bg-soft" id="about">
    <div class="container about-grid">
      <div class="about-media${about ? '' : ' no-img'}" data-reveal>
        ${about ? `<img src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="700">` : ''}
        <div class="about-badge">${icon('award')}${esc(copy.stats[0][0])} ${esc(copy.stats[0][1])}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(copy.aboutTitle)}</h2>
        <p class="lead mt-2">${esc(copy.aboutLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)} — ${esc(copy.feat1d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)} — ${esc(copy.feat2d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)} — ${esc(copy.feat3d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat4)} — ${esc(copy.feat4d)}</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm insurance-band">
    <div class="container insurance-inner">
      <div data-reveal>
        <span class="eyebrow">${esc(copy.insuranceEyebrow)}</span>
        <h2 class="h3 mt-2">${esc(copy.insuranceTitle)}</h2>
        <p class="muted" style="font-size:.86rem;margin-top:6px">${esc(copy.insuranceLead)}</p>
      </div>
      <div class="insurance-logos" data-reveal>
        ${copy.insurers.map((name) => `<span class="insurance-chip">${icon('shield')}${esc(name)}</span>`).join('')}
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="process">
    <div class="container">
      ${sectionHead(s.process, copy.processTitle, copy.processLead)}
      <div class="rental-steps med-steps">
        ${[
          ['calendar', copy.step1, copy.step1d],
          ['user', copy.step2, copy.step2d],
          ['phone', copy.step3, copy.step3d],
          ['heart', copy.step4, copy.step4d],
        ].map(([ic, title, desc], i) => `<div class="rental-step" data-reveal>
          <span class="n">0${i + 1}</span>
          <span class="s-ic">${icon(ic as 'calendar' | 'user' | 'phone' | 'heart')}</span>
          <h3>${esc(title)}</h3>
          <p>${esc(desc)}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="appointment">
    <div class="container booking-wrap">
      <div class="booking-copy" data-reveal>
        <span class="eyebrow">${esc(s.appointment)}</span>
        <h2 class="h2 mt-2">${esc(copy.appointmentTitle)}</h2>
        <p class="lead mt-2">${esc(copy.appointmentLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat4)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.note)}</span></li>
        </ul>
        <div class="med-hours">
          <div class="hours-row"><span>${icon('clock')}${esc(s.hours)}</span><strong>${esc(config.hours || '08:00 — 18:00')}</strong></div>
          <div class="hours-row"><span>${icon('map')}${esc(s.location)}</span><strong>${esc(config.address || config.city || '')}</strong></div>
        </div>
        <div class="med-contact-actions">
          <a class="btn btn-light" href="tel:${attr(config.phone)}">${icon('phone')}${esc(s.callNow)}</a>
          <a class="btn btn-wa" href="${attr(waHref(config, `${s.appointment} — ${config.siteName}`))}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
      </div>
      <form class="booking-card appointment-card" data-lead-form data-lead-kind="appointment" data-appointment novalidate>
        <h3>${esc(copy.formTitle)}</h3>
        <p class="booking-sub">${esc(copy.formSub)}</p>
        <div class="form-grid">
          <div class="field"><label for="appt-name">${esc(s.name)}</label><input id="appt-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="appt-phone">${esc(s.phone)}</label><input id="appt-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field"><label for="appt-service">${esc(copy.serviceLabel)}</label><select id="appt-service" name="service" required>${serviceOptions}</select></div>
          <div class="field"><label for="appt-doctor">${esc(copy.doctorLabel)}</label><select id="appt-doctor" name="doctor">${doctorOptions}</select></div>
          <div class="field"><label for="appt-date">${esc(s.date)}</label><input id="appt-date" name="date" type="date" required><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="appt-time">${esc(s.time)}</label><select id="appt-time" name="time" required>${times.map((t) => `<option value="${t}">${t}</option>`).join('')}</select></div>
          <div class="field full"><label for="appt-note">${esc(s.note)}</label><input id="appt-note" name="message" maxlength="300"></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <div class="rental-summary appt-summary" aria-live="polite">
          <div><span>${esc(copy.summaryService)}</span><strong id="appt-service-name">${esc(firstService)}</strong></div>
          <div><span>${esc(copy.summaryDoctor)}</span><strong id="appt-doctor-name">${esc(firstDoctor)}</strong></div>
          <div class="grand"><span>${esc(copy.summaryWhen)}</span><strong id="appt-when">—</strong></div>
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('check')}${esc(copy.confirm)}</button>
        <div class="form-status" role="status"></div>
        <p class="form-note center mt-2">${esc(copy.note)}</p>
      </form>
    </div>
  </section>

  <section class="section" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.faqTitle, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * PHARMACY
 * ---------------------------------------------------------------------- */
interface PharmacyCategory {
  icon: string;
  title: string;
  description: string;
}

interface PharmacyCopy {
  heroBadge: string;
  orderCta: string;
  browseCta: string;
  openDaily: string;
  deliveryFast: string;
  deliveryNote: string;
  genuine: string;
  cash: string;
  heroMessage: string;
  categoriesEyebrow: string;
  categoriesTitle: string;
  categoriesLead: string;
  categories: PharmacyCategory[];
  productsEyebrow: string;
  productsTitle: string;
  productsLead: string;
  orderPrefix: string;
  orderProduct: string;
  servicesEyebrow: string;
  servicesTitle: string;
  servicesLead: string;
  fallbackServices: Array<{ title: string; description: string }>;
  rxEyebrow: string;
  rxTitle: string;
  rxLead: string;
  rxStep1: string; rxStep1d: string;
  rxStep2: string; rxStep2d: string;
  rxStep3: string; rxStep3d: string;
  rxCta: string;
  rxNote: string;
  rxMessage: string;
  teamEyebrow: string;
  teamTitle: string;
  teamLead: string;
  teamExperience: string;
  aboutTitle: string;
  aboutLead: string;
  feat1: string; feat1d: string;
  feat2: string; feat2d: string;
  feat3: string; feat3d: string;
  feat4: string; feat4d: string;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
  faqTitle: string;
  faq: Array<[string, string]>;
}

const PHARMACY: Record<Lang, PharmacyCopy> = {
  ar: {
    heroBadge: 'صيدلية معتمدة · استشارة مجانية',
    orderCta: 'اطلب عبر واتساب',
    browseCta: 'تصفح المنتجات',
    openDaily: 'مفتوحة يومياً',
    deliveryFast: 'توصيل سريع',
    deliveryNote: 'خلال 60 دقيقة داخل المدينة',
    genuine: 'منتجات أصلية 100%',
    cash: 'دفع عند الاستلام',
    heroMessage: 'أريد الاستفسار عن منتج أو طلب دواء',
    categoriesEyebrow: 'أقسام الصيدلية',
    categoriesTitle: 'كل ما تحتاجه تحت سقف واحد',
    categoriesLead: 'من الفيتامينات إلى العناية بالبشرة والأم والطفل، اعثر على قسمك بسرعة.',
    categories: [
      { icon: 'pill', title: 'فيتامينات ومكملات', description: 'دعم المناعة والعظام والطاقة بمنتجات أصلية.' },
      { icon: 'droplet', title: 'عناية بالبشرة', description: 'كريمات وغسولات طبية لكل أنواع البشرة.' },
      { icon: 'baby', title: 'أمومة وطفولة', description: 'حليب وحفاضات ومستلزمات العناية اليومية.' },
      { icon: 'thermometer', title: 'أجهزة طبية', description: 'ميزان حرارة وضغط وسكر بأسعار مناسبة.' },
      { icon: 'shield', title: 'حماية وتعقيم', description: 'كمامات ومعقمات ومستلزمات النظافة.' },
      { icon: 'clipboard', title: 'وصفات طبية', description: 'أرسل وصفتك ونجهزها لك قبل الوصول.' },
    ],
    productsEyebrow: 'الأكثر طلباً',
    productsTitle: 'منتجات مختارة بعناية',
    productsLead: 'أسعار واضحة ومنتجات أصلية، والطلب مباشرة عبر واتساب.',
    orderPrefix: 'أريد طلب',
    orderProduct: 'اطلب',
    servicesEyebrow: 'خدمات الصيدلية',
    servicesTitle: 'رعاية تتجاوز بيع الدواء',
    servicesLead: 'فريق مؤهل يقدم لك النصيحة والقياس والمتابعة داخل الصيدلية.',
    fallbackServices: [
      { title: 'استشارة دوائية', description: 'توضيح الجرعات والتداخلات الدوائية قبل الاستخدام.' },
      { title: 'قياس الضغط والسكر', description: 'خدمة سريعة داخل الصيدلية دون موعد مسبق.' },
      { title: 'تركيب الوصفات', description: 'نجهز وصفتك ونتحقق من التوفر قبل وصولك.' },
      { title: 'توصيل للمنزل', description: 'طلبك يصلك إلى باب منزلك خلال 60 دقيقة.' },
    ],
    rxEyebrow: 'وصفة طبية',
    rxTitle: 'أرسل وصفتك قبل أن تصل',
    rxLead: 'صوّر الوصفة وأرسلها عبر واتساب، نتحقق من التوفر ونجهز طلبك لتستلمه دون انتظار.',
    rxStep1: 'صوّر الوصفة', rxStep1d: 'تأكد من وضوح اسم الدواء والجرعة.',
    rxStep2: 'أرسلها عبر واتساب', rxStep2d: 'أرفق الصورة ورقم هاتفك.',
    rxStep3: 'استلم طلبك', rxStep3d: 'نؤكد التوفر والسعر ثم نجهز الوصفة.',
    rxCta: 'أرسل الوصفة الآن',
    rxNote: 'الوصفات الطبية تُصرف بعد التحقق من صيدلي معتمد.',
    rxMessage: 'لدي وصفة طبية وأريد إرسالها لكم',
    teamEyebrow: 'فريق الصيدلية',
    teamTitle: 'صيادلة تثق بهم',
    teamLead: 'فريق يعرف منتجاته ويشرح لك طريقة الاستخدام والجرعة.',
    teamExperience: 'سنوات الخبرة',
    aboutTitle: 'صيدلية قريبة منك',
    aboutLead: 'نؤمن أن الصيدلي شريك في صحتك، لذلك نمنح كل زائر وقتاً كافياً للشرح والمتابعة.',
    feat1: 'منتجات أصلية', feat1d: 'مصادر موثوقة وتخزين مطابق للمعايير.',
    feat2: 'أسعار واضحة', feat2d: 'السعر معروض قبل الطلب دون مفاجآت.',
    feat3: 'استشارة مجانية', feat3d: 'نصائح دوائية من صيدلي معتمد.',
    feat4: 'توصيل سريع', feat4d: 'خلال 60 دقيقة داخل المدينة.',
    stats: [['+12', 'سنة خبرة'], ['+18k', 'عميل'], ['60د', 'توصيل'], ['4.9/5', 'تقييم العملاء']],
    quotes: [
      { text: 'أرسلت وصفة أمي عبر واتساب وجهزوها قبل وصولنا، وفروا علينا وقتاً طويلاً.', name: 'أمينة ش.', role: 'زبونة' },
      { text: 'فريق يشرح الجرعة والتداخل الدوائي بصبر، وأسعار واضحة دون مفاجآت.', name: 'ياسين ب.', role: 'زبون' },
      { text: 'طلبت فيتامينات وتوصلت في أقل من ساعة، منتجات أصلية وتغليف ممتاز.', name: 'لينة م.', role: 'زبونة' },
    ],
    faqTitle: 'أسئلة شائعة',
    faq: [
      ['هل أحتاج وصفة طبية لشراء الدواء؟', 'الأدوية الوصفية تتطلب وصفة سارية، أما المكملات ومنتجات العناية فلا تحتاج.'],
      ['كيف أطلب منتجاً؟', 'أرسل اسم المنتج عبر واتساب أو زر الصيدلية، ونجهز طلبك فوراً.'],
      ['هل التوصيل متاح؟', 'نعم داخل المدينة خلال 60 دقيقة، وتُحدد الرسوم حسب المسافة.'],
      ['ما هي أوقات العمل؟', 'نفتح يومياً من 08:00 إلى 21:00، بما في ذلك عطلة نهاية الأسبوع.'],
      ['هل الدفع عند الاستلام؟', 'نعم، الدفع نقداً عند الاستلام أو داخل الصيدلية.'],
    ],
  },
  fr: {
    heroBadge: 'Pharmacie agréée · Conseil gratuit',
    orderCta: 'Commander sur WhatsApp',
    browseCta: 'Voir les produits',
    openDaily: 'Ouverte tous les jours',
    deliveryFast: 'Livraison rapide',
    deliveryNote: 'en 60 min en ville',
    genuine: 'Produits 100% authentiques',
    cash: 'Paiement à la livraison',
    heroMessage: 'Je souhaite un conseil ou commander un produit',
    categoriesEyebrow: 'Rayons de la pharmacie',
    categoriesTitle: 'Tout ce qu’il vous faut au même endroit',
    categoriesLead: 'Des vitamines aux soins de la peau, en passant par la mère et l’enfant, trouvez votre rayon rapidement.',
    categories: [
      { icon: 'pill', title: 'Vitamines & compléments', description: 'Soutien de l’immunité, des os et de l’énergie avec des produits authentiques.' },
      { icon: 'droplet', title: 'Soins de la peau', description: 'Crèmes et nettoyants médicaux pour tous types de peau.' },
      { icon: 'baby', title: 'Mère & enfant', description: 'Lait, couches et soins du quotidien.' },
      { icon: 'thermometer', title: 'Appareils médicaux', description: 'Thermomètres, tensiomètres et lecteurs de glycémie.' },
      { icon: 'shield', title: 'Protection & hygiène', description: 'Masques, gels et produits d’hygiène.' },
      { icon: 'clipboard', title: 'Ordonnances', description: 'Envoyez votre ordonnance, nous la préparons avant votre arrivée.' },
    ],
    productsEyebrow: 'Les plus demandés',
    productsTitle: 'Des produits choisis avec soin',
    productsLead: 'Des prix clairs et des produits authentiques, commandés directement sur WhatsApp.',
    orderPrefix: 'Je souhaite commander',
    orderProduct: 'Commander',
    servicesEyebrow: 'Services de la pharmacie',
    servicesTitle: 'Des soins au-delà de la délivrance',
    servicesLead: 'Une équipe qualifiée pour le conseil, la mesure et le suivi au sein de la pharmacie.',
    fallbackServices: [
      { title: 'Conseil pharmaceutique', description: 'Explications sur les doses et les interactions avant utilisation.' },
      { title: 'Tension & glycémie', description: 'Mesure rapide à la pharmacie, sans rendez-vous.' },
      { title: 'Préparation d’ordonnance', description: 'Nous préparons votre ordonnance et vérifions la disponibilité avant votre arrivée.' },
      { title: 'Livraison à domicile', description: 'Votre commande chez vous en 60 minutes.' },
    ],
    rxEyebrow: 'Ordonnance',
    rxTitle: 'Envoyez votre ordonnance avant de venir',
    rxLead: 'Photographiez votre ordonnance et envoyez-la sur WhatsApp : nous vérifions la disponibilité et préparons votre commande.',
    rxStep1: 'Photographiez l’ordonnance', rxStep1d: 'Vérifiez que le nom et le dosage sont lisibles.',
    rxStep2: 'Envoyez-la sur WhatsApp', rxStep2d: 'Joignez la photo et votre numéro de téléphone.',
    rxStep3: 'Récupérez votre commande', rxStep3d: 'Nous confirmons la disponibilité et le prix, puis préparons l’ordonnance.',
    rxCta: 'Envoyer l’ordonnance',
    rxNote: 'Les ordonnances sont délivrées après vérification par un pharmacien agréé.',
    rxMessage: 'J’ai une ordonnance à vous envoyer',
    teamEyebrow: 'Équipe de la pharmacie',
    teamTitle: 'Des pharmaciens de confiance',
    teamLead: 'Une équipe qui connaît ses produits et vous explique le bon usage et la posologie.',
    teamExperience: 'ans d’expérience',
    aboutTitle: 'Votre pharmacie de proximité',
    aboutLead: 'Nous croyons que le pharmacien est un partenaire de votre santé : chaque visite mérite le temps nécessaire pour expliquer et suivre.',
    feat1: 'Produits authentiques', feat1d: 'Sources fiables et stockage conforme aux normes.',
    feat2: 'Prix clairs', feat2d: 'Le prix est affiché avant la commande, sans surprise.',
    feat3: 'Conseil gratuit', feat3d: 'Des conseils pharmaceutiques par un professionnel agréé.',
    feat4: 'Livraison rapide', feat4d: 'En 60 minutes en ville.',
    stats: [['+12', 'ans d’expérience'], ['+18k', 'clients'], ['60 min', 'livraison'], ['4.9/5', 'satisfaction']],
    quotes: [
      { text: 'J’ai envoyé l’ordonnance de ma mère sur WhatsApp : elle était prête avant notre arrivée, un vrai gain de temps.', name: 'Amina C.', role: 'Cliente' },
      { text: 'L’équipe explique patiemment les doses et les interactions, avec des prix clairs et sans surprise.', name: 'Yacine B.', role: 'Client' },
      { text: 'J’ai commandé des vitamines et reçu ma commande en moins d’une heure, produits authentiques et bien emballés.', name: 'Lina M.', role: 'Cliente' },
    ],
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Faut-il une ordonnance pour acheter un médicament ?', 'Les médicaments sur ordonnance exigent une ordonnance valide ; les compléments et soins n’en ont pas besoin.'],
      ['Comment commander un produit ?', 'Envoyez le nom du produit sur WhatsApp ou passez à la pharmacie, nous préparons votre commande.'],
      ['La livraison est-elle disponible ?', 'Oui, en ville en 60 minutes, avec des frais selon la distance.'],
      ['Quels sont les horaires ?', 'Nous ouvrons tous les jours de 08:00 à 21:00, week-end compris.'],
      ['Le paiement se fait à la livraison ?', 'Oui, en espèces à la livraison ou directement à la pharmacie.'],
    ],
  },
  en: {
    heroBadge: 'Licensed pharmacy · Free advice',
    orderCta: 'Order on WhatsApp',
    browseCta: 'Browse products',
    openDaily: 'Open every day',
    deliveryFast: 'Fast delivery',
    deliveryNote: 'within 60 minutes in town',
    genuine: '100% genuine products',
    cash: 'Cash on delivery',
    heroMessage: 'I would like advice or to order a product',
    categoriesEyebrow: 'Pharmacy departments',
    categoriesTitle: 'Everything you need under one roof',
    categoriesLead: 'From vitamins to skin care and mother-and-baby essentials, find your department quickly.',
    categories: [
      { icon: 'pill', title: 'Vitamins & supplements', description: 'Support immunity, bones and energy with genuine products.' },
      { icon: 'droplet', title: 'Skin care', description: 'Medical creams and cleansers for every skin type.' },
      { icon: 'baby', title: 'Mother & baby', description: 'Milk, diapers and everyday care essentials.' },
      { icon: 'thermometer', title: 'Medical devices', description: 'Thermometers, blood pressure and glucose monitors.' },
      { icon: 'shield', title: 'Protection & hygiene', description: 'Masks, sanitisers and hygiene products.' },
      { icon: 'clipboard', title: 'Prescriptions', description: 'Send your prescription and we prepare it before you arrive.' },
    ],
    productsEyebrow: 'Most requested',
    productsTitle: 'Products chosen with care',
    productsLead: 'Clear prices and genuine products, ordered directly on WhatsApp.',
    orderPrefix: 'I would like to order',
    orderProduct: 'Order',
    servicesEyebrow: 'Pharmacy services',
    servicesTitle: 'Care beyond the medicine',
    servicesLead: 'A qualified team for advice, measurements and follow-up inside the pharmacy.',
    fallbackServices: [
      { title: 'Medication advice', description: 'Clear guidance on doses and drug interactions before use.' },
      { title: 'Blood pressure & sugar', description: 'A quick in-pharmacy check with no appointment.' },
      { title: 'Prescription preparation', description: 'We prepare your prescription and check availability before you arrive.' },
      { title: 'Home delivery', description: 'Your order at your door within 60 minutes.' },
    ],
    rxEyebrow: 'Prescription',
    rxTitle: 'Send your prescription before you arrive',
    rxLead: 'Photograph your prescription and send it on WhatsApp: we check availability and prepare your order.',
    rxStep1: 'Photograph the prescription', rxStep1d: 'Make sure the medicine name and dose are readable.',
    rxStep2: 'Send it on WhatsApp', rxStep2d: 'Attach the photo and your phone number.',
    rxStep3: 'Collect your order', rxStep3d: 'We confirm availability and price, then prepare the prescription.',
    rxCta: 'Send the prescription',
    rxNote: 'Prescriptions are dispensed after verification by a licensed pharmacist.',
    rxMessage: 'I have a prescription to send you',
    teamEyebrow: 'Pharmacy team',
    teamTitle: 'Pharmacists you can trust',
    teamLead: 'A team that knows its products and explains how to use them and the right dose.',
    teamExperience: 'years of experience',
    aboutTitle: 'Your neighbourhood pharmacy',
    aboutLead: 'We believe the pharmacist is a partner in your health, so every visit gets the time it needs for clear advice and follow-up.',
    feat1: 'Genuine products', feat1d: 'Trusted sources and storage that meets the standards.',
    feat2: 'Clear prices', feat2d: 'The price is shown before you order, with no surprises.',
    feat3: 'Free advice', feat3d: 'Medication guidance from a licensed pharmacist.',
    feat4: 'Fast delivery', feat4d: 'Within 60 minutes in town.',
    stats: [['+12', 'years of experience'], ['+18k', 'customers'], ['60 min', 'delivery'], ['4.9/5', 'customer rating']],
    quotes: [
      { text: 'I sent my mother’s prescription on WhatsApp and it was ready before we arrived, saving us a long wait.', name: 'Amina C.', role: 'Customer' },
      { text: 'The team patiently explains doses and interactions, with clear prices and no surprises.', name: 'Yacine B.', role: 'Customer' },
      { text: 'I ordered vitamins and received them in under an hour, genuine products and great packaging.', name: 'Lina M.', role: 'Customer' },
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Do I need a prescription to buy medicine?', 'Prescription medicines require a valid prescription; supplements and care products do not.'],
      ['How do I order a product?', 'Send the product name on WhatsApp or visit the pharmacy, and we prepare your order.'],
      ['Is delivery available?', 'Yes, in town within 60 minutes, with a fee based on distance.'],
      ['What are your opening hours?', 'We are open every day from 08:00 to 21:00, including weekends.'],
      ['Can I pay on delivery?', 'Yes, cash on delivery or directly at the pharmacy.'],
    ],
  },
};

function pharmacyProductCard(config: RenderConfig, p: RenderProduct, copy: PharmacyCopy, lang: Lang): string {
  const image = p.imageUrl
    ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="700" height="700">`
    : productPlaceholder(p.name);
  const message = `${copy.orderPrefix}: ${p.name} — ${money(p.price, lang)}`;
  return `<article class="product-card pharm-product" data-reveal data-product-card data-category="${attr(p.category || '')}" data-name="${attr(p.name)}" data-desc="${attr(p.description || '')}">
    <div class="product-thumb">${image}</div>
    <div class="product-body">
      ${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      <div class="price-row">
        <span class="price">${money(p.price, lang)}</span>
        <a class="pharm-order" href="${attr(waHref(config, message))}" target="_blank" rel="noopener" aria-label="${attr(`${copy.orderProduct} — ${p.name}`)}">${icon('whatsapp')}<span>${esc(copy.orderProduct)}</span></a>
      </div>
    </div>
  </article>`;
}

function pharmacistCard(member: RenderTeamMember, copy: PharmacyCopy): string {
  const photo = member.photoUrl
    ? `<img src="${attr(member.photoUrl)}" alt="${attr(member.name)}" loading="lazy" decoding="async" width="700" height="700">`
    : `<span class="pharm-initials">${esc(initialsFor(member.name))}</span>`;
  return `<article class="pharm-team-card" data-reveal>
    <div class="pharm-avatar">${photo}</div>
    <h3>${esc(member.name)}</h3>
    <p class="pharm-role">${esc(member.role)}</p>
    ${member.specialty ? `<span class="pharm-specialty">${esc(member.specialty)}</span>` : ''}
    ${member.experience ? `<span class="pharm-exp">${icon('award')}${esc(member.experience)} ${esc(copy.teamExperience)}</span>` : ''}
  </article>`;
}

export function pharmacyPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = PHARMACY[lang];
  const products = config.products.filter((p) => p.name);
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
  const team = config.team || [];
  const services = config.services.length ? config.services : copy.fallbackServices;
  const serviceIcons = ['stethoscope', 'heart', 'clipboard', 'droplet', 'truck', 'baby'];
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const secondPhoto = config.gallery && config.gallery[1] ? config.gallery[1] : null;
  const heroWa = waHref(config, `${copy.heroMessage} — ${config.siteName}`);
  const rxWa = waHref(config, `${copy.rxMessage} — ${config.siteName}`);

  return `<section class="hero pharmacy-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('cross')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-wa" href="${attr(heroWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(copy.orderCta)}</a>
          <a class="btn btn-light" href="#products">${icon('pill')}${esc(copy.browseCta)}</a>
        </div>
        <div class="pharm-badges">
          <span>${icon('truck')}${esc(copy.deliveryFast)}</span>
          <span>${icon('shield')}${esc(copy.genuine)}</span>
          <span>${icon('clock')}${esc(copy.openDaily)} · ${esc(config.hours || '08:00 — 21:00')}</span>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media pharm-hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <span class="pharm-pulse" aria-hidden="true">${icon('cross')}</span>
        <div class="float-card"><span class="float-icon">${icon('truck')}</span><div><strong>${esc(copy.deliveryFast)}</strong><span>${esc(copy.deliveryNote)}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('truck')}${esc(copy.deliveryFast)}</span>
    <span class="trust-item">${icon('shield')}${esc(copy.genuine)}</span>
    <span class="trust-item">${icon('stethoscope')}${esc(copy.feat3)}</span>
    <span class="trust-item">${icon('check')}${esc(copy.cash)}</span>
  </div></div>

  <section class="section" id="categories">
    <div class="container">
      ${sectionHead(copy.categoriesEyebrow, copy.categoriesTitle, copy.categoriesLead, true)}
      <div class="pharm-cat-grid">
        ${copy.categories.map((item) => `<article class="pharm-cat" data-reveal>
          <span class="pharm-cat-icon">${icon(item.icon as any)}</span>
          <div><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="products">
    <div class="container">
      ${sectionHead(copy.productsEyebrow, copy.productsTitle, copy.productsLead)}
      <div class="shop-toolbar">
        <button class="chip active" type="button" data-filter="all">${esc(s.all)}</button>
        ${categories.map((cat) => `<button class="chip" type="button" data-filter="${attr(cat)}">${esc(cat)}</button>`).join('')}
        <div class="search-box">${icon('search')}<input id="product-search" type="search" placeholder="${attr(s.search)}" aria-label="${attr(s.search)}"></div>
      </div>
      <div class="product-grid pharm-product-grid">
        ${products.length ? products.map((p) => pharmacyProductCard(config, p, copy, lang)).join('') : `<div class="product-empty">${esc(s.emptyCart)}</div>`}
        <div class="product-empty hide" id="product-empty">${esc(s.emptyCart)}</div>
      </div>
    </div>
  </section>

  <section class="section" id="services">
    <div class="container">
      ${sectionHead(copy.servicesEyebrow, copy.servicesTitle, copy.servicesLead)}
      <div class="pharm-service-grid">
        ${services.map((service, i) => `<article class="pharm-service" data-reveal>
          <span class="pharm-service-icon">${icon(serviceIcons[i % serviceIcons.length] as any)}</span>
          <h3>${esc(service.title)}</h3>
          <p>${esc(service.description)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="pharm-rx" id="prescription">
    <div class="container pharm-rx-inner">
      <div data-reveal>
        <span class="eyebrow">${esc(copy.rxEyebrow)}</span>
        <h2 class="h2 mt-2">${esc(copy.rxTitle)}</h2>
        <p class="lead mt-2">${esc(copy.rxLead)}</p>
        <div class="pharm-rx-steps">
          ${[
            [copy.rxStep1, copy.rxStep1d],
            [copy.rxStep2, copy.rxStep2d],
            [copy.rxStep3, copy.rxStep3d],
          ].map(([title, desc], i) => `<div class="pharm-rx-step">
            <span class="n">0${i + 1}</span>
            <div><strong>${esc(title)}</strong><p>${esc(desc)}</p></div>
          </div>`).join('')}
        </div>
        <a class="btn btn-wa" href="${attr(rxWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(copy.rxCta)}</a>
        <p class="pharm-rx-note">${esc(copy.rxNote)}</p>
      </div>
      <div class="pharm-rx-card" aria-hidden="true">
        <div class="rx-head"><span class="rx-cross">${icon('cross')}</span><div><strong>${esc(config.siteName)}</strong><span>Rx</span></div></div>
        <div class="rx-line w80"></div>
        <div class="rx-line w60"></div>
        <div class="rx-line w90"></div>
        <div class="rx-grid"><span></span><span></span><span></span><span></span></div>
        <div class="rx-stamp">${icon('check')}<span>${esc(copy.rxEyebrow)}</span></div>
      </div>
    </div>
  </section>

  ${team.length ? `<section class="section bg-soft" id="team">
    <div class="container">
      ${sectionHead(copy.teamEyebrow, copy.teamTitle, copy.teamLead, true)}
      <div class="pharm-team-grid">${team.map((m) => pharmacistCard(m, copy)).join('')}</div>
    </div>
  </section>` : ''}

  <section class="section" id="about">
    <div class="container about-grid pharm-about-grid">
      <div class="pharm-about-media" data-reveal>
        ${about ? `<img class="main" src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="760">` : ''}
        ${secondPhoto ? `<img class="small" src="${attr(secondPhoto)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="420" height="420">` : ''}
        <div class="about-badge">${icon('award')}${esc(copy.stats[0][0])} ${esc(copy.stats[0][1])}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(copy.aboutTitle)}</h2>
        <p class="lead mt-2">${esc(copy.aboutLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)} — ${esc(copy.feat1d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)} — ${esc(copy.feat2d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)} — ${esc(copy.feat3d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat4)} — ${esc(copy.feat4d)}</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section-sm bg-soft">
    <div class="container pharm-info-grid">
      <div class="pharm-info" data-reveal>
        <span class="pharm-info-icon">${icon('clock')}</span>
        <div><strong>${esc(s.hours)}</strong><span>${esc(config.hours || '08:00 — 21:00')}</span></div>
      </div>
      <div class="pharm-info" data-reveal>
        <span class="pharm-info-icon">${icon('truck')}</span>
        <div><strong>${esc(copy.deliveryFast)}</strong><span>${esc(copy.deliveryNote)}</span></div>
      </div>
      <a class="pharm-info" href="${attr(mapsHref(config))}" target="_blank" rel="noopener" data-reveal>
        <span class="pharm-info-icon">${icon('map')}</span>
        <div><strong>${esc(s.location)}</strong><span>${esc(config.address || config.city || '')}</span></div>
      </a>
      <a class="pharm-info" href="tel:${attr(config.phone)}" data-reveal>
        <span class="pharm-info-icon">${icon('phone')}</span>
        <div><strong>${esc(s.callNow)}</strong><span dir="ltr">${esc(config.phone)}</span></div>
      </a>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.faqTitle, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * LAWYER
 * ---------------------------------------------------------------------- */
interface LawyerCopy {
  heroBadge: string;
  consultCta: string;
  practiceCta: string;
  openDaily: string;
  confidential: string;
  experience: string;
  heroMessage: string;
  areasEyebrow: string;
  areasTitle: string;
  areasLead: string;
  areas: Array<{ icon: string; title: string; description: string }>;
  servicesEyebrow: string;
  servicesTitle: string;
  servicesLead: string;
  fallbackServices: Array<{ title: string; description: string; price: string }>;
  processTitle: string;
  processLead: string;
  step1: string; step1d: string;
  step2: string; step2d: string;
  step3: string; step3d: string;
  step4: string; step4d: string;
  teamEyebrow: string;
  teamTitle: string;
  teamLead: string;
  aboutTitle: string;
  aboutLead: string;
  feat1: string; feat1d: string;
  feat2: string; feat2d: string;
  feat3: string; feat3d: string;
  feat4: string; feat4d: string;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
  faqTitle: string;
  faq: Array<[string, string]>;
  consultTitle: string;
  consultLead: string;
  formTitle: string;
  formSub: string;
  confirm: string;
  summaryCase: string;
  summaryService: string;
  summaryWhen: string;
  note: string;
}

const LAWYER: Record<Lang, LawyerCopy> = {
  ar: {
    heroBadge: 'مكتب محاماة مرخص · استشارة قانونية',
    consultCta: 'اطلب استشارة',
    practiceCta: 'تخصصات المكتب',
    openDaily: 'مفتوح يومياً',
    confidential: 'سرية تامة',
    experience: 'سنوات الخبرة',
    heroMessage: 'أريد استشارة قانونية أو رفع دعوى',
    areasEyebrow: 'تخصصات قانونية',
    areasTitle: 'نقدّمك أمام القضاء بأمانة وكفاءة',
    areasLead: 'من القضايا المدنية والتجارية إلى العقارية والأسرية، نُدير ملفّك من الاستشارة حتى الحكم.',
    areas: [
      { icon: 'shield', title: 'القضايا المدنية', description: 'المرافعة في الدعاوى المدنية والتعويضات والعلاقات القانونية الخاصة.' },
      { icon: 'briefcase', title: 'القانون التجاري', description: 'تأسيس الشركات، صياغة العقود، والنزاعات التجارية بين التجار والشركات.' },
      { icon: 'target', title: 'القضايا العقارية', description: 'عقود البيع والإيجار، التسجيل العقاري، والنزاعات على الملكية.' },
      { icon: 'users', title: 'الأحوال الشخصية', description: 'القضايا الأسرية، الطلاق، النفقة، الحضانة، والمواريث.' },
    ],
    servicesEyebrow: 'خدمات وأتعاب المكتب',
    servicesTitle: 'خدماتنا وأسعارها التقديرية',
    servicesLead: 'أسعار واضحة تُعرض قبل بدء أي إجراء، مع إمكانية الدفع بالتقسيط حسب طبيعة القضية.',
    fallbackServices: [
      { title: 'استشارة قانونية أولية', description: 'جلسة تقييم للملف وتوضيح المسار القانوني.', price: '3,000 دج' },
      { title: 'صياغة ومراجعة عقود', description: 'عقود البيع، الإيجار، الشراكة، وعقد قانوني آمن.', price: '8,000 دج' },
      { title: 'تأسيس شركة', description: 'إجراءات التأسيس والتسجيل التجاري والضريبي.', price: '25,000 دج' },
      { title: 'متابعة قضية مدنية', description: 'التمثيل أمام المحاكم حتى صدور حكم قطعي.', price: '40,000 دج' },
      { title: 'تسوية نزاع تجاري', description: 'وساطة وصياغة اتفاقية تسوية بين الأطراف.', price: '30,000 دج' },
    ],
    processTitle: 'كيف نتعامل مع قضيتك',
    processLead: 'نتابع ملفّك خطوة بخطوة مع إطلاعك على كل مستجد أولاً بأول.',
    step1: 'الاستماع للقضية', step1d: 'نستمع لرواية موكِّلنا ونحدّد النقاط القانونية الأساسية.',
    step2: 'دراسة الملف', step2d: 'نحلل المستندات والأحكام المماثلة ونضع استراتيجية الدعوة.',
    step3: 'المتابعة والإجراءات', step3d: 'نُعدّ المذكرات ونُتابِع الجلسات والإجراءات.',
    step4: 'الحكم والتنفيذ', step4d: 'نستقبل الحكم ونُتابِع تنفيذه حتى استرداد حقك بالكامل.',
    teamEyebrow: 'فريق المحاماة',
    teamTitle: 'محامون يدافعون عن حقوقك',
    teamLead: 'فريق يتمتع بخبرة واسعة في التقاضي والاستشارات القانونية، يعمل بسرية تامة.',
    aboutTitle: 'مكتب المحامي سمير قاسم',
    aboutLead: 'مكتب محاماة مرخص يقدّم الاستشارات القانونية والمرافعة أمام المحاكم بسرية تامة وشفافية كاملة، مع مرافقة العميل من الاستشارة الأولى حتى تنفيذ الحكم.',
    feat1: 'استشارات قانونية', feat1d: 'رأي قانوني مكتوب في مختلف التخصصات.',
    feat2: 'مرافعة أمام المحاكم', feat2d: 'تمثيل العملاء أمام جميع المحاكم والجهات القضائية.',
    feat3: 'سرية تامة', feat3d: 'جميع معلومات العملاء محمية ومحمية بموجب سرية المهنة.',
    feat4: 'مرافقة مستمرة', feat4d: 'متابعة القضية خطوة بخطوة حتى الإنجاز.',
    stats: [['+12', 'سنة خبرة'], ['+400', 'قضية'], ['98%', 'رضا العملاء'], ['24/7', 'تواصل قانوني']],
    quotes: [
      { text: 'المحامي سمير قاسم دافع عني في قضية تعويض وخرجت بحقي كاملاً، أنصح به بقوة.', name: 'فاطمة ز.', role: 'موكِّلة' },
      { text: 'محامي محترف، شرح لي الإجراءات ببساطة ووقف بجانبي حتى النهاية.', name: 'يوسف م.', role: 'موكِّل' },
      { text: 'صياغة عقد شراكة محكم، وشكراً على الشفافية في الأتعاب والمواعيد.', name: 'ليلى ب.', role: 'رائدة أعمال' },
    ],
    faqTitle: 'أسئلة شائعة',
    faq: [
      ['هل أحتاج محامياً لكل قضية؟', 'القضايا البسيطة قد تُحل بالاستشارة، بينما القضايا المعقدة تحتاج مرافعة أمام المحكمة.'],
      ['كيف أحسب الأتعاب؟', 'تُحدّد الأتعاب حسب نوع القضية والتعقيد والوقت المستغرق، وتُعرض قبل اتخاذ الإجراء.'],
      ['هل المعلومات سرية؟', 'نعم، جميع معلومات العميل محمية بموجب سرية المهنة ولا تُكشف لأي طرف ثالث.'],
      ['ما هي أوقات العمل؟', 'نعمل من الأحد إلى الخميس من 09:00 إلى 17:00، ويمكن حجز استشارة عبر واتساب.'],
      ['هل تُرفق الشركات والمؤسسات؟', 'نعم، نُؤسّس الشركات ونُعدّ عقودها ونُتابع نزاعاتها التجارية.'],
    ],
    consultTitle: 'احجز استشارتك القانونية',
    consultLead: 'املأ النموذج وسنتصل بك لتحديد موعد الاستشارة وتوضيح التكلفة التقديرية.',
    formTitle: 'طلب استشارة قانونية',
    formSub: 'أخبرنا عن قضيتك وسنرد عليك في أقرب وقت.',
    confirm: 'إرسال طلب الاستشارة',
    summaryCase: 'نوع القضية',
    summaryService: 'الخدمة المطلوبة',
    summaryWhen: 'الموعد المفضل',
    note: 'جميع البيانات محمية بموجب سرية مهنة المحاماة.',
  },
  fr: {
    heroBadge: 'Cabinet d’avocat agréé · Conseil juridique',
    consultCta: 'Demander une consultation',
    practiceCta: 'Domaines d’intervention',
    openDaily: 'Ouvert tous les jours',
    confidential: 'Confidentialité totale',
    experience: 'ans d’expérience',
    heroMessage: 'Je souhaite un conseil juridique ou intenter un procès',
    areasEyebrow: 'Domaines juridiques',
    areasTitle: 'Nous vous représentons devant la justice avec honnêteté et compétence',
    areasLead: 'Des affaires civiles et commerciales aux affaires immobilières et familiales, nous gérons votre dossier de la consultation jusqu’au jugement.',
    areas: [
      { icon: 'shield', title: 'Droit civil', description: 'Plaidoirie dans les litiges civils, indemnités et relations juridiques privées.' },
      { icon: 'briefcase', title: 'Droit commercial', description: 'Création de sociétés, rédaction de contrats et litiges commerciaux.' },
      { icon: 'target', title: 'Droit immobilier', description: 'Contrats de vente et de location, enregistrement immobilier et litiges de propriété.' },
      { icon: 'users', title: 'Droit de la famille', description: 'Affaires familiales, divorce, pension alimentaire, garde d’enfants et successions.' },
    ],
    servicesEyebrow: 'Services et honoraires du cabinet',
    servicesTitle: 'Nos services et leurs tarifs indicatifs',
    servicesLead: 'Des tarifs transparents affichés avant toute procédure, avec possibilité de paiement échelonné selon la nature de l’affaire.',
    fallbackServices: [
      { title: 'Consultation juridique initiale', description: 'Évaluation du dossier et explication de la voie juridique.', price: '3 000 DA' },
      { title: 'Rédaction et révision de contrats', description: 'Contrats de vente, bail, partenariat et acte juridique sécurisé.', price: '8 000 DA' },
      { title: 'Création de société', description: 'Procédures de création et d’immatriculation commerciale et fiscale.', price: '25 000 DA' },
      { title: 'Suivi d’affaire civile', description: 'Représentation devant les tribunaux jusqu’à un jugement définitif.', price: '40 000 DA' },
      { title: 'Règlement d’un litige commercial', description: 'Médiation et rédaction d’accord transactionnel.', price: '30 000 DA' },
    ],
    processTitle: 'Comment nous traitons votre dossier',
    processLead: 'Nous suivons votre dossier étape par étape et vous tenons informé de chaque avancée.',
    step1: 'Écoute de l’affaire', step1d: 'Nous écoutons le récit de notre client et identifions les points juridiques clés.',
    step2: 'Étude du dossier', step2d: 'Nous analysons les pièces et la jurisprudence et élaborons la stratégie.',
    step3: 'Suivi et procédures', step3d: 'Nous rédigeons les mémoires et suivons les audiences et le calendrier procédural.',
    step4: 'Jugement et exécution', step4d: 'Nous recevons le jugement et suivons son exécution jusqu’à recouvrement intégral.',
    teamEyebrow: 'Équipe juridique',
    teamTitle: 'Des avocats qui défendent vos droits',
    teamLead: 'Une équipe expérimentée en contentieux et conseils juridiques, travaillant dans une confidentialité totale.',
    aboutTitle: 'Cabinet de l’avocat Samir Qassem',
    aboutLead: 'Un cabinet d’avocat agréé offrant conseils juridiques et plaidoirie devant les tribunaux avec une confidentialité totale et une transparence complète, accompagnant le client de la première consultation jusqu’à l’exécution du jugement.',
    feat1: 'Conseils juridiques', feat1d: 'Avis juridique écrit dans diverses spécialités.',
    feat2: 'Plaidoirie devant les tribunaux', feat2d: 'Représentation des clients devant tous les tribunaux et instances judiciaires.',
    feat3: 'Confidentialité totale', feat3d: 'Toutes les informations des clients sont protégées par le secret professionnel.',
    feat4: 'Accompagnement continu', feat4d: 'Suivi de l’affaire étape par étape jusqu’à son issue.',
    stats: [['+12', 'ans d’expérience'], ['+400', 'affaires'], ['98%', 'satisfaction client'], ['24/7', 'disponibilité juridique']],
    quotes: [
      { text: "L’avocat Samir Qassem m’a défendue dans une affaire d’indemnisation et j’ai obtenu mon dû entièrement, je le recommande vivement.", name: 'Fatima Z.', role: 'Cliente' },
      { text: 'Un avocat professionnel, m’a expliqué la procédure simplement et m’a soutenu jusqu’au bout.', name: 'Youssef M.', role: 'Client' },
      { text: 'Un contrat de partenariat bien rédigé, merci pour la transparence des honoraires et des délais.', name: 'Layla B.', role: 'Cheffe d’entreprise' },
    ],
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Ai-je besoin d’un avocat pour chaque affaire ?', 'Les affaires simples peuvent se résoudre par une consultation, tandis que les affaires complexes requièrent une plaidoirie devant le tribunal.'],
      ['Comment calculez-vous les honoraires ?', 'Les honoraires sont fixés selon le type d’affaire, sa complexité et le temps passé, et sont communiqués avant toute procédure.'],
      ['Les informations sont-elles confidentielles ?', 'Oui, toutes les informations des clients sont protégées par le secret professionnel et ne sont divulguées à aucun tiers.'],
      ['Quels sont vos horaires ?', 'Nous travaillons du dimanche au jeudi de 09:00 à 17:00, et une consultation peut être prise sur WhatsApp.'],
      ['Accompagnez-vous les entreprises et les institutions ?', 'Oui, nous créons des sociétés, rédigeons leurs contrats et suivons leurs litiges commerciaux.'],
    ],
    consultTitle: 'Réservez votre consultation juridique',
    consultLead: 'Remplissez le formulaire et nous vous contacterons pour fixer un rendez-vous et préciser le coût estimatif.',
    formTitle: 'Demande de consultation juridique',
    formSub: 'Dites-nous en plus sur votre affaire et nous vous répondrons dans les plus brefs délais.',
    confirm: 'Envoyer la demande de consultation',
    summaryCase: 'Type d’affaire',
    summaryService: 'Service demandé',
    summaryWhen: 'Rendez-vous préféré',
    note: 'Toutes les données sont protégées par le secret professionnel de l’avocat.',
  },
  en: {
    heroBadge: 'Licensed law firm · Legal consultation',
    consultCta: 'Request consultation',
    practiceCta: 'Practice areas',
    openDaily: 'Open every day',
    confidential: 'Full confidentiality',
    experience: 'years of experience',
    heroMessage: 'I need legal advice or to file a case',
    areasEyebrow: 'Practice areas',
    areasTitle: 'We represent you before justice with integrity and competence',
    areasLead: 'From civil and commercial cases to real estate and family matters, we manage your file from consultation to judgment.',
    areas: [
      { icon: 'shield', title: 'Civil law', description: 'Pleadings in civil disputes, compensation and private legal relations.' },
      { icon: 'briefcase', title: 'Commercial law', description: 'Company formation, contract drafting and commercial disputes.' },
      { icon: 'target', title: 'Real estate law', description: 'Sale and lease contracts, property registration and ownership disputes.' },
      { icon: 'users', title: 'Family law', description: 'Family matters, divorce, alimony, child custody and inheritance.' },
    ],
    servicesEyebrow: 'Services and fees',
    servicesTitle: 'Our services and estimated rates',
    servicesLead: 'Transparent rates shown before any procedure, with installment payment options depending on the case nature.',
    fallbackServices: [
      { title: 'Initial legal consultation', description: 'Case assessment and explanation of the legal path.', price: '3,000 DZD' },
      { title: 'Contract drafting and review', description: 'Sale, lease, partnership and secure legal deeds.', price: '8,000 DZD' },
      { title: 'Company formation', description: 'Incorporation and commercial and tax registration procedures.', price: '25,000 DZD' },
      { title: 'Civil case follow-up', description: 'Representation before courts until a final judgment.', price: '40,000 DZD' },
      { title: 'Commercial dispute settlement', description: 'Mediation and drafting of settlement agreements.', price: '30,000 DZD' },
    ],
    processTitle: 'How we handle your case',
    processLead: 'We follow your case step by step and keep you informed of every update.',
    step1: 'Listening to the case', step1d: 'We listen to our client’s account and identify the key legal points.',
    step2: 'Case study', step2d: 'We analyze documents and case law and develop the strategy.',
    step3: 'Follow-up and procedures', step3d: 'We draft pleadings and follow hearings and the procedural calendar.',
    step4: 'Judgment and execution', step4d: 'We receive the judgment and follow its execution until full recovery.',
    teamEyebrow: 'Legal team',
    teamTitle: 'Lawyers who defend your rights',
    teamLead: 'An experienced team in litigation and legal advice, working with full confidentiality.',
    aboutTitle: 'Law Office of Samir Qassem',
    aboutLead: 'A licensed law office providing legal consultation and court representation with full confidentiality and complete transparency, accompanying the client from the first consultation until execution of the judgment.',
    feat1: 'Legal consultation', feat1d: 'Written legal opinion in various specialties.',
    feat2: 'Court representation', feat2d: 'Representing clients before all courts and judicial bodies.',
    feat3: 'Full confidentiality', feat3d: 'All client information is protected under attorney-client privilege.',
    feat4: 'Ongoing support', feat4d: 'Case follow-up step by step until resolution.',
    stats: [['+12', 'years of experience'], ['+400', 'cases'], ['98%', 'client satisfaction'], ['24/7', 'legal availability']],
    quotes: [
      { text: 'Lawyer Samir Qassem defended me in a compensation case and I received my full due, I highly recommend him.', name: 'Fatima Z.', role: 'Client' },
      { text: 'A professional lawyer who explained the procedure simply and stood by me until the end.', name: 'Youssef M.', role: 'Client' },
      { text: 'A well-drafted partnership contract, thank you for the transparency of fees and deadlines.', name: 'Layla B.', role: 'Business owner' },
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Do I need a lawyer for every case?', 'Simple cases may be resolved through consultation, while complex ones require court representation.'],
      ['How are fees calculated?', 'Fees are set based on case type, complexity and time spent, and disclosed before any procedure.'],
      ['Is information confidential?', 'Yes, all client information is protected under attorney-client privilege and not disclosed to any third party.'],
      ['What are your hours?', 'We work Sunday to Thursday from 09:00 to 17:00, and consultations can be booked on WhatsApp.'],
      ['Do you serve companies and institutions?', 'Yes, we incorporate companies, draft their contracts and follow their commercial disputes.'],
    ],
    consultTitle: 'Book your legal consultation',
    consultLead: 'Fill out the form and we will contact you to schedule a consultation and clarify the estimated cost.',
    formTitle: 'Legal consultation request',
    formSub: 'Tell us about your case and we will respond as soon as possible.',
    confirm: 'Send consultation request',
    summaryCase: 'Case type',
    summaryService: 'Service requested',
    summaryWhen: 'Preferred appointment',
    note: 'All data is protected under attorney-client privilege.',
  },
};

function lawyerCard(member: RenderTeamMember, copy: LawyerCopy): string {
  const photo = member.photoUrl
    ? `<img src="${attr(member.photoUrl)}" alt="${attr(member.name)}" loading="lazy" decoding="async" width="700" height="700">`
    : `<span class="lawyer-initials">${esc(initialsFor(member.name))}</span>`;
  return `<article class="lawyer-card" data-reveal>
    <div class="lawyer-avatar">${photo}</div>
    <h3>${esc(member.name)}</h3>
    <p class="lawyer-role">${esc(member.role)}</p>
    ${member.specialty ? `<span class="lawyer-specialty">${esc(member.specialty)}</span>` : ''}
    ${member.experience ? `<span class="lawyer-exp">${icon('award')}${esc(member.experience)} ${esc(copy.experience)}</span>` : ''}
  </article>`;
}

export function lawyerPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = LAWYER[lang];
  const services = config.services.length ? config.services : copy.fallbackServices.map(({ title, description, price }) => ({ title, description }));
  const team = config.team || [];
  const areaIcons = ['shield', 'briefcase', 'target', 'users'];
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const heroWa = waHref(config, `${copy.heroMessage} — ${config.siteName}`);
  const consultWa = waHref(config, `استشارة قانونية — ${config.siteName}`);

  return `<section class="hero lawyer-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('shield')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-wa" href="${attr(heroWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(copy.consultCta)}</a>
          <a class="btn btn-light" href="#areas">${icon('briefcase')}${esc(copy.practiceCta)}</a>
        </div>
        <div class="lawyer-badges">
          <span>${icon('shield')}${esc(copy.confidential)}</span>
          <span>${icon('clock')}${esc(copy.openDaily)} · ${esc(config.hours || '09:00 — 17:00')}</span>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media lawyer-hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('shield')}</span><div><strong>${esc(copy.confidential)}</strong><span>${esc(config.city || '')}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('shield')}${esc(copy.confidential)}</span>
    <span class="trust-item">${icon('clock')}${esc(copy.openDaily)}</span>
    <span class="trust-item">${icon('award')}${esc(copy.experience)}</span>
    <span class="trust-item">${icon('target')}${esc(s.satisfaction)}</span>
  </div></div>

  <section class="section" id="areas">
    <div class="container">
      ${sectionHead(copy.areasEyebrow, copy.areasTitle, copy.areasLead, true)}
      <div class="areas-grid">
        ${copy.areas.map((item, i) => `<article class="area-card" data-reveal>
          <span class="area-icon">${icon(item.icon as any)}</span>
          <h3 class="h3">${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="services">
    <div class="container">
      ${sectionHead(copy.servicesEyebrow, copy.servicesTitle, copy.servicesLead)}
      <div class="lawyer-service-grid">
        ${services.map((service, i) => `<article class="lawyer-service" data-reveal>
          <span class="service-num">${String(i + 1).padStart(2, '0')}</span>
          <div><h3 class="h3">${esc(service.title)}</h3><p>${esc(service.description)}</p></div>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="process">
    <div class="container">
      ${sectionHead(copy.processTitle, copy.processLead, undefined, true)}
      <div class="steps">
        ${[
          [copy.step1, copy.step1d],
          [copy.step2, copy.step2d],
          [copy.step3, copy.step3d],
          [copy.step4, copy.step4d],
        ].map(([title, desc], i) => `<div class="step" data-reveal><div class="n">${i + 1}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`).join('')}
      </div>
    </div>
  </section>

  ${team.length ? `<section class="section bg-soft" id="team">
    <div class="container">
      ${sectionHead(copy.teamEyebrow, copy.teamTitle, copy.teamLead, true)}
      <div class="lawyer-team-grid">${team.map((m) => lawyerCard(m, copy)).join('')}</div>
    </div>
  </section>` : ''}

  <section class="section" id="about">
    <div class="container about-grid lawyer-about-grid">
      <div class="lawyer-about-media" data-reveal>
        ${about ? `<img class="main" src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="760">` : ''}
        <div class="about-badge">${icon('award')}${esc(copy.stats[0][0])} ${esc(copy.stats[0][1])}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(config.siteName)}</h2>
        <p class="lead mt-2">${esc(config.description)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)} — ${esc(copy.feat1d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)} — ${esc(copy.feat2d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)} — ${esc(copy.feat3d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat4)} — ${esc(copy.feat4d)}</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="consult">
    <div class="container consult-wrap">
      <div class="consult-copy" data-reveal>
        <span class="eyebrow">${esc(s.appointment)}</span>
        <h2 class="h2 mt-2">${esc(copy.consultTitle)}</h2>
        <p class="lead mt-2">${esc(copy.consultLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.note)}</span></li>
        </ul>
        <div class="lawyer-hours">
          <div class="hours-row"><span>${icon('clock')}${esc(s.hours)}</span><strong>${esc(config.hours || '09:00 — 17:00')}</strong></div>
          <div class="hours-row"><span>${icon('map')}${esc(s.location)}</span><strong>${esc(config.address || config.city || '')}</strong></div>
        </div>
        <div class="lawyer-contact-actions">
          <a class="btn btn-light" href="tel:${attr(config.phone)}">${icon('phone')}${esc(s.callNow)}</a>
          <a class="btn btn-wa" href="${attr(consultWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
      </div>
      <form class="consult-card" data-lead-form data-lead-kind="consultation" novalidate>
        <h3>${esc(copy.formTitle)}</h3>
        <p class="booking-sub">${esc(copy.formSub)}</p>
        <div class="form-grid">
          <div class="field"><label for="con-name">${esc(s.name)}</label><input id="con-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="con-phone">${esc(s.phone)}</label><input id="con-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field full"><label for="con-email">${esc(s.email)}</label><input id="con-email" name="email" type="email" maxlength="120" autocomplete="email" dir="ltr"></div>
          <div class="field full"><label for="con-case">${esc(copy.summaryCase)}</label><input id="con-case" name="caseType" maxlength="200"></div>
          <div class="field full"><label for="con-msg">${esc(s.message)}</label><textarea id="con-msg" name="message" required maxlength="1200"></textarea><span class="err">${esc(s.required)}</span></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('send')}${esc(copy.confirm)}</button>
        <div class="form-status" role="status"></div>
        <p class="form-note center mt-2">${esc(copy.note)}</p>
      </form>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.faqTitle, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * REAL ESTATE
 * ---------------------------------------------------------------------- */
interface RealEstateCopy {
  heroBadge: string;
  viewingCta: string;
  propertiesCta: string;
  openDaily: string;
  verified: string;
  experience: string;
  heroMessage: string;
  typesEyebrow: string;
  typesTitle: string;
  typesLead: string;
  types: Array<{ icon: string; title: string; description: string }>;
  propertiesEyebrow: string;
  propertiesTitle: string;
  propertiesLead: string;
  servicesEyebrow: string;
  servicesTitle: string;
  servicesLead: string;
  fallbackServices: Array<{ title: string; description: string }>;
  processTitle: string;
  processLead: string;
  step1: string; step1d: string;
  step2: string; step2d: string;
  step3: string; step3d: string;
  step4: string; step4d: string;
  teamEyebrow: string;
  teamTitle: string;
  teamLead: string;
  aboutTitle: string;
  aboutLead: string;
  feat1: string; feat1d: string;
  feat2: string; feat2d: string;
  feat3: string; feat3d: string;
  feat4: string; feat4d: string;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
  faqTitle: string;
  faq: Array<[string, string]>;
  viewingTitle: string;
  viewingLead: string;
  formTitle: string;
  formSub: string;
  confirm: string;
  summaryType: string;
  summaryService: string;
  summaryWhen: string;
  note: string;
}

const REALESTATE: Record<Lang, RealEstateCopy> = {
  ar: {
    heroBadge: 'وكالة عقارية مرخصة · عقارات موثقة',
    viewingCta: 'اطلب معاينة',
    propertiesCta: 'عقاراتنا',
    openDaily: 'مفتوح يومياً',
    verified: 'عقارات موثقة',
    experience: 'سنوات الخبرة',
    heroMessage: 'أريد شراء أو استئجار عقار',
    typesEyebrow: 'أنواع العقارات',
    typesTitle: 'نجد لك العقار الذي يلبي تطلعاتك',
    typesLead: 'من الشقق والفيلات إلى المحلات التجارية والأراضي، نغطي جميع احتياجاتك السكنية والاستثمارية.',
    types: [
      { icon: 'home', title: 'شقق سكنية', description: 'شقق للملكية والإيجار بمساحات وتصاميم متنوعة.' },
      { icon: 'home', title: 'فلل وقصور', description: 'فلل فاخرة مع حدائق ومساحات خارجية خاصة.' },
      { icon: 'briefcase', title: 'محلات تجارية', description: 'واجهات محلات ومساحات تجارية في المناطق الحيوية.' },
      { icon: 'target', title: 'أراضٍ وبناء', description: 'أراضٍ قابلة للبناء مع وثائق ملكية كاملة.' },
    ],
    propertiesEyebrow: 'عقارات متاحة',
    propertiesTitle: 'مختارات من عقاراتنا',
    propertiesLead: 'عقارات مع ملفات موثقة وصور حقيقية، والأسعار واضحة قبل أي معاينة.',
    servicesEyebrow: 'خدمات الوكالة',
    servicesTitle: 'نقدّم لك مرافقة عقارية كاملة',
    servicesLead: 'من البحث عن العقار إلى توقيع العقد وتوثيقه، نكون بجانبك في كل خطوة.',
    fallbackServices: [
      { title: 'بيع وشراء العقارات', description: 'مرافقة كاملة في إجراءات البيع والشراء والتوثيق.' },
      { title: 'الإيجار', description: 'عقود إيجار سكنية وتجارية موثقة ومنظمة.' },
      { title: 'المرافقة القانونية', description: 'توثيق العقود ومرافقة الموثق خطوة بخطوة.' },
      { title: 'تقييم العقار', description: 'تقدير واقعي للسعر العقاري قبل العرض أو البيع.' },
    ],
    processTitle: 'كيف ننهي صفقتك العقارية',
    processLead: 'نتابع كل خطوة من البحث إلى التسليم النهائي مع الشفافية الكاملة.',
    step1: 'فهم احتياجاتك', step1d: 'نستمع لمتطلباتك وميزانيتك ونحدد مواصفات العقار المناسب.',
    step2: 'البحث والمعاينة', step2d: 'نعرض لك خيارات متوافقة وننظم زيارات ميدانية للعقارات المختارة.',
    step3: 'التفاوض والعقد', step3d: 'نعمل على التفاوض على السعر ونعيد صياغة العقد بمراجعة قانونية.',
    step4: 'التسليم والتوثيق', step4d: 'نرافقك حتى استلام العقار وتوثيق العقد رسمياً.',
    teamEyebrow: 'فريق الوكالة',
    teamTitle: 'وكلاء عقاريون في خدمتك',
    teamLead: 'فريق يمتلك معرفة عميقة بالسوق العقاري المحلي ويعمل بسرية تامة.',
    aboutTitle: 'وكالة الدار العقارية',
    aboutLead: 'وكالة عقارية مرخصة متخصصة في البيع والإيجار، بخيارات موثقة ومعاينات منظمة ومرافقة قانونية كاملة، من البحث عن العقار حتى تسليم المفاتيح.',
    feat1: 'عقارات موثقة', feat1d: 'جميع العقارات مدعومة بوثائق ملكية وصور حقيقية.',
    feat2: 'مرافقة قانونية', feat2d: 'توثيق العقود ومرافقة الموثق لضمان حقوق جميع الأطراف.',
    feat3: 'أسعار شفافة', feat3d: 'السعر معروض بوضوح قبل أي معاينة أو إجراء.',
    feat4: 'معاينات منظمة', feat4d: 'زيارات ميدانية مجدولة وموجهة من قبل وكلاء مختصين.',
    stats: [['+8', 'سنة خبرة'], ['+300', 'عقار'], ['98%', 'رضا العملاء'], ['24/7', 'تواصل عقاري']],
    quotes: [
      { text: 'وجدت شقتي المثالية عبر وكالة الدار، والمعاينة كانت منظمة والمحترفون في الموعد.', name: 'خالد ب.', role: 'مشتري' },
      { text: 'وكالة محترفة، ساعدوني في بيع فيلتي بسرعة وبسعر عادل، أنصح بهم.', name: 'أمينة ت.', role: 'بائعة' },
      { text: 'عقد إيجار تجاري واضح ومحمي قانونياً، شكراً على المرافقة الممتازة.', name: 'سليم ع.', role: 'تاجر' },
    ],
    faqTitle: 'أسئلة شائعة',
    faq: [
      ['هل العقارات موثقة؟', 'نعم، جميع العقارات معروضة مع ملفات موثقة ووثائق ملكية مكتملة.'],
      ['كيف أحجز معاينة؟', 'اطلب معاينة عبر النموذج أو واتساب وسنحدد موعداً معك في أقرب وقت.'],
      ['هل تشمل الخدمة التوثيق؟', 'نعم، نقدم مرافقة قانونية كاملة لتوثيق العقود أمام الموثق.'],
      ['ما هي أوقات العمل؟', 'نعمل من السبت إلى الخميس من 09:00 إلى 18:00.'],
      ['هل تتعاملون مع الإيجار التجاري؟', 'نعم، نقدم عقود إيجار تجارية موثقة ومساحات محلات في المناطق الحيوية.'],
    ],
    viewingTitle: 'احجز معاينة عقارية',
    viewingLead: 'املأ النموذج وسنتصل بك لتحديد موعد معاينة العقار الذي يثير اهتمامك.',
    formTitle: 'طلب معاينة عقارية',
    formSub: 'أخبرنا عن نوع العقار الذي تبحث عنه وسنرد عليك في أقرب وقت.',
    confirm: 'إرسال طلب المعاينة',
    summaryType: 'نوع العقار',
    summaryService: 'الخدمة المطلوبة',
    summaryWhen: 'الموعد المفضل',
    note: 'جميع بياناتك محمية وسرية وفقاً لسياسة الوكالة.',
  },
  fr: {
    heroBadge: 'Agence immobilière agréée · Biens vérifiés',
    viewingCta: 'Demander une visite',
    propertiesCta: 'Nos biens',
    openDaily: 'Ouvert tous les jours',
    verified: 'Biens vérifiés',
    experience: 'ans d’expérience',
    heroMessage: 'Je souhaite acheter ou louer un bien',
    typesEyebrow: 'Types de biens',
    typesTitle: 'Nous trouvons le bien qui répond à vos attentes',
    typesLead: 'Des appartements et villas aux commerces et terrains, nous couvrons tous vos besoins résidentiels et d’investissement.',
    types: [
      { icon: 'home', title: 'Appartements', description: 'Appartements à vendre ou à louer, de surfaces et de designs variés.' },
      { icon: 'home', title: 'Villas', description: 'Villas de luxe avec jardins et espaces extérieurs privés.' },
      { icon: 'briefcase', title: 'Commerces', description: 'Locaux commerciaux et surfaces en pieds d’immeuble dans les zones stratégiques.' },
      { icon: 'target', title: 'Terrains', description: 'Terrains constructibles avec titres de propriété complets.' },
    ],
    propertiesEyebrow: 'Biens disponibles',
    propertiesTitle: 'Sélection de nos biens',
    propertiesLead: 'Des biens avec dossiers vérifiés et photos réelles, des prix clairs avant toute visite.',
    servicesEyebrow: 'Services de l’agence',
    servicesTitle: 'Nous vous accompagnons dans votre projet immobilier',
    servicesLead: 'De la recherche du bien à la signature et l’acte authentique, nous sommes à vos côtés à chaque étape.',
    fallbackServices: [
      { title: 'Vente et achat de biens', description: 'Accompagnement complet dans les procédures de vente et d’achat.' },
      { title: 'Location', description: 'Contrats de location résidentiels et commerciaux vérifiés et organisés.' },
      { title: 'Accompagnement juridique', description: 'Rédaction des actes et accompagnement chez le notaire étape par étape.' },
      { title: 'Évaluation immobilière', description: 'Estimation réaliste du prix avant la mise en vente ou la location.' },
    ],
    processTitle: 'Comment nous menons votre transaction',
    processLead: 'Nous suivons chaque étape, de la recherche à la remise des clés, avec une transparence totale.',
    step1: 'Comprendre vos besoins', step1d: 'Nous écoutons vos exigences et votre budget et définissons les spécifications du bien.',
    step2: 'Recherche et visite', step2d: 'Nous vous présentons des options compatibles et organisons des visites sur place.',
    step3: 'Négociation et acte', step3d: 'Nous négocions le prix et rédigeons le contrat avec révision juridique.',
    step4: 'Remise et acte authentique', step4d: 'Nous vous accompagnons jusqu’à la remise du bien et l’acte authentique.',
    teamEyebrow: 'Équipe de l’agence',
    teamTitle: 'Des agents immobiliers à votre service',
    teamLead: 'Une équipe possédant une connaissance approfondie du marché immobilier local, travaillant en toute confidentialité.',
    aboutTitle: 'Agence immobilière Dar',
    aboutLead: 'Une agence immobilière agréée spécialisée dans la vente et la location, proposant des biens vérifiés, des visites organisées et un accompagnement juridique complet, de la recherche du bien jusqu’à la remise des clés.',
    feat1: 'Biens vérifiés', feat1d: 'Tous les biens sont accompagnés de titres de propriété et de photos réelles.',
    feat2: 'Accompagnement juridique', feat2d: 'Rédaction des actes et accompagnement chez le notaire pour garantir les droits de tous.',
    feat3: 'Prix transparents', feat3d: 'Le prix est affiché clairement avant toute visite ou procédure.',
    feat4: 'Visites organisées', feat4d: 'Visites sur place planifiées et guidées par des agents spécialisés.',
    stats: [['+8', 'ans d’expérience'], ['+300', 'biens'], ['98%', 'satisfaction client'], ['24/7', 'disponibilité immobilière']],
    quotes: [
      { text: 'J’ai trouvé mon appartement idéal via l’agence Dar, la visite était organisée et les professionnels étaient à l’heure.', name: 'Khalid B.', role: 'Acheteur' },
      { text: 'Une agence professionnelle, ils m’ont aidé à vendre ma villa rapidement et à un prix juste, je les recommande.', name: 'Amina T.', role: 'Vendeur' },
      { text: 'Un contrat de bail commercial clair et protégé juridiquement, merci pour l’excellent accompagnement.', name: 'Salim A.', role: 'Commerçant' },
    ],
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Les biens sont-ils vérifiés ?', 'Oui, tous les biens sont présentés avec des dossiers vérifiés et des titres de propriété complets.'],
      ['Comment réserver une visite ?', 'Demandez une visite via le formulaire ou WhatsApp et nous fixerons un rendez-vous dans les plus brefs délais.'],
      ['Le service inclut-il l’acte authentique ?', 'Oui, nous offrons un accompagnement juridique complet pour l’acte authentique chez le notaire.'],
      ['Quels sont vos horaires ?', 'Nous travaillons du samedi au jeudi de 09:00 à 18:00.'],
      ['Gérez-vous les baux commerciaux ?', 'Oui, nous proposons des baux commerciaux vérifiés et des surfaces de locaux dans les zones stratégiques.'],
    ],
    viewingTitle: 'Réservez une visite immobilière',
    viewingLead: 'Remplissez le formulaire et nous vous contacterons pour fixer un rendez-vous de visite du bien qui vous intéresse.',
    formTitle: 'Demande de visite immobilière',
    formSub: 'Dites-nous le type de bien que vous recherchez et nous vous répondrons dans les plus brefs délais.',
    confirm: 'Envoyer la demande de visite',
    summaryType: 'Type de bien',
    summaryService: 'Service demandé',
    summaryWhen: 'Rendez-vous préféré',
    note: 'Toutes vos données sont protégées et confidentielles selon la politique de l’agence.',
  },
  en: {
    heroBadge: 'Licensed real estate agency · Verified properties',
    viewingCta: 'Request viewing',
    propertiesCta: 'Our properties',
    openDaily: 'Open every day',
    verified: 'Verified properties',
    experience: 'years of experience',
    heroMessage: 'I want to buy or rent a property',
    typesEyebrow: 'Property types',
    typesTitle: 'We find the property that meets your expectations',
    typesLead: 'From apartments and villas to shops and land, we cover all your residential and investment needs.',
    types: [
      { icon: 'home', title: 'Apartments', description: 'Apartments for sale and rent with various sizes and designs.' },
      { icon: 'home', title: 'Villas', description: 'Luxury villas with private gardens and outdoor spaces.' },
      { icon: 'briefcase', title: 'Shops', description: 'Shop fronts and commercial spaces in strategic areas.' },
      { icon: 'target', title: 'Land', description: 'Buildable land with full title deeds.' },
    ],
    propertiesEyebrow: 'Available properties',
    propertiesTitle: 'Selection of our properties',
    propertiesLead: 'Properties with verified files and real photos, clear prices before any viewing.',
    servicesEyebrow: 'Agency services',
    servicesTitle: 'We offer you complete real estate support',
    servicesLead: 'From property search to contract signing and authentication, we are with you at every step.',
    fallbackServices: [
      { title: 'Sale and purchase', description: 'Full support in sale and purchase procedures and documentation.' },
      { title: 'Rent', description: 'Verified and organized residential and commercial lease contracts.' },
      { title: 'Legal support', description: 'Contract drafting and notary accompaniment step by step.' },
      { title: 'Property valuation', description: 'Realistic price estimation before listing or sale.' },
    ],
    processTitle: 'How we complete your transaction',
    processLead: 'We follow every step from search to final handover with full transparency.',
    step1: 'Understanding your needs', step1d: 'We listen to your requirements and budget and define the right property specifications.',
    step2: 'Search and viewing', step2d: 'We present compatible options and organize site visits for selected properties.',
    step3: 'Negotiation and contract', step3d: 'We negotiate the price and draft the contract with legal review.',
    step4: 'Handover and authentication', step4d: 'We accompany you until property handover and official contract authentication.',
    teamEyebrow: 'Agency team',
    teamTitle: 'Real estate agents at your service',
    teamLead: 'A team with deep knowledge of the local real estate market, working with full confidentiality.',
    aboutTitle: 'Dar Real Estate Agency',
    aboutLead: 'A licensed real estate agency specialized in sale and rent, with verified options, organized viewings and full legal support, from property search to key handover.',
    feat1: 'Verified properties', feat1d: 'All properties are backed by title deeds and real photos.',
    feat2: 'Legal support', feat2d: 'Contract drafting and notary accompaniment to protect all parties\' rights.',
    feat3: 'Transparent prices', feat3d: 'The price is clearly displayed before any viewing or procedure.',
    feat4: 'Organized viewings', feat4d: 'Scheduled and guided site visits by specialized agents.',
    stats: [['+8', 'years of experience'], ['+300', 'properties'], ['98%', 'client satisfaction'], ['24/7', 'real estate availability']],
    quotes: [
      { text: 'I found my ideal apartment through Dar Agency, the viewing was organized and the professionals were on time.', name: 'Khalid B.', role: 'Buyer' },
      { text: 'A professional agency, they helped me sell my villa quickly at a fair price, I recommend them.', name: 'Amina T.', role: 'Seller' },
      { text: 'A clear and legally protected commercial lease contract, thank you for the excellent support.', name: 'Salim A.', role: 'Merchant' },
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Are properties verified?', 'Yes, all properties are presented with verified files and complete title deeds.'],
      ['How do I book a viewing?', 'Request a viewing via the form or WhatsApp and we will set an appointment as soon as possible.'],
      ['Does the service include authentication?', 'Yes, we provide full legal support for authentication before the notary.'],
      ['What are your hours?', 'We work Saturday to Thursday from 09:00 to 18:00.'],
      ['Do you handle commercial leases?', 'Yes, we offer verified commercial leases and shop spaces in strategic areas.'],
    ],
    viewingTitle: 'Book a real estate viewing',
    viewingLead: 'Fill out the form and we will contact you to schedule a viewing of the property that interests you.',
    formTitle: 'Real estate viewing request',
    formSub: 'Tell us what type of property you are looking for and we will respond as soon as possible.',
    confirm: 'Send viewing request',
    summaryType: 'Property type',
    summaryService: 'Service requested',
    summaryWhen: 'Preferred appointment',
    note: 'All your data is protected and confidential according to the agency policy.',
  },
};

function realEstateCard(member: RenderTeamMember, copy: RealEstateCopy): string {
  const photo = member.photoUrl
    ? `<img src="${attr(member.photoUrl)}" alt="${attr(member.name)}" loading="lazy" decoding="async" width="700" height="700">`
    : `<span class="estate-initials">${esc(initialsFor(member.name))}</span>`;
  return `<article class="estate-card" data-reveal>
    <div class="estate-avatar">${photo}</div>
    <h3>${esc(member.name)}</h3>
    <p class="estate-role">${esc(member.role)}</p>
    ${member.specialty ? `<span class="estate-specialty">${esc(member.specialty)}</span>` : ''}
    ${member.experience ? `<span class="estate-exp">${icon('award')}${esc(member.experience)} ${esc(copy.experience)}</span>` : ''}
  </article>`;
}

function propertyCard(p: RenderProduct, config: RenderConfig, s: UiStrings, lang: Lang): string {
  const image = p.imageUrl
    ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="600" height="450">`
    : productPlaceholder(p.name);
  return `<article class="property-card" data-reveal data-property-card data-category="${attr(p.category || '')}" data-name="${attr(p.name)}" data-desc="${attr(p.description || '')}">
    <div class="property-thumb">${image}</div>
    <div class="property-body">
      ${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      ${p.price > 0 ? `<span class="price">${money(p.price, lang)}</span>` : ''}
      <a class="btn btn-wa btn-block mt-3" href="${attr(waHref(config, `أنا مهتم بعقار: ${p.name} — ${p.description || ''}`))}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.orderNow)}</a>
    </div>
  </article>`;
}

export function realEstatePage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = REALESTATE[lang];
  const properties = config.products.filter((p) => p.name);
  const team = config.team || [];
  const services = config.services.length ? config.services : copy.fallbackServices;
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const heroWa = waHref(config, `${copy.heroMessage} — ${config.siteName}`);
  const viewingWa = waHref(config, `معاينة عقارية — ${config.siteName}`);

  return `<section class="hero realestate-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('home')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#properties">${icon('home')}${esc(copy.propertiesCta)}</a>
          <a class="btn btn-wa" href="${attr(heroWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(copy.viewingCta)}</a>
        </div>
        <div class="estate-badges">
          <span>${icon('shield')}${esc(copy.verified)}</span>
          <span>${icon('clock')}${esc(copy.openDaily)} · ${esc(config.hours || '09:00 — 18:00')}</span>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media realestate-hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('home')}</span><div><strong>${esc(copy.verified)}</strong><span>${esc(config.city || '')}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('shield')}${esc(copy.verified)}</span>
    <span class="trust-item">${icon('home')}${esc(s.quality)}</span>
    <span class="trust-item">${icon('key')}${esc(s.satisfaction)}</span>
    <span class="trust-item">${icon('target')}${esc(s.projects)}</span>
  </div></div>

  <section class="section" id="types">
    <div class="container">
      ${sectionHead(copy.typesEyebrow, copy.typesTitle, copy.typesLead, true)}
      <div class="types-grid">
        ${copy.types.map((item, i) => `<article class="type-card" data-reveal>
          <span class="type-icon">${icon(item.icon as any)}</span>
          <h3 class="h3">${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="properties">
    <div class="container">
      ${sectionHead(copy.propertiesEyebrow, copy.propertiesTitle, copy.propertiesLead)}
      <div class="property-grid">${properties.length ? properties.map((p) => propertyCard(p, config, s, lang)).join('') : `<div class="property-empty">${esc(s.emptyCart)}</div>`}</div>
    </div>
  </section>

  <section class="section" id="services">
    <div class="container">
      ${sectionHead(copy.servicesEyebrow, copy.servicesTitle, copy.servicesLead)}
      <div class="estate-service-grid">
        ${services.map((service, i) => `<article class="estate-service" data-reveal>
          <span class="service-num">${String(i + 1).padStart(2, '0')}</span>
          <div><h3 class="h3">${esc(service.title)}</h3><p>${esc(service.description)}</p></div>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="process">
    <div class="container">
      ${sectionHead(copy.processTitle, copy.processLead, undefined, true)}
      <div class="steps">
        ${[
          [copy.step1, copy.step1d],
          [copy.step2, copy.step2d],
          [copy.step3, copy.step3d],
          [copy.step4, copy.step4d],
        ].map(([title, desc], i) => `<div class="step" data-reveal><div class="n">${i + 1}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`).join('')}
      </div>
    </div>
  </section>

  ${team.length ? `<section class="section bg-soft" id="team">
    <div class="container">
      ${sectionHead(copy.teamEyebrow, copy.teamTitle, copy.teamLead, true)}
      <div class="estate-team-grid">${team.map((m) => realEstateCard(m, copy)).join('')}</div>
    </div>
  </section>` : ''}

  <section class="section" id="about">
    <div class="container about-grid realestate-about-grid">
      <div class="realestate-about-media" data-reveal>
        ${about ? `<img class="main" src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="760">` : ''}
        <div class="about-badge">${icon('check')}+8 ${esc(s.years)}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(config.siteName)}</h2>
        <p class="lead mt-2">${esc(config.description)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)} — ${esc(copy.feat1d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)} — ${esc(copy.feat2d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)} — ${esc(copy.feat3d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat4)} — ${esc(copy.feat4d)}</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="viewing">
    <div class="container viewing-wrap">
      <div class="viewing-copy" data-reveal>
        <span class="eyebrow">${esc(s.appointment)}</span>
        <h2 class="h2 mt-2">${esc(copy.viewingTitle)}</h2>
        <p class="lead mt-2">${esc(copy.viewingLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.note)}</span></li>
        </ul>
        <div class="estate-hours">
          <div class="hours-row"><span>${icon('clock')}${esc(s.hours)}</span><strong>${esc(config.hours || '09:00 — 18:00')}</strong></div>
          <div class="hours-row"><span>${icon('map')}${esc(s.location)}</span><strong>${esc(config.address || config.city || '')}</strong></div>
        </div>
        <div class="estate-contact-actions">
          <a class="btn btn-light" href="tel:${attr(config.phone)}">${icon('phone')}${esc(s.callNow)}</a>
          <a class="btn btn-wa" href="${attr(viewingWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
      </div>
      <form class="viewing-card" data-lead-form data-lead-kind="viewing" novalidate>
        <h3>${esc(copy.formTitle)}</h3>
        <p class="booking-sub">${esc(copy.formSub)}</p>
        <div class="form-grid">
          <div class="field"><label for="vie-name">${esc(s.name)}</label><input id="vie-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="vie-phone">${esc(s.phone)}</label><input id="vie-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field full"><label for="vie-email">${esc(s.email)}</label><input id="vie-email" name="email" type="email" maxlength="120" autocomplete="email" dir="ltr"></div>
          <div class="field full"><label for="vie-type">${esc(copy.summaryType)}</label><input id="vie-type" name="propertyType" maxlength="200"></div>
          <div class="field full"><label for="vie-msg">${esc(s.message)}</label><textarea id="vie-msg" name="message" required maxlength="1200"></textarea><span class="err">${esc(s.required)}</span></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('send')}${esc(copy.confirm)}</button>
        <div class="form-status" role="status"></div>
        <p class="form-note center mt-2">${esc(copy.note)}</p>
      </form>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.faqTitle, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * EDUCATION
 * ---------------------------------------------------------------------- */
interface EducationCopy {
  heroBadge: string;
  registerCta: string;
  programsCta: string;
  openDaily: string;
  certified: string;
  experience: string;
  heroMessage: string;
  programsEyebrow: string;
  programsTitle: string;
  programsLead: string;
  programs: Array<{ icon: string; title: string; description: string }>;
  coursesEyebrow: string;
  coursesTitle: string;
  coursesLead: string;
  fallbackCourses: Array<{ title: string; description: string; price: string }>;
  processTitle: string;
  processLead: string;
  step1: string; step1d: string;
  step2: string; step2d: string;
  step3: string; step3d: string;
  step4: string; step4d: string;
  teamEyebrow: string;
  teamTitle: string;
  teamLead: string;
  aboutTitle: string;
  aboutLead: string;
  feat1: string; feat1d: string;
  feat2: string; feat2d: string;
  feat3: string; feat3d: string;
  feat4: string; feat4d: string;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
  faqTitle: string;
  faq: Array<[string, string]>;
  registerTitle: string;
  registerLead: string;
  formTitle: string;
  formSub: string;
  confirm: string;
  summaryCourse: string;
  summaryLevel: string;
  summaryWhen: string;
  note: string;
}

const EDUCATION: Record<Lang, EducationCopy> = {
  ar: {
    heroBadge: 'مركز تكوين معتمد · شهادات معترف بها',
    registerCta: 'التسجيل الآن',
    programsCta: 'برامجنا',
    openDaily: 'مفتوح يومياً',
    certified: 'شهادات معتمدة',
    experience: 'سنوات الخبرة',
    heroMessage: 'أريد التسجيل في دورة تدريبية',
    programsEyebrow: 'برامج التكوين',
    programsTitle: 'نُكوّن مهاراتك لمستقبل أفضل',
    programsLead: 'من الإعلام الآلي واللغات إلى التسيير والتصميم، نقدّم دورات عملية بشهادات معترف بها.',
    programs: [
      { icon: 'home', title: 'إعلام آلي', description: 'دورات عملية في الحاسوب والبرمجيات المكتبية لمستويات مختلفة.' },
      { icon: 'clipboard', title: 'لغات', description: 'فرنسية وإنجليزية بمجموعات صغيرة ومستويات متدرجة.' },
      { icon: 'briefcase', title: 'تسيير ومحاسبة', description: 'تكوين عملي على برامج المحاسبة والإدارة المالية.' },
      { icon: 'target', title: 'تصميم جرافيكي', description: 'تصميم بالبرامج الاحترافية وإعداد مشاريع تطبيقية.' },
    ],
    coursesEyebrow: 'الدورات المتاحة',
    coursesTitle: 'دوراتنا التدريبية',
    coursesLead: 'دورات عملية مع مدربين معتمدين، وشهادة معتمدة بعد كل دورة.',
    fallbackCourses: [
      { title: 'إعلام آلي ومكتبي', description: 'Word وExcel وPowerPoint بمستويات متدرجة.', price: '12,000 دج' },
      { title: 'اللغة الإنجليزية', description: 'مستوى A1 إلى B1 بمجموعات صغيرة.', price: '15,000 دج' },
      { title: 'المحاسبة والتسيير', description: 'تكوين عملي على برامج المحاسبة.', price: '18,000 دج' },
      { title: 'التصميم الجرافيكي', description: 'Photoshop وIllustrator مع مشروع نهائي.', price: '22,000 دج' },
    ],
    processTitle: 'كيف تسجل وتتدرب',
    processLead: 'من اختيار الدورة إلى الحصول على الشهادة، نمرافقك في كل خطوة.',
    step1: 'اختيار الدورة', step1d: 'نساعدك في اختيار الدورة المناسبة لمستواك وهدفك المهني.',
    step2: 'التسجيل', step2d: 'نسجل بياناتك ونحدد لك مواعيد الحصص والوسيلة التدريبية.',
    step3: 'التدريب', step3d: 'تحضر الحصص العملية مع مدرب معتمد وتطبق ما تتعلمه على مشاريع حقيقية.',
    step4: 'الشهادة', step4d: 'تحصل على شهادة معترف بها بعد إكمال الدورة والتقييم النهائي.',
    teamEyebrow: 'فريق التكوين',
    teamTitle: 'مدربون معتمدون في خدمتك',
    teamLead: 'فريق من المدربين المؤهلين ذوي الخبرة العملية في المجالات التقنية والإدارية.',
    aboutTitle: 'مركز النجاح للتكوين',
    aboutLead: 'مركز تكوين معتمد يقدّم دورات عملية في الإعلام الآلي واللغات والتسيير، بشهادات معترف بها، مع مرافقة المتدرب من التسجيل حتى الحصول على الشهادة.',
    feat1: 'شهادات معتمدة', feat1d: 'شهادة بعد كل دورة معترف بها في سوق العمل.',
    feat2: 'مدربون مؤهلون', feat2d: 'مدربون يمتلكون خبرة عملية وشهادات معترف بها.',
    feat3: 'تكوين عملي', feat3d: 'تدريب عملي على مشاريع حقيقية وحالات دراسية.',
    feat4: 'جدول مرن', feat4d: 'حصص صباحية ومسائية تناسب جميع الفئات.',
    stats: [['+6', 'سنة خبرة'], ['+200', 'متدرب'], ['98%', 'رضا المتدربين'], ['24/7', 'دعم أكاديمي']],
    quotes: [
      { text: 'دورة ممتازة في الإعلام الآلي، المدرب محترف والحصول على الشهادة كان سهلاً.', name: 'سارة خ.', role: 'متدربة' },
      { text: 'تعلمت اللغة الإنجليزية بسرعة وبطريقة عملية، أنصح بالمركز للجميع.', name: 'محمد ب.', role: 'متدرب' },
      { text: 'دورة التصميم الجرافيكي كانت مفيدة جداً، وحصلت على شهادة معتمدة.', name: 'نورى ع.', role: 'متدرب' },
    ],
    faqTitle: 'أسئلة شائعة',
    faq: [
      ['هل الشهادات معترف بها؟', 'نعم، جميع الشهادات معترف بها وتمنح بعد إكمال الدورة والتقييم.'],
      ['كيف أسجل في دورة؟', 'يمكنك التسجيل عبر النموذج أو زيارة المركز مباشرةً.'],
      ['هل هناك حصص مسائية؟', 'نعم، نقدم حصصاً صباحية ومسائية تناسب جميع الفئات.'],
      ['ما هي أوقات العمل؟', 'نعمل من السبت إلى الخميس من 08:30 إلى 19:00.'],
      ['هل يمكن الدفع بالتقسيط؟', 'نعم، يمكن تقسيط رسوم الدورة على عدة دفعات حسب الاتفاق.'],
    ],
    registerTitle: 'سجل في دورة تدريبية',
    registerLead: 'املأ النموذج وسنتصل بك لتحديد الدورة المناسبة وموعد البدء.',
    formTitle: 'طلب تسجيل في دورة',
    formSub: 'أخبرنا عن الدورة التي تهتم بها وسنرد عليك في أقرب وقت.',
    confirm: 'إرسال طلب التسجيل',
    summaryCourse: 'الدورة المختارة',
    summaryLevel: 'المستوى المطلوب',
    summaryWhen: 'الموعد المفضل',
    note: 'جميع بياناتك محمية وسرية وفقاً لسياسة المركز.',
  },
  fr: {
    heroBadge: 'Centre de formation agréé · Diplômes reconnus',
    registerCta: 'S\'inscrire maintenant',
    programsCta: 'Nos programmes',
    openDaily: 'Ouvert tous les jours',
    certified: 'Diplômes certifiés',
    experience: 'ans d’expérience',
    heroMessage: 'Je souhaite m\'inscrire à une formation',
    programsEyebrow: 'Programmes de formation',
    programsTitle: 'Nous formons vos compétences pour un meilleur avenir',
    programsLead: 'De l\'informatique et les langues à la gestion et le design, nous proposons des formations pratiques avec diplômes reconnus.',
    programs: [
      { icon: 'home', title: 'Informatique', description: 'Formations pratiques en informatique et bureautique pour différents niveaux.' },
      { icon: 'clipboard', title: 'Langues', description: 'Français et anglais en petits groupes et niveaux progressifs.' },
      { icon: 'briefcase', title: 'Gestion et comptabilité', description: 'Formation pratique sur les logiciels de comptabilité et de gestion financière.' },
      { icon: 'target', title: 'Graphisme', description: 'Design avec logiciels professionnels et préparation de projets applicatifs.' },
    ],
    coursesEyebrow: 'Formations disponibles',
    coursesTitle: 'Nos formations',
    coursesLead: 'Des formations pratiques avec des formateurs certifiés, et un diplôme certifié après chaque formation.',
    fallbackCourses: [
      { title: 'Informatique et bureautique', description: 'Word, Excel et PowerPoint par niveaux progressifs.', price: '12 000 DA' },
      { title: 'Anglais', description: 'Niveau A1 à B1 en petits groupes.', price: '15 000 DA' },
      { title: 'Comptabilité et gestion', description: 'Formation pratique sur les logiciels de comptabilité.', price: '18 000 DA' },
      { title: 'Graphisme', description: 'Photoshop et Illustrator avec projet final.', price: '22 000 DA' },
    ],
    processTitle: 'Comment vous inscrire et vous former',
    processLead: 'Du choix de la formation à l\'obtention du diplôme, nous vous accompagnons à chaque étape.',
    step1: 'Choix de la formation', step1d: 'Nous vous aidons à choisir la formation adaptée à votre niveau et objectif professionnel.',
    step2: 'Inscription', step2d: 'Nous enregistrons vos données et fixons les dates des cours et le support de formation.',
    step3: 'Formation', step3d: 'Vous assistez aux cours pratiques avec un formateur certifié et appliquez ce que vous apprenez sur des projets réels.',
    step4: 'Diplôme', step4d: 'Vous obtenez un diplôme reconnu après achèvement de la formation et évaluation finale.',
    teamEyebrow: 'Équipe de formation',
    teamTitle: 'Des formateurs certifiés à votre service',
    teamLead: 'Une équipe de formateurs qualifiés ayant une expérience pratique dans les domaines techniques et administratifs.',
    aboutTitle: 'Centre de formation Al Najah',
    aboutLead: 'Un centre de formation agréé proposant des formations pratiques en informatique, langues et gestion, avec diplômes reconnus, accompagnant le stagiaire de l\'inscription jusqu\'à l\'obtention du diplôme.',
    feat1: 'Diplômes certifiés', feat1d: 'Un diplôme certifié après chaque formation reconnu sur le marché du travail.',
    feat2: 'Formateurs qualifiés', feat2d: 'Des formateurs possédant une expérience pratique et des diplômes reconnus.',
    feat3: 'Formation pratique', feat3d: 'Une formation pratique sur des projets réels et des études de cas.',
    feat4: 'Emploi du temps flexible', feat4d: 'Des cours matinaux et soirés convenant à toutes les catégories.',
    stats: [['+6', 'ans d’expérience'], ['+200', 'stagiaires'], ['98%', 'satisfaction stagiaires'], ['24/7', 'soutien académique']],
    quotes: [
      { text: 'Une excellente formation en informatique, le formateur est professionnel et l\'obtention du diplôme a été facile.', name: 'Sarah K.', role: 'Stagiaire' },
      { text: 'J\'ai appris l\'anglais rapidement et de manière pratique, je recommande ce centre à tous.', name: 'Mohamed B.', role: 'Stagiaire' },
      { text: 'La formation en graphisme a été très utile, et j\'ai obtenu un diplôme certifié.', name: 'Nouri A.', role: 'Stagiaire' },
    ],
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Les diplômes sont-ils reconnus ?', 'Oui, tous les diplômes sont reconnus et délivrés après achèvement de la formation et évaluation.'],
      ['Comment m\'inscrire à une formation ?', 'Vous pouvez vous inscrire via le formulaire ou visiter le centre directement.'],
      ['Y a-t-il des cours du soir ?', 'Oui, nous proposons des cours du matin et du soir convenant à toutes les catégories.'],
      ['Quels sont vos horaires ?', 'Nous travaillons du samedi au jeudi de 08:30 à 19:00.'],
      ['Peut-on payer en plusieurs fois ?', 'Oui, les frais de formation peuvent être étalés sur plusieurs versements selon l\'accord.'],
    ],
    registerTitle: 'Inscrivez-vous à une formation',
    registerLead: 'Remplissez le formulaire et nous vous contacterons pour fixer la formation appropriée et la date de début.',
    formTitle: 'Demande d\'inscription à une formation',
    formSub: 'Dites-nous la formation qui vous intéresse et nous vous répondrons dans les plus brefs délais.',
    confirm: 'Envoyer la demande d\'inscription',
    summaryCourse: 'Formation choisie',
    summaryLevel: 'Niveau demandé',
    summaryWhen: 'Rendez-vous préféré',
    note: 'Toutes vos données sont protégées et confidentielles selon la politique du centre.',
  },
  en: {
    heroBadge: 'Certified training center · Recognized certificates',
    registerCta: 'Register now',
    programsCta: 'Our programs',
    openDaily: 'Open every day',
    certified: 'Certified diplomas',
    experience: 'years of experience',
    heroMessage: 'I want to register for a training course',
    programsEyebrow: 'Training programs',
    programsTitle: 'We build your skills for a better future',
    programsLead: 'From IT and languages to management and design, we offer practical courses with recognized certificates.',
    programs: [
      { icon: 'home', title: 'IT & Office', description: 'Practical courses in computer and office software for various levels.' },
      { icon: 'clipboard', title: 'Languages', description: 'French and English in small groups with progressive levels.' },
      { icon: 'briefcase', title: 'Management & Accounting', description: 'Practical training on accounting and financial management software.' },
      { icon: 'target', title: 'Graphic Design', description: 'Design with professional software and applied project preparation.' },
    ],
    coursesEyebrow: 'Available courses',
    coursesTitle: 'Our training courses',
    coursesLead: 'Practical courses with certified trainers, and a certified certificate after each course.',
    fallbackCourses: [
      { title: 'IT & Office', description: 'Word, Excel and PowerPoint at progressive levels.', price: '12,000 DZD' },
      { title: 'English', description: 'Level A1 to B1 in small groups.', price: '15,000 DZD' },
      { title: 'Accounting & Management', description: 'Practical training on accounting software.', price: '18,000 DZD' },
      { title: 'Graphic Design', description: 'Photoshop and Illustrator with final project.', price: '22,000 DZD' },
    ],
    processTitle: 'How to register and train',
    processLead: 'From course selection to certificate issuance, we accompany you at every step.',
    step1: 'Course selection', step1d: 'We help you choose the right course for your level and career goal.',
    step2: 'Registration', step2d: 'We register your details and set class dates and training materials.',
    step3: 'Training', step3d: 'You attend practical sessions with a certified trainer and apply what you learn on real projects.',
    step4: 'Certificate', step4d: 'You receive a recognized certificate after completing the course and final assessment.',
    teamEyebrow: 'Training team',
    teamTitle: 'Certified trainers at your service',
    teamLead: 'A team of qualified trainers with practical experience in technical and administrative fields.',
    aboutTitle: 'Al Najah Training Center',
    aboutLead: 'A certified training center offering practical courses in IT, languages and management, with recognized certificates, accompanying the trainee from registration to certificate issuance.',
    feat1: 'Certified certificates', feat1d: 'A certified certificate after each course recognized in the job market.',
    feat2: 'Qualified trainers', feat2d: 'Trainers with practical experience and recognized certificates.',
    feat3: 'Practical training', feat3d: 'Practical training on real projects and case studies.',
    feat4: 'Flexible schedule', feat4d: 'Morning and evening classes suitable for all categories.',
    stats: [['+6', 'years of experience'], ['+200', 'trainees'], ['98%', 'trainee satisfaction'], ['24/7', 'academic support']],
    quotes: [
      { text: 'An excellent IT course, the trainer is professional and getting the certificate was easy.', name: 'Sarah K.', role: 'Trainee' },
      { text: 'I learned English quickly and practically, I recommend this center to everyone.', name: 'Mohamed B.', role: 'Trainee' },
      { text: 'The graphic design course was very useful, and I got a certified certificate.', name: 'Nouri A.', role: 'Trainee' },
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Are certificates recognized?', 'Yes, all certificates are recognized and issued after completing the course and assessment.'],
      ['How do I register for a course?', 'You can register via the form or visit the center directly.'],
      ['Are there evening classes?', 'Yes, we offer morning and evening classes suitable for all categories.'],
      ['What are your hours?', 'We work Saturday to Thursday from 08:30 to 19:00.'],
      ['Can I pay in installments?', 'Yes, course fees can be paid in several installments by agreement.'],
    ],
    registerTitle: 'Register for a training course',
    registerLead: 'Fill out the form and we will contact you to determine the right course and start date.',
    formTitle: 'Course registration request',
    formSub: 'Tell us about the course you are interested in and we will respond as soon as possible.',
    confirm: 'Send registration request',
    summaryCourse: 'Selected course',
    summaryLevel: 'Level required',
    summaryWhen: 'Preferred appointment',
    note: 'All your data is protected and confidential according to the center policy.',
  },
};

function educationCard(member: RenderTeamMember, copy: EducationCopy): string {
  const photo = member.photoUrl
    ? `<img src="${attr(member.photoUrl)}" alt="${attr(member.name)}" loading="lazy" decoding="async" width="700" height="700">`
    : `<span class="edu-initials">${esc(initialsFor(member.name))}</span>`;
  return `<article class="edu-card" data-reveal>
    <div class="edu-avatar">${photo}</div>
    <h3>${esc(member.name)}</h3>
    <p class="edu-role">${esc(member.role)}</p>
    ${member.specialty ? `<span class="edu-specialty">${esc(member.specialty)}</span>` : ''}
    ${member.experience ? `<span class="edu-exp">${icon('award')}${esc(member.experience)} ${esc(copy.experience)}</span>` : ''}
  </article>`;
}

function courseCard(p: RenderProduct, config: RenderConfig, s: UiStrings, lang: Lang): string {
  const image = p.imageUrl
    ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="600" height="450">`
    : productPlaceholder(p.name);
  return `<article class="course-card" data-reveal data-course-card data-category="${attr(p.category || '')}" data-name="${attr(p.name)}" data-desc="${attr(p.description || '')}">
    <div class="course-thumb">${image}</div>
    <div class="course-body">
      ${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      ${p.price > 0 ? `<span class="price">${money(p.price, lang)}</span>` : ''}
      <a class="btn btn-wa btn-block mt-3" href="${attr(waHref(config, `أنا مهتم بدورة: ${p.name} — ${p.description || ''}`))}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.orderNow)}</a>
    </div>
  </article>`;
}

export function educationPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = EDUCATION[lang];
  const courses = config.products.filter((p) => p.name);
  const team = config.team || [];
  const services = config.services.length ? config.services : copy.fallbackCourses;
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const heroWa = waHref(config, `${copy.heroMessage} — ${config.siteName}`);
  const registerWa = waHref(config, `تسجيل في دورة — ${config.siteName}`);

  return `<section class="hero edu-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('clipboard')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#courses">${icon('clipboard')}${esc(copy.programsCta)}</a>
          <a class="btn btn-wa" href="${attr(heroWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(copy.registerCta)}</a>
        </div>
        <div class="edu-badges">
          <span>${icon('shield')}${esc(copy.certified)}</span>
          <span>${icon('clock')}${esc(copy.openDaily)} · ${esc(config.hours || '08:30 — 19:00')}</span>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media edu-hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('clipboard')}</span><div><strong>${esc(copy.certified)}</strong><span>${esc(config.city || '')}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('shield')}${esc(copy.certified)}</span>
    <span class="trust-item">${icon('home')}${esc(s.quality)}</span>
    <span class="trust-item">${icon('award')}${esc(s.satisfaction)}</span>
    <span class="trust-item">${icon('target')}${esc(s.projects)}</span>
  </div></div>

  <section class="section" id="programs">
    <div class="container">
      ${sectionHead(copy.programsEyebrow, copy.programsTitle, copy.programsLead, true)}
      <div class="programs-grid">
        ${copy.programs.map((item, i) => `<article class="program-card" data-reveal>
          <span class="program-icon">${icon(item.icon as any)}</span>
          <h3 class="h3">${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="courses">
    <div class="container">
      ${sectionHead(copy.coursesEyebrow, copy.coursesTitle, copy.coursesLead)}
      <div class="course-grid">${courses.length ? courses.map((p) => courseCard(p, config, s, lang)).join('') : `<div class="course-empty">${esc(s.emptyCart)}</div>`}</div>
    </div>
  </section>

  <section class="section" id="process">
    <div class="container">
      ${sectionHead(copy.processTitle, copy.processLead, undefined, true)}
      <div class="steps">
        ${[
          [copy.step1, copy.step1d],
          [copy.step2, copy.step2d],
          [copy.step3, copy.step3d],
          [copy.step4, copy.step4d],
        ].map(([title, desc], i) => `<div class="step" data-reveal><div class="n">${i + 1}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`).join('')}
      </div>
    </div>
  </section>

  ${team.length ? `<section class="section bg-soft" id="team">
    <div class="container">
      ${sectionHead(copy.teamEyebrow, copy.teamTitle, copy.teamLead, true)}
      <div class="edu-team-grid">${team.map((m) => educationCard(m, copy)).join('')}</div>
    </div>
  </section>` : ''}

  <section class="section" id="about">
    <div class="container about-grid edu-about-grid">
      <div class="edu-about-media" data-reveal>
        ${about ? `<img class="main" src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="760">` : ''}
        <div class="about-badge">${icon('check')}+6 ${esc(s.years)}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(config.siteName)}</h2>
        <p class="lead mt-2">${esc(config.description)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)} — ${esc(copy.feat1d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)} — ${esc(copy.feat2d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)} — ${esc(copy.feat3d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat4)} — ${esc(copy.feat4d)}</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="register">
    <div class="container register-wrap">
      <div class="register-copy" data-reveal>
        <span class="eyebrow">${esc(s.appointment)}</span>
        <h2 class="h2 mt-2">${esc(copy.registerTitle)}</h2>
        <p class="lead mt-2">${esc(copy.registerLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.note)}</span></li>
        </ul>
        <div class="edu-hours">
          <div class="hours-row"><span>${icon('clock')}${esc(s.hours)}</span><strong>${esc(config.hours || '08:30 — 19:00')}</strong></div>
          <div class="hours-row"><span>${icon('map')}${esc(s.location)}</span><strong>${esc(config.address || config.city || '')}</strong></div>
        </div>
        <div class="edu-contact-actions">
          <a class="btn btn-light" href="tel:${attr(config.phone)}">${icon('phone')}${esc(s.callNow)}</a>
          <a class="btn btn-wa" href="${attr(registerWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
      </div>
      <form class="register-card" data-lead-form data-lead-kind="registration" novalidate>
        <h3>${esc(copy.formTitle)}</h3>
        <p class="booking-sub">${esc(copy.formSub)}</p>
        <div class="form-grid">
          <div class="field"><label for="reg-name">${esc(s.name)}</label><input id="reg-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="reg-phone">${esc(s.phone)}</label><input id="reg-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field full"><label for="reg-email">${esc(s.email)}</label><input id="reg-email" name="email" type="email" maxlength="120" autocomplete="email" dir="ltr"></div>
          <div class="field full"><label for="reg-course">${esc(copy.summaryCourse)}</label><input id="reg-course" name="courseType" maxlength="200"></div>
          <div class="field full"><label for="reg-msg">${esc(s.message)}</label><textarea id="reg-msg" name="message" required maxlength="1200"></textarea><span class="err">${esc(s.required)}</span></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('send')}${esc(copy.confirm)}</button>
        <div class="form-status" role="status"></div>
        <p class="form-note center mt-2">${esc(copy.note)}</p>
      </form>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.faqTitle, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * CONSTRUCTION
 * ---------------------------------------------------------------------- */
interface ConstructionCopy {
  heroBadge: string;
  quoteCta: string;
  projectsCta: string;
  openDaily: string;
  guarantee: string;
  experience: string;
  heroMessage: string;
  servicesEyebrow: string;
  servicesTitle: string;
  servicesLead: string;
  fallbackServices: Array<{ title: string; description: string }>;
  projectsEyebrow: string;
  projectsTitle: string;
  projectsLead: string;
  processTitle: string;
  processLead: string;
  step1: string; step1d: string;
  step2: string; step2d: string;
  step3: string; step3d: string;
  step4: string; step4d: string;
  teamEyebrow: string;
  teamTitle: string;
  teamLead: string;
  aboutTitle: string;
  aboutLead: string;
  feat1: string; feat1d: string;
  feat2: string; feat2d: string;
  feat3: string; feat3d: string;
  feat4: string; feat4d: string;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
  faqTitle: string;
  faq: Array<[string, string]>;
  quoteTitle: string;
  quoteLead: string;
  formTitle: string;
  formSub: string;
  confirm: string;
  summaryService: string;
  summaryType: string;
  summaryWhen: string;
  note: string;
}

const CONSTRUCTION: Record<Lang, ConstructionCopy> = {
  ar: {
    heroBadge: 'مؤسسة مقاولات مرخصة · ضمان مكتوب',
    quoteCta: 'اطلب عرض سعر',
    projectsCta: 'مشاريعنا',
    openDaily: 'مفتوح يومياً',
    guarantee: 'ضمان تنفيذ',
    experience: 'سنوات الخبرة',
    heroMessage: 'أريد بناء أو ترميم عقار',
    servicesEyebrow: 'خدمات المقاولات',
    servicesTitle: 'ننفّذ أشغال البناء والترميم بجودة عالية',
    servicesLead: 'من الهيكل إلى التشطيب، نقوم بكل أشغال المقاولات بفريق محترف ومواد موثوقة.',
    fallbackServices: [
      { title: 'أشغال البناء', description: 'هياكل وجدران وخرسانة وفق معايير الجودة.' },
      { title: 'الترميم', description: 'تجديد الواجهات والأسطح ومعالجة الرطوبة.' },
      { title: 'الطلاء والديكور', description: 'لمسات نهائية نظيفة ومتينة.' },
      { title: 'كهرباء وسباكة', description: 'تنفيذ وصيانة الشبكات الداخلية.' },
    ],
    projectsEyebrow: 'مشاريع منجزة',
    projectsTitle: 'مختارات من أعمالنا',
    projectsLead: 'مشاريع سكنية وتجارية أنجزناها بدقة وبمعايير عالية.',
    processTitle: 'كيف ننجز مشروعك',
    processLead: 'من الدراسة إلى التسليم، نتابع كل خطوة بشفافية كاملة.',
    step1: 'الدراسة والتصميم', step1d: 'ندرس موقع البناء ونضع التصميم الهندسي المناسب.',
    step2: 'التنفيذ', step2d: 'ننفّذ الأشغال وفق المواصفات والجدول الزمني المتفق عليه.',
    step3: 'المتابعة', step3d: 'نقوم بمتابعة يومية لسير العمل وجودة التنفيذ.',
    step4: 'التسليم', step4d: 'نسلّم المشروع مع ضمان مكتوب على جودة التنفيذ.',
    teamEyebrow: 'فريق المؤسسة',
    teamTitle: 'فريق مقاولات محترف',
    teamLead: 'فريق من المهندسين والفنيين ذوي الخبرة في الإنشاء والترميم.',
    aboutTitle: 'مؤسسة البناء المتين',
    aboutLead: 'مؤسسة مقاولات مرخصة تنفّذ البناء والترميم والطلاء والأشغال المختلفة بفريق محترف وضمان مكتوب، من الدراسة hasta التسليم.',
    feat1: 'ضمان مكتوب', feat1d: 'ضمان على جودة التنفيذ والمواد المستخدمة.',
    feat2: 'فريق محترف', feat2d: 'مهندسون وفنيون ذوو خبرة في جميع اشغال المقاولات.',
    feat3: 'مواد موثوقة', feat3d: 'مواد بناء أصلية ومطابقة للمواصفات.',
    feat4: 'تسليم في الوقت', feat4d: 'الالتزام بالجدول الزمني وتسليم المشروع في موعده.',
    stats: [['+10', 'سنة خبرة'], ['+150', 'مشروع'], ['98%', 'رضا العملاء'], ['ضمان', 'تنفيذ']],
    quotes: [
      { text: 'أنجزت المؤسسة فيلا سكنية بجودة عالية وفي الوقت المحدد، أنصح بها.', name: 'خالد ب.', role: 'عميل' },
      { text: 'فريق محترف في الترميم والطلاء، العمل كان ممتازاً والسعر مناسب.', name: 'فاطمة ت.', role: 'عميلة' },
      { text: 'بناء محل تجاري على أكمل وجه، شكراً على الضمان المكتوب والمتابعة.', name: 'سليم ع.', role: 'تاجر' },
    ],
    faqTitle: 'أسئلة شائعة',
    faq: [
      ['هل تقدمون ضماناً على الأشغال؟', 'نعم، نقدم ضماناً مكتوباً على جودة التنفيذ والمواد المستخدمة.'],
      ['كيف أطلب عرض سعر؟', 'املأ النموذج أو تواصل معنا عبر واتساب وسنرد عليك في أقرب وقت.'],
      ['هل تنفذون أشغال الكهرباء والسباكة؟', 'نعم، نقوم بتنفيذ وصيانة الشبكات الداخلية للكهرباء والسباكة.'],
      ['ما هي أوقات العمل؟', 'نعمل من السبت إلى الخميس من 07:30 إلى 17:30.'],
      ['هل تعملون في المناطق النائية؟', 'نعم، ننفذ الأشغال في مختلف الولايات وفق الاتفاق.'],
    ],
    quoteTitle: 'اطلب عرض سعر لمشروعك',
    quoteLead: 'املأ النموذج وسنتصل بك لتقييم المشروع وتقديم عرض سعر تفصيلي.',
    formTitle: 'طلب عرض سعر',
    formSub: 'أخبرنا عن نوع الأشغال وسنرد عليك في أقرب وقت.',
    confirm: 'إرسال طلب عرض السعر',
    summaryService: 'نوع الخدمة',
    summaryType: 'نوع المشروع',
    summaryWhen: 'الموعد المفضل',
    note: 'جميع بياناتك محمية وسرية وفقاً لسياسة المؤسسة.',
  },
  fr: {
    heroBadge: 'Entreprise BTP agréée · Garantie écrite',
    quoteCta: 'Demander un devis',
    projectsCta: 'Nos réalisations',
    openDaily: 'Ouvert tous les jours',
    guarantee: 'Garantie d\'exécution',
    experience: 'ans d’expérience',
    heroMessage: 'Je souhaite construire ou rénover un bien',
    servicesEyebrow: 'Services de construction',
    servicesTitle: 'Nous exécutons tous les travaux de BTP avec qualité',
    servicesLead: 'Du gros œuvre à la finition, nous réalisons tous les travaux de construction avec une équipe professionnelle et des matériaux fiables.',
    fallbackServices: [
      { title: 'Travaux de construction', description: 'Structure, murs et béton selon les normes de qualité.' },
      { title: 'Rénovation', description: 'Rénovation des façades, toitures et traitement de l\'humidité.' },
      { title: 'Peinture et décoration', description: 'Finitions propres et durables.' },
      { title: 'Électricité et plomberie', description: 'Exécution et maintenance des réseaux intérieurs.' },
    ],
    projectsEyebrow: 'Réalisations',
    projectsTitle: 'Sélection de nos projets',
    projectsLead: 'Projets résidentiels et commerciaux réalisés avec précision et dans les délais.',
    processTitle: 'Comment nous réalisons votre projet',
    processLead: 'De l\'étude à la livraison, nous suivons chaque étape avec une transparence totale.',
    step1: 'Étude et conception', step1d: 'Nous étudions le site et concevons le plan architectural approprié.',
    step2: 'Exécution', step2d: 'Nous exécutons les travaux selon les spécifications et le calendrier convenu.',
    step3: 'Suivi', step3d: 'Nous assurons un suivi quotidien de l\'avancement et de la qualité.',
    step4: 'Livraison', step4d: 'Nous livrons le projet avec une garantie écrite sur la qualité.',
    teamEyebrow: 'Équipe de l\'entreprise',
    teamTitle: 'Une équipe de construction professionnelle',
    teamLead: 'Une équipe d\'ingénieurs et de techniciens expérimentés en construction et rénovation.',
    aboutTitle: 'Entreprise de construction Al Matin',
    aboutLead: 'Une entreprise de construction agréée réalisant tous les travaux de bâtiment avec une équipe professionnelle et une garantie écrite, de l\'étude à la livraison.',
    feat1: 'Garantie écrite', feat1d: 'Garantie sur la qualité de l\'exécution et les matériaux utilisés.',
    feat2: 'Équipe professionnelle', feat2d: 'Ingénieurs et techniciens expérimentés dans tous les travaux BTP.',
    feat3: 'Matériaux fiables', feat3d: 'Matériaux de construction authentiques et conformes aux normes.',
    feat4: 'Livraison dans les délais', feat4d: 'Respect du calendrier et livraison du projet à la date prévue.',
    stats: [['+10', 'ans d’expérience'], ['+150', 'projets'], ['98%', 'satisfaction client'], ['Garantie', 'd\'exécution']],
    quotes: [
      { text: 'L\'entreprise a réalisé une villa résidentielle avec une haute qualité et dans les délais, je la recommande.', name: 'Khalid B.', role: 'Client' },
      { text: 'Une équipe professionnelle en rénovation et peinture, le travail était excellent et le prix raisonnable.', name: 'Fatima T.', role: 'Cliente' },
      { text: 'Construction d\'un local commercial parfaite, merci pour la garantie écrite et le suivi.', name: 'Salim A.', role: 'Commerçant' },
    ],
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Offrez-vous une garantie sur les travaux ?', 'Oui, nous offrons une garantie écrite sur la qualité de l\'exécution et les matériaux utilisés.'],
      ['Comment demander un devis ?', 'Remplissez le formulaire ou contactez-nous sur WhatsApp et nous vous répondrons dans les plus brefs délais.'],
      ['Réalisez-vous les travaux d\'électricité et de plomberie ?', 'Oui, nous exécutons et maintenons les réseaux intérieurs d\'électricité et de plomberie.'],
      ['Quels sont vos horaires ?', 'Nous travaillons du samedi au jeudi de 07:30 à 17:30.'],
      ['Travaillez-vous dans les zones éloignées ?', 'Oui, nous réalisons les travaux dans différents wilayas selon l\'accord.'],
    ],
    quoteTitle: 'Demandez un devis pour votre projet',
    quoteLead: 'Remplissez le formulaire et nous vous contacterons pour évaluer le projet et vous proposer un devis détaillé.',
    formTitle: 'Demande de devis',
    formSub: 'Dites-nous le type de travaux et nous vous répondrons dans les plus brefs délais.',
    confirm: 'Envoyer la demande de devis',
    summaryService: 'Type de service',
    summaryType: 'Type de projet',
    summaryWhen: 'Rendez-vous préféré',
    note: 'Toutes vos données sont protégées et confidentielles selon la politique de l\'entreprise.',
  },
  en: {
    heroBadge: 'Licensed construction company · Written guarantee',
    quoteCta: 'Request a quote',
    projectsCta: 'Our projects',
    openDaily: 'Open every day',
    guarantee: 'Execution guarantee',
    experience: 'years of experience',
    heroMessage: 'I want to build or renovate a property',
    servicesEyebrow: 'Construction services',
    servicesTitle: 'We execute all construction works with high quality',
    servicesLead: 'From structure to finishing, we perform all construction works with a professional team and reliable materials.',
    fallbackServices: [
      { title: 'Construction works', description: 'Structure, walls and concrete according to quality standards.' },
      { title: 'Renovation', description: 'Facade, roof renovation and humidity treatment.' },
      { title: 'Painting and decoration', description: 'Clean and durable finishing touches.' },
      { title: 'Electricity and plumbing', description: 'Execution and maintenance of internal networks.' },
    ],
    projectsEyebrow: 'Completed projects',
    projectsTitle: 'Selection of our projects',
    projectsLead: 'Residential and commercial projects we completed with precision and on time.',
    processTitle: 'How we complete your project',
    processLead: 'From study to delivery, we follow every step with full transparency.',
    step1: 'Study and design', step1d: 'We study the construction site and prepare the appropriate architectural design.',
    step2: 'Execution', step2d: 'We execute the works according to specifications and the agreed schedule.',
    step3: 'Follow-up', step3d: 'We carry out daily follow-up of work progress and execution quality.',
    step4: 'Delivery', step4d: 'We deliver the project with a written guarantee on execution quality.',
    teamEyebrow: 'Company team',
    teamTitle: 'Professional construction team',
    teamLead: 'A team of engineers and technicians experienced in construction and renovation.',
    aboutTitle: 'Al Matin Construction Company',
    aboutLead: 'A licensed construction company executing construction, renovation, painting and various works with a professional team and written guarantee, from study to delivery.',
    feat1: 'Written guarantee', feat1d: 'Guarantee on execution quality and materials used.',
    feat2: 'Professional team', feat2d: 'Engineers and technicians experienced in all construction works.',
    feat3: 'Reliable materials', feat3d: 'Authentic construction materials compliant with standards.',
    feat4: 'On-time delivery', feat4d: 'Commitment to the schedule and project delivery on time.',
    stats: [['+10', 'years of experience'], ['+150', 'projects'], ['98%', 'client satisfaction'], ['Written', 'guarantee']],
    quotes: [
      { text: 'The company completed a residential villa with high quality and on time, I recommend it.', name: 'Khalid B.', role: 'Client' },
      { text: 'A professional team in renovation and painting, the work was excellent and the price reasonable.', name: 'Fatima T.', role: 'Client' },
      { text: 'Perfect construction of a commercial shop, thank you for the written guarantee and follow-up.', name: 'Salim A.', role: 'Merchant' },
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Do you offer a guarantee on the works?', 'Yes, we offer a written guarantee on execution quality and materials used.'],
      ['How do I request a quote?', 'Fill out the form or contact us on WhatsApp and we will respond as soon as possible.'],
      ['Do you perform electrical and plumbing works?', 'Yes, we execute and maintain internal electrical and plumbing networks.'],
      ['What are your hours?', 'We work Saturday to Thursday from 07:30 to 17:30.'],
      ['Do you work in remote areas?', 'Yes, we perform works in different provinces by agreement.'],
    ],
    quoteTitle: 'Request a quote for your project',
    quoteLead: 'Fill out the form and we will contact you to evaluate the project and provide a detailed quote.',
    formTitle: 'Quote request',
    formSub: 'Tell us about the type of works and we will respond as soon as possible.',
    confirm: 'Send quote request',
    summaryService: 'Service type',
    summaryType: 'Project type',
    summaryWhen: 'Preferred appointment',
    note: 'All your data is protected and confidential according to the company policy.',
  },
};

function constructionCard(member: RenderTeamMember, copy: ConstructionCopy): string {
  const photo = member.photoUrl
    ? `<img src="${attr(member.photoUrl)}" alt="${attr(member.name)}" loading="lazy" decoding="async" width="700" height="700">`
    : `<span class="build-initials">${esc(initialsFor(member.name))}</span>`;
  return `<article class="build-card" data-reveal>
    <div class="build-avatar">${photo}</div>
    <h3>${esc(member.name)}</h3>
    <p class="build-role">${esc(member.role)}</p>
    ${member.specialty ? `<span class="build-specialty">${esc(member.specialty)}</span>` : ''}
    ${member.experience ? `<span class="build-exp">${icon('award')}${esc(member.experience)} ${esc(copy.experience)}</span>` : ''}
  </article>`;
}

export function constructionPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = CONSTRUCTION[lang];
  const services = config.services.length ? config.services : copy.fallbackServices;
  const projects = config.products.filter((p) => p.name);
  const team = config.team || [];
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const heroWa = waHref(config, `${copy.heroMessage} — ${config.siteName}`);
  const quoteWa = waHref(config, `طلب عرض سعر — ${config.siteName}`);

  return `<section class="hero build-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('shield')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#projects">${icon('briefcase')}${esc(copy.projectsCta)}</a>
          <a class="btn btn-wa" href="${attr(heroWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(copy.quoteCta)}</a>
        </div>
        <div class="build-badges">
          <span>${icon('shield')}${esc(copy.guarantee)}</span>
          <span>${icon('clock')}${esc(copy.openDaily)} · ${esc(config.hours || '07:30 — 17:30')}</span>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media build-hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('shield')}</span><div><strong>${esc(copy.guarantee)}</strong><span>${esc(config.city || '')}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('shield')}${esc(copy.guarantee)}</span>
    <span class="trust-item">${icon('home')}${esc(s.quality)}</span>
    <span class="trust-item">${icon('award')}${esc(s.satisfaction)}</span>
    <span class="trust-item">${icon('target')}${esc(s.projects)}</span>
  </div></div>

  <section class="section bg-soft" id="services">
    <div class="container">
      ${sectionHead(copy.servicesEyebrow, copy.servicesTitle, copy.servicesLead)}
      <div class="build-service-grid">
        ${services.map((service, i) => `<article class="build-service" data-reveal>
          <span class="service-num">${String(i + 1).padStart(2, '0')}</span>
          <div><h3 class="h3">${esc(service.title)}</h3><p>${esc(service.description)}</p></div>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="projects">
    <div class="container">
      ${sectionHead(copy.projectsEyebrow, copy.projectsTitle, copy.projectsLead)}
      <div class="showcase-grid">${projects.length ? projects.map((p) => `<article class="showcase-card" data-reveal>
        <div class="showcase-media">${p.imageUrl
          ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="600" height="450">`
          : productPlaceholder(p.name)}</div>
        <div class="showcase-body">
          ${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}
          <h3>${esc(p.name)}</h3>
          ${p.description ? `<p>${esc(p.description)}</p>` : ''}
        </div>
      </article>`).join('') : `<div class="project-empty">${esc(s.emptyCart)}</div>`}</div>
    </div>
  </section>

  <section class="section" id="process">
    <div class="container">
      ${sectionHead(copy.processTitle, copy.processLead, undefined, true)}
      <div class="steps">
        ${[
          [copy.step1, copy.step1d],
          [copy.step2, copy.step2d],
          [copy.step3, copy.step3d],
          [copy.step4, copy.step4d],
        ].map(([title, desc], i) => `<div class="step" data-reveal><div class="n">${i + 1}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`).join('')}
      </div>
    </div>
  </section>

  ${team.length ? `<section class="section bg-soft" id="team">
    <div class="container">
      ${sectionHead(copy.teamEyebrow, copy.teamTitle, copy.teamLead, true)}
      <div class="build-team-grid">${team.map((m) => constructionCard(m, copy)).join('')}</div>
    </div>
  </section>` : ''}

  <section class="section" id="about">
    <div class="container about-grid build-about-grid">
      <div class="build-about-media" data-reveal>
        ${about ? `<img class="main" src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="760">` : ''}
        <div class="about-badge">${icon('check')}+10 ${esc(s.years)}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(config.siteName)}</h2>
        <p class="lead mt-2">${esc(config.description)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)} — ${esc(copy.feat1d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)} — ${esc(copy.feat2d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)} — ${esc(copy.feat3d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat4)} — ${esc(copy.feat4d)}</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="quote">
    <div class="container quote-wrap">
      <div class="quote-copy" data-reveal>
        <span class="eyebrow">${esc(s.appointment)}</span>
        <h2 class="h2 mt-2">${esc(copy.quoteTitle)}</h2>
        <p class="lead mt-2">${esc(copy.quoteLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.note)}</span></li>
        </ul>
        <div class="build-hours">
          <div class="hours-row"><span>${icon('clock')}${esc(s.hours)}</span><strong>${esc(config.hours || '07:30 — 17:30')}</strong></div>
          <div class="hours-row"><span>${icon('map')}${esc(s.location)}</span><strong>${esc(config.address || config.city || '')}</strong></div>
        </div>
        <div class="build-contact-actions">
          <a class="btn btn-light" href="tel:${attr(config.phone)}">${icon('phone')}${esc(s.callNow)}</a>
          <a class="btn btn-wa" href="${attr(quoteWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
      </div>
      <form class="quote-card" data-lead-form data-lead-kind="quote" novalidate>
        <h3>${esc(copy.formTitle)}</h3>
        <p class="booking-sub">${esc(copy.formSub)}</p>
        <div class="form-grid">
          <div class="field"><label for="quo-name">${esc(s.name)}</label><input id="quo-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="quo-phone">${esc(s.phone)}</label><input id="quo-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field full"><label for="quo-email">${esc(s.email)}</label><input id="quo-email" name="email" type="email" maxlength="120" autocomplete="email" dir="ltr"></div>
          <div class="field full"><label for="quo-service">${esc(copy.summaryService)}</label><input id="quo-service" name="serviceType" maxlength="200"></div>
          <div class="field full"><label for="quo-type">${esc(copy.summaryType)}</label><input id="quo-type" name="projectType" maxlength="200"></div>
          <div class="field full"><label for="quo-msg">${esc(s.message)}</label><textarea id="quo-msg" name="message" required maxlength="1200"></textarea><span class="err">${esc(s.required)}</span></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('send')}${esc(copy.confirm)}</button>
        <div class="form-status" role="status"></div>
        <p class="form-note center mt-2">${esc(copy.note)}</p>
      </form>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.faqTitle, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * HOTEL
 * ---------------------------------------------------------------------- */
interface HotelCopy {
  heroBadge: string;
  bookCta: string;
  roomsCta: string;
  openDaily: string;
  luxury: string;
  experience: string;
  heroMessage: string;
  roomsEyebrow: string;
  roomsTitle: string;
  roomsLead: string;
  ratesEyebrow: string;
  ratesTitle: string;
  ratesLead: string;
  rooms: Array<{ icon: string; title: string; description: string }>;
  servicesEyebrow: string;
  servicesTitle: string;
  servicesLead: string;
  fallbackServices: Array<{ title: string; description: string }>;
  amenitiesEyebrow: string;
  amenitiesTitle: string;
  amenitiesLead: string;
  amenities: string[];
  processTitle: string;
  processLead: string;
  step1: string; step1d: string;
  step2: string; step2d: string;
  step3: string; step3d: string;
  step4: string; step4d: string;
  teamEyebrow: string;
  teamTitle: string;
  teamLead: string;
  aboutTitle: string;
  aboutLead: string;
  feat1: string; feat1d: string;
  feat2: string; feat2d: string;
  feat3: string; feat3d: string;
  feat4: string; feat4d: string;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
  faqTitle: string;
  faq: Array<[string, string]>;
  bookTitle: string;
  bookLead: string;
  formTitle: string;
  formSub: string;
  confirm: string;
  summaryRoom: string;
  summaryNights: string;
  summaryWhen: string;
  note: string;
}

const HOTEL: Record<Lang, HotelCopy> = {
  ar: {
    heroBadge: 'فندق خمس نجوم · إقامة فاخرة',
    bookCta: 'احجز إقامتك',
    roomsCta: 'غرفنا وأجنحتنا',
    openDaily: 'مفتوح على مدار الساعة',
    luxury: 'رفاهية لا تضاهى',
    experience: 'سنوات الخبرة',
    heroMessage: 'أريد حجز غرفة أو جناح',
    roomsEyebrow: 'الإقامة الفاخرة',
    roomsTitle: 'غرف وأجنحة مصممة لراحتك',
    roomsLead: 'من الغرف الكلاسيكية إلى الأجنحة الملكية، كل تفاصيل إقامتك مصممة بعناية.',
    ratesEyebrow: 'الأسعار والإقامة',
    ratesTitle: 'اختر غرفتك وأسعارك',
    ratesLead: 'أسعار واضحة لكل غرفة وجناح، مع إمكانية الحجز المباشر عبر واتساب.',
    rooms: [
      { icon: 'home', title: 'غرفة كلاسيكية', description: 'غرفة مريحة مع سرير مزدوج وإطلالة على المدينة.' },
      { icon: 'home', title: 'غرفة ديلوكس', description: 'غرفة فسيحة مع كرسي استرخاء وإطلالة على البحر.' },
      { icon: 'users', title: 'جناح ملكي', description: 'جناح فاخر مع غرفة معيشة وخدمة ماستر.' },
      { icon: 'target', title: 'جناح عرس', description: 'جناح رومانسي مع شرفة خاصة وجاكوزي.' },
    ],
    servicesEyebrow: 'خدمات الفندق',
    servicesTitle: 'نقدّم لك إقامة لا تُنسى',
    servicesLead: 'من الاستقبال إلى المغادرة، نضمن لك تجربة ضيافة من الدرجة الأولى.',
    fallbackServices: [
      { title: 'غرف وأجنحة فاخرة', description: 'إقامة مريحة مع وسائل راحة حديثة وإطلالات مذهلة.' },
      { title: 'مطعم فاخر', description: 'أطباق عالمية ومحلية بأيدي طباخين محترفين.' },
      { title: 'منتجع صحي', description: 'سبا وساونا وعلاجات استرخاء وتجميل.' },
      { title: 'خدمة الغرف', description: 'خدمة على مدار الساعة لتلبية جميع احتياجاتك.' },
    ],
    amenitiesEyebrow: 'مرافق الفندق',
    amenitiesTitle: 'كل ما تحتاجه لإقامة مريحة',
    amenitiesLead: 'كل ما تحتاجه لإقامة مريحة',
    amenities: [
      'مسبح خارجي مُدفأ',
      'صالة لياقة بدنية مجهزة',
      'موقف سيارات خاص ومجاني',
      'إنترنت لاسلكي فائق السرعة',
      'مطعم ومقهى على مدار الساعة',
      'خدمة غرف على مدار الساعة',
    ],
    processTitle: 'كيف تحجز إقامتك',
    processLead: 'من اختيار الغرفة إلى تسجيل الوصول، نرافقك في كل خطوة.',
    step1: 'اختيار الغرفة', step1d: 'نساعدك في اختيار الغرفة أو الجناح المناسب لاحتياجاتك.',
    step2: 'الحجز', step2d: 'نحجز إقامتك ونؤكد التواريخ والسعر النهائي.',
    step3: 'الوصول', step3d: 'نستقبلك في الفندق ونقدم لك جولة تعريفية بالمرافق.',
    step4: 'الإقامة', step4d: 'نضمن لك إقامة مريحة مع خدمة على مدار الساعة.',
    teamEyebrow: 'فريق الضيافة',
    teamTitle: 'فريق في خدمتك على مدار الساعة',
    teamLead: 'فريق من موظفي الضيافة المدربين بأعلى معايير الاحترافية.',
    aboutTitle: 'فندق وقلعة الذهب',
    aboutLead: 'فندق خمس نجوم يقدّم غرفاً وأجنحة فاخرة، خدمات ضيافة عالمية، مطعم فاخر ومنتجع صحي، مع حجز مريح عبر واتساب.',
    feat1: 'إقامة فاخرة', feat1d: 'غرف وأجنحة فاخرة مع إطلالات مذهلة ووسائل راحة حديثة.',
    feat2: 'مطعم فاخر', feat2d: 'أطباق عالمية ومحلية بأيدي طباخين محترفين.',
    feat3: 'منتجع صحي', feat3d: 'سبا وساونا وعلاجات استرخاء وتجميل.',
    feat4: 'خدمة على مدار الساعة', feat4d: 'فريق الضيافة في خدمتك طوال اليوم والليلة.',
    stats: [['+8', 'سنة خبرة'], ['+120', 'غرفة وجناح'], ['98%', 'رضا النزلاء'], ['24/7', 'خدمة الضيافة']],
    quotes: [
      { text: 'إقامة فاخرة في أبهى صورة، الغرف نظيفة جداً والخدمة ممتازة، أنصح بالفندق بشدة.', name: 'سارة خ.', role: 'نزيلة' },
      { text: 'فندق رائع، الإطلالة من الغرفة رائعة، والمطعم يقدم أشهى الأطباق.', name: 'محمد ب.', role: 'نزيل' },
      { text: 'منتجع صحي رائع، الاسترخاء والتدليك كانا ممتازين، شكراً لفريق الفندق.', name: 'نورى ع.', role: 'نزل' },
    ],
    faqTitle: 'أسئلة شائعة',
    faq: [
      ['كيف أحجز غرفة؟', 'يمكنك الحجز عبر النموذج أو التواصل معنا عبر واتساب.'],
      ['هل يوجد مواقف سيارات؟', 'نعم، يتوفر موقف سيارات خاص ومجاني للنزلاء.'],
      ['هل يشمل السعر وجبة الإفطار؟', 'باقات الإقامة تشمل وجبة الإفطار المجانية.'],
      ['ما هي أوقات تسجيل الوصول والمغادرة؟', 'تسجيل الوصول من الساعة 15:00، والمغادرة حتى الساعة 12:00.'],
      ['هل يمكنني إلغاء الحجز؟', 'نعم، يمكن إلغاء الحجز مجاناً قبل 24 ساعة من الوصول.'],
    ],
    bookTitle: 'احجز إقامتك الفاخرة',
    bookLead: 'املأ النموذج وسنتصل بك لتأكيد الحجز وتحديد تفاصيل إقامتك.',
    formTitle: 'طلب حجز فندق',
    formSub: 'أخبرنا عن نوع الغرفة ومدة الإقامة وسنرد عليك في أقرب وقت.',
    confirm: 'إرسال طلب الحجز',
    summaryRoom: 'نوع الغرفة',
    summaryNights: 'عدد الليالي',
    summaryWhen: 'تاريخ الوصول',
    note: 'جميع بياناتك محمية وسرية وفقاً لسياسة الفندق.',
  },
  fr: {
    heroBadge: 'Hôtel 5 étoiles · Séjour de luxe',
    bookCta: 'Réservez votre séjour',
    roomsCta: 'Nos chambres et suites',
    openDaily: 'Ouvert 24h/24',
    luxury: 'Luxure incomparable',
    experience: 'ans d’expérience',
    heroMessage: 'Je souhaite réserver une chambre ou une suite',
    roomsEyebrow: 'Hébergement de luxe',
    roomsTitle: 'Chambres et suites conçues pour votre confort',
    roomsLead: 'Des chambres classiques aux suites royales, chaque détail de votre séjour est soigneusement conçu.',
    ratesEyebrow: 'Tarifs et séjours',
    ratesTitle: 'Choisissez votre chambre et votre tarif',
    ratesLead: 'Des tarifs clairs pour chaque chambre et suite, avec réservation directe via WhatsApp.',
    rooms: [
      { icon: 'home', title: 'Chambre classique', description: 'Chambre confortable avec lit double et vue sur la ville.' },
      { icon: 'home', title: 'Chambre deluxe', description: 'Chambre spacieuse avec fauteuil et vue sur la mer.' },
      { icon: 'users', title: 'Suite royale', description: 'Suite luxueuse avec salon et service maître.' },
      { icon: 'target', title: 'Suite lune de miel', description: 'Suite romantique avec terrasse privée et jacuzzi.' },
    ],
    servicesEyebrow: 'Services de l’hôtel',
    servicesTitle: 'Nous vous offrons un séjour inoubliable',
    servicesLead: 'De la réception au départ, nous vous garantissons une expérience hôtelière de premier ordre.',
    fallbackServices: [
      { title: 'Chambres et suites de luxe', description: 'Séjour confortable avec équipements modernes et vues imprenables.' },
      { title: 'Restaurant gastronomique', description: 'Plats internationaux et locaux par des chefs professionnels.' },
      { title: 'Spa et bien-être', description: 'Spa, sauna et soins de détente et de beauté.' },
      { title: 'Service en chambre', description: 'Service 24h/24 pour répondre à tous vos besoins.' },
    ],
    amenitiesEyebrow: 'Équipements de l’hôtel',
    amenitiesTitle: 'Tout ce dont vous avez besoin pour un séjour confortable',
    amenitiesLead: 'Tout ce dont vous avez besoin pour un séjour confortable',
    amenities: [
      'Piscine extérieure chauffée',
      'Salle de sport entièrement équipée',
      'Parking privé et gratuit',
      'Wi-Fi haut débit',
      'Restaurant et café ouverts 24h/24',
      'Service en chambre 24h/24',
    ],
    processTitle: 'Comment réserver votre séjour',
    processLead: 'Du choix de la chambre à l\'arrivée, nous vous accompagnons à chaque étape.',
    step1: 'Choix de la chambre', step1d: 'Nous vous aidons à choisir la chambre ou la suite adaptée à vos besoins.',
    step2: 'Réservation', step2d: 'Nous réservons votre séjour et confirmons les dates et le prix final.',
    step3: 'Arrivée', step3d: 'Nous vous accueillons à l\'hôtel et vous faisons visiter les installations.',
    step4: 'Séjour', step4d: 'Nous vous garantissons un séjour confortable avec un service 24h/24.',
    teamEyebrow: 'Équipe d’hospitalité',
    teamTitle: 'Une équipe à votre service 24h/24',
    teamLead: 'Une équipe de professionnels de l’hospitalité formés aux plus hauts standards.',
    aboutTitle: 'Hôtel et Château d’Or',
    aboutLead: 'Un hôtel 5 étoiles proposant chambres et suites de luxe, services hôteliers internationaux, restaurant gastronomique et spa, avec réservation facile via WhatsApp.',
    feat1: 'Séjour de luxe', feat1d: 'Chambres et suites de luxe avec vues imprenables et équipements modernes.',
    feat2: 'Restaurant gastronomique', feat2d: 'Plats internationaux et locaux par des chefs professionnels.',
    feat3: 'Spa et bien-être', feat3d: 'Spa, sauna et soins de détente et de beauté.',
    feat4: 'Service 24h/24', feat4d: 'L\'équipe d’hospitalité à votre service jour et nuit.',
    stats: [['+8', 'ans d’expérience'], ['+120', 'chambres et suites'], ['98%', 'satisfaction clients'], ['24/7', 'service hôtelier']],
    quotes: [
      { text: 'Un séjour de luxe magnifique, les chambres sont très propres et le service excellent, je recommande vivement cet hôtel.', name: 'Sarah K.', role: 'Cliente' },
      { text: 'Un hôtel superbe, la vue depuis la chambre est magnifique, et le restaurant propose les meilleurs plats.', name: 'Mohamed B.', role: 'Client' },
      { text: 'Un spa formidable, détente et massages excellents, merci à l\'équipe de l\'hôtel.', name: 'Nouri A.', role: 'Client' },
    ],
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Comment réserver une chambre ?', 'Vous pouvez réserver via le formulaire ou nous contacter sur WhatsApp.'],
      ['Y a-t-il un parking ?', 'Oui, un parking privé et gratuit est disponible pour les clients.'],
      ['Le petit-déjeuner est-il inclus ?', 'Les forfaits de séjour incluent le petit-déjeuner gratuit.'],
      ['Quelles sont les heures d\'arrivée et de départ ?', 'L\'arrivée à partir de 15h00, le départ jusqu\'à 12h00.'],
      ['Puis-je annuler ma réservation ?', 'Oui, l\'annulation est gratuite jusqu\'à 24h avant l\'arrivée.'],
    ],
    bookTitle: 'Réservez votre séjour de luxe',
    bookLead: 'Remplissez le formulaire et nous vous contacterons pour confirmer votre réservation et préciser les détails de votre séjour.',
    formTitle: 'Demande de réservation d’hôtel',
    formSub: 'Dites-nous le type de chambre et la durée du séjour et nous vous répondrons dans les plus brefs délais.',
    confirm: 'Envoyer la demande de réservation',
    summaryRoom: 'Type de chambre',
    summaryNights: 'Nombre de nuits',
    summaryWhen: 'Date d\'arrivée',
    note: 'Toutes vos données sont protégées et confidentielles selon la politique de l’hôtel.',
  },
  en: {
    heroBadge: '5-Star Hotel · Luxury Stay',
    bookCta: 'Book your stay',
    roomsCta: 'Our rooms and suites',
    openDaily: 'Open 24/7',
    luxury: 'Unmatched luxury',
    experience: 'years of experience',
    heroMessage: 'I want to book a room or suite',
    roomsEyebrow: 'Luxury accommodation',
    roomsTitle: 'Rooms and suites designed for your comfort',
    roomsLead: 'From classic rooms to royal suites, every detail of your stay is carefully designed.',
    ratesEyebrow: 'Rates & stays',
    ratesTitle: 'Choose your room and rate',
    ratesLead: 'Clear rates for every room and suite, with direct booking via WhatsApp.',
    rooms: [
      { icon: 'home', title: 'Classic Room', description: 'Comfortable room with double bed and city view.' },
      { icon: 'home', title: 'Deluxe Room', description: 'Spacious room with lounge chair and sea view.' },
      { icon: 'users', title: 'Royal Suite', description: 'Luxury suite with living room and butler service.' },
      { icon: 'target', title: 'Honeymoon Suite', description: 'Romantic suite with private terrace and jacuzzi.' },
    ],
    servicesEyebrow: 'Hotel services',
    servicesTitle: 'We offer you an unforgettable stay',
    servicesLead: 'From reception to departure, we ensure a first-class hospitality experience.',
    fallbackServices: [
      { title: 'Luxury rooms and suites', description: 'Comfortable stay with modern amenities and stunning views.' },
      { title: 'Fine dining restaurant', description: 'International and local dishes by professional chefs.' },
      { title: 'Spa and wellness', description: 'Spa, sauna and relaxation and beauty treatments.' },
      { title: 'Room service', description: '24/7 service to meet all your needs.' },
    ],
    amenitiesEyebrow: 'Hotel amenities',
    amenitiesTitle: 'Everything you need for a comfortable stay',
    amenitiesLead: 'Everything you need for a comfortable stay',
    amenities: [
      'Heated outdoor pool',
      'Fully equipped fitness center',
      'Private and free parking',
      'High-speed Wi-Fi',
      'Restaurant and café open 24/7',
      'Room service 24/7',
    ],
    processTitle: 'How to book your stay',
    processLead: 'From choosing your room to check-in, we accompany you at every step.',
    step1: 'Room selection', step1d: 'We help you choose the right room or suite for your needs.',
    step2: 'Booking', step2d: 'We book your stay and confirm dates and final price.',
    step3: 'Arrival', step3d: 'We welcome you at the hotel and give you a tour of the facilities.',
    step4: 'Stay', step4d: 'We ensure a comfortable stay with 24/7 service.',
    teamEyebrow: 'Hospitality team',
    teamTitle: 'A team at your service 24/7',
    teamLead: 'A team of hospitality professionals trained to the highest standards.',
    aboutTitle: 'Hotel & Castle of Gold',
    aboutLead: 'A 5-star hotel offering luxury rooms and suites, world-class hospitality services, fine dining restaurant and spa, with easy booking via WhatsApp.',
    feat1: 'Luxury stay', feat1d: 'Luxury rooms and suites with stunning views and modern amenities.',
    feat2: 'Fine dining restaurant', feat2d: 'International and local dishes by professional chefs.',
    feat3: 'Spa and wellness', feat3d: 'Spa, sauna and relaxation and beauty treatments.',
    feat4: '24/7 service', feat4d: 'Hospitality team at your service day and night.',
    stats: [['+8', 'years of experience'], ['+120', 'rooms and suites'], ['98%', 'guest satisfaction'], ['24/7', 'hospitality service']],
    quotes: [
      { text: 'A magnificent luxury stay, the rooms are very clean and the service excellent, I highly recommend this hotel.', name: 'Sarah K.', role: 'Guest' },
      { text: 'A superb hotel, the view from the room is magnificent, and the restaurant offers the best dishes.', name: 'Mohamed B.', role: 'Guest' },
      { text: 'A wonderful spa, relaxation and massages were excellent, thank you to the hotel team.', name: 'Nouri A.', role: 'Guest' },
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['How do I book a room?', 'You can book via the form or contact us on WhatsApp.'],
      ['Is there parking?', 'Yes, private and free parking is available for guests.'],
      ['Is breakfast included?', 'Stay packages include free breakfast.'],
      ['What are check-in and check-out times?', 'Check-in from 15:00, check-out until 12:00.'],
      ['Can I cancel my booking?', 'Yes, cancellation is free up to 24 hours before arrival.'],
    ],
    bookTitle: 'Book your luxury stay',
    bookLead: 'Fill out the form and we will contact you to confirm your booking and clarify your stay details.',
    formTitle: 'Hotel booking request',
    formSub: 'Tell us about the room type and length of stay and we will respond as soon as possible.',
    confirm: 'Send booking request',
    summaryRoom: 'Room type',
    summaryNights: 'Number of nights',
    summaryWhen: 'Arrival date',
    note: 'All your data is protected and confidential according to the hotel policy.',
  },
};

function hotelCard(member: RenderTeamMember, copy: HotelCopy): string {
  const photo = member.photoUrl
    ? `<img src="${attr(member.photoUrl)}" alt="${attr(member.name)}" loading="lazy" decoding="async" width="700" height="700">`
    : `<span class="hotel-initials">${esc(initialsFor(member.name))}</span>`;
  return `<article class="hotel-card" data-reveal>
    <div class="hotel-avatar">${photo}</div>
    <h3>${esc(member.name)}</h3>
    <p class="hotel-role">${esc(member.role)}</p>
    ${member.specialty ? `<span class="hotel-specialty">${esc(member.specialty)}</span>` : ''}
    ${member.experience ? `<span class="hotel-exp">${icon('award')}${esc(member.experience)} ${esc(copy.experience)}</span>` : ''}
  </article>`;
}

function roomCard(p: RenderProduct, config: RenderConfig, s: UiStrings, lang: Lang): string {
  const image = p.imageUrl
    ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="600" height="450">`
    : productPlaceholder(p.name);
  return `<article class="room-card" data-reveal data-room-card data-category="${attr(p.category || '')}" data-name="${attr(p.name)}" data-desc="${attr(p.description || '')}">
    <div class="room-thumb">${image}</div>
    <div class="room-body">
      ${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      ${p.price > 0 ? `<span class="price">${money(p.price, lang)}</span>` : ''}
      <a class="btn btn-wa btn-block mt-3" href="${attr(waHref(config, `أريد حجز غرفة: ${p.name} — ${p.description || ''}`))}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.orderNow)}</a>
    </div>
  </article>`;
}

export function hotelPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = HOTEL[lang];
  const rooms = config.products.filter((p) => p.name);
  const team = config.team || [];
  const services = config.services.length ? config.services : copy.fallbackServices;
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const heroWa = waHref(config, `${copy.heroMessage} — ${config.siteName}`);
  const bookWa = waHref(config, `${copy.bookTitle} — ${config.siteName}`);

  return `<section class="hero hotel-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('home')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#rooms">${icon('home')}${esc(copy.roomsCta)}</a>
          <a class="btn btn-wa" href="${attr(heroWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(copy.bookCta)}</a>
        </div>
        <div class="hotel-badges">
          <span>${icon('shield')}${esc(copy.luxury)}</span>
          <span>${icon('clock')}${esc(copy.openDaily)} · ${esc(config.hours || '24/7')}</span>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media hotel-hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('home')}</span><div><strong>${esc(copy.luxury)}</strong><span>${esc(config.city || '')}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('shield')}${esc(copy.luxury)}</span>
    <span class="trust-item">${icon('home')}${esc(s.quality)}</span>
    <span class="trust-item">${icon('award')}${esc(s.satisfaction)}</span>
    <span class="trust-item">${icon('target')}${esc(s.projects)}</span>
  </div></div>

  <section class="section bg-soft" id="rooms">
    <div class="container">
      ${sectionHead(copy.roomsEyebrow, copy.roomsTitle, copy.roomsLead, true)}
      <div class="hotel-rooms-grid">
        ${copy.rooms.map((item, i) => `<article class="room-type-card" data-reveal>
          <span class="room-type-icon">${icon(item.icon as any)}</span>
          <h3 class="h3">${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="listings">
    <div class="container">
      ${sectionHead(copy.ratesEyebrow, copy.ratesTitle, copy.ratesLead)}
      <div class="room-grid">${rooms.length ? rooms.map((p) => roomCard(p, config, s, lang)).join('') : `<div class="room-empty">${esc(s.emptyCart)}</div>`}</div>
    </div>
  </section>

  <section class="section" id="services">
    <div class="container">
      ${sectionHead(copy.servicesEyebrow, copy.servicesTitle, copy.servicesLead)}
      <div class="hotel-service-grid">
        ${services.map((service, i) => `<article class="hotel-service" data-reveal>
          <span class="service-num">${String(i + 1).padStart(2, '0')}</span>
          <div><h3 class="h3">${esc(service.title)}</h3><p>${esc(service.description)}</p></div>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="amenities">
    <div class="container">
      ${sectionHead(copy.amenitiesEyebrow, copy.amenitiesTitle, copy.amenitiesLead)}
      <div class="amenities-grid">
        ${copy.amenities.map((amenity, i) => `<article class="amenity-card" data-reveal>
          <span class="amenity-icon">${icon('check')}</span>
          <h3 class="h3">${esc(amenity)}</h3>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="process">
    <div class="container">
      ${sectionHead(copy.processTitle, copy.processLead, undefined, true)}
      <div class="steps">
        ${[
          [copy.step1, copy.step1d],
          [copy.step2, copy.step2d],
          [copy.step3, copy.step3d],
          [copy.step4, copy.step4d],
        ].map(([title, desc], i) => `<div class="step" data-reveal><div class="n">${i + 1}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`).join('')}
      </div>
    </div>
  </section>

  ${team.length ? `<section class="section bg-soft" id="team">
    <div class="container">
      ${sectionHead(copy.teamEyebrow, copy.teamTitle, copy.teamLead, true)}
      <div class="hotel-team-grid">${team.map((m) => hotelCard(m, copy)).join('')}</div>
    </div>
  </section>` : ''}

  <section class="section" id="about">
    <div class="container about-grid hotel-about-grid">
      <div class="hotel-about-media" data-reveal>
        ${about ? `<img class="main" src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="760">` : ''}
        <div class="about-badge">${icon('check')}+8 ${esc(s.years)}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(config.siteName)}</h2>
        <p class="lead mt-2">${esc(config.description)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)} — ${esc(copy.feat1d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)} — ${esc(copy.feat2d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)} — ${esc(copy.feat3d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat4)} — ${esc(copy.feat4d)}</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="book">
    <div class="container book-wrap">
      <div class="book-copy" data-reveal>
        <span class="eyebrow">${esc(s.appointment)}</span>
        <h2 class="h2 mt-2">${esc(copy.bookTitle)}</h2>
        <p class="lead mt-2">${esc(copy.bookLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.note)}</span></li>
        </ul>
        <div class="hotel-hours">
          <div class="hours-row"><span>${icon('clock')}${esc(s.hours)}</span><strong>${esc(config.hours || '24/7')}</strong></div>
          <div class="hours-row"><span>${icon('map')}${esc(s.location)}</span><strong>${esc(config.address || config.city || '')}</strong></div>
        </div>
        <div class="hotel-contact-actions">
          <a class="btn btn-light" href="tel:${attr(config.phone)}">${icon('phone')}${esc(s.callNow)}</a>
          <a class="btn btn-wa" href="${attr(bookWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
      </div>
      <form class="book-card" data-lead-form data-lead-kind="hotel-booking" novalidate>
        <h3>${esc(copy.formTitle)}</h3>
        <p class="booking-sub">${esc(copy.formSub)}</p>
        <div class="form-grid">
          <div class="field"><label for="bok-name">${esc(s.name)}</label><input id="bok-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="bok-phone">${esc(s.phone)}</label><input id="bok-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field full"><label for="bok-email">${esc(s.email)}</label><input id="bok-email" name="email" type="email" maxlength="120" autocomplete="email" dir="ltr"></div>
          <div class="field full"><label for="bok-room">${esc(copy.summaryRoom)}</label><input id="bok-room" name="roomType" maxlength="200"></div>
          <div class="field full"><label for="bok-nights">${esc(copy.summaryNights)}</label><input id="bok-nights" name="nights" type="number" min="1" maxlength="10"></div>
          <div class="field full"><label for="bok-date">${esc(copy.summaryWhen)}</label><input id="bok-date" name="arrivalDate" type="date"></div>
          <div class="field full"><label for="bok-msg">${esc(s.message)}</label><textarea id="bok-msg" name="message" required maxlength="1200"></textarea><span class="err">${esc(s.required)}</span></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('send')}${esc(copy.confirm)}</button>
        <div class="form-status" role="status"></div>
        <p class="form-note center mt-2">${esc(copy.note)}</p>
      </form>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.faqTitle, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * SHOWROOM
 * ---------------------------------------------------------------------- */
interface ShowroomCopy {
  heroBadge: string;
  bookCta: string;
  carsCta: string;
  openDaily: string;
  warranty: string;
  experience: string;
  heroMessage: string;
  categoriesEyebrow: string;
  categoriesTitle: string;
  categoriesLead: string;
  categories: Array<{ icon: string; title: string; description: string }>;
  carsEyebrow: string;
  carsTitle: string;
  carsLead: string;
  financingEyebrow: string;
  financingTitle: string;
  financingLead: string;
  financing: Array<{ title: string; description: string }>;
  processTitle: string;
  processLead: string;
  step1: string; step1d: string;
  step2: string; step2d: string;
  step3: string; step3d: string;
  step4: string; step4d: string;
  teamEyebrow: string;
  teamTitle: string;
  teamLead: string;
  aboutTitle: string;
  aboutLead: string;
  feat1: string; feat1d: string;
  feat2: string; feat2d: string;
  feat3: string; feat3d: string;
  feat4: string; feat4d: string;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
  faqTitle: string;
  faq: Array<[string, string]>;
  quoteTitle: string;
  quoteLead: string;
  formTitle: string;
  formSub: string;
  confirm: string;
  summaryModel: string;
  summaryFinance: string;
  summaryWhen: string;
  note: string;
}

const SHOWROOM: Record<Lang, ShowroomCopy> = {
  ar: {
    heroBadge: 'صالة عرض سيارات فاخرة · ضمان شامل',
    bookCta: 'اطلب عرض سعر',
    carsCta: 'سياراتنا',
    openDaily: 'مفتوح يومياً',
    warranty: 'ضمان شامل',
    experience: 'سنوات الخبرة',
    heroMessage: 'أريد شراء أو استئجار سيارة',
    categoriesEyebrow: 'فئات السيارات',
    categoriesTitle: 'سيارات لكل طريق وكل ميزانية',
    categoriesLead: 'من السيارات الاقتصادية إلى الفاخرة، نقدم لك أفضل الخيارات.',
    categories: [
      { icon: 'home', title: 'سيارات عائلية', description: 'سيارات مريحة وموفرة للعائلات.' },
      { icon: 'users', title: 'سيارات فاخرة', description: 'سيارات رباعية الدفع وسيارات سيدان فاخرة.' },
      { icon: 'target', title: 'سيارات رياضية', description: 'سيارات كوبيه ورياضية بأداء عالٍ.' },
      { icon: 'truck', title: 'شاحنات ومركبات', description: 'شاحنات ومركبات تجارية للعمل الشاق.' },
    ],
    carsEyebrow: 'سيارات متاحة',
    carsTitle: 'تشكيلة صالتنا',
    carsLead: 'سيارات جديدة ومستعملة مع ضمان شامل وخيارات تقسيط مرنة.',
    financingEyebrow: 'خيارات التمويل',
    financingTitle: 'تمويل يناسب ميزانيتك',
    financingLead: 'أقساط مرنة وبدل أول منخفض لاقتناء سيارتك الأحلام.',
    financing: [
      { title: 'تمويل بنكي', description: 'قروض سيارة بفوائد منخفضة وبديل أول مرن.' },
      { title: 'تأجير تمويلي', description: 'استئجار مع خيار الشراء في نهاية المدة.' },
      { title: 'تقسيط مباشر', description: 'تقسيط مباشر من الصالة دون تدخل بنوك.' },
    ],
    processTitle: 'كيف تحصل على سيارتك',
    processLead: 'من الاختيار إلى التسليم، نرافقك في كل خطوة.',
    step1: 'اختيار السيارة', step1d: 'نساعدك في اختيار السيارة المناسبة لاحتياجاتك وميزانيتك.',
    step2: 'التجربة', step2d: 'ننظم قيادة تجريبية للسيارة المختارة.',
    step3: 'التمويل والعقد', step3d: 'نعيد صياغة عقد البيع وننهي إجراءات التمويل.',
    step4: 'التسليم', step4d: 'نسلمك السيارة مع ضمان شامل وفحص شامل.',
    teamEyebrow: 'فريق المبيعات',
    teamTitle: 'فريق خبراء السيارات في خدمتك',
    teamLead: 'فريق من استشاريي المبيعات ذوي الخبرة في قطاع السيارات.',
    aboutTitle: 'صالة العرض الذهبي للسيارات',
    aboutLead: 'صالة عرض سيارات فاخرة تقدّم تشكيلة من السيارات الجديدة والمستعملة مع ضمان شامل، خيارات تقسيط مرنة، وخدمة عملاء متميزة.',
    feat1: 'ضمان شامل', feat1d: 'ضمان على المحرك والناقل والجسم لجميع السيارات.',
    feat2: 'فحص شامل', feat2d: 'كل سيارة تخضع لفحص شامل قبل العرض للبيع.',
    feat3: 'أسعار تنافسية', feat3d: 'أسعار شفافة مع إمكانية المقارنة والمساومة.',
    feat4: 'خدمة ما بعد البيع', feat4d: 'صيانة دورية وقطع غيار أصلية معguarantee.',
    stats: [['+10', 'سنة خبرة'], ['+200', 'سيارة'], ['98%', 'رضا العملاء'], ['ضمان', 'شامل']],
    quotes: [
      { text: 'اشترت سيارتي من هذه الصالة، الخدمة ممتازة والضمان شامل، أنصح بها.', name: 'خالد ب.', role: 'عميل' },
      { text: 'سيارة مستعملة بحالة جديدة، السعر مناسب والخدمة راقية.', name: 'فاطمة ت.', role: 'عميلة' },
      { text: 'عملية التقسيط كانت سلسة جداً، استلمت سيارتي في نفس اليوم.', name: 'سليم ع.', role: 'عميل' },
    ],
    faqTitle: 'أسئلة شائعة',
    faq: [
      ['هل السيارات مضمونة؟', 'نعم، جميع السيارات تأتي مع ضمان شامل وفحص شامل.'],
      ['هل يمكن التقسيط؟', 'نعم، نقدم خيارات تقسيط مرنة مع بنوك موثوقة.'],
      ['هل يمكن تجربة السيارة قبل الشراء؟', 'نعم، ننظم قيادة تجريبية لكل سيارة مهتم بها العميل.'],
      ['ما هي أوقات العمل؟', 'نعمل من السبت إلى الخميس من 09:00 إلى 19:00.'],
      ['هل توجد خدمة ما بعد البيع؟', 'نعم، نقدم صيانة دورية وقطع غيار أصلية.'],
    ],
    quoteTitle: 'اطلب عرض سعر لسيارتك',
    quoteLead: 'املأ النموذج وسنتصل بك لتقييم السيارة وتقديم عرض سعر تفصيلي.',
    formTitle: 'طلب عرض سعر سيارة',
    formSub: 'أخبرنا عن نوع السيارة والميزانية وسنرد عليك في أقرب وقت.',
    confirm: 'إرسال طلب العرض',
    summaryModel: 'موديل السيارة',
    summaryFinance: 'نوع التمويل',
    summaryWhen: 'الموعد المفضل',
    note: 'جميع بياناتك محمية وسرية وفقاً لسياسة الصالة.',
  },
  fr: {
    heroBadge: 'Showroom automobile de luxe · Garantie complète',
    bookCta: 'Demander un devis',
    carsCta: 'Nos voitures',
    openDaily: 'Ouvert tous les jours',
    warranty: 'Garantie complète',
    experience: 'ans d’expérience',
    heroMessage: 'Je souhaite acheter ou louer une voiture',
    categoriesEyebrow: 'Catégories de voitures',
    categoriesTitle: 'Des voitures pour chaque route et chaque budget',
    categoriesLead: 'Des voitures économiques aux véhicules de luxe, nous vous proposons les meilleures options.',
    categories: [
      { icon: 'home', title: 'Voitures familiales', description: 'Voitures confortables et économes pour les familles.' },
      { icon: 'users', title: 'Voitures de luxe', description: 'Véhicules SUV et berlines de luxe.' },
      { icon: 'target', title: 'Voitures sportives', description: 'Coupés et voitures de sport haute performance.' },
      { icon: 'truck', title: 'Camions et utilitaires', description: 'Camions et véhicules utilitaires pour travaux lourds.' },
    ],
    carsEyebrow: 'Voitures disponibles',
    carsTitle: 'Notre gamme',
    carsLead: 'Voitures neuves et d’occasion avec garantie complète et options de financement flexibles.',
    financingEyebrow: 'Options de financement',
    financingTitle: 'Un financement adapté à votre budget',
    financingLead: 'Mensualités flexibles et apport réduit pour acquérir la voiture de vos rêves.',
    financing: [
      { title: 'Crédit bancaire', description: 'Prêts auto à taux réduit et apport flexible.' },
      { title: 'Location avec option d’achat', description: 'Location avec possibilité d’achat en fin de contrat.' },
      { title: 'Paiement direct', description: 'Paiement échelonné directement au showroom sans banque.' },
    ],
    processTitle: 'Comment obtenir votre voiture',
    processLead: 'Du choix à la livraison, nous vous accompagnons à chaque étape.',
    step1: 'Choix du véhicule', step1d: 'Nous vous aidons à choisir le véhicule adapté à vos besoins et budget.',
    step2: 'Essai', step2d: 'Nous organisons un essai routier du véhicule sélectionné.',
    step3: 'Financement et contrat', step3d: 'Nous rédigeons le contrat de vente et finalisons le financement.',
    step4: 'Livraison', step4d: 'Nous vous livrons le véhicule avec garantie complète et contrôle.',
    teamEyebrow: 'Équipe commerciale',
    teamTitle: 'Une équipe d’experts automobiles à votre service',
    teamLead: 'Une équipe de conseillers commerciaux expérimentés dans le secteur automobile.',
    aboutTitle: 'Showroom automobile Or',
    aboutLead: 'Un showroom automobile de luxe proposant des voitures neuves et d’occasion avec garantie complète, options de financement flexibles et service client d’excellence.',
    feat1: 'Garantie complète', feat1d: 'Garantie moteur, boîte et carrosserie pour tous les véhicules.',
    feat2: 'Contrôle complet', feat2d: 'Chaque véhicule subit un contrôle complet avant la vente.',
    feat3: 'Prix compétitifs', feat3d: 'Prix transparents avec possibilité de comparaison et négociation.',
    feat4: 'Service après-vente', feat4d: 'Entretien régulier et pièces d’origine avec garantie.',
    stats: [['+10', 'ans d’expérience'], ['+200', 'voitures'], ['98%', 'satisfaction client'], ['Garantie', 'complète']],
    quotes: [
      { text: 'J’ai acheté ma voiture chez ce showroom, service excellent et garantie complète, je recommande.', name: 'Khalid B.', role: 'Client' },
      { text: 'Voiture d’occasion en excellent état, prix raisonnable et service haut de gamme.', name: 'Fatima T.', role: 'Cliente' },
      { text: 'Le processus de financement a été très fluide, j’ai reçu ma voiture le jour même.', name: 'Salim A.', role: 'Client' },
    ],
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Les voitures sont-elles garanties ?', 'Oui, tous les véhicules sont livrés avec garantie complète et contrôle complet.'],
      ['Puis-je payer en plusieurs fois ?', 'Oui, nous proposons des options de financement avec banques partenaires.'],
      ['Puis-je essayer la voiture avant achat ?', 'Oui, nous organisons un essai routier pour chaque véhicule qui vous intéresse.'],
      ['Quels sont vos horaires ?', 'Nous travaillons du samedi au jeudi de 09:00 à 19:00.'],
      ['Proposez-vous un service après-vente ?', 'Oui, nous assurons l’entretien régulier et les pièces d’origine.'],
    ],
    quoteTitle: 'Demandez un devis pour votre voiture',
    quoteLead: 'Remplissez le formulaire et nous vous contacterons pour évaluer le véhicule et vous proposer un devis détaillé.',
    formTitle: 'Demande de devis voiture',
    formSub: 'Dites-nous le type de véhicule et votre budget et nous vous répondrons dans les plus brefs délais.',
    confirm: 'Envoyer la demande de devis',
    summaryModel: 'Modèle de voiture',
    summaryFinance: 'Type de financement',
    summaryWhen: 'Rendez-vous préféré',
    note: 'Toutes vos données sont protégées et confidentielles selon la politique du showroom.',
  },
  en: {
    heroBadge: 'Luxury Car Showroom · Full Warranty',
    bookCta: 'Request a quote',
    carsCta: 'Our cars',
    openDaily: 'Open every day',
    warranty: 'Full warranty',
    experience: 'years of experience',
    heroMessage: 'I want to buy or rent a car',
    categoriesEyebrow: 'Car categories',
    categoriesTitle: 'Cars for every road and budget',
    categoriesLead: 'From economy cars to luxury vehicles, we offer you the best options.',
    categories: [
      { icon: 'home', title: 'Family Cars', description: 'Comfortable and fuel-efficient cars for families.' },
      { icon: 'users', title: 'Luxury Cars', description: 'Luxury SUVs and sedans.' },
      { icon: 'target', title: 'Sports Cars', description: 'Coupes and high-performance sports cars.' },
      { icon: 'truck', title: 'Trucks & Utility', description: 'Trucks and utility vehicles for heavy duty.' },
    ],
    carsEyebrow: 'Available cars',
    carsTitle: 'Our showroom collection',
    carsLead: 'New and used cars with full warranty and flexible financing options.',
    financingEyebrow: 'Financing options',
    financingTitle: 'Financing that fits your budget',
    financingLead: 'Flexible installments and low down payment to get your dream car.',
    financing: [
      { title: 'Bank loan', description: 'Auto loans with low rates and flexible down payment.' },
      { title: 'Lease with option to buy', description: 'Lease with purchase option at end of term.' },
      { title: 'Direct installment', description: 'Direct installment at the showroom without banks.' },
    ],
    processTitle: 'How to get your car',
    processLead: 'From selection to delivery, we accompany you at every step.',
    step1: 'Car selection', step1d: 'We help you choose the right car for your needs and budget.',
    step2: 'Test drive', step2d: 'We organize a test drive for the selected car.',
    step3: 'Financing and contract', step3d: 'We draft the sales contract and finalize financing.',
    step4: 'Delivery', step4d: 'We deliver the car with full warranty and inspection.',
    teamEyebrow: 'Sales team',
    teamTitle: 'Car experts at your service',
    teamLead: 'A team of experienced sales consultants in the automotive sector.',
    aboutTitle: 'Golden Car Showroom',
    aboutLead: 'A luxury car showroom offering new and used cars with full warranty, flexible installment options and excellent customer service.',
    feat1: 'Full warranty', feat1d: 'Warranty on engine, transmission and body for all cars.',
    feat2: 'Full inspection', feat2d: 'Every car undergoes full inspection before sale.',
    feat3: 'Competitive prices', feat3d: 'Transparent prices with possibility of comparison and negotiation.',
    feat4: 'After-sales service', feat4d: 'Regular maintenance and genuine spare parts with guarantee.',
    stats: [['+10', 'years of experience'], ['+200', 'cars'], ['98%', 'client satisfaction'], ['Full', 'warranty']],
    quotes: [
      { text: 'I bought my car from this showroom, excellent service and full warranty, I recommend it.', name: 'Khalid B.', role: 'Client' },
      { text: 'Used car in excellent condition, reasonable price and premium service.', name: 'Fatima T.', role: 'Client' },
      { text: 'The financing process was very smooth, I received my car the same day.', name: 'Salim A.', role: 'Client' },
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Are cars guaranteed?', 'Yes, all cars come with full warranty and full inspection.'],
      ['Can I pay in installments?', 'Yes, we offer flexible financing options with trusted banks.'],
      ['Can I test drive before buying?', 'Yes, we organize test drives for every car you are interested in.'],
      ['What are your hours?', 'We work Saturday to Thursday from 09:00 to 19:00.'],
      ['Do you offer after-sales service?', 'Yes, we offer regular maintenance and genuine spare parts.'],
    ],
    quoteTitle: 'Request a quote for your car',
    quoteLead: 'Fill out the form and we will contact you to evaluate the car and provide a detailed quote.',
    formTitle: 'Car quote request',
    formSub: 'Tell us about the car type and budget and we will respond as soon as possible.',
    confirm: 'Send quote request',
    summaryModel: 'Car model',
    summaryFinance: 'Finance type',
    summaryWhen: 'Preferred appointment',
    note: 'All your data is protected and confidential according to the showroom policy.',
  },
};

function showroomCard(member: RenderTeamMember, copy: ShowroomCopy): string {
  const photo = member.photoUrl
    ? `<img src="${attr(member.photoUrl)}" alt="${attr(member.name)}" loading="lazy" decoding="async" width="700" height="700">`
    : `<span class="showroom-initials">${esc(initialsFor(member.name))}</span>`;
  return `<article class="showroom-card" data-reveal>
    <div class="showroom-avatar">${photo}</div>
    <h3>${esc(member.name)}</h3>
    <p class="showroom-role">${esc(member.role)}</p>
    ${member.specialty ? `<span class="showroom-specialty">${esc(member.specialty)}</span>` : ''}
    ${member.experience ? `<span class="showroom-exp">${icon('award')}${esc(member.experience)} ${esc(copy.experience)}</span>` : ''}
  </article>`;
}

function carCard(p: RenderProduct, config: RenderConfig, s: UiStrings, lang: Lang): string {
  const image = p.imageUrl
    ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="600" height="400">`
    : productPlaceholder(p.name);
  return `<article class="car-card" data-reveal data-car-card data-category="${attr(p.category || '')}" data-name="${attr(p.name)}" data-desc="${attr(p.description || '')}">
    <div class="car-thumb">${image}</div>
    <div class="car-body">
      ${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      ${p.price > 0 ? `<span class="price">${money(p.price, lang)}</span>` : ''}
      <a class="btn btn-wa btn-block mt-3" href="${attr(waHref(config, `أريد شراء سيارة: ${p.name} — ${p.description || ''}`))}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.orderNow)}</a>
    </div>
  </article>`;
}

export function showroomPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = SHOWROOM[lang];
  const cars = config.products.filter((p) => p.name);
  const team = config.team || [];
  const services = config.services.length ? config.services : copy.financing;
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const heroWa = waHref(config, `${copy.heroMessage} — ${config.siteName}`);
  const quoteWa = waHref(config, `${copy.quoteTitle} — ${config.siteName}`);

  return `<section class="hero showroom-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('truck')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#cars">${icon('truck')}${esc(copy.carsCta)}</a>
          <a class="btn btn-wa" href="${attr(heroWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(copy.bookCta)}</a>
        </div>
        <div class="showroom-badges">
          <span>${icon('shield')}${esc(copy.warranty)}</span>
          <span>${icon('clock')}${esc(copy.openDaily)} · ${esc(config.hours || '09:00 — 19:00')}</span>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media showroom-hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('truck')}</span><div><strong>${esc(copy.warranty)}</strong><span>${esc(config.city || '')}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('shield')}${esc(copy.warranty)}</span>
    <span class="trust-item">${icon('truck')}${esc(s.quality)}</span>
    <span class="trust-item">${icon('award')}${esc(s.satisfaction)}</span>
    <span class="trust-item">${icon('target')}${esc(s.projects)}</span>
  </div></div>

  <section class="section" id="categories">
    <div class="container">
      ${sectionHead(copy.categoriesEyebrow, copy.categoriesTitle, copy.categoriesLead, true)}
      <div class="showroom-cats-grid">
        ${copy.categories.map((item, i) => `<article class="cat-card" data-reveal>
          <span class="cat-icon">${icon(item.icon as any)}</span>
          <h3 class="h3">${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="cars">
    <div class="container">
      ${sectionHead(copy.carsEyebrow, copy.carsTitle, copy.carsLead)}
      <div class="car-grid">${cars.length ? cars.map((p) => carCard(p, config, s, lang)).join('') : `<div class="car-empty">${esc(s.emptyCart)}</div>`}</div>
    </div>
  </section>

  <section class="section" id="financing">
    <div class="container">
      ${sectionHead(copy.financingEyebrow, copy.financingTitle, copy.financingLead)}
      <div class="showroom-service-grid">
        ${services.map((service, i) => `<article class="showroom-service" data-reveal>
          <span class="service-num">${String(i + 1).padStart(2, '0')}</span>
          <div><h3 class="h3">${esc(service.title)}</h3><p>${esc(service.description)}</p></div>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="process">
    <div class="container">
      ${sectionHead(copy.processTitle, copy.processLead, undefined, true)}
      <div class="steps">
        ${[
          [copy.step1, copy.step1d],
          [copy.step2, copy.step2d],
          [copy.step3, copy.step3d],
          [copy.step4, copy.step4d],
        ].map(([title, desc], i) => `<div class="step" data-reveal><div class="n">${i + 1}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`).join('')}
      </div>
    </div>
  </section>

  ${team.length ? `<section class="section bg-soft" id="team">
    <div class="container">
      ${sectionHead(copy.teamEyebrow, copy.teamTitle, copy.teamLead, true)}
      <div class="showroom-team-grid">${team.map((m) => showroomCard(m, copy)).join('')}</div>
    </div>
  </section>` : ''}

  <section class="section" id="about">
    <div class="container about-grid showroom-about-grid">
      <div class="showroom-about-media" data-reveal>
        ${about ? `<img class="main" src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="760">` : ''}
        <div class="about-badge">${icon('check')}+10 ${esc(s.years)}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(config.siteName)}</h2>
        <p class="lead mt-2">${esc(config.description)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)} — ${esc(copy.feat1d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)} — ${esc(copy.feat2d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)} — ${esc(copy.feat3d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat4)} — ${esc(copy.feat4d)}</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="quote">
    <div class="container quote-wrap">
      <div class="quote-copy" data-reveal>
        <span class="eyebrow">${esc(s.appointment)}</span>
        <h2 class="h2 mt-2">${esc(copy.quoteTitle)}</h2>
        <p class="lead mt-2">${esc(copy.quoteLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.note)}</span></li>
        </ul>
        <div class="showroom-hours">
          <div class="hours-row"><span>${icon('clock')}${esc(s.hours)}</span><strong>${esc(config.hours || '09:00 — 19:00')}</strong></div>
          <div class="hours-row"><span>${icon('map')}${esc(s.location)}</span><strong>${esc(config.address || config.city || '')}</strong></div>
        </div>
        <div class="showroom-contact-actions">
          <a class="btn btn-light" href="tel:${attr(config.phone)}">${icon('phone')}${esc(s.callNow)}</a>
          <a class="btn btn-wa" href="${attr(quoteWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
      </div>
      <form class="quote-card" data-lead-form data-lead-kind="showroom-quote" novalidate>
        <h3>${esc(copy.formTitle)}</h3>
        <p class="booking-sub">${esc(copy.formSub)}</p>
        <div class="form-grid">
          <div class="field"><label for="car-name">${esc(s.name)}</label><input id="car-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="car-phone">${esc(s.phone)}</label><input id="car-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field full"><label for="car-email">${esc(s.email)}</label><input id="car-email" name="email" type="email" maxlength="120" autocomplete="email" dir="ltr"></div>
          <div class="field full"><label for="car-model">${esc(copy.summaryModel)}</label><input id="car-model" name="carModel" maxlength="200"></div>
          <div class="field full"><label for="car-finance">${esc(copy.summaryFinance)}</label><input id="car-finance" name="financeType" maxlength="200"></div>
          <div class="field full"><label for="car-msg">${esc(s.message)}</label><textarea id="car-msg" name="message" required maxlength="1200"></textarea><span class="err">${esc(s.required)}</span></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('send')}${esc(copy.confirm)}</button>
        <div class="form-status" role="status"></div>
        <p class="form-note center mt-2">${esc(copy.note)}</p>
      </form>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.faqTitle, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * CLINIC
 * ---------------------------------------------------------------------- */
interface ClinicCopy {
  heroBadge: string;
  bookCta: string;
  servicesCta: string;
  openDaily: string;
  certified: string;
  experience: string;
  heroMessage: string;
  departmentsEyebrow: string;
  departmentsTitle: string;
  departmentsLead: string;
  departments: Array<{ icon: string; title: string; description: string }>;
  treatmentsEyebrow: string;
  treatmentsTitle: string;
  treatmentsLead: string;
  fallbackTreatments: Array<{ title: string; description: string }>;
  processTitle: string;
  processLead: string;
  step1: string; step1d: string;
  step2: string; step2d: string;
  step3: string; step3d: string;
  step4: string; step4d: string;
  teamEyebrow: string;
  teamTitle: string;
  teamLead: string;
  aboutTitle: string;
  aboutLead: string;
  feat1: string; feat1d: string;
  feat2: string; feat2d: string;
  feat3: string; feat3d: string;
  feat4: string; feat4d: string;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
  faqTitle: string;
  faq: Array<[string, string]>;
  bookTitle: string;
  bookLead: string;
  formTitle: string;
  formSub: string;
  confirm: string;
  summaryService: string;
  summaryDoctor: string;
  summaryWhen: string;
  note: string;
}

const CLINIC: Record<Lang, ClinicCopy> = {
  ar: {
    heroBadge: 'مركز طبي معتمد · عيادات أسنان',
    bookCta: 'احجز موعدك',
    servicesCta: 'خدمات المركز',
    openDaily: 'مفتوح يومياً',
    certified: 'شهادات معتمدة',
    experience: 'سنوات الخبرة',
    heroMessage: 'أريد حجز موعد طبي',
    departmentsEyebrow: 'التخصصات الطبية',
    departmentsTitle: 'رعاية صحية شاملة لك ولعائلتك',
    departmentsLead: 'من عيادات الأسنان إلى الطب العام والتحليلات، نقدم رعاية طبية متكاملة.',
    departments: [
      { icon: 'stethoscope', title: 'طب أسنان', description: 'حشوات، تركيبات، تبييض، وعلاج الأعصاب.' },
      { icon: 'stethoscope', title: 'طب عام', description: 'كشف تشخيصي ومتابعة للحالات المزمنة والعامة.' },
      { icon: 'clipboard', title: 'التحليلات الطبية', description: 'فحوصات دم وبول وأشعة مع نتائج سريعة.' },
      { icon: 'heart', title: 'العلاج الطبيعي', description: 'جلسات تأهيل وعلاج طبيعي بإشراف متخصصين.' },
    ],
    treatmentsEyebrow: 'خدمات المركز',
    treatmentsTitle: 'خدماتنا الطبية المتقدمة',
    treatmentsLead: 'نقدم خدمات طبية بجودة عالية وأسعار تنافسية مع فريق طبي مؤهل.',
    fallbackTreatments: [
      { title: 'كشف أسنان عام', description: 'فحص أسنان شامل مع خطة علاجية مبدئية.' },
      { title: 'تحاليل طبية', description: 'فحوصات مخبرية دقيقة مع نتائج سريعة وموثوقة.' },
      { title: 'الكشف الدوري', description: 'باقات فحص شامل للكشف المبكر عن الأمراض.' },
      { title: 'علاج طبيعي', description: 'جلسات تأهيل وعلاج طبيعي بإشراف أطباء متخصصين.' },
    ],
    processTitle: 'كيف تحصل على الرعاية الطبية',
    processLead: 'من الحجز إلى المتابعة، نضمن لك تجربة طبية مريحة وآمنة.',
    step1: 'الحجز', step1d: 'نساعدك في حجز الموعد المناسب مع الطبيب المختص.',
    step2: 'الكشف', step2d: 'يقوم الطبيب بالفحص السريري وتشخيص الحالة.',
    step3: 'العلاج', step3d: 'نقدم خطة علاجية مناسبة ومتابعة دورية للحالة.',
    step4: 'المتابعة', step4d: 'نتبع حالتك بعد العلاج ونقدم التوجيهات اللازمة.',
    teamEyebrow: 'الفريق الطبي',
    teamTitle: 'أطباء متخصصون في خدمتك',
    teamLead: 'فريق من الأطباء والأطباء المتخصصين ذوي الخبرة في التخصصات الطبية المختلفة.',
    aboutTitle: 'مركز الشفاء الطبي',
    aboutLead: 'مركز طبي متخصص يقدّم خدمات طبية شاملة تشمل عيادات الأسنان، التحليلات الطبية، والكشف الدوري، بفريق طبي مؤهل وتقنيات حديثة.',
    feat1: 'شهادات معتمدة', feat1d: 'جميع الأطباء يحملون شهادات معتمدة وخبرة عملية.',
    feat2: 'تقنيات حديثة', feat2d: 'نستخدم أحدث الأجهزة والمعدات الطبية في التشخيص والعلاج.',
    feat3: 'أسعار تنافسية', feat3d: 'أسعار شفافة ومناسبة مع باقات تأمين صحي.',
    feat4: 'رعاية مستمرة', feat4d: 'متابعة دورية للحالات المزمنة والرعاية بعد العلاج.',
    stats: [['+8', 'سنة خبرة'], ['+500', 'مريض'], ['98%', 'رضا المرضى'], ['24/7', 'دعم طبي']],
    quotes: [
      { text: 'مركز طبي ممتاز، الأطباء محترفون والعيادة نظيفة ومجهزة.', name: 'سارة خ.', role: 'مريضة' },
      { text: 'عيادة أسنان رائعة، العلاج كان بدون ألم والنتيجة رائعة.', name: 'محمد ب.', role: 'مريض' },
      { text: 'فريق متعاطف ومهني، أنصح بالمركز لكل من يبحث عن رعاية طبية جيدة.', name: 'نورى ع.', role: 'مريض' },
    ],
    faqTitle: 'أسئلة شائعة',
    faq: [
      ['كيف أحجز موعد؟', 'يمكنك الحجز عبر النموذج أو التواصل معنا عبر واتساب.'],
      ['هل تقبلون التأمين الصحي؟', 'نعم، نقبل معظم بطاقات التأمين الصحي مع تسهيل الدفع.'],
      ['ما هي أوقات العمل؟', 'نعمل من السبت إلى الخميس من 08:30 إلى 19:00.'],
      ['هل هناك عيادات أسنان؟', 'نعم، لدينا عيادات أسنان مجهزة بأحدث الأجهزة.'],
      ['هل يمكنني إلغاء الموعد؟', 'نعم، يمكن إلغاء الموعد مجاناً قبل 24 ساعة من الموعد.'],
    ],
    bookTitle: 'احجز موعدك الطبي',
    bookLead: 'املأ النموذج وسنتصل بك لتأكيد الموعد مع الطبيب المناسب.',
    formTitle: 'طلب حجز طبي',
    formSub: 'أخبرنا عن نوع الخدمة والطبيب المفضل وسنرد عليك في أقرب وقت.',
    confirm: 'إرسال طلب الحجز',
    summaryService: 'نوع الخدمة',
    summaryDoctor: 'الطبيب المفضل',
    summaryWhen: 'الموعد المفضل',
    note: 'جميع بياناتك محمية وسرية وفقاً لسياسة المركز الطبي.',
  },
  fr: {
    heroBadge: 'Centre médical agréé · Cabinet dentaire',
    bookCta: 'Prenez rendez-vous',
    servicesCta: 'Nos services',
    openDaily: 'Ouvert tous les jours',
    certified: 'Diplômes certifiés',
    experience: 'ans d’expérience',
    heroMessage: 'Je souhaite prendre un rendez-vous médical',
    departmentsEyebrow: 'Spécialités médicales',
    departmentsTitle: 'Des soins de santé complets pour vous et votre famille',
    departmentsLead: 'Du cabinet dentaire à la médecine générale et les analyses, nous offrons des soins médicaux complets.',
    departments: [
      { icon: 'stethoscope', title: 'Médecine dentaire', description: 'Obturations, couronnes, blanchiment et traitement des canaux.' },
      { icon: 'stethoscope', title: 'Médecine générale', description: 'Consultation diagnostique et suivi des maladies chroniques et générales.' },
      { icon: 'clipboard', title: 'Analyses médicales', description: 'Analyses de sang et d’urine et radiographies avec résultats rapides.' },
      { icon: 'heart', title: 'Kinésithérapie', description: 'Séances de rééducation et de kinésithérapie avec des spécialistes.' },
    ],
    treatmentsEyebrow: 'Services du centre',
    treatmentsTitle: 'Nos services médicaux avancés',
    treatmentsLead: 'Nous offrons des soins médicaux de haute qualité à des tarifs compétitifs avec une équipe médicale qualifiée.',
    fallbackTreatments: [
      { title: 'Consultation dentaire générale', description: 'Examen dentaire complet avec plan de traitement préliminaire.' },
      { title: 'Analyses médicales', description: 'Analyses de laboratoire précises avec résultats rapides et fiables.' },
      { title: 'Contrôle périodique', description: 'Forfaits de bilan complet pour le dépistage précoce des maladies.' },
      { title: 'Kinésithérapie', description: 'Séances de rééducation avec des médecins spécialisés.' },
    ],
    processTitle: 'Comment obtenir vos soins médicaux',
    processLead: 'De la prise de rendez-vous au suivi, nous vous garantissons une expérience médicale confortable et sûre.',
    step1: 'Rendez-vous', step1d: 'Nous vous aidons à prendre rendez-vous avec le médecin spécialiste approprié.',
    step2: 'Consultation', step2d: 'Le médecin effectue l’examen clinique et pose le diagnostic.',
    step3: 'Traitement', step3d: 'Nous proposons un plan de traitement adapté et un suivi régulier.',
    step4: 'Suivi', step4d: 'Nous suivons votre état après le traitement et vous donnons les conseils nécessaires.',
    teamEyebrow: 'Équipe médicale',
    teamTitle: 'Des médecins spécialistes à votre service',
    teamLead: 'Une équipe de médecins et de spécialistes expérimentés dans les différentes spécialités médicales.',
    aboutTitle: 'Centre médical Al Chifaa',
    aboutLead: 'Un centre médical spécialisé offrant des soins médicaux complets incluant le cabinet dentaire, les analyses médicales et le contrôle périodique, avec une équipe médicale qualifiée et des techniques modernes.',
    feat1: 'Diplômes certifiés', feat1d: 'Tous les médecins détiennent des diplômes certifiés et une expérience pratique.',
    feat2: 'Techniques modernes', feat2d: 'Nous utilisons les derniers appareils et équipements médicaux pour le diagnostic et le traitement.',
    feat3: 'Tarifs compétitifs', feat3d: 'Des tarifs transparents et adaptés avec des forfaits d’assurance santé.',
    feat4: 'Soins continus', feat4d: 'Suivi régulier des maladies chroniques et des soins après le traitement.',
    stats: [['+8', 'ans d’expérience'], ['+500', 'patients'], ['98%', 'satisfaction patients'], ['24/7', 'soutien médical']],
    quotes: [
      { text: 'Un excellent centre médical, les médecins sont professionnels et la clinique est propre et bien équipée.', name: 'Sarah K.', role: 'Patiente' },
      { text: 'Un cabinet dentaire merveilleux, le traitement était sans douleur et le résultat magnifique.', name: 'Mohamed B.', role: 'Patient' },
      { text: 'Une équipe empathique et professionnelle, je recommande ce centre pour tous ceux qui recherchent de bons soins médicaux.', name: 'Nouri A.', role: 'Patient' },
    ],
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Comment prendre rendez-vous ?', 'Vous pouvez prendre rendez-vous via le formulaire ou nous contacter sur WhatsApp.'],
      ['Acceptez-vous l’assurance maladie ?', 'Oui, nous acceptons la plupart des cartes d’assurance maladie avec facilités de paiement.'],
      ['Quels sont vos horaires ?', 'Nous travaillons du samedi au jeudi de 08:30 à 19:00.'],
      ['Avez-vous un cabinet dentaire ?', 'Oui, nous disposons d’un cabinet dentaire équipé des derniers appareils.'],
      ['Puis-je annuler mon rendez-vous ?', 'Oui, l’annulation est gratuite jusqu’à 24h avant le rendez-vous.'],
    ],
    bookTitle: 'Prenez votre rendez-vous médical',
    bookLead: 'Remplissez le formulaire et nous vous contacterons pour confirmer votre rendez-vous avec le médecin approprié.',
    formTitle: 'Demande de rendez-vous médical',
    formSub: 'Dites-nous le type de service et le médecin préféré et nous vous répondrons dans les plus brefs délais.',
    confirm: 'Envoyer la demande de rendez-vous',
    summaryService: 'Type de service',
    summaryDoctor: 'Médecin préféré',
    summaryWhen: 'Rendez-vous préféré',
    note: 'Toutes vos données sont protégées et confidentielles selon la politique du centre médical.',
  },
  en: {
    heroBadge: 'Certified Medical Center · Dental Clinic',
    bookCta: 'Book your appointment',
    servicesCta: 'Our services',
    openDaily: 'Open every day',
    certified: 'Certified diplomas',
    experience: 'years of experience',
    heroMessage: 'I want to book a medical appointment',
    departmentsEyebrow: 'Medical departments',
    departmentsTitle: 'Comprehensive healthcare for you and your family',
    departmentsLead: 'From dental clinics to general medicine and lab tests, we provide integrated medical care.',
    departments: [
      { icon: 'stethoscope', title: 'Dentistry', description: 'Fillings, crowns, whitening and root canal treatment.' },
      { icon: 'stethoscope', title: 'General Medicine', description: 'Diagnostic examination and follow-up of chronic and general conditions.' },
      { icon: 'clipboard', title: 'Lab Tests', description: 'Blood and urine tests and X-rays with fast results.' },
      { icon: 'heart', title: 'Physiotherapy', description: 'Rehabilitation and physiotherapy sessions with specialists.' },
    ],
    treatmentsEyebrow: 'Center services',
    treatmentsTitle: 'Our advanced medical services',
    treatmentsLead: 'We offer high-quality medical services at competitive rates with a qualified medical team.',
    fallbackTreatments: [
      { title: 'General dental checkup', description: 'Complete dental exam with preliminary treatment plan.' },
      { title: 'Lab tests', description: 'Accurate laboratory tests with fast and reliable results.' },
      { title: 'Periodic checkup', description: 'Complete checkup packages for early disease detection.' },
      { title: 'Physiotherapy', description: 'Rehabilitation and physiotherapy sessions with specialized doctors.' },
    ],
    processTitle: 'How to get medical care',
    processLead: 'From booking to follow-up, we ensure a comfortable and safe medical experience.',
    step1: 'Booking', step1d: 'We help you book the right appointment with the specialist doctor.',
    step2: 'Examination', step2d: 'The doctor performs clinical examination and diagnosis.',
    step3: 'Treatment', step3d: 'We provide an appropriate treatment plan and regular follow-up.',
    step4: 'Follow-up', step4d: 'We follow up your condition after treatment and provide necessary guidance.',
    teamEyebrow: 'Medical team',
    teamTitle: 'Specialist doctors at your service',
    teamLead: 'A team of doctors and specialists experienced in various medical specialties.',
    aboutTitle: 'Al Shifaa Medical Center',
    aboutLead: 'A specialized medical center offering comprehensive medical services including dental clinic, lab tests and periodic checkup, with a qualified medical team and modern techniques.',
    feat1: 'Certified diplomas', feat1d: 'All doctors hold certified diplomas and practical experience.',
    feat2: 'Modern techniques', feat2d: 'We use the latest devices and medical equipment for diagnosis and treatment.',
    feat3: 'Competitive prices', feat3d: 'Transparent and affordable prices with health insurance packages.',
    feat4: 'Continuous care', feat4d: 'Regular follow-up for chronic conditions and post-treatment care.',
    stats: [['+8', 'years of experience'], ['+500', 'patients'], ['98%', 'patient satisfaction'], ['24/7', 'medical support']],
    quotes: [
      { text: 'An excellent medical center, the doctors are professional and the clinic is clean and well equipped.', name: 'Sarah K.', role: 'Patient' },
      { text: 'A wonderful dental clinic, the treatment was painless and the result was great.', name: 'Mohamed B.', role: 'Patient' },
      { text: 'An empathetic and professional team, I recommend this center for anyone looking for good medical care.', name: 'Nouri A.', role: 'Patient' },
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['How do I book an appointment?', 'You can book via the form or contact us on WhatsApp.'],
      ['Do you accept health insurance?', 'Yes, we accept most health insurance cards with payment facilities.'],
      ['What are your hours?', 'We work Saturday to Thursday from 08:30 to 19:00.'],
      ['Do you have a dental clinic?', 'Yes, we have a dental clinic equipped with the latest devices.'],
      ['Can I cancel my appointment?', 'Yes, cancellation is free up to 24 hours before the appointment.'],
    ],
    bookTitle: 'Book your medical appointment',
    bookLead: 'Fill out the form and we will contact you to confirm your appointment with the right doctor.',
    formTitle: 'Medical appointment request',
    formSub: 'Tell us about the service type and preferred doctor and we will respond as soon as possible.',
    confirm: 'Send appointment request',
    summaryService: 'Service type',
    summaryDoctor: 'Preferred doctor',
    summaryWhen: 'Preferred appointment',
    note: 'All your data is protected and confidential according to the medical center policy.',
  },
};

function clinicCard(member: RenderTeamMember, copy: ClinicCopy): string {
  const photo = member.photoUrl
    ? `<img src="${attr(member.photoUrl)}" alt="${attr(member.name)}" loading="lazy" decoding="async" width="700" height="700">`
    : `<span class="clinic-initials">${esc(initialsFor(member.name))}</span>`;
  return `<article class="clinic-card" data-reveal>
    <div class="clinic-avatar">${photo}</div>
    <h3>${esc(member.name)}</h3>
    <p class="clinic-role">${esc(member.role)}</p>
    ${member.specialty ? `<span class="clinic-specialty">${esc(member.specialty)}</span>` : ''}
    ${member.experience ? `<span class="clinic-exp">${icon('award')}${esc(member.experience)} ${esc(copy.experience)}</span>` : ''}
  </article>`;
}

function treatmentCard(p: RenderProduct, config: RenderConfig, s: UiStrings, lang: Lang): string {
  const image = p.imageUrl
    ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="600" height="450">`
    : productPlaceholder(p.name);
  return `<article class="treatment-card" data-reveal data-treatment-card data-category="${attr(p.category || '')}" data-name="${attr(p.name)}" data-desc="${attr(p.description || '')}">
    <div class="treatment-thumb">${image}</div>
    <div class="treatment-body">
      ${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      ${p.price > 0 ? `<span class="price">${money(p.price, lang)}</span>` : ''}
      <a class="btn btn-wa btn-block mt-3" href="${attr(waHref(config, `أريد حجز موعد: ${p.name} — ${p.description || ''}`))}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.orderNow)}</a>
    </div>
  </article>`;
}

export function clinicPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = CLINIC[lang];
  const treatments = config.products.filter((p) => p.name);
  const team = config.team || [];
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const heroWa = waHref(config, `${copy.heroMessage} — ${config.siteName}`);
  const bookWa = waHref(config, `${copy.bookTitle} — ${config.siteName}`);

  return `<section class="hero clinic-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('stethoscope')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#services">${icon('stethoscope')}${esc(copy.servicesCta)}</a>
          <a class="btn btn-wa" href="${attr(heroWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(copy.bookCta)}</a>
        </div>
        <div class="clinic-badges">
          <span>${icon('shield')}${esc(copy.certified)}</span>
          <span>${icon('clock')}${esc(copy.openDaily)} · ${esc(config.hours || '08:30 — 19:00')}</span>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media clinic-hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('stethoscope')}</span><div><strong>${esc(copy.certified)}</strong><span>${esc(config.city || '')}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('shield')}${esc(copy.certified)}</span>
    <span class="trust-item">${icon('home')}${esc(s.quality)}</span>
    <span class="trust-item">${icon('award')}${esc(s.satisfaction)}</span>
    <span class="trust-item">${icon('target')}${esc(s.projects)}</span>
  </div></div>

  <section class="section bg-soft" id="departments">
    <div class="container">
      ${sectionHead(copy.departmentsEyebrow, copy.departmentsTitle, copy.departmentsLead, true)}
      <div class="clinic-depts-grid">
        ${copy.departments.map((item, i) => `<article class="dept-card" data-reveal>
          <span class="dept-icon">${icon(item.icon as any)}</span>
          <h3 class="h3">${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="treatments">
    <div class="container">
      ${sectionHead(copy.treatmentsEyebrow, copy.treatmentsTitle, copy.treatmentsLead)}
      <div class="treatment-grid">${treatments.length ? treatments.map((p) => treatmentCard(p, config, s, lang)).join('') : `<div class="treatment-empty">${esc(s.emptyCart)}</div>`}</div>
    </div>
  </section>

  <section class="section" id="process">
    <div class="container">
      ${sectionHead(copy.processTitle, copy.processLead, undefined, true)}
      <div class="steps">
        ${[
          [copy.step1, copy.step1d],
          [copy.step2, copy.step2d],
          [copy.step3, copy.step3d],
          [copy.step4, copy.step4d],
        ].map(([title, desc], i) => `<div class="step" data-reveal><div class="n">${i + 1}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`).join('')}
      </div>
    </div>
  </section>

  ${team.length ? `<section class="section bg-soft" id="team">
    <div class="container">
      ${sectionHead(copy.teamEyebrow, copy.teamTitle, copy.teamLead, true)}
      <div class="clinic-team-grid">${team.map((m) => clinicCard(m, copy)).join('')}</div>
    </div>
  </section>` : ''}

  <section class="section" id="about">
    <div class="container about-grid clinic-about-grid">
      <div class="clinic-about-media" data-reveal>
        ${about ? `<img class="main" src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="760">` : ''}
        <div class="about-badge">${icon('check')}+8 ${esc(s.years)}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(config.siteName)}</h2>
        <p class="lead mt-2">${esc(config.description)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)} — ${esc(copy.feat1d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)} — ${esc(copy.feat2d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)} — ${esc(copy.feat3d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat4)} — ${esc(copy.feat4d)}</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="book">
    <div class="container book-wrap">
      <div class="book-copy" data-reveal>
        <span class="eyebrow">${esc(s.appointment)}</span>
        <h2 class="h2 mt-2">${esc(copy.bookTitle)}</h2>
        <p class="lead mt-2">${esc(copy.bookLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.note)}</span></li>
        </ul>
        <div class="clinic-hours">
          <div class="hours-row"><span>${icon('clock')}${esc(s.hours)}</span><strong>${esc(config.hours || '08:30 — 19:00')}</strong></div>
          <div class="hours-row"><span>${icon('map')}${esc(s.location)}</span><strong>${esc(config.address || config.city || '')}</strong></div>
        </div>
        <div class="clinic-contact-actions">
          <a class="btn btn-light" href="tel:${attr(config.phone)}">${icon('phone')}${esc(s.callNow)}</a>
          <a class="btn btn-wa" href="${attr(bookWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
      </div>
      <form class="book-card" data-lead-form data-lead-kind="clinic-booking" novalidate>
        <h3>${esc(copy.formTitle)}</h3>
        <p class="booking-sub">${esc(copy.formSub)}</p>
        <div class="form-grid">
          <div class="field"><label for="clinic-name">${esc(s.name)}</label><input id="clinic-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="clinic-phone">${esc(s.phone)}</label><input id="clinic-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field full"><label for="clinic-email">${esc(s.email)}</label><input id="clinic-email" name="email" type="email" maxlength="120" autocomplete="email" dir="ltr"></div>
          <div class="field full"><label for="clinic-service">${esc(copy.summaryService)}</label><input id="clinic-service" name="serviceType" maxlength="200"></div>
          <div class="field full"><label for="clinic-doctor">${esc(copy.summaryDoctor)}</label><input id="clinic-doctor" name="doctorName" maxlength="200"></div>
          <div class="field full"><label for="clinic-msg">${esc(s.message)}</label><textarea id="clinic-msg" name="message" required maxlength="1200"></textarea><span class="err">${esc(s.required)}</span></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('send')}${esc(copy.confirm)}</button>
        <div class="form-status" role="status"></div>
        <p class="form-note center mt-2">${esc(copy.note)}</p>
      </form>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.faqTitle, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * COMPANY
 * ---------------------------------------------------------------------- */
export function companyPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const services = config.services.length ? config.services : [
    { title: s.services, description: config.tagline },
  ];
  const heroMedia = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
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
      <div class="hero-media${heroMedia ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroMedia}
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
      <div class="about-media${about ? '' : ' no-img'}" data-reveal>
        ${about ? `<img src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="700">` : ''}
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

  ${showcaseSection(config, s, lang, 6, s.packages, config.tagline)}

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
  const projects = config.products.length
    ? config.products.map((p) => ({
        title: p.name,
        description: p.description || '',
        imageUrl: p.imageUrl,
        price: p.price,
      }))
    : (config.services.length ? config.services : [{ title: s.ourWork, description: config.tagline }])
        .map((service, i) => ({
          title: service.title,
          description: service.description,
          imageUrl: (config.gallery || [])[i % Math.max(1, (config.gallery || []).length)] || null,
          price: 0,
        }));
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
        ${project.imageUrl ? `<img src="${attr(project.imageUrl)}" alt="${attr(project.title)}" loading="lazy" decoding="async" width="700" height="520">` : ''}
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="go">${icon('arrow')}</span>
        <div><h3>${esc(project.title)}</h3><p>${esc(project.description)}</p>${project.price > 0 ? `<span class="work-price">${money(project.price, lang)}</span>` : ''}</div>
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
export function cardPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  // The card template has no header, so it needs its own language switcher.
  const alternates: Record<string, string> = {};
  for (const code of ['ar', 'fr', 'en'] as const) {
    alternates[code] = code === config.language ? 'index.html' : `${code}.html`;
  }
  const cover = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="" aria-hidden="true" width="900" height="600" decoding="async">`
    : '';
  const gallery = (config.gallery || []).slice(0, 3);
  return `<main class="vcard-page" id="top">
    <div>
      <article class="vcard" data-reveal>
        <div class="vcard-cover">${cover}</div>
        <div class="vcard-logo">${logoMark(config)}</div>
        <div class="vcard-body">
          <h1>${esc(config.siteName)}</h1>
          <div class="role">${esc(config.tagline || config.category)}</div>
          <p class="bio">${esc(config.description)}</p>
          ${gallery.length ? `<div class="vcard-gallery">${gallery.map((url, i) => `<img src="${attr(url)}" alt="${attr(config.siteName)} ${i + 1}" loading="lazy" decoding="async" width="220" height="160">`).join('')}</div>` : ''}
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
      <div class="vcard-lang">${languageSwitch(config, lang, alternates)}${themeToggle(s)}</div>
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
  const cover = config.coverUrl ? `<img src="${attr(config.coverUrl)}" alt="" aria-hidden="true" width="1600" height="900" fetchpriority="high" decoding="async">` : '';
  const about = aboutPhoto(config);
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
      <div class="about-media${about ? '' : ' no-img'}" data-reveal>${about ? `<img src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="700">` : ''}<div class="about-badge">${icon('star')}4.9/5</div></div>
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

  ${showcaseSection(config, s, lang, 6, s.packages, config.tagline)}

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

/* -------------------------------------------------------------------------
 * DIGITAL PRODUCTS
 * ---------------------------------------------------------------------- */
interface DigitalCopy {
  heroBadge: string;
  shopCta: string;
  browseCta: string;
  heroMessage: string;
  instant: string;
  instantShort: string;
  updates: string;
  lifetime: string;
  categoriesEyebrow: string;
  categoriesTitle: string;
  categoriesLead: string;
  categories: Array<{ icon: string; title: string; description: string }>;
  productsEyebrow: string;
  productsTitle: string;
  productsLead: string;
  buy: string;
  whyEyebrow: string;
  whyTitle: string;
  whyLead: string;
  features: Array<{ icon: string; title: string; description: string }>;
  processTitle: string;
  processLead: string;
  step1: string; step1d: string;
  step2: string; step2d: string;
  step3: string; step3d: string;
  step4: string; step4d: string;
  aboutTitle: string;
  aboutLead: string;
  feat1: string; feat1d: string;
  feat2: string; feat2d: string;
  feat3: string; feat3d: string;
  feat4: string; feat4d: string;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
  faqTitle: string;
  faq: Array<[string, string]>;
  orderTitle: string;
  orderLead: string;
  formTitle: string;
  formSub: string;
  chooseProduct: string;
  payment: string;
  paymentMethods: string[];
  confirm: string;
  note: string;
}

const DIGITAL: Record<Lang, DigitalCopy> = {
  ar: {
    heroBadge: 'منتجات رقمية · تحميل فوري',
    shopCta: 'تسوق المنتجات',
    browseCta: 'تصفح الفئات',
    heroMessage: 'أريد الاستفسار عن المنتجات الرقمية',
    instant: 'تحميل فوري بعد الدفع',
    instantShort: 'تحميل فوري',
    updates: 'تحديثات مجانية مدى الحياة',
    lifetime: 'ترخيص استخدام مدى الحياة',
    categoriesEyebrow: 'فئات المنتجات',
    categoriesTitle: 'كل ما تحتاجه لتنطلق رقمياً',
    categoriesLead: 'قوالب، كتب، دورات وأدوات مختارة بعناية لاختصار وقتك.',
    categories: [
      { icon: 'layers', title: 'قوالب جاهزة', description: 'قوالب مواقع وعروض وهوية بصرية قابلة للتعديل.' },
      { icon: 'clipboard', title: 'كتب إلكترونية', description: 'أدلة عملية في التسويق والتصميم وإدارة الأعمال.' },
      { icon: 'award', title: 'دورات تدريبية', description: 'دروس مسجلة بجودة عالية مع ملفات تطبيقية.' },
      { icon: 'zap', title: 'أدوات وبرمجيات', description: 'أدوات وإضافات تسرّع عملك اليومي.' },
    ],
    productsEyebrow: 'الأكثر مبيعاً',
    productsTitle: 'أصول رقمية جاهزة للاستخدام',
    productsLead: 'حمّل المنتج مباشرة بعد الدفع، مع دعم كامل عند الحاجة.',
    buy: 'اطلب الآن',
    whyEyebrow: 'لماذا تختارنا؟',
    whyTitle: 'قيمة حقيقية من أول تحميل',
    whyLead: 'جودة، ترخيص واضح ودعم مستمر في كل منتج.',
    features: [
      { icon: 'download', title: 'تحميل فوري', description: 'رابط التحميل يصل مباشرة بعد تأكيد الدفع.' },
      { icon: 'shield', title: 'ترخيص واضح', description: 'استخدام شخصي أو تجاري موضح مع كل منتج.' },
      { icon: 'spark', title: 'تحديثات مجانية', description: 'نسخ محدثة من المنتجات التي اشتريتها.' },
      { icon: 'users', title: 'دعم حقيقي', description: 'فريق يجيبك عن أي سؤال قبل وبعد الشراء.' },
    ],
    processTitle: 'كيف تحصل على منتجك',
    processLead: 'من الاختيار إلى التحميل في دقائق.',
    step1: 'اختر المنتج', step1d: 'تصفح الفئات واختر ما يناسب مشروعك.',
    step2: 'أكمل الطلب', step2d: 'أدخل بياناتك واختر طريقة الدفع المناسبة.',
    step3: 'أكد الدفع', step3d: 'نؤكد الدفع ونرسل لك رابط التحميل.',
    step4: 'حمّل واستخدم', step4d: 'حمّل الملفات مباشرة وابدأ العمل فوراً.',
    aboutTitle: 'نصنع أصولاً رقمية تُختصر بها الطريق',
    aboutLead: 'استوديو رقمي متخصص في تصميم القوالب والأدلة والدورات التي تساعد أصحاب المشاريع على الانطلاق بسرعة وبجودة احترافية.',
    feat1: 'جودة احترافية', feat1d: 'ملفات منظمة وقابلة للتعديل بسهولة.',
    feat2: 'تسليم سريع', feat2d: 'لا انتظار ولا شحن، كل شيء رقمي.',
    feat3: 'أسعار عادلة', feat3d: 'قيمة كبيرة مقابل سعر مناسب.',
    feat4: 'تحديث مستمر', feat4d: 'نضيف منتجات جديدة كل شهر.',
    stats: [['+120', 'منتج رقمي'], ['+3,500', 'تحميل'], ['4.9/5', 'تقييم العملاء'], ['24/7', 'دعم فني']],
    quotes: [
      { text: 'قالب احترافي وفّر عليّ أسابيع من العمل، والتعديل عليه كان سهلاً جداً.', name: 'أمين ب.', role: 'مصمم جرافيك' },
      { text: 'اشتريت الدليل وحمّلته مباشرة، المحتوى عملي وواضح خطوة بخطوة.', name: 'سارة م.', role: 'صاحبة مشروع' },
      { text: 'الدورة تستحق كل دينار، والدعم أجابني عن كل الأسئلة بسرعة.', name: 'كريم ع.', role: 'مطور ويب' },
    ],
    faqTitle: 'أسئلة شائعة',
    faq: [
      ['كيف أستلم المنتج؟', 'بعد تأكيد الدفع نرسل رابط التحميل عبر البريد أو واتساب.'],
      ['هل يمكنني استرجاع المبلغ؟', 'المنتجات الرقمية غير قابلة للاسترجاع بعد التحميل، إلا في حال وجود خلل تقني.'],
      ['هل التحديثات مجانية؟', 'نعم، تحصل على التحديثات المجانية للمنتج الذي اشتريته.'],
      ['هل يمكن استخدام المنتج تجارياً؟', 'يعتمد على ترخيص كل منتج، وهو موضح في وصف المنتج.'],
      ['ما طرق الدفع المتاحة؟', 'بريدي موب، CCP أو تحويل بنكي.'],
    ],
    orderTitle: 'اطلب منتجك الرقمي',
    orderLead: 'اختر المنتج وطريقة الدفع، وسنرسل لك رابط التحميل مباشرة.',
    formTitle: 'طلب منتج رقمي',
    formSub: 'نرسل رابط التحميل عبر البريد أو واتساب بعد تأكيد الدفع.',
    chooseProduct: 'المنتج',
    payment: 'طريقة الدفع',
    paymentMethods: ['بريدي موب', 'CCP', 'تحويل بنكي'],
    confirm: 'إرسال الطلب',
    note: 'المنتجات رقمية وتُسلّم عبر رابط تحميل بعد تأكيد الدفع.',
  },
  fr: {
    heroBadge: 'Produits numériques · Téléchargement instantané',
    shopCta: 'Voir les produits',
    browseCta: 'Explorer les catégories',
    heroMessage: 'Je souhaite des informations sur vos produits numériques',
    instant: 'Téléchargement instantané après paiement',
    instantShort: 'Téléchargement instantané',
    updates: 'Mises à jour gratuites à vie',
    lifetime: 'Licence d’utilisation à vie',
    categoriesEyebrow: 'Catégories de produits',
    categoriesTitle: 'Tout ce qu’il faut pour démarrer en digital',
    categoriesLead: 'Modèles, e-books, formations et outils sélectionnés pour vous faire gagner du temps.',
    categories: [
      { icon: 'layers', title: 'Modèles prêts', description: 'Modèles de sites, présentations et identité visuelle modifiables.' },
      { icon: 'clipboard', title: 'E-books', description: 'Guides pratiques en marketing, design et gestion.' },
      { icon: 'award', title: 'Formations', description: 'Cours enregistrés de qualité avec fichiers d’application.' },
      { icon: 'zap', title: 'Outils & logiciels', description: 'Outils et extensions pour accélérer votre quotidien.' },
    ],
    productsEyebrow: 'Meilleures ventes',
    productsTitle: 'Ressources numériques prêtes à l’emploi',
    productsLead: 'Téléchargez après paiement, avec un accompagnement complet si besoin.',
    buy: 'Commander',
    whyEyebrow: 'Pourquoi nous choisir ?',
    whyTitle: 'Une vraie valeur dès le premier téléchargement',
    whyLead: 'Qualité, licence claire et support continu sur chaque produit.',
    features: [
      { icon: 'download', title: 'Téléchargement instantané', description: 'Le lien arrive dès la confirmation du paiement.' },
      { icon: 'shield', title: 'Licence claire', description: 'Usage personnel ou commercial précisé pour chaque produit.' },
      { icon: 'spark', title: 'Mises à jour gratuites', description: 'Nouvelles versions des produits déjà achetés.' },
      { icon: 'users', title: 'Un vrai support', description: 'Une équipe qui répond avant et après l’achat.' },
    ],
    processTitle: 'Comment obtenir votre produit',
    processLead: 'Du choix au téléchargement en quelques minutes.',
    step1: 'Choisir le produit', step1d: 'Parcourez les catégories et trouvez ce qui convient à votre projet.',
    step2: 'Passer la demande', step2d: 'Renseignez vos coordonnées et choisissez le mode de paiement.',
    step3: 'Confirmer le paiement', step3d: 'Nous confirmons le paiement et envoyons le lien de téléchargement.',
    step4: 'Télécharger et utiliser', step4d: 'Récupérez les fichiers et commencez immédiatement.',
    aboutTitle: 'Des ressources numériques qui font gagner du temps',
    aboutLead: 'Un studio numérique spécialisé dans les modèles, guides et formations qui aident les entrepreneurs à démarrer vite et avec un rendu professionnel.',
    feat1: 'Qualité professionnelle', feat1d: 'Des fichiers organisés et faciles à modifier.',
    feat2: 'Livraison rapide', feat2d: 'Pas d’attente ni d’expédition, tout est numérique.',
    feat3: 'Prix justes', feat3d: 'Un excellent rapport qualité-prix.',
    feat4: 'Mises à jour continues', feat4d: 'De nouveaux produits chaque mois.',
    stats: [['+120', 'produits numériques'], ['+3 500', 'téléchargements'], ['4,9/5', 'note clients'], ['24/7', 'support technique']],
    quotes: [
      { text: 'Un modèle professionnel qui m’a fait gagner des semaines de travail, et très facile à modifier.', name: 'Amine B.', role: 'Graphiste' },
      { text: 'J’ai acheté le guide et l’ai téléchargé directement. Un contenu clair et pratique.', name: 'Sarah M.', role: 'Entrepreneure' },
      { text: 'La formation vaut chaque dinar, et le support a répondu rapidement à toutes mes questions.', name: 'Karim A.', role: 'Développeur web' },
    ],
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Comment recevoir le produit ?', 'Après confirmation du paiement, nous envoyons le lien par e-mail ou WhatsApp.'],
      ['Puis-je être remboursé ?', 'Les produits numériques ne sont pas remboursables après téléchargement, sauf problème technique.'],
      ['Les mises à jour sont-elles gratuites ?', 'Oui, vous recevez les mises à jour du produit acheté.'],
      ['Puis-je l’utiliser à des fins commerciales ?', 'Cela dépend de la licence de chaque produit, précisée dans sa description.'],
      ['Quels sont les modes de paiement ?', 'BaridiMob, CCP ou virement bancaire.'],
    ],
    orderTitle: 'Commandez votre produit numérique',
    orderLead: 'Choisissez le produit et le mode de paiement, nous envoyons le lien de téléchargement.',
    formTitle: 'Demande de produit numérique',
    formSub: 'Le lien est envoyé par e-mail ou WhatsApp après confirmation du paiement.',
    chooseProduct: 'Produit',
    payment: 'Mode de paiement',
    paymentMethods: ['BaridiMob', 'CCP', 'Virement bancaire'],
    confirm: 'Envoyer la demande',
    note: 'Les produits sont numériques et livrés par lien de téléchargement après paiement.',
  },
  en: {
    heroBadge: 'Digital products · Instant download',
    shopCta: 'Shop products',
    browseCta: 'Browse categories',
    heroMessage: 'I would like to know more about your digital products',
    instant: 'Instant download after payment',
    instantShort: 'Instant download',
    updates: 'Free lifetime updates',
    lifetime: 'Lifetime license',
    categoriesEyebrow: 'Product categories',
    categoriesTitle: 'Everything you need to launch digitally',
    categoriesLead: 'Templates, e-books, courses and tools curated to save you time.',
    categories: [
      { icon: 'layers', title: 'Ready templates', description: 'Editable website, presentation and brand templates.' },
      { icon: 'clipboard', title: 'E-books', description: 'Practical guides on marketing, design and management.' },
      { icon: 'award', title: 'Courses', description: 'High-quality recorded lessons with practical files.' },
      { icon: 'zap', title: 'Tools & software', description: 'Tools and add-ons that speed up your daily work.' },
    ],
    productsEyebrow: 'Best sellers',
    productsTitle: 'Digital resources ready to use',
    productsLead: 'Download instantly after payment, with full support when needed.',
    buy: 'Order now',
    whyEyebrow: 'Why choose us?',
    whyTitle: 'Real value from the first download',
    whyLead: 'Quality, a clear license and ongoing support on every product.',
    features: [
      { icon: 'download', title: 'Instant download', description: 'The link arrives right after payment confirmation.' },
      { icon: 'shield', title: 'Clear license', description: 'Personal or commercial use stated for each product.' },
      { icon: 'spark', title: 'Free updates', description: 'Updated versions of the products you bought.' },
      { icon: 'users', title: 'Real support', description: 'A team that answers before and after your purchase.' },
    ],
    processTitle: 'How to get your product',
    processLead: 'From choice to download in minutes.',
    step1: 'Choose a product', step1d: 'Browse the categories and find what fits your project.',
    step2: 'Send your request', step2d: 'Enter your details and pick a payment method.',
    step3: 'Confirm payment', step3d: 'We confirm the payment and send your download link.',
    step4: 'Download & use', step4d: 'Get the files and start working immediately.',
    aboutTitle: 'Digital assets that shorten the journey',
    aboutLead: 'A digital studio specialized in templates, guides and courses that help business owners launch fast with a professional finish.',
    feat1: 'Professional quality', feat1d: 'Well-organized files that are easy to edit.',
    feat2: 'Fast delivery', feat2d: 'No waiting or shipping, everything is digital.',
    feat3: 'Fair prices', feat3d: 'Great value for a reasonable price.',
    feat4: 'Continuous updates', feat4d: 'New products every month.',
    stats: [['+120', 'digital products'], ['+3,500', 'downloads'], ['4.9/5', 'client rating'], ['24/7', 'technical support']],
    quotes: [
      { text: 'A professional template that saved me weeks of work, and it was very easy to customize.', name: 'Amine B.', role: 'Graphic designer' },
      { text: 'I bought the guide and downloaded it instantly. Clear, practical content step by step.', name: 'Sarah M.', role: 'Business owner' },
      { text: 'The course is worth every dinar, and support answered all my questions quickly.', name: 'Karim A.', role: 'Web developer' },
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['How do I receive the product?', 'After payment confirmation we send the download link by email or WhatsApp.'],
      ['Can I get a refund?', 'Digital products are non-refundable after download, except in case of a technical issue.'],
      ['Are updates free?', 'Yes, you receive free updates for the product you purchased.'],
      ['Can I use it commercially?', 'It depends on each product license, stated in the product description.'],
      ['What payment methods are available?', 'BaridiMob, CCP or bank transfer.'],
    ],
    orderTitle: 'Order your digital product',
    orderLead: 'Choose the product and payment method, and we will send the download link.',
    formTitle: 'Digital product request',
    formSub: 'The link is sent by email or WhatsApp after payment confirmation.',
    chooseProduct: 'Product',
    payment: 'Payment method',
    paymentMethods: ['BaridiMob', 'CCP', 'Bank transfer'],
    confirm: 'Send request',
    note: 'Products are digital and delivered via a download link after payment.',
  },
};

function digitalCard(p: RenderProduct, copy: DigitalCopy, s: UiStrings, lang: Lang): string {
  const image = p.imageUrl
    ? `<img src="${attr(p.imageUrl)}" alt="${attr(p.name)}" loading="lazy" decoding="async" width="600" height="450">`
    : productPlaceholder(p.name);
  return `<article class="digital-card" data-reveal data-product-card data-category="${attr(p.category || '')}" data-name="${attr(p.name)}" data-desc="${attr(p.description || '')}">
    <div class="digital-thumb">${image}<span class="digital-ribbon">${icon('download')}${esc(copy.instantShort)}</span></div>
    <div class="digital-body">
      ${p.category ? `<span class="cat">${esc(p.category)}</span>` : ''}
      <h3>${esc(p.name)}</h3>
      ${p.description ? `<p>${esc(p.description)}</p>` : ''}
      <div class="digital-foot">
        ${p.price > 0 ? `<span class="price">${money(p.price, lang)}</span>` : ''}
        <button class="btn btn-primary btn-sm" type="button" data-pick-product="${attr(p.name)}">${icon('download')}${esc(copy.buy)}</button>
      </div>
    </div>
  </article>`;
}

export function digitalPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = DIGITAL[lang];
  const products = config.products.filter((p) => p.name);
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const heroWa = waHref(config, `${copy.heroMessage} — ${config.siteName}`);
  const orderWa = waHref(config, `${copy.orderTitle} — ${config.siteName}`);

  return `<section class="hero digital-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('spark')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#products">${icon('download')}${esc(copy.shopCta)}</a>
          <a class="btn btn-wa" href="${attr(heroWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
        <div class="digital-badges">
          <span>${icon('download')}${esc(copy.instant)}</span>
          <span>${icon('shield')}${esc(copy.lifetime)}</span>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media digital-hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('download')}</span><div><strong>${esc(copy.instantShort)}</strong><span>${esc(copy.updates)}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('download')}${esc(copy.instant)}</span>
    <span class="trust-item">${icon('spark')}${esc(copy.updates)}</span>
    <span class="trust-item">${icon('shield')}${esc(copy.lifetime)}</span>
    <span class="trust-item">${icon('users')}${esc(s.support)}</span>
  </div></div>

  <section class="section bg-soft" id="categories">
    <div class="container">
      ${sectionHead(copy.categoriesEyebrow, copy.categoriesTitle, copy.categoriesLead, true)}
      <div class="digital-cats-grid">
        ${copy.categories.map((item) => `<article class="digital-cat" data-reveal>
          <span class="digital-cat-icon">${icon(item.icon as any)}</span>
          <h3 class="h3">${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
          <a class="digital-cat-link" href="#products">${esc(copy.shopCta)}${icon('arrow')}</a>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="products">
    <div class="container">
      ${sectionHead(copy.productsEyebrow, copy.productsTitle, copy.productsLead)}
      <div class="shop-toolbar">
        <button class="chip active" type="button" data-filter="all">${esc(s.all)}</button>
        ${categories.map((cat) => `<button class="chip" type="button" data-filter="${attr(cat)}">${esc(cat)}</button>`).join('')}
        <div class="search-box">${icon('search')}<input id="product-search" type="search" placeholder="${attr(s.search)}" aria-label="${attr(s.search)}"></div>
      </div>
      <div class="digital-grid">
        ${products.length ? products.map((p) => digitalCard(p, copy, s, lang)).join('') : `<div class="product-empty">${esc(s.emptyCart)}</div>`}
        <div class="product-empty hide" id="product-empty">${esc(s.emptyCart)}</div>
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="why">
    <div class="container">
      ${sectionHead(copy.whyEyebrow, copy.whyTitle, copy.whyLead, true)}
      <div class="digital-feature-grid">
        ${copy.features.map((item) => `<article class="digital-feature" data-reveal>
          <span class="digital-feature-icon">${icon(item.icon as any)}</span>
          <h3 class="h3">${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="process">
    <div class="container">
      ${sectionHead(s.process, copy.processTitle, copy.processLead, true)}
      <div class="steps">
        ${[
          [copy.step1, copy.step1d],
          [copy.step2, copy.step2d],
          [copy.step3, copy.step3d],
          [copy.step4, copy.step4d],
        ].map(([title, desc], i) => `<div class="step" data-reveal><div class="n">${i + 1}</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`).join('')}
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="about">
    <div class="container about-grid">
      <div class="about-media${about ? '' : ' no-img'}" data-reveal>
        ${about ? `<img src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="700">` : ''}
        <div class="about-badge">${icon('spark')}+120 ${esc(s.products)}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(copy.aboutTitle)}</h2>
        <p class="lead mt-2">${esc(copy.aboutLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat1)} — ${esc(copy.feat1d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat2)} — ${esc(copy.feat2d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat3)} — ${esc(copy.feat3d)}</span></li>
          <li><span class="tick">${icon('check')}</span><span>${esc(copy.feat4)} — ${esc(copy.feat4d)}</span></li>
        </ul>
      </div>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.faqTitle, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="order">
    <div class="container digital-order-wrap">
      <div data-reveal>
        <span class="eyebrow">${esc(s.orderNow)}</span>
        <h2 class="h2 mt-2">${esc(copy.orderTitle)}</h2>
        <p class="lead mt-2">${esc(copy.orderLead)}</p>
        <ul class="checklist">
          <li><span class="tick">${icon('download')}</span><span>${esc(copy.instant)}</span></li>
          <li><span class="tick">${icon('spark')}</span><span>${esc(copy.updates)}</span></li>
          <li><span class="tick">${icon('shield')}</span><span>${esc(copy.lifetime)}</span></li>
        </ul>
        <div class="digital-pay-methods">
          ${copy.paymentMethods.map((method) => `<span>${icon('check')}${esc(method)}</span>`).join('')}
        </div>
        <div class="digital-contact-actions">
          <a class="btn btn-light" href="tel:${attr(config.phone)}">${icon('phone')}${esc(s.callNow)}</a>
          <a class="btn btn-wa" href="${attr(orderWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.orderWhatsapp)}</a>
        </div>
      </div>
      <form class="digital-order-card" data-lead-form data-lead-kind="digital-order" novalidate>
        <h3>${esc(copy.formTitle)}</h3>
        <p class="booking-sub">${esc(copy.formSub)}</p>
        <div class="form-grid">
          <div class="field"><label for="dig-name">${esc(s.name)}</label><input id="dig-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="dig-phone">${esc(s.phone)}</label><input id="dig-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field full"><label for="dig-email">${esc(s.email)}</label><input id="dig-email" name="email" type="email" required maxlength="120" autocomplete="email" dir="ltr"><span class="err">${esc(s.required)}</span></div>
          <div class="field full"><label for="dig-product">${esc(copy.chooseProduct)}</label><select id="dig-product" name="productName" data-order-product required>
            <option value="">${esc(copy.chooseProduct)}</option>
            ${products.map((p) => `<option value="${attr(p.name)}">${esc(p.name)}${p.price > 0 ? ` — ${money(p.price, lang)}` : ''}</option>`).join('')}
          </select><span class="err">${esc(s.required)}</span></div>
          <div class="field full"><label for="dig-payment">${esc(copy.payment)}</label><select id="dig-payment" name="paymentMethod" required>
            <option value="">${esc(copy.payment)}</option>
            ${copy.paymentMethods.map((method) => `<option value="${attr(method)}">${esc(method)}</option>`).join('')}
          </select><span class="err">${esc(s.required)}</span></div>
          <div class="field full"><label for="dig-msg">${esc(s.message)}</label><textarea id="dig-msg" name="message" maxlength="1200"></textarea></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('send')}${esc(copy.confirm)}</button>
        <div class="form-status" role="status"></div>
        <p class="form-note center mt-2">${esc(copy.note)}</p>
      </form>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

/* -------------------------------------------------------------------------
 * LUXURY GYM
 * ---------------------------------------------------------------------- */
interface GymCopy {
  heroBadge: string;
  joinCta: string;
  exploreCta: string;
  heroMessage: string;
  openDaily: string;
  premium: string;
  members: string;
  programsEyebrow: string;
  programsTitle: string;
  programsLead: string;
  programs: Array<{ icon: string; title: string; description: string }>;
  classesEyebrow: string;
  classesTitle: string;
  classesLead: string;
  classes: Array<{ day: string; title: string; time: string; coach: string; level: string }>;
  pricingEyebrow: string;
  pricingTitle: string;
  pricingLead: string;
  popular: string;
  planIncludes: string[];
  coachesEyebrow: string;
  coachesTitle: string;
  coachesLead: string;
  aboutTitle: string;
  aboutLead: string;
  facilitiesEyebrow: string;
  facilitiesTitle: string;
  facilities: string[];
  feats: Array<{ title: string; description: string }>;
  stats: Array<[string, string]>;
  quotes: Array<{ text: string; name: string; role: string }>;
  faqTitle: string;
  faq: Array<[string, string]>;
  joinTitle: string;
  joinLead: string;
  formTitle: string;
  formSub: string;
  choosePlan: string;
  goalLabel: string;
  goals: string[];
  confirm: string;
  note: string;
}

const GYM: Record<Lang, GymCopy> = {
  ar: {
    heroBadge: 'نادٍ رياضي فاخر · تدريب احترافي',
    joinCta: 'اشترك الآن',
    exploreCta: 'استكشف البرامج',
    heroMessage: 'أريد الاستفسار عن عضويات النادي',
    openDaily: 'مفتوح يومياً',
    premium: 'تجهيزات فاخرة',
    members: 'عضو نشط',
    programsEyebrow: 'برامجنا',
    programsTitle: 'تدريب مصمم لكل هدف',
    programsLead: 'من القوة واللياقة إلى الاستشفاء والمرونة، اختر البرنامج الذي يناسبك.',
    programs: [
      { icon: 'zap', title: 'قوة وتضخيم', description: 'أوزان حرة وأجهزة متكاملة مع برنامج تدريجي.' },
      { icon: 'heart', title: 'لياقة وكارديو', description: 'حصص عالية الكثافة لحرق الدهون وتقوية القلب.' },
      { icon: 'target', title: 'يوغا ومرونة', description: 'جلسات هادئة لتحسين التوازن والاسترخاء.' },
      { icon: 'users', title: 'تدريب شخصي', description: 'متابعة فردية مع مدرب معتمد وخطط مخصصة.' },
    ],
    classesEyebrow: 'الحصص الجماعية',
    classesTitle: 'جدول أسبوعي متنوع',
    classesLead: 'حصص بقيادة مدربين محترفين ضمن مجموعات صغيرة.',
    classes: [
      { day: 'السبت', title: 'HIIT Challenge', time: '18:00', coach: 'ياسين', level: 'متوسط' },
      { day: 'الأحد', title: 'Power Lift', time: '19:00', coach: 'مراد', level: 'متقدم' },
      { day: 'الاثنين', title: 'Yoga Flow', time: '17:30', coach: 'ليلى', level: 'مبتدئ' },
      { day: 'الثلاثاء', title: 'Spin Class', time: '18:30', coach: 'سامي', level: 'متوسط' },
      { day: 'الأربعاء', title: 'Boxing Fit', time: '19:30', coach: 'ياسين', level: 'متوسط' },
      { day: 'الخميس', title: 'Stretch & Recover', time: '17:00', coach: 'ليلى', level: 'مبتدئ' },
    ],
    pricingEyebrow: 'العضويات',
    pricingTitle: 'اختر عضويتك',
    pricingLead: 'أسعار واضحة بدون رسوم خفية، وإمكانية تجميد العضوية عند الحاجة.',
    popular: 'الأكثر اختياراً',
    planIncludes: ['دخول غير محدود', 'جميع الحصص الجماعية', 'دعم المدربين', 'خزانة خاصة'],
    coachesEyebrow: 'فريق التدريب',
    coachesTitle: 'مدربون معتمدون في خدمتك',
    coachesLead: 'خبرة عملية وشهادات معترف بها لمساعدتك على التقدم بأمان.',
    aboutTitle: 'مساحة صُممت لتحقيق أهدافك',
    aboutLead: 'نادٍ رياضي متكامل يجمع بين تجهيزات عالمية وبرامج تدريبية مدروسة ومساحات استشفاء، مع فريق يتابع تقدمك خطوة بخطوة.',
    facilitiesEyebrow: 'المرافق',
    facilitiesTitle: 'كل ما تحتاجه في مكان واحد',
    facilities: ['صالة أوزان حديثة', 'منطقة كارديو واسعة', 'استوديو حصص جماعية', 'ساونا واستشفاء', 'خزائن آمنة', 'مقهى صحي'],
    feats: [
      { title: 'تجهيزات عالمية', description: 'أجهزة حديثة بصيانة دورية.' },
      { title: 'مدربون معتمدون', description: 'شهادات معترف بها وخبرة عملية.' },
      { title: 'برامج مرنة', description: 'خطط تناسب جدولك وهدفك.' },
      { title: 'بيئة محفزة', description: 'مجتمع يدعمك للاستمرار.' },
    ],
    stats: [['+800', 'عضو نشط'], ['+40', 'حصة أسبوعياً'], ['+12', 'مدرب معتمد'], ['4.9/5', 'تقييم الأعضاء']],
    quotes: [
      { text: 'أفضل نادٍ جربته، التجهيزات نظيفة والمدربون يتابعونك باهتمام حقيقي.', name: 'أمين ب.', role: 'عضو منذ سنتين' },
      { text: 'حصص اليوغا غيّرت يومي بالكامل، والمساحة هادئة ومريحة.', name: 'سارة م.', role: 'عضو' },
      { text: 'برنامج القوة ساعدني على تحقيق نتائج لم أحققها من قبل.', name: 'كريم ع.', role: 'عضو' },
    ],
    faqTitle: 'أسئلة شائعة',
    faq: [
      ['هل يمكنني تجربة النادي قبل الاشتراك؟', 'نعم، نقدّم جلسة تجريبية مجانية واحدة بعد حجز موعد.'],
      ['هل توجد حصص للنساء؟', 'نعم، لدينا أوقات مخصصة للنساء مع مدربات معتمدات.'],
      ['ما هي أوقات العمل؟', 'مفتوح يومياً من 06:00 صباحاً حتى 23:00 مساءً.'],
      ['هل العضوية قابلة للتجميد؟', 'نعم، يمكن تجميد العضوية حتى 30 يوماً سنوياً.'],
      ['هل التدريب الشخصي مشمول؟', 'التدريب الشخصي متاح كخدمة إضافية أو ضمن العضوية السنوية.'],
    ],
    joinTitle: 'ابدأ رحلتك اليوم',
    joinLead: 'اختر العضوية وسنتواصل معك لتأكيد الاشتراك وجدولة جلسة التقييم.',
    formTitle: 'طلب اشتراك',
    formSub: 'املأ البيانات وسيتصل بك فريقنا خلال 24 ساعة.',
    choosePlan: 'العضوية',
    goalLabel: 'هدفك',
    goals: ['فقدان الوزن', 'بناء العضلات', 'تحسين اللياقة', 'الاسترخاء والمرونة'],
    confirm: 'إرسال طلب الاشتراك',
    note: 'بدون رسوم تسجيل — جلسة تقييم أولى مجانية.',
  },
  fr: {
    heroBadge: 'Club sportif de luxe · Coaching professionnel',
    joinCta: 'S’abonner',
    exploreCta: 'Voir les programmes',
    heroMessage: 'Je souhaite des informations sur les abonnements du club',
    openDaily: 'Ouvert tous les jours',
    premium: 'Équipements haut de gamme',
    members: 'membres actifs',
    programsEyebrow: 'Nos programmes',
    programsTitle: 'Un entraînement pour chaque objectif',
    programsLead: 'De la force à la récupération, choisissez le programme qui vous convient.',
    programs: [
      { icon: 'zap', title: 'Force & musculation', description: 'Poids libres et machines complètes avec progression encadrée.' },
      { icon: 'heart', title: 'Cardio & fitness', description: 'Séances intensives pour brûler les graisses et renforcer le cœur.' },
      { icon: 'target', title: 'Yoga & souplesse', description: 'Séances calmes pour l’équilibre et la récupération.' },
      { icon: 'users', title: 'Coaching personnel', description: 'Suivi individuel avec un coach certifié et un plan sur mesure.' },
    ],
    classesEyebrow: 'Cours collectifs',
    classesTitle: 'Un planning varié chaque semaine',
    classesLead: 'Des cours animés par des coachs professionnels en petits groupes.',
    classes: [
      { day: 'Samedi', title: 'HIIT Challenge', time: '18:00', coach: 'Yacine', level: 'Intermédiaire' },
      { day: 'Dimanche', title: 'Power Lift', time: '19:00', coach: 'Mourad', level: 'Avancé' },
      { day: 'Lundi', title: 'Yoga Flow', time: '17:30', coach: 'Leila', level: 'Débutant' },
      { day: 'Mardi', title: 'Spin Class', time: '18:30', coach: 'Sami', level: 'Intermédiaire' },
      { day: 'Mercredi', title: 'Boxing Fit', time: '19:30', coach: 'Yacine', level: 'Intermédiaire' },
      { day: 'Jeudi', title: 'Stretch & Recover', time: '17:00', coach: 'Leila', level: 'Débutant' },
    ],
    pricingEyebrow: 'Abonnements',
    pricingTitle: 'Choisissez votre formule',
    pricingLead: 'Des tarifs clairs sans frais cachés, avec possibilité de suspension.',
    popular: 'Le plus choisi',
    planIncludes: ['Accès illimité', 'Tous les cours collectifs', 'Accompagnement des coachs', 'Vestiaire privé'],
    coachesEyebrow: 'L’équipe de coaching',
    coachesTitle: 'Des coachs certifiés à votre service',
    coachesLead: 'Expérience pratique et certifications reconnues pour progresser en sécurité.',
    aboutTitle: 'Un espace pensé pour vos objectifs',
    aboutLead: 'Un club complet qui réunit des équipements de classe mondiale, des programmes étudiés et des espaces de récupération, avec une équipe qui suit vos progrès.',
    facilitiesEyebrow: 'Les installations',
    facilitiesTitle: 'Tout ce qu’il faut au même endroit',
    facilities: ['Salle de musculation moderne', 'Espace cardio', 'Studio de cours collectifs', 'Sauna & récupération', 'Vestiaires sécurisés', 'Café santé'],
    feats: [
      { title: 'Équipements premium', description: 'Machines récentes et entretenues régulièrement.' },
      { title: 'Coachs certifiés', description: 'Certifications reconnues et expérience pratique.' },
      { title: 'Programmes flexibles', description: 'Des plans adaptés à votre emploi du temps.' },
      { title: 'Ambiance motivante', description: 'Une communauté qui vous soutient.' },
    ],
    stats: [['+800', 'membres actifs'], ['+40', 'cours par semaine'], ['+12', 'coachs certifiés'], ['4,9/5', 'note des membres']],
    quotes: [
      { text: 'Le meilleur club que j’ai essayé, les équipements sont propres et les coachs vraiment attentifs.', name: 'Amine B.', role: 'Membre depuis 2 ans' },
      { text: 'Les cours de yoga ont changé mon quotidien, l’espace est calme et confortable.', name: 'Sarah M.', role: 'Membre' },
      { text: 'Le programme de force m’a permis d’atteindre des résultats inédits.', name: 'Karim A.', role: 'Membre' },
    ],
    faqTitle: 'Questions fréquentes',
    faq: [
      ['Puis-je essayer avant de m’abonner ?', 'Oui, une séance d’essai gratuite est offerte sur réservation.'],
      ['Y a-t-il des créneaux pour les femmes ?', 'Oui, des horaires dédiés avec des coachs certifiées.'],
      ['Quels sont les horaires ?', 'Ouvert tous les jours de 06:00 à 23:00.'],
      ['L’abonnement est-il suspendable ?', 'Oui, jusqu’à 30 jours par an.'],
      ['Le coaching personnel est-il inclus ?', 'Il est disponible en option ou inclus dans l’abonnement annuel.'],
    ],
    joinTitle: 'Commencez votre parcours aujourd’hui',
    joinLead: 'Choisissez votre formule et nous vous contactons pour confirmer et planifier l’évaluation.',
    formTitle: 'Demande d’abonnement',
    formSub: 'Renseignez vos données et notre équipe vous appelle sous 24 heures.',
    choosePlan: 'Formule',
    goalLabel: 'Votre objectif',
    goals: ['Perdre du poids', 'Gagner du muscle', 'Améliorer la forme', 'Détente & souplesse'],
    confirm: 'Envoyer la demande',
    note: 'Sans frais d’inscription — première évaluation offerte.',
  },
  en: {
    heroBadge: 'Luxury fitness club · Professional coaching',
    joinCta: 'Join now',
    exploreCta: 'Explore programs',
    heroMessage: 'I would like information about club memberships',
    openDaily: 'Open daily',
    premium: 'Premium equipment',
    members: 'active members',
    programsEyebrow: 'Our programs',
    programsTitle: 'Training built for every goal',
    programsLead: 'From strength and cardio to recovery and mobility, pick the program that fits you.',
    programs: [
      { icon: 'zap', title: 'Strength & muscle', description: 'Free weights and full machines with structured progression.' },
      { icon: 'heart', title: 'Cardio & fitness', description: 'High-intensity sessions to burn fat and strengthen the heart.' },
      { icon: 'target', title: 'Yoga & mobility', description: 'Calm sessions for balance and recovery.' },
      { icon: 'users', title: 'Personal coaching', description: 'One-on-one follow-up with a certified coach and custom plan.' },
    ],
    classesEyebrow: 'Group classes',
    classesTitle: 'A varied weekly schedule',
    classesLead: 'Classes led by professional coaches in small groups.',
    classes: [
      { day: 'Saturday', title: 'HIIT Challenge', time: '18:00', coach: 'Yacine', level: 'Intermediate' },
      { day: 'Sunday', title: 'Power Lift', time: '19:00', coach: 'Mourad', level: 'Advanced' },
      { day: 'Monday', title: 'Yoga Flow', time: '17:30', coach: 'Leila', level: 'Beginner' },
      { day: 'Tuesday', title: 'Spin Class', time: '18:30', coach: 'Sami', level: 'Intermediate' },
      { day: 'Wednesday', title: 'Boxing Fit', time: '19:30', coach: 'Yacine', level: 'Intermediate' },
      { day: 'Thursday', title: 'Stretch & Recover', time: '17:00', coach: 'Leila', level: 'Beginner' },
    ],
    pricingEyebrow: 'Memberships',
    pricingTitle: 'Choose your membership',
    pricingLead: 'Clear prices with no hidden fees, and the option to freeze when needed.',
    popular: 'Most popular',
    planIncludes: ['Unlimited access', 'All group classes', 'Coach support', 'Private locker'],
    coachesEyebrow: 'Coaching team',
    coachesTitle: 'Certified coaches at your service',
    coachesLead: 'Practical experience and recognized certifications to help you progress safely.',
    aboutTitle: 'A space designed for your goals',
    aboutLead: 'A complete fitness club combining world-class equipment, smart training programs and recovery spaces, with a team that follows your progress step by step.',
    facilitiesEyebrow: 'Facilities',
    facilitiesTitle: 'Everything you need in one place',
    facilities: ['Modern weight room', 'Large cardio zone', 'Group class studio', 'Sauna & recovery', 'Secure lockers', 'Healthy café'],
    feats: [
      { title: 'World-class equipment', description: 'Modern machines with regular maintenance.' },
      { title: 'Certified coaches', description: 'Recognized certifications and practical experience.' },
      { title: 'Flexible programs', description: 'Plans that fit your schedule and goal.' },
      { title: 'Motivating environment', description: 'A community that keeps you going.' },
    ],
    stats: [['+800', 'active members'], ['+40', 'weekly classes'], ['+12', 'certified coaches'], ['4.9/5', 'member rating']],
    quotes: [
      { text: 'The best club I have tried, clean equipment and coaches who genuinely follow your progress.', name: 'Amine B.', role: 'Member for 2 years' },
      { text: 'The yoga classes changed my routine completely, the space is calm and comfortable.', name: 'Sarah M.', role: 'Member' },
      { text: 'The strength program helped me reach results I never achieved before.', name: 'Karim A.', role: 'Member' },
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      ['Can I try the club before joining?', 'Yes, one free trial session is available upon booking.'],
      ['Are there women-only hours?', 'Yes, dedicated hours with certified female coaches.'],
      ['What are the opening hours?', 'Open daily from 06:00 to 23:00.'],
      ['Can I freeze my membership?', 'Yes, for up to 30 days per year.'],
      ['Is personal training included?', 'It is available as an add-on or included in the annual membership.'],
    ],
    joinTitle: 'Start your journey today',
    joinLead: 'Choose your membership and we will contact you to confirm and schedule your assessment.',
    formTitle: 'Membership request',
    formSub: 'Fill in your details and our team will call you within 24 hours.',
    choosePlan: 'Membership',
    goalLabel: 'Your goal',
    goals: ['Lose weight', 'Build muscle', 'Improve fitness', 'Relaxation & mobility'],
    confirm: 'Send membership request',
    note: 'No registration fee — first assessment session is free.',
  },
};

export function gymPage(config: RenderConfig, s: UiStrings, lang: Lang): string {
  const copy = GYM[lang];
  const plans = config.products.filter((p) => p.name);
  const team = config.team || [];
  const heroImage = config.coverUrl
    ? `<img src="${attr(config.coverUrl)}" alt="${attr(config.siteName)}" width="900" height="1100" fetchpriority="high" decoding="async">`
    : '';
  const about = aboutPhoto(config);
  const heroWa = waHref(config, `${copy.heroMessage} — ${config.siteName}`);
  const joinWa = waHref(config, `${copy.joinTitle} — ${config.siteName}`);

  return `<section class="hero gym-hero" id="top">
    <div class="container hero-grid">
      <div class="hero-copy" data-reveal>
        <span class="badge">${icon('zap')}${esc(copy.heroBadge)}</span>
        <h1 class="h1 mt-3">${esc(config.siteName)}</h1>
        <p class="lead">${esc(config.description)}</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="#join">${icon('zap')}${esc(copy.joinCta)}</a>
          <a class="btn btn-wa" href="${attr(heroWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
        <div class="gym-badges">
          <span>${icon('clock')}${esc(copy.openDaily)} · ${esc(config.hours || '06:00 – 23:00')}</span>
          <span>${icon('award')}${esc(copy.premium)}</span>
        </div>
        <div class="hero-stats">
          ${copy.stats.slice(0, 3).map(([num, label]) => `<div><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
        </div>
      </div>
      <div class="hero-media gym-hero-media${heroImage ? '' : ' no-img'}" data-mark="${attr(initials(config.siteName))}" data-reveal>${heroImage}
        <div class="float-card"><span class="float-icon">${icon('users')}</span><div><strong>+800</strong><span>${esc(copy.members)}</span></div></div>
      </div>
    </div>
  </section>

  <div class="trust-strip"><div class="container">
    <span class="trust-item">${icon('zap')}${esc(copy.programs[0].title)}</span>
    <span class="trust-item">${icon('heart')}${esc(copy.programs[1].title)}</span>
    <span class="trust-item">${icon('award')}${esc(copy.coachesTitle)}</span>
    <span class="trust-item">${icon('clock')}${esc(copy.openDaily)}</span>
  </div></div>

  <section class="section bg-soft" id="programs">
    <div class="container">
      ${sectionHead(copy.programsEyebrow, copy.programsTitle, copy.programsLead, true)}
      <div class="gym-programs-grid">
        ${copy.programs.map((item, i) => `<article class="gym-program" data-reveal>
          <span class="gym-program-num">${String(i + 1).padStart(2, '0')}</span>
          <span class="gym-program-icon">${icon(item.icon as any)}</span>
          <h3 class="h3">${esc(item.title)}</h3>
          <p>${esc(item.description)}</p>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="classes">
    <div class="container">
      ${sectionHead(copy.classesEyebrow, copy.classesTitle, copy.classesLead)}
      <div class="gym-class-list">
        ${copy.classes.map((item) => `<article class="gym-class" data-reveal>
          <span class="gym-class-day">${esc(item.day)}</span>
          <div class="gym-class-main"><h3>${esc(item.title)}</h3><span>${icon('users')}${esc(item.coach)}</span></div>
          <span class="gym-class-time">${icon('clock')}${esc(item.time)}</span>
          <span class="gym-class-level">${esc(item.level)}</span>
        </article>`).join('')}
      </div>
    </div>
  </section>

  <section class="section bg-soft" id="pricing">
    <div class="container">
      ${sectionHead(copy.pricingEyebrow, copy.pricingTitle, copy.pricingLead, true)}
      <div class="gym-plans-grid">
        ${plans.map((p, i) => `<article class="gym-plan${i === 1 ? ' is-popular' : ''}" data-reveal>
          ${i === 1 ? `<span class="gym-plan-badge">${esc(copy.popular)}</span>` : ''}
          <span class="gym-plan-period">${esc(p.category || '')}</span>
          <h3>${esc(p.name)}</h3>
          <div class="gym-plan-price">${money(p.price, lang)}</div>
          ${p.description ? `<p>${esc(p.description)}</p>` : ''}
          <ul class="gym-plan-list">${copy.planIncludes.map((f) => `<li>${icon('check')}${esc(f)}</li>`).join('')}</ul>
          <button class="btn btn-primary btn-block" type="button" data-pick-plan="${attr(p.name)}">${icon('zap')}${esc(copy.joinCta)}</button>
        </article>`).join('')}
      </div>
    </div>
  </section>

  ${team.length ? `<section class="section" id="coaches">
    <div class="container">
      ${sectionHead(copy.coachesEyebrow, copy.coachesTitle, copy.coachesLead, true)}
      <div class="gym-team-grid">${team.map((member) => `<article class="gym-coach" data-reveal>
        <div class="gym-coach-photo">${member.photoUrl ? `<img src="${attr(member.photoUrl)}" alt="${attr(member.name)}" loading="lazy" decoding="async" width="700" height="800">` : `<span class="gym-initials">${esc(initialsFor(member.name))}</span>`}</div>
        <div class="gym-coach-body"><h3>${esc(member.name)}</h3><span class="gym-coach-role">${esc(member.role)}</span>${member.specialty ? `<p>${esc(member.specialty)}</p>` : ''}</div>
      </article>`).join('')}</div>
    </div>
  </section>` : ''}

  <section class="section bg-soft" id="about">
    <div class="container about-grid">
      <div class="about-media${about ? '' : ' no-img'}" data-reveal>
        ${about ? `<img src="${attr(about)}" alt="${attr(config.siteName)}" loading="lazy" decoding="async" width="800" height="700">` : ''}
        <div class="about-badge">${icon('zap')}+800 ${esc(copy.members)}</div>
      </div>
      <div data-reveal>
        <span class="eyebrow">${esc(s.about)}</span>
        <h2 class="h2 mt-2">${esc(copy.aboutTitle)}</h2>
        <p class="lead mt-2">${esc(copy.aboutLead)}</p>
        <ul class="checklist">
          ${copy.feats.map((f) => `<li><span class="tick">${icon('check')}</span><span>${esc(f.title)} — ${esc(f.description)}</span></li>`).join('')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section" id="facilities">
    <div class="container">
      ${sectionHead(copy.facilitiesEyebrow, copy.facilitiesTitle, undefined, true)}
      <div class="gym-facilities">
        ${copy.facilities.map((f) => `<span class="gym-facility" data-reveal>${icon('check')}${esc(f)}</span>`).join('')}
      </div>
    </div>
  </section>

  <section class="stats-band">
    <div class="container stats-grid">
      ${copy.stats.map(([num, label]) => `<div class="stat"><div class="num">${esc(num)}</div><div class="lbl">${esc(label)}</div></div>`).join('')}
    </div>
  </section>

  <section class="section">
    <div class="container">${sectionHead(s.testimonials, s.testimonials, undefined, true)}
      <div class="grid g3">${copy.quotes.map((q) => `<div class="quote" data-reveal>
        <div class="stars" aria-label="5/5">★★★★★</div>
        <p>“${esc(q.text)}”</p>
        <div class="who"><span class="avatar">${esc(initialsFor(q.name))}</span><div><strong>${esc(q.name)}</strong><span>${esc(q.role)}</span></div></div>
      </div>`).join('')}</div>
    </div>
  </section>

  <section class="section bg-soft" id="faq">
    <div class="container">
      ${sectionHead(s.faq, copy.faqTitle, undefined, true)}
      <div class="faq-list">
        ${copy.faq.map(([q, a]) => `<details class="faq" data-reveal>
          <summary>${esc(q)}<span class="faq-ic">${icon('plus')}</span></summary>
          <p>${esc(a)}</p>
        </details>`).join('')}
      </div>
    </div>
  </section>

  <section class="section" id="join">
    <div class="container gym-join-wrap">
      <div data-reveal>
        <span class="eyebrow">${esc(s.getStarted)}</span>
        <h2 class="h2 mt-2">${esc(copy.joinTitle)}</h2>
        <p class="lead mt-2">${esc(copy.joinLead)}</p>
        <ul class="checklist">
          ${copy.planIncludes.map((f) => `<li><span class="tick">${icon('check')}</span><span>${esc(f)}</span></li>`).join('')}
        </ul>
        <div class="gym-hours">
          <div class="hours-row"><span>${icon('clock')}${esc(s.hours)}</span><strong>${esc(config.hours || '06:00 – 23:00')}</strong></div>
          <div class="hours-row"><span>${icon('map')}${esc(s.location)}</span><strong>${esc(config.address || config.city || '')}</strong></div>
        </div>
        <div class="gym-contact-actions">
          <a class="btn btn-light" href="tel:${attr(config.phone)}">${icon('phone')}${esc(s.callNow)}</a>
          <a class="btn btn-wa" href="${attr(joinWa)}" target="_blank" rel="noopener">${icon('whatsapp')}${esc(s.whatsapp)}</a>
        </div>
      </div>
      <form class="gym-join-card" data-lead-form data-lead-kind="gym-join" novalidate>
        <h3>${esc(copy.formTitle)}</h3>
        <p class="booking-sub">${esc(copy.formSub)}</p>
        <div class="form-grid">
          <div class="field"><label for="gym-name">${esc(s.name)}</label><input id="gym-name" name="name" required maxlength="80" autocomplete="name"><span class="err">${esc(s.required)}</span></div>
          <div class="field"><label for="gym-phone">${esc(s.phone)}</label><input id="gym-phone" name="phone" type="tel" required maxlength="20" autocomplete="tel" dir="ltr"><span class="err">${esc(s.invalidPhone)}</span></div>
          <div class="field full"><label for="gym-email">${esc(s.email)}</label><input id="gym-email" name="email" type="email" maxlength="120" autocomplete="email" dir="ltr"></div>
          <div class="field full"><label for="gym-plan">${esc(copy.choosePlan)}</label><select id="gym-plan" name="planName" data-join-plan required>
            <option value="">${esc(copy.choosePlan)}</option>
            ${plans.map((p) => `<option value="${attr(p.name)}">${esc(p.name)} — ${money(p.price, lang)}</option>`).join('')}
          </select><span class="err">${esc(s.required)}</span></div>
          <div class="field full"><label for="gym-goal">${esc(copy.goalLabel)}</label><select id="gym-goal" name="goal">
            ${copy.goals.map((g) => `<option value="${attr(g)}">${esc(g)}</option>`).join('')}
          </select></div>
          <div class="field full"><label for="gym-msg">${esc(s.message)}</label><textarea id="gym-msg" name="message" maxlength="1200"></textarea></div>
          <input type="text" name="website" tabindex="-1" autocomplete="off" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0" aria-hidden="true">
        </div>
        <button class="btn btn-primary btn-block mt-3" type="submit">${icon('send')}${esc(copy.confirm)}</button>
        <div class="form-status" role="status"></div>
        <p class="form-note center mt-2">${esc(copy.note)}</p>
      </form>
    </div>
  </section>

  ${contactSection(config, s)}`;
}

export function pageFor(template: string, config: RenderConfig, lang: Lang): string {
  const s = ui(lang);
  switch (template) {
    case 'store': return storePage(config, s, lang);
    case 'company': return companyPage(config, s, lang);
    case 'portfolio': return portfolioPage(config, s, lang);
    case 'card': return cardPage(config, s, lang);
    case 'restaurant': return restaurantPage(config, s, lang);

    // Pharmacy has its own layout with WhatsApp ordering.
    case 'pharmacy':
      return pharmacyPage(config, s, lang);

    // Store-style templates
    case 'agriculture':
    case 'electronics':
    case 'fashion':
      return storePage(config, s, lang);
    case 'carrental':
      return carRentalPage(config, s, lang);

    // Restaurant-style templates
    case 'bakery':
      return restaurantPage(config, s, lang);

    // Portfolio-style templates
    case 'beauty':
    case 'photography':
    case 'wedding':
      return portfolioPage(config, s, lang);

    // Company-style templates
    case 'medical':
      return medicalPage(config, s, lang);
    case 'lawyer':
      return lawyerPage(config, s, lang);
    case 'realestate':
      return realEstatePage(config, s, lang);
    case 'education':
      return educationPage(config, s, lang);
    case 'construction':
      return constructionPage(config, s, lang);
    case 'clinic':
      return clinicPage(config, s, lang);
    case 'hotel':
      return hotelPage(config, s, lang);
    case 'showroom':
      return showroomPage(config, s, lang);
    case 'digital':
      return digitalPage(config, s, lang);
    case 'gym':
      return gymPage(config, s, lang);

    // Landing-style templates
    case 'fitness':
    case 'travel':
    case 'nonprofit':
    case 'events':
    case 'landing':
      return landingPage(config, s, lang);

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
    case 'pharmacy':
      return {
        ...base,
        '@type': 'Pharmacy',
        image: config.coverUrl || undefined,
        priceRange: 'DZD',
        openingHours: config.hours || undefined,
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Products',
          itemListElement: config.products.slice(0, 12).map((p, index) => ({
            '@type': 'Offer',
            position: index + 1,
            price: p.price,
            priceCurrency: 'DZD',
            availability: 'https://schema.org/InStock',
            itemOffered: {
              '@type': 'Product',
              name: p.name,
              description: p.description || undefined,
              image: p.imageUrl || undefined,
              category: p.category || undefined,
            },
          })),
        },
        employee: (config.team || []).map((member) => ({
          '@type': 'Person',
          name: member.name,
          jobTitle: member.role,
          image: member.photoUrl || undefined,
        })),
      };
    case 'electronics':
    case 'fashion':
    case 'agriculture':
      return { ...base, '@type': 'Store', image: config.coverUrl || undefined, priceRange: 'DZD' };
    case 'carrental':
      return {
        ...base,
        '@type': 'AutoRental',
        image: config.coverUrl || undefined,
        priceRange: 'DZD',
        openingHours: config.hours || undefined,
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Fleet',
          itemListElement: config.products.slice(0, 12).map((p, index) => ({
            '@type': 'Offer',
            position: index + 1,
            price: p.price,
            priceCurrency: 'DZD',
            availability: 'https://schema.org/InStock',
            itemOffered: {
              '@type': 'Car',
              name: p.name,
              description: p.description || undefined,
              image: p.imageUrl || undefined,
            },
          })),
        },
      };
    case 'restaurant': return { ...base, '@type': 'Restaurant', servesCuisine: 'Algerian', image: config.coverUrl || undefined };
    case 'bakery': return { ...base, '@type': 'Bakery', image: config.coverUrl || undefined };
    case 'medical':
      return {
        ...base,
        '@type': 'MedicalClinic',
        image: config.coverUrl || undefined,
        priceRange: 'DZD',
        openingHours: config.hours || undefined,
        medicalSpecialty: ['PrimaryCare', 'Pediatric', 'Gynecologic', 'Cardiovascular'],
        availableService: config.products.slice(0, 12).map((p) => ({
          '@type': 'MedicalProcedure',
          name: p.name,
          description: p.description || undefined,
        })),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Services',
          itemListElement: config.products.slice(0, 12).map((p, index) => ({
            '@type': 'Offer',
            position: index + 1,
            price: p.price,
            priceCurrency: 'DZD',
            itemOffered: { '@type': 'MedicalProcedure', name: p.name },
          })),
        },
        employee: (config.team || []).map((member) => ({
          '@type': 'Physician',
          name: member.name,
          jobTitle: member.role,
          image: member.photoUrl || undefined,
        })),
      };
    case 'lawyer': return {
      ...base,
      '@type': 'LegalService',
      image: config.coverUrl || undefined,
      priceRange: 'DZD',
      openingHours: config.hours || undefined,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Legal services',
        itemListElement: config.services.slice(0, 12).map((service, index) => ({
          '@type': 'Offer',
          position: index + 1,
          name: service.title,
          description: service.description,
          priceCurrency: 'DZD',
          availability: 'https://schema.org/InStock',
        })),
      },
      employee: (config.team || []).map((member) => ({
        '@type': 'Person',
        name: member.name,
        jobTitle: member.role,
        image: member.photoUrl || undefined,
      })),
    };
    case 'realestate': return {
      ...base,
      '@type': 'RealEstateAgent',
      image: config.coverUrl || undefined,
      priceRange: 'DZD',
      openingHours: config.hours || undefined,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Properties',
        itemListElement: config.products.slice(0, 12).map((p, index) => ({
          '@type': 'Offer',
          position: index + 1,
          name: p.name,
          description: p.description,
          price: p.price,
          priceCurrency: 'DZD',
          availability: 'https://schema.org/InStock',
        })),
      },
      employee: (config.team || []).map((member) => ({
        '@type': 'Person',
        name: member.name,
        jobTitle: member.role,
        image: member.photoUrl || undefined,
      })),
    };
    case 'education': return {
      ...base,
      '@type': 'EducationalOrganization',
      image: config.coverUrl || undefined,
      priceRange: 'DZD',
      openingHours: config.hours || undefined,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Courses',
        itemListElement: config.products.slice(0, 12).map((p, index) => ({
          '@type': 'Offer',
          position: index + 1,
          name: p.name,
          description: p.description,
          price: p.price,
          priceCurrency: 'DZD',
          availability: 'https://schema.org/InStock',
        })),
      },
      employee: (config.team || []).map((member) => ({
        '@type': 'Person',
        name: member.name,
        jobTitle: member.role,
        image: member.photoUrl || undefined,
      })),
    };
    case 'hotel': return {
      ...base,
      '@type': 'Hotel',
      image: config.coverUrl || undefined,
      priceRange: 'DZD',
      openingHours: config.hours || undefined,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Rooms and suites',
        itemListElement: config.products.slice(0, 12).map((p, index) => ({
          '@type': 'Offer',
          position: index + 1,
          name: p.name,
          description: p.description,
          price: p.price,
          priceCurrency: 'DZD',
          availability: 'https://schema.org/InStock',
        })),
      },
      employee: (config.team || []).map((member) => ({
        '@type': 'Person',
        name: member.name,
        jobTitle: member.role,
        image: member.photoUrl || undefined,
      })),
    };
    case 'showroom': return {
      ...base,
      '@type': 'AutoDealer',
      image: config.coverUrl || undefined,
      priceRange: 'DZD',
      openingHours: config.hours || undefined,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Cars',
        itemListElement: config.products.slice(0, 12).map((p, index) => ({
          '@type': 'Offer',
          position: index + 1,
          name: p.name,
          description: p.description,
          price: p.price,
          priceCurrency: 'DZD',
          availability: 'https://schema.org/InStock',
        })),
      },
      employee: (config.team || []).map((member) => ({
        '@type': 'Person',
        name: member.name,
        jobTitle: member.role,
        image: member.photoUrl || undefined,
      })),
    };
    case 'digital': return {
      ...base,
      '@type': 'OnlineStore',
      image: config.coverUrl || undefined,
      priceRange: 'DZD',
      paymentAccepted: 'BaridiMob, CCP, Bank transfer',
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Digital products',
        itemListElement: config.products.slice(0, 12).map((p, index) => ({
          '@type': 'Offer',
          position: index + 1,
          price: p.price,
          priceCurrency: 'DZD',
          availability: 'https://schema.org/InStock',
          itemOffered: {
            '@type': 'Product',
            name: p.name,
            description: p.description || undefined,
            image: p.imageUrl || undefined,
            category: p.category || undefined,
            additionalType: 'https://schema.org/DigitalDocument',
          },
        })),
      },
    };
    case 'gym': return {
      ...base,
      '@type': 'ExerciseGym',
      image: config.coverUrl || undefined,
      priceRange: 'DZD',
      openingHours: config.hours || undefined,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Memberships',
        itemListElement: config.products.slice(0, 12).map((p, index) => ({
          '@type': 'Offer',
          position: index + 1,
          name: p.name,
          description: p.description || undefined,
          price: p.price,
          priceCurrency: 'DZD',
          availability: 'https://schema.org/InStock',
        })),
      },
      employee: (config.team || []).map((member) => ({
        '@type': 'Person',
        name: member.name,
        jobTitle: member.role,
        image: member.photoUrl || undefined,
      })),
    };
    case 'clinic': return {
      ...base,
      '@type': 'MedicalClinic',
      image: config.coverUrl || undefined,
      priceRange: 'DZD',
      openingHours: config.hours || undefined,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Medical services',
        itemListElement: config.products.slice(0, 12).map((p, index) => ({
          '@type': 'Offer',
          position: index + 1,
          name: p.name,
          description: p.description,
          price: p.price,
          priceCurrency: 'DZD',
          availability: 'https://schema.org/InStock',
        })),
      },
      employee: (config.team || []).map((member) => ({
        '@type': 'Person',
        name: member.name,
        jobTitle: member.role,
        image: member.photoUrl || undefined,
      })),
    };
    case 'fitness': return { ...base, '@type': 'ExerciseGym', image: config.coverUrl || undefined };
    case 'beauty': return { ...base, '@type': 'BeautySalon', image: config.coverUrl || undefined };
    case 'travel': return { ...base, '@type': 'TravelAgency', image: config.coverUrl || undefined };
    case 'construction': return {
      ...base,
      '@type': 'GeneralContractor',
      image: config.coverUrl || undefined,
      priceRange: 'DZD',
      openingHours: config.hours || undefined,
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Construction services',
        itemListElement: config.services.slice(0, 12).map((service, index) => ({
          '@type': 'Offer',
          position: index + 1,
          name: service.title,
          description: service.description,
          priceCurrency: 'DZD',
          availability: 'https://schema.org/InStock',
        })),
      },
      employee: (config.team || []).map((member) => ({
        '@type': 'Person',
        name: member.name,
        jobTitle: member.role,
        image: member.photoUrl || undefined,
      })),
    };
    case 'nonprofit': return { ...base, '@type': 'NGO', image: config.coverUrl || undefined };
    case 'events': return { ...base, '@type': 'EventVenue', image: config.coverUrl || undefined };
    case 'portfolio': return { ...base, '@type': 'Person', jobTitle: config.tagline };
    case 'photography': return { ...base, '@type': 'Person', jobTitle: config.tagline };
    case 'wedding': return { ...base, '@type': 'LocalBusiness', image: config.coverUrl || undefined };
    case 'card': return { ...base, '@type': 'Person', jobTitle: config.tagline };
    case 'company': return { ...base, '@type': 'Organization', logo: config.logoUrl || undefined };
    default: return { ...base, '@type': 'Organization' };
  }
}

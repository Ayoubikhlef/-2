/**
 * AOS entry loader.
 *
 * External on purpose: the storefront CSP pins inline scripts by hash, so the
 * animation must not depend on an inline <script>. It waits for both the page
 * and the React app before finishing, so a cached document with dead assets
 * never hides the SEO fallback behind a "finished" loader. Once the counter
 * reaches 100% the site is handed over immediately (short door fade), never
 * left waiting on a long animation.
 */
(function () {
  var loader = document.getElementById('aos-loader');
  if (!loader) return;

  // Phones only: on desktop the store must be visible immediately, with no
  // entrance animation at all. This runs while the page is still parsing, so
  // a desktop visitor never sees a flash of the loader.
  var finePointer = false;
  var coarsePointer = false;
  try {
    finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  } catch (e) {
    /* old browser */
  }
  var phone = /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || coarsePointer;
  if (!phone || finePointer) {
    loader.parentNode.removeChild(loader);
    return;
  }

  var bar = document.getElementById('aosBar');
  var pct = document.getElementById('aosPct');
  var tag = loader.querySelector('[data-loader-tag]');
  var hint = loader.querySelector('[data-boot-hint]');

  var lang = 'ar';
  try {
    var saved = window.localStorage.getItem('language');
    if (saved === 'ar' || saved === 'fr' || saved === 'en') lang = saved;
  } catch (e) {
    /* private mode */
  }
  var taglines = {
    ar: 'إعلام آلي وخدمات رقمية وذكاء اصطناعي',
    fr: 'Automatisation, services numériques et IA',
    en: 'Automation, digital services & AI',
  };
  var hints = {
    ar: 'جارٍ تحميل المتجر...',
    fr: 'Chargement de la boutique...',
    en: 'Loading the store...',
  };
  if (tag) tag.textContent = taglines[lang];
  if (hint) hint.textContent = hints[lang];
  loader.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  var reduce = false;
  try {
    reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    /* older browser */
  }

  var minMs = reduce ? 200 : 1200;
  var start = Date.now();
  var loaded = document.readyState === 'complete';
  var mounted = window.__AOS_MOUNTED__ === true;
  var value = 0;
  var done = false;

  window.addEventListener('load', function () {
    loaded = true;
  });

  var timer = window.setInterval(function () {
    if (!document.body.contains(loader)) {
      window.clearInterval(timer);
      return;
    }
    if (window.__AOS_MOUNTED__ === true) mounted = true;

    var cap = loaded && mounted && Date.now() - start > minMs ? 100 : 92;
    value = reduce ? cap : Math.min(cap, value + Math.max(1, (cap - value) * 0.08));
    var shown = Math.round(value);
    if (bar) bar.style.width = shown + '%';
    if (pct) pct.textContent = shown + '%';

    if (shown < 100 || done) return;
    done = true;
    window.clearInterval(timer);

    if (reduce) {
      loader.remove();
      return;
    }
    // Hand the page over right away: a quick fade + door swing, then the DOM
    // node is gone. The site is already fully rendered underneath.
    window.setTimeout(function () {
      loader.classList.add('fade', 'open');
    }, 40);
    window.setTimeout(function () {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 340);
  }, 60);
})();

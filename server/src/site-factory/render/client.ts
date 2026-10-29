/**
 * Shared client runtime for generated websites.
 * No frameworks, no build step, ~10 KB.
 */
export const SITE_JS = String.raw`
(function () {
  'use strict';
  var dataEl = document.getElementById('site-data');
  if (!dataEl) return;
  var SITE = {};
  try { SITE = JSON.parse(dataEl.textContent || '{}'); } catch (e) { return; }
  var API = (SITE.apiBase || '').replace(/\/$/, '');
  var isPreview = !!SITE.preview;
  var lang = SITE.lang || 'ar';
  var storageKey = 'aos_cart_' + SITE.siteId;
  var cart = [];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    var v = Math.round(Number(n) || 0);
    try { v = new Intl.NumberFormat('fr-FR').format(v); } catch (e) { v = String(v); }
    return v + ' ' + (lang === 'ar' ? 'دج' : 'DA');
  }
  function toast(message, bad) {
    var el = $('#toast');
    if (!el) return;
    el.textContent = message;
    el.className = 'toast show' + (bad ? ' bad' : '');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.className = 'toast'; }, 4200);
  }
  function post(path, body) {
    return fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
      });
    });
  }
  function validPhone(value) {
    var v = String(value || '').replace(/[^\d+]/g, '');
    return v.length >= 8 && v.length <= 16;
  }

  // header
  var header = $('.site-header');
  var onScroll = function () {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 12);
    var top = $('.to-top');
    if (top) top.classList.toggle('show', window.scrollY > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var mobilePanel = $('#mobile-panel');
  function openMenu(open) {
    if (!mobilePanel) return;
    mobilePanel.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  $$('[data-menu-open]').forEach(function (b) { b.addEventListener('click', function () { openMenu(true); }); });
  $$('[data-menu-close]').forEach(function (b) { b.addEventListener('click', function () { openMenu(false); }); });
  if (mobilePanel) mobilePanel.addEventListener('click', function (e) { if (e.target === mobilePanel) openMenu(false); });
  $$('#mobile-panel a[href^="#"]').forEach(function (a) { a.addEventListener('click', function () { openMenu(false); }); });

  // reveal
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    $$('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    $$('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
  }

  // year
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  // faq
  $$('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      if (!item) return;
      var isOpen = item.classList.contains('open');
      $$('.faq-item.open').forEach(function (other) { other.classList.remove('open'); });
      if (!isOpen) item.classList.add('open');
    });
  });

  // lightbox
  var lightbox = $('#lightbox');
  $$('[data-lightbox]').forEach(function (el) {
    el.addEventListener('click', function () {
      var src = el.getAttribute('data-lightbox');
      if (!src || !lightbox) return;
      var img = $('img', lightbox);
      if (img) img.src = src;
      lightbox.classList.add('open');
    });
  });
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox || e.target.closest('.close')) lightbox.classList.remove('open');
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (lightbox) lightbox.classList.remove('open');
      openMenu(false);
      closeCart();
      closeModal();
    }
  });

  // shop filters + search
  var chips = $$('[data-filter]');
  var search = $('#product-search');
  function filterProducts() {
    var active = $('[data-filter].active');
    var cat = active ? active.getAttribute('data-filter') : 'all';
    var q = (search && search.value || '').trim().toLowerCase();
    var shown = 0;
    $$('[data-product-card]').forEach(function (card) {
      var okCat = cat === 'all' || card.getAttribute('data-category') === cat;
      var hay = (card.getAttribute('data-name') || '') + ' ' + (card.getAttribute('data-desc') || '');
      var okQ = !q || hay.toLowerCase().indexOf(q) !== -1;
      var show = okCat && okQ;
      card.classList.toggle('hide', !show);
      if (show) shown++;
    });
    var empty = $('#product-empty');
    if (empty) empty.classList.toggle('hide', shown > 0);
  }
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      filterProducts();
    });
  });
  if (search) search.addEventListener('input', filterProducts);

  // cart
  function readCart() {
    try {
      var raw = localStorage.getItem(storageKey);
      cart = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch (e) { cart = []; }
  }
  function saveCart() {
    try { localStorage.setItem(storageKey, JSON.stringify(cart)); } catch (e) {}
    renderCart();
  }
  function productById(id) {
    for (var i = 0; i < (SITE.products || []).length; i++) {
      if (String(SITE.products[i].id) === String(id)) return SITE.products[i];
    }
    return null;
  }
  function cartTotal() {
    return cart.reduce(function (sum, line) {
      var p = productById(line.id);
      return sum + (p ? Number(p.price) * line.qty : 0);
    }, 0);
  }
  function cartCount() {
    return cart.reduce(function (n, line) { return n + line.qty; }, 0);
  }
  function renderCart() {
    var countEls = $$('[data-cart-count]');
    countEls.forEach(function (el) {
      var n = cartCount();
      el.textContent = String(n);
      el.style.display = n ? 'grid' : 'none';
    });
    var body = $('#cart-body');
    if (!body) return;
    if (!cart.length) {
      body.innerHTML = '<div class="empty-cart">' + esc(SITE.strings.emptyCart) + '</div>';
    } else {
      body.innerHTML = cart.map(function (line) {
        var p = productById(line.id) || { name: line.name || '', price: line.price || 0, imageUrl: '' };
        var img = p.imageUrl ? '<img src="' + esc(p.imageUrl) + '" alt="' + esc(p.name) + '">' : esc((p.name || '?').charAt(0));
        return '<div class="cart-item">' +
          '<div class="cart-thumb">' + img + '</div>' +
          '<div><h4>' + esc(p.name) + '</h4><div class="p">' + money(p.price) + '</div>' +
          '<div class="qty"><button type="button" data-qty="-1" data-id="' + esc(line.id) + '" aria-label="-">−</button><span>' + line.qty + '</span><button type="button" data-qty="1" data-id="' + esc(line.id) + '" aria-label="+">+</button></div></div>' +
          '<button type="button" class="cart-remove" data-remove="' + esc(line.id) + '">' + esc(SITE.strings.remove) + '</button>' +
          '</div>';
      }).join('');
    }
    var total = $('#cart-total');
    if (total) total.textContent = money(cartTotal());
    var checkoutBtn = $('#cart-checkout');
    if (checkoutBtn) checkoutBtn.disabled = !cart.length;
    body.querySelectorAll('[data-qty]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var delta = Number(btn.getAttribute('data-qty'));
        var line = cart.filter(function (l) { return String(l.id) === String(id); })[0];
        if (!line) return;
        line.qty += delta;
        if (line.qty <= 0) cart = cart.filter(function (l) { return String(l.id) !== String(id); });
        saveCart();
      });
    });
    body.querySelectorAll('[data-remove]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-remove');
        cart = cart.filter(function (l) { return String(l.id) !== String(id); });
        saveCart();
      });
    });
  }
  function addToCart(id) {
    if (isPreview) { toast(SITE.strings.previewNote || SITE.strings.previewNote, true); return; }
    var p = productById(id);
    if (!p) return;
    var line = cart.filter(function (l) { return String(l.id) === String(id); })[0];
    if (line) line.qty += 1;
    else cart.push({ id: String(id), qty: 1 });
    saveCart();
    toast(SITE.strings.addToCart + ' ✓');
  }
  $$('[data-add]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      addToCart(btn.getAttribute('data-add'));
    });
  });
  var overlay = $('#overlay');
  var drawer = $('#cart-drawer');
  function openCart() {
    if (!drawer) return;
    readCart(); renderCart();
    drawer.classList.add('open');
    if (overlay) overlay.classList.add('open');
  }
  function closeCart() {
    if (drawer) drawer.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }
  $$('[data-open-cart]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openCart(); }); });
  $$('[data-close-cart]').forEach(function (b) { b.addEventListener('click', closeCart); });
  if (overlay) overlay.addEventListener('click', function () { closeCart(); closeModal(); });

  // checkout modal
  var checkoutModal = $('#checkout-modal');
  function openModal() {
    if (!checkoutModal) return;
    if (!cart.length) { toast(SITE.strings.emptyCart, true); return; }
    checkoutModal.classList.add('open');
    var summary = $('#checkout-lines');
    if (summary) {
      summary.innerHTML = cart.map(function (line) {
        var p = productById(line.id) || { name: '', price: 0 };
        return '<div class="order-line"><span>' + esc(p.name) + ' × ' + line.qty + '</span><strong>' + money(Number(p.price) * line.qty) + '</strong></div>';
      }).join('') + '<div class="order-line" style="border-top:1px solid var(--line);padding-top:8px;margin-top:4px"><strong>' + esc(SITE.strings.total) + '</strong><strong>' + money(cartTotal()) + '</strong></div>';
    }
    var total = $('#checkout-total');
    if (total) total.textContent = money(cartTotal());
  }
  function closeModal() {
    if (checkoutModal) checkoutModal.classList.remove('open');
  }
  $$('[data-checkout]').forEach(function (b) { b.addEventListener('click', function () { if (isPreview) { toast(SITE.strings.previewNote, true); return; } closeCart(); openModal(); }); });
  $$('[data-close-modal]').forEach(function (b) { b.addEventListener('click', closeModal); });
  if (checkoutModal) checkoutModal.addEventListener('click', function (e) { if (e.target === checkoutModal) closeModal(); });

  var orderForm = $('#order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isPreview) { toast(SITE.strings.previewNote, true); return; }
      var invalid = false;
      $$('[required]', orderForm).forEach(function (input) {
        var field = input.closest('.field');
        var bad = !String(input.value || '').trim();
        if (input.type === 'tel' && input.value && !validPhone(input.value)) bad = true;
        if (field) field.classList.toggle('invalid', bad);
        if (bad) invalid = true;
      });
      if (invalid) { toast(SITE.strings.formError, true); return; }
      var btn = $('button[type="submit"]', orderForm);
      var status = $('#order-status');
      var original = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = SITE.strings.sending; }
      if (status) { status.className = 'form-status'; status.textContent = ''; }
      var payload = {
        customerName: orderForm.customerName.value,
        phone: orderForm.phone.value,
        wilaya: orderForm.wilaya.value,
        city: orderForm.city.value,
        address: orderForm.address.value,
        note: orderForm.note.value,
        website: orderForm.website ? orderForm.website.value : '',
        items: cart.map(function (l) { return { id: String(l.id), quantity: l.qty }; })
      };
      post('/public/sites/' + encodeURIComponent(SITE.siteId) + '/orders', payload)
        .then(function (data) {
          if (status) { status.className = 'form-status ok'; status.textContent = SITE.strings.orderSuccess + (data.ref ? ' (' + data.ref + ')' : ''); }
          cart = []; saveCart(); closeModal(); orderForm.reset();
          toast(SITE.strings.orderSuccess);
        })
        .catch(function (err) {
          if (status) { status.className = 'form-status bad'; status.textContent = err.message || SITE.strings.orderError; }
          toast(err.message || SITE.strings.orderError, true);
        })
        .then(function () { if (btn) { btn.disabled = false; btn.textContent = original; } });
    });
  }

  // lead forms (contact + reservation)
  $$('[data-lead-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isPreview) { toast(SITE.strings.previewNote, true); return; }
      var invalid = false;
      $$('[required]', form).forEach(function (input) {
        var field = input.closest('.field');
        var bad = !String(input.value || '').trim();
        if (input.type === 'tel' && input.value && !validPhone(input.value)) bad = true;
        if (field) field.classList.toggle('invalid', bad);
        if (bad) invalid = true;
      });
      if (invalid) { toast(SITE.strings.formError, true); return; }
      var status = $('.form-status', form);
      var btn = $('button[type="submit"]', form);
      var original = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = SITE.strings.sending; }
      var message = form.message ? form.message.value : '';
      if (form.getAttribute('data-lead-kind') === 'reservation') {
        message = 'Reservation: ' + (form.date ? form.date.value : '') + ' ' + (form.time ? form.time.value : '') + ' — ' + (form.guests ? form.guests.value : '') + ' guests. ' + message;
      }
      post('/public/sites/' + encodeURIComponent(SITE.siteId) + '/leads', {
        name: form.name ? form.name.value : '',
        phone: form.phone ? form.phone.value : '',
        email: form.email ? form.email.value : '',
        message: message,
        website: form.website ? form.website.value : ''
      }).then(function () {
        if (status) { status.className = 'form-status ok'; status.textContent = SITE.strings.messageSuccess; }
        form.reset();
        toast(SITE.strings.messageSuccess);
      }).catch(function (err) {
        if (status) { status.className = 'form-status bad'; status.textContent = err.message || SITE.strings.formError; }
        toast(err.message || SITE.strings.formError, true);
      }).then(function () { if (btn) { btn.disabled = false; btn.textContent = original; } });
    });
  });

  // reservation minimum date
  $$('input[type="date"]').forEach(function (input) {
    if (!input.min) input.min = new Date().toISOString().slice(0, 10);
  });

  // vCard
  var vcardBtn = $('#save-contact');
  if (vcardBtn) {
    vcardBtn.addEventListener('click', function () {
      var c = SITE.contact || {};
      var lines = [
        'BEGIN:VCARD', 'VERSION:3.0',
        'FN:' + (SITE.siteName || ''),
        'ORG:' + (SITE.siteName || ''),
        'TEL;TYPE=CELL:' + (c.phone || ''),
        'EMAIL:' + (c.email || ''),
        'URL:https://' + (SITE.domain || ''),
        'ADR;TYPE=WORK:;;' + (c.address || '') + ';' + (c.city || '') + ';;;',
        'NOTE:' + (SITE.tagline || ''),
        'END:VCARD'
      ];
      var blob = new Blob([lines.join('\r\n')], { type: 'text/vcard;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = (SITE.siteName || 'contact').replace(/[^\w\u0600-\u06FF-]+/g, '-') + '.vcf';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
      toast(SITE.strings.saveContact + ' ✓');
    });
  }
  var shareBtn = $('#share-site');
  if (shareBtn) {
    shareBtn.addEventListener('click', function () {
      var url = window.location.href;
      if (navigator.share) {
        navigator.share({ title: SITE.siteName, url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () { toast('✓'); }).catch(function () {});
      }
    });
  }

  readCart();
  renderCart();
})();
`;

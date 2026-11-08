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
  function rentalDate(value) {
    var parts = String(value || '').split('-');
    return parts.length === 3 ? new Date(+parts[0], +parts[1] - 1, +parts[2]) : null;
  }
  function rentalDays(form) {
    var pickup = rentalDate(form.pickupDate && form.pickupDate.value);
    var dropoff = rentalDate(form.returnDate && form.returnDate.value);
    if (!pickup || !dropoff) return 0;
    return Math.max(1, Math.ceil((dropoff - pickup) / 86400000));
  }
  function isoDate(date) {
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }
  function rentalDuration(days) {
    if (lang === 'ar') {
      if (days === 1) return 'يوم واحد';
      if (days === 2) return 'يومان';
      return days + ' ' + (days <= 10 ? 'أيام' : 'يوماً');
    }
    if (lang === 'fr') return days + ' ' + (days > 1 ? 'jours' : 'jour');
    return days + ' ' + (days > 1 ? 'days' : 'day');
  }

  // theme: auto -> light -> dark (stored per browser)
  var root = document.documentElement;
  var themeKey = 'aos_theme';
  var themeModes = ['auto', 'light', 'dark'];
  function storedTheme() {
    try {
      var value = localStorage.getItem(themeKey);
      return value === 'light' || value === 'dark' ? value : 'auto';
    } catch (e) { return 'auto'; }
  }
  function themeIsDark(mode) {
    return mode === 'dark' || (mode === 'auto' && !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches));
  }
  function applyTheme(mode) {
    var dark = themeIsDark(mode);
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.setAttribute('data-theme-mode', mode);
    $$('[data-theme-toggle]').forEach(function (btn) {
      var label = btn.getAttribute('data-theme-label') || 'Theme';
      var modeLabel = btn.getAttribute('data-theme-' + mode) || mode;
      btn.setAttribute('data-mode', mode);
      btn.setAttribute('aria-label', label + ': ' + modeLabel);
      btn.setAttribute('title', label + ': ' + modeLabel);
    });
  }
  $$('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var mode = themeModes[(themeModes.indexOf(storedTheme()) + 1) % themeModes.length];
      try { localStorage.setItem(themeKey, mode); } catch (e) {}
      applyTheme(mode);
    });
  });
  if (window.matchMedia) {
    var themeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    var onThemeChange = function () { if (storedTheme() === 'auto') applyTheme('auto'); };
    if (themeQuery.addEventListener) themeQuery.addEventListener('change', onThemeChange);
    else if (themeQuery.addListener) themeQuery.addListener(onThemeChange);
  }
  applyTheme(storedTheme());

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

  // digital products: preselect the product in the order form
  $$('[data-pick-product]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var orderSelect = $('[data-order-product]');
      if (orderSelect) orderSelect.value = btn.getAttribute('data-pick-product') || '';
      var orderSection = $('#order');
      if (orderSection) orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // gym: preselect the membership in the join form
  $$('[data-pick-plan]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var planSelect = $('[data-join-plan]');
      if (planSelect) planSelect.value = btn.getAttribute('data-pick-plan') || '';
      var joinSection = $('#join');
      if (joinSection) joinSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

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
      if (form.getAttribute('data-lead-kind') === 'rental') {
        var carSelect = form.car;
        var carName = carSelect && carSelect.options[carSelect.selectedIndex]
          ? (carSelect.options[carSelect.selectedIndex].getAttribute('data-name') || carSelect.options[carSelect.selectedIndex].text)
          : '';
        var rentalTotal = $('#rental-total');
        message = 'Rental: ' + carName +
          ' | ' + (form.pickupDate ? form.pickupDate.value : '') + ' ' + (form.pickupTime ? form.pickupTime.value : '') +
          ' → ' + (form.returnDate ? form.returnDate.value : '') + ' ' + (form.returnTime ? form.returnTime.value : '') +
          ' | ' + (form.pickupPlace ? form.pickupPlace.value : '') +
          ' | ' + rentalDuration(rentalDays(form)) +
          ' | ' + (rentalTotal ? rentalTotal.textContent : '') + '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'appointment') {
        var apptServiceSelect = form.querySelector('[name="service"]');
        var apptDoctorSelect = form.querySelector('[name="doctor"]');
        var apptServiceName = apptServiceSelect ? apptServiceSelect.value : '';
        var apptDoctorName = apptDoctorSelect && apptDoctorSelect.options[apptDoctorSelect.selectedIndex]
          ? (apptDoctorSelect.value || apptDoctorSelect.options[apptDoctorSelect.selectedIndex].text)
          : '';
        message = 'Appointment: ' + apptServiceName + ' | ' + apptDoctorName +
          ' | ' + (form.date ? form.date.value : '') + ' ' + (form.time ? form.time.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'consultation') {
        var conCaseSelect = form.querySelector('[name="caseType"]');
        var conCaseName = conCaseSelect ? conCaseSelect.value : '';
        message = 'Legal consultation: ' + conCaseName +
          ' | ' + (form.message ? form.message.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'viewing') {
        var vieTypeSelect = form.querySelector('[name="propertyType"]');
        var vieTypeName = vieTypeSelect ? vieTypeSelect.value : '';
        message = 'Property viewing: ' + vieTypeName +
          ' | ' + (form.message ? form.message.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'registration') {
        var regCourseSelect = form.querySelector('[name="courseType"]');
        var regCourseName = regCourseSelect ? regCourseSelect.value : '';
        message = 'Course registration: ' + regCourseName +
          ' | ' + (form.message ? form.message.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'quote') {
        var quoServiceSelect = form.querySelector('[name="serviceType"]');
        var quoTypeSelect = form.querySelector('[name="projectType"]');
        var quoServiceName = quoServiceSelect ? quoServiceSelect.value : '';
        var quoTypeName = quoTypeSelect ? quoTypeSelect.value : '';
        message = 'Quote request: ' + quoServiceName + ' | ' + quoTypeName +
          ' | ' + (form.message ? form.message.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'hotel-booking') {
        var hotelRoom = form.querySelector('[name="roomType"]');
        var hotelNights = form.querySelector('[name="nights"]');
        var hotelArrival = form.querySelector('[name="arrivalDate"]');
        message = 'Hotel booking: ' + (hotelRoom ? hotelRoom.value : '') +
          ' | ' + (hotelNights ? hotelNights.value : '') + ' night(s)' +
          ' | arrival ' + (hotelArrival ? hotelArrival.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'showroom-quote') {
        var carModel = form.querySelector('[name="carModel"]');
        var financeType = form.querySelector('[name="financeType"]');
        message = 'Car quote: ' + (carModel ? carModel.value : '') +
          ' | finance ' + (financeType ? financeType.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'clinic-booking') {
        var clinicService = form.querySelector('[name="serviceType"]');
        var clinicDoctor = form.querySelector('[name="doctorName"]');
        message = 'Clinic appointment: ' + (clinicService ? clinicService.value : '') +
          ' | doctor ' + (clinicDoctor ? clinicDoctor.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'digital-order') {
        var digitalProduct = form.querySelector('[name="productName"]');
        var digitalPayment = form.querySelector('[name="paymentMethod"]');
        message = 'Digital order: ' + (digitalProduct ? digitalProduct.value : '') +
          ' | payment ' + (digitalPayment ? digitalPayment.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'gym-join') {
        var gymPlan = form.querySelector('[name="planName"]');
        var gymGoal = form.querySelector('[name="goal"]');
        message = 'Gym membership: ' + (gymPlan ? gymPlan.value : '') +
          ' | goal ' + (gymGoal ? gymGoal.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'boutique-appointment') {
        var boutiqueItem = form.querySelector('[name="itemName"]');
        var boutiqueDate = form.querySelector('[name="visitDate"]');
        message = 'Boutique appointment: ' + (boutiqueItem ? boutiqueItem.value : '') +
          ' | date ' + (boutiqueDate ? boutiqueDate.value : '') +
          '. ' + message;
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

  // car rental: duration, live estimate and quick booking
  var rentalForm = $('[data-rental]');
  if (rentalForm) {
    var carSelect = rentalForm.car;
    var pickupInput = rentalForm.pickupDate;
    var returnInput = rentalForm.returnDate;

    var syncBounds = function () {
      var today = isoDate(new Date());
      if (pickupInput) {
        pickupInput.min = today;
        if (pickupInput.value && pickupInput.value < today) pickupInput.value = today;
      }
      if (returnInput) {
        var opt = carSelect && carSelect.options[carSelect.selectedIndex];
        var minDays = opt ? Number(opt.getAttribute('data-min-days')) || 1 : 1;
        var base = pickupInput && pickupInput.value ? pickupInput.value : today;
        var earliest = rentalDate(base);
        if (earliest) { earliest.setDate(earliest.getDate() + Math.max(1, minDays)); }
        var min = earliest ? isoDate(earliest) : today;
        returnInput.min = min;
        if (!returnInput.value || returnInput.value < min) returnInput.value = min;
      }
    };

    var updateRental = function () {
      var days = rentalDays(rentalForm);
      var opt = carSelect && carSelect.options[carSelect.selectedIndex];
      var price = opt ? Number(opt.getAttribute('data-price')) || 0 : 0;
      var carName = opt ? (opt.getAttribute('data-name') || opt.text.split(' — ')[0]) : '';
      var daysEl = $('#rental-days');
      var totalEl = $('#rental-total');
      var nameEl = $('#rental-car-name');
      if (nameEl) nameEl.textContent = carName;
      if (daysEl) daysEl.textContent = days ? rentalDuration(days) : '—';
      if (totalEl) totalEl.textContent = days ? money(price * days) : '—';
    };

    var applyDefaults = function () {
      var start = new Date();
      start.setDate(start.getDate() + 1);
      var end = new Date(start.getTime());
      end.setDate(end.getDate() + 2);
      if (pickupInput && !pickupInput.value) pickupInput.value = isoDate(start);
      if (returnInput && !returnInput.value) returnInput.value = isoDate(end);
      syncBounds();
      updateRental();
    };

    if (pickupInput) pickupInput.addEventListener('change', function () { syncBounds(); updateRental(); });
    if (returnInput) returnInput.addEventListener('change', function () { syncBounds(); updateRental(); });
    if (carSelect) carSelect.addEventListener('change', function () { syncBounds(); updateRental(); });
    rentalForm.addEventListener('reset', function () { setTimeout(applyDefaults, 0); });

    $$('[data-book-car]').forEach(function (button) {
      button.addEventListener('click', function () {
        var id = button.getAttribute('data-book-car');
        if (carSelect) {
          for (var i = 0; i < carSelect.options.length; i++) {
            if (carSelect.options[i].value === id) { carSelect.selectedIndex = i; break; }
          }
        }
        syncBounds();
        updateRental();
        var booking = $('#booking');
        if (booking && booking.scrollIntoView) booking.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    applyDefaults();
  }

  // medical appointment: live summary + quick booking
  var appointmentForm = $('[data-appointment]');
  if (appointmentForm) {
    var apptService = appointmentForm.querySelector('[name="service"]');
    var apptDoctor = appointmentForm.querySelector('[name="doctor"]');
    var apptDate = appointmentForm.querySelector('[name="date"]');
    var apptTime = appointmentForm.querySelector('[name="time"]');

    var prettyDay = function (value) {
      if (!value) return '';
      var parsed = new Date(value + 'T00:00:00');
      if (isNaN(parsed.getTime())) return value;
      var locale = SITE.lang === 'ar' ? 'ar-DZ' : SITE.lang === 'fr' ? 'fr-DZ' : 'en-GB';
      try {
        return parsed.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
      } catch (e) { return value; }
    };

    var updateAppointment = function () {
      var serviceEl = $('#appt-service-name');
      var doctorEl = $('#appt-doctor-name');
      var whenEl = $('#appt-when');
      if (serviceEl) serviceEl.textContent = apptService ? apptService.value : '';
      if (doctorEl) {
        doctorEl.textContent = apptDoctor
          ? (apptDoctor.value || (apptDoctor.options[apptDoctor.selectedIndex] || {}).text || '')
          : '';
      }
      if (whenEl) {
        var day = apptDate && apptDate.value ? prettyDay(apptDate.value) : '';
        var clock = apptTime ? apptTime.value : '';
        whenEl.textContent = day ? (day + (clock ? ' · ' + clock : '')) : '—';
      }
    };

    var applyAppointmentDefaults = function () {
      var tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      if (apptDate) apptDate.min = isoDate(new Date());
      if (apptDate && !apptDate.value) apptDate.value = isoDate(tomorrow);
      if (apptTime && !apptTime.value) apptTime.value = '09:00';
      updateAppointment();
    };

    [apptService, apptDoctor, apptDate, apptTime].forEach(function (field) {
      if (field) field.addEventListener('change', updateAppointment);
    });

    $$('[data-book-service]').forEach(function (button) {
      button.addEventListener('click', function () {
        var service = button.getAttribute('data-book-service');
        if (apptService && service) apptService.value = service;
        updateAppointment();
        var section = $('#appointment');
        if (section && section.scrollIntoView) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    $$('[data-book-doctor]').forEach(function (button) {
      button.addEventListener('click', function () {
        var doctor = button.getAttribute('data-book-doctor');
        if (apptDoctor && doctor) apptDoctor.value = doctor;
        updateAppointment();
        var section = $('#appointment');
        if (section && section.scrollIntoView) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    appointmentForm.addEventListener('reset', function () { setTimeout(applyAppointmentDefaults, 0); });
    applyAppointmentDefaults();
  }

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

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
        var reservationTable = form.querySelector('[name="table"]');
        message = 'Reservation: ' + (form.date ? form.date.value : '') + ' ' + (form.time ? form.time.value : '') + ' — ' + (form.guests ? form.guests.value : '') + ' guests' +
          (reservationTable && reservationTable.value ? ' | table ' + reservationTable.value : '') + '. ' + message;
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
        var quoSurface = form.querySelector('[name="surface"]');
        var quoEstimate = form.querySelector('[name="estimate"]');
        var quoExtras = $$('input[name="extra"]:checked', form).map(function (x) { return x.value; }).join(', ');
        var quoServiceName = quoServiceSelect ? quoServiceSelect.value : '';
        var quoTypeName = quoTypeSelect ? quoTypeSelect.value : '';
        message = 'Quote request: ' + quoServiceName + ' | ' + quoTypeName +
          (quoSurface ? ' | area ' + quoSurface.value + ' m2' : '') +
          (quoExtras ? ' | extras ' + quoExtras : '') +
          (quoEstimate && quoEstimate.value ? ' | estimate ' + money(quoEstimate.value) : '') +
          ' | ' + (form.message ? form.message.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'hotel-booking') {
        var hotelRoom = form.querySelector('[name="roomType"]');
        var hotelNights = form.querySelector('[name="nights"]');
        var hotelArrival = form.querySelector('[name="arrivalDate"]');
        var hotelTime = form.querySelector('[name="time"]');
        message = 'Hotel booking: ' + (hotelRoom ? hotelRoom.value : '') +
          ' | ' + (hotelNights ? hotelNights.value : '') + ' night(s)' +
          ' | arrival ' + (hotelArrival ? hotelArrival.value : '') +
          (hotelTime && hotelTime.value ? ' at ' + hotelTime.value : '') +
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
        var clinicDate = form.querySelector('[name="date"]');
        var clinicTime = form.querySelector('[name="time"]');
        message = 'Clinic appointment: ' + (clinicService ? clinicService.value : '') +
          ' | doctor ' + (clinicDoctor ? clinicDoctor.value : '') +
          ' | ' + (clinicDate ? clinicDate.value : '') + ' ' + (clinicTime ? clinicTime.value : '') +
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
      if (form.getAttribute('data-lead-kind') === 'saas-trial') {
        var saasPlan = form.querySelector('[name="planName"]');
        var saasTeam = form.querySelector('[name="teamSize"]');
        var saasCompany = form.querySelector('[name="company"]');
        message = 'SaaS trial: ' + (saasPlan ? saasPlan.value : '') +
          ' | team ' + (saasTeam ? saasTeam.value : '') +
          ' | company ' + (saasCompany ? saasCompany.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'dining-reservation') {
        var diningDate = form.querySelector('[name="date"]');
        var diningTime = form.querySelector('[name="time"]');
        var diningGuests = form.querySelector('[name="guests"]');
        var diningOccasion = form.querySelector('[name="occasion"]');
        var diningTable = form.querySelector('[name="table"]');
        message = 'Table reservation: ' + (diningDate ? diningDate.value : '') +
          ' | ' + (diningTime ? diningTime.value : '') +
          ' | ' + (diningGuests ? diningGuests.value : '') + ' guest(s)' +
          ' | ' + (diningOccasion ? diningOccasion.value : '') +
          (diningTable && diningTable.value ? ' | table ' + diningTable.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'agency-quote') {
        var agencyService = form.querySelector('[name="serviceType"]');
        var agencyBudget = form.querySelector('[name="budget"]');
        var agencyTimeline = form.querySelector('[name="timeline"]');
        var agencyEstimate = form.querySelector('[name="estimate"]');
        var agencyExtras = $$('input[name="extra"]:checked', form).map(function (x) { return x.value; }).join(', ');
        message = 'Agency quote: ' + (agencyService ? agencyService.value : '') +
          ' | budget ' + (agencyBudget ? agencyBudget.value : '') +
          ' | launch ' + (agencyTimeline ? agencyTimeline.value : '') +
          (agencyExtras ? ' | extras ' + agencyExtras : '') +
          (agencyEstimate && agencyEstimate.value ? ' | estimate ' + money(agencyEstimate.value) : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'salon-booking') {
        var salonService = form.querySelector('[name="serviceName"]');
        var salonStylist = form.querySelector('[name="stylist"]');
        var salonDate = form.querySelector('[name="date"]');
        var salonTime = form.querySelector('[name="time"]');
        message = 'Salon booking: ' + (salonService ? salonService.value : '') +
          ' | stylist ' + (salonStylist ? salonStylist.value : '') +
          ' | ' + (salonDate ? salonDate.value : '') + ' ' + (salonTime ? salonTime.value : '') +
          '. ' + message;
      }
      if (form.getAttribute('data-lead-kind') === 'cleaning-booking') {
        var cleaningPlan = form.querySelector('[name="planName"]');
        var cleaningDate = form.querySelector('[name="date"]');
        var cleaningTime = form.querySelector('[name="time"]');
        var cleaningSize = form.querySelector('[name="homeSize"]');
        var cleaningEstimate = form.querySelector('[name="estimate"]');
        var cleaningExtras = $$('input[name="extra"]:checked', form).map(function (x) { return x.value; }).join(', ');
        message = 'Cleaning booking: ' + (cleaningPlan ? cleaningPlan.value : '') +
          ' | date ' + (cleaningDate ? cleaningDate.value : '') +
          (cleaningTime && cleaningTime.value ? ' at ' + cleaningTime.value : '') +
          ' | size ' + (cleaningSize ? cleaningSize.value : '') +
          (cleaningExtras ? ' | extras ' + cleaningExtras : '') +
          (cleaningEstimate && cleaningEstimate.value ? ' | estimate ' + money(cleaningEstimate.value) : '') +
          '. ' + message;
      }
      post('/public/sites/' + encodeURIComponent(SITE.siteId) + '/leads', {
        name: form.name ? form.name.value : '',
        phone: form.phone ? form.phone.value : '',
        email: form.email ? form.email.value : '',
        message: message,
        website: form.website ? form.website.value : ''
      }).then(function () {
        var calendar = buildIcs(form);
        if (status) {
          status.className = 'form-status ok';
          status.textContent = SITE.strings.messageSuccess;
          if (calendar) {
            var calendarLink = document.createElement('a');
            calendarLink.className = 'form-ics';
            calendarLink.href = URL.createObjectURL(new Blob([calendar], { type: 'text/calendar;charset=utf-8' }));
            calendarLink.download = (SITE.siteName || 'booking').replace(/[^\w\u0600-\u06FF-]+/g, '-') + '.ics';
            calendarLink.textContent = SITE.strings.addToCalendar || 'ICS';
            status.appendChild(document.createTextNode(' '));
            status.appendChild(calendarLink);
          }
        }
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

  // ---- optional interactive features --------------------------------------
  var locale = SITE.lang === 'ar' ? 'ar-DZ' : SITE.lang === 'fr' ? 'fr-DZ' : 'en-GB';
  function fmtDay(date, options) {
    try { return new Intl.DateTimeFormat(locale, options).format(date); } catch (e) { return ''; }
  }
  function minutesOf(value) {
    var bits = String(value || '').split(':');
    return bits.length > 1 ? Number(bits[0]) * 60 + Number(bits[1]) : -1;
  }
  function icsEscape(value) {
    return String(value == null ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');
  }
  function buildIcs(form) {
    var dateInput = form.querySelector('[name="date"]') || form.querySelector('[name="arrivalDate"]');
    if (!dateInput || !dateInput.value) return '';
    var day = rentalDate(dateInput.value);
    if (!day || isNaN(day.getTime())) return '';
    var timeInput = form.querySelector('[name="time"]');
    var time = timeInput && timeInput.value ? timeInput.value : '09:00';
    var bits = time.split(':');
    day.setHours(Number(bits[0]) || 9, Number(bits[1]) || 0, 0, 0);
    var nights = form.querySelector('[name="nights"]');
    var length = nights && Number(nights.value) > 0 ? Number(nights.value) * 24 * 60 : 60;
    var end = new Date(day.getTime() + length * 60 * 1000);
    var stamp = function (date) {
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      return date.getFullYear() + pad(date.getMonth() + 1) + pad(date.getDate()) + 'T' + pad(date.getHours()) + pad(date.getMinutes()) + '00';
    };
    var contact = SITE.contact || {};
    var details = [];
    var kind = form.querySelector('[name="serviceName"],[name="serviceType"],[name="planName"],[name="roomType"]');
    if (kind && kind.value) details.push(kind.value);
    var table = form.querySelector('[name="table"]');
    if (table && table.value) details.push(table.value);
    var guests = form.querySelector('[name="guests"]');
    if (guests && guests.value) details.push(guests.value + ' ' + (SITE.strings.guests || ''));
    if (form.message && form.message.value) details.push(form.message.value);
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//AOS Site Factory//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + Date.now() + '-' + Math.random().toString(36).slice(2) + '@' + (SITE.domain || 'aos'),
      'DTSTAMP:' + stamp(new Date()),
      'DTSTART:' + stamp(day),
      'DTEND:' + stamp(end),
      'SUMMARY:' + icsEscape(SITE.siteName || ''),
      'LOCATION:' + icsEscape([contact.address, contact.city].filter(Boolean).join(', ')),
      'DESCRIPTION:' + icsEscape(details.join(' — ')),
      'END:VEVENT',
      'END:VCALENDAR'
    ];
    return lines.join('\r\n');
  }

  // before/after comparison slider
  $$('[data-before-after]').forEach(function (slider) {
    var range = $('.ba-range', slider);
    if (!range) return;
    var sync = function () {
      var value = Math.max(0, Math.min(100, Number(range.value) || 0));
      slider.style.setProperty('--pos', value + '%');
      range.setAttribute('aria-valuenow', String(value));
    };
    var move = function (clientX) {
      var rect = slider.getBoundingClientRect();
      if (!rect.width) return;
      range.value = String(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
      sync();
    };
    var dragging = false;
    range.addEventListener('input', sync);
    slider.addEventListener('pointerdown', function (e) {
      if (e.target === range) return;
      dragging = true;
      if (slider.setPointerCapture) slider.setPointerCapture(e.pointerId);
      move(e.clientX);
    });
    slider.addEventListener('pointermove', function (e) { if (dragging) move(e.clientX); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (type) {
      slider.addEventListener(type, function () { dragging = false; });
    });
    sync();
  });

  // smart booking: 14-day strip + time chips + live summary
  $$('[data-smart-booking]').forEach(function (form) {
    var f = SITE.features || {};
    var dateInput = form.querySelector('[name="date"]') || form.querySelector('[name="arrivalDate"]');
    var timeInput = form.querySelector('[name="time"]');
    if (!dateInput && !timeInput) return;
    var holder = form.querySelector('[data-smart-booking-slot]');
    var grid = form.querySelector('.form-grid');
    var anchor = holder || grid;
    if (!anchor) return;
    var box = document.createElement('div');
    box.className = 'smart-booking';
    var head = document.createElement('div');
    head.className = 'sb-head';
    var headTitle = document.createElement('span');
    headTitle.textContent = f.smartBooking || '';
    head.appendChild(headTitle);
    var dayWrap = document.createElement('div');
    dayWrap.className = 'sb-days';
    dayWrap.setAttribute('role', 'group');
    dayWrap.setAttribute('aria-label', f.pickDay || '');
    var slotWrap = document.createElement('div');
    slotWrap.className = 'sb-slots';
    slotWrap.setAttribute('role', 'group');
    slotWrap.setAttribute('aria-label', f.pickTime || '');
    box.appendChild(head);
    box.appendChild(dayWrap);
    box.appendChild(slotWrap);
    var summaryEl = null;
    if (!form.hasAttribute('data-appointment')) {
      var summary = document.createElement('div');
      summary.className = 'sb-summary';
      summary.setAttribute('aria-live', 'polite');
      var summaryLabel = document.createElement('span');
      summaryLabel.textContent = f.bookingSummary || '';
      summaryEl = document.createElement('strong');
      summaryEl.setAttribute('data-sb-summary', '');
      summaryEl.textContent = f.notChosen || '—';
      summary.appendChild(summaryLabel);
      summary.appendChild(summaryEl);
      box.appendChild(summary);
    }
    if (holder) holder.appendChild(box);
    else anchor.parentNode.insertBefore(box, anchor);

    var hideNative = function (input) {
      if (!input) return;
      var field = input.closest('.field');
      if (field) field.classList.add('sb-native');
    };
    hideNative(dateInput);
    hideNative(timeInput);

    var slots = String(form.getAttribute('data-slots') || '').split(',').map(function (slot) {
      return slot.trim();
    }).filter(Boolean);
    if (!slots.length && timeInput && timeInput.tagName === 'SELECT') {
      slots = $$('option', timeInput).map(function (option) { return option.value; }).filter(Boolean);
    }

    var openDays = Array.isArray(SITE.openDays) && SITE.openDays.length ? SITE.openDays : [0, 1, 2, 3, 4, 5, 6];
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var days = [];
    for (var dayIndex = 0; dayIndex < 14; dayIndex++) {
      var cursor = new Date(today.getTime());
      cursor.setDate(cursor.getDate() + dayIndex);
      days.push(cursor);
    }

    var isToday = function (date) { return isoDate(date) === isoDate(new Date()); };
    var dayHasSlot = function (date) {
      if (!isToday(date)) return true;
      var nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      return slots.some(function (slot) { return minutesOf(slot) > nowMinutes + 30; });
    };
    var pickable = function (date) {
      return date.getTime() >= today.getTime() && openDays.indexOf(date.getDay()) !== -1 && dayHasSlot(date);
    };
    var firstOpenDay = function () {
      for (var i = 0; i < days.length; i++) if (pickable(days[i])) return days[i];
      return null;
    };
    var firstOpenSlot = function () {
      var buttons = $$('.sb-slot', slotWrap);
      for (var i = 0; i < buttons.length; i++) if (!buttons[i].disabled) return buttons[i].getAttribute('data-time');
      return '';
    };

    var syncSummary = function () {
      if (!summaryEl) return;
      var date = rentalDate(dateInput ? dateInput.value : '');
      var parts = [];
      if (date) parts.push(fmtDay(date, { weekday: 'long', day: 'numeric', month: 'long' }));
      if (timeInput && timeInput.value) parts.push(timeInput.value);
      var guests = form.querySelector('[name="guests"]');
      if (guests && guests.value) parts.push(guests.value + ' ' + (SITE.strings.guests || ''));
      summaryEl.textContent = parts.length ? parts.join(' · ') : (f.notChosen || '—');
    };

    var renderSlots = function () {
      slotWrap.innerHTML = '';
      var date = rentalDate(dateInput ? dateInput.value : '');
      var nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      slots.forEach(function (slot) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'sb-slot';
        button.setAttribute('data-time', slot);
        button.textContent = slot;
        if (date && isToday(date) && minutesOf(slot) <= nowMinutes + 30) button.disabled = true;
        var active = timeInput && timeInput.value === slot;
        if (active) button.classList.add('is-active');
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.addEventListener('click', function () { selectTime(slot); });
        slotWrap.appendChild(button);
      });
    };

    var selectTime = function (time) {
      if (!timeInput) return;
      timeInput.value = time;
      timeInput.dispatchEvent(new Event('change', { bubbles: true }));
      $$('.sb-slot', slotWrap).forEach(function (button) {
        var active = button.getAttribute('data-time') === time;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      syncSummary();
    };

    var selectDay = function (iso) {
      if (!dateInput) return;
      dateInput.value = iso;
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      $$('.sb-day', dayWrap).forEach(function (button) {
        var active = button.getAttribute('data-date') === iso;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      renderSlots();
      if (timeInput) {
        var stillOpen = $$('.sb-slot', slotWrap).filter(function (button) {
          return button.getAttribute('data-time') === timeInput.value && !button.disabled;
        }).length > 0;
        if (!stillOpen) {
          var next = firstOpenSlot();
          if (next) selectTime(next);
        }
      }
      syncSummary();
    };

    var renderDays = function () {
      dayWrap.innerHTML = '';
      days.forEach(function (date, index) {
        var closed = openDays.indexOf(date.getDay()) === -1;
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'sb-day' + (closed ? ' is-closed' : '') + (isToday(date) ? ' is-today' : '');
        button.disabled = closed;
        button.setAttribute('data-date', isoDate(date));
        var active = dateInput && dateInput.value === isoDate(date);
        if (active) button.classList.add('is-active');
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        var small = document.createElement('small');
        small.textContent = index === 0 ? (f.today || '') : index === 1 ? (f.tomorrow || '') : fmtDay(date, { weekday: 'short' });
        var number = document.createElement('b');
        number.textContent = String(date.getDate());
        var month = document.createElement('span');
        month.textContent = fmtDay(date, { month: 'short' });
        button.appendChild(small);
        button.appendChild(number);
        button.appendChild(month);
        if (closed) {
          var tag = document.createElement('em');
          tag.textContent = f.closed || '';
          button.appendChild(tag);
        }
        button.addEventListener('click', function () { selectDay(isoDate(date)); });
        dayWrap.appendChild(button);
      });
    };

    var applyDefaults = function () {
      var chosen = dateInput && dateInput.value ? rentalDate(dateInput.value) : null;
      if (!chosen || !pickable(chosen)) chosen = firstOpenDay();
      if (chosen && dateInput) dateInput.value = isoDate(chosen);
      renderDays();
      if (timeInput) {
        var nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
        var usable = slots.filter(function (slot) {
          return !(chosen && isToday(chosen) && minutesOf(slot) <= nowMinutes + 30);
        });
        if (timeInput.value && usable.indexOf(timeInput.value) !== -1) {
          // keep the current selection
        } else {
          timeInput.value = usable[0] || '';
        }
      }
      renderSlots();
      syncSummary();
    };

    form.addEventListener('reset', function () { setTimeout(applyDefaults, 0); });
    if (dateInput) dateInput.addEventListener('change', syncSummary);
    if (timeInput) timeInput.addEventListener('change', syncSummary);
    var guestsInput = form.querySelector('[name="guests"]');
    if (guestsInput) guestsInput.addEventListener('input', syncSummary);
    applyDefaults();
  });

  // floor plan picker: dim tables smaller than the party
  $$('[data-floor-plan]').forEach(function (plan) {
    var f = SITE.features || {};
    var form = plan.closest('form');
    var input = $('[data-table-input]', plan);
    var status = $('[data-table-status]', plan);
    var guests = form ? form.querySelector('[name="guests"]') : null;
    var tables = $$('[data-table]', plan);
    var selected = null;

    var clearSelection = function () {
      selected = null;
      if (input) input.value = '';
      tables.forEach(function (table) {
        table.classList.remove('is-active');
        table.setAttribute('aria-pressed', 'false');
      });
      if (status) status.textContent = f.noTable || '';
    };
    var chooseTable = function (table) {
      selected = table;
      tables.forEach(function (item) {
        var on = item === table;
        item.classList.toggle('is-active', on);
        item.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (input) input.value = table.getAttribute('data-table') || '';
      if (status) status.textContent = (f.tableSelected || '') + ': ' + (table.getAttribute('data-table') || '');
    };
    var syncSizes = function () {
      var count = guests ? Number(guests.value) || 0 : 0;
      tables.forEach(function (table) {
        var small = count > 0 && (Number(table.getAttribute('data-seats')) || 0) < count;
        table.classList.toggle('is-small', small);
        table.disabled = small;
        if (small && selected === table) clearSelection();
      });
    };

    tables.forEach(function (table) {
      table.addEventListener('click', function () { chooseTable(table); });
    });
    if (guests) {
      guests.addEventListener('input', syncSizes);
      guests.addEventListener('change', syncSizes);
    }
    form && form.addEventListener('reset', function () { setTimeout(clearSelection, 0); });
    if (status) status.textContent = f.noTable || '';
    syncSizes();
  });

  // quote builder: three steps with a live estimate
  $$('[data-quote-builder]').forEach(function (form) {
    var f = SITE.features || {};
    var steps = $$('[data-q-step]', form);
    if (!steps.length) return;
    var bar = $('[data-q-bar]', form);
    var progress = $('[data-q-progress]', form);
    var estimateEl = $('[data-q-estimate]', form);
    var estimateInput = $('[data-q-estimate-input]', form);
    var summaryEl = $('[data-q-summary]', form);
    var current = 1;
    var total = steps.length;

    var syncEstimate = function () {
      var baseEl = form.querySelector('[data-q-base]:checked');
      var rateEl = form.querySelector('[data-q-rate]:checked');
      var surfaceEl = form.querySelector('[data-q-surface]');
      var detailEl = form.querySelector('[data-q-detail]');
      var base = baseEl ? Number(baseEl.getAttribute('data-q-base')) || 0 : 0;
      var rate = rateEl ? Number(rateEl.getAttribute('data-q-rate')) || 0 : 0;
      var surface = surfaceEl ? Number(surfaceEl.value) || 0 : 0;
      var factor = 1;
      if (detailEl && detailEl.options[detailEl.selectedIndex]) {
        factor = Number(detailEl.options[detailEl.selectedIndex].getAttribute('data-q-factor')) || 1;
      }
      var addons = 0;
      $$('[data-q-add]:checked', form).forEach(function (box) {
        addons += Number(box.getAttribute('data-q-add')) || 0;
      });
      var value = (base + surface * rate) * factor + addons;
      if (estimateEl) estimateEl.textContent = value ? money(value) : '—';
      if (estimateInput) estimateInput.value = value ? String(Math.round(value)) : '';
      if (!summaryEl) return;
      summaryEl.innerHTML = '';
      var row = document.createElement('div');
      var label = document.createElement('span');
      label.textContent = f.yourEstimate || f.estimate || '';
      var amount = document.createElement('strong');
      amount.textContent = value ? money(value) : (f.notChosen || '—');
      row.appendChild(label);
      row.appendChild(amount);
      summaryEl.appendChild(row);
      var chosen = [];
      var main = form.querySelector('input[type="radio"]:checked');
      if (main) chosen.push(main.value);
      if (detailEl && detailEl.value) chosen.push(detailEl.value);
      if (surfaceEl && surfaceEl.value) chosen.push(surfaceEl.value + ' m²');
      var extras = $$('[data-q-add]:checked', form).map(function (box) { return box.value; });
      if (extras.length) chosen.push(extras.join(', '));
      if (chosen.length) {
        var note = document.createElement('small');
        note.textContent = chosen.join(' · ');
        summaryEl.appendChild(note);
      }
    };

    var setStep = function (next) {
      current = Math.max(1, Math.min(total, next));
      steps.forEach(function (step) {
        step.classList.toggle('is-active', Number(step.getAttribute('data-q-step')) === current);
      });
      if (bar) bar.style.width = ((current / total) * 100) + '%';
      if (progress) progress.textContent = current + ' / ' + total;
      if (current > 1) syncEstimate();
    };

    var validateStep = function () {
      var active = steps[current - 1];
      var valid = true;
      $$('input[required], select[required], textarea[required]', active).forEach(function (input) {
        var bad = input.type === 'radio'
          ? !$('input[name="' + input.name + '"]:checked', active)
          : !String(input.value || '').trim() || !input.checkValidity();
        if (bad) {
          valid = false;
          var field = input.closest('.field') || input.closest('.q-option');
          if (field) field.classList.add('invalid');
        }
      });
      return valid;
    };

    $$('[data-q-next]', form).forEach(function (button) {
      button.addEventListener('click', function () {
        if (!validateStep()) { toast(SITE.strings.formError, true); return; }
        syncEstimate();
        setStep(current + 1);
      });
    });
    $$('[data-q-back]', form).forEach(function (button) {
      button.addEventListener('click', function () { setStep(current - 1); });
    });
    form.addEventListener('submit', function (e) {
      if (current !== total) {
        e.preventDefault();
        e.stopImmediatePropagation();
        syncEstimate();
        setStep(total);
      }
    }, true);
    form.addEventListener('input', syncEstimate);
    form.addEventListener('change', syncEstimate);
    form.addEventListener('reset', function () { setTimeout(function () { setStep(1); syncEstimate(); }, 0); });
    setStep(1);
    syncEstimate();
  });

  // PWA install prompt
  var installBtn = $('[data-install-app]');
  if (installBtn) {
    var deferredPrompt = null;
    var standalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    if (standalone) installBtn.hidden = true;
    window.addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferredPrompt = e;
      installBtn.hidden = false;
    });
    installBtn.addEventListener('click', function () {
      if (!deferredPrompt) { installBtn.hidden = true; return; }
      deferredPrompt.prompt();
      var choice = deferredPrompt.userChoice;
      if (choice && choice.then) {
        choice.then(function () { deferredPrompt = null; installBtn.hidden = true; });
      } else {
        deferredPrompt = null;
        installBtn.hidden = true;
      }
    });
    window.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      installBtn.hidden = true;
    });
  }

  // service worker: only on the real deployment (never in the preview iframe)
  if (!isPreview && 'serviceWorker' in navigator) {
    var secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (secure) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      });
    }
  }

  readCart();
  renderCart();
})();
`;

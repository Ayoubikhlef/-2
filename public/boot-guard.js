/**
 * Boot guard.
 *
 * Keeps the branded boot screen in front of the SEO fallback and recovers from
 * the classic post-deploy failure: a cached HTML document that points at a
 * JavaScript/CSS file from an older deployment (the file is gone -> the app
 * never mounts -> the raw SEO text would stay on screen).
 */
(function () {
  var RETRY_KEY = 'aos-boot-retry';
  var boot = document.getElementById('boot-screen');
  var hint = document.querySelector('[data-boot-hint]');
  var retry = document.querySelector('[data-boot-retry]');

  function getFlag() {
    try {
      return sessionStorage.getItem(RETRY_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  function setFlag(value) {
    try {
      if (value) sessionStorage.setItem(RETRY_KEY, '1');
      else sessionStorage.removeItem(RETRY_KEY);
    } catch (e) {}
  }

  function showRetry(message) {
    if (!boot) return;
    if (hint) hint.textContent = message;
    if (retry) retry.hidden = false;
  }

  function freshUrl() {
    var url = location.pathname + location.search;
    return url + (url.indexOf('?') === -1 ? '?' : '&') + 'v=' + Date.now();
  }

  function reloadFresh() {
    location.replace(freshUrl());
  }

  if (retry) {
    retry.addEventListener('click', function () {
      setFlag(false);
      reloadFresh();
    });
  }

  // A missing module/CSS asset means this HTML belongs to an older deployment.
  // Reload once with a cache-busting query so Vercel serves the fresh document.
  window.addEventListener(
    'error',
    function (event) {
      var el = event.target;
      if (!el || (el.tagName !== 'SCRIPT' && el.tagName !== 'LINK')) return;
      var url = el.src || el.href || '';
      if (url.indexOf('/assets/') === -1) return;
      if (getFlag()) {
        showRetry('تعذر تحميل الموقع. اضغط «إعادة المحاولة».');
        return;
      }
      setFlag(true);
      reloadFresh();
    },
    true
  );

  // Slow connection or a blocked script: keep the loader, then offer a retry
  // instead of leaving the visitor on the fallback page forever.
  window.setTimeout(function () {
    if (window.__AOS_MOUNTED__ === true) return;
    if (!document.getElementById('boot-screen')) return;
    if (getFlag()) {
      showRetry('تعذر تحميل الموقع. تحقق من اتصالك ثم أعد المحاولة.');
    }
  }, 12000);
})();

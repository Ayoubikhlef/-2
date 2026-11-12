/**
 * Navigate between top-level views without reloading the whole SPA.
 *
 * Setting `window.location.href = '/#checkout'` forces a full document load
 * (HTML + bundle parse + React boot) even though everything is already in
 * memory. Pushing the URL and firing the same event the browser fires on a
 * hash change keeps the navigation instant on phones. App listens to both
 * `hashchange` and `popstate`, so the back button keeps working.
 */
export function navigateTo(path: string): void {
  if (typeof window === 'undefined') return;
  const target = path.startsWith('/') ? path : `/${path}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (current === target) return;
  window.history.pushState(null, '', target);
  window.dispatchEvent(new Event('hashchange'));
}

export function navigateToCheckout(): void {
  if (typeof window === 'undefined') return;
  if (window.location.pathname === '/' && window.location.hash === '#checkout') return;
  navigateTo('/#checkout');
  window.scrollTo({ top: 0, behavior: 'auto' });
}

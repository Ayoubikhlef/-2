const STORAGE_KEY = 'aos_wishlist';

function dispatchWishlistChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('aos:data-changed'));
  }
}

export function getWishlist(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function toggleWishlist(productId: number): boolean {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  if (idx > -1) { list.splice(idx, 1); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); dispatchWishlistChange(); return false; }
  else { list.push(productId); localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); dispatchWishlistChange(); return true; }
}

export function isInWishlist(productId: number): boolean {
  return getWishlist().includes(productId);
}

export function clearWishlist(): void {
  localStorage.removeItem(STORAGE_KEY);
  dispatchWishlistChange();
}

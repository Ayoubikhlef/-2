import { api } from './api';

const STORAGE_KEY = 'aos_coupons';

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  maxUses: number;
  expiryDate: string;
  active: boolean;
  createdAt: string;
}

export function getStoredCoupons(): Coupon[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredCoupons(coupons: Coupon[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

export function saveCoupon(coupon: Coupon): void {
  const coupons = getStoredCoupons();
  const idx = coupons.findIndex(c => c.id === coupon.id);
  if (idx >= 0) coupons[idx] = coupon;
  else coupons.push(coupon);
  setStoredCoupons(coupons);
  syncToServer(coupons);
}

export function deleteCoupon(id: string): void {
  const coupons = getStoredCoupons().filter(c => c.id !== id);
  setStoredCoupons(coupons);
  syncToServer(coupons);
}

export function toggleCoupon(id: string): void {
  const coupons = getStoredCoupons();
  const c = coupons.find(c => c.id === id);
  if (c) { c.active = !c.active; setStoredCoupons(coupons); syncToServer(coupons); }
}

function syncToServer(coupons: Coupon[]) {
  api.data.save(STORAGE_KEY, coupons).catch(() => {});
}

export async function loadCouponsFromServer(): Promise<Coupon[]> {
  try {
    const result = await api.data.get(STORAGE_KEY);
    if (result.value && Array.isArray(result.value) && result.value.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.value));
      return result.value as Coupon[];
    }
  } catch {}
  return getStoredCoupons();
}

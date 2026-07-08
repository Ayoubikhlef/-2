import { loadProductsFromServer } from './productStorage';
import { loadServicesFromServer } from './serviceStorage';
import { loadSiteSettingsFromServer } from './siteSettingsStorage';
import { loadOrdersFromServer } from './orderStorage';
import { loadSubscribersFromServer } from './newsletterStorage';
import { loadReviewsFromServer } from './reviewStorage';
import { products as defaultProducts } from '../data/products';
import { defaultServices } from '../data/services';
import { api } from './api';

let isSyncing = false;

export async function syncAllFromServer() {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const [products, services, settings] = await Promise.all([
      loadProductsFromServer(defaultProducts).catch(() => null),
      loadServicesFromServer(defaultServices).catch(() => null),
      loadSiteSettingsFromServer().catch(() => null),
    ]);
    console.log(`[GlobalSync] Products:${products?.length ?? '?'} Services:${services?.length ?? '?'} Settings:${settings ? 'OK' : '?'}`);
  } catch (err) {
    console.warn('[GlobalSync] Sync failed:', err);
  } finally {
    isSyncing = false;
  }
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startPeriodicSync(intervalMs = 30000) {
  stopPeriodicSync();
  syncAllFromServer();
  intervalId = setInterval(syncAllFromServer, intervalMs);
}

export function stopPeriodicSync() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

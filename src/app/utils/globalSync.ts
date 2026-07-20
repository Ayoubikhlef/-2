import { loadProductsFromServer } from './productStorage';
import { loadServicesFromServer } from './serviceStorage';
import { loadSiteSettingsFromServer } from './siteSettingsStorage';
import { products as defaultProducts } from '../data/products';
import { defaultServices } from '../data/services';

let lastSync = 0;

export async function syncAllFromServer(force = false) {
  const now = Date.now();
  if (!force && now - lastSync < 8000) return;
  lastSync = now;
  try {
    await Promise.all([
      loadProductsFromServer(defaultProducts).catch(() => null),
      loadServicesFromServer(defaultServices).catch(() => null),
      loadSiteSettingsFromServer().catch(() => null),
    ]);
    console.log('[GlobalSync] Sync complete');
  } catch (err) {
    console.warn('[GlobalSync] Sync failed:', err);
  }
}

export async function requestSync(force = false): Promise<void> {
  return new Promise(resolve => {
    setTimeout(async () => {
      await syncAllFromServer(force);
      resolve();
    }, 500);
  });
}

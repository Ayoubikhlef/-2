import { loadProductsFromServer } from './productStorage';
import { loadServicesFromServer } from './serviceStorage';
import { loadSiteSettingsFromServer } from './siteSettingsStorage';
import { products as defaultProducts } from '../data/products';
import { defaultServices } from '../data/services';

let lastSync = 0;
let syncResolve: (() => void) | null = null;

export async function syncAllFromServer() {
  const now = Date.now();
  if (now - lastSync < 8000) return;
  lastSync = now;
  try {
    await Promise.all([
      loadProductsFromServer(defaultProducts).catch(() => null),
      loadServicesFromServer(defaultServices).catch(() => null),
      loadSiteSettingsFromServer().catch(() => null),
    ]);
  } catch (err) {
    console.warn('[GlobalSync] Sync failed:', err);
  }
}

export async function requestSync(): Promise<void> {
  return new Promise(resolve => {
    setTimeout(async () => {
      await syncAllFromServer();
      resolve();
    }, 500);
  });
}

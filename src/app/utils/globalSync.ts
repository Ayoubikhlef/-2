import { loadProductsFromServer } from './productStorage';
import { loadServicesFromServer } from './serviceStorage';
import { loadSiteSettingsFromServer } from './siteSettingsStorage';
import { loadSiteContentFromServer } from './siteContentStorage';
import { loadOrdersFromServer, pushUnsyncedOrders } from './orderStorage';
import { products as defaultProducts } from '../data/products';
import { defaultServices } from '../data/services';

const isDev = import.meta.env.DEV;

let _lastSuccessfulSync = 0;
let _syncStatus: 'idle' | 'syncing' | 'success' | 'error' = 'idle';
let _initialSyncDone = false;
let _resolveInitial: (() => void) | null = null;

const _initialPromise = new Promise<void>(resolve => {
  _resolveInitial = resolve;
});

export function getLastSyncTime() { return _lastSuccessfulSync; }
export function getSyncStatus() { return _syncStatus; }
export function isSyncing() { return _syncStatus === 'syncing'; }
export function isInitialSyncDone() { return _initialSyncDone; }
export function waitForInitialSync() { return _initialPromise; }

function dispatchSyncStatus() {
  window.dispatchEvent(new CustomEvent('aos:sync-status', {
    detail: { status: _syncStatus, lastSync: _lastSuccessfulSync }
  }));
}

export async function syncAllFromServer() {
  _syncStatus = 'syncing';
  dispatchSyncStatus();

  try {
    const results = await Promise.allSettled([
      loadProductsFromServer(defaultProducts),
      loadServicesFromServer(defaultServices),
      loadSiteSettingsFromServer(),
      loadSiteContentFromServer(),
      loadOrdersFromServer(),
    ]);

    pushUnsyncedOrders().catch(() => {});

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    if (successCount === results.length) {
      _lastSuccessfulSync = Date.now();
      _syncStatus = 'success';
      if (isDev) console.log(`[GlobalSync] ✓ ${successCount}/${results.length} synced`);
    } else if (successCount > 0) {
      _lastSuccessfulSync = Date.now();
      _syncStatus = 'success';
      if (isDev) console.warn(`[GlobalSync] ⚠ ${successCount}/${results.length} synced`);
    } else {
      _syncStatus = 'error';
      if (isDev) console.warn('[GlobalSync] ✗ All syncs failed');
    }
  } catch (err) {
    _syncStatus = 'error';
    if (isDev) console.warn('[GlobalSync] ✗ Sync error:', err);
  }

  if (!_initialSyncDone) {
    _initialSyncDone = true;
    _resolveInitial?.();
  }

  dispatchSyncStatus();
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

export function startAutoSync() {
  syncAllFromServer();
  setInterval(() => syncAllFromServer(), 15000);
}

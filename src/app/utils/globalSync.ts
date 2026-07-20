import { loadProductsFromServer } from './productStorage';
import { loadServicesFromServer } from './serviceStorage';
import { loadSiteSettingsFromServer } from './siteSettingsStorage';
import { loadSiteContentFromServer } from './siteContentStorage';
import { products as defaultProducts } from '../data/products';
import { defaultServices } from '../data/services';

let lastSync = 0;
let _lastSuccessfulSync = 0;
let _syncStatus: 'idle' | 'syncing' | 'success' | 'error' = 'idle';
let _autoSyncTimer: ReturnType<typeof setInterval> | null = null;

export function getLastSyncTime() { return _lastSuccessfulSync; }
export function getSyncStatus() { return _syncStatus; }
export function isSyncing() { return _syncStatus === 'syncing'; }

function dispatchSyncStatus() {
  window.dispatchEvent(new CustomEvent('aos:sync-status', {
    detail: { status: _syncStatus, lastSync: _lastSuccessfulSync }
  }));
}

async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  label: string,
  retries = 3
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fetcher();
      if (i > 0) console.log(`[GlobalSync] ${label} succeeded on retry ${i + 1}`);
      return result;
    } catch (err) {
      if (i < retries - 1) {
        console.warn(`[GlobalSync] ${label} failed (attempt ${i + 1}), retrying in ${(i + 1) * 1000}ms`);
        await new Promise(r => setTimeout(r, (i + 1) * 1000));
      } else {
        console.warn(`[GlobalSync] ${label} failed after ${retries} attempts`);
      }
    }
  }
  return null;
}

export async function syncAllFromServer(force = false) {
  const now = Date.now();
  if (!force && now - lastSync < 8000) return;
  lastSync = now;
  _syncStatus = 'syncing';
  dispatchSyncStatus();

  try {
    const results = await Promise.all([
      fetchWithRetry(() => loadProductsFromServer(defaultProducts), 'products'),
      fetchWithRetry(() => loadServicesFromServer(defaultServices), 'services'),
      fetchWithRetry(() => loadSiteSettingsFromServer(), 'siteSettings'),
      fetchWithRetry(() => loadSiteContentFromServer(), 'siteContent'),
    ]);

    const successCount = results.filter(r => r !== null).length;
    if (successCount === results.length) {
      _lastSuccessfulSync = Date.now();
      _syncStatus = 'success';
      console.log(`[GlobalSync] ✓ All ${successCount}/${results.length} synced`);
    } else if (successCount > 0) {
      _lastSuccessfulSync = Date.now();
      _syncStatus = 'success';
      console.warn(`[GlobalSync] ⚠ ${successCount}/${results.length} synced (${results.length - successCount} failed)`);
    } else {
      _syncStatus = 'error';
      console.warn('[GlobalSync] ✗ All syncs failed');
    }
  } catch (err) {
    _syncStatus = 'error';
    console.warn('[GlobalSync] ✗ Sync error:', err);
  }

  dispatchSyncStatus();
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

export async function requestSync(force = false): Promise<void> {
  return new Promise(resolve => {
    setTimeout(async () => {
      await syncAllFromServer(force);
      resolve();
    }, 500);
  });
}

export function startAutoSync(intervalMs = 30000) {
  if (_autoSyncTimer) return;
  _autoSyncTimer = setInterval(() => {
    syncAllFromServer(false);
  }, intervalMs);
}

export function stopAutoSync() {
  if (_autoSyncTimer) {
    clearInterval(_autoSyncTimer);
    _autoSyncTimer = null;
  }
}

import {
  DIGITAL_PACKAGES,
  DIGITAL_SERVICES,
  type DigitalPackage,
  type DigitalService,
} from '../data/digitalServices';
import { syncToServer, loadFromServer } from './serverSync';

const STORAGE_KEY = 'aos_digital_catalog';
const SERVER_KEY = 'aos_digital_catalog';

export interface DigitalCatalog {
  services: DigitalService[];
  packages: DigitalPackage[];
  /** Ids of shipped items the admin deleted, kept so a deploy does not bring them back. */
  deletedServices?: string[];
  deletedPackages?: string[];
}

let _lastLocalWrite = 0;

function dispatchChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function defaults(): DigitalCatalog {
  return {
    services: clone(DIGITAL_SERVICES),
    packages: clone(DIGITAL_PACKAGES),
    deletedServices: [],
    deletedPackages: [],
  };
}

/**
 * New catalogue items shipped in the code are added to catalogues that were
 * saved before they existed. Items an admin deleted on purpose are remembered
 * (inside the synced catalogue itself) so they never come back after a deploy
 * or on another browser.
 */
function mergeDefaults(stored: DigitalCatalog): DigitalCatalog {
  const base = defaults();
  const deletedServices = Array.isArray(stored.deletedServices) ? stored.deletedServices : [];
  const deletedPackages = Array.isArray(stored.deletedPackages) ? stored.deletedPackages : [];
  const serviceIds = new Set(stored.services.map((service) => service.id));
  const packageIds = new Set(stored.packages.map((pkg) => pkg.id));

  return {
    services: [
      ...stored.services,
      ...base.services.filter(
        (service) => !serviceIds.has(service.id) && !deletedServices.includes(service.id),
      ),
    ],
    packages: [
      ...stored.packages,
      ...base.packages.filter(
        (pkg) => !packageIds.has(pkg.id) && !deletedPackages.includes(pkg.id),
      ),
    ],
    deletedServices,
    deletedPackages,
  };
}

function isValidCatalog(value: unknown): value is DigitalCatalog {
  if (!value || typeof value !== 'object') return false;
  const catalog = value as DigitalCatalog;
  return Array.isArray(catalog.services) && Array.isArray(catalog.packages);
}

function normalize(catalog: DigitalCatalog): DigitalCatalog {
  return mergeDefaults({
    services: catalog.services.filter((service) => service && service.id),
    packages: catalog.packages.filter((pkg) => pkg && pkg.id),
    deletedServices: Array.isArray(catalog.deletedServices) ? catalog.deletedServices : [],
    deletedPackages: Array.isArray(catalog.deletedPackages) ? catalog.deletedPackages : [],
  });
}

export function getStoredDigitalCatalog(): DigitalCatalog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidCatalog(parsed)) return normalize(parsed);
    }
  } catch {
    /* corrupted data falls back to the shipped catalogue */
  }
  return defaults();
}

export function saveDigitalCatalog(catalog: DigitalCatalog): void {
  _lastLocalWrite = Date.now();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog));
  } catch {
    /* keep going: the server copy may still succeed */
  }
  dispatchChange();
  void syncToServer(SERVER_KEY, catalog);
}

export function resetDigitalCatalog(): DigitalCatalog {
  const catalog = defaults();
  _lastLocalWrite = Date.now();
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  dispatchChange();
  void syncToServer(SERVER_KEY, catalog);
  return catalog;
}

export function deleteDigitalService(id: string): DigitalCatalog {
  const catalog = getStoredDigitalCatalog();
  const next: DigitalCatalog = {
    ...catalog,
    services: catalog.services.filter((service) => service.id !== id),
    deletedServices: Array.from(new Set([...(catalog.deletedServices ?? []), id])),
  };
  saveDigitalCatalog(next);
  return next;
}

export function deleteDigitalPackage(id: string): DigitalCatalog {
  const catalog = getStoredDigitalCatalog();
  const next: DigitalCatalog = {
    ...catalog,
    packages: catalog.packages.filter((pkg) => pkg.id !== id),
    deletedPackages: Array.from(new Set([...(catalog.deletedPackages ?? []), id])),
  };
  saveDigitalCatalog(next);
  return next;
}

export async function loadDigitalCatalogFromServer(): Promise<DigitalCatalog> {
  if (Date.now() - _lastLocalWrite < 5000) return getStoredDigitalCatalog();
  try {
    const data = await loadFromServer<DigitalCatalog>(SERVER_KEY);
    if (isValidCatalog(data) && (data.services.length || data.packages.length)) {
      const merged = normalize(data);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        /* ignore */
      }
      return merged;
    }
  } catch {
    // server unavailable, use local
  }
  return getStoredDigitalCatalog();
}

export function createDigitalServiceId(): string {
  return `svc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

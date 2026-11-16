import { type ServiceCategory } from '../data/services';
import { syncToServer, loadFromServer } from './serverSync';

const STORAGE_KEY = 'aos_services';
const INIT_KEY = 'aos_services_initialized';
const MIGRATION_KEY = 'aos_services_migrated_v2';
const SERVER_KEY = 'aos_services';

let _lastLocalWrite = 0;

function dispatchChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

function nextId(services: ServiceCategory[]): number {
  return services.reduce((max, service) => Math.max(max, service.id), 0) + 1;
}

/** Adds every default category that is still missing from the stored list. */
function mergeMissingCategories(
  stored: ServiceCategory[],
  defaults: ServiceCategory[],
): ServiceCategory[] {
  const existingKeys = new Set(stored.map((service) => service.key));
  const missing = defaults.filter((service) => !existingKeys.has(service.key));
  if (!missing.length) return stored;
  let id = nextId(stored);
  return [...stored, ...missing.map((service) => ({ ...service, id: id++ }))];
}

/** Re-adds the digital category when older server data replaces newer local data. */
function ensureDigitalCategory(
  data: ServiceCategory[],
  defaults: ServiceCategory[],
): ServiceCategory[] {
  const digital = defaults.find((service) => service.key === 'digital');
  if (!digital || data.some((service) => service.key === 'digital')) return data;
  return [...data, { ...digital, id: nextId(data) }];
}

export function getStoredServices(defaults: ServiceCategory[]): ServiceCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return defaults;
}

export function initializeServices(defaults: ServiceCategory[]): void {
  if (!localStorage.getItem(INIT_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    localStorage.setItem(INIT_KEY, 'true');
    localStorage.setItem(MIGRATION_KEY, 'true');
    return;
  }

  // One-time upgrade for visitors who already had the old service list stored.
  // After this runs, admin deletions are respected and not re-added.
  if (localStorage.getItem(MIGRATION_KEY) === 'true') return;
  localStorage.setItem(MIGRATION_KEY, 'true');

  const stored = getStoredServices([]);
  if (!stored.length) return;

  const merged = mergeMissingCategories(stored, defaults);
  if (merged !== stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    syncToServer(SERVER_KEY, merged);
  }
}

export function saveServices(services: ServiceCategory[]): void {
  _lastLocalWrite = Date.now();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  dispatchChange();
  syncToServer(SERVER_KEY, services);
}

export function addService(service: Omit<ServiceCategory, 'id'>): ServiceCategory {
  const services = getStoredServices([]);
  const maxId = services.reduce((max, s) => Math.max(max, s.id), 0);
  const newService: ServiceCategory = { ...service, id: maxId + 1 };
  services.push(newService);
  saveServices(services);
  return newService;
}

export function updateService(id: number, updates: Partial<ServiceCategory>): boolean {
  const services = getStoredServices([]);
  const idx = services.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  services[idx] = { ...services[idx], ...updates };
  saveServices(services);
  return true;
}

export function deleteService(id: number): boolean {
  const services = getStoredServices([]);
  const filtered = services.filter((s) => s.id !== id);
  if (filtered.length === services.length) return false;
  saveServices(filtered);
  return true;
}

export async function loadServicesFromServer(defaults: ServiceCategory[]): Promise<ServiceCategory[]> {
  if (Date.now() - _lastLocalWrite < 5000) return getStoredServices(defaults);
  try {
    const data = await loadFromServer<ServiceCategory[]>(SERVER_KEY);
    if (data && data.length > 0) {
      // Server data may predate the digital category. Keep it once the local
      // client already knows it, then push the merged list back to the server.
      const local = getStoredServices([]);
      const localHasDigital = local.some((service) => service.key === 'digital');
      const merged = localHasDigital ? ensureDigitalCategory(data, defaults) : data;

      if (Date.now() - _lastLocalWrite >= 5000) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        localStorage.setItem(INIT_KEY, 'true');
        if (merged !== data) {
          _lastLocalWrite = Date.now();
          void syncToServer(SERVER_KEY, merged);
        }
      }
      return merged;
    }
  } catch {
    // server unavailable, use local
  }
  return getStoredServices(defaults);
}

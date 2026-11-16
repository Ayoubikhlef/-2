import { type ServiceCategory } from '../data/services';
import { syncToServer, loadFromServer } from './serverSync';

const STORAGE_KEY = 'aos_services';
const INIT_KEY = 'aos_services_initialized';
const SERVER_KEY = 'aos_services';
/** Set only when an admin deliberately deletes the digital-services category. */
const DIGITAL_REMOVED_KEY = 'aos_services_digital_removed';

let _lastLocalWrite = 0;

function dispatchChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

function nextId(services: ServiceCategory[]): number {
  return services.reduce((max, service) => Math.max(max, service.id), 0) + 1;
}

function digitalCategoryAllowed(): boolean {
  try {
    return localStorage.getItem(DIGITAL_REMOVED_KEY) !== 'true';
  } catch {
    return true;
  }
}

/**
 * Keeps the digital-services category present. Older builds and tabs that are
 * still open during a deploy overwrite `aos_services` with a list that predates
 * the category, which used to remove it from the booking form until the visitor
 * cleared storage. This heals that data on every load unless an admin removed
 * the category on purpose (see deleteService).
 */
function ensureDigitalCategory(
  data: ServiceCategory[],
  defaults: ServiceCategory[],
): ServiceCategory[] {
  if (data.some((service) => service.key === 'digital')) return data;
  if (!digitalCategoryAllowed()) return data;
  const digital = defaults.find((service) => service.key === 'digital');
  if (!digital) return data;
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
    return;
  }

  const stored = getStoredServices([]);
  if (!stored.length) return;

  const merged = ensureDigitalCategory(stored, defaults);
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
  if (newService.key === 'digital') {
    localStorage.removeItem(DIGITAL_REMOVED_KEY);
  }
  saveServices(services);
  return newService;
}

export function updateService(id: number, updates: Partial<ServiceCategory>): boolean {
  const services = getStoredServices([]);
  const idx = services.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  const previousKey = services[idx].key;
  services[idx] = { ...services[idx], ...updates };
  // Editing the digital category (or renaming another one to it) undoes an
  // earlier deliberate deletion.
  if (previousKey === 'digital' || services[idx].key === 'digital') {
    localStorage.removeItem(DIGITAL_REMOVED_KEY);
  }
  saveServices(services);
  return true;
}

export function deleteService(id: number): boolean {
  const services = getStoredServices([]);
  const target = services.find((s) => s.id === id);
  if (!target) return false;
  const filtered = services.filter((s) => s.id !== id);
  if (target.key === 'digital') {
    localStorage.setItem(DIGITAL_REMOVED_KEY, 'true');
  }
  saveServices(filtered);
  return true;
}

export async function loadServicesFromServer(defaults: ServiceCategory[]): Promise<ServiceCategory[]> {
  if (Date.now() - _lastLocalWrite < 5000) return getStoredServices(defaults);
  try {
    const data = await loadFromServer<ServiceCategory[]>(SERVER_KEY);
    if (data && data.length > 0) {
      // Server data may predate the digital category. Merge it in, then push
      // the healed list back so every other client and browser receives it.
      const merged = ensureDigitalCategory(data, defaults);

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

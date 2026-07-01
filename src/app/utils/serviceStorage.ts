import { type ServiceCategory } from '../data/services';

const STORAGE_KEY = 'aos_services';
const INIT_KEY = 'aos_services_initialized';

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
  }
}

export function saveServices(services: ServiceCategory[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(services));
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
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
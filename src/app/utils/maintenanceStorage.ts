const STORAGE_KEY = 'ayoubtech-maintenance';

export type MaintenanceData = {
  enabled: boolean;
  message: { ar: string; fr: string; en: string };
};

import { api } from './api';
import { syncToServer } from './serverSync';

function getData(): MaintenanceData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { enabled: false, message: { ar: '', fr: '', en: '' } };
    return JSON.parse(raw);
  } catch {
    return { enabled: false, message: { ar: '', fr: '', en: '' } };
  }
}

function saveData(data: MaintenanceData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function dispatchChange() {
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

function pushToServer(data: MaintenanceData) {
  syncToServer('aos_maintenance', data);
}

export function isMaintenanceMode(): boolean {
  return getData().enabled;
}

export function setMaintenanceMode(enabled: boolean): void {
  const data = getData();
  data.enabled = enabled;
  saveData(data);
  pushToServer(data);
  dispatchChange();
}

export function getMaintenanceMessage(): MaintenanceData['message'] {
  return getData().message;
}

export function setMaintenanceMessage(msg: MaintenanceData['message']): void {
  const data = getData();
  data.message = msg;
  saveData(data);
  pushToServer(data);
  dispatchChange();
}

export async function loadMaintenanceFromServer(): Promise<MaintenanceData | null> {
  try {
    const result = await api.get<{ value: MaintenanceData | null }>('/maintenance');
    if (result.value && typeof result.value.enabled === 'boolean') {
      saveData(result.value);
      dispatchChange();
      return result.value;
    }
  } catch {
    // server unavailable, keep local
  }
  return getData();
}
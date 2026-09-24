const STORAGE_KEY = 'ayoubtech-maintenance';

export type MaintenanceData = {
  enabled: boolean;
  message: { ar: string; fr: string; en: string };
};

import { api } from './api';

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

function pushToServer(data: MaintenanceData): Promise<boolean> {
  return api.post('/maintenance', data).then(
    () => true,
    (err) => {
      console.warn('[Maintenance] Failed to save to server:', err?.message);
      return false;
    }
  );
}

let messagePushTimer: ReturnType<typeof setTimeout> | null = null;

export function isMaintenanceMode(): boolean {
  return getData().enabled;
}

export function setMaintenanceMode(enabled: boolean): Promise<boolean> {
  const data = getData();
  data.enabled = enabled;
  saveData(data);
  dispatchChange();
  return pushToServer(data);
}

export function getMaintenanceMessage(): MaintenanceData['message'] {
  return getData().message;
}

export function setMaintenanceMessage(msg: MaintenanceData['message']): void {
  const data = getData();
  data.message = msg;
  saveData(data);
  dispatchChange();
  // Debounced: typing sends one request after the user stops, not per keystroke.
  if (messagePushTimer) clearTimeout(messagePushTimer);
  messagePushTimer = setTimeout(() => {
    messagePushTimer = null;
    void pushToServer(getData());
  }, 700);
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
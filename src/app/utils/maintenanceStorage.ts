const STORAGE_KEY = 'ayoubtech-maintenance';

export type MaintenanceData = {
  enabled: boolean;
  message: { ar: string; fr: string; en: string };
};

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

export function isMaintenanceMode(): boolean {
  return getData().enabled;
}

export function setMaintenanceMode(enabled: boolean): void {
  const data = getData();
  data.enabled = enabled;
  saveData(data);
}

export function getMaintenanceMessage(): MaintenanceData['message'] {
  return getData().message;
}

export function setMaintenanceMessage(msg: MaintenanceData['message']): void {
  const data = getData();
  data.message = msg;
  saveData(data);
}

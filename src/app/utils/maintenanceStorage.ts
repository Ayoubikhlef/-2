const STORAGE_KEY = 'ayoubtech-maintenance';

export function isMaintenanceMode(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return data.enabled === true;
  } catch {
    return false;
  }
}

export function setMaintenanceMode(enabled: boolean): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  let data: { enabled: boolean; message?: { ar: string; fr: string; en: string } } = {
    enabled,
    message: { ar: '', fr: '', en: '' },
  };
  if (raw) {
    try {
      const existing = JSON.parse(raw);
      data = { ...existing, enabled };
    } catch {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

import { api } from './api';

const STORAGE_KEY = 'ayoubtech-newsletter';

function log(level: 'info' | 'warn' | 'error', msg: string, data?: any) {
  const prefix = `[Newsletter]`;
  const line = `${prefix} ${msg}${data !== undefined ? ' ' + JSON.stringify(data) : ''}`;
  if (level === 'info') console.log(line);
  else if (level === 'warn') console.warn(line);
  else console.error(line);
}

export function subscribe(email: string): void {
  if (typeof window === 'undefined') return;

  const current = getSubscribers();
  if (current.includes(email)) {
    log('warn', `Email already subscribed: ${email}`);
    return;
  }

  const next = [...current, email];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  log('info', `Subscribed: ${email}`);

  api.newsletter.subscribe(email)
    .then(() => log('info', `Synced subscription to server: ${email}`))
    .catch((err: any) => log('warn', `Failed to sync subscription to server (offline?)`, err?.message));

  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

export function getSubscribers(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return parsed;
  } catch (err) {
    log('error', 'Failed to parse subscribers from localStorage', err);
    return [];
  }
}

export async function loadSubscribersFromServer(): Promise<string[]> {
  try {
    const serverData = await api.get<{ email: string; created_at: string }[]>('/newsletter');
    const emails = serverData.map((s: any) => s.email);
    const local = getSubscribers();
    const merged = [...new Set([...local, ...emails])];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    log('info', `Merged ${emails.length} server subscribers with ${local.length} local`);
    return merged;
  } catch (err: any) {
    log('warn', 'Failed to load subscribers from server', err?.message);
    return getSubscribers();
  }
}

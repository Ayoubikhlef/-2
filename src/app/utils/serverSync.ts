import { api } from './api';

function log(module: string, level: 'info' | 'warn', msg: string, data?: any) {
  const line = `[${module}] ${msg}${data !== undefined ? ' ' + JSON.stringify(data) : ''}`;
  if (level === 'info') console.log(line);
  else console.warn(line);
}

export async function syncToServer(key: string, data: any): Promise<boolean> {
  try {
    await api.data.save(key, data);
    log('ServerSync', 'info', `Saved ${key} to server`);
    return true;
  } catch (err: any) {
    log('ServerSync', 'warn', `Failed to save ${key} to server`, err?.message);
    return false;
  }
}

export async function loadFromServer<T>(key: string): Promise<T | null> {
  try {
    const result = await api.data.get(key);
    log('ServerSync', 'info', `Loaded ${key} from server`);
    return result.value as T;
  } catch (err: any) {
    log('ServerSync', 'warn', `Failed to load ${key} from server`, err?.message);
    return null;
  }
}

export async function deleteFromServer(key: string): Promise<boolean> {
  try {
    await api.data.delete(key);
    log('ServerSync', 'info', `Deleted ${key} from server`);
    return true;
  } catch (err: any) {
    log('ServerSync', 'warn', `Failed to delete ${key} from server`, err?.message);
    return false;
  }
}

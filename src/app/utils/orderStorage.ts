import { api } from './api';

export type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

export type OrderStatus = 'new' | 'processing' | 'completed' | 'cancelled';

export type OrderRecord = {
  id: string;
  createdAt: string;
  customer: string;
  phone: string;
  email: string;
  wilaya: string;
  municipality: string;
  address: string;
  note: string;
  items: OrderItem[];
  total: number;
  source: 'form' | 'quick-order' | 'service-booking';
  status: OrderStatus;
  paymentMethod?: string;
  discount?: number;
  discountCode?: string;
};

const STORAGE_KEY = 'ayoubtech-orders';
const SOFT_DELETE_KEY = 'ayoubtech-soft-delete';

function log(level: 'info' | 'warn' | 'error', msg: string, data?: any) {
  const prefix = `[Orders]`;
  const line = `${prefix} ${msg}${data !== undefined ? ' ' + JSON.stringify(data) : ''}`;
  if (level === 'info') console.log(line);
  else if (level === 'warn') console.warn(line);
  else console.error(line);
}

function getSoftDeletedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SOFT_DELETE_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveSoftDeletedIds(ids: Set<string>) {
  localStorage.setItem(SOFT_DELETE_KEY, JSON.stringify([...ids]));
}

function dispatchChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

export function getOrders(): OrderRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OrderRecord[];
    return parsed;
  } catch (err) {
    log('error', 'Failed to parse orders from localStorage', err);
    return [];
  }
}

export async function saveOrder(order: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>): Promise<OrderRecord> {
  const record: OrderRecord = {
    ...order,
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
    status: 'new',
  };

  const current = getOrders();
  const next = [record, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  log('info', `Saved order ${record.id} to localStorage`);
  dispatchChange();

  try {
    await api.orders.create({ ...order, id: record.id });
    log('info', `Order ${record.id} synced to server`);
  } catch (err: any) {
    log('warn', `Server sync failed for order ${record.id}`, err?.message);
  }

  return record;
}

export function updateOrderStatus(id: string, status: OrderStatus): OrderRecord | null {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) {
    log('warn', `Order ${id} not found for status update`);
    return null;
  }
  orders[index] = { ...orders[index], status };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  log('info', `Updated order ${id} status to ${status} in localStorage`);
  dispatchChange();

  api.orders.updateStatus(id, status)
    .then(() => log('info', `Order ${id} status synced to server`))
    .catch((err: any) => log('warn', `Failed to sync status update to server`, err?.message));

  return orders[index];
}

export function removeOrder(id: string): void {
  const orders = getOrders();
  const next = orders.filter((o) => o.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  log('info', `Removed order ${id} from localStorage`);

  const deleted = getSoftDeletedIds();
  deleted.add(id);
  saveSoftDeletedIds(deleted);
  dispatchChange();

  api.orders.remove(id)
    .then(() => {
      log('info', `Server confirmed deletion of ${id}`);
      const ids = getSoftDeletedIds();
      ids.delete(id);
      saveSoftDeletedIds(ids);
    })
    .catch((err: any) => log('warn', `Failed to delete order ${id} from server`, err?.message));
}

export async function loadOrdersFromServer(): Promise<OrderRecord[]> {
  try {
    const serverOrders = await api.orders.list();
    log('info', `Loaded ${serverOrders.length} orders from server`);
    const deleted = getSoftDeletedIds();
    const localOrders = getOrders();
    const merged = [...serverOrders as OrderRecord[]];
    for (const local of localOrders) {
      if (!merged.some(m => m.id === local.id)) {
        merged.push(local);
      }
    }
    const filtered = merged.filter(o => !deleted.has(o.id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err: any) {
    log('warn', 'Failed to load orders from server, using local', err?.message);
    return getOrders();
  }
}

export async function clearOrders() {
  if (typeof window === 'undefined') return [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SOFT_DELETE_KEY);
  try {
    const r = await api.orders.clearAll();
    log('info', `Server deleted ${r.count} orders`);
  } catch {
    log('warn', 'Server clear-all failed');
  }
  dispatchChange();
  return [];
}

export function getOrderStats(orders: OrderRecord[]) {
  return {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'new').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    completed: orders.filter((o) => o.status === 'completed').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    revenue: orders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + o.total, 0),
  };
}

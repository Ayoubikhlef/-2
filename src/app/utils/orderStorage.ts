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
};

const STORAGE_KEY = 'ayoubtech-orders';
const SOFT_DELETE_KEY = 'ayoubtech-soft-delete';

function log(level: 'info' | 'warn' | 'error', msg: string, data?: any) {
  const prefix = `[Orders]`;
  const line = `${prefix} ${msg} ${data ? JSON.stringify(data) : ''}`;
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

export function getOrders(): OrderRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OrderRecord[];
    log('info', `Read ${parsed.length} orders from localStorage`);
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

  api.orders.create(order)
    .then((serverOrder) => {
      log('info', `Order ${record.id} synced to server (server id: ${serverOrder.id})`);
      const updated = getOrders().map(o => o.id === record.id ? { ...o, id: serverOrder.id, createdAt: serverOrder.createdAt } : o);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    })
    .catch((err: any) => {
      log('warn', `Failed to sync order to server (offline?)`, err?.message);
    });

  window.dispatchEvent(new CustomEvent('aos:data-changed'));
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

  api.orders.updateStatus(id, status)
    .then(() => log('info', `Order ${id} status synced to server`))
    .catch((err: any) => log('warn', `Failed to sync status update to server`, err?.message));

  window.dispatchEvent(new CustomEvent('aos:data-changed'));
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
  log('info', `Added ${id} to soft-delete set (${deleted.size} total)`);

  api.orders.remove(id)
    .then(() => {
      log('info', `Server confirmed deletion of ${id}`);
      const ids = getSoftDeletedIds();
      ids.delete(id);
      saveSoftDeletedIds(ids);
    })
    .catch((err: any) => log('warn', `Failed to delete order ${id} from server`, err?.message));

  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

export async function loadOrdersFromServer(): Promise<OrderRecord[]> {
  try {
    const serverOrders = await api.orders.list();
    log('info', `Loaded ${serverOrders.length} orders from server`);
    const deleted = getSoftDeletedIds();
    log('info', `Soft-deleted IDs: ${[...deleted].join(', ') || '(none)'}`);
    const localOrders = getOrders();
    const merged = [...serverOrders as OrderRecord[]];
    for (const local of localOrders) {
      if (!merged.some(m => m.id === local.id)) {
        merged.push(local);
      }
    }
    const filtered = merged.filter(o => !deleted.has(o.id));
    log('info', `After filtering soft-deleted: ${filtered.length} orders`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (err: any) {
    log('warn', 'Failed to load orders from server, using local', err?.message);
    return getOrders();
  }
}

export function clearOrders() {
  if (typeof window === 'undefined') return [];
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SOFT_DELETE_KEY);
  log('info', 'Cleared all orders and soft-delete list');
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

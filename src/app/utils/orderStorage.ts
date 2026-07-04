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

function log(level: 'info' | 'warn' | 'error', msg: string, data?: any) {
  const prefix = `[Orders]`;
  if (level === 'info') console.log(prefix, msg, data || '');
  else if (level === 'warn') console.warn(prefix, msg, data || '');
  else console.error(prefix, msg, data || '');
}

export function getOrders(): OrderRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
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

  // Save to localStorage first (fast, always works)
  const current = getOrders();
  const next = [record, ...current];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  log('info', `Saved order ${record.id} to localStorage`);

  // Sync to API in background (don't await — show success immediately)
  api.orders.create(order)
    .then((serverOrder) => {
      log('info', `Order ${record.id} synced to server (server id: ${serverOrder.id})`);
      const updated = getOrders().map(o => o.id === record.id ? { ...o, id: serverOrder.id, createdAt: serverOrder.createdAt } : o);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    })
    .catch((err: any) => {
      log('warn', `Failed to sync order to server (offline?)`, err?.message);
    });

  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  return record;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderRecord | null> {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) {
    log('warn', `Order ${id} not found for status update`);
    return null;
  }
  orders[index] = { ...orders[index], status };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  log('info', `Updated order ${id} status to ${status} in localStorage`);

  try {
    await api.orders.updateStatus(id, status);
    log('info', `Order ${id} status synced to server`);
  } catch (err: any) {
    log('warn', `Failed to sync status update to server`, err?.message);
  }

  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  return orders[index];
}

export async function removeOrder(id: string): Promise<void> {
  const orders = getOrders();

  try {
    await api.orders.remove(id);
    log('info', `Order ${id} deleted from server`);
  } catch (err: any) {
    log('warn', `Failed to delete order ${id} from server, removing locally only`, err?.message);
  }

  const next = orders.filter((o) => o.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  log('info', `Removed order ${id} from localStorage`);

  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

export async function loadOrdersFromServer(): Promise<OrderRecord[]> {
  try {
    const serverOrders = await api.orders.list();
    log('info', `Loaded ${serverOrders.length} orders from server`);
    // Merge with localStorage (server is authoritative)
    const localOrders = getOrders();
    const merged = [...serverOrders as OrderRecord[]];
    for (const local of localOrders) {
      if (!merged.some(m => m.id === local.id)) {
        merged.push(local);
      }
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  } catch (err: any) {
    log('warn', 'Failed to load orders from server, using local', err?.message);
    return getOrders();
  }
}

export function clearOrders() {
  if (typeof window === 'undefined') return [];
  window.localStorage.removeItem(STORAGE_KEY);
  log('info', 'Cleared all orders');
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

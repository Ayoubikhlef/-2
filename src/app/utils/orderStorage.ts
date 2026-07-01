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

export function getOrders(): OrderRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OrderRecord[];
  } catch {
    return [];
  }
}

export function saveOrder(order: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>): OrderRecord {
  const record: OrderRecord = {
    ...order,
    id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10),
    createdAt: new Date().toISOString(),
    status: 'new',
  };
  const current = getOrders();
  const next = [record, ...current];
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return record;
}

export function updateOrderStatus(id: string, status: OrderStatus): OrderRecord | null {
  const orders = getOrders();
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) return null;
  orders[index] = { ...orders[index], status };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  return orders[index];
}

export function clearOrders() {
  if (typeof window === 'undefined') return [];
  window.localStorage.removeItem(STORAGE_KEY);
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

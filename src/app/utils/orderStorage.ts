import { api, getAccessToken, getStoredUser, refreshToken } from './api';
import { getStoredProducts, saveProducts } from './productStorage';
import { products as defaultProducts } from '../data/products';

export type OrderItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
  productId?: number;
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
  wilayaId?: number;
  municipalityId?: string;
  items: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  deliveryMethod?: 'home' | 'desk';
  total: number;
  source: 'form' | 'quick-order' | 'service-booking';
  status: OrderStatus;
  paymentMethod?: string;
  discount?: number;
  discountCode?: string;
};

/**
 * Turns server-side checkout rejections into a customer-facing message.
 * Returns null for unknown errors so the caller can use a generic fallback.
 */
export function describeOrderError(err: any, language: 'ar' | 'fr' | 'en'): string | null {
  const message = String(err?.message || '');
  const stock = message.match(/Insufficient stock:\s*(.+?)\s*\(available\s*(\d+)\)/i);
  if (stock) {
    const name = stock[1];
    const available = Number(stock[2]);
    if (language === 'ar') {
      return available <= 0
        ? `نفدت الكمية من «${name}». اختر منتجاً آخر أو تواصل معنا.`
        : `الكمية المطلوبة من «${name}» غير متوفرة. المتوفر حالياً: ${available}.`;
    }
    if (language === 'fr') {
      return available <= 0
        ? `« ${name} » est en rupture de stock. Choisissez un autre produit ou contactez-nous.`
        : `Stock insuffisant pour « ${name} ». Disponible : ${available}.`;
    }
    return available <= 0
      ? `"${name}" is out of stock. Choose another product or contact us.`
      : `Not enough stock for "${name}". Available: ${available}.`;
  }
  if (/Product not found|Product catalog unavailable/i.test(message)) {
    if (language === 'ar') return 'هذا المنتج لم يعد متوفراً. حدّث الصفحة واختر منتجاً آخر.';
    if (language === 'fr') return "Ce produit n'est plus disponible. Actualisez la page et choisissez un autre produit.";
    return 'This product is no longer available. Refresh the page and choose another item.';
  }
  return null;
}

const STORAGE_KEY = 'ayoubtech-orders';
const SOFT_DELETE_KEY = 'ayoubtech-soft-delete';
const SYNCED_IDS_KEY = 'ayoubtech-synced-order-ids';

const isDev = import.meta.env.DEV;

function log(level: 'info' | 'warn' | 'error', msg: string, data?: any) {
  if (!isDev) return;
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

function getSyncedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(SYNCED_IDS_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
}

function saveSyncedIds(ids: Set<string>) {
  localStorage.setItem(SYNCED_IDS_KEY, JSON.stringify([...ids]));
}

function markSynced(id: string) {
  const ids = getSyncedIds();
  ids.add(id);
  saveSyncedIds(ids);
}

function dispatchChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('aos:data-changed'));
}

// Notify listeners in a separate task so the ~18 listener re-renders never
// extend the synchronous work of a submit click.
function deferDispatchChange() {
  if (typeof window === 'undefined') return;
  window.setTimeout(dispatchChange, 0);
}

// Yield a frame so the caller's "submitting" state paints before the heavy
// synchronous localStorage bookkeeping below runs.
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => window.setTimeout(resolve, 0));
    } else {
      window.setTimeout(resolve, 0);
    }
  });
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

function safeId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch { /* insecure context / older Safari */ }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const inFlightOrders = new Map<string, Promise<OrderRecord>>();

function orderFingerprint(order: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>): string {
  const items = order.items
    .map((item) => `${item.productId ?? item.name}:${item.quantity}:${item.price}`)
    .join('|');
  return `${order.phone}|${order.source}|${order.total}|${items}`;
}

export async function saveOrder(order: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>): Promise<OrderRecord> {
  // A double click or a retried submit must not create two orders. While the
  // first request is in flight, identical submissions share its promise.
  const key = orderFingerprint(order);
  const pending = inFlightOrders.get(key);
  if (pending) return pending;

  let task: Promise<OrderRecord>;
  task = saveOrderInternal(order).finally(() => {
    if (inFlightOrders.get(key) === task) inFlightOrders.delete(key);
  });
  inFlightOrders.set(key, task);
  return task;
}

async function saveOrderInternal(order: Omit<OrderRecord, 'id' | 'createdAt' | 'status'>): Promise<OrderRecord> {
  // Let React paint the "submitting" state before any synchronous work.
  await nextPaint();

  const record: OrderRecord = {
    ...order,
    id: safeId(),
    createdAt: new Date().toISOString(),
    status: 'new',
  };

  const current = getOrders();
  const next = [record, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  log('info', `Saved order ${record.id} to localStorage`);

  deferDispatchChange();

  try {
    const payload: Record<string, any> = {
      customer: order.customer,
      phone: order.phone,
      email: order.email || undefined,
      wilaya: order.wilaya || (order.source === 'service-booking' ? '' : order.wilaya),
      municipality: order.municipality || '',
      address: order.address || '',
      note: order.note || '',
      wilayaId: order.wilayaId,
      municipalityId: order.municipalityId,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      deliveryMethod: order.deliveryMethod,
      total: order.total,
      source: order.source,
      discountCode: order.discountCode,
      // The same id is used locally and on the server, so retries are
      // idempotent and the admin list cannot show the order twice.
      id: record.id,
      // Anchors the server duplicate check to the original submit time so a
      // queued offline order cannot re-create itself when it is retried.
      createdAt: record.createdAt,
    };
    // Product orders may omit productId when only a display name is known;
    // server matches by name. Empty optional fields are stripped.
    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined) delete payload[k];
    });
    const serverResult = await api.orders.create(payload);
    log('info', `Order ${record.id} synced to server`);
    markSynced(record.id);

    // Reflect the reserved stock locally only after the server accepted the
    // order. The server is authoritative; this just keeps the open catalog
    // from offering quantities that were sold in another tab. A duplicate
    // answer means this submit did not reserve anything new.
    if (!serverResult?.duplicate) {
      const products = getStoredProducts(defaultProducts);
      let changed = false;
      for (const item of order.items) {
        const idx = products.findIndex(
          (p) => p.nameAr === item.name || p.nameFr === item.name || p.nameEn === item.name
        );
        if (idx !== -1 && products[idx].stock !== undefined) {
          products[idx].stock = Math.max(0, (products[idx].stock ?? 0) - item.quantity);
          changed = true;
        }
      }
      if (changed) saveProducts(products, { sync: false, dispatch: false });
    }
  } catch (err: any) {
    log('warn', `Server sync failed for order ${record.id}`, err?.message);
    // A 4xx answer is definitive (sold out, invalid data, closed coupon):
    // drop the optimistic local copy so it is not retried forever.
    if (err?.status >= 400 && err?.status < 500) {
      const remaining = getOrders().filter((o) => o.id !== record.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      deferDispatchChange();
    }
    // Local copy stays queued for pushUnsyncedOrders, but the UI must know
    // the server rejected/failed so it does not fake a success.
    throw err instanceof Error ? err : new Error(String(err));
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

export async function pushUnsyncedOrders(): Promise<void> {
  const synced = getSyncedIds();
  const local = getOrders();
  const unsynced = local.filter(o => !synced.has(o.id));
  if (unsynced.length === 0) return;
  log('info', `Pushing ${unsynced.length} unsynced orders to server`);
  for (const order of unsynced) {
    try {
      await api.orders.create({
        customer: order.customer,
        phone: order.phone,
        email: order.email || undefined,
        wilaya: order.wilaya,
        municipality: order.municipality,
        address: order.address,
        note: order.note || '',
        wilayaId: order.wilayaId,
        municipalityId: order.municipalityId,
        items: order.items,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        deliveryMethod: order.deliveryMethod,
        total: order.total,
        source: order.source,
        discountCode: order.discountCode,
        id: order.id,
        createdAt: order.createdAt,
      });
      markSynced(order.id);
      log('info', `Order ${order.id} pushed to server`);
    } catch (err: any) {
      // Permanent validation errors: stop infinite retry, surface in console.
      if (err?.status && err.status >= 400 && err.status < 500) {
        console.warn(`[Orders] Dropping permanently rejected order ${order.id}:`, err.message);
        markSynced(order.id);
      } else {
        log('warn', `Failed to push order ${order.id}`, err?.message);
      }
    }
  }
}

function orderItemSignature(order: OrderRecord): string {
  return order.items
    .map((item) => `${item.name.trim().toLowerCase()}:${item.quantity}`)
    .sort()
    .join('|');
}

/**
 * Historical local records were stored with a different id than the server
 * copy. Treat them as the same order when phone, customer, items and the
 * submission time match, even if delivery recalculated the total.
 */
function isSameOrder(a: OrderRecord, b: OrderRecord): boolean {
  if (a.id === b.id) return true;
  if (a.phone !== b.phone) return false;
  if (a.customer.trim().toLowerCase() !== b.customer.trim().toLowerCase()) return false;
  if (orderItemSignature(a) !== orderItemSignature(b)) return false;
  const aTime = new Date(a.createdAt).getTime();
  const bTime = new Date(b.createdAt).getTime();
  if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) return false;
  return Math.abs(aTime - bTime) <= 5 * 60 * 1000;
}

export async function loadOrdersFromServer(): Promise<OrderRecord[]> {
  if (!getAccessToken()) {
    return getOrders();
  }
  const fetchServerOrders = async () => {
    const storedUser = getStoredUser();
    const isAdmin = storedUser?.role === 'SUPER_ADMIN' || storedUser?.role === 'ADMIN';
    const params = !isAdmin
      ? storedUser?.email
        ? { email: storedUser.email }
        : storedUser?.phone
          ? { phone: storedUser.phone }
          : undefined
      : undefined;
    return api.orders.list(params);
  };

  try {
    let serverOrders: any[];
    try {
      serverOrders = await fetchServerOrders();
    } catch (err: any) {
      // Expired access token: refresh once and retry (Safari/mobile sessions).
      if (err?.status === 401) {
        const ok = await refreshToken();
        if (!ok) return getOrders();
        serverOrders = await fetchServerOrders();
      } else {
        throw err;
      }
    }
    log('info', `Loaded ${serverOrders.length} orders from server`);
    const deleted = getSoftDeletedIds();
    const localOrders = getOrders();
    const merged = [...serverOrders as OrderRecord[]];
    for (const local of localOrders) {
      if (!merged.some(m => isSameOrder(m, local))) {
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

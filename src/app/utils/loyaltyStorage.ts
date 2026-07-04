import { api } from './api';

export type LoyaltyRecord = {
  customerPhone: string;
  customerName: string;
  points: number;
  totalSpent: number;
  updatedAt: string;
};

const STORAGE_KEY = 'ayoubtech-loyalty';

function log(level: 'info' | 'warn' | 'error', msg: string, data?: any) {
  const prefix = `[Loyalty]`;
  const line = `${prefix} ${msg} ${data ? JSON.stringify(data) : ''}`;
  if (level === 'info') console.log(line);
  else if (level === 'warn') console.warn(line);
  else console.error(line);
}

function getAllRaw(): LoyaltyRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAllRaw(records: LoyaltyRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function getLoyalty(phone: string): LoyaltyRecord | null {
  const records = getAllRaw();
  return records.find(r => r.customerPhone === phone) ?? null;
}

export function getAllLoyalty(): LoyaltyRecord[] {
  return getAllRaw();
}

export function addPoints(phone: string, name: string, amount: number): LoyaltyRecord {
  const points = Math.floor(amount / 100);
  const records = getAllRaw();
  let record = records.find(r => r.customerPhone === phone);

  if (record) {
    record.points += points;
    record.totalSpent += amount;
    record.customerName = name;
    record.updatedAt = new Date().toISOString();
  } else {
    record = {
      customerPhone: phone,
      customerName: name,
      points,
      totalSpent: amount,
      updatedAt: new Date().toISOString(),
    };
    records.push(record);
  }

  saveAllRaw(records);
  log('info', `Added ${points} points for ${phone} (total: ${record.points})`);

  api.loyalty.addPoints(phone, name, amount)
    .then(() => log('info', `Points synced to server for ${phone}`))
    .catch((err: any) => log('warn', `Failed to sync points to server`, err?.message));

  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  return record;
}

export function redeemPoints(phone: string, points: number): { success: boolean; discount: number } {
  const records = getAllRaw();
  const record = records.find(r => r.customerPhone === phone);

  if (!record || record.points < points) {
    log('warn', `Insufficient points for ${phone}: has ${record?.points ?? 0}, needs ${points}`);
    return { success: false, discount: 0 };
  }

  const discount = points;
  record.points -= points;
  record.updatedAt = new Date().toISOString();
  saveAllRaw(records);
  log('info', `Redeemed ${points} points for ${phone} (discount: ${discount} DZD)`);

  api.loyalty.redeem(phone, points)
    .then(() => log('info', `Redemption synced to server for ${phone}`))
    .catch((err: any) => log('warn', `Failed to sync redemption to server`, err?.message));

  window.dispatchEvent(new CustomEvent('aos:data-changed'));
  return { success: true, discount };
}

export function clearLoyalty() {
  if (typeof window === 'undefined') return [];
  localStorage.removeItem(STORAGE_KEY);
  log('info', 'Cleared all loyalty records');
  return [];
}

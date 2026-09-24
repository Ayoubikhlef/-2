const ORDER_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfoyIiDJPB_SwCbjJ1aZehvsoqci8HooeS0SB8tgCuoc6Y1uw/viewform';

const FORM_RESPONSE_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfoyIiDJPB_SwCbjJ1aZehvsoqci8HooeS0SB8tgCuoc6Y1uw/formResponse';

const ENTRY = {
  name: 'entry.1160619647',
  phone: 'entry.1957563317',
  product: 'entry.1740067769',
  quantity: 'entry.1396747120',
  address: 'entry.1104176477',
  notes: 'entry.627585486',
  email: 'entry.1437699221',
  wilaya: 'entry.1873619564',
  total: 'entry.975354422',
  payment: 'entry.1221188104',
} as const;

const PAYMENT_CASH = 'الدفع عند الاستلام';

export type OrderFormPrefill = {
  name?: string;
  phone?: string;
  product?: string;
  quantity?: number | string;
  address?: string;
  notes?: string;
  email?: string;
  wilaya?: string;
  total?: number | string;
  payment?: string;
};

function applyPrefill(params: URLSearchParams, prefill: OrderFormPrefill): void {
  if (prefill.name?.trim()) params.set(ENTRY.name, prefill.name.trim());
  if (prefill.phone?.trim()) params.set(ENTRY.phone, prefill.phone.trim());
  if (prefill.product?.trim()) params.set(ENTRY.product, prefill.product.trim());
  if (prefill.quantity !== undefined && prefill.quantity !== '') {
    params.set(ENTRY.quantity, String(prefill.quantity));
  }
  if (prefill.address?.trim()) params.set(ENTRY.address, prefill.address.trim());
  if (prefill.notes?.trim()) params.set(ENTRY.notes, prefill.notes.trim());
  if (prefill.email?.trim()) params.set(ENTRY.email, prefill.email.trim());
  if (prefill.wilaya?.trim()) params.set(ENTRY.wilaya, prefill.wilaya.trim());
  if (prefill.total !== undefined && prefill.total !== '') {
    params.set(ENTRY.total, String(prefill.total));
  }
  params.set(ENTRY.payment, prefill.payment?.trim() || PAYMENT_CASH);
}

export function buildOrderFormUrl(prefill: OrderFormPrefill = {}): string {
  const params = new URLSearchParams();
  applyPrefill(params, prefill);
  const query = params.toString();
  return query ? `${ORDER_FORM_URL}?${query}` : ORDER_FORM_URL;
}

export function openOrderForm(prefill: OrderFormPrefill = {}): void {
  window.open(buildOrderFormUrl(prefill), '_blank', 'noopener,noreferrer');
}

export async function submitOrderToSheet(prefill: OrderFormPrefill = {}): Promise<void> {
  const body = new URLSearchParams();
  body.set(ENTRY.name, prefill.name?.trim() || '-');
  body.set(ENTRY.phone, prefill.phone?.trim() || '-');
  body.set(ENTRY.product, prefill.product?.trim() || '-');
  body.set(ENTRY.quantity, String(prefill.quantity ?? 1));
  body.set(ENTRY.address, prefill.address?.trim() || '-');
  body.set(ENTRY.notes, prefill.notes?.trim() || '-');
  if (prefill.email?.trim()) body.set(ENTRY.email, prefill.email.trim());
  if (prefill.wilaya?.trim()) body.set(ENTRY.wilaya, prefill.wilaya.trim());
  if (prefill.total !== undefined && prefill.total !== '') {
    body.set(ENTRY.total, String(prefill.total));
  }
  body.set(ENTRY.payment, prefill.payment?.trim() || PAYMENT_CASH);

  try {
    await fetch(FORM_RESPONSE_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  } catch (err) {
    console.warn('[googleForm] submitOrderToSheet failed:', err);
  }
}

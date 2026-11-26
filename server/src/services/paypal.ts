/**
 * PayPal checkout for subscription payments.
 *
 * The store prices are in DZD and PayPal accounts in Algeria generally settle
 * in USD, so `PAYPAL_USD_RATE` (1 USD = N DZD) converts the plan price. Set it
 * to the rate your accountant uses; the sandbox works with any value.
 *
 * No SDK or browser script is needed: the server creates an order, the
 * customer approves it on paypal.com, and the server captures it on return.
 * The signed webhook is the source of truth when the browser never comes back.
 */

const API =
  process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const clientId = () => (process.env.PAYPAL_CLIENT_ID || '').trim();
const secret = () => (process.env.PAYPAL_SECRET || '').trim();

export function isPaypalConfigured(): boolean {
  return Boolean(clientId() && secret());
}

function usdRate(): number {
  const rate = Number(process.env.PAYPAL_USD_RATE || 0);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

export function paypalAmountDzdToUsd(dzd: number): string {
  const rate = usdRate();
  const value = rate ? Number(dzd) / rate : 0;
  return Number.isFinite(value) && value > 0 ? value.toFixed(2) : '';
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;
  const basic = Buffer.from(`${clientId()}:${secret()}`).toString('base64');
  const res = await fetch(`${API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok || !body?.access_token) {
    throw new Error(`PayPal token failed (${res.status}): ${JSON.stringify(body?.error_description || body?.error || '')}`);
  }
  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + (Number(body.expires_in) || 3600) * 1000,
  };
  return cachedToken.value;
}

async function paypal<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const body: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = Array.isArray(body?.details)
      ? body.details.map((d: any) => d.description || d.issue).join('; ')
      : body?.message || '';
    throw new Error(`PayPal ${res.status}: ${detail || JSON.stringify(body).slice(0, 200)}`);
  }
  return body as T;
}

export async function createPaypalOrder(input: {
  amountUsd: string;
  reference: string;
  paymentId?: string;
  returnUrl: string;
  cancelUrl: string;
  /** Optional overrides used by non-subscription checkouts. */
  customId?: string;
  description?: string;
}): Promise<{ id: string; approveUrl: string }> {
  const order: any = await paypal('/v2/checkout/orders', {
    method: 'POST',
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: input.reference,
          description: input.description || `AOS Tech Store subscription ${input.reference}`,
          custom_id: input.customId || input.paymentId || input.reference,
          amount: { currency_code: 'USD', value: input.amountUsd },
        },
      ],
      application_context: {
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
        brand_name: 'AOS Tech Store',
        user_action: 'PAY_NOW',
      },
    }),
  });
  const approve = Array.isArray(order?.links)
    ? order.links.find((link: any) => link.rel === 'approve')?.href
    : '';
  if (!order?.id || !approve) throw new Error('PayPal order response is missing the approval link');
  return { id: order.id, approveUrl: approve };
}

export async function capturePaypalOrder(orderId: string): Promise<{ id: string; status: string; amountUsd: string }> {
  const capture: any = await paypal(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
  });
  const unit = capture?.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    id: String(unit?.id || capture?.id || ''),
    status: String(capture?.status || unit?.status || ''),
    amountUsd: String(unit?.amount?.value || ''),
  };
}

export async function verifyPaypalWebhook(headers: any, rawBody: Buffer | string): Promise<boolean> {
  const webhookId = (process.env.PAYPAL_WEBHOOK_ID || '').trim();
  if (!webhookId) return false;
  const value: any = await paypal('/v1/notifications/verify-webhook-signature', {
    method: 'POST',
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'],
      cert_url: headers['paypal-cert-url'],
      transmission_id: headers['paypal-transmission-id'],
      transmission_sig: headers['paypal-transmission-sig'],
      transmission_time: headers['paypal-transmission-time'],
      webhook_id: webhookId,
      webhook_event: typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(rawBody.toString('utf8')),
    }),
  });
  return value?.verification_status === 'SUCCESS';
}

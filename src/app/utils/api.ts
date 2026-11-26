const isDev = import.meta.env.DEV;

const PRIMARY_URL: string = isDev && typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
  : '/api';
const FALLBACK_URLS: string[] = [];

// The access token lives only in memory. Persisting it to localStorage meant
// any XSS could read a long-lived credential; the HttpOnly refresh cookie now
// restores the session after a reload instead.
let accessToken: string | null = null;

if (typeof localStorage !== 'undefined') {
  try {
    localStorage.removeItem('aos_access_token');
  } catch {
    /* storage can be unavailable in private mode */
  }
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token || null;
}

export function getStoredUser(): any | null {
  const raw = localStorage.getItem('aos_user');
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: any | null) {
  if (user) localStorage.setItem('aos_user', JSON.stringify(user));
  else localStorage.removeItem('aos_user');
}

const SESSION_MARKER = 'aos_session';

/**
 * The refresh token is HttpOnly, so JavaScript cannot see it. This readable,
 * non-sensitive marker tells the storefront that a session may exist and that
 * calling /auth/refresh is worthwhile (for example after an OAuth redirect).
 */
export function hasSessionMarker(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie
    .split(';')
    .some((entry) => entry.trim() === `${SESSION_MARKER}=1`);
}

export function clearSessionMarker() {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_MARKER}=; Max-Age=0; path=/; SameSite=Lax`;
}

function getUrls(path: string): string[] {
  const urls = [PRIMARY_URL];
  if (PRIMARY_URL === '/api') {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    urls[0] = `${origin}/api`;
    urls.push(...FALLBACK_URLS.filter(u => !u.startsWith('/')));
  }
  return urls.map(base => `${base}${path}`);
}

/**
 * Absolute URL for a path that already starts with `/api` (for example the
 * preview URL returned by the website factory). Keeps localhost development
 * pointing at the API port instead of the Vite dev server.
 */
export function resolveApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const base = PRIMARY_URL === '/api'
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api`
    : PRIMARY_URL;
  const origin = base.replace(/\/api\/?$/i, '');
  return `${origin}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Absolute URL for a top-level browser navigation to the API (OAuth start).
 * Keeps the provider redirect on the same origin as the session cookies.
 */
export function apiUrl(path: string): string {
  const base = PRIMARY_URL === '/api'
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/api`
    : PRIMARY_URL;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retryAuth = true,
  timeoutMs = 20000
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const urls = getUrls(path);
  let lastError: Error | null = null;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      if (isDev) console.log(`[API] ${options.method || 'GET'} ${url} (attempt ${i + 1}/${urls.length})`);
      const res = await fetch(url, { ...options, headers, credentials: 'include', signal: controller.signal });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const message = body.error || body.details?.[0]?.message || `Request failed (${res.status})`;
        const error: any = new Error(message);
        error.status = res.status;
        error.code = body.code;
        error.details = body.details;
        // Auto-refresh once on expired token (admin polling on mobile/Safari).
        if (res.status === 401 && retryAuth && path !== '/auth/refresh' && path !== '/auth/login') {
          clearTimeout(timeout);
          const refreshed = await refreshToken();
          if (refreshed) {
            return request<T>(path, options, false);
          }
        }
        throw error;
      }
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('json')) {
        // A dev/preview server without an API proxy can answer /api with the
        // SPA HTML. Treat that as a server error instead of a JSON parse crash.
        const error: any = new Error(`Unexpected response (${res.status})`);
        error.status = res.status >= 500 ? res.status : 502;
        throw error;
      }
      return res.json();
    } catch (err: any) {
      lastError = err;
      // HTTP error statuses are definitive — no point trying another URL.
      if (err?.status && err.status < 500) break;
      if (i < urls.length - 1 && isDev) {
        console.warn(`[API] Attempt ${i + 1} failed, trying next URL`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error('All API URLs failed');
}

/**
 * Binary downloads cannot go through request(), which always parses JSON.
 * The access token still travels in the Authorization header, never in the
 * URL, and an expired token is refreshed once just like a JSON request.
 */
async function requestBlob(
  path: string,
  options: RequestInit = {},
  retryAuth = true
): Promise<{ blob: Blob; filename: string }> {
  const token = getAccessToken();
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(getUrls(path)[0], {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && retryAuth) {
    const refreshed = await refreshToken();
    if (refreshed) return requestBlob(path, options, false);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const error: any = new Error(body.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  const disposition = response.headers.get('content-disposition') || '';
  const filename = /filename="?([^";]+)"?/i.exec(disposition)?.[1] || 'aos-backup.enc';
  return { blob: await response.blob(), filename };
}

export async function refreshToken(): Promise<{
  user: any;
  accessToken: string;
} | null> {
  if ((refreshToken as any)._inFlight) return null;
  (refreshToken as any)._inFlight = true;
  try {
    const data = await request<any>('/auth/refresh', { method: 'POST' }, false);
    setAccessToken(data.accessToken);
    setStoredUser(data.user);
    return data;
  } catch (err: any) {
    // Only clear the session when the server explicitly rejects the refresh.
    // Network/5xx must not wipe a valid local session (mobile flakiness).
    if (err?.status && err.status >= 400 && err.status < 500) {
      setAccessToken(null);
      setStoredUser(null);
      clearSessionMarker();
    }
    return null;
  } finally {
    (refreshToken as any)._inFlight = false;
  }
}

export type LoginResponse =
  | { user: any; accessToken: string; twoFactorRequired?: false; twoFactorSetupRequired?: false }
  | { twoFactorRequired: true; challengeToken: string }
  | {
      twoFactorSetupRequired: true;
      challengeToken: string;
      user: { email: string; name: string };
    };

export type CustomerAddress = {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  wilaya: string;
  municipality: string;
  address: string;
  isDefault: boolean;
  createdAt: string;
};

export type CustomerOrderSummary = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  wilaya: string;
  municipality: string;
  customer: string;
  phone: string;
  email: string | null;
  items: { name: string; quantity: number; price: number }[];
};

export type CustomerFlag = {
  key: string;
  userId: string | null;
  phone: string | null;
  email: string | null;
  name: string | null;
  blocked: boolean;
  reason: string | null;
  note: string | null;
  updatedAt: string;
};

export type CustomerFlagUpdate = {
  accountId?: string;
  phone?: string;
  email?: string;
  name?: string;
  blocked?: boolean;
  reason?: string | null;
  note?: string | null;
};

export type CustomerAccount = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  emailVerified: boolean;
  isActive: boolean;
  twoFactorEnabled: boolean;
  isLocked: boolean;
  blocked: boolean;
  blockReason: string | null;
  note: string | null;
  flagKey: string;
  failedLoginAttempts: number;
  lastActivityAt: string | null;
  createdAt: string;
  addresses: CustomerAddress[];
  ordersCount: number;
  cancelledCount: number;
  completedCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
  orderIds: string[];
  orders: CustomerOrderSummary[];
};

export type CustomerListResponse = {
  customers: CustomerAccount[];
  flags: CustomerFlag[];
  totals: { accounts: number; matchedOrders: number; blocked: number };
};

/** All ids accepted by /api/ai/generate. */
export type AiTool =
  | 'cv'
  | 'post'
  | 'product'
  | 'product-check'
  | 'offer-maker'
  | 'competitor'
  | 'plan'
  | 'ad-copy'
  | 'product-page'
  | 'landing-page'
  | 'video-script'
  | 'customer-reply'
  | 'order-confirmation'
  | 'ad-image-review'
  | 'page-review'
  | 'campaign-doctor'
  | 'site-copy';

/** The three tools embedded in the AI Studio section. */
export type AiStudioTool = Extract<AiTool, 'cv' | 'post' | 'product'>;
export type AiStudioLanguage = 'ar' | 'fr' | 'en';

export type AiStudioResult = {
  text: string;
  tool: AiTool;
  language: AiStudioLanguage;
  /** True when the server answered from AI_MOCK instead of a provider. */
  mock?: boolean;
  /** Server-side free previews left while the account has no subscription. */
  previewRemaining?: number | null;
  subscribed?: boolean;
};

/** Structured copy returned by the website-factory auto-fill tool. */
export type SiteCopyService = { title: string; description: string };
export type SiteCopyProduct = { name: string; description: string; category: string };
export type SiteCopyData = {
  tagline: string;
  description: string;
  services: SiteCopyService[];
  products: SiteCopyProduct[];
};

export type SiteCopyResult = {
  data: SiteCopyData;
  mock?: boolean;
  previewRemaining?: number | null;
};

/* ------------------------------------------------------------------ */
/* AI subscriptions                                                    */
/* ------------------------------------------------------------------ */

export type SubscriptionPlanId = 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionPaymentMethod = 'chargily' | 'paypal' | 'ccp' | 'baridimob';
export type LocalizedText = { ar: string; fr: string; en: string };

export type SubscriptionPlan = {
  id: SubscriptionPlanId;
  price: number;
  months: number;
  perMonth: number;
  popular: boolean;
  name: LocalizedText;
  tagline: LocalizedText;
  features: LocalizedText[];
};

export type SubscriptionPayment = {
  id: string;
  plan: SubscriptionPlanId;
  amount: number;
  method: SubscriptionPaymentMethod | 'admin';
  status: 'pending' | 'paid' | 'failed' | 'rejected' | 'expired';
  reference: string;
  checkoutUrl: string | null;
  note: string | null;
  hasProof: boolean;
  paidAt: string | null;
  createdAt: string;
};

export type SubscriptionMe = {
  subscription: {
    plan: SubscriptionPlanId;
    planName: LocalizedText;
    status: string;
    price: number;
    startsAt: string | null;
    endsAt: string | null;
    active: boolean;
  } | null;
  previews: { limit: number; used: number; remaining: number | null };
  payments: SubscriptionPayment[];
  chargily: boolean;
  paypal: boolean;
  plans: SubscriptionPlan[];
};

export type ManualPaymentDetails = {
  ownerName: string;
  ccp: string;
  ccpKey: string;
  baridimob: string;
  bankName: string;
  whatsapp: string;
  note: LocalizedText | string | null;
};

export type SubscriptionCheckoutResult = {
  mode: 'redirect' | 'manual';
  checkoutUrl?: string;
  payment: SubscriptionPayment;
  instructions?: ManualPaymentDetails;
};

export type SavedCalculationResult = {
  id: string;
  calc: string;
  label: string | null;
  values: Record<string, string>;
  createdAt: string;
};

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  auth: {
    // Registration only creates an unconfirmed account; the session starts
    // after the customer clicks the link in the confirmation email.
    register: (data: { email: string; password: string; name: string; phone?: string }) =>
      request<{ ok: boolean; message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resendVerification: (email: string) =>
      request<{ ok: boolean }>('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    login: (data: { email: string; password: string; twoFactorCode?: string; captchaToken?: string }) =>
      request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    twoFactorStart: (challengeToken: string) =>
      request<{ secret: string; otpauthUrl: string; issuer: string; account: string }>(
        '/auth/2fa/setup/start',
        { method: 'POST', body: JSON.stringify({ challengeToken }) }
      ),
    twoFactorConfirm: (data: { challengeToken: string; code: string }) =>
      request<{ ok: boolean; backupCodes: string[]; user: any; accessToken: string }>(
        '/auth/2fa/setup/confirm',
        { method: 'POST', body: JSON.stringify(data) }
      ),
    regenerateBackupCodes: (code: string) =>
      request<{ ok: boolean; backupCodes: string[] }>('/auth/2fa/backup-codes', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
    me: () => request<any>('/auth/me'),
    logout: () => request<any>('/auth/logout', { method: 'POST' }),
  },

  syncProducts: (products: any[]) =>
    request<{ ok: boolean; indexed: number }>('/products/sync', {
      method: 'POST',
      body: JSON.stringify({ products }),
    }),

  fetchProducts: () => request<{ products: any[] }>('/products'),

  visits: {
    // POST records this browser once per day (deduped on the server) and
    // returns the public totals in the same round trip.
    track: () =>
      request<{ visitors: number; today: number }>('/visits/track', {
        method: 'POST',
        body: JSON.stringify({}),
      }),
    stats: () => request<{ visitors: number; today: number }>('/visits/stats'),
  },

  ai: {
    status: () => request<{ available: boolean; mock: boolean }>('/ai/status', {}, true, 15000),
    generate: (data: {
      tool: AiTool;
      language: AiStudioLanguage;
      fields: Record<string, string>;
      /** Optional compressed image data URL (ad-image-review only). */
      image?: string;
    }) =>
      request<AiStudioResult>(
        '/ai/generate',
        { method: 'POST', body: JSON.stringify(data) },
        true,
        // Provider calls can take a few seconds; the server gives up at 25s.
        60000,
      ),
    /**
     * Website-factory auto-fill. Uses the same generator endpoint but its own
     * daily allowance, because it is part of the website order rather than a
     * standalone AI Studio preview.
     */
    siteCopy: (data: {
      language: AiStudioLanguage;
      siteName: string;
      activity: string;
      category?: string;
      template?: string;
      needs?: 'copy' | 'services' | 'products' | 'both';
    }) =>
      request<SiteCopyResult>(
        '/ai/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            tool: 'site-copy',
            language: data.language,
            fields: {
              siteName: data.siteName,
              activity: data.activity,
              category: data.category || '',
              template: data.template || '',
              needs: data.needs || 'copy',
            },
          }),
        },
        true,
        60000,
      ),
  },

  subscription: {
    plans: () =>
      request<{
        plans: SubscriptionPlan[];
        currency: string;
        chargily: boolean;
        paypal: boolean;
        previews: { limit: number };
      }>('/subscription/plans'),
    me: () => request<SubscriptionMe>('/subscription/me', {}, true, 25000),
    checkout: (data: { plan: SubscriptionPlanId; method: SubscriptionPaymentMethod }) =>
      request<SubscriptionCheckoutResult>('/subscription/checkout', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    proof: (paymentId: string, data: { proof?: string; note?: string }) =>
      request<{ ok: boolean; payment: SubscriptionPayment }>(
        `/subscription/payments/${encodeURIComponent(paymentId)}/proof`,
        { method: 'POST', body: JSON.stringify(data) },
        true,
        30000,
      ),
    admin: {
      payments: (status?: string) =>
        request<any>(
          `/subscription/admin/payments${status ? `?status=${encodeURIComponent(status)}` : ''}`,
        ),
      confirm: (id: string) =>
        request<any>(`/subscription/admin/payments/${encodeURIComponent(id)}/confirm`, {
          method: 'POST',
        }),
      reject: (id: string) =>
        request<any>(`/subscription/admin/payments/${encodeURIComponent(id)}/reject`, {
          method: 'POST',
        }),
      grant: (data: { email: string; plan: SubscriptionPlanId }) =>
        request<any>('/subscription/admin/grant', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      subscriptions: () => request<any>('/subscription/admin/subscriptions'),
      cancel: (userId: string) =>
        request<any>(`/subscription/admin/subscriptions/${encodeURIComponent(userId)}/cancel`, {
          method: 'POST',
        }),
    },
  },

  calculator: {
    list: () =>
      request<{ results: SavedCalculationResult[]; limit: number }>('/calculator/results'),
    save: (data: { calc: string; values: Record<string, string>; label?: string }) =>
      request<{ result: SavedCalculationResult }>('/calculator/results', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    remove: (id: string) =>
      request<{ ok: boolean }>(`/calculator/results/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }),
  },

  data: {
    save: (key: string, value: any) =>
      request<{ ok: boolean }>('/data/save', { method: 'POST', body: JSON.stringify({ key, value }) }),
    get: (key: string) =>
      request<{ value: any }>(`/data/${encodeURIComponent(key)}`),
    delete: (key: string) =>
      request<{ deleted: boolean }>(`/data/${encodeURIComponent(key)}`, { method: 'DELETE' }),
    updateProductStock: (id: number, delta: number) =>
      request<{ id: number; stock: number }>('/data/products/stock', {
        method: 'POST',
        body: JSON.stringify({ id, delta }),
      }),
  },

  newsletter: {
    subscribe: (email: string) => request<{ ok: boolean }>('/newsletter', { method: 'POST', body: JSON.stringify({ email }) }),
  },

  contact: {
    list: (status?: string) =>
      request<{ messages: any[]; unread: number }>(`/contact${status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : ''}`),
    update: (id: string, status: 'new' | 'read' | 'replied') =>
      request<any>(`/contact/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    remove: (id: string) =>
      request<{ deleted: boolean }>(`/contact/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },

  email: {
    send: (data: { subject: string; body: string; testEmail?: string }) =>
      request<{ sent: boolean; count?: number; mode?: string }>('/email/send', { method: 'POST', body: JSON.stringify(data) }),
    configStatus: () => request<{ configured: boolean }>('/email/config-status'),
  },

  security: {
    events: (limit = 100) => request<any>(`/security/events?limit=${encodeURIComponent(String(limit))}`),
    status: () => request<any>('/security/status'),
    testAlert: () =>
      request<{
        ok: boolean;
        channels: { telegram: boolean; discord: boolean; email: boolean };
        emailError?: string | null;
      }>('/security/test-alert', { method: 'POST' }),
    block: (ip: string, minutes = 60, reason?: string) =>
      request<{ ok: boolean }>('/security/block', { method: 'POST', body: JSON.stringify({ ip, minutes, reason }) }),
    unblock: (ip: string) => request<{ ok: boolean }>(`/security/block/${encodeURIComponent(ip)}`, { method: 'DELETE' }),
  },

  snapshots: {
    status: () => request<any>('/snapshots/status'),
    download: () => requestBlob('/snapshots/download', { method: 'POST' }),
    run: () => request<any>('/snapshots/run', { method: 'POST' }),
  },

  orders: {
    create: (data: any) =>
      request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    list: (params?: { email?: string; phone?: string }) => {
      const hasParams = params && (params.email || params.phone);
      const query = hasParams ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
      const path = hasParams ? `/orders/user${query}` : '/orders';
      return request<any[]>(path);
    },
    updateStatus: (id: string, status: string) =>
      request<any>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    remove: async (id: string) => {
      return request<{ deleted: boolean }>('/orders/delete', {
        method: 'POST',
        body: JSON.stringify({ id }),
      });
    },
    clearAll: () => request<{ deleted: boolean; count: number }>('/orders/clear-all', { method: 'POST' }),
  },

  customers: {
    list: (search?: string) =>
      request<CustomerListResponse>(
        `/customers${search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`
      ),
    updateFlag: (data: CustomerFlagUpdate) =>
      request<{ flag: CustomerFlag }>('/customers/flag', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  reviews: {
    list: (productId: number) => request<any[]>(`/reviews/${productId}`),
    create: (data: { productId: number; name: string; rating: number; comment: string; website?: string }) =>
      request<{ ok: boolean; pending: boolean; id?: string }>('/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    adminList: () => request<any[]>('/reviews/admin/all'),
    setApproved: (id: string, approved: boolean) =>
      request<any>(`/reviews/admin/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ approved }),
      }),
    remove: (id: string) =>
      request<{ deleted: boolean }>(`/reviews/admin/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  },

  loyalty: {
    get: (phone: string) => request<any>(`/loyalty/${encodeURIComponent(phone)}`),
    addPoints: (phone: string, name: string, amount: number) => request<any>('/loyalty/add', { method: 'POST', body: JSON.stringify({ phone, name, amount }) }),
    redeem: (phone: string, points: number) => request<{ success: boolean; discount: number }>('/loyalty/redeem', { method: 'POST', body: JSON.stringify({ phone, points }) }),
  },

  payment: {
    init: (data: { orderId: string; method: 'cib' | 'edahabia' | 'baridimob' | 'cod'; phone?: string }) =>
      request<{ success: boolean; paymentId: string; amount: number; method: string; instructions: string }>('/payment/init', { method: 'POST', body: JSON.stringify(data) }),
    confirm: (data: { paymentId: string }) =>
      request<{ success: boolean; status: string }>('/payment/confirm', { method: 'POST', body: JSON.stringify(data) }),
  },

  /** PayPal redirect checkout for store orders and site-factory deposits. */
  paypal: {
    config: () => request<{ paypal: boolean }>('/paypal/config', {}, true, 15000),
    checkout: (data: { kind: 'order' | 'site'; ref: string }) =>
      request<{ mode: 'redirect'; checkoutUrl: string; reference: string }>('/paypal/checkout', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  siteFactory: {
    config: () =>
      request<{
        templates: any[];
        packages: any[];
        settings: any;
        cloudflareConfigured: boolean;
        paypal: boolean;
      }>('/site-factory/public/config', {}, true, 60000),
    checkSubdomain: (name: string) =>
      request<{
        available: boolean;
        normalized: string;
        reason?: string;
        message?: string;
        suggestions: string[];
      }>(`/site-factory/public/subdomain/${encodeURIComponent(name)}`, {}, true, 30000),
    createRequest: (data: any) =>
      request<{
        request: any;
        siteId: string;
        previewUrl: string;
        ref: string;
        subdomain: string;
        adminLink?: string;
        status: string;
        price: number;
      }>('/site-factory/public/requests', { method: 'POST', body: JSON.stringify(data) }, true, 90000),
    track: (ref: string, contact: string) =>
      request<any>(
        `/site-factory/public/requests/${encodeURIComponent(ref)}?contact=${encodeURIComponent(contact)}`,
        {},
        true,
        60000,
      ),
    /** Get a fresh dashboard claim link if the customer lost the first one. */
    regenerateAdminLink: (ref: string, contact: string) =>
      request<{ adminLink: string }>(
        `/site-factory/public/requests/${encodeURIComponent(ref)}/admin-link`,
        { method: 'POST', body: JSON.stringify({ contact }) },
        true,
        60000,
      ),
    uploadReceipt: (ref: string, data: { contact: string; receipt: string; name?: string }) =>
      request<{ ok: boolean; status: string }>(
        `/site-factory/public/requests/${encodeURIComponent(ref)}/receipt`,
        { method: 'POST', body: JSON.stringify(data) },
        true,
        90000,
      ),

    admin: {
      /** Create or renew the single-use sign-in link for a generated site. */
      adminLink: (id: string) =>
        request<{ ok: boolean; link: string }>(
          `/site-factory/admin/sites/${encodeURIComponent(id)}/admin-link`,
          { method: 'POST' },
        ),
      /** Hide or show every product section on a generated site. */
      setVisibility: (id: string, hideProducts: boolean) =>
        request<{ ok: boolean; hideProducts: boolean }>(
          `/site-factory/admin/sites/${encodeURIComponent(id)}/visibility`,
          { method: 'PATCH', body: JSON.stringify({ hideProducts }) },
        ),
      stats: () => request<any>('/site-factory/admin/stats'),
      requests: (params: { status?: string; q?: string; page?: number; pageSize?: number } = {}) => {
        const query = new URLSearchParams();
        if (params.status && params.status !== 'all') query.set('status', params.status);
        if (params.q) query.set('q', params.q);
        if (params.page) query.set('page', String(params.page));
        if (params.pageSize) query.set('pageSize', String(params.pageSize));
        const suffix = query.toString() ? `?${query.toString()}` : '';
        return request<any>(`/site-factory/admin/requests${suffix}`);
      },
      request: (id: string) => request<any>(`/site-factory/admin/requests/${encodeURIComponent(id)}`),
      setStatus: (id: string, status: string, note?: string) =>
        request<any>(`/site-factory/admin/requests/${encodeURIComponent(id)}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status, note }),
        }),
      deleteRequest: (id: string) =>
        request<any>(`/site-factory/admin/requests/${encodeURIComponent(id)}`, { method: 'DELETE' }),
      sites: () => request<{ sites: any[] }>('/site-factory/admin/sites'),
      publish: (id: string) =>
        request<any>(`/site-factory/admin/sites/${encodeURIComponent(id)}/publish`, { method: 'POST' }, true, 120000),
      markPublished: (id: string, url?: string) =>
        request<any>(`/site-factory/admin/sites/${encodeURIComponent(id)}/mark-published`, {
          method: 'POST',
          body: JSON.stringify({ url }),
        }),
      siteStatus: (id: string, status: 'published' | 'suspended' | 'preview') =>
        request<any>(`/site-factory/admin/sites/${encodeURIComponent(id)}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status }),
        }),
      regenerate: (id: string) =>
        request<any>(`/site-factory/admin/sites/${encodeURIComponent(id)}/regenerate`, { method: 'POST' }, true, 60000),
      zipUrl: (id: string) => getUrls(`/site-factory/admin/sites/${encodeURIComponent(id)}/zip`)[0],
      templates: () => request<{ templates: any[] }>('/site-factory/admin/templates'),
      updateTemplate: (id: string, data: any) =>
        request<any>(`/site-factory/admin/templates/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      packages: () => request<{ packages: any[] }>('/site-factory/admin/packages'),
      createPackage: (data: any) =>
        request<any>('/site-factory/admin/packages', { method: 'POST', body: JSON.stringify(data) }),
      updatePackage: (id: string, data: any) =>
        request<any>(`/site-factory/admin/packages/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
        }),
      settings: () =>
        request<{ settings: any; cloudflareConfigured: boolean }>('/site-factory/admin/settings'),
      saveSettings: (data: any) =>
        request<{ ok: boolean; settings: any }>('/site-factory/admin/settings', {
          method: 'PUT',
          body: JSON.stringify(data),
        }),
    },
  },
};

/* -------------------------------------------------------------------------
 * Site-owner dashboard
 * ---------------------------------------------------------------------- */

/**
 * The owner dashboard authenticates with an HttpOnly cookie, not the store's
 * in-memory access token. It must never trigger the automatic token refresh
 * used by the main API client.
 */
async function siteAdminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = getUrls(path)[0];
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error: any = new Error(body.error || `Request failed (${res.status})`);
    error.status = res.status;
    throw error;
  }
  return body as T;
}

export interface SiteAdminInfo {
  id: string;
  name: string;
  subdomain: string;
  status: string;
  url: string;
  ref: string;
  requestStatus: string;
  phone: string;
  email: string;
}

export const siteAdminApi = {
  me: () => siteAdminRequest<{ site: SiteAdminInfo }>('/site-admin/me'),
  logout: () => siteAdminRequest<{ ok: boolean }>('/site-admin/logout', { method: 'POST' }),
  orders: () => siteAdminRequest<{ orders: any[] }>('/site-admin/orders'),
  setOrderStatus: (id: string, status: string) =>
    siteAdminRequest<{ ok: boolean }>(`/site-admin/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  leads: () => siteAdminRequest<{ leads: any[] }>('/site-admin/leads'),
  products: () => siteAdminRequest<{ products: any[] }>('/site-admin/products'),
  saveProduct: (data: any, id?: string) =>
    siteAdminRequest<{ product?: any; ok?: boolean }>(
      id ? `/site-admin/products/${encodeURIComponent(id)}` : '/site-admin/products',
      { method: id ? 'PATCH' : 'POST', body: JSON.stringify(data) },
    ),
  deleteProduct: (id: string) =>
    siteAdminRequest<{ ok: boolean }>(`/site-admin/products/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  content: () => siteAdminRequest<{ content: any }>('/site-admin/content'),
  saveContent: (data: any) =>
    siteAdminRequest<{ ok: boolean; message: string }>('/site-admin/content', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  publish: () =>
    siteAdminRequest<{ ok: boolean; url?: string; message?: string }>('/site-admin/publish', {
      method: 'POST',
    }),
};

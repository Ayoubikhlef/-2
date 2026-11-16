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
    login: (data: { email: string; password: string; twoFactorCode?: string }) =>
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

  siteFactory: {
    config: () =>
      request<{
        templates: any[];
        packages: any[];
        settings: any;
        cloudflareConfigured: boolean;
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
    uploadReceipt: (ref: string, data: { contact: string; receipt: string; name?: string }) =>
      request<{ ok: boolean; status: string }>(
        `/site-factory/public/requests/${encodeURIComponent(ref)}/receipt`,
        { method: 'POST', body: JSON.stringify(data) },
        true,
        90000,
      ),

    admin: {
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

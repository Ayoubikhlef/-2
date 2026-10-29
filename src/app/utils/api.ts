const isDev = import.meta.env.DEV;

const PRIMARY_URL: string = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
  : '/api';
const FALLBACK_URLS: string[] = [];

export function getAccessToken(): string | null {
  return localStorage.getItem('aos_access_token');
}

export function setAccessToken(token: string | null) {
  if (token) localStorage.setItem('aos_access_token', token);
  else localStorage.removeItem('aos_access_token');
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

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  auth: {
    register: (data: { email: string; password: string; name: string; phone?: string }) =>
      request<{ user: any; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ user: any; accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
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
  },

  newsletter: {
    subscribe: (email: string) => request<{ ok: boolean }>('/newsletter', { method: 'POST', body: JSON.stringify({ email }) }),
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
    create: (data: any) => request<any>('/reviews', { method: 'POST', body: JSON.stringify(data) }),
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

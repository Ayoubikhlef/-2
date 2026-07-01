const BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getAccessToken(): string | null {
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

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const url = `${BASE_URL}${path}`;
  console.log(`[API] ${options.method || 'GET'} ${url}`);

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json();
}

export async function refreshToken(): Promise<{
  user: any;
  accessToken: string;
} | null> {
  try {
    const data = await request<any>('/auth/refresh', { method: 'POST' });
    setAccessToken(data.accessToken);
    setStoredUser(data.user);
    return data;
  } catch {
    setAccessToken(null);
    setStoredUser(null);
    return null;
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

  orders: {
    create: (data: any) =>
      request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
    list: () => request<any[]>('/orders'),
    updateStatus: (id: string, status: string) =>
      request<any>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    remove: (id: string) =>
      request<{ deleted: boolean }>(`/orders/${id}/delete`, { method: 'POST' }),
  },
};

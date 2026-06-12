const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api';

function getToken(): string | null {
  return localStorage.getItem('cashcatcher_token');
}

export function setToken(t: string) { localStorage.setItem('cashcatcher_token', t); }
export function clearToken() { localStorage.removeItem('cashcatcher_token'); }

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  console.log('REQUEST BODY BEING SENT:', JSON.stringify(body));

  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) { clearToken(); window.location.reload(); }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data as T;
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (name: string, email: string, password: string) =>
      request<{ user: ApiUser; token: string }>('POST', '/register', { name, email, password }),

  login: (email: string, password: string) =>
      request<{ user: ApiUser; token: string }>('POST', '/login', { email, password }),

  logout: () => request<{ message: string }>('POST', '/logout'),

  me: () => request<{ user: ApiUser }>('GET', '/me'),

  updateSettings: (s: { currency?: string; language?: string; dark_mode?: boolean }) =>
      request<{ user: ApiUser }>('PATCH', '/settings', s),

  forgotPassword: (email: string) =>
      request<{ message: string }>('POST', '/forgot-password', { email }),

  resetPassword: (token: string, email: string, password: string, password_confirmation: string) =>
      request<{ message: string }>('POST', '/reset-password', { token, email, password, password_confirmation }),
};

// ── Transactions ──────────────────────────────────────────────
export const txApi = {
  list: (params?: Record<string, string>) => {
    const qs = params && Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ data: ApiTransaction[] }>('GET', `/transactions${qs}`);
  },
  create: (d: Omit<ApiTransaction, 'id' | 'category'>) =>
      request<{ data: ApiTransaction }>('POST', '/transactions', d),
  update: (id: string, d: Partial<ApiTransaction>) =>
      request<{ data: ApiTransaction }>('PATCH', `/transactions/${id}`, d),
  delete: (id: string) => request<{ message: string }>('DELETE', `/transactions/${id}`),
  bulkDelete: (ids: string[]) => request<{ message: string }>('DELETE', '/transactions', { ids }),
};

// ── Categories ────────────────────────────────────────────────
export const catApi = {
  list: () => request<{ data: ApiCategory[] }>('GET', '/categories'),
  create: (d: Omit<ApiCategory, 'id'>) => request<{ data: ApiCategory }>('POST', '/categories', d),
  update: (id: string, d: Partial<ApiCategory>) =>
      request<{ data: ApiCategory }>('PATCH', `/categories/${id}`, d),
  delete: (id: string) => request<{ message: string }>('DELETE', `/categories/${id}`),
};

// ── Budgets ───────────────────────────────────────────────────
export const budgetApi = {
  list: (month?: string) => {
    const qs = month ? `?month=${month}` : '';
    return request<{ data: ApiBudget[] }>('GET', `/budgets${qs}`);
  },
  upsert: (d: { category_id: string; amount: number; month: string }) =>
      request<{ data: ApiBudget }>('POST', '/budgets', d),
  delete: (id: string) => request<{ message: string }>('DELETE', `/budgets/${id}`),
};

// ── API types ─────────────────────────────────────────────────
export interface ApiUser {
  id: number;
  name: string;
  email: string;
}

export interface ApiTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id: string;
  category?: ApiCategory;
  date: string;
  recurring: boolean;
  recurring_interval?: 'daily' | 'weekly' | 'monthly';
}

export interface ApiCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export interface ApiBudget {
  id: string;
  category_id: string;
  amount: number;
  month: string;
}
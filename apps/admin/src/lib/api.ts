import axios from 'axios';

// Use /api/proxy/* so all requests go through Next.js server-side proxy.
// This eliminates CORS issues entirely — browser talks to same origin.
const PROXY_BASE = '/api/proxy';

export const api = axios.create({
  baseURL: PROXY_BASE,
  timeout: 60000, // 60s to allow Render cold start
});

api.interceptors.request.use(config => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ubike_admin_token') : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('ubike_admin_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export async function fetchDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data.data;
}

export async function fetchUsers(page = 1, limit = 20, role?: string) {
  const params: Record<string, unknown> = { page, limit };
  if (role) params.role = role;
  const { data } = await api.get('/admin/users', { params });
  return data;
}

export async function fetchRides(page = 1, limit = 20, status?: string) {
  const params: Record<string, unknown> = { page, limit };
  if (status) params.status = status;
  const { data } = await api.get('/admin/rides', { params });
  return data;
}

export async function fetchErrands(page = 1, limit = 20, status?: string) {
  const params: Record<string, unknown> = { page, limit };
  if (status) params.status = status;
  const { data } = await api.get('/admin/errands', { params });
  return data;
}

export async function fetchKyc(page = 1, status = 'pending') {
  const { data } = await api.get('/admin/kyc', { params: { page, status } });
  return data;
}

export async function approveKyc(userId: string) {
  const { data } = await api.patch(`/admin/kyc/${userId}/approve`);
  return data;
}

export async function rejectKyc(userId: string, reason: string) {
  const { data } = await api.patch(`/admin/kyc/${userId}/reject`, { reason });
  return data;
}

export async function suspendUser(userId: string) {
  const { data } = await api.patch(`/admin/users/${userId}/suspend`);
  return data;
}

export async function activateUser(userId: string) {
  const { data } = await api.patch(`/admin/users/${userId}/activate`);
  return data;
}

export async function fetchRevenue(from?: string, to?: string) {
  const { data } = await api.get('/admin/reports/revenue', { params: { from, to } });
  return data.data;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

interface AdminUser {
  id: string;
  email?: string;
  phone?: string;
  role: string;
}

interface AuthStore {
  user: AdminUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        const { tokens, user } = data.data;

        if (!['admin', 'super_admin'].includes(user.role)) {
          throw new Error('Insufficient permissions');
        }

        localStorage.setItem('ubike_admin_token', tokens.accessToken);
        set({ user, token: tokens.accessToken });
      },

      logout: () => {
        localStorage.removeItem('ubike_admin_token');
        set({ user: null, token: null });
      },
    }),
    { name: 'ubike-admin-auth', partialize: (state) => ({ user: state.user, token: state.token }) },
  ),
);

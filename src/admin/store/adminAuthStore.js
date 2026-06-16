import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAdminAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      login: (userData, token) => {
        set({ user: userData, token });
      },

      logout: () => {
        const token = get().token;
        set({ user: null, token: null });
        if (token) {
          fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          }).catch(() => {});
        }
      },

      get isAuthenticated() {
        return !!get().token;
      },
    }),
    {
      name: 'admin-auth-storage', // Separate from customer 'auth-storage'
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAdminAuthStore;

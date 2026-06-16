import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      error: null,

      login: (userData, token) => {
        set({ user: userData, token, error: null });
      },

      logout: () => {
        const token = get().token;
        set({ user: null, token: null, error: null });
        if (token) {
          fetch((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          }).catch(() => {});
        }
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      updateUser: (userData) => set({ user: { ...get().user, ...userData } }),

      get isAuthenticated() {
        return !!get().token;
      },

      get isAdmin() {
        return get().user?.role === 'admin';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;

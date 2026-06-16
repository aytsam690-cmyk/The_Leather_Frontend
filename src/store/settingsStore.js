import { create } from 'zustand';
import axios from 'axios';

const useSettingsStore = create((set) => ({
  settings: {
    siteName: 'Store',
    currency: 'USD',
    shippingCost: 0,
    freeShippingAbove: 0,
    contactInfo: {},
    socialLinks: [],
  },
  loading: false,
  error: null,
  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axios.get((import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/settings');
      set({ settings: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));

export default useSettingsStore;

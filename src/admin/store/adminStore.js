import { create } from 'zustand';

const useAdminStore = create((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

  notifications: [
    { id: 1, text: 'New order #ORD-8821 placed', time: '2 min ago', read: false },
    { id: 2, text: 'Product "Wireless Headphones" is low on stock', time: '15 min ago', read: false },
    { id: 3, text: 'Customer Sofia R. left a 5-star review', time: '1 hour ago', read: false },
    { id: 4, text: 'Coupon SAVE20 was used 10 times today', time: '3 hours ago', read: true },
    { id: 5, text: 'Monthly sales report is ready', time: '1 day ago', read: true },
  ],
  get unreadCount() {
    return get().notifications.filter((n) => !n.read).length;
  },
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  markRead: (id) =>
    set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),

  breadcrumbs: [{ label: 'Home', path: '/admin' }],
  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
}));

export default useAdminStore;

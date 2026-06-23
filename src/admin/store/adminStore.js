import { create } from 'zustand';
import { getRecentOrders, getLowStockProducts } from '../adminApi';

const useAdminStore = create((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),

  notifications: [],
  notificationsLoaded: false,
  get unreadCount() {
    return get().notifications.filter((n) => !n.read).length;
  },
  markAllRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  markRead: (id) =>
    set((s) => ({ notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n) })),

  // Fetch real notifications from API
  fetchNotifications: async () => {
    if (get().notificationsLoaded) return;
    try {
      const [orders, lowStock] = await Promise.allSettled([
        getRecentOrders(),
        getLowStockProducts(),
      ]);

      const notifs = [];
      let id = 1;

      // Recent orders (last 24 hours)
      if (orders.status === 'fulfilled' && orders.value) {
        const recentOrders = Array.isArray(orders.value) ? orders.value : (orders.value.orders || []);
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

        recentOrders.forEach((order) => {
          const orderDate = new Date(order.createdAt).getTime();
          if (orderDate > oneDayAgo) {
            const timeAgo = getTimeAgo(order.createdAt);
            const orderId = order.orderId || order._id?.slice(-6).toUpperCase();
            const total = order.totalAmount || order.total || 0;
            notifs.push({
              id: id++,
              text: `New order #${orderId} — Rs. ${total.toLocaleString()}`,
              time: timeAgo,
              read: false,
              type: 'order',
            });
          }
        });
      }

      // Low stock products
      if (lowStock.status === 'fulfilled' && lowStock.value) {
        const lowStockProducts = Array.isArray(lowStock.value) ? lowStock.value : (lowStock.value.products || []);
        lowStockProducts.forEach((product) => {
          notifs.push({
            id: id++,
            text: `"${product.name}" is low on stock (${product.stock} left)`,
            time: 'Now',
            read: false,
            type: 'stock',
          });
        });
      }

      // If no notifications, show a friendly message
      if (notifs.length === 0) {
        notifs.push({
          id: id++,
          text: 'No new notifications',
          time: 'Just now',
          read: true,
          type: 'info',
        });
      }

      set({ notifications: notifs, notificationsLoaded: true });
    } catch (err) {
      // Silently fail — keep empty notifications
      set({ notificationsLoaded: true });
    }
  },

  // Reset so next open fetches fresh data
  refreshNotifications: () => set({ notificationsLoaded: false, notifications: [] }),

  breadcrumbs: [{ label: 'Home', path: '/admin' }],
  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
}));

// Helper: convert ISO date to "X min ago" format
function getTimeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? 's' : ''} ago`;
  return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
}

export default useAdminStore;

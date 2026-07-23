import axios from 'axios';
import useAdminAuthStore from './store/adminAuthStore';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// JWT interceptor — reads token from Zustand persisted storage
adminApi.interceptors.request.use((config) => {
  const raw = localStorage.getItem('admin-auth-storage');
  if (raw) {
    try {
      const { state } = JSON.parse(raw);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    } catch (_) {}
  }
  return config;
});

// Response interceptor — try refresh on 401, then logout if refresh fails
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

adminApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return adminApi(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(
          (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/auth/refresh-token',
          {},
          { withCredentials: true }
        );
        const newToken = data.accessToken;
        useAdminAuthStore.getState().login(useAdminAuthStore.getState().user, newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return adminApi(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        useAdminAuthStore.getState().logout();
        window.location.href = '/admin/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

const r = (promise) => promise.then((res) => res.data);

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboardStats      = ()       => r(adminApi.get('/admin/dashboard'));
export const getSalesChart          = (days)   => r(adminApi.get('/admin/dashboard/sales', { params: { days } }));
export const getOrderStatusChart    = ()       => r(adminApi.get('/admin/dashboard/order-status'));
export const getRecentOrders        = ()       => r(adminApi.get('/admin/dashboard/recent-orders'));
export const getLowStockProducts    = ()       => r(adminApi.get('/admin/dashboard/low-stock'));
export const getTopSellingProducts  = ()       => r(adminApi.get('/admin/dashboard/top-selling'));

// ─── Products ─────────────────────────────────────────────────────────────────
export const getAdminProducts    = (params)        => r(adminApi.get('/products', { params }));
export const createProduct       = (data)          => r(adminApi.post('/products', data));
export const updateProduct       = (id, data)      => r(adminApi.put(`/products/${id}`, data));
export const deleteProduct       = (id)            => r(adminApi.delete(`/products/${id}`));
export const bulkUpdateProducts  = (ids, action)   => r(adminApi.post('/products/bulk', { ids, action }));

// ─── Orders ───────────────────────────────────────────────────────────────────
export const getAdminOrders     = (params)         => r(adminApi.get('/orders', { params }));
export const getOrder           = (id)             => r(adminApi.get(`/orders/${id}`));
export const updateOrderStatus  = (id, status)     => r(adminApi.put(`/orders/${id}/status`, { status }));
export const assignTrackingId   = (id, trackingId)  => r(adminApi.put(`/orders/${id}/tracking-id`, { trackingId }));
export const addAdminNote       = (id, note)       => r(adminApi.put(`/orders/${id}/note`, { note }));
export const bulkUpdateOrders   = (ids, status)    => r(adminApi.post('/orders/bulk', { ids, status }));
export const deleteOrder        = (id)             => r(adminApi.delete(`/orders/${id}`));

// ─── Customers ────────────────────────────────────────────────────────────────
export const getCustomers          = (params) => r(adminApi.get('/admin/customers', { params }));
export const getCustomer           = (id)     => r(adminApi.get(`/admin/customers/${id}`));
export const toggleCustomerStatus  = (id, isActive) => r(adminApi.put(`/admin/customers/${id}/status`, { isActive }));
export const deleteCustomer        = (id)     => r(adminApi.delete(`/admin/customers/${id}`));

// ─── Categories ───────────────────────────────────────────────────────────────
export const getAdminCategories   = ()            => r(adminApi.get('/categories'));
export const createCategory       = (data)        => r(adminApi.post('/categories', data));
export const updateCategory       = (id, data)    => r(adminApi.put(`/categories/${id}`, data));
export const deleteCategory       = (id)          => r(adminApi.delete(`/categories/${id}`));
export const reorderCategories    = (order)       => r(adminApi.post('/categories/reorder', { order }));

// ─── Coupons ──────────────────────────────────────────────────────────────────
export const getCoupons      = ()            => r(adminApi.get('/coupons'));
export const createCoupon    = (data)        => r(adminApi.post('/coupons', data));
export const updateCoupon    = (id, data)    => r(adminApi.put(`/coupons/${id}`, data));
export const deleteCoupon    = (id)          => r(adminApi.delete(`/coupons/${id}`));
export const toggleCoupon    = (id)          => r(adminApi.put(`/coupons/${id}/toggle`));

// ─── Banners ──────────────────────────────────────────────────────────────────
export const getBanners      = ()            => r(adminApi.get('/banners'));
export const createBanner    = (data)        => r(adminApi.post('/banners', data));
export const updateBanner    = (id, data)    => r(adminApi.put(`/banners/${id}`, data));
export const deleteBanner    = (id)          => r(adminApi.delete(`/banners/${id}`));
export const reorderBanners  = (order)       => r(adminApi.post('/banners/reorder', { order }));

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSettings     = ()      => r(adminApi.get('/admin/settings'));
export const updateSettings  = (data)  => r(adminApi.put('/admin/settings', data));

// ─── Expenses ─────────────────────────────────────────────────────────────────
export const getExpenses     = (params) => r(adminApi.get('/expenses', { params }));
export const getExpenseStats = ()       => r(adminApi.get('/expenses/stats'));
export const createExpense   = (data)   => r(adminApi.post('/expenses', data));
export const updateExpense   = (id, data) => r(adminApi.put(`/expenses/${id}`, data));
export const deleteExpense   = (id)     => r(adminApi.delete(`/expenses/${id}`));

// ─── Upload ───────────────────────────────────────────────────────────────────
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await adminApi.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data; // { url, public_id }
};

export default adminApi;

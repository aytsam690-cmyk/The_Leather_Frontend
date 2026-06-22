import axios from 'axios';
import useAuthStore from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Send cookies for refresh token
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('auth-storage');
  if (raw) {
    try {
      const { state } = JSON.parse(raw);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    } catch (_) {}
  }
  return config;
});

// Response interceptor — handle 401 with refresh attempt
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
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
        useAuthStore.getState().login(useAuthStore.getState().user, newToken);
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const login = (creds) => api.post('/auth/login', creds).then((r) => r.data);
export const register = (data) => api.post('/auth/register', data).then((r) => r.data);
export const updateProfile = (data) => api.put('/auth/update-profile', data).then((r) => r.data);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email }).then((r) => r.data);
export const resetPassword = (token, password) => api.post(`/auth/reset-password/${token}`, { password }).then((r) => r.data);
export const changePassword = (data) => api.put('/auth/change-password', data).then((r) => r.data);

// Products
export const getProducts = (params) => api.get('/products', { params }).then((r) => r.data);
export const getProduct = (slug) => api.get(`/products/${slug}`).then((r) => r.data);
export const getFeaturedProducts = () => api.get('/products/featured').then((r) => r.data);
export const searchProducts = (q) => api.get('/products/search', { params: { q } }).then((r) => r.data);

// Categories
export const getCategories = () => api.get('/categories').then((r) => r.data);

// Orders
export const createOrder = (payload) => api.post('/orders/place', payload).then((r) => r.data);
export const getOrders = () => api.get('/orders/my-orders').then((r) => r.data);
export const cancelOrder = (id) => api.put(`/orders/${id}/cancel`).then((r) => r.data);
export const trackOrdersByPhone = (phone) => api.get(`/orders/track-by-phone/${encodeURIComponent(phone)}`).then((r) => r.data);

// Coupons
export const validateCoupon = (payload) => api.post('/coupons/validate', payload).then((r) => r.data);

// Filters
export const getFilters = (category) => api.get('/filters', { params: { category } }).then((r) => r.data);


// Reviews
export const addReview = (productId, data) => api.post(`/reviews/${productId}`, data).then((r) => r.data);
export const addGuestReview = (productId, data) => api.post(`/reviews/guest/${productId}`, data).then((r) => r.data);

// Banners
export const getBanners = () => api.get('/banners').then((r) => r.data);

export default api;

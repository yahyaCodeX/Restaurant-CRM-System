import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

// Request interceptor — attach access token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401 by attempting token refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/v1/auth/refresh-token', { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

/* ---- Auth ---- */
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  signup: (data) => api.post('/auth/signup', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
  changePassword: (data) => api.put('/auth/change-password', data),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

/* ---- Orders ---- */
export const ordersApi = {
  getAll: (params) => api.get('/restaurant/orders', { params }),
  getOne: (id) => api.get(`/restaurant/orders/${id}`),
  create: (data) => api.post('/restaurant/orders/manual', data),
  updateStatus: (id, data) => api.put(`/restaurant/orders/${id}/status`, data),
  getStats: () => api.get('/restaurant/orders/stats'),
};

/* ---- Customers ---- */
export const customersApi = {
  getAll: (params) => api.get('/restaurant/customers', { params }),
  getOne: (id) => api.get(`/restaurant/customers/${id}`),
  create: (data) => api.post('/restaurant/customers', data),
  update: (id, data) => api.put(`/restaurant/customers/${id}`, data),
  delete: (id) => api.delete(`/restaurant/customers/${id}`),
  getHistory: (id) => api.get(`/restaurant/customers/${id}/history`),
};

/* ---- Menu ---- */
export const menuApi = {
  getAll: (params) => api.get('/restaurant/menu', { params }),
  getOne: (id) => api.get(`/restaurant/menu/${id}`),
  getCategories: () => api.get('/restaurant/menu/categories'),
  create: (data) => api.post('/restaurant/menu', data),
  update: (id, data) => api.put(`/restaurant/menu/${id}`, data),
  delete: (id) => api.delete(`/restaurant/menu/${id}`),
  uploadImage: (id, formData) => api.put(`/restaurant/menu/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  toggleAvailability: (id) => api.put(`/restaurant/menu/${id}/toggle`),
};

/* ---- Tables ---- */
export const tablesApi = {
  getAll: () => api.get('/restaurant/tables'),
  add: (data) => api.post('/restaurant/tables', data),
  update: (id, data) => api.put(`/restaurant/tables/${id}`, data),
  remove: (id) => api.delete(`/restaurant/tables/${id}`),
  toggle: (id) => api.put(`/restaurant/tables/${id}/toggle`),
};

/* ---- Analytics ---- */
export const analyticsApi = {
  getSales: (params) => api.get('/restaurant/analytics', { params }),
  getDailySales: (params) => api.get('/restaurant/analytics/daily', { params }),
};

/* ---- Notifications ---- */
export const notificationsApi = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

/* ---- Restaurant ---- */
export const restaurantApi = {
  getProfile: () => api.get('/restaurant/profile'),
  updateProfile: (data) => api.put('/restaurant/profile', data),
  uploadLogo: (formData) => api.put('/restaurant/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadCover: (formData) => api.put('/restaurant/cover', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

/* ---- Admin ---- */
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getRestaurants: (params) => api.get('/admin/restaurants', { params }),
  approve: (id) => api.put(`/admin/restaurants/${id}/approve`),
  reject: (id) => api.put(`/admin/restaurants/${id}/reject`),
  suspend: (id) => api.put(`/admin/restaurants/${id}/suspend`),
  remove: (id) => api.delete(`/admin/restaurants/${id}`),
  getLogs: () => api.get('/admin/logs'),
};

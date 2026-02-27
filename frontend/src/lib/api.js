import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const auth = {
  register: (data) => api.post('/api/auth/register', data),
  login: (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    return api.post('/api/auth/login', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getMe: () => api.get('/api/auth/me'),
};

export const users = {
  getPendingApproval: () => api.get('/api/users/pending-approval'),
  approve: (userId) => api.post(`/api/users/${userId}/approve`),
  updateProfile: (data) => api.put('/api/users/me', data),
  deleteAccount: () => api.delete('/api/users/me'),
};

// Generic API objects for any product type
export const batches = {
  create: (data) => api.post('/api/batches/', {
    product_type: data.product_type,
    quantity: parseInt(data.quantity),
    description: data.description,
    donated_ingredients: data.donated_ingredients !== false,
    pickup_deadline: data.pickup_deadline,
  }),
  markReady: (id) => api.post(`/api/batches/${id}/mark-ready`),
  list: (status) => api.get('/api/batches/my-batches', { params: { status } }),
  getMy: () => api.get('/api/batches/my-batches'),
  getAvailable: () => api.get('/api/batches/ready'),
  reserve: (id) => api.post('/api/deliveries/', { batch_id: id, quantity: 1 }),
  cancel: (id) => api.delete(`/api/batches/${id}`),
};

export const deliveries = {
  create: (data) => api.post('/api/deliveries/', {
    batch_id: data.batch_id,
    location_id: data.location_id,
    quantity: data.quantity || 1,
  }),
  confirmPickup: (id, code) => api.post(`/api/deliveries/${id}/confirm-pickup`, { pickup_code: code }),
  confirmDelivery: (id, code) => api.post(`/api/deliveries/${id}/confirm-delivery`, { delivery_code: code }),
  list: () => api.get('/api/deliveries/my-deliveries'),
  getAvailable: () => api.get('/api/deliveries/available'),
  cancel: (id) => api.delete(`/api/deliveries/${id}`),
};

export const resourceRequests = {
  create: (data) => api.post('/api/resources/requests', {
    quantity_meals: parseInt(data.quantity_meals),
    items: data.items || [],
    receiving_time: data.receiving_time,
  }),
  list: (status) => api.get('/api/resources/requests', { params: { status } }),
  getMy: () => api.get('/api/resources/requests/my'),
  getById: (id) => api.get(`/api/resources/requests/${id}`),
  cancel: (id) => api.delete(`/api/resources/requests/${id}`),
};

export const resourceReservations = {
  create: (data) => api.post('/api/resources/reservations', {
    request_id: data.request_id,
    items: data.items || [],
    estimated_delivery: data.estimated_delivery,
  }),
  acceptRequest: (requestId) => api.post('/api/resources/reservations', { 
    request_id: requestId, 
    items: [] 
  }),
  list: () => api.get('/api/resources/reservations/my'),
  markDelivery: (id, code) => api.post(`/api/resources/reservations/${id}/deliver?confirmation_code=${code}`),
  confirmDelivery: (id) => api.post(`/api/resources/reservations/${id}/confirm`),
  cancel: (id) => api.delete(`/api/resources/reservations/${id}`),
};

export const locations = {
  create: (data) => api.post('/api/locations/', data),
  list: (activeOnly = true, cityId = null) => {
    let url = `/api/locations/?active_only=${activeOnly}`;
    if (cityId) {
      url += `&city_id=${cityId}`;
    }
    return api.get(url);
  },
  getById: (id) => api.get(`/api/locations/${id}`),
  update: (id, data) => api.put(`/api/locations/${id}`, data),
  deactivate: (id) => api.post(`/api/locations/${id}/deactivate`),
  activate: (id) => api.post(`/api/locations/${id}/activate`),
  approve: (id) => api.post(`/api/locations/${id}/approve`),
};

export const admin = {
  pendingLocations: () => api.get('/api/admin/locations/pending'),
  approveLocation: (id) => api.post(`/api/locations/${id}/approve`),
  rejectLocation: (id) => api.post(`/api/locations/${id}/deactivate`),
  pendingUsers: () => api.get('/api/admin/users/pending'),
  approveUser: (id) => api.post(`/api/admin/users/${id}/approve`),
  deactivateUser: (id) => api.post(`/api/admin/users/${id}/deactivate`),
};

export const dashboard = {
  getStats: () => api.get('/api/dashboard/stats'),
};

// Legacy compatibility layer - maps old names to new generic API
export const pedidosInsumo = resourceRequests;
export const reservasInsumo = resourceReservations;
export const locaisEntrega = locations;
export const lotesMarmita = batches;
export const locaisProducao = locations;
export const reservasMarmita = deliveries;
export const entregasMarmita = deliveries;
export const pedidosInsumoPublic = {
  list: (cityId = null, status = 'REQUESTING') => {
    let url = '/api/resources/requests';
    const params = {};
    if (cityId) params.city_id = cityId;
    if (status) params.status = status;
    return api.get(url, { params });
  },
};

export default api;

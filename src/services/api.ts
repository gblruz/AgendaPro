import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://agendapro-qer7.onrender.com/api';

// Criar instância do axios
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para adicionar token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),
  
  me: () => api.get('/auth/me'),
  
  updateProfile: (data: { name: string; phone: string; avatar?: string }) =>
    api.put('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

// Business API
export const businessAPI = {
  create: (data: Partial<Business>) =>
    api.post('/businesses', data),
  
  list: () => api.get('/businesses'),
  
  getById: (id: string) => api.get(`/businesses/${id}`),
  
  update: (id: string, data: Partial<Business>) =>
    api.put(`/businesses/${id}`, data),
  
  delete: (id: string) => api.delete(`/businesses/${id}`),
  
  dashboard: (id: string, params?: { startDate?: string; endDate?: string }) =>
    api.get(`/businesses/${id}/dashboard`, { params }),
};

// Service API
export const serviceAPI = {
  create: (data: Partial<Service>) =>
    api.post('/services', data),
  
  list: (businessId?: string) =>
    api.get('/services', { params: { business_id: businessId } }),
  
  getById: (id: string) => api.get(`/services/${id}`),
  
  update: (id: string, data: Partial<Service>) =>
    api.put(`/services/${id}`, data),
  
  delete: (id: string) => api.delete(`/services/${id}`),
};

// Professional API
export const professionalAPI = {
  create: (data: Partial<Professional> & { service_ids?: string[] }) =>
    api.post('/professionals', data),
  
  list: (businessId?: string) =>
    api.get('/professionals', { params: { business_id: businessId } }),
  
  getById: (id: string) => api.get(`/professionals/${id}`),
  
  update: (id: string, data: Partial<Professional> & { service_ids?: string[] }) =>
    api.put(`/professionals/${id}`, data),
  
  delete: (id: string) => api.delete(`/professionals/${id}`),
  
  addAvailability: (id: string, data: { day_of_week: number; start_time: string; end_time: string }) =>
    api.post(`/professionals/${id}/availability`, data),
  
  removeAvailability: (id: string, availabilityId: string) =>
    api.delete(`/professionals/${id}/availability/${availabilityId}`),
  
  getAvailableSlots: (id: string, date: string, serviceId?: string) =>
    api.get(`/professionals/${id}/slots`, { params: { date, service_id: serviceId } }),
};

// Appointment API
export const appointmentAPI = {
  create: (data: Partial<Appointment>) =>
    api.post('/appointments', data),
  
  list: (params?: {
    business_id?: string;
    client_id?: string;
    professional_id?: string;
    date?: string;
    status?: string;
    start_date?: string;
    end_date?: string;
  }) => api.get('/appointments', { params }),
  
  getById: (id: string) => api.get(`/appointments/${id}`),
  
  update: (id: string, data: Partial<Appointment>) =>
    api.put(`/appointments/${id}`, data),
  
  cancel: (id: string) => api.delete(`/appointments/${id}`),
  
  confirm: (id: string) => api.post(`/appointments/${id}/confirm`),
  
  complete: (id: string) => api.post(`/appointments/${id}/complete`),
  
  stats: (businessId: string) =>
    api.get('/appointments/stats', { params: { business_id: businessId } }),
};

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'client' | 'professional';
  avatar?: string;
  created_at: string;
}

export interface Business {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  owner_id: string;
  working_hours?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  services?: Service[];
  professionals?: Professional[];
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Professional {
  id: string;
  user_id: string;
  business_id: string;
  bio?: string;
  specialty?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  services?: Service[];
  availability?: Availability[];
}

export interface Availability {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

export interface Appointment {
  id: string;
  business_id: string;
  client_id: string;
  professional_id?: string;
  service_id: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  service_name?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  professional_name?: string;
}

export default api;

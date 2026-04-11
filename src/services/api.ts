import axios, { AxiosError } from 'axios';
import { STORAGE_KEYS } from '@/lib/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface DashboardMetrics {
  totalAppointments: number;
  periodAppointments: number;
  uniqueClients: number;
  revenue: number;
}

export interface AppointmentStats {
  totalAppointments: number;
  revenue: number;
  uniqueClients: number;
  dailyStats: { date: string; revenue: number; count: number }[];
  serviceStats: { name: string; count: number }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'client' | 'professional';
  avatar?: string;
  stripe_customer_id?: string;
  subscription_id?: string;
  plan_name?: string;
  plan_active?: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Business {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  theme_color?: string;
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
  name?: string;
  bio?: string;
  specialty?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
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

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token, user } = response.data;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return { data: { token, user } };
  },

  register: async (data: { name: string; email: string; password: string; phone?: string }) => {
    const response = await apiClient.post('/auth/register', data);
    const { token, user } = response.data;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return { data: { token, user } };
  },

  me: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<Pick<User, 'name' | 'phone'>>) => {
    const response = await apiClient.put('/auth/profile', data);
    if (response.data.user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(response.data.user));
    }
    return response.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    return apiClient.put('/auth/change-password', { currentPassword, newPassword });
  },
};

export const businessAPI = {
  create: async (data: Partial<Business>) => {
    const response = await apiClient.post('/businesses', data);
    return response.data;
  },

  list: async () => {
    const response = await apiClient.get('/businesses');
    return { data: { businesses: response.data.businesses } };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/businesses/${id}`);
    return { data: { business: response.data.business } };
  },

  update: async (id: string, data: Partial<Business>) => {
    const response = await apiClient.put(`/businesses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/businesses/${id}`);
    return response.data;
  },

  dashboard: async (id: string, params?: { startDate?: string; endDate?: string }) => {
    const response = await apiClient.get(`/businesses/${id}/dashboard`, { params });
    return { data: response.data };
  },
};

export const serviceAPI = {
  create: async (data: Partial<Service>) => {
    const response = await apiClient.post('/services', data);
    return response.data;
  },

  list: async (businessId?: string) => {
    const response = await apiClient.get('/services', { params: { business_id: businessId } });
    return { data: { services: response.data.services } };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/services/${id}`);
    return { data: response.data.service };
  },

  update: async (id: string, data: Partial<Service>) => {
    const response = await apiClient.put(`/services/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/services/${id}`);
    return response.data;
  },
};

export const professionalAPI = {
  create: async (data: Partial<Professional> & { service_ids?: string[] }) => {
    const response = await apiClient.post('/professionals', data);
    return response.data;
  },

  list: async (businessId?: string) => {
    const response = await apiClient.get('/professionals', { params: { business_id: businessId } });
    return { data: { professionals: response.data.professionals } };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/professionals/${id}`);
    return { data: response.data.professional };
  },

  update: async (id: string, data: Partial<Professional>) => {
    const response = await apiClient.put(`/professionals/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/professionals/${id}`);
    return response.data;
  },

  addAvailability: async (id: string, data: { day_of_week: number; start_time: string; end_time: string }) => {
    const response = await apiClient.post(`/professionals/${id}/availability`, data);
    return response.data;
  },

  removeAvailability: async (id: string, availabilityId: string) => {
    const response = await apiClient.delete(`/professionals/${id}/availability/${availabilityId}`);
    return response.data;
  },

  getAvailableSlots: async (id: string, date: string, serviceId?: string) => {
    const response = await apiClient.get(`/professionals/${id}/slots`, { params: { date, service_id: serviceId } });
    return { data: { slots: response.data.slots } };
  },
};

export const appointmentAPI = {
  create: async (data: Partial<Appointment>) => {
    const response = await apiClient.post('/appointments', data);
    return response.data;
  },

  list: async (params?: { business_id?: string; client_id?: string; date?: string }) => {
    const response = await apiClient.get('/appointments', { params });
    return { data: { appointments: response.data.appointments } };
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/appointments/${id}`);
    return { data: response.data.appointment };
  },

  update: async (id: string, data: Partial<Appointment>) => {
    const response = await apiClient.put(`/appointments/${id}`, data);
    return response.data;
  },

  cancel: async (id: string) => {
    const response = await apiClient.delete(`/appointments/${id}`);
    return response.data;
  },

  confirm: async (id: string) => {
    const response = await apiClient.post(`/appointments/${id}/confirm`);
    return response.data;
  },

  complete: async (id: string) => {
    const response = await apiClient.post(`/appointments/${id}/complete`);
    return response.data;
  },

  stats: async (businessId: string) => {
    const response = await apiClient.get('/appointments/stats', { params: { business_id: businessId } });
    return { data: response.data };
  },
};

export const paymentAPI = {
  createCheckoutSession: async (priceId: string) => {
    const response = await apiClient.post('/payments/create-checkout-session', { priceId });
    return response.data;
  },

  createCustomerPortalSession: async () => {
    const response = await apiClient.post('/payments/customer-portal');
    return response.data;
  },

  getInvoices: async () => {
    const response = await apiClient.get('/payments/invoices');
    return response.data;
  },
};

const api = {
  auth: authAPI,
  business: businessAPI,
  service: serviceAPI,
  professional: professionalAPI,
  appointment: appointmentAPI,
  payment: paymentAPI,
};

export default api;
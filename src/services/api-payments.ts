/**
 * @module api-payments
 * @description Serviços de API para pagamentos Stripe.
 *
 * Encapsula toda a lógica de comunicação com os endpoints de pagamento,
 * incluindo checkout, portal de cliente e faturas.
 */

import axios from 'axios';
import { STORAGE_KEYS } from '@/lib/constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratamento de erros
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface CheckoutSessionResponse {
  id: string;
  url: string;
}

export interface CustomerPortalResponse {
  url: string;
}

export interface Invoice {
  id: string;
  number: string;
  amount_paid: number;
  currency: string;
  status: string;
  created: number;
  paid: boolean;
  invoice_pdf: string;
  hosted_invoice_url: string;
}

export interface InvoicesResponse {
  invoices: Invoice[];
}

/**
 * Criar sessão de checkout para assinatura
 */
export async function createCheckoutSession(priceId: string): Promise<CheckoutSessionResponse> {
  try {
    const response = await apiClient.post('/payments/create-checkout-session', { priceId });
    return response.data;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw new Error('Erro ao processar pagamento. Tente novamente.');
  }
}

/**
 * Abrir portal de cliente Stripe para gerenciar assinatura
 */
export async function createCustomerPortalSession(): Promise<CustomerPortalResponse> {
  try {
    const response = await apiClient.post('/payments/customer-portal');
    return response.data;
  } catch (error) {
    console.error('Erro ao criar sessão do portal:', error);
    throw new Error('Erro ao acessar portal de cliente. Tente novamente.');
  }
}

/**
 * Buscar faturas do cliente
 */
export async function getInvoices(): Promise<InvoicesResponse> {
  try {
    const response = await apiClient.get('/payments/invoices');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    throw new Error('Erro ao carregar faturas. Tente novamente.');
  }
}

/**
 * Verificar se uma sessão de checkout foi concluída com sucesso
 */
export async function verifyCheckoutSession(sessionId: string): Promise<{ success: boolean }> {
  try {
    // Esta função seria implementada no backend para validar a sessão
    // Por enquanto, apenas retorna sucesso se o sessionId estiver presente
    return { success: !!sessionId };
  } catch (error) {
    console.error('Erro ao verificar sessão:', error);
    throw new Error('Erro ao verificar pagamento.');
  }
}

export const paymentServices = {
  createCheckoutSession,
  createCustomerPortalSession,
  getInvoices,
  verifyCheckoutSession,
};

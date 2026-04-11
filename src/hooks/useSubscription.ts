/**
 * @module useSubscription
 * @description Hook para gerenciar assinatura Stripe do usuário.
 *
 * Responsabilidades:
 * - Buscar status da assinatura atual
 * - Redirecionar para Stripe Customer Portal
 * - Listar faturas do usuário
 * - Sincronizar com o contexto de autenticação
 *
 * ## Uso
 * ```tsx
 * const { subscription, isLoading, openPortal, invoices } = useSubscription();
 *
 * if (subscription?.status === 'active') {
 *   return <button onClick={openPortal}>Gerenciar Assinatura</button>;
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { paymentAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseQueries } from '@/lib/supabase-client';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan_name: 'Básico' | 'Profissional' | 'Empresarial';
  price_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'past_due' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  updated_at: string;
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

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  openPortal: () => Promise<void>;
  refetch: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Buscar assinatura do usuário no Supabase
   */
  const fetchSubscription = async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabaseQueries.getUserSubscription(user.id);

      if (queryError) {
        console.error('Erro ao buscar assinatura:', queryError);
        setError('Erro ao carregar assinatura');
        setSubscription(null);
      } else {
        setSubscription(data as Subscription);
      }
    } catch (err) {
      console.error('Erro inesperado ao buscar assinatura:', err);
      setError('Erro ao carregar assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Buscar faturas do usuário via API
   */
  const fetchInvoices = async () => {
    if (!isAuthenticated) return;

    try {
      const response = await paymentAPI.getInvoices?.();
      if (response?.invoices) {
        setInvoices(response.invoices);
      }
    } catch (err) {
      console.error('Erro ao buscar faturas:', err);
      // Não mostrar erro de faturas para não quebrar a UX
    }
  };

  /**
   * Abrir Stripe Customer Portal
   */
  const openPortal = async () => {
    try {
      setError(null);
      const response = await paymentAPI.createCustomerPortalSession?.();

      if (response?.url) {
        window.location.href = response.url;
      } else {
        setError('Erro ao abrir portal de cliente');
      }
    } catch (err) {
      console.error('Erro ao abrir portal:', err);
      setError('Erro ao abrir portal de cliente');
    }
  };

  /**
   * Recarregar dados de assinatura e faturas
   */
  const refetch = async () => {
    await Promise.all([fetchSubscription(), fetchInvoices()]);
  };

  /**
   * Buscar dados ao montar o componente ou quando o usuário muda
   */
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchSubscription();
      fetchInvoices();
    } else {
      setSubscription(null);
      setInvoices([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  return {
    subscription,
    invoices,
    isLoading,
    error,
    openPortal,
    refetch,
  };
}

/**
 * Hook para monitorar mudanças de assinatura em tempo real
 */
export function useSubscriptionListener(callback?: (subscription: Subscription | null) => void) {
  const { subscription, refetch } = useSubscription();

  useEffect(() => {
    // Polling a cada 30 segundos para verificar mudanças de assinatura
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  useEffect(() => {
    if (callback) {
      callback(subscription);
    }
  }, [subscription, callback]);

  return subscription;
}

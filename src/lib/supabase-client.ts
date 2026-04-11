/**
 * @module supabase-client
 * @description Cliente Supabase centralizado para o frontend.
 *
 * Este módulo encapsula toda a lógica de comunicação com o Supabase,
 * permitindo chamadas diretas ao banco de dados quando necessário,
 * além de gerenciar autenticação e sessões.
 *
 * ## Uso
 * ```tsx
 * import { supabase } from '@/lib/supabase-client';
 *
 * // Chamar diretamente o banco
 * const { data, error } = await supabase
 *   .from('appointments')
 *   .select('*')
 *   .eq('business_id', businessId);
 * ```
 */

import { createClient, type SupabaseClient, type AuthChangeEvent, type Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL ou Anon Key não configurados no .env');
}

/**
 * Cliente Supabase singleton para o frontend.
 * Usa a chave anon (pública) para respeitar as políticas RLS.
 */
export const supabase: SupabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);

/**
 * Hook para gerenciar autenticação via Supabase Auth.
 * Alternativa ao JWT customizado para maior segurança.
 */
export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

/**
 * Listener para mudanças de autenticação.
 * Útil para sincronizar estado global quando a sessão muda.
 */
export function onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return subscription;
}

/**
 * Utilitários para operações comuns no banco.
 */
export const supabaseQueries = {
  /**
   * Buscar agendamentos de um negócio com filtros opcionais.
   */
  async getAppointments(
    businessId: string,
    filters?: { status?: string; date?: string; professionalId?: string }
  ) {
    let query = supabase
      .from('appointments')
      .select(
        `
        *,
        service:services(name, duration, price),
        professional:professionals(name, specialty)
      `
      )
      .eq('business_id', businessId)
      .is('deleted_at', null);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.date) {
      query = query.eq('date', filters.date);
    }
    if (filters?.professionalId) {
      query = query.eq('professional_id', filters.professionalId);
    }

    return query.order('date', { ascending: false });
  },

  /**
   * Buscar receita de um negócio em um período.
   */
  async getRevenue(businessId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase.rpc('calculate_revenue', {
      business_id: businessId,
      start_date: startDate,
      end_date: endDate,
    });
    return { data, error };
  },

  /**
   * Buscar serviços ativos de um negócio.
   */
  async getServices(businessId: string) {
    return supabase
      .from('services')
      .select('*')
      .eq('business_id', businessId)
      .eq('active', true)
      .is('deleted_at', null)
      .order('name');
  },

  /**
   * Buscar profissionais de um negócio.
   */
  async getProfessionals(businessId: string) {
    return supabase
      .from('professionals')
      .select(
        `
        *,
        professional_services(service_id)
      `
      )
      .eq('business_id', businessId)
      .eq('active', true)
      .is('deleted_at', null)
      .order('name');
  },

  /**
   * Buscar horários disponíveis de um profissional.
   */
  async getAvailableSlots(professionalId: string, _date: string) {
    // _date prefixado com underscore para indicar que é intencionalmente não utilizado no mock
    return supabase
      .from('availability')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('active', true);
  },

  /**
   * Verificar se um horário está bloqueado.
   */
  async isSlotBlocked(professionalId: string, date: string, time: string) {
    const { data } = await supabase
      .from('blocked_slots')
      .select('*')
      .eq('professional_id', professionalId)
      .eq('date', date)
      .gte('start_time', time)
      .lte('end_time', time)
      .single();

    return !!data;
  },

  /**
   * Criar novo agendamento.
   */
  async createAppointment(appointment: any) {
    return supabase.from('appointments').insert([appointment]).select().single();
  },

  /**
   * Atualizar status de agendamento.
   */
  async updateAppointmentStatus(appointmentId: string, status: string) {
    return supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appointmentId)
      .select()
      .single();
  },

  /**
   * Buscar dados do negócio.
   */
  async getBusiness(businessId: string) {
    return supabase
      .from('businesses')
      .select(
        `
        *,
        services:services(count),
        professionals:professionals(count),
        appointments:appointments(count)
      `
      )
      .eq('id', businessId)
      .is('deleted_at', null)
      .single();
  },

  /**
   * Buscar informações de assinatura do usuário.
   */
  async getUserSubscription(userId: string) {
    return supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
  },
};

/**
 * Realtime subscriptions para atualizações em tempo real.
 */
export const supabaseRealtime = {
  /**
   * Escutar mudanças em agendamentos.
   */
  onAppointmentsChange(businessId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`appointments:${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${businessId}`,
        },
        callback
      )
      .subscribe();
  },

  /**
   * Escutar mudanças em serviços.
   */
  onServicesChange(businessId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`services:${businessId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
          filter: `business_id=eq.${businessId}`,
        },
        callback
      )
      .subscribe();
  },
};

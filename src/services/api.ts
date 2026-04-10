/**
 * @module api
 * @description Camada de acesso a dados (Data Access Layer) do AgendaPro MVP.
 *
 * ## Arquitetura
 * Em produção, esta camada seria substituída por chamadas HTTP reais a um
 * backend (ex: Supabase, Fastify). Atualmente utiliza `localStorage` como
 * banco de dados para permitir demonstração offline sem servidor.
 *
 * ## Estrutura interna
 * ```
 * localStorage["agendapro_db"] → DBState (JSON serializado)
 *   ├── users[]
 *   ├── businesses[]
 *   ├── services[]
 *   ├── professionals[]
 *   └── appointments[]
 * ```
 *
 * ## Anti-colisão
 * O motor de agendamentos verifica conflitos antes de inserir: se um
 * profissional já tem agendamento ativo no mesmo dia/hora, a operação
 * é rejeitada com `Promise.reject`.
 *
 * ## Migração futura
 * Para migrar para um backend real, substitua cada função de cada API
 * por uma chamada `fetch`/`axios` equivalente. Os tipos exportados
 * (`Business`, `Appointment`, etc.) permanecem inalterados — apenas a
 * implementação interna muda.
 */

import { format, parseISO, isSameDay } from 'date-fns';
import { STORAGE_KEYS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Utilitários internos
// ---------------------------------------------------------------------------

/** Simula latência de rede para tornar o mock mais realista */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** Gera ID único de 9 caracteres alfanuméricos */
const generateId = () => Math.random().toString(36).substr(2, 9);

// ---------------------------------------------------------------------------
// Tipos de retorno adicionais (evitam `any` nos consumidores)
// ---------------------------------------------------------------------------

/** Métricas do dashboard principal de um negócio */
export interface DashboardMetrics {
  totalAppointments: number;
  periodAppointments: number;
  uniqueClients: number;
  revenue: number;
}

/** Estatísticas agregadas para a página de Relatórios */
export interface AppointmentStats {
  totalAppointments: number;
  revenue: number;
  uniqueClients: number;
  /** Faturamento e contagem por dia (formato "dd/MM") */
  dailyStats: { date: string; revenue: number; count: number }[];
  /** Ranking de serviços mais agendados */
  serviceStats: { name: string; count: number }[];
}

// ---------------------------------------------------------------------------
// Acesso / persistência ao banco de dados mock
// ---------------------------------------------------------------------------

interface DBState {
  users: User[];
  businesses: Business[];
  services: Service[];
  professionals: Professional[];
  appointments: Appointment[];
}

/** Lê o estado atual do banco mock. Se não existir, inicializa com dados de seed. */
const getDB = (): DBState => {
  const data = localStorage.getItem(STORAGE_KEYS.DB);
  return data ? JSON.parse(data) : seedDB();
};

/** Persiste o estado do banco mock no localStorage. */
const saveDB = (state: DBState): void => {
  localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(state));
};

// ---------------------------------------------------------------------------
// Seed inicial
// ---------------------------------------------------------------------------

/**
 * Popula o banco com dados de demonstração na primeira execução.
 *
 * Cria:
 * - 1 usuário administrador
 * - 1 negócio de exemplo ("Studio Beleza VIP")
 * - 2 serviços (Corte Social, Design de Sobrancelha)
 * - 2 profissionais (Carlos Barbeiro, Ana Designer)
 * - 20 agendamentos: 10 passados (concluídos) + 10 futuros (confirmados)
 *
 * ⚠️ Chamado apenas quando `localStorage["agendapro_db"]` está ausente.
 */
const seedDB = (): DBState => {
  const adminId = generateId();
  const businessId = 'biz_1'; // ID fixo para que links /booking/biz_1 funcionem

  const initialState: DBState = {
    users: [
      {
        id: adminId,
        name: 'Admin AgendaPro',
        email: 'admin@agendapro.com',
        role: 'admin',
        created_at: new Date().toISOString(),
      },
    ],
    businesses: [
      {
        id: businessId,
        name: 'Studio Beleza VIP',
        description: 'O melhor estúdio de beleza automotiva, mentira, é cabeleireiro mesmo.',
        address: 'Rua Principal, 100',
        phone: '11999999999',
        email: 'contato@studiovip.com',
        owner_id: adminId,
        theme_color: '#7C3AED',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    services: [
      {
        id: generateId(),
        business_id: businessId,
        name: 'Corte Social',
        description: 'Corte tradicional de cabelo.',
        duration: 30,
        price: 45.0,
        color: '#7C3AED',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: generateId(),
        business_id: businessId,
        name: 'Design de Sobrancelha',
        description: 'Design feito na pinça e tesoura.',
        duration: 45,
        price: 35.0,
        color: '#10B981',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    professionals: [
      {
        id: generateId(),
        user_id: generateId(),
        business_id: businessId,
        name: 'Carlos Barbeiro',
        specialty: 'Barbeiro Sênior',
        email: 'carlos@studiovip.com',
        phone: '11988888888',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: generateId(),
        user_id: generateId(),
        business_id: businessId,
        name: 'Ana Designer',
        specialty: 'Designer de Sobrancelha',
        email: 'ana@studiovip.com',
        phone: '11977777777',
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    appointments: [],
  };

  const profs = initialState.professionals;
  const servs = initialState.services;
  const timeSlots = ['09:00', '10:00', '14:00', '15:30', '16:00', '17:00'];

  // Gera 10 agendamentos passados + 10 futuros
  for (let i = 0; i < 20; i++) {
    const isPast = i < 10;
    const date = new Date();

    if (isPast) {
      date.setDate(date.getDate() - (10 - i));
    } else {
      date.setDate(date.getDate() + (i - 9));
    }

    const prof = profs[i % 2];
    const srv = servs[i % 2];

    initialState.appointments.push({
      id: generateId(),
      business_id: businessId,
      client_id: `cli_${i}`,
      client_name: `João Cliente ${i}`,
      client_email: `joao${i}@email.com`,
      client_phone: '(11) 9' + String(Math.floor(Math.random() * 90000000) + 10000000),
      professional_id: prof.id,
      professional_name: prof.name,
      service_id: srv.id,
      service_name: srv.name,
      date: date.toISOString(),
      time: timeSlots[i % timeSlots.length],
      duration: srv.duration,
      price: srv.price,
      status: isPast ? 'completed' : 'confirmed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  localStorage.setItem(STORAGE_KEYS.DB, JSON.stringify(initialState));
  localStorage.setItem(STORAGE_KEYS.TOKEN, 'fake-jwt-token');
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(initialState.users[0]));

  return initialState;
};

/** Envolve dados em uma Promise com delay simulado de 500ms */
const mockResponse = <T>(data: T) => delay(500).then(() => ({ data }));

// ---------------------------------------------------------------------------
// API de Autenticação
// ---------------------------------------------------------------------------

/**
 * Módulo de autenticação do AgendaPro.
 *
 * No MVP, todas as credenciais são aceitas (qualquer email/senha loga com
 * o usuário admin do seed). Em produção, substituir por JWT real.
 */
export const authAPI = {
  /**
   * Autentica um usuário e persiste o token de sessão.
   * @param _email - Email do usuário (ignorado no mock)
   * @param _password - Senha do usuário (ignorada no mock)
   */
  login: async (_email: string, _password: string) => {
    await delay(800);
    const db = getDB();
    const user = db.users[0] ?? seedDB().users[0];
    localStorage.setItem(STORAGE_KEYS.TOKEN, 'fake-jwt-token');
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    return { data: { token: 'fake-jwt-token', user } };
  },

  /**
   * Registra um novo usuário e inicia a sessão automaticamente.
   * No mock, apenas confirma com os dados do seed.
   */
  register: async (_data: unknown) =>
    mockResponse({ user: getDB().users[0] ?? seedDB().users[0], token: 'fake-jwt-token' }),

  /**
   * Retorna os dados do usuário atualmente autenticado.
   * Utilizado no boot da aplicação para restaurar a sessão.
   */
  me: async () => {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    if (!raw) {
      const db = getDB();
      const user = db.users[0];
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return mockResponse({ user });
    }
    return mockResponse({ user: JSON.parse(raw) as User });
  },

  /**
   * Atualiza nome e telefone do perfil do usuário logado.
   * @param data - Campos a atualizar (name, phone)
   */
  updateProfile: async (data: Partial<Pick<User, 'name' | 'phone'>>) => {
    const db = getDB();
    const user: User = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) ?? '{}');
    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

    const idx = db.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      db.users[idx] = user;
      saveDB(db);
    }
    return mockResponse({ user });
  },

  /** Placeholder para troca de senha (implementação real requer backend). */
  changePassword: async () => mockResponse({ success: true }),
};

// ---------------------------------------------------------------------------
// API de Negócios
// ---------------------------------------------------------------------------

/**
 * Módulo CRUD para gerenciamento de negócios (estabelecimentos).
 * Cada negócio é a unidade central que agrega serviços, profissionais
 * e agendamentos.
 */
export const businessAPI = {
  /**
   * Cria um novo negócio vinculado ao usuário autenticado.
   * @param data - Dados parciais do negócio
   */
  create: async (data: Partial<Business>) => {
    const db = getDB();
    const business: Business = {
      ...data,
      id: generateId(),
      name: data.name!,
      owner_id: '1',
      theme_color: data.theme_color ?? '#7C3AED',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.businesses.push(business);
    saveDB(db);
    return mockResponse(business);
  },

  /** Lista todos os negócios do banco (em produção: filtrado pelo usuário). */
  list: async () => {
    const db = getDB();
    return mockResponse({ businesses: db.businesses });
  },

  /**
   * Busca um negócio pelo ID.
   * @param id - Identificador único do negócio
   */
  getById: async (id: string) => {
    const db = getDB();
    return mockResponse({ business: db.businesses.find(b => b.id === id) });
  },

  /**
   * Atualiza campos de um negócio existente.
   * @param id - ID do negócio
   * @param data - Campos a atualizar
   */
  update: async (id: string, data: Partial<Business>) => {
    const db = getDB();
    const idx = db.businesses.findIndex(b => b.id === id);
    if (idx !== -1) {
      db.businesses[idx] = { ...db.businesses[idx], ...data, updated_at: new Date().toISOString() };
      saveDB(db);
    }
    return mockResponse(db.businesses[idx]);
  },

  /**
   * Remove permanentemente um negócio do banco.
   * @param id - ID do negócio a excluir
   */
  delete: async (id: string) => {
    const db = getDB();
    db.businesses = db.businesses.filter(b => b.id !== id);
    saveDB(db);
    return mockResponse({ success: true });
  },

  /**
   * Calcula métricas do painel principal para um negócio.
   * @param id - ID do negócio
   * @param _params - Filtros de data (não implementados no mock)
   * @returns {DashboardMetrics}
   */
  dashboard: async (id: string, _params?: { startDate?: string; endDate?: string }) => {
    const db = getDB();
    const appointments = db.appointments.filter(a => a.business_id === id);

    const metrics: DashboardMetrics = {
      totalAppointments: appointments.length,
      periodAppointments: appointments.filter(a => isSameDay(new Date(a.date), new Date())).length,
      uniqueClients: new Set(appointments.map(a => a.client_id)).size,
      revenue: appointments.reduce(
        (sum, apt) =>
          sum + (['completed', 'confirmed'].includes(apt.status) ? apt.price : 0),
        0
      ),
    };

    return mockResponse(metrics);
  },
};

// ---------------------------------------------------------------------------
// API de Serviços
// ---------------------------------------------------------------------------

/**
 * Módulo CRUD para serviços oferecidos por um negócio.
 * Cada serviço possui duração (min), preço e cor de identificação visual.
 */
export const serviceAPI = {
  /** Cria um serviço e o associa ao negócio informado. */
  create: async (data: Partial<Service>) => {
    const db = getDB();
    const service: Service = {
      ...data,
      id: generateId(),
      name: data.name!,
      business_id: data.business_id!,
      duration: data.duration!,
      price: data.price!,
      color: data.color ?? '#7C3AED',
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.services.push(service);
    saveDB(db);
    return mockResponse(service);
  },

  /**
   * Lista serviços, opcionalmente filtrados por negócio.
   * @param businessId - Filtro opcional de negócio
   */
  list: async (businessId?: string) => {
    const db = getDB();
    const services = businessId
      ? db.services.filter(s => s.business_id === businessId)
      : db.services;
    return mockResponse({ services });
  },

  /** Busca um serviço pelo ID. */
  getById: async (id: string) => mockResponse(getDB().services.find(s => s.id === id)),

  /** Atualiza campos de um serviço existente. */
  update: async (id: string, data: Partial<Service>) => {
    const db = getDB();
    const idx = db.services.findIndex(s => s.id === id);
    if (idx !== -1) {
      db.services[idx] = { ...db.services[idx], ...data, updated_at: new Date().toISOString() };
      saveDB(db);
    }
    return mockResponse(db.services[idx]);
  },

  /** Remove um serviço do banco. */
  delete: async (id: string) => {
    const db = getDB();
    db.services = db.services.filter(s => s.id !== id);
    saveDB(db);
    return mockResponse({ success: true });
  },
};

// ---------------------------------------------------------------------------
// API de Profissionais
// ---------------------------------------------------------------------------

/**
 * Módulo CRUD para profissionais vinculados a um negócio.
 * Também expõe consulta de slots disponíveis com motor anti-colisão.
 */
export const professionalAPI = {
  /** Cria um profissional e o vincula ao negócio. */
  create: async (data: Partial<Professional> & { service_ids?: string[] }) => {
    const db = getDB();
    const professional: Professional = {
      ...data,
      id: generateId(),
      user_id: generateId(),
      business_id: data.business_id!,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.professionals.push(professional);
    saveDB(db);
    return mockResponse(professional);
  },

  /**
   * Lista profissionais, opcionalmente filtrados por negócio.
   * @param businessId - Filtro opcional de negócio
   */
  list: async (businessId?: string) => {
    const db = getDB();
    const professionals = businessId
      ? db.professionals.filter(p => p.business_id === businessId)
      : db.professionals;
    return mockResponse({ professionals });
  },

  /** Busca um profissional pelo ID. */
  getById: async (id: string) => mockResponse(getDB().professionals.find(p => p.id === id)),

  /** Atualiza campos de um profissional existente. */
  update: async (id: string, data: Partial<Professional>) => {
    const db = getDB();
    const idx = db.professionals.findIndex(p => p.id === id);
    if (idx !== -1) {
      db.professionals[idx] = { ...db.professionals[idx], ...data, updated_at: new Date().toISOString() };
      saveDB(db);
    }
    return mockResponse(db.professionals[idx]);
  },

  /** Remove um profissional do banco. */
  delete: async (id: string) => {
    const db = getDB();
    db.professionals = db.professionals.filter(p => p.id !== id);
    saveDB(db);
    return mockResponse({ success: true });
  },

  /** Placeholders para gerenciamento de disponibilidade (futura implementação). */
  addAvailability: async () => mockResponse({ success: true }),
  removeAvailability: async () => mockResponse({ success: true }),

  /**
   * Retorna slots de horário disponíveis para um profissional em uma data.
   * Remove automaticamente os horários já ocupados (não cancelados).
   *
   * @param id - ID do profissional
   * @param date - Data no formato "YYYY-MM-DD"
   * @param _serviceId - Reservado para filtragem futura por serviço
   * @returns Lista de horários livres (ex: ["09:00", "10:30"])
   */
  getAvailableSlots: async (id: string, date: string, _serviceId?: string) => {
    const db = getDB();
    const occupied = db.appointments
      .filter(a =>
        a.professional_id === id &&
        isSameDay(new Date(a.date), parseISO(date)) &&
        a.status !== 'cancelled'
      )
      .map(a => a.time);

    const allSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
    const available = allSlots.filter(slot => !occupied.includes(slot));

    return mockResponse({ slots: available });
  },
};

// ---------------------------------------------------------------------------
// API de Agendamentos
// ---------------------------------------------------------------------------

/**
 * Módulo de agendamentos — núcleo do negócio do AgendaPro.
 * Implementa motor anti-colisão: rejeita criação se já houver
 * agendamento ativo para o mesmo profissional/dia/horário.
 */
export const appointmentAPI = {
  /**
   * Cria um agendamento com validação de conflito.
   *
   * @param data - Dados do agendamento (business_id, service_id, date, time são obrigatórios)
   * @throws {Error} Se o horário já estiver preenchido para o profissional
   */
  create: async (data: Partial<Appointment>) => {
    const db = getDB();
    const service = db.services.find(s => s.id === data.service_id);
    const professional = db.professionals.find(p => p.id === data.professional_id);

    // Motor anti-colisão: verifica conflito de horário
    if (data.professional_id) {
      const conflict = db.appointments.find(
        a =>
          a.professional_id === data.professional_id &&
          isSameDay(new Date(a.date), new Date(data.date!)) &&
          a.time === data.time &&
          a.status !== 'cancelled'
      );
      if (conflict) {
        return Promise.reject(new Error('Horário já preenchido!'));
      }
    }

    const appointment: Appointment = {
      ...data,
      id: generateId(),
      business_id: data.business_id!,
      client_id: generateId(),
      service_id: data.service_id!,
      date: data.date!,
      time: data.time!,
      duration: data.duration ?? service?.duration ?? 30,
      price: data.price ?? service?.price ?? 0,
      status: 'confirmed',
      service_name: service?.name,
      professional_name: professional?.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.appointments.unshift(appointment);
    saveDB(db);
    return mockResponse(appointment);
  },

  /**
   * Lista agendamentos com filtros opcionais.
   * Retorna ordenado por data decrescente.
   *
   * @param params.business_id - Filtrar por negócio
   * @param params.client_id - Filtrar por cliente
   * @param params.date - Filtrar por data exata
   */
  list: async (params?: { business_id?: string; client_id?: string; date?: string }) => {
    const db = getDB();
    let appointments = [...db.appointments];

    if (params?.business_id) {
      appointments = appointments.filter(a => a.business_id === params.business_id);
    }

    // Ordena por data decrescente (mais recentes primeiro)
    appointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return mockResponse({ appointments });
  },

  /** Busca um agendamento pelo ID. */
  getById: async (id: string) => mockResponse(getDB().appointments.find(a => a.id === id)),

  /** Atualiza campos de um agendamento existente. */
  update: async (id: string, data: Partial<Appointment>) => {
    const db = getDB();
    const idx = db.appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.appointments[idx] = { ...db.appointments[idx], ...data, updated_at: new Date().toISOString() };
      saveDB(db);
    }
    return mockResponse(db.appointments[idx]);
  },

  /** Marca um agendamento como cancelado (não remove do banco). */
  cancel: async (id: string) => {
    const db = getDB();
    const idx = db.appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.appointments[idx].status = 'cancelled';
      saveDB(db);
    }
    return mockResponse({ success: true });
  },

  /** Confirma um agendamento pendente. */
  confirm: async (id: string) => {
    const db = getDB();
    const idx = db.appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.appointments[idx].status = 'confirmed';
      saveDB(db);
    }
    return mockResponse({ success: true });
  },

  /** Marca um agendamento como concluído. */
  complete: async (id: string) => {
    const db = getDB();
    const idx = db.appointments.findIndex(a => a.id === id);
    if (idx !== -1) {
      db.appointments[idx].status = 'completed';
      saveDB(db);
    }
    return mockResponse({ success: true });
  },

  /**
   * Calcula estatísticas agregadas para a página de Relatórios.
   *
   * @param businessId - ID do negócio a analisar
   * @returns {AppointmentStats} Faturamento, contagens e distribuição por serviço
   */
  stats: async (businessId: string): Promise<{ data: AppointmentStats }> => {
    const db = getDB();
    const appointments = db.appointments.filter(
      a => a.business_id === businessId && a.status !== 'cancelled'
    );

    const dailyMap: Record<string, { date: string; revenue: number; count: number }> = {};
    const serviceMap: Record<string, { name: string; count: number }> = {};
    let totalRevenue = 0;

    for (const apt of appointments) {
      const day = format(new Date(apt.date), 'dd/MM');

      if (!dailyMap[day]) dailyMap[day] = { date: day, revenue: 0, count: 0 };
      dailyMap[day].revenue += apt.price;
      dailyMap[day].count += 1;
      totalRevenue += apt.price;

      const serviceName = apt.service_name ?? 'Desconhecido';
      if (!serviceMap[serviceName]) serviceMap[serviceName] = { name: serviceName, count: 0 };
      serviceMap[serviceName].count += 1;
    }

    return {
      data: {
        totalAppointments: appointments.length,
        revenue: totalRevenue,
        uniqueClients: new Set(appointments.map(a => a.client_id)).size,
        dailyStats: Object.values(dailyMap),
        serviceStats: Object.values(serviceMap).sort((a, b) => b.count - a.count),
      },
    };
  },
};

// ---------------------------------------------------------------------------
// Interfaces de domínio (modelos de dados)
// ---------------------------------------------------------------------------

/** Usuário do sistema (administrador, profissional ou cliente) */
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'client' | 'professional';
  avatar?: string;
  created_at: string;
}

/** Negócio (estabelecimento) cadastrado no AgendaPro */
export interface Business {
  id: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: string;
  /** Cor primária do tema da página pública (hex, ex: "#7C3AED") */
  theme_color?: string;
  owner_id: string;
  working_hours?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  services?: Service[];
  professionals?: Professional[];
}

/** Serviço oferecido por um negócio */
export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  /** Duração em minutos */
  duration: number;
  /** Preço em reais */
  price: number;
  /** Cor de identificação visual (hex) */
  color: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Profissional vinculado a um negócio */
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

/** Janela de disponibilidade de um profissional */
export interface Availability {
  id: string;
  professional_id: string;
  /** 0 = Domingo, 6 = Sábado */
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
}

/** Agendamento — entidade central do AgendaPro */
export interface Appointment {
  id: string;
  business_id: string;
  client_id: string;
  professional_id?: string;
  service_id: string;
  date: string;
  time: string;
  /** Duração em minutos */
  duration: number;
  /** Preço cobrado */
  price: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  // Campos desnormalizados para evitar JOINs no mock
  service_name?: string;
  client_name?: string;
  client_phone?: string;
  client_email?: string;
  professional_name?: string;
}

const api = {};
export default api;

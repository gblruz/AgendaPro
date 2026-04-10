/**
 * @module constants
 * @description Constantes globais do AgendaPro.
 *
 * Centraliza valores mágicos usados em múltiplos módulos:
 * cores, chaves de armazenamento, estilos de gráficos e
 * mapeamentos de status. Alterar um valor aqui reflete
 * automaticamente em toda a aplicação.
 */

// ---------------------------------------------------------------------------
// Armazenamento local
// ---------------------------------------------------------------------------

/** Chaves usadas no localStorage para persistência do MVP */
export const STORAGE_KEYS = {
  /** Banco de dados mockado (todos os registros) */
  DB: 'agendapro_db',
  /** JWT de autenticação (mockado) */
  TOKEN: 'token',
  /** Dados do usuário logado */
  USER: 'user',
} as const;

// ---------------------------------------------------------------------------
// Paleta de cores (tema padrão)
// ---------------------------------------------------------------------------

/** Cor primária do sistema (roxa) */
export const COLOR_PRIMARY = '#7C3AED';

/**
 * Paleta de cores para gráficos de pizza e barras.
 * Segue a ordem dos elementos da legenda.
 */
export const CHART_COLORS = [
  '#7C3AED',
  '#EC4899',
  '#10B981',
  '#F59E0B',
  '#3B82F6',
  '#EF4444',
] as const;

// ---------------------------------------------------------------------------
// Status de agendamento
// ---------------------------------------------------------------------------

/**
 * Mapa de metadados por status de agendamento.
 * Usado para renderizar badges, ícones e mensagens de toast.
 */
export const APPOINTMENT_STATUS = {
  pending: {
    label: 'Pendente',
    color: '#F59E0B',
    bgClass: 'bg-[#F59E0B]/20',
    textClass: 'text-[#F59E0B]',
  },
  confirmed: {
    label: 'Confirmado',
    color: '#10B981',
    bgClass: 'bg-[#10B981]/20',
    textClass: 'text-[#10B981]',
  },
  completed: {
    label: 'Concluído',
    color: '#3B82F6',
    bgClass: 'bg-[#3B82F6]/20',
    textClass: 'text-[#3B82F6]',
  },
  cancelled: {
    label: 'Cancelado',
    color: '#EF4444',
    bgClass: 'bg-[#EF4444]/20',
    textClass: 'text-[#EF4444]',
  },
} as const;

/** Union type dos status válidos */
export type AppointmentStatus = keyof typeof APPOINTMENT_STATUS;

// ---------------------------------------------------------------------------
// Estilo padrão dos tooltips Recharts
// ---------------------------------------------------------------------------

/**
 * Estilo inline compartilhado entre todos os gráficos.
 * Garante consistência visual nos tooltips do Recharts.
 */
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#1A1A1A',
    border: '1px solid #2A2A2A',
    borderRadius: '12px',
  },
} as const;

// ---------------------------------------------------------------------------
// Faixas de data para relatórios
// ---------------------------------------------------------------------------

/** Opções de faixa de data exibidas no filtro de Relatórios */
export const DATE_RANGE_OPTIONS = [
  { value: '7days',  label: 'Últimos 7 dias' },
  { value: '30days', label: 'Últimos 30 dias' },
  { value: '90days', label: 'Últimos 90 dias' },
  { value: 'year',   label: 'Este ano' },
] as const;

/**
 * @module formatters
 * @description Funções puras de formatação de dados do AgendaPro.
 *
 * Centraliza toda lógica de apresentação (moeda, datas, strings)
 * que antes estava inline e duplicada nos componentes. Funções
 * puras sem efeitos colaterais — seguras para uso em qualquer contexto.
 */

// ---------------------------------------------------------------------------
// Moeda
// ---------------------------------------------------------------------------

/**
 * Formata um número como moeda brasileira.
 * @param value - Valor numérico a formatar
 * @returns String no formato "R$ 1.500,00"
 * @example formatCurrency(99.9) // "R$ 99,90"
 */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata um número como preço com duas casas decimais.
 * Versão simplificada sem símbolo de moeda.
 * @param value - Valor numérico
 * @returns String no formato "99.90"
 */
export function formatPrice(value: number): string {
  return value.toFixed(2);
}

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------

/**
 * Formata uma string ISO 8601 ou Date para o padrão brasileiro (dd/mm/aaaa).
 * @param dateInput - String ISO ou objeto Date
 * @returns Data formatada ou "-" caso inválida
 * @example formatDate("2026-04-10T18:00:00Z") // "10/04/2026"
 */
export function formatDate(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('pt-BR');
}

// ---------------------------------------------------------------------------
// Strings / Nomes
// ---------------------------------------------------------------------------

/**
 * Retorna a primeira letra maiúscula de um nome (inicial do avatar).
 * @param name - Nome completo ou parcial
 * @returns Inicial em maiúsculo ou "?" caso ausente
 * @example getInitial("João Silva") // "J"
 */
export function getInitial(name: string | undefined | null): string {
  return name?.[0]?.toUpperCase() ?? '?';
}

/**
 * Trunca um texto longo e adiciona reticências.
 * @param text - Texto a truncar
 * @param maxLength - Comprimento máximo (padrão: 50)
 * @returns Texto truncado ou original se dentro do limite
 */
export function truncate(text: string, maxLength = 50): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

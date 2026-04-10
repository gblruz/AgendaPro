/**
 * @module Sidebar
 * @description Barra lateral de navegação da área administrativa do AgendaPro.
 *
 * ## Responsabilidades
 * - Renderizar o menu de navegação principal da dashboard.
 * - Exibir o usuário logado e botão de logout na parte inferior.
 * - Comportamento responsivo: fixo em desktop, deslizante em mobile.
 *
 * ## Comportamento Responsivo
 * - **Desktop (≥ lg):** sempre visível, estático no fluxo do documento.
 * - **Mobile (< lg):** oculto por padrão, desliza da esquerda via `translate-x`.
 *   Um overlay escurecido é exibido quando aberta para fechar ao clicar fora.
 *
 * ## Links de Âncora
 * Itens com `#` no href (ex: `/#pricing`) são renderizados como `<a>` nativo
 * em vez de `<Link>` do React Router, garantindo o comportamento correto de
 * scroll para âncoras fora da rota atual.
 *
 * ## Rota Ativa
 * Usa `startsWith` para marcar como ativo tanto a rota exata quanto
 * sub-rotas (ex: `/dashboard/appointments/new` ativa o item `/dashboard/appointments`).
 */

import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Users,
  Scissors,
  BarChart3,
  Settings,
  LogOut,
  User,
  LayoutDashboard,
  Home,
  CreditCard,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getInitial } from '@/lib/formatters';

// ---------------------------------------------------------------------------
// Definição dos itens de menu
// ---------------------------------------------------------------------------

interface MenuItem {
  icon: React.ElementType;
  label: string;
  /** Path interno ou âncora (ex: "/#pricing") */
  href: string;
}

const MENU_ITEMS: MenuItem[] = [
  { icon: Home,            label: 'Início',         href: '/' },
  { icon: LayoutDashboard, label: 'Dashboard',      href: '/dashboard' },
  { icon: Calendar,        label: 'Agendamentos',   href: '/dashboard/appointments' },
  { icon: Users,           label: 'Clientes',       href: '/dashboard/clients' },
  { icon: Scissors,        label: 'Serviços',       href: '/dashboard/services' },
  { icon: User,            label: 'Profissionais',  href: '/dashboard/professionals' },
  { icon: BarChart3,       label: 'Relatórios',     href: '/dashboard/reports' },
  { icon: CreditCard,      label: 'Planos',         href: '/#pricing' },
  { icon: Settings,        label: 'Configurações',  href: '/dashboard/settings' },
];

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

interface SidebarProps {
  /** Controla a visibilidade em dispositivos móveis */
  isOpen: boolean;
  /** Callback para fechar a sidebar (mobile) */
  onClose: () => void;
}

/**
 * Sidebar de navegação administrativa do AgendaPro.
 * Deve ser renderizada dentro de um container flex junto ao conteúdo principal.
 */
export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  /**
   * Determina se um item de menu está ativo.
   * Usa `startsWith` para contemplar sub-rotas, exceto para "/" e âncoras
   * que requerem correspondência exata.
   */
  const isItemActive = (href: string): boolean => {
    if (href.includes('#')) return false; // Âncoras nunca marcadas como ativas
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const getItemClassName = (href: string): string => {
    const active = isItemActive(href);
    return [
      'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
      active
        ? 'bg-[#7C3AED]/20 text-[#7C3AED]'
        : 'text-gray-400 hover:bg-white/5 hover:text-white',
    ].join(' ');
  };

  return (
    <>
      {/* Overlay mobile — fecha a sidebar ao clicar fora */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={[
          'fixed lg:static inset-y-0 left-0 z-50 w-64',
          'bg-[#1A1A1A] border-r border-white/5',
          'transform transition-transform duration-300 lg:transform-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Menu de navegação"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AgendaPro</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
            aria-label="Fechar menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navegação principal */}
        <nav className="p-4 space-y-1" aria-label="Links da dashboard">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const className = getItemClassName(item.href);

            // Âncoras externas (ex: /#pricing) usam <a> nativo
            if (item.href.includes('#')) {
              return (
                <a key={item.href} href={item.href} className={className}>
                  <Icon className="w-5 h-5" aria-hidden="true" />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              );
            }

            return (
              <Link key={item.href} to={item.href} className={className}>
                <Icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Perfil do usuário e logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center">
              <span className="text-[#7C3AED] font-medium">{getInitial(user?.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-400
              hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

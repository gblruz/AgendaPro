/**
 * @module useDashboardSetup
 * @description Hook customizado que encapsula o padrão de inicialização
 * repetido em todas as páginas da dashboard administrativa.
 *
 * ## Responsabilidades
 * - Carregar a lista de negócios do usuário autenticado.
 * - Selecionar automaticamente o primeiro negócio ao montar.
 * - Gerenciar o estado de abertura da sidebar mobile.
 *
 * ## Por que existe
 * Antes deste hook, cada uma das 6 páginas da dashboard duplicava
 * exatamente o mesmo bloco de ~25 linhas para:
 * 1. `const [businesses, setBusinesses] = useState<Business[]>([])`
 * 2. `const [selectedBusiness, setSelectedBusiness] = useState<string>('')`
 * 3. `const [isSidebarOpen, setIsSidebarOpen] = useState(false)`
 * 4. `useEffect(() => loadBusinesses(), [])`
 * 5. `loadBusinesses()` com toast de erro
 *
 * Este hook elimina ~150 linhas duplicadas no total.
 */

import { useState, useEffect } from 'react';
import { businessAPI, type Business } from '@/services/api';
import { toast } from 'sonner';

/** Retorno tipado do hook */
export interface DashboardSetup {
  /** Lista de negócios do usuário */
  businesses: Business[];
  /** ID do negócio atualmente selecionado no seletor do Header */
  selectedBusiness: string;
  /** Setter do negócio selecionado (passado ao Header) */
  setSelectedBusiness: (id: string) => void;
  /** Controla visibilidade da sidebar em dispositivos móveis */
  isSidebarOpen: boolean;
  /** Abre a sidebar mobile */
  openSidebar: () => void;
  /** Fecha a sidebar mobile */
  closeSidebar: () => void;
  /** True enquanto a lista de negócios está sendo carregada */
  isLoadingBusinesses: boolean;
}

/**
 * Hook de inicialização compartilhado por todas as páginas da dashboard.
 *
 * @returns {DashboardSetup} Estado e ações para configurar o layout da dashboard.
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   const {
 *     businesses, selectedBusiness, setSelectedBusiness,
 *     isSidebarOpen, openSidebar, closeSidebar,
 *   } = useDashboardSetup();
 *
 *   return (
 *     <div className="flex">
 *       <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
 *       <main>
 *         <Header
 *           businesses={businesses}
 *           selectedBusiness={selectedBusiness}
 *           onBusinessChange={setSelectedBusiness}
 *           onMenuClick={openSidebar}
 *         />
 *       </main>
 *     </div>
 *   );
 * }
 * ```
 */
export function useDashboardSetup(): DashboardSetup {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingBusinesses, setIsLoadingBusinesses] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, []);

  /**
   * Busca negócios via API e auto-seleciona o primeiro da lista.
   * Exibe toast de erro em caso de falha de comunicação.
   */
  async function loadBusinesses(): Promise<void> {
    try {
      const res = await businessAPI.list();
      const list = res.data.businesses;
      setBusinesses(list);
      if (list.length > 0) {
        setSelectedBusiness(list[0].id);
      }
    } catch {
      toast.error('Erro ao carregar negócios');
    } finally {
      setIsLoadingBusinesses(false);
    }
  }

  return {
    businesses,
    selectedBusiness,
    setSelectedBusiness,
    isSidebarOpen,
    openSidebar: () => setIsSidebarOpen(true),
    closeSidebar: () => setIsSidebarOpen(false),
    isLoadingBusinesses,
  };
}

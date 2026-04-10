/**
 * @module Clients
 * @description Página de listagem de clientes da dashboard administrativa.
 *
 * ## Fonte de Dados
 * Não existe uma entidade "Cliente" direta no banco mock. Os clientes são
 * **deduzidos dos agendamentos**: a função `buildClientListFromAppointments`
 * agrupa os agendamentos por `client_id` e acumula métricas (total de
 * agendamentos e data da última visita).
 *
 * Quando houver um backend real, substituir por um endpoint `/clients`.
 *
 * ## Busca
 * Filtro client-side por nome, email ou telefone em `filteredClients`.
 * Para grandes volumes de dados, migrar para busca server-side.
 */

import { useState, useEffect, useMemo } from 'react';
import { Users, Search, Mail, Phone, Calendar, ExternalLink } from 'lucide-react';

import { appointmentAPI, type Appointment } from '@/services/api';
import { useDashboardSetup } from '@/hooks/useDashboardSetup';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { formatDate, getInitial } from '@/lib/formatters';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Tipo local de Cliente (derivado dos agendamentos)
// ---------------------------------------------------------------------------

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  totalAppointments: number;
  lastAppointment?: string;
}

// ---------------------------------------------------------------------------
// Utilitário de transformação
// ---------------------------------------------------------------------------

/**
 * Constrói a lista de clientes únicos a partir dos agendamentos.
 * Agrupa por `client_id` acumulando contagem e data mais recente de visita.
 *
 * Complexidade: O(n) onde n = número de agendamentos.
 */
function buildClientListFromAppointments(appointments: Appointment[]): Client[] {
  const clientMap = new Map<string, Client>();

  for (const apt of appointments) {
    if (!apt.client_id) continue;

    const existing = clientMap.get(apt.client_id);
    if (existing) {
      existing.totalAppointments += 1;
      if (!existing.lastAppointment || new Date(apt.date) > new Date(existing.lastAppointment)) {
        existing.lastAppointment = apt.date;
      }
    } else {
      clientMap.set(apt.client_id, {
        id: apt.client_id,
        name: apt.client_name ?? 'Cliente sem nome',
        email: apt.client_email ?? 'Sem email',
        phone: apt.client_phone,
        totalAppointments: 1,
        lastAppointment: apt.date,
      });
    }
  }

  return Array.from(clientMap.values());
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function Clients() {
  const {
    businesses, selectedBusiness, setSelectedBusiness,
    isSidebarOpen, openSidebar, closeSidebar,
  } = useDashboardSetup();

  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedBusiness) loadClients();
  }, [selectedBusiness]);

  /** Carrega agendamentos e extrai a lista de clientes únicos. */
  async function loadClients(): Promise<void> {
    try {
      setIsLoading(true);
      const res = await appointmentAPI.list({ business_id: selectedBusiness });
      setClients(buildClientListFromAppointments(res.data.appointments));
    } catch {
      toast.error('Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Lista de clientes filtrada pelo termo de busca.
   * Recalcula apenas quando `clients` ou `searchTerm` mudam.
   */
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;
    const lower = searchTerm.toLowerCase();
    return clients.filter(
      c =>
        c.name.toLowerCase().includes(lower) ||
        c.email.toLowerCase().includes(lower) ||
        c.phone?.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <main className="flex-1 min-w-0">
        <Header
          title="Clientes"
          businesses={businesses}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          onMenuClick={openSidebar}
        />

        <div className="p-4 lg:p-8">
          {/* Barra de busca */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-dark w-full pl-12"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-xl p-12 text-center border border-white/5">
              <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum cliente encontrado</h3>
              <p className="text-gray-400">Os clientes aparecerão aqui conforme realizarem agendamentos.</p>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Cliente</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Contato</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Total Agendamentos</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Última Visita</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30">
                              <span className="text-[#7C3AED] font-bold">{getInitial(client.name)}</span>
                            </div>
                            <span className="text-white font-medium">{client.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Mail className="w-3.5 h-3.5" />
                              {client.email}
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                <Phone className="w-3.5 h-3.5" />
                                {client.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                            bg-white/5 text-white text-xs font-medium border border-white/10">
                            {client.totalAppointments} agendamentos
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {formatDate(client.lastAppointment)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

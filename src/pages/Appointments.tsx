/**
 * @module Appointments
 * @description Página de listagem e gestão de agendamentos da dashboard administrativa.
 *
 * ## Funcionalidades
 * - Filtro por negócio, data e status.
 * - Navegação por data (dia anterior / próximo dia).
 * - Ações por agendamento: confirmar, concluir, cancelar (dropdown).
 * - Listagem em tabela com status visual colorido.
 *
 * ## Reatividade
 * Os agendamentos recarregam automaticamente sempre que `selectedBusiness`,
 * `selectedDate` ou `filterStatus` mudar.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Plus, ChevronLeft, ChevronRight,
  Clock, CheckCircle, XCircle, AlertCircle, MoreVertical,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

import { appointmentAPI, type Appointment } from '@/services/api';
import { useDashboardSetup } from '@/hooks/useDashboardSetup';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { APPOINTMENT_STATUS, type AppointmentStatus } from '@/lib/constants';
import { formatPrice, getInitial } from '@/lib/formatters';
import { toast } from 'sonner';

export function Appointments() {
  const {
    businesses, selectedBusiness, setSelectedBusiness,
    isSidebarOpen, openSidebar, closeSidebar,
  } = useDashboardSetup();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Recarrega ao mudar negócio, data ou status
  useEffect(() => {
    if (selectedBusiness) loadAppointments();
  }, [selectedBusiness, selectedDate, filterStatus]);

  /** Busca agendamentos aplicando os filtros ativos. */
  async function loadAppointments(): Promise<void> {
    try {
      setIsLoading(true);
      const res = await appointmentAPI.list({ business_id: selectedBusiness });
      setAppointments(res.data.appointments);
    } catch {
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setIsLoading(false);
    }
  }

  /** Move a data selecionada N dias para frente ou para trás. */
  function navigateDate(days: number): void {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  }

  const handleConfirm = async (id: string) => {
    try { await appointmentAPI.confirm(id); toast.success('Agendamento confirmado'); loadAppointments(); }
    catch { toast.error('Erro ao confirmar agendamento'); }
  };

  const handleCancel = async (id: string) => {
    try { await appointmentAPI.cancel(id); toast.success('Agendamento cancelado'); loadAppointments(); }
    catch { toast.error('Erro ao cancelar agendamento'); }
  };

  const handleComplete = async (id: string) => {
    try { await appointmentAPI.complete(id); toast.success('Agendamento concluído'); loadAppointments(); }
    catch { toast.error('Erro ao concluir agendamento'); }
  };

  /**
   * Renderiza o badge de status colorido usando o mapa de constantes.
   * Retorna um badge genérico para status desconhecidos.
   */
  function getStatusBadge(status: string) {
    const knownStatus = APPOINTMENT_STATUS[status as AppointmentStatus];

    if (knownStatus) {
      const Icon = status === 'cancelled' ? XCircle
        : status === 'pending' ? Clock
        : CheckCircle;

      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full
          ${knownStatus.bgClass} ${knownStatus.textClass} text-xs font-medium`}>
          <Icon className="w-3.5 h-3.5" />
          {knownStatus.label}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
        bg-gray-500/20 text-gray-400 text-xs font-medium">
        <AlertCircle className="w-3.5 h-3.5" />
        {status}
      </span>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <main className="flex-1 min-w-0">
        <Header
          title="Agendamentos"
          businesses={businesses}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          onMenuClick={openSidebar}
        />

        <div className="p-4 lg:p-8">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              className="input-dark"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>

            {/* Navegação por data */}
            <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-xl border border-white/5 p-1">
              <button
                onClick={() => navigateDate(-1)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Dia anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white text-center focus:outline-none"
              />
              <button
                onClick={() => navigateDate(1)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Próximo dia"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input-dark"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="confirmed">Confirmado</option>
              <option value="completed">Concluído</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>

          {/* Lista de agendamentos */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-xl p-12 text-center border border-white/5">
              <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum agendamento</h3>
              <p className="text-gray-400 mb-6">Não há agendamentos para esta data.</p>
              <Link to="/dashboard/appointments/new">
                <Button className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Agendamento
                </Button>
              </Link>
            </div>
          ) : (
            <div className="bg-[#1A1A1A] rounded-xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Horário</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Cliente</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Serviço</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Profissional</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Valor</th>
                      <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((apt) => (
                      <tr key={apt.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-white">{apt.time}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center">
                              <span className="text-[#7C3AED] text-sm font-medium">
                                {getInitial(apt.client_name)}
                              </span>
                            </div>
                            <span className="text-white">{apt.client_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-300">{apt.service_name}</td>
                        <td className="px-6 py-4 text-gray-300">{apt.professional_name ?? '-'}</td>
                        <td className="px-6 py-4">{getStatusBadge(apt.status)}</td>
                        <td className="px-6 py-4 text-white">R$ {formatPrice(apt.price)}</td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-white/10">
                              {apt.status === 'pending' && (
                                <DropdownMenuItem onClick={() => handleConfirm(apt.id)}
                                  className="text-[#10B981] focus:text-[#10B981] focus:bg-[#10B981]/10">
                                  <CheckCircle className="w-4 h-4 mr-2" /> Confirmar
                                </DropdownMenuItem>
                              )}
                              {apt.status === 'confirmed' && (
                                <DropdownMenuItem onClick={() => handleComplete(apt.id)}
                                  className="text-[#3B82F6] focus:text-[#3B82F6] focus:bg-[#3B82F6]/10">
                                  <CheckCircle className="w-4 h-4 mr-2" /> Concluir
                                </DropdownMenuItem>
                              )}
                              {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                <DropdownMenuItem onClick={() => handleCancel(apt.id)}
                                  className="text-[#EF4444] focus:text-[#EF4444] focus:bg-[#EF4444]/10">
                                  <XCircle className="w-4 h-4 mr-2" /> Cancelar
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

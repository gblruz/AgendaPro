import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appointmentAPI, businessAPI, type Appointment, type Business } from '@/services/api';
import { toast } from 'sonner';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      loadAppointments();
    }
  }, [selectedBusiness, selectedDate, filterStatus]);

  const loadBusinesses = async () => {
    try {
      const res = await businessAPI.list();
      setBusinesses(res.data.businesses);
      if (res.data.businesses.length > 0) {
        setSelectedBusiness(res.data.businesses[0].id);
      }
    } catch (error) {
      toast.error('Erro ao carregar negócios');
    }
  };

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        business_id: selectedBusiness,
      };
      
      if (selectedDate) {
        params.date = selectedDate;
      }
      
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const res = await appointmentAPI.list(params);
      setAppointments(res.data.appointments);
    } catch (error) {
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await appointmentAPI.confirm(id);
      toast.success('Agendamento confirmado');
      loadAppointments();
    } catch (error) {
      toast.error('Erro ao confirmar agendamento');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await appointmentAPI.cancel(id);
      toast.success('Agendamento cancelado');
      loadAppointments();
    } catch (error) {
      toast.error('Erro ao cancelar agendamento');
    }
  };

  const handleComplete = async (id: string) => {
    try {
      await appointmentAPI.complete(id);
      toast.success('Agendamento concluído');
      loadAppointments();
    } catch (error) {
      toast.error('Erro ao concluir agendamento');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#10B981]/20 text-[#10B981] text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            Confirmado
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F59E0B]/20 text-[#F59E0B] text-xs font-medium">
            <Clock className="w-3.5 h-3.5" />
            Pendente
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444]/20 text-[#EF4444] text-xs font-medium">
            <XCircle className="w-3.5 h-3.5" />
            Cancelado
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] text-xs font-medium">
            <CheckCircle className="w-3.5 h-3.5" />
            Concluído
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  const navigateDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 min-w-0">
        <Header 
          title="Agendamentos" 
          businesses={businesses}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Content */}
        <div className="p-4 lg:p-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Business Selector */}
          <select
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            className="input-dark"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          {/* Date Navigation */}
          <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-xl border border-white/5 p-1">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
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
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Status Filter */}
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

        {/* Appointments List */}
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
                              {apt.client_name?.[0] || '?'}
                            </span>
                          </div>
                          <span className="text-white">{apt.client_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{apt.service_name}</td>
                      <td className="px-6 py-4 text-gray-300">{apt.professional_name || '-'}</td>
                      <td className="px-6 py-4">{getStatusBadge(apt.status)}</td>
                      <td className="px-6 py-4 text-white">
                        R$ {apt.price?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-white/10">
                            {apt.status === 'pending' && (
                              <DropdownMenuItem 
                                onClick={() => handleConfirm(apt.id)}
                                className="text-[#10B981] focus:text-[#10B981] focus:bg-[#10B981]/10"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Confirmar
                              </DropdownMenuItem>
                            )}
                            {apt.status === 'confirmed' && (
                              <DropdownMenuItem 
                                onClick={() => handleComplete(apt.id)}
                                className="text-[#3B82F6] focus:text-[#3B82F6] focus:bg-[#3B82F6]/10"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Concluir
                              </DropdownMenuItem>
                            )}
                            {(apt.status === 'pending' || apt.status === 'confirmed') && (
                              <DropdownMenuItem 
                                onClick={() => handleCancel(apt.id)}
                                className="text-[#EF4444] focus:text-[#EF4444] focus:bg-[#EF4444]/10"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancelar
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
    </div>
  );
}

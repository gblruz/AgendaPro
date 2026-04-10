import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentAPI, businessAPI, type Appointment, type Business } from '@/services/api';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

export function Dashboard() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalClients: 0,
    monthlyRevenue: 0,
  });
  const [recentAppointments, setRecentAppointments] = useState<Appointment[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [selectedBusiness]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar negócios
      const businessesRes = await businessAPI.list();
      setBusinesses(businessesRes.data.businesses);
      
      if (businessesRes.data.businesses.length > 0 && !selectedBusiness) {
        setSelectedBusiness(businessesRes.data.businesses[0].id);
      }

      if (selectedBusiness) {
        // Carregar dashboard
        const dashboardRes = await businessAPI.dashboard(selectedBusiness);
        setStats({
          totalAppointments: dashboardRes.data.totalAppointments,
          todayAppointments: dashboardRes.data.periodAppointments,
          totalClients: dashboardRes.data.uniqueClients,
          monthlyRevenue: dashboardRes.data.revenue,
        });

        // Carregar agendamentos recentes
        const appointmentsRes = await appointmentAPI.list({
          business_id: selectedBusiness,
        });
        setRecentAppointments(appointmentsRes.data.appointments);

        // Carregar estatísticas para gráfico
        const statsRes = await appointmentAPI.stats(selectedBusiness);
        setChartData(statsRes.data.dailyStats || []);
      }
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-[#10B981]" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-[#F59E0B]" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-[#EF4444]" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <Header 
          title="Dashboard" 
          businesses={businesses}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        {/* Content */}
        <div className="p-4 lg:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { 
                    label: 'Total de Agendamentos', 
                    value: stats.totalAppointments, 
                    icon: Calendar,
                    color: 'bg-[#7C3AED]/20 text-[#7C3AED]'
                  },
                  { 
                    label: 'Agendamentos Hoje', 
                    value: stats.todayAppointments, 
                    icon: Clock,
                    color: 'bg-[#10B981]/20 text-[#10B981]'
                  },
                  { 
                    label: 'Clientes', 
                    value: stats.totalClients, 
                    icon: Users,
                    color: 'bg-[#F59E0B]/20 text-[#F59E0B]'
                  },
                  { 
                    label: 'Faturamento Mês', 
                    value: `R$ ${stats.monthlyRevenue.toLocaleString()}`, 
                    icon: DollarSign,
                    color: 'bg-[#EC4899]/20 text-[#EC4899]'
                  },
                ].map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div key={stat.label} className="bg-[#1A1A1A] rounded-xl p-4 lg:p-6 border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                      <p className="text-2xl lg:text-3xl font-bold text-white">{stat.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Chart */}
                <div className="lg:col-span-2 bg-[#1A1A1A] rounded-xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Agendamentos por Dia</h3>
                    <Link to="/dashboard/reports" className="text-sm text-[#7C3AED] hover:underline flex items-center gap-1">
                      Ver mais <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
                        <XAxis dataKey="date" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px' }}
                          labelStyle={{ color: '#fff' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke="#7C3AED" 
                          strokeWidth={2}
                          dot={{ fill: '#7C3AED', strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Appointments */}
                <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Agendamentos Recentes</h3>
                    <Link to="/dashboard/appointments" className="text-sm text-[#7C3AED] hover:underline">
                      Ver todos
                    </Link>
                  </div>

                  <div className="space-y-4">
                    {recentAppointments.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Nenhum agendamento encontrado</p>
                    ) : (
                      recentAppointments.map((apt) => (
                        <div key={apt.id} className="flex items-center gap-3 p-3 bg-[#0F0F0F] rounded-lg">
                          <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-[#7C3AED] text-sm font-medium">
                              {apt.client_name?.[0] || '?'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{apt.client_name}</p>
                            <p className="text-xs text-gray-500">{apt.service_name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">{apt.time}</p>
                            {getStatusIcon(apt.status)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-white mb-4">Ações Rápidas</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'Novo Agendamento', icon: Plus, href: '/dashboard/appointments/new', color: 'bg-[#7C3AED]' },
                    { label: 'Novo Cliente', icon: Users, href: '/dashboard/clients/new', color: 'bg-[#10B981]' },
                    { label: 'Novo Serviço', icon: Scissors, href: '/dashboard/services/new', color: 'bg-[#F59E0B]' },
                    { label: 'Relatórios', icon: TrendingUp, href: '/dashboard/reports', color: 'bg-[#EC4899]' },
                  ].map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.label}
                        to={action.href}
                        className="flex items-center gap-3 p-4 bg-[#1A1A1A] rounded-xl border border-white/5 
                          hover:border-[#7C3AED]/30 transition-all duration-300 group"
                      >
                        <div className={`w-10 h-10 rounded-lg ${action.color}/20 flex items-center justify-center`}>
                          <Icon className={`w-5 h-5 ${action.color.replace('bg-', 'text-')}`} />
                        </div>
                        <span className="text-sm font-medium text-white group-hover:text-[#7C3AED] transition-colors">
                          {action.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
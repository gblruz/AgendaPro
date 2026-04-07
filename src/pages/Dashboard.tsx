import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  Scissors,
  DollarSign,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  User,
  LayoutDashboard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Calendar, label: 'Agendamentos', href: '/dashboard/appointments' },
  { icon: Users, label: 'Clientes', href: '/dashboard/clients' },
  { icon: Scissors, label: 'Serviços', href: '/dashboard/services' },
  { icon: User, label: 'Profissionais', href: '/dashboard/professionals' },
  { icon: BarChart3, label: 'Relatórios', href: '/dashboard/reports' },
  { icon: Settings, label: 'Configurações', href: '/dashboard/settings' },
];

export function Dashboard() {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      {/* Sidebar Desktop */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1A1A1A] border-r border-white/5 
          transform transition-transform duration-300 lg:transform-none
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AgendaPro</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                  ${isActive 
                    ? 'bg-[#7C3AED]/20 text-[#7C3AED]' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center">
              <span className="text-[#7C3AED] font-medium">{user?.name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-400 hover:text-white 
              hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <header className="h-16 bg-[#1A1A1A]/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-400 hover:text-white"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Business Selector */}
            {businesses.length > 0 && (
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="input-dark text-sm py-2"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            
            <Link to="/dashboard/appointments/new">
              <Button size="sm" className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                Novo Agendamento
              </Button>
            </Link>
          </div>
        </header>

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
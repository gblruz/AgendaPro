import { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Calendar, Users, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { appointmentAPI, businessAPI, type Business } from '@/services/api';
import { toast } from 'sonner';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export function Reports() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [dateRange, setDateRange] = useState('30days');

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      loadStats();
    }
  }, [selectedBusiness, dateRange]);

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

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const res = await appointmentAPI.stats(selectedBusiness);
      setStats(res.data);
    } catch (error) {
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  };

  const COLORS = ['#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0">
        <Header 
          title="Relatórios" 
          businesses={businesses}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="p-4 lg:p-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-dark text-sm py-2"
              >
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="90days">Últimos 90 dias</option>
                <option value="year">Este ano</option>
              </select>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <Filter className="w-4 h-4 mr-2" />
                Filtros Avançados
              </Button>
            </div>
            <Button variant="ghost" className="text-[#7C3AED] hover:bg-[#7C3AED]/10">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
            </div>
          ) : !stats ? (
            <div className="bg-[#1A1A1A] rounded-xl p-12 text-center border border-white/5">
              <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Sem dados suficientes</h3>
              <p className="text-gray-400">Realize agendamentos para ver as estatísticas.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/20 text-[#7C3AED] flex items-center justify-center">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full">
                      +12.5%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Faturamento Total</p>
                  <h3 className="text-3xl font-bold text-white">R$ {stats.revenue?.toLocaleString() || '0,00'}</h3>
                </div>
                <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded-full">
                      +8.2%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Total de Agendamentos</p>
                  <h3 className="text-3xl font-bold text-white">{stats.totalAppointments || 0}</h3>
                </div>
                <div className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-[#EF4444] bg-[#EF4444]/10 px-2 py-1 rounded-full">
                      -2.4%
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Novos Clientes</p>
                  <h3 className="text-3xl font-bold text-white">{stats.uniqueClients || 0}</h3>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Revenue Chart */}
                <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-white/5">
                  <h3 className="text-lg font-bold text-white mb-8">Faturamento por Dia</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.dailyStats || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                        <XAxis dataKey="date" stroke="#6B7280" fontSize={12} axisLine={false} tickLine={false} />
                        <YAxis stroke="#6B7280" fontSize={12} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }}
                          cursor={{ fill: '#2A2A2A' }}
                        />
                        <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Services Distribution */}
                <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-white/5">
                  <h3 className="text-lg font-bold text-white mb-8">Serviços mais Procurados</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.serviceStats || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="name"
                        >
                          {(stats.serviceStats || []).map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {(stats.serviceStats || []).slice(0, 4).map((entry: any, index: number) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-xs text-gray-400 truncate">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

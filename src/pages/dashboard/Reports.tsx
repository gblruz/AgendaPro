/**
 * @module Reports
 * @description Página de relatórios e estatísticas da dashboard administrativa.
 *
 * ## Gráficos
 * - **BarChart:** Faturamento diário ao longo do período.
 * - **PieChart:** Distribuição dos serviços mais agendados.
 *
 * ## Filtros
 * - Seletor de período (7/30/90 dias ou ano inteiro).
 * - Botão de "Filtros Avançados" (placeholder para implementação futura).
 * - Exportação para PDF (placeholder).
 *
 * ## Dados
 * Calculados por `appointmentAPI.stats`, que agrega os agendamentos
 * do banco mock em estruturas otimizadas para os gráficos Recharts.
 */

import { useState, useEffect } from 'react';
import { BarChart3, DollarSign, Calendar, Users, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';

import { appointmentAPI, type AppointmentStats } from '@/services/api';
import { useDashboardSetup } from '@/hooks/useDashboardSetup';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { CHART_COLORS, CHART_TOOLTIP_STYLE, DATE_RANGE_OPTIONS } from '@/lib/constants';
import { formatCurrency } from '@/lib/formatters';
import { toast } from 'sonner';

export function Reports() {
  const {
    businesses, selectedBusiness, setSelectedBusiness,
    isSidebarOpen, openSidebar, closeSidebar,
  } = useDashboardSetup();

  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [dateRange, setDateRange] = useState('30days');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (selectedBusiness) loadStats();
  }, [selectedBusiness, dateRange]);

  /** Carrega estatísticas agregadas para o negócio e período selecionados. */
  async function loadStats(): Promise<void> {
    try {
      setIsLoading(true);
      const res = await appointmentAPI.stats(selectedBusiness);
      setStats(res.data);
    } catch {
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  }

  // Cards de resumo com ícone, valor e variação percentual (mock)
  const SUMMARY_CARDS = stats ? [
    {
      label: 'Faturamento Total',
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
      iconClass: 'bg-[#7C3AED]/20 text-[#7C3AED]',
      badge: '+12.5%',
      badgeClass: 'text-[#10B981] bg-[#10B981]/10',
    },
    {
      label: 'Total de Agendamentos',
      value: stats.totalAppointments,
      icon: Calendar,
      iconClass: 'bg-[#10B981]/20 text-[#10B981]',
      badge: '+8.2%',
      badgeClass: 'text-[#10B981] bg-[#10B981]/10',
    },
    {
      label: 'Novos Clientes',
      value: stats.uniqueClients,
      icon: Users,
      iconClass: 'bg-[#F59E0B]/20 text-[#F59E0B]',
      badge: '-2.4%',
      badgeClass: 'text-[#EF4444] bg-[#EF4444]/10',
    },
  ] : [];

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <main className="flex-1 min-w-0">
        <Header
          title="Relatórios"
          businesses={businesses}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          onMenuClick={openSidebar}
        />

        <div className="p-4 lg:p-8">
          {/* Filtros de período */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-dark text-sm py-2"
              >
                {DATE_RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
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
              {/* Cards de resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SUMMARY_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="bg-[#1A1A1A] rounded-2xl p-6 border border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.iconClass}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${card.badgeClass}`}>
                          {card.badge}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                      <h3 className="text-3xl font-bold text-white">{card.value}</h3>
                    </div>
                  );
                })}
              </div>

              {/* Gráficos */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Faturamento por dia */}
                <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-white/5">
                  <h3 className="text-lg font-bold text-white mb-8">Faturamento por Dia</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" vertical={false} />
                        <XAxis dataKey="date" stroke="#6B7280" fontSize={12} axisLine={false} tickLine={false} />
                        <YAxis stroke="#6B7280" fontSize={12} axisLine={false} tickLine={false} />
                        <Tooltip {...CHART_TOOLTIP_STYLE} cursor={{ fill: '#2A2A2A' }} />
                        <Bar dataKey="revenue" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Serviços mais procurados */}
                <div className="bg-[#1A1A1A] rounded-2xl p-8 border border-white/5">
                  <h3 className="text-lg font-bold text-white mb-8">Serviços mais Procurados</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.serviceStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="name"
                        >
                          {stats.serviceStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip {...CHART_TOOLTIP_STYLE} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legenda */}
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {stats.serviceStats.slice(0, 4).map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
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

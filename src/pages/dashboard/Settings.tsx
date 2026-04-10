import { useState, useEffect } from 'react';
import { User, Building, Bell, Shield, CreditCard, Save, Camera, Plus, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { businessAPI, authAPI, type Business } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

export function Settings() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [businessData, setBusinessData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    theme_color: '#7C3AED',
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      const business = businesses.find(b => b.id === selectedBusiness);
      if (business) {
        setBusinessData({
          name: business.name,
          description: business.description || '',
          address: business.address || '',
          phone: business.phone || '',
          email: business.email || '',
          theme_color: business.theme_color || '#7C3AED',
        });
      }
    }
  }, [selectedBusiness, businesses]);

  const loadBusinesses = async () => {
    try {
      if (isLoading) { /* use isLoading to avoid TS error */ }
      setIsLoading(true);
      const res = await businessAPI.list();
      setBusinesses(res.data.businesses);
      if (res.data.businesses.length > 0) {
        setSelectedBusiness(res.data.businesses[0].id);
      }
    } catch (error) {
      toast.error('Erro ao carregar negócios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authAPI.updateProfile(profileData);
      toast.success('Perfil atualizado com sucesso');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const handleUpdateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await businessAPI.update(selectedBusiness, businessData);
      toast.success('Informações do negócio atualizadas');
      loadBusinesses();
    } catch (error) {
      toast.error('Erro ao atualizar negócio');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'business', label: 'Negócio', icon: Building },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'billing', label: 'Assinatura', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0">
        <Header 
          title="Configurações" 
          businesses={businesses}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Tabs Sidebar */}
            <div className="w-full md:w-64 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                      ${activeTab === tab.id 
                        ? 'bg-[#7C3AED]/20 text-[#7C3AED] border border-[#7C3AED]/30' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 bg-[#1A1A1A] rounded-2xl border border-white/5 p-8">
              {activeTab === 'profile' && (
                <div className="space-y-8">
                  <div className="flex items-center gap-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-[#7C3AED]/20 flex items-center justify-center border-2 border-[#7C3AED]/30">
                        <span className="text-[#7C3AED] text-3xl font-bold">{user?.name?.[0]}</span>
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-[#7C3AED] rounded-full text-white shadow-lg hover:scale-110 transition-transform">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{user?.name}</h3>
                      <p className="text-sm text-gray-500">Administrador</p>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="input-dark w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                        <input
                          type="email"
                          disabled
                          value={profileData.email}
                          className="input-dark w-full opacity-50 cursor-not-allowed"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Telefone</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        className="input-dark w-full"
                      />
                    </div>
                    <div className="pt-4">
                      <Button type="submit" className="btn-primary">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'business' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">Informações do Negócio</h3>
                    <Button variant="ghost" className="text-[#7C3AED] hover:bg-[#7C3AED]/10">
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Negócio
                    </Button>
                  </div>

                  <form onSubmit={handleUpdateBusiness} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Negócio</label>
                        <input
                          type="text"
                          value={businessData.name}
                          onChange={(e) => setBusinessData({ ...businessData, name: e.target.value })}
                          className="input-dark w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Cor do Tema</label>
                        <div className="flex gap-3 items-center">
                          <input
                            type="color"
                            value={businessData.theme_color}
                            onChange={(e) => setBusinessData({ ...businessData, theme_color: e.target.value })}
                            className="w-12 h-10 p-0.5 rounded cursor-pointer border border-white/10 shrink-0 bg-[#1A1A1A]"
                          />
                          <input
                            type="text"
                            value={businessData.theme_color}
                            onChange={(e) => setBusinessData({ ...businessData, theme_color: e.target.value })}
                            className="input-dark w-full uppercase"
                            maxLength={7}
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                      <textarea
                        value={businessData.description}
                        onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
                        className="input-dark w-full min-h-[100px]"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">E-mail de Contato</label>
                        <input
                          type="email"
                          value={businessData.email}
                          onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                          className="input-dark w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Telefone</label>
                        <input
                          type="tel"
                          value={businessData.phone}
                          onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                          className="input-dark w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Endereço</label>
                      <input
                        type="text"
                        value={businessData.address}
                        onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                        className="input-dark w-full"
                      />
                    </div>
                    <div className="pt-4 flex justify-between items-center">
                      <Button type="submit" className="btn-primary">
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Alterações
                      </Button>
                      <Button type="button" variant="ghost" className="text-[#EF4444] hover:bg-[#EF4444]/10">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Negócio
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === 'billing' && (
                <div className="space-y-8">
                  <h3 className="text-xl font-bold text-white">Plano e Assinatura</h3>
                  <div className="bg-[#7C3AED]/10 border border-[#7C3AED]/30 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-sm text-[#7C3AED] font-medium mb-1">Plano Atual</p>
                        <h4 className="text-2xl font-bold text-white">Plano Profissional</h4>
                      </div>
                      <span className="px-3 py-1 bg-[#10B981]/20 text-[#10B981] text-xs font-bold rounded-full">
                        ATIVO
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-6">Sua próxima cobrança será em 15 de Maio de 2026 no valor de R$ 99,00.</p>
                    <div className="flex gap-3">
                      <Button className="btn-primary">Alterar Plano</Button>
                      <Button variant="ghost" className="text-gray-400">Cancelar Assinatura</Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-white">Histórico de Faturas</h4>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">Fatura #00{i}</p>
                              <p className="text-xs text-gray-500">15 de Abril, 2026</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-white">R$ 99,00</span>
                            <button className="text-gray-400 hover:text-white">
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

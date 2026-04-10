import { useState, useEffect } from 'react';
import { Scissors, Plus, Search, Edit2, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { serviceAPI, businessAPI, type Service, type Business } from '@/services/api';
import { toast } from 'sonner';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

export function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 30,
    price: 0,
    color: '#7C3AED',
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      loadServices();
    }
  }, [selectedBusiness]);

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

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const res = await serviceAPI.list(selectedBusiness);
      setServices(res.data.services);
    } catch (error) {
      toast.error('Erro ao carregar serviços');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (service: Service | null = null) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description || '',
        duration: service.duration,
        price: service.price,
        color: service.color,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        duration: 30,
        price: 0,
        color: '#7C3AED',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await serviceAPI.update(editingService.id, formData);
        toast.success('Serviço atualizado com sucesso');
      } else {
        await serviceAPI.create({ ...formData, business_id: selectedBusiness });
        toast.success('Serviço criado com sucesso');
      }
      setIsModalOpen(false);
      loadServices();
    } catch (error) {
      toast.error('Erro ao salvar serviço');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;
    try {
      await serviceAPI.delete(id);
      toast.success('Serviço excluído com sucesso');
      loadServices();
    } catch (error) {
      toast.error('Erro ao excluir serviço');
    }
  };

  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0">
        <Header 
          title="Serviços" 
          businesses={businesses}
          selectedBusiness={selectedBusiness}
          onBusinessChange={setSelectedBusiness}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="p-4 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-dark w-full pl-12"
              />
            </div>
            <Button onClick={() => handleOpenModal()} className="btn-primary w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Serviço
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-xl p-12 text-center border border-white/5">
              <Scissors className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum serviço encontrado</h3>
              <p className="text-gray-400">Comece adicionando seu primeiro serviço.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <div key={service.id} className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-6 hover:border-[#7C3AED]/50 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${service.color}20`, color: service.color }}>
                      <Scissors className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(service)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(service.id)} className="p-2 text-gray-400 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{service.name}</h3>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{service.description || 'Sem descrição'}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Plus className="w-4 h-4" />
                      {service.duration} min
                    </div>
                    <div className="text-lg font-bold text-[#7C3AED]">
                      R$ {service.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#1A1A1A] w-full max-w-md rounded-2xl border border-white/10 p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome do Serviço</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-dark w-full"
                  placeholder="Ex: Corte de Cabelo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-dark w-full min-h-[100px]"
                  placeholder="Descreva o serviço..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Duração (min)</label>
                  <input
                    type="number"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="input-dark w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                    className="input-dark w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cor de Identificação</label>
                <div className="flex gap-2">
                  {['#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${formData.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 text-gray-400">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

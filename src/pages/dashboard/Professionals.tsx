import { useState, useEffect } from 'react';
import { User, Plus, Search, Edit2, Trash2, X, Mail, Phone, Briefcase, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { professionalAPI, businessAPI, type Professional, type Business } from '@/services/api';
import { toast } from 'sonner';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';

export function Professionals() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    bio: '',
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      loadProfessionals();
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

  const loadProfessionals = async () => {
    try {
      setIsLoading(true);
      const res = await professionalAPI.list(selectedBusiness);
      setProfessionals(res.data.professionals);
    } catch (error) {
      toast.error('Erro ao carregar profissionais');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (prof: Professional | null = null) => {
    if (prof) {
      setEditingProfessional(prof);
      setFormData({
        name: prof.name || '',
        email: prof.email || '',
        phone: prof.phone || '',
        specialty: prof.specialty || '',
        bio: prof.bio || '',
      });
    } else {
      setEditingProfessional(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        specialty: '',
        bio: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProfessional) {
        await professionalAPI.update(editingProfessional.id, formData);
        toast.success('Profissional atualizado com sucesso');
      } else {
        await professionalAPI.create({ ...formData, business_id: selectedBusiness });
        toast.success('Profissional criado com sucesso');
      }
      setIsModalOpen(false);
      loadProfessionals();
    } catch (error) {
      toast.error('Erro ao salvar profissional');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este profissional?')) return;
    try {
      await professionalAPI.delete(id);
      toast.success('Profissional excluído com sucesso');
      loadProfessionals();
    } catch (error) {
      toast.error('Erro ao excluir profissional');
    }
  };

  const filteredProfessionals = professionals.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 min-w-0">
        <Header 
          title="Profissionais" 
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
                placeholder="Buscar profissionais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-dark w-full pl-12"
              />
            </div>
            <Button onClick={() => handleOpenModal()} className="btn-primary w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Novo Profissional
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
            </div>
          ) : filteredProfessionals.length === 0 ? (
            <div className="bg-[#1A1A1A] rounded-xl p-12 text-center border border-white/5">
              <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum profissional encontrado</h3>
              <p className="text-gray-400">Comece adicionando seu primeiro profissional.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfessionals.map((prof) => (
                <div key={prof.id} className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-6 hover:border-[#7C3AED]/50 transition-all duration-300 group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-14 h-14 rounded-full bg-[#7C3AED]/20 flex items-center justify-center border-2 border-[#7C3AED]/30">
                      {prof.avatar ? (
                        <img src={prof.avatar} alt={prof.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-[#7C3AED] text-xl font-bold">{prof.name?.[0]}</span>
                      )}
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(prof)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(prof.id)} className="p-2 text-gray-400 hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{prof.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-[#7C3AED] mb-4">
                    <Briefcase className="w-4 h-4" />
                    {prof.specialty || 'Profissional'}
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Mail className="w-4 h-4" />
                      {prof.email || 'Sem email'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Phone className="w-4 h-4" />
                      {prof.phone || 'Sem telefone'}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/5">
                    <Link to={`/dashboard/professionals/${prof.id}/availability`} className="text-sm text-[#7C3AED] hover:underline flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Gerenciar Horários
                    </Link>
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
                {editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-dark w-full"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-dark w-full"
                  placeholder="joao@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-dark w-full"
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Especialidade</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="input-dark w-full"
                  placeholder="Ex: Barbeiro Sênior"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Bio / Descrição</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input-dark w-full min-h-[80px]"
                  placeholder="Breve descrição do profissional..."
                />
              </div>
              <div className="pt-4 flex gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="flex-1 text-gray-400">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingProfessional ? 'Salvar Alterações' : 'Criar Profissional'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

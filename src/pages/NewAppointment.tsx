import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Scissors, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { businessAPI, serviceAPI, professionalAPI, appointmentAPI, type Business, type Service, type Professional } from '@/services/api';
import { toast } from 'sonner';

export function NewAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    business_id: '',
    service_id: '',
    professional_id: '',
    date: '',
    time: '',
    client_name: '',
    client_phone: '',
    notes: '',
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (formData.business_id) {
      loadServices();
      loadProfessionals();
    }
  }, [formData.business_id]);

  useEffect(() => {
    if (formData.professional_id && formData.date) {
      loadAvailableSlots();
    }
  }, [formData.professional_id, formData.date]);

  const loadBusinesses = async () => {
    try {
      const res = await businessAPI.list();
      setBusinesses(res.data.businesses);
    } catch (error) {
      toast.error('Erro ao carregar negócios');
    }
  };

  const loadServices = async () => {
    try {
      const res = await serviceAPI.list(formData.business_id);
      setServices(res.data.services);
    } catch (error) {
      toast.error('Erro ao carregar serviços');
    }
  };

  const loadProfessionals = async () => {
    try {
      const res = await professionalAPI.list(formData.business_id);
      setProfessionals(res.data.professionals);
    } catch (error) {
      toast.error('Erro ao carregar profissionais');
    }
  };

  const loadAvailableSlots = async () => {
    try {
      const res = await professionalAPI.getAvailableSlots(
        formData.professional_id,
        formData.date,
        formData.service_id
      );
      setAvailableSlots(res.data.slots);
    } catch (error) {
      toast.error('Erro ao carregar horários disponíveis');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.business_id || !formData.service_id || !formData.date || !formData.time) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setIsLoading(true);

    try {
      await appointmentAPI.create({
        business_id: formData.business_id,
        service_id: formData.service_id,
        professional_id: formData.professional_id || undefined,
        date: formData.date,
        time: formData.time,
        notes: formData.notes,
      });

      toast.success('Agendamento criado com sucesso!');
      navigate('/dashboard/appointments');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erro ao criar agendamento');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedService = services.find(s => s.id === formData.service_id);

  return (
    <div className="min-h-screen bg-[#0F0F0F]">
      {/* Header */}
      <header className="h-16 bg-[#1A1A1A]/50 backdrop-blur-xl border-b border-white/5 flex items-center px-4 lg:px-8">
        <Link to="/dashboard/appointments" className="p-2 text-gray-400 hover:text-white mr-4">
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-semibold text-white">Novo Agendamento</h1>
      </header>

      {/* Content */}
      <div className="p-4 lg:p-8 max-w-2xl mx-auto">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? 'bg-[#7C3AED]' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Business & Service */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-4">Selecione o negócio e serviço</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Negócio *
                </label>
                <select
                  value={formData.business_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_id: e.target.value }))}
                  className="input-dark w-full"
                  required
                >
                  <option value="">Selecione um negócio</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Serviço *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((service) => (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, service_id: service.id }))}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.service_id === service.id
                          ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                          : 'border-white/10 bg-[#1A1A1A] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${service.color}20` }}
                        >
                          <Scissors className="w-4 h-4" style={{ color: service.color }} />
                        </div>
                        <span className="font-medium text-white">{service.name}</span>
                      </div>
                      <p className="text-sm text-gray-400">{service.duration} min</p>
                      <p className="text-sm text-[#7C3AED]">R$ {service.price.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={!formData.business_id || !formData.service_id}
                className="w-full btn-primary"
              >
                Continuar
              </Button>
            </div>
          )}

          {/* Step 2: Professional & Date */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-4">Escolha o profissional e data</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Profissional
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {professionals.map((prof) => (
                    <button
                      key={prof.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, professional_id: prof.id }))}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        formData.professional_id === prof.id
                          ? 'border-[#7C3AED] bg-[#7C3AED]/10'
                          : 'border-white/10 bg-[#1A1A1A] hover:border-white/20'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#7C3AED]/20 flex items-center justify-center mx-auto mb-2">
                        <span className="text-[#7C3AED] font-medium">{prof.name?.[0]}</span>
                      </div>
                      <span className="text-sm text-white">{prof.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data *
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="input-dark w-full"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {formData.date && formData.professional_id && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Horário *
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {availableSlots.length === 0 ? (
                      <p className="col-span-full text-gray-500 text-center py-4">
                        Nenhum horário disponível para esta data
                      </p>
                    ) : (
                      availableSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, time: slot }))}
                          className={`p-2 rounded-lg text-sm transition-all ${
                            formData.time === slot
                              ? 'bg-[#7C3AED] text-white'
                              : 'bg-[#1A1A1A] text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          {slot}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="flex-1 btn-secondary"
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!formData.date || !formData.time}
                  className="flex-1 btn-primary"
                >
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Notes & Confirm */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-white mb-4">Observações e confirmação</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Alguma observação especial..."
                  className="input-dark w-full h-24 resize-none"
                />
              </div>

              {/* Summary */}
              <div className="bg-[#1A1A1A] rounded-xl p-6 border border-white/5">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Resumo do agendamento</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Serviço</span>
                    <span className="text-white">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Duração</span>
                    <span className="text-white">{selectedService?.duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Data</span>
                    <span className="text-white">{formData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Horário</span>
                    <span className="text-white">{formData.time}</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-white/5">
                    <span className="text-gray-500">Valor</span>
                    <span className="text-[#7C3AED] font-semibold">
                      R$ {selectedService?.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  variant="outline"
                  className="flex-1 btn-secondary"
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-primary"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar Agendamento
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

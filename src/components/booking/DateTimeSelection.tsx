import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { type Professional } from '@/services/api';
import { ptBR } from 'date-fns/locale';

interface DateTimeSelectionProps {
  businessId: string;
  service: { id: string; duration: number };
  professionals: Professional[];
  onSelect: (date: Date, time: string, professional: Professional | null) => void;
  onBack: () => void;
}

export function DateTimeSelection({ professionals, onSelect, onBack }: DateTimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedDate && (selectedProfessional || professionals.length === 0)) {
      loadAvailableTimes();
    }
  }, [selectedDate, selectedProfessional]);

  const loadAvailableTimes = async () => {
    try {
      setIsLoading(true);
      // Simulação de horários disponíveis (em um cenário real, viria da API)
      const times = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];
      setAvailableTimes(times);
    } catch (error) {
      console.error('Erro ao carregar horários');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Data e Horário</h2>
        <p className="text-gray-400">Escolha quando deseja ser atendido</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calendário */}
        <div className="bg-[#0F0F0F] p-4 rounded-2xl border border-white/5">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            className="rounded-md border-none"
            disabled={(date) => date < new Date() || date.getDay() === 0}
          />
        </div>

        <div className="space-y-6">
          {/* Profissional */}
          {professionals.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">Profissional (Opcional)</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedProfessional(null)}
                  className={`p-3 rounded-xl border text-sm transition-all ${
                    !selectedProfessional 
                      ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-white' 
                      : 'border-white/5 bg-[#0F0F0F] text-gray-400 hover:border-white/20'
                  }`}
                >
                  Qualquer um
                </button>
                {professionals.map((prof) => (
                  <button
                    key={prof.id}
                    onClick={() => setSelectedProfessional(prof)}
                    className={`p-3 rounded-xl border text-sm transition-all ${
                      selectedProfessional?.id === prof.id 
                        ? 'border-[#7C3AED] bg-[#7C3AED]/10 text-white' 
                        : 'border-white/5 bg-[#0F0F0F] text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {prof.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Horários */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">Horários Disponíveis</label>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-2 rounded-lg border text-sm transition-all ${
                      selectedTime === time 
                        ? 'border-[#7C3AED] bg-[#7C3AED] text-white' 
                        : 'border-white/5 bg-[#0F0F0F] text-gray-400 hover:border-white/20'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex-1 text-gray-400 hover:text-white"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          disabled={!selectedDate || !selectedTime}
          onClick={() => onSelect(selectedDate!, selectedTime, selectedProfessional)}
          className="flex-1 btn-primary"
        >
          Próximo
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

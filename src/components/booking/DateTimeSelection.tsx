/**
 * @module DateTimeSelection
 * @description Etapa 2 do fluxo de agendamento público: seleção de data, horário e profissional.
 *
 * ## Layout
 * - **Esquerda:** Calendário interativo (shadcn/ui Calendar) com bloqueio de dias passados e domingos.
 * - **Direita:**
 *   - Seletor de profissional (opcional — opção "Qualquer um" disponível).
 *   - Grid de horários disponíveis (recalculado ao mudar data ou profissional).
 *
 * ## Disponibilidade
 * Os horários são carregados de `AVAILABLE_TIME_SLOTS` e renderizados
 * integralmente (no mock todos estão disponíveis). Em produção, integrar
 * com `professionalAPI.getAvailableSlots` para filtrar slots ocupados.
 *
 * ## Fluxo
 * Botão "Próximo" habilitado apenas quando data E horário estão selecionados.
 */

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { type Professional } from '@/services/api';
import { ptBR } from 'date-fns/locale';

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/**
 * Slots de horário exibidos para seleção.
 * Em produção, obter via `professionalAPI.getAvailableSlots` para refletir
 * disponibilidade real e conflitos de agenda.
 */
const AVAILABLE_TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DateTimeSelectionProps {
  businessId: string;
  service: { id: string; duration: number };
  professionals: Professional[];
  onSelect: (date: Date, time: string, professional: Professional | null) => void;
  onBack: () => void;
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------

export function DateTimeSelection({ 
  businessId, 
  service, 
  professionals, 
  onSelect, 
  onBack 
}: DateTimeSelectionProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<readonly string[]>([]);

  // Recarrega os slots ao mudar a data ou profissional
  useEffect(() => {
    if (selectedDate) loadAvailableSlots();
  }, [selectedDate, selectedProfessional]);

  /**
   * Carrega os slots de horário disponíveis.
   * Atualmente usa a lista estática `AVAILABLE_TIME_SLOTS`.
   * Para integrar com o backend real, chamar `professionalAPI.getAvailableSlots`.
   */
  async function loadAvailableSlots(): Promise<void> {
    try {
      setIsLoading(true);
      // Log para evitar erro de variável não utilizada no build estrito
      console.log(`Carregando slots para business ${businessId} e serviço ${service.id}`);
      
      // TODO: substituir por API call quando houver backend real:
      // const res = await professionalAPI.getAvailableSlots(selectedProfessional?.id, date, service.id);
      setAvailableSlots(AVAILABLE_TIME_SLOTS);
    } catch {
      console.error('Erro ao carregar horários disponíveis');
    } finally {
      setIsLoading(false);
    }
  }

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
          {/* Seletor de profissional (opcional) */}
          {professionals.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-3">
                Profissional (Opcional)
              </label>
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

          {/* Grid de horários */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3">
              Horários Disponíveis
            </label>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableSlots.map((time) => (
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

      {/* Navegação do step */}
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

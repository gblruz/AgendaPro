import { Calendar, Clock, User, Scissors, ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type Business, type Service, type Professional } from '@/services/api';

interface BookingConfirmationProps {
  business: Business;
  service: Service;
  professional: Professional | null;
  date: Date;
  time: string;
  clientData: { name: string; email: string; phone: string; notes: string };
  onConfirm: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export function BookingConfirmation({ 
  business,
  service, 
  professional, 
  date, 
  time, 
  clientData, 
  onConfirm, 
  onBack,
  isLoading 
}: BookingConfirmationProps) {
  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Confirme seu Agendamento</h2>
        <p className="text-gray-400">Revise os detalhes em {business.name} antes de finalizar</p>
      </div>

      <div className="space-y-6">
        {/* Resumo do Agendamento */}
        <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scissors className="w-5 h-5 text-[#7C3AED]" />
              {service.name}
            </h3>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>Data</span>
              </div>
              <span className="text-white font-medium">
                {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Horário</span>
              </div>
              <span className="text-white font-medium">{time}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-3 text-gray-400">
                <User className="w-4 h-4" />
                <span>Profissional</span>
              </div>
              <span className="text-white font-medium">
                {professional ? professional.name : 'Qualquer um'}
              </span>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-gray-400">Total</span>
              <span className="text-xl font-bold text-[#7C3AED]">
                R$ {service.price.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Dados do Cliente */}
        <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 space-y-3">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Seus Dados</h4>
          <div className="space-y-1">
            <p className="text-white font-medium">{clientData.name}</p>
            <p className="text-sm text-gray-400">{clientData.email}</p>
            <p className="text-sm text-gray-400">{clientData.phone}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex-1 text-gray-400 hover:text-white"
          disabled={isLoading}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={onConfirm}
          className="flex-1 btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Confirmar Agendamento
              <Check className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

import { CheckCircle2, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type Business } from '@/services/api';

interface BookingSuccessProps {
  business: Business;
  date: Date;
  time: string;
}

export function BookingSuccess({ business, date, time }: BookingSuccessProps) {
  return (
    <div className="text-center py-12 space-y-8">
      <div className="flex justify-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-3xl font-bold text-white">Agendamento Confirmado!</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Tudo certo! Seu agendamento em <strong>{business.name}</strong> foi realizado com sucesso. Você receberá um e-mail com os detalhes.
        </p>
      </div>

      <div className="bg-[#0F0F0F] rounded-2xl border border-white/5 p-6 max-w-sm mx-auto space-y-4">
        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30">
            <Calendar className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Data</p>
            <p className="text-white font-medium">
              {format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-left">
          <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 flex items-center justify-center border border-[#7C3AED]/30">
            <Clock className="w-5 h-5 text-[#7C3AED]" />
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Horário</p>
            <p className="text-white font-medium">{time}</p>
          </div>
        </div>
      </div>

      <div className="pt-8">
        <Button
          onClick={() => window.location.href = '/'}
          className="btn-primary w-full max-w-xs"
        >
          Voltar para o Início
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

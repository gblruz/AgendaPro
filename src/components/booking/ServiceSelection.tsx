import { Scissors, Clock, ChevronRight } from 'lucide-react';
import { type Service } from '@/services/api';

interface ServiceSelectionProps {
  services: Service[];
  onSelect: (service: Service) => void;
}

export function ServiceSelection({ services, onSelect }: ServiceSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Selecione um Serviço</h2>
        <p className="text-gray-400">Escolha o serviço que deseja agendar</p>
      </div>

      <div className="grid gap-4">
        {services.length === 0 ? (
          <div className="text-center py-12 bg-[#0F0F0F] rounded-2xl border border-white/5">
            <Scissors className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhum serviço disponível no momento.</p>
          </div>
        ) : (
          services.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelect(service)}
              className="flex items-center justify-between p-6 bg-[#0F0F0F] rounded-2xl border border-white/5 
                hover:border-[#7C3AED]/50 hover:bg-[#7C3AED]/5 transition-all duration-300 group text-left"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${service.color}20`, color: service.color }}
                >
                  <Scissors className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#7C3AED] transition-colors">
                    {service.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      {service.duration} min
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span className="text-sm font-bold text-[#7C3AED]">
                      R$ {service.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-[#7C3AED] group-hover:translate-x-1 transition-all" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

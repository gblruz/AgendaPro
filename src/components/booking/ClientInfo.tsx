import { useState } from 'react';
import { User, Mail, Phone, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ClientInfoProps {
  onSubmit: (data: { name: string; email: string; phone: string; notes: string }) => void;
  onBack: () => void;
  initialData: { name: string; email: string; phone: string; notes: string };
}

export function ClientInfo({ onSubmit, onBack, initialData }: ClientInfoProps) {
  const [formData, setFormData] = useState(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Suas Informações</h2>
        <p className="text-gray-400">Preencha seus dados para confirmar o agendamento</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              required
              placeholder="Nome Completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-dark w-full pl-12"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              required
              placeholder="E-mail"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-dark w-full pl-12"
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="tel"
              required
              placeholder="Telefone / WhatsApp"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-dark w-full pl-12"
            />
          </div>

          <div className="relative">
            <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
            <textarea
              placeholder="Observações (opcional)"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-dark w-full pl-12 min-h-[120px] py-4"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="flex-1 text-gray-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button
            type="submit"
            className="flex-1 btn-primary"
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}

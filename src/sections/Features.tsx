import { useEffect, useRef, useState } from 'react';
import { Check, Calendar, Users, BarChart3, Bell, Shield, Zap } from 'lucide-react';

const features = [
  {
    icon: Calendar,
    title: 'Agenda Inteligente',
    description: 'Visualize seus agendamentos por dia, semana ou mês. Controle de disponibilidade em tempo real.',
    highlights: ['Agenda visual intuitiva', 'Bloqueio de horários', 'Agendamento recorrente'],
  },
  {
    icon: Users,
    title: 'Gestão de Clientes',
    description: 'Mantenha o histórico completo dos seus clientes, preferências e dados de contato organizados.',
    highlights: ['Histórico de atendimentos', 'Preferências pessoais', 'Aniversariantes'],
  },
  {
    icon: BarChart3,
    title: 'Relatórios Detalhados',
    description: 'Acompanhe seu faturamento, serviços mais populares e desempenho da equipe.',
    highlights: ['Faturamento por período', 'Serviços mais vendidos', 'Taxa de ocupação'],
  },
  {
    icon: Bell,
    title: 'Lembretes Automáticos',
    description: 'Reduza faltas com notificações automáticas por email e WhatsApp.',
    highlights: ['SMS e WhatsApp', 'Email automático', 'Confirmação de presença'],
  },
  {
    icon: Shield,
    title: 'Segurança Total',
    description: 'Seus dados protegidos com criptografia e backups automáticos.',
    highlights: ['Criptografia SSL', 'Backup diário', 'Conformidade LGPD'],
  },
  {
    icon: Zap,
    title: 'Integrações',
    description: 'Conecte com suas ferramentas favoritas como Google Calendar e WhatsApp.',
    highlights: ['Google Calendar', 'WhatsApp Business', 'API disponível'],
  },
];

export function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="py-24 relative"
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7C3AED]/5 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className={`text-3xl sm:text-4xl font-bold text-white mb-4 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Tudo que você <span className="text-gradient">precisa</span>
          </h2>
          <p
            className={`text-gray-400 max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Funcionalidades completas para gerenciar seu negócio de forma eficiente
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group bg-[#1A1A1A]/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5 
                  transition-all duration-500 hover:bg-[#1A1A1A] hover:border-[#7C3AED]/30 hover:shadow-lg hover:shadow-purple-500/5
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${150 + index * 100}ms` }}
              >
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center mb-4 
                  transition-all duration-300 group-hover:bg-[#7C3AED]/20 group-hover:scale-110">
                  <Icon className="w-6 h-6 text-[#7C3AED]" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                  {feature.description}
                </p>

                {/* Highlights */}
                <ul className="space-y-2">
                  {feature.highlights.map((highlight) => (
                    <li key={highlight} className="flex items-center gap-2 text-sm text-gray-500">
                      <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

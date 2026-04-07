import { useEffect, useRef, useState } from 'react';
import { Scissors, Sparkles, Heart, Building2, Users, Calendar } from 'lucide-react';

const services = [
  {
    icon: Scissors,
    title: 'Barbearias',
    description: 'Controle de horários, profissionais e serviços com agendamento intuitivo.',
    color: 'from-[#7C3AED] to-[#A855F7]',
  },
  {
    icon: Sparkles,
    title: 'Salões de Beleza',
    description: 'Gestão completa de serviços, profissionais e pacotes de tratamentos.',
    color: 'from-[#EC4899] to-[#F472B6]',
    featured: true,
  },
  {
    icon: Heart,
    title: 'Clínicas de Estética',
    description: 'Agendamento de procedimentos com controle de sessões e acompanhamento.',
    color: 'from-[#10B981] to-[#34D399]',
  },
  {
    icon: Building2,
    title: 'Consultórios',
    description: 'Organize consultas médicas e odontológicas de forma eficiente.',
    color: 'from-[#F59E0B] to-[#FBBF24]',
  },
  {
    icon: Users,
    title: 'Studio de Tatuagem',
    description: 'Gerencie sessões, orçamentos e portfolio de artistas.',
    color: 'from-[#EF4444] to-[#F87171]',
  },
  {
    icon: Calendar,
    title: 'Profissionais Autônomos',
    description: 'Ideal para freelancers que precisam organizar seus compromissos.',
    color: 'from-[#3B82F6] to-[#60A5FA]',
  },
];

export function Services() {
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
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="services"
      ref={sectionRef}
      className="py-24 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className={`text-3xl sm:text-4xl font-bold text-white mb-4 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Para todo tipo de <span className="text-gradient">negócio</span>
          </h2>
          <p
            className={`text-gray-400 max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Soluções personalizadas para diferentes segmentos do mercado de beleza e bem-estar
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div
                key={service.title}
                className={`group relative bg-[#1A1A1A] rounded-2xl p-6 border border-white/5 
                  transition-all duration-500 hover:-translate-y-2 hover:border-white/10 hover:shadow-xl hover:shadow-purple-500/10
                  ${service.featured ? 'lg:-translate-y-4 lg:shadow-purple-500/20' : ''}
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${150 + index * 100}ms` }}
              >
                {/* Featured Badge */}
                {service.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] rounded-full text-xs font-medium text-white">
                    Mais Popular
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} 
                    flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#7C3AED] transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {service.description}
                </p>

                {/* Hover Glow */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.color} opacity-0 
                    group-hover:opacity-5 transition-opacity duration-300 -z-10`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

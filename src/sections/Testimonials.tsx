import { useEffect, useRef, useState } from 'react';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Carolina Mendes',
    business: 'Estética Carolina',
    avatar: 'CM',
    content: 'Reduzi em 70% as faltas com os lembretes automáticos. Meus clientes adoram a praticidade de agendar pelo WhatsApp!',
    rating: 5,
    color: 'bg-[#EC4899]',
  },
  {
    name: 'Roberto Santos',
    business: 'Barbearia Vintage',
    avatar: 'RS',
    content: 'Consegui organizar a agenda de 3 barbeiros em um só lugar. O sistema é intuitivo e muito eficiente para o dia a dia.',
    rating: 5,
    color: 'bg-[#7C3AED]',
  },
  {
    name: 'Fernanda Lima',
    business: 'Studio Fernanda Lima',
    avatar: 'FL',
    content: 'Aumentei meu faturamento em 40% após implementar o sistema de agendamento online. Melhor investimento!',
    rating: 5,
    color: 'bg-[#10B981]',
  },
  {
    name: 'Pedro Costa',
    business: 'Clínica Dental Care',
    avatar: 'PC',
    content: 'O controle de pacientes e histórico de atendimentos ficou muito mais organizado. Recomendo!',
    rating: 5,
    color: 'bg-[#3B82F6]',
  },
  {
    name: 'Ana Beatriz',
    business: 'Salão Glamour',
    avatar: 'AB',
    content: 'Finalmente encontrei um sistema que entende as necessidades de um salão de beleza. Suporte excelente!',
    rating: 5,
    color: 'bg-[#F59E0B]',
  },
];

export function Testimonials() {
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
      id="testimonials"
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#7C3AED]/5 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className={`text-3xl sm:text-4xl font-bold text-white mb-4 transition-all duration-700 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            O que nossos <span className="text-gradient">clientes dizem</span>
          </h2>
          <p
            className={`text-gray-400 max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Histórias reais de empresas que transformaram seu atendimento
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className={`group relative bg-[#1A1A1A] rounded-2xl p-6 border border-white/5 
                transition-all duration-500 hover:border-[#7C3AED]/30 hover:shadow-lg hover:shadow-purple-500/10
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{ transitionDelay: `${150 + index * 100}ms` }}
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-10 h-10 text-[#7C3AED]" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>

              {/* Content */}
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${testimonial.color} flex items-center justify-center`}>
                  <span className="text-sm font-medium text-white">{testimonial.avatar}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{testimonial.name}</div>
                  <div className="text-xs text-gray-500">{testimonial.business}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CTA() {
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
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 relative overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-radial opacity-50" />
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] 
            bg-[#7C3AED]/20 rounded-full blur-[150px] animate-pulse"
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6
            transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <Sparkles className="w-4 h-4 text-[#7C3AED]" />
          <span className="text-sm text-gray-300">Comece gratuitamente hoje</span>
        </div>

        {/* Heading */}
        <h2
          className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 transition-all duration-700 delay-100
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          Pronto para organizar seus{' '}
          <span className="text-gradient">agendamentos?</span>
        </h2>

        {/* Description */}
        <p
          className={`text-lg text-gray-400 mb-8 max-w-2xl mx-auto transition-all duration-700 delay-200
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          Comece gratuitamente hoje mesmo. Não é necessário cartão de crédito.
          Cancele quando quiser.
        </p>

        {/* CTA Buttons */}
        <div
          className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-300
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <Link to="/register">
            <Button size="lg" className="btn-primary text-base animate-pulse-glow">
              Criar Conta Gratuita
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link to="/demo">
            <Button size="lg" variant="outline" className="btn-secondary text-base">
              Agendar Demonstração
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div
          className={`flex flex-wrap items-center justify-center gap-6 mt-12 pt-8 border-t border-white/10
            transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center">
              <span className="text-[#10B981] text-xs">✓</span>
            </div>
            <span>Sem cartão de crédito</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center">
              <span className="text-[#10B981] text-xs">✓</span>
            </div>
            <span>Cancelamento gratuito</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="w-5 h-5 rounded-full bg-[#10B981]/20 flex items-center justify-center">
              <span className="text-[#10B981] text-xs">✓</span>
            </div>
            <span>Suporte incluso</span>
          </div>
        </div>
      </div>
    </section>
  );
}

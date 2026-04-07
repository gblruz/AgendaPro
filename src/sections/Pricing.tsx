import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const plans = [
  {
    name: 'Básico',
    price: 49,
    priceId: 'price_1TJaSqIbNAgbrRAaPp9jcAZy',
    description: 'Ideal para profissionais autônomos',
    features: [
      '1 profissional',
      'Até 100 agendamentos/mês',
      'Suporte por email',
      'Relatórios básicos',
      'Lembretes por email',
    ],
    cta: 'Começar Agora',
    popular: false,
  },
  {
    name: 'Profissional',
    price: 99,
    priceId: 'price_1TJaSwIbNAgbrRAaNl1VWGkk',
    description: 'Perfeito para pequenas empresas',
    features: [
      '5 profissionais',
      'Agendamentos ilimitados',
      'Suporte prioritário',
      'Relatórios avançados',
      'Lembretes WhatsApp',
      'Integração Google Calendar',
      'Sistema de fidelidade',
    ],
    cta: 'Escolher Profissional',
    popular: true,
  },
  {
    name: 'Empresarial',
    price: 199,
    priceId: 'price_1TJaT3IbNAgbrRAaJueBXMnI',
    description: 'Para negócios em crescimento',
    features: [
      'Profissionais ilimitados',
      'Agendamentos ilimitados',
      'Suporte 24/7',
      'Relatórios personalizados',
      'API de integração',
      'Múltiplas unidades',
      'White label',
    ],
    cta: 'Escolher Empresarial',
    popular: false,
  },
];

export function Pricing() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

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

  const handleSubscribe = async (priceId: string) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      toast.error('Por favor, faça login para assinar um plano');
      navigate('/login');
      return;
    }

    try {
      setLoadingPlan(priceId);
      const response = await axios.post(
        'https://agendapro-qer7.onrender.com/api/payments/create-checkout-session',
        { priceId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Erro ao iniciar checkout:', error);
      toast.error('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section
      id="pricing"
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
            Planos e <span className="text-gradient">Preços</span>
          </h2>
          <p
            className={`text-gray-400 max-w-2xl mx-auto transition-all duration-700 delay-100 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            Escolha o plano ideal para o seu negócio. Todos os planos incluem suporte e atualizações.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8" style={{ perspective: '1000px' }}>
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative transition-all duration-500 ${
                plan.popular ? 'md:-translate-y-4' : ''
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={{
                transitionDelay: `${200 + index * 150}ms`,
                transform: hoveredPlan === index ? 'translateZ(30px) scale(1.02)' : undefined,
              }}
              onMouseEnter={() => setHoveredPlan(index)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#7C3AED] to-[#A855F7] rounded-full">
                    <Sparkles className="w-4 h-4 text-white" />
                    <span className="text-sm font-medium text-white">Mais Popular</span>
                  </div>
                </div>
              )}

              <div
                className={`h-full bg-[#1A1A1A] rounded-2xl p-6 lg:p-8 border transition-all duration-300
                  ${plan.popular 
                    ? 'border-[#7C3AED]/50 shadow-xl shadow-purple-500/10' 
                    : 'border-white/5 hover:border-white/10'
                  }`}
              >
                {/* Plan Header */}
                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 text-sm">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-gray-400">R$</span>
                    <span className="text-4xl lg:text-5xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400">/mês</span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-gray-300">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                        ${plan.popular ? 'bg-[#7C3AED]/20' : 'bg-white/10'}`}>
                        <Check className={`w-3 h-3 ${plan.popular ? 'text-[#7C3AED]' : 'text-gray-400'}`} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  onClick={() => handleSubscribe(plan.priceId)}
                  disabled={loadingPlan === plan.priceId}
                  className={`w-full ${
                    plan.popular
                      ? 'btn-primary'
                      : 'bg-white/10 text-white hover:bg-white/15 border border-white/20'
                  }`}
                >
                  {loadingPlan === plan.priceId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    plan.cta
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Link */}
        <p
          className={`text-center mt-12 text-gray-400 transition-all duration-700 delay-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          Dúvidas?{' '}
          <a href="#contact" className="text-[#7C3AED] hover:underline">
            Entre em contato
          </a>
        </p>
      </div>
    </section>
  );
}

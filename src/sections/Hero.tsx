import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const scrollY = window.scrollY;
      const heroContent = heroRef.current.querySelector('.hero-content');
      const heroImage = heroRef.current.querySelector('.hero-image');
      
      if (heroContent) {
        (heroContent as HTMLElement).style.transform = `translateY(${scrollY * 0.3}px)`;
      }
      if (heroImage) {
        (heroImage as HTMLElement).style.transform = `translateY(${scrollY * 0.15}px) rotateX(${scrollY * 0.02}deg)`;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen flex items-center pt-20 overflow-hidden"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-radial" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C3AED]/20 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#A855F7]/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[#7C3AED]/30 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 6}s`,
              animationDuration: `${6 + Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div className="hero-content text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-6 animate-fade-in">
              <Star className="w-4 h-4 text-[#7C3AED]" />
              <span className="text-sm text-gray-300">+500 empresas já utilizam</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              <span className="block animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Gerencie seus
              </span>
              <span className="block text-gradient animate-slide-up" style={{ animationDelay: '0.2s' }}>
                agendamentos
              </span>
              <span className="block animate-slide-up" style={{ animationDelay: '0.3s' }}>
                com facilidade
              </span>
            </h1>

            <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Sistema completo para pequenos negócios controlarem horários, clientes e serviços em um só lugar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <Link to="/register">
                <Button size="lg" className="btn-primary text-base animate-pulse-glow">
                  Começar Gratuitamente
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/demo">
                <Button size="lg" variant="outline" className="btn-secondary text-base">
                  <Play className="w-5 h-5 mr-2" />
                  Ver Demonstração
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/10 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">500+</div>
                <div className="text-sm text-gray-500">Empresas</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">50k+</div>
                <div className="text-sm text-gray-500">Agendamentos</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-white">99%</div>
                <div className="text-sm text-gray-500">Satisfação</div>
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="hero-image relative lg:pl-8" style={{ perspective: '1000px' }}>
            <div className="relative animate-float" style={{ animationDuration: '8s' }}>
              {/* Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-[#7C3AED]/30 to-[#A855F7]/30 rounded-3xl blur-2xl" />
              
              {/* Dashboard Card */}
              <div className="relative bg-[#1A1A1A] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                    <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                    <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-gray-500">Dashboard - AgendaPro</span>
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Agendamentos', value: '45', color: 'bg-[#7C3AED]/20 text-[#7C3AED]' },
                      { label: 'Clientes', value: '128', color: 'bg-[#10B981]/20 text-[#10B981]' },
                      { label: 'Ocupação', value: '78%', color: 'bg-[#F59E0B]/20 text-[#F59E0B]' },
                      { label: 'Faturamento', value: 'R$12.4k', color: 'bg-[#EC4899]/20 text-[#EC4899]' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-[#0F0F0F] rounded-lg p-3">
                        <div className={`text-lg font-bold ${stat.color.split(' ')[1]}`}>{stat.value}</div>
                        <div className="text-[10px] text-gray-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Chart Placeholder */}
                  <div className="bg-[#0F0F0F] rounded-lg p-4 mb-4">
                    <div className="text-xs text-gray-400 mb-3">Faturamento por Semana</div>
                    <div className="flex items-end gap-2 h-24">
                      {[40, 65, 45, 80, 55, 90].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-[#7C3AED] to-[#A855F7] rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Appointments Table */}
                  <div className="bg-[#0F0F0F] rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2">Próximos Agendamentos</div>
                    {[
                      { name: 'Ana Silva', service: 'Corte de Cabelo', time: '14:00', status: 'confirmed' },
                      { name: 'João Pedro', service: 'Barba', time: '15:30', status: 'pending' },
                      { name: 'Maria Costa', service: 'Manicure', time: '16:00', status: 'confirmed' },
                    ].map((apt, i) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#7C3AED]/20 flex items-center justify-center">
                            <span className="text-[10px] text-[#7C3AED]">{apt.name[0]}</span>
                          </div>
                          <div>
                            <div className="text-xs text-white">{apt.name}</div>
                            <div className="text-[10px] text-gray-500">{apt.service}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{apt.time}</span>
                          <div className={`w-2 h-2 rounded-full ${
                            apt.status === 'confirmed' ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

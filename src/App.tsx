/**
 * @module App
 * @description Ponto de entrada da aplicação AgendaPro.
 *
 * ## Estrutura de Rotas
 *
 * ```
 * /                        → LandingPage (pública)
 * /booking/:businessId     → Agendamento público do cliente (pública)
 * /login                   → Login (redireciona ao dashboard se já autenticado)
 * /register                → Registro (redireciona ao dashboard se já autenticado)
 * /dashboard               → Painel principal (protegida)
 * /dashboard/appointments  → Lista de agendamentos (protegida)
 * /dashboard/appointments/new → Novo agendamento admin (protegida)
 * /dashboard/clients       → Clientes (protegida)
 * /dashboard/services      → Serviços (protegida)
 * /dashboard/professionals → Profissionais (protegida)
 * /dashboard/reports       → Relatórios (protegida)
 * /dashboard/settings      → Configurações (protegida)
 * *                        → Redireciona para /
 * ```
 *
 * ## Guardas de Rota
 * - `ProtectedRoute`: exige autenticação, redireciona para `/login` caso contrário.
 * - `PublicRoute`: redireciona usuários já autenticados para `/dashboard`.
 *
 * ## Scroll por Âncora
 * A `LandingPage` detecta o hash da URL (ex: `/#pricing`) e rola suavemente
 * até a seção correspondente após a renderização inicial.
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';

// Contexto
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Seções da Landing Page
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/sections/Hero';
import { Services as ServicesSection } from '@/sections/Services';
import { Features } from '@/sections/Features';
import { Pricing } from '@/sections/Pricing';
import { Testimonials } from '@/sections/Testimonials';
import { CTA } from '@/sections/CTA';
import { Footer } from '@/sections/Footer';

// Páginas de autenticação
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';

// Páginas da Dashboard administrativa
import { Dashboard } from '@/pages/Dashboard';
import { Appointments } from '@/pages/Appointments';
import { NewAppointment } from '@/pages/NewAppointment';
import { Clients } from '@/pages/dashboard/Clients';
import { Services as ServicesPage } from '@/pages/dashboard/Services';
import { Professionals } from '@/pages/dashboard/Professionals';
import { Reports } from '@/pages/dashboard/Reports';
import { Settings } from '@/pages/dashboard/Settings';

// Página pública de agendamento do cliente
import { BookingPage } from '@/pages/booking/BookingPage';

// ---------------------------------------------------------------------------
// Estilo fixo do Toaster (notificações)
// ---------------------------------------------------------------------------

const TOASTER_STYLE: React.CSSProperties = {
  background: '#1A1A1A',
  color: '#fff',
  border: '1px solid #2A2A2A',
};

// ---------------------------------------------------------------------------
// Landing Page
// ---------------------------------------------------------------------------

/**
 * Página inicial pública do AgendaPro.
 * Detecta hash na URL e rola suavemente para a seção correspondente
 * (ex: `/#pricing` → scroll até a seção de preços).
 */
function LandingPage() {
  useEffect(() => {
    if (!window.location.hash) return;

    const sectionId = window.location.hash.replace('#', '');

    // Aguarda a renderização inicial antes de tentar encontrar o elemento
    const timer = setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <ServicesSection />
        <Features />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}

// ---------------------------------------------------------------------------
// Guardas de Rota
// ---------------------------------------------------------------------------

/** Exibe spinner enquanto a sessão está sendo restaurada */
function AuthLoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#7C3AED]/30 border-t-[#7C3AED] rounded-full animate-spin" />
    </div>
  );
}

/**
 * Guarda de rota protegida.
 * Redireciona para `/login` se o usuário não estiver autenticado.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AuthLoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/**
 * Guarda de rota pública.
 * Redireciona para `/dashboard` se o usuário já estiver autenticado.
 */
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <AuthLoadingSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// ---------------------------------------------------------------------------
// App Root
// ---------------------------------------------------------------------------

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ── Rotas públicas ─────────────────────────────────────────── */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/booking/:businessId" element={<BookingPage />} />

          {/* ── Rotas de autenticação (redirecionam se já logado) ───────── */}
          <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* ── Rotas protegidas (requerem autenticação) ────────────────── */}
          <Route path="/dashboard"                    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard/appointments"       element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path="/dashboard/appointments/new"   element={<ProtectedRoute><NewAppointment /></ProtectedRoute>} />
          <Route path="/dashboard/clients"            element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/dashboard/services"           element={<ProtectedRoute><ServicesPage /></ProtectedRoute>} />
          <Route path="/dashboard/professionals"      element={<ProtectedRoute><Professionals /></ProtectedRoute>} />
          <Route path="/dashboard/reports"            element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/dashboard/settings"           element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          {/* ── Fallback ────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{ style: TOASTER_STYLE }}
      />
    </AuthProvider>
  );
}

export default App;

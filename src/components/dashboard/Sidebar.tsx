import { Link, useLocation } from 'react-router-dom';
import {
  Calendar,
  Users,
  Scissors,
  BarChart3,
  Settings,
  LogOut,
  User,
  LayoutDashboard,
  Home,
  CreditCard,
  X
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Calendar, label: 'Agendamentos', href: '/dashboard/appointments' },
  { icon: Users, label: 'Clientes', href: '/dashboard/clients' },
  { icon: Scissors, label: 'Serviços', href: '/dashboard/services' },
  { icon: User, label: 'Profissionais', href: '/dashboard/professionals' },
  { icon: BarChart3, label: 'Relatórios', href: '/dashboard/reports' },
  { icon: CreditCard, label: 'Planos', href: '/#pricing' },
  { icon: Settings, label: 'Configurações', href: '/dashboard/settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-[#1A1A1A] border-r border-white/5 
          transform transition-transform duration-300 lg:transform-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'}`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">AgendaPro</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
                  ${isActive 
                    ? 'bg-[#7C3AED]/20 text-[#7C3AED]' 
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#7C3AED]/20 flex items-center justify-center">
              <span className="text-[#7C3AED] font-medium">{user?.name?.[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-400 hover:text-white 
              hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}

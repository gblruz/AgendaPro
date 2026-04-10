import { Menu, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { type Business } from '@/services/api';

interface HeaderProps {
  title: string;
  businesses: Business[];
  selectedBusiness: string;
  onBusinessChange: (id: string) => void;
  onMenuClick: () => void;
}

export function Header({ title, businesses, selectedBusiness, onBusinessChange, onMenuClick }: HeaderProps) {
  return (
    <header className="h-16 bg-[#1A1A1A]/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-400 hover:text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold text-white">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Business Selector */}
        {businesses.length > 0 && (
          <select
            value={selectedBusiness}
            onChange={(e) => onBusinessChange(e.target.value)}
            className="input-dark text-sm py-2"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        )}
        
        <Link to="/dashboard/appointments/new">
          <Button size="sm" className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Novo Agendamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </Link>
      </div>
    </header>
  );
}

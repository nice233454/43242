import { supabase } from '../lib/supabase';
import { ClipboardList, LogOut, ChevronLeft } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export default function Header({ title, subtitle, onBack }: HeaderProps) {
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Назад</span>
          </button>
        ) : (
          <div className="flex items-center justify-center w-9 h-9 bg-blue-600 rounded-xl">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <h1 className="font-bold text-slate-800 leading-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-slate-500 hover:text-red-600 transition-colors text-sm"
      >
        <LogOut className="w-4 h-4" />
        Выйти
      </button>
    </header>
  );
}

import React from 'react';
import {
  LayoutDashboard,
  Users,
  Waves,
  Wrench,
  CalendarDays,
  DollarSign,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  X,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { NavTab } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab?: NavTab;
  currentPage?: string;
  onSelectTab?: (tab: NavTab) => void;
  onNavigate?: (tab: string) => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  currentPage,
  onSelectTab,
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!isOpen) return null;

  const activeId = currentTab || currentPage || 'dashboard';

  const navItems: { id: string; aliases: string[]; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', aliases: ['dashboard'], label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', aliases: ['clients', 'clientes'], label: 'Clientes', icon: Users },
    { id: 'pools', aliases: ['pools', 'piscinas'], label: 'Piscinas', icon: Waves },
    { id: 'services', aliases: ['services', 'servicos'], label: 'Serviços & Preços', icon: Wrench },
    { id: 'appointments', aliases: ['appointments', 'agenda'], label: 'Agenda de Serviços', icon: CalendarDays },
    { id: 'financial', aliases: ['financial', 'financeiro'], label: 'Financeiro & Pagamentos', icon: DollarSign },
    { id: 'receipts', aliases: ['receipts', 'comprovantes'], label: 'Comprovantes & WhatsApp', icon: FileText },
    { id: 'reports', aliases: ['reports', 'relatorios'], label: 'Relatórios & Exportação', icon: BarChart3 },
    { id: 'chat', aliases: ['chat', 'assistente'], label: 'Chat IA Especialista', icon: Sparkles },
    { id: 'settings', aliases: ['settings', 'configuracoes'], label: 'Configurações', icon: Settings },
  ];

  const handleSelect = (tab: string) => {
    if (onSelectTab) onSelectTab(tab as NavTab);
    if (onNavigate) onNavigate(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer content */}
      <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col z-10 font-sans">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <BrandLogo />
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User preview */}
        <div className="p-3 mx-3 my-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center gap-3 border border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-sky-200 dark:bg-sky-900 text-sky-800 dark:text-sky-200 font-bold flex items-center justify-center text-xs shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VP'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name || 'Venâncio Alves'}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.role || 'Administrador'}</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = item.aliases.includes(activeId);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.aliases[0])}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-700 dark:text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition"
          >
            <span className="flex items-center gap-2">
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
              {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              logout();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-md transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </div>
    </div>
  );
};

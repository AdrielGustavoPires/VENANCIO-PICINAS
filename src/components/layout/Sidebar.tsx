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
  PlusCircle,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export type NavTab =
  | 'dashboard'
  | 'clients'
  | 'clientes'
  | 'pools'
  | 'piscinas'
  | 'services'
  | 'servicos'
  | 'appointments'
  | 'agenda'
  | 'financial'
  | 'financeiro'
  | 'receipts'
  | 'comprovantes'
  | 'reports'
  | 'relatorios'
  | 'chat'
  | 'assistente'
  | 'settings'
  | 'configuracoes';

interface SidebarProps {
  currentTab?: NavTab;
  currentPage?: string;
  onSelectTab?: (tab: any) => void;
  onNavigate?: (page: string) => void;
  onOpenNewServiceModal?: () => void;
  pendingAppointmentsCount?: number;
  pendingPaymentsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  currentPage,
  onSelectTab,
  onNavigate,
  onOpenNewServiceModal,
  pendingAppointmentsCount = 0,
  pendingPaymentsCount = 0,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const activeId = currentTab || currentPage || 'dashboard';

  const handleSelect = (tab: string) => {
    if (onSelectTab) onSelectTab(tab as NavTab);
    if (onNavigate) onNavigate(tab);
  };

  const navItems: {
    id: string;
    aliases: string[];
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', aliases: ['dashboard'], label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', aliases: ['clients', 'clientes'], label: 'Clientes', icon: Users },
    { id: 'pools', aliases: ['pools', 'piscinas'], label: 'Piscinas', icon: Waves },
    { id: 'services', aliases: ['services', 'servicos'], label: 'Serviços', icon: Wrench },
    {
      id: 'appointments',
      aliases: ['appointments', 'agenda'],
      label: 'Agenda',
      icon: CalendarDays,
      badge: pendingAppointmentsCount > 0 ? pendingAppointmentsCount : undefined,
      badgeColor: 'bg-sky-500 text-white',
    },
    {
      id: 'financial',
      aliases: ['financial', 'financeiro'],
      label: 'Financeiro',
      icon: DollarSign,
      badge: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'receipts', aliases: ['receipts', 'comprovantes'], label: 'Comprovantes', icon: FileText },
    { id: 'reports', aliases: ['reports', 'relatorios'], label: 'Relatórios', icon: BarChart3 },
    {
      id: 'chat',
      aliases: ['chat', 'assistente'],
      label: 'Chat IA Especialista',
      icon: Sparkles,
    },
    { id: 'settings', aliases: ['settings', 'configuracoes'], label: 'Configurações', icon: Settings },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 h-screen sticky top-0 z-20"
    >
      {/* Brand Header with Single Official Logo */}
      <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
        <BrandLogo variant="horizontal" size="md" onClick={() => handleSelect('dashboard')} />
      </div>

      {/* Quick Action Button if provided */}
      {onOpenNewServiceModal && (
        <div className="px-4 pt-4 pb-1">
          <button
            id="sidebar-new-service-btn"
            type="button"
            onClick={onOpenNewServiceModal}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold shadow-xs active:scale-[0.98] transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Novo Serviço</span>
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = item.aliases.includes(activeId);
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              type="button"
              onClick={() => handleSelect(item.aliases[0])}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors cursor-pointer ${
                isActive
                  ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'opacity-80 text-sky-700 dark:text-sky-400' : 'opacity-60 text-slate-500'
                  }`}
                />
                <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    item.badgeColor || 'bg-sky-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / User Profile & Controls */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <div className="flex items-center justify-between px-1">
          <button
            id="theme-toggle-sidebar-btn"
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer font-medium"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
            <span className="text-[11px] font-semibold">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1.5 rounded-md flex items-center gap-1 transition cursor-pointer font-medium"
            title="Sair do sistema"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-sky-200 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 flex items-center justify-center text-xs font-bold shrink-0">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VP'}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200">
              {user?.name || 'Venâncio Alves'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {user?.role || 'Administrador'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

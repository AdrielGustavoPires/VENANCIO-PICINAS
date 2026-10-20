import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  DollarSign,
  Menu,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface BottomNavProps {
  currentTab?: NavTab;
  currentPage?: string;
  onSelectTab?: (tab: NavTab) => void;
  onNavigate?: (tab: string) => void;
  onOpenMoreMenu?: () => void;
  onOpenMobileMenu?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  currentPage,
  onSelectTab,
  onNavigate,
  onOpenMoreMenu,
  onOpenMobileMenu,
}) => {
  const activeId = currentTab || currentPage || 'dashboard';

  const handleSelect = (tab: string) => {
    if (onSelectTab) onSelectTab(tab as NavTab);
    if (onNavigate) onNavigate(tab);
  };

  const handleMoreClick = () => {
    if (onOpenMoreMenu) onOpenMoreMenu();
    else if (onOpenMobileMenu) onOpenMobileMenu();
  };

  const mainTabs: { id: string; aliases: string[]; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', aliases: ['dashboard'], label: 'Início', icon: LayoutDashboard },
    { id: 'clients', aliases: ['clients', 'clientes'], label: 'Clientes', icon: Users },
    { id: 'appointments', aliases: ['appointments', 'agenda'], label: 'Agenda', icon: CalendarDays },
    { id: 'financial', aliases: ['financial', 'financeiro'], label: 'Financeiro', icon: DollarSign },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around shadow-lg"
    >
      {mainTabs.map(tab => {
        const Icon = tab.icon;
        const isActive = tab.aliases.includes(activeId);
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleSelect(tab.aliases[0])}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-md transition cursor-pointer ${
              isActive
                ? 'text-sky-700 dark:text-sky-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        );
      })}

      {/* More / Menu Drawer trigger */}
      <button
        type="button"
        onClick={handleMoreClick}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-md transition cursor-pointer ${
          ['pools', 'piscinas', 'services', 'servicos', 'receipts', 'comprovantes', 'reports', 'relatorios', 'settings', 'configuracoes'].includes(activeId)
            ? 'text-sky-700 dark:text-sky-400 font-bold'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Menu className="w-5 h-5 stroke-[1.8]" />
        <span className="text-[10px] mt-0.5">Mais</span>
      </button>
    </nav>
  );
};

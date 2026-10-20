import React from 'react';
import { Menu, Plus, UserCircle, Sun, Moon } from 'lucide-react';
import { CompanyLogo } from '../common/CompanyLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NavTab } from './Sidebar';
import { NotificationCenter } from '../notifications/NotificationCenter';

interface HeaderProps {
  activeTab?: NavTab;
  currentPage?: string;
  onOpenNewService?: () => void;
  onOpenNewServiceModal?: () => void;
  onOpenMobileMenu?: () => void;
  onNavigate?: (page: string) => void;
  onOpenNewClientModal?: () => void;
}

const tabTitles: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Visão Geral & Métricas', subtitle: 'Acompanhamento em tempo real de clientes, serviços e finanças' },
  clients: { title: 'Gestão de Clientes', subtitle: 'Cadastro, histórico e controle de piscinas' },
  clientes: { title: 'Gestão de Clientes', subtitle: 'Cadastro, histórico e controle de piscinas' },
  pools: { title: 'Gestão de Piscinas', subtitle: 'Parâmetros de água, volume e dosagem de produtos' },
  piscinas: { title: 'Gestão de Piscinas', subtitle: 'Parâmetros de água, volume e dosagem de produtos' },
  schedule: { title: 'Agenda & Visitas', subtitle: 'Programação de manutenções e visitas técnicas' },
  agenda: { title: 'Agenda & Visitas', subtitle: 'Programação de manutenções e visitas técnicas' },
  services: { title: 'Catálogo de Serviços', subtitle: 'Tabela de preços e serviços oferecidos' },
  servicos: { title: 'Catálogo de Serviços', subtitle: 'Tabela de preços e serviços oferecidos' },
  finance: { title: 'Controle Financeiro', subtitle: 'Fluxo de caixa, receitas, despesas e faturamento' },
  financeiro: { title: 'Controle Financeiro', subtitle: 'Fluxo de caixa, receitas, despesas e faturamento' },
  receipts: { title: 'Comprovantes & Relatórios', subtitle: 'Emissão e envio de comprovantes de serviço' },
  comprovantes: { title: 'Comprovantes & Relatórios', subtitle: 'Emissão e envio de comprovantes de serviço' },
  reports: { title: 'Relatórios & Exportações', subtitle: 'Estatísticas, métricas e downloads de dados' },
  relatorios: { title: 'Relatórios & Exportações', subtitle: 'Estatísticas, métricas e downloads de dados' },
  chat: { title: 'Chat IA Especialista', subtitle: 'Consultoria técnica, dosagem de produtos, diagnósticos e mensagens' },
  assistente: { title: 'Chat IA Especialista', subtitle: 'Consultoria técnica, dosagem de produtos, diagnósticos e mensagens' },
  settings: { title: 'Configurações do Sistema', subtitle: 'Dados da empresa, logotipo, tema e backups' },
  configuracoes: { title: 'Configurações do Sistema', subtitle: 'Dados da empresa, logotipo, tema e backups' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentPage,
  onOpenNewService,
  onOpenNewServiceModal,
  onOpenMobileMenu,
  onNavigate,
  onOpenNewClientModal,
}) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const activeTabKey = (activeTab || currentPage || 'dashboard').toLowerCase();
  const tabInfo = tabTitles[activeTabKey] || {
    title: 'Venâncio Piscinas',
    subtitle: 'Sistema de Gestão & Manutenção',
  };

  const handleServiceClick = () => {
    if (onOpenNewServiceModal) onOpenNewServiceModal();
    else if (onOpenNewService) onOpenNewService();
  };

  return (
    <header
      id="main-header"
      className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20 backdrop-blur-md bg-white/95 dark:bg-slate-900/95"
    >
      {/* Left side: Mobile Brand & Desktop Section Title */}
      <div className="flex items-center gap-3">
        {/* Mobile: Toggle menu + Official Logo */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Abrir Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <CompanyLogo
            variant="horizontal"
            size="xs"
            onClick={() => onNavigate && onNavigate('dashboard')}
          />
        </div>

        {/* Desktop: Page Title & Subtitle Only */}
        <div className="hidden lg:block">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
            {tabInfo.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tabInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right side: Action Buttons & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick New Client button on clients page */}
        {(activeTabKey === 'clients' || activeTabKey === 'clientes') && onOpenNewClientModal && (
          <button
            type="button"
            onClick={onOpenNewClientModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 rounded-lg hover:bg-sky-100 dark:hover:bg-sky-900/60 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Cliente</span>
          </button>
        )}

        {/* New Service Quick Action */}
        <button
          id="header-record-service-btn"
          type="button"
          onClick={handleServiceClick}
          className="bg-sky-600 hover:bg-sky-700 text-white px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-xs active:scale-[0.98] transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">Novo Serviço</span>
          <span className="xs:hidden">Serviço</span>
        </button>

        {/* Push Notification Center Dropdown */}
        <NotificationCenter />

        {/* Theme Toggle Button */}
        <button
          id="theme-toggle-header-btn"
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-95 cursor-pointer flex items-center justify-center"
          title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
          aria-label="Alternar tema claro e escuro"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* User profile avatar shortcut */}
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:opacity-80 transition cursor-pointer"
            title="Configurações e Perfil"
          >
            <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 font-bold text-xs flex items-center justify-center shadow-2xs">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'VP'}
            </div>
          </button>
        )}
      </div>
    </header>
  );
};

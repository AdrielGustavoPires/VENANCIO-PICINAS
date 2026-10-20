import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  DollarSign,
  Star,
  Info,
  Trash2,
  Check,
  ExternalLink,
  ShieldAlert,
  Send,
  Zap,
  X,
} from 'lucide-react';
import { AppNotification } from '../../types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification,
  subscribeToDatabase,
  checkOperationalAlerts,
} from '../../database/storage';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

interface NotificationCenterProps {
  onNavigate?: (page: string, entityId?: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ onNavigate }) => {
  const { info, success } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'appointment' | 'overdue_payment' | 'system'>('all');
  const [hasBrowserPermission, setHasBrowserPermission] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = () => {
    const list = getNotifications();
    setNotifications(list);
  };

  useEffect(() => {
    // Run automated operational scan on mount
    checkOperationalAlerts();
    loadNotifications();
    const unsubscribe = subscribeToDatabase(loadNotifications);

    // Check browser notification permission state
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasBrowserPermission(Notification.permission === 'granted');
    }

    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setHasBrowserPermission(true);
        success('Notificações push do navegador ativadas com sucesso!');
        new Notification('Venâncio Piscinas', {
          body: 'Notificações push configuradas e ativas!',
          icon: '/favicon.ico',
        });
      } else {
        info('Permissão para notificações não foi autorizada no navegador.');
      }
    }
  };

  const handleNotificationClick = (notif: AppNotification) => {
    markNotificationAsRead(notif.id);

    if (onNavigate) {
      if (notif.action_page) {
        onNavigate(notif.action_page, notif.entity_id);
      } else if (notif.type === 'appointment') {
        onNavigate('agenda', notif.entity_id);
      } else if (notif.type === 'overdue_payment') {
        onNavigate('financeiro', notif.entity_id);
      } else if (notif.type === 'feedback') {
        onNavigate('relatorios');
      }
    }

    setIsOpen(false);
  };

  const handleSimulateNotification = (type: 'appointment' | 'overdue_payment' | 'system_alert') => {
    if (type === 'appointment') {
      createNotification({
        type: 'appointment',
        title: 'Novo Agendamento Confirmado',
        message: 'Marina Silveira Prado agendou Manutenção e Cristalização para amanhã às 10:00.',
        priority: 'high',
        entity_type: 'appointment',
        action_page: 'agenda',
      });
      success('Notificação de novo agendamento disparada!');
    } else if (type === 'overdue_payment') {
      createNotification({
        type: 'overdue_payment',
        title: 'Alerta de Cobrança Vencida',
        message: 'Dr. Roberto Albuquerque - Fatura de R$ 650,00 aguardando baixa via Pix.',
        priority: 'high',
        entity_type: 'payment',
        action_page: 'financeiro',
      });
      success('Notificação de pagamento vencido disparada!');
    } else {
      createNotification({
        type: 'system_alert',
        title: 'Alerta Meteorológico & Qualidade',
        message: 'Alerta de frente fria e tempestade na Grande SP: reforce a alcalinidade e cloro das piscinas abertas.',
        priority: 'medium',
        entity_type: 'system',
        action_page: 'agenda',
      });
      success('Alerta de sistema disparado!');
    }
  };

  const filteredNotifications = notifications.filter(n => {
    if (filterTab === 'unread') return !n.read;
    if (filterTab === 'appointment') return n.type === 'appointment';
    if (filterTab === 'overdue_payment') return n.type === 'overdue_payment';
    if (filterTab === 'system') return n.type === 'system_alert' || n.type === 'feedback';
    return true;
  });

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'overdue_payment':
        return <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'feedback':
        return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
      case 'system_alert':
      default:
        return <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    }
  };

  const getPriorityBadge = (priority: AppNotification['priority']) => {
    switch (priority) {
      case 'high':
        return (
          <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
            Urgente
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
            Importante
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Info
          </span>
        );
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    try {
      const diffMs = Date.now() - new Date(timestamp).getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 1) return 'Agora mesmo';
      if (diffMinutes < 60) return `Há ${diffMinutes} min`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `Há ${diffHours}h`;
      return formatDate(timestamp.split('T')[0]);
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button Trigger */}
      <button
        type="button"
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
        aria-label="Abrir Notificações"
        title="Central de Notificações Push"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[10px] font-extrabold shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden flex flex-col text-xs font-sans">
          {/* Header */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Notificações Push & Alertas
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  {unreadCount} novas
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllNotificationsAsRead}
                  className="p-1 text-slate-500 hover:text-sky-600 rounded text-[11px] font-semibold"
                  title="Marcar todas como lidas"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={clearAllNotifications}
                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                title="Limpar tudo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Browser Permission Banner if not enabled */}
          {!hasBrowserPermission && typeof window !== 'undefined' && 'Notification' in window && (
            <div className="px-3.5 py-2 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-950/60 dark:to-blue-950/40 border-b border-sky-100 dark:border-sky-900/50 flex items-center justify-between gap-2">
              <p className="text-[11px] text-sky-900 dark:text-sky-200">
                Receber alertas mesmo com o app em segundo plano?
              </p>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-2 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded text-[10px] font-bold shrink-0 transition"
              >
                Ativar
              </button>
            </div>
          )}

          {/* Tabs Filter */}
          <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 overflow-x-auto bg-slate-50/50 dark:bg-slate-900/40">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'unread', label: 'Não lidas' },
              { id: 'appointment', label: '📅 Agenda' },
              { id: 'overdue_payment', label: '💰 Cobranças' },
              { id: 'system', label: '⚙️ Sistema' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterTab(tab.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                  filterTab === tab.id
                    ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-300 shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                  Tudo limpo por aqui!
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Nenhuma notificação nesta categoria.
                </p>
              </div>
            ) : (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer flex items-start gap-3 relative ${
                    !notif.read ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                  }`}
                >
                  {/* Indicator unread dot */}
                  {!notif.read && (
                    <span className="absolute top-3 left-1.5 w-1.5 h-1.5 rounded-full bg-sky-600" />
                  )}

                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {notif.title}
                      </h4>
                      {getPriorityBadge(notif.priority)}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                      <span>{formatRelativeTime(notif.timestamp)}</span>
                      <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-0.5 hover:underline">
                        Ver detalhes <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      deleteNotification(notif.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded"
                    title="Excluir"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Quick Simulation Triggers Footer */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Simular Alerta de Teste:
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleSimulateNotification('appointment')}
                className="py-1 px-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-medium text-center truncate cursor-pointer transition"
              >
                + 📅 Agenda
              </button>
              <button
                type="button"
                onClick={() => handleSimulateNotification('overdue_payment')}
                className="py-1 px-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-medium text-center truncate cursor-pointer transition"
              >
                + 💰 Cobrança
              </button>
              <button
                type="button"
                onClick={() => handleSimulateNotification('system_alert')}
                className="py-1 px-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded text-[10px] font-medium text-center truncate cursor-pointer transition"
              >
                + ⚡ Sistema
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

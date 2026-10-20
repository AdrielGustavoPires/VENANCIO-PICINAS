import React, { useState, useEffect } from 'react';
import {
  Users,
  Wrench,
  CalendarDays,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  PlusCircle,
  Waves,
  Sparkles,
  ChevronRight,
  FileCheck,
  Percent,
  Check,
  Plus,
  Trash2,
  Bell,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getClients,
  getPools,
  getServices,
  getAppointments,
  getServiceRecords,
  subscribeToDatabase,
} from '../database/storage';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { Appointment, Client, ServiceRecord, Pool, ServiceItem } from '../types';
import { ServicesComparisonChart } from '../components/dashboard/ServicesComparisonChart';

interface DashboardProps {
  onNavigate: (tab: any) => void;
  onSelectClient?: (clientId: string) => void;
  onOpenNewService?: (clientId?: string, poolId?: string) => void;
  onOpenNewServiceModal?: (prefillAppointmentId?: string) => void;
  onOpenNewClientModal?: () => void;
  onOpenNewPoolModal?: () => void;
  onOpenNewAppointment?: (clientId?: string) => void;
  onOpenNewAppointmentModal?: () => void;
  onViewReceipt?: (recordId: string) => void;
}

type PeriodFilter = '7d' | '30d' | 'month' | '6m' | 'year';

interface QuickReminder {
  id: string;
  text: string;
  author: string;
  color: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onSelectClient,
  onOpenNewService,
  onOpenNewServiceModal,
  onOpenNewClientModal,
  onOpenNewPoolModal,
  onOpenNewAppointment,
  onOpenNewAppointmentModal,
  onViewReceipt,
}) => {
  const { user } = useAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [period, setPeriod] = useState<PeriodFilter>('30d');

  // Interactive Quick Reminders for High Density widget
  const [reminders, setReminders] = useState<QuickReminder[]>([
    { id: '1', text: 'Verificar estoque de Cloro e Decantador na Quarta-feira.', author: 'VP', color: 'bg-sky-500' },
    { id: '2', text: 'Revisar dosagem química da piscina olímpica Cond. Lagos.', author: 'TM', color: 'bg-emerald-500' },
  ]);
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [newReminderText, setNewReminderText] = useState('');

  const loadData = () => {
    setClients(getClients());
    setPools(getPools());
    setServices(getServices());
    setAppointments(getAppointments());
    setRecords(getServiceRecords());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDatabase(loadData);
    return () => unsubscribe();
  }, []);

  const handleRecordService = (appointmentId?: string) => {
    if (onOpenNewServiceModal) onOpenNewServiceModal(appointmentId);
    else if (onOpenNewService) onOpenNewService();
  };

  const handleCreateAppointment = () => {
    if (onOpenNewAppointmentModal) onOpenNewAppointmentModal();
    else if (onOpenNewAppointment) onOpenNewAppointment();
  };

  // Compute Metrics
  const totalClients = clients.length;
  const totalPools = pools.length;

  // Services this month
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const recordsThisMonth = records.filter(r => r.service_date.startsWith(currentMonthStr));
  const servicesThisMonthCount = recordsThisMonth.length;

  // Total scheduled appointments upcoming
  const upcomingAppointments = appointments
    .filter(a => a.status === 'Agendado' || a.status === 'Em andamento')
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const scheduledCount = upcomingAppointments.length;

  // Revenue & Pending computations
  const totalInvoiced = records.reduce((sum, r) => sum + r.final_price, 0);
  const totalReceived = records.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
  const totalPending = records.reduce((sum, r) => sum + Math.max(0, r.final_price - (r.amount_paid || 0)), 0);

  // Status breakdown
  const countRealizados = records.length;
  const countPagos = records.filter(r => r.payment_status === 'Pago').length;
  const countPendentes = records.filter(r => r.payment_status === 'Pendente' || r.payment_status === 'Parcial').length;

  // Revenue Chart Data calculation from real records
  const getRevenueChartData = () => {
    const now = new Date();

    if (period === '7d') {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
        const dayRecords = records.filter(r => r.service_date === dayStr);
        const faturado = dayRecords.reduce((sum, r) => sum + r.final_price, 0);
        const recebido = dayRecords.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
        days.push({ label: dayLabel, faturado, recebido });
      }
      return days;
    }

    if (period === '30d') {
      const weeks = [
        { label: 'Sem 1', faturado: 0, recebido: 0 },
        { label: 'Sem 2', faturado: 0, recebido: 0 },
        { label: 'Sem 3', faturado: 0, recebido: 0 },
        { label: 'Sem 4', faturado: 0, recebido: 0 },
      ];
      records.forEach(r => {
        const recordDate = new Date(r.service_date);
        const diffDays = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays <= 30) {
          const weekIdx = Math.min(3, Math.floor(diffDays / 7.5));
          const target = weeks[3 - weekIdx];
          if (target) {
            target.faturado += r.final_price;
            target.recebido += r.amount_paid || 0;
          }
        }
      });
      return weeks;
    }

    if (period === 'month') {
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const monthRecords = records.filter(r => {
        const d = new Date(r.service_date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      });

      const ranges = [
        { label: 'Dias 01-07', faturado: 0, recebido: 0 },
        { label: 'Dias 08-14', faturado: 0, recebido: 0 },
        { label: 'Dias 15-21', faturado: 0, recebido: 0 },
        { label: 'Dias 22+', faturado: 0, recebido: 0 },
      ];

      monthRecords.forEach(r => {
        const day = new Date(r.service_date).getDate();
        if (day <= 7) {
          ranges[0].faturado += r.final_price;
          ranges[0].recebido += r.amount_paid || 0;
        } else if (day <= 14) {
          ranges[1].faturado += r.final_price;
          ranges[1].recebido += r.amount_paid || 0;
        } else if (day <= 21) {
          ranges[2].faturado += r.final_price;
          ranges[2].recebido += r.amount_paid || 0;
        } else {
          ranges[3].faturado += r.final_price;
          ranges[3].recebido += r.amount_paid || 0;
        }
      });
      return ranges;
    }

    if (period === '6m') {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const result = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mIdx = d.getMonth();
        const year = d.getFullYear();
        const label = months[mIdx];
        const monthRecs = records.filter(r => {
          const rd = new Date(r.service_date);
          return rd.getFullYear() === year && rd.getMonth() === mIdx;
        });
        const faturado = monthRecs.reduce((s, r) => s + r.final_price, 0);
        const recebido = monthRecs.reduce((s, r) => s + (r.amount_paid || 0), 0);
        result.push({ label, faturado, recebido });
      }
      return result;
    }

    // 'year'
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentYear = now.getFullYear();
    return monthNames.map((label, mIdx) => {
      const monthRecs = records.filter(r => {
        const rd = new Date(r.service_date);
        return rd.getFullYear() === currentYear && rd.getMonth() === mIdx;
      });
      const faturado = monthRecs.reduce((s, r) => s + r.final_price, 0);
      const recebido = monthRecs.reduce((s, r) => s + (r.amount_paid || 0), 0);
      return { label, faturado, recebido };
    });
  };

  const revenueChartData = getRevenueChartData();

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText.trim()) return;
    const newRem: QuickReminder = {
      id: String(Date.now()),
      text: newReminderText.trim(),
      author: user?.name ? user.name.slice(0, 2).toUpperCase() : 'VP',
      color: 'bg-sky-500',
    };
    setReminders([newRem, ...reminders]);
    setNewReminderText('');
    setIsAddingReminder(false);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-slate-800 dark:text-slate-200">
      {/* 4-Column KPI Cards Grid (High Density Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 shrink-0">
        {/* Card 1: Clientes Ativos */}
        <div
          onClick={() => onNavigate('clientes')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
        >
          <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
            Clientes Ativos
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {totalClients}
          </div>
          <div className="mt-2 flex items-center gap-1 text-emerald-500 text-xs font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{totalClients === 0 ? 'Cadastre seu 1º cliente' : 'Cadastrados'}</span>
          </div>
        </div>

        {/* Card 2: Serviços/Mês */}
        <div
          onClick={() => onNavigate('servicos')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
        >
          <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
            Serviços/Mês
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {servicesThisMonthCount || countRealizados}
          </div>
          <div className="mt-2 flex items-center gap-1 text-emerald-500 text-xs font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>{countRealizados === 0 ? 'Nenhum este mês' : `${countRealizados} realizados`}</span>
          </div>
        </div>

        {/* Card 3: Faturamento */}
        <div
          onClick={() => onNavigate('financeiro')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
        >
          <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
            Faturamento
          </div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {formatCurrency(totalInvoiced)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-sky-500 text-xs font-medium">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{totalInvoiced > 0 ? 'Total registrado' : 'Sem faturamento'}</span>
          </div>
        </div>

        {/* Card 4: A Receber */}
        <div
          onClick={() => onNavigate('financeiro')}
          className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition cursor-pointer"
        >
          <div className="text-slate-400 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
            A Receber
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totalPending)}
          </div>
          <div className="mt-2 flex items-center gap-1 text-slate-400 dark:text-slate-500 text-xs font-medium">
            <span>{countPendentes} pagamentos pendentes</span>
          </div>
        </div>
      </div>

      {/* Main Split Grid (2:1 Ratio: High Density Services Table + Right Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left: Próximos Serviços (Hoje) Table (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs flex flex-col justify-between overflow-hidden h-full">
          <div>
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 text-sm sm:text-base">
                <span className="w-2 h-4 bg-sky-500 rounded-full shrink-0" />
                <span>Próximos Atendimentos & Agenda</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('agenda')}
                className="text-sky-600 dark:text-sky-400 text-xs font-bold hover:underline cursor-pointer"
              >
                Ver agenda completa →
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0">
                  <tr>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                      Horário / Data
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider text-right">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {upcomingAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-400 dark:text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-600 stroke-[1.5]" />
                          <span className="font-medium text-slate-600 dark:text-slate-300">Nenhum atendimento agendado no momento</span>
                          <span className="text-[11px] text-slate-400">Crie novos agendamentos para otimizar suas rotas e manutenções diárias</span>
                          <button
                            type="button"
                            onClick={handleCreateAppointment}
                            className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agendar Novo Serviço</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    upcomingAppointments.slice(0, 5).map((app) => {
                      const client = clients.find(c => c.id === app.client_id);
                      const service = services.find(s => s.id === app.service_id);
                      const isRunning = app.status === 'Em andamento';
                      const isCompleted = app.status === 'Concluído';

                      return (
                        <tr
                          key={app.id}
                          className={`transition-colors ${
                            isRunning
                              ? 'bg-sky-50/40 dark:bg-sky-950/20 border-l-4 border-l-sky-500'
                              : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="px-5 py-3.5 text-sm font-semibold text-sky-700 dark:text-sky-400 whitespace-nowrap">
                            <div className="font-mono text-xs font-bold">{app.time || '08:30'}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{formatDate(app.date)}</div>
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[170px]">
                              {client?.name || 'Cliente'}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase truncate max-w-[170px]">
                              {client?.neighborhood || client?.city || client?.street || 'Residencial Lagos'}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                            {service?.name || 'Limpeza Completa'}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {isRunning ? (
                              <span className="px-2 py-0.5 bg-sky-100 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 rounded text-[10px] font-bold border border-sky-200 dark:border-sky-800 uppercase">
                                Em andamento
                              </span>
                            ) : isCompleted ? (
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 rounded text-[10px] font-bold border border-emerald-100 dark:border-emerald-900/50 uppercase">
                                Concluído
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 rounded text-[10px] font-bold border border-amber-100 dark:border-amber-900/50 uppercase">
                                Agendado
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleRecordService(app.id)}
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900 text-slate-600 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 rounded-md transition-colors cursor-pointer"
                              title="Concluir serviço e emitir comprovante"
                            >
                              <Check className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Total de <strong>{upcomingAppointments.length}</strong> atendimento(s) na fila
            </span>
            <button
              type="button"
              onClick={handleCreateAppointment}
              className="text-sky-600 dark:text-sky-400 font-bold hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Agendamento</span>
            </button>
          </div>
        </div>

        {/* Right: Faturamento Mensal Chart Widget & Lembrete Rápido Card (1 col) */}
        <div className="flex flex-col gap-4 h-full justify-between">
          {/* Faturamento Mensal Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                Faturamento Recente
              </h3>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value as PeriodFilter)}
                className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 focus:ring-0 cursor-pointer"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="month">Este Mês</option>
                <option value="6m">Últimos 6 Meses</option>
              </select>
            </div>

            {/* High Density Bar / Area Visualization */}
            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val: any) => [formatCurrency(Number(val)), 'Faturado']}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '11px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="faturado" fill="#0284c7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-between text-[8px] text-slate-400 dark:text-slate-500 mt-2 font-bold uppercase tracking-wider">
              <span>Sem 1</span>
              <span>Sem 2</span>
              <span>Sem 3</span>
              <span>Sem 4</span>
            </div>
          </div>

          {/* Lembrete Rápido Card (High Density Deep Sky Blue Accent) */}
          <div className="bg-sky-900 rounded-xl shadow-md p-4 sm:p-5 text-white flex-1 relative overflow-hidden flex flex-col justify-between min-h-[150px]">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-sky-300 mb-1 flex items-center justify-between">
                  <span>Lembrete Rápido</span>
                  <Bell className="w-3.5 h-3.5 text-sky-300" />
                </div>
                {reminders.length > 0 ? (
                  <div className="space-y-1.5 mt-1.5">
                    <h4 className="text-sm font-medium leading-snug">
                      {reminders[0].text}
                    </h4>
                    {reminders.length > 1 && (
                      <p className="text-[11px] text-sky-200/80 truncate">
                        • {reminders[1].text}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-sky-200 mt-2">Nenhum lembrete registrado.</p>
                )}
              </div>

              {/* Input for new reminder */}
              {isAddingReminder ? (
                <form onSubmit={handleAddReminder} className="mt-3 space-y-2">
                  <input
                    type="text"
                    value={newReminderText}
                    onChange={e => setNewReminderText(e.target.value)}
                    placeholder="Novo lembrete operacional..."
                    autoFocus
                    className="w-full px-2.5 py-1.5 text-xs text-slate-900 bg-white rounded-md focus:outline-hidden"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setIsAddingReminder(false)}
                      className="text-[10px] text-sky-200 hover:underline px-2 py-1"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-sky-600 hover:bg-sky-500 px-3 py-1 rounded text-[10px] font-bold"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-3 pt-2 flex items-center justify-between border-t border-white/10">
                  <div className="flex -space-x-1.5">
                    <div className="w-5 h-5 rounded-full border border-sky-900 bg-sky-500 flex items-center justify-center text-[8px] font-bold">
                      L
                    </div>
                    <div className="w-5 h-5 rounded-full border border-sky-900 bg-emerald-500 flex items-center justify-center text-[8px] font-bold">
                      A
                    </div>
                    <div className="w-5 h-5 rounded-full border border-sky-900 bg-amber-500 flex items-center justify-center text-[8px] font-bold">
                      V
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddingReminder(true)}
                    className="bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded text-[10px] font-bold transition cursor-pointer"
                  >
                    Novo Lembrete
                  </button>
                </div>
              )}
            </div>

            {/* Subtle background icon */}
            <svg
              className="absolute -bottom-10 -right-10 w-36 h-36 text-white/5 pointer-events-none"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Bar Chart: Comparison of Services performed over the last 6 months */}
      <ServicesComparisonChart
        records={records}
        services={services}
        onNavigate={onNavigate}
      />

      {/* Lower Section: Evolution Area Chart & Recent Receipts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Evolution Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between h-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <span className="w-2 h-4 bg-sky-500 rounded-full shrink-0" />
                <span>Evolução do Faturamento & Recebimentos</span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Total faturado comparado com valores efetivamente recebidos
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                <span className="text-slate-600 dark:text-slate-300">Faturado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-300">Recebido</span>
              </div>
            </div>
          </div>

          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="faturadoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="recebidoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={val => `R$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '11px',
                    border: 'none',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="faturado"
                  name="Faturado"
                  stroke="#0284c7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#faturadoGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="recebido"
                  name="Recebido"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#recebidoGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Últimos Comprovantes Emitidos (1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                <span className="w-2 h-4 bg-sky-500 rounded-full shrink-0" />
                <span>Últimos Comprovantes</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('comprovantes')}
                className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
              >
                Ver todos
              </button>
            </div>

            <div className="space-y-2.5 mt-3">
              {records.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhum comprovante emitido ainda.
                </div>
              ) : (
                records.slice(0, 3).map(rec => {
                  const client = clients.find(c => c.id === rec.client_id);
                  const service = services.find(s => s.id === rec.service_id);

                  return (
                    <div
                      key={rec.id}
                      onClick={() => onViewReceipt && onViewReceipt(rec.id)}
                      className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-sky-50/40 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wider">
                          #{rec.id.slice(-6).toUpperCase()}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            rec.payment_status === 'Pago'
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300'
                          }`}
                        >
                          {rec.payment_status}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {client?.name || 'Cliente'}
                      </div>
                      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{formatDate(rec.service_date)}</span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(rec.final_price)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('comprovantes')}
            className="w-full mt-3 py-2 text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 rounded-md transition text-center cursor-pointer"
          >
            Abrir Módulo de Comprovantes →
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  User,
  MapPin,
  Waves,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Edit2,
  Trash2,
  Check,
  Calendar,
  Sparkles,
  Camera,
  Navigation,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Appointment, Client, Pool, ServiceItem, AppointmentStatus, ServiceRecord } from '../types';
import {
  getAppointments,
  getClients,
  getPools,
  getServices,
  updateAppointment,
  deleteAppointment,
  subscribeToDatabase,
} from '../database/storage';
import { formatDate, formatPhone, generateWhatsAppLink } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { AppointmentModal } from '../components/appointments/AppointmentModal';
import { RecordServiceModal } from '../components/services/RecordServiceModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { LiveMapModal } from '../components/common/LiveMapModal';

interface ScheduleProps {
  onSelectClient?: (clientId: string) => void;
}

type MainScheduleTab = 'semanal' | 'mensal';
type WeekdayKey = 'Todos' | 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado';

const WEEKDAYS_LIST: { key: WeekdayKey; label: string; short: string }[] = [
  { key: 'Todos', label: 'Todos os Dias', short: 'TODOS' },
  { key: 'Segunda', label: 'Segunda-feira', short: 'SEG' },
  { key: 'Terça', label: 'Terça-feira', short: 'TER' },
  { key: 'Quarta', label: 'Quarta-feira', short: 'QUA' },
  { key: 'Quinta', label: 'Quinta-feira', short: 'QUI' },
  { key: 'Sexta', label: 'Sexta-feira', short: 'SEX' },
  { key: 'Sábado', label: 'Sábado', short: 'SÁB' },
];

export const Schedule: React.FC<ScheduleProps> = ({ onSelectClient }) => {
  const { success, error } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  // Main Tabs: 1. Roteiro Semanal (Seg a Sáb) vs 2. Visitas Mensais (Seg a Sáb)
  const [mainTab, setMainTab] = useState<MainScheduleTab>('semanal');

  // Tab 1: Weekday Filter (Segunda a Sábado)
  const [selectedWeekday, setSelectedWeekday] = useState<WeekdayKey>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | AppointmentStatus>('Todos');

  // Tab 2: Monthly Calendar (Segunda a Sábado)
  const [currentCalendarDate, setCurrentCalendarDate] = useState(() => new Date());
  const [selectedMonthDay, setSelectedMonthDay] = useState<number | null>(() => new Date().getDate());

  // Modals
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [appToEdit, setAppToEdit] = useState<Appointment | null>(null);
  const [appToDelete, setAppToDelete] = useState<Appointment | null>(null);

  // Live Map Modal
  const [isLiveMapOpen, setIsLiveMapOpen] = useState(false);
  const [mapTargetClient, setMapTargetClient] = useState<Client | null>(null);

  // Quick Service with Photo Modal (Check-in / Check-out com fotos)
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordPrefill, setRecordPrefill] = useState<{
    appointmentId?: string;
    clientId?: string;
    poolId?: string;
  }>({});

  const loadData = () => {
    setAppointments(getAppointments());
    setClients(getClients());
    setPools(getPools());
    setServices(getServices());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDatabase(loadData);
    return () => unsubscribe();
  }, []);

  // Today helpers
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];
  const currentDayOfWeekNumber = today.getDay(); // 0: Dom, 1: Seg, 2: Ter, 3: Qua, 4: Qui, 5: Sex, 6: Sab

  const weekdayMap: { [key: number]: WeekdayKey } = {
    1: 'Segunda',
    2: 'Terça',
    3: 'Quarta',
    4: 'Quinta',
    5: 'Sexta',
    6: 'Sábado',
  };

  // Quick mark as "Concluído"
  const handleToggleComplete = (app: Appointment) => {
    try {
      const nextStatus: AppointmentStatus = app.status === 'Concluído' ? 'Agendado' : 'Concluído';
      updateAppointment(app.id, { status: nextStatus });
      loadData();
      if (nextStatus === 'Concluído') {
        success(`Visita marcada como Concluída!`);
      } else {
        success('Status alterado para Agendado.');
      }
    } catch {
      error('Não foi possível atualizar o agendamento.');
    }
  };

  const handleConfirmDelete = () => {
    if (!appToDelete) return;
    try {
      deleteAppointment(appToDelete.id);
      loadData();
      success('Agendamento removido com sucesso!');
    } catch {
      error('Erro ao excluir agendamento.');
    } finally {
      setAppToDelete(null);
    }
  };

  const handleOpenPhotoService = (clientId?: string, poolId?: string, appointmentId?: string) => {
    setRecordPrefill({
      clientId,
      poolId,
      appointmentId,
    });
    setIsRecordModalOpen(true);
  };

  // ----------------------------------------------------
  // LOGIC FOR TAB 1: ROTEIRO SEMANAL (Segunda a Sábado)
  // ----------------------------------------------------
  // Clients that have the selected weekday configured in visit_days or preferred_day
  const clientsForWeekday = clients.filter(c => {
    if (selectedWeekday === 'Todos') return true;
    if (Array.isArray(c.visit_days) && c.visit_days.includes(selectedWeekday)) {
      return true;
    }
    if (c.preferred_day && c.preferred_day.includes(selectedWeekday)) {
      return true;
    }
    return false;
  });

  // Appointments matching the weekday
  const appointmentsForWeekday = appointments.filter(a => {
    if (statusFilter !== 'Todos' && a.status !== statusFilter) return false;
    if (selectedWeekday === 'Todos') return true;

    const [year, month, day] = a.date.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayOfWeek = dateObj.getDay();
    return weekdayMap[dayOfWeek] === selectedWeekday;
  });

  // ----------------------------------------------------
  // LOGIC FOR TAB 2: VISITAS MENSAIS (Segunda a Sábado)
  // ----------------------------------------------------
  const calendarYear = currentCalendarDate.getFullYear();
  const calendarMonth = currentCalendarDate.getMonth(); // 0 to 11
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const monthName = currentCalendarDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  // Build grid of days that fall on Segunda a Sábado
  // Column 0: Seg (day 1), Col 1: Ter (2), Col 2: Qua (3), Col 3: Qui (4), Col 4: Sex (5), Col 5: Sáb (6)
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateObj = new Date(calendarYear, calendarMonth, dayNum);
    const dayOfWeek = dateObj.getDay(); // 0: Dom, 1-6: Seg-Sab
    const isoString = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

    // Appointments on this exact date
    const dayAppointments = appointments.filter(a => a.date === isoString);

    // Clients with fixed monthly_visit_days matching dayNum or weekday
    const dayClients = clients.filter(c => {
      if (Array.isArray(c.monthly_visit_days) && c.monthly_visit_days.includes(dayNum)) {
        return true;
      }
      if (dayOfWeek >= 1 && dayOfWeek <= 6) {
        const wkKey = weekdayMap[dayOfWeek];
        if (Array.isArray(c.visit_days) && c.visit_days.includes(wkKey)) {
          return true;
        }
      }
      return false;
    });

    return {
      dayNum,
      dayOfWeek,
      dateObj,
      isoString,
      isSunday: dayOfWeek === 0,
      weekdayKey: dayOfWeek >= 1 && dayOfWeek <= 6 ? weekdayMap[dayOfWeek] : null,
      appointments: dayAppointments,
      clients: dayClients,
      isToday: isoString === todayIso,
    };
  });

  const selectedDayData = selectedMonthDay ? monthDays.find(d => d.dayNum === selectedMonthDay) : null;

  return (
    <div id="schedule-tab-view" className="space-y-6 pb-12">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <CalendarDays className="w-6 h-6 text-sky-500" />
            <span>Agenda & Roteiro de Visitas</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Gestão de rotas semanais, escala de visitas mensais e comprovação com fotos (Segunda a Sábado)
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            id="btn-open-live-map"
            type="button"
            onClick={() => {
              setMapTargetClient(clientsForWeekday[0] || clients[0] || null);
              setIsLiveMapOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-500/40 text-xs sm:text-sm font-bold rounded-xl active:scale-95 transition cursor-pointer shrink-0"
          >
            <Navigation className="w-4 h-4 text-sky-400" />
            <span>Mapa em Tempo Real</span>
          </button>

          <button
            id="btn-quick-photo-service"
            type="button"
            onClick={() => handleOpenPhotoService()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 text-xs sm:text-sm font-bold rounded-xl active:scale-95 transition cursor-pointer shrink-0"
          >
            <Camera className="w-4 h-4 text-sky-400" />
            <span>Tirar Foto & Iniciar</span>
          </button>

          <button
            id="btn-add-new-appointment"
            type="button"
            onClick={() => {
              setAppToEdit(null);
              setIsAppModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-sky-500/25 active:scale-95 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* 2. As Duas Abas Principais: Segunda a Sábado */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 flex items-center gap-1.5 max-w-xl">
        <button
          id="tab-btn-roteiro-semanal"
          type="button"
          onClick={() => setMainTab('semanal')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'semanal'
              ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>1. Roteiro Semanal (Seg a Sáb)</span>
        </button>

        <button
          id="tab-btn-visitas-mensais"
          type="button"
          onClick={() => setMainTab('mensal')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition flex items-center justify-center gap-2 cursor-pointer ${
            mainTab === 'mensal'
              ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-md shadow-sky-500/25'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>2. Visitas Mensais (Seg a Sáb)</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* ABA 1: ROTEIRO SEMANAL (SEGUNDA A SÁBADO) */}
      {/* ---------------------------------------------------------------- */}
      {mainTab === 'semanal' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Weekday Selector Bar: Segunda a Sábado */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                  Selecione o Dia da Visita (Segunda a Sábado):
                </span>
                <span className="text-[11px] text-slate-400">
                  Exibe clientes fixos do dia e visitas programadas
                </span>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-semibold hidden sm:inline">Status:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Todos os Status</option>
                  <option value="Agendado">Agendado</option>
                  <option value="Concluído">Concluído</option>
                  <option value="Em andamento">Em andamento</option>
                </select>
              </div>
            </div>

            {/* Day Pills */}
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 pt-1">
              {WEEKDAYS_LIST.map(day => {
                const isSelected = selectedWeekday === day.key;
                const count =
                  day.key === 'Todos'
                    ? clients.length
                    : clients.filter(c => Array.isArray(c.visit_days) && c.visit_days.includes(day.key)).length;

                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedWeekday(day.key)}
                    className={`py-2.5 px-3 rounded-xl font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/25'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-black">{day.short}</span>
                    <span className="text-[10px] opacity-80">{count} clientes</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Banner of the selected day route */}
          <div className="p-4 bg-gradient-to-r from-sky-950/80 via-blue-900/40 to-slate-900 border border-sky-800/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-500/20 text-sky-400 rounded-xl">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base">
                  Roteiro de {selectedWeekday === 'Todos' ? 'Todos os Dias' : `${selectedWeekday}-feira`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {clientsForWeekday.length} cliente(s) com visita programada neste dia da semana
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAppToEdit(null);
                  setIsAppModalOpen(true);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agendar para {selectedWeekday}</span>
              </button>
            </div>
          </div>

          {/* Cards List: Clients and Appointments for this Weekday */}
          {clientsForWeekday.length === 0 && appointmentsForWeekday.length === 0 ? (
            <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-10 text-center max-w-lg mx-auto">
              <CalendarDays className="w-10 h-10 text-sky-500/40 mx-auto mb-3" />
              <h4 className="font-bold text-white text-base">Nenhum cliente agendado para {selectedWeekday}</h4>
              <p className="text-xs text-slate-400 mt-1">
                Configure os dias de visita no cadastro do cliente ou adicione uma nova visita avulsa.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clientsForWeekday.map(client => {
                const clientPools = pools.filter(p => p.client_id === client.id);
                const pool = clientPools[0];
                const rawPhone = client.whatsapp || client.phone || '';
                const waLink = generateWhatsAppLink(
                  rawPhone,
                  `Olá ${client.name}, estamos a caminho para a manutenção semanal da piscina (Venâncio Piscinas).`
                );

                return (
                  <div
                    key={client.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 rounded-2xl p-4 sm:p-5 shadow-xs transition space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 font-black flex items-center justify-center text-sm shrink-0">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4
                            onClick={() => onSelectClient && onSelectClient(client.id)}
                            className="font-bold text-slate-900 dark:text-white hover:text-sky-400 cursor-pointer transition truncate text-sm sm:text-base"
                          >
                            {client.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="truncate">
                              {client.street ? `${client.street}, ${client.number || 'S/N'}` : 'Endereço não cadastrado'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                        {client.service_frequency || 'Semanal'}
                      </span>
                    </div>

                    {/* Pool specs and Days */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Waves className="w-3.5 h-3.5 text-cyan-500" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {pool?.name || 'Piscina Principal'} ({pool?.type || 'Fibra'} •{' '}
                          {pool?.volume ? `${pool.volume.toLocaleString('pt-BR')}L` : '30.000L'})
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {client.visit_days?.map(d => (
                          <span
                            key={d}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              d === selectedWeekday
                                ? 'bg-sky-500 text-white'
                                : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {d.slice(0, 3).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons: Tirar Foto & Iniciar + WhatsApp + Mapa */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {rawPhone && (
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                          title="Avisar no WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setMapTargetClient(client);
                          setIsLiveMapOpen(true);
                        }}
                        className="p-2 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Ver no Mapa / Traçar Rota"
                      >
                        <Navigation className="w-4 h-4" />
                        <span className="hidden sm:inline">Mapa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenPhotoService(client.id, pool?.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Tirar Foto & Iniciar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* ABA 2: VISITAS MENSAIS (SEGUNDA A SÁBADO) */}
      {/* ---------------------------------------------------------------- */}
      {mainTab === 'mensal' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Month Header with Navigation */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white capitalize">
                  {monthName}
                </h3>
                <p className="text-xs text-slate-400">
                  Escala mensal de Segunda a Sábado • Visitas programadas e dias fixos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentCalendarDate(
                    new Date(calendarYear, calendarMonth - 1, 1)
                  )
                }
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentCalendarDate(new Date())}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-400 border border-slate-700 transition cursor-pointer"
              >
                Mês Atual
              </button>

              <button
                type="button"
                onClick={() =>
                  setCurrentCalendarDate(
                    new Date(calendarYear, calendarMonth + 1, 1)
                  )
                }
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CALENDAR GRID: 6 COLUMNS (SEGUNDA A SÁBADO) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
            {/* Header Columns: Segunda a Sábado */}
            <div className="grid grid-cols-6 gap-2 text-center border-b border-slate-800 pb-2.5">
              {[
                { label: 'Segunda', short: 'SEG' },
                { label: 'Terça', short: 'TER' },
                { label: 'Quarta', short: 'QUA' },
                { label: 'Quinta', short: 'QUI' },
                { label: 'Sexta', short: 'SEX' },
                { label: 'Sábado', short: 'SÁB' },
              ].map(col => (
                <div key={col.label} className="text-xs font-black text-sky-400 uppercase tracking-wider">
                  <span className="hidden sm:inline">{col.label}</span>
                  <span className="sm:hidden">{col.short}</span>
                </div>
              ))}
            </div>

            {/* Month Day Cells (Filtering only Mon-Sat) */}
            <div className="grid grid-cols-6 gap-2">
              {monthDays
                .filter(d => !d.isSunday)
                .map(d => {
                  const isSelected = selectedMonthDay === d.dayNum;
                  const totalCount = d.clients.length + d.appointments.length;

                  return (
                    <div
                      key={d.dayNum}
                      onClick={() => setSelectedMonthDay(d.dayNum)}
                      className={`min-h-[90px] sm:min-h-[110px] p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-500 ring-2 ring-sky-500/30'
                          : d.isToday
                          ? 'bg-sky-950/30 border-sky-800/80 hover:border-sky-500'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-black w-6 h-6 rounded-lg flex items-center justify-center ${
                            d.isToday
                              ? 'bg-sky-500 text-white shadow-xs'
                              : isSelected
                              ? 'bg-sky-400 text-slate-950'
                              : 'text-slate-300'
                          }`}
                        >
                          {d.dayNum}
                        </span>

                        {totalCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-sky-500/20 text-sky-300">
                            {totalCount}
                          </span>
                        )}
                      </div>

                      {/* Mini client names */}
                      <div className="space-y-1 my-1 overflow-hidden">
                        {d.clients.slice(0, 2).map(c => (
                          <div
                            key={c.id}
                            className="text-[10px] truncate px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium"
                          >
                            {c.name.split(' ')[0]}
                          </div>
                        ))}
                        {d.clients.length > 2 && (
                          <span className="text-[9px] text-slate-400 font-bold block">
                            +{d.clients.length - 2} mais
                          </span>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 font-mono">
                          {d.weekdayKey?.slice(0, 3)}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Selected Month Day Detailed View */}
          {selectedDayData && (
            <div className="p-5 bg-slate-900 border border-sky-500/30 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-white">
                      Visitas do Dia {selectedDayData.dayNum} ({selectedDayData.weekdayKey}-feira)
                    </h4>
                    <p className="text-xs text-slate-400">
                      {selectedDayData.clients.length} cliente(s) agendados ou fixados para este dia
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenPhotoService()}
                  className="px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Iniciar Visita do Dia com Foto</span>
                </button>
              </div>

              {/* List of Clients for this selected date */}
              {selectedDayData.clients.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  Nenhum cliente agendado para o dia {selectedDayData.dayNum}.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedDayData.clients.map(client => {
                    const clientPools = pools.filter(p => p.client_id === client.id);
                    const pool = clientPools[0];

                    return (
                      <div
                        key={client.id}
                        className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h5
                            onClick={() => onSelectClient && onSelectClient(client.id)}
                            className="font-bold text-xs text-white hover:text-sky-400 cursor-pointer truncate"
                          >
                            {client.name}
                          </h5>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {client.street ? `${client.street}, ${client.number}` : 'Endereço não informado'}
                          </p>
                          <span className="text-[10px] text-sky-400 font-medium">
                            {pool?.name || 'Piscina'} • {client.service_frequency || 'Semanal'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenPhotoService(client.id, pool?.id)}
                          className="px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Check-in</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={isAppModalOpen}
        onClose={() => {
          setIsAppModalOpen(false);
          setAppToEdit(null);
        }}
        appointmentToEdit={appToEdit}
      />

      {/* Service Modal with Start and End Photos & Real-time GPS Mapping */}
      <RecordServiceModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        prefillAppointmentId={recordPrefill.appointmentId}
        prefillClientId={recordPrefill.clientId}
        prefillPoolId={recordPrefill.poolId}
        onServiceRecorded={() => {
          loadData();
          setIsRecordModalOpen(false);
        }}
      />

      {/* Live Map & GPS Route Tracker Modal */}
      <LiveMapModal
        isOpen={isLiveMapOpen}
        onClose={() => {
          setIsLiveMapOpen(false);
          setMapTargetClient(null);
        }}
        targetClient={mapTargetClient}
        allTodayClients={clientsForWeekday.length > 0 ? clientsForWeekday : clients}
        onStartServiceWithPhoto={client => {
          setIsLiveMapOpen(false);
          handleOpenPhotoService(client.id);
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!appToDelete}
        title="Cancelar e Excluir Agendamento"
        message={`Deseja realmente excluir a visita agendada para ${
          clients.find(c => c.id === appToDelete?.client_id)?.name || 'este cliente'
        } no horário ${appToDelete?.time || ''} (${appToDelete ? formatDate(appToDelete.date) : ''})? Esta ação não pode ser desfeita.`}
        confirmText="Sim, Excluir"
        cancelText="Voltar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setAppToDelete(null)}
      />
    </div>
  );
};

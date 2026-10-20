import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  MessageCircle,
  MapPin,
  Edit2,
  Trash2,
  Eye,
  Waves,
  Calendar,
  Sparkles,
  ChevronRight,
  Droplets,
  CheckCircle2,
  Clock,
  ExternalLink,
  AlertTriangle,
  CalendarX,
  DollarSign,
  Filter,
  UserCheck,
  UserX,
  ArrowUpDown,
} from 'lucide-react';
import { Client, Pool, ServiceRecord, Appointment } from '../types';
import {
  getClients,
  deleteClient,
  getPools,
  getServiceRecords,
  getAppointments,
  markClientAsPaid,
  subscribeToDatabase,
} from '../database/storage';
import { formatCurrency, formatDate, formatPhone, generateWhatsAppLink } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { ClientModal } from '../components/clients/ClientModal';

interface ClientsProps {
  onSelectClient: (clientId: string) => void;
  onOpenNewServiceForClient?: (clientId: string) => void;
}

type FilterType = 'todos' | 'ativos' | 'inativos' | 'pendentes' | 'vencimentos' | 'sem_atendimento';

export const Clients: React.FC<ClientsProps> = ({
  onSelectClient,
  onOpenNewServiceForClient,
}) => {
  const { success, error } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const loadData = () => {
    setClients(getClients());
    setPools(getPools());
    setRecords(getServiceRecords());
    setAppointments(getAppointments());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDatabase(loadData);
    return () => unsubscribe();
  }, []);

  // Compute stats and per-client calculated data
  const clientsData = useMemo(() => {
    const today = new Date();

    return clients.map(client => {
      const clientPools = pools.filter(p => p.client_id === client.id);
      const primaryPool = clientPools[0];

      const clientRecords = records
        .filter(r => r.client_id === client.id)
        .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime());

      const lastRecord = clientRecords[0];

      // Next scheduled appointment
      const clientAppointments = appointments
        .filter(a => a.client_id === client.id && a.status !== 'Cancelado' && a.status !== 'Concluído')
        .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime());

      const nextAppointment = clientAppointments.find(a => new Date(a.date) >= new Date(today.toISOString().split('T')[0]));

      // Financial status
      const hasPendingPayment = clientRecords.some(r => r.payment_status === 'Pendente' || (r.final_price > (r.amount_paid || 0)));

      // Days since last service
      let daysSinceLastService: number | null = null;
      if (lastRecord?.service_date) {
        const lastDate = new Date(lastRecord.service_date);
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        daysSinceLastService = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      // Is inactive or without recent care (> 30 days or never)
      const isWithoutRecentCare = daysSinceLastService === null || daysSinceLastService > 30;

      // Due date status calculation
      const todayIso = today.toISOString().split('T')[0];
      let isDueOverdue = false;
      let isDueSoon = false;
      let dueStatusLabel = client.due_date ? 'Em dia' : 'Sem vencimento';
      let dueStatusBadge = 'bg-sky-500/10 border-sky-500/25 text-sky-300';

      if (client.due_date) {
        const dueTime = new Date(`${client.due_date}T00:00:00`).getTime();
        const todayMidnight = new Date(`${todayIso}T00:00:00`).getTime();
        const diffDaysDue = Math.ceil((dueTime - todayMidnight) / (1000 * 60 * 60 * 24));

        if (diffDaysDue < 0) {
          isDueOverdue = true;
          dueStatusLabel = 'Vencido';
          dueStatusBadge = 'bg-rose-500/15 border-rose-500/35 text-rose-400';
        } else if (diffDaysDue === 0) {
          isDueSoon = true;
          dueStatusLabel = 'Vence Hoje';
          dueStatusBadge = 'bg-amber-500/15 border-amber-500/35 text-amber-400';
        } else if (diffDaysDue <= 5) {
          isDueSoon = true;
          dueStatusLabel = `Em ${diffDaysDue}d`;
          dueStatusBadge = 'bg-amber-500/15 border-amber-500/35 text-amber-300';
        }
      }

      // Overall health situation
      // 🟢 Em dia: Ativo, sem débitos ou marcado como Pago (sem vencimento)
      // 🟡 Atenção: Sem atendimento há > 20 dias (com vencimento ativo) ou vencimento próximo
      // 🔴 Pendente: Possui pendência financeira, vencimento atrasado ou está inativo
      let situation: 'em_dia' | 'atencao' | 'pendente' = 'em_dia';
      let situationLabel = !client.due_date ? 'Pago / Em dia' : 'Em dia';
      let situationBadge = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';

      if (client.status === 'Inativo' || hasPendingPayment || isDueOverdue) {
        situation = 'pendente';
        situationLabel =
          client.status === 'Inativo'
            ? 'Inativo'
            : isDueOverdue
            ? 'Vencido'
            : 'Pendente';
        situationBadge = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      } else if (isDueSoon || (isWithoutRecentCare && Boolean(client.due_date))) {
        situation = 'atencao';
        situationLabel = isDueSoon ? dueStatusLabel : 'Atenção (Sem visita)';
        situationBadge = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      }

      return {
        ...client,
        primaryPool,
        allPools: clientPools,
        lastRecord,
        nextAppointment,
        hasPendingPayment,
        daysSinceLastService,
        isWithoutRecentCare,
        isDueOverdue,
        isDueSoon,
        dueStatusLabel,
        dueStatusBadge,
        situation,
        situationLabel,
        situationBadge,
      };
    });
  }, [clients, pools, records, appointments]);

  // Overall KPI counts
  const kpis = useMemo(() => {
    const total = clientsData.length;
    const active = clientsData.filter(c => c.status !== 'Inativo').length;
    const pending = clientsData.filter(c => c.hasPendingPayment || c.isDueOverdue).length;
    const dueAlert = clientsData.filter(c => c.isDueOverdue || c.isDueSoon).length;
    const withoutRecent = clientsData.filter(c => c.status !== 'Inativo' && c.isWithoutRecentCare).length;

    return { total, active, pending, dueAlert, withoutRecent };
  }, [clientsData]);

  // Filter and search
  const filteredClients = useMemo(() => {
    return clientsData.filter(c => {
      // 1. Text Search Filter (Name, Phone, Address, Neighborhood, City)
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const nameMatch = (c.name || '').toLowerCase().includes(term);
        const streetMatch = (c.street || '').toLowerCase().includes(term);
        const neighborhoodMatch = (c.neighborhood || '').toLowerCase().includes(term);
        const cityMatch = (c.city || '').toLowerCase().includes(term);
        const phoneMatch = (c.phone || '').replace(/\D/g, '').includes(term.replace(/\D/g, ''));
        const waMatch = (c.whatsapp || '').replace(/\D/g, '').includes(term.replace(/\D/g, ''));

        if (!nameMatch && !streetMatch && !neighborhoodMatch && !cityMatch && !phoneMatch && !waMatch) {
          return false;
        }
      }

      // 2. Tab Filter
      if (activeFilter === 'ativos') {
        return c.status !== 'Inativo';
      }
      if (activeFilter === 'inativos') {
        return c.status === 'Inativo';
      }
      if (activeFilter === 'pendentes') {
        return c.hasPendingPayment || c.isDueOverdue;
      }
      if (activeFilter === 'vencimentos') {
        return c.isDueOverdue || c.isDueSoon;
      }
      if (activeFilter === 'sem_atendimento') {
        return c.status !== 'Inativo' && c.isWithoutRecentCare;
      }

      return true;
    });
  }, [clientsData, searchTerm, activeFilter]);

  const handleMarkClientPaid = (client: Client) => {
    try {
      markClientAsPaid(client.id);
      loadData();
      success(`Cliente "${client.name}" marcado como Pago e deixado sem vencimento!`);
    } catch {
      error('Não foi possível atualizar o vencimento do cliente.');
    }
  };

  const handleDelete = () => {
    if (!clientToDelete) return;
    try {
      deleteClient(clientToDelete.id);
      success(`Cliente "${clientToDelete.name}" removido com sucesso!`);
      setClientToDelete(null);
    } catch {
      error('Não foi possível excluir o cliente.');
    }
  };

  return (
    <div id="clients-management-page" className="space-y-6 pb-12">
      {/* 1. Header da Aba Clientes */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-sky-500" />
            <span>Clientes</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastro, histórico e acompanhamento dos clientes.
          </p>
        </div>

        <button
          id="btn-add-new-client"
          type="button"
          onClick={() => {
            setClientToEdit(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg shadow-sky-500/25 active:scale-95 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Novo Cliente</span>
        </button>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total de Clientes */}
        <div
          onClick={() => setActiveFilter('todos')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeFilter === 'todos'
              ? 'bg-sky-500/10 border-sky-500/40 text-sky-400'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total de Clientes
            </span>
            <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {kpis.total}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Cadastrados no sistema
          </p>
        </div>

        {/* Clientes Ativos */}
        <div
          onClick={() => setActiveFilter('ativos')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeFilter === 'ativos'
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Clientes Ativos
            </span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {kpis.active}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Contratos em andamento
          </p>
        </div>

        {/* Clientes com Serviço Pendente */}
        <div
          onClick={() => setActiveFilter('pendentes')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeFilter === 'pendentes'
              ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Com Débito / Pendente
            </span>
            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {kpis.pending}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Valores ou serviços em aberto
          </p>
        </div>

        {/* Clientes Sem Atendimento Recente */}
        <div
          onClick={() => setActiveFilter('sem_atendimento')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeFilter === 'sem_atendimento'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-white dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Sem Atendimento Recente
            </span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
              <CalendarX className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
            {kpis.withoutRecent}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Mais de 30 dias sem visita
          </p>
        </div>
      </div>

      {/* 3. Search Bar & Filter Buttons */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-clients-input"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome, telefone ou endereço..."
            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filter Buttons / Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('todos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'todos'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>Todos</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-md">
              {kpis.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('ativos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'ativos'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>Ativos</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-md">
              {kpis.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('pendentes')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'pendentes'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>Com serviço pendente</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-md">
              {kpis.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('vencimentos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'vencimentos'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Vencimento Próximo / Vencido</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-md">
              {kpis.dueAlert}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('sem_atendimento')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'sem_atendimento'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>Sem atendimento recente</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-md">
              {kpis.withoutRecent}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('inativos')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeFilter === 'inativos'
                ? 'bg-slate-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <span>Inativos</span>
          </button>
        </div>
      </div>

      {/* 4. Content: Empty State OR Desktop Table / Mobile Cards */}
      {filteredClients.length === 0 ? (
        <div
          id="clients-empty-state"
          className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-10 sm:p-14 text-center max-w-lg mx-auto"
        >
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4 text-sky-400">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
            {searchTerm || activeFilter !== 'todos'
              ? 'Nenhum cliente encontrado com estes filtros'
              : 'Nenhum cliente cadastrado ainda'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-md mx-auto">
            {searchTerm || activeFilter !== 'todos'
              ? 'Tente ajustar o termo pesquisado ou selecione o filtro "Todos" para ver todos os clientes.'
              : 'Cadastre seu primeiro cliente com informações de contato, especificações da piscina e frequência de limpeza.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {(searchTerm || activeFilter !== 'todos') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilter('todos');
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
              >
                Limpar Filtros
              </button>
            )}

            <button
              id="btn-empty-state-add-client"
              type="button"
              onClick={() => {
                setClientToEdit(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-500/25 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Cadastrar Novo Cliente</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* DESKTOP TABLE VIEW (hidden on mobile, visible on lg+) */}
          <div className="hidden lg:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Cliente</th>
                    <th className="py-3.5 px-4">Telefone / WhatsApp</th>
                    <th className="py-3.5 px-4">Vencimento</th>
                    <th className="py-3.5 px-4">Endereço</th>
                    <th className="py-3.5 px-4">Piscina</th>
                    <th className="py-3.5 px-4">Último Serviço</th>
                    <th className="py-3.5 px-4">Próximo Serviço</th>
                    <th className="py-3.5 px-4">Situação</th>
                    <th className="py-3.5 px-4">Valor</th>
                    <th className="py-3.5 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {filteredClients.map(client => {
                    const rawPhone = client.whatsapp || client.phone || '';
                    const waLink = generateWhatsAppLink(
                      rawPhone,
                      `Olá ${client.name}, tudo bem? Sou da Venâncio Piscinas - Limpeza e Manutenção.`
                    );

                    const priceToShow = client.default_service_price
                      ? client.default_service_price
                      : client.lastRecord?.final_price || 180;

                    return (
                      <tr
                        key={client.id}
                        id={`client-row-${client.id}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group"
                      >
                        {/* 1. Cliente */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              onClick={() => onSelectClient(client.id)}
                              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0 cursor-pointer"
                            >
                              {client.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div
                                onClick={() => onSelectClient(client.id)}
                                className="font-bold text-slate-900 dark:text-white hover:text-sky-400 cursor-pointer transition truncate max-w-[180px]"
                                title={client.name}
                              >
                                {client.name}
                              </div>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                <span className="text-[10px] font-semibold text-slate-400 truncate">
                                  {client.service_frequency || 'Semanal'}
                                </span>
                                {client.visit_days && client.visit_days.length > 0 ? (
                                  client.visit_days.map(d => (
                                    <span
                                      key={d}
                                      className="text-[9px] text-sky-300 bg-sky-500/20 border border-sky-500/30 px-1.5 py-0.2 rounded font-bold"
                                    >
                                      {d.slice(0, 3)}
                                    </span>
                                  ))
                                ) : client.preferred_day ? (
                                  <span className="text-[10px] text-sky-400 bg-sky-500/10 px-1.5 py-0.2 rounded font-medium">
                                    {client.preferred_day}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Telefone / WhatsApp */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {client.whatsapp ? (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition active:scale-95 cursor-pointer"
                              title="Abrir conversa no WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-emerald-400/20" />
                              <span>{formatPhone(client.whatsapp)}</span>
                            </a>
                          ) : client.phone ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                              <Phone className="w-3.5 h-3.5 text-sky-400" />
                              <span>{formatPhone(client.phone)}</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Não informado</span>
                          )}
                        </td>

                        {/* 2.5 Data de Vencimento */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {client.due_date ? (
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold font-mono ${client.dueStatusBadge}`}
                                >
                                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                                  <span>{formatDate(client.due_date)}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleMarkClientPaid(client)}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 text-[10px] font-extrabold uppercase transition cursor-pointer"
                                  title="Marcar cliente como Pago e deixar sem vencimento"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Pago</span>
                                </button>
                              </div>
                              {(client.isDueOverdue || client.isDueSoon) && (
                                <span
                                  className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                                    client.isDueOverdue
                                      ? 'text-rose-400 bg-rose-500/10'
                                      : 'text-amber-400 bg-amber-500/10'
                                  }`}
                                >
                                  ● {client.dueStatusLabel}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Sem vencimento</span>
                            </span>
                          )}
                        </td>

                        {/* 3. Endereço */}
                        <td className="py-4 px-4 max-w-[180px]">
                          <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                            <div className="truncate">
                              <p className="font-medium truncate">
                                {client.neighborhood || client.street || 'Não informado'}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {client.city}/{client.state || 'SP'}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* 4. Piscina */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {client.primaryPool ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <Waves className="w-4 h-4 text-sky-400 shrink-0" />
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {client.primaryPool.type}
                                </span>
                                <span className="text-slate-400 font-mono ml-1">
                                  • {(client.primaryPool.volume || 30000).toLocaleString('pt-BR')} L
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-500">Sem piscina</span>
                          )}
                        </td>

                        {/* 5. Último Serviço */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {client.lastRecord ? (
                            <div className="text-xs">
                              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                <Clock className="w-3 h-3 text-sky-400" />
                                <span>{formatDate(client.lastRecord.service_date)}</span>
                              </p>
                              <p className="text-[11px] text-slate-400 truncate max-w-[130px]">
                                {client.lastRecord.description || 'Limpeza Padrão'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">
                              Nenhum ainda
                            </span>
                          )}
                        </td>

                        {/* 6. Próximo Serviço */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {client.nextAppointment ? (
                            <div className="text-xs">
                              <p className="font-bold text-sky-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-sky-400" />
                                <span>{formatDate(client.nextAppointment.date)}</span>
                              </p>
                              <p className="text-[11px] text-slate-400">
                                {client.nextAppointment.time || '09:00'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">
                              A agendar
                            </span>
                          )}
                        </td>

                        {/* 7. Situação */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${client.situationBadge}`}
                          >
                            <span>●</span>
                            <span>{client.situationLabel}</span>
                          </span>
                        </td>

                        {/* 8. Valor */}
                        <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900 dark:text-white font-mono">
                          {formatCurrency(priceToShow)}
                        </td>

                        {/* 9. Ações */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Visualizar Detalhes */}
                            <button
                              type="button"
                              onClick={() => onSelectClient(client.id)}
                              className="px-2.5 py-1.5 bg-sky-500/15 hover:bg-sky-500 text-sky-400 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1"
                              title="Visualizar Detalhes"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver</span>
                            </button>

                            {/* Editar */}
                            <button
                              type="button"
                              onClick={() => {
                                setClientToEdit(client);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                              title="Editar Cliente"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Excluir */}
                            <button
                              type="button"
                              onClick={() => setClientToDelete(client)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition cursor-pointer"
                              title="Excluir Cliente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (visible on mobile / tablet, hidden on lg+) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
            {filteredClients.map(client => {
              const rawPhone = client.whatsapp || client.phone || '';
              const waLink = generateWhatsAppLink(
                rawPhone,
                `Olá ${client.name}, tudo bem? Sou da Venâncio Piscinas - Limpeza e Manutenção.`
              );

              const priceToShow = client.default_service_price
                ? client.default_service_price
                : client.lastRecord?.final_price || 180;

              return (
                <div
                  key={client.id}
                  id={`client-card-mobile-${client.id}`}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3.5"
                >
                  {/* Top: Name & Situation Badge */}
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          onClick={() => onSelectClient(client.id)}
                          className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-sky-500/20 shrink-0 cursor-pointer"
                        >
                          {client.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3
                            onClick={() => onSelectClient(client.id)}
                            className="font-bold text-base text-slate-900 dark:text-white hover:text-sky-400 cursor-pointer transition truncate"
                          >
                            {client.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="truncate">
                              {client.neighborhood || client.city || 'São Paulo'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border shrink-0 ${client.situationBadge}`}
                      >
                        {client.situationLabel}
                      </span>
                    </div>

                    {/* Address snippet */}
                    {client.street && (
                      <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                        <p className="truncate font-medium">
                          {client.street}, {client.number || 'S/N'} {client.complement ? `(${client.complement})` : ''}
                        </p>
                      </div>
                    )}

                    {/* Piscina & Atendimento specs */}
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300">
                        <p className="text-[10px] text-sky-400 font-bold uppercase">
                          Piscina
                        </p>
                        <p className="font-bold text-sky-200 truncate mt-0.5">
                          {client.primaryPool?.type || 'Fibra'} • {(client.primaryPool?.volume || 30000).toLocaleString('pt-BR')} L
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                        <p className="text-[10px] text-cyan-400 font-bold uppercase">
                          Frequência
                        </p>
                        <p className="font-bold text-cyan-200 truncate mt-0.5">
                          {client.service_frequency || 'Semanal'}
                        </p>
                      </div>
                    </div>

                    {/* Último & Vencimento & Valor */}
                    <div className="mt-3 grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Data de Vencimento
                        </span>
                        {client.due_date ? (
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                            <p
                              className={`font-bold font-mono flex items-center gap-1 ${
                                client.isDueOverdue
                                  ? 'text-rose-400'
                                  : client.isDueSoon
                                  ? 'text-amber-400'
                                  : 'text-sky-400'
                              }`}
                            >
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>{formatDate(client.due_date)}</span>
                            </p>
                            <button
                              type="button"
                              onClick={() => handleMarkClientPaid(client)}
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 text-[9px] font-extrabold uppercase transition cursor-pointer"
                              title="Marcar como Pago e deixar sem vencimento"
                            >
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>Pago</span>
                            </button>
                          </div>
                        ) : (
                          <p className="font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>Sem vencimento</span>
                          </p>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Último Serv.
                        </span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                          {client.lastRecord ? formatDate(client.lastRecord.service_date) : 'Nenhum'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Valor Padrão
                        </span>
                        <p className="font-bold text-emerald-500 font-mono mt-0.5">
                          {formatCurrency(priceToShow)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: WhatsApp & Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {rawPhone ? (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold active:scale-95 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-emerald-400/20" />
                        <span>{formatPhone(rawPhone)}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500">Sem telefone</span>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setClientToEdit(client);
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setClientToDelete(client)}
                        className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectClient(client.id)}
                        className="px-3 py-1.5 bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md active:scale-95 transition cursor-pointer"
                      >
                        <span>Detalhes</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div
          id="modal-delete-client"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">Excluir Cliente</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Tem certeza que deseja excluir o cliente{' '}
                <strong className="text-white">{clientToDelete.name}</strong> e suas piscinas vinculadas? Esta ação não pode ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 active:scale-95 transition cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Modal Form */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setClientToEdit(null);
        }}
        clientToEdit={clientToEdit}
        onClientSaved={() => loadData()}
      />
    </div>
  );
};

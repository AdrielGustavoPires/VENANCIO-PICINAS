import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  User,
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Waves,
  Plus,
  Wrench,
  DollarSign,
  Calendar,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit2,
  Trash2,
  Star,
  Check,
  AlertTriangle,
  Send,
  CalendarCheck,
  ShieldCheck,
  Droplet,
  Navigation,
} from 'lucide-react';
import { Client, Pool, ServiceRecord, ServiceItem, Appointment } from '../types';
import { LiveMapModal } from '../components/common/LiveMapModal';
import { getPoolImage, getDefaultPoolImageByType } from '../utils/poolImages';
import {
  getClientById,
  getPoolsByClientId,
  getServiceRecords,
  getServices,
  getAppointments,
  deleteClient,
  deletePool,
  markClientAsPaid,
  subscribeToDatabase,
} from '../database/storage';
import {
  formatCurrency,
  formatDate,
  formatPhone,
  formatCpfCnpj,
  formatCep,
  generateWhatsAppLink,
} from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { PoolModal } from '../components/pools/PoolModal';
import { ClientModal } from '../components/clients/ClientModal';
import { ClientFeedbackList } from '../components/feedback/ClientFeedbackList';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface ClientDetailProps {
  clientId: string;
  onBack: () => void;
  onOpenNewService: (clientId: string, poolId?: string) => void;
  onOpenNewAppointment: (clientId: string, poolId?: string) => void;
  onViewReceipt: (recordId: string) => void;
}

export const ClientDetail: React.FC<ClientDetailProps> = ({
  clientId,
  onBack,
  onOpenNewService,
  onOpenNewAppointment,
  onViewReceipt,
}) => {
  const { success, error } = useToast();

  const [client, setClient] = useState<Client | undefined>(undefined);
  const [pools, setPools] = useState<Pool[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);
  const [poolToEdit, setPoolToEdit] = useState<Pool | null>(null);
  const [poolToDelete, setPoolToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLiveMapOpen, setIsLiveMapOpen] = useState(false);

  const loadClientData = () => {
    const c = getClientById(clientId);
    setClient(c);
    setPools(getPoolsByClientId(clientId));
    const allRecords = getServiceRecords();
    setRecords(allRecords.filter(r => r.client_id === clientId));
    setServices(getServices());
    const allAppointments = getAppointments();
    setAppointments(allAppointments.filter(a => a.client_id === clientId));
  };

  useEffect(() => {
    loadClientData();
    const unsubscribe = subscribeToDatabase(loadClientData);
    return () => unsubscribe();
  }, [clientId]);

  const sortedRecords = useMemo(() => {
    return [...records].sort(
      (a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
    );
  }, [records]);

  const upcomingAppointment = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return appointments
      .filter(a => a.status !== 'Cancelado' && a.status !== 'Concluído' && a.date >= todayStr)
      .sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`).getTime() - new Date(`${b.date}T${b.time || '00:00'}`).getTime())[0];
  }, [appointments]);

  if (!client) {
    return (
      <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <User className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Cliente não localizado</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          O cliente selecionado pode ter sido removido ou o código de identificação é inválido.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Clientes</span>
        </button>
      </div>
    );
  }

  // Financial calculations
  const totalPaid = records.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
  const totalPending = records.reduce(
    (sum, r) => sum + Math.max(0, (r.final_price || 0) - (r.amount_paid || 0)),
    0
  );
  const totalServices = records.length;
  const lastRecord = sortedRecords[0];

  const whatsNumber = client.whatsapp || client.phone;
  const defaultPrice = client.default_service_price !== undefined ? client.default_service_price : 180;

  const handleDeleteClient = () => {
    try {
      deleteClient(client.id);
      success(`Cliente "${client.name}" excluído com sucesso.`);
      onBack();
    } catch {
      error('Não foi possível excluir o cliente.');
    }
  };

  const handleConfirmDeletePool = () => {
    if (!poolToDelete) return;
    try {
      deletePool(poolToDelete.id);
      loadClientData();
      success(`Piscina "${poolToDelete.name}" removida com sucesso.`);
    } catch {
      error('Erro ao excluir piscina.');
    } finally {
      setPoolToDelete(null);
    }
  };

  return (
    <div id="client-detail-view" className="space-y-6 pb-12">
      {/* 1. Top Breadcrumb & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          id="btn-back-to-clients"
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 hover:text-sky-300 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Lista de Clientes</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {whatsNumber && (
            <a
              id="btn-client-detail-whatsapp"
              href={generateWhatsAppLink(
                whatsNumber,
                `Olá, ${client.name}! Sou da Venâncio Piscinas - Limpeza e Manutenção.`
              )}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-bold transition active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-emerald-400/20" />
              <span>WhatsApp</span>
            </a>
          )}

          <button
            id="btn-client-detail-edit"
            type="button"
            onClick={() => setIsClientModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            <span>Editar Cadastro</span>
          </button>

          <button
            id="btn-client-detail-schedule"
            type="button"
            onClick={() => onOpenNewAppointment(client.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 text-xs font-bold transition cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>+ Agendar Visita</span>
          </button>

          <button
            id="btn-client-detail-new-service"
            type="button"
            onClick={() => onOpenNewService(client.id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs font-bold shadow-lg shadow-sky-500/25 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Registrar Serviço</span>
          </button>
        </div>
      </div>

      {/* 2. Client Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Avatar and Main Info */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              {client.name.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  {client.name}
                </h2>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                    client.status !== 'Inativo'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                  }`}
                >
                  ● {client.status || 'Ativo'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-400 mt-2 font-mono">
                <span>CPF/CNPJ: {formatCpfCnpj(client.cpf_cnpj) || 'Não informado'}</span>
                <span>•</span>
                <span className="font-sans text-sky-400 font-semibold">
                  Frequência: {client.service_frequency || 'Semanal'}
                </span>
                <span>•</span>
                <span className={`font-sans font-semibold ${client.due_date ? 'text-amber-400' : 'text-emerald-400'}`}>
                  Vencimento: {client.due_date ? formatDate(client.due_date) : 'Sem vencimento'}
                </span>
                {client.preferred_day && (
                  <>
                    <span>•</span>
                    <span className="font-sans text-slate-300">
                      Dia: {client.preferred_day}
                    </span>
                  </>
                )}
              </div>

              {/* Badges de Dias de Visita na Semana (Segunda a Sábado) */}
              <div className="flex flex-wrap items-center gap-2 mt-3 font-sans">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Dias de Visita (Seg a Sáb):
                </span>
                {client.visit_days && client.visit_days.length > 0 ? (
                  client.visit_days.map(d => (
                    <span
                      key={d}
                      className="px-2.5 py-1 rounded-lg text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-500/30"
                    >
                      {d}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">
                    {client.preferred_day || 'Segunda-feira'}
                  </span>
                )}

                {client.monthly_visit_days && client.monthly_visit_days.length > 0 && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className="text-slate-500">•</span>
                    <span className="text-[11px] font-bold text-slate-400">Escala Mensal:</span>
                    {client.monthly_visit_days.map(d => (
                      <span
                        key={d}
                        className="px-2 py-0.5 rounded-md text-xs font-bold bg-slate-800 text-sky-400 border border-slate-700"
                      >
                        Dia {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {client.notes && (
                <div className="mt-3 text-xs text-slate-300 bg-slate-800/70 border border-slate-700/60 p-3 rounded-xl max-w-2xl">
                  <span className="font-bold text-sky-400">Observações: </span>
                  <span>{client.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* KPI Financial Overview for this client */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0">
            {/* Data de Vencimento */}
            <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-xl">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase text-sky-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Data de Vencimento</span>
                </span>
                {client.due_date && (
                  <button
                    type="button"
                    onClick={() => {
                      markClientAsPaid(client.id);
                      loadClientData();
                      success(`Cliente "${client.name}" marcado como Pago e deixado sem vencimento!`);
                    }}
                    className="px-1.5 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-white text-[9px] font-extrabold uppercase transition cursor-pointer"
                    title="Marcar como Pago (Sem vencimento)"
                  >
                    Pago
                  </button>
                )}
              </div>
              <p className={`text-sm sm:text-base font-black font-mono mt-0.5 ${client.due_date ? 'text-white' : 'text-emerald-400'}`}>
                {client.due_date ? formatDate(client.due_date) : 'Sem vencimento'}
              </p>
            </div>

            {/* Valor Padrão */}
            <div className="p-3 bg-slate-800/80 border border-slate-700/70 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Valor Padrão
              </span>
              <p className="text-base font-black text-sky-400 font-mono mt-0.5">
                {formatCurrency(defaultPrice)}
              </p>
            </div>

            {/* Total Pago */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-emerald-400">
                Total Pago
              </span>
              <p className="text-base font-black text-emerald-400 font-mono mt-0.5">
                {formatCurrency(totalPaid)}
              </p>
            </div>

            {/* Total Pendente */}
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-rose-400">
                Pendente
              </span>
              <p className="text-base font-black text-rose-400 font-mono mt-0.5">
                {formatCurrency(totalPending)}
              </p>
            </div>

            {/* Atendimentos */}
            <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <span className="text-[10px] font-bold uppercase text-cyan-400">
                Atendimentos
              </span>
              <p className="text-base font-black text-cyan-300 font-mono mt-0.5">
                {totalServices}
              </p>
            </div>
          </div>
        </div>

        {/* Contact and Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 border-t border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">
              Telefone Principal
            </span>
            <div className="flex items-center gap-1.5 font-medium text-white mt-1">
              <Phone className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{formatPhone(client.phone) || 'Não informado'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">
              Data de Vencimento
            </span>
            <div className={`flex items-center gap-1.5 font-bold mt-1 ${client.due_date ? 'text-amber-400' : 'text-emerald-400'}`}>
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>{client.due_date ? formatDate(client.due_date) : 'Sem vencimento'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-bold uppercase text-[10px]">
              E-mail
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-300 mt-1 truncate">
              <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate">{client.email || 'Não informado'}</span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">
                Endereço / Cidade
              </span>
              <button
                type="button"
                onClick={() => setIsLiveMapOpen(true)}
                className="text-[10px] text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Navigation className="w-3 h-3" />
                <span>Mapear GPS ↗</span>
              </button>
            </div>
            <div className="flex items-start gap-1.5 font-medium text-slate-300 mt-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <div className="truncate">
                <p className="truncate">
                  {client.street ? `${client.street}, ${client.number || 'S/N'}` : 'Endereço não informado'}
                  {client.complement ? ` (${client.complement})` : ''}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {client.neighborhood ? `${client.neighborhood} • ` : ''}{client.city}/{client.state || 'SP'} {client.zip_code ? `(CEP ${client.zip_code})` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Last vs Next Service Indicators Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          {/* Último Atendimento */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Último Atendimento Realizado
              </span>
              {lastRecord ? (
                <div className="mt-0.5">
                  <p className="font-bold text-sm text-white">
                    {formatDate(lastRecord.service_date)} • {formatCurrency(lastRecord.final_price)}
                  </p>
                  <p className="text-xs text-slate-300 truncate mt-0.5">
                    {lastRecord.description || 'Limpeza e Manutenção de Rotina'}
                  </p>
                  <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.2 rounded-md ${
                    lastRecord.payment_status === 'Pago'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-rose-500/15 text-rose-400'
                  }`}>
                    Pagamento: {lastRecord.payment_status}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 mt-1 italic">
                  Nenhum serviço registrado anteriormente.
                </p>
              )}
            </div>
          </div>

          {/* Próximo Atendimento Agendado */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-start gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400 shrink-0">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Próximo Atendimento Agendado
                </span>
                <button
                  type="button"
                  onClick={() => onOpenNewAppointment(client.id)}
                  className="text-[11px] font-bold text-sky-400 hover:underline cursor-pointer"
                >
                  {upcomingAppointment ? 'Alterar' : '+ Agendar'}
                </button>
              </div>

              {upcomingAppointment ? (
                <div className="mt-0.5">
                  <p className="font-bold text-sm text-sky-300">
                    {formatDate(upcomingAppointment.date)} às {upcomingAppointment.time || '09:00'}
                  </p>
                  <p className="text-xs text-slate-300 truncate mt-0.5">
                    Status: {upcomingAppointment.status} {upcomingAppointment.notes ? `• ${upcomingAppointment.notes}` : ''}
                  </p>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-slate-400 italic">
                    Nenhum agendamento futuro no momento.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenNewAppointment(client.id)}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-400 text-xs font-bold hover:bg-sky-500/25 transition cursor-pointer"
                  >
                    Agendar Agora
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Piscinas do Cliente */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Waves className="w-5 h-5 text-sky-400" />
              <span>Piscinas Cadastradas</span>
            </h3>
            <p className="text-xs text-slate-400">
              {pools.length} {pools.length === 1 ? 'piscina vinculada' : 'piscinas vinculadas'}
            </p>
          </div>

          <button
            id="btn-add-new-pool-detail"
            type="button"
            onClick={() => {
              setPoolToEdit(null);
              setIsPoolModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500/15 border border-sky-500/30 hover:bg-sky-500/25 text-sky-400 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Adicionar Piscina</span>
          </button>
        </div>

        {pools.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl">
            <Waves className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-400">
              Nenhuma piscina cadastrada para este cliente.
            </p>
            <button
              type="button"
              onClick={() => {
                setPoolToEdit(null);
                setIsPoolModalOpen(true);
              }}
              className="mt-3 px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold hover:bg-sky-600 transition cursor-pointer"
            >
              Cadastrar Piscina
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pools.map(pool => (
              <div
                key={pool.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/60 overflow-hidden flex flex-col justify-between group"
              >
                <div className="h-36 w-full overflow-hidden relative bg-slate-900">
                  <img
                    src={getPoolImage(pool)}
                    alt={pool.name}
                    referrerPolicy="no-referrer"
                    onError={e => {
                      const target = e.currentTarget;
                      const fallback = getDefaultPoolImageByType(pool.type, pool.name);
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent pointer-events-none" />
                  <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-950/80 text-white backdrop-blur-xs border border-white/20">
                    {pool.type}
                  </span>
                </div>

                <div className="p-4 flex-1 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-sm text-white">{pool.name}</h4>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Volume:</span>
                      <span className="font-bold text-white font-mono">
                        {(pool.volume || 30000).toLocaleString('pt-BR')} Litros
                      </span>
                    </div>

                    {pool.size && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Dimensões:</span>
                        <span className="font-medium text-slate-200">{pool.size}</span>
                      </div>
                    )}

                    {pool.address && (
                      <p className="text-[11px] text-slate-400 truncate">
                        📍 {pool.address}
                      </p>
                    )}

                    {pool.notes && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                        <b>Obs:</b> {pool.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenNewService(client.id, pool.id)}
                    className="text-xs font-bold text-sky-400 hover:text-sky-300 transition cursor-pointer"
                  >
                    + Registrar Serviço
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPoolToEdit(pool);
                        setIsPoolModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                      title="Editar Piscina"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoolToDelete({ id: pool.id, name: pool.name })}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition cursor-pointer"
                      title="Excluir Piscina"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Histórico Completo de Serviços Realizados */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Wrench className="w-5 h-5 text-sky-400" />
              <span>Histórico de Serviços Realizados</span>
            </h3>
            <p className="text-xs text-slate-400">
              Registros, manutenções executadas e comprovantes gerados
            </p>
          </div>

          <button
            id="btn-detail-add-service"
            type="button"
            onClick={() => onOpenNewService(client.id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registrar Serviço</span>
          </button>
        </div>

        {sortedRecords.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl">
            <Wrench className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-400">
              Nenhum serviço realizado ainda para este cliente.
            </p>
            <button
              type="button"
              onClick={() => onOpenNewService(client.id)}
              className="mt-3 px-4 py-2 bg-sky-500 text-white rounded-xl text-xs font-bold hover:bg-sky-600 transition cursor-pointer"
            >
              Registrar Primeiro Atendimento
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="pb-3 pr-4">Data</th>
                  <th className="pb-3 px-4">Piscina</th>
                  <th className="pb-3 px-4">Serviço / Descrição</th>
                  <th className="pb-3 px-4">Valor</th>
                  <th className="pb-3 px-4">Status Pgto.</th>
                  <th className="pb-3 pl-4 text-right">Comprovante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {sortedRecords.map(rec => {
                  const pool = pools.find(p => p.id === rec.pool_id);
                  const service = services.find(s => s.id === rec.service_id);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 pr-4 whitespace-nowrap font-bold text-white">
                        {formatDate(rec.service_date)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {pool?.name || 'Piscina Principal'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {service?.name || rec.description}
                        </div>
                        {rec.products_used && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            Químicos: {rec.products_used}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-white font-mono">
                        {formatCurrency(rec.final_price)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            rec.payment_status === 'Pago'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : rec.payment_status === 'Parcial'
                              ? 'bg-sky-500/15 text-sky-400 border-sky-500/30'
                              : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          ● {rec.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onViewReceipt(rec.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500 text-sky-400 hover:text-white font-bold text-xs transition cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Recibo</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Avaliações & Satisfação do Cliente */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>Avaliações & Satisfação</span>
          </h3>
          <p className="text-xs text-slate-400">
            Notas, depoimentos, pontualidade e satisfação do cliente
          </p>
        </div>

        <ClientFeedbackList client={client} />
      </div>

      {/* Danger Zone: Delete Client Option */}
      <div className="p-4 rounded-2xl border border-rose-900/30 bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-rose-400">
            Excluir Cadastro do Cliente
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Ao excluir o cliente, todas as piscinas e dados associados serão removidos do sistema.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-600/40 rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
        >
          Excluir Cliente
        </button>
      </div>

      {/* Client Delete Modal Confirmation */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-base text-white">Excluir Cliente</h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                Tem certeza que deseja excluir o cliente{' '}
                <strong className="text-white">{client.name}</strong> e todos os registros associados? Esta ação é irreversível.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/30 active:scale-95 transition cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        clientToEdit={client}
        onClientSaved={() => loadClientData()}
      />

      {/* Add / Edit Pool Modal */}
      <PoolModal
        isOpen={isPoolModalOpen}
        onClose={() => {
          setIsPoolModalOpen(false);
          setPoolToEdit(null);
        }}
        poolToEdit={poolToEdit}
        defaultClientId={client.id}
      />

      {/* Live Map & GPS Route Tracker Modal */}
      <LiveMapModal
        isOpen={isLiveMapOpen}
        onClose={() => setIsLiveMapOpen(false)}
        targetClient={client}
        targetPool={pools[0] || null}
      />

      {/* Delete Pool Confirm Modal */}
      <ConfirmModal
        isOpen={!!poolToDelete}
        title="Excluir Piscina"
        message={`Deseja realmente remover a piscina "${poolToDelete?.name}" vinculada a este cliente?`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDeletePool}
        onClose={() => setPoolToDelete(null)}
      />
    </div>
  );
};

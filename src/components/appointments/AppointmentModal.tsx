import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Waves,
  Wrench,
  Check,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { Appointment, AppointmentStatus, Client, Pool, ServiceItem } from '../../types';
import {
  createAppointment,
  updateAppointment,
  getClients,
  getPoolsByClientId,
  getServices,
} from '../../database/storage';
import { useToast } from '../../context/ToastContext';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentToEdit?: Appointment | null;
  defaultDate?: string;
  defaultClientId?: string;
  defaultPoolId?: string;
  onAppointmentSaved?: (app: Appointment) => void;
}

const APPOINTMENT_STATUSES: AppointmentStatus[] = [
  'Agendado',
  'Em andamento',
  'Concluído',
  'Cancelado',
];

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  appointmentToEdit,
  defaultDate,
  defaultClientId,
  defaultPoolId,
  onAppointmentSaved,
}) => {
  const { success, error } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [clientPools, setClientPools] = useState<Pool[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const [clientId, setClientId] = useState('');
  const [poolId, setPoolId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(() => defaultDate || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [status, setStatus] = useState<AppointmentStatus>('Agendado');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const allClients = getClients();
    const allServices = getServices();
    setClients(allClients);
    setServices(allServices);

    if (appointmentToEdit) {
      setClientId(appointmentToEdit.client_id);
      const pools = getPoolsByClientId(appointmentToEdit.client_id);
      setClientPools(pools);
      setPoolId(appointmentToEdit.pool_id);
      setServiceId(appointmentToEdit.service_id);
      setDate(appointmentToEdit.date);
      setTime(appointmentToEdit.time);
      setStatus(appointmentToEdit.status);
      setNotes(appointmentToEdit.notes || '');
    } else {
      const initialClient = defaultClientId || (allClients[0]?.id || '');
      setClientId(initialClient);
      const pools = getPoolsByClientId(initialClient);
      setClientPools(pools);
      setPoolId(defaultPoolId || (pools[0]?.id || ''));
      setServiceId(allServices[0]?.id || '');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setTime('09:00');
      setStatus('Agendado');
      setNotes('');
    }
  }, [appointmentToEdit, defaultDate, defaultClientId, defaultPoolId, isOpen]);

  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    const pools = getPoolsByClientId(newClientId);
    setClientPools(pools);
    setPoolId(pools[0]?.id || '');
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      error('Selecione um cliente para o agendamento.');
      return;
    }
    if (!poolId) {
      error('Selecione a piscina.');
      return;
    }
    if (!serviceId) {
      error('Selecione o tipo de serviço.');
      return;
    }

    try {
      const payload = {
        client_id: clientId,
        pool_id: poolId,
        service_id: serviceId,
        date,
        time,
        status,
        notes: notes.trim() || undefined,
      };

      let saved: Appointment | null;
      if (appointmentToEdit) {
        saved = updateAppointment(appointmentToEdit.id, payload);
        success('Agendamento atualizado com sucesso!');
      } else {
        saved = createAppointment(payload);
        success('Agendamento criado com sucesso!');
      }

      if (saved && onAppointmentSaved) {
        onAppointmentSaved(saved);
      }
      onClose();
    } catch {
      error('Erro ao salvar agendamento.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {appointmentToEdit ? 'Editar Agendamento' : 'Novo Agendamento na Agenda'}
              </h3>
              <p className="text-xs text-sky-100">
                Programação de rotas e visitas técnicas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente *
            </label>
            <select
              required
              value={clientId}
              onChange={e => handleClientChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">Selecione o cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.neighborhood ? `(${c.neighborhood})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Piscina do Cliente *
            </label>
            <select
              required
              value={poolId}
              onChange={e => setPoolId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">Selecione a piscina...</option>
              {clientPools.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type} • {p.volume.toLocaleString('pt-BR')}L)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tipo de Serviço Previsto *
            </label>
            <select
              required
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} (aprox. {s.estimated_duration})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Atendimento *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Horário Estimado *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Status do Agendamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {APPOINTMENT_STATUSES.map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`py-2 px-2 text-center text-xs font-bold rounded-xl border transition cursor-pointer ${
                    status === st
                      ? st === 'Concluído'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : st === 'Em andamento'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : st === 'Cancelado'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-sky-600 text-white border-sky-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Instruções para a visita
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Pegar chave com o porteiro Silva; cliente pediu atenção extra nas pastilhas..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{appointmentToEdit ? 'Salvar Alterações' : 'Confirmar Agendamento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

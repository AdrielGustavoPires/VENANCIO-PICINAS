import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Printer,
  MessageCircle,
  Eye,
  Calendar,
  DollarSign,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { ServiceRecord, Client, Pool, ServiceItem, PaymentStatus } from '../types';
import {
  getServiceRecords,
  getClients,
  getPools,
  getServices,
  subscribeToDatabase,
} from '../database/storage';
import {
  formatCurrency,
  formatDate,
  formatPhone,
  generateWhatsAppLink,
} from '../utils/formatters';
import { ReceiptModal } from '../components/receipts/ReceiptModal';
import { RecordServiceModal } from '../components/services/RecordServiceModal';

interface ReceiptsProps {
  onSelectClient: (clientId: string) => void;
}

export const Receipts: React.FC<ReceiptsProps> = ({ onSelectClient }) => {
  const [records, setRecords] = useState<ServiceRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | PaymentStatus>('Todos');

  // Modals
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const loadData = () => {
    setRecords(getServiceRecords());
    setClients(getClients());
    setPools(getPools());
    setServices(getServices());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDatabase(loadData);
    return () => unsubscribe();
  }, []);

  const filteredRecords = records.filter(rec => {
    const client = clients.find(c => c.id === rec.client_id);
    const service = services.find(s => s.id === rec.service_id);
    const receiptNum = `VP-${rec.id.replace('rec_', '').toUpperCase()}`;
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      !term ||
      (client && client.name.toLowerCase().includes(term)) ||
      (service && service.name.toLowerCase().includes(term)) ||
      receiptNum.toLowerCase().includes(term);

    const matchesStatus = statusFilter === 'Todos' || rec.payment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalValue = filteredRecords.reduce((sum, r) => sum + r.final_price, 0);
  const totalPaid = filteredRecords.reduce((sum, r) => sum + (r.amount_paid || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-600" />
            <span>Comprovantes & Registros de Serviços</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Histórico completo de atendimentos, emissão de segundas vias e envio via WhatsApp
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-sky-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo Comprovante</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Comprovantes Emitidos</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {filteredRecords.length}
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Recebido</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {formatCurrency(totalPaid)}
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <span className="text-[10px] font-bold text-amber-600 uppercase">Total Pendente</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {formatCurrency(Math.max(0, totalValue - totalPaid))}
          </p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, serviço ou Nº..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['Todos', 'Pago', 'Pendente', 'Parcial'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                statusFilter === st
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Receipts Table / List */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            Nenhum comprovante encontrado
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Registre a realização de um serviço para emitir um comprovante.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Nº / Data</th>
                  <th className="py-3.5 px-4">Cliente / Piscina</th>
                  <th className="py-3.5 px-4">Serviço Realizado</th>
                  <th className="py-3.5 px-4">Valor Final</th>
                  <th className="py-3.5 px-4">Status Pgto.</th>
                  <th className="py-3.5 px-5 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map(rec => {
                  const client = clients.find(c => c.id === rec.client_id);
                  const pool = pools.find(p => p.id === rec.pool_id);
                  const service = services.find(s => s.id === rec.service_id);
                  const receiptNum = `VP-${rec.id.replace('rec_', '').toUpperCase().slice(0, 6)}`;
                  const whatsNumber = client?.whatsapp || client?.phone;

                  return (
                    <tr
                      key={rec.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Num & Date */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordId(rec.id)}
                          className="font-bold text-sky-600 dark:text-sky-400 font-mono hover:underline cursor-pointer"
                        >
                          #{receiptNum}
                        </button>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {formatDate(rec.service_date)} às {rec.service_time || '09:00'}
                        </div>
                      </td>

                      {/* Client & Pool */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => client && onSelectClient(client.id)}
                          className="font-bold text-slate-900 dark:text-white hover:text-sky-600 transition cursor-pointer text-left block"
                        >
                          {client?.name || 'Cliente'}
                        </button>
                        <span className="text-xs text-slate-400">
                          {pool?.name} ({pool?.volume.toLocaleString('pt-BR')}L)
                        </span>
                      </td>

                      {/* Service */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {service?.name || rec.description}
                        </div>
                        {rec.products_used && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">
                            Químicos: {rec.products_used}
                          </div>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(rec.final_price)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            rec.payment_status === 'Pago'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : rec.payment_status === 'Parcial'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {rec.payment_status} ({rec.payment_method})
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedRecordId(rec.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Visualizar</span>
                          </button>

                          {whatsNumber && (
                            <a
                              href={generateWhatsAppLink(
                                whatsNumber,
                                `Olá, ${client?.name}! Segue o comprovante #${receiptNum} de atendimento da piscina pela Venâncio Piscinas no valor de ${formatCurrency(rec.final_price)}.`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Enviar via WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(selectedRecordId)}
        onClose={() => setSelectedRecordId(null)}
        recordId={selectedRecordId}
      />

      {/* Record Service Modal */}
      <RecordServiceModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onServiceRecorded={rec => {
          setSelectedRecordId(rec.id);
        }}
      />
    </div>
  );
};

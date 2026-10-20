import React, { useRef } from 'react';
import {
  X,
  Printer,
  Share2,
  Copy,
  MessageCircle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { ServiceRecord } from '../../types';
import { CompanyLogo } from '../common/CompanyLogo';
import {
  getClientById,
  getPoolById,
  getServiceById,
  getCompanySettings,
  getServiceRecords,
} from '../../database/storage';
import {
  formatCurrency,
  formatDate,
  formatPhone,
  formatCpfCnpj,
  generateWhatsAppLink,
} from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordId: string | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  recordId,
}) => {
  const { success, error } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !recordId) return null;

  const company = getCompanySettings();
  const allRecords: ServiceRecord[] = getServiceRecords();
  const currentRecord = allRecords.find(r => r.id === recordId);

  if (!currentRecord) {
    return null;
  }

  const client = getClientById(currentRecord.client_id);
  const pool = getPoolById(currentRecord.pool_id);
  const service = getServiceById(currentRecord.service_id);

  const receiptNumber = `VP-${currentRecord.id.replace('rec_', '').toUpperCase().slice(0, 6)}`;
  const clientWhats = client?.whatsapp || client?.phone || '';

  const whatsAppSummary = `*COMPROVANTE DE SERVIÇO — ${company.name}*
*Nº:* ${receiptNumber}
*Data:* ${formatDate(currentRecord.service_date)} às ${currentRecord.service_time || '09:00'}
*Cliente:* ${client?.name || 'Cliente'}
*Piscina:* ${pool?.name || 'Principal'} (${pool?.type || 'Alvenaria'} - ${pool?.volume.toLocaleString('pt-BR')}L)
*Serviço Realizado:* ${service?.name || currentRecord.description}
*Produtos Aplicados:* ${currentRecord.products_used || 'Não especificado'}
-------------------------
*Valor:* ${formatCurrency(currentRecord.price)}
*Desconto:* ${formatCurrency(currentRecord.discount)}
*VALOR FINAL:* ${formatCurrency(currentRecord.final_price)}
*Status Pgto:* ${currentRecord.payment_status} (${currentRecord.payment_method})
-------------------------
*Técnico:* ${currentRecord.responsible}
${currentRecord.notes ? `*Obs:* ${currentRecord.notes}\n` : ''}
Agradecemos a preferência! Contato: ${company.phone}`;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsAppSummary);
      success('Texto do comprovante copiado para a área de transferência!');
    } catch {
      error('Não foi possível copiar automaticamente.');
    }
  };

  const handleShareWhatsApp = () => {
    if (!clientWhats) {
      error('Telefone/WhatsApp do cliente não cadastrado.');
      return;
    }
    const link = generateWhatsAppLink(clientWhats, whatsAppSummary);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-6 overflow-hidden print:border-none print:shadow-none print:my-0">
        {/* Top Control bar (Hidden during Print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            <span className="font-bold text-xs">Comprovante Digital #{receiptNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>

            {clientWhats && (
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Enviar WhatsApp</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyText}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Copiar texto"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT */}
        <div
          ref={printRef}
          className="p-8 bg-white text-slate-900 print:p-6 space-y-6 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible"
        >
          {/* Company Header */}
          <div className="flex items-start justify-between border-b-2 border-sky-600 pb-5">
            <div className="flex items-center gap-3.5">
              <CompanyLogo variant="icon" size={52} />
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  {company.name || 'VENÂNCIO PISCINAS'}
                </h1>
                <p className="text-xs font-bold text-sky-700 uppercase tracking-wider leading-none mt-1">
                  {company.subtitle || 'Limpeza e Manutenção'}
                </p>
                <p className="text-[11px] text-slate-500 mt-1 font-mono">
                  {company.cnpj ? `CNPJ: ${company.cnpj} • ` : ''}Tel: {company.phone || '(11) 98765-4321'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-sky-50 text-sky-800 border border-sky-200 rounded-lg text-xs font-mono font-bold">
                Nº {receiptNumber}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                Data: <b>{formatDate(currentRecord.service_date)}</b>
              </p>
              <p className="text-[11px] text-slate-500">
                Horário: <b>{currentRecord.service_time || '09:00'}</b>
              </p>
            </div>
          </div>

          {/* Dados do Cliente e Piscina */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div className="space-y-1">
              <span className="font-bold text-[10px] text-sky-800 uppercase tracking-wider">
                Dados do Cliente
              </span>
              <p className="font-bold text-sm text-slate-900">{client?.name}</p>
              <p className="text-slate-600 font-mono">
                Doc: {formatCpfCnpj(client?.cpf_cnpj) || 'Não informado'}
              </p>
              {client?.due_date && (
                <p className="text-sky-800 font-semibold font-mono">
                  Data de Vencimento: {formatDate(client.due_date)}
                </p>
              )}
              <p className="text-slate-600">
                Tel: {formatPhone(client?.phone) || 'Não informado'} {client?.whatsapp ? `(WhatsApp: ${formatPhone(client.whatsapp)})` : ''}
              </p>
              <p className="text-slate-600 truncate">
                Endereço: {client?.street ? `${client.street}, ${client.number}` : ''} {client?.neighborhood ? `- ${client.neighborhood}` : ''} ({client?.city}/{client?.state})
              </p>
            </div>

            <div className="space-y-1 border-l border-slate-200 pl-4">
              <span className="font-bold text-[10px] text-sky-800 uppercase tracking-wider">
                Especificações da Piscina
              </span>
              <p className="font-bold text-sm text-slate-900">{pool?.name}</p>
              <p className="text-slate-600">
                Tipo: <b>{pool?.type}</b>
              </p>
              <p className="text-slate-600">
                Volume: <b>{pool?.volume.toLocaleString('pt-BR')} Litros</b>
              </p>
              <p className="text-slate-600">
                Dimensões: <b>{pool?.size || 'Conforme padrão'}</b>
              </p>
              {pool?.address && (
                <p className="text-slate-500 italic text-[11px]">Local: {pool.address}</p>
              )}
            </div>
          </div>

          {/* Discriminação dos Serviços e Produtos */}
          <div className="space-y-3">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Discriminação do Serviço Executado</span>
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <div className="bg-slate-100 p-3 font-semibold text-slate-800 flex justify-between">
                <span>{service?.name || currentRecord.description}</span>
                <span className="font-mono">{formatCurrency(currentRecord.price)}</span>
              </div>
              <div className="p-3.5 space-y-2 bg-white text-slate-600 leading-relaxed">
                {currentRecord.description && (
                  <p>
                    <b>Procedimentos:</b> {currentRecord.description}
                  </p>
                )}
                {currentRecord.products_used && (
                  <p className="text-sky-950 font-medium">
                    🧪 <b>Produtos & Químicos Aplicados:</b> {currentRecord.products_used}
                  </p>
                )}
                {currentRecord.notes && (
                  <p className="text-slate-500 italic">
                    ℹ️ <b>Instruções e Observações:</b> {currentRecord.notes}
                  </p>
                )}
              </div>
            </div>

            {/* Registro Fotográfico no Comprovante (Antes e Depois) */}
            {(currentRecord.start_photo || currentRecord.end_photo) && (
              <div className="space-y-2 pt-1">
                <span className="font-bold text-[10px] text-sky-800 uppercase tracking-wider block">
                  Comprovação Fotográfica do Atendimento (Antes & Depois)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {currentRecord.start_photo && (
                    <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 text-center space-y-1">
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200">
                        <img
                          src={currentRecord.start_photo}
                          alt="Início do Serviço"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-sky-800 block">
                        Foto 1: Início do Serviço ({currentRecord.start_time || currentRecord.service_time || 'Antes'})
                      </span>
                    </div>
                  )}
                  {currentRecord.end_photo && (
                    <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 text-center space-y-1">
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-200">
                        <img
                          src={currentRecord.end_photo}
                          alt="Conclusão do Serviço"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 block">
                        Foto 2: Conclusão do Serviço ({currentRecord.end_time || 'Depois / Finalizado'})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quadro Financeiro */}
          <div className="border-t-2 border-dashed border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="text-xs space-y-1 max-w-xs">
              <p className="font-bold text-slate-800">Forma de Pagamento: {currentRecord.payment_method}</p>
              <p className="text-slate-600">
                Status: <b className={`${currentRecord.payment_status === 'Pago' ? 'text-emerald-700' : 'text-amber-700'}`}>{currentRecord.payment_status}</b>
              </p>
              <p className="text-[11px] text-slate-400">
                Técnico Executor: <b>{currentRecord.responsible}</b>
              </p>
            </div>

            <div className="w-full sm:w-60 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(currentRecord.price)}</span>
              </div>
              {currentRecord.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Desconto:</span>
                  <span>- {formatCurrency(currentRecord.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-slate-200 pt-1.5">
                <span>VALOR TOTAL:</span>
                <span className="text-sky-700">{formatCurrency(currentRecord.final_price)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold text-xs pt-1">
                <span>Valor Pago:</span>
                <span>{formatCurrency(currentRecord.amount_paid)}</span>
              </div>
              {currentRecord.final_price - currentRecord.amount_paid > 0 && (
                <div className="flex justify-between text-amber-700 font-bold text-xs">
                  <span>Saldo a Pagar:</span>
                  <span>{formatCurrency(currentRecord.final_price - currentRecord.amount_paid)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assinatura / Validação */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 pb-1 mx-auto max-w-[200px]">
                <span className="font-semibold text-slate-800">{currentRecord.responsible}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                Venâncio Piscinas — Técnico Responsável
              </p>
            </div>

            <div>
              <div className="border-b border-slate-400 pb-1 mx-auto max-w-[200px]">
                <span className="font-semibold text-slate-800">{client?.name || 'Cliente'}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">
                Assinatura do Cliente / Aceite
              </p>
            </div>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-4 text-[10px] text-slate-400">
            {company.address} • Atendimento WhatsApp: {company.phone} • {company.email}
          </div>
        </div>
      </div>
    </div>
  );
};

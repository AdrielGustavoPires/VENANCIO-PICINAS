import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Clock,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  FileText,
  Calendar,
  Filter,
  Trash2,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  TrendingDown,
  Sparkles,
  Wallet,
} from 'lucide-react';
import {
  PaymentRecord,
  ExpenseRecord,
  PaymentMethod,
  PaymentStatus,
  ServiceRecord,
  Client,
} from '../types';
import {
  getPayments,
  getExpenses,
  getServiceRecords,
  getClients,
  createExpense,
  deleteExpense,
  deleteServiceRecord,
  updatePaymentStatus,
  subscribeToDatabase,
} from '../database/storage';
import { formatCurrency, formatDate, generateWhatsAppLink } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { ReceiptModal } from '../components/receipts/ReceiptModal';
import { ConfirmModal } from '../components/common/ConfirmModal';

const EXPENSE_CATEGORIES = [
  'Produtos Químicos (Cloro/Barrilha/Algicida)',
  'Combustível & Transporte',
  'Peças e Equipamentos de Reposição',
  'Ferramentas & Acessórios',
  'Manutenção de Veículo',
  'Outros Custos Operacionais',
];

export const Financial: React.FC = () => {
  const { success, error } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<'receitas' | 'despesas'>('receitas');
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [statusFilter, setStatusFilter] = useState<'Todos' | 'Pago' | 'Pendente'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [periodFilter, setPeriodFilter] = useState<'thisMonth' | '30days' | 'all'>('all');

  // New Expense Modal State
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expCategory, setExpCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expPaymentMethod, setExpPaymentMethod] = useState<PaymentMethod>('Pix');

  // Delete Modals
  const [recordToDelete, setRecordToDelete] = useState<ServiceRecord | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<ExpenseRecord | null>(null);

  // Receipt Modal State
  const [viewReceiptId, setViewReceiptId] = useState<string | null>(null);

  const loadData = () => {
    setPayments(getPayments() as any);
    setExpenses(getExpenses());
    setServiceRecords(getServiceRecords());
    setClients(getClients());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDatabase(loadData);
    return () => unsubscribe();
  }, []);

  // Filter helper by period
  const filterByPeriod = (dateStr: string) => {
    if (!dateStr) return true;
    if (periodFilter === 'all') return true;
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();

    if (periodFilter === 'thisMonth') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (periodFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return d >= thirtyDaysAgo;
    }
    return true;
  };

  // Metrics Calculations
  const periodServiceRecords = serviceRecords.filter(s => filterByPeriod(s.service_date));
  const periodExpenses = expenses.filter(e => filterByPeriod(e.date));

  // 1. Receita: Total paid amount for filtered period
  const totalRevenue = periodServiceRecords.reduce((sum, s) => {
    if (s.payment_status === 'Pago') return sum + s.final_price;
    return sum + (s.amount_paid || 0);
  }, 0);

  // 2. Total de Despesas
  const totalExpenses = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

  // 3. Saldo Líquido
  const netBalance = totalRevenue - totalExpenses;

  // 4. A Receber: Pending amounts
  const pendingRecords = periodServiceRecords.filter(s => s.payment_status !== 'Pago');
  const totalPending = pendingRecords.reduce(
    (sum, s) => sum + Math.max(0, s.final_price - (s.amount_paid || 0)),
    0
  );

  // Settle full payment
  const handleMarkAsPaid = (record: ServiceRecord) => {
    try {
      updatePaymentStatus(record.id, 'Pago', record.final_price);
      success(`Pagamento de ${formatCurrency(record.final_price)} confirmado com sucesso!`);
    } catch {
      error('Não foi possível registrar o pagamento.');
    }
  };

  // Confirm delete service record
  const handleConfirmDeleteRecord = () => {
    if (!recordToDelete) return;
    try {
      deleteServiceRecord(recordToDelete.id);
      success('Lançamento financeiro removido com sucesso!');
      setRecordToDelete(null);
    } catch {
      error('Erro ao excluir lançamento.');
    }
  };

  // Confirm delete expense
  const handleConfirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    try {
      deleteExpense(expenseToDelete.id);
      success('Despesa removida com sucesso!');
      setExpenseToDelete(null);
    } catch {
      error('Erro ao excluir despesa.');
    }
  };

  // Filter Transactions List
  const filteredTransactions = periodServiceRecords.filter(record => {
    if (statusFilter !== 'Todos' && record.payment_status !== statusFilter) {
      return false;
    }
    const client = clients.find(c => c.id === record.client_id);
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const clientNameMatch = (client?.name || '').toLowerCase().includes(term);
    const descMatch = (record.description || '').toLowerCase().includes(term);
    const methodMatch = (record.payment_method || '').toLowerCase().includes(term);
    return clientNameMatch || descMatch || methodMatch;
  }).sort((a, b) => b.service_date.localeCompare(a.service_date));

  // Filter Expenses List
  const filteredExpenses = periodExpenses.filter(exp => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const catMatch = exp.category.toLowerCase().includes(term);
    const descMatch = exp.description.toLowerCase().includes(term);
    const methodMatch = exp.payment_method.toLowerCase().includes(term);
    return catMatch || descMatch || methodMatch;
  }).sort((a, b) => b.date.localeCompare(a.date));

  // Save new expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(expAmount);
    if (!val || val <= 0) {
      error('Informe um valor válido para a despesa.');
      return;
    }
    if (!expDescription.trim()) {
      error('Informe a descrição da despesa.');
      return;
    }

    try {
      createExpense({
        category: expCategory,
        description: expDescription.trim(),
        amount: val,
        date: expDate,
        payment_method: expPaymentMethod,
      });
      success('Despesa operacional registrada com sucesso!');
      setIsExpenseModalOpen(false);
      setExpDescription('');
      setExpAmount('');
    } catch {
      error('Erro ao salvar despesa.');
    }
  };

  return (
    <div id="financial-tab-view" className="space-y-6 pb-12">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-sky-500" />
            <span>Gestão Financeira & Cobranças</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Controle de receitas, despesas operacionais, fluxo de caixa e comprovantes
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="btn-add-expense"
            type="button"
            onClick={() => setIsExpenseModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-sky-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Despesa</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Receita Recebida */}
        <div
          id="card-receita-mes"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-emerald-500/40 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Receitas Recebidas
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(totalRevenue)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{periodServiceRecords.length} lançamentos de serviços</span>
            </p>
          </div>
        </div>

        {/* Card 2: Despesas Operacionais */}
        <div
          id="card-despesas-mes"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-rose-500/40 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Despesas Operacionais
            </span>
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/20">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {formatCurrency(totalExpenses)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>{periodExpenses.length} despesas registradas</span>
            </p>
          </div>
        </div>

        {/* Card 3: Saldo Líquido */}
        <div
          id="card-saldo-liquido"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-sky-500/40 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Saldo / Lucro Líquido
            </span>
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/20">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3
              className={`text-2xl sm:text-3xl font-black tracking-tight ${
                netBalance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(netBalance)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Resultado (Receitas menos Despesas)
            </p>
          </div>
        </div>

        {/* Card 4: A Receber */}
        <div
          id="card-a-receber"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden group hover:border-amber-500/40 transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              A Receber (Pendente)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {formatCurrency(totalPending)}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                {pendingRecords.length} {pendingRecords.length === 1 ? 'cobrança pendente' : 'cobranças pendentes'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Sub-Tabs: Receitas vs Despesas */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveSubTab('receitas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'receitas'
              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Receitas & Cobranças ({periodServiceRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('despesas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
            activeSubTab === 'despesas'
              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
              : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Despesas Operacionais ({periodExpenses.length})</span>
        </button>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {activeSubTab === 'receitas' ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              id="filter-status-todos"
              type="button"
              onClick={() => setStatusFilter('Todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'Todos'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Todos ({periodServiceRecords.length})
            </button>

            <button
              id="filter-status-pago"
              type="button"
              onClick={() => setStatusFilter('Pago')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'Pago'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Pagos ({periodServiceRecords.filter(s => s.payment_status === 'Pago').length})
            </button>

            <button
              id="filter-status-pendente"
              type="button"
              onClick={() => setStatusFilter('Pendente')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                statusFilter === 'Pendente'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Pendentes ({pendingRecords.length})
            </button>
          </div>
        ) : (
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-rose-500" />
            <span>Listagem de Custos & Insumos</span>
          </div>
        )}

        {/* Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="search-transactions-input"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={activeSubTab === 'receitas' ? 'Buscar por cliente ou serviço...' : 'Buscar despesa ou insumo...'}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 4. Tab Content: RECEITAS */}
      {activeSubTab === 'receitas' && (
        <>
          {filteredTransactions.length === 0 ? (
            <div
              id="financial-empty-state"
              className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 sm:p-14 text-center max-w-lg mx-auto text-slate-400"
            >
              <DollarSign className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 dark:text-white text-base">
                Nenhum lançamento de receita encontrado
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {searchTerm
                  ? `Não foram encontrados registros para "${searchTerm}".`
                  : 'Registre manutenções ou atendimentos para gerar comprovantes e lançamentos automáticos no financeiro.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map(record => {
                const client = clients.find(c => c.id === record.client_id);
                const isPaid = record.payment_status === 'Pago';
                const pendingAmount = Math.max(0, record.final_price - (record.amount_paid || 0));
                const isExample = record.id === 'rec-1001' || record.service_type?.includes('(Exemplo)');

                const rawPhone = client?.whatsapp || client?.phone || '';
                const waCobranceLink = generateWhatsAppLink(
                  rawPhone,
                  `Olá ${client?.name || 'Cliente'}, tudo bem? Segue o lembrete de pagamento da manutenção da piscina no valor de ${formatCurrency(pendingAmount)}.`
                );

                return (
                  <div
                    key={record.id}
                    id={`transaction-row-${record.id}`}
                    className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 shadow-xs transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isPaid
                        ? 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        : 'border-amber-300 dark:border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/5 hover:border-amber-400 dark:hover:border-amber-500/50'
                    }`}
                  >
                    {/* Left: Client & Service Description */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      {/* Status Indicator Icon */}
                      <div
                        className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center border ${
                          isPaid
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {isPaid ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                            {client?.name || record.client_id || 'Cliente'}
                          </h4>

                          {/* Example badge if applicable */}
                          {isExample && (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                              <Sparkles className="w-3 h-3" />
                              <span>Exemplo / Modelo</span>
                            </span>
                          )}

                          {/* Visual Status Indicator */}
                          <span
                            className={`text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full ${
                              isPaid
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isPaid ? 'Pago' : 'Pendente'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                          {record.description || record.service_type || 'Manutenção periódica e tratamento químico'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-sky-500" />
                            <span>Serviço: {formatDate(record.service_date)}</span>
                          </span>
                          {client?.due_date && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold">
                                <Calendar className="w-3 h-3" />
                                <span>Vencimento: {formatDate(client.due_date)}</span>
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>Comprovante: <strong className="text-slate-700 dark:text-slate-300">{record.receipt_number || record.id}</strong></span>
                          <span>•</span>
                          <span>Forma: <strong className="text-slate-700 dark:text-slate-300">{record.payment_method || 'Pix'}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Value & Actions */}
                    <div className="flex items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                      {/* Price display */}
                      <div className="text-left md:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Valor
                        </span>
                        <span
                          className={`text-base sm:text-lg font-black tracking-tight ${
                            isPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {formatCurrency(record.final_price)}
                        </span>
                      </div>

                      {/* Actions buttons */}
                      <div className="flex items-center gap-1.5">
                        {!isPaid && (
                          <>
                            {rawPhone && (
                              <a
                                href={waCobranceLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                                title="Enviar lembrete de cobrança no WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleMarkAsPaid(record)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Baixar</span>
                            </button>
                          </>
                        )}

                        {/* View printable receipt button */}
                        <button
                          type="button"
                          onClick={() => setViewReceiptId(record.id)}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                          title="Ver Comprovante / Recibo"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => setRecordToDelete(record)}
                          className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 5. Tab Content: DESPESAS */}
      {activeSubTab === 'despesas' && (
        <>
          {filteredExpenses.length === 0 ? (
            <div
              id="expenses-empty-state"
              className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 sm:p-14 text-center max-w-lg mx-auto text-slate-400"
            >
              <TrendingDown className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h4 className="font-bold text-slate-800 dark:text-white text-base">
                Nenhuma despesa operacional cadastrada
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Clique no botão "Nova Despesa" acima para registrar gastos com cloro, produtos químicos, combustível ou manutenção.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map(exp => {
                const isExample = exp.id === 'exp-exemplo-1' || exp.description?.includes('Exemplo');
                return (
                  <div
                    key={exp.id}
                    id={`expense-row-${exp.id}`}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-xs transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-rose-500/15 border border-rose-500/30 text-rose-500">
                        <TrendingDown className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                            {exp.description}
                          </h4>

                          {isExample && (
                            <span className="flex items-center gap-1 text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                              <Sparkles className="w-3 h-3" />
                              <span>Exemplo / Modelo</span>
                            </span>
                          )}

                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {exp.category}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-sky-500" />
                            <span>{formatDate(exp.date)}</span>
                          </span>
                          <span>•</span>
                          <span>Pagamento: <strong className="text-slate-700 dark:text-slate-300">{exp.payment_method}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Valor Despesa
                        </span>
                        <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 tracking-tight">
                          - {formatCurrency(exp.amount)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpenseToDelete(exp)}
                        className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Excluir Despesa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modal Nova Despesa */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-900 dark:text-slate-100">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">
              Nova Despesa Operacional
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Lançamento de custos com produtos químicos, combustível e peças
            </p>

            <form onSubmit={handleSaveExpense} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição do Gasto *
                </label>
                <input
                  type="text"
                  required
                  value={expDescription}
                  onChange={e => setExpDescription(e.target.value)}
                  placeholder="Ex: 5 Baldes de Cloro HTH 10kg"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={e => setExpDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Forma de Pagamento
                </label>
                <select
                  value={expPaymentMethod}
                  onChange={e => setExpPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="Pix">Pix</option>
                  <option value="Débito">Débito</option>
                  <option value="Crédito">Crédito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Transferência">Transferência</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 cursor-pointer"
                >
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Service Record Modal */}
      <ConfirmModal
        isOpen={Boolean(recordToDelete)}
        title="Excluir Lançamento Financeiro"
        message={`Deseja realmente excluir este lançamento financeiro de ${recordToDelete ? formatCurrency(recordToDelete.final_price) : ''}? O comprovante e pagamento vinculado também serão removidos.`}
        confirmText="Sim, Excluir Lançamento"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDeleteRecord}
        onClose={() => setRecordToDelete(null)}
      />

      {/* Delete Expense Modal */}
      <ConfirmModal
        isOpen={Boolean(expenseToDelete)}
        title="Excluir Despesa Operacional"
        message={`Deseja excluir a despesa "${expenseToDelete?.description}" no valor de ${expenseToDelete ? formatCurrency(expenseToDelete.amount) : ''}?`}
        confirmText="Sim, Excluir Despesa"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDeleteExpense}
        onClose={() => setExpenseToDelete(null)}
      />

      {/* Global Printable Receipt Modal */}
      <ReceiptModal
        isOpen={Boolean(viewReceiptId)}
        onClose={() => setViewReceiptId(null)}
        recordId={viewReceiptId}
      />
    </div>
  );
};

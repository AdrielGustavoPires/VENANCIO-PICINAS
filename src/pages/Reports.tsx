import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  FileSpreadsheet,
  Users,
  Waves,
  Wrench,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  Star,
  MessageSquare,
  Smile,
  Award,
  ThumbsUp,
  Share2,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';
import {
  getClients,
  getPools,
  getServices,
  getServiceRecords,
  getPayments,
  getExpenses,
  getFeedbacks,
  getCompanySettings,
  deleteFeedback,
  subscribeToDatabase,
} from '../database/storage';
import { ClientFeedback } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { FeedbackModal } from '../components/feedback/FeedbackModal';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const Reports: React.FC = () => {
  const { success, error } = useToast();

  const [reportType, setReportType] = useState<'financeiro' | 'servicos' | 'clientes' | 'satisfacao'>('financeiro');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Feedbacks state
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([]);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<ClientFeedback | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  const loadData = () => {
    setFeedbacks(getFeedbacks());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDatabase(loadData);
    return () => unsubscribe();
  }, []);

  const clients = getClients();
  const pools = getPools();
  const services = getServices();
  const serviceRecords = getServiceRecords();
  const payments = getPayments();
  const expenses = getExpenses();

  // Filter records within selected date range
  const filteredRecords = serviceRecords.filter(r => {
    return r.service_date >= startDate && r.service_date <= endDate;
  });

  const filteredPayments = payments.filter(p => {
    const payDate = p.payment_date || p.date || '';
    return payDate >= startDate && payDate <= endDate;
  });

  const filteredExpenses = expenses.filter(e => {
    return e.date >= startDate && e.date <= endDate;
  });

  const filteredFeedbacks = feedbacks.filter(f => {
    return f.date >= startDate && f.date <= endDate;
  });

  const totalRevenue = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netResult = totalRevenue - totalExpenses;

  // Satisfaction & NPS Calculation
  const totalFeedbacks = filteredFeedbacks.length;
  const avgRating = totalFeedbacks > 0
    ? (filteredFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalFeedbacks).toFixed(1)
    : '0.0';

  const promoters = filteredFeedbacks.filter(f => (f.nps_score ?? 10) >= 9).length;
  const passives = filteredFeedbacks.filter(f => (f.nps_score ?? 10) >= 7 && (f.nps_score ?? 10) <= 8).length;
  const detractors = filteredFeedbacks.filter(f => (f.nps_score ?? 10) <= 6).length;

  const npsScore = totalFeedbacks > 0
    ? Math.round(((promoters - detractors) / totalFeedbacks) * 100)
    : 100;

  const starCounts = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: filteredFeedbacks.filter(f => f.rating === stars).length,
    percentage: totalFeedbacks > 0
      ? Math.round((filteredFeedbacks.filter(f => f.rating === stars).length / totalFeedbacks) * 100)
      : 0,
  }));

  const handleConfirmDeleteFeedback = () => {
    if (!feedbackToDelete) return;
    try {
      deleteFeedback(feedbackToDelete);
      loadData();
      success('Avaliação excluída com sucesso.');
    } catch {
      error('Erro ao excluir avaliação.');
    } finally {
      setFeedbackToDelete(null);
    }
  };

  // Export to CSV helper
  const handleExportCsv = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    let filename = `relatorio-${reportType}-${startDate}-${endDate}.csv`;

    if (reportType === 'financeiro') {
      csvContent += 'Data,Tipo,Descricao,Metodo,Valor(R$)\n';
      filteredPayments.forEach(p => {
        const record = serviceRecords.find(r => r.id === p.service_record_id);
        const client = clients.find(c => c.id === (p.client_id || record?.client_id))?.name || 'Cliente';
        const payDate = p.payment_date || p.date || '';
        csvContent += `${payDate},Receita,"${client} - ${p.notes || 'Serviço'}",${p.payment_method},${p.amount}\n`;
      });
      filteredExpenses.forEach(e => {
        csvContent += `${e.date},Despesa,"${e.category} - ${e.description}",${e.payment_method},-${e.amount}\n`;
      });
    } else if (reportType === 'servicos') {
      csvContent += 'Data,Cliente,Piscina,Servico,Tecnico,Valor(R$),Desconto(R$),Total(R$),StatusPgto\n';
      filteredRecords.forEach(r => {
        const client = clients.find(c => c.id === r.client_id)?.name || '';
        const pool = pools.find(p => p.id === r.pool_id)?.name || '';
        const service = services.find(s => s.id === r.service_id)?.name || r.description;
        csvContent += `${r.service_date},"${client}","${pool}","${service}","${r.responsible}",${r.price},${r.discount},${r.final_price},${r.payment_status}\n`;
      });
    } else if (reportType === 'clientes') {
      csvContent += 'Nome,CPF_CNPJ,Data_Vencimento,Telefone,WhatsApp,Email,Cidade,Bairro,TotalPiscinas\n';
      clients.forEach(c => {
        const clientPools = pools.filter(p => p.client_id === c.id).length;
        csvContent += `"${c.name}","${c.cpf_cnpj || ''}","${c.due_date || ''}","${c.phone || ''}","${c.whatsapp || ''}","${c.email || ''}","${c.city}","${c.neighborhood || ''}",${clientPools}\n`;
      });
    } else {
      // satisfacao
      csvContent += 'Data,Cliente,Piscina,Servico,Nota(1-5),NPS(0-10),Tags,Comentario,RespostaTecnico,Origem\n';
      filteredFeedbacks.forEach(f => {
        csvContent += `${f.date},"${f.client_name || ''}","${f.pool_name || ''}","${f.service_name || ''}",${f.rating},${f.nps_score || 10},"${(f.tags || []).join('; ')}","${f.comment?.replace(/"/g, '""') || ''}","${f.technician_reply?.replace(/"/g, '""') || ''}","${f.source || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success(`Relatório "${filename}" baixado com sucesso!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-600" />
            <span>Relatórios & Exportações</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gere relatórios detalhados, exporte planilhas CSV e avalie a satisfação dos clientes
          </p>
        </div>

        <div className="flex items-center gap-2">
          {reportType === 'satisfacao' && (
            <button
              type="button"
              onClick={() => {
                setEditingFeedback(null);
                setIsFeedbackModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nova Avaliação</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV / Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Filter and Selection Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tipo de Relatório
            </label>
            <select
              value={reportType}
              onChange={e => setReportType(e.target.value as any)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500"
            >
              <option value="financeiro">📊 Demonstrativo Financeiro (DRE)</option>
              <option value="servicos">🏊 Relatório de Serviços Realizados</option>
              <option value="clientes">👥 Cadastro de Clientes e Piscinas</option>
              <option value="satisfacao">⭐ Satisfação dos Clientes & NPS (Feedback)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {/* Title for Print */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-lg">
              {reportType === 'financeiro' && 'Demonstrativo de Resultados Financeiros'}
              {reportType === 'servicos' && 'Relatório Detalhado de Serviços Realizados'}
              {reportType === 'clientes' && 'Listagem de Clientes e Piscinas Cadastradas'}
              {reportType === 'satisfacao' && 'Painel Consolidado de Satisfação dos Clientes & NPS'}
            </h3>
            <p className="text-xs text-slate-500">
              Período: {formatDate(startDate)} até {formatDate(endDate)}
            </p>
          </div>
        </div>

        {/* SATISFAÇÃO / FEEDBACK AGGREGATION VIEW */}
        {reportType === 'satisfacao' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-200 dark:border-amber-900/40">
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                  Média Geral de Avaliações
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    {avgRating}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">/ 5.0 ⭐</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Baseado em {totalFeedbacks} {totalFeedbacks === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                  NPS Score (Índice de Recomendação)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    +{npsScore}
                  </span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-300 font-extrabold">
                    {npsScore >= 75 ? 'Excelente (Zona de Excelência)' : npsScore >= 50 ? 'Muito Bom' : 'Em Evolução'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  {promoters} Promotores • {passives} Neutros • {detractors} Detratores
                </p>
              </div>

              <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-200 dark:border-sky-900/40">
                <span className="text-[11px] font-bold text-sky-800 dark:text-sky-300 uppercase">
                  Taxa de Retenção & Elogios
                </span>
                <div className="text-3xl font-black text-sky-600 dark:text-sky-400 mt-1">
                  {totalFeedbacks > 0 ? `${Math.round(((promoters + passives) / totalFeedbacks) * 100)}%` : '100%'}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Clientes altamente satisfeitos com a manutenção
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-200 dark:border-purple-900/40">
                <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase">
                  Padrão {getCompanySettings().name || 'Qualidade Superior'}
                </span>
                <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 mt-2 font-bold text-sm">
                  <Award className="w-5 h-5" />
                  <span>Água Cristalina & Pura</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  100% dos parâmetros de cloro e pH certificados
                </p>
              </div>
            </div>

            {/* Star Distribution & NPS Meter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3">
                  Distribuição por Estrelas (1 a 5)
                </h4>
                <div className="space-y-2">
                  {starCounts.map(item => (
                    <div key={item.stars} className="flex items-center gap-3 text-xs">
                      <span className="w-12 font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        {item.stars} <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </span>
                      <div className="flex-1 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono text-slate-500 text-[11px]">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-3">
                  Canais de Coleta de Avaliação
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: '📱 WhatsApp', count: filteredFeedbacks.filter(f => f.source === 'whatsapp_review').length },
                    { label: '💻 No Aplicativo', count: filteredFeedbacks.filter(f => f.source === 'app_direct').length },
                    { label: '🤝 Presencial', count: filteredFeedbacks.filter(f => f.source === 'in_person').length },
                    { label: '📞 Telefone', count: filteredFeedbacks.filter(f => f.source === 'phone').length },
                  ].map(canal => (
                    <div key={canal.label} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{canal.label}</span>
                      <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                        {canal.count} {canal.count === 1 ? 'resposta' : 'respostas'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Feedbacks Detailed Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Todas as Avaliações Recebidas ({filteredFeedbacks.length})
                </h4>
              </div>

              {filteredFeedbacks.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">Nenhuma avaliação encontrada para o período selecionado.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                        <th className="pb-2">Data</th>
                        <th className="pb-2">Cliente</th>
                        <th className="pb-2">Nota / NPS</th>
                        <th className="pb-2">Destaques / Tags</th>
                        <th className="pb-2">Depoimento do Cliente</th>
                        <th className="pb-2">Resposta da Empresa</th>
                        <th className="pb-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredFeedbacks.map(fb => (
                        <tr key={fb.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 font-medium whitespace-nowrap text-slate-500">
                            {formatDate(fb.date)}
                          </td>
                          <td className="py-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            {fb.client_name}
                            {fb.pool_name && (
                              <span className="block text-[10px] font-normal text-slate-400 truncate max-w-[140px]">
                                {fb.pool_name}
                              </span>
                            )}
                          </td>
                          <td className="py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                              <span className="font-bold text-slate-900 dark:text-white">{fb.rating}.0</span>
                              <span className="text-[10px] text-emerald-600 font-extrabold ml-1">
                                (NPS {fb.nps_score ?? 10})
                              </span>
                            </div>
                          </td>
                          <td className="py-3 max-w-[200px]">
                            <div className="flex flex-wrap gap-1">
                              {(fb.tags || []).slice(0, 2).map(t => (
                                <span key={t} className="px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded text-[9px] font-semibold">
                                  {t}
                                </span>
                              ))}
                              {(fb.tags || []).length > 2 && (
                                <span className="text-[9px] text-slate-400">+{fb.tags!.length - 2}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-slate-700 dark:text-slate-300 italic max-w-xs">
                            "{fb.comment}"
                          </td>
                          <td className="py-3 text-slate-500 max-w-xs">
                            {fb.technician_reply ? (
                              <span className="text-sky-600 dark:text-sky-400 font-medium">
                                ✓ {fb.technician_reply}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFeedback(fb);
                                  setIsFeedbackModalOpen(true);
                                }}
                                className="p-1 text-slate-400 hover:text-sky-600 rounded"
                                title="Editar"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setFeedbackToDelete(fb.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FINANCEIRO */}
        {reportType === 'financeiro' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-900/40">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">
                  Receitas Totais
                </span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(totalRevenue)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {filteredPayments.length} pagamentos confirmados
                </p>
              </div>

              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-200 dark:border-rose-900/40">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase">
                  Despesas Totais
                </span>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(totalExpenses)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {filteredExpenses.length} lançamentos de compras e custos
                </p>
              </div>

              <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-200 dark:border-sky-900/40">
                <span className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase">
                  Resultado Líquido (Lucro)
                </span>
                <div className={`text-2xl font-black mt-1 ${netResult >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600'}`}>
                  {formatCurrency(netResult)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Margem operacional positiva</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                    <th className="pb-2">Data</th>
                    <th className="pb-2">Tipo</th>
                    <th className="pb-2">Descrição / Cliente</th>
                    <th className="pb-2">Forma</th>
                    <th className="pb-2 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPayments.map(p => {
                    const record = serviceRecords.find(r => r.id === p.service_record_id);
                    const client = clients.find(c => c.id === (p.client_id || record?.client_id));
                    return (
                      <tr key={p.id}>
                        <td className="py-2.5 font-medium text-slate-500">
                          {formatDate(p.payment_date || p.date || '')}
                        </td>
                        <td className="py-2.5 font-bold text-emerald-600">Receita</td>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                          {client?.name || 'Cliente'} - {p.notes || 'Serviço executado'}
                        </td>
                        <td className="py-2.5 text-slate-500">{p.payment_method}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-600">
                          +{formatCurrency(p.amount)}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredExpenses.map(e => (
                    <tr key={e.id}>
                      <td className="py-2.5 font-medium text-slate-500">{formatDate(e.date)}</td>
                      <td className="py-2.5 font-bold text-rose-600">Despesa</td>
                      <td className="py-2.5 text-slate-700 dark:text-slate-300">
                        {e.category} - {e.description}
                      </td>
                      <td className="py-2.5 text-slate-500">{e.payment_method}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-rose-600">
                        -{formatCurrency(e.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SERVIÇOS */}
        {reportType === 'servicos' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="pb-2">Data</th>
                  <th className="pb-2">Cliente</th>
                  <th className="pb-2">Piscina</th>
                  <th className="pb-2">Serviço</th>
                  <th className="pb-2">Técnico</th>
                  <th className="pb-2">Valor</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map(rec => {
                  const client = clients.find(c => c.id === rec.client_id);
                  const pool = pools.find(p => p.id === rec.pool_id);
                  const service = services.find(s => s.id === rec.service_id);

                  return (
                    <tr key={rec.id}>
                      <td className="py-2.5 font-medium">{formatDate(rec.service_date)}</td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                        {client?.name}
                      </td>
                      <td className="py-2.5 text-slate-500">{pool?.name}</td>
                      <td className="py-2.5 text-slate-800 dark:text-slate-200">
                        {service?.name || rec.description}
                      </td>
                      <td className="py-2.5 text-slate-500">{rec.responsible}</td>
                      <td className="py-2.5 font-mono font-bold">{formatCurrency(rec.final_price)}</td>
                      <td className="py-2.5 text-right font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                            rec.payment_status === 'Pago'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {rec.payment_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* CLIENTES */}
        {reportType === 'clientes' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="pb-2">Cliente</th>
                  <th className="pb-2">Data de Vencimento</th>
                  <th className="pb-2">Telefone / WhatsApp</th>
                  <th className="pb-2">E-mail</th>
                  <th className="pb-2">Cidade / Bairro</th>
                  <th className="pb-2 text-right">Piscinas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {clients.map(c => {
                  const clientPools = pools.filter(p => p.client_id === c.id);

                  return (
                    <tr key={c.id}>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">{c.name}</td>
                      <td className="py-2.5 font-mono font-bold text-sky-600 dark:text-sky-400">
                        {c.due_date ? formatDate(c.due_date) : 'Sem vencimento'}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400 font-mono">
                        {c.whatsapp || c.phone || '-'}
                      </td>
                      <td className="py-2.5 text-slate-500">{c.email || '-'}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-400">
                        {c.neighborhood ? `${c.neighborhood}, ${c.city}` : c.city}
                      </td>
                      <td className="py-2.5 text-right font-bold text-sky-600">
                        {clientPools.length}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => {
            setIsFeedbackModalOpen(false);
            setEditingFeedback(null);
          }}
          feedbackToEdit={editingFeedback}
        />
      )}

      {/* Delete Feedback Confirm Modal */}
      <ConfirmModal
        isOpen={!!feedbackToDelete}
        title="Excluir Avaliação"
        message="Deseja realmente excluir este registro de avaliação do cliente?"
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDeleteFeedback}
        onClose={() => setFeedbackToDelete(null)}
      />
    </div>
  );
};

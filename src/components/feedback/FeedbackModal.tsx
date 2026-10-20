import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MessageSquare,
  User,
  Waves,
  CheckCircle2,
  Calendar,
  Send,
  Sparkles,
  Smile,
  ThumbsUp,
  Share2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Client, Pool, ServiceRecord, ClientFeedback } from '../../types';
import {
  getClients,
  getPoolsByClientId,
  getServiceRecords,
  createFeedback,
  updateFeedback,
} from '../../database/storage';
import { generateWhatsAppLink } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillClientId?: string;
  prefillPoolId?: string;
  prefillRecordId?: string;
  feedbackToEdit?: ClientFeedback | null;
  onFeedbackSaved?: (feedback: ClientFeedback) => void;
}

const AVAILABLE_TAGS = [
  'Água Cristalina & Pura',
  'Pontualidade Britânica',
  'Excelente Atendimento',
  'Parâmetros Perfeitos (pH/Cloro)',
  'Cuidado com o Imóvel',
  'Técnico Qualificado',
  'Preço & Custo-Benefício Justo',
  'Bomba & Filtro Silenciosos',
  'Comprovante WhatsApp Rápido',
  'Solução Rápida em Emergência',
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  prefillClientId,
  prefillPoolId,
  prefillRecordId,
  feedbackToEdit,
  onFeedbackSaved,
}) => {
  const { success, error } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [records, setRecords] = useState<ServiceRecord[]>([]);

  // Form states
  const [clientId, setClientId] = useState('');
  const [poolId, setPoolId] = useState('');
  const [recordId, setRecordId] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [npsScore, setNpsScore] = useState<number>(10);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    'Água Cristalina & Pura',
    'Pontualidade Britânica',
    'Excelente Atendimento',
  ]);
  const [comment, setComment] = useState('');
  const [technicianReply, setTechnicianReply] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState<'whatsapp_review' | 'app_direct' | 'in_person' | 'phone'>('whatsapp_review');

  useEffect(() => {
    const allClients = getClients();
    const allRecords = getServiceRecords();
    setClients(allClients);
    setRecords(allRecords);

    if (feedbackToEdit) {
      setClientId(feedbackToEdit.client_id);
      setPoolId(feedbackToEdit.pool_id || '');
      setRecordId(feedbackToEdit.service_record_id || '');
      setRating(feedbackToEdit.rating);
      setNpsScore(feedbackToEdit.nps_score || 10);
      setSelectedTags(feedbackToEdit.tags || []);
      setComment(feedbackToEdit.comment || '');
      setTechnicianReply(feedbackToEdit.technician_reply || '');
      setDate(feedbackToEdit.date);
      setSource(feedbackToEdit.source || 'whatsapp_review');

      const clientPools = getPoolsByClientId(feedbackToEdit.client_id);
      setPools(clientPools);
    } else {
      const initialClient = prefillClientId || (allClients[0]?.id || '');
      setClientId(initialClient);

      const clientPools = getPoolsByClientId(initialClient);
      setPools(clientPools);
      setPoolId(prefillPoolId || (clientPools[0]?.id || ''));

      setRecordId(prefillRecordId || '');
      setRating(5);
      setNpsScore(10);
      setSelectedTags(['Água Cristalina & Pura', 'Pontualidade Britânica', 'Excelente Atendimento']);
      setComment('');
      setTechnicianReply('');
      setDate(new Date().toISOString().split('T')[0]);
      setSource('whatsapp_review');
    }
  }, [isOpen, prefillClientId, prefillPoolId, prefillRecordId, feedbackToEdit]);

  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const clientPools = getPoolsByClientId(cId);
    setPools(clientPools);
    setPoolId(clientPools[0]?.id || '');
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      error('Selecione um cliente para vincular a avaliação.');
      return;
    }

    if (rating < 1 || rating > 5) {
      error('Por favor, informe uma nota de 1 a 5 estrelas.');
      return;
    }

    const client = clients.find(c => c.id === clientId);
    const pool = pools.find(p => p.id === poolId);
    const record = records.find(r => r.id === recordId);

    try {
      if (feedbackToEdit) {
        const updated = updateFeedback(feedbackToEdit.id, {
          client_id: clientId,
          client_name: client?.name,
          pool_id: poolId || undefined,
          pool_name: pool?.name || undefined,
          service_record_id: recordId || undefined,
          service_name: record?.description || undefined,
          rating,
          nps_score: npsScore,
          tags: selectedTags,
          comment,
          technician_reply: technicianReply || undefined,
          date,
          source,
        });
        success('Avaliação atualizada com sucesso!');
        if (updated && onFeedbackSaved) onFeedbackSaved(updated);
      } else {
        const created = createFeedback({
          client_id: clientId,
          client_name: client?.name,
          pool_id: poolId || undefined,
          pool_name: pool?.name || undefined,
          service_record_id: recordId || undefined,
          service_name: record?.description || undefined,
          rating,
          nps_score: npsScore,
          tags: selectedTags,
          comment,
          technician_reply: technicianReply || undefined,
          date,
          source,
        });

        // Launch celebratory confetti for 5 stars!
        if (rating >= 4) {
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#0284c7', '#f59e0b', '#10b981', '#38bdf8'],
            });
          } catch {}
        }

        success('Avaliação de cliente registrada e arquivada com sucesso!');
        if (created && onFeedbackSaved) onFeedbackSaved(created);
      }

      onClose();
    } catch {
      error('Erro ao salvar avaliação.');
    }
  };

  const getRatingLabel = (stars: number) => {
    switch (stars) {
      case 1:
        return 'Péssimo / Insatisfeito 😡';
      case 2:
        return 'Ruim / Precisa melhorar 😕';
      case 3:
        return 'Regular / Atendeu o básico 😐';
      case 4:
        return 'Muito Bom / Satisfeito 😊';
      case 5:
        return 'Excelente / Impecável! 🌟';
      default:
        return 'Selecione a nota';
    }
  };

  const selectedClient = clients.find(c => c.id === clientId);
  const clientPhone = selectedClient?.whatsapp || selectedClient?.phone;

  const handleWhatsAppReviewRequest = () => {
    if (!clientPhone) {
      error('Cliente não possui telefone cadastrado.');
      return;
    }

    const text = `Olá, ${selectedClient?.name || 'Cliente'}! Aqui é o Venâncio da *Venâncio Piscinas*. 🏊‍♂️✨\n\nEsperamos que você esteja aproveitando a sua piscina com a água cristalina e protegida! Poderia nos avaliar com uma nota de 1 a 5 estrelas e nos dizer o que achou do nosso atendimento?\n\nSua opinião é fundamental para aprimorarmos nosso trabalho! Muito obrigado pela confiança!`;
    const url = generateWhatsAppLink(clientPhone, text);
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-600 via-cyan-600 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {feedbackToEdit ? 'Editar Avaliação de Satisfação' : 'Registrar Avaliação do Cliente'}
              </h3>
              <p className="text-xs text-sky-100">
                Armazene a opinião do cliente, métricas de qualidade e NPS
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

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
          {/* Quick WhatsApp review request trigger */}
          {selectedClient && clientPhone && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Smile className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-emerald-900 dark:text-emerald-200 text-xs font-medium">
                  Quer pedir a avaliação diretamente ao cliente pelo WhatsApp?
                </span>
              </div>
              <button
                type="button"
                onClick={handleWhatsAppReviewRequest}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-xs transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enviar Solicitação</span>
              </button>
            </div>
          )}

          {/* Section 1: Cliente, Piscina e Data */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cliente *
              </label>
              <select
                required
                value={clientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="">Selecione o cliente...</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Piscina
              </label>
              <select
                value={poolId}
                onChange={e => setPoolId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              >
                <option value="">Geral / Todas</option>
                {pools.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data da Avaliação
              </label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Section 2: Star Rating & NPS */}
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl space-y-3 text-center">
            <div>
              <span className="text-[11px] font-extrabold uppercase text-amber-900 dark:text-amber-300">
                Nota Geral do Atendimento (1 a 5 Estrelas)
              </span>
              <div className="flex items-center justify-center gap-2 mt-2">
                {[1, 2, 3, 4, 5].map(star => {
                  const isFilled = (hoverRating || rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-300 dark:text-slate-600 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mt-1">
                {getRatingLabel(hoverRating || rating)}
              </p>
            </div>

            {/* NPS Slider */}
            <div className="pt-3 border-t border-amber-200/60 dark:border-amber-800/40 text-left">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Índice de Recomendação (NPS: 0 a 10)
                </label>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                  {npsScore} / 10 {npsScore >= 9 ? '🏆 Promotor' : npsScore >= 7 ? '😐 Neutro' : '⚠️ Detrator'}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={npsScore}
                onChange={e => setNpsScore(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0 (Jamais recomendaria)</span>
                <span>10 (Com certeza recomendo!)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Tag Highlights */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Destaques Positivos / Aspectos Avaliados
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Depoimento / Comentário */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Comentário / Depoimento do Cliente *
            </label>
            <textarea
              required
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Ex: Piscina ficou impecável, água muito limpa e transparente. Equipe nota 10!"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Section 5: Resposta da Equipe / Agradecimento */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Resposta / Agradecimento da Venâncio Piscinas (Opcional)
            </label>
            <input
              type="text"
              value={technicianReply}
              onChange={e => setTechnicianReply(e.target.value)}
              placeholder="Ex: Muito obrigado pela confiança, Dr. Roberto! Conte conosco sempre."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
            />
          </div>

          {/* Canal de Origem */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Canal de Coleta
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'whatsapp_review', label: '📱 WhatsApp' },
                { id: 'app_direct', label: '💻 No Aplicativo' },
                { id: 'in_person', label: '🤝 Pessoalmente' },
                { id: 'phone', label: '📞 Telefone' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSource(opt.id as any)}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    source === opt.id
                      ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition"
            >
              {feedbackToEdit ? 'Atualizar Avaliação' : 'Salvar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

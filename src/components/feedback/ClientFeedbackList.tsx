import React, { useState, useEffect } from 'react';
import {
  Star,
  MessageSquare,
  Plus,
  ThumbsUp,
  Share2,
  Trash2,
  Edit2,
  Sparkles,
  Calendar,
  MessageCircle,
  Award,
} from 'lucide-react';
import { ClientFeedback, Client } from '../../types';
import {
  getFeedbacksByClientId,
  deleteFeedback,
  subscribeToDatabase,
} from '../../database/storage';
import { FeedbackModal } from './FeedbackModal';
import { formatDate, generateWhatsAppLink } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { ConfirmModal } from '../common/ConfirmModal';

interface ClientFeedbackListProps {
  client: Client;
}

export const ClientFeedbackList: React.FC<ClientFeedbackListProps> = ({ client }) => {
  const { success, error } = useToast();
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState<ClientFeedback | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<string | null>(null);

  const loadFeedbacks = () => {
    const list = getFeedbacksByClientId(client.id);
    setFeedbacks(list);
  };

  useEffect(() => {
    loadFeedbacks();
    const unsubscribe = subscribeToDatabase(loadFeedbacks);
    return () => unsubscribe();
  }, [client.id]);

  const handleConfirmDelete = () => {
    if (!feedbackToDelete) return;
    try {
      deleteFeedback(feedbackToDelete);
      loadFeedbacks();
      success('Avaliação removida com sucesso.');
    } catch {
      error('Erro ao excluir avaliação.');
    } finally {
      setFeedbackToDelete(null);
    }
  };

  // Calculate client satisfaction stats
  const totalReviews = feedbacks.length;
  const avgRating = totalReviews > 0
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const avgNps = totalReviews > 0
    ? (feedbacks.reduce((acc, f) => acc + (f.nps_score || 10), 0) / totalReviews).toFixed(0)
    : '10';

  const clientPhone = client.whatsapp || client.phone;

  const handleRequestReviewWhatsApp = () => {
    if (!clientPhone) {
      error('Cliente não possui telefone cadastrado.');
      return;
    }

    const text = `Olá, ${client.name}! Aqui é da *Venâncio Piscinas*. 🏊‍♂️✨\n\nGostaríamos de saber o que você achou dos nossos serviços de limpeza e manutenção na sua piscina! Poderia nos avaliar com uma nota de 1 a 5 estrelas e um breve comentário?\n\nSua satisfação é nossa maior prioridade! Muito obrigado!`;
    const url = generateWhatsAppLink(clientPhone, text);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Summary Score Bar */}
      <div className="bg-gradient-to-r from-amber-500/10 via-sky-500/10 to-emerald-500/10 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-white font-black text-2xl shadow-md shadow-amber-500/20 shrink-0">
            {avgRating}
          </div>
          <div>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <Star
                  key={star}
                  className={`w-4 h-4 ${
                    star <= Math.round(Number(avgRating))
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 ml-1.5">
                {totalReviews} {totalReviews === 1 ? 'avaliação' : 'avaliações'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
              <span>NPS Médio: <strong className="text-emerald-600 dark:text-emerald-400">{avgNps}/10</strong></span>
              <span>•</span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-0.5">
                <Award className="w-3 h-3" /> Cliente {Number(avgRating) >= 4.5 ? 'VIP Fidelizado' : 'Ativo'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {clientPhone && (
            <button
              type="button"
              onClick={handleRequestReviewWhatsApp}
              className="flex-1 sm:flex-none px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              title="Solicitar avaliação via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Pedir via WhatsApp</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setEditingFeedback(null);
              setIsModalOpen(true);
            }}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Avaliação</span>
          </button>
        </div>
      </div>

      {/* List of Reviews */}
      {feedbacks.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
          <h4 className="font-bold text-sm text-slate-700 dark:text-slate-300">
            Nenhuma avaliação registrada ainda
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Registre o feedback pós-atendimento para monitorar a satisfação do cliente com a limpeza e produtos.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingFeedback(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition"
          >
            Registrar Primeira Avaliação
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map(fb => (
            <div
              key={fb.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Review Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= fb.rating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                      {fb.rating}.0 / 5.0
                    </span>
                    {fb.nps_score !== undefined && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                        NPS {fb.nps_score}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(fb.date)}
                    </span>
                    {fb.pool_name && (
                      <>
                        <span>•</span>
                        <span>{fb.pool_name}</span>
                      </>
                    )}
                    {fb.source && (
                      <>
                        <span>•</span>
                        <span className="capitalize">
                          {fb.source === 'whatsapp_review'
                            ? 'Via WhatsApp'
                            : fb.source === 'app_direct'
                            ? 'No App'
                            : fb.source === 'in_person'
                            ? 'Presencial'
                            : 'Telefone'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFeedback(fb);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Editar avaliação"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackToDelete(fb.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Excluir avaliação"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tags */}
              {fb.tags && fb.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {fb.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-medium"
                    >
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Comment */}
              {fb.comment && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 italic border-l-2 border-amber-400">
                  "{fb.comment}"
                </div>
              )}

              {/* Technician Reply */}
              {fb.technician_reply && (
                <div className="p-2.5 bg-sky-50/70 dark:bg-sky-950/30 rounded-xl text-xs text-sky-900 dark:text-sky-200 border border-sky-100 dark:border-sky-900/40 flex items-start gap-2">
                  <MessageCircle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[11px] block">
                      Resposta da Venâncio Piscinas:
                    </span>
                    <span>{fb.technician_reply}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Feedback Modal */}
      {isModalOpen && (
        <FeedbackModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingFeedback(null);
          }}
          prefillClientId={client.id}
          feedbackToEdit={editingFeedback}
        />
      )}

      {/* Confirm Delete Feedback Modal */}
      <ConfirmModal
        isOpen={!!feedbackToDelete}
        title="Excluir Avaliação"
        message="Deseja realmente remover esta avaliação do cliente?"
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setFeedbackToDelete(null)}
      />
    </div>
  );
};

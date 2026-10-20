import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Maximize2,
  Trash2,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { ChatMessage } from '../../types';
import { getChatMessages, saveChatMessages, clearChatMessages } from '../../database/storage';
import { useToast } from '../../context/ToastContext';

interface ChatFloatingWidgetProps {
  onNavigateToChatPage?: () => void;
  currentPage?: string;
}

export const ChatFloatingWidget: React.FC<ChatFloatingWidgetProps> = ({
  onNavigateToChatPage,
  currentPage,
}) => {
  const { success, error } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // If we are already on the full chat page, don't show the floating button
  const isOnChatPage = currentPage === 'chat' || currentPage === 'assistente';

  useEffect(() => {
    const stored = getChatMessages();
    if (stored && stored.length > 0) {
      setMessages(stored);
    } else {
      const initialGreeting: ChatMessage = {
        id: 'msg-widget-welcome',
        role: 'assistant',
        content: `Olá! Sou o **Assistente de IA da Venâncio Piscinas**. Em que posso te ajudar agora? (Dosagem de cloro, tratamento de água verde, mensagens para clientes ou dúvidas técnicas).`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initialGreeting]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  if (isOnChatPage) return null;

  const handleSendMessage = async (customText?: string) => {
    const text = (customText || inputMessage).trim();
    if (!text || isLoading) return;

    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          model: 'gemini-flash-latest',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro (${response.status})`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Sem resposta.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        model: data.model || 'gemini-flash-latest',
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveChatMessages(finalMessages);
    } catch (err: any) {
      error(err.message || 'Erro ao comunicar com a IA');
      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Não foi possível obter resposta: ${err.message || 'Erro de conexão'}.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      const finalWithErr = [...updatedMessages, errorMessage];
      setMessages(finalWithErr);
      saveChatMessages(finalWithErr);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    success('Copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExpandToFullPage = () => {
    setIsOpen(false);
    if (onNavigateToChatPage) {
      onNavigateToChatPage();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          id="btn-open-floating-chat"
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white rounded-full shadow-lg shadow-sky-600/30 hover:scale-105 active:scale-95 transition cursor-pointer group"
          title="Abrir Chat de IA Venâncio Piscinas"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-sky-600 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-sky-600 rounded-full" />
          </div>
          <span className="text-xs font-bold tracking-wide hidden sm:inline-block">Chat IA</span>
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          id="floating-chat-box"
          className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm h-[520px] max-h-[80vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-sky-600 to-blue-700 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-xs">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xs sm:text-sm leading-tight flex items-center gap-1.5">
                  <span>Chat IA • Piscinas</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/30 text-[9px] font-mono rounded">
                    Online
                  </span>
                </h3>
                <p className="text-[10px] text-sky-100">Suporte técnico & cálculos</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleExpandToFullPage}
                className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                title="Expandir para tela cheia"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/20 transition cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => handleSendMessage('Como calcular cloro para 30.000 litros?')}
              className="text-[10px] px-2 py-0.8 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-md whitespace-nowrap hover:bg-sky-50 dark:hover:bg-sky-950 transition cursor-pointer"
            >
              🧪 Cloro 30k L
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Como tratar água verde de piscina?')}
              className="text-[10px] px-2 py-0.8 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-md whitespace-nowrap hover:bg-sky-50 dark:hover:bg-sky-950 transition cursor-pointer"
            >
              🌿 Água Verde
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage('Mensagem para avisar cliente de piscina pronta')}
              className="text-[10px] px-2 py-0.8 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-600 rounded-md whitespace-nowrap hover:bg-sky-50 dark:hover:bg-sky-950 transition cursor-pointer"
            >
              💬 Aviso WhatsApp
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {messages.map((msg, i) => {
              const isAi = msg.role === 'assistant';
              return (
                <div
                  key={msg.id || i}
                  className={`flex items-start gap-2 ${isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      isAi
                        ? 'bg-sky-600 text-white'
                        : 'bg-slate-700 text-white'
                    }`}
                  >
                    {isAi ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  </div>

                  <div
                    className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed ${
                      isAi
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none'
                        : 'bg-sky-600 text-white rounded-tr-none'
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words text-[11px] sm:text-xs">
                      {msg.content}
                    </div>

                    {isAi && (
                      <div className="mt-1 pt-1 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[9px] text-slate-400">
                        <span>{msg.timestamp}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-slate-800 dark:hover:text-white transition cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px]">Calculando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom input */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Digite sua dúvida..."
              className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-40 transition cursor-pointer shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};

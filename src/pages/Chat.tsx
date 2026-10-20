import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  FlaskConical,
  Activity,
  MessageSquare,
  Wrench,
  HelpCircle,
  Waves,
  Download,
  AlertCircle,
  Share2,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import { ChatMessage, ChatRolePreset, Client, Pool } from '../types';
import {
  getClients,
  getPools,
  getChatMessages,
  saveChatMessages,
  clearChatMessages,
} from '../database/storage';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/common/ConfirmModal';

interface ChatProps {
  onSelectClient?: (clientId: string) => void;
}

export const Chat: React.FC<ChatProps> = () => {
  const { success, error } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<ChatRolePreset>('general');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-flash-latest');
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // Client/Pool context injection
  const [clients, setClients] = useState<Client[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load clients, pools, and chat history on mount
  useEffect(() => {
    const loadedClients = getClients();
    const loadedPools = getPools();
    setClients(loadedClients);
    setPools(loadedPools);

    const storedMessages = getChatMessages();
    if (storedMessages && storedMessages.length > 0) {
      setMessages(storedMessages);
    } else {
      // Default welcoming assistant message
      const initialGreeting: ChatMessage = {
        id: 'msg-welcome',
        role: 'assistant',
        content: `Olá! Sou o **Assistente de IA Especialista da Venâncio Piscinas**. 🏊‍♂️✨

Como posso te ajudar hoje?
- 🧪 **Cálculo de dosagem química** (Cloro, Barrilha, Sulfato, Algicidas, Redutor de pH por volume)
- 🌿 **Diagnóstico e tratamento** de água verde, turva ou desbalanceada
- 💬 **Mensagens profissionais para WhatsApp** (avisos de conclusão, cobranças cordiais, orçamentos)
- ⚙️ **Dúvidas de manutenção** em filtros de areia, bombas e tempo de aspiração
- 📋 **Consultoria técnica** personalizada para qualquer piscina de cliente cadastrado

Selecione um cliente acima ou clique em uma das sugestões rápidas para começar!`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        model: 'gemini-3.7-flash',
      };
      setMessages([initialGreeting]);
      saveChatMessages([initialGreeting]);
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Preset Instructions
  const getPresetSystemInstruction = (preset: ChatRolePreset): string => {
    const baseInstruction = `Você é o Assistente Virtual e Especialista Técnico da 'Venâncio Piscinas - Gestão e Manutenção'.
Trate o usuário com cordialidade, profissionalismo e forneça respostas técnicas precisas em Português do Brasil.
Sempre que pertinente, forneça cálculos exatos de gramas (g) ou mililitros (ml) baseando-se no volume em litros da piscina.`;

    switch (preset) {
      case 'chemical_calculator':
        return `${baseInstruction}
FOCO PRINCIPAL: CÁLCULOS DE DOSAGEM QUÍMICA E TRATAMENTO DA ÁGUA.
Parâmetros de referência ideais:
- pH: 7.2 a 7.6 (ideal 7.4)
- Cloro livre: 1.0 a 3.0 ppm (choque: 10 a 14 ppm)
- Alcalinidade Total: 80 a 120 ppm
- Dureza Cálcica: 200 a 400 ppm
- Ácido Cianúrico: máx 50 ppm
Fórmulas práticas padrão por cada 1.000 Litros (1m³):
- Cloro Granulado Dicloro/Tricloro: 4g a 5g / 1.000 L para manutenção (ou 15g a 20g / 1.000 L para choque)
- Barrilha Leve (Carbonato de Sódio): ~10g a 20g / 1.000 L para elevar pH
- Bicarbonato de Sódio (Elevador de Alcalinidade): 17g / 1.000 L para subir 10 ppm
- Sulfato de Alumínio (Decantação): 40g / 1.000 L (junto com 20g / 1.000 L de Barrilha)
- Algicida Manutenção: 6ml / 1.000 L; Algicida de Choque: 10ml a 12ml / 1.000 L
Sempre oriente a diluir em balde com água da própria piscina antes de espalhar e respeitar o tempo de recirculação/descanso.`;

      case 'water_diagnosis':
        return `${baseInstruction}
FOCO PRINCIPAL: DIAGNÓSTICO E RESOLUÇÃO DE PROBLEMAS DE ÁGUA.
Ajude a diagnosticar:
1. Água verde (algas verdes): cloro de choque + algicida de choque + decantação ou clarificante.
2. Água turva/leitosa: ajuste de pH/alcalinidade, clarificante floculante e filtração contínua (6 a 8h).
3. Água com cheiro forte (cloraminas): supercloração / oxidação de choque.
4. Manchas metálicas ou ferrugem: sequestrante de metais.
Apresente a solução em etapas numeradas passo a passo de forma simples e direta.`;

      case 'whatsapp_assistant':
        return `${baseInstruction}
FOCO PRINCIPAL: REDAÇÃO DE MENSAGENS PROFISSIONAIS PARA CLIENTES VIA WHATSAPP.
Gere textos prontos para copiar e colar com emojis adequados, tom amigável e profissional, incluindo:
- Confirmação de visita agendada
- Relatório rápido pós-serviço (piscina aspirada, tratada, tempo para banho liberado)
- Lembretes e cobrança cordial com chave Pix da empresa
- Dicas sazonais de cuidados para o proprietário`;

      case 'equipment_troubleshooting':
        return `${baseInstruction}
FOCO PRINCIPAL: EQUIPAMENTOS, CASA DE MÁQUINAS, FILTROS E BOMBAS.
Oriente sobre:
- Posições da válvula seletora do filtro: Filtrar, Retrolavar, Enxaguar, Recircular, Drenar/Esgoto, Fechado.
- Cuidados ao mudar a alavanca (SEMPRE com motor desligado).
- Troca periódica de areia (1 a 2 anos) e limpeza do pré-filtro da bomba e skimmer.`;

      default:
        return baseInstruction;
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    // Build context prefix if a client is selected
    let augmentedText = text;
    if (selectedClientId) {
      const client = clients.find(c => c.id === selectedClientId);
      const clientPools = pools.filter(p => p.client_id === selectedClientId);
      if (client) {
        const poolInfo =
          clientPools.length > 0
            ? clientPools
                .map(p => `Piscina: ${p.name || p.type}, Volume: ${p.volume?.toLocaleString('pt-BR')} Litros, Tipo: ${p.type}`)
                .join('; ')
            : 'Piscina não especificada';
        augmentedText = `[Contexto do Cliente: ${client.name} | Endereço: ${client.street}, ${client.number} - ${client.neighborhood} | ${poolInfo}]\n\n${text}`;
      }
    }

    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text, // display original text to user
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      // Prepare payload for server API
      // We pass the conversation history, with augmented text for the latest message if context was added
      const apiMessages = updatedMessages.map((m, idx) => {
        if (idx === updatedMessages.length - 1 && m.role === 'user') {
          return { role: m.role, content: augmentedText };
        }
        return { role: m.role, content: m.content };
      });

      const systemInstruction = getPresetSystemInstruction(selectedPreset);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel,
          systemInstruction,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Erro no servidor (${response.status})`);
      }

      const data = await response.json();

      const assistantMessage: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Sem resposta.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        model: data.model || selectedModel,
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      saveChatMessages(finalMessages);
    } catch (err: any) {
      console.error('Erro ao enviar mensagem:', err);
      error(err.message || 'Não foi possível obter resposta da IA. Verifique sua conexão.');

      const errorMessage: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Ops!** Não foi possível processar sua solicitação no momento.\n\n*Motivo*: ${err.message || 'Falha de comunicação com o servidor de IA'}. Por favor, tente novamente em instantes.`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      const finalWithErr = [...updatedMessages, errorMessage];
      setMessages(finalWithErr);
      saveChatMessages(finalWithErr);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmClearHistory = () => {
    clearChatMessages();
    const initialGreeting: ChatMessage = {
      id: 'msg-welcome-new',
      role: 'assistant',
      content: `Conversa reiniciada. Em que posso te ajudar agora? Você pode escolher um especialista temático acima ou digitar sua dúvida.`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      model: selectedModel,
    };
    setMessages([initialGreeting]);
    saveChatMessages([initialGreeting]);
    setIsClearModalOpen(false);
    success('Histórico do chat limpo com sucesso!');
  };

  const handleCopyText = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    success('Texto copiado para a área de transferência!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleShareToWhatsApp = (text: string) => {
    const cleanText = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${cleanText}`, '_blank');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Quick suggestions based on selected preset
  const quickSuggestions: Record<ChatRolePreset, { title: string; prompt: string }[]> = {
    general: [
      {
        title: '🧪 Dosagem 30.000 L',
        prompt: 'Qual a dosagem recomendada de cloro granulado e barrilha leve para uma piscina de 30.000 litros de fibra?',
      },
      {
        title: '🌿 Tratar Água Verde',
        prompt: 'Minha piscina está com água verde escura e fundo sujo. Qual o passo a passo para decantar e aspirar corretamente?',
      },
      {
        title: '💬 Mensagem WhatsApp Pós-Serviço',
        prompt: 'Escreva uma mensagem profissional para enviar no WhatsApp do cliente avisando que a limpeza da piscina foi concluída com sucesso e orientando sobre o tempo para banho.',
      },
      {
        title: '💧 pH 8.0 & Alcalinidade Alta',
        prompt: 'O pH está em 8.0 e a alcalinidade em 150 ppm. Como devo regular a água passo a passo?',
      },
    ],
    chemical_calculator: [
      {
        title: 'Cloro Choque para 45.000L',
        prompt: 'Calcule a quantidade exata de cloro para tratamento de choque em uma piscina de 45.000 litros de alvenaria.',
      },
      {
        title: 'Elevar Alcalinidade em 30 ppm',
        prompt: 'A piscina tem 35.000L e a alcalinidade está em 50 ppm. Quantos gramas de Bicarbonato de Sódio devo aplicar para atingir 100 ppm?',
      },
      {
        title: 'Sulfato + Barrilha para Decantar',
        prompt: 'Para uma piscina de 50.000L com água turva, qual a dosagem correta de Sulfato de Alumínio e Barrilha Leve para decantação noturna?',
      },
      {
        title: 'Algicida de Manutenção vs Choque',
        prompt: 'Quando devo usar Algicida de Choque vs Algicida de Manutenção? Qual a dosagem para 20.000L?',
      },
    ],
    water_diagnosis: [
      {
        title: 'Água Leitosa / Esbranquiçada',
        prompt: 'A água da piscina ficou leitosa após aplicar produtos. Qual a causa e como deixar cristalina novamente?',
      },
      {
        title: 'Cheiro Forte de Cloro e Olhos Ardendo',
        prompt: 'Os banhistas reclamam de cheiro forte de cloro e olhos ardendo. É excesso de cloro ou cloraminas? Como resolver?',
      },
      {
        title: 'Algas Amarelas / Mostarda no Fundo',
        prompt: 'Como eliminar algas amarelas (mostarda) que ficam presas nas paredes e rejuntes da piscina?',
      },
      {
        title: 'Manchas de Ferrugem / Água Marrom',
        prompt: 'A água do poço artesiano ficou marrom/ferrugem ao aplicar cloro. Como decantar os metais da água?',
      },
    ],
    whatsapp_assistant: [
      {
        title: 'Aviso de Visita Agendada',
        prompt: 'Gere uma mensagem simpática para WhatsApp confirmando a visita técnica de limpeza de piscina amanhã pela manhã.',
      },
      {
        title: 'Cobrança Cordial de Mensalidade',
        prompt: 'Crie uma mensagem amigável e profissional para cobrança de mensalidade de manutenção de piscina com espaço para chave Pix.',
      },
      {
        title: 'Alerta de Chuva e Tratamento Extra',
        prompt: 'Crie um comunicado para clientes avisando que após as fortes chuvas é recomendado reforçar o cloro e manter a filtração ligada.',
      },
      {
        title: 'Aviso de Manutenção de Bomba/Filtro',
        prompt: 'Escreva um aviso para o cliente informando que identificamos que a areia do filtro precisa ser trocada e solicitando autorização para o orçamento.',
      },
    ],
    equipment_troubleshooting: [
      {
        title: 'Filtro Retornando Sujeira',
        prompt: 'O filtro está jogando sujeira de volta para a piscina pelos bocais de retorno. Quais as causas e como consertar?',
      },
      {
        title: 'Como Fazer Retrolavagem e Enxágue',
        prompt: 'Explique o procedimento correto de retrolavagem e enxágue da areia do filtro de piscina para não perder areia.',
      },
      {
        title: 'Bomba com Ar / Não Puxa Água',
        prompt: 'A bomba da piscina está rodando mas não suga água (com ar no pré-filtro). O que fazer para ferrar a bomba?',
      },
      {
        title: 'Quando Trocar Areia do Filtro',
        prompt: 'De quanto em quanto tempo deve ser trocada a areia do filtro de piscina e quais sinais indicam que a areia está saturada?',
      },
    ],
  };

  const presetConfig = [
    { id: 'general', label: 'Geral & Gestão', icon: Sparkles, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/60' },
    { id: 'chemical_calculator', label: 'Química & Dosagens', icon: FlaskConical, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' },
    { id: 'water_diagnosis', label: 'Diagnóstico d’Água', icon: Activity, color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/60' },
    { id: 'whatsapp_assistant', label: 'Mensagens WhatsApp', icon: MessageSquare, color: 'text-green-600 bg-green-50 dark:bg-green-950/60' },
    { id: 'equipment_troubleshooting', label: 'Bombas & Filtros', icon: Wrench, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' },
  ];

  return (
    <div id="chat-page" className="space-y-4 max-w-5xl mx-auto flex flex-col h-[calc(100vh-8.5rem)] min-h-[580px]">
      {/* Top Header & Presets Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white shadow-md shadow-sky-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Assistente de IA Venâncio Piscinas
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Gemini AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consultoria técnica em tempo real para química, rotinas de piscina, diagnósticos e mensagens
              </p>
            </div>
          </div>

          {/* Controls: Context Client, Model Selector & Clear Button */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Inject Client Context */}
            <div className="relative">
              <select
                id="chat-select-client-context"
                value={selectedClientId}
                onChange={e => setSelectedClientId(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer max-w-[200px] truncate"
                title="Vincular dados de piscina do cliente ao chat"
              >
                <option value="">👤 Vincular Cliente (Opcional)</option>
                {clients.map(c => {
                  const clientPool = pools.find(p => p.client_id === c.id);
                  const poolVol = clientPool?.volume ? ` (${(clientPool.volume / 1000).toFixed(0)}k L)` : '';
                  return (
                    <option key={c.id} value={c.id}>
                      {c.name} {poolVol}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Model Selector */}
            <div className="relative">
              <select
                id="chat-select-model"
                value={selectedModel}
                onChange={e => setSelectedModel(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                title="Modelo de Inteligência Artificial"
              >
                <option value="gemini-flash-latest">Gemini Flash (Padrão & Estável)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Ultrarrápido)</option>
                <option value="gemini-3.7-flash">Gemini 3.7 Flash</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Raciocínio Complexo)</option>
              </select>
            </div>

            {/* Clear history */}
            <button
              id="btn-clear-chat-history"
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Limpar Histórico de Mensagens"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Specialized Roles / Presets Bar */}
        <div className="flex items-center gap-1.5 pt-3 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1 shrink-0 uppercase tracking-wider">
            Modo:
          </span>
          {presetConfig.map(preset => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === preset.id;
            return (
              <button
                key={preset.id}
                id={`preset-${preset.id}`}
                type="button"
                onClick={() => setSelectedPreset(preset.id as ChatRolePreset)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs shadow-sky-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : ''}`} />
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages Conversation Thread */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs overflow-y-auto space-y-4">
        {messages.map((msg, index) => {
          const isAi = msg.role === 'assistant';
          return (
            <div
              key={msg.id || index}
              className={`flex items-start gap-3 max-w-[88%] sm:max-w-[80%] ${
                isAi ? 'mr-auto' : 'ml-auto flex-row-reverse'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isAi
                    ? 'bg-gradient-to-tr from-sky-600 to-cyan-500 text-white'
                    : 'bg-slate-700 text-white dark:bg-slate-700'
                }`}
              >
                {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`group relative rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
                  isAi
                    ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border-slate-200/80 dark:border-slate-700/80 rounded-tl-sm'
                    : 'bg-sky-600 text-white border-sky-600 rounded-tr-sm shadow-xs shadow-sky-600/20'
                }`}
              >
                {/* Content formatted */}
                <div className="whitespace-pre-wrap break-words leading-relaxed font-sans text-xs sm:text-sm">
                  {msg.content}
                </div>

                {/* Footer info & quick actions */}
                <div
                  className={`mt-2 pt-1.5 flex items-center justify-between gap-3 text-[10px] border-t ${
                    isAi
                      ? 'border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500'
                      : 'border-white/20 text-sky-100'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{msg.timestamp}</span>
                    {msg.model && isAi && (
                      <span className="hidden sm:inline-block opacity-75 font-mono">
                        • {msg.model}
                      </span>
                    )}
                  </div>

                  {/* Actions: Copy & WhatsApp Share */}
                  {isAi && (
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => handleCopyText(msg.content, msg.id)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                        title="Copiar texto"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShareToWhatsApp(msg.content)}
                        className="p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-500 dark:text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                        title="Compartilhar no WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading typing indicator */}
        {isLoading && (
          <div className="flex items-start gap-3 max-w-[80%] mr-auto animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl rounded-tl-sm px-4 py-3 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span className="text-slate-500 dark:text-slate-400 text-xs">
                Analisando parâmetros e gerando orientação...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions Chips & Input Form Area */}
      <div className="space-y-2 shrink-0">
        {/* Quick prompt chips based on active preset */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {quickSuggestions[selectedPreset]?.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(sug.prompt)}
              disabled={isLoading}
              className="text-xs bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 text-slate-700 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 whitespace-nowrap shadow-2xs transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {sug.title}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-md overflow-hidden p-1.5 focus-within:ring-2 focus-within:ring-sky-500 focus-within:border-sky-500 transition"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputMessage}
            onChange={e => {
              setInputMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedClientId
                ? `Pergunte sobre a piscina deste cliente ou digite sua dúvida...`
                : `Digite sua dúvida, dosagem de produtos, diagnóstico ou mensagem...`
            }
            className="w-full px-3.5 py-2 text-sm bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none resize-none max-h-28"
          />

          <button
            id="btn-send-chat-message"
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0 active:scale-95"
            title="Enviar mensagem (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Clear Chat History Confirm Modal */}
      <ConfirmModal
        isOpen={isClearModalOpen}
        title="Limpar Histórico da Conversa"
        message="Tem certeza de que deseja apagar todo o histórico de mensagens desta sessão com a IA? As mensagens anteriores serão excluídas."
        confirmText="Sim, Limpar Tudo"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmClearHistory}
        onClose={() => setIsClearModalOpen(false)}
      />
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  Phone,
  Mail,
  MapPin,
  QrCode,
  Save,
  RotateCcw,
  Download,
  Upload,
  Shield,
  CheckCircle2,
  Sun,
  Moon,
  Trash2,
  Sparkles,
  Image as ImageIcon,
  MessageSquare,
  FlaskConical,
  Palette,
  Database,
  Copy,
  Check,
  Droplets,
  FileText,
} from 'lucide-react';
import { CompanySettings } from '../types';
import {
  getCompanySettings,
  saveCompanySettings,
  clearAllDataToZero,
  loadDemoData,
  exportDatabaseJSON,
  importDatabaseJSON,
} from '../database/storage';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { CompanyLogo } from '../components/common/CompanyLogo';
import { ConfirmModal } from '../components/common/ConfirmModal';

type SettingsTab = 'empresa' | 'mensagens' | 'parametros' | 'aparencia' | 'backup';

export const Settings: React.FC = () => {
  const { success, error } = useToast();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>('empresa');
  const [formData, setFormData] = useState<CompanySettings>(() => getCompanySettings());
  const [isSaving, setIsSaving] = useState(false);
  const [isClearZeroModalOpen, setIsClearZeroModalOpen] = useState(false);
  const [isLoadDemoModalOpen, setIsLoadDemoModalOpen] = useState(false);
  const [copiedVar, setCopiedVar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Water chemistry parameters state (stored in localStorage)
  const [chemParams, setChemParams] = useState(() => {
    try {
      const saved = localStorage.getItem('venancio_piscinas_chem_params');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      phMin: '7.2',
      phMax: '7.6',
      cloroMin: '1.0',
      cloroMax: '3.0',
      alcalinidadeMin: '80',
      alcalinidadeMax: '120',
      acidoCianuricoMax: '50',
      durezaCalcicaMin: '200',
      durezaCalcicaMax: '400',
    };
  });

  // WhatsApp Templates state
  const [whatsappTemplate, setWhatsappTemplate] = useState(() => {
    try {
      const saved = localStorage.getItem('venancio_piscinas_whatsapp_template');
      if (saved) return saved;
    } catch {}
    return 'Olá *{cliente}*! 👋\n\nSeu atendimento de manutenção e limpeza na piscina foi concluído com sucesso por *{empresa}* em *{data}*.\n\n📄 *Serviço:* {servico}\n💰 *Valor:* {valor}\n🔑 *Chave Pix:* {pix}\n\nObrigado pela confiança e preferência!';
  });

  useEffect(() => {
    setFormData(getCompanySettings());
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      saveCompanySettings(formData);
      localStorage.setItem('venancio_piscinas_chem_params', JSON.stringify(chemParams));
      localStorage.setItem('venancio_piscinas_whatsapp_template', whatsappTemplate);
      success('Configurações salvas com sucesso!');
    } catch {
      error('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportBackup = () => {
    try {
      const rawData = exportDatabaseJSON();
      const blob = new Blob([rawData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-piscinas-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Backup completo exportado com sucesso!');
    } catch {
      error('Erro ao exportar backup.');
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const imported = importDatabaseJSON(content);
        if (imported) {
          setFormData(getCompanySettings());
          success('Backup importado com sucesso!');
        } else {
          error('Arquivo de backup inválido.');
        }
      } catch {
        error('Falha ao processar arquivo.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmClearZero = () => {
    clearAllDataToZero();
    setFormData(getCompanySettings());
    setIsClearZeroModalOpen(false);
    success('Todos os dados foram resetados! O sistema está limpo do zero.');
  };

  const handleConfirmLoadDemo = () => {
    loadDemoData();
    setFormData(getCompanySettings());
    setIsLoadDemoModalOpen(false);
    success('Base de demonstração carregada com sucesso!');
  };

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedVar(tag);
    setTimeout(() => setCopiedVar(null), 2000);
    success(`Variável ${tag} copiada!`);
  };

  return (
    <div className="space-y-5 pb-12 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-sky-600 shrink-0" />
            <span>Configurações & Preferências do Sistema</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie dados cadastrais, cobrança Pix, mensagens padrão, parâmetros químicos e segurança.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
        </button>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('empresa')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'empresa'
              ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Empresa & Cobrança</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('mensagens')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'mensagens'
              ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>WhatsApp & Comprovantes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('parametros')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'parametros'
              ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <FlaskConical className="w-4 h-4" />
          <span>Parâmetros Químicos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('aparencia')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'aparencia'
              ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Aparência & Marca</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 shadow-xs border border-slate-200/60 dark:border-slate-700/60'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Backup & Dados</span>
        </button>
      </div>

      {/* Tab 1: Empresa & Cobrança */}
      {activeTab === 'empresa' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* Main Settings Form */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Dados Cadastrais da Empresa (Impressos nos Documentos)</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Estes dados aparecem no cabeçalho e rodapé dos comprovantes, propostas e orçamentos.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  Nome Comercial da Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VENÂNCIO PISCINAS"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  Slogan / Subtítulo
                </label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="Limpeza e Manutenção"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  CNPJ / CPF do Prestador
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="48.123.456/0001-90"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  Telefone / WhatsApp Comercial
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 98765-4321"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  E-mail Oficial
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contato@venanciopiscinas.com.br"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                  Cidade e Região de Atendimento
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  placeholder="São Paulo - SP e Grande ABC"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Pix and Bank Details */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-1">
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>Dados de Cobrança & Chave Pix</span>
              </h3>
              <p className="text-slate-400 text-[11px] mb-3">
                Informações financeiras exibidas aos clientes no momento do pagamento e no comprovante.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                    Chave Pix Principal
                  </label>
                  <input
                    type="text"
                    value={formData.pix_key}
                    onChange={e => setFormData({ ...formData, pix_key: e.target.value })}
                    placeholder="pix@venanciopiscinas.com.br ou (11) 98765-4321"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                    Instituição Financeira / Banco
                  </label>
                  <input
                    type="text"
                    value={formData.bank_name || ''}
                    onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="Banco Inter / Nubank / Itaú"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                    Agência / Conta
                  </label>
                  <input
                    type="text"
                    value={formData.bank_account || ''}
                    onChange={e => setFormData({ ...formData, bank_account: e.target.value })}
                    placeholder="Ag: 0001 • CC: 123456-7"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Identity Card Preview */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-sky-600 via-cyan-600 to-blue-700 rounded-2xl p-5 text-white shadow-md space-y-3">
              <div className="flex items-center gap-3">
                <CompanyLogo variant="icon" size={44} />
                <div>
                  <h4 className="font-extrabold text-base leading-tight">{formData.name || 'VENÂNCIO PISCINAS'}</h4>
                  <p className="text-xs text-sky-100 font-medium">{formData.subtitle || 'Limpeza e Manutenção'}</p>
                </div>
              </div>

              <div className="text-xs space-y-1.5 bg-white/10 backdrop-blur-xs p-3.5 rounded-xl text-sky-100">
                <p className="truncate">📍 {formData.address || 'São Paulo - SP'}</p>
                <p className="truncate">📞 {formData.phone || '(11) 98765-4321'}</p>
                <p className="truncate font-mono">🔑 Pix: {formData.pix_key || 'contato@venanciopiscinas.com.br'}</p>
              </div>

              <div className="text-[11px] text-sky-100/90 pt-1 border-t border-white/10 flex items-center justify-between">
                <span>Status de Emissão:</span>
                <span className="font-bold text-white bg-emerald-500/30 px-2 py-0.5 rounded text-[10px]">
                  ✓ Ativo e Válido
                </span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Onde estes dados são aplicados:</span>
              </h4>
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Comprovantes de serviço em PDF e impressão</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Mensagens de cobrança rápida no WhatsApp</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Cabeçalho do painel e relatórios gerenciais</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: WhatsApp & Mensagens */}
      {activeTab === 'mensagens' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Modelo de Mensagem Padrão do WhatsApp</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Esta mensagem é enviada ao cliente com 1 clique ao emitir o comprovante de serviço.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1.5">
                Texto da Mensagem
              </label>
              <textarea
                rows={6}
                value={whatsappTemplate}
                onChange={e => setWhatsappTemplate(e.target.value)}
                placeholder="Escreva o texto padrão de envio..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-sky-500 font-sans"
              />
            </div>

            {/* Tags Available */}
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Clique para copiar as tags dinâmicas:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { tag: '{cliente}', label: 'Nome do Cliente' },
                  { tag: '{empresa}', label: 'Nome da Empresa' },
                  { tag: '{servico}', label: 'Tipo de Serviço' },
                  { tag: '{valor}', label: 'Valor Final' },
                  { tag: '{pix}', label: 'Chave Pix' },
                  { tag: '{data}', label: 'Data do Serviço' },
                ].map(item => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => handleCopyTag(item.tag)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-slate-700 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 rounded-lg text-[11px] font-mono transition border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <span>{item.tag}</span>
                    {copiedVar === item.tag ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3 opacity-60" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Receipt Footer Note */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs mb-1">
                Mensagem Fixa no Rodapé do Comprovante (Impressão/PDF)
              </label>
              <input
                type="text"
                value={formData.receipt_message || ''}
                onChange={e => setFormData({ ...formData, receipt_message: e.target.value })}
                placeholder="Agradecemos pela preferência! Manutenção periódica garante água saudável e cristalina."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Right Side: Live WhatsApp Message Simulator */}
          <div className="bg-emerald-950/20 dark:bg-emerald-950/30 border border-emerald-500/20 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <MessageSquare className="w-4 h-4" />
              <span>Simulação no WhatsApp do Cliente</span>
            </div>

            <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner text-xs space-y-2 whitespace-pre-wrap font-sans text-slate-800 dark:text-slate-200">
              {whatsappTemplate
                .replace('{cliente}', 'Carlos Silva')
                .replace('{empresa}', formData.name || 'VENÂNCIO PISCINAS')
                .replace('{servico}', 'Limpeza Completa & Aspiração')
                .replace('{valor}', 'R$ 220,00')
                .replace('{pix}', formData.pix_key || '11987654321')
                .replace('{data}', new Date().toLocaleDateString('pt-BR'))}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              💡 As informações reais de cada atendimento serão substituídas automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* Tab 3: Parâmetros Químicos */}
      {activeTab === 'parametros' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Droplets className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Faixas Técnicas de Parâmetros da Água</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Valores ideais de referência utilizados nos relatórios de análise química e diagnóstico.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Potencial Hidrogeniônico (pH Ideal)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Mínimo</label>
                    <input
                      type="text"
                      value={chemParams.phMin}
                      onChange={e => setChemParams({ ...chemParams, phMin: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Máximo</label>
                    <input
                      type="text"
                      value={chemParams.phMax}
                      onChange={e => setChemParams({ ...chemParams, phMax: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Cloro Livre (ppm)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Mínimo (ppm)</label>
                    <input
                      type="text"
                      value={chemParams.cloroMin}
                      onChange={e => setChemParams({ ...chemParams, cloroMin: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Máximo (ppm)</label>
                    <input
                      type="text"
                      value={chemParams.cloroMax}
                      onChange={e => setChemParams({ ...chemParams, cloroMax: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Alcalinidade Total (ppm)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Mínimo (ppm)</label>
                    <input
                      type="text"
                      value={chemParams.alcalinidadeMin}
                      onChange={e => setChemParams({ ...chemParams, alcalinidadeMin: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Máximo (ppm)</label>
                    <input
                      type="text"
                      value={chemParams.alcalinidadeMax}
                      onChange={e => setChemParams({ ...chemParams, alcalinidadeMax: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Ácido Cianúrico (Estabilizador)
                </span>
                <div>
                  <label className="text-[10px] text-slate-500">Limite Máximo Recomendado (ppm)</label>
                  <input
                    type="text"
                    value={chemParams.acidoCianuricoMax}
                    onChange={e => setChemParams({ ...chemParams, acidoCianuricoMax: e.target.value })}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Fast Guide Box */}
          <div className="bg-sky-950/20 dark:bg-sky-950/40 border border-sky-500/20 rounded-2xl p-5 shadow-xs space-y-3 text-xs">
            <h4 className="font-bold text-sky-700 dark:text-sky-400 flex items-center gap-2">
              <FlaskConical className="w-4 h-4" />
              <span>Guia Rápido de Dosagem</span>
            </h4>
            <div className="space-y-2.5 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              <div className="p-2.5 bg-white/60 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sky-600 block">Cloro Granulado:</span>
                <span>4g a cada 1.000 Litros de água para elevar ~2.5 ppm.</span>
              </div>
              <div className="p-2.5 bg-white/60 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sky-600 block">Barrilha Leve (Elevar pH):</span>
                <span>10g a cada 1.000 Litros quando o pH estiver abaixo de 7.0.</span>
              </div>
              <div className="p-2.5 bg-white/60 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
                <span className="font-bold text-sky-600 block">Bicarbonato de Sódio:</span>
                <span>17g a cada 1.000 Litros para elevar 10 ppm de alcalinidade.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Aparência & Marca */}
      {activeTab === 'aparencia' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Theme Selection Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Tema & Interface Visual</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {theme === 'dark' ? 'Modo Escuro' : 'Modo Claro'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalize a experiência de uso de acordo com sua preferência de iluminação:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setTheme('light');
                  success('Tema Claro ativado!');
                }}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition cursor-pointer ${
                  theme === 'light'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </div>
                  {theme === 'light' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Tema Claro</p>
                  <p className="text-[10px] text-slate-500">Visual diurno limpo de alto contraste</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTheme('dark');
                  success('Tema Escuro ativado!');
                }}
                className={`p-3.5 rounded-xl border text-left flex flex-col gap-2 transition cursor-pointer ${
                  theme === 'dark'
                    ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 ring-2 ring-sky-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-indigo-900/60 text-indigo-300 flex items-center justify-center">
                    <Moon className="w-4 h-4" />
                  </div>
                  {theme === 'dark' && <CheckCircle2 className="w-4 h-4 text-sky-600" />}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Tema Escuro</p>
                  <p className="text-[10px] text-slate-500">Conforto noturno com redução de brilho</p>
                </div>
              </button>
            </div>
          </div>

          {/* Official Logo Showcase Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                <ImageIcon className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Logotipo Oficial da Marca</span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                Oficial Padronizado
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center text-center gap-2">
                <div className="py-1 px-2 max-w-full overflow-hidden flex justify-center">
                  <CompanyLogo variant="horizontal" size="sm" />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Formato Horizontal Principal (Documentos & Cabeçalhos)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center text-center gap-2">
                  <CompanyLogo variant="icon" size={38} />
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                    Símbolo / Ícone
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center text-center gap-2">
                  <CompanyLogo variant="badge" size={38} />
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                    Emblema Oficial
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Backup & Dados */}
      {activeTab === 'backup' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          {/* Backup Management */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <Shield className="w-4 h-4 text-sky-600" />
              <span>Exportar & Restaurar Base de Dados</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Todos os cadastros de clientes, piscinas, serviços, agendamentos e faturamento podem ser exportados em formato JSON seguro.
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Cópia de Backup Completo (JSON)</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Restaurar / Importar Arquivo de Backup</span>
              </button>
            </div>
          </div>

          {/* Database Reset & Demo Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
              <RotateCcw className="w-4 h-4 text-amber-500" />
              <span>Manutenção & Ações do Sistema</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Opções para reiniciar seu banco de dados ou carregar registros de demonstração.
            </p>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearZeroModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900/50 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Zerar Todos os Dados (Começar do Zero)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsLoadDemoModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Carregar Base de Demonstração Completa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Clear Zero Modal */}
      <ConfirmModal
        isOpen={isClearZeroModalOpen}
        title="Zerar Sistema e Começar do Zero"
        message="Tem certeza que deseja apagar todos os registros de clientes, piscinas, serviços, agendamentos, financeiro e histórico? O sistema ficará totalmente limpo para você cadastrar suas próprias informações do zero."
        confirmText="Sim, Zerar Tudo (Começar do 0)"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmClearZero}
        onClose={() => setIsClearZeroModalOpen(false)}
      />

      {/* Confirm Load Demo Modal */}
      <ConfirmModal
        isOpen={isLoadDemoModalOpen}
        title="Carregar Dados de Demonstração"
        message="Deseja carregar a base de exemplo com clientes, rotas e agendamentos fictícios para demonstração?"
        confirmText="Carregar Dados de Exemplo"
        cancelText="Cancelar"
        variant="info"
        onConfirm={handleConfirmLoadDemo}
        onClose={() => setIsLoadDemoModalOpen(false)}
      />
    </div>
  );
};

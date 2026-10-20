import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Waves,
  Calendar,
  Check,
  AlertCircle,
  Mail,
  Search,
  DollarSign,
  Clock,
  FileText,
  ShieldCheck,
  Info,
  Image as ImageIcon,
} from 'lucide-react';
import { Client, Pool, PoolType, ClientStatus } from '../../types';
import {
  createClient,
  updateClient,
  createPool,
  getPoolsByClientId,
  updatePool,
  markClientAsPaid,
  notifyDatabaseChanged,
  triggerServerSync,
} from '../../database/storage';
import { formatCep, formatPhone, formatCpfCnpj } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  POOL_PRESET_IMAGES,
  getDefaultPoolImageByType,
  getPoolImage,
} from '../../utils/poolImages';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: Client | null;
  onClientSaved?: (client: Client) => void;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  clientToEdit,
  onClientSaved,
}) => {
  const { success, error } = useToast();

  // Tab navigation inside modal for cleaner UX
  const [activeTab, setActiveTab] = useState<'dados' | 'endereco' | 'piscina' | 'atendimento'>('dados');

  // Dados Pessoais
  const [name, setName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isPaidNoDueDate, setIsPaidNoDueDate] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<ClientStatus>('Ativo');

  // Endereço
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [state, setState] = useState('SP');

  // Informações da Piscina
  const [poolId, setPoolId] = useState<string | null>(null);
  const [poolName, setPoolName] = useState('Piscina Principal');
  const [poolType, setPoolType] = useState<PoolType>('Fibra');
  const [poolSize, setPoolSize] = useState('8x4x1.4m');
  const [poolVolume, setPoolVolume] = useState<string>('35000');
  const [poolPhotoUrl, setPoolPhotoUrl] = useState<string>(getDefaultPoolImageByType('Fibra'));
  const [poolLocation, setPoolLocation] = useState('Quintal / Área Externa');
  const [poolNotes, setPoolNotes] = useState('');

  // Informações do Atendimento & Contrato
  const [frequency, setFrequency] = useState<string>('Semanal');
  const [preferredDay, setPreferredDay] = useState<string>('Segunda-feira');
  const [preferredTime, setPreferredTime] = useState<string>('Manhã (08:00 - 12:00)');
  const [visitDays, setVisitDays] = useState<string[]>(['Segunda']);
  const [monthlyVisitDays, setMonthlyVisitDays] = useState<number[]>([1]);
  const [defaultPrice, setDefaultPrice] = useState<string>('180');
  const [notes, setNotes] = useState('');

  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name || '');
      setCpfCnpj(clientToEdit.cpf_cnpj || '');
      setPhone(clientToEdit.phone || '');
      setDueDate(clientToEdit.due_date || '');
      setIsPaidNoDueDate(!clientToEdit.due_date);
      setEmail(clientToEdit.email || '');
      setStatus(clientToEdit.status || 'Ativo');

      setZipCode(clientToEdit.zip_code || '');
      setStreet(clientToEdit.street || '');
      setNumber(clientToEdit.number || '');
      setComplement(clientToEdit.complement || '');
      setNeighborhood(clientToEdit.neighborhood || '');
      setCity(clientToEdit.city || 'São Paulo');
      setState(clientToEdit.state || 'SP');

      setFrequency(clientToEdit.service_frequency || 'Semanal');
      setPreferredDay(clientToEdit.preferred_day || 'Segunda-feira');
      setPreferredTime(clientToEdit.preferred_time || 'Manhã (08:00 - 12:00)');
      setVisitDays(
        Array.isArray(clientToEdit.visit_days) && clientToEdit.visit_days.length > 0
          ? clientToEdit.visit_days
          : clientToEdit.preferred_day
          ? [clientToEdit.preferred_day.replace('-feira', '')]
          : ['Segunda']
      );
      setMonthlyVisitDays(
        Array.isArray(clientToEdit.monthly_visit_days) && clientToEdit.monthly_visit_days.length > 0
          ? clientToEdit.monthly_visit_days
          : [1]
      );
      setDefaultPrice(
        clientToEdit.default_service_price !== undefined
          ? String(clientToEdit.default_service_price)
          : '180'
      );
      setNotes(clientToEdit.notes || '');

      // Load associated pool if exists
      const existingPools = getPoolsByClientId(clientToEdit.id);
      if (existingPools.length > 0) {
        const p = existingPools[0];
        setPoolId(p.id);
        setPoolName(p.name || 'Piscina Principal');
        setPoolType(p.type || 'Fibra');
        setPoolSize(p.size || '8x4x1.4m');
        setPoolVolume(p.volume ? String(p.volume) : '35000');
        setPoolPhotoUrl(getPoolImage(p));
        setPoolLocation(p.address || 'Quintal / Área Externa');
        setPoolNotes(p.notes || '');
      } else {
        setPoolId(null);
        setPoolName('Piscina Principal');
        setPoolType('Fibra');
        setPoolSize('8x4x1.4m');
        setPoolVolume('35000');
        setPoolPhotoUrl(getDefaultPoolImageByType('Fibra'));
        setPoolLocation('Quintal / Área Externa');
        setPoolNotes('');
      }
    } else {
      // Reset form
      setName('');
      setCpfCnpj('');
      setPhone('');
      setDueDate('');
      setIsPaidNoDueDate(false);
      setEmail('');
      setStatus('Ativo');

      setZipCode('');
      setStreet('');
      setNumber('');
      setComplement('');
      setNeighborhood('');
      setCity('São Paulo');
      setState('SP');

      setPoolId(null);
      setPoolName('Piscina Principal');
      setPoolType('Fibra');
      setPoolSize('8x4x1.4m');
      setPoolVolume('35000');
      setPoolPhotoUrl(getDefaultPoolImageByType('Fibra'));
      setPoolLocation('Quintal / Área Externa');
      setPoolNotes('');

      setFrequency('Semanal');
      setPreferredDay('Segunda-feira');
      setPreferredTime('Manhã (08:00 - 12:00)');
      setVisitDays(['Segunda']);
      setMonthlyVisitDays([1]);
      setDefaultPrice('180');
      setNotes('');
      setActiveTab('dados');
    }
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  // Auto-fill address via ViaCEP API
  const handleFetchCep = async (cepToLookup?: string) => {
    const raw = (cepToLookup || zipCode).replace(/\D/g, '');
    if (raw.length !== 8) {
      error('Informe um CEP válido com 8 dígitos.');
      return;
    }

    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${raw}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setStreet(data.logradouro || '');
        setNeighborhood(data.bairro || '');
        setCity(data.localidade || '');
        setState(data.uf || '');
        success('Endereço preenchido automaticamente!');
      } else {
        error('CEP não localizado no ViaCEP.');
      }
    } catch {
      error('Não foi possível consultar o CEP. Preencha manualmente.');
    } finally {
      setIsLoadingCep(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!name.trim()) {
      error('Por favor, informe o Nome Completo do cliente.');
      setActiveTab('dados');
      return;
    }

    const volumeNumber = parseFloat(poolVolume.replace(/\D/g, '')) || 35000;
    const priceNumber = parseFloat(defaultPrice.replace(',', '.')) || 0;

    setIsSubmitting(true);

    try {
      const cleanPhone = phone.trim();

      let savedClient: Client;

      if (clientToEdit) {
        // Update client
        const updated = updateClient(clientToEdit.id, {
          name: name.trim(),
          cpf_cnpj: cpfCnpj.trim(),
          phone: cleanPhone,
          whatsapp: '',
          due_date: isPaidNoDueDate ? '' : dueDate.trim(),
          email: email.trim(),
          status,
          zip_code: zipCode.trim(),
          street: street.trim(),
          number: number.trim(),
          complement: complement.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          service_frequency: frequency,
          preferred_day: preferredDay,
          preferred_time: preferredTime,
          visit_days: visitDays,
          monthly_visit_days: monthlyVisitDays,
          default_service_price: priceNumber,
          notes: notes.trim(),
        });

        if (!updated) throw new Error('Cliente não encontrado para atualização');
        savedClient = updated;

        // Update or create pool
        const resolvedPhotoUrl =
          poolPhotoUrl.trim() || getDefaultPoolImageByType(poolType, poolName);
        if (poolId) {
          updatePool(poolId, {
            name: poolName.trim() || `Piscina de ${poolType}`,
            type: poolType,
            size: poolSize.trim() || '8x4x1.4m',
            volume: volumeNumber,
            photo_url: resolvedPhotoUrl,
            address: poolLocation.trim() || `${street}, ${number} - ${neighborhood}`,
            notes: poolNotes.trim() || `Frequência de Limpeza: ${frequency}`,
          });
        } else {
          createPool({
            client_id: savedClient.id,
            name: poolName.trim() || `Piscina Principal (${poolType})`,
            type: poolType,
            size: poolSize.trim() || '8x4x1.4m',
            volume: volumeNumber,
            photo_url: resolvedPhotoUrl,
            address: poolLocation.trim() || `${street}, ${number} - ${neighborhood}`,
            notes: poolNotes.trim() || `Frequência de Limpeza: ${frequency}`,
          });
        }

        success(`Cliente "${savedClient.name}" atualizado com sucesso!`);
      } else {
        // Create new client
        savedClient = createClient({
          name: name.trim(),
          cpf_cnpj: cpfCnpj.trim(),
          phone: cleanPhone,
          whatsapp: '',
          due_date: isPaidNoDueDate ? '' : dueDate.trim(),
          email: email.trim(),
          status,
          zip_code: zipCode.trim(),
          street: street.trim(),
          number: number.trim(),
          neighborhood: neighborhood.trim(),
          city: city.trim() || 'São Paulo',
          state: state.trim().toUpperCase() || 'SP',
          complement: complement.trim(),
          service_frequency: frequency,
          preferred_day: preferredDay,
          preferred_time: preferredTime,
          visit_days: visitDays,
          monthly_visit_days: monthlyVisitDays,
          default_service_price: priceNumber,
          notes: notes.trim(),
        });

        // Automatically create associated Pool
        createPool({
          client_id: savedClient.id,
          name: poolName.trim() || `Piscina Principal (${poolType})`,
          type: poolType,
          size: poolSize.trim() || '8x4x1.4m',
          volume: volumeNumber,
          photo_url: poolPhotoUrl.trim() || getDefaultPoolImageByType(poolType, poolName),
          address: poolLocation.trim() || `${street.trim()}, ${number.trim()} - ${neighborhood.trim()}`,
          notes: poolNotes.trim() || `Frequência: ${frequency}. Dia preferencial: ${preferredDay}`,
        });

        success(`Cliente "${savedClient.name}" cadastrado com sucesso!`);
      }

      if (isPaidNoDueDate) {
        markClientAsPaid(savedClient.id);
      }

      notifyDatabaseChanged();
      triggerServerSync();

      if (onClientSaved) {
        onClientSaved(savedClient);
      }
      onClose();
    } catch (err) {
      error('Ocorreu um erro ao salvar o cliente. Verifique os dados e tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="modal-client-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        id="modal-client-content"
        className="relative w-full max-w-3xl bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-800 my-6 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 bg-slate-950 border-b border-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight text-white">
                {clientToEdit ? 'Editar Cliente' : 'Novo Cliente'}
              </h3>
              <p className="text-xs text-slate-400">
                {clientToEdit
                  ? `Atualizar cadastro e piscina de ${clientToEdit.name}`
                  : 'Cadastrar novo cliente, localização, piscina e contrato'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-client-modal"
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="px-5 sm:px-6 pt-3 pb-2 bg-slate-900/90 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('dados')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'dados'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>1. Dados Pessoais</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('endereco')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'endereco'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>2. Endereço</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('piscina')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'piscina'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>3. Piscina</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('atendimento')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'atendimento'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>4. Atendimento & Contrato</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} noValidate className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: DADOS PESSOAIS */}
          {activeTab === 'dados' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Identificação & Contatos</span>
                </h4>

                {/* Status Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-semibold">Status:</span>
                  <button
                    type="button"
                    onClick={() => setStatus(status === 'Ativo' ? 'Inativo' : 'Ativo')}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold transition cursor-pointer border ${
                      status === 'Ativo'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    ● {status}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    id="client-form-name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silveira"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone Principal
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="client-form-phone"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      placeholder="(11) 98765-4321"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    id="client-form-cpf"
                    type="text"
                    value={cpfCnpj}
                    onChange={e => setCpfCnpj(formatCpfCnpj(e.target.value))}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id="client-form-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="cliente@email.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!name.trim()) {
                      error('Por favor, informe o Nome Completo do cliente.');
                      return;
                    }
                    setActiveTab('endereco');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Próximo: Endereço →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: ENDEREÇO */}
          {activeTab === 'endereco' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Localização do Imóvel / Piscina</span>
                </h4>

                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    maxLength={9}
                    value={zipCode}
                    onChange={e => {
                      const formatted = formatCep(e.target.value);
                      setZipCode(formatted);
                      if (formatted.replace(/\D/g, '').length === 8) {
                        handleFetchCep(formatted);
                      }
                    }}
                    placeholder="CEP: 00000-000"
                    className="w-32 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleFetchCep()}
                    disabled={isLoadingCep}
                    className="px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 hover:bg-sky-500/25 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                    title="Buscar CEP no ViaCEP"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>{isLoadingCep ? 'Buscando...' : 'Buscar CEP'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Rua / Logradouro
                  </label>
                  <input
                    id="client-form-street"
                    type="text"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder="Ex: Rua das Acácias"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Número
                  </label>
                  <input
                    id="client-form-number"
                    type="text"
                    value={number}
                    onChange={e => setNumber(e.target.value)}
                    placeholder="340 ou S/N"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Complemento
                  </label>
                  <input
                    id="client-form-complement"
                    type="text"
                    value={complement}
                    onChange={e => setComplement(e.target.value)}
                    placeholder="Ex: Casa 02 / Cobertura"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bairro
                  </label>
                  <input
                    id="client-form-neighborhood"
                    type="text"
                    value={neighborhood}
                    onChange={e => setNeighborhood(e.target.value)}
                    placeholder="Ex: Jardim Europa"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Cidade / UF
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="client-form-city"
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="São Paulo"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                    <input
                      id="client-form-state"
                      type="text"
                      maxLength={2}
                      value={state}
                      onChange={e => setState(e.target.value.toUpperCase())}
                      placeholder="SP"
                      className="w-14 px-2 py-2.5 text-center bg-slate-800 border border-slate-700 rounded-xl text-sm font-bold text-sky-400 focus:ring-2 focus:ring-sky-500 focus:outline-none uppercase"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('dados')}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  ← Voltar: Dados
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('piscina')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Próximo: Piscina →
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: INFORMAÇÕES DA PISCINA */}
          {activeTab === 'piscina' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5" />
                <span>Especificações Técnicas da Piscina</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Identificação / Nome da Piscina
                  </label>
                  <input
                    type="text"
                    value={poolName}
                    onChange={e => setPoolName(e.target.value)}
                    placeholder="Ex: Piscina Principal / Piscina Adulto"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo de Estrutura *
                  </label>
                  <select
                    id="client-form-pooltype"
                    value={poolType}
                    onChange={e => {
                      const newType = e.target.value as PoolType;
                      setPoolType(newType);
                      const isPresetOrEmpty =
                        !poolPhotoUrl ||
                        POOL_PRESET_IMAGES.some(preset => preset.url === poolPhotoUrl);
                      if (isPresetOrEmpty) {
                        setPoolPhotoUrl(getDefaultPoolImageByType(newType, poolName));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Fibra">Fibra de Vidro</option>
                    <option value="Vinil">Vinil</option>
                    <option value="Alvenaria">Alvenaria Pintada</option>
                    <option value="Azulejo">Azulejo / Pastilha</option>
                    <option value="Outro">Outro Tipo</option>
                  </select>
                </div>

                {/* GALERIA VISUAL DE IMAGENS SEMELHANTES DE PISCINAS */}
                <div className="sm:col-span-3 p-3.5 bg-slate-800/70 border border-slate-700/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      <span>Imagens Semelhantes de Piscinas</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Selecione uma imagem semelhante ao modelo da piscina
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {POOL_PRESET_IMAGES.map(preset => {
                      const isSelected = poolPhotoUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setPoolPhotoUrl(preset.url);
                            setPoolType(preset.type);
                          }}
                          className={`group relative rounded-xl overflow-hidden border-2 text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-sky-400 ring-2 ring-sky-500/30 shadow-md shadow-sky-500/10'
                              : 'border-slate-700 opacity-80 hover:opacity-100 hover:border-sky-500/50'
                          }`}
                        >
                          <div className="h-20 w-full overflow-hidden bg-slate-950">
                            <img
                              src={preset.url}
                              alt={preset.label}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                            />
                          </div>
                          <div className="p-2 bg-slate-900">
                            <p className="text-[11px] font-bold text-white truncate">
                              {preset.type}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {preset.label}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dimensões Aproximadas (C x L x P)
                  </label>
                  <input
                    type="text"
                    value={poolSize}
                    onChange={e => setPoolSize(e.target.value)}
                    placeholder="Ex: 8 x 4 x 1.4m"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Volume em Litros *
                  </label>
                  <div className="relative">
                    <input
                      id="client-form-volume"
                      type="number"
                      min="1000"
                      step="500"
                      required
                      value={poolVolume}
                      onChange={e => setPoolVolume(e.target.value)}
                      placeholder="35000"
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none pr-12 font-mono"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-sky-400">
                      Litros
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Localização no Imóvel
                  </label>
                  <input
                    type="text"
                    value={poolLocation}
                    onChange={e => setPoolLocation(e.target.value)}
                    placeholder="Ex: Quintal, Cobertura, Área Gourmet"
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Observações Técnicas da Piscina (Equipamentos, Casa de Máquinas, Tratamento)
                  </label>
                  <textarea
                    rows={2}
                    value={poolNotes}
                    onChange={e => setPoolNotes(e.target.value)}
                    placeholder="Ex: Bomba Dancor 1/2 CV, aquecimento solar, ozônio, filtro de areia trocado recentemente..."
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('endereco')}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  ← Voltar: Endereço
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('atendimento')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Próximo: Atendimento & Contrato →
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: ATENDIMENTO & CONTRATO */}
          {activeTab === 'atendimento' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Rotina de Atendimento & Valores</span>
              </h4>

              {/* Dias de Visita da Semana (Segunda a Sábado) */}
              <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-sky-400 uppercase tracking-wider">
                      Dias que vai visitar (Segunda a Sábado)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Selecione em quais dias da semana este cliente deve entrar no roteiro de atendimento
                    </p>
                  </div>

                  {/* Atalhos Rápidos */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setVisitDays(['Segunda', 'Quinta'])}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-700 hover:bg-slate-600 text-sky-300 transition cursor-pointer"
                    >
                      Seg + Qui
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitDays(['Terça', 'Sexta'])}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-700 hover:bg-slate-600 text-sky-300 transition cursor-pointer"
                    >
                      Ter + Sex
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitDays(['Segunda', 'Quarta', 'Sexta'])}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-700 hover:bg-slate-600 text-sky-300 transition cursor-pointer"
                    >
                      Seg + Qua + Sex
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitDays(['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'])}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-700 hover:bg-slate-600 text-sky-300 transition cursor-pointer"
                    >
                      Seg a Sex
                    </button>
                  </div>
                </div>

                {/* Day Pills: Segunda a Sábado */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { key: 'Segunda', label: 'Segunda-feira', short: 'SEG' },
                    { key: 'Terça', label: 'Terça-feira', short: 'TER' },
                    { key: 'Quarta', label: 'Quarta-feira', short: 'QUA' },
                    { key: 'Quinta', label: 'Quinta-feira', short: 'QUI' },
                    { key: 'Sexta', label: 'Sexta-feira', short: 'SEX' },
                    { key: 'Sábado', label: 'Sábado', short: 'SÁB' },
                  ].map(day => {
                    const isSelected = visitDays.includes(day.key);
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (visitDays.length > 1) {
                              setVisitDays(visitDays.filter(d => d !== day.key));
                            }
                          } else {
                            setVisitDays([...visitDays, day.key]);
                          }
                          if (!isSelected && visitDays.length === 0) {
                            setPreferredDay(`${day.key}-feira`);
                          }
                        }}
                        className={`py-2.5 px-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center border cursor-pointer ${
                          isSelected
                            ? 'bg-sky-500 text-white border-sky-400 shadow-md shadow-sky-500/20'
                            : 'bg-slate-900/90 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
                        }`}
                      >
                        <span className="text-sm font-black">{day.short}</span>
                        <span className="text-[10px] font-medium opacity-80">{day.key}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Dias da Visita Mensal (se mensal/quinzenal) */}
                <div className="pt-2.5 border-t border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-300">
                      Dia(s) da Visita Mensal (Data do Mês):
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Define os dias fixos do mês para gerar a escala mensal
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400">1º Dia:</span>
                      <select
                        value={monthlyVisitDays[0] || 1}
                        onChange={e => {
                          const val = parseInt(e.target.value, 10);
                          setMonthlyVisitDays([val, ...(monthlyVisitDays.slice(1))]);
                        }}
                        className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-sky-400 focus:outline-none"
                      >
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                          <option key={d} value={d}>
                            Dia {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    {(frequency === 'Quinzenal' || frequency === '2x por semana') && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-400">2º Dia:</span>
                        <select
                          value={monthlyVisitDays[1] || 15}
                          onChange={e => {
                            const val = parseInt(e.target.value, 10);
                            setMonthlyVisitDays([monthlyVisitDays[0] || 1, val]);
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-sky-400 focus:outline-none"
                        >
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                            <option key={d} value={d}>
                              Dia {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Frequência do Serviço *
                  </label>
                  <select
                    id="client-form-frequency"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Semanal">Semanal (Mais comum)</option>
                    <option value="Quinzenal">Quinzenal</option>
                    <option value="2x por semana">2x por semana (Condomínios/Clubes)</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Avulso">Avulso / Sob Demanda</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Dia Preferencial
                  </label>
                  <select
                    value={preferredDay}
                    onChange={e => setPreferredDay(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Segunda-feira">Segunda-feira</option>
                    <option value="Terça-feira">Terça-feira</option>
                    <option value="Quarta-feira">Quarta-feira</option>
                    <option value="Quinta-feira">Quinta-feira</option>
                    <option value="Sexta-feira">Sexta-feira</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Terça e Sexta">Terça e Sexta</option>
                    <option value="Segunda e Quinta">Segunda e Quinta</option>
                    <option value="A combinar">A combinar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Horário Preferencial
                  </label>
                  <select
                    value={preferredTime}
                    onChange={e => setPreferredTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Manhã (08:00 - 12:00)">Manhã (08:00 - 12:00)</option>
                    <option value="Tarde (13:00 - 17:00)">Tarde (13:00 - 17:00)</option>
                    <option value="Primeiro horário (08:00)">Primeiro horário (08:00)</option>
                    <option value="Qualquer horário">Qualquer horário</option>
                  </select>
                </div>

                {/* CAMPO NA 4ª ABA: DATA DE VENCIMENTO OU PAGO (SEM VENCIMENTO) */}
                <div className="sm:col-span-3 p-3.5 bg-sky-500/10 border border-sky-500/30 rounded-2xl space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label
                      htmlFor="client-form-due-date"
                      className="text-xs font-extrabold text-sky-300 uppercase tracking-wider flex items-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4 text-sky-400" />
                      <span>Data de Vencimento {isPaidNoDueDate ? '(Pago / Sem vencimento)' : '* (Obrigatório)'}</span>
                    </label>

                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-slate-400 mr-1">Atalhos:</span>
                      {[5, 10, 15, 20, 25].map(dayNum => (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            let year = now.getFullYear();
                            let month = now.getMonth() + 1;
                            if (now.getDate() > dayNum) {
                              month += 1;
                              if (month > 12) {
                                month = 1;
                                year += 1;
                              }
                            }
                            const formatted = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                            setDueDate(formatted);
                            setIsPaidNoDueDate(false);
                          }}
                          className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-slate-800 hover:bg-sky-500 hover:text-white text-sky-300 border border-sky-500/30 transition cursor-pointer"
                        >
                          Dia {String(dayNum).padStart(2, '0')}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date();
                          d.setDate(d.getDate() + 30);
                          setDueDate(d.toISOString().split('T')[0]);
                          setIsPaidNoDueDate(false);
                        }}
                        className="px-2 py-0.5 text-[10px] font-bold rounded-lg bg-sky-500/20 hover:bg-sky-500 hover:text-white text-sky-300 border border-sky-500/40 transition cursor-pointer"
                      >
                        +30 dias
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDueDate('');
                          setIsPaidNoDueDate(true);
                        }}
                        className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                          isPaidNoDueDate
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                            : 'bg-emerald-500/15 hover:bg-emerald-500 hover:text-white text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Pago (Sem vencimento)</span>
                      </button>
                    </div>
                  </div>

                  {isPaidNoDueDate ? (
                    <div className="flex items-center justify-between px-3.5 py-2.5 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300">
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Cliente Pago — Sem vencimento ativo na Gestão de Clientes</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsPaidNoDueDate(false)}
                        className="text-[11px] underline text-sky-300 hover:text-white cursor-pointer"
                      >
                        Definir nova data
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="client-form-due-date"
                        type="date"
                        required={!isPaidNoDueDate}
                        value={dueDate}
                        onChange={e => {
                          setDueDate(e.target.value);
                          if (e.target.value) setIsPaidNoDueDate(false);
                        }}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-900 border border-sky-500/40 rounded-xl text-sm font-bold text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none transition"
                      />
                    </div>
                  )}
                </div>

                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Padrão da Visita (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={defaultPrice}
                      onChange={e => setDefaultPrice(e.target.value)}
                      placeholder="180.00"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Observações Gerais & Instruções de Acesso
                  </label>
                  <textarea
                    id="client-form-notes"
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Ex: Chave com o porteiro, avisar 30min antes, portão lateral..."
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('piscina')}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  ← Voltar: Piscina
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <button
              id="btn-cancel-client-form"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              id="btn-save-client-form"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Cliente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

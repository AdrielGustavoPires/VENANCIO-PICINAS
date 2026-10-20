import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Wrench,
  DollarSign,
  User,
  Waves,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Tag,
  ShieldAlert,
  Percent,
  Star,
  MessageSquare,
  Camera,
  MapPin,
  Image as ImageIcon,
  Trash2,
  Navigation,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Client,
  Pool,
  ServiceItem,
  PaymentMethod,
  PaymentStatus,
  ServiceRecord,
} from '../../types';
import {
  getClients,
  getPoolsByClientId,
  getServices,
  getAppointmentById,
  createServiceRecord,
  createFeedback,
} from '../../database/storage';
import { formatCurrency } from '../../utils/formatters';
import { compressImage, getCurrentGeoLocation, GeoLocationData, formatClientFullAddress } from '../../utils/photoUtils';
import { useToast } from '../../context/ToastContext';

interface RecordServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefillAppointmentId?: string;
  prefillClientId?: string;
  prefillPoolId?: string;
  onServiceRecorded?: (record: ServiceRecord) => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Pix',
  'Dinheiro',
  'Crédito',
  'Débito',
  'Transferência',
  'Outro',
];

const PAYMENT_STATUSES: PaymentStatus[] = ['Pago', 'Pendente', 'Parcial'];

export const RecordServiceModal: React.FC<RecordServiceModalProps> = ({
  isOpen,
  onClose,
  prefillAppointmentId,
  prefillClientId,
  prefillPoolId,
  onServiceRecorded,
}) => {
  const { success, error } = useToast();

  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [clientPools, setClientPools] = useState<Pool[]>([]);

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [poolId, setPoolId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [serviceTime, setServiceTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [responsible, setResponsible] = useState('Venâncio Alves');
  const [description, setDescription] = useState('');
  const [productsUsed, setProductsUsed] = useState('Cloro granulado 65% (400g), Barrilha leve (200g), Clarificante');
  const [notes, setNotes] = useState('');

  // Mapeamento em Tempo Real, Check-in & Fotos (Antes / Depois)
  const [startPhoto, setStartPhoto] = useState<string>('');
  const [endPhoto, setEndPhoto] = useState<string>('');
  const [startTime, setStartTime] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - 45); // default approx 45min before
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [endTime, setEndTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [geoLocation, setGeoLocation] = useState<GeoLocationData | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [isProcessingStartPhoto, setIsProcessingStartPhoto] = useState(false);
  const [isProcessingEndPhoto, setIsProcessingEndPhoto] = useState(false);

  const startPhotoInputRef = useRef<HTMLInputElement>(null);
  const endPhotoInputRef = useRef<HTMLInputElement>(null);
  const [showMiniMap, setShowMiniMap] = useState(false);

  // Auto-fetch real-time GPS location on modal open with client address fallback
  useEffect(() => {
    if (isOpen) {
      setIsCapturingLocation(true);
      const selectedClient = clients.find(c => c.id === clientId);
      const addressFallback = formatClientFullAddress(selectedClient);

      getCurrentGeoLocation(addressFallback)
        .then(loc => {
          if (loc) {
            setGeoLocation(loc);
          }
        })
        .finally(() => setIsCapturingLocation(false));
    }
  }, [isOpen, clientId, clients]);

  const handleCaptureStartPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setIsProcessingStartPhoto(true);
      const compressed = await compressImage(files[0], 960, 960, 0.7);
      setStartPhoto(compressed);
      success('Foto de início capturada com sucesso!');
    } catch {
      error('Erro ao processar foto.');
    } finally {
      setIsProcessingStartPhoto(false);
    }
  };

  const handleCaptureEndPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setIsProcessingEndPhoto(true);
      const compressed = await compressImage(files[0], 960, 960, 0.7);
      setEndPhoto(compressed);
      success('Foto de conclusão capturada com sucesso!');
    } catch {
      error('Erro ao processar foto.');
    } finally {
      setIsProcessingEndPhoto(false);
    }
  };

  const handleRefreshLocation = async () => {
    setIsCapturingLocation(true);
    try {
      const selectedClient = clients.find(c => c.id === clientId);
      const addressFallback = formatClientFullAddress(selectedClient);

      const loc = await getCurrentGeoLocation(addressFallback);
      if (loc) {
        setGeoLocation(loc);
        success('Localização em tempo real sincronizada!');
      } else {
        error('Não foi possível obter a localização GPS.');
      }
    } finally {
      setIsCapturingLocation(false);
    }
  };

  // Values & Calculation
  const [price, setPrice] = useState<number>(180);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Pix');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Pago');
  const [amountPaid, setAmountPaid] = useState<number>(180);

  // Post-service customer feedback capture
  const [collectFeedback, setCollectFeedback] = useState<boolean>(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackNps, setFeedbackNps] = useState<number>(10);
  const [feedbackComment, setFeedbackComment] = useState<string>('');

  // Automatic final price computation
  const finalPrice = Math.max(0, (Number(price) || 0) - (Number(discount) || 0));

  useEffect(() => {
    if (!isOpen) return;

    const allClients = getClients();
    const allServices = getServices();
    setClients(allClients);
    setServices(allServices);

    if (prefillAppointmentId) {
      const app = getAppointmentById(prefillAppointmentId);
      if (app) {
        setClientId(app.client_id);
        const pools = getPoolsByClientId(app.client_id);
        setClientPools(pools);
        setPoolId(app.pool_id || pools[0]?.id || '');
        setServiceId(app.service_id);
        setServiceDate(app.date);
        setServiceTime(app.time);
        const s = allServices.find(srv => srv.id === app.service_id);
        if (s) {
          setPrice(s.default_price);
          setDescription(s.description);
          setAmountPaid(s.default_price);
        }
      }
    } else {
      // Determine client
      const initialClient = prefillClientId || (allClients[0]?.id || '');
      setClientId(initialClient);

      // Determine pools
      const pools = getPoolsByClientId(initialClient);
      setClientPools(pools);
      const chosenPool = prefillPoolId || (pools[0]?.id || '');
      setPoolId(chosenPool);

      // Determine service
      const initialService = allServices[0];
      if (initialService) {
        setServiceId(initialService.id);
        setPrice(initialService.default_price);
        setDescription(initialService.description);
        setAmountPaid(initialService.default_price);
      }
    }
  }, [isOpen, prefillAppointmentId, prefillClientId, prefillPoolId]);

  // When Client changes, refresh their pools
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    const pools = getPoolsByClientId(newClientId);
    setClientPools(pools);
    setPoolId(pools[0]?.id || '');
  };

  // When Service changes, prefill default price and description
  const handleServiceChange = (newServiceId: string) => {
    setServiceId(newServiceId);
    const s = services.find(srv => srv.id === newServiceId);
    if (s) {
      setPrice(s.default_price);
      setDescription(s.description);
      if (paymentStatus === 'Pago') {
        setAmountPaid(Math.max(0, s.default_price - discount));
      }
    }
  };

  // When Payment status changes
  const handleStatusChange = (newStatus: PaymentStatus) => {
    setPaymentStatus(newStatus);
    if (newStatus === 'Pago') {
      setAmountPaid(finalPrice);
    } else if (newStatus === 'Pendente') {
      setAmountPaid(0);
    } else if (newStatus === 'Parcial' && amountPaid === 0) {
      setAmountPaid(Math.round(finalPrice / 2));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientId) {
      error('Por favor, selecione um cliente.');
      return;
    }
    if (!poolId) {
      error('Por favor, selecione a piscina atendida.');
      return;
    }
    if (!serviceId) {
      error('Por favor, selecione o serviço realizado.');
      return;
    }

    try {
      const calculatedAmountPaid =
        paymentStatus === 'Pago'
          ? finalPrice
          : paymentStatus === 'Pendente'
          ? 0
          : Math.min(finalPrice, Number(amountPaid) || 0);

      const record = createServiceRecord({
        client_id: clientId,
        pool_id: poolId,
        service_id: serviceId,
        appointment_id: prefillAppointmentId,
        service_date: serviceDate,
        service_time: serviceTime,
        start_time: startTime,
        end_time: endTime,
        start_photo: startPhoto || undefined,
        end_photo: endPhoto || undefined,
        geo_location: geoLocation || undefined,
        responsible: responsible.trim() || 'Venâncio Alves',
        description: description.trim(),
        products_used: productsUsed.trim(),
        notes: notes.trim() || undefined,
        price: Number(price) || 0,
        discount: Number(discount) || 0,
        final_price: finalPrice,
        amount_paid: calculatedAmountPaid,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
      });

      // If user enabled feedback collection on the spot
      if (collectFeedback && feedbackRating > 0) {
        createFeedback({
          client_id: clientId,
          pool_id: poolId,
          service_record_id: record.id,
          rating: feedbackRating,
          nps_score: feedbackNps,
          comment: feedbackComment.trim() || 'Serviço avaliado no ato da conclusão.',
          tags: ['Água Cristalina & Pura', 'Atendimento Concluído'],
          date: serviceDate,
          source: 'in_person',
        });
      }

      // Launch cheerful confetti
      try {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#06b6d4', '#10b981', '#38bdf8'],
        });
      } catch {}

      success('Serviço registrado com sucesso! Comprovante gerado.');
      if (onServiceRecorded) {
        onServiceRecorded(record);
      }
      onClose();
    } catch {
      error('Não foi possível salvar o registro de serviço.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">Registrar Execução de Serviço</h3>
              <p className="text-xs text-sky-100">
                Gera o registro financeiro, baixa a agenda e emite o comprovante
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

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          {/* Section 1: Cliente e Piscina */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cliente Atendido *
              </label>
              <select
                required
                value={clientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                Piscina Atendida *
              </label>
              <select
                required
                value={poolId}
                onChange={e => setPoolId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Selecione a piscina...</option>
                {clientPools.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.type} • {p.volume.toLocaleString('pt-BR')}L)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Serviço e Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Serviço Realizado *
              </label>
              <select
                required
                value={serviceId}
                onChange={e => handleServiceChange(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="" disabled className="text-slate-400">
                  -- Selecione o serviço realizado --
                </option>
                {services.map(s => (
                  <option key={s.id} value={s.id} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white py-1">
                    {s.name} • {formatCurrency(s.default_price)} ({s.estimated_duration || '1h 30m'})
                  </option>
                ))}
              </select>

              {/* Selected service preview tag */}
              {(() => {
                const selectedService = services.find(s => s.id === serviceId);
                if (!selectedService) return null;
                return (
                  <div className="mt-2 p-2.5 bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-xl flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 bg-sky-100 dark:bg-sky-900 rounded-lg text-sky-600 dark:text-sky-400 shrink-0">
                        <Wrench className="w-3.5 h-3.5" />
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-sky-900 dark:text-sky-200 block truncate">
                          {selectedService.name}
                        </span>
                        <span className="text-sky-700/80 dark:text-sky-400/80 block text-[11px] truncate">
                          {selectedService.description}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-sky-700 dark:text-sky-300 block font-mono">
                        {formatCurrency(selectedService.default_price)}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        Duração: {selectedService.estimated_duration || '1h 30m'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Técnico Responsável *
              </label>
              <input
                type="text"
                required
                value={responsible}
                onChange={e => setResponsible(e.target.value)}
                placeholder="Venâncio Alves"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Data do Serviço *
              </label>
              <input
                type="date"
                required
                value={serviceDate}
                onChange={e => setServiceDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Horário da Execução
              </label>
              <input
                type="time"
                value={serviceTime}
                onChange={e => setServiceTime(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description & Products Used */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Descrição Detalhada do Trabalho Realizado
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ex: Aspiração cuidadosa, escovação de paredes, medição de cloro (2.0 ppm) e pH (7.4)..."
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Produtos Químicos / Insumos Utilizados (constará no comprovante)
              </label>
              <input
                type="text"
                value={productsUsed}
                onChange={e => setProductsUsed(e.target.value)}
                placeholder="Ex: Cloro Granulado 65% (400g), Barrilha leve (300g), Limpa bordas (100ml)"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Observações Adicionais / Recomendações para o Cliente
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Piscina liberada para banho após 2 horas de recirculação."
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section: Mapeamento em Tempo Real & Registro Fotográfico (Antes e Depois) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-sky-500/30 text-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                    <span>Mapeamento em Tempo Real & Fotos do Serviço</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-400 border border-sky-500/30">
                      Antes & Depois
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Tire uma foto para iniciar o serviço e outra foto para comprovar a conclusão
                  </p>
                </div>
              </div>

              {/* Status do GPS / Mapeamento */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefreshLocation}
                  disabled={isCapturingLocation}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 text-xs font-bold transition cursor-pointer"
                  title="Atualizar Coordenadas GPS"
                >
                  <MapPin className={`w-3.5 h-3.5 ${isCapturingLocation ? 'animate-spin' : ''}`} />
                  <span>{isCapturingLocation ? 'Localizando...' : geoLocation ? 'GPS Conectado' : 'Mapear Local'}</span>
                </button>
              </div>
            </div>

            {/* GPS Info Banner with Address & Interactive Map Toggle */}
            {geoLocation && (
              <div className="space-y-2">
                <div className="p-3 bg-sky-950/70 border border-sky-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-sky-300">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 shrink-0 mt-0.5">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <span>Check-in GPS em Tempo Real</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-1.5 py-0.2 rounded font-mono">
                          {geoLocation.latitude.toFixed(5)}, {geoLocation.longitude.toFixed(5)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-300 truncate mt-0.5 font-sans">
                        {geoLocation.address || 'Localização verificada'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setShowMiniMap(!showMiniMap)}
                      className="px-2.5 py-1 rounded-lg bg-sky-800/80 hover:bg-sky-700 text-white font-bold text-[11px] border border-sky-600/40 transition cursor-pointer"
                    >
                      {showMiniMap ? 'Ocultar Mapa' : 'Ver Mapa 📍'}
                    </button>

                    {(() => {
                      const selectedClient = clients.find(c => c.id === clientId);
                      const targetAddr = formatClientFullAddress(selectedClient) || `${geoLocation.latitude},${geoLocation.longitude}`;
                      return (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(targetAddr)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] shadow-sm transition flex items-center gap-1"
                        >
                          Google Maps ↗
                        </a>
                      );
                    })()}
                  </div>
                </div>

                {/* Interactive Embedded Mini Map */}
                {showMiniMap && (
                  <div className="rounded-xl overflow-hidden border border-sky-500/40 aspect-video max-h-56 w-full relative bg-slate-950 shadow-inner">
                    {(() => {
                      const selectedClient = clients.find(c => c.id === clientId);
                      const targetAddr = formatClientFullAddress(selectedClient) || `${geoLocation.latitude},${geoLocation.longitude}`;
                      return (
                        <iframe
                          title="Mapa do Atendimento"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(targetAddr)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                          className="w-full h-full border-0"
                          loading="lazy"
                        />
                      );
                    })()}
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-slate-900/90 backdrop-blur-md rounded text-[10px] text-sky-300 border border-slate-700">
                      {geoLocation.address || `${geoLocation.latitude.toFixed(5)}, ${geoLocation.longitude.toFixed(5)}`}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Grid com 2 Cards: Foto de Início vs Foto de Conclusão */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* CARD 1: FOTO PARA INICIAR SERVIÇO (ANTES) */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                    1. Foto para Iniciar Serviço (Antes)
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={startPhotoInputRef}
                  onChange={handleCaptureStartPhoto}
                  className="hidden"
                />

                {startPhoto ? (
                  <div className="relative rounded-lg overflow-hidden border border-sky-500/40 group aspect-video bg-black/40">
                    <img
                      src={startPhoto}
                      alt="Foto de Início do Serviço"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-sky-600/90 text-white rounded text-[10px] font-bold">
                      Início • {startTime}
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => startPhotoInputRef.current?.click()}
                        className="p-2 bg-sky-500 text-white rounded-lg text-xs font-bold hover:bg-sky-600 transition"
                      >
                        Trocar Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setStartPhoto('')}
                        className="p-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startPhotoInputRef.current?.click()}
                    disabled={isProcessingStartPhoto}
                    className="w-full aspect-video border-2 border-dashed border-sky-500/40 hover:border-sky-400 bg-sky-950/20 hover:bg-sky-950/40 rounded-xl flex flex-col items-center justify-center gap-2 text-sky-400 transition cursor-pointer p-4 text-center group"
                  >
                    <div className="p-3 rounded-full bg-sky-500/20 group-hover:scale-110 transition">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-white">
                        {isProcessingStartPhoto ? 'Processando...' : 'Tirar Foto para Iniciar'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Câmera ou carregar do arquivo
                      </span>
                    </div>
                  </button>
                )}
              </div>

              {/* CARD 2: FOTO PARA CONCLUIR SERVIÇO (DEPOIS) */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    2. Foto para Concluir Serviço (Depois)
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <input
                      type="time"
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-200 font-mono"
                    />
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={endPhotoInputRef}
                  onChange={handleCaptureEndPhoto}
                  className="hidden"
                />

                {endPhoto ? (
                  <div className="relative rounded-lg overflow-hidden border border-emerald-500/40 group aspect-video bg-black/40">
                    <img
                      src={endPhoto}
                      alt="Foto de Conclusão do Serviço"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600/90 text-white rounded text-[10px] font-bold">
                      Concluído • {endTime}
                    </div>
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => endPhotoInputRef.current?.click()}
                        className="p-2 bg-emerald-500 text-white rounded-lg text-xs font-bold hover:bg-emerald-600 transition"
                      >
                        Trocar Foto
                      </button>
                      <button
                        type="button"
                        onClick={() => setEndPhoto('')}
                        className="p-2 bg-red-500 text-white rounded-lg text-xs font-bold hover:bg-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => endPhotoInputRef.current?.click()}
                    disabled={isProcessingEndPhoto}
                    className="w-full aspect-video border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/20 hover:bg-emerald-950/40 rounded-xl flex flex-col items-center justify-center gap-2 text-emerald-400 transition cursor-pointer p-4 text-center group"
                  >
                    <div className="p-3 rounded-full bg-emerald-500/20 group-hover:scale-110 transition">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-white">
                        {isProcessingEndPhoto ? 'Processando...' : 'Tirar Foto para Concluir'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Câmera ou carregar do arquivo
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Pricing & Status Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-slate-800 dark:to-slate-800/60 border border-sky-100 dark:border-slate-700 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>Valores & Condições de Pagamento</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Valor do Serviço (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={price}
                  onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Desconto Concedido (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Valor Final Calculado
                </label>
                <div className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold text-sky-700 dark:text-sky-300 font-mono">
                  {formatCurrency(finalPrice)}
                </div>
              </div>
            </div>

            {/* Status do Pagamento selector */}
            <div className="pt-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Status do Pagamento
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_STATUSES.map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(st)}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition cursor-pointer border ${
                      paymentStatus === st
                        ? st === 'Pago'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : st === 'Parcial'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* If Parcial, allow specifying paid amount */}
            {paymentStatus === 'Parcial' && (
              <div className="pt-2">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Valor já pago agora (Entrada/Sinal):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={finalPrice}
                  value={amountPaid}
                  onChange={e => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                />
                <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-1">
                  Restará a receber: <b>{formatCurrency(Math.max(0, finalPrice - amountPaid))}</b>
                </p>
              </div>
            )}
          </div>

          {/* Section 4: Post-Service Customer Feedback (Optional) */}
          <div className="p-3.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  Coletar Avaliação do Cliente no Local (Pós-Serviço)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={collectFeedback}
                  onChange={e => setCollectFeedback(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {collectFeedback && (
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Nota do Cliente:
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 hover:scale-110 transition cursor-pointer"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= feedbackRating
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 ml-1.5">
                      {feedbackRating}.0
                    </span>
                  </div>
                </div>

                <div>
                  <input
                    type="text"
                    value={feedbackComment}
                    onChange={e => setFeedbackComment(e.target.value)}
                    placeholder="Depoimento ou observação do cliente (Ex: Água ficou impecável!)"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 text-xs transition"
            >
              Cancelar
            </button>
            <button
              id="submit-record-service-btn"
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold text-xs shadow-lg shadow-sky-500/25 active:scale-95 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir & Emitir Comprovante</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

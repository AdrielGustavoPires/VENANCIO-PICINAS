import React, { useState, useEffect } from 'react';
import { X, Waves, Check, Calculator, Image as ImageIcon } from 'lucide-react';
import { Pool, PoolType } from '../../types';
import { createPool, updatePool, getClients } from '../../database/storage';
import { useToast } from '../../context/ToastContext';
import {
  POOL_PRESET_IMAGES,
  getDefaultPoolImageByType,
  getPoolImage,
} from '../../utils/poolImages';

interface PoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolToEdit?: Pool | null;
  defaultClientId?: string;
  initialPreset?: {
    name?: string;
    type?: PoolType;
    size?: string;
    volume?: number;
    photoUrl?: string;
  } | null;
  onPoolSaved?: (pool: Pool) => void;
}

const POOL_TYPES: PoolType[] = ['Fibra', 'Vinil', 'Alvenaria', 'Azulejo', 'Outro'];

export const PoolModal: React.FC<PoolModalProps> = ({
  isOpen,
  onClose,
  poolToEdit,
  defaultClientId,
  initialPreset,
  onPoolSaved,
}) => {
  const { success, error } = useToast();
  const clients = getClients();

  const [clientId, setClientId] = useState(defaultClientId || (clients[0]?.id || ''));
  const [name, setName] = useState('');
  const [type, setType] = useState<PoolType>('Fibra');
  const [size, setSize] = useState('8m x 4m x 1.4m');
  const [volume, setVolume] = useState<number>(35000);
  const [photoUrl, setPhotoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Liters Calculator state
  const [calcLen, setCalcLen] = useState('8');
  const [calcWidth, setCalcWidth] = useState('4');
  const [calcDepth, setCalcDepth] = useState('1.4');

  useEffect(() => {
    if (poolToEdit) {
      setClientId(poolToEdit.client_id);
      setName(poolToEdit.name);
      setType(poolToEdit.type);
      setSize(poolToEdit.size);
      setVolume(poolToEdit.volume);
      setPhotoUrl(getPoolImage(poolToEdit));
      setAddress(poolToEdit.address || '');
      setNotes(poolToEdit.notes || '');
    } else if (initialPreset) {
      const presetType = initialPreset.type || 'Fibra';
      setClientId(defaultClientId || (clients[0]?.id || ''));
      setName(initialPreset.name || `Piscina Principal (${presetType})`);
      setType(presetType);
      setSize(initialPreset.size || '8m x 4m x 1.4m');
      setVolume(initialPreset.volume || 35000);
      setPhotoUrl(initialPreset.photoUrl || getDefaultPoolImageByType(presetType));
      setAddress('');
      setNotes('');
    } else {
      setClientId(defaultClientId || (clients[0]?.id || ''));
      setName('Piscina Principal');
      setType('Fibra');
      setSize('8m x 4m x 1.4m');
      setVolume(35000);
      setPhotoUrl(getDefaultPoolImageByType('Fibra'));
      setAddress('');
      setNotes('');
    }
  }, [poolToEdit, defaultClientId, initialPreset, isOpen]);

  const handleTypeChange = (newType: PoolType) => {
    setType(newType);
    const isPresetOrEmpty =
      !photoUrl || POOL_PRESET_IMAGES.some(preset => preset.url === photoUrl);
    if (isPresetOrEmpty) {
      setPhotoUrl(getDefaultPoolImageByType(newType, name));
    }
  };

  if (!isOpen) return null;

  const handleCalculateVolume = () => {
    const l = parseFloat(calcLen) || 0;
    const w = parseFloat(calcWidth) || 0;
    const d = parseFloat(calcDepth) || 0;
    if (l > 0 && w > 0 && d > 0) {
      const calculatedLiters = Math.round(l * w * d * 1000);
      setVolume(calculatedLiters);
      setSize(`${l}m x ${w}m x ${d}m`);
      success(`Volume calculado: ${calculatedLiters.toLocaleString('pt-BR')} Litros`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      error('Selecione um cliente para vincular a piscina.');
      return;
    }
    if (!name.trim()) {
      error('Informe o nome de identificação da piscina.');
      return;
    }

    try {
      const poolPayload = {
        client_id: clientId,
        name: name.trim(),
        type,
        size: size.trim(),
        volume: Number(volume) || 0,
        photo_url: photoUrl.trim() || getDefaultPoolImageByType(type, name),
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      let saved: Pool | null;
      if (poolToEdit) {
        saved = updatePool(poolToEdit.id, poolPayload);
        success('Piscina atualizada com sucesso!');
      } else {
        saved = createPool(poolPayload);
        success('Piscina cadastrada com sucesso!');
      }

      if (saved && onPoolSaved) {
        onPoolSaved(saved);
      }
      onClose();
    } catch {
      error('Erro ao salvar os dados da piscina.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base">
                {poolToEdit ? 'Editar Piscina' : 'Cadastrar Nova Piscina'}
              </h3>
              <p className="text-xs text-sky-100">
                Especificações técnicas, litragem e tipo de revestimento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Client selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cliente Proprietário *
            </label>
            <select
              required
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="">Selecione um cliente...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.neighborhood ? `(${c.neighborhood})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pool Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Identificação da Piscina *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Piscina Principal, Spa, Infantil"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Revestimento *
              </label>
              <select
                value={type}
                onChange={e => handleTypeChange(e.target.value as PoolType)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {POOL_TYPES.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Volume in liters */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Volume Estimado (Litros) *
              </label>
              <input
                type="number"
                required
                min={100}
                value={volume}
                onChange={e => setVolume(Number(e.target.value))}
                placeholder="45000"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            {/* Dimensions */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dimensões / Tamanho
              </label>
              <input
                type="text"
                value={size}
                onChange={e => setSize(e.target.value)}
                placeholder="Ex: 8m x 4m x 1.4m"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Liters Quick Calculator helper */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
              <Calculator className="w-4 h-4 text-sky-600" />
              <span>Calculadora Rápida de Litragem</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-500">Comp. (m)</span>
                <input
                  type="text"
                  value={calcLen}
                  onChange={e => setCalcLen(e.target.value)}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-medium"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Larg. (m)</span>
                <input
                  type="text"
                  value={calcWidth}
                  onChange={e => setCalcWidth(e.target.value)}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-medium"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500">Prof. (m)</span>
                <input
                  type="text"
                  value={calcDepth}
                  onChange={e => setCalcDepth(e.target.value)}
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-center font-medium"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleCalculateVolume}
                  className="w-full py-1 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg transition"
                >
                  Calcular
                </button>
              </div>
            </div>
          </div>

          {/* Photo & Visual Similar Pool Images Selection */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-sky-500" />
                <span>Imagens Semelhantes de Piscinas (Escolha um modelo)</span>
              </label>
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                Clique para selecionar
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {POOL_PRESET_IMAGES.map(img => {
                const isSelected = photoUrl === img.url;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setPhotoUrl(img.url);
                      setType(img.type);
                    }}
                    className={`group relative rounded-xl overflow-hidden border-2 text-left transition cursor-pointer ${
                      isSelected
                        ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-md'
                        : 'border-slate-200 dark:border-slate-700 opacity-80 hover:opacity-100 hover:border-sky-400'
                    }`}
                  >
                    <div className="h-16 w-full overflow-hidden bg-slate-900">
                      <img
                        src={img.url}
                        alt={img.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      />
                    </div>
                    <div className="p-1.5 bg-white dark:bg-slate-900">
                      <p className="text-[10px] font-bold text-slate-800 dark:text-white truncate">
                        {img.type}
                      </p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
                        {img.label}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Ou cole o link de uma foto personalizada (Opcional):
              </label>
              <input
                type="text"
                value={POOL_PRESET_IMAGES.some(p => p.url === photoUrl) ? '' : photoUrl}
                onChange={e =>
                  setPhotoUrl(e.target.value || getDefaultPoolImageByType(type, name))
                }
                placeholder="https://exemplo.com/foto-da-piscina.jpg"
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Location details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Local no Imóvel / Endereço Específico
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Ex: Área externa fundos, Casa de campo, Cobertura 18º andar"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações Técnicas (Equipamentos, Filtro, Gerador de Cloro, Aquecedor)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Filtro DFR-20 com 4 sacos de areia, gerador de ozônio, motobomba 1.5CV..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white text-xs font-bold shadow-md active:scale-95 transition cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{poolToEdit ? 'Salvar Piscina' : 'Cadastrar Piscina'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

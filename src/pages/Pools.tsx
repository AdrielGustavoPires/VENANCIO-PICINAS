import React, { useState, useEffect } from 'react';
import {
  Waves,
  Plus,
  Search,
  User,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Pool, Client, PoolType } from '../types';
import {
  getPools,
  getClients,
  deletePool,
  subscribeToDatabase,
} from '../database/storage';
import { useToast } from '../context/ToastContext';
import { PoolModal } from '../components/pools/PoolModal';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  POOL_PRESET_IMAGES,
  getDefaultPoolImageByType,
  getPoolImage,
} from '../utils/poolImages';

interface PoolsProps {
  onSelectClient: (clientId: string) => void;
  onOpenNewService: (clientId: string, poolId: string) => void;
}

const POOL_TYPES: (PoolType | 'Todos')[] = ['Todos', 'Alvenaria', 'Fibra', 'Azulejo', 'Vinil', 'Outro'];

export const Pools: React.FC<PoolsProps> = ({ onSelectClient, onOpenNewService }) => {
  const { success, error } = useToast();
  const [pools, setPools] = useState<Pool[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<PoolType | 'Todos'>('Todos');
  const [selectedClientId, setSelectedClientId] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [poolToEdit, setPoolToEdit] = useState<Pool | null>(null);
  const [poolToDelete, setPoolToDelete] = useState<Pool | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<{
    name?: string;
    type?: PoolType;
    size?: string;
    volume?: number;
    photoUrl?: string;
  } | null>(null);

  const loadData = () => {
    setPools(getPools());
    setClients(getClients());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDatabase(loadData);
    return () => unsubscribe();
  }, []);

  const filteredPools = pools.filter(p => {
    const client = clients.find(c => c.id === p.client_id);
    const clientName = client ? client.name.toLowerCase() : '';
    const poolName = p.name.toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = !term || poolName.includes(term) || clientName.includes(term);
    const matchesType = selectedType === 'Todos' || p.type === selectedType;
    const matchesClient = selectedClientId === 'all' || p.client_id === selectedClientId;

    return matchesSearch && matchesType && matchesClient;
  });

  const handleConfirmDelete = () => {
    if (!poolToDelete) return;
    try {
      deletePool(poolToDelete.id);
      loadData();
      success(`Piscina "${poolToDelete.name}" excluída.`);
    } catch {
      error('Não foi possível excluir a piscina.');
    } finally {
      setPoolToDelete(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Waves className="w-5 h-5 text-sky-600" />
            <span>Parque de Piscinas</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {pools.length} {pools.length === 1 ? 'piscina registrada' : 'piscinas registradas'} no sistema
          </p>
        </div>

        <button
          id="btn-add-pool-page"
          type="button"
          onClick={() => {
            setPoolToEdit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-sky-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Piscina</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search text */}
          <div className="sm:col-span-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar piscina ou cliente..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Client Filter */}
          <div>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="all">Todos os clientes</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            {POOL_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  selectedType === t
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pools Grid */}
      {filteredPools.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
          <Waves className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            Nenhuma piscina encontrada
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tente alterar os filtros ou cadastre uma nova piscina.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedType('Todos');
              setSelectedClientId('all');
            }}
            className="mt-3 px-3.5 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPools.map(pool => {
            const client = clients.find(c => c.id === pool.client_id);

            return (
              <div
                key={pool.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:border-sky-300 dark:hover:border-sky-700 transition flex flex-col justify-between group"
              >
                {/* Photo banner */}
                <div className="h-44 w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                  <img
                    src={getPoolImage(pool)}
                    alt={pool.name}
                    referrerPolicy="no-referrer"
                    onError={e => {
                      const target = e.currentTarget;
                      const fallback = getDefaultPoolImageByType(pool.type, pool.name);
                      if (target.src !== fallback) {
                        target.src = fallback;
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-transparent pointer-events-none" />

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 dark:bg-slate-900/90 text-sky-700 dark:text-sky-300 backdrop-blur-xs shadow-xs">
                      {pool.type}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-slate-950/80 text-white backdrop-blur-xs font-mono">
                      {pool.volume.toLocaleString('pt-BR')} L
                    </span>
                  </div>
                </div>

                {/* Pool Info Body */}
                <div className="p-5 flex-1 space-y-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {pool.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => client && onSelectClient(client.id)}
                      className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <User className="w-3 h-3" />
                      <span>{client?.name || 'Cliente desconhecido'}</span>
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dimensões:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {pool.size || 'Não informado'}
                      </span>
                    </div>
                    {pool.address && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Local:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                          {pool.address}
                        </span>
                      </div>
                    )}
                  </div>

                  {pool.notes && (
                    <p className="text-xs text-slate-500 line-clamp-2 italic">
                      <b>Obs:</b> {pool.notes}
                    </p>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/70 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => client && onOpenNewService(client.id, pool.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Serviço</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPoolToEdit(pool);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg transition"
                      title="Editar piscina"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPoolToDelete(pool)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      title="Excluir piscina"
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

      {/* Galeria de Modelos & Imagens Semelhantes de Piscinas */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>Modelos & Imagens Semelhantes de Piscinas</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Referências visuais por tipo de estrutura (clique em um modelo para cadastrar uma piscina semelhante)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {POOL_PRESET_IMAGES.map(preset => (
            <div
              key={preset.id}
              className="group rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 overflow-hidden flex flex-col justify-between hover:border-sky-400 dark:hover:border-sky-600 transition shadow-2xs"
            >
              <div className="h-32 w-full relative overflow-hidden bg-slate-900">
                <img
                  src={preset.url}
                  alt={preset.label}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/90 text-white backdrop-blur-xs">
                  {preset.type}
                </span>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-950/80 text-sky-300 font-mono">
                  {preset.defaultVolume.toLocaleString('pt-BR')} L
                </span>
              </div>

              <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    {preset.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {preset.subtitle}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setPoolToEdit(null);
                    setSelectedPreset({
                      name: preset.label,
                      type: preset.type,
                      size: preset.defaultSize,
                      volume: preset.defaultVolume,
                      photoUrl: preset.url,
                    });
                    setIsModalOpen(true);
                  }}
                  className="w-full py-1.5 px-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-600 text-sky-600 dark:text-sky-400 hover:text-white border border-sky-500/20 text-[11px] font-bold transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Cadastrar Semelhante</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pool Add/Edit Modal */}
      <PoolModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPoolToEdit(null);
          setSelectedPreset(null);
        }}
        poolToEdit={poolToEdit}
        initialPreset={selectedPreset}
      />

      {/* Confirm Delete Pool Modal */}
      <ConfirmModal
        isOpen={!!poolToDelete}
        title="Excluir Piscina"
        message={`Deseja realmente remover a piscina "${poolToDelete?.name}" do sistema? Esta ação removerá o registro.`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setPoolToDelete(null)}
      />
    </div>
  );
};

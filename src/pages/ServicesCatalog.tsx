import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  DollarSign,
  Edit2,
  Trash2,
  Power,
  X,
  Check,
} from 'lucide-react';
import { ServiceItem } from '../types';
import {
  getServices,
  createService,
  updateService,
  deleteService,
  subscribeToDatabase,
} from '../database/storage';
import { formatCurrency } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import { ConfirmModal } from '../components/common/ConfirmModal';

export const ServicesCatalog: React.FC = () => {
  const { success, error } = useToast();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceItem | null>(null);
  const [serviceToDelete, setServiceToDelete] = useState<ServiceItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('180');
  const [estimatedDuration, setEstimatedDuration] = useState('1h 30min');
  const [active, setActive] = useState(true);

  const loadData = () => {
    setServices(getServices());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToDatabase(loadData);
    return () => unsubscribe();
  }, []);

  const openNewModal = () => {
    setServiceToEdit(null);
    setName('');
    setDescription('');
    setDefaultPrice('180');
    setEstimatedDuration('1h 30min');
    setActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (s: ServiceItem) => {
    setServiceToEdit(s);
    setName(s.name);
    setDescription(s.description);
    setDefaultPrice(String(s.default_price));
    setEstimatedDuration(s.estimated_duration);
    setActive(s.active);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (s: ServiceItem) => {
    try {
      updateService(s.id, { active: !s.active });
      loadData();
      success(`Serviço "${s.name}" ${!s.active ? 'ativado' : 'desativado'}.`);
    } catch {
      error('Erro ao alterar status do serviço.');
    }
  };

  const handleConfirmDelete = () => {
    if (!serviceToDelete) return;
    try {
      deleteService(serviceToDelete.id);
      loadData();
      success(`Serviço "${serviceToDelete.name}" excluído.`);
    } catch {
      error('Erro ao excluir serviço.');
    } finally {
      setServiceToDelete(null);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Informe o nome do serviço.');
      return;
    }

    try {
      const priceVal = parseFloat(defaultPrice) || 0;
      if (serviceToEdit) {
        updateService(serviceToEdit.id, {
          name: name.trim(),
          description: description.trim(),
          default_price: priceVal,
          estimated_duration: estimatedDuration.trim(),
          active,
        });
        success('Serviço atualizado com sucesso!');
      } else {
        createService({
          name: name.trim(),
          description: description.trim(),
          default_price: priceVal,
          estimated_duration: estimatedDuration.trim(),
          active,
        });
        success('Serviço cadastrado com sucesso!');
      }
      setIsModalOpen(false);
    } catch {
      error('Erro ao salvar serviço.');
    }
  };

  const filteredServices = services.filter(s => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term || s.name.toLowerCase().includes(term) || s.description.toLowerCase().includes(term);
    const matchesFilter =
      filterActive === 'all' || (filterActive === 'active' && s.active) || (filterActive === 'inactive' && !s.active);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-sky-600" />
            <span>Catálogo de Serviços Oferecidos</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tabela de preços padrão, tempos estimados e descrição detalhada dos serviços
          </p>
        </div>

        <button
          id="btn-add-service"
          type="button"
          onClick={openNewModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-sky-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Novo Serviço</span>
        </button>
      </div>

      {/* Search & Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Pesquisar serviço..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterActive('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterActive === 'all' ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Todos ({services.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterActive('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterActive === 'active' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Ativos ({services.filter(s => s.active).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterActive('inactive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              filterActive === 'inactive' ? 'bg-slate-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            Inativos ({services.filter(s => !s.active).length})
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => (
          <div
            key={service.id}
            className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs flex flex-col justify-between transition ${
              service.active
                ? 'border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700'
                : 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50/50'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white leading-snug">
                  {service.name}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    service.active
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {service.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed min-h-[38px]">
                {service.description}
              </p>

              {/* Price & Duration badges */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-sky-500" />
                  <span>{service.estimated_duration}</span>
                </div>
                <div className="font-extrabold text-base text-sky-700 dark:text-sky-300 font-mono">
                  {formatCurrency(service.default_price)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleToggleStatus(service)}
                className={`text-xs font-semibold flex items-center gap-1.5 transition ${
                  service.active
                    ? 'text-slate-400 hover:text-amber-600'
                    : 'text-emerald-600 hover:text-emerald-700 font-bold'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{service.active ? 'Desativar' : 'Ativar'}</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(service)}
                  className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg transition"
                  title="Editar serviço"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setServiceToDelete(service)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                  title="Excluir serviço"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Service Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-sky-600 to-cyan-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5" />
                <h3 className="font-bold text-base">
                  {serviceToEdit ? 'Editar Serviço' : 'Novo Serviço no Catálogo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Serviço *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Limpeza e Aspiração Completa"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descrição dos Procedimentos
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Descreva o que está incluso: aspiração ao fundo, escovação, análise de pH..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valor Padrão (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={defaultPrice}
                    onChange={e => setDefaultPrice(e.target.value)}
                    placeholder="180.00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Duração Estimada
                  </label>
                  <input
                    type="text"
                    value={estimatedDuration}
                    onChange={e => setEstimatedDuration(e.target.value)}
                    placeholder="Ex: 1h 30min"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer select-none pt-2">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={e => setActive(e.target.checked)}
                    className="w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                  />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Serviço ativo para contratação
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 text-white rounded-xl text-xs font-bold shadow-md active:scale-95 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>{serviceToEdit ? 'Salvar Alterações' : 'Cadastrar Serviço'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Service Confirm Modal */}
      <ConfirmModal
        isOpen={!!serviceToDelete}
        title="Excluir Serviço do Catálogo"
        message={`Deseja realmente remover o serviço "${serviceToDelete?.name}" do catálogo padrão?`}
        confirmText="Sim, Excluir"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setServiceToDelete(null)}
      />
    </div>
  );
};

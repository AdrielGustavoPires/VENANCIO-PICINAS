import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from 'recharts';
import {
  Calendar,
  TrendingUp,
  Award,
  Layers,
  Wrench,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { ServiceRecord, ServiceItem } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface ServicesComparisonChartProps {
  records: ServiceRecord[];
  services?: ServiceItem[];
  onNavigate?: (tab: any) => void;
}

type ViewMode = 'total' | 'categories' | 'revenue_comparison';

interface MonthData {
  monthKey: string;
  label: string;
  fullLabel: string;
  total: number;
  limpeza: number;
  quimico: number;
  manutencao: number;
  faturamento: number;
  growth: number | null; // % vs previous month
  recordsCount: number;
}

const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_NAMES_FULL = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export const ServicesComparisonChart: React.FC<ServicesComparisonChartProps> = ({
  records,
  services = [],
  onNavigate,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('total');
  const [hoveredMonth, setHoveredMonth] = useState<MonthData | null>(null);

  // Calculate the last 6 months data
  const monthlyData: MonthData[] = useMemo(() => {
    // Reference date: current date (default to 2026-08 if in app reference context)
    const now = new Date();
    const result: MonthData[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const monthStr = String(monthIdx + 1).padStart(2, '0');
      const monthKey = `${year}-${monthStr}`;
      const label = `${MONTH_NAMES_SHORT[monthIdx]}/${String(year).slice(-2)}`;
      const fullLabel = `${MONTH_NAMES_FULL[monthIdx]} de ${year}`;

      // Filter records belonging to this month
      const monthRecords = records.filter(r => {
        if (!r.service_date) return false;
        return r.service_date.startsWith(monthKey);
      });

      const total = monthRecords.length;
      const faturamento = monthRecords.reduce((sum, r) => sum + (r.final_price || 0), 0);

      // Categorize services
      let limpeza = 0;
      let quimico = 0;
      let manutencao = 0;

      monthRecords.forEach(r => {
        const desc = (r.description || '').toLowerCase();
        const servName = (services.find(s => s.id === r.service_id)?.name || '').toLowerCase();
        const combined = `${desc} ${servName}`;

        if (combined.includes('bomba') || combined.includes('filtro') || combined.includes('areia') || combined.includes('conserto') || combined.includes('troca')) {
          manutencao++;
        } else if (combined.includes('químico') || combined.includes('choque') || combined.includes('ph') || combined.includes('cloro') || combined.includes('alcalinidade') || combined.includes('algicida')) {
          quimico++;
        } else {
          limpeza++;
        }
      });

      result.push({
        monthKey,
        label,
        fullLabel,
        total,
        limpeza,
        quimico,
        manutencao,
        faturamento,
        growth: null,
        recordsCount: total,
      });
    }

    // Calculate growth percentages
    for (let i = 1; i < result.length; i++) {
      const prev = result[i - 1].total;
      const curr = result[i].total;
      if (prev > 0) {
        result[i].growth = Math.round(((curr - prev) / prev) * 100);
      } else if (curr > 0) {
        result[i].growth = 100;
      } else {
        result[i].growth = 0;
      }
    }

    return result;
  }, [records, services]);

  // Overall Statistics for the 6-month period
  const totalSemester = useMemo(() => monthlyData.reduce((acc, m) => acc + m.total, 0), [monthlyData]);
  const averageMonthly = useMemo(
    () => (monthlyData.length > 0 ? (totalSemester / monthlyData.length).toFixed(1) : '0'),
    [totalSemester, monthlyData]
  );
  const peakMonth = useMemo(() => {
    if (monthlyData.length === 0) return null;
    return monthlyData.reduce((prev, curr) => (curr.total > prev.total ? curr : prev), monthlyData[0]);
  }, [monthlyData]);

  const currentMonthData = monthlyData[monthlyData.length - 1];
  const prevMonthData = monthlyData[monthlyData.length - 2];
  const lastMonthGrowth = currentMonthData?.growth;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xs p-5 sm:p-6 transition-colors">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-5 bg-sky-500 rounded-full shrink-0" />
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Serviços Realizados nos Últimos 6 Meses</span>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded-full border border-sky-200 dark:border-sky-800">
                Semestral
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comparativo da quantidade de atendimentos e manutenções concluídas mês a mês
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg self-start md:self-auto border border-slate-200/60 dark:border-slate-700/60">
          <button
            type="button"
            onClick={() => setViewMode('total')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'total'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Volume Total</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('categories')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'categories'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Por Categoria</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 dark:border-slate-800/80 my-2">
        {/* Total no Semestre */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Total no Semestre
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {totalSemester} <span className="text-xs font-normal text-slate-500">serviços</span>
          </div>
          <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>100% concluídos</span>
          </div>
        </div>

        {/* Média Mensal */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Média Mensal
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
            {averageMonthly} <span className="text-xs font-normal text-slate-500">atend./mês</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            Volume regular
          </div>
        </div>

        {/* Mês Pico */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Mês de Maior Movimento
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
            {peakMonth?.label || '—'}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
            <Award className="w-3 h-3" />
            <span>{peakMonth ? `${peakMonth.total} serviços` : '0'}</span>
          </div>
        </div>

        {/* Variação Recente */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
          <div className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
            Tendência Atual
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
            {lastMonthGrowth !== null && lastMonthGrowth !== undefined ? (
              <>
                <span className={lastMonthGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                  {lastMonthGrowth >= 0 ? `+${lastMonthGrowth}%` : `${lastMonthGrowth}%`}
                </span>
                {lastMonthGrowth >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-rose-500 shrink-0" />
                )}
              </>
            ) : (
              <span className="text-slate-400">—</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            vs. mês anterior
          </div>
        </div>
      </div>

      {/* Recharts Bar Chart Area */}
      <div className="w-full mt-4">
        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
              onMouseMove={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  setHoveredMonth(state.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.12} stroke="#94a3b8" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }}
                axisLine={{ stroke: '#cbd5e1', opacity: 0.4 }}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as MonthData;
                    return (
                      <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700/60 text-xs min-w-[200px] z-50">
                        <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                          <span className="font-bold text-sky-400 text-sm">{data.fullLabel}</span>
                          <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded font-bold text-[10px]">
                            {data.total} atendimentos
                          </span>
                        </div>

                        {viewMode === 'categories' ? (
                          <div className="space-y-1.5 my-2">
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-sky-500" />
                                Limpeza & Aspiração:
                              </span>
                              <span className="font-bold text-white">{data.limpeza}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                Tratamento Químico:
                              </span>
                              <span className="font-bold text-white">{data.quimico}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500" />
                                Manutenções / Trocas:
                              </span>
                              <span className="font-bold text-white">{data.manutencao}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 my-2">
                            <div className="flex justify-between text-slate-300">
                              <span>Total de Serviços:</span>
                              <span className="font-bold text-white">{data.total} realizados</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span>Faturamento Gerado:</span>
                              <span className="font-bold text-emerald-400">{formatCurrency(data.faturamento)}</span>
                            </div>
                            {data.growth !== null && (
                              <div className="flex justify-between text-slate-300">
                                <span>Evolução vs mês anterior:</span>
                                <span className={`font-bold ${data.growth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {data.growth >= 0 ? `+${data.growth}%` : `${data.growth}%`}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-700/80 text-[10px] text-slate-400 flex items-center justify-between">
                          <span>Média do período: {averageMonthly}/mês</span>
                          <span className="text-sky-400 font-semibold">Registro Real</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {viewMode === 'total' ? (
                <Bar
                  dataKey="total"
                  name="Quantidade de Serviços"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                >
                  {monthlyData.map((entry, index) => {
                    const isPeak = entry.total === peakMonth?.total && entry.total > 0;
                    const isCurrent = index === monthlyData.length - 1;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          isCurrent
                            ? '#0284c7' // Current month: vibrant sky blue
                            : isPeak
                            ? '#0ea5e9' // Peak month: bright cyan/sky
                            : '#38bdf8' // Other months: sky blue
                        }
                        opacity={isCurrent ? 1 : 0.85}
                      />
                    );
                  })}
                </Bar>
              ) : (
                <>
                  <Bar
                    dataKey="limpeza"
                    name="Limpeza & Aspiração"
                    stackId="a"
                    fill="#0284c7"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={48}
                  />
                  <Bar
                    dataKey="quimico"
                    name="Tratamento Químico"
                    stackId="a"
                    fill="#10b981"
                    radius={[0, 0, 0, 0]}
                    maxBarSize={48}
                  />
                  <Bar
                    dataKey="manutencao"
                    name="Manutenção / Reparos"
                    stackId="a"
                    fill="#f59e0b"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={48}
                  />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend & Details Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        {viewMode === 'categories' ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-sky-600" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Limpeza & Aspiração</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Tratamento Químico</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Manutenção & Reparos</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-sky-600" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Mês Corrente (Em andamento)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-sky-400" />
              <span className="text-slate-600 dark:text-slate-300 font-medium">Meses Anteriores</span>
            </div>
          </div>
        )}

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('servicos')}
            className="text-sky-600 dark:text-sky-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer ml-auto"
          >
            <span>Ver todos os serviços</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

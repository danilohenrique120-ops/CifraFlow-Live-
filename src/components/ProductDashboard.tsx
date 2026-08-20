import React from 'react';
import { Bioreactor } from '../types';
import { Activity, Flame, CheckCircle, LayoutDashboard, Filter, X } from 'lucide-react';

interface ProductDashboardProps {
  bioreactors: Bioreactor[];
  totalVolumeInProcess: number;
  inProcessCount: number;
  completedCount: number;
  standbyCount: number;
  activeFilter?: string;
  onSelectProductFilter?: (productName: string) => void;
}

export interface ProductConfig {
  id: string;
  name: string;
  colorName: 'blue' | 'purple' | 'yellow' | 'green';
  colorLabel: string;
  borderColor: string;
  activeRing: string;
  dotBg: string;
  textColor: string;
  badgeBg: string;
  cardBg: string;
}

export const OFFICIAL_PRODUCTS: ProductConfig[] = [
  {
    id: 'soja',
    name: 'Soja',
    colorName: 'blue',
    colorLabel: 'Azul',
    borderColor: 'border-blue-500/40 hover:border-blue-400',
    activeRing: 'ring-2 ring-blue-400 border-blue-500 bg-blue-950/40',
    dotBg: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.9)]',
    textColor: 'text-blue-400',
    badgeBg: 'bg-blue-950/90 text-blue-300 border-blue-700/60',
    cardBg: 'from-blue-950/20 via-zinc-900/90 to-zinc-900/90',
  },
  {
    id: 'dual-brady',
    name: 'Dual Brady',
    colorName: 'purple',
    colorLabel: 'Roxo',
    borderColor: 'border-purple-500/40 hover:border-purple-400',
    activeRing: 'ring-2 ring-purple-400 border-purple-500 bg-purple-950/40',
    dotBg: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.9)]',
    textColor: 'text-purple-400',
    badgeBg: 'bg-purple-950/90 text-purple-300 border-purple-700/60',
    cardBg: 'from-purple-950/20 via-zinc-900/90 to-zinc-900/90',
  },
  {
    id: 'dual-azo',
    name: 'Dual Azo',
    colorName: 'yellow',
    colorLabel: 'Amarelo',
    borderColor: 'border-yellow-400/40 hover:border-yellow-300',
    activeRing: 'ring-2 ring-yellow-400 border-yellow-400 bg-yellow-950/40',
    dotBg: 'bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.9)]',
    textColor: 'text-yellow-400',
    badgeBg: 'bg-yellow-950/90 text-yellow-300 border-yellow-600/60',
    cardBg: 'from-yellow-950/20 via-zinc-900/90 to-zinc-900/90',
  },
  {
    id: 'dual-force',
    name: 'Dual Force',
    colorName: 'purple',
    colorLabel: 'Roxo',
    borderColor: 'border-purple-500/40 hover:border-purple-400',
    activeRing: 'ring-2 ring-purple-400 border-purple-500 bg-purple-950/40',
    dotBg: 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.9)]',
    textColor: 'text-purple-400',
    badgeBg: 'bg-purple-950/90 text-purple-300 border-purple-700/60',
    cardBg: 'from-purple-950/20 via-zinc-900/90 to-zinc-900/90',
  },
  {
    id: 'premier',
    name: 'Premier',
    colorName: 'green',
    colorLabel: 'Verde',
    borderColor: 'border-emerald-500/40 hover:border-emerald-400',
    activeRing: 'ring-2 ring-emerald-400 border-emerald-500 bg-emerald-950/40',
    dotBg: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]',
    textColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60',
    cardBg: 'from-emerald-950/20 via-zinc-900/90 to-zinc-900/90',
  },
];

export const ProductDashboard: React.FC<ProductDashboardProps> = ({
  bioreactors,
  totalVolumeInProcess,
  inProcessCount,
  completedCount,
  standbyCount,
  activeFilter = '',
  onSelectProductFilter,
}) => {
  // Aggregate stats for official products
  const productStats = OFFICIAL_PRODUCTS.map((prod) => {
    const matching = bioreactors.filter((r) =>
      r.productName?.toLowerCase().includes(prod.name.toLowerCase())
    );

    const count = matching.length;
    const totalLiquidVolume = Math.round(
      matching.reduce((acc, r) => acc + (r.capacity * (r.fillLevel || 0)) / 100, 0)
    );

    return {
      ...prod,
      count,
      totalLiquidVolume,
    };
  });

  // Track any custom user-added products that don't match the 5 main lines
  const extraProductsMap = new Map<string, { count: number; vol: number }>();
  bioreactors.forEach((r) => {
    if (!r.productName || !r.productName.trim()) return;
    const isOfficial = OFFICIAL_PRODUCTS.some((p) =>
      r.productName.toLowerCase().includes(p.name.toLowerCase())
    );
    if (!isOfficial) {
      const pName = r.productName.trim();
      const current = extraProductsMap.get(pName) || { count: 0, vol: 0 };
      current.count += 1;
      current.vol += Math.round((r.capacity * (r.fillLevel || 0)) / 100);
      extraProductsMap.set(pName, current);
    }
  });

  const extraList = Array.from(extraProductsMap.entries()).map(([pName, stats]) => ({
    name: pName,
    count: stats.count,
    vol: stats.vol,
  }));

  const activeFilterNorm = activeFilter.toLowerCase().trim();

  return (
    <div className="w-full bg-zinc-950/90 rounded-2xl border border-zinc-800 p-4 md:p-5 mb-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
      {/* Top subtle decorative gradient bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 via-yellow-400 via-purple-500 to-emerald-500 opacity-90" />

      {/* Title & Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white font-mono">
              PAINEL DA PLANTA
            </h3>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono hidden md:inline">
            | 16 Biorreatores em Monitoramento
          </span>
        </div>

        {activeFilterNorm ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1.5 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-800">
              <Filter className="w-3 h-3 text-cyan-400" />
              Filtro por produto: <strong className="text-white uppercase">{activeFilter}</strong>
            </span>
            <button
              onClick={() => onSelectProductFilter && onSelectProductFilter(activeFilter)}
              className="p-1 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition cursor-pointer"
              title="Limpar filtro"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-zinc-400 font-mono">
            Clique na linha do produto para filtrar os quadros
          </span>
        )}
      </div>

      {/* 1. TOP SECTION: 4 UNIFIED STATUS KPIS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* KPI 1: Fluido em Processo */}
        <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/90 flex items-center space-x-3 shadow-inner">
          <div className="p-2.5 bg-cyan-950/80 border border-cyan-800/80 rounded-lg shrink-0">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide truncate">
              Fluido em Processo
            </p>
            <p className="text-base md:text-lg font-mono font-black text-white mt-0.5">
              {totalVolumeInProcess.toLocaleString()}{' '}
              <span className="text-xs text-zinc-400 font-normal">L</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Em Fermentação */}
        <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/90 flex items-center space-x-3 shadow-inner">
          <div className="p-2.5 bg-yellow-950/80 border border-yellow-800/80 rounded-lg shrink-0">
            <Flame className="w-5 h-5 text-yellow-400 animate-bounce" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide truncate">
              Em Fermentação
            </p>
            <p className="text-base md:text-lg font-mono font-black text-yellow-400 mt-0.5">
              {inProcessCount}{' '}
              <span className="text-xs text-zinc-400 font-normal">
                {inProcessCount === 1 ? 'Reator' : 'Reatores'}
              </span>
            </p>
          </div>
        </div>

        {/* KPI 3: Liberados Envase */}
        <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/90 flex items-center space-x-3 shadow-inner">
          <div className="p-2.5 bg-emerald-950/80 border border-emerald-800/80 rounded-lg shrink-0">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide truncate">
              Liberados Envase
            </p>
            <p className="text-base md:text-lg font-mono font-black text-emerald-400 mt-0.5">
              {completedCount}{' '}
              <span className="text-xs text-zinc-400 font-normal">
                {completedCount === 1 ? 'Lote' : 'Lotes'}
              </span>
            </p>
          </div>
        </div>

        {/* KPI 4: Vazios / Standby */}
        <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800/90 flex items-center space-x-3 shadow-inner">
          <div className="p-2.5 bg-zinc-800/80 border border-zinc-700/80 rounded-lg shrink-0">
            <LayoutDashboard className="w-5 h-5 text-zinc-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide truncate">
              Vazios / Standby
            </p>
            <p className="text-base md:text-lg font-mono font-black text-zinc-300 mt-0.5">
              {standbyCount}{' '}
              <span className="text-xs text-zinc-400 font-normal">
                {standbyCount === 1 ? 'Estação' : 'Estações'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM SECTION: 5 OFFICIAL PRODUCT COLOR CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {productStats.map((prod) => {
          const isActive = activeFilterNorm === prod.name.toLowerCase().trim();
          const hasReactors = prod.count > 0;

          return (
            <button
              key={prod.id}
              type="button"
              onClick={() => onSelectProductFilter && onSelectProductFilter(prod.name)}
              className={`flex flex-col justify-between p-3 rounded-xl border bg-gradient-to-b ${
                prod.cardBg
              } transition-all duration-200 cursor-pointer text-left select-none ${
                isActive ? prod.activeRing : `${prod.borderColor} bg-zinc-900/90`
              } ${!hasReactors ? 'opacity-50 hover:opacity-100' : 'hover:scale-[1.01]'}`}
            >
              {/* Product title row */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${prod.dotBg}`} />
                  <span
                    className={`text-xs font-black uppercase tracking-wider truncate ${prod.textColor}`}
                  >
                    {prod.name}
                  </span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border ${prod.badgeBg}`}
                >
                  {prod.colorLabel}
                </span>
              </div>

              {/* Product metrics row */}
              <div className="flex items-baseline justify-between font-mono mt-1">
                <div className="text-[11px] text-zinc-400 font-medium">
                  <strong className="text-white font-bold text-sm">{prod.count}</strong>{' '}
                  <span className="text-[10px]">{prod.count === 1 ? 'reator' : 'reatores'}</span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs md:text-sm font-black ${
                      hasReactors ? 'text-white' : 'text-zinc-500'
                    }`}
                  >
                    {prod.totalLiquidVolume.toLocaleString()}{' '}
                    <span className="text-[10px] text-zinc-400 font-normal">L</span>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom/Extra product tags if any exist */}
      {extraList.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-400">
          <span className="text-zinc-500">Outros Lotes em Linha:</span>
          {extraList.map((ext) => (
            <button
              key={ext.name}
              onClick={() => onSelectProductFilter && onSelectProductFilter(ext.name)}
              className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-600 transition cursor-pointer"
            >
              {ext.name}: <strong className="text-white">{ext.count} reator(es)</strong> ({ext.vol} L)
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

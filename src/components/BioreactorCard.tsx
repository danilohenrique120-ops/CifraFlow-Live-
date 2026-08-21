/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bioreactor } from '../types';
import { Database, User, Clock, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, Bell } from 'lucide-react';
import { checkScheduleAlert } from '../utils/scheduleAlert';

interface BioreactorCardProps {
  bioreactor: Bioreactor;
  onClick: () => void;
  compact?: boolean;
}

export const getProductColorStyle = (
  productName?: string,
  isAlert: boolean = false,
  isOverdue: boolean = false
) => {
  if (!productName || !productName.trim()) return null;
  const p = productName.toLowerCase().trim();

  // If overdue, force RED border glow for maximum visual alert
  if (isOverdue) {
    let badgeBg = 'bg-red-950 text-red-300 border-red-700';
    let badgeText = 'Atrasado';
    let colorName = 'red';

    if (p.includes('dual brady')) { badgeBg = 'bg-purple-950 text-purple-300 border-purple-700'; badgeText = 'Dual Brady (Roxo)'; colorName = 'purple'; }
    else if (p.includes('dual azo')) { badgeBg = 'bg-yellow-950 text-yellow-300 border-yellow-500'; badgeText = 'Dual Azo (Amarelo)'; colorName = 'yellow'; }
    else if (p.includes('dual force')) { badgeBg = 'bg-purple-950 text-purple-300 border-purple-700'; badgeText = 'Dual Force (Roxo)'; colorName = 'purple'; }
    else if (p.includes('soja')) { badgeBg = 'bg-blue-950 text-blue-300 border-blue-700'; badgeText = 'Soja (Azul)'; colorName = 'blue'; }
    else if (p.includes('premier')) { badgeBg = 'bg-emerald-950 text-emerald-300 border-emerald-700'; badgeText = 'Premier (Verde)'; colorName = 'green'; }

    return {
      outlineGlow: 'border-red-500 ring-4 ring-red-500/90 shadow-[0_0_40px_rgba(239,68,68,1)] animate-pulse scale-[1.01]',
      badgeBg,
      badgeText,
      colorName
    };
  }

  if (p.includes('dual brady')) {
    return {
      outlineGlow: isAlert
        ? 'border-purple-400 ring-4 ring-purple-500/90 shadow-[0_0_40px_rgba(168,85,247,0.95)] animate-pulse scale-[1.01]'
        : 'border-purple-600 ring-2 ring-purple-500/80 shadow-[0_0_24px_rgba(168,85,247,0.7)] hover:shadow-[0_0_35px_rgba(168,85,247,0.9)]',
      badgeBg: 'bg-purple-950 text-purple-300 border-purple-700',
      badgeText: 'Dual Brady (Roxo)',
      colorName: 'purple'
    };
  }
  if (p.includes('dual azo')) {
    return {
      outlineGlow: isAlert
        ? 'border-yellow-300 ring-4 ring-yellow-400/90 shadow-[0_0_40px_rgba(234,179,8,1)] animate-pulse scale-[1.01]'
        : 'border-yellow-400 ring-2 ring-yellow-400/80 shadow-[0_0_24px_rgba(234,179,8,0.75)] hover:shadow-[0_0_35px_rgba(234,179,8,0.95)]',
      badgeBg: 'bg-yellow-950 text-yellow-300 border-yellow-500',
      badgeText: 'Dual Azo (Amarelo)',
      colorName: 'yellow'
    };
  }
  if (p.includes('dual force')) {
    return {
      outlineGlow: isAlert
        ? 'border-purple-400 ring-4 ring-purple-500/90 shadow-[0_0_40px_rgba(168,85,247,0.95)] animate-pulse scale-[1.01]'
        : 'border-purple-600 ring-2 ring-purple-500/80 shadow-[0_0_24px_rgba(168,85,247,0.7)] hover:shadow-[0_0_35px_rgba(168,85,247,0.9)]',
      badgeBg: 'bg-purple-950 text-purple-300 border-purple-700',
      badgeText: 'Dual Force (Roxo)',
      colorName: 'purple'
    };
  }
  if (p.includes('soja')) {
    return {
      outlineGlow: isAlert
        ? 'border-blue-400 ring-4 ring-blue-500/90 shadow-[0_0_40px_rgba(59,130,246,0.95)] animate-pulse scale-[1.01]'
        : 'border-blue-500 ring-2 ring-blue-500/80 shadow-[0_0_24px_rgba(59,130,246,0.7)] hover:shadow-[0_0_35px_rgba(59,130,246,0.9)]',
      badgeBg: 'bg-blue-950 text-blue-300 border-blue-700',
      badgeText: 'Soja (Azul)',
      colorName: 'blue'
    };
  }
  if (p.includes('premier')) {
    return {
      outlineGlow: isAlert
        ? 'border-emerald-400 ring-4 ring-emerald-500/90 shadow-[0_0_40px_rgba(168,85,247,0.95)] animate-pulse scale-[1.01]'
        : 'border-emerald-500 ring-2 ring-emerald-500/80 shadow-[0_0_24px_rgba(16,185,129,0.7)] hover:shadow-[0_0_35px_rgba(16,185,129,0.9)]',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-700',
      badgeText: 'Premier (Verde)',
      colorName: 'green'
    };
  }
  return null;
};

export const BioreactorCard: React.FC<BioreactorCardProps> = ({ bioreactor, onClick, compact = true }) => {
  const {
    name,
    capacity,
    description,
    productName,
    operator,
    operatorActivity,
    status,
    fillLevel,
    inoculationTime,
    inoculationRealizado,
    inoculationDone,
    transferTime,
    transferRealizado,
    transferDone,
    releaseTime,
    releaseRealizado,
    releaseDone,
  } = bioreactor;

  // Check if any schedule time (Inoculação, Transferência, Liberação) is near today or overdue
  const scheduleAlert = checkScheduleAlert(bioreactor);
  const isAlert = !!scheduleAlert;
  const isOverdue = scheduleAlert?.isOverdue ?? false;

  // Determine LED and glow colors based on status
  let ledClass = 'bg-zinc-400 shadow-[0_0_8px_#a1a1aa]';
  let statusText = 'Vazio';
  let statusBadgeColor = 'bg-zinc-100 text-zinc-700 border-zinc-200';
  let liquidColor = 'from-sky-700/30 to-sky-500/40';

  let defaultGlow = 'hover:shadow-[0_0_15px_rgba(161,161,170,0.4)] border-zinc-300';
  if (status === 'aguardando') {
    ledClass = 'bg-sky-500 shadow-[0_0_10px_#0284c7] animate-pulse';
    statusText = 'Em preparo';
    statusBadgeColor = 'bg-sky-50 text-sky-700 border-sky-200';
    liquidColor = 'from-sky-400 via-sky-500 to-sky-300';
    defaultGlow = 'hover:shadow-[0_0_18px_rgba(14,165,233,0.5)] border-sky-400';
  } else if (status === 'aguardando_inoculo') {
    ledClass = 'bg-orange-500 shadow-[0_0_12px_#f97316] animate-pulse';
    statusText = 'Aguardando inóculo';
    statusBadgeColor = 'bg-orange-50 text-orange-800 border-orange-200';
    liquidColor = 'from-orange-400 via-amber-400 to-yellow-300';
    defaultGlow = 'hover:shadow-[0_0_20px_rgba(249,115,22,0.5)] border-orange-400';
  } else if (status === 'andamento') {
    ledClass = 'bg-yellow-500 shadow-[0_0_12px_#d97706] animate-pulse';
    statusText = 'Em cultivo';
    statusBadgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    liquidColor = 'from-amber-500 via-yellow-400 to-amber-300';
    defaultGlow = 'hover:shadow-[0_0_22px_rgba(234,179,8,0.5)] border-amber-400';
  } else if (status === 'concluido') {
    ledClass = 'bg-emerald-500 shadow-[0_0_14px_#059669]';
    statusText = 'Liberado p/ envase';
    statusBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    liquidColor = 'from-emerald-600 via-emerald-500 to-teal-400';
    defaultGlow = 'hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] border-emerald-500';
  }

  let outlineGlow = defaultGlow;
  if (isOverdue) {
    outlineGlow = 'border-red-500 ring-4 ring-red-500/90 shadow-[0_0_40px_rgba(239,68,68,1)] animate-pulse scale-[1.01]';
  } else if (isAlert) {
    outlineGlow = 'border-amber-400 ring-4 ring-amber-400/90 shadow-[0_0_40px_rgba(245,158,11,0.9)] animate-pulse scale-[1.01]';
  }

  const productStyle = getProductColorStyle(productName, isAlert, isOverdue);
  const activeOutline = productStyle ? productStyle.outlineGlow : outlineGlow;

  // -------------------------------------------------------------
  // A) COMPACT HORIZONTAL SPLIT CARD (FOR SINGLE SCREEN 16-MATRIX)
  // -------------------------------------------------------------
  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`relative flex flex-col justify-between p-2 sm:p-2.5 cursor-pointer rounded-xl bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-300 border-2 ${activeOutline} transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] select-none`}
        style={{
          backgroundImage: 'linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 40%, #d4d4d8 100%)',
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 3px 6px -1px rgba(0,0,0,0.12)'
        }}
      >
        {/* Top Mini Header: Name + Capacity + Alerts */}
        <div className="flex items-center justify-between gap-1 pb-1 mb-1 border-b border-zinc-300/80">
          <div className="flex items-center space-x-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${ledClass} border border-white/50 block`} />
            <span className="font-mono text-sm font-black tracking-wide text-zinc-900">{name}</span>
            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[9.5px] font-mono font-bold text-zinc-100 shadow-inner">
              {capacity}L
            </span>
          </div>

          <div className="flex items-center gap-1">
            {scheduleAlert && (
              <span
                className={`px-1.5 py-0.2 rounded font-black text-[8.5px] font-mono uppercase tracking-wider flex items-center gap-1 ${
                  isOverdue
                    ? 'bg-red-600 text-white shadow animate-pulse'
                    : 'bg-amber-400 text-zinc-950 animate-pulse'
                }`}
              >
                <Bell className="w-2.5 h-2.5" />
                {isOverdue ? 'ATRASADO' : 'ATENÇÃO'}
              </span>
            )}
            {productStyle && (
              <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-mono font-black border uppercase ${productStyle.badgeBg}`}>
                {productStyle.colorName === 'blue' && 'AZUL'}
                {productStyle.colorName === 'purple' && 'ROXO'}
                {productStyle.colorName === 'yellow' && 'AMARELO'}
                {productStyle.colorName === 'green' && 'VERDE'}
              </span>
            )}
          </div>
        </div>

        {/* Card Body: Split Left (Mini Steel Vessel) & Right (Digital LCD Panel) */}
        <div className="flex items-center gap-2">
          
          {/* LEFT: Mini Stainless Steel Reactor Vessel */}
          <div className="shrink-0 flex flex-col items-center justify-center w-8">
            <div className="w-6 h-1 bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-500 rounded-t border-t border-r border-l border-zinc-500" />
            <div className="relative w-8 h-20 rounded-md bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-400 border border-zinc-500 shadow-inner flex items-center justify-center overflow-hidden">
              {/* Sight Glass Tube */}
              <div className="absolute w-3.5 h-[90%] bg-zinc-950/90 rounded-sm border border-zinc-600/70 overflow-hidden flex flex-col justify-end">
                {/* Liquid Level Column */}
                <div
                  className={`w-full bg-gradient-to-t ${liquidColor} transition-all duration-700 relative`}
                  style={{ height: `${fillLevel}%` }}
                >
                  {fillLevel > 0 && <div className="absolute top-0 left-0 right-0 h-0.5 bg-white/60 animate-pulse" />}
                  {status === 'andamento' && fillLevel > 0 && (
                    <span className="absolute bottom-[20%] left-[20%] w-1 h-1 rounded-full bg-white/40 animate-bounce" />
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-0.5">
              <div className="w-1 h-1.5 bg-zinc-500 rounded-b" />
              <div className="w-1 h-1.5 bg-zinc-500 rounded-b" />
            </div>
          </div>

          {/* RIGHT: High-Density Industrial Process LCD Display */}
          <div className="flex-1 min-w-0 px-2 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-lime-400 font-mono shadow-inner select-text">
            
            {/* Row 1: Product Name & Status */}
            <div className="flex items-center justify-between gap-1 border-b border-zinc-800 pb-1 mb-1">
              <div className="truncate text-xs font-black text-slate-100" title={productName || 'Vaso Disponível'}>
                {productName || <span className="text-zinc-500 italic font-normal text-[11px]">Standby / Disponível</span>}
              </div>
              <span className={`text-[10px] font-black shrink-0 ${status === 'concluido' ? 'text-emerald-400' : status === 'andamento' ? 'text-amber-400' : status === 'aguardando_inoculo' ? 'text-orange-400' : status === 'aguardando' ? 'text-sky-400' : 'text-zinc-400'}`}>
                {statusText}
              </span>
            </div>

            {/* Row 2: Operator */}
            <div className="flex items-center justify-between text-[10px] text-zinc-300 gap-1 mb-1">
              <span className="flex items-center gap-1 min-w-0">
                <User className="w-3 h-3 text-zinc-400 shrink-0" />
                <span className="truncate text-slate-100 font-bold text-[10.5px]">{operator || 'Sem Operador'}</span>
              </span>
              {description && (
                <span className="truncate text-[9.5px] text-zinc-400 max-w-[120px]" title={description}>
                  {description}
                </span>
              )}
            </div>

            {/* Row 3: Tarefa Definida (Dedicated Highlight Box) */}
            <div className="mb-1 text-[9px] text-amber-300/95 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40 truncate font-mono" title={operatorActivity || 'Sem tarefa definida'}>
              <span className="text-amber-400 font-black mr-1 text-[8.5px]">TAREFA:</span>
              <span className={operatorActivity ? 'text-zinc-100 font-medium' : 'text-zinc-500 italic'}>
                {operatorActivity || 'Sem tarefa definida'}
              </span>
            </div>

            {/* Row 3: 3-Stage Schedule Badges (Inoculação, Transf, Liberação) */}
            <div className="grid grid-cols-3 gap-1 pt-1 border-t border-zinc-800/80 text-[8.5px] font-mono text-center">
              <div className={`p-1 rounded ${inoculationDone ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300' : 'bg-zinc-950/80 border border-zinc-800/80 text-zinc-300'}`}>
                <div className="flex items-center justify-between text-[7px] text-zinc-400 border-b border-zinc-800/60 pb-0.5 mb-0.5">
                  <span className="font-bold uppercase truncate">Inoc</span>
                  <span className="text-zinc-500 font-bold">Prev</span>
                </div>
                <div className="truncate font-bold text-[8.5px] text-zinc-100" title={inoculationTime || '--:--'}>
                  {inoculationTime || '--:--'}
                </div>
                {inoculationDone ? (
                  <div className="text-emerald-400 font-black flex items-center justify-center gap-0.5 text-[8px] truncate mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> {inoculationRealizado || 'OK'}
                  </div>
                ) : inoculationRealizado ? (
                  <div className="text-amber-300 font-bold truncate text-[8px] mt-0.5">R: {inoculationRealizado}</div>
                ) : null}
              </div>

              <div className={`p-1 rounded ${transferDone ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300' : 'bg-zinc-950/80 border border-zinc-800/80 text-zinc-300'}`}>
                <div className="flex items-center justify-between text-[7px] text-zinc-400 border-b border-zinc-800/60 pb-0.5 mb-0.5">
                  <span className="font-bold uppercase truncate">Transf</span>
                  <span className="text-zinc-500 font-bold">Prev</span>
                </div>
                <div className="truncate font-bold text-[8.5px] text-zinc-100" title={transferTime || '--:--'}>
                  {transferTime || '--:--'}
                </div>
                {transferDone ? (
                  <div className="text-emerald-400 font-black flex items-center justify-center gap-0.5 text-[8px] truncate mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> {transferRealizado || 'OK'}
                  </div>
                ) : transferRealizado ? (
                  <div className="text-amber-300 font-bold truncate text-[8px] mt-0.5">R: {transferRealizado}</div>
                ) : null}
              </div>

              <div className={`p-1 rounded ${releaseDone ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300' : 'bg-zinc-950/80 border border-zinc-800/80 text-zinc-300'}`}>
                <div className="flex items-center justify-between text-[7px] text-zinc-400 border-b border-zinc-800/60 pb-0.5 mb-0.5">
                  <span className="font-bold uppercase truncate">Liberação</span>
                  <span className="text-zinc-500 font-bold">Prev</span>
                </div>
                <div className="truncate font-bold text-[8.5px] text-zinc-100" title={releaseTime || '--:--'}>
                  {releaseTime || '--:--'}
                </div>
                {releaseDone ? (
                  <div className="text-emerald-400 font-black flex items-center justify-center gap-0.5 text-[8px] truncate mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> {releaseRealizado || 'OK'}
                  </div>
                ) : releaseRealizado ? (
                  <div className="text-amber-300 font-bold truncate text-[8px] mt-0.5">R: {releaseRealizado}</div>
                ) : null}
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // B) EXPANDED CARD (VERTICAL VIEW)
  // -------------------------------------------------------------
  return (
    <div
      onClick={onClick}
      className={`relative flex flex-col justify-between p-3.5 sm:p-4 cursor-pointer rounded-xl bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-300 border-2 ${activeOutline} transition-all duration-300 shadow-md h-full active:scale-[0.98] select-none`}
      style={{
        backgroundImage: 'linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 40%, #d4d4d8 100%)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.8), 0 4px 8px -2px rgba(0,0,0,0.12), 0 2px 4px -2px rgba(0,0,0,0.08)'
      }}
    >
      {/* Metallic Specular Reflection Layer */}
      <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
        <div className="absolute top-0 -left-1/2 w-[200%] h-[150%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-12 transform origin-top" />
      </div>

      {/* Schedule Attention / Overdue Alert Banner if due or past */}
      {scheduleAlert && (
        <div
          className={`relative z-10 mb-2 px-2 py-1 rounded-lg font-mono text-[10.5px] font-black flex items-center justify-between gap-1 shadow-sm transition-all ${
            isOverdue
              ? 'bg-red-950/95 border-2 border-red-500 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.85)] animate-pulse'
              : 'bg-amber-950/95 border border-amber-400/90 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse'
          }`}
        >
          <span className="flex items-center gap-1.5 truncate">
            <Bell
              className={`w-3.5 h-3.5 shrink-0 animate-bounce ${
                isOverdue ? 'text-red-400' : 'text-amber-400'
              }`}
            />
            <span className="uppercase tracking-wide truncate">{scheduleAlert.label}</span>
          </span>
          <span
            className={`px-1.5 py-0.2 rounded font-black text-[9px] shrink-0 uppercase tracking-wider ${
              isOverdue ? 'bg-red-600 text-white shadow' : 'bg-amber-400 text-zinc-950'
            }`}
          >
            {isOverdue ? 'ATRASADO' : 'PRÓXIMO'}
          </span>
        </div>
      )}

      {/* Header with LED Beacon & Identifier */}
      <div className="relative z-10 flex items-center justify-between pb-1">
        <div className="flex items-center space-x-2">
          {/* LED Indicator */}
          <span className={`w-3 h-3 rounded-full ${ledClass} border border-white/50 block`} />
          <span className="font-mono text-base font-black tracking-wider text-zinc-900">{name}</span>
        </div>
        
        {/* Capacity Plate (Stamped Industrial Look) */}
        <div className="px-2 py-0.5 rounded bg-zinc-800/95 border border-zinc-600 shadow-inner">
          <span className="font-mono text-xs font-bold text-zinc-100 tracking-tight">
            {capacity} L
          </span>
        </div>
      </div>

      {/* Reactor Structural Schematic Drawing (Optimized compact height) */}
      <div className="relative z-10 my-2 flex items-center justify-center space-x-3">
        
        {/* Left Side Piping */}
        <div className="flex flex-col space-y-3 justify-center items-end py-1 -mr-1">
          <div className="w-4 h-1 bg-zinc-400 border border-zinc-500 rounded-l" />
          <div className="w-5 h-1 bg-zinc-400 border border-zinc-500 rounded-l" />
        </div>

        {/* The Bioreactor Vessel (Metallic Tank) */}
        <div className="relative flex flex-col items-center">
          {/* Top Inlet Cap */}
          <div className="w-12 h-2 bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-500 rounded-t border-t border-r border-l border-zinc-500 shadow-sm" />
          
          {/* Main Boiler Tank Body */}
          <div className="relative w-24 h-32 rounded-xl bg-gradient-to-r from-zinc-300 via-zinc-100 to-zinc-400 border-2 border-zinc-500 shadow-inner flex items-center justify-center overflow-hidden">
            
            {/* Metallic Casing Ring Gaskets */}
            <div className="absolute top-1/4 left-0 right-0 h-0.5 bg-zinc-400/80 border-b border-zinc-500/30" />
            <div className="absolute top-2/4 left-0 right-0 h-0.5 bg-zinc-400/80 border-b border-zinc-500/30" />
            <div className="absolute top-3/4 left-0 right-0 h-0.5 bg-zinc-400/80 border-b border-zinc-500/30" />

            {/* Simulated Pressure Gauge on Tank surface */}
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-zinc-200 border border-zinc-500 scale-90 flex items-center justify-center text-[6px] font-mono font-black text-zinc-700 shadow-inner">
              <span className="absolute w-3 h-0.5 bg-red-600 origin-center rotate-45" />
            </div>

            {/* Transparent Level Gauge (Physical liquid sight glass glass) */}
            <div className="absolute w-7 h-[88%] bg-zinc-950/90 rounded-md border border-zinc-600/60 overflow-hidden flex flex-col justify-end">
              
              {/* Grid tick increments inside the glass */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between py-1 opacity-25 z-20">
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
                <div className="w-full h-[1px] bg-white" />
              </div>

              {/* Liquid Column */}
              <div
                className={`w-full bg-gradient-to-t ${liquidColor} transition-all duration-1000 ease-in-out relative`}
                style={{ height: `${fillLevel}%` }}
              >
                {/* Floating Wave/Shimmer Highlight */}
                {fillLevel > 0 && (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/60 animate-pulse" />
                )}

                {/* Micro Bubbles Animation inside bioprocess */}
                {status === 'andamento' && fillLevel > 0 && (
                  <div className="absolute inset-x-0 bottom-0 top-1 overflow-hidden opacity-80 z-10">
                    <span className="absolute bottom-[10%] left-[20%] w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '3s' }} />
                    <span className="absolute bottom-[40%] left-[60%] w-1 h-1 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '2.5s' }} />
                    <span className="absolute bottom-[70%] left-[30%] w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: '1.4s', animationDuration: '1.8s' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Outlet Pipes / Legs */}
          <div className="flex space-x-12 mt-0.5">
            <div className="w-1.5 h-3 bg-zinc-500 rounded-b" />
            <div className="w-1.5 h-3 bg-zinc-500 rounded-b" />
          </div>
        </div>

        {/* Right Side Piping with mini valve wheel */}
        <div className="flex flex-col space-y-4 justify-center items-start py-1 -ml-1">
          <div className="w-4 h-1 bg-zinc-400 border border-zinc-500 rounded-r" />
          <div className="relative w-5 h-1 bg-zinc-400 border border-zinc-500 rounded-r">
            {/* Valve Circular Wheel handles */}
            <div className="absolute -top-2 left-1 w-3.5 h-5 rounded bg-zinc-700 border border-zinc-500 hover:rotate-45 transition transform" />
          </div>
        </div>
      </div>

      {/* Process Readout Panel (Integrated LCD display) */}
      <div className="relative z-10 px-3 py-2.5 rounded-lg bg-zinc-900 border border-zinc-750 text-lime-400/90 font-mono shadow-inner select-text">
        <div className="flex items-center justify-between border-b border-lime-900/30 pb-1 mb-1.5 text-xs uppercase tracking-wider text-zinc-400">
          <span>Status:</span>
          <span className={`font-bold ${status === 'concluido' ? 'text-emerald-400' : status === 'andamento' ? 'text-amber-400' : status === 'aguardando_inoculo' ? 'text-orange-400' : status === 'aguardando' ? 'text-sky-400' : 'text-zinc-400'}`}>
            {statusText}
          </span>
        </div>

        {productName ? (
          <div>
            <div className="flex items-center justify-between gap-1">
              <div className="truncate text-sm font-black text-slate-100" title={productName}>
                {productName}
              </div>
              {productStyle && (
                <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-black border ${productStyle.badgeBg}`}>
                  {productStyle.colorName === 'blue' && 'AZUL'}
                  {productStyle.colorName === 'purple' && 'ROXO'}
                  {productStyle.colorName === 'yellow' && 'AMARELO'}
                  {productStyle.colorName === 'green' && 'VERDE'}
                </span>
              )}
            </div>
            <div className="truncate text-xs font-medium text-zinc-300 mt-0.5" title={description || 'Sem descrição'}>
              {description || 'Pronto / Aguardando'}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-zinc-500 h-8 text-xs italic">
            <span>Standby</span>
            <span>Vaso Disponível</span>
          </div>
        )}

        {/* Interactive progress level overlay reading */}
        <div className="mt-2 pt-1.5 border-t border-zinc-850 text-xs text-zinc-300 flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5 w-full">
              <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate text-slate-100 font-bold">{operator || 'Sem Operador'}</span>
            </span>
          </div>
          {operatorActivity ? (
            <div className="text-xs text-amber-300/90 bg-amber-950/30 px-2 py-1 rounded border border-amber-900/30 truncate" title={operatorActivity}>
              <span className="text-amber-400 font-black mr-1 text-[10px]">TAREFA:</span>
              <span className="text-zinc-100 font-medium">{operatorActivity}</span>
            </div>
          ) : (
            <div className="text-xs text-zinc-500 italic px-1">
              Sem tarefa definida
            </div>
          )}

          {/* Stage Schedule Strip */}
          {(inoculationTime || transferTime || releaseTime || inoculationRealizado || transferRealizado || releaseRealizado) && (
            <div className="mt-1.5 pt-1.5 border-t border-zinc-800 text-[10px] font-mono grid grid-cols-3 gap-1">
              <div className={`p-1 rounded ${inoculationDone ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300' : 'bg-zinc-950/80 border border-zinc-800 text-zinc-300'}`}>
                <div className="flex items-center justify-between text-[7.5px] text-zinc-400 border-b border-zinc-800/60 pb-0.5 mb-0.5">
                  <span className="font-bold uppercase truncate">Inoculação</span>
                  <span className="text-zinc-500 font-bold">Prev</span>
                </div>
                <div className="truncate font-bold text-[9px] text-zinc-100" title={inoculationTime || '--:--'}>
                  {inoculationTime || '--:--'}
                </div>
                {inoculationDone ? (
                  <div className="text-emerald-400 font-black flex items-center justify-center gap-0.5 text-[8.5px] truncate mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> {inoculationRealizado || 'OK'}
                  </div>
                ) : inoculationRealizado ? (
                  <div className="text-amber-300 font-bold truncate text-[8.5px] mt-0.5">R: {inoculationRealizado}</div>
                ) : null}
              </div>

              <div className={`p-1 rounded ${transferDone ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300' : 'bg-zinc-950/80 border border-zinc-800 text-zinc-300'}`}>
                <div className="flex items-center justify-between text-[7.5px] text-zinc-400 border-b border-zinc-800/60 pb-0.5 mb-0.5">
                  <span className="font-bold uppercase truncate">Transf / Adição</span>
                  <span className="text-zinc-500 font-bold">Prev</span>
                </div>
                <div className="truncate font-bold text-[9px] text-zinc-100" title={transferTime || '--:--'}>
                  {transferTime || '--:--'}
                </div>
                {transferDone ? (
                  <div className="text-emerald-400 font-black flex items-center justify-center gap-0.5 text-[8.5px] truncate mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> {transferRealizado || 'OK'}
                  </div>
                ) : transferRealizado ? (
                  <div className="text-amber-300 font-bold truncate text-[8.5px] mt-0.5">R: {transferRealizado}</div>
                ) : null}
              </div>

              <div className={`p-1 rounded ${releaseDone ? 'bg-emerald-950/80 border border-emerald-600/70 text-emerald-300' : 'bg-zinc-950/80 border border-zinc-800 text-zinc-300'}`}>
                <div className="flex items-center justify-between text-[7.5px] text-zinc-400 border-b border-zinc-800/60 pb-0.5 mb-0.5">
                  <span className="font-bold uppercase truncate">Liberação</span>
                  <span className="text-zinc-500 font-bold">Prev</span>
                </div>
                <div className="truncate font-bold text-[9px] text-zinc-100" title={releaseTime || '--:--'}>
                  {releaseTime || '--:--'}
                </div>
                {releaseDone ? (
                  <div className="text-emerald-400 font-black flex items-center justify-center gap-0.5 text-[8.5px] truncate mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 shrink-0" /> {releaseRealizado || 'OK'}
                  </div>
                ) : releaseRealizado ? (
                  <div className="text-amber-300 font-bold truncate text-[8.5px] mt-0.5">R: {releaseRealizado}</div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

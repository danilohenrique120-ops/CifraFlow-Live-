/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Bioreactor, BioreactorStatus } from '../types';
import { getProductColorStyle } from './BioreactorCard';
import { X, Save, RotateCcw, ShieldCheck, Thermometer, Beaker, Clock, Check, CheckCircle2 } from 'lucide-react';

interface BioreactorModalProps {
  bioreactor: Bioreactor | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBioreactor: Bioreactor) => void;
}

export const BioreactorModal: React.FC<BioreactorModalProps> = ({
  bioreactor,
  isOpen,
  onClose,
  onSave,
}) => {
  // Local edit states
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');
  
  // Schedule 3 stages: Planejado, Realizado, Concluído
  const [inoculationTime, setInoculationTime] = useState('');
  const [inoculationRealizado, setInoculationRealizado] = useState('');
  const [inoculationDone, setInoculationDone] = useState(false);

  const [transferTime, setTransferTime] = useState('');
  const [transferRealizado, setTransferRealizado] = useState('');
  const [transferDone, setTransferDone] = useState(false);

  const [releaseTime, setReleaseTime] = useState('');
  const [releaseRealizado, setReleaseRealizado] = useState('');
  const [releaseDone, setReleaseDone] = useState(false);

  const [operator, setOperator] = useState('');
  const [operatorActivity, setOperatorActivity] = useState('');
  const [status, setStatus] = useState<BioreactorStatus>('vazio');
  const [fillLevel, setFillLevel] = useState(0);

  // Helper for current HH:MM time
  const getNowTimeString = () => {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  // Sync state values on bioreactor shift selection
  useEffect(() => {
    if (bioreactor) {
      setDescription(bioreactor.description || '');
      setProductName(bioreactor.productName || '');

      setInoculationTime(bioreactor.inoculationTime || '');
      setInoculationRealizado(bioreactor.inoculationRealizado || '');
      setInoculationDone(!!bioreactor.inoculationDone);

      setTransferTime(bioreactor.transferTime || '');
      setTransferRealizado(bioreactor.transferRealizado || '');
      setTransferDone(!!bioreactor.transferDone);

      setReleaseTime(bioreactor.releaseTime || '');
      setReleaseRealizado(bioreactor.releaseRealizado || '');
      setReleaseDone(!!bioreactor.releaseDone);

      setOperator(bioreactor.operator || '');
      setOperatorActivity(bioreactor.operatorActivity || '');
      setStatus(bioreactor.status);
      setFillLevel(bioreactor.fillLevel);
    }
  }, [bioreactor]);

  // Product Color Style
  const currentProductStyle = getProductColorStyle(productName);

  if (!isOpen || !bioreactor) return null;

  // Handles updating the fill level preset automatically when changing the status
  const handleStatusChange = (newStatus: BioreactorStatus) => {
    setStatus(newStatus);
    if (newStatus === 'vazio') {
      setFillLevel(0);
    } else if (newStatus === 'aguardando' && fillLevel === 0) {
      setFillLevel(20);
    } else if (newStatus === 'andamento' && (fillLevel === 0 || fillLevel === 100)) {
      setFillLevel(50);
    } else if (newStatus === 'concluido') {
      setFillLevel(100);
    }
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSave({
      ...bioreactor,
      description,
      productName,
      inoculationTime,
      inoculationRealizado,
      inoculationDone,
      transferTime,
      transferRealizado,
      transferDone,
      releaseTime,
      releaseRealizado,
      releaseDone,
      operator,
      operatorActivity,
      status,
      fillLevel,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  // Erases all input fields quickly to reset the station
  const handleReset = () => {
    setDescription('');
    setProductName('');

    setInoculationTime('');
    setInoculationRealizado('');
    setInoculationDone(false);

    setTransferTime('');
    setTransferRealizado('');
    setTransferDone(false);

    setReleaseTime('');
    setReleaseRealizado('');
    setReleaseDone(false);

    setOperator('');
    setOperatorActivity('');
    setStatus('vazio');
    setFillLevel(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm transition-opacity">
      
      {/* Touch Screen Terminal Box (Stainless steel aesthetic panel outline) */}
      <div 
        className="relative w-full max-w-2xl bg-zinc-100 rounded-2xl border-4 border-zinc-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.8)'
        }}
      >
        
        {/* Terminal Titlebar (Cast Iron Bezel Strip) */}
        <div className="bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-900 px-6 py-4 border-b-2 border-zinc-500 flex items-center justify-between text-zinc-100 gap-4">
          <div className="flex items-center space-x-3 min-w-0">
            <h3 className="font-sans font-bold text-base sm:text-lg tracking-tight truncate">
              Parâmetros: {bioreactor.name}
            </h3>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-600 font-bold text-xs uppercase cursor-pointer transition flex items-center gap-1.5"
              title="Fechar Janela"
            >
              <X className="w-3.5 h-3.5" />
              <span>Fechar</span>
            </button>
          </div>
        </div>

        {/* Info Ribbon with station info */}
        <div className="bg-zinc-800 text-zinc-300 font-mono text-xs px-6 py-2.5 border-b border-zinc-600 flex justify-between items-center bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px]">
          <span className="flex items-center gap-1.5 text-zinc-300 font-semibold">
            <Beaker className="w-4 h-4 text-sky-400" />
            Capacidade Nominal: <span className="text-lime-400">{bioreactor.capacity} Litros</span>
          </span>
          <span className="text-zinc-400">ID Físico: {bioreactor.id}</span>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Status Indicator Touch Matrix */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2.5">
              Definir Situação de Produção (Status)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Vazio Preset Button */}
              <button
                type="button"
                onClick={() => handleStatusChange('vazio')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition text-center select-none ${
                  status === 'vazio'
                    ? 'bg-zinc-200 border-zinc-600 text-zinc-950 font-semibold shadow-inner'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-300 text-zinc-600'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-zinc-400 border border-white mb-1 shadow-[0_0_4px_rgba(0,0,0,0.2)]" />
                <span className="text-xs uppercase font-semibold">Vazio</span>
              </button>

              {/* Em preparo Preset Button */}
              <button
                type="button"
                onClick={() => handleStatusChange('aguardando')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition text-center select-none ${
                  status === 'aguardando'
                    ? 'bg-sky-100 border-sky-500 text-sky-900 font-semibold shadow-inner'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-300 text-zinc-600'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-sky-500 border border-white mb-1 shadow-[0_0_8px_rgba(14,165,233,0.3)]" />
                <span className="text-xs uppercase font-semibold">Em preparo</span>
              </button>

              {/* Em cultivo Preset Button */}
              <button
                type="button"
                onClick={() => handleStatusChange('andamento')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition text-center select-none ${
                  status === 'andamento'
                    ? 'bg-amber-100 border-amber-500 text-amber-900 font-semibold shadow-inner'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-300 text-zinc-600'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-white mb-1 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse" />
                <span className="text-xs uppercase font-semibold">Em cultivo</span>
              </button>

              {/* Liberado p/ envase Preset Button */}
              <button
                type="button"
                onClick={() => handleStatusChange('concluido')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition text-center select-none ${
                  status === 'concluido'
                    ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-semibold shadow-inner'
                    : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-300 text-zinc-600'
                }`}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white mb-1 shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                <span className="text-xs uppercase font-semibold">Liberado p/ envase</span>
              </button>
            </div>
          </div>



          {/* Product and Process text Inputs (2-column layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Nome do Produto / Lote
                </label>
                {currentProductStyle && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black border ${currentProductStyle.badgeBg}`}>
                    Cor: {currentProductStyle.badgeText}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Ex: Soja, Dual Brady, Dual Azo, Dual Force, Premier..."
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-zinc-350 text-zinc-900 shadow-sm focus:ring-2 focus:ring-zinc-800 focus:outline-none focus:border-zinc-850 text-sm"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-zinc-500 font-mono flex items-center pr-1 select-none">Atalhos de Produtos:</span>
                <button
                  type="button"
                  onClick={() => setProductName('Soja')}
                  className="px-2 py-0.5 text-xs font-bold bg-blue-100 hover:bg-blue-200 text-blue-900 rounded border border-blue-300 transition cursor-pointer"
                >
                  Soja (Azul)
                </button>
                <button
                  type="button"
                  onClick={() => setProductName('Dual Brady')}
                  className="px-2 py-0.5 text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 rounded border border-purple-300 transition cursor-pointer"
                >
                  Dual Brady (Roxo)
                </button>
                <button
                  type="button"
                  onClick={() => setProductName('Dual Azo')}
                  className="px-2 py-0.5 text-xs font-bold bg-yellow-100 hover:bg-yellow-200 text-yellow-950 rounded border border-yellow-400 transition cursor-pointer"
                >
                  Dual Azo (Amarelo)
                </button>
                <button
                  type="button"
                  onClick={() => setProductName('Dual Force')}
                  className="px-2 py-0.5 text-xs font-bold bg-purple-100 hover:bg-purple-200 text-purple-900 rounded border border-purple-300 transition cursor-pointer"
                >
                  Dual Force (Roxo)
                </button>
                <button
                  type="button"
                  onClick={() => setProductName('Premier')}
                  className="px-2 py-0.5 text-xs font-bold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded border border-emerald-300 transition cursor-pointer"
                >
                  Premier (Verde)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Operador Responsável (Turno)
              </label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                placeholder="Nome do Operador ou Técnico"
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-zinc-350 text-zinc-900 shadow-sm focus:ring-2 focus:ring-zinc-800 focus:outline-none focus:border-zinc-850 text-sm"
              />
            </div>

            <div className="md:col-span-2 p-3.5 bg-zinc-200/50 rounded-xl border border-zinc-300">
              <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5">
                Qual será a atividade executada (Atividade Atribuída)
              </label>
              <input
                type="text"
                value={operatorActivity}
                onChange={(e) => setOperatorActivity(e.target.value)}
                placeholder="Ex: Realizar injeção de inóculo, iniciar esterilização, retirar amostra de 12h, iniciar ciclo CIP..."
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-zinc-350 text-zinc-900 font-semibold shadow-sm focus:ring-2 focus:ring-zinc-800 focus:outline-none focus:border-zinc-850 text-sm mb-2"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="text-[10px] text-zinc-500 font-mono flex items-center pr-1 select-none">Atalhos HMI:</span>
                {[
                  'Preparar Meio de Cultura',
                  'Inoculação/Transferência',
                  'Coleta de Amostra',
                  'Checklist de Rotina',
                  'Limpeza CIP',
                  'Liberação do Envase'
                ].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setOperatorActivity(item)}
                    className="px-2.5 py-1 text-[10px] bg-zinc-300 hover:bg-zinc-400 text-zinc-800 rounded font-bold border border-zinc-450 cursor-pointer transition"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1.5">
                Descrição ou Etapa da Programação
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Ex: Multiplicação celular em regime de batelada alimentada, CIP finalizado..."
                className="w-full px-3.5 py-2 rounded-lg bg-white border border-zinc-350 text-zinc-900 shadow-sm focus:ring-2 focus:ring-zinc-800 focus:outline-none focus:border-zinc-850 text-sm resize-none"
              />
            </div>
          </div>

          {/* Stage Timestamps / Scheduling inputs */}
          <div className="p-4 bg-zinc-200/50 rounded-xl border border-zinc-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <h4 className="text-xs font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-zinc-600" />
                Cronograma de Etapas (Planejado vs Realizado)
              </h4>
              <span className="text-[10px] text-zinc-600 font-mono bg-zinc-200 px-2 py-0.5 rounded border border-zinc-350">
                💡 Marcar Concluído ou preencher o Realizado desativa os alertas de horário
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Stage 1: Inoculação */}
              <div className={`p-3 rounded-xl border transition-all ${
                inoculationDone
                  ? 'bg-emerald-500/10 border-emerald-400 shadow-sm'
                  : 'bg-white border-zinc-300'
              }`}>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={inoculationDone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setInoculationDone(checked);
                        if (checked && !inoculationRealizado) {
                          setInoculationRealizado(getNowTimeString());
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded border-zinc-400 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className={`text-xs font-bold ${inoculationDone ? 'text-emerald-900 font-black' : 'text-zinc-800'}`}>
                      Inoculação
                    </span>
                  </label>
                  {inoculationDone ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-200 text-emerald-950 border border-emerald-300 flex items-center gap-0.5">
                      <Check className="w-3 h-3 text-emerald-700" /> CONCLUÍDO
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-250">
                      PENDENTE
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Planejado (Previsto)
                    </span>
                    <input
                      type="text"
                      value={inoculationTime}
                      onChange={(e) => setInoculationTime(e.target.value)}
                      placeholder="Ex: 08:15"
                      className="w-full px-2.5 py-1.5 rounded-md bg-zinc-50 border border-zinc-300 text-zinc-800 focus:bg-white focus:outline-none focus:border-zinc-800 text-xs text-center font-mono font-bold shadow-sm"
                    />
                  </div>

                  <div className="pt-2 border-t border-zinc-200/80">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Realizado (Executado)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setInoculationRealizado(getNowTimeString());
                          setInoculationDone(true);
                        }}
                        className="text-[9px] font-bold text-emerald-800 hover:underline cursor-pointer"
                      >
                        Registrar Agora
                      </button>
                    </div>
                    <input
                      type="text"
                      value={inoculationRealizado}
                      onChange={(e) => {
                        setInoculationRealizado(e.target.value);
                        if (e.target.value.trim() !== '') setInoculationDone(true);
                      }}
                      placeholder="Ex: 08:14"
                      className="w-full px-2.5 py-1.5 rounded-md bg-emerald-50/60 border border-emerald-300 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs text-center font-mono font-bold shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Stage 2: Transferência / Adições */}
              <div className={`p-3 rounded-xl border transition-all ${
                transferDone
                  ? 'bg-emerald-500/10 border-emerald-400 shadow-sm'
                  : 'bg-white border-zinc-300'
              }`}>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={transferDone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setTransferDone(checked);
                        if (checked && !transferRealizado) {
                          setTransferRealizado(getNowTimeString());
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded border-zinc-400 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className={`text-xs font-bold ${transferDone ? 'text-emerald-900 font-black' : 'text-zinc-800'}`}>
                      Transferência / Adição
                    </span>
                  </label>
                  {transferDone ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-200 text-emerald-950 border border-emerald-300 flex items-center gap-0.5">
                      <Check className="w-3 h-3 text-emerald-700" /> CONCLUÍDO
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-250">
                      PENDENTE
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Planejado (Previsto)
                    </span>
                    <input
                      type="text"
                      value={transferTime}
                      onChange={(e) => setTransferTime(e.target.value)}
                      placeholder="Ex: 16:30"
                      className="w-full px-2.5 py-1.5 rounded-md bg-zinc-50 border border-zinc-300 text-zinc-800 focus:bg-white focus:outline-none focus:border-zinc-800 text-xs text-center font-mono font-bold shadow-sm"
                    />
                  </div>

                  <div className="pt-2 border-t border-zinc-200/80">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Realizado (Executado)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTransferRealizado(getNowTimeString());
                          setTransferDone(true);
                        }}
                        className="text-[9px] font-bold text-emerald-800 hover:underline cursor-pointer"
                      >
                        Registrar Agora
                      </button>
                    </div>
                    <input
                      type="text"
                      value={transferRealizado}
                      onChange={(e) => {
                        setTransferRealizado(e.target.value);
                        if (e.target.value.trim() !== '') setTransferDone(true);
                      }}
                      placeholder="Ex: 16:35"
                      className="w-full px-2.5 py-1.5 rounded-md bg-emerald-50/60 border border-emerald-300 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs text-center font-mono font-bold shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Stage 3: Liberação p/ Envase */}
              <div className={`p-3 rounded-xl border transition-all ${
                releaseDone
                  ? 'bg-emerald-500/10 border-emerald-400 shadow-sm'
                  : 'bg-white border-zinc-300'
              }`}>
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={releaseDone}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setReleaseDone(checked);
                        if (checked && !releaseRealizado) {
                          setReleaseRealizado(getNowTimeString());
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded border-zinc-400 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className={`text-xs font-bold ${releaseDone ? 'text-emerald-900 font-black' : 'text-zinc-800'}`}>
                      Liberação p/ Envase
                    </span>
                  </label>
                  {releaseDone ? (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-200 text-emerald-950 border border-emerald-300 flex items-center gap-0.5">
                      <Check className="w-3 h-3 text-emerald-700" /> CONCLUÍDO
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-zinc-100 text-zinc-500 border border-zinc-250">
                      PENDENTE
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                      Planejado (Previsto)
                    </span>
                    <input
                      type="text"
                      value={releaseTime}
                      onChange={(e) => setReleaseTime(e.target.value)}
                      placeholder="Ex: 20:00"
                      className="w-full px-2.5 py-1.5 rounded-md bg-zinc-50 border border-zinc-300 text-zinc-800 focus:bg-white focus:outline-none focus:border-zinc-800 text-xs text-center font-mono font-bold shadow-sm"
                    />
                  </div>

                  <div className="pt-2 border-t border-zinc-200/80">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Realizado (Executado)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setReleaseRealizado(getNowTimeString());
                          setReleaseDone(true);
                        }}
                        className="text-[9px] font-bold text-emerald-800 hover:underline cursor-pointer"
                      >
                        Registrar Agora
                      </button>
                    </div>
                    <input
                      type="text"
                      value={releaseRealizado}
                      onChange={(e) => {
                        setReleaseRealizado(e.target.value);
                        if (e.target.value.trim() !== '') setReleaseDone(true);
                      }}
                      placeholder="Ex: 20:05"
                      className="w-full px-2.5 py-1.5 rounded-md bg-emerald-50/60 border border-emerald-300 text-emerald-950 focus:bg-white focus:outline-none focus:border-emerald-600 text-xs text-center font-mono font-bold shadow-sm"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </form>

        {/* Action Panel Footer */}
        <div className="px-6 py-4 bg-zinc-200 border-t-2 border-zinc-350 flex justify-between items-center flex-wrap gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-zinc-300 hover:bg-zinc-400 text-zinc-800 text-xs font-semibold uppercase tracking-wider rounded-lg border border-zinc-400 transition flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Zerar Estação
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-zinc-300 text-zinc-700 text-xs font-bold uppercase tracking-wider rounded-lg transition"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 text-lime-400 text-xs font-bold uppercase tracking-wider rounded-lg border border-zinc-850 transition flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              Salvar Parâmetros
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

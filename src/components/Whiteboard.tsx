/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Pencil, Save, ClipboardList, Star } from 'lucide-react';

interface WhiteboardProps {
  title?: string;
  subtitle?: string;
  headerBadgeBg?: string;
  placeholder?: string;
  emptyText?: string;
  content: string;
  onSave: (newContent: string) => void;
  updatedBy: string;
  onUpdateUser: (userName: string) => void;
  shift?: string;
  onUpdateShift?: (shiftName: string) => void;
  supervisor: string;
  onUpdateSupervisor: (supervisorName: string) => void;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  title = "Quadro de Avisos & Passagem de Turno",
  subtitle = "RELIABILIDADE OPERACIONAL • ATUALIZAÇÃO EM TEMPO REAL",
  headerBadgeBg = "bg-red-600 border-red-700",
  placeholder = "Digite aqui as anotações do dia, recomendações CGMP, observações de lotes, pendências de calibração ou avisos operacionais urgentes...",
  emptyText = "Quadro vazio. Clique em Editar para inserir anotações.",
  content,
  onSave,
  updatedBy,
  onUpdateUser,
  supervisor,
  onUpdateSupervisor,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState(content);

  const handleEditToggle = () => {
    if (isEditing) {
      onSave(tempContent);
    } else {
      setTempContent(content);
    }
    setIsEditing(!isEditing);
  };

  return (
    <div 
      className="relative flex flex-col p-6 rounded-2xl border-4 border-zinc-700 bg-white shadow-xl h-full overflow-hidden select-none"
      style={{
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.8)',
        background: 'radial-gradient(#e4e4e7 1px, #fafafa 1px)',
        backgroundSize: '24px 24px'
      }}
    >
      
      {/* Magnetic Metal Header Clip Pin */}
      <div className="absolute top-[3px] left-1/2 -translate-x-1/2 flex space-x-2">
        <div className="w-12 h-2.5 bg-gradient-to-r from-zinc-550 to-zinc-400 rounded-b border-b border-r border-l border-zinc-600 shadow" />
        <div className="w-12 h-2.5 bg-gradient-to-r from-zinc-500 to-zinc-400 rounded-b border-b border-r border-l border-zinc-600 shadow" />
      </div>

      {/* Title & Operations Coordinator Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-zinc-300 pb-4 mb-4 mt-2">
        <div className="flex items-center space-x-2.5">
          <div className={`p-1 px-1.5 ${headerBadgeBg} text-white shadow-sm rounded-sm`}>
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-sans font-extrabold text-zinc-900 tracking-tight text-lg">
              {title}
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">{subtitle}</p>
          </div>
        </div>

        {/* Tactical Status Panel for Coordinator */}
        <div className="flex items-center space-x-3 mt-3 md:mt-0 bg-zinc-200/80 p-2 rounded-lg border border-zinc-300 shadow-inner">
          {/* Responsável Field */}
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-zinc-650 uppercase font-mono tracking-wider">Responsável</label>
            <input
              type="text"
              value={supervisor}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateSupervisor(val);
                onUpdateUser(val);
              }}
              placeholder="Nome do Responsável"
              className="bg-white border border-zinc-300 text-xs font-bold text-zinc-800 px-2 py-0.5 rounded focus:outline-none focus:border-zinc-500 w-44 mt-0.5"
            />
          </div>
        </div>
      </div>

      {/* Main Board Surface */}
      <div className="flex-1 flex flex-col relative">
        
        {/* Decorative Fake Marker Scribble Highlight or Logo */}
        <div className="absolute right-4 top-2 pointer-events-none opacity-10 select-none hidden md:block">
          <Star className="w-16 h-16 text-zinc-600 animate-pulse fill-zinc-600" />
        </div>

        {isEditing ? (
          <div className="flex-1 flex flex-col space-y-3">
            <textarea
              value={tempContent}
              onChange={(e) => setTempContent(e.target.value)}
              className="w-full h-[300px] md:h-[380px] p-4 rounded-xl border border-zinc-400 bg-zinc-50 font-mono text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-800 focus:border-zinc-800 resize-y leading-relaxed"
              placeholder={placeholder}
            />
            {/* Quick Signature */}
            <div className="flex items-center space-x-3 bg-zinc-150 p-3 rounded-lg border border-zinc-300">
              <label className="text-xs font-bold text-zinc-700 font-mono uppercase tracking-wider">Assinatura / Responsável:</label>
              <input
                type="text"
                value={supervisor || updatedBy}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateUser(val);
                  onUpdateSupervisor(val);
                }}
                placeholder="Qual responsável está registrando?"
                className="flex-1 px-3 py-1 bg-white border border-zinc-300 text-xs font-bold text-zinc-800 rounded focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4 rounded-xl border border-zinc-200 bg-white/60 font-mono text-zinc-800 text-sm whitespace-pre-wrap leading-relaxed shadow-inner overflow-y-auto max-h-[300px] md:max-h-[350px]">
            {content ? content : (
              <span className="text-zinc-400 italic">{emptyText}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="border-t border-zinc-200 pt-3 mt-4 flex justify-between items-center text-[11px] font-mono text-zinc-500">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 block animate-pulse" />
          <span>Editado por: <strong className="text-zinc-700">{supervisor || updatedBy || "Responsável Conectado"}</strong></span>
        </div>

        <button
          onClick={handleEditToggle}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-sans font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          {isEditing ? (
            <>
              <Save className="w-3.5 h-3.5 text-lime-400" />
              <span>Gravar Avisos</span>
            </>
          ) : (
            <>
              <Pencil className="w-3.5 h-3.5 text-sky-400" />
              <span>Editar Quadro</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};

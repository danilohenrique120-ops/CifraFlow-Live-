import React, { useState, useEffect } from 'react';
import { Setlist, Song } from '../types';
import { fetchSharedSetlist, prepareImportedSetlist, SharedSetlistPayload } from '../services/shareSetlistService';
import { AppLogo } from './AppLogo';
import confetti from 'canvas-confetti';
import {
  X,
  ListMusic,
  Music,
  Check,
  Download,
  AlertCircle,
  Loader2,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ImportSetlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  existingSongs: Song[];
  onImportComplete: (importedSetlist: Setlist, newSongs: Song[]) => void;
}

export const ImportSetlistModal: React.FC<ImportSetlistModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
  existingSongs,
  onImportComplete
}) => {
  const [codeInput, setCodeInput] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewPayload, setPreviewPayload] = useState<SharedSetlistPayload | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSuccess(false);
      setErrorMsg(null);
      if (initialCode) {
        setCodeInput(initialCode);
        handleFetch(initialCode);
      } else {
        setPreviewPayload(null);
      }
    }
  }, [isOpen, initialCode]);

  if (!isOpen) return null;

  const handleFetch = async (codeToFetch: string) => {
    const cleanCode = codeToFetch.trim().toUpperCase();
    if (!cleanCode) return;

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await fetchSharedSetlist(cleanCode);
      if (result) {
        setPreviewPayload(result);
      } else {
        setErrorMsg('Nenhum repertório encontrado com este código. Verifique se o código está correto (Ex: REP-742).');
        setPreviewPayload(null);
      }
    } catch (err) {
      setErrorMsg('Erro ao conectar com a nuvem para buscar o repertório.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = () => {
    if (!previewPayload) return;

    const { importedSetlist, songsToAdd } = prepareImportedSetlist(previewPayload, existingSongs);

    // Efeito comemorativo
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch (e) {}

    setIsSuccess(true);
    onImportComplete(importedSetlist, songsToAdd);

    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-none p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <AppLogo size={40} variant="circle" />
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Importar Repertório Compartilhado
              </h2>
              <p className="text-xs text-zinc-400">
                Receba a seleção de músicas, tons e cifras da sua banda
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Code Search Input if not pre-loaded */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 block">
              Código do Repertório (Ex: REP-842)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                placeholder="Ex: REP-742"
                className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider text-emerald-400 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 uppercase"
              />
              <button
                type="button"
                onClick={() => handleFetch(codeInput)}
                disabled={isLoading || !codeInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center gap-1.5"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-none" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview of Found Setlist */}
          {previewPayload && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    {previewPayload.setlist.targetEvent}
                  </span>
                  <span className="text-[11px] font-medium text-emerald-400">
                    Por: {previewPayload.authorName}
                  </span>
                </div>
                <h3 className="text-xl font-black text-white">{previewPayload.setlist.title}</h3>
                {previewPayload.setlist.description && (
                  <p className="text-xs text-zinc-400">{previewPayload.setlist.description}</p>
                )}
                <div className="pt-2 flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <Music className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{previewPayload.songs.length} músicas incluídas com tons definidos</span>
                </div>
              </div>

              {/* Song list preview */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Músicas no Repertório:
                </span>
                {previewPayload.setlist.items.map((item, idx) => {
                  const s = previewPayload.songs.find((song) => song.id === item.songId);
                  return (
                    <div
                      key={item.songId || idx}
                      className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 font-mono text-[10px] flex items-center justify-center flex-none">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <span className="font-bold text-zinc-200 block truncate">
                            {s?.title || 'Música'}
                          </span>
                          <span className="text-[10px] text-zinc-400 truncate">
                            {s?.artist || 'Artista'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-none">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold text-[11px]">
                          Tom: {item.customKey || s?.originalKey || 'C'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action to Import */}
              <button
                type="button"
                onClick={handleImport}
                disabled={isSuccess}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm shadow-xl shadow-emerald-950/50 transition flex items-center justify-center gap-2"
              >
                {isSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-zinc-950" />
                    <span>Repertório Importado com Sucesso!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Importar para Meus Repertórios</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

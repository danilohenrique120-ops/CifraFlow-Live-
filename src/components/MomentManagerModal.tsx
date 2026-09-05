import React, { useState, useMemo } from 'react';
import { Song, MusicGenre, GenreFolder } from '../types';
import {
  X,
  Plus,
  Trash2,
  Search,
  Check,
  Music,
  Layers,
  Sparkles,
  ArrowRight,
  Upload
} from 'lucide-react';

interface MomentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  moment: MusicGenre;
  allSongs: Song[];
  allFolders?: GenreFolder[];
  onUpdateSongMoment: (songId: string, newMoment: MusicGenre) => void;
  onBatchUpdateMoments: (songIdsToAdd: string[], songIdsToRemove: string[], moment: MusicGenre) => void;
  onOpenUploadModal: (presetMoment?: MusicGenre) => void;
}

const ALL_GENRES: MusicGenre[] = [
  'Pop Rock',
  'MPB',
  'Sertanejo',
  'Pagode & Samba',
  'Gospel & Louvor',
  'Forró & Piseiro',
  'Hits do Show',
  'Acústico',
  'Baladas & Românticas',
  'Abertura & Encerramento'
];

export const MomentManagerModal: React.FC<MomentManagerModalProps> = ({
  isOpen,
  onClose,
  moment,
  allSongs,
  onUpdateSongMoment,
  onBatchUpdateMoments,
  onOpenUploadModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [selectedToRemove, setSelectedToRemove] = useState<string[]>([]);

  // Current songs assigned to this genre/moment
  const currentSongs = useMemo(() => {
    return allSongs.filter(s => s.liturgicalMoment === moment);
  }, [allSongs, moment]);

  // Songs from other genres available to be added
  const otherSongs = useMemo(() => {
    return allSongs.filter(s => s.liturgicalMoment !== moment);
  }, [allSongs, moment]);

  // Filtered other songs
  const filteredOtherSongs = useMemo(() => {
    if (!searchTerm.trim()) return otherSongs;
    const term = searchTerm.toLowerCase();
    return otherSongs.filter(
      s => s.title.toLowerCase().includes(term) || s.artist.toLowerCase().includes(term)
    );
  }, [otherSongs, searchTerm]);

  if (!isOpen) return null;

  const handleToggleAdd = (songId: string) => {
    setSelectedToAdd(prev =>
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  };

  const handleToggleRemove = (songId: string) => {
    setSelectedToRemove(prev =>
      prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
    );
  };

  const handleApplyChanges = () => {
    onBatchUpdateMoments(selectedToAdd, selectedToRemove, moment);
    setSelectedToAdd([]);
    setSelectedToRemove([]);
    onClose();
  };

  const handleQuickMove = (songId: string, targetGenre: MusicGenre) => {
    onUpdateSongMoment(songId, targetGenre);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-none p-6 pb-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider mb-1">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              Gerenciador de Estilos & Blocos
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Estilo / Bloco: <span className="text-emerald-400">{moment}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Adicione, remova ou organize as músicas que compõem este gênero musical ou bloco do seu show.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex-none flex border-b border-zinc-800 bg-zinc-950/40 p-2 gap-2">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'current'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Músicas Atuais ({currentSongs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'add'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Músicas do Catálogo</span>
            {selectedToAdd.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-zinc-950 text-[10px] font-black">
                +{selectedToAdd.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'current' ? (
            /* CURRENT SONGS IN THIS GENRE */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  {currentSongs.length} {currentSongs.length === 1 ? 'música cadastrada' : 'músicas cadastradas'} neste estilo:
                </span>

                <button
                  onClick={() => {
                    onClose();
                    onOpenUploadModal(moment);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 text-xs font-bold transition border border-zinc-700"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Nova Cifra</span>
                </button>
              </div>

              {currentSongs.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800 text-zinc-400 space-y-2">
                  <Music className="w-8 h-8 text-zinc-600 mx-auto" />
                  <p className="text-sm font-semibold">Nenhuma música atribuída a este estilo ainda.</p>
                  <p className="text-xs text-zinc-500">
                    Clique na aba <strong>"Adicionar Músicas do Catálogo"</strong> acima para incluir músicas.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentSongs.map((song) => (
                    <div
                      key={song.id}
                      className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 hover:border-zinc-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${song.coverGradient} flex items-center justify-center text-white font-bold text-xs flex-none shadow-md`}>
                          <Music className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{song.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span>{song.artist}</span>
                            <span>•</span>
                            <span className="font-mono text-emerald-400 font-semibold">Tom {song.originalKey}</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Move / Remove Actions */}
                      <div className="flex items-center gap-2">
                        <select
                          value={song.liturgicalMoment}
                          onChange={(e) => handleQuickMove(song.id, e.target.value as MusicGenre)}
                          className="bg-zinc-900 border border-zinc-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 text-zinc-200 focus:outline-none focus:border-emerald-500"
                          title="Mover para outro estilo"
                        >
                          {ALL_GENRES.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => handleQuickMove(song.id, 'Hits do Show')}
                          className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 border border-zinc-800 transition"
                          title="Remover deste estilo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* ADD OTHER SONGS TO THIS GENRE */
            <div className="space-y-4">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar no catálogo por título ou artista..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {filteredOtherSongs.map((song) => {
                  const isChecked = selectedToAdd.includes(song.id);

                  return (
                    <div
                      key={song.id}
                      onClick={() => handleToggleAdd(song.id)}
                      className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/60 shadow-md'
                          : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-400 text-zinc-950 font-black'
                            : 'border-zinc-600 bg-zinc-900'
                        }`}>
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-white">{song.title}</h4>
                          <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <span>{song.artist}</span>
                            <span>•</span>
                            <span className="text-zinc-500">Atualmente em: <strong className="text-zinc-300">{song.liturgicalMoment}</strong></span>
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                        {song.originalKey}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-none p-4 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
          >
            Fechar
          </button>

          {activeTab === 'add' && (
            <button
              onClick={handleApplyChanges}
              disabled={selectedToAdd.length === 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Adicionar ({selectedToAdd.length}) ao estilo {moment}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

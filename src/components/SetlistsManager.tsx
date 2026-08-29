import React, { useState } from 'react';
import { Setlist, Song } from '../types';
import { useLiveRoom } from '../context/LiveRoomContext';
import { useAuth } from '../context/AuthContext';
import { ExportSetlistPdfModal } from './ExportSetlistPdfModal';
import {
  ListMusic,
  Plus,
  Trash2,
  Play,
  ArrowUp,
  ArrowDown,
  Calendar,
  Layers,
  Music,
  Edit2,
  Check,
  X,
  Share2,
  FileText,
  Sparkles,
  Flame,
  Radio,
  Clock,
  Search,
  Lock
} from 'lucide-react';

interface SetlistsManagerProps {
  setlists: Setlist[];
  songs: Song[];
  onSelectSong: (song: Song, setlist?: Setlist) => void;
  onCreateSetlist: (title: string, description: string, targetEvent: string) => void;
  onDeleteSetlist: (id: string) => void;
  onUpdateSetlist: (setlist: Setlist) => void;
  onOpenLiveRoomModal: () => void;
  activeSetlistId?: string | null;
  onSelectSetlistId?: (id: string) => void;
  onOpenPricing?: (reason?: string) => void;
}

const SETLIST_THEMES: Record<string, { gradient: string; iconColor: string; badge: string }> = {
  'Show / Apresentação': { gradient: 'from-purple-600 to-indigo-900', iconColor: 'text-purple-200', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  'Barzinho / Voz e Violão': { gradient: 'from-amber-600 to-orange-800', iconColor: 'text-amber-200', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  'Casamento / Cerimônia': { gradient: 'from-rose-600 to-pink-900', iconColor: 'text-rose-200', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  'Ensaio Geral': { gradient: 'from-blue-600 to-cyan-900', iconColor: 'text-blue-200', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  'Celebração / Louvor': { gradient: 'from-emerald-600 to-teal-800', iconColor: 'text-emerald-200', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  'Festa / Evento': { gradient: 'from-yellow-600 to-amber-900', iconColor: 'text-yellow-200', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  'Geral': { gradient: 'from-zinc-700 to-zinc-900', iconColor: 'text-zinc-200', badge: 'bg-zinc-700/30 text-zinc-300 border-zinc-700' }
};

const DEFAULT_GRADIENTS = [
  'from-emerald-600 to-teal-800',
  'from-indigo-600 to-purple-900',
  'from-amber-600 to-orange-800',
  'from-blue-600 to-cyan-900',
  'from-rose-600 to-pink-900'
];

export const SetlistsManager: React.FC<SetlistsManagerProps> = ({
  setlists,
  songs,
  onSelectSong,
  onCreateSetlist,
  onDeleteSetlist,
  onUpdateSetlist,
  onOpenLiveRoomModal,
  activeSetlistId,
  onSelectSetlistId,
  onOpenPricing
}) => {
  const { isInRoom, isHost, selectSong, setActiveSetlist } = useLiveRoom();
  const { isPro } = useAuth();

  const [internalSelectedId, setInternalSelectedId] = useState<string>(activeSetlistId || setlists[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEvent, setNewEvent] = useState('Show / Apresentação');
  const [editingNotesSongId, setEditingNotesSongId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Keep in sync with external selection from sidebar
  React.useEffect(() => {
    if (activeSetlistId) {
      setInternalSelectedId(activeSetlistId);
    }
  }, [activeSetlistId]);

  const selectedSetlistId = activeSetlistId || internalSelectedId || setlists[0]?.id || '';
  const currentSetlist = setlists.find(s => s.id === selectedSetlistId) || setlists[0];

  // Filter songs within current setlist by title, artist, genre, tone or notes
  const filteredSetlistItems = React.useMemo(() => {
    if (!currentSetlist) return [];
    if (!searchQuery.trim()) return currentSetlist.items;
    const q = searchQuery.toLowerCase().trim();
    return currentSetlist.items.filter(item => {
      const song = songs.find(s => s.id === item.songId);
      if (!song) return false;
      return (
        song.title.toLowerCase().includes(q) ||
        song.artist.toLowerCase().includes(q) ||
        song.liturgicalMoment.toLowerCase().includes(q) ||
        (item.notes && item.notes.toLowerCase().includes(q)) ||
        (item.customKey && item.customKey.toLowerCase().includes(q)) ||
        song.originalKey.toLowerCase().includes(q)
      );
    });
  }, [currentSetlist, searchQuery, songs]);

  const handleCardClick = (id: string) => {
    setInternalSelectedId(id);
    onSelectSetlistId?.(id);
    setSearchQuery('');
  };

  const getSetlistTheme = (setlist: Setlist, index: number) => {
    if (setlist.targetEvent && SETLIST_THEMES[setlist.targetEvent]) {
      return SETLIST_THEMES[setlist.targetEvent];
    }
    const gradient = DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
    return {
      gradient,
      iconColor: 'text-emerald-200',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    };
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateSetlist(newTitle.trim(), newDesc.trim(), newEvent.trim());
    setNewTitle('');
    setNewDesc('');
    setIsCreating(false);
  };

  const handleMoveSong = (index: number, direction: 'up' | 'down') => {
    if (!currentSetlist) return;
    const newItems = [...currentSetlist.items];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;

    newItems.forEach((item, idx) => {
      item.order = idx + 1;
    });

    onUpdateSetlist({
      ...currentSetlist,
      items: newItems,
      updatedAt: new Date().toISOString()
    });
  };

  const handleRemoveSong = (songId: string) => {
    if (!currentSetlist) return;
    const newItems = currentSetlist.items
      .filter(item => item.songId !== songId)
      .map((item, idx) => ({ ...item, order: idx + 1 }));

    onUpdateSetlist({
      ...currentSetlist,
      items: newItems,
      updatedAt: new Date().toISOString()
    });
  };

  const handleUpdateCustomKey = (songId: string, newKey: string) => {
    if (!currentSetlist) return;
    const newItems = currentSetlist.items.map(item => {
      if (item.songId === songId) {
        return { ...item, customKey: newKey };
      }
      return item;
    });

    onUpdateSetlist({
      ...currentSetlist,
      items: newItems,
      updatedAt: new Date().toISOString()
    });
  };

  const handleSaveNotes = (songId: string) => {
    if (!currentSetlist) return;
    const newItems = currentSetlist.items.map(item => {
      if (item.songId === songId) {
        return { ...item, notes: notesInput };
      }
      return item;
    });

    onUpdateSetlist({
      ...currentSetlist,
      items: newItems,
      updatedAt: new Date().toISOString()
    });
    setEditingNotesSongId(null);
  };

  const handleStartLiveSetlist = () => {
    if (!currentSetlist || currentSetlist.items.length === 0) return;
    const firstItem = currentSetlist.items[0];
    const firstSong = songs.find(s => s.id === firstItem.songId);
    if (!firstSong) return;

    setActiveSetlist(currentSetlist.id);
    if (!isInRoom) {
      onOpenLiveRoomModal();
    }
    onSelectSong(firstSong, currentSetlist);
  };

  const currentTheme = currentSetlist ? getSetlistTheme(currentSetlist, 0) : null;

  return (
    <div className="space-y-8 pb-12">
      {/* 🚀 Header & Create Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider mb-2">
            <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
            Gestão de Repertórios & Palco
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Meus Repertórios & <span className="text-emerald-400">Playlists</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
            Crie seleções de músicas organizadas para cada celebração, ajuste tons específicos por música e conduza sua banda ao vivo.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-900/40 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Repertório
        </button>
      </div>

      {/* 🎴 Horizontal Attractive Carousel of Setlists */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Repertórios Cadastrados ({setlists.length})
          </span>
          <span className="text-[11px] text-zinc-500">
            Clique em um repertório para abrir
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {setlists.map((setlist, idx) => {
            const isSelected = selectedSetlistId === setlist.id;
            const theme = getSetlistTheme(setlist, idx);

            return (
              <div
                key={setlist.id}
                onClick={() => handleCardClick(setlist.id)}
                className={`group relative p-4 rounded-3xl border transition-all cursor-pointer overflow-hidden shadow-xl flex flex-col justify-between ${
                  isSelected
                    ? 'bg-zinc-900 border-emerald-500 ring-2 ring-emerald-500/40 scale-[1.01]'
                    : 'bg-zinc-900/80 border-zinc-800/90 hover:border-zinc-700 hover:scale-[1.01]'
                }`}
              >
                {/* Decorative Top Gradient Bar */}
                <div className={`h-2.5 w-full -mx-4 -mt-4 mb-3 bg-gradient-to-r ${theme.gradient}`} />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                      {setlist.targetEvent || 'Show'}
                    </span>
                    <span className="text-xs text-zinc-400 font-mono font-bold flex items-center gap-1">
                      <Music className="w-3.5 h-3.5 text-emerald-400" />
                      {setlist.items.length} {setlist.items.length === 1 ? 'música' : 'músicas'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition truncate">
                      {setlist.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                      {setlist.description || 'Repertório personalizado para show e apresentação.'}
                    </p>
                  </div>
                </div>

                {/* Footer status / quick start */}
                <div className="pt-3 mt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {setlist.date || 'Hoje'}
                  </span>

                  <span className="text-xs font-bold text-emerald-400 group-hover:underline flex items-center gap-1">
                    <span>Ver faixas</span>
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                  </span>
                </div>
              </div>
            );
          })}

          {/* Quick Create Card */}
          <div
            onClick={() => setIsCreating(true)}
            className="p-5 rounded-3xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/60 bg-zinc-950/40 hover:bg-zinc-900/40 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 min-h-[160px]"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">+ Criar Novo Repertório</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">Monte listas com ordem personalizada</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Selected Setlist Detail Hero & Songs */}
      {currentSetlist && (
        <div className="rounded-3xl bg-zinc-900/90 border border-zinc-800/80 shadow-2xl overflow-hidden space-y-6">
          {/* Hero Banner for Selected Setlist */}
          <div className={`p-6 sm:p-8 bg-gradient-to-r ${currentTheme?.gradient || 'from-emerald-950 to-zinc-950'} border-b border-white/10 text-white relative`}>
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20">
                    {currentSetlist.targetEvent}
                  </span>
                  <span className="text-xs text-white/80 font-mono">
                    {currentSetlist.items.length} músicas programadas
                  </span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {currentSetlist.title}
                </h2>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  {currentSetlist.description || 'Repertório pronto para ensaio e execução no palco conectado.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleStartLiveSetlist}
                  className="px-5 py-3 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-950 font-black text-xs sm:text-sm shadow-xl transition flex items-center gap-2 transform hover:scale-105"
                >
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                  <span>Iniciar no Palco</span>
                </button>

                {/* 📄 Exportar PDF / Imprimir (Plano Pro) */}
                <button
                  onClick={() => {
                    if (!isPro) {
                      if (onOpenPricing) {
                        onOpenPricing('A exportação de repertórios e cifras em PDF diagramado para impressão e WhatsApp é exclusiva do Plano Pro.');
                      }
                      return;
                    }
                    setIsExportPdfOpen(true);
                  }}
                  className={`px-4 py-3 rounded-2xl font-black text-xs sm:text-sm shadow-xl transition flex items-center gap-2 border ${
                    isPro
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 border-emerald-400'
                      : 'bg-black/40 hover:bg-black/60 text-white border-white/20'
                  }`}
                  title={isPro ? "Exportar Repertório em PDF para Impressão" : "Exportar em PDF (Exclusivo Pro)"}
                >
                  <FileText className="w-4 h-4" />
                  <span>Exportar PDF</span>
                  {!isPro && <Lock className="w-3.5 h-3.5 text-amber-400 ml-0.5" />}
                </button>

                <button
                  onClick={() => onDeleteSetlist(currentSetlist.id)}
                  className="p-3 rounded-2xl bg-black/40 hover:bg-rose-500/30 text-white hover:text-rose-200 border border-white/20 transition"
                  title="Excluir Repertório"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Songs in Setlist Table/List */}
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-1 border-b border-zinc-800/50">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Music className="w-4 h-4 text-emerald-400" />
                  Músicas no Repertório ({currentSetlist.items.length})
                </h3>
                <span className="text-xs text-zinc-400">
                  {searchQuery.trim()
                    ? `Exibindo ${filteredSetlistItems.length} de ${currentSetlist.items.length} músicas encontradas`
                    : 'Use as setas ↑ ↓ para reordenar a sequência'}
                </span>
              </div>

              {/* 🔍 Search bar inside setlist */}
              {currentSetlist.items.length > 0 && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar música por título, artista ou tom..."
                    className="w-full bg-zinc-950/80 border border-zinc-700/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
                      title="Limpar busca"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              {filteredSetlistItems.map((item, index) => {
                const song = songs.find(s => s.id === item.songId);
                if (!song) return null;
                const originalIndex = currentSetlist.items.findIndex(it => it.songId === item.songId);

                return (
                  <div
                    key={item.songId}
                    className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition flex flex-wrap items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-zinc-850 text-emerald-400 font-mono text-xs font-black flex items-center justify-center border border-zinc-750">
                        {originalIndex + 1}
                      </span>

                      <div
                        onClick={() => onSelectSong(song, currentSetlist)}
                        className="cursor-pointer"
                      >
                        <h4 className="text-sm font-extrabold text-white group-hover:text-emerald-400 transition flex items-center gap-2">
                          {song.title}
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            {song.liturgicalMoment}
                          </span>
                        </h4>
                        <p className="text-xs text-zinc-400">{song.artist}</p>
                      </div>
                    </div>

                    {/* Notes & Tone & Reorder Controls */}
                    <div className="flex items-center gap-2.5 ml-auto">
                      {/* Custom Key Selector */}
                      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1">
                        <span className="text-[10px] text-zinc-500 font-bold">Tom:</span>
                        <input
                          type="text"
                          value={item.customKey || song.originalKey}
                          onChange={(e) => handleUpdateCustomKey(item.songId, e.target.value)}
                          className="w-10 bg-transparent text-xs font-mono font-bold text-emerald-400 focus:outline-none text-center"
                        />
                      </div>

                      {/* Notes preview/editor */}
                      {editingNotesSongId === item.songId ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={notesInput}
                            onChange={(e) => setNotesInput(e.target.value)}
                            placeholder="Nota (ex: Tom E, Solo...)"
                            className="bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleSaveNotes(item.songId)}
                            className="p-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNotesSongId(item.songId);
                            setNotesInput(item.notes || '');
                          }}
                          className="text-xs text-zinc-400 hover:text-zinc-200 px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition truncate max-w-[150px]"
                          title="Editar Anotação da Banda"
                        >
                          {item.notes || '+ Adicionar Nota'}
                        </button>
                      )}

                      {/* Reorder Buttons (only active when not filtering) */}
                      {!searchQuery && (
                        <div className="flex items-center gap-1">
                          <button
                            disabled={originalIndex === 0}
                            onClick={() => handleMoveSong(originalIndex, 'up')}
                            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition border border-zinc-800"
                            title="Mover para cima"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            disabled={originalIndex === currentSetlist.items.length - 1}
                            onClick={() => handleMoveSong(originalIndex, 'down')}
                            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition border border-zinc-800"
                            title="Mover para baixo"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Play / Open in Stage */}
                      <button
                        onClick={() => onSelectSong(song, currentSetlist)}
                        className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition shadow-md"
                        title="Abrir Cifra no Palco"
                      >
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemoveSong(item.songId)}
                        className="p-2 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 border border-zinc-800 transition"
                        title="Remover do Repertório"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Empty Search Result */}
              {filteredSetlistItems.length === 0 && searchQuery.trim() && (
                <div className="text-center py-10 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 text-zinc-400 text-xs space-y-2">
                  <Search className="w-6 h-6 mx-auto text-zinc-600" />
                  <p className="font-bold text-white">Nenhuma música encontrada para "{searchQuery}"</p>
                  <p className="text-zinc-500 text-[11px]">Verifique a digitação ou tente buscar pelo nome do artista.</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-xs hover:bg-zinc-700 font-semibold transition"
                  >
                    Limpar Pesquisa
                  </button>
                </div>
              )}

              {currentSetlist.items.length === 0 && (
                <div className="text-center py-12 rounded-2xl bg-zinc-950/40 border border-dashed border-zinc-800 text-zinc-500 text-xs space-y-2">
                  <Music className="w-8 h-8 mx-auto text-zinc-700" />
                  <p className="font-semibold text-zinc-400">Nenhuma música adicionada a este repertório ainda.</p>
                  <p className="text-zinc-600">
                    Navegue pelo catálogo e clique no botão <strong>"+"</strong> no card de qualquer música para adicioná-la aqui!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Setlist Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700/80 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-black flex items-center gap-2">
                <ListMusic className="w-5 h-5 text-emerald-400" />
                Criar Novo Repertório
              </h3>
              <button onClick={() => setIsCreating(false)} className="p-1 rounded-full text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Título do Repertório *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Show de Sexta / Ensaio da Banda"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Tipo de Evento</label>
                <select
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Show / Apresentação">Show / Apresentação</option>
                  <option value="Barzinho / Voz e Violão">Barzinho / Voz e Violão</option>
                  <option value="Casamento / Cerimônia">Casamento / Cerimônia</option>
                  <option value="Ensaio Geral">Ensaio Geral</option>
                  <option value="Celebração / Louvor">Celebração / Louvor</option>
                  <option value="Festa / Evento">Festa / Evento</option>
                  <option value="Geral">Geral</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Descrição ou Detalhes</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Observações para os músicos da banda..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-950 transition flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Salvar Repertório
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 Modal de Exportação em PDF do Repertório */}
      {isExportPdfOpen && currentSetlist && (
        <ExportSetlistPdfModal
          isOpen={isExportPdfOpen}
          onClose={() => setIsExportPdfOpen(false)}
          setlist={currentSetlist}
          songs={songs}
        />
      )}
    </div>
  );
};

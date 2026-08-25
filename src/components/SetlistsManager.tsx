import React, { useState } from 'react';
import { Setlist, Song } from '../types';
import { useLiveRoom } from '../context/LiveRoomContext';
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
  FileText
} from 'lucide-react';

interface SetlistsManagerProps {
  setlists: Setlist[];
  songs: Song[];
  onSelectSong: (song: Song, setlist?: Setlist) => void;
  onCreateSetlist: (title: string, description: string, targetEvent: string) => void;
  onDeleteSetlist: (id: string) => void;
  onUpdateSetlist: (setlist: Setlist) => void;
  onOpenLiveRoomModal: () => void;
}

export const SetlistsManager: React.FC<SetlistsManagerProps> = ({
  setlists,
  songs,
  onSelectSong,
  onCreateSetlist,
  onDeleteSetlist,
  onUpdateSetlist,
  onOpenLiveRoomModal
}) => {
  const { isInRoom, isHost, selectSong, setActiveSetlist } = useLiveRoom();

  const [selectedSetlistId, setSelectedSetlistId] = useState<string>(setlists[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newEvent, setNewEvent] = useState('Missa');
  const [editingNotesSongId, setEditingNotesSongId] = useState<string | null>(null);
  const [notesInput, setNotesInput] = useState('');

  const currentSetlist = setlists.find(s => s.id === selectedSetlistId) || setlists[0];

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

    // Update order values
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ListMusic className="w-7 h-7 text-emerald-400" />
            Repertórios & Playlists Litúrgicas
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Organize setlists completas por evento, personalize tons e conduza apresentações ao vivo.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Repertório
        </button>
      </div>

      {/* Setlist selector cards */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {setlists.map((setlist) => {
          const isSelected = selectedSetlistId === setlist.id;
          return (
            <button
              key={setlist.id}
              onClick={() => setSelectedSetlistId(setlist.id)}
              className={`p-4 rounded-2xl text-left transition-all flex-none w-64 border shadow-lg ${
                isSelected
                  ? 'bg-zinc-850 border-emerald-500 ring-2 ring-emerald-500/30'
                  : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                  {setlist.targetEvent}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {setlist.items.length} faixas
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white truncate">{setlist.title}</h3>
              <p className="text-xs text-zinc-400 line-clamp-1 mt-1">{setlist.description}</p>
            </button>
          );
        })}
      </div>

      {/* Main Setlist Detail View */}
      {currentSetlist && (
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800/80 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-800">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                {currentSetlist.targetEvent}
              </span>
              <h2 className="text-2xl font-black text-white">{currentSetlist.title}</h2>
              <p className="text-xs text-zinc-400 mt-1">{currentSetlist.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleStartLiveSetlist}
                className="px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm shadow-xl shadow-emerald-900/30 transition flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                Iniciar no Palco / Ensaio
              </button>

              <button
                onClick={() => onDeleteSetlist(currentSetlist.id)}
                className="p-2.5 rounded-xl bg-zinc-800 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-zinc-700 transition"
                title="Excluir Repertório"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Songs in Setlist Table/List */}
          <div className="space-y-2">
            {currentSetlist.items.map((item, index) => {
              const song = songs.find(s => s.id === item.songId);
              if (!song) return null;

              return (
                <div
                  key={item.songId}
                  className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition flex flex-wrap items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-zinc-800 text-zinc-400 font-mono text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </span>

                    <div
                      onClick={() => onSelectSong(song, currentSetlist)}
                      className="cursor-pointer"
                    >
                      <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition flex items-center gap-2">
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
                    <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-1">
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
                          className="p-1.5 rounded-lg bg-emerald-500 text-zinc-950"
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
                        className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 rounded-lg hover:bg-zinc-800 transition truncate max-w-[140px]"
                        title="Editar Anotação"
                      >
                        {item.notes || '+ Nota'}
                      </button>
                    )}

                    {/* Reorder Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        disabled={index === 0}
                        onClick={() => handleMoveSong(index, 'up')}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition"
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={index === currentSetlist.items.length - 1}
                        onClick={() => handleMoveSong(index, 'down')}
                        className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 disabled:opacity-30 transition"
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Play / View */}
                    <button
                      onClick={() => onSelectSong(song, currentSetlist)}
                      className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition"
                      title="Abrir Cifra no Palco"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>

                    {/* Remove */}
                    <button
                      onClick={() => handleRemoveSong(item.songId)}
                      className="p-1.5 rounded-xl bg-zinc-900 hover:bg-rose-500/20 text-zinc-500 hover:text-rose-400 transition"
                      title="Remover do Repertório"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {currentSetlist.items.length === 0 && (
              <div className="text-center py-10 text-zinc-500 text-xs">
                Nenhuma música adicionada ainda. Navegue pelo catálogo e clique no botão "+" para adicionar faixas a este repertório.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Setlist Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700 p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Criar Novo Repertório</h3>
              <button onClick={() => setIsCreating(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Título do Repertório</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Missa de Domingo 19h"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Tipo de Evento</label>
                <select
                  value={newEvent}
                  onChange={(e) => setNewEvent(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Missa Paroquial">Missa Paroquial</option>
                  <option value="Grupo de Oração">Grupo de Oração</option>
                  <option value="Adoração ao Santíssimo">Adoração ao Santíssimo</option>
                  <option value="Casamento">Casamento</option>
                  <option value="Retiro / Encontro">Retiro / Encontro</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Descrição</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detalhes ou observações para os músicos..."
                  rows={2}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                >
                  Salvar Repertório
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

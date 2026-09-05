import React, { useState } from 'react';
import { Song, MusicGenre, CategoryTag, Setlist, GenreFolder } from '../types';
import { MomentManagerModal } from './MomentManagerModal';
import { GenreFolderModal } from './GenreFolderModal';
import {
  Music,
  Play,
  Flame,
  Heart,
  Sparkles,
  Layers,
  Radio,
  Plus,
  Compass,
  ListMusic,
  Tv,
  Check,
  Upload,
  Globe,
  Sliders,
  Settings2,
  Trash2,
  Folder,
  Edit2,
  Crown,
  Search
} from 'lucide-react';

interface DiscoveryHubProps {
  songs: Song[];
  genreFolders: GenreFolder[];
  isPro: boolean;
  onSelectSong: (song: Song) => void;
  onOpenLiveRoomModal: () => void;
  onOpenSearch: () => void;
  onOpenUploadModal: (presetMoment?: MusicGenre) => void;
  onOpenPricing: (reason?: string) => void;
  setlists: Setlist[];
  onAddToSetlist: (songId: string, setlistId: string) => void;
  onUpdateSongMoment: (songId: string, newMoment: MusicGenre) => void;
  onBatchUpdateMoments: (songIdsToAdd: string[], songIdsToRemove: string[], moment: MusicGenre) => void;
  onSaveGenreFolder: (folder: GenreFolder) => void;
  onDeleteGenreFolder: (folderId: string) => void;
}

export const MUSIC_GENRES: { genre: MusicGenre; color: string; desc: string }[] = [
  { genre: 'Pop Rock', color: 'from-blue-600 to-indigo-900', desc: 'Clássicos e hits do rock nacional e internacional' },
  { genre: 'MPB', color: 'from-amber-600 to-orange-800', desc: 'Voz e violão, samba e canções da música brasileira' },
  { genre: 'Sertanejo', color: 'from-amber-700 to-yellow-900', desc: 'Sertanejo clássico, universitário e modas de viola' },
  { genre: 'Pagode & Samba', color: 'from-emerald-600 to-teal-900', desc: 'Roda de samba, partido alto e pagode acústico' },
  { genre: 'Gospel & Louvor', color: 'from-purple-700 to-indigo-950', desc: 'Canções cristãs, adoração e louvor' },
  { genre: 'Forró & Piseiro', color: 'from-orange-600 to-red-800', desc: 'Xote, baião, forró tradicional e piseiro' },
  { genre: 'Hits do Show', color: 'from-rose-600 to-pink-900', desc: 'Ponto alto e músicas mais pedidas pelo público' },
  { genre: 'Acústico', color: 'from-cyan-600 to-blue-900', desc: 'Arranjos intimistas para voz, violão e percussão' },
  { genre: 'Baladas & Românticas', color: 'from-violet-700 to-fuchsia-950', desc: 'Músicas calmas, românticas e lentas' },
  { genre: 'Abertura & Encerramento', color: 'from-slate-700 to-zinc-900', desc: 'Músicas para começar com energia ou fechar com bis' }
];

export const DiscoveryHub: React.FC<DiscoveryHubProps> = ({
  songs,
  genreFolders,
  isPro,
  onSelectSong,
  onOpenLiveRoomModal,
  onOpenSearch,
  onOpenUploadModal,
  onOpenPricing,
  setlists,
  onAddToSetlist,
  onUpdateSongMoment,
  onBatchUpdateMoments,
  onSaveGenreFolder,
  onDeleteGenreFolder
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string | 'all'>('all');
  const [addToSetlistSongId, setAddToSetlistSongId] = useState<string | null>(null);
  const [feedbackAdded, setFeedbackAdded] = useState<string | null>(null);
  const [activeGenreForModal, setActiveGenreForModal] = useState<string | null>(null);

  // Folder modal state (creating or editing)
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<GenreFolder | null>(null);

  const songsLimit = 10;
  const foldersLimit = 3;
  const songsUsagePercent = Math.min(100, Math.round((songs.length / songsLimit) * 100));

  // Filter songs by folder
  const filteredSongs = songs.filter(s => {
    if (selectedGenre !== 'all' && s.liturgicalMoment !== selectedGenre) return false;
    return true;
  });

  const handleAddSongToSetlist = (songId: string, setlistId: string) => {
    onAddToSetlist(songId, setlistId);
    setAddToSetlistSongId(null);
    setFeedbackAdded(songId);
    setTimeout(() => setFeedbackAdded(null), 2000);
  };

  const handleCreateFolderClick = () => {
    if (!isPro && genreFolders.length >= 3) {
      onOpenPricing('Usuários gratuitos podem ter até 3 pastas de estilos. Faça upgrade para o Plano Pro para criar pastas ilimitadas na nuvem.');
      return;
    }
    setFolderToEdit(null);
    setIsFolderModalOpen(true);
  };

  const handleEditFolderClick = (f: GenreFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderToEdit(f);
    setIsFolderModalOpen(true);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 🚀 Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950 border border-emerald-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            Sincronização ao Vivo - Modo Ensaio e Palco
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none">
            Cifras, Transposição e <span className="text-emerald-400">Palco Conectado</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Navegue pelo catálogo de músicas, organize repertórios completos por show, ajuste tons em tempo real e guie toda a banda no palco sem desafinar.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={onOpenLiveRoomModal}
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm shadow-xl shadow-emerald-900/40 transition flex items-center gap-2"
            >
              <Radio className="w-4 h-4" />
              Conectar Sessão ao Vivo
            </button>

            <button
              onClick={() => onOpenUploadModal()}
              className="px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm border border-zinc-700 transition flex items-center gap-2"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              Subir Minha Cifra / Upload
            </button>

            <button
              onClick={onOpenSearch}
              className="px-4 py-3 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-sm border border-zinc-800 transition flex items-center gap-2"
            >
              <Globe className="w-4 h-4 text-blue-400" />
              Buscar Online
            </button>
          </div>
        </div>

        {/* Decorative ambient gradients */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
      </div>

      {/* 📊 Capacidade do Catálogo (Plano Free vs Pro) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 w-full">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white">Capacidade do Catálogo</span>
              {!isPro ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  Plano Free
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" /> PRO Ilimitado
                </span>
              )}
            </div>

            <div className="font-mono text-zinc-400 text-xs">
              {!isPro ? (
                <span>
                  <strong className={songs.length >= songsLimit ? 'text-amber-400 font-bold' : 'text-white'}>
                    {songs.length}
                  </strong>
                  /{songsLimit} músicas • <strong>{genreFolders.length}</strong>/{foldersLimit} pastas
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">
                  {songs.length} músicas • {genreFolders.length} pastas (Ilimitado)
                </span>
              )}
            </div>
          </div>

          {!isPro && (
            <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  songs.length >= songsLimit ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${songsUsagePercent}%` }}
              />
            </div>
          )}
        </div>

        {!isPro && (
          <button
            onClick={() => onOpenPricing('Desbloqueie músicas e pastas de estilos ilimitadas com o Plano Pro.')}
            className="w-full md:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-950/40 transition flex items-center justify-center gap-1.5 flex-none"
          >
            <Crown className="w-3.5 h-3.5 fill-zinc-950" />
            <span>Músicas Ilimitadas com o PRO</span>
          </button>
        )}
      </div>

      {/* 🏷️ Filtro Rápido pelas Pastas */}
      <div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedGenre('all')}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition flex-none flex items-center gap-1.5 ${
              selectedGenre === 'all'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'bg-zinc-900/90 text-zinc-300 hover:text-white border border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            <span>Todas as Músicas</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                selectedGenre === 'all' ? 'bg-zinc-950/25 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {songs.length}
            </span>
          </button>

          {genreFolders.map((f) => {
            const count = songs.filter(s => s.liturgicalMoment === f.name).length;
            const isSelected = selectedGenre === f.name;

            return (
              <button
                key={f.id}
                onClick={() => setSelectedGenre(isSelected ? 'all' : f.name)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition flex-none flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'bg-zinc-900/90 text-zinc-300 hover:text-white border border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <span>{f.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-zinc-950/25 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🎸 Pastas & Estilos Musicais Dinâmicos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Folder className="w-5 h-5 text-emerald-400" />
              Pastas & Estilos Musicais
            </h2>
            <p className="text-xs text-zinc-400">
              Personalize o nome das pastas, cores ou crie novos blocos de show
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedGenre !== 'all' && (
              <button
                onClick={() => setSelectedGenre('all')}
                className="text-xs font-bold text-emerald-400 hover:underline mr-2"
              >
                Ver todas
              </button>
            )}

            <button
              onClick={handleCreateFolderClick}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5"
              title={!isPro && genreFolders.length >= 3 ? 'Limite de 3 pastas no Free (faça upgrade)' : 'Criar Nova Pasta'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Pasta</span>
              {!isPro && genreFolders.length >= 3 && (
                <Crown className="w-3 h-3 text-amber-400 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Folder Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {genreFolders.map((item) => {
            const count = songs.filter((s) => s.liturgicalMoment === item.name).length;
            const isSelected = selectedGenre === item.name;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedGenre(isSelected ? 'all' : item.name);
                }}
                className={`group relative p-4 rounded-2xl bg-gradient-to-br ${item.color || 'from-zinc-800 to-zinc-950'} text-left transition-all overflow-hidden border shadow-lg cursor-pointer ${
                  isSelected
                    ? 'border-white scale-[1.02] ring-2 ring-emerald-400'
                    : 'border-white/10 hover:border-white/30 hover:scale-[1.01]'
                }`}
              >
                <div className="relative z-10 flex flex-col justify-between h-full min-h-[90px]">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-white/90 tracking-wider">
                      {count} {count === 1 ? 'música' : 'músicas'}
                    </span>

                    {/* Botão de Editar / Renomear Pasta */}
                    <button
                      type="button"
                      onClick={(e) => handleEditFolderClick(item, e)}
                      className="p-1.5 rounded-lg bg-black/40 hover:bg-black/70 text-white/80 hover:text-white transition opacity-80 group-hover:opacity-100"
                      title="Editar nome ou cor da pasta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2">
                    <h3 className="text-base font-black text-white leading-snug flex items-center gap-1.5">
                      <Folder className="w-4 h-4 text-white/70 flex-none" />
                      <span className="truncate">{item.name}</span>
                    </h3>
                    {item.desc && (
                      <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                        {item.desc}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Quick Add Folder Card */}
          <button
            onClick={handleCreateFolderClick}
            className="p-4 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 bg-zinc-900/40 hover:bg-zinc-900/80 transition-all flex flex-col items-center justify-center text-center gap-2 min-h-[110px] group"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-800 group-hover:bg-emerald-500/20 text-zinc-400 group-hover:text-emerald-400 flex items-center justify-center transition">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-zinc-300 group-hover:text-white block">
                Criar Nova Pasta
              </span>
              <span className="text-[10px] text-zinc-500">
                {!isPro ? `${genreFolders.length}/3 pastas` : 'Pastas ilimitadas no Pro'}
              </span>
            </div>
          </button>
        </div>

        {/* Dedicated Focused Genre Customization Banner */}
        {selectedGenre !== 'all' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Folder className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                  Pasta Selecionada
                </span>
                <h3 className="text-lg font-black text-white">
                  {selectedGenre} ({filteredSongs.length} {filteredSongs.length === 1 ? 'música' : 'músicas'})
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveGenreForModal(selectedGenre)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Gerenciar Músicas desta Pasta</span>
              </button>

              <button
                onClick={() => onOpenUploadModal(selectedGenre)}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Adicionar Cifra em {selectedGenre}</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 🎵 Featured Songs Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              {selectedGenre !== 'all'
                ? `Músicas de: ${selectedGenre}`
                : 'Catálogo de Cifras'}
            </h2>
            <p className="text-xs text-zinc-400">
              {filteredSongs.length} músicas prontas com transposição e diagrama de acordes
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedGenre !== 'all' && (
              <button
                onClick={() => setActiveGenreForModal(selectedGenre)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition hover:bg-emerald-500/30"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Gerenciar este Estilo</span>
              </button>
            )}

            <button
              onClick={() => onOpenUploadModal(selectedGenre !== 'all' ? selectedGenre : undefined)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 hover:border-emerald-500/50 text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Minha Cifra</span>
            </button>
          </div>
        </div>

        {/* Estado 1: Catálogo Totalmente Vazio */}
        {songs.length === 0 ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900/60 border border-zinc-800 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
              <Music className="w-8 h-8" />
            </div>

            <div className="max-w-md space-y-1.5">
              <h3 className="text-xl font-black text-white">
                Seu catálogo está vazio
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Comece adicionando suas próprias músicas! No plano Free você pode ter até <strong>10 músicas</strong> distribuídas entre suas <strong>3 pastas</strong>.
              </p>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onOpenSearch}
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-sm shadow-xl shadow-emerald-900/40 transition flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Buscar Cifras Online
              </button>

              <button
                onClick={() => onOpenUploadModal()}
                className="px-5 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm border border-zinc-700 transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                Digitar / Subir Minha Cifra
              </button>
            </div>
          </div>
        ) : filteredSongs.length === 0 ? (
          /* Estado 2: Filtro Vazio */
          <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 text-center flex flex-col items-center justify-center space-y-3">
            <Folder className="w-10 h-10 text-zinc-600" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                Nenhuma música nesta pasta ou filtro
              </h3>
              <p className="text-xs text-zinc-400">
                Você pode adicionar uma nova música diretamente para cá ou reatribuir músicas existentes.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => onOpenUploadModal(selectedGenre !== 'all' ? selectedGenre : undefined)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Adicionar Cifra Aqui
              </button>
              <button
                onClick={() => setSelectedGenre('all')}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
              >
                Ver Todas as Músicas
              </button>
            </div>
          </div>
        ) : (
          /* Estado 3: Grid de Músicas */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => onSelectSong(song)}
                className="group p-4 rounded-3xl bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/80 hover:bg-zinc-850 transition-all cursor-pointer flex flex-col justify-between shadow-xl relative"
              >
                {/* Card Header with Cover */}
                <div className="space-y-3">
                  <div className={`relative w-full aspect-video rounded-2xl bg-gradient-to-br ${song.coverGradient} flex items-center justify-center text-white shadow-lg overflow-hidden`}>
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Music className="w-10 h-10 opacity-80 group-hover:scale-110 transition-transform" />
                    )}

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-xl transform scale-75 group-hover:scale-100 transition">
                        <Play className="w-6 h-6 fill-current ml-1" />
                      </div>
                    </div>

                    {/* Genre Tag Pill */}
                    <span
                      className="absolute top-2 left-2 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full backdrop-blur-md border bg-zinc-950/80 text-emerald-300 border-zinc-700"
                      title={`Pasta Musical: ${song.liturgicalMoment}`}
                    >
                      {song.liturgicalMoment}
                    </span>

                    {/* Custom Upload Badge / Version */}
                    {song.isCustom && (
                      <span className="absolute top-2 right-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 shadow-md">
                        {song.parentSongId ? 'Minha Versão' : 'Própria'}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition truncate">
                      {song.title}
                    </h3>
                    <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
                  </div>
                </div>

                {/* Card Footer / Metadata */}
                <div className="pt-3 mt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-emerald-300 font-mono font-bold border border-zinc-700">
                      Tom {song.originalKey}
                    </span>
                    {song.capo && song.capo > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 font-mono font-bold border border-amber-500/30 text-[10px]" title={`Tocar com Capotraste na ${song.capo}ª casa`}>
                        Capo {song.capo}ª
                      </span>
                    )}
                    <span className="text-zinc-500 font-mono">{song.bpm} BPM</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Reassign genre quick button */}
                    <select
                      value={song.liturgicalMoment}
                      onChange={(e) => onUpdateSongMoment(song.id, e.target.value as MusicGenre)}
                      className="bg-zinc-950 border border-zinc-700 text-[10px] font-bold rounded-lg px-2 py-1 text-zinc-300 focus:outline-none focus:border-emerald-500 max-w-[100px] truncate"
                      title="Alterar a pasta desta música"
                    >
                      {genreFolders.map((f) => (
                        <option key={f.id} value={f.name}>{f.name}</option>
                      ))}
                    </select>

                    {/* Add to Setlist Dropdown Trigger */}
                    <div className="relative">
                      <button
                        onClick={() => setAddToSetlistSongId(addToSetlistSongId === song.id ? null : song.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                        title="Adicionar ao Repertório"
                      >
                        {feedbackAdded === song.id ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Plus className="w-4 h-4" />
                        )}
                      </button>

                      {/* Setlist Selection Popup */}
                      {addToSetlistSongId === song.id && (
                        <div className="absolute right-0 bottom-full mb-2 w-48 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-2 z-30 animate-in fade-in">
                          <span className="text-[10px] uppercase font-bold text-zinc-400 px-2 block mb-1">
                            Adicionar ao Repertório:
                          </span>
                          {setlists.length === 0 ? (
                            <span className="text-xs text-zinc-500 px-2 py-1 block">Nenhum repertório criado</span>
                          ) : (
                            setlists.map((setlist) => (
                              <button
                                key={setlist.id}
                                onClick={() => handleAddSongToSetlist(song.id, setlist.id)}
                                className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-zinc-800 text-xs font-semibold text-zinc-200 truncate transition"
                              >
                                {setlist.title}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Genre & Block Manager Modal */}
      {activeGenreForModal && (
        <MomentManagerModal
          isOpen={Boolean(activeGenreForModal)}
          onClose={() => setActiveGenreForModal(null)}
          moment={activeGenreForModal}
          allSongs={songs}
          allFolders={genreFolders}
          onUpdateSongMoment={onUpdateSongMoment}
          onBatchUpdateMoments={onBatchUpdateMoments}
          onOpenUploadModal={(preset) => onOpenUploadModal(preset)}
        />
      )}

      {/* Genre Folder Create/Edit Modal */}
      <GenreFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setFolderToEdit(null);
        }}
        folder={folderToEdit}
        existingFolders={genreFolders}
        isPro={isPro}
        onSaveFolder={onSaveGenreFolder}
        onDeleteFolder={onDeleteGenreFolder}
        onOpenPricing={onOpenPricing}
      />
    </div>
  );
};

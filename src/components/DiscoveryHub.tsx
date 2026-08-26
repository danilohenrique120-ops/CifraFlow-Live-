import React, { useState } from 'react';
import { Song, LiturgicalMoment, CategoryTag, Setlist } from '../types';
import { MomentManagerModal } from './MomentManagerModal';
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
  Trash2
} from 'lucide-react';

interface DiscoveryHubProps {
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onOpenLiveRoomModal: () => void;
  onOpenSearch: () => void;
  onOpenUploadModal: (presetMoment?: LiturgicalMoment) => void;
  setlists: Setlist[];
  onAddToSetlist: (songId: string, setlistId: string) => void;
  onUpdateSongMoment: (songId: string, newMoment: LiturgicalMoment) => void;
  onBatchUpdateMoments: (songIdsToAdd: string[], songIdsToRemove: string[], moment: LiturgicalMoment) => void;
}

const LITURGICAL_MOMENTS: { moment: LiturgicalMoment; color: string; desc: string }[] = [
  { moment: 'Entrada', color: 'from-amber-600 to-orange-800', desc: 'Acolhida e procissão inicial' },
  { moment: 'Ato Penitencial', color: 'from-slate-700 to-zinc-900', desc: 'Kyrie Eleison e perdão' },
  { moment: 'Glória', color: 'from-yellow-500 to-amber-700', desc: 'Hino de louvor litúrgico' },
  { moment: 'Salmo / Aclamação', color: 'from-emerald-600 to-teal-800', desc: 'Meditação da Palavra e Aleluia' },
  { moment: 'Ofertório', color: 'from-amber-700 to-yellow-900', desc: 'Apresentação dos dons e ofertas' },
  { moment: 'Santo', color: 'from-orange-600 to-red-800', desc: 'Aclamação dos anjos e querubins' },
  { moment: 'Cordeiro de Deus', color: 'from-purple-800 to-slate-900', desc: 'Agnus Dei e pedido de paz' },
  { moment: 'Comunhão', color: 'from-blue-600 to-indigo-900', desc: 'Alimento eucarístico sagrado' },
  { moment: 'Ação de Graças', color: 'from-violet-700 to-fuchsia-900', desc: 'Intimidade e adoração ao Senhor' },
  { moment: 'Envio', color: 'from-cyan-600 to-blue-800', desc: 'Bênção e missão no mundo' }
];

const CATEGORIES: CategoryTag[] = [
  'Adoração',
  'Louvor',
  'Missa / Liturgia',
  'Mariana',
  'Espírito Santo',
  'Cura e Libertação',
  'Quaresma',
  'Jovem'
];

export const DiscoveryHub: React.FC<DiscoveryHubProps> = ({
  songs,
  onSelectSong,
  onOpenLiveRoomModal,
  onOpenSearch,
  onOpenUploadModal,
  setlists,
  onAddToSetlist,
  onUpdateSongMoment,
  onBatchUpdateMoments
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMoment, setSelectedMoment] = useState<LiturgicalMoment | 'all'>('all');
  const [addToSetlistSongId, setAddToSetlistSongId] = useState<string | null>(null);
  const [feedbackAdded, setFeedbackAdded] = useState<string | null>(null);
  const [activeMomentForModal, setActiveMomentForModal] = useState<LiturgicalMoment | null>(null);

  // Filter songs
  const filteredSongs = songs.filter(s => {
    if (selectedMoment !== 'all' && s.liturgicalMoment !== selectedMoment) return false;
    if (selectedCategory !== 'all' && !s.categories.includes(selectedCategory as CategoryTag)) return false;
    return true;
  });

  const handleAddSongToSetlist = (songId: string, setlistId: string) => {
    onAddToSetlist(songId, setlistId);
    setAddToSetlistSongId(null);
    setFeedbackAdded(songId);
    setTimeout(() => setFeedbackAdded(null), 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 🚀 Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-zinc-900 to-zinc-950 border border-emerald-500/20 p-6 sm:p-10 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            Live Band Sync • Modo Ensaio e Palco
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none">
            Cifras, Transposição e <span className="text-emerald-400">Palco Conectado</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Navegue pelo catálogo litúrgico, personalize as músicas de cada momento da missa, busque online no estilo Spotify e guie toda a banda em tempo real.
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
              Busca Global Online (Spotify)
            </button>
          </div>
        </div>

        {/* Decorative ambient gradients */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
      </div>

      {/* 🏷️ Quick Category Filters */}
      <div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedMoment('all');
            }}
            className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition flex-none ${
              selectedCategory === 'all' && selectedMoment === 'all'
                ? 'bg-emerald-500 text-zinc-950 shadow-md'
                : 'bg-zinc-900/90 text-zinc-300 hover:text-white border border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Todas as Músicas ({songs.length})
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedMoment('all');
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition flex-none ${
                selectedCategory === cat
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'bg-zinc-900/90 text-zinc-300 hover:text-white border border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ⛪ Liturgical Moments Navigator */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              Momentos da Santa Missa
            </h2>
            <p className="text-xs text-zinc-400">
              Clique em qualquer momento para filtrar ou personalizar suas próprias músicas
            </p>
          </div>
          {selectedMoment !== 'all' && (
            <button
              onClick={() => setSelectedMoment('all')}
              className="text-xs font-bold text-emerald-400 hover:underline"
            >
              Ver todos os momentos
            </button>
          )}
        </div>

        {/* 10 Liturgical Moment Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {LITURGICAL_MOMENTS.map((item) => {
            const count = songs.filter(s => s.liturgicalMoment === item.moment).length;
            const isSelected = selectedMoment === item.moment;

            return (
              <div
                key={item.moment}
                className="relative group"
              >
                <button
                  onClick={() => {
                    setSelectedMoment(isSelected ? 'all' : item.moment);
                    setSelectedCategory('all');
                  }}
                  className={`w-full p-4 rounded-2xl bg-gradient-to-br ${item.color} text-left transition-all relative overflow-hidden border shadow-lg ${
                    isSelected
                      ? 'border-white scale-[1.03] ring-2 ring-emerald-400'
                      : 'border-white/10 hover:border-white/30 hover:scale-[1.02]'
                  }`}
                >
                  <div className="relative z-10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-white/90 tracking-wider block">
                        {count} {count === 1 ? 'música' : 'músicas'}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-white mt-1 leading-snug">
                      {item.moment}
                    </h3>
                    <p className="text-[11px] text-white/80 line-clamp-1 mt-1">
                      {item.desc}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Dedicated Focused Moment Customization Banner */}
        {selectedMoment !== 'all' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-zinc-900 to-zinc-950 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 shadow-xl animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
                  Momento Selecionado
                </span>
                <h3 className="text-lg font-black text-white">
                  {selectedMoment} ({filteredSongs.length} músicas)
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveMomentForModal(selectedMoment)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Personalizar Músicas do Momento</span>
              </button>

              <button
                onClick={() => onOpenUploadModal(selectedMoment)}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Subir Cifra para {selectedMoment}</span>
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
              {selectedMoment !== 'all'
                ? `Músicas de: ${selectedMoment}`
                : selectedCategory !== 'all'
                ? `Músicas de ${selectedCategory}`
                : 'Catálogo de Cifras e Louvores'}
            </h2>
            <p className="text-xs text-zinc-400">
              {filteredSongs.length} músicas prontas com transposição e diagrama de acordes
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedMoment !== 'all' && (
              <button
                onClick={() => setActiveMomentForModal(selectedMoment)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition hover:bg-emerald-500/30"
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Gerenciar este Momento</span>
              </button>
            )}

            <button
              onClick={() => onOpenUploadModal(selectedMoment !== 'all' ? selectedMoment : undefined)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 hover:border-emerald-500/50 text-xs font-bold transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Minha Cifra</span>
            </button>
          </div>
        </div>

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

                  {/* Moment Tag Pill with quick reassign */}
                  <span
                    className="absolute top-2 left-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-emerald-300 border border-emerald-500/30"
                    title={`Momento Litúrgico: ${song.liturgicalMoment}`}
                  >
                    {song.liturgicalMoment}
                  </span>

                  {/* Custom Upload Badge */}
                  {song.isCustom && (
                    <span className="absolute top-2 right-2 text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 shadow-md">
                      Própria
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition truncate">
                    {song.title}
                  </h3>
                  <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                </div>
              </div>

              {/* Card Footer / Metadata */}
              <div className="pt-3 mt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-emerald-300 font-mono font-bold border border-zinc-700">
                    Tom {song.originalKey}
                  </span>
                  <span className="text-zinc-500 font-mono">{song.bpm} BPM</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  {/* Reassign moment quick button */}
                  <select
                    value={song.liturgicalMoment}
                    onChange={(e) => onUpdateSongMoment(song.id, e.target.value as LiturgicalMoment)}
                    className="bg-zinc-950 border border-zinc-700 text-[10px] font-bold rounded-lg px-2 py-1 text-zinc-300 focus:outline-none focus:border-emerald-500"
                    title="Alterar o momento litúrgico desta música"
                  >
                    {LITURGICAL_MOMENTS.map((m) => (
                      <option key={m.moment} value={m.moment}>{m.moment}</option>
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
                        {setlists.map((setlist) => (
                          <button
                            key={setlist.id}
                            onClick={() => handleAddSongToSetlist(song.id, setlist.id)}
                            className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-zinc-800 text-xs font-semibold text-zinc-200 truncate transition"
                          >
                            {setlist.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Moment Manager Modal */}
      {activeMomentForModal && (
        <MomentManagerModal
          isOpen={Boolean(activeMomentForModal)}
          onClose={() => setActiveMomentForModal(null)}
          moment={activeMomentForModal}
          allSongs={songs}
          onUpdateSongMoment={onUpdateSongMoment}
          onBatchUpdateMoments={onBatchUpdateMoments}
          onOpenUploadModal={(preset) => onOpenUploadModal(preset)}
        />
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { Song, LiturgicalMoment } from '../types';
import {
  Search,
  X,
  Music,
  User,
  Sparkles,
  ChevronRight,
  Clock,
  Play,
  Flame,
  Layers
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onSelectSong: (song: Song) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  songs,
  onSelectSong
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'artists' | 'liturgical'>('all');

  // Listen to Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggle or open
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filtered results
  const results = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return {
        topResult: songs[0] || null,
        songsList: songs.slice(0, 8),
        artistsList: Array.from(new Set(songs.map(s => s.artist))).slice(0, 5),
        liturgicalList: Array.from(new Set(songs.map(s => s.liturgicalMoment)))
      };
    }

    const matchedSongs = songs.filter(s => {
      const matchTitle = s.title.toLowerCase().includes(term);
      const matchArtist = s.artist.toLowerCase().includes(term);
      const matchMoment = s.liturgicalMoment.toLowerCase().includes(term);
      const matchTags = s.tags.some(t => t.toLowerCase().includes(term));
      const matchContent = s.content.toLowerCase().includes(term);
      return matchTitle || matchArtist || matchMoment || matchTags || matchContent;
    });

    const topResult = matchedSongs[0] || null;

    const matchedArtists = Array.from(
      new Set(
        songs
          .filter(s => s.artist.toLowerCase().includes(term))
          .map(s => s.artist)
      )
    );

    const matchedLiturgical = Array.from(
      new Set(
        songs
          .filter(s => s.liturgicalMoment.toLowerCase().includes(term))
          .map(s => s.liturgicalMoment)
      )
    );

    return {
      topResult,
      songsList: matchedSongs,
      artistsList: matchedArtists,
      liturgicalList: matchedLiturgical
    };
  }, [searchTerm, songs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-16 sm:pt-20 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/80 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 flex-none" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, artista, trecho da letra ou momento da missa..."
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-bold text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-zinc-800"
          >
            ESC
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex border-b border-zinc-800 px-4 py-2 gap-2 bg-zinc-950/40 text-xs overflow-x-auto">
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'songs', label: `Músicas (${results.songsList.length})` },
            { id: 'artists', label: `Artistas (${results.artistsList.length})` },
            { id: 'liturgical', label: 'Momentos Litúrgicos' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-full font-bold transition flex-none ${
                activeFilter === f.id
                  ? 'bg-emerald-500 text-zinc-950'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Top Result Card */}
          {results.topResult && (activeFilter === 'all' || activeFilter === 'songs') && (
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">
                Melhor Resultado
              </span>
              <div
                onClick={() => {
                  if (results.topResult) {
                    onSelectSong(results.topResult);
                    onClose();
                  }
                }}
                className="group p-4 rounded-2xl bg-gradient-to-r from-zinc-800/90 to-zinc-900 border border-zinc-700/80 hover:border-emerald-500/80 transition-all cursor-pointer flex items-center justify-between shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${results.topResult.coverGradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}>
                    <Music className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition">
                      {results.topResult.title}
                    </h3>
                    <p className="text-xs text-zinc-400">{results.topResult.artist}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        {results.topResult.liturgicalMoment}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        Tom: <strong>{results.topResult.originalKey}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center opacity-90 group-hover:opacity-100 group-hover:scale-110 shadow-lg transition">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          )}

          {/* Songs List */}
          {(activeFilter === 'all' || activeFilter === 'songs') && results.songsList.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">
                Músicas Encontradas
              </span>
              <div className="space-y-1">
                {results.songsList.map((song) => (
                  <div
                    key={song.id}
                    onClick={() => {
                      onSelectSong(song);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl hover:bg-zinc-800/80 transition cursor-pointer flex items-center justify-between group border border-transparent hover:border-zinc-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${song.coverGradient} flex items-center justify-center text-white text-xs font-bold`}>
                        <Music className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                          {song.title}
                        </h4>
                        <p className="text-xs text-zinc-400">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                        {song.liturgicalMoment}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        {song.originalKey}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Artists List */}
          {(activeFilter === 'all' || activeFilter === 'artists') && results.artistsList.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">
                Artistas e Ministérios
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.artistsList.map((artist) => (
                  <div
                    key={artist}
                    onClick={() => setSearchTerm(artist)}
                    className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800 transition cursor-pointer flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-zinc-200">{artist}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Liturgical Moments */}
          {(activeFilter === 'all' || activeFilter === 'liturgical') && results.liturgicalList.length > 0 && (
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">
                Momentos da Celebração
              </span>
              <div className="flex flex-wrap gap-2">
                {results.liturgicalList.map((moment) => (
                  <button
                    key={moment}
                    onClick={() => setSearchTerm(moment)}
                    className="px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800 hover:border-emerald-500 hover:bg-emerald-500/10 text-xs font-semibold text-zinc-300 transition"
                  >
                    {moment}
                  </button>
                ))}
              </div>
            </div>
          )}

          {results.songsList.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-zinc-400">Nenhum resultado encontrado para "{searchTerm}".</p>
              <span className="text-xs text-zinc-500 block mt-1">Tente buscar por "Comunhão", "Walmir", "Adoração" ou "Entrada".</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

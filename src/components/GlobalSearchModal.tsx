import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Song, LiturgicalMoment, OnlineSongResult } from '../types';
import { searchOnlineTracks, convertOnlineTrackToSong } from '../services/onlineMusicSearch';
import {
  Search,
  X,
  Music,
  User,
  Sparkles,
  ChevronRight,
  Clock,
  Play,
  Pause,
  Flame,
  Layers,
  Globe,
  Plus,
  Radio,
  Volume2
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  songs: Song[];
  onSelectSong: (song: Song) => void;
  onOpenUploadModal?: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  songs,
  onSelectSong,
  onOpenUploadModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'local' | 'online'>('local');
  const [activeFilter, setActiveFilter] = useState<'all' | 'songs' | 'artists' | 'liturgical'>('all');

  // Online search state
  const [onlineResults, setOnlineResults] = useState<OnlineSongResult[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState<boolean>(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Listen to Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean up audio on close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isOpen]);

  // Online search debounced effect
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      const results = await searchOnlineTracks(searchTerm);
      setOnlineResults(results);
      setIsSearchingOnline(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePlayPreview = (track: OnlineSongResult, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!track.previewUrl) return;

    if (playingAudioId === track.trackId && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
        setPlayingAudioId(null);
      }
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const newAudio = new Audio(track.previewUrl);
    newAudio.volume = 0.7;
    newAudio.play();
    newAudio.onended = () => setPlayingAudioId(null);
    audioRef.current = newAudio;
    setPlayingAudioId(track.trackId);
  };

  const handleSelectOnlineTrack = (track: OnlineSongResult) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const converted = convertOnlineTrackToSong(track);
    onSelectSong(converted);
    onClose();
  };

  // Local filtered results
  const localResults = useMemo(() => {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 pt-14 sm:pt-16 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/90 flex items-center gap-3">
          <Search className="w-5 h-5 text-emerald-400 flex-none" />
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, artista, letra ou pesquisar músicas online..."
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

        {/* Search Source Selector (Local vs Online Spotify Global Search) */}
        <div className="flex border-b border-zinc-800 px-4 py-2 gap-2 bg-zinc-950/50 text-xs items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('local')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 ${
                activeTab === 'local'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Catálogo de Cifras ({songs.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('online')}
              className={`px-3.5 py-1.5 rounded-full font-bold transition flex items-center gap-1.5 ${
                activeTab === 'online'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md'
                  : 'bg-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Busca Global Online (Estilo Spotify)</span>
              {isSearchingOnline && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />}
            </button>
          </div>

          {onOpenUploadModal && (
            <button
              onClick={() => {
                onClose();
                onOpenUploadModal();
              }}
              className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 hover:underline"
            >
              <Plus className="w-3 h-3" />
              Upload Próprio
            </button>
          )}
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {activeTab === 'online' ? (
            /* 🌐 ONLINE GLOBAL SEARCH RESULTS (SPOTIFY / ITUNES) */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Globe className="w-4 h-4" />
                    Músicas Encontradas Online Globalmente
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    Toque no play para ouvir 30s da gravação original ou clique para abrir a cifra no palco.
                  </p>
                </div>
                {isSearchingOnline && (
                  <span className="text-xs text-zinc-400 font-mono">Buscando...</span>
                )}
              </div>

              {onlineResults.length > 0 ? (
                <div className="space-y-2">
                  {onlineResults.map((track) => {
                    const isPlaying = playingAudioId === track.trackId;
                    return (
                      <div
                        key={track.trackId}
                        onClick={() => handleSelectOnlineTrack(track)}
                        className="group p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 hover:border-emerald-500/80 hover:bg-zinc-850 transition cursor-pointer flex items-center justify-between gap-3 shadow-md"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Album Art or Cover with Play overlay */}
                          <div className="relative w-12 h-12 rounded-xl bg-zinc-800 flex-none overflow-hidden group/art">
                            {track.artworkUrl100 ? (
                              <img
                                src={track.artworkUrl100}
                                alt={track.trackName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-700 to-zinc-900">
                                <Music className="w-5 h-5 text-white" />
                              </div>
                            )}

                            {/* Preview Audio Play/Pause Button */}
                            {track.previewUrl && (
                              <button
                                onClick={(e) => handlePlayPreview(track, e)}
                                className={`absolute inset-0 bg-black/60 flex items-center justify-center transition ${
                                  isPlaying ? 'opacity-100' : 'opacity-0 group-hover/art:opacity-100 group-hover:opacity-100'
                                }`}
                                title={isPlaying ? 'Pausar Prévia' : 'Ouvir 30s de Prévia'}
                              >
                                {isPlaying ? (
                                  <Pause className="w-5 h-5 text-emerald-400 fill-current animate-pulse" />
                                ) : (
                                  <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                                )}
                              </button>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition truncate">
                              {track.trackName}
                            </h4>
                            <p className="text-xs text-zinc-400 truncate">
                              {track.artistName} {track.collectionName && `• ${track.collectionName}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 flex-none">
                          {track.primaryGenreName && (
                            <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-semibold border border-zinc-700">
                              {track.primaryGenreName}
                            </span>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectOnlineTrack(track);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-md"
                          >
                            <span>Abrir Cifra</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : searchTerm.trim().length >= 2 && !isSearchingOnline ? (
                <div className="text-center py-10 space-y-2">
                  <p className="text-sm text-zinc-400">Nenhum resultado online para "{searchTerm}".</p>
                  <button
                    onClick={() => {
                      if (onOpenUploadModal) {
                        onClose();
                        onOpenUploadModal();
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-emerald-400 border border-zinc-700 transition"
                  >
                    + Criar e Subir Esta Cifra Manualmente
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  Digite o nome de qualquer música ou artista no campo de busca acima para pesquisar globalmente em tempo real.
                </div>
              )}
            </div>
          ) : (
            /* 📂 LOCAL CATALOG SEARCH RESULTS */
            <>
              {/* Top Result Card */}
              {localResults.topResult && (activeFilter === 'all' || activeFilter === 'songs') && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">
                    Melhor Resultado no Catálogo
                  </span>
                  <div
                    onClick={() => {
                      if (localResults.topResult) {
                        onSelectSong(localResults.topResult);
                        onClose();
                      }
                    }}
                    className="group p-4 rounded-2xl bg-gradient-to-r from-zinc-800/90 to-zinc-900 border border-zinc-700/80 hover:border-emerald-500/80 transition-all cursor-pointer flex items-center justify-between shadow-lg"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${localResults.topResult.coverGradient} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}>
                        <Music className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-white group-hover:text-emerald-400 transition">
                          {localResults.topResult.title}
                        </h3>
                        <p className="text-xs text-zinc-400">{localResults.topResult.artist}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                            {localResults.topResult.liturgicalMoment}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            Tom: <strong>{localResults.topResult.originalKey}</strong>
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
              {(activeFilter === 'all' || activeFilter === 'songs') && localResults.songsList.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">
                    Músicas no Catálogo
                  </span>
                  <div className="space-y-1">
                    {localResults.songsList.map((song) => (
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
              {(activeFilter === 'all' || activeFilter === 'artists') && localResults.artistsList.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">
                    Artistas e Grupos Musicais
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {localResults.artistsList.map((artist) => (
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
              {(activeFilter === 'all' || activeFilter === 'liturgical') && localResults.liturgicalList.length > 0 && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-2">
                    Momentos da Celebração
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {localResults.liturgicalList.map((moment) => (
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

              {localResults.songsList.length === 0 && (
                <div className="text-center py-10 space-y-3">
                  <p className="text-sm text-zinc-400">Nenhum resultado no catálogo para "{searchTerm}".</p>
                  <button
                    onClick={() => setActiveTab('online')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5 mx-auto"
                  >
                    <Globe className="w-4 h-4" />
                    Buscar Online Globalmente (Estilo Spotify)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

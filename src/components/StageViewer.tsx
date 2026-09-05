import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Song, StageTheme, FontScale, ColumnMode, Setlist, INSTRUMENT_OPTIONS } from '../types';
import { isChordLine, transposeSongContent, calculateNewKey, detectCapoInText, getInstrumentTranspositionOffset, getSemitoneDifference } from '../utils/chordEngine';
import { generateSingleSongPdfHtml, printHtmlDocument } from '../utils/pdfGenerator';
import { useLiveRoom } from '../context/LiveRoomContext';
import { useAuth } from '../context/AuthContext';
import { ChordModal } from './ChordTooltip';
import { ReviseSongModal } from './ReviseSongModal';
import {
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Columns,
  Square,
  Sun,
  Moon,
  Volume2,
  ChevronLeft,
  ChevronRight,
  Radio,
  Share2,
  Sliders,
  Type,
  Eye,
  EyeOff,
  Zap,
  RotateCcw,
  Sparkles,
  Music,
  Tv,
  Plus,
  Minus,
  FastForward,
  Lock,
  Edit3,
  Check,
  X,
  ListPlus,
  ListMusic,
  FileText,
  Printer
} from 'lucide-react';

interface StageViewerProps {
  song: Song;
  onBack: () => void;
  activeSetlist?: Setlist | null;
  setlists?: Setlist[];
  onAddToSetlist?: (song: Song, setlistId: string) => void;
  onNavigateSetlist?: (direction: 'prev' | 'next') => void;
  onOpenLiveRoomModal?: () => void;
  onOpenMetronome?: () => void;
  onOpenPricing?: (reason?: string) => void;
  onSaveCustomSong?: (newSong: Song) => void;
  onUpdateCustomKey?: (songId: string, newKey: string) => void;
  onUpdateSong?: (updatedSong: Song) => void;
}

export const StageViewer: React.FC<StageViewerProps> = ({
  song,
  onBack,
  activeSetlist,
  setlists,
  onAddToSetlist,
  onNavigateSetlist,
  onOpenLiveRoomModal,
  onOpenMetronome,
  onOpenPricing,
  onSaveCustomSong,
  onUpdateCustomKey,
  onUpdateSong
}) => {
  const { userProfile, isPro } = useAuth();
  const [isReviseModalOpen, setIsReviseModalOpen] = useState(false);
  const [versionSavedFeedback, setVersionSavedFeedback] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Alterações salvas com sucesso no seu catálogo!');

  const {
    isInRoom,
    isHost,
    currentMember,
    sessionState,
    changeKey,
    changeCapo,
    broadcastScroll,
    toggleFollowScroll,
    sendBandAlert,
    dismissAlert,
    recentAlert
  } = useLiveRoom();

  const isLeaderHost = Boolean(
    isHost ||
    currentMember?.role === 'leader' ||
    currentMember?.isHost === true ||
    (sessionState && currentMember && sessionState.hostId === currentMember.id)
  );

  // Target key for the song: checks active setlist item's customKey first, then song.currentKey, then song.originalKey
  const currentSetlistItem = activeSetlist?.items?.find(it => it.songId === song.id);
  const targetKeyForSong = currentSetlistItem?.customKey || song.currentKey || song.originalKey;

  // Transposition state
  const [semitoneShift, setSemitoneShift] = useState<number>(() => {
    if (isInRoom && sessionState?.semitoneShift !== undefined) {
      return sessionState.semitoneShift;
    }
    return getSemitoneDifference(song.originalKey, targetKeyForSong);
  });

  // Initial capo embedded inside song text (e.g. "Capotraste na 2ª casa")
  const detectedInitialCapo = useMemo(() => {
    const fromText = detectCapoInText(song.content);
    return fromText || 0;
  }, [song.content]);

  const [capoFret, setCapoFret] = useState<number>(() => {
    if (isInRoom && sessionState?.currentCapo !== undefined) {
      return sessionState.currentCapo;
    }
    if (song.capo !== undefined && song.capo > 0) {
      return song.capo;
    }
    return detectedInitialCapo;
  });
  const [isCapoPopoverOpen, setIsCapoPopoverOpen] = useState(false);

  // Single source of truth: when in room, derive from sessionState, otherwise fallback to local state
  const activeCapo = (isInRoom && sessionState?.currentCapo !== undefined)
    ? sessionState.currentCapo
    : capoFret;

  const activeShift = (isInRoom && sessionState?.semitoneShift !== undefined)
    ? sessionState.semitoneShift
    : semitoneShift;

  // Display preferences
  const [theme, setTheme] = useState<StageTheme>('dark-stage');
  const [fontScale, setFontScale] = useState<FontScale>('base');
  const [columnMode, setColumnMode] = useState<ColumnMode>('1-col');
  const [isCleanStage, setIsCleanStage] = useState<boolean>(false);

  // Auto-scroll state & responsive speed ref
  const [isScrolling, setIsScrolling] = useState<boolean>(false);
  const [scrollSpeed, setScrollSpeed] = useState<number>(1.2); // Multiplier
  const scrollSpeedRef = useRef<number>(1.2);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);

  // Audio Preview for online songs
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Chord Modal
  const [selectedChord, setSelectedChord] = useState<string | null>(null);

  // References
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  // Setlist Dropdown & Feedback state
  const [isSetlistDropdownOpen, setIsSetlistDropdownOpen] = useState<boolean>(false);
  const [setlistFeedback, setSetlistFeedback] = useState<string | null>(null);

  // Close setlist dropdown on click outside
  useEffect(() => {
    const handleClickOutside = () => setIsSetlistDropdownOpen(false);
    if (isSetlistDropdownOpen) {
      window.addEventListener('click', handleClickOutside);
      return () => window.removeEventListener('click', handleClickOutside);
    }
  }, [isSetlistDropdownOpen]);

  // Keep scrollSpeedRef always in sync with state for instantaneous speed responsiveness
  useEffect(() => {
    scrollSpeedRef.current = scrollSpeed;
  }, [scrollSpeed]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const handleToggleAudioPreview = () => {
    if (!song.audioPreviewUrl) return;

    if (isPlayingPreview && previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      if (!previewAudioRef.current) {
        const audio = new Audio(song.audioPreviewUrl);
        audio.volume = 0.7;
        audio.onended = () => setIsPlayingPreview(false);
        previewAudioRef.current = audio;
      }
      previewAudioRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  // Sync state from Live Room (Key and Capo) for all participants
  useEffect(() => {
    if (isInRoom) {
      if (sessionState?.semitoneShift !== undefined) {
        setSemitoneShift(sessionState.semitoneShift);
      }
      if (sessionState?.currentCapo !== undefined) {
        setCapoFret(sessionState.currentCapo);
      }
    }
  }, [isInRoom, sessionState?.semitoneShift, sessionState?.currentCapo]);

  // When song changes (for leader or standalone viewer), initialize shift and capo
  useEffect(() => {
    if (!isInRoom || isHost) {
      setSemitoneShift(getSemitoneDifference(song.originalKey, targetKeyForSong));
      setCapoFret(song.capo !== undefined && song.capo > 0 ? song.capo : detectedInitialCapo);
    }
  }, [song.id]);

  // Sync scroll position from Leader in real-time if followScroll is active
  useEffect(() => {
    if (sessionState?.followScroll && !isHost && sessionState.scrollPercentage !== undefined && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const maxScroll = container.scrollHeight - container.clientHeight;
      if (maxScroll > 0) {
        const targetScroll = (sessionState.scrollPercentage / 100) * maxScroll;
        container.scrollTop = targetScroll;
      }
    }
  }, [sessionState?.scrollPercentage, sessionState?.followScroll, isHost]);

  // Manual scroll sync for Leader
  const lastScrollBroadcastRef = useRef<number>(0);
  const handleManualScroll = () => {
    if (isInRoom && isHost && sessionState?.followScroll && scrollContainerRef.current) {
      const now = Date.now();
      if (now - lastScrollBroadcastRef.current > 120) {
        lastScrollBroadcastRef.current = now;
        const container = scrollContainerRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;
        if (maxScroll > 0) {
          const percentage = Math.min(100, Math.round((container.scrollTop / maxScroll) * 100));
          broadcastScroll(percentage);
        }
      }
    }
  };

  // Wake Lock API implementation
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener('release', () => {
          setWakeLockActive(false);
        });
      }
    } catch (err) {
      console.warn('Wake Lock not supported or rejected', err);
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  }, []);

  useEffect(() => {
    requestWakeLock();
    return () => {
      releaseWakeLock();
    };
  }, [requestWakeLock, releaseWakeLock]);

  // Active instrument state
  const [activeInstrument, setActiveInstrument] = useState<string>(userProfile?.instrument || 'Violão / Guitarra');
  const [isInstrumentPopoverOpen, setIsInstrumentPopoverOpen] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile?.instrument) {
      setActiveInstrument(userProfile.instrument);
    }
  }, [userProfile?.instrument]);

  // Instrument transposition offset (Eb = -3 / +9, Bb = +2, C = 0)
  const instrumentOffset = useMemo(() => {
    return isPro ? getInstrumentTranspositionOffset(activeInstrument) : 0;
  }, [activeInstrument, isPro]);

  const isTransposingInstrument = isPro && instrumentOffset !== 0;

  // Real Sounding Key (Tom Real ouvido pela banda)
  const currentKey = useMemo(() => {
    return calculateNewKey(song.originalKey, activeShift);
  }, [song.originalKey, activeShift]);

  // Shape Key (Formato visual dos acordes digitados com os dedos, considerando Capo e Instrumento)
  const shapeKey = useMemo(() => {
    const effectiveCapoShift = activeCapo - detectedInitialCapo;
    const totalChordShift = activeShift - effectiveCapoShift + instrumentOffset;
    return calculateNewKey(song.originalKey, totalChordShift);
  }, [song.originalKey, activeShift, activeCapo, detectedInitialCapo, instrumentOffset]);

  // Transposed song text according to pitch shift, active Capo fret, and instrument offset
  const transposedContent = useMemo(() => {
    const effectiveCapoShift = activeCapo - detectedInitialCapo;
    const totalChordShift = activeShift - effectiveCapoShift + instrumentOffset;
    return transposeSongContent(song.content, totalChordShift, shapeKey);
  }, [song.content, activeShift, activeCapo, detectedInitialCapo, instrumentOffset, shapeKey]);

  // Selected instrument metadata object
  const selectedInstrumentObj = useMemo(() => {
    return INSTRUMENT_OPTIONS.find(i => i.label === activeInstrument) || INSTRUMENT_OPTIONS[0];
  }, [activeInstrument]);

  // Handlers for transposition and persistent song saving
  const handleSemitoneChange = (delta: number) => {
    const newShift = activeShift + delta;
    setSemitoneShift(newShift);
    const newKey = calculateNewKey(song.originalKey, newShift);
    if (isInRoom && isLeaderHost) {
      changeKey(newKey, newShift);
    }
    if (onUpdateCustomKey) {
      onUpdateCustomKey(song.id, newKey);
    }
    if (onUpdateSong) {
      onUpdateSong({ ...song, currentKey: newKey });
    }
  };

  const handleResetKey = () => {
    setSemitoneShift(0);
    if (isInRoom && isLeaderHost) {
      changeKey(song.originalKey, 0);
    }
    if (onUpdateCustomKey) {
      onUpdateCustomKey(song.id, song.originalKey);
    }
    if (onUpdateSong) {
      onUpdateSong({ ...song, currentKey: song.originalKey });
    }
  };

  const handleCapoChange = (newCapo: number) => {
    const validCapo = Math.max(0, Math.min(11, newCapo));
    setCapoFret(validCapo);
    if (isInRoom && isLeaderHost) {
      changeCapo(validCapo);
    }
    if (onUpdateSong) {
      onUpdateSong({ ...song, capo: validCapo > 0 ? validCapo : undefined });
    }
  };

  const handleAdjustSpeed = (delta: number) => {
    setScrollSpeed((prev) => {
      const next = Math.max(0.3, Math.min(6.0, Number((prev + delta).toFixed(1))));
      scrollSpeedRef.current = next;
      return next;
    });
  };

  const handleSetSpeedPreset = (speed: number) => {
    setScrollSpeed(speed);
    scrollSpeedRef.current = speed;
  };

  // High performance auto-scroll loop with instant speed reaction
  const lastAutoScrollBroadcastRef = useRef<number>(0);
  useEffect(() => {
    if (!isScrolling) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let lastTime = performance.now();
    const scrollStep = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const maxScroll = container.scrollHeight - container.clientHeight;

        if (container.scrollTop < maxScroll) {
          // Dynamic pixel movement using active scrollSpeedRef
          // Base speed: 32 pixels/sec * speed multiplier
          const pxToScroll = 32 * scrollSpeedRef.current * delta;
          container.scrollTop += pxToScroll;

          // Broadcast scroll to band if leader (throttled to 200ms to keep connection lightweight and fast)
          if (isInRoom && isHost && sessionState?.followScroll && maxScroll > 0) {
            const now = performance.now();
            if (now - lastAutoScrollBroadcastRef.current > 200) {
              lastAutoScrollBroadcastRef.current = now;
              const percentage = Math.min(100, Math.round((container.scrollTop / maxScroll) * 100));
              broadcastScroll(percentage);
            }
          }

          animationFrameRef.current = requestAnimationFrame(scrollStep);
        } else {
          setIsScrolling(false);
        }
      }
    };


    animationFrameRef.current = requestAnimationFrame(scrollStep);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isScrolling, isInRoom, isHost, sessionState?.followScroll, broadcastScroll]);

  // Keyboard shortcut listener (Space = toggle scroll, Alt+Up/Down = transpose)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsScrolling(prev => !prev);
      } else if (e.code === 'ArrowUp' && e.altKey) {
        e.preventDefault();
        handleSemitoneChange(1);
      } else if (e.code === 'ArrowDown' && e.altKey) {
        e.preventDefault();
        handleSemitoneChange(-1);
      } else if (e.key === 'f' || e.key === 'F') {
        setIsCleanStage(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeShift, song.originalKey, isInRoom, isLeaderHost]);

  const handlePrintSong = () => {
    if (!isPro) {
      if (onOpenPricing) {
        onOpenPricing('A exportação e impressão de cifras em folha A4 e PDF diagramado é exclusiva do Plano Pro.');
      }
      return;
    }
    const html = generateSingleSongPdfHtml({
      song,
      effectiveKey: shapeKey,
      capo: activeCapo,
      instrument: activeInstrument,
      columnsCount: columnMode === '2' ? '2' : '1',
      fontSize: fontScale === 'small' ? 'sm' : fontScale === 'large' ? 'lg' : 'base'
    });
    const docTitle = `Cifra_${song.title.replace(/\s+/g, '_')}_${shapeKey}_Cifrae`;
    printHtmlDocument(html, docTitle);
  };

  // Theme styling definitions
  const themeStyles = {
    'dark-stage': {
      bg: 'bg-zinc-950 text-zinc-100',
      cardBg: 'bg-zinc-900/90 border-zinc-800',
      chordColor: 'text-emerald-400 font-bold',
      lyricColor: 'text-zinc-100',
      sectionColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      hudBg: 'bg-zinc-900/95 border-zinc-700/80 text-white backdrop-blur-md'
    },
    'oled': {
      bg: 'bg-black text-white',
      cardBg: 'bg-zinc-950 border-zinc-900',
      chordColor: 'text-amber-400 font-bold',
      lyricColor: 'text-white',
      sectionColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      hudBg: 'bg-black/95 border-zinc-800 text-white backdrop-blur-md'
    },
    'sepia': {
      bg: 'bg-[#f4ecd8] text-[#2c2416]',
      cardBg: 'bg-[#ebe0c5] border-[#d8c8a8]',
      chordColor: 'text-[#8b2500] font-bold',
      lyricColor: 'text-[#1c160c]',
      sectionColor: 'text-[#5a3e1b] bg-[#dfd0b0] border-[#bda682]',
      hudBg: 'bg-[#ebe0c5]/95 border-[#caba98] text-[#2c2416] backdrop-blur-md shadow-xl'
    },
    'light-contrast': {
      bg: 'bg-slate-50 text-slate-900',
      cardBg: 'bg-white border-slate-200 shadow-sm',
      chordColor: 'text-blue-700 font-bold',
      lyricColor: 'text-slate-950 font-medium',
      sectionColor: 'text-indigo-800 bg-indigo-50 border-indigo-200',
      hudBg: 'bg-white/95 border-slate-300 text-slate-900 backdrop-blur-md shadow-xl'
    }
  }[theme];

  // Font scale class for pixel-perfect mono font rendering
  const fontClass = {
    sm: 'text-xs sm:text-sm leading-relaxed',
    base: 'text-sm sm:text-base leading-relaxed',
    lg: 'text-base sm:text-lg leading-relaxed',
    xl: 'text-lg sm:text-xl leading-relaxed',
    '2xl': 'text-xl sm:text-2xl leading-loose'
  }[fontScale];

  // Split lines for rendering
  const lines = transposedContent.split('\n');

  // Split into 2 columns if requested
  const midPoint = Math.ceil(lines.length / 2);
  const col1Lines = columnMode === '2-col' ? lines.slice(0, midPoint) : lines;
  const col2Lines = columnMode === '2-col' ? lines.slice(midPoint) : [];

  // Realistic Character-Aligned Chord & Lyrics Renderer
  const renderLinesBlock = (linesToRender: string[]) => {
    return linesToRender.map((line, idx) => {
      const trimmed = line.trim();

      // Section Header (e.g. [Refrão], [Intro], [Primeira Parte])
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        return (
          <div key={idx} className="pt-4 pb-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider border shadow-sm ${themeStyles.sectionColor}`}>
              <Sparkles className="w-3.5 h-3.5" />
              {trimmed.replace(/[\[\]]/g, '')}
            </span>
          </div>
        );
      }

      // Empty line spacer
      if (!trimmed) {
        return <div key={idx} className="h-3.5" />;
      }

      // Pure Chord Line (spaced with whitespace-pre so chords sit exactly above lyrics)
      if (isChordLine(line)) {
        // Tokenize into whitespace and chords while preserving character offsets
        const tokens = line.split(/(\s+)/);
        return (
          <div
            key={idx}
            className={`font-mono whitespace-pre ${themeStyles.chordColor} select-none font-black tracking-normal leading-tight`}
          >
            {tokens.map((token, tIdx) => {
              if (!token.trim()) {
                return <span key={tIdx}>{token}</span>;
              }
              const cleanChord = token.replace(/^[[(]|[)\]]$/g, '');
              return (
                <span
                  key={tIdx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedChord(cleanChord);
                  }}
                  className="cursor-pointer hover:underline hover:text-amber-400 transition-colors inline font-extrabold"
                  title="Clique para ver o diagrama e ouvir o acorde"
                >
                  {token}
                </span>
              );
            })}
          </div>
        );
      }

      // Standard Lyrics Line (aligned in font-mono with whitespace-pre so characters align 1:1 with chords above)
      return (
        <div
          key={idx}
          className={`font-mono whitespace-pre-wrap ${themeStyles.lyricColor} font-medium tracking-normal leading-relaxed`}
        >
          {line}
        </div>
      );
    });
  };

  // Find setlist index if active
  const setlistIndex = useMemo(() => {
    if (!activeSetlist) return null;
    const idx = activeSetlist.items.findIndex(item => item.songId === song.id);
    return idx !== -1 ? { current: idx + 1, total: activeSetlist.items.length } : null;
  }, [activeSetlist, song.id]);

  return (
    <div className={`fixed inset-0 z-40 flex flex-col ${themeStyles.bg} transition-colors duration-300 select-text overflow-hidden`}>
      {/* 🚨 High Visibility Live Band Alert Banner */}
      {recentAlert && (
        <div className="fixed top-3 inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 animate-bounce">
          <div className="flex items-center gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-amber-500 text-zinc-950 font-black shadow-2xl border-2 border-white text-sm sm:text-base uppercase tracking-wide">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse flex-none" />
            <div className="flex items-center gap-2 flex-1">
              <span>ALERTA DA BANDA: {recentAlert.message}</span>
              <span className="text-[11px] sm:text-xs bg-black/20 px-2 py-0.5 rounded font-bold">({recentAlert.senderName})</span>
            </div>
            <button
              onClick={() => dismissAlert()}
              className="p-1 -mr-1 rounded-full hover:bg-black/20 active:scale-90 text-zinc-950 transition flex items-center justify-center cursor-pointer flex-none"
              title="Fechar Recado (X)"
              aria-label="Fechar Recado"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar / Control Bar */}
      {!isCleanStage && (
        <header className="flex-none border-b border-zinc-800/80 px-4 py-2.5 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between gap-2 z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Voltar ao Catálogo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white truncate max-w-[180px] sm:max-w-md">
                  {song.title}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {song.liturgicalMoment}
                </span>
                {song.isCustom && (
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 shadow-sm">
                    Própria
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Room Status Indicator */}
            {isInRoom ? (
              <button
                onClick={onOpenLiveRoomModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold animate-pulse hover:bg-emerald-500/30 transition"
              >
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">SALA: {sessionState?.pin}</span>
                <span className="sm:hidden">{sessionState?.pin}</span>
              </button>
            ) : (
              <button
                onClick={onOpenLiveRoomModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700 text-xs font-semibold transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Modo Ensaio Ao Vivo</span>
              </button>
            )}

            {/* Metronome Shortcut */}
            <button
              onClick={onOpenMetronome}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Abrir Metrônomo"
            >
              <Music className="w-5 h-5" />
            </button>

            {/* 📋 Adicionar ao Repertório Button & Dropdown */}
            {onAddToSetlist && (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsSetlistDropdownOpen(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm border ${
                    isSetlistDropdownOpen
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 font-extrabold'
                      : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border-zinc-700 hover:border-emerald-500/40'
                  }`}
                  title="Adicionar esta música a um Repertório"
                >
                  <ListPlus className="w-4 h-4 text-emerald-400" />
                  <span className="hidden md:inline">Repertório</span>
                </button>

                {/* Dropdown Menu de Repertórios */}
                {isSetlistDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 text-left">
                    <div className="px-2 py-1 border-b border-zinc-800 mb-1.5 flex items-center gap-1.5 text-[10px] uppercase font-black tracking-wider text-zinc-400">
                      <ListMusic className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Escolha o Repertório:</span>
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1">
                      {setlists && setlists.length > 0 ? (
                        setlists.map((sl) => {
                          const isAlreadyIn = sl.items.some(it => it.songId === song.id);
                          return (
                            <button
                              key={sl.id}
                              disabled={isAlreadyIn}
                              onClick={() => {
                                onAddToSetlist(song, sl.id);
                                setIsSetlistDropdownOpen(false);
                                setSetlistFeedback(sl.title);
                                setTimeout(() => setSetlistFeedback(null), 3500);
                              }}
                              className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-semibold truncate transition flex items-center justify-between group ${
                                isAlreadyIn
                                  ? 'bg-emerald-500/10 text-emerald-300 opacity-80 cursor-default'
                                  : 'hover:bg-zinc-800 text-zinc-200'
                              }`}
                            >
                              <span className="truncate pr-2">{sl.title}</span>
                              {isAlreadyIn ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 flex-none">
                                  <Check className="w-3.5 h-3.5" />
                                  Adicionada
                                </span>
                              ) : (
                                <Plus className="w-3.5 h-3.5 text-zinc-400 group-hover:text-emerald-400 flex-none" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-2 py-3 text-xs text-zinc-400 text-center">
                          Nenhum repertório criado ainda. Crie um repertório na aba Repertórios!
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ✏️ Editar / Revisar Cifra */}
            <button
              onClick={() => {
                if (!isPro) {
                  if (onOpenPricing) {
                    onOpenPricing('A personalização de arranjos e criação de versões próprias de cifras é exclusiva do Plano Pro.');
                  }
                  return;
                }
                setIsReviseModalOpen(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm border ${
                isPro
                  ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white border-zinc-700 hover:border-amber-500/40'
              }`}
              title={isPro ? "Editar acordes, letra e personalizar esta cifra" : "Editar Cifra (Exclusivo Pro)"}
            >
              <Edit3 className={`w-3.5 h-3.5 ${isPro ? 'text-amber-400' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">Editar Cifra</span>
              {!isPro && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
            </button>

            {/* 📄 Exportar PDF / Imprimir Cifra */}
            <button
              onClick={handlePrintSong}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm border ${
                isPro
                  ? 'bg-zinc-800/90 hover:bg-zinc-700 text-white border-zinc-700 hover:border-emerald-500/50'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white border-zinc-700 hover:border-emerald-500/40'
              }`}
              title={isPro ? "Imprimir ou Salvar esta Cifra em PDF A4" : "Exportar em PDF (Exclusivo Pro)"}
            >
              <FileText className={`w-3.5 h-3.5 ${isPro ? 'text-emerald-400' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">PDF</span>
              {!isPro && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
            </button>


            {/* Stage Fullscreen Clean Trigger */}
            <button
              onClick={() => setIsCleanStage(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition"
              title="Entrar no Modo Palco Limpo (Full Screen)"
            >
              <Tv className="w-4 h-4" />
              <span className="hidden md:inline">Modo Palco</span>
            </button>
          </div>
        </header>
      )}

      {/* Setlist Feedback Notification Toast */}
      {setlistFeedback && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-emerald-500 text-zinc-950 font-black text-xs sm:text-sm shadow-2xl shadow-emerald-900/50 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Música adicionada ao repertório "{setlistFeedback}"!</span>
        </div>
      )}

      {/* Main Stage Lyrics Area */}
      <main
        ref={scrollContainerRef}
        onScroll={handleManualScroll}
        onClick={() => setIsScrolling(prev => !prev)}
        className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 cursor-pointer select-text relative scroll-smooth"
      >
        {/* Floating Quick Restore Button when in Clean Stage Mode */}
        {isCleanStage && (
          <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsCleanStage(false);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 text-zinc-200 border border-zinc-700/80 hover:bg-zinc-800 text-xs font-bold backdrop-blur-md shadow-xl"
            >
              <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
              Sair do Palco Limpo
            </button>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          {/* Song Header & Key Info inside Stage View */}
          <div className="mb-6 pb-4 border-b border-zinc-800/40 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                  {song.title}
                </h2>
                {song.parentSongId && (
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    {song.versionName || 'Minha Versão'}
                  </span>
                )}
                {song.privacy && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    song.privacy === 'private'
                      ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      : song.privacy === 'unlisted'
                      ? 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
                  }`}>
                    {song.privacy === 'private' ? '🔒 Privada' : song.privacy === 'unlisted' ? '🔗 Não Listada' : '🌍 Pública'}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <span>{song.artist}</span>
                <span>•</span>
                <span>BPM: <strong className="text-white font-mono">{song.bpm}</strong></span>
                <span>•</span>
                <span>Compasso: <strong className="text-white font-mono">{song.timeSignature}</strong></span>
                {wakeLockActive && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      💡 Tela Sempre Ligada
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Key / Tom Badges & Audio Player */}
            <div className="flex flex-wrap items-center gap-3">
              {song.audioPreviewUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleAudioPreview();
                  }}
                  className={`px-4 py-2 rounded-2xl border flex items-center gap-2 text-xs font-black transition shadow-lg ${
                    isPlayingPreview
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 animate-pulse'
                      : 'bg-zinc-900/90 text-zinc-200 border-zinc-700 hover:border-emerald-500 hover:text-white'
                  }`}
                  title="Ouvir 30 segundos da gravação original"
                >
                  {isPlayingPreview ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  <span>{isPlayingPreview ? 'Pausar Áudio' : 'Ouvir Áudio Original'}</span>
                </button>
              )}

              <div className="px-4 py-2 rounded-2xl bg-zinc-900/90 border border-zinc-700/80 text-center shadow-lg">
                <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">Tom Real</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{currentKey}</span>
              </div>

              {activeCapo > 0 && (
                <div className="px-3.5 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center shadow-lg">
                  <span className="text-[10px] uppercase font-bold text-amber-400/80 block tracking-wider">Formato</span>
                  <span className="text-2xl font-black text-amber-300 font-mono">{shapeKey}</span>
                </div>
              )}

              {activeShift !== 0 && (
                <div className="px-3 py-2 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Original</span>
                  <span className="text-base font-bold text-zinc-300 font-mono">{song.originalKey}</span>
                </div>
              )}

              {/* Interactive Capotraste Selector */}
              <div className="relative">
                <button
                  onClick={() => setIsCapoPopoverOpen(prev => !prev)}
                  className={`px-4 py-2 rounded-2xl border transition-all text-center shadow-lg flex items-center gap-2.5 ${
                    activeCapo > 0
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                      : 'bg-zinc-900/90 text-zinc-400 border-zinc-700 hover:border-amber-500/60 hover:text-white'
                  }`}
                  title="Clique para adicionar ou alterar o Capotraste"
                >
                  <Sliders className="w-4 h-4 text-amber-400 flex-none" />
                  <div className="text-left">
                    <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-tight">
                      Capotraste
                    </span>
                    <span className={`text-sm font-black ${activeCapo > 0 ? 'text-amber-300' : 'text-zinc-300'}`}>
                      {activeCapo > 0 ? `${activeCapo}ª casa` : 'Sem Capo'}
                    </span>
                  </div>
                </button>

                {/* Capo Popover Modal */}
                {isCapoPopoverOpen && (
                  <div className="absolute left-0 sm:right-0 top-full mt-2 w-64 p-3 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-2xl z-40 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-black uppercase text-zinc-200">Capotraste</span>
                      </div>
                      <button
                        onClick={() => setIsCapoPopoverOpen(false)}
                        className="text-xs text-zinc-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-800"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-400 mb-2 leading-tight">
                      Escolha a casa onde prender o capotraste no braço do instrumento:
                    </p>

                    <div className="grid grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((fret) => (
                        <button
                          key={fret}
                          onClick={() => {
                            handleCapoChange(fret);
                            setIsCapoPopoverOpen(false);
                          }}
                          className={`py-1.5 px-1 rounded-xl text-xs font-bold transition text-center ${
                            activeCapo === fret
                              ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                              : 'bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                          }`}
                        >
                          {fret === 0 ? 'Nenhum' : `${fret}ª`}
                        </button>
                      ))}
                    </div>


                    {activeCapo > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-zinc-800 text-[11px] text-zinc-300 flex items-center justify-between">
                        <span>Formato dos acordes:</span>
                        <strong className="text-amber-400 font-mono font-bold text-xs">{shapeKey}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Interactive Instrument Adaptor (Violão, Teclado, Ukulele, Cavaco, Sax Eb, Trompete Bb) */}
              <div className="relative">
                <button
                  onClick={() => setIsInstrumentPopoverOpen(prev => !prev)}
                  className={`px-4 py-2 rounded-2xl border transition-all text-center shadow-lg flex items-center gap-2.5 ${
                    isTransposingInstrument || activeInstrument !== 'Violão / Guitarra'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                      : 'bg-zinc-900/90 text-zinc-400 border-zinc-700 hover:border-emerald-500/60 hover:text-white'
                  }`}
                  title="Adaptação inteligente de cifras por instrumento"
                >
                  <span className="text-base">{selectedInstrumentObj.icon}</span>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block leading-tight">
                        Instrumento
                      </span>
                      {!isPro && <Lock className="w-2.5 h-2.5 text-amber-400" />}
                    </div>
                    <span className="text-xs font-black text-emerald-300 truncate max-w-[120px] block">
                      {activeInstrument.split('/')[0].trim()}
                    </span>
                  </div>
                </button>

                {/* Instrument Popover Modal */}
                {isInstrumentPopoverOpen && (
                  <div className="absolute left-0 sm:right-0 top-full mt-2 w-72 p-3.5 rounded-3xl bg-zinc-900 border border-zinc-700 shadow-2xl z-40 animate-in fade-in space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{selectedInstrumentObj.icon}</span>
                        <span className="text-xs font-black uppercase text-zinc-200">Adaptar Cifra ao Instrumento</span>
                      </div>
                      <button
                        onClick={() => setIsInstrumentPopoverOpen(false)}
                        className="text-xs text-zinc-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-800"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-400 leading-tight">
                      Adapta diagramas, digitações e transpõe automaticamente para instrumentos em Eb / Bb:
                    </p>

                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                      {INSTRUMENT_OPTIONS.map((inst) => {
                        const isSelected = activeInstrument === inst.label;
                        const isLocked = inst.label !== 'Violão / Guitarra' && !isPro;

                        return (
                          <button
                            key={inst.id}
                            onClick={() => {
                              if (isLocked) {
                                if (onOpenPricing) {
                                  onOpenPricing(`A adaptação inteligente de cifras para ${inst.label} é exclusiva do Plano Pro.`);
                                }
                                return;
                              }
                              setActiveInstrument(inst.label);
                              setIsInstrumentPopoverOpen(false);
                            }}
                            className={`w-full p-2 rounded-2xl border text-left transition flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'bg-emerald-500/20 border-emerald-500/60 text-white'
                                : 'bg-zinc-950/70 border-zinc-800 text-zinc-300 hover:bg-zinc-800/80 hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-lg flex-none">{inst.icon}</span>
                              <div className="min-w-0">
                                <span className="text-xs font-bold block truncate">{inst.label}</span>
                                <span className="text-[10px] text-zinc-500 block truncate">{inst.tuning}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-none">
                              {inst.isTransposing && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[9px] font-mono font-bold">
                                  {inst.transpositionSemitones > 0 ? `+${inst.transpositionSemitones}` : inst.transpositionSemitones}st
                                </span>
                              )}
                              {isLocked ? (
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                              ) : isSelected ? (
                                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {isTransposingInstrument && (
                      <div className="pt-2 border-t border-zinc-800 text-[11px] text-emerald-300 bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30">
                        <span>Transposição aplicada ao seu instrumento: </span>
                        <strong>{instrumentOffset > 0 ? `+${instrumentOffset}` : instrumentOffset} semitons</strong>
                        <div className="text-[10px] text-zinc-400 mt-0.5">
                          Tom Visual: <strong className="text-white font-mono">{shapeKey}</strong> (Tom Real Banda: {currentKey})
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Render Lyrics & Chords in 1 or 2 Columns with pixel-perfect character alignment */}
          <div className={`${fontClass}`}>
            {columnMode === '1-col' ? (
              <div className="space-y-0.5">{renderLinesBlock(col1Lines)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-0.5">{renderLinesBlock(col1Lines)}</div>
                <div className="space-y-0.5">{renderLinesBlock(col2Lines)}</div>
              </div>
            )}
          </div>

          {/* Spacer for comfortable stage scrolling */}
          <div className="h-48" />
        </div>
      </main>

      {/* 🎛️ Floating Stage HUD / Controls */}
      <footer className="flex-none p-3 sm:p-4 bg-zinc-950/95 border-t border-zinc-800/90 backdrop-blur-lg z-30">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Left: Pitch & Capo Controllers */}
          <div className="flex items-center gap-2">
            {/* Transpose Controller (+ / - semitones) */}
            <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/80 p-1 rounded-2xl shadow-inner">
              <span className="text-xs font-bold text-zinc-400 px-2 font-mono">TOM</span>
              <button
                onClick={() => handleSemitoneChange(-1)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-lg flex items-center justify-center transition active:scale-95"
                title="Diminuir meio-tom (-1 semitom)"
              >
                -
              </button>
              <div className="px-2 text-center min-w-[50px]">
                <span className="text-base font-black text-emerald-400 font-mono">{currentKey}</span>
                {activeShift !== 0 && (
                  <span className="text-[10px] text-zinc-400 block font-mono">
                    {activeShift > 0 ? `+${activeShift}` : activeShift}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleSemitoneChange(1)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-lg flex items-center justify-center transition active:scale-95"
                title="Aumentar meio-tom (+1 semitom)"
              >
                +
              </button>
              {activeShift !== 0 && (
                <button
                  onClick={handleResetKey}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition text-xs"
                  title="Restaurar Tom Original"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Capotraste Controller */}
            <div className="flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-700/80 p-1 rounded-2xl shadow-inner">
              <span className="text-xs font-bold text-amber-400 px-2 font-mono flex items-center gap-1">
                <Sliders className="w-3 h-3" />
                CAPO
              </span>
              <button
                onClick={() => handleCapoChange(activeCapo - 1)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-lg flex items-center justify-center transition active:scale-95"
                title="Diminuir casa do capotraste"
              >
                -
              </button>
              <div
                onClick={() => setIsCapoPopoverOpen(prev => !prev)}
                className="px-2 text-center min-w-[42px] cursor-pointer hover:bg-zinc-800 rounded-lg py-0.5 transition"
                title="Clique para abrir seletor de capotraste"
              >
                <span className={`text-sm font-black font-mono ${activeCapo > 0 ? 'text-amber-400' : 'text-zinc-400'}`}>
                  {activeCapo > 0 ? `${activeCapo}ª` : '0'}
                </span>
              </div>
              <button
                onClick={() => handleCapoChange(activeCapo + 1)}
                className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-lg flex items-center justify-center transition active:scale-95"
                title="Aumentar casa do capotraste"
              >
                +
              </button>
            </div>

          </div>

          {/* Center: Dynamic Auto-Scroll Controller with Live Multiplier & Stepper */}
          <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-700/80 px-3 py-1.5 rounded-2xl shadow-lg">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsScrolling(prev => !prev);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition shadow-md ${
                isScrolling
                  ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isScrolling ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isScrolling ? 'Pausar Rolagem' : 'Auto-Rolagem'}</span>
            </button>

            {/* Stepper + & - */}
            <div className="flex items-center gap-1 pl-2 border-l border-zinc-700/80">
              <button
                onClick={() => handleAdjustSpeed(-0.2)}
                className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-bold transition"
                title="Diminuir velocidade (-0.2x)"
              >
                <Minus className="w-3 h-3" />
              </button>

              <span className="text-xs font-mono font-black text-emerald-400 px-1.5 min-w-[38px] text-center">
                {scrollSpeed.toFixed(1)}x
              </span>

              <button
                onClick={() => handleAdjustSpeed(0.2)}
                className="w-6 h-6 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center text-xs font-bold transition"
                title="Aumentar velocidade (+0.2x)"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Speed Presets */}
            <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-zinc-700/80">
              {[
                { label: '0.5x', value: 0.5 },
                { label: '1.0x', value: 1.0 },
                { label: '1.8x', value: 1.8 },
                { label: '3.0x', value: 3.0 },
                { label: '5.0x', value: 5.0 }
              ].map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handleSetSpeedPreset(preset.value)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                    scrollSpeed === preset.value
                      ? 'bg-emerald-500 text-zinc-950 font-black shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Layout & Stage Display Tools */}
          <div className="flex items-center gap-2">
            {/* Font Scale Selector */}
            <div className="flex items-center bg-zinc-900/90 border border-zinc-700/80 p-1 rounded-2xl">
              <span className="text-[10px] font-bold text-zinc-400 px-1.5">FONTE</span>
              {(['sm', 'base', 'lg', 'xl', '2xl'] as FontScale[]).map((scale, i) => {
                const labels = ['P', 'M', 'G', 'GG', 'XGG'];
                return (
                  <button
                    key={scale}
                    onClick={() => setFontScale(scale)}
                    className={`px-2 py-1 rounded-xl text-xs font-extrabold transition ${
                      fontScale === scale
                        ? 'bg-emerald-500 text-zinc-950 font-black'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {labels[i]}
                  </button>
                );
              })}
            </div>

            {/* 1 Col vs 2 Col */}
            <button
              onClick={() => setColumnMode(prev => prev === '1-col' ? '2-col' : '1-col')}
              className={`p-2 rounded-xl border transition ${
                columnMode === '2-col'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white'
              }`}
              title={columnMode === '2-col' ? 'Mudar para 1 Coluna' : 'Mudar para 2 Colunas (Tablets / Monitores)'}
            >
              <Columns className="w-4 h-4" />
            </button>

            {/* Stage Themes */}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as StageTheme)}
              className="bg-zinc-900 border border-zinc-700 text-xs font-bold rounded-xl px-2.5 py-2 text-zinc-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="dark-stage">Dark Stage</option>
              <option value="oled">OLED Black</option>
              <option value="sepia">Sépia Vintage</option>
              <option value="light-contrast">Light Contrast</option>
            </select>
          </div>
        </div>

        {/* Setlist Navigation Bar if Active */}
        {activeSetlist && (
          <div className="mt-2 pt-2 border-t border-zinc-800/80 flex items-center justify-between max-w-6xl mx-auto text-xs">
            {(!isInRoom || isHost) && onNavigateSetlist ? (
              <button
                onClick={() => onNavigateSetlist('prev')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-700"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Anterior</span>
              </button>
            ) : (
              <div className="w-16" />
            )}

            <div className="text-zinc-400 font-medium text-center">
              <span>Repertório: <strong className="text-white">{activeSetlist.title}</strong>{' '}</span>
              {setlistIndex && `(${setlistIndex.current} de ${setlistIndex.total})`}
              {isInRoom && !isHost && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 inline-block">
                  Sincronizado com o Líder
                </span>
              )}
            </div>

            {(!isInRoom || isHost) && onNavigateSetlist ? (
              <button
                onClick={() => onNavigateSetlist('next')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-700"
              >
                <span>Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-16" />
            )}
          </div>
        )}

        {/* Leader Quick Band Cues Bar */}
        {isInRoom && isHost && (
          <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center gap-2 overflow-x-auto max-w-6xl mx-auto text-xs py-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex-none">
              Comandos Banda:
            </span>
            <button
              onClick={() => sendBandAlert('REPETIR REFRÃO 🔁', 'repeat-chorus')}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-emerald-500/20 text-zinc-200 border border-zinc-700 hover:border-emerald-500 text-xs font-bold transition flex-none"
            >
              🔁 Repetir Refrão
            </button>
            <button
              onClick={() => sendBandAlert('IR PARA A PONTE ⚡', 'bridge')}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-amber-500/20 text-zinc-200 border border-zinc-700 hover:border-amber-500 text-xs font-bold transition flex-none"
            >
              ⚡ Ponte
            </button>
            <button
              onClick={() => sendBandAlert('SOLO INSTRUMENTAL 🎸', 'solo')}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-purple-500/20 text-zinc-200 border border-zinc-700 hover:border-purple-500 text-xs font-bold transition flex-none"
            >
              🎸 Solo
            </button>
            <button
              onClick={() => sendBandAlert('SUAVE / VOZ E VIOLÃO 🤫', 'soft')}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-blue-500/20 text-zinc-200 border border-zinc-700 hover:border-blue-500 text-xs font-bold transition flex-none"
            >
              🤫 Suave
            </button>
            <button
              onClick={() => sendBandAlert('FINALIZAR 🛑', 'outro')}
              className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-rose-500/20 text-zinc-200 border border-zinc-700 hover:border-rose-500 text-xs font-bold transition flex-none"
            >
              🛑 Finalizar
            </button>
          </div>
        )}
      </footer>

      {/* Interactive Chord Diagram Modal */}
      {selectedChord && (
        <ChordModal
          chord={selectedChord}
          onClose={() => setSelectedChord(null)}
          userInstrument={activeInstrument}
          isPro={isPro}
          onOpenPricing={onOpenPricing}
        />
      )}

      {/* ✏️ Modal Editar / Revisar Cifra */}
      {isReviseModalOpen && (
        <ReviseSongModal
          isOpen={isReviseModalOpen}
          onClose={() => setIsReviseModalOpen(false)}
          song={song}
          onSaveVersion={(savedSong, mode) => {
            if (mode === 'update') {
              if (onUpdateSong) {
                onUpdateSong(savedSong);
              }
              if (onSaveCustomSong) {
                onSaveCustomSong(savedSong);
              }
              setFeedbackMessage('Alterações salvas com sucesso nesta música!');
            } else {
              if (onSaveCustomSong) {
                onSaveCustomSong(savedSong);
              }
              setFeedbackMessage('Nova versão salva com sucesso no catálogo!');
            }
            setVersionSavedFeedback(true);
            setTimeout(() => setVersionSavedFeedback(false), 3500);
          }}
        />
      )}

      {/* Version Saved Notification Toast */}
      {versionSavedFeedback && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="px-5 py-3 rounded-2xl bg-emerald-500 text-zinc-950 font-black shadow-2xl flex items-center gap-2 text-xs sm:text-sm">
            <Check className="w-5 h-5" />
            <span>{feedbackMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { Song, Setlist, LiturgicalMoment } from './types';
import { INITIAL_SONGS, INITIAL_SETLISTS, CATALOG_VERSION } from './data/songsData';
import { LiveRoomProvider, useLiveRoom } from './context/LiveRoomContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DiscoveryHub } from './components/DiscoveryHub';
import { StageViewer } from './components/StageViewer';
import { SetlistsManager } from './components/SetlistsManager';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { LiveRoomModal } from './components/LiveRoomModal';
import { MetronomeModal } from './components/MetronomeModal';
import { TunerModal } from './components/TunerModal';
import { PricingModal } from './components/PricingModal';
import { AuthModal } from './components/AuthModal';
import { UserProfileModal } from './components/UserProfileModal';
import { UploadSongModal } from './components/UploadSongModal';

const MainAppContent: React.FC = () => {
  const { isInRoom, isHost, sessionState, selectSong } = useLiveRoom();
  const { isPro, userProfile, isLoading } = useAuth();

  // User-isolated songs and setlists state
  const [songs, setSongs] = useState<Song[]>(() => {
    if (typeof window === 'undefined' || !userProfile?.uid) return INITIAL_SONGS;
    const userCatalogVerKey = `cifrasync_catalog_ver_${userProfile.uid}`;
    const savedVer = localStorage.getItem(userCatalogVerKey);
    if (savedVer !== CATALOG_VERSION) return INITIAL_SONGS;
    const saved = localStorage.getItem(`cifrasync_songs_${userProfile.uid}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_SONGS;
  });

  const [setlists, setSetlists] = useState<Setlist[]>(() => {
    if (typeof window === 'undefined' || !userProfile?.uid) return INITIAL_SETLISTS;
    const userCatalogVerKey = `cifrasync_catalog_ver_${userProfile.uid}`;
    const savedVer = localStorage.getItem(userCatalogVerKey);
    if (savedVer !== CATALOG_VERSION) return INITIAL_SETLISTS;
    const saved = localStorage.getItem(`cifrasync_setlists_${userProfile.uid}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_SETLISTS;
  });

  // Automatically load the isolated workspace for the logged-in user
  useEffect(() => {
    if (userProfile?.uid) {
      const userSongsKey = `cifrasync_songs_${userProfile.uid}`;
      const userSetlistsKey = `cifrasync_setlists_${userProfile.uid}`;
      const userCatalogVerKey = `cifrasync_catalog_ver_${userProfile.uid}`;

      const savedVer = localStorage.getItem(userCatalogVerKey);
      const savedSongs = localStorage.getItem(userSongsKey);

      // If version changed (e.g. platform pivot to multi-genre), automatically refresh catalog
      if (savedVer !== CATALOG_VERSION) {
        let customSongs: Song[] = [];
        if (savedSongs) {
          try {
            const parsed = JSON.parse(savedSongs);
            if (Array.isArray(parsed)) {
              customSongs = parsed.filter((s: Song) => s.isCustom);
            }
          } catch (e) {}
        }
        const freshSongs = [...INITIAL_SONGS, ...customSongs];
        setSongs(freshSongs);
        setSetlists(INITIAL_SETLISTS);
        localStorage.setItem(userSongsKey, JSON.stringify(freshSongs));
        localStorage.setItem(userSetlistsKey, JSON.stringify(INITIAL_SETLISTS));
        localStorage.setItem(userCatalogVerKey, CATALOG_VERSION);
      } else if (savedSongs) {
        try {
          setSongs(JSON.parse(savedSongs));
        } catch (e) {
          setSongs(INITIAL_SONGS);
        }
      } else {
        setSongs(INITIAL_SONGS);
      }

      if (savedVer === CATALOG_VERSION) {
        const savedSetlists = localStorage.getItem(userSetlistsKey);
        if (savedSetlists) {
          try {
            setSetlists(JSON.parse(savedSetlists));
          } catch (e) {
            setSetlists(INITIAL_SETLISTS);
          }
        } else {
          setSetlists(INITIAL_SETLISTS);
        }
      }
    } else {
      setSongs(INITIAL_SONGS);
      setSetlists(INITIAL_SETLISTS);
      setSelectedSong(null);
      setActiveSetlist(null);
    }
  }, [userProfile?.uid]);

  // Navigation and active views
  const [currentView, setCurrentView] = useState<'discovery' | 'setlists'>('discovery');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activeSetlist, setActiveSetlist] = useState<Setlist | null>(null);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isLiveRoomModalOpen, setIsLiveRoomModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [isMetronomeOpen, setIsMetronomeOpen] = useState<boolean>(false);
  const [isTunerOpen, setIsTunerOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [pricingReason, setPricingReason] = useState<string | undefined>(undefined);
  const [uploadPresetMoment, setUploadPresetMoment] = useState<LiturgicalMoment | undefined>(undefined);

  // Save changes isolated per user
  useEffect(() => {
    if (userProfile?.uid) {
      localStorage.setItem(`cifrasync_songs_${userProfile.uid}`, JSON.stringify(songs));
    }
  }, [songs, userProfile?.uid]);

  useEffect(() => {
    if (userProfile?.uid) {
      localStorage.setItem(`cifrasync_setlists_${userProfile.uid}`, JSON.stringify(setlists));
    }
  }, [setlists, userProfile?.uid]);

  // Sync active song with Live Room state if changed remotely by Host or upon joining room
  useEffect(() => {
    if (!sessionState) return;

    if (sessionState.currentSong) {
      const incomingSong = sessionState.currentSong;
      setSelectedSong(incomingSong);
      setSongs(prev => {
        const existingIdx = prev.findIndex(s => s.id === incomingSong.id);
        if (existingIdx === -1) {
          return [incomingSong, ...prev];
        }
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...incomingSong };
        return updated;
      });
    } else if (sessionState.currentSongId) {
      const targetSong = songs.find(s => s.id === sessionState.currentSongId);
      if (targetSong) {
        setSelectedSong(targetSong);
      }
    }
  }, [sessionState?.currentSong, sessionState?.currentSongId, sessionState?.lastUpdated]);

  // Setlist sync if active in room
  useEffect(() => {
    if (sessionState?.activeSetlistId) {
      const targetSetlist = setlists.find(sl => sl.id === sessionState.activeSetlistId);
      if (targetSetlist) {
        setActiveSetlist(targetSetlist);
      }
    }
  }, [sessionState?.activeSetlistId, setlists]);

  // Global Keyboard Shortcut: Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenPricingWithReason = (reason?: string) => {
    setPricingReason(reason);
    setIsPricingOpen(true);
  };

  // Handlers
  const handleSelectSong = (song: Song, setlist?: Setlist) => {
    // Add to songs list if it's an online song not yet in catalog
    if (!songs.some(s => s.id === song.id)) {
      setSongs(prev => [song, ...prev]);
    }
    setSelectedSong(song);
    if (setlist) {
      setActiveSetlist(setlist);
    }
    if (isInRoom && isHost) {
      selectSong(song.id, song.currentKey || song.originalKey, song);
    }
  };

  const handleSaveCustomSong = (newSong: Song) => {
    setSongs(prev => [newSong, ...prev]);
    setSelectedSong(newSong);
  };

  const handleNavigateSetlist = (direction: 'prev' | 'next') => {
    if (!activeSetlist || !selectedSong) return;
    const currentIndex = activeSetlist.items.findIndex(item => item.songId === selectedSong.id);
    if (currentIndex === -1) return;

    let targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0) targetIndex = activeSetlist.items.length - 1;
    if (targetIndex >= activeSetlist.items.length) targetIndex = 0;

    const nextItem = activeSetlist.items[targetIndex];
    const nextSong = songs.find(s => s.id === nextItem.songId);
    if (nextSong) {
      handleSelectSong(nextSong, activeSetlist);
    }
  };

  const handleCreateSetlist = (title: string, description: string, targetEvent: string) => {
    if (!isPro && setlists.length >= 3) {
      handleOpenPricingWithReason('Usuários gratuitos podem criar até 3 repertórios. Faça upgrade para o Plano Pro para repertórios ilimitados na nuvem.');
      return;
    }

    const newSetlist: Setlist = {
      id: 'setlist_' + Date.now(),
      title,
      description,
      date: new Date().toISOString().split('T')[0],
      targetEvent,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setSetlists(prev => [newSetlist, ...prev]);
  };

  const handleDeleteSetlist = (id: string) => {
    setSetlists(prev => prev.filter(sl => sl.id !== id));
    if (activeSetlist?.id === id) {
      setActiveSetlist(null);
    }
  };

  const handleUpdateSetlist = (updatedSetlist: Setlist) => {
    setSetlists(prev => prev.map(sl => sl.id === updatedSetlist.id ? updatedSetlist : sl));
    if (activeSetlist?.id === updatedSetlist.id) {
      setActiveSetlist(updatedSetlist);
    }
  };

  const handleAddToSetlist = (songId: string, setlistId: string) => {
    const song = songs.find(s => s.id === songId);
    if (!song) return;

    setSetlists(prev => prev.map(sl => {
      if (sl.id === setlistId) {
        const exists = sl.items.some(item => item.songId === songId);
        if (exists) return sl;
        return {
          ...sl,
          items: [
            ...sl.items,
            {
              songId,
              customKey: song.originalKey,
              order: sl.items.length + 1
            }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return sl;
    }));
  };

  const handleOpenUploadWithPreset = (preset?: LiturgicalMoment) => {
    setUploadPresetMoment(preset);
    setIsUploadModalOpen(true);
  };

  const handleUpdateSongMoment = (songId: string, newMoment: LiturgicalMoment) => {
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, liturgicalMoment: newMoment } : s));
  };

  const handleBatchUpdateMoments = (songIdsToAdd: string[], songIdsToRemove: string[], moment: LiturgicalMoment) => {
    setSongs(prev => prev.map(s => {
      if (songIdsToAdd.includes(s.id)) {
        return { ...s, liturgicalMoment: moment };
      }
      if (songIdsToRemove.includes(s.id)) {
        return { ...s, liturgicalMoment: 'Hits do Show' };
      }
      return s;
    }));
  };

  // 🔒 OPÇÃO B: Bloqueio Total Obrigatório para qualquer visitante deslogado
  if (!userProfile && !isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <AuthModal
          isOpen={true}
          onClose={() => {}}
          isMandatory={true}
        />
      </div>
    );
  }

  const handleAddSongDirectToSetlist = (song: Song, setlistId: string) => {
    if (!songs.some(s => s.id === song.id)) {
      setSongs(prev => [song, ...prev]);
    }
    handleAddToSetlist(song.id, setlistId);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-zinc-950">
      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenLiveRoomModal={() => setIsLiveRoomModalOpen(true)}
        onOpenUploadModal={() => handleOpenUploadWithPreset()}
        onOpenMetronome={() => setIsMetronomeOpen(true)}
        onOpenTuner={() => setIsTunerOpen(true)}
        onOpenPricing={() => handleOpenPricingWithReason()}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
      />

      {/* Main Body with Sidebar and Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentView={currentView}
          onNavigate={(view) => setCurrentView(view)}
          setlists={setlists}
          onSelectSetlist={(sl) => {
            setActiveSetlist(sl);
            setCurrentView('setlists');
          }}
          onOpenLiveRoomModal={() => setIsLiveRoomModalOpen(true)}
          onOpenUploadModal={() => handleOpenUploadWithPreset()}
          onOpenMetronome={() => setIsMetronomeOpen(true)}
          onOpenTuner={() => setIsTunerOpen(true)}
          onOpenPricing={() => handleOpenPricingWithReason()}
          onOpenProfile={() => setIsProfileOpen(true)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          activeSetlistId={activeSetlist?.id}
        />

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
          {currentView === 'discovery' ? (
            <DiscoveryHub
              songs={songs}
              onSelectSong={(song) => handleSelectSong(song)}
              onOpenLiveRoomModal={() => setIsLiveRoomModalOpen(true)}
              onOpenSearch={() => setIsSearchOpen(true)}
              onOpenUploadModal={handleOpenUploadWithPreset}
              setlists={setlists}
              onAddToSetlist={handleAddToSetlist}
              onUpdateSongMoment={handleUpdateSongMoment}
              onBatchUpdateMoments={handleBatchUpdateMoments}
            />
          ) : (
            <SetlistsManager
              setlists={setlists}
              songs={songs}
              onSelectSong={handleSelectSong}
              onCreateSetlist={handleCreateSetlist}
              onDeleteSetlist={handleDeleteSetlist}
              onUpdateSetlist={handleUpdateSetlist}
              onOpenLiveRoomModal={() => setIsLiveRoomModalOpen(true)}
              activeSetlistId={activeSetlist?.id}
              onSelectSetlistId={(id) => {
                const sl = setlists.find(s => s.id === id);
                if (sl) setActiveSetlist(sl);
              }}
              onOpenPricing={handleOpenPricingWithReason}
            />
          )}
        </div>
      </div>

      {/* Stage Viewer Overlay */}
      {selectedSong && (
        <StageViewer
          song={selectedSong}
          onBack={() => setSelectedSong(null)}
          activeSetlist={activeSetlist}
          onNavigateSetlist={handleNavigateSetlist}
          onOpenLiveRoomModal={() => setIsLiveRoomModalOpen(true)}
          onOpenMetronome={() => setIsMetronomeOpen(true)}
          onOpenPricing={handleOpenPricingWithReason}
          onSaveCustomSong={handleSaveCustomSong}
        />
      )}

      {/* Global Search Modal (Local & Online Spotify style Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        songs={songs}
        onSelectSong={(song) => handleSelectSong(song)}
        onOpenUploadModal={() => handleOpenUploadWithPreset()}
        setlists={setlists}
        onAddToSetlist={handleAddSongDirectToSetlist}
      />

      {/* Custom Song Upload & Creation Modal */}
      <UploadSongModal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setUploadPresetMoment(undefined);
        }}
        onSaveSong={handleSaveCustomSong}
        initialMoment={uploadPresetMoment}
      />

      {/* Live Room Modal (QR Code & Band Sync) */}
      <LiveRoomModal
        isOpen={isLiveRoomModalOpen}
        onClose={() => setIsLiveRoomModalOpen(false)}
        onRequirePro={(reason) => handleOpenPricingWithReason(reason)}
      />

      {/* Metronome Modal */}
      <MetronomeModal
        isOpen={isMetronomeOpen}
        onClose={() => setIsMetronomeOpen(false)}
        initialBpm={selectedSong?.bpm || 80}
      />

      {/* Tuner / Pitch Pipe Modal */}
      <TunerModal
        isOpen={isTunerOpen}
        onClose={() => setIsTunerOpen(false)}
      />

      {/* Pricing & Paywall Modal */}
      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => {
          setIsPricingOpen(false);
          setPricingReason(undefined);
        }}
        onOpenAuth={() => setIsAuthOpen(true)}
        featureReason={pricingReason}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onOpenPricing={() => handleOpenPricingWithReason()}
      />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <LiveRoomProvider>
        <MainAppContent />
      </LiveRoomProvider>
    </AuthProvider>
  );
}

export default App;

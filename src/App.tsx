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
import {
  saveWorkspaceToCloudDebounced,
  loadAndMergeCloudWorkspace,
  subscribeToCloudWorkspace,
  healContaminatedSongsAsync
} from './services/cloudWorkspaceSync';
import { getSemitoneDifference } from './utils/chordEngine';

const MainAppContent: React.FC = () => {
  const { isInRoom, isHost, sessionState, selectSong, changeKey, changeCapo } = useLiveRoom();
  const { isPro, userProfile, isLoading } = useAuth();


  // User-isolated songs and setlists state
  const [songs, setSongs] = useState<Song[]>(() => {
    if (typeof window === 'undefined' || !userProfile?.uid) return INITIAL_SONGS;
    const userCatalogVerKey = `cifrae_catalog_ver_${userProfile.uid}`;
    const savedVer = localStorage.getItem(userCatalogVerKey) || localStorage.getItem(`cifrasync_catalog_ver_${userProfile.uid}`);
    if (savedVer !== CATALOG_VERSION) return INITIAL_SONGS;
    const saved = localStorage.getItem(`cifrae_songs_${userProfile.uid}`) || localStorage.getItem(`cifrasync_songs_${userProfile.uid}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_SONGS;
  });

  const [setlists, setSetlists] = useState<Setlist[]>(() => {
    if (typeof window === 'undefined' || !userProfile?.uid) return INITIAL_SETLISTS;
    const userCatalogVerKey = `cifrae_catalog_ver_${userProfile.uid}`;
    const savedVer = localStorage.getItem(userCatalogVerKey) || localStorage.getItem(`cifrasync_catalog_ver_${userProfile.uid}`);
    if (savedVer !== CATALOG_VERSION) return INITIAL_SETLISTS;
    const saved = localStorage.getItem(`cifrae_setlists_${userProfile.uid}`) || localStorage.getItem(`cifrasync_setlists_${userProfile.uid}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_SETLISTS;
  });

  // Automatically load and sync the workspace in real time across all devices for the logged-in user
  useEffect(() => {
    if (!userProfile?.uid) {
      setSongs(INITIAL_SONGS);
      setSetlists(INITIAL_SETLISTS);
      setSelectedSong(null);
      setActiveSetlist(null);
      return;
    }

    const uid = userProfile.uid;
    const userSongsKey = `cifrae_songs_${uid}`;
    const userSetlistsKey = `cifrae_setlists_${uid}`;
    const userCatalogVerKey = `cifrae_catalog_ver_${uid}`;

    // 1. Instant local cache load so the user sees their data immediately without delay
    const savedVer = localStorage.getItem(userCatalogVerKey) || localStorage.getItem(`cifrasync_catalog_ver_${uid}`);
    const savedSongs = localStorage.getItem(userSongsKey) || localStorage.getItem(`cifrasync_songs_${uid}`);
    const savedSetlists = localStorage.getItem(userSetlistsKey) || localStorage.getItem(`cifrasync_setlists_${uid}`);

    let initialLocalSongs: Song[] = INITIAL_SONGS;
    let initialLocalSetlists: Setlist[] = INITIAL_SETLISTS;

    if (savedSongs) {
      try {
        const parsed = JSON.parse(savedSongs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialLocalSongs = parsed;
          setSongs(parsed);
        }
      } catch (e) {}
    }

    if (savedSetlists) {
      try {
        const parsed = JSON.parse(savedSetlists);
        if (Array.isArray(parsed)) {
          initialLocalSetlists = parsed;
          setSetlists(parsed);
        }
      } catch (e) {}
    }

    // 2. Load and merge with Cloud Firestore across all devices
    let isSubscribed = true;
    loadAndMergeCloudWorkspace(uid, initialLocalSetlists, initialLocalSongs).then(({ setlists: cloudSetlists, songs: cloudSongs }) => {
      if (!isSubscribed) return;
      setSetlists(cloudSetlists);
      setSongs(cloudSongs);
      try {
        localStorage.setItem(userSetlistsKey, JSON.stringify(cloudSetlists));
        localStorage.setItem(userSongsKey, JSON.stringify(cloudSongs));
        localStorage.setItem(userCatalogVerKey, CATALOG_VERSION);
      } catch (e) {}

      // Automatically heal any contaminated online songs in the background with authentic chords
      healContaminatedSongsAsync(uid, cloudSongs, cloudSetlists, (healedSongs) => {
        if (!isSubscribed) return;
        setSongs(healedSongs);
        try {
          localStorage.setItem(userSongsKey, JSON.stringify(healedSongs));
        } catch (e) {}
      });
    });

    // 3. Real-time 2-way listener: when user saves or changes anything on another device (smartphone, tablet, etc.)
    const unsubscribe = subscribeToCloudWorkspace(uid, (cloudData) => {
      if (!isSubscribed) return;

      if (cloudData.setlists) {
        setSetlists(cloudData.setlists);
        try {
          localStorage.setItem(userSetlistsKey, JSON.stringify(cloudData.setlists));
        } catch (e) {}
        setActiveSetlist(prev => {
          if (!prev) return null;
          return cloudData.setlists.find(s => s.id === prev.id) || prev;
        });
      }

      if (cloudData.customSongs || cloudData.songOverrides || cloudData.momentOverrides) {
        const overrides = cloudData.songOverrides || {};
        const momentOverrides = cloudData.momentOverrides || {};
        const customSongs = cloudData.customSongs || [];

        const updatedSongs = INITIAL_SONGS.map(s => {
          let updated: Song = { ...s };
          if (momentOverrides[s.id]) {
            updated.liturgicalMoment = momentOverrides[s.id];
          }
          if (overrides[s.id]) {
            updated = { ...updated, ...overrides[s.id] };
          }
          return updated;
        });

        for (const custom of customSongs) {
          if (!updatedSongs.some(s => s.id === custom.id)) {
            updatedSongs.unshift(custom);
          } else {
            const idx = updatedSongs.findIndex(s => s.id === custom.id);
            updatedSongs[idx] = custom;
          }
        }
        setSongs(updatedSongs);
        try {
          localStorage.setItem(userSongsKey, JSON.stringify(updatedSongs));
        } catch (e) {}
        setSelectedSong(prev => {
          if (!prev) return null;
          return updatedSongs.find(s => s.id === prev.id) || prev;
        });
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
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

  // Save changes isolated per user to both local storage and Cloud Firestore
  useEffect(() => {
    if (userProfile?.uid) {
      try {
        localStorage.setItem(`cifrae_songs_${userProfile.uid}`, JSON.stringify(songs));
        localStorage.setItem(`cifrae_setlists_${userProfile.uid}`, JSON.stringify(setlists));
      } catch (e) {}
      saveWorkspaceToCloudDebounced(userProfile.uid, setlists, songs);
    }
  }, [songs, setlists, userProfile?.uid]);

  // Sync active song with Live Room state if changed remotely by Host or upon joining room (only for members following host)
  useEffect(() => {
    if (!isInRoom || isHost || !sessionState) return;

    const targetSongId = sessionState.currentSongId || sessionState.currentSong?.id;
    if (!targetSongId) return;

    if (sessionState.currentSong) {
      const incomingSong = sessionState.currentSong;
      setSelectedSong(prev => (prev?.id === incomingSong.id && prev?.content === incomingSong.content ? prev : incomingSong));
      setSongs(prev => {
        const existingIdx = prev.findIndex(s => s.id === incomingSong.id);
        if (existingIdx === -1) {
          return [incomingSong, ...prev];
        }
        if (prev[existingIdx].content !== incomingSong.content || prev[existingIdx].title !== incomingSong.title) {
          const updated = [...prev];
          updated[existingIdx] = { ...updated[existingIdx], ...incomingSong };
          return updated;
        }
        return prev;
      });
    } else if (targetSongId) {
      setSelectedSong(prev => {
        if (prev?.id === targetSongId) return prev;
        return songs.find(s => s.id === targetSongId) || prev;
      });
    }
  }, [isInRoom, isHost, sessionState?.currentSongId, sessionState?.currentSong?.id]);

  // Setlist sync if active in room (only for members following host)
  useEffect(() => {
    if (!isInRoom || isHost || !sessionState?.activeSetlistId) return;
    const targetSetlist = setlists.find(sl => sl.id === sessionState.activeSetlistId);
    if (targetSetlist) {
      setActiveSetlist(prev => (prev?.id === targetSetlist.id ? prev : targetSetlist));
    }
  }, [isInRoom, isHost, sessionState?.activeSetlistId, setlists]);

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
  const handleSelectSong = (song: Song, setlist?: Setlist | null) => {
    // Add to songs list if it's an online song not yet in catalog
    if (!songs.some(s => s.id === song.id)) {
      setSongs(prev => [song, ...prev]);
    }
    setSelectedSong(song);
    setActiveSetlist(setlist || null);
    if (isInRoom && isHost) {
      const targetKey = setlist?.items.find(it => it.songId === song.id)?.customKey || song.currentKey || song.originalKey;
      const shift = getSemitoneDifference(song.originalKey, targetKey);
      const effectiveCapo = song.capo !== undefined ? song.capo : 0;
      selectSong(song.id, targetKey, song, shift, effectiveCapo);
    }
  };


  const handleUpdateCustomKey = (songId: string, newKey: string) => {
    if (activeSetlist) {
      const updatedSetlist: Setlist = {
        ...activeSetlist,
        items: activeSetlist.items.map(it => it.songId === songId ? { ...it, customKey: newKey } : it),
        updatedAt: new Date().toISOString()
      };
      setActiveSetlist(updatedSetlist);
      setSetlists(prev => prev.map(sl => sl.id === updatedSetlist.id ? updatedSetlist : sl));
    }
    setSongs(prev => prev.map(s => s.id === songId ? { ...s, currentKey: newKey } : s));
    setSelectedSong(prev => (prev && prev.id === songId ? { ...prev, currentKey: newKey } : prev));
  };

  const handleUpdateSong = (updatedSong: Song) => {
    setSongs(prev => {
      const exists = prev.some(s => s.id === updatedSong.id);
      if (exists) {
        return prev.map(s => s.id === updatedSong.id ? { ...s, ...updatedSong } : s);
      }
      return [updatedSong, ...prev];
    });
    setSelectedSong(prev => (prev && prev.id === updatedSong.id ? { ...prev, ...updatedSong } : prev));
  };

  const handleSaveCustomSong = (newSong: Song) => {
    setSongs(prev => {
      const exists = prev.some(s => s.id === newSong.id);
      if (exists) {
        return prev.map(s => s.id === newSong.id ? { ...s, ...newSong } : s);
      }
      return [newSong, ...prev];
    });
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

  const handleAddToSetlist = (songOrId: string | Song, setlistId: string) => {
    let targetSong: Song | undefined;

    if (typeof songOrId === 'string') {
      targetSong = songs.find(s => s.id === songOrId);
    } else {
      targetSong = songOrId;
      // Make sure the full song is registered in songs array
      setSongs(prev => {
        if (!prev.some(s => s.id === targetSong!.id)) {
          return [targetSong!, ...prev];
        }
        return prev;
      });
    }

    if (!targetSong) return;

    const finalSong = targetSong;
    const songId = finalSong.id;
    const initialKey = finalSong.currentKey || finalSong.originalKey || 'G';

    setSetlists(prev => {
      const updated = prev.map(sl => {
        if (sl.id === setlistId) {
          const exists = sl.items.some(item => item.songId === songId);
          if (exists) return sl;
          return {
            ...sl,
            items: [
              ...sl.items,
              {
                songId,
                customKey: initialKey,
                order: sl.items.length + 1
              }
            ],
            updatedAt: new Date().toISOString()
          };
        }
        return sl;
      });

      // Synchronously write to localStorage
      const storageKey = userProfile?.uid
        ? `cifrae_setlists_${userProfile.uid}`
        : 'cifrae_setlists_guest';
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}

      return updated;
    });

    // Also update activeSetlist if it is the one being modified
    setActiveSetlist(prev => {
      if (prev && prev.id === setlistId) {
        const exists = prev.items.some(item => item.songId === songId);
        if (exists) return prev;
        return {
          ...prev,
          items: [
            ...prev.items,
            {
              songId,
              customKey: initialKey,
              order: prev.items.length + 1
            }
          ],
          updatedAt: new Date().toISOString()
        };
      }
      return prev;
    });
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
    handleAddToSetlist(song, setlistId);
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
              onSelectSong={(song) => handleSelectSong(song, null)}
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
          setlists={setlists}
          onAddToSetlist={handleAddSongDirectToSetlist}
          onNavigateSetlist={handleNavigateSetlist}
          onOpenLiveRoomModal={() => setIsLiveRoomModalOpen(true)}
          onOpenMetronome={() => setIsMetronomeOpen(true)}
          onOpenPricing={handleOpenPricingWithReason}
          onSaveCustomSong={handleSaveCustomSong}
          onUpdateCustomKey={handleUpdateCustomKey}
          onUpdateSong={handleUpdateSong}
        />
      )}


      {/* Global Search Modal (Local & Online Spotify style Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        songs={songs}
        onSelectSong={(song) => handleSelectSong(song, null)}
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

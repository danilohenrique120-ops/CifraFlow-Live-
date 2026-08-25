import React, { useState, useEffect } from 'react';
import { Song, Setlist } from './types';
import { INITIAL_SONGS, INITIAL_SETLISTS } from './data/songsData';
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

const MainAppContent: React.FC = () => {
  // Persistence state
  const [songs, setSongs] = useState<Song[]>(() => {
    if (typeof window === 'undefined') return INITIAL_SONGS;
    const saved = localStorage.getItem('cifraflow_songs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_SONGS;
  });

  const [setlists, setSetlists] = useState<Setlist[]>(() => {
    if (typeof window === 'undefined') return INITIAL_SETLISTS;
    const saved = localStorage.getItem('cifraflow_setlists');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return INITIAL_SETLISTS;
  });

  // Navigation and active views
  const [currentView, setCurrentView] = useState<'discovery' | 'setlists'>('discovery');
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [activeSetlist, setActiveSetlist] = useState<Setlist | null>(null);

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isLiveRoomModalOpen, setIsLiveRoomModalOpen] = useState<boolean>(false);
  const [isMetronomeOpen, setIsMetronomeOpen] = useState<boolean>(false);
  const [isTunerOpen, setIsTunerOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isPricingOpen, setIsPricingOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [pricingReason, setPricingReason] = useState<string | undefined>(undefined);

  const { isInRoom, isHost, sessionState, selectSong } = useLiveRoom();
  const { isPro } = useAuth();

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('cifraflow_songs', JSON.stringify(songs));
  }, [songs]);

  useEffect(() => {
    localStorage.setItem('cifraflow_setlists', JSON.stringify(setlists));
  }, [setlists]);

  // Sync active song with Live Room state if changed remotely by Host
  useEffect(() => {
    if (sessionState?.currentSongId) {
      const targetSong = songs.find(s => s.id === sessionState.currentSongId);
      if (targetSong) {
        setSelectedSong(targetSong);
      }
    }
  }, [sessionState?.currentSongId, songs]);

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
    setSelectedSong(song);
    if (setlist) {
      setActiveSetlist(setlist);
    }
    if (isInRoom && isHost) {
      selectSong(song.id, song.currentKey || song.originalKey);
    }
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
    if (!isPro && setlists.length >= 2) {
      handleOpenPricingWithReason('Usuários gratuitos podem criar até 2 repertórios. Faça upgrade para o Plano Pro para repertórios ilimitados na nuvem.');
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased selection:bg-emerald-500 selection:text-zinc-950">
      {/* Top Navbar */}
      <Navbar
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenLiveRoomModal={() => setIsLiveRoomModalOpen(true)}
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
          onOpenMetronome={() => setIsMetronomeOpen(true)}
          onOpenTuner={() => setIsTunerOpen(true)}
          onOpenPricing={() => handleOpenPricingWithReason()}
          onOpenProfile={() => setIsProfileOpen(true)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
          {currentView === 'discovery' ? (
            <DiscoveryHub
              songs={songs}
              onSelectSong={(song) => handleSelectSong(song)}
              onOpenLiveRoomModal={() => setIsLiveRoomModalOpen(true)}
              onOpenSearch={() => setIsSearchOpen(true)}
              setlists={setlists}
              onAddToSetlist={handleAddToSetlist}
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
        />
      )}

      {/* Global Search Modal (Spotify style Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        songs={songs}
        onSelectSong={(song) => handleSelectSong(song)}
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

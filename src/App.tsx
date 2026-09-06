import React, { useState, useEffect } from 'react';
import { Song, Setlist, LiturgicalMoment, GenreFolder } from './types';
import { INITIAL_SONGS, INITIAL_SETLISTS, INITIAL_GENRE_FOLDERS, CATALOG_VERSION, PRESET_SONG_IDS } from './data/songsData';
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
import { ShareSetlistModal } from './components/ShareSetlistModal';
import { ImportSetlistModal } from './components/ImportSetlistModal';
import {
  saveWorkspaceToCloudDebounced,
  loadAndMergeCloudWorkspace,
  subscribeToCloudWorkspace,
  healContaminatedSongsAsync
} from './services/cloudWorkspaceSync';
import { getSemitoneDifference } from './utils/chordEngine';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LandingPage } from './components/LandingPage';
import { localDB } from './services/storageService';

const MainAppContent: React.FC = () => {
  const { isInRoom, isHost, currentMember, sessionState, selectSong, changeKey, changeCapo, isNetworkOnline } = useLiveRoom();
  const { isPro, userProfile, isLoading, loginAsOfflineGuest } = useAuth();


  // Helper to extract custom/online songs from raw list
  const extractNonStandardSongs = (list: Song[]): Song[] => {
    return list.filter(s =>
      Boolean(
        (s.isCustom ||
         s.id.startsWith('custom_') ||
         s.id.startsWith('online_') ||
         s.parentSongId ||
         s.versionName) &&
        !PRESET_SONG_IDS.has(s.id)
      )
    );
  };

  // User-isolated songs and setlists state
  // User-isolated songs and setlists state (com suporte a restauração imediata do UID salvo offline)
  const [songs, setSongs] = useState<Song[]>(() => {
    if (typeof window === 'undefined') return INITIAL_SONGS;
    let uid = userProfile?.uid;
    if (!uid) {
      const savedProf = localStorage.getItem('cifraflow_user_profile');
      if (savedProf) {
        try { uid = JSON.parse(savedProf).uid; } catch (e) {}
      }
    }
    if (!uid) return INITIAL_SONGS;
    const userSongsKey = `cifrae_songs_${uid}`;
    const userCatalogVerKey = `cifrae_catalog_ver_${uid}`;
    const savedVer = localStorage.getItem(userCatalogVerKey);
    const saved = localStorage.getItem(userSongsKey);

    if (saved && savedVer === CATALOG_VERSION) {
      try {
        const parsed: Song[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(s => !PRESET_SONG_IDS.has(s.id));
        }
      } catch (e) {}
    }
    return INITIAL_SONGS;
  });

  const [setlists, setSetlists] = useState<Setlist[]>(() => {
    if (typeof window === 'undefined') return INITIAL_SETLISTS;
    let uid = userProfile?.uid;
    if (!uid) {
      const savedProf = localStorage.getItem('cifraflow_user_profile');
      if (savedProf) {
        try { uid = JSON.parse(savedProf).uid; } catch (e) {}
      }
    }
    if (!uid) return INITIAL_SETLISTS;
    const userSetlistsKey = `cifrae_setlists_${uid}`;
    const fallbackSetlistsKey = `cifrasync_setlists_${uid}`;
    const saved = localStorage.getItem(userSetlistsKey) || localStorage.getItem(fallbackSetlistsKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_SETLISTS;
  });

  const [genreFolders, setGenreFolders] = useState<GenreFolder[]>(() => {
    if (typeof window === 'undefined') return INITIAL_GENRE_FOLDERS;
    let uid = userProfile?.uid;
    if (!uid) {
      const savedProf = localStorage.getItem('cifraflow_user_profile');
      if (savedProf) {
        try { uid = JSON.parse(savedProf).uid; } catch (e) {}
      }
    }
    if (!uid) return INITIAL_GENRE_FOLDERS;
    const userFoldersKey = `cifrae_folders_${uid}`;
    const saved = localStorage.getItem(userFoldersKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return INITIAL_GENRE_FOLDERS;
  });

  // Automatically load and sync the workspace in real time across all devices for the logged-in user
  useEffect(() => {
    let uid = userProfile?.uid;
    if (!uid && typeof window !== 'undefined') {
      const savedProf = localStorage.getItem('cifraflow_user_profile');
      if (savedProf) {
        try { uid = JSON.parse(savedProf).uid; } catch (e) {}
      }
    }

    if (!uid) {
      if (!isNetworkOnline) {
        localDB.getAllSongs().then((s) => { if (s && s.length > 0) setSongs(s); });
        localDB.getAllSetlists().then((l) => { if (l && l.length > 0) setSetlists(l); });
        localDB.getAllFolders().then((f) => { if (f && f.length > 0) setGenreFolders(f); });
        return;
      }
      setSongs(INITIAL_SONGS);
      setSetlists(INITIAL_SETLISTS);
      setGenreFolders(INITIAL_GENRE_FOLDERS);
      setSelectedSong(null);
      setActiveSetlist(null);
      return;
    }

    const userSongsKey = `cifrae_songs_${uid}`;
    const userSetlistsKey = `cifrae_setlists_${uid}`;
    const userFoldersKey = `cifrae_folders_${uid}`;
    const userCatalogVerKey = `cifrae_catalog_ver_${uid}`;

    // 1. Instant local cache load so the user sees their data immediately without delay
    const savedVer = localStorage.getItem(userCatalogVerKey) || localStorage.getItem(`cifrasync_catalog_ver_${uid}`);
    const savedSongs = localStorage.getItem(userSongsKey) || localStorage.getItem(`cifrasync_songs_${uid}`);
    const savedSetlists = localStorage.getItem(userSetlistsKey) || localStorage.getItem(`cifrasync_setlists_${uid}`);
    const savedFolders = localStorage.getItem(userFoldersKey);

    let initialLocalSongs: Song[] = INITIAL_SONGS;
    let initialLocalSetlists: Setlist[] = INITIAL_SETLISTS;
    let initialLocalFolders: GenreFolder[] = INITIAL_GENRE_FOLDERS;

    if (savedSongs) {
      try {
        const parsed = JSON.parse(savedSongs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter(s => !PRESET_SONG_IDS.has(s.id));
          initialLocalSongs = cleaned;
          setSongs(cleaned);
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

    if (savedFolders) {
      try {
        const parsed = JSON.parse(savedFolders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialLocalFolders = parsed;
          setGenreFolders(parsed);
        }
      } catch (e) {}
    }

    // 2. Load and merge with Cloud Firestore across all devices
    let isSubscribed = true;
    loadAndMergeCloudWorkspace(uid, initialLocalSetlists, initialLocalSongs, initialLocalFolders).then(({ setlists: cloudSetlists, songs: cloudSongs, genreFolders: cloudFolders }) => {
      if (!isSubscribed) return;
      setSetlists(cloudSetlists);
      const cleanCloudSongs = cloudSongs.filter(s => !PRESET_SONG_IDS.has(s.id));
      setSongs(cleanCloudSongs);
      if (cloudFolders && cloudFolders.length > 0) {
        setGenreFolders(cloudFolders);
      }
      try {
        localStorage.setItem(userSetlistsKey, JSON.stringify(cloudSetlists));
        localStorage.setItem(userSongsKey, JSON.stringify(cleanCloudSongs));
        localStorage.setItem(userFoldersKey, JSON.stringify(cloudFolders || initialLocalFolders));
        localStorage.setItem(userCatalogVerKey, CATALOG_VERSION);
      } catch (e) {}

      // Automatically heal any contaminated online songs in the background with authentic chords
      healContaminatedSongsAsync(uid, cleanCloudSongs, cloudSetlists, (healedSongs) => {
        if (!isSubscribed) return;
        const cleanHealed = healedSongs.filter(s => !PRESET_SONG_IDS.has(s.id));
        setSongs(cleanHealed);
        try {
          localStorage.setItem(userSongsKey, JSON.stringify(cleanHealed));
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

      if (cloudData.genreFolders && cloudData.genreFolders.length > 0) {
        setGenreFolders(cloudData.genreFolders);
        try {
          localStorage.setItem(userFoldersKey, JSON.stringify(cloudData.genreFolders));
        } catch (e) {}
      }

      if (cloudData.customSongs) {
        const customSongs = (cloudData.customSongs || []).filter(s => !PRESET_SONG_IDS.has(s.id));

        const updatedSongs: Song[] = [];
        for (const custom of customSongs) {
          if (!updatedSongs.some(s => s.id === custom.id)) {
            updatedSongs.push(custom);
          }
        }

        setSongs(prev => {
          const prevSig = prev.map(s => `${s.id}_${s.currentKey || s.originalKey}_${s.capo || 0}_${s.liturgicalMoment}`).join('|');
          const nextSig = updatedSongs.map(s => `${s.id}_${s.currentKey || s.originalKey}_${s.capo || 0}_${s.liturgicalMoment}`).join('|');
          if (prevSig === nextSig) {
            return prev;
          }
          try {
            localStorage.setItem(userSongsKey, JSON.stringify(updatedSongs));
          } catch (e) {}
          return updatedSongs;
        });

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

  // Landing Page view state: Shows for new visitors who are not logged in and haven't entered the app in this session, or when requested via URL (?landing=true)
  const [isShowingLanding, setIsShowingLanding] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('landing') === 'true') return true;
    // Se já está logado, nunca força landing page
    const savedProfile = localStorage.getItem('cifraflow_user_profile');
    if (savedProfile) return false;
    // Se já clicou em entrar no app nesta sessão de navegação, respeita a escolha
    const hasSkipped = sessionStorage.getItem('cifrae_entered_app');
    if (hasSkipped === 'true') return false;
    // Novo visitante que não está logado
    return true;
  });

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchInitialTab, setSearchInitialTab] = useState<'local' | 'online'>('local');
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
  const [isShareSetlistModalOpen, setIsShareSetlistModalOpen] = useState<boolean>(false);
  const [sharingSetlist, setSharingSetlist] = useState<Setlist | null>(null);
  const [isImportSetlistModalOpen, setIsImportSetlistModalOpen] = useState<boolean>(false);
  const [importSetlistCode, setImportSetlistCode] = useState<string>('');

  // Check for shared setlist URL parameter (e.g. ?repertorio=REP-842 ou ?setlist=REP-842)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const repCode = params.get('repertorio') || params.get('setlist');
      if (repCode) {
        setImportSetlistCode(repCode);
        setIsImportSetlistModalOpen(true);
        // Clean URL parameter without reload
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('repertorio');
        newUrl.searchParams.delete('setlist');
        window.history.replaceState({}, document.title, newUrl.toString());
      }
    }
  }, []);

  const handleImportSetlistSuccess = (importedSetlist: Setlist, newSongs: Song[]) => {
    if (newSongs.length > 0) {
      setSongs(prev => {
        const map = new Map<string, Song>();
        prev.forEach(s => map.set(s.id, s));
        newSongs.forEach(s => map.set(s.id, s));
        return Array.from(map.values());
      });
      localDB.saveSongs(newSongs);
    }

    setSetlists(prev => {
      const updated = [importedSetlist, ...prev.filter(s => s.id !== importedSetlist.id)];
      localDB.saveSetlists(updated);
      return updated;
    });

    setActiveSetlist(importedSetlist);
    setCurrentView('setlists');
  };

  // Save changes isolated per user to IndexedDB Local-First, local storage and Cloud Firestore
  useEffect(() => {
    if (songs.length > 0) {
      localDB.saveSongs(songs);
    }
    if (setlists.length > 0) {
      localDB.saveSetlists(setlists);
    }
    if (genreFolders.length > 0) {
      localDB.saveFolders(genreFolders);
    }

    if (userProfile?.uid) {
      try {
        localStorage.setItem(`cifrae_songs_${userProfile.uid}`, JSON.stringify(songs));
        localStorage.setItem(`cifrae_setlists_${userProfile.uid}`, JSON.stringify(setlists));
        localStorage.setItem(`cifrae_folders_${userProfile.uid}`, JSON.stringify(genreFolders));
      } catch (e) {}
      saveWorkspaceToCloudDebounced(userProfile.uid, setlists, songs, genreFolders);
    }
  }, [songs, setlists, genreFolders, userProfile?.uid]);

  // Sync active song with Live Room state if changed remotely by Host or upon joining room (only for members following host)
  useEffect(() => {
    if (!isInRoom || isHost || !sessionState) return;

    const targetSongId = sessionState.currentSongId || sessionState.currentSong?.id;
    if (!targetSongId) return;

    // 1. If incoming song object matches targetSongId, use it directly for stage view!
    if (sessionState.currentSong && sessionState.currentSong.id === targetSongId) {
      const incomingSong = sessionState.currentSong;
      setSelectedSong(prev => (prev?.id === incomingSong.id && prev?.content === incomingSong.content ? prev : incomingSong));
      // NOTE: Do NOT add incomingSong to the member's personal song catalog (songs array).
      // The member follows the leader in real-time on stage without polluting their personal catalog.
      return;
    }

    // 2. If targetSongId is different from currently selected song, look in songs and catalog
    if (targetSongId !== selectedSong?.id) {
      const found = songs.find(s => s.id === targetSongId) || INITIAL_SONGS.find(s => s.id === targetSongId);
      if (found) {
        setSelectedSong(found);
      }
    }
  }, [
    isInRoom,
    isHost,
    sessionState?.currentSongId,
    sessionState?.currentSong?.id,
    sessionState?.currentSong?.title,
    sessionState?.currentSong?.content,
    selectedSong?.id,
    songs
  ]);

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

  const handleOpenSearch = (tab?: 'local' | 'online') => {
    setSearchInitialTab(tab || (songs.length === 0 ? 'online' : 'local'));
    setIsSearchOpen(true);
  };

  // Handlers
  const handleSelectSong = (song: Song, setlist?: Setlist | null) => {
    if (!song) return;
    // Add to songs list if it's an online song not yet in catalog
    if (!songs.some(s => s && s.id === song.id)) {
      if (!isPro && songs.length >= 10) {
        handleOpenPricingWithReason('O plano Free permite até 10 músicas no catálogo. Faça upgrade para o Plano Pro para ter músicas ilimitadas!');
        return;
      }
      setSongs(prev => {
        if (!prev.some(s => s && s.id === song.id)) {
          const updated = [song, ...prev];
          if (userProfile?.uid) {
            try {
              localStorage.setItem(`cifrae_songs_${userProfile.uid}`, JSON.stringify(updated));
            } catch (e) {}
          }
          return updated;
        }
        return prev;
      });
    }
    setSelectedSong(song);
    setActiveSetlist(setlist || null);
    if (isInRoom && (isHost || sessionState?.hostId === currentMember?.id || currentMember?.role === 'leader' || currentMember?.isHost)) {
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
      return prev;
    });
    setSelectedSong(prev => (prev && prev.id === updatedSong.id ? { ...prev, ...updatedSong } : prev));
  };

  const handleSaveCustomSong = (newSong: Song) => {
    const isNew = !songs.some(s => s.id === newSong.id);
    if (isNew && !isPro && songs.length >= 10) {
      handleOpenPricingWithReason('O plano Free permite até 10 músicas no catálogo. Faça upgrade para o Plano Pro para ter músicas ilimitadas!');
      return;
    }
    setSongs(prev => {
      const exists = prev.some(s => s.id === newSong.id);
      if (exists) {
        return prev.map(s => s.id === newSong.id ? { ...s, ...newSong } : s);
      }
      return [newSong, ...prev];
    });
    setSelectedSong(newSong);
  };

  const handleSaveGenreFolder = (folder: GenreFolder) => {
    setGenreFolders(prev => {
      const idx = prev.findIndex(f => f.id === folder.id);
      let updated: GenreFolder[];
      if (idx !== -1) {
        const oldName = prev[idx].name;
        updated = [...prev];
        updated[idx] = folder;
        if (oldName !== folder.name) {
          setSongs(prevSongs => prevSongs.map(s => s.liturgicalMoment === oldName ? { ...s, liturgicalMoment: folder.name } : s));
        }
      } else {
        if (!isPro && prev.length >= 3) {
          handleOpenPricingWithReason('O plano Free permite até 3 pastas de estilos. Faça upgrade para o Plano Pro para criar pastas ilimitadas!');
          return prev;
        }
        updated = [...prev, folder];
      }
      if (userProfile?.uid) {
        try {
          localStorage.setItem(`cifrae_folders_${userProfile.uid}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
  };

  const handleDeleteGenreFolder = (folderId: string) => {
    setGenreFolders(prev => {
      const updated = prev.filter(f => f.id !== folderId);
      if (userProfile?.uid) {
        try {
          localStorage.setItem(`cifrae_folders_${userProfile.uid}`, JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
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
      const isNew = !songs.some(s => s.id === targetSong!.id);
      if (isNew && !isPro && songs.length >= 10) {
        handleOpenPricingWithReason('O plano Free permite até 10 músicas no catálogo. Faça upgrade para o Plano Pro para ter músicas ilimitadas!');
        return;
      }
      // Make sure the full song is registered in songs array and localStorage
      setSongs(prev => {
        if (!prev.some(s => s.id === targetSong!.id)) {
          const updated = [targetSong!, ...prev];
          if (userProfile?.uid) {
            try {
              localStorage.setItem(`cifrae_songs_${userProfile.uid}`, JSON.stringify(updated));
            } catch (e) {}
          }
          return updated;
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

  // Handler para quando o visitante clica em "Testar Grátis no Navegador" ou fecha a landing
  const handleEnterApp = () => {
    sessionStorage.setItem('cifrae_entered_app', 'true');
    setIsShowingLanding(false);
  };

  // 🌟 Landing Page Magnética de Alta Conversão
  // Apresentada para novos visitantes não logados que ainda não entraram no app nesta sessão
  // ou para qualquer usuário que solicitar explicitamente (via link da Sidebar ou ?landing=true)
  if (isShowingLanding) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col antialiased">
        <LandingPage
          onEnterApp={handleEnterApp}
          onOpenPricing={(reason) => handleOpenPricingWithReason(reason)}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Pricing Modal aberto direto da Landing Page com checkout Stripe */}
        <PricingModal
          isOpen={isPricingOpen}
          onClose={() => {
            setIsPricingOpen(false);
            setPricingReason(undefined);
          }}
          onOpenAuth={() => setIsAuthOpen(true)}
          featureReason={pricingReason}
        />

        {/* Auth Modal aberto direto da Landing Page */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => {
            setIsAuthOpen(false);
            // Se logou com sucesso, sai da landing page
            if (userProfile) {
              setIsShowingLanding(false);
            }
          }}
        />
      </div>
    );
  }

  // 🔒 OPÇÃO B: Bloqueio Total Obrigatório para visitante online sem login
  if (!userProfile && !isLoading) {
    if (!isNetworkOnline) {
      // Offline no palco: nunca travar o músico com tela de login! Libera acesso direto às músicas salvas
      loginAsOfflineGuest();
      return null;
    }
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
        onOpenSearch={() => handleOpenSearch(songs.length === 0 ? 'online' : 'local')}
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
          onOpenLandingPage={() => setIsShowingLanding(true)}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          activeSetlistId={activeSetlist?.id}
        />

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
          <ErrorBoundary>
            {currentView === 'discovery' ? (
              <DiscoveryHub
                songs={songs}
                genreFolders={genreFolders}
                isPro={isPro}
                onSelectSong={(song) => handleSelectSong(song, null)}
                onOpenLiveRoomModal={() => setIsLiveRoomModalOpen(true)}
                onOpenSearch={handleOpenSearch}
                onOpenUploadModal={handleOpenUploadWithPreset}
                onOpenPricing={handleOpenPricingWithReason}
                setlists={setlists}
                onAddToSetlist={handleAddToSetlist}
                onUpdateSongMoment={handleUpdateSongMoment}
                onBatchUpdateMoments={handleBatchUpdateMoments}
                onSaveGenreFolder={handleSaveGenreFolder}
                onDeleteGenreFolder={handleDeleteGenreFolder}
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
                onOpenShareModal={(s) => {
                  setSharingSetlist(s);
                  setIsShareSetlistModalOpen(true);
                }}
                onOpenImportModal={() => {
                  setImportSetlistCode('');
                  setIsImportSetlistModalOpen(true);
                }}
              />
            )}
          </ErrorBoundary>
        </div>
      </div>

      {/* Stage Viewer Overlay */}
      {selectedSong && (
        <StageViewer
          key={selectedSong.id}
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
        initialTab={searchInitialTab}
        isPro={isPro}
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
        currentSong={selectedSong}
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

      {/* Share Setlist Modal (Exclusivo Pro) */}
      <ShareSetlistModal
        isOpen={isShareSetlistModalOpen}
        onClose={() => {
          setIsShareSetlistModalOpen(false);
          setSharingSetlist(null);
        }}
        setlist={sharingSetlist}
        songs={songs}
      />

      {/* Import Setlist Modal */}
      <ImportSetlistModal
        isOpen={isImportSetlistModalOpen}
        onClose={() => {
          setIsImportSetlistModalOpen(false);
          setImportSetlistCode('');
        }}
        initialCode={importSetlistCode}
        existingSongs={songs}
        onImportComplete={handleImportSetlistSuccess}
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

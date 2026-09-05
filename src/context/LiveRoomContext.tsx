import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { BandAlert, LiveMember, LiveSessionState, Song, UserRole } from '../types';
import { generateRoomPin, LiveSyncEngine, SyncMessage } from '../services/liveSync';
import { useAuth } from './AuthContext';

interface LiveRoomContextType {
  isInRoom: boolean;
  isHost: boolean;
  currentMember: LiveMember | null;
  sessionState: LiveSessionState | null;
  engine: LiveSyncEngine | null;
  createRoom: (roomName?: string, memberName?: string, instrument?: string, initialSong?: Song | null) => Promise<string>;
  joinRoom: (pin: string, memberName?: string, instrument?: string) => Promise<boolean>;
  leaveRoom: () => void;
  selectSong: (songId: string, songKey?: string, songData?: Song, semitoneShift?: number, capo?: number) => void;
  changeKey: (key: string, semitones: number) => void;
  changeCapo: (capo: number) => void;
  toggleFollowScroll: (enabled?: boolean) => void;
  broadcastScroll: (percentage: number) => void;
  sendBandAlert: (message: string, type?: BandAlert['type']) => void;
  dismissAlert: () => void;
  setActiveSetlist: (setlistId: string | null) => void;
  updateMemberName: (name: string, instrument: string) => void;
  recentAlert: BandAlert | null;
}


const LiveRoomContext = createContext<LiveRoomContextType | undefined>(undefined);

const AVATAR_COLORS = [
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500'
];

export const LiveRoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userProfile } = useAuth();

  const [currentMember, setCurrentMember] = useState<LiveMember | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('cifraflow_member');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: userProfile?.uid || 'usr_' + Math.random().toString(36).substring(2, 9),
      name: userProfile?.displayName || 'Músico ' + Math.floor(100 + Math.random() * 900),
      role: 'member',
      instrument: userProfile?.instrument || 'Violão',
      joinedAt: Date.now(),
      isHost: false,
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    };
  });

  const [sessionState, setSessionState] = useState<LiveSessionState | null>(null);
  const [engine, setEngine] = useState<LiveSyncEngine | null>(null);
  const [recentAlert, setRecentAlert] = useState<BandAlert | null>(null);
  const engineRef = useRef<LiveSyncEngine | null>(null);

  // Keep member details in sync with AuthProfile
  useEffect(() => {
    if (userProfile) {
      setCurrentMember(prev => {
        const id = userProfile.uid || prev?.id || 'usr_' + Math.random().toString(36).substring(2, 9);
        return {
          id,
          name: userProfile.displayName || prev?.name || 'Músico',
          role: prev?.role || 'member',
          instrument: userProfile.instrument || prev?.instrument || 'Violão',
          joinedAt: prev?.joinedAt || Date.now(),
          isHost: prev?.isHost || false,
          avatarColor: prev?.avatarColor || AVATAR_COLORS[0]
        };
      });
    }
  }, [userProfile]);

  // Auto-dismiss alerts after 5 seconds
  useEffect(() => {
    if (recentAlert) {
      const timer = setTimeout(() => {
        setRecentAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [recentAlert]);

  // Persist member profile
  useEffect(() => {
    if (currentMember) {
      localStorage.setItem('cifraflow_member', JSON.stringify(currentMember));
    }
  }, [currentMember]);

  // Check URL parameters on initial load (e.g. ?room=MTS-742)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam && !sessionState) {
        joinRoom(roomParam);
      }
    }
  }, []);

  const handleIncomingMessage = useCallback((msg: SyncMessage) => {
    if (msg.type === 'BAND_ALERT') {
      setRecentAlert(msg.payload);
      setSessionState(prev => prev ? { ...prev, currentAlert: msg.payload } : null);
      return;
    }

    if (msg.type === 'DISMISS_ALERT') {
      setRecentAlert(null);
      setSessionState(prev => prev ? { ...prev, currentAlert: null } : null);
      return;
    }

    if (msg.type === 'CAPO_CHANGE') {
      setSessionState(prev => prev ? { ...prev, currentCapo: msg.payload.capo, lastUpdated: Date.now() } : null);
      return;
    }

    if (msg.type === 'SONG_CHANGE') {
      setSessionState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentSongId: msg.payload.songId,
          currentSong: msg.payload.song !== undefined ? msg.payload.song : (prev.currentSongId === msg.payload.songId ? prev.currentSong : null),
          currentKey: msg.payload.key || prev.currentKey,
          semitoneShift: msg.payload.semitones ?? 0,
          currentCapo: msg.payload.capo ?? (msg.payload.song?.capo || 0),
          scrollPercentage: 0,
          lastUpdated: Date.now()
        };
      });
      return;
    }

    if (msg.type === 'KEY_CHANGE') {
      setSessionState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentKey: msg.payload.key,
          semitoneShift: msg.payload.semitones,
          lastUpdated: Date.now()
        };
      });
      return;
    }

    if (msg.type === 'SCROLL_SYNC') {
      setSessionState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          scrollPercentage: msg.payload.scrollPercentage,
          lastUpdated: Date.now()
        };
      });
      return;
    }

    if (msg.type === 'MEMBER_JOIN') {
      setSessionState(prev => {
        if (!prev) return null;
        const exists = prev.members.some(m => m.id === msg.payload.id);
        const newMembers = exists
          ? prev.members.map(m => m.id === msg.payload.id ? msg.payload : m)
          : [...prev.members, msg.payload];
        return { ...prev, members: newMembers, lastUpdated: Date.now() };
      });
      return;
    }

    if (msg.type === 'MEMBER_LEAVE') {
      setSessionState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          members: prev.members.filter(m => m.id !== msg.payload.id),
          lastUpdated: Date.now()
        };
      });
      return;
    }

    if (msg.type === 'STATE_UPDATE') {
      setSessionState(prev => ({
        ...(prev || {}),
        ...msg.payload,
        lastUpdated: Date.now()
      }));
    }
  }, []);

  const createRoom = useCallback(async (roomName = 'Ensaio Geral', memberName?: string, instrument?: string, initialSong?: Song | null): Promise<string> => {
    if (engineRef.current) {
      engineRef.current.destroy();
    }

    const pin = generateRoomPin('MTS');
    const hostId = userProfile?.uid || currentMember?.id || 'usr_' + Math.random().toString(36).substring(2, 9);
    const member: LiveMember = {
      id: hostId,
      name: memberName || userProfile?.displayName || currentMember?.name || 'Líder da Banda',
      role: 'leader',
      instrument: instrument || userProfile?.instrument || currentMember?.instrument || 'Violão',
      joinedAt: Date.now(),
      isHost: true,
      avatarColor: currentMember?.avatarColor || 'bg-emerald-500'
    };

    setCurrentMember(member);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cifraflow_member', JSON.stringify(member));
      } catch (e) {}
    }

    const startSong = initialSong || null;
    const initialState: LiveSessionState = {
      roomId: pin,
      pin,
      roomName,
      hostId: hostId,
      currentSongId: startSong?.id || '',
      currentSong: startSong,
      currentKey: startSong?.currentKey || startSong?.originalKey || 'C',
      semitoneShift: 0,
      currentCapo: startSong?.capo || 0,
      activeSetlistId: null,
      followScroll: true,
      scrollPercentage: 0,
      currentAlert: null,
      members: [member],
      lastUpdated: Date.now()
    };

    const newEngine = new LiveSyncEngine(pin);
    await newEngine.saveState(initialState);
    newEngine.subscribe(handleIncomingMessage);

    engineRef.current = newEngine;
    setEngine(newEngine);
    setSessionState(initialState);

    // Update URL query param
    if (typeof window !== 'undefined' && window.history.pushState) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('room', pin);
      window.history.pushState({}, '', newUrl);
    }

    return pin;
  }, [currentMember, userProfile, handleIncomingMessage]);

  const joinRoom = useCallback(async (pin: string, memberName?: string, instrument?: string): Promise<boolean> => {
    const cleanPin = pin.trim().toUpperCase();
    if (!cleanPin) return false;

    if (engineRef.current) {
      engineRef.current.destroy();
    }

    const newEngine = new LiveSyncEngine(cleanPin);
    const cloudState = await newEngine.fetchCloudRoomState();

    const memberId = userProfile?.uid || currentMember?.id || 'usr_' + Math.random().toString(36).substring(2, 9);
    const isUserTheHost = Boolean(
      cloudState && (
        cloudState.hostId === memberId ||
        (userProfile?.uid && cloudState.hostId === userProfile.uid) ||
        currentMember?.isHost === true
      )
    );
    const member: LiveMember = {
      id: memberId,
      name: memberName || userProfile?.displayName || currentMember?.name || (isUserTheHost ? 'Líder da Banda' : 'Músico Conectado'),
      role: isUserTheHost ? 'leader' : 'member',
      instrument: instrument || userProfile?.instrument || currentMember?.instrument || 'Violão',
      joinedAt: Date.now(),
      isHost: isUserTheHost,
      avatarColor: currentMember?.avatarColor || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
    };

    setCurrentMember(member);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cifraflow_member', JSON.stringify(member));
      } catch (e) {}
    }

    const mergedState: LiveSessionState = {
      roomId: cleanPin,
      pin: cleanPin,
      roomName: cloudState?.roomName || `Sala ${cleanPin}`,
      hostId: cloudState?.hostId || 'host_leader',
      currentSongId: cloudState?.currentSongId || '',
      currentSong: cloudState?.currentSong || null,
      currentKey: cloudState?.currentKey || 'C',
      semitoneShift: cloudState?.semitoneShift || 0,
      currentCapo: cloudState?.currentCapo ?? (cloudState?.currentSong?.capo || 0),
      activeSetlistId: cloudState?.activeSetlistId || null,
      followScroll: cloudState?.followScroll ?? true,
      scrollPercentage: cloudState?.scrollPercentage || 0,
      currentAlert: null,
      members: cloudState?.members ? [...cloudState.members.filter(m => m.id !== member.id), member] : [member],
      lastUpdated: Date.now()
    };

    newEngine.subscribe(handleIncomingMessage);
    await newEngine.broadcast({
      type: 'MEMBER_JOIN',
      senderId: member.id,
      senderName: member.name,
      payload: member
    });

    engineRef.current = newEngine;
    setEngine(newEngine);
    setSessionState(mergedState);

    if (typeof window !== 'undefined' && window.history.pushState) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('room', cleanPin);
      window.history.pushState({}, '', newUrl);
    }

    return true;
  }, [currentMember, userProfile, handleIncomingMessage]);

  const leaveRoom = useCallback(async () => {
    if (engineRef.current && sessionState && currentMember) {
      await engineRef.current.broadcast({
        type: 'MEMBER_LEAVE',
        senderId: currentMember.id,
        senderName: currentMember.name,
        payload: { id: currentMember.id }
      });
      engineRef.current.destroy();
    }
    engineRef.current = null;
    setEngine(null);
    setSessionState(null);

    if (typeof window !== 'undefined' && window.history.pushState) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('room');
      window.history.pushState({}, '', newUrl);
    }
  }, [sessionState, currentMember]);

  const selectSong = useCallback((songId: string, songKey = 'C', songData?: Song, semitoneShift = 0, capo?: number) => {
    const effectiveCapo = capo !== undefined ? capo : (songData?.capo ?? 0);
    setSessionState(prev => {
      if (!prev) return null;
      const updated: LiveSessionState = {
        ...prev,
        currentSongId: songId,
        currentSong: songData !== undefined ? songData : (prev.currentSongId === songId ? prev.currentSong : null),
        currentKey: songKey,
        semitoneShift: semitoneShift,
        currentCapo: effectiveCapo,
        scrollPercentage: 0,
        lastUpdated: Date.now()
      };
      if (engineRef.current) {
        const senderId = currentMember?.id || prev.hostId || 'leader';
        const senderName = currentMember?.name || 'Líder';
        engineRef.current.broadcast({
          type: 'SONG_CHANGE',
          senderId,
          senderName,
          payload: { songId, key: songKey, semitones: semitoneShift, capo: effectiveCapo, song: songData || null }
        });
      }
      return updated;
    });
  }, [currentMember]);

  const changeKey = useCallback((key: string, semitones: number) => {
    setSessionState(prev => {
      if (!prev) return null;
      const updated = {
        ...prev,
        currentKey: key,
        semitoneShift: semitones,
        lastUpdated: Date.now()
      };
      if (engineRef.current && currentMember) {
        engineRef.current.broadcast({
          type: 'KEY_CHANGE',
          senderId: currentMember.id,
          senderName: currentMember.name,
          payload: { key, semitones }
        });
      }
      return updated;
    });
  }, [currentMember]);

  const changeCapo = useCallback((capo: number) => {
    setSessionState(prev => {
      if (!prev) return null;
      const updated: LiveSessionState = {
        ...prev,
        currentCapo: capo,
        lastUpdated: Date.now()
      };
      if (engineRef.current && currentMember) {
        engineRef.current.broadcast({
          type: 'CAPO_CHANGE',
          senderId: currentMember.id,
          senderName: currentMember.name,
          payload: { capo }
        });
      }
      return updated;
    });
  }, [currentMember]);

  const toggleFollowScroll = useCallback((enabled?: boolean) => {
    setSessionState(prev => {
      if (!prev) return null;
      const newVal = enabled !== undefined ? enabled : !prev.followScroll;
      const updated = { ...prev, followScroll: newVal };
      if (engineRef.current && currentMember) {
        engineRef.current.broadcast({
          type: 'STATE_UPDATE',
          senderId: currentMember.id,
          senderName: currentMember.name,
          payload: { followScroll: newVal }
        });
      }
      return updated;
    });
  }, [currentMember]);

  const broadcastScroll = useCallback((percentage: number) => {
    if (sessionState?.followScroll && engineRef.current && currentMember && (currentMember.role === 'leader' || sessionState.hostId === currentMember.id)) {
      engineRef.current.broadcast({
        type: 'SCROLL_SYNC',
        senderId: currentMember.id,
        senderName: currentMember.name,
        payload: { scrollPercentage: percentage }
      });
    }
  }, [sessionState?.followScroll, sessionState?.hostId, currentMember]);

  const sendBandAlert = useCallback((message: string, type: BandAlert['type'] = 'custom') => {
    if (!currentMember) return;
    const alert: BandAlert = {
      id: 'alert_' + Date.now(),
      message,
      type,
      timestamp: Date.now(),
      senderName: currentMember.name
    };
    setRecentAlert(alert);
    setSessionState(prev => prev ? { ...prev, currentAlert: alert } : null);
    if (engineRef.current) {
      engineRef.current.broadcast({
        type: 'BAND_ALERT',
        senderId: currentMember.id,
        senderName: currentMember.name,
        payload: alert
      });
    }
  }, [currentMember]);

  const dismissAlert = useCallback(() => {
    setRecentAlert(null);
    setSessionState(prev => prev ? { ...prev, currentAlert: null } : null);
    if (engineRef.current && currentMember) {
      engineRef.current.broadcast({
        type: 'DISMISS_ALERT',
        senderId: currentMember.id,
        senderName: currentMember.name,
        payload: null
      });
    }
  }, [currentMember]);

  const setActiveSetlist = useCallback((setlistId: string | null) => {
    setSessionState(prev => {
      if (!prev) return null;
      const updated = { ...prev, activeSetlistId: setlistId, lastUpdated: Date.now() };
      if (engineRef.current && currentMember) {
        engineRef.current.broadcast({
          type: 'STATE_UPDATE',
          senderId: currentMember.id,
          senderName: currentMember.name,
          payload: { activeSetlistId: setlistId }
        });
      }
      return updated;
    });
  }, [currentMember]);

  const updateMemberName = useCallback((name: string, instrument: string) => {
    setCurrentMember(prev => {
      if (!prev) return null;
      const updated = { ...prev, name, instrument };
      if (engineRef.current) {
        engineRef.current.broadcast({
          type: 'MEMBER_JOIN',
          senderId: updated.id,
          senderName: updated.name,
          payload: updated
        });
      }
      return updated;
    });
  }, []);

  const isHost = Boolean(
    sessionState && (
      currentMember?.isHost === true ||
      currentMember?.role === 'leader' ||
      (currentMember && sessionState.hostId === currentMember.id) ||
      (userProfile?.uid && sessionState.hostId === userProfile.uid)
    )
  );

  return (
    <LiveRoomContext.Provider
      value={{
        isInRoom: Boolean(sessionState),
        isHost: Boolean(isHost),
        currentMember,
        sessionState,
        engine,
        createRoom,
        joinRoom,
        leaveRoom,
        selectSong,
        changeKey,
        changeCapo,
        toggleFollowScroll,
        broadcastScroll,
        sendBandAlert,
        dismissAlert,
        setActiveSetlist,
        updateMemberName,
        recentAlert
      }}
    >
      {children}
    </LiveRoomContext.Provider>
  );
};


export const useLiveRoom = () => {
  const context = useContext(LiveRoomContext);
  if (!context) {
    throw new Error('useLiveRoom must be used within a LiveRoomProvider');
  }
  return context;
};

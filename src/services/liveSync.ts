import { BandAlert, LiveMember, LiveSessionState, Song } from '../types';
import { db, isFirebaseConfigured } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  deleteDoc,
  Unsubscribe
} from 'firebase/firestore';

export type SyncEventType =
  | 'STATE_UPDATE'
  | 'SONG_CHANGE'
  | 'KEY_CHANGE'
  | 'CAPO_CHANGE'
  | 'SCROLL_SYNC'
  | 'BAND_ALERT'
  | 'DISMISS_ALERT'
  | 'MEMBER_JOIN'
  | 'MEMBER_LEAVE'
  | 'SETLIST_CHANGE';

export interface SyncMessage {
  type: SyncEventType;
  senderId: string;
  senderName: string;
  roomId: string;
  payload: any;
  timestamp: number;
}

const STORAGE_PREFIX = 'cifraflow_room_state_';

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) return null as any;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore) as any;
  }
  const clean: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      clean[key] = sanitizeForFirestore(value);
    }
  }
  return clean;
}

export class LiveSyncEngine {
  private roomId: string;
  private channel: BroadcastChannel | null = null;
  private listeners: ((message: SyncMessage) => void)[] = [];
  private storageHandler: ((e: StorageEvent) => void) | null = null;
  private firestoreUnsubscribe: Unsubscribe | null = null;
  private isDestroyed = false;

  // Track alert ID to never duplicate / spam past alerts on Firestore snapshots
  private lastAlertId: string | null = null;

  // Scroll sync throttler to protect Firestore from rate-limiting
  private lastScrollSyncTime = 0;
  private pendingScrollPercentage: number | null = null;
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(roomId: string) {
    this.roomId = roomId.trim().toUpperCase();
    this.initLocalTransport();
    this.initFirestoreRealtime();
  }

  /**
   * Layer 1: Local Browser Transport (BroadcastChannel + Storage for instant 0ms multi-tab)
   */
  private initLocalTransport() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(`cifraflow_${this.roomId}`);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.roomId === this.roomId) {
            this.notifyListeners(event.data);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not available', e);
    }

    if (typeof window !== 'undefined') {
      this.storageHandler = (event: StorageEvent) => {
        if (event.key === `${STORAGE_PREFIX}${this.roomId}` && event.newValue) {
          try {
            const data = JSON.parse(event.newValue);
            this.notifyListeners({
              type: 'STATE_UPDATE',
              senderId: data.lastSenderId || 'external',
              senderName: data.lastSenderName || 'Banda',
              roomId: this.roomId,
              payload: data,
              timestamp: Date.now()
            });
          } catch (err) {
            console.error('Failed to parse storage sync message', err);
          }
        }
      };
      window.addEventListener('storage', this.storageHandler);
    }
  }

  /**
   * Layer 2: Cloud Firestore Global Cross-Device Realtime Listener
   * Syncs seamlessly across smartphones, tablets, and computers worldwide!
   */
  private initFirestoreRealtime() {
    try {
      const roomDocRef = doc(db, 'rooms', this.roomId);

      this.firestoreUnsubscribe = onSnapshot(
        roomDocRef,
        (snapshot) => {
          if (this.isDestroyed || !snapshot.exists()) return;

          const data = snapshot.data() as LiveSessionState & { lastMessage?: SyncMessage };

          // Notify state update to local components
          this.notifyListeners({
            type: 'STATE_UPDATE',
            senderId: data.hostId || 'cloud',
            senderName: data.roomName || 'Sala Ao Vivo',
            roomId: this.roomId,
            payload: data,
            timestamp: data.lastUpdated || Date.now()
          });

          // ONLY trigger a new alert notification if the alert is new and within the last 15s
          if (data.currentAlert) {
            const isNewAlert = data.currentAlert.id && data.currentAlert.id !== this.lastAlertId;
            const isFresh = Date.now() - (data.currentAlert.timestamp || 0) < 15000;

            if (isNewAlert && isFresh) {
              this.lastAlertId = data.currentAlert.id;
              this.notifyListeners({
                type: 'BAND_ALERT',
                senderId: data.hostId || 'leader',
                senderName: data.currentAlert.senderName || 'Líder',
                roomId: this.roomId,
                payload: data.currentAlert,
                timestamp: data.currentAlert.timestamp || Date.now()
              });
            }
          } else {
            if (this.lastAlertId !== null) {
              this.lastAlertId = null;
              this.notifyListeners({
                type: 'DISMISS_ALERT',
                senderId: data.hostId || 'cloud',
                senderName: 'Sistema',
                roomId: this.roomId,
                payload: null,
                timestamp: data.lastUpdated || Date.now()
              });
            }
          }
        },
        (error) => {
          console.warn('Firestore room sync snapshot error (operating in local fallback):', error.message);
        }
      );
    } catch (err) {
      console.warn('Firestore realtime init note:', err);
    }
  }

  /**
   * Broadcast message to ALL devices via Cloud Firestore and local BroadcastChannel
   */
  public async broadcast(message: Omit<SyncMessage, 'timestamp' | 'roomId'>) {
    const fullMessage: SyncMessage = {
      ...message,
      roomId: this.roomId,
      timestamp: Date.now()
    };

    // 1. Local Broadcast for instant 0ms same-device response
    if (this.channel) {
      try {
        this.channel.postMessage(fullMessage);
      } catch (e) {}
    }

    // 2. Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${this.roomId}`);
        const current = raw ? JSON.parse(raw) : {};
        const merged = {
          ...current,
          ...(fullMessage.type === 'STATE_UPDATE' ? fullMessage.payload : {}),
          ...(fullMessage.type === 'SONG_CHANGE' ? {
            currentSongId: fullMessage.payload.songId,
            currentSong: fullMessage.payload.song || null,
            currentKey: fullMessage.payload.key || 'C',
            semitoneShift: fullMessage.payload.semitones ?? 0,
            currentCapo: fullMessage.payload.capo ?? (fullMessage.payload.song?.capo || 0),
            scrollPercentage: 0
          } : {}),
          ...(fullMessage.type === 'CAPO_CHANGE' ? {
            currentCapo: fullMessage.payload.capo
          } : {}),
          ...(fullMessage.type === 'KEY_CHANGE' ? {
            currentKey: fullMessage.payload.key,
            semitoneShift: fullMessage.payload.semitones
          } : {}),
          lastSenderId: fullMessage.senderId,
          lastUpdated: Date.now()
        };
        localStorage.setItem(`${STORAGE_PREFIX}${this.roomId}`, JSON.stringify(merged));
      } catch (e) {}
    }

    // 3. Global Cloud Firestore Update (Cross-Device Sync)
    try {
      const roomDocRef = doc(db, 'rooms', this.roomId);

      if (fullMessage.type === 'SONG_CHANGE') {
        const updateData: any = {
          currentSongId: fullMessage.payload.songId,
          currentKey: fullMessage.payload.key || 'C',
          semitoneShift: fullMessage.payload.semitones ?? 0,
          currentCapo: fullMessage.payload.capo ?? (fullMessage.payload.song?.capo || 0),
          scrollPercentage: 0,
          lastUpdated: Date.now()
        };
        if (fullMessage.payload.song) {
          const s = fullMessage.payload.song;
          const cleanSong: any = {
            id: s.id || fullMessage.payload.songId,
            title: s.title || '',
            artist: s.artist || '',
            originalKey: s.originalKey || fullMessage.payload.key || 'C',
            currentKey: s.currentKey || fullMessage.payload.key || 'C',
            content: s.content || ''
          };
          if (s.capo !== undefined && s.capo !== null) cleanSong.capo = s.capo;
          if (s.bpm !== undefined && s.bpm !== null) cleanSong.bpm = s.bpm;
          if (s.timeSignature !== undefined && s.timeSignature !== null) cleanSong.timeSignature = s.timeSignature;
          if (s.liturgicalMoment !== undefined && s.liturgicalMoment !== null) cleanSong.liturgicalMoment = s.liturgicalMoment;
          if (s.audioPreviewUrl !== undefined && s.audioPreviewUrl !== null) cleanSong.audioPreviewUrl = s.audioPreviewUrl;
          updateData.currentSong = cleanSong;
        }
        await setDoc(roomDocRef, sanitizeForFirestore(updateData), { merge: true });
      } else if (fullMessage.type === 'KEY_CHANGE') {
        await setDoc(roomDocRef, {
          currentKey: fullMessage.payload.key,
          semitoneShift: fullMessage.payload.semitones,
          lastUpdated: Date.now()
        }, { merge: true });
      } else if (fullMessage.type === 'CAPO_CHANGE') {
        await setDoc(roomDocRef, {
          currentCapo: fullMessage.payload.capo,
          lastUpdated: Date.now()
        }, { merge: true });
      } else if (fullMessage.type === 'BAND_ALERT') {
        this.lastAlertId = fullMessage.payload?.id || null;
        await setDoc(roomDocRef, {
          currentAlert: fullMessage.payload,
          lastUpdated: Date.now()
        }, { merge: true });
      } else if (fullMessage.type === 'DISMISS_ALERT') {
        this.lastAlertId = null;
        await setDoc(roomDocRef, {
          currentAlert: null,
          lastUpdated: Date.now()
        }, { merge: true });
      } else if (fullMessage.type === 'SCROLL_SYNC') {
        // Fast, responsive scroll sync with 200ms throttle
        const now = Date.now();
        this.pendingScrollPercentage = fullMessage.payload.scrollPercentage;

        if (now - this.lastScrollSyncTime >= 200) {
          this.lastScrollSyncTime = now;
          setDoc(roomDocRef, {
            scrollPercentage: fullMessage.payload.scrollPercentage,
            lastUpdated: now
          }, { merge: true }).catch(() => {});
        } else if (!this.scrollTimer) {
          this.scrollTimer = setTimeout(() => {
            this.scrollTimer = null;
            if (this.pendingScrollPercentage !== null && !this.isDestroyed) {
              this.lastScrollSyncTime = Date.now();
              setDoc(roomDocRef, {
                scrollPercentage: this.pendingScrollPercentage,
                lastUpdated: Date.now()
              }, { merge: true }).catch(() => {});
            }
          }, 200 - (now - this.lastScrollSyncTime));
        }
      } else if (fullMessage.type === 'MEMBER_JOIN') {
        const docSnap = await getDoc(roomDocRef);
        if (docSnap.exists()) {
          const existing = (docSnap.data() as LiveSessionState).members || [];
          const exists = existing.some((m) => m.id === fullMessage.payload.id);
          const updatedMembers = exists
            ? existing.map((m) => (m.id === fullMessage.payload.id ? fullMessage.payload : m))
            : [...existing, fullMessage.payload];

          await setDoc(roomDocRef, {
            members: updatedMembers,
            lastUpdated: Date.now()
          }, { merge: true });
        }
      } else if (fullMessage.type === 'MEMBER_LEAVE') {
        const docSnap = await getDoc(roomDocRef);
        if (docSnap.exists()) {
          const existing = (docSnap.data() as LiveSessionState).members || [];
          const updatedMembers = existing.filter((m) => m.id !== fullMessage.payload.id);
          await setDoc(roomDocRef, {
            members: updatedMembers,
            lastUpdated: Date.now()
          }, { merge: true });
        }
      } else if (fullMessage.type === 'STATE_UPDATE') {
        await setDoc(roomDocRef, {
          ...fullMessage.payload,
          lastUpdated: Date.now()
        }, { merge: true });
      }
    } catch (err: any) {
      console.warn('Firestore room broadcast note:', err.message);
    }
  }

  public subscribe(callback: (message: SyncMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  private notifyListeners(message: SyncMessage) {
    this.listeners.forEach((listener) => {
      try {
        listener(message);
      } catch (e) {
        console.error('Error in sync listener', e);
      }
    });
  }

  public async fetchCloudRoomState(): Promise<LiveSessionState | null> {
    try {
      const roomDocRef = doc(db, 'rooms', this.roomId);
      const snapshot = await getDoc(roomDocRef);
      if (snapshot.exists()) {
        return snapshot.data() as LiveSessionState;
      }
    } catch (err) {
      console.warn('Could not fetch cloud room state, using local cache', err);
    }
    return this.getSavedState() as LiveSessionState | null;
  }

  public getSavedState(): Partial<LiveSessionState> | null {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(`${STORAGE_PREFIX}${this.roomId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to read saved room state', e);
    }
    return null;
  }

  public async saveState(state: LiveSessionState) {
    // 1. Local storage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${this.roomId}`, JSON.stringify(state));
      } catch (e) {}
    }

    // 2. Cloud Firestore creation / full overwrite
    try {
      const roomDocRef = doc(db, 'rooms', this.roomId);
      await setDoc(roomDocRef, sanitizeForFirestore(state));
    } catch (err: any) {
      console.warn('Firestore room saveState note:', err.message);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }
    if (this.firestoreUnsubscribe) {
      this.firestoreUnsubscribe();
      this.firestoreUnsubscribe = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.storageHandler && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageHandler);
      this.storageHandler = null;
    }
    this.listeners = [];
  }
}

/**
 * Generate memorable 6-character room PINs (e.g. "MTS-742", "LOU-819")
 */
export function generateRoomPin(prefix = 'MTS'): string {
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

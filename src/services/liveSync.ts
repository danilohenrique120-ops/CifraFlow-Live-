import { BandAlert, LiveMember, LiveSessionState } from '../types';
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
  | 'SCROLL_SYNC'
  | 'BAND_ALERT'
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

export class LiveSyncEngine {
  private roomId: string;
  private channel: BroadcastChannel | null = null;
  private listeners: ((message: SyncMessage) => void)[] = [];
  private storageHandler: ((e: StorageEvent) => void) | null = null;
  private firestoreUnsubscribe: Unsubscribe | null = null;
  private isDestroyed = false;

  constructor(roomId: string) {
    this.roomId = roomId.trim().toUpperCase();
    this.initLocalTransport();
    this.initFirestoreRealtime();
  }

  /**
   * Layer 1: Local Browser Transport (BroadcastChannel + Storage for multi-tab)
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

          // If there's an active instant alert, broadcast it
          if (data.currentAlert) {
            this.notifyListeners({
              type: 'BAND_ALERT',
              senderId: data.hostId || 'leader',
              senderName: data.currentAlert.senderName || 'Líder',
              roomId: this.roomId,
              payload: data.currentAlert,
              timestamp: data.currentAlert.timestamp || Date.now()
            });
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

    // 1. Local Broadcast for instant same-device response
    if (this.channel) {
      try {
        this.channel.postMessage(fullMessage);
      } catch (e) {
        // ignore
      }
    }

    // 2. Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${this.roomId}`);
        const current = raw ? JSON.parse(raw) : {};
        const merged = {
          ...current,
          ...(fullMessage.type === 'STATE_UPDATE' ? fullMessage.payload : {}),
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
        await updateDoc(roomDocRef, {
          currentSongId: fullMessage.payload.songId,
          currentKey: fullMessage.payload.key,
          semitoneShift: fullMessage.payload.semitones ?? 0,
          lastUpdated: Date.now()
        });
      } else if (fullMessage.type === 'KEY_CHANGE') {
        await updateDoc(roomDocRef, {
          currentKey: fullMessage.payload.key,
          semitoneShift: fullMessage.payload.semitones,
          lastUpdated: Date.now()
        });
      } else if (fullMessage.type === 'SCROLL_SYNC') {
        await updateDoc(roomDocRef, {
          scrollPercentage: fullMessage.payload.scrollPercentage,
          lastUpdated: Date.now()
        });
      } else if (fullMessage.type === 'BAND_ALERT') {
        await updateDoc(roomDocRef, {
          currentAlert: fullMessage.payload,
          lastUpdated: Date.now()
        });
      } else if (fullMessage.type === 'MEMBER_JOIN') {
        const docSnap = await getDoc(roomDocRef);
        if (docSnap.exists()) {
          const existing = (docSnap.data() as LiveSessionState).members || [];
          const exists = existing.some((m) => m.id === fullMessage.payload.id);
          const updatedMembers = exists
            ? existing.map((m) => (m.id === fullMessage.payload.id ? fullMessage.payload : m))
            : [...existing, fullMessage.payload];

          await updateDoc(roomDocRef, {
            members: updatedMembers,
            lastUpdated: Date.now()
          });
        }
      } else if (fullMessage.type === 'MEMBER_LEAVE') {
        const docSnap = await getDoc(roomDocRef);
        if (docSnap.exists()) {
          const existing = (docSnap.data() as LiveSessionState).members || [];
          const updatedMembers = existing.filter((m) => m.id !== fullMessage.payload.id);
          await updateDoc(roomDocRef, {
            members: updatedMembers,
            lastUpdated: Date.now()
          });
        }
      } else if (fullMessage.type === 'STATE_UPDATE') {
        await updateDoc(roomDocRef, {
          ...fullMessage.payload,
          lastUpdated: Date.now()
        });
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
      await setDoc(roomDocRef, state);
    } catch (err: any) {
      console.warn('Firestore room saveState note:', err.message);
    }
  }

  public destroy() {
    this.isDestroyed = true;
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

import { BandAlert, LiveMember, LiveSessionState } from '../types';

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

  constructor(roomId: string) {
    this.roomId = roomId;
    this.initChannel();
  }

  private initChannel() {
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
      console.warn('BroadcastChannel not available, falling back to storage sync', e);
    }

    // Storage fallback for cross-tab/multi-window synchronization
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

  public broadcast(message: Omit<SyncMessage, 'timestamp' | 'roomId'>) {
    const fullMessage: SyncMessage = {
      ...message,
      roomId: this.roomId,
      timestamp: Date.now()
    };

    // 1. Send via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(fullMessage);
      } catch (e) {
        console.error('Failed to send broadcast message', e);
      }
    }

    // 2. Persist to localStorage for fallback
    if (typeof window !== 'undefined') {
      try {
        if (fullMessage.type === 'STATE_UPDATE' || fullMessage.type === 'SONG_CHANGE' || fullMessage.type === 'KEY_CHANGE') {
          const raw = localStorage.getItem(`${STORAGE_PREFIX}${this.roomId}`);
          const current = raw ? JSON.parse(raw) : {};
          const merged = { ...current, ...fullMessage.payload, lastSenderId: fullMessage.senderId, lastUpdated: Date.now() };
          localStorage.setItem(`${STORAGE_PREFIX}${this.roomId}`, JSON.stringify(merged));
        }
      } catch (e) {
        // ignore quota errors
      }
    }
  }

  public subscribe(callback: (message: SyncMessage) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(message: SyncMessage) {
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (e) {
        console.error('Error in sync listener', e);
      }
    });
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

  public saveState(state: LiveSessionState) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${this.roomId}`, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save room state', e);
    }
  }

  public destroy() {
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

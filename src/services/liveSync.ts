import { BandAlert, LiveMember, LiveSessionState, Song } from '../types';
import { db, isFirebaseConfigured } from '../firebase';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { localDB } from './storageService';
import { networkStatus } from './pwaService';

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

export type TransportMode = 'cloud' | 'p2p_local' | 'local_cache';

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
  private transportListeners: ((mode: TransportMode) => void)[] = [];
  private storageHandler: ((e: StorageEvent) => void) | null = null;
  private firestoreUnsubscribe: Unsubscribe | null = null;
  private isDestroyed = false;
  private currentTransport: TransportMode = 'cloud';

  // P2P WebRTC Layer (Sem Internet / Wi-Fi de Palco / Hotspot)
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private activeDataChannels: Set<RTCDataChannel> = new Set();

  // Track alert ID to never duplicate / spam past alerts on Firestore snapshots
  private lastAlertId: string | null = null;

  // Scroll sync throttler to protect Firestore from rate-limiting
  private lastScrollSyncTime = 0;
  private pendingScrollPercentage: number | null = null;
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;

  // Network listener unsubscribe
  private unwatchNetwork: (() => void) | null = null;

  constructor(roomId: string) {
    this.roomId = roomId.trim().toUpperCase();
    this.initLocalTransport();
    this.initNetworkMonitoring();
    this.initFirestoreRealtime();
    this.initP2PTransport();
  }

  public getTransportMode(): TransportMode {
    return this.currentTransport;
  }

  public onTransportModeChange(callback: (mode: TransportMode) => void): () => void {
    this.transportListeners.push(callback);
    callback(this.currentTransport);
    return () => {
      this.transportListeners = this.transportListeners.filter(l => l !== callback);
    };
  }

  private setTransportMode(mode: TransportMode) {
    if (this.currentTransport !== mode) {
      this.currentTransport = mode;
      this.transportListeners.forEach(cb => {
        try { cb(mode); } catch (e) {}
      });
    }
  }

  /**
   * Layer 1: Local Browser Transport (BroadcastChannel + LocalStorage + IndexedDB)
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
   * Monitora conectividade física (Wi-Fi / 4G / Offline)
   */
  private initNetworkMonitoring() {
    this.unwatchNetwork = networkStatus.subscribe((online) => {
      if (!online) {
        if (this.activeDataChannels.size > 0) {
          this.setTransportMode('p2p_local');
        } else {
          this.setTransportMode('local_cache');
        }
      } else {
        if (isFirebaseConfigured) {
          this.setTransportMode('cloud');
        }
      }
    });
  }

  /**
   * Layer 2: Cloud Firestore Global Cross-Device Realtime Listener
   */
  private initFirestoreRealtime() {
    try {
      if (!isFirebaseConfigured || !networkStatus.getStatus()) {
        this.setTransportMode('local_cache');
        return;
      }

      const roomDocRef = doc(db, 'rooms', this.roomId);

      this.firestoreUnsubscribe = onSnapshot(
        roomDocRef,
        (snapshot) => {
          if (this.isDestroyed || !snapshot.exists()) return;

          this.setTransportMode('cloud');
          const data = snapshot.data() as LiveSessionState & { lastMessage?: SyncMessage };

          // Salvar no IndexedDB local para contingência instantânea caso a internet caia
          localDB.saveLiveRoomState(data);

          // Notificar ouvintes locais
          this.notifyListeners({
            type: 'STATE_UPDATE',
            senderId: data.hostId || 'cloud',
            senderName: data.roomName || 'Sala Ao Vivo',
            roomId: this.roomId,
            payload: data,
            timestamp: data.lastUpdated || Date.now()
          });

          // Tratar alertas
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
          console.warn('Firestore em modo contingência local:', error.message);
          if (this.activeDataChannels.size > 0) {
            this.setTransportMode('p2p_local');
          } else {
            this.setTransportMode('local_cache');
          }
        }
      );
    } catch (err) {
      console.warn('Firestore realtime init note:', err);
      this.setTransportMode('local_cache');
    }
  }

  /**
   * Layer 3: P2P Local WebRTC Transport (Comunicação Direta de Palco sem Internet)
   */
  private initP2PTransport() {
    if (typeof window === 'undefined' || !('RTCPeerConnection' in window)) return;

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });

      pc.ondatachannel = (event) => {
        const dc = event.channel;
        this.setupDataChannel(dc);
      };

      this.peerConnection = pc;
    } catch (e) {
      console.warn('P2P WebRTC não suportado neste navegador', e);
    }
  }

  private setupDataChannel(dc: RTCDataChannel) {
    dc.onopen = () => {
      this.activeDataChannels.add(dc);
      this.setTransportMode('p2p_local');
    };

    dc.onclose = () => {
      this.activeDataChannels.delete(dc);
      if (this.activeDataChannels.size === 0 && !networkStatus.getStatus()) {
        this.setTransportMode('local_cache');
      }
    };

    dc.onmessage = (event) => {
      try {
        const message: SyncMessage = JSON.parse(event.data);
        if (message && message.roomId === this.roomId) {
          this.notifyListeners(message);
        }
      } catch (e) {
        console.error('Erro ao processar mensagem P2P', e);
      }
    };
  }

  /**
   * Cria uma oferta P2P WebRTC codificada para pareamento offline via QR Code / Token
   */
  public async createP2POffer(): Promise<string> {
    if (!this.peerConnection) {
      this.initP2PTransport();
    }
    if (!this.peerConnection) throw new Error('WebRTC não suportado');

    const dc = this.peerConnection.createDataChannel(`cifraflow_dc_${this.roomId}`);
    this.setupDataChannel(dc);
    this.dataChannel = dc;

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // Esperar ICE gathering completar para ter os candidatos locais (LAN)
    await new Promise<void>((resolve) => {
      if (this.peerConnection?.iceGatheringState === 'complete') {
        resolve();
      } else {
        const checkState = () => {
          if (this.peerConnection?.iceGatheringState === 'complete') {
            this.peerConnection.removeEventListener('icegatheringstatechange', checkState);
            resolve();
          }
        };
        this.peerConnection?.addEventListener('icegatheringstatechange', checkState);
        setTimeout(resolve, 1000); // Timeout de 1s para não travar
      }
    });

    return btoa(JSON.stringify(this.peerConnection.localDescription));
  }

  /**
   * Músico aceita a oferta do Líder e gera a resposta
   */
  public async acceptP2POffer(offerToken: string): Promise<string> {
    if (!this.peerConnection) this.initP2PTransport();
    if (!this.peerConnection) throw new Error('WebRTC não suportado');

    const offerDesc = JSON.parse(atob(offerToken));
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offerDesc));

    const answer = await this.peerConnection.createAnswer();
    await this.peerConnection.setLocalDescription(answer);

    await new Promise<void>((resolve) => {
      if (this.peerConnection?.iceGatheringState === 'complete') {
        resolve();
      } else {
        const check = () => {
          if (this.peerConnection?.iceGatheringState === 'complete') {
            this.peerConnection?.removeEventListener('icegatheringstatechange', check);
            resolve();
          }
        };
        this.peerConnection?.addEventListener('icegatheringstatechange', check);
        setTimeout(resolve, 1000);
      }
    });

    return btoa(JSON.stringify(this.peerConnection.localDescription));
  }

  /**
   * Líder conclui o pareamento P2P aplicando a resposta do músico
   */
  public async acceptP2PAnswer(answerToken: string): Promise<void> {
    if (!this.peerConnection) return;
    const answerDesc = JSON.parse(atob(answerToken));
    await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answerDesc));
  }

  public getActivePeersCount(): number {
    return this.activeDataChannels.size;
  }

  /**
   * Transmissão Híbrida: P2P + BroadcastChannel + Cloud Firestore + IndexedDB Local
   */
  public async broadcast(message: Omit<SyncMessage, 'timestamp' | 'roomId'>) {
    const fullMessage: SyncMessage = {
      ...message,
      roomId: this.roomId,
      timestamp: Date.now()
    };

    // 1. Local Broadcast para abas e janelas instantâneo (0ms)
    if (this.channel) {
      try {
        this.channel.postMessage(fullMessage);
      } catch (e) {}
    }

    // 2. Transmissão P2P Direta (WebRTC DataChannel para aparelhos na mesma rede/hotspot sem internet)
    if (this.activeDataChannels.size > 0) {
      const payloadStr = JSON.stringify(fullMessage);
      this.activeDataChannels.forEach((dc) => {
        if (dc.readyState === 'open') {
          try {
            dc.send(payloadStr);
          } catch (e) {}
        }
      });
    }

    // 3. Persistência Local-First (LocalStorage + IndexedDB)
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${this.roomId}`);
        const current = raw ? JSON.parse(raw) : {};
        const merged: any = {
          ...current,
          roomId: this.roomId,
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
        localDB.saveLiveRoomState(merged);
      } catch (e) {}
    }

    // 4. Sincronização na Nuvem (apenas se online e configurado)
    if (networkStatus.getStatus() && isFirebaseConfigured) {
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
        console.warn('Firestore offline fallback:', err.message);
      }
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
    if (networkStatus.getStatus() && isFirebaseConfigured) {
      try {
        const roomDocRef = doc(db, 'rooms', this.roomId);
        const snapshot = await getDoc(roomDocRef);
        if (snapshot.exists()) {
          const cloudState = snapshot.data() as LiveSessionState;
          localDB.saveLiveRoomState(cloudState);
          return cloudState;
        }
      } catch (err) {
        console.warn('Could not fetch cloud room state, using local cache', err);
      }
    }
    const idbState = await localDB.getLiveRoomState(this.roomId);
    if (idbState) return idbState;
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
    // 1. IndexedDB + Local storage
    localDB.saveLiveRoomState(state);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${STORAGE_PREFIX}${this.roomId}`, JSON.stringify(state));
      } catch (e) {}
    }

    // 2. Cloud Firestore (se online)
    if (networkStatus.getStatus() && isFirebaseConfigured) {
      try {
        const roomDocRef = doc(db, 'rooms', this.roomId);
        await setDoc(roomDocRef, sanitizeForFirestore(state));
      } catch (err: any) {
        console.warn('Firestore room saveState fallback:', err.message);
      }
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.unwatchNetwork) {
      this.unwatchNetwork();
      this.unwatchNetwork = null;
    }
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
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.activeDataChannels.clear();
    this.listeners = [];
    this.transportListeners = [];
  }
}

export function generateRoomPin(prefix = 'MTS'): string {
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

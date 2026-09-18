import { db, isFirebaseConfigured } from '../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, where } from 'firebase/firestore';

export interface WebRTCSignal {
  id: string;
  from: string;
  to: string;
  type: 'offer' | 'answer' | 'candidate';
  payload: any;
  createdAt: number;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

export class WebRTCVideoMesh {
  private roomId: string;
  private myPeerId: string;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private transceivers: Map<string, { audio: RTCRtpTransceiver; video: RTCRtpTransceiver }> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map();
  private onStreamAdded: (peerId: string, stream: MediaStream) => void;
  private onStreamRemoved: (peerId: string) => void;
  private channel: BroadcastChannel | null = null;
  private firestoreUnsubscribe: (() => void) | null = null;
  private storageHandler: ((e: StorageEvent) => void) | null = null;
  private isDestroyed = false;
  private processedSignalIds = new Set<string>();

  constructor(
    roomId: string,
    myPeerId: string,
    onStreamAdded: (peerId: string, stream: MediaStream) => void,
    onStreamRemoved: (peerId: string) => void
  ) {
    this.roomId = roomId.trim().toUpperCase();
    this.myPeerId = myPeerId;
    this.onStreamAdded = onStreamAdded;
    this.onStreamRemoved = onStreamRemoved;

    this.initSignaling();
  }

  /**
   * Updates local stream tracks for all active peer connections
   * Uses sender.replaceTrack() for zero-interruption, instant track updating without renegotiation glare
   */
  public setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;
    const audioTrack = stream ? stream.getAudioTracks()[0] || null : null;
    const videoTrack = stream ? stream.getVideoTracks()[0] || null : null;

    this.transceivers.forEach((t, peerId) => {
      try {
        if (t.audio && t.audio.sender) {
          t.audio.sender.replaceTrack(audioTrack).catch(err => {
            console.warn(`[WebRTC] Error replacing audio track for ${peerId}:`, err);
          });
        }
        if (t.video && t.video.sender) {
          t.video.sender.replaceTrack(videoTrack).catch(err => {
            console.warn(`[WebRTC] Error replacing video track for ${peerId}:`, err);
          });
        }
      } catch (e) {
        console.warn(`[WebRTC] Error updating tracks for ${peerId}:`, e);
      }
    });
  }

  /**
   * Initialize 3-tier signaling:
   * 1. BroadcastChannel (0ms - between tabs/windows in same browser)
   * 2. localStorage (same domain cross-window)
   * 3. Firestore query `rooms/{roomId}/signals` where `to == myPeerId` (real remote devices across the internet)
   */
  private initSignaling() {
    // 1. BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(`cifraflow_video_sig_${this.roomId}`);
        this.channel.onmessage = (event) => {
          if (this.isDestroyed || !event.data) return;
          const signal = event.data as WebRTCSignal;
          if (signal && signal.to === this.myPeerId && signal.from !== this.myPeerId) {
            const sigKey = signal.id || `${signal.from}_${signal.type}_${signal.createdAt}`;
            if (this.processedSignalIds.has(sigKey)) return;
            this.markSignalProcessed(sigKey);
            this.handleSignal(signal);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not available for video signaling', e);
    }

    // 2. localStorage
    if (typeof window !== 'undefined') {
      this.storageHandler = (e: StorageEvent) => {
        if (this.isDestroyed || !e.newValue) return;
        if (e.key && e.key.startsWith(`cifraflow_vsign_${this.roomId}_`)) {
          try {
            const signal = JSON.parse(e.newValue) as WebRTCSignal;
            if (signal && signal.to === this.myPeerId && signal.from !== this.myPeerId) {
              const sigKey = signal.id || `${signal.from}_${signal.type}_${signal.createdAt}`;
              if (this.processedSignalIds.has(sigKey)) return;
              this.markSignalProcessed(sigKey);
              this.handleSignal(signal);
            }
          } catch (err) {}
        }
      };
      window.addEventListener('storage', this.storageHandler);
    }

    // 3. Firestore
    if (isFirebaseConfigured) {
      try {
        const signalsRef = collection(db, 'rooms', this.roomId, 'signals');
        const q = query(signalsRef, where('to', '==', this.myPeerId));
        const startTime = Date.now() - 30000; // Accept signals up to 30s old

        this.firestoreUnsubscribe = onSnapshot(q, (snapshot) => {
          if (this.isDestroyed) return;
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const docId = change.doc.id;
              const data = change.doc.data() as WebRTCSignal;

              // Immediately delete doc to keep Firestore subcollection clean and minimize quota
              deleteDoc(doc(db, 'rooms', this.roomId, 'signals', docId)).catch(() => {});

              if (!data) return;

              const sigKey = data.id || `${data.from}_${data.type}_${data.createdAt}`;
              if (this.processedSignalIds.has(sigKey)) return;
              this.markSignalProcessed(sigKey);

              if (data.from !== this.myPeerId && data.createdAt && data.createdAt >= startTime) {
                this.handleSignal(data);
              }
            }
          });
        }, (err) => {
          console.warn('Firestore video signaling listener note:', err.message);
        });
      } catch (err) {
        console.warn('Could not init Firestore video signaling:', err);
      }
    }
  }

  private markSignalProcessed(sigKey: string) {
    this.processedSignalIds.add(sigKey);
    if (this.processedSignalIds.size > 200) {
      const first = this.processedSignalIds.values().next().value;
      if (first) this.processedSignalIds.delete(first);
    }
  }

  private sendSignal(toPeerId: string, type: 'offer' | 'answer' | 'candidate', payload: any) {
    const signalId = `sig_${this.myPeerId}_${toPeerId}_${type}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const signal: WebRTCSignal = {
      id: signalId,
      from: this.myPeerId,
      to: toPeerId,
      type,
      payload,
      createdAt: Date.now()
    };

    // 1. BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(signal);
      } catch (e) {}
    }

    // 2. localStorage
    if (typeof window !== 'undefined') {
      try {
        const key = `cifraflow_vsign_${this.roomId}_${Date.now()}_${Math.random()}`;
        localStorage.setItem(key, JSON.stringify(signal));
        setTimeout(() => {
          try { localStorage.removeItem(key); } catch (e) {}
        }, 2000);
      } catch (e) {}
    }

    // 3. Firestore
    if (isFirebaseConfigured) {
      try {
        const signalsRef = collection(db, 'rooms', this.roomId, 'signals');
        addDoc(signalsRef, signal).catch(err => {
          console.warn('[WebRTC] Error adding signal to Firestore:', err);
        });
      } catch (e) {}
    }
  }

  /**
   * Sync active peer connections with current members list
   */
  public syncMembers(memberIds: string[]) {
    const otherIds = memberIds.filter(id => id !== this.myPeerId);

    // 1. Close removed members
    this.peerConnections.forEach((pc, peerId) => {
      if (!otherIds.includes(peerId)) {
        try { pc.close(); } catch (e) {}
        this.peerConnections.delete(peerId);
        this.transceivers.delete(peerId);
        this.pendingCandidates.delete(peerId);
        this.remoteStreams.delete(peerId);
        this.onStreamRemoved(peerId);
      }
    });

    // 2. Connect to new members
    otherIds.forEach((peerId) => {
      const existingPc = this.peerConnections.get(peerId);
      if (!existingPc || existingPc.connectionState === 'closed') {
        const pc = this.createPeerConnection(peerId);
        this.peerConnections.set(peerId, pc);

        // Initiator rule: The peer with alphabetically smaller ID creates the offer
        if (this.myPeerId < peerId) {
          this.initiateOffer(peerId, pc);
        }
      }
    });
  }

  private createPeerConnection(peerId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Explicit bidirectional transceivers guarantee immediate SDP m-lines for both audio & video
    const audioTransceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
    const videoTransceiver = pc.addTransceiver('video', { direction: 'sendrecv' });
    this.transceivers.set(peerId, { audio: audioTransceiver, video: videoTransceiver });

    // Add local tracks if stream is already active
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTransceiver.sender.replaceTrack(audioTrack).catch(console.warn);
      }
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTransceiver.sender.replaceTrack(videoTrack).catch(console.warn);
      }
    }

    // Listen for remote tracks
    pc.ontrack = (event) => {
      let stream = this.remoteStreams.get(peerId);
      if (!stream) {
        stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream();
        this.remoteStreams.set(peerId, stream);
      }

      if (!stream.getTracks().some(t => t.id === event.track.id)) {
        stream.addTrack(event.track);
      }

      this.onStreamAdded(peerId, stream);

      event.track.onunmute = () => {
        this.onStreamAdded(peerId, stream!);
      };
    };

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, 'candidate', event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.remoteStreams.delete(peerId);
        this.onStreamRemoved(peerId);
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        try { pc.restartIce(); } catch (e) {}
      }
    };

    return pc;
  }

  private async initiateOffer(peerId: string, pc: RTCPeerConnection) {
    try {
      if (pc.signalingState !== 'stable') return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.sendSignal(peerId, 'offer', {
        type: offer.type,
        sdp: offer.sdp
      });
    } catch (err) {
      console.warn(`[WebRTC] Error creating offer to ${peerId}:`, err);
    }
  }

  private async flushPendingCandidates(peerId: string, pc: RTCPeerConnection) {
    const pending = this.pendingCandidates.get(peerId);
    if (pending && pending.length > 0) {
      this.pendingCandidates.delete(peerId);
      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn('[WebRTC] Flush candidate note:', e);
        }
      }
    }
  }

  private async handleSignal(signal: WebRTCSignal) {
    const { from, type, payload } = signal;
    if (from === this.myPeerId) return;

    let pc = this.peerConnections.get(from);
    if (!pc || pc.connectionState === 'closed') {
      pc = this.createPeerConnection(from);
      this.peerConnections.set(from, pc);
    }

    // Perfect Negotiation pattern: politely resolve offer collisions
    const isPolite = this.myPeerId > from;

    try {
      if (type === 'offer') {
        const offerCollision = pc.signalingState !== 'stable';
        if (offerCollision) {
          if (!isPolite) {
            // Impolite peer ignores incoming offer; let own offer proceed
            return;
          }
          // Polite peer rolls back local offer
          try {
            await pc.setLocalDescription({ type: 'rollback' });
          } catch (rbErr) {
            console.warn('[WebRTC] Rollback error:', rbErr);
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(payload));
        await this.flushPendingCandidates(from, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.sendSignal(from, 'answer', {
          type: answer.type,
          sdp: answer.sdp
        });
      } else if (type === 'answer') {
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          await this.flushPendingCandidates(from, pc);
        }
      } else if (type === 'candidate') {
        if (payload && typeof payload.candidate === 'string') {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload));
            } catch (candErr) {
              console.warn('[WebRTC] Error adding ICE candidate:', candErr);
            }
          } else {
            const pending = this.pendingCandidates.get(from) || [];
            pending.push(payload);
            this.pendingCandidates.set(from, pending);
          }
        }
      }
    } catch (err) {
      console.warn(`[WebRTC] Error handling signal ${type} from ${from}:`, err);
    }
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.channel) {
      try { this.channel.close(); } catch (e) {}
      this.channel = null;
    }
    if (this.storageHandler && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageHandler);
      this.storageHandler = null;
    }
    if (this.firestoreUnsubscribe) {
      try { this.firestoreUnsubscribe(); } catch (e) {}
      this.firestoreUnsubscribe = null;
    }
    this.peerConnections.forEach(pc => {
      try { pc.close(); } catch (e) {}
    });
    this.peerConnections.clear();
    this.transceivers.clear();
    this.remoteStreams.clear();
    this.pendingCandidates.clear();
    this.processedSignalIds.clear();
  }
}

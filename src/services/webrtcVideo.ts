import { db, isFirebaseConfigured } from '../firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, limit } from 'firebase/firestore';

export interface WebRTCSignal {
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
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

export class WebRTCVideoMesh {
  private roomId: string;
  private myPeerId: string;
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
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

  public setLocalStream(stream: MediaStream | null) {
    this.localStream = stream;

    // Update tracks in existing peer connections using replaceTrack or renegotiate
    this.peerConnections.forEach((pc, peerId) => {
      const senders = pc.getSenders();
      if (!stream) {
        senders.forEach(sender => {
          try { pc.removeTrack(sender); } catch (e) {}
        });
        return;
      }

      let needsRenegotiation = false;
      stream.getTracks().forEach((track) => {
        const existingSender = senders.find(s => s.track && s.track.kind === track.kind);
        if (existingSender) {
          existingSender.replaceTrack(track).catch(console.warn);
        } else {
          try {
            pc.addTrack(track, stream);
            needsRenegotiation = true;
          } catch (e) {
            console.warn('Could not add track to existing connection:', e);
          }
        }
      });

      if (needsRenegotiation && pc.signalingState === 'stable') {
        this.initiateOffer(peerId, pc);
      }
    });
  }

  /**
   * Initialize 3-tier signaling:
   * 1. BroadcastChannel (0ms - between tabs/windows in same browser)
   * 2. localStorage (same domain cross-window)
   * 3. Firestore subcollection `rooms/{roomId}/signals` (real devices across the internet)
   */
  private initSignaling() {
    // 1. BroadcastChannel
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.channel = new BroadcastChannel(`cifraflow_video_sig_${this.roomId}`);
        this.channel.onmessage = (event) => {
          if (this.isDestroyed || !event.data) return;
          const signal = event.data as WebRTCSignal;
          if (signal.to === this.myPeerId && signal.from !== this.myPeerId) {
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
            if (signal.to === this.myPeerId && signal.from !== this.myPeerId) {
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
        const q = query(signalsRef, limit(40));
        const startTime = Date.now() - 10000; // Ignore stale signals older than 10s

        this.firestoreUnsubscribe = onSnapshot(q, (snapshot) => {
          if (this.isDestroyed) return;
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const docId = change.doc.id;
              if (this.processedSignalIds.has(docId)) return;
              this.processedSignalIds.add(docId);

              const data = change.doc.data() as WebRTCSignal;
              if (data && data.to === this.myPeerId && data.from !== this.myPeerId) {
                if (data.createdAt && data.createdAt >= startTime) {
                  this.handleSignal(data);
                }
              }

              // Auto-clean consumed signal to prevent subcollection bloat
              if (data && (data.to === this.myPeerId || Date.now() - (data.createdAt || 0) > 30000)) {
                deleteDoc(doc(db, 'rooms', this.roomId, 'signals', docId)).catch(() => {});
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

  private sendSignal(toPeerId: string, type: 'offer' | 'answer' | 'candidate', payload: any) {
    const signal: WebRTCSignal = {
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
        setTimeout(() => localStorage.removeItem(key), 2000);
      } catch (e) {}
    }

    // 3. Firestore
    if (isFirebaseConfigured) {
      try {
        const signalsRef = collection(db, 'rooms', this.roomId, 'signals');
        addDoc(signalsRef, signal).catch(() => {});
      } catch (e) {}
    }
  }

  /**
   * Sync active peer connections with current members list
   */
  public syncMembers(memberIds: string[]) {
    const otherIds = memberIds.filter(id => id !== this.myPeerId);

    // Close removed members
    this.peerConnections.forEach((pc, peerId) => {
      if (!otherIds.includes(peerId)) {
        pc.close();
        this.peerConnections.delete(peerId);
        this.pendingCandidates.delete(peerId);
        this.onStreamRemoved(peerId);
      }
    });

    // Connect to new members
    otherIds.forEach((peerId) => {
      if (!this.peerConnections.has(peerId)) {
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

    // Add local tracks if stream is active
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        try {
          pc.addTrack(track, this.localStream!);
        } catch (e) {
          console.warn('Error adding track to peer:', e);
        }
      });
    }

    // Listen for remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.onStreamAdded(peerId, event.streams[0]);
      } else {
        const inboundStream = new MediaStream([event.track]);
        this.onStreamAdded(peerId, inboundStream);
      }
    };

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, 'candidate', event.candidate.toJSON());
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.onStreamRemoved(peerId);
      }
    };

    return pc;
  }

  private async initiateOffer(peerId: string, pc: RTCPeerConnection) {
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      this.sendSignal(peerId, 'offer', {
        type: offer.type,
        sdp: offer.sdp
      });
    } catch (err) {
      console.warn(`Error creating offer to ${peerId}:`, err);
    }
  }

  private async handleSignal(signal: WebRTCSignal) {
    const { from, type, payload } = signal;
    let pc = this.peerConnections.get(from);

    if (!pc) {
      pc = this.createPeerConnection(from);
      this.peerConnections.set(from, pc);
    }

    try {
      if (type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(payload));

        // Flush pending ICE candidates if any arrived before offer
        const pending = this.pendingCandidates.get(from) || [];
        for (const candidate of pending) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
        }
        this.pendingCandidates.delete(from);

        // Create answer
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        this.sendSignal(from, 'answer', {
          type: answer.type,
          sdp: answer.sdp
        });
      } else if (type === 'answer') {
        if (pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));

          const pending = this.pendingCandidates.get(from) || [];
          for (const candidate of pending) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
          }
          this.pendingCandidates.delete(from);
        }
      } else if (type === 'candidate') {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(payload));
        } else {
          const pending = this.pendingCandidates.get(from) || [];
          pending.push(payload);
          this.pendingCandidates.set(from, pending);
        }
      }
    } catch (err) {
      console.warn(`Error handling signal ${type} from ${from}:`, err);
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
    this.pendingCandidates.clear();
  }
}

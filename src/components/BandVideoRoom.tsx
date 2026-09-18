import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveRoom } from '../context/LiveRoomContext';
import { LiveMember } from '../types';
import { WebRTCVideoMesh } from '../services/webrtcVideo';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  RefreshCw,
  Minimize2,
  Maximize2,
  X,
  Users,
  AlertCircle
} from 'lucide-react';

interface BandVideoRoomProps {
  onClose?: () => void;
}

interface RemoteVideoCardProps {
  member: LiveMember;
  stream?: MediaStream;
}

const RemoteVideoCard: React.FC<RemoteVideoCardProps> = ({ member, stream }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasStreamVideo, setHasStreamVideo] = useState(false);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const [needsAudioUnmute, setNeedsAudioUnmute] = useState(false);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !stream) {
      setHasStreamVideo(false);
      return;
    }

    videoEl.srcObject = stream;

    const playVideo = async () => {
      try {
        await videoEl.play();
        setNeedsAudioUnmute(false);
      } catch (err: any) {
        console.warn('Remote video unmuted autoplay blocked, retrying muted:', err);
        // Autoplay policy prevented unmuted sound. Mute to allow video to play immediately!
        videoEl.muted = true;
        setNeedsAudioUnmute(true);
        try {
          await videoEl.play();
        } catch (e) {
          console.warn('Muted autoplay also failed:', e);
        }
      }
    };

    playVideo();

    const checkTracks = () => {
      const videoTracks = stream.getVideoTracks();
      const hasActiveVideo = videoTracks.length > 0 && videoTracks.some(t => t.enabled && t.readyState === 'live');
      if (hasActiveVideo) {
        setHasStreamVideo(true);
      }
      if (videoEl.paused) {
        playVideo();
      }
    };

    checkTracks();
    stream.addEventListener('addtrack', checkTracks);
    stream.addEventListener('removetrack', checkTracks);

    stream.getVideoTracks().forEach(track => {
      track.onunmute = checkTracks;
      track.onmute = checkTracks;
      track.onended = checkTracks;
    });

    // Analyze remote audio for speaking detection
    let audioCtx: AudioContext | null = null;
    let animId: number | null = null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx && stream.getAudioTracks().length > 0) {
        audioCtx = new AudioCtx();
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkVol = () => {
          if (!audioCtx || audioCtx.state === 'closed') return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          setRemoteAudioLevel(sum / dataArray.length);
          animId = requestAnimationFrame(checkVol);
        };
        checkVol();
      }
    } catch (e) {}

    return () => {
      stream.removeEventListener('addtrack', checkTracks);
      stream.removeEventListener('removetrack', checkTracks);
      stream.getVideoTracks().forEach(track => {
        track.onunmute = null;
        track.onmute = null;
        track.onended = null;
      });
      if (animId) cancelAnimationFrame(animId);
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {});
    };
  }, [stream]);

  const isSpeaking = !member.isMuted && remoteAudioLevel > 18;
  const isVideoVisible = Boolean(member.isCameraOn !== false && stream && hasStreamVideo);

  return (
    <div className={`relative flex-none w-36 sm:w-44 h-24 sm:h-28 rounded-2xl overflow-hidden bg-zinc-900 border-2 transition-all shadow-md flex flex-col items-center justify-center ${
      isSpeaking ? 'border-emerald-400 ring-2 ring-emerald-400/40' : 'border-zinc-800'
    }`}>
      {/* 1. Live Remote Video Player (Always in DOM and rendered, so browser decodes frames immediately) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        onLoadedMetadata={() => setHasStreamVideo(true)}
        onPlaying={() => setHasStreamVideo(true)}
        className="w-full h-full object-cover absolute inset-0 z-0"
      />

      {/* 2. Fallback Avatar Card when camera is off or stream is establishing */}
      {!isVideoVisible && (
        <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-zinc-950 text-zinc-300">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base shadow-lg ${member.avatarColor || 'bg-zinc-700'}`}>
            {member.name ? member.name.substring(0, 2).toUpperCase() : 'M'}
          </div>
          <span className="text-[10px] text-zinc-400 mt-1 font-medium truncate max-w-[120px]">
            {member.instrument || 'Músico'}
          </span>
          <span className="text-[9px] text-zinc-500 font-semibold">
            {member.isCameraOn !== false ? 'Conectando vídeo...' : 'Câmera desligada'}
          </span>
        </div>
      )}

      {/* 3. Unmute Button Overlay if browser blocked unmuted autoplay */}
      {needsAudioUnmute && isVideoVisible && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (videoRef.current) {
              videoRef.current.muted = false;
              videoRef.current.play().catch(() => {});
              setNeedsAudioUnmute(false);
            }
          }}
          className="absolute top-1.5 right-1.5 z-20 px-1.5 py-0.5 rounded-md bg-amber-500/90 hover:bg-amber-400 text-zinc-950 text-[10px] font-bold flex items-center gap-1 shadow-lg animate-pulse"
          title="Clique para ativar o áudio deste participante"
        >
          <MicOff className="w-2.5 h-2.5" />
          <span>Ativar Som</span>
        </button>
      )}

      {/* 4. Bottom Information Bar */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-1.5 bg-gradient-to-t from-zinc-950/95 via-zinc-950/70 to-transparent flex items-center justify-between text-[11px]">
        <span className="font-bold text-white truncate max-w-[85px]">
          {member.name}
        </span>
        <div className="flex items-center gap-1">
          {member.isMuted ? (
            <MicOff className="w-3 h-3 text-rose-400" />
          ) : (
            <Mic className="w-3 h-3 text-emerald-400" />
          )}
          {member.isCameraOn !== false ? (
            <Video className="w-3 h-3 text-amber-400" />
          ) : (
            <VideoOff className="w-3 h-3 text-zinc-500" />
          )}
        </div>
      </div>

      {/* 5. Host Badge */}
      {member.isHost && (
        <div className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-black text-[9px] uppercase tracking-wider shadow">
          Líder
        </div>
      )}
    </div>
  );
};

export const BandVideoRoom: React.FC<BandVideoRoomProps> = ({ onClose }) => {
  const {
    currentMember,
    sessionState,
    updateMemberMediaStatus,
    toggleVideoRehearsal,
    isHost
  } = useLiveRoom();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const meshRef = useRef<WebRTCVideoMesh | null>(null);

  // Initialize WebRTC Mesh for Peer-to-Peer video streaming
  useEffect(() => {
    if (!sessionState?.pin || !currentMember?.id) return;

    const mesh = new WebRTCVideoMesh(
      sessionState.pin,
      currentMember.id,
      (peerId, stream) => {
        setRemoteStreams(prev => ({ ...prev, [peerId]: stream }));
      },
      (peerId) => {
        setRemoteStreams(prev => {
          const copy = { ...prev };
          delete copy[peerId];
          return copy;
        });
      }
    );

    // Pass local stream immediately if already acquired
    if (localStreamRef.current) {
      mesh.setLocalStream(localStreamRef.current);
    }

    // Sync active members immediately if available
    if (sessionState.members) {
      mesh.syncMembers(sessionState.members.map(m => m.id));
    }

    meshRef.current = mesh;

    return () => {
      mesh.destroy();
      meshRef.current = null;
    };
  }, [sessionState?.pin, currentMember?.id]);

  // Feed local stream to WebRTC mesh whenever localStream updates
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.setLocalStream(localStream);
    }
  }, [localStream]);

  // Keep peer connections aligned with sessionState.members
  useEffect(() => {
    if (meshRef.current && sessionState?.members) {
      meshRef.current.syncMembers(sessionState.members.map(m => m.id));
    }
  }, [sessionState?.members]);

  // Initialize Media Stream (Webcam + Mic)
  const startMedia = useCallback(async (facing: 'user' | 'environment') => {
    setIsConnecting(true);
    setPermissionError(null);

    // Stop existing tracks if any
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Navegador não suporta captura de câmera/áudio.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 480 },
          height: { ideal: 360 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsCameraOn(true);
      setIsMuted(false);
      updateMemberMediaStatus(true, false);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch(() => {});
      }

      // Audio analysis for local speaking indicator
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          const audioCtx = new AudioCtx();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(avg);
            animFrameRef.current = requestAnimationFrame(checkVolume);
          };
          checkVolume();
        }
      } catch (e) {
        console.warn('AudioContext not available for voice meter:', e);
      }
    } catch (err: any) {
      console.warn('Erro ao acessar dispositivos de mídia:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Permissão de câmera ou microfone negada no navegador.');
      } else if (err.name === 'NotFoundError') {
        setPermissionError('Nenhuma câmera ou microfone encontrado neste aparelho.');
      } else {
        setPermissionError('Não foi possível iniciar o vídeo/áudio neste dispositivo.');
      }
      setIsCameraOn(false);
      updateMemberMediaStatus(false, isMuted);
    } finally {
      setIsConnecting(false);
    }
  }, [updateMemberMediaStatus, isMuted]);

  useEffect(() => {
    startMedia(facingMode);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Sync stream to local video ref
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, isCameraOn]);

  // Toggle Camera
  const handleToggleCamera = useCallback(() => {
    if (!localStream) {
      startMedia(facingMode);
      return;
    }
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length > 0) {
      const nextState = !videoTracks[0].enabled;
      videoTracks.forEach(t => { t.enabled = nextState; });
      setIsCameraOn(nextState);
      updateMemberMediaStatus(nextState, isMuted);
    } else {
      startMedia(facingMode);
    }
  }, [localStream, facingMode, isMuted, startMedia, updateMemberMediaStatus]);

  // Toggle Microphone
  const handleToggleMute = useCallback(() => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length > 0) {
      const nextMuted = audioTracks[0].enabled;
      audioTracks.forEach(t => { t.enabled = !nextMuted; });
      setIsMuted(nextMuted);
      updateMemberMediaStatus(isCameraOn, nextMuted);
    }
  }, [localStream, isCameraOn, updateMemberMediaStatus]);

  // Flip Camera (Mobile)
  const handleFlipCamera = useCallback(() => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    startMedia(nextFacing);
  }, [facingMode, startMedia]);

  const members = sessionState?.members || (currentMember ? [currentMember] : []);
  const otherMembers = members.filter(m => m.id !== currentMember?.id);
  const isSpeaking = !isMuted && audioLevel > 18;

  // Minimized Bar View
  if (isMinimized) {
    return (
      <div className="fixed top-16 sm:top-14 right-4 z-40 animate-in fade-in slide-in-from-top-2">
        <div className="flex items-center gap-2 bg-zinc-950/90 border border-amber-500/50 shadow-2xl backdrop-blur-md rounded-full px-3 py-1.5 text-xs text-white">
          <div className="relative">
            <div className={`w-3 h-3 rounded-full ${isCameraOn ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-600'}`} />
            {isSpeaking && (
              <div className="absolute -inset-1 rounded-full border border-emerald-400 animate-ping opacity-75" />
            )}
          </div>
          <span className="font-bold flex items-center gap-1">
            <Video className="w-3.5 h-3.5 text-amber-400" />
            <span>Ensaio ({members.length})</span>
          </span>

          <button
            onClick={handleToggleMute}
            className={`p-1 rounded-full transition ${isMuted ? 'text-rose-400 bg-rose-500/20' : 'text-zinc-300 hover:text-white'}`}
            title={isMuted ? 'Desmutar' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleToggleCamera}
            className={`p-1 rounded-full transition ${!isCameraOn ? 'text-rose-400 bg-rose-500/20' : 'text-zinc-300 hover:text-white'}`}
            title={isCameraOn ? 'Desligar Câmera' : 'Ligar Câmera'}
          >
            {!isCameraOn ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsMinimized(false)}
            className="p-1 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
            title="Expandir Câmeras"
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-none bg-zinc-950/95 border-b border-zinc-800/90 backdrop-blur-md z-30 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-3 py-2 sm:py-2.5">
        {/* Header Bar of Video Rehearsal */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black tracking-wide uppercase">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>Ensaio Online com Câmera</span>
            </span>
            <span className="hidden sm:flex items-center gap-1 text-xs text-zinc-400 font-medium">
              <Users className="w-3.5 h-3.5 text-zinc-500" />
              <span>{members.length} {members.length === 1 ? 'músico na sala' : 'músicos na sala'}</span>
            </span>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Toggle Mic */}
            <button
              onClick={handleToggleMute}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                  : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
              }`}
              title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="hidden xs:inline">{isMuted ? 'Mutado' : 'Microfone'}</span>
            </button>

            {/* Toggle Cam */}
            <button
              onClick={handleToggleCamera}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition border ${
                !isCameraOn
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                  : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
              }`}
              title={isCameraOn ? 'Desligar Câmera' : 'Ligar Câmera'}
            >
              {!isCameraOn ? <VideoOff className="w-3.5 h-3.5 text-rose-400" /> : <Video className="w-3.5 h-3.5 text-amber-400" />}
              <span className="hidden xs:inline">{isCameraOn ? 'Câmera On' : 'Câmera Off'}</span>
            </button>

            {/* Flip Cam (Mobile) */}
            <button
              onClick={handleFlipCamera}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition"
              title="Alternar Câmera Frontal / Traseira"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Minimize / Fold */}
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 transition"
              title="Minimizar Vídeos para Ler Cifra Livremente"
            >
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
            </button>

            {/* Close Video Rehearsal */}
            <button
              onClick={() => {
                if (localStream) {
                  localStream.getTracks().forEach(t => t.stop());
                }
                toggleVideoRehearsal(false);
                if (onClose) onClose();
              }}
              className="p-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-zinc-700 hover:border-rose-500/50 transition"
              title="Encerrar Câmeras do Ensaio"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Permission warning banner if applicable */}
        {permissionError && (
          <div className="mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 flex-none text-amber-400" />
              <span className="truncate">{permissionError}</span>
            </div>
            <button
              onClick={() => startMedia(facingMode)}
              className="px-2 py-0.5 rounded-lg bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 text-[11px] flex-none"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Participant Videos & Cards Strip */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
          {/* 1. Local User Video Card */}
          <div className={`relative flex-none w-36 sm:w-44 h-24 sm:h-28 rounded-2xl overflow-hidden bg-zinc-900 border-2 transition-all shadow-md ${
            isSpeaking ? 'border-emerald-400 ring-2 ring-emerald-400/40' : 'border-zinc-800'
          }`}>
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted // Always mute local video to avoid echo
              className={`w-full h-full object-cover mirror absolute inset-0 z-0 transition-opacity duration-200 ${
                isCameraOn && !permissionError ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />

            {(!isCameraOn || permissionError) && (
              <div className="absolute inset-0 z-10 w-full h-full flex flex-col items-center justify-center bg-zinc-900/90 text-zinc-400">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-base ${currentMember?.avatarColor || 'bg-amber-500'}`}>
                  {currentMember?.name ? currentMember.name.substring(0, 2).toUpperCase() : 'EU'}
                </div>
                <span className="text-[10px] mt-1 text-zinc-500 font-semibold">
                  {permissionError ? 'Permissão negada' : 'Câmera desligada'}
                </span>
              </div>
            )}

            {/* Bottom info badge */}
            <div className="absolute inset-x-0 bottom-0 z-20 p-1.5 bg-gradient-to-t from-zinc-950/95 via-zinc-950/70 to-transparent flex items-center justify-between text-[11px]">
              <span className="font-bold text-white truncate max-w-[80px]">
                {currentMember?.name || 'Você'} (Você)
              </span>
              <div className="flex items-center gap-1">
                {isMuted ? (
                  <MicOff className="w-3 h-3 text-rose-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                )}
              </div>
            </div>

            {/* Host Badge */}
            {isHost && (
              <div className="absolute top-1.5 left-1.5 z-20 px-1.5 py-0.5 rounded bg-amber-500 text-zinc-950 font-black text-[9px] uppercase tracking-wider shadow">
                Líder
              </div>
            )}
          </div>

          {/* 2. Other Band Members Cards (With Live WebRTC Video Streams) */}
          {otherMembers.map((member) => (
            <RemoteVideoCard
              key={member.id}
              member={member}
              stream={remoteStreams[member.id]}
            />
          ))}

          {/* If no other members are in the room yet */}
          {otherMembers.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-zinc-900/60 border border-dashed border-zinc-800 text-zinc-500 text-xs flex-1 min-w-[220px] justify-center">
              <Users className="w-4 h-4 text-zinc-600" />
              <span>Aguardando outros músicos entrarem na sala com o código...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

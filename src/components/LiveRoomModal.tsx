import React, { useState } from 'react';
import { Song } from '../types';
import { useLiveRoom } from '../context/LiveRoomContext';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { AppLogo } from './AppLogo';
import {
  X,
  Radio,
  Users,
  Copy,
  Check,
  Zap,
  LogIn,
  Plus,
  LogOut,
  Sliders,
  Sparkles,
  QrCode,
  ShieldCheck,
  Music,
  Share2,
  Wifi,
  WifiOff
} from 'lucide-react';

interface LiveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequirePro?: (reason: string) => void;
  currentSong?: Song | null;
}

const INSTRUMENT_OPTIONS = [
  'Violão',
  'Teclado / Piano',
  'Vocal Principal',
  'Backing Vocal',
  'Guitarra Solo',
  'Baixo',
  'Bateria / Percussão',
  'Flauta / Sopros',
  'Regente / Coral'
];

export const LiveRoomModal: React.FC<LiveRoomModalProps> = ({
  isOpen,
  onClose,
  onRequirePro,
  currentSong
}) => {
  const {
    isInRoom,
    isHost,
    sessionState,
    currentMember,
    transportMode,
    isNetworkOnline,
    p2pPeersCount,
    createRoom,
    joinRoom,
    leaveRoom,
    toggleFollowScroll,
    sendBandAlert,
    updateMemberName,
    createP2POffer,
    acceptP2POffer,
    acceptP2PAnswer
  } = useLiveRoom();

  const { isPro } = useAuth();
  const [activeTab, setActiveTab] = useState<'status' | 'join' | 'create'>(isInRoom ? 'status' : 'join');
  const [pinInput, setPinInput] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('Ensaio da Banda');
  const [nameInput, setNameInput] = useState(currentMember?.name || 'Músico');
  const [selectedInstrument, setSelectedInstrument] = useState(currentMember?.instrument || 'Violão');
  const [customAlertInput, setCustomAlertInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [showOfflineGuide, setShowOfflineGuide] = useState(false);
  const [p2pOfferCode, setP2pOfferCode] = useState('');
  const [p2pInputToken, setP2pInputToken] = useState('');
  const [p2pFeedback, setP2pFeedback] = useState('');

  if (!isOpen) return null;

  // Generate shareable link
  const shareableUrl = typeof window !== 'undefined' && sessionState?.pin
    ? `${window.location.origin}${window.location.pathname}?room=${sessionState.pin}`
    : '';

  const handleCopyLink = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) return;
    const success = await joinRoom(pinInput, nameInput, selectedInstrument);
    if (success) {
      setActiveTab('status');
      onClose();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPro) {
      if (onRequirePro) {
        onRequirePro('A criação de Salas Ao Vivo (Líder / Host) para guiar toda a banda é exclusiva do Plano Pro.');
      }
      return;
    }
    await createRoom(roomNameInput, nameInput, selectedInstrument, currentSong);
    setActiveTab('status');
  };

  const handleSendCustomAlert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customAlertInput.trim()) return;
    sendBandAlert(customAlertInput.trim(), 'custom');
    setCustomAlertInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-none p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <AppLogo size={42} variant="circle" />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Sincronização ao Vivo
                {isInRoom && (
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    transportMode === 'p2p_local'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : transportMode === 'local_cache'
                      ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}>
                    {transportMode === 'p2p_local' ? (
                      <>
                        <Zap className="w-3 h-3 text-amber-400" /> P2P PALCO
                      </>
                    ) : transportMode === 'local_cache' ? (
                      <>
                        <ShieldCheck className="w-3 h-3 text-amber-400" /> LOCAL OFFLINE
                      </>
                    ) : (
                      <>
                        <Wifi className="w-3 h-3 text-amber-400" /> NUVEM GLOBAL
                      </>
                    )}
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-400">
                Sincronização em tempo real para ensaios e palco
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation if not in active session */}
        {!isInRoom && (
          <div className="flex border-b border-zinc-800 bg-zinc-950/30 p-1.5 gap-1.5">
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-black shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Entrar com Código PIN
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 font-black shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              Criar Nova Sala (Líder)
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {isInRoom && sessionState ? (
            /* ACTIVE ROOM STATUS VIEW */
            <div className="space-y-5">
              {/* Room Key Card & QR Code */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center gap-5">
                <div className="bg-white p-3 rounded-2xl shadow-xl flex-none">
                  <QRCodeSVG value={shareableUrl || 'http://localhost:3000'} size={120} level="M" />
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Código da Sessão Ao Vivo
                  </span>
                  <div className="text-3xl font-black text-amber-400 font-mono tracking-wider drop-shadow-[0_0_12px_rgba(245,158,11,0.4)]">
                    {sessionState.pin}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Aponte a câmera do celular para conectar instantaneamente toda a banda.
                  </p>
                  <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-700 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Link Copiado!' : 'Copiar Link da Sala'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Host vs Member Role Banner */}
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${isHost ? 'text-amber-400' : 'text-blue-400'}`} />
                  <span>
                    Seu Papel: <strong className="text-white">{isHost ? 'Líder / Mestre (Host)' : 'Músico Conectado'}</strong>
                  </span>
                </div>
                {isHost && (
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sessionState.followScroll}
                      onChange={(e) => toggleFollowScroll(e.target.checked)}
                      className="rounded border-zinc-700 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="text-zinc-300 font-medium">Guiar Rolagem (Follow Scroll)</span>
                  </label>
                )}
              </div>

              {/* Bulletproof Offline & Local Network Stage Card */}
              <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Confiabilidade Offline no Palco
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowOfflineGuide(!showOfflineGuide)}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 underline"
                  >
                    {showOfflineGuide ? 'Ocultar Dicas' : 'Como usar sem internet?'}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1">
                    {isNetworkOnline ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    )}
                    {isNetworkOnline ? 'Internet Online' : 'Sem Internet (Modo Palco)'}
                  </span>
                  <span>•</span>
                  <span>
                    {transportMode === 'p2p_local'
                      ? `Conectado via P2P Local (${p2pPeersCount} conectados)`
                      : transportMode === 'local_cache'
                      ? 'Local-First (100% no Aparelho)'
                      : 'Nuvem Global Ativa'}
                  </span>
                </div>

                {showOfflineGuide && (
                  <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 space-y-2">
                    <p className="font-bold text-amber-400">
                      ⚡ Para sincronizar a banda sem internet ou em locais sem sinal:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400">
                      <li>O líder ativa o <strong>Roteador Wi-Fi (Hotspot)</strong> do celular (não precisa de dados 4G/5G).</li>
                      <li>Os músicos conectam seus celulares/tablets no Wi-Fi gerado pelo líder.</li>
                      <li>O Cadencē sincroniza troca de tom, músicas e rolagem com latência menor que 5ms!</li>
                    </ol>
                  </div>
                )}
              </div>

              {/* Connected Musicians Roster - Design idêntico à Landing Page */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    DISPOSITIVOS CONECTADOS:
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {sessionState.members.length} {sessionState.members.length === 1 ? 'dispositivo' : 'dispositivos'}
                  </span>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {sessionState.members.map((member) => {
                    const isCurrent = member.id === currentMember?.id;
                    const isLeader = member.role === 'leader' || member.isHost;

                    return (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                          isLeader
                            ? 'bg-zinc-900/90 border-zinc-700/90 shadow-sm'
                            : 'bg-zinc-950/80 border-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Dot verde brilhante para indicar conexão ativa */}
                          <span className={`w-2.5 h-2.5 rounded-full flex-none ${isLeader ? 'bg-amber-400 shadow-sm shadow-amber-400/40 animate-pulse' : 'bg-amber-500/80'}`} />
                          
                          <div className="truncate">
                            <span className="font-bold text-white text-xs sm:text-sm tracking-tight block truncate">
                              {member.name}
                              <span className="text-zinc-400 font-normal ml-1">
                                ({isLeader ? 'Líder / ' : ''}{member.instrument || 'Músico'})
                              </span>
                              {isCurrent && (
                                <span className="ml-1.5 text-[10px] font-semibold text-amber-400/90">(Você)</span>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-none ml-2">
                          {isLeader ? (
                            <span className="text-[11px] font-black tracking-wider text-amber-400 uppercase bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                              HOST
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-zinc-400">
                              Sincronizado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Band Cue Console */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Enviar Alerta Instantâneo para a Banda
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                  <button
                    onClick={() => sendBandAlert('REPETIR REFRÃO 🔁', 'repeat-chorus')}
                    className="p-2 rounded-xl bg-zinc-950 hover:bg-amber-500/20 border border-zinc-800 hover:border-amber-500 text-xs font-bold transition text-left"
                  >
                    🔁 Refrão
                  </button>
                  <button
                    onClick={() => sendBandAlert('IR PARA A PONTE ⚡', 'bridge')}
                    className="p-2 rounded-xl bg-zinc-950 hover:bg-amber-500/20 border border-zinc-800 hover:border-amber-500 text-xs font-bold transition text-left"
                  >
                    ⚡ Ponte
                  </button>
                  <button
                    onClick={() => sendBandAlert('SOLO INSTRUMENTAL 🎸', 'solo')}
                    className="p-2 rounded-xl bg-zinc-950 hover:bg-purple-500/20 border border-zinc-800 hover:border-purple-500 text-xs font-bold transition text-left"
                  >
                    🎸 Solo
                  </button>
                  <button
                    onClick={() => sendBandAlert('FINALIZAR MÚSICA 🛑', 'outro')}
                    className="p-2 rounded-xl bg-zinc-950 hover:bg-rose-500/20 border border-zinc-800 hover:border-rose-500 text-xs font-bold transition text-left"
                  >
                    🛑 Finalizar
                  </button>
                </div>

                <form onSubmit={handleSendCustomAlert} className="flex gap-2">
                  <input
                    type="text"
                    value={customAlertInput}
                    onChange={(e) => setCustomAlertInput(e.target.value)}
                    placeholder="Mensagem rápida (ex: Solo teclado, Modulação para E...)"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition"
                  >
                    Enviar
                  </button>
                </form>
              </div>

              {/* Actions: Ir para o Palco / Sair */}
              <div className="pt-2 border-t border-zinc-800 flex items-center justify-between gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-950/40 text-xs font-bold transition shadow-lg shadow-amber-950/40"
                >
                  <Music className="w-4 h-4" />
                  Ir para o Palco
                </button>

                <button
                  onClick={leaveRoom}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Sessão
                </button>
              </div>
            </div>
          ) : activeTab === 'join' ? (
            /* JOIN ROOM FORM */
            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                  Código PIN da Sala (Ex: MTS-742)
                </label>
                <input
                  type="text"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                  placeholder="MTS-742"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-amber-400 uppercase tracking-widest placeholder-zinc-600 focus:outline-none focus:border-amber-500 text-center"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Seu Nome</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Digite seu nome"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Seu Instrumento</label>
                  <select
                    value={selectedInstrument}
                    onChange={(e) => setSelectedInstrument(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {INSTRUMENT_OPTIONS.map((inst) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-950/40 font-bold text-sm shadow-lg shadow-amber-950/30 transition flex items-center justify-center gap-2 mt-4"
              >
                <Radio className="w-4 h-4" />
                Conectar ao Ensaio
              </button>
            </form>
          ) : (
            /* CREATE ROOM FORM */
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1.5">
                  Nome do Ensaio / Evento
                </label>
                <input
                  type="text"
                  value={roomNameInput}
                  onChange={(e) => setRoomNameInput(e.target.value)}
                  placeholder="Ex: Show de Sexta / Ensaio da Banda"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Seu Nome (Líder)</label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Nome do líder ou regente"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Seu Instrumento</label>
                  <select
                    value={selectedInstrument}
                    onChange={(e) => setSelectedInstrument(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {INSTRUMENT_OPTIONS.map((inst) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black shadow-lg shadow-amber-950/40 font-bold text-sm shadow-lg shadow-amber-950/30 transition flex items-center justify-center gap-2 mt-4"
              >
                <Plus className="w-4 h-4" />
                Criar Sala e Gerar Código PIN
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

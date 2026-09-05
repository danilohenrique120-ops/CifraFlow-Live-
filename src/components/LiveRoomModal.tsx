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
  Share2
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
    createRoom,
    joinRoom,
    leaveRoom,
    toggleFollowScroll,
    sendBandAlert,
    updateMemberName
  } = useLiveRoom();

  const { isPro } = useAuth();
  const [activeTab, setActiveTab] = useState<'status' | 'join' | 'create'>(isInRoom ? 'status' : 'join');
  const [pinInput, setPinInput] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('Ensaio da Banda');
  const [nameInput, setNameInput] = useState(currentMember?.name || 'Músico');
  const [selectedInstrument, setSelectedInstrument] = useState(currentMember?.instrument || 'Violão');
  const [customAlertInput, setCustomAlertInput] = useState('');
  const [copied, setCopied] = useState(false);

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
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    CONECTADO
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
                  ? 'bg-emerald-600 text-white shadow-md'
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
                  ? 'bg-emerald-600 text-white shadow-md'
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
                  <div className="text-3xl font-black text-emerald-400 font-mono tracking-wider">
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
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Link Copiado!' : 'Copiar Link da Sala'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Host vs Member Role Banner */}
              <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${isHost ? 'text-emerald-400' : 'text-blue-400'}`} />
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
                      className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-400"
                    />
                    <span className="text-zinc-300 font-medium">Guiar Rolagem (Follow Scroll)</span>
                  </label>
                )}
              </div>

              {/* Connected Musicians Roster */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    Músicos Conectados ({sessionState.members.length})
                  </h3>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {sessionState.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/60 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full ${member.avatarColor} text-zinc-950 font-bold flex items-center justify-center text-[10px]`}>
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white block">
                            {member.name} {member.id === currentMember?.id && '(Você)'}
                          </span>
                          <span className="text-[10px] text-zinc-400">{member.instrument}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        member.role === 'leader'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {member.role === 'leader' ? 'Líder' : 'Banda'}
                      </span>
                    </div>
                  ))}
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
                    className="p-2 rounded-xl bg-zinc-950 hover:bg-emerald-500/20 border border-zinc-800 hover:border-emerald-500 text-xs font-bold transition text-left"
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
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
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
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/40"
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
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-3 text-lg font-mono font-bold text-emerald-400 uppercase tracking-widest placeholder-zinc-600 focus:outline-none focus:border-emerald-500 text-center"
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
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Seu Instrumento</label>
                  <select
                    value={selectedInstrument}
                    onChange={(e) => setSelectedInstrument(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {INSTRUMENT_OPTIONS.map((inst) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 mt-4"
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
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
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
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1.5">Seu Instrumento</label>
                  <select
                    value={selectedInstrument}
                    onChange={(e) => setSelectedInstrument(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    {INSTRUMENT_OPTIONS.map((inst) => (
                      <option key={inst} value={inst}>{inst}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 mt-4"
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

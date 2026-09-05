import React from 'react';
import { useLiveRoom } from '../context/LiveRoomContext';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './AppLogo';
import {
  Search,
  Radio,
  Music,
  Volume2,
  Menu,
  Sparkles,
  Users,
  Compass,
  User,
  Crown,
  Upload
} from 'lucide-react';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenLiveRoomModal: () => void;
  onOpenUploadModal: () => void;
  onOpenMetronome: () => void;
  onOpenTuner: () => void;
  onOpenPricing: () => void;
  onOpenProfile: () => void;
  onOpenAuth: () => void;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSearch,
  onOpenLiveRoomModal,
  onOpenUploadModal,
  onOpenMetronome,
  onOpenTuner,
  onOpenPricing,
  onOpenProfile,
  onOpenAuth,
  onToggleMobileMenu
}) => {
  const { isInRoom, sessionState } = useLiveRoom();
  const { userProfile, isPro } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex-none border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      {/* Left: Brand & Mobile Menu Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <AppLogo size={36} variant="circle" />
          <div>
            <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center">
              Cifra<span className="text-emerald-400">ê</span>
            </span>
          </div>
        </div>
      </div>

      {/* Center: Omnipresent Spotify-style Search Trigger */}
      <div className="flex-1 max-w-md hidden sm:block">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-4 py-2 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-emerald-500/60 text-zinc-400 hover:text-white transition shadow-inner text-xs sm:text-sm"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-emerald-400" />
            <span className="truncate">Buscar músicas locais ou pesquisar online...</span>
          </div>
          <kbd className="px-2 py-0.5 rounded-lg bg-zinc-800 text-[10px] font-mono text-zinc-400 border border-zinc-700">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right: Stage Tools, Plan Status & Live Band Status */}
      <div className="flex items-center gap-2">
        {/* Mobile Search Icon Button */}
        <button
          onClick={onOpenSearch}
          className="sm:hidden p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Upload Song Button */}
        <button
          onClick={onOpenUploadModal}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-emerald-400 border border-zinc-800 hover:border-emerald-500/50 text-xs font-bold transition shadow-sm"
          title="Fazer Upload de Cifra Própria"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          <span>Subir Cifra</span>
        </button>

        {/* Metronome */}
        <button
          onClick={onOpenMetronome}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
          title="Metrônomo Digital"
        >
          <Music className="w-4 h-4 text-zinc-300" />
        </button>

        {/* Pitch Pipe */}
        <button
          onClick={onOpenTuner}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
          title="Tom de Referência Vocal"
        >
          <Volume2 className="w-4 h-4 text-zinc-300" />
        </button>

        {/* Upgrade to Pro Button if not Pro */}
        {!isPro ? (
          <button
            onClick={onOpenPricing}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black shadow-lg shadow-amber-950/40 transition"
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>Seja Pro</span>
          </button>
        ) : (
          <button
            onClick={onOpenPricing}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-extrabold hover:bg-emerald-500/20 transition"
          >
            <Crown className="w-3 h-3 text-emerald-400 fill-current" />
            <span>PRO</span>
          </button>
        )}

        {/* Live Band Sync Pill Indicator */}
        {isInRoom && sessionState ? (
          <button
            onClick={onOpenLiveRoomModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition text-xs font-bold shadow-lg shadow-emerald-950/60"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono">SALA: {sessionState.pin}</span>
            <span className="hidden md:inline text-[10px] text-emerald-400/80">
              ({sessionState.members.length} online)
            </span>
          </button>
        ) : (
          <button
            onClick={onOpenLiveRoomModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-zinc-900 hover:bg-emerald-600 hover:text-white text-zinc-300 border border-zinc-800 hover:border-emerald-500 text-xs font-bold transition shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Conectar Ensaio</span>
          </button>
        )}

        {/* User Profile Avatar with Pro Indicator */}
        {userProfile ? (
          <div
            onClick={onOpenProfile}
            className={`relative w-8 h-8 rounded-full ${userProfile.avatarColor} text-zinc-950 font-black text-xs flex items-center justify-center cursor-pointer shadow-md ml-1 ring-2 ${isPro ? 'ring-emerald-400' : 'ring-zinc-800'}`}
            title={`${userProfile.displayName} (${userProfile.instrument})`}
          >
            {userProfile.displayName?.charAt(0).toUpperCase() || 'M'}
            {isPro && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center text-[8px] text-zinc-950 font-black">
                ★
              </span>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-3 py-1.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-zinc-200 border border-zinc-800 transition ml-1"
          >
            Entrar
          </button>
        )}
      </div>
    </header>
  );
};

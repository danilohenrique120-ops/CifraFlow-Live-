import React from 'react';
import { Setlist } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  ListMusic,
  Radio,
  Music,
  Volume2,
  Tv,
  Layers,
  Heart,
  Plus,
  X,
  Crown,
  User,
  Sparkles,
  Upload
} from 'lucide-react';

interface SidebarProps {
  currentView: 'discovery' | 'setlists';
  onNavigate: (view: 'discovery' | 'setlists') => void;
  setlists: Setlist[];
  onSelectSetlist: (setlist: Setlist) => void;
  onOpenLiveRoomModal: () => void;
  onOpenUploadModal: () => void;
  onOpenMetronome: () => void;
  onOpenTuner: () => void;
  onOpenPricing: () => void;
  onOpenProfile: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  setlists,
  onSelectSetlist,
  onOpenLiveRoomModal,
  onOpenUploadModal,
  onOpenMetronome,
  onOpenTuner,
  onOpenPricing,
  onOpenProfile,
  isOpenMobile,
  onCloseMobile
}) => {
  const { isPro, userProfile } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-zinc-950 border-r border-zinc-850 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand & Navigation */}
        <div className="space-y-6">
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-zinc-850">
            <span className="text-sm font-black text-white">Menu Principal</span>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => {
                onNavigate('discovery');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
                currentView === 'discovery'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Compass className="w-5 h-5" />
              Explorar Catálogo
            </button>

            <button
              onClick={() => {
                onNavigate('setlists');
                onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
                currentView === 'setlists'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <ListMusic className="w-5 h-5" />
              Repertórios / Setlists
            </button>

            <button
              onClick={() => {
                onOpenUploadModal();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 transition"
            >
              <Upload className="w-5 h-5 text-emerald-400" />
              Subir Minha Cifra
            </button>

            <button
              onClick={() => {
                onOpenLiveRoomModal();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 transition"
            >
              <Radio className="w-5 h-5 text-emerald-400" />
              Live Band Sync
            </button>
          </nav>

          {/* Pro Upgrade Banner in Sidebar */}
          {!isPro ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-900 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black text-white">Plano Pro</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug">
                Crie salas de ensaio ilimitadas e guie toda a banda ao vivo.
              </p>
              <button
                onClick={() => {
                  onOpenPricing();
                  onCloseMobile();
                }}
                className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition"
              >
                Conhecer Planos
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-black text-white block">Assinante Pro</span>
                  <span className="text-[10px] text-emerald-400">Live Sync Liberado</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Tools Section */}
          <div className="pt-4 border-t border-zinc-850 space-y-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500 px-3">
              Ferramentas de Palco
            </span>

            <div className="space-y-1">
              <button
                onClick={() => {
                  onOpenMetronome();
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                <Music className="w-4 h-4 text-amber-400" />
                Metrônomo Digital
              </button>

              <button
                onClick={() => {
                  onOpenTuner();
                  onCloseMobile();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-900 transition"
              >
                <Volume2 className="w-4 h-4 text-blue-400" />
                Tom de Referência
              </button>
            </div>
          </div>

          {/* Setlists Quick List */}
          <div className="pt-4 border-t border-zinc-850 space-y-2">
            <div className="flex items-center justify-between px-3">
              <span className="text-[10px] uppercase font-black tracking-wider text-zinc-500">
                Seus Repertórios
              </span>
              <button
                onClick={() => {
                  onNavigate('setlists');
                  onCloseMobile();
                }}
                className="text-zinc-500 hover:text-emerald-400 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 max-h-36 overflow-y-auto">
              {setlists.map((setlist) => (
                <button
                  key={setlist.id}
                  onClick={() => {
                    onSelectSetlist(setlist);
                    onNavigate('setlists');
                    onCloseMobile();
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 truncate transition block"
                >
                  <span className="truncate block font-medium">{setlist.title}</span>
                  <span className="text-[10px] text-zinc-600 block">{setlist.items.length} músicas</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom User / PWA Info */}
        <div className="pt-4 border-t border-zinc-850 space-y-2">
          {userProfile && (
            <button
              onClick={() => {
                onOpenProfile();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 transition text-left"
            >
              <div className={`w-7 h-7 rounded-xl ${userProfile.avatarColor} text-zinc-950 font-black text-xs flex items-center justify-center`}>
                {userProfile.displayName?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white truncate block">
                  {userProfile.displayName}
                </span>
                <span className="text-[10px] text-zinc-500 block truncate">{userProfile.instrument}</span>
              </div>
            </button>
          )}

          <div className="text-center text-[10px] text-zinc-600">
            <p className="font-bold text-zinc-400">CifraSync Live v2.0</p>
            <p>PWA & Live Band Sync Ready</p>
          </div>
        </div>
      </aside>
    </>
  );
};

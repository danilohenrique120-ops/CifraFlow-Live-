import React from 'react';
import { Setlist } from '../types';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './AppLogo';
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
  Upload,
  Play,
  Flame,
  Calendar
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
  activeSetlistId?: string | null;
}

const SETLIST_THEMES: Record<string, { gradient: string; iconColor: string; badge: string }> = {
  'Show / Apresentação': { gradient: 'from-purple-600 to-indigo-900', iconColor: 'text-purple-200', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  'Barzinho / Voz e Violão': { gradient: 'from-amber-500 to-orange-700', iconColor: 'text-amber-200', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  'Casamento / Cerimônia': { gradient: 'from-rose-500 to-pink-800', iconColor: 'text-rose-200', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  'Ensaio Geral': { gradient: 'from-blue-600 to-cyan-900', iconColor: 'text-blue-200', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
  'Celebração / Louvor': { gradient: 'from-emerald-500 to-teal-800', iconColor: 'text-emerald-200', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  'Festa / Evento': { gradient: 'from-yellow-500 to-amber-800', iconColor: 'text-yellow-200', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  'Geral': { gradient: 'from-zinc-700 to-zinc-900', iconColor: 'text-zinc-200', badge: 'bg-zinc-700/30 text-zinc-300 border-zinc-700' }
};

const DEFAULT_GRADIENTS = [
  'from-emerald-500 to-teal-800',
  'from-indigo-600 to-purple-900',
  'from-amber-500 to-orange-800',
  'from-blue-600 to-cyan-900',
  'from-rose-500 to-pink-900'
];

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
  onCloseMobile,
  activeSetlistId
}) => {
  const { isPro, userProfile } = useAuth();

  const getSetlistStyle = (setlist: Setlist, index: number) => {
    if (setlist.targetEvent && SETLIST_THEMES[setlist.targetEvent]) {
      return SETLIST_THEMES[setlist.targetEvent];
    }
    const gradient = DEFAULT_GRADIENTS[index % DEFAULT_GRADIENTS.length];
    return {
      gradient,
      iconColor: 'text-emerald-200',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    };
  };

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
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-zinc-950 border-r border-zinc-850 p-4 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Top: Brand & Navigation */}
        <div className="space-y-5 overflow-y-auto pr-1 scrollbar-none">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-850">
            <div className="flex items-center gap-2.5">
              <AppLogo size={32} variant="circle" />
              <span className="text-base font-black text-white flex items-center">
                Cifra<span className="text-emerald-400">ê</span>
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white"
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
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition ${
                currentView === 'setlists'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <ListMusic className="w-5 h-5" />
                <span>Repertórios</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-zinc-850 text-[10px] font-mono font-bold text-zinc-400 border border-zinc-750">
                {setlists.length}
              </span>
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
              Sincronização ao Vivo
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
                className="w-full py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-md"
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

          {/* 🎸 Quick Tools Section */}
          <div className="pt-3 border-t border-zinc-850 space-y-1.5">
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

          {/* 🎶 SEUS REPERTÓRIOS (Redesigned & Premium) */}
          <div className="pt-4 border-t border-zinc-850 space-y-2.5">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] uppercase font-black tracking-wider text-zinc-300">
                  Seus Repertórios
                </span>
                <span className="px-1.5 py-0.2 rounded-md bg-zinc-800 text-[10px] font-mono font-bold text-zinc-400">
                  {setlists.length}
                </span>
              </div>

              <button
                onClick={() => {
                  onNavigate('setlists');
                  onCloseMobile();
                }}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-300 border border-zinc-800 transition"
                title="Criar Novo Repertório"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Setlist List */}
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {setlists.map((setlist, idx) => {
                const style = getSetlistStyle(setlist, idx);
                const isSelected = activeSetlistId === setlist.id;

                return (
                  <div
                    key={setlist.id}
                    onClick={() => {
                      onSelectSetlist(setlist);
                      onNavigate('setlists');
                      onCloseMobile();
                    }}
                    className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-emerald-950/70 via-zinc-900 to-zinc-900 border-emerald-500/60 shadow-lg shadow-emerald-950/50'
                        : 'bg-zinc-900/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    {/* Visual Cover Badge */}
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white flex-none shadow-md group-hover:scale-105 transition-transform relative overflow-hidden`}>
                      <Music className={`w-4 h-4 ${style.iconColor}`} />
                      {/* Hover play icon */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                      </div>
                    </div>

                    {/* Setlist Title & Meta */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black text-white group-hover:text-emerald-400 transition truncate">
                        {setlist.title}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
                        <span className={`px-1.5 py-0.2 rounded-md font-bold uppercase text-[9px] border ${style.badge} truncate max-w-[85px]`}>
                          {setlist.targetEvent || 'Geral'}
                        </span>
                        <span className="text-zinc-500 font-mono">
                          {setlist.items.length} {setlist.items.length === 1 ? 'música' : 'músicas'}
                        </span>
                      </div>
                    </div>

                    {/* Active Pulsing Indicator */}
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-none shadow-md shadow-emerald-400" />
                    )}
                  </div>
                );
              })}

              {setlists.length === 0 && (
                <div
                  onClick={() => {
                    onNavigate('setlists');
                    onCloseMobile();
                  }}
                  className="p-3.5 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 text-center cursor-pointer transition bg-zinc-950/40"
                >
                  <p className="text-xs font-bold text-zinc-400">+ Criar Primeiro Repertório</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">Monte listas personalizadas para seus shows e ensaios</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom User / PWA Info */}
        <div className="pt-3 border-t border-zinc-850 space-y-2 flex-none">
          {userProfile && (
            <button
              onClick={() => {
                onOpenProfile();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 transition text-left border border-zinc-800/60"
            >
              <div className={`w-7 h-7 rounded-xl ${userProfile.avatarColor} text-zinc-950 font-black text-xs flex items-center justify-center shadow-sm`}>
                {userProfile.displayName?.charAt(0).toUpperCase() || 'M'}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-white truncate block">
                  {userProfile.displayName}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 block truncate">{userProfile.instrument}</span>
                  {isPro ? (
                    <span className="text-[8px] font-black uppercase px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      PRO
                    </span>
                  ) : (
                    <span className="text-[8px] font-bold text-zinc-500">
                      • Gratuito
                    </span>
                  )}
                </div>
              </div>
            </button>
          )}

          <div className="text-center text-[10px] text-zinc-600 flex flex-col items-center gap-1.5">
            <AppLogo size={22} variant="circle" />
            <p className="font-bold text-zinc-400">Cifra<span className="text-emerald-400">ê</span> v2.0</p>
            <p>PWA & Sincronização ao Vivo Ready</p>
          </div>
        </div>
      </aside>
    </>
  );
};

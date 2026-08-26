import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  User,
  ShieldCheck,
  Sparkles,
  LogOut,
  Check
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPricing: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenPricing
}) => {
  const { userProfile, isPro, signOutUser, updateUserInstrument } = useAuth();
  const [selectedInstrument, setSelectedInstrument] = useState(userProfile?.instrument || 'Violão');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen || !userProfile) return null;

  const handleSaveInstrument = async () => {
    await updateUserInstrument(selectedInstrument);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700/80 p-6 text-white shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            Perfil do Músico
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl ${userProfile.avatarColor} text-zinc-950 font-black text-xl flex items-center justify-center shadow-lg`}>
            {userProfile.displayName?.charAt(0).toUpperCase() || 'M'}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-extrabold text-white truncate">
              {userProfile.displayName || 'Músico'}
            </h4>
            <p className="text-xs text-zinc-400 truncate">{userProfile.email || 'Conta Local'}</p>
            <div className="flex items-center gap-2 mt-1">
              {isPro ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Assinante Pro
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-bold">
                  Plano Gratuito
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Plan Status & Actions */}
        <div className="p-4 rounded-2xl bg-zinc-950/50 border border-zinc-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Status da Assinatura</span>
            <span className={`text-xs font-extrabold ${isPro ? 'text-emerald-400' : 'text-zinc-400'}`}>
              {userProfile.subscription?.planName || (isPro ? 'Plano Pro Ativo' : 'Plano Gratuito')}
            </span>
          </div>

          {!isPro ? (
            <button
              onClick={() => {
                onClose();
                onOpenPricing();
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Fazer Upgrade para Pro
            </button>
          ) : (
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Acesso ilimitado ao Live Band Sync e salas ao vivo liberado.</span>
            </div>
          )}
        </div>

        {/* Instrument preference */}
        <div>
          <label className="text-xs font-bold text-zinc-300 block mb-1.5">Seu Instrumento Principal</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSaveInstrument}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold text-xs text-white transition flex items-center gap-1"
            >
              {isSaved ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2 border-t border-zinc-800 flex justify-end">
          <button
            onClick={() => {
              signOutUser();
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};

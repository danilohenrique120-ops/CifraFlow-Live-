import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { INSTRUMENT_OPTIONS } from '../types';
import {
  X,
  User,
  ShieldCheck,
  Sparkles,
  LogOut,
  Check,
  RefreshCw,
  Cloud
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
  const { userProfile, isPro, signOutUser, updateUserInstrument, verifyStripeSubscription } = useAuth();
  const [selectedInstrument, setSelectedInstrument] = useState(userProfile?.instrument || 'Violão');
  const [isSaved, setIsSaved] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<'success' | 'not_found' | 'error' | null>(null);

  if (!isOpen || !userProfile) return null;

  const handleVerifySubscription = async () => {
    setIsVerifying(true);
    setVerifyMsg(null);
    try {
      const active = await verifyStripeSubscription();
      if (active) {
        setVerifyMsg('success');
      } else {
        setVerifyMsg('not_found');
      }
    } catch (e) {
      setVerifyMsg('error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveInstrument = async () => {
    if (selectedInstrument !== 'Violão / Guitarra' && !isPro) {
      onClose();
      onOpenPricing();
      return;
    }
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
            <div className="space-y-2">
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

              <button
                type="button"
                onClick={handleVerifySubscription}
                disabled={isVerifying}
                className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[11px] font-semibold transition flex items-center justify-center gap-1.5 border border-zinc-800"
                title="Consulte o Stripe para atualizar sua assinatura"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-emerald-400' : 'text-zinc-400'}`} />
                <span>{isVerifying ? 'Consultando Stripe...' : 'Já realizou o pagamento? Sincronizar Pro'}</span>
              </button>

              {verifyMsg === 'success' && (
                <p className="text-[11px] text-emerald-400 font-bold text-center animate-in fade-in py-1">
                  🎉 Assinatura Pro confirmada e ativada com sucesso!
                </p>
              )}
              {verifyMsg === 'not_found' && (
                <p className="text-[11px] text-amber-400/90 text-center leading-tight py-1">
                  Nenhuma assinatura ativa encontrada para este e-mail ({userProfile.email}) no Stripe. Se você pagou usando outro e-mail, entre em contato com o suporte.
                </p>
              )}
              {verifyMsg === 'error' && (
                <p className="text-[11px] text-rose-400 text-center leading-tight py-1">
                  Erro ao conectar com o servidor. Tente novamente em instantes.
                </p>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Acesso ilimitado à Sincronização ao Vivo e salas ao vivo liberado.</span>
            </div>
          )}
        </div>

        {/* Cloud Sync Status across devices */}
        <div className="p-3 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-none">
            <Cloud className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Sincronização em Nuvem Ativa</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              Tudo o que você salva ou altera é sincronizado automaticamente entre seu celular, tablet e computador.
            </p>
          </div>
        </div>

        {/* Instrument preference */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-300">Seu Instrumento Principal</label>
            <span className="text-[10px] text-zinc-500 font-medium">Adapta diagramas e transposições</span>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedInstrument}
              onChange={(e) => setSelectedInstrument(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              {INSTRUMENT_OPTIONS.map((inst) => {
                const isFree = inst.id === 'guitar';
                return (
                  <option key={inst.id} value={inst.label}>
                    {inst.icon} {inst.label} {inst.isTransposing ? '(Transpositor)' : ''} {!isPro && !isFree ? '🔒 (Plano Pro)' : ''}
                  </option>
                );
              })}
            </select>

            {!isPro && selectedInstrument !== 'Violão / Guitarra' && selectedInstrument !== 'Violão' ? (
              <button
                onClick={handleSaveInstrument}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-950 flex-none whitespace-nowrap"
                title="Desbloquear instrumento no Plano Pro"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Liberar no Pro</span>
              </button>
            ) : (
              <button
                onClick={handleSaveInstrument}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition flex items-center gap-1 shadow-md shadow-emerald-950 flex-none"
              >
                {isSaved ? <Check className="w-3.5 h-3.5" /> : 'Salvar'}
              </button>
            )}
          </div>

          {selectedInstrument !== 'Violão / Guitarra' && selectedInstrument !== 'Violão' && !isPro && (
            <div
              onClick={() => {
                onClose();
                onOpenPricing();
              }}
              className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mt-2 cursor-pointer hover:bg-amber-500/20 transition flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 flex-none" />
                <span className="text-[11px] leading-tight">
                  A adaptação de cifras para <strong>{selectedInstrument}</strong> é liberada com o <strong>Plano Pro</strong>.
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-zinc-950 text-[10px] font-black uppercase flex-none">
                Ver Planos
              </span>
            </div>
          )}
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

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  LogIn,
  UserPlus,
  Mail,
  Lock,
  User,
  Sparkles,
  Music,
  ShieldCheck,
  Radio,
  ArrowRight,
  Crown
} from 'lucide-react';

import { INSTRUMENT_OPTIONS } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMandatory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, isMandatory = false }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState('Violão / Guitarra');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name, instrument);
      } else {
        await signInWithEmail(email, password);
      }
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Erro ao autenticar. Verifique seus dados.');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await signInWithGoogle();
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Erro ao entrar com Google.');
    }
  };

  const formatErrorMessage = (msg: string | null) => {
    if (!msg) return null;
    if (msg.includes('auth/email-already-in-use') || msg.includes('já possui cadastro') || msg.includes('já está cadastrado')) {
      return 'Este e-mail já está cadastrado no sistema! Por favor, clique em "Faça login" abaixo e use sua senha.';
    }
    if (msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
      return 'E-mail ou senha incorretos. Verifique os dados digitados.';
    }
    if (msg.includes('auth/user-not-found')) {
      return 'Nenhuma conta encontrada com este e-mail. Clique em "Cadastre-se gratuitamente" para criar sua conta.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'A senha escolhida é muito fraca. Utilize no mínimo 6 caracteres.';
    }
    if (msg.includes('auth/invalid-email')) {
      return 'Formato de e-mail inválido. Verifique o endereço digitado.';
    }
    if (msg.includes('auth/unauthorized-domain')) {
      return 'O domínio da Vercel precisa ser autorizado no Firebase Console. Entre digitando seu e-mail e senha!';
    }
    return msg;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in">
      <div
        className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700/80 p-6 sm:p-8 text-white shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Banner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-zinc-950 shadow-lg shadow-emerald-900/40">
              <Music className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-1.5">
                Cifraê <span className="text-emerald-400">Live</span>
              </h3>
              <p className="text-[11px] text-zinc-400">
                {isSignUp ? 'Crie sua conta para começar' : 'Acesse sua conta para entrar no app'}
              </p>
            </div>
          </div>

          {!isMandatory && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold leading-relaxed">
            {formatErrorMessage(errorMsg)}
          </div>
        )}

        {/* 1-Click Google Sign In */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3 rounded-2xl bg-white hover:bg-zinc-100 text-zinc-900 font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-3"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          Continuar com Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-zinc-800" />
          <span className="text-[10px] uppercase font-bold text-zinc-500">ou com e-mail</span>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="text-xs font-bold text-zinc-300 block mb-1">Seu Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">Seu E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-1">Sua Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-300">Instrumento Inicial</label>
                <span className="text-[10px] text-emerald-400 font-semibold">Gratuito: Violão / Guitarra</span>
              </div>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
              >
                {INSTRUMENT_OPTIONS.map((inst) => {
                  const isFree = inst.id === 'guitar';
                  return (
                    <option key={inst.id} value={inst.label} disabled={!isFree}>
                      {inst.icon} {inst.label} {isFree ? '(Liberado)' : '🔒 (Exclusivo Pro)'}
                    </option>
                  );
                })}
              </select>
              <p className="text-[10px] text-zinc-400 mt-1 leading-tight">
                💡 No Plano Gratuito, as cifras são geradas em Violão/Guitarra. Os outros instrumentos e afinações são desbloqueados no <strong>Plano Pro</strong>.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-950/50 transition flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              'Processando...'
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                Criar Minha Conta
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar na Conta
              </>
            )}
          </button>
        </form>

        {/* Toggle Login/SignUp */}
        <div className="pt-2 text-center text-xs text-zinc-400">
          {isSignUp ? (
            <span>
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="text-emerald-400 font-bold hover:underline"
              >
                Faça login
              </button>
            </span>
          ) : (
            <span>
              Não tem conta?{' '}
              <button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="text-emerald-400 font-bold hover:underline"
              >
                Cadastre-se gratuitamente
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

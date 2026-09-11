import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppLogo } from './AppLogo';
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
  Crown,
  KeyRound,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

import { INSTRUMENT_OPTIONS } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isMandatory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, isMandatory = false }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, loginAsOfflineGuest } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState('Violão / Guitarra');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetSentSuccess, setResetSentSuccess] = useState(false);

  if (!isOpen) return null;

  const isSignUp = mode === 'signup';
  const isForgot = mode === 'forgot';

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setResetSentSuccess(false);

    try {
      await resetPassword(email);
      setIsLoading(false);
      setResetSentSuccess(true);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err?.message || 'Erro ao enviar e-mail de recuperação.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isForgot) {
      return handleResetPassword(e);
    }
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
    if (msg.includes('auth/network-request-failed') || msg.includes('sem conexão') || msg.includes('offline') || msg.includes('network')) {
      return 'Você está sem conexão com a internet. Toque no botão "Modo Offline" abaixo para abrir e tocar com suas músicas salvas no aparelho.';
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
            <AppLogo size={42} variant="circle" />
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center">
                Cadencē
              </h3>
              <p className="text-[11px] text-zinc-400">
                {isForgot
                  ? 'Recupere o acesso à sua conta'
                  : isSignUp
                  ? 'Crie sua conta para começar'
                  : 'Acesse sua conta para entrar no app'}
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

        {resetSentSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-medium space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 font-black text-emerald-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-none" />
              <span>E-mail de recuperação enviado com sucesso!</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              Enviamos um link de redefinição de senha para <strong className="text-white">{email}</strong>. Verifique sua caixa de entrada e a pasta de spam.
            </p>
            <button
              type="button"
              onClick={() => {
                setResetSentSuccess(false);
                setMode('signin');
              }}
              className="mt-2 text-xs font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Voltar para a tela de Login
            </button>
          </div>
        )}

        {/* 1-Click Google Sign In (hidden in forgot mode) */}
        {!isForgot && (
          <>
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
          </>
        )}

        {/* Email/Password or Password Recovery Form */}
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
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
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
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {!isForgot && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-300">Sua Senha</label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setResetSentSuccess(false);
                      setMode('forgot');
                    }}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
            </div>
          )}

          {isForgot && (
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Digite o e-mail cadastrado na sua conta. Você receberá um link oficial com segurança para criar uma nova senha instantaneamente.
            </p>
          )}

          {isSignUp && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-300">Instrumento Inicial</label>
                <span className="text-[10px] text-amber-400 font-semibold">Gratuito: Violão / Guitarra</span>
              </div>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
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
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-zinc-950 font-black shadow-lg shadow-amber-950/40 font-black text-xs sm:text-sm uppercase tracking-wider transition flex items-center justify-center gap-2 mt-4 active:scale-95"
          >
            {isLoading ? (
              'Processando...'
            ) : isForgot ? (
              <>
                <KeyRound className="w-4 h-4" />
                Enviar Link de Recuperação
              </>
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

        {/* Acesso Offline no Palco (somente quando não estiver no modo recuperar senha) */}
        {!isForgot && (
          <div className="pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => {
                loginAsOfflineGuest();
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-2xl bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 border border-zinc-700 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Continuar no Modo Offline (Tocar no Palco)</span>
            </button>
          </div>
        )}

        {/* Toggle Login/SignUp/Forgot */}
        <div className="pt-2 text-center text-xs text-zinc-400">
          {isForgot ? (
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setResetSentSuccess(false);
                setMode('signin');
              }}
              className="text-amber-400 font-bold hover:underline inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Lembrou a senha? Voltar para o Login
            </button>
          ) : isSignUp ? (
            <span>
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('signin');
                }}
                className="text-amber-400 font-bold hover:underline"
              >
                Faça login
              </button>
            </span>
          ) : (
            <span>
              Não tem conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg(null);
                  setMode('signup');
                }}
                className="text-amber-400 font-bold hover:underline"
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

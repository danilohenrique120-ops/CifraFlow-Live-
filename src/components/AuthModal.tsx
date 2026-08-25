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
  ShieldCheck,
  Radio,
  ArrowRight,
  Crown
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INSTRUMENT_OPTIONS = [
  'Violão',
  'Teclado / Piano',
  'Vocal Principal',
  'Backing Vocal',
  'Guitarra',
  'Baixo',
  'Bateria / Percussão',
  'Regente / Coral'
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, activateDemoPro } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [instrument, setInstrument] = useState('Violão');
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
    if (msg.includes('auth/unauthorized-domain')) {
      return 'O domínio da Vercel precisa ser adicionado aos Domínios Autorizados no Firebase Console (Authentication > Settings > Authorized domains). Você também pode entrar criando uma conta com e-mail e senha abaixo!';
    }
    if (msg.includes('auth/user-not-found') || msg.includes('auth/invalid-credential')) {
      return 'E-mail ou senha não encontrados. Se for seu primeiro acesso, clique em "Cadastre-se gratuitamente" abaixo.';
    }
    return msg;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-700/80 p-6 text-white shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <LogIn className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-black">
              {isSignUp ? 'Criar Conta no CifraFlow' : 'Entrar no CifraFlow'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
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
                  placeholder="Ex: Danilo Henrique"
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
              <label className="text-xs font-bold text-zinc-300 block mb-1">Instrumento Principal</label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                {INSTRUMENT_OPTIONS.map((inst) => (
                  <option key={inst} value={inst}>{inst}</option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              'Carregando...'
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                Criar Conta Gratuita
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

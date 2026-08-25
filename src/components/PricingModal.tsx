import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Check,
  Zap,
  Radio,
  Sparkles,
  ShieldCheck,
  CreditCard,
  QrCode,
  Flame,
  Clock,
  Layers
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureReason?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  featureReason
}) => {
  const { userProfile, isPro, activateDemoPro } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (['PAROQUIA100', 'LOUVOR2026', 'PROVIP'].includes(coupon.trim().toUpperCase())) {
      setCouponApplied(true);
    } else {
      alert('Cupom inválido. Tente usar "LOUVOR2026" para testar o desconto!');
    }
  };
  const handleSubscribe = async (tier: 'pro_musician' | 'pro_band') => {
    setIsProcessing(true);

    // Call serverless checkout session if Stripe is configured, or activate demo
    try {
      if (typeof window !== 'undefined' && (window as any).StripeCheckout) {
        // Stripe integration logic
      } else {
        // Instant activation simulation for showcase & test
        setTimeout(() => {
          activateDemoPro();
          setIsProcessing(false);
          setSuccessMessage(true);
          setTimeout(() => {
            setSuccessMessage(false);
            onClose();
          }, 2000);
        }, 1000);
      }
    } catch (e) {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-none p-6 pb-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Planos e Assinaturas
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Desbloqueie o Poder Total do <span className="text-emerald-400">CifraFlow Live</span>
            </h2>
            {featureReason && (
              <p className="text-xs text-amber-400 font-semibold mt-0.5">
                🔒 {featureReason}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Success Message Banner */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-500 text-zinc-950 font-black text-center text-sm animate-bounce shadow-xl">
              🎉 Parabéns! Plano Pro ativado com sucesso. Aproveite o Live Band Sync!
            </div>
          )}

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center">
            <div className="flex items-center bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                  billingCycle === 'monthly'
                    ? 'bg-zinc-800 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                  billingCycle === 'annual'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Anual
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-zinc-950 text-[10px] font-black uppercase">
                  2 Meses Grátis
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Free Card */}
            <div className="p-5 rounded-3xl bg-zinc-950/60 border border-zinc-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Gratuito (Músico)
                </span>
                <div className="text-3xl font-black text-white">
                  R$ 0 <span className="text-xs text-zinc-500 font-normal">/para sempre</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Ideal para músicos que acompanham a banda no celular ou tablet.
                </p>

                <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Acesso ao catálogo de cifras</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Transposição de tom cromática</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Entrar em salas ao vivo (Membro)</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-500">
                    <X className="w-4 h-4 text-zinc-600 flex-none" />
                    <span>Criar salas de ensaio (Líder)</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-500">
                    <X className="w-4 h-4 text-zinc-600 flex-none" />
                    <span>Repertórios na nuvem</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  disabled
                  className="w-full py-2.5 rounded-xl bg-zinc-800 text-zinc-400 font-bold text-xs cursor-default"
                >
                  Plano Atual Padrão
                </button>
              </div>
            </div>

            {/* 2. Pro Musician Card */}
            <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-700/80 flex flex-col justify-between space-y-4 relative">
              <div className="space-y-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                  Pro Músico Solo
                </span>
                <div className="text-3xl font-black text-white">
                  {billingCycle === 'annual' ? (
                    <>
                      R$ 14,90 <span className="text-xs text-zinc-500 font-normal">/mês (R$ 149/ano)</span>
                    </>
                  ) : (
                    <>
                      R$ 19,90 <span className="text-xs text-zinc-500 font-normal">/mês</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  Para o músico que toca sozinho e gerencia suas próprias apresentações.
                </p>

                <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Tudo do Plano Gratuito</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Repertórios e Setlists Ilimitados</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Dicionário completo com áudio</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Metrônomo e Tom de Referência</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-500">
                    <X className="w-4 h-4 text-zinc-600 flex-none" />
                    <span>Live Band Sync (Criar Salas)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleSubscribe('pro_musician')}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs transition"
                >
                  Assinar Músico Solo
                </button>
              </div>
            </div>

            {/* 3. Pro Band Card (MAIS POPULAR) */}
            <div className="p-5 rounded-3xl bg-gradient-to-b from-emerald-950/60 via-zinc-900 to-zinc-950 border-2 border-emerald-500 flex flex-col justify-between space-y-4 relative shadow-2xl">
              <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-emerald-500 text-zinc-950 font-black text-[10px] uppercase tracking-wider shadow-lg">
                👑 Mais Escolhido
              </div>

              <div className="space-y-3">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                  Plano Pro
                </span>
                <div className="text-3xl font-black text-white">
                  {billingCycle === 'annual' ? (
                    <>
                      R$ 19,90 <span className="text-xs text-zinc-400 font-normal">/mês (R$ 199/ano)</span>
                    </>
                  ) : (
                    <>
                      R$ 24,90 <span className="text-xs text-zinc-400 font-normal">/mês</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-zinc-300">
                  Para líderes, regentes e bandas conduzirem ensaios e apresentações conectados.
                </p>

                <ul className="space-y-2 text-xs text-zinc-200 pt-2 border-t border-zinc-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <strong className="text-white">Criar Salas Ao Vivo (PIN e QR Code)</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <strong className="text-white">Até 25 músicos conectados ao mesmo tempo</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Transposição global síncrona</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Follow Scroll mestre para toda a banda</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Comandos e Alertas de Palco Instantâneos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Backup automático dos repertórios na nuvem</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={() => handleSubscribe('pro_band')}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  {isProcessing ? 'Processando...' : 'Ativar Plano Pro'}
                </button>
              </div>
            </div>
          </div>

          {/* Coupon Input */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Possui cupom de desconto ou parceria paroquial?</span>
            </div>

            <form onSubmit={handleApplyCoupon} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Ex: LOUVOR2026"
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold text-white transition"
              >
                Aplicar
              </button>
            </form>
          </div>

          {couponApplied && (
            <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold text-center">
              ✅ Cupom LOUVOR2026 aplicado! 20% de desconto adicional na primeira anuidade.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

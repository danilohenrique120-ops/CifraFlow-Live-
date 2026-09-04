import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  Radio,
  Music,
  Shield,
  CreditCard,
  Flame,
  ArrowRight,
  UserCheck,
  Layers,
  Upload
} from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth?: () => void;
  featureReason?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  onOpenAuth,
  featureReason
}) => {
  const { userProfile, isPro } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (['SHOW2026', 'BANDA2026', 'PROVIP'].includes(coupon.trim().toUpperCase())) {
      setCouponApplied(true);
      setErrorMessage(null);
    } else {
      alert('Cupom inválido. Tente usar "SHOW2026" para testar o desconto!');
    }
  };

  const handleSubscribe = async () => {
    setErrorMessage(null);

    // If user is not logged in, prompt them to login/register first so subscription is attached to their account
    if (!userProfile) {
      onClose();
      if (onOpenAuth) {
        onOpenAuth();
      }
      return;
    }

    setIsProcessing(true);

    const STRIPE_PRICES = {
      monthly: 'price_1U9q744Ms9CHJegrDCcskGlP',
      annual: 'price_1U9q8i4Ms9CHJegrgGtIK2Oa'
    };

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userProfile.uid,
          userEmail: userProfile.email,
          tier: 'pro_band',
          billingCycle,
          priceId: billingCycle === 'annual' ? STRIPE_PRICES.annual : STRIPE_PRICES.monthly,
          returnUrl: window.location.origin
        })
      });

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error('Não foi possível processar a resposta do servidor de checkout.');
      }

      if (data.url) {
        // Redirect to official Stripe Hosted Checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erro ao gerar o link de pagamento do Stripe.');
      }
    } catch (error: any) {
      console.error('Stripe redirect error:', error);
      setErrorMessage(
        error.message || 'Não foi possível conectar ao checkout do Stripe no momento. Tente novamente.'
      );
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
              Desbloqueie o Poder Total do Cifra<span className="text-emerald-400">ê</span>
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
          {/* Error Banner if any */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center">
            <div className="flex items-center bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs font-extrabold transition ${
                  billingCycle === 'monthly'
                    ? 'bg-zinc-800 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-emerald-500 text-zinc-950 shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Anual</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-400 text-zinc-950 text-[10px] font-black uppercase">
                  Economize R$ 101,80
                </span>
              </button>
            </div>
          </div>

          {/* 2-Card Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* 1. Free Card */}
            <div className="p-6 rounded-3xl bg-zinc-950/60 border border-zinc-800 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                    Gratuito (Músico)
                  </span>
                  <div className="text-3xl font-black text-white mt-1">
                    R$ 0 <span className="text-xs text-zinc-500 font-normal">/para sempre</span>
                  </div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Ideal para músicos que acompanham ensaios e apresentações no celular ou tablet.
                </p>

                <ul className="space-y-2.5 text-xs text-zinc-300 pt-3 border-t border-zinc-800/80">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Acesso a todo o catálogo de cifras</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Transposição de tom cromática</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Rolagem automática no palco</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Entrar em salas ao vivo (Membro)</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Até 3 repertórios salvos</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-zinc-500">
                    <X className="w-4 h-4 text-zinc-600 flex-none" />
                    <span>Criar salas de ensaio (Líder)</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-zinc-500">
                    <X className="w-4 h-4 text-zinc-600 flex-none" />
                    <span>Transposição global síncrona</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-zinc-500">
                    <X className="w-4 h-4 text-zinc-600 flex-none" />
                    <span>Upload de cifras particulares</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-zinc-500">
                    <X className="w-4 h-4 text-zinc-600 flex-none" />
                    <span>Criar versões próprias de cifras</span>
                  </li>
                  <li className="flex items-center gap-2.5 text-zinc-500">
                    <X className="w-4 h-4 text-zinc-600 flex-none" />
                    <span>Exportar repertório em PDF para impressão</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-zinc-850 text-zinc-400 font-bold text-xs cursor-default border border-zinc-800"
                >
                  Plano Padrão Gratuito
                </button>
              </div>
            </div>

            {/* 2. Pro Card (MAIS ESCOLHIDO) */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-emerald-950/70 via-zinc-900 to-zinc-950 border-2 border-emerald-500 flex flex-col justify-between space-y-5 relative shadow-2xl">
              <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-emerald-500 text-zinc-950 font-black text-[10px] uppercase tracking-wider shadow-lg">
                👑 Mais Escolhido
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                    Plano Pro (Palco Conectado)
                  </span>
                  <div className="text-3xl font-black text-white mt-1">
                    {billingCycle === 'annual' ? (
                      <>
                        R$ 197 <span className="text-xs text-zinc-400 font-normal">/ano (R$ 16,41/mês)</span>
                      </>
                    ) : (
                      <>
                        R$ 24,90 <span className="text-xs text-zinc-400 font-normal">/mês</span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  Para líderes, regentes e músicos conduzirem ensaios e apresentações sincronizados.
                </p>

                <ul className="space-y-2.5 text-xs text-zinc-200 pt-3 border-t border-zinc-800">
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <strong className="text-white">Criar Salas Ao Vivo (PIN e QR Code)</strong>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <strong className="text-white">Até 25 músicos conectados simultaneamente</strong>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Transposição global síncrona para toda a banda</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Follow Scroll mestre para toda a banda</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Comandos e Alertas de Palco Instantâneos</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Repertórios e Setlists Ilimitados na nuvem</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Personalização dos 10 blocos e gêneros do show</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Upload de cifras próprias em PDF/TXT</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <strong className="text-white">Criar Minhas Versões (Editar acordes, letras e arranjos)</strong>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <strong className="text-white">Adaptação de Cifras & Diagramas por Instrumento (Teclado, Ukulele, Cavaco, Sax Eb, Trompete Bb)</strong>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <strong className="text-white">Exportação de Repertórios em PDF e Impressão de Palco A4</strong>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-none" />
                    <span>Metrônomo inteligente e Tom de Referência</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSubscribe}
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-xl shadow-emerald-900/40 transition flex items-center justify-center gap-2 transform active:scale-95"
                >
                  <CreditCard className="w-4 h-4" />
                  {isProcessing ? 'Abrindo Checkout Seguro...' : 'Ir para o Pagamento (Stripe)'}
                </button>
              </div>
            </div>
          </div>

          {/* Coupon Input */}
          <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Possui cupom de desconto ou código promocional?</span>
            </div>

            <form onSubmit={handleApplyCoupon} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={coupon}
                onChange={(e) => setCoupon(e.target.value)}
                placeholder="Ex: SHOW2026"
                className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white uppercase placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold text-white transition"
              >
                Aplicar
              </button>
            </form>
          </div>

          {couponApplied && (
            <div className="max-w-3xl mx-auto p-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold text-center">
              ✅ Cupom SHOW2026 aplicado! 20% de desconto adicional na primeira anuidade.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { AppLogo } from './AppLogo';
import {
  Crown,
  Play,
  Pause,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  QrCode,
  Radio,
  Sliders,
  Check,
  Music,
  ChevronDown,
  Volume2,
  Lock,
  Layers,
  CheckCircle2,
  Footprints,
  RotateCcw
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenPricing: (reason?: string) => void;
  onOpenAuth: () => void;
}

// Chords list for the interactive simulator
const INITIAL_DEMO_LINES = [
  { chords: ['G', 'D/F#', 'Em7', 'C9'], lyric: 'O palco é seu. O fluxo também. Sinta a batida inicial.' },
  { chords: ['G', 'D', 'C9', 'G/B'], lyric: 'Toda a banda na mesma respiração, no mesmo compasso.' },
  { chords: ['Em7', 'Bm7', 'C9', 'D4'], lyric: 'Sem pastas amassadas, sem folhas voando no vento.' },
  { chords: ['G', 'B7', 'Em7', 'C9'], lyric: 'O líder altera o tom e todas as telas mudam no mesmo instante.' },
  { chords: ['Am7', 'D', 'G', 'D/F#'], lyric: 'Harmonia límpida no breu do palco com True OLED Dark.' },
  { chords: ['Em7', 'C9', 'G', 'D'], lyric: 'A música nunca para. Precisão métrica de estúdio.' }
];

const SEMITONES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function transposeChord(chord: string, semitones: number): string {
  if (!chord || semitones === 0) return chord;
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  const root = match[1];
  const suffix = match[2];
  let normalized = root;
  if (normalized === 'Db') normalized = 'C#';
  if (normalized === 'Eb') normalized = 'D#';
  if (normalized === 'Gb') normalized = 'F#';
  if (normalized === 'Ab') normalized = 'G#';
  if (normalized === 'Bb') normalized = 'A#';
  
  const idx = SEMITONES.indexOf(normalized);
  if (idx === -1) return chord;
  let newIdx = (idx + semitones) % 12;
  if (newIdx < 0) newIdx += 12;
  return SEMITONES[newIdx] + suffix;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenPricing,
  onOpenAuth
}) => {
  // Simulator state
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(72);
  const [transposeOffset, setTransposeOffset] = useState(0);
  const [activeLineIdx, setActiveLineIdx] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

  // Simulator Play / Autoscroll engine
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      // Step active line according to BPM
      const stepMs = Math.max(1400, (60 / bpm) * 4 * 1000);
      interval = setInterval(() => {
        setActiveLineIdx((prev) => {
          const next = (prev + 1) % INITIAL_DEMO_LINES.length;
          // Smooth scroll container to match active line
          if (scrollContainerRef.current) {
            const lineEl = scrollContainerRef.current.children[next] as HTMLElement;
            if (lineEl) {
              lineEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
          return next;
        });
      }, stepMs);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, bpm]);

  const handleTranspose = (delta: number) => {
    setTransposeOffset((prev) => {
      const next = prev + delta;
      return ((next + 12) % 12) - (next < 0 ? 12 : 0);
    });
  };

  const faqs = [
    {
      q: 'Os outros músicos da minha banda precisam assinar o Plano Pro?',
      a: 'Não! Apenas o líder da banda ou regente precisa do Plano Pro para criar a sala ao vivo. Todos os outros músicos, vocalistas e instrumentistas podem entrar na sala pelo celular ou tablet usando o acesso 100% gratuito!'
    },
    {
      q: 'Preciso baixar ou instalar algum aplicativo na Play Store ou App Store?',
      a: 'Não é obrigatório! O Cadencē roda instantaneamente no navegador em qualquer aparelho (Android, iPhone, iPad, Mac ou PC). Você também pode instalar como PWA com um clique na tela inicial, ocupando zero espaço.'
    },
    {
      q: 'O Cadencē continua funcionando se o Wi-Fi da casa de shows cair?',
      a: 'Sim, com 100% de estabilidade. O Cadencē foi construído sob a arquitetura Local-First. Todas as suas cifras e repertórios permanecem armazenados na memória local do seu aparelho, sem travar nem recarregar.'
    },
    {
      q: 'Posso usar pedais Bluetooth para virar páginas ou rolar?',
      a: 'Com certeza! O Cadencē possui suporte nativo a comandos de pedais Bluetooth padrão (PageDown, Up/Down, Space e atalhos MIDI) para você ter as mãos livres durante todo o show.'
    },
    {
      q: 'Qual é a garantia caso eu assine o Plano Pro?',
      a: 'Garantia Incondicional de 7 dias com devolução total do valor pago caso não se adapte. Sem perguntas e com processamento de segurança bancária via Stripe.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F7] selection:bg-amber-500 selection:text-black flex flex-col font-sans overflow-x-hidden antialiased">
      
      {/* 🧭 Cupertino Floating Translucent Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050505]/80 backdrop-blur-2xl px-4 sm:px-8 py-3.5 flex items-center justify-between transition-all">
        <div className="flex items-center gap-3">
          <AppLogo size={36} variant="squircle" showText={true} />
        </div>

        {/* Center Nav Anchors (Desktop) */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-zinc-400">
          <a href="#palco" className="hover:text-white transition">O Palco</a>
          <a href="#fluxo" className="hover:text-amber-400 transition">Sinta o Fluxo</a>
          <a href="#tecnologia" className="hover:text-white transition">Engenharia</a>
          <a href="#contraste" className="hover:text-white transition">Caos vs Ordem</a>
          <a href="#planos" className="hover:text-white transition">Planos</a>
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            Entrar
          </button>
          <button
            onClick={onEnterApp}
            className="px-5 py-2 rounded-full bg-[#F5F5F7] hover:bg-white text-[#050505] text-xs font-bold shadow-lg shadow-white/5 transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Entrar no Palco</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 🚀 Hero Section (Menos explicação, mais arrepio) */}
      <section id="palco" className="relative pt-16 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center overflow-hidden">
        {/* Warm Stage Spotlight Glowing Background */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[350px] sm:w-[700px] h-[350px] bg-gradient-to-b from-amber-500/20 via-amber-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        {/* Eyebrow Badge */}
        <div className="relative inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-amber-300 text-xs font-semibold mb-6 tracking-wide backdrop-blur-md">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <span>Para Músicos ao Vivo & Bandas de Palco</span>
        </div>

        {/* Apple-grade Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-[#F5F5F7] tracking-tighter leading-[1.05] max-w-5xl">
          O palco é seu. <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
            O fluxo também.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mt-6 text-base sm:text-xl text-zinc-400 max-w-2xl font-normal leading-relaxed">
          Cifras sincronizadas em tempo real. Rolagem inteligente. Criado para a escuridão e a adrenalina do ao vivo.
        </p>

        {/* Action Buttons (Pill shape) */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md justify-center">
          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-[#F5F5F7] hover:bg-white text-[#050505] font-black text-sm sm:text-base shadow-2xl shadow-amber-500/10 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Experimente no Próximo Ensaio</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href="#fluxo"
            className="w-full sm:w-auto px-6 py-4 rounded-full bg-white/[0.05] hover:bg-white/[0.09] text-zinc-300 hover:text-white font-semibold text-sm border border-white/10 transition flex items-center justify-center gap-2 backdrop-blur-md"
          >
            <Play className="w-4 h-4 text-amber-400 fill-current" />
            <span>Assistir ao Fluxo</span>
          </a>
        </div>

        {/* 📱 3D Stage Mockup Visual (Tablet na estante com iluminação de palco) */}
        <div className="mt-14 w-full max-w-5xl relative">
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_90px_rgba(245,158,11,0.18)] bg-[#050505]">
            <img
              src="/cadence-hero-stage.png"
              alt="Cadencē Stage View no iPad"
              className="w-full h-auto object-cover select-none pointer-events-none"
              loading="eager"
            />
          </div>
          <p className="mt-4 text-xs text-zinc-500 tracking-wide font-mono">
            Cadencē Stage Viewer em iPad Pro • Suporte nativo em tablet, celular ou monitor de palco
          </p>
        </div>
      </section>

      {/* 🎛️ SHOW, DON'T TELL: SIMULADOR INTERATIVO AO VIVO */}
      <section id="fluxo" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center space-y-3 mb-10">
          <span className="text-[11px] uppercase tracking-widest font-black text-amber-400/90 font-mono">
            Show, Don't Tell
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Sinta o fluxo antes de pisar no palco.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Experimente a rolagem contínua e a transposição em tempo real direto nesta página. Sem formulários, sem cadastro.
          </p>
        </div>

        {/* Precision Audio Gear Simulator Box */}
        <div className="rounded-3xl bg-[#0A0A0C] border border-white/10 p-4 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Ambient Filament Glow */}
          <div className="absolute -top-16 -right-16 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Floating Control Deck */}
          <div className="p-4 rounded-2xl bg-[#050505]/90 border border-white/10 mb-6 flex flex-wrap items-center justify-between gap-4">
            {/* Play/Pause Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-5 py-2.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition active:scale-95"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pausar Rolagem' : 'Iniciar Rolagem'}</span>
            </button>

            {/* BPM Slider */}
            <div className="flex items-center gap-3 bg-white/[0.04] px-4 py-2 rounded-xl border border-white/5">
              <span className="text-xs font-mono font-bold text-zinc-400">ANDAMENTO:</span>
              <span className="text-xs font-mono font-black text-amber-400 w-12">{bpm} BPM</span>
              <input
                type="range"
                min="40"
                max="160"
                value={bpm}
                onChange={(e) => setBpm(Number(e.target.value))}
                className="w-24 sm:w-32 accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Transpose Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-zinc-400 mr-1">TOM:</span>
              <button
                onClick={() => handleTranspose(-1)}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white font-mono font-bold text-xs border border-white/10 transition active:scale-90"
                title="Descer meio-tom"
              >
                -1
              </button>
              <span className="px-2.5 py-1 rounded bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono font-black text-xs">
                {transposeOffset >= 0 ? `+${transposeOffset}` : transposeOffset}
              </span>
              <button
                onClick={() => handleTranspose(1)}
                className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-white font-mono font-bold text-xs border border-white/10 transition active:scale-90"
                title="Subir meio-tom"
              >
                +1
              </button>
            </div>
          </div>

          {/* Interactive Chord Stream Display */}
          <div
            ref={scrollContainerRef}
            className="space-y-4 max-h-72 overflow-y-auto pr-2 scroll-smooth py-2"
          >
            {INITIAL_DEMO_LINES.map((line, idx) => {
              const isActive = idx === activeLineIdx;
              return (
                <div
                  key={idx}
                  className={`p-3.5 sm:p-4 rounded-2xl transition-all duration-500 ${
                    isActive
                      ? 'bg-white/[0.08] border border-amber-400/40 shadow-[0_0_24px_rgba(245,158,11,0.12)] opacity-100 scale-[1.01]'
                      : 'opacity-40 border border-transparent hover:opacity-60'
                  }`}
                >
                  {/* Chords Row */}
                  <div className="flex items-center gap-4 sm:gap-8 font-mono text-sm sm:text-base font-black text-amber-400">
                    {line.chords.map((chord, cIdx) => (
                      <span key={cIdx} className="tracking-wider">
                        {transposeChord(chord, transposeOffset)}
                      </span>
                    ))}
                  </div>

                  {/* Lyric Row */}
                  <p className="mt-1 text-xs sm:text-sm text-zinc-300 font-medium">
                    {line.lyric}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Micro-callout */}
          <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 font-mono">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Rolagem contínua por física orgânica sem saltos
            </span>
            <button
              onClick={onEnterApp}
              className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
            >
              Testar com suas próprias cifras &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* 🍱 BENTO GRID: ENGENHARIA & RECURSOS DE CUPERTINO */}
      <section id="tecnologia" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <span className="text-[11px] uppercase tracking-widest font-black text-zinc-500 font-mono">
            Arquitetura de Precisão
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Engenharia pensada para o estresse do palco.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Sem gadgets desnecessários. Cada pixel e milissegundo foi projetado para responder no momento em que você mais precisa.
          </p>
        </div>

        {/* Asymmetric Glass Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* 1. Bento Card Grande: Sincronia Instantânea de Palco (Span 2 colunas) */}
          <div className="md:col-span-2 rounded-3xl bg-[#0A0A0C] border border-white/5 p-8 relative overflow-hidden flex flex-col justify-between hover:border-amber-500/20 transition group">
            <div className="space-y-3 z-10">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Um comando. Toda a banda no mesmo compasso.
              </h3>
              <p className="text-sm text-zinc-400 max-w-lg leading-relaxed">
                Quando o regente ou líder altera o tom ou muda para a próxima música, a tela de cada músico da banda muda simultaneamente em menos de 15 milissegundos. Sem gritar no microfone e sem olhares perdidos.
              </p>
            </div>

            {/* Visual Minimalista dos 2 Dispositivos Sincronizados */}
            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 w-full p-4 rounded-2xl bg-[#050505] border border-white/10 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-400">LÍDER • IPAD</span>
                  <p className="text-xs font-bold text-white">Porque Ele Vive (Tom: G)</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              </div>

              <div className="text-zinc-600 font-mono text-xs hidden sm:block">&lt; 12ms &gt;</div>

              <div className="flex-1 w-full p-4 rounded-2xl bg-[#050505] border border-white/10 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-400">TECLADO • CELULAR</span>
                  <p className="text-xs font-bold text-white">Sincronizado em G</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
            </div>
          </div>

          {/* 2. Bento Card Médio: True OLED Dark Mode */}
          <div className="rounded-3xl bg-[#0A0A0C] border border-white/5 p-8 relative overflow-hidden flex flex-col justify-between hover:border-amber-500/20 transition group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-300">
                <Radio className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Feito para o breu do palco.
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Fundo preto absoluto (#050505) que desaparece na escuridão, eliminando reflexos incômodos na plateia e preservando a visão noturna do músico.
              </p>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-[#050505] border border-white/10">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Contraste</span>
                <span className="text-amber-400 font-bold">&infin; : 1 OLED</span>
              </div>
            </div>
          </div>

          {/* 3. Bento Card Médio: Confiabilidade Offline-First */}
          <div className="rounded-3xl bg-[#0A0A0C] border border-white/5 p-8 relative overflow-hidden flex flex-col justify-between hover:border-amber-500/20 transition group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Sem internet? Sem pânico.
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Armazenamento Local-First inegociável. Mesmo se a rede do templo ou casa de shows cair no primeiro acorde, todo o repertório continua na tela.
              </p>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-[#050505] border border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Conexão</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">100% Offline Safe</span>
            </div>
          </div>

          {/* 4. Bento Card Compacto: Mãos Livres (Pedal Bluetooth) */}
          <div className="rounded-3xl bg-[#0A0A0C] border border-white/5 p-8 relative overflow-hidden flex flex-col justify-between hover:border-amber-500/20 transition group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Footprints className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Mãos no instrumento.
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Controle a rolagem e mude músicas com pedais de pé Bluetooth ou atalhos de teclado sem soltar sua palheta.
              </p>
            </div>

            <div className="mt-6 text-xs font-mono text-zinc-500">
              PageDown • Space • MIDI Support
            </div>
          </div>

          {/* 5. Bento Card Compacto: Conexão por QR Code */}
          <div className="rounded-3xl bg-[#0A0A0C] border border-white/5 p-8 relative overflow-hidden flex flex-col justify-between hover:border-amber-500/20 transition group">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-zinc-300">
                <QrCode className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Zero fricção de setup.
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Aponte a câmera do celular para o QR Code de palco ou digite o PIN de 3 números para conectar os integrantes em segundos.
              </p>
            </div>

            <div className="mt-6 text-xs font-mono text-amber-400 font-bold">
              PIN Amigável: REP-XXX
            </div>
          </div>

        </div>
      </section>

      {/* ⚖️ O CONTRASTE: O CAOS VS. A ORDEM */}
      <section id="contraste" className="py-20 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-3 mb-14">
          <span className="text-[11px] uppercase tracking-widest font-black text-zinc-500 font-mono">
            A Transição
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            O passado arcaico versus a serenidade do palco.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* O Passado */}
          <div className="rounded-3xl bg-zinc-950 border border-rose-500/20 p-8 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold border border-rose-500/20">
              O Passado
            </div>
            <h3 className="text-2xl font-black text-zinc-300">
              O Caos Tradicional de Palco
            </h3>
            <ul className="space-y-4 text-sm text-zinc-400 leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-rose-400 font-bold mt-0.5">&times;</span>
                Pastas pretas pesadas com folhas de sulfite rasgadas ou amassadas.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-400 font-bold mt-0.5">&times;</span>
                Telas de celular bloqueando no meio da estrofe porque o visor apagou.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-400 font-bold mt-0.5">&times;</span>
                Vocalista improvisa uma modulação de tom e a banda entra em choque.
              </li>
              <li className="flex items-start gap-3">
                <span className="text-rose-400 font-bold mt-0.5">&times;</span>
                Gritaria e sinais confusos entre os músicos durante a passagem de som.
              </li>
            </ul>
          </div>

          {/* O Cadencē */}
          <div className="rounded-3xl bg-[#0A0A0C] border border-amber-400/30 p-8 space-y-6 shadow-2xl shadow-amber-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 text-xs font-bold border border-amber-400/30">
              Com o Cadencē
            </div>
            <h3 className="text-2xl font-black text-white">
              Precisão Métrica & Foco Puro
            </h3>
            <ul className="space-y-4 text-sm text-zinc-300 leading-relaxed">
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-amber-400 flex-none mt-1" />
                Um toque no tablet do líder muda a música e o tom na tela de todos.
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-amber-400 flex-none mt-1" />
                Rolagem contínua no andamento certo sem precisar soltar o instrumento.
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-amber-400 flex-none mt-1" />
                Transposição instantânea calculada matematicamente para cada acorde.
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-4 h-4 text-amber-400 flex-none mt-1" />
                Palco limpo, silencioso, profissional e livre de papéis.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* 👑 PLANOS & PREÇOS */}
      <section id="planos" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center space-y-3 mb-12">
          <span className="text-[11px] uppercase tracking-widest font-black text-amber-400 font-mono">
            Investimento
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Um plano simples para transformar o som da sua banda.
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Apenas o líder assina o Plano Pro. Todos os outros integrantes da banda usam 100% grátis.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto rounded-3xl bg-[#0A0A0C] border border-amber-400/40 p-8 space-y-6 shadow-2xl relative">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-black uppercase tracking-wider">
              Plano Pro Band
            </span>
            <span className="text-xs text-zinc-400">Apenas R$ 0,65 por dia</span>
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">R$ 19,90</span>
              <span className="text-sm text-zinc-400">/ mês</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1">Cobrança anual simplificada • Cancele quando quiser</p>
          </div>

          <ul className="space-y-3 text-xs text-zinc-300 border-t border-b border-white/5 py-5">
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-amber-400 flex-none" />
              Salas ao vivo ilimitadas para até 25 músicos conectados
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-amber-400 flex-none" />
              Repertórios e setlists ilimitados sincronizados na nuvem
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-amber-400 flex-none" />
              Compartilhamento por link direto, QR Code e PIN
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-amber-400 flex-none" />
              Transposição para Sax, Trompete, Teclado e Afinações
            </li>
            <li className="flex items-center gap-2.5">
              <Check className="w-4 h-4 text-amber-400 flex-none" />
              Garantia incondicional de 7 dias com estorno de 100%
            </li>
          </ul>

          <button
            onClick={() => onOpenPricing('Desbloqueie agora o Cadencē Pro com salas ilimitadas para sua banda!')}
            className="w-full py-4 rounded-full bg-[#F5F5F7] hover:bg-white text-[#050505] font-black text-sm shadow-xl shadow-amber-500/10 transition flex items-center justify-center gap-2 active:scale-95"
          >
            <Crown className="w-4 h-4 fill-current" />
            <span>Garantir Acesso Pro Agora</span>
          </button>
        </div>
      </section>

      {/* ❓ DÚVIDAS FREQUENTES (FAQ) */}
      <section className="py-16 px-4 sm:px-8 max-w-3xl mx-auto w-full">
        <h3 className="text-2xl font-black text-white text-center mb-8">Perguntas Frequentes</h3>
        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-[#0A0A0C] border border-white/5 overflow-hidden transition"
            >
              <button
                onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4"
              >
                <span className="text-sm font-bold text-white">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${
                    openFaqIndex === idx ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>
              {openFaqIndex === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 🏁 FOOTER & CALL TO ACTION FINAL */}
      <footer className="mt-auto border-t border-white/10 bg-[#050505] pt-16 pb-12 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <AppLogo size={44} variant="squircle" showText={true} className="justify-center" />
          
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Chega de improvisos no escuro. <br />
            <span className="text-amber-400">Leve precisão para o seu som.</span>
          </h2>

          <div className="pt-2">
            <button
              onClick={onEnterApp}
              className="px-9 py-4 rounded-full bg-[#F5F5F7] hover:bg-white text-[#050505] font-black text-sm sm:text-base shadow-2xl transition active:scale-95 inline-flex items-center gap-2"
            >
              <span>Começar Agora — É Gratuito para Ensaios</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
            <span>&copy; {new Date().getFullYear()} Cadencē • Projetado para quem vive de música.</span>
            <span>O palco é seu. O fluxo também.</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

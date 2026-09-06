import React, { useState } from 'react';
import { AppLogo } from './AppLogo';
import {
  Crown,
  Sparkles,
  Radio,
  Tv,
  Check,
  Zap,
  Music,
  Sliders,
  ShieldCheck,
  ArrowRight,
  Play,
  FileText,
  Star,
  Users,
  ChevronDown,
  Layers,
  Clock,
  Volume2,
  Lock,
  Flame,
  HelpCircle,
  Eye,
  CheckCircle2,
  Smartphone,
  Laptop
} from 'lucide-react';

interface LandingPageProps {
  onEnterApp: () => void;
  onOpenPricing: (reason?: string) => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onOpenPricing,
  onOpenAuth
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

  const faqs = [
    {
      q: 'Os outros músicos da minha banda precisam assinar o Plano Pro também?',
      a: 'Não! Esse é um dos maiores diferenciais do Cifraê: apenas o líder da banda ou regente precisa do Plano Pro para criar a sala ao vivo. Todos os outros integrantes da banda, vocalistas e instrumentistas podem entrar na sala pelo celular ou tablet usando o acesso 100% gratuito!'
    },
    {
      q: 'Preciso baixar ou instalar algum aplicativo na Play Store ou App Store?',
      a: 'Não é obrigatório! O Cifraê funciona instantaneamente pelo navegador em qualquer aparelho (celular Android, iPhone, iPad, tablet, notebook ou monitor de palco). Você também pode instalar como PWA com um clique na tela inicial do seu celular, ocupando quase nada de memória.'
    },
    {
      q: 'Posso cadastrar minhas próprias cifras e arranjos exclusivos?',
      a: 'Com certeza! No Cifraê você pode subir suas cifras particulares em formato texto ou PDF, personalizar acordes, alterar notas litúrgicas e salvar versões próprias com total privacidade.'
    },
    {
      q: 'Como funciona a transposição automática para saxofone, trompete e outros instrumentos?',
      a: 'Com a Adaptação Inteligente por Instrumento, você seleciona seu instrumento (como Sax Alto em Eb, Trompete em Bb, Teclado, Ukulele ou Cavaco) e o Cifraê recalcula automaticamente todos os acordes e digitações na sua tonalidade real, enquanto a banda continua tocando no tom original.'
    },
    {
      q: 'E se eu assinar e não gostar?',
      a: 'Você conta com nossa Garantia Incondicional de 7 dias com devolução de 100% do seu dinheiro, sem perguntas e sem burocracia. O pagamento é processado com segurança de nível bancário pela Stripe.'
    }
  ];

  const testimonials = [
    {
      name: 'Gabriel Menezes',
      role: 'Ministro de Louvor & Violonista',
      church: 'Igreja Batista Central',
      text: 'O Cifraê acabou de vez com aquela correria de papel voando e gente perdida no tom. Agora aperto o botão no meu tablet e o tom muda na tela de todo o ministério ao mesmo tempo. É surreal!',
      rating: 5,
      avatar: 'bg-emerald-500'
    },
    {
      name: 'Matheus Fontes',
      role: 'Guitarrista & Líder de Banda Baile',
      church: 'Banda Blackout',
      text: 'Em shows de 4 horas com mais de 70 músicas, o Modo Palco com auto-rolagem e o envio de recados na tela salvaram nossas apresentações. Vale cada centavo investido.',
      rating: 5,
      avatar: 'bg-amber-500'
    },
    {
      name: 'Carla Silveira',
      role: 'Cantora & Tecladista Solo',
      church: 'Eventos & Casamentos',
      text: 'A transposição automática e a organização de repertórios por cerimônia me deram uma segurança absurda. Meus clientes percebem o profissionalismo.',
      rating: 5,
      avatar: 'bg-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-zinc-950 flex flex-col font-sans overflow-x-hidden">
      
      {/* 🧭 Top Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AppLogo size={38} variant="circle" />
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-tight text-white">
              Cifra<span className="text-emerald-400">ê</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black uppercase text-emerald-300">
              Live Palco
            </span>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-zinc-400">
          <a href="#recursos" className="hover:text-emerald-400 transition">Superpoderes</a>
          <a href="#como-funciona" className="hover:text-emerald-400 transition">Como Funciona</a>
          <a href="#depoimentos" className="hover:text-emerald-400 transition">Depoimentos</a>
          <a href="#planos" className="hover:text-emerald-400 transition">Planos & Preços</a>
          <a href="#faq" className="hover:text-emerald-400 transition">Dúvidas</a>
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <button
            onClick={onOpenAuth}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
          >
            Entrar
          </button>
          <button
            onClick={() => onOpenPricing('Desbloqueie agora o Modo Palco, sincronização ilimitada e ferramentas Pro!')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 text-xs font-black shadow-lg shadow-amber-950/50 transition flex items-center gap-1.5 active:scale-95"
          >
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span className="hidden xs:inline">Garantir</span> Acesso Pro
          </button>
        </div>
      </header>

      {/* 🚀 Hero Section (Ultra Magnética & Conversiva) */}
      <section className="relative pt-12 pb-20 px-4 sm:px-8 max-w-7xl mx-auto w-full flex flex-col items-center text-center overflow-hidden">
        {/* Glow Ambient Lights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 sm:w-[650px] h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-28 left-1/3 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Urgency / Social Proof Badge */}
        <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-emerald-500/40 text-emerald-300 text-xs font-black shadow-xl shadow-emerald-950/30 mb-6 animate-in fade-in slide-in-from-top-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <Radio className="w-3.5 h-3.5 text-emerald-400" />
          <span>A Ferramenta Definitiva para Ensaios e Apresentações ao Vivo</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-5xl">
          Nunca mais <span className="text-rose-400 underline decoration-rose-500/50">erre o tom</span>, perca a letra ou fique <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">desafinado no palco</span>.
        </h1>

        {/* Subtitle */}
        <p className="mt-6 text-sm sm:text-lg text-zinc-300 max-w-3xl leading-relaxed">
          O <strong>Cifraê</strong> conecta toda a sua banda em tempo real. Quando o líder altera o tom ou passa para a próxima música, a tela de <strong>todos os músicos muda simultaneamente</strong> no celular ou tablet. Sem gritaria no microfone e sem improviso amador.
        </p>

        {/* CTAs Duplos */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full max-w-md justify-center">
          <button
            onClick={() => onOpenPricing('Assine o Plano Pro e tenha salas ao vivo ilimitadas para até 25 músicos')}
            className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black text-sm sm:text-base shadow-2xl shadow-emerald-900/60 transition flex items-center justify-center gap-2.5 active:scale-95 group"
          >
            <Crown className="w-5 h-5 fill-current text-zinc-950" />
            <span>Desbloquear Acesso Pro Agora</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
          </button>

          <button
            onClick={onEnterApp}
            className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white font-extrabold text-sm border border-zinc-700/80 transition flex items-center justify-center gap-2 shadow-lg"
          >
            <Play className="w-4 h-4 text-emerald-400 fill-current" />
            <span>Testar Grátis no Navegador</span>
          </button>
        </div>

        {/* Micro-Gatilhos de Confiança */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Garantia de 7 dias com estorno 100%
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Até 25 músicos conectados por sala
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Sem necessidade de baixar aplicativo
          </span>
        </div>

        {/* 📱 Interactive Mockup Preview Card */}
        <div className="mt-12 w-full max-w-5xl rounded-3xl p-3 sm:p-4 bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 border border-zinc-700/80 shadow-2xl relative">
          <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 sm:p-8 text-left space-y-6 relative overflow-hidden">
            {/* Top Bar of Mockup */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono font-bold text-zinc-400 ml-2">
                  MODO PALCO AO VIVO • SALA ATIVA: 8492
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase flex items-center gap-1.5">
                  <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                  6 Músicos Conectados
                </span>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase">
                  Tom: G (Sol Maior)
                </span>
              </div>
            </div>

            {/* Mockup Body: Chords and Sync */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-3 font-mono text-sm">
                <div className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                  [REFRÃO • AUTO-ROLAGEM LIGADA (1.2X)]
                </div>
                <div className="space-y-1 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
                  <div className="text-emerald-400 font-black tracking-wide">
                    G&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D/F#&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Em7&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C9
                  </div>
                  <div className="text-zinc-200">
                    Porque Ele vive, eu posso crer no amanhã...
                  </div>
                  <div className="text-emerald-400 font-black tracking-wide mt-3">
                    G&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;C&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;D&nbsp;&nbsp;&nbsp;G
                  </div>
                  <div className="text-zinc-200">
                    Porque Ele vive, temor não há!
                  </div>
                </div>
              </div>

              {/* Band Members Status in Mockup */}
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 text-xs">
                <span className="font-bold text-zinc-300 uppercase tracking-wider text-[10px] block">
                  Dispositivos Conectados:
                </span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Lucas (Líder / Violão)
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">HOST</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-300">Renata (Vocal Solo)</span>
                    <span className="text-[10px] text-zinc-500">Sincronizado</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-300">Felipe (Teclado)</span>
                    <span className="text-[10px] text-zinc-500">Sincronizado</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <span className="text-zinc-300">Bruno (Sax Alto Eb)</span>
                    <span className="text-[10px] text-blue-400 font-bold">Tom Transposto</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 💥 Comparativo: O Caos do Papel vs A Liberdade do Cifraê */}
      <section id="como-funciona" className="py-16 px-4 sm:px-8 bg-zinc-900/50 border-y border-zinc-800/80">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-black uppercase text-amber-400 tracking-wider">
              Chega de passar aperto no palco
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              A Diferença Entre um Ensaio Caótico e uma Banda Profissional
            </h2>
            <p className="text-sm text-zinc-400 max-w-2xl mx-auto">
              Veja por que músicos em todo o Brasil estão abandonando pastas físicas e mensagens soltas de WhatsApp para adotar o Cifraê.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* O Caos do Método Antigo */}
            <div className="p-6 sm:p-8 rounded-3xl bg-zinc-950/80 border border-rose-500/30 space-y-5">
              <div className="flex items-center gap-3 text-rose-400">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center font-black text-lg">
                  ✕
                </div>
                <h3 className="text-lg font-black text-white">O Jeito Antigo (Amador & Lento)</h3>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-400">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Pastas pesadas de papel amassado ou PDFs soltos em grupos de WhatsApp.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>O vocalista troca de tom na hora e o violonista ou tecladista não sabe como transportar rápido.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Alguém se perde na letra durante o refrão e precisa parar de tocar para rolar a tela com a mão.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-400 font-bold">✕</span>
                  <span>Gritos e gestos no palco para avisar que vai repetir o coro ou fazer solo.</span>
                </li>
              </ul>
            </div>

            {/* A Revolução Cifraê */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-950 border-2 border-emerald-500/80 space-y-5 shadow-2xl relative">
              <div className="flex items-center gap-3 text-emerald-400">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-black text-lg">
                  ✓
                </div>
                <h3 className="text-lg font-black text-white">Com o Cifraê Pro (Sincronizado)</h3>
              </div>
              <ul className="space-y-3 text-xs sm:text-sm text-zinc-200">
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Um toque e todos mudam de música:</strong> O líder troca a cifra e ela aparece em tempo real para toda a banda.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Transposição cromática em 1 clique:</strong> Altere o tom da música e todos os acordes se recalculam instantaneamente.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Auto-Rolagem suave e inteligente:</strong> Mãos 100% livres para dedilhar e tocar o seu instrumento com tranquilidade.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span><strong>Comandos e Recados de Palco Silenciosos:</strong> Envie alertas de "Repetir Refrão", "Solo", "Finalizar" direto na tela dos músicos.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ⚡ Recursos e Superpoderes */}
      <section id="recursos" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto w-full space-y-16">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Tudo o que você precisa no palco
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Construído de Músico para Músico
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto">
            Recursos desenvolvidos e lapidados para resolver os problemas reais que acontecem em cima do palco e dentro da sala de ensaio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Tv className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Modo Palco Clean & Auto-Rolagem</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Interface limpa, sem menus e sem distrações. A cifra rola suavemente no ritmo do BPM da música, com controle de velocidade de 0.5x até 5.0x.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Radio className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Live Sync: Sala ao Vivo para Banda</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Crie uma sala com PIN ou QR Code. Conecte até 25 celulares e tablets simultaneamente. O líder tem o controle total do repertório.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Transposição & Capotraste Visual</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Ajuste semitons em tempo real. Veja tanto o <strong>Tom Real</strong> que soa para a banda quanto o <strong>Formato dos Acordes</strong> que você digita no braço com Capo.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Music className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Adaptação por Instrumento</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Diagramas e digitações automáticas para Violão, Teclado, Ukulele, Cavaquinho e transposição automática para Sax Alto (Eb) e Trompete (Bb).
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Repertórios de Shows Ilimitados</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Monte setlists completas separadas por estilo ou evento (Casamento, Barzinho, Culto, Ensaio) e navegue de uma música para a próxima em 1 segundo.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 hover:border-emerald-500/50 transition space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-white">Exportação para PDF A4 & Impressão</h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Gere apostilas completas em PDF com sumário e paginação perfeita em 1 ou 2 colunas para guardar ou imprimir em papel quando precisar.
            </p>
          </div>
        </div>
      </section>

      {/* 🌟 Depoimentos e Prova Social */}
      <section id="depoimentos" className="py-16 px-4 sm:px-8 bg-zinc-900/40 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-black uppercase text-emerald-400 tracking-wider">
              Quem usa não troca
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Amado por Músicos e Ministérios de Louvor
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, idx) => (
              <div key={idx} className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between space-y-4 shadow-xl">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 italic leading-relaxed">
                    "{t.text}"
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-zinc-850">
                  <div className={`w-9 h-9 rounded-full ${t.avatar} flex items-center justify-center text-zinc-950 font-black text-sm`}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{t.name}</h4>
                    <p className="text-[11px] text-zinc-400">{t.role} • {t.church}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 💰 Planos e Preços (Ancoragem & Escassez) */}
      <section id="planos" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto w-full space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 fill-current text-amber-400" />
            Investimento Inteligente
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white">
            Escolha o Plano Ideal Para o Seu Som
          </h2>
          <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
            Comece no gratuito ou destrave o poder total com o plano Pro por menos de <strong>R$ 0,55 por dia</strong>.
          </p>
        </div>

        {/* Toggle Mensal / Anual */}
        <div className="flex justify-center">
          <div className="flex items-center bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Free */}
          <div className="p-8 rounded-3xl bg-zinc-950/80 border border-zinc-800 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                  Acesso Padrão
                </span>
                <div className="text-4xl font-black text-white mt-1">
                  R$ 0 <span className="text-xs text-zinc-500 font-normal">/para sempre</span>
                </div>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ideal para quem toca sozinho e quer experimentar as funções básicas de cifras.
              </p>
              <ul className="space-y-3 text-xs text-zinc-300 pt-4 border-t border-zinc-850">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <span>Até 10 músicas no catálogo</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <span>Até 3 pastas de estilos musicais</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <span>Transposição cromática de tom</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <span>Rolagem automática no palco</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <span>Entrar em salas ao vivo como membro</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onEnterApp}
              className="w-full py-3.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs border border-zinc-800 transition"
            >
              Acessar Versão Gratuita
            </button>
          </div>

          {/* Card 2: Pro (Em destaque) */}
          <div className="p-8 rounded-3xl bg-gradient-to-b from-emerald-950/70 via-zinc-900 to-zinc-950 border-2 border-emerald-500 flex flex-col justify-between space-y-6 relative shadow-2xl">
            <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-emerald-500 text-zinc-950 font-black text-[10px] uppercase tracking-wider shadow-lg">
              👑 Mais Escolhido por Músicos
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider block">
                  Plano Pro (Palco & Banda Conectada)
                </span>
                <div className="text-4xl font-black text-white mt-1">
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
                Tudo liberado para conduzir ensaios e shows com sincronização mestre em tempo real.
              </p>

              <ul className="space-y-3 text-xs text-zinc-200 pt-4 border-t border-zinc-800">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <strong className="text-white">Músicas & Cifras Ilimitadas no Catálogo</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <strong className="text-white">Pastas de Estilos Musicais Ilimitadas</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <strong className="text-white">Criar Salas ao Vivo (Líder / Regente)</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <strong className="text-white">Até 25 músicos conectados simultaneamente</strong>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <span>Follow Scroll & Transposição síncrona para toda a banda</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <span>Adaptação por Instrumento (Teclado, Cavaco, Sax Eb, Trompete Bb)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <span>Exportação de Repertórios em PDF A4 Diagramado</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-400 flex-none" />
                  <span>Criar Versões Próprias (Editar acordes e arranjos)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onOpenPricing('Garantir Acesso Pro agora com Garantia de 7 dias')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 font-black text-sm shadow-xl shadow-emerald-950/50 transition flex items-center justify-center gap-2 active:scale-95"
            >
              <Crown className="w-4 h-4 fill-current text-zinc-950" />
              <span>Garantir Meu Acesso Pro</span>
            </button>
          </div>
        </div>

        {/* Selo de Segurança Stripe & Garantia */}
        <div className="p-6 rounded-3xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-none">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Garantia Blindada de 7 Dias</h4>
              <p className="text-xs text-zinc-400">
                Se por qualquer motivo o Cifraê não revolucionar seus ensaios, solicite reembolso total.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-800">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pagamento Seguro via Stripe</span>
          </div>
        </div>
      </section>

      {/* ❓ FAQ: Perguntas Frequentes (Quebra de Objeções) */}
      <section id="faq" className="py-16 px-4 sm:px-8 bg-zinc-900/40 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-black uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              Tire suas dúvidas
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden transition"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-sm sm:text-base font-bold text-white hover:text-emerald-300 transition"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-emerald-400 flex-none transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-900 pt-3 animate-in fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 🏁 Rodapé Final com CTA de Fechamento */}
      <footer className="border-t border-zinc-850 bg-zinc-950 px-4 sm:px-8 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <AppLogo size={36} variant="circle" />
            <div>
              <span className="text-lg font-black text-white">
                Cifra<span className="text-emerald-400">ê</span>
              </span>
              <p className="text-xs text-zinc-500">
                O ecossistema definitivo para músicos, bandas e ministérios de louvor.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-zinc-400">
            <button onClick={onEnterApp} className="hover:text-white transition">
              Acessar Catálogo
            </button>
            <button onClick={onOpenAuth} className="hover:text-white transition">
              Fazer Login
            </button>
            <button onClick={() => onOpenPricing()} className="hover:text-emerald-400 transition font-bold">
              Planos & Assinatura Pro
            </button>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-900 text-center text-xs text-zinc-600">
          © {new Date().getFullYear()} Cifraê. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
};

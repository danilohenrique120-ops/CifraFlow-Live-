import React, { useState } from 'react';
import { AppLogo } from './AppLogo';
import { X, ShieldCheck, Scale, FileText, Mail, ArrowRight } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'terms' | 'privacy';
}

export const TermsModal: React.FC<TermsModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms'
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-800 bg-zinc-950/50 flex-none">
          <div className="flex items-center gap-3">
            <AppLogo size={36} variant="squircle" showText={false} />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Documentos Legais & Diretrizes</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Cadencē
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Transparência e conformidade com o Marco Civil da Internet (Lei nº 12.965/14) e LGPD
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-4 border-b border-zinc-800 flex-none">
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-3 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'terms'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Termos de Uso & Isenção de Responsabilidade</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-3 px-3 text-xs sm:text-sm font-extrabold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'privacy'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Política de Privacidade & Dados</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
          {activeTab === 'terms' ? (
            <div className="space-y-4">
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  1. Natureza do Serviço e Plataforma Neutra
                </h3>
                <p>
                  O <strong>Cadencē</strong> é uma ferramenta de produtividade, organização de repertórios e sincronização de palco em tempo real destinada a músicos, cantores e instrumentistas. O software opera sob o princípio da neutralidade tecnológica e não atua como editora musical, distribuidora ou detentora de direitos autorais fonográficos.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  2. Conteúdo Criado e Importado pelo Usuário
                </h3>
                <p>
                  As anotações, arranjos de acordes, transposição de tons, andamentos (BPM) e repertórios salvos na plataforma são criados, formatados ou indexados sob demanda e iniciativa exclusiva de cada usuário para fins estritamente pessoais de estudo, ensaio e execução musical ao vivo.
                </p>
                <p>
                  O Cadencē disponibiliza recursos técnicos como rolagem contínua, metrônomo visual, cálculo matemático de transposição harmônica e importadores de arquivos de texto e formatos abertos (como ChordPro). O usuário é o único responsável pelo conteúdo carregado em sua conta privativa.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  3. Limitação de Responsabilidade e Direitos Autorais (Safe Harbor)
                </h3>
                <p>
                  Em total conformidade com o <strong>Art. 19 do Marco Civil da Internet (Lei nº 12.965/2014)</strong> e padrões internacionais de proteção (DMCA), o Cadencē respeita a propriedade intelectual de compositores, letristas e editoras musicais. Caso qualquer titular de direitos autorais identifique conteúdo indevido disponibilizado publicamente na ferramenta, disponibilizamos canal célere para análise e remoção imediata.
                </p>
                <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-400 flex-none" />
                  <div>
                    <span className="font-bold text-white block text-xs">Canal Oficial de Notificação & Direitos Autorais:</span>
                    <a href="mailto:contato@cadence.app" className="text-amber-400 hover:underline font-mono text-xs">
                      contato@cadence.app
                    </a>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  4. Planos, Assinaturas e Cancelamento
                </h3>
                <p>
                  A assinatura do Plano Pro confere acesso aos recursos tecnológicos avançados de infraestrutura (salas sincronizadas em tempo real com baixa latência, transposição global síncrona e backup na nuvem). Todas as transações são intermediadas com segurança bancária pela Stripe, com garantia incondicional de reembolso de 7 dias.
                </p>
              </section>
            </div>
          ) : (
            <div className="space-y-4">
              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  1. Privacidade e Proteção de Dados (LGPD)
                </h3>
                <p>
                  O <strong>Cadencē</strong> adota a arquitetura <em>Local-First</em>: suas cifras, pastas e repertórios são armazenados preferencialmente no armazenamento local do seu próprio dispositivo (IndexedDB / LocalStorage), garantindo funcionamento ininterrupto mesmo sem acesso à internet.
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  2. Dados Coletados e Finalidade
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-zinc-300">
                  <li><strong>Dados de Autenticação:</strong> E-mail, nome e identificador único de usuário (via Firebase Auth) para viabilizar login entre múltiplos aparelhos.</li>
                  <li><strong>Dados de Palco:</strong> Repertórios e cifras salvas em nuvem apenas quando o usuário opta por sincronizar entre seus dispositivos ou liderar uma sala ao vivo.</li>
                  <li><strong>Dados Financeiros:</strong> Não armazenamos números de cartão de crédito. Todo o processamento de pagamento é executado diretamente na infraestrutura certificada PCI-DSS da Stripe.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  3. Não Compartilhamento com Terceiros
                </h3>
                <p>
                  Seus dados nunca são vendidos, alugados ou compartilhados com corretores de dados (data brokers) ou redes de anúncios.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between flex-none">
          <span className="text-[11px] text-zinc-500 font-mono">
            Última atualização: {new Date().getFullYear()}
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-110 text-zinc-950 font-black text-xs transition active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

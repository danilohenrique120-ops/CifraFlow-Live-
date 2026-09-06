import React, { useState, useEffect } from 'react';
import { Setlist, Song } from '../types';
import { publishSharedSetlist, SharedSetlistPayload } from '../services/shareSetlistService';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { AppLogo } from './AppLogo';
import {
  X,
  Share2,
  Copy,
  Check,
  Crown,
  QrCode,
  Music,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Loader2
} from 'lucide-react';

interface ShareSetlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  setlist: Setlist | null;
  songs: Song[];
}

export const ShareSetlistModal: React.FC<ShareSetlistModalProps> = ({
  isOpen,
  onClose,
  setlist,
  songs
}) => {
  const { userProfile } = useAuth();
  const [sharedPayload, setSharedPayload] = useState<SharedSetlistPayload | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && setlist) {
      setIsPublishing(true);
      publishSharedSetlist(setlist, songs, userProfile)
        .then((payload) => {
          setSharedPayload(payload);
          setIsPublishing(false);
        })
        .catch((err) => {
          console.error('Erro ao publicar repertório:', err);
          setIsPublishing(false);
        });
    } else {
      setSharedPayload(null);
    }
  }, [isOpen, setlist, songs, userProfile]);

  if (!isOpen || !setlist) return null;

  const shareableUrl = typeof window !== 'undefined' && sharedPayload?.shareCode
    ? `${window.location.origin}${window.location.pathname}?repertorio=${sharedPayload.shareCode}`
    : '';

  const handleCopyLink = () => {
    if (!shareableUrl) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsapp = () => {
    if (!sharedPayload || !shareableUrl) return;
    const text = `🎸 *${setlist.title}* (${setlist.targetEvent})\n` +
      `Fala galera da banda! Preparei o repertório com ${setlist.items.length} músicas, tons e cifras completas no CifraFlow.\n\n` +
      `👉 Acesse e importe para seu app aqui:\n${shareableUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-none p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <AppLogo size={40} variant="circle" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-1.5">
                  Compartilhar Repertório
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-current" /> PRO
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Envie suas seleções e tons para os músicos da sua banda
              </p>
            </div>
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
          {/* Setlist Info Summary */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                {setlist.targetEvent}
              </span>
              <h3 className="text-lg font-black text-white">{setlist.title}</h3>
              <p className="text-xs text-zinc-400 flex items-center gap-1">
                <Music className="w-3.5 h-3.5 text-emerald-400" />
                {setlist.items.length} músicas incluídas com tons e anotações
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Pronto para envio
              </span>
            </div>
          </div>

          {/* Loading or Generated Share Box */}
          {isPublishing ? (
            <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-zinc-400 font-medium">Empacotando cifras e gerando código seguro...</p>
            </div>
          ) : sharedPayload ? (
            <div className="space-y-5">
              {/* QR Code & PIN Code Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-zinc-950 to-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-center gap-5">
                <div className="bg-white p-3 rounded-2xl shadow-xl flex-none">
                  <QRCodeSVG value={shareableUrl} size={130} level="M" />
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                    Código de Importação
                  </span>
                  <div className="text-3xl font-black text-emerald-400 font-mono tracking-wider">
                    {sharedPayload.shareCode}
                  </div>
                  <p className="text-xs text-zinc-400">
                    Aponte a câmera do celular no ensaio ou envie o link direto no WhatsApp para os músicos.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleCopyLink}
                  className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs shadow-md border border-zinc-700 transition flex items-center justify-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Link Copiado!' : 'Copiar Link Direto'}
                </button>

                <button
                  onClick={handleShareWhatsapp}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  Enviar no WhatsApp
                </button>
              </div>
            </div>
          ) : null}

          {/* Pro Benefits Callout */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 flex-none mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-white">Sincronia Total para a Banda</span>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                Ao importar, o músico recebe todas as músicas com os tons específicos que você definiu para este evento.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

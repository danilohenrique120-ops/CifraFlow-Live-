import React, { useState } from 'react';
import { Setlist, Song } from '../types';
import {
  generateSetlistPdfHtml,
  printHtmlDocument,
  openHtmlPreviewInNewTab
} from '../utils/pdfGenerator';
import {
  X,
  Printer,
  FileText,
  Copy,
  Check,
  Sparkles,
  ListOrdered,
  Music,
  Share2,
  Settings2,
  ExternalLink,
  Loader2
} from 'lucide-react';

interface ExportSetlistPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  setlist: Setlist;
  songs: Song[];
}

export const ExportSetlistPdfModal: React.FC<ExportSetlistPdfModalProps> = ({
  isOpen,
  onClose,
  setlist,
  songs
}) => {
  const [exportMode, setExportMode] = useState<'full_book' | 'summary_sheet'>('full_book');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [columnsCount, setColumnsCount] = useState<'1' | '2'>('2');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('sm');
  const [copiedWhatsapp, setCopiedWhatsapp] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Prepare ordered list of songs with their custom tones and notes
  const setlistSongs = setlist.items
    .map((item, idx) => {
      const song = songs.find(s => s.id === item.songId);
      return {
        order: idx + 1,
        item,
        song,
        effectiveKey: item.customKey || song?.currentKey || song?.originalKey || 'C',
        effectiveCapo: item.capo !== undefined ? item.capo : (song?.capo || 0)
      };
    })
    .filter(entry => entry.song !== undefined);

  const getPdfHtml = () => {
    return generateSetlistPdfHtml({
      setlist,
      songs,
      exportMode,
      includeNotes,
      columnsCount,
      fontSize
    });
  };

  const handlePrint = async () => {
    setIsGenerating(true);
    try {
      const html = getPdfHtml();
      const docTitle = `Repertorio_${setlist.title.replace(/\s+/g, '_')}_Cifrae`;
      await printHtmlDocument(html, docTitle);
    } catch (err) {
      console.error('Error generating PDF print:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenPreview = () => {
    const html = getPdfHtml();
    openHtmlPreviewInNewTab(html);
  };

  const handleCopyWhatsapp = () => {
    const dateStr = new Date().toLocaleDateString('pt-BR');
    let text = `🎵 *REPERTÓRIO: ${setlist.title.toUpperCase()}*\n`;
    text += `📅 Evento: ${setlist.targetEvent || 'Show'} | ${dateStr}\n`;
    if (setlist.description) {
      text += `📝 Obs: ${setlist.description}\n`;
    }
    text += `\n*─── ORDEM DO SHOW ───*\n`;

    setlistSongs.forEach(({ order, song, effectiveKey, effectiveCapo, item }) => {
      if (!song) return;
      text += `${order}. *${song.title}* - ${song.artist}\n`;
      text += `   ↳ Tom: *${effectiveKey}*`;
      if (effectiveCapo > 0) text += ` | Capo: *${effectiveCapo}ª casa*`;
      if (song.bpm) text += ` | BPM: *${song.bpm}*`;
      if (item.notes && includeNotes) text += ` | ⚡ _${item.notes}_`;
      text += `\n`;
    });

    text += `\n✨ _Gerado via Cifraê Pro_`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-zinc-900 border border-zinc-700/80 shadow-2xl text-white overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800 flex-none bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white">Exportar Repertório em PDF</h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-zinc-950 shadow-sm">
                  👑 Exclusivo Pro
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Gere o caderno de cifras formatado para folha A4, salve em PDF ou envie à banda
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

        {/* Form Options */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Setlist Info Pill */}
          <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-white">{setlist.title}</h4>
              <p className="text-xs text-zinc-400">{setlist.targetEvent || 'Geral'} • {setlistSongs.length} músicas</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-500/30">
              Formato A4 Pronto
            </span>
          </div>

          {/* Export Format Selectors */}
          <div>
            <label className="text-xs font-bold text-zinc-300 block mb-2">Formato de Exportação:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setExportMode('full_book')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  exportMode === 'full_book'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <FileText className={`w-5 h-5 mt-0.5 flex-none ${exportMode === 'full_book' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <div>
                  <span className="text-xs font-bold block text-white">Caderno de Cifras Completo</span>
                  <span className="text-[11px] text-zinc-400 block leading-tight mt-0.5">
                    Índice com sequência + cada música em página própria com suas cifras e tons transpostos.
                  </span>
                </div>
              </div>

              <div
                onClick={() => setExportMode('summary_sheet')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                  exportMode === 'summary_sheet'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md ring-1 ring-emerald-500/30'
                    : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <ListOrdered className={`w-5 h-5 mt-0.5 flex-none ${exportMode === 'summary_sheet' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <div>
                  <span className="text-xs font-bold block text-white">Folha de Palco Resumida</span>
                  <span className="text-[11px] text-zinc-400 block leading-tight mt-0.5">
                    1 folha compacta de alto contraste com ordem, tons, capotraste, BPM e anotações.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Layout Customization */}
          {exportMode === 'full_book' && (
            <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <Settings2 className="w-4 h-4 text-emerald-400" />
                <span>Ajustes de Impressão e Diagramação (A4):</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Colunas por Página:</label>
                  <select
                    value={columnsCount}
                    onChange={(e) => setColumnsCount(e.target.value as '1' | '2')}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                  >
                    <option value="2">2 Colunas (Econômico)</option>
                    <option value="1">1 Coluna (Texto Amplo)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Tamanho da Fonte:</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                  >
                    <option value="sm">Pequeno / Compacto</option>
                    <option value="base">Médio / Padrão</option>
                    <option value="lg">Grande (Leitura Fácil)</option>
                  </select>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Notas da Banda:</label>
                  <button
                    type="button"
                    onClick={() => setIncludeNotes(!includeNotes)}
                    className={`w-full py-1.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      includeNotes
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-zinc-900 text-zinc-500 border-zinc-700'
                    }`}
                  >
                    {includeNotes ? '✓ Incluir Anotações' : 'Ocultar Anotações'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Share to WhatsApp */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Share2 className="w-4 h-4 text-emerald-400 flex-none" />
              <span className="text-xs text-emerald-200">
                Deseja enviar a lista de músicas direto para o WhatsApp da banda?
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyWhatsapp}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition flex items-center gap-1.5 shadow-md flex-none cursor-pointer"
            >
              {copiedWhatsapp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWhatsapp ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
            </button>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 flex-none bg-zinc-950/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition cursor-pointer"
            >
              Fechar
            </button>

            <button
              type="button"
              onClick={handleOpenPreview}
              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700 hover:border-zinc-600 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              title="Abrir página diagramada em uma nova aba"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>Ver em Nova Aba</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handlePrint}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950 transition flex items-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Gerando PDF...</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Salvar em PDF / Imprimir</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

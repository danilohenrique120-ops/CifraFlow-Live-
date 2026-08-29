import React, { useState } from 'react';
import { Setlist, Song } from '../types';
import { transposeSongContent, isChordLine } from '../utils/chordEngine';
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
  Settings2
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

  if (!isOpen) return null;

  // Prepare ordered list of songs with their custom tones and notes
  const setlistSongs = setlist.items.map((item, idx) => {
    const song = songs.find(s => s.id === item.songId);
    return {
      order: idx + 1,
      item,
      song,
      effectiveKey: item.customKey || song?.originalKey || 'C'
    };
  }).filter(entry => entry.song !== undefined);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyWhatsapp = () => {
    const dateStr = new Date().toLocaleDateString('pt-BR');
    let text = `🎵 *REPERTÓRIO: ${setlist.title.toUpperCase()}*\n`;
    text += `📅 Evento: ${setlist.targetEvent} | ${dateStr}\n`;
    if (setlist.description) {
      text += `📝 Obs: ${setlist.description}\n`;
    }
    text += `\n*─── ORDEM DO SHOW ───*\n`;

    setlistSongs.forEach(({ order, song, effectiveKey, item }) => {
      if (!song) return;
      text += `${order}. *${song.title}* - ${song.artist}\n`;
      text += `   ↳ Tom: *${effectiveKey}*`;
      if (song.capo && song.capo > 0) text += ` | Capo: *${song.capo}ª casa*`;
      if (song.bpm) text += ` | BPM: *${song.bpm}*`;
      if (item.notes && includeNotes) text += ` | ⚡ _${item.notes}_`;
      text += `\n`;
    });

    text += `\n✨ _Gerado via CifraSync Live Pro_`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsapp(true);
    setTimeout(() => setCopiedWhatsapp(false), 2500);
  };

  return (
    <>
      {/* Interactive Modal UI (Hidden during print) */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 print:hidden">
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
                  Gere o caderno de cifras para impressão em folha A4 ou copie para o WhatsApp da banda
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
                <p className="text-xs text-zinc-400">{setlist.targetEvent} • {setlistSongs.length} músicas</p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-500/30">
                A4 Pronto
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
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <FileText className={`w-5 h-5 mt-0.5 flex-none ${exportMode === 'full_book' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <div>
                    <span className="text-xs font-bold block text-white">Caderno de Cifras Completo</span>
                    <span className="text-[11px] text-zinc-400 block leading-tight mt-0.5">
                      Índice inicial + cada música com sua cifra completa e quebra de página.
                    </span>
                  </div>
                </div>

                <div
                  onClick={() => setExportMode('summary_sheet')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-start gap-3 ${
                    exportMode === 'summary_sheet'
                      ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-md'
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  <ListOrdered className={`w-5 h-5 mt-0.5 flex-none ${exportMode === 'summary_sheet' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                  <div>
                    <span className="text-xs font-bold block text-white">Folha de Palco Resumida</span>
                    <span className="text-[11px] text-zinc-400 block leading-tight mt-0.5">
                      1 página compacta contendo apenas a sequência, tons, capotraste e notas.
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
                  <span>Ajustes de Impressão (Papel A4):</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-zinc-400 block mb-1">Colunas por Página:</label>
                    <select
                      value={columnsCount}
                      onChange={(e) => setColumnsCount(e.target.value as '1' | '2')}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-white font-bold"
                    >
                      <option value="2">2 Colunas (Economiza Papel)</option>
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
                  Deseja enviar a lista de músicas direto para a banda?
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyWhatsapp}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition flex items-center gap-1.5 shadow-md flex-none"
              >
                {copiedWhatsapp ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWhatsapp ? 'Copiado!' : 'Copiar p/ WhatsApp'}</span>
              </button>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="p-4 sm:p-5 border-t border-zinc-800 flex items-center justify-between gap-3 flex-none bg-zinc-950/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-950 transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Imprimir / Salvar como PDF
            </button>
          </div>
        </div>
      </div>

      {/* 🖨️ Printable High-Contrast A4 Document (Only visible when printing or print preview) */}
      <div className="hidden print:block font-sans text-black bg-white p-4 max-w-full">
        {/* Cover / Index Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black uppercase tracking-tight">{setlist.title}</h1>
            <span className="text-xs font-bold uppercase px-2 py-0.5 border border-black rounded">
              {setlist.targetEvent}
            </span>
          </div>
          {setlist.description && (
            <p className="text-xs text-gray-700 mt-1 italic">{setlist.description}</p>
          )}
          <div className="text-[10px] text-gray-500 mt-2 flex items-center justify-between">
            <span>Total de Músicas: {setlistSongs.length}</span>
            <span>Data: {new Date().toLocaleDateString('pt-BR')} • CifraSync Live</span>
          </div>
        </div>

        {/* Summary Table */}
        <div className="mb-8">
          <h2 className="text-sm font-black uppercase mb-2 border-b border-gray-400 pb-1">
            Sequência do Show
          </h2>
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1 w-8">#</th>
                <th className="py-1">Música</th>
                <th className="py-1">Artista</th>
                <th className="py-1 w-16">Tom</th>
                <th className="py-1 w-20">Capo</th>
                <th className="py-1 w-16">BPM</th>
                {includeNotes && <th className="py-1">Anotações da Banda</th>}
              </tr>
            </thead>
            <tbody>
              {setlistSongs.map(({ order, song, effectiveKey, item }) => (
                <tr key={item.songId} className="border-b border-gray-200">
                  <td className="py-1.5 font-bold">{order}</td>
                  <td className="py-1.5 font-bold">{song?.title}</td>
                  <td className="py-1.5 text-gray-700">{song?.artist}</td>
                  <td className="py-1.5 font-bold font-mono">{effectiveKey}</td>
                  <td className="py-1.5 font-mono">{song?.capo ? `${song.capo}ª casa` : '-'}</td>
                  <td className="py-1.5 font-mono">{song?.bpm || '-'}</td>
                  {includeNotes && <td className="py-1.5 text-gray-600 italic text-[11px]">{item.notes || '-'}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Full Song Sheets (If exportMode === 'full_book') */}
        {exportMode === 'full_book' && (
          <div className="space-y-8">
            {setlistSongs.map(({ order, song, effectiveKey, item }) => {
              if (!song) return null;

              return (
                <div
                  key={song.id}
                  className="pt-4 border-t-2 border-dashed border-gray-400"
                  style={{ pageBreakBefore: 'always', breakBefore: 'page' }}
                >
                  {/* Song Header */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-lg">#{order}</span>
                        <h2 className="text-xl font-extrabold">{song.title}</h2>
                      </div>
                      <p className="text-xs text-gray-600">{song.artist}</p>
                    </div>

                    <div className="text-right text-xs">
                      <div>Tom: <strong className="text-base font-mono">{effectiveKey}</strong></div>
                      {song.capo && song.capo > 0 && <div>Capotraste: <strong>{song.capo}ª casa</strong></div>}
                      {song.bpm && <div>BPM: <strong>{song.bpm}</strong> | Compasso: <strong>{song.timeSignature}</strong></div>}
                    </div>
                  </div>

                  {includeNotes && item.notes && (
                    <div className="mb-3 p-1.5 bg-gray-100 border-l-4 border-black text-xs font-semibold">
                      ⚡ Anotação: {item.notes}
                    </div>
                  )}

                  {/* Chords / Lyrics Content */}
                  <div
                    className={`font-mono leading-tight select-text ${
                      columnsCount === '2' ? 'columns-2 gap-6' : 'columns-1'
                    } ${
                      fontSize === 'sm' ? 'text-[11px]' : fontSize === 'lg' ? 'text-sm' : 'text-xs'
                    }`}
                  >
                    {song.content.split('\n').map((line, lIdx) => {
                      const isChord = isChordLine(line);
                      const isSec = line.trim().startsWith('[') && line.trim().endsWith(']');

                      if (isSec) {
                        return (
                          <div key={lIdx} className="font-bold py-1 text-black uppercase tracking-wider">
                            {line}
                          </div>
                        );
                      }
                      if (isChord) {
                        return (
                          <div key={lIdx} className="font-black text-black">
                            {line}
                          </div>
                        );
                      }
                      return (
                        <div key={lIdx} className="text-gray-900">
                          {line || ' '}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

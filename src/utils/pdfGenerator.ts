import { Setlist, Song } from '../types';
import { transposeSongContent, isChordLine, getSemitoneDifference } from './chordEngine';

export interface ExportPdfOptions {
  setlist: Setlist;
  songs: Song[];
  exportMode: 'full_book' | 'summary_sheet';
  includeNotes: boolean;
  columnsCount: '1' | '2';
  fontSize: 'sm' | 'base' | 'lg';
}

export interface SingleSongPdfOptions {
  song: Song;
  effectiveKey?: string;
  capo?: number;
  instrument?: string;
  columnsCount?: '1' | '2';
  fontSize?: 'sm' | 'base' | 'lg';
  notes?: string;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates standalone, self-contained HTML for setlist printing / saving as PDF
 */
export function generateSetlistPdfHtml(options: ExportPdfOptions): string {
  const { setlist, songs, exportMode, includeNotes, columnsCount, fontSize } = options;

  const fontSizes = {
    sm: { body: '10.5px', line: '1.25', chord: '11px', header: '17px' },
    base: { body: '12px', line: '1.35', chord: '12.5px', header: '19px' },
    lg: { body: '13.5px', line: '1.45', chord: '14px', header: '21px' }
  }[fontSize];

  const dateStr = new Date().toLocaleDateString('pt-BR');

  // Map and prepare songs with their effective keys and transpositions
  const setlistSongs = setlist.items
    .map((item, idx) => {
      const song = songs.find(s => s.id === item.songId);
      if (!song) return null;
      const effectiveKey = item.customKey || song.currentKey || song.originalKey || 'C';
      const semitones = getSemitoneDifference(song.originalKey, effectiveKey);
      const transposedContent = transposeSongContent(song.content, semitones, effectiveKey);
      const effectiveCapo = item.capo !== undefined ? item.capo : (song.capo || 0);

      return {
        order: idx + 1,
        item,
        song,
        effectiveKey,
        effectiveCapo,
        transposedContent
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const songsHtml = setlistSongs.map(({ order, song, effectiveKey, effectiveCapo, item, transposedContent }) => {
    const lines = transposedContent.split('\n');

    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      const isSec = (trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('(') && trimmed.endsWith(')'));
      
      if (isSec) {
        return `<div class="sec-tag">${escapeHtml(line)}</div>`;
      }
      
      if (isChordLine(line)) {
        return `<div class="chord-line">${escapeHtml(line)}</div>`;
      }
      
      return `<div class="lyric-line">${escapeHtml(line || ' ')}</div>`;
    }).join('');

    return `
      <div class="song-sheet">
        <div class="song-header">
          <div class="song-title-group">
            <span class="song-num">#${order}</span>
            <div>
              <h2 class="song-title">${escapeHtml(song.title)}</h2>
              <div class="song-artist">${escapeHtml(song.artist)} &bull; ${escapeHtml(song.liturgicalMoment || 'Geral')}</div>
            </div>
          </div>

          <div class="song-meta-box">
            <div class="meta-pill meta-key">Tom: <strong>${escapeHtml(effectiveKey)}</strong></div>
            ${effectiveCapo > 0 ? `<div class="meta-pill">Capo: <strong>${effectiveCapo}ª casa</strong></div>` : ''}
            ${song.bpm ? `<div class="meta-pill">BPM: <strong>${song.bpm}</strong></div>` : ''}
            ${song.timeSignature ? `<div class="meta-pill">Compasso: <strong>${escapeHtml(song.timeSignature)}</strong></div>` : ''}
          </div>
        </div>

        ${includeNotes && item.notes ? `
          <div class="band-note-box">
            ⚡ <strong>Anotação da Banda:</strong> ${escapeHtml(item.notes)}
          </div>
        ` : ''}

        <div class="song-body columns-${columnsCount}">
          ${formattedLines}
        </div>
      </div>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Repertório - ${escapeHtml(setlist.title)} | Cifraê</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #000000;
      background: #ffffff;
      line-height: 1.3;
    }

    /* Cover / Index Section */
    .index-cover {
      padding-bottom: 20px;
      margin-bottom: 25px;
      page-break-after: ${exportMode === 'full_book' ? 'always' : 'auto'};
      break-after: ${exportMode === 'full_book' ? 'page' : 'auto'};
    }

    .header-banner {
      border-bottom: 2.5px solid #000;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }

    .brand-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }

    .brand-logo {
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #059669;
    }

    .event-badge {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      padding: 3px 8px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
    }

    .repertoire-title {
      font-size: 26px;
      font-weight: 900;
      margin: 4px 0 6px 0;
      letter-spacing: -0.5px;
      color: #111827;
      text-transform: uppercase;
    }

    .repertoire-desc {
      font-size: 12px;
      color: #4b5563;
      font-style: italic;
      margin: 0 0 8px 0;
    }

    .meta-bar {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #6b7280;
      font-weight: 600;
      border-top: 1px dashed #e5e7eb;
      padding-top: 6px;
      margin-top: 6px;
    }

    /* Table */
    .summary-title {
      font-size: 13px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 16px 0 8px 0;
      color: #111827;
    }

    .setlist-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      text-align: left;
    }

    .setlist-table th {
      background: #f9fafb;
      border-bottom: 2px solid #000;
      padding: 6px 8px;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 10px;
    }

    .setlist-table td {
      padding: 6px 8px;
      border-bottom: 1px solid #e5e7eb;
      vertical-align: middle;
    }

    .setlist-table tr:nth-child(even) td {
      background-color: #fafafa;
    }

    .col-order { width: 32px; font-weight: 900; }
    .col-key { width: 55px; font-family: monospace; font-weight: 900; font-size: 12px; }
    .col-capo { width: 65px; font-family: monospace; }
    .col-bpm { width: 50px; font-family: monospace; }
    .col-notes { font-style: italic; color: #4b5563; font-size: 10.5px; }

    /* Song Sheets */
    .song-sheet {
      page-break-before: always;
      break-before: page;
      padding-top: 10px;
    }

    .song-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 10px;
      gap: 12px;
    }

    .song-title-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .song-num {
      font-size: 20px;
      font-weight: 900;
      background: #111827;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 6px;
      line-height: 1.1;
    }

    .song-title {
      font-size: ${fontSizes.header};
      font-weight: 900;
      margin: 0;
      color: #111827;
      letter-spacing: -0.3px;
    }

    .song-artist {
      font-size: 11.5px;
      color: #4b5563;
      margin-top: 2px;
      font-weight: 600;
    }

    .song-meta-box {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: flex-end;
    }

    .meta-pill {
      font-size: 11px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 3px 7px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .meta-key {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
      font-size: 12px;
    }

    .band-note-box {
      background: #fefce8;
      border-left: 3.5px solid #eab308;
      padding: 5px 10px;
      margin-bottom: 10px;
      font-size: 11px;
      color: #713f12;
      border-radius: 0 4px 4px 0;
    }

    .song-body {
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      font-size: ${fontSizes.body};
      line-height: ${fontSizes.line};
      white-space: pre-wrap;
      word-break: break-word;
    }

    .columns-1 {
      column-count: 1;
    }

    .columns-2 {
      column-count: 2;
      column-gap: 24px;
      column-rule: 1px dashed #e5e7eb;
    }

    .sec-tag {
      font-weight: 800;
      color: #111827;
      background: #f3f4f6;
      padding: 1px 5px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 6px;
      margin-bottom: 2px;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .chord-line {
      font-weight: 800;
      color: #000000;
      margin-top: 2px;
      font-size: ${fontSizes.chord};
      letter-spacing: 0px;
    }

    .lyric-line {
      color: #1f2937;
      font-weight: 400;
      margin-bottom: 2px;
    }

    /* Stage Cheat Sheet Notes area */
    .cheat-sheet-notes-area {
      margin-top: 24px;
      border: 1.5px dashed #9ca3af;
      border-radius: 8px;
      padding: 12px;
      background: #fafafa;
    }
    .cheat-sheet-notes-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      color: #4b5563;
      margin-bottom: 6px;
    }
    .cheat-sheet-lines {
      height: 70px;
    }
  </style>
</head>
<body>

  <!-- Cover & Summary Index -->
  <div class="index-cover">
    <div class="header-banner">
      <div class="brand-row">
        <span class="brand-logo">🎵 CIFRAÊ &bull; REPERTÓRIO OFICIAL</span>
        <span class="event-badge">${escapeHtml(setlist.targetEvent || 'Show')}</span>
      </div>

      <h1 class="repertoire-title">${escapeHtml(setlist.title)}</h1>

      ${setlist.description ? `<p class="repertoire-desc">${escapeHtml(setlist.description)}</p>` : ''}

      <div class="meta-bar">
        <span>Músicas Programadas: <strong>${setlistSongs.length}</strong></span>
        <span>Data: <strong>${dateStr}</strong></span>
        <span>Formato: <strong>${exportMode === 'full_book' ? 'Caderno Completo A4' : 'Folha de Palco'}</strong></span>
      </div>
    </div>

    <div class="summary-title">Sequência do Show & Detalhes</div>
    <table class="setlist-table">
      <thead>
        <tr>
          <th class="col-order">#</th>
          <th>Música</th>
          <th>Artista</th>
          <th class="col-key">Tom</th>
          <th class="col-capo">Capo</th>
          <th class="col-bpm">BPM</th>
          ${includeNotes ? '<th class="col-notes">Anotações da Banda</th>' : ''}
        </tr>
      </thead>
      <tbody>
        ${setlistSongs.map(({ order, song, effectiveKey, effectiveCapo, item }) => `
          <tr>
            <td class="col-order">${order}</td>
            <td><strong>${escapeHtml(song.title)}</strong></td>
            <td>${escapeHtml(song.artist)}</td>
            <td class="col-key">${escapeHtml(effectiveKey)}</td>
            <td class="col-capo">${effectiveCapo > 0 ? `${effectiveCapo}ª casa` : '-'}</td>
            <td class="col-bpm">${song.bpm || '-'}</td>
            ${includeNotes ? `<td class="col-notes">${escapeHtml(item.notes || '-')}</td>` : ''}
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${exportMode === 'summary_sheet' ? `
      <div class="cheat-sheet-notes-area">
        <div class="cheat-sheet-notes-title">⚡ Anotações Gerais de Palco & Observações Extras:</div>
        <div class="cheat-sheet-lines"></div>
      </div>
    ` : ''}
  </div>

  <!-- Full Songs Breakdown (Only if full_book) -->
  ${exportMode === 'full_book' ? songsHtml : ''}

</body>
</html>
  `.trim();
}

/**
 * Generates standalone HTML for a single song
 */
export function generateSingleSongPdfHtml(options: SingleSongPdfOptions): string {
  const { song, effectiveKey, capo, columnsCount = '2', fontSize = 'sm', notes } = options;

  const targetKey = effectiveKey || song.currentKey || song.originalKey || 'C';
  const semitones = getSemitoneDifference(song.originalKey, targetKey);
  const transposedContent = transposeSongContent(song.content, semitones, targetKey);
  const effectiveCapo = capo !== undefined ? capo : (song.capo || 0);

  const fontSizes = {
    sm: { body: '11px', line: '1.25', chord: '11.5px', header: '18px' },
    base: { body: '12.5px', line: '1.35', chord: '13px', header: '20px' },
    lg: { body: '14px', line: '1.45', chord: '14.5px', header: '22px' }
  }[fontSize];

  const lines = transposedContent.split('\n');
  const formattedLines = lines.map(line => {
    const trimmed = line.trim();
    const isSec = (trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('(') && trimmed.endsWith(')'));
    
    if (isSec) {
      return `<div class="sec-tag">${escapeHtml(line)}</div>`;
    }
    
    if (isChordLine(line)) {
      return `<div class="chord-line">${escapeHtml(line)}</div>`;
    }
    
    return `<div class="lyric-line">${escapeHtml(line || ' ')}</div>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(song.title)} - ${escapeHtml(song.artist)} | Cifraê</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 12mm 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #000000;
      background: #ffffff;
    }

    .song-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2.5px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
      gap: 12px;
    }

    .brand-tag {
      font-size: 10px;
      font-weight: 900;
      color: #059669;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }

    .song-title {
      font-size: ${fontSizes.header};
      font-weight: 900;
      margin: 0;
      color: #111827;
      letter-spacing: -0.3px;
    }

    .song-artist {
      font-size: 12px;
      color: #4b5563;
      margin-top: 2px;
      font-weight: 600;
    }

    .song-meta-box {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      justify-content: flex-end;
    }

    .meta-pill {
      font-size: 11px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      padding: 3px 8px;
      border-radius: 6px;
      white-space: nowrap;
    }

    .meta-key {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
      font-size: 12.5px;
    }

    .band-note-box {
      background: #fefce8;
      border-left: 3.5px solid #eab308;
      padding: 5px 10px;
      margin-bottom: 10px;
      font-size: 11px;
      color: #713f12;
      border-radius: 0 4px 4px 0;
    }

    .song-body {
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      font-size: ${fontSizes.body};
      line-height: ${fontSizes.line};
      white-space: pre-wrap;
      word-break: break-word;
    }

    .columns-1 { column-count: 1; }
    .columns-2 {
      column-count: 2;
      column-gap: 24px;
      column-rule: 1px dashed #e5e7eb;
    }

    .sec-tag {
      font-weight: 800;
      color: #111827;
      background: #f3f4f6;
      padding: 1px 5px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 6px;
      margin-bottom: 2px;
      font-size: 0.9em;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .chord-line {
      font-weight: 800;
      color: #000000;
      margin-top: 2px;
      font-size: ${fontSizes.chord};
    }

    .lyric-line {
      color: #1f2937;
      font-weight: 400;
      margin-bottom: 2px;
    }
  </style>
</head>
<body>
  <div class="song-header">
    <div>
      <div class="brand-tag">🎵 CIFRAÊ &bull; CIFRA OFICIAL</div>
      <h1 class="song-title">${escapeHtml(song.title)}</h1>
      <div class="song-artist">${escapeHtml(song.artist)} &bull; ${escapeHtml(song.liturgicalMoment || 'Geral')}</div>
    </div>

    <div class="song-meta-box">
      <div class="meta-pill meta-key">Tom: <strong>${escapeHtml(targetKey)}</strong></div>
      ${effectiveCapo > 0 ? `<div class="meta-pill">Capo: <strong>${effectiveCapo}ª casa</strong></div>` : ''}
      ${song.bpm ? `<div class="meta-pill">BPM: <strong>${song.bpm}</strong></div>` : ''}
      ${song.timeSignature ? `<div class="meta-pill">Compasso: <strong>${escapeHtml(song.timeSignature)}</strong></div>` : ''}
    </div>
  </div>

  ${notes ? `
    <div class="band-note-box">
      ⚡ <strong>Anotação:</strong> ${escapeHtml(notes)}
    </div>
  ` : ''}

  <div class="song-body columns-${columnsCount}">
    ${formattedLines}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Triggers native, isolated, pristine printing / PDF generation without touching SPA DOM
 */
export function printHtmlDocument(html: string, title?: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const oldTitle = document.title;
      if (title) {
        document.title = title;
      }

      // Create hidden iframe for completely isolated rendering
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!doc || !iframe.contentWindow) {
        // Fallback popup if iframe document is not accessible
        fallbackPopupWindow(html, title, () => resolve(true));
        return;
      }

      doc.open();
      doc.write(html);
      doc.close();

      const doPrint = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          resolve(true);
        } catch (err) {
          console.warn('Iframe print failed, attempting popup window', err);
          fallbackPopupWindow(html, title, () => resolve(true));
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
            if (title) {
              document.title = oldTitle;
            }
          }, 3000);
        }
      };

      if (doc.readyState === 'complete') {
        setTimeout(doPrint, 300);
      } else {
        iframe.onload = () => setTimeout(doPrint, 300);
      }
    } catch (err) {
      console.error('Fatal print error:', err);
      fallbackPopupWindow(html, title, () => resolve(true));
    }
  });
}

function fallbackPopupWindow(html: string, title?: string, onDone?: () => void) {
  try {
    const printWindow = window.open('', '_blank', 'width=900,height=800,menubar=yes,scrollbars=yes');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        onDone?.();
      }, 500);
    } else {
      // If popup blocked, create a temporary blob URL to open in new tab
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      onDone?.();
    }
  } catch (e) {
    console.error('Fallback popup window failed', e);
    onDone?.();
  }
}

/**
 * Open printable HTML in a dedicated preview tab
 */
export function openHtmlPreviewInNewTab(html: string): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

// Parser de formato ChordPro e extrator local de cifras
// Executado exclusivamente no cliente (aparelho do usuário), garantindo conformidade legal e zero dependência de scraping centralizado.

export interface ParsedChordProResult {
  title?: string;
  artist?: string;
  key?: string;
  capo?: number;
  bpm?: number;
  timeSignature?: string;
  formattedContent: string;
}

/**
 * Converte notação ChordPro padrão ({title}, {key}, [C]Texto) para a formatação de palco do Cadencē.
 */
export function parseChordPro(chordProText: string): ParsedChordProResult {
  const lines = chordProText.split('\n');
  let title: string | undefined;
  let artist: string | undefined;
  let key: string | undefined;
  let capo: number | undefined;
  let bpm: number | undefined;
  let timeSignature: string | undefined;

  const outputLines: string[] = [];

  for (let rawLine of lines) {
    const trimmed = rawLine.trim();

    // 1. Diretivas ChordPro {directive: value}
    const directiveMatch = trimmed.match(/^\{([a-zA-Z0-9_-]+)(?::\s*(.*))?\}$/);
    if (directiveMatch) {
      const tag = directiveMatch[1].toLowerCase();
      const val = (directiveMatch[2] || '').trim();

      if (['title', 't'].includes(tag)) {
        title = val;
      } else if (['artist', 'a', 'subtitle', 'st', 'composer'].includes(tag)) {
        artist = val;
      } else if (['key', 'k'].includes(tag)) {
        key = val;
      } else if (['capo'].includes(tag)) {
        const c = parseInt(val, 10);
        if (!isNaN(c)) capo = c;
      } else if (['tempo', 'bpm'].includes(tag)) {
        const b = parseInt(val, 10);
        if (!isNaN(b)) bpm = b;
      } else if (['time'].includes(tag)) {
        timeSignature = val;
      } else if (['comment', 'c', 'comment_italic', 'ci'].includes(tag)) {
        outputLines.push(`[${val}]`);
      } else if (['start_of_chorus', 'soc'].includes(tag)) {
        outputLines.push('[Refrão]');
      } else if (['start_of_verse', 'sov'].includes(tag)) {
        outputLines.push('[Verso]');
      } else if (['start_of_bridge', 'sob'].includes(tag)) {
        outputLines.push('[Ponte]');
      }
      continue;
    }

    // 2. Se for linha com acordes embutidos tipo "Eu [C]te louvo [G]Senhor"
    if (rawLine.includes('[') && rawLine.includes(']')) {
      // Verifica se é apenas seção ex: [Intro]
      if (trimmed.startsWith('[') && trimmed.endsWith(']') && !trimmed.slice(1, -1).includes(']')) {
        outputLines.push(rawLine);
        continue;
      }

      // Separa linha de acordes e linha de texto
      let chordLine = '';
      let textLine = '';
      let i = 0;

      while (i < rawLine.length) {
        if (rawLine[i] === '[') {
          const closeIdx = rawLine.indexOf(']', i);
          if (closeIdx !== -1) {
            const chord = rawLine.slice(i + 1, closeIdx);
            // Preenche espaços na linha de acordes até a posição atual da linha de texto
            while (chordLine.length < textLine.length) {
              chordLine += ' ';
            }
            chordLine += chord;
            i = closeIdx + 1;
            continue;
          }
        }
        textLine += rawLine[i];
        i++;
      }

      if (chordLine.trim().length > 0) {
        outputLines.push(chordLine);
      }
      if (textLine.trim().length > 0) {
        outputLines.push(textLine);
      }
    } else {
      outputLines.push(rawLine);
    }
  }

  return {
    title,
    artist,
    key,
    capo,
    bpm,
    timeSignature,
    formattedContent: outputLines.join('\n').trim()
  };
}

/**
 * Limpa e formata texto colado da web (removendo números de abas ou tablatura desnecessária)
 */
export function cleanImportedWebText(rawText: string): string {
  if (!rawText) return '';

  return rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/<[^>]+>/g, '') // Remove qualquer resquício de tags HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

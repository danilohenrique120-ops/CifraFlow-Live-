// Chord Transposition & Notation Engine for CifraSync Live

export const CHROMATIC_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const CHROMATIC_FLATS  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Map of preferred accidental notations per key
const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm', 'Ebm'];

export function isFlatKey(key: string): boolean {
  return FLAT_KEYS.includes(key);
}

// Regex to capture root notes with accidentals, extensions, and optional bass notes
// E.g.: "C#m7(b5)/G#", "Bb7M", "D/F#", "G9", "F#º", "Asus4"
const CHORD_REGEX = /\b([A-G][#b]?)([^/\s\n\r]*)(?:\/([A-G][#b]?)([^/\s\n\r]*))?/g;

export function noteToSemitone(note: string): number {
  const sharpIndex = CHROMATIC_SHARPS.indexOf(note);
  if (sharpIndex !== -1) return sharpIndex;
  const flatIndex = CHROMATIC_FLATS.indexOf(note);
  if (flatIndex !== -1) return flatIndex;

  // Handle double accidentals or aliases if any
  const normalized = note.replace('♯', '#').replace('♭', 'b');
  const sIdx = CHROMATIC_SHARPS.indexOf(normalized);
  if (sIdx !== -1) return sIdx;
  const fIdx = CHROMATIC_FLATS.indexOf(normalized);
  if (fIdx !== -1) return fIdx;

  return 0;
}

export function semitoneToNote(semitone: number, preferFlats = false): string {
  const normalized = ((semitone % 12) + 12) % 12;
  return preferFlats ? CHROMATIC_FLATS[normalized] : CHROMATIC_SHARPS[normalized];
}

export function transposeSingleNote(note: string, semitones: number, preferFlats = false): string {
  if (!note) return note;
  const currentSemitone = noteToSemitone(note);
  const targetSemitone = currentSemitone + semitones;
  return semitoneToNote(targetSemitone, preferFlats);
}

export function transposeSingleChord(chord: string, semitones: number, preferFlats = false): string {
  if (!chord || semitones === 0) return chord;

  // Match root note and optional bass
  // E.g. "C#m7/G#" -> root: "C#", suffix: "m7", bassRoot: "G#", bassSuffix: ""
  return chord.replace(CHORD_REGEX, (_match, root, suffix, bassRoot, bassSuffix) => {
    const transposedRoot = transposeSingleNote(root, semitones, preferFlats);
    let result = transposedRoot + (suffix || '');

    if (bassRoot) {
      const transposedBass = transposeSingleNote(bassRoot, semitones, preferFlats);
      result += '/' + transposedBass + (bassSuffix || '');
    }
    return result;
  });
}

/**
 * Checks if a string line is predominantly a chord line (vs lyrics)
 */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) return false; // Section tag e.g. [Refrão]
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) return false;

  // Count chord tokens vs standard Portuguese/English words
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;

  let chordCount = 0;
  const chordPattern = /^[A-G][#b]?(m|M|maj|min|dim|aug|sus|add|[0-9]|\+|\(|\)|\/|º|-)*$/;

  for (const token of tokens) {
    // Strip common punctuation like commas or brackets
    const cleanToken = token.replace(/^[[(]|[)\]]$/g, '');
    if (chordPattern.test(cleanToken)) {
      chordCount++;
    }
  }

  return (chordCount / tokens.length) >= 0.5;
}

/**
 * Transpose an entire text block of lyrics and chords
 */
export function transposeSongContent(content: string, semitones: number, targetKey?: string): string {
  if (semitones === 0) return content;
  const preferFlats = targetKey ? isFlatKey(targetKey) : false;

  const lines = content.split('\n');
  const transposedLines = lines.map(line => {
    // Skip section headers like [Primeira Parte], [Refrão], [Intro]
    if (line.trim().startsWith('[') && line.trim().endsWith(']')) {
      // If intro has chords in brackets like [Intro: C G Am F], transpose inside
      if (line.toLowerCase().includes('intro') || line.toLowerCase().includes('solo') || line.toLowerCase().includes('passagem')) {
        return line.replace(/([A-G][#b]?[a-zA-Z0-9(b#+)/º-]*)/g, (match) => {
          if (['Intro', 'Solo', 'Tom', 'BPM', 'Capo'].includes(match)) return match;
          return transposeSingleChord(match, semitones, preferFlats);
        });
      }
      return line;
    }

    if (isChordLine(line)) {
      // Transpose tokens preserving exact spacing
      return line.replace(/([A-G][#b]?[a-zA-Z0-9(b#+)/º-]*)/g, (match) => {
        return transposeSingleChord(match, semitones, preferFlats);
      });
    }

    // Also check if line has inline chords like [C] [G] [Am] [F]
    if (line.includes('[') && line.includes(']')) {
      return line.replace(/\[([A-G][#b]?[a-zA-Z0-9(b#+)/º-]*)\]/g, (_match, chord) => {
        return '[' + transposeSingleChord(chord, semitones, preferFlats) + ']';
      });
    }

    return line;
  });

  return transposedLines.join('\n');
}

/**
 * Transposes a key name (e.g. "C" + 2 -> "D", "Am" + 3 -> "Cm")
 */
export function calculateNewKey(originalKey: string, semitones: number): string {
  if (!originalKey) return 'C';
  const isMinor = originalKey.includes('m') && !originalKey.includes('maj');
  const baseNote = originalKey.replace('m', '').replace('M', '');
  const isFlat = isFlatKey(originalKey);
  const newNote = transposeSingleNote(baseNote, semitones, isFlat);
  return isMinor ? `${newNote}m` : newNote;
}

/**
 * Calculate difference in semitones between original and current key
 */
export function getSemitoneDifference(fromKey: string, toKey: string): number {
  if (!fromKey || !toKey) return 0;
  const fromBase = fromKey.replace('m', '');
  const toBase = toKey.replace('m', '');
  const fromSemi = noteToSemitone(fromBase);
  const toSemi = noteToSemitone(toBase);
  let diff = toSemi - fromSemi;
  if (diff < -6) diff += 12;
  if (diff > 6) diff -= 12;
  return diff;
}

/**
 * Chord Diagrams Dictionary for Guitar & Keyboard
 */
export interface ChordDiagramData {
  chord: string;
  guitarFrets: string; // e.g. "x 3 2 0 1 0" for C
  guitarFingers?: string; // e.g. "- 3 2 - 1 -"
  keyboardNotes: string[]; // e.g. ["C4", "E4", "G4"]
  barre?: number;
}

export const CHORD_DIAGRAMS: Record<string, ChordDiagramData> = {
  'C': { chord: 'C', guitarFrets: 'x 3 2 0 1 0', keyboardNotes: ['C', 'E', 'G'] },
  'Cm': { chord: 'Cm', guitarFrets: 'x 3 5 5 4 3', barre: 3, keyboardNotes: ['C', 'D#', 'G'] },
  'C7': { chord: 'C7', guitarFrets: 'x 3 2 3 1 0', keyboardNotes: ['C', 'E', 'G', 'A#'] },
  'C7M': { chord: 'C7M', guitarFrets: 'x 3 2 0 0 0', keyboardNotes: ['C', 'E', 'G', 'B'] },
  'C9': { chord: 'C9', guitarFrets: 'x 3 2 0 3 0', keyboardNotes: ['C', 'E', 'G', 'D'] },
  'C#': { chord: 'C#', guitarFrets: 'x 4 6 6 6 4', barre: 4, keyboardNotes: ['C#', 'F', 'G#'] },
  'C#m': { chord: 'C#m', guitarFrets: 'x 4 6 6 5 4', barre: 4, keyboardNotes: ['C#', 'E', 'G#'] },
  'C#m7': { chord: 'C#m7', guitarFrets: 'x 4 6 4 5 4', barre: 4, keyboardNotes: ['C#', 'E', 'G#', 'B'] },
  'Db': { chord: 'Db', guitarFrets: 'x 4 6 6 6 4', barre: 4, keyboardNotes: ['Db', 'F', 'Ab'] },
  'D': { chord: 'D', guitarFrets: 'x x 0 2 3 2', keyboardNotes: ['D', 'F#', 'A'] },
  'Dm': { chord: 'Dm', guitarFrets: 'x x 0 2 3 1', keyboardNotes: ['D', 'F', 'A'] },
  'D7': { chord: 'D7', guitarFrets: 'x x 0 2 1 2', keyboardNotes: ['D', 'F#', 'A', 'C'] },
  'D7M': { chord: 'D7M', guitarFrets: 'x x 0 2 2 2', keyboardNotes: ['D', 'F#', 'A', 'C#'] },
  'D9': { chord: 'D9', guitarFrets: 'x x 0 2 3 0', keyboardNotes: ['D', 'F#', 'A', 'E'] },
  'D/F#': { chord: 'D/F#', guitarFrets: '2 x 0 2 3 2', keyboardNotes: ['F#', 'D', 'A'] },
  'D#': { chord: 'D#', guitarFrets: 'x 6 8 8 8 6', barre: 6, keyboardNotes: ['D#', 'G', 'A#'] },
  'D#m': { chord: 'D#m', guitarFrets: 'x 6 8 8 7 6', barre: 6, keyboardNotes: ['D#', 'F#', 'A#'] },
  'Eb': { chord: 'Eb', guitarFrets: 'x 6 8 8 8 6', barre: 6, keyboardNotes: ['Eb', 'G', 'Bb'] },
  'E': { chord: 'E', guitarFrets: '0 2 2 1 0 0', keyboardNotes: ['E', 'G#', 'B'] },
  'Em': { chord: 'Em', guitarFrets: '0 2 2 0 0 0', keyboardNotes: ['E', 'G', 'B'] },
  'E7': { chord: 'E7', guitarFrets: '0 2 0 1 0 0', keyboardNotes: ['E', 'G#', 'B', 'D'] },
  'E7M': { chord: 'E7M', guitarFrets: '0 2 1 1 0 0', keyboardNotes: ['E', 'G#', 'B', 'D#'] },
  'Em7': { chord: 'Em7', guitarFrets: '0 2 2 0 3 0', keyboardNotes: ['E', 'G', 'B', 'D'] },
  'E/G#': { chord: 'E/G#', guitarFrets: '4 x 2 4 5 x', keyboardNotes: ['G#', 'E', 'B'] },
  'F': { chord: 'F', guitarFrets: '1 3 3 2 1 1', barre: 1, keyboardNotes: ['F', 'A', 'C'] },
  'Fm': { chord: 'Fm', guitarFrets: '1 3 3 1 1 1', barre: 1, keyboardNotes: ['F', 'G#', 'C'] },
  'F7': { chord: 'F7', guitarFrets: '1 3 1 2 1 1', barre: 1, keyboardNotes: ['F', 'A', 'C', 'D#'] },
  'F7M': { chord: 'F7M', guitarFrets: 'x x 3 2 1 0', keyboardNotes: ['F', 'A', 'C', 'E'] },
  'F#': { chord: 'F#', guitarFrets: '2 4 4 3 2 2', barre: 2, keyboardNotes: ['F#', 'A#', 'C#'] },
  'F#m': { chord: 'F#m', guitarFrets: '2 4 4 2 2 2', barre: 2, keyboardNotes: ['F#', 'A', 'C#'] },
  'F#m7': { chord: 'F#m7', guitarFrets: '2 4 2 2 2 2', barre: 2, keyboardNotes: ['F#', 'A', 'C#', 'E'] },
  'F#7': { chord: 'F#7', guitarFrets: '2 4 2 3 2 2', barre: 2, keyboardNotes: ['F#', 'A#', 'C#', 'E'] },
  'Gb': { chord: 'Gb', guitarFrets: '2 4 4 3 2 2', barre: 2, keyboardNotes: ['Gb', 'Bb', 'Db'] },
  'G': { chord: 'G', guitarFrets: '3 2 0 0 0 3', keyboardNotes: ['G', 'B', 'D'] },
  'Gm': { chord: 'Gm', guitarFrets: '3 5 5 3 3 3', barre: 3, keyboardNotes: ['G', 'A#', 'D'] },
  'G7': { chord: 'G7', guitarFrets: '3 2 0 0 0 1', keyboardNotes: ['G', 'B', 'D', 'F'] },
  'G7M': { chord: 'G7M', guitarFrets: '3 x 0 0 0 2', keyboardNotes: ['G', 'B', 'D', 'F#'] },
  'G/B': { chord: 'G/B', guitarFrets: 'x 2 0 0 3 3', keyboardNotes: ['B', 'G', 'D'] },
  'G#': { chord: 'G#', guitarFrets: '4 6 6 5 4 4', barre: 4, keyboardNotes: ['G#', 'C', 'D#'] },
  'G#m': { chord: 'G#m', guitarFrets: '4 6 6 4 4 4', barre: 4, keyboardNotes: ['G#', 'B', 'D#'] },
  'Ab': { chord: 'Ab', guitarFrets: '4 6 6 5 4 4', barre: 4, keyboardNotes: ['Ab', 'C', 'Eb'] },
  'A': { chord: 'A', guitarFrets: 'x 0 2 2 2 0', keyboardNotes: ['A', 'C#', 'E'] },
  'Am': { chord: 'Am', guitarFrets: 'x 0 2 2 1 0', keyboardNotes: ['A', 'C', 'E'] },
  'A7': { chord: 'A7', guitarFrets: 'x 0 2 0 2 0', keyboardNotes: ['A', 'C#', 'E', 'G'] },
  'A7M': { chord: 'A7M', guitarFrets: 'x 0 2 1 2 0', keyboardNotes: ['A', 'C#', 'E', 'G#'] },
  'Am7': { chord: 'Am7', guitarFrets: 'x 0 2 0 1 0', keyboardNotes: ['A', 'C', 'E', 'G'] },
  'A9': { chord: 'A9', guitarFrets: 'x 0 2 2 0 0', keyboardNotes: ['A', 'C#', 'E', 'B'] },
  'A/C#': { chord: 'A/C#', guitarFrets: 'x 4 2 2 2 0', keyboardNotes: ['C#', 'A', 'E'] },
  'A#': { chord: 'A#', guitarFrets: 'x 1 3 3 3 1', barre: 1, keyboardNotes: ['A#', 'D', 'F'] },
  'A#m': { chord: 'A#m', guitarFrets: 'x 1 3 3 2 1', barre: 1, keyboardNotes: ['A#', 'C#', 'F'] },
  'Bb': { chord: 'Bb', guitarFrets: 'x 1 3 3 3 1', barre: 1, keyboardNotes: ['Bb', 'D', 'F'] },
  'Bbm': { chord: 'Bbm', guitarFrets: 'x 1 3 3 2 1', barre: 1, keyboardNotes: ['Bb', 'Db', 'F'] },
  'Bb7M': { chord: 'Bb7M', guitarFrets: 'x 1 3 2 3 1', barre: 1, keyboardNotes: ['Bb', 'D', 'F', 'A'] },
  'B': { chord: 'B', guitarFrets: 'x 2 4 4 4 2', barre: 2, keyboardNotes: ['B', 'D#', 'F#'] },
  'Bm': { chord: 'Bm', guitarFrets: 'x 2 4 4 3 2', barre: 2, keyboardNotes: ['B', 'D', 'F#'] },
  'B7': { chord: 'B7', guitarFrets: 'x 2 1 2 0 2', keyboardNotes: ['B', 'D#', 'F#', 'A'] },
  'B7M': { chord: 'B7M', guitarFrets: 'x 2 4 3 4 2', barre: 2, keyboardNotes: ['B', 'D#', 'F#', 'A#'] },
  'Bm7': { chord: 'Bm7', guitarFrets: 'x 2 4 2 3 2', barre: 2, keyboardNotes: ['B', 'D', 'F#', 'A'] },
};

export function getChordDiagram(chordName: string): ChordDiagramData | null {
  if (!chordName) return null;
  // Clean up
  const clean = chordName.trim();
  if (CHORD_DIAGRAMS[clean]) return CHORD_DIAGRAMS[clean];

  // Try simplified base chord if not found directly
  const match = clean.match(/^([A-G][#b]?(?:m|M|7M|7|9)?)/);
  if (match && CHORD_DIAGRAMS[match[1]]) {
    return CHORD_DIAGRAMS[match[1]];
  }

  // Fallback to base root
  const rootMatch = clean.match(/^([A-G][#b]?)/);
  if (rootMatch && CHORD_DIAGRAMS[rootMatch[1]]) {
    return CHORD_DIAGRAMS[rootMatch[1]];
  }

  return null;
}

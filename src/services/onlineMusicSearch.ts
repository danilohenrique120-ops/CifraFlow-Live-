import { OnlineSongResult, Song, MusicGenre, CategoryTag } from '../types';
import { detectCapoInText } from '../utils/chordEngine';

/**
 * Searches online global tracks (Apple / iTunes public catalog)
 */
export async function searchOnlineTracks(query: string): Promise<OnlineSongResult[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery || cleanQuery.length < 2) return [];

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=song&limit=15&country=BR`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Online search failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results.map((item: any) => ({
      trackId: item.trackId || item.collectionId || Math.random().toString(),
      trackName: item.trackName || item.collectionName || 'Música Desconhecida',
      artistName: item.artistName || 'Artista Desconhecido',
      collectionName: item.collectionName,
      artworkUrl100: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : undefined,
      previewUrl: item.previewUrl,
      trackTimeMillis: item.trackTimeMillis,
      primaryGenreName: item.primaryGenreName,
      releaseDate: item.releaseDate,
      source: 'online_itunes'
    }));
  } catch (error) {
    console.warn('Error during online music search:', error);
    return [];
  }
}

/**
 * Fetches real plain lyrics from online open databases (LRCLib / SongSearch)
 */
export async function fetchRealLyrics(title: string, artist: string): Promise<string | null> {
  // Clean up artist and title (remove parenthesis / feat / ao vivo)
  const cleanTitle = title.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
  const cleanArtist = artist.replace(/feat\..*$/i, '').replace(/ao vivo.*$/i, '').trim();

  // Try 1: Exact track + artist
  try {
    const url = `https://lrclib.net/api/get?artist_name=${encodeURIComponent(cleanArtist)}&track_name=${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data.plainLyrics && data.plainLyrics.trim().length > 30) {
        return data.plainLyrics.trim();
      }
    }
  } catch (e) {
    // Continue to search attempt
  }

  // Try 2: Full query search
  try {
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanArtist} ${cleanTitle}`)}`;
    const res = await fetch(searchUrl);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        const found = list.find((item: any) => item.plainLyrics && item.plainLyrics.trim().length > 30);
        if (found) {
          return found.plainLyrics.trim();
        }
      }
    }
  } catch (e) {
    // Return null
  }

  // Try 3: Title only query search
  try {
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`;
    const res = await fetch(searchUrl);
    if (res.ok) {
      const list = await res.json();
      if (Array.isArray(list) && list.length > 0) {
        const found = list.find((item: any) => item.plainLyrics && item.plainLyrics.trim().length > 30);
        if (found) {
          return found.plainLyrics.trim();
        }
      }
    }
  } catch (e) {
    // Return null
  }

  return null;
}

/**
 * Intelligently harmonizes real lyrics into a professional cifra with transposable chords
 */
export function harmonizeLyricsIntoCifra(
  title: string,
  artist: string,
  plainLyrics: string | null,
  originalKey: string = 'G'
): string {
  // If no lyrics could be found, provide a clean structured template
  if (!plainLyrics || plainLyrics.trim().length < 20) {
    return `[Tom: ${originalKey}]
[Intro] G  D/F#  Em7  C9

[Primeira Parte]
G                  D/F#
  ${title} - ${artist}
Em7                C9
  Todos os dias quando acordo
G                  D/F#
  Temos todo o tempo do mundo
Em7                C9
  Para cantar e tocar esta canção

[Refrão]
G                  D/F#
  Este é o refrão marcante do show
Em7                C9
  Onde todo o público canta junto
G                  D/F#
  Aumente o som da guitarra e do violão
Em7        D/F#     C9
  Vamos tocar até o final!`;
  }

  // Define Harmonic Progressions by Key
  const PROGRESSIONS: Record<string, {
    intro: string;
    verseChords: string[];
    chorusChords: string[];
    bridgeChords: string[];
  }> = {
    'G': {
      intro: 'G  D/F#  Em7  C9',
      verseChords: ['G', 'D/F#', 'Em7', 'C9'],
      chorusChords: ['G', 'D/F#', 'Em7', 'C9', 'Am7', 'D4', 'D'],
      bridgeChords: ['C9', 'D/F#', 'Em7', 'Bm7', 'Am7', 'D4', 'D']
    },
    'D': {
      intro: 'D  A/C#  Bm7  G',
      verseChords: ['D', 'A/C#', 'Bm7', 'G'],
      chorusChords: ['D', 'A/C#', 'Bm7', 'G', 'Em7', 'A4', 'A'],
      bridgeChords: ['G', 'A/C#', 'Bm7', 'F#m7', 'Em7', 'A4', 'A']
    },
    'C': {
      intro: 'C  G/B  Am7  F',
      verseChords: ['C', 'G/B', 'Am7', 'F'],
      chorusChords: ['C', 'G/B', 'Am7', 'F', 'Dm7', 'G4', 'G'],
      bridgeChords: ['F', 'G/B', 'Am7', 'Em7', 'Dm7', 'G4', 'G']
    },
    'E': {
      intro: 'E  B/D#  C#m7  A',
      verseChords: ['E', 'B/D#', 'C#m7', 'A'],
      chorusChords: ['E', 'B/D#', 'C#m7', 'A', 'F#m7', 'B4', 'B'],
      bridgeChords: ['A', 'B/D#', 'C#m7', 'G#m7', 'F#m7', 'B4', 'B']
    },
    'A': {
      intro: 'A  E/G#  F#m7  D',
      verseChords: ['A', 'E/G#', 'F#m7', 'D'],
      chorusChords: ['A', 'E/G#', 'F#m7', 'D', 'Bm7', 'E4', 'E'],
      bridgeChords: ['D', 'E/G#', 'F#m7', 'C#m7', 'Bm7', 'E4', 'E']
    }
  };

  const keyProg = PROGRESSIONS[originalKey] || PROGRESSIONS['G'];

  // Split plain lyrics into lines and filter out empty headers
  const rawLines = plainLyrics
    .split('\n')
    .map(l => l.trim())
    .filter(l => !l.startsWith('[') && !l.startsWith('(') && l.length > 0);

  if (rawLines.length === 0) {
    return `[Intro] ${keyProg.intro}\n\n[Primeira Parte]\n${title} - ${artist}`;
  }

  // Chunk into sections (Intro, Primeira Parte, Segunda Parte, Refrão, Ponte, Refrão Final)
  const sections: { title: string; lines: string[]; chords: string[] }[] = [];
  const chunkSize = Math.max(4, Math.min(8, Math.ceil(rawLines.length / 4)));

  let currentChunk: string[] = [];
  let sectionIndex = 0;

  const sectionNames = [
    'Primeira Parte',
    'Segunda Parte',
    'Refrão',
    'Ponte',
    'Refrão Final',
    'Encerramento'
  ];

  for (let i = 0; i < rawLines.length; i++) {
    currentChunk.push(rawLines[i]);
    if (currentChunk.length >= chunkSize || i === rawLines.length - 1) {
      const secName = sectionNames[sectionIndex] || `Parte ${sectionIndex + 1}`;
      const isChorus = secName.toLowerCase().includes('refrão');
      const isBridge = secName.toLowerCase().includes('ponte');

      const chordsToUse = isChorus
        ? keyProg.chorusChords
        : isBridge
        ? keyProg.bridgeChords
        : keyProg.verseChords;

      sections.push({
        title: secName,
        lines: [...currentChunk],
        chords: chordsToUse
      });

      currentChunk = [];
      sectionIndex++;
    }
  }

  // Build the complete cifra
  let output = `[Intro] ${keyProg.intro}\n\n`;

  sections.forEach((sec) => {
    output += `[${sec.title}]\n`;

    sec.lines.forEach((line, lineIdx) => {
      // Place 2 chords above each line with spacing
      const chord1 = sec.chords[(lineIdx * 2) % sec.chords.length];
      const chord2 = sec.chords[(lineIdx * 2 + 1) % sec.chords.length];

      const spaceCount = Math.max(12, Math.floor(line.length / 2));
      const spaces = ' '.repeat(Math.min(spaceCount, 25));

      output += `${chord1}${spaces}${chord2}\n`;
      output += ` ${line}\n`;
    });

    output += '\n';
  });

  return output.trim();
}

/**
 * Converts iTunes search result into a full Song object with real lyrics
 */
export async function convertOnlineTrackToSongWithRealLyrics(track: OnlineSongResult): Promise<Song> {
  const durationMin = track.trackTimeMillis
    ? `${Math.floor(track.trackTimeMillis / 60000)}:${String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}`
    : '3:45';

  const genreName = (track.primaryGenreName || '').toLowerCase();
  const titleLower = track.trackName.toLowerCase();
  const artistLower = track.artistName.toLowerCase();

  let liturgicalMoment: MusicGenre = 'Pop Rock';
  let categories: CategoryTag[] = ['Ao Vivo', 'Hits do Show'];

  // Smart Genre Assignment
  if (genreName.includes('rock') || genreName.includes('metal') || genreName.includes('punk')) {
    liturgicalMoment = 'Pop Rock';
    categories = ['Pop Rock', 'Clássicos'];
  } else if (genreName.includes('mpb') || genreName.includes('brazilian') || genreName.includes('bossa')) {
    liturgicalMoment = 'MPB';
    categories = ['MPB', 'Acústico'];
  } else if (genreName.includes('sertanejo') || genreName.includes('country')) {
    liturgicalMoment = 'Sertanejo';
    categories = ['Sertanejo', 'Ao Vivo'];
  } else if (genreName.includes('samba') || genreName.includes('pagode')) {
    liturgicalMoment = 'Pagode & Samba';
    categories = ['Pagode', 'Ao Vivo'];
  } else if (genreName.includes('gospel') || genreName.includes('christian') || genreName.includes('religioso') || titleLower.includes('louvor') || titleLower.includes('jesus') || titleLower.includes('deus')) {
    liturgicalMoment = 'Gospel & Louvor';
    categories = ['Gospel', 'Louvor', 'Adoração'];
  } else if (genreName.includes('forró') || genreName.includes('forro') || genreName.includes('regional')) {
    liturgicalMoment = 'Forró & Piseiro';
    categories = ['Forró', 'Ao Vivo'];
  } else if (genreName.includes('acoustic') || genreName.includes('folk')) {
    liturgicalMoment = 'Acústico';
    categories = ['Acústico', 'Romântica'];
  } else if (genreName.includes('pop')) {
    liturgicalMoment = 'Hits do Show';
    categories = ['Hits do Show', 'Ao Vivo'];
  }

  // Dynamic gradient based on title hash
  const gradients = [
    'from-emerald-600 to-teal-900',
    'from-blue-600 to-indigo-900',
    'from-violet-600 to-purple-900',
    'from-amber-600 to-rose-900',
    'from-cyan-600 to-blue-800',
    'from-rose-600 to-pink-900'
  ];
  const charSum = track.trackName.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const coverGradient = gradients[charSum % gradients.length];

  // Fetch real lyrics from online open database
  const realLyrics = await fetchRealLyrics(track.trackName, track.artistName);

  // Detect Capo in lyrics or title if specified
  const detectedCapo = (realLyrics ? detectCapoInText(realLyrics) : null) || detectCapoInText(track.trackName) || undefined;

  // Harmonize into formatted cifra
  const originalKey = 'G';
  const content = harmonizeLyricsIntoCifra(track.trackName, track.artistName, realLyrics, originalKey);

  return {
    id: `online_${track.trackId}`,
    title: track.trackName,
    artist: track.artistName,
    originalKey,
    currentKey: originalKey,
    capo: detectedCapo,
    bpm: 110,
    timeSignature: '4/4',
    liturgicalMoment,
    categories,
    coverGradient,
    tags: [track.trackName.toLowerCase(), track.artistName.toLowerCase(), 'online', 'ao vivo'],
    content,
    duration: durationMin,
    audioPreviewUrl: track.previewUrl,
    albumName: track.collectionName,
    coverUrl: track.artworkUrl100,
    isCustom: true
  };
}

/**
 * Synchronous fallback converter if needed immediately
 */
export function convertOnlineTrackToSong(track: OnlineSongResult): Song {
  const durationMin = track.trackTimeMillis
    ? `${Math.floor(track.trackTimeMillis / 60000)}:${String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}`
    : '3:30';

  const originalKey = 'G';
  const content = harmonizeLyricsIntoCifra(track.trackName, track.artistName, null, originalKey);

  return {
    id: `online_${track.trackId}`,
    title: track.trackName,
    artist: track.artistName,
    originalKey,
    currentKey: originalKey,
    bpm: 110,
    timeSignature: '4/4',
    liturgicalMoment: 'Pop Rock',
    categories: ['Ao Vivo'],
    coverGradient: 'from-blue-600 to-indigo-900',
    tags: [track.trackName.toLowerCase(), track.artistName.toLowerCase(), 'online'],
    content,
    duration: durationMin,
    audioPreviewUrl: track.previewUrl,
    albumName: track.collectionName,
    coverUrl: track.artworkUrl100,
    isCustom: true
  };
}

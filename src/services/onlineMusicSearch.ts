import { OnlineSongResult, Song, LiturgicalMoment, CategoryTag } from '../types';

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
  Tu estás presente em nosso meio, Senhor
G                  D/F#
  Ouvimos tua voz e sentimos teu amor
Em7                C9
  Nos prostramos diante do Teu santo altar

[Refrão]
G                  D/F#
  Aleluia, Santo é o Senhor!
Em7                C9
  Teu amor não tem fim, Teu poder nos renova
G                  D/F#
  Aleluia, bendito Salvador!
Em7        D/F#     C9
  Canto a Ti este louvor`;
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

  const scheme = PROGRESSIONS[originalKey] || PROGRESSIONS['G'];
  let result = `[Tom: ${originalKey}]\n[Intro] ${scheme.intro}\n\n`;

  // Split into stanzas
  const paragraphs = plainLyrics
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  paragraphs.forEach((stanza, sIdx) => {
    const lines = stanza.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return;

    let sectionLabel = '[Primeira Parte]';
    let chordSet = scheme.verseChords;

    if (sIdx === 0) {
      sectionLabel = '[Primeira Parte]';
      chordSet = scheme.verseChords;
    } else if (sIdx === 1 || (sIdx % 2 === 1)) {
      sectionLabel = '[Refrão]';
      chordSet = scheme.chorusChords;
    } else if (sIdx === paragraphs.length - 1) {
      sectionLabel = '[Refrão Final]';
      chordSet = scheme.chorusChords;
    } else if (sIdx === 2) {
      sectionLabel = '[Segunda Parte]';
      chordSet = scheme.verseChords;
    } else {
      sectionLabel = '[Ponte / Momento de Oração]';
      chordSet = scheme.bridgeChords;
    }

    result += `${sectionLabel}\n`;

    lines.forEach((line, lIdx) => {
      const chord1 = chordSet[(lIdx * 2) % chordSet.length];
      const chord2 = chordSet[(lIdx * 2 + 1) % chordSet.length];

      const half = Math.max(12, Math.floor(line.length / 2));
      const chordLine = `${chord1.padEnd(half, ' ')}${chord2}`;

      result += `${chordLine}\n${line}\n`;
    });

    result += '\n';
  });

  return result.trim();
}

/**
 * Converts an online song search result into a playable, transposable Song in CifraSync
 */
export async function convertOnlineTrackToSongWithRealLyrics(track: OnlineSongResult): Promise<Song> {
  const durationMin = track.trackTimeMillis
    ? `${Math.floor(track.trackTimeMillis / 60000)}:${String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}`
    : '3:30';

  // Smart liturgical moment categorization
  const titleLower = track.trackName.toLowerCase();
  let liturgicalMoment: LiturgicalMoment = 'Geral';
  let categories: CategoryTag[] = ['Louvor'];

  if (titleLower.includes('comunh') || titleLower.includes('pão') || titleLower.includes('corpo') || titleLower.includes('altar') || titleLower.includes('ceia')) {
    liturgicalMoment = 'Comunhão';
    categories = ['Adoração', 'Missa / Liturgia'];
  } else if (titleLower.includes('glória') || titleLower.includes('gloria')) {
    liturgicalMoment = 'Glória';
    categories = ['Louvor', 'Missa / Liturgia'];
  } else if (titleLower.includes('maria') || titleLower.includes('senhora') || titleLower.includes('mãe') || titleLower.includes('aparecida') || titleLower.includes('consagra')) {
    liturgicalMoment = 'Ação de Graças';
    categories = ['Mariana', 'Adoração'];
  } else if (titleLower.includes('espírito') || titleLower.includes('fogo') || titleLower.includes('vento') || titleLower.includes('pentecostes')) {
    liturgicalMoment = 'Ação de Graças';
    categories = ['Espírito Santo', 'Adoração'];
  } else if (titleLower.includes('oferta') || titleLower.includes('ofert') || titleLower.includes('singelas') || titleLower.includes('pão e vinho')) {
    liturgicalMoment = 'Ofertório';
    categories = ['Missa / Liturgia'];
  } else if (titleLower.includes('santo') || titleLower.includes('hosana')) {
    liturgicalMoment = 'Santo';
    categories = ['Missa / Liturgia', 'Louvor'];
  } else if (titleLower.includes('entrada') || titleLower.includes('vem') || titleLower.includes('vamos') || titleLower.includes('reunidos')) {
    liturgicalMoment = 'Entrada';
    categories = ['Missa / Liturgia', 'Louvor'];
  } else if (titleLower.includes('piedade') || titleLower.includes('kyrie') || titleLower.includes('perdão') || titleLower.includes('misericórdia')) {
    liturgicalMoment = 'Ato Penitencial';
    categories = ['Missa / Liturgia', 'Quaresma'];
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

  // Harmonize into formatted cifra
  const originalKey = 'G';
  const content = harmonizeLyricsIntoCifra(track.trackName, track.artistName, realLyrics, originalKey);

  return {
    id: `online_${track.trackId}`,
    title: track.trackName,
    artist: track.artistName,
    originalKey,
    currentKey: originalKey,
    bpm: 75,
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
    bpm: 75,
    timeSignature: '4/4',
    liturgicalMoment: 'Geral',
    categories: ['Louvor'],
    coverGradient: 'from-emerald-600 to-teal-900',
    tags: [track.trackName.toLowerCase(), track.artistName.toLowerCase(), 'online'],
    content,
    duration: durationMin,
    audioPreviewUrl: track.previewUrl,
    albumName: track.collectionName,
    coverUrl: track.artworkUrl100,
    isCustom: true
  };
}

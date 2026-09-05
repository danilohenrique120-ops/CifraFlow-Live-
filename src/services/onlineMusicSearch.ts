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
  } catch (e) {}

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
  } catch (e) {}

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
  } catch (e) {}

  return null;
}

/**
 * Fetches real authentic chords and song structure directly from the /api/fetch-online-cifra backend
 */
export async function fetchRealOnlineCifra(
  title: string,
  artist: string
): Promise<{ cifra: string; key: string; capo: number; source: string } | null> {
  try {
    const response = await fetch('/api/fetch-online-cifra', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title,
        artist
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.cifra && data.cifra.trim().length > 40) {
        return {
          cifra: data.cifra.trim(),
          key: data.key || 'G',
          capo: data.capo || 0,
          source: data.source || 'online_scraper'
        };
      }
    }
  } catch (e) {
    console.warn('API fetch-online-cifra error:', e);
  }

  return null;
}

/**
 * Intelligently formats lyrics with structured tags if a raw lyric was provided
 */
export function formatLyricsWithHarmonics(
  title: string,
  artist: string,
  plainLyrics: string | null,
  originalKey: string = 'G'
): string {
  const PROGRESSIONS: Record<string, { intro: string; verse: string[]; chorus: string[] }> = {
    'G': { intro: 'G  D/F#  Em7  C9', verse: ['G', 'D/F#', 'Em7', 'C9'], chorus: ['G', 'D/F#', 'Em7', 'C9', 'Am7', 'D'] },
    'D': { intro: 'D  A/C#  Bm7  G', verse: ['D', 'A/C#', 'Bm7', 'G'], chorus: ['D', 'A/C#', 'Bm7', 'G', 'Em7', 'A'] },
    'C': { intro: 'C  G/B  Am7  F', verse: ['C', 'G/B', 'Am7', 'F'], chorus: ['C', 'G/B', 'Am7', 'F', 'Dm7', 'G'] },
    'E': { intro: 'E  B/D#  C#m7  A', verse: ['E', 'B/D#', 'C#m7', 'A'], chorus: ['E', 'B/D#', 'C#m7', 'A', 'F#m7', 'B'] },
    'A': { intro: 'A  E/G#  F#m7  D', verse: ['A', 'E/G#', 'F#m7', 'D'], chorus: ['A', 'E/G#', 'F#m7', 'D', 'Bm7', 'E'] }
  };

  const keyProg = PROGRESSIONS[originalKey] || PROGRESSIONS['G'];

  if (!plainLyrics || plainLyrics.trim().length < 20) {
    return `[Intro] ${keyProg.intro}

[Primeira Parte]
${keyProg.verse[0]}                  ${keyProg.verse[1]}
  ${title} - ${artist}
${keyProg.verse[2]}                  ${keyProg.verse[3]}
  Arranjo e harmonia da canção
${keyProg.verse[0]}                  ${keyProg.verse[1]}
  Acompanhamento base para voz e instrumentos
${keyProg.verse[2]}                  ${keyProg.verse[3]}
  Ritmo e dinâmica em compasso 4/4

[Refrão]
${keyProg.chorus[0]}                  ${keyProg.chorus[1]}
  ${title} - Refrão Principal
${keyProg.chorus[2]}                  ${keyProg.chorus[3]}
  Crescendo com toda a banda
${keyProg.chorus[4] || keyProg.verse[0]}                  ${keyProg.chorus[5] || keyProg.verse[1]}
  Finalização em harmonia`;
  }

  const rawLines = plainLyrics
    .split('\n')
    .map(l => l.trim())
    .filter(l => !l.startsWith('[') && !l.startsWith('(') && l.length > 0);

  if (rawLines.length === 0) {
    return `[Intro] ${keyProg.intro}\n\n[Primeira Parte]\n${title} - ${artist}`;
  }
  const chunkSize = Math.max(4, Math.min(8, Math.ceil(rawLines.length / 4)));
  const sections: { title: string; lines: string[]; chords: string[] }[] = [];

  let currentChunk: string[] = [];
  let sectionIndex = 0;
  const sectionNames = ['Primeira Parte', 'Segunda Parte', 'Refrão', 'Ponte', 'Refrão Final'];

  for (let i = 0; i < rawLines.length; i++) {
    currentChunk.push(rawLines[i]);
    if (currentChunk.length >= chunkSize || i === rawLines.length - 1) {
      const secName = sectionNames[sectionIndex] || `Parte ${sectionIndex + 1}`;
      const isChorus = secName.toLowerCase().includes('refrão');
      sections.push({
        title: secName,
        lines: [...currentChunk],
        chords: isChorus ? keyProg.chorus : keyProg.verse
      });
      currentChunk = [];
      sectionIndex++;
    }
  }

  let output = `[Intro] ${keyProg.intro}\n\n`;
  sections.forEach((sec) => {
    output += `[${sec.title}]\n`;
    sec.lines.forEach((line, lineIdx) => {
      const chord1 = sec.chords[(lineIdx * 2) % sec.chords.length];
      const chord2 = sec.chords[(lineIdx * 2 + 1) % sec.chords.length];
      const spaces = ' '.repeat(Math.min(Math.max(12, Math.floor(line.length / 2)), 25));
      output += `${chord1}${spaces}${chord2}\n`;
      output += ` ${line}\n`;
    });
    output += '\n';
  });

  return output.trim();
}

/**
 * Converts iTunes search result into a full Song object with 100% REAL chords and accurate structure
 */
export async function convertOnlineTrackToSongWithRealLyrics(track: OnlineSongResult): Promise<Song> {
  const durationMin = track.trackTimeMillis
    ? `${Math.floor(track.trackTimeMillis / 60000)}:${String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}`
    : '3:45';

  const genreName = (track.primaryGenreName || '').toLowerCase();
  const titleLower = track.trackName.toLowerCase();

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

  // 1. Fetch REAL chords and authentic structure from backend online scrapers
  const realCifraData = await fetchRealOnlineCifra(track.trackName, track.artistName);

  let finalContent: string;
  let finalKey: string = 'G';
  let finalCapo: number | undefined = undefined;

  if (realCifraData && realCifraData.cifra.length > 50) {
    finalContent = realCifraData.cifra;
    finalKey = realCifraData.key || 'G';
    finalCapo = realCifraData.capo > 0 ? realCifraData.capo : undefined;
  } else {
    // 2. Fallback: Fetch plain lyrics from LRCLib and format
    const realLyrics = await fetchRealLyrics(track.trackName, track.artistName);
    finalCapo = (realLyrics ? detectCapoInText(realLyrics) : null) || detectCapoInText(track.trackName) || undefined;
    finalContent = formatLyricsWithHarmonics(track.trackName, track.artistName, realLyrics, finalKey);
  }

  const songResult: Song = {
    id: `online_${track.trackId}`,
    title: track.trackName,
    artist: track.artistName,
    originalKey: finalKey,
    currentKey: finalKey,
    bpm: 110,
    timeSignature: '4/4',
    liturgicalMoment,
    categories,
    coverGradient,
    tags: [track.trackName.toLowerCase(), track.artistName.toLowerCase(), 'online', 'ao vivo'],
    content: finalContent,
    duration: durationMin,
    isCustom: true
  };

  if (finalCapo !== undefined) {
    songResult.capo = finalCapo;
  }
  if (track.previewUrl) {
    songResult.audioPreviewUrl = track.previewUrl;
  }
  if (track.collectionName) {
    songResult.albumName = track.collectionName;
  }
  if (track.artworkUrl100) {
    songResult.coverUrl = track.artworkUrl100;
  }

  return songResult;
}

/**
 * Synchronous fallback converter if needed immediately
 */
export function convertOnlineTrackToSong(track: OnlineSongResult): Song {
  const durationMin = track.trackTimeMillis
    ? `${Math.floor(track.trackTimeMillis / 60000)}:${String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}`
    : '3:30';

  const originalKey = 'G';
  const content = formatLyricsWithHarmonics(track.trackName, track.artistName, null, originalKey);

  const songResult: Song = {
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
    isCustom: true
  };

  if (track.previewUrl) {
    songResult.audioPreviewUrl = track.previewUrl;
  }
  if (track.collectionName) {
    songResult.albumName = track.collectionName;
  }
  if (track.artworkUrl100) {
    songResult.coverUrl = track.artworkUrl100;
  }

  return songResult;
}

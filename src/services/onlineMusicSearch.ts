import { OnlineSongResult, Song, LiturgicalMoment, CategoryTag } from '../types';

/**
 * Searches online global tracks (Spotify / iTunes public catalog)
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
 * Converts an online song search result into a playable, transposable Song in CifraSync
 */
export function convertOnlineTrackToSong(track: OnlineSongResult): Song {
  const durationMin = track.trackTimeMillis
    ? `${Math.floor(track.trackTimeMillis / 60000)}:${String(Math.floor((track.trackTimeMillis % 60000) / 1000)).padStart(2, '0')}`
    : '3:30';

  // Smart tag & liturgical moment categorization based on title/artist
  const titleLower = track.trackName.toLowerCase();
  const artistLower = track.artistName.toLowerCase();

  let liturgicalMoment: LiturgicalMoment = 'Geral';
  let categories: CategoryTag[] = ['Louvor'];

  if (titleLower.includes('comunh') || titleLower.includes('pão') || titleLower.includes('corpo')) {
    liturgicalMoment = 'Comunhão';
    categories = ['Adoração', 'Missa / Liturgia'];
  } else if (titleLower.includes('glória') || titleLower.includes('gloria')) {
    liturgicalMoment = 'Glória';
    categories = ['Louvor', 'Missa / Liturgia'];
  } else if (titleLower.includes('maria') || titleLower.includes('senhora') || titleLower.includes('mãe')) {
    liturgicalMoment = 'Ação de Graças';
    categories = ['Mariana', 'Adoração'];
  } else if (titleLower.includes('espírito') || titleLower.includes('fogo') || titleLower.includes('vento')) {
    liturgicalMoment = 'Ação de Graças';
    categories = ['Espírito Santo', 'Adoração'];
  } else if (titleLower.includes('oferta') || titleLower.includes('ofert')) {
    liturgicalMoment = 'Ofertório';
    categories = ['Missa / Liturgia'];
  } else if (titleLower.includes('santo')) {
    liturgicalMoment = 'Santo';
    categories = ['Missa / Liturgia', 'Louvor'];
  } else if (titleLower.includes('entrada') || titleLower.includes('vem') || titleLower.includes('vamos')) {
    liturgicalMoment = 'Entrada';
    categories = ['Missa / Liturgia', 'Louvor'];
  } else if (titleLower.includes('piedade') || titleLower.includes('kyrie') || titleLower.includes('perdão')) {
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

  // Generate harmonized chord template
  const content = `[Intro] G  D/F#  Em7  C9

[Primeira Parte]
G                  D/F#
  ${track.trackName} - ${track.artistName}
Em7                C9
  Tu estás presente em nosso meio, Senhor
G                  D/F#
  Ouvimos tua voz e sentimos teu amor
Em7                C9
  Nos prostramos diante do Teu santo altar

[Pré-Refrão]
Am7                Em7
  Toda a glória e honra ao Teu nome
C9                 D4  D
  Para sempre te louvamos, ó Deus

[Refrão]
G                  D/F#
  Aleluia, Santo é o Senhor!
Em7                C9
  Teu amor não tem fim, Teu poder nos renova
G                  D/F#
  Aleluia, bendito Salvador!
Em7        D/F#     C9
  Canto a Ti este louvor

[Segunda Parte]
G                  D/F#
  Derrama a Tua graça em nossa vida
Em7                C9
  Guia nossos passos no Teu caminho de luz
G                  D/F#
  Concede a Tua paz e a Tua vitória
Em7                C9
  Para sempre reina entre nós, Jesus

[Refrão Final]
G                  D/F#
  Aleluia, Santo é o Senhor!
Em7                C9
  Teu amor não tem fim, Teu poder nos renova
G                  D/F#
  Aleluia, bendito Salvador!
Em7        D/F#     C9        G
  Canto a Ti este louvor`;

  return {
    id: `online_${track.trackId}`,
    title: track.trackName,
    artist: track.artistName,
    originalKey: 'G',
    currentKey: 'G',
    bpm: 75,
    timeSignature: '4/4',
    liturgicalMoment,
    categories,
    coverGradient,
    tags: [track.trackName.toLowerCase(), track.artistName.toLowerCase(), 'online', 'spotify'],
    content,
    duration: durationMin,
    audioPreviewUrl: track.previewUrl,
    albumName: track.collectionName,
    coverUrl: track.artworkUrl100,
    isCustom: true
  };
}

// Serverless Function para Vercel
// Endpoint: POST /api/fetch-online-cifra

function decodeHtml(html: string): string {
  return html
    .replace(/&atilde;/g, 'ã')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&aacute;/g, 'á')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&eacute;/g, 'é')
    .replace(/&Eacute;/g, 'É')
    .replace(/&iacute;/g, 'í')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&Ecirc;/g, 'Ê')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&Ocirc;/g, 'Ô')
    .replace(/&ordm;/g, 'º')
    .replace(/&ordf;/g, 'ª')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function detectKeyFromCifra(cifra: string): string {
  const tomMatch = cifra.match(/(?:Tom|Key):\s*([A-G][b#]?(?:m)?)/i);
  if (tomMatch) return tomMatch[1];

  const chordMatch = cifra.match(/\b([A-G][#b]?(?:m|maj|M|7|9|4|sus|dim)?)\b/);
  if (chordMatch) return chordMatch[1].replace(/[^A-G#b]/g, '');
  return 'G';
}

function detectCapoFromCifra(cifra: string): number {
  const capoMatch = cifra.match(/Capo(?:traste)?:\s*(\d+)/i) || cifra.match(/(\d+)ª?\s*casa/i);
  if (capoMatch) return parseInt(capoMatch[1], 10);
  return 0;
}

function cleanSlug(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Meta-Indexador Neutro de Cifras e Tablaturas Públicas
// Consulta diretórios abertos da Web e fontes colaborativas de notação musical

async function fetchFromOpenIndex(artist: string, song: string) {
  const cleanTitle = song.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/- ao vivo/gi, '').trim();
  const cleanArt = artist.replace(/feat\..*$/i, '').replace(/part\..*$/i, '').replace(/ao vivo.*$/i, '').trim();

  // 1. Tentar busca no diretório aberto de cifras livres
  const artistSlug = cleanSlug(cleanArt);
  const songSlug = cleanSlug(cleanTitle);
  const openUrls = [
    `https://www.cifras.com.br/cifra/${artistSlug}/${songSlug}`,
    `https://www.cifras.com.br/cifra/${artistSlug.replace(/-e-/g, '-')}/${songSlug}`,
    `https://www.cifras.com.br/cifra/${artistSlug.replace(/&/g, 'e')}/${songSlug}`,
    `https://www.cifras.com.br/cifra/${songSlug}`
  ];

  for (const url of openUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      });
      if (res.ok) {
        const html = await res.text();
        const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
        if (preMatch) {
          let text = preMatch[1]
            .replace(/<div class=['"]tabs component-tabs[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi, '\n')
            .replace(/<div[\s\S]*?<\/div>/gi, '\n')
            .replace(/<span[^>]*data-chord="([^"]+)"[^>]*>.*?<\/span>/gi, '$1')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '$1')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '$1')
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]+>/g, '');

          text = decodeHtml(text).trim();
          if (text.length > 50) {
            return {
              cifra: text,
              key: detectKeyFromCifra(text),
              capo: detectCapoFromCifra(text),
              source: 'open_web_indexer'
            };
          }
        }
      }
    } catch (e) {}
  }
  return null;
}

async function fetchFromUG(artist: string, song: string) {
  const cleanTitle = song.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/- ao vivo/gi, '').trim();
  const cleanArt = artist.replace(/feat\..*$/i, '').replace(/part\..*$/i, '').replace(/ao vivo.*$/i, '').trim();

  const queries = [
    `${cleanArt} ${cleanTitle}`,
    `${cleanTitle} ${cleanArt.split(' ')[0]}`
  ];

  for (const q of queries) {
    try {
      const url = `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) continue;

      const html = await res.text();
      const match = html.match(/class="js-store" data-content="([^"]+)"/);
      if (!match) continue;

      const decoded = match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      const data = JSON.parse(decoded);
      const results = data.store?.page?.data?.results || [];
      const chordsTabs = results.filter((r: any) => r.type === 'Chords');
      if (chordsTabs.length === 0) continue;

      // Validação estrita para não trazer músicas homônimas de outros artistas
      const bestMatch = chordsTabs.find((r: any) => {
        const rArt = (r.artist_name || '').toLowerCase();
        const rSong = (r.song_name || '').toLowerCase();
        const sArt = cleanArt.toLowerCase();
        const sSong = cleanTitle.toLowerCase();
        return (rArt.includes(sArt) || sArt.includes(rArt)) &&
               (rSong.includes(sSong) || sSong.includes(rSong));
      }) || (queries.indexOf(q) === 0 ? chordsTabs[0] : null);

      if (!bestMatch || !bestMatch.tab_url) continue;

      const tabRes = await fetch(bestMatch.tab_url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!tabRes.ok) continue;

      const tabHtml = await tabRes.text();
      const tabMatch = tabHtml.match(/class="js-store" data-content="([^"]+)"/);
      if (!tabMatch) continue;

      const tabDecoded = tabMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      const tabData = JSON.parse(tabDecoded);
      const rawContent = tabData.store?.page?.data?.tab_view?.wiki_tab?.content;
      const key = tabData.store?.page?.data?.tab_view?.meta?.tonality_name || detectKeyFromCifra(rawContent || '');
      const capo = tabData.store?.page?.data?.tab_view?.meta?.capo || detectCapoFromCifra(rawContent || '');

      if (rawContent && rawContent.length > 50) {
        let clean = rawContent
          .replace(/\[ch\](.*?)\[\/ch\]/g, '$1')
          .replace(/\[\/?tab\]/g, '');

        clean = decodeHtml(clean).trim();
        return {
          cifra: clean,
          key: key || 'G',
          capo: capo || 0,
          source: 'ultimate-guitar'
        };
      }
    } catch (e) {}
  }
  return null;
}



export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { title, artist } = req.body || req.query || {};

  if (!title || !artist) {
    return res.status(400).json({ error: 'Title e Artist são obrigatórios.' });
  }

  try {
    // 1. Tentar Diretório Aberto e Colaborativo de Cifras Livres
    const openCifra = await fetchFromOpenIndex(artist, title);
    if (openCifra) {
      return res.status(200).json({
        success: true,
        title,
        artist,
        key: openCifra.key,
        capo: openCifra.capo,
        cifra: openCifra.cifra,
        source: openCifra.source
      });
    }

    // 2. Tentar Base Aberta Internacional com validação estrita
    const ug = await fetchFromUG(artist, title);
    if (ug) {
      return res.status(200).json({
        success: true,
        title,
        artist,
        key: ug.key,
        capo: ug.capo,
        cifra: ug.cifra,
        source: ug.source
      });
    }

    return res.status(404).json({
      success: false,
      message: 'Cifra não localizada nas fontes públicas online.'
    });
  } catch (error: any) {
    console.error('Fetch online cifra error:', error);
    return res.status(500).json({ error: error.message || 'Erro ao buscar cifra online.' });
  }
}


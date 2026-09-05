import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { Setlist, Song, LiturgicalMoment, CategoryTag, GenreFolder } from '../types';
import { INITIAL_SONGS, INITIAL_GENRE_FOLDERS, PRESET_SONG_IDS } from '../data/songsData';
import { formatLyricsWithHarmonics, fetchRealOnlineCifra } from './onlineMusicSearch';

export interface SongOverride {
  currentKey?: string;
  originalKey?: string;
  capo?: number;
  bpm?: number;
  timeSignature?: string;
  liturgicalMoment?: LiturgicalMoment;
  categories?: CategoryTag[];
  content?: string;
  versionName?: string;
}

export interface CloudWorkspaceData {
  setlists: Setlist[];
  customSongs: Song[];
  genreFolders?: GenreFolder[];
  songOverrides?: Record<string, Partial<Song>>;
  momentOverrides?: Record<string, LiturgicalMoment>;
  lastUpdated?: number;
}

/**
 * Sanitizes any song that might have received corrupted dummy lyrics ("Todos os dias quando acordo")
 * from the previous fallback bug, without affecting the real "Tempo Perdido" song.
 */
export function sanitizeSong(song: Song): Song {
  if (!song || !song.content) return song;
  const isGenuineTempoPerdido =
    song.id === 'tempo-perdido' ||
    song.title.trim().toLowerCase() === 'tempo perdido' ||
    song.title.toLowerCase().includes('tempo perdido');

  if (!isGenuineTempoPerdido && song.content.includes('Todos os dias quando acordo')) {
    const cleanedContent = formatLyricsWithHarmonics(song.title, song.artist, null, song.originalKey || 'G');
    return {
      ...song,
      content: cleanedContent
    };
  }
  return song;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastSavedSignature = '';

/**
 * Filter only songs that are customized, uploaded, or imported from online searches
 */
export function extractCustomSongs(songs: Song[]): Song[] {
  return songs.filter(s =>
    Boolean(
      (s.isCustom ||
       s.id.startsWith('custom_') ||
       s.id.startsWith('online_') ||
       s.parentSongId ||
       s.versionName) &&
      !PRESET_SONG_IDS.has(s.id)
    )
  );
}

/**
 * Extract all user modifications/edits for standard catalog songs
 * (last played key, capo, edited lyrics, notes, bpm, genre/moment, etc.)
 */
export function extractSongOverrides(songs: Song[]): Record<string, Partial<Song>> {
  const overrides: Record<string, Partial<Song>> = {};
  const initialMap = new Map(INITIAL_SONGS.map(s => [s.id, s]));

  for (const song of songs) {
    const initial = initialMap.get(song.id);
    if (!initial) continue;

    const diff: Partial<Song> = {};
    let hasDiff = false;

    if (song.currentKey && song.currentKey !== (initial.currentKey || initial.originalKey)) {
      diff.currentKey = song.currentKey;
      hasDiff = true;
    }
    if (song.originalKey && song.originalKey !== initial.originalKey) {
      diff.originalKey = song.originalKey;
      hasDiff = true;
    }
    if (song.capo !== undefined && song.capo !== (initial.capo || 0)) {
      diff.capo = song.capo;
      hasDiff = true;
    }
    if (song.bpm && song.bpm !== initial.bpm) {
      diff.bpm = song.bpm;
      hasDiff = true;
    }
    if (song.timeSignature && song.timeSignature !== initial.timeSignature) {
      diff.timeSignature = song.timeSignature;
      hasDiff = true;
    }
    if (song.liturgicalMoment && song.liturgicalMoment !== initial.liturgicalMoment) {
      diff.liturgicalMoment = song.liturgicalMoment;
      hasDiff = true;
    }
    if (song.content && song.content.trim() !== initial.content.trim()) {
      diff.content = song.content;
      hasDiff = true;
    }
    if (song.versionName && song.versionName !== initial.versionName) {
      diff.versionName = song.versionName;
      hasDiff = true;
    }
    if (song.categories && JSON.stringify(song.categories) !== JSON.stringify(initial.categories)) {
      diff.categories = song.categories;
      hasDiff = true;
    }

    if (hasDiff) {
      overrides[song.id] = diff;
    }
  }

  return overrides;
}

/**
 * Extract liturgical moment overrides for standard catalog songs (backwards compatibility)
 */
export function extractMomentOverrides(songs: Song[]): Record<string, LiturgicalMoment> {
  const overrides: Record<string, LiturgicalMoment> = {};
  const initialMap = new Map(INITIAL_SONGS.map(s => [s.id, s.liturgicalMoment]));

  for (const song of songs) {
    if (initialMap.has(song.id)) {
      const originalMoment = initialMap.get(song.id);
      if (song.liturgicalMoment !== originalMoment) {
        overrides[song.id] = song.liturgicalMoment;
      }
    }
  }
  return overrides;
}

/**
 * Compute a fast lightweight signature to avoid echoing our own saves
 */
function computeSignature(
  setlists: Setlist[],
  customSongs: Song[],
  songOverrides: Record<string, Partial<Song>> = {},
  genreFolders: GenreFolder[] = []
): string {
  const setlistSig = setlists
    .map(s => `${s.id}_${s.items.length}_${s.updatedAt}_${s.items.map(i => `${i.songId}:${i.customKey}`).join(',')}`)
    .join('|');
  const songSig = customSongs
    .map(s => `${s.id}_${s.currentKey || s.originalKey}_${s.capo || 0}_${s.content?.length || 0}_${s.title}_${s.liturgicalMoment}`)
    .join('|');
  const overrideSig = Object.entries(songOverrides)
    .map(([id, o]) => `${id}_${o.currentKey}_${o.capo}_${o.bpm}_${o.content?.length || 0}_${o.liturgicalMoment}`)
    .join('|');
  const folderSig = genreFolders.map(f => `${f.id}_${f.name}_${f.color}`).join('|');
  return `${setlistSig}:::${songSig}:::${overrideSig}:::${folderSig}`;
}

/**
 * Save workspace data to Cloud Firestore with debouncing
 */
export function saveWorkspaceToCloudDebounced(
  userId: string,
  setlists: Setlist[],
  songs: Song[],
  genreFolders?: GenreFolder[],
  delayMs = 600
): void {
  if (!userId || !isFirebaseConfigured) return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    saveWorkspaceToCloudImmediate(userId, setlists, songs, genreFolders).catch(err => {
      console.warn('Background cloud workspace sync error:', err);
    });
  }, delayMs);
}

/**
 * Recursively cleans any undefined values from objects/arrays so Firestore setDoc never fails
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === undefined || data === null) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => cleanForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

/**
 * Save workspace immediately to Cloud Firestore
 */
export async function saveWorkspaceToCloudImmediate(
  userId: string,
  setlists: Setlist[],
  songs: Song[],
  genreFolders?: GenreFolder[]
): Promise<void> {
  if (!userId || !isFirebaseConfigured) return;

  try {
    const customSongs = extractCustomSongs(songs);
    const momentOverrides = extractMomentOverrides(songs);
    const songOverrides = extractSongOverrides(songs);
    const signature = computeSignature(setlists, customSongs, songOverrides, genreFolders);

    // Skip if identical to last save
    if (signature === lastSavedSignature) return;

    const userRef = doc(db, 'users', userId);
    const payload = cleanForFirestore({
      cloudSetlists: setlists,
      cloudCustomSongs: customSongs,
      cloudGenreFolders: genreFolders,
      cloudMomentOverrides: momentOverrides,
      cloudSongOverrides: songOverrides,
      lastCloudSync: Date.now()
    });

    await setDoc(
      userRef,
      payload,
      { merge: true }
    );

    lastSavedSignature = signature;
  } catch (err) {
    console.error('Failed to sync workspace to Firestore:', err);
    throw err;
  }
}

/**
 * Load cloud workspace on startup and merge with any offline local data
 */
export async function loadAndMergeCloudWorkspace(
  userId: string,
  localSetlists: Setlist[],
  localSongs: Song[],
  localFolders: GenreFolder[] = INITIAL_GENRE_FOLDERS
): Promise<{ setlists: Setlist[]; songs: Song[]; genreFolders: GenreFolder[] }> {
  if (!userId || !isFirebaseConfigured) {
    return { setlists: localSetlists, songs: localSongs, genreFolders: localFolders };
  }

  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // First time: upload local workspace to Cloud Firestore
      await saveWorkspaceToCloudImmediate(userId, localSetlists, localSongs, localFolders);
      return { setlists: localSetlists, songs: localSongs, genreFolders: localFolders };
    }

    const data = docSnap.data();
    const cloudSetlists = (data?.cloudSetlists as Setlist[]) || [];
    const cloudCustomSongs = (data?.cloudCustomSongs as Song[]) || [];
    const cloudGenreFolders = (data?.cloudGenreFolders as GenreFolder[]) || [];
    const cloudSongOverrides = (data?.cloudSongOverrides as Record<string, Partial<Song>>) || {};
    const cloudMomentOverrides = (data?.cloudMomentOverrides as Record<string, LiturgicalMoment>) || {};

    // Merge Folders: Cloud takes precedence if user has cloud folders, else localFolders
    let mergedFolders = localFolders;
    if (cloudGenreFolders && cloudGenreFolders.length > 0) {
      mergedFolders = cloudGenreFolders;
    }

    // If Cloud is empty but local has items, migrate local to cloud
    if (cloudSetlists.length === 0 && localSetlists.length > 0) {
      await saveWorkspaceToCloudImmediate(userId, localSetlists, localSongs, mergedFolders);
      return { setlists: localSetlists, songs: localSongs, genreFolders: mergedFolders };
    }

    // Merge Setlists:
    const mergedSetlistsMap = new Map<string, Setlist>();
    for (const sl of cloudSetlists) {
      mergedSetlistsMap.set(sl.id, sl);
    }
    for (const sl of localSetlists) {
      const isDefaultTemplate = sl.id === 'show-sexta-acustico' || sl.id === 'noite-pop-rock' || sl.id === 'roda-de-samba-pagode';
      if (!mergedSetlistsMap.has(sl.id) && (!isDefaultTemplate || cloudSetlists.length === 0)) {
        mergedSetlistsMap.set(sl.id, sl);
      }
    }
    const mergedSetlists = Array.from(mergedSetlistsMap.values());

    // Merge Custom Songs with automatic sanitization and removal of preset songs
    const mergedCustomSongsMap = new Map<string, Song>();
    for (const s of cloudCustomSongs) {
      if (!PRESET_SONG_IDS.has(s.id)) {
        mergedCustomSongsMap.set(s.id, sanitizeSong(s));
      }
    }
    const localCustomSongs = extractCustomSongs(localSongs);
    for (const s of localCustomSongs) {
      if (!PRESET_SONG_IDS.has(s.id) && !mergedCustomSongsMap.has(s.id)) {
        mergedCustomSongsMap.set(s.id, sanitizeSong(s));
      }
    }

    // Rebuild full songs catalog: user-added custom songs (or INITIAL_SONGS if any)
    const combinedSongs: Song[] = [];
    for (const custom of mergedCustomSongsMap.values()) {
      if (!combinedSongs.some(s => s.id === custom.id)) {
        combinedSongs.push(custom);
      }
    }

    lastSavedSignature = computeSignature(
      mergedSetlists,
      Array.from(mergedCustomSongsMap.values()),
      cloudSongOverrides,
      mergedFolders
    );

    // If cloud had old preset songs or local had new items, push clean state to cloud
    const hadObsoletePresetSongs = cloudCustomSongs.some(s => PRESET_SONG_IDS.has(s.id));
    if (hadObsoletePresetSongs || mergedSetlists.length > cloudSetlists.length || mergedCustomSongsMap.size > cloudCustomSongs.length || (!cloudGenreFolders?.length && mergedFolders.length > 0)) {
      saveWorkspaceToCloudImmediate(userId, mergedSetlists, combinedSongs, mergedFolders).catch(() => {});
    }

    return { setlists: mergedSetlists, songs: combinedSongs, genreFolders: mergedFolders };
  } catch (err) {
    console.warn('Error loading cloud workspace, falling back to local cache:', err);
    return { setlists: localSetlists, songs: localSongs, genreFolders: localFolders };
  }
}

/**
 * Heals contaminated or fallback online songs asynchronously with real authentic chords from scrapers
 */
export async function healContaminatedSongsAsync(
  userId: string,
  songs: Song[],
  setlists: Setlist[],
  onUpdateSongs: (songs: Song[]) => void
): Promise<void> {
  const contaminated = songs.filter(s => {
    const isTempo = s.id === 'tempo-perdido' || s.title.toLowerCase().includes('tempo perdido');
    return !isTempo && s.id.startsWith('online_') && (s.content.includes('Todos os dias quando acordo') || s.content.includes('Arranjo e harmonia da canção'));
  });

  if (contaminated.length === 0) return;

  let hasChanges = false;
  const updatedSongs = [...songs];

  for (const song of contaminated) {
    try {
      const real = await fetchRealOnlineCifra(song.title, song.artist);
      if (real && real.cifra && real.cifra.length > 50) {
        const idx = updatedSongs.findIndex(s => s.id === song.id);
        if (idx !== -1) {
          updatedSongs[idx] = {
            ...updatedSongs[idx],
            content: real.cifra,
            originalKey: real.key || updatedSongs[idx].originalKey || 'G',
            currentKey: real.key || updatedSongs[idx].currentKey || 'G',
            capo: real.capo > 0 ? real.capo : updatedSongs[idx].capo
          };
          hasChanges = true;
        }
      }
    } catch (e) {}
  }

  if (hasChanges) {
    onUpdateSongs(updatedSongs);
    saveWorkspaceToCloudDebounced(userId, setlists, updatedSongs, undefined, 200);
  }
}

/**
 * Real-time 2-way sync listener across multiple devices using Firestore onSnapshot
 */
export function subscribeToCloudWorkspace(
  userId: string,
  onRemoteChange: (data: CloudWorkspaceData) => void
): Unsubscribe {
  if (!userId || !isFirebaseConfigured) {
    return () => {};
  }

  const userRef = doc(db, 'users', userId);

  return onSnapshot(
    userRef,
    (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      const cloudSetlists = data?.cloudSetlists as Setlist[] | undefined;
      const cloudCustomSongs = data?.cloudCustomSongs as Song[] | undefined;
      const cloudGenreFolders = data?.cloudGenreFolders as GenreFolder[] | undefined;
      const cloudSongOverrides = data?.cloudSongOverrides as Record<string, Partial<Song>> | undefined;
      const cloudMomentOverrides = data?.cloudMomentOverrides as Record<string, LiturgicalMoment> | undefined;

      if (!cloudSetlists && !cloudCustomSongs && !cloudSongOverrides && !cloudGenreFolders) return;

      const setlists = cloudSetlists || [];
      const customSongs = (cloudCustomSongs || []).filter(s => !PRESET_SONG_IDS.has(s.id)).map(sanitizeSong);
      const genreFolders = cloudGenreFolders || [];
      const songOverrides = cloudSongOverrides || {};
      const incomingSig = computeSignature(setlists, customSongs, songOverrides, genreFolders);

      // Avoid looping if the change originated from this same device's save
      if (incomingSig === lastSavedSignature) return;

      lastSavedSignature = incomingSig;

      onRemoteChange({
        setlists,
        customSongs,
        genreFolders,
        songOverrides,
        momentOverrides: cloudMomentOverrides || {},
        lastUpdated: data?.lastCloudSync
      });
    },
    (error) => {
      console.warn('Firestore workspace subscription error:', error);
    }
  );
}


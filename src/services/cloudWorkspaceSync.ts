import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { Setlist, Song, LiturgicalMoment } from '../types';
import { INITIAL_SONGS } from '../data/songsData';

export interface CloudWorkspaceData {
  setlists: Setlist[];
  customSongs: Song[];
  momentOverrides: Record<string, LiturgicalMoment>;
  lastUpdated?: number;
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastSavedSignature = '';

/**
 * Filter only songs that are customized, uploaded, or imported from online searches
 */
export function extractCustomSongs(songs: Song[]): Song[] {
  return songs.filter(s =>
    Boolean(
      s.isCustom ||
      s.id.startsWith('custom_') ||
      s.id.startsWith('online_') ||
      s.parentSongId ||
      s.versionName
    )
  );
}

/**
 * Extract liturgical moment overrides for standard catalog songs
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
function computeSignature(setlists: Setlist[], customSongs: Song[]): string {
  const setlistSig = setlists.map(s => `${s.id}_${s.items.length}_${s.updatedAt}`).join('|');
  const songSig = customSongs.map(s => `${s.id}_${s.currentKey || s.originalKey}_${s.title}`).join('|');
  return `${setlistSig}:::${songSig}`;
}

/**
 * Save workspace data to Cloud Firestore with debouncing
 */
export function saveWorkspaceToCloudDebounced(
  userId: string,
  setlists: Setlist[],
  songs: Song[],
  delayMs = 600
): void {
  if (!userId || !isFirebaseConfigured) return;

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    saveWorkspaceToCloudImmediate(userId, setlists, songs).catch(err => {
      console.warn('Background cloud workspace sync error:', err);
    });
  }, delayMs);
}

/**
 * Save workspace immediately to Cloud Firestore
 */
export async function saveWorkspaceToCloudImmediate(
  userId: string,
  setlists: Setlist[],
  songs: Song[]
): Promise<void> {
  if (!userId || !isFirebaseConfigured) return;

  try {
    const customSongs = extractCustomSongs(songs);
    const momentOverrides = extractMomentOverrides(songs);
    const signature = computeSignature(setlists, customSongs);

    // Skip if identical to last save
    if (signature === lastSavedSignature) return;

    const userRef = doc(db, 'users', userId);
    await setDoc(
      userRef,
      {
        cloudSetlists: setlists,
        cloudCustomSongs: customSongs,
        cloudMomentOverrides: momentOverrides,
        lastCloudSync: Date.now()
      },
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
  localSongs: Song[]
): Promise<{ setlists: Setlist[]; songs: Song[] }> {
  if (!userId || !isFirebaseConfigured) {
    return { setlists: localSetlists, songs: localSongs };
  }

  try {
    const userRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      // First time: upload local workspace to Cloud Firestore
      await saveWorkspaceToCloudImmediate(userId, localSetlists, localSongs);
      return { setlists: localSetlists, songs: localSongs };
    }

    const data = docSnap.data();
    const cloudSetlists = (data?.cloudSetlists as Setlist[]) || [];
    const cloudCustomSongs = (data?.cloudCustomSongs as Song[]) || [];
    const cloudMomentOverrides = (data?.cloudMomentOverrides as Record<string, LiturgicalMoment>) || {};

    // If Cloud is empty but local has items, migrate local to cloud
    if (cloudSetlists.length === 0 && localSetlists.length > 0) {
      await saveWorkspaceToCloudImmediate(userId, localSetlists, localSongs);
      return { setlists: localSetlists, songs: localSongs };
    }

    // Merge Setlists (Cloud takes precedence, but keep any offline-created setlists from this device)
    const mergedSetlistsMap = new Map<string, Setlist>();
    for (const sl of cloudSetlists) {
      mergedSetlistsMap.set(sl.id, sl);
    }
    for (const sl of localSetlists) {
      if (!mergedSetlistsMap.has(sl.id)) {
        mergedSetlistsMap.set(sl.id, sl);
      }
    }
    const mergedSetlists = Array.from(mergedSetlistsMap.values());

    // Merge Custom Songs
    const mergedCustomSongsMap = new Map<string, Song>();
    for (const s of cloudCustomSongs) {
      mergedCustomSongsMap.set(s.id, s);
    }
    const localCustomSongs = extractCustomSongs(localSongs);
    for (const s of localCustomSongs) {
      if (!mergedCustomSongsMap.has(s.id)) {
        mergedCustomSongsMap.set(s.id, s);
      }
    }

    // Rebuild full songs catalog: INITIAL_SONGS + overrides + merged custom songs
    const combinedSongs = INITIAL_SONGS.map(s => {
      if (cloudMomentOverrides[s.id]) {
        return { ...s, liturgicalMoment: cloudMomentOverrides[s.id] };
      }
      return s;
    });

    for (const custom of mergedCustomSongsMap.values()) {
      if (!combinedSongs.some(s => s.id === custom.id)) {
        combinedSongs.unshift(custom);
      }
    }

    lastSavedSignature = computeSignature(mergedSetlists, Array.from(mergedCustomSongsMap.values()));

    // If local had new items not in cloud, push merged back to cloud
    if (mergedSetlists.length > cloudSetlists.length || mergedCustomSongsMap.size > cloudCustomSongs.length) {
      saveWorkspaceToCloudDebounced(userId, mergedSetlists, combinedSongs, 100);
    }

    return { setlists: mergedSetlists, songs: combinedSongs };
  } catch (err) {
    console.warn('Error loading cloud workspace, falling back to local cache:', err);
    return { setlists: localSetlists, songs: localSongs };
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
      const cloudMomentOverrides = data?.cloudMomentOverrides as Record<string, LiturgicalMoment> | undefined;

      if (!cloudSetlists && !cloudCustomSongs) return;

      const setlists = cloudSetlists || [];
      const customSongs = cloudCustomSongs || [];
      const incomingSig = computeSignature(setlists, customSongs);

      // Avoid looping if the change originated from this same device's save
      if (incomingSig === lastSavedSignature) return;

      lastSavedSignature = incomingSig;

      onRemoteChange({
        setlists,
        customSongs,
        momentOverrides: cloudMomentOverrides || {},
        lastUpdated: data?.lastCloudSync
      });
    },
    (error) => {
      console.warn('Firestore workspace subscription error:', error);
    }
  );
}

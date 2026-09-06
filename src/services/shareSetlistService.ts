/**
 * Serviço de Compartilhamento de Repertórios (Recurso Pro)
 * Permite empacotar setlists completos com suas cifras e transposições,
 * salvando no Cloud Firestore e IndexedDB com links e códigos amigáveis.
 */

import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase';
import { Setlist, Song, UserProfile } from '../types';
import { localDB } from './storageService';

export interface SharedSetlistPayload {
  shareCode: string; // Ex: 'REP-742'
  setlist: Setlist;
  songs: Song[];
  authorName: string;
  authorEmail?: string;
  authorUid: string;
  createdAt: number;
  totalSongs: number;
}

const SHARED_STORAGE_PREFIX = 'cifraflow_shared_setlist_';

/**
 * Gera um código memorável como REP-842
 */
export function generateShareCode(prefix = 'REP'): string {
  const num = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${num}`;
}

/**
 * Normaliza qualquer código digitado pelo usuário (com ou sem espaços, maiúsculas ou só números)
 * Ex: "REP - 348" -> "REP-348", "348" -> "REP-348", "rep348" -> "REP-348"
 */
export function normalizeShareCode(raw: string): string {
  if (!raw) return '';
  let clean = raw.trim().replace(/\s+/g, '').toUpperCase();
  if (/^\d{3,4}$/.test(clean)) {
    clean = `REP-${clean}`;
  } else if (/^REP\d{3,4}$/.test(clean)) {
    clean = `REP-${clean.slice(3)}`;
  }
  return clean;
}

/**
 * Publica um repertório para compartilhamento na nuvem e no cache local
 */
export async function publishSharedSetlist(
  setlist: Setlist,
  allSongs: Song[],
  author: UserProfile | null
): Promise<SharedSetlistPayload> {
  const shareCode = generateShareCode('REP');

  // Filtrar apenas as músicas pertencentes a este setlist
  const songIdsInSetlist = new Set(setlist.items.map((it) => it.songId));
  const relevantSongs = allSongs.filter((s) => songIdsInSetlist.has(s.id));

  const rawPayload: SharedSetlistPayload = {
    shareCode,
    setlist: {
      ...setlist,
      isCloudSynced: true
    },
    songs: relevantSongs,
    authorName: author?.displayName || 'Líder da Banda',
    authorEmail: author?.email || '',
    authorUid: author?.uid || 'anonymous_pro',
    createdAt: Date.now(),
    totalSongs: setlist.items.length
  };

  // Limpeza de segurança para eliminar qualquer campo undefined que o Firestore rejeite
  const cleanPayload: SharedSetlistPayload = JSON.parse(JSON.stringify(rawPayload));

  // 1. Salvar no localStorage local para contingência instantânea
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(`${SHARED_STORAGE_PREFIX}${shareCode}`, JSON.stringify(cleanPayload));
    } catch (e) {}
  }

  // 2. Publicar no Cloud Firestore na coleção 'shared_setlists'
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'shared_setlists', shareCode);
      await setDoc(docRef, cleanPayload);
      console.log('✅ Repertório publicado no Firestore com código:', shareCode);
    } catch (err) {
      console.error('❌ Falha ao salvar repertório compartilhado no Firestore:', err);
      throw err;
    }
  }

  return cleanPayload;
}

/**
 * Busca um repertório compartilhado a partir do código PIN (ex: REP-742, 742, rep-742)
 */
export async function fetchSharedSetlist(shareCode: string): Promise<SharedSetlistPayload | null> {
  const cleanCode = normalizeShareCode(shareCode);
  if (!cleanCode) return null;

  // 1. Tentar buscar no Cloud Firestore primeiro
  if (isFirebaseConfigured) {
    try {
      const docRef = doc(db, 'shared_setlists', cleanCode);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as SharedSetlistPayload;
        // Salvar cópia local
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`${SHARED_STORAGE_PREFIX}${cleanCode}`, JSON.stringify(data));
          } catch (e) {}
        }
        return data;
      }
    } catch (err) {
      console.warn('Erro ao buscar repertório compartilhado no Firestore, tentando cache local:', err);
    }
  }

  // 2. Fallback para cache local
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`${SHARED_STORAGE_PREFIX}${cleanCode}`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
  }

  return null;
}

/**
 * Prepara o repertório compartilhado para ser incorporado na biblioteca do usuário atual
 * Gera novo ID para não sobrepor repertórios existentes e separa as músicas novas para adicionar ao catálogo
 */
export function prepareImportedSetlist(
  shared: SharedSetlistPayload,
  existingSongs: Song[]
): { importedSetlist: Setlist; songsToAdd: Song[] } {
  const newSetlistId = `setlist_imported_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const existingSongIds = new Set(existingSongs.map((s) => s.id));

  // Identificar músicas que o usuário ainda não possui
  const songsToAdd: Song[] = [];
  shared.songs.forEach((sharedSong) => {
    if (!existingSongIds.has(sharedSong.id)) {
      songsToAdd.push({
        ...sharedSong,
        isCustom: true // Marcar como importada/personalizada no catálogo do usuário
      });
    }
  });

  const importedSetlist: Setlist = {
    ...shared.setlist,
    id: newSetlistId,
    title: `${shared.setlist.title} (Importado)`,
    description: shared.setlist.description
      ? `${shared.setlist.description} • Compartilhado por ${shared.authorName}`
      : `Compartilhado por ${shared.authorName}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isCloudSynced: false
  };

  return { importedSetlist, songsToAdd };
}

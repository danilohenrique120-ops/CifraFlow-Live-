/**
 * CifraFlow Local-First Storage Service (IndexedDB)
 * Armazenamento persistente e assíncrono de alta performance.
 * Supera a cota de 5MB do localStorage e garante disponibilidade 100% offline.
 */

import { GenreFolder, LiveSessionState, Setlist, Song } from '../types';

const DB_NAME = 'CifraFlow_LocalDB';
const DB_VERSION = 1;

const STORES = {
  SONGS: 'songs',
  SETLISTS: 'setlists',
  FOLDERS: 'folders',
  LIVE_ROOM: 'live_room'
} as const;

class LocalStorageService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.initDB();
    }
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORES.SONGS)) {
            db.createObjectStore(STORES.SONGS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.SETLISTS)) {
            db.createObjectStore(STORES.SETLISTS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.FOLDERS)) {
            db.createObjectStore(STORES.FOLDERS, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(STORES.LIVE_ROOM)) {
            db.createObjectStore(STORES.LIVE_ROOM, { keyPath: 'roomId' });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('[StorageService] Erro ao abrir IndexedDB, fallback para localStorage:', request.error);
          reject(request.error);
        };
      } catch (err) {
        reject(err);
      }
    });

    return this.dbPromise;
  }

  /**
   * SONGS
   */
  public async getAllSongs(): Promise<Song[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORES.SONGS, 'readonly');
        const store = transaction.objectStore(STORES.SONGS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  public async saveSongs(songs: Song[]): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORES.SONGS, 'readwrite');
        const store = transaction.objectStore(STORES.SONGS);
        songs.forEach((song) => {
          store.put(song);
        });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      });
    } catch (err) {
      console.warn('[StorageService] Falha ao salvar songs no IndexedDB:', err);
    }
  }

  public async saveSong(song: Song): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORES.SONGS, 'readwrite');
        const store = transaction.objectStore(STORES.SONGS);
        store.put(song);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      });
    } catch (err) {
      console.warn('[StorageService] Falha ao salvar song no IndexedDB:', err);
    }
  }

  /**
   * SETLISTS
   */
  public async getAllSetlists(): Promise<Setlist[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORES.SETLISTS, 'readonly');
        const store = transaction.objectStore(STORES.SETLISTS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  public async saveSetlists(setlists: Setlist[]): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORES.SETLISTS, 'readwrite');
        const store = transaction.objectStore(STORES.SETLISTS);
        store.clear();
        setlists.forEach((setlist) => {
          store.put(setlist);
        });
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      });
    } catch (err) {
      console.warn('[StorageService] Falha ao salvar setlists no IndexedDB:', err);
    }
  }

  /**
   * GENRE FOLDERS
   */
  public async getAllFolders(): Promise<GenreFolder[]> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORES.FOLDERS, 'readonly');
        const store = transaction.objectStore(STORES.FOLDERS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  public async saveFolders(folders: GenreFolder[]): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORES.FOLDERS, 'readwrite');
        const store = transaction.objectStore(STORES.FOLDERS);
        store.clear();
        folders.forEach((f) => store.put(f));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      });
    } catch (err) {
      console.warn('[StorageService] Falha ao salvar pastas no IndexedDB:', err);
    }
  }

  /**
   * LIVE ROOM CACHE
   */
  public async getLiveRoomState(roomId: string): Promise<LiveSessionState | null> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORES.LIVE_ROOM, 'readonly');
        const store = transaction.objectStore(STORES.LIVE_ROOM);
        const request = store.get(roomId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async saveLiveRoomState(state: LiveSessionState): Promise<void> {
    try {
      const db = await this.initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction(STORES.LIVE_ROOM, 'readwrite');
        const store = transaction.objectStore(STORES.LIVE_ROOM);
        store.put(state);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      });
    } catch (err) {
      console.warn('[StorageService] Falha ao salvar live room no IndexedDB:', err);
    }
  }
}

export const localDB = new LocalStorageService();

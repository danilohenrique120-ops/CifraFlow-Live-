/**
 * PWA Service - Gerenciamento de Service Worker e Status de Conectividade
 */

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado com sucesso:', reg.scope);

          // Verificar atualizações
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed') {
                  if (navigator.serviceWorker.controller) {
                    console.log('[PWA] Nova versão disponível em background.');
                  } else {
                    console.log('[PWA] Conteúdo em cache para uso offline imediato!');
                  }
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('[PWA] Falha ao registrar Service Worker:', err);
        });
    });
  }
}

export type NetworkStatusCallback = (isOnline: boolean) => void;

class NetworkStatusManager {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private listeners: Set<NetworkStatusCallback> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleStatusChange(true));
      window.addEventListener('offline', () => this.handleStatusChange(false));
    }
  }

  private handleStatusChange(status: boolean) {
    this.isOnline = status;
    this.listeners.forEach((callback) => {
      try {
        callback(status);
      } catch (err) {
        console.error('[NetworkStatusManager] Erro no listener:', err);
      }
    });
  }

  public getStatus(): boolean {
    return this.isOnline;
  }

  public subscribe(callback: NetworkStatusCallback): () => void {
    this.listeners.add(callback);
    callback(this.isOnline);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const networkStatus = new NetworkStatusManager();

/**
 * CifraFlow / Cifraê - Bulletproof Service Worker
 * Garante inicialização e execução do app 100% offline mesmo em Modo Avião no palco.
 */

const CACHE_NAME = 'cifraflow-pwa-v2';

// Assets essenciais de casca da aplicação para pré-cache imediato
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(PRECACHE_URLS).catch((e) => console.warn('[SW] Precache base:', e));

      // Extrair e pré-cachear automaticamente todos os scripts e CSS do index.html
      try {
        const response = await fetch('/index.html');
        const htmlText = await response.text();
        const assetMatches = Array.from(htmlText.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g));
        const assetsToCache = assetMatches.map(m => m[1]);

        if (assetsToCache.length > 0) {
          await cache.addAll(assetsToCache);
          console.log('[SW] Bundles JS/CSS pré-cacheados para uso offline imediato:', assetsToCache);
        }
      } catch (err) {
        console.warn('[SW] Erro ao carregar assets do bundle no install:', err);
      }
    })().then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Limpando cache antigo:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // Ignorar APIs externas, Firebase e Stripe
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('stripe.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Navegações de página (SPA Navigation Fallback)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Tenta buscar da rede primeiro quando online para trazer atualizações
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            return networkResponse;
          }
        } catch {
          // Offline total (Modo Avião / Sem Internet)
        }

        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('/index.html') || await cache.match('/');
        if (cachedResponse) return cachedResponse;

        return new Response('Modo Offline: Atualize a página conectado uma vez.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      })()
    );
    return;
  }

  // Assets estáticos (JS, CSS, Fontes, Imagens): Cache-First com revalidação em background
  event.respondWith(
    (async () => {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        // Retorno instantâneo do cache do aparelho
        // Atualiza silenciosamente em background se houver internet
        fetch(request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cache = await caches.open(CACHE_NAME);
              cache.put(request, networkResponse);
            }
          })
          .catch(() => {});

        return cachedResponse;
      }

      // Se não estava no cache, busca na rede e guarda
      try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        return new Response('Arquivo não disponível offline', { status: 404 });
      }
    })()
  );
});

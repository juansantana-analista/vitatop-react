importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const CACHE = "pwabuilder-cache-v6"; // MUDEI A VERSÃO AQUI
const offlineFallbackPage = "offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => {
      return cache.add(offlineFallbackPage);
    })
  );
  self.skipWaiting();
});

// Limpa caches antigos ao ativar um novo SW
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Remove caches antigos
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys.map((cacheName) => {
          if (cacheName !== CACHE) {
            return caches.delete(cacheName);
          }
        })
      );

      // Atualiza os clientes imediatamente
      await self.clients.claim();
    })()
  );
});

// Comunicação com o frontend para forçar atualização
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Habilita preload se suportado
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Intercepta requisições - NOVA ESTRATÉGIA PARA iOS
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    // Para páginas HTML - sempre busca do servidor no iOS
    event.respondWith(
      fetch(event.request, { 
        cache: "no-store" 
      }).catch(async () => {
        const cache = await caches.open(CACHE);
        return cache.match(offlineFallbackPage);
      })
    );
    return;
  }

  // Para outros recursos
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      try {
        const response = await fetch(event.request);

        // Só faz cache de requisições GET
        if (event.request.method === 'GET') {
          cache.put(event.request, response.clone());
        }

        return response;
      } catch (error) {
        if (event.request.method === 'GET') {
          return cache.match(event.request) || fetch(event.request);
        } else {
          throw error;
        }
      }
    })
  );
});
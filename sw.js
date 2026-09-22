/* Service Worker — cache first, network fallback.
   Ideal para cardápio: abre offline e permite instalar na tela inicial. */

const CACHE = "cardapio-v6";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ARQUIVOS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Imagens externas: tenta a rede primeiro e faz cache por demanda
  if (event.request.url.startsWith("https://")) {
    event.respondWith(
      fetch(event.request)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copia));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Arquivos locais: cache first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

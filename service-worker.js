const CACHE = 'pro-agenda-v3';
// Caminhos relativos ao escopo do service worker, para funcionar tanto na raiz
// quanto numa subpasta (ex.: /agenda/).
const urlsToCache = [
  './',
  './index.html',
  './src/style.css',
  './src/data.js',
  './src/app.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(urlsToCache)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: sempre busca a versão mais nova quando há internet e
// atualiza o cache; offline, usa o que estiver salvo. Evita que o app
// fique preso numa versão antiga depois de uma atualização.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() =>
      caches.match(event.request).then(cached => cached || caches.match('./index.html'))
    )
  );
});

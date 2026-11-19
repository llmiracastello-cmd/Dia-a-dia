// Guarda la app en el móvil para que funcione sin conexión.
// Al publicar una versión nueva, cambia el número de CACHE para que se actualice.
const CACHE = 'diaadia-v1.3';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Primero la red (para recibir actualizaciones); si no hay conexión, la copia guardada.
// Archivo recibido desde el menú «Compartir» de Android: se guarda y se abre la app para cargarlo.
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method === 'POST' && u.pathname.endsWith('/compartir')) {
    e.respondWith((async () => {
      try {
        const fd = await e.request.formData(), f = fd.get('archivo');
        if (f && f.text) { const c = await caches.open('diaadia-compartido'); await c.put('./compartido.json', new Response(await f.text(), { headers: { 'Content-Type': 'application/json' } })); }
      } catch (err) { }
      return Response.redirect('./index.html?compartido=1', 303);
    })());
    return;
  }
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r && r.ok && new URL(e.request.url).origin === location.origin) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html')))
  );
});

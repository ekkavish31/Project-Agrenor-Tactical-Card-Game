/* v91.94 · asset cache. The map editor loads ~130 big images (≈60 MB); a reload used to fetch them all again.
   Images under assets/ and data/ are kept in a cache named after the game version (sw.js?v=…): every push bumps the version, so new
   pictures are fetched once per version and a plain reload afterwards is instant. Code (html/js) is never cached here. */
const V = new URL(self.location).searchParams.get('v') || '0', CACHE = 'agrenor-assets-' + V;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('agrenor-assets-') && k !== CACHE) await caches.delete(k);
  await self.clients.claim()
})()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range')) return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin || !/\/(assets|data)\/.+\.(png|webp|jpe?g|gif)$/i.test(u.pathname)) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE), hit = r.cache === 'reload' ? null : await c.match(r); // Ctrl+F5 = fetch again and refresh the stored copy
    if (hit) return hit;
    const res = await fetch(r);
    if (res.ok && res.status === 200) c.put(r, res.clone()).catch(() => {});
    return res
  })())
});

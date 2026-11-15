/* v98.575 · asset cache that SURVIVES version bumps.
   Before (v91.94): the cache was named after the game version, so every push threw ALL pictures away and the next visit downloaded hundreds of MB again
   (and every picture was then a cold first draw = stutter). Now one permanent cache + stale-while-revalidate:
   • a picture already stored is served at once (no network wait);
   • the first time it is asked for under a NEW game version it is also re-checked in the background (conditional request, usually a tiny 304) and replaced if it changed,
     so edited pictures appear on the next load; a picture is re-checked at most once per version (the version is stamped on the stored copy: header x-sw-v);
   • Ctrl+F5 (cache:'reload') still fetches fresh.  Code (html/js) is never cached here.
   Message {type:'precache', urls:[…]} (from the page, while idle) downloads pictures ahead of time into the same cache. */
const V = new URL(self.location).searchParams.get('v') || '0', CACHE = 'agrenor-assets-perm';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith('agrenor-assets-') && k !== CACHE) await caches.delete(k);
  await self.clients.claim()
})()));
const IMG = /\/(assets|data)\/.+\.(png|webp|jpe?g|gif)$/i;
const stamp = res => { const h = new Headers(res.headers); h.set('x-sw-v', V); return res.blob().then(b => new Response(b, { status: 200, statusText: 'OK', headers: h })) };
async function refresh(c, r) {
  try {
    const res = await fetch(r.url, { cache: 'no-cache' });
    if (res.ok && res.status === 200) { const s = await stamp(res.clone()); await c.put(r.url, s.clone()); return res }
    if (res.status === 304) return null
  } catch (e) { }
  return null
}
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || r.headers.has('range')) return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin || !IMG.test(u.pathname)) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE), hit = r.cache === 'reload' ? null : await c.match(r.url);   // keyed by URL only (a "?v=" on a picture is ignored by the match key below)
    if (hit) { if (hit.headers.get('x-sw-v') !== V) e.waitUntil(refresh(c, r)); return hit }
    const res = await fetch(r);
    if (res.ok && res.status === 200) e.waitUntil(stamp(res.clone()).then(s => c.put(r.url, s)).catch(() => {}));
    return res
  })())
});
self.addEventListener('message', e => {
  const d = e.data; if (!d || d.type !== 'precache' || !Array.isArray(d.urls)) return;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE); let n = 0;
    for (const url of d.urls.slice(0, 600)) {
      try { const u = new URL(url, self.location); if (u.origin !== self.location.origin || !IMG.test(u.pathname) || await c.match(u.href)) continue; const res = await fetch(u.href); if (res.ok && res.status === 200) { await c.put(u.href, (await stamp(res.clone()))); n++ } } catch (x) { }
    }
  })())
});

/* v98.177 · persistent cache for the big intro media (video ~47 MB, intro BGM). Stored in Cache Storage under a name that does NOT depend on the
   game version, so a push that only changes code no longer makes everyone re-download them. The file's own ?v= query is the version: when it
   changes, the old entry of the same path is deleted. Falls back silently (file://, private mode, quota) to a plain download. */
(() => {
  const NAME = 'agrenor-media-v1';
  const open = () => ('caches' in self) ? caches.open(NAME) : Promise.reject(new Error('no Cache Storage'));
  const abs = url => new URL(url, location.href).href;
  window.AgMediaCache = {
    async get(url) {
      try { const hit = await (await open()).match(abs(url)); return hit && hit.ok ? hit : null; } catch { return null; }
    },
    async put(url, blob, type) {
      try {
        const c = await open(), href = abs(url), path = new URL(href).pathname;
        for (const k of await c.keys()) if (new URL(k.url).pathname === path && k.url !== href) await c.delete(k);
        await c.put(href, new Response(blob, { headers: { 'content-type': type || blob.type || 'application/octet-stream' } }));
        navigator.storage?.persist?.().catch(() => {});
      } catch { /* quota / unsupported: just don't cache */ }
    },
  };
})();

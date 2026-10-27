/* v91.55 · show work that is still waiting for ⬆ Push (staged in IndexedDB by Asset Studio / Object Workshop) inside other pages,
   e.g. the village map editor: any <img>.src that points to a staged assets/… file is redirected to the staged copy, and a staged
   asset manifest replaces window.ASSET_MANIFEST (so a brand-new Workshop asset shows up in pickers). Updates live when Asset Studio changes
   the staged set (BroadcastChannel). Nothing is written: this only reads. */
(function () {
 'use strict';
 const base = location.pathname.replace(/[^/]*$/, ''), blobs = new Map(), refs = new Set(), desc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
 if (!desc || !desc.set) return;
 const relOf = u => { try { const x = new URL(u, location.href); if (x.origin !== location.origin || !x.pathname.startsWith(base)) return null; return decodeURIComponent(x.pathname.slice(base.length)) } catch (e) { return null } };
 Object.defineProperty(HTMLImageElement.prototype, 'src', {
  configurable: true, enumerable: true,
  get() { return desc.get.call(this) },
  set(v) {
   const r = typeof v === 'string' && !v.startsWith('blob:') && !v.startsWith('data:') ? relOf(v) : null;
   if (r && /^assets\//.test(r)) {
    if (!this._spPath) refs.add(new WeakRef(this));
    this._spPath = r;
    const b = blobs.get(r);
    if (b) { this._spBlob = true; desc.set.call(this, b); return }
    this._spBlob = false
   } else if (this._spPath) { this._spPath = null; this._spBlob = false }
   desc.set.call(this, v)
  }
 });
 function idbGet(k) {
  return new Promise(res => {
   try {
    const r = indexedDB.open('asset-studio', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onerror = () => res(null);
    r.onsuccess = () => { try { const q = r.result.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(null) } catch (e) { res(null) } }
   } catch (e) { res(null) }
  })
 }
 async function refresh() {
  const s = await idbGet('repo-staged'), next = new Map();
  if (Array.isArray(s)) for (const [p, b] of s) if (b && /^assets\//.test(p)) next.set(p, b);
  const old = new Map(blobs);
  blobs.clear();
  for (const [p, b] of next) blobs.set(p, URL.createObjectURL(b));
  for (const ref of [...refs]) {
   const im = ref.deref();
   if (!im) { refs.delete(ref); continue }
   if (!im._spPath) continue;
   const b = blobs.get(im._spPath);
   if (b) { im._spBlob = true; desc.set.call(im, b) } else if (im._spBlob) { im._spBlob = false; desc.set.call(im, im._spPath) }
  }
  old.forEach(u => setTimeout(() => URL.revokeObjectURL(u), 4000));
  // a staged manifest = new/changed assets that are not on GitHub yet
  try {
   const mb = Array.isArray(s) && s.find(([p, b]) => p === 'data/asset-manifest.json' && b);
   if (mb) { const j = JSON.parse(await mb[1].text()); if (j && Array.isArray(j.assets)) window.ASSET_MANIFEST = j }
  } catch (e) {}
  window.dispatchEvent(new CustomEvent('staged-preview', { detail: { paths: [...blobs.keys()] } }))
 }
 window.StagedPreview = { refresh, paths: () => [...blobs.keys()] };
 refresh();
 try { new BroadcastChannel('project-a-staged').onmessage = () => refresh() } catch (e) {}
})();

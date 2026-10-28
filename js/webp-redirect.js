/* v92.04 · All pictures in the repo are WebP now (the editors convert on push). Code still names many of them "….png"
   (built from ids at run time), so every image / fetch request for assets (any folder) .png is silently pointed at the .webp file instead.
   If no .webp exists the original .png is tried (so old or not-yet-converted files keep working). Cursors and history snapshots stay PNG. */
(function () {
  if (window.__webpRedirect) return; window.__webpRedirect = 1;
  const SKIP = /\/(cursor-[^/]*|_versions\/.*|_reviews\/.*)$/i;
  function conv(u) {
    if (typeof u !== 'string' || u.startsWith('data:') || u.startsWith('blob:')) return u;
    const m = u.match(/^(.*?\/?assets\/[^?#]*?)\.png([?#].*)?$/i);
    if (!m || SKIP.test(m[1] + '.png')) return u;
    if (/^https?:\/\//i.test(u) && !u.startsWith(location.origin)) return u;
    return m[1] + '.webp' + (m[2] || '');
  }
  window.__toWebp = conv;
  const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  if (d && d.set) Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true, enumerable: d.enumerable, get: d.get,
    set(v) {
      const w = conv(v);
      if (w !== v) { const img = this, orig = v; img.addEventListener('error', function f() { img.removeEventListener('error', f); d.set.call(img, orig) }, { once: true }) }
      d.set.call(this, w)
    }
  });
  const sa = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (n, v) { if (n === 'src' && this instanceof HTMLImageElement) { this.src = v; return } return sa.call(this, n, v) };
  const F = window.fetch;
  window.fetch = function (input, init) {
    try {
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input), w = conv(url);
      if (w !== url && (!init || !init.method || /^get$/i.test(init.method)) && !(input instanceof Request && input.method !== 'GET'))
        return F.call(this, w, init).then(r => r.ok ? r : F.call(this, input, init)).catch(() => F.call(this, input, init));
    } catch (e) {}
    return F.call(this, input, init)
  };
  /* <img src="….png"> written as HTML (innerHTML / templates) */
  function fix(img) { const s = img.getAttribute('src'); if (!s) return; const w = conv(s); if (w !== s) { img.addEventListener('error', function f() { img.removeEventListener('error', f); sa.call(img, 'src', s) }, { once: true }); sa.call(img, 'src', w) } }
  const mo = new MutationObserver(ms => { for (const m of ms) { if (m.type === 'attributes') { if (m.target.tagName === 'IMG') fix(m.target) } else m.addedNodes.forEach(n => { if (n.nodeType === 1) { if (n.tagName === 'IMG') fix(n); n.querySelectorAll?.('img[src]').forEach(fix) } }) } });
  const go = () => { document.querySelectorAll('img[src]').forEach(fix); mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] }) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go); else go();
})();

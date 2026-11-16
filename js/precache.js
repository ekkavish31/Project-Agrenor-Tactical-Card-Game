/* v98.575 · background download of the pictures the game really uses (the village, sub-maps and fights as really requested, plus portraits, interiors, terrain, items) into the service-worker cache (sw.js),
   a little while after the game opens and only when the connection looks fine, so the first walk through a place / first fight does not wait for the network or stall on a cold file.
   Done once per game version (localStorage projectA.precached). Pictures that are already cached are skipped inside the worker.  Skipped on data-saver / 2G / localhost. */
(function () {
  'use strict';
  try {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    const c = navigator.connection || {}; if (c.saveData || /(^|-)2g$/.test(c.effectiveType || '') || c.effectiveType === '3g' || c.type === 'cellular') return;   /* v98.580 · ~100 MB: only on a good, non-mobile-data connection */
    const V = (window.GAME_VERSION && window.GAME_VERSION.v) || ''; if (!V || localStorage.getItem('projectA.precached') === V) return;
    const WANT = { portrait: 1, interior: 1, terrain: 1, battlefield: 1, item: 1 }, CAP = 110e6;   /* v98.580 · ~70 MB of recorded scenes + portraits etc. */
    /* v98.579 · the list is what the game REALLY requests (tools/build-precache-list.cjs: village → sub-maps → fights, in that order); the old guess by picture category
       missed 318 of the 473 pictures a short session used — including temple / shop / market and the hero's walk frames — because the 60 MB cut-off stopped it early */
    const go = async () => {
      try {
        const reg = await navigator.serviceWorker.ready, sw = navigator.serviceWorker.controller || reg.active; if (!sw) return;
        let total = 0; const urls = [], seen = new Set(), add = (f, bytes) => { if (seen.has(f) || total + (bytes || 0) > CAP) return; seen.add(f); total += bytes || 0; urls.push(f) };
        try { const L = await (await fetch('data/precache-list.json?v=' + encodeURIComponent(V))).json(); for (const g of L.groups || []) for (const [f, bytes] of g.files) add(f, bytes) } catch (e) { }
        await new Promise(res => { const s = document.createElement('script'); s.src = 'data/image-index.js?v=' + encodeURIComponent(V); s.onload = s.onerror = res; document.head.append(s) });
        for (const it of (window.IMAGE_INDEX && window.IMAGE_INDEX.items) || []) { if (!WANT[it[5]] || it[9] < 1 || /^(_|archive|versions)/.test(it[0])) continue; add(it[0], it[1]) }
        for (let i = 0; i < urls.length; i += 100) { sw.postMessage({ type: 'precache', urls: urls.slice(i, i + 100) }); await new Promise(r => setTimeout(r, 1500)) }
        localStorage.setItem('projectA.precached', V);
      } catch (e) { }
    };
    addEventListener('load', () => setTimeout(() => (window.requestIdleCallback || setTimeout)(go, 1200), 12000));
  } catch (e) { }
})();

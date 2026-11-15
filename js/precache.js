/* v98.575 · background download of the pictures the game really uses (village, portraits, battle props, interiors, terrain, items — about 55 MB) into the service-worker cache (sw.js),
   a little while after the game opens and only when the connection looks fine, so the first walk through a place / first fight does not wait for the network or stall on a cold file.
   Done once per game version (localStorage projectA.precached). Pictures that are already cached are skipped inside the worker.  Skipped on data-saver / 2G / localhost. */
(function () {
  'use strict';
  try {
    if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol) || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
    const c = navigator.connection || {}; if (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')) return;
    const V = (window.GAME_VERSION && window.GAME_VERSION.v) || ''; if (!V || localStorage.getItem('projectA.precached') === V) return;
    const WANT = { village: 1, portrait: 1, tactics: 1, interior: 1, terrain: 1, battlefield: 1, item: 1 }, CAP = 60e6;
    const go = () => {
      const s = document.createElement('script'); s.src = 'data/image-index.js?v=' + encodeURIComponent(V);
      s.onload = async () => {
        try {
          const reg = await navigator.serviceWorker.ready, sw = navigator.serviceWorker.controller || reg.active; if (!sw || !window.IMAGE_INDEX) return;
          let total = 0; const urls = [];
          for (const it of window.IMAGE_INDEX.items) { if (!WANT[it[5]] || it[9] < 1 || /^(_|archive|versions)/.test(it[0])) continue; if (total + it[1] > CAP) break; total += it[1]; urls.push('assets/' + it[0].replace(/^assets\//, '')) }
          for (let i = 0; i < urls.length; i += 100) { sw.postMessage({ type: 'precache', urls: urls.slice(i, i + 100) }); await new Promise(r => setTimeout(r, 1500)) }
          localStorage.setItem('projectA.precached', V);
        } catch (e) { }
      };
      document.head.append(s);
    };
    addEventListener('load', () => setTimeout(() => (window.requestIdleCallback || setTimeout)(go, 1200), 12000));
  } catch (e) { }
})();

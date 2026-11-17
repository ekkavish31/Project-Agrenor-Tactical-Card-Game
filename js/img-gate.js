/* v98.343 · LOADING GATE for the sub-maps and rooms (village-place.html · place-interior.html).
   Their pictures load while the first frames are already drawn, so for a moment everything showed as the code-drawn stand-ins (boxes, circles) — it looked bad.
   Load this file FIRST in the page: it wraps `new Image()`, tracks every picture started during the first seconds, and keeps a cover over the page until they have all
   arrived (a short quiet period after the last one, or 7 s at most). After the cover is gone it stops tracking. Pictures created later (e.g. a different hero frame) are not waited for. */
(function (root) {
  'use strict';
  if (root.__imgGate || /[?&](edit|nogate)=1/.test(location.search)) return; root.__imgGate = 1; root.__imgGateOpen = true;
  const Orig = root.Image, list = []; let open = true;
  const W = function (w, h) { const im = new Orig(w, h); if (open) list.push(im); return im };
  W.prototype = Orig.prototype; root.Image = W;
  const veil = document.createElement('div');
  veil.style.cssText = 'position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;background:radial-gradient(ellipse at center,#2a3a2c,#121a14);color:#f1dca0;font:700 18px system-ui,"Noto Sans Thai",sans-serif;letter-spacing:.08em;transition:opacity .35s';
  veil.innerHTML = '<span>กำลังเตรียมฉาก…</span>'; document.documentElement.appendChild(veil);
  const t0 = performance.now(); let quiet = 0;
  const tick = () => {
    const now = performance.now(), loading = list.some(im => !im.complete);
    quiet = loading ? 0 : quiet + 1;
    if ((quiet >= 3 && now - t0 > 450 && list.length) || now - t0 > 7000 || (quiet >= 8 && now - t0 > 1500)) {   /* ≥3 quiet polls after at least one picture; 7 s at most */
      open = false; list.length = 0; veil.style.opacity = '0'; root.__imgGateOpen = false; setTimeout(() => veil.remove(), 400); return;
    }
    setTimeout(tick, 90);
  };
  setTimeout(tick, 90);
})(window);

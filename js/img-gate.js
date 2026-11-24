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
  /* v98.1017 · the cover is the SAME loading scene as entering the game (title-screen.js loadingScreen): LOADING · title · the running Mip (css/mip-loader.css) · progress bar + % — it used to be a plain dark panel with one line of text.
     Self-contained: this file runs before everything else, so it brings its own style (scoped to #imgGateVeil) and links the shared Mip sheet. */
  const css = document.createElement('style');
  css.textContent = '#imgGateVeil{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-end;justify-content:center;background:radial-gradient(ellipse at 50% 38%,#2c3d2f,#0f1712 72%);color:#f5e6c4;font:14px/1.5 AgThai,system-ui,"Noto Sans Thai",Tahoma,sans-serif;transition:opacity .35s}'
    + '#imgGateVeil .gl-box{position:relative;width:min(560px,calc(100vw - 40px));margin-bottom:9vh}'
    + '#imgGateVeil .gl-kicker{font:600 11px/1 AgThai,system-ui,sans-serif;letter-spacing:.32em;color:#e8c374}'
    + '#imgGateVeil .gl-title{margin:8px 0 14px;font:700 28px AgThai,Georgia,"Noto Sans Thai",serif;color:#ffe8a6;text-shadow:0 3px 14px #000}'
    + '#imgGateVeil .gl-bar{height:10px;border-radius:6px;background:#0b1220;border:1px solid #d9b46b66;overflow:hidden;box-shadow:inset 0 1px 3px #000}'
    + '#imgGateVeil .gl-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#a8701e,#f0c870 70%,#fff2c8);box-shadow:0 0 12px #f0c87088;transition:width .18s ease-out}'
    + '#imgGateVeil .gl-meta{display:flex;justify-content:space-between;margin-top:7px;font-size:12px;color:#c9bb98}#imgGateVeil .gl-meta b{color:#e8c374;font-variant-numeric:tabular-nums}';
  (document.head || document.documentElement).appendChild(css);
  try { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/mip-loader.css?v=v98.188'; (document.head || document.documentElement).appendChild(l) } catch (e) { }
  const veil = document.createElement('div'); veil.id = 'imgGateVeil'; veil.setAttribute('role', 'progressbar');
  veil.innerHTML = '<div class="gl-box"><span class="gl-kicker">LOADING</span><h2 class="gl-title">กำลังเตรียมฉาก…</h2>'
    + '<div class="mip-track" aria-hidden="true" style="--mw:min(560px,calc(100vw - 40px));--ms:clamp(76px,11vh,108px)"><div class="mip-go"><div class="mip-flip"><div class="mip-run"><i></i></div><div class="mip-idle"><i></i></div></div></div></div>'
    + '<div class="gl-bar"><i></i></div><div class="gl-meta"><span>โหลดภาพของฉาก</span><b>0%</b></div></div>';
  document.documentElement.appendChild(veil);
  const bar = veil.querySelector('.gl-bar i'), pct = veil.querySelector('.gl-meta b'); let shown = 0;
  const paint = f => { shown = Math.max(shown, Math.min(1, f)); const n = Math.round(shown * 100); bar.style.width = n + '%'; pct.textContent = n + '%'; veil.setAttribute('aria-valuenow', n) };
  const t0 = performance.now(); let quiet = 0;
  const tick = () => {
    const now = performance.now(), loading = list.some(im => !im.complete);
    { const done = list.filter(im => im.complete).length; paint(list.length ? Math.min(.95, done / list.length * .85 + Math.min(.1, (now - t0) / 7000)) : Math.min(.3, (now - t0) / 1500)) }   /* the share of pictures that arrived (+ a little for time, so it never sits at 0) */
    quiet = loading ? 0 : quiet + 1;
    if ((quiet >= 3 && now - t0 > 450 && list.length) || now - t0 > 7000 || (quiet >= 8 && now - t0 > 1500)) {   /* ≥3 quiet polls after at least one picture; 7 s at most */
      paint(1); open = false; list.length = 0; veil.style.opacity = '0'; root.__imgGateOpen = false; setTimeout(() => veil.remove(), 400); return;
    }
    setTimeout(tick, 90);
  };
  setTimeout(tick, 90);
})(window);

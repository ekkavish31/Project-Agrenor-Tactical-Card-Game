/* v98.694 · GAME CURSORS — drawn by the page itself (a small fixed element that follows the pointer), because a real OS cursor cannot animate and Chrome does not even refresh it on a click.
   What the player sees (Editor › Visual › HUD › เคอร์เซอร์ saves the choice in localStorage 'projectA.visual' = {cursorArrow:'gold'|'fantasy'|'system', hands:true|false}):
     • the ARROW (anything without its own cursor): gold = the artist's 3D gold arrow that keeps TURNING (96 frames · 4 s a turn · white aura · vivid gold) · fantasy = the earlier cursor-fantasy.png · system = the OS arrow
     • anything clickable (cursor:pointer)  → the pointing hand; every click plays "finger taps down + star sparkle"
     • anything draggable (cursor:grab) → open hand; held / dragging (cursor:grabbing) → the fist
     • anything that opens a detail view (card thumbnails, [data-inspect], cursor:zoom-in / help) → the magnifier, which glitters once when the pointer arrives
     • text fields, crosshairs, resize handles … keep the OS cursor of the page.
   The page's own authored cursor is READ (never guessed) and mapped to a kind; for the kinds drawn here the OS cursor is hidden (html.agc-hide).  Not used for touch and not in the editor tools (?editor= / ?edit=).
   Off:  localStorage 'projectA.cursor' = '0'  or  ?cursor=0.   API: GameCursor.enable(on) · GameCursor.kind() */
(function (root) {
  'use strict';
  if (root.GameCursor || typeof document === 'undefined') return;
  const Q = location.search; if (/[?&](editor|edit)=/.test(Q) || /[?&]cursor=0/.test(Q)) return;
  try { if (localStorage.getItem('projectA.cursor') === '0') return } catch (e) { }
  if (!root.matchMedia || !matchMedia('(pointer:fine)').matches) return;
  const D = 'assets/cursor/', H = document.documentElement;
  const vs = () => { try { return JSON.parse(localStorage.getItem('projectA.visual')) || {} } catch (e) { return {} } };
  const O = { arrow: ['gold', 'fantasy', 'system'].includes(vs().cursorArrow) ? vs().cursorArrow : 'gold', hands: vs().hands !== false };
  /* hands atlas (assets/cursor/cursor-atlas.webp, 8 × 3 cells of 48 px as shown) · gold atlas (cursor-gold-atlas.webp, 12 × 8 cells of 128 px → 48 px) */
  const HAND = { pointer: { r: 2, c: 0, hs: [9, 4] }, grab: { r: 0, c: 0, hs: [24, 24] }, grabbing: { r: 0, c: 4, hs: [24, 28] }, zoom: { r: 1, c: 0, hs: [22, 22] }, talk: { r: 0, c: 0, hs: [3, 42], img: 'talk-atlas', loop: 130 }, walk: { r: 0, c: 0, hs: [24, 24], img: 'walk-atlas', loop: 140 } }, GOLD_HS = [9, 9], GOLD_N = 96, GOLD_LOOP = 4000;
  const st = document.createElement('style'); st.id = 'agcCss';
  /* v98.832 · the cursor is drawn by the OS from a still picture of each kind (assets/cursor/os-<kind>.png, 1× + 2×): it moves with no delay and never doubles while the page is busy loading / stuttering.
     The page-drawn cursor (#agcCur) now only shows for the short animations: the finger tap on a click and the magnifier's glitter. */
  const OSK = { arrow: [9, 9], pointer: [9, 4], grab: [24, 24], grabbing: [24, 28], zoom: [22, 22], talk: [3, 42], walk: [24, 24] }   /* v98.1012 · the speech-bubble pictures are flipped top-to-bottom: the pointed tail now points DOWN, the hot-spot is at its tip */;
  const osCss = Object.entries(OSK).map(([k, [hx, hy]]) => `html.agc-os-${k},html.agc-os-${k} *{cursor:url(${D}os-${k}.png) ${hx} ${hy},auto!important;cursor:-webkit-image-set(url(${D}os-${k}.png) 1x,url(${D}os-${k}@2x.png) 2x) ${hx} ${hy},auto!important}`).join('\n');
  st.textContent = `${osCss}
html.agc-hide,html.agc-hide *{cursor:none!important}
html.agc-fantasy,html.agc-fantasy *{cursor:url(assets/cursor-fantasy.png) 4 3,default!important}
html.agc-sys body{cursor:auto!important}html.agc-sys button,html.agc-sys [role=button],html.agc-sys .station{cursor:pointer!important}
#agcCur{position:fixed;left:0;top:0;width:48px;height:48px;transform-origin:0 0;pointer-events:none;z-index:2147483647;display:none;will-change:transform;background-repeat:no-repeat}
#agcCur.agc-hand{background-image:url(${D}cursor-atlas.webp);background-size:384px 144px;filter:drop-shadow(0 1px 2px #0007)}
#agcCur.agc-talk{background-image:url(${D}talk-atlas.webp);background-size:384px 48px;filter:drop-shadow(0 1px 2px #0007)}
#agcCur.agc-walk{background-image:url(${D}walk-atlas.webp);background-size:384px 48px;filter:drop-shadow(0 1px 2px #0007)}
#agcCur.agc-gold{background-image:url(${D}cursor-gold-atlas.webp);background-size:576px 384px;filter:saturate(1.7) brightness(1.14) contrast(1.06) drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 4px #fffffff0) drop-shadow(0 0 9px #ffffff99)}`;
  document.head.appendChild(st);
  if (O.arrow === 'system') H.classList.add('agc-sys');
  const el = document.createElement('div'); el.id = 'agcCur'; el.setAttribute('aria-hidden', 'true');
  let on = true, kind = '', held = false, x = -99, y = -99, target = null, pend = false, seq = null, raf = 0, seen = false, lastKind = '';
  new Image().src = D + 'cursor-atlas.webp'; new Image().src = D + 'cursor-gold-atlas.webp'; new Image().src = D + 'talk-atlas.webp'; new Image().src = D + 'walk-atlas.webp';
  const host = () => { const d = document.querySelectorAll('dialog[open]'); return d.length ? d[d.length - 1] : document.body };   /* a modal <dialog> lives in the browser's top layer: draw inside it */
  const mount = () => { const h = host(); if (el.parentNode !== h) h.appendChild(el) };
  /* v98.1012 · the talk cursor is drawn 30 % smaller (SC.talk = .7): scale about the top-left corner, the hot-spot shrinks with it */
  const SC = { talk: .7 };
  const place = () => { const hs = kind === 'arrow' ? GOLD_HS : (HAND[kind]?.hs || [0, 0]), k = SC[kind] || 1; el.style.transform = `translate(${Math.round(x - hs[0] * k)}px,${Math.round(y - hs[1] * k)}px)` + (k !== 1 ? ` scale(${k})` : '') };
  /* ---- what is under the pointer? read its authored cursor with our own class lifted ---- */
  const classify = e => {
    const hid = H.classList.contains('agc-hide'), fan = H.classList.contains('agc-fantasy'), osk = [...H.classList].filter(c => c.startsWith('agc-os-')); if (hid) H.classList.remove('agc-hide'); if (fan) H.classList.remove('agc-fantasy'); for (const c of osk) H.classList.remove(c);
    let k = '';
    try {
      if (e && e.nodeType === 1) {
        if (e.dataset && e.id === 'world' && 'agc' in e.dataset) k = e.dataset.agc && O.hands ? e.dataset.agc : 'arrow';   /* the village map says what is under the pointer (js: village-town.html) */
        else if (e.tagName === 'IFRAME' || e.tagName === 'FRAME') k = 'frame';   /* the page inside draws its own cursor */
        else {
          const c = (getComputedStyle(e).cursor || '').split(',').pop().trim();
          k = c === 'pointer' ? 'pointer' : c === 'grab' ? 'grab' : c === 'grabbing' ? 'grabbing' : (c === 'zoom-in' || c === 'help') ? 'zoom' : (c === 'auto' || c === 'default') ? 'arrow' : '';
          if (k === 'pointer' && e.closest('.card-thumb,.bag-thumb,[data-inspect]')) k = 'zoom';
        }
      }
    } catch (er) { }
    if (hid) H.classList.add('agc-hide'); if (fan) H.classList.add('agc-fantasy'); for (const c of osk) H.classList.add(c);
    if (!O.hands && HAND[k]) k = 'arrow';   /* hands off: the arrow everywhere */
    if (k === 'arrow' && O.arrow === 'system') k = '';
    return k;
  };
  /* ---- apply a kind: which cursor is drawn, whether the OS cursor is hidden ---- */
  /* ---- apply a kind: the OS draws its still picture (no lag); the page cursor only runs a short animation (tap / glitter) ---- */
  const osSet = k => { for (const c of [...H.classList]) if (c.startsWith('agc-os-')) H.classList.remove(c); if (k) H.classList.add('agc-os-' + k) };
  const animEnd = () => { seq = null; el.style.display = 'none'; H.classList.remove('agc-hide') };
  const apply = k => {
    if (k === kind) return; const was = kind; kind = k;
    const drawn = !!HAND[k] || (k === 'arrow' && O.arrow === 'gold');
    H.classList.toggle('agc-fantasy', k === 'arrow' && O.arrow === 'fantasy'); osSet(drawn ? k : '');
    if (seq) animEnd(); cancelAnimationFrame(raf); raf = 0;
    if (k === 'zoom' && was !== 'zoom') play(1, [1, 2, 3, 4, 5, 6, 7], 55);
    /* v98.1012 · over a villager you can talk to: the speech-bubble cursor animates again (8 frames of assets/cursor/talk-atlas.webp, looping) — it was a still picture since v98.852 (the lag / double-cursor fix); only this kind is page-drawn, with the OS cursor hidden meanwhile, so it cannot double */
    if (k === 'talk') play(0, [0, 1, 2, 3, 4, 5, 6, 7], HAND.talk.loop, true);
  };
  const loop = t => {
    raf = 0; if (!on || !seq || !HAND[kind]) { if (seq) animEnd(); return }
    let i = Math.max(0, Math.floor((Math.max(t, seq.t0) - seq.t0) / seq.ms)); if (seq.loop) i %= seq.frames.length; else if (i >= seq.frames.length) { animEnd(); return }
    el.style.backgroundPosition = `${-seq.frames[i] * 48}px ${-seq.r * 48}px`; raf = requestAnimationFrame(loop);
  };
  /* a short animation: the page cursor shows it (OS cursor hidden meanwhile) and goes away again at its end */
  function play(r, frames, ms, looping) { if (!HAND[kind] || !seen) return; seq = { r, frames, ms, loop: !!looping, t0: performance.now() }; mount(); el.className = HAND[kind].img ? 'agc-' + kind : 'agc-hand'; place(); el.style.display = 'block'; H.classList.add('agc-hide'); if (!raf) raf = requestAnimationFrame(loop) }
  /* ---- events ---- */
  const check = () => { pend = false; if (!on) return; let k = classify(target); if (held && k === 'grab') k = 'grabbing'; apply(k) };
  const sched = () => { if (!pend) { pend = true; requestAnimationFrame(check) } };
  const isMouse = e => !e.pointerType || e.pointerType === 'mouse' || e.pointerType === 'pen';
  addEventListener('pointermove', e => { if (!isMouse(e)) return; x = e.clientX; y = e.clientY; target = e.target; const was = seen; seen = true; if (!was && kind === 'talk' && !seq) play(0, [0, 1, 2, 3, 4, 5, 6, 7], HAND.talk.loop, true); if (seq) place(); if (target && (target.tagName === 'IFRAME' || target.tagName === 'FRAME') && kind !== 'frame') { pend = false; check() } else sched() }, true);
  /* v98.804 · when the pointer enters another element / a frame the kind is decided RIGHT NOW (it used to wait for the next animation frame): while the game was loading or stuttering that frame came late, so the old hand stayed painted next to the OS arrow of the frame / overlay now under the pointer (two cursors at once) */
  addEventListener('pointerover', e => { if (!isMouse(e)) return; target = e.target; x = e.clientX; y = e.clientY; if (on) { pend = false; check() } else sched() }, true);
  addEventListener('pointerdown', e => {
    if (!on || e.button !== 0 || !isMouse(e)) return; x = e.clientX; y = e.clientY; target = e.target; mount(); const k = classify(target);
    if (k === 'grab') { held = true; apply('grabbing') } else if (k === 'pointer') { apply('pointer'); play(2, [1, 2, 3, 4, 5, 6, 7], 50) }
  }, true);
  const up = () => { held = false; sched() };
  addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true);
  const gone = () => { seen = false; if (seq) animEnd() };
  document.addEventListener('mouseleave', gone); addEventListener('blur', gone);
  document.addEventListener('mouseenter', () => { seen = true });
  root.GameCursor = { enable(v) { on = !!v; try { localStorage.setItem('projectA.cursor', on ? '1' : '0') } catch (e) { } if (!on) { apply(''); kind = '' } }, kind: () => kind, debug: () => ({ kind, seq, raf, on, held }) };
})(globalThis);

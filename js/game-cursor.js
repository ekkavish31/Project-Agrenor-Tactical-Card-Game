/* v98.680 · GAME CURSORS — the hand-painted cursor set (assets/cursor/*, cut from the artist's sheet: grab hand · fist · pointing hand with a tap + sparkle · magnifier with sparkle)
   What the player sees:
     • anything the page already marks clickable (CSS/JS cursor:pointer)  → the pointing hand; every click plays its "finger taps down + star sparkle" animation
     • anything draggable (cursor:grab)                                    → the open hand;  while it is held (cursor:grabbing / mouse down on it) → the fist
     • anything that opens a detail view (card thumbnails, [data-inspect], cursor:zoom-in / help) → the magnifier, which glitters once when the pointer arrives
     • everything else keeps the page's own arrow.
   How: the page's authored cursor is READ (never replaced by guesswork) and mapped to html.agc-<kind>, whose rule swaps in the picture (cursor:url + 2x). The tap / glitter
   animations are drawn by a small fixed <div> following the pointer (the real cursor is hidden for those ~0.4 s).  Not used for touch, and not in the editor tools (?editor= / ?edit=).
   Off:  localStorage 'projectA.cursor' = '0'  or  ?cursor=0.   API: GameCursor.enable(on) */
(function (root) {
  'use strict';
  if (root.GameCursor || typeof document === 'undefined') return;
  const Q = location.search; if (/[?&](editor|edit)=/.test(Q) || /[?&]cursor=0/.test(Q)) return;
  try { if (localStorage.getItem('projectA.cursor') === '0') return } catch (e) { }
  if (!root.matchMedia || !matchMedia('(pointer:fine)').matches) return;
  const D = 'assets/cursor/', H = document.documentElement, HS = { pointer: [9, 4], grab: [24, 24], grabbing: [24, 28], zoom: [22, 22] }, KEY = { pointer: 'pointer', grab: 'grab', grabbing: 'grabbing', zoom: 'zoom-in' };
  /* v98.690 · Editor › Visual › HUD › เคอร์เซอร์ saves {cursorArrow:'gold'|'fantasy'|'system', hands:true|false} in localStorage 'projectA.visual'
       gold = the artist's gold arrow (default) · fantasy = the earlier cursor-fantasy.png · system = the OS arrow;  hands = the painted hand / fist / magnifier cursors (off → the arrow everywhere) */
  const vs = () => { try { return JSON.parse(localStorage.getItem('projectA.visual')) || {} } catch (e) { return {} } };
  const O = { arrow: ['gold', 'fantasy', 'system'].includes(vs().cursorArrow) ? vs().cursorArrow : 'gold', hands: vs().hands !== false };
  const ARROW = { gold: { url: D + 'gold-arrow.png', url2: D + 'gold-arrow@2x.png', hs: [9, 9] }, fantasy: { url: 'assets/cursor-fantasy.png', hs: [4, 3] } };
  const st = document.createElement('style'); st.id = 'agcCss';
  const rule = (cls, img, hs, kw) => `html.${cls},html.${cls} *{cursor:url(${img.url}) ${hs[0]} ${hs[1]},${kw}!important;${img.url2 ? `cursor:-webkit-image-set(url(${img.url}) 1x,url(${img.url2}) 2x) ${hs[0]} ${hs[1]},${kw}!important` : ''}}`;
  st.textContent = Object.keys(HS).map(k => rule('agc-' + k, { url: D + k + '.png', url2: D + k + '@2x.png' }, HS[k], KEY[k])).join('\n') +
    (ARROW[O.arrow] ? '\n' + rule('agc-arrow', ARROW[O.arrow], ARROW[O.arrow].hs, 'default') : '\nhtml.agc-sys body{cursor:auto!important}html.agc-sys button,html.agc-sys [role=button],html.agc-sys .station{cursor:pointer!important}') +
    '\nhtml.agc-anim,html.agc-anim *{cursor:none!important}\n#agcFx{position:fixed;left:0;top:0;width:48px;height:48px;pointer-events:none;z-index:2147483647;background:url(' + D + 'cursor-atlas.webp) 0 0/384px 144px no-repeat;display:none;will-change:transform}';
  if (!ARROW[O.arrow]) H.classList.add('agc-sys');
  document.head.appendChild(st);
  let on = true, kind = '', held = false, x = -99, y = -99, target = null, pend = false, lastCheck = 0, fx = null, animTimer = 0, animRun = 0;
  new Image().src = D + 'cursor-atlas.webp';
  const CLS = [...Object.keys(HS), 'arrow'].map(k => 'agc-' + k);
  const classify = el => {
    const had = CLS.find(c => H.classList.contains(c)); if (had) H.classList.remove(had);
    let k = '';
    try {
      if (el && el.nodeType === 1) {
        const c = (getComputedStyle(el).cursor || '').split(',').pop().trim();
        k = c === 'pointer' ? 'pointer' : c === 'grab' ? 'grab' : c === 'grabbing' ? 'grabbing' : (c === 'zoom-in' || c === 'help') ? 'zoom' : (c === 'auto' || c === 'default') ? 'arrow' : '';
        if (k === 'pointer' && el.closest('.card-thumb,.bag-thumb,[data-inspect]')) k = 'zoom';
      }
    } catch (e) { }
    if (had) H.classList.add(had);
    if (k === 'arrow' && !ARROW[O.arrow]) k = '';                                  /* OS arrow: leave it */
    if (!O.hands && (k === 'pointer' || k === 'grab' || k === 'grabbing' || k === 'zoom')) k = ARROW[O.arrow] ? 'arrow' : '';   /* hands off: the arrow everywhere */
    return k;
  };
  const apply = k => { if (k === kind) return; const was = kind; kind = k; for (const c of CLS) H.classList.remove(c); if (k) H.classList.add('agc-' + k); if (k === 'zoom' && was !== 'zoom') play(1, [1, 2, 3, 4, 5, 6, 7], 55, HS.zoom) };
  const check = () => { pend = false; if (!on || animRun) return; lastCheck = performance.now(); let k = classify(target); if (held && k === 'grab') k = 'grabbing'; apply(k) };
  const sched = () => { if (!pend) { pend = true; requestAnimationFrame(check) } };
  /* the animation overlay: lives in the open modal dialog (the browser's top layer would hide it otherwise) */
  const host = () => { const d = document.querySelectorAll('dialog[open]'); return d.length ? d[d.length - 1] : document.body };
  function play(row, frames, ms, hs) {
    if (!on) return; if (!fx) { fx = document.createElement('div'); fx.id = 'agcFx' }
    const h = host(); if (fx.parentNode !== h) h.appendChild(fx);
    const id = ++animRun; clearTimeout(animTimer); H.classList.add('agc-anim'); fx.style.display = 'block'; let i = 0;
    const place = () => { fx.style.transform = `translate(${Math.round(x - hs[0])}px,${Math.round(y - hs[1])}px)` };
    root.__agcPlace = place; place();
    const step = () => { if (id !== animRun) return; if (i >= frames.length) { fx.style.display = 'none'; H.classList.remove('agc-anim'); animRun = 0; sched(); return } fx.style.backgroundPosition = `${-frames[i] * 48}px ${-row * 48}px`; i++; animTimer = setTimeout(step, ms) };
    step();
  }
  const move = e => { if (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return; x = e.clientX; y = e.clientY; target = e.target; if (animRun && root.__agcPlace) root.__agcPlace(); if (!animRun && (kind === '' || performance.now() - lastCheck > 90 || e.target !== target)) sched() };
  addEventListener('pointermove', move, true);
  addEventListener('pointerover', e => { if (e.pointerType === 'touch') return; target = e.target; x = e.clientX; y = e.clientY; sched() }, true);
  addEventListener('pointerdown', e => {
    if (!on || e.button !== 0 || (e.pointerType && e.pointerType !== 'mouse' && e.pointerType !== 'pen')) return; x = e.clientX; y = e.clientY; target = e.target;
    const k = classify(target);
    if (k === 'grab') { held = true; apply('grabbing') } else if (k === 'pointer') play(2, [1, 2, 3, 4, 5, 6, 7], 50, HS.pointer);
  }, true);
  const up = () => { if (held) { held = false; sched() } else sched() };
  addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true);
  document.addEventListener('mouseleave', () => { for (const c of CLS) H.classList.remove(c); kind = '' });
  root.GameCursor = { enable(v) { on = !!v; try { localStorage.setItem('projectA.cursor', on ? '1' : '0') } catch (e) { } if (!on) { for (const c of CLS) H.classList.remove(c); H.classList.remove('agc-anim'); if (fx) fx.style.display = 'none'; kind = '' } }, kind: () => kind };
})(globalThis);

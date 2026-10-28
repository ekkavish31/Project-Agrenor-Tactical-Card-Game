/* v94.02 · Tablet / phone (landscape) support for every page of the game.
   • html.touch on touch screens, html.compact on short screens (landscape phones, height ≤ 520 px) → the CSS below shrinks HUDs, cards and
     toolbars and makes buttons finger-sized (min 40 px).
   • Pinch with two fingers = zoom: turned into wheel events on the canvas under the fingers, so every page's own wheel-zoom just works.
   • Phones held upright get a "turn your device" screen (the game is landscape-only); tablets in portrait still play.
   • No page zoom / double-tap zoom / pull-to-refresh / text selection while playing.
   Other files ask Touch.isTouch() — e.g. the battle hand: on touch the first tap on a card shows it, the second tap plays it. */
(function (root) {
  'use strict';
  const doc = root.document, html = doc.documentElement;
  const coarse = () => root.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in root;
  let lastPointer = 'mouse';
  addEventListener('pointerdown', e => { lastPointer = e.pointerType || 'mouse'; html.classList.toggle('touch', lastPointer === 'touch' || coarse()) }, true);
  function classes() { html.classList.toggle('touch', coarse()); html.classList.toggle('compact', innerHeight <= 520 || innerWidth <= 760); html.classList.toggle('portrait', innerHeight > innerWidth) }
  classes(); addEventListener('resize', classes); addEventListener('orientationchange', () => setTimeout(classes, 200));

  // viewport: no browser zoom (the game zooms itself)
  let vp = doc.querySelector('meta[name=viewport]'); if (!vp) { vp = doc.createElement('meta'); vp.name = 'viewport'; doc.head.append(vp) }
  vp.content = 'width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';

  /* ---------- pinch → wheel ---------- */
  const pts = new Map(); let pinch = null;
  addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') return; pts.set(e.pointerId, { x: e.clientX, y: e.clientY, el: e.target }); if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), el: a.el.closest?.('canvas') || a.el } } }, true);
  addEventListener('pointermove', e => {
    const p = pts.get(e.pointerId); if (!p) return; p.x = e.clientX; p.y = e.clientY;
    if (!pinch || pts.size < 2) return; const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y); if (!pinch.d) { pinch.d = d; return }
    const ratio = d / pinch.d; if (Math.abs(ratio - 1) < .02) return; pinch.d = d;
    const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
    pinch.el.dispatchEvent(new WheelEvent('wheel', { deltaY: -Math.log(ratio) * 400, deltaMode: 0, clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
  }, true);
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = null };
  addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true);
  doc.addEventListener('gesturestart', e => e.preventDefault());   // iOS Safari page pinch
  doc.addEventListener('dblclick', e => { if (html.classList.contains('touch')) e.preventDefault() });

  /* ---------- turn-your-phone screen (only the top page shows it) ---------- */
  if (root.top === root) {
    const turn = doc.createElement('div'); turn.id = 'turnDevice'; turn.innerHTML = '<div><b>⟳</b><p>หมุนเครื่องเป็นแนวนอนเพื่อเล่น</p><small>Project A เล่นแนวนอนเท่านั้น</small></div>';
    (doc.body ? Promise.resolve() : new Promise(r => addEventListener('DOMContentLoaded', r))).then(() => doc.body.append(turn));
  }

  /* ---------- touch / compact CSS for the shared HUDs of every page ---------- */
  const css = doc.createElement('style'); css.id = 'touchCss';
  css.textContent = `
  html.touch,html.touch body{overscroll-behavior:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}
  html.touch body{touch-action:manipulation}html.touch canvas{touch-action:none}
  html.touch button,html.touch .floatBtn,html.touch [data-act]{min-height:40px;min-width:40px}
  #turnDevice{display:none;position:fixed;inset:0;z-index:99999;background:#0b0f0c;color:#f3e9c9;align-items:center;justify-content:center;text-align:center;font:16px VillageThai,system-ui,sans-serif}
  #turnDevice b{display:block;font-size:56px;animation:tdSpin 2s ease-in-out infinite}#turnDevice small{opacity:.6}
  @keyframes tdSpin{0%,20%{transform:rotate(0)}60%,100%{transform:rotate(90deg)}}
  @media (orientation:portrait) and (max-width:600px){html.touch #turnDevice{display:flex}}
  /* battle (town-battle.js) */
  html.compact #fbHud{width:190px;padding:6px 8px;font-size:11px;max-height:calc(100vh - 140px)}
  html.compact #fbHud .bar{height:5px}html.compact #fbHud #fbLog{display:none}
  html.compact #fbHand{bottom:2px;gap:4px;padding:4px 6px}
  html.compact .fb-card,html.compact .fb-card .face{width:58px}html.compact .fb-card .fb-tag{font-size:9px}
  html.compact .fb-pile{transform:scale(.8)}html.compact .fb-show{transform:scale(.7);transform-origin:top left}
  html.touch #fbHud button{padding:8px 10px}
  /* world map, interiors */
  html.compact #wmHud,html.compact #inHud{width:200px;padding:7px 9px;font-size:11px;max-height:calc(100vh - 20px);overflow:auto}
  html.compact .wm-modal,html.compact .in-dlg{max-height:92vh;overflow:auto;font-size:13px}
  /* village (village-town.html) */
  html.compact .toolbar{top:8px!important;right:8px!important;gap:4px!important}
  html.compact .toolbar button{font-size:9px!important;padding:4px 5px!important}html.compact .toolbar button img{width:22px!important;height:22px!important;margin-bottom:1px!important}
  html.compact header{top:8px!important;left:10px!important}html.compact header h1{font-size:14px!important}html.compact #menuBtn{top:44px!important;left:10px!important}
  html.compact #townGameHud{top:86px!important;left:10px!important;font-size:11px!important;padding:6px 9px!important}
  html.compact #status{bottom:8px!important;left:10px!important;font-size:11px!important}html.compact #help{display:none}
  html.touch #help{display:none}
  /* game (index.html): story tracker, dialogs */
  html.compact #storyTracker{transform:scale(.82);transform-origin:top right}
  html.compact dialog{max-height:94vh;overflow:auto}
  html.compact .ew-box{font-size:12px;padding:10px 12px}
  `;
  (doc.head || html).append(css);

  root.Touch = { isTouch: () => html.classList.contains('touch'), lastPointer: () => lastPointer, compact: () => html.classList.contains('compact') };
})(window);

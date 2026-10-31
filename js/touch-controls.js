/* v98.16 · On-screen controls for tablets: a joystick (left) and action buttons (right), plus keyboard play on desktop.
   • Joystick = walk (the page moves the hero itself: it reads TouchControls.vec() every frame, so collisions stay the page's own).
   • Big round button = the ONE thing you can do right now (talk to the nearest villager · go through the nearest door · leave the room…).
     The page tells us what that is through adapter.context(); we show it as an icon + a short label and call adapter.act() when pressed.
   • Small round buttons (map · bag · menu) come from adapter.buttons.
   • Keyboard (desktop): WASD / arrow keys walk, E / Space = the big button.
   • Shown on touch screens (Settings: localStorage projectA.touchUI = auto | on | off · or ?touch=1 / ?touch=0).
   Pictures are the game's own menu icons (assets/icons/menu/*.webp). */
(function (root) {
  'use strict';
  const doc = root.document, KEY = 'projectA.touchUI', Q = new URLSearchParams(location.search);
  const mode = () => { const q = Q.get('touch'); if (q === '1') return 'on'; if (q === '0') return 'off'; try { return localStorage.getItem(KEY) || 'auto' } catch (e) { return 'auto' } };
  const coarse = () => !!(root.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in root);
  const wantUI = () => mode() === 'on' || (mode() === 'auto' && coarse());
  const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement?.tagName || '') || doc.activeElement?.isContentEditable;
  const blocked = () => !!doc.querySelector('dialog[open]') || (adapter?.paused?.() ?? false);
  let adapter = null, ui = null, held = new Set(), stick = { x: 0, y: 0, on: false }, ctx = null, lastCtx = '', timer = 0;

  /* ---- direction: joystick or keys, screen space (x right, y down), length 0..1 ---- */
  function vec() {
    if (blocked()) return { x: 0, y: 0 };
    if (stick.on) return { x: stick.x, y: stick.y };
    let x = 0, y = 0;
    if (held.has('left')) x -= 1; if (held.has('right')) x += 1; if (held.has('up')) y -= 1; if (held.has('down')) y += 1;
    const l = Math.hypot(x, y); return l ? { x: x / l, y: y / l } : { x: 0, y: 0 };
  }
  const moving = () => { const v = vec(); return Math.hypot(v.x, v.y) > .12 };
  const KEYS = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
  const editing = () => /[?&]edit=1/.test(location.search) || !!root.editing;
  addEventListener('keydown', e => {
    if (!adapter || typing() || e.ctrlKey || e.metaKey || e.altKey || editing()) return;
    const d = KEYS[e.key];
    if (d && !blocked()) { held.add(d); e.preventDefault(); return }
    if ((e.key === 'e' || e.key === 'E' || e.code === 'Space') && !e.repeat && !blocked()) { if (act()) e.preventDefault() }
  }, true);
  addEventListener('keyup', e => { const d = KEYS[e.key]; if (d) held.delete(d) }, true);
  addEventListener('blur', () => held.clear());

  /* ---- the big button ---- */
  function act() {
    if (!adapter) return false;
    const c = ctx || adapter.context?.(); if (!c) return false;
    try { navigator.vibrate?.(12) } catch (e) { }
    adapter.act?.(c); return true;
  }
  function refresh() {
    if (!adapter) return;
    let c = null; try { c = blocked() ? null : adapter.context?.() || null } catch (e) { }
    ctx = c; if (!ui) return;
    const sig = c ? c.kind + '|' + c.label + '|' + c.icon : '';
    if (sig === lastCtx) return; lastCtx = sig;
    ui.A.classList.toggle('idle', !c);
    ui.Aimg.src = 'assets/icons/menu/' + (c?.icon || 'quest') + '.webp';
    ui.tag.textContent = c ? c.label : ''; ui.tag.classList.toggle('show', !!c);
  }

  /* ---- DOM ---- */
  const CSS = `
  #tc{position:fixed;inset:0;z-index:25;pointer-events:none;font-family:VillageThai,'Noto Sans Thai',system-ui,sans-serif;-webkit-user-select:none;user-select:none;touch-action:none}
  #tc *{-webkit-tap-highlight-color:transparent}
  #tc .stick{position:absolute;left:max(22px,env(safe-area-inset-left));bottom:max(22px,env(safe-area-inset-bottom));width:150px;height:150px;border-radius:50%;pointer-events:auto;touch-action:none;
    background:radial-gradient(circle at 50% 45%,#1d3128d9,#0f1b15d9 70%);box-shadow:0 0 0 3px #d8b46a,0 0 0 5px #3a2a14,0 8px 20px #000a,inset 0 0 22px #000a}
  #tc .stick::before{content:"";position:absolute;inset:14px;border-radius:50%;border:1px dashed #f1dca055}
  #tc .stick i{position:absolute;color:#f1dca0aa;font:700 13px system-ui;font-style:normal}
  #tc .stick i:nth-child(1){left:50%;top:5px;transform:translateX(-50%)}#tc .stick i:nth-child(2){left:50%;bottom:5px;transform:translateX(-50%)}#tc .stick i:nth-child(3){top:50%;left:7px;transform:translateY(-50%)}#tc .stick i:nth-child(4){top:50%;right:7px;transform:translateY(-50%)}
  #tc .knob{position:absolute;left:50%;top:50%;width:66px;height:66px;margin:-33px 0 0 -33px;border-radius:50%;background:radial-gradient(circle at 35% 28%,#f3d48a,#c9953a 60%,#8a5f1d);box-shadow:0 0 0 2px #3a2a14,0 6px 12px #000b,inset 0 2px 0 #fff6;transition:transform .08s}
  #tc .stick.on .knob{transition:none}
  #tc .btns{position:absolute;right:max(24px,env(safe-area-inset-right));bottom:max(24px,env(safe-area-inset-bottom));width:330px;height:150px;pointer-events:none}
  #tc .b{position:absolute;border:0;padding:0;background:none;pointer-events:auto;cursor:pointer;touch-action:manipulation;transition:transform .08s,filter .15s}
  #tc .b img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 8px #000b);pointer-events:none;-webkit-user-drag:none}
  #tc .b:active,#tc .b.press{transform:scale(.9)}
  #tc .A{right:0;bottom:0;width:96px;height:96px}
  #tc .A.idle{filter:grayscale(.85) brightness(.7);opacity:.78}
  #tc .A:not(.idle){animation:tcPulse 1.6s ease-in-out infinite}
  @keyframes tcPulse{50%{transform:scale(1.07)}}
  #tc .A:not(.idle):active{animation:none}
  #tc .tcTag{position:absolute;right:0;bottom:102px;max-width:230px;padding:5px 12px;border-radius:999px;background:#16251eee;border:1px solid #d8b46a99;color:#fff3d2;font:700 14px VillageThai,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 3px 10px #0008;opacity:0;transform:translateY(6px);transition:opacity .15s,transform .15s;pointer-events:none}
  #tc .tcTag.show{opacity:1;transform:none}
  #tc .s{width:60px;height:60px}
  #tc .hide{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);pointer-events:auto;border:1px solid #d8b46a66;background:#16251e99;color:#f1dca0;border-radius:999px;font:600 11px system-ui;padding:3px 10px;opacity:.55}
  html.compact #tc .stick{width:128px;height:128px}html.compact #tc .knob{width:56px;height:56px;margin:-28px 0 0 -28px}html.compact #tc .A{width:84px;height:84px}html.compact #tc .s{width:52px;height:52px}html.compact #tc .tcTag{bottom:90px}
  @media (max-height:430px){#tc .stick{width:112px;height:112px;bottom:12px;left:14px}#tc .btns{bottom:12px;right:14px}}`;

  function build() {
    if (ui || !adapter || !doc.body) return;
    const st = doc.createElement('style'); st.textContent = CSS; doc.head.append(st);
    const el = doc.createElement('div'); el.id = 'tc';
    el.innerHTML = `<div class="stick" aria-label="จอยสติ๊กเดิน"><i>▲</i><i>▼</i><i>◀</i><i>▶</i><div class="knob"></div></div>
      <div class="btns"><div class="tcTag"></div><button class="b A idle" type="button" aria-label="ทำสิ่งที่อยู่ตรงหน้า"><img src="assets/icons/menu/quest.webp" alt="" draggable="false"></button></div>`;
    doc.body.append(el);
    const btns = el.querySelector('.btns'), A = btns.querySelector('.A'), tag = btns.querySelector('.tcTag'), Aimg = A.querySelector('img');
    ui = { el, A, Aimg, tag, stick: el.querySelector('.stick'), knob: el.querySelector('.knob') };
    // small buttons: arc above-left of A
    const list = adapter.buttons || [], pos = [[112, 18], [178, 18], [244, 18]];
    list.slice(0, 3).forEach((b, i) => {
      const e = doc.createElement('button'); e.type = 'button'; e.className = 'b s'; e.title = b.title || ''; e.setAttribute('aria-label', b.title || b.id);
      e.style.right = pos[i][0] + 'px'; e.style.bottom = pos[i][1] + 'px';
      e.innerHTML = `<img src="assets/icons/menu/${b.icon}.webp" alt="" draggable="false">`;
      e.addEventListener('click', ev => { ev.stopPropagation(); try { navigator.vibrate?.(8) } catch (x) { } b.run?.() }); btns.append(e);
    });
    A.addEventListener('click', ev => { ev.stopPropagation(); act() });
    // joystick
    const S = ui.stick; let pid = null;
    const set = ev => {
      const r = S.getBoundingClientRect(), R = r.width / 2, cx = r.left + R, cy = r.top + R;
      let dx = (ev.clientX - cx) / (R - 10), dy = (ev.clientY - cy) / (R - 10); const l = Math.hypot(dx, dy);
      if (l > 1) { dx /= l; dy /= l }
      const dead = Math.hypot(dx, dy) < .16;
      stick.x = dead ? 0 : dx; stick.y = dead ? 0 : dy; stick.on = !dead || pid !== null;
      ui.knob.style.transform = `translate(${dx * (R - 33)}px,${dy * (R - 33)}px)`;
    };
    S.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); pid = ev.pointerId; try { S.setPointerCapture(pid) } catch (e) { } S.classList.add('on'); set(ev) });
    S.addEventListener('pointermove', ev => { if (ev.pointerId === pid) { ev.preventDefault(); set(ev) } });
    const end = ev => { if (ev.pointerId !== pid) return; pid = null; stick.x = stick.y = 0; stick.on = false; S.classList.remove('on'); ui.knob.style.transform = '' };
    S.addEventListener('pointerup', end); S.addEventListener('pointercancel', end); S.addEventListener('lostpointercapture', end);
    // keep the page's own click-to-walk from firing under the controls
    for (const t of ['pointerdown', 'pointerup', 'click']) btns.addEventListener(t, ev => ev.stopPropagation());
    lastCtx = '\0'; refresh();
  }
  function destroy() { if (!ui) return; ui.el.remove(); ui = null; stick.x = stick.y = 0; stick.on = false; lastCtx = '' }

  function attach(a) {
    adapter = a;
    const start = () => { if (wantUI()) build(); timer = timer || setInterval(() => { if (wantUI() && !ui) build(); if (!wantUI() && ui) destroy(); refresh() }, 140) };
    doc.body ? start() : addEventListener('DOMContentLoaded', start);
  }
  function setMode(m) { try { localStorage.setItem(KEY, m) } catch (e) { } if (adapter) { if (wantUI()) build(); else destroy() } }
  root.TouchControls = { attach, vec, moving, act, setMode, mode, enabled: () => wantUI(), shown: () => !!ui };
})(globalThis);

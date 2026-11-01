/* v98.19 · On-screen controls + keyboard + gamepad. One input layer for every page that has a hero.
   • Joystick (left) / WASD / arrow keys / gamepad left stick or D-pad  → TouchControls.vec()   (the page moves the hero itself, so its collisions stay its own)
   • Big button / E / Space / gamepad A  → the ONE thing you can do right now (adapter.context() → adapter.act()).
       – tap = do it · HOLD (0.45 s) = a ring of choices around the button (item.options, e.g. talk · ask · give · hire) · release on a choice
       – "bump": walking into a door / villager for ~0.4 s does it too (item.bump) — a ring fills around the button while you push
   • Small buttons (adapter.buttons: map · bag · menu) · gamepad X = bag · Y = map · Start = menu · B = back (Esc) · LB/RB = adapter.shoulder(∓1)
   • What "right now" means comes from the page: village / rooms read the shared registry (js/interactables.js); the tactical battle moves its tile cursor.
   Shown on touch screens (Settings: projectA.touchUI = auto | on | off · or ?touch=1 / ?touch=0). Pictures: assets/icons/menu/*.webp. */
(function (root) {
  'use strict';
  const doc = root.document, KEY = 'projectA.touchUI', BUMPKEY = 'projectA.bump', Q = new URLSearchParams(location.search);
  const HOLD = .45, BUMP = .4;
  const mode = () => { const q = Q.get('touch'); if (q === '1') return 'on'; if (q === '0') return 'off'; try { return localStorage.getItem(KEY) || 'auto' } catch (e) { return 'auto' } };
  const bumpOn = () => { try { return localStorage.getItem(BUMPKEY) !== '0' } catch (e) { return true } };
  const coarse = () => !!(root.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in root);
  const wantUI = () => mode() === 'on' || (mode() === 'auto' && coarse());
  const typing = () => /^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement?.tagName || '') || doc.activeElement?.isContentEditable;
  let adapter = null, ui = null, ctx = null, lastCtx = '', timer = 0, raf = 0;
  const held = new Set(), stick = { x: 0, y: 0, on: false }, padV = { x: 0, y: 0 };
  const visible = () => !!adapter && (adapter.visible?.() ?? true);
  /* owns(): the game itself is being played with our controls (no menu / dialog / facing picker open) → the older ConsoleUI gamepad→keys bridge must stay quiet,
     or A would press twice and B would open-and-close the pause menu. */
  const menuUp = () => !!doc.querySelector('dialog[open],#cuMenu,#fbPause') || (adapter?.menuOpen?.() ?? false);
  const owns = () => visible() && !menuUp();
  const blocked = () => !visible() || !!doc.querySelector('dialog[open]') || (adapter?.paused?.() ?? false);

  /* ---- direction ---- */
  /* The game is drawn in 2:1 isometric: its floor axes run at ±26.57° on screen, not ±45°. So "up-right" must travel along the up-right floor axis.
     vec() = the raw stick / key direction with the vertical half squashed (45° in → 26.57° out), same length. rawVec() = the plain direction (radial menu, UI). */
  function vec() {
    const r = rawVec(), m = Math.hypot(r.x, r.y); if (!m) return r;
    const x = r.x, y = r.y * .5, k = m / (Math.hypot(x, y) || 1); return { x: x * k, y: y * k };
  }
  function rawVec() {
    if (blocked()) return { x: 0, y: 0 };
    if (stick.on && Math.hypot(stick.x, stick.y) > 0) return { x: stick.x, y: stick.y };
    if (Math.hypot(padV.x, padV.y) > .01) return { x: padV.x, y: padV.y };
    let x = 0, y = 0;
    if (held.has('left')) x -= 1; if (held.has('right')) x += 1; if (held.has('up')) y -= 1; if (held.has('down')) y += 1;
    const l = Math.hypot(x, y); return l ? { x: x / l, y: y / l } : { x: 0, y: 0 };
  }
  let lastMove = -1e9;
  const moving = () => { const v = vec(); const m = Math.hypot(v.x, v.y) > .12; if (m) lastMove = performance.now(); return m };
  const KEYS = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
  const editing = () => /[?&]edit=1/.test(location.search) || !!root.editing;

  /* ---- the big button: tap / hold ---- */
  const btn = { down: false, t: 0, src: '', radial: false, sel: 0 };
  function pressStart(src) { if (btn.down || !visible()) return; btn.down = true; btn.t = 0; btn.src = src; btn.radial = false; btn.sel = 0 }
  function pressEnd(src) {
    if (!btn.down || btn.src !== src) return; btn.down = false;
    if (btn.radial) { closeRadial(true) } else act();
  }
  function act(c) {
    if (!adapter) return false;
    c = c || ctx || adapter.context?.(); if (!c) return false;
    try { navigator.vibrate?.(12) } catch (e) { }
    adapter.act?.(c); return true;
  }
  /* radial angle of option i of n: the fan ends straight up (270°) and opens to the upper-left, wider for more options */
  const ang = (i, n) => { if (n === 1) return 270; const span = Math.min(84, (n - 1) * 28); return 270 - span + i * span / (n - 1) };
  function openRadial() {
    const c = ctx; if (!c?.options?.length || c.options.length < 2 || !ui) return false;
    btn.radial = true; btn.sel = 0; ui.rad.innerHTML = '';
    const n = c.options.length, R = n > 3 ? 152 : 138;
    c.options.forEach((o, i) => {
      const a = ang(i, n) * Math.PI / 180, e = doc.createElement('div');
      e.className = 'ro';
      e.style.right = (-Math.cos(a) * R + 48 - 34) + 'px'; e.style.bottom = (Math.sin(a) * -R + 48 - 34) + 'px';
      e.innerHTML = `<img src="assets/icons/menu/${o.icon || 'quest'}.webp" alt="" draggable="false"><b>${(o.label || '').replace(/</g, '&lt;')}</b>`;
      e.dataset.i = i; ui.rad.append(e);
    });
    ui.rad.hidden = false; selMark(); try { navigator.vibrate?.(18) } catch (e) { } return true;
  }
  function selMark() { ui?.rad.querySelectorAll('.ro').forEach((e, i) => e.classList.toggle('on', i === btn.sel)) }
  function closeRadial(run) {
    const c = ctx, o = c?.options?.[btn.sel]; btn.radial = false; if (ui) ui.rad.hidden = true;
    if (run && o) { try { navigator.vibrate?.(12) } catch (e) { } o.run ? o.run(c) : adapter.act?.({ ...c, option: o }) }
  }
  /* choose a radial option from a direction (stick/keys/pointer): the option whose angle is closest */
  function pickDir(x, y) {
    const c = ctx; if (!c?.options || Math.hypot(x, y) < .35) return;
    const n = c.options.length, deg = Math.atan2(y, x) * 180 / Math.PI, a = ((deg % 360) + 360) % 360;   // 270 = up · options fan out from the upper-left (215) to straight up (270)
    let best = 0, bd = 1e9; for (let i = 0; i < n; i++) { const t = ang(i, n), d = Math.abs(a - t); if (d < bd) { bd = d; best = i } }
    if (best !== btn.sel) { btn.sel = best; selMark(); try { navigator.vibrate?.(6) } catch (e) { } }
  }

  /* ---- keyboard ---- */
  addEventListener('keydown', e => {
    if (!visible() || adapter.keys === false || typing() || e.ctrlKey || e.metaKey || e.altKey || editing()) return;
    const d = KEYS[e.key];
    if (d && !blocked()) { held.add(d); if (!btn.radial) e.preventDefault(); return }
    if ((e.key === 'e' || e.key === 'E' || e.code === 'Space') && adapter.noActKey !== true && !blocked()) { if (!e.repeat && (ctx || adapter.alwaysAct)) { pressStart('key'); e.preventDefault() } else if (btn.down) e.preventDefault() }
    if (btn.radial && /^[1-5]$/.test(e.key)) { btn.sel = Math.min(+e.key - 1, (ctx?.options?.length || 1) - 1); selMark(); e.preventDefault() }
  }, true);
  addEventListener('keyup', e => {
    if (adapter?.keys === false) return;
    const d = KEYS[e.key]; if (d) held.delete(d);
    if (e.key === 'e' || e.key === 'E' || e.code === 'Space') pressEnd('key');
  }, true);
  addEventListener('blur', () => { held.clear(); if (btn.radial) closeRadial(false); btn.down = false });

  /* ---- gamepad ---- */
  const pads = { prev: [] };
  function padPoll() {
    let g = null; try { for (const x of navigator.getGamepads?.() || []) if (x && x.connected) { g = x; break } } catch (e) { }
    if (!g) { padV.x = padV.y = 0; return }
    let x = g.axes[0] || 0, y = g.axes[1] || 0; const l = Math.hypot(x, y);
    if (l < .28) { x = y = 0 } else { const k = Math.min(1, (l - .28) / .62) / l; x *= k; y *= k }
    const B = i => !!g.buttons[i]?.pressed;
    if (B(14)) x = -1; if (B(15)) x = 1; if (B(12)) y = -1; if (B(13)) y = 1;
    padV.x = x; padV.y = y;
    const edge = i => B(i) && !pads.prev[i], rel = i => !B(i) && pads.prev[i];
    if (owns()) {
      if (edge(0)) pressStart('pad'); if (rel(0)) pressEnd('pad');
      if (edge(1)) { if (adapter.back) adapter.back(); else dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) }
      const by = id => adapter.buttons?.find(b => b.id === id);
      const pb = adapter.padButtons;
      if (edge(2)) (pb?.[2] || (() => by('bag')?.run?.()))(); if (edge(3)) (pb?.[3] || (() => by('map')?.run?.()))(); if (edge(8)) (pb?.[8] || (() => by('wip')?.run?.()))(); if (edge(9)) (pb?.[9] || (() => by('menu')?.run?.() ?? dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))))();
      if (edge(4)) adapter.shoulder?.(-1); if (edge(5)) adapter.shoulder?.(1);
    }
    pads.prev = g.buttons.map(b => !!b.pressed);
  }
  addEventListener('gamepadconnected', () => { toast('ต่อจอยเกมแพดแล้ว · สติ๊กซ้ายเดิน · A ทำ · กด A ค้าง = ตัวเลือก · B ย้อน · X กระเป๋า · Y แผนที่') });
  function toast(t) { if (!doc.body) return; const e = doc.createElement('div'); e.textContent = t; e.style.cssText = 'position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:60;padding:7px 16px;border-radius:999px;background:#16251eee;border:1px solid #d8b46a99;color:#fff3d2;font:700 13px VillageThai,system-ui,sans-serif;box-shadow:0 4px 14px #0009;pointer-events:none'; doc.body.append(e); setTimeout(() => e.remove(), 3800) }

  /* ---- frame loop: pad · hold timer · bump ---- */
  let last = 0, bumpT = 0, cool = 0;
  function frame(t) {
    raf = requestAnimationFrame(frame); const dt = Math.min(.1, (t - last) / 1000 || .016); last = t; if (!adapter) return;
    padPoll();
    if (btn.down) {
      btn.t += dt;
      if (!btn.radial && btn.t >= HOLD && ctx?.options?.length > 1) openRadial();
      if (btn.radial) { const v = rawVec(); pickDir(v.x, v.y) }
    }
    cool = Math.max(0, cool - dt);
    if (visible() && !blocked() && moving()) { try { ctx = adapter.context?.() || null } catch (e) { } }   /* fresh while walking: a door is passed in a fraction of a second */
    const c = ctx; let p = 0;
    if (c && c.bump && bumpOn() && !blocked() && !btn.radial && cool <= 0 && c.sx != null) {
      const v = vec(), l = Math.hypot(c.sx, c.sy) || 1, vm = Math.hypot(v.x, v.y) || 1, dot = (v.x * c.sx + v.y * c.sy) / (l * vm);   // both directions normalised: a half-tilted stick counts the same
      if (Math.hypot(v.x, v.y) > .3 && dot > .55 && (c.dist ?? 9) <= (c.bumpR ?? 1.2)) { const need = c.bumpT ?? BUMP; bumpT += dt; p = Math.min(1, bumpT / need); if (bumpT >= need) { bumpT = 0; cool = 1.6; act(c) } } else bumpT = Math.max(0, bumpT - dt * 2.5);
    } else bumpT = Math.max(0, bumpT - dt * 2.5);
    if (ui) { ui.A.style.setProperty('--p', Math.round(Math.max(p, btn.down && !btn.radial ? Math.min(1, btn.t / HOLD) * (ctx?.options?.length > 1 ? 1 : 0) : 0) * 100) + '%'); ui.A.classList.toggle('press', btn.down) }
  }
  function refresh() {
    if (!adapter) return;
    const vis = visible(); if (ui) ui.el.hidden = !vis;
    let c = null; try { c = !vis || blocked() ? null : adapter.context?.() || null } catch (e) { }
    ctx = c; root.Interactables?.setFocus(c && (ui || performance.now() - lastMove < 4000) ? c.id : null);   /* white outline on whatever A would act on */
    if (!ui) return;
    const sig = c ? c.kind + '|' + c.label + '|' + c.icon + '|' + (c.quest ? 1 : 0) + '|' + (c.options?.length || 0) : '';
    if (sig === lastCtx) return; lastCtx = sig;
    ui.A.classList.toggle('idle', !c);
    ui.Aimg.src = 'assets/icons/menu/' + (c?.icon || 'quest') + '.webp';
    ui.tag.textContent = c ? (c.quest ? '★ ' : '') + c.label + (c.options?.length > 1 ? ' · กดค้าง' : '') : ''; ui.tag.classList.toggle('show', !!c);
  }

  /* ---- DOM ---- */
  const CSS = `
  #tc{position:fixed;inset:0;z-index:25;pointer-events:none;font-family:VillageThai,'Noto Sans Thai',system-ui,sans-serif;-webkit-user-select:none;user-select:none;touch-action:none}
  #tc[hidden]{display:none}
  #tc *{-webkit-tap-highlight-color:transparent}
  #tc .stick{position:absolute;left:max(22px,env(safe-area-inset-left));bottom:max(22px,env(safe-area-inset-bottom));width:150px;height:150px;border-radius:50%;pointer-events:auto;touch-action:none;
    background:radial-gradient(circle at 50% 45%,#1d3128d9,#0f1b15d9 70%);box-shadow:0 0 0 3px #d8b46a,0 0 0 5px #3a2a14,0 8px 20px #000a,inset 0 0 22px #000a}
  #tc .stick::before{content:"";position:absolute;inset:14px;border-radius:50%;border:1px dashed #f1dca055}
  #tc .stick i{position:absolute;color:#f1dca0aa;font:700 13px system-ui;font-style:normal}
  #tc .stick i:nth-child(1){left:50%;top:5px;transform:translateX(-50%)}#tc .stick i:nth-child(2){left:50%;bottom:5px;transform:translateX(-50%)}#tc .stick i:nth-child(3){top:50%;left:7px;transform:translateY(-50%)}#tc .stick i:nth-child(4){top:50%;right:7px;transform:translateY(-50%)}
  #tc .knob{position:absolute;left:50%;top:50%;width:66px;height:66px;margin:-33px 0 0 -33px;border-radius:50%;background:radial-gradient(circle at 35% 28%,#f3d48a,#c9953a 60%,#8a5f1d);box-shadow:0 0 0 2px #3a2a14,0 6px 12px #000b,inset 0 2px 0 #fff6;transition:transform .08s}
  #tc .stick.on .knob{transition:none}
  #tc .btns{position:absolute;right:max(24px,env(safe-area-inset-right));bottom:max(24px,env(safe-area-inset-bottom));width:330px;height:150px;pointer-events:none}
  #tc .b{position:absolute;border:0;padding:0;background:none;pointer-events:auto;cursor:pointer;touch-action:none;transition:transform .08s,filter .15s}
  #tc .b img{width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 6px 8px #000b);pointer-events:none;-webkit-user-drag:none}
  #tc .b:active,#tc .b.press{transform:scale(.92)}
  #tc .A{right:0;bottom:0;width:96px;height:96px;border-radius:22px}
  #tc .A::after{content:"";position:absolute;inset:-7px;border-radius:50%;background:conic-gradient(#ffd25a var(--p,0%),#0000 0);-webkit-mask:radial-gradient(circle,#0000 56%,#000 58%);mask:radial-gradient(circle,#0000 56%,#000 58%);pointer-events:none}
  #tc .A.idle{filter:grayscale(.85) brightness(.7);opacity:.78}
  #tc .A:not(.idle){animation:tcPulse 1.6s ease-in-out infinite}
  @keyframes tcPulse{50%{transform:scale(1.07)}}
  #tc .A.press{animation:none}
  #tc .tcTag{position:absolute;right:0;bottom:104px;max-width:300px;padding:5px 12px;border-radius:999px;background:#16251eee;border:1px solid #d8b46a99;color:#fff3d2;font:700 14px VillageThai,system-ui,sans-serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-shadow:0 3px 10px #0008;opacity:0;transform:translateY(6px);transition:opacity .15s,transform .15s;pointer-events:none}
  #tc .tcTag.show{opacity:1;transform:none}
  #tc .s{width:60px;height:60px}
  #tc .rad{position:absolute;right:0;bottom:0;width:96px;height:96px;pointer-events:none}
  #tc .rad[hidden]{display:none}
  #tc .ro{position:absolute;width:68px;height:68px;display:grid;place-items:center;border-radius:18px;background:#16251ef2;box-shadow:0 0 0 2px #d8b46a99,0 6px 14px #000a;transform:scale(.88);transition:transform .08s}
  #tc .ro img{width:52px;height:52px;object-fit:contain;margin-top:-6px}
  #tc .ro b{position:absolute;left:50%;bottom:-24px;transform:translateX(-50%);white-space:nowrap;padding:1px 9px;border-radius:999px;background:#16251ef2;border:1px solid #d8b46a80;color:#fff3d2;font:700 12px VillageThai,system-ui,sans-serif}
  #tc .ro.on{transform:scale(1.18);box-shadow:0 0 0 3px #ffd25a,0 0 18px #ffd25aaa,0 6px 14px #000a}
  html.compact #tc .stick{width:128px;height:128px}html.compact #tc .knob{width:56px;height:56px;margin:-28px 0 0 -28px}html.compact #tc .A{width:84px;height:84px}html.compact #tc .s{width:52px;height:52px}html.compact #tc .tcTag{bottom:92px}
  @media (max-height:430px){#tc .stick{width:112px;height:112px;bottom:12px;left:14px}#tc .btns{bottom:12px;right:14px}}`;

  function build() {
    if (ui || !adapter || !doc.body) return;
    const st = doc.createElement('style'); st.textContent = CSS; doc.head.append(st);
    const el = doc.createElement('div'); el.id = 'tc';
    el.innerHTML = `<div class="stick" aria-label="จอยสติ๊กเดิน"><i>▲</i><i>▼</i><i>◀</i><i>▶</i><div class="knob"></div></div>
      <div class="btns"><div class="tcTag"></div><button class="b A idle" type="button" aria-label="ทำสิ่งที่อยู่ตรงหน้า (กดค้าง = ตัวเลือก)"><img src="assets/icons/menu/quest.webp" alt="" draggable="false"></button><div class="rad" hidden></div></div>`;
    if (adapter.z) el.style.zIndex = adapter.z;   /* the battle's card bar sits at z 41: the controls must be above it */
    doc.body.append(el);
    const btns = el.querySelector('.btns'), A = btns.querySelector('.A'), tag = btns.querySelector('.tcTag'), Aimg = A.querySelector('img'), rad = btns.querySelector('.rad');
    ui = { el, A, Aimg, tag, rad, stick: el.querySelector('.stick'), knob: el.querySelector('.knob') };
    const list = adapter.buttons || [], pos = [[112, 18], [178, 18], [244, 18]];
    list.slice(0, 3).forEach((b, i) => {
      const e = doc.createElement('button'); e.type = 'button'; e.className = 'b s'; e.title = b.title || ''; e.setAttribute('aria-label', b.title || b.id);
      e.style.right = pos[i][0] + 'px'; e.style.bottom = pos[i][1] + 'px';
      e.innerHTML = `<img src="assets/icons/menu/${b.icon}.webp" alt="" draggable="false">`;
      e.addEventListener('click', ev => { ev.stopPropagation(); try { navigator.vibrate?.(8) } catch (x) { } b.run?.() }); btns.append(e);
    });
    // big button: pointer events so "hold" works (and the radial can be chosen by sliding the finger)
    let apid = null;
    A.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); apid = ev.pointerId; try { A.setPointerCapture(apid) } catch (e) { } pressStart('ptr') });
    A.addEventListener('pointermove', ev => { if (ev.pointerId !== apid || !btn.radial) return; const r = A.getBoundingClientRect(); pickDir(ev.clientX - (r.left + r.width / 2), ev.clientY - (r.top + r.height / 2)) });
    const aend = ev => { if (ev.pointerId !== apid) return; apid = null; pressEnd('ptr') };
    A.addEventListener('pointerup', aend); A.addEventListener('pointercancel', ev => { if (ev.pointerId !== apid) return; apid = null; btn.down = false; if (btn.radial) closeRadial(false) });
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
    for (const t of ['pointerdown', 'pointerup', 'click']) btns.addEventListener(t, ev => ev.stopPropagation());
    lastCtx = '\0'; refresh();
  }
  function destroy() { if (!ui) return; ui.el.remove(); ui = null; stick.x = stick.y = 0; stick.on = false; lastCtx = '' }

  function attach(a) {
    adapter = a;
    const start = () => { if (wantUI()) build(); timer = timer || setInterval(() => { if (wantUI() && !ui) build(); if (!wantUI() && ui) destroy(); refresh() }, 120); raf = raf || requestAnimationFrame(frame) };
    doc.body ? start() : addEventListener('DOMContentLoaded', start);
  }
  function setMode(m) { try { localStorage.setItem(KEY, m) } catch (e) { } if (adapter) { if (wantUI()) build(); else destroy() } }
  root.TouchControls = { owns, attach, vec, moving, act: () => act(), setMode, mode, setBump: on => { try { localStorage.setItem(BUMPKEY, on ? '1' : '0') } catch (e) { } }, bumpOn, enabled: () => wantUI(), shown: () => !!ui, context: () => ctx, toast, dbg: () => ({ bumpT, cool, held: [...held], vec: vec(), moving: moving(), vis: visible(), blocked: blocked(), bump: bumpOn(), ctx: ctx && { kind: ctx.kind, bump: ctx.bump, dist: ctx.dist, sx: ctx.sx, bumpR: ctx.bumpR } }) };
})(globalThis);

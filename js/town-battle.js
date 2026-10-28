/* v92.07 · ?battle=1 — flat-grid battle (phase 2) drawn on top of the village map. Hero vs one monster, no cards yet.
   The arena is a square of lattice cells around the plaza (?u=&v=&r= to move/resize). Terrain comes from the map itself:
   buildings/fences/outside = กีดขวาง (blocked, via blockedBase); painted ground: water/pond = กีดขวาง, mud/snow/sand = เดินช้า, moss/clover = กำบัง. */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search), ON = Q.get('battle') === '1';
  const SLOW = ['mud', 'snow', 'sand'], COVER = ['moss', 'clover'], WATER = ['water', 'pond'];
  const COL = { normal: null, slow: 'rgba(170,110,40,.38)', cover: 'rgba(60,170,80,.38)', blocked: 'rgba(210,60,60,.32)' };
  let userCam = false, camFrames = 0, st = null, cells = null, busy = false, reachMap = null, texts = [], hud = null, anims = [], shake = [];
  const img = src => { const i = new Image(); i.src = src; return i };
  const SPR = { hero: img('assets/tactics/hero_se_idle.webp'), monster: img('assets/enemies/bandit.webp') };
  const SPRITE = { hero: { h: 112, k: 384, foot: 24 / 384 }, monster: { h: 112, k: 768, foot: 0 } };
  const FB = window.FlatBattle;

  function build() {
    const sq = locations.find(o => o.id === 'square') || locations[0], c = center(sq);
    const r = +Q.get('r') || 7, cu = Math.floor(+Q.get('u') || c.u), cv = Math.floor(+Q.get('v') || c.v);
    const b = { u0: cu - r, v0: cv - r, u1: cu + r, v1: cv + r }, list = [];
    for (let u = b.u0; u <= b.u1; u++) for (let v = b.v0; v <= b.v1; v++) list.push({ u, v, p: project(u + .5, v + .5) });
    const mats = window.TownPaint?.matsAt ? TownPaint.matsAt(list.map(c => c.p)) : list.map(() => null);
    cells = new Map();
    list.forEach((c, i) => {
      const m = mats[i]; let k = 'normal';
      if (blockedBase(c.u + .5, c.v + .5)) k = 'blocked';
      else if (WATER.includes(m)) k = 'blocked';
      else if (SLOW.includes(m)) k = 'slow';
      else if (COVER.includes(m)) k = 'cover';
      cells.set(c.u + ',' + c.v, k);
    });
    const spot = (cu0, cv0) => { let best = null, bd = 1e9; for (const [key, k] of cells) { if (k === 'blocked') continue; const [u, v] = key.split(',').map(Number), d = Math.hypot(u - cu0, v - cv0); if (d < bd) { bd = d; best = { u, v } } } return best };
    const hs = spot(b.u0, b.v1), ms = spot(b.u1, b.v0);
    st = FB.create({ bounds: b, kindAt: (u, v) => cells.get(u + ',' + v) || 'blocked', hero: hs, monster: ms });
    for (const u of st.units) { u.vu = u.u + .5; u.vv = u.v + .5 }
    st.arena = { cu, cv, r };
    refresh();
  }
  function refresh() { reachMap = st.turn === 'hero' && !st.acted && !st.outcome ? FB.reach(st, FB.hero(st)) : null; hudSync() }
  function focusCamera() {
    const p = project(st.arena.cu + .5, st.arena.cv + .5);
    zoom = 1.05; pan = { x: -(p.x - WORLD_W / 2) * scale * zoom, y: -(p.y - WORLD_H / 2) * scale * zoom };
  }

  /* ---------- HUD ---------- */
  function hudMake() {
    const d = document.createElement('div'); d.id = 'fbHud';
    d.style.cssText = 'position:fixed;left:14px;top:14px;z-index:40;width:250px;background:#1b302af0;border:1px solid #b9c48a66;border-radius:12px;padding:10px 12px;color:#f3e9c9;font:13px system-ui,"Noto Sans Thai",sans-serif;box-shadow:0 8px 30px #0008';
    d.innerHTML = '<b style="color:#f6d79b">⚔ สนามรบ (เฟส 2 · ทดลอง)</b><div id="fbTurn" style="margin:4px 0 8px;color:#bba57f"></div><div id="fbUnits"></div><div style="display:flex;gap:6px;margin:8px 0"><button id="fbAtk">⚔ ตี</button><button id="fbEnd">จบเทิร์น</button><button id="fbNew">เริ่มใหม่</button></div><div id="fbLog" style="max-height:130px;overflow:auto;font-size:12px;color:#d8caa0"></div><div style="margin-top:6px;font-size:11px;color:#9aa68a">คลิกช่องฟ้า = เดิน · คลิกมอนที่อยู่ติดกัน = ตี<br>ช่อง: น้ำตาล เดินช้า · เขียว กำบัง −30% · แดง กีดขวาง</div>';
    document.body.append(d);
    const css = document.createElement('style'); css.textContent = '#fbHud button{font:inherit;background:#c9893a;color:#fff;border:0;border-radius:7px;padding:6px 9px;cursor:pointer}#fbHud button:disabled{opacity:.4;cursor:default}#fbHud .bar{height:7px;background:#0006;border-radius:4px;overflow:hidden;margin:2px 0 6px}#fbHud .bar i{display:block;height:100%}';
    document.head.append(css);
    d.querySelector('#fbAtk').onclick = () => doAttack();
    d.querySelector('#fbEnd').onclick = () => endHeroTurn();
    d.querySelector('#fbNew').onclick = () => { texts = []; anims = []; busy = false; build(); userCam = false; camFrames = 0 };
    hud = d;
  }
  function hudSync() {
    if (!hud) return;
    const h = FB.hero(st), m = FB.monster(st), unit = (u, col) => `<div>${u.name} <small style="color:#bba57f">ATK ${u.atk} · DEF ${u.def}</small> <span style="float:right">${u.hp}/${u.maxHp}</span></div><div class="bar"><i style="width:${Math.max(0, u.hp / u.maxHp * 100)}%;background:${col}"></i></div>`;
    hud.querySelector('#fbUnits').innerHTML = unit(h, '#6fd18a') + unit(m, '#e2705f');
    hud.querySelector('#fbTurn').textContent = st.outcome ? (st.outcome === 'win' ? '🏆 ชนะ!' : '💀 แพ้…') : (st.turn === 'hero' ? `เทิร์น ${st.turns} · ตาคุณ · แต้มเดิน ${st.mp}` : `เทิร์น ${st.turns} · ตามอน…`);
    hud.querySelector('#fbAtk').disabled = busy || st.outcome || st.turn !== 'hero' || st.acted || !FB.targets(st, h).length;
    hud.querySelector('#fbEnd').disabled = busy || !!st.outcome || st.turn !== 'hero';
    hud.querySelector('#fbLog').innerHTML = st.log.slice(-8).reverse().map(x => '<div>' + x + '</div>').join('');
  }

  /* ---------- actions + animation ---------- */
  const wait = ms => new Promise(r => setTimeout(r, ms));
  function walkAnim(unit, path) {
    return new Promise(res => { anims.push({ unit, pts: path.slice(1), i: 0, res }) });
  }
  function floatText(unit, txt, col) { texts.push({ u: unit.vu, v: unit.vv, txt, col, t0: performance.now() }) }
  async function heroMove(to) {
    const mv = FB.move(st, to); if (!mv.ok) { flash(mv.reason); return }
    busy = true; hudSync(); await walkAnim(FB.hero(st), mv.path); busy = false; refresh();
  }
  async function doAttack() {
    if (busy || st.turn !== 'hero') return;
    const at = FB.attack(st); if (!at.ok) { flash(at.reason); return }
    busy = true; hudSync(); await hit(FB.hero(st), at); busy = false; refresh();
    if (st.outcome) hudSync();
  }
  async function hit(att, at) {
    shake.push({ unit: at.target, t0: performance.now() });
    floatText(at.target, '−' + at.damage, '#ff9a8a'); await wait(380);
  }
  async function endHeroTurn() {
    if (busy || st.turn !== 'hero' || st.outcome) return;
    FB.endTurn(st); busy = true; refresh(); await wait(350);
    const m = FB.monster(st), h = FB.hero(st), steps = FB.monsterTurn(st);
    for (const s of steps) {
      if (s.type === 'move') await walkAnim(m, s.path);
      else if (s.type === 'attack') await hit(m, { target: h, damage: s.damage });
    }
    m.vu = m.u + .5; m.vv = m.v + .5; busy = false; refresh();
  }
  function flash(msg) { texts.push({ u: FB.hero(st).vu, v: FB.hero(st).vv, txt: msg, col: '#f6d79b', t0: performance.now(), small: true }) }

  function click(wp) {
    if (!st || busy || st.outcome || st.turn !== 'hero') return;
    const m = FB.monster(st), mp = project(m.vu, m.vv);
    const g = inv(wp.x, wp.y), to = { u: Math.floor(g.u), v: Math.floor(g.v) };
    const onMonster = (to.u === m.u && to.v === m.v) || (Math.abs(wp.x - mp.x) < 36 && wp.y < mp.y + 6 && wp.y > mp.y - 110);
    if (onMonster) { doAttack(); return }
    heroMove(to);
  }

  /* ---------- drawing ---------- */
  function poly(g, u, v) { const a = project(u, v), b = project(u + 1, v), c = project(u + 1, v + 1), d = project(u, v + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath() }
  let last = 0;
  function step(t) {
    const dt = Math.min(.1, (t - last) / 1000 || 0); last = t;
    for (let k = anims.length - 1; k >= 0; k--) {
      const a = anims[k], u = a.unit, tgt = a.pts[a.i];
      if (!tgt) { anims.splice(k, 1); a.res(); continue }
      const tu = tgt.u + .5, tv = tgt.v + .5, du = tu - u.vu, dv = tv - u.vv, len = Math.hypot(du, dv), sp = dt * 7;
      if (len <= sp) { u.vu = tu; u.vv = tv; a.i++ } else { u.vu += du / len * sp; u.vv += dv / len * sp }
    }
  }
  function sprite(g, unit, t) {
    const S = SPRITE[unit.side], im = SPR[unit.side]; if (!im.complete || !im.naturalWidth) return;
    const p = project(unit.vu, unit.vv), k = S.h / (S.k === 384 ? 384 * .83 : im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
    let ox = 0; const sh = shake.find(x => x.unit === unit && t - x.t0 < 300); if (sh) ox = Math.sin((t - sh.t0) * .06) * 5;
    g.save(); g.fillStyle = '#0006'; g.beginPath(); g.ellipse(p.x, p.y, 17, 8, 0, 0, 7); g.fill();
    if (unit.hp <= 0) g.globalAlpha = .35;
    if (unit.side === 'monster') g.translate(p.x, 0), g.scale(-1, 1), g.translate(-p.x, 0);
    g.drawImage(im, p.x - w / 2 + ox, p.y - h + (S.foot * h), w, h); g.restore();
    const bw = 44, bx = p.x - bw / 2, by = p.y - S.h - 6; g.fillStyle = '#000a'; g.fillRect(bx - 1, by - 1, bw + 2, 7); g.fillStyle = unit.side === 'hero' ? '#6fd18a' : '#e2705f'; g.fillRect(bx, by, bw * Math.max(0, unit.hp / unit.maxHp), 5);
  }
  function draw(g, t) {
    if (!ON) return;
    if (!st) { if (typeof locations === 'undefined' || !locations.length) return; build(); hudMake(); hudSync(); focusCamera() }
    step(t);
    g.save();
    for (const [key, k] of cells) {
      const [u, v] = key.split(',').map(Number); poly(g, u, v);
      if (COL[k]) { g.fillStyle = COL[k]; g.fill() }
      g.lineWidth = 1; g.strokeStyle = k === 'blocked' ? 'rgba(255,120,120,.35)' : 'rgba(255,255,255,.22)'; g.stroke();
    }
    if (reachMap && !busy) for (const e of reachMap.values()) { if (e.cost === 0) continue; poly(g, e.u, e.v); g.fillStyle = 'rgba(70,150,255,.34)'; g.fill(); g.strokeStyle = 'rgba(150,200,255,.8)'; g.lineWidth = 1.5; g.stroke() }
    const m = FB.monster(st), h = FB.hero(st);
    if (!busy && st.turn === 'hero' && !st.acted && FB.targets(st, h).length) { poly(g, m.u, m.v); g.strokeStyle = '#ff5a4a'; g.lineWidth = 3; g.stroke() }
    poly(g, h.u, h.v); g.strokeStyle = '#6fd18a'; g.lineWidth = 2; g.stroke();
    g.restore();
    const order = [h, m].filter(u => u.hp > 0 || true).sort((a, b) => project(a.vu, a.vv).y - project(b.vu, b.vv).y);
    for (const u of order) sprite(g, u, t);
    texts = texts.filter(x => t - x.t0 < 1200);
    for (const x of texts) { const p = project(x.u, x.v), a = (t - x.t0) / 1200; g.save(); g.globalAlpha = 1 - a; g.font = (x.small ? 'bold 14px' : 'bold 22px') + ' system-ui,sans-serif'; g.textAlign = 'center'; g.lineWidth = 4; g.strokeStyle = '#000b'; g.fillStyle = x.col; const y = p.y - 100 - a * 40; g.strokeText(x.txt, p.x, y); g.fillText(x.txt, p.x, y); g.restore() }
    if (st.outcome) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.restore() }
  }
  /* the page's own pointerup is replaced by TownUX, so the battle listens for a plain click itself (no drag = click) */
  if (ON) { let down = null; cv.addEventListener('pointerdown', e => { if (e.button === 0) down = { x: e.clientX, y: e.clientY } }, true);
    cv.addEventListener('pointerup', e => { if (e.button !== 0 || !down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5; down = null; if (!moved) click(world(e)) }, true) }
  if (ON) { const stop = () => { userCam = true }; addEventListener('pointerdown', stop, true); addEventListener('wheel', stop, true) }
  /* runs before the frame's camera transform: TownUX re-centres on the village hero every frame, so the arena has to win after it */
  function pre() { if (st && !userCam) focusCamera() }
  window.TownBattle = { pre, active: () => ON, click, draw, state: () => st, cells: () => cells, hero: () => st && FB.hero(st), monster: () => st && FB.monster(st), act: { move: heroMove, attack: doAttack, end: endHeroTurn } };
})();

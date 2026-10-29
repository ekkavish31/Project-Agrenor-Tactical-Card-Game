/* v92.12 · World map of Agrenor (world-map.html). Everything is drawn in code — no new images.
   Loop: pick a rumoured destination on the quest board → only the destination (a light beacon in the fog) and what you walk through are revealed →
   step out of the village hex by hex (time, food, HP) → encounters: battles (played in the flat card battle, embedded), chests, camps, shrines,
   merchants, traps, old maps → boss at the destination → reward, travel home along the known road.
   Fog levels per tile: hidden (black) · explored (dim, remembered) · visible (around the party; +1 sight on hills).
   Saved in localStorage 'agrenor-world-v1' (map only). v94: the clock, gold, potions, food, hero HP, fatigue and the party are the game's own
   (js/world-state.js) — S.gold, S.party, S.day … are live views of the one save. ?seed= starts a specific world, ?new=1 a fresh one. */
(function () {
  'use strict';
  const G = window.WorldGen, Q = new URLSearchParams(location.search), SAVE = 'agrenor-world-v1';
  const R = 36, HW = Math.sqrt(3) * R, VS = 1.5 * R;                              // hex radius, width, row step
  const WW = Math.ceil(HW * (G.COLS + .5)) + 8, WH = Math.ceil(VS * (G.ROWS - 1) + 2 * R) + 8;
  const cv = document.getElementById('wm'), g = cv.getContext('2d');
  const K = G.key, wait = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let W = 0, H = 0, dpr = 1, world = null, S = null, busy = false, modalOpen = false, hover = null;
  const cam = { x: WW / 2, y: WH / 2, z: 1, tx: null, ty: null, tz: null }, token = { x: 0, y: 0, bob: 0, walking: false, face: 1 };

  /* ---------- geometry ---------- */
  const center = (c, r) => ({ x: 4 + HW * (c + .5 * (r & 1)) + HW / 2, y: 4 + R + VS * r });
  function hexPath(ctx, x, y, rad = R) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 30); ctx.lineTo(x + rad * Math.cos(a), y + rad * Math.sin(a)) } ctx.closePath() }
  function pixelToHex(px, py) {
    const x = px - 4 - HW / 2, y = py - 4 - R, q = (Math.sqrt(3) / 3 * x - y / 3) / R, rr = (2 / 3 * y) / R;
    let cx = q, cz = rr, cy = -cx - cz, rx = Math.round(cx), ry = Math.round(cy), rz = Math.round(cz);
    const dx = Math.abs(rx - cx), dy = Math.abs(ry - cy), dz = Math.abs(rz - cz);
    if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry;
    const r = rz, c = rx + (r - (r & 1)) / 2; return G.inside(c, r) ? { c, r } : null;
  }
  const tile = (c, r) => world.tiles[K(c, r)];
  const toScreen = (x, y) => ({ x: (x - cam.x) * cam.z + W / 2, y: (y - cam.y) * cam.z + H / 2 });
  const toWorld = (x, y) => ({ x: (x - W / 2) / cam.z + cam.x, y: (y - H / 2) / cam.z + cam.y });

  /* ---------- save ---------- */
  /* the travelling party (recruited in the village, js/world-state.js): HP carries over between fights; a fallen companion gets up wounded after the fight */
  const WS = window.WorldState;
  /* tell the village (js/village-mind.js): what happened out here becomes news and gossip back home; the party saw it */
  function ev(type, data = {}) { try { window.Mind?.emit(type, { witness: S.party.map(p => p.key), ...data }) } catch (e) { } }
  /* time spent in the village passes out here too; scouting jobs done in the village open up the map */
  function adoptVillage() {
    while (S.revealQueue > 0) {
      S.revealQueue--; const d = destOf() || world.dests.find(x => !S.done[x.id]);
      if (d) { const p = G.path(world, world.home, d); if (p) p.forEach((x, i) => { if (i % 2 === 0 || i < 6) for (const [a, b] of G.within(x.c, x.r, 1)) S.known[K(a, b)] = 1 }); log('ผู้สำรวจจากหมู่บ้านวาดทางไป ' + d.name + ' มาให้') }
      else revealArea(world.home.c, world.home.r, 4);
      fogDirty = true; setTimeout(() => toast('🗺 ผู้สำรวจกลับมาพร้อมแผนที่ทาง'), 900);
    }
  }
  function syncClock() { }   // v94: one clock — nothing to copy
  function healParty(f) { for (const p of S.party) p.hp = Math.min(p.max, f >= 1 ? p.max : p.hp + Math.round(p.max * f)) }
  function fresh(seed) {
    world = G.generate(seed);
    S = WS.bind({ seed: world.seed, map: world.real || 'random', known: {}, pos: { ...world.home }, prev: null, trail: [K(world.home.c, world.home.r)], dest: null, cleared: {}, done: {}, steps: 0, log: [] });
    reveal(); save();
  }
  function load() {
    if (Q.get('new') === '1') { fresh(+Q.get('seed') || undefined); history.replaceState(null, '', location.pathname); return }
    try { const s = JSON.parse(localStorage.getItem(SAVE) || 'null'); if (s && s.seed != null && (s.map || 'random') !== (G.generate.real || 'random')) { /* v95.22: an old random-map save moves to Nor'Chorthal: same seed, finished destinations kept, back at Fernvale */ fresh(s.seed); S.done = s.done || {}; S.dest = S.done[s.dest] ? null : s.dest || null; S.log = ['— แผนที่ใหม่: ดินแดน Nor\'Chorthal —']; reveal(); save(); adoptVillage(); adoptLeads(); return }
      if (s && s.seed != null && (!Q.get('seed') || +Q.get('seed') === s.seed)) { world = G.generate(s.seed); S = WS.bind(s); S.done ??= {}; S.log ??= []; adoptVillage(); adoptLeads(); reveal(); return } } catch (e) { }
    fresh(+Q.get('seed') || undefined);
  }
  function save() { WS.writeWorld(S) }
  /* v95.16 · destinations come from leads the village gave (NPC quests, guild board, events) — see WorldState.addLead */
  function adoptLeads() {
    if (!S || !world) return; const L = WS.leads(); S.leads = S.leads || {};
    for (const [id, l] of Object.entries(L)) {
      if (!world.dests.some(d => d.id === id)) continue; S.leads[id] = { src: l.src || '' };
      if (l.pick && !S.dest && !S.done[id]) { S.dest = id; WS.clearPick(id); log('รับภารกิจ: ' + destOf().name + (l.src ? ' (จาก ' + l.src + ')' : '')); fogDirty = true; save(); try { hudSync() } catch (e) { } }
    }
  }
  function log(t) { S.log.unshift(t); S.log = S.log.slice(0, 30) }

  /* ---------- fog ---------- */
  let visible = new Set(), fogDirty = true;
  function sight() { const t = tile(S.pos.c, S.pos.r), night = S.hour >= 21 || S.hour < 4; return Math.max(1, 1 + (t.biome === 'hills' ? 1 : 0) + (t.poi?.id === 'home' ? 1 : 0) - (night ? 1 : 0)) }   // night: the hill bonus is lost
  function reveal() {
    visible = new Set(G.within(S.pos.c, S.pos.r, sight()).map(([c, r]) => K(c, r)));
    for (const k of visible) S.known[k] = 1;
    for (const [c, r] of G.within(world.home.c, world.home.r, 1)) S.known[K(c, r)] = 1;
    for (const id in S.done) { const d = world.dests.find(x => x.id === id); if (d) for (const [c, r] of G.within(d.c, d.r, 2)) S.known[K(c, r)] = 1 }
    fogDirty = true;
  }
  const isKnown = k => !!S.known[k] || visible.has(k);
  function revealArea(c, r, n) { for (const [a, b] of G.within(c, r, n)) S.known[K(a, b)] = 1; fogDirty = true }

  /* ---------- terrain painting (once per world) ---------- */
  const PAL = { grass: ['#7fa35a', '#8db365', '#6f9450'], forest: ['#4f7a3f', '#5a8646', '#456c37'], hills: ['#a09060', '#b0a06c', '#8f8054'], mountain: ['#8a8378', '#9b948a', '#77706a'],
    water: ['#3f6f96', '#4a7ba3', '#365f84'], swamp: ['#5b6b45', '#66764d', '#4d5c3b'], snow: ['#dfe7ee', '#eef3f7', '#cfd9e2'], sand: ['#d8c48f', '#e2cf9c', '#cbb680'], ash: ['#4a3a34', '#5a463e', '#3c2f2a'], volcano: ['#6a2a1a', '#8a3a1a', '#4a1e14'] };
  let terr = null;
  function paint() {
    /* v95.22: the real Nor'Chorthal map is big — paint it at half resolution (it is drawn scaled up) */
    const TS = world.real ? .5 : 1;
    terr = document.createElement('canvas'); terr.width = Math.ceil(WW * TS); terr.height = Math.ceil(WH * TS); const t = terr.getContext('2d'), rnd = G.rng(world.seed ^ 0xabc); t.scale(TS, TS);
    t.fillStyle = '#2a2f2a'; t.fillRect(0, 0, WW, WH);
    const all = Object.values(world.tiles);
    for (const h of all) { const p = center(h.c, h.r), pal = PAL[h.biome]; hexPath(t, p.x, p.y, R + .6); t.fillStyle = pal[0]; t.fill() }
    /* soft blending + speckles */
    for (const h of all) { const p = center(h.c, h.r), pal = PAL[h.biome]; t.save(); hexPath(t, p.x, p.y, R + .6); t.clip(); for (let i = 0; i < 26; i++) { t.fillStyle = pal[1 + (i & 1)]; t.globalAlpha = .45; t.beginPath(); t.arc(p.x + (rnd() - .5) * HW, p.y + (rnd() - .5) * 2 * R, 2 + rnd() * 5, 0, 7); t.fill() } t.restore() }
    /* coast foam on water next to land */
    for (const h of all) if (h.biome === 'water') { const p = center(h.c, h.r); t.save(); hexPath(t, p.x, p.y); t.clip(); t.strokeStyle = 'rgba(220,240,255,.35)'; t.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const y = p.y - R * .5 + i * R * .35, x = p.x - HW * .4 + rnd() * 8; t.beginPath(); t.moveTo(x, y); t.quadraticCurveTo(x + 8, y - 4, x + 16, y); t.quadraticCurveTo(x + 24, y + 4, x + 32, y); t.stroke() } t.restore() }
    /* river */
    t.lineCap = 'round'; t.lineJoin = 'round';
    /* v95.22: rivers as a tree (no triangles where a river is two hexes wide): join river hexes with a spanning tree, plus one mouth into open water */
    { const par = new Map(), find = k => { while (par.get(k) !== k) { par.set(k, par.get(par.get(k))); k = par.get(k) } return k }, edges = [];
      for (const h of all) if (h.river) par.set(K(h.c, h.r), K(h.c, h.r));
      for (const h of all) if (h.river) for (const [c, r] of G.neighbors(h.c, h.r)) { const n = tile(c, r); if (n.river && K(c, r) > K(h.c, h.r)) edges.push([h, n]) }
      const mouth = new Set();
      for (const h of all) if (h.river) { const w = G.neighbors(h.c, h.r).map(([c, r]) => tile(c, r)).find(n => n.biome === 'water'); if (w && !mouth.has(find(K(h.c, h.r)))) { mouth.add(find(K(h.c, h.r))); edges.push([h, w, 1]) } }
      for (const [a0, b0, m] of edges) { const ka = find(K(a0.c, a0.r)), kb = m ? null : find(K(b0.c, b0.r)); if (!m) { if (ka === kb) continue; par.set(ka, kb) }
        const a = center(a0.c, a0.r), b = center(b0.c, b0.r); t.strokeStyle = '#3d6f99'; t.lineWidth = 8; t.beginPath(); t.moveTo(a.x, a.y); t.quadraticCurveTo((a.x + b.x) / 2 + 6, (a.y + b.y) / 2 - 4, b.x, b.y); t.stroke(); t.strokeStyle = 'rgba(190,225,255,.5)'; t.lineWidth = 2.5; t.stroke() } }
    /* roads */
    for (const h of all) if (h.road) { const a = center(h.c, h.r); for (const [c, r] of G.neighbors(h.c, h.r)) { const n = tile(c, r); if (n.road && K(c, r) > K(h.c, h.r)) { const b = center(c, r); t.strokeStyle = '#6b5434'; t.lineWidth = 8; t.beginPath(); t.moveTo(a.x, a.y); t.lineTo(b.x, b.y); t.stroke(); t.strokeStyle = '#c8a873'; t.lineWidth = 5; t.stroke() } } }
    /* decorations, sorted top→bottom so they overlap correctly */
    for (const h of all.sort((a, b) => a.r - b.r || a.c - b.c)) {
      const p = center(h.c, h.r);
      if (h.biome === 'forest') for (let i = 0; i < 5; i++) tree(t, p.x + (rnd() - .5) * HW * .7, p.y + (rnd() - .4) * R * .9, 9 + rnd() * 5, rnd);
      else if (h.biome === 'snow' && rnd() < .35) tree(t, p.x + (rnd() - .5) * 20, p.y + (rnd() - .5) * 18, 9, rnd, true);
      else if (h.biome === 'hills') for (let i = 0; i < 2; i++) hill(t, p.x + (i ? 10 : -10) + (rnd() - .5) * 6, p.y + (i ? 6 : -4), 18 + rnd() * 6);
      else if (h.biome === 'mountain') mountain(t, p.x + (rnd() - .5) * 6, p.y + 10, 30 + rnd() * 10, world.real ? h.elev > .8 : (h.r < G.ROWS * .3 || h.elev > .8));
      else if (h.biome === 'volcano') { mountain(t, p.x, p.y + 10, 34, false); const gr = t.createRadialGradient(p.x, p.y - 20, 0, p.x, p.y - 20, 22); gr.addColorStop(0, 'rgba(255,140,40,.85)'); gr.addColorStop(1, 'rgba(255,60,20,0)'); t.fillStyle = gr; t.beginPath(); t.arc(p.x, p.y - 20, 22, 0, 7); t.fill() }
      else if (h.biome === 'ash' && rnd() < .6) { t.fillStyle = 'rgba(255,110,40,.35)'; for (let i = 0; i < 3; i++) { t.beginPath(); t.ellipse(p.x + (rnd() - .5) * 40, p.y + (rnd() - .5) * 30, 3 + rnd() * 4, 1.5, rnd() * 3, 0, 7); t.fill() } }
      else if (h.biome === 'swamp') for (let i = 0; i < 4; i++) reed(t, p.x + (rnd() - .5) * HW * .7, p.y + (rnd() - .5) * R, rnd);
      else if (h.biome === 'grass' && rnd() < .5) { t.strokeStyle = 'rgba(60,90,40,.5)'; t.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const x = p.x + (rnd() - .5) * 40, y = p.y + (rnd() - .5) * 30; t.beginPath(); t.moveTo(x - 3, y); t.lineTo(x - 1, y - 5); t.moveTo(x, y); t.lineTo(x + 1, y - 6); t.moveTo(x + 3, y); t.lineTo(x + 3, y - 4); t.stroke() } }
    }
    /* hex grid, faint */
    t.strokeStyle = 'rgba(30,25,15,.12)'; t.lineWidth = 1; for (const h of all) { const p = center(h.c, h.r); hexPath(t, p.x, p.y); t.stroke() }
    /* paper grain + vignette */
    const grain = t.createImageData(terr.width, terr.height); for (let i = 0; i < grain.data.length; i += 4) { const v = rnd() * 255; grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = v; grain.data[i + 3] = 14 }
    const gc = document.createElement('canvas'); gc.width = terr.width; gc.height = terr.height; gc.getContext('2d').putImageData(grain, 0, 0); t.globalCompositeOperation = 'overlay'; t.save(); t.setTransform(1, 0, 0, 1, 0, 0); t.drawImage(gc, 0, 0); t.restore(); t.globalCompositeOperation = 'source-over';
    /* village + destinations */
    const hp = center(world.home.c, world.home.r); village(t, hp.x, hp.y);
    for (const tw of world.towns || []) { const q = center(tw.c, tw.r); village(t, q.x, q.y) }   // v94: other settlements
  }
  function tree(t, x, y, s, rnd, snow) {
    t.fillStyle = 'rgba(0,0,0,.18)'; t.beginPath(); t.ellipse(x + 2, y + 2, s * .55, s * .22, 0, 0, 7); t.fill();
    t.fillStyle = '#5a3d22'; t.fillRect(x - 1.2, y - s * .3, 2.4, s * .35);
    for (let k = 0; k < 2; k++) { t.fillStyle = snow ? (k ? '#f4f8fb' : '#3f6b4a') : (k ? '#5f9a4a' : '#2f5a2c'); t.beginPath(); t.moveTo(x, y - s * (1.25 - k * .3)); t.lineTo(x + s * (.55 - k * .12), y - s * (.25 + k * .25)); t.lineTo(x - s * (.55 - k * .12), y - s * (.25 + k * .25)); t.closePath(); t.fill() }
  }
  function hill(t, x, y, w) { const gr = t.createLinearGradient(x - w / 2, y - w * .4, x + w / 2, y); gr.addColorStop(0, '#c9b47c'); gr.addColorStop(1, '#7d6c45'); t.fillStyle = gr; t.beginPath(); t.ellipse(x, y, w / 2, w * .32, 0, Math.PI, 0); t.fill(); t.strokeStyle = 'rgba(60,45,20,.35)'; t.lineWidth = 1; t.stroke() }
  function mountain(t, x, y, h, snow) {
    t.fillStyle = 'rgba(0,0,0,.2)'; t.beginPath(); t.ellipse(x + 4, y, h * .55, h * .16, 0, 0, 7); t.fill();
    t.fillStyle = '#9a9286'; t.beginPath(); t.moveTo(x, y - h); t.lineTo(x + h * .6, y); t.lineTo(x - h * .6, y); t.closePath(); t.fill();
    t.fillStyle = '#6e675e'; t.beginPath(); t.moveTo(x, y - h); t.lineTo(x + h * .6, y); t.lineTo(x + h * .05, y); t.closePath(); t.fill();
    if (snow) { t.fillStyle = '#f2f5f8'; t.beginPath(); t.moveTo(x, y - h); t.lineTo(x + h * .2, y - h * .66); t.lineTo(x + h * .05, y - h * .72); t.lineTo(x - h * .08, y - h * .62); t.lineTo(x - h * .2, y - h * .66); t.closePath(); t.fill() }
  }
  function reed(t, x, y, rnd) { t.strokeStyle = '#3d4a2a'; t.lineWidth = 1.3; for (let i = -1; i <= 1; i++) { t.beginPath(); t.moveTo(x + i * 3, y); t.lineTo(x + i * 4 + (rnd() - .5) * 2, y - 8 - rnd() * 4); t.stroke() } t.fillStyle = 'rgba(70,90,60,.5)'; t.beginPath(); t.ellipse(x, y + 1, 7, 2.5, 0, 0, 7); t.fill() }
  function house(t, x, y, s, roof) { t.fillStyle = 'rgba(0,0,0,.25)'; t.fillRect(x - s * .5 + 2, y - 1, s, 3); t.fillStyle = '#e9dcc0'; t.fillRect(x - s * .5, y - s * .55, s, s * .55); t.fillStyle = roof; t.beginPath(); t.moveTo(x - s * .65, y - s * .5); t.lineTo(x, y - s * 1.05); t.lineTo(x + s * .65, y - s * .5); t.closePath(); t.fill(); t.fillStyle = '#5a3d22'; t.fillRect(x - 2, y - s * .3, 4, s * .3) }
  function village(t, x, y) { t.fillStyle = 'rgba(120,90,50,.35)'; t.beginPath(); t.ellipse(x, y + 4, 30, 14, 0, 0, 7); t.fill(); house(t, x - 14, y - 2, 14, '#b4523a'); house(t, x + 12, y - 6, 13, '#a8462f'); house(t, x - 2, y + 10, 15, '#c0603f'); house(t, x + 20, y + 10, 11, '#9c4a33') }
  function poiIcon(ctx, d, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (d.icon === 'cave') { ctx.fillStyle = '#6d6458'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 16, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#16120e'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 10, 0, Math.PI, 0); ctx.fill() }
    else if (d.icon === 'mine') { ctx.fillStyle = '#7a6a50'; ctx.beginPath(); ctx.moveTo(-20, 2); ctx.lineTo(0, -22); ctx.lineTo(20, 2); ctx.fill(); ctx.fillStyle = '#1a140e'; ctx.fillRect(-7, -12, 14, 14); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3; ctx.strokeRect(-8, -13, 16, 15) }
    else if (d.icon === 'ruin') { ctx.fillStyle = '#b8b0a0'; for (const [px, h] of [[-14, 22], [-4, 30], [6, 16], [15, 26]]) ctx.fillRect(px - 3, -h, 6, h); ctx.fillRect(-18, -2, 36, 4); ctx.fillStyle = '#8f8778'; ctx.fillRect(-8, -32, 18, 4) }
    ctx.restore();
  }

  /* ---------- fog canvas (half resolution → soft edges when scaled up) ---------- */
  const FS = .5; let fog = null, wisp = null;
  function paintFog() {
    if (!fog) { fog = document.createElement('canvas'); fog.width = Math.ceil(WW * FS); fog.height = Math.ceil(WH * FS); wisp = document.createElement('canvas'); wisp.width = fog.width; wisp.height = fog.height }
    const f = fog.getContext('2d'); f.globalCompositeOperation = 'source-over'; f.fillStyle = '#05060a'; f.fillRect(0, 0, fog.width, fog.height);
    f.globalCompositeOperation = 'destination-out';
    for (const k in world.tiles) {
      const vis = visible.has(k), kn = S.known[k]; if (!vis && !kn) continue;
      const h = world.tiles[k], p = center(h.c, h.r), rad = R * 1.35 * FS, a = vis ? 1 : .62;
      const gr = f.createRadialGradient(p.x * FS, p.y * FS, rad * .35, p.x * FS, p.y * FS, rad); gr.addColorStop(0, `rgba(0,0,0,${a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
      f.fillStyle = gr; f.beginPath(); f.arc(p.x * FS, p.y * FS, rad, 0, 7); f.fill();
    }
    const d = destOf(); if (d) { const p = center(d.c, d.r), rad = R * 1.15 * FS, gr = f.createRadialGradient(p.x * FS, p.y * FS, 0, p.x * FS, p.y * FS, rad); gr.addColorStop(0, 'rgba(0,0,0,.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); f.fillStyle = gr; f.beginPath(); f.arc(p.x * FS, p.y * FS, rad, 0, 7); f.fill() }
    fogDirty = false;
  }
  function drawFog(now) {
    if (fogDirty) paintFog();
    const w = wisp.getContext('2d'); w.globalCompositeOperation = 'source-over'; w.clearRect(0, 0, wisp.width, wisp.height); w.drawImage(fog, 0, 0);
    w.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 9; i++) {
      const x = ((i * 397 + now * .006 * (1 + i % 3)) % (wisp.width + 300)) - 150, y = (i * 211 % wisp.height) + Math.sin(now * .0003 + i) * 30, r = 90 + (i % 4) * 40;
      const gr = w.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(70,72,95,.22)'); gr.addColorStop(1, 'rgba(70,72,95,0)'); w.fillStyle = gr; w.beginPath(); w.arc(x, y, r, 0, 7); w.fill();
    }
    g.imageSmoothingEnabled = true; g.drawImage(wisp, 0, 0, WW, WH);
  }

  /* ---------- party token (the new-outfit hero idle frames) ---------- */
  const heroImgs = [1, 2, 3, 4].map(i => { const im = new Image(); im.src = `assets/tactics/imported/idle-se-mvkft9t1-gv5z/frame-0${i}.webp`; return im });
  const walkImgs = [1, 2, 3].map(i => { const im = new Image(); im.src = `assets/tactics/imported/walk-se-mvkaodo9-foiz/frame-0${i}.webp`; return im });
  function drawToken(now) {
    const set = token.walking ? walkImgs : heroImgs, im = set[Math.floor(now / (token.walking ? 110 : 260)) % set.length], s = 76;
    const night = nightness(), lr = 70 + Math.sin(now * .004) * 4;
    const lg = g.createRadialGradient(token.x, token.y - 8, 4, token.x, token.y - 8, lr); lg.addColorStop(0, `rgba(255,210,130,${.18 + night * .25})`); lg.addColorStop(1, 'rgba(255,210,130,0)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = lg; g.beginPath(); g.arc(token.x, token.y - 8, lr, 0, 7); g.fill(); g.restore();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(token.x, token.y + 2, 14, 5, 0, 0, 7); g.fill();
    if (im.complete && im.naturalWidth) { g.save(); g.translate(token.x, token.y + 4 - Math.abs(Math.sin(token.bob)) * (token.walking ? 3 : 0)); if (token.face < 0) g.scale(-1, 1); g.drawImage(im, -s / 2, -s * .94, s, s); g.restore() }
  }

  /* ---------- beacon + encounter marks ---------- */
  const destOf = () => S.dest ? world.dests.find(d => d.id === S.dest) : null;
  function drawBeacon(now) {
    const d = destOf(); if (!d) return; const p = center(d.c, d.r), pulse = (Math.sin(now * .003) + 1) / 2;
    g.save(); g.globalCompositeOperation = 'lighter';
    const col = S.done[d.id] ? '140,255,170' : '255,200,110', gr = g.createLinearGradient(p.x, p.y - 260, p.x, p.y); gr.addColorStop(0, `rgba(${col},0)`); gr.addColorStop(1, `rgba(${col},${.35 + pulse * .15})`);
    g.fillStyle = gr; g.beginPath(); g.moveTo(p.x - 10, p.y - 260); g.lineTo(p.x + 10, p.y - 260); g.lineTo(p.x + 22, p.y); g.lineTo(p.x - 22, p.y); g.closePath(); g.fill();
    for (let k = 0; k < 2; k++) { const e = ((now * .0006 + k * .5) % 1); g.strokeStyle = `rgba(${col},${(1 - e) * .7})`; g.lineWidth = 2; g.beginPath(); g.ellipse(p.x, p.y + 4, 14 + e * 30, (14 + e * 30) * .45, 0, 0, 7); g.stroke() }
    g.restore();
    poiIcon(g, d, p.x, p.y + 6, 1);
    label(g, (S.done[d.id] ? '✔ ' : '') + d.name, p.x, p.y + 30, S.done[d.id] ? '#bfffd0' : '#ffe2a8');
  }
  function label(ctx, txt, x, y, col = '#f6e7c1', size = 13) { ctx.save(); ctx.font = `700 ${size}px VillageThai,system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(15,10,5,.85)'; ctx.strokeText(txt, x, y); ctx.fillStyle = col; ctx.fillText(txt, x, y); ctx.restore() }
  const ENC_ICON = { chest: '🎁', camp: '⛺', shrine: '✦', merchant: '💰', oldmap: '📜' };
  function drawMarks(now) {
    for (const k in world.tiles) {
      const h = world.tiles[k]; if (!isKnown(k)) continue;
      const p = center(h.c, h.r);
      if (h.poi && h.poi.id !== 'home' && S.done[h.poi.id] && h.poi.id !== S.dest) { poiIcon(g, h.poi, p.x, p.y + 6, .8); label(g, '✔ ' + h.poi.name, p.x, p.y + 28, '#bfffd0', 11) }
      if (!h.enc || S.cleared[k] || h.enc.type === 'trap') continue;
      if (h.enc.type === 'battle') continue;   // v95.16: no battle marks — an ambush can happen on any step
      const bob = Math.sin(now * .004 + h.c) * 2, x = p.x, y = p.y - 6 + bob;
      g.save(); g.fillStyle = 'rgba(25,30,40,.75)'; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill(); g.strokeStyle = '#e8d8a8'; g.lineWidth = 1.5; g.stroke();
      g.font = '13px system-ui,"Segoe UI Emoji","Apple Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(ENC_ICON[h.enc.type] || '?', x, y + 1); g.restore();
    }
    const hp = center(world.home.c, world.home.r); label(g, 'หมู่บ้านเฟิร์นเวล', hp.x, hp.y + 32, '#f6e7c1', 12);
    for (const tw of world.towns || []) if (isKnown(K(tw.c, tw.r))) { const q = center(tw.c, tw.r); label(g, tw.name, q.x, q.y + 32, '#d8f0ff', 12) }
  }
  function drawTrail() {
    if (S.trail.length < 2) return; g.save(); g.setLineDash([2, 7]); g.lineCap = 'round'; g.strokeStyle = 'rgba(255,226,150,.9)'; g.lineWidth = 3;
    g.beginPath(); S.trail.forEach((k, i) => { const [c, r] = k.split(',').map(Number), p = center(c, r); i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y) }); g.stroke(); g.restore();
  }
  function drawHover() {
    if (!hover || modalOpen) return; const h = tile(hover.c, hover.r), k = K(hover.c, hover.r), p = center(hover.c, hover.r), adj = G.dist(S.pos, hover) === 1;
    const ok = (adj || isKnown(k)) && G.stepCost(h) < Infinity;
    g.save(); hexPath(g, p.x, p.y, R - 2); g.strokeStyle = ok ? 'rgba(255,240,190,.9)' : 'rgba(255,110,90,.8)'; g.lineWidth = 2.5; g.stroke(); g.restore();
  }
  /* time of day tint (screen space) */
  function nightness() { const h = S.hour; return h >= 21 || h < 4 ? 1 : h >= 18 ? (h - 18) / 3 : h < 7 ? (7 - h) / 3 : 0 }
  function drawSky() {
    const n = nightness(), h = S.hour, dusk = (h >= 16 && h < 20) ? 1 - Math.abs(h - 18) / 2 : (h >= 5 && h < 8) ? 1 - Math.abs(h - 6.5) / 1.5 : 0;
    g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (n > 0) { g.fillStyle = `rgba(12,22,60,${n * .45})`; g.fillRect(0, 0, W, H) }
    if (dusk > 0) { g.fillStyle = `rgba(255,140,60,${dusk * .12})`; g.fillRect(0, 0, W, H) }
    const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    g.restore();
  }
  /* arrow on the screen edge pointing at the destination when it is off screen */
  function drawCompass() {
    const d = destOf(); if (!d || S.done[d.id]) return; const p = center(d.c, d.r), s = toScreen(p.x, p.y), m = 46;
    if (s.x > m && s.x < W - m && s.y > m && s.y < H - m) return;
    const cx = W / 2, cy = H / 2, ang = Math.atan2(s.y - cy, s.x - cx), k = Math.min((W / 2 - m) / Math.abs(Math.cos(ang) || 1e-6), (H / 2 - m) / Math.abs(Math.sin(ang) || 1e-6)), x = cx + Math.cos(ang) * k, y = cy + Math.sin(ang) * k;
    g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.translate(x, y); g.rotate(ang); g.fillStyle = 'rgba(255,205,120,.95)'; g.beginPath(); g.moveTo(16, 0); g.lineTo(-8, -10); g.lineTo(-3, 0); g.lineTo(-8, 10); g.closePath(); g.fill(); g.restore();
    g.save(); g.setTransform(dpr, 0, 0, dpr, 0, 0); label(g, d.name + ' · ' + G.dist(S.pos, d) + ' ช่อง', x - Math.cos(ang) * 40, y - Math.sin(ang) * 26, '#ffe2a8', 12); g.restore();
  }

  /* ---------- frame ---------- */
  let last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.1, (now - last) / 1000 || .016); last = now;
    if (cam.tx != null) { const k = 1 - Math.exp(-dt * 4); cam.x += (cam.tx - cam.x) * k; cam.y += (cam.ty - cam.y) * k; if (cam.tz) cam.z += (cam.tz - cam.z) * k }
    token.bob += dt * 12;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#07080c'; g.fillRect(0, 0, cv.width, cv.height);
    g.setTransform(dpr * cam.z, 0, 0, dpr * cam.z, dpr * (W / 2 - cam.x * cam.z), dpr * (H / 2 - cam.y * cam.z));
    if (terr) g.drawImage(terr, 0, 0, WW, WH);
    drawTrail(); drawMarks(now); drawHover(); drawToken(now);
    drawFog(now); drawBeacon(now);
    drawSky(); drawCompass();
  }
  function resize() { dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cam.z = Math.max(world?.real ? .18 : .55, Math.min(1.4, cam.z)) }
  addEventListener('resize', resize);
  function follow(z) { const p = center(S.pos.c, S.pos.r); cam.tx = p.x; cam.ty = p.y; if (z) cam.tz = z }

  /* ---------- input ---------- */
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y, moved: false }; cv.setPointerCapture(e.pointerId) });
  cv.addEventListener('pointermove', e => {
    const w = toWorld(e.clientX, e.clientY); hover = pixelToHex(w.x, w.y); tip(e, hover);
    if (!drag) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.hypot(dx, dy) > 5) drag.moved = true;
    if (drag.moved) { cv.classList.add('drag'); cam.tx = null; cam.tz = null; cam.x = drag.cx - dx / cam.z; cam.y = drag.cy - dy / cam.z }
  });
  cv.addEventListener('pointerup', e => { const d = drag; drag = null; cv.classList.remove('drag'); if (d && !d.moved) { const w = toWorld(e.clientX, e.clientY), h = pixelToHex(w.x, w.y); if (h) clickHex(h) } });
  cv.addEventListener('wheel', e => { e.preventDefault(); cam.tz = null; cam.z = Math.max(world.real ? .18 : .55, Math.min(2, cam.z * (e.deltaY < 0 ? 1.12 : .89))) }, { passive: false });
  addEventListener('keydown', e => { if (e.key === 'Escape') closeModal() });

  /* ---------- UI (HUD, tooltip, modal, toast) ---------- */
  const css = document.createElement('style'); css.textContent = `
  #wmHud{position:fixed;left:14px;top:14px;z-index:5;width:270px;background:linear-gradient(#2a2116f2,#1b150ef2);border:1px solid #c9a86a88;border-radius:12px;padding:10px 12px;box-shadow:0 8px 30px #000a}
  #wmHud h1{margin:0 0 2px;font-size:16px;color:#ffe2a8;letter-spacing:.5px}#wmHud .sub{color:#bba57f;font-size:12px;margin-bottom:8px}
  #wmHud .row{display:flex;justify-content:space-between;margin:3px 0}#wmHud .bar{height:7px;background:#0007;border-radius:4px;overflow:hidden;margin:2px 0 6px}#wmHud .bar i{display:block;height:100%;transition:width .4s}
  #wmHud .btns{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}#wmHud button,.wm-modal button{background:#c9893a;color:#fff;border:0;border-radius:8px;padding:6px 10px}#wmHud button:disabled,.wm-modal button:disabled{opacity:.4;cursor:default}
  #wmHud button.ghost,.wm-modal button.ghost{background:#4a3e2e}
  #wmLog{margin-top:8px;max-height:110px;overflow:auto;font-size:12px;color:#d8caa0;border-top:1px solid #ffffff1a;padding-top:6px}#wmLog div{margin:2px 0}
  #wmTip{position:fixed;z-index:6;pointer-events:none;background:#14100bee;border:1px solid #c9a86a66;border-radius:8px;padding:5px 9px;font-size:12px;color:#f3e9c9;white-space:nowrap;display:none}
  .wm-modal-bg{position:fixed;inset:0;z-index:20;background:radial-gradient(#0008,#000c);display:flex;align-items:center;justify-content:center;animation:wmFade .25s}
  .wm-modal{max-width:min(860px,94vw);max-height:90vh;overflow:auto;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;border-radius:14px;padding:18px 20px;box-shadow:0 20px 60px #000c,inset 0 0 0 2px #8a6a3a,inset 0 0 0 6px #f3e6c6,inset 0 0 0 7px #8a6a3a66}
  .wm-modal h2{margin:0 0 6px;font-size:22px;color:#5a2e10}.wm-modal p{margin:6px 0;line-height:1.55}.wm-modal .acts{display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap}
  .wm-quests{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-top:10px}
  .wm-q{background:#fff7e3;border:1px solid #b89a62;border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:6px;box-shadow:0 3px 10px #0002}
  .wm-q h3{margin:0;font-size:17px;color:#6a3010}.wm-q .meta{font-size:12px;color:#7a5a30}.wm-q .stars{color:#c0392b;letter-spacing:2px}.wm-q.done{opacity:.55}
  .wm-q canvas{width:100%;height:70px;background:#2b2418;border-radius:6px}
  .wm-toast{position:fixed;left:50%;top:16%;transform:translateX(-50%);z-index:30;padding:9px 20px;border-radius:999px;background:#14100bee;color:#ffe2a8;font:700 16px VillageThai,system-ui;box-shadow:0 6px 20px #000a;animation:wmToast 1.8s forwards;pointer-events:none}
  @keyframes wmToast{0%{opacity:0;transform:translate(-50%,10px)}15%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}
  @keyframes wmFade{from{opacity:0}}
  .wm-enc{position:fixed;inset:0;z-index:40;pointer-events:none;overflow:hidden}
  .wm-enc i{position:absolute;left:-10%;width:120%;height:12.5%;background:#07080c;transform:translateX(-110%) skewX(-20deg);animation:wmShard .5s cubic-bezier(.7,0,.3,1) forwards}
  .wm-enc b{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(2.2);font:italic 900 64px system-ui,sans-serif;color:#fff3b0;letter-spacing:3px;text-shadow:0 0 22px #ff6a2a,0 6px 0 #7a2400;opacity:0;animation:wmEncT .9s .25s forwards}
  @keyframes wmShard{to{transform:translateX(0) skewX(-20deg)}}@keyframes wmEncT{20%{opacity:1;transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(.9)}}
  #wmBattle{position:fixed;inset:0;z-index:35;border:0;width:100%;height:100%;background:#000;opacity:0;transition:opacity .35s}#wmBattle.on{opacity:1}
  .wm-shake{animation:wmShake .4s}@keyframes wmShake{20%{transform:translate(6px,-3px)}40%{transform:translate(-5px,4px)}60%{transform:translate(4px,2px)}80%{transform:translate(-3px,-2px)}}
  @media (max-width:700px){#wmHud{width:210px;font-size:12px;padding:8px}#wmLog{display:none}.wm-enc b{font-size:40px}}`;
  document.head.append(css);
  const hud = document.createElement('div'); hud.id = 'wmHud'; document.body.append(hud);
  const tipEl = document.createElement('div'); tipEl.id = 'wmTip'; document.body.append(tipEl);
  function hudSync() {
    const d = destOf(), t = tile(S.pos.c, S.pos.r), dang = G.danger(world, t), stars = '★'.repeat(1 + Math.round(dang * 3)) + '☆'.repeat(3 - Math.round(dang * 3));
    const hh = Math.floor(S.hour), mm = S.hour % 1 ? '30' : '00', icon = nightness() > .5 ? '🌙' : '☀';
    hud.innerHTML = `<h1>🗺 Agrenor</h1><div class="sub">วันที่ ${S.day} · ${icon} ${String(hh).padStart(2, '0')}:${mm} · ${esc(G.BIOME[t.biome].name)}${t.poi ? ' · ' + esc(t.poi.name) : ''}</div>
      <div class="row"><span>HP</span><span>${S.hp}/${S.maxHp}</span></div><div class="bar"><i style="width:${S.hp / S.maxHp * 100}%;background:#6fd18a"></i></div>
      <div class="row" style="flex-wrap:wrap;gap:4px">${S.party.map(p => `<span title="${esc(p.name)}" style="font-size:11px;background:#0004;border-radius:5px;padding:1px 5px;${p.hp < p.max * .3 ? 'color:#ff9a7a' : ''}">${esc(p.name)} ${p.hp}/${p.max}</span>`).join('')}</div>
      <div class="row"><span>ความเหนื่อย</span><span style="color:${S.fatigue >= 80 ? '#ff8a6a' : '#e8d8a8'}">${S.fatigue}%${S.fatigue >= 80 ? ' ⚠' : ''}</span></div><div class="bar"><i style="width:${S.fatigue}%;background:${S.fatigue >= 80 ? '#e2705f' : '#c9a24a'}"></i></div>
      <div class="row"><span>🍞 เสบียง ${S.food}</span><span>💰 ${S.gold}</span><span>🧪 ${S.potions}</span></div>
      <div class="row"><span>ความลึกของหมอก</span><span style="color:#ff9a7a">${stars}</span></div>
      <div class="row"><span>จุดหมาย</span><span style="color:#ffe2a8">${d ? esc(d.name) + (S.done[d.id] ? ' ✔' : ' · ' + G.dist(S.pos, d) + ' ช่อง') : '—'}</span></div>
      <div class="btns">${atHome() ? `<button id="wmQuest">📜 เรื่องที่ได้ยินมา</button><button id="wmVillage" class="ghost">🏠 เข้าหมู่บ้าน</button>` : `<button id="wmCamp">⛺ พักแรม</button><button id="wmHome" class="ghost">🏠 กลับหมู่บ้าน</button>`}<button id="wmPotion" class="ghost" ${S.potions && S.hp < S.maxHp ? '' : 'disabled'}>🧪 ดื่มยา</button>${eventCards().length ? `<button id="wmCards" class="ghost">🎴 การ์ดเหตุการณ์ (${eventCards().reduce((a, x) => a + x.n, 0)})</button>` : ''}</div>
      <div id="wmLog">${S.log.slice(0, 8).map(x => '<div>' + esc(x) + '</div>').join('')}</div>
      <div style="margin-top:6px;font-size:11px;color:#9a8a6a">คลิกช่องติดกัน = เดิน 1 ช่อง · คลิกช่องที่เคยเห็น = เดินไปเอง · ลากเพื่อเลื่อน · ล้อเมาส์ซูม <a href="?new=1" style="color:#c9a86a">โลกใหม่</a></div>`;
    const on = (id, fn) => { const b = hud.querySelector('#' + id); if (b) b.onclick = fn };
    on('wmCards', useEventCard); on('wmQuest', questBoard); on('wmVillage', () => { save(); syncClock(); location.href = 'village-town.html' }); on('wmCamp', () => camp(false)); on('wmHome', goHome);
    on('wmPotion', () => { if (!S.potions) return; S.potions--; const b = S.hp; S.hp = Math.min(S.maxHp, S.hp + 25); log('ดื่มยาฟื้นฟู +' + (S.hp - b) + ' HP'); save(); hudSync() });
    hud.querySelectorAll('button').forEach(b => b.disabled = b.disabled || busy);
  }
  const atHome = () => S.pos.c === world.home.c && S.pos.r === world.home.r;
  function tip(e, h) {
    if (!h || modalOpen || drag?.moved) { tipEl.style.display = 'none'; return }
    const k = K(h.c, h.r), t = tile(h.c, h.r), known = isKnown(k), adj = G.dist(S.pos, h) === 1;
    let txt = known || adj ? G.BIOME[t.biome].name + (t.road ? ' · ถนน' : '') + (t.river ? ' · แม่น้ำ' : '') : 'หมอกดำ — ไม่รู้ว่ามีอะไร';
    const sc = G.stepCost(t); if ((known || adj) && sc < Infinity) txt += ' · ' + sc + ' ชม.'; else if (known && sc === Infinity) txt += ' · ผ่านไม่ได้';
    if (known && t.enc && !S.cleared[k] && t.enc.type !== 'trap' && t.enc.type !== 'battle' && !(t.enc.hidden && !visible.has(k))) txt += ' · ' + ({ battle: '⚔ ศัตรู', chest: '🎁 หีบ', camp: '⛺ จุดพัก', shrine: '✦ ศาลเจ้า', merchant: '💰 พ่อค้า', oldmap: '📜 แผนที่เก่า' }[t.enc.type] || '');
    const d = destOf(); if (d && d.c === h.c && d.r === h.r) txt = '★ ' + d.name + ' — ' + txt;
    tipEl.textContent = txt; tipEl.style.display = 'block'; tipEl.style.left = (e.clientX + 14) + 'px'; tipEl.style.top = (e.clientY + 14) + 'px';
  }
  function toast(t) { const d = document.createElement('div'); d.className = 'wm-toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 1900) }
  let modalEl = null, modalResolve = null;
  function modal(html, buttons = [{ label: 'ตกลง', value: true }]) {
    closeModal(); modalOpen = true; tipEl.style.display = 'none';
    const bg = document.createElement('div'); bg.className = 'wm-modal-bg';
    bg.innerHTML = `<div class="wm-modal">${html}<div class="acts">${buttons.map((b, i) => `<button data-i="${i}" class="${b.ghost ? 'ghost' : ''}" ${b.disabled ? 'disabled' : ''}>${esc(b.label)}</button>`).join('')}</div></div>`;
    document.body.append(bg); modalEl = bg;
    return new Promise(res => { modalResolve = res; const done = v => { modalResolve = null; closeModal(); res(v) }; bg.querySelectorAll('.acts button').forEach(b => b.onclick = () => done(buttons[+b.dataset.i].value)); bg.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => done(b.dataset.pick)) });
  }
  function closeModal() { if (modalEl) { modalEl.remove(); modalEl = null; modalOpen = false; const r = modalResolve; modalResolve = null; r?.(null) } }

  /* ---------- v94.02 · drops: goods for the market (bag) and materials for the forge, by monster and land ---------- */
  const DROPS = { bat: ['batWing'], gull: ['driftwood'], wolf: ['wolfFang'], shadowWolf: ['wolfFang', 'boneCharm'], bandit: ['oldCoin', 'herb'], slime: ['swampHerb', 'crystalShard'], kobold: ['crystalShard'], golem: ['crystalShard', 'crystalShard'] };
  const LAND = { forest: ['herb', 'wood'], grass: ['herb'], hills: ['iron', 'coal'], swamp: ['swampHerb'], snow: ['frostFur'], sand: ['pearl', 'driftwood'] };
  const MATS = ['iron', 'coal', 'wood', 'food'];
  function dropLoot(foe, biome, dang, boss) {
    const g = WS.game(), v = g.village, bag = v.bag ||= {}, got = {}, add = k => { got[k] = (got[k] || 0) + 1; if (MATS.includes(k)) v.materials[k] = (v.materials[k] || 0) + 1; else bag[k] = (bag[k] || 0) + 1 };
    const pool = [...(DROPS[foe] || []), ...(LAND[biome] || [])], n = (boss ? 3 : 1) + (Math.random() < .35 + dang * .3 ? 1 : 0);
    for (let i = 0; i < n && pool.length; i++) add(pool[Math.floor(Math.random() * pool.length)]);
    if (boss) add('relic'); WS.commit();
    const G = window.ADVENTURE_DATA?.GOODS || {}, MN = { iron: 'เหล็ก', coal: 'ถ่าน', wood: 'ไม้', food: 'เสบียง' };
    return Object.entries(got).map(([k, c]) => (G[k]?.name || MN[k] || k) + ' ×' + c).join(' · ');
  }

  /* ---------- v94 · settlements: inn, shop, rumours and the travellers who are away from Fernvale today ---------- */
  const TOWN_TEXT = {
    brookmere: 'หมู่บ้านเกษตรเล็ก ๆ ริมลำธาร ทุ่งดอกไม้ล้อมรอบ ผู้คนรู้จักเฟิร์นเวลดี',
    haven: 'เมืองท่าเสียงดัง กลิ่นปลาเค็มและเกลือทะเล เรือสินค้าจอดเรียงเต็มท่า',
    northgate: 'ด่านหินบนช่องเขา ทหารเฝ้าทางขึ้นเหนือ นักเดินทางแวะพักก่อนข้ามเขา'
  };
  function townsfolk(id) {
    const L = window.VillageLife; if (!L) return [];
    const day = S.day, hour = S.hour, finnTown = ['brookmere', 'haven', 'northgate'][day % 3];
    return Object.values(L.P).filter(p => (p.from === id || (p.from === 'wander' && finnTown === id)) && !L.inParty(S, p.id) && !L.present(p, day, hour));
  }
  async function townVisit(poi) {
    const id = poi.town; ev('town:visit', { town: id, townName: poi.name }); log('ถึง ' + poi.name);
    for (;;) {
      const folk = townsfolk(id), per = window.WorldState?.period(S.hour) || 'day';
      const people = folk.length ? folk.map(p => { const ls = p.lines?.[per] || p.lines?.day || p.lines?.evening || ['…']; return `<p>👤 <b>${esc(p.name)}</b> <small>${esc(p.role)}</small><br>“${esc(String(ls[Math.floor(Math.random() * ls.length)]).replace(/\{name\}/g, window.WorldState?.heroName() || ''))}”</p>` }).join('') : '<p style="opacity:.7">ไม่เจอคนรู้จักที่นี่ตอนนี้</p>';
      const v = await modal(`<h2>🏘 ${esc(poi.name)}</h2><p>${esc(TOWN_TEXT[id] || '')}</p><h3 style="margin:8px 0 2px;font-size:14px">คนรู้จักจากเฟิร์นเวล</h3>${people}<p style="font-size:12px;opacity:.75">💰 ${S.gold} · 🍞 ${S.food} · 🧪 ${S.potions} · HP ${S.hp}/${S.maxHp}</p>`,
        [{ label: '🛏 พักโรงเตี๊ยม · 12 💰', value: 'inn', disabled: S.gold < 12 }, { label: 'เสบียง 4 ห่อ · 10 💰', value: 'food', disabled: S.gold < 10 }, { label: 'ยาฟื้นฟู · 18 💰', value: 'pot', disabled: S.gold < 18 }, { label: '📜 ฟังข่าวลือ', value: 'rumor' }, { label: 'ออกเดินทางต่อ', value: null, ghost: true }]);
      if (v === 'inn') { S.gold -= 12; const to = S.hour < 8 ? 8 - S.hour : 32 - S.hour; passTime(to); S.hp = S.maxHp; S.fatigue = 0; healParty(1); log('พักที่ ' + poi.name + ' ตื่นเช้าวันใหม่'); toast('🛏 พักเต็มอิ่ม · HP เต็ม') }
      else if (v === 'food') { S.gold -= 10; S.food += 4; log('ซื้อเสบียง 4 ที่ ' + poi.name) }
      else if (v === 'pot') { S.gold -= 18; S.potions++; log('ซื้อยาฟื้นฟูที่ ' + poi.name) }
      else if (v === 'rumor') { const d = destOf() || world.dests.find(x => !S.done[x.id]); if (d) { const p = G.path(world, tile(S.pos.c, S.pos.r), d); if (p) p.slice(0, 6).forEach(x => { for (const [a, b] of G.within(x.c, x.r, 1)) S.known[K(a, b)] = 1 }); fogDirty = true; reveal(); await modal(`<h2>📜 ข่าวลือ</h2><p>คนในโรงเตี๊ยมเล่าถึง <b>${esc(d.name)}</b> และวาดทางช่วงแรกให้</p>`) } else await modal('<h2>📜 ข่าวลือ</h2><p>ช่วงนี้ไม่มีข่าวใหม่</p>') }
      else break;
      save(); hudSync();
    }
    save(); hudSync();
  }

  /* ---------- quest board ---------- */
  async function questBoard() {
    if (busy) return; adoptLeads();
    const heard = world.dests.filter(d => S.leads?.[d.id]);
    if (!heard.length) { await modal(`<h2>📜 เรื่องที่ได้ยินมา</h2><p>ยังไม่เคยได้ยินข่าวจุดหมายที่ไหนเลย — ลองไปคุยกับชาวบ้านที่หมู่บ้าน รับเควสจากคนที่ต้องการความช่วยเหลือ ดูกระดานสมาคมเมื่อเปิด หรือเดินสำรวจเองทีละช่องก็ได้</p>`); return }
    const cards = heard.map(d => {
      const p = G.path(world, world.home, d), hours = p.slice(1).reduce((a, x) => a + G.stepCost(tile(x.c, x.r)), 0), dg = Math.min(3, 1 + Math.round(G.dist(world.home, d) / 6));
      return `<div class="wm-q ${S.done[d.id] ? 'done' : ''}"><h3>${esc(d.name)}</h3><div class="meta">${esc(G.BIOME[d.biome].name)} · ห่าง ~${G.dist(world.home, d)} ช่อง · เดินราว ${Math.ceil(hours / 12)} วัน</div>
        <div class="stars">${'★'.repeat(dg)}${'☆'.repeat(3 - dg)}</div><p style="font-size:13px">“${esc(d.rumor)}”</p><div class="meta">รู้จาก: ${esc(S.leads?.[d.id]?.src || 'ข่าวลือ')} · รางวัล ${d.reward} 💰 · บอส: ${esc(BOSS_NAME[d.boss] || d.boss)}</div>
        <button data-pick="${d.id}" ${S.done[d.id] ? 'disabled' : ''}>${S.done[d.id] ? '✔ สำเร็จแล้ว' : S.dest === d.id ? 'กำลังเดินทาง' : 'รับภารกิจนี้'}</button></div>`;
    }).join('');
    const v = await modal(`<h2>📜 กระดานภารกิจ · ข่าวลือ</h2><p>หมอกดำคลุมทุกทิศ รู้เพียงข่าวลือว่ามีอะไรอยู่ที่ไหน เลือกจุดหมาย แล้วออกจากหมู่บ้านไปเปิดทางเอง — แผนที่จะเผยเฉพาะปลายทางและเส้นทางที่คุณเดินผ่าน</p><div class="wm-quests">${cards}</div>`, [{ label: 'ปิด', value: null, ghost: true }]);
    if (v && world.dests.some(d => d.id === v)) chooseDest(v);
  }
  const BOSS_NAME = { wolf: 'จ่าฝูงหมาป่า', golem: 'โกเล็มหิน', slime: 'สไลม์ยักษ์', bandit: 'หัวหน้าโจร', kobold: 'หัวหน้าโคโบลด์' };
  /* warm the browser cache with one hidden battle page so the first real fight opens quickly */
  function warm() { if (document.getElementById('wmWarm')) return; const f = document.createElement('iframe'); f.id = 'wmWarm'; f.style.cssText = 'position:fixed;width:2px;height:2px;left:-10px;top:-10px;opacity:0;pointer-events:none;border:0'; f.src = 'battle-field.html?battle=1&embed=1&warm=1'; document.body.append(f); const on = e => { if (e.data?.type === 'agrenor-battle-ready' && e.data.warm) { removeEventListener('message', on); setTimeout(() => f.remove(), 500) } }; addEventListener('message', on); setTimeout(() => f.remove(), 60000) }
  async function chooseDest(id) {
    setTimeout(warm, 2500);
    S.dest = id; const d = destOf(); log('รับภารกิจ: ' + d.name); S.leftDay = S.day; ev('journey:start', { dest: d.id, destName: d.name }); save(); fogDirty = true; hudSync();
    busy = true; const p = center(d.c, d.r); cam.tx = p.x; cam.ty = p.y; cam.tz = 1.1; toast('จุดหมาย: ' + d.name); await wait(1700); follow(1); await wait(900); busy = false; hudSync();
  }

  /* ---------- travel ---------- */
  function clickHex(h) {
    if (busy || modalOpen) return;
    const t = tile(h.c, h.r), k = K(h.c, h.r);
    if (h.c === S.pos.c && h.r === S.pos.r) return;
    if (G.stepCost(t) === Infinity) { toast(isKnown(k) ? G.BIOME[t.biome].name + ' — ผ่านไม่ได้' : 'ผ่านไม่ได้'); return }
    if (G.dist(S.pos, h) === 1) { walk([S.pos, h]); return }
    if (!isKnown(k)) { toast('ยังไม่รู้ทาง — เดินทีละช่องเข้าไปในหมอก'); return }
    const p = G.path(world, S.pos, h, x => x && isKnown(K(x.c, x.r))); if (!p) { toast('ยังไม่มีทางที่รู้จักไปถึง'); return }
    walk(p);
  }
  async function walk(p) {
    busy = true; hudSync();
    for (let i = 1; i < p.length; i++) {
      const stop = await step(p[i]); if (stop) break;
      if (S.hp <= 0) break;
    }
    busy = false; hudSync(); save();
  }
  /* one hex: move the token, spend time and food, reveal, then resolve what is there. Returns true to stop an auto-walk. */
  async function step(to) {
    const t = tile(to.c, to.r), cost = G.stepCost(t), from = center(S.pos.c, S.pos.r), dst = center(to.c, to.r);
    token.walking = true; token.face = dst.x >= from.x ? 1 : -1;
    const dur = 260 + cost * 90, t0 = performance.now();
    await new Promise(res => { const tick = () => { const e = Math.min(1, (performance.now() - t0) / dur); token.x = from.x + (dst.x - from.x) * e; token.y = from.y + (dst.y - from.y) * e; cam.tx = token.x; cam.ty = token.y; if (e < 1) requestAnimationFrame(tick); else res() }; tick() });
    token.walking = false;
    S.prev = { ...S.pos }; S.pos = { c: to.c, r: to.r }; S.steps++; const k = K(to.c, to.r); if (S.trail.at(-1) !== k) S.trail.push(k); if (S.trail.length > 200) S.trail.shift();
    const wasNight = nightness() > .6;
    passTime(cost + (wasNight ? 1 : 0));                                              // walking in the dark is slower
    S.fatigue = Math.min(100, S.fatigue + Math.round(cost * 3 * (wasNight ? 1.5 : 1)));
    if (!t.road && !t.poi) { if (S.food > 0) S.food--; else { S.hp = Math.max(1, S.hp - 5); log('เสบียงหมด! หิวโหย −5 HP'); toast('เสบียงหมด −5 HP') } }
    if (S.fatigue >= 80) { S.hp = Math.max(1, S.hp - 2); if (S.fatigue >= 100 || Math.random() < .3) toast('เหนื่อยล้า! ควรพักแรม (−2 HP ต่อช่อง)') }
    reveal(); hudSync(); save();
    const d = destOf();
    if (d && !S.done[d.id] && d.c === to.c && d.r === to.r) { await bossFight(d); return true }
    if (t.poi?.id === 'home') { await arriveHome(); return true }
    if (t.poi?.town) { await townVisit(t.poi); return true }
    if (t.enc && !S.cleared[k]) return await encounter(t, k);
    const night = nightness() > .6, dang = G.danger(world, t);
    /* v95.16 · no battle marks on the map: every step has a chance of an ambush (more in wild/dangerous land and at night, less on a road) */
    S.calm = Math.max(0, (S.calm || 0) - 1);
    const odds = Math.min(.42, (.05 + dang * .24) * (t.road ? .45 : 1) * (night ? 1.6 : 1));
    if (!S.calm && !t.poi && Math.random() < odds) { S.calm = 3; log(night ? 'ถูกซุ่มโจมตีกลางดึก!' : 'ถูกซุ่มโจมตี!'); return await battle(pickFoe(t), dang, { ambush: true }) }
    if (night && Math.random() < .07) return await nightEvent(t);
    return false;
  }
  /* things that only happen after dark */
  async function nightEvent(t) {
    const d = destOf(), r = Math.random();
    if (r < .4 && d && !S.done[d.id]) { const p = G.path(world, t, d); if (p) p.slice(0, 5).forEach(x => S.known[K(x.c, x.r)] = 1); fogDirty = true; log('ดวงไฟวิญญาณนำทาง'); ev('night:wisp', { biome: t.biome }); await modal(`<h2>✧ ดวงไฟวิญญาณ</h2><p>แสงสีฟ้าลอยวนอยู่กลางความมืด แล้วค่อย ๆ ล่องไปทางหนึ่ง… หมอกตามทางนั้นจางลงชั่วครู่</p>`); return true }
    if (r < .75) { S.fatigue = Math.min(100, S.fatigue + 15); log('เสียงหอนทั้งคืน เหนื่อยขึ้น'); await modal(`<h2>🐺 เสียงหอนในความมืด</h2><p>เสียงหอนรอบทิศทำให้ต้องเดินระวังตัวทุกฝีก้าว ความเหนื่อย +15</p>`); return true }
    const gold = Math.round(20 + Math.random() * 30); S.gold += gold; log('พบของมีค่าใต้แสงจันทร์ +' + gold); await modal(`<h2>🌙 ประกายใต้แสงจันทร์</h2><p>มีบางอย่างสะท้อนแสงจันทร์อยู่ในพงหญ้า — ถุงเหรียญของนักเดินทาง <b>+${gold} 💰</b></p>`); return true;
  }
  function passTime(h) { S.hour += h; while (S.hour >= 24) { S.hour -= 24; S.day++; log('— วันที่ ' + S.day + ' —') } }
  const pickFoe = t => { const a = G.FOES[t.biome] || G.FOES.grass; return a[Math.floor(Math.random() * a.length)] };

  /* ---------- encounters ---------- */
  /* ---------- v94.03 · event cards from the bag, used out here (they were tied to the old area maps) ---------- */
  const CARD_ENC = { treasureMap: 'oldmap+chest', strangeRune: 'oldmap', oldShrine: 'shrine', willowisp: 'shrine', merchant: 'merchant', hotSpring: 'camp', lostMiner: 'chest', shipwreck: 'chest', fallenCart: 'chest', cursedIdol: 'idol', howl: 'battle:wolf', wanderingKnight: 'battle:bandit' };
  function eventCards() { const bag = WS.game().village.bag || {}, E = window.ADVENTURE_DATA?.EVENT_CARDS || {}; return Object.entries(bag).filter(([k, n]) => n > 0 && E[k] && CARD_ENC[k]).map(([k, n]) => ({ k, n, d: E[k] })) }
  async function useEventCard() {
    if (busy) return; const list = eventCards(); if (!list.length) return;
    const v = await modal(`<h2>🎴 การ์ดเหตุการณ์</h2><p>ใช้การ์ดตรงจุดที่ยืนอยู่ตอนนี้ · ใช้แล้วการ์ดหายไป</p>${list.map(x => `<button data-pick="${x.k}" style="display:block;width:100%;text-align:left;margin:4px 0"><b>${esc(x.d.name)}</b> ×${x.n}<br><small>${esc(x.d.text || '')}</small></button>`).join('')}`, [{ label: 'ปิด', value: null, ghost: true }]);
    if (!v || !CARD_ENC[v]) return; const bag = WS.game().village.bag; bag[v]--; if (bag[v] <= 0) delete bag[v]; WS.commit();
    busy = true; const here = tile(S.pos.c, S.pos.r), kind = CARD_ENC[v], fake = k => ({ ...here, enc: { type: k } }), key = 'card:' + Date.now();
    try {
      if (kind.startsWith('battle:')) await battle(kind.slice(7), G.danger(world, here), {});
      else if (kind === 'oldmap+chest') { await encounter(fake('oldmap'), key + 'a'); await encounter(fake('chest'), key + 'b') }
      else if (kind === 'idol') await encounter(fake(Math.random() < .5 ? 'chest' : 'trap'), key);
      else if (kind === 'camp') await camp(true);
      else await encounter(fake(kind), key);
    } finally { busy = false; delete S.cleared[key]; delete S.cleared[key + 'a']; delete S.cleared[key + 'b']; hudSync(); save() }
  }
  async function encounter(t, k) {
    const e = t.enc, dang = G.danger(world, t);
    if (e.type === 'battle') { const r = await battle(e.foe, dang, {}); if (r === 'win') S.cleared[k] = true; return true }
    S.cleared[k] = true;
    if (e.type === 'chest') {
      const gold = Math.round(15 + Math.random() * 25 + dang * 40), pot = Math.random() < .35; S.gold += gold; if (pot) S.potions++;
      log('เปิดหีบ +' + gold + ' 💰' + (pot ? ' +ยา 1' : '')); ev('chest:found', { gold, biome: t.biome }); await modal(`<h2>🎁 หีบสมบัติ</h2><p>ใต้รากไม้มีหีบเก่าถูกฝังไว้ ข้างในมี <b>${gold} เหรียญ</b>${pot ? ' และ <b>ยาฟื้นฟู 1 ขวด</b>' : ''}</p>`);
    } else if (e.type === 'camp') {
      const v = await modal(`<h2>⛺ จุดพักแรมปลอดภัย</h2><p>ซากกองไฟเก่ากับเพิงหินกันลม ที่นี่ปลอดภัยพอจะพักได้หนึ่งคืน (ใช้เสบียง 1 · ผ่านไป 8 ชม. · HP เต็ม · ไม่มีใครซุ่มโจมตี)</p>`, [{ label: 'พักที่นี่', value: 'rest' }, { label: 'เดินต่อ', value: null, ghost: true }]);
      if (v === 'rest') await camp(true); else S.cleared[k] = false;
    } else if (e.type === 'shrine') {
      revealArea(t.c, t.r, 3); const d = destOf(); let hint = ''; if (d && !S.done[d.id]) { const p = G.path(world, t, d); if (p) { p.slice(0, 7).forEach(x => S.known[K(x.c, x.r)] = 1); hint = ' และเห็นทางช่วงต่อไปสู่ ' + d.name } }
      fogDirty = true; log('ศาลเจ้าเผยหมอกรอบตัว' + hint); await modal(`<h2>✦ ศาลเจ้าโบราณ</h2><p>คุณจุดเทียนบนแท่นหิน ลมพัดหมอกดำถอยออกไปรอบทิศ${esc(hint)}</p>`);
    } else if (e.type === 'oldmap') {
      const d = destOf(); if (d) { revealArea(d.c, d.r, 2); const p = G.path(world, world.home, d); if (p) p.forEach((x, i) => { if (i % 2 === 0) S.known[K(x.c, x.r)] = 1 }) }
      fogDirty = true; log('พบแผนที่เก่า เผยรอบจุดหมาย'); await modal(`<h2>📜 แผนที่เก่า</h2><p>กระดาษเปื่อยในกระเป๋าของนักเดินทางที่ไม่ได้กลับบ้าน มีเส้นประจาง ๆ ลากไปถึง${d ? ' <b>' + esc(d.name) + '</b>' : 'ที่ใดสักแห่ง'}</p>`);
    } else if (e.type === 'merchant') {
      await merchant();
    } else if (e.type === 'trap') {
      const dmg = Math.round(6 + Math.random() * 8 + dang * 6); S.hp = Math.max(1, S.hp - dmg); document.body.classList.add('wm-shake'); setTimeout(() => document.body.classList.remove('wm-shake'), 420);
      log('กับดัก! −' + dmg + ' HP'); await modal(`<h2>⚠ กับดัก!</h2><p>กิ่งไม้ดีดขึ้นจากใต้ใบไม้ใส่เต็ม ๆ เสีย <b>${dmg} HP</b></p>`);
    }
    hudSync(); save(); return true;
  }
  async function merchant() {
    for (;;) {
      const v = await modal(`<h2>💰 พ่อค้าเร่</h2><p>“เดินทางไกลถึงนี่เชียว? ของจำเป็นทั้งนั้น ราคามิตรภาพ”</p><p>มี ${S.gold} 💰 · เสบียง ${S.food} · ยา ${S.potions}</p>`,
        [{ label: 'เสบียง 2 ห่อ · 18 💰', value: 'food', disabled: S.gold < 18 }, { label: 'ยาฟื้นฟู · 24 💰', value: 'pot', disabled: S.gold < 24 }, { label: 'ไปต่อ', value: null, ghost: true }]);
      if (v === 'food') { S.gold -= 18; S.food += 2; log('ซื้อเสบียง 2') } else if (v === 'pot') { S.gold -= 24; S.potions++; log('ซื้อยาฟื้นฟู') } else break;
      hudSync();
    }
  }
  /* camp anywhere on the road: clears fatigue and heals (full with food, a little without); at night you sleep until morning.
     Out in the wild the camp can be attacked — more likely at night and deeper in the fog. A marked safe camp is never attacked. */
  async function camp(safe) {
    if (busy && !safe) return;
    const here = tile(S.pos.c, S.pos.r), dang = G.danger(world, here), night = nightness() > .5, fed = S.food > 0;
    const risk = safe ? 0 : Math.min(.45, (night ? .24 : .1) * (.5 + dang * 1.5));
    if (!safe) { const v = await modal(`<h2>⛺ พักแรมที่นี่?</h2><p>${night ? 'นอนจนถึงเช้า' : 'พัก 6 ชั่วโมง'} · ${fed ? 'ใช้เสบียง 1 · HP เต็ม' : 'ไม่มีเสบียง · ฟื้น HP แค่ 30%'} · ความเหนื่อยหาย</p><p>โอกาสถูกบุกค่าย <b style="color:#a0281a">${Math.round(risk * 100)}%</b>${night ? ' (กลางคืนเสี่ยงกว่า)' : ''}</p>`, [{ label: '⛺ ตั้งแคมป์', value: true }, { label: 'ยังก่อน', value: null, ghost: true }]); if (!v) return }
    busy = true; hudSync(); if (fed) S.food--;
    toast('⛺ พักแรม…'); await wait(900);
    const hours = night ? ((30 - S.hour) % 24 || 6) : 6;
    if (Math.random() < risk) {
      passTime(Math.round(hours / 2)); S.hp = Math.min(S.maxHp, S.hp + Math.round(S.maxHp * .25)); S.fatigue = Math.round(S.fatigue / 2); busy = false;
      log('ถูกบุกค่ายกลางดึก!'); ev('camp:ambush', { biome: here.biome }); await battle(pickFoe(here), dang, { ambush: true, camp: true }); busy = true;
      if (S.pos.c === here.c && S.pos.r === here.r && S.hp > 0) { passTime(Math.round(hours / 2)); S.fatigue = 0; log('หลังไล่ศัตรูไปได้ ก็นอนต่อจนพอแรง') }
    } else { passTime(hours); S.fatigue = 0; S.hp = fed ? S.maxHp : Math.min(S.maxHp, S.hp + Math.round(S.maxHp * .3)); healParty(fed ? 1 : .3); log('พักแรม ' + (fed ? 'ทีม HP เต็ม' : 'HP +30%') + ' หายเหนื่อย') }
    reveal(); busy = false; hudSync(); save();
  }
  async function goHome() {
    if (busy) return; const p = G.path(world, S.pos, world.home, x => x && isKnown(K(x.c, x.r)));
    if (!p) { toast('ยังไม่มีทางที่รู้จักกลับหมู่บ้าน'); return }
    const hours = p.slice(1).reduce((a, x) => a + G.stepCost(tile(x.c, x.r)), 0), food = p.slice(1).filter(x => !tile(x.c, x.r).road && !tile(x.c, x.r).poi).length;
    const v = await modal(`<h2>🏠 กลับหมู่บ้าน</h2><p>เดินย้อนตามทางที่รู้จัก ${p.length - 1} ช่อง ราว ${hours} ชม. ใช้เสบียง ~${food}</p><p>ทางที่เดินผ่านแล้วปลอดภัย (ศัตรูที่ยังไม่ได้ปราบอาจขวางทาง)</p>`, [{ label: 'ออกเดิน', value: true }, { label: 'ยกเลิก', value: null, ghost: true }]);
    if (v) walk(p);
  }
  async function arriveHome() {
    S.hp = S.maxHp; healParty(1); ev('journey:home', { days: Math.max(1, S.day - (S.leftDay ?? S.day)), destName: destOf()?.name }); S.leftDay = S.day; syncClock(); log('กลับถึงหมู่บ้าน พักฟื้นเต็มที่'); save(); hudSync();
    const left = world.dests.filter(d => !S.done[d.id]).length;
    await modal(`<h2>🏠 หมู่บ้านเฟิร์นเวล</h2><p>ชาวบ้านออกมารับ HP ฟื้นเต็ม · เสบียงเหลือ ${S.food} ห่อ${S.food < 4 ? ' (ซื้อเพิ่มได้ที่ตลาด)' : ''}</p><p>${left ? 'ยังมีข่าวลือรออยู่อีก ' + left + ' แห่งที่กระดานภารกิจ' : 'ทุกข่าวลือถูกพิสูจน์แล้ว — ลองสร้าง “โลกใหม่” ได้'}</p>`);
    if (S.dest && S.done[S.dest]) S.dest = null; hudSync();
  }

  /* ---------- battles (the flat card battle in an iframe) ---------- */
  const MON_HP = { bandit: 34, wolf: 26, slime: 40, kobold: 30, golem: 95, shadowWolf: 44, bat: 22, gull: 26 };
  async function battle(foe, dang, o = {}) {
    busy = true; hudSync();
    const here = tile(S.pos.c, S.pos.r), night = nightness() > .6;
    /* after dark: fierce night monsters (shadow wolves in open land, enraged ones elsewhere) */
    let fierce = false; if (night && !o.boss && Math.random() < .45) { fierce = true; if (['forest', 'grass', 'snow'].includes(here.biome)) foe = 'shadowWolf' }
    const elite = !o.boss && dang > .65 && Math.random() < .5, base = MON_HP[foe] || 34;
    let mult = o.boss ? Math.round(130 / base * 10) / 10 : Math.round((1.4 + dang * .8) * (elite ? 1.3 : 1) * (fierce && foe !== 'shadowWolf' ? 1.25 : 1) * 10) / 10;
    if (foe === 'shadowWolf') mult = Math.round((1.1 + dang * .5) * 10) / 10;
    const fs = window.Progression ? Progression.foeScale(Progression.heroLevel(WS.game())) : { hp: 1, atk: 1 };   /* v95.00: monsters grow a little with the hero */
    mult = Math.round(mult * fs.hp * 10) / 10;
    const atk = Math.round((fierce ? 1.3 : 1) * fs.atk * 100) / 100, hst = Math.max(20, Math.round(100 - S.fatigue * .6));
    await encounterFx(o.boss ? 'BOSS!' : o.ambush ? 'AMBUSH!' : fierce ? 'NIGHT TERROR!' : 'ENCOUNTER!');
    const fr = document.createElement('iframe'); fr.id = 'wmBattle';
    const title = (o.boss ? 'บอส · ' : elite ? 'ยอดฝีมือ · ' : '') + (BOSS_NAME[foe] && o.boss ? BOSS_NAME[foe] : '');
    const poi = o.boss ? (destOf()?.id || '') : '';
    /* a group: more monsters deeper in the fog, at night and in ambushes; the boss brings two of the local monsters */
    const n = o.boss ? 3 : Math.max(2, Math.min(5, 2 + Math.round(dang * 2) + (night ? 1 : 0) + (o.ambush ? 1 : 0)));   // a party of four meets 2–5 monsters
    const group = [foe + '*' + (n > 1 && !o.boss ? Math.round(mult * .85 * 10) / 10 : mult)];
    for (let i = 1; i < n; i++) { const k = o.boss ? pickFoe(here) : Math.random() < .6 ? foe : pickFoe(here); group.push(k + '*' + Math.round((1.2 + dang * .6) * (k === 'shadowWolf' ? .8 : 1) * fs.hp * 10) / 10) }
    const party = S.party.filter(p => p.hp > 0).map(p => p.key + ':' + p.hp + ':' + p.max + ':' + (p.order || 'charge') + ':' + (p.level || 1)).join(',');
    const fighters = S.party.filter(p => p.hp > 0), heroQ = window.Progression ? '&' + Progression.battleParam(WS.game()) : '';   /* v95.00: level, weapon, stats → card battle */
    fr.src = `battle-field.html?battle=1&embed=1&r=7&biome=${({ ash: 'hills', volcano: 'hills' })[here.biome] || here.biome}&poi=${poi}&night=${night ? 1 : 0}&m=${foe}&ms=${encodeURIComponent(group.join(','))}&party=${encodeURIComponent(party)}&hp=${mult}&atk=${atk}&hst=${hst}&hhp=${S.hp}&hmax=${S.maxHp}${heroQ}&title=${encodeURIComponent(title)}`;
    /* the shards stay over the screen until the arena inside the frame says it is ready (the village art may take a few seconds the first time) */
    const readyP = new Promise(resolve => { const on = e => { if (e.data?.type === 'agrenor-battle-ready' && !e.data.warm) { removeEventListener('message', on); resolve() } }; addEventListener('message', on); setTimeout(resolve, 20000) });
    const resP = new Promise(resolve => { const on = e => { if (e.data?.type === 'agrenor-battle') { removeEventListener('message', on); resolve(e.data) } }; addEventListener('message', on) });
    document.body.append(fr);
    const wait1 = document.createElement('div'); wait1.className = 'wm-toast'; wait1.style.animation = 'none'; wait1.style.top = '62%'; wait1.textContent = 'กำลังเตรียมสนามรบ…'; setTimeout(() => { if (wait1.isConnected === false && !fr.classList.contains('on')) document.body.append(wait1) }, 1400);
    await readyP; wait1.remove(); fr.classList.add('on'); document.querySelectorAll('.wm-enc').forEach(e => setTimeout(() => e.remove(), 350));
    const res = await resP;
    fr.classList.remove('on'); await wait(380); fr.remove();
    S.hp = Math.max(0, Math.min(S.maxHp, res.hp ?? S.hp));
    for (const r of res.party || []) { const p = S.party.find(x => x.key === r.key); if (p) { p.hp = Math.max(0, r.hp); if (r.order) p.order = r.order; if (p.hp <= 0) { p.hp = Math.round(p.max * .25); log(p.name + ' ล้มในการต่อสู้ ลุกขึ้นมาบาดเจ็บ'); ev('party:ko', { who: p.key, whoName: p.name }) } } }
    if (fierce && res.outcome !== 'flee') ev('night:terror', { foe, biome: here.biome });
    if (!o.boss) ev(res.outcome === 'win' ? 'battle:win' : res.outcome === 'flee' ? 'battle:flee' : 'battle:lose', { foe, biome: here.biome });
    else if (res.outcome !== 'win') ev(res.outcome === 'flee' ? 'battle:flee' : 'battle:lose', { foe, biome: here.biome, destName: destOf()?.name });
    if (res.outcome === 'win') {
      S.battles++; S.kills += res.kills || 0; const gold = o.boss ? 0 : Math.round((10 + dang * 30 + (elite ? 20 : 0)) * (night ? 1.5 : 1)); S.gold += gold; S.hp = Math.max(1, S.hp);
      const loot = dropLoot(foe, here.biome, dang, o.boss);
      /* v94.06 F2: experience — the hero and the companions who fought */
      if (window.Progression) {
        const xp = Progression.battleXp({ dang, elite, boss: o.boss, kills: res.kills }), ups = Progression.gainHero(WS.game(), xp);
        log('✦ EXP +' + xp + (ups.length ? ' · เลเวลอัป! Lv.' + ups[ups.length - 1] + ' (HP สูงสุด ' + S.maxHp + ')' : ''));
        if (ups.length) toast('LEVEL UP! Lv.' + ups[ups.length - 1]);
        for (const p of fighters) { const m = S.party.find(x => x.key === p.key); if (!m) continue; const u = Progression.gainAlly(m, Math.round(xp * .8)); if (u.length) log(m.name + ' เลเวลอัป Lv.' + u[u.length - 1] + ' (HP ' + m.max + ')') }
        WS.commit();
      }
      log('ชนะ' + (o.boss ? 'บอส' : '') + '! ' + (gold ? '+' + gold + ' 💰' : '') + (loot ? ' · ' + loot : '')); toast('VICTORY! ' + (gold ? '+' + gold + ' 💰' : '') + (loot ? ' · ' + loot : ''));
    } else if (res.outcome === 'flee') {
      log('หนีออกมาได้'); if (S.prev) { S.pos = { ...S.prev }; const p = center(S.pos.c, S.pos.r); token.x = p.x; token.y = p.y; reveal() } S.hp = Math.max(1, S.hp);
    } else {
      const lost = Math.floor(S.gold / 2); S.gold -= lost; S.hp = Math.ceil(S.maxHp / 2); healParty(.5); S.pos = { ...world.home }; const p = center(S.pos.c, S.pos.r); token.x = p.x; token.y = p.y; reveal(); follow();
      log('พ่ายแพ้… ถูกพากลับหมู่บ้าน เสีย ' + lost + ' 💰'); await modal(`<h2>💀 หมดสติ</h2><p>พรานผ่านมาเจอคุณนอนอยู่กลางทาง พากลับถึงหมู่บ้าน ข้าวของหล่นหายไป <b>${lost} เหรียญ</b></p><p>ทางที่เคยเดินยังจำได้ — ลองใหม่อีกครั้ง</p>`);
    }
    busy = false; hudSync(); save(); return res.outcome;
  }
  async function encounterFx(text) {
    const d = document.createElement('div'); d.className = 'wm-enc'; d.innerHTML = Array.from({ length: 8 }, (_, i) => `<i style="top:${i * 12.5}%;animation-delay:${(i % 2 ? .06 : 0) + i * .03}s"></i>`).join('') + `<b>${esc(text)}</b>`;
    document.body.append(d); await wait(1150);
  }
  async function bossFight(d) {
    const v = await modal(`<h2>☠ ${esc(d.name)}</h2><p>${esc(d.rumor)}</p><p>บางอย่างขยับอยู่ในเงามืด… <b>${esc(BOSS_NAME[d.boss] || d.boss)}</b></p><p>HP ตอนนี้ ${S.hp}/${S.maxHp}</p>`, [{ label: '⚔ บุกเข้าไป', value: 'go' }, { label: 'ถอยออกมาก่อน', value: null, ghost: true }]);
    if (v !== 'go') { if (S.prev) { S.pos = { ...S.prev }; const p = center(S.pos.c, S.pos.r); token.x = p.x; token.y = p.y; reveal(); hudSync() } return }
    const r = await battle(d.boss, 1, { boss: true });
    if (r !== 'win') return;
    S.done[d.id] = true; S.gold += d.reward; ev('boss:win', { dest: d.id, destName: d.name, biome: d.biome }); revealArea(d.c, d.r, 2); log('พิชิต ' + d.name + '! +' + d.reward + ' 💰'); save(); hudSync();
    /* v95.10 · F3: a boss leaves a card the hero does not own yet (js/card-sources.js in the game page) */
    try { let w = window; for (let i = 0; i < 4 && w && !w.CardSources; i++) { if (w.parent === w) break; w = w.parent } if (w?.CardSources) await w.CardSources.bossDrop(BOSS_NAME[d.boss] || d.boss) } catch (e) { }
    await modal(`<h2>🏆 พิชิต ${esc(d.name)}</h2><p>ข่าวลือกลายเป็นตำนาน หมอกรอบ ${esc(d.name)} จางหายไปถาวร</p>
      <p>รางวัล <b>${d.reward} 💰</b> · ต่อสู้ ${S.battles} ครั้ง · เดิน ${S.steps} ช่อง · วันที่ ${S.day}</p>`, [{ label: '🏠 เดินทางกลับหมู่บ้าน', value: true }]);
    goHome();
  }

  /* ---------- start ---------- */
  load(); resize(); paint();
  { const p = center(S.pos.c, S.pos.r); token.x = p.x; token.y = p.y; cam.x = p.x; cam.y = p.y; cam.z = innerWidth < 700 ? .9 : 1.25 }
  hudSync(); requestAnimationFrame(frame);
  setInterval(() => { try { adoptLeads() } catch (e) { } }, 2500);
  window.WorldMap = { revealAll: () => { for (const k in world.tiles) S.known[k] = 1; fogDirty = true }, state: () => S, world: () => world, step: h => clickHex(h), questBoard, chooseDest, busy: () => busy, center };
})();

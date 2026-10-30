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
    water: ['#3f6f96', '#4a7ba3', '#365f84'], swamp: ['#5b6b45', '#66764d', '#4d5c3b'], snow: ['#dfe7ee', '#eef3f7', '#cfd9e2'], sand: ['#d8c48f', '#e2cf9c', '#cbb680'], ash: ['#4a3a34', '#5a463e', '#3c2f2a'], stone: ['#8f8470', '#9c917c', '#7e7462'], highland: ['#6f665c', '#7c7368', '#615950'], volcano: ['#6a2a1a', '#8a3a1a', '#4a1e14'] };
  let terr = null;
  function paint() {
    /* v95.22: the real Nor'Chorthal map is big — paint it at half resolution (it is drawn scaled up) */
    const TS = world.real ? .4 : 1;
    terr = document.createElement('canvas'); terr.width = Math.ceil(WW * TS); terr.height = Math.ceil(WH * TS); const t = terr.getContext('2d'), rnd = G.rng(world.seed ^ 0xabc); t.scale(TS, TS);
    t.fillStyle = '#2a2f2a'; t.fillRect(0, 0, WW, WH);
    const all = Object.values(world.tiles);
    for (const h of all) { const p = center(h.c, h.r), pal = PAL[h.biome]; hexPath(t, p.x, p.y, R + .6); t.fillStyle = pal[0]; t.fill() }
    /* soft blending + speckles */
    for (const h of all) { const p = center(h.c, h.r), pal = PAL[h.biome]; t.save(); hexPath(t, p.x, p.y, R + .6); t.clip(); for (let i = 0; i < (world.real ? 6 : 26); i++) { t.fillStyle = pal[1 + (i & 1)]; t.globalAlpha = .45; t.beginPath(); t.arc(p.x + (rnd() - .5) * HW, p.y + (rnd() - .5) * 2 * R, 2 + rnd() * 5, 0, 7); t.fill() } t.restore() }
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
      else if (h.biome === 'stone') { for (let i = 0; i < 4; i++) { const x = p.x + (rnd() - .5) * 40, y = p.y + (rnd() - .5) * 28, r = 2.5 + rnd() * 4; t.fillStyle = 'rgba(0,0,0,.25)'; t.beginPath(); t.ellipse(x + 1.5, y + 1.5, r, r * .6, 0, 0, 7); t.fill(); t.fillStyle = ['#b8ae98', '#a39882', '#cfc6b0'][i % 3]; t.beginPath(); t.ellipse(x, y, r, r * .62, 0, 0, 7); t.fill() } }
      else if (h.biome === 'highland') { mountain(t, p.x + (rnd() - .5) * 10, p.y + 12, 20 + rnd() * 8, rnd() < .3); hill(t, p.x + (rnd() - .5) * 20, p.y + 6, 16) }
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
    for (const tw of world.towns || []) { const q = center(tw.c, tw.r); (tw.icon === 'city' ? city : village)(t, q.x, q.y) }   // v94: other settlements · v97.72 the walled capital
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
  /* v97.72 · Lakenhold: a ring wall, a keep and the mages' tower */
  function city(t, x, y) { t.fillStyle = 'rgba(120,100,70,.4)'; t.beginPath(); t.ellipse(x, y + 4, 42, 20, 0, 0, 7); t.fill(); t.strokeStyle = '#8f8778'; t.lineWidth = 4; t.beginPath(); t.ellipse(x, y + 2, 36, 16, 0, Math.PI * .95, Math.PI * 2.05); t.stroke();
    house(t, x - 22, y + 4, 12, '#b4523a'); house(t, x + 20, y + 6, 12, '#a8462f'); house(t, x - 6, y + 12, 13, '#c0603f'); house(t, x + 8, y - 4, 14, '#9c4a33');
    t.fillStyle = '#b8b0a0'; t.fillRect(x - 6, y - 26, 12, 26); t.fillStyle = '#6a4ab0'; t.beginPath(); t.moveTo(x - 9, y - 26); t.lineTo(x, y - 40); t.lineTo(x + 9, y - 26); t.fill(); t.fillStyle = '#d8b04a'; t.fillRect(x - 1, y - 48, 2, 9) }
  function village(t, x, y) { t.fillStyle = 'rgba(120,90,50,.35)'; t.beginPath(); t.ellipse(x, y + 4, 30, 14, 0, 0, 7); t.fill(); house(t, x - 14, y - 2, 14, '#b4523a'); house(t, x + 12, y - 6, 13, '#a8462f'); house(t, x - 2, y + 10, 15, '#c0603f'); house(t, x + 20, y + 10, 11, '#9c4a33') }
  function poiIcon(ctx, d, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (d.icon === 'cave') { ctx.fillStyle = '#6d6458'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 16, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#16120e'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 10, 0, Math.PI, 0); ctx.fill() }
    else if (d.icon === 'mine') { ctx.fillStyle = '#7a6a50'; ctx.beginPath(); ctx.moveTo(-20, 2); ctx.lineTo(0, -22); ctx.lineTo(20, 2); ctx.fill(); ctx.fillStyle = '#1a140e'; ctx.fillRect(-7, -12, 14, 14); ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3; ctx.strokeRect(-8, -13, 16, 15) }
    else if (d.icon === 'ruin') { ctx.fillStyle = '#b8b0a0'; for (const [px, h] of [[-14, 22], [-4, 30], [6, 16], [15, 26]]) ctx.fillRect(px - 3, -h, 6, h); ctx.fillRect(-18, -2, 36, 4); ctx.fillStyle = '#8f8778'; ctx.fillRect(-8, -32, 18, 4) }
    ctx.restore();
  }

  /* ---------- fog canvas (half resolution → soft edges when scaled up) ---------- */
  let FS = .5, fog = null, wisp = null;
  function paintFog() {
    if (!fog) { FS = world.real ? .3 : .5; fog = document.createElement('canvas'); fog.width = Math.ceil(WW * FS); fog.height = Math.ceil(WH * FS); wisp = document.createElement('canvas'); wisp.width = fog.width; wisp.height = fog.height }
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
  /* ---------- v97.27 · companions talk on the road (TODO "เพื่อนร่วมทีมพูดระหว่างทาง"): walking (by land, night, hunger, tiredness),
     making camp, before a fight and after a win — in each companion's village voice (VillageLife.P[key].voice); a bubble over the token ---------- */
  const SAY = window.PartyTalk?.SAY || {};
  let talkB = null, talkCD = 0;
  function chatter(kind, chance = 1) {
    const mates = (S.party || []).filter(p => p.hp > 0); if (!mates.length || Math.random() > chance) return;
    if (kind === 'walk') { if (talkCD > 0) { talkCD--; return } kind = nightness() > .6 ? 'night' : S.food <= 0 ? 'hungry' : S.fatigue >= 70 ? 'tired' : 'walk'; talkCD = 5 }
    const m = mates[Math.floor(Math.random() * mates.length)], voice = window.PartyTalk?.voiceOf(m.key) || 'cheerful', set = (SAY[voice] || SAY.cheerful || {})[kind] || SAY.cheerful?.[kind];
    if (!set) return; const text = set[Math.floor(Math.random() * set.length)]; talkB = { who: m.name, text, until: performance.now() + 3200 }; log('💬 ' + m.name + ': ' + text);
  }
  function drawTalk(now) {
    if (!talkB || now > talkB.until) return; const a = Math.min(1, (talkB.until - now) / 400, (now - talkB.until + 3200) / 200);
    g.save(); g.globalAlpha = Math.max(0, a); g.font = '600 12px VillageThai,"Noto Sans Thai",system-ui'; const t = talkB.who + ': ' + talkB.text, w = Math.min(300, g.measureText(t).width + 18), x = token.x - w / 2, y = token.y - 104;
    g.fillStyle = 'rgba(250,240,215,.95)'; g.strokeStyle = '#6a4a20'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(x, y, w, 24, 10); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(token.x - 6, y + 24); g.lineTo(token.x, y + 32); g.lineTo(token.x + 6, y + 24); g.fill();
    g.fillStyle = '#3a2810'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t.length > 46 ? t.slice(0, 45) + '…' : t, token.x, y + 12.5); g.restore();
  }
  const VP = id => !!window.VillageProjects?.has(id);
  /* v97.54 · T6 phase 2: a loaded wagon draws bandits (up to ×1.5), an escort keeps them off (×0.6) */
  const cargoRisk = () => { const ST = window.Settlements; if (!ST) return 1; const n = ST.load(S); return (n ? 1 + Math.min(.5, n / 24) : 1) * (ST.escorted(S) ? .6 : 1) };
  const LOOK = window.JobLook?.mine() || null;   /* v97.23 · J4: the job's outfit colour and aura on the map too */
  function drawToken(now) {
    const set = token.walking ? walkImgs : heroImgs, im0 = set[Math.floor(now / (token.walking ? 110 : 260)) % set.length], im = LOOK ? JobLook.pic(im0, im0.src, LOOK) : im0, s = 76;
    const night = nightness(), lr = 70 + Math.sin(now * .004) * 4;
    const lg = g.createRadialGradient(token.x, token.y - 8, 4, token.x, token.y - 8, lr); lg.addColorStop(0, `rgba(255,210,130,${.18 + night * .25})`); lg.addColorStop(1, 'rgba(255,210,130,0)');
    g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = lg; g.beginPath(); g.arc(token.x, token.y - 8, lr, 0, 7); g.fill(); g.restore();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(token.x, token.y + 2, 14, 5, 0, 0, 7); g.fill();
    const ap = { x: token.x, y: token.y + 4 }; if (LOOK) JobLook.aura(g, LOOK, ap, s, now, false);
    if (im0.complete && im0.naturalWidth) { g.save(); g.translate(token.x, token.y + 4 - Math.abs(Math.sin(token.bob)) * (token.walking ? 3 : 0)); if (token.face < 0) g.scale(-1, 1); g.drawImage(im, -s / 2, -s * .94, s, s); g.restore() }
    if (LOOK) JobLook.aura(g, LOOK, ap, s, now, true);
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
  const ENC_ICON = { hamlet: '🏘', outpost: '🚩', tower: '🗼', ruins: '🏛', chest: '🎁', camp: '⛺', shrine: '✦', merchant: '💰', oldmap: '📜' };
  function drawMarks(now) {
    if (window.Estates) for (const p of Estates.list(S)) { if (!p.at.startsWith('tile:')) continue; const [c, r] = p.at.slice(5).split(',').map(Number), q = center(c, r); g.save(); g.font = '18px system-ui,"Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.fillText(p.kind ? Estates.KINDS[p.kind].icon : '🚩', q.x + 14, q.y - 14); g.restore() }   /* v97.49 · your plots */
    for (const k in world.tiles) {
      const h = world.tiles[k]; if (!isKnown(k)) continue;
      const p = center(h.c, h.r);
      if (h.poi && h.poi.id !== 'home' && S.done[h.poi.id] && h.poi.id !== S.dest) { poiIcon(g, h.poi, p.x, p.y + 6, .8); label(g, '✔ ' + h.poi.name, p.x, p.y + 28, '#bfffd0', 11) }
      if (!h.enc || S.cleared[k] || h.enc.type === 'trap') continue;
      const lmk = h.enc.landmark;
      if (h.enc.type === 'battle') continue;   // v95.16: no battle marks — an ambush can happen on any step
      const bob = Math.sin(now * .004 + h.c) * 2, x = p.x, y = p.y - 6 + bob;
      g.save(); g.fillStyle = lmk ? 'rgba(70,50,20,.85)' : 'rgba(25,30,40,.75)'; g.beginPath(); g.arc(x, y, lmk ? 14 : 12, 0, 7); g.fill(); g.strokeStyle = lmk ? '#ffd27a' : '#e8d8a8'; g.lineWidth = 1.5; g.stroke();
      g.font = '13px system-ui,"Segoe UI Emoji","Apple Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(ENC_ICON[h.enc.type] || '?', x, y + 1); g.restore();
      if (lmk && visible.has(k)) label(g, h.enc.name, x, y + 24, '#ffe6b0', 11);
    }
    if (window.Bounties) for (const b of Bounties.active(S)) { if (b.state !== 'open' || b.c == null || !isKnown(b.c + ',' + b.r)) continue; const p = center(b.c, b.r), y = p.y - 8 + Math.sin(now * .005 + b.c) * 2;   /* v97.73 · wanted */
      g.save(); g.fillStyle = 'rgba(140,25,20,.9)'; g.beginPath(); g.arc(p.x, y, 14, 0, 7); g.fill(); g.strokeStyle = '#ffd27a'; g.lineWidth = 2; g.stroke(); g.font = '15px system-ui,"Segoe UI Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText('☠', p.x, y + 1); g.restore(); label(g, b.name, p.x, y + 26, '#ffb0a0', 11) }
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
    drawTrail(); drawMarks(now); drawHover(); drawToken(now); drawTalk(now);
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
  .wm-area{position:fixed;inset:0;z-index:15;background:#07080c;animation:wmFade .3s}.wm-area canvas{position:absolute;inset:0;cursor:pointer}
  .wm-area header{position:absolute;left:12px;right:12px;top:10px;display:flex;align-items:center;gap:12px;padding:8px 12px;background:#20190fe6;border:1px solid #8a6a3a;border-radius:10px;color:#f3e6c6;font-family:VillageThai,system-ui,sans-serif}
  .wm-area header b{font-size:17px;color:#ffd98a}.wm-area header small{opacity:.8;flex:1}.wm-area header .st{font-size:13px;opacity:.9}.wm-area header button{background:#4a3e2e;color:#fff;border:0;border-radius:8px;padding:6px 10px}
  #wmBattle{position:fixed;inset:0;z-index:35;border:0;width:100%;height:100%;background:#000;opacity:0;transition:opacity .35s}#wmBattle.on{opacity:1}
  .wm-shake{animation:wmShake .4s}@keyframes wmShake{20%{transform:translate(6px,-3px)}40%{transform:translate(-5px,4px)}60%{transform:translate(4px,2px)}80%{transform:translate(-3px,-2px)}}
  @media (max-width:700px){#wmHud{width:210px;font-size:12px;padding:8px}#wmLog{display:none}.wm-enc b{font-size:40px}}`;
  document.head.append(css);
  const hud = document.createElement('div'); hud.id = 'wmHud'; document.body.append(hud);
  const tipEl = document.createElement('div'); tipEl.id = 'wmTip'; document.body.append(tipEl);
  function hudSync() {
    const d = destOf(), t = tile(S.pos.c, S.pos.r), dang = G.danger(world, t), stars = '★'.repeat(1 + Math.round(dang * 3)) + '☆'.repeat(3 - Math.round(dang * 3));
    const hh = Math.floor(S.hour), mm = S.hour % 1 ? '30' : '00', icon = nightness() > .5 ? '🌙' : '☀';
    hud.innerHTML = `<h1>🗺 Agrenor</h1><div class="sub">${window.WorldState?.season ? WorldState.season(S.day)[2] + ' ' : ''}วันที่ ${S.day} · ${icon} ${String(hh).padStart(2, '0')}:${mm} · ${esc(G.BIOME[t.biome].name)}${t.poi ? ' · ' + esc(t.poi.name) : ''}</div>
      <div class="row"><span>HP</span><span>${S.hp}/${S.maxHp}</span></div><div class="bar"><i style="width:${S.hp / S.maxHp * 100}%;background:#6fd18a"></i></div>
      <div class="row" style="flex-wrap:wrap;gap:4px">${S.party.map(p => `<span title="${esc(p.name)}" style="font-size:11px;background:#0004;border-radius:5px;padding:1px 5px;${p.hp < p.max * .3 ? 'color:#ff9a7a' : ''}">${esc(p.name)} ${p.hp}/${p.max}</span>`).join('')}</div>
      <div class="row"><span>ความเหนื่อย</span><span style="color:${S.fatigue >= 80 ? '#ff8a6a' : '#e8d8a8'}">${S.fatigue}%${S.fatigue >= 80 ? ' ⚠' : ''}</span></div><div class="bar"><i style="width:${S.fatigue}%;background:${S.fatigue >= 80 ? '#e2705f' : '#c9a24a'}"></i></div>
      <div class="row"><span>🍞 เสบียง ${S.food}</span><span>💰 ${S.gold}</span><span>🧪 ${S.potions}</span></div>${(() => { const bs = window.Bounties?.active(S) || []; if (!bs.length) return ''; const won = bs.filter(b => b.state === 'slain').length, open = bs.length - won; return `<div class="row" style="color:#ffb0a0"><span>☠ ค่าหัว${open ? ' ' + open + ' ใบ' : ''}</span><span>${won ? '✔ รอรับรางวัล ' + won : 'เหลือ ' + Math.max(0, Math.min(...bs.filter(b => b.state === 'open').map(b => b.until)) - S.day) + ' วัน'}</span></div>` })()}
      <div class="row"><span>ความลึกของหมอก</span><span style="color:#ff9a7a">${stars}</span></div>
      <div class="row"><span>จุดหมาย</span><span style="color:#ffe2a8">${d ? esc(d.name) + (S.done[d.id] ? ' ✔' : ' · ' + G.dist(S.pos, d) + ' ช่อง') : '—'}</span></div>
      <div class="btns">${atHome() ? `<button id="wmQuest">📜 เรื่องที่ได้ยินมา</button><button id="wmVillage" class="ghost">🏠 เข้าหมู่บ้าน</button>` : `<button id="wmCamp">⛺ พักแรม</button><button id="wmHome" class="ghost">🏠 กลับหมู่บ้าน</button>`}${landHere() ? `<button id="wmLand" class="ghost">🏡 ที่ดิน${Estates.at(S, landHere()).length ? ' (' + Estates.at(S, landHere()).length + ')' : ''}</button>` : ''}<button id="wmPotion" class="ghost" ${S.potions && S.hp < S.maxHp ? '' : 'disabled'}>🧪 ดื่มยา</button>${eventCards().length ? `<button id="wmCards" class="ghost">🎴 การ์ดเหตุการณ์ (${eventCards().reduce((a, x) => a + x.n, 0)})</button>` : ''}</div>
      <div id="wmLog">${S.log.slice(0, 8).map(x => '<div>' + esc(x) + '</div>').join('')}</div>
      <div style="margin-top:6px;font-size:11px;color:#9a8a6a">คลิกช่องติดกัน = เดิน 1 ช่อง · คลิกช่องที่เคยเห็น = เดินไปเอง · ลากเพื่อเลื่อน · ล้อเมาส์ซูม <a href="?new=1" style="color:#c9a86a">โลกใหม่</a></div>`;
    const on = (id, fn) => { const b = hud.querySelector('#' + id); if (b) b.onclick = fn };
    on('wmCards', useEventCard); on('wmQuest', questBoard); on('wmVillage', () => { save(); syncClock(); location.href = 'village-town.html' }); on('wmCamp', () => camp(false)); on('wmHome', goHome); on('wmLand', () => landPanel(landHere(), atHome() ? 'หมู่บ้านเฟิร์นเวล' : 'ที่ดินกลางป่า'));
    on('wmPotion', () => { if (!S.potions) return; S.potions--; const b = S.hp; S.hp = Math.min(S.maxHp, S.hp + 25); log('ดื่มยาฟื้นฟู +' + (S.hp - b) + ' HP'); save(); hudSync() });
    hud.querySelectorAll('button').forEach(b => b.disabled = b.disabled || busy);
  }
  const atHome = () => S.pos.c === world.home.c && S.pos.r === world.home.r;
  /* v97.49 · T4: land you can hold here — Fernvale (rented), or open passable land with no place on it (claimed free) */
  const landHere = () => { if (!window.Estates) return null; if (atHome()) return 'town:fernvale'; const t = tile(S.pos.c, S.pos.r); if (t.poi || !G.BIOME[t.biome]?.pass) return null; return 'tile:' + S.pos.c + ',' + S.pos.r };
  async function landPanel(where, label) {
    if (!where || busy) return; busy = true; hudSync();
    try { for (const m of Estates.tickAll(S)) log(m); const r = await Estates.panel(S, where, label, () => { save(); hudSync() });
      if (r === 'sleep') { const to = S.hour < 8 ? 8 - S.hour : 32 - S.hour; passTime(to); S.hp = S.maxHp; S.fatigue = 0; healParty(1); log('🛏 นอนพักที่บ้านของตัวเอง ตื่นเช้าวันใหม่'); toast('🛏 พักเต็มอิ่ม · HP เต็ม') } }
    finally { busy = false; save(); hudSync() }
  }
  /* T5: raiders at your own plot out in the wild when you arrive — fight to hold it (a defend battle) */
  async function plotRaid() {
    if (!window.Estates) return false; const where = 'tile:' + S.pos.c + ',' + S.pos.r, p = Estates.at(S, where).find(x => x.kind); if (!p || !Estates.raidNow(S, p)) return false;
    const here = tile(S.pos.c, S.pos.r), v = await modal(`<h2>⚠ ที่ดินของคุณถูกบุก!</h2><p>${esc(Estates.KINDS[p.kind].name)}ที่นี่มีผู้บุกรุกอยู่ ถ้าไม่สู้ จะเสียของที่เก็บไว้และอาคารเสียหาย</p>`, [{ label: '⚔ ป้องกันที่ดิน', value: 'fight' }, { label: 'ปล่อยไป', value: null, ghost: true }]);
    if (v !== 'fight') { p.gold = 0; p.food = 0; p.hp = Math.max(0, p.hp - 35); if (!p.hp) { p.kind = null; p.hp = 100; log('💥 อาคารบนที่ดินพังเสียหาย') } else log('⚠ ผู้บุกรุกขนของไป · สภาพ ' + p.hp + '%'); save(); hudSync(); return true }
    const r = await battle(pickFoe(here), G.danger(world, here), { camp: true, ambush: true });
    if (r === 'win') { window.Factions?.add('village', 1, 'ป้องกันที่ดินของตัวเอง'); log('🛡 ไล่ผู้บุกรุกออกจากที่ดินได้') } else { p.gold = 0; p.food = 0; p.hp = Math.max(0, p.hp - 35); if (!p.hp) { p.kind = null; p.hp = 100 } }
    save(); hudSync(); return true;
  }
  function tip(e, h) {
    if (!h || modalOpen || drag?.moved) { tipEl.style.display = 'none'; return }
    const k = K(h.c, h.r), t = tile(h.c, h.r), known = isKnown(k), adj = G.dist(S.pos, h) === 1;
    let txt = known || adj ? G.BIOME[t.biome].name + (t.road ? ' · ถนน' : '') + (t.river ? ' · แม่น้ำ' : '') : 'หมอกดำ — ไม่รู้ว่ามีอะไร';
    const sc = G.stepCost(t); if ((known || adj) && sc < Infinity) txt += ' · ' + sc + ' ชม.'; else if (known && sc === Infinity) txt += ' · ผ่านไม่ได้';
    if (known && t.enc && !S.cleared[k] && t.enc.type !== 'trap' && t.enc.type !== 'battle' && !(t.enc.hidden && !visible.has(k))) txt += ' · ' + ({ battle: '⚔ ศัตรู', chest: '🎁 หีบ', camp: '⛺ จุดพัก', shrine: '✦ ศาลเจ้า', merchant: '💰 พ่อค้า', oldmap: '📜 แผนที่เก่า' }[t.enc.type] || '');
    if (known && t.enc?.landmark && !S.cleared[k]) txt = t.enc.name + ' · ' + txt;
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
  const TOWN_TEXT = new Proxy({
    brookmere: 'หมู่บ้านเกษตรเล็ก ๆ ริมลำธาร ทุ่งดอกไม้ล้อมรอบ ผู้คนรู้จักเฟิร์นเวลดี',
    haven: 'เมืองท่าเสียงดัง กลิ่นปลาเค็มและเกลือทะเล เรือสินค้าจอดเรียงเต็มท่า',
    northgate: 'ด่านหินบนช่องเขา ทหารเฝ้าทางขึ้นเหนือ นักเดินทางแวะพักก่อนข้ามเขา'
  }, { get: (o, k) => o[k] || window.Settlements?.SETTLEMENTS?.[k]?.text || '' });   /* v97.72 · the new towns describe themselves in js/settlements.js */
  function townsfolk(id) {
    const L = window.VillageLife; if (!L) return [];
    const day = S.day, hour = S.hour, finnTown = ['brookmere', 'haven', 'northgate'][day % 3];
    return Object.values(L.P).filter(p => (p.from === id || (p.from === 'wander' && finnTown === id)) && !L.inParty(S, p.id) && !L.present(p, day, hour));
  }
  async function townVisit(poi) {
    const id = poi.town;
    /* v97.72 · the capital's gate stays shut until the prologue is over */
    if (window.TownServices && window.Settlements?.SETTLEMENTS?.[id]?.capital && !TownServices.capitalOpen()) { await modal(`<h2>🏰 ${esc(poi.name)}</h2><p>${esc(TOWN_TEXT[id])}</p><p>ทหารหน้าประตูเมืองยกหอกกั้น: "ช่วงนี้นครหลวงปิดรับคนนอก กลับไปก่อนเถอะ"</p><p style="font-size:12px;opacity:.75">เส้นทางไปเมืองใหญ่จะเปิดหลังจบบทนำ</p>`); return }
    ev('town:visit', { town: id, townName: poi.name }); log('ถึง ' + poi.name); S.townVisits = (S.townVisits || 0) + 1;   /* v97.55 · T7 duty counter */
    if (window.TownEvents) for (const m of TownEvents.arrive(S, id)) { log(m); toast(m) }   /* v97.68 · T8 events: the toll is paid at the gate */
    for (;;) {
      const folk = townsfolk(id), per = window.WorldState?.period(S.hour) || 'day';
      const people = folk.length ? folk.map(p => { const ls = p.lines?.[per] || p.lines?.day || p.lines?.evening || ['…']; return `<p>👤 <b>${esc(p.name)}</b> <small>${esc(p.role)}</small><br>“${esc(String(ls[Math.floor(Math.random() * ls.length)]).replace(/\{name\}/g, window.WorldState?.heroName() || ''))}”</p>` }).join('') : '<p style="opacity:.7">ไม่เจอคนรู้จักที่นี่ตอนนี้</p>';
      /* v97.43 · T1: prices by what the town makes and lacks, and by your standing with whoever rules it (js/settlements.js) */
      /* v97.52 · T3: wanted here → the gate guards stop you first */
      if (window.Law && Law.file(S, id).wanted) { const a = await Law.arrest(S, id, 'ยามที่ประตู' + poi.name + 'จำหน้าคุณได้ — คุณถูกหมายจับที่นี่'); if (a === 'jail') { const to = S.hour < 8 ? 8 - S.hour : 32 - S.hour; passTime(to) } save(); hudSync(); if (a === 'run') { log('🏃 หนีออกจาก' + poi.name); break } }
      const ST = window.Settlements, pInn = ST ? ST.price(id, 'inn', 12) : 12, pFood = ST ? ST.price(id, 'food', 10) : 10, pPot = ST ? ST.price(id, 'potion', 18) : 18;
      const tev = window.TownEvents?.card(S, id);
      const locals = (ST?.LOCALS?.[id] || []).map(([n, role, ls]) => `<p>👤 <b>${esc(n)}</b> <small>${esc(role)}</small><br>“${esc(String(ls[Math.floor(Math.random() * ls.length)]).replace(/\{name\}/g, window.WorldState?.heroName() || ''))}”</p>`).join('');
      let v = await modal(`<h2>${ST?.SETTLEMENTS?.[id]?.capital ? '🏰' : '🏘'} ${esc(poi.name)}</h2><p>${esc(TOWN_TEXT[id] || '')}</p>${ST ? ST.card(id) : ''}${tev ? tev.html : ''}${locals ? '<h3 style="margin:8px 0 2px;font-size:14px">ผู้คนที่นี่</h3>' + locals : ''}${folk.length || !locals ? '<h3 style="margin:8px 0 2px;font-size:14px">คนรู้จักจากเฟิร์นเวล</h3>' + people : ''}<p style="font-size:12px;opacity:.75">💰 ${S.gold} · 🍞 ${S.food} · 🧪 ${S.potions} · HP ${S.hp}/${S.maxHp}</p>`,
        [...(tev?.button ? [tev.button] : []), ...(window.TownServices ? TownServices.list(S, id).map(o => ({ label: o.label + (o.disabled && o.title ? ' (' + o.title + ')' : ''), value: 'svc:' + o.key, disabled: o.disabled })) : []), { label: '🛏 พักโรงเตี๊ยม · ' + pInn + ' 💰', value: 'inn', disabled: S.gold < pInn }, { label: 'เสบียง 4 ห่อ · ' + pFood + ' 💰', value: 'food', disabled: S.gold < pFood }, { label: 'ยาฟื้นฟู · ' + pPot + ' 💰', value: 'pot', disabled: S.gold < pPot }, ...(ST ? [{ label: '🛒 ซื้อขายสินค้า', value: 'trade' }] : []), ...(window.Estates || ST || window.Offices ? [{ label: '🏛 ศาลากลาง', value: 'hall' }] : []), { label: '📜 ฟังข่าวลือ', value: 'rumor' }, { label: 'ออกเดินทางต่อ', value: null, ghost: true }]);
      /* v97.76 · land, petitions and offices sit behind the town hall so the card keeps to the everyday things */
      if (v === 'hall') v = await modal(`<h2>🏛 ศาลากลาง · ${esc(poi.name)}</h2><p>${esc(ST?.SETTLEMENTS?.[id]?.leader || '')}</p>`, [...(window.Estates ? [{ label: '🏡 ที่ดิน', value: 'land' }] : []), ...(ST ? [{ label: '📜 ยื่นคำร้องนโยบาย', value: 'petition' }] : []), ...(window.Offices && (Object.values(Offices.OFFICES).some(O => O.town === id) || S.office) ? [{ label: '🏛 รับราชการ', value: 'office' }] : []), { label: 'กลับ', value: 'back', ghost: true }]);
      if (v === 'back') continue;
      if (v === 'inn') { S.gold -= pInn; const to = S.hour < 8 ? 8 - S.hour : 32 - S.hour; passTime(to); S.hp = S.maxHp; S.fatigue = 0; healParty(1); log('พักที่ ' + poi.name + ' ตื่นเช้าวันใหม่'); toast('🛏 พักเต็มอิ่ม · HP เต็ม') }
      else if (v === 'food') { S.gold -= pFood; S.food += 4; log('ซื้อเสบียง 4 ที่ ' + poi.name) }
      else if (v === 'petition') { const pol = await ST.petitionPanel(id); if (pol) { log('📜 ' + poi.name + ' เปลี่ยนนโยบายเป็น ' + ST.POLICIES[pol].name); toast('📜 นโยบายใหม่: ' + ST.POLICIES[pol].name) } }
      else if (typeof v === 'string' && v.startsWith('svc:')) {   /* v97.72 · the town's own service (js/town-services.js) */
        const r = TownServices.run(S, id, v.slice(4), { passTime, healParty, game: () => window.WorldState.game(), reveal: n => { for (const [a, b] of G.within(S.pos.c, S.pos.r, n)) S.known[K(a, b)] = 1; fogDirty = true; reveal() } });
        if (r.panel === 'bounty' && window.Bounties) { await Bounties.panel(S, id, () => { save(); hudSync() }); Bounties.place(S, world, G); fogDirty = true; save(); hudSync() }
        for (const m of r.lines) log(m); save(); hudSync(); if (r.lines.length) await modal('<h2>' + esc(poi.name) + '</h2>' + r.lines.map(m => '<p>' + esc(m) + '</p>').join(''));
        if (r.goto) { const tw = world.towns.find(x => x.id === r.goto); if (tw) { S.pos = { c: tw.c, r: tw.r }; S.known[K(tw.c, tw.r)] = 1; fogDirty = true; reveal(); save(); hudSync(); { const p = center(tw.c, tw.r); token.x = p.x; token.y = p.y; follow() } await townVisit(tile(tw.c, tw.r).poi); return } }
      }
      else if (v === 'event') { const here = tile(S.pos.c, S.pos.r), lines = await TownEvents.act(S, id, { job: window.Progression?.jobsOf(window.WorldState.game()).job, passTime, battle: () => battle(pickFoe(here), Math.max(.2, G.danger(world, here)), {}) }); for (const m of lines) log(m); if (lines.length) await modal('<h2>' + TownEvents.EVENTS[TownEvents.today(id)?.id]?.icon + ' ' + esc(poi.name) + '</h2>' + lines.map(m => '<p>' + esc(m) + '</p>').join('')) }
      else if (v === 'office') { await Offices.panel(S, () => { save(); hudSync() }, id) }   /* v97.68 · T7 offices in other towns */
      else if (v === 'trade') { await ST.tradePanel(id, S, () => { save(); hudSync() }) }
      else if (v === 'land') { for (const m of Estates.tickAll(S)) log(m); const r = await Estates.panel(S, 'town:' + id, poi.name, () => { save(); hudSync() }); if (r === 'sleep') { const to = S.hour < 8 ? 8 - S.hour : 32 - S.hour; passTime(to); S.hp = S.maxHp; S.fatigue = 0; healParty(1); log('🛏 นอนพักที่บ้านของตัวเองใน ' + poi.name); toast('🛏 พักเต็มอิ่ม · HP เต็ม') } }
      else if (v === 'pot') { S.gold -= pPot; S.potions++; log('ซื้อยาฟื้นฟูที่ ' + poi.name) }
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
  const BOSS_NAME = { frostQueen: 'ราชินีน้ำแข็งแห่งศาลหิมะ', wolf: 'จ่าฝูงหมาป่า', golem: 'โกเล็มหิน', slime: 'สไลม์ยักษ์', bandit: 'หัวหน้าโจร', kobold: 'หัวหน้าโคโบลด์' };
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
    S.fatigue = Math.min(100, S.fatigue + Math.round(cost * 3 * (wasNight ? 1.5 : 1) * (VP('road') ? .8 : 1)));   /* v97.35 · R3 projects */
    /* v95.26 · the heights are cold: walking there tires you faster and eats more */
    if (world.real && (t.biome === 'snow' || t.biome === 'highland')) { const cold = t.biome === 'snow' ? 1 : .5; S.fatigue = Math.min(100, S.fatigue + Math.round(cost * 3 * cold)); S.trek = (S.trek || 0) + cost * cold; if (S.coldDay !== S.day) { S.coldDay = S.day; log('ลมหนาวบนที่สูง เหนื่อยเร็วและหิวไว'); toast('❄ หนาวจัด: เหนื่อยเร็วขึ้น กินเสบียงมากขึ้น') } }
    /* v95.23: on the real map a hex is ~12 km — a ration lasts 12 hours of walking, not one hex */
    let eat = !t.road && !t.poi; if (world.real) { S.trek = (S.trek || 0) + cost; eat = S.trek >= 12; if (eat) S.trek -= 12 }
    if (eat) { if (S.food > 0) S.food--; else { S.hp = Math.max(1, S.hp - 5); log('เสบียงหมด! หิวโหย −5 HP'); toast('เสบียงหมด −5 HP') } }
    if (S.fatigue >= 80) { S.hp = Math.max(1, S.hp - 2); if (S.fatigue >= 100 || Math.random() < .3) toast('เหนื่อยล้า! ควรพักแรม (−2 HP ต่อช่อง)') }
    reveal(); hudSync(); save();
    const d = destOf();
    if (d && !S.done[d.id] && d.c === to.c && d.r === to.r) { await bossFight(d); return true }
    if (t.poi?.id === 'home') { await arriveHome(); return true }
    if (t.poi?.town) { await townVisit(t.poi); return true }
    if (await plotRaid()) return true;   /* v97.49 · T5 */
    { const b = window.Bounties?.at(S, to.c, to.r); if (b) {   /* v97.73 · T3: the wanted one is here */
      const v = await modal(`<h2>☠ ${esc(b.name)}</h2><p>${esc(b.text)}</p><p>ค่าหัว ${b.reward} 💰 · HP ตอนนี้ ${S.hp}/${S.maxHp}</p>`, [{ label: '⚔ ลงมือ', value: 'go' }, { label: 'ถอยไปก่อน', value: null, ghost: true }]);
      if (v === 'go') { const r = await battle(b.foe, Math.min(1, G.danger(world, t) + .15 * b.tier), b.tier >= 3 ? { boss: true } : {}); if (r === 'win') { const m = Bounties.slain(S, b); log(m); toast(m); save(); hudSync() } }
      return true } }
    if (t.enc && !S.cleared[k]) return await encounter(t, k);
    const night = nightness() > .6, dang = G.danger(world, t);
    /* v95.16 · no battle marks on the map: every step has a chance of an ambush (more in wild/dangerous land and at night, less on a road) */
    S.calm = Math.max(0, (S.calm || 0) - 1);
    const odds = Math.min(.42, (.05 + dang * .24) * (t.road ? .45 : 1) * (night ? 1.6 : 1) * (VP('watch') ? .75 : 1) * cargoRisk() * (window.Offices && G.dist(S.pos, world.home) <= 4 ? 1 - .2 * Offices.perk(S, 'watch') : 1) * (1 - .08 * (window.Offices?.perk(S, 'garrison') || 0)));
    if (!S.calm && !t.poi && Math.random() < odds) { S.calm = 3; log(night ? 'ถูกซุ่มโจมตีกลางดึก!' : 'ถูกซุ่มโจมตี!'); return await battle(pickFoe(t), dang, { ambush: true }) }
    if (night && Math.random() < .07) return await nightEvent(t);
    chatter('walk', .35);
    return false;
  }
  /* things that only happen after dark */
  async function nightEvent(t) {
    const d = destOf(), r = Math.random();
    if (r < .4 && d && !S.done[d.id]) { const p = G.path(world, t, d); if (p) p.slice(0, 5).forEach(x => S.known[K(x.c, x.r)] = 1); fogDirty = true; log('ดวงไฟวิญญาณนำทาง'); ev('night:wisp', { biome: t.biome }); await modal(`<h2>✧ ดวงไฟวิญญาณ</h2><p>แสงสีฟ้าลอยวนอยู่กลางความมืด แล้วค่อย ๆ ล่องไปทางหนึ่ง… หมอกตามทางนั้นจางลงชั่วครู่</p>`); return true }
    if (r < .75) { S.fatigue = Math.min(100, S.fatigue + 15); log('เสียงหอนทั้งคืน เหนื่อยขึ้น'); await modal(`<h2>🐺 เสียงหอนในความมืด</h2><p>เสียงหอนรอบทิศทำให้ต้องเดินระวังตัวทุกฝีก้าว ความเหนื่อย +15</p>`); return true }
    const gold = Math.round(20 + Math.random() * 30); S.gold += gold; log('พบของมีค่าใต้แสงจันทร์ +' + gold); await modal(`<h2>🌙 ประกายใต้แสงจันทร์</h2><p>มีบางอย่างสะท้อนแสงจันทร์อยู่ในพงหญ้า — ถุงเหรียญของนักเดินทาง <b>+${gold} 💰</b></p>`); return true;
  }
  function passTime(h) { S.hour += h; let nd = false; while (S.hour >= 24) { S.hour -= 24; S.day++; nd = true; log('— วันที่ ' + S.day + ' —') } if (nd && window.Estates) for (const m of Estates.tickAll(S)) { log(m); toast(m) } if (nd && window.Offices) for (const m of Offices.settle(S)) { log(m); toast(m) } if (nd && window.Settlements?.councilSettle) for (const m of Settlements.councilSettle()) { log(m); toast(m) } if (nd && window.Bounties) for (const m of Bounties.expire(S)) { log(m); toast(m) } }
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
    if (t.enc.landmark) return await landmark(t, k);
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
  /* ---------- v95.26 · landmarks on the way ---------- */
  async function landmark(t, k) {
    const e = t.enc, dang = G.danger(world, t); S.lmk = S.lmk || {};
    if (e.type === 'hamlet') {
      for (;;) {
        const v = await modal(`<h2>🏘 ${esc(e.name)}</h2><p>หมู่บ้านเล็ก ๆ ไม่กี่หลังคาเรือน ควันไฟลอยจากปล่อง ชาวบ้านมองนักเดินทางอย่างสงสัยแต่ไม่ไม่เป็นมิตร</p><p>มี ${S.gold} 💰 · เสบียง ${S.food} · HP ${S.hp}/${S.maxHp}</p>`,
          [{ label: 'พักค้างคืน · 8 💰', value: 'rest', disabled: S.gold < 8 }, { label: 'ซื้อเสบียง 2 ห่อ · 14 💰', value: 'food', disabled: S.gold < 14 }, { label: 'ฟังข่าวรอบ ๆ', value: 'news', disabled: S.lmk[k] === S.day }, { label: 'ไปต่อ', value: null, ghost: true }]);
        if (v === 'rest') { S.gold -= 8; passTime(S.hour < 8 ? 8 - S.hour : 32 - S.hour); S.hp = S.maxHp; S.fatigue = 0; healParty(1); log('พักที่ ' + e.name); toast('🛏 พักที่ ' + e.name + ' · ฟื้นเต็ม'); ev('rest:inn', { place: e.name }) }
        else if (v === 'food') { S.gold -= 14; S.food += 2; log('ซื้อเสบียงที่ ' + e.name) }
        else if (v === 'news') { S.lmk[k] = S.day; revealArea(t.c, t.r, 5); const lead = newLead('ชาวบ้านที่ ' + e.name); log('ฟังข่าวที่ ' + e.name); await modal(`<h2>🗨 ข่าวจาก${esc(e.name)}</h2><p>${lead ? 'ชาวบ้านเล่าถึง <b>' + esc(lead.name) + '</b> — “' + esc(lead.rumor) + '”' : 'ชาวบ้านชี้ทางรอบ ๆ ให้ ทางแถบนี้ไม่มีอะไรน่ากลัวเป็นพิเศษ'}</p>`) }
        else break; hudSync(); save();
      }
    } else if (e.type === 'outpost') {
      const v = await modal(`<h2>🚩 ${esc(e.name)}</h2><p>ด่านไม้ล้อมรั้ว ทหารสองสามคนผลัดกันเฝ้าทาง ที่นี่ปลอดภัยพอให้ได้นั่งพักใต้หลังคา</p>`,
        [{ label: 'ถามข่าวจากทหาร', value: 'news', disabled: S.lmk[k] === S.day }, { label: 'พักใต้หลังคา 4 ชม.', value: 'rest' }, { label: 'ไปต่อ', value: null, ghost: true }]);
      if (v === 'news') { S.lmk[k] = S.day; const lead = newLead('ทหารที่ ' + e.name); for (const d of world.dests) if (S.leads?.[d.id]) { const p = G.path(world, t, d); if (p) p.slice(0, 10).forEach(x => S.known[K(x.c, x.r)] = 1) } fogDirty = true; await modal(`<h2>🗨 ทหารที่${esc(e.name)}</h2><p>${lead ? 'มีข่าวลือเรื่อง <b>' + esc(lead.name) + '</b> — “' + esc(lead.rumor) + '”' : 'ทหารชี้ทางช่วงแรกไปยังที่ที่เจ้ากำลังตามหาให้'}</p>`) }
      else if (v === 'rest') { passTime(4); S.fatigue = Math.round(S.fatigue / 2); S.hp = Math.min(S.maxHp, S.hp + Math.round(S.maxHp * .15)); log('พักที่ ' + e.name) }
    } else if (e.type === 'tower') {
      if (S.lmk[k]) { toast('เคยขึ้นไปดูแล้ว'); return false }
      const v = await modal(`<h2>🗼 ${esc(e.name)}</h2><p>บันไดหินผุ ๆ วนขึ้นไปถึงยอด ถ้าปีนขึ้นไปจะมองเห็นไปได้ไกล (ใช้เวลา 1 ชม.)</p>`, [{ label: 'ปีนขึ้นไปดู', value: 'go' }, { label: 'ไปต่อ', value: null, ghost: true }]);
      if (v === 'go') { S.lmk[k] = 1; passTime(1); revealArea(t.c, t.r, 7); log('มองจาก ' + e.name); toast('🗼 เห็นไกลรอบทิศ') }
    } else if (e.type === 'shrine') {
      const v = await modal(`<h2>✦ ${esc(e.name)}</h2><p>แท่นหินเล็ก ๆ ริมทาง มีเทียนไขที่ใครสักคนจุดทิ้งไว้</p>`, [{ label: 'จุดเทียนอธิษฐาน', value: 'pray', disabled: S.lmk[k] === S.day }, { label: 'ไปต่อ', value: null, ghost: true }]);
      if (v === 'pray') { S.lmk[k] = S.day; S.hp = Math.min(S.maxHp, S.hp + Math.round(S.maxHp * .3)); S.fatigue = Math.max(0, S.fatigue - 20); revealArea(t.c, t.r, 3); log('อธิษฐานที่ศาลริมทาง'); toast('✦ HP +30% · หายเหนื่อยบ้าง') }
    } else if (e.type === 'ruins') {
      const v = await modal(`<h2>🏛 ${esc(e.name)}</h2><p>ซากหินที่ถูกเถาวัลย์กลืน ดูเหมือนข้างในยังมีทางเดินลึกเข้าไป อาจมีของมีค่า… หรือมีอะไรอาศัยอยู่</p>`, [{ label: 'เข้าไปสำรวจ', value: 'go' }, { label: 'ไปต่อ', value: null, ghost: true }]);
      if (v === 'go') {
        const r = await areaExplore({ title: e.name, sub: 'สำรวจซากปรักหักพัง · หาห้องสมบัติให้เจอ', biome: t.biome, seed: world.seed ^ (t.c * 977 + t.r * 131), dang, foes: G.FOES[t.biome] || G.FOES.grass, prize: { gold: Math.round(40 + dang * 120), potion: 1 } });
        if (r === 'done') { S.cleared[k] = true; ev('ruins:explored', { place: e.name, biome: t.biome }) }
      }
    }
    hudSync(); save(); return true;
  }
  /* a destination the party has not heard of yet becomes a lead (outposts, hamlets) */
  function newLead(src) {
    const d = world.dests.filter(x => !S.leads?.[x.id] && !S.done[x.id]).sort((a, b) => G.dist(S.pos, a) - G.dist(S.pos, b))[0]; if (!d) return null;
    try { WS.addLead(d.id, src, false) } catch (e) { } S.leads = S.leads || {}; S.leads[d.id] = { src }; log('ได้ยินเรื่อง ' + d.name); return d;
  }

  /* ---------- v95.26 · area maps: a closer look at one hex (destinations, ruins) ----------
     A small hex field (13 × 9) drawn from the hex's land: the way in on the left, the lair / treasure room on the far right, a few things on
     the way (foes, a chest, an old tablet, a spring) under a short fog. Each step is 15 minutes. Resolves 'win' (boss beaten), 'done' (prize
     taken) or 'left'. */
  function areaExplore(o) {
    return new Promise(resolve => {
      const rnd = G.rng((o.seed >>> 0) || 7), AW = 13, AH = 9, RAD = 30, AHW = Math.sqrt(3) * RAD, AVS = 1.5 * RAD, KK = (c, r) => c + ',' + r;
      const NBR = [[[1, 0], [-1, 0], [0, -1], [-1, -1], [0, 1], [-1, 1]], [[1, 0], [-1, 0], [1, -1], [0, -1], [1, 1], [0, 1]]];
      const nb = (c, r) => NBR[r & 1].map(([a, b]) => [c + a, r + b]).filter(([a, b]) => a >= 0 && b >= 0 && a < AW && b < AH);
      const cells = {}; for (let r = 0; r < AH; r++) for (let c = 0; c < AW; c++) cells[KK(c, r)] = { c, r, block: rnd() < .22, seed: rnd() };
      const entry = { c: 0, r: 4 }, lair = { c: AW - 1, r: 4 };
      /* carve a winding way in */
      { let c = 0, r = 4; while (c < AW - 1) { cells[KK(c, r)].block = false; if (rnd() < .65) c++; else r = Math.max(1, Math.min(AH - 2, r + (rnd() < .5 ? -1 : 1))) } cells[KK(lair.c, lair.r)].block = false; for (const [a, b] of nb(lair.c, lair.r)) cells[KK(a, b)].block = false }
      const reach = new Set([KK(0, 4)]), q = [[0, 4]]; while (q.length) { const [c, r] = q.pop(); for (const [a, b] of nb(c, r)) { const x = cells[KK(a, b)]; if (!x.block && !reach.has(KK(a, b))) { reach.add(KK(a, b)); q.push([a, b]) } } }
      for (const k in cells) if (!reach.has(k)) cells[k].block = true;
      const free = [...reach].map(k => cells[k]).filter(x => x.c >= 2 && x.c <= AW - 3);
      for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1));[free[i], free[j]] = [free[j], free[i]] }
      const spots = {}, kinds = ['foe', 'foe', 'chest', rnd() < .5 ? 'lore' : 'spring'];
      for (const x of free) { if (!kinds.length) break; if (Object.values(spots).some(s => Math.abs(s.c - x.c) + Math.abs(s.r - x.r) < 3)) continue; const kind = kinds.shift(); spots[KK(x.c, x.r)] = { c: x.c, r: x.r, kind, foe: kind === 'foe' ? o.foes[Math.floor(rnd() * o.foes.length)] : null } }
      spots[KK(lair.c, lair.r)] = { c: lair.c, r: lair.r, kind: o.boss ? 'lair' : 'prize' };
      const seen = new Set(), look = (c, r) => { for (const k in cells) { const x = cells[k]; if (Math.abs(x.c - c) + Math.abs(x.r - r) <= 3) seen.add(k) } };
      let pos = { ...entry }, prev = null, walking = false, done = false; look(0, 4);
      const pal = PAL[o.biome] || PAL.grass;
      const box = document.createElement('div'); box.className = 'wm-area';
      box.innerHTML = `<canvas></canvas><header><b>${esc(o.title)}</b><small>${esc(o.sub || '')}</small><span class="st"></span><button type="button" class="ghost">↩ ออกจากพื้นที่</button></header>`;
      document.body.append(box); busy = true;
      const cvA = box.querySelector('canvas'), gA = cvA.getContext('2d'), st = box.querySelector('.st');
      let sc = 1, ox = 0, oy = 0;
      const fit = () => { const w = innerWidth, h = innerHeight, d = devicePixelRatio || 1; cvA.width = w * d; cvA.height = h * d; cvA.style.width = w + 'px'; cvA.style.height = h + 'px'; sc = Math.min(w / (AHW * (AW + .5) + 60), (h - 90) / (AVS * (AH - 1) + 2 * RAD + 40)); ox = (w - AHW * (AW + .5) * sc) / 2 + AHW * .5 * sc; oy = 70 + (h - 70 - (AVS * (AH - 1) + 2 * RAD) * sc) / 2 + RAD * sc };
      fit(); addEventListener('resize', fit);
      const ctr = (c, r) => ({ x: ox + (c + .5 * (r & 1)) * AHW * sc, y: oy + r * AVS * sc });
      const ICON = { foe: '⚔', chest: '🎁', lore: '🪨', spring: '💧', lair: '☠', prize: '💎' };
      const status = () => st.textContent = `${S.hp}/${S.maxHp} HP · ${String(Math.floor(S.hour)).padStart(2, '0')}:${String(Math.round((S.hour % 1) * 60)).padStart(2, '0')}`;
      function frame(now) {
        if (done) return; const d = devicePixelRatio || 1; gA.setTransform(d, 0, 0, d, 0, 0);
        const bg = gA.createLinearGradient(0, 0, 0, innerHeight); bg.addColorStop(0, '#1a1e24'); bg.addColorStop(1, '#07080c'); gA.fillStyle = bg; gA.fillRect(0, 0, innerWidth, innerHeight);
        for (let r = 0; r < AH; r++) for (let c = 0; c < AW; c++) {
          const x = cells[KK(c, r)], p = ctr(c, r); gA.save(); gA.translate(p.x, p.y); gA.scale(sc, sc);
          hexPath(gA, 0, 0, RAD + .6); gA.fillStyle = pal[(c + r) % 3]; gA.fill(); gA.strokeStyle = 'rgba(0,0,0,.18)'; gA.lineWidth = 1; gA.stroke();
          const R2 = G.rng(((c * 97 + r * 31) ^ (o.seed >>> 0)) >>> 0);
          if (x.block) { if (['forest', 'grass', 'swamp'].includes(o.biome)) { tree(gA, -8, 8, 16, R2); tree(gA, 9, 12, 14, R2) } else if (o.biome === 'snow') { mountain(gA, 0, 14, 30, true) } else { mountain(gA, 0, 14, 28, false) } }
          else if (o.biome === 'swamp' && x.seed < .3) reed(gA, 0, 6, R2);
          gA.restore();
          if (!seen.has(KK(c, r))) { gA.save(); gA.translate(p.x, p.y); gA.scale(sc, sc); hexPath(gA, 0, 0, RAD + 1); gA.fillStyle = 'rgba(5,6,10,.88)'; gA.fill(); gA.restore() }
        }
        for (const k in spots) { if (!seen.has(k)) continue; const s = spots[k], p = ctr(s.c, s.r), bob = Math.sin(now * .004 + s.c) * 3 * sc; gA.save(); gA.fillStyle = s.kind === 'foe' || s.kind === 'lair' ? 'rgba(150,30,25,.85)' : 'rgba(25,30,40,.75)'; gA.beginPath(); gA.arc(p.x, p.y - 8 * sc + bob, 15 * sc, 0, 7); gA.fill(); gA.font = `${18 * sc}px system-ui,"Segoe UI Emoji","Apple Color Emoji",sans-serif`; gA.textAlign = 'center'; gA.textBaseline = 'middle'; gA.fillText(ICON[s.kind], p.x, p.y - 7 * sc + bob); gA.restore() }
        const pe = ctr(entry.c, entry.r); gA.save(); gA.font = `700 ${12 * sc}px VillageThai,system-ui`; gA.fillStyle = '#e8d8a8'; gA.textAlign = 'center'; gA.fillText('ทางเข้า', pe.x, pe.y + 26 * sc); gA.restore();
        const pp = ctr(pos.c, pos.r), im = heroImgs[Math.floor(now / 160) % 4]; if (im.complete && im.naturalWidth) { const h = 70 * sc, w = h * im.naturalWidth / im.naturalHeight; gA.drawImage(im, pp.x - w / 2, pp.y - h + 10 * sc, w, h) } else { gA.fillStyle = '#ffd36a'; gA.beginPath(); gA.arc(pp.x, pp.y - 10, 8, 0, 7); gA.fill() }
        requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame); status();
      const finish = v => { done = true; removeEventListener('resize', fit); box.remove(); busy = false; hudSync(); save(); resolve(v) };
      box.querySelector('header button').onclick = () => { if (!walking && !modalOpen) finish('left') };
      async function arrive(s) {
        const k = KK(s.c, s.r);
        if (s.kind === 'foe') { const r = await battle(s.foe, o.dang, {}); if (r === 'win') delete spots[k]; else if (prev) pos = { ...prev } }
        else if (s.kind === 'chest') { const gold = Math.round(12 + Math.random() * 20 + o.dang * 40); S.gold += gold; delete spots[k]; log('พบหีบใน ' + o.title + ' +' + gold); await modal(`<h2>🎁 หีบเก่า</h2><p>ได้ <b>${gold} เหรียญ</b></p>`) }
        else if (s.kind === 'spring') { S.hp = Math.min(S.maxHp, S.hp + Math.round(S.maxHp * .3)); healParty(.3); delete spots[k]; await modal(`<h2>💧 ตาน้ำใส</h2><p>น้ำเย็นชื่นใจ ทีมฟื้น HP 30%</p>`) }
        else if (s.kind === 'lore') { delete spots[k]; await modal(`<h2>🪨 ศิลาจารึก</h2><p>ตัวอักษรเก่าเลือนจนอ่านไม่ออก มีเพียงรูปแสงที่แตกออกเป็นหลายสายสลักอยู่ตรงกลาง… เหมือนนิทานที่ผู้เฒ่าเคยเล่า</p>`) }
        else if (s.kind === 'prize') { const P = o.prize || {}; S.gold += P.gold || 0; S.potions += P.potion || 0; log('พบห้องสมบัติใน ' + o.title + ' +' + (P.gold || 0)); await modal(`<h2>💎 ห้องสมบัติ</h2><p>ลึกสุดของ${esc(o.title)} มี <b>${P.gold || 0} เหรียญ</b>${P.potion ? ' และยาฟื้นฟู ' + P.potion + ' ขวด' : ''}</p>`, [{ label: 'กลับออกไป', value: 1 }]); finish('done'); return }
        else if (s.kind === 'lair') { const v = await modal(`<h2>☠ ${esc(o.boss.name || o.title)}</h2><p>ลมหายใจของบางอย่างดังอยู่ข้างหน้า… HP ตอนนี้ ${S.hp}/${S.maxHp}</p>`, [{ label: '⚔ บุก', value: 'go' }, { label: 'ถอยก่อน', value: null, ghost: true }]); if (v !== 'go') { if (prev) pos = { ...prev }; return } const r = await battle(o.boss.foe, 1, { boss: true }); if (r === 'win') { finish('win'); return } if (prev) pos = { ...prev } }
        hudSync(); status();
      }
      cvA.addEventListener('click', async e => {
        if (walking || modalOpen || done) return; let best = null, bd = 1e9; for (const k in cells) { const x = cells[k], p = ctr(x.c, x.r), d = Math.hypot(p.x - e.clientX, p.y - e.clientY); if (d < bd) { bd = d; best = x } }
        if (!best || bd > RAD * sc || best.block) return;
        /* shortest way over walkable cells (unknown cells count as walkable so you can head into the fog) */
        const start = KK(pos.c, pos.r), goal = KK(best.c, best.r), from = new Map([[start, null]]), qq = [[pos.c, pos.r]];
        while (qq.length) { const [c, r] = qq.shift(); if (KK(c, r) === goal) break; for (const [a, b] of nb(c, r)) { const kk = KK(a, b); if (from.has(kk) || cells[kk].block) continue; from.set(kk, KK(c, r)); qq.push([a, b]) } }
        if (!from.has(goal)) return; const path = []; for (let k = goal; k && k !== start; k = from.get(k)) path.unshift(k);
        walking = true;
        for (const k of path) { const [c, r] = k.split(',').map(Number); prev = { ...pos }; pos = { c, r }; look(c, r); passTime(.25); status(); await wait(170); if (spots[k]) { walking = false; await arrive(spots[k]); if (done) return; break } }
        walking = false; save();
      });
    });
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
    const risk = safe ? 0 : Math.min(.45, (night ? .24 : .1) * (.5 + dang * 1.5)) * (VP('watch') ? .5 : 1);
    if (!safe) { const v = await modal(`<h2>⛺ พักแรมที่นี่?</h2><p>${night ? 'นอนจนถึงเช้า' : 'พัก 6 ชั่วโมง'} · ${fed ? 'ใช้เสบียง 1 · HP เต็ม' : 'ไม่มีเสบียง · ฟื้น HP แค่ 30%'} · ความเหนื่อยหาย</p><p>โอกาสถูกบุกค่าย <b style="color:#a0281a">${Math.round(risk * 100)}%</b>${night ? ' (กลางคืนเสี่ยงกว่า)' : ''}</p>`, [{ label: '⛺ ตั้งแคมป์', value: true }, { label: 'ยังก่อน', value: null, ghost: true }]); if (!v) return }
    busy = true; hudSync(); if (fed) S.food--;
    toast('⛺ พักแรม…'); chatter('camp'); await wait(900);
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
    /* v97.29 · the game's difficulty setting (⚙ ตั้งค่า · s.village.settings.difficulty — it only reached the old battles before) */
    const DIFF = ({ easy: { hp: .8, atk: .8, gold: .9 }, hard: { hp: 1.25, atk: 1.2, gold: 1.2 } })[(() => { try { return WS.game().village.settings?.difficulty } catch (e) { return '' } })()] || { hp: 1, atk: 1, gold: 1 };
    mult = Math.round(mult * fs.hp * DIFF.hp * 10) / 10;
    const atk = Math.round((fierce ? 1.3 : 1) * fs.atk * DIFF.atk * 100) / 100, hst = Math.max(20, Math.round(100 - S.fatigue * .6));
    chatter('fight', .6);
    await encounterFx(o.boss ? 'BOSS!' : o.ambush ? 'AMBUSH!' : fierce ? 'NIGHT TERROR!' : 'ENCOUNTER!');
    const fr = document.createElement('iframe'); fr.id = 'wmBattle';
    const title = (o.boss ? 'บอส · ' : elite ? 'ยอดฝีมือ · ' : '') + (BOSS_NAME[foe] && o.boss ? BOSS_NAME[foe] : '');
    const poi = o.boss ? (destOf()?.id || '') : '';
    /* a group: more monsters deeper in the fog, at night and in ambushes; the boss brings two of the local monsters */
    const n = o.boss ? 3 : Math.max(2, Math.min(5, 2 + Math.round(dang * 2) + (night ? 1 : 0) + (o.ambush ? 1 : 0)));   // a party of four meets 2–5 monsters
    const group = [foe + '*' + (n > 1 && !o.boss ? Math.round(mult * .85 * 10) / 10 : mult)];
    for (let i = 1; i < n; i++) { const k = o.boss ? pickFoe(here) : Math.random() < .6 ? foe : pickFoe(here); group.push(k + '*' + Math.round((1.2 + dang * .6) * (k === 'shadowWolf' ? .8 : 1) * fs.hp * DIFF.hp * 10) / 10) }
    const party = S.party.filter(p => p.hp > 0).map(p => p.key + ':' + p.hp + ':' + p.max + ':' + (p.order || 'charge') + ':' + (p.level || 1) + ':' + ((p.level || 1) >= CONTROL_LV ? 1 : 0)).join(',');   /* v97.15: Lv.3+ companions are commanded by the player */
    const fighters = S.party.filter(p => p.hp > 0), heroQ = window.Progression ? '&' + Progression.battleParam(WS.game()) : '';   /* v95.00: level, weapon, stats → card battle */
    const tut = (() => { try { const st = WS.game().village.story; const k = st?.tut; if (k) { delete st.tut; WS.commit() } return k ? '&tut=' + k : '' } catch (e) { return '' } })();   /* v97.16: the prologue's first fights coach the player */
    /* v97.22 · battle objectives: a night camp raid → hold the camp banner · an ambush → sometimes break out to the map edge
       · an elite group → bring down its leader · now and then: just hold out. The prologue and bosses always fight to the end. */
    const obj = tut || o.boss ? '' : o.camp ? 'defend:4' : o.ambush && Math.random() < .35 ? 'escape' : elite && n > 2 && Math.random() < .6 ? 'leader' : Math.random() < .15 ? 'survive:5' : '';
    const OBJ_GOLD = { defend: 1.3, escape: .8, leader: 1.25, survive: 1.2 }, OBJ_NAME = { defend: 'ป้องกันค่าย', escape: 'ฝ่าวงล้อม', leader: 'ล้มหัวหน้า', survive: 'ยื้อไว้' };
    fr.src = `battle-field.html?battle=1&embed=1${tut}${obj ? '&obj=' + obj : ''}&r=7&biome=${({ ash: 'hills', volcano: 'hills', stone: 'hills', highland: 'hills' })[here.biome] || here.biome}&poi=${poi}&night=${night ? 1 : 0}&m=${foe}&ms=${encodeURIComponent(group.join(','))}&party=${encodeURIComponent(party)}&hp=${mult}&atk=${atk}&hst=${hst}&hhp=${S.hp}&hmax=${S.maxHp}${heroQ}&title=${encodeURIComponent(title)}`;
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
    { const ST = window.Settlements; if (ST && ST.load(S) && (res.outcome === 'lose' || res.outcome === 'flee')) { const lost = ST.loseCargo(S, ST.escorted(S) ? .1 : res.outcome === 'lose' ? .5 : .25); if (lost.length) { log('📦 สินค้าหายระหว่างหนี/พ่ายแพ้: ' + lost.join(' · ')); toast('📦 สินค้าหาย ' + lost.join(' · ')) } } }   /* v97.54 · T6 */
    if (fierce && res.outcome !== 'flee') ev('night:terror', { foe, biome: here.biome });
    if (!o.boss) ev(res.outcome === 'win' ? 'battle:win' : res.outcome === 'flee' ? 'battle:flee' : 'battle:lose', { foe, biome: here.biome });
    else if (res.outcome !== 'win') ev(res.outcome === 'flee' ? 'battle:flee' : 'battle:lose', { foe, biome: here.biome, destName: destOf()?.name });
    if (res.outcome === 'win') {
      S.battles++; S.kills += res.kills || 0; const gold = o.boss ? 0 : Math.round((10 + dang * 30 + (elite ? 20 : 0)) * (night ? 1.5 : 1) * (OBJ_GOLD[obj.split(':')[0]] || 1) * DIFF.gold); S.gold += gold; S.hp = Math.max(1, S.hp);
      const loot = dropLoot(foe, here.biome, dang, o.boss);
      { const hp = window.Offices?.perk(S, 'hunter') || 0; if (hp) { S.food += hp; log('➶ พรานหลวงได้เสบียง +' + hp) } }   /* v97.57 · office perk */
      /* v94.06 F2: experience — the hero and the companions who fought */
      let jobRes = null; const P = window.Progression, ch0 = WS.game().village?.character || {}, members = [{ key: 'hero', name: WS.heroName?.() || 'ตัวเอก', lv0: ch0.level || 1, xp0: ch0.xp || 0 }, ...fighters.map(p => { const m = S.party.find(x => x.key === p.key); return m && { key: m.key, name: m.name, lv0: m.level || 1, xp0: m.xp || 0, ref: m } }).filter(Boolean)];
      if (window.Progression) {
        const xp = Math.round(Progression.battleXp({ dang, elite, boss: o.boss, kills: res.kills }) * (VP('drill') ? 1.15 : 1)), ups = Progression.gainHero(WS.game(), xp);
        { const c = WS.game().village.character; Object.assign(members[0], { gain: xp, lv1: c.level, xp1: c.xp }) }
        log('✦ EXP +' + xp + (ups.length ? ' · เลเวลอัป! Lv.' + ups[ups.length - 1] + ' (HP สูงสุด ' + S.maxHp + ')' : ''));
        if (ups.length) toast('LEVEL UP! Lv.' + ups[ups.length - 1]);
        for (const p of fighters) { const m = S.party.find(x => x.key === p.key); if (!m) continue; const u = Progression.gainAlly(m, Math.round(xp * .8)); if (u.length) log(m.name + ' เลเวลอัป Lv.' + u[u.length - 1] + ' (HP ' + m.max + ')'); const mm = members.find(x => x.ref === m); if (mm) Object.assign(mm, { gain: Math.round(xp * .8), lv1: m.level, xp1: m.xp }) }
        jobRes = Progression.gainJob ? Progression.gainJob(WS.game(), Math.round(xp * .7)) : null;   /* v97.18: job points */
        WS.commit();
      }
      chatter('win', .7);
      if (!o.boss && /bandit/.test(foe)) window.Factions?.add('village', 1, 'ปราบโจรป่า');   /* v97.41 · T2 */
      log('ชนะ' + (o.boss ? 'บอส' : '') + '! ' + (gold ? '+' + gold + ' 💰' : '') + (loot ? ' · ' + loot : ''));
      if (P) await results({ title: (obj ? '🎯 ' + OBJ_NAME[obj.split(':')[0]] + ' สำเร็จ' + (title ? ' · ' : '') : '') + title, gold, loot: loot ? loot.split(' · ') : [], kills: res.kills || 0, members: members.filter(m => m.gain != null), heroNeed: P.heroNeed, allyNeed: P.allyNeed, job: jobRes && jobRes.id !== 'adventurer' ? { ...P.JOBS[jobRes.id], lv: P.jobLevel(WS.game(), jobRes.id), jp: P.jobsOf(WS.game()).jobs[jobRes.id]?.jp || 0, need: P.jobNeed(P.jobLevel(WS.game(), jobRes.id)), ups: jobRes.ups, max: P.JOB_MAX } : null });
      else toast('VICTORY! ' + (gold ? '+' + gold + ' 💰' : '') + (loot ? ' · ' + loot : ''));
    } else if (res.outcome === 'flee') {
      log('หนีออกมาได้'); if (S.prev) { S.pos = { ...S.prev }; const p = center(S.pos.c, S.pos.r); token.x = p.x; token.y = p.y; reveal() } S.hp = Math.max(1, S.hp);
    } else {
      const lost = Math.floor(S.gold / 2); S.gold -= lost; S.hp = Math.ceil(S.maxHp / 2); healParty(.5); S.pos = { ...world.home }; const p = center(S.pos.c, S.pos.r); token.x = p.x; token.y = p.y; reveal(); follow();
      log('พ่ายแพ้… ถูกพากลับหมู่บ้าน เสีย ' + lost + ' 💰'); await modal(`<h2>💀 หมดสติ</h2><p>พรานผ่านมาเจอคุณนอนอยู่กลางทาง พากลับถึงหมู่บ้าน ข้าวของหล่นหายไป <b>${lost} เหรียญ</b></p><p>ทางที่เคยเดินยังจำได้ — ลองใหม่อีกครั้ง</p>`);
    }
    busy = false; hudSync(); save(); return res.outcome;
  }
  /* ---------- v97.09 · victory results (console style): gold and drops pop in, then each fighter's EXP bar fills, level-ups flash.
     Click / Enter / Space skips the animation, then closes. ---------- */
  const CONTROL_LV = 3;   /* v97.15 · a companion at this level fights under the player's command (B14) */
  function chime(notes, vol = .05) { try { const A = chime.a ||= new (window.AudioContext || window.webkitAudioContext)(); notes.forEach((f, i) => { const o = A.createOscillator(), g = A.createGain(), t0 = A.currentTime + i * .09; o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .02); g.gain.exponentialRampToValueAtTime(.0001, t0 + .5); o.connect(g).connect(A.destination); o.start(t0); o.stop(t0 + .55) }) } catch (e) { } }
  function results(r) {
    if (!document.getElementById('wmResCss')) { const s = document.createElement('style'); s.id = 'wmResCss'; s.textContent = `
      .wm-res{position:fixed;inset:0;z-index:80;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 40%,#1d2a1fcc,#05080de8);animation:wmResIn .35s ease both;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif}
      .wm-res .box{width:min(560px,92vw);padding:22px 24px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c;text-align:center}
      .wm-res .ttl{font:900 40px/1 Georgia,serif;letter-spacing:.12em;color:#9a5a12;text-shadow:0 2px 0 #fff8,0 0 24px #ffcf6a;animation:wmResT .6s cubic-bezier(.2,1.6,.4,1) both}
      .wm-res .sub{margin:6px 0 12px;color:#6a5030;font-size:14px}
      .wm-res .loot{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-bottom:14px}.wm-res .loot span{padding:5px 10px;border-radius:999px;background:#fff7;border:1px solid #b08a4a66;font-size:13.5px;animation:wmResPop .4s cubic-bezier(.2,1.6,.4,1) both}
      .wm-res .m{display:grid;grid-template-columns:92px 54px 1fr 74px;gap:8px;align-items:center;text-align:left;margin:7px 0;font-size:14px}.wm-res .m b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .wm-res .lv{font-weight:700;color:#5a3a10;font-variant-numeric:tabular-nums}.wm-res .lv.up{color:#c0400a;animation:wmResPop .5s cubic-bezier(.2,1.8,.4,1)}
      .wm-res .xp{height:10px;border-radius:6px;background:#00000024;overflow:hidden}.wm-res .xp i{display:block;height:100%;background:linear-gradient(90deg,#d8a030,#ffe08a);border-radius:6px;transition:width .55s ease}
      .wm-res .g{color:#7a5a20;font-size:12.5px;text-align:right;font-variant-numeric:tabular-nums}.wm-res .lvup{grid-column:1/-1;color:#c0400a;font-weight:800;font-size:13px;animation:wmResPop .5s both}
      .wm-res .go{margin-top:14px;color:#8a7050;font-size:12.5px;opacity:0;transition:opacity .4s}.wm-res .go.on{opacity:1}
      @keyframes wmResIn{from{opacity:0}}@keyframes wmResT{from{opacity:0;transform:scale(1.8)}}@keyframes wmResPop{from{opacity:0;transform:scale(.4)}}
      @media (prefers-reduced-motion:reduce){.wm-res,.wm-res *{animation:none!important;transition:none!important}}`; document.head.append(s) }
    return new Promise(res => {
      const d = document.createElement('div'); d.className = 'wm-res'; let skip = false, ready = false;
      const need = m => m.key === 'hero' ? r.heroNeed(m.lv) : r.allyNeed(m.lv);
      d.innerHTML = `<div class="box"><div class="ttl">VICTORY</div><div class="sub">${esc(r.title || 'ชนะการต่อสู้')}</div>
        <div class="loot">${[r.gold ? '💰 +' + r.gold : '', ...r.loot, r.kills ? '⚔ ล้มศัตรู ' + r.kills : ''].filter(Boolean).map((x, i) => `<span style="animation-delay:${.35 + i * .12}s">${esc(x)}</span>`).join('')}</div>
        <div class="ms">${r.members.map((m, i) => `<div class="m" data-i="${i}"><b>${esc(m.name)}</b><span class="lv">Lv.${m.lv0}</span><div class="xp"><i style="width:${Math.min(100, m.xp0 / (m.key === 'hero' ? r.heroNeed(m.lv0) : r.allyNeed(m.lv0)) * 100)}%"></i></div><span class="g">+${m.gain} EXP</span></div>`).join('')}</div>
        ${r.job ? `<div class="m job"><b>${r.job.icon} ${esc(r.job.name)}</b><span class="lv${r.job.ups.length ? ' up' : ''}">Lv.${r.job.lv}</span><div class="xp"><i style="width:${r.job.lv >= r.job.max ? 100 : Math.min(100, r.job.jp / r.job.need * 100)}%;background:${r.job.col}"></i></div><span class="g">${r.job.ups.length ? 'อาชีพเลเวลอัป!' : 'แต้มอาชีพ'}</span></div>` : ''}
        <div class="go">คลิก หรือกด Enter เพื่อไปต่อ</div></div>`;
      document.body.append(d); chime([523, 659, 784, 1047], .06);
      const close = () => { if (!ready) { skip = true; return } removeEventListener('keydown', key, true); d.remove(); res() };
      const key = e => { if (['Enter', ' ', 'Escape'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); close() } };
      d.onclick = close; addEventListener('keydown', key, true);
      const pause = ms => skip ? Promise.resolve() : wait(ms);
      (async () => {
        await pause(700);
        for (const [i, m] of r.members.entries()) { const row = d.querySelector(`.m[data-i="${i}"]`), bar = row.querySelector('i'), lv = row.querySelector('.lv'); m.lv = m.lv0;
          while (m.lv < m.lv1) { bar.style.width = '100%'; await pause(560); m.lv++; lv.textContent = 'Lv.' + m.lv; lv.classList.remove('up'); void lv.offsetWidth; lv.classList.add('up'); chime([659, 880, 1175], .07);
            if (!row.querySelector('.lvup')) row.insertAdjacentHTML('beforeend', `<div class="lvup">LEVEL UP! → Lv.${m.lv1}${m.key === 'hero' ? ' · ได้แต้มสเตตัส +' + (m.lv1 - m.lv0) * 2 : m.lv0 < CONTROL_LV && m.lv1 >= CONTROL_LV ? ' · 🎮 ปลดล็อก: สั่ง ' + m.name + ' เองได้ในการต่อสู้' : ''}</div>`);
            bar.style.transition = 'none'; bar.style.width = '0%'; void bar.offsetWidth; bar.style.transition = '' }
          bar.style.width = Math.min(100, m.xp1 / need(m) * 100) + '%'; await pause(380) }
        ready = true; d.querySelector('.go').classList.add('on'); if (skip) { skip = false }
      })();
    });
  }
  async function encounterFx(text) {
    const d = document.createElement('div'); d.className = 'wm-enc'; d.innerHTML = Array.from({ length: 8 }, (_, i) => `<i style="top:${i * 12.5}%;animation-delay:${(i % 2 ? .06 : 0) + i * .03}s"></i>`).join('') + `<b>${esc(text)}</b>`;
    document.body.append(d); await wait(1150);
  }
  async function bossFight(d) {
    const v = await modal(`<h2>☠ ${esc(d.name)}</h2><p>${esc(d.rumor)}</p><p>บางอย่างขยับอยู่ในเงามืด… <b>${esc(BOSS_NAME[d.boss] || d.boss)}</b></p><p>HP ตอนนี้ ${S.hp}/${S.maxHp}</p>`, [{ label: '⚔ บุกเข้าไป', value: 'go' }, { label: 'ถอยออกมาก่อน', value: null, ghost: true }]);
    if (v !== 'go') { if (S.prev) { S.pos = { ...S.prev }; const p = center(S.pos.c, S.pos.r); token.x = p.x; token.y = p.y; reveal(); hudSync() } return }
    /* v95.26: the destination is an area map — walk in past its guards to the lair */
    const r = await areaExplore({ title: d.name, sub: 'ลึกเข้าไปคือที่อยู่ของ ' + (BOSS_NAME[d.boss] || d.boss), biome: d.biome, seed: world.seed ^ 0x5eed ^ (d.c * 131 + d.r), dang: Math.max(.5, G.danger(world, d)), foes: G.FOES[d.biome] || G.FOES.grass, boss: { foe: d.boss, name: BOSS_NAME[d.boss] || d.boss } });
    if (r !== 'win') { if (r === 'left' && S.prev) { S.pos = { ...S.prev }; const p = center(S.pos.c, S.pos.r); token.x = p.x; token.y = p.y; reveal(); hudSync() } return }
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
  try { if (window.Bounties) { for (const m of Bounties.expire(S)) log(m); Bounties.place(S, world, G); save() } } catch (e) { }   /* v97.73 · bounties get their hex */
  hudSync(); requestAnimationFrame(frame);
  setInterval(() => { try { adoptLeads() } catch (e) { } }, 2500);
  window.WorldMap = { results, chatter, townVisit, landPanel, hudSync: () => hudSync(), area: o => areaExplore(o), revealAll: () => { for (const k in world.tiles) S.known[k] = 1; fogDirty = true }, state: () => S, world: () => world, step: h => clickHex(h), questBoard, chooseDest, busy: () => busy, center };
})();

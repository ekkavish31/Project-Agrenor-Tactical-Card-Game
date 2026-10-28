/* v92.13 · battle-field.html — a light, code-drawn battle field for journeys on the world map (no village art to load).
   It plays host to js/town-battle.js by providing the few globals the village page normally gives it:
   cv, W, H, scale, zoom, pan, WORLD_W, WORLD_H, project(u,v), inv(x,y), world(e), locations, center(o), blockedBase(u,v), TownPaint.matsAt(points).
   The field is a (2R+1)² lattice square (R = ?r, default 7) (same lattice as the village) filled per biome with blocking props (trees, rocks, water, pillars),
   slow ground (mud, snow drifts, scree, sand) and cover (tall grass, reeds, bushes), plus a darker frame of scenery around it.
   ?biome=forest|grass|hills|swamp|snow|sand · ?night=1 · ?seed= · ?poi=den|mine|ruin (boss dressing) */
'use strict';
const FQ = new URLSearchParams(location.search);
const WORLD_W = 4480, WORLD_H = 2520;
const cv = document.getElementById('world'), g = cv.getContext('2d');
let W = innerWidth, H = innerHeight, scale = 1, zoom = 1, pan = { x: 0, y: 0 };
function project(u, v) { return { x: 2240 + (u - v) * 28, y: 1232 + (u + v) * 14 } }
function inv(x, y) { const a = (x - 2240) / 28, b = (y - 1232) / 14; return { u: (a + b) / 2, v: (b - a) / 2 } }
function world(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - W / 2 - pan.x) / (scale * zoom) + WORLD_W / 2, y: (e.clientY - r.top - H / 2 - pan.y) / (scale * zoom) + WORLD_H / 2 } }
const locations = [{ id: 'square', name: 'สนาม' }];
function center() { return { u: 0, v: 0 } }

/* ---------- field generation ---------- */
const FIELD = (function () {
  const biome = ['forest', 'grass', 'hills', 'swamp', 'snow', 'sand'].includes(FQ.get('biome')) ? FQ.get('biome') : 'grass';
  let a = (+FQ.get('seed') || (Math.random() * 1e9) | 0) >>> 0;
  const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  /* share of cells: blocked prop, slow ground, cover */
  const MIX = {
    forest: { block: .17, slow: .06, cover: .16, props: ['tree', 'tree', 'tree', 'rock'], slowMat: 'mud', coverMat: 'moss' },
    grass: { block: .07, slow: .03, cover: .16, props: ['tree', 'rock', 'bush'], slowMat: 'mud', coverMat: 'clover' },
    hills: { block: .14, slow: .12, cover: .07, props: ['rock', 'rock', 'boulder'], slowMat: 'sand', coverMat: 'moss' },
    swamp: { block: .13, slow: .22, cover: .12, props: ['pool', 'pool', 'deadtree'], slowMat: 'mud', coverMat: 'moss' },
    snow: { block: .1, slow: .2, cover: .05, props: ['pine', 'rock'], slowMat: 'snow', coverMat: 'moss' },
    sand: { block: .07, slow: .12, cover: .06, props: ['rock', 'cactus'], slowMat: 'sand', coverMat: 'clover' }
  }[biome];
  const R = Math.max(4, Math.min(9, +FQ.get('r') || 7)), cells = new Map(), key = (u, v) => u + ',' + v;   // v92.15: 15×15 by default for party melees
  for (let u = -R; u <= R; u++) for (let v = -R; v <= R; v++) {
    const x = rnd(); let k = 'normal', prop = null;
    if (x < MIX.block) { k = 'blocked'; prop = MIX.props[Math.floor(rnd() * MIX.props.length)] }
    else if (x < MIX.block + MIX.slow) k = 'slow'; else if (x < MIX.block + MIX.slow + MIX.cover) k = 'cover';
    cells.set(key(u, v), { u, v, k, prop, seed: rnd() });
  }
  /* boss dressing: pillars (ruin), rails + rocks (mine), bones (den) on the rim */
  const poi = FQ.get('poi');
  if (poi) for (const c of cells.values()) if ((Math.abs(c.u) === R || Math.abs(c.v) === R) && rnd() < .35) { c.k = 'blocked'; c.prop = poi === 'ruin' ? 'pillar' : poi === 'mine' ? 'boulder' : 'deadtree' }
  /* keep the two start corners open and carve a lane between them so the fight can always happen */
  const S = R >= 7 ? 4 : 3, starts = [[-S, S], [S, -S]], OPEN = R >= 7 ? 2 : 1;   // each side's gathering area stays open
  for (const [su, sv] of starts) for (let du = -OPEN; du <= OPEN; du++) for (let dv = -OPEN; dv <= OPEN; dv++) { const c = cells.get(key(su + du, sv + dv)); if (c && c.k === 'blocked') { c.k = 'normal'; c.prop = null } }
  const reach = () => { const seen = new Set([key(-S, S)]), q = [[-S, S]]; while (q.length) { const [u, v] = q.pop(); for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = cells.get(key(u + du, v + dv)); if (!c || c.k === 'blocked' || seen.has(key(c.u, c.v))) continue; seen.add(key(c.u, c.v)); q.push([c.u, c.v]) } } return seen.has(key(S, -S)) };
  if (!reach()) { let u = -S, v = S; while (u !== S || v !== -S) { if (u !== S && (v === -S || rnd() < .5)) u++; else v--; const c = cells.get(key(u, v)); if (c.k === 'blocked') { c.k = rnd() < .5 ? 'slow' : 'normal'; c.prop = null } } }
  /* scenery beyond the field (never part of the fight) */
  const outer = [];
  for (let u = -R - 7; u <= R + 7; u++) for (let v = -R - 7; v <= R + 7; v++) { if (Math.abs(u) <= R && Math.abs(v) <= R) continue; const x = rnd(); outer.push({ u, v, prop: x < .3 ? MIX.props[Math.floor(rnd() * MIX.props.length)] : x < .45 ? 'tuft' : null, seed: rnd() }) }
  return { biome, R, cells, outer, MIX, rnd, key, night: FQ.get('night') === '1' };
})();
function blockedBase(u, v) { const c = FIELD.cells.get(FIELD.key(Math.floor(u), Math.floor(v))); return !c || c.k === 'blocked' }
const TownPaint = { matsAt: pts => pts.map(p => { const q = inv(p.x, p.y), c = FIELD.cells.get(FIELD.key(Math.floor(q.u), Math.floor(q.v))); return !c ? null : c.k === 'slow' ? FIELD.MIX.slowMat : c.k === 'cover' ? FIELD.MIX.coverMat : null }) };

/* ---------- painting ---------- */
const GROUND = { forest: ['#5f7a3e', '#6b8746', '#56703a'], grass: ['#7ea055', '#8cb062', '#729650'], hills: ['#a39168', '#b09e74', '#958560'], swamp: ['#55654a', '#5f7052', '#4b5a41'], snow: ['#dfe7ef', '#eef3f8', '#ced9e3'], sand: ['#d6c08c', '#e0cc99', '#c9b47f'] };
const SLOWC = { mud: ['#6b5236', '#7a5f3f'], snow: ['#f7fbff', '#e6eef6'], sand: ['#c9a96a', '#d8ba7c'] }, COVERC = { forest: '#3f6a2e', grass: '#5c8f3a', hills: '#6f7f3e', swamp: '#4f6a3a', snow: '#6f8a6a', sand: '#9a9a50' };
let groundCanvas = null;
function diamond(ctx, u, v, pad = 0) { const a = project(u, v), b = project(u + 1, v), c = project(u + 1, v + 1), d = project(u, v + 1); ctx.beginPath(); ctx.moveTo(a.x, a.y - pad); ctx.lineTo(b.x + pad, b.y); ctx.lineTo(c.x, c.y + pad); ctx.lineTo(d.x - pad, d.y); ctx.closePath() }
function paintGround() {
  const F = FIELD, ext = F.R + 8, a = project(-ext, ext), b = project(ext, -ext), top = project(-ext, -ext), bot = project(ext, ext);
  const x0 = Math.floor(a.x) - 40, x1 = Math.ceil(b.x) + 40, y0 = Math.floor(top.y) - 60, y1 = Math.ceil(bot.y) + 40;
  groundCanvas = document.createElement('canvas'); groundCanvas.width = x1 - x0; groundCanvas.height = y1 - y0; groundCanvas.ox = x0; groundCanvas.oy = y0;
  const t = groundCanvas.getContext('2d'); t.translate(-x0, -y0);
  const pal = GROUND[F.biome];
  t.fillStyle = pal[0]; t.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let i = 0; i < 2600; i++) { const x = x0 + F.rnd() * (x1 - x0), y = y0 + F.rnd() * (y1 - y0); t.fillStyle = pal[1 + (i & 1)]; t.globalAlpha = .5; t.beginPath(); t.ellipse(x, y, 4 + F.rnd() * 10, 2 + F.rnd() * 5, 0, 0, 7); t.fill() }
  t.globalAlpha = 1;
  for (const c of F.cells.values()) {
    if (c.k === 'slow') { const col = SLOWC[F.MIX.slowMat]; diamond(t, c.u, c.v, 3); t.fillStyle = col[0]; t.fill(); const p = project(c.u + .5, c.v + .5); for (let i = 0; i < 5; i++) { t.fillStyle = col[1]; t.beginPath(); t.ellipse(p.x + (F.rnd() - .5) * 34, p.y + (F.rnd() - .5) * 14, 5 + F.rnd() * 6, 2 + F.rnd() * 3, 0, 0, 7); t.fill() } if (F.MIX.slowMat === 'mud') { t.strokeStyle = 'rgba(30,20,10,.35)'; t.lineWidth = 1; t.beginPath(); t.ellipse(p.x, p.y, 12, 4, 0, 0, 7); t.stroke() } }
  }
  /* soft shading toward the edge of the field */
  const cpt = project(.5, .5), rg = t.createRadialGradient(cpt.x, cpt.y, 160, cpt.x, cpt.y, 700); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.45)'); t.fillStyle = rg; t.fillRect(x0, y0, x1 - x0, y1 - y0);
}
/* props are drawn every frame (cheap shapes) so they can sway; they sit under the units (field is small, units stand between props) */
function prop(ctx, kind, u, v, s, now) {
  const p = project(u + .5, v + .5), sw = Math.sin(now * .0012 + s * 9) * 1.5;
  const shadow = (rx, ry) => { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(p.x + 4, p.y + 2, rx, ry, 0, 0, 7); ctx.fill() };
  if (kind === 'tree' || kind === 'pine' || kind === 'deadtree') {
    const h = 64 + s * 26; shadow(20, 8);
    ctx.fillStyle = '#5a3d22'; ctx.fillRect(p.x - 3, p.y - h * .35, 6, h * .37);
    if (kind === 'deadtree') { ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(p.x, p.y - h * .3); ctx.lineTo(p.x + sw, p.y - h * .85); ctx.moveTo(p.x, p.y - h * .55); ctx.lineTo(p.x - 14, p.y - h * .75); ctx.moveTo(p.x + sw * .5, p.y - h * .65); ctx.lineTo(p.x + 12, p.y - h * .8); ctx.stroke(); return }
    const snow = kind === 'pine' && FIELD.biome === 'snow', tiers = kind === 'pine' ? 3 : 0;
    if (tiers) for (let k = 0; k < 3; k++) { const y = p.y - h * (.3 + k * .22), w = 22 - k * 5; ctx.fillStyle = k % 2 ? '#2f5a36' : '#3a6b40'; ctx.beginPath(); ctx.moveTo(p.x + sw * (k + 1) * .4, y - h * .3); ctx.lineTo(p.x + w, y); ctx.lineTo(p.x - w, y); ctx.closePath(); ctx.fill(); if (snow) { ctx.fillStyle = '#f2f6fa'; ctx.beginPath(); ctx.moveTo(p.x + sw * (k + 1) * .4, y - h * .3); ctx.lineTo(p.x + w * .45, y - h * .14); ctx.lineTo(p.x - w * .45, y - h * .14); ctx.closePath(); ctx.fill() } }
    else { for (const [dx, dy, r, c] of [[-10, -.62, 17, '#3d6b30'], [10, -.66, 16, '#467a36'], [0, -.82, 19, '#4f8a3c'], [-4, -.7, 12, '#5c9a46']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(p.x + dx + sw, p.y + h * dy, r, 0, 7); ctx.fill() } ctx.fillStyle = 'rgba(255,255,200,.12)'; ctx.beginPath(); ctx.arc(p.x - 6 + sw, p.y - h * .88, 9, 0, 7); ctx.fill() }
  } else if (kind === 'rock' || kind === 'boulder') {
    const r = kind === 'boulder' ? 22 : 15; shadow(r, r * .4);
    ctx.fillStyle = '#8a857c'; ctx.beginPath(); ctx.moveTo(p.x - r, p.y); ctx.lineTo(p.x - r * .6, p.y - r * 1.1); ctx.lineTo(p.x + r * .2, p.y - r * 1.4); ctx.lineTo(p.x + r, p.y - r * .5); ctx.lineTo(p.x + r * .8, p.y + 2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#6d6961'; ctx.beginPath(); ctx.moveTo(p.x + r * .2, p.y - r * 1.4); ctx.lineTo(p.x + r, p.y - r * .5); ctx.lineTo(p.x + r * .8, p.y + 2); ctx.lineTo(p.x + r * .1, p.y); ctx.closePath(); ctx.fill();
    if (FIELD.biome === 'snow') { ctx.fillStyle = '#f4f8fb'; ctx.beginPath(); ctx.ellipse(p.x - r * .2, p.y - r * 1.15, r * .45, r * .18, -.3, 0, 7); ctx.fill() }
  } else if (kind === 'bush') { shadow(16, 6); for (const [dx, dy, r] of [[-8, -8, 10], [8, -9, 10], [0, -14, 11]]) { ctx.fillStyle = '#4e7f36'; ctx.beginPath(); ctx.arc(p.x + dx + sw * .5, p.y + dy, r, 0, 7); ctx.fill() } }
  else if (kind === 'cactus') { shadow(10, 4); ctx.fillStyle = '#5c8a46'; ctx.fillRect(p.x - 5, p.y - 40, 10, 40); ctx.fillRect(p.x - 15, p.y - 28, 6, 14); ctx.fillRect(p.x + 9, p.y - 32, 6, 16) }
  else if (kind === 'pool') { diamond(ctx, u, v, -4); const gr = ctx.createLinearGradient(p.x - 28, p.y - 14, p.x + 28, p.y + 14); gr.addColorStop(0, '#2f5866'); gr.addColorStop(1, '#3f6f7c'); ctx.fillStyle = gr; ctx.fill(); ctx.strokeStyle = `rgba(200,235,255,${.25 + .15 * Math.sin(now * .002 + s * 7)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(p.x + sw * 2, p.y, 10, 3, 0, 0, 7); ctx.stroke() }
  else if (kind === 'pillar') { shadow(14, 6); ctx.fillStyle = '#bdb5a5'; ctx.fillRect(p.x - 9, p.y - 70, 18, 70); ctx.fillStyle = '#a39b8b'; ctx.fillRect(p.x + 2, p.y - 70, 7, 70); ctx.fillStyle = '#cfc7b7'; ctx.fillRect(p.x - 13, p.y - 76, 26, 8); ctx.fillStyle = 'rgba(70,100,60,.6)'; ctx.fillRect(p.x - 9, p.y - 30, 6, 30) }
  else if (kind === 'tuft') { ctx.strokeStyle = 'rgba(40,70,30,.55)'; ctx.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(p.x + i * 4, p.y); ctx.lineTo(p.x + i * 5 + sw, p.y - 8); ctx.stroke() } }
}
function cover(ctx, c, now) {
  /* tall grass / reeds: blades in front of whoever stands there */
  const p = project(c.u + .5, c.v + .5), col = COVERC[FIELD.biome];
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) { const x = p.x - 20 + i * 5 + (c.seed * 7 % 3), sw = Math.sin(now * .002 + i + c.seed * 6) * 2.5, h = 12 + ((i * 7 + c.seed * 13) % 7); ctx.beginPath(); ctx.moveTo(x, p.y + 6 - Math.abs(i - 4) * 1.2); ctx.quadraticCurveTo(x + sw * .5, p.y - h * .5, x + sw, p.y - h); ctx.stroke() }
}

/* ---------- frame ---------- */
function resize() { W = innerWidth; H = innerHeight; cv.width = Math.round(W * devicePixelRatio); cv.height = Math.round(H * devicePixelRatio); cv.style.width = W + 'px'; cv.style.height = H + 'px'; scale = Math.max(.7, Math.min(1.4, Math.min(W / 900, H / 620))) }
addEventListener('resize', resize); resize();
function frame(t) {
  /* standing props inside the field are drawn by town-battle together with the units, sorted by depth */
window.TownBattleExtras = () => { const out = []; for (const c of FIELD.cells.values()) if (c.prop && c.prop !== 'pool') out.push({ y: project(c.u + .5, c.v + .5).y, draw: (ctx, t) => prop(ctx, c.prop, c.u, c.v, c.seed, t) }); return out };
requestAnimationFrame(frame);
  if (!groundCanvas) paintGround();
  window.TownBattle?.pre?.();
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = FIELD.biome === 'snow' ? '#9aa8b5' : '#1a2016'; g.fillRect(0, 0, cv.width, cv.height);
  const k = devicePixelRatio * scale * zoom; g.setTransform(k, 0, 0, k, devicePixelRatio * (W / 2 + pan.x) - WORLD_W / 2 * k, devicePixelRatio * (H / 2 + pan.y) - WORLD_H / 2 * k);
  g.drawImage(groundCanvas, groundCanvas.ox, groundCanvas.oy);
  const props = [];
  for (const o of FIELD.outer) if (o.prop) props.push([o.prop, o.u, o.v, o.seed]);
  for (const c of FIELD.cells.values()) if (c.prop === 'pool') props.push([c.prop, c.u, c.v, c.seed]);   // flat water stays on the ground
  props.sort((a, b) => (a[1] + a[2]) - (b[1] + b[2]));
  for (const p of props) { if (p[0] === 'pool') prop(g, ...p, t) }
  for (const p of props) { if (p[0] !== 'pool') prop(g, ...p, t) }
  window.TownBattle?.draw?.(g, t);
  /* cover blades over the units' feet */
  const k2 = devicePixelRatio * scale * zoom; g.setTransform(k2, 0, 0, k2, devicePixelRatio * (W / 2 + pan.x) - WORLD_W / 2 * k2, devicePixelRatio * (H / 2 + pan.y) - WORLD_H / 2 * k2);
  for (const c of FIELD.cells.values()) if (c.k === 'cover') cover(g, c, t);
  if (FIELD.night) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(10,18,55,.42)'; g.fillRect(0, 0, cv.width, cv.height) }
}
requestAnimationFrame(frame);

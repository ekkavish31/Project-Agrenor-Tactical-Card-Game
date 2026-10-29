/* v92.13 · battle-field.html — a light, code-drawn battle field for journeys on the world map (no village art to load).
   It plays host to js/town-battle.js by providing the few globals the village page normally gives it:
   cv, W, H, scale, zoom, pan, WORLD_W, WORLD_H, project(u,v), inv(x,y), world(e), locations, center(o), blockedBase(u,v), TownPaint.matsAt(points).
   The field is a (2R+1)² lattice square (R = ?r, default 7) (same lattice as the village) filled per biome with blocking props (trees, rocks, water, pillars),
   slow ground (mud, snow drifts, scree, sand) and cover (tall grass, reeds, bushes), plus a darker frame of scenery around it.
   ?biome=forest|grass|hills|swamp|snow|sand · ?night=1 · ?seed= · ?poi=den|mine|ruin (boss dressing)
   v94: the ground has height (js/terrain-height.js, levels 0–3 by biome: grass gentle, hills/snow steeper) drawn by js/terrain-height-art.js —
   the one terrain renderer for the 2.5D fields. project(u,v) lifts by the level under (u,v), so props and fighters stand on the ground;
   window.FieldHeight.level(u,v) feeds the battle rules (flat-battle.js levelAt). ?flat=1 turns heights off.
   v96.00 · FFT-style field: half-level heights (rule levels 0–4 in 0.5 steps, ramps and stairs), stone forts, rivers with bridges, broken walls,
   cells in front of a unit are redrawn over it (occlusion) and the hidden unit shows as a ghost, animated water, cast shadows and a colour grade,
   v97.01 · bigger field (R = 1.7 × ?r, up to 13 → 27×27), trees ×2 in size AND grid: a tree / pine / dead tree is a 2×2 block of blocked cells
   (c.big = {id, anchor, kind}; anchor = its smallest-u/v cell, drawn at the block centre) and there are far fewer of them (MIX.big = share of the field covered).
   the camera turns in quarter turns (Q / E or the ⟲ ⟳ buttons) and a unit panel (live portrait, HP, stats, height) sits bottom right. */
'use strict';
const FQ = new URLSearchParams(location.search);
/* v97.01: the grid is 1.5× bigger on screen (cell 42×21 half-diamond instead of 28×14, height step 13.5 px) so neighbouring units no longer overlap; sprites keep their size.
   ?k= overrides it (1 = the old size). Everything that reads cell size takes it from FIELD_K */
const FK = window.FIELD_K || 1.5; window.FIELD_K = FK;
const HWc = 28 * FK, HHc = 14 * FK, OXc = 2240 * FK, OYc = 1232 * FK;
if (window.TerrainHeight) TerrainHeight.LEVEL_PX = 9 * FK;
const WORLD_W = 4480 * FK, WORLD_H = 2520 * FK;
const cv = document.getElementById('world'), g = cv.getContext('2d');
let W = innerWidth, H = innerHeight, scale = 1, zoom = 1, pan = { x: 0, y: 0 };
/* v96: the view can be turned by quarter turns around the field centre (0.5, 0.5): one turn maps (u, v) → (1 − v, u) */
let ROT = 0; try { ROT = (+localStorage.getItem('projectA.fieldRot') || 0) & 3 } catch (e) { }
function rotUV(u, v, t = ROT) { for (let k = 0; k < t; k++) { const a = 1 - v; v = u; u = a } return { u, v } }
function unrotUV(u, v, t = ROT) { for (let k = 0; k < t; k++) { const a = v; v = 1 - u; u = a } return { u, v } }
function projectFlat(u, v) { const r = rotUV(u, v); return { x: OXc + (r.u - r.v) * HWc, y: OYc + (r.u + r.v) * HHc } }
function invFlat(x, y) { const a = (x - OXc) / HWc, b = (y - OYc) / HHc; return unrotUV((a + b) / 2, (b - a) / 2) }
/* depth for painter's order in view space (bigger = nearer the viewer) */
window.FieldDepth = (u, v) => { const r = rotUV(u, v); return r.u + r.v };
/* lifted by the ground height; between two walkable cells the lift eases across the edge so a walk up a step reads as a step, not a teleport */
function project(u, v) { const p = projectFlat(u, v); return window.FieldHeight ? { x: p.x, y: p.y - FieldHeight.liftAt(u, v) } : p }
function inv(x, y) { if (window.FieldHeight) { const c = FieldHeight.hit(x, y, window.TownBattle?.reach?.()); if (c) return { u: c.u + .5, v: c.v + .5 } } return invFlat(x, y) }
function world(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - W / 2 - pan.x) / (scale * zoom) + WORLD_W / 2, y: (e.clientY - r.top - H / 2 - pan.y) / (scale * zoom) + WORLD_H / 2 } }
const locations = [{ id: 'square', name: 'สนาม' }];
function center() { return { u: 0, v: 0 } }

/* ---------- field generation ---------- */
const FIELD = (function () {
  const biome = ['forest', 'grass', 'hills', 'swamp', 'snow', 'sand'].includes(FQ.get('biome')) ? FQ.get('biome') : 'grass';
  let a = (+FQ.get('seed') || (Math.random() * 1e9) | 0) >>> 0;
  const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  /* share of cells: small blocking prop (1×1), big trees (share of the field COVERED by 2×2 trees), slow ground, cover */
  const MIX = {
    forest: { block: .04, big: .08, props: ['rock', 'rock', 'bush'], bigProps: ['tree'], slow: .06, cover: .16, slowMat: 'mud', coverMat: 'moss' },
    grass: { block: .03, big: .03, props: ['rock', 'bush'], bigProps: ['tree'], slow: .03, cover: .16, slowMat: 'mud', coverMat: 'clover' },
    hills: { block: .10, big: 0, props: ['rock', 'rock', 'boulder'], bigProps: [], slow: .12, cover: .07, slowMat: 'sand', coverMat: 'moss' },
    swamp: { block: .09, big: .04, props: ['pool'], bigProps: ['deadtree'], slow: .22, cover: .12, slowMat: 'mud', coverMat: 'moss' },
    snow: { block: .03, big: .05, props: ['rock'], bigProps: ['pine'], slow: .2, cover: .05, slowMat: 'snow', coverMat: 'moss' },
    sand: { block: .06, big: 0, props: ['rock', 'cactus'], bigProps: [], slow: .12, cover: .06, slowMat: 'sand', coverMat: 'clover' }
  }[biome];
  /* v97.01: the field is 1.7× wider than the ?r the host asks for (r 7 → R 12 = 25×25 instead of 15×15; r 5 → R 9) */
  const R = Math.max(6, Math.min(13, Math.round((+FQ.get('r') || 7) * 1.7))), cells = new Map(), key = (u, v) => u + ',' + v;
  const S = Math.min(6, Math.round(R * .45)), OPEN = 2;   // where each side gathers (town-battle reads window.FieldGap = S)
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
  const starts = [[-S, S], [S, -S]];   // each side's gathering area stays open
  for (const [su, sv] of starts) for (let du = -OPEN; du <= OPEN; du++) for (let dv = -OPEN; dv <= OPEN; dv++) { const c = cells.get(key(su + du, sv + dv)); if (c && c.k === 'blocked') { c.k = 'normal'; c.prop = null } }
  /* v97.01 · big trees: 2×2 blocks of blocked cells with a free cell all around them (so they never wall the field off) */
  const bigKinds = MIX.bigProps || [];
  if (bigKinds.length && MIX.big) {
    const want = Math.round(MIX.big * (2 * R + 1) * (2 * R + 1) / 4), nearStart = (u, v) => starts.some(([a, b]) => Math.abs(u - a) <= OPEN + 2 && Math.abs(v - b) <= OPEN + 2);
    for (let t = 0, made = 0; t < want * 40 && made < want; t++) {
      const u = -R + ((rnd() * 2 * R) | 0), v = -R + ((rnd() * 2 * R) | 0); let ok = true;
      for (let du = -1; du <= 2 && ok; du++) for (let dv = -1; dv <= 2 && ok; dv++) { const c = cells.get(key(u + du, v + dv)); if (!c) continue; const inner = du >= 0 && du <= 1 && dv >= 0 && dv <= 1; if (inner ? (c.k !== 'normal' || nearStart(c.u, c.v)) : c.k === 'blocked') ok = false }
      if (!ok) continue;
      const kind = bigKinds[(rnd() * bigKinds.length) | 0], id = ++made, sd = rnd();
      for (let du = 0; du < 2; du++) for (let dv = 0; dv < 2; dv++) { const c = cells.get(key(u + du, v + dv)); c.k = 'blocked'; c.big = { id, anchor: !du && !dv, kind }; c.prop = c.big.anchor ? kind : null; c.seed = sd }
    }
  }
  const reach = () => { const seen = new Set([key(-S, S)]), q = [[-S, S]]; while (q.length) { const [u, v] = q.pop(); for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = cells.get(key(u + du, v + dv)); if (!c || c.k === 'blocked' || seen.has(key(c.u, c.v))) continue; seen.add(key(c.u, c.v)); q.push([c.u, c.v]) } } return seen.has(key(S, -S)) };
  if (!reach()) { let u = -S, v = S; while (u !== S || v !== -S) { if (u !== S && (v === -S || rnd() < .5)) u++; else v--; const c = cells.get(key(u, v)); if (c.k === 'blocked') { c.k = rnd() < .5 ? 'slow' : 'normal'; c.prop = null } } }
  /* the lane carve above may have opened one cell of a big tree: then the whole tree goes */
  { const gr = new Map(); for (const c of cells.values()) if (c.big) (gr.get(c.big.id) || gr.set(c.big.id, []).get(c.big.id)).push(c);
    for (const cs of gr.values()) if (cs.some(c => c.k !== 'blocked')) for (const c of cs) { if (c.k === 'blocked') c.k = 'normal'; c.prop = null; c.big = null } }
  /* scenery beyond the field (never part of the fight) */
  const outer = [];
  for (let u = -R - 7; u <= R + 7; u++) for (let v = -R - 7; v <= R + 7; v++) { if (Math.abs(u) <= R && Math.abs(v) <= R) continue; const x = rnd(); outer.push({ u, v, prop: x < .3 ? MIX.props[Math.floor(rnd() * MIX.props.length)] : x < .45 ? 'tuft' : null, seed: rnd() }) }
  return { biome, R, S, cells, outer, MIX, rnd, key, night: FQ.get('night') === '1' };
})();
/* v95.19: repaint the ground once the painted terrain textures have loaded */
window.FieldDiorama?.ready?.().then(ok => { if (ok) groundCanvas = null });
window.FieldR = FIELD.R; window.FieldGap = FIELD.S;
/* ---------- heights (v94 · v96 half levels) ---------- */
window.FieldHeight = (function () {
  if (!window.TerrainHeight || FQ.get('flat') === '1') return null;
  const R = FIELD.R, n = 2 * R + 1, S = FIELD.S, T = TerrainHeight, PX = T.LEVEL_PX, ST = T.STEP, poi = FQ.get('poi');
  const zone = poi === 'mine' ? 'hills' : FIELD.biome;
  const SEV = { grass: .5, forest: .55, hills: .85, swamp: .25, snow: .75, sand: .4 };   // v95.18: battle fields are hillier than the world around them
  const fseed = 'field:' + (FQ.get('seed') || Math.floor(FIELD.rnd() * 1e9)) + ':' + FIELD.biome;
  const blocked = (lu, lv) => { const c = FIELD.cells.get(FIELD.key(lu - R, lv - R)); return !c || c.k === 'blocked' };
  const map = T.forScene({ w: n, h: n, seed: fseed, biome: SEV[zone] ?? .5, blocked, entries: [{ u: R - S, v: R + S }, { u: R + S, v: R - S }] });
  map.origin = { u: -R, v: -R };                        // local lattice → field cells (−R … R)
  const cellAt = i => FIELD.cells.get(FIELD.key((i % n) - R, ((i / n) | 0) - R));
  if (window.FieldDiorama) {
    const near = (u, v) => [[R - S, R + S], [R + S, R - S]].some(([a, b]) => Math.abs(u - a) <= 3 && Math.abs(v - b) <= 3);
    const seed = [...fseed].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261) >>> 0;
    /* v95.18 high ground (v96: some plateaus are stone forts) · v96 rivers with bridges, broken walls, pools as real water */
    FieldDiorama.landforms(map, { seed, keep: near, count: Math.round(({ hills: 3, snow: 3, grass: 2, forest: 2, sand: 2, swamp: 1 }[zone] || 2) * Math.min(2.5, n * n / 225)), fort: poi === 'ruin' ? .8 : { hills: .5, snow: .4, sand: .35 }[zone] ?? .2 });
    for (const i of map.stairs || []) { const c = cellAt(i); if (c && c.k === 'blocked') { c.k = 'normal'; c.prop = null } }
    const st = FieldDiorama.structures(map, { seed, keep: near, biome: FIELD.biome, poi, scale: Math.min(2.5, n * n / 225), pools: i => cellAt(i)?.prop === 'pool' });
    for (const i of st.clear) { const c = cellAt(i); if (c) { c.k = 'normal'; c.prop = null } }
    for (const i of st.block) { const c = cellAt(i); if (c) { c.k = 'blocked'; c.prop = null } }
  }
  /* v97.01 · a big tree stands on one flat 2×2 patch: drop it if a stair, bridge, wall, pool or road took one of its cells, else level the patch */
  { const gr = new Map(); for (const c of FIELD.cells.values()) if (c.big) (gr.get(c.big.id) || gr.set(c.big.id, []).get(c.big.id)).push(c);
    for (const cs of gr.values()) {
      const idx = cs.map(c => (c.v + R) * n + c.u + R), at = (k, i) => map[k] ? map[k][i] : 0;
      const bad = cs.some(c => c.k !== 'blocked' || (c.big.anchor && c.prop !== c.big.kind)) || idx.some(i => at('water', i) || at('mat', i) || at('stair', i) || at('ramp', i) || map.flat[i]);
      if (bad) cs.forEach((c, j) => { const i = idx[j]; if (!at('water', i) && !at('mat', i)) { c.k = 'normal'; map.blocked[i] = 0 } c.prop = null; c.big = null });
      else { const lo = Math.min(...idx.map(i => map.levels[i])); for (const i of idx) { map.levels[i] = lo; if (map.ramp) map.ramp[i] = 0 } }
    } }
  const sub = (u, v) => T.levelAt(map, Math.floor(u), Math.floor(v)) ?? 0;
  const level = (u, v) => sub(u, v) / ST;               // rule levels for flat-battle (0, 0.5, 1 … 4)
  const ramp = (u, v) => { const i = (Math.floor(v) + R) * n + Math.floor(u) + R; return map.ramp && i >= 0 && i < n * n ? map.ramp[i] : 0 };
  function liftAt(u, v) {
    const cu = Math.floor(u), cv = Math.floor(v), L = sub(cu, cv), fu = u - cu - .5, fv = v - cv - .5;
    let y = T.surfaceAt(map, u, v) * PX;
    if (ramp(cu, cv)) return y;
    for (const [f, du, dv] of [[fu, Math.sign(fu), 0], [fv, 0, Math.sign(fv)]]) {
      const e = Math.abs(f); if (e < .3 || !(du || dv) || ramp(cu + du, cv + dv)) continue;
      const N = T.levelAt(map, cu + du, cv + dv); if (N == null || Math.abs(N - L) > ST) continue;
      y += (N - L) * PX * .5 * ((e - .3) / .2);         // half way at the shared edge, so a walk up a step reads as a step
    }
    return y;
  }
  /* the view map (turned with the camera) and its cells' screen boxes, for hit tests and occlusion */
  let view = null, meta = null;
  function setView() {
    view = window.FieldDiorama ? FieldDiorama.rotate(map, ROT) : map; meta = [];
    const P = (a, b, z) => ({ x: OXc + (a - R - b + R) * HWc, y: OYc + (a - R + b - R) * HHc - z * PX });
    for (let b = 0; b < n; b++) for (let a = 0; a < n; a++) {
      const i = b * n + a, c = T.corners(view, i).map(z => view.water && view.water[i] ? z - (FieldDiorama?.WATER || .8) : z);
      meta.push({ i, a, b, d: a + b - 2 * R + 1, x0: P(a, b + 1, 0).x, x1: P(a + 1, b, 0).x, top: Math.min(P(a, b, c[0]).y, P(a + 1, b, c[1]).y, P(a, b + 1, c[3]).y), water: view.water && view.water[i],
        quad: [P(a, b, c[0]), P(a + 1, b, c[1]), P(a + 1, b + 1, c[2]), P(a, b + 1, c[3])] });
    }
    meta.sort((p, q) => p.d - q.d || p.a - q.a);
  }
  setView();
  const inQuad = (q, x, y) => { let s = 0; for (let k = 0; k < 4; k++) { const a = q[k], b = q[(k + 1) & 3], c = (b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x); if (c !== 0) { if (s && Math.sign(c) !== s) return false; s = Math.sign(c) } } return true };
  /* screen point (world px) → the front-most logical cell whose top contains it; with `prefer` (a Map of 'u,v' → reachable cell, the blue
     highlights, which are drawn over everything) a highlighted cell hidden behind higher ground still wins the click */
  function hit(x, y, prefer) {
    let first = null;
    for (let k = meta.length - 1; k >= 0; k--) { const m = meta[k]; if (!inQuad(m.quad, x, y)) continue; let a = m.a, b = m.b; for (let t = 0; t < ROT; t++) { const na = b; b = n - 1 - a; a = na }
      const c = { u: a - R, v: b - R }; if (!prefer) return c; if (!first) first = c; const e = prefer.get?.(c.u + ',' + c.v); if (e && e.cost > 0) return c }
    return first;
  }
  return { map, get view() { return view }, get meta() { return meta }, setView, hit, sub, level, liftAt, lift: (u, v) => sub(u, v) * PX, R, n, STEP: ST };
})();

function blockedBase(u, v) { const c = FIELD.cells.get(FIELD.key(Math.floor(u), Math.floor(v))); return !c || c.k === 'blocked' }
/* v96: points come from project(u+.5, v+.5); match them back to their own cell first (a tall cell in front would win a screen hit test) */
const TownPaint = { matsAt: pts => { const own = new Map(); for (const c of FIELD.cells.values()) { const p = project(c.u + .5, c.v + .5); own.set(Math.round(p.x) + ',' + Math.round(p.y), c) }
  return pts.map(p => { let c = own.get(Math.round(p.x) + ',' + Math.round(p.y)); if (!c) { const q = inv(p.x, p.y); c = FIELD.cells.get(FIELD.key(Math.floor(q.u), Math.floor(q.v))) } return !c ? null : c.k === 'slow' ? FIELD.MIX.slowMat : c.k === 'cover' ? FIELD.MIX.coverMat : null }) } };
/* water, walls and forts already read as obstacles: no red blocked tint over them */
window.FieldCellTint = (u, v, k, col) => { const F = window.FieldHeight; if (!F || k !== 'blocked') return col; const i = (v + F.R) * F.n + u + F.R, M = F.map; return M.water?.[i] || M.mat?.[i] ? null : (() => { const c = FIELD.cells.get(FIELD.key(u, v)); return c && (c.prop || c.big) ? 'rgba(210,60,60,.14)' : col })() };

/* ---------- painting ---------- */
const GROUND = { forest: ['#5f7a3e', '#6b8746', '#56703a'], grass: ['#7ea055', '#8cb062', '#729650'], hills: ['#a39168', '#b09e74', '#958560'], swamp: ['#55654a', '#5f7052', '#4b5a41'], snow: ['#dfe7ef', '#eef3f8', '#ced9e3'], sand: ['#d6c08c', '#e0cc99', '#c9b47f'] };
const SLOWC = { mud: ['#6b5236', '#7a5f3f'], snow: ['#f7fbff', '#e6eef6'], sand: ['#c9a96a', '#d8ba7c'] }, COVERC = { forest: '#3f6a2e', grass: '#5c8f3a', hills: '#6f7f3e', swamp: '#4f6a3a', snow: '#6f8a6a', sand: '#9a9a50' };
let groundCanvas = null;
function diamond(ctx, u, v, pad = 0) { const L = window.FieldHeight ? FieldHeight.lift(u, v) : 0, P = (x, y) => { const q = projectFlat(x, y); return { x: q.x, y: q.y - L } }, a = P(u, v), b = P(u + 1, v), c = P(u + 1, v + 1), d = P(u, v + 1); ctx.beginPath(); ctx.moveTo(a.x, a.y - pad); ctx.lineTo(b.x + pad, b.y); ctx.lineTo(c.x, c.y + pad); ctx.lineTo(d.x - pad, d.y); ctx.closePath() }
function paintGround() {
  const F = FIELD, ext = F.R + 8, cs = [project(-ext, ext), project(ext, -ext), project(-ext, -ext), project(ext, ext)];   // v96: any camera turn
  const x0 = Math.floor(Math.min(...cs.map(p => p.x))) - 40, x1 = Math.ceil(Math.max(...cs.map(p => p.x))) + 40, y0 = Math.floor(Math.min(...cs.map(p => p.y))) - 140, y1 = Math.ceil(Math.max(...cs.map(p => p.y))) + 40;
  groundCanvas = document.createElement('canvas'); groundCanvas.width = x1 - x0; groundCanvas.height = y1 - y0; groundCanvas.ox = x0; groundCanvas.oy = y0;
  const t = groundCanvas.getContext('2d'); t.translate(-x0, -y0);
  const pal = GROUND[F.biome];
  if (window.FieldHeight && window.FieldDiorama) {   /* v95.18 · the field as a floating diorama */
    FieldDiorama.paint(t, FieldHeight.view, { biome: F.biome, poi: FQ.get('poi') });
    /* v97.01: slow ground (mud / snow drift / sand) is the painted ground texture; the old colour + dabs only while it loads */
    const SLOWTEX = { mud: 'mud', snow: 'snowd', sand: 'sandc' }[F.MIX.slowMat];
    for (const c of F.cells.values()) if (c.k === 'slow') { const col = SLOWC[F.MIX.slowMat], pat = FieldDiorama.pattern(t, SLOWTEX, FieldHeight.lift(c.u, c.v) / TerrainHeight.LEVEL_PX); diamond(t, c.u, c.v, -2);
      if (pat) { t.globalAlpha = .92; t.fillStyle = pat; t.fill(); t.globalAlpha = 1; t.strokeStyle = 'rgba(0,0,0,.25)'; t.lineWidth = 1; t.stroke(); continue }
      t.globalAlpha = .7; t.fillStyle = col[0]; t.fill(); t.globalAlpha = 1; const p = project(c.u + .5, c.v + .5); for (let i = 0; i < 4; i++) { t.fillStyle = col[1]; t.beginPath(); t.ellipse(p.x + (F.rnd() - .5) * 30, p.y + (F.rnd() - .5) * 12, 4 + F.rnd() * 5, 2 + F.rnd() * 2, 0, 0, 7); t.fill() } }
    return;
  }
  t.fillStyle = pal[0]; t.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let i = 0; i < 2600; i++) { const x = x0 + F.rnd() * (x1 - x0), y = y0 + F.rnd() * (y1 - y0); t.fillStyle = pal[1 + (i & 1)]; t.globalAlpha = .5; t.beginPath(); t.ellipse(x, y, 4 + F.rnd() * 10, 2 + F.rnd() * 5, 0, 0, 7); t.fill() }
  t.globalAlpha = 1;
  /* v94: the raised ground (terraces, earth lips, rock cliffs) — one renderer for every outdoor field */
  if (window.FieldHeight) {
    const M = FieldHeight.map, base = pal[0], sh = (hex, k) => { const n = parseInt(hex.slice(1), 16), c = x => Math.max(0, Math.min(255, Math.round(x * k))).toString(16).padStart(2, '0'); return '#' + c(n >> 16) + c(n >> 8 & 255) + c(n & 255) };
    const rock = F.biome === 'snow' ? TerrainHeightArt.PALETTES.snow : F.biome === 'sand' ? TerrainHeightArt.PALETTES.sand : TerrainHeightArt.PALETTES.rock;
    const palette = { top: [0, 1, 2, 3].map(l => sh(base, 1 + .07 * l)), lip: F.biome === 'snow' ? '#a8b6c2' : '#7a5f3e', cliff: rock.cliff, line: 'rgba(0,0,0,.13)' };
    const pools = new Uint8Array(M.w * M.h); for (const c of F.cells.values()) if (c.prop === 'pool') pools[(c.v - M.origin.v) * M.w + (c.u - M.origin.u)] = 1;
    const vary = new Array(M.w * M.h).fill(0).map(() => .95 + F.rnd() * .08);
    TerrainHeightArt.draw(t, { ...M, blocked: pools }, { palette, grid: true, tint: i => sh(palette.top[Math.min(3, M.levels[i] >> 1)], vary[i]) });
  }
  for (const c of F.cells.values()) {
    if (c.k === 'slow') { const col = SLOWC[F.MIX.slowMat]; diamond(t, c.u, c.v, 3); t.fillStyle = col[0]; t.fill(); const p = project(c.u + .5, c.v + .5); for (let i = 0; i < 5; i++) { t.fillStyle = col[1]; t.beginPath(); t.ellipse(p.x + (F.rnd() - .5) * 34, p.y + (F.rnd() - .5) * 14, 5 + F.rnd() * 6, 2 + F.rnd() * 3, 0, 0, 7); t.fill() } if (F.MIX.slowMat === 'mud') { t.strokeStyle = 'rgba(30,20,10,.35)'; t.lineWidth = 1; t.beginPath(); t.ellipse(p.x, p.y, 12, 4, 0, 0, 7); t.stroke() } }
  }
  /* soft shading toward the edge of the field */
  const cpt = project(.5, .5), rg = t.createRadialGradient(cpt.x, cpt.y, 160, cpt.x, cpt.y, 700); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.45)'); t.fillStyle = rg; t.fillRect(x0, y0, x1 - x0, y1 - y0);
}
/* v97.01 · props use the painted art already in the repo (village nature set + old tactics props), a variant per cell seed;
   cactus and dead trees have no picture yet, so they (and any picture still loading) fall back to the code drawing below.
   [file, size in world px, 'h' = height or 'w' = width] */
const PA = 'assets/', PROP_ART = {
  /* trees are ×2 (v97.01): a 2×2-cell block each */
  tree: { forest: [['tactics/tree', 248, 'h'], ['village-town/nature/broadleaf', 248, 'h'], ['village-town/nature/old-oak', 240, 'h'], ['village-town/nature/tree-round', 208, 'h']],
    _: [['tactics/tree', 256, 'h'], ['village-town/nature/broadleaf', 256, 'h'], ['village-town/nature/tree-round', 216, 'h'], ['village-town/nature/tree-round-2', 200, 'h'], ['village-town/nature/tree-blossom', 236, 'h']] },
  pine: { snow: [['village-town/edge/snow-pine-m', 264, 'h'], ['village-town/edge/snow-pine-l', 280, 'h']], _: [['tactics/props/pine', 280, 'h'], ['village-town/nature/tree-conifer', 256, 'h']] },
  rock: { snow: [['village-town/edge/snow-rock-m', 54, 'w'], ['village-town/edge/snow-rock-s', 44, 'w']], hills: [['tactics/rock', 54, 'w'], ['tactics/props/standstone', 64, 'h'], ['village-town/nature/rock-cluster', 56, 'w']],
    sand: [['tactics/rock', 52, 'w'], ['tactics/props/standstone', 62, 'h']], forest: [['tactics/props/mossrock', 54, 'w'], ['village-town/nature/rock-cluster', 56, 'w'], ['tactics/decor/mushrooms', 46, 'w'], ['tactics/props/log', 56, 'w'], ['tactics/stump', 46, 'w']],
    swamp: [['tactics/props/mossrock', 52, 'w'], ['village-town/edge/coast-rocks-s', 56, 'w'], ['tactics/props/log', 54, 'w'], ['tactics/stump', 44, 'w']], _: [['tactics/rock', 52, 'w'], ['tactics/props/mossrock', 52, 'w'], ['village-town/nature/rock-cluster', 56, 'w']] },
  boulder: { snow: [['village-town/edge/snow-rock-l', 66, 'w']], _: [['tactics/rock', 64, 'w'], ['tactics/props/mossrock', 64, 'w']] },
  bush: { snow: [['village-town/edge/frozen-bush', 46, 'w']], _: [['village-town/nature/bush-small', 46, 'w'], ['tactics/props/bush', 52, 'w']] },
  pillar: { _: [['tactics/pillar', 112, 'h']] },
  deadtree: { _: [['tactics/props/deadtree', 236, 'h'], ['tactics/props/deadtree', 208, 'h']] },
  cactus: { _: [['tactics/props/cactus', 72, 'h']] }   // deadtree / cactus pictures are planned (docs/ART-TODO.md): code drawing until they exist
};
const PIMG = {};
function propImg(f) {
  let im = PIMG[f]; if (im) return im.ok ? im : null;
  im = PIMG[f] = new Image(); im.onload = () => {   /* the picture's base = lowest opaque row, so it stands on the cell centre */
    try { const c = document.createElement('canvas'), w = c.width = 64, h = c.height = Math.max(8, Math.round(64 * im.naturalHeight / im.naturalWidth)), q = c.getContext('2d'); q.drawImage(im, 0, 0, w, h); const d = q.getImageData(0, 0, w, h).data; let b = h - 1; for (; b > 0; b--) { let hit = false; for (let x = 0; x < w; x++) if (d[(b * w + x) * 4 + 3] > 40) { hit = true; break } if (hit) break } im.base = (b + 1) / h } catch (e) { im.base = .97 }
    im.ok = true }; im.src = PA + f + '.webp'; return null;
}
function propSpec(kind, s) { const set = PROP_ART[kind]; if (!set) return null; const list = set[FIELD.biome] || set._; return list[Math.floor(s * 997) % list.length] || null }
/* drawn size of a prop (for depth and occlusion boxes) */
function propBox(kind, s, big) { const b = propBox0(kind, s, big); return { w: b.w * FK, h: b.h * FK } }
function propBox0(kind, s, big) { const sp = propSpec(kind, s), im = sp && propImg(sp[0]); if (!im) return big ? { w: 104, h: 190 } : { w: 52, h: 95 }; const ar = im.naturalWidth / im.naturalHeight; return sp[2] === 'h' ? { w: sp[1] * ar, h: sp[1] } : { w: sp[1], h: sp[1] / ar } }
/* props are drawn every frame so they can sway; painter's order by view depth together with the units */
function prop(ctx, kind, u, v, s, now, big) {
  const sp = propSpec(kind, s), im = sp && propImg(sp[0]), c = big ? .5 : 0, p = project(u + .5 + c, v + .5 + c), sw = Math.sin(now * .0012 + s * 9) * 1.5;
  if (im) {
    const b = propBox(kind, s, big), tall = b.h > 90, flip = s * 1000 % 2 < 1, rx = big ? Math.min(78, b.w * .3) : Math.min(30, b.w * .42);
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(p.x + (big ? 10 : 5), p.y + 2, rx, rx * .4, 0, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(p.x, p.y + 3); if (tall) ctx.transform(1, 0, sw * (big ? .003 : .006), 1, 0, 0); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(im, -b.w / 2, -b.h * im.base, b.w, b.h); ctx.restore(); return;
  }
  if (big) { ctx.save(); ctx.translate(p.x, p.y); ctx.scale(2, 2); ctx.translate(-p.x, -p.y); propCode(ctx, kind, u, v, s, now, p, sw); ctx.restore(); return }
  propCode(ctx, kind, u, v, s, now, p, sw);
}
/* the code drawings (no picture yet, or still loading) */
function propCode(ctx, kind, u, v, s, now, p, sw) {
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
/* tall grass / reeds in front of whoever stands there: painted clumps (v97.01), the old blades only while the picture loads */
const COVER_ART = { forest: [['tactics/decor/fern', 62], ['tactics/ground/tallgrass', 64]], grass: [['tactics/ground/tallgrass', 64], ['village-town/nature/tall-grass', 58]], hills: [['tactics/ground/tallgrass', 60]],
  swamp: [['tactics/ground/tallgrass', 62], ['tactics/decor/fern', 56]], snow: [['terrain/decal/grass-tufts', 58]], sand: [['tactics/ground/tallgrass', 56]] };
function cover(ctx, c, now) {
  const p = project(c.u + .5, c.v + .5), set = COVER_ART[FIELD.biome] || COVER_ART.grass, sp = set[Math.floor(c.seed * 997) % set.length], im = propImg(sp[0]);
  if (im) {
    const w = sp[1] * FK * (.9 + (c.seed * 13 % 1) * .25), h = w * im.naturalHeight / im.naturalWidth, sway = Math.sin(now * .002 + c.seed * 9) * .05;
    ctx.save(); ctx.translate(p.x + (c.seed * 7 % 1 - .5) * 8, p.y + 5); ctx.transform(1, 0, sway, 1, 0, 0); if (c.seed * 31 % 1 < .5) ctx.scale(-1, 1);
    ctx.drawImage(im, -w / 2, -h * (im.base || .97), w, h); ctx.restore(); return;
  }
  const col = COVERC[FIELD.biome];
  ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) { const x = p.x - 20 + i * 5 + (c.seed * 7 % 3), sw = Math.sin(now * .002 + i + c.seed * 6) * 2.5, h = 12 + ((i * 7 + c.seed * 13) % 7); ctx.beginPath(); ctx.moveTo(x, p.y + 6 - Math.abs(i - 4) * 1.2); ctx.quadraticCurveTo(x + sw * .5, p.y - h * .5, x + sw, p.y - h); ctx.stroke() }
}

/* ---------- v96 · water shimmer, occlusion, camera turns, unit panel ---------- */
function waterFx(ctx, now) {
  const F = window.FieldHeight; if (!F || !window.FieldDiorama) return; const V = F.view, n = F.n;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const m of F.meta) {
    if (!m.water) continue; const hi = [[1, 0], [0, 1], [1, 1]].some(([da, db]) => { const a = m.a + da, b = m.b + db; return a < n && b < n && !V.water[b * n + a] && V.levels[b * n + a] > V.levels[m.i] });
    const c = { x: (m.quad[0].x + m.quad[2].x) / 2, y: (m.quad[0].y + m.quad[2].y) / 2 }, s = (m.i * 9301 + 49297) % 233280 / 233280;
    for (let k = 0; k < 3; k++) { const ph = now * .0016 + s * 6.3 + k * 2.1, a = (Math.sin(ph) + 1) / 2; if (hi && k) continue;
      const x = c.x + Math.sin(s * 40 + k * 3) * 12 + Math.sin(now * .0005 + k) * 3, y = c.y + Math.cos(s * 30 + k * 5) * 4 - (hi ? 4 : 0);
      ctx.strokeStyle = `rgba(210,240,255,${.12 + a * .4})`; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x - 4 - a * 3, y); ctx.lineTo(x + 4 + a * 3, y); ctx.stroke();
      if (a > .92) { ctx.fillStyle = `rgba(255,255,255,${(a - .92) * 10})`; ctx.fillRect(x - 1, y - 1, 2, 2) } }
  }
  ctx.restore();
}
/* a logical cell's outline on its (possibly sloped) top, for town-battle's highlights */
window.FieldCellPoly = window.FieldHeight ? (g, u, v) => { const F = FieldHeight, i = (v + F.R) * F.n + u + F.R, c = i >= 0 && i < F.n * F.n && u >= -F.R && u <= F.R ? TerrainHeight.corners(F.map, i) : [0, 0, 0, 0], PX = TerrainHeight.LEVEL_PX;
  const P = (x, y, z) => { const q = projectFlat(x, y); return { x: q.x, y: q.y - z * PX } }, q = [P(u, v, c[0]), P(u + 1, v, c[1]), P(u + 1, v + 1, c[2]), P(u, v + 1, c[3])];
  g.beginPath(); g.moveTo(q[0].x, q[0].y); for (let k = 1; k < 4; k++) g.lineTo(q[k].x, q[k].y); g.closePath() } : null;
/* entities that can hide behind higher cells in front of them: units (from town-battle) and standing props */
function occluders(ents) {
  const F = window.FieldHeight, out = []; if (!F || !window.FieldDiorama) return out;
  for (const e of ents) for (const m of F.meta) {
    if (m.water || m.d <= e.d + .02 || m.x1 < e.x0 || m.x0 > e.x1 || m.top > e.foot - 3) continue;
    if (e.unit) e.unit._occT = true;
    out.push({ d: m.d, y: m.top, draw: ctx => { const t = FieldDiorama.tile(F.view, m.i); if (!t) return; ctx.save(); ctx.beginPath(); ctx.rect(e.x0, e.y0, e.x1 - e.x0, e.foot + 8 - e.y0); ctx.clip(); ctx.drawImage(t.canvas, t.x, t.y); ctx.restore() } });
  }
  return out;
}
/* standing props inside the field are drawn by town-battle together with the units, sorted by depth (v96: view depth + occluders) */
window.TownBattleExtras = () => {
  const out = [], ents = [], D = window.FieldDepth;
  const props = [];
  for (const c of FIELD.cells.values()) if (c.prop && c.prop !== 'pool') { const bg = !!c.big, o = bg ? 1 : .5, p = project(c.u + o, c.v + o), d = D(c.u + o, c.v + o) + .01, b = propBox(c.prop, c.seed, bg), e = { d, x0: p.x - b.w / 2, x1: p.x + b.w / 2, y0: p.y - b.h, foot: p.y }; e.cell = c; out.push({ y: p.y, d, draw: (ctx, t) => { const a = c._fa ?? 1; if (a > .99) return prop(ctx, c.prop, c.u, c.v, c.seed, t, bg); ctx.save(); ctx.globalAlpha = a; prop(ctx, c.prop, c.u, c.v, c.seed, t, bg); ctx.restore() } }); ents.push(e); props.push(e) }
  /* v97.01: tall grass is sorted with everyone else (it used to be drawn last, over units and trees standing behind it) */
  for (const c of FIELD.cells.values()) if (c.k === 'cover') out.push({ d: D(c.u + .5, c.v + .5) + .005, draw: (ctx, t) => cover(ctx, c, t) });
  const st = window.TownBattle?.state?.(); if (st) for (const u of st.units) { u._occ = false; u._occT = false; if (u.hp <= 0 && u.deadAt) continue; const p = project(u.vu, u.vv), h = 128 * (u.boss ? 1.3 : 1), e = { unit: u, d: D(u.vu, u.vv), x0: p.x - 38, x1: p.x + 38, y0: p.y - h, foot: p.y };
    ents.push(e); /* a big tree or rock in front of a unit also leaves its ghost visible */ if (props.some(q => q.d > e.d + .02 && q.x0 < e.x1 - 12 && q.x1 > e.x0 + 12 && q.y0 < e.foot - 30 && q.foot > e.y0 + 30)) u._occ = true }
  /* v97.08 · a tree / rock standing in front of a unit or of the cell under the pointer fades out (Triangle Strategy style), smoothly */
  const hv = hoverCell && (() => { const p = project(hoverCell.u + .5, hoverCell.v + .5); return { d: D(hoverCell.u + .5, hoverCell.v + .5), x: p.x, y: p.y } })(), us = ents.filter(e => e.unit), now = performance.now(), dt = Math.min(.1, (now - (fadeT || now)) / 1000); fadeT = now;
  for (const q of props) { const hit = us.some(e => q.d > e.d + .02 && q.x0 < e.x1 - 10 && q.x1 > e.x0 + 10 && q.y0 < e.foot - 20 && q.foot > e.y0 + 30) || (hv && q.d > hv.d + .02 && hv.x > q.x0 && hv.x < q.x1 && hv.y > q.y0 && hv.y < q.foot);
    const c = q.cell, goal = hit ? .32 : 1; c._fa = (c._fa ?? 1) + (goal - (c._fa ?? 1)) * Math.min(1, dt * 9) }
  const occ = occluders(ents); if (st) for (const u of st.units) if (u._occT) u._occ = true; return out.concat(occ);
};
let fadeGround = null, fadeAt = 0, fadeT = 0;
function turnView(d) {
  if (!window.FieldHeight) return; fadeGround = groundCanvas; fadeAt = performance.now();
  ROT = (ROT + d + 4) & 3; try { localStorage.setItem('projectA.fieldRot', ROT) } catch (e) { }
  FieldHeight.setView(); groundCanvas = null; for (const u of window.TownBattle?.state?.()?.units || []) u._occ = false;
}
/* units face by their walk direction in the field (SE = +u …); on screen that direction turns with the camera */
const DIRS4 = ['SE', 'SW', 'NW', 'NE'];
window.viewDir = d => { const i = DIRS4.indexOf(d); return i < 0 ? d : DIRS4[(i + ROT) & 3] };
const ui = document.createElement('div'); ui.id = 'fieldUi'; ui.innerHTML = `<style>
#fieldUi{position:fixed;right:12px;top:12px;z-index:39;display:flex;flex-direction:column-reverse;align-items:flex-end;gap:8px;font:13px VillageThai,system-ui,sans-serif;color:#f3e9c9;pointer-events:none}
#fieldUi .turn{display:flex;gap:6px;pointer-events:auto}#fieldUi button{width:38px;height:38px;border-radius:50%;border:1px solid #b9c48a88;background:#1b302ae6;color:#f3e9c9;font:18px system-ui;cursor:pointer}
#fieldUi button:hover{background:#2d4a40}#fieldUi .unit{display:none;gap:10px;align-items:center;min-width:250px;padding:8px 12px 8px 8px;border-radius:12px;background:linear-gradient(90deg,#14231ff2,#1b302ae6);border:1px solid #b9c48a55;box-shadow:0 6px 18px #0008}
#fieldUi canvas{width:72px;height:72px;border-radius:10px;border:2px solid #d8c890;background:#0b120f}#fieldUi .unit.foe canvas{border-color:#e2705f}#fieldUi b{font-size:15px}#fieldUi small{color:#cdd7bf}
#fieldUi .cell{display:none;padding:5px 10px;border-radius:9px;background:#14231fe6;border:1px solid #b9c48a44;font-size:12.5px;color:#e6dcc0}
#fieldUi .hp{height:7px;border-radius:4px;background:#0008;overflow:hidden;margin:4px 0 3px}#fieldUi .hp i{display:block;height:100%;background:#6fd18a}#fieldUi .unit.foe .hp i{background:#e2705f}
@media (max-width:820px){#fieldUi .unit{min-width:0}#fieldUi canvas{width:52px;height:52px}}</style>
<div class="unit"><canvas width="144" height="144"></canvas><div><b></b> <small class="side"></small><div class="hp"><i></i></div><small class="stats"></small></div></div>
<div class="turn"><button data-d="-1" title="หมุนกล้องซ้าย (Q)">⟲</button><button data-d="1" title="หมุนกล้องขวา (E)">⟳</button></div>`;
if (window.FieldHeight) document.body.append(ui);
ui.querySelectorAll('button').forEach(b => b.onclick = () => turnView(+b.dataset.d));
addEventListener('keydown', e => { if (e.target.closest?.('input,textarea') || e.repeat) return; const k = e.key.toLowerCase(); if (k === 'q') turnView(-1); else if (k === 'e') turnView(1) });
let hoverCell = null; cv.addEventListener('pointermove', e => { const w = world(e), c = inv(w.x, w.y); hoverCell = { u: Math.floor(c.u), v: Math.floor(c.v) } }); cv.addEventListener('pointerleave', () => hoverCell = null);
let panelAt = 0;
function panel(now) {
  if (now - panelAt < 150 || !window.FieldHeight) return; panelAt = now;
  const st = window.TownBattle?.state?.(), box = ui.querySelector('.unit'); if (!st) { box.style.display = 'none'; return }
  const alive = st.units.filter(u => u.hp > 0), u = (hoverCell && alive.find(x => x.u === hoverCell.u && x.v === hoverCell.v)) || (st.target && alive.find(x => x.id === st.target)) || alive.find(x => x.id === 'hero') || alive[0];
  /* v97.08 · the cell under the pointer: height and ground type */
  { let ci = ui.querySelector('.cell'); if (!ci) { ci = document.createElement('div'); ci.className = 'cell'; ui.append(ci) }
    const k = hoverCell && window.TownBattle?.cells?.()?.get(hoverCell.u + ',' + hoverCell.v), occ = hoverCell && alive.some(x => x.u === hoverCell.u && x.v === hoverCell.v);
    if (!k || occ) ci.style.display = 'none'; else { const L = FieldHeight.level(hoverCell.u, hoverCell.v), KN = { normal: 'พื้นปกติ', slow: 'เดินช้า (2 แต้ม)', cover: 'กำบัง · โดนตี −30%', blocked: 'เดินผ่านไม่ได้' };
      ci.style.display = 'block'; ci.textContent = `ช่อง ▲${Number.isInteger(L) ? L : L.toFixed(1)} · ${KN[k] || k}` } }
  if (!u) { box.style.display = 'none'; return }
  box.style.display = 'flex'; box.classList.toggle('foe', u.side === 'monster');
  const L = FieldHeight.level(u.u, u.v), stats = [u.atk > 0 && 'ATK ' + Math.round(u.atk), u.move != null && 'เดิน ' + u.move, u.range != null && 'ระยะ ' + u.range, 'สูง ' + (Number.isInteger(L) ? L : L.toFixed(1)), u.guard && 'โล่ ' + u.guard, u.stun && 'แข็ง', u.fly && 'บิน'].filter(Boolean);
  box.querySelector('b').textContent = u.name || u.id; box.querySelector('.side').textContent = u.side === 'monster' ? (u.boss ? 'บอส' : 'ศัตรู') : u.id === 'hero' ? 'ตัวเอก' : 'เพื่อน';
  box.querySelector('.hp i').style.width = Math.max(0, Math.min(100, u.hp / (u.maxHp || u.hp) * 100)) + '%'; box.querySelector('.stats').textContent = `HP ${Math.ceil(u.hp)}/${u.maxHp} · ` + stats.join(' · ');
  /* live portrait: the unit cut out of the battle view itself */
  const pc = box.querySelector('canvas'), q = pc.getContext('2d'), p = project(u.vu, u.vv), dpr = devicePixelRatio, k = scale * zoom * dpr;
  const sx = ((p.x - WORLD_W / 2) * scale * zoom + W / 2 + pan.x) * dpr, sy = ((p.y - 82 - WORLD_H / 2) * scale * zoom + H / 2 + pan.y) * dpr, half = 46 * k;
  q.fillStyle = '#0b120f'; q.fillRect(0, 0, 144, 144); try { q.drawImage(cv, sx - half, sy - half, half * 2, half * 2, 0, 0, 144, 144) } catch (e) { }
  const vg = q.createRadialGradient(72, 72, 40, 72, 72, 100); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); q.fillStyle = vg; q.fillRect(0, 0, 144, 144);
}

/* ---------- frame ---------- */
function resize() { W = innerWidth; H = innerHeight; cv.width = Math.round(W * devicePixelRatio); cv.height = Math.round(H * devicePixelRatio); cv.style.width = W + 'px'; cv.style.height = H + 'px'; scale = Math.max(.7, Math.min(1.4, Math.min(W / 900, H / 620))) }
addEventListener('resize', resize); resize();
function frame(t) {
  requestAnimationFrame(frame);
  if (!groundCanvas) paintGround();
  window.TownBattle?.pre?.();
  const dio = window.FieldDiorama && window.FieldHeight;
  g.setTransform(1, 0, 0, 1, 0, 0); if (dio) FieldDiorama.sky(g, cv.width, cv.height, FIELD.biome, FIELD.night, FQ.get('poi')); else { g.fillStyle = FIELD.biome === 'snow' ? '#9aa8b5' : '#1a2016'; g.fillRect(0, 0, cv.width, cv.height) }
  const k = devicePixelRatio * scale * zoom; g.setTransform(k, 0, 0, k, devicePixelRatio * (W / 2 + pan.x) - WORLD_W / 2 * k, devicePixelRatio * (H / 2 + pan.y) - WORLD_H / 2 * k);
  g.drawImage(groundCanvas, groundCanvas.ox, groundCanvas.oy);
  if (fadeGround) { const a = 1 - (performance.now() - fadeAt) / 320; if (a <= 0) fadeGround = null; else { g.globalAlpha = a; g.drawImage(fadeGround, fadeGround.ox, fadeGround.oy); g.globalAlpha = 1 } }
  if (dio) waterFx(g, t);
  const props = [];
  if (!dio) for (const o of FIELD.outer) if (o.prop) props.push([o.prop, o.u, o.v, o.seed]);   // a floating field has no land beyond its edge
  if (!dio) for (const c of FIELD.cells.values()) if (c.prop === 'pool') props.push([c.prop, c.u, c.v, c.seed]);   // flat water stays on the ground (the diorama paints pools as real water)
  props.sort((a, b) => window.FieldDepth(a[1] + .5, a[2] + .5) - window.FieldDepth(b[1] + .5, b[2] + .5));
  for (const p of props) { if (p[0] === 'pool') prop(g, ...p, t) }
  for (const p of props) { if (p[0] !== 'pool') prop(g, ...p, t) }
  window.TownBattle?.draw?.(g, t);
  g.setTransform(1, 0, 0, 1, 0, 0); if (dio) FieldDiorama.grade(g, cv.width, cv.height, FIELD.biome, FIELD.night);
  if (FIELD.night) { g.fillStyle = 'rgba(10,18,55,.42)'; g.fillRect(0, 0, cv.width, cv.height) }
  panel(t);
}
requestAnimationFrame(frame);

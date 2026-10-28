/* v93.04 · Zone-based terrain height for the 2.5D grid. Pure logic (browser + node), no DOM.
   Adapted from the old FFT terrain (tactics-fft-terrain.js) to the new 1x1 cell lattice of village-grid.js.
   Rules carried over: a step of 1 level is walkable, a step of 2+ is a cliff; every walkable cell must be reachable.
   What is new:
   - Levels are small: 0..3 (the old system went to 6).
   - Each zone has a severity 0..1 (SEVERITY by biome, fading in with the distance from the town). Severity controls how much of the
     ground rises: 0 = dead flat (town), ~0.25 = gentle mounds, ~0.9 = mountain / snow peaks. Only zones at CLIFF_SEV or more get cliffs.
   - Noise is sampled at WORLD cell coordinates, so the same region and seed always give the same raw terrain.
   - Forced-flat cells (main roads, places, entrances) stay level 0 and the neighbouring ground rises at most one level per cell.
   Cells are integer (u,v) in the same frame as village-grid.js (one cell = 1 unit of u or v). levels[v*w+u] for 0 <= u < w, 0 <= v < h. */
(function (root) {
  'use strict';
  const MAX_LEVEL = 3, LEVEL_PX = 18, CLIFF_SEV = 0.6, ROUND_BIAS = 0.3;
  const ORIGIN = { x: 2240, y: 1232 }, HALF_W = 28, HALF_H = 14; // same projection as village-grid.js
  const SEVERITY = { town: 0, water: 0, sand: 0.1, swamp: 0.1, grass: 0.25, forest: 0.3, snow: 0.45, hills: 0.55, mountain: 0.9, snowpeak: 0.95 };
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  /* ---------- seeded noise ---------- */
  function seedOf(s) { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
  function hash2(seed, x, y) {
    let h = (seed ^ Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1)) | 0;
    h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  const smooth = t => t * t * (3 - 2 * t);
  function vnoise(seed, x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = smooth(x - x0), fy = smooth(y - y0);
    const a = hash2(seed, x0, y0), b = hash2(seed, x0 + 1, y0), c = hash2(seed, x0, y0 + 1), d = hash2(seed, x0 + 1, y0 + 1);
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const smoothstep = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  function severityOf(zone) {
    if (typeof zone === 'number') return clamp(zone, 0, 1);
    const s = SEVERITY[zone];
    if (s == null) throw new Error('unknown terrain zone: ' + zone);
    return s;
  }

  /* A mask spec -> predicate (u,v) in world cells. Accepts a function, or a list of {u,v} points / {u,v,w,h} rectangles. */
  function maskOf(spec) {
    if (!spec) return () => false;
    if (typeof spec === 'function') return spec;
    const list = Array.from(spec);
    return (u, v) => list.some(r => r.w != null ? u >= r.u && u < r.u + r.w && v >= r.v && v < r.v + r.h : r.u === u && r.v === v);
  }

  /* ---------- generate ---------- */
  /* opts: w, h (cells) · seed · origin {u,v} world cell of local (0,0) · zone (biome key | 0..1) or zoneAt(u,v) per cell ·
     town {u,v,r0,r1}: severity is 0 within r0 cells and reaches the zone's full value at r1 (world cells) ·
     flat (mask of forced level-0 cells) · blocked (mask of cells nobody can enter, e.g. water; they keep a level but join no route) ·
     anchors [{u,v}] world cells that must connect to everything (default: the largest walkable area) · maxLevel (<= 3). */
  function generate(opts) {
    const w = opts.w | 0, h = opts.h | 0;
    if (w < 1 || h < 1) throw new Error('terrain size must be at least 1x1');
    const seed = seedOf(opts.seed ?? 'terrain'), seed2 = (seed ^ 0x9e3779b9) >>> 0;
    const org = opts.origin || { u: 0, v: 0 }, maxLevel = clamp(opts.maxLevel ?? MAX_LEVEL, 1, MAX_LEVEL);
    const flatAt = maskOf(opts.flat), blockedAt = maskOf(opts.blocked), n = w * h;
    const town = opts.town, zoneAt = opts.zoneAt || (() => opts.zone ?? 'grass');

    // 1. severity per cell, then blurred so zone borders fade instead of jumping
    let sev = new Float32Array(n);
    for (let v = 0; v < h; v++) for (let u = 0; u < w; u++) {
      const U = org.u + u, V = org.v + v;
      let s = severityOf(zoneAt(U, V));
      if (town) s *= smoothstep((Math.hypot(U - town.u, V - town.v) - town.r0) / Math.max(1e-6, town.r1 - town.r0));
      sev[v * w + u] = s;
    }
    for (let pass = 0; pass < 2; pass++) {
      const out = new Float32Array(n);
      for (let v = 0; v < h; v++) for (let u = 0; u < w; u++) {
        let sum = 0, cnt = 0;
        for (let dv = -1; dv <= 1; dv++) for (let du = -1; du <= 1; du++) {
          const a = u + du, b = v + dv;
          if (a >= 0 && b >= 0 && a < w && b < h) { sum += sev[b * w + a]; cnt++; }
        }
        out[v * w + u] = sum / cnt;
      }
      sev = out;
    }

    // 2. raw levels from noise x severity (high severity zones are terraced: 0, 1, 3)
    const levels = new Uint8Array(n), flat = new Uint8Array(n), blocked = new Uint8Array(n);
    for (let v = 0; v < h; v++) for (let u = 0; u < w; u++) {
      const i = v * w + u, U = org.u + u, V = org.v + v;
      flat[i] = flatAt(U, V) ? 1 : 0; blocked[i] = blockedAt(U, V) ? 1 : 0;
      const nz = vnoise(seed, U / 7, V / 7) * 0.65 + vnoise(seed2, U / 3.5, V / 3.5) * 0.35;
      const stretched = clamp((nz - 0.5) * 2.4 + 0.5, 0, 1);
      let lv = Math.min(maxLevel, Math.floor(stretched * sev[i] * (maxLevel + 0.6) + ROUND_BIAS));
      if (sev[i] >= CLIFF_SEV && lv === 2) lv = Math.min(maxLevel, 3);
      levels[i] = flat[i] ? 0 : lv;
    }

    // 3. relax: no step above 1 level (2 only between two cliff-zone cells, never next to a flat road), so ground beside a road rises one level per cell at most
    const limit = (i, j) => (!flat[i] && !flat[j] && sev[i] >= CLIFF_SEV && sev[j] >= CLIFF_SEV ? 2 : 1);
    const queue = [], queued = new Uint8Array(n);
    for (let i = 0; i < n; i++) { queue.push(i); queued[i] = 1; }
    for (let head = 0; head < queue.length; head++) {
      const i = queue[head]; queued[i] = 0;
      const u = i % w, v = (i - u) / w;
      for (const [du, dv] of DIRS) {
        const a = u + du, b = v + dv;
        if (a < 0 || b < 0 || a >= w || b >= h) continue;
        const j = b * w + a, cap = levels[i] + limit(i, j);
        if (levels[j] > cap && !flat[j]) { levels[j] = cap; if (!queued[j]) { queued[j] = 1; queue.push(j); } }
      }
      if (head > 4096 && head * 2 > queue.length) { queue.splice(0, head + 1); head = -1; }
    }

    const map = { v: 1, w, h, origin: { u: org.u, v: org.v }, seed: String(opts.seed ?? 'terrain'), maxLevel, levels, flat, blocked, sev };

    // 4. every walkable cell must connect (stairs are carved through cliffs)
    const anchors = (opts.anchors || []).map(a => (a.v - org.v) * w + (a.u - org.u)).filter(i => i >= 0 && i < n);
    connect(map, anchors);
    return map;
  }

  /* ---------- rules ---------- */
  const idx = (m, u, v) => (u >= 0 && v >= 0 && u < m.w && v < m.h) ? v * m.w + u : -1;
  function levelAt(m, u, v) { const i = idx(m, u - m.origin.u, v - m.origin.v); return i < 0 ? null : m.levels[i]; }
  const stepOk = (m, i, j) => !m.blocked[i] && !m.blocked[j] && Math.abs(m.levels[i] - m.levels[j]) <= 1;

  /* Can a walker standing on world cell (u,v) step by (du,dv)? Only cardinal steps. */
  function canStep(m, u, v, du, dv) {
    if (Math.abs(du) + Math.abs(dv) !== 1) return false;
    const i = idx(m, u - m.origin.u, v - m.origin.v), j = idx(m, u + du - m.origin.u, v + dv - m.origin.v);
    return i >= 0 && j >= 0 && stepOk(m, i, j);
  }
  /* Movement cost of a legal step: 1 on the flat, +1 per level climbed, descending is free of extra cost. null = cliff / blocked. */
  function stepCost(m, u, v, du, dv) {
    if (!canStep(m, u, v, du, dv)) return null;
    const up = levelAt(m, u + du, v + dv) - levelAt(m, u, v);
    return 1 + Math.max(0, up);
  }

  function components(m) {
    const comp = new Int32Array(m.w * m.h).fill(-1); let count = 0;
    for (let s = 0; s < comp.length; s++) {
      if (comp[s] >= 0 || m.blocked[s]) continue;
      const q = [s]; comp[s] = count;
      for (let k = 0; k < q.length; k++) {
        const i = q[k], u = i % m.w, v = (i - u) / m.w;
        for (const [du, dv] of DIRS) {
          const a = u + du, b = v + dv; if (a < 0 || b < 0 || a >= m.w || b >= m.h) continue;
          const j = b * m.w + a; if (comp[j] < 0 && stepOk(m, i, j)) { comp[j] = count; q.push(j); }
        }
      }
      count++;
    }
    return { comp, count };
  }

  function connect(m, anchors) {
    for (let round = 0; round < 400; round++) {
      const { comp, count } = components(m);
      if (count <= 1) return;
      const sizes = new Array(count).fill(0); for (const c of comp) if (c >= 0) sizes[c]++;
      const want = new Set(anchors.filter(i => comp[i] >= 0).map(i => comp[i]));
      if (!want.size) want.add(sizes.indexOf(Math.max(...sizes)));
      const main = [...want][0];
      // join the smallest area that is not an anchor area first; anchor areas that are still separate are joined to the first one last
      let target = -1;
      for (let c = 0; c < count; c++) { if (c === main || want.has(c)) continue; if (target < 0 || sizes[c] < sizes[target]) target = c; }
      if (target < 0) { for (const c of want) if (c !== main) { target = c; break; } }
      if (target < 0) return;
      // shortest path from the target area to the main area through any enterable cell
      const prev = new Int32Array(m.w * m.h).fill(-2), q = [];
      for (let i = 0; i < comp.length; i++) if (comp[i] === target) { prev[i] = -1; q.push(i); }
      let hit = -1;
      for (let k = 0; k < q.length && hit < 0; k++) {
        const i = q[k], u = i % m.w, v = (i - u) / m.w;
        for (const [du, dv] of DIRS) {
          const a = u + du, b = v + dv; if (a < 0 || b < 0 || a >= m.w || b >= m.h) continue;
          const j = b * m.w + a; if (prev[j] !== -2 || m.blocked[j]) continue;
          prev[j] = i; if (comp[j] === main) { hit = j; break; } q.push(j);
        }
      }
      if (hit < 0) return; // sealed off by blocked cells: nothing to carve
      const path = []; for (let i = hit; i >= 0; i = prev[i]) path.push(i); // main ... target
      carve(m, path, comp, target);
    }
  }

  /* Stairs along a path from the main area (first cell) to the target area (last cell): heights change by at most one per cell.
     When the two ends are too far apart in height, the ramp keeps going into the target area (a stair cut into the cliff). */
  function carve(m, path, comp, target) {
    let prev = m.levels[path[0]], last = path[0];
    const seen = new Set(path);
    const apply = i => {
      if (m.flat[i]) { prev = 0; return false; }
      const cur = m.levels[i], t = clamp(cur, prev - 1, prev + 1);
      m.levels[i] = t; prev = t; return t !== cur;
    };
    for (let s = 1; s < path.length; s++) { apply(path[s]); last = path[s]; }
    // extend into the target area while the next cell still needs to change
    for (let guard = 0; guard < m.maxLevel + 2; guard++) {
      const u = last % m.w, v = (last - u) / m.w;
      let nxt = -1;
      const dirs = path.length > 1 ? [[u - (path[path.length - 2] % m.w), v - Math.floor(path[path.length - 2] / m.w)], ...DIRS] : DIRS;
      for (const [du, dv] of dirs) {
        const a = u + du, b = v + dv; if (a < 0 || b < 0 || a >= m.w || b >= m.h) continue;
        const j = b * m.w + a; if (!seen.has(j) && comp[j] === target && !m.blocked[j]) { nxt = j; break; }
      }
      if (nxt < 0) break;
      seen.add(nxt);
      const before = m.levels[nxt]; apply(nxt); last = nxt;
      if (m.levels[nxt] === before) break;
    }
  }

  /* validate: every walkable cell is connected, nothing above maxLevel, flat cells are level 0 */
  function validate(m) {
    const { comp, count } = components(m);
    let maxL = 0, bad = 0;
    for (let i = 0; i < m.levels.length; i++) { maxL = Math.max(maxL, m.levels[i]); if (m.flat[i] && m.levels[i] !== 0) bad++; }
    return { ok: count <= 1 && maxL <= m.maxLevel && bad === 0, areas: count, maxLevel: maxL, flatViolations: bad };
  }

  /* Cheapest-cost flood fill from a world cell: { 'u,v': cost } for all cells within `budget` movement points. */
  function reachable(m, u0, v0, budget) {
    const key = (u, v) => u + ',' + v, best = { [key(u0, v0)]: 0 }, open = [[u0, v0, 0]];
    while (open.length) {
      open.sort((a, b) => a[2] - b[2]);
      const [u, v, c] = open.shift(); if (c > best[key(u, v)]) continue;
      for (const [du, dv] of DIRS) {
        const sc = stepCost(m, u, v, du, dv); if (sc == null) continue;
        const nc = c + sc, k = key(u + du, v + dv);
        if (nc <= budget && (best[k] == null || nc < best[k])) { best[k] = nc; open.push([u + du, v + dv, nc]); }
      }
    }
    return best;
  }

  /* Cliff faces for a renderer: every pair of neighbouring cells that differ by 2+ levels (only +u / +v side is listed once). */
  function cliffEdges(m) {
    const out = [];
    for (let v = 0; v < m.h; v++) for (let u = 0; u < m.w; u++) {
      const i = v * m.w + u;
      for (const [du, dv] of [[1, 0], [0, 1]]) {
        const a = u + du, b = v + dv; if (a >= m.w || b >= m.h) continue;
        const d = Math.abs(m.levels[i] - m.levels[b * m.w + a]);
        if (d >= 2) out.push({ u: u + m.origin.u, v: v + m.origin.v, du, dv, drop: d });
      }
    }
    return out;
  }

  /* Screen point of a world cell corner lifted by its level (same projection as VillageGrid.project, z in px). */
  function project(m, u, v) {
    const lv = levelAt(m, Math.floor(u), Math.floor(v)) || 0, z = lv * LEVEL_PX;
    return { x: ORIGIN.x + (u - v) * HALF_W, y: ORIGIN.y + (u + v) * HALF_H - z, z };
  }

  /* Ready-made outdoor scene: biome of the world-map tile + seed of the tile (same tile -> same ground every visit).
     entries: [{u,v}] local cells where the player enters or leaves (map edge, gate). A level-0 road joins each entry to a 3x3 plaza at the
     centre, so the main route is always flat; everything else follows the biome's severity. town {r0,r1} (optional, local cells) keeps the
     ground near the village gate flat and lets it rise with distance. */
  function forScene(o) {
    const w = o.w, h = o.h, cu = Math.floor(w / 2), cv = Math.floor(h / 2), entries = o.entries || [{ u: cu, v: h - 1 }];
    const road = new Set(), add = (u, v) => { if (u >= 0 && v >= 0 && u < w && v < h) road.add(u + ',' + v); };
    for (let du = -1; du <= 1; du++) for (let dv = -1; dv <= 1; dv++) add(cu + du, cv + dv);
    for (const e of entries) {
      for (let u = Math.min(e.u, cu); u <= Math.max(e.u, cu); u++) add(u, e.v);
      for (let v = Math.min(e.v, cv); v <= Math.max(e.v, cv); v++) add(cu, v);
    }
    const flat = (u, v) => road.has(u + ',' + v) || (o.flat ? maskOf(o.flat)(u, v) : false);
    const m = generate({ w, h, seed: o.seed, zone: o.biome, town: o.town, flat, blocked: o.blocked, anchors: entries, maxLevel: o.maxLevel });
    m.entries = entries.map(e => ({ u: e.u, v: e.v }));
    return m;
  }

  /* ---------- save format: run-length string, one digit per cell, e.g. '0*12 1*3 ...' ---------- */
  function pack(m) {
    const parts = []; let run = 1;
    for (let i = 1; i <= m.levels.length; i++) {
      if (i < m.levels.length && m.levels[i] === m.levels[i - 1]) { run++; continue; }
      parts.push(m.levels[i - 1] + (run > 1 ? '*' + run : '')); run = 1;
    }
    return { v: 1, w: m.w, h: m.h, origin: m.origin, seed: m.seed, maxLevel: m.maxLevel, rle: parts.join(' '),
      flat: Array.from(m.flat).reduce((s, f, i) => (f ? s.concat(i) : s), []), blocked: Array.from(m.blocked).reduce((s, f, i) => (f ? s.concat(i) : s), []) };
  }
  function unpack(p) {
    const n = p.w * p.h, levels = new Uint8Array(n); let at = 0;
    for (const tok of p.rle.split(' ')) { const [d, r] = tok.split('*'); for (let k = 0; k < (r ? +r : 1); k++) levels[at++] = +d; }
    if (at !== n) throw new Error('terrain data size mismatch: ' + at + ' vs ' + n);
    const flat = new Uint8Array(n), blocked = new Uint8Array(n);
    for (const i of p.flat || []) flat[i] = 1; for (const i of p.blocked || []) blocked[i] = 1;
    return { v: 1, w: p.w, h: p.h, origin: p.origin, seed: p.seed, maxLevel: p.maxLevel, levels, flat, blocked, sev: new Float32Array(n) };
  }

  const api = { MAX_LEVEL, LEVEL_PX, CLIFF_SEV, SEVERITY, generate, forScene, levelAt, canStep, stepCost, reachable, cliffEdges, validate, project, pack, unpack };
  root.TerrainHeight = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

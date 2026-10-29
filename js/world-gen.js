/* v92.12 · World map of Agrenor — pure logic (browser + node). Seeded hex map (pointy-top, odd-r offset rows), biomes from value noise,
   one river, the home village, three rumoured destinations, roads out of the village, and encounters placed so that the shortest route to any
   destination meets 3–4 battles (plus random ones off the route). The fog itself is just a per-tile `known` level kept by the journey code:
   0 = hidden (black), 1 = explored (dim, remembered), 2 = visible now. */
(function (root) {
  'use strict';
  const NC = root.NORCHORTAL || null;   // v95.22: the real map of Nor'Chorthal (js/world-norchorthal.js); without it the old random map
  const COLS = NC ? NC.cols : 30, ROWS = NC ? NC.rows : 22;
  const BIOME = {
    grass: { name: 'ทุ่งหญ้า', cost: 2, pass: true },
    forest: { name: 'ป่า', cost: 3, pass: true },
    hills: { name: 'เนินเขา', cost: 4, pass: true, sight: 1 },
    mountain: { name: 'ภูเขา', cost: Infinity, pass: false },
    water: { name: 'ทะเลสาบ', cost: Infinity, pass: false },
    swamp: { name: 'บึง', cost: 4, pass: true },
    snow: { name: 'ทุ่งหิมะ', cost: 3, pass: true },
    sand: { name: 'หาดทราย', cost: 2, pass: true },
    ash: { name: 'ทุ่งเถ้าภูเขาไฟ', cost: 3, pass: true },
    volcano: { name: 'ลาวา', cost: Infinity, pass: false }
  };
  const ROAD_COST = 1;
  /* monsters by biome (keys of town-battle MON) */
  const FOES = { grass: ['bandit', 'wolf'], forest: ['wolf', 'bandit', 'bat'], hills: ['kobold', 'bandit', 'bat'], swamp: ['slime', 'bat'], snow: ['wolf', 'kobold'], sand: ['bandit', 'slime', 'gull'], ash: ['kobold', 'bat', 'bandit'] };   // v94.03: bats and gulls fly (ignore heights)
  const DESTS = [
    { id: 'den', name: 'ถ้ำจ่าฝูง', biome: 'forest', boss: 'wolf', icon: 'cave', rumor: 'พรานเล่าว่าเสียงหอนดังมาจากถ้ำลึกกลางป่า ใครเข้าไปไม่เคยกลับมา', reward: 120 },
    { id: 'mine', name: 'เหมืองหินร้าง', biome: 'hills', boss: 'golem', icon: 'mine', rumor: 'คนงานเหมืองหนีออกมากลางดึก บอกว่าหินในเหมืองลุกขึ้นเดินได้', reward: 160 },
    { id: 'ruin', name: 'วิหารจมบึง', biome: 'swamp', boss: 'slime', icon: 'ruin', rumor: 'ระฆังวิหารเก่าในบึงหมอกดังเองทุกคืนข้างแรม', reward: 140 }
  ];

  /* ---------- seeded random + value noise ---------- */
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
  function noise(seed) {
    const R = rng(seed), G = 16, grid = Array.from({ length: (G + 1) * (G + 1) }, () => R()), at = (x, y) => grid[(y % G) * (G + 1) + (x % G)];
    const s = t => t * t * (3 - 2 * t);
    return (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = s(x - xi), fy = s(y - yi), a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy };
  }
  function fbm(n, x, y) { let v = 0, amp = .55, f = 1, tot = 0; for (let o = 0; o < 4; o++) { v += n(x * f, y * f) * amp; tot += amp; amp *= .5; f *= 2 } return v / tot }

  /* ---------- hex geometry (odd-r offset) ---------- */
  const key = (c, r) => c + ',' + r;
  const inside = (c, r) => c >= 0 && r >= 0 && c < COLS && r < ROWS;
  const NB = [[[1, 0], [-1, 0], [0, -1], [-1, -1], [0, 1], [-1, 1]], [[1, 0], [-1, 0], [1, -1], [0, -1], [1, 1], [0, 1]]];
  function neighbors(c, r) { return NB[r & 1].map(([dc, dr]) => [c + dc, r + dr]).filter(([a, b]) => inside(a, b)) }
  function cube(c, r) { const x = c - (r - (r & 1)) / 2, z = r; return [x, -x - z, z] }
  function dist(a, b) { const p = cube(a.c, a.r), q = cube(b.c, b.r); return Math.max(Math.abs(p[0] - q[0]), Math.abs(p[1] - q[1]), Math.abs(p[2] - q[2])) }
  function within(c, r, n) { const out = []; for (let rr = r - n; rr <= r + n; rr++) for (let cc = c - n - 1; cc <= c + n + 1; cc++) if (inside(cc, rr) && dist({ c, r }, { c: cc, r: rr }) <= n) out.push([cc, rr]); return out }

  function stepCost(t) { if (!t || !BIOME[t.biome].pass) return Infinity; return t.road ? ROAD_COST : BIOME[t.biome].cost + (t.river ? 2 : 0) }
  /* cheapest path (Dijkstra) from a to b; ok(tile) may restrict the tiles (e.g. only known ones) */
  function path(w, a, b, ok = () => true) {   // v95.22: binary heap (the real map has ~9,000 hexes)
    const start = key(a.c, a.r), goal = key(b.c, b.r), best = new Map([[start, 0]]), from = new Map(), H = [{ k: start, c: a.c, r: a.r, d: 0 }];
    const push = x => { H.push(x); let i = H.length - 1; while (i) { const p = (i - 1) >> 1; if (H[p].d <= H[i].d) break;[H[p], H[i]] = [H[i], H[p]]; i = p } };
    const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < H.length && H[l].d < H[m].d) m = l; if (r < H.length && H[r].d < H[m].d) m = r; if (m === i) break;[H[m], H[i]] = [H[i], H[m]]; i = m } } return top };
    while (H.length) {
      const cur = pop(); if (cur.k === goal) break; if (cur.d > best.get(cur.k)) continue;
      for (const [nc, nr] of neighbors(cur.c, cur.r)) {
        const t = w.tiles[key(nc, nr)], nk = key(nc, nr); if (nk !== goal && !ok(t)) continue;
        const sc = stepCost(t); if (sc === Infinity) continue;
        const d = cur.d + sc; if (best.has(nk) && best.get(nk) <= d) continue;
        best.set(nk, d); from.set(nk, cur.k); push({ k: nk, c: nc, r: nr, d });
      }
    }
    if (!best.has(goal)) return null;
    const out = []; for (let k = goal; k; k = from.get(k)) { const [c, r] = k.split(',').map(Number); out.unshift({ c, r }); if (k === start) break }
    return out;
  }


  /* ---------- generation ---------- */
  function generate(seed = (Math.random() * 1e9) | 0) {
    if (NC) return fromMap(seed);
    for (let attempt = 0; attempt < 12; attempt++) { const w = tryGenerate(seed + attempt * 7919); if (w) return w }
    throw new Error('world generation failed');
  }
  function tryGenerate(seed) {
    const R = rng(seed), nE = noise(seed ^ 0x51ed), nM = noise(seed ^ 0x9e37), tiles = {};
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const x = c / COLS * 5, y = r / ROWS * 4, edge = Math.min(c, r, COLS - 1 - c, ROWS - 1 - r);
      let e = fbm(nE, x + 3.1, y + 7.7); const m = fbm(nM, x + 11.3, y + 1.9);
      if (edge < 2) e = e * .7 + (edge === 0 ? .35 : .15);                            // rim of mountains around the known world
      let b = 'grass';
      if (e > .7) b = 'mountain'; else if (e > .6) b = 'hills'; else if (e < .3) b = 'water'; else if (e < .34) b = 'sand';
      else if (m > .6 && e < .45) b = 'swamp'; else if (m > .5) b = 'forest';
      if (r < ROWS * .22 && b !== 'water' && b !== 'mountain') b = r < ROWS * .12 || R() < .5 ? 'snow' : b;
      tiles[key(c, r)] = { c, r, biome: b, elev: e, moist: m, road: false, river: false, enc: null, poi: null };
    }
    const T = (c, r) => tiles[key(c, r)];
    /* village: a grass tile near the south-centre */
    let home = null, hb = 1e9;
    for (const t of Object.values(tiles)) { if (!['grass', 'forest'].includes(t.biome)) continue; const d = Math.abs(t.c - COLS / 2) * 1.2 + Math.abs(t.r - ROWS * .7) + R(); if (d < hb) { hb = d; home = t } }
    if (!home) return null;
    for (const [c, r] of within(home.c, home.r, 1)) { const t = T(c, r); if (!BIOME[t.biome].pass) t.biome = 'grass' }
    home.biome = 'grass'; home.poi = { id: 'home', name: 'หมู่บ้านเฟิร์นเวล', icon: 'village' };
    /* river: from the highest hills tile downhill until water or the edge */
    const peaks = Object.values(tiles).filter(t => t.biome === 'hills').sort((a, b) => b.elev - a.elev);
    if (peaks.length) { let cur = peaks[Math.floor(R() * Math.min(4, peaks.length))]; const seen = new Set(); for (let i = 0; i < 40 && cur; i++) { seen.add(key(cur.c, cur.r)); if (cur.biome === 'water') break; if (cur !== home) cur.river = true; const next = neighbors(cur.c, cur.r).map(([c, r]) => T(c, r)).filter(t => !seen.has(key(t.c, t.r))).sort((a, b) => a.elev - b.elev)[0]; if (!next || next.elev > cur.elev + .03) break; cur = next } }
    /* destinations: one per kind, 8–14 hexes away, on (or turned into) its biome, reachable */
    const w = { seed, cols: COLS, rows: ROWS, tiles, home: { c: home.c, r: home.r }, dests: [] };
    for (const d of DESTS) {
      const cands = Object.values(tiles).filter(t => !t.poi && !t.enc && BIOME[t.biome].pass && dist(t, home) >= 8 && dist(t, home) <= 14 && w.dests.every(o => dist(o, t) >= 6));
      cands.sort((a, b) => (b.biome === d.biome) - (a.biome === d.biome) || R() - .5);
      let placed = null;
      for (const t of cands.slice(0, 30)) { const p = path(w, home, t); if (p && p.length >= 8) { placed = t; break } }
      if (!placed) return null;
      placed.biome = d.biome; placed.poi = { ...d }; for (const [c, r] of within(placed.c, placed.r, 1)) { const t = T(c, r); if (!t.poi && t.biome === 'water') t.biome = 'sand' }
      w.dests.push({ ...d, c: placed.c, r: placed.r });
    }
    /* the road out of the village: 3 tiles toward the centre of the map ("leave the village first") */
    let cur = home; home.road = true;
    for (let i = 0; i < 3; i++) { const next = neighbors(cur.c, cur.r).map(([c, r]) => T(c, r)).filter(t => BIOME[t.biome].pass && !t.road).sort((a, b) => Math.abs(a.r - ROWS / 2) - Math.abs(b.r - ROWS / 2) + (R() - .5) * .5)[0]; if (!next) break; next.road = true; cur = next }
    /* encounters: guaranteed battles along each shortest route, then extras */
    const occupied = t => t.enc || t.poi || dist(t, home) < 2;
    for (const d of w.dests) {
      const p = path(w, home, d); if (!p) return null;
      const L = p.length, marks = [.28, .5, .72].map(f => Math.round((L - 1) * f));
      for (const i of marks) {
        const base = T(p[i].c, p[i].r), spots = [base, ...neighbors(base.c, base.r).map(([c, r]) => T(c, r))].filter(t => BIOME[t.biome].pass && !occupied(t));
        const t = spots[0]; if (t) t.enc = { type: 'battle', foe: pick(R, FOES[t.biome] || FOES.grass) };
      }
      const mid = T(p[Math.round(L * .6)].c, p[Math.round(L * .6)].r), nearMid = [mid, ...neighbors(mid.c, mid.r).map(([c, r]) => T(c, r))].find(t => BIOME[t.biome].pass && !occupied(t));
      if (nearMid) nearMid.enc = { type: 'camp' };
    }
    const extras = ['battle', 'battle', 'battle', 'chest', 'chest', 'shrine', 'merchant', 'trap', 'oldmap'];
    for (const t of Object.values(tiles)) {
      if (!BIOME[t.biome].pass || occupied(t) || R() > .11) continue;
      const type = pick(R, extras); t.enc = type === 'battle' ? { type, foe: pick(R, FOES[t.biome] || FOES.grass), hidden: R() < .4 } : { type };   // hidden battles only show when you are next to them
    }
    placeTowns(w, seed);
    return w;
  }
  /* ---------- v95.22 · Nor'Chorthal from the author's map: fixed land, rivers, Fernvale, destinations and towns; the seed only places encounters ---------- */
  const LETTER = { w: 'water', g: 'grass', f: 'forest', h: 'hills', m: 'mountain', M: 'mountain', n: 'snow', s: 'swamp', d: 'sand', a: 'ash', v: 'volcano' };
  function fromMap(seed) {
    const R = rng(seed), tiles = {};
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const ch = NC.grid[r][c], b = LETTER[ch] || 'water';
      tiles[key(c, r)] = { c, r, biome: b, elev: ch === 'M' ? .9 : ch === 'm' ? .75 : .4, moist: .5, road: false, river: NC.river[r][c] === '1' && BIOME[b].pass, enc: null, poi: null };
    }
    const T = (c, r) => tiles[key(c, r)];
    /* the nearest passable hex to a mark (optionally preferring a biome) */
    const snap = (m, want) => { let best = null, bd = 1e9; for (const t of Object.values(tiles)) { if (!BIOME[t.biome].pass) continue; const d = dist(t, { c: m[0], r: m[1] }) + (want && !want.includes(t.biome) ? 3 : 0); if (d < bd) { bd = d; best = t } } return best };
    const home = snap(NC.marks.home, ['grass']);
    for (const [c, r] of within(home.c, home.r, 1)) { const t = T(c, r); if (t.biome !== 'water' && !BIOME[t.biome].pass) t.biome = 'hills' }
    home.biome = 'grass'; home.river = false; home.poi = { id: 'home', name: 'หมู่บ้านเฟิร์นเวล', icon: 'village' };
    const w = { seed, cols: COLS, rows: ROWS, tiles, home: { c: home.c, r: home.r }, dests: [], towns: [], real: 'norchorthal' };
    for (const d of DESTS) {
      const t = snap(NC.marks[d.id], [d.biome]); if (!t) continue;
      t.biome = d.biome; t.river = false; t.poi = { ...d }; w.dests.push({ ...d, c: t.c, r: t.r });
    }
    for (const d of TOWNS) {
      const t = snap(NC.marks[d.id], d.biomes); if (!t || t.poi) continue;
      t.poi = { id: 'town:' + d.id, town: d.id, name: d.name, icon: 'town' }; t.river = false; w.towns.push({ ...d, c: t.c, r: t.r });
    }
    /* every destination and town must be reachable: where a range or a channel cuts one off, open a pass (mountain → hills) or a ford (water → beach) on the cheapest way through */
    for (const t of [...w.dests, ...w.towns]) {
      if (path(w, home, t)) continue;
      const keep = { m: BIOME.mountain, w: BIOME.water }; BIOME.mountain = { ...keep.m, pass: true, cost: 9 }; BIOME.water = { ...keep.w, pass: true, cost: 14 };
      const p = path(w, home, t); BIOME.mountain = keep.m; BIOME.water = keep.w;
      if (p) for (const q of p) { const x = T(q.c, q.r); if (x.biome === 'mountain') x.biome = 'hills'; else if (x.biome === 'water') { x.biome = 'sand'; x.river = false } }
    }
    /* roads: Fernvale to every town, along the cheapest way */
    for (const tw of w.towns) { const p = path(w, home, tw); if (p) for (const q of p) T(q.c, q.r).road = true }
    /* encounters: battles along the way to each destination, a camp half way, then a sprinkle of everything */
    const occupied = t => t.enc || t.poi || t.road || dist(t, home) < 2;
    for (const d of w.dests) {
      const p = path(w, home, d); if (!p) continue;
      const L = p.length;
      for (const f of [.3, .5, .7, .85]) { const base = T(p[Math.round((L - 1) * f)].c, p[Math.round((L - 1) * f)].r), t = [base, ...neighbors(base.c, base.r).map(([c, r]) => T(c, r))].find(x => BIOME[x.biome].pass && !occupied(x)); if (t) t.enc = { type: 'battle', foe: pick(R, FOES[t.biome] || FOES.grass) } }
      const mid = T(p[Math.round(L * .55)].c, p[Math.round(L * .55)].r), nm = [mid, ...neighbors(mid.c, mid.r).map(([c, r]) => T(c, r))].find(x => BIOME[x.biome].pass && !occupied(x)); if (nm) nm.enc = { type: 'camp' };
    }
    const extras = ['battle', 'battle', 'chest', 'chest', 'shrine', 'merchant', 'trap', 'oldmap', 'camp'];
    for (const t of Object.values(tiles)) { if (!BIOME[t.biome].pass || occupied(t) || R() > .055) continue; const type = pick(R, extras); t.enc = type === 'battle' ? { type, foe: pick(R, FOES[t.biome] || FOES.grass), hidden: R() < .4 } : { type } }
    return w;
  }

  /* v94 · settlements outside Fernvale: where the village's visitors come from (js/village-life.js `from`). Safe stops on the map: inn, shop,
     rumours, and the travellers who are away from Fernvale that day. Placed after everything else with their own random stream, so a saved
     world keeps its roads, destinations and encounters. A town that finds no spot is simply left out. */
  const TOWNS = [
    { id: 'brookmere', name: 'หมู่บ้านบรู๊คเมียร์', min: 3, max: 6, side: 'west', biomes: ['grass', 'forest'] },
    { id: 'haven', name: 'ท่าเรือซอลต์เฮเวน', min: 7, max: 13, side: 'coast', biomes: ['sand', 'grass'] },
    { id: 'northgate', name: 'ด่านหินเหนือ', min: 6, max: 12, side: 'north', biomes: ['hills', 'snow', 'grass'] }
  ];
  function placeTowns(w, seed) {
    const R = rng(seed ^ 0x70b5), T = (c, r) => w.tiles[key(c, r)], home = w.home; w.towns = [];
    const nearWater = t => neighbors(t.c, t.r).some(([c, r]) => T(c, r).biome === 'water');
    for (const d of TOWNS) {
      const score = t => (d.side === 'west' ? t.c - home.c : d.side === 'north' ? t.r - home.r : nearWater(t) ? -20 : 0) + (d.biomes.includes(t.biome) ? -3 : 0) + R() * 2;
      const cands = Object.values(w.tiles).filter(t => !t.poi && BIOME[t.biome].pass && dist(t, home) >= d.min && dist(t, home) <= d.max && w.dests.every(o => dist(o, t) >= 3) && w.towns.every(o => dist(o, t) >= 4)).sort((a, b) => score(a) - score(b));
      const spot = cands.slice(0, 20).find(t => path(w, home, t)); if (!spot) continue;
      spot.poi = { id: 'town:' + d.id, town: d.id, name: d.name, icon: 'town' }; spot.enc = null;
      w.towns.push({ ...d, c: spot.c, r: spot.r });
    }
  }
  const pick = (R, a) => a[Math.floor(R() * a.length)];
  /* how deep into the fog a tile is: 0 at the village … 1 at the far rim (monsters get tougher) */
  function danger(w, t) { return Math.min(1, dist(t, w.home) / (w.real ? 30 : 14)) }

  generate.real = NC ? 'norchorthal' : null;
  const api = { COLS, ROWS, BIOME, FOES, DESTS, TOWNS, rng, key, inside, neighbors, dist, within, stepCost, path, generate, danger };
  root.WorldGen = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

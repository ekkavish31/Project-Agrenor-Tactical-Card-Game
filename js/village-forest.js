/* v97.47 · the edge of the map is a dense forest around Fernvale (user's choice until walls/palisades get art — docs/TODO.md V9).
   • The village outline: per angular sector (from the middle of all places) the farthest footprint corner + a margin, smoothed.
   • Outside it, out to the world edge, tree clusters are scattered (seeded, so the forest is the same every visit): broadleaf, old oak,
     round trees, pines, conifers, a blossom tree now and then, bushes and rock clusters underneath.
   • Kept clear: the exit roads (a corridor along each dirt road to the six gates and the dock), the biome patches at the gates
     (snow, sand, sea, swamp — js/village-biomes.js has its own props there), painted water, roads and footprints.
   • The forest belt blocks walking (blocks(u,v)), except those corridors — so the gates are the only ways out.
   objects() feeds the depth-sorted draw list of village-town.html, like TownBiome.objects(). */
(function (root) {
  'use strict';
  const TREES = [['broadleaf', 230, 5], ['old-oak', 250, 3], ['tree-round', 190, 4], ['tree-round-2', 175, 3], ['pine', 215, 4], ['tree-conifer', 200, 3], ['tree-blossom', 185, .35]];
  const UNDER = [['bush-small', 74, 5], ['rock-cluster', 66, 2], ['tall-grass', 64, 3]];
  const img = {}; for (const [n] of [...TREES, ...UNDER]) { const im = new Image(); im.onload = () => { try { terrainDirty = true } catch (e) { } }; im.src = 'assets/village-town/nature/' + n + '.webp'; img[n] = im }
  const SECT = 48, MARGIN = 230, CORRIDOR = 190;
  let rim = null, items = null, mid = null, roadsAt = null;
  const rng = s => () => { s = Math.imul(s ^ s >>> 15, 2246822507) + 0x9e3779b9 | 0; return ((s >>> 0) % 100000) / 100000 };
  const pick = (list, r) => { const tot = list.reduce((a, x) => a + x[2], 0); let k = r() * tot; for (const x of list) if ((k -= x[2]) <= 0) return x; return list[0] };
  /* screen-space distance with the iso squash undone (y × 2) */
  const sd = (ax, ay, bx, by) => Math.hypot(ax - bx, (ay - by) * 2);
  function outline() {
    const locs = root.locations || (typeof locations !== 'undefined' ? locations : []); if (!locs.length) return false;
    const pts = [];
    for (const o of locs) { const e = typeof estate === 'function' ? estate(o) : null; if (!e) { const c = center(o), p = project(c.u, c.v); pts.push(p); continue }
      for (const [u, v] of [[e.left, e.back], [e.right, e.back], [e.right, e.front], [e.left, e.front]]) { const c = canonical(o, e.u + u, e.v + v); pts.push(project(c.u, c.v)) } }
    mid = { x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length };
    const R = new Array(SECT).fill(0);
    for (const p of pts) { const a = Math.atan2((p.y - mid.y) * 2, p.x - mid.x), k = ((Math.round(a / (2 * Math.PI) * SECT) % SECT) + SECT) % SECT, d = sd(p.x, p.y, mid.x, mid.y); for (const j of [-1, 0, 1]) { const kk = (k + j + SECT) % SECT; R[kk] = Math.max(R[kk], d * (j ? .92 : 1)) } }
    const S = R.map((_, i) => (R[(i + SECT - 1) % SECT] + 2 * R[i] + R[(i + 1) % SECT]) / 4 + MARGIN);
    rim = S; return true;
  }
  const rimAt = (x, y) => { const a = Math.atan2((y - mid.y) * 2, x - mid.x), f = ((a / (2 * Math.PI) * SECT) % SECT + SECT) % SECT, i = Math.floor(f), t = f - i; return rim[i] * (1 - t) + rim[(i + 1) % SECT] * t };
  function corridorDist(x, y) {   /* distance to the nearest exit road (dirt roads to the gates) */
    const lines = typeof roadExitLines !== 'undefined' ? roadExitLines : []; let best = 1e9;
    for (const L of lines) for (let i = 0; i < L.length - 1; i++) { const a = L[i], b = L[i + 1], dx = b.x - a.x, dy = (b.y - a.y) * 2, l2 = dx * dx + dy * dy || 1; let t = ((x - a.x) * dx + (y - a.y) * 2 * dy) / l2; t = Math.max(0, Math.min(1, t)); best = Math.min(best, Math.hypot(x - (a.x + dx * t), (y - a.y) * 2 - dy * t)) }
    try { for (const e of exitDoors()) { const p = project(e.u, e.v); best = Math.min(best, sd(x, y, p.x, p.y) * .8) } } catch (e) { }
    return best;
  }
  /* is this world pixel forest ground? (outside the village outline, not in a corridor, not a gate biome, not water / road) */
  function forestAt(x, y) {
    if (!rim && !outline()) return false;
    if (sd(x, y, mid.x, mid.y) < rimAt(x, y)) return false;
    if (root.TownBiome?.at?.(x, y)) return false;
    const P = root.TownPaint; if (P && P.walk(x, y) !== 0) return false;
    try { if (roadHit(x, y, 60)) return false } catch (e) { }
    return corridorDist(x, y) > CORRIDOR;
  }
  function build() {
    if (!outline()) return [];
    const r = rng(97047), out = [], W = WORLD_W, H = WORLD_H, step = 78;
    for (let y = 30; y < H + 40; y += step * .5) for (let x = 20; x < W; x += step) {
      const jx = x + (r() - .5) * step * .9 + ((y / (step * .5)) & 1 ? step / 2 : 0), jy = y + (r() - .5) * step * .45;
      if (!forestAt(jx, jy)) { r(); r(); continue }
      const depth = sd(jx, jy, mid.x, mid.y) - rimAt(jx, jy);   /* thinner at the forest edge, dense inside */
      if (depth < 120 && r() < .45) continue;
      const T = pick(TREES, r), w = T[1] * (.8 + r() * .45);
      out.push({ n: T[0], x: jx, y: jy, w, flip: r() < .5, tree: true });
      if (r() < .55) { const U = pick(UNDER, r), a = r() * 6.283; out.push({ n: U[0], x: jx + Math.cos(a) * 46, y: jy + 12 + Math.sin(a) * 18, w: U[1] * (.8 + r() * .5), flip: r() < .5 }) }
    }
    return out;
  }
  function objects() {
    if (!items) { items = build(); }
    return items.filter(q => img[q.n]?.complete && img[q.n].naturalWidth).map(q => ({ x: q.x, y: q.y, draw: g => { const im = img[q.n], h = q.w * im.naturalHeight / im.naturalWidth; g.save(); g.translate(q.x, q.y); if (q.flip) g.scale(-1, 1); TownArt.draw(g, im, null, [-q.w / 2, -h * .93, q.w, h], null); g.restore() } }));
  }
  /* walking: the forest belt is closed (only the exit corridors lead out) */
  const memo = new Map();
  function blocks(u, v) {
    const k = u + ',' + v; let b = memo.get(k); if (b !== undefined) return b;
    const p = project(u, v); b = forestAt(p.x, p.y); if (memo.size > 200000) memo.clear(); memo.set(k, b); return b;
  }
  root.VillageForest = { objects, blocks, forestAt, reset: () => { rim = null; items = null; memo.clear() }, get count() { return items?.length || 0 } };
})(window);

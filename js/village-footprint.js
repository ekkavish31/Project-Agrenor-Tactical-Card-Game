/* Village footprints: the ground area every place (and small item) claims on the isometric grid. Pure math, no DOM.
   A place stores its footprint in its OWN axes as extents from its centre, in cells: { u0, u1, v0, v1 }
   (area = u from -u0 to +u1 and v from -v0 to +v1). Places that face SE swap the two axes in the world
   (same rule as canonical() in village-town.html). Default = the old hard-coded half sizes w,d rounded OUTWARD
   to half a cell. The user can pull any edge in (or out) in steps of half a cell; the result is saved on the place as `fp`.
   Items inside a place use plain world rectangles ({iu,iv,w,h} in quarter cells, see VillageGrid.rectFromCells). */
(function (root) {
  'use strict';
  const G = root.VillageGrid || (typeof require !== 'undefined' ? require('./village-grid.js') : null);
  const Q = 4, MAX = 12, EPS = 1e-9;
  const up = v => Math.ceil(v * 2 - EPS) / 2;               // round outward to half a cell
  const q4 = v => Math.round(v * 2) / 2;                      // nearest half cell (the finest grid step)

  const okFp = f => !!f && ['u0', 'u1', 'v0', 'v1'].every(k => Number.isFinite(f[k]) && f[k] >= 0.5 && f[k] <= MAX);
  /* Automatic footprint. When the artwork is known (o.fpAuto, set from the picture, never saved) it is used; before the
     picture has loaded the old hand-tuned half sizes w,d are the fallback. */
  function defaultFp(o) { return okFp(o && o.fpAuto) ? { ...o.fpAuto } : { u0: up(o.w), u1: up(o.w), v0: up(o.d), v1: up(o.d) } }

  /* From the picture's visible size in screen px: width = one side of the base, height/2 = the other side.
     One cell is 56px wide, so a side of the base is  width/56  and  (height/2)/28  =  height/56  cells.
     Local u gets the width side, local v the height side; split evenly around the centre, rounded outward to half a cell. */
  function autoFromArt(widthPx, heightPx) {
    const lu = widthPx / 56, lv = heightPx / 56;
    return { u0: up(lu / 2), u1: up(lu / 2), v0: up(lv / 2), v1: up(lv / 2) };
  }

  /* The footprint in use: saved `fp` when it is valid, otherwise the default. */
  function fpOf(o) {
    const f = o && o.fp;
    if (okFp(f)) {
      return { u0: q4(f.u0), u1: q4(f.u1), v0: q4(f.v0), v1: q4(f.v1) };
    }
    return defaultFp(o);
  }
  const isCustom = o => !!(o && o.fp && fpOf(o) && JSON.stringify(fpOf(o)) !== JSON.stringify(defaultFp(o)));

  /* World rectangle (quarter-cell integers) of a place whose centre is `c` = {u,v} in world cells. */
  function worldRect(o, c, fp = fpOf(o)) {
    const se = o.facing === 'SE';
    const uLo = c.u - (se ? fp.v0 : fp.u0), uHi = c.u + (se ? fp.v1 : fp.u1);
    const vLo = c.v - (se ? fp.u0 : fp.v0), vHi = c.v + (se ? fp.u1 : fp.v1);
    return G.rectFromCells(uLo, vLo, uHi - uLo, vHi - vLo);
  }

  /* Corner points (world cells) of a rect from worldRect, for drawing. */
  function corners(r) {
    const u0 = r.iu / Q, v0 = r.iv / Q, u1 = (r.iu + r.w) / Q, v1 = (r.iv + r.h) / Q;
    return [{ u: u0, v: v0 }, { u: u1, v: v0 }, { u: u1, v: v1 }, { u: u0, v: v1 }];
  }

  /* Ids of rects (from `others`: [{id, rect}]) that overlap `rect`. */
  const hits = (rect, others) => others.filter(x => G.overlaps(rect, x.rect)).map(x => x.id);

  /* Nearest free centre to `cand` ({u,v}, already on the lattice) where `makeRect(centre)` overlaps nothing.
     Search moves along the lattice step of `mode`, so a blocked drop slides to the closest free spot,
     which is flush against the neighbour's edge. Returns { u, v, moved, hit } (hit = ids at the requested spot). */
  function nearestFree(makeRect, cand, others, mode, maxSteps = 40) {
    const first = hits(makeRect(cand), others);
    if (!first.length) return { u: cand.u, v: cand.v, moved: false, hit: [] };
    const s = G.stepCells(mode);
    let best = null;
    for (let r = 1; r <= maxSteps; r++) {
      if (best && r * s > best.d + EPS) break;
      for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) {
        if (Math.max(Math.abs(i), Math.abs(j)) !== r) continue;
        const c = { u: G.snapCell(cand.u + i * s, mode), v: G.snapCell(cand.v + j * s, mode) };
        const d = Math.hypot(c.u - cand.u, c.v - cand.v);
        if (best && d >= best.d - EPS) continue;
        if (!hits(makeRect(c), others).length) best = { u: c.u, v: c.v, d };
      }
    }
    return best ? { u: best.u, v: best.v, moved: true, hit: first } : { u: cand.u, v: cand.v, moved: false, hit: first };
  }

  /* Edit helpers. edge: 'u0' | 'u1' | 'v0' | 'v1'. delta in cells (negative = pull in). Never below half a cell. */
  function nudgeEdge(fp, edge, delta) {
    const n = { ...fp };
    n[edge] = Math.max(0.5, Math.min(MAX, q4(n[edge] + delta)));
    return n;
  }
  function nudgeAll(fp, delta) { return nudgeEdge(nudgeEdge(nudgeEdge(nudgeEdge(fp, 'u0', delta), 'u1', delta), 'v0', delta), 'v1', delta) }

  const api = { defaultFp, autoFromArt, fpOf, isCustom, worldRect, corners, hits, nearestFree, nudgeEdge, nudgeAll, MAX };
  root.VillageFootprint = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

/* Village grid, Phase 1 (read-only): pure math, no DOM. Nothing loads this file yet.
   World frame = village-town.html:  project(u,v) = (2240 + (u-v)*28, 1232 + (u+v)*14); one cell = 1 unit of u or v.
   Snap modes: '2x2' (default) = steps of 0.5 cell, '4x4' = steps of 0.25 cell. Every 2x2 point is also a 4x4 point,
   so switching mode never moves an item that is already snapped.
   Items store offsets (du,dv) from their owner's centre. An owner facing SE swaps the two local axes
   (see canonical() in village-town.html), so a snapped position is computed in world cells and converted back.
   Stored data is unchanged: callers round the returned offsets themselves (the layout file keeps 3 decimals). */
(function (root) {
  'use strict';
  const ORIGIN = { x: 2240, y: 1232 }, HALF_W = 28, HALF_H = 14, QUARTERS = 4;
  const MODES = { '2x2': 2, '4x4': 1 }; // snap step, in quarter-cells
  const DEFAULT_MODE = '2x2';

  function stepQuarters(mode = DEFAULT_MODE) {
    const s = MODES[mode];
    if (!s) throw new Error('unknown grid mode: ' + mode);
    return s;
  }
  const stepCells = mode => stepQuarters(mode) / QUARTERS;

  /* Nearest grid line for one world-cell coordinate. `|| 0` turns -0 into 0. */
  function snapCell(v, mode) {
    const st = stepQuarters(mode);
    return (Math.round(v * QUARTERS / st) * st / QUARTERS) || 0;
  }

  /* Same projection as village-town.html (z lifts a point up the screen). */
  function project(u, v, z = 0) {
    return { x: ORIGIN.x + (u - v) * HALF_W, y: ORIGIN.y + (u + v) * HALF_H - z };
  }
  function unproject(x, y) {
    const a = (x - ORIGIN.x) / HALF_W, b = (y - ORIGIN.y) / HALF_H;
    return { u: (a + b) / 2, v: (b - a) / 2 };
  }

  /* Owner-local offset <-> world cells. centre = owner centre in world cells {u,v}; mirror = owner faces SE. */
  function offsetToWorld(centre, mirror, du, dv) {
    return mirror ? { u: centre.u + dv, v: centre.v + du } : { u: centre.u + du, v: centre.v + dv };
  }
  function worldToOffset(centre, mirror, u, v) {
    const a = u - centre.u, b = v - centre.v;
    return mirror ? { du: b, dv: a } : { du: a, dv: b };
  }

  /* Snap one owner-local offset so the item lands on the world lattice. Returns exact (unrounded) values. */
  function snapOffset(centre, mirror, du, dv, mode = DEFAULT_MODE) {
    const w = offsetToWorld(centre, mirror, du, dv);
    const U = snapCell(w.u, mode), V = snapCell(w.v, mode);
    const o = worldToOffset(centre, mirror, U, V);
    const p0 = project(w.u, w.v), p1 = project(U, V);
    return {
      du: o.du, dv: o.dv, world: { u: U, v: V },
      moveCells: Math.hypot(U - w.u, V - w.v),
      movePx: Math.hypot(p1.x - p0.x, p1.y - p0.y)
    };
  }

  /* Dry run for a whole map. items: [{ id, kind, centre, mirror, du, dv }]. Changes nothing; returns the plan. */
  function planResnap(items, mode = DEFAULT_MODE) {
    const moves = items.map(it => {
      const r = snapOffset(it.centre, !!it.mirror, it.du, it.dv, mode);
      return { id: it.id, kind: it.kind, from: { du: it.du, dv: it.dv }, to: { du: r.du, dv: r.dv }, moveCells: r.moveCells, movePx: r.movePx };
    });
    const px = moves.map(m => m.movePx).sort((a, b) => a - b), n = px.length;
    return {
      mode, count: n,
      moved: moves.filter(m => m.movePx > 0.5).length,
      meanPx: n ? px.reduce((s, x) => s + x, 0) / n : 0,
      p90Px: n ? px[Math.min(n - 1, Math.floor(n * 0.9))] : 0,
      maxPx: n ? px[n - 1] : 0,
      moves
    };
  }

  /* Footprints are rectangles in whole quarter-cells: { iu, iv, w, h } (w runs along u, h along v). */
  function rectFromCells(u, v, w, h) {
    return { iu: Math.round(u * QUARTERS), iv: Math.round(v * QUARTERS), w: Math.round(w * QUARTERS), h: Math.round(h * QUARTERS) };
  }
  function overlaps(a, b) {
    return a.iu < b.iu + b.w && b.iu < a.iu + a.w && a.iv < b.iv + b.h && b.iv < a.iv + a.h;
  }
  function findOverlaps(rect, others) { return others.filter(o => overlaps(rect, o)); }

  const api = {
    MODES: Object.keys(MODES), DEFAULT_MODE, QUARTERS, ORIGIN,
    stepCells, snapCell, project, unproject,
    offsetToWorld, worldToOffset, snapOffset, planResnap,
    rectFromCells, overlaps, findOverlaps
  };
  root.VillageGrid = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

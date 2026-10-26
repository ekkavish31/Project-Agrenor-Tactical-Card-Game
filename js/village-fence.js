/* v91.4 · Village fences, rebuilt. Pure planning math (no DOM) + the saved config.
   A fence is a CHAIN of one picture ("piece") laid along each of the 4 edges of the footprint (the blue grid area),
   inset a little so the pieces sit just inside the outermost cells. Every side picks its own piece or is closed ('none').
   Corners connect (each side runs the full edge, so the ends meet). Gaps are cut where the yellow walk cells touch an
   edge, plus the gate width. A piece carries its own snap spec: len = cells along the edge it covers, over = extra px
   so neighbours overlap (hedge ≈ edge to edge, stone wall ≈ posts overlapping), h = size factor, dy = px down, anc = share of
   the picture that stands above the ground line.
   Config (saved in the layout as `fence`): { pieces:{id:{name,src,len,over,h,dy,anc}}, places:{placeId:{sides:{back,left,right,front},gate}} } */
(function (root) {
  'use strict';
  const BUILTIN = {
    wood: { name: 'รั้วไม้', src: 'fence-picket', len: 2, over: 26, h: 1, dy: 6, anc: .7 },
    stone: { name: 'กำแพงหิน (เสาทับกัน)', src: 'stone-wall-low', len: 2, over: 22, h: 1, dy: 6, anc: .7 },
    hedge: { name: 'แนวพุ่มไม้ (ขอบชนขอบ)', src: 'hedge-row', len: 2, over: 8, h: 1, dy: 6, anc: .66 }
  };
  const SIDES = ['back', 'left', 'right', 'front'], INSET = .25, MAX_PIECES = 400;
  let cfg = { pieces: {}, places: {} };
  const clean = c => {
    const out = { pieces: {}, places: {} }, num = (v, d, a, b) => Number.isFinite(+v) ? Math.max(a, Math.min(b, +v)) : d;
    if (c && typeof c === 'object') {
      for (const [id, p] of Object.entries(c.pieces || {})) {
        if (!/^[\w-]{1,24}$/.test(id) || !p || typeof p.src !== 'string' || p.src.length > 200 || /^\s*(javascript|data):/i.test(p.src)) continue;
        out.pieces[id] = { name: String(p.name || id).slice(0, 40), src: p.src, len: num(p.len, 2, .5, 8), over: num(p.over, 10, -40, 120), h: num(p.h, 1, .3, 3), dy: num(p.dy, 6, -60, 80), anc: num(p.anc, .7, .2, 1) };
      }
      for (const [id, pl] of Object.entries(c.places || {})) {
        if (!pl || typeof pl !== 'object') continue;
        const o = {};
        if (pl.sides && typeof pl.sides === 'object') { o.sides = {}; for (const s of SIDES) if (typeof pl.sides[s] === 'string' && pl.sides[s].length < 30) o.sides[s] = pl.sides[s] }
        if (Number.isFinite(+pl.gate)) o.gate = num(pl.gate, 2, .5, 8);
        if (o.sides || o.gate != null) out.places[id] = o;
      }
    }
    return out;
  };
  const set = c => { cfg = clean(c) };
  const get = () => (Object.keys(cfg.pieces).length || Object.keys(cfg.places).length) ? JSON.parse(JSON.stringify(cfg)) : null;
  const pieceOf = key => key && key !== 'none' ? (cfg.pieces[key] || BUILTIN[key] || null) : null;
  const allPieces = () => ({ ...BUILTIN, ...cfg.pieces });

  /* the fence a place had before the rebuild, as a starting point so nothing vanishes */
  function legacySides(profile) {
    if (profile === 'fence') return { back: 'wood', left: 'wood', right: 'wood', front: 'wood' };
    if (profile === 'hedge') return { back: 'hedge', left: 'hedge', right: 'hedge', front: 'none' };
    if (profile === 'garden') return { back: 'none', left: 'hedge', right: 'hedge', front: 'none' };
    return { back: 'none', left: 'none', right: 'none', front: 'none' };
  }
  const sidesOf = (id, profile) => ({ ...legacySides(profile), ...(cfg.places[id]?.sides || {}) });
  const gateOf = id => cfg.places[id]?.gate ?? 2;      // half width of the entrance, in cells

  /* gaps (own axes, in cells along each edge) where the entrance goes: every yellow cell that touches an edge
     (widened to at least the gate), or - when none does - the gate centred on the front edge. */
  function gaps(fp, cells, gate) {
    const g = { back: [], left: [], right: [], front: [] }, wide = (a, b) => { const m = (a + b) / 2, h = Math.max((b - a) / 2, gate); return [m - h, m + h] };
    for (const [iu, iv] of cells || []) {
      const u0 = iu / 2, u1 = (iu + 1) / 2, v0 = iv / 2, v1 = (iv + 1) / 2;
      if (iv <= -2 * fp.v0) g.back.push(wide(u0, u1));
      if (v1 >= fp.v1 - 1e-9) g.front.push(wide(u0, u1));
      if (iu <= -2 * fp.u0) g.left.push(wide(v0, v1));
      if (u1 >= fp.u1 - 1e-9) g.right.push(wide(v0, v1));
    }
    if (!SIDES.some(s => g[s].length)) g.front.push([-gate, gate]);
    return g;
  }

  /* o: { id, facing }, c: place centre {u,v} (world cells), fp: {u0,u1,v0,v1}, cells: court cells, profile: legacy border profile.
     Returns pieces [{ side, key, A:{u,v}, B:{u,v} }] in WORLD cells. */
  function plan(o, c, fp, cells, profile) {
    const sides = sidesOf(o.id, profile), gp = gaps(fp, cells, gateOf(o.id)), se = o.facing === 'SE', out = [];
    const W = (du, dv) => se ? { u: c.u + dv, v: c.v + du } : { u: c.u + du, v: c.v + dv };
    const lo = { u: -fp.u0 + INSET, v: -fp.v0 + INSET }, hi = { u: fp.u1 - INSET, v: fp.v1 - INSET };
    const edge = { back: ['u', lo.v, lo.u, hi.u], front: ['u', hi.v, lo.u, hi.u], left: ['v', lo.u, lo.v, hi.v], right: ['v', hi.u, lo.v, hi.v] };
    for (const s of SIDES) {
      const pc = pieceOf(sides[s]);
      if (!pc) continue;
      const [axis, fix, a, b] = edge[s], n = Math.max(1, Math.round((b - a) / pc.len));
      for (let k = 0; k < n && out.length < MAX_PIECES; k++) {
        const t0 = a + (b - a) * k / n, t1 = a + (b - a) * (k + 1) / n, m = (t0 + t1) / 2;
        if (gp[s].some(([x, y]) => m > x && m < y)) continue;
        const P = t => axis === 'u' ? W(t, fix) : W(fix, t);
        out.push({ side: s, key: sides[s], A: P(t0), B: P(t1) });
      }
    }
    return out;
  }
  const api = { BUILTIN, SIDES, set, get, clean, pieceOf, allPieces, legacySides, sidesOf, gateOf, gaps, plan, cfg: () => cfg };
  root.VillageFence = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

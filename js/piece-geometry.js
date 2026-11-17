/* v98.408 · Shared geometry for the detailed piece editor and the actual map.
   Art transforms are independent of the order and walk-block footprints. */
(function (root) {
  'use strict';
  const matrix = o => Array.isArray(o.pm) && o.pm.length === 4 && o.pm.every(Number.isFinite) ? o.pm : [1, 0, 0, 1];
  const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3]];
  function apply(q, o) { q.translate(o.artX || 0, o.artY || 0); q.transform(...matrix(o), 0, 0) }
  /* v98.499 · free-form zones: o.zo (blue/order) and o.zb (red/block) = painted cells [i, j] of H×H units, local to the piece (the frame offsets orderU/V · blockU/V still move the whole shape).
     A shape becomes merged boxes (.parts) — the depth rule (DepthStyle) and the walk-block test already understand composite boxes (L / U shapes). Without a mask nothing changes. */
  const H = .5;
  const cellsOf = a => Array.isArray(a) ? a.filter(c => Array.isArray(c) && Number.isInteger(c[0]) && Number.isInteger(c[1])) : [];
  function mergeCells(cells, du = 0, dv = 0) {   // horizontal runs per row, then identical runs of neighbouring rows are stacked into one box
    const rows = new Map(); for (const [i, j] of cells) { if (!rows.has(j)) rows.set(j, new Set()); rows.get(j).add(i) }
    const runs = []; for (const [j, set] of [...rows].sort((a, b) => a[0] - b[0])) { const is = [...set].sort((a, b) => a - b); let s0 = is[0], p = is[0]; for (let k = 1; k <= is.length; k++) { if (is[k] === p + 1) { p = is[k]; continue } runs.push({ i0: s0, i1: p, j0: j, j1: j }); s0 = is[k]; p = is[k] } }
    const out = []; for (const r of runs) { const m = out.find(q => q.i0 === r.i0 && q.i1 === r.i1 && q.j1 === r.j0 - 1); if (m) m.j1 = r.j1; else out.push({ ...r }) }
    return out.map(r => ({ u0: r.i0 * H + du, u1: (r.i1 + 1) * H + du, v0: r.j0 * H + dv, v1: (r.j1 + 1) * H + dv }));
  }
  const swapCells = a => cellsOf(a).map(([i, j]) => [j, i]);
  const snapOff = (off, size, on = true) => on ? Math.round((off - size / 2) / H) * H + size / 2 : off;
  function footprint(o, u = 0, v = 0, block = false) {
    const mask = cellsOf(block ? o.zb : o.zo);
    if (mask.length) {
      const parts = mergeCells(mask, u + ((block ? o.blockU : o.orderU) || 0), v + ((block ? o.blockV : o.orderV) || 0));
      const bb = { u0: Math.min(...parts.map(p => p.u0)), u1: Math.max(...parts.map(p => p.u1)), v0: Math.min(...parts.map(p => p.v0)), v1: Math.max(...parts.map(p => p.v1)) };
      return parts.length > 1 ? { ...bb, parts } : bb;
    }
    const w = block ? (o.fw ?? .5) : (o.sw ?? o.fw ?? .5), h = block ? (o.fh ?? .5) : (o.sh ?? o.fh ?? .5);
    u += (block ? o.blockU : o.orderU) || 0; v += (block ? o.blockV : o.orderV) || 0;
    return { u0: u - w / 2, u1: u + w / 2, v0: v - h / 2, v1: v + h / 2 };
  }
  function edges(points) {
    if (points.length !== 3 || !points.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))) return null;
    const [L, M, R] = points.slice().sort((a, b) => a.x - b.x);
    if (M.x - L.x < 3 || R.x - M.x < 3) return null;
    const m1 = (M.y - L.y) / (M.x - L.x), m2 = (R.y - M.y) / (R.x - M.x), k = m1 - m2;
    return { L, M, R, m1, m2, a1: Math.atan(m1) * 180 / Math.PI, a2: -Math.atan(m2) * 180 / Math.PI, ok: k > .02 && k < 40 };
  }
  /* Same 2:1 base correction as Object Asset Studio. Applied AFTER the existing
     rotate/flip/slant, so a previously edited picture is measured as displayed. */
  function fit(points, mode = 'balanced', previous = [1, 0, 0, 1]) {
    const E = edges(points); if (!E?.ok) return null;
    const k = E.m1 - E.m2, a = mode === 'height' ? k : mode === 'width' ? 1 : Math.sqrt(k), d = mode === 'height' ? 1 : mode === 'width' ? 1 / k : 1 / a;
    const correction = [a, -d * (E.m1 + E.m2) / 2, 0, d], result = mul(correction, previous);
    return result.every(Number.isFinite) ? { matrix: result, correction } : null;
  }
  function rect(r, anchor, o) {
    const m = matrix(o), pts = [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]].map(([x, y]) => {
      x -= anchor.x; y -= anchor.y; return [anchor.x + (o.artX || 0) + m[0] * x + m[2] * y, anchor.y + (o.artY || 0) + m[1] * x + m[3] * y];
    });
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  const FIELDS = ['pm', 'artX', 'artY', 'orderU', 'orderV', 'blockU', 'blockV', 'block', 'zo', 'zb'];
  const extra = o => Object.fromEntries(FIELDS.filter(k => o[k] != null).map(k => [k, Array.isArray(o[k]) ? JSON.parse(JSON.stringify(o[k])) : o[k]]));
  root.PieceGeometry = { H, matrix, mul, apply, footprint, edges, fit, rect, extra, cellsOf, mergeCells, swapCells, snapOff };
  if (typeof module === 'object' && module.exports) module.exports = root.PieceGeometry;
})(typeof window !== 'undefined' ? window : globalThis);

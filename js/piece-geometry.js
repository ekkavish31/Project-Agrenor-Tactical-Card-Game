/* v98.408 · Shared geometry for the detailed piece editor and the actual map.
   Art transforms are independent of the order and walk-block footprints. */
(function (root) {
  'use strict';
  const matrix = o => Array.isArray(o.pm) && o.pm.length === 4 && o.pm.every(Number.isFinite) ? o.pm : [1, 0, 0, 1];
  const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3]];
  function apply(q, o) { q.translate(o.artX || 0, o.artY || 0); q.transform(...matrix(o), 0, 0) }
  function footprint(o, u = 0, v = 0, block = false) {
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
  const FIELDS = ['pm', 'artX', 'artY', 'orderU', 'orderV', 'blockU', 'blockV', 'block'];
  const extra = o => Object.fromEntries(FIELDS.filter(k => o[k] != null).map(k => [k, Array.isArray(o[k]) ? o[k].slice() : o[k]]));
  root.PieceGeometry = { matrix, mul, apply, footprint, edges, fit, rect, extra };
  if (typeof module === 'object' && module.exports) module.exports = root.PieceGeometry;
})(typeof window !== 'undefined' ? window : globalThis);

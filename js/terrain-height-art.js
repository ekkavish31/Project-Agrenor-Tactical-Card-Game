/* v93.05 · Draws a TerrainHeight map on a 2D canvas context in the village's 2.5D projection (28 x 14 px half-diamond, z lifts up the screen).
   Painter's order: cells by u+v, so raised ground hides what is behind it. Each cell is a flat diamond lifted by level * LEVEL_PX; where the
   next cell on the +u side (right-lower edge) or the +v side (left-lower edge) is lower, the exposed wall is drawn: a 1-level step is a soft
   earth lip, a 2+ level drop is a rock cliff. Border cells that rise above level 0 get a skirt down to level 0.
   draw(g, map, opts) · hitTest(map, x, y) -> {u,v} (front-most lifted cell under a screen point, or null) · bounds(map) -> {x0,y0,x1,y1}.
   opts: palette {top:[l0..l3], lip, cliff, line} · tint(i) -> css colour or null (per-cell override, e.g. snow/sand) · grid (bool) ·
         numbers (bool) · mark {u,v,color} (outlined cell) · roads (bool: paint forced-flat cells as road colour) */
(function (root) {
  'use strict';
  const ORIGIN = { x: 2240, y: 1232 }, HW = 28, HH = 14;
  const PALETTES = {
    grass: { top: ['#79a85a', '#88b562', '#99c26c', '#abcf78'], lip: '#8a6b45', cliff: '#6f6a64', line: 'rgba(30,50,20,.28)', road: '#c9b58a' },
    snow: { top: ['#dfe9ee', '#e8f0f4', '#f1f6f9', '#fafcfd'], lip: '#a8b6c2', cliff: '#8a97a4', line: 'rgba(60,80,100,.25)', road: '#cdd3d8' },
    sand: { top: ['#d8c58b', '#e0cf98', '#e8d9a6', '#f0e3b4'], lip: '#b39a62', cliff: '#9a8a6c', line: 'rgba(90,70,30,.25)', road: '#bfa66e' },
    rock: { top: ['#8f9288', '#9a9d93', '#a6a99f', '#b3b6ac'], lip: '#6d6a60', cliff: '#575a55', line: 'rgba(20,20,20,.3)', road: '#a89f8a' }
  };
  const L = (m, u, v) => (u < 0 || v < 0 || u >= m.w || v >= m.h) ? null : m.levels[v * m.w + u];
  const P = (m, ou, ov, u, v, z) => ({ x: ORIGIN.x + (u + ou - v - ov) * HW, y: ORIGIN.y + (u + ou + v + ov) * HH - z * (root.TerrainHeight ? root.TerrainHeight.LEVEL_PX : 18) });
  function shade(hex, k) {
    const n = parseInt(hex.slice(1), 16), c = x => Math.max(0, Math.min(255, Math.round(x * k)));
    return 'rgb(' + c((n >> 16) & 255) + ',' + c((n >> 8) & 255) + ',' + c(n & 255) + ')';
  }
  function poly(g, pts, fill, stroke) {
    g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); }
  }
  function order(m) {
    const cells = [];
    for (let v = 0; v < m.h; v++) for (let u = 0; u < m.w; u++) cells.push([u, v]);
    return cells.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[0] - b[0]);
  }
  function bounds(m) {
    const z = (root.TerrainHeight ? root.TerrainHeight.LEVEL_PX : 18) * m.maxLevel, pts = [P(m, m.origin.u, m.origin.v, 0, 0, 0), P(m, m.origin.u, m.origin.v, m.w, 0, 0), P(m, m.origin.u, m.origin.v, 0, m.h, 0), P(m, m.origin.u, m.origin.v, m.w, m.h, 0)];
    return { x0: Math.min(...pts.map(p => p.x)), x1: Math.max(...pts.map(p => p.x)), y0: Math.min(...pts.map(p => p.y)) - z, y1: Math.max(...pts.map(p => p.y)) };
  }

  function draw(g, m, opts) {
    opts = opts || {};
    const pal = Object.assign({}, PALETTES.grass, opts.palette || {}), ou = m.origin.u, ov = m.origin.v;
    for (const [u, v] of order(m)) {
      const i = v * m.w + u, lv = m.levels[i];
      // walls first (they belong to the lower neighbour's edge but are painted with the higher cell)
      for (const [du, dv] of [[1, 0], [0, 1]]) {
        const nl = L(m, u + du, v + dv), low = nl == null ? 0 : nl;
        if (lv <= low) continue;
        const drop = lv - low, cliff = drop >= 2;
        // edge: +u side runs (u+1,v)-(u+1,v+1); +v side runs (u,v+1)-(u+1,v+1)
        const a = du ? [1, 0] : [0, 1], b = [1, 1];
        const pts = [P(m, ou, ov, u + a[0], v + a[1], lv), P(m, ou, ov, u + b[0], v + b[1], lv), P(m, ou, ov, u + b[0], v + b[1], low), P(m, ou, ov, u + a[0], v + a[1], low)];
        poly(g, pts, shade(cliff ? pal.cliff : pal.lip, du ? 0.86 : 1.0), pal.line);
        if (cliff) { // cracks so a cliff reads as rock, not as a bigger step
          g.save(); g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 1; g.beginPath();
          for (let k = 1; k < drop * 3; k++) { const t = k / (drop * 3), p0 = { x: pts[0].x + (pts[3].x - pts[0].x) * t, y: pts[0].y + (pts[3].y - pts[0].y) * t }, p1 = { x: pts[1].x + (pts[2].x - pts[1].x) * t, y: pts[1].y + (pts[2].y - pts[1].y) * t }; g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); }
          g.stroke(); g.restore();
        }
      }
      const top = [P(m, ou, ov, u, v, lv), P(m, ou, ov, u + 1, v, lv), P(m, ou, ov, u + 1, v + 1, lv), P(m, ou, ov, u, v + 1, lv)];
      const tint = opts.tint ? opts.tint(i) : null;
      poly(g, top, (opts.roads && m.flat[i]) ? pal.road : (tint || pal.top[lv]), opts.grid ? pal.line : null);
      if (m.blocked[i]) poly(g, top, 'rgba(60,110,170,.55)', null);
      if (opts.numbers && lv) { const c = P(m, ou, ov, u + .5, v + .5, lv); g.fillStyle = 'rgba(0,0,0,.55)'; g.font = '10px sans-serif'; g.textAlign = 'center'; g.fillText(String(lv), c.x, c.y + 3); }
    }
    if (opts.mark) {
      const { u, v } = opts.mark, lv = L(m, u - ou, v - ov);
      if (lv != null) poly(g, [P(m, ou, ov, u - ou, v - ov, lv), P(m, ou, ov, u - ou + 1, v - ov, lv), P(m, ou, ov, u - ou + 1, v - ov + 1, lv), P(m, ou, ov, u - ou, v - ov + 1, lv)], null, opts.mark.color || '#ffd54a');
    }
  }

  function inDiamond(p, c) { return Math.abs(p.x - c.x) / HW + Math.abs(p.y - c.y) / HH <= 1; }
  /* screen point (same space as draw) -> world cell, preferring the cell nearest the viewer whose lifted top contains the point */
  function hitTest(m, x, y) {
    const cells = order(m);
    for (let k = cells.length - 1; k >= 0; k--) {
      const [u, v] = cells[k], lv = m.levels[v * m.w + u], c = P(m, m.origin.u, m.origin.v, u + .5, v + .5, lv);
      if (inDiamond({ x, y }, c)) return { u: u + m.origin.u, v: v + m.origin.v };
    }
    return null;
  }

  const api = { PALETTES, draw, hitTest, bounds };
  root.TerrainHeightArt = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

/* v98.612/613 · WorldScale — a world map with TWICE as many hexes each way (k = 2: four times as many hexes), drawn at the SAME hex size next to the characters, so the world is twice as wide and tall and there is room for many more places.
   window.NORCHORTAL (js/world-norchorthal.js, 150×130 hexes of 12 km) is re-sampled into 300×260 hexes of 6 km: every new hex takes the terrain letter / river flag of the OLD hex whose centre
   is nearest to its own centre (so shorelines, ranges and rivers keep their shape), and every mark (Fernvale, the mine, the towns …) moves to the new hex nearest to the old one.
   Switch (default OFF = the map the game has always used):   URL  ?world=2  (or ?world=1 to force off)   ·   localStorage 'projectA.worldScale' = '2'.
   Must be loaded AFTER js/world-norchorthal.js and BEFORE js/world-gen.js.   WorldScale.up(NC, k) · WorldScale.convertCell(c, r, from, to) · WorldScale.want
   Saves: a world-map save remembers its scale (S.worldScale); js/world-map.js converts position / explored hexes when the scale differs. */
(function (root) {
  'use strict';
  const SQ3 = Math.sqrt(3);
  /* hex centres (pointy-top, odd rows pushed right by half a hex), in units where the old hex radius is 1 / the new one is 1/k */
  const cx = (c, r, R) => SQ3 * R * (c + .5 * (r & 1)) + SQ3 * R / 2, cy = (r, R) => 1.5 * R * r;
  function nearest(x, y, R, cols, rows) {   /* the hex of radius R (cols×rows) whose centre is nearest to (x, y) */
    const r0 = Math.round(y / (1.5 * R)); let best = null, bd = 1e18;
    for (let r = r0 - 1; r <= r0 + 1; r++) { if (r < 0 || r >= rows) continue; const c = Math.round((x - SQ3 * R / 2) / (SQ3 * R) - .5 * (r & 1)); for (let cc = c - 1; cc <= c + 1; cc++) { if (cc < 0 || cc >= cols) continue; const d = (cx(cc, r, R) - x) ** 2 + (cy(r, R) - y) ** 2; if (d < bd) { bd = d; best = [cc, r] } } }
    return best || [Math.max(0, Math.min(cols - 1, Math.round(x / (SQ3 * R)))), Math.max(0, Math.min(rows - 1, r0))];
  }
  /* a cell of the OLD map (scale 1) → the hex of the map at scale k nearest to its centre, and back */
  function convertCell(c, r, from, to) {
    if (from === to) return [c, r]; const Rf = 1 / from, Rt = 1 / to, N = root.NORCHORTAL_BASE || root.NORCHORTAL; if (!N) return [c, r];
    const base = N.scale ? N.cols / N.scale : N.cols, baseRows = N.scale ? N.rows / N.scale : N.rows;
    return nearest(cx(c, r, Rf), cy(r, Rf), Rt, Math.round(base * to), Math.round(baseRows * to));
  }
  function up(NC, k) {
    const cols = NC.cols * k, rows = NC.rows * k, Ro = 1, Rn = 1 / k, grid = [], river = [];
    for (let r = 0; r < rows; r++) {
      let g = '', rv = ''; const y = cy(r, Rn);
      for (let c = 0; c < cols; c++) { const [oc, or] = nearest(cx(c, r, Rn), y, Ro, NC.cols, NC.rows); g += NC.grid[or][oc]; rv += NC.river[or][oc] }
      grid.push(g); river.push(rv);
    }
    const marks = {}; for (const [id, m] of Object.entries(NC.marks || {})) marks[id] = nearest(cx(m[0], m[1], Ro), cy(m[1], Ro), Rn, cols, rows);
    return { ...NC, cols, rows, km: NC.km / k, scale: k, grid, river, marks };
  }
  let want = 1;
  try { const q = new URLSearchParams(root.location?.search || '').get('world'); want = q === '2' ? 2 : q === '1' ? 1 : (root.localStorage?.getItem('projectA.worldScale') === '2' ? 2 : 1) } catch (e) { }
  root.NORCHORTAL_BASE = root.NORCHORTAL || null;
  if (want === 2 && root.NORCHORTAL && !root.NORCHORTAL.scale) root.NORCHORTAL = up(root.NORCHORTAL, 2);
  root.WorldScale = { want, scale: root.NORCHORTAL?.scale || 1, up, convertCell, nearest };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.WorldScale;
})(typeof window !== 'undefined' ? window : globalThis);

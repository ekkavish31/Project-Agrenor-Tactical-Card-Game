/* v98.391 · DATUM POINTS of a character picture (⚖ Scale Lineup → 📐 สัดส่วน → 📍 Datum).
   Points only (a level line breaks as soon as a head or body tilts): eyes L/R · chin · shoulder pivots L/R · chest · crotch · knees L/R · feet L/R.
   The face is measured as a DISTANCE (eye midpoint → chin), so a tilted head keeps its size.
   Across directions: a direction without its own point gets a SUGGESTION — the opposite direction mirrored (SW↔SE · NW↔NE), else for the
   centre-line points (chin · chest · crotch) the same HEIGHT as in another direction. Placing / dragging makes it the direction's own.
   Store: localStorage 'proportion-datum-v1' = { [character]: { [pose]: { [frame]: { pts: { DIR: { key: [x, y] } } } } } }   (x, y = fractions of the picture)
   Pushed with the editor settings (🛒 Cart → js/game-settings.js) so every browser loads it. */
(function (root) {
  'use strict';
  const KEY = 'proportion-datum-v1';
  const POINTS = [['eyeL', 'ตาซ้าย', '#d63384'], ['eyeR', 'ตาขวา', '#d63384'], ['chin', 'คาง', '#d62d2d'], ['shL', 'หมุนไหล่ซ้าย', '#1f6fd0'], ['shR', 'หมุนไหล่ขวา', '#1f6fd0'], ['chest', 'อก', '#6f42c1'], ['crotch', 'ขาหนีบ', '#2a9a3a'], ['kneeL', 'เข่าซ้าย', '#2a9a3a'], ['kneeR', 'เข่าขวา', '#2a9a3a'], ['footL', 'เท้าซ้าย', '#444'], ['footR', 'เท้าขวา', '#444']];
  const CENTRE = ['chin', 'chest', 'crotch'], DIRS = ['SW', 'NW', 'NE', 'SE'];
  const OPP = { SW: 'SE', SE: 'SW', NW: 'NE', NE: 'NW' }, SWAP = { eyeL: 'eyeR', eyeR: 'eyeL', shL: 'shR', shR: 'shL', kneeL: 'kneeR', kneeR: 'kneeL', footL: 'footR', footR: 'footL' };
  const ls = root.localStorage;
  /* v98.390 records had level lines: their chin / chest / crotch become centre points of SW */
  function migrate(r) { if (!r || !r.levels) return r; const sw = (r.pts ||= {}).SW ||= {}; for (const k of CENTRE) if (r.levels[k] != null && !sw[k]) sw[k] = [.5, r.levels[k]]; delete r.levels; delete r.lv; return r }
  const all = () => { try { const d = JSON.parse(ls.getItem(KEY) || '{}') || {}; for (const p of Object.values(d)) for (const f of Object.values(p || {})) for (const r of Object.values(f || {})) migrate(r); return d } catch (e) { return {} } };
  const saveAll = d => { try { ls.setItem(KEY, JSON.stringify(d)) } catch (e) { } };
  function get(id, pose, frame) { const d = all(); return d[id]?.[pose]?.[frame | 0] || null }
  function put(id, pose, frame, rec) { const d = all(); ((d[id] ||= {})[pose] ||= {})[frame | 0] = rec; saveAll(d) }
  function remove(id, pose, frame) { const d = all(); if (d[id]?.[pose]) { delete d[id][pose][frame | 0]; saveAll(d) } }
  /* the points of a direction: own ones, plus suggestions for the missing ones → { pts, own:Set, from:{key:'mirror'|'height'} } */
  function pointsFor(rec, dir) {
    const own = rec?.pts?.[dir] || {}, pts = { ...own }, from = {}, opp = rec?.pts?.[OPP[dir]] || {};
    for (const [k, v] of Object.entries(opp)) { const m = SWAP[k] || k; if (!pts[m]) { pts[m] = [1 - v[0], v[1]]; from[m] = 'mirror' } }
    const cx = () => { const xs = Object.values(pts).map(p => p[0]); return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : .5 };
    for (const k of CENTRE) if (!pts[k]) for (const d of DIRS) { const p = rec?.pts?.[d]?.[k]; if (p) { pts[k] = [cx(), p[1]]; from[k] = 'height'; break } }
    return { pts, own: new Set(Object.keys(own)), from };
  }
  const mid = (a, b) => a && b ? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] : null;
  /* numbers in picture pixels (w × h). Head from the FACE: skull top ≈ eye midpoint − (chin − eye midpoint) → hair / hats do not count */
  function measure(rec, dir, w, h) {
    const { pts: P } = pointsFor(rec, dir), out = {}, D = (a, b) => a && b ? Math.hypot((a[0] - b[0]) * w, (a[1] - b[1]) * h) : null;
    const eye = mid(P.eyeL, P.eyeR), feetY = P.footL && P.footR ? Math.max(P.footL[1], P.footR[1]) : (P.footL || P.footR)?.[1];
    if (eye && P.chin) { out.face = D(eye, P.chin); const top = eye[1] * h - out.face * ((P.chin[1] - eye[1]) * h >= 0 ? 1 : -1); out.headH = out.face * 2; if (feetY != null) { out.H = feetY * h - (eye[1] * h - out.face); out.heads = out.H / out.headH; out.headFrac = out.headH / out.H } }
    out.eyeDist = D(P.eyeL, P.eyeR); out.shoulderW = D(P.shL, P.shR);
    const sh = mid(P.shL, P.shR); out.torso = D(sh || P.chest, P.crotch);
    const leg = (k, f) => P[k] && P[f] && P.crotch ? D(P.crotch, P[k]) + D(P[k], P[f]) : P[f] && P.crotch ? D(P.crotch, P[f]) : null;
    out.legL = leg('kneeL', 'footL'); out.legR = leg('kneeR', 'footR'); const ls_ = [out.legL, out.legR].filter(v => v != null); out.legs = ls_.length ? ls_.reduce((a, b) => a + b, 0) / ls_.length : null;
    out.thighL = D(P.crotch, P.kneeL); out.thighR = D(P.crotch, P.kneeR); out.shinL = D(P.kneeL, P.footL); out.shinR = D(P.kneeR, P.footR);
    return out;
  }
  /* proportion marks (fractions of the silhouette box m = {top,H}) for js/proportion-tool.js: chin · shoulder (pivot mid) · hip (crotch) */
  function marksFrom(rec, dir, m, h) { const { pts: P } = pointsFor(rec, dir); if (!P.chin || !P.crotch) return null; const f = y => (y * h - m.top) / m.H, sh = mid(P.shL, P.shR); return { chin: f(P.chin[1]), shoulder: f(sh ? sh[1] : P.chin[1] + (P.crotch[1] - P.chin[1]) * .2), hip: f(P.crotch[1]) } }
  /* how far each direction's own centre points sit from the first direction that has them (fraction of the picture height) */
  function heightGaps(rec) { const out = []; for (const k of CENTRE) { const has = DIRS.filter(d => rec?.pts?.[d]?.[k]); if (has.length < 2) continue; const y0 = rec.pts[has[0]][k][1]; for (const d of has.slice(1)) { const dy = rec.pts[d][k][1] - y0; if (Math.abs(dy) > .004) out.push({ dir: d, key: k, ref: has[0], dy }) } } return out }
  const api = { KEY, POINTS, CENTRE, DIRS, OPP, all, saveAll, get, put, remove, pointsFor, measure, marksFrom, heightGaps };
  root.ProportionDatum = api; if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

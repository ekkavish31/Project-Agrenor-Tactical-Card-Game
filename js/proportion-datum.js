/* v98.390 · DATUM points of a character picture (⚖ Scale Lineup → 📐 สัดส่วน → 📍 Datum).
   LEVELS (heights, fraction of the picture height) are SHARED by every direction of the same pose & frame — the camera only turns the body around the
   vertical axis, so the eyes, chin, neck, shoulders, chest, crotch and feet sit at the same height in SW / NW / NE / SE. A direction may keep its own
   difference (rec.lv[dir]) — that IS the "this direction is drawn taller / shorter" finding.
   POINTS (left/right: eyes, shoulder pivots, knees, feet; [x,y] fractions) belong to one direction; the opposite one (SW↔SE · NW↔NE) is mirrored until it is set.
   Store: localStorage 'proportion-datum-v1' = { [character]: { [pose]: { [frame]: { levels:{…}, lv:{DIR:{…}}, pts:{DIR:{…}} } } } }
   (pushed with the other editor settings → js/game-settings.js, so every browser loads it). */
(function (root) {
  'use strict';
  const KEY = 'proportion-datum-v1';
  const LEVELS = [['eye', 'ระดับตา', '#d63384'], ['chin', 'คาง', '#d62d2d'], ['neck', 'ฐานคอ', '#e67e22'], ['shoulder', 'บ่า', '#1f6fd0'], ['chest', 'อก', '#6f42c1'], ['crotch', 'ขาหนีบ', '#2a9a3a'], ['feet', 'ฐานเท้า', '#444']];
  const POINTS = [['eyeL', 'ตาซ้าย', '#d63384'], ['eyeR', 'ตาขวา', '#d63384'], ['shL', 'หมุนไหล่ซ้าย', '#1f6fd0'], ['shR', 'หมุนไหล่ขวา', '#1f6fd0'], ['kneeL', 'เข่าซ้าย', '#2a9a3a'], ['kneeR', 'เข่าขวา', '#2a9a3a'], ['footL', 'เท้าซ้าย', '#444'], ['footR', 'เท้าขวา', '#444']];
  const OPP = { SW: 'SE', SE: 'SW', NW: 'NE', NE: 'NW' }, SWAP = { eyeL: 'eyeR', eyeR: 'eyeL', shL: 'shR', shR: 'shL', kneeL: 'kneeR', kneeR: 'kneeL', footL: 'footR', footR: 'footL' };
  const ls = root.localStorage;
  const all = () => { try { return JSON.parse(ls.getItem(KEY) || '{}') || {} } catch (e) { return {} } };
  const saveAll = d => { try { ls.setItem(KEY, JSON.stringify(d)) } catch (e) { } };
  function get(id, pose, frame) { const d = all(); return d[id]?.[pose]?.[frame | 0] || null }
  function put(id, pose, frame, rec) { const d = all(); ((d[id] ||= {})[pose] ||= {})[frame | 0] = rec; saveAll(d) }
  function remove(id, pose, frame) { const d = all(); if (d[id]?.[pose]) { delete d[id][pose][frame | 0]; saveAll(d) } }
  const levelsFor = (rec, dir) => rec ? { ...(rec.levels || {}), ...(rec.lv?.[dir] || {}) } : {};
  function mirror(p) { const o = {}; for (const [k, v] of Object.entries(p || {})) o[SWAP[k] || k] = [1 - v[0], v[1]]; return o }
  /* the points of a direction: its own, else the opposite direction mirrored (flag mirrored) */
  function pointsFor(rec, dir) { if (!rec) return { pts: {}, mirrored: false }; const own = rec.pts?.[dir]; if (own && Object.keys(own).length) return { pts: own, mirrored: false }; const o = rec.pts?.[OPP[dir]]; return { pts: o ? mirror(o) : {}, mirrored: !!o } }
  /* numbers in picture pixels (h = picture height, w = width). Head height from the FACE: skull top ≈ eye − (chin − eye), so hair / hats do not count */
  function measure(rec, dir, w, h) {
    const L = levelsFor(rec, dir), P = pointsFor(rec, dir).pts, y = k => L[k] != null ? L[k] * h : null, out = {};
    const eye = y('eye'), chin = y('chin'), feet = y('feet');
    if (eye != null && chin != null && chin > eye) { out.face = chin - eye; out.skullTop = eye - (chin - eye); out.headH = chin - out.skullTop; if (feet != null) { out.H = feet - out.skullTop; out.heads = out.H / out.headH; out.headFrac = out.headH / out.H } }
    if (y('neck') != null && y('crotch') != null) out.torso = y('crotch') - y('neck');
    if (y('crotch') != null && feet != null) out.legs = feet - y('crotch');
    const dx = (a, b) => P[a] && P[b] ? Math.abs(P[a][0] - P[b][0]) * w : null;
    out.eyeDist = dx('eyeL', 'eyeR'); out.shoulderW = dx('shL', 'shR');
    const seg = (a, b) => P[a] && P[b] ? Math.hypot((P[a][0] - P[b][0]) * w, (P[a][1] - P[b][1]) * h) : null;
    const cx = P.shL && P.shR ? (P.shL[0] + P.shR[0]) / 2 : .5, thigh = k => P[k] && L.crotch != null ? Math.hypot((P[k][0] - cx) * w, (P[k][1] - L.crotch) * h) : null;   /* from the crotch on the body's centre line */
    out.thighL = thigh('kneeL'); out.thighR = thigh('kneeR'); out.shinL = seg('kneeL', 'footL'); out.shinR = seg('kneeR', 'footR');
    return out;
  }
  /* proportion marks (fractions of the silhouette box m = {top,H}) for js/proportion-tool.js from the datum levels */
  function marksFrom(rec, dir, m, h) { const L = levelsFor(rec, dir); if (L.chin == null || L.crotch == null) return null; const f = v => (v * h - m.top) / m.H; return { chin: f(L.chin), shoulder: f(L.shoulder ?? (L.chin + (L.crotch - L.chin) * .2)), hip: f(L.crotch) } }
  const api = { KEY, LEVELS, POINTS, OPP, all, saveAll, get, put, remove, levelsFor, pointsFor, mirror, measure, marksFrom };
  root.ProportionDatum = api; if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

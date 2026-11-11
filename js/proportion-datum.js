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
  /* v98.392 · L / R = the LEFT / RIGHT SIDE OF THE PICTURE (as you look at it), not the character's own left hand: the same in every direction */
  const POINTS = [['eyeL', 'ตา ซ้ายภาพ', '#d63384'], ['eyeR', 'ตา ขวาภาพ', '#d63384'], ['chin', 'คาง', '#d62d2d'], ['shL', 'ไหล่ ซ้ายภาพ', '#1f6fd0'], ['shR', 'ไหล่ ขวาภาพ', '#1f6fd0'], ['chest', 'อก', '#6f42c1'], ['crotch', 'ขาหนีบ', '#2a9a3a'], ['kneeL', 'เข่า ซ้ายภาพ', '#2a9a3a'], ['kneeR', 'เข่า ขวาภาพ', '#2a9a3a'], ['footL', 'ข้อเท้า ซ้ายภาพ', '#444'], ['footR', 'ข้อเท้า ขวาภาพ', '#444']];   /* the ANKLE joint (not the toe / sole): a joint stays the same point when the foot points, kicks or lies down */
  const CENTRE = ['chin', 'chest', 'crotch'], DIRS = ['SW', 'NW', 'NE', 'SE'];
  const OPP = { SW: 'SE', SE: 'SW', NW: 'NE', NE: 'NW' }, SWAP = { eyeL: 'eyeR', eyeR: 'eyeL', shL: 'shR', shR: 'shL', kneeL: 'kneeR', kneeR: 'kneeL', footL: 'footR', footR: 'footL' };
  /* v98.399 · SW/SE show the FRONT (mirror pair) · NW/NE show the BACK (mirror pair) — the two groups must never lend each other
     data: a front proportion means nothing compared against a back one (cloak, hood, armour plates differ front/back). */
  const GROUP = { SW: 'front', SE: 'front', NW: 'back', NE: 'back' };
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
    /* v98.399 · a centre point's HEIGHT fallback stays inside the same front/back group — only the mirror partner (OPP[dir]) may lend one, never the other group */
    for (const k of CENTRE) if (!pts[k] && opp[k]) { pts[k] = [cx(), opp[k][1]]; from[k] = 'height' }
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
  /* one line of status for a character · pose · direction (frame 0): how many own points, face size vs the standing pose, for the Animation table badges */
  function status(id, pose, dir, w = 384, h = 384) { const rec = get(id, pose, 0); if (!rec) return null; const own = Object.keys(rec.pts?.[dir] || {}).length, sug = Object.keys(pointsFor(rec, dir).pts).length;
    const m = measure(rec, dir, w, h), ref = pose === 'idle' ? null : get(id, 'idle', 0), mr = ref && measure(ref, dir, w, h); return { own, sug, total: POINTS.length, face: m.face || null, faceDev: m.face && mr?.face ? m.face / mr.face - 1 : null, legDev: m.legs && mr?.legs ? m.legs / mr.legs - 1 : null, heads: m.heads || null } }
  /* v98.396 · the three vertical spans the proportion tool scales, from the datum points: HEAD (skull top → chin, skull top ≈ eyes − (chin − eyes)) ·
     TORSO (chin → crotch) · LEGS (crotch → lower ankle). Fractions of their sum → compare a TEMPLATE character with a TARGET one. */
  function spans(rec, dir) { const { pts: P } = pointsFor(rec, dir), eye = mid(P.eyeL, P.eyeR); if (!eye || !P.chin || !P.crotch || !(P.footL || P.footR)) return null;
    const feet = Math.max(P.footL ? P.footL[1] : -1, P.footR ? P.footR[1] : -1), A = 2 * (P.chin[1] - eye[1]), B = P.crotch[1] - P.chin[1], C = feet - P.crotch[1], T = A + B + C;
    return A > 0 && B > 0 && C > 0 ? { head: A / T, torso: B / T, legs: C / T } : null }
  /* scales (head · torso · legs, legs = 1) that give the TARGET the template's spans · only the selected parts move (the others keep 1) */
  function matchScales(tpl, tgt, sel = { head: true, torso: true, legs: true }) { if (!tpl || !tgt) return null; const r = k => tpl[k] / tgt[k], ks = ['head', 'torso', 'legs'].filter(k => sel[k]);
    if (!ks.length) return null; const base = sel.legs || ks.length === 3 ? r('legs') : ['head', 'torso', 'legs'].filter(k => !sel[k]).reduce((a, k) => a + tgt[k], 0) / ['head', 'torso', 'legs'].filter(k => !sel[k]).reduce((a, k) => a + tpl[k], 0);
    const out = { head: 1, torso: 1, legs: 1 }; for (const k of ks) out[k] = Math.max(.5, Math.min(2, sel.legs || ks.length === 3 ? r(k) / base : r(k) / (1 / base))); return out }
  /* v98.398 · THE STANDARD: the template character's spans, kept as numbers so it stays put even when that picture is edited later.
     v98.399 · one standard PER GROUP ('front' from SW/SE, 'back' from NW/NE) — a back view can never be matched against a front standard.
     localStorage 'proportion-standard-v1' = { front: {id,name,pose,dir,spans:{head,torso,legs},at} | null, back: {...} | null } */
  const STD_KEY = 'proportion-standard-v1';
  const stdAll = () => { try { const o = JSON.parse(ls.getItem(STD_KEY) || 'null'); if (!o) return {};
      if (o.spans && !o.front && !o.back) { const g = GROUP[o.dir] || 'front'; return { [g]: o } }   /* v98.398 single-standard record → migrate into its own group */
      return o } catch (e) { return {} } };
  const std = group => { const o = stdAll()[group]; return o && o.spans ? o : null };
  const setStd = (group, o) => { try { const all = stdAll(); if (o) all[group] = o; else delete all[group]; ls.setItem(STD_KEY, JSON.stringify(all)) } catch (e) { } };
  /* v98.403 · DEPTH CHECK (แนวลึก): every pose of a character against that character's OWN standing pose (idle, frame 0, same direction).
     Measures rigid segments one by one — bending a joint changes the angle between segments, never their length.
     Step 1: the face (eye midpoint → chin) is the ruler → `scale` = how much bigger/smaller the whole frame was drawn.
     Step 2: every other segment ÷ that scale, vs the same segment standing → what is left is a real proportion error.
     A segment can look SHORTER than it is (pointing toward / away from the camera) but never LONGER: longer = wrong (✘ over 10 %),
     shorter = only a hint to look (⚠ over 10 %). Shoulder width gets double tolerance (a slight body turn narrows it). Nothing is warped. */
  const DEPTH_SEGS = [['torso', 'ลำตัว'], ['thighL', 'ต้นขา ซ้ายภาพ'], ['thighR', 'ต้นขา ขวาภาพ'], ['shinL', 'แข้ง ซ้ายภาพ'], ['shinR', 'แข้ง ขวาภาพ'], ['shoulderW', 'ไหล่กว้าง']];
  function segLens(rec, dir, w, h) { const { pts: P } = pointsFor(rec, dir), D = (a, b) => a && b ? Math.hypot((a[0] - b[0]) * w, (a[1] - b[1]) * h) : null, eye = mid(P.eyeL, P.eyeR), sh = mid(P.shL, P.shR);
    return { face: D(eye, P.chin), torso: D(sh || P.chin, P.crotch), thighL: D(P.crotch, P.kneeL), thighR: D(P.crotch, P.kneeR), shinL: D(P.kneeL, P.footL), shinR: D(P.kneeR, P.footR), shoulderW: D(P.shL, P.shR) } }
  /* v98.404 · the MASTER pose of a character, per front/back group: the pose every other pose of that character is compared with.
     Default = standing (idle) frame 1. It must show every segment at full length (stand straight, nothing pointing at the camera) —
     a shorter-looking master would make correct poses look "too long".
     localStorage 'proportion-master-v1' = { [character]: { front: {pose, frame}, back: {pose, frame} } } (pushed with the datum) */
  const MASTER_KEY = 'proportion-master-v1', MASTER0 = { pose: 'idle', frame: 0 };
  const masterAll = () => { try { return JSON.parse(ls.getItem(MASTER_KEY) || '{}') || {} } catch (e) { return {} } };
  function master(id, dir) { const m = masterAll()[id]?.[GROUP[dir] || 'front']; return m && m.pose ? { pose: m.pose, frame: m.frame | 0, set: true } : { ...MASTER0, set: false } }
  function setMaster(id, group, m) { try { const all = masterAll(), o = all[id] ||= {}; if (m && !(m.pose === 'idle' && !(m.frame | 0))) o[group] = { pose: m.pose, frame: m.frame | 0 }; else delete o[group]; if (!Object.keys(o).length) delete all[id]; ls.setItem(MASTER_KEY, JSON.stringify(all)) } catch (e) { } }
  function depth(id, pose, frame, dir, w = 384, h = 384) {
    const M = master(id, dir);
    if (pose === M.pose && (frame | 0) === M.frame) return { ref: true, master: M };
    const rec = get(id, pose, frame | 0), ref = get(id, M.pose, M.frame); if (!rec) return null; if (!ref) return { noRef: true, master: M };
    const a = segLens(rec, dir, w, h), b = segLens(ref, dir, w, h); if (!a.face || !b.face) return { noFace: true };
    const scale = a.face / b.face, segs = []; let level = Math.abs(scale - 1) > .10 ? 'bad' : Math.abs(scale - 1) > .05 ? 'warn' : 'ok';
    for (const [k, name] of DEPTH_SEGS) {
      if (a[k] == null || b[k] == null) { segs.push({ k, name, dev: null, level: 'na' }); continue }
      const dev = a[k] / b[k] / scale - 1, tol = k === 'shoulderW' ? 2 : 1; let lv = 'ok';
      if (dev > .10 * tol) lv = 'bad'; else if (dev > .05 * tol || dev < -.10 * tol) lv = 'warn';
      segs.push({ k, name, dev, level: lv }); if (lv === 'bad' || (lv === 'warn' && level === 'ok')) level = lv;
    }
    return { scale, segs, level, master: M };
  }
  /* one line for a tooltip / panel: "ขนาดเฟรม +10% ⚠ · ต้นขา ขวาภาพ +14% ✘ · …" (segments within ±5 % are left out unless `all`) */
  const masterName = M => M ? (M.pose === 'idle' ? 'ท่ายืน' : M.pose) + ' เฟรม ' + ((M.frame | 0) + 1) : 'ท่ายืน เฟรม 1';
  function depthText(dp, all) { if (!dp) return 'ยังไม่มี datum ท่านี้'; if (dp.ref) return 'ท่านี้ = ท่าอ้างอิงแนวลึกของตัวนี้ (' + masterName(dp.master) + ')'; if (dp.noRef) return 'ยังไม่มี datum ท่าอ้างอิง (' + masterName(dp.master) + ') ให้เทียบ'; if (dp.noFace) return 'ต้องมีตา 2 จุด + คาง ทั้งท่านี้และท่ายืน';
    const ic = { ok: '✔', warn: '⚠', bad: '✘' }, pc = v => (v >= 0 ? '+' : '') + (v * 100).toFixed(0) + '%', sd = dp.scale - 1;
    const parts = [`ขนาดเฟรม ${pc(sd)}${Math.abs(sd) > .05 ? ' ' + (Math.abs(sd) > .10 ? ic.bad : ic.warn) : ''}`];
    for (const s of dp.segs) { if (s.dev == null) { if (all) parts.push(s.name + ' —'); continue } if (all || s.level !== 'ok') parts.push(`${s.name} ${pc(s.dev)}${s.level !== 'ok' ? ' ' + ic[s.level] : ''}`) }
    return parts.join(' · ') }
  const api = { MASTER_KEY, master, setMaster, masterName, DEPTH_SEGS, depth, depthText, STD_KEY, GROUP, std, setStd, spans, matchScales, status, KEY, POINTS, CENTRE, DIRS, OPP, all, saveAll, get, put, remove, pointsFor, measure, marksFrom, heightGaps };
  root.ProportionDatum = api; if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

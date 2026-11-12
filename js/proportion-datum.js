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
  /* v98.417 · the order the points are placed in (the editor walks this list): face → left arm → right arm → body → left leg → right leg */
  const POINTS = [['eyeL', 'ตา ซ้ายภาพ', '#d63384'], ['eyeR', 'ตา ขวาภาพ', '#d63384'], ['chin', 'คาง', '#d62d2d'], ['shL', 'ไหล่ ซ้ายภาพ', '#1f6fd0'], ['elbowL', 'ข้อศอก ซ้ายภาพ', '#c47715'], ['wristL', 'ข้อมือ ซ้ายภาพ', '#e79516'], ['shR', 'ไหล่ ขวาภาพ', '#1f6fd0'], ['elbowR', 'ข้อศอก ขวาภาพ', '#c47715'], ['wristR', 'ข้อมือ ขวาภาพ', '#e79516'], ['chest', 'อก', '#6f42c1'], ['crotch', 'ขาหนีบ', '#2a9a3a'], ['kneeL', 'เข่า ซ้ายภาพ', '#2a9a3a'], ['footL', 'ข้อเท้า ซ้ายภาพ', '#444'], ['kneeR', 'เข่า ขวาภาพ', '#2a9a3a'], ['footR', 'ข้อเท้า ขวาภาพ', '#444']];   /* the ANKLE joint (not the toe / sole): a joint stays the same point when the foot points, kicks or lies down */
  const CENTRE = ['chin', 'chest', 'crotch'], DIRS = ['SW', 'NW', 'NE', 'SE'];
  const OPP = { SW: 'SE', SE: 'SW', NW: 'NE', NE: 'NW' }, SWAP = { eyeL: 'eyeR', eyeR: 'eyeL', shL: 'shR', shR: 'shL', elbowL: 'elbowR', elbowR: 'elbowL', wristL: 'wristR', wristR: 'wristL', kneeL: 'kneeR', kneeR: 'kneeL', footL: 'footR', footR: 'footL' };
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
    const body = metrics(rec, dir, w, h); out.body = body; out.headFrac = body.proportions?.head; out.heads = body.heads; out.headH = body.lengths?.head; out.H = body.lengths?.total;
    return out;
  }
  /* proportion marks (fractions of the silhouette box m = {top,H}) for js/proportion-tool.js: chin · shoulder (pivot mid) · hip (crotch) */
  function marksFrom(rec, dir, m, h) {
    const { pts: P } = pointsFor(rec, dir); if (!P.chin || !P.crotch) return null;
    const f = y => (y * h - m.top) / m.H, sh = mid(P.shL, P.shR), body = metrics(rec, dir, m.w || h, h);
    return { chin: f(P.chin[1]), shoulder: f(sh ? sh[1] : P.chin[1] + (P.crotch[1] - P.chin[1]) * .2), hip: f(P.crotch[1]), ...(body.proportions ? { headTop: f(body.top), ankle: f(body.bottom) } : {}) };
  }

  /* how far each direction's own centre points sit from the first direction that has them (fraction of the picture height) */
  function heightGaps(rec) { const out = []; for (const k of CENTRE) { const has = DIRS.filter(d => rec?.pts?.[d]?.[k]); if (has.length < 2) continue; const y0 = rec.pts[has[0]][k][1]; for (const d of has.slice(1)) { const dy = rec.pts[d][k][1] - y0; if (Math.abs(dy) > .004) out.push({ dir: d, key: k, ref: has[0], dy }) } } return out }
  /* one line of status for a character · pose · direction (frame 0): how many own points, face size vs the standing pose, for the Animation table badges */
  function status(id, pose, dir, w = 384, h = 384) { const rec = get(id, pose, 0); if (!rec) return null; const own = Object.keys(rec.pts?.[dir] || {}).length, sug = Object.keys(pointsFor(rec, dir).pts).length;
    const m = measure(rec, dir, w, h), ref = pose === 'idle' ? null : get(id, 'idle', 0), mr = ref && measure(ref, dir, w, h); return { own, sug, total: POINTS.length, face: m.face || null, faceDev: m.face && mr?.face ? m.face / mr.face - 1 : null, legDev: m.legs && mr?.legs ? m.legs / mr.legs - 1 : null, heads: m.heads || null } }
  /* v98.396 · the three vertical spans the proportion tool scales, from the datum points: HEAD (skull top → chin, skull top ≈ eyes − (chin − eyes)) ·
     TORSO (chin → crotch) · LEGS (crotch → lower ankle). Fractions of their sum → compare a TEMPLATE character with a TARGET one. */
  /* One body-ratio contract, shared by table, standard, datum readout and preview.
     The projected vertical stack is skull-top→chin→crotch→lower ankle.
     Hair, raised hands and the soles are excluded. Euclidean bone lengths below
     are labelled px and are never substituted into these percentages. */
  function metrics(rec, dir, w = 384, h = 384) {
    const { pts: P } = pointsFor(rec, dir), eye = mid(P.eyeL, P.eyeR), D = (a, b) => a && b ? Math.hypot((a[0] - b[0]) * w, (a[1] - b[1]) * h) : null;
    const out = { method: 'datum-body-v1', proportions: null, arms: {} };
    for (const side of ['L', 'R']) { const upper = D(P['sh' + side], P['elbow' + side]), lower = D(P['elbow' + side], P['wrist' + side]); out.arms[side] = { upper, lower, total: upper != null && lower != null ? upper + lower : null } }
    if (!eye || !P.chin || !P.crotch || !(P.footL || P.footR)) return out;
    const feet = Math.max(P.footL ? P.footL[1] : -1, P.footR ? P.footR[1] : -1), top = 2 * eye[1] - P.chin[1];
    const A = (P.chin[1] - top) * h, B = (P.crotch[1] - P.chin[1]) * h, C = (feet - P.crotch[1]) * h, total = A + B + C;
    if (!(A > 0 && B > 0 && C > 0)) return out;
    out.top = top; out.bottom = feet; out.lengths = { head: A, torso: B, legs: C, total }; out.proportions = { head: A / total, torso: B / total, legs: C / total }; out.heads = total / A;
    return out;
  }
  const spans = (rec, dir) => metrics(rec, dir).proportions;
  /* scales (head · torso · legs, legs = 1) that give the TARGET the template's spans · only the selected parts move (the others keep 1) */
  function matchScales(tpl, tgt, sel = { head: true, torso: true, legs: true }) { if (!tpl || !tgt) return null; const r = k => tpl[k] / tgt[k], ks = ['head', 'torso', 'legs'].filter(k => sel[k]);
    if (!ks.length) return null; const base = sel.legs || ks.length === 3 ? r('legs') : ['head', 'torso', 'legs'].filter(k => !sel[k]).reduce((a, k) => a + tgt[k], 0) / ['head', 'torso', 'legs'].filter(k => !sel[k]).reduce((a, k) => a + tpl[k], 0);
    const out = { head: 1, torso: 1, legs: 1 }; for (const k of ks) out[k] = Math.max(.5, Math.min(2, sel.legs || ks.length === 3 ? r(k) / base : r(k) / (1 / base))); return out }
  /* v98.398 · THE STANDARD: the template character's spans, kept as numbers so it stays put even when that picture is edited later.
     v98.399 · one standard per GROUP ('front' from SW/SE, 'back' from NW/NE) — a back view can never be matched against a front standard.
     v98.420 · …and per POSE: head ÷ body is not the same in every pose (a crouch shortens the body, so the head looks bigger), so a standing
     picture may only be matched to a STANDING standard, a windup to a windup standard. No standard for the pose = nothing to match to.
     localStorage 'proportion-standard-v1' = { front: { [pose]: {id,name,pose,dir,spans:{head,torso,legs},at} }, back: { … } } */
  const STD_KEY = 'proportion-standard-v1';
  const stdAll = () => { try { const o = JSON.parse(ls.getItem(STD_KEY) || 'null'); if (!o) return {};
      const out = {}, put = (g, v) => { if (v && v.spans) (out[g] ||= {})[v.pose || 'idle'] = v };
      if (o.spans && !o.front && !o.back) { put(GROUP[o.dir] || 'front', o); return out }   /* v98.398 single record */
      for (const g of ['front', 'back']) { const v = o[g]; if (!v) continue; if (v.spans) put(g, v); else for (const pv of Object.values(v)) put(g, pv) }   /* v98.399 per group → per pose */
      return out } catch (e) { return {} } };
  const std = (group, pose = 'idle') => { const o = stdAll()[group]?.[pose]; return o && o.spans ? o : null };
  const stdPoses = group => Object.keys(stdAll()[group] || {});
  const setStd = (group, pose, o) => { try { const all = stdAll(); if (o) (all[group] ||= {})[pose] = o; else if (all[group]) { delete all[group][pose]; if (!Object.keys(all[group]).length) delete all[group] } ls.setItem(STD_KEY, JSON.stringify(all)) } catch (e) { } };
  /* how straight the legs stand: vertical crotch → lowest ankle ÷ the bone length of the leg (thigh + shin, mean of the sides that have a knee).
     ≈ 1 standing straight · lower when the knees are bent or the legs spread — such a pose makes a poor STANDARD (null = no knee points to tell) */
  function straightness(rec, dir, w = 384, h = 384) { const { pts: P } = pointsFor(rec, dir), D = (a, b) => a && b ? Math.hypot((a[0] - b[0]) * w, (a[1] - b[1]) * h) : null, legs = [];
    for (const s of ['L', 'R']) { const t = D(P.crotch, P['knee' + s]), c = D(P['knee' + s], P['foot' + s]); if (t != null && c != null) legs.push(t + c) }
    const feet = Math.max(P.footL ? P.footL[1] : -1, P.footR ? P.footR[1] : -1); if (!legs.length || !P.crotch || feet < 0) return null; return Math.min(1.2, (feet - P.crotch[1]) * h / (legs.reduce((a, b) => a + b, 0) / legs.length)) }
  /* v98.420 · GIRTH (ความหนา): the datum is joints only, so thickness comes from the SILHOUETTE: at 30–70 % along each bone a line is cast
     sideways (perpendicular to the bone) from the bone axis until the picture turns transparent; the two distances add up to the thickness there.
     A side that runs into a NEIGHBOURING bone's territory (arm against the torso, leg against the other leg) stops there; when only one side is blocked the
     free side doubled is used instead (the axis is taken to be the centre). Median of the samples per bone. Shown as a fraction of the whole height (skull top → ankle,
     the same total as metrics()) so it can be compared between characters, and after the picture has been rescaled.
     alpha = { d: RGBA bytes, w, h } of the picture the datum points belong to (already flipped the way the points are). Returns null when the datum is too thin.
     result: { total, px:{torso,armUp,armLow,thigh,shin}, frac:{…same}, per:{ torso, upperArmL, … } } (a missing value = not measurable on this picture) */
  const GIRTH_GROUPS = [['torso', 'ลำตัว'], ['armUp', 'ต้นแขน'], ['armLow', 'ท่อนแขนล่าง'], ['thigh', 'ต้นขา'], ['shin', 'แข้ง']];
  function girth(rec, dir, alpha, ts = [.3, .4, .5, .6, .7]) {
    if (!rec || !alpha || !alpha.d) return null; const { w, h, d } = alpha, M = metrics(rec, dir, w, h); if (!M.lengths) return null;
    const { pts: P } = pointsFor(rec, dir), px = k => P[k] ? [P[k][0] * w, P[k][1] * h] : null, sh = mid(P.shL, P.shR) || P.chin, bones = {};
    const HW = { torso: .2, upperArm: .11, foreArm: .09, thigh: .12, shin: .09 };   /* rough half-thickness ÷ bone length, only used to decide where one bone's territory ends and the neighbour's starts */
    const add = (name, a, b, chain) => { if (a && b) bones[name] = { a: a, b: b, chain, hw: (HW[name.replace(/[LR]$/, '')] || .1) * Math.hypot(b[0] - a[0], b[1] - a[1]) }; };
    add('torso', sh && [sh[0] * w, sh[1] * h], px('crotch'), 'torso');
    for (const s of ['L', 'R']) { add('upperArm' + s, px('sh' + s), px('elbow' + s), 'arm' + s); add('foreArm' + s, px('elbow' + s), px('wrist' + s), 'arm' + s); add('thigh' + s, px('crotch'), px('knee' + s), 'leg' + s); add('shin' + s, px('knee' + s), px('foot' + s), 'leg' + s) }
    const segD = (x, y, A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - A[0]) * dx + (y - A[1]) * dy) / l2)); return Math.hypot(x - A[0] - t * dx, y - A[1] - t * dy) };
    const solid = (x, y) => { const xi = Math.round(x), yi = Math.round(y); return xi >= 0 && yi >= 0 && xi < w && yi < h && d[(yi * w + xi) * 4 + 3] > 40 };
    const reach = M.lengths.total * .6, per = {}, spread = {}, lines = {};
    for (const [name, bn] of Object.entries(bones)) {
      const len = Math.hypot(bn.b[0] - bn.a[0], bn.b[1] - bn.a[1]); if (len < 4) continue;
      const ux = (bn.b[0] - bn.a[0]) / len, uy = (bn.b[1] - bn.a[1]) / len, nx = -uy, ny = ux, others = Object.entries(bones).filter(([o, ob]) => o !== name && ob.chain !== bn.chain).map(([, ob]) => ob), vals = [];
      for (const t of ts) {
        const cx = bn.a[0] + (bn.b[0] - bn.a[0]) * t, cy = bn.a[1] + (bn.b[1] - bn.a[1]) * t; if (!solid(cx, cy)) continue;
        const ray = sg => { let r = 0; for (; r < reach; r += .5) { const x = cx + sg * nx * r, y = cy + sg * ny * r; if (!solid(x, y)) return { r, blocked: false }; if (r > 1 && others.some(ob => segD(x, y, ob.a, ob.b) - ob.hw < segD(x, y, bn.a, bn.b) - bn.hw)) return { r, blocked: true } } return { r, blocked: true } };
        const l = ray(1), r = ray(-1); vals.push(l.blocked && !r.blocked ? 2 * r.r : r.blocked && !l.blocked ? 2 * l.r : l.r + r.r);   /* one free side → doubled · otherwise the sum (a side that ends at a neighbour's territory is a good edge estimate too) */
      }
      if (vals.length >= 2) { vals.sort((a, b) => a - b); per[name] = vals[vals.length >> 1]; spread[name] = (vals[vals.length - 1] - vals[0]) / per[name]   /* v98.434 · how much the samples disagree */
        const tm = ts[ts.length >> 1], mx = bn.a[0] + (bn.b[0] - bn.a[0]) * tm, my = bn.a[1] + (bn.b[1] - bn.a[1]) * tm; lines[name] = [mx - nx * per[name] / 2, my - ny * per[name] / 2, mx + nx * per[name] / 2, my + ny * per[name] / 2] }
    }
    const mean = ks => { const v = ks.map(k => per[k]).filter(x => x != null); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null };
    const pxg = { torso: per.torso ?? null, armUp: mean(['upperArmL', 'upperArmR']), armLow: mean(['foreArmL', 'foreArmR']), thigh: mean(['thighL', 'thighR']), shin: mean(['shinL', 'shinR']) }, frac = {};
    for (const [k] of GIRTH_GROUPS) frac[k] = pxg[k] == null ? null : pxg[k] / M.lengths.total;
    /* v98.434 · also ÷ FACE (eye midpoint → chin): the same ruler the depth check uses — it does not change when a pose crouches,
       so thickness can be compared between two poses of ONE character (÷ height would make a crouch look thick) */
    const eye = mid(P.eyeL, P.eyeR), face = eye && P.chin ? Math.hypot((eye[0] - P.chin[0]) * w, (eye[1] - P.chin[1]) * h) : null, perFace = {};
    for (const [k] of GIRTH_GROUPS) perFace[k] = pxg[k] == null || !face ? null : pxg[k] / face;
    return { total: M.lengths.total, face, px: pxg, frac, perFace, per, spread, lines };
  }
  /* v98.434 · THICKNESS RULER (ไม้บรรทัดความหนา): ONE cut across one bone group at one spot (t = 0…1 along the bone), measured against the face
     (eye → chin). Both sides (L/R) are averaged; three casts next to each other (t ± .05) give a confidence. The same bone + t is measured on every
     picture, so  ratio = width ÷ face  can be compared between poses without using any height.  group: shin · thigh · torso · armUp · armLow */
  const RULER_BONES = { shin: ['shinL', 'shinR'], thigh: ['thighL', 'thighR'], torso: ['torso'], armUp: ['upperArmL', 'upperArmR'], armLow: ['foreArmL', 'foreArmR'] };
  function rule(rec, dir, alpha, group, t = .5) {
    const g = girth(rec, dir, alpha, [Math.max(.05, t - .05), t, Math.min(.95, t + .05)]), names = RULER_BONES[group]; if (!g || !g.face || !names) return null;
    const vals = names.map(n => g.per[n]).filter(v => v != null); if (!vals.length) return null; const w = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sp = Math.max(...names.map(n => g.spread[n] ?? 0), vals.length > 1 ? Math.abs(vals[0] - vals[1]) / w : 0);
    return { group, t, w, face: g.face, ratio: w / g.face, sides: vals.length, spread: sp, level: sp <= .12 ? 'ok' : sp <= .25 ? 'warn' : 'bad', lines: names.map(n => g.lines[n]).filter(Boolean), perFace: g.perFace }
  }
  /* the multiplier that gives THIS picture the standard's thickness: standard fraction ÷ own fraction (null when either is unknown) */
  const girthRatio = (own, ref, k) => own?.frac?.[k] && ref?.[k] ? ref[k] / own.frac[k] : null;
  /* the face length and skull-top→ankle height of a datum record, without a picture (to turn a stored ÷height girth into ÷face) */
  function rulers(rec, dir, w = 384, h = 384) { const { pts: P } = pointsFor(rec, dir), eye = mid(P.eyeL, P.eyeR), M = metrics(rec, dir, w, h);
    return { face: eye && P.chin ? Math.hypot((eye[0] - P.chin[0]) * w, (eye[1] - P.chin[1]) * h) : null, total: M.lengths?.total || null } }
  /* v98.434 · girth measured on a picture is remembered per character · pose · frame · direction, so another pose can use it as a
     template without that picture being open. localStorage 'proportion-girth-v1' = { "id|pose|frame|dir": { perFace, frac, at } } (derived — recomputed whenever the picture is shown) */
  const GIRTH_KEY = 'proportion-girth-v1', gKey = (id, pose, frame, dir) => [id, pose, frame | 0, dir].join('|');
  const girthAll = () => { try { return JSON.parse(ls.getItem(GIRTH_KEY) || '{}') || {} } catch (e) { return {} } };
  const girthGet = (id, pose, frame, dir) => girthAll()[gKey(id, pose, frame, dir)] || null;
  function girthPut(id, pose, frame, dir, g) { if (!g || !g.perFace) return; try { const all = girthAll(), k = gKey(id, pose, frame, dir), o = { perFace: g.perFace, frac: g.frac, at: Date.now() }, old = all[k];
      if (old && JSON.stringify(old.perFace) === JSON.stringify(o.perFace)) return; all[k] = o; ls.setItem(GIRTH_KEY, JSON.stringify(all)) } catch (e) { } }
  /* v98.434 · BACK VIEW HEAD from the FRONT (the neck looks longer from behind — the chin hides it in front — so eyes / chin of a back view are a guess).
     The shoulder line and the crotch are seen from both sides, so they are the ruler: in the FRONT view of the same pose, how far the chin sits above the
     shoulder line and how long the face is, both in torso lengths (shoulder mid → crotch) — then laid onto the back view the same way. Returns a SUGGESTION
     ({chin, eyeL, eyeR}) for the datum editor; it is never part of pointsFor() / metrics(), so a back proportion still comes only from points the user confirmed. */
  function suggestHead(rec, dir) {
    if (GROUP[dir] !== 'back' || !rec) return null; const B = pointsFor(rec, dir).pts; if (!B.shL || !B.shR || !B.crotch) return null;
    const shB = (B.shL[1] + B.shR[1]) / 2, TB = B.crotch[1] - shB; if (TB < .03) return null;
    for (const f of ['SW', 'SE']) { const F = pointsFor(rec, f).pts; if (!F.chin || !F.eyeL || !F.eyeR || !F.shL || !F.shR || !F.crotch) continue;
      const shF = (F.shL[1] + F.shR[1]) / 2, TF = F.crotch[1] - shF; if (TF < .03) continue; const a = (shF - F.chin[1]) / TF, b = (F.chin[1] - (F.eyeL[1] + F.eyeR[1]) / 2) / TF; if (!(a > .02 && a < .8 && b > .02 && b < .8)) continue;
      const cx = (B.shL[0] + B.shR[0]) / 2, swF = Math.abs(F.shR[0] - F.shL[0]) || 1, swB = Math.abs(B.shR[0] - B.shL[0]), half = Math.abs(F.eyeR[0] - F.eyeL[0]) / swF * swB / 2, chinY = shB - a * TB, eyeY = chinY - b * TB;
      return { from: f, chin: [cx, chinY], eyeL: [cx - half, eyeY], eyeR: [cx + half, eyeY] } }
    return null }
  /* face length ÷ shin length of one direction — both vertical lengths, so it does not change when the character turns around (null = a point is missing) */
  function faceShin(rec, dir, w = 384, h = 384) { const { pts: P } = pointsFor(rec, dir), eye = mid(P.eyeL, P.eyeR), D = (a, b) => a && b ? Math.hypot((a[0] - b[0]) * w, (a[1] - b[1]) * h) : null;
    const sh = [D(P.kneeL, P.footL), D(P.kneeR, P.footR)].filter(v => v != null && v > 0), f = D(eye, P.chin); return f && sh.length ? f / (sh.reduce((a, b) => a + b, 0) / sh.length) : null }
  /* front ↔ back consistency of one pose: the same ratio from the other group's direction; a gap means an eye / chin point of one side is off (usually the back's) */
  function viewCheck(rec, dir, w = 384, h = 384) { const mine = faceShin(rec, dir, w, h); if (mine == null) return null;
    for (const o of GROUP[dir] === 'back' ? ['SW', 'SE'] : ['NW', 'NE']) { const v = faceShin(rec, o, w, h); if (v != null) { const dev = mine / v - 1; return { dir: o, mine, other: v, dev, level: Math.abs(dev) <= .1 ? 'ok' : Math.abs(dev) <= .2 ? 'warn' : 'bad' } } } return null }
  /* v98.403 · DEPTH CHECK (แนวลึก): every pose of a character against that character's OWN standing pose (idle, frame 0, same direction).
     Measures rigid segments one by one — bending a joint changes the angle between segments, never their length.
     Step 1: the face (eye midpoint → chin) is the ruler → `scale` = how much bigger/smaller the whole frame was drawn.
     Step 2: every other segment ÷ that scale, vs the same segment standing → what is left is a real proportion error.
     A segment can look SHORTER than it is (pointing toward / away from the camera) but never LONGER: longer = wrong (✘ over 10 %),
     shorter = only a hint to look (⚠ over 10 %). Shoulder width gets double tolerance (a slight body turn narrows it). Nothing is warped. */
  const DEPTH_SEGS = [['torso', 'ลำตัว'], ['thighL', 'ต้นขา ซ้ายภาพ'], ['thighR', 'ต้นขา ขวาภาพ'], ['shinL', 'แข้ง ซ้ายภาพ'], ['shinR', 'แข้ง ขวาภาพ'], ['upperArmL', 'ต้นแขน ซ้ายภาพ'], ['upperArmR', 'ต้นแขน ขวาภาพ'], ['foreArmL', 'ท่อนแขนล่าง ซ้ายภาพ'], ['foreArmR', 'ท่อนแขนล่าง ขวาภาพ'], ['shoulderW', 'ไหล่กว้าง']];   /* v98.417: arms count when elbow + wrist were placed on both pictures */
  function segLens(rec, dir, w, h) { const { pts: P } = pointsFor(rec, dir), D = (a, b) => a && b ? Math.hypot((a[0] - b[0]) * w, (a[1] - b[1]) * h) : null, eye = mid(P.eyeL, P.eyeR), sh = mid(P.shL, P.shR);
    return { face: D(eye, P.chin), torso: D(sh || P.chin, P.crotch), thighL: D(P.crotch, P.kneeL), thighR: D(P.crotch, P.kneeR), shinL: D(P.kneeL, P.footL), shinR: D(P.kneeR, P.footR), shoulderW: D(P.shL, P.shR), upperArmL: D(P.shL, P.elbowL), upperArmR: D(P.shR, P.elbowR), foreArmL: D(P.elbowL, P.wristL), foreArmR: D(P.elbowR, P.wristR) } }
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
  const pixelPoints = (rec, dir, w, h) => Object.fromEntries(Object.entries(pointsFor(rec, dir).pts).map(([k, p]) => [k, [p[0] * w, p[1] * h]]));
  const api = { metrics, pixelPoints, MASTER_KEY, master, setMaster, masterName, DEPTH_SEGS, depth, depthText, STD_KEY, GROUP, std, stdPoses, setStd, straightness, girth, girthRatio, GIRTH_GROUPS, rule, RULER_BONES, suggestHead, faceShin, viewCheck, rulers, GIRTH_KEY, girthGet, girthPut, spans, matchScales, status, KEY, POINTS, CENTRE, DIRS, OPP, all, saveAll, get, put, remove, pointsFor, measure, marksFrom, heightGaps };
  root.ProportionDatum = api; if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

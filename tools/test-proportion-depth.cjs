// v98.403 · แนวลึก (js/proportion-datum.js depth): every pose vs the character's own standing pose, segment by segment
const assert = require('node:assert/strict'), store = {};
global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v }, removeItem: k => { delete store[k] } };
const PD = require('../js/proportion-datum.js');
const idle = { eyeL: [.46, .25], eyeR: [.54, .25], chin: [.5, .33], shL: [.38, .36], shR: [.62, .36], chest: [.5, .42], crotch: [.5, .62], kneeL: [.46, .77], kneeR: [.54, .77], footL: [.44, .92], footR: [.56, .92] };
const rot = (o, p, a) => { const dx = p[0] - o[0], dy = p[1] - o[1], c = Math.cos(a), s = Math.sin(a); return [o[0] + dx * c - dy * s, o[1] + dx * s + dy * c] };
const knee = rot(idle.crotch, idle.kneeL, .6), foot = rot(knee, [knee[0] + idle.footL[0] - idle.kneeL[0], knee[1] + idle.footL[1] - idle.kneeL[1]], -1.2);
const grow = (P, k) => Object.fromEntries(Object.entries(P).map(([n, [x, y]]) => [n, [.5 + (x - .5) * k, .33 + (y - .33) * k]]));
PD.put('t', 'idle', 0, { pts: { SW: idle } });
assert.ok(PD.depth('t', 'idle', 0, 'SW').ref, 'idle frame 0 is the reference');
PD.put('t', 'walk', 0, { pts: { SW: { ...idle, kneeL: knee, footL: foot } } });
assert.equal(PD.depth('t', 'walk', 0, 'SW').level, 'ok', 'a bent knee with the same segment lengths passes');
PD.put('t', 'strike', 0, { pts: { SW: { ...idle, kneeR: [.54, .80], footR: [.56, .95] } } });
{ const d = PD.depth('t', 'strike', 0, 'SW'); assert.equal(d.level, 'bad'); assert.equal(d.segs.find(s => s.k === 'thighR').level, 'bad', 'a longer thigh is an error') }
PD.put('t', 'hit', 0, { pts: { SW: grow(idle, 1.08) } });
{ const d = PD.depth('t', 'hit', 0, 'SW'); assert.ok(Math.abs(d.scale - 1.08) < .01, 'whole frame drawn 8% bigger → scale'); assert.ok(d.segs.every(s => s.level === 'ok' || s.level === 'na'), 'but no segment is out of proportion'); assert.equal(d.level, 'warn') }
PD.put('t', 'guard', 0, { pts: { SW: { ...idle, kneeR: [.54, .74], footR: [.56, .86] } } });
{ const d = PD.depth('t', 'guard', 0, 'SW'), th = d.segs.find(s => s.k === 'thighR'); assert.ok(th.dev < -.1 && th.level === 'warn', 'a much shorter segment is only a hint (could be foreshortening)') }
assert.ok(PD.depth('u', 'walk', 0, 'SW') === null, 'no datum for this pose → null');
PD.put('u', 'walk', 0, { pts: { SW: idle } }); assert.ok(PD.depth('u', 'walk', 0, 'SW').noRef, 'no standing pose to compare with');
// v98.404 · master pose per character · per front/back group
PD.put('m', 'walk', 0, { pts: { SW: idle, NW: idle } }); PD.put('m', 'strike', 0, { pts: { SW: { ...idle, kneeR: [.54, .80], footR: [.56, .95] }, NW: idle } });
assert.ok(PD.depth('m', 'strike', 0, 'SW').noRef, 'default master = idle frame 1 (missing here)');
PD.setMaster('m', 'front', { pose: 'walk', frame: 0 });
assert.ok(PD.depth('m', 'walk', 0, 'SW').ref, 'walk is now the front master'); assert.equal(PD.depth('m', 'strike', 0, 'SW').level, 'bad', 'strike compared with walk');
assert.ok(PD.depth('m', 'strike', 0, 'NW').noRef, 'the back group keeps its own master (still idle)');
PD.setMaster('m', 'front', null); assert.ok(PD.depth('m', 'strike', 0, 'SW').noRef, 'reset → idle again'); assert.equal(PD.master('m', 'SW').set, false);
// arms: elbow + wrist on both pictures → upper arm / forearm are checked like the legs (a bent elbow passes, a longer forearm fails)
{ const arm = { shL: [.38, .36], elbowL: [.33, .48], wristL: [.31, .6], shR: [.62, .36], elbowR: [.67, .48], wristR: [.69, .6] }, base = { ...idle, ...arm };
  PD.put('a', 'idle', 0, { pts: { SW: base } }); PD.put('a', 'walk', 0, { pts: { SW: { ...base, wristL: [.2, .55] } } });   // forearm L: length .122 → .148 (+21 %)
  const d = PD.depth('a', 'walk', 0, 'SW'); assert.ok(d.segs.find(s => s.k === 'foreArmL').dev > .1, 'a longer forearm is seen'); assert.equal(d.segs.find(s => s.k === 'upperArmL').level, 'ok');
  assert.equal(PD.depth('t', 'walk', 0, 'SW').segs.find(s => s.k === 'foreArmL').level, 'na', 'no arm points → arms are skipped, not failed') }
// v98.418 · standard per pose (+ migration from the old per-group record) and the straight-legs check
{ const sp = { head: .2, torso: .4, legs: .4 };
  localStorage.setItem(PD.STD_KEY, JSON.stringify({ front: { id: 'x', name: 'X', pose: 'windup', dir: 'SW', spans: sp, at: 1 } }));   // v98.399 shape
  assert.equal(PD.std('front', 'windup').name, 'X', 'old per-group standard moves under its own pose'); assert.equal(PD.std('front', 'idle'), null, 'a windup standard is NOT the idle standard');
  PD.setStd('front', 'idle', { id: 'y', name: 'Y', pose: 'idle', dir: 'SW', spans: sp, at: 2 }); assert.deepEqual(PD.stdPoses('front').sort(), ['idle', 'windup']);
  PD.setStd('front', 'windup', null); assert.equal(PD.std('front', 'windup'), null); assert.equal(PD.std('front', 'idle').name, 'Y');
  assert.equal(PD.std('back', 'idle'), null, 'back group has its own') }
{ const S = PD.straightness({ pts: { SW: idle } }, 'SW'); assert.ok(S > .95, 'standing straight ≈ 1 (' + S + ')');
  const crouch = { ...idle, kneeL: [.32, .66], footL: [.36, .78], kneeR: [.68, .66], footR: [.64, .78] }; assert.ok(PD.straightness({ pts: { SW: crouch } }, 'SW') < .85, 'knees bent / legs spread → well under 1');
  assert.equal(PD.straightness({ pts: { SW: { ...idle, kneeL: null, kneeR: null } } }, 'SW'), null, 'no knee points → cannot tell') }
console.log('proportion depth: all passed');
// v98.420 · GIRTH: thickness from the silhouette, perpendicular to each bone; a side blocked by a neighbour bone is replaced by the free side doubled
{ const W = 200, H = 400, d = new Uint8ClampedArray(W * H * 4), box = (x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) d[(y * W + x) * 4 + 3] = 255 };
  box(80, 60, 120, 100);                // head 40 wide
  box(70, 100, 130, 240);               // torso 60 wide (shoulders y=110 … crotch y=240)
  box(50, 110, 70, 230); box(130, 110, 150, 230);   // arms 20 wide, hanging against the torso (no gap)
  box(76, 240, 98, 380); box(102, 240, 124, 380);   // legs 22 wide with a 4 px gap
  const P = { eyeL: [.45, .17], eyeR: [.55, .17], chin: [.5, .25], shL: [.30, .275], shR: [.70, .275], elbowL: [.30, .43], elbowR: [.70, .43], wristL: [.30, .57], wristR: [.70, .57], crotch: [.5, .6], kneeL: [.435, .8], kneeR: [.565, .8], footL: [.435, .95], footR: [.565, .95] };
  const g = PD.girth({ pts: { SW: P } }, 'SW', { d, w: W, h: H });
  assert.ok(g && Math.abs(g.px.torso - 60) < 4, 'torso width ≈ 60 (arms against it do not eat into it): ' + g?.px.torso);
  assert.ok(Math.abs(g.px.armUp - 20) < 3, 'arm 20 wide (inner side blocked by torso → free side doubled): ' + g.px.armUp);
  assert.ok(Math.abs(g.px.thigh - 22) < 3 && Math.abs(g.px.shin - 22) < 3, 'legs 22 wide though they nearly touch');
  assert.ok(Math.abs(g.frac.torso - g.px.torso / g.total) < 1e-9, 'fraction of the skull-top → ankle height');
  const bare = new Uint8ClampedArray(d), fat = new Uint8ClampedArray(d), clear = (a, x0, x1) => { for (let y = 100; y < 240; y++) for (let x = x0; x < x1; x++) a[(y * W + x) * 4 + 3] = 0 };
  clear(bare, 40, 70); clear(bare, 130, 160); clear(fat, 40, 160); for (let y = 100; y < 240; y++) for (let x = 60; x < 140; x++) fat[(y * W + x) * 4 + 3] = 255;   // torso 60 → 80 wide, arms gone
  const { elbowL, elbowR, wristL, wristR, ...noArms } = P, g1 = PD.girth({ pts: { SW: noArms } }, 'SW', { d: bare, w: W, h: H }), g2 = PD.girth({ pts: { SW: noArms } }, 'SW', { d: fat, w: W, h: H });
  assert.ok(Math.abs(g1.px.torso - 60) < 4 && Math.abs(g2.px.torso - 80) < 4, 'a stouter torso measures wider: ' + g1.px.torso + ' → ' + g2.px.torso);
  assert.ok(Math.abs(PD.girthRatio(g1, g2.frac, 'torso') - g2.frac.torso / g1.frac.torso) < 1e-9, 'ratio = standard ÷ own');
  assert.equal(PD.girth({ pts: { SW: { eyeL: [.4, .2] } } }, 'SW', { d, w: W, h: H }), null, 'too few points → null') }
// v98.429 · ÷face numbers (pose-independent ruler) + remembered measurements + rulers of a bare datum record
{ const W = 200, H = 400, d = new Uint8ClampedArray(W * H * 4); for (let y = 100; y < 240; y++) for (let x = 70; x < 130; x++) d[(y * W + x) * 4 + 3] = 255;
  const P = { eyeL: [.45, .17], eyeR: [.55, .17], chin: [.5, .25], shL: [.30, .275], shR: [.70, .275], crotch: [.5, .6], footL: [.435, .95], footR: [.565, .95] }, rec = { pts: { SW: P } };
  const g = PD.girth(rec, 'SW', { d, w: W, h: H }); assert.ok(Math.abs(g.face - 32) < 1e-9, 'face = eye midpoint → chin in px'); assert.ok(Math.abs(g.perFace.torso - g.px.torso / 32) < 1e-9, 'perFace = px ÷ face');
  const r = PD.rulers(rec, 'SW', W, H); assert.ok(Math.abs(r.face - g.face) < 1e-9 && Math.abs(r.total - g.total) < 1e-9, 'rulers without a picture match');
  PD.girthPut('gx', 'windup', 0, 'SW', g); assert.deepEqual(PD.girthGet('gx', 'windup', 0, 'SW').perFace, g.perFace, 'remembered per character · pose · frame · direction'); assert.equal(PD.girthGet('gx', 'windup', 0, 'SE'), null) }
// v98.431 · thickness ruler: one cut at one spot, ratio = width ÷ face
{ const W = 200, H = 400, d = new Uint8ClampedArray(W * H * 4), box = (x0, y0, x1, y1) => { for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) d[(y * W + x) * 4 + 3] = 255 };
  box(70, 100, 130, 240); box(76, 240, 98, 380); box(102, 240, 124, 380);
  const P = { eyeL: [.45, .17], eyeR: [.55, .17], chin: [.5, .25], shL: [.30, .275], shR: [.70, .275], crotch: [.5, .6], kneeL: [.435, .8], kneeR: [.565, .8], footL: [.435, .95], footR: [.565, .95] };
  const r = PD.rule({ pts: { SW: P } }, 'SW', { d, w: W, h: H }, 'shin', .5);
  assert.ok(r && Math.abs(r.w - 22) < 3 && r.sides === 2, 'shin ruler ≈ 22 px, both legs: ' + r?.w); assert.ok(Math.abs(r.face - 32) < 1e-9 && Math.abs(r.head - 64) < 1e-9 && r.headSrc === 'estimate', 'no crown → head = 2 × face (an estimate)'); assert.ok(Math.abs(r.ratio - r.w / 64) < 1e-9, 'ratio = width ÷ head (64 px)');
  { const rc = PD.rule({ pts: { SW: { ...P, crown: [.5, .05] } } }, 'SW', { d, w: W, h: H }, 'shin', .5); assert.equal(rc.headSrc, 'crown'); assert.ok(Math.abs(rc.head - .2 * H) < 1e-6, 'crown → chin distance'); assert.ok(Math.abs(rc.ratio - rc.w / rc.head) < 1e-9) }
  assert.equal(r.level, 'ok'); assert.equal(r.lines.length, 2, 'one measuring line per leg');
  const scaled = new Uint8ClampedArray(W * H * 4), r2 = PD.rule({ pts: { SW: P } }, 'SW', { d: scaled, w: W, h: H }, 'shin', .5); assert.equal(r2, null, 'empty picture → null');
  assert.equal(PD.rule({ pts: { SW: P } }, 'SW', { d, w: W, h: H }, 'nope', .5), null, 'unknown bone group → null') }
// v98.432 · back-view head suggested from the front (shoulder line + crotch as the ruler) and front↔back consistency
{ const front = { eyeL: [.45, .17], eyeR: [.55, .17], chin: [.5, .25], shL: [.3, .3], shR: [.7, .3], crotch: [.5, .6], kneeL: [.44, .8], kneeR: [.56, .8], footL: [.44, .95], footR: [.56, .95] };
  // the back picture is drawn 20 % bigger and lower, with NO eye / chin placed
  const k = 1.2, back = { shL: [.5 - .2 * k, .35], shR: [.5 + .2 * k, .35], crotch: [.5, .35 + .3 * k], kneeL: [.5 - .06 * k, .35 + .5 * k], kneeR: [.5 + .06 * k, .35 + .5 * k], footL: [.5 - .06 * k, .35 + .65 * k], footR: [.5 + .06 * k, .35 + .65 * k] };
  const rec = { pts: { SW: front, NW: back } }, sg = PD.suggestHead(rec, 'NW');
  assert.ok(sg && sg.from === 'SW', 'a suggestion for the back view'); const near = (a, b) => Math.abs(a - b) < 1e-9;
  assert.ok(near(sg.chin[1], .35 - (.3 - .25) / .3 * (.3 * k)), 'chin: same number of torso lengths above the shoulder line'); assert.ok(near(sg.chin[0], .5), 'centred on the shoulders');
  assert.ok(near(sg.chin[1] - sg.eyeL[1], .08 / .3 * .3 * k), 'face length in torso lengths is kept'); assert.ok(near(sg.eyeR[0] - sg.eyeL[0], .1 * k), 'eye spacing scales with the shoulder width');
  assert.equal(PD.suggestHead(rec, 'SW'), null, 'front views never get a suggestion'); assert.equal(PD.suggestHead({ pts: { NW: back } }, 'NW'), null, 'no front view → nothing');
  assert.ok(!PD.pointsFor(rec, 'NW').pts.chin, 'a suggestion is NOT part of the back view points (only confirmed ones are)');
  const own = { ...back, eyeL: sg.eyeL, eyeR: sg.eyeR, chin: sg.chin }, vc = PD.viewCheck({ pts: { SW: front, NW: own } }, 'NW'); assert.ok(vc && Math.abs(vc.dev) < .01 && vc.level === 'ok', 'consistent front/back → ok: ' + vc?.dev);
  const off = PD.viewCheck({ pts: { SW: front, NW: { ...own, chin: [sg.chin[0], sg.chin[1] + .05] } } }, 'NW'); assert.ok(off.dev > .1 && off.level !== 'ok', 'a chin placed too low is flagged') }
// v98.443 · cut lines (neck / hip): defaults, sides, mirror, learned from a confirmed line, sanity check
{ const P = { eyeL: [.45, .2], eyeR: [.55, .2], chin: [.5, .3], shL: [.35, .38], shR: [.65, .38], crotch: [.5, .65], kneeL: [.45, .8], kneeR: [.55, .8], footL: [.45, .95], footR: [.55, .95] };
  const rec = { pts: { SW: P } }, c = PD.cutsFor(rec, 'SW');
  assert.ok(c.neck && c.hip && c.neck.from === 'default' && !c.neck.own, 'both lines are suggested from the points');
  const mid = ps => [(ps[0][0] + ps.at(-1)[0]) / 2, (ps[0][1] + ps.at(-1)[1]) / 2];
  assert.ok(mid(c.neck.pts)[1] > P.chin[1] && mid(c.neck.pts)[1] < .38, 'the neck line sits between the chin and the shoulder line');
  assert.ok(Math.abs(c.neck.pts[0][1] - c.neck.pts[1][1]) < 1e-9, 'a level head gets a level line');
  assert.ok(mid(c.hip.pts)[1] < P.crotch[1] && mid(c.hip.pts)[1] > P.shL[1], 'the hip line sits above the crotch');
  const eye = [.5, .2];
  assert.ok(PD.sideOf(c.neck.pts, eye, eye) < 0 && PD.sideOf(c.neck.pts, P.crotch, eye) > 0 && PD.sideOf(c.hip.pts, P.crotch, eye) > 0 && PD.sideOf(c.hip.pts, P.chin, eye) < 0, 'head side negative · far side positive');
  assert.deepEqual(PD.cutCheck(rec, 'SW'), [], 'default lines are consistent');
  const bad = { pts: { SW: P }, cuts: { SW: { neck: [[.3, .25], [.7, .25]] } } }; assert.ok(PD.cutCheck(bad, 'SW').some(x => /คาง/.test(x)), 'a neck line above the chin is reported');
  // a tilted head: the line follows the face axis
  const tilt = { ...P, eyeL: [.43, .22], eyeR: [.53, .17], chin: [.52, .31] }; const ct = PD.cutsFor({ pts: { SW: tilt } }, 'SW'); assert.ok(Math.abs(ct.neck.pts[0][1] - ct.neck.pts[1][1]) > .005, 'a leaning head gets a leaning line');
  // confirmed line → mirror to the other direction, and learned for other pictures of the same character
  const conf = { pts: { SW: P }, cuts: { SW: { neck: [[.38, .33], [.62, .33]], hip: [[.38, .6], [.62, .6]] } } };
  const mir = PD.cutsFor({ pts: { SW: P, SE: P }, cuts: conf.cuts }, 'SE'); assert.equal(mir.neck.from, 'mirror'); assert.deepEqual(mir.neck.pts, [[.38, .33], [.62, .33]], 'mirrored (and reversed) for the opposite direction');
  PD.put('cuthero', 'idle', 0, conf); PD.put('cuthero', 'windup', 0, { pts: { SW: { ...P, chin: [.5, .4], eyeL: [.45, .3], eyeR: [.55, .3], crotch: [.5, .72] } } });
  const hint = PD.cutHint('cuthero', 'front', { pose: 'windup', frame: 0, dir: 'SW' }); assert.ok(hint.neck && hint.hip, 'learned from the confirmed idle lines');
  const lc = PD.cutsFor(PD.get('cuthero', 'windup', 0), 'SW', hint); assert.equal(lc.neck.from, 'learned'); assert.ok(mid(lc.neck.pts)[1] > .4, 'a head that is lower now gets a lower line');
  const r2 = JSON.parse(JSON.stringify(conf)); PD.setCut(r2, 'SW', 'neck', null); assert.ok(!r2.cuts.SW.neck && r2.cuts.SW.hip, 'a line can be removed'); PD.setCut(r2, 'SW', 'hip', null); assert.ok(!r2.cuts, 'empty cuts are dropped');
  assert.equal(PD.OPTIONAL[0], 'chest'); assert.equal(PD.status('cuthero', 'idle', 'SW').total, 14, 'the chest point is not required any more') }
// v98.443 · head grows a little with height · pose height guide
assert.ok(Math.abs(PD.headFactor(1.9, 1.7) - 1.0407) < .002, '+11.8 % height → about +4 % head'); assert.equal(PD.headFactor(1.7, 1.7), 1); assert.equal(PD.headFactor(0, 1.7), 1);
assert.ok(Math.abs(PD.headFactor(1.9, 1.7) * PD.thickFactor(1.9, 1.7) - 1.9 / 1.7) < 1e-9, 'head × thickness factors multiply to the height ratio');
{ const stand = { eyeL: [.45, .1], eyeR: [.55, .1], chin: [.5, .2], shL: [.35, .24], shR: [.65, .24], crotch: [.5, .55], kneeL: [.45, .75], kneeR: [.55, .75], footL: [.45, .95], footR: [.55, .95] };
  const crouch = Object.fromEntries(Object.entries(stand).map(([k, [x, y]]) => [k, [x, y <= .2 ? y : .2 + (y - .2) * .8]]));   // same face, body below the chin 20 % shorter
  PD.put('hg', 'idle', 0, { pts: { SW: stand } }); PD.put('hg', 'windup', 0, { pts: { SW: crouch } });
  const hg = PD.heightGuide('hg', 'windup', 0, 'SW'); assert.ok(hg && hg.ratio > .8 && hg.ratio < .9 && hg.level === 'ok', 'a crouch at 85 % of the standing stack is inside the windup guide: ' + hg?.ratio);
  PD.put('hg', 'guard', 0, { pts: { SW: stand } }); assert.equal(PD.heightGuide('hg', 'guard', 0, 'SW').level, 'warn', 'a guard as tall as standing is only a hint'); assert.equal(PD.heightGuide('hg', 'idle', 0, 'SW'), null); assert.equal(PD.heightGuide('hg', 'down', 0, 'SW'), null, 'no guide for a lying pose') }
// v98.448 · shoulder width ÷ eye-chin (torso thickness from datum points) · height guide from a moved record
{ const rec = { pts: { SW: { eyeL: [.45, .1], eyeR: [.55, .1], chin: [.5, .2], shL: [.3, .24], shR: [.7, .24] } } };
  const sr = PD.shoulderRatio(rec, 'SW'); assert.ok(sr > 1.8 && sr < 2.2, 'shoulders ' + sr + ' head heights wide'); assert.equal(PD.shoulderRatio(null, 'SW'), null); assert.equal(PD.shoulderRatio({ pts: { SW: { chin: [.5, .2] } } }, 'SW'), null, 'incomplete points give nothing');
  const wide = JSON.parse(JSON.stringify(rec)); wide.pts.SW.shL = [.2, .24]; wide.pts.SW.shR = [.8, .24]; assert.ok(PD.shoulderRatio(wide, 'SW') > sr, 'wider shoulders → bigger ratio');
  assert.equal(typeof PD.heightGuideRec, 'function'); assert.equal(PD.heightGuideRec('hg', 'idle', rec, 'SW'), null, 'no guide for the standing pose itself') }
// v98.451 · crown point (skull top): head height = crown → chin, no longer a guess from the eyes
{ const base = { eyeL: [.45, .2], eyeR: [.55, .2], chin: [.5, .26], crotch: [.5, .6], footL: [.45, .95], footR: [.55, .95] };
  const est = PD.metrics({ pts: { SW: base } }, 'SW', 100, 100), cr = PD.metrics({ pts: { SW: { ...base, crown: [.5, .05] } } }, 'SW', 100, 100);
  assert.equal(est.headSrc, 'estimate'); assert.equal(cr.headSrc, 'crown'); assert.ok(Math.abs(est.lengths.head - 12) < 1e-6 && Math.abs(cr.lengths.head - 21) < 1e-6, 'head = chin − crown (21), not 2 × face (12)');
  assert.ok(cr.heads < est.heads, 'a bigger head means fewer heads: ' + est.heads + ' → ' + cr.heads);
  assert.equal(PD.headUnit({ pts: { SW: { ...base, crown: [.5, .05] } } }, 'SW', 100, 100).src, 'crown'); assert.equal(PD.headUnit({ pts: { SW: base } }, 'SW', 100, 100).src, 'estimate'); assert.equal(PD.headUnit({ pts: { SW: { chin: [.5, .3] } } }, 'SW'), null);
  assert.ok(PD.POINTS[3][0] === 'crown' && PD.OPTIONAL.includes('crown') && PD.CENTRE.includes('crown'), 'crown follows the chin · optional · centre point');
  const tilt = { pts: { SW: { ...base, crown: [.62, .05] } } }, flat = { pts: { SW: { ...base, crown: [.5, .05] } } }; assert.ok(PD.headUnit(tilt, 'SW', 100, 100).px > PD.headUnit(flat, 'SW', 100, 100).px, 'a tilted head is measured as a distance') }
// v98.452 · hand-measured thickness: two clicked points across one bone ÷ head height
{ const P = { eyeL: [.45, .2], eyeR: [.55, .2], chin: [.5, .26], crown: [.5, .05], wdA: [.40, .7], wdB: [.46, .7] };
  const wd = PD.widthOf({ pts: { SW: P } }, 'SW', 100, 100); assert.ok(wd && Math.abs(wd.px - 6) < 1e-9 && Math.abs(wd.ratio - 6 / 21) < 1e-9 && wd.own && wd.headSrc === 'crown', 'width 6 px ÷ head 21 px');
  const mir = PD.widthOf({ pts: { SW: P } }, 'SE', 100, 100); assert.ok(mir === null || !mir.own, 'the opposite direction only borrows (not own)');
  assert.equal(PD.widthOf({ pts: { SW: { ...P, wdB: undefined } } }, 'SW'), null, 'one point is not a width'); assert.equal(PD.widthOf({ pts: { SW: { wdA: [.4, .7], wdB: [.5, .7] } } }, 'SW'), null, 'no head → no unit');
  assert.ok(PD.pixelPoints({ pts: { SW: P } }, 'SW', 100, 100).wdA, 'the width points travel with the other points when a picture is warped') }
// v98.454 · the cut-line check judges the lines in use, with a small tolerance
{ const P = { eyeL: [.45, .2], eyeR: [.55, .2], chin: [.5, .26], crotch: [.5, .6], shL: [.35, .3], shR: [.65, .3] };
  const own = { pts: { SW: P }, cuts: { SW: { hip: [[.3, .5], [.7, .5]] } } }; assert.ok(!PD.cutCheck(own, 'SW').some(x => /ขาหนีบ/.test(x)), 'crotch below the leg line → no warning');
  const above = { pts: { SW: P }, cuts: { SW: { hip: [[.3, .65], [.7, .65]] } } }; assert.ok(PD.cutCheck(above, 'SW').some(x => /ขาหนีบ/.test(x)), 'crotch above the leg line → warns');
  const onLine = { pts: { SW: P }, cuts: { SW: { hip: [[.3, .6], [.7, .6]] } } }; assert.ok(!PD.cutCheck(onLine, 'SW').some(x => /ขาหนีบ/.test(x)), 'crotch on the line → tolerated');
  const used = PD.cutsFor(above, 'SW'), fake = { ...used, hip: { ...used.hip, pts: [[.3, .5], [.7, .5]] } }; assert.ok(!PD.cutCheck(above, 'SW', fake).some(x => /ขาหนีบ/.test(x)), 'a precomputed set of lines is the one that is checked') }
console.log('proportion girth: passed');

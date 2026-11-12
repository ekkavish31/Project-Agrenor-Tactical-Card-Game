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
console.log('proportion girth: passed');

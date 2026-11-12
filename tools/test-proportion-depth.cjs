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

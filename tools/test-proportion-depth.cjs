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
{ const d = PD.depth('t', 'hit', 0, 'SW'); assert.ok(Math.abs(d.scale - 1.08) < .01, 'whole frame drawn 8% bigger → scale'); assert.ok(d.segs.every(s => s.level === 'ok'), 'but no segment is out of proportion'); assert.equal(d.level, 'warn') }
PD.put('t', 'guard', 0, { pts: { SW: { ...idle, kneeR: [.54, .74], footR: [.56, .86] } } });
{ const d = PD.depth('t', 'guard', 0, 'SW'), th = d.segs.find(s => s.k === 'thighR'); assert.ok(th.dev < -.1 && th.level === 'warn', 'a much shorter segment is only a hint (could be foreshortening)') }
assert.ok(PD.depth('u', 'walk', 0, 'SW') === null, 'no datum for this pose → null');
PD.put('u', 'walk', 0, { pts: { SW: idle } }); assert.ok(PD.depth('u', 'walk', 0, 'SW').noRef, 'no standing pose to compare with');
console.log('proportion depth: all passed');

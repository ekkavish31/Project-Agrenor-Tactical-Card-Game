// v98.380 · head / torso / legs re-proportioning maths (js/proportion-adjust.js) — pure numbers, no canvas
const assert = require('node:assert/strict'), PA = require('../js/proportion-adjust.js');
const m = { top: 20, bottom: 339, H: 320, w: 384, h: 384 }, marks = { chin: .25, hip: .6 }, seg = PA.segments(m, marks);
assert.deepEqual([seg.head, seg.torso, seg.legs], [[20, 100], [100, 212], [212, 340]]);
{ const P = PA.plan(seg, { head: 1, torso: 1, legs: 1 }); assert.ok(Math.abs(P.H1 - P.H0) < 1e-9 && Math.abs(P.headFrac - 80 / 320) < 1e-9 && P.legs[1] === 340, 'identity keeps everything') }
{ const P = PA.plan(seg, { head: 1.2, torso: 1, legs: 1 }, { keepHeight: true }); assert.ok(Math.abs(P.H1 - P.H0) < 1e-9, 'keepHeight restores the height'); assert.ok(P.headFrac > .25 && P.legs[1] === 340, 'head bigger, feet on the same row') }
{ const P = PA.plan(seg, { head: 1.2, torso: 1, legs: 1 }, { keepHeight: false }); assert.ok(P.H1 > P.H0, 'without keepHeight the figure grows') }
for (const [sel, t] of [[{ head: true }, .30], [{ head: true }, .20], [{ torso: true, legs: true }, .30], [{ legs: true }, .30]]) {
  const a = PA.autoScale(seg, sel, t), P = PA.plan(seg, a); assert.ok(Math.abs(P.headFrac - t) < 1e-6, 'auto hits the head target ' + JSON.stringify(sel) + ' ' + t + ' got ' + P.headFrac) }
{ const a = PA.autoScale(seg, {}, .3); assert.equal(a.head, 1); assert.ok(a.note) }
{ const a = PA.autoScale(seg, { head: true, torso: true }, .30); assert.equal(a.torso, 1, 'head + body selected → only the head moves'); assert.ok(a.head > 1) }
console.log('proportion adjust: all passed');
// v98.420 · thickness multipliers change only the sideways stretch of the torso / legs band
{ const PA = require('../js/proportion-adjust.js'), seg = { head: [0, 100], torso: [100, 300], legs: [300, 500], top: 0, bottom: 500 };
  const a = PA.plan(seg, { head: 1, torso: 1, legs: 1 }), b = PA.plan(seg, { head: 1, torso: 1, legs: 1, wTorso: 1.2, wLegs: .8 });
  const eq = (x, y) => Math.abs(x - y) < 1e-9;
  if (!(eq(b.kx.torso, a.kx.torso * 1.2) && eq(b.kx.legs, a.kx.legs * .8) && eq(b.k.torso, a.k.torso) && eq(b.k.legs, a.k.legs) && eq(b.torso[1], a.torso[1]))) throw new Error('wTorso/wLegs must only change kx');
  console.log('proportion width multipliers: passed') }
// v98.443 · zones from CUT LINES: level lines = the old chin / hip rows · a tilted line tilts the zone edge · head side decided by the reference point
{ const PA = require('../js/proportion-adjust.js'), W = 80, H = 120, d = new Uint8ClampedArray(W * H * 4).fill(255), seg = { head: [0, 40], torso: [40, 80], legs: [80, 120], top: 0, bottom: 120 };
  const rows = PA.weightsOf(d, W, H, seg, 'band', 4, 2), cuts = { neck: [[0, 40], [W, 40]], hip: [[0, 80], [W, 80]], head: [40, 10] }, lines = PA.weightsOf(d, W, H, seg, 'band', 4, 2, cuts);
  let maxd = 0; for (let k = 0; k < 3; k++) for (let i = 0; i < W * H; i++) maxd = Math.max(maxd, Math.abs(rows[k][i] - lines[k][i]));
  if (maxd > 1e-4) throw new Error('level cut lines must give the same zones as the rows: ' + maxd);
  const tilt = PA.weightsOf(d, W, H, seg, 'band', 2, 2, { neck: [[0, 30], [W, 50]], hip: [[0, 80], [W, 80]], head: [40, 10] }), at = (z, x, y) => z[0][y * W + x];
  if (!(at(tilt, 75, 34) > .9 && at(tilt, 5, 34) < .1 && at(tilt, 75, 46) > .9 && at(tilt, 5, 46) < .1)) throw new Error('a tilted neck line must tilt the head zone');
  const inv = PA.weightsOf(d, W, H, seg, 'band', 4, 2, { neck: [[0, 40], [W, 40]], hip: [[0, 80], [W, 80]], head: [40, 110] }); if (!(inv[0][5 * W + 5] < .1 && inv[2][5 * W + 5] > .9)) throw new Error('the zone on the reference point\'s side is the head');
  const sh = PA.weightsOf(d, W, H, seg, 'shape', 4, 2, cuts); for (let i = 0; i < W * H; i += 97) if (Math.abs(sh[0][i] + sh[1][i] + sh[2][i] - 1) > 1e-3) throw new Error('shape-mode weights with cut lines must sum to 1');
  console.log('proportion cut-line zones: passed') }

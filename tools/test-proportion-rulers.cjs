/* v98.436 · user-drawn rulers: ratio / compare / plan / storage. Run: node tools/test-proportion-rulers.cjs */
const assert = require('node:assert/strict');
const mem = {}; global.window = undefined;
globalThis.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v) } };
const R = require('../js/proportion-rulers.js');
// length in pixels uses the picture size, not the fractions
assert.equal(R.dist([0, 0], [0, .5], 100, 200), 100);
assert.equal(R.dist([0, 0], [.5, 0], 100, 200), 50);
// the base: face 40px, legs 160px → ratio 4 ; the target is drawn bigger (face 50px, legs 250px → 5)
const base = { legs: R.make('legs', [.5, .5], [.5, 1], 100, 320, 40), torso: R.make('torso', [.5, .2], [.5, .5], 100, 320, 40) };
const own = { legs: R.make('legs', [.5, .5], [.5, 1], 100, 500, 50), torso: R.make('torso', [.5, .2], [.5, .5], 100, 500, 50) };
assert.equal(base.legs.ratio, 4); assert.equal(own.legs.ratio, 5);
assert.ok(Math.abs(R.scaleOf(own.legs, base.legs) - .8) < 1e-9, 'target legs 25% longer → ×0.80');
assert.equal(R.scaleOf(own.legs, null), null); assert.equal(R.scaleOf({ ratio: 0 }, base.legs), null);
assert.equal(R.fmt(.8), '×0.80'); assert.equal(R.fmt(null), '—');
assert.equal(R.level(1.03), 'ok'); assert.equal(R.level(.9), 'warn'); assert.equal(R.level(.7), 'bad'); assert.equal(R.level(null), 'none');
// plan: two leg rulers average; a ruler with no part (height) is shown but feeds nothing
const o2 = { ...own, thigh: { ratio: 2 }, height: { ratio: 10 } }, b2 = { ...base, thigh: { ratio: 3 }, height: { ratio: 9 } };
const p = R.plan(o2, b2);
assert.deepEqual(p.rows.map(r => r.k).sort(), ['height', 'legs', 'thigh', 'torso']);
assert.ok(Math.abs(p.parts.legs - (.8 + 1.5) / 2) < 1e-9); assert.ok(Math.abs(p.parts.torso - .8) < 1e-9); assert.equal(p.parts.head, undefined);
assert.equal(R.plan({}, {}).rows.length, 0); assert.equal(R.plan(null, null).rows.length, 0);
assert.equal(R.clamp(5), 2); assert.equal(R.clamp(.1), .5);
// storage round-trip + remove cleans empty branches
R.put('hero', 'idle', 'SW', 'legs', base.legs); R.put('hero', 'idle', 'SW', 'torso', base.torso);
assert.equal(Object.keys(R.list('hero', 'idle', 'SW')).length, 2); assert.equal(Object.keys(R.list('hero', 'idle', 'NE')).length, 0);
R.remove('hero', 'idle', 'SW', 'legs'); R.remove('hero', 'idle', 'SW', 'torso'); assert.deepEqual(R.all(), {});
// swap: the rulers move with the pictures
R.put('hero', 'walk', 'SW', 'legs', base.legs); R.swap('hero', 'walk', 'SW', 'idle', 'NW');
assert.equal(Object.keys(R.list('hero', 'walk', 'SW')).length, 0); assert.ok(R.list('hero', 'idle', 'NW').legs);
R.swap('hero', 'walk', 'SW', 'idle', 'NW'); assert.ok(R.list('hero', 'walk', 'SW').legs); R.remove('hero', 'walk', 'SW', 'legs'); assert.deepEqual(R.all(), {});
console.log('proportion rulers: all passed');

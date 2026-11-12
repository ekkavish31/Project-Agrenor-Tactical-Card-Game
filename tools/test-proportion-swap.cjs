/* v98.436 · drag-swap of two animation cells: datum points travel with the pictures. Run: node tools/test-proportion-swap.cjs */
const assert = require('node:assert/strict');
const PD = require('../js/proportion-datum.js');
const P = (x) => ({ chin: [x, .3] });
// walk SW (2 frames) ↔ idle NW (1 frame): only n=1 frame swaps
let d = { hero: { walk: { 0: { pts: { SW: P(.1) } }, 1: { pts: { SW: P(.2) } } }, idle: { 0: { pts: { NW: P(.9) } } } } };
PD.swapPts(d, 'hero', 'walk', 'SW', 'idle', 'NW', 1);
assert.deepEqual(d.hero.walk[0].pts.SW, P(.9)); assert.deepEqual(d.hero.idle[0].pts.NW, P(.1)); assert.deepEqual(d.hero.walk[1].pts.SW, P(.2), 'frame beyond n stays');
// one side without points: the other side ends up with none, and empty branches are removed
d = { hero: { walk: { 0: { pts: { SW: P(.1) } } } } };
PD.swapPts(d, 'hero', 'walk', 'SW', 'idle', 'NW', 1);
assert.deepEqual(d.hero.idle[0].pts.NW, P(.1)); assert.equal(d.hero.walk, undefined, 'source branch cleaned');
// nothing on either side: no-op (and an empty character is not left behind)
d = {}; PD.swapPts(d, 'ghost', 'walk', 'SW', 'walk', 'SE', 3); assert.deepEqual(d, {});
// same pose, two directions; other directions untouched
d = { hero: { idle: { 0: { pts: { SW: P(.1), SE: P(.2), NE: P(.7) } } } } };
PD.swapPts(d, 'hero', 'idle', 'SW', 'idle', 'SE', 1);
assert.deepEqual(d.hero.idle[0].pts, { SW: P(.2), SE: P(.1), NE: P(.7) });
// swapping twice restores the original
PD.swapPts(d, 'hero', 'idle', 'SW', 'idle', 'SE', 1); assert.deepEqual(d.hero.idle[0].pts, { SW: P(.1), SE: P(.2), NE: P(.7) });
console.log('proportion swap: all passed');

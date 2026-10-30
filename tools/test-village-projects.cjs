/* v97.35 · R3 village projects: paid once, needs the gold and the prologue done, has() sees it */
const assert = require('node:assert/strict');
let g = { day: 4, village: { coins: 200, story: { mode: 'active' } } };
globalThis.WorldState = { game: () => g, commit: () => { } };
const VP = require('../js/village-projects.js');
assert.equal(VP.build('road'), false, 'locked during the prologue');
g.village.story.mode = 'done';
assert.equal(VP.build('drill'), false, 'not enough gold (300)');
assert.equal(VP.build('road'), true); assert.equal(g.village.coins, 50); assert.equal(VP.has('road'), true); assert.equal(g.village.projects.road, 4);
assert.equal(VP.build('road'), false, 'only once');
assert.equal(VP.has('watch'), false);
console.log('village projects: 6 checks passed');

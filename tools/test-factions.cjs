/* v97.41 · T2 reputation: clamps to ±100, tiers, perks scale with steps above neutral */
const assert = require('node:assert/strict');
const g = { day: 3, village: {} }; globalThis.WorldState = { game: () => g, commit: () => { } };
const F = require('../js/factions.js');
assert.equal(F.rep('guild'), 0); assert.equal(F.tier('guild')[1], 'กลาง ๆ'); assert.equal(F.rank('guild'), 0); assert.equal(F.payMult('guild'), 1);
F.add('guild', 25, 'test'); assert.equal(F.tier('guild')[1], 'เป็นมิตร'); assert.equal(F.rank('guild'), 1); assert.equal(F.payMult('guild'), 1.1);
F.add('merchants', 60); assert.equal(F.rank('merchants'), 2); assert.equal(F.priceMult('merchants'), .9);
F.add('village', -500); assert.equal(F.rep('village'), -100); assert.equal(F.tier('village')[1], 'ศัตรู');
F.add('temple', 999); assert.equal(F.rep('temple'), 100); assert.equal(F.rank('temple'), 3);
assert.equal(g.village.repLog[0].id, 'temple'); assert.ok(g.village.repLog.length <= 12);
console.log('factions: 14 checks passed');

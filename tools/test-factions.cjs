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
/* v97.92 · faction ties: allies share a quarter, rivals lose a fifth, small spills are dropped, no chains */
{ const g2 = { day: 1, village: {} }; globalThis.WorldState = { game: () => g2, commit: () => { } }; delete require.cache[require.resolve('../js/factions.js')]; const F2 = require('../js/factions.js');
  F2.add('crown', 20, 'test'); assert.equal(F2.rep('crown'), 20); assert.equal(F2.rep('village'), 5, 'ally +25%'); assert.equal(F2.rep('garrison'), 5); assert.equal(F2.rep('merchants'), -4, 'rival −20%');
  assert.equal(F2.rep('guild'), 0, 'no chain reaction through the garrison'); F2.add('temple', 1); assert.equal(F2.rep('village'), 5, 'tiny spills are dropped');
  assert.equal(g2.village.repLog[0].id, 'temple', 'the deed itself leads the log'); F2.add('guild', -10); assert.equal(F2.rep('garrison'), 7, 'hurting a rival pleases the other side');
  console.log('faction ties: 8 checks passed') }

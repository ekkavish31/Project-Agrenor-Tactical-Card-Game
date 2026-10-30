/* v97.43 · T1 settlements: local goods change prices, standing with the ruler lowers them */
const assert = require('node:assert/strict');
const g = { village: {} }; globalThis.WorldState = { game: () => g, commit: () => { } };
const F = require('../js/factions.js'), S = require('../js/settlements.js');
assert.equal(S.price('haven', 'fish', 10), 8, 'cheap where it is made');
assert.equal(S.price('haven', 'fur', 10), 14, 'dear where it is brought in');
assert.equal(S.price('fernvale', 'iron', 10), 10, 'neither');
F.add('merchants', 60); assert.equal(S.price('haven', 'potion', 18), 12, 'cheap × standing 2 steps (18 × .75 × .9)');
assert.equal(S.info('northgate').sizeInfo.name, 'เมือง'); assert.equal(S.info('haven').ruler, 'merchants'); assert.ok(F.FACTIONS[S.info('northgate').ruler], 'every ruler is a faction');
for (const T of Object.values(S.SETTLEMENTS)) assert.ok(F.FACTIONS[T.ruler] && S.SIZE[T.size]);
console.log('settlements: 8 checks passed');

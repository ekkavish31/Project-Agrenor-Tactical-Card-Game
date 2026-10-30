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
/* v97.44 · trade: buy cheap where it is made, sell dear where it is brought in, cargo limit, gold limit */
{ const W = { gold: 100 }; const c = S.trade('haven', W, 'salt', 5); assert.equal(W.cargo.salt, 5); assert.equal(W.gold, 100 + c);
  const g = S.trade('fernvale', W, 'salt', -5); assert.ok(g > -c, 'salt sells dearer in Fernvale than it cost at the port'); assert.equal(W.cargo.salt, undefined);
  W.gold = 1000; S.trade('northgate', W, 'iron', 50); assert.equal(S.load(W), S.CARGO_MAX, 'the wagon is full');
  const P = { gold: 7 }; S.trade('fernvale', P, 'cloth', 3); assert.equal(P.cargo.cloth || 0, 0, 'no gold, no goods') }
console.log('settlements: 13 checks passed');

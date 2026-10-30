/* v97.43 · T1 settlements: local goods change prices, standing with the ruler lowers them */
const assert = require('node:assert/strict');
const g = { village: {} }; globalThis.WorldState = { game: () => g, commit: () => { } };
const F = require('../js/factions.js'), S = require('../js/settlements.js');
assert.equal(S.price('haven', 'fish', 10), Math.round(10 * .75 * S.swing('haven', 'fish')), 'cheap where it is made');
assert.equal(S.price('haven', 'fur', 10), Math.round(10 * 1.35 * S.swing('haven', 'fur')), 'dear where it is brought in');
assert.equal(S.price('fernvale', 'iron', 10), Math.round(10 * S.swing('fernvale', 'iron')), 'neither');
F.add('merchants', 60); assert.equal(S.price('haven', 'potion', 18), Math.round(18 * .75 * S.swing('haven', 'potion') * .9), 'cheap × swing × standing 2 steps');
assert.equal(S.info('northgate').sizeInfo.name, 'เมือง'); assert.equal(S.info('haven').ruler, 'merchants'); assert.ok(F.FACTIONS[S.info('northgate').ruler], 'every ruler is a faction');
for (const T of Object.values(S.SETTLEMENTS)) assert.ok(F.FACTIONS[T.ruler] && S.SIZE[T.size]);
/* v97.44 · trade: buy cheap where it is made, sell dear where it is brought in, cargo limit, gold limit */
{ const W = { gold: 100 }; const c = S.trade('haven', W, 'salt', 5); assert.equal(W.cargo.salt, 5); assert.equal(W.gold, 100 + c);
  const g = S.trade('fernvale', W, 'salt', -5); assert.equal(g, 5 * S.sellPrice('fernvale', 'salt'), 'sold at the local price'); assert.equal(W.cargo.salt, undefined);
  W.gold = 1000; S.trade('northgate', W, 'iron', 50); assert.equal(S.load(W), S.CARGO_MAX, 'the wagon is full');
  const P = { gold: 7 }; S.trade('fernvale', P, 'cloth', 3); assert.equal(P.cargo.cloth || 0, 0, 'no gold, no goods') }
/* v97.54 · T6 phase 2: wagon upgrades, escort, cargo losses, weekly swings stay in range */
{ const W = { gold: 1000 }; assert.equal(S.cargoMax(W), 12); assert.ok(S.wagonUp(W)); assert.equal(S.cargoMax(W), 20); assert.ok(S.wagonUp(W)); assert.equal(S.cargoMax(W), 30); assert.equal(S.wagonUp(W), false);
  assert.ok(S.hireEscort(W)); assert.ok(S.escorted(W)); W.cargo = { salt: 10, fur: 3 }; const lost = S.loseCargo(W, .5); assert.equal(W.cargo.salt, 5); assert.equal(W.cargo.fur, 1); assert.equal(lost.length, 2);
  for (const id of Object.keys(S.SETTLEMENTS)) for (const k of Object.keys(S.TRADE)) for (let w = 0; w < 6; w++) { const v = S.swing(id, k, w); assert.ok(v >= .8 && v <= 1.25) } }
console.log('settlements: 21 checks passed');

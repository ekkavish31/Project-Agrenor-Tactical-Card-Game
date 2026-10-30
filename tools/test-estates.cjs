/* v97.49 · T4/T5 estates: claim/rent, build, daily production with caps, rent arrears → repossession, raids only out in the wild */
const assert = require('node:assert/strict');
const g = { village: {} }; globalThis.WorldState = { game: () => g, commit: () => { } };
require('../js/factions.js'); require('../js/settlements.js'); const E = require('../js/estates.js');
const S = { gold: 1000, food: 0, day: 1 };
const t = E.claim(S, 'town:haven', 'ท่าเรือ'); assert.ok(t.ok); assert.equal(S.gold, 1000 - 60, 'first week of rent paid');
assert.ok(E.build(S, t.plot.id, 'shop').ok); assert.equal(S.gold, 940 - 200);
S.day = 4; E.tickAll(S); assert.equal(t.plot.gold, 16 * 3, 'city shop: 16 a day');
S.day = 30; E.tickAll(S); assert.equal(t.plot.gold, 16 * 7, 'takings stop at 7 days'); 
S.day = 23; // (time does not go back in play; reset for the arrears check)
const w = E.claim(S, 'tile:5,5'); assert.ok(w.ok); assert.equal(w.plot.paidTo, 23, 'open land: no rent');
assert.ok(E.build(S, w.plot.id, 'farm').ok); S.day = 33; const msgs = E.tickAll(S);
assert.ok(w.plot.food <= 14, 'farm store capped'); assert.ok(Array.isArray(msgs));
assert.equal(E.list(S).some(p => p.at === 'town:haven'), false, 'two weeks of unpaid rent: the city took the plot back');
assert.ok(E.fence(S, w.plot.id) && E.fence(S, w.plot.id) && !E.fence(S, w.plot.id), 'two fence levels at most');
for (let i = 0; i < 3; i++) E.claim(S, 'tile:' + i + ',0'); assert.equal(E.claim(S, 'tile:9,9').ok, false, 'four plots at most');
const r = E.collect(S, w.plot.id); assert.equal(w.plot.food, 0); assert.ok(r.food >= 0);
/* v97.57 · a hired guard cuts raids to about a third (seeded rolls over many days) */
{ const raids = guard => { let n = 0; for (let k = 0; k < 40; k++) { const T = { gold: 9999, day: 1 }; const c = E.claim(T, 'tile:1,' + k); E.build(T, c.plot.id, 'farm'); c.plot.hp = 1e9; if (guard) { E.hireGuard(T, c.plot.id); c.plot.guardTo = 999 } T.day = 61; n += E.tick(T, c.plot).filter(m => m.includes('ถูกบุก')).length } return n };
  const a = raids(false), b = raids(true); assert.ok(b < a * .55, 'guarded plots are raided much less (' + b + ' vs ' + a + ')');
  const T = { gold: 30, day: 1 }; const c = E.claim(T, 'tile:7,7'); assert.equal(E.hireGuard(T, c.plot.id), false, 'needs 40 gold'); assert.equal(E.hireGuard({ gold: 99, day: 1, estates: [] }, 'x'), false) }
console.log('estates: 17 checks passed');

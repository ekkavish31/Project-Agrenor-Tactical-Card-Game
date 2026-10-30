/* v97.52 · T3 law: theft odds, caught → fine + heat + standing, pay / cells / run, heat cools weekly, service lowers heat */
const assert = require('node:assert/strict');
const g = { day: 1, village: {} }; globalThis.WorldState = { game: () => g, commit: () => { } };
const F = require('../js/factions.js'); require('../js/settlements.js'); const L = require('../js/law.js');
assert.ok(L.stealChance({ rogue: true }) > L.stealChance({}), 'rogues are better thieves'); assert.ok(L.stealChance({ unwatched: true }) > L.stealChance({}));
const S = { gold: 100 };
assert.ok(L.steal(S, 'fernvale', { rng: () => 0 }).ok, 'a lucky theft');
const c = L.steal(S, 'fernvale', { rng: () => .99 }); assert.ok(c.caught); assert.equal(L.file(S, 'fernvale').heat, 1); assert.equal(c.fine, 30); assert.ok(F.rep('village') < 0, 'standing drops');
assert.equal(L.clean(S, 'fernvale'), false); assert.ok(L.pay(S, 'fernvale')); assert.equal(S.gold, 70); assert.ok(L.clean(S, 'fernvale'));
L.steal(S, 'haven', { rng: () => .99 }); L.run(S, 'haven'); assert.equal(L.file(S, 'haven').wanted, true); assert.equal(L.owed(S, 'haven'), L.file(S, 'haven').fine + 30, 'running adds to the bill');
L.jail(S, 'haven'); assert.ok(L.clean(S, 'haven'), 'a night in the cells clears it');
g.day = 22; assert.equal(L.file(S, 'fernvale').heat, 0, 'heat cools by one a week');
L.steal(S, 'fernvale', { rng: () => .99 }); const h = L.file(S, 'fernvale').heat; L.service(S, 'fernvale'); assert.equal(L.file(S, 'fernvale').heat, h - 1);
console.log('law: 14 checks passed');

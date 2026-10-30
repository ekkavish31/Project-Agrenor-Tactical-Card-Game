/* v97.73 · T3 bounties: weekly posters, take ≤ 2, a hex on the real map, slain → claim at a board, expiry */
const assert = require('node:assert/strict');
const g = { day: 1, village: { coins: 0 } };
globalThis.WorldState = { game: () => g, commit: () => { } };
globalThis.window = globalThis; require('../js/world-norchorthal.js');
const F = require('../js/factions.js'); globalThis.Settlements = require('../js/settlements.js'); globalThis.Law = require('../js/law.js');
const G = require('../js/world-gen.js'); const B = require('../js/bounties.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ }, eq = (a, b, m) => { assert.equal(a, b, m); n++ };
const S = { gold: 0, known: {} };
const o1 = B.offers(S, 'fernvale'); eq(o1.length, 3); ok(o1.every(o => o.tier <= 2), 'the village board posts small and middling bounties');
ok(B.offers(S, 'lakenhold').every(o => o.tier >= 2), 'the capital posts bigger ones');
eq(JSON.stringify(B.offers(S, 'fernvale')), JSON.stringify(o1), 'same posters all week');
g.day = 8; ok(JSON.stringify(B.offers(S, 'fernvale')) !== JSON.stringify(o1), 'new posters next week'); g.day = 1;
ok(B.take(S, o1[0]) && B.take(S, o1[1])); eq(B.take(S, o1[2]), false, 'two at a time'); ok(B.offers(S, 'fernvale')[0].taken);
const w = G.generate(777); B.place(S, w, G);
for (const b of S.bounties) { ok(b.c != null && b.foe, b.name + ' has a hex and a foe'); const d = G.dist(b, w.home), T = B.TIERS[b.tier]; ok(d >= T.min && d <= T.max, 'at the right distance (' + d + ')'); ok(S.known[b.c + ',' + b.r], 'its hex is marked on the map'); ok(!w.tiles[b.c + ',' + b.r].poi, 'not on a town') }
const [a, b] = S.bounties; eq(B.at(S, a.c, a.r), a);
B.slain(S, a); eq(B.at(S, a.c, a.r), null, 'a slain one is no longer there');
const rep0 = F.rep('guild'); const m = B.claim(S, 'lakenhold'); eq(S.gold, a.reward, 'claim at any board'); ok(F.rep('guild') > rep0); ok(m[0].includes(String(a.reward))); eq(S.bountiesDone, 1);
eq(B.claim(S, 'fernvale').length, 0, 'paid once');
g.day = 12; const ex = B.expire(S); ok(ex.length === 1 && b.state === 'failed', 'past its days it fails');
ok(B.take(S, o1[2]), 'room again after one is done and one failed');
console.log('bounties: ' + n + ' checks passed');

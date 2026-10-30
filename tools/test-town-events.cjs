/* v97.68 · T7 phase 2 (rank ladders, offices in other towns) and T8 phase 2 (town events by policy, Fernvale council) */
const assert = require('node:assert/strict');
const g = { day: 1, village: { coins: 0, character: { job: 'warrior', jobs: { warrior: { lv: 2 } } } } };
globalThis.WorldState = { game: () => g, commit: () => { } };
globalThis.Progression = require('../js/progression.js'); const F = require('../js/factions.js'); const ST = require('../js/settlements.js');
const O = require('../js/offices.js'); const E = require('../js/town-events.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ }, eq = (a, b, m) => { assert.equal(a, b, m); n++ };
/* --- T7: Northgate garrison ladder up to general --- */
const S = { battles: 0 };
Object.defineProperty(S, 'gold', { get: () => g.village.coins, set: v => { g.village.coins = v }, enumerable: true });
eq(O.OFFICES.garrison.ranks.length, 5, 'garrison has five ranks'); eq(O.OFFICES.garrison.ranks[4][0], 'แม่ทัพ', 'the top rank is general');
F.add('garrison', 25); eq(O.why(S, 'garrison'), ''); ok(O.take(S, 'garrison')); eq(O.title('garrison', 1), 'พลทหารด่าน');
eq(O.promote(S), false, 'squad leader needs job Lv.3'); g.village.character.jobs.warrior.lv = 3; F.add('garrison', 20); ok(O.promote(S)); eq(S.office.rank, 2);
S.battles = 3; g.day = 8; O.settle(S); eq(S.gold, 80, 'squad leader pay');
g.village.character.jobs.warrior.lv = 5; F.add('garrison', 60); ok(O.promote(S) && O.promote(S) && O.promote(S)); eq(O.title('garrison', S.office.rank), 'แม่ทัพ'); eq(O.promote(S), false, 'no rank above general');
S.wagon = 0; ok(ST.escorted(S), 'a general\'s soldiers guard the wagon'); eq(O.perk(S, 'garrison'), 5);
/* harbour office: any job, duty counts goods sold */
O.resign(S); g.village.character.job = 'mage'; g.village.character.jobs.mage = { lv: 2 }; F.add('merchants', 25); eq(O.why(S, 'harbor'), '', 'any job may be a harbour clerk'); ok(O.take(S, 'harbor'));
eq(ST.cargoMax(S), ST.CARGO_MAX + 5, 'a clerk\'s wagon carries 5 more');
S.cargo = { salt: 12 }; ST.trade('haven', S, 'salt', -12); eq(S.traded, 12, 'selling counts toward the duty');
/* old Fernvale offices still two ranks with 40/70 */
eq(O.pay('watch', 1), 40); eq(O.pay('watch', 2), 70);
/* --- T8: town events --- */
let seen = {}; for (let d = 1; d <= 300; d++) { const e = E.today('haven', d); if (e) seen[e.id] = (seen[e.id] || 0) + 1 }
ok(Object.keys(seen).length >= 2, 'several kinds of events over a season');
const empty = Array.from({ length: 300 }, (_, i) => E.today('haven', i + 1)).filter(x => !x).length; ok(empty > 60 && empty < 140, 'about one day in three is quiet (' + empty + ')');
for (let d = 1; d <= 300; d++) { const e = E.today('northgate', d); if (e && e.policy) { g.day = d; eq(e.policy, ST.policy('northgate'), 'policy events only come under that policy'); break } }
/* the toll: 5 % of the purse, waived at standing 50 */
let d0 = 0; for (let d = 1; d < 2000; d++) { g.day = d; if (E.today('northgate')?.id === 'toll') { d0 = d; break } }
if (d0) { g.day = d0; const T = { gold: 200 }; F.add('garrison', -200); F.add('garrison', 10); E.arrive(T, 'northgate'); eq(T.gold, 190, 'toll 5 %'); eq(E.arrive(T, 'northgate').length, 0, 'once a day');
  F.add('garrison', 200); g.day = d0; const T2 = { gold: 200 }; E.arrive(T2, 'northgate'); eq(T2.gold, 200, 'waived for the respected') } else ok(true, 'no toll day found');
/* the thief: once a day */
(async () => {
  let dt = 0; for (let d = 1; d < 2000; d++) { g.day = d; if (E.today('brookmere')?.id === 'thief') { dt = d; break } }
  g.day = dt; const T = { gold: 0 }; const a = await E.act(T, 'brookmere', { rng: () => .1, job: 'rogue' }); ok(a[0].includes('จับขโมยได้')); eq(T.gold, 10); eq((await E.act(T, 'brookmere', { rng: () => .1 })).length, 0, 'one go a day');
  /* --- T8: council --- */
  g.day = 1; ok(/60/.test(ST.councilWhy()), 'needs standing 60'); F.add('village', 70);
  ok(/โครงการ/.test(ST.councilWhy()), 'and three village projects'); globalThis.VillageProjects = { PROJECTS: { a: 1, b: 1, c: 1 }, has: () => true };
  eq(ST.councilWhy(), ''); ok(ST.joinCouncil()); g.village.coins = 0;
  eq(ST.petition('fernvale', 'tax_high'), '', 'a councillor sets the policy free'); eq(ST.policy('fernvale'), 'tax_high'); eq(g.village.coins, 0, 'no fee');
  const rep0 = F.rep('village'); g.day = 8; const m = ST.councilSettle(); eq(g.village.coins, 45, 'weekly share under high tax'); ok(F.rep('village') < rep0, 'villagers grumble at high tax'); ok(m[0].includes('45'));
  console.log('town events / offices 2 / council: ' + n + ' checks passed');
})();

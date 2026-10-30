/* v97.55 · T7 offices: requirements (job, job level, standing), weekly salary or warning, dismissal after two misses, promotion */
const assert = require('node:assert/strict');
const g = { day: 1, village: { character: { job: 'warrior', jobs: { warrior: { lv: 1 } } } } };
globalThis.WorldState = { game: () => g, commit: () => { } };
const P = require('../js/progression.js'); globalThis.Progression = P; const F = require('../js/factions.js'); const O = require('../js/offices.js');
const S = { gold: 0, battles: 0 };
assert.match(O.why(S, 'magus'), /อาชีพ/, 'a warrior cannot be the guild magus');
assert.match(O.why(S, 'watch'), /เลเวลอาชีพ 2/); g.village.character.jobs.warrior.lv = 2;
assert.match(O.why(S, 'watch'), /ชื่อเสียง/); F.add('village', 25);
assert.equal(O.why(S, 'watch'), ''); assert.ok(O.take(S, 'watch')); assert.equal(O.take(S, 'hunter'), false, 'one office at a time');
S.battles = 2; g.day = 8; let m = O.settle(S); assert.equal(S.gold, 40, 'week done: salary'); assert.ok(m[0].includes('+40'));
g.day = 15; O.settle(S); assert.equal(S.office.missed, 1, 'no battles: a warning');
g.day = 22; m = O.settle(S); assert.equal(S.office, null, 'two weeks missed: dismissed'); assert.ok(m.some(x => x.includes('ปลด')));
O.take(S, 'watch'); assert.equal(O.promote(S), false, 'rank 2 needs job Lv.4 and standing 50');
g.village.character.jobs.warrior.lv = 4; F.add('village', 40); assert.ok(O.promote(S)); assert.equal(S.office.rank, 2);
S.battles += 2; g.day = 29; O.settle(S); assert.equal(S.gold, 40 + 70, 'rank 2 pays 70');
console.log('offices: 15 checks passed');

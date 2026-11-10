// v98.368 · footprint 2×2 in the flat battle engine (docs/TODO.md §17)
const assert = require('node:assert/strict'), FB = require('../js/flat-battle.js');
const mk = (fp, hero = { u: 0, v: 0 }, mon = { u: 6, v: 0 }, blocked = []) => FB.create({ bounds: { u0: 0, v0: 0, u1: 9, v1: 9 }, kindAt: (u, v) => blocked.some(b => b[0] === u && b[1] === v) ? 'blocked' : 'normal', fp, hero: { ...hero, move: 4 }, monster: mon });
// fp 1 unchanged
{ const st = mk(0); assert.equal(st.fp, undefined); const [h, m] = st.units; assert.equal(FB.dist(h, m), 6); assert.ok(FB.free(st, 9, 9)) }
// fp 2: arena edge, overlap, blocked cells
{ const st = mk(2), [h, m] = st.units;
  assert.equal(st.fp, 2); assert.equal(h.fp, 2);
  assert.ok(!FB.free(st, 9, 0, h), 'a 2×2 block cannot hang over the arena edge'); assert.ok(FB.free(st, 8, 8, h));
  assert.ok(!FB.free(st, 5, 1, h), 'overlapping the monster block is not allowed'); assert.ok(!FB.free(st, 7, 0, h)); assert.ok(FB.free(st, 4, 0, h), 'touching is allowed');
  assert.equal(FB.dist({ u: 0, v: 0, fp: 2 }, { u: 2, v: 0, fp: 2 }), 1, 'touching blocks = range 1');
  assert.equal(FB.dist({ u: 0, v: 0, fp: 2 }, { u: 2, v: 2, fp: 2 }), 2, 'diagonal touch = 2 like before');
  assert.equal(FB.dist({ u: 0, v: 0, fp: 2 }, { u: 3, v: 0, fp: 2 }), 2);
  const r = FB.reach(st, h, 4); for (const e of r.values()) assert.ok(FB.free(st, e.u, e.v, h)); assert.ok(r.has('4,0') && !r.has('5,0'), 'cannot walk into the monster block'); }
{ const st = mk(2, { u: 0, v: 0 }, { u: 8, v: 8 }, [[3, 1]]); assert.ok(!FB.free(st, 2, 0, st.units[0]) && !FB.free(st, 3, 0, st.units[0]) && FB.free(st, 4, 0, st.units[0]), 'one blocked cell blocks the whole block'); assert.ok(!FB.reach(st, st.units[0], 6).has('3,0')) }
// a whole fight at fp 2: nobody ever overlaps, every start is legal, the fight ends
{ let seed = 7; const rng = () => (seed = seed * 16807 % 2147483647) / 2147483647;
  for (let k = 0; k < 20; k++) { const st = FB.create({ fp: 2, bounds: { u0: 0, v0: 0, u1: 11, v1: 11 }, ct: true, rng, hero: { u: 0, v: 0, hp: 60, maxHp: 60, atk: 14 }, allies: [{ u: 2, v: 0, hp: 40, maxHp: 40, atk: 10 }], monsters: [0, 1, 2].map(i => ({ u: 9, v: 2 + i * 3, hp: 30, maxHp: 30, atk: 8, iq: i })) });
    const sane = () => { const L = st.units.filter(FB.alive); for (let i = 0; i < L.length; i++) { assert.ok(FB.inside(st, L[i].u, L[i].v), 'inside'); for (let j = i + 1; j < L.length; j++) assert.ok(Math.max(Math.abs(L[i].u - L[j].u), Math.abs(L[i].v - L[j].v)) >= 2, 'footprints overlap #' + k + ' ' + L[i].id + '/' + L[j].id) } };
    sane();
    for (let t = 0; t < 60 && !st.outcome; t++) { const h = FB.hero(st), m = FB.monsters(st).find(FB.alive); st.mp = 4; const r = FB.reach(st, h); let to = null, bd = 1e9; for (const e of r.values()) { const d = FB.dist({ u: e.u, v: e.v, fp: 2 }, m); if (d < bd && d >= 1) { bd = d; to = e } } if (to) FB.move(st, to); const tg = FB.targets(st, h)[0]; if (tg) { tg.hp -= 14; FB.checkOutcome(st) } sane(); if (st.outcome) break; FB.endTurnCT(st); sane() }
    assert.ok(st.outcome, 'fp2 fight ends #' + k) } }
console.log('flat battle footprint 2×2: all cases passed');

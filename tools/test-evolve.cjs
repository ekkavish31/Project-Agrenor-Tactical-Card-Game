// v98.58 · evolution (flat-battle.js evolveCheck): hidden odds, stats of the next form, once per monster, never a boss, max 2 per battle.
const assert = require('node:assert/strict');
const B = require('../js/flat-battle.js');
let n = 0; const test = (name, fn) => { fn(); n++ };
const evo = { kind: 'shadowWolf', name: 'หมาป่าเงา', hp: 44, atk: 11, move: 5, iq: 2, shove: false, el: 'dark', fly: false };
const mk = (ms) => B.create({ bounds: { u0: 0, v0: 0, u1: 8, v1: 8 }, hero: { u: 0, v: 0 }, monsters: ms.map((m, i) => ({ u: 6 + (i % 2), v: 6 + (i >> 1), kind: 'wolf', name: 'หมาป่า', hp: 26, maxHp: 26, atk: 7, move: 4, evo: { ...evo }, ...m })) });
test('no evolution without a next form, for bosses, or on round 1 untouched', () => {
  let st = mk([{ evo: null }]); assert.equal(B.evoChance(st, B.monsters(st)[0]), 0); assert.equal(B.evolveCheck(st, B.monsters(st)[0], [], () => 0), false);
  st = mk([{ boss: true }]); assert.equal(B.evolveCheck(st, B.monsters(st)[0], [], () => 0), false);
  st = mk([{}]); assert.equal(B.evoChance(st, B.monsters(st)[0]), 0);   // round 1, healthy, nobody fallen: nothing yet
});
test('odds grow with rounds, wounds and fallen packmates (hidden triggers), capped at 25%', () => {
  const st = mk([{}, {}]); const u = B.monsters(st)[0]; st.turns = 2; const base = B.evoChance(st, u);
  assert.ok(base > 0 && base < .03);
  u.hp = 10; const hurt = B.evoChance(st, u); assert.ok(hurt > base + .04);
  B.monsters(st)[1].hp = 0; const pack = B.evoChance(st, u); assert.ok(pack > hurt);
  B.hero(st).hp = 5; assert.ok(B.evoChance(st, u) <= .25);
});
test('evolving swaps the form: new stats, HP keeps ≥70% of the new max, flagged, one step', () => {
  const st = mk([{ hp: 8 }]); st.turns = 3; const u = B.monsters(st)[0], steps = [];
  assert.equal(B.evolveCheck(st, u, steps, () => 0), true);
  assert.equal(u.kind, 'shadowWolf'); assert.equal(u.maxHp, 44); assert.equal(u.hp, Math.round(44 * .7)); assert.equal(u.atk, 11); assert.equal(u.move, 5); assert.equal(u.el, 'dark');
  assert.equal(u.evolved, true); assert.equal(u.evo, null); assert.equal(steps.length, 1); assert.equal(steps[0].type, 'evolve'); assert.equal(steps[0].from.kind, 'wolf'); assert.equal(steps[0].to.kind, 'shadowWolf');
  assert.equal(B.evolveCheck(st, u, [], () => 0), false);   // once only
});
test('at most 2 evolutions per battle', () => {
  const st = mk([{}, {}, {}]); st.turns = 5; let got = 0; for (const m of B.monsters(st)) if (B.evolveCheck(st, m, [], () => 0)) got++;
  assert.equal(got, 2); assert.equal(st.evoCount, 2);
});
test('monsterTurn: an evolving monster spends its turn changing (no attack step from it)', () => {
  const st = mk([{ hp: 8 }]); st.turns = 3; st.turn = 'monster'; const orig = Math.random; Math.random = () => 0;
  try { const steps = B.monsterTurn(st); assert.equal(steps[0].type, 'evolve'); assert.ok(!steps.some(s => s.type === 'attack' && s.unit === steps[0].unit)) } finally { Math.random = orig }
});
console.log(`evolve: ${n} tests passed`);

// v98.66 · แก่นโกลาหล (js/chaos.js): guaranteed drops by tier+lineage, half-chance ordinary drops, card unlocks, recipes that need several items, Grat cards exist.
const assert = require('node:assert/strict'); const path = require('path');
global.window = global;
const C = require(path.join(__dirname, '..', 'js', 'chaos.js'));
const P = require(path.join(__dirname, '..', 'js', 'progression.js'));
const FB = require(path.join(__dirname, '..', 'js', 'flat-battle.js'));
let n = 0; const test = (name, fn) => { fn(); n++ };
const g = () => ({ day: 1, village: { character: { level: 1, xp: 0, points: 0, stats: {} }, materials: { iron: 9, coal: 9, wood: 9 }, bag: {} } });

test('9 chaos goods: tiers × lineages, all element chaos, priced by tier', () => {
  const ids = Object.keys(C.GOODS); assert.equal(ids.length, 9);
  assert.ok(ids.every(i => C.GOODS[i].element === 'chaos' && C.GOODS[i].use === 'คราฟต์'));
  assert.ok(C.GOODS.chaosShardDark.price < C.GOODS.chaosCoreDark.price && C.GOODS.chaosCoreDark.price < C.GOODS.chaosCrystalDark.price);
});
test('every evolved kill drops a guaranteed item of its tier and lineage', () => {
  const r = C.dropFor([{ kind: 'shadowWolf', tier: 1, line: 'dark' }, { kind: 'yeti', tier: 2, line: 'ice' }, { kind: 'golem', tier: 2, line: 'earth' }], () => .99);
  assert.deepEqual(r.items, { chaosShardDark: 1, chaosCoreIce: 1, chaosCoreEarth: 1 }); assert.deepEqual(r.half, ['shadowWolf', 'yeti', 'golem']);
  const lucky = C.dropFor([{ kind: 'shadowWolf', tier: 1, line: 'dark' }], () => 0); assert.equal(lucky.items.chaosShardDark, 2);   // 35 % bonus shard
  assert.equal(C.dropFor([{ kind: 'x', tier: 3, line: 'ice' }], () => 0).items.chaosCrystalIce, 1);   // crystals never double
  assert.deepEqual(C.dropFor([]).items, {});
});
test('ordinary drops of an evolved kill come at half the chance', () => {
  let hit = 0, N = 20000; for (let i = 0; i < N; i++) hit += C.halfRolls(['wolfFang', 'boneCharm']).length;
  const rate = hit / (N * 2); assert.ok(rate > .47 && rate < .53, 'rate ' + rate);
});
test('note: totals by line/tier; cards unlock at 3 / 8 / 15 once, queued as level-up cards', () => {
  const s = g(); let u = C.note(s, { chaosShardDark: 2 }); assert.deepEqual(u, []);
  u = C.note(s, { chaosShardDark: 1 }); assert.deepEqual(u, ['chaosBolt']);
  u = C.note(s, { chaosCoreIce: 5 }); assert.deepEqual(u, ['chaosRend']); u = C.note(s, { chaosCoreIce: 1 }); assert.deepEqual(u, []);
  u = C.note(s, { chaosCoreEarth: 7 }); assert.deepEqual(u, ['chaosWard']);
  assert.equal(s.village.chaos.total, 16); assert.equal(s.village.chaos.line.ice, 6); assert.equal(s.village.chaos.tier[2], 13);
  const q = s.village.levelUnlocks; assert.equal(q.length, 3); assert.ok(q.every(x => x.level === 'chaos' && x.cards[0].group === 'combat'));
  assert.deepEqual(C.note(s, { wolfFang: 3, nonsense: 9 }), []);   // not chaos items: ignored
});
test('chaos weapons need several chaos items (not 1) and the forge sees them missing', () => {
  for (const id of ['chaosFang', 'chaosMaul', 'rimeChaosBlade']) {
    const r = P.ZONE_RECIPES[id]; assert.ok(r, id); const chaos = Object.entries(r.goods).filter(([k]) => /^chaos/.test(k)); assert.ok(chaos.reduce((a, [, c]) => a + c, 0) >= 4, id + ' needs ≥4 chaos items'); assert.equal(r.star, 3);
    assert.ok(Object.keys(r.goods).every(k => C.GOODS[k] || ['wolfFang', 'crystalShard', 'frostFur'].includes(k)), id + ' goods are real');
  }
  const s = g(), r = P.ZONE_RECIPES.chaosFang; assert.notEqual(P.recipeMissing(s.village, r), '');
  s.village.bag = { chaosShardDark: 4, wolfFang: 2 }; assert.equal(P.recipeMissing(s.village, r), '');
});
test('the three Grat cards exist as rules, elements and deck entries', () => {
  for (const id of C.UNLOCKS.map(u => u.id)) { assert.ok(FB.cardRule(id), id + ' rule'); assert.equal(FB.CARD_EL[id], 'chaos'); }
  const D = require(path.join(__dirname, '..', 'js', 'tactics-decks.js')); const T = D.COMBAT || (D.TacticsDecks && D.TacticsDecks.COMBAT);
  for (const id of C.UNLOCKS.map(u => u.id)) assert.ok(T[id]?.name, id + ' name');
});
console.log(`chaos: ${n} tests passed`);

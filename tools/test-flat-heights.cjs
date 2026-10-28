// v94 · heights in the flat card battle (world-map fields): walking, melee reach, height bonus and the height cards.
const assert = require('node:assert/strict');
const D = require('../js/tactics-decks.js'), B = require('../js/flat-battle.js');
let n = 0; const test = (name, fn) => { fn(); n++; console.log('PASS', name) };
// 9×9 open field; levels from a map 'u,v' -> level (default 0)
function field(levels = {}, o = {}) {
  const st = B.create({ bounds: { u0: 0, v0: 0, u1: 8, v1: 8 }, kindAt: () => 'normal', levelAt: (u, v) => levels[u + ',' + v] || 0, cards: true, rng: () => .99,
    hero: { u: 4, v: 4, stamina: 100, ...o.hero }, monsters: [{ u: o.foe?.[0] ?? 5, v: o.foe?.[1] ?? 4, hp: 200, maxHp: 200, atk: 9 }] });
  return st;
}
const give = (st, id) => { st.deck.combat.hand[0] = { id, uid: id + '-t', used: false }; st.spent = 0 };
const play = (st, id) => { give(st, id); const m = B.monsters(st)[0], b = m.hp, r = B.playCombat(st, 0); return { r, dmg: b - m.hp } };

test('every combat card of the deck has a flat rule (incl. rockfall / perch / climb)', () => { for (const id of Object.keys(D.COMBAT)) assert.ok(B.CARD[id], id) });
test('walking: one level up costs 1 extra point; two levels up is a wall', () => {
  const st = field({ '5,4': 1, '4,5': 2 }), r = B.reach(st, B.hero(st), 4);
  assert.equal(r.get('5,4')?.cost, undefined, 'the monster stands there'); // occupied
  const st2 = field({ '4,3': 1, '4,5': 2 }, { foe: [8, 8] }), r2 = B.reach(st2, B.hero(st2), 4);
  assert.equal(r2.get('4,3').cost, 2); assert.equal(r2.has('4,5'), false);
});
test('walking: jumping down two levels is fine, three is not', () => {
  const st = field({ '4,4': 3, '4,3': 1, '4,5': 0 }, { foe: [8, 8] }), r = B.reach(st, B.hero(st), 4);
  assert.ok(r.has('4,3')); assert.equal(r.has('4,5'), false);
});
test('melee cannot reach 2 levels up or down; ranged can', () => {
  const st = field({ '5,4': 2 });
  give(st, 'attack'); assert.match(B.combatBlock(st, 0), /ต่างระดับ/);
  give(st, 'thunder'); assert.equal(B.combatBlock(st, 0), '');
});
test('height bonus: hitting down is stronger, hitting up weaker', () => {
  const flat = play(field(), 'attack').dmg, down = play(field({ '4,4': 1 }), 'attack').dmg, up = play(field({ '5,4': 1 }), 'attack').dmg;
  assert.ok(down > flat && flat > up, `${up} < ${flat} < ${down}`);
});
test('perch doubles the height bonus', () => {
  const a = play(field({ '4,4': 1 }), 'attack').dmg; const st = field({ '4,4': 1 }); B.hero(st).perch = 2; const b = play(st, 'attack').dmg; assert.ok(b > a, `${a} < ${b}`);
  const p = field(); give(p, 'perch'); assert.ok(B.playCombat(p, 0).ok); assert.equal(B.hero(p).perch, 2); assert.ok(B.hero(p).guard >= 6);
});
test('rockfall: needs higher ground, more damage per level, slows', () => {
  const lo = field({}, { foe: [6, 4] }); give(lo, 'rockfall'); assert.match(B.combatBlock(lo, 0), /สูงกว่าเป้า/);
  const a = play(field({ '4,4': 1 }, { foe: [7, 4] }), 'rockfall'), b = play(field({ '4,4': 3 }, { foe: [7, 4] }), 'rockfall');
  assert.ok(a.r.ok && b.r.ok); assert.ok(b.dmg > a.dmg, `${a.dmg} < ${b.dmg}`); assert.equal(B.monsters(field()).length, 1);
});
test('dive strikes down several levels and gains from height', () => {
  const flat = play(field({}, { foe: [6, 4] }), 'dive'), high = play(field({ '4,4': 3 }, { foe: [6, 4] }), 'dive');
  assert.ok(flat.r.ok && high.r.ok); assert.ok(high.dmg > flat.dmg);
  const up = field({ '6,4': 2 }, { foe: [6, 4] }); give(up, 'dive'); assert.notEqual(B.combatBlock(up, 0), '');
});
test('climb: a 2-level step becomes walkable and uphill is free', () => {
  const st = field({ '4,3': 2 }, { foe: [8, 8] }); assert.equal(B.reach(st, B.hero(st), 4).has('4,3'), false);
  give(st, 'climb'); assert.ok(B.playCombat(st, 0).ok); const r = B.reach(st, B.hero(st), 4); assert.equal(r.get('4,3').cost, 1);
});
test('push off a ledge of 2+ levels costs fall damage', () => {
  const flat = play(field({}, { foe: [5, 4] }), 'push'), edge = play(field({ '4,4': 2, '5,4': 2, '6,4': 0 }, { foe: [5, 4] }), 'push');
  assert.ok(edge.r.fall && edge.dmg > flat.dmg, `${flat.dmg} < ${edge.dmg}`);
});
test('quake: targets below take ×1.5', () => { const a = play(field(), 'quake').dmg, b = play(field({ '4,4': 1 }), 'quake').dmg; assert.ok(b > a, `${a} < ${b}`) });
test('no levelAt = flat field, nothing changes', () => { const st = B.create({ bounds: { u0: 0, v0: 0, u1: 4, v1: 4 }, hero: { u: 0, v: 0 }, monster: { u: 4, v: 4 } }); assert.equal(B.lv(st, 2, 2), 0); assert.ok(B.reach(st, B.hero(st)).size > 5) });
console.log(n + ' flat height tests passed');

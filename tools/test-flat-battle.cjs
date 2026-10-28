const assert = require('node:assert/strict');
const B = require('../js/flat-battle.js');
let n = 0; const test = (name, fn) => { fn(); n++; };
// 9×9 arena: wall at u=4 (v 0..6), slow band at u=2, cover tile at (6,4)
const kindAt = (u, v) => (u === 4 && v >= 0 && v <= 6) ? 'blocked' : u === 2 ? 'slow' : (u === 6 && v === 4) ? 'cover' : 'normal';
const mk = (o = {}) => B.create({ bounds: { u0: 0, v0: 0, u1: 8, v1: 8 }, kindAt, hero: { u: 0, v: 0, ...o.hero }, monster: { u: 8, v: 8, ...o.monster } });

test('reach: normal 1, slow 2, blocked never', () => {
  const st = mk(), r = B.reach(st, B.hero(st));
  assert.equal(r.get('1,0').cost, 1);
  assert.equal(r.get('2,0').cost, 3);                    // 1 + 2
  assert.equal(r.get('3,0').cost, 4);                   // exactly the whole budget
  assert.equal(r.has('4,0'), false);                    // wall
});
test('reach respects the movement budget and walls', () => {
  const st = mk({ hero: { u: 3, v: 3 } }), r = B.reach(st, B.hero(st));
  assert.equal(r.has('4,3'), false);                    // wall
  assert.equal(r.has('3,0'), true);
  for (const e of r.values()) assert.ok(e.cost <= 4);
});
test('cannot walk through the other unit; cannot enter blocked or outside', () => {
  const st = mk({ hero: { u: 5, v: 4 }, monster: { u: 6, v: 4 } });
  assert.equal(B.canMove(st, { u: 6, v: 4 }).ok, false);
  assert.equal(B.canMove(st, { u: 4, v: 4 }).ok, false);
  assert.equal(B.canMove(st, { u: 99, v: 4 }).ok, false);
});
test('move spends points, several moves share the budget, then none left', () => {
  const st = mk({ hero: { u: 5, v: 7 } });
  assert.equal(B.move(st, { u: 5, v: 8 }).ok, true); assert.equal(st.mp, 3);
  assert.equal(B.move(st, { u: 6, v: 8 }).ok, true); assert.equal(st.mp, 2);
  assert.equal(B.canMove(st, { u: 5, v: 0 }).ok, false);
});
test('attack: range 1, damage = atk − def (min 1), once per turn, ends movement', () => {
  const st = mk({ hero: { u: 7, v: 8 } });
  const a = B.attack(st); assert.equal(a.ok, true); assert.equal(a.damage, 11);   // 12 − 1
  assert.equal(B.monster(st).hp, 29); assert.equal(st.mp, 0);
  assert.equal(B.attack(st).ok, false); assert.equal(B.canMove(st, { u: 7, v: 7 }).ok, false);
});
test('out of range cannot attack', () => { assert.equal(B.attack(mk()).ok, false) });
test('cover reduces damage by 30 %', () => {
  const st = mk({ hero: { u: 5, v: 4 }, monster: { u: 6, v: 4 } });
  assert.equal(B.attack(st).damage, Math.round(11 * .7));
  assert.ok(B.attack.length >= 0);
});
test('win when the monster dies, lose when the hero dies', () => {
  const w = mk({ hero: { u: 7, v: 8, atk: 99 } }); B.attack(w); assert.equal(w.outcome, 'win'); assert.equal(B.endTurn(w).ok, false);
  const l = mk({ hero: { u: 7, v: 8, hp: 1 }, monster: { u: 8, v: 8, atk: 99 } }); B.endTurn(l); B.monsterTurn(l); assert.equal(l.outcome, 'lose');
});
test('turn order: end turn passes to the monster, mp refills, turns counter grows after both', () => {
  const st = mk(); B.move(st, { u: 1, v: 0 }); B.endTurn(st);
  assert.equal(st.turn, 'monster'); assert.equal(st.mp, 4);
  B.endTurn(st); assert.equal(st.turn, 'hero'); assert.equal(st.turns, 2); assert.equal(st.mp, 4);
});
test('monster AI closes in, never enters a wall, attacks when it can reach', () => {
  const st = mk({ hero: { u: 0, v: 8 }, monster: { u: 8, v: 8 } }); B.endTurn(st);
  const d0 = B.dist(B.hero(st), B.monster(st)), steps = B.monsterTurn(st);
  assert.ok(steps.some(s => s.type === 'move')); assert.ok(B.dist(B.hero(st), B.monster(st)) < d0);
  assert.equal(st.turn, 'hero'); assert.ok(!(B.monster(st).u === 4 && B.monster(st).v <= 6));
  const near = mk({ hero: { u: 7, v: 8 } }); B.endTurn(near); const s2 = B.monsterTurn(near);
  assert.ok(s2.some(s => s.type === 'attack')); assert.equal(B.hero(near).hp, 60 - 6);        // 9 − 3
});
test('a full fight always ends (hero walks in and trades blows)', () => {
  const st = mk({ hero: { u: 7, v: 7 } });
  for (let i = 0; i < 40 && !st.outcome; i++) { if (st.turn === 'hero') { B.attack(st); B.endTurn(st) } else B.monsterTurn(st) }
  assert.ok(st.outcome === 'win' || st.outcome === 'lose');
});
test('AI walks around a U-shaped barrier instead of getting stuck', () => {
  // hero sits inside a pocket open to the south: walls on u=2..6 at v=2 and on u=2, u=6 for v=2..5 (pocket 3..5 × 3..5, open at v=6)
  const k = (u, v) => ((v === 2 && u >= 2 && u <= 6) || ((u === 2 || u === 6) && v >= 2 && v <= 5)) ? 'blocked' : 'normal';
  const st = B.create({ bounds: { u0: 0, v0: 0, u1: 8, v1: 8 }, kindAt: k, hero: { u: 4, v: 3 }, monster: { u: 4, v: 0 } });
  B.endTurn(st);
  for (let i = 0; i < 12 && st.turn === 'monster'; i++) { B.monsterTurn(st); if (st.turn === 'hero') B.endTurn(st) }
  assert.ok(B.dist(B.hero(st), B.monster(st)) <= 1 || B.hero(st).hp < 60, 'monster reached the hero around the wall');
});
console.log('flat battle: ' + n + ' tests passed');

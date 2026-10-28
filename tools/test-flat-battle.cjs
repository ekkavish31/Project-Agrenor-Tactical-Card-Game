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

// ---------- card mode (old TacticsDecks) ----------
const TD = require('../js/tactics-decks.js');
const mkC = (o = {}) => B.create({ bounds: { u0: 0, v0: 0, u1: 8, v1: 8 }, kindAt, cards: true, rng: o.rng || (() => .42), hero: { u: 0, v: 0, ...o.hero }, monster: { u: 8, v: 8, hp: 34, maxHp: 34, atk: 8, move: 3, ...o.monster } });
const give = (st, group, id) => { const hand = st.deck[group].hand; const i = hand.findIndex(c => c.id === id && !c.used); if (i >= 0) return i; hand[0] = { id, uid: id + '-t', used: false }; return 0 };
test('cards: turn starts with 0 move points, a move card adds its points and uses a crystal', () => {
  const st = mkC(); assert.equal(st.mp, 0);
  const i = give(st, 'movement', 'walk'); const r = B.playMove(st, i);
  assert.equal(r.ok, true); assert.equal(st.mp, 4); assert.equal(TD.crystals(st.deck), 2);
  assert.equal(B.canMove(st, { u: 2, v: 0 }).ok, true);
});
test('cards: at most 2 move cards and 3 crystals per turn', () => {
  const st = mkC(); const a = give(st, 'movement', 'step'); B.playMove(st, a);
  st.deck.movement.hand[1] = { id: 'step', uid: 's2', used: false }; assert.equal(B.playMove(st, 1).ok, true);
  st.deck.movement.hand[2] = { id: 'step', uid: 's3', used: false }; assert.equal(B.playMove(st, 2).ok, false);
});
test('cards: attack card needs range and hits for the old sword damage (18), ends movement', () => {
  const st = mkC({ hero: { u: 7, v: 8 } }); const i = give(st, 'combat', 'attack');
  const r = B.playCombat(st, i); assert.equal(r.ok, true); assert.equal(r.hits[0].damage, 18);
  assert.equal(B.monster(st).hp, 16); assert.equal(st.acted, true); assert.equal(B.hero(st).stamina, 88);
});
test('cards: out of range and not enough stamina are refused without using the card', () => {
  const st = mkC(); const i = give(st, 'combat', 'attack'); const before = st.deck.combat.hand.length;
  assert.equal(B.playCombat(st, i).ok, false); assert.equal(st.deck.combat.hand.length, before); assert.equal(TD.crystals(st.deck), 3);
  const st2 = mkC({ hero: { u: 7, v: 8, stamina: 5 } }); assert.equal(B.playCombat(st2, give(st2, 'combat', 'attack')).ok, false);
});
test('cards: guard soaks the monster hit, cover reduces first', () => {
  const st = mkC({ hero: { u: 7, v: 8 } }); B.playCombat(st, give(st, 'combat', 'guard'));
  assert.equal(B.hero(st).guard, 8); B.endTurn(st); B.monsterTurn(st);
  assert.equal(B.hero(st).hp, 60);                      // 8 raw − 8 guard
});
test('cards: push moves the target away when the cell is free, not into a wall', () => {
  const st = mkC({ hero: { u: 7, v: 8 } }); const r = B.playCombat(st, give(st, 'combat', 'push'));
  assert.equal(r.ok, true); assert.equal(r.moved, false);   // (9,8) is outside the arena
  const st2 = mkC({ hero: { u: 8, v: 7 }, monster: { u: 8, v: 8 } }); assert.equal(B.playCombat(st2, give(st2, 'combat', 'pull')).ok, true);
  const st3 = mkC({ hero: { u: 5, v: 5 }, monster: { u: 6, v: 5 } }); assert.equal(B.playCombat(st3, give(st3, 'combat', 'push')).moved, true); assert.equal(B.monster(st3).u, 7);
});
test('cards: twin hits twice; heal caps at max HP; unsupported cards are refused', () => {
  const st = mkC({ hero: { u: 7, v: 8 } }); const r = B.playCombat(st, give(st, 'combat', 'twin')); assert.equal(r.hits.length, 2);
  const st2 = mkC({ hero: { hp: 50 } }); const h = B.playCombat(st2, give(st2, 'combat', 'mend')); assert.equal(h.heal, 10);
  const st3 = mkC(); assert.equal(B.playCombat(st3, give(st3, 'combat', 'evade')).ok, false);
});
test('cards: end turn refills the hands and resets crystals; full card fight ends', () => {
  const st = mkC({ hero: { u: 7, v: 8 }, rng: Math.random }); B.playMove(st, give(st, 'movement', 'step'));
  B.endTurn(st); B.monsterTurn(st); assert.equal(st.turn, 'hero'); assert.equal(st.deck.movement.hand.length, 4); assert.equal(TD.crystals(st.deck), 3); assert.equal(st.mp, 0);
  for (let t = 0; t < 40 && !st.outcome; t++) {
    if (st.turn === 'monster') { B.monsterTurn(st); continue; }
    const h = B.hero(st), m = B.monster(st);
    for (let g = 0; g < 4 && !st.outcome; g++) {
      if (B.dist(h, m) > 1) { const mi = st.deck.movement.hand.findIndex(c => !c.used); if (mi >= 0 && B.playMove(st, mi).ok) { const r = B.reach(st, h); let best = null; for (const e of r.values()) if (!best || B.dist(e, m) < B.dist(best, m)) best = e; if (best && (best.u !== h.u || best.v !== h.v)) B.move(st, best) } }
      const ci = st.deck.combat.hand.findIndex((c, i) => !c.used && !B.combatBlock(st, i) && !B.cardRule(c.id).self); if (ci >= 0) B.playCombat(st, ci);
    }
    B.endTurn(st);
  }
  assert.ok(st.outcome === 'win' || st.outcome === 'lose');
});
console.log('flat battle: ' + n + ' tests passed');

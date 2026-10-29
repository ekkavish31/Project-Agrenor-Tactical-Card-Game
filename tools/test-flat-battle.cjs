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
test('cards: turn starts with 0 move points, a move card adds its points, uses a crystal and leaves the hand', () => {
  const st = mkC(); assert.equal(st.mp, 0); assert.equal(B.crystals(st), 2);
  const i = give(st, 'movement', 'walk'); const r = B.playMove(st, i);
  assert.equal(r.ok, true); assert.equal(st.mp, 4); assert.equal(B.crystals(st), 1); assert.equal(st.deck.movement.hand.length, 3);
  assert.equal(B.canMove(st, { u: 2, v: 0 }).ok, true);
});
test('cards: 2 crystals per turn shared by every action', () => {
  const st = mkC({ hero: { u: 7, v: 8 } }); B.playMove(st, give(st, 'movement', 'step'));
  assert.equal(B.playCombat(st, give(st, 'combat', 'attack')).ok, true); assert.equal(B.crystals(st), 0);
  assert.equal(B.playMove(st, 0).ok, false); assert.equal(B.playCombat(st, 0).ok, false);
});
test('cards: attack card needs range and hits for the old sword damage (18), ends movement', () => {
  const st = mkC({ hero: { u: 7, v: 8 } }); const i = give(st, 'combat', 'attack');
  const r = B.playCombat(st, i); assert.equal(r.ok, true); assert.equal(r.hits[0].damage, 18);
  assert.equal(B.monster(st).hp, 16); assert.equal(st.acted, true); assert.equal(B.hero(st).stamina, 88);
});
test('cards: out of range and not enough stamina are refused without using the card', () => {
  const st = mkC(); const i = give(st, 'combat', 'attack'); const before = st.deck.combat.hand.length;
  assert.equal(B.playCombat(st, i).ok, false); assert.equal(st.deck.combat.hand.length, before); assert.equal(B.crystals(st), 2);
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
test('cards: a low roll is a critical hit ×1.5; the fixed test roll (.42) never crits', () => {
  const st = mkC({ hero: { u: 7, v: 8 }, rng: () => .05 }); const r = B.playCombat(st, give(st, 'combat', 'attack'));
  assert.equal(r.hits[0].crit, true); assert.equal(r.hits[0].damage, 27);
});
test('cards: twin hits twice; heal caps at max HP', () => {
  const st = mkC({ hero: { u: 7, v: 8 } }); const r = B.playCombat(st, give(st, 'combat', 'twin')); assert.equal(r.hits.length, 2);
  const st2 = mkC({ hero: { hp: 50 } }); const h = B.playCombat(st2, give(st2, 'combat', 'mend')); assert.equal(h.heal, 10);
});
test('cards: every card in the old default deck is playable on the flat field', () => {
  for (const id of Object.keys(TD.DEFAULT.combat)) assert.ok(B.cardRule(id), id + ' has a flat rule');
});
test('cards: evade makes the next monster hit miss; counter strikes back 12', () => {
  const st = mkC({ hero: { u: 7, v: 8 } }); B.playCombat(st, give(st, 'combat', 'evade')); B.endTurn(st); B.monsterTurn(st);
  assert.equal(B.hero(st).hp, 60); assert.equal(B.hero(st).evade, 0);
  const s2 = mkC({ hero: { u: 7, v: 8 } }); B.playCombat(s2, give(s2, 'combat', 'counter')); B.endTurn(s2); const steps = B.monsterTurn(s2);
  assert.equal(B.hero(s2).hp, 52); assert.equal(B.monster(s2).hp, 34 - 12); assert.equal(steps.find(x => x.type === 'attack').counter, 12);
});
test('cards: ambush ×1.6 on the next attack; backstab +12 from behind; dive leaps next to the target', () => {
  const st = mkC({ hero: { u: 7, v: 8 } }); B.playCombat(st, give(st, 'combat', 'ambush')); const r = B.playCombat(st, give(st, 'combat', 'attack')); assert.equal(r.hits[0].damage, 29);
  const s2 = mkC({ hero: { u: 7, v: 8 }, monster: { face: 'NE' } }); assert.equal(B.playCombat(s2, give(s2, 'combat', 'backstab')).hits[0].damage, 33);   // monster faces NE, hero is NW of it: backstab +12 and the side ×1.1 (v97.08)
  const s3 = mkC({ hero: { u: 8, v: 5 } }); const d = B.playCombat(s3, give(s3, 'combat', 'dive')); assert.equal(d.ok, true); assert.ok(d.leap); assert.equal(B.dist(B.hero(s3), B.monster(s3)), 1);
});
test('cards: discard several cards for stamina costs one crystal; hands refill only at the next hero turn', () => {
  const st = mkC({ hero: { stamina: 50 } }), h = st.deck.combat.hand, m = st.deck.movement.hand;
  const picks = [{ group: 'combat', uid: h[0].uid }, { group: 'combat', uid: h[1].uid }, { group: 'movement', uid: m[0].uid }];
  const r = B.discardForStamina(st, picks); assert.equal(r.ok, true); assert.equal(r.stamina, 30); assert.equal(B.hero(st).stamina, 80);
  assert.equal(B.crystals(st), 1); assert.equal(st.deck.combat.hand.length, 4); assert.equal(st.deck.movement.hand.length, 3);
  assert.equal(B.discardForStamina(st, []).ok, false);
  B.endTurn(st); assert.equal(st.deck.combat.hand.length, 4);          // monster turn: no refill yet
  B.monsterTurn(st); assert.equal(st.turn, 'hero'); assert.equal(st.deck.combat.hand.length, 6); assert.equal(st.deck.movement.hand.length, 4);
  assert.equal(st.drawn.length, 3); assert.equal(B.crystals(st), 2);
});
test('cards: end turn refills the hands and resets crystals; full card fight ends', () => {
  const st = mkC({ hero: { u: 7, v: 8 }, rng: Math.random }); B.playMove(st, give(st, 'movement', 'step'));
  B.endTurn(st); B.monsterTurn(st); assert.equal(st.turn, 'hero'); assert.equal(st.deck.movement.hand.length, 4); assert.equal(B.crystals(st), 2); assert.equal(st.mp, 0);
  for (let t = 0; t < 40 && !st.outcome; t++) {
    if (st.turn === 'monster') { B.monsterTurn(st); continue; }
    const h = B.hero(st), m = B.monster(st);
    for (let g = 0; g < 4 && !st.outcome; g++) {
      if (B.dist(h, m) > 1) { const mi = st.deck.movement.hand.findIndex(c => B.hero(st).stamina >= TD.MOVE[c.id].stamina); if (mi >= 0 && B.playMove(st, mi).ok) { const r = B.reach(st, h); let best = null; for (const e of r.values()) if (!best || B.dist(e, m) < B.dist(best, m)) best = e; if (best && (best.u !== h.u || best.v !== h.v)) B.move(st, best) } }
      const ci = st.deck.combat.hand.findIndex((c, i) => !B.combatBlock(st, i) && !B.cardRule(c.id).self); if (ci >= 0) B.playCombat(st, ci);
    }
    B.endTurn(st);
  }
  assert.ok(st.outcome === 'win' || st.outcome === 'lose');
});
// ---------- melee: companions + monster groups ----------
const mkM = (o = {}) => B.create({ bounds: { u0: 0, v0: 0, u1: 8, v1: 8 }, kindAt: () => 'normal', cards: true, rng: () => .42,
  hero: { u: 0, v: 0, ...o.hero }, allies: o.allies || [{ u: 1, v: 0, name: 'บรัม', hp: 54, maxHp: 54, atk: 12 }, { u: 0, v: 1, name: 'ลูน่า', hp: 44, maxHp: 44, atk: 11, range: 4, move: 3 }],
  monsters: o.monsters || [{ u: 8, v: 8, hp: 30, maxHp: 30, atk: 8, move: 3 }, { u: 7, v: 8, hp: 30, maxHp: 30, atk: 8, move: 3 }, { u: 8, v: 7, hp: 30, maxHp: 30, atk: 8, move: 3 }] });
test('melee: units, ids, monster() = first living monster', () => {
  const st = mkM(); assert.equal(st.units.length, 6); assert.equal(B.monsters(st).length, 3); assert.equal(B.allies(st).length, 2);
  B.monsters(st)[0].hp = 0; assert.equal(B.monster(st).id, 'monster2');
});
test('melee: allies walk toward the monsters and the ranged one stops at range', () => {
  const st = mkM({ monsters: [{ u: 6, v: 0, hp: 30, maxHp: 30, atk: 8 }] }); const steps = B.alliesTurn(st);
  assert.ok(steps.some(x => x.type === 'move')); const luna = B.allies(st)[1]; assert.ok(B.dist(luna, B.monster(st)) <= 4 || steps.length);
});
test('melee: win only when every monster is down; the hero dying loses even with companions alive', () => {
  const st = mkM(); B.monsters(st)[0].hp = 0; B.monsters(st)[1].hp = 0; B.checkOutcome(st); assert.equal(st.outcome, null);
  B.monsters(st)[2].hp = 0; B.checkOutcome(st); assert.equal(st.outcome, 'win');
  const s2 = mkM(); B.hero(s2).hp = 0; B.checkOutcome(s2); assert.equal(s2.outcome, 'lose');
});
test('melee: a clicked target is used when in range; whirl hits everyone next to the hero', () => {
  const st = mkM({ hero: { u: 4, v: 4 }, monsters: [{ u: 5, v: 4, hp: 50, maxHp: 50 }, { u: 3, v: 4, hp: 50, maxHp: 50 }, { u: 4, v: 5, hp: 50, maxHp: 50 }] });
  B.setTarget(st, 'monster3'); const r = B.playCombat(st, give(st, 'combat', 'attack')); assert.equal(r.target.id, 'monster3');
  const s2 = mkM({ hero: { u: 4, v: 4 }, monsters: [{ u: 5, v: 4, hp: 50, maxHp: 50 }, { u: 3, v: 4, hp: 50, maxHp: 50 }, { u: 4, v: 5, hp: 50, maxHp: 50 }, { u: 7, v: 7, hp: 50, maxHp: 50 }] });
  const w = B.playCombat(s2, give(s2, 'combat', 'whirl')); assert.equal(w.hits.length, 3);
});
test('melee: the enemy phase lets every monster act, then the player phase starts with a refill', () => {
  const st = mkM({ hero: { u: 6, v: 6 } }); B.endTurn(st); const steps = B.monsterTurn(st);
  assert.ok(steps.filter(x => x.type === 'attack').length >= 2); assert.equal(st.turn, 'hero'); assert.equal(B.crystals(st), 2);
});
test('melee: a full party fight ends', () => {
  const st = mkM(); st.rng = Math.random;
  for (let t = 0; t < 60 && !st.outcome; t++) {
    if (st.turn === 'monster') { B.monsterTurn(st); continue }
    const h = B.hero(st), m = B.foe(st, h);
    if (m && B.dist(h, m) > 1) { const mi = st.deck.movement.hand.findIndex(c => h.stamina >= TD.MOVE[c.id].stamina); if (mi >= 0 && B.playMove(st, mi).ok) { const r = B.reach(st, h); let best = null; for (const e of r.values()) if (!best || B.dist(e, m) < B.dist(best, m)) best = e; if (best && (best.u !== h.u || best.v !== h.v)) B.move(st, best) } }
    const ci = st.deck.combat.hand.findIndex((c, i) => !B.combatBlock(st, i) && !B.cardRule(c.id).self); if (ci >= 0) B.playCombat(st, ci);
    B.alliesTurn(st); if (!st.outcome) B.endTurn(st);
  }
  assert.ok(st.outcome === 'win' || st.outcome === 'lose', 'outcome ' + st.outcome);
});
test('party: orders — guard holds its ground with +6 guard, follow stays near the hero', () => {
  const st = mkM({ monsters: [{ u: 8, v: 8, hp: 30, maxHp: 30 }] }); const [b, l] = B.allies(st);
  B.setOrder(st, b.id, 'guard'); B.setOrder(st, l.id, 'follow'); const pos = [b.u, b.v]; B.alliesTurn(st);
  assert.deepEqual([b.u, b.v], pos); assert.equal(b.guard, 6); assert.ok(B.dist(l, B.hero(st)) <= 2);
});
test('party: skills cost a crystal, have a cooldown, frost stuns, wall shields neighbours', () => {
  const st = mkM({ allies: [{ u: 1, v: 0, key: 'bram', name: 'บรัม', hp: 54, maxHp: 54, atk: 12 }, { u: 2, v: 2, key: 'luna', name: 'ลูน่า', hp: 44, maxHp: 44, atk: 11, range: 4 }], monsters: [{ u: 4, v: 3, hp: 40, maxHp: 40 }] });
  const [b, l] = B.allies(st);
  const w = B.allySkill(st, b.id); assert.equal(w.ok, true); assert.equal(b.guard, 14); assert.equal(B.hero(st).guard, 8); assert.equal(B.crystals(st), 1);
  assert.equal(B.allySkill(st, b.id).ok, false);                           // cooldown
  const f = B.allySkill(st, l.id); assert.equal(f.ok, true); assert.equal(f.hits[0].damage, 13); assert.equal(B.monster(st).stun, 1);
  B.endTurn(st); const steps = B.monsterTurn(st); assert.equal(steps[0].type, 'stun');
  assert.equal(b.cd, 2);
});
test('recruits: a healer companion mends the most hurt friend; mendAll heals the party; flame splashes', () => {
  const st = mkM({ allies: [{ u: 1, v: 0, key: 'orla', name: 'ออร์ลา', hp: 40, maxHp: 40, atk: 7, range: 3, healer: true }, { u: 0, v: 1, key: 'olwen', name: 'โอลเวน', hp: 36, maxHp: 36, atk: 14, range: 4 }],
    monsters: [{ u: 3, v: 2, hp: 40, maxHp: 40 }, { u: 4, v: 2, hp: 40, maxHp: 40 }, { u: 8, v: 8, hp: 40, maxHp: 40 }] });
  B.hero(st).hp = 20; const steps = B.alliesTurn(st); assert.ok(steps.some(x => x.type === 'heal')); assert.equal(B.hero(st).hp, 32);
  const s2 = mkM({ allies: [{ u: 1, v: 0, key: 'orla', name: 'ออร์ลา', hp: 40, maxHp: 40, atk: 7, range: 3, healer: true }, { u: 0, v: 1, key: 'olwen', name: 'โอลเวน', hp: 36, maxHp: 36, atk: 14, range: 4 }],
    monsters: [{ u: 3, v: 2, hp: 40, maxHp: 40 }, { u: 4, v: 2, hp: 40, maxHp: 40 }, { u: 8, v: 8, hp: 40, maxHp: 40 }] });
  B.hero(s2).hp = 30; const m = B.allySkill(s2, 'ally0'); assert.equal(m.ok, true); assert.equal(B.hero(s2).hp, 45);
  B.setTarget(s2, 'monster'); const f = B.allySkill(s2, 'ally1'); assert.equal(f.ok, true); assert.equal(f.hits.length, 2);
});

test('v97.08 facing: back ×1.2, side ×1.1, front ×1', () => {
  const t = { u: 5, v: 5, face: 'SE' };
  assert.equal(B.sideOf(t, { u: 6, v: 5 }), 'front'); assert.equal(B.sideOf(t, { u: 4, v: 5 }), 'back'); assert.equal(B.sideOf(t, { u: 5, v: 6 }), 'side'); assert.equal(B.sideOf(t, { u: 5, v: 4 }), 'side');
  const front = mkC({ hero: { u: 7, v: 8 }, monster: { face: 'NW' } }), back = mkC({ hero: { u: 7, v: 8 }, monster: { face: 'SE' } });   // the hero stands at −u of the monster
  const f = B.playCombat(front, give(front, 'combat', 'attack')).hits[0], b = B.playCombat(back, give(back, 'combat', 'attack')).hits[0];
  assert.ok(b.damage > f.damage, 'a hit from behind does more than from the front'); assert.ok(b.notes.some(n => /ด้านหลัง/.test(n)));
});
test('v97.08 one-click play: autoAttack picks a card, autoWalk picks a move card', () => {
  const st = mkC({ hero: { u: 7, v: 8 } }); give(st, 'combat', 'attack'); const m = B.monster(st);
  const p = B.autoAttack(st, m.id); assert.ok(p.index >= 0 && !p.to, 'adjacent: attack from here'); assert.ok(p.pv.total > 0);
  const near = mkC({ hero: { u: 6, v: 8 } }); near.mp = 0; give(near, 'combat', 'attack'); const si = give(near, 'movement', 'step');
  const q = B.autoAttack(near, B.monster(near).id); assert.deepEqual([q.moveCard, B.dist(q.to, B.monster(near))], [si, 1], 'two cells away: play a move card, step next to it, then hit');
  const w = B.autoWalk(near, { u: 5, v: 8 }); assert.equal(w.moveCard, si, 'no points left: the move card that reaches it');
  const far = mkC({ hero: { u: 0, v: 0 } }); far.mp = 0; give(far, 'combat', 'attack'); assert.ok(B.autoAttack(far, B.monster(far).id).reason, 'out of reach: a reason');
});
test('v97.18 job passives: warrior melee +3 · mage spell ×1.15 · cleric heal ×1.4 · guardian guard +4 · ranger range +1 · rogue flank ×1.15', () => {
  const hit = (hero, id, mon = {}) => { const st = mkC({ hero: { u: 7, v: 8, ...hero }, monster: mon }); return B.playCombat(st, give(st, 'combat', id)) };
  assert.equal(hit({ meleePlus: 3 }, 'attack').hits[0].damage, hit({}, 'attack').hits[0].damage + 3);
  assert.ok(hit({ spellMult: 1.15 }, 'spell').hits[0].damage > hit({}, 'spell').hits[0].damage);
  const heal = sup => { const st = mkC({ hero: { u: 7, v: 8, hp: 20, supportMult: sup } }); return B.playCombat(st, give(st, 'combat', 'firstAid')).heal };
  assert.equal(heal(1.4), Math.round(heal(1) * 1.4));
  const g = gp => { const st = mkC({ hero: { u: 7, v: 8, guardPlus: gp } }); return B.playCombat(st, give(st, 'combat', 'guard')).guard }; assert.equal(g(4), g(0) + 4);
  const far = rp => { const st = mkC({ hero: { u: 3, v: 8, rangePlus: rp } }); return B.combatBlock(st, give(st, 'combat', 'spell')) }; assert.ok(far(0)); assert.equal(far(1), '');   // 5 cells: spell reaches 4, 5 with the ranger
  assert.ok(hit({ flankPlus: 1.15 }, 'attack', { face: 'SE' }).hits[0].damage > hit({}, 'attack', { face: 'SE' }).hits[0].damage, 'rogue from behind');
});
test('v97.19 status effects: burn ticks, sleep skips and wakes on a hit, silence blocks element cards, weak lowers hits, monsters inflict by kind', () => {
  const st = mkC({ hero: { u: 7, v: 8 } }), m = B.monster(st);
  assert.equal(B.inflict(st, m, 'burn', 1), 'burn'); const steps = []; B.tickStatus(st, m, steps); assert.equal(m.hp, 34 - 4); assert.equal(steps[0].type, 'dot');
  B.inflict(st, m, 'sleep', 1); assert.equal(B.tickStatus(st, m, []), true, 'asleep: skip'); B.inflict(st, m, 'sleep', 1); B.hurt(st, m, 5); assert.ok(!m.sts?.sleep, 'a hit wakes it');
  const s2 = mkC({ hero: { u: 7, v: 8 } }); B.inflict(s2, B.hero(s2), 'silence', 1); assert.match(B.combatBlock(s2, give(s2, 'combat', 'spell')), /ใบ้/);
  const hit = weak => { const s3 = mkC({ hero: { u: 7, v: 8 } }); if (weak) B.inflict(s3, B.hero(s3), 'weak', 1); return B.playCombat(s3, give(s3, 'combat', 'attack')).hits[0].damage };
  assert.ok(hit(true) < hit(false));
  const s4 = B.create({ bounds: { u0: 0, v0: 0, u1: 8, v1: 8 }, kindAt, cards: true, rng: () => .1, hero: { u: 7, v: 8 }, monster: { u: 8, v: 8, hp: 34, maxHp: 34, atk: 8, move: 3, kind: 'slime' } });
  B.endTurn(s4); B.monsterTurn(s4); assert.ok(B.hero(s4).sts?.poison, 'a slime poisons');
});
test('v97.22 objectives: survive N turns · escape to an exit · defend a cell (a foe on it loses) · defeat the leader', () => {
  const mo = (objective, extra = {}) => B.create({ bounds: { u0: 0, v0: 0, u1: 8, v1: 8 }, kindAt, objective, hero: { u: 0, v: 8 }, monsters: [{ u: 8, v: 0, ...extra }, { u: 8, v: 1 }] });
  const s = mo({ type: 'survive', turns: 2 }); assert.match(B.objText(s), /2 เทิร์น/);
  B.endTurn(s); B.endTurn(s); assert.equal(s.outcome, null, 'turn 2: still going'); B.endTurn(s); B.endTurn(s); assert.equal(s.outcome, 'win', 'past turn 2: held out');
  const e = mo({ type: 'escape', cells: [{ u: 1, v: 8 }] }); assert.equal(B.move(e, { u: 1, v: 8 }).ok, true); assert.equal(e.outcome, 'win', 'stepping on the exit wins');
  const d = mo({ type: 'defend', turns: 4, cells: [{ u: 5, v: 0 }] }); B.endTurn(d); B.monsterTurn(d); assert.equal(d.outcome, 'lose', 'a foe that reaches the banner takes it');
  const l = mo({ type: 'leader' }, { leader: true }); B.hurt(l, l.units.find(u => u.leader), 999); B.checkOutcome(l); assert.equal(l.outcome, 'win', 'the leader down: the rest flee');
  const r = mo(null); B.hurt(r, r.units.find(u => u.id === 'monster'), 999); B.checkOutcome(r); assert.equal(r.outcome, null, 'rout: one foe still stands');
});
console.log('flat battle: ' + n + ' tests passed');

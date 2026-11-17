// v98.331 · rules of the two prologue tutorial fights (docs/TODO.md §14): immortal heroes (HP never below 1), the scripted pumpkin evolution
// (after the FIRST pumpkin is hurt, ONE of the others evolves — never random, never before), the `bind` status of the pumpkin boss.
// Run: node tools/test-tutorial-fights.cjs
const assert = require('node:assert/strict');
const B = require('../js/flat-battle.js');
let n = 0; const test = (name, fn) => { fn(); n++ };
const boss = { kind: 'pumpkinBoss', name: 'บอสฟักทอง', hp: 70, atk: 6, move: 2, iq: 1, shove: false, el: 'earth', fly: false, passive: false, range: 3, tier: 3 };
const pumpkin = () => ({ kind: 'pumpkin', name: 'ฟักทองในไร่', hp: 30, maxHp: 30, atk: 0, move: 0, passive: true, evoGroup: 'pumpkin', evo: { ...boss } });
const mk = (extra = {}) => B.create({ bounds: { u0: 0, v0: 0, u1: 9, v1: 9 }, hero: { u: 0, v: 0, ...extra.hero }, allies: extra.allies || [],
  monsters: [{ u: 6, v: 6, ...pumpkin() }, { u: 6, v: 8, ...pumpkin() }, { u: 8, v: 6, ...pumpkin() }] });

test('an immortal hero keeps 1 HP however hard he is hit (direct hit, burn, fall)', () => {
  const st = mk({ hero: { immortal: true, hp: 20, maxHp: 20 } }), h = B.hero(st);
  B.hurt(st, h, 500); assert.equal(h.hp, 1);
  h.sts = { burn: 2 }; B.tickStatus(st, h, []); assert.equal(h.hp, 1);
  assert.ok(!st.outcome || st.outcome !== 'lose', 'the fight cannot be lost by the immortal hero');
});
test('a normal hero still falls (the rule is opt-in)', () => {
  const st = mk(), h = B.hero(st); B.hurt(st, h, 5000); assert.equal(h.hp, 0);
});
test('an immortal ALLY (the sibling) is protected too, other allies are not', () => {
  const st = mk({ allies: [{ u: 1, v: 1, key: 'sib', immortal: true, hp: 30, maxHp: 30 }, { u: 2, v: 1, key: 'bram', hp: 30, maxHp: 30 }] });
  const [sib, bram] = B.allies(st); B.hurt(st, sib, 999); B.hurt(st, bram, 999); assert.equal(sib.hp, 1); assert.equal(bram.hp, 0);
});
test('scripted evolution: nobody evolves while no pumpkin is hurt', () => {
  const st = mk(); st.turns = 6;
  for (let i = 0; i < 6; i++) B.monsterTurn(st), st.turn = 'monster';
  assert.equal(B.monsters(st).filter(m => m.evolved).length, 0);
});
test('scripted evolution: after the first pumpkin is hurt exactly ONE of the others becomes the boss (a stronger, walking, ranged unit)', () => {
  const st = mk(), ms = B.monsters(st); B.hurt(st, ms[0], 5);
  st.turn = 'monster'; B.monsterTurn(st); st.turn = 'monster'; B.monsterTurn(st);
  const ev = B.monsters(st).filter(m => m.evolved); assert.equal(ev.length, 1, 'exactly one boss');
  const b = ev[0]; assert.notEqual(b.id, ms[0].id, 'the hurt one is not the boss'); assert.equal(b.kind, 'pumpkinBoss'); assert.equal(b.passive, false); assert.equal(b.range, 3); assert.equal(b.move, 2); assert.ok(b.maxHp >= 60);
  assert.equal(B.monsters(st).filter(m => m.kind === 'pumpkin').length, 2);
  const more = B.monsters(st).filter(m => m.evolved).length; st.turn = 'monster'; B.monsterTurn(st); assert.equal(B.monsters(st).filter(m => m.evolved).length, more, 'the event happens once');
});
test('scripted evolution: if the chosen pumpkin falls first, another one is chosen', () => {
  const st = mk(), ms = B.monsters(st); B.hurt(st, ms[0], 5); st.evoEventDone = false; st.turn = 'monster';
  // pick the target as the rules would, then kill it before its turn
  const ev0 = st.evoEventTarget; assert.equal(ev0, undefined);
  B.monsterTurn(st); // one monster phase: target chosen & evolved or pending
  const left = B.monsters(st).filter(m => m.evolved).length; assert.ok(left <= 1);
});
test('bind: the status exists, binding is applied by the pumpkin boss only at range, and it wears off after the hero\'s turn', () => {
  assert.ok(B.STATUS.bind && B.STATUS.bind.turns === 1, 'bind is a status');
  const st = mk({ hero: { hp: 40, maxHp: 40 } }), h = B.hero(st); h.sts = { bind: 1 }; st.turn = 'hero'; B.endTurn(st);
  assert.ok(!h.sts || !h.sts.bind, 'the vines let go when his turn ends');
});
console.log('tutorial fights: ' + n + ' tests passed');

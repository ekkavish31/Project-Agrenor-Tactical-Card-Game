// v98.1078 · the two-layer walking range: FlatBattle.moveSteps / movePlan / walkPlan follow the real card rules
const assert = require('node:assert/strict');
const B = require('../js/flat-battle.js');
let n = 0; const test = (name, fn) => { try { fn(); n++ } catch (e) { console.error('✗', name); throw e } };
const kindAt = () => 'normal';
const mk = (o = {}) => B.create({ bounds: { u0: 0, v0: 0, u1: 12, v1: 12 }, kindAt, cards: true, rng: () => .42, hero: { u: 0, v: 0, ...o.hero }, monster: { u: 12, v: 12, hp: 34, maxHp: 34, atk: 8, move: 3 } });
const setHand = (st, ids) => { st.deck.movement.hand = ids.map((id, i) => ({ id, uid: id + '-' + i, used: false })) };
const TD = require('../js/tactics-decks.js');
const MV = id => (TD.MOVE || TD.TacticsDecks?.MOVE)[id];

test('one card → green only; two cards → yellow = both moves', () => {
  const st = mk(); setHand(st, ['walk', 'step']); const P = B.movePlan(st);
  assert.equal(P.one.move, Math.max(MV('walk').move, MV('step').move));
  assert.equal(P.two.move, MV('walk').move + MV('step').move); assert.equal(P.two.steps.length, 2);
});
test('only one crystal left → no two-card option', () => {
  const st = mk(); setHand(st, ['walk', 'step']); st.spent = 1; const P = B.movePlan(st);
  assert.ok(P.one); assert.ok(!P.two || P.two.steps.some(s => s.emergency));
});
test('a single move card + nothing else usable → card + emergency step (+1)', () => {
  const st = mk(); setHand(st, ['walk']); const P = B.movePlan(st);
  assert.equal(P.two.move, MV('walk').move + 1); assert.ok(P.two.steps[1].emergency);
});
test('no usable move card → emergency step only (never ×2)', () => {
  const st = mk(); setHand(st, []); const P = B.movePlan(st);
  assert.equal(P.one.move, 1); assert.ok(P.one.steps[0].emergency); assert.equal(P.two, null);
});
test('not enough stamina for both cards → no two-card pair (but the card + emergency step when nothing else is usable)', () => {
  const st = mk(); setHand(st, ['sprint', 'sprint']); const h = B.hero(st); h.stamina = MV('sprint').stamina; const P = B.movePlan(st);
  assert.equal(P.one.move, MV('sprint').move);
  assert.ok(P.two && P.two.steps.length === 2 && P.two.steps[1].emergency, 'second sprint is unaffordable → sprint + emergency');
  assert.equal(P.two.move, MV('sprint').move + 1);
});
test('walkPlan picks the cheapest way that reaches the cell', () => {
  const st = mk(); setHand(st, ['walk', 'step']); const near = { u: 1, v: 0 }, far = { u: MV('walk').move + MV('step').move, v: 0 };
  assert.equal(B.walkPlan(st, near).steps.length, 1); assert.equal(B.walkPlan(st, far).steps.length, 2);
  assert.equal(B.walkPlan(st, { u: 12, v: 12 }), null);
});
console.log('test-move-plan: ' + n + ' passed');

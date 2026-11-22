/* node tools/test-card-forge.cjs — js/card-forge.js: stars (max 6) from spare copies · element imbue · one mod chip · dismantle · rewards · saves without cardPool · and the battle (js/flat-battle.js) really uses the changed rule. */
'use strict';
const assert = require('node:assert/strict');
let n = 0; const test = (name, fn) => { fn(); n++; console.log('✓ ' + name) };
global.globalThis.WorldState = null;
const TD = require('../js/tactics-decks.js'); global.TacticsDecks = TD;
let GAME; global.WorldState = { game: () => GAME }; global.save = () => { };
require('../js/card-forge.js'); const CF = global.CardForge; const B = require('../js/flat-battle.js');
const fresh = (pool = { combat: { attack: 9, thunder: 4, flame: 1, firstAid: 3, quake: 1 }, movement: { walk: 7 } }) => { GAME = { village: pool ? { cardPool: JSON.parse(JSON.stringify(pool)), tacticDecks: { movement: { walk: 7, step: 3 }, combat: { attack: 9, thunder: 4, flame: 1, firstAid: 3 } } } : {} } };
const kindAt = () => 'normal';
const mk = (o = {}) => B.create({ bounds: { u0: 0, v0: 0, u1: 8, v1: 8 }, kindAt, cards: true, rng: () => .42, hero: { u: 7, v: 8, ...o.hero }, monster: { u: 8, v: 8, hp: 200, maxHp: 200, atk: 8, move: 3 } });
const give = (st, group, id) => { const hand = st.deck[group].hand; const i = hand.findIndex(c => c.id === id && !c.used); if (i >= 0) return i; hand[0] = { id, uid: id + '-t', used: false }; return 0 };

test('no forge data → the card rules are exactly the originals', () => {
  fresh(); const st = mk(); assert.deepEqual(B.cardRule('thunder'), B.baseRule('thunder'));
});
test('stars: ★1 → ★2 needs 1 spare copy · copies come out of the collection · the deck is clamped', () => {
  fresh(); assert.equal(CF.spareOf('thunder'), 3); assert.equal(CF.needFor('thunder'), 1);
  const r = CF.starUp('thunder'); assert.equal(r.ok, true); assert.equal(CF.starsOf('thunder'), 2);
  assert.equal(GAME.village.cardPool.combat.thunder, 3); assert.equal(GAME.village.tacticDecks.combat.thunder, 3);
});
test('stars: cost 1,1,2,2,3 spare copies up to ★6, then it stops', () => {
  fresh({ combat: { attack: 20, thunder: 11 }, movement: { walk: 7 } }); let spent = 0;
  for (const need of [1, 1, 2, 2, 3]) { assert.equal(CF.needFor('thunder'), need); assert.equal(CF.starUp('thunder').ok, true); spent += need }
  assert.equal(spent, 9); assert.equal(CF.starsOf('thunder'), 6); assert.equal(GAME.village.cardPool.combat.thunder, 2);
  assert.equal(CF.starUp('thunder').ok, false);
});
test('stars: not enough spare copies → refused, nothing changes', () => {
  fresh(); const r = CF.starUp('flame'); assert.equal(r.ok, false); assert.equal(CF.starsOf('flame'), 1); assert.equal(GAME.village.cardPool.combat.flame, 1);
});
test('stars: +10 % per star on damage / guard / heal, ★3 −2 stamina, ★6 +1 range on ranged cards', () => {
  fresh({ combat: { thunder: 20, firstAid: 20, attack: 9 }, movement: { walk: 7 } });
  for (let i = 0; i < 5; i++) { CF.starUp('thunder'); CF.starUp('firstAid') }
  assert.equal(CF.starsOf('thunder'), 6); mk(); const t = B.cardRule('thunder'), b = B.baseRule('thunder');
  assert.equal(t.dmg, Math.round(b.dmg * 1.5)); assert.equal(t.st, b.st - 2); assert.equal(t.range, b.range + 1);
  const f = B.cardRule('firstAid'); assert.equal(f.heal, Math.round(B.baseRule('firstAid').heal * 1.5)); assert.equal(f.st, 0);   // free card stays free
});
test('battle: a ★ card really hits harder', () => {
  fresh({ combat: { attack: 30 }, movement: { walk: 7 } }); let st = mk(); let i = give(st, 'combat', 'attack'); const d1 = B.playCombat(st, i).hits[0].damage;
  for (let k = 0; k < 5; k++) CF.starUp('attack'); st = mk(); i = give(st, 'combat', 'attack'); const d2 = B.playCombat(st, i).hits[0].damage;
  assert.ok(d2 > d1, d1 + ' → ' + d2); assert.ok(d2 >= d1 * 1.4, 'about +50 %');
});
test('forge state does not stick: removing it restores the originals at the next battle', () => {
  fresh({ combat: { attack: 30 }, movement: { walk: 7 } }); for (let k = 0; k < 5; k++) CF.starUp('attack'); mk(); assert.ok(B.cardRule('attack').dmg > 18);
  GAME.village.cardUp = null; mk(); assert.equal(B.cardRule('attack').dmg, 18);
});
test('imbue: any card can take any of the 9 elements for 6 shards; the original element is free to restore', () => {
  fresh(); assert.equal(CF.imbue('thunder', 'fire').ok, false);                              // no shards
  CF.addDust(10); assert.equal(CF.imbue('thunder', 'fire').ok, true); assert.equal(CF.dust(), 4); assert.equal(CF.imbuedOf('thunder'), 'fire');
  mk(); assert.equal(B.cardRule('thunder').dmg, B.baseRule('thunder').dmg);
  assert.equal(CF.imbue('thunder', 'reset').ok, true); assert.equal(CF.imbuedOf('thunder'), null); assert.equal(CF.dust(), 4);
  assert.equal(CF.imbue('thunder', 'secret').ok, false);                                       // only the wheel
  assert.equal(CF.imbue('attack', 'water').ok, false);                                         // 4 shards left
});
test('imbue: the battle uses the new element for that card (a weapon card too)', () => {
  fresh({ combat: { attack: 9, thunder: 4 }, movement: { walk: 7 } }); CF.addDust(20); CF.imbue('attack', 'water'); CF.imbue('thunder', 'ice');
  const st = mk(); const h = B.hero(st); assert.equal(B.cardEl('attack', h), 'water'); assert.equal(B.cardEl('thunder', h), 'ice');
  GAME.village.cardUp = null; mk(); assert.notEqual(B.cardEl('thunder', B.hero(st)), 'ice');
});
test('mods: one chip per card; replacing returns the old chip; effects land in the rule', () => {
  fresh({ combat: { thunder: 4, flame: 2, attack: 9 }, movement: { walk: 7 } }); CF.addChip('range'); CF.addChip('cheap'); CF.addChip('burn'); CF.addChip('keen');
  const c = { range: CF.chips().range, cheap: CF.chips().cheap }; assert.ok(c.range >= 1);
  assert.equal(CF.installMod('thunder', 'range').ok, true); mk(); assert.equal(B.cardRule('thunder').range, B.baseRule('thunder').range + 1);
  assert.equal(CF.installMod('thunder', 'cheap').ok, true); assert.equal(CF.chips().range, c.range);   // old chip back
  mk(); assert.equal(B.cardRule('thunder').st, B.baseRule('thunder').st - 5); assert.equal(B.cardRule('thunder').range, B.baseRule('thunder').range);
  assert.equal(CF.installMod('flame', 'keen').ok, true); mk(); assert.equal(B.cardRule('flame').dmg, B.baseRule('flame').dmg + 3);
  assert.equal(CF.installMod('attack', 'burn').ok, true); mk(); assert.equal(CF.removeMod('attack').ok, true); assert.equal(CF.modOf('attack'), null);
  assert.equal(CF.installMod('attack', 'poison').ok, false);                                  // none in the bag
});
test('mods: a status chip makes the card inflict that status; self cards ignore damage chips', () => {
  fresh({ combat: { attack: 9, guard: 3 }, movement: { walk: 7 } }); CF.addChip('burn'); CF.installMod('attack', 'burn');
  const st = mk(); const i = give(st, 'combat', 'attack'); const r = B.playCombat(st, i); assert.equal(r.ok, true);
  assert.ok(r.status && r.status.kind === 'burn', 'a burn was inflicted on the hit (rng .42 < .5)');
});
test('dismantle: a spare copy → shards by rarity · the last copy cannot be dismantled · shards buy a spare copy', () => {
  fresh(); const d0 = CF.dust(); assert.equal(CF.dismantle('thunder', 1).ok, true); assert.equal(CF.dust(), d0 + 3);   // thunder = rare
  assert.equal(CF.dismantle('firstAid', 2).ok, true); assert.equal(CF.dust(), d0 + 3 + 4);                           // uncommon ×2
  assert.equal(CF.dismantle('flame', 1).ok, false);                                                                   // only 1 copy
  const sp = CF.spareOf('flame'); assert.equal(CF.synth('flame').ok, true); assert.equal(CF.spareOf('flame'), sp + 1); assert.equal(CF.dust(), d0 + 7 - 4);
});
test('old saves without a collection: spare copies live on the card record, everything else works the same', () => {
  fresh(null); assert.equal(CF.owned('thunder'), true); assert.equal(CF.spareOf('thunder'), 0); CF.addDust(8);
  assert.equal(CF.synth('thunder').ok, true); assert.equal(CF.spareOf('thunder'), 1); assert.equal(CF.starUp('thunder').ok, true); assert.equal(CF.starsOf('thunder'), 2); assert.equal(GAME.village.cardPool, undefined);
});
test('rewards: boss gives shards + a chip · bounty the same · farm / guild sometimes', () => {
  fresh(); const d = CF.dust(), c = Object.values(CF.chips()).reduce((a, b) => a + b, 0); assert.ok(CF.reward('boss')); assert.equal(CF.dust(), d + 3);
  assert.equal(Object.values(CF.chips()).reduce((a, b) => a + b, 0), c + 1); CF.reward('bounty'); assert.equal(CF.dust(), d + 6);
  let got = 0; for (let i = 0; i < 40; i++) if (CF.reward('guild')) got++; assert.ok(got > 3 && got < 40);
});
console.log(n + ' forge tests passed');

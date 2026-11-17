/* node tools/test-items.cjs — การ์ดกระเป๋าในสนามรบ (FB.useItem) + การ์ดต่อสู้ใหม่ v98.496 */
const assert = require('node:assert/strict'); global.window = global;
const B = require('../js/flat-battle.js'); let n = 0; const test = (name, fn) => { try { fn(); n++ } catch (e) { console.log('FAIL', name, e.message); process.exitCode = 1 } };
const mk = (o = {}) => B.create({ bounds: { u0: 0, v0: 0, u1: 9, v1: 9 }, kindAt: () => 'normal', cards: true, rng: () => .42, bag: o.bag, hero: { u: 0, v: 0, hp: 40, maxHp: 60, ...o.hero }, monster: { u: 3, v: 0, hp: 80, maxHp: 80, atk: 8, move: 3, kind: 'slime', ...o.monster } });
test('bag draws up to 3 distinct-count items', () => { const st = mk({ bag: { potion: 2, firebomb: 1, bread: 1, tonic: 1 } }); assert.equal(st.itemHand.length, 3); assert.ok(st.itemHand.every(k => B.ITEM[k])) });
test('no bag → no item hand', () => { const st = mk(); assert.equal(st.itemHand.length, 0) });
test('unknown keys (goods) never enter the hand', () => { const st = mk({ bag: { wolfFang: 5, herb: 2 } }); assert.equal(st.itemHand.length, 0) });
test('potion heals 25, spends a crystal, records use', () => { const st = mk({ bag: { potion: 1 } }); st.turn = 'hero'; const c0 = B.crystals(st), r = B.useItem(st, 0); assert.ok(r.ok && r.self && r.heal === 20); assert.equal(B.hero(st).hp, 60); assert.equal(B.crystals(st), c0 - 1); assert.equal(st.itemsUsed.potion, 1); assert.equal(st.itemHand.length, 0) });
test('one item per turn', () => { const st = mk({ bag: { potion: 2 } }); st.turn = 'hero'; B.useItem(st, 0); assert.match(B.itemBlock(st, 0), /ครั้งเดียว/) });
test('hp full → potion blocked', () => { const st = mk({ bag: { potion: 1 }, hero: { hp: 60 } }); st.turn = 'hero'; assert.match(B.itemBlock(st, 0), /เต็ม/) });
test('antidote cures status', () => { const st = mk({ bag: { antidote: 1 }, hero: { hp: 30 } }); st.turn = 'hero'; B.hero(st).sts = { poison: 2 }; const r = B.useItem(st, 0); assert.ok(r.cured.includes('poison')); assert.equal(B.hero(st).sts, undefined) });
test('antidote with nothing to cure and full hp is blocked', () => { const st = mk({ bag: { antidote: 1 }, hero: { hp: 60 } }); st.turn = 'hero'; assert.ok(B.itemBlock(st, 0)) });
test('stone skin → guard 30', () => { const st = mk({ bag: { stoneSkin: 1 } }); st.turn = 'hero'; B.useItem(st, 0); assert.equal(B.hero(st).guard, 30) });
test('smoke bomb → evade, whetstone → ambush', () => { const a = mk({ bag: { smokeBomb: 1 } }); a.turn = 'hero'; B.useItem(a, 0); assert.equal(B.hero(a).evade, 1); const b = mk({ bag: { whetstone: 1 } }); b.turn = 'hero'; B.useItem(b, 0); assert.equal(B.hero(b).ambush, 1.6) });
test('firebomb hits a foe in range 4, ends walking', () => { const st = mk({ bag: { firebomb: 1 } }); st.turn = 'hero'; const m = B.monster(st), h0 = m.hp, r = B.useItem(st, 0); assert.ok(r.ok && !r.self && r.hits[0].damage > 0); assert.ok(m.hp < h0); assert.equal(st.acted, true) });
test('firebomb out of range is blocked', () => { const st = mk({ bag: { firebomb: 1 }, monster: { u: 9, v: 9 } }); st.turn = 'hero'; assert.match(B.itemBlock(st, 0), /นอกระยะ/) });
test('oil flask splashes a neighbour', () => { const st = mk({ bag: { oilFlask: 1 } }); st.turn = 'hero'; const e = B.create; const m2 = { id: 'm2', side: 'monster', kind: 'slime', name: 'x', u: 4, v: 0, hp: 50, maxHp: 50, atk: 5, move: 3, def: 0, guard: 0 }; st.units.push(m2); const r = B.useItem(st, 0); assert.equal(r.hits.length, 2) });
test('crystals gone → blocked', () => { const st = mk({ bag: { potion: 1 } }); st.turn = 'hero'; st.spent = st.crystalMax; assert.match(B.itemBlock(st, 0), /คริสตัล/) });
test('hand refills from the rest of the bag next turn, never past the stock', () => { const st = mk({ bag: { potion: 2 }, hero: { hp: 5 } }); st.turn = 'hero'; assert.equal(st.itemHand.length, 2); B.useItem(st, 0); B.itemDraw(st); assert.equal(st.itemHand.length, 1); st.itemTurn = 0; B.useItem(st, 0); st.itemTurn = 0; B.itemDraw(st); assert.equal(st.itemHand.length, 0) });
/* new combat cards: each has a rule, a sane stamina cost and plays through playCombat */
const NEW = ['cleave', 'shieldBash', 'volley', 'snipe', 'smite', 'bless', 'shadowStep', 'emberBurst', 'warCry'];
for (const id of NEW) test('card rule ' + id, () => { const r = B.cardRule(id); assert.ok(r && r.st >= 0 && (r.self || r.dmg > 0) && r.fx) });
test('volley hits twice', () => { assert.equal(B.cardRule('volley').hits, 2) });
test('warCry/bless are self cards', () => { assert.ok(B.cardRule('warCry').self && B.cardRule('bless').self) });
console.log(n + ' ok');

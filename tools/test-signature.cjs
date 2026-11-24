/* node tools/test-signature.cjs — การ์ดประจำตัว (Signature) v98.1019: ชาย = พุ่งประชิด เดี่ยว/กลุ่ม · หญิง = เวทไกล เดี่ยว/กลุ่ม + สถานะ · กรองตามเพศของตัวเอกที่นำ · ท่าพิเศษของตัวตาม */
const assert = require('node:assert/strict'); global.window = global;
const B = require('../js/flat-battle.js'), TD = require('../js/tactics-decks.js');
let n = 0; const test = (name, fn) => { try { fn(); n++ } catch (e) { console.log('FAIL', name, e.message); process.exitCode = 1 } };
const mk = (o = {}) => B.create({ bounds: { u0: 0, v0: 0, u1: 9, v1: 9 }, kindAt: () => 'normal', cards: true, rng: o.rng || (() => .1), hero: { u: 0, v: 0, hp: 60, maxHp: 60, ...o.hero }, monster: { u: 3, v: 0, hp: 200, maxHp: 200, atk: 8, move: 3, kind: 'slime', ...o.monster } });
const give = (st, id) => { const hand = st.deck.combat.hand, i = hand.findIndex(c => c.id === id && !c.used); if (i >= 0) return i; hand[0] = { id, uid: id + '-t', used: false }; return 0 };
const foe = (u, v) => ({ id: 'm' + u + v, side: 'monster', kind: 'slime', name: 'x', u, v, hp: 200, maxHp: 200, atk: 5, move: 3, def: 0, guard: 0 });
const IDS = ['sigLightM', 'sigHeavyM', 'sigLightF', 'sigHeavyF'];
for (const id of IDS) test('rule + name ' + id, () => { const r = B.cardRule(id); assert.ok(r && r.dmg > 0 && r.fx === id && r.st > 0); assert.ok(TD.COMBAT[id].name && TD.COMBAT[id].look) });
test('looks: M cards are male, F cards are female', () => { assert.equal(TD.COMBAT.sigLightM.look, 'male'); assert.equal(TD.COMBAT.sigHeavyM.look, 'male'); assert.equal(TD.COMBAT.sigLightF.look, 'female'); assert.equal(TD.COMBAT.sigHeavyF.look, 'female') });
test('design: Heavy a little harder than Light (per sibling)', () => { assert.ok(B.cardRule('sigHeavyM').dmg > B.cardRule('sigLightM').dmg && B.cardRule('sigHeavyM').dmg - B.cardRule('sigLightM').dmg <= 4); assert.ok(B.cardRule('sigHeavyF').dmg > B.cardRule('sigLightF').dmg) });
test('brother Light = single, leaps in, hits hard (> basic attack)', () => { const r0 = B.cardRule('sigLightM'); assert.ok(r0.leap && !r0.aoe && r0.dmg > B.cardRule('attack').dmg); const st = mk(); st.turn = 'hero'; const i = give(st, 'sigLightM'), r = B.playCombat(st, i); assert.ok(r.ok && r.leap && r.hits.length === 1 && r.hits[0].damage > 0); assert.ok(B.dist(B.hero(st), B.monster(st)) <= 1) });
test('brother Heavy = leaps in + splash round the target', () => { assert.ok(B.cardRule('sigHeavyM').leap && B.cardRule('sigHeavyM').aoe === 'splash'); const st = mk(); st.turn = 'hero'; st.units.push(foe(4, 0)); const i = give(st, 'sigHeavyM'), r = B.playCombat(st, i); assert.ok(r.ok && r.leap && r.hits.length === 2 && r.hits.every(h => h.damage > 0)) });
test('sister Light = ranged single + weak', () => { const r0 = B.cardRule('sigLightF'); assert.ok(r0.range >= 4 && !r0.aoe && !r0.leap); const st = mk({ monster: { u: 4, v: 0 } }); st.turn = 'hero'; const i = give(st, 'sigLightF'), r = B.playCombat(st, i); assert.ok(r.ok && r.hits.length === 1 && r.hits[0].damage > 0 && r.status?.kind === 'weak'); assert.equal(B.hero(st).u, 0) });
test('sister Heavy = ranged splash + shock on EVERY target hit', () => { const r0 = B.cardRule('sigHeavyF'); assert.ok(r0.range >= 4 && r0.aoe === 'splash' && r0.statusAll); const st = mk({ monster: { u: 4, v: 0 } }); st.turn = 'hero'; st.units.push(foe(5, 0)); const i = give(st, 'sigHeavyF'), r = B.playCombat(st, i); assert.ok(r.ok && r.hits.length === 2 && r.status?.kind === 'shock' && r.statuses?.length === 1 && r.statuses[0].kind === 'shock') });
test('deck keeps only the leading sibling\'s signature cards', () => {
  const cfg = { movement: { walk: 12 }, combat: { attack: 12, sigLightM: 2, sigLightF: 2 } }, ids = d => [...d.combat.draw, ...d.combat.hand, ...d.combat.discard].map(c => c.id);
  global.HeroVariant = { get: () => 'male' }; let d = TD.create(cfg, Math.random); assert.ok(ids(d).includes('sigLightM') && !ids(d).includes('sigLightF'));
  global.HeroVariant = { get: () => 'female' }; d = TD.create(cfg, Math.random); assert.ok(ids(d).includes('sigLightF') && !ids(d).includes('sigLightM'));
  delete global.HeroVariant });
test('the OTHER sibling fights with the signature the lead does not use', () => {
  B.setSignature(0, false); assert.equal(B.ALLY_SKILL.sib, undefined);
  B.setSignature(1, false); assert.equal(B.ALLY_SKILL.sib.id, 'sigLightF'); B.setSignature(2, false); assert.equal(B.ALLY_SKILL.sib.id, 'sigHeavyF'); assert.ok(B.ALLY_SKILL.sib.status);
  B.setSignature(1, true); assert.equal(B.ALLY_SKILL.sib.id, 'sigLightM'); B.setSignature(2, true); assert.equal(B.ALLY_SKILL.sib.id, 'sigHeavyM'); B.setSignature(0, false) });
test('follower skill is blocked until unlocked and works after (status on the hit)', () => {
  const st = mk({ monster: { u: 4, v: 0 } }); const ally = { id: 'a1', key: 'sib', side: 'hero', kind: 'ally', name: 'sib', u: 1, v: 1, hp: 50, maxHp: 50, atk: 8, move: 3, def: 0, guard: 0, range: 1 }; st.units.push(ally); st.turn = 'hero';
  B.setSignature(0, false); assert.match(B.skillBlock(st, ally), /ไม่มีท่าพิเศษ/);
  B.setSignature(1, false); assert.equal(B.skillBlock(st, ally), ''); const r = B.allySkillNow ? null : null; B.setSignature(0, false) });
test('origin canon: story scenes exist, speakers valid, no forbidden lore', () => {
  const fs = require('fs'), src = fs.readFileSync(__dirname + '/../js/story-data.js', 'utf8');
  const bd = fs.readFileSync(__dirname + '/../js/dialogue-backdrops.js', 'utf8'), q = fs.readFileSync(__dirname + '/../js/story-quests.js', 'utf8');
  assert.match(src, /sigLight:\{/); assert.match(bd, /sigLight: 'guild'/); assert.match(q, /sceneAt\('sigLight'\)/);
  const i = src.indexOf('sigLight:{'), j = src.indexOf(' potionsDone:'), k = src.indexOf(' finale:{'), m = src.indexOf('// pumpkin contest');
  const g = src.indexOf(' guildFirst:{'), g2 = src.indexOf(' home:{', g);
  const parts = src.slice(i, j) + src.slice(k, m) + src.slice(g, g2);
  assert.ok(/ถอดแบบท่า/.test(parts));
  for (const w of ['พ่อบังเกิด', 'สายเลือด', 'แก่นธาตุ', 'โบราณ', 'G.', 'Mip', 'จานหิน' && '\u0000']) assert.ok(!parts.includes(w), w);
  const who = [...src.slice(i, j).matchAll(/who:'(\w+)'/g)].map(x => x[1]); assert.ok(who.every(w => ['clerk', 'B', 'S', 'hero', 'sib'].includes(w)), who.join());
});
console.log(n + ' ok');

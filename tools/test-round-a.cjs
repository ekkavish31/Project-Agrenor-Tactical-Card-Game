/* node tools/test-round-a.cjs — รอบ A (v98.1033): การ์ดใหม่ 7 ใบ ghostStep sweepFoot windBlade lightLance shadowDrain sleepMist lightningArc */
const assert = require('node:assert/strict'); global.window = global;
const B = require('../js/flat-battle.js'), TD = require('../js/tactics-decks.js');
let n = 0; const test = (name, fn) => { try { fn(); n++ } catch (e) { console.log('FAIL', name, e.message); process.exitCode = 1 } };
const mk = (o = {}) => B.create({ bounds: { u0: 0, v0: 0, u1: 9, v1: 9 }, kindAt: () => 'normal', cards: true, rng: o.rng || (() => .1), hero: { u: 0, v: 0, hp: 60, maxHp: 60, ...o.hero }, monster: { u: 3, v: 0, hp: 200, maxHp: 200, atk: 8, move: 3, kind: 'slime', ...o.monster } });
const give = (st, id) => { const hand = st.deck.combat.hand; hand[0] = { id, uid: id + '-t', used: false }; return 0 };
const foe = (u, v) => ({ id: 'm' + u + v, side: 'monster', kind: 'slime', name: 'x', u, v, hp: 200, maxHp: 200, atk: 5, move: 3, def: 0, guard: 0 });
const IDS = ['ghostStep', 'sweepFoot', 'windBlade', 'lightLance', 'shadowDrain', 'sleepMist', 'lightningArc'];
const play = (id, o) => { const st = mk(o); st.turn = 'hero'; if (o?.extra) st.units.push(...o.extra); const r = B.playCombat(st, give(st, id)); return { st, r } };
for (const id of IDS) test('rule+name ' + id, () => { const r = B.cardRule(id); assert.ok(r && r.dmg > 0 && r.fx && r.st > 0); assert.ok(TD.COMBAT[id].name) });
test('ghostStep: leaps in and gets a dodge', () => { const { st, r } = play('ghostStep', { monster: { u: 2, v: 0 } }); assert.ok(r.ok && r.leap && B.hero(st).evade === 1) });
test('sweepFoot: turns the target around and slows it', () => { const { st, r } = play('sweepFoot', { monster: { u: 1, v: 0 } }); assert.ok(r.ok && r.slowed); const m = B.monster(st); assert.notEqual(m.face, 'NW') });
test('windBlade: two hits then pushes', () => { const { r } = play('windBlade', { monster: { u: 2, v: 0 } }); assert.ok(r.ok && r.hits.length === 2 && r.moved) });
test('lightLance: pierces the foe behind in the line', () => { const { r } = play('lightLance', { monster: { u: 2, v: 0 }, extra: [foe(3, 0)] }); assert.ok(r.ok && r.hits.length === 2 && r.pierced); });
test('lightLance: nobody behind → one hit', () => { const { r } = play('lightLance', { monster: { u: 2, v: 0 }, extra: [foe(2, 3)] }); assert.equal(r.hits.length, 1) });
test('shadowDrain: heals the user and weakens', () => { const { st, r } = play('shadowDrain', { monster: { u: 3, v: 0 }, hero: { hp: 40 }, rng: () => .1 }); assert.ok(r.ok && r.drain === 6 && B.hero(st).hp === 46) });
test('sleepMist: sleeps everyone hit (statusAll)', () => { const { r } = play('sleepMist', { monster: { u: 3, v: 0 }, extra: [foe(4, 0)], rng: () => .1 }); assert.ok(r.ok && r.status?.kind === 'sleep' && r.statuses?.length === 1) });
test('lightningArc: chains to a near foe (60%) and not to a far one', () => { let { r } = play('lightningArc', { monster: { u: 3, v: 0 }, extra: [foe(4, 1)], rng: () => .1 }); assert.ok(r.chained && r.hits.length === 2); ({ r } = play('lightningArc', { monster: { u: 3, v: 0 }, extra: [foe(8, 8)], rng: () => .1 })); assert.ok(!r.chained && r.hits.length === 1); ({ r } = play('lightningArc', { monster: { u: 3, v: 0 }, extra: [foe(4, 1)], rng: () => .9 })); assert.ok(!r.chained) });
test('every new card is sold / taught somewhere (card-sources)', () => { const fs = require('fs'), src = fs.readFileSync(__dirname + '/../js/card-sources.js', 'utf8'); for (const id of IDS) assert.ok(src.includes("'c:" + id + "'"), id) });
/* items */
const ITEMS = ['antiShock', 'antiSilence', 'wakeSalt', 'echoBell', 'guardBalm', 'mendKit', 'bigStew', 'sleepDart', 'glueFlask'];
const AD = (() => { global.ADVENTURE_DATA = undefined; const w = global.window; require('../js/adventure-data.js'); return global.ADVENTURE_DATA || w.ADVENTURE_DATA })();
const mkBag = (bag, o = {}) => { const st = B.create({ bounds: { u0: 0, v0: 0, u1: 9, v1: 9 }, kindAt: () => 'normal', cards: true, rng: o.rng || (() => .1), bag, hero: { u: 0, v: 0, hp: 40, maxHp: 60, ...o.hero }, monster: { u: 3, v: 0, hp: 200, maxHp: 200, atk: 8, move: 3, kind: 'slime', ...o.monster } }); st.turn = 'hero'; return st };
for (const k of ITEMS) test('item ' + k + ' has data + rule + name', () => { assert.ok(AD.CONSUMABLES[k] && AD.CONSUMABLES[k].price > 0); assert.ok(B.itemRule(k)) });
test('cure items clear statuses (and need one to be usable)', () => { const st = mkBag({ wakeSalt: 1 }); assert.match(B.itemBlock(st, 0), /ไม่มีสถานะ/); B.hero(st).sts = { sleep: 2 }; assert.equal(B.itemBlock(st, 0), ''); const r = B.useItem(st, 0); assert.ok(r.ok && !B.hero(st).sts) });
test('echoBell: restore + cure · mendKit: heal + cure', () => { let st = mkBag({ echoBell: 1 }); B.hero(st).sts = { weak: 2 }; B.hero(st).stamina = 10; let r = B.useItem(st, 0); assert.ok(r.ok && B.hero(st).stamina === 40); st = mkBag({ mendKit: 1 }, { hero: { hp: 20 } }); B.hero(st).sts = { poison: 2 }; r = B.useItem(st, 0); assert.ok(r.ok && B.hero(st).hp === 40 && !B.hero(st).sts) });
test('guardBalm gives guard 14', () => { const st = mkBag({ guardBalm: 1 }); B.useItem(st, 0); assert.equal(B.hero(st).guard, 14) });
test('sleepDart puts a foe in range 4 to sleep (60%)', () => { const st = mkBag({ sleepDart: 1 }, { monster: { u: 4, v: 0 }, rng: () => .1 }); const r = B.useItem(st, 0); assert.ok(r.ok && r.status?.kind === 'sleep') });
test('glueFlask binds a foe in range 3', () => { const st = mkBag({ glueFlask: 1 }, { monster: { u: 3, v: 0 }, rng: () => .1 }); const r = B.useItem(st, 0); assert.ok(r.ok && r.status?.kind === 'bind') });
/* monsters + goods (data wiring) */
const fs = require('fs'), read = f => fs.readFileSync(__dirname + '/../' + f, 'utf8');
const MONS = { sporeCap: 'spore', webSpinner: 'web', rockApe: 'ape', stoneScorpion: 'scorp', wisp: 'wisp', snowOwl: 'owl' };
for (const k of Object.keys(MONS)) test('monster ' + k + ' is wired everywhere', () => {
  const tb = read('js/town-battle.js'), m = tb.match(new RegExp('\\n\\s+' + k + ': \\{[^\\n]*img: \'([^\']+)\''));
  assert.ok(m, 'MON entry'); assert.ok(fs.existsSync(__dirname + '/../assets/enemies/' + m[1] + '.webp'), 'sprite ' + m[1]);
  assert.ok(new RegExp("MON_STATUS = \\{[^\\n]*" + k + ': \\[').test(read('js/flat-battle.js')), 'status');
  assert.ok(new RegExp("'" + k + "'").test(read('js/world-gen.js')), 'FOES'); assert.ok(new RegExp(k + ": \\['").test(read('js/world-map.js')), 'DROPS');
  const maya = AD.MAYA_OF[k]; assert.ok(maya && AD.GOODS[maya]?.maya, 'maya goods'); const d = read('js/world-map.js').match(new RegExp(k + ": \\['(\\w+)'\\]")); assert.ok(d && AD.GOODS[d[1]], 'drop goods ' + (d && d[1])) });
console.log(n + ' ok');

/* v97.72 · the Kingdom of Aldren: the capital and four villages (js/settlements.js · js/world-gen.js · js/town-services.js) */
const assert = require('node:assert/strict');
const g = { day: 1, village: { coins: 100, story: { mode: 'active' }, character: { job: 'mage', jobs: { mage: { lv: 1, jp: 0 } } } } };
globalThis.WorldState = { game: () => g, commit: () => { }, world: () => null };
globalThis.window = globalThis; require('../js/world-norchorthal.js');
globalThis.Progression = require('../js/progression.js'); const F = require('../js/factions.js'); const ST = require('../js/settlements.js'); const O = require('../js/offices.js');
const G = require('../js/world-gen.js'); const TS = require('../js/town-services.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ }, eq = (a, b, m) => { assert.equal(a, b, m); n++ };
const NEW = ['lakenhold', 'willowshore', 'deepcairn', 'thornwatch', 'vinehollow'];
for (const id of NEW) { const T = ST.SETTLEMENTS[id]; ok(T && T.text && T.cheap.length && ST.LOCALS[id]?.length >= 2, id + ' has data and people'); ok(F.FACTIONS[T.ruler], id + ' ruler is a faction') }
ok(ST.SETTLEMENTS.lakenhold.capital && ST.SETTLEMENTS.lakenhold.size === 'city', 'Lakenhold is the capital'); ok(F.FACTIONS.crown, 'the crown is a faction');
for (const k of ['dye', 'crystal', 'wine']) ok(ST.TRADE[k] && ST.GOODS[k], k + ' is a trade good');
/* names: no element names (Kaelam) in any settlement name */
const ELEM = ['Elu', 'Lutha', 'Fren', 'Grat', 'Caelim', 'Sylfae', 'Nytha', 'Dephor', 'Yalm', 'ไฟ', 'น้ำแข็ง', 'แสง', 'ลม', 'ดิน', 'มืด'];
for (const id of NEW) ok(!ELEM.some(e => ST.SETTLEMENTS[id].name.includes(e)), id + ' name avoids element words');
/* the real map: every town placed and reachable from Fernvale, the old three where they were */
const w = G.generate(12345);
for (const id of [...NEW, 'brookmere', 'haven', 'northgate']) { const t = w.towns.find(x => x.id === id); ok(t && G.path(w, w.home, t), id + ' placed and reachable') }
eq(w.towns.find(x => x.id === 'lakenhold').icon, 'city');
/* the capital opens after the prologue */
eq(TS.capitalOpen(), false, 'closed during the prologue'); ok(TS.list({ gold: 50 }, 'willowshore')[0].disabled, 'no ferry to a closed capital');
g.village.story.mode = 'done'; eq(TS.capitalOpen(), true);
/* services */
const S = { gold: 100, hp: 10, maxHp: 60, fatigue: 50, cargo: {} };
let r = TS.run(S, 'willowshore', 'ferry', {}); eq(r.goto, 'lakenhold'); eq(S.gold, 90);
r = TS.run(S, 'deepcairn', 'mine', { rng: () => .1 }); eq(S.cargo.ore, 2); eq(S.cargo.crystal, 1, 'a lucky shift finds a crystal'); eq(S.gold, 102);
eq(TS.list(S, 'deepcairn')[0].disabled, true, 'one shift a day');
r = TS.run(S, 'lakenhold', 'museum', {}); ok(!S.cargo.crystal && S.gold > 102, 'the museum buys the crystal');
S.gold = 100; r = TS.run(S, 'lakenhold', 'tower', { game: () => g }); eq(g.village.character.jobs.mage.jp, 20, 'a lesson in the tower: +20 job points');
r = TS.run(S, 'vinehollow', 'spring', { healParty: () => { } }); eq(S.hp, 60); eq(S.fatigue, 0);
/* the royal guard ladder at Lakenhold ends at the grand general */
eq(O.OFFICES.royal.town, 'lakenhold'); eq(O.OFFICES.royal.ranks.at(-1)[0], 'แม่ทัพใหญ่แห่งอัลเดรน');
console.log('kingdom: ' + n + ' checks passed');

/* v98.295 · injuries (js/injury.js): rolls, heavy-wound rules, hospital healing by growing percentage, leader order */
const assert = require('node:assert/strict');
globalThis.window = globalThis; require('../js/settlements.js'); const I = require('../js/injury.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ }, eq = (a, b, m) => { assert.equal(a, b, m); n++ };
const seq = (...v) => { let i = 0; return () => v[Math.min(i++, v.length - 1)] };
const mk = () => ({ day: 1, village: { coins: 500 } });

/* a knock-down: .01 → hurt · part roll · heavy roll */
let g = mk(); let w = I.roll(g, 'hero', { rng: seq(.01, .9, .01) });   /* part .9×9 → leg (weights head1 torso3 arm2 hand1 leg2: .9×9=8.1 → leg) */
ok(w && w.part === 'leg' && w.lv === 'heavy', 'rolled a heavy leg wound'); eq(I.canLead(g, 'hero'), false, 'a heavy wound stops manual control');
eq(I.canFight(g, 'hero'), false, 'heavy leg: cannot fight'); eq(I.canWork(g, 'hero'), true, 'heavy leg: can still work (farm / craft)'); eq(I.canTravel(g, 'hero'), false, 'heavy leg: cannot travel');
eq(I.roll(mk(), 'x', { rng: () => .99 }), null, 'most falls do not hurt');
eq(I.roll(mk(), 'x', { rng: seq(.2), protect: 1 }), null, 'full protection never hurts');
g = mk(); I.roll(g, 'sib', { rng: seq(.01, .0, .99) }); eq(I.parts(g, 'sib').head.lv, 'light', 'a light head wound'); eq(I.canFight(g, 'sib'), true, 'light wounds forbid nothing');
I.roll(g, 'sib', { rng: seq(.01, .0, .99) }); eq(I.parts(g, 'sib').head.lv, 'heavy', 'hurt again on the same part → heavy');
/* rules are data: each part has its own forbids */
ok(I.RULES.hand.work === 1 && I.RULES.hand.fight === 0, 'hand: work yes, fight no');

/* healing chance grows day by day; a heavy wound does not heal without a bed */
ok(I.chance('heavy', 0) < I.chance('heavy', 5) && I.chance('heavy', 5) < I.chance('heavy', 30), 'chance grows'); eq(I.chance('heavy', 0), .10, 'day 1 = 10 %'); eq(I.chance('heavy', 99), .85, 'capped at 85 %');
g = mk(); g.injuries = { hero: { parts: { arm: { lv: 'heavy', days: 0 } }, bed: null }, _day: 1 }; g.day = 6;
I.sync(g, { rng: () => 0 }); ok(g.injuries.hero.parts.arm.lv === 'heavy', 'no bed → a heavy wound stays heavy even on a lucky roll');
/* in a bed: heavy → light → healed, paying per day */
const a = I.admit(g, 'hero', 'lakenhold'); ok(a.ok && a.cost === 35, 'the capital costs 35 a day'); const coins0 = g.village.coins;
g.day = 7; I.sync(g, { rng: () => 0 }); eq(g.injuries.hero.parts.arm.lv, 'light', 'a lucky day in the hospital: heavy → light'); eq(g.village.coins, coins0 - 35, 'one day paid');
eq(g.injuries.hero.bed, null, 'nothing heavy left → out of the bed');
g.day = 8; I.sync(g, { rng: () => 0 }); eq(g.injuries.hero, undefined, 'a light wound heals by itself'); eq(I.hurt(g, 'hero'), false, 'healthy again');
/* a big town heals more often than a village (quality), and the sure-day */
ok(I.chance('heavy', 3, { q: I.quality('lakenhold').q }) > I.chance('heavy', 3, { q: I.quality('fernvale').q }), 'bigger town → higher chance');
g = mk(); g.injuries = { hero: { parts: { torso: { lv: 'heavy', days: 13 } }, bed: 'fernvale' }, _day: 1 }; g.day = 2; I.sync(g, { rng: () => .999 }); eq(g.injuries.hero.parts.torso.lv, 'light', 'day 14 in a bed always heals');
/* cannot pay → discharged, no healing */
g = mk(); g.village.coins = 5; g.injuries = { hero: { parts: { torso: { lv: 'heavy', days: 0 } }, bed: 'lakenhold' }, _day: 1 }; g.day = 2; I.sync(g, { rng: () => 0 }); eq(g.injuries.hero.bed, null, 'no money → out of the bed'); eq(g.injuries.hero.parts.torso.lv, 'heavy', 'and still heavy');
/* visiting */
g = mk(); I.roll(g, 'sib', { rng: seq(.01, .4, .01) }); I.admit(g, 'sib', 'fernvale'); const v1 = I.visit(g, 'sib', 1); ok(v1.ok && v1.rel === 1, 'a visit adds relationship'); eq(I.visit(g, 'sib', 1).ok, false, 'one visit a day');
/* the line-up */
g = mk(); g.injuries = { hero: { parts: { arm: { lv: 'heavy' } } }, sib: { parts: { leg: { lv: 'heavy' } } } };
eq(I.leader(g, ['hero', 'sib', 'bram', 'luna']), 'bram', 'both heroes heavy → the next friend leads'); eq(I.talkAllowed('bram'), false, 'a friend cannot talk / do quests'); eq(I.talkAllowed('sib'), true, 'the other hero can');
eq(I.leader({ injuries: {} }, ['hero', 'sib']), 'hero', 'healthy: the chosen hero leads'); eq(I.describe(g, 'hero'), 'แขน (หนัก)', 'a readable line');
g = mk(); I.force(g, 'kier', 'leg'); eq(I.canFight(g, 'kier'), false, 'a scripted heavy leg wound stops fighting'); eq(I.canTravel(g, 'kier'), false, 'and travelling'); eq(I.admit(g, 'kier', 'fernvale').ok, true, 'the scripted wound can be admitted to the village hospital');
console.log('injury: ' + n + ' checks passed');

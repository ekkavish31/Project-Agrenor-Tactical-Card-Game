/* v98.296 · farm crew (js/farm-crew.js + the hooks in js/garden.js tick): manpower ÷ workload, wages, who is available */
const assert = require('node:assert/strict');
globalThis.window = globalThis; const FC = require('../js/farm-crew.js'); const I = require('../js/injury.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ }, eq = (a, b, m) => { assert.equal(a, b, m); n++ };
const g = () => ({ day: 1, village: { coins: 100, party: [{ key: 'sib' }, { key: 'kier' }], bench: [{ key: 'ren', name: 'เรน' }] } });
const farm = () => ({ plots: [{ crop: 'lettuce' }, { crop: 'carrot' }, null, { crop: 'wheat' }], animals: [{ kind: 'cow' }, { kind: 'chicken' }, { kind: 'goat' }], crew: [] });
let G = farm(); eq(FC.workload(G), 3 + 1 + .25 + .5, 'workload = planted plots + animals by kind');
eq(FC.dayFactor(G, g()), null, 'no crew → null (the hero does it by hand)');
const w0 = FC.wage('hilda', 'ชาวนา'), w1 = FC.wage('pim', 'เด็กในหมู่บ้าน'); ok(w0 > w1, 'a farmer asks more than a child-minded trade (skill)'); ok(FC.skill('hilda', 'ชาวนา') > FC.skill('tom', 'ช่างไม้'), 'farmer skill > carpenter');
/* the mother only: 0.8 hands for 4.75 workload */
FC.add(G, { id: 'mother', kind: 'mother' }); let f = FC.dayFactor(G, g()); ok(Math.abs(f - .8 / 4.75) < .01, 'proportional: ' + f);
eq(FC.add(G, { id: 'mother', kind: 'mother' }), 'อยู่ในทีมดูแลแล้ว', 'one person, one job');
/* a friend travelling with the hero is not available; a bench friend is */
const gg = g(); FC.add(G, { id: 'kier', kind: 'friend' }); FC.add(G, { id: 'ren', kind: 'friend' });
const man = FC.manpower(G, gg); ok(Math.abs(man - (FC.skill('mother') + FC.skill('ren'))) < .01, 'kier (in the travelling party) does not count'); 
/* a hired hand is paid; no money → no work */
G = farm(); FC.add(G, { id: 'hilda', kind: 'hired', role: 'ชาวนา' }); const g2 = g(); const c0 = g2.village.coins; f = FC.dayFactor(G, g2); eq(g2.village.coins, c0 - FC.wage('hilda', 'ชาวนา'), 'wage paid'); ok(f > 0, 'works');
const g3 = g(); g3.village.coins = 0; eq(FC.dayFactor(G, g3), 0, 'no money → the hired hand stays home');
/* wounds */
const g4 = g(); g4.injuries = { ren: { parts: { arm: { lv: 'heavy' } } } }; G = farm(); FC.add(G, { id: 'ren', kind: 'friend' }); eq(FC.dayFactor(G, g4), 0, 'a heavy arm wound: cannot work');
g4.injuries = { ren: { parts: { hand: { lv: 'light' } } } }; ok(Math.abs(FC.manpower(G, g4) - FC.skill('ren') * .7) < .01, 'a light hand wound: ×0.7');
/* enough hands → capped at 1 */
G = farm(); for (const id of ['hilda', 'shep', 'ken', 'tom', 'joe', 'may']) FC.add(G, { id, kind: 'hired', role: 'ชาวนา' }); eq(FC.dayFactor(G, g()), 1, 'enough hands = 100 %');
/* integration with Garden.tick: a crew waters, harvests and scales produce */
globalThis.WorldState = { game: () => gg2, commit: () => { } }; const gg2 = { day: 10, village: { coins: 500, materials: {}, party: [], bench: [] } };
const Gd = require('../js/garden.js'); const hold = { id: 't' }; const GA = Gd.of ? Gd.of(hold) : null;
if (GA) { GA.plots[0] = { crop: 'lettuce', g: 0, dry: 0, w: 0 }; GA.last = 10; GA.crew = [{ id: 'hilda', kind: 'hired', role: 'ชาวนา', skill: 3, wage: 5 }]; gg2.day = 14; Gd.tick(GA, 14); ok(GA.plots[0] === null || GA.plots[0].ripe || GA.plots[0].g > 0, 'the crew tended the plot (it grew without a single watering by hand)'); eq(gg2.village.coins, 500 - 5 * 4, 'four days of wages'); }
console.log('farm-crew: ' + n + ' checks passed');

/* v97.75 · L5 the vegetable garden: seasons, watering and rain, drying out, crows, quality, regrowth, the basket, upgrades */
const assert = require('node:assert/strict');
const g = { day: 1, village: { coins: 500, materials: {} } };
globalThis.WorldState = { game: () => g, commit: () => { } };
globalThis.Factions = require('../js/factions.js'); const Gd = require('../js/garden.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ }, eq = (a, b, m) => { assert.equal(a, b, m); n++ };
eq(Gd.season(1)[0], 'spring'); eq(Gd.season(29)[0], 'summer'); eq(Gd.season(85)[0], 'winter'); eq(Gd.season(113)[0], 'spring', 'the year turns');
const G = Gd.store(); eq(G.plots.length, 6, 'six plots to start');
/* a dry stretch for the test: find a day from which 6 days have no rain */
let d0 = 1; while ([0, 1, 2, 3, 4, 5].some(k => Gd.rain(d0 + k)) || Gd.season(d0)[0] !== 'spring' || Gd.season(d0 + 6)[0] !== 'spring') d0++;
g.day = d0; G.last = d0;
eq(Gd.plant(0, 'tomato'), 'มะเขือเทศไม่ขึ้นในฤดูใบไม้ผลิ', 'out of season'); eq(Gd.plant(0, 'lettuce'), ''); eq(g.village.coins, 496, 'seeds cost');
ok(Gd.plant(0, 'carrot'), 'one crop a plot'); eq(Gd.plant(1, 'lettuce'), ''); G.have.scarecrow = true;
/* water plot 0 every day, never plot 1 */
for (let k = 0; k < 3; k++) { Gd.water(0); g.day++; Gd.tick() }
ok(G.plots[0].ripe, 'lettuce ripe after 3 wet days'); ok(G.plots[1].dead, 'three dry days: withered');
eq(Gd.stars(G.plots[0]), 2, 'never dry: ★2'); eq(Gd.harvest(0), 3, 'yield 2 + 1 for the stars'); eq(G.plots[0], null);
ok(Gd.clear(1)); eq(G.plots[1], null);
/* fertiliser + perfect = ★3 · regrowth */
g.day = 1; while (Gd.season(g.day)[0] !== 'spring' || Gd.rain(g.day)) g.day++; G.last = g.day;
eq(Gd.plant(2, 'strawberry'), ''); eq(Gd.fertilise(2), ''); for (let k = 0; k < 5; k++) { Gd.water(2); g.day++; Gd.tick() }
ok(G.plots[2].ripe); eq(Gd.stars(G.plots[2]), 3); eq(Gd.harvest(2), 4); ok(G.plots[2] && !G.plots[2].ripe, 'strawberries grow again');
/* rain waters for you */
let rd = 1; while (!Gd.rain(rd)) rd++; g.day = rd; G.last = rd; G.plots[3] = { crop: 'herb', g: 0, dry: 0, w: 0, fert: false, perfect: true }; g.day = rd + 1; Gd.tick(); eq(G.plots[3].g, 1, 'a rainy day counts as watered');
/* crows without a scarecrow (deterministic over many seedlings) */
G.have.scarecrow = false; let lost = 0; for (let t = 0; t < 60; t++) { G.plots[4] = { crop: 'herb', g: 0, dry: 0, w: 1000 + t, fert: false, perfect: true }; G.last = 1000 + t; g.day = 1001 + t; Gd.tick(); if (!G.plots[4]) lost++ } ok(lost > 0 && lost < 20, 'crows take a few seedlings (' + lost + '/60)');
/* basket */
const coins = g.village.coins; G.basket = { carrot: 2, pumpkin: 1 }; eq(Gd.cook(), 6, 'carrots 2 + pumpkin 4 rations'); eq(g.village.materials.food, 6);
G.basket = { pumpkin: 2 }; eq(Gd.sell(), 68); eq(g.village.coins, coins + 68);
/* upgrades */
eq(Gd.upgrade('size'), ''); eq(G.plots.length, 9); eq(Gd.upgrade('channel'), ''); G.last = g.day; G.plots[5] = { crop: 'herb', g: 0, dry: 0, w: 0, fert: false, perfect: true }; g.day++; Gd.tick(); eq(G.plots[5].g, 1, 'the water channel waters every day');
eq(Gd.upgrade('compost'), ''); G.fert = 0; G.last = g.day; g.day += 4; Gd.tick(); ok(G.fert >= 1, 'compost makes fertiliser');
console.log('garden: ' + n + ' checks passed');

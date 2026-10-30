/* v97.75 · L5 the vegetable garden: seasons, watering and rain, drying out, crows, quality, regrowth, the basket, upgrades
   v97.77 · gardens live on farm plots, and farms only where there is farmland (villages with fields, open land) */
const assert = require('node:assert/strict');
const g = { day: 1, village: { coins: 2000, materials: {} } };
globalThis.WorldState = { game: () => g, commit: () => { } };
globalThis.Factions = require('../js/factions.js'); globalThis.Settlements = require('../js/settlements.js'); const Gd = require('../js/garden.js'); const E = require('../js/estates.js');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ }, eq = (a, b, m) => { assert.equal(a, b, m); n++ };
eq(Gd.season(1)[0], 'spring'); eq(Gd.season(29)[0], 'summer'); eq(Gd.season(85)[0], 'winter'); eq(Gd.season(113)[0], 'spring', 'the year turns');
/* farmland: not in the capital, yes in Fernvale and on open land */
const W = { day: 1 }; Object.defineProperty(W, 'gold', { get: () => g.village.coins, set: v => { g.village.coins = v } });
let r = E.claim(W, 'town:lakenhold', 'นครหลวง'); ok(r.ok); ok(/ไม่มีที่ให้ทำไร่/.test(E.build(W, r.plot.id, 'farm').why), 'no farm in the capital'); ok(E.build(W, r.plot.id, 'house').ok, 'a house is fine there');
r = E.claim(W, 'town:fernvale', 'เฟิร์นเวล'); ok(E.build(W, r.plot.id, 'farm').ok, 'Fernvale has fields'); const wild = E.claim(W, 'tile:3,4', 'กลางป่า'); ok(E.build(W, wild.plot.id, 'farm').ok, 'open land is fine');
g.village.coins = 500;
const G = Gd.of(r.plot); eq(G.plots.length, Gd.FN, 'a field of FW×FH tiles'); eq(G.ground.filter(k => k === 'soil').length, 6, 'six tiles tilled to start'); ok(Gd.fieldCount(G).debris > 15, 'the rest is overgrown'); eq(Gd.of(r.plot), G, 'one garden per farm');
/* v97.83 · clearing and tilling */
const rockAt = G.ground.indexOf('rock'), grassAt = G.ground.indexOf('grass'); g.village.materials = {}; g.fatigue = 0;
ok(/ไถดิน/.test(Gd.plant(G, rockAt, 'lettuce')), 'no planting on rocks'); eq(Gd.clearTile(G, rockAt), ''); eq(G.ground[rockAt], 'grass'); eq(g.village.materials.stone, 1, 'a rock gives stone'); eq(g.fatigue, 3, 'clearing tires you');
eq(Gd.till(G, rockAt), ''); eq(G.ground[rockAt], 'soil'); ok(/ไถแล้ว/.test(Gd.till(G, rockAt)));
g.fatigue = 99; const stump = G.ground.indexOf('stump'); ok(/เหนื่อย/.test(Gd.clearTile(G, stump)), 'too tired to chop a stump'); g.fatigue = 0;
let wd = 0; const before = G.ground.filter(k => k === 'grass').length; G.last = 1; g.day = 120; Gd.tick(G); ok(G.ground.filter(k => k === 'grass').length < before, 'weeds creep back onto grass'); g.day = 1; G.last = 1;
/* an old 6-bed garden moves onto a field and keeps its crops */
const old = { id: 'oldfarm', garden: { plots: [{ crop: 'carrot', g: 2, dry: 0, w: 0, fert: false, perfect: true }, null, null, null, null, null], size: 6, last: 1, basket: {}, have: {}, fert: 0, compostDay: 1 } }; const OG = Gd.of(old); eq(OG.plots[0].crop, 'carrot'); eq(OG.ground[0], 'soil'); eq(OG.plots.length, Gd.FN);
/* a dry stretch for the test: find a day from which 6 days have no rain */
let d0 = 1; while ([0, 1, 2, 3, 4, 5].some(k => Gd.rain(d0 + k)) || Gd.season(d0)[0] !== 'spring' || Gd.season(d0 + 6)[0] !== 'spring') d0++;
g.day = d0; G.last = d0;
eq(Gd.plant(G, 0, 'tomato'), 'มะเขือเทศไม่ขึ้นในฤดูใบไม้ผลิ', 'out of season'); eq(Gd.plant(G, 0, 'lettuce'), ''); eq(g.village.coins, 496, 'seeds cost');
ok(Gd.plant(G, 0, 'carrot'), 'one crop a plot'); eq(Gd.plant(G, 1, 'lettuce'), ''); G.have.scarecrow = true;
/* water plot 0 every day, never plot 1 */
for (let k = 0; k < 3; k++) { Gd.water(G, 0); g.day++; Gd.tick(G) }
ok(G.plots[0].ripe, 'lettuce ripe after 3 wet days'); ok(G.plots[1].dead, 'three dry days: withered');
eq(Gd.stars(G.plots[0]), 2, 'never dry: ★2'); eq(Gd.harvest(G, 0), 3, 'yield 2 + 1 for the stars'); eq(G.plots[0], null);
ok(Gd.clear(G, 1)); eq(G.plots[1], null);
/* fertiliser + perfect = ★3 · regrowth */
g.day = 1; while (Gd.season(g.day)[0] !== 'spring' || Gd.rain(g.day)) g.day++; G.last = g.day;
eq(Gd.plant(G, 2, 'strawberry'), ''); eq(Gd.fertilise(G, 2), ''); for (let k = 0; k < 5; k++) { Gd.water(G, 2); g.day++; Gd.tick(G) }
ok(G.plots[2].ripe); eq(Gd.stars(G.plots[2]), 3); eq(Gd.harvest(G, 2), 4); ok(G.plots[2] && !G.plots[2].ripe, 'strawberries grow again');
/* rain waters for you */
let rd = 1; while (!Gd.rain(rd)) rd++; g.day = rd; G.last = rd; G.plots[3] = { crop: 'herb', g: 0, dry: 0, w: 0, fert: false, perfect: true }; g.day = rd + 1; Gd.tick(G); eq(G.plots[3].g, 1, 'a rainy day counts as watered');
/* crows without a scarecrow (deterministic over many seedlings) */
G.have.scarecrow = false; let lost = 0; for (let t = 0; t < 60; t++) { G.plots[4] = { crop: 'herb', g: 0, dry: 0, w: 1000 + t, fert: false, perfect: true }; G.last = 1000 + t; g.day = 1001 + t; Gd.tick(G); if (!G.plots[4]) lost++ } ok(lost > 0 && lost < 20, 'crows take a few seedlings (' + lost + '/60)');
/* basket */
const coins = g.village.coins; G.basket = { carrot: 2, pumpkin: 1 }; eq(Gd.cook(G), 6, 'carrots 2 + pumpkin 4 rations'); eq(g.village.materials.food, 6);
G.basket = { pumpkin: 2 }; eq(Gd.sell(G), 68); eq(g.village.coins, coins + 68);
/* upgrades */
ok(/ถาง/.test(Gd.upgrade(G, 'size')), 'no more bought plots: you clear the land'); eq(Gd.upgrade(G, 'channel'), ''); G.last = g.day; G.plots[5] = { crop: 'herb', g: 0, dry: 0, w: 0, fert: false, perfect: true }; g.day++; Gd.tick(G); eq(G.plots[5].g, 1, 'the water channel waters every day');
eq(Gd.upgrade(G, 'compost'), ''); G.fert = 0; G.last = g.day; g.day += 4; Gd.tick(G); ok(G.fert >= 1, 'compost makes fertiliser');
/* raiders trample about half the crops on open land */
const WG = Gd.of(wild.plot); for (let i = 0; i < 6; i++) WG.plots[i] = { crop: 'herb', g: 1, dry: 0, w: 0, fert: false, perfect: true }; let k = 0; const trod = Gd.trample(WG, () => (k++ % 2) / 2); eq(trod, 3, 'half trampled');
/* v97.81 · the pen */
g.village.coins = 1000; const P = Gd.of(r.plot); P.last = g.day; P.basket = {};
eq(Gd.buyAnimal(P, 'chicken'), ''); eq(Gd.buyAnimal(P, 'cow'), ''); eq(P.animals.length, 2);
g.day++; Gd.tick(P); eq(P.basket.egg || 0, 0, 'no hay: nothing'); ok(P.animals[0].hungry);
eq(Gd.buyHay(P), ''); eq(P.hay, 10); Gd.patAll(P); g.day++; Gd.tick(P); eq(P.basket.egg, 1, 'a fed hen lays'); eq(P.basket.milk, 2, 'a fed cow gives 2'); eq(P.hay, 8, 'one bundle each');
P.animals.forEach(a => a.mood = 9); g.day++; Gd.tick(P); eq(P.basket.egg, 3, 'a happy hen lays one more');
P.hay = 0; P.basket.wheat = 2; g.day++; Gd.tick(P); eq(P.basket.wheat || 0, 0, 'wheat from the basket feeds them when the hay runs out');
for (let k = 0; k < 2; k++) Gd.buyAnimal(P, 'chicken'); ok(/คอกเต็ม/.test(Gd.buyAnimal(P, 'goat')), 'four to a pen'); eq(Gd.buildBarn(P), ''); eq(Gd.buyAnimal(P, 'goat'), '', 'a barn holds more');
let st = 0; const stolen = Gd.steal(P, () => (st++ ? .1 : .2)); ok(stolen && P.animals.length === 4, 'raiders may drive one off');
/* produce into the bag, known to the shop as goods */
globalThis.ADVENTURE_DATA = { GOODS: {} }; Gd.registerGoods(); eq(ADVENTURE_DATA.GOODS.veg_egg.price, 5); g.village.bag = {};
const moved = Gd.toBag(P); ok(moved > 0 && g.village.bag.veg_egg >= 3 && !Object.keys(P.basket).length, 'basket into the bag');
/* the harvest contest */
let ad = 1; while (!Gd.contestOpen(ad)) ad++; eq(Gd.season(ad)[0], 'autumn'); g.day = ad;
const S2 = { gold: 0 }; P.best = { pumpkin: 3 };
ok(/ยังไม่มี/.test(Gd.contest(S2, [P], 'carrot').why), 'only what you grew'); const res = Gd.contest(S2, [P], 'pumpkin', () => .99);
eq(res.place, 1, 'a ★3 pumpkin wins'); eq(S2.gold, 120); ok(/แล้ว/.test(Gd.contest(S2, [P], 'pumpkin').why), 'once a year');
g.day = ad - 30; ok(/ช่วง/.test(Gd.contest({}, [P], 'pumpkin').why), 'only in the last week of autumn');
console.log('garden: ' + n + ' checks passed');

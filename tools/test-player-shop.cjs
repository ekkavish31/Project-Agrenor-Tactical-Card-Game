// v94.05 · F1 ร้านของเรา — core rules of js/player-shop.js (shelf, prices, customers, time away, rival, likes).
const path = require('path');
const S = require(path.join(__dirname, '..', 'js', 'player-shop.js'));
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL', m) } };
const seq = arr => { let i = 0; return () => arr[i++ % arr.length] };
const OPT = { gearValue: x => 35 + (x.quality - 1) * 5, gearName: () => 'ดาบเหล็ก', bagDef: k => ({ herb: { name: 'สมุนไพรป่า', price: 10 }, wolfFang: { name: 'เขี้ยวหมาป่า', price: 12 } })[k] };
const game = () => ({ day: 1, minutes: 8 * 60, inventory: [{ id: 1, quality: 1 }, { id: 2, quality: 2 }], equipped: 2, village: { coins: 10, bag: { herb: 2 } } });
const P = {
  tom: { id: 'tom', name: 'ทอม', likes: 'สมุนไพรป่า, ขนมปัง', sched: [[8, 16, 'market']] },
  ann: { id: 'ann', name: 'แอน', likes: 'ดอกไม้', sched: [[20, 24, 'market']] },
  graven: { id: 'graven', name: 'เกรเวน', sched: [[9, 17, 'market']] }
};

// shelf
let g = game();
ok(S.placeGear(g, 2) === 'กำลังสวมใส่อยู่', 'equipped gear cannot be shelved');
ok(S.placeGear(g, 1) === '' && g.inventory.length === 1 && g.village.shop.slots[0].kind === 'gear', 'gear moves to slot 1');
ok(S.placeBag(g, 'herb') === '' && g.village.bag.herb === 1, 'bag item moves to the shelf');
ok(S.placeBag(g, 'wolfFang') !== '', 'missing bag item refused');
ok(S.setMult(g, 0, 5) === S.MAX && S.setMult(g, 0, 0.1) === S.MIN && S.setMult(g, 0, 1.25) === 1.3, 'price multiplier clamps to 0.6–2.0, step 0.1');
ok(S.priceOf(g.village.shop.slots[0], OPT) === Math.round(35 * 1.3), 'price = base × mult');
ok(S.takeBack(g, 1) && g.village.bag.herb === 2 && !g.village.shop.slots[1], 'take back returns to bag');
for (let i = 0; i < 6; i++) S.placeBag(g, 'herb');
ok(g.village.shop.slots.filter(Boolean).length === 3 && !g.village.bag.herb, 'cannot shelve more than you own');

// chance curve
ok(S.buyChance(1) > S.buyChance(1.5) && S.buyChance(1.5) > S.buyChance(2), 'higher price → lower chance');
ok(S.buyChance(0.6) <= 0.95 && S.buyChance(2) >= 0.03, 'chance bounded');
ok(S.likesItem(P.tom, 'สมุนไพรป่า') && !S.likesItem(P.ann, 'สมุนไพรป่า'), 'likes match by name');

// first check only starts the clock
g = game(); S.placeBag(g, 'herb'); S.placeBag(g, 'herb');
ok(S.simulate(g, { ...OPT, people: P, rng: () => 0 }).length === 0 && g.village.shop.last === 8, 'first simulate sets the clock without selling');
// one hour later, tom (at market 8–16) buys with rng 0; graven's rival check uses rng too (0 < RIVAL → goes to graven) — so test at 8:00–8:59 where graven is absent
g.minutes = 9 * 60 - 1; ok(S.simulate(g, { ...OPT, people: P, rng: () => 0 }).length === 0, 'no new hour → no sales');
g.day = 1; g.minutes = 8 * 60; g.village.shop.last = 7;
let sales = S.simulate(g, { ...OPT, people: P, rng: () => 0 });
ok(sales.length === 1 && sales[0].who === 'tom' && sales[0].liked && sales[0].price === 12, 'tom buys the herb he likes, pays +20%');
ok(g.village.coins === 22 && g.village.shop.sold === 1 && g.village.shop.news.length === 1 && g.village.shop.news[0].t === 24 + 8, 'coins, counter and news (Mind clock day*24+hour)');
ok(g.village.shop.log[0].day === 1 && g.village.shop.log[0].hour === 8, 'ledger records time');

// rival: at 10:00 graven is at the market; rng 0 sends the customer to him
g.minutes = 10 * 60; g.village.shop.last = 9;
ok(S.simulate(g, { ...OPT, people: P, rng: () => 0 }).length === 0, 'rival takes the customer');
ok(S.simulate.length >= 1, 'simulate signature');

// expensive item: rng 0.5 for the buy roll fails at ×2.0
g = game(); S.placeBag(g, 'herb'); S.setMult(g, 0, 2); g.village.shop.last = 7;
ok(S.simulate(g, { ...OPT, people: { tom: P.tom }, rng: seq([0, 0, 0.5]) }).length === 0, '×2.0 rarely sells');

// time away: 3 days on the world map, capped catch-up still sells
g = game(); S.placeBag(g, 'herb'); S.placeBag(g, 'herb'); S.simulate(g, { ...OPT, people: P });
g.day = 4; sales = S.simulate(g, { ...OPT, people: { tom: P.tom }, rng: () => 0 });
ok(sales.length === 2 && g.village.shop.last === S.hourOf(g), 'hours away are played back');
g = game(); S.placeBag(g, 'herb'); S.simulate(g, { ...OPT, people: P }); g.day = 40;
S.simulate(g, { ...OPT, people: { ann: P.ann }, rng: () => 0.99 });
ok(g.village.shop.last === S.hourOf(g), 'long absence capped, clock catches up');

// excluded (in the party) people do not shop
g = game(); S.placeBag(g, 'herb'); g.village.shop.last = 7;
ok(S.simulate(g, { ...OPT, people: { tom: P.tom }, excluded: new Set(['tom']), rng: () => 0 }).length === 0, 'party members do not shop');
// no roster → anonymous buyers in the daytime
g = game(); S.placeBag(g, 'herb'); g.village.shop.last = 9; g.minutes = 10 * 60;
ok(S.simulate(g, { ...OPT, rng: () => 0 }).length === 1, 'fallback buyers when no roster');
// old save without a shop
g = game(); delete g.village.shop; S.ensure(g.village); ok(g.village.shop.slots.length === 6, 'ensure creates 6 slots');

console.log(`player-shop: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

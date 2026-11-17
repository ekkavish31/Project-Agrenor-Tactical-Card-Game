/* v98.489 · node tools/test-story-world.cjs — ราคา/ข่าวตามสงคราม+ตอนจบ (js/story-world.js + ตะขอใน js/settlements.js) */
const path = require('path'); global.window = global; const J = f => path.join(__dirname, '..', 'js', f);
const T = require(J('titles.js')), M = require(J('main-story.js')); global.Titles = T; global.MainStory = M;
const W = require(J('story-world.js')); const ST = require(J('settlements.js')); global.Factions = { add() {}, priceMult: () => 1 };
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++ ; console.log('FAIL', m) } };
let G = null; global.WorldState = { game: () => G, world: () => null };
const game = (st) => { const g = { day: 9, village: { character: { level: 1 }, story: { mode: 'done' } } }; if (st) M.advanceTo(g, st, { silent: true }); return g };
// ก่อนสงครามราคาไม่ขยับ
{ G = game(); ok(W.mult('northgate', 'iron') === 1 && W.mult('haven', 'food') === 1, 'no story effect at the start'); ok(G.village.main === undefined, 'reading creates no save block') }
{ G = game('free'); ok(W.mult('northgate', 'iron') === 1, 'rumours (war 1) do not move prices') }
// สงครามค่อย ๆ แพงขึ้น · เมืองหน้าด่านแพงกว่า
{ G = game('signs'); const a = W.mult('haven', 'iron'); ok(a > 1 && a <= 1.15, 'war 2: iron up ~10% (' + a + ')'); G = game('release'); const b = W.mult('haven', 'iron'), c = W.mult('northgate', 'iron'); ok(b > a && c > b, 'war 3: more, and the front costs more (' + b + ',' + c + ')');
  G = game('mine'); ok(W.mult('northgate', 'iron') >= 1.3 && W.mult('northgate', 'iron') <= 1.5, 'war 4 stays within the cap'); ok(W.mult('haven', 'inn') === 1, 'the inn is untouched'); ok(W.mult('lakenhold', 'crystal') > W.mult('haven', 'crystal'), 'the capital hoards crystal') }
// เมืองที่ติดเชื้อหนัก อาหารขาด
{ G = game('mine'); ok(W.mult('deepcairn', 'food') > W.mult('brookmere', 'food'), 'infected towns lack food') }
// หลังจบ
for (const [e, f] of [['third', 'easing'], ['light', 'strict'], ['shadow', 'blackmarket'], ['aldren', 'high']]) { G = game('end'); M.set(G, 'ending', e); M.set(G, 'afterWorld', f); const m = W.mult('northgate', 'iron'); ok(m >= .85 && m <= 1.5, e + ': multiplier in range (' + m + ')') }
{ G = game('end'); M.set(G, 'afterWorld', 'high'); const hi = W.mult('lakenhold', 'food'); G = game('end'); M.set(G, 'afterWorld', 'easing'); ok(W.mult('lakenhold', 'food') < hi, 'the third path eases prices below the "Aldren won" aftermath'); ok(W.mult('lakenhold', 'food') < 1, 'easing: cheaper than normal'); G = game('end'); M.set(G, 'afterWorld', 'blackmarket'); ok(W.mult('haven', 'crystal') > 1 && W.mult('haven', 'iron') < W.mult('northgate', 'iron'), 'black market: crystal dear, Haven discounts') }
// ต่อเข้า Settlements: ราคาจริงเปลี่ยน + ข่าว
{ G = game('free'); const p0 = ST.buyPrice('northgate', 'iron'); G = game('mine'); const p1 = ST.buyPrice('northgate', 'iron'); ok(p1 > p0, 'Settlements.buyPrice rises with the war (' + p0 + ' → ' + p1 + ')'); ok(ST.sellPrice('northgate', 'iron') >= 1, 'sell price still valid');
  const L = W.describe(G, 'northgate'); ok(L.length >= 1 && L.every(x => /แพง|ถูก/.test(x)), 'news lines describe the moves'); G = game('free'); ok(W.describe(G, 'northgate').length === 0, 'no price news before the war') }
console.log(`${pass} ok · ${fail} fail`); process.exit(fail ? 1 : 0);

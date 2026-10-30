/* v97.75 · L5 vegetable plots (docs/TODO.md "L5 ชาวไร่" · the real system the prologue's pumpkin chore stands in for, S1).
   v97.77 · the user's rule: you only grow food where there is land for it — on a 🌾 farm you built on your own plot (js/estates.js),
   in a village with farmland (Settlements.farmland) or out on open land. Each farm keeps its own garden (plot.garden), tended on the spot.
   Seasons: 28 days each (spring · summer · autumn · winter), counted from day 1 · the weather of a day is seeded (rain waters every plot).
   A plot: plant a seed in season (bought from Hilda's stock) → water it every day (or let the rain) → it grows a day per wet day
   (half a day once its season has passed) → ripe → harvest. Three dry days in a row and it withers. Crows may peck a seedling
   unless there is a scarecrow. Fertiliser and never missing a day raise the quality (★1–3): more crops at harvest.
   Some crops grow again after a harvest (tomato, strawberry).
   Produce waits in the basket: cook it into rations, or sell it to the market. Upgrades: more plots, scarecrow, compost heap, water channel.
   Stored on the farm plot in the world save: plot.garden = { plots: [...], size, last, basket: { crop: n }, have: { scarecrow, compost, channel }, fert, compostDay }.
   Every function takes that garden object first (of(plot) makes it). */
(function (root) {
  'use strict';
  const SEASONS = [['spring', 'ฤดูใบไม้ผลิ', '🌸'], ['summer', 'ฤดูร้อน', '☀'], ['autumn', 'ฤดูใบไม้ร่วง', '🍂'], ['winter', 'ฤดูหนาว', '❄']];
  const CROPS = {
    lettuce: { name: 'ผักกาด', icon: '🥬', days: 3, seasons: ['spring', 'autumn'], seed: 4, yield: 2, sell: 6, food: 1 },
    carrot: { name: 'แครอท', icon: '🥕', days: 4, seasons: ['spring', 'autumn', 'winter'], seed: 5, yield: 2, sell: 8, food: 1 },
    potato: { name: 'มันฝรั่ง', icon: '🥔', days: 5, seasons: ['spring', 'summer', 'autumn'], seed: 6, yield: 3, sell: 6, food: 1 },
    wheat: { name: 'ข้าวสาลี', icon: '🌾', days: 6, seasons: ['spring', 'summer', 'autumn'], seed: 4, yield: 3, sell: 5, food: 1 },
    tomato: { name: 'มะเขือเทศ', icon: '🍅', days: 5, seasons: ['summer'], seed: 8, yield: 3, sell: 8, food: 1, regrow: 3 },
    strawberry: { name: 'สตรอว์เบอร์รี', icon: '🍓', days: 5, seasons: ['spring'], seed: 10, yield: 2, sell: 13, food: 1, regrow: 3 },
    pumpkin: { name: 'ฟักทอง', icon: '🎃', days: 7, seasons: ['summer', 'autumn'], seed: 12, yield: 1, sell: 34, food: 4 },
    herb: { name: 'สมุนไพร', icon: '🌿', days: 4, seasons: ['spring', 'summer', 'autumn', 'winter'], seed: 6, yield: 2, sell: 7, food: 0 },
    cabbage: { name: 'กะหล่ำหิมะ', icon: '🥦', days: 6, seasons: ['autumn', 'winter'], seed: 7, yield: 2, sell: 11, food: 1 }
  };
  /* v97.81 · the pen: animals bought for the farm eat a bundle of hay a day (taken from the stock, or wheat from the basket) and give their
     product to the basket; a well-kept animal (mood 7+) gives one more. Unfed: no product, mood −2. A daily pat: mood +1. */
  const ANIMALS = {
    chicken: { name: 'ไก่', icon: '🐔', cost: 30, product: 'egg', every: 1, n: 1 },
    goat: { name: 'แพะ', icon: '🐐', cost: 80, product: 'goatmilk', every: 1, n: 1 },
    sheep: { name: 'แกะ', icon: '🐑', cost: 100, product: 'wool', every: 3, n: 2 },
    cow: { name: 'วัว', icon: '🐄', cost: 180, product: 'milk', every: 1, n: 2 }
  };
  const PRODUCTS = { egg: { name: 'ไข่ไก่', icon: '🥚', sell: 5, food: 1 }, goatmilk: { name: 'นมแพะ', icon: '🥛', sell: 9, food: 1 }, milk: { name: 'นมวัว', icon: '🍶', sell: 8, food: 1 }, wool: { name: 'ขนแกะ', icon: '🧶', sell: 14, food: 0 } };
  const GOODS = { ...CROPS, ...PRODUCTS };   /* everything that can sit in the basket */
  const PEN = [4, 8], BARN_COST = 200, HAY = { n: 10, cost: 15 };
  const SIZES = [6, 9, 12], SIZE_COST = [0, 120, 220];   /* before v97.83 · kept for old saves */
  /* v97.83 · the field (the user: a farm laid out like the old farming games before you build it up): FW × FH tiles that start
     overgrown — weeds, branches, rocks and stumps to clear (fatigue; wood and stone for the village), then till, then plant.
     Ground per tile: G.ground[i] = 'weed' | 'branch' | 'rock' | 'stump' | 'grass' | 'soil'; crops stay in G.plots[i] (null = none).
     Weeds creep back onto untilled grass; tilled soil stays tilled after a harvest. */
  const FW = 10, FH = 7, FN = FW * FH;
  const DEBRIS = { weed: { name: 'วัชพืช', icon: '🌿', fat: 1, verb: 'ถอน' }, branch: { name: 'กิ่งไม้', icon: '🪵', fat: 2, give: ['wood', 1], verb: 'เก็บ' }, rock: { name: 'ก้อนหิน', icon: '🪨', fat: 3, give: ['stone', 1], verb: 'ทุบ' }, stump: { name: 'ตอไม้', icon: '🪵', fat: 6, give: ['wood', 3], verb: 'ตัด' } };
  const TILL_FAT = 1, TIRED = 95;
  function genGround(seed) { const out = []; for (let i = 0; i < FN; i++) { const h = hash('field:' + seed + ':' + i); out.push(i < 6 ? 'soil' : h < .2 ? 'weed' : h < .3 ? 'branch' : h < .4 ? 'rock' : h < .46 ? 'stump' : 'grass') } return out }
  const ITEMS = { scarecrow: { name: 'หุ่นไล่กา', icon: '🧑‍🌾', cost: 40, text: 'กาไม่จิกต้นกล้า' }, compost: { name: 'กองปุ๋ยหมัก', icon: '🟫', cost: 60, text: 'ได้ปุ๋ยฟรี 1 ถุงทุก 3 วัน' }, channel: { name: 'รางน้ำจากลำธาร', icon: '🚿', cost: 250, text: 'รดน้ำให้ทุกแปลงทุกวัน' } };
  const FERT_COST = 5;
  const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296 };   /* v97.83 · a full final mix (the old one clustered: fields came out all stumps, rain was uneven) */
  const season = d => SEASONS[Math.floor((Math.max(1, d) - 1) / 28) % 4];   /* same calendar as WorldState.season */
  const seasonDay = d => (Math.max(1, d) - 1) % 28 + 1;
  const RAIN = { spring: .35, summer: .2, autumn: .3, winter: .12 };
  const rain = d => hash('rain:' + d) < RAIN[season(d)[0]];
  const game = () => (typeof s !== 'undefined' && s?.village ? s : root.WorldState?.game?.()) || null;
  const today = () => game()?.day || 1;
  /* the garden of a farm plot (made on first use) */
  function of(holder) {
    const d = today(); const G = holder.garden ||= { plots: [], size: 6, last: d, basket: {}, have: {}, fert: 0, compostDay: d }; G.animals ||= []; G.hay ??= 0; G.best ||= {};
    if (!Array.isArray(G.ground) || G.ground.length !== FN) {   /* v97.83 · a new field, or an older garden moved onto one (its beds keep their crops) */
      G.ground = genGround(holder.id || 'farm'); const old = G.plots || []; G.plots = Array(FN).fill(null); old.forEach((p, i) => { if (i < FN) { G.plots[i] = p || null; if (p || i < (G.size || 6)) G.ground[i] = 'soil' } });
    }
    while (G.plots.length < FN) G.plots.push(null); return G;
  }
  const commit = () => { try { if (typeof save === 'function' && typeof s !== 'undefined') save(); else root.WorldState?.commit?.() } catch (e) { } };
  const stars = p => Math.min(3, 1 + (p.fert ? 1 : 0) + (p.perfect ? 1 : 0));
  /* run the finished days (last … today−1): growth, drying, crows, compost · returns log lines */
  function tick(G, now = today()) {
    if (!G) return []; const out = [];
    for (let d = G.last; d < now; d++) {
      const wet = rain(d) || !!G.have.channel, sz = season(d)[0];
      for (let i = 0; i < G.plots.length; i++) {
        const p = G.plots[i]; if (!p || p.dead || p.ripe) continue; const C = CROPS[p.crop];
        if (p.g < 1 && !G.have.scarecrow && hash('crow:' + d + ':' + i) < .08) { G.plots[i] = null; out.push('🐦 กาจิกต้นกล้า' + C.name + 'แปลงที่ ' + (i + 1) + ' หายไป'); continue }
        if (wet || p.w === d) { p.g += C.seasons.includes(sz) ? 1 : .5; p.dry = 0; if (p.g >= C.days) { p.ripe = true; out.push(C.icon + ' ' + C.name + 'แปลงที่ ' + (i + 1) + ' สุกแล้ว') } }
        else { p.dry = (p.dry || 0) + 1; p.perfect = false; if (p.dry >= 3) { p.dead = true; out.push('🥀 ' + C.name + 'แปลงที่ ' + (i + 1) + ' เหี่ยวตายเพราะขาดน้ำ') } }
      }
      for (const a of G.animals) {
        const A = ANIMALS[a.kind]; let fed = false;
        if (G.hay > 0) { G.hay--; fed = true } else if ((G.basket.wheat || 0) > 0) { G.basket.wheat--; if (!G.basket.wheat) delete G.basket.wheat; fed = true }
        if (!fed) { a.mood = Math.max(0, (a.mood ?? 5) - 2); if (!a.hungry) out.push('🌾 ' + A.icon + ' ' + a.name + ' หิว ไม่มีฟางให้กิน'); a.hungry = true; continue }
        a.hungry = false; a.mood = Math.min(10, (a.mood ?? 5) + (a.pat === d ? 1 : 0));
        if ((d - a.day0) % A.every === 0 && d > a.day0) { const n = A.n + (a.mood >= 7 ? 1 : 0); G.basket[A.product] = (G.basket[A.product] || 0) + n }
      }
      for (let i = 0; i < (G.ground?.length || 0); i++) if (G.ground[i] === 'grass' && hash('weed:' + d + ':' + i) < .015) G.ground[i] = 'weed';   /* v97.83 · weeds creep back */
      if (G.have.compost && d - G.compostDay >= 3) { G.fert++; G.compostDay = d; out.push('🟫 กองปุ๋ยหมักพร้อมใช้ +1 ถุง') }
    }
    if (now > G.last) { G.last = now; commit() }
    return out;
  }
  const canPlant = (crop, d = today()) => CROPS[crop].seasons.includes(season(d)[0]);
  function plant(G, i, crop) {
    const g = game(), C = CROPS[crop]; if (!G || !C || G.plots[i]) return 'แปลงนี้มีต้นไม้อยู่แล้ว'; if (G.ground && G.ground[i] !== 'soil') return 'ต้องไถดินก่อนปลูก'; if (!canPlant(crop)) return C.name + 'ไม่ขึ้นใน' + season(today())[1];
    if ((g.village.coins || 0) < C.seed) return 'เงินไม่พอซื้อเมล็ด'; g.village.coins -= C.seed;
    G.plots[i] = { crop, g: 0, dry: 0, w: 0, fert: false, perfect: true, at: today() }; commit(); return '';
  }
  function water(G, i) { const p = G?.plots[i]; if (!p || p.dead || p.ripe) return false; if (p.w === today()) return false; p.w = today(); commit(); return true }
  const waterAll = G => G.plots.reduce((n, p, i) => n + (water(G, i) ? 1 : 0), 0);
  function fertilise(G, i) {
    const g = game(), p = G?.plots[i]; if (!p || p.dead || p.ripe || p.fert) return 'ใส่ปุ๋ยไม่ได้';
    if (G.fert > 0) G.fert--; else { if ((g.village.coins || 0) < FERT_COST) return 'เงินไม่พอซื้อปุ๋ย'; g.village.coins -= FERT_COST }
    p.fert = true; commit(); return '';
  }
  function harvest(G, i) {
    const p = G?.plots[i]; if (!p?.ripe) return 0; const C = CROPS[p.crop], n = C.yield + (stars(p) - 1);
    G.basket[p.crop] = (G.basket[p.crop] || 0) + n; G.harvests = (G.harvests || 0) + 1; G.best ||= {}; G.best[p.crop] = Math.max(G.best[p.crop] || 0, stars(p));   /* v97.81 · for the harvest contest */
    if (C.regrow) { p.ripe = false; p.g = C.days - C.regrow; p.dry = 0 } else G.plots[i] = null;
    commit(); return n;
  }
  const harvestAll = G => G.plots.reduce((n, p, i) => n + harvest(G, i), 0);
  function clear(G, i) { if (!G?.plots[i]?.dead) return false; G.plots[i] = null; commit(); return true }
  /* the basket: cook into rations (village materials.food) or sell at the market price */
  function cook(G) { const g = game(); let f = 0; for (const [k, n] of Object.entries(G.basket)) { const v = GOODS[k]?.food; if (!v) continue; f += v * n; delete G.basket[k] } g.village.materials ||= {}; g.village.materials.food = (g.village.materials.food || 0) + f; commit(); return f }
  function sell(G) { const g = game(); let c = 0; for (const [k, n] of Object.entries(G.basket)) { c += (GOODS[k]?.sell || 0) * n; delete G.basket[k] } g.village.coins = (g.village.coins || 0) + c; if (c >= 60) root.Factions?.add('merchants', 1, 'ส่งผักจากสวนเข้าตลาด'); commit(); return c }
  function upgrade(G, what) {
    const g = game();
    if (what === 'size' && G.ground) return 'ไร่ขยายด้วยการถางพื้นที่เอง';
    if (what === 'size') { const k = SIZES.indexOf(G.size) + 1; if (k >= SIZES.length) return 'ขยายสุดแล้ว'; if ((g.village.coins || 0) < SIZE_COST[k]) return 'เงินไม่พอ'; g.village.coins -= SIZE_COST[k]; G.size = SIZES[k]; of({ garden: G }); commit(); return '' }
    const I = ITEMS[what]; if (!I || G.have[what]) return 'มีแล้ว'; if ((g.village.coins || 0) < I.cost) return 'เงินไม่พอ'; g.village.coins -= I.cost; G.have[what] = true; if (what === 'compost') G.compostDay = today(); commit(); return '';
  }
  /* v97.83 · clearing and tilling · returns '' or why not */
  const fatigue = () => game()?.fatigue || 0;
  function work(n) { const g = game(); if ((g.fatigue || 0) + n > 100) return false; g.fatigue = Math.min(100, (g.fatigue || 0) + n); return true }
  function clearTile(G, i) {
    const k = G.ground?.[i], D = DEBRIS[k]; if (!D) return 'ตรงนี้ไม่มีอะไรต้องถาง';
    if (fatigue() >= TIRED || !work(D.fat)) return 'เหนื่อยเกินไปแล้ว พักก่อนเถอะ';
    G.ground[i] = 'grass'; if (D.give) { const m = game().village.materials ||= {}; m[D.give[0]] = (m[D.give[0]] || 0) + D.give[1] } commit(); return '';
  }
  function till(G, i) { if (G.ground?.[i] !== 'grass') return G.ground?.[i] === 'soil' ? 'ไถแล้ว' : 'ต้องถางก่อน'; if (fatigue() >= TIRED || !work(TILL_FAT)) return 'เหนื่อยเกินไปแล้ว พักก่อนเถอะ'; G.ground[i] = 'soil'; commit(); return '' }
  const fieldCount = G => { const c = { soil: 0, planted: 0, debris: 0 }; (G.ground || []).forEach((k, i) => { if (k === 'soil') { c.soil++; if (G.plots[i]) c.planted++ } else if (DEBRIS[k]) c.debris++ }); return c };
  /* v97.81 · the pen */
  function buyAnimal(G, kind, name) {
    const A = ANIMALS[kind], g = game(); if (!A) return 'ไม่มีสัตว์ชนิดนี้'; if (G.animals.length >= (G.have.barn ? PEN[1] : PEN[0])) return 'คอกเต็มแล้ว · สร้างโรงนาเพื่อเลี้ยงได้มากขึ้น';
    if ((g.village.coins || 0) < A.cost) return 'เงินไม่พอ'; g.village.coins -= A.cost;
    G.animals.push({ kind, name: name || A.name + 'ตัวที่ ' + (G.animals.filter(a => a.kind === kind).length + 1), mood: 5, day0: today(), pat: 0 }); commit(); return '';
  }
  const patAll = G => { let n = 0; for (const a of G.animals) if (a.pat !== today()) { a.pat = today(); n++ } commit(); return n };
  function buyHay(G) { const g = game(); if ((g.village.coins || 0) < HAY.cost) return 'เงินไม่พอ'; g.village.coins -= HAY.cost; G.hay += HAY.n; commit(); return '' }
  function buildBarn(G) { const g = game(); if (G.have.barn) return 'มีแล้ว'; if ((g.village.coins || 0) < BARN_COST) return 'เงินไม่พอ'; g.village.coins -= BARN_COST; G.have.barn = true; commit(); return '' }
  /* raiders on open land may drive off one animal */
  function steal(G, rng = Math.random) { if (!G?.animals?.length || rng() > .3) return null; const a = G.animals.splice(Math.floor(rng() * G.animals.length), 1)[0]; commit(); return a }
  /* v97.81 · produce into the bag (key veg_<item>) — it can then go on the shelf of our shop (js/player-shop.js) */
  const bagKey = k => 'veg_' + k;
  function toBag(G) { const g = game(), b = g.village.bag ||= {}; let n = 0; for (const [k, q] of Object.entries(G.basket)) { if (!GOODS[k] || q <= 0) continue; b[bagKey(k)] = (b[bagKey(k)] || 0) + q; n += q; delete G.basket[k] } commit(); return n }
  /* the bag and the shop know these as goods */
  function registerGoods() { const AD = root.ADVENTURE_DATA; if (!AD?.GOODS) return; for (const [k, X] of Object.entries(GOODS)) AD.GOODS[bagKey(k)] ||= { name: X.name, element: 'nature', rarity: 'common', use: 'ขาย', price: X.sell, text: 'ผลผลิตจากไร่ของเรา' } }
  registerGoods(); if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', registerGoods);
  /* v97.81 · the harvest contest (Fernvale, the last week of autumn, once a year): your best entry across every farm against the village's growers */
  const year = d => Math.floor((Math.max(1, d) - 1) / 112);
  const contestOpen = (d = today()) => season(d)[0] === 'autumn' && seasonDay(d) >= 22;
  function entries(gardens) { const best = {}; for (const G of gardens) for (const [k, st] of Object.entries(G?.best || {})) if (CROPS[k]) best[k] = Math.max(best[k] || 0, st); return Object.entries(best).map(([k, st]) => ({ crop: k, stars: st, score: st * 30 + CROPS[k].sell })) }
  const RIVALS = [['ฮิลดา', 'ฟักทองยักษ์', 118], ['บริน', 'ข้าวสาลีรวงทอง', 92], ['ป้าเมย์', 'แครอทหวาน', 80]];
  function contest(S, gardens, crop, rng = Math.random) {
    const d = today(); if (!contestOpen(d)) return { why: 'งานประกวดมีช่วงสัปดาห์สุดท้ายของฤดูใบไม้ร่วง' }; if (S.contestYear === year(d)) return { why: 'ปีนี้ส่งประกวดไปแล้ว' };
    const e = entries(gardens).find(x => x.crop === crop); if (!e) return { why: 'ยังไม่มีผลผลิตชนิดนี้จากไร่ของเรา' };
    S.contestYear = year(d); const mine = e.score + rng() * 30, board = [...RIVALS.map(([who, what, base]) => ({ who, what, score: base + rng() * 30 })), { who: 'คุณ', what: CROPS[e.crop].name + ' ' + '★'.repeat(e.stars), score: mine, me: true }].sort((a, b) => b.score - a.score);
    const place = board.findIndex(x => x.me) + 1, prize = [0, 120, 50, 20, 0][place];
    S.gold = (S.gold || 0) + prize; root.Factions?.add('village', [0, 5, 2, 1, 0][place], 'งานประกวดผลผลิตเทศกาลเก็บเกี่ยว');
    return { place, prize, board };
  }
  /* v97.77 · raiders trample about half the growing crops of a farm on open land · returns how many were lost */
  function trample(G, rng = Math.random) { let n = 0; for (const p of G?.plots || []) if (p && !p.dead && rng() < .5) { p.dead = true; n++ } if (n) commit(); return n }
  /* v97.76 · what the garden needs today (for button labels): ripe plots, plots not yet watered (rain and the channel count) */
  function status(G) { if (!G) return { ripe: 0, thirsty: 0 }; tick(G); const d = today(), wet = rain(d) || !!G.have.channel; let ripe = 0, thirsty = 0; for (const p of G.plots) { if (!p || p.dead) continue; if (p.ripe) ripe++; else if (!wet && p.w !== d) thirsty++ } return { ripe, thirsty } }
  const badge = G => { const t = status(G); return (t.ripe ? ' · 🧺 ' + t.ripe : '') + (t.thirsty ? ' · 💧 ' + t.thirsty : '') };
  /* v97.81 · the contest overlay (Hilda's house) — S = world save (farms live in S.estates) · resolves when closed */
  function contestPanel(S, onChange) {
    return new Promise(res => {
      css(); document.getElementById('gdUI')?.remove(); const d = document.createElement('div'); d.id = 'gdUI';
      const gardens = (S.estates || []).map(p => p.garden).filter(Boolean), list = entries(gardens).sort((a, b) => b.score - a.score), now = today(), open = contestOpen(now), done = S.contestYear === year(now);
      const draw = r => { d.innerHTML = `<div class="box"><button class="x" data-x>✕</button><h2><img src="assets/icons/menu/trophy.webp" alt="" style="width:32px;height:32px;vertical-align:middle;margin-right:6px">ประกวดผลผลิต · เทศกาลเก็บเกี่ยวเฟิร์นเวล</h2><div style="display:flex;gap:12px;align-items:flex-start"><img src="assets/portraits/hilda-${r && !r.why ? (r.place === 1 ? 'surprised' : 'happy') : 'neutral'}.webp" alt="ฮิลดา" style="height:150px;border-radius:10px;flex:none"><div>
        <p class="sub">จัดสัปดาห์สุดท้ายของฤดูใบไม้ร่วง (วันที่ 22–28) ปีละครั้ง · ส่งผลผลิตจากไร่ของเราได้ 1 อย่าง · ดาวคุณภาพสำคัญที่สุด · ที่ 1 ได้ 120 💰 และชาวบ้านนับถือขึ้น</p>
        ${r ? `<div class="note">${r.why ? r.why : `<b>ผลการตัดสิน</b><br>${r.board.map((x, i) => `${['🥇', '🥈', '🥉', '4.'][i]} ${x.who} · ${x.what}`).join('<br>')}<br>${r.prize ? 'ได้รางวัล ' + r.prize + ' 💰' : 'ปีหน้าเอาใหม่!'}`}</div>` : ''}
        ${!open ? `<div class="note">ยังไม่ถึงช่วงงาน · ตอนนี้ ${season(now)[2]} ${season(now)[1]} วันที่ ${seasonDay(now)}/28</div>` : done ? '<div class="note">ปีนี้ส่งประกวดไปแล้ว</div>' : ''}
        <div class="row">${list.length ? list.map(e => `<button data-c="${e.crop}" ${open && !done ? '' : 'disabled'}>${CROPS[e.crop].icon} ${CROPS[e.crop].name} ${'★'.repeat(e.stars)}</button>`).join('') : '<small>ยังไม่มีผลผลิตที่เคยเก็บจากไร่ของเรา · ปลูกผักให้ได้ดาวสูง ๆ แล้วค่อยมาส่ง</small>'}</div></div></div></div>` };
      draw(); document.body.append(d);
      const close = () => { removeEventListener('keydown', key, true); d.remove(); res() }, key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } };
      addEventListener('keydown', key, true);
      d.onclick = e => { if (e.target === d || e.target.closest('[data-x]')) return close(); const b = e.target.closest('[data-c]'); if (!b || b.disabled) return; const r = contest(S, gardens, b.dataset.c); onChange?.(); draw(r); d.querySelectorAll('[data-c]').forEach(x => x.disabled = true) };
    });
  }
  /* ---------- the panel ---------- */
  function css() {
    if (document.getElementById('gdCss')) return; const st = document.createElement('style'); st.id = 'gdCss';
    st.textContent = `#gdUI{position:fixed;inset:0;z-index:2180;display:grid;place-items:center;background:#05080dcc;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif}
    #gdUI .box{width:min(820px,97vw);max-height:94vh;overflow:auto;padding:16px 18px;border-radius:16px;background:linear-gradient(#eef0d2,#d9d6a6);color:#2f2a12;box-shadow:0 24px 60px #000c}
    #gdUI h2{margin:0;font:800 23px Georgia,"Noto Sans Thai",serif;color:#3d4a12}#gdUI .sub{font-size:13px;color:#5a5a2a;margin:2px 0 8px}
    #gdUI .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(122px,1fr));gap:8px}
    #gdUI .pl{position:relative;padding:8px;border-radius:12px;background:#8a6a3c;border:3px solid #5e4524;color:#fff;min-height:118px;display:flex;flex-direction:column;align-items:center;gap:3px;text-align:center}
    #gdUI .pl.wet{background:#5e4a2c}#gdUI .pl.ripe{border-color:#e8c440;box-shadow:0 0 0 2px #e8c44088}#gdUI .pl .ic{font-size:34px;line-height:1.1}#gdUI .pl small{font-size:11.5px;opacity:.95}
    #gdUI .bar{width:90%;height:6px;border-radius:4px;background:#0004;overflow:hidden}#gdUI .bar i{display:block;height:100%;background:#9ad35a}
    #gdUI button{margin:2px;padding:5px 9px;border-radius:8px;border:1px solid #4a5a12;background:linear-gradient(#cfe08a,#93ad3c);color:#1f2a06;font:600 12.5px inherit;font-family:inherit;cursor:pointer}#gdUI button:disabled{opacity:.45;cursor:default}
    #gdUI .seeds{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0}#gdUI .row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0}#gdUI .note{padding:6px 10px;border-radius:8px;background:#fff9;font-size:13px;margin:6px 0}
    #gdUI .x{float:right;background:none;border:0;font-size:20px}`;
    document.head.append(st);
  }
  function open(G, opts = {}) {
    if (!G) return; css(); document.getElementById('gdUI')?.remove();
    const d = document.createElement('div'); d.id = 'gdUI'; let pick = Number.isInteger(opts.pick) && !G.plots[opts.pick] ? opts.pick : null, note = tick(G).join('<br>');
    const draw = () => {
      const g = game(), now = today(), [sk, sn, si] = season(now), wetToday = rain(now) || G.have.channel, tomorrow = rain(now + 1), nxt = SIZES.indexOf(G.size) + 1;
      const plot = (p, i) => {
        if (!p) return `<div class="pl"><div class="ic">🟫</div><small>แปลงว่าง</small><button data-a="pick:${i}">🌱 ปลูก</button></div>`;
        const C = CROPS[p.crop]; if (p.dead) return `<div class="pl"><div class="ic">🥀</div><small>${C.name} เหี่ยวตาย</small><button data-a="clear:${i}">ถอนทิ้ง</button></div>`;
        const wet = wetToday || p.w === now, stage = p.ripe ? C.icon : p.g < 1 ? '🌱' : p.g < C.days * .6 ? '🌿' : '🪴';
        return `<div class="pl ${wet ? 'wet' : ''} ${p.ripe ? 'ripe' : ''}"><div class="ic">${stage}</div><small><b>${C.name}</b> ${'★'.repeat(stars(p))}</small>${p.ripe ? `<button data-a="harvest:${i}">🧺 เก็บ</button>` : `<div class="bar"><i style="width:${Math.min(100, p.g / C.days * 100)}%"></i></div><small>${wet ? '💧 ชุ่มน้ำ' : p.dry ? '⚠ แห้ง ' + p.dry + ' วัน' : 'ยังไม่รดน้ำ'}${C.seasons.includes(sk) ? '' : ' · นอกฤดู'}</small><span>${wet ? '' : `<button data-a="water:${i}">💧</button>`}${p.fert ? '' : `<button data-a="fert:${i}" title="ปุ๋ย ${G.fert ? 'มี ' + G.fert + ' ถุง' : FERT_COST + ' 💰'}">🟫 ปุ๋ย</button>`}</span>`}</div>`;
      };
      const seeds = pick == null ? '' : `<div class="note">เลือกเมล็ดสำหรับแปลงที่ ${pick + 1} (ฮิลดาฝากขาย) <button data-a="unpick">ยกเลิก</button><div class="seeds">${Object.entries(CROPS).map(([k, C]) => { const ok = canPlant(k); return `<button data-a="plant:${k}" ${ok && (g.village.coins || 0) >= C.seed ? '' : 'disabled'} title="${ok ? 'โต ' + C.days + ' วัน · ได้ ' + C.yield + ' · ขาย ' + C.sell + ' 💰' + (C.regrow ? ' · เก็บซ้ำได้' : '') : 'ไม่ขึ้นใน' + sn}">${C.icon} ${C.name} ${C.seed}💰<br><small>${C.days} วัน · ${C.seasons.map(x => SEASONS.find(s => s[0] === x)[2]).join('')}</small></button>` }).join('')}</div></div>`;
      const basket = Object.entries(G.basket).filter(([, n]) => n > 0);
      d.innerHTML = `<div class="box"><button class="x" data-x>✕</button><h2>🌾 ไร่ · ${opts.title || 'ไร่ของเรา'}</h2>
        <p class="sub">${si} ${sn} วันที่ ${seasonDay(now)}/28 · วันนี้${rain(now) ? '🌧 ฝนตก รดน้ำให้แล้ว' : '☀ ฟ้าโปร่ง'}${G.have.channel ? ' · 🚿 รางน้ำรดให้ทุกวัน' : ''} · ฮิลดาว่าพรุ่งนี้${tomorrow ? 'ฝนน่าจะตก' : 'แดดออก'} · 💰 ${g.village.coins || 0} · ปุ๋ย ${G.fert} ถุง</p>
        ${note ? `<div class="note">${note}</div>` : ''}
        <div class="row"><button data-a="waterall">💧 รดน้ำทุกแปลง</button><button data-a="harvestall">🧺 เก็บทุกแปลงที่สุก</button></div>
        ${seeds}${(() => { const c = fieldCount(G); return `<p class="sub">แปลงที่ไถแล้ว ${c.soil} · ปลูกอยู่ ${c.planted} · ยังต้องถาง ${c.debris} ช่อง · ความเหนื่อย ${fatigue()}% (ถางและไถในฉากไร่)</p>` })()}<div class="grid">${G.plots.map((p, i) => G.ground && G.ground[i] !== 'soil' ? '' : plot(p, i)).join('')}</div>
        <div class="note"><b>🧺 ตะกร้า</b> ${basket.length ? basket.map(([k, n]) => (GOODS[k]?.icon || '') + ' ' + (GOODS[k]?.name || k) + ' ×' + n).join(' · ') : 'ว่าง'}${basket.length ? `<div class="row"><button data-a="cook">🍲 ทำเป็นเสบียง (+${basket.reduce((a, [k, n]) => a + (GOODS[k]?.food || 0) * n, 0)})</button><button data-a="sell">💰 ส่งขายตลาด (+${basket.reduce((a, [k, n]) => a + (GOODS[k]?.sell || 0) * n, 0)})</button><button data-a="bag" title="เอาไปวางขายในร้านของเราเองได้ ราคาตั้งเอง">🎒 เก็บเข้ากระเป๋า (ไว้วางขายในร้านของเรา)</button></div>` : ''}</div>
        <div class="note"><b>🐾 คอกสัตว์</b> ${G.animals.length}/${G.have.barn ? PEN[1] : PEN[0]} ตัว · ฟาง ${G.hay} มัด (กินตัวละ 1 มัดต่อวัน · หมดแล้วใช้ข้าวสาลีในตะกร้า)
          <div class="row">${G.animals.map(a => `<span title="อารมณ์ ${a.mood}/10" style="padding:3px 8px;border-radius:8px;background:#fff8">${ANIMALS[a.kind].icon} ${a.name} ${a.hungry ? '😣' : a.mood >= 7 ? '😊' : '🙂'}${a.pat === now ? ' 🤚' : ''}</span>`).join('') || '<small>ยังไม่มีสัตว์</small>'}</div>
          <div class="row">${G.animals.length ? '<button data-a="pat">🤚 ลูบหัวทุกตัว</button>' : ''}<button data-a="hay">🌾 ซื้อฟาง ${HAY.n} มัด · ${HAY.cost} 💰</button>${Object.entries(ANIMALS).map(([k, A]) => `<button data-a="animal:${k}" title="ให้${PRODUCTS[A.product].name} ${A.n}${A.every > 1 ? ' ทุก ' + A.every + ' วัน' : ' ต่อวัน'}">${A.icon} ซื้อ${A.name} · ${A.cost} 💰</button>`).join('')}${G.have.barn ? '' : `<button data-a="barn">🏚 สร้างโรงนา (เลี้ยงได้ ${PEN[1]} ตัว) · ${BARN_COST} 💰</button>`}</div></div>
        <div class="note"><b>🔨 ปรับปรุงไร่</b><div class="row">${!G.ground && nxt < SIZES.length ? `<button data-a="up:size">➕ ขยายเป็น ${SIZES[nxt]} แปลง · ${SIZE_COST[nxt]} 💰</button>` : ''}${Object.entries(ITEMS).map(([k, I]) => G.have[k] ? `<small>✔ ${I.icon} ${I.name}</small>` : `<button data-a="up:${k}" title="${I.text}">${I.icon} ${I.name} · ${I.cost} 💰</button>`).join('')}</div>
        <small>ถางหิน ตอไม้ กิ่งไม้ และวัชพืชในฉากไร่ แล้วไถดินก่อนปลูก · รดน้ำทุกวัน (ฝนตกรดให้เอง) · แห้ง 3 วันติดต้นจะตาย · ใส่ปุ๋ยและไม่ขาดน้ำเลยได้ดาวเพิ่ม ผลผลิตมากขึ้น · ปลูกนอกฤดูไม่ได้ ถ้าเปลี่ยนฤดูกลางทางจะโตช้าลงครึ่งหนึ่ง</small></div></div>`;
    };
    draw(); document.body.append(d);
    const close = () => { removeEventListener('keydown', key, true); d.remove(); opts.onClose?.() }, key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } };
    addEventListener('keydown', key, true);
    d.onclick = e => { if (e.target === d || e.target.closest('[data-x]')) return close(); const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const [a, v] = b.dataset.a.split(':'), i = +v; note = '';
      if (a === 'pick') pick = i; else if (a === 'unpick') pick = null;
      else if (a === 'plant') { note = plant(G, pick, v) || CROPS[v].icon + ' ปลูก' + CROPS[v].name + 'ที่แปลง ' + (pick + 1) + ' แล้ว อย่าลืมรดน้ำ'; pick = null }
      else if (a === 'water') water(G, i); else if (a === 'waterall') note = '💧 รดน้ำ ' + waterAll(G) + ' แปลง';
      else if (a === 'fert') note = fertilise(G, i) || '🟫 ใส่ปุ๋ยแล้ว';
      else if (a === 'harvest') note = '🧺 เก็บได้ ' + harvest(G, i) + ' ผล'; else if (a === 'harvestall') note = '🧺 เก็บได้ทั้งหมด ' + harvestAll(G) + ' ผล';
      else if (a === 'clear') clear(G, i);
      else if (a === 'cook') note = '🍲 ได้เสบียง +' + cook(G); else if (a === 'sell') note = '💰 ขายได้ ' + sell(G) + ' 💰';
      else if (a === 'up') note = upgrade(G, v) || '🔨 ปรับปรุงไร่เรียบร้อยแล้ว';
      else if (a === 'animal') note = buyAnimal(G, v) || ANIMALS[v].icon + ' ซื้อ' + ANIMALS[v].name + 'เข้าคอกแล้ว อย่าลืมเตรียมฟาง';
      else if (a === 'pat') note = '🤚 ลูบหัว ' + patAll(G) + ' ตัว สัตว์ดูอารมณ์ดี'; else if (a === 'hay') note = buyHay(G) || '🌾 ได้ฟาง ' + HAY.n + ' มัด';
      else if (a === 'barn') note = buildBarn(G) || '🏚 สร้างโรงนาเสร็จแล้ว'; else if (a === 'bag') note = '🎒 เก็บเข้ากระเป๋า ' + toBag(G) + ' ชิ้น · วางขายได้ที่ร้านของเราในตลาด';
      opts.onChange?.(); draw() };
  }
  root.Garden = { FW, FH, FN, DEBRIS, clearTile, till, fieldCount, contestPanel, ANIMALS, PRODUCTS, GOODS, PEN, HAY, buyAnimal, patAll, buyHay, buildBarn, steal, toBag, bagKey, registerGoods, contestOpen, entries, contest, RIVALS, of, trample, status, badge, SEASONS, CROPS, ITEMS, SIZES, SIZE_COST, season, seasonDay, rain, tick, canPlant, plant, water, waterAll, fertilise, harvest, harvestAll, clear, cook, sell, upgrade, stars, open };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Garden;
})(typeof window !== 'undefined' ? window : globalThis);

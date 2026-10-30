/* v97.75 · L5 the vegetable garden behind your house (docs/TODO.md "L5 ชาวไร่" · the real system the prologue's pumpkin chore stands in for, S1).
   Seasons: 28 days each (spring · summer · autumn · winter), counted from day 1 · the weather of a day is seeded (rain waters every plot).
   A plot: plant a seed in season (bought from Hilda's stock) → water it every day (or let the rain) → it grows a day per wet day
   (half a day once its season has passed) → ripe → harvest. Three dry days in a row and it withers. Crows may peck a seedling
   unless there is a scarecrow. Fertiliser and never missing a day raise the quality (★1–3): more crops at harvest.
   Some crops grow again after a harvest (tomato, strawberry).
   Produce waits in the basket: cook it into rations, or sell it to the market. Upgrades: more plots, scarecrow, compost heap, water channel.
   Stored in the game save: village.garden = { plots: [...], size, last, basket: { crop: n }, have: { scarecrow, compost, channel }, fert, compostDay }. */
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
  const SIZES = [6, 9, 12], SIZE_COST = [0, 120, 220];
  const ITEMS = { scarecrow: { name: 'หุ่นไล่กา', icon: '🧑‍🌾', cost: 40, text: 'กาไม่จิกต้นกล้า' }, compost: { name: 'กองปุ๋ยหมัก', icon: '🟫', cost: 60, text: 'ได้ปุ๋ยฟรี 1 ถุงทุก 3 วัน' }, channel: { name: 'รางน้ำจากลำธาร', icon: '🚿', cost: 250, text: 'รดน้ำให้ทุกแปลงทุกวัน' } };
  const FERT_COST = 5;
  const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296 };
  const season = d => SEASONS[Math.floor((Math.max(1, d) - 1) / 28) % 4];
  const seasonDay = d => (Math.max(1, d) - 1) % 28 + 1;
  const RAIN = { spring: .35, summer: .2, autumn: .3, winter: .12 };
  const rain = d => hash('rain:' + d) < RAIN[season(d)[0]];
  const game = () => (typeof s !== 'undefined' && s?.village ? s : root.WorldState?.game?.()) || null;
  const today = () => game()?.day || 1;
  function store() { const g = game(); if (!g?.village) return null; const G = g.village.garden ||= { plots: [], size: 6, last: g.day || 1, basket: {}, have: {}, fert: 0, compostDay: g.day || 1 }; while (G.plots.length < G.size) G.plots.push(null); return G }
  const commit = () => { try { if (typeof save === 'function' && typeof s !== 'undefined') save(); else root.WorldState?.commit?.() } catch (e) { } };
  const stars = p => Math.min(3, 1 + (p.fert ? 1 : 0) + (p.perfect ? 1 : 0));
  /* run the finished days (last … today−1): growth, drying, crows, compost · returns log lines */
  function tick(G = store(), now = today()) {
    if (!G) return []; const out = [];
    for (let d = G.last; d < now; d++) {
      const wet = rain(d) || !!G.have.channel, sz = season(d)[0];
      for (let i = 0; i < G.plots.length; i++) {
        const p = G.plots[i]; if (!p || p.dead || p.ripe) continue; const C = CROPS[p.crop];
        if (p.g < 1 && !G.have.scarecrow && hash('crow:' + d + ':' + i) < .08) { G.plots[i] = null; out.push('🐦 กาจิกต้นกล้า' + C.name + 'แปลงที่ ' + (i + 1) + ' หายไป'); continue }
        if (wet || p.w === d) { p.g += C.seasons.includes(sz) ? 1 : .5; p.dry = 0; if (p.g >= C.days) { p.ripe = true; out.push(C.icon + ' ' + C.name + 'แปลงที่ ' + (i + 1) + ' สุกแล้ว') } }
        else { p.dry = (p.dry || 0) + 1; p.perfect = false; if (p.dry >= 3) { p.dead = true; out.push('🥀 ' + C.name + 'แปลงที่ ' + (i + 1) + ' เหี่ยวตายเพราะขาดน้ำ') } }
      }
      if (G.have.compost && d - G.compostDay >= 3) { G.fert++; G.compostDay = d; out.push('🟫 กองปุ๋ยหมักพร้อมใช้ +1 ถุง') }
    }
    if (now > G.last) { G.last = now; commit() }
    return out;
  }
  const canPlant = (crop, d = today()) => CROPS[crop].seasons.includes(season(d)[0]);
  function plant(i, crop) {
    const G = store(), g = game(), C = CROPS[crop]; if (!G || !C || G.plots[i]) return 'แปลงนี้มีต้นไม้อยู่แล้ว'; if (!canPlant(crop)) return C.name + 'ไม่ขึ้นใน' + season(today())[1];
    if ((g.village.coins || 0) < C.seed) return 'เงินไม่พอซื้อเมล็ด'; g.village.coins -= C.seed;
    G.plots[i] = { crop, g: 0, dry: 0, w: 0, fert: false, perfect: true, at: today() }; commit(); return '';
  }
  function water(i) { const G = store(), p = G?.plots[i]; if (!p || p.dead || p.ripe) return false; if (p.w === today()) return false; p.w = today(); commit(); return true }
  const waterAll = () => store().plots.reduce((n, p, i) => n + (water(i) ? 1 : 0), 0);
  function fertilise(i) {
    const G = store(), g = game(), p = G?.plots[i]; if (!p || p.dead || p.ripe || p.fert) return 'ใส่ปุ๋ยไม่ได้';
    if (G.fert > 0) G.fert--; else { if ((g.village.coins || 0) < FERT_COST) return 'เงินไม่พอซื้อปุ๋ย'; g.village.coins -= FERT_COST }
    p.fert = true; commit(); return '';
  }
  function harvest(i) {
    const G = store(), p = G?.plots[i]; if (!p?.ripe) return 0; const C = CROPS[p.crop], n = C.yield + (stars(p) - 1);
    G.basket[p.crop] = (G.basket[p.crop] || 0) + n; G.harvests = (G.harvests || 0) + 1;
    if (C.regrow) { p.ripe = false; p.g = C.days - C.regrow; p.dry = 0 } else G.plots[i] = null;
    commit(); return n;
  }
  const harvestAll = () => store().plots.reduce((n, p, i) => n + harvest(i), 0);
  function clear(i) { const G = store(); if (!G?.plots[i]?.dead) return false; G.plots[i] = null; commit(); return true }
  /* the basket: cook into rations (village materials.food) or sell at the market price */
  function cook() { const G = store(), g = game(); let f = 0; for (const [k, n] of Object.entries(G.basket)) { const v = CROPS[k].food; if (!v) continue; f += v * n; delete G.basket[k] } g.village.materials ||= {}; g.village.materials.food = (g.village.materials.food || 0) + f; commit(); return f }
  function sell() { const G = store(), g = game(); let c = 0; for (const [k, n] of Object.entries(G.basket)) { c += CROPS[k].sell * n; delete G.basket[k] } g.village.coins = (g.village.coins || 0) + c; if (c >= 60) root.Factions?.add('merchants', 1, 'ส่งผักจากสวนเข้าตลาด'); commit(); return c }
  function upgrade(what) {
    const G = store(), g = game();
    if (what === 'size') { const k = SIZES.indexOf(G.size) + 1; if (k >= SIZES.length) return 'ขยายสุดแล้ว'; if ((g.village.coins || 0) < SIZE_COST[k]) return 'เงินไม่พอ'; g.village.coins -= SIZE_COST[k]; G.size = SIZES[k]; store(); commit(); return '' }
    const I = ITEMS[what]; if (!I || G.have[what]) return 'มีแล้ว'; if ((g.village.coins || 0) < I.cost) return 'เงินไม่พอ'; g.village.coins -= I.cost; G.have[what] = true; if (what === 'compost') G.compostDay = today(); commit(); return '';
  }
  /* ---------- the panel ---------- */
  function css() {
    if (document.getElementById('gdCss')) return; const st = document.createElement('style'); st.id = 'gdCss';
    st.textContent = `#gdUI{position:fixed;inset:0;z-index:2060;display:grid;place-items:center;background:#05080dcc;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif}
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
  function open(opts = {}) {
    const G = store(); if (!G) return; css(); document.getElementById('gdUI')?.remove();
    const d = document.createElement('div'); d.id = 'gdUI'; let pick = null, note = tick().join('<br>');
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
      d.innerHTML = `<div class="box"><button class="x" data-x>✕</button><h2>🌱 สวนหลังบ้าน</h2>
        <p class="sub">${si} ${sn} วันที่ ${seasonDay(now)}/28 · วันนี้${rain(now) ? '🌧 ฝนตก รดน้ำให้แล้ว' : '☀ ฟ้าโปร่ง'}${G.have.channel ? ' · 🚿 รางน้ำรดให้ทุกวัน' : ''} · ฮิลดาว่าพรุ่งนี้${tomorrow ? 'ฝนน่าจะตก' : 'แดดออก'} · 💰 ${g.village.coins || 0} · ปุ๋ย ${G.fert} ถุง</p>
        ${note ? `<div class="note">${note}</div>` : ''}
        <div class="row"><button data-a="waterall">💧 รดน้ำทุกแปลง</button><button data-a="harvestall">🧺 เก็บทุกแปลงที่สุก</button></div>
        ${seeds}<div class="grid">${G.plots.map(plot).join('')}</div>
        <div class="note"><b>🧺 ตะกร้า</b> ${basket.length ? basket.map(([k, n]) => CROPS[k].icon + ' ' + CROPS[k].name + ' ×' + n).join(' · ') : 'ว่าง'}${basket.length ? `<div class="row"><button data-a="cook">🍲 ทำเป็นเสบียง (+${basket.reduce((a, [k, n]) => a + CROPS[k].food * n, 0)})</button><button data-a="sell">💰 ส่งขายตลาด (+${basket.reduce((a, [k, n]) => a + CROPS[k].sell * n, 0)})</button></div>` : ''}</div>
        <div class="note"><b>🔨 ปรับปรุงสวน</b> (ลุงทอมช่างไม้รับทำ)<div class="row">${nxt < SIZES.length ? `<button data-a="up:size">➕ ขยายเป็น ${SIZES[nxt]} แปลง · ${SIZE_COST[nxt]} 💰</button>` : ''}${Object.entries(ITEMS).map(([k, I]) => G.have[k] ? `<small>✔ ${I.icon} ${I.name}</small>` : `<button data-a="up:${k}" title="${I.text}">${I.icon} ${I.name} · ${I.cost} 💰</button>`).join('')}</div>
        <small>รดน้ำทุกวัน (ฝนตกรดให้เอง) · แห้ง 3 วันติดต้นจะตาย · ใส่ปุ๋ยและไม่ขาดน้ำเลยได้ดาวเพิ่ม ผลผลิตมากขึ้น · ปลูกนอกฤดูไม่ได้ ถ้าเปลี่ยนฤดูกลางทางจะโตช้าลงครึ่งหนึ่ง</small></div></div>`;
    };
    draw(); document.body.append(d);
    const close = () => { removeEventListener('keydown', key, true); d.remove(); opts.onClose?.() }, key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } };
    addEventListener('keydown', key, true);
    d.onclick = e => { if (e.target === d || e.target.closest('[data-x]')) return close(); const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const [a, v] = b.dataset.a.split(':'), i = +v; note = '';
      if (a === 'pick') pick = i; else if (a === 'unpick') pick = null;
      else if (a === 'plant') { note = plant(pick, v) || CROPS[v].icon + ' ปลูก' + CROPS[v].name + 'ที่แปลง ' + (pick + 1) + ' แล้ว อย่าลืมรดน้ำ'; pick = null }
      else if (a === 'water') water(i); else if (a === 'waterall') note = '💧 รดน้ำ ' + waterAll() + ' แปลง';
      else if (a === 'fert') note = fertilise(i) || '🟫 ใส่ปุ๋ยแล้ว';
      else if (a === 'harvest') note = '🧺 เก็บได้ ' + harvest(i) + ' ผล'; else if (a === 'harvestall') note = '🧺 เก็บได้ทั้งหมด ' + harvestAll() + ' ผล';
      else if (a === 'clear') clear(i);
      else if (a === 'cook') note = '🍲 ได้เสบียง +' + cook(); else if (a === 'sell') note = '💰 ขายได้ ' + sell() + ' 💰';
      else if (a === 'up') note = upgrade(v) || '🔨 ลุงทอมทำให้เรียบร้อยแล้ว';
      opts.onChange?.(); draw() };
  }
  root.Garden = { SEASONS, CROPS, ITEMS, SIZES, SIZE_COST, season, seasonDay, rain, store, tick, canPlant, plant, water, waterAll, fertilise, harvest, harvestAll, clear, cook, sell, upgrade, stars, open };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Garden;
})(typeof window !== 'undefined' ? window : globalThis);

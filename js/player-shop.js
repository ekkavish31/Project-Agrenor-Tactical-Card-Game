/* v94.05 · F1 ร้านของเรา (Player shop) — a stall in the market where the hero leaves goods for the villagers to buy.
   • Save: s.village.shop = { slots[6], log[], sold, earned, last, news[], unseen }.
     A slot holds one thing taken out of the bag or the gear list: { kind:'gear', item } or { kind:'bag', key }, plus mult (price × base 0.6–2.0).
   • Customers: every in-game hour, each villager whose schedule (js/village-life.js) says 'market' at that hour may stop by.
     Higher price → lower chance to buy. A buyer whose `likes` mention the item pays +20%. When Graven (rival merchant) is at
     the market, some customers go to him instead.
   • Time away: the save remembers the last hour simulated (shop.last), so hours that passed on the world map are played
     back when the clock is next checked (capped at 7 days).
   • News: each sale is queued in shop.news and handed to the village memory (Mind.emit('shop:sale')) of an open frame,
     so villagers talk about the shop.
   The core (simulate, shelf helpers) is plain data → tested by tools/test-player-shop.cjs. The UI part runs only in index.html. */
(function (root) {
  'use strict';
  const SLOTS = 6, MIN = 0.6, SIZES = [6, 8, 10], UPGRADE = [150, 350], MAX = 2.0, LOG_MAX = 60, CATCHUP_H = 24 * 7, LOOK = 0.22, RIVAL = 0.25, LIKE_BONUS = 1.2;

  function blank() { return { slots: Array(SLOTS).fill(null), log: [], sold: 0, earned: 0, last: null, news: [], unseen: 0 } }
  function ensure(v) {
    const sh = v.shop && typeof v.shop === 'object' ? v.shop : (v.shop = blank());
    if (!Array.isArray(sh.slots)) sh.slots = [];
    sh.size = SIZES.includes(sh.size) ? sh.size : SLOTS;
    while (sh.slots.length < sh.size) sh.slots.push(null);
    sh.slots.length = sh.size;
    if (!Array.isArray(sh.log)) sh.log = []; if (!Array.isArray(sh.news)) sh.news = [];
    sh.sold ??= 0; sh.earned ??= 0; sh.unseen ??= 0;
    return sh;
  }
  /* absolute hour index of the game clock (day 1, 00:00 = 0) */
  const hourOf = g => ((g.day || 1) - 1) * 24 + Math.floor((g.minutes || 0) / 60);
  const clampMult = m => Math.round(Math.max(MIN, Math.min(MAX, m)) * 10) / 10;
  /* chance that a customer who looks at the item buys it: ×1.0 → 85%, ×1.5 → 50%, ×2.0 → 14%, ×0.6 → 95% */
  function buyChance(ratio) { return Math.max(0.03, Math.min(0.95, 0.85 * (2.2 - ratio) / 1.2)) }
  function likesItem(p, name) {
    if (!p?.likes || !name) return false;
    const L = String(p.likes);
    if (L.includes(name)) return true;
    return L.split(/[,·]/).map(w => w.trim()).some(w => w.length > 1 && name.includes(w));
  }
  function atMarket(p, hour) { return (p.sched || []).some(([a, b, pl]) => pl === 'market' && hour >= a && hour < b) }

  /* base price + name of what is on a slot (opt.gearValue / opt.gearName / opt.bagDef come from the game) */
  function slotInfo(sl, opt = {}) {
    if (!sl) return null;
    if (sl.kind === 'gear') return { name: opt.gearName?.(sl.item) || 'อุปกรณ์', base: Math.max(1, Math.round(opt.gearValue?.(sl.item) || 20)) };
    const d = opt.bagDef?.(sl.key);
    return { name: d?.name || sl.key, base: Math.max(1, Math.round(d?.price || 5)) };
  }
  const priceOf = (sl, opt) => { const i = slotInfo(sl, opt); return i ? Math.max(1, Math.round(i.base * (sl.mult || 1))) : 0 };

  /* ---------- shelf ---------- */
  function placeGear(g, id, mult = 1) {
    const sh = ensure(g.village), j = sh.slots.indexOf(null), k = (g.inventory || []).findIndex(x => x.id === id);
    if (j < 0) return 'ชั้นวางเต็มแล้ว'; if (k < 0) return 'ไม่พบอุปกรณ์ชิ้นนี้'; if (g.equipped === id) return 'กำลังสวมใส่อยู่';
    sh.slots[j] = { kind: 'gear', item: g.inventory.splice(k, 1)[0], mult: clampMult(mult) }; return '';
  }
  function placeBag(g, key, mult = 1) {
    const sh = ensure(g.village), j = sh.slots.indexOf(null), b = g.village.bag || {};
    if (j < 0) return 'ชั้นวางเต็มแล้ว'; if (!(b[key] > 0)) return 'ไม่มีของชิ้นนี้ในกระเป๋า';
    b[key]--; if (b[key] <= 0) delete b[key];
    sh.slots[j] = { kind: 'bag', key, mult: clampMult(mult) }; return '';
  }
  function takeBack(g, i) {
    const sh = ensure(g.village), sl = sh.slots[i]; if (!sl) return false;
    if (sl.kind === 'gear') (g.inventory ||= []).push(sl.item); else { const b = g.village.bag ||= {}; b[sl.key] = (b[sl.key] || 0) + 1 }
    sh.slots[i] = null; return true;
  }
  /* v95.00 money sink: a bigger stall (6 → 8 → 10 slots) */
  function upgradeCost(g) { const sh = ensure(g.village), k = SIZES.indexOf(sh.size); return k >= 0 && k < UPGRADE.length ? UPGRADE[k] : 0 }
  function upgrade(g) { const sh = ensure(g.village), c = upgradeCost(g); if (!c) return 'ชั้นวางใหญ่สุดแล้ว'; if ((g.village.coins || 0) < c) return 'เงินไม่พอ (◉ ' + c + ')'; g.village.coins -= c; sh.size = SIZES[SIZES.indexOf(sh.size) + 1]; ensure(g.village); return '' }
  function setMult(g, i, m) { const sl = ensure(g.village).slots[i]; if (!sl) return null; sl.mult = clampMult(m); return sl.mult }

  /* ---------- customers ----------
     opt: { people: {id:person}, present(p,day,hour), rng, excluded:Set, gearValue, gearName, bagDef }
     returns the sales made since the last check (and moves shop.last to now) */
  function simulate(g, opt = {}) {
    const sh = ensure(g.village), now = hourOf(g), rng = opt.rng || Math.random;
    if (sh.last == null || sh.last > now) { sh.last = now; return [] }
    const from = Math.max(sh.last + 1, now - CATCHUP_H + 1), sales = [];
    const people = Object.values(opt.people || {}), excluded = opt.excluded || new Set();
    for (let H = from; H <= now; H++) {
      if (!sh.slots.some(Boolean)) break;
      const day = Math.floor(H / 24) + 1, hr = H % 24;
      let crowd = people.filter(p => !excluded.has(p.id) && atMarket(p, hr) && (!opt.present || opt.present(p, day, hr)));
      const rival = crowd.some(p => p.id === 'graven');
      crowd = crowd.filter(p => p.id !== 'graven');
      if (!people.length && hr >= 8 && hr < 18) crowd = [{ id: '', name: 'ชาวบ้าน' }, { id: '', name: 'ชาวบ้าน' }];  // no roster loaded: anonymous buyers
      for (const p of crowd) {
        if (rng() >= LOOK) continue;
        const full = sh.slots.map((x, i) => x ? i : -1).filter(i => i >= 0); if (!full.length) break;
        if (rival && rng() < RIVAL) continue;
        const i = full[Math.floor(rng() * full.length)], sl = sh.slots[i], info = slotInfo(sl, opt);
        const ask = priceOf(sl, opt);
        if (rng() >= buyChance(ask / info.base)) continue;
        const liked = likesItem(p, info.name), paid = Math.round(ask * (liked ? LIKE_BONUS : 1));
        g.village.coins = (g.village.coins || 0) + paid;
        sh.slots[i] = null; sh.sold++; sh.earned += paid; sh.unseen++;
        const rec = { day, hour: hr, who: p.id, whoName: p.name, item: info.name, price: paid, liked };
        sh.log.unshift(rec); sales.push(rec);
        sh.news.push({ who: p.id, item: info.name, price: paid, t: day * 24 + hr });   // Mind clock = day*24 + hour
      }
    }
    if (sh.log.length > LOG_MAX) sh.log.length = LOG_MAX;
    if (sh.news.length > 20) sh.news.splice(0, sh.news.length - 20);
    sh.last = now;
    return sales;
  }

  const core = { SLOTS, SIZES, UPGRADE, upgradeCost, upgrade, MIN, MAX, CATCHUP_H, blank, ensure, hourOf, buyChance, likesItem, slotInfo, priceOf, placeGear, placeBag, takeBack, setMult, simulate };
  if (typeof module !== 'undefined' && module.exports) { module.exports = core; return }

  /* =================== in the game (index.html) =================== */
  if (typeof document === 'undefined' || typeof s === 'undefined') { root.PlayerShop = core; return }
  const AD = () => root.ADVENTURE_DATA || {};
  /* consumables are valued at 70 % of the travelling merchant's price, so buying them to resell is not free money */
  const bagDef = k => { const G = AD().GOODS?.[k]; if (G) return G; const C = AD().CONSUMABLES?.[k]; return C ? { ...C, price: Math.max(1, Math.round((C.price || 5) * .7)) } : null };
  const gearName = x => (typeof RECIPES !== 'undefined' && typeof itemRecipe === 'function' ? RECIPES[itemRecipe(x)]?.name : '') || 'อุปกรณ์';
  const gearValue = x => { try { return itemValue(x) } catch (e) { return 20 } };
  const OPT = () => ({ gearName, gearValue, bagDef });
  const fmt = n => n.toLocaleString('th-TH');
  const escH = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const clock = (d, h) => `วันที่ ${d} · ${String(h).padStart(2, '0')}:00`;
  let tab = 'shelf', choosing = -1;

  function shelfHtml(sh) {
    const opt = OPT(), atMarketNow = s.village.location === 'market';
    return `<div class="pshop-grid">${sh.slots.map((sl, i) => {
      if (!sl) return `<div class="pshop-slot empty"><span class="pshop-n">${i + 1}</span><p>ช่องว่าง</p>${elButton('＋ วางของ', `PlayerShopUI.choose(${i})`, !atMarketNow)}</div>`;
      const info = slotInfo(sl, opt), price = priceOf(sl, opt), ch = Math.round(buyChance(price / info.base) * 100);
      return `<div class="pshop-slot"><span class="pshop-n">${i + 1}</span><b>${escH(info.name)}</b><small>ราคาฐาน ◉ ${info.base}</small>
        <div class="pshop-price">${elButton('−', `PlayerShopUI.mult(${i},-0.1)`, sl.mult <= MIN)}<strong>◉ ${price}</strong>${elButton('＋', `PlayerShopUI.mult(${i},0.1)`, sl.mult >= MAX)}</div>
        <small>×${sl.mult.toFixed(1)} · โอกาสขาย ${ch}%</small>${elButton('เก็บคืน', `PlayerShopUI.back(${i})`, !atMarketNow)}</div>`;
    }).join('')}</div>${upgradeCost(s) ? elButton('ขยายชั้นวางเป็น ' + SIZES[SIZES.indexOf(sh.size) + 1] + ' ช่อง · ◉ ' + upgradeCost(s), 'PlayerShopUI.grow()', !atMarketNow || s.village.coins < upgradeCost(s)) : ''}${atMarketNow ? '' : '<p class="muted small">วางหรือเก็บของได้เมื่ออยู่ที่ตลาด · ของที่วางไว้ขายต่อได้แม้ไม่อยู่</p>'}`;
  }
  function chooserHtml(i) {
    const gear = (s.inventory || []).filter(x => s.equipped !== x.id), bag = Object.entries(s.village.bag || {}).filter(([k, n]) => n > 0 && bagDef(k));
    const row = (label, base, call) => `<div class="row"><span><b>${escH(label)}</b><small class="upgrade-level">ราคาฐาน ◉ ${base}</small></span>${elButton('วางช่อง ' + (i + 1), call)}</div>`;
    const list = [...gear.map(x => row(gearName(x) + ' · คุณภาพ ' + (x.quality || 1), gearValue(x), `PlayerShopUI.put('gear',${x.id})`)),
      ...bag.map(([k, n]) => row(bagDef(k).name + ' ×' + n, bagDef(k).price || 5, `PlayerShopUI.put('bag','${k}')`))];
    return `<p>เลือกของที่จะวางในช่อง ${i + 1}</p>${list.length ? list.join('') : '<div class="empty">ไม่มีของให้วาง · ตีอาวุธที่โรงตีเหล็ก หรือเก็บของป่าจากแผนที่โลก</div>'}${elButton('← กลับ', 'PlayerShopUI.choose(-1)')}`;
  }
  function ledgerHtml(sh) {
    if (!sh.log.length) return '<div class="empty">ยังไม่มีการขาย</div>';
    return `<table class="pshop-log"><thead><tr><th>เวลา</th><th>ผู้ซื้อ</th><th>ของ</th><th>ราคา</th></tr></thead><tbody>${sh.log.map(r => `<tr><td>${clock(r.day, r.hour)}</td><td>${escH(r.whoName || 'ชาวบ้าน')}${r.liked ? ' <span title="ชอบของชิ้นนี้ จ่ายเพิ่ม">♥</span>' : ''}</td><td>${escH(r.item)}</td><td>◉ ${r.price}</td></tr>`).join('')}</tbody></table>`;
  }
  function render() {
    const sh = ensure(s.village); sh.unseen = 0;
    const head = `<div class="currency-banner">◉ <strong>${fmt(s.village.coins)} เหรียญ</strong> · ขายแล้ว ${sh.sold} ชิ้น · รายได้รวม ◉ ${fmt(sh.earned)}</div>
      <div class="pshop-tabs">${elButton('ชั้นวาง', "PlayerShopUI.tab('shelf')", false, tab === 'shelf' ? 'primary' : '')}${elButton('สมุดยอดขาย', "PlayerShopUI.tab('log')", false, tab === 'log' ? 'primary' : '')}</div>`;
    const body = tab === 'log' ? ledgerHtml(sh) : choosing >= 0 ? chooserHtml(choosing) : shelfHtml(sh);
    villageDialog('ร้านของเรา', head + body + '<p class="muted small">ชาวบ้านที่มาตลาดแวะดูร้านทุกชั่วโมง · ตั้งราคาสูงขายยากขึ้น · คนที่ชอบของนั้นจ่ายเพิ่ม 20% · ถ้าเกรเวนอยู่ในตลาด ลูกค้าบางส่วนจะไปร้านเขา</p>');
  }
  const done = () => { try { save() } catch (e) { } try { root.render?.() } catch (e) { } render() };
  root.PlayerShopUI = {
    open() { tab = 'shelf'; choosing = -1; render() },
    tab(t) { tab = t; choosing = -1; render() },
    choose(i) { choosing = i; render() },
    put(kind, id) { const why = kind === 'gear' ? placeGear(s, id, 1) : placeBag(s, id, 1); if (why) toast(why); else { ensure(s.village).last ??= hourOf(s) } choosing = -1; done() },
    grow() { if (s.village.location !== 'market') return; const why = upgrade(s); if (why) toast(why); done() },
    back(i) { if (s.village.location !== 'market') return; takeBack(s, i); done() },
    mult(i, d) { const sl = ensure(s.village).slots[i]; if (sl) setMult(s, i, sl.mult + d); done() }
  };
  if (typeof openPanel === 'function') { const base = openPanel; openPanel = function (w) { if (w === 'shop') { if (typeof busy !== 'undefined' && busy) return; root.PlayerShopUI.open(); return } return base.apply(this, arguments) } }

  /* ---------- toast + news ---------- */
  function toast(msg) {
    let el = document.getElementById('pshopToast');
    if (!el) { el = document.createElement('div'); el.id = 'pshopToast'; el.setAttribute('role', 'status'); document.body.appendChild(el) }
    el.textContent = msg; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 4200);
  }
  function mind() {
    const vt = root.VillageTown; for (const f of [vt?.marketFrame, vt?.frame]) { try { const M = f?.contentWindow?.Mind; if (M?.emit) return M } catch (e) { } }
    return null;
  }
  function deliverNews(sh) {
    if (!sh.news.length) return; const M = mind(); if (!M) return;
    for (const n of sh.news.splice(0)) { try { M.emit('shop:sale', { who: n.who || undefined, whoName: n.who ? undefined : 'ชาวบ้าน', result: n.item, gold: n.price, t: n.t }) } catch (e) { } }
    try { save() } catch (e) { }
  }
  function excluded() { const v = s.village, out = new Set(); for (const p of [...(v.party || []), ...(v.bench || [])]) if (p?.key) out.add(p.key); return out }
  function tick() {
    if (!s?.village || root.TitleScreen?.active) return;
    const sh = ensure(s.village), VL = root.VillageLife;
    const sales = simulate(s, { ...OPT(), people: VL?.P || {}, present: VL?.present, excluded: excluded() });
    if (sales.length) {
      try { save() } catch (e) { }
      const total = sales.reduce((a, r) => a + r.price, 0);
      toast(sales.length === 1 ? `ร้านของเรา: ${sales[0].whoName || 'ชาวบ้าน'} ซื้อ ${sales[0].item} · ◉ +${total}` : `ร้านของเรา: ขายได้ ${sales.length} ชิ้น · ◉ +${total}`);
      try { root.render?.() } catch (e) { }
      if (document.getElementById('panel')?.open && document.getElementById('panelTitle')?.textContent === 'ร้านของเรา') render();
    }
    deliverNews(sh);
  }
  const st = document.createElement('style');
  st.textContent = `.pshop-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin:10px 0}
.pshop-slot{position:relative;border:1px solid rgba(90,60,30,.35);border-radius:10px;padding:10px 10px 8px;display:flex;flex-direction:column;gap:4px;background:rgba(255,250,235,.6)}
.pshop-slot.empty{border-style:dashed;opacity:.85;align-items:center;justify-content:center;min-height:120px}
.pshop-slot small{opacity:.75}.pshop-n{position:absolute;top:6px;right:8px;font-size:11px;opacity:.5}
.pshop-price{display:flex;align-items:center;gap:6px}.pshop-price strong{flex:1;text-align:center}.pshop-price button{min-width:30px;padding:2px 6px}
.pshop-tabs{display:flex;gap:6px;margin:8px 0}.pshop-log{width:100%;border-collapse:collapse;font-size:13px}.pshop-log td,.pshop-log th{padding:4px 6px;border-bottom:1px solid rgba(90,60,30,.2);text-align:left}
#pshopToast{position:fixed;left:50%;bottom:22px;transform:translate(-50%,20px);background:#3b2a18;color:#fbefd6;padding:9px 16px;border-radius:999px;font-size:14px;opacity:0;pointer-events:none;transition:.3s;z-index:9999;box-shadow:0 6px 18px rgba(0,0,0,.3)}
#pshopToast.on{opacity:1;transform:translate(-50%,0)}`;
  document.head.appendChild(st);
  setInterval(tick, 2000);
  root.PlayerShop = { ...core, tick, toast };
})(typeof globalThis !== 'undefined' ? globalThis : this);

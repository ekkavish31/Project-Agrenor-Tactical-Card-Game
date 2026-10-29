/* v95.10 · F3 · ways to get new cards after the intro (cards go into the collection s.village.cardPool through StarterKit.unlock).
   1. Card shop at the market ("ร้านการ์ด" at the buy/sell counter): 4 offers a day from the cards the hero does not own yet, priced by tier.
   2. Boss drops on the world map: beating a destination's boss gives one card the hero does not own (rare tier first).
   3. Trainers in the village: Sigrid (inn), Sister Orla (temple) and Olwen (inn) teach the cards of their own line for gold —
      a "📖 เรียนท่า" button in their talk box (js/interior.js asks CardSources.teaches(id) / CardSources.teach(id)).
   Old saves without a collection already use every card, so the shop says so and sells nothing. */
(function (root) {
  'use strict';
  const G = () => (typeof s !== 'undefined' ? s : null), V = () => G()?.village;
  const D = () => root.TacticsDecks;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const doSave = () => { try { save() } catch (e) { } }, doRender = () => { try { render() } catch (e) { } try { root.VillageTown?.sync?.() } catch (e) { } };
  const toast = (h, k) => root.StoryToast?.(h, k);

  /* tiers (price in gold). Cards not listed here are never sold (basics every deck already has). */
  const TIER = {
    common: { price: 60, label: 'ทั่วไป', cards: ['c:skill', 'c:line', 'c:pull', 'c:wall', 'c:gust', 'c:mend', 'c:aimed', 'm:sprint', 'm:creep'] },
    uncommon: { price: 110, label: 'หายาก', cards: ['c:twin', 'c:whirl', 'c:flame', 'c:frost', 'c:spell', 'c:tide', 'c:formation', 'c:evade', 'c:firstAid', 'c:climb', 'm:dash'] },
    rare: { price: 180, label: 'หายากมาก', cards: ['c:thunder', 'c:quake', 'c:backstab', 'c:dive', 'c:counter', 'c:ambush', 'c:rockfall', 'c:perch'] }
  };
  const TRAINERS = {
    sigrid: { line: 'ทหารรับจ้าง · ท่าแนวหน้า', cards: ['c:whirl', 'c:wall', 'c:counter', 'c:twin'] },
    orla: { line: 'นักบวชวิหารธาตุดิน · ท่าผืนดินและการรักษา', cards: ['c:mend', 'c:quake', 'c:firstAid', 'c:rockfall'] },
    olwen: { line: 'จอมเวทเกษียณ · ท่าเวท', cards: ['c:spell', 'c:frost', 'c:flame', 'c:thunder'] }
  };
  const parse = k => { const [g, id] = k.split(':'); return { group: g === 'm' ? 'movement' : 'combat', id } };
  const tierOf = k => Object.entries(TIER).find(([, t]) => t.cards.includes(k))?.[0] || 'common';
  const nameOf = k => { const { group, id } = parse(k), d = D(); return (group === 'movement' ? d?.MOVE : d?.COMBAT)?.[id]?.name || id };
  const owned = k => { const { group, id } = parse(k); return (V()?.cardPool?.[group]?.[id] || 0) > 0 };
  const legacy = () => !V()?.cardPool;
  const allCards = () => Object.values(TIER).flatMap(t => t.cards);
  function seeded(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
  function buy(k, price, opt) {
    const v = V(); if (!v) return false; if ((v.coins || 0) < price) { toast('เงินไม่พอ · ต้องใช้ ' + price + ' 💰'); return false }
    v.coins -= price; const c = parse(k); root.StarterKit?.unlock?.([{ group: c.group, id: c.id, n: 1 }], opt); doSave(); doRender(); return true;
  }

  /* ---------- 1 · card shop ---------- */
  function offers() {
    const v = V(), day = G()?.day || 1, sh = (v.cardShop ||= {});
    if (sh.day !== day) { const r = seeded(day * 7919 + 13), pool = allCards().filter(k => !owned(k)); sh.day = day; sh.list = []; sh.sold = [];
      for (let i = 0; i < 4 && pool.length; i++) sh.list.push(pool.splice(Math.floor(r() * pool.length), 1)[0]); doSave() }
    return sh;
  }
  function renderShop() {
    if (typeof villageDialog !== 'function') return;
    if (legacy()) { villageDialog('ร้านการ์ด', '<p>เซฟนี้ใช้การ์ดได้ทุกใบอยู่แล้ว (เซฟจากก่อนมีระบบคอลเลกชัน) จึงไม่มีอะไรต้องซื้อ</p>'); return }
    const sh = offers(), v = V();
    const rows = sh.list.map((k, i) => { const t = TIER[tierOf(k)], sold = sh.sold.includes(k) || owned(k), html = root.CardStudio?.renderCard?.((parse(k).group === 'movement' ? 'm-' : 'a-') + parse(k).id, { mini: true }) || '';
      return `<article class="cs-offer ${sold ? 'sold' : ''}"><div class="cs-card">${html || `<div class="ck-plain">${esc(nameOf(k))}</div>`}</div><h3>${esc(nameOf(k))}</h3><p class="muted small">${esc(t.label)}</p>
        <button type="button" data-buy="${i}" ${sold || (v.coins || 0) < t.price ? 'disabled' : ''}>${sold ? 'ซื้อแล้ว' : '◉ ' + t.price}</button></article>` }).join('');
    villageDialog('ร้านการ์ด · วันที่ ' + (G().day || 1), `<p>◉ ${v.coins || 0} เหรียญ · การ์ดเปลี่ยนทุกวัน มีแต่ใบที่ยังไม่มีในคอลเลกชัน</p><div class="cs-offers">${rows || '<p>มีการ์ดครบทุกใบในร้านแล้ว</p>'}</div>
      <p class="muted small">ได้การ์ดเพิ่มอีกทาง: ล้มบอสบนแผนที่โลก · เรียนท่ากับซิกริด ซิสเตอร์ออร์ลา หรือโอลเวน</p>`);
    document.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => { const k = sh.list[+b.dataset.buy], t = TIER[tierOf(k)];
      if (buy(k, t.price, { kicker: 'ร้านการ์ด', title: nameOf(k), text: 'เพิ่มเข้าคอลเลกชันแล้ว · จัดสำรับได้ที่บ้าน' })) { sh.sold.push(k); doSave(); try { document.querySelector('dialog[open]')?.close() } catch (e) { } } });
  }

  /* ---------- 2 · boss drop (called from the world map) ---------- */
  function bossDrop(bossName) {
    if (legacy()) return Promise.resolve(null);
    const pick = ['rare', 'uncommon', 'common'].map(t => TIER[t].cards.filter(k => !owned(k))).find(l => l.length);
    if (!pick) return Promise.resolve(null);
    const k = pick[Math.floor(Math.random() * pick.length)], c = parse(k);
    return Promise.resolve(root.StarterKit?.unlock?.([{ group: c.group, id: c.id, n: 1 }], { kicker: 'ของจากบอส', title: nameOf(k), text: (bossName ? bossName + ' ทิ้งไว้ · ' : '') + 'เพิ่มเข้าคอลเลกชันแล้ว' })).then(() => k);
  }

  /* ---------- 3 · trainers ---------- */
  function teaches(id) { return !!TRAINERS[id] && !legacy() }
  function teach(id) {
    const T = TRAINERS[id]; if (!T || typeof villageDialog !== 'function') return;
    const v = V(), who = root.VillageLife?.P?.[id]?.name || id;
    const rows = T.cards.map((k, i) => { const t = TIER[tierOf(k)], price = Math.round(t.price * .85), has = owned(k);
      return `<li><b>${esc(nameOf(k))}</b> <small class="muted">${esc(t.label)}</small> <button type="button" data-learn="${i}" ${has || (v.coins || 0) < price ? 'disabled' : ''}>${has ? 'รู้แล้ว' : 'เรียน ◉ ' + price}</button></li>` }).join('');
    villageDialog('เรียนท่ากับ' + who, `<p>${esc(T.line)} · ถูกกว่าร้านการ์ด 15%</p><ul class="cs-teach">${rows}</ul><p class="muted small">◉ ${v.coins || 0} เหรียญ</p>`);
    document.querySelectorAll('[data-learn]').forEach(b => b.onclick = () => { const k = T.cards[+b.dataset.learn], price = Math.round(TIER[tierOf(k)].price * .85);
      if (buy(k, price, { kicker: who + ' สอนท่าใหม่', title: nameOf(k), text: 'เพิ่มเข้าคอลเลกชันแล้ว' })) { try { document.querySelector('dialog[open]')?.close() } catch (e) { } try { root.Mind?.emit?.('train:learn', { who: id }) } catch (e) { } } });
  }

  /* ---------- hooks into the market and the panel system ---------- */
  function hook() {
    if (typeof placeActions === 'function' && !placeActions.cardShop) {
      const base = placeActions;
      placeActions = function () { const a = base.apply(this, arguments); try { if (V()?.location === 'market') a.push({ id: 'cards', name: 'ร้านการ์ด', image: 'action-orders', kind: 'panel', value: 'cardshop', cost: 'วันละ 4 ใบ', effect: 'การ์ดที่ยังไม่มี', with: ['buy', 'sell', 'shop'] }) } catch (e) { } return a };
      placeActions.cardShop = true; for (const k in base) if (!(k in placeActions)) placeActions[k] = base[k];
    }
    if (typeof openPanel === 'function' && !openPanel.cardShop) { const base = openPanel; openPanel = function (w) { if (w === 'cardshop') { renderShop(); return } return base.apply(this, arguments) }; openPanel.cardShop = true }
  }
  if (document.readyState !== 'loading') setTimeout(hook, 0); else document.addEventListener('DOMContentLoaded', () => setTimeout(hook, 0));
  root.CardSources = { TIER, TRAINERS, offers, renderShop, bossDrop, teaches, teach, hook };
})(globalThis);

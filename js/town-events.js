/* v97.68 · T8 phase 2: something happening in town today (docs/TODO.md "T ที่อยู่ เมือง แฟคชั่น และการปกครอง").
   Each world-map town has at most one event a day (seeded by town and day, about 2 days in 3). The town's policy this month
   makes its own event three times as likely:
     festival → 🎪 festival games      tax_high → 💰 a toll at the gate (waived at standing "นับถือ" 50+)
     tax_low  → 🙏 a collection for the bridge   trade → 🐫 a foreign caravan buys your whole wagon at +15 %
     safety   → 🛡 the guard asks for help on a patrol (may turn into a fight)
   and any policy can bring 🗝 a thief in the market (a rogue or a ranger catches him more often).
   One go per event per day: S.townEv[id] = day. The world map calls arrive() on entry and act() from the town card. */
(function (root) {
  'use strict';
  const EVENTS = {
    games: { policy: 'festival', icon: '🎪', name: 'งานเทศกาล', text: 'ซุ้มเกมยิงเป้าและปาห่วงเต็มลาน · เล่นรอบละ 5 💰', button: '🎯 เล่นเกม 5 💰', cost: 5 },
    toll: { policy: 'tax_high', icon: '💰', name: 'ด่านเก็บภาษี', text: 'ยามที่ประตูเก็บภาษีผ่านเมือง 5% ของเงินที่พก (ไม่เกิน 25)', auto: true },
    collect: { policy: 'tax_low', icon: '🙏', name: 'เรี่ยไรซ่อมสะพาน', text: 'ชาวเมืองเรี่ยไรเงินซ่อมสะพานข้ามลำธาร', button: '🙏 บริจาค 20 💰', cost: 20 },
    caravan: { policy: 'trade', icon: '🐫', name: 'คาราวานต่างแดน', text: 'คาราวานจากแดนไกลรับซื้อสินค้าทั้งเกวียน ให้ราคาดีกว่าตลาด 15%', button: '🐫 ขายสินค้าทั้งเกวียน' },
    patrol: { policy: 'safety', icon: '🛡', name: 'ยามขอคนช่วยลาดตระเวน', text: 'กองยามขอคนช่วยเดินตรวจรอบเมือง 4 ชั่วโมง · ค่าแรง 15 💰 · อาจเจอโจร', button: '🛡 ช่วยลาดตระเวน' },
    thief: { policy: null, icon: '🗝', name: 'ขโมยวิ่งราว', text: 'มีคนตะโกนว่าขโมย! ชายคนหนึ่งวิ่งหนีเข้าซอกตลาด', button: '🏃 วิ่งไล่จับ' }
  };
  const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; h ^= h >>> 15; return h >>> 0 };
  const day = () => { try { return root.WorldState?.game?.()?.day || 1 } catch (e) { return 1 } };
  const ST = () => root.Settlements, F = () => root.Factions;
  const townName = id => ST()?.SETTLEMENTS?.[id]?.name || id, ruler = id => ST()?.SETTLEMENTS?.[id]?.ruler || 'village';
  /* today's event in a town, or null */
  function today(id, d = day()) {
    if (!ST()?.SETTLEMENTS?.[id]) return null; const h = hash(id + ':' + d);
    if (h % 3 === 0) return null;
    const pol = ST().policy(id), pool = Object.entries(EVENTS).flatMap(([k, E]) => Array(E.policy === pol ? 3 : E.policy ? 0 : 1).fill(k));
    /* events of other policies never come; the thief comes under any policy */
    const k = pool[(h >>> 4) % pool.length]; return { id: k, ...EVENTS[k] };
  }
  const done = (S, id) => (S.townEv?.[id] || 0) === day();
  const mark = (S, id) => { (S.townEv ||= {})[id] = day() };
  /* on entering: automatic events (the toll) · returns log lines */
  function arrive(S, id) {
    const E = today(id); if (!E?.auto || done(S, id)) return []; mark(S, id);
    if ((F()?.rep(ruler(id)) || 0) >= 50) return [E.icon + ' ' + E.name + ': ยามจำคุณได้ ยกเว้นภาษีให้'];
    const t = Math.min(25, Math.max(0, Math.floor((S.gold || 0) * .05))); S.gold = (S.gold || 0) - t;
    return t ? [E.icon + ' จ่ายภาษีผ่านเมือง' + townName(id) + ' ' + t + ' 💰'] : [];
  }
  /* what the town card shows: { html, button } — button is null when there is nothing to do */
  function card(S, id) {
    const E = today(id); if (!E) return null;
    const off = done(S, id), lack = E.cost && (S.gold || 0) < E.cost, empty = E.id === 'caravan' && !Object.keys(S.cargo || {}).length;
    return { html: `<div style="font-size:12.5px;margin:6px 0;padding:7px 10px;border-radius:10px;background:#f6d77a44;border:1px solid #c9902e88">${E.icon} <b>วันนี้: ${E.name}</b> — ${E.text}${off && !E.auto ? ' <small>(ทำไปแล้ววันนี้)</small>' : ''}</div>`,
      button: E.auto || off ? null : { label: E.button, value: 'event', disabled: !!(lack || empty) } };
  }
  /* do today's event · ctx = { rng, battle(): Promise<'win'|…>, passTime(h), job } · returns the lines to show */
  async function act(S, id, ctx = {}) {
    const E = today(id), r = ctx.rng || Math.random; if (!E || E.auto || done(S, id)) return [];
    const R = ruler(id), out = [];
    if (E.cost) { if ((S.gold || 0) < E.cost) return ['เงินไม่พอ']; S.gold -= E.cost }
    mark(S, id);
    if (E.id === 'games') {
      const x = r(); if (x < .3) { S.gold += 25; out.push('🎯 ยิงเข้าเป้ากลาง! ได้รางวัล 25 💰') } else if (x < .65) { S.food = (S.food || 0) + 3; out.push('🎁 ได้ขนมเทศกาลกลับไป เสบียง +3') } else if (x < .85) { S.potions = (S.potions || 0) + 1; out.push('🎁 ได้ยาฟื้นฟูเป็นรางวัลปลอบใจ') } else out.push('😅 พลาดทุกนัด แต่สนุกดี');
      F()?.add(R, 1, 'ร่วมงานเทศกาลที่' + townName(id));
    } else if (E.id === 'collect') { F()?.add(R, 4, 'บริจาคซ่อมสะพานที่' + townName(id)); out.push('🙏 ชาวเมืองขอบคุณ · ชื่อเสียงกับ' + (F()?.FACTIONS[R]?.name || R) + ' +4') }
    else if (E.id === 'caravan') {
      let got = 0, n = 0; for (const [k, q] of Object.entries(S.cargo || {})) { got += Math.round(q * ST().sellPrice(id, k) * 1.15); n += q }
      S.cargo = {}; S.gold += got; S.traded = (S.traded || 0) + n; F()?.add('merchants', 2, 'ขายสินค้าให้คาราวานต่างแดน'); out.push('🐫 ขายสินค้า ' + n + ' ชิ้นให้คาราวาน ได้ ' + got + ' 💰');
    } else if (E.id === 'patrol') {
      ctx.passTime?.(4);
      if (r() < .3 && ctx.battle) { out.push('⚔ เจอโจรขณะลาดตระเวน!'); const res = await ctx.battle(); if (res !== 'win') { out.push('ยามช่วยไล่โจรไปได้ แต่ไม่ได้ค่าแรง'); return out } S.gold += 15; F()?.add(R, 2, 'ปราบโจรระหว่างลาดตระเวน') }
      S.gold += 15; F()?.add(R, 3, 'ช่วยยามลาดตระเวนที่' + townName(id)); const f = root.Law?.file(S, id); if (f?.heat) f.heat--; out.push('🛡 ลาดตระเวนครบ ได้ค่าแรง' + (out.length ? ' และรางวัลปราบโจร' : '') + ' · ชื่อเสียง +3');
    } else if (E.id === 'thief') {
      const quick = ['rogue', 'ranger'].includes(ctx.job); if (r() < (quick ? .8 : .5)) { S.gold += 10; F()?.add(R, 3, 'จับขโมยที่' + townName(id)); out.push('🗝 จับขโมยได้! เจ้าของร้านให้ 10 💰 · ชื่อเสียง +3') } else out.push('💨 ขโมยหายเข้าซอยไปแล้ว');
    }
    return out;
  }
  root.TownEvents = { EVENTS, today, arrive, card, act };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TownEvents;
})(typeof window !== 'undefined' ? window : globalThis);

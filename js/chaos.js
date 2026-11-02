/* v98.66 · แก่นโกลาหล (Grat) — what an EVOLVED monster leaves behind (phase 2 of monster evolution, js/flat-battle.js evolveCheck).
   • Kill an evolved monster → a GUARANTEED chaos item for its tier and lineage:
       tier 1 (→ elite) เศษแก่น · tier 2 (→ mini-boss) แก่น · tier 3 (→ boss) ผลึก   ×   lineage by the new form's element: ราตรี dark · น้ำแข็ง ice · ผืนดิน earth
   • Its ordinary drops (the new form's table) come at HALF the chance of the real monster (each roll 50 %). A boss-rank evolution keeps the same halving.
   • Collecting chaos items unlocks Grat (chaos) battle cards: total 3 → ประกายโกลาหล · 8 → ฉีกกระแสโกลาหล · 15 → ผนึกโกลาหล (queued like level-up cards).
   • Weapons that need several of the items: see ZONE_RECIPES in js/progression.js (chaosFang · chaosMaul · rimeChaosBlade).
   Data: g.village.chaos = { total, line:{dark,ice,earth}, tier:{1,2,3} }. Pure functions on the save → tools/test-chaos.cjs. */
(function (root) {
  'use strict';
  const LINES = { dark: { th: 'ราตรี', k: 'Dephor' }, ice: { th: 'น้ำแข็ง', k: 'Nytha' }, earth: { th: 'ผืนดิน', k: 'Yalm' } };
  const TIER = { 1: { id: 'chaosShard', th: 'เศษแก่นโกลาหล', rarity: 'good', price: 30 }, 2: { id: 'chaosCore', th: 'แก่นโกลาหล', rarity: 'rare', price: 90 }, 3: { id: 'chaosCrystal', th: 'ผลึกโกลาหล', rarity: 'rare', price: 220 } };
  const cap = s => s[0].toUpperCase() + s.slice(1);
  const itemId = (tier, line) => TIER[tier].id + cap(LINES[line] ? line : 'dark');
  /* the bag entries (merged into AdventureData.GOODS by adventure-data.js) */
  const GOODS = {};
  for (const t of [1, 2, 3]) for (const l of Object.keys(LINES)) GOODS[itemId(t, l)] = {
    name: TIER[t].th + ' · ' + LINES[l].th, element: 'chaos', rarity: TIER[t].rarity, use: 'คราฟต์', price: TIER[t].price,
    text: ['', 'เศษผลึกที่หลุดจากร่างที่บิดเบี้ยว', 'แก่นที่ยังสั่นไหวตามความโกลาหล', 'ผลึกแห่งความเป็นไปได้ที่ถูกบีบจนแข็ง'][t] + ' · สายเดียวกับ ' + LINES[l].k + ' · ใช้ตีอาวุธโกลาหล'
  };
  const UNLOCKS = [{ at: 3, id: 'chaosBolt' }, { at: 8, id: 'chaosRend' }, { at: 15, id: 'chaosWard' }];
  const st = g => { const v = (g.village ||= {}); const c = (v.chaos ||= { total: 0, line: {}, tier: {} }); c.line ||= {}; c.tier ||= {}; c.total ||= 0; c.cards ||= []; return c };

  /* evolved kills of one battle: [{ kind, tier, line }] → { items:{id:n}, half:[kind…] }  (half = kinds whose ordinary table is rolled at 50 %) */
  function dropFor(kills, rnd = Math.random) {
    const items = {}, half = [];
    for (const k of kills || []) {
      const tier = Math.min(3, Math.max(1, k.tier | 0 || 1)), id = itemId(tier, k.line);
      const extra = tier === 1 ? .35 : tier === 2 ? .25 : 0;
      items[id] = (items[id] || 0) + 1 + (rnd() < extra ? 1 : 0);
      half.push(k.kind);
    }
    return { items, half };
  }
  /* the ordinary drops of an evolved kill: every roll succeeds only half the time */
  const halfRolls = (pool, rnd = Math.random) => (pool || []).filter(() => rnd() < .5);

  /* record what dropped; returns the cards that unlocked (also queued in g.village.levelUnlocks) */
  function note(g, items) {
    const c = st(g), out = [];
    for (const [id, n] of Object.entries(items || {})) {
      const m = /^chaos(Shard|Core|Crystal)(Dark|Ice|Earth)$/.exec(id); if (!m) continue;
      c.total += n; const line = m[2].toLowerCase(), tier = m[1] === 'Shard' ? 1 : m[1] === 'Core' ? 2 : 3;
      c.line[line] = (c.line[line] || 0) + n; c.tier[tier] = (c.tier[tier] || 0) + n;
    }
    for (const u of UNLOCKS) if (c.total >= u.at && !c.cards.includes(u.id)) { c.cards.push(u.id); out.push(u.id); (g.village.levelUnlocks ||= []).push({ level: 'chaos', cards: [{ group: 'combat', id: u.id, n: 1 }] }) }
    return out;
  }
  const api = { LINES, TIER, GOODS, UNLOCKS, itemId, dropFor, halfRolls, note, st };
  root.Chaos = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

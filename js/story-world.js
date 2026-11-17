/* v98.489 · โลกเปลี่ยนตามเนื้อเรื่อง: ราคา + ข่าว (docs/PROPOSAL-WORLD-CHANGE-TH.md §3 §6 — เจ้าของสั่งทำต่อ 14 พ.ย. 2026)
   ไม่มีระบบเวลาใหม่ — อ่านจาก MainStory.war(g) (ช่วงสงคราม 0–4) · infection(g, เมือง) · ธง afterWorld (ตอนจบ: easing | strict | blackmarket | high)
   • mult(town, good) = ตัวคูณราคาที่ Settlements.swing เรียก → ใช้กับทั้งราคาซื้อ/ขายสินค้าการค้าและของใช้ (food, potion) · เบาไว้ก่อน (สูงสุดราว +45%) ปรับค่าที่ตาราง WAR / AFTER
   • describe(g, town) = บรรทัดข่าวราคา (กระดานข่าวสงคราม + ข่าวตลาด) · ไม่แต่งเหตุการณ์ใหม่ อธิบายแค่ผลที่คำนวณได้จริง
   เทสต์: tools/test-story-world.cjs */
(function (root) {
  'use strict';
  const MS = () => root.MainStory;
  const game = () => { try { return root.WorldState?.game?.() || null } catch (e) { return null } };
  const num = (x, d = 0) => Number.isFinite(+x) ? +x : d;
  /* ตัวคูณตามช่วงสงคราม (war 1 = ข่าวลือ ยังไม่กระทบราคา) */
  const WAR = {
    2: { iron: 1.10, ore: 1.08, salt: 1.10 },
    3: { iron: 1.22, ore: 1.18, salt: 1.15, fish: 1.12, food: 1.12, potion: 1.10, cloth: 1.08, crystal: 1.12 },
    4: { iron: 1.32, ore: 1.25, salt: 1.20, fish: 1.18, food: 1.20, potion: 1.20, cloth: 1.12, crystal: 1.15, wood: 1.08 }
  };
  /* ผลเฉพาะที่: แนวหน้าต้องการเหล็ก · นครหลวงกว้านผลึก · เมืองที่ติดเชื้อหนักอาหารขาด (infection ≥ 2) */
  const LOCAL = { northgate: { iron: 1.08, potion: 1.08 }, lakenhold: { crystal: 1.10 }, deepcairn: { crystal: 1.08 } };
  /* หลังจบ (afterWorld ← ตอนจบ): easing = ทางที่สาม · strict = ผู้เฝ้าแสง · blackmarket = นักล่าเงา · high = อัลเดรนชนะ */
  const AFTER = {
    easing: { _: 1.0, iron: .96, food: .96 },
    strict: { _: 1.08 },
    blackmarket: { _: 1.04, crystal: 1.15 },
    high: { _: 1.18, food: 1.22, potion: 1.15 }
  };
  const NAME = { iron: 'เหล็ก', ore: 'แร่', salt: 'เกลือ', fish: 'ปลา', food: 'เสบียง', potion: 'ยา', cloth: 'ผ้า', crystal: 'ผลึก', wood: 'ไม้' };
  function mult(town, good, g = game()) {
    const M = MS(); if (!M || !g || good === 'inn') return 1;
    const war = M.war(g), ending = M.flag(g, 'afterWorld'); let m = 1;
    if (war >= 2) { const t = WAR[Math.min(4, war)] || {}; m *= t[good] || 1; m *= (LOCAL[town] || {})[good] || (war >= 3 ? 1 : 1);
      if ((good === 'food' || good === 'fish') && M.infection(g, town) >= 2) m *= 1.08 }
    if (ending && AFTER[ending]) { const a = AFTER[ending]; m *= a[good] || a._ || 1; if (ending === 'blackmarket' && town === 'haven') m *= .93 }
    return Math.max(.85, Math.min(1.5, Math.round(m * 1000) / 1000));
  }
  /* บรรทัดข่าวราคา: เรียงตามที่ขึ้น/ลงมากสุด (≥ 6%) สูงสุด n บรรทัด */
  function describe(g, town, n = 3) {
    const goods = Object.keys(NAME), rows = goods.map(k => [k, mult(town, k, g)]).filter(([, v]) => Math.abs(v - 1) >= .06).sort((a, b) => Math.abs(b[1] - 1) - Math.abs(a[1] - 1)).slice(0, n);
    return rows.map(([k, v]) => (v > 1 ? '📈 ' : '📉 ') + NAME[k] + (v > 1 ? 'แพงขึ้นประมาณ ' : 'ถูกลงประมาณ ') + Math.round(Math.abs(v - 1) * 100) + '%' + (reason(g, k, v)));
  }
  function reason(g, k, v) { const M = MS(), e = M?.flag(g, 'afterWorld'); if (e) return ({ easing: ' (หลังสงบศึก)', strict: ' (ด่านเข้มงวด)', blackmarket: ' (ตลาดเงา)', high: ' (หลังสงคราม)' })[e] || ''; return M && M.war(g) >= 2 ? ' (ช่วงสงคราม)' : '' }
  const api = { mult, describe, WAR, AFTER, LOCAL };
  root.StoryWorld = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

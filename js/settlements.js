/* v97.43 · T1: the settlements of the valley as data (docs/TODO.md "T ที่อยู่ เมือง แฟคชั่น และการปกครอง").
   size: village · town · city  — decides the defence (village watch · town guard · city garrison with a general) and the land price.
   ruler: the faction that governs it (js/factions.js) — your standing with it changes prices there.
   goods: what is cheap there (made locally) and what is dear (brought in) — the base for trade runs later (T6 / L3).
   land: weekly rent for a plot inside the walls (T4) · outside the walls land is free but raided (T5).
   Fernvale is the home village; the other three are the towns placed on the world map by js/world-gen.js (TOWNS). */
(function (root) {
  'use strict';
  const SIZE = {
    village: { name: 'หมู่บ้าน', defence: 'ยามหมู่บ้าน', guards: 2, safety: .55 },
    town: { name: 'เมือง', defence: 'กองยามประจำเมือง', guards: 8, safety: .75 },
    city: { name: 'เมืองใหญ่', defence: 'กองทหารรักษาการณ์และแม่ทัพ', guards: 30, safety: .92 }
  };
  const GOODS = { food: 'เสบียง', potion: 'ยาฟื้นฟู', iron: 'แท่งเหล็ก', wood: 'ไม้', fish: 'ปลาเค็ม', salt: 'เกลือ', cloth: 'ผ้าทอ', herbs: 'สมุนไพร', fur: 'ขนสัตว์', ore: 'แร่' };
  const SETTLEMENTS = {
    fernvale: { name: 'หมู่บ้านเฟิร์นเวล', size: 'village', ruler: 'village', leader: 'ผู้ใหญ่บ้านโอเรน', land: 15, cheap: ['wood', 'herbs', 'food'], dear: ['salt', 'ore'],
      text: 'หมู่บ้านบ้านเกิดริมป่า มีโรงตีเหล็ก ตลาดเล็ก และสมาคมนักผจญภัย' },
    brookmere: { name: 'หมู่บ้านบรู๊คเมียร์', size: 'village', ruler: 'village', leader: 'ผู้ใหญ่บ้านแอนนา', land: 12, cheap: ['food', 'cloth'], dear: ['iron', 'potion'],
      text: 'หมู่บ้านเกษตรเล็ก ๆ ริมลำธาร ทุ่งดอกไม้ล้อมรอบ ผู้คนรู้จักเฟิร์นเวลดี' },
    haven: { name: 'ท่าเรือซอลต์เฮเวน', size: 'city', ruler: 'merchants', leader: 'สภาพ่อค้าแห่งท่าเรือ', land: 60, cheap: ['fish', 'salt', 'potion'], dear: ['wood', 'fur'],
      text: 'เมืองท่าเสียงดัง กลิ่นปลาเค็มและเกลือทะเล เรือสินค้าจอดเรียงเต็มท่า' },
    northgate: { name: 'ด่านหินเหนือ', size: 'town', ruler: 'garrison', leader: 'แม่ทัพเฝ้าด่าน', land: 30, cheap: ['iron', 'ore', 'fur'], dear: ['food', 'herbs'],
      text: 'ด่านหินบนช่องเขา ทหารเฝ้าทางขึ้นเหนือ นักเดินทางแวะพักก่อนข้ามเขา' }
  };
  const BASE = { food: 2.5, potion: 18, inn: 12 };
  /* local price of a good: cheap −25 % · dear +35 % · then your standing with the ruler (−5 % a step) */
  function price(id, good, base) {
    const T = SETTLEMENTS[id]; if (!T) return base; const F = root.Factions;
    const local = T.cheap.includes(good) ? .75 : T.dear.includes(good) ? 1.35 : 1;
    return Math.max(1, Math.round(base * local * (F ? F.priceMult(T.ruler) : 1)));
  }
  const info = id => { const T = SETTLEMENTS[id]; return T && { ...T, id, sizeInfo: SIZE[T.size] } };
  function card(id) {
    const T = info(id); if (!T) return ''; const F = root.Factions, R = F?.FACTIONS[T.ruler], tier = F?.tier(T.ruler);
    const g = list => list.map(k => GOODS[k] || k).join(' · ');
    return `<div style="font-size:12.5px;line-height:1.7;margin:6px 0;padding:8px 10px;border-radius:10px;background:#0001">🏛 <b>${T.sizeInfo.name}</b> · ปกครองโดย ${R ? R.icon + ' ' + R.name : T.ruler} (${T.leader})${tier ? ` · ชื่อเสียงของคุณ: <b style="color:${tier[2]}">${tier[1]}</b>` : ''}<br>🛡 ${T.sizeInfo.defence} · ⬇ ของถูก: ${g(T.cheap)} · ⬆ ของแพง: ${g(T.dear)}<br>🏠 เช่าที่ในเมือง ${T.land} 💰/สัปดาห์ (เปิดเร็ว ๆ นี้) · นอกเมืองจับจองฟรีแต่เสี่ยงโดนบุก</div>`;
  }
  root.Settlements = { SIZE, GOODS, SETTLEMENTS, BASE, price, info, card };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Settlements;
})(typeof window !== 'undefined' ? window : globalThis);

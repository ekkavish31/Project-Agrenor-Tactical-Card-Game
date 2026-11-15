/* v98.505 · แผนที่โลกของแท็บเส้นเรื่อง = ภาพวาดของผู้เขียน 2 ชั้น (ข้อมูลล้วน ไม่วาดเอง)
   • WORLD  docs/lore/maps/world-wide.webp (1870×841)  — ทั้งโลกแนวกว้าง (หมู่เกาะตะวันตก · มหาพงไพรตะวันออก · แดนภูเขาไฟใต้)
   • CLOSE  docs/lore/maps/norchorthal-close.webp (1500×1049) — Nor'Chorthal ใกล้ ๆ · วางทับบนภาพโลกที่ (651,167) ขนาด 732×512 (ซูม 2.05×) — จัดตำแหน่งด้วย template matching (NCC 0.85)
   • ที่ตั้งสถานที่ = ช่อง hex จริงของเกม (js/world-norchorthal.js · marks + js/world-gen.js TOWNS.mark) แปลงเป็นพิกัดภาพโลก: X = 540 + 4.0·(c+.5·(r&1)+.5)·√3 · Y = 44 + 4.0·(1+1.5·r) (ฟิตกับภาพ NCC 0.98)
     deepmine / ruinsite ไม่มี mark ในเกม = ตำแหน่งที่เลือกใกล้ดีปแคร์น / ธอร์นวอตช์ · ย้ายหมุดเองได้ในแท็บ (ลากหมุด → เก็บในเบราว์เซอร์ / ส่งออก JSON)
   • GREY = โหนดเทา กดไม่ได้ · placeholder:true = ตัวยึดที่ยังไม่มีชื่อใน canon · loc:'approx' = ตำแหน่งบนแผนที่เป็นสมมติ · ZONES = โซนอาณาจักร (โดยประมาณ)
   ใช้: StoryMapWorld.{W,H,IMG,CLOSE,WPOS,GREY,ZONES,ROADS,LABELS,hex(c,r),inRect(x,y),isLandHex(c,r)} */
(function (root) {
  'use strict';
  const NC = root.NORCHORTAL || (typeof require === 'function' ? (() => { try { global.window = global; require('./world-norchorthal.js'); return global.NORCHORTAL } catch (e) { return null } })() : null);
  const W = 1870, H = 841, IMG = 'docs/lore/maps/world-wide.webp';
  const CLOSE = { src: 'docs/lore/maps/norchorthal-close.webp', x: 651, y: 167, w: Math.round(1500 / 2.05), h: Math.round(1049 / 2.05), natW: 1500, natH: 1049 };
  const hex = (c, r) => [Math.round(540 + 4.0 * (c + .5 * (r & 1) + .5) * Math.sqrt(3)), Math.round(44 + 4.0 * (1 + 1.5 * r))];
  const tile = (c, r) => NC && c >= 0 && r >= 0 && c < NC.cols && r < NC.rows ? NC.grid[r][c] : 'w';
  const isLandHex = (c, r) => tile(c, r) !== 'w';
  const MARK = { fernvale: NC?.marks.home || [76, 53], brookmere: NC?.marks.brookmere || [35, 66], haven: NC?.marks.haven || [54, 99], northgate: NC?.marks.northgate || [46, 24], lakenhold: [65, 71], willowshore: [54, 71], deepcairn: [67, 31], thornwatch: [81, 44], vinehollow: [74, 88], deepmine: [66, 28], ruinsite: [84, 47] };
  const WPOS = Object.fromEntries(Object.entries(MARK).map(([k, m]) => [k, hex(m[0], m[1])]));
  const g = (id, n, ic, kind, x, y, r, src, more = {}) => ({ id, n, ic, kind, x, y, r, src, ...more });
  const GREY = [
    g('frostmere', 'ฟรอสต์เมียร์', '❄', 'kingdom', 790, 150, 'อาณาจักรมนุษย์ทางเหนือ · คู่สงครามของอัลเดรนที่ฝั่งด่านหินเหนือ · ศาสนา "นิกายรอรุ่งอรุณ" · ตำแหน่งเป็นโดยประมาณ', 'MAIN-STORY-CANON A1 · §H (ชื่อที่เจ้าของมอบให้ตั้ง 14 พ.ย.)', { zone: 'frostmere' }),
    g('southKingdom', 'อาณาจักรใต้ (ยังไม่ตั้งชื่อ)', '🌋', 'kingdom', 1030, 735, "ตัวยึดตำแหน่งแดนภูเขาไฟ Chel'Koranor — canon ยังไม่ระบุว่ามีอาณาจักร/ชื่ออะไร", 'ตัวยึดตามคำสั่งเจ้าของ 15 พ.ย. (ไม่ใช่ canon)', { placeholder: true, zone: 'south' }),
    g('westIsles', 'สหพันธ์เกาะตะวันตก (ยังไม่ตั้งชื่อ)', '⛵', 'kingdom', 458, 380, "ตัวยึดตำแหน่งหมู่เกาะ Duna'Pharinor — canon ยังไม่ระบุอาณาจักร", 'ตัวยึดตามคำสั่งเจ้าของ 15 พ.ย. (ไม่ใช่ canon)', { placeholder: true, zone: 'westIsles' }),
    g('islePort', 'เมืองท่าเกาะ (ยังไม่ตั้งชื่อ)', '⚓', 'city', 398, 595, 'ตัวยึดตำแหน่ง', 'ตัวยึด (ไม่ใช่ canon)', { placeholder: true, zone: 'westIsles' }),
    g('eastIsleKingdom', 'เกาะตะวันออก (ยังไม่ตั้งชื่อ)', '🏝', 'kingdom', 1318, 770, 'ตัวยึดตำแหน่งเกาะเล็กนอกฝั่งตะวันออกเฉียงใต้', 'ตัวยึด (ไม่ใช่ canon)', { placeholder: true }),
    g('elu', 'นครแห่งแสง', '☀', 'city', 1745, 300, "เล่าลือ/ผู้เฝ้าแสงมาจากที่นี่ (Elu'Aetharas ในเอกสารพัฒนา · 13°N 66°E) — จุดเรืองแสงเหลืองในมหาพงไพรตะวันออก · ตำแหน่งบนภาพเป็นการอ่านจากภาพ ไม่ใช่พิกัดทางการ", 'WORLD-GEOGRAPHY · MAIN-STORY-CANON C2', { loc: 'approx' }),
    g('sacredTree', 'ต้นไม้ศักดิ์สิทธิ์', '🌳', 'wonder', 1690, 235, "Shael'Mier'Tas · คุ้มครองและชีวิต (18°N 67°E) · ตำแหน่งบนภาพเป็นสมมติ", 'WORLD-GEOGRAPHY', { loc: 'approx' }),
    g('darkCity', 'นครมืด', '?', 'legend', 1815, 560, 'เรื่องเล่าถึงนครมืดในมหาพงไพร — ไม่ใช่หลักฐานว่ารู้ที่ตั้ง (ตำแหน่งสมมติ)', 'CURRENT-ERA-CANON §B', { loc: 'approx' }),
    g('sixCities', 'หกเมือง', '?', 'legend', 1700, 640, "ต้นทางของนักล่าเงา (Duum'Lorien) — ที่ตั้งยังไม่กำหนด (ตำแหน่งสมมติ)", 'MAIN-STORY-CANON C3/§H', { loc: 'approx' }),
    g('worldTree', 'ต้นไม้โลก', '🌌', 'wonder', 70, 420, "Shael'Itharas · กลไกชำระวิญญาณ · ชายขอบโลกตะวันตกไกล (นอกภาพนี้ · วางที่ขอบซ้ายเป็นทิศ)", 'WORLD-GEOGRAPHY', { loc: 'approx' })
  ];
  /* โซน (hex โดยประมาณ → พิกัดภาพ) · hexPts ใช้วาดบน canvas ตัดด้วยแผ่นดิน */
  const Z = (n, c, hexPts, r, src, more = {}) => ({ n, c, hex: hexPts, pts: hexPts.map(([a, b]) => hex(a, b)), r, src, ...more });
  const ZONES = {
    aldren: Z('ราชอาณาจักรอัลเดรน', '#b07af0', [[28, 42], [38, 30], [44, 20], [54, 20], [62, 26], [74, 22], [88, 34], [96, 52], [94, 76], [84, 96], [60, 104], [38, 96], [24, 72]], 'เฟิร์นเวลและบรู๊คเมียร์อยู่ใต้อิทธิพลราชสำนัก (เขตอิทธิพล = อาณาจักรย่อย) · ขอบเขตโดยประมาณ', 'CURRENT-ERA-CANON §B', { lab: [36, 98] }),
    frostmere: Z('อาณาจักรฟรอสต์เมียร์', '#5aa4f0', [[2, 0], [80, 0], [80, 12], [66, 20], [56, 17], [46, 18], [40, 28], [30, 40], [14, 40], [2, 30]], 'อาณาจักรมนุษย์ทางเหนือ คู่สงครามของอัลเดรน · ขอบเขตโดยประมาณ', 'MAIN-STORY-CANON §H', { lab: [30, 6] }),
    south: Z('อาณาจักรใต้ (ตัวยึด)', '#ff8a4a', [[10, 108], [110, 108], [110, 129], [10, 129]], 'ไม่ใช่ canon', 'ตัวยึด', { dashed: true, lab: [60, 126] }),
    westIsles: Z('สหพันธ์เกาะตะวันตก (ตัวยึด)', '#38d0c0', [[-60, 20], [8, 20], [8, 129], [-60, 129]], 'ไม่ใช่ canon', 'ตัวยึด', { dashed: true, lab: [-30, 6] }),
    wild: Z('มหาพงไพร · ดินแดนร้าง', '#7fd878', [[112, 20], [170, 10], [170, 110], [112, 110]], 'ไม่มีอาณาจักรที่ยืนยัน · ถูกมองว่าเป็นดินแดนร้าง', 'CURRENT-ERA-CANON §B', { hatch: true, lab: [150, 4] })
  };
  const centroid = pts => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
  const LABELS = [...Object.entries(ZONES).map(([k, z]) => ({ t: z.n, c: z.c, p: (z.lab ? hex(z.lab[0], z.lab[1]) : centroid(z.pts).map(Math.round)), zone: k })), { t: "Nul'Duum · แดนหนาว", c: '#e8f0f8', p: [820, 60], region: true }, { t: "Dhai-Nor'Qrad", c: '#e8f0f8', p: [1330, 330], region: true }, { t: "Chel'Koranor", c: '#ffd9c0', p: [1040, 805], region: true }, { t: "Duna'Pharinor", c: '#c8f0ff', p: [300, 250], region: true }];
  const ROADS = [['fernvale', 'lakenhold'], ['fernvale', 'northgate'], ['fernvale', 'deepcairn'], ['fernvale', 'thornwatch'], ['fernvale', 'willowshore'], ['lakenhold', 'willowshore'], ['lakenhold', 'brookmere'], ['brookmere', 'haven'], ['willowshore', 'vinehollow'], ['haven', 'vinehollow'], ['deepcairn', 'northgate'], ['northgate', 'thornwatch'], ['deepcairn', 'deepmine'], ['thornwatch', 'ruinsite']];
  const inRect = (x, y, R = CLOSE) => x >= R.x && x <= R.x + R.w && y >= R.y && y <= R.y + R.h;
  const api = { W, H, IMG, CLOSE, hex, isLandHex, MARK, WPOS, GREY, ZONES, ROADS, LABELS, inRect };
  root.StoryMapWorld = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

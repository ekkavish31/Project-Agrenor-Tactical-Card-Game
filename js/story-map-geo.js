/* v98.506 · เครื่องมือกำหนดพื้นที่/เส้น/จุดบนแผนที่เส้นเรื่อง (แท็บแผนที่ใน story-map.html) + รายการ "สิ่งที่เจ้าของต้องกำหนด"
   ข้อมูล (เก็บใน localStorage 'storyMapGeo' · ส่งออก/นำเข้า JSON):
     zones  [{id,n,kind,c,pts:[[x,y]…],need,status,notes}]    routes [{id,n,kind,pts,need,status,notes}]    points [{id,n,kind,x,y,need,status,notes}]
     needs  { needId: { state:'skip'|'decided', note } }       status: 'proposed' (ข้อเสนอ ยังไม่ใช่ canon) | 'confirmed' (เจ้าของยืนยัน)
   พิกัด = พิกัดภาพโลก (StoryMapWorld.W × H = 1870 × 841)
   NEEDS = สิ่งที่เนื้อเรื่อง/ระบบต้องการให้ผู้เขียนกำหนด · ที่มาอ้างอิงเอกสาร canon/โค้ดจริง — ไม่ได้แต่งชื่อหรือเนื้อหาใหม่ (hex = ตำแหน่งตั้งต้นจากแผนที่ hex ของเกมถ้ามี)
   ใช้: StoryMapGeo.{NEEDS,KINDS,blank,add,remove,find,needStatus,progress,serialize,parse,centroid,pointInPoly,bbox} */
(function (root) {
  'use strict';
  const KINDS = {
    zone: { kingdom: ['อาณาจักร', '#b07af0'], front: ['แนวหน้าสงคราม', '#ff6a5a'], influence: ['เขตอิทธิพล', '#d8b0ff'], murk: ['พื้นที่รอยหมอง', '#9a5ad0'], wild: ['ดินแดนป่า/ร้าง', '#7fd878'], faction: ['เขตของกลุ่ม', '#ffd166'], placeholder: ['ตัวยึด (ยังไม่ตั้งชื่อ)', '#ff8a4a'], other: ['อื่น ๆ', '#9fd4ff'] },
    route: { road: ['ถนน/ทางเดิน', '#f1dc9a'], front: ['เส้นแนวหน้า', '#ff6a5a'], pilgrim: ['ทางผู้แสวงบุญ', '#9fe8ff'], trade: ['เส้นค้าขาย', '#ffd166'], supply: ['เส้นเสบียงสงคราม', '#c8a070'], story: ['เส้นทางในเรื่อง', '#ff9ad8'], other: ['อื่น ๆ', '#cfd8e6'] },
    point: { city: ['เมือง/นคร', '#ffe9a8'], ruin: ['ซากโบราณ', '#c8b8a0'], shrine: ['ศาล/ที่ศักดิ์สิทธิ์', '#bfe8ff'], camp: ['ค่าย/ที่ซ่อน', '#d8c090'], dungeon: ['ถ้ำ/เหมือง/ดันเจี้ยน', '#b090d0'], legend: ['เล่าลือ (ไม่รู้ที่ตั้ง)', '#cfcfcf'], other: ['อื่น ๆ', '#ffffff'] }
  };
  const ICON = { zone: '▱', route: '⟋', point: '📍', decision: '❓' };
  /* hex:[c,r] = ที่ตั้งตั้งต้นจากแผนที่ hex ของเกม (marks ใน js/world-norchorthal.js / DESTS ใน js/world-gen.js) */
  const N = (id, type, label, kind, why, src, more = {}) => ({ id, type, label, kind, why, src, ...more });
  const NEEDS = [
    N('z_aldren', 'zone', 'ขอบเขตราชอาณาจักรอัลเดรน', 'kingdom', 'เฟิร์นเวลและบรู๊คเมียร์อยู่ใต้อิทธิพลราชสำนัก — โซนนี้ตัดสินว่าอีเวนต์ที่เมืองไหนเป็นเรื่องของราชสำนัก/กองทหาร', 'CURRENT-ERA-CANON §B (อัลเดรนอนุมัติแล้ว · ขอบเขตยังไม่กำหนด)', { name: 'ราชอาณาจักรอัลเดรน' }),
    N('z_frostmere', 'zone', 'ขอบเขตอาณาจักรฟรอสต์เมียร์ (ฝ่ายเหนือ)', 'kingdom', 'คู่สงครามของอัลเดรน · ศาสนา "นิกายรอรุ่งอรุณ" · ใช้ตัดสินข่าวลือ/ผู้ลี้ภัย/การรุกจากเหนือ', 'MAIN-STORY-CANON A1 · §H', { name: 'อาณาจักรฟรอสต์เมียร์' }),
    N('z_front', 'zone', 'แนวหน้าสงคราม (ฝั่งด่านหินเหนือ)', 'front', 'บอกว่าสงครามอยู่ตรงไหนของแผนที่ → ระดับ "ใกล้สงคราม" ของแต่ละเมือง ราคาและข่าวใช้ค่านี้', 'MAIN-STORY-CANON A1 (อัลเดรนเสียเปรียบ)'),
    N('z_influence', 'zone', 'เขตอิทธิพลราชสำนักอัลเดรน (อาณาจักรย่อย)', 'influence', 'ใช้แยกหมู่บ้านที่ราชสำนักคุมภาษี/เกณฑ์ทหาร กับหมู่บ้านอิสระ (ระบบชื่อเสียงใช้กลุ่มหมู่บ้านแยกต่างหาก)', 'CURRENT-ERA-CANON §B'),
    N('z_murk1', 'zone', 'รอยหมองระยะ 1 (เริ่มปรากฏ)', 'murk', 'ตอนนี้เกมคำนวณวงรอยหมองจากระยะทางจากดีปแคร์น (js/main-story.js DIST) — ลากวงจริงถ้าอยากควบคุมเอง', 'js/main-story.js · MAIN-STORY-CANON A4'),
    N('z_murk2', 'zone', 'รอยหมองระยะ 2', 'murk', 'วงที่สัตว์รอยหมองเข้าถึงทางหลวง/หมู่บ้านรอบเหมือง', 'js/main-story.js'),
    N('z_murk3', 'zone', 'รอยหมองระยะ 3 (หนักสุด)', 'murk', 'วงรอบปากเหมือง/ดีปแคร์น', 'js/main-story.js'),
    N('z_wild', 'zone', 'ชายป่ามหาพงไพรที่เกมครอบคลุม', 'wild', 'เส้นมหาพงไพร (ranger สองฝ่าย) เกิดที่นี่ · ขอบตะวันออกของแผนที่หลัก', 'CURRENT-ERA-CANON §B (ชายขอบป่าเท่านั้น)'),
    N('z_light', 'zone', 'เขตเคลื่อนไหวของผู้เฝ้าแสง', 'faction', 'พวกเขาออกมาเพราะการขุด Xyriel — อยู่แถวธอร์นวอตช์/ชายป่าตะวันออก', 'MAIN-STORY-CANON C2 · §H (Elu\'Mierwaa)'),
    N('z_shadow', 'zone', 'เขตเคลื่อนไหวของนักล่าเงา', 'faction', 'ติดตาม Mip เพื่อนำทางไปแหล่ง VQ (จากหกเมือง)', 'MAIN-STORY-CANON C3 · §H (Duum\'Lorien)'),
    N('z_south', 'zone', 'อาณาจักรใต้ (แดนภูเขาไฟ) — มีจริงไหม?', 'placeholder', 'ตัวยึดตามที่เจ้าของขอ 15 พ.ย. ยังไม่มีชื่อ/เนื้อหาใน canon · ตัดสินว่าจะมีหรือไม่ แล้วตั้งชื่อ', 'ตัวยึด (ไม่ใช่ canon)'),
    N('z_isles', 'zone', 'สหพันธ์/อาณาจักรหมู่เกาะตะวันตก — มีจริงไหม?', 'placeholder', 'Duna\'Pharinor เป็นหมู่เกาะตะวันตกไกล · ยังไม่ระบุอาณาจักร', 'WORLD-GEOGRAPHY · ตัวยึด'),
    N('r_convoy', 'route', 'เส้นขบวนนักโทษ', 'story', 'ฉากตายตัว "ช่องเขาขบวนนักโทษ" (Crossroads ขบวนนักโทษ) ต้องรู้ว่าขบวนเดินจากไหนไปไหน', 'js/crossroads.js · js/set-pieces.js convoyPass'),
    N('r_mip', 'route', 'ทางที่ Mip วิ่งไปเหมือง', 'story', 'Mip กลายร่าง ก้าวร้าว วิ่งไปเหมือง — เส้นนี้กำหนดว่าผ่านเมืองไหน', 'js/main-story.js (Mip กลายร่าง) · MAIN-STORY-CANON'),
    N('r_pilgrim', 'route', 'ทางผู้แสวงบุญ (ฮิวโก้) จากฟรอสต์เมียร์', 'pilgrim', 'เส้นศรัทธา · ผู้แสวงบุญเล่าความเชื่อสองแบบ — เดินมาจากเหนือผ่านด่านหินเหนือ?', 'story-map-data เส้น ④'),
    N('r_pass', 'route', 'ทางข้ามช่องเขาตะวันออก (ธอร์นวอตช์ → ชายป่า)', 'road', 'ในแผนที่เกมมี "หนึ่งช่องเขา" ข้ามสันเขา Dhai-Nor\'Qrad ที่ปลายมีศาลน้ำแข็ง · ผู้เฝ้าแสงใช้ทางนี้', 'js/world-norchorthal.js (หัวไฟล์)'),
    N('r_supply', 'route', 'เส้นเสบียงหลวงไปด่านเหนือ', 'supply', 'คอร์วิน (ผู้ตรวจการเสบียงหลวง) · พ่อค้ากับราชสำนักขัดเรื่องภาษี', 'MAIN-STORY-CANON §H · CURRENT-ERA-CANON §B'),
    N('r_trade', 'route', 'เส้นค้าขายท่าเรือซอลต์เฮเวน → ลาเคนฮอลด์', 'trade', 'ราคาสินค้า/ข่าวจากสงครามไหลตามเส้นนี้ (js/story-world.js)', 'js/story-world.js · js/settlements.js'),
    N('p_mine', 'point', 'ปากเหมืองชั้นล่าง (ยืนยันตำแหน่ง)', 'dungeon', 'ดีปแคร์น · ดันเจี้ยนก้อนหิว · ตอนนี้วางใกล้ดีปแคร์นเอง', 'MAIN-STORY-CANON A3', { hex: [66, 28] }),
    N('p_naera', 'point', 'ซากสำนัก Naera (ยืนยันตำแหน่ง)', 'ruin', '"ทางที่สาม" ร่องรอยสำนักและศิษย์ที่สืบทอด ใกล้ธอร์นวอตช์', 'MAIN-STORY-CANON §H', { hex: [84, 47] }),
    N('p_iceshrine', 'point', 'ศาลน้ำแข็งบนเขาหิมะ', 'shrine', 'ปลายช่องเขาตะวันออก (ปลายทางในแผนที่เกม "ศาลโบราณในถ้ำเขาหิมะ") — เกี่ยวกับเทพ/แสง?', 'js/world-gen.js DESTS frost · NC.marks.frost', { hex: [86, 40] }),
    N('p_den', 'point', 'ถ้ำจ่าฝูง', 'dungeon', 'ปลายทางล่าสัตว์ในแผนที่เกม (ป่า) — ผูกกับเส้นล่า/สมุดสัตว์ R5', 'js/world-gen.js DESTS den', { hex: [65, 34] }),
    N('p_oldmine', 'point', 'เหมืองหินร้าง (ปลายทางเดิมของแผนที่)', 'dungeon', 'ปลายทางเดิมในแผนที่เกม — จะเกี่ยวกับเหมือง Xyriel ไหม หรือเป็นคนละที่?', 'js/world-gen.js DESTS mine', { hex: [62, 10] }),
    N('p_sunkentemple', 'point', 'วิหารจมบึง', 'ruin', 'ปลายทางในแผนที่เกม (บึง) — โบราณสถาน/ความเชื่อ?', 'js/world-gen.js DESTS ruin', { hex: [60, 74] }),
    N('p_lightcamp', 'point', 'ที่ตั้งผู้เฝ้าแสงที่ธอร์นวอตช์', 'camp', 'ผู้เล่นถูกพาไปหาผู้เฝ้าแสงที่ธอร์นวอตช์ (Crossroads)', 'js/crossroads.js'),
    N('p_frostcap', 'point', 'เมืองหลวง/ด่านฝั่งฟรอสต์เมียร์', 'city', 'จุดต้นทางข่าวลือ/กองทัพจากเหนือ', 'MAIN-STORY-CANON §H'),
    N('p_elu', 'point', 'นครแห่งแสง (ยืนยันตำแหน่ง)', 'city', 'ผู้เฝ้าแสงมาจากที่นี่ · ตอนนี้วางจากจุดเรืองแสงในภาพ (ประมาณ)', 'WORLD-GEOGRAPHY · MAIN-STORY-CANON C2'),
    N('p_six', 'point', 'ที่ตั้งหกเมือง (ต้นทางนักล่าเงา)', 'legend', 'ยังไม่กำหนดที่ตั้ง — ตอนนี้เป็นตำแหน่งสมมติ', 'MAIN-STORY-CANON C3'),
    N('p_dark', 'point', 'นครมืด (ถ้ากำหนดที่ตั้ง)', 'legend', 'เรื่องเล่าเท่านั้น — ไม่บังคับ', 'CURRENT-ERA-CANON §B'),
    N('p_dragon', 'point', 'ถิ่นมังกรไฟดำ (ตัวใน intro)', 'legend', 'เจ้าของ 15 พ.ย.: มังกรใน intro เป็น "มังกรไฟ สีดำ" ไม่ใช่ Heracean — ตัวเลือกจากเอกสาร: Codex v10a ประวัติแก้ไข 0.5 "เพิ่มถิ่นมังกรไฟ มังกรดิน มังกรลาวาใน Chel\'Koranor" + Lexicon "Byrexael-Cean = มังกรดำจ้าววิญญาณ" (ยังไม่มีเนื้อหาตัวเต็ม · ต้องให้เจ้าของยืนยันว่าตัวไหน/อยู่ในสายตำนาน Aeth-Borak หรือไม่) · จุดตั้งต้น = แดนภูเขาไฟใต้ ย้ายได้', 'intro · Codex v10a (0.5) · Lexicon v10a', { hex: [60, 115] }),
    N('p_heracean', 'point', 'ถิ่นมังกรทะเลพายุ Frenol\'Heracean (Aeth-Borak · ตะวันตกไกล)', 'legend', 'เจ้าของเสนอ: เรื่องมังกร = สปีชีส์ตำนานตระกูล Aeth-Borak ซึ่งบางตัวรูปร่างคล้ายมังกร เช่น Heracean (Tempest Leviathan · "มังกรทะเลสายฟ้า") — Codex ระบุถิ่นย่านพายุ Duna\'Pharinor และมหาสมุทรคลั่ง Grat-Va-Frenol (นอกแผนที่ hex ของเกม)', 'Codex v10a #EB1S6 · Lore v10'),
    N('d_borak', 'decision', 'ตำนาน Aeth-Borak (สปีชีส์ตำนาน บางตัวรูปมังกร) อยู่ในยุคเกมแบบไหน และใช้ชื่อไทยอะไรในเกม?', null, 'เจ้าของตัดสินแนวทางแล้ว 15 พ.ย.: เรื่องมังกร = เรื่องของ Aeth-Borak (Primal Beasts · เกิดพร้อมการสร้างโลก · ถิ่นหลักมหาพงไพรตะวันออก + ถิ่นเฉพาะ เช่น Heracean ทะเลตะวันตก · Nythvanar/Nytha\'gorn แดนหนาว · Solm\'fex/Solm\'gorn ภูเขาไฟใต้) — เหลือ: เป็นแค่ตำนานเล่าลือหรือปรากฏจริง · ชื่อไทยในเกมไม่ใช้ศัพท์ Vaelari ตรง ๆ (MAIN-STORY-CANON หัวไฟล์)', 'Codex v10a #EB1 · MAIN-STORY-CANON'),
    N('d_dragon', 'decision', 'มังกรไฟดำใน intro คือตัวไหน และเป็นบอส/ฉากอะไร?', null, 'เจ้าของ 15 พ.ย.: ตัวใน intro เป็นมังกรไฟสีดำ ไม่ใช่ Heracean — เลือกจาก: Byrexael-Cean (มังกรดำจ้าววิญญาณ · Lexicon) / มังกรไฟ·ดิน·ลาวา ของ Chel\'Koranor (Codex 0.5) / ตัวใหม่ที่เจ้าของตั้ง · แล้วตัดสินว่าอยู่ในสาย Aeth-Borak หรือไม่ และเปิดตัวตอนไหนของเรื่อง', 'intro · Codex v10a (0.5) · Lexicon v10a'),
    N('d_names', 'decision', 'ตั้งชื่ออาณาจักรใต้ · หมู่เกาะ · เกาะตะวันออก (หรือบอกว่าไม่ใช้)', null, 'ตัวยึดทั้ง 3 รอชื่อจากเจ้าของ', 'ตัวยึดในแผนที่'),
    N('d_sixdark', 'decision', 'หกเมืองและนครมืดอยู่ตรงไหนของโลก (หรือเก็บเป็นปริศนา)', null, 'ผู้เล่นควรรู้ที่ตั้งตอนไหนของเรื่อง', 'MAIN-STORY-CANON C3 · CURRENT-ERA-CANON §B'),
    N('d_borders', 'decision', 'ขอบเขตอาณาจักรเป็น "เส้นชัด" หรือ "เขตอิทธิพลเลือน"?', null, 'ส่งผลต่อวิธีคำนวณระดับสงครามต่อเมืองและข่าว', 'js/story-world.js')
  ];
  const find = (geo, need) => [...geo.zones, ...geo.routes, ...geo.points].filter(o => o.need === need);
  const blank = () => ({ v: 1, zones: [], routes: [], points: [], needs: {} });
  const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  function add(geo, type, o) { const list = type === 'zone' ? geo.zones : type === 'route' ? geo.routes : geo.points, kind = o.kind || Object.keys(KINDS[type])[0], obj = { id: uid(type[0]), n: o.n || '', kind, status: o.status || 'proposed', notes: o.notes || '', need: o.need || '', ...o }; obj.c = obj.c || KINDS[type][kind]?.[1] || '#fff'; list.push(obj); return obj }
  function remove(geo, id) { for (const k of ['zones', 'routes', 'points']) { const i = geo[k].findIndex(o => o.id === id); if (i >= 0) { geo[k].splice(i, 1); return true } } return false }
  /* 'done' ยืนยันแล้ว · 'proposed' มีข้อเสนอ · 'skip' ไม่ใช้ · 'decided' ตัดสินแล้ว (decision) · 'missing' ยังไม่ทำ */
  function needStatus(geo, n) {
    const st = geo.needs?.[n.id]?.state; if (st === 'skip') return 'skip'; if (n.type === 'decision') return st === 'decided' ? 'decided' : 'missing';
    const objs = find(geo, n.id); if (objs.some(o => o.status === 'confirmed')) return 'done'; return objs.length ? 'proposed' : 'missing';
  }
  function progress(geo) { const c = { done: 0, proposed: 0, skip: 0, decided: 0, missing: 0 }; for (const n of NEEDS) c[needStatus(geo, n)]++; return { ...c, total: NEEDS.length, settled: c.done + c.skip + c.decided } }
  const serialize = geo => JSON.stringify(geo, null, 1);
  function parse(txt) { const g = JSON.parse(txt); if (!g || typeof g !== 'object') throw Error('ไม่ใช่ข้อมูลแผนที่'); const o = blank(); for (const k of ['zones', 'routes', 'points']) o[k] = Array.isArray(g[k]) ? g[k].filter(x => x && x.id) : []; o.needs = g.needs && typeof g.needs === 'object' ? g.needs : {}; return o }
  const centroid = pts => pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
  const bbox = pts => { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) } };
  function pointInPoly(x, y, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c }
  const api = { KINDS, ICON, NEEDS, find, blank, add, remove, needStatus, progress, serialize, parse, centroid, bbox, pointInPoly };
  root.StoryMapGeo = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

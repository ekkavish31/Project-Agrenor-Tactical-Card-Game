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
  /* v98.512 · ลดรายการเหลือเฉพาะ "ปฐมภูมิ" ที่ผู้ช่วยดูภาพ/ข้อมูลเกมแล้วกำหนดเองให้แม่นไม่ได้ (เจตนาของเจ้าของเท่านั้น) — ที่เหลือผู้ช่วยต่อยอดเองใน DERIVED */
  const NEEDS = [
    N('z_aldren', 'zone', 'ขอบเขตราชอาณาจักรอัลเดรน', 'kingdom', 'เป็นเจตนาของเจ้าของ — ดูจากภาพไม่ได้ว่าอัลเดรนครอบคลุมถึงไหน · ผู้ช่วยใช้ขอบนี้คำนวณเขตอิทธิพล แนวหน้า ระดับสงครามต่อเมือง ฯลฯ ต่อเอง', 'CURRENT-ERA-CANON §B (อัลเดรนอนุมัติแล้ว · ขอบเขตยังไม่กำหนด)', { name: 'ราชอาณาจักรอัลเดรน' }),
    N('z_frostmere', 'zone', 'ขอบเขตอาณาจักรฟรอสต์เมียร์ (ฝ่ายเหนือ)', 'kingdom', 'เป็นเจตนาของเจ้าของ — ใช้คู่กับขอบอัลเดรนหาเส้นแนวหน้าสงคราม (ผู้ช่วยคำนวณเอง) และต้นทางข่าวลือ/ผู้ลี้ภัย', 'MAIN-STORY-CANON A1 · §H', { name: 'อาณาจักรฟรอสต์เมียร์' }),
    N('p_frostcap', 'point', 'เมืองหลวง/ฐานของฟรอสต์เมียร์ (ถ้ามี)', 'city', 'ดูจากภาพไม่ได้ — จุดต้นทางกองทัพ/ข่าวจากเหนือ · ถ้ายังไม่อยากกำหนด กด ⊘ ไม่ใช้ ได้', 'MAIN-STORY-CANON §H'),
    N('p_elu', 'point', 'นครแห่งแสง (ยืนยันตำแหน่ง)', 'city', 'ตอนนี้ผู้ช่วยอ่านจากจุดเรืองแสงเหลืองในภาพ (ประมาณ) — เจ้าของรู้ว่าถูกหรือไม่ · เส้นเดินทางผู้เฝ้าแสงคำนวณจากจุดนี้', 'WORLD-GEOGRAPHY · MAIN-STORY-CANON C2'),
    N('d_names', 'decision', 'อาณาจักรใต้ / สหพันธ์เกาะตะวันตก / เกาะตะวันออก — มีจริงไหม ชื่ออะไร (หรือไม่ใช้)', null, 'ตอนนี้เป็นตัวยึดตามคำสั่งเจ้าของ 15 พ.ย. — ผู้ช่วยแต่งชื่อเองไม่ได้ (ไม่ใช่ canon)', 'ตัวยึดในแผนที่'),
    N('d_sixdark', 'decision', 'หกเมือง (ต้นทางนักล่าเงา) และนครมืด — อยู่ตรงไหน หรือเก็บเป็นปริศนา', null, 'ที่ตั้งสมมติอยู่บนแผนที่ตอนนี้ · ผู้เล่นควรรู้ที่ตั้งตอนไหนของเรื่อง', 'MAIN-STORY-CANON C3 · CURRENT-ERA-CANON §B'),
    N('d_borders', 'decision', 'ขอบเขตอาณาจักรเป็น "เส้นชัด" หรือ "เขตอิทธิพลเลือน"?', null, 'ส่งผลต่อวิธีคำนวณระดับสงครามต่อเมืองและข่าว', 'js/story-world.js')
  ];
  /* สิ่งที่ผู้ช่วยทำเองต่อจากข้างบน (ไม่ต้องกำหนด) — แสดงในแผงให้เจ้าของเห็นว่าอะไรถูกคำนวณ/อ่านจากภาพให้แล้ว */
  const DERIVED = [
    { label: 'เส้นแนวหน้าสงคราม', how: 'คำนวณจากแนวตะเข็บขอบอัลเดรน–ฟรอสต์เมียร์ ผ่านด่านหินเหนือ' },
    { label: 'เขตอิทธิพลราชสำนัก (อาณาจักรย่อย)', how: 'เฟิร์นเวล + บรู๊คเมียร์ ตาม canon ภายในขอบอัลเดรน' },
    { label: 'รอยหมอง ระยะ 1–3', how: 'คำนวณจากระยะจากดีปแคร์น (js/main-story.js DIST) ที่ใช้อยู่แล้ว' },
    { label: 'ขอบมหาพงไพร · เขตผู้เฝ้าแสง/นักล่าเงา', how: 'เห็นเองจากภาพ (ป่า/เทือกเขา) + ตำแหน่งธอร์นวอตช์/ชายป่า' },
    { label: 'เส้นทางทั้งหมด (ขบวนนักโทษ · Mip · ผู้แสวงบุญ · ช่องเขา · เสบียง · ค้าขาย)', how: 'วางตามถนน/ภูมิประเทศระหว่างเมืองที่ตั้งจากช่อง hex จริงของเกม' },
    { label: 'จุดสถานที่ที่เกมมีตำแหน่ง (ปากเหมือง · ซากสำนัก · ศาลน้ำแข็ง · ถ้ำ · วิหารจมบึง ฯลฯ)', how: 'ใช้ marks ในแผนที่ hex ของเกม' },
    { label: 'ถิ่นมังกรดำจ้าววิญญาณ', how: 'ปล่องภูเขาไฟใต้ที่เห็นในภาพ (เจ้าของเลือก Byrexael-Cean 15 พ.ย.)' },
    { label: 'ถิ่น Frenol\'Heracean', how: 'ทะเลตะวันตกไกล/มหาสมุทรคลั่ง ตาม Codex (นอกภาพ)' }
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
  const api = { KINDS, ICON, NEEDS, DERIVED, find, blank, add, remove, needStatus, progress, serialize, parse, centroid, bbox, pointInPoly };
  root.StoryMapGeo = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

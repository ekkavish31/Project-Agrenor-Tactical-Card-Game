/* v98.497 · แผนที่โลกวาดด้วยโค้ด (แทนภาพ norchorthal-region.webp) สำหรับแท็บเส้นเรื่องใน editor
   • แผ่นดิน/เกาะ วาดจากภาพ docs/lore/maps/world-labeled.webp (พิกัดภาพ → พิกัดผืนผ้า 2400×1300 ด้วย tx/ty) — ลักษณะสเก็ตช์ ไม่ใช่แผนที่ทางการ
   • สถานที่ที่กดได้ (มีเรื่อง/เหตุการณ์) = POS เดิม แปลงเป็นพิกัดผืนผ้าใน WPOS
   • GREY = โหนดเทา กดไม่ได้ (แค่กล่าวถึง/ไม่มีเนื้อเรื่อง) · ที่มาของแต่ละโหนดอยู่ในฟิลด์ src · placeholder:true = ตัวยึดตำแหน่งที่ **ยังไม่มีชื่อใน canon** (ไม่ใช่ชื่อจริง — ห้ามเอาไปใช้ในเกมจนกว่าเจ้าของตั้งชื่อ)
   • ZONES = โซนสีอาณาจักร (ตัดด้วยขอบแผ่นดิน)
   ใช้: StoryMapWorld.svg({labels, zones}) → สตริง <svg> · StoryMapWorld.WPOS · .GREY · .ZONES · .inLand(x,y) */
(function (root) {
  'use strict';
  const W = 2400, H = 1300, tx = x => x * 3.6, ty = y => (y - 165) * 3.7;
  const P = (pts) => pts.map(([x, y]) => [Math.round(tx(x)), Math.round(ty(y))]);
  /* แผ่นดิน (พิกัดภาพ world-labeled) */
  const LAND = {
    nulduum: { n: "Nul'Duum", c: '#e4ebf2', e: '#9fb4c8', pts: P([[205, 258], [235, 232], [285, 222], [318, 240], [332, 268], [310, 290], [250, 300], [215, 285]]) },
    norchorthal: { n: "Nor'Chorthal", c: '#8d9d5a', e: '#5c6a3a', pts: P([[215, 290], [250, 300], [310, 290], [335, 285], [370, 310], [380, 345], [350, 385], [320, 388], [280, 398], [240, 388], [225, 362], [215, 330]]) },
    chelkoranor: { n: "Chel'Koranor", c: '#6d4030', e: '#3a2118', pts: P([[225, 400], [265, 395], [310, 385], [345, 395], [335, 425], [300, 450], [250, 452], [215, 430]]) },
    aeth: { n: "Aeth'Va-Paelas", c: '#35653a', e: '#1f3f25', pts: P([[335, 275], [380, 262], [430, 270], [470, 262], [510, 275], [560, 290], [590, 310], [575, 335], [560, 355], [520, 360], [490, 375], [440, 372], [410, 362], [380, 350], [370, 320]]) },
    eastIsle: { n: 'เกาะตะวันออก', c: '#5f8a4a', e: '#3a5a2c', pts: P([[485, 395], [520, 388], [545, 405], [525, 428], [495, 425]]) },
    w1: { n: 'Duna', c: '#6f9456', e: '#3f5c32', pts: P([[165, 310], [195, 308], [198, 335], [172, 342]]) },
    w2: { n: 'Duna', c: '#6f9456', e: '#3f5c32', pts: P([[160, 395], [190, 395], [195, 425], [165, 430]]) },
    w3: { n: 'Duna', c: '#6f9456', e: '#3f5c32', pts: P([[176, 368], [190, 360], [195, 380], [180, 385]]) },
    w4: { n: 'Duna', c: '#6f9456', e: '#3f5c32', pts: P([[120, 360], [135, 352], [140, 372], [122, 378]]) },
    w5: { n: 'Duna', c: '#6f9456', e: '#3f5c32', pts: P([[85, 385], [100, 380], [98, 398], [82, 396]]) },
    w6: { n: 'Duna', c: '#6f9456', e: '#3f5c32', pts: P([[105, 330], [125, 325], [128, 345], [108, 348]]) },
    tree: { n: "Shael'Itharas", c: '#7a6aa8', e: '#4a3a78', pts: P([[25, 330], [55, 330], [50, 365], [28, 368]]) }
  };
  /* ที่ตั้งสถานที่ที่กดได้: POS% (ภาพภูมิภาคเดิม) → ผืนผ้าในกรอบ Nor'Chorthal */
  const toW = p => [Math.round(740 + p[0] / 100 * 640), Math.round(330 + p[1] / 100 * 620)];
  const POS = { fernvale: [49.8, 43.9], lakenhold: [43.0, 50.6], willowshore: [47.4, 53.0], deepcairn: [50.6, 34.4], northgate: [56.2, 38.3], thornwatch: [65.3, 46.5], vinehollow: [45.3, 64.3], brookmere: [34.0, 49.0], haven: [32.3, 56.3], deepmine: [48.3, 31.4], ruinsite: [67.4, 43.6] };
  const WPOS = Object.fromEntries(Object.entries(POS).map(([k, v]) => [k, toW(v)]));
  /* โหนดเทา — กดไม่ได้ · kind: kingdom | city | wonder | legend | place · loc:'approx' = ตำแหน่งบนแผนที่เป็นสมมติ (ไม่ทราบที่ตั้งจริง) */
  const GREY = [
    { id: 'frostmere', n: 'ฟรอสต์เมียร์', ic: '❄', kind: 'kingdom', x: 985, y: 360, zone: 'frostmere', r: 'อาณาจักรมนุษย์ทางเหนือ · คู่สงครามของอัลเดรนที่ฝั่งด่านหินเหนือ · ศาสนา "นิกายรอรุ่งอรุณ"', src: 'MAIN-STORY-CANON A1 · §H (ชื่อที่เจ้าของมอบให้ตั้ง 14 พ.ย.)' },
    { id: 'elu', n: 'นครแห่งแสง', ic: '☀', kind: 'city', x: 1700, y: 560, r: 'เล่าลือ/ผู้เฝ้าแสงมาจากที่นี่ (Elu\'Aetharas ในเอกสารพัฒนา · 13°N 66°E) — ในเกมยังไม่มีเนื้อเรื่องที่ไปถึง', src: 'WORLD-GEOGRAPHY · MAIN-STORY-CANON C2' },
    { id: 'sacredTree', n: 'ต้นไม้ศักดิ์สิทธิ์', ic: '🌳', kind: 'wonder', x: 1765, y: 450, r: "Shael'Mier'Tas · คุ้มครองและชีวิต (18°N 67°E)", src: 'WORLD-GEOGRAPHY' },
    { id: 'darkCity', n: 'นครมืด', ic: '?', kind: 'legend', loc: 'approx', x: 1960, y: 620, r: 'เรื่องเล่าถึงนครมืดในมหาพงไพร — ไม่ใช่หลักฐานว่ารู้ที่ตั้ง (ตำแหน่งบนแผนที่เป็นสมมติ)', src: 'CURRENT-ERA-CANON §B' },
    { id: 'sixCities', n: 'หกเมือง', ic: '?', kind: 'legend', loc: 'approx', x: 1560, y: 640, r: 'ต้นทางของนักล่าเงา (Duum\'Lorien) — ที่ตั้งยังไม่กำหนด (ตำแหน่งบนแผนที่เป็นสมมติ)', src: 'MAIN-STORY-CANON C3/§H' },
    { id: 'worldTree', n: 'ต้นไม้โลก', ic: '🌌', kind: 'wonder', x: 138, y: 700, r: "Shael'Itharas · กลไกชำระวิญญาณ · ชายขอบโลกตะวันตกไกล", src: 'WORLD-GEOGRAPHY' },
    { id: 'southKingdom', n: 'อาณาจักรใต้ (ยังไม่ตั้งชื่อ)', ic: '🌋', kind: 'kingdom', placeholder: true, x: 1000, y: 985, zone: 'south', r: 'ตัวยึดตำแหน่งแดนภูเขาไฟ Chel\'Koranor — canon ยังไม่ระบุว่ามีอาณาจักร/ชื่ออะไร', src: 'ตัวยึดตามคำสั่งเจ้าของ 15 พ.ย. (ไม่ใช่ canon)' },
    { id: 'westIsles', n: 'สหพันธ์เกาะตะวันตก (ยังไม่ตั้งชื่อ)', ic: '⛵', kind: 'kingdom', placeholder: true, x: 650, y: 590, zone: 'westIsles', r: 'ตัวยึดตำแหน่งหมู่เกาะ Duna\'Pharinor — canon ยังไม่ระบุอาณาจักร', src: 'ตัวยึดตามคำสั่งเจ้าของ 15 พ.ย. (ไม่ใช่ canon)' },
    { id: 'islePort', n: 'เมืองท่าเกาะ (ยังไม่ตั้งชื่อ)', ic: '⚓', kind: 'city', placeholder: true, x: 640, y: 905, zone: 'westIsles', r: 'ตัวยึดตำแหน่ง', src: 'ตัวยึด (ไม่ใช่ canon)' },
    { id: 'eastIsleKingdom', n: 'เกาะตะวันออก (ยังไม่ตั้งชื่อ)', ic: '🏝', kind: 'kingdom', placeholder: true, x: 1820, y: 910, zone: 'eastIsle', r: 'ตัวยึดตำแหน่งเกาะนอกฝั่งตะวันออกเฉียงใต้', src: 'ตัวยึด (ไม่ใช่ canon)' }
  ];
  /* โซนสีอาณาจักร: pts ผืนผ้า (ตัดด้วยแผ่นดิน) */
  const ZONES = {
    aldren: { n: 'ราชอาณาจักรอัลเดรน', c: '#9a62d0', pts: [[800, 560], [900, 515], [1050, 500], [1175, 500], [1245, 560], [1255, 640], [1205, 735], [1100, 795], [960, 785], [860, 745], [800, 665]], r: 'เฟิร์นเวลและบรู๊คเมียร์อยู่ใต้อิทธิพลราชสำนัก (เขตอิทธิพล = อาณาจักรย่อย)', src: 'CURRENT-ERA-CANON §B' },
    frostmere: { n: 'อาณาจักรฟรอสต์เมียร์', c: '#5a9ae0', pts: [[740, 340], [860, 240], [1030, 200], [1150, 270], [1205, 390], [1130, 478], [950, 490], [790, 455]], r: 'อาณาจักรมนุษย์ทางเหนือ คู่สงครามของอัลเดรน', src: 'MAIN-STORY-CANON §H' },
    south: { n: 'อาณาจักรใต้ (ตัวยึด · ยังไม่ตั้งชื่อ)', c: '#d4653a', dashed: true, pts: [[760, 840], [1260, 800], [1260, 1070], [760, 1070]], r: 'ไม่ใช่ canon', src: 'ตัวยึด' },
    westIsles: { n: 'สหพันธ์เกาะตะวันตก (ตัวยึด · ยังไม่ตั้งชื่อ)', c: '#34b0a8', dashed: true, pts: [[260, 480], [800, 480], [800, 1020], [260, 1020]], r: 'ไม่ใช่ canon', src: 'ตัวยึด' },
    eastIsle: { n: 'เกาะตะวันออก (ตัวยึด)', c: '#4aa6d8', dashed: true, pts: [[1700, 780], [2000, 780], [2000, 1000], [1700, 1000]], r: 'ไม่ใช่ canon', src: 'ตัวยึด' },
    wild: { n: 'มหาพงไพร · ดินแดนร้าง (ไม่มีอาณาจักรที่ยืนยัน)', c: '#5f9a58', hatch: true, pts: [[1380, 340], [2150, 340], [2150, 780], [1380, 780]], r: 'ถูกมองว่าเป็นดินแดนร้าง อันตราย', src: 'CURRENT-ERA-CANON §B' }
  };
  const ROADS = [['fernvale', 'lakenhold'], ['fernvale', 'northgate'], ['fernvale', 'deepcairn'], ['fernvale', 'thornwatch'], ['fernvale', 'willowshore'], ['lakenhold', 'willowshore'], ['lakenhold', 'brookmere'], ['brookmere', 'haven'], ['willowshore', 'vinehollow'], ['haven', 'vinehollow'], ['deepcairn', 'northgate'], ['northgate', 'thornwatch'], ['deepcairn', 'deepmine'], ['thornwatch', 'ruinsite']];
  /* ---------- วาด ---------- */
  function smooth(pts) {   // closed Catmull-Rom → cubic Bézier
    const n = pts.length; let d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n], t = 1 / 6;
      d += ` C${(p1[0] + (p2[0] - p0[0]) * t).toFixed(0)},${(p1[1] + (p2[1] - p0[1]) * t).toFixed(0)} ${(p2[0] - (p3[0] - p1[0]) * t).toFixed(0)},${(p2[1] - (p3[1] - p1[1]) * t).toFixed(0)} ${p2[0]},${p2[1]}` }
    return d + 'Z';
  }
  const poly = pts => 'M' + pts.map(p => p.join(',')).join('L') + 'Z';
  function inLand(x, y) {
    const hit = pts => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c } return c };
    return Object.entries(LAND).find(([, l]) => hit(l.pts))?.[0] || null;
  }
  function svg(o = {}) {
    const land = Object.entries(LAND), clip = land.map(([, l]) => `<path d="${smooth(l.pts)}"/>`).join('');
    const mount = []; for (let i = 0; i < 13; i++) { const x = 1290 + (i % 2) * 22 + Math.sin(i) * 8, y = 540 + i * 24; mount.push(`<path d="M${x - 20},${y + 14}L${x},${y - 18}L${x + 20},${y + 14}Z" fill="#8a8f98" stroke="#4a4f58" stroke-width="2"/><path d="M${x - 7},${y - 3}L${x},${y - 18}L${x + 7},${y - 3}Z" fill="#f2f5f8"/>`) }
    const snow = []; for (let i = 0; i < 16; i++) { const x = 800 + (i * 67) % 420, y = 300 + (i * 41) % 150; snow.push(`<path d="M${x - 14},${y + 9}L${x},${y - 11}L${x + 14},${y + 9}Z" fill="#c8d6e4" stroke="#8fa3b8" stroke-width="1.5"/>`) }
    const trees = []; for (let i = 0; i < 90; i++) { const x = 1420 + (i * 97) % 640, y = 400 + (i * 53) % 340; if (inLand(x, y) === 'aeth') trees.push(`<circle cx="${x}" cy="${y}" r="${7 + i % 4}" fill="#2b5a31" opacity=".8"/>`) }
    const lava = []; for (let i = 0; i < 14; i++) { const x = 900 + (i * 53) % 260, y = 890 + (i * 37) % 130; lava.push(`<circle cx="${x}" cy="${y}" r="${3 + i % 3}" fill="#ff7a2a" opacity=".85"/>`) }
    const zones = o.zones === false ? '' : Object.entries(ZONES).map(([id, z]) => `<path class="zone z-${id}" d="${poly(z.pts)}" fill="${z.hatch ? 'url(#hatch)' : z.c}" fill-opacity="${z.hatch ? 1 : .26}" stroke="${z.c}" stroke-width="5" ${z.dashed ? 'stroke-dasharray="18 12"' : ''} stroke-opacity=".75"/>`).join('');
    const zl = o.labels === false || o.zones === false ? '' : Object.entries(ZONES).map(([id, z]) => { const c = z.pts.reduce((a, p) => [a[0] + p[0] / z.pts.length, a[1] + p[1] / z.pts.length], [0, 0]); return `<text class="zlabel" x="${c[0].toFixed(0)}" y="${(c[1] + 62).toFixed(0)}" text-anchor="middle" fill="${z.c}">${z.n}</text>` }).join('');
    const names = o.labels === false ? '' : [[1000, 230, "Nul'Duum · แดนหนาว"], [1010, 520, "Nor'Chorthal"], [1010, 1080, "Chel'Koranor · แดนภูเขาไฟ"], [1760, 400, "Aeth'Va-Paelas · มหาพงไพร"], [440, 560, "Duna'Pharinor"], [1190, 160, 'Grat-Va-Frenol · มหาสมุทรคลั่ง']].map(([x, y, t]) => `<text class="rname" x="${x}" y="${y}" text-anchor="middle">${t}</text>`).join('');
    const grid = []; for (let x = 0; x <= W; x += 200) grid.push(`<path d="M${x},0V${H}"/>`); for (let y = 0; y <= H; y += 200) grid.push(`<path d="M0,${y}H${W}"/>`);
    return `<svg id="worldsvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>
      <radialGradient id="sea" cx="50%" cy="50%" r="75%"><stop offset="0" stop-color="#1c4f86"/><stop offset="1" stop-color="#0a2140"/></radialGradient>
      <filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="9"/></filter>
      <pattern id="hatch" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="22" height="22" fill="#5f9a58" fill-opacity=".14"/><path d="M0,0V22" stroke="#7fc178" stroke-width="3" stroke-opacity=".55"/></pattern>
      <clipPath id="landclip">${clip}</clipPath></defs>
      <rect width="${W}" height="${H}" fill="url(#sea)"/><g stroke="#ffffff" stroke-opacity=".05" stroke-width="2" fill="none">${grid.join('')}</g>
      <g filter="url(#soft)" opacity=".9">${land.map(([, l]) => `<path d="${smooth(l.pts)}" fill="#3f8fc0" fill-opacity=".55" transform="translate(0,0)" stroke="#5fb0d8" stroke-width="26"/>`).join('')}</g>
      <g>${land.map(([k, l]) => `<path d="${smooth(l.pts)}" fill="${l.c}" stroke="${l.e}" stroke-width="5" stroke-linejoin="round"/>`).join('')}</g>
      <g clip-path="url(#landclip)">${snow.join('')}${trees.join('')}${lava.join('')}<ellipse cx="1030" cy="960" rx="70" ry="46" fill="#3a1a10"/><ellipse cx="1030" cy="955" rx="34" ry="20" fill="#ff6a1a"/>
        <path d="M1002,505 C1040,560 1060,600 1048,650 C1036,700 1000,730 1020,790 C1040,840 1060,880 1050,930" fill="none" stroke="#5fb4e8" stroke-width="9" stroke-linecap="round"/>
        <ellipse cx="1008" cy="694" rx="52" ry="28" fill="#4aa4dc" stroke="#3a84b8" stroke-width="4"/>${mount.join('')}
        ${zones}</g>${zl}${names}</svg>`;
  }
  const api = { W, H, LAND, WPOS, POS, GREY, ZONES, ROADS, svg, inLand, smooth };
  root.StoryMapWorld = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

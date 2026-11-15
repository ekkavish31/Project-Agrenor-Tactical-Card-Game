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
  /* ---------- v98.498 · วาดให้สวย: ชายฝั่งเศษส่วน (midpoint displacement) · พื้นผิว+แสงเงาด้วย SVG filter · ป่า/เขา/หิมะ/ภูเขาไฟ · แล้วแปลงเป็นบิตแมป (raster) ครั้งเดียวเพื่อให้แพน/ซูมลื่น ---------- */
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  function coast(pts, seed, rough = .2, depth = 4) {   // closed polygon → jagged coastline (same output every time)
    const R = rng(seed); let out = [];
    const sub = (a, b, d, amp) => { if (d === 0) { out.push(a); return } const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], nx = -(b[1] - a[1]), ny = b[0] - a[0], k = (R() - .5) * 2 * amp; m[0] += nx * k; m[1] += ny * k; sub(a, m, d - 1, amp * .62); sub(m, b, d - 1, amp * .62) };
    for (let i = 0; i < pts.length; i++) sub(pts[i], pts[(i + 1) % pts.length], depth, rough);
    return out.map(p => [Math.round(p[0]), Math.round(p[1])]);
  }
  const COAST = {}; for (const [k, l] of Object.entries(LAND)) COAST[k] = coast(l.pts, k.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7), k === 'tree' || k.startsWith('w') ? .28 : .17, 4);
  const cpath = k => poly(COAST[k]);
  function scatter(key, n, seed, f) { const R = rng(seed), out = []; const l = LAND[key].pts, xs = l.map(p => p[0]), ys = l.map(p => p[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys); for (let t = 0; t < n * 6 && out.length < n; t++) { const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); if (inLand(x, y) === key) out.push(f(x, y, R)) } return out.join('') }
  const tree = (x, y, R, c1, c2, s = 1) => { const r = (9 + R() * 7) * s; return `<ellipse cx="${x.toFixed(0)}" cy="${(y + r * .7).toFixed(0)}" rx="${r * .9}" ry="${r * .35}" fill="#0a1a0c" opacity=".35"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="${c1}"/><circle cx="${(x - r * .28).toFixed(0)}" cy="${(y - r * .3).toFixed(0)}" r="${(r * .55).toFixed(1)}" fill="${c2}" opacity=".85"/>` };
  const peak = (x, y, h, snow, R) => { const w = h * .9; return `<path d="M${x - w},${y + h * .5}L${x},${y - h}L${x + w},${y + h * .5}Z" fill="#6b6e76"/><path d="M${x},${y - h}L${x + w},${y + h * .5}L${x + w * .15},${y + h * .5}L${x + w * .05},${y - h * .1}Z" fill="#3e4048" opacity=".75"/>${snow ? `<path d="M${x},${y - h}L${x + w * .36},${y - h * .28}L${x + w * .12},${y - h * .4}L${x - w * .08},${y - h * .22}L${x - w * .36},${y - h * .28}Z" fill="#f4f7fb"/>` : ''}` };
  function baseSvg(o = {}) {
    const land = Object.keys(LAND), mt = [];
    { const R = rng(11); for (let i = 0; i < 26; i++) { const y = 520 + i * 15 + (R() - .5) * 14, x = 1325 + Math.sin(i * .5) * 18 + (R() - .5) * 26; mt.push(peak(x, y, 24 + R() * 14, i % 3 === 0, R)) } }
    const ndm = []; { const R = rng(5); for (let i = 0; i < 20; i++) ndm.push(peak(840 + R() * 330, 270 + R() * 190, 16 + R() * 14, true, R)) }
    const forestN = scatter('norchorthal', 130, 3, (x, y, R) => tree(x, y, R, '#3c6a34', '#5f9548', .8));
    const forestA = scatter('aeth', 520, 9, (x, y, R) => tree(x, y, R, '#1f4a2a', '#3d7a42', 1.05));
    const forestI = land.filter(k => k.startsWith('w') || k === 'eastIsle').map((k, i) => scatter(k, 22, 40 + i, (x, y, R) => tree(x, y, R, '#3f7a42', '#6aa75a', .75))).join('');
    const hills = scatter('norchorthal', 60, 21, (x, y, R) => `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${26 + R() * 20}" ry="${9 + R() * 7}" fill="#b4b46a" opacity=".32"/>`);
    const fields = scatter('norchorthal', 40, 33, (x, y, R) => `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${22 + R() * 14}" height="${14 + R() * 8}" fill="${['#c9c070', '#aab864', '#d6cf88'][Math.floor(R() * 3)]}" opacity=".5" transform="rotate(${(R() * 30 - 15).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`);
    const lava = scatter('chelkoranor', 60, 17, (x, y, R) => `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${2 + R() * 3}" fill="#ff8a2a" opacity=".9"/>`);
    const rocks = scatter('chelkoranor', 20, 18, (x, y, R) => peak(x, y, 14 + R() * 12, false, R));
    const treeOfWorld = `<g transform="translate(138,684)"><ellipse cx="0" cy="62" rx="52" ry="14" fill="#2a1a5a" opacity=".55"/><rect x="-6" y="10" width="12" height="52" rx="4" fill="#5a3a2a"/><circle cx="0" cy="-2" r="46" fill="#6a4ab0"/><circle cx="-22" cy="12" r="30" fill="#7a5ac8"/><circle cx="24" cy="10" r="32" fill="#8a6ae0"/><circle cx="0" cy="-26" r="28" fill="#a58af0"/><circle cx="-8" cy="-34" r="10" fill="#e0d4ff" opacity=".7"/></g>`;
    const waves = []; { const R = rng(77); for (let i = 0; i < 150; i++) { const x = R() * W, y = R() * H; if (!inLand(x, y)) waves.push(`<path d="M${x.toFixed(0)},${y.toFixed(0)}q10,-7 20,0t20,0" fill="none" stroke="#9fd0f0" stroke-width="2" opacity=".18"/>`) } }
    const grid = []; for (let x = 0; x <= W; x += 200) grid.push(`<path d="M${x},0V${H}"/>`); for (let y = 0; y <= H; y += 200) grid.push(`<path d="M0,${y}H${W}"/>`);
    const compass = `<g transform="translate(2230,1130)" opacity=".85"><circle r="64" fill="#0b1b30" fill-opacity=".6" stroke="#d8c58a" stroke-width="3"/><circle r="50" fill="none" stroke="#d8c58a" stroke-width="1.5" stroke-dasharray="3 5"/><path d="M0,-58L10,0L0,58L-10,0Z" fill="#d8c58a"/><path d="M-58,0L0,-10L58,0L0,10Z" fill="#a89460"/><path d="M0,-58L10,0L-10,0Z" fill="#e0584a"/><text y="-68" text-anchor="middle" font-size="22" font-weight="700" fill="#f4e6b0" font-family="serif">N</text></g>`;
    const river = `<path d="M1004,498 C1040,552 1062,598 1050,648 C1038,700 1002,730 1022,790 C1040,842 1062,884 1052,930" fill="none" stroke="#2e6fa0" stroke-width="15" stroke-linecap="round" opacity=".9"/><path d="M1004,498 C1040,552 1062,598 1050,648 C1038,700 1002,730 1022,790 C1040,842 1062,884 1052,930" fill="none" stroke="#7fc4ee" stroke-width="8" stroke-linecap="round"/>`;
    const lake = `<ellipse cx="1008" cy="694" rx="56" ry="30" fill="#2e6fa0"/><ellipse cx="1008" cy="692" rx="48" ry="23" fill="#6fb8e8"/><ellipse cx="996" cy="686" rx="22" ry="8" fill="#b8e0f8" opacity=".5"/>`;
    const volcano = `<g transform="translate(1030,950)"><ellipse cx="0" cy="40" rx="96" ry="26" fill="#1a0c08" opacity=".5"/><path d="M-90,40L-26,-34L26,-34L90,40Z" fill="#5a3628"/><path d="M26,-34L90,40L20,40Z" fill="#33190f" opacity=".7"/><path d="M-26,-34L-14,-44L14,-44L26,-34Z" fill="#3a1d12"/><ellipse cx="0" cy="-40" rx="14" ry="6" fill="#ff7a1a"/><path d="M0,-38 C-4,-12 6,10 -2,40" fill="none" stroke="#ff8a2a" stroke-width="5" opacity=".9"/><circle cx="0" cy="-58" r="14" fill="#6a5a58" opacity=".6"/><circle cx="12" cy="-76" r="18" fill="#5a4a48" opacity=".45"/></g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>
      <radialGradient id="sea" cx="50%" cy="48%" r="72%"><stop offset="0" stop-color="#1f5a92"/><stop offset=".6" stop-color="#123c6a"/><stop offset="1" stop-color="#071a33"/></radialGradient>
      <radialGradient id="vig" cx="50%" cy="50%" r="72%"><stop offset=".65" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></radialGradient>
      <filter id="blur18" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="16"/></filter><filter id="blur5"><feGaussianBlur stdDeviation="4"/></filter>
      <filter id="tex" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.009 0.013" numOctaves="5" seed="7" result="n"/>
        <feDiffuseLighting in="n" lighting-color="#ffffff" surfaceScale="6" diffuseConstant="1.25" result="lit"><feDistantLight azimuth="235" elevation="52"/></feDiffuseLighting>
        <feComposite in="SourceGraphic" in2="lit" operator="arithmetic" k1="1.12" k2="0" k3="0" k4="0" result="shaded"/>
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="2" result="fine"/><feColorMatrix in="fine" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .7 -.26" result="grain"/><feComposite in="grain" in2="SourceAlpha" operator="in" result="g2"/><feMerge><feMergeNode in="shaded"/><feMergeNode in="g2"/></feMerge></filter>
      <clipPath id="landclip">${land.map(k => `<path d="${cpath(k)}"/>`).join('')}</clipPath>
      <linearGradient id="snowg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#c9d9ea"/></linearGradient>
      <linearGradient id="plain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fa05c"/><stop offset=".55" stop-color="#7d9250"/><stop offset="1" stop-color="#9aa062"/></linearGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#sea)"/>
      <g stroke="#ffffff" stroke-opacity=".045" stroke-width="2" fill="none">${grid.join('')}</g>${waves.join('')}
      <g filter="url(#blur18)">${land.map(k => `<path d="${cpath(k)}" fill="none" stroke="#4aa8d8" stroke-width="64" stroke-opacity=".34"/>`).join('')}</g>
      <g filter="url(#blur5)">${land.map(k => `<path d="${cpath(k)}" fill="none" stroke="#8fd8f4" stroke-width="22" stroke-opacity=".4"/>`).join('')}</g>
      <g filter="url(#tex)">${land.map(k => { const l = LAND[k], fill = k === 'nulduum' ? 'url(#snowg)' : k === 'norchorthal' ? 'url(#plain)' : l.c; return `<path d="${cpath(k)}" fill="${fill}" stroke="${l.e}" stroke-width="4" stroke-linejoin="round"/>` }).join('')}</g>
      <g fill="none" stroke="#f0e6b4" stroke-opacity=".55" stroke-width="2.5">${land.map(k => `<path d="${cpath(k)}"/>`).join('')}</g>
      <g clip-path="url(#landclip)">${hills}${fields}${river}${lake}${forestN}${forestA}${forestI}${lava}${rocks}${ndm.join('')}${mt.join('')}</g>${volcano}${treeOfWorld}
      <rect width="${W}" height="${H}" fill="url(#vig)"/>${compass}
      <rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="#d8c58a" stroke-opacity=".55" stroke-width="4"/><rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="#d8c58a" stroke-opacity=".25" stroke-width="2"/></svg>`;
  }
  function zonesSvg(o = {}) {
    const names = o.labels === false ? '' : [[1000, 232, "Nul'Duum · แดนหนาว"], [1010, 512, "Nor'Chorthal"], [1010, 1092, "Chel'Koranor · แดนภูเขาไฟ"], [1850, 395, "Aeth'Va-Paelas · มหาพงไพร"], [440, 585, "Duna'Pharinor"], [1190, 150, 'Grat-Va-Frenol · มหาสมุทรคลั่ง']].map(([x, y, t]) => `<text class="rname" x="${x}" y="${y}" text-anchor="middle">${t}</text>`).join('');
    const clip = Object.keys(LAND).map(k => `<path d="${cpath(k)}"/>`).join('');
    const zs = Object.entries(ZONES).map(([id, z]) => `<g class="zone z-${id}"><path d="${poly(z.pts)}" fill="${z.hatch ? 'url(#zhatch)' : z.c}" fill-opacity="${z.hatch ? 1 : .2}"/><path d="${poly(z.pts)}" fill="none" stroke="${z.c}" stroke-width="6" ${z.dashed ? 'stroke-dasharray="20 12"' : ''} stroke-opacity=".9" filter="url(#zglow)"/></g>`).join('');
    const zl = o.labels === false ? '' : Object.entries(ZONES).map(([id, z]) => { const c = z.pts.reduce((a, p) => [a[0] + p[0] / z.pts.length, a[1] + p[1] / z.pts.length], [0, 0]); return `<text class="zlabel" x="${c[0].toFixed(0)}" y="${(c[1] + 62).toFixed(0)}" text-anchor="middle" fill="${z.c}">${z.n}</text>` }).join('');
    return `<svg id="zonesvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs><clipPath id="zclip">${clip}</clipPath><filter id="zglow" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="3"/></filter>
      <pattern id="zhatch" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><rect width="22" height="22" fill="#5f9a58" fill-opacity=".1"/><path d="M0,0V22" stroke="#7fc178" stroke-width="3" stroke-opacity=".4"/></pattern></defs>
      <g clip-path="url(#zclip)" class="zones">${zs}</g><g class="zones">${zl}</g>${names}</svg>`;
  }
  const svg = (o = {}) => baseSvg(o) + zonesSvg(o);
  let _raster = null;
  function raster(scale = 1.5) {   // browser only → Promise<dataURL> (bitmap of the base map; filters run once)
    if (_raster) return _raster;
    return _raster = new Promise((res, rej) => { const img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = W * scale; c.height = H * scale; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); try { res(c.toDataURL('image/webp', .92)) } catch (e) { res(img.src) } }; img.onerror = rej; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(baseSvg()) });
  }
  const api = { W, H, LAND, WPOS, POS, GREY, ZONES, ROADS, svg, baseSvg, zonesSvg, raster, inLand, smooth, coast };
  root.StoryMapWorld = api; if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

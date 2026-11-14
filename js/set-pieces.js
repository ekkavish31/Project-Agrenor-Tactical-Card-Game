/* v98.493 · ฉากต่อสู้ตายตัว (set-piece) — ไม่สุ่ม เหมือนฉากไร่ฟักทอง แต่ใช้กับบอสและทางแยกสำคัญ
   ต่างจากการต่อสู้ทั่วไปที่สร้างสนามสุ่มจาก seed + วางหน่วยตามมุม — ฉากตายตัวกำหนดเองทั้งหมด:
     • สนาม: แผนที่ (กำแพง พื้นสูง ที่กำบัง โคลน) วาดด้วยโค้ดใน SCENES[id].map → field-host.js ใช้แทนสนามสุ่ม · ทุกครั้งที่สู้เหมือนกัน
     • ตำแหน่งเริ่ม: ตัวเอก/เพื่อน/ศัตรูทุกตัว (hero · allies · enemies) · ศัตรูเริ่มได้เปรียบ (ตาเริ่มก่อน · จำนวนเยอะ · ยึดที่สูง)
     • กติกาเฉพาะฉาก (rules): onHeroTurn(st) ทุกรอบ → เสริมกำลัง/ฟื้นเลือด/ประกาศ · dmgMod(st, เป้า, ดาเมจ) ปรับดาเมจ — ผู้เล่นต้อง "อ่านกติกา" ถึงชนะได้ ไม่ใช่แค่ตีแรงกว่า
     • เป้าหมาย (obj): boss = ล้มบอสตัวเดียวก็ชนะ (ลูกน้อง/วัตถุอื่นไม่ต้องล้างหมด) · ไม่มีทางหนี (noFlee)
   ใช้: ?scene=<id> ที่ battle-field.html (js/world-map.js ส่งมาให้เมื่อ battle(..., { scene })) · ใช้ร่วมกับ node: SetPieces.validate(scene) · SetPieces.units(scene) → หน่วยเริ่มต้น · SetPieces.cell(scene,u,v)
   เทสต์: tools/test-set-pieces.cjs · จำลองสมดุล: tools/simulate-hunger.cjs (SCENE=1) */
(function (root) {
  'use strict';
  /* ---------- วาดแผนที่ด้วยสี่เหลี่ยม: พิกัด u,v ∈ [−R, R] (v ลบ = เหนือ) ---------- */
  function makeGrid(R, ops) {
    const n = 2 * R + 1, g = Array.from({ length: n }, () => Array(n).fill('#'));
    const put = (u, v, ch) => { if (Math.abs(u) <= R && Math.abs(v) <= R) g[v + R][u + R] = ch };
    for (const [ch, u0, v0, u1, v1] of ops) for (let v = Math.min(v0, v1); v <= Math.max(v0, v1); v++) for (let u = Math.min(u0, u1); u <= Math.max(u0, u1); u++) put(u, v, ch);
    return g.map(r => r.join(''));
  }
  /* ตัวอักษร: t เต็นท์ · f รั้วไม้ · p เสาหิน · # กำแพง(boulder) · . พื้น · + ที่กำบัง(เศษหิน) · ~ โคลนเลือดช้า · 1 2 พื้นสูงระดับ 1/2 · b กำแพงกระดูก */
  const TILE = { '#': { k: 'blocked', prop: 'boulder' }, b: { k: 'blocked', prop: 'bones' }, '.': { k: 'normal' }, '+': { k: 'cover' }, '~': { k: 'slow' }, 1: { k: 'normal', level: 1 }, 2: { k: 'normal', level: 2 }, t: { k: 'blocked', prop: 'tent' }, f: { k: 'blocked', prop: 'barricade' }, p: { k: 'blocked', prop: 'pillar' } };

  /* ===================================================================================================
     ก้นเหมือง · ก้อนหิว — "ตัดอาหารของมัน" (Canon A12): ก้อนหิวมีปมหิว 3 จุดป้อนมันอยู่ · ตราบที่ปมยังอยู่ มันเจ็บน้อยลงครึ่งหนึ่งและฟื้นเลือดทุกรอบ
     ศัตรูได้เปรียบ: บอสยึดที่สูง (ระดับ 2) เริ่มก่อน · สัตว์รอยหมองไหลมาจากอุโมงค์ทางเหนือทุก 4 รอบ ตีขนาบทางด้านข้าง · ผู้เล่นเข้ามาทางอุโมงค์แคบด้านใต้
     คำตอบ (ต้องคิด): ตัดปมก่อนบอส · ใช้เศษหิน/เสากันคลื่นสัตว์ · แบ่งทีมกดสองข้าง · อย่าปีนขึ้นที่สูงไปสู้บอสทั้งที่ปมยังอยู่
     =================================================================================================== */
  const R9 = 12;   /* v98.494 · ขยายจาก 9 → 12 (สนาม 25×25) */
  const hungerPit = {
    id: 'hungerPit', name: 'ก้นเหมือง · ก้อนหิว', R: R9, biome: 'hills', noFlee: true, obj: { type: 'boss' },
    map: makeGrid(R9, [
      ['.', -8, -11, 8, -9],                                       // ถ้ำเหนือกว้าง (ปากอุโมงค์สัตว์รอยหมองอยู่สองมุมนี้)
      ['.', -8, -8, -6, -1], ['.', 6, -8, 8, -1],                  // ทางเดินข้างที่สูง ยาว (ศัตรูไหลลงมาขนาบ)
      [2, -3, -8, 3, -4], [1, -3, -3, 3, -1],                      // ที่สูงของบอส (ระดับ 2) + ขั้นบันไดทางใต้ (ระดับ 1)
      ['.', -8, 0, 8, 8],                                          // ห้องกลางกว้าง 17×9
      ['.', -11, 2, -9, 5], ['.', 9, 2, 11, 5],                    // โพรงข้างลึก (ปมหิวซ้าย/ขวา)
      ['.', -1, 9, 1, 12],                                         // อุโมงค์ทางเข้าของฝั่งผู้เล่น (แคบ 3 ช่อง ยาว 4)
      ['#', -5, 2, -5, 2], ['#', 5, 2, 5, 2], ['#', -5, 7, -5, 7], ['#', 5, 7, 5, 7], ['#', -2, 1, -2, 1], ['#', 2, 1, 2, 1],   // เสาในห้อง
      ['+', -6, 5, -6, 5], ['+', 6, 5, 6, 5], ['+', -2, 8, -2, 8], ['+', 2, 8, 2, 8], ['+', -7, 1, -7, 1], ['+', 7, 1, 7, 1], ['+', -3, 5, -3, 5], ['+', 3, 5, 3, 5],   // เศษหินกันดาเมจ −30%
      ['~', -1, 4, 1, 6]                                          // โคลนเลือดรอบปมกลาง (เดินช้า)
    ]),
    hero: { u: 0, v: 11 }, allies: [{ u: -1, v: 11 }, { u: 1, v: 11 }, { u: 0, v: 12 }],
    enemies: [
      { id: 'boss', kind: 'hunger', u: 0, v: -6, boss: true, hp: 1.07, name: 'ก้อนหิว', ct: 28 },
      { id: 'rootW', kind: 'hungerRoot', u: -11, v: 3, hp: 1, name: 'ปมหิวตะวันตก' },
      { id: 'rootE', kind: 'hungerRoot', u: 11, v: 3, hp: 1, name: 'ปมหิวตะวันออก' },
      { id: 'rootC', kind: 'hungerRoot', u: 0, v: 5, hp: 1, name: 'ปมหิวกลางห้อง' },
      { id: 'm1', kind: 'murk', u: -1, v: 3, hp: 1, ct: 30 },
      { id: 'm2', kind: 'murk', u: 1, v: 3, hp: 1, ct: 22 }
    ],
    waves: { everyRounds: 4, first: 4, mouths: [{ u: -7, v: -11 }, { u: 7, v: -11 }], kind: 'murk', per: 1, cap: 3 },   // คลื่นแรกรอบที่ 4 แล้วทุก 4 รอบ · มีสัตว์รอยหมองในสนามไม่เกิน 3 ตัว
    rootHeal: 4,                // ปมหนึ่งจุดป้อนบอส +4 HP ต่อรอบ
    rootShield: .5,             // ดาเมจที่บอสได้รับเหลือ 50% ตราบที่ยังมีปม
    intro: [
      { who: null, text: 'ห้องกลางก้นเหมืองมืดและชื้น เส้นเลือดสีม่วงขดไปตามพื้นเข้าหาที่สูงด้านเหนือ — ก้อนหิวอยู่ตรงนั้น และมันมองลงมา' },
      { who: 'darren', text: 'สามจุดบนพื้นนั่น… ปมที่มันใช้กินกิเลสของคนข้างบน ถ้ายังอยู่ เจ้าฟันมันไม่เข้าหรอก — ตัดอาหารมันก่อน' }
    ],
    hints: [
      'ก้อนหิวเจ็บน้อยลงครึ่งหนึ่งตราบที่ปมหิวยังอยู่ และมันดูดเลือดคืนจากปมทุกรอบ — ตัดปมก่อนแล้วค่อยล้มมัน',
      'ปมหิวมี 3 จุด: ซ้าย ขวา และกลางห้อง (โคลนเลือด เดินช้า) — เศษหินกับเสาช่วยกันดาเมจ',
      'ทุก 4 รอบ สัตว์รอยหมองไหลมาจากอุโมงค์เหนือสองทาง — อย่าให้ทีมถูกขนาบบนที่โล่ง',
      'ที่สูงของบอสได้เปรียบ — อย่าปีนขึ้นไปทั้งที่ปมยังอยู่'
    ]
  };

  /* ===================================================================================================
     ช่องเขาขบวนนักโทษ — ทางแยกสำคัญ (อีเวนต์ "ขบวนนักโทษ" ตอนสะกดรอยแล้วถูกจับได้): ผู้คุมซุ่มอยู่บนที่สูง มีแตรเรียกกำลังเสริม 2 ตัว
     ศัตรูได้เปรียบ: จำนวนเยอะ · หัวหน้ายึดที่สูง (ระดับ 2) · ทุก 3 รอบแตรเรียกโจรมาเสริมจากฝั่งตะวันออก (ไม่เกิน 4)
     คำตอบ (ต้องคิด): ตัดแตรก่อน (เสียงดังเรียกกำลังเสริมต่อไม่ได้) แล้วค่อยกดหัวหน้า · ใช้โขดหินกั้นทางเดี่ยวให้พวกมันมาทีละตัว · อย่าปีนที่สูงตอนยังโดนล้อม
     =================================================================================================== */
  const R7 = 10;   /* v98.494 · ขยายจาก 7 → 10 (ช่องเขา 21×21) */
  const convoyPass = {
    id: 'convoyPass', name: 'ช่องเขาขบวนนักโทษ', R: R7, biome: 'hills', noFlee: true, obj: { type: 'boss' }, anchorKind: 'alarmHorn',
    map: makeGrid(R7, [
      ['.', -10, -3, -6, 3], ['.', -5, -1, 5, 1], ['.', -5, -5, 4, -4], ['.', -5, 4, 4, 5],        // ทางเข้าตะวันตกกว้าง + ช่องเขากลางยาว + แอ่งเหนือ/ใต้ยาว
      ['.', -7, -5, -6, -4], ['.', -7, 4, -6, 5],                                                  // ทางอ้อมจากทางเข้าเข้าแอ่ง (ให้ตัวอ้อมไปทำลายแตร)
      [1, 5, -4, 6, 4], [2, 7, -3, 10, 3],                                                         // ทางขึ้นสู่ที่สูงของหัวหน้า (ระดับ 1 → 2)
      ['+', -3, -1, -3, -1], ['+', 0, 1, 0, 1], ['+', 3, -1, 3, -1], ['+', -8, 0, -8, 0], ['+', 1, -4, 1, -4], ['+', 1, 5, 1, 5],   // โขดหินกำบัง
      ['#', -1, 0, -1, 0], ['#', 1, 0, 1, 0], ['#', -8, -3, -8, -3], ['#', -8, 3, -8, 3], ['#', 3, 0, 3, 0],   // เสาหิน
      ['~', 0, -5, 1, -5], ['~', 0, 5, 1, 5]
    ]),
    hero: { u: -8, v: 0 }, allies: [{ u: -10, v: -1 }, { u: -10, v: 1 }, { u: -9, v: 1 }],
    enemies: [
      { id: 'cap', kind: 'bandit', u: 9, v: 0, boss: true, hp: 4.2, name: 'ผู้คุมขบวน', ct: 26 },
      { id: 'horn1', kind: 'alarmHorn', u: 4, v: -4, hp: 1, name: 'แตรสัญญาณเหนือ' },
      { id: 'horn2', kind: 'alarmHorn', u: 4, v: 4, hp: 1, name: 'แตรสัญญาณใต้' },
      { id: 'g1', kind: 'bandit', u: 4, v: -1, hp: 1.1, ct: 28 },
      { id: 'g2', kind: 'bandit', u: 4, v: 1, hp: 1.1, ct: 24 },
      { id: 'g3', kind: 'wolf', u: 5, v: 0, hp: 1.2, name: 'หมาล่าของผู้คุม', ct: 30 },
      { id: 'g4', kind: 'bandit', u: 2, v: -1, hp: 1.2, ct: 26 },
      { id: 'g5', kind: 'wolf', u: 2, v: 1, hp: 1.2, name: 'หมาล่าของผู้คุม', ct: 32 }
    ],
    waves: { everyRounds: 3, first: 3, mouths: [{ u: 10, v: -3 }, { u: 10, v: 3 }], kind: 'bandit', per: 1, cap: 5, needAnchor: true, capBy: 'wave' },
    cutStun: false, cutSay: '📯 แตรเงียบแล้ว — กำลังเสริมเรียกไม่ได้อีก เหลือแต่หัวหน้ากับพวกที่อยู่ตรงนี้', cutLog: 'แตรสัญญาณถูกทำลาย — ไม่มีกำลังเสริมอีก',
    intro: [
      { who: null, text: 'ช่องเขาแคบ ขบวนเกวียนเหล็กดำจอดอยู่บนเนินสูงฝั่งตะวันออก — ผู้คุมรู้ว่าคุณสะกดรอยมาและเตรียมซุ่มไว้แล้ว' },
      { who: 'helga', text: 'พวกเขามีแตรสองตัว เป่าทีเดียวคนที่เหลือจะมาหมด… ทำให้แตรเงียบก่อน' }
    ],
    hints: [
      'หัวหน้ายึดที่สูงและมีแตรสัญญาณ 2 ตัวคอยเรียกกำลังเสริมทุก 3 รอบ — แตรอยู่ปลายแอ่งเหนือและใต้ แยกคนอ้อมไปทำลายระหว่างที่ช่องกลางตรึงพวกมันไว้',
      'ช่องเขากลางแคบ ใช้โขดหินกับเสาหินกั้นให้พวกมันมาทีละตัว — อย่าปีนที่สูงตอนยังโดนล้อม',
      'เสียงแตรดังจากฝั่งตะวันออก — โจรกำลังมาเสริมจากหน้าผา'
    ]
  };

  /* ===================================================================================================
     ค่ายผู้อพยพ · ผู้ป่วยล้ม (อีเวนต์ "ผู้อพยพที่ป่วย"): รั้วไม้ล้อมค่าย มีช่องทางเข้า 4 ช่อง · ผู้ป่วยนอนกลางค่าย (ช่องป้องกัน) — สัตว์รอยหมองถูกอาการของเธอดึงมา
     ศัตรูได้เปรียบ: มาจากสามทิศ คลื่นละมากขึ้น (1 → 1 → 2 → 2 ต่อทาง) · ถ้ามีตัวไหนเหยียบช่องผู้ป่วยได้ = แพ้ · ต้องอยู่ครบ 8 รอบ
     คำตอบ (ต้องคิด): ใช้ตัวคนอุดช่องรั้ว (เหนือ ตะวันออก ใต้) ไม่ให้ไหลเข้าใน · ยืนที่ลังกำบังหลังช่อง · ฆ่าตัวที่มาก่อนคลื่นถัดไป · อย่าไล่ออกนอกรั้ว
     =================================================================================================== */
  const R7c = 10, campOps = [['.', -10, -10, 10, 10], ['f', -5, -5, 5, -5], ['f', -5, 5, 5, 5], ['f', -5, -5, -5, 5], ['f', 5, -5, 5, 5], ['.', 0, -5, 0, -5], ['.', 5, 0, 5, 0], ['.', 0, 5, 0, 5], ['.', -5, 0, -5, 0],
    ['t', -3, -3, -2, -3], ['t', 3, 3, 3, 3], ['+', 2, -3, 2, -3], ['+', -2, 3, -2, 3], ['+', 3, -2, 3, -2], ['+', -3, 2, -3, 2], ['+', 0, -2, 0, -2], ['+', 0, 2, 0, 2], ['~', -9, -9, -8, -8], ['~', 8, 8, 9, 9], ['#', -8, 4, -8, 4], ['#', 8, -4, 8, -4], ['#', -7, -7, -7, -7], ['#', 7, 7, 7, 7]];
  const campDefense = {
    id: 'campDefense', name: 'ค่ายผู้อพยพ · ผู้ป่วยล้ม', R: R7c, biome: 'grass', noFlee: true, night: true, obj: { type: 'defend', turns: 8, cells: [{ u: 0, v: 0 }], leash: 6 },
    map: makeGrid(R7c, campOps),
    hero: { u: -3, v: 0 }, allies: [{ u: -3, v: -1 }, { u: -2, v: 1 }, { u: -2, v: 0 }],
    enemies: [{ id: 'm1', kind: 'murk', u: -9, v: -9, hp: 1, ct: 12 }, { id: 'm2', kind: 'murk', u: 9, v: 9, hp: 1, ct: 12 }],
    waves: { everyRounds: 2, first: 2, count: 5, mouths: [{ u: 0, v: -10 }, { u: 10, v: 0 }, { u: 0, v: 10 }], kind: 'murk', per: [1, 2, 2, 3, 3], cap: 9, capBy: 'wave' },
    waveHint: 'เสียงคำรามจากนอกรั้ว — คลื่นต่อไปกำลังมาจากสามทิศ',
    intro: [{ who: 'irene', text: 'ผู้ป่วยอยู่กลางค่าย — อย่าให้มันเหยียบถึงที่เธอนอน! รั้วมีช่องแค่สี่ช่อง ใช้ตัวคนอุดไว้' }],
    hints: ['ป้องกันเธอไว้ 8 รอบ — ถ้าสัตว์รอยหมองตัวไหนเหยียบช่องกลางค่ายได้ เท่ากับแพ้ (ผู้ป่วยอยู่ตรงกลางรั้ว)',
      'รั้วมีช่องเปิด 4 ช่อง (เหนือ ตะวันออก ใต้ และตะวันตกด้านหลังคุณ) — ใช้เพื่อนอุดช่องเหนือ/ตะวันออก/ใต้ ไม่ให้ไหลเข้าด้านใน · ลังสี่จุดช่วยกันดาเมจ',
      'ศัตรูมาจากสามทิศ คลื่นละมากขึ้น — ฆ่าตัวที่มาก่อนคลื่นถัดไป อย่าไล่ออกนอกรั้ว']
  };

  /* ===================================================================================================
     คืนจันทร์ม่วง · เฝ้า Mip (อีเวนต์ "พิธีคืนจันทร์ม่วง"): แท่นหินกลางลาน Mip ขดอยู่บนแท่น (ช่องป้องกัน) ปลอกคอสั่นเป็นจังหวะ
     ศัตรูได้เปรียบ: มาสามทาง (ตะวันตก ตะวันออก เหนือ) · เสาหินกั้นให้ศัตรูไหลเข้าช่องแคบพร้อมกัน · ผู้เล่นมีทางถอยด้านใต้เท่านั้น
     คำตอบ (ต้องคิด): ปลอกคอ Mip ปล่อยแสงทุกรอบที่ 3 และ 6 ทำดาเมจศัตรูรอบแท่น (รัศมี 2) — ล่อให้ศัตรูเข้ามาใกล้แท่นก่อนถึงจังหวะ แล้วเก็บที่เหลือ
     =================================================================================================== */
  const R6 = 9;   /* v98.494 · ขยายจาก 6 → 9 (ลาน 19×19) */
  const moonGuard = {
    id: 'moonGuard', name: 'คืนจันทร์ม่วง · เฝ้า Mip', R: R6, biome: 'hills', noFlee: true, night: true, obj: { type: 'defend', turns: 7, cells: [{ u: 0, v: 0 }], leash: 5 },
    map: makeGrid(R6, [['.', -9, -9, 9, 9], ['p', -3, -3, -3, -3], ['p', 3, -3, 3, -3], ['p', -3, 3, -3, 3], ['p', 3, 3, 3, 3], ['p', 0, -6, 0, -6], ['+', -2, -2, -2, -2], ['+', 2, -2, 2, -2], ['+', -2, 2, -2, 2], ['+', 2, 2, 2, 2], ['+', -6, 0, -6, 0], ['+', 6, 0, 6, 0], ['#', -9, 5, -6, 9], ['#', 6, 5, 9, 9], ['#', -5, 8, 5, 9]]),
    hero: { u: 0, v: 5 }, allies: [{ u: -1, v: 5 }, { u: 1, v: 5 }, { u: 0, v: 6 }],
    enemies: [{ id: 'm1', kind: 'murk', u: -8, v: 0, hp: 1, ct: 24 }, { id: 'm2', kind: 'murk', u: 8, v: 0, hp: 1, ct: 26 }],
    waves: { everyRounds: 2, first: 2, count: 3, mouths: [{ u: -9, v: -2 }, { u: 9, v: -2 }, { u: 0, v: -9 }], kind: 'murk', per: [1, 1, 1], cap: 6, capBy: 'wave' },
    pulses: [{ rounds: [3, 6], at: { u: 0, v: 0 }, radius: 2, dmg: 16, text: '✦ ปลอกคอของ Mip ส่องแสงม่วงเป็นวง', warn: 'ปลอกคอของ Mip สั่นแรงขึ้น — อีกรอบเดียวมันจะส่องแสงทำร้ายสิ่งที่อยู่ใกล้แท่น' }],
    waveHint: 'สัตว์รอยหมองกำลังมาอีกระลอกจากตะวันตก ตะวันออก และเหนือ',
    intro: [{ who: 'helga', text: 'เสียงสวดหยุดแล้ว… เจ้าตัวเล็กสั่นอยู่บนแท่น — ปกป้องมันจนกว่าพระจันทร์จะลง' }],
    hints: ['ปกป้อง Mip บนแท่นกลางลานไว้ 7 รอบ — ถ้าสัตว์รอยหมองตัวไหนเหยียบแท่นได้ เท่ากับแพ้',
      'ปลอกคอของ Mip ส่องแสงทำดาเมจรอบแท่น (รัศมี 2) ที่รอบ 3 และ 6 — ล่อศัตรูเข้ามาใกล้แท่นก่อนถึงรอบนั้น',
      'เสาหินกั้นให้ศัตรูไหลเข้ามาทีละช่อง — ยืนหลังเสาและที่กำบัง อย่าออกไปนอกลาน',
      'ปลอกคอของ Mip สั่นแรงขึ้น — แสงใกล้มา']
  };

  const SCENES = { hungerPit, convoyPass, campDefense, moonGuard };

  /* ---------- ข้อมูลช่อง ---------- */
  function cell(sc, u, v) {
    const R = sc.R; if (Math.abs(u) > R || Math.abs(v) > R) return { k: 'blocked', level: 0, prop: 'boulder' };
    const ch = sc.map[v + R][u + R], t = TILE[ch] || TILE['.']; return { k: t.k, level: t.level || 0, prop: t.prop || null, ch };
  }
  const walk = (sc, u, v) => cell(sc, u, v).k !== 'blocked';
  /* หน่วยเริ่มต้นแบบทั่วไป (town-battle ใช้สร้างจริง · เทสต์/ตัวจำลองใช้ตรง ๆ) */
  function units(sc) { return { hero: { ...sc.hero }, allies: sc.allies.map(a => ({ ...a })), enemies: sc.enemies.map(e => ({ ...e })) } }

  /* ---------- กติกาของฉาก ----------
     api = { alive(u), mk(kind, pos, extra) → หน่วยใหม่ที่ผูกภาพแล้ว (ตัวเรียกให้), free(u,v) → ช่องว่าง? } ; ผลคือรายการ step สำหรับเล่นภาพ */
  function rules(sc, api) {
    const AK = sc.anchorKind || 'hungerRoot', isRoot = u => u.kind === AK, roots = st => st.units.filter(u => u.side === 'monster' && isRoot(u) && api.alive(u)), boss = st => st.units.find(u => u.boss && u.side === 'monster');
    const nearestFree = (st, p) => { for (let r = 0; r <= 4; r++) for (let du = -r; du <= r; du++) for (let dv = -r; dv <= r; dv++) { if (Math.max(Math.abs(du), Math.abs(dv)) !== r) continue; const u = p.u + du, v = p.v + dv; if (walk(sc, u, v) && api.free(st, u, v)) return { u, v } } return null };
    return {
      /* ดาเมจที่บอสได้รับ: ปมหิวยังอยู่ = เหลือ 40% */
      dmgMod(st, tgt, d, notes) {
        if (!tgt.boss || tgt.side !== 'monster' || !sc.rootShield) return d; const n = roots(st).length; if (!n) return d;
        notes.push('ปมหิว ' + n + ' จุดยังป้อนอยู่ −' + Math.round((1 - sc.rootShield) * 100) + '%'); return Math.max(1, Math.round(d * sc.rootShield));
      },
      /* ยังมีคลื่นที่ยังไม่มา = ยังไม่ชนะแม้ศัตรูตอนนี้หมด (ฉากป้องกัน) */
      pending(st) { const W = sc.waves; return !!(W && W.count && (st.waveN || 0) < W.count) },
      /* ต้นรอบของตัวเอก (เรียกจาก flat-battle runCT) */
      onHeroTurn(st) {
        const steps = [], r = st.round = (st.round || 0) + 1, b = boss(st), rs = roots(st), hu = st.units.find(u => u.side === 'hero'), who = b || hu;
        if (sc.obj.type === 'boss' && (!b || !api.alive(b))) return steps;
        if (r === 1) steps.push({ type: 'say', unit: who, text: sc.hints[0], big: true });
        if (r === 2) steps.push({ type: 'say', unit: who, text: sc.hints[1] });
        /* คลื่นไฟ/ชีพจร: ตามรอบที่กำหนด ทำดาเมจรอบจุดศูนย์กลาง (ผู้เล่นล่อศัตรูเข้ามาแล้วใช้จังหวะ) */
        for (const P of sc.pulses || []) if (P.rounds.includes(r)) { const hit = st.units.filter(u => u.side === 'monster' && api.alive(u) && Math.max(Math.abs(u.u - P.at.u), Math.abs(u.v - P.at.v)) <= P.radius); for (const u of hit) u.hp = Math.max(0, u.hp - P.dmg); steps.push({ type: 'say', unit: who, text: P.text + (hit.length ? ' (โดน ' + hit.length + ' ตัว −' + P.dmg + ')' : ' (ไม่มีศัตรูในรัศมี)'), big: true, hits: hit }); st.log.push(P.text + ' −' + P.dmg + ' x' + hit.length) }
        if (sc.pulses && r === Math.min(...sc.pulses.flatMap(x => x.rounds)) - 1) steps.push({ type: 'say', unit: who, text: sc.pulses[0].warn || sc.hints[3] });
        if (sc.rootHeal === undefined && !sc.rootShield) { /* scenes without a shield: nothing to feed */ }
        /* ปมป้อนบอส */
        if (b && rs.length && r > 1 && sc.rootHeal) { const h = Math.min(b.maxHp - b.hp, sc.rootHeal * rs.length); if (h > 0) { b.hp += h; st.log.push('ปมหิว ' + rs.length + ' จุดป้อนก้อนหิว +' + h); steps.push({ type: 'say', unit: b, text: '🩸 ปมหิว ' + rs.length + ' จุดป้อนก้อนหิว +' + h, heal: h }) } }
        /* ตัดปมครบ: บอสเสียหลัก 1 ตา */
        if (b && (sc.anchorKind || sc.rootShield) && !rs.length && !st.rootsCut && sc.cutText !== false) { st.rootsCut = true; if (sc.cutStun !== false) b.stun = 1; st.log.push(sc.cutLog || 'ปมหิวขาดหมด — ก้อนหิวเสียหลัก!'); steps.push({ type: 'say', unit: b, text: sc.cutSay || '✂ ตัดอาหารมันได้แล้ว — ก้อนหิวเสียหลัก! ตอนนี้ฟันมันได้เต็มแรง', big: true }) }
        /* คลื่นสัตว์รอยหมอง: ประกาศก่อน 1 รอบ */
        const W = sc.waves; if (W && !(W.needAnchor && !rs.length) && (!W.count || (st.waveN || 0) < W.count)) {
          if (r >= W.first - 1 && (r - W.first + 1) % W.everyRounds === 0 && r < W.first + W.everyRounds * 9) steps.push({ type: 'say', unit: who, text: sc.waveHint || sc.hints[2] });
          if (r >= W.first && (r - W.first) % W.everyRounds === 0) {
            const alive = st.units.filter(u => u.side === 'monster' && u.kind === W.kind && (W.capBy !== 'wave' || u.fromWave) && api.alive(u)).length; let room = W.cap - alive; const wi = st.waveN = (st.waveN || 0) + 1, per = Array.isArray(W.per) ? W.per[Math.min(wi - 1, W.per.length - 1)] : W.per;
            for (const m of W.mouths) for (let i = 0; i < per && room > 0; i++) { const p = nearestFree(st, m); if (!p) continue; const nu = api.mk(W.kind, p, { fromWave: r }); if (nu) { st.units.push(nu); room--; st.log.push('สัตว์รอยหมองไหลลงมาจากอุโมงค์เหนือ'); steps.push({ type: 'spawn', unit: nu, text: 'สัตว์รอยหมองมาเสริม!' }) } }
          }
        }
        return steps;
      }
    };
  }

  /* ---------- ตรวจความถูกต้องของฉาก (node) ---------- */
  function validate(sc) {
    const err = [], n = 2 * sc.R + 1; if (sc.map.length !== n || sc.map.some(r => r.length !== n)) err.push('map must be ' + n + '×' + n); if (err.length) return err;
    for (const r of sc.map) for (const ch of r) if (!TILE[ch]) err.push('unknown tile ' + ch);
    const where = [['hero', sc.hero], ...sc.allies.map((a, i) => ['ally' + i, a]), ...sc.enemies.map(e => ['enemy ' + e.id, e]), ...(sc.waves ? sc.waves.mouths.map((m, i) => ['mouth' + i, m]) : [])]; const seen = new Set();
    for (const [nm, p] of where) { if (!walk(sc, p.u, p.v)) err.push(nm + ' stands in a wall (' + p.u + ',' + p.v + ')'); const k = p.u + ',' + p.v; if (nm !== 'hero' && seen.has(k) && !/mouth/.test(nm)) err.push(nm + ' shares a cell ' + k); if (!/mouth/.test(nm)) seen.add(k) }
    /* ทุกช่องเดินได้ต้องติดกัน + ก้าวสูงต่ำไม่เกิน 1 ระดับ */
    const R = sc.R, cells = []; for (let v = -R; v <= R; v++) for (let u = -R; u <= R; u++) if (walk(sc, u, v)) cells.push([u, v]);
    const start = sc.hero, key = (u, v) => u + ',' + v, vis = new Set([key(start.u, start.v)]), q = [[start.u, start.v]];
    while (q.length) { const [u, v] = q.pop(); for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = u + du, b = v + dv; if (!walk(sc, a, b) || vis.has(key(a, b))) continue; if (Math.abs(cell(sc, a, b).level - cell(sc, u, v).level) > 1) continue; vis.add(key(a, b)); q.push([a, b]) } }
    for (const e of sc.enemies) if (!vis.has(key(e.u, e.v)) && !e.boss) err.push('enemy ' + e.id + ' unreachable from the hero start');
    const boss = sc.enemies.find(e => e.boss);
    if (sc.obj.type === 'boss') { if (!boss) err.push('boss scene needs a boss') } else if (sc.obj.type === 'defend') { if (!(sc.obj.cells || []).length || sc.obj.cells.some(c => !walk(sc, c.u, c.v))) err.push('defend cells must be open ground'); if (!(sc.obj.turns > 0)) err.push('defend needs turns') } else err.push('unknown objective ' + sc.obj.type);
    return err;
  }
  const api = { SCENES, get: id => SCENES[id] || null, cell, walk, units, rules, validate, makeGrid, TILE };
  root.SetPieces = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

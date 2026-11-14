/* v98.485 · ตัวละครและสถานที่ของเนื้อเรื่องหลักที่เข้าระบบเกม (Canon §H · docs/lore/MAIN-STORY-CANON.md · docs/PROPOSAL-CROSSROADS-TH.md)
   ไม่สร้างระบบใหม่ — ต่อเข้า 2 จุดเดิมที่เมืองบนแผนที่โลกใช้อยู่แล้ว:
     • คนในเมือง   Settlements.LOCALS (ชื่อ · บทบาท · คำพูด)  → locals(g, town, base) ใส่คนใหม่ + เติมคำพูดเรื่องสงคราม/การติดเชื้อให้คนเดิม ตามหมุดเรื่อง
     • ปุ่มของเมือง TownServices (ปุ่มบนการ์ดเมือง)           → services(g, town) / run(...) ปุ่มสถานที่ใหม่ของเนื้อเรื่อง
   ทุกอย่างผูกกับ MainStory (war / infection / หมุดเรื่อง) ไม่ผูกกับวัน (Canon D: ไม่มีนาฬิกานับถอยหลัง) · ผู้เล่นยังไม่ถึงหมุด = ไม่เห็น
   ข้อความผู้เล่นตามระดับสปอยล์: ไม่มีชื่อโบราณ (Paelasael ฯลฯ) · Elu'Mierwaa / Duum'Lorien โผล่เมื่อพวกเขาแนะนำตัว (หมุด release ขึ้นไป)
   ตัวละครใหม่ยังไม่มีภาพ (ผู้ใช้จะเจนภายหลัง) — ในเมืองบนแผนที่เป็นข้อความอยู่แล้วจึงไม่ต้องใช้ภาพ
   เซฟ: ใช้ MainStory.flag/set (village.main.flags) + Titles.log (chronicle) เท่านั้น · ไม่มีเซฟก้อนใหม่ */
(function (root) {
  'use strict';
  const MS = () => root.MainStory, T = () => root.Titles, F = () => root.Factions;
  const num = (x, d = 0) => Number.isFinite(+x) ? +x : d;
  const at = (g, id) => !!MS() && MS().atLeast(g, id);
  const war = g => MS() ? MS().war(g) : 0;
  const inf = (g, town) => MS() ? MS().infection(g, town) : 0;

  /* ---------- คนใหม่ [id, ชื่อ, บทบาท, เมือง, หมุดที่เริ่มพบ, (g)=>คำพูด[]] ---------- */
  const CAST = [
    { id: 'corvin', n: 'นายพลคอร์วิน แธเรล', r: 'ผู้ตรวจการเสบียงหลวง', town: 'lakenhold', from: 'signs',
      lines: g => at(g, 'wake')
        ? ['ข้าตรวจบัญชีเสบียงทุกคลังตั้งแต่ด่านเหนือยันนครหลวง ของที่ไม่อยู่ในบัญชีคือของที่ข้าต้องรู้', 'เจ้าถือของแปลก ๆ เดินทางไปทั่ว… ถ้าเจออะไรที่ราชสำนักควรได้เห็น เจ้ารู้ว่าต้องมาหาใคร']
        : ['สงครามกินเสบียงเร็วกว่าที่ใครคิด ข้าแค่ทำให้ทุกอย่างไปถึงแนวรบทัน', 'ภาษีที่ขึ้นไม่ใช่ความโลภ… มันคือค่าของข้าวสักถุงที่ทหารจะได้กิน'] },
    { id: 'helga', n: 'พี่น้องเฮลกา', r: 'ผู้แสวงบุญนิกายรอรุ่งอรุณ', town: 'northgate', from: 'signs',
      lines: g => ['พวกเราไม่ได้มารบ เรามารอ — เทพไม่ได้จากไป เพียงแค่หลับ และจะตื่นเมื่อโลกพร้อม', 'พวกเจ้าเรียกมันว่าแร่ แต่ที่บ้านเกิดข้า เรียกมันว่าเถ้ากระดูกของบุตรแรก… ไม่มีใครควรขุดมัน',
        ...(at(g, 'release') ? ['ข้าเห็นขบวนที่ผ่านช่องเขาเมื่อคืน มีคนของเรารวมอยู่ในนั้น พวกเขาไม่ได้อยากไปเหมือง'] : [])] },
    { id: 'darren', n: 'เซอร์ดาร์เรน', r: 'อัศวินเฝ้าเหมือง', town: 'deepcairn', from: 'release',
      lines: g => ['ข้าได้รับคำสั่งให้ยืนตรงนี้ แค่นั้น ถ้าเจ้ามีธุระกับชั้นล่าง ธุระนั้นถูกยกเลิกแล้ว', ...(war(g) >= 4 ? ['พวกเราเอาไม่อยู่แล้ว… ถ้าเจ้าเป็นคนที่เข้มแข็งพอ อย่าเพิ่งเดินทางไกล'] : ['บางตัวที่หลงขึ้นมาจากโพรง… ไม่เหมือนสัตว์ที่ข้ารู้จัก'])] },
    { id: 'irene', n: 'หมอหญิงไอรีน', r: 'หมอประจำเรือนพยาบาลผู้ลี้ภัย', town: 'willowshore', from: 'signs',
      lines: g => ['คนที่มาที่นี่ไม่ได้ป่วยแค่ร่างกาย… แต่ยิ่งช่วงนี้ บางคนมีควันดำจาง ๆ ในตา ข้ายังไม่รู้ว่ามันคืออะไร', ...(war(g) >= 3 ? ['ถ้าเจอใครมีอาการแบบนั้น พามาหาข้าก่อนที่ทหารจะรู้ ระยะแรกยังรักษาได้'] : [])] },
    { id: 'vik', n: 'วิก', r: 'นายหน้าตลาดมืด', town: 'haven', from: 'wake',
      lines: g => ['ในสงคราม ของทุกอย่างมีราคา… แม้แต่ของที่ไม่มีใครบอกว่าเป็นของใคร', 'ถ้าเจอของแปลก ๆ ที่เรืองแสงสีม่วง อย่าเพิ่งทิ้ง ข้าอาจรู้ว่าใครให้ราคาสูงที่สุด'] },
    { id: 'mierris', n: 'เมียร์ริส', r: 'ผู้เฝ้าแสง', town: 'thornwatch', from: 'release',
      lines: g => ["ข้าเห็นพวกเจ้าขุดเหมือนที่พวกเราเคยเห็นมาก่อน… ในเมืองที่ไม่มีใครจำชื่อได้อีกแล้ว", 'เรามาจากเมืองในป่าลึก เราเรียกตัวเองว่า Elu\'Mierwaa ผู้เฝ้าแสง ไม่ได้มาเป็นศัตรู ถ้าการขุดหยุดอย่างสงบ',
        'อย่าไว้ใจพวกที่ตามรอยเงา — เป้าหมายของเราคล้ายกัน แต่วิธีไม่เหมือนกัน'] },
    { id: 'lorrik', n: 'ลอร์ริก', r: 'นักล่าเงา', town: 'thornwatch', from: 'wake',
      lines: g => at(g, 'release')
        ? ['ข้าชื่อลอร์ริก พวกข้าเรียกตัวเองว่า Duum\'Lorien — นักล่าเงา เจ้าเลี้ยงสัตว์ตัวเล็ก ๆ ที่มีสิ่งอื่นอยู่ข้างในไม่ใช่หรือ?', 'เราไม่ได้อยากทำร้ายมัน เราแค่ต้องการให้มันนำทางไปยังต้นตอ']
        : ['ข้าไม่ถามว่าเจ้ามาจากไหน และเจ้าก็ไม่ต้องถามข้า… แต่รอยเท้าที่ตามเจ้ามามันเล็กกว่ารอยคน'] }
  ];

  /* ---------- คำพูดเพิ่มของคนเดิม (เรียงจากต้นฉบับใน Settlements.LOCALS · ไม่เปลี่ยนคำเดิม · เติมตามหมุด) ---------- */
  const EXTRA = {
    deepcairn: { 'โบดิล': [{ w: 3, t: 'ชั้นล่างปิดมาหลายสัปดาห์แล้ว… แต่คืนนี้ยังได้ยินเสียงขุดอยู่เลย ข้าไม่เข้าใจ' }, { w: 4, t: 'คนงานหายไปอีกหลายคน ข้าไม่กล้าถามว่าไปไหน' }], 'เทลมา': [{ w: 2, t: 'พ่อค้ามากว้านซื้อผลึกจนราคาไม่เหมือนเดิม ข้าสงสัยว่าเขาเอาไปทำอะไร' }] },
    thornwatch: { 'เรนัลด์': [{ w: 2, t: 'นักเดินทางจากด่านเหนือมาถี่ขึ้น ทุกคนอยากรู้ว่าทางไหนปลอดภัย' }], 'ไอวี': [{ i: 1, t: 'เจอรอยเท้าที่ไม่ควรมีอยู่… เหมือนสัตว์ที่ตัวใหญ่ขึ้นเองหลังจากอยู่ไกลจากป่า' }] },
    lakenhold: { 'จ่าฮาโรลด์': [{ w: 2, t: 'ป้ายเกณฑ์ติดแล้วที่ประตู ข้าได้แต่หวังว่าลูกชายของใครจะไม่ถูกเรียก' }], 'ท่านหญิงโอเดตต์': [{ s: 'wake', t: 'ข้ากำลังเทียบจารึกกับลายบนการ์ดเก่า… ถ้าเจ้าเคยเห็นลายเดียวกัน บอกข้า' }], 'อาจารย์ซีลัส': [{ s: 'wake', t: 'ผู้ตรวจการเสบียงมาถามเรื่องเวทที่ผูกวิญญาณ ข้าบอกว่าเรื่องแบบนั้นไม่ควรมีอยู่ในหอคอยนี้' }] },
    willowshore: { 'ป้ากรีตา': [{ w: 2, t: 'ผู้อพยพจากทางเหนือข้ามเรือมาทุกวัน… ที่นี่ใจดีได้ไม่นานหรอก' }] },
    northgate: {}, vinehollow: { 'นักบวชเบเนดิกต์': [{ w: 3, t: 'มีผู้แสวงบุญนิกายทางเหนือมาขอพักที่ศาลเจ้า พวกเขาไม่พูดมาก' }] }
  };
  const extraOK = (g, d, town) => (d.w == null || war(g) >= d.w) && (d.i == null || inf(g, town) >= d.i) && (d.s == null || at(g, d.s));

  /* คนในเมืองบนแผนที่โลก: base = Settlements.LOCALS[town] → คืนรายการใหม่ (ไม่แก้ของเดิม) */
  function locals(g, town, base) {
    const out = (base || []).map(([n, role, ls]) => { const add = (EXTRA[town]?.[n] || []).filter(d => extraOK(g, d, town)).map(d => d.t); return [n, role, add.length ? ls.concat(add) : ls] });
    for (const c of CAST) if (c.town === town && at(g, c.from)) out.push([c.n, c.r, c.lines(g), c.id]);
    return out;
  }

  /* ---------- สถานที่/ปุ่มใหม่ของเมือง ---------- */
  const SPOTS = {
    /* กระดานข่าวสงคราม (N7): ทุกเมืองเมื่อสงครามเริ่มส่งเสียง · อ่านจาก MainStory.signs */
    news: { label: '📰 กระดานข่าวสงคราม', towns: null, when: g => war(g) >= 1 },
    camp: { label: '⛺ ค่ายผู้อพยพ · แบ่งอาหารให้', towns: ['northgate', 'willowshore'], when: g => war(g) >= 2, cost: 10, daily: true },
    ruin: { label: '🏚 ร่องรอยสำนักชายป่า', towns: ['thornwatch'], when: g => at(g, 'wake'), daily: true },
    epilogue: { label: '🕯 ดูว่าที่นี่เป็นอย่างไรหลังจบเรื่อง', towns: ['deepcairn', 'thornwatch', 'northgate'], when: g => !!root.Endings?.done(g) },
    finale: { label: '⚑ ลงชั้นล่าง · จุดตัดสินใจสุดท้าย', towns: ['deepcairn'], when: g => !!root.Endings?.ready(g) },
    pit: { label: '⛏ ปากเหมืองชั้นล่าง', towns: ['deepcairn'], when: g => war(g) >= 3, daily: true },
    /* v98.486 · สถานที่เพิ่ม */
    faith: { label: '🕯 ที่พักผู้แสวงบุญนิกายรอรุ่งอรุณ', towns: ['northgate'], when: g => at(g, 'signs'), daily: true },
    clinic: { label: '🏥 เรือนพยาบาลผู้ลี้ภัย', towns: ['willowshore'], when: g => war(g) >= 3, cost: 15, daily: true },
    army: { label: '📦 คลังเสบียงหลวง · ขายให้ทัพ', towns: ['lakenhold', 'northgate'], when: g => war(g) >= 2, daily: true }
  };
  function services(g, town) {
    const out = [];
    for (const [k, o] of Object.entries(SPOTS)) if ((!o.towns || o.towns.includes(town)) && o.when(g)) out.push({ key: 'st:' + k, label: o.label, cost: o.cost || 0, daily: !!o.daily });
    return out;
  }
  const mine = g => g.village?.main?.flags || {};
  function run(g, town, key, S, ctx = {}) {
    const k = key.replace(/^st:/, ''), out = [], M = MS();
    if (k === 'news') {
      const sg = M.signs(g); out.push('📰 ' + (M.warText?.(g) || ''));
      for (const s of sg.slice(-4)) out.push('• ' + s.text); return { lines: out };
    }
    if (k === 'camp') {
      ctx.passTime?.(1); F()?.add('village', 1, 'แบ่งอาหารให้ค่ายผู้อพยพ'); const n = num(M.flag(g, 'campHelped')) + 1; M.set(g, 'campHelped', n);
      out.push('⛺ แบ่งอาหารและน้ำให้ผู้อพยพ · พวกเขาขอบคุณเงียบ ๆ ' + (n >= 3 ? '· มีคนบอกว่า "ชั้นล่างของเหมืองไม่ใช่ที่ที่คนควรลงไป"' : ''));
      if (n === 1) T()?.log(g, 'site.camp'); return { lines: out };
    }
    if (k === 'ruin') {
      ctx.passTime?.(2); const n = Math.min(3, num(M.flag(g, 'ruinStudy')) + 1); M.set(g, 'ruinStudy', n);
      const L = ['🏚 กระท่อมไม้เก่าที่ชายป่า ผนังมีรอยจารึกและโต๊ะเรียนที่ผุพัง… เคยมีคนสอนที่นี่',
        '📜 พบบันทึกเศษหนึ่ง: "ธาตุเริ่มแรกอยู่ในทุกสิ่ง ไม่มีธาตุใดสูงกว่าธาตุใด" ลายมือเรียบร้อยของคนที่สอนมานาน',
        '🕯 ใต้พื้นกระท่อมมีกล่องเล็ก ๆ ข้างในมีแผ่นจดว่าด้วยการ "ตัดสิ่งที่ผูกกับสิ่งที่ไม่ใช่ตัวมัน" — ไม่เข้าใจทั้งหมด แต่ถูกเก็บไว้เป็นอย่างดี'];
      out.push(L[n - 1]); if (n === 1) T()?.log(g, 'site.ruin'); if (n >= 3) out.push('✦ บันทึกครบชุดแรก — ตอนนี้พอเข้าใจแล้วว่ามีวิธีของคนสมัยก่อนที่ใช้กับสิ่งที่ผูกติดกับสิ่งอื่น'); return { lines: out };
    }
    if (k === 'faith') {
      ctx.passTime?.(1); const n = Math.min(3, num(M.flag(g, 'faithVisits')) + 1); M.set(g, 'faithVisits', n); M.set(g, 'faithHeard', Math.max(num(M.flag(g, 'faithHeard')), n));
      const L = ['🕯 ห้องพักเล็กที่ผู้แสวงบุญจุดเทียนเรียงบนพื้นหิน เฮลกาเล่า: "เทพไม่ได้จากไป ท่านหลับ — และเรากำลังรอวันที่ท่านพร้อมตื่น"',
        '🕯 "แร่ที่พวกเจ้าขุดคือเถ้ากระดูกของบุตรคนแรกของเทพ" เธอพูดเบา ๆ "ถ้าเจ้ามองมันเป็นแค่ของมีค่า เจ้าก็เหมือนกับคนที่ขโมยของจากหลุมศพ"',
        '🕯 เฮลกาถามกลับ: "ข้าอยากรู้ว่าฝั่งเจ้าเชื่ออะไร" คุณเล่าเรื่องเทพที่อยู่รอบตัว เธอฟังจบแล้วยิ้ม "อาจไม่ต่างกันเท่าที่คิด"'];
      out.push(L[n - 1]); F()?.add('north', 1, 'พูดคุยกับผู้แสวงบุญ'); if (n === 1) T()?.log(g, 'site.faith'); return { lines: out };
    }
    if (k === 'clinic') {
      ctx.passTime?.(2); ctx.healParty?.(1); const n = num(M.flag(g, 'clinicVisits')) + 1; M.set(g, 'clinicVisits', n); F()?.add('village', 1, 'บริจาคเรือนพยาบาล');
      out.push('🏥 หมอหญิงไอรีนรักษาแผลทั้งทีมโดยไม่ถามอะไร · HP เต็ม · บริจาคให้เรือนพยาบาล'); if (n === 1) T()?.log(g, 'site.clinic'); return { lines: out };
    }
    if (k === 'army') {
      const cargo = S.cargo || {}, goods = ['iron', 'ore', 'cloth', 'salt', 'fish', 'wood'].filter(x => num(cargo[x]) > 0); if (!goods.length) return { lines: ['📦 ไม่มีเหล็ก แร่ ผ้า เกลือ ปลา หรือไม้ในเกวียน — ทัพไม่รับของอื่น'] };
      let total = 0, n = 0; const sp = (root.Settlements?.sellPrice) || (() => 8);
      for (const x of goods) { const q = cargo[x]; total += Math.round(q * (num(sp(town, x)) || 0) * 1.25); n += q; delete cargo[x] }
      S.gold = num(S.gold) + total; S.traded = num(S.traded) + n; F()?.add('crown', 1, 'ขายเสบียงให้ทัพ'); F()?.add('garrison', 1, 'ขายเสบียงให้ทัพ'); M.set(g, 'armyOrders', num(M.flag(g, 'armyOrders')) + 1);
      out.push('📦 ส่งเสบียง ' + n + ' หน่วยให้ทัพในราคาพิเศษ +25% = ' + total + ' 💰 · ชื่อเสียงราชสำนัก/กองทหารเพิ่ม'); if (num(M.flag(g, 'armyOrders')) === 1) T()?.log(g, 'site.army'); return { lines: out };
    }
    if (k === 'finale') return { lines: [], panel: 'finale' };
    if (k === 'epilogue') return { lines: root.Endings?.afterLines(g, town) || [] };
    if (k === 'pit') {
      ctx.passTime?.(1); const first = !M.flag(g, 'pitSeen'); M.set(g, 'pitSeen', true); if (num(M.flag(g, 'pitListen')) < 2) { M.set(g, 'pitListen', num(M.flag(g, 'pitListen')) + 1); M.set(g, 'mineInfo', num(M.flag(g, 'mineInfo')) + 1); out.push('✦ ตั้งใจฟังเสียงจากข้างล่าง — ได้ข้อมูลเรื่องเหมืองเพิ่ม') }
      out.push('⛏ ปากทางลงชั้นล่างถูกปิดด้วยไม้ขวางและอัศวินสองนายยืนเฝ้า · อากาศเย็นขึ้นหนึ่งระดับเมื่อเดินเข้าใกล้ · ได้ยินเสียงขุดจากข้างล่างเบา ๆ');
      if (war(g) >= 4) out.push('บางสิ่งที่ไม่ใช่เสียงขุดดังตามมา — อัศวินคนหนึ่งหันมามองเจ้าแล้วส่ายหน้า'); if (first) T()?.log(g, 'site.mine'); return { lines: out };
    }
    return { lines: out };
  }

  /* หน้าตัวละคร (CT-style frame) — ภาพจริงถ้ามี · ไม่มี = ภาพวาดด้วยโค้ด (js/code-portraits.js) */
  const CARD_FACE = ['bram', 'kier', 'luna', 'mil'];
  const ALIAS = { third: 'corvin', mage: 'serrien' };
  function face(id) {
    id = ALIAS[id] || id;
    if (id === 'hero') return { src: 'assets/portraits/hero-male-neutral.webp', pos: '50% 4%', size: '230%' };
    if (id === 'mip') return { src: 'assets/ui/mip-sheet.webp?v=2', pos: '0% 50%', size: '1200% auto' };
    const P = root.CodePortraits; if (P && P.has(id)) { const s = P.get(id); return s ? { src: s, pos: '50% 50%', size: '100%' } : null }
    if (CARD_FACE.includes(id)) return { src: `assets/cards/portraits/u-${id}.webp`, pos: '50% 22%', size: '165%' };
    return { src: `assets/village-town/npc/${id}/sw-stand.webp`, pos: '50% 9%', size: '285%' };
  }
  const api = { face, CAST, EXTRA, SPOTS, locals, services, run };
  root.StoryCast = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

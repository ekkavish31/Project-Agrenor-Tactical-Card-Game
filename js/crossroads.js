/* v98.486 · ทางแยก ⑂ และอีเวนต์คาบเกี่ยวของเนื้อเรื่องหลัก (docs/PROPOSAL-CROSSROADS-TH.md · ผู้ใช้สั่งทำ 14 พ.ย. 2026)
   เกมไม่ได้ให้เลือกเส้นเรื่อง — ทุกเส้นเดินพร้อมกัน ที่นี่คือ "จุดที่ต้องเลือก": แต่ละอีเวนต์ = สถานการณ์ในเมืองบนแผนที่ + 3 ทางเลือกที่มีราคา (ไม่มีถูก/ผิด)
   กติกา: • ผูกกับหมุดเรื่อง (MainStory) ไม่ผูกกับวัน · • มีหน้าต่างเวลา (until) — ผ่านหมุดนั้นโดยไม่ตัดสินใจ = fallback เกิดเอง + บันทึกข่าว
          • ทุกการเลือกเขียน Chronicle (Titles.log 'cr.<id>') + ธง cr_<id> (village.main.flags) + "แนวโน้ม" lean_light/shadow/crown/north/village ที่สะสมไปตัดสินตอนจบ (ยังไม่ทำฉากจบ)
          • ไม่มีใครตาย ไม่ทิ้งทีมถาวร · ไม่มีเซฟก้อนใหม่ · วันละไม่เกิน 1 อีเวนต์
   API: pick(g,S,town) → event|null · resolve(g,S,ev,i,ctx) → {lines} · expire(g,S) → [lines] · leans(g) · EVENTS
   ctx = { passTime(h) } จาก js/world-map.js · เทสต์: tools/test-crossroads.cjs */
(function (root) {
  'use strict';
  const MS = () => root.MainStory, T = () => root.Titles, F = () => root.Factions, AD = () => root.ADVENTURE_DATA;
  const num = (x, d = 0) => Number.isFinite(+x) ? +x : d;
  const at = (g, id) => !!MS() && MS().atLeast(g, id);
  const past = (g, id) => { const M = MS(); if (!M) return false; const i = M.STAGES.findIndex(s => s.id === id); return i >= 0 && M.index(g) > i };
  const war = g => MS() ? MS().war(g) : 0, inf = (g, t) => MS() ? MS().infection(g, t) : 0;
  const flag = (g, k) => MS()?.flag(g, k), setf = (g, k, v) => MS()?.set(g, k, v), bump = (g, k, n = 1) => setf(g, k, num(flag(g, k)) + n);
  const rep = (id, n, why) => { try { F()?.add(id, n, why) } catch (e) { } };
  const lean = (g, side, n = 1) => bump(g, 'lean_' + side, n);
  const inParty = (S, key) => !!S && ((S.party || []).some(p => p.key === key) || (S.bench || []).some(p => p.key === key));
  const mayaIds = () => Object.values(AD()?.MAYA_OF || {});
  const mayaHeld = g => { const b = g.village?.bag || {}; return mayaIds().filter(id => num(b[id]) > 0) };
  const takeMaya = g => { const id = mayaHeld(g)[0]; if (!id) return null; const b = g.village.bag; b[id]--; if (b[id] <= 0) delete b[id]; return id };
  const vendor = id => Math.max(1, Math.round((AD()?.GOODS?.[id]?.price || 60) * .65));
  const gold = (S, n) => { S.gold = Math.max(0, num(S.gold) + n) };
  const need = (S, n) => num(S.gold) < n ? 'เงินไม่พอ' : '';

  /* ---------- ข้อมูลอีเวนต์ ---------- */
  const EVENTS = [
    /* ===== ทางแยกเล็ก (X-A) ===== */
    { id: 'fugitive', icon: '🏃', title: 'เชลยที่หนีมา', towns: ['willowshore', 'northgate'], from: 'release', until: 'mine', who: 'vik', cast: 'เชลยศึกคนหนึ่ง',
      when: g => war(g) >= 3,
      text: 'ชายผอมซีดในเสื้อขาดวิ่งเข้าซอยหลังตลาด หอบจนพูดไม่เป็นคำ "ข้าหนีมาจากข้างล่าง… ชั้นล่างของเหมือง ได้ยินแล้วใช่ไหม เสียงขุดนั่น ไม่ได้หยุดเลย" ทหารสองนายกำลังตามหาเขาอยู่',
      choices: [
        { label: 'ซ่อนเขาไว้ที่โรงเตี๊ยม', run: c => { rep('village', 2, 'ซ่อนเชลยที่หนีมา'); rep('crown', -1, 'ซ่อนเชลยที่หนีมา'); lean(c.g, 'north'); bump(c.g, 'mineInfo'); return ['เขากินข้าวต้มสองชาม แล้วเล่าเรื่องชั้นล่างทั้งคืน — ที่นั่นไม่ได้ขุดแร่อย่างเดียว คนที่ถูกส่งลงไปไม่ค่อยได้ขึ้นมา', '✦ ได้ข้อมูลเรื่องเหมืองเพิ่ม'] } },
        { label: 'ส่งตัวคืนให้ทหาร', run: c => { rep('crown', 2, 'ส่งเชลยคืน'); rep('garrison', 1, 'ส่งเชลยคืน'); rep('village', -1, 'ส่งเชลยคืน'); lean(c.g, 'crown'); return ['ทหารรับตัวไปโดยไม่พูดอะไร ชายคนนั้นหันมามองคุณครั้งเดียว… แล้วไม่ได้พูดสักคำ'] } },
        { label: 'พาไปหาผู้เฝ้าแสงที่ธอร์นวอตช์', cost: 10, ok: (g, S) => need(S, 10), run: c => { gold(c.S, -10); rep('light', 2, 'ช่วยเชลยหนีมาถึงผู้เฝ้าแสง'); rep('crown', -1, 'ช่วยเชลยหนี'); lean(c.g, 'light'); bump(c.g, 'mineInfo'); return ['คุณจ่ายค่าเรือและพาเขาออกจากเมืองก่อนรุ่งสาง ที่ค่ายป่ามีคนในเสื้อสีอ่อนรอรับอยู่ — พวกเขาไม่ถามอะไรเลย แค่พยักหน้า', '✦ ได้ข้อมูลเรื่องเหมืองเพิ่ม'] } }
      ],
      fallback: c => { rep('crown', 1, 'ทหารจับเชลยได้เอง'); return ['ข่าวบอกว่าทหารจับเชลยที่หนีมาได้ในคืนเดียวกัน — เรื่องที่เขาเห็นไม่เคยถูกเล่าให้ใครฟัง'] } },
    { id: 'callup', icon: '📜', title: 'ใบเรียกพล', towns: ['willowshore', 'northgate', 'lakenhold'], from: 'signs', until: 'release', who: 'corvin', cast: 'หนุ่มชาวบ้านที่ได้รับใบเรียกพล',
      when: g => war(g) >= 2,
      text: 'หนุ่มคนหนึ่งยืนถือกระดาษที่ลานตลาด มือสั่น "ข้าไม่เคยจับดาบสักครั้ง… แม่ข้ายังป่วยอยู่" ผู้ตรวจการเสบียงบอกว่าใบเรียกพลคือคำสั่ง แต่ก็ยอมรับข้อตกลงบางอย่างได้',
      choices: [
        { label: 'ไปส่งเขาที่ด่าน (1 ชม.)', run: c => { c.ctx.passTime?.(1); rep('crown', 1, 'ส่งผู้ถูกเกณฑ์ที่ด่าน'); rep('garrison', 2, 'ส่งผู้ถูกเกณฑ์ที่ด่าน'); lean(c.g, 'crown'); return ['คุณเดินไปกับเขาจนถึงด่าน ทหารฝึกรับตัวไปอย่างสุภาพ "เขาจะได้อยู่ฝ่ายเสบียง ไม่ใช่แนวหน้า" ทหารสัญญา'] } },
        { label: 'จ่ายค่าไถ่แทน (25 💰)', cost: 25, ok: (g, S) => need(S, 25), run: c => { gold(c.S, -25); rep('village', 2, 'จ่ายค่าไถ่ผู้ถูกเกณฑ์'); rep('crown', -1, 'จ่ายค่าไถ่ผู้ถูกเกณฑ์'); lean(c.g, 'village'); return ['เจ้าหน้าที่รับเงินโดยไม่เงยหน้า แม่ของหนุ่มคนนั้นร้องไห้ตอนที่ได้รู้'] } },
        { label: 'ให้เขาหลบไปก่อน', run: c => { rep('village', 1, 'ช่วยผู้ถูกเกณฑ์หลบ'); rep('garrison', -2, 'ช่วยผู้ถูกเกณฑ์หลบ'); lean(c.g, 'village'); return ['คุณชี้ทางเก่าไปทางป่าให้ หนุ่มคนนั้นพยักหน้าเงียบ ๆ แล้วหายไป — ต่อไปคงต้องระวังทหารตรวจ'] } }
      ],
      fallback: c => { rep('garrison', 1, 'ผู้ถูกเกณฑ์ถูกรับตัวไป'); return ['หนุ่มคนนั้นถูกรับตัวไปเมื่อเช้า ไม่มีเสียงขัดขืน ไม่มีใครมาส่ง'] } },
    { id: 'firstSick', icon: '🩺', title: 'ผู้ติดเชื้อรายแรก', towns: ['willowshore', 'deepcairn', 'thornwatch'], from: 'mine', until: 'climax', who: 'irene', cast: 'ชาวบ้านที่มีอาการรอยหมอง',
      when: (g, S, t) => inf(g, t) >= 1 && war(g) >= 3,
      text: 'ชายวัยกลางคนนั่งหลังโรงน้ำชา ตาขุ่นเหมือนมีควันดำลอยอยู่ข้างใน มือของเขาเย็นเฉียบ "เมื่อคืนข้าไปเก็บฟืนทางโพรงหินแล้วเจอสัตว์ตัวหนึ่ง… มันไม่ได้โจมตี มันแค่มองข้า" นี่คือรอยหมอง ระยะแรก',
      choices: [
        { label: 'กักตัวที่บ้านและเฝ้าดู', run: c => { rep('village', 1, 'กักตัวผู้ติดเชื้อ'); const r = Math.random() < .5; lean(c.g, 'village'); return r ? ['สามวันต่อมาอาการสงบลงเอง… แต่คุณรู้สึกว่ามันแค่ถูกเลื่อนออกไป'] : ['เขาเริ่มพึมพำเรื่องเสียงขุด ครอบครัวกลัวจนไม่กล้าเข้าใกล้ — คุณต้องหาทางอื่นแล้ว'] } },
        { label: 'พาไปเรือนพยาบาล (15 💰)', cost: 15, ok: (g, S) => need(S, 15), run: c => { gold(c.S, -15); rep('village', 2, 'ช่วยผู้ติดเชื้อทัน'); rep('temple', 1, 'ช่วยผู้ติดเชื้อทัน'); bump(c.g, 'infectedHelped'); return ['หมอหญิงไอรีนใช้ผ้าชุบน้ำสมุนไพรเช็ดหน้าเขา "ยังทัน" เธอบอก "ถ้ามาช้าไปอีกสองวัน ข้าก็ทำอะไรไม่ได้แล้ว"', '✦ ช่วยได้ทันตามระยะแรก'] } },
        { label: 'ส่งไปให้ทหารที่ด่านจัดการ', run: c => { rep('garrison', 2, 'ส่งผู้ติดเชื้อให้ด่าน'); rep('village', -2, 'ส่งผู้ติดเชื้อให้ด่าน'); lean(c.g, 'crown'); return ['ทหารพาเขาไปโดยไม่พูดอะไร ชาวบ้านมองคุณด้วยสายตาที่ไม่ใช่สายตาของคนที่ขอบคุณ'] } }
      ],
      fallback: c => { rep('village', -1, 'ผู้ติดเชื้อรายแรกไม่ได้รับการช่วย'); return ['ข่าวบอกว่าชายคนนั้นหายไปจากหมู่บ้านในคืนเดียว ไม่มีใครพูดถึงอีก'] } },
    { id: 'mayaBroker', icon: '🪙', title: 'ตลาด ❖', towns: ['haven'], from: 'wake', until: 'chase', who: 'vik', cast: 'วิก นายหน้าตลาดมืด',
      when: g => mayaHeld(g).length > 0,
      text: 'ชายใต้ผ้าคลุมเลื่อนถุงเล็ก ๆ มาให้คุณดู "ของที่คุณถืออยู่นั่น… ❖ ใช่ไหม ราคาตลาดเดี๋ยวนี้ไม่ธรรมดา ทั้งอัศวินทั้งคนแปลกหน้าถามหากันอยู่" เขาไม่ยอมบอกว่าใครเป็นผู้ซื้อ',
      choices: [
        { label: 'ขายให้ตลาด', run: c => { const id = takeMaya(c.g); const p = Math.round(vendor(id) * 1.6); gold(c.S, p); rep('merchants', 1, 'ขายชิ้นส่วน ❖'); return ['ขายชิ้นส่วนไปในราคา ' + p + ' 💰 — ' + (AD().GOODS[id]?.name || '')] } },
        { label: 'เก็บไว้ให้ Mip', run: c => { lean(c.g, 'village'); return ['คุณเก็บถุงไว้ในกระเป๋า วิกยักไหล่ "ถ้าเปลี่ยนใจ ข้าอยู่แถวนี้เสมอ"'] } },
        { label: 'ขายให้ผู้ซื้อลึกลับ', run: c => { const id = takeMaya(c.g); const p = Math.round(vendor(id) * 2.2); gold(c.S, p); rep('shadow', 2, 'ขายชิ้นส่วน ❖ ให้ผู้ซื้อลึกลับ'); rep('merchants', -1, 'ขายนอกตลาด'); lean(c.g, 'shadow'); return ['มีมือสวมถุงมือดำรับถุงไปโดยไม่เห็นหน้า คุณได้ ' + p + ' 💰 และความรู้สึกว่ามีคนจดชื่อคุณไว้'] } }
      ] },
    { id: 'corvinInvite', icon: '🎖', title: 'คำเชิญของคอร์วิน', towns: ['lakenhold'], from: 'wake', until: 'chase', who: 'corvin', cast: 'นายพลคอร์วิน แธเรล',
      when: g => !!flag(g, 'mipJoined'),
      text: 'ผู้ตรวจการเสบียงหลวงเรียกคุณเข้าห้องทำงานที่เต็มไปด้วยบัญชี "ข้าได้ยินว่าเจ้ามีเพื่อนตัวเล็กที่พิเศษ… ราชสำนักอยากให้เจ้าแบ่งมันมาช่วยงาน แค่ให้มันได้ใช้ความสามารถเพื่ออัลเดรน"',
      choices: [
        { label: 'ปฏิเสธตรง ๆ', run: c => { rep('supply', -1, 'ปฏิเสธคอร์วิน'); lean(c.g, 'village'); return ['คอร์วินมองคุณนาน "ข้าไม่ชอบถูกปฏิเสธ แต่ข้าชอบคนที่รู้ว่าตัวเองต้องการอะไร" เขาพับแฟ้มปิด'] } },
        { label: 'ตบตา — รับปากไว้ก่อน', run: c => { rep('supply', 1, 'ตบตาคอร์วิน'); setf(c.g, 'corvinTrick', true); return ['คุณรับปากว่าจะ "พิจารณา" เขายิ้มบาง ๆ — ดูเหมือนรู้ว่าคุณกำลังซื้อเวลา แต่ก็ยอมให้'] } },
        { label: 'ร่วมมือแบบพิธีการ', run: c => { rep('supply', 2, 'ร่วมมือกับคอร์วิน'); rep('crown', 1, 'ร่วมมือกับคอร์วิน'); setf(c.g, 'corvinHelped', true); lean(c.g, 'crown'); return ['คุณยอมให้ทีมของเขาดู Mip จากระยะไกล แค่ดู แค่จด… แต่ Mip หันหน้าหนีตลอดเวลา และคุณรู้สึกผิดแปลก ๆ'] } }
      ],
      fallback: c => { rep('supply', -1, 'ไม่ตอบคอร์วิน'); return ['คอร์วินส่งคนมาแจ้งว่า "ข้อเสนอหมดอายุแล้ว" — แต่สายตาของเขายังตามคุณอยู่'] } },
    { id: 'convoy', icon: '⛓', title: 'ขบวนนักโทษ', towns: ['northgate'], from: 'release', until: 'mine', who: 'helga', cast: 'พี่น้องเฮลกา',
      when: g => war(g) >= 3,
      text: 'ขบวนเกวียนมีเหล็กดำหุ้มผ่านด่านก่อนรุ่งสาง ในนั้นมีคนใส่เสื้อคลุมเทาของนิกายรอรุ่งอรุณปนอยู่ เฮลกากระซิบ "พวกเขาไม่ได้อยากไปเหมือง… ได้โปรด"',
      choices: [
        { label: 'ปล่อยผ่านเงียบ ๆ', run: c => { rep('garrison', 1, 'ปล่อยขบวนผ่านด่าน'); rep('north', -1, 'ปล่อยขบวนผ่านด่าน'); return ['คุณยืนมองขบวนผ่านไป เฮลกาหลับตา สวดบางอย่างเบา ๆ แล้วเดินจากไป'] } },
        { label: 'ตามขบวนไปดูเหมือง', run: c => { c.ctx.passTime?.(2); bump(c.g, 'mineInfo'); setf(c.g, 'convoyFollowed', true); rep('north', 1, 'ตามขบวนไปดูเหมือง'); return ['คุณตามห่าง ๆ ไปถึงเนินสูงที่มองเห็นปากทางลงชั้นล่าง — มีผู้คนเข้าไปมากกว่าที่ออกมา', '✦ ได้ข้อมูลเรื่องเหมืองเพิ่ม'] } },
        { label: 'แจ้งทหารว่ามีคนไม่เต็มใจ', run: c => { rep('garrison', 2, 'แจ้งทหารเรื่องขบวน'); rep('crown', 1, 'แจ้งทหารเรื่องขบวน'); rep('north', -2, 'แจ้งทหารเรื่องขบวน'); lean(c.g, 'crown'); return ['ทหารพยักหน้า "เรื่องนั้นไม่ใช่ธุระของพ่อค้า" แต่คุณเห็นเขาจดอะไรบางอย่างไว้ เฮลกามองคุณแล้วเงียบ'] } }
      ],
      fallback: c => { rep('north', -1, 'ขบวนผ่านไปโดยไม่มีใครช่วย'); return ['ขบวนผ่านด่านไปเมื่อคืนโดยไม่มีใครทำอะไร — เฮลกาหายไปจากด่านตั้งแต่เช้า'] } },
    { id: 'moonRite', icon: '🌙', title: 'พิธีคืนจันทร์ม่วง', towns: ['northgate', 'thornwatch'], from: 'wake', until: 'chase', who: 'helga', cast: 'พี่น้องเฮลกา',
      when: g => !!flag(g, 'mipJoined'),
      text: 'จันทร์ดวงม่วงลอยเต็มดวงเหนือสันเขา ผู้แสวงบุญนิกายรอรุ่งอรุณก้มลงสวดกลางลานหินเตี้ย ๆ คืนนั้น Mip ขดตัวสั่นอยู่ข้างเท้าคุณ ปลอกที่คออาจจะเรืองแสงจาง ๆ',
      choices: [
        { label: 'ไปร่วมพิธี', run: c => { bump(c.g, 'faithHeard'); rep('north', 1, 'ร่วมพิธีคืนจันทร์ม่วง'); return ['เฮลกาเล่า "เทพไม่ได้จากไป… ท่านหลับ รอวันที่โลกพร้อมจะฟังอีกครั้ง" — แต่ Mip สั่นแรงขึ้นเมื่อเสียงสวดดังที่สุด', '✦ ได้ฟังความเชื่อฝ่ายเหนือ'] } },
        { label: 'อยู่เฝ้า Mip', run: c => { const m = MS().mip(c.g); m.dark = Math.max(0, num(m.dark) - 3); return ['คุณนั่งข้าง Mip ทั้งคืน ลูบหัวมันจนมันหลับ — สีขนของมันดูอ่อนลงเล็กน้อยในแสงเช้า'] } },
        { label: 'ตามเสียงที่ก้องในหัว', run: c => { bump(c.g, 'serrienHeard'); return ['เสียงของใครบางคนเบามากจนจับสำเนียงไม่ได้ "…ข้าไม่ได้ต้องการทำร้ายใคร… แค่ออกไปจากที่นี่" — แล้วเงียบ', '✦ เสียงในปลอกคอตอบกลับครั้งแรก'] } }
      ],
      fallback: c => ['คืนจันทร์ม่วงผ่านไป เช้าวันนั้น Mip ซึมกว่าปกติ แต่ก็ไม่มีอะไรผิดปกติให้เห็น'] },
    /* ===== อีเวนต์คาบเกี่ยว (C) ===== */
    { id: 'scent', icon: '🦊', title: 'กลิ่น ❖', towns: ['thornwatch'], from: 'release', until: 'mine', who: 'lorrik', cast: 'ลอร์ริก (Duum\'Lorien)',
      when: g => mayaHeld(g).length > 0 || num(flag(g, 'lean_shadow')) > 0,
      text: 'ลอร์ริกนั่งบนแคร่ไม้ท้ายค่ายเหมือนรอคุณมาตั้งแต่เช้า "กลิ่นในถุงของเจ้า… ไม่ใช่กลิ่นของคน" เขาไม่ได้ขู่ แค่เอ่ยเหมือนบอกว่าฝนจะตก "ข้าไม่ได้ต้องการให้เจ้าเสียของ เพียงอยากรู้ว่ามันมาจากไหน"',
      choices: [
        { label: 'แลกข้อมูลกับ ❖ หนึ่งชิ้น', ok: g => mayaHeld(g).length ? '' : 'ไม่มี ❖', run: c => { takeMaya(c.g); rep('shadow', 2, 'แลกข้อมูลกับนักล่าเงา'); lean(c.g, 'shadow'); bump(c.g, 'mineInfo'); return ['ลอร์ริกพยักหน้า "ที่ต้นตอ… มีบางอย่างหิวมานานแล้ว" เขาไม่พูดต่อ แต่เขียนทิศทางบนใบไม้ให้คุณ', '✦ ได้ข้อมูลเรื่องเหมืองเพิ่ม'] } },
        { label: 'บอกว่าไม่ขาย', run: c => { lean(c.g, 'village'); return ['ลอร์ริกยิ้มบาง "เข้าใจ" แล้วลุกจากไป — ข้างหลังมีรอยเท้าเล็กที่ไม่ใช่รอยคนตามเขาไป'] } },
        { label: 'ตอบว่าไม่รู้เรื่อง', run: c => { rep('shadow', -1, 'ปฏิเสธนักล่าเงา'); return ['ลอร์ริกมองมือคุณที่ซ่อนอยู่ใต้เสื้อคลุม แล้วหัวเราะเบา ๆ "ข้าจะรอ"'] } }
      ],
      fallback: c => ['ลอร์ริกหายไปจากค่ายเมื่อคืน — ไม่มีใครรู้ว่าไปไหน แต่รอยเท้าเล็ก ๆ รอบค่ายหายไปพร้อมเขา'] },
    { id: 'armor', icon: '🛡', title: 'เกราะ Xyriel', towns: ['lakenhold'], from: 'signs', until: 'chase', who: 'corvin', cast: 'ทหารฝ่ายเสบียง',
      when: g => war(g) >= 2,
      text: 'ทหารฝ่ายเสบียงมาถามหาช่างตีและเศษแร่ "ท่านนายพลต้องการเกราะผสม Xyriel อีกสองร้อยชุดก่อนฤดูหนาว ราคาที่ราชสำนักตั้งไว้ดีมาก" ที่มุมถนนมีหญิงชุดสีอ่อนจ้องมองอยู่อย่างเงียบ ๆ',
      choices: [
        { label: 'รับส่งของให้ (+40 💰)', run: c => { gold(c.S, 40); rep('crown', 2, 'ส่งเกราะ Xyriel ให้ทัพ'); rep('supply', 1, 'ส่งเกราะ Xyriel'); rep('light', -2, 'ส่งเกราะ Xyriel ให้ทัพ'); setf(c.g, 'armorSupplied', true); lean(c.g, 'crown'); return ['คุณจดคำสั่งซื้อและบอกกัสทางจดหมาย เกราะชุดแรกไปถึงแนวรบก่อนใบไม้ร่วง'] } },
        { label: 'ถ่วงเวลา', run: c => { rep('light', 1, 'ถ่วงคำสั่งเกราะ Xyriel'); rep('crown', -1, 'ถ่วงคำสั่งเกราะ Xyriel'); lean(c.g, 'light'); return ['คุณบอกว่าวัตถุดิบไม่พอ ทหารจดบันทึกอย่างผิดหวัง หญิงชุดสีอ่อนพยักหน้าน้อย ๆ แล้วเดินจากไป'] } },
        { label: 'ปฏิเสธออร์เดอร์', run: c => { rep('crown', -2, 'ปฏิเสธออร์เดอร์เกราะ'); rep('light', 1, 'ปฏิเสธออร์เดอร์เกราะ'); lean(c.g, 'village'); return ['ทหารมองคุณเหมือนไม่เชื่อ "ท่านจะเสียตลาดนะ" เขาว่า'] } }
      ],
      fallback: c => { rep('crown', 1, 'ราชสำนักหาช่างอื่นสั่งเกราะ'); return ['ราชสำนักสั่งเกราะจากช่างคนอื่นไปแล้ว — ราคาของเหล็กในตลาดขึ้นอีกเล็กน้อย'] } },
    { id: 'sickRefugee', icon: '⛺', title: 'ผู้อพยพที่ป่วย', towns: ['willowshore', 'northgate'], from: 'mine', until: 'climax', who: 'irene', cast: 'ผู้อพยพคนหนึ่ง',
      when: g => num(flag(g, 'campHelped')) >= 1 && war(g) >= 3,
      text: 'ที่ค่ายผู้อพยพ ผู้หญิงที่คุณเคยแบ่งอาหารให้ล้มลง ตาของเธอเริ่มมีควันดำจาง ๆ เหมือนที่ชาวบ้านเล่า คนรอบข้างถอยหนีจนลานโล่ง โรงเตี๊ยมเต็ม และไม่มีใครอยากเข้าใกล้',
      choices: [
        { label: 'ช่วยพยุงไปเรือนพยาบาล (10 💰)', cost: 10, ok: (g, S) => need(S, 10), run: c => { gold(c.S, -10); rep('village', 2, 'ช่วยผู้อพยพที่ป่วย'); rep('temple', 1, 'ช่วยผู้อพยพที่ป่วย'); bump(c.g, 'infectedHelped'); return ['ไอรีนรับตัวไว้โดยไม่ถามอะไร "ยังทัน… แต่ที่นี่เตียงเต็มแล้ว"', '✦ ช่วยได้ทันตามระยะแรก'] } },
        { label: 'ให้ค่ายกันห้องแยก', run: c => { rep('village', -1, 'แยกผู้อพยพที่ป่วย'); rep('garrison', 1, 'แยกผู้อพยพที่ป่วย'); return ['ค่ายกั้นผ้าใบแยกเต็นท์ให้เธอ อาการนิ่งอยู่สองวัน — แต่คนในค่ายเริ่มมองกันด้วยความกลัว'] } },
        { label: 'เดินผ่านไป', run: c => { rep('village', -2, 'ทิ้งผู้อพยพที่ป่วย'); return ['คุณเดินต่อโดยไม่หันกลับ — เสียงเด็กร้องตามหลังมาถึงปลายถนน'] } }
      ],
      fallback: c => { rep('village', -1, 'ผู้อพยพที่ป่วยไม่ได้รับการช่วย'); return ['ค่ายย้ายไปที่อื่นเมื่อคืน มีรายงานว่าหญิงคนนั้นถูกส่งไปที่ด่านตรวจ'] } },
    { id: 'languageLeaf', icon: '📖', title: 'ภาษาบนจารึก', towns: ['lakenhold'], from: 'wake', until: 'mine', who: null, cast: 'ท่านหญิงโอเดตต์',
      when: g => num(flag(g, 'ruinStudy')) >= 1,
      text: 'ท่านหญิงโอเดตต์วางแผ่นกระดาษที่คุณคัดลอกมาจากร่องรอยสำนักชายป่าไว้เคียงลายบนการ์ดเก่า "ลายเส้นซ้ำกันอย่างจงใจ… คุณช่วยถอดต่อได้ไหม ราชสำนักให้ทุนวิจัยเต็มที่ แต่ขอผลงานทั้งหมด"',
      choices: [
        { label: 'แบ่งความรู้ให้ราชสำนัก (+30 💰)', run: c => { gold(c.S, 30); rep('crown', 2, 'แบ่งความรู้จารึกให้พิพิธภัณฑ์'); setf(c.g, 'studyShared', true); lean(c.g, 'crown'); return ['พิพิธภัณฑ์รับสำเนาไปจัดแสดงเป็นความรู้ใหม่ — โอเดตต์ขอบคุณและสัญญาว่าจะระบุชื่อคุณ'] } },
        { label: 'เก็บไว้ที่สำนักชายป่า', run: c => { setf(c.g, 'studyKept', true); rep('light', 1, 'เก็บความรู้จารึกไว้'); lean(c.g, 'light'); return ['โอเดตต์ถอนหายใจ "เข้าใจ… ความรู้บางอย่างไม่ได้อยากถูกจัดแสดง"'] } },
        { label: 'บอกแค่ครึ่งเดียว', run: c => { rep('crown', 1, 'บอกความรู้ครึ่งเดียว'); setf(c.g, 'studyHalf', true); return ['คุณบอกลายเส้นบางส่วน โอเดตต์พยักหน้าเหมือนรู้ว่ามีอีกครึ่งที่คุณเก็บไว้ แต่ไม่ซักต่อ'] } }
      ],
      fallback: c => ['พิพิธภัณฑ์ถอดจารึกนั้นต่อโดยไม่มีคุณ — ผลออกมาครึ่ง ๆ กลาง ๆ'] },
    { id: 'gouge', icon: '💸', title: 'ความหิวดึงกิเลส', towns: null, from: 'release', until: 'mine', who: 'vik', cast: 'พ่อค้าคนหนึ่ง',
      when: g => war(g) >= 3 && (num(flag(g, 'cr_gouge')) === 0),
      text: 'พ่อค้าท้องถิ่นกระซิบข้างแผงว่า "สงครามทำให้ของขาดตลาด… ถ้าเราขึ้นราคาพร้อมกันตอนนี้ ใครจะกล้าว่า แบ่งคุณหนึ่งส่วน" เขามองเงาของตัวเองที่ยาวผิดปกติบนผนังโดยไม่รู้ตัว',
      choices: [
        { label: 'ร่วมขึ้นราคา (+30 💰)', run: c => { gold(c.S, 30); bump(c.g, 'greed'); rep('merchants', 2, 'ร่วมขึ้นราคา'); rep('village', -2, 'ร่วมขึ้นราคา'); return ['กำไรเข้ากระเป๋าเร็วกว่าที่คิด — แต่เมื่อออกจากร้าน อากาศรอบตลาดดูมืดขึ้นกว่าตอนมา'] } },
        { label: 'ขายราคาเดิม', run: c => { rep('village', 2, 'ไม่ขึ้นราคาในสงคราม'); rep('merchants', -1, 'ไม่ขึ้นราคาในสงคราม'); lean(c.g, 'village'); return ['พ่อค้ายักไหล่ แต่เด็กคนหนึ่งที่รออยู่หน้าแผงยิ้มให้คุณก่อนวิ่งไป'] } },
        { label: 'เปิดโปงในที่ประชุมตลาด', run: c => { rep('village', 2, 'เปิดโปงการโก่งราคา'); rep('merchants', -3, 'เปิดโปงการโก่งราคา'); rep('crown', 1, 'เปิดโปงการโก่งราคา'); return ['เสียงในตลาดแตกเป็นสองฝ่าย แต่พ่อค้าหลายรายยอมคงราคา ส่วนคุณมีศัตรูใหม่ในวงการ'] } }
      ],
      fallback: c => { bump(c.g, 'greed'); return ['ราคาเหล็กและข้าวขึ้นอีกรอบโดยไม่มีใครขัด — ชาวบ้านบ่นแต่ไม่มีใครทำอะไร'] } },
    /* ===== เรื่องย่อยที่ต่อเข้าเส้นเดิม (v98.488 · docs/PROPOSAL-SUBPLOTS-TH.md) ===== */
    { id: 'boudilList', icon: '📋', title: 'รายชื่อคนงานที่หาย', towns: ['deepcairn'], from: 'release', until: 'mine', who: null, cast: 'โบดิล หัวหน้าคนงานเหมือง',
      when: g => war(g) >= 3,
      text: 'โบดิลลากคุณไปหลังโรงเก็บเครื่องมือ มือสั่นขณะคลี่กระดาษยับ ๆ ที่เขียนชื่อไว้สิบกว่าชื่อ "คนงานของข้า… หายไปจากกะกลางคืนเป็นครั้งคราว ไม่มีใครบอกว่าไปไหน ถ้าเจ้าลงไปข้างล่างเมื่อไร ข้าขอให้เจ้ามองหาชื่อพวกนี้ด้วย"',
      choices: [
        { label: 'รับรายชื่อไว้และสัญญาว่าจะมองหา', run: c => { setf(c.g, 'listKept', true); rep('village', 1, 'รับรายชื่อคนงานที่หาย'); lean(c.g, 'village'); bump(c.g, 'mineInfo'); return ['โบดิลกุมมือคุณแน่น "แค่รู้ว่ามีคนมองหา… ก็พอแล้ว"', '✦ ได้ข้อมูลเรื่องเหมืองเพิ่ม (กะที่คนหายไป ตรงกับเวลาที่เสียงขุดดัง)'] } },
        { label: 'ให้เงินช่วยครอบครัวของพวกเขา (20 💰)', cost: 20, ok: (g, S) => need(S, 20), run: c => { gold(c.S, -20); rep('village', 2, 'ช่วยครอบครัวคนงานที่หาย'); setf(c.g, 'familiesHelped', true); return ['โบดิลไม่ถามว่าทำไม เขาแค่พยักหน้าแล้วเดินไปแจกให้ครอบครัวทีละบ้าน'] } },
        { label: 'บอกว่ายังไม่ใช่ธุระของคุณ', run: c => { rep('crown', 1, 'ไม่ยุ่งเรื่องคนงานที่หาย'); return ['โบดิลพับกระดาษเก็บ "ข้าเข้าใจ… ทุกคนมีเรื่องของตัวเอง" เขาหันไปจัดเครื่องมือโดยไม่พูดอีก'] } }
      ],
      fallback: c => { rep('village', -1, 'ไม่มีใครมองหาคนงานที่หาย'); return ['โบดิลเลิกถามหาคนช่วย — เขาเริ่มเขียนชื่อคนงานเพิ่มในกระดาษเดิมเองทุกวัน'] } },
    { id: 'lightPass', icon: '☀', title: 'ผู้เฝ้าแสงขอทางผ่าน', towns: ['thornwatch'], from: 'release', until: 'chase', who: 'mierris', cast: 'เมียร์ริส (Elu\'Mierwaa)',
      when: g => at(g, 'release'),
      text: 'เมียร์ริสยืนที่ประตูค่ายรั้วไม้ข้างเรนัลด์ผู้ดูแลค่าย "พวกเราต้องการผ่านค่ายนี้ไปทางดีปแคร์นโดยไม่ให้ใครรู้ — ไม่ได้ต้องการต่อสู้ ต้องการเห็นปากเหมืองด้วยตาตัวเอง" เรนัลด์มองคุณ "ข้าไม่ชอบคนที่มาโดยไม่บอกว่าเป็นใคร… แต่ข้าจะฟังถ้าเจ้ารับรอง"',
      choices: [
        { label: 'รับรองพวกเขาต่อเรนัลด์', run: c => { rep('light', 2, 'รับรองผู้เฝ้าแสงที่ธอร์นวอตช์'); rep('guild', -1, 'รับรองคนแปลกหน้า'); lean(c.g, 'light'); return ['เรนัลด์ถอนหายใจและเปิดประตูข้างให้ "ถ้าเกิดเรื่อง ข้าจะบอกว่าเจ้าเป็นคนพามา" เมียร์ริสโค้งให้คุณหนึ่งครั้ง'] } },
        { label: 'บอกให้เรนัลด์ปฏิเสธ', run: c => { rep('guild', 2, 'ปกป้องค่ายสมาคมจากคนแปลกหน้า'); rep('light', -1, 'ปฏิเสธผู้เฝ้าแสง'); lean(c.g, 'crown'); return ['เมียร์ริสพยักหน้าช้า ๆ "เราจะหาทางอื่น" — ข้างหลังเธอ ผู้เฝ้าแสงอีกสองคนมองคุณอย่างไม่ตัดสิน'] } },
        { label: 'ชวนไปดูร่องรอยสำนักชายป่าก่อน', ok: g => num(flag(g, 'ruinStudy')) >= 1 ? '' : 'ยังไม่เคยไปร่องรอยสำนัก', run: c => { rep('light', 1, 'พาผู้เฝ้าแสงไปดูร่องรอยสำนัก'); rep('guild', 1, 'พาผู้เฝ้าแสงไปดูร่องรอยสำนัก'); setf(c.g, 'lightShownRuin', true); lean(c.g, 'village'); return ['เมียร์ริสยืนนิ่งนานหน้ากระท่อมเก่า "เมืองของเราก็เคยมีที่แบบนี้… ก่อนสิ่งที่ไม่ควรเกิดจะเกิด" เธอบอกใบ้หนึ่งอย่างเกี่ยวกับวิธีของคนโบราณ','✦ เมียร์ริสเล่าวิธีที่เมืองของเธอใช้ — เป็นเบาะแสสำหรับการชำระ'] } }
      ],
      fallback: c => ['ผู้เฝ้าแสงผ่านค่ายไปเองก่อนรุ่งสาง ไม่มีใครเห็นว่าไปทางไหน — เรนัลด์บ่นว่าลืมกลอนประตูข้างไว้'] },
    /* ===== เส้นสหาย R8 (ต้องมีสหายในทีม/ม้านั่งสำรอง) ===== */
    { id: 'sigrid', icon: '🪓', title: 'ซิกริดกับจดหมายจากเหนือ', towns: ['northgate', 'lakenhold'], from: 'release', until: 'mine', who: 'sigrid', cast: 'ซิกริด', companion: 'sigrid',
      when: (g, S) => inParty(S, 'sigrid'),
      text: 'ซิกริดเงียบมาทั้งวันก่อนจะยื่นจดหมายขอบแตกให้คุณดู ตราประทับคือของฟรอสต์เมียร์ "เรียกข้ากลับเข้าสังกัดเก่า… เขาว่าถ้าไม่กลับ ครอบครัวข้าที่นั่นจะเดือดร้อน" เธอไม่ได้ขออะไร แค่ยื่นให้ดู',
      choices: [
        { label: '"ไปเถอะ ข้าไม่รั้ง"', run: c => { rep('north', 2, 'ปล่อยซิกริดกลับฟรอสต์เมียร์'); setf(c.g, 'sigridChoice', 'leave'); return ['ซิกริดนิ่งไปนาน "เจ้าจะไม่ถามว่าข้าจะกลับมาไหม?" — คุณตอบว่าไม่ต้อง เธอพยักหน้า และบอกว่า "ข้าจะกลับ" (เธอยังอยู่ในทีม)'] } },
        { label: '"ช่วยกันหาทางที่ไม่ต้องเลือก"', run: c => { rep('village', 1, 'ช่วยซิกริดหาทางอื่น'); setf(c.g, 'sigridChoice', 'both'); bump(c.g, 'bond_sigrid'); return ['เธอยิ้มเป็นครั้งแรกในรอบสัปดาห์ "ข้าไม่คิดว่ามีทางนั้น… แต่ข้ายินดีลอง"'] } },
        { label: '"อยู่กับเรา — ครอบครัวเจ้าจะปลอดภัย"', run: c => { rep('north', -1, 'ซิกริดไม่ตอบรับคำเรียก'); setf(c.g, 'sigridChoice', 'stay'); bump(c.g, 'bond_sigrid'); return ['ซิกริดมองจดหมายแล้วขยำเก็บใส่กระเป๋า "ข้าหวังว่าเจ้าจะพูดจริง"'] } }
      ] },
    { id: 'bram', icon: '🔨', title: 'บรัมกับค่าหัวผู้หนีทัพ', towns: ['northgate', 'lakenhold'], from: 'signs', until: 'mine', who: 'bram', cast: 'บรัม', companion: 'bram',
      when: (g, S) => inParty(S, 'bram') && war(g) >= 2,
      text: 'บนกระดานประกาศมีรูปวาดหนุ่มคนหนึ่งในชุดทหารรักษาเมือง ใต้รูปเขียนว่า "ค่าหัวผู้หนีทัพ" บรัมมองรูปนั้นนาน "เขาเคยเป็นเพื่อนข้า… หนีเพราะแม่ป่วย" เขาไม่ได้ขออะไร แค่พูด',
      choices: [
        { label: 'ช่วยบรัมหาเขา (2 ชม.)', run: c => { c.ctx.passTime?.(2); rep('garrison', -1, 'ช่วยผู้หนีทัพ'); rep('village', 2, 'ช่วยผู้หนีทัพ'); setf(c.g, 'bramChoice', 'help'); bump(c.g, 'bond_bram'); return ['คุณกับบรัมพบเขาซ่อนตัวอยู่ในโรงนาเก่าข้างบ้านแม่ เขาไม่ได้ขออภัยโทษ แค่ขอเวลา — และคุณกับบรัมให้เขา'] } },
        { label: '"อย่ายุ่งเลย มันไม่ใช่เรื่องเรา"', run: c => { rep('garrison', 1, 'ไม่ยุ่งเรื่องผู้หนีทัพ'); setf(c.g, 'bramChoice', 'ignore'); return ['บรัมเงียบลง แล้วพูดแค่ "ก็จริง" — แต่เขาไม่พูดอะไรอีกตลอดเย็น'] } },
        { label: 'แจ้งเรื่องให้ทหารอย่างมีเงื่อนไข', run: c => { rep('crown', 1, 'แจ้งผู้หนีทัพโดยมีเงื่อนไข'); rep('village', 1, 'ขอให้ลดโทษ'); setf(c.g, 'bramChoice', 'report'); return ['คุณขอให้โทษเบาลงเพราะเหตุผลของครอบครัว ทหารพยักหน้า "จะลองดู" — ไม่รับปาก'] } }
      ] },
    { id: 'kier', icon: '⚔', title: 'เคียร์กับคำชวนเป็นอัศวิน', towns: ['lakenhold', 'northgate'], from: 'signs', until: 'mine', who: 'kier', cast: 'เคียร์', companion: 'kier',
      when: (g, S) => inParty(S, 'kier') && war(g) >= 2,
      text: 'ทหารยศสูงคนหนึ่งเรียกเคียร์ไปคุยตามลำพังแล้วเขากลับมาด้วยสีหน้ามึน ๆ "เขาชวนข้าเข้ากองอัศวินเฝ้าเหมือง… เงินเดือนสูง ได้ยศ" เคียร์มองมือตัวเอง "ข้าฝันอยากเป็นอัศวินมาตั้งแต่เด็ก"',
      choices: [
        { label: '"ถ้าเจ้าอยากไป ข้าสนับสนุน"', run: c => { rep('crown', 1, 'สนับสนุนเคียร์เป็นอัศวิน'); setf(c.g, 'kierChoice', 'support'); bump(c.g, 'bond_kier'); return ['เคียร์ยิ้มจนตาหยี "ข้ายังไม่ตอบ… แต่ขอบคุณที่ไม่ห้าม" (เขายังอยู่ในทีม ตัดสินใจทีหลังได้)'] } },
        { label: '"เจ้าเป็นเพื่อนข้า ไม่ใช่อัศวินของใคร"', run: c => { rep('village', 1, 'เคียร์ปฏิเสธคำชวนอัศวิน'); setf(c.g, 'kierChoice', 'refuse'); bump(c.g, 'bond_kier'); return ['เคียร์หัวเราะ "ข้ากลัวว่าเจ้าจะพูดแบบนี้ …และดีใจที่เจ้าพูด"'] } },
        { label: '"ไปดูเหมืองก่อน แล้วค่อยตัดสิน"', run: c => { bump(c.g, 'mineInfo'); setf(c.g, 'kierChoice', 'look'); return ['เคียร์ตกลงขอเวลาดูงานจริงเสียก่อน — ได้ข้อมูลจากเขาเรื่องการเฝ้าเหมืองมาบ้างหลังกลับ', '✦ ได้ข้อมูลเรื่องเหมืองเพิ่ม'] } }
      ] },
    { id: 'luna', icon: '📚', title: 'ลูน่ากับซากโบราณ', towns: ['lakenhold', 'thornwatch'], from: 'wake', until: 'mine', who: 'luna', cast: 'ลูน่า', companion: 'luna',
      when: (g, S) => inParty(S, 'luna') && num(flag(g, 'ruinStudy')) >= 1,
      text: 'ลูน่านั่งทับสมุดจดทั้งคืน ข้างหน้ามีลายคัดลอกจากสำนักชายป่ากับสมุดวิจัยของพิพิธภัณฑ์ "ถ้าเอาสองอย่างนี้มารวมกัน… ข้าคิดว่าเข้าใจบางอย่าง แต่ถ้าข้าตีพิมพ์ บางคนจะรู้ว่าอะไรอยู่ใต้เหมือง"',
      choices: [
        { label: '"ตีพิมพ์เลย ความรู้ควรเปิด"', run: c => { rep('crown', 1, 'ลูน่าตีพิมพ์ผลวิจัย'); rep('supply', 1, 'ลูน่าตีพิมพ์ผลวิจัย'); setf(c.g, 'lunaChoice', 'publish'); lean(c.g, 'crown'); return ['งานตีพิมพ์ทำให้ลูน่าดังในแวดวง — และมีคนที่ไม่ได้ชอบงานนี้เริ่มถามหาเธอ'] } },
        { label: '"เก็บไว้ก่อน จนกว่าจะรู้มากกว่านี้"', run: c => { setf(c.g, 'lunaChoice', 'hold'); bump(c.g, 'bond_luna'); rep('light', 1, 'ลูน่าเก็บผลวิจัยไว้'); return ['ลูน่าพยักหน้าช้า ๆ "ข้าไม่เคยเก็บความรู้ไว้ ครั้งนี้เป็นครั้งแรก… และข้ากลัวว่ามันถูก"'] } },
        { label: '"แบ่งปันเฉพาะคนที่ไว้ใจได้"', run: c => { setf(c.g, 'lunaChoice', 'share'); bump(c.g, 'bond_luna'); bump(c.g, 'mineInfo'); rep('light', 1, 'แบ่งผลวิจัยกับผู้เฝ้าแสง'); lean(c.g, 'light'); return ['ลูน่าส่งสำเนาให้ผู้เฝ้าแสงที่ธอร์นวอตช์ ผู้เฝ้าตอบกลับด้วยทิศทางที่เธอไม่เคยเห็นในแผนที่', '✦ ได้ข้อมูลเรื่องเหมืองเพิ่ม'] } }
      ] }
  ];
  /* ================= v98.490 · ผลของทางเลือก "ผ่านระบบเกมจริง" (ไม่ใช่แค่กดปุ่ม) =================
     ทางเลือกหนึ่งมีได้ 3 แบบ (ใส่ใน MECH[อีเวนต์][ลำดับทางเลือก]) — ถ้าไม่มีใน MECH ก็เป็นข้อความธรรมดาเหมือนเดิม:
       fight: เปิดการต่อสู้จริงในสนามรบแบบการ์ด (ศัตรู/จำนวน/เป้าหมาย: ป้องกันค่าย defend:N · ฝ่าวงล้อม escape · ล้มหัวหน้า leader) → win / lose / flee
       check: ทอยตามสเตตัสของตัวเอก (strength/endurance/precision/knowledge + เลเวลหาร 2 + โบนัสสหายในทีม) เทียบ dc — โชว์โอกาสบนปุ่ม · พลาดแล้วอาจต้องสู้ (failFight)
       need : ใช้ของจริง (วัตถุดิบหีบ/โรงตีเหล็ก materials · ของในกระเป๋า bag) — ไม่มีของ = กดไม่ได้
     win/lose = 'run' (ใช้ผลเดิมของทางเลือก) หรือฟังก์ชัน c=>lines · ผลแพ้ต้องมีราคาที่เห็นได้ (ชื่อเสียง เงิน ของหาย Mip ดำขึ้น) ไม่ใช่แค่ข้อความ */
  const STAT_NAME = { strength: 'พละกำลัง', endurance: 'ความทนทาน', precision: 'ความแม่นยำ', knowledge: 'ความรู้' };
  const STAT_BONUS = { sigrid: { strength: 2 }, bram: { strength: 2, endurance: 1 }, kier: { precision: 2 }, luna: { knowledge: 2 } };
  const MAT_NAME = { iron: 'เหล็ก', coal: 'ถ่าน', wood: 'ไม้', food: 'เสบียง' };
  const itemName = k => AD()?.GOODS?.[k]?.name || AD()?.CONSUMABLES?.[k]?.name || k;
  const statOf = (g, S, k) => { const c = g.village?.character || {}; let v = num(c.stats?.[k]) + Math.floor(num(c.level, 1) / 2); for (const [who, b] of Object.entries(STAT_BONUS)) if (inParty(S, who) && b[k]) v += b[k]; return v };
  const chanceOf = (g, S, ck) => Math.max(10, Math.min(92, Math.round(50 + (statOf(g, S, ck.stat) - ck.dc) * 7)));
  const bagOf = g => g.village?.bag || {}, matsOf = g => g.village?.materials || {};
  function needWhy(g, S, nd) {
    if (!nd) return ''; for (const [k, n] of Object.entries(nd.mat || {})) if (num(matsOf(g)[k]) < n) return 'ต้องมี' + MAT_NAME[k] + ' ' + n + ' (มี ' + num(matsOf(g)[k]) + ')';
    for (const [k, n] of Object.entries(nd.item || {})) if (num(bagOf(g)[k]) < n) return 'ต้องมี' + itemName(k) + ' ' + n;
    if (nd.any && !nd.any.some(k => num(bagOf(g)[k]) > 0)) return 'ต้องมี' + nd.any.map(itemName).join(' หรือ ') + ' (หาได้จากการล่า/ป่า)'; return '' }
  function needTake(g, nd) { if (!nd) return; for (const [k, n] of Object.entries(nd.mat || {})) matsOf(g)[k] = num(matsOf(g)[k]) - n; for (const [k, n] of Object.entries(nd.item || {})) { bagOf(g)[k] -= n; if (bagOf(g)[k] <= 0) delete bagOf(g)[k] } if (nd.any) { const k = nd.any.find(x => num(bagOf(g)[x]) > 0); bagOf(g)[k]--; if (bagOf(g)[k] <= 0) delete bagOf(g)[k] } }
  const needText = nd => [...Object.entries(nd.mat || {}).map(([k, n]) => MAT_NAME[k] + '×' + n), ...Object.entries(nd.item || {}).map(([k, n]) => itemName(k) + '×' + n), ...(nd.any ? [nd.any.map(itemName).join('/') + '×1'] : [])].join(' + ');
  const F_ = (foe, n, dang, obj, intro, win, lose, flee) => ({ foe, n, dang, obj, intro, win, lose, flee });
  const MECH = {
    fugitive: {
      0: { fight: F_('bandit', 3, .55, '', 'ทหารตามล่าบุกค้นโรงเตี๊ยมกลางดึก — เชลยตัวสั่นอยู่หลังคุณ ต้องปกป้องเขา', 'run', c => { rep('crown', 1, 'ปกป้องเชลยไม่สำเร็จ'); rep('village', -1, 'โรงเตี๊ยมถูกค้น'); return ['ทหารลากเชลยออกไปทั้งที่เขามองมาทางคุณ — โรงเตี๊ยมถูกค้นจนพังข้าวของ'] }) },
      2: { check: { stat: 'precision', dc: 9, win: 'run', lose: c => { gold(c.S, -10); rep('crown', 1, 'ทหารสกัดกลางทาง'); return ['ทหารสกัดเรือกลางทาง คุณเสียค่าผ่านทาง 10 💰 และเชลยถูกจับตัวไป'] } } }
    },
    callup: { 2: { fight: F_('wolf', 3, .5, 'escape', 'หนุ่มวิ่งตามคุณเข้าป่า แต่ฝูงหมาป่าได้กลิ่นเลือดจากแผลเก่า — ต้องฝ่าไปให้พ้น', 'run', c => { rep('garrison', 1, 'ผู้ถูกเกณฑ์ถูกจับระหว่างหนี'); rep('village', -1, 'ผู้ถูกเกณฑ์ถูกจับระหว่างหนี'); return ['คุณพ้นมาได้ แต่หนุ่มหลงทางในป่า ทหารตรวจพบเขาในเช้าวันถัดมา'] }) } },
    firstSick: {
      0: { check: { stat: 'knowledge', dc: 8, win: c => { rep('village', 1, 'กักตัวผู้ติดเชื้อสำเร็จ'); lean(c.g, 'village'); return ['คุณจำวิธีเช็ดตัวด้วยสมุนไพรกับการแยกผ้าได้ — สามวันต่อมาอาการสงบลงเอง'] }, lose: c => { rep('village', -1, 'กักตัวผู้ติดเชื้อล้มเหลว'); return ['คุณไม่แน่ใจว่าอะไรได้ผล เขาเริ่มพึมพำเรื่องเสียงขุด ครอบครัวกลัวจนไม่กล้าเข้าใกล้ — ต้องหาทางอื่นแล้ว'] } } },
      1: { need: { any: ['herb', 'swampHerb'] } }
    },
    mayaBroker: { 2: { fight: F_('bandit', 3, .8, 'leader', 'มือถุงมือดำไม่ได้มาคนเดียว — พวกเขาจะเอาถุงไปโดยไม่จ่ายถ้าคุณไม่ล้มหัวหน้า', 'run', c => { const id = takeMaya(c.g); if (id) rep('shadow', -1, 'ถูกปล้น ❖'); return ['คุณแพ้ พวกเขายึด ❖ ไปโดยไม่จ่ายสักเหรียญ' + (id ? ' — ' + (AD().GOODS[id]?.name || '') : '')] }) } },
    corvinInvite: { 1: { check: { stat: 'precision', dc: 8, win: 'run', lose: c => { rep('supply', -2, 'ตบตาคอร์วินไม่แนบเนียน'); setf(c.g, 'corvinSuspect', true); return ['รอยยิ้มของคอร์วินหายไปครึ่งหนึ่ง "เจ้าเล่นละครไม่เก่งนัก" — เขาสั่งให้จดชื่อคุณไว้ในบัญชีอีกเล่มหนึ่ง'] } } } },
    convoy: { 1: { check: { stat: 'precision', dc: 10, win: 'run', failFight: { ...F_('bandit', 3, .7, '', 'ผู้คุมขบวนเห็นเงาของคุณบนเนิน — พวกเขาซุ่มรอไว้แล้ว ที่ช่องเขานี้พวกเขาได้เปรียบ ต้องคิดให้ดีก่อนบุก', 'run', c => { rep('garrison', -1, 'ถูกจับได้ว่าสะกดรอยขบวน'); return ['คุณหลุดออกมาได้ แต่ผู้คุมจำหน้าคุณได้ — ด่านจะไม่ต้อนรับคุณเหมือนเดิม'] }), scene: 'convoyPass' } } } },
    moonRite: { 1: { fight: { ...F_('murk', 2, .7, '', 'คืนจันทร์ม่วง สัตว์รอยหมองดมกลิ่น Mip เข้ามาในแสงเทียนหลายทาง — Mip ขดอยู่บนแท่นหินกลางลาน ปลอกคอของมันสั่นเป็นจังหวะ', c => { const m = MS().mip(c.g); m.dark = Math.max(0, num(m.dark) - 3); const id = AD()?.MAYA_OF?.murk; if (id) { c.g.village.bag ||= {}; c.g.village.bag[id] = num(c.g.village.bag[id]) + 1 } return ['คุณยืนคุ้ม Mip จนรุ่งเช้า สัตว์รอยหมองตัวสุดท้ายล้มลงข้างเทียน — ขนของ Mip ดูอ่อนลงเล็กน้อย', '✦ ได้ ' + (AD()?.GOODS?.[id]?.name || '❖')] }, c => { const m = MS().mip(c.g); m.dark = Math.min(100, num(m.dark) + 4); return ['พวกมันแตะตัว Mip ได้ก่อนคุณจะไล่ทัน — ขนของเจ้าตัวเล็กมืดลงอย่างเห็นได้ชัด'] }), scene: 'moonGuard' } } },
    scent: { 2: { check: { stat: 'precision', dc: 9, win: 'run', lose: c => { takeMaya(c.g); rep('shadow', 1, 'ลอร์ริกเอา ❖ ไป'); return ['ลอร์ริกมองมือที่ซ่อนอยู่ใต้เสื้อคลุมของคุณ แล้วหยิบ ❖ ออกจากถุงไปหนึ่งชิ้นโดยไม่พูดอะไร "ข้าไม่ขโมยหรอก… ข้าแค่ยืม"'] } } } },
    armor: { 0: { need: { mat: { iron: 2, coal: 1 } } } },
    sickRefugee: { 0: { fight: { ...F_('murk', 3, .8, '', 'ระหว่างที่คุณพยุงเธอ สัตว์รอยหมองหลายตัวถูกอาการของเธอดึงเข้ามาที่ค่าย — รั้วมีช่องเปิดสี่ช่อง ต้องกันไว้จนกว่าจะรุ่งเช้า', 'run', c => { rep('village', -1, 'ค่ายถูกสัตว์รอยหมองบุก'); gold(c.S, -10); return ['คุณช่วยเธอออกมาได้ แต่ค่ายเสียหาย ต้องจ่ายค่าซ่อม 10 💰 และชาวค่ายมองคุณด้วยความกลัว'] }), scene: 'campDefense' } } },
    languageLeaf: { 2: { check: { stat: 'knowledge', dc: 9, win: c => { rep('crown', 1, 'ถอดจารึกเอง'); bump(c.g, 'ruinStudy'); setf(c.g, 'studyHalf', true); return ['คุณนั่งเทียบลายทั้งคืนจนเจอรูปแบบที่ซ้ำ — บอกโอเดตต์ครึ่งหนึ่ง และเก็บอีกครึ่งไว้เป็นข้อสันนิษฐานของตัวเอง', '✦ ความรู้เรื่องวิธีของคนโบราณเพิ่ม'] }, lose: c => { setf(c.g, 'studyHalf', true); return ['คุณเทียบลายไม่ออก เลยบอกเท่าที่รู้ — โอเดตต์พยักหน้าเหมือนรู้ว่าไม่มีอะไรเหลือ'] } } } },
    gouge: { 2: { fight: F_('bandit', 3, .6, 'leader', 'ลูกน้องของพ่อค้าที่ถูกเปิดโปงมาเคาะประตูหลังเลิกตลาด — ต้องล้มหัวหน้าก่อนจะมีใครบาดเจ็บ', 'run', c => { rep('merchants', -3, 'เปิดโปงแล้วถูกเอาคืน'); rep('village', -1, 'เปิดโปงแล้วถูกเอาคืน'); return ['คุณเสียท่า ลูกน้องฉีกกระดาษหลักฐานทิ้งต่อหน้า — ตลาดเงียบลงเหมือนไม่มีเรื่องอะไรเกิดขึ้น'] }) } },
    lightPass: { 0: { fight: F_('shadowWolf', 2, .8, 'defend:3', 'ระหว่างที่คุณรับรองผู้เฝ้าแสง สัตว์เงาสองตัวบุกประตูข้างของค่าย — ต้องกันไว้ให้พวกเขาผ่าน', 'run', c => { rep('guild', -2, 'ค่ายถูกบุกเพราะรับรองคนแปลกหน้า'); return ['ผู้เฝ้าแสงผ่านไปได้ แต่ประตูข้างพัง เรนัลด์ไม่พูดอะไรนอกจากชี้ไปที่รอยกรงเล็บบนไม้'] }) } },
    sigrid: { 1: { check: { stat: 'knowledge', dc: 9, win: 'run', lose: c => { setf(c.g, 'sigridChoice', 'leave'); rep('north', 1, 'ซิกริดตัดสินใจกลับ'); return ['คุณคิดหาทางไม่ออก ซิกริดยิ้มบาง ๆ "ไม่เป็นไร — ข้ากลับไปดูแลบ้านก่อน"'] } } } },
    bram: { 0: { fight: F_('bandit', 3, .6, 'leader', 'โรงนาข้างบ้านแม่ถูกพวกโจรยึดเป็นที่ซ่อน — เพื่อนเก่าของบรัมอยู่ข้างใน ต้องล้มหัวหน้าก่อนจะคุยกับเขาได้', 'run', c => { setf(c.g, 'bramChoice', 'ignore'); return ['ในที่สุดเพื่อนเก่าก็หนีออกทางหลังโรงนาไปก่อนที่คุณจะเข้าไปถึง — บรัมไม่พูดอะไรตลอดทางกลับ'] }) } },
    kier: { 2: { fight: F_('murk', 2, .7, '', 'เซอร์ดาร์เรนพาเคียร์กับคุณลงตรวจชั้นบน — สัตว์รอยหมองสองตัวโผล่จากโพรง', 'run', c => { setf(c.g, 'kierChoice', 'look'); return ['เคียร์เจ็บแขนเล็กน้อย แต่เขาไม่ถอย — เขาเลือกอยู่กับคุณต่อ ด้วยสีหน้าที่คุณอ่านไม่ออก'] }) } }
  };
  /* MECH ผูกเข้ากับทางเลือก: win:'run' = ใช้ผลเดิม */
  for (const e of EVENTS) for (const [i, m] of Object.entries(MECH[e.id] || {})) if (e.choices[+i]) e.choices[+i].mech = m;
  const mechOf = (e, i) => e.choices[i]?.mech || null;
  const modeOf = m => m ? (m.fight ? 'fight' : m.check ? 'check' : m.need ? 'need' : '') : '';
  /* ข้อความบนปุ่ม: ⚔ ต่อสู้ · 🎲 โอกาส % (สเตตัส) · 🎒 ใช้ของ */
  function hint(g, S, e, i) { const m = mechOf(e, i); if (!m) return ''; if (m.fight) return '⚔ ต่อสู้ ' + (m.fight.obj ? '(' + ({ defend: 'ป้องกัน', escape: 'ฝ่าวงล้อม', leader: 'ล้มหัวหน้า' })[m.fight.obj.split(':')[0]] + ')' : ''); if (m.check) return '🎲 ' + chanceOf(g, S, m.check) + '% (' + STAT_NAME[m.check.stat] + (m.check.failFight ? ' · พลาด = สู้' : '') + ')'; if (m.need) return '🎒 ใช้ ' + needText(m.need); return '' }

  const byId = Object.fromEntries(EVENTS.map(e => [e.id, e]));

  /* ---------- กลไก ---------- */
  const key = id => 'cr_' + id;
  const done = (g, id) => flag(g, key(id)) !== undefined;
  const day = g => num(g.day, 1);
  const eligible = (g, S, town, e) => !done(g, e.id) && at(g, e.from) && (!e.until || !past(g, e.until)) && (!e.towns || e.towns.includes(town)) && (!e.when || !!e.when(g, S, town));
  /* วันละไม่เกิน 1 อีเวนต์ · เรียงตามลำดับในรายการ */
  function pick(g, S, town) { if (!MS() || !g) return null; if (num(flag(g, 'crDay')) === day(g)) return null; return EVENTS.find(e => eligible(g, S, town, e)) || null }
  function record(g, e, i, label) { setf(g, key(e.id), i); setf(g, 'crDay', day(g)); try { T()?.log(g, 'cr.' + e.id, e.icon + ' ' + e.title + ' — ' + label) } catch (er) { } }
  /* ขั้น 1: ตรวจเงื่อนไข/ใช้ของ/ทอย — ถ้าต้องสู้คืน pending (ผู้เรียกเปิดสนามรบแล้วเรียก settle) */
  const modeLabel = { win: ' (ชนะ)', lose: ' (แพ้)', flee: ' (หนี)' };
  function begin(g, S, e, i, ctx = {}) {
    const ch = e.choices[i]; if (!ch) return { lines: [] }; const m = mechOf(e, i);
    const w = ch.ok?.(g, S) || (m?.need ? needWhy(g, S, m.need) : ''); if (w) return { lines: [w], blocked: true };
    const c = { g, S, ctx };
    if (m?.need) needTake(g, m.need);
    if (m?.fight) return { pending: m.fight, lines: [m.fight.intro], choice: ch.label };
    if (m?.check) { const chance = chanceOf(g, S, m.check), roll = Math.round(((ctx.rng || Math.random)()) * 100), win = roll < chance, info = '🎲 ' + STAT_NAME[m.check.stat] + ' ' + statOf(g, S, m.check.stat) + ' / ต้อง ' + m.check.dc + ' — โอกาส ' + chance + '% → ' + (win ? 'สำเร็จ' : 'พลาด');
      if (!win && m.check.failFight) return { pending: m.check.failFight, lines: [info, m.check.failFight.intro], choice: ch.label, checkFailed: true };
      const fn = win ? m.check.win : m.check.lose, lines = [info, ...((fn === 'run' ? ch.run(c) : fn(c)) || [])]; record(g, e, i + 1, ch.label + (win ? ' (สำเร็จ)' : ' (พลาด)')); return { lines, choice: ch.label, roll: { chance, win } } }
    const lines = ch.run(c) || []; record(g, e, i + 1, ch.label); return { lines, choice: ch.label };
  }
  /* ขั้น 2: ผลการต่อสู้ ('win' | 'lose' | 'flee') */
  function settle(g, S, e, i, outcome, ctx = {}) {
    const ch = e.choices[i], m = mechOf(e, i), spec = m?.fight || m?.check?.failFight; if (!spec) return { lines: [] }; const c = { g, S, ctx };
    const fn = outcome === 'win' ? spec.win : outcome === 'flee' ? (spec.flee || spec.lose) : spec.lose, lines = (fn === 'run' ? ch.run(c) : fn(c)) || [];
    record(g, e, i + 1, ch.label + (modeLabel[outcome] || '')); return { lines, choice: ch.label, outcome };
  }
  /* แบบรวม (เทสต์/ตัวจำลอง): ถ้ามีการต่อสู้ให้ ctx.battle(spec) ตอบ 'win'|'lose'|'flee' (ไม่มี = ถือว่าชนะ) */
  function resolve(g, S, e, i, ctx = {}) {
    const b = begin(g, S, e, i, ctx); if (!b.pending) return b;
    const out = ctx.battle ? ctx.battle(b.pending) : 'win', r = settle(g, S, e, i, out, ctx); r.lines = [...b.lines, ...r.lines]; return r;
  }
  /* หน้าต่างปิดแล้ว (ผ่านหมุด until) โดยไม่ตัดสินใจ → fallback เกิดเอง · คืนบรรทัดข่าว */
  function expire(g, S) {
    const out = []; if (!MS() || !g) return out;
    for (const e of EVENTS) {
      if (done(g, e.id) || !e.until || !past(g, e.until) || !at(g, e.from)) continue;
      if (e.companion && !inParty(S, e.companion)) { setf(g, key(e.id), 'skip'); continue }
      if (e.when && !e.when(g, S, null) && !e.fallback) { setf(g, key(e.id), 'skip'); continue }
      const lines = e.fallback ? (e.fallback({ g, S, ctx: {} }) || []) : [];
      setf(g, key(e.id), 'fb'); try { T()?.log(g, 'cr.' + e.id, e.icon + ' ' + e.title + ' — ไม่ได้ตัดสินใจ: ' + (lines[0] || 'เรื่องผ่านไปเอง')) } catch (er) { }
      out.push(e.icon + ' ' + e.title + ': ' + (lines[0] || '')); }
    return out;
  }
  const leans = g => Object.fromEntries(['light', 'shadow', 'crown', 'north', 'village'].map(k => [k, num(flag(g, 'lean_' + k))]));

  const why = (g, S, e, i) => { const ch = e.choices[i], m = mechOf(e, i); return (ch?.ok?.(g, S)) || (m?.need ? needWhy(g, S, m.need) : '') };
  const api = { why, MECH, STAT_NAME, chanceOf, statOf, hint, modeOf, needWhy, begin, settle, EVENTS, byId, pick, resolve, expire, leans, done, mayaHeld, eligible };
  root.Crossroads = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

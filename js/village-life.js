/* v93.03 · Village life data: the clock, the people of Fernvale (who they are, where they are at each hour, what they say) and the
   companions that can be recruited (each with its own condition). Pure data + small helpers, shared by place-interior.html.
   v94: the party, gold and clock live in the one game save (js/world-state.js), shared with the world map and the game. */
(function (root) {
  'use strict';
  /* ---------- clock (v94): the one game clock in js/world-state.js — s.day + s.minutes; it runs while you are in the village ---------- */
  const WS = () => root.WorldState;
  const VillageClock = {
    read() { const n = WS().now(); return { day: n.day, hour: n.hour } },
    set(day, hour) { WS().setTime(day, Math.round(hour * 60)) },
    skip(hours) { WS().advance(Math.round(hours * 60)) },
    label(h) { return WS().label(h) },
    period(h) { return WS().period(h) }
  };

  /* ---------- places ---------- house owners follow the village map (npc0 … npc9) */
  const HOUSE_OF = { npc0: 'may', npc1: 'tom', npc2: 'lin', npc3: 'ken', npc4: 'berg', npc5: 'mira', npc6: 'joe', npc7: 'shep', npc8: 'ella', npc9: 'saf',
    /* v94: the houses rebuilt in the editor under new ids, and the new homes */
    'custom-mvqg7qer': 'may', 'custom-mvqaxpl5': 'lin', 'custom-mvqfrlx9': 'mira',
    npc10: 'oren', npc11: 'gus', npc12: 'dork', npc13: 'hilda', npc14: 'bryn', npc15: 'kier' };
  function placeKind(id, name = '') {
    if (['inn', 'healer', 'shop', 'market', 'temple', 'forge', 'square'].includes(id)) return id;
    if (HOUSE_OF[id]) return 'house';
    if (/โรงแรม|โรงเตี๊ยม|inn/i.test(name)) return 'inn'; if (/วิหาร|ศาล|temple/i.test(name)) return 'temple'; if (/ตีเหล็ก|forge/i.test(name)) return 'forge';
    if (/หมอ|ยา|healer/i.test(name)) return 'healer'; if (/ตลาด|market/i.test(name)) return 'market'; if (/ร้าน|ขาย|shop/i.test(name)) return 'shop';
    if (/ของเรา|บ้านเรา/.test(name)) return 'home';
    return 'house';
  }

  /* ---------- people ----------
     sched: [fromHour, toHour, place, spotTag] — place 'home' = their own house; a spot tag picks a fitting spot in that room (bar, table, stage, …).
     lines: per period, plus 'inn' (said inside the inn) and 'about' (asked about themselves). */
  const P = {};
  const add = (id, o) => { P[id] = { id, ...o } };
  add('marta', { name: 'มาร์ธา', role: 'เจ้าของโรงแรม "เขากวางทอง"', age: 46, look: { coat: '#8a3a2a', apron: '#f2e6cc', hair: '#c9862e', hat: 'scarf', hatCol: '#e0c08a', longHair: true },
    trait: 'ใจดีแต่ปากจัด จำหน้าแขกได้ทุกคน รู้ข่าวลือทุกเรื่องในหมู่บ้าน', story: 'สามีเคยเป็นนักผจญภัย ออกไปทางป่า Aeth\'Va-Paelas เมื่อสิบปีก่อนแล้วไม่กลับมา เธอยังเก็บดาบของเขาไว้เหนือเตาผิง',
    likes: 'ลูกค้าที่จ่ายตรงเวลา, ข่าวจากเมืองใหญ่', sched: [[5, 24, 'inn', 'bar']],
    lines: { morning: ['ตื่นเช้านะ {name} ซุปถั่วหม้อแรกเพิ่งเดือด จะเอาสักชามไหม', 'คืนก่อนมีพ่อค้าพักที่นี่ เล่าว่าทางเหนือหิมะตกก่อนฤดู'], day: ['มองหาเพื่อนร่วมทางอยู่หรือ? คนที่นั่งในร้านฉันมีทั้งดีทั้งเลว เลือกให้ดีล่ะ', 'กระดานข่าวข้างประตูมีงานใหม่ทุกวัน ลองไปดูสิ'], evening: ['ช่วงนี้คนแปลกหน้าเข้าออกเยอะ ตั้งแต่มีข่าวซากเมืองในป่า', 'เหล้าหมักรอบใหม่เพิ่งเปิดถัง ใครสั่งก่อนได้ก่อน'], night: ['ดึกแล้ว ห้องว่างยังมี จะพักไหม คืนละ 10 เหรียญ', 'นาเดียมานั่งมุมนั้นอีกแล้ว … ระวังกระเป๋าเงินของเจ้าด้วย'] },
    about: ['ดาบเหนือเตาผิงน่ะหรือ ของสามีฉัน เขาบอกว่าจะกลับมาก่อนหิมะตก… นั่นสิบหน้าหนาวมาแล้ว', 'โรงแรมนี้เปิดมาสามชั่วคน ทุกคนในหมู่บ้านเคยมาฉลองที่นี่สักครั้ง'] });
  add('finn', { name: 'ฟินน์', role: 'นักกวีพเนจร', age: 24, look: { coat: '#4a6a9a', hair: '#e0c070', hat: 'hat', hatCol: '#6a3a5a', cape: '#a04a3a', weapon: 'lute' },
    trait: 'ร่าเริง ขี้โม้ แต่งเพลงจากเรื่องของทุกคน', story: 'อ้างว่าเคยร้องเพลงต่อหน้าเจ้าเมืองใหญ่ (ไม่มีใครเชื่อ) กำลังตามหา "เรื่องที่ยังไม่มีใครแต่ง"',
    likes: 'ตำนาน, เหรียญที่โยนให้', sched: [[10, 14, 'square'], [17, 24, 'inn', 'stage'], [0, 2, 'inn', 'stage']],
    lines: { day: ['ข้ากำลังแต่งเพลงใหม่ ชื่อ "วีรบุรุษผู้ยังไม่ได้ทำอะไร" … ไม่ได้หมายถึงเจ้านะ ไม่ได้หมายถึงเลย'], evening: ['เพลงต่อไปขอมอบให้คนที่ยังไม่จ่ายค่าเหล้า!', 'ถ้าเจ้าออกผจญภัยกลับมา เล่าให้ข้าฟังด้วย ข้าจะทำให้เจ้าเป็นตำนาน'], night: ['ท่อนนี้ร้องถึงเมืองแห่งแสงกับเมืองแห่งความมืด … ใครรู้บ้างว่ามันอยู่ไหน'] },
    about: ['เพลงที่ดีที่สุดยังไม่ถูกแต่ง และข้าจะเป็นคนแต่งมันเอง'] });
  add('sigrid', { name: 'ซิกริด', role: 'ทหารรับจ้างถือขวาน', age: 34, recruit: 'hire', look: { coat: '#5a4a3a', hair: '#d9d0c0', hat: 'none', beard: '#c0b8a8', cape: '#7a2a2a', weapon: 'axe', belt: '#3a2a1a', tall: true },
    trait: 'พูดน้อย ซื่อตรงกับคนที่จ่ายเงิน ไม่เคยทิ้งงานกลางทาง', story: 'มาจากทางเหนือที่หิมะไม่เคยละลาย หน่วยของเธอถูกยุบหลังเจ้านายตาย ตอนนี้รับงานทีละงาน',
    likes: 'เงินสด, เบียร์ดำ', dislikes: 'คนต่อราคา', sched: [[8, 24, 'inn', 'table']],
    lines: { day: ['ถ้าไม่ได้มาจ้าง ก็อย่ายืนบังแสง', '120 เหรียญ ข้าจะยืนข้างหน้าเจ้าจนกว่างานจะจบ'], night: ['ขวานข้าไม่เคยถามว่าศัตรูคือใคร'] },
    about: ['หน่วยข้าชื่อ "หมาป่าหิมะ" เหลือข้าคนเดียวแล้ว'] });
  add('ren', { name: 'เรน', role: 'นักธนูหนุ่ม', age: 17, recruit: 'quest', look: { coat: '#3a6a3a', hair: '#5a3a1a', hat: 'hood', hatCol: '#2f5a2f', weapon: 'bow', small: false },
    trait: 'ใจร้อน อยากพิสูจน์ตัวเอง ยิงแม่นกว่าที่ใครคิด', story: 'ลูกชายพรานที่ตายเพราะหมาป่าเงา อยากออกล่าแต่ไม่มีใครยอมพาไป',
    likes: 'ลูกธนูขนนกอินทรี, คำชม', sched: [[7, 11, 'square'], [11, 20, 'inn', 'table'], [20, 24, 'home']], home: 'npc4',
    lines: { day: ['พาข้าไปด้วยสิ! ข้ายิงนกกระจอกตกจากหลังคาโบสถ์ได้นะ', 'ทุกคนบอกว่าข้ายังเด็ก … ทั้งที่ข้ายิงแม่นกว่าพวกเขาอีก'], evening: ['ถ้าเจ้าชนะศัตรูนอกหมู่บ้านได้สามครั้ง ข้าจะเชื่อว่าเจ้าพาข้ารอดกลับมาได้'] },
    about: ['พ่อข้าตายเพราะหมาป่าเงา ข้าจะล่ามันให้ได้'] });
  add('olwen', { name: 'โอลเวน', role: 'จอมเวทเกษียณ (ขี้เมา)', age: 71, recruit: 'drinks', look: { coat: '#4a3a6a', hair: '#e8e8e8', hat: 'hat', hatCol: '#3a2a5a', beard: '#f0f0f0', weapon: 'mug' },
    trait: 'เมาทั้งวัน แต่พอพูดเรื่องเวทมนตร์ตาจะเป็นประกาย', story: 'เคยเป็นอาจารย์ในหอคอยเมืองใหญ่ ถูกไล่ออกเพราะทดลองเวทไฟจนห้องสมุดไหม้ (เขาบอกว่า "แค่ปีกเดียว")',
    likes: 'เหล้าองุ่น, คนที่ฟังเขาเล่าจนจบ', sched: [[11, 24, 'inn', 'bar'], [0, 3, 'inn', 'bar']],
    lines: { day: ['ฮึก… เจ้าอยากรู้เรื่องไฟนิรันดร์หรือ … เลี้ยงเหล้าข้าก่อนสิ'], evening: ['สามแก้ว! เลี้ยงข้าสามครั้ง (ตอนเย็นหรือกลางคืนนะ ตอนกลางวันข้ายังไม่พร้อมจะใจดี) แล้วข้าจะเผาศัตรูให้เจ้าดู'], night: ['ไฟไม่ได้อยู่ในคาถา … ไฟอยู่ในใจคนร่าย … ฮึก'] },
    about: ['ห้องสมุดไหม้ไปแค่ปีกเดียว! แล้วก็เป็นปีกที่ไม่มีใครอ่านอยู่แล้ว'] });
  add('nadia', { name: 'นาเดีย', role: 'นักย่องเบาเร่ร่อน', age: 22, recruit: 'duel', look: { coat: '#2a2a3a', hair: '#1a1a22', hat: 'bandana', hatCol: '#7a2a3a', weapon: 'dagger', cape: '#3a2a4a', longHair: true },
    trait: 'ยิ้มเยาะ ไว้ใจใครยาก นับถือแค่คนที่เก่งกว่าเธอ', story: 'โผล่มาเฉพาะตอนกลางคืน ชาวบ้านลือว่าเธอขโมยแหวนเจ้าเมืองมา แต่ไม่มีใครพิสูจน์ได้',
    likes: 'ของแวววาว, การท้าทาย', sched: [[20, 24, 'inn', 'corner'], [0, 4, 'inn', 'corner']],
    lines: { night: ['มองอะไร? อยากได้ของหรือเปล่า … หรืออยากได้ตัวข้า', 'ข้าไม่ตามใครที่ข้าล้มได้ ชนะข้าในการดวลสิ แล้วค่อยคุยกัน'] },
    about: ['แหวนเจ้าเมือง? ข้าแค่ยืม … เขาไม่ได้ใช้มันทำอะไรดี ๆ อยู่แล้ว'] });
  add('mil', { name: 'มิล', role: 'นักดาบรุ่นน้อง', age: 19, recruit: 'reputation', look: { coat: '#8a6a3a', hair: '#c9862e', hat: 'none', weapon: 'sword' },
    trait: 'เร็ว ขี้ตื่นเต้น เคารพคนที่มีผลงาน', story: 'ลูกศิษย์ที่ถูกอาจารย์ส่งมาหา "นักผจญภัยที่ทำตำนานได้จริง"',
    likes: 'เรื่องเล่าการต่อสู้, ขนมปังน้ำผึ้ง', sched: [[8, 18, 'forge'], [18, 23, 'inn', 'table']],
    lines: { day: ['อาจารย์บอกให้ข้าตามคนที่เคยพิชิตสถานที่อันตรายได้จริง … เจ้าเคยไหม?'], evening: ['ถ้าเจ้ากลับมาพร้อมชัยชนะจากข่าวลือสักแห่ง ข้าจะตามเจ้าไปทุกที่!'] },
    about: ['ข้าฝึกดาบคู่มาหกปี แต่ยังไม่เคยฟันอะไรที่ไม่ใช่หุ่นฟาง'] });
  add('orla', { name: 'ซิสเตอร์ออร์ลา', role: 'นักบวชแห่งวิหารธาตุดิน', age: 29, recruit: 'offering', look: { coat: '#e8e0d0', hair: '#7a4a2a', hat: 'hood', hatCol: '#c9b88a', weapon: 'staff', longHair: true },
    trait: 'อ่อนโยน มั่นคง เชื่อว่าการรักษาคือการต่อสู้อีกแบบ', story: 'เดินทางมาจากวิหารใหญ่ริมแม่น้ำ เพื่อดูแลศาลเจ้าของ Fernvale ที่ไม่มีนักบวชมาหลายปี',
    likes: 'ดอกไม้ป่า, ความเงียบตอนเช้า', sched: [[5, 20, 'temple', 'altar'], [20, 24, 'temple', 'pew']],
    lines: { morning: ['แสงของดวงทองมาหยุดใกล้หมู่บ้านวันนี้ ชาวบ้านถือเป็นวันมงคลนะ'], day: ['ถ้าเจ้าจะพาข้าไปเยียวยาผู้คนนอกหมู่บ้าน ช่วยถวายเงินบำรุงวิหาร 50 เหรียญ และยาฟื้นฟู 2 ขวดไว้แจกคนยากก่อน'], evening: ['บาดแผลที่มองไม่เห็นก็ต้องการการรักษาเหมือนกัน'] },
    about: ['ข้าเลือกเดินทางมาเอง วิหารใหญ่มีนักบวชมากพอแล้ว ที่นี่ต่างหากที่ต้องการข้า'] });
  add('berg', { name: 'นายพรานเบิร์ก', role: 'นายพราน', age: 52, recruit: 'boss', look: { coat: '#5b4a32', hair: '#2a1f16', hat: 'hood', hatCol: '#3f5232', beard: '#3a2a1a', weapon: 'bow' },
    trait: 'เงียบขรึม รู้จักป่าดีกว่าใคร ไม่ชอบคนที่พูดมาก', story: 'สูญเสียคู่ล่า (พ่อของเรน) ให้จ่าฝูงหมาป่า ตั้งแต่นั้นไม่ยอมเข้าป่าลึกอีก',
    likes: 'ความเงียบ, เนื้อรมควัน', sched: [[5, 8, 'home'], [8, 16, 'market'], [16, 21, 'inn', 'table'], [21, 24, 'home']], home: 'npc4',
    lines: { day: ['ป่าตะวันออกช่วงนี้เงียบผิดปกติ … เงียบแบบที่มีอะไรกำลังรอ'], evening: ['ถ้าเจ้าล้มจ่าฝูงในถ้ำได้ ข้าจะไปกับเจ้า ไม่ว่าที่ไหน'] },
    about: ['พ่อของเรนเป็นคู่ล่าข้า เขาตายเพราะข้าช้าไปก้าวเดียว'] });
  /* villagers (from the village map) — now with a story and a day */
  add('may', { name: 'ป้าเมย์', role: 'คนทำขนมปัง', age: 55, look: { coat: '#c98a4b', apron: '#f1e6cc', hair: '#6b4426', hat: 'scarf', hatCol: '#e8d6b0', weapon: 'broom' }, home: 'npc0',
    trait: 'เป็นแม่ของทั้งหมู่บ้าน ขี้บ่น ห่วงทุกคน', story: 'ทำขนมปังมาสามสิบปี เตาอบของเธอไม่เคยดับแม้แต่วันเดียว', likes: 'คนที่ชมขนมปัง',
    sched: [[4, 9, 'home', 'work'], [9, 15, 'market'], [15, 17, 'inn', 'bar'], [17, 24, 'home']],
    lines: { morning: ['ขนมปังเพิ่งออกจากเตา ยังอุ่นอยู่เลย'], day: ['ก่อนออกเดินทางไกล อย่าลืมพกเสบียงนะ ท้องว่างสู้ใครไม่ได้'], evening: ['มาร์ธาสั่งขนมปังไปสองตะกร้า คืนนี้คนคงเยอะ'] }, about: ['เตาของป้าไม่เคยดับ … ยกเว้นวันที่ลุงทอมมาซ่อมปล่องควันแล้วทำมันพัง'] });
  add('tom', { name: 'ลุงทอม', role: 'ช่างไม้', age: 61, look: { coat: '#7a5a3a', apron: '#a07a4a', hair: '#8a8a86', hat: 'cap', hatCol: '#5a4632', beard: '#9a9a96', weapon: 'hammer' }, home: 'npc1',
    trait: 'มือหนัก ใจเย็น ซ่อมได้ทุกอย่างยกเว้นความสัมพันธ์', story: 'ทำโต๊ะทุกตัวในโรงแรมด้วยมือตัวเอง', likes: 'ไม้โอ๊ก, เบียร์ตอนเย็น',
    sched: [[6, 12, 'home', 'work'], [12, 17, 'forge'], [17, 22, 'inn', 'table'], [22, 24, 'home']],
    lines: { day: ['ประตูทางตะวันออกโยกเยกอีกแล้ว ต้องไปซ่อมก่อนหมาป่าจะมาลองดัน'], evening: ['โต๊ะตัวนี้ลุงทำเองนะ ลองโยกดูสิ ไม่ขยับสักนิด'] }, about: ['ไม้ดีต้องตากลมสามปี คนดีก็ต้องผ่านลมฝนเหมือนกัน'] });
  add('lin', { name: 'คุณยายลิน', role: 'คนเฒ่าเล่านิทาน', age: 84, look: { coat: '#6f6a8f', hair: '#e6e2da', hat: 'hood', hatCol: '#57506f' }, home: 'npc2',
    trait: 'จำตำนานได้ทุกบท ลืมว่ากินข้าวหรือยัง', story: 'เป็นคนเดียวในหมู่บ้านที่ยังจำบทสวดถึง Glaelanar ได้ แม้ไม่รู้ว่ามันแปลว่าอะไร', likes: 'ชาสมุนไพร, เด็ก ๆ',
    sched: [[7, 11, 'temple', 'pew'], [11, 16, 'square'], [16, 19, 'inn', 'fire'], [19, 24, 'home']],
    lines: { day: ['ยายจะเล่าเรื่องเมืองแห่งแสงให้ฟังไหม … อ้อ เล่าไปแล้วเหรอ'], evening: ['ไฟในเตาผิงนี่อุ่นเหมือนสมัยยายยังสาว'] }, about: ['บทสวดที่ยายท่องทุกเช้า ยายของยายสอนมา ไม่มีใครรู้ว่าแปลว่าอะไร'] });
  add('mira', { name: 'ครูมิรา', role: 'ครูประจำหมู่บ้าน', age: 33, look: { coat: '#3f5a8a', hair: '#a8522e', hat: 'none', weapon: 'book', longHair: true }, home: 'npc5',
    trait: 'จริงจัง รักหนังสือ แอบชอบนิทานผจญภัย', story: 'ได้รับจดหมายจากนักโบราณคดีเมืองใหญ่เรื่องจารึกในป่า แต่ยังไม่กล้าบอกใคร', likes: 'หนังสือเก่า, ความเงียบ',
    sched: [[7, 15, 'temple', 'pew'], [15, 18, 'shop'], [18, 21, 'inn', 'table'], [21, 24, 'home']],
    lines: { day: ['เด็ก ๆ ถามครูว่าอักษรบนจานหินแปลว่าอะไร … ครูก็อยากรู้เหมือนกัน'], evening: ['ถ้าเจ้าเจอจารึกโบราณในป่า ช่วยคัดลอกมาให้ครูด้วยนะ'] }, about: ['ครูมีจดหมายจากเมืองใหญ่ฉบับหนึ่ง … ไว้วันหลังจะเล่าให้ฟัง'] });
  add('saf', { name: 'หมอยาซาฟ', role: 'หมอยาสมุนไพร', age: 58, look: { coat: '#4a7a5a', apron: '#c9d6b0', hair: '#6a6a6a', hat: 'hood', hatCol: '#3a5a44', beard: '#7a7a7a' }, home: 'npc9',
    trait: 'พูดช้า มือเร็ว รู้จักพืชทุกชนิดในหุบ', story: 'เคยรักษาซิกริดตอนเธอมาถึงหมู่บ้านพร้อมแผลเต็มตัว', likes: 'รากไม้หายาก',
    sched: [[6, 18, 'healer', 'counter'], [18, 21, 'inn', 'table'], [21, 24, 'home']],
    lines: { day: ['ยาฟื้นฟูเพิ่งต้มเสร็จ อยู่บนชั้นนั่น'], evening: ['อย่าดื่มของโอลเวนเด็ดขาด เมื่อวานหมอต้องรักษาคนที่ลองจิบไปสองคน'] }, about: ['พืชไม่โกหก ถ้ามันเหี่ยว แปลว่าดินกำลังป่วย'] });
  add('ken', { name: 'เคน', role: 'คนตัดไม้', age: 28, look: { coat: '#4f6b3a', apron: '#7a5a3a', hair: '#3a2a1a', hat: 'none', weapon: 'axe' }, home: 'npc3',
    trait: 'แข็งแรง ซื่อ หัวเราะเสียงดัง', story: 'เห็นแสงประหลาดในป่าคืนก่อน แต่ไม่มีใครเชื่อเขา', likes: 'เนื้อย่าง',
    sched: [[6, 16, 'home', 'work'], [16, 23, 'inn', 'table']],
    lines: { day: ['ไม้ฝั่งตะวันออกดีที่สุด แต่ช่วงนี้ไม่มีใครกล้าไป'], evening: ['คืนก่อนข้าเห็นแสงสีฟ้าลอยในป่า! … ทำไมไม่มีใครเชื่อข้าสักคน'] }, about: ['ขวานเล่มนี้พ่อให้มา ตัดต้นไม้มาเป็นพันต้นแล้ว'] });
  add('ella', { name: 'เอลลา', role: 'ช่างทอผ้า', age: 26, look: { coat: '#a0456a', apron: '#e8d6c0', hair: '#2a1a12', hat: 'scarf', hatCol: '#7a3a5a', longHair: true }, home: 'npc8',
    trait: 'ช่างฝัน ชอบสีสด แอบแต่งเพลงกับฟินน์', story: 'ผ้าของเธอส่งไปขายถึงเมืองใหญ่ แต่ไม่เคยออกจากหมู่บ้านเอง', likes: 'ด้ายย้อมสีหายาก',
    sched: [[7, 15, 'home', 'work'], [15, 18, 'market'], [18, 22, 'inn', 'stage']],
    lines: { day: ['ผ้าผืนนี้ย้อมด้วยดอกไม้จากทุ่งเหนือ'], evening: ['ฟินน์บอกว่าจะแต่งเพลงให้ฉัน … เขาพูดแบบนี้กับทุกคนหรือเปล่านะ'] }, about: ['สักวันฉันจะไปเห็นเมืองใหญ่ด้วยตาตัวเอง'] });
  add('joe', { name: 'โจ', role: 'ชาวประมง', age: 40, look: { coat: '#2f6a8a', hair: '#3a2a1a', hat: 'cap', hatCol: '#c9b27a', beard: '#3a2a1a' }, home: 'npc6',
    trait: 'ขี้โม้เรื่องปลา', story: 'อ้างว่าเคยตกปลายาวเท่าเรือ', likes: 'ฝนตกปรอย ๆ',
    sched: [[4, 12, 'home'], [12, 17, 'market'], [17, 23, 'inn', 'bar']],
    lines: { day: ['ปลาวันนี้ตัวเท่าแขน! … ก็แขนเด็กนั่นแหละ'], evening: ['ข้าเคยตกปลาตัวยาวเท่าเรือ สาบานได้'] }, about: ['ทะเลสาบทางเหนือมีอะไรอยู่ใต้น้ำแน่ ๆ ข้ารู้สึกได้'] });
  add('shep', { name: 'ปิแอร์', role: 'คนเลี้ยงแกะ', age: 35, look: { coat: '#8a8a5a', hair: '#c9a46a', hat: 'straw', hatCol: '#d9be7a' }, home: 'npc7',
    trait: 'ขี้กังวล นับแกะก่อนนอนทุกคืน (จริง ๆ)', story: 'แกะหายไปสามตัวในเดือนนี้', likes: 'แกะ',
    sched: [[5, 17, 'home'], [17, 21, 'inn', 'table']],
    lines: { day: ['แกะหายไปอีกตัว … ข้าว่าไม่ใช่หมาป่าธรรมดาแน่'], evening: ['ขอเบียร์สักแก้ว ข้านับแกะมาทั้งวันจนตาลาย'] }, about: ['ข้าตั้งชื่อแกะทุกตัว ตัวที่หายไปชื่อ "ขนปุย"'] });
  add('pim', { name: 'พิม', role: 'เด็กในหมู่บ้าน', age: 9, look: { coat: '#d97a3a', hair: '#5a3a1a', hat: 'none', small: true }, home: 'npc5',
    trait: 'อยากรู้อยากเห็น วิ่งตลอดเวลา', story: 'ฝันอยากเป็นนักผจญภัยเหมือนพี่ {name}', likes: 'ขนมปังน้ำผึ้ง',
    sched: [[8, 12, 'temple', 'pew'], [12, 17, 'square'], [17, 19, 'inn', 'fire'], [19, 24, 'home']],
    lines: { day: ['พี่ {name}! พาหนูไปผจญภัยด้วยได้ไหม'], evening: ['คุณยายลินเล่าเรื่องเมืองแห่งความมืด หนูกลัวจนนอนไม่หลับเลย'] }, about: ['โตขึ้นหนูจะเก่งกว่าพี่อีก!'] });
  add('dork', { name: 'ยามดอร์ก', role: 'ยามประตูหมู่บ้าน', age: 44, look: { coat: '#5a5a6a', hair: '#3a3a3a', hat: 'helm', hatCol: '#9a9aa8', weapon: 'sword' },
    trait: 'เคร่งครัด ภูมิใจในหน้าที่', story: 'เฝ้าประตูมายี่สิบปี ไม่เคยลาป่วย', likes: 'กฎ',
    sched: [[6, 20, 'square'], [20, 23, 'inn', 'bar']],
    lines: { day: ['ถ้าจะออกนอกหมู่บ้าน อย่าลืมกลับมาก่อนมืด'], evening: ['เวรข้าจบแล้ว เบียร์แก้วนี้ข้าสมควรได้'] }, about: ['ยี่สิบปี ไม่เคยลาป่วยแม้แต่วันเดียว'] });
  add('gus', { name: 'กัส', role: 'ช่างตีเหล็ก', age: 48, look: { coat: '#4a3a2a', apron: '#6a4a2a', hair: '#1a1a1a', hat: 'none', beard: '#2a2a2a', weapon: 'hammer', tall: true },
    trait: 'เสียงดัง ใจดี ภูมิใจในงานทุกชิ้น', story: 'ตีดาบให้สามีของมาร์ธาเมื่อสิบปีก่อน และยังรู้สึกผิดที่ดาบกลับมาโดยไม่มีเจ้าของ', likes: 'เหล็กดี',
    sched: [[6, 19, 'forge', 'anvil'], [19, 23, 'inn', 'bar']],
    lines: { day: ['เหล็กร้อนต้องตีตอนนี้! พูดเร็ว ๆ'], evening: ['ดาบเหนือเตาผิงของมาร์ธา ข้าตีเองกับมือ'] }, about: ['ข้าตีเหล็กมาตั้งแต่อายุเท่าพิม'] });
  add('vera', { name: 'เวร่า', role: 'แม่ค้าร้านค้า', age: 38, look: { coat: '#6a5a8a', apron: '#e8dcc0', hair: '#3a2a1a', hat: 'scarf', hatCol: '#8a6aa0' },
    trait: 'หัวการค้า ต่อราคาเก่ง', story: 'ค้าขายกับพ่อค้าจากเมืองใหญ่ทุกสัปดาห์', likes: 'กำไร',
    sched: [[7, 19, 'shop', 'counter'], [19, 22, 'inn', 'table']],
    lines: { day: ['ของดีราคาไม่แพง … ไม่แพงสำหรับฉันนะ'], evening: ['พ่อค้าจากเมืองใหญ่บอกว่าราคาผลึกในเมืองขึ้นสามเท่า'] }, about: ['ร้านนี้แม่ยกให้ ฉันทำให้มันกำไรขึ้นเท่าตัว'] });
  add('graven', { name: 'เกรเวน', role: 'พ่อค้าจากเมือง', age: 50, look: { coat: '#8a6a2a', hair: '#7a6a5a', hat: 'hat', hatCol: '#5a3a1a', beard: '#7a6a5a', cape: '#3a5a6a' },
    trait: 'ช่างคุย ค้าข่าวพอ ๆ กับค้าของ', story: 'นำข่าวซากเมืองใน Aeth\'Va-Paelas มาที่หมู่บ้าน', likes: 'ข่าวลือใหม่ ๆ',
    sched: [[9, 17, 'market'], [17, 24, 'inn', 'table'], [0, 1, 'inn', 'table']],
    lines: { day: ['เมืองใหญ่วุ่นวายจะตาย ที่นี่สงบกว่าเยอะ'], evening: ['มีคนกลับจากซากเมืองพร้อมผลึกที่ไม่มีใครเคยเห็น … ข้าเห็นกับตา!'] }, about: ['ข้าเดินทางผ่านมาสามสิบเมืองแล้ว Fernvale เป็นที่เดียวที่ขนมปังอร่อยขนาดนี้'] });

  add('oren', { name: 'ผู้ใหญ่บ้านโอเรน', role: 'ผู้ใหญ่บ้าน', age: 63, look: { coat: '#56683a', hair: '#cfcfcf', hat: 'none', beard: '#dcdcdc', cape: '#3a4a2a', weapon: 'book', tall: true },
    trait: 'สุขุม ห่วงหมู่บ้านมากกว่าตัวเอง พูดน้อยแต่ทุกคำมีน้ำหนัก', story: 'เป็นคนเก็บจานหินที่มีเส้นแสงไว้ และเป็นคนแรกที่เห็นว่ามันตอบสนองต่อ {name}', likes: 'ความสงบ, ชาร้อน', sched: [[6, 10, 'temple', 'pew'], [10, 17, 'square'], [17, 21, 'inn', 'table']],
    lines: { morning: ['เช้านี้ดวงทองลอยต่ำ ชาวบ้านจะได้ทำงานกันเต็มที่'], day: ['หมู่บ้านเล็ก ๆ อย่างเรา อยู่รอดได้เพราะช่วยกัน'], evening: ['ข่าวจากเมืองใหญ่ช่วงนี้ไม่ค่อยดี … ข้าห่วงว่ามันจะลามมาถึงที่นี่'] }, about: ['ข้าเป็นผู้ใหญ่บ้านมาสิบห้าปี ไม่เคยมีปีไหนที่ข่าวลือเยอะเท่าปีนี้'] });
  add('mother', { family: true, name: 'แม่', role: 'แม่ของ {name}', age: 47, look: { coat: '#8a4b5c', apron: '#efe2c8', hair: '#5a3a22', hat: 'scarf', hatCol: '#c9a07a', longHair: true }, home: 'home',
    trait: 'อบอุ่น เข้มแข็ง ห่วงลูกจนนอนไม่หลับทุกครั้งที่ลูกออกเดินทาง', story: 'เลี้ยง {name} มาคนเดียวหลังพ่อจากไป ไม่เคยบ่นสักคำ', likes: 'ชาดอกคาโมมายล์, เสียงลูกกลับบ้าน', sched: [[5, 9, 'home', 'work'], [9, 13, 'market'], [13, 16, 'temple', 'pew'], [16, 24, 'home']],
    lines: { morning: ['ตื่นแล้วหรือลูก ข้าวต้มอยู่บนเตา'], day: ['อย่าลืมพกยาติดตัวนะ แม่ไม่อยากต้องไปตามหาลูกกลางป่า'], evening: ['กลับมาก่อนมืดนะลูก แม่จะรอ'] }, about: ['แม่ไม่ได้ห้ามลูกออกไปหรอก แม่แค่อยากให้ลูกกลับมาทุกครั้ง'] });
  add('pip', { name: 'ปิ๊บ', role: 'เด็กเลี้ยงแพะ', age: 11, look: { coat: '#6f8f36', hair: '#8a5a2a', hat: 'cap', hatCol: '#4a6a2a', small: true }, home: 'npc7',
    trait: 'ซน กล้าเกินตัว แพะทุกตัวเชื่อฟังเขามากกว่าผู้ใหญ่', story: 'อยากเป็นนักผจญภัยเหมือนกัน แต่ต้องเลี้ยงแพะให้ปิแอร์ก่อน', likes: 'แพะชื่อ "จอมพล", เรื่องสู้กับมอนสเตอร์', sched: [[6, 12, 'square'], [12, 17, 'market'], [17, 19, 'inn', 'fire'], [19, 24, 'home']],
    lines: { day: ['แพะของข้าชื่อจอมพล มันเคยขวิดหมาป่ามาแล้วนะ … ตัวเล็ก ๆ'], evening: ['พี่ {name} เล่าเรื่องสู้กับมอนให้ฟังหน่อยสิ!'] }, about: ['โตขึ้นข้าจะมีแพะศึกเป็นของตัวเอง!'] });
  add('bryn', { name: 'บริน', role: 'คนโม่แป้ง', age: 39, look: { coat: '#c8b898', apron: '#ece4d0', hair: '#7a5a3a', hat: 'cap', hatCol: '#e8e0cc', beard: '#7a5a3a' },
    trait: 'ขยัน ขี้เล่น ชอบท้าแข่งแขนกับทุกคน', story: 'โม่ที่ลำธารเป็นของตระกูลมาห้ารุ่น แป้งทุกกระสอบในหมู่บ้านผ่านมือเขา', likes: 'แข่งแขน, ขนมปังของป้าเมย์', sched: [[5, 14, 'market'], [14, 17, 'shop'], [17, 23, 'inn', 'table']],
    lines: { day: ['ข้าวสาลีปีนี้เม็ดเต็ม ป้าเมย์คงอบขนมปังได้อร่อยเป็นพิเศษ'], evening: ['มาแข่งแขนกันไหม? แพ้เลี้ยงเบียร์!'] }, about: ['ห้ารุ่นแล้วที่ตระกูลข้าโม่แป้งให้ Fernvale'] });
  add('hilda', { name: 'ฮิลดา', role: 'ชาวนา', age: 44, look: { coat: '#7a6a3a', apron: '#d8c8a0', hair: '#c9a46a', hat: 'straw', hatCol: '#d9be7a', longHair: true },
    trait: 'ตรงไปตรงมา อ่านฟ้าฝนแม่นกว่าใคร', story: 'ทุ่งของเธออยู่ติดชายป่า เห็นอะไรแปลก ๆ บ่อยกว่าคนอื่น', likes: 'ฝนต้นฤดู', sched: [[5, 16, 'market'], [16, 18, 'temple', 'pew'], [18, 22, 'inn', 'table']],
    lines: { morning: ['ฟ้าแดงตอนเช้า บ่ายนี้ลมแรงแน่'], day: ['ชายป่าทางทุ่งข้า มีรอยเท้าอะไรใหญ่ ๆ เดินผ่านเมื่อคืน'], evening: ['เหนื่อยทั้งวัน แต่ได้นั่งกินซุปของมาร์ธาก็หายเหนื่อย'] }, about: ['ข้าไม่เชื่อเรื่องผี แต่ข้าเชื่อรอยเท้า'] });
  add('tess', { name: 'เทส', role: 'แม่ค้าดอกไม้', age: 20, look: { coat: '#c8789a', apron: '#f4e8d8', hair: '#e0b070', hat: 'none', longHair: true },
    trait: 'ร่าเริง ช่างสังเกต จำได้ว่าใครชอบดอกอะไร', story: 'ส่งดอกไม้ให้วิหารทุกเช้า และแอบเขียนจดหมายถึงใครบางคนในเมืองใหญ่', likes: 'ดอกไม้ป่าสีฟ้า', sched: [[6, 9, 'temple', 'pew'], [9, 17, 'market'], [17, 21, 'inn', 'stage']],
    lines: { morning: ['ดอกไม้ชุดนี้เพิ่งเก็บตอนน้ำค้างยังไม่แห้ง'], day: ['ซิสเตอร์ออร์ลาชอบดอกสีขาว ส่วนนาเดีย … เธอชอบดอกที่มีหนาม'], evening: ['ฟินน์ขอดอกไม้ไปให้ใครอีกแล้วนะ'] }, about: ['ดอกไม้ป่าสีฟ้าขึ้นเฉพาะที่ที่ดินมีพลัง … คุณยายลินบอกแบบนั้น'] });


  /* ---------- v94: homes, travellers and the old travelling party ----------
     Everyone now either lives in Fernvale (a house, or a room in the place they keep) or comes from somewhere else (origin) and is only
     in the village on some days (visit): {every, stay, offset, arrive, leave} = stay `stay` days out of every `every` (arriving at `arrive`,
     leaving at `leave` o'clock) · {daily:[from,to]} = comes in every day from a nearby village. Visitors walk in and out through `gate`.
     The places they go off to are not on the map yet (planned: other villages / towns on the world map). */
  Object.assign(P.may, { home: 'custom-mvqg7qer' }); Object.assign(P.lin, { home: 'custom-mvqaxpl5' }); Object.assign(P.mira, { home: 'custom-mvqfrlx9' });
  Object.assign(P.pim, { home: 'custom-mvqfrlx9' }); Object.assign(P.mother, { home: 'custom-mvqgnp43' });
  // villagers who get a house of their own
  Object.assign(P.oren, { home: 'npc10', sched: [[6, 8, 'home', 'work'], [8, 12, 'market'], [12, 14, 'home'], [14, 17, 'square'], [17, 20, 'inn', 'table'], [20, 24, 'home']] });
  Object.assign(P.gus, { home: 'npc11', sched: [[6, 19, 'forge', 'anvil'], [19, 23, 'inn', 'bar'], [23, 24, 'home']] });
  Object.assign(P.dork, { home: 'npc12', sched: [[6, 20, 'square'], [20, 23, 'inn', 'bar'], [23, 24, 'home']] });
  Object.assign(P.hilda, { home: 'npc13', sched: [[5, 12, 'home', 'work'], [12, 15, 'market'], [15, 19, 'home', 'work'], [19, 22, 'inn', 'table'], [22, 24, 'home']] });
  Object.assign(P.bryn, { home: 'npc14', sched: [[5, 13, 'home', 'work'], [13, 17, 'market'], [17, 22, 'inn', 'bar'], [22, 24, 'home']] });
  // people who live where they work
  Object.assign(P.marta, { home: 'inn', origin: 'อยู่ห้องหลังโรงแรมของตัวเอง' }); Object.assign(P.vera, { home: 'shop', origin: 'อยู่ห้องหลังร้าน' });
  Object.assign(P.orla, { home: 'temple', origin: 'มาจากวิหารใหญ่ริมแม่น้ำ อยู่ประจำวิหารของหมู่บ้าน' });
  Object.assign(P.olwen, { home: 'inn', origin: 'เช่าห้องประจำที่โรงแรมมาหลายปี' });
  Object.assign(P.sigrid, { home: 'inn', origin: 'ทหารรับจ้างจากทางเหนือ พักโรงแรมรองาน' }); Object.assign(P.mil, { home: 'inn', origin: 'ศิษย์ดาบจากสำนักในเมืองหลวง พักโรงแรมระหว่างตามหาครูคนใหม่' });
  // travellers: in Fernvale only on some days
  Object.assign(P.finn, { home: 'inn', origin: 'กวีพเนจร ร้องเพลงไปตามหมู่บ้านตามเส้นทางการค้า', visit: { every: 5, stay: 3, offset: 1, arrive: 10, leave: 15 }, gate: 'north' });
  Object.assign(P.graven, { home: 'inn', origin: 'พ่อค้าจากเมืองท่าทางตะวันออก มาเปิดแผงวันตลาด', visit: { every: 4, stay: 2, offset: 2, arrive: 8, leave: 16 }, gate: 'east' });
  Object.assign(P.nadia, { home: 'inn', origin: 'ไม่มีใครรู้ว่าเธอนอนที่ไหน — ลือกันว่ามีที่ซ่อนในป่าตะวันตก', visit: { every: 2, stay: 1, arrive: 19, leave: 24 }, gate: 'west' });
  Object.assign(P.tess, { origin: 'อยู่หมู่บ้านบรู๊คเมียร์ทางตะวันตก เดินมาขายดอกไม้ทุกวัน', visit: { daily: [6, 18] }, gate: 'west',
    sched: [[6, 8, 'temple', 'altar'], [8, 15, 'market'], [15, 18, 'square']] });

  // the old travelling party: now villagers you recruit like everyone else
  add('kier', { name: 'เคียร์', role: 'นักดาบหนุ่ม · เพื่อนสมัยเด็กของ {name}', age: 19, recruit: 'friend', home: 'npc15', look: { coat: '#6a4a8a', hair: '#2a1f16', hat: 'none', weapon: 'sword', cape: '#3a2a4a' },
    trait: 'กล้าบ้าบิ่น พูดเร็ว ไม่เคยยอมแพ้ใครยกเว้น {name}', story: 'โตมาด้วยกันกับ {name} ฝึกดาบไม้ด้วยกันตั้งแต่เด็ก ฝันอยากออกเดินทางมานานแล้ว แค่รอให้เพื่อนชวน',
    likes: 'ดาบดี ๆ, การแข่งวิ่ง', sched: [[7, 12, 'home', 'work'], [12, 22, 'inn', 'table'], [22, 24, 'home']],
    lines: { morning: ['ตื่นสายอีกแล้วนะ {name}! ข้าวิ่งรอบหมู่บ้านไปสามรอบแล้ว'], day: ['ถ้าเจ้าจะออกเดินทาง อย่าทิ้งข้าไว้นะ ข้าฝึกดาบรอมาทั้งปี'], evening: ['จำตอนเราแอบไปจับกบที่ลำธารได้ไหม … ตอนนี้ข้าอยากจับหมาป่าแทน'], night: ['ยังไม่นอนอีกเหรอ? ข้าก็นอนไม่หลับ ใจมันอยากออกไปข้างนอก'] },
    about: ['พ่อข้าอยากให้ข้าเป็นช่างไม้ แต่มือข้าจับดาบได้ดีกว่าค้อน'] });
  add('bram', { name: 'บรัม', role: 'นักรบค้อนรับจ้าง', age: 41, recruit: 'hire', home: 'inn', origin: 'รับจ้างคุ้มกันกองคาราวานตามหมู่บ้านริมป่า แวะพักเฟิร์นเวลเป็นพัก ๆ', visit: { every: 7, stay: 5, arrive: 9, leave: 14 }, gate: 'southeast',
    look: { coat: '#6a5a4a', hair: '#8a5a2a', hat: 'none', beard: '#8a5a2a', weapon: 'hammer', tall: true, belt: '#3a2a1a', sprite: 'bram' },
    trait: 'ตัวใหญ่ ใจเย็น กินจุ ไว้ใจได้ถ้าจ่ายครบ', story: 'เคยเป็นยามประตูเมืองหลวง ลาออกเพราะเบื่อยืนเฉย ๆ ทั้งวัน',
    likes: 'สตูเนื้อ, โล่หนา ๆ', sched: [[7, 24, 'inn', 'table'], [0, 2, 'inn', 'table']],
    lines: { morning: ['สตูของมาร์ธาร้อนกำลังดี … เจ้าจะกินด้วยไหม'], day: ['หกสิบเหรียญ ข้าจะยืนหน้าเจ้ารับทุกอย่างที่พุ่งเข้ามา'], evening: ['กองคาราวานถัดไปจะผ่านมาอีกไม่กี่วัน ถ้าเจ้าไม่จ้างข้า ข้าก็ไปกับพวกนั้น'] },
    about: ['ค้อนนี่หนักกว่าดาบสามเท่า แต่ตีทีเดียวไม่ต้องตีซ้ำ'] });
  add('luna', { name: 'ลูน่า', role: 'นักเวทนักศึกษาซากโบราณ', age: 23, recruit: 'visits', home: 'inn', origin: 'นักศึกษาจากหอสมุดเมืองหลวง มาสำรวจซากโบราณรอบหุบ แวะพักเฟิร์นเวลเป็นช่วง ๆ', visit: { every: 3, stay: 2, offset: 1, arrive: 9, leave: 17 }, gate: 'north',
    look: { coat: '#3a5a8a', hair: '#c9c0e0', hat: 'hood', hatCol: '#2a3a6a', weapon: 'staff', longHair: true },
    trait: 'ช่างสงสัย จริงจังกับงาน ไม่ไว้ใจคนแปลกหน้าง่าย ๆ', story: 'ตามหาจารึกที่พูดถึงยุคก่อนเผ่าโบราณจะหายไป เชื่อว่ามีบางอย่างซ่อนอยู่ใต้หุบนี้',
    likes: 'จารึกเก่า, ชาร้อน', sched: [[9, 12, 'temple', 'pew'], [12, 16, 'square'], [16, 23, 'inn', 'table']],
    lines: { day: ['อักษรบนเสาวิหารนี่ไม่ใช่ภาษาของยุคเรา … เจ้าเคยเห็นแบบนี้ที่อื่นไหม'], evening: ['ข้าจดบันทึกไปสามเล่มแล้ว แต่ยังไม่เข้าใกล้ความจริงเลย'] },
    about: ['เวทของข้าไม่ได้เรียนเพื่อสู้ … แต่ถ้าจำเป็น ข้าก็ใช้มันได้ดี'] });
  // new travellers (not recruitable — yet)
  add('ash', { name: 'แอช', role: 'นักผจญภัยพเนจร', age: 27, home: 'inn', origin: 'เดินทางจากเมืองท่าทางใต้ ตามล่าค่าหัวไปเรื่อย ๆ', visit: { every: 8, stay: 2, offset: 4, arrive: 11, leave: 13 }, gate: 'southeast',
    look: { coat: '#7a3a2a', hair: '#e0d0b0', hat: 'bandana', hatCol: '#4a2a1a', weapon: 'sword', cape: '#5a3a2a', longHair: true },
    trait: 'มั่นใจ ขี้อวด แต่ฝีมือจริง', story: 'เคยล้มโทรลล์บึงมาแล้วสองตัว (เธอว่าอย่างนั้น)', sched: [[11, 18, 'square'], [18, 24, 'inn', 'bar'], [0, 2, 'inn', 'bar']],
    lines: { day: ['ป้ายค่าหัวที่ประตูหมู่บ้านน่ะ … ของข้าแล้ว อย่าแย่งล่ะ'], evening: ['ชนแก้วกับข้าสิ เจ้าดูเหมือนคนที่เพิ่งเริ่มออกเดินทาง'] }, about: ['ทุกเมืองมีงานให้คนกล้า … แค่ต้องกล้ากลับมาเก็บเงินด้วย'] });
  add('pell', { name: 'เพลล์', role: 'พ่อค้าเร่ขายของจุกจิก', age: 58, home: 'inn', origin: 'ลากเกวียนเร่ขายของไปทั่วทุกหมู่บ้านในหุบ', visit: { every: 5, stay: 1, offset: 3, arrive: 8, leave: 18 }, gate: 'southwest',
    look: { coat: '#8a7a4a', hair: '#9a9a9a', hat: 'hat', hatCol: '#5a4a2a', beard: '#aaaaaa', cape: '#6a5a3a' },
    trait: 'พูดเก่ง ขายเก่ง จำทางได้ทุกเส้น', story: 'อ้างว่ามีแผนที่ทุกหมู่บ้านในหุบ … ขายให้ถ้าราคาถูกใจ', sched: [[8, 18, 'market']],
    lines: { morning: ['ของใหม่จากหมู่บ้านข้างเคียง! เข็มทิศ เชือก เทียนไข ครบ!'], day: ['เจ้าจะไปทางเหนือหรือ? ข้าได้ยินว่าสะพานเก่าพังแล้วนะ'] }, about: ['เกวียนของข้าเดินทางมาไกลกว่าใครในหมู่บ้านนี้ทั้งหมดรวมกัน'] });
  add('hugo', { name: 'ฮิวโก้', role: 'ผู้แสวงบุญ', age: 66, home: 'inn', origin: 'เดินเท้าไปไหว้วิหารธาตุทุกแห่งในแผ่นดิน เฟิร์นเวลเป็นจุดพัก', visit: { every: 10, stay: 2, offset: 6, arrive: 10, leave: 12 }, gate: 'north',
    look: { coat: '#a89878', hair: '#e8e8e8', hat: 'hood', hatCol: '#8a7a5a', beard: '#f0f0f0', weapon: 'staff' },
    trait: 'สงบ พูดช้า ชอบเล่าเรื่องวิหารที่ไปมา', story: 'เดินมาแล้วสิบเอ็ดวิหาร เหลืออีกสามแห่ง', sched: [[10, 18, 'temple', 'pew'], [18, 22, 'inn', 'fire']],
    lines: { day: ['วิหารธาตุดินของที่นี่เล็ก แต่เงียบสงบกว่าที่ไหน ๆ'], evening: ['ไฟในเตาผิงอุ่นดีนะ ทำให้นึกถึงวิหารไฟทางใต้'] }, about: ['ทุกก้าวที่เดินคือคำภาวนาหนึ่งบท'] });


  // v94: where away travellers can be met on the world map (js/world-gen.js TOWNS · 'wander' = a different town each day)
  for (const [id, from] of Object.entries({ tess: 'brookmere', pell: 'brookmere', graven: 'haven', ash: 'haven', bram: 'haven', luna: 'northgate', hugo: 'northgate', finn: 'wander' })) if (P[id]) P[id].from = from;
  // v94.02: who knows the hero from childhood (familiar greeting) and who meets them as a stranger
  for (const p of Object.values(P)) p.familiar = !p.visit && !['sigrid', 'mil', 'nadia'].includes(p.id);
  /* is p in Fernvale at this day/hour? (residents always) */
  function present(p, day, hour) {
    const v = p?.visit; if (!v) return true;
    if (v.daily) return hour >= v.daily[0] && hour < v.daily[1];
    const k = (((day - 1 + (v.offset || 0)) % v.every) + v.every) % v.every;
    if (k >= v.stay) return false;
    if (k === 0 && hour < (v.arrive ?? 9)) return false;
    if (k === v.stay - 1 && hour >= (v.leave ?? 17)) return false;
    return true;
  }
  /* a line for the about panel: where they are from and when they come by */
  function originText(p) { const v = p?.visit; if (!p?.origin) return ''; if (!v) return p.origin; return p.origin + ' · ' + (v.daily ? 'มาทุกวัน ' + v.daily[0] + ':00–' + v.daily[1] + ':00' : 'อยู่หมู่บ้านราว ' + v.stay + ' วัน ทุก ๆ ' + v.every + ' วัน') }

  /* personality voice (how they say things) + how fast they hear gossip (0 slow … 3 knows everything) */
  const VOICE = { marta: ['warm', 3], finn: ['cheerful', 3], sigrid: ['gruff', 0], ren: ['cheerful', 1], olwen: ['scholar', 2], nadia: ['sly', 2], mil: ['cheerful', 1], orla: ['gentle', 1], berg: ['gruff', 0], may: ['warm', 2], tom: ['gruff', 1], lin: ['scholar', 1], mira: ['scholar', 1], saf: ['gentle', 1], ken: ['cheerful', 1], ella: ['gentle', 2], joe: ['cheerful', 2], shep: ['anxious', 1], pim: ['cheerful', 2], dork: ['formal', 1], gus: ['gruff', 2], vera: ['sly', 2], graven: ['sly', 3], oren: ['formal', 2], mother: ['warm', 2], pip: ['cheerful', 2], bryn: ['cheerful', 2], hilda: ['anxious', 1], tess: ['gentle', 3], kier: ['cheerful', 2], bram: ['gruff', 1], luna: ['scholar', 1], ash: ['cheerful', 3], pell: ['sly', 3], hugo: ['gentle', 1] };
  for (const [id, [voice, gossip]] of Object.entries(VOICE)) if (P[id]) Object.assign(P[id], { voice, gossip });

  /* ---------- recruitment ---------- each recruit has a different way in */
  const RECRUIT = {
    kier: { kind: 'friend', label: 'ชวนได้เลย (เพื่อนสมัยเด็ก)', text: 'แค่ขอ เคียร์ก็พร้อมไปด้วย', joinLine: 'ในที่สุด! ข้ารอเจ้าพูดคำนี้มาทั้งปี ไปกันเลย!' },
    bram: { kind: 'hire', label: 'จ้าง 60 💰', cost: 60, text: 'จ่ายครั้งเดียว บรัมจะคุ้มกันทีมไปตลอดทาง', joinLine: 'ตกลง ค้อนกับโล่ของข้าเป็นของเจ้าแล้ว' },
    luna: { kind: 'visits', label: 'คุยกับลูน่า 3 วันที่ต่างกัน', need: 3, text: 'เธอไม่ไว้ใจคนแปลกหน้า คุยด้วยบ่อย ๆ จนเธอเชื่อใจ (มาหมู่บ้านเป็นช่วง ๆ)', waitLines: ['ข้าไม่ไปกับคนที่เพิ่งรู้จักหรอก … แต่คุยกันได้', 'เจ้าก็ถามเรื่องจารึกเก่งดีนี่ … มาคุยกันอีกนะ'], joinLine: 'ก็ได้ … นอกหมู่บ้านมีซากโบราณที่ข้าอยากไปดู ไปด้วยกันเถอะ' },
    sigrid: { kind: 'hire', label: 'จ้าง 120 💰', cost: 120, text: 'จ่ายค่าจ้างครั้งเดียว ซิกริดจะร่วมทีมทันที' },
    ren: { kind: 'battles', label: 'ชนะการต่อสู้นอกหมู่บ้าน 3 ครั้ง (หลังรับเควส)', need: 3, text: 'รับเควสแล้วไปชนะศัตรูบนแผนที่โลก 3 ครั้ง แล้วกลับมาคุยกับเรน' },
    olwen: { kind: 'drinks', label: 'เลี้ยงเหล้า 3 ครั้ง ตอนเย็น/กลางคืน (ครั้งละ 10 💰)', need: 3, cost: 10, text: 'เลี้ยงได้วันละครั้ง ช่วง 17:00 เป็นต้นไป' },
    nadia: { kind: 'duel', label: 'ชนะดวล 1 ต่อ 1', text: 'ท้าดวลเดี่ยว (ฮีโร่คนเดียว) ชนะแล้วนาเดียจะยอมตาม' },
    mil: { kind: 'reputation', label: 'พิชิตจุดหมายข่าวลือสำเร็จ 1 แห่ง', text: 'ไปพิชิตจุดหมายใดก็ได้บนแผนที่โลก แล้วกลับมาเล่าให้มิลฟัง' },
    orla: { kind: 'offering', label: 'ถวาย 50 💰 + ยาฟื้นฟู 2 ขวด', cost: 50, potions: 2, text: 'เงินบำรุงวิหารและยาสำหรับแจกคนยาก' },
    berg: { kind: 'boss', label: 'ล้มจ่าฝูงที่ถ้ำจ่าฝูง', dest: 'den', text: 'พิชิต "ถ้ำจ่าฝูง" บนแผนที่โลก' }
  };
  /* companion combat stats (used by the battle) for the new recruits; bram/luna/kier/mil already exist there */
  const ALLY_STATS = {
    bram: { name: 'บรัม', hp: 54, atk: 12, move: 4, range: 1, fx: 'blunt', def: 2 },
    luna: { name: 'ลูน่า', hp: 44, atk: 11, move: 3, range: 4, fx: 'arcane' },
    kier: { name: 'เคียร์', hp: 48, atk: 13, move: 4, range: 1, fx: 'sword' },
    sigrid: { name: 'ซิกริด', hp: 60, atk: 15, move: 4, range: 1, fx: 'blunt', def: 2 },
    ren: { name: 'เรน', hp: 40, atk: 11, move: 4, range: 5, fx: 'arrow' },
    olwen: { name: 'โอลเวน', hp: 36, atk: 14, move: 3, range: 4, fx: 'fire' },
    nadia: { name: 'นาเดีย', hp: 42, atk: 13, move: 5, range: 1, fx: 'knife' },
    orla: { name: 'ซิสเตอร์ออร์ลา', hp: 40, atk: 7, move: 3, range: 3, fx: 'holy', healer: true },
    berg: { name: 'นายพรานเบิร์ก', hp: 50, atk: 13, move: 4, range: 4, fx: 'arrow' },
    mil: { name: 'มิล', hp: 42, atk: 10, move: 5, range: 1, fx: 'knife' }
  };

  /* ---------- party store (v94): gold, potions, hero HP and the party live in the game save (js/world-state.js);
     this object is the world-map save with those fields bound live onto it ---------- */
  const MAX_ACTIVE = 4;
  function save() {
    const S = WS().bind(WS().world() || {});
    S.done ??= {};
    return S;
  }
  function writeSave(S) { WS().writeWorld(S) }
  const inParty = (S, key) => S.party.some(p => p.key === key) || S.bench.some(p => p.key === key);
  function join(S, key) {
    const st = ALLY_STATS[key]; if (!st || inParty(S, key)) return false;
    const m = { key, name: st.name, hp: st.hp, max: st.hp, order: 'charge' };
    if (S.party.length < MAX_ACTIVE) S.party.push(m); else S.bench.push(m);
    return true;
  }
  root.VillageLife = { VillageClock, P, present, originText, homeOf: p => p.home || Object.keys(HOUSE_OF).find(h => HOUSE_OF[h] === p.id) || null, RECRUIT, ALLY_STATS, HOUSE_OF, placeKind, save, writeSave, join, inParty, MAX_ACTIVE };
  root.VillageClock = VillageClock;
})(globalThis);

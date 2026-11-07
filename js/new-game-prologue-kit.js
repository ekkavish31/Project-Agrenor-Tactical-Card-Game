/* New Game Prologue Kit v2 (merged with the old SceneArt prologue) — 18 pages: the 13 image slots of v1 + 5 pages carried over from the old prologue / Canon A (W05a W05b W09a W11a W13a).
   Loaded BEFORE title-screen.js. This replaces its prologue pages, NOT the maker logo, opening video or title menu.
   Each slot uses SceneArt until a reviewed image is explicitly enabled. No missing-image requests by default.
   Canon: docs/lore/CURRENT-ERA-CANON.md; cards' ancient origin is not revealed at New Game. */
(function(root){'use strict';
const BASE='assets/new-game-prologue/images/';
// Future art workflow: after a reviewed WebP has been committed, add its ID to APPROVED_IMAGES.
// Disabled by default; the existing SceneArt canvas provides a continuous illustrated fallback.
const APPROVED_IMAGES=new Set(['W05a','W05b','W07','W08','W09','W09a','W11','W12','W13']); // images committed in assets/new-game-prologue/images (7 slots still need art: W01 W02 W03 W04 W05 W06 W10)
const SLOTS=[
    {
      "id": "W01",
      "fx": "bloom",
      "title": "โลก Agrenor",
      "art": "realmsWide",
      "text": "โลกแห่ง Agrenor... ผืนพิภพอันกว้างใหญ่ ที่ดวงทองลอยค้างส่องแสงอบอุ่นเหนือขุนเขาและสายน้ำ\nและยังมีเรื่องราวอีกมากมาย ที่ไม่มีใครรู้จักทั้งหมด",
      "file": "world-panorama",
      "brief": "แผนภาพโลกกว้าง แสง Elukhor ผ่านเมฆ; ไม่มีป้ายชื่อหรือแผนที่ที่เผยพิกัด"
    },
    {
      "id": "W02",
      "fx": "frost",
      "title": "ดินแดนเหนือ",
      "art": "realms",
      "text": "ทางเหนือ ผืนหิมะและขุนเขาอันหนาวเหน็บทอดยาวไกล\nชีวิตเรียนรู้ที่จะดำรงอยู่ท่ามกลางความเย็นยะเยือก",
      "file": "northern-snowlands",
      "brief": "ทุ่งหิมะ ขุนเขา สิ่งมีชีวิตเขตหนาว"
    },
    {
      "id": "W03",
      "fx": "wave",
      "title": "หมู่เกาะตะวันตก",
      "art": "realms",
      "text": "ทางตะวันตก ท้องทะเลโอบล้อมหมู่เกาะน้อยใหญ่\nเป็นเส้นทางของเรือ ผู้คน และเรื่องเล่าจากฝั่งไกล",
      "file": "western-archipelago",
      "brief": "หมู่เกาะ เรือใบ เมืองท่า อย่ากำหนดชื่อเมืองใหม่"
    },
    {
      "id": "W04",
      "fx": "ember",
      "title": "ดินแดนใต้",
      "art": "realms",
      "text": "ทางใต้ เปลวไฟและขุนเขาหล่อหลอมภูมิประเทศอีกแบบหนึ่ง\nแม้ผืนดินจะแตกต่าง ชีวิตก็ยังค้นหาหนทางของตน",
      "file": "southern-firelands",
      "brief": "หุบเขาภูเขาไฟ ภูมิประเทศมีความร้อน"
    },
    {
      "id": "W05",
      "fx": "mist",
      "title": "มหาพงไพรตะวันออก",
      "art": "deepwood",
      "text": "ส่วนทางตะวันออก มหาพงไพรทอดตัวไกลเกินขอบแผนที่\nภายใต้ร่มไม้ยังมีเรื่องราวที่โลกภายนอกไม่อาจยืนยัน",
      "file": "eastern-great-forest",
      "brief": "ผืนป่ามหึมา ยอดไม้ ซากโบราณที่ไม่เปิดเผยความลับ"
    },
    {
      "id": "W05a",
      "fx": "iris",
      "title": "เรื่องเล่าจากป่าลึก",
      "art": "journal",
      "file": "ancient-ruins-forest",
      "origin": "legacy prologue: journal",
      "text": "ว่ากันว่า ลึกเข้าไปยังมีชนโบราณที่ไม่ต้อนรับผู้มาเยือน\nบ้างเล่าถึงนครที่ไม่เคยสิ้นแสง บ้างว่ามีนครซ่อนอยู่ในความมืด\nไม่มีใครรู้… ว่าเรื่องเล่าเหล่านั้นจริงเพียงใด",
      "brief": "ซากนครโบราณกลางป่า ไม่มีผู้คน (ภาพ 22 ผู้ใช้ส่งมา)"
    },
    {
      "id": "W05b",
      "fx": "focus",
      "title": "อดีตที่เหลือเพียงร่องรอย",
      "art": "dig",
      "file": "ancient-relief",
      "origin": "legacy prologue: dig + ancient, rewritten to Canon B",
      "text": "ผู้คนรู้ว่ามีอารยธรรมเก่าอยู่ก่อนตน แต่ไม่รู้ว่าตนสืบทอดอะไรมา\nภาพสลักและจารึกบนซาก บอกเล่าได้เพียงบางส่วน\nและมีหินบางก้อนใต้รากไม้ ที่ยังเรืองแสงเบา ๆ ราวกับจำได้",
      "brief": "ภาพสลักสามร่างบนผนังซาก (ภาพ 13) ผู้ใช้ตั้งใจให้สื่อสามมหาเทพโดยไม่มีข้อความยืนยัน ภาพ 19 (แผ่นหินใต้รากไม้) ไม่ใช้"
    },
    {
      "id": "W06",
      "fx": "wipe",
      "title": "ผู้คนหลายอารยธรรม",
      "art": "towns",
      "text": "แต่โลกไม่เคยหยุดรอ บนดินแดนอันแตกต่าง ผู้คนหลายเผ่าพันธุ์สร้างบ้านเมือง\nความเชื่อ ภาษา และวิถีชีวิตของตนเองขึ้นมา",
      "file": "civilizations",
      "brief": "ชุมชนต่างวัฒนธรรม ไม่วาดให้ทุกเผ่ารวมอยู่ในเมืองเดียวโดยไร้เหตุผล"
    },
    {
      "id": "W07",
      "fx": "rise",
      "title": "Nor’Chorthal",
      "art": "riverCity",
      "text": "ท่ามกลางโลกนั้น ณ ที่ราบลุ่มแห่ง Nor’Chorthal สายน้ำหล่อเลี้ยงไร่นาและบ้านเมือง\nอารยธรรมมนุษย์ค่อย ๆ หยั่งรากและเติบโตขึ้นที่นั่น",
      "file": "norchorthal-valley",
      "brief": "แม่น้ำ ไร่นา เมืองหลายขนาด แนวเขาห่างไกล"
    },
    {
      "id": "W08",
      "fx": "drift",
      "title": "ความรุ่งเรืองของมนุษย์",
      "art": "towns",
      "text": "จากชุมชนเล็ก ๆ สู่เมืองอันรุ่งเรือง\nถนนและสายน้ำค่อย ๆ เชื่อมโยงชีวิตของผู้คนทั่วทั้งอาณาจักร",
      "file": "human-civilization",
      "brief": "ถนน คาราวาน ช่างฝีมือ ตลาด เมืองมนุษย์"
    },
    {
      "id": "W09",
      "fx": "pulse",
      "title": "ศาสตร์การ์ดเวท",
      "art": "study",
      "text": "เคียงคู่กับความรุ่งเรืองนั้น คือศาสตร์การ์ดเวท\nแผ่นผนึกที่บันทึกวงจรเวท เพื่อจัดรูปพลังของผู้ถือให้กลายเป็นผลตามแบบแผน",
      "file": "card-crafting",
      "brief": "มือช่างจารึกวงจรบนการ์ด ไม่แสดงต้นแบบโบราณหรือ Vaelari"
    },
    {
      "id": "W09a",
      "fx": "page",
      "title": "ประวัติศาสตร์ที่เล่าเรียนกัน",
      "art": "study",
      "file": "card-inventor-book",
      "origin": "NEW (Canon A 4.1 / 8: what humans are taught)",
      "text": "ว่ากันว่า จอมเวทมนุษย์ผู้ยิ่งใหญ่คนหนึ่ง คือผู้คิดค้นศาสตร์นี้เป็นคนแรกของโลก",
      "brief": "ภาพในหนังสือเก่า นักเวทมนุษย์เขียนวงจรลงการ์ด (ภาพ 24) ไม่เห็นหน้า ไม่ระบุชื่อ"
    },
    {
      "id": "W10",
      "fx": "darklift",
      "title": "การ์ดกับการเดินทางของมนุษย์",
      "art": "journey",
      "text": "มนุษย์อ่อนแอกว่าเผ่าพันธุ์อื่น การ์ดเวทจึงช่วยให้พวกเขา\nก้าวข้ามอันตรายระหว่างทาง เดินทางไกลได้มากขึ้น",
      "file": "traveler-card",
      "brief": "นักเดินทางมนุษย์กลางคืนหรือในที่เปลี่ยว ใช้การ์ดเรืองแสงข้ามอันตราย; เห็นแค่เงา/มือ ไม่เห็นหน้า (ตัวเอกเลือกเพศเอง)"
    },
    {
      "id": "W11",
      "fx": "warm",
      "title": "เรื่องเล่าของนักเดินทาง",
      "art": "roadOut",
      "text": "พวกเขานำพาสินค้า ความรู้ ความฝัน และเรื่องเล่าออกไปสู่โลกกว้าง\nบางเรื่องกลายเป็นตำนาน บางเรื่องเลือนหายไปตามกาลเวลา",
      "file": "travelers-stories",
      "brief": "นักเดินทางและเส้นทางหลายภูมิประเทศ เชื่อมภาพต่อเนื่อง"
    },
    {
      "id": "W11a",
      "fx": "same",
      "title": "เหตุผลของนักเดินทาง",
      "art": "roadOut",
      "share": "W11",
      "origin": "legacy prologue: roadOut",
      "text": "นักเดินทางแต่ละคนมีเหตุผลของตน บ้างแสวงหาความมั่งคั่ง บ้างตามหาสิ่งที่สูญหาย\nและบ้าง… เพียงต้องการเริ่มต้นใหม่"
    },
    {
      "id": "W12",
      "fx": "drift",
      "title": "ถนนสู่ Fernvale",
      "art": "roadOut",
      "text": "และนักเดินทางไม่น้อย ก็เคยผ่านถนนสายหนึ่ง\nที่แยกจากเส้นทางใหญ่ มุ่งสู่หมู่บ้านเล็ก ๆ ริมป่า",
      "file": "road-to-fernvale",
      "brief": "ถนนชนบทต่อเนื่องจากภาพก่อนหน้า ค่อยเห็นหมู่บ้านไกล ๆ"
    },
    {
      "id": "W13",
      "fx": "sunrise",
      "title": "Fernvale",
      "art": "fernvale",
      "text": "Fernvale... หมู่บ้านที่ชีวิตดำเนินไปอย่างเรียบง่าย ริมเส้นทางสู่เมืองใหญ่\nที่นี่ นครลึกลับและอารยธรรมที่สาบสูญ เป็นเพียงเรื่องเล่าจากแดนไกล",
      "file": "fernvale-morning",
      "brief": "หมู่บ้านยามเช้า ลานฝึกทางซ้าย ป่าด้านหลัง เชื่อมฉากบ้าน/แม่เดิม"
    },
    {
      "id": "W13a",
      "fx": "glow",
      "title": "เช้าวันหนึ่ง",
      "art": "dawn",
      "share": "W13",
      "origin": "legacy prologue: dawn (+ the golden light of page 1)",
      "text": "เช้าวันหนึ่งเริ่มต้นขึ้น เช่นเดียวกับวันอื่น ดวงทองลอยค้างอบอุ่นเหนือหลังคาบ้าน\nและเรื่องราวของเจ้า… ก็เริ่มต้นที่นี่"
    }
  ];
const byId=Object.fromEntries(SLOTS.map(s=>[s.id,s]));
// "share": the page reuses the picture of another slot (nothing extra to paint); until that picture is approved it falls back to its own SceneArt key
// Pages with no approved picture show a plain "Waiting for Pic" board (not SceneArt) so it is obvious which pictures are still to be created.
// "fx" = the mood transition used when this page's picture comes in (js/title-screen.js showPage · css/title-screen.css .fx-*).
const pages=SLOTS.map(s=>{const src=byId[s.share]||s,ok=APPROVED_IMAGES.has(src.id);return{art:null,bg:ok?BASE+src.file+'.webp':null,placeholder:!ok,fx:s.fx||'fade',label:s.id+' · '+s.title,text:s.text,prologueId:s.id}});
root.NewGamePrologueKit={version:2,pages,slots:SLOTS,approved:[...APPROVED_IMAGES],base:BASE};
})(globalThis);

/* New Game Prologue Kit v1 — planning and image slots only.
   Loaded BEFORE title-screen.js. This replaces its prologue pages, NOT the maker logo, opening video or title menu.
   Each slot uses SceneArt until a reviewed image is explicitly enabled. No missing-image requests by default.
   Canon: docs/lore/CURRENT-ERA-CANON.md; cards' ancient origin is not revealed at New Game. */
(function(root){'use strict';
const BASE='assets/new-game-prologue/images/';
// Future art workflow: after a reviewed WebP has been committed, add its ID to APPROVED_IMAGES.
// Disabled by default; the existing SceneArt canvas provides a continuous illustrated fallback.
const APPROVED_IMAGES=new Set([]);
const SLOTS=[
  {
    "id": "W01",
    "title": "โลก Agrenor",
    "art": "realmsWide",
    "text": "โลกแห่ง Agrenor... ผืนพิภพอันกว้างใหญ่ที่ทอดยาวสุดสายตา\nและยังมีเรื่องราวอีกมากมาย ที่ไม่มีใครรู้จักทั้งหมด",
    "file": "world-panorama",
    "brief": "แผนภาพโลกกว้าง แสง Elukhor ผ่านเมฆ; ไม่มีป้ายชื่อหรือแผนที่ที่เผยพิกัด"
  },
  {
    "id": "W02",
    "title": "ดินแดนเหนือ",
    "art": "realms",
    "text": "ทางเหนือ ผืนหิมะและขุนเขาอันหนาวเหน็บทอดยาวไกล\nชีวิตเรียนรู้ที่จะดำรงอยู่ท่ามกลางความเย็นยะเยือก",
    "file": "northern-snowlands",
    "brief": "ทุ่งหิมะ ขุนเขา สิ่งมีชีวิตเขตหนาว"
  },
  {
    "id": "W03",
    "title": "หมู่เกาะตะวันตก",
    "art": "realms",
    "text": "ทางตะวันตก ท้องทะเลโอบล้อมหมู่เกาะน้อยใหญ่\nเป็นเส้นทางของเรือ ผู้คน และเรื่องเล่าจากฝั่งไกล",
    "file": "western-archipelago",
    "brief": "หมู่เกาะ เรือใบ เมืองท่า อย่ากำหนดชื่อเมืองใหม่"
  },
  {
    "id": "W04",
    "title": "ดินแดนใต้",
    "art": "realms",
    "text": "ทางใต้ เปลวไฟและขุนเขาหล่อหลอมภูมิประเทศอีกแบบหนึ่ง\nแม้ผืนดินจะแตกต่าง ชีวิตก็ยังค้นหาหนทางของตน",
    "file": "southern-firelands",
    "brief": "หุบเขาภูเขาไฟ ภูมิประเทศมีความร้อน"
  },
  {
    "id": "W05",
    "title": "มหาพงไพรตะวันออก",
    "art": "deepwood",
    "text": "ส่วนทางตะวันออก มหาพงไพรทอดตัวไกลเกินขอบแผนที่\nภายใต้ร่มไม้ยังมีเรื่องราวที่โลกภายนอกไม่อาจยืนยัน",
    "file": "eastern-great-forest",
    "brief": "ผืนป่ามหึมา ยอดไม้ ซากโบราณที่ไม่เปิดเผยความลับ"
  },
  {
    "id": "W06",
    "title": "ผู้คนหลายอารยธรรม",
    "art": "towns",
    "text": "บนดินแดนอันแตกต่าง ผู้คนหลายเผ่าพันธุ์สร้างบ้านเมือง\nความเชื่อ ภาษา และวิถีชีวิตของตนเองขึ้นมา",
    "file": "civilizations",
    "brief": "ชุมชนต่างวัฒนธรรม ไม่วาดให้ทุกเผ่ารวมอยู่ในเมืองเดียวโดยไร้เหตุผล"
  },
  {
    "id": "W07",
    "title": "Nor’Chorthal",
    "art": "riverCity",
    "text": "ท่ามกลางโลกนั้น ณ ที่ราบลุ่มแห่ง Nor’Chorthal\nอารยธรรมมนุษย์ค่อย ๆ หยั่งรากและเติบโตขึ้น",
    "file": "norchorthal-valley",
    "brief": "แม่น้ำ ไร่นา เมืองหลายขนาด แนวเขาห่างไกล"
  },
  {
    "id": "W08",
    "title": "ความรุ่งเรืองของมนุษย์",
    "art": "towns",
    "text": "จากชุมชนเล็ก ๆ สู่เมืองอันรุ่งเรือง\nถนนและสายน้ำค่อย ๆ เชื่อมโยงชีวิตของผู้คนทั่วทั้งอาณาจักร",
    "file": "human-civilization",
    "brief": "ถนน คาราวาน ช่างฝีมือ ตลาด เมืองมนุษย์"
  },
  {
    "id": "W09",
    "title": "ศาสตร์การ์ดเวท",
    "art": "study",
    "text": "เคียงคู่กับความรุ่งเรืองนั้น คือศาสตร์การ์ดเวท\nแผ่นผนึกที่บันทึกวงจรเวท เพื่อจัดรูปพลังของผู้ถือให้กลายเป็นผลตามแบบแผน",
    "file": "card-crafting",
    "brief": "มือช่างจารึกวงจรบนการ์ด ไม่แสดงต้นแบบโบราณหรือ Vaelari"
  },
  {
    "id": "W10",
    "title": "การ์ดในชีวิตและการเดินทาง",
    "art": "journey",
    "text": "การ์ดเวทเป็นทั้งเครื่องมือในชีวิตประจำวัน และสิ่งคุ้มครองผู้เดินทาง\nในบางคืน มันอาจเป็นความหวังเดียวให้กลับถึงบ้านได้",
    "file": "traveler-card",
    "brief": "คาราวานใช้การ์ดเวทป้องกันภัย พลังมาจากผู้ใช้ ไม่ใช่การ์ดสร้างพลังเอง"
  },
  {
    "id": "W11",
    "title": "เรื่องเล่าของนักเดินทาง",
    "art": "roadOut",
    "text": "พวกเขานำพาสินค้า ความรู้ ความฝัน และเรื่องเล่าออกไปสู่โลกกว้าง\nบางเรื่องกลายเป็นตำนาน บางเรื่องเลือนหายไปตามกาลเวลา",
    "file": "travelers-stories",
    "brief": "นักเดินทางและเส้นทางหลายภูมิประเทศ เชื่อมภาพต่อเนื่อง"
  },
  {
    "id": "W12",
    "title": "ถนนสู่ Fernvale",
    "art": "roadOut",
    "text": "และนักเดินทางไม่น้อย ก็เคยผ่านถนนสายหนึ่ง\nที่แยกจากเส้นทางใหญ่ มุ่งสู่หมู่บ้านเล็ก ๆ ริมป่า",
    "file": "road-to-fernvale",
    "brief": "ถนนชนบทต่อเนื่องจากภาพก่อนหน้า ค่อยเห็นหมู่บ้านไกล ๆ"
  },
  {
    "id": "W13",
    "title": "Fernvale",
    "art": "fernvale",
    "text": "Fernvale... หมู่บ้านที่ชีวิตดำเนินไปอย่างเรียบง่าย\nและในเช้าวันหนึ่ง เรื่องราวบทใหม่ก็กำลังจะเริ่มขึ้น ณ ที่แห่งนี้",
    "file": "fernvale-morning",
    "brief": "หมู่บ้านยามเช้า ลานฝึกทางซ้าย ป่าด้านหลัง เชื่อมฉากบ้าน/แม่เดิม"
  }
];
const pages=SLOTS.map(s=>({art:APPROVED_IMAGES.has(s.id)?null:s.art,bg:APPROVED_IMAGES.has(s.id)?BASE+s.file+'.webp':null,text:s.text,prologueId:s.id}));
root.NewGamePrologueKit={version:1,pages,slots:SLOTS,approved:[...APPROVED_IMAGES],base:BASE};
})(globalThis);

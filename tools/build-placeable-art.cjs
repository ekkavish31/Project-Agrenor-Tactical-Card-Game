/* v98.430 · node tools/build-placeable-art.cjs  →  js/placeable-art.js
   ONE catalogue of every picture in the repository that can be PLACED as a sub-asset (furniture, workshop tools, town decoration,
   trees, fences, coast/snow pieces, battlefield props, crops …), with a Thai name, a group, its real picture size and a sensible
   starting width for each editor. Both pickers read it:
     • village editor  (js/village-asset-edit.js → js/village-repo-assets.js)  "＋ เพิ่มของ…"
     • sub-map editor  (village-place.html ART_LIST / js/place-build.js)       "＋ เพิ่มของประดับ…" / "ภาพของจุดทำงานใหม่"
   A picture added to one of the FOLDERS below without a row here still shows up (group "ภาพใหม่ (ยังไม่ตั้งชื่อ)") — run this
   tool again after adding a name. tools/test-placeable-art.cjs fails when a folder holds a picture this catalogue does not know.
   Fields written: id · src · n (name) · g (group) · w,h (picture px) · ay (anchor: fraction of the picture height where the floor
   point sits) · tw (width in the village, px; 0 = not offered there) · sw (width on a sub-map, px) · sub (art id on a sub-map) · town (kind id in the village) */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');

/* ---------- picture size (webp / png header) ---------- */
function dims(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const c = b.toString('ascii', 12, 16);
    if (c === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
    if (c === 'VP8 ') return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
    if (c === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1] }
  }
  if (b.readUInt32BE(0) === 0x89504e47) return [b.readUInt32BE(16), b.readUInt32BE(20)];
  return [0, 0];
}

/* ---------- groups (order = tab order in the pickers) ---------- */
const G = {
  forge: 'โรงตีเหล็ก/งานช่าง', shop: 'ร้านค้า/ตลาด', home: 'บ้าน: โต๊ะ/ที่นั่ง/ตู้', bed: 'ห้องนอน/พรม', inn: 'ครัว/โรงเตี๊ยม',
  fire: 'เตาผิง/แสงไฟ', small: 'ของเล็กบนโต๊ะ/ต้นไม้ในร่ม', temple: 'วิหาร', guild: 'สมาคมนักผจญภัย', sage: 'ห้องสมุด/นักปราชญ์',
  healer: 'สถานพยาบาล', wall: 'ประตู/หน้าต่าง/ของแขวนผนัง', craft: 'งานฝีมือในบ้าน', farm: 'ไร่/ฟาร์ม', crop: 'พืชผัก (4 ระยะ)',
  town: 'ของตกแต่งเมือง', fence: 'รั้ว/กำแพง/ประตูเมือง', tree: 'ต้นไม้/พุ่มไม้', coast: 'ชายฝั่ง', snow: 'หิมะ',
  wild: 'ป่า/ของเล็กบนพื้น', battle: 'สนามรบ/ซากปรักหักพัง', rock: 'หิน/แร่/คริสตัล', bld: 'อาคาร (ภาพทั้งหลัง)'
};

/* ---------- interior pictures (js/interior-art.js · one tile = 68 px there) ---------- */
const INTERIOR = {
  // sheet 1 · tables & seating
  'table-round': ['โต๊ะกลม', G.home], 'table-square': ['โต๊ะสี่เหลี่ยม', G.home], 'table-long': ['โต๊ะยาว', G.home], stool: ['เก้าอี้สตูล', G.home],
  chair: ['เก้าอี้พนักพิง', G.home], 'bench-long': ['ม้านั่งยาว (ในร่ม)', G.home], 'stool-bar': ['สตูลบาร์สูง', G.inn], 'table-side': ['โต๊ะข้าง', G.home], 'table-barrel': ['โต๊ะถังไม้', G.inn],
  // sheet 2 · counters, desks, stage, stairs
  'counter-bar': ['เคาน์เตอร์บาร์', G.inn], 'counter-bar-end': ['เคาน์เตอร์บาร์ (ปลาย)', G.inn], 'counter-shop': ['เคาน์เตอร์ร้านค้า', G.shop], 'counter-guild': ['เคาน์เตอร์สมาคม', G.guild],
  'counter-healer': ['เคาน์เตอร์หมอ', G.healer], 'desk-writing': ['โต๊ะเขียนหนังสือ (ลิ้นชัก)', G.home], stage: ['เวทีไม้', G.inn], stairs: ['บันได', G.wall], 'counter-flap': ['เคาน์เตอร์ (ช่องเปิด)', G.shop],
  // sheet 3 · storage
  crate: ['ลังไม้', G.home], 'crate-stack': ['ลังไม้ซ้อน', G.home], keg: ['ถังเบียร์เล็ก', G.inn], basket: ['ตะกร้า', G.home], trunk: ['หีบเดินทาง', G.bed],
  'shelf-store': ['ชั้นวางของร้าน', G.shop], 'shelf-books': ['ชั้นหนังสือ', G.sage], 'rack-weapons': ['ชั้นวางอาวุธ', G.forge], 'rack-tools': ['ชั้นแขวนเครื่องมือช่าง', G.forge],
  // sheet 5A · forge
  furnace: ['เตาหลอม', G.forge], anvil: ['ทั่งตีเหล็ก', G.forge], quench: ['ถังชุบ', G.forge], bellows: ['เครื่องเป่าลม', G.forge], grindstone: ['หินลับมีด', G.forge],
  'bench-smith': ['โต๊ะช่างตีเหล็ก', G.forge], 'coal-bin': ['ถังถ่านหิน', G.forge], ingots: ['กองแท่งโลหะ', G.forge], 'forge-open': ['เตาเผาเปิด', G.forge],
  // sheet 4 · bedroom & rugs
  'bed-single': ['เตียงเดี่ยว', G.bed], 'bed-double': ['เตียงคู่', G.bed], 'bed-cot': ['เตียงผ้าใบ', G.bed], footlocker: ['หีบปลายเตียง', G.bed], wardrobe: ['ตู้เสื้อผ้า', G.bed],
  'rug-3x3': ['พรม 3×3', G.bed], 'rug-4x3': ['พรม 4×3', G.bed], 'rug-runner': ['พรมทางเดิน', G.bed], 'rug-round': ['พรมกลม', G.bed],
  // sheet 7 · temple
  altar: ['แท่นบูชา', G.temple], statue: ['รูปปั้นเทพ', G.temple], pew: ['ม้านั่งโบสถ์', G.temple], candelabra: ['เชิงเทียนกิ่ง', G.temple], 'candle-stand': ['เสาเทียน', G.temple],
  font: ['อ่างน้ำมนต์', G.temple], lectern: ['แท่นอ่านคัมภีร์', G.temple], 'offering-box': ['กล่องถวาย', G.temple], brazier: ['กระถางไฟ', G.temple],
  // sheet 11A · doors & windows
  'door-open': ['ประตูเปิด', G.wall], 'door-closed': ['ประตูปิด', G.wall], 'door-double': ['ประตูคู่', G.wall], 'door-arch': ['ประตูโค้ง', G.wall],
  'window-casement': ['หน้าต่างบานเปิด', G.wall], 'window-barred': ['หน้าต่างลูกกรง', G.wall], 'window-arched': ['หน้าต่างโค้ง', G.wall], 'window-stained': ['หน้าต่างกระจกสี', G.wall], 'window-shuttered': ['หน้าต่างบานเกล็ด', G.wall],
  // sheet 11B · wall hangings
  'wall-shelf-jars': ['ชั้นแขวนโหล', G.wall], 'wall-shelf-books': ['ชั้นแขวนหนังสือ', G.wall], noticeboard: ['บอร์ดประกาศ (ผนัง)', G.wall], 'banner-long': ['ธงแขวนยาว', G.wall],
  'banner-guild': ['ธงสมาคม', G.guild], 'swords-shield': ['โล่ดาบไขว้', G.wall], antlers: ['เขากวางแขวน', G.wall], 'wall-torch': ['คบไฟผนัง', G.fire], painting: ['ภาพวาด', G.wall],
  // sheet 8 · healer
  'mortar-table': ['โต๊ะบดยา', G.healer], 'potion-table': ['โต๊ะปรุงยา', G.healer], 'herb-cabinet': ['ตู้สมุนไพร', G.healer], 'drawer-cabinet': ['ตู้ลิ้นชัก', G.healer],
  'doctor-chair': ['เก้าอี้ตรวจ', G.healer], 'bandage-basket': ['ตะกร้าผ้าพันแผล', G.healer], 'folding-screen': ['ฉากกั้น', G.healer], 'wash-stand': ['อ่างล้างมือ', G.healer], 'herb-drying-rack': ['ราวตากสมุนไพร', G.healer],
  // sheet 6 · home crafts
  loom: ['กี่ทอผ้า', G.craft], 'bread-oven': ['เตาอบขนมปัง', G.craft], 'carpenter-bench': ['โต๊ะช่างไม้', G.craft], 'log-pile': ['กองฟืน (ในร่ม)', G.craft], 'writing-desk': ['โต๊ะเขียนหนังสือ (ขนนก)', G.craft],
  'net-rack': ['ราวตากแห', G.craft], millstone: ['โม่หิน', G.craft], 'spinning-wheel': ['ล้อปั่นด้าย', G.craft], 'cook-hearth': ['เตาทำอาหาร', G.craft],
  // sheet 9 · market
  'stall-red': ['แผงตลาด (แดง)', G.shop], 'stall-blue': ['แผงตลาด (น้ำเงิน)', G.shop], 'stall-green': ['แผงตลาด (เขียว)', G.shop], 'stall-gold': ['แผงตลาด (ทอง)', G.shop],
  'fruit-crate': ['ลังผลไม้', G.shop], 'veg-basket': ['ตะกร้าผัก', G.shop], 'sack-pile': ['กองกระสอบ', G.shop], 'cheese-table': ['โต๊ะชีส', G.shop], 'price-post': ['ป้ายราคา', G.shop],
  // sheet 10 · adventurers' guild
  'quest-board': ['กระดานภารกิจ', G.guild], 'trophy-case': ['ตู้ถ้วยรางวัล', G.guild], 'reg-desk': ['โต๊ะลงทะเบียน', G.guild], 'armor-stand': ['หุ่นชุดเกราะ', G.guild], 'weapon-barrel': ['ถังเสียบอาวุธ', G.guild],
  'map-table': ['โต๊ะแผนที่', G.guild], 'training-dummy': ['หุ่นฝึก', G.guild], 'banner-stand': ['เสาธงสมาคม', G.guild], 'gear-bench': ['ม้านั่งวางอุปกรณ์', G.guild],
  // sheet 5B · fireplaces & light
  'fireplace-stone': ['เตาผิงหิน', G.fire], 'fireplace-grand': ['เตาผิงใหญ่', G.fire], 'fireplace-pot': ['เตาผิงแขวนหม้อ', G.fire], 'stove-iron': ['เตาเหล็ก', G.fire], 'fire-tools': ['ชุดเครื่องมือเตาผิง', G.fire],
  'log-basket': ['ตะกร้าฟืน', G.fire], 'floor-lamp': ['โคมตั้งพื้น', G.fire], 'table-lantern': ['ตะเกียงตั้งโต๊ะ', G.fire], 'fire-pit': ['หลุมไฟ', G.fire],
  // sheet 12 · small things & plants
  tankards: ['เหยือกเบียร์', G.small], 'plate-food': ['จานอาหาร', G.small], 'stew-pot': ['หม้อสตู', G.small], 'candles-cluster': ['กลุ่มเทียน', G.small], 'book-scrolls': ['หนังสือ/ม้วนกระดาษ', G.small],
  'wine-set': ['ชุดไวน์', G.small], 'plant-large': ['ต้นไม้กระถางใหญ่', G.small], 'plant-fern': ['เฟิร์นกระถาง', G.small], 'flower-vase': ['แจกันดอกไม้', G.small],
  // sheet 15 · inn & kitchen
  'roast-spit': ['เตาย่างหมุน', G.inn], 'kitchen-table': ['โต๊ะครัว', G.inn], 'barrel-rack': ['ชั้นถังไม้', G.inn], 'wine-rack': ['ชั้นไวน์', G.inn], 'lute-stand': ['ขาตั้งพิณ', G.inn],
  'drum-stool': ['เก้าอี้กลอง', G.inn], 'game-table': ['โต๊ะเกม', G.inn], 'pot-rack': ['ราวแขวนหม้อ', G.inn], 'mead-cask': ['ถังมี้ด', G.inn],
  // sheet 16 · library & sage
  'big-bookcase': ['ตู้หนังสือใหญ่', G.sage], 'reading-chair': ['เก้าอี้อ่านหนังสือ', G.sage], 'globe-stand': ['ลูกโลก', G.sage], telescope: ['กล้องดูดาว', G.sage], 'alchemy-table': ['โต๊ะเล่นแร่แปรธาตุ', G.sage],
  'scroll-rack': ['ชั้นม้วนคัมภีร์', G.sage], 'astrolabe-table': ['โต๊ะแอสโตรเลบ', G.sage], 'specimen-cabinet': ['ตู้ตัวอย่าง', G.sage], 'armchair-set': ['ชุดอาร์มแชร์', G.sage],
  // sheet 17 · shop displays (a = shop version, b = second version)
  'weapon-display': ['ชั้นโชว์อาวุธ', G.shop], 'armor-display': ['ชั้นโชว์เกราะ', G.shop], 'potion-display': ['ชั้นโชว์ยา', G.shop], 'jewel-case': ['ตู้อัญมณี', G.shop], 'tool-stand': ['ขาตั้งเครื่องมือ', G.shop],
  'cloth-shelf': ['ชั้นผ้า', G.shop], 'rug-barrel': ['ถังม้วนพรม', G.shop], 'pack-rack': ['ราวกระเป๋าเดินทาง', G.shop], 'till-scale': ['ตาชั่ง/ลิ้นชักเงิน', G.shop],
  'weapon-display-b': ['ชั้นโชว์อาวุธ แบบ 2', G.shop], 'armor-display-b': ['ชั้นโชว์เกราะ แบบ 2', G.shop], 'potion-display-b': ['ชั้นโชว์ยา แบบ 2', G.shop], 'jewel-case-b': ['ตู้อัญมณี แบบ 2', G.shop],
  'tool-stand-b': ['ขาตั้งเครื่องมือ แบบ 2', G.shop], 'cloth-shelf-b': ['ชั้นผ้า แบบ 2', G.shop], 'rug-barrel-b': ['ถังม้วนพรม แบบ 2', G.shop], 'pack-rack-b': ['ราวกระเป๋า แบบ 2', G.shop], 'till-scale-b': ['ตาชั่ง แบบ 2', G.shop],
  // sheet 13A · farm
  barn: ['ยุ้งฉาง', G.farm], scarecrow: ['หุ่นไล่กา', G.farm], compost: ['กองปุ๋ยหมัก', G.farm], 'water-trough': ['รางน้ำสัตว์', G.farm], 'hay-bale': ['ฟางอัดก้อน', G.farm],
  'farm-sign': ['ป้ายไร่', G.farm], 'chicken-coop': ['เล้าไก่', G.farm], beehives: ['รังผึ้ง', G.farm], 'farm-well': ['บ่อน้ำไร่', G.farm]
};

/* ---------- everything else: [file under assets/, name, group, width in the village (0 = sub-maps only), anchor] ---------- */
const V = 'village-town/';
const OTHER = [
  // town decoration already in the village table (DECOR_W) keeps its old kind there; listed for the sub-maps
  [V + 'decor/fence-picket', 'รั้วไม้', G.fence, 110], [V + 'decor/stone-wall-low', 'กำแพงหินเตี้ย', G.fence, 110], [V + 'decor/hedge-row', 'แนวพุ่มไม้', G.fence, 120],
  [V + 'decor/flower-bed', 'แปลงดอกไม้', G.town, 118], [V + 'decor/flower-box', 'กระบะดอกไม้', G.town, 90], [V + 'decor/stepping-stones', 'หินทางเดิน', G.town, 130],
  [V + 'decor/pond-lilies', 'บ่อบัว', G.town, 220], [V + 'decor/bench', 'ม้านั่ง', G.town, 110], [V + 'decor/market-stall-red', 'แผงตลาดแดง', G.shop, 230],
  [V + 'decor/market-stall-blue', 'แผงตลาดน้ำเงิน', G.shop, 230], [V + 'decor/banner-pole', 'เสาธง', G.town, 75], [V + 'decor/woodpile', 'กองฟืน', G.town, 115],
  [V + 'decor/signpost', 'ป้ายบอกทาง', G.town, 70], [V + 'decor/well', 'บ่อน้ำ', G.town, 120], [V + 'decor/cart', 'เกวียน', G.town, 150], [V + 'decor/hay', 'กองฟาง', G.farm, 95],
  [V + 'decor/lamp-post', 'เสาตะเกียง', G.town, 35],
  // sheet V1 · town gates and street things
  [V + 'decor/v1-town-gate-stone', 'ประตูเมือง (หิน)', G.fence, 300], [V + 'decor/v1-town-gate-timber', 'ประตูเมือง (ไม้)', G.fence, 280], [V + 'decor/v1-rowboat', 'เรือพาย', G.coast, 170],
  [V + 'decor/v1-veg-stand', 'แผงผัก', G.shop, 150], [V + 'decor/v1-laundry-line', 'ราวตากผ้า', G.town, 170], [V + 'decor/v1-chopping-block', 'ตอไม้ผ่าฟืน', G.town, 80],
  [V + 'decor/v1-rain-barrel', 'ถังรองน้ำฝน', G.town, 75], [V + 'decor/v1-notice-board', 'บอร์ดประกาศ', G.town, 110], [V + 'decor/v1-wheelbarrow', 'รถเข็นล้อเดียว', G.farm, 110],
  // props (never placed before)
  [V + 'props/angel-statue', 'รูปปั้นนางฟ้า', G.town, 105], [V + 'props/crates-barrel', 'ลังกับถังไม้', G.town, 110], [V + 'props/flower-bush', 'พุ่มดอกไม้', G.tree, 90],
  [V + 'props/flower-urn', 'โถดอกไม้', G.town, 70], [V + 'props/iron-fence', 'รั้วเหล็กเสาหิน', G.fence, 170], [V + 'props/picket-fence', 'รั้วไม้ระแนง', G.fence, 150],
  [V + 'props/picnic-bench', 'โต๊ะปิกนิก', G.town, 130], [V + 'props/pine-tree', 'ต้นสน (เดี่ยว)', G.tree, 190],
  // nature
  [V + 'nature/broadleaf', 'ต้นไม้ใบกว้าง', G.tree, 230], [V + 'nature/old-oak', 'ต้นโอ๊กเก่า', G.tree, 250], [V + 'nature/tree-round', 'ต้นไม้พุ่มกลม', G.tree, 190],
  [V + 'nature/tree-round-2', 'ต้นไม้พุ่มกลม 2', G.tree, 175], [V + 'nature/pine', 'ต้นสน', G.tree, 215], [V + 'nature/tree-conifer', 'ต้นสนกรวย', G.tree, 200],
  [V + 'nature/tree-blossom', 'ต้นไม้ดอกชมพู', G.tree, 185], [V + 'nature/bush-small', 'พุ่มไม้เล็ก', G.tree, 74], [V + 'nature/rock-cluster', 'กลุ่มหินมีดอกไม้', G.rock, 66],
  [V + 'nature/tall-grass', 'หญ้าสูง', G.wild, 64], [V + 'nature/w1-oak-tree', 'ต้นโอ๊ก', G.tree, 235], [V + 'nature/w1-oak-grove', 'ดงโอ๊ก', G.tree, 250],
  [V + 'nature/w1-fir-tree', 'ต้นเฟอร์', G.tree, 215], [V + 'nature/w1-autumn-tree', 'ต้นไม้ใบแดง', G.tree, 215], [V + 'nature/w1-bush-flowers', 'พุ่มไม้มีดอก', G.tree, 80],
  [V + 'nature/w1-dead-tree', 'ต้นไม้แห้ง', G.tree, 215], [V + 'nature/w1-reeds', 'กกริมน้ำ', G.wild, 90], [V + 'nature/w1-snow-pine', 'ต้นสนหิมะ', G.snow, 215],
  [V + 'nature/w1-swamp-willow', 'ต้นหลิวบึง', G.tree, 230],
  // coast & snow edges (js/village-biomes.js widths)
  [V + 'edge/coast-beach-grass', 'หญ้าชายหาด', G.coast, 100], [V + 'edge/coast-boat', 'เรือ', G.coast, 190], [V + 'edge/coast-crates-barrel', 'ลัง/ถังริมท่า', G.coast, 125],
  [V + 'edge/coast-driftwood', 'ขอนไม้ลอยน้ำ', G.coast, 150], [V + 'edge/coast-fish-net', 'แหตากริมน้ำ', G.coast, 150], [V + 'edge/coast-foam-edge', 'ฟองคลื่นริมหาด', G.coast, 210],
  [V + 'edge/coast-lantern-post', 'เสาตะเกียงท่าเรือ', G.coast, 105], [V + 'edge/coast-lobster-trap', 'ลอบดักกุ้ง', G.coast, 125], [V + 'edge/coast-pier-end', 'ปลายสะพานท่าเรือ', G.coast, 210],
  [V + 'edge/coast-pier', 'สะพานท่าเรือ', G.coast, 210], [V + 'edge/coast-rocks-l', 'หินริมทะเล (ใหญ่)', G.coast, 190], [V + 'edge/coast-rocks-s', 'หินริมทะเล (เล็ก)', G.coast, 140],
  [V + 'edge/frozen-bush', 'พุ่มไม้น้ำแข็ง', G.snow, 90], [V + 'edge/frozen-puddle', 'แอ่งน้ำแข็ง', G.snow, 190], [V + 'edge/snow-log', 'ขอนไม้หิมะ', G.snow, 170],
  [V + 'edge/snow-pine-l', 'สนหิมะ (ใหญ่)', G.snow, 230], [V + 'edge/snow-pine-m', 'สนหิมะ (กลาง)', G.snow, 190], [V + 'edge/snow-pine-s', 'สนหิมะ (เล็ก)', G.snow, 150],
  [V + 'edge/snow-ridge', 'สันหิมะ', G.snow, 220], [V + 'edge/snow-rock-l', 'หินหิมะ (ใหญ่)', G.snow, 170], [V + 'edge/snow-rock-m', 'หินหิมะ (กลาง)', G.snow, 130],
  [V + 'edge/snow-rock-s', 'หินหิมะ (เล็ก)', G.snow, 100], [V + 'edge/snow-sign', 'ป้ายในหิมะ', G.snow, 120], [V + 'edge/snowdrift', 'กองหิมะ', G.snow, 140],
  // fences & buildings drawn in the Object Workshop
  ['objects/fence-picket-long', 'รั้วระแนงยาว', G.fence, 260], ['objects/fence-wood-2', 'รั้วไม้ 2 ช่อง', G.fence, 120], ['objects/fence-wood-long', 'รั้วไม้ยาว', G.fence, 260],
  ['objects/iron-fence-cornerlong', 'รั้วเหล็กเข้ามุม', G.fence, 260], ['objects/iron-fence2', 'รั้วเหล็ก 2 ช่อง', G.fence, 200], ['objects/iron-fence4', 'รั้วเหล็ก 4 ช่อง', G.fence, 260],
  ['objects/house-01', 'บ้านไม้หลังเล็ก', G.bld, 0, .86], ['objects/adventurer-guild', 'สมาคมนักผจญภัย', G.bld, 0, .86],
  // battlefield props (js/field-host.js) — useful as wild-land decoration too
  ['tactics/decor/bones', 'กระดูก', G.wild, 70], ['tactics/decor/fern', 'เฟิร์น', G.wild, 70], ['tactics/decor/flowers', 'ดอกไม้ป่า', G.wild, 60],
  ['tactics/decor/lamp', 'ตะเกียงวางพื้น', G.wild, 40], ['tactics/decor/leaves', 'ใบไม้ร่วง', G.wild, 60], ['tactics/decor/mushrooms', 'เห็ด', G.wild, 60],
  ['tactics/decor/pebbles', 'ก้อนกรวด', G.rock, 60], ['tactics/decor/tools', 'จอบเสียม', G.wild, 60], ['tactics/decor/web', 'ใยแมงมุม', G.wild, 60],
  ['tactics/props/barrel', 'ถังไม้ (สนามรบ)', G.battle, 70], ['tactics/props/beam', 'คานไม้แขวนตะเกียง', G.battle, 110], ['tactics/props/bush', 'พุ่มไม้ผลแดง', G.tree, 90],
  ['tactics/props/cart', 'รถเข็นแร่', G.battle, 110], ['tactics/props/crates', 'ลังซ้อน (สนามรบ)', G.battle, 90], ['tactics/props/crystal', 'คริสตัลม่วง', G.rock, 80],
  ['tactics/props/log', 'ขอนไม้', G.wild, 100], ['tactics/props/mossrock', 'หินตะไคร่', G.rock, 90], ['tactics/props/orepile', 'กองแร่', G.rock, 90],
  ['tactics/props/pine', 'ต้นสนเล็ก', G.tree, 160], ['tactics/props/stalagmite', 'หินงอก', G.rock, 90], ['tactics/props/standstone', 'หินตั้งอักขระ', G.rock, 80],
  ['tactics/props/wildflower-tuft', 'กอดอกไม้ป่า', G.wild, 60],
  ['tactics/props/b1-barricade', 'เครื่องกีดขวาง', G.battle, 130], ['tactics/props/b1-bone-pile', 'กองกระดูก', G.battle, 110], ['tactics/props/b1-broken-wall', 'กำแพงพัง', G.battle, 140],
  ['tactics/props/b1-cactus', 'กระบองเพชร', G.battle, 80], ['tactics/props/b1-fallen-tree', 'ต้นไม้ล้ม', G.battle, 160], ['tactics/props/b1-ice-block', 'ก้อนน้ำแข็ง', G.snow, 100],
  ['tactics/props/b1-ruined-pillar', 'เสาพัง', G.battle, 100], ['tactics/props/b1-tent-ruin', 'ซากเต็นท์', G.battle, 150], ['tactics/props/b1-wrecked-wagon', 'ซากเกวียน', G.battle, 160],
  ['tactics/props/large/ancient-tree', 'ต้นไม้โบราณ', G.tree, 260], ['tactics/props/large/crystal-cluster', 'กลุ่มคริสตัลใหญ่', G.rock, 180], ['tactics/props/large/fallen-trunk', 'ซุงล้ม', G.battle, 220],
  ['tactics/props/large/mine-wagon', 'เกวียนเหมือง', G.battle, 180], ['tactics/props/large/rock-outcrop', 'โขดหิน', G.rock, 200], ['tactics/props/large/ruined-wall', 'แนวกำแพงพัง', G.battle, 220],
  ['tactics/fence', 'รั้ว (สนามรบ)', G.fence, 120], ['tactics/pillar', 'เสาหิน', G.battle, 90], ['tactics/rock', 'ก้อนหิน', G.rock, 80],
  ['tactics/ruins-stone-arch-v01', 'ซุ้มหินโบราณ', G.battle, 200], ['tactics/stump', 'ตอไม้', G.wild, 80], ['tactics/tree', 'ต้นไม้ (สนามรบ)', G.tree, 200],
  // whole buildings already drawn for the village (sub-maps can place them as a backdrop)
  [V + 'forge', 'โรงตีเหล็ก', G.bld, 0, .86], [V + 'fountain', 'น้ำพุ', G.town, 0, .86], [V + 'garden-pond', 'สระในสวน', G.town, 0, .86],
  [V + 'healer', 'สถานพยาบาล', G.bld, 0, .86], [V + 'inn', 'โรงเตี๊ยม', G.bld, 0, .86], [V + 'market', 'ตลาด', G.bld, 0, .86],
  [V + 'market-equipment', 'ร้านรับซื้อ', G.bld, 0, .86], [V + 'market-materials', 'ร้านวัตถุดิบ', G.bld, 0, .86], [V + 'market-orders', 'กระดานออร์เดอร์', G.bld, 0, .86],
  [V + 'player-house', 'บ้านของเรา', G.bld, 0, .86], [V + 'shop', 'ร้านค้า', G.bld, 0, .86], [V + 'temple', 'วิหาร', G.bld, 0, .86]
];
const CROPS = { cabbage: 'กะหล่ำ', carrot: 'แครอท', herb: 'สมุนไพร', lettuce: 'ผักกาด', potato: 'มันฝรั่ง', pumpkin: 'ฟักทอง', strawberry: 'สตรอว์เบอร์รี', tomato: 'มะเขือเทศ', wheat: 'ข้าวสาลี' };
/* folders whose every picture must be in the catalogue (tools/test-placeable-art.cjs); textures / door-holes / sheets are not objects */
const FOLDERS = ['interior', 'objects', V + 'decor', V + 'props', V + 'nature', V + 'edge', 'tactics/decor', 'tactics/props', 'tactics/props/large', 'crops'];
const SKIP = /(^|\/)(tex-[^/]*|[^/]*-hole|gate-(coast|forest|frost|mine|ruins|swamp)|chimney-smoke)\.webp$/;   /* textures · door/window cut-outs · adventure gates (own kind) · smoke effect */

function build() {
  global.window = {}; delete require.cache[require.resolve('../js/interior-art.js')]; require('../js/interior-art.js'); const ART = global.window.INTERIOR_ART;
  const items = [], seen = new Set(), round = v => Math.round(v);
  const add = o => { if (seen.has(o.src)) return; seen.add(o.src); items.push(o) };
  for (const [key, [n, g]] of Object.entries(INTERIOR)) {
    const a = ART[key]; if (!a) throw new Error('interior-art has no ' + key);
    const sw = round(a.w * a.k * 1.6 / 5) * 5 || 100;   /* interior tile 68 px · sub-map/village tile 90 px · ×1.2 like the home sub-map pieces */
    add({ id: 'int/' + key, src: a.src, n, g, w: a.w, h: a.h, ay: +(a.fy / a.h).toFixed(3), tw: sw, sw, sub: 'int:' + key, town: 'pic:' + a.src });
  }
  for (const [rel, n, g, tw, ay] of OTHER) {
    const src = 'assets/' + rel + '.webp', [w, h] = dims(path.join(ROOT, src)), top = rel.startsWith(V) && !rel.slice(V.length).includes('/');
    const decor = rel.startsWith(V + 'decor/') ? rel.slice((V + 'decor/').length) : null;
    add({ id: rel, src, n, g, w, h, ay: ay || .92, tw, sw: tw || round(Math.min(470, w / 2.4) / 10) * 10, sub: decor ? 'decor:' + decor : top ? 'vt:' + rel.slice(V.length) + '.png' : 'img:' + src, town: tw ? 'pic:' + src : null });
  }
  for (const [c, n] of Object.entries(CROPS)) for (let s = 1; s <= 4; s++) {
    const src = `assets/crops/${c}-${s}.webp`, [w, h] = dims(path.join(ROOT, src)), tw = [0, 34, 44, 54, 62][s];
    add({ id: `crops/${c}-${s}`, src, n: `${n} ระยะ ${s}`, g: G.crop, w, h, ay: .9, tw, sw: tw, sub: 'img:' + src, town: 'pic:' + src });
  }
  for (const o of items) if (!fs.existsSync(path.join(ROOT, o.src))) throw new Error('missing file ' + o.src);
  const order = Object.values(G); items.sort((a, b) => order.indexOf(a.g) - order.indexOf(b.g));   /* stable: same group keeps the sheet order */
  return { groups: order, items, folders: FOLDERS, skip: SKIP.source };
}
module.exports = { build, FOLDERS, SKIP };
if (require.main === module) {
  const cat = build();
  /* id and town are derivable (src · 'pic:' + src when tw > 0) — left out to keep the file small */
  const out = '/* generated by tools/build-placeable-art.cjs — edit the names/groups/widths there, then run it again.\n'
    + '   Every picture that can be placed as a sub-asset: village editor (kind pic:<src>, width tw) and sub-map editor (art id sub, width sw).\n'
    + '   folders = where a new picture is picked up automatically even before it gets a name here. */\n'
    + 'window.PLACEABLE_ART=' + JSON.stringify({ groups: cat.groups, folders: cat.folders, items: cat.items.map(({ id, town, ...o }) => o) }) + ';\n';
  fs.writeFileSync(path.join(ROOT, 'js/placeable-art.js'), out);
  console.log('js/placeable-art.js · ' + cat.items.length + ' pictures in ' + cat.groups.length + ' groups');
}

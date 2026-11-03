# พรอมต์ภาพรวม 5 คน ยืนเรียงกัน · เพื่อนที่ชวนร่วมทีมได้ (ชุดที่ 2)

ภาพรวมชุดแรก (ตัวเอกชาย ตัวเอกหญิง บรัม ลูน่า เคียร์) เป็นภาพอ้างอิง · ชุดนี้คือ **5 คนที่ชวนร่วมทีมได้อยู่แล้วในเกม แต่ยังไม่มีภาพจริง** (ตอนนี้ถูกวาดด้วยโค้ด · ดู `js/village-life.js`) และมีสกิลในสนามอยู่แล้ว (`js/flat-battle.js` `ALLY_SKILL`)

**เวลาสร้าง ให้แนบภาพอ้างอิงชุดแรกไปด้วย** (ภาพยืนเรียง 5 คนพื้นขาว) แล้ววางพรอมต์ด้านล่างครั้งเดียว

## ใคร และทำไมเลือกกลุ่มนี้
| ตำแหน่ง | ตัวละคร | อายุ | บทบาท | สีเด่น | ความสูง |
|---|---|---|---|---|---|
| 1 ซ้ายสุด | **เรน** | 17 | นักธนูหนุ่ม (ลูกพรานที่พ่อตายเพราะหมาป่าเงา) | เขียวป่า | เตี้ยกว่าปกติ |
| 2 | **นาเดีย** | 22 | นักย่องเบา (ดีไซน์ตาม `docs/PROMPTS-COMPANIONS-NADIA-ASH.md`) | แดงเข้ม ม่วง | เล็กกระชับ |
| 3 กลาง | **ซิกริด** | 34 | ทหารรับจ้างขวาน จากเหนือที่หิมะไม่ละลาย | แดงเข้ม ขาวขนสัตว์ | **สูงและใหญ่สุด** |
| 4 | **ออร์ลา** | 29 | นักบวชวิหารธาตุดิน (ผู้รักษา) | ครีม เขียวมอส | สูงเรียว |
| 5 ขวาสุด | **โอลเวน** | 71 | จอมเวทเกษียณขี้เมา | ม่วงเข้ม ส้มรอยไหม้ | **เตี้ยสุด** หลังค่อมเล็กน้อย |

เรียงให้กลางภาพเป็นตัวใหญ่สุด เหมือนภาพอ้างอิง (บรัมอยู่กลาง) และสีข้างกันไม่ซ้ำกัน · **แอช** (นักล่าค่าหัว) ไม่อยู่ชุดนี้เพราะยังชวนร่วมทีมไม่ได้ · พรอมต์แอชอยู่ในไฟล์นาเดีย+แอช สลับแทนใครก็ได้

> หมายเหตุข้อมูลเกม: `look` ของซิกริดใน `js/village-life.js` มี `beard` (เครา) แต่เรื่องเขียนถึงเธอว่า "เธอ" · ดีไซน์ที่นี่ให้เป็นผู้หญิงตามเนื้อเรื่อง · เมื่อใส่ภาพจริงควรเอา `beard` ออกจาก look ของเธอ

## พรอมต์หลัก (วางครั้งเดียว · แนบภาพอ้างอิงชุดแรก)
```
Character design lineup sheet: FIVE new characters standing side by side in a row, for a cozy fantasy tactics RPG. Use the attached image as the exact STYLE REFERENCE: copy its art style, rendering, proportions, line quality, palette feel, lighting, pose style and framing as closely as possible, but draw five completely NEW characters (do not reuse any of the five characters from the reference image).

STYLE (match the reference exactly): semi-chibi anime proportions about 3.5 heads tall, large expressive eyes, chunky hands, big sturdy buckled leather boots; clean dark-brown outlines, cel-shaded with painterly texture and subtle pixel-art-like detail; weathered, worn, slightly tattered adventurer clothing with stitched leather, brass buckles, belts, pouches, fingerless gloves and ornate pale-gold rune trim on fabric edges; warm earthy palette (browns, olive, cream, rust) where each character has one distinct accent color; soft warm light from the upper left.

LAYOUT: one wide image (3:2). All five characters full-body, standing in a neat row with their feet on the same baseline, evenly spaced and NOT overlapping, none cropped. Plain pure white background, no ground, no floor shadows, no text, no names, no labels, no frames. The same three-quarter front view for all of them (the same angle as the reference characters), relaxed standing pose with arms down and weight on one foot. Both hands of every character are EMPTY: no weapons, no bows, no mugs, no staffs (weapons are added later by the game). Heights vary as described. Each character must have a clearly different silhouette, hair and color so they can be told apart at a glance.

CHARACTERS from left to right:

1. REN: a 17-year-old boy archer, the youngest, slim and a little shorter than the others. Messy dark-brown hair, a forest-green hood pushed back, an eager hot-headed grin and bright determined eyes. Green hunter's jacket with leather chest straps, a quiver of eagle-feather arrows on his back, a leather arm guard on his left forearm, fingerless gloves, brown trousers and buckled boots. Accent color: forest green.

2. NADIA: a 22-year-old woman rogue, slim and agile, shorter than average. Jet-black hair in a high ponytail with a few loose bangs, a crimson bandana across her forehead, a sly smirk and sharp violet-amber eyes. Fitted charcoal short jacket with a high collar and small silver buckles, a short dark-violet half-cape over her left shoulder, fingerless dark gloves, a wide belt with small pouches, dark leggings, soft knee-high boots, and a small silver ring on a thin chain around her neck. Accent colors: crimson and violet.

3. SIGRID: a 34-year-old woman mercenary from the snowy north, the TALLEST and broadest of the group, muscular and calm, with a stoic expression and a faint scar across one cheek. Long pale ash-blond hair in a thick braid over one shoulder, a snow-wolf fur mantle across her shoulders over a brown leather brigandine, a deep-red sash and cape, steel bracers, a heavy belt, worn boots with fur trim. Accent colors: deep red and fur white.

4. ORLA: a 29-year-old woman priestess of the earth temple, tall and slender, with a gentle serene smile. Long chestnut-brown hair loose under a sand-colored hood pushed back, a small wildflower tucked behind her ear. A long cream-and-sand robe with earthy green and brown rune trim, a small round green-brown earth pendant, a soft leather belt with a small herb pouch, brown wraps on her wrists, simple sturdy boots. Accent colors: cream and moss green.

5. OLWEN: a 71-year-old retired mage, the SHORTEST, slightly hunched, jolly and a little tipsy with rosy cheeks and one sparkling mischievous eye. Wild white hair and a long white beard, a floppy pointed dark-purple hat, a dark-purple robe whose hem and sleeves are singed and scorched, a leather satchel and a corked wine flask on his belt, fingerless gloves, patched boots. Accent colors: deep purple and ember-orange scorch marks.

Do not add text, names, extra characters, weapons, or a background scene.
```

## ถ้าตัวใดตัวหนึ่งไม่ผ่าน (สร้างซ้ำเฉพาะคน)
สร้างใหม่ด้วยพรอมต์หลักเดิม แล้วต่อท้ายว่า `Keep characters 1, 2, 4 and 5 exactly as in the previous image; only redraw character N: <สิ่งที่ต้องแก้>.` (แนบภาพรวมที่เพิ่งสร้างด้วย)

## ขั้นต่อไปหลังภาพรวมผ่าน
1. อนุมัติภาพรวม → ใช้เป็นภาพอ้างอิงสร้าง **ท่ายืน 4 ทิศรายคน** (พื้นเขียว #00FF00 · 384×384) ด้วยพรอมต์ต่อทิศใน `docs/PROMPTS-COMPANIONS-NADIA-ASH.md` (เปลี่ยนคำบรรยายตัวละครเป็นของคนนั้น)
2. ท่าเดิน SE/NE → ตัดด้วย `tools/slice-walk-sheet.py` · ท่ายืนตัดด้วย `tools/slice-hero-sheet.py`
3. ใส่เข้าเกมตามรายการแก้โค้ดในไฟล์นาเดีย+แอช (ใช้กับทุกคนในชุดนี้ · ธาตุที่เสนอ: เรนลม/พฤกษา · ซิกริดน้ำแข็ง · ออร์ลาผืนดิน · โอลเวนไฟ)

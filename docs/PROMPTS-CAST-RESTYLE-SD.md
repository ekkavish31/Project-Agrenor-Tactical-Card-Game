# พรอมต์ปรับ "หัวและตัว" ทั้งทีมให้เป็นกึ่ง SD เท่ากันหมด (restyle ภาพเดิม)

เป้าหมาย: ตัวเอก + บรัม + ลูน่า + เคียร์ + มิล + เรน + นาเดีย + ซิกริด + ออร์ลา + โอลเวน **ใช้สัดส่วนหัว:ตัวชุดเดียวกัน** เพื่อให้สเกลในเกมตรงกัน (ตอนนี้บรัม/ซิกริด/ออร์ลาเกือบสมจริง หัวเล็ก ตัวเอกกับเคียร์หัวกลาง มิลเป็น SD สุดๆ)
อ้างอิงสไตล์ = ภาพเดินตัวเอก (พื้นเขียว ชาย/หญิง) · ใช้ร่วมกับ `docs/PROMPTS-HERO-IDLE-SD.md` (ตัวเอก)

## วิธีใช้ (ทำทีละตัว ทีละทิศ)
แนบ **2 ภาพ** ทุกครั้ง:
1. **ภาพเดิมของตัวละครนั้น** (ท่ายืนทิศนั้น) = ตัวบอก หน้าตา ผม สี ชุด ท่าทาง ทิศ
2. **ภาพสไตล์อ้างอิง SD** (ภาพเดินตัวเอก) = ตัวบอก สัดส่วนหัว/ตัว เส้น การลงสี
แล้ววาง **พรอมต์หลัก** + **บล็อกตัวละคร** ของคนนั้น + ข้อความทิศ (ถ้าต้องการ) · ทำทิศ SW ก่อนแล้วใช้เป็นอ้างอิงต่อทิศอื่น
เพื่อนใหม่ 5 คนมีแค่ SW/NE → ใช้ปุ่ม **ลอกกลับด้าน** ใน Studio สร้าง SE/NW จากภาพที่ได้ได้เลย ไม่ต้องสร้างเพิ่ม

## สัดส่วนมาตรฐาน (ทุกคนเหมือนกัน · ตัวเลขนี้คือหัวใจ)
| ส่วน | ค่า |
|---|---|
| ความสูงทั้งตัว | **2.7 – 3 หัว** |
| หัว (กรอบผมรวม) | สูง ≈ **37–40%** ของความสูงตัว · **กว้างกว่าไหล่ชัดเจน** (หัวกว้าง ≈ 1.3× ไหล่) |
| คอ | สั้นมาก แทบไม่เห็น |
| ลำตัว | สั้น ≈ 28% ของความสูง |
| ขา | สั้นอวบ ≈ 30% · บูตใหญ่เทอะทะ |
| มือ | ใหญ่ ใส่ถุงมือ/พันผ้า |
| ตา | โต ชัด ไฮไลต์เด่น |
- **ความต่างระหว่างตัวละครแสดงด้วย "มวลตัว" ไม่ใช่สัดส่วนหัว:** บรัม/ซิกริด = ไหล่กว้าง แขนขาหนา · ออร์ลา = เรียว · นาเดีย/เรน = เล็กกระชับ · โอลเวน = หลังค่อมเล็กน้อย — แต่หัวยังโตเท่ากันหมด
- **ภาพทุกภาพวาดให้เต็มผืน 384×384 เท่ากัน** (เท้า y ≈ 376, หัวสูงสุด ≈ y 95) แล้วค่อยกำหนดความสูงต่างกันตามบทบาทที่ ⚖ Scale Lineup (บรัม/ซิกริด ≈ 110% ของตัวเอก · ออร์ลา ≈ 105% · เคียร์ 100% · ลูน่า ≈ 96% · เรน ≈ 94% · นาเดีย ≈ 92% · มิล ≈ 88% · โอลเวน ≈ 82% — ปรับตามชอบ)
- พื้นหลังเขียว #00FF00 · มือว่าง ไม่ถือของ · ไม่มีเงาพื้น/ตัวหนังสือ/กรอบ · แสงอุ่นจากบนซ้าย

## พรอมต์หลัก (วางก่อนบล็อกตัวละคร)
```
Restyle the attached CHARACTER image into a semi-chibi / super-deformed game sprite. Image 1 is the character to keep: preserve this character's identity EXACTLY — the same face and expression, hair style and color, skin tone, eye color, outfit design and colors, accessories, markings, and the same facing direction and standing pose. Image 2 is the STYLE and PROPORTION reference: copy its super-deformed proportions, outline weight, cel-shaded painterly rendering with subtle pixel-art-like detail, and warm golden light from the upper left.
CHANGE ONLY THE PROPORTIONS to this standard: total height about 2.7 to 3 heads tall; the head is very large — about 38% of the full body height and clearly WIDER than the shoulders (head width about 1.3x shoulder width); very short neck; short compact torso; short sturdy legs; chunky oversized boots; big hands. Enlarge the head and eyes and shrink the torso and legs accordingly, keeping the same costume details just simplified to read at this size. Show the same standing pose, relaxed, both hands EMPTY (no weapon, no shield, no staff, no held item). Isometric camera, slightly looking down (about 30 degrees), three-quarter view in exactly the same direction as image 1.
Output: one character only, full body, nothing cropped, feet at the bottom center of a square canvas, pure flat bright green background (#00FF00), no ground, no cast shadow, no text, no frame.
```

## บล็อกตัวละคร (ต่อท้ายพรอมต์หลัก · บอกว่าอะไร "ห้ามเปลี่ยน" และมวลตัว)

**บรัม (BRAM)** — นักรบหนุ่มกำยำ
```
Character: BRAM, a stocky young warrior. Keep: short dark messy hair, strong jaw and determined face, sturdy brown leather armor with straps, metal bracers, dark trousers, heavy boots. Body mass: the BROADEST and most muscular of the cast — very wide shoulders, thick arms and legs — but still the same big-head chibi proportions (head about 38% of height).
```
**ลูน่า (LUNA)** — จอมเวทหญิงสาว
```
Character: LUNA, a young female mage. Keep: long violet-lavender hair, violet hood, blue-purple robe with coat details, pouches and belts, fingerless gloves, gentle intelligent face. Body mass: slim and light, narrow shoulders — same big-head chibi proportions.
```
**เคียร์ (KIER)** — ดาบหนุ่มเรียว
```
Character: KIER, a lean young swordsman. Keep: dark brown spiky hair with the teal/green headband, confident smirk, purple-violet short cape/jacket with brown cross straps and belt, dark trousers, boots (the sword is NOT drawn). Body mass: lean, medium shoulders — same big-head chibi proportions.
```
**มิล (MIL)** — ดาบจูเนียร์ตัวเล็ก (อยู่ในสไตล์ SD อยู่แล้ว: ใช้พรอมต์นี้เพื่อให้ **หัวไม่โตเกินตัวอื่น**)
```
Character: MIL, a small cheerful junior swordsman. Keep: spiky orange hair, big yellow scarf, green vest over a white shirt, brown straps, bracers, dark brown trousers, boots. IMPORTANT: draw the head at the SAME standard ratio as everyone else (about 38% of body height, not larger), so Mil matches the rest of the cast; Mil stays the smallest and youngest through a slimmer, smaller body only.
```
**เรน (REN)** — นักธนูหนุ่ม 17
```
Character: REN, a 17-year-old archer. Keep: messy dark-brown hair, forest-green hood pushed back, eager grin, green hunter's jacket with leather chest straps, arm guard, fingerless gloves, brown trousers, buckled boots (quiver of arrows on the back is OK, the bow is NOT drawn). Body mass: slim and a bit shorter.
```
**นาเดีย (NADIA)** — นักย่องเบา 22
```
Character: NADIA, a 22-year-old rogue. Keep: jet-black high ponytail with loose bangs, crimson bandana, sly smirk, fitted charcoal short jacket with silver buckles, short dark-violet half-cape on the left shoulder, fingerless dark gloves, wide belt with pouches, dark boots. Body mass: small, agile and compact.
```
**ซิกริด (SIGRID)** — ทหารรับจ้างขวาน จากเหนือ 34
```
Character: SIGRID, a 34-year-old mercenary from the snowy north. Keep: long pale ash-blond braid over one shoulder, calm stoic face with a faint cheek scar, snow-wolf fur mantle over a brown leather brigandine, deep-red sash and cape, steel bracers, heavy belt, fur-trimmed boots (the axe is NOT drawn). Body mass: broad and strong, wide shoulders, thick limbs — same big-head chibi proportions.
```
**ออร์ลา (ORLA)** — นักบวชธาตุดิน 29
```
Character: ORLA, a 29-year-old priestess of the earth temple. Keep: long chestnut-brown hair under a sand-colored hood pushed back, small wildflower behind the ear, serene gentle smile, long cream-and-sand robe with earthy green and brown rune trim, round green-brown earth pendant, soft belt with a herb pouch, brown wrist wraps, simple sandals/boots. Body mass: slender, narrow shoulders — same big-head chibi proportions.
```
**โอลเวน (OLWEN)** — จอมเวทเกษียณขี้เมา 71
```
Character: OLWEN, a 71-year-old retired mage. Keep: wild white hair and long white beard, floppy pointed dark-purple hat, rosy cheeks and one mischievous sparkling eye, dark-purple robe with singed scorched hem and sleeves, leather satchel and corked wine flask on the belt, fingerless gloves, patched boots (the staff is NOT drawn). Body mass: the SHORTEST and slightly hunched — same big-head chibi proportions (the beard may hide part of the torso).
```

## ต่อท้ายตามทิศ (ถ้าภาพเดิมไม่ได้ชัดเรื่องทิศ ใส่ต่อท้าย)
- **SW**: `Facing lower-left (toward the camera): three-quarter FRONT view, right shoulder nearest the camera.`
- **SE**: `Facing lower-right: three-quarter FRONT view, mirror of the SW sprite, left shoulder nearest the camera. Same character, outfit and head size as the attached SW result.`
- **NW**: `Facing upper-left (away from the camera): three-quarter BACK view showing the back of the big head and hair, the cloak/cape/backpack. Same character, outfit and head size as the attached SW result.`
- **NE**: `Facing upper-right (away from the camera): three-quarter BACK view, mirror of the NW sprite. Same character, outfit and head size as the attached SW result.`

## ข้อห้าม (Negative prompt)
```
realistic proportions, tall slim body, 3.5 heads tall or more, small head, head narrower than shoulders, long legs, long neck, different face, different hairstyle, different outfit colors, eye-level camera, side profile, straight front or straight back view, top-down view, sword, weapon, shield, staff, bow, held item, walking pose, dark gloomy mood, muddy colors, realistic 3D render, photo, extra limbs, extra fingers, text, logo, watermark, frame, ground, cast shadow, gradient background, multiple characters, cropped feet, cropped head
```

## ตรวจก่อนส่งมา (ผ่าน/ไม่ผ่าน)
- หัวสูง ≈ 38% ของตัว และกว้างกว่าไหล่ · ถ้าได้ภาพที่หัวเล็กกว่าตัวเอกใหม่ ให้สร้างใหม่ (เอาตัวเอกใหม่วางเทียบข้างๆ)
- หน้า ผม สี ชุด เหมือนภาพเดิมของคนนั้น · มือว่าง · เท้าอยู่ล่างกลาง
- พอได้ครบทั้งทีม ส่งมาได้ ผมใส่เป็นท่ายืนทุกคน แล้วจูนสเกลรวมที่ ⚖ Scale Lineup ให้ทีละขั้น

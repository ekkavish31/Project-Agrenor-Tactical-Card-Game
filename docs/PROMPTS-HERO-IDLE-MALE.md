# พรอมต์ท่ายืน ตัวเอกชาย (ตัวหลัก) · 4 ทิศ ตามองศากล้องของเกม

อ้างอิงหน้าตาจากตัวเอกปัจจุบัน (`assets/tactics/imported/idle-sw-mvvj7g9i-q3jb/frame-01.webp`) · สไตล์ตาม `docs/STYLE-GUIDE.md`
แนบภาพอ้างอิงไปกับทุกคำขอ: ตัวเอกปัจจุบัน (ท่ายืน SW) + `assets/adventurer-sword-idle.webp`

## กติกากล้อง (ต้องตรงกับเกม)
- เกมเป็นไอโซเมตริก 2:1 → กล้องมองลงมาประมาณ **30° จากแนวระนาบ** (พื้นสี่เหลี่ยมถูกบีบเหลือครึ่งหนึ่งของความสูง) เห็นหัวและไหล่จากด้านบนเล็กน้อย ไม่ใช่มุมระดับสายตา ไม่ใช่มุมมองจากบนตรง ๆ
- ตัวละครหันหน้าไปตาม **เส้นทแยงของจอ** เท่านั้น 4 ทิศ (ไม่ใช่ตรงหน้า/ตรงหลัง/ตรงข้าง):
  | ทิศ | หันหน้าไปทาง | เห็นอะไร |
  |---|---|---|
  | **SW** | ล่างซ้าย (เข้าหากล้อง ซ้าย) | หน้า 3/4 ด้านซ้ายของจอ · ไหล่ขวาของตัวละครใกล้กล้อง |
  | **SE** | ล่างขวา (เข้าหากล้อง ขวา) | หน้า 3/4 ด้านขวาของจอ · ไหล่ซ้ายใกล้กล้อง |
  | **NW** | บนซ้าย (หันหลังให้กล้อง ซ้าย) | เห็นหลัง 3/4 · เห็นกระเป๋าเป้และผ้าคลุมชัด |
  | **NE** | บนขวา (หันหลังให้กล้อง ขวา) | เห็นหลัง 3/4 อีกด้าน |
- ใช้ **ภาพ SW ที่อนุมัติแล้วเป็นภาพอ้างอิง** สร้าง SE/NW/NE ต่อ (หน้าตา ชุด สัดส่วนต้องเหมือนกันทุกทิศ)

## ข้อกำหนดภาพ (ผ่าน/ไม่ผ่าน)
- ผืนภาพ **384×384** · พื้นหลังเขียวล้วน **#00FF00** (Asset Studio ลบให้) · ไม่มีเงาบนพื้น ไม่มีตัวหนังสือ/กรอบ/ลายน้ำ
- ตัวละครเต็มตัว ไม่ถูกตัด · **เท้าอยู่กึ่งกลางล่าง ที่ประมาณ y = 376** · หัวสูงสุดที่ประมาณ y = 86 (ความสูงตัว ≈ 291 px)
- **ความกว้างหัว ≈ 112 px** (มาตรฐานสเกลตัวเอกใน `js/character-scale.js`) — เกมเทียบสเกลจากหัว ตัวอื่นปรับตามตัวเอก
- **มือว่างทั้งสองข้าง ไม่ถือของ ไม่มีดาบ/โล่** (เกมวาดอาวุธติดให้เอง) · ห้ามมีดาบสะพายหลังหรือคาดเอวชิ้นใหญ่ที่บังท่า
- แสงอุ่นสีอำพันจากบนซ้าย · เงาใต้ตัวนุ่มฝั่งล่างขวา (ในตัวละคร ไม่ใช่เงาพื้น) · ลายเส้นสะอาด cel-shaded

## พรอมต์หลัก (วางครั้งเดียว ใช้กับทุกทิศ)
```
Full-body character sprite of the young male main hero of a cozy fantasy tactics RPG, semi-chibi anime proportions (about 3.5 heads tall), clean line art, cel-shaded with soft warm amber lighting from the upper left, painterly game-sprite quality. He is an adventurer in his late teens: messy short dark-brown spiky hair that falls over his eyes, a dark-brown hooded scarf-cloak wrapped around his neck and shoulders with a long tattered tail at the back bearing a small pale triangular rune mark, a worn brown leather chest harness with straps and pouches, tan under-shirt with rolled sleeves, brown leather bracers and fingerless gloves, dark trousers, brown leather knee wraps and sturdy brown boots, and a rolled bedroll on a small leather backpack. Muted earthy palette (browns, olive-grey, tan) — no neon colors. Pose: relaxed standing idle, weight slightly on one leg, shoulders loose, both arms hanging naturally at his sides, both HANDS EMPTY (no sword, no shield, no weapon anywhere). Isometric 2:1 game camera: viewed from about 30 degrees above the horizon, slightly from above. Single character, centered, feet at the bottom center of the frame, whole body visible with a small margin. Solid pure green #00FF00 background, no ground, no cast shadow, no text, no frame, no watermark. 384x384.
```

## ต่อท้ายตามทิศ (ใส่หลังพรอมต์หลัก)

**SW — ล่างซ้าย (สร้างก่อน ใช้เป็นต้นแบบ)**
```
Facing the lower-left of the screen (toward the camera, to the left): a three-quarter FRONT view. His face is visible turned toward lower-left, his right shoulder nearest the camera, the cloak tail and backpack visible behind his right side.
```

**SE — ล่างขวา**
```
Facing the lower-right of the screen (toward the camera, to the right): a three-quarter FRONT view, the mirror direction of the SW sprite. His face is visible turned toward lower-right, his left shoulder nearest the camera. Keep the exact same character, outfit and proportions as the attached SW reference; the backpack and cloak tail stay on his back (now visible behind his left side).
```

**NW — บนซ้าย (หันหลัง)**
```
Facing the upper-left of the screen (away from the camera, to the left): a three-quarter BACK view. We see the back of his head and messy hair, the hooded scarf-cloak, the full tattered cloak tail with the pale triangular rune mark, and the leather backpack with the rolled bedroll centered on his back. Only a sliver of his left cheek may show. Same character, outfit and proportions as the attached SW reference.
```

**NE — บนขวา (หันหลัง)**
```
Facing the upper-right of the screen (away from the camera, to the right): a three-quarter BACK view, the mirror direction of the NW sprite. We see the back of his head and hair, the cloak, the cloak tail with the pale rune mark and the backpack. Same character, outfit and proportions as the attached SW reference.
```

## ข้อห้าม (Negative prompt / เพิ่มถ้าเครื่องมือรองรับ)
```
sword, weapon, shield, staff, bow, holding item, front-facing straight on, side profile, top-down view, eye-level camera, perspective distortion, realistic 3D render, photo, extra limbs, extra fingers, text, logo, watermark, frame, ground, cast shadow, gradient background, neon colors, multiple characters, cropped feet, cropped head
```

## ขั้นตอนที่แนะนำ
1. สร้าง **SW** 4–6 ภาพ เลือกที่หน้าตาถูกใจและเท้า/หัวอยู่ใกล้ตำแหน่งข้างบนที่สุด
2. แนบ SW ที่เลือกเป็นภาพอ้างอิง สร้าง **NW** (หันหลัง) → **SE** → **NE**
3. นำเข้า Asset Studio (ลบพื้นเขียวอัตโนมัติ) แล้วเปิด `scale-lineup.html` เทียบความสูง/ความกว้างหัวกับตัวเอกเดิม (ต้องได้ ≈ 1.70 ม. และหัว ≈ 112 px)
4. ถ้า SE/NE ได้จากการพลิกภาพ SW/NW (mirror) ได้ — แต่กระเป๋าเป้กับผ้าคลุมจะย้ายข้าง ถ้าต้องการให้เหมือนเดิมทุกทิศ ให้เจนแยก
5. ท่ายืนอยากได้หลายเฟรม (หายใจเข้า-ออก) ให้เจนซ้ำด้วยพรอมต์เดียวกัน เปลี่ยนเฉพาะ: `chest and shoulders slightly raised (inhale)` / `slightly lowered (exhale)` โดยตำแหน่งเท้าห้ามขยับ

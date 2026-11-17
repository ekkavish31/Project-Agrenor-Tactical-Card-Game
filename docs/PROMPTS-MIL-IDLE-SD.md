# พรอมต์ท่ายืน มิล (Mil) · 4 ทิศ · กึ่ง SD สัดส่วนเดียวกับทั้งทีม

มิล = **นักดาบรุ่นน้อง อายุ 19 ร่าเริง** (`js/village-life.js`: ผมส้มทอง `#c9862e`, ชุดน้ำตาล `#8a6a3a`, ถือดาบ — แต่ในภาพ **ไม่วาดดาบ** เกมติดให้เอง) · ตอนนี้มีภาพเก่าแค่ **SE และ NE** (SW / NW เป็นช่องว่าง) และภาพเก่าเป็น SD สุดโต่ง หัวใหญ่กว่าคนอื่น → ชุดนี้ทำให้ **ครบ 4 ทิศ ในสัดส่วนมาตรฐานทีม**
แนบ **2 ภาพ** ทุกครั้ง: (1) **ภาพมิลเดิม** `assets/tactics/mil_se_idle.webp` (บอกหน้า ผม ผ้าพันคอ ชุด) (2) **ภาพสไตล์อ้างอิง SD** = ภาพเดินตัวเอก (พื้นเขียว ชาย/หญิง)

## สัดส่วน (ต้องเท่าคนอื่นในทีม · ตรวจที่ ⚖ Scale Lineup → 📐 สัดส่วน)
- สูง **2.7–3 หัว** · หัวสูง ≈ **38%** ของความสูงตัว (ภาพเก่าของมิลหัวโตเกินนี้ → **ลดหัวลงให้เท่ามาตรฐาน**) · หัวกว้างกว่าไหล่ชัดเจน
- คอสั้น ลำตัวสั้น ขาสั้นอวบ บูตใหญ่ มือใหญ่ (ถุงมือ/ผ้าพัน)
- **มิลเป็นคนตัวเล็กสุดของนักรบ** — แสดงด้วย **ตัวบางเล็กกว่า** ไม่ใช่หัวโตกว่า · ในเกมความสูงอยู่ที่ ≈ 88% ของตัวเอกตั้งที่ ⚖ Scale Lineup (วาดเต็มผืนเหมือนทุกคน)

## กติกาภาพ
- **384×384** · พื้นเขียวล้วน **#00FF00** · เต็มตัว ไม่ถูกตัด · **เท้ากึ่งกลางล่าง (y ≈ 376)** · หัวสูงสุด ≈ y 95
- **มือว่างทั้งสองข้าง ไม่ถือดาบ/โล่** · ไม่มีเงาพื้น/ตัวหนังสือ/กรอบ · แสงอุ่นจากบนซ้าย · เส้นสะอาด cel-shaded
- กล้องไอโซเมตริก มองลงเล็กน้อย (~30°) · หัน 4 ทิศตามเส้นทแยง

## พรอมต์หลัก (วางครั้งเดียว ใช้กับทุกทิศ)
```
Full-body standing character sprite of MIL, the cheerful 19-year-old junior swordsman of a cozy fantasy tactics RPG. Image 1 is the existing Mil: keep his identity EXACTLY — messy spiky golden-orange hair, bright cheerful grin with big bright eyes, the big loose yellow scarf, the green vest over a white shirt with rolled sleeves, brown leather cross straps and a belt with pouches, leather bracers, dark-brown trousers and sturdy boots. Image 2 is the STYLE and PROPORTION reference: draw him in the same semi-chibi / super-deformed proportions as the reference sheet — only about 2.7 to 3 heads tall, the head about 38% of the total body height (NOT larger — the old Mil picture has an oversized head, shrink it to this standard) and clearly wider than the shoulders, big expressive eyes, very short neck, short compact torso, short sturdy legs, chunky buckled boots, big hands in fingerless gloves. He is the smallest and slimmest fighter of the cast: show that with a slimmer little body, not with a bigger head. Clean dark outlines, cel-shaded with painterly texture and subtle pixel-art-like detail, soft warm golden light from the upper left. Relaxed neutral STANDING pose, weight slightly on one leg, both arms hanging naturally with EMPTY hands — no sword, no shield, no weapon, no held item (a sheath strap on the belt is fine). Isometric camera slightly looking down (about 30 degrees). Pure flat bright green background (#00FF00), no ground, no cast shadow, no text, no frame, one character only, full body, nothing cropped, feet at the bottom center of a square canvas.
```

## ต่อท้ายตามทิศ
**SW — ล่างซ้าย (ทำก่อน ใช้เป็นต้นแบบ · ตอนนี้ยังไม่มี)**
```
Facing the lower-left of the screen (toward the camera, to the left): a three-quarter FRONT view. His face is visible turned toward lower-left, his right shoulder nearest the camera, the scarf tails hanging at his front/left.
```
**SE — ล่างขวา** (มีภาพเก่าอยู่ ใช้สร้างใหม่ให้สัดส่วนตรง)
```
Facing the lower-right of the screen (toward the camera, to the right): a three-quarter FRONT view, the mirror direction of the SW sprite. His face is visible turned toward lower-right, his left shoulder nearest the camera. Keep the exact same character, outfit, head size and proportions as the attached SW reference.
```
**NW — บนซ้าย (หันหลัง · ตอนนี้ยังไม่มี)**
```
Facing the upper-left of the screen (away from the camera, to the left): a three-quarter BACK view. We see the back of the big head with the spiky golden-orange hair, the yellow scarf wrapped around the neck with its tails hanging down the back, the green vest and the leather straps from behind. Same character, outfit, head size and proportions as the attached SW reference.
```
**NE — บนขวา (หันหลัง)** (มีภาพเก่า ใช้สร้างใหม่ให้สัดส่วนตรง)
```
Facing the upper-right of the screen (away from the camera, to the right): a three-quarter BACK view, the mirror direction of the NW sprite. We see the back of the big head and hair, the scarf tails and the vest from behind. Same character, outfit, head size and proportions as the attached SW reference.
```

## ข้อห้าม (Negative prompt)
```
realistic proportions, tall slim body, 3.5 heads tall or more, oversized head larger than 40% of the body, head much bigger than the other characters, small head, long legs, long neck, different face, different hair color, different scarf color, eye-level camera, side profile, straight front or straight back view, top-down view, sword, weapon, shield, staff, bow, held item, walking pose, dark gloomy mood, muddy colors, realistic 3D render, photo, extra limbs, extra fingers, text, logo, watermark, frame, ground, cast shadow, gradient background, multiple characters, cropped feet, cropped head
```

## ขั้นตอน
1. สร้าง **SW** 4–6 ภาพ เลือกที่หัวได้ ≈ 38% และหน้าเหมือนมิลเดิมที่สุด → แนบเป็นอ้างอิงสร้าง **NW → SE → NE**
2. ส่งมา: ผมใส่เป็นท่ายืนของมิลทั้ง 4 ทิศ (หรือทำแค่ SW + NE แล้วใช้ปุ่ม **ลอกกลับด้าน** สร้าง SE/NW ก็ได้) แล้ววัดที่ 📐 สัดส่วน ว่าเข้าเกณฑ์ทีม
3. ท่าอื่น (เดิน โจมตี ป้องกัน ล้ม) ภาพเก่าของมิลยังเป็นสัดส่วนเดิม — ถ้าอยากเปลี่ยนด้วย แจ้งได้ จะทำพรอมต์ต่อ

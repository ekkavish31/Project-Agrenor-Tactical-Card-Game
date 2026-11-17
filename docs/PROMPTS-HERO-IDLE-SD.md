# พรอมต์ท่ายืน ตัวเอกชาย + หญิง · สไตล์กึ่ง SD (หัวใหญ่) ตามภาพเดินอ้างอิง

ชุดนี้แทน `docs/PROMPTS-HERO-IDLE-MALE.md` เมื่อภาพยืนเดิม **หัวเล็กเกินไป** · ใช้ **ภาพท่าเดิน 4 ทิศ (ชาย/หญิง พื้นเขียว)** เป็นภาพอ้างอิงสไตล์ — ตัวใหญ่หัวโต ตาโต มือเท้าอวบ ผ้าคลุมเขียว เป้ + ผ้าห่มแดงม้วน แต่งานนี้ให้ **ยืนเฉยๆ** ไม่ใช่เดิน
**แนบภาพเดินอ้างอิงไปกับทุกคำขอ** (แถวบน = ชาย, แถวล่าง = หญิง)

## สัดส่วนที่ต้องได้ (สำคัญสุด)
- สูงประมาณ **2.7 – 3 หัว** (ในภาพเดินอ้างอิงหัวสูง ≈ 37–40% ของความสูงทั้งตัว) · **ห้ามสัดส่วน 3.5–4 หัวหรือสมจริง**
- หัวกว้างกว่าไหล่ชัดเจน · ศีรษะใหญ่ ผมฟู ปริมาตรเยอะ · คอสั้น · ลำตัวสั้น · ขาสั้นอวบ · รองเท้าบูตใหญ่เทอะทะ · มือใหญ่ใส่ถุงมือครึ่งนิ้ว
- ขนาดในเกม: เกมเทียบสเกลจาก "ความกว้างหัว ≈ 112 px" เมื่อหัวโตขึ้น ตัวทั้งตัวจะเตี้ยลงโดยอัตโนมัติ (ความสูงตัว ≈ 290 → ราว 260 px) — ปรับสเกลที่แท็บ ⚖ Scale Lineup ไม่ต้องแก้ในพรอมต์

## กติกากล้อง / ผืนภาพ (เหมือนเดิม)
- ไอโซเมตริก 2:1 มองลงเล็กน้อย (~30°) · หันตามเส้นทแยง 4 ทิศ: **SW** (หน้า ล่างซ้าย) · **SE** (หน้า ล่างขวา) · **NW** (หลัง บนซ้าย) · **NE** (หลัง บนขวา)
- **384×384 · พื้นหลังเขียวล้วน #00FF00** · เต็มตัวไม่ถูกตัด · เท้ากึ่งกลางล่าง (y ≈ 376) · ไม่มีเงาพื้น/ตัวหนังสือ/กรอบ
- **มือว่างทั้งสองข้าง ไม่ถือของ ไม่มีดาบ/โล่** (เกมวาดอาวุธให้เอง) · เป้และผ้าห่มแดงม้วนที่หลังเหมือนภาพอ้างอิงได้ (ไม่บังท่า)

## พรอมต์หลัก · ตัวเอกชาย (วางครั้งเดียว ใช้กับทุกทิศ)
```
Full-body standing character sprite of the young male main hero of a cozy fantasy tactics RPG. Use the attached walking sheet as the exact STYLE and PROPORTION reference: SUPER-DEFORMED / chibi proportions, only about 2.7 to 3 heads tall — the head is very large (about 38% of the total body height), clearly wider than the shoulders, with big expressive eyes, voluminous messy chestnut-brown hair, a short neck, a short compact torso, short sturdy legs, chunky oversized buckled brown leather boots with cream fur trim, and big hands in fingerless gloves. Clean dark outlines, cel-shaded with painterly texture and subtle pixel-art-like detail, soft warm golden light from the upper left. Outfit exactly like the reference: dark-green hooded scarf-cloak with a pale triangular rune mark on the long tattered cloak tail, cream rolled-sleeve shirt with brown crossed leather straps and a green vest, brown belt with pouches, dark trousers, a brown leather backpack with a red rolled bedroll. Cheerful friendly face with a small open smile. Relaxed neutral STANDING pose, weight slightly on one leg, both arms hanging naturally with EMPTY hands — no sword, no shield, no weapon, no held item. Pure flat bright green background (#00FF00), no ground, no cast shadow, no text, no frame, one character only, full body, nothing cropped, feet at the bottom center of a square canvas.
```

## พรอมต์หลัก · ตัวเอกหญิง
```
Full-body standing character sprite of the young female main hero of a cozy fantasy tactics RPG. Use the attached walking sheet as the exact STYLE and PROPORTION reference: SUPER-DEFORMED / chibi proportions, only about 2.7 to 3 heads tall — the head is very large (about 38% of the total body height), clearly wider than the shoulders, with big expressive eyes, voluminous wavy chestnut-brown hair in a high side ponytail with loose strands, a short neck, a short compact torso, short sturdy legs in dark-brown tights, chunky oversized buckled brown leather boots with cream fur trim, and big hands in fingerless gloves. Clean dark outlines, cel-shaded with painterly texture and subtle pixel-art-like detail, soft warm golden light from the upper left. Outfit exactly like the reference: dark-green hooded scarf-cloak with a pale triangular rune mark on the long tattered cloak tail, cream rolled-sleeve blouse with brown crossed leather straps and a green vest, green embroidered short skirt/shorts, brown belt with pouches, a brown leather backpack with a red rolled bedroll. Cheerful friendly face with a small open smile. Relaxed neutral STANDING pose, weight slightly on one leg, both arms hanging naturally with EMPTY hands — no sword, no shield, no weapon, no held item. Pure flat bright green background (#00FF00), no ground, no cast shadow, no text, no frame, one character only, full body, nothing cropped, feet at the bottom center of a square canvas.
```

## ต่อท้ายตามทิศ (ใช้ทั้งชายและหญิง · ใส่หลังพรอมต์หลัก)

**SW — ล่างซ้าย (สร้างก่อน ใช้เป็นต้นแบบ)**
```
Facing the lower-left of the screen (toward the camera, to the left): a three-quarter FRONT view. The face is visible turned toward lower-left, the right shoulder nearest the camera, the cloak tail and backpack visible behind the right side.
```
**SE — ล่างขวา**
```
Facing the lower-right of the screen (toward the camera, to the right): a three-quarter FRONT view, the mirror direction of the SW sprite. The face is visible turned toward lower-right, the left shoulder nearest the camera. Keep the exact same character, outfit, head size and proportions as the attached SW reference.
```
**NW — บนซ้าย (หันหลัง)**
```
Facing the upper-left of the screen (away from the camera, to the left): a three-quarter BACK view. We see the back of the big head and hair, the hooded scarf-cloak, the full tattered cloak tail with the pale triangular rune mark, and the leather backpack with the red rolled bedroll centered on the back. Same character, outfit, head size and proportions as the attached SW reference.
```
**NE — บนขวา (หันหลัง)**
```
Facing the upper-right of the screen (away from the camera, to the right): a three-quarter BACK view, the mirror direction of the NW sprite. We see the back of the big head and hair, the cloak, the cloak tail with the pale rune mark and the backpack. Same character, outfit, head size and proportions as the attached SW reference.
```

## ข้อห้าม (Negative prompt)
```
realistic proportions, tall slim body, 3.5 heads tall or more, 4 heads tall, small head, head narrower than shoulders, long legs, long neck, eye-level camera, side profile, straight front or straight back view, top-down view, sword, weapon, shield, staff, bow, holding item, walking pose, running pose, dark gloomy mood, muddy colors, hair covering the eyes, realistic 3D render, photo, extra limbs, extra fingers, text, logo, watermark, frame, ground, cast shadow, gradient background, multiple characters, cropped feet, cropped head
```

## ขั้นตอนที่แนะนำ
1. สร้าง **SW** ชาย 4–6 ภาพ เลือกที่หัวโตตรงสัดส่วนที่สุด + เท้าอยู่ใกล้ y ≈ 376 → แล้ว **NW → SE → NE** โดยแนบ SW ที่เลือกเป็นอ้างอิง
2. ทำชุดหญิงแบบเดียวกัน (ใช้ SW หญิงเป็นต้นแบบของทิศที่เหลือ)
3. ได้แล้วส่งมา: ผมใส่ที่แท็บ Animation ของตัวเอกชาย/หญิง (ท่ายืน) แล้วปรับสเกลที่ ⚖ Scale Lineup · ถ้าอยากให้ท่าเดินใช้สัดส่วนเดียวกัน ภาพเดินอ้างอิงนี้ใช้ได้เลย

# Byrexael-Cean · มังกรดำจ้าววิญญาณ — แฟ้มเส้นเรื่อง (v98.514)

> สถานะ: **ข้อเสนอที่เจ้าของเลือกตัวแล้ว (15 พ.ย.) — ยังไม่ใช่ canon** ชื่อไทยในเกม, ฉาก, ผลลัพธ์ 3 ทางเป็นของที่ผมออกแบบเอง
> เจ้าของมอบหมาย: "Byrexael-Cean มังกรดำจ้าววิญญาณ เอาตัวนี้ ศึกษา lore แล้วลองทำเส้นเรื่อง"

## 1) หลักฐานจาก lore (ที่มีจริงในเอกสาร)
- ชื่อ Byrexael-Cean = Byre (จ้าว) + Xael (วิญญาณ) + Cean (มังกร) — อยู่ใน Vaelari Lexicon เท่านั้น ไม่มีเรื่องเล่าประกอบ
- Aeth-Borak = สัตว์ปฐมภูมิ ปกป้องถิ่นเพราะหน้าที่ในห่วงโซ่อาหาร ไม่ใช่ความบ้า (Codex v10a)
- Xaelyn/ตะกอนวิญญาณ = ร่องรอยความเจ็บปวด/ความยึดติดหนัก ๆ ที่อุดการไหลได้ — เป็นสาเหตุพายุ Duum'Pharis/Grat-Borak
- วิธีของผู้เฝ้าโบราณ: สังเกต / ผสานจิต / ผนึก / เบี่ยงทาง
- Codex 0.5: มีมังกรไฟ/ดิน/ลาวาในแดน Chel'Koranor
- MAIN-STORY-CANON ห้ามใช้ชื่อโบราณ (Paelasael, Grat, Wyridean ฯลฯ) ในข้อความผู้เล่น — ชื่อ Byrexael-Cean ใช้เฉพาะในเหตุการณ์ `dragonName` ที่มีคำแปลกำกับ

## 2) สิ่งที่ผมเสนอ (ไม่ใช่ canon)
| ส่วน | ไฟล์ | หมายเหตุ |
|---|---|---|
| เรื่องเล่า / เถ้าดำ / สัญญาณใต้ | `dragonTale · dragonAsh · dragonOmen` (js/crossroads.js) | ปูเรื่อง ธง dragonLore/dragonAsh/dragonSign/dragonOmen |
| เจอชื่อในจารึก | `dragonName` (ช่วง chase→climax, เลคเคนโฮลด์, ต้อง ruinStudy≥1 + dragonLore≥1) | ธง dragonNamed, dragonSediment |
| แผนที่ปากปล่อง | `dragonWell` (ธอร์นวอตช์, ช่วง mine→climax) | ธง dragonPlan = old/ally/alone, dragonAlly |
| ปุ่มเข้าถิ่น 🔥 | StoryCast SPOT `dragon` (vinehollow, haven) | เมื่อ dragonNamed + ช่วง mine + ยังไม่มี dragonFate |
| บอส | ฉาก `dragonLair` (js/set-pieces.js) · MON `byrexael`, `soulCore` | ตัดแก่นตะกอน 3 จุดก่อนล้มมัน · บอสเสริม (เลเวล ~12+) |
| ผลลัพธ์ | `dragonScene()` (js/world-map.js) | ปลิดชีพ / ผนึก (ruinStudy≥2 หรือแผน old) / ระบายตะกอน (faithSignal≥1, dragonSediment หรือมีเมียร์ริส) → ธง dragonFate |
| เอพิล็อก | js/endings.js | อ่าน dragonFate |

## 3) ยังไม่ทำ
- ภาพมังกรจริง (ตอนนี้วาดด้วยโค้ด `drawDragon`) · เสียง · แอนิเมชันลมหายใจ
- ทางผนึก/ระบายตะกอนใช้ข้อความเดียวกันทุกกรณี ยังไม่แตกตามคู่หู
- ให้เจ้าของตัดสิน: ปล่อยให้ตื่นอีกครั้งในเนื้อเรื่องภายหลังไหม (ทาง "ระบาย" เว้นช่องไว้)

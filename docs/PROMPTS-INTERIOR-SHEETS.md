# พรอมต์ชีท Asset ภายในแมพย่อย (ทีละชีท)

เป้าหมาย: วาดของในแมพย่อย (โรงแรม · ร้านค้า · วิหาร · ตลาด · สถานพยาบาล · โรงตีเหล็ก · สมาคม · บ้านชาวบ้าน · ไร่) เป็นภาพวาดมือแทนของที่ตอนนี้ใช้โค้ดวาด ให้สไตล์เดียวกับอาคารในหมู่บ้าน

วิธีใช้: เจนทีละชีท · ทุกชีทแนบ **ภาพอ้างอิงสไตล์** ไปด้วย (`assets/village-town/inn.webp` · `assets/village-town/shop.webp` · `assets/objects/house-01.webp`) และตั้งแต่ชีท 2 แนบชีทที่ผ่านแล้วเพื่อให้สีไม้และระดับรายละเอียดตรงกัน · เสร็จแล้วตัดทีละช่องใน Asset Studio

## ข้อมูลจากเกม (ใช้กำหนดมุมกล้องและขนาด)

- **มุมกล้อง**: isometric แบบ 2:1 (dimetric) · ช่องพื้น 1 ช่อง = ข้าวหลามตัดกว้าง:สูง = 2:1 (68×34 px ในห้อง) · กล้องยกสูง **30°** เหนือขอบฟ้า · เส้นขอบแนวนอนลาดเอียง 1:2 พอดี · เส้นตั้งต้องตั้งตรงเสมอ (ไม่ใช่มุมมองเพอร์สเปกทีฟ)
- **ทิศ**: แกน u ชี้ลงขวา (SE) · แกน v ชี้ลงซ้าย (SW) · ของในห้องหันหน้าไป **SE** (ล่างขวา) · เกม**กลับภาพซ้าย-ขวา**ให้เองเมื่อต้องหัน SW → วาดแค่ทิศ SE ทิศเดียว · ของยาวให้ด้านยาวพาดจากบนซ้ายไปล่างขวา (กลับภาพแล้วจะพาดอีกแกน)
- **ของติดผนัง**: ผนังหลัง (แกน u) หันหน้าห้องไป SW · ผนังซ้าย (แกน v) หันหน้าห้องไป SE → ชีทของติดผนังวาดแบบแปะผนังหัน SE ไว้ก่อน (ผนังอีกด้านใช้ภาพกลับด้าน)
- **สเกล**: ตัวละครสูงราว **1.25** เท่าของความกว้างช่องพื้น (ชีท 1 ใช้ 1.45 แต่ไม่กระทบ เพราะเกมย่อภาพตามช่องพื้นเอง) · โต๊ะ ≈ 0.5 · สตูล ≈ 0.35 · เคาน์เตอร์ ≈ 0.75 · เก้าอี้บาร์ ≈ 0.6 (หน่วยเป็นความกว้างช่องพื้น)
- **ผลจริงที่เรียนรู้จากชีท 1**: AI วาดชิ้นใหญ่กว่าที่สั่งราว 1.5–2 เท่า (ไม่ตามสัดส่วนช่องพื้นเป๊ะ) แต่ **สัดส่วนระหว่างชิ้นในชีทเดียวกันใช้ได้** → เกมย่อทั้งชีทด้วยตัวเลขเดียว (`k` ใน `js/interior-art.js`) แล้วปรับรายชิ้นที่ผิดสัดส่วน เช่น สตูล · ไม่ต้องกังวลเรื่องขนาดพิกเซลที่ได้
- **ไม่วาดเงาตกพื้น**: เกมวาดเงาและแสงเองด้วยโค้ด (แสงคบไฟ หน้าต่าง กลางวัน-กลางคืน)
- **พื้นหลัง**: เขียวล้วน `#00FF00` เรียบ ๆ ไม่มีไล่สี ไม่มีเงา (Asset Studio ลบพื้นเขียวให้) · ถ้าเครื่องมือเจนรองรับพื้นโปร่งใสจริง ให้ใช้ได้เลย

## สไตล์ (ใช้ซ้ำทุกชีท)

วาดมือแฟนตาซีสำหรับเกม RPG **ไม่ใช่ pixel art** · ขอบคมสะอาด เส้นขอบบางสีน้ำตาลเข้มนุ่ม · รายละเอียดวัสดุชัดแต่อ่านง่าย (ลายไม้ หัวตะปู แถบเหล็ก รอยสึก) · แสงอุ่นสีอำพันจากซ้ายบนด้านหน้า (ผิวบนสว่างสุด · ด้านซ้ายที่เห็นสว่าง · ด้านขวาที่เห็นอยู่ในเงากลาง ๆ) · โทนไม้โอ๊กสีน้ำผึ้ง ไม้วอลนัตเข้มเป็นจุดเน้น เหล็กดัด เขียวป่าและแดงสนิมใช้เล็กน้อย สีอมเทานิดหน่อยให้เข้ากับเมืองไม้ครึ่งปูนหรูแบบยุคกลาง

## แผนชีททั้งหมด (14 ชีท)

| ชีท | เนื้อหา | ใช้ในห้อง |
|---|---|---|
| **1 ✅ ใช้ในเกมแล้ว (v98.23)** | โต๊ะและที่นั่ง: โต๊ะกลม · โต๊ะเหลี่ยม · โต๊ะยาว · สตูล · เก้าอี้ · ม้านั่งยาว · สตูลบาร์ · โต๊ะข้าง · ถังไวน์ใช้เป็นโต๊ะ | โรงแรม · สมาคม · บ้าน · วิหาร |
| **2 ✅ ใช้ในเกมแล้ว (v98.25)** | เคาน์เตอร์และเวที: เคาน์เตอร์บาร์ (ช่วงตรง · มุม · ปลาย) · เคาน์เตอร์ร้าน · เวทีเล็ก · บันได | โรงแรม · ร้าน · สถานพยาบาล · สมาคม |
| **3 ✅ ใช้ในเกมแล้ว (v98.27)** | ของเก็บ: ลัง · ถัง · ถังเล็ก (keg) · ตะกร้า · หีบ · ตู้เตี้ย · ชั้นสูง (shelfbox) · ชั้นวางอาวุธ/เครื่องมือ | ทุกห้อง |
| **4 ✅ ใช้ในเกมแล้ว (v98.30)** | ห้องนอนและพรม: เตียง · เตียงผู้ป่วย · หีบปลายเตียง · พรมหลายขนาด (3×3 · 4×3 · ทางเดิน 1×7) | บ้าน · สถานพยาบาล · โรงแรม |
| **5A ✅ ใช้ในเกมแล้ว (v98.28)** | โรงตีเหล็ก: เตาหลอม 2×2 · ทั่ง · ถังชุบ · เครื่องสูบลม · หินลับ · โต๊ะช่างพร้อมปากกาจับ · ถังถ่าน · กองแท่งเหล็ก · เตาไฟเปิด | โรงตีเหล็ก · บ้านช่างตีเหล็ก |
| **5B ✅ ใช้ในเกมแล้ว (v98.42)** | เตาและไฟ: เตาผิง 1×2 · เตาหลอม 2×2 · ทั่ง · ถังชุบ · เตาอบขนมปัง · เตาผิงมีหม้อ | โรงแรม · โรงตีเหล็ก · บ้านคนทำขนม |
| **6 ✅ ใช้ในเกมแล้ว (v98.39)** | งานฝีมือ: กี่ทอผ้า · ม้านั่งช่าง · กองฟืน · โต๊ะเขียนหนังสือ · ชั้นหนังสือ · ตาข่าย · เครื่องโม่ | บ้านชาวบ้านตามอาชีพ |
| **7 ✅ ใช้ในเกมแล้ว (v98.31)** | วิหาร: แท่นบูชา · รูปปั้น · ม้านั่งยาวพร้อมพนัก (pew) · เชิงเทียนพื้น · เชิงเทียนยืน | วิหาร |
| **8 ✅ ใช้ในเกมแล้ว (v98.36)** | สถานพยาบาล: ครกบด · ขวดโหล · ชั้นสมุนไพร · ถาดยา · เก้าอี้หมอ · ผ้าพันแผลม้วน | สถานพยาบาล |
| **9 ✅ ใช้ในเกมแล้ว (v98.39)** | ตลาด: แผงขาย 4 สีผ้าหลังคา · กองผลไม้/ผัก · ตะกร้าผลผลิต · ป้ายราคา (ไม่มีตัวหนังสือ) | ตลาด |
| **10 ✅ ใช้ในเกมแล้ว (v98.41)** | สมาคม: กระดานรับงาน · ถ้วยรางวัล · เขากวางติดผนัง · ธงสมาคม · ดาบไขว้ติดผนัง · โต๊ะลงทะเบียน | สมาคมนักผจญภัย |
| **11A ✅ ใช้ในเกมแล้ว (v98.32)** | ประตูและหน้าต่าง: ประตูเปิด · ประตูปิด · ประตูคู่ · ประตูโค้งหิน · หน้าต่างบานเปิด · หน้าต่างเล็กมีลูกกรง · หน้าต่างโค้งสูง · กระจกสี · หน้าต่างมีบานเกล็ด | ทุกห้อง |
| **11B ✅ ใช้ในเกมแล้ว (v98.33)** | ของแขวนผนัง: ชั้นผนัง (ขวด/หนังสือ) · กระดานข่าว · ธงยาว/สั้น · ดาบไขว้+โล่ · เขากวาง · คบไฟติดผนัง · กรอบภาพ | ทุกห้อง |
| **12 ✅ ใช้ในเกมแล้ว (v98.43)** | ของเล็กบนโต๊ะและต้นไม้: แก้ว · จาน · เทียน · หนังสือ · ขวด · หม้อ · ตะเกียง (ใช้วางบนเฟอร์นิเจอร์ได้) | ทุกห้อง |
| 13 | ไร่: โรงนา · กระท่อม · เล้าไก่ · รางน้ำสัตว์ · บ่อน้ำ · หุ่นไล่กา · กองฟาง · รั้ว · ป้ายบอกทาง · กองปุ๋ย | ไร่ (กลางแจ้ง) |
| **14 ✅ ใช้ในเกมแล้ว (v98.46)** | พื้นและผนัง (เทกซ์เจอร์ต่อเนื่อง — แยกวิธีเจน เป็นภาพแบนต่อซ้ำได้ ไม่ใช่ชีทวัตถุ): พื้นไม้กระดาน · พื้นหิน · พื้นกระเบื้อง · ผนังปูนขาว · ผนังไม้ครึ่งปูน · ผนังหิน | ทุกห้อง |

หลังเจน: ตัดทีละช่อง → ตรวจเส้นฐาน/สเกลให้ตรงกันทุกช่อง → ใส่ใน manifest → ต่อเข้า `js/interior.js` แทนโค้ดวาดเดิมทีละชนิด (ของที่ยังไม่มีภาพจะใช้โค้ดวาดเดิมต่อไป)

---

## ชีท 1 · โต๊ะและที่นั่ง (3×3 = 9 ช่อง)

ลำดับช่อง (ซ้ายไปขวา บนลงล่าง) → ชื่อไฟล์ที่ควรตั้งตอนตัด:
`table-round` · `table-square` · `table-long` · `stool` · `chair` · `bench-long` · `stool-bar` · `table-side` · `table-barrel`

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior: exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated furniture piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no people, and nothing placed on the furniture (all table tops empty and clean).

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT faces the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2 (they rise or fall one pixel for every two pixels across). The floor footprint of one grid tile is a diamond twice as wide as it is tall. The long side of every elongated piece runs from the upper-left to the lower-right of the image.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. A 1x1-tile piece sits on exactly one such diamond; a 2x1 piece sits on two diamonds joined along the upper-left to lower-right direction. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 10% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.45 tile-widths tall (use this to judge proportions): tabletop height about 0.55 tile-widths, bar-stool seat about 0.62, ordinary stool seat about 0.4.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (wood grain, nail heads, iron bands, chips and wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows). Palette: warm oak and honey-coloured wood, dark walnut accents, wrought-iron fittings, muted forest green and russet red used sparingly, slightly desaturated so the pieces sit naturally in a lavish timber-framed medieval fantasy tavern and match the attached reference images of the village buildings. Keep wood tones and level of detail consistent across all nine pieces.

CONTENT, row by row, left to right:
1. Round tavern table, 1x1 tile, thick planked top, three stout turned legs.
2. Square tavern table, 1x1 tile, planked top with a visible apron, four square legs, one corner slightly worn.
3. Long trestle table, 2x1 tiles, thick planks on two A-frame trestles with a cross-brace (long side runs upper-left to lower-right).
4. Round wooden stool, about half a tile wide, three legs with a ring brace.
5. Simple wooden chair with a slat back, front facing lower-right.
6. Long bench, 2x1 tiles, no backrest, thick plank seat on two slab ends (long side upper-left to lower-right).
7. Tall bar stool, round padded russet-leather seat, iron foot ring.
8. Small round side table, about half a tile wide, single central pedestal with three feet.
9. An oak barrel used as a table: iron hoops, flat lid on top, 1x1 tile.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background, no objects on the furniture.
```

**ตรวจรับชีท**: ① ทุกชิ้นมุมกล้องเดียวกัน (เส้นตั้งตรง ขอบลาด 1:2) ② ฐานอยู่เส้นเดียวกันทุกช่อง ③ ขนาดตรงสเกล (โต๊ะกลมกินช่องพื้น 1 ช่อง · โต๊ะยาว 2 ช่อง) ④ ไม่มีตัวหนังสือ/ของวางบนโต๊ะ ⑤ แสงมาจากซ้ายบนเหมือนกันทุกชิ้น ⑥ สีไม้เข้ากับอาคารในหมู่บ้าน — ถ้าข้อไหนไม่ผ่านให้เจนใหม่ทั้งชีท (หรือเจนเฉพาะชิ้นแล้วแนบชีทนี้เป็นอ้างอิง)

**ผลในเกม (v98.23)**: `table` → โต๊ะกลม/เหลี่ยมสลับตามตำแหน่ง · `stool` → สตูล (สตูลบาร์แดงที่เคาน์เตอร์โรงแรม) · `barrel`/`keg` → ถังไม้ · ชิ้นที่ตัดแล้วแต่ยังไม่มีที่ใช้ (`chair` · `bench-long` · `table-long` · `table-side`) เก็บไว้ใน `assets/interior/` พร้อมข้อมูลใน `js/interior-art.js` รอเลย์เอาต์ห้องเรียกใช้

---

## ชีท 2 · เคาน์เตอร์ โต๊ะทำงาน เวที บันได (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `counter-bar` · `counter-bar-end` · `counter-shop` · `counter-guild` · `counter-healer` · `desk-writing` · `stage` · `stairs` · `counter-flap`

หมายเหตุสำหรับเกม: ชิ้นยาว (เคาน์เตอร์ 3×1) เกมต่อซ้ำเป็นแถวได้ จึงต้อง**ปลายตัดเรียบ** ไม่มีขอบหรือลายที่ปลายซ้ายขวา · บันไดวาดให้ขึ้นไปทางบนซ้าย หน้าขั้นหัน SE (เกมกลับภาพเป็นขึ้นไปทางบนขวาสำหรับบันไดชิดผนังหลัง)

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior: exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated furniture piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no people, and nothing placed on the furniture (all counter tops and desk tops completely empty and clean: no mugs, no papers, no books, no bottles).

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT faces the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2 (they rise or fall one pixel for every two pixels across). The floor footprint of one grid tile is a diamond twice as wide as it is tall. The long side of every elongated piece runs from the upper-left to the lower-right of the image, so its long customer-facing side is the visible left-hand face (facing lower-left).

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. A 3x1-tile piece sits on three such diamonds joined along the upper-left to lower-right direction; a 2x2 piece on a 2-by-2 block of diamonds. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 10% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. If the 3x1 pieces would not fit with that margin, draw every piece in the sheet slightly smaller by the same factor (keep their relative proportions). A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): counter top height about 0.75 tile-widths, writing desk top about 0.6, stage platform about 0.15 high, stairs rising about 0.9.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (wood grain, nail heads, iron bands, chips and wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows). Palette: warm oak and honey-coloured wood, dark walnut accents, wrought-iron and brass fittings, muted forest green and russet red used sparingly, slightly desaturated so the pieces sit naturally in a lavish timber-framed medieval fantasy town and match the attached reference images, including the previous sheet of tables and stools (same oak tone, same detail level, same outline weight).

CONTENT, row by row, left to right:
1. Tavern bar counter, straight section, 3x1 tiles: thick dark-oak plank top with a polished brass trim along the front edge, panelled front with a brass foot rail near the bottom, flat clean cut ends (it will be tiled end to end).
2. Tavern bar counter end piece, 1x1 tile: same oak and brass as piece 1, one end rounded like a bullnose, the other end flat.
3. Shop counter, straight section, 3x1 tiles: lighter pine, a green wool cloth runner lying along the top, a row of small drawers with iron pulls in the front, flat clean cut ends.
4. Adventurers' guild counter, straight section, 3x1 tiles: dark walnut, iron corner plates and iron-banded front panels, a heavy slab top, flat clean cut ends.
5. Healer's counter, straight section, 3x1 tiles: whitewashed plaster front with muted forest-green painted trim, honey-oak top, small shelf under the top, flat clean cut ends.
6. Writing desk, 2x1 tiles: sloped oak top, three drawers on the front with brass pulls, turned legs; top completely empty.
7. Low wooden stage platform, 2x2 tiles: plank top about 0.15 tile-widths high with a front edge skirt and two broad steps on the lower-right side.
8. Wooden staircase, 2x1 tiles: climbing towards the upper-left, the step fronts facing the lower-right, solid side stringers, a simple handrail on the visible left side, the top landing flat and clean (no wall, no floor).
9. Hinged counter flap (bar gate), 1x1 tile: a short lift-up counter section in the same oak as piece 1 with two iron hinges, shown closed and flat.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background, nothing on the tops.
```

**ตรวจรับชีท 2**: เหมือนชีท 1 + ④ ปลายเคาน์เตอร์ตัดเรียบต่อกันได้ ⑤ ท็อปทุกชิ้นว่าง ⑥ สีไม้เข้ากับชีท 1

**ผลในเกม (v98.25)**: `counter` → เคาน์เตอร์ตามห้อง (โรงแรม=บาร์ไม้โอ๊กทองเหลือง · ร้าน=ไม้สนผ้าเขียวมีลิ้นชัก · สมาคม=วอลนัตเหล็ก · สถานพยาบาล=ปูนขาวขอบเขียว) **ยืดได้ทุกความยาว** โดยตัดภาพเป็นครึ่งซ้าย + แถบกลางซ้ำ + ครึ่งขวา (ภาพยาว 3 ช่อง ห้องใช้ 4–6) · `stage` → เวที 2×2 มีบันได (โรงแรมย้ายเข้ามาหนึ่งช่องให้บันไดอยู่บนพื้น) · `stairs` → บันไดกลับภาพ ขึ้นไปทางบนขวาที่ผนังหลัง · ชิ้นที่ตัดแล้วยังไม่ใช้: `counter-bar-end` · `counter-flap` · `desk-writing`

**บทเรียนจากชีท 2**: ชิ้นยาวล้นช่องได้ (AI วาดไม่ตามตารางเป๊ะ) → สคริปต์ตัดแยกชิ้นตามรูปร่าง ไม่ใช่ตัดตามตาราง · สเกลต่อชีทไม่เท่ากัน (ชีท 1 k≈0.245 · ชีท 2 k≈0.33) → เกมคำนวณ k รายชิ้นจากขนาดช่องพื้นที่ควรกิน

---

## ชีท 3 · ของเก็บและชั้นวาง (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `crate` · `crate-stack` · `keg` · `basket` · `trunk` · `shelf-store` · `shelf-books` · `rack-weapons` · `rack-tools`

ใช้แทน: ลัง (`crate`) · ถังเล็ก (`keg`) · ตะกร้า (`basket`) · หีบ (`chest`) · ตู้ชั้นสูง (`shelfbox`) · ชั้นวางอาวุธ/เครื่องมือ (`rack`) ในโรงแรม ร้าน สมาคม โรงตีเหล็ก บ้าน

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior: exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated storage piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no people. Only the shelf and rack pieces (cells 6 to 9) carry items, exactly as described; every other piece is empty and closed.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT faces the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2 (they rise or fall one pixel for every two pixels across). The floor footprint of one grid tile is a diamond twice as wide as it is tall.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. Every piece here has a 1x1-tile footprint and sits on exactly one such diamond (the keg and basket are a little smaller than the diamond). The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 10% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): crate about 0.45 tile-widths high, stacked crates about 0.8, keg about 0.5, basket about 0.3, trunk about 0.4, tall shelves about 1.0, racks about 0.85.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (wood grain, nail heads, iron bands, rope, wicker weave, chips and wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows). Palette: warm oak and honey-coloured wood, dark walnut accents, wrought-iron fittings, muted forest green and russet red used sparingly, slightly desaturated so the pieces sit naturally in a lavish timber-framed medieval fantasy town and match the attached reference images, including the previous two sheets (same oak tone, same detail level, same outline weight).

CONTENT, row by row, left to right:
1. Wooden storage crate, 1x1 tile, closed lid with a few nailed slats and iron corner brackets, rope handle on the visible side.
2. Two crates stacked, 1x1 tile footprint: a larger crate with a smaller crate on top, slightly off-centre, both closed.
3. Small upright keg, a little smaller than a tile: oak staves, two iron hoops, a wooden tap near the bottom of the visible side, flat lid.
4. Round wicker basket with two loop handles folded down, empty, woven in honey-coloured reed, a little smaller than a tile.
5. Wooden trunk, 1x1 tile: curved-top travelling chest with iron bands, a brass lock plate and two leather handles, closed.
6. Tall general-store shelf cabinet, 1x1 tile, about one tile-width high: open front with three shelves stocked with clay jars, folded cloth rolls and small sacks (no labels, no writing).
7. Tall bookshelf cabinet, 1x1 tile, same size and wood as piece 6: shelves with leather-bound books of varied muted colours and a few scrolls (no writing on the spines).
8. Free-standing weapon rack, 1x1 tile: oak frame holding three swords and two spears upright with clean visible hilts and blades.
9. Free-standing tool rack, 1x1 tile: oak frame with a smith's hammer, tongs, a pick and a long-handled shovel hanging neatly.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 3**: เหมือนชีทก่อน + ⑥ ชั้นและชั้นวางเรียงของเรียบร้อย ไม่มีตัวหนังสือบนสันหนังสือ/ป้าย ⑦ ลัง/ถัง/ตะกร้า/หีบ ปิดและว่าง

พิมพ์ "ชีทถัดไป" ถ้าอยากได้ชีท 4 (ห้องนอนและพรม)


---

## ชีท 5A · โรงตีเหล็ก (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `furnace` · `anvil` · `quench` · `bellows` · `grindstone` · `bench-smith` · `coal-bin` · `ingots` · `forge-open`

ใช้แทน: `furnace` (เตาหลอม 2×2) · `anvil` · `quench` ในโรงตีเหล็ก และ `anvil` ในบ้านช่างตีเหล็ก · ที่เหลือเพิ่มเป็นของตกแต่งใหม่ในห้อง

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (a blacksmith's forge): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no people. Do not let any fire glow or light spill onto the green background; any glow stays inside the object's own silhouette.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT (the working side, opening or face) points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2. The floor footprint of one grid tile is a diamond twice as wide as it is tall.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. Piece 1 (the furnace) covers a 2x2-tile footprint, so it sits on a large diamond 62% of the cell width wide; every other piece has a 1x1-tile footprint (or smaller) and sits on one single diamond. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): furnace body about 1.1 tile-widths high with its hood, anvil about 0.5 including its stump, quench trough about 0.4, bellows about 0.6, grindstone about 0.55, workbench about 0.5, coal bin about 0.4, ingot stack about 0.25, open forge about 0.45.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (stone blocks and mortar, soot, hammered iron, rivets, wood grain, wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows and its own flickering firelight). Palette: soot-grey and warm grey fieldstone, blackened iron, dark steel with soft blue-grey highlights, oak and walnut wood, copper accents; the only saturated colour is the orange-red fire and embers inside the furnace and open forge. Slightly desaturated overall so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Blacksmith's furnace, 2x2 tiles: a chunky fieldstone body with a tall tapering stone hood and chimney going up, a wide arched fire mouth on the front-right face glowing orange-red with embers and a white-hot core, an iron grate, a small side shelf holding a pair of tongs.
2. Anvil on a stump, 1x1 tile: a classic blacksmith's anvil with horn and flat face on a thick oak log stump bound with an iron band, clean and empty.
3. Quenching trough, 1x1 tile: a rectangular oak and iron-banded water trough, dark still water inside, a small glint on the surface, a hanging ladle on its side.
4. Forge bellows on a stand, 1x1 tile: a big leather-and-wood double bellows mounted on a low oak frame with an iron nozzle pointing forward and a lever handle.
5. Grindstone, 1x1 tile: a round sharpening stone wheel in a wooden trough frame with a foot pedal or hand crank, wet stone surface.
6. Smith's workbench, 1x1 tile: heavy oak bench with an iron vise bolted to the front corner, a hammer, a file and a pair of pliers lying on the top.
7. Coal bin, 1x1 tile: an open-topped wooden bin heaped with black coal lumps, a small iron shovel leaning in it.
8. Stack of iron ingots, smaller than a tile: a neat pyramid of dark grey iron bars on a low wooden pallet, plus two rough steel billets on top.
9. Open forge hearth, 1x1 tile: a low waist-high stone hearth with an open top bed of glowing coals and embers, a short iron hood bracket above, a poker leaning on the side.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 5A**: เหมือนชีทก่อน + ⑥ เตาหลอมกว้าง 2 ช่อง (ใหญ่กว่าชิ้นอื่นชัดเจน) ⑦ ไฟอยู่แค่ในปากเตา/เตาเปิด ไม่เรืองออกไปบนพื้นเขียว ⑧ ทั่งว่างเปล่า ถังชุบน้ำนิ่ง

---

## ชีท 4 · ห้องนอนและพรม (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `bed-single` · `bed-double` · `bed-cot` · `footlocker` · `wardrobe` · `rug-3x3` · `rug-4x3` · `rug-runner` · `rug-round`

ใช้แทน: เตียง (`bed`) ในบ้าน โรงแรม สถานพยาบาล · พรม (`rug`) ทุกห้อง · ตู้เสื้อผ้า/หีบปลายเตียงเป็นของใหม่ · **พรมวาดคนละสเกลกัน** (พรมกินพื้นที่หลายช่อง) เกมจะย่อรายชิ้นเอง

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (bedroom furniture and floor rugs): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no people, nothing on the furniture except what is described.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT (foot end of a bed, door side of a wardrobe) points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2. The floor footprint of one grid tile is a diamond twice as wide as it is tall. The long side of every elongated piece runs from the upper-left to the lower-right of the image (the head of a bed is at the upper-left, the foot at the lower-right).

SCALE: cells 1 to 5 (furniture): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. A bed is 1 tile wide and 2 tiles long (single, cot) or 2 tiles wide and 2 tiles long (double); the footlocker and wardrobe are 1x1 tile. The lowest ground-contact point of each piece is centred horizontally in its cell at about 78% of the cell height. Cells 6 to 9 (rugs): each rug is drawn lying perfectly flat on the floor, filling its cell as large as possible (the whole rug about 85% of the cell width, centred) so the rug's weave stays crisp; the game rescales rugs. Rug proportions on the floor grid: cell 6 is 3 tiles by 3 tiles, cell 7 is 4 tiles by 3 tiles, cell 8 is a narrow runner 1 tile by 4 tiles lying along the upper-left to lower-right direction, cell 9 is a circle about 3 tiles across (an ellipse twice as wide as tall in the image). Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall: bed frame top about 0.35 tile-widths, headboard about 0.65, wardrobe about 1.1, footlocker about 0.3.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (wood grain, woven wool, stitched linen, fringe, wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. Rugs are lit evenly, with only a thin darker edge and a very slight thickness, no cast shadow. No cast shadow outside any object (the game draws its own shadows). Palette: warm oak and honey-coloured wood, dark walnut accents, cream and white linen, wool blankets in muted russet red, deep forest green and dusty blue, slightly desaturated so the pieces match the attached reference images and the previous sheets (same wood tone, same detail level, same outline weight).

CONTENT, row by row, left to right:
1. Single bed, 1x2 tiles: oak frame with a carved headboard at the upper-left end and a low footboard at the lower-right end, straw-coloured linen sheet, one plump pillow, a folded russet wool blanket across the foot.
2. Double bed, 2x2 tiles: larger oak frame with a taller carved headboard, two pillows, a patterned forest-green quilt turned back at the top.
3. Healer's cot, 1x2 tiles: a plain low wooden cot with simple legs, clean white linen sheet, a thin white pillow and a neatly folded white blanket, a faint red stitched cross-free border (no symbols, no text).
4. Footlocker, 1x1 tile: a low wooden chest meant to sit at the foot of a bed, iron corner straps, flat lid with a folded blanket resting on top.
5. Wardrobe, 1x1 tile: tall oak two-door wardrobe, slightly open right door showing dark inside with a hint of hanging cloth, carved cornice on top, iron handles.
6. Woven wool rug, 3x3 tiles, flat: a square rug seen as a diamond, russet red field with a cream border and a simple geometric medallion, fringe on the two ends.
7. Woven wool rug, 4x3 tiles, flat: a large rectangular rug seen as a diamond-shaped parallelogram (longer along the upper-left to lower-right direction), deep forest-green field with a gold and cream border and simple knotwork, fringe at both ends.
8. Runner rug, 1x4 tiles, flat: a long narrow hall runner running from the upper-left to the lower-right of the image, dusty blue with a cream stripe border and fringe at the ends.
9. Round rug, about 3 tiles across, flat: a round braided-rag rug drawn as a flat ellipse, concentric rings of cream, russet and brown.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 4**: เหมือนชีทก่อน + ⑥ หัวเตียงอยู่ซ้ายบน ปลายเตียงอยู่ขวาล่าง ⑦ พรมแบนราบจริง (ไม่มีเงา ไม่มีขอบหนา) ⑧ ไม่มีสัญลักษณ์/ตัวหนังสือบนเตียงหมอ

---

## ชีท 7 · วิหาร (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `altar` · `statue` · `pew` · `candelabra` · `candle-stand` · `font` · `lectern` · `offering-box` · `brazier`

ใช้แทน: แท่นบูชา (`altar` 3×1) · รูปปั้น (`statue`) · ม้านั่งยาว (`pew` 3×1) · เชิงเทียน (`candles`) ในวิหาร · ที่เหลือเป็นของใหม่ · แท่นบูชาและม้านั่งยาวพาดตามแกนซ้ายบน→ขวาล่าง

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (a temple of an earth-and-harvest goddess): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no runes or letters, no people. Flames and glows stay inside the object's own silhouette and never spill onto the green background.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2. The floor footprint of one grid tile is a diamond twice as wide as it is tall. The long side of every elongated piece (altar, pew) runs from the upper-left to the lower-right of the image.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. The altar and the pew each cover a 3x1-tile footprint (three diamonds joined along the upper-left to lower-right direction, so the piece is wide in the image, about 62% of the cell width at its footprint); every other piece covers 1x1 tile or less. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): altar about 0.55, goddess statue with its plinth about 1.9 (the tallest piece, allowed to fill the cell height), pew seat about 0.35 with a backrest to about 0.7, candelabra about 1.2, candle stand about 0.9, font about 0.6, lectern about 0.8, offering box about 0.45, brazier about 0.5.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (stone grain, chiselled edges, wood grain, brass patina, wax drips, linen folds). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows and its own flickering candlelight). Palette: pale warm limestone and cream marble, dark walnut and oak wood, aged brass and gold used sparingly, white and deep-blue altar cloth, tiny warm candle flames as the only saturated glow, slightly desaturated so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Temple altar, 3x1 tiles: a long cream-marble altar block with a carved base and cornice, covered on top with a white linen cloth with a deep-blue embroidered border hanging down the front, a brass chalice and a small open book on top (no writing on the pages).
2. Goddess statue on a plinth, 1x1 tile: a serene robed woman carved in pale marble holding a sheaf of wheat in one arm and a bowl in the other, standing on a square stone plinth, hands and face gently weathered, no halo glow.
3. Pew, 3x1 tiles: a long dark-oak church bench with a straight backrest, carved end panels and a slightly worn seat, empty.
4. Floor candelabra, 1x1 tile: a tall wrought-iron and brass stand with five lit tapers on branching arms, wax drips on the candles, small round iron base.
5. Candle stand, 1x1 tile: a shorter wooden-and-iron stand with a wide tray filled with many small votive candles, some lit, some burnt down.
6. Holy water font, 1x1 tile: a waist-high carved marble pedestal with a shallow round basin of clear water, a small brass ladle resting on the rim.
7. Lectern, 1x1 tile: a slim oak reading stand with a slanted top holding a large closed book with a brass clasp, carved front panel (no text).
8. Offering box, smaller than a tile: a chunky oak-and-iron donation chest with a coin slot in the lid, a heavy hasp and a small brass plate (blank).
9. Incense brazier, smaller than a tile: a bronze bowl on three curled legs with glowing coals and a thin curl of pale smoke rising a short way.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 7**: เหมือนชีทก่อน + ⑥ แท่นบูชากับม้านั่งกว้าง 3 ช่อง พาดซ้ายบน→ขวาล่าง ⑦ รูปปั้นสูงที่สุดในชีท ⑧ เปลวเทียน/ถ่านอยู่ในตัววัตถุ ไม่เรืองบนพื้นเขียว ⑨ ไม่มีตัวหนังสือบนหนังสือ/แผ่นทอง


---

## ชีท 11A · ประตูและหน้าต่าง (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `door-open` · `door-closed` · `door-double` · `door-arch` · `window-casement` · `window-barred` · `window-arched` · `window-stained` · `window-shuttered`

**ต่างจากชีทอื่น**: ของชุดนี้ติด *ผนัง* ไม่ได้วางบนพื้น · วาดเฉพาะกรอบ/บานที่ฝังในผนัง ไม่วาดผนังรอบ ๆ · **ช่องเปิดและบานกระจกทุกบานใส่เขียว `#00FF00` ล้วน** (เกมจะลบให้โปร่งแล้วใส่ท้องฟ้า กลางวัน-กลางคืน แสงลอดเข้า ข้างหลังเอง) · วาดแบบติดผนังด้านซ้าย (หน้าผนังหันไป SE ล่างขวา เส้นขอบนอนลาดขึ้นทางขวา "/") เกมกลับภาพให้เองสำหรับผนังหลัง

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior: wall-mounted doors and windows. Exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no people, no scenery. IMPORTANT: every doorway opening and every window pane (the see-through glass area) is filled with the SAME flat pure chroma-green #00FF00 as the background, so it can be removed later; never paint a sky, a landscape or a reflection in them. The only exception is cell 8 (stained glass), whose panes are painted in opaque jewel colours. The surrounding wall is NOT drawn: only the frame, the door leaf, the shutters, the sill and the lintel are drawn, so each piece looks like a cut-out that will be set into a wall by the game.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon. Each piece is a flat wall-mounted object seen on a wall surface that faces the lower-right (south-east) of the image: its horizontal edges therefore rise toward the right at exactly 1:2 (they go up one pixel for every two pixels moving right), its vertical edges stay perfectly vertical, and you see only the front face of the piece plus a thin slice of the wall's thickness (the reveal) on its left and underside, a few pixels deep. Orthographic: no perspective convergence, no fisheye, no vanishing points.

SCALE: all pieces share one scale. One unit of wall width measures 34 pixels horizontally across the image (and rises 17 pixels over that run). Heights are real vertical pixels. In those units: a single door is 1 unit wide (34 px) and 78 px tall; the double door is 2 units wide (68 px) and 78 px tall; the arched stone door is 1 unit wide and 84 px tall including the arch; the casement window is 1.2 units wide (41 px) and 60 px tall; the barred window is 0.8 units wide (27 px) and 34 px tall; the tall arched window and the stained-glass window are each 1 unit wide (34 px) and 90 px tall; the shuttered window is 1.2 units wide (41 px) and 60 px tall for the glass part, with open shutters adding half a unit on each side. Draw each piece as large as fits in its cell while keeping these exact proportions between pieces (the whole sheet can be scaled up equally, but the pieces keep their relative sizes). Leave 10% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. The bottom of every door sits on the same baseline in its cell.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (wood grain, nail heads, iron straps, chiselled stone, lead cames, wear). Warm amber lighting from the upper-left front: top surfaces brightest, left-facing reveals lit, the underside of lintels and sills in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own light and shadow). Palette: warm oak and honey-coloured wood, dark walnut frames, wrought iron, pale warm limestone for the arch, slightly desaturated so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Open doorway, 1 unit wide: a timber frame (posts, lintel, worn threshold stone), the opening filled with chroma green, the oak plank door leaf swung wide open inward and seen almost edge-on as a thick plank slab standing at the left jamb with two iron strap hinges.
2. Closed plank door, 1 unit wide: vertical oak planks with two iron straps, a ring handle, a small iron lock plate, a timber frame with a plain lintel and threshold.
3. Double door, 2 units wide: two closed oak leaves with iron studs and long strap hinges, a ring handle on each leaf, a heavy timber frame with a thick lintel and a stone threshold.
4. Arched stone doorway, 1 unit wide: a rounded chiselled limestone arch with a keystone, a closed arched oak door banded with iron and studded, a worn stone step.
5. Casement window: a wooden frame with a cross mullion making four panes, all panes chroma green, a projecting wooden sill below and a slim lintel above, a tiny iron latch.
6. Small barred window: a short window in a thick frame with three vertical wrought-iron bars, the gaps between the bars chroma green, a stone sill (for a forge or storeroom).
7. Tall arched window: a narrow window with a rounded top, a thin carved wooden frame and one thin mullion, lead-lined diamond panes, all panes chroma green, a small stone sill.
8. Stained-glass window: the same tall arched shape as piece 7 in a pale stone frame, panes painted as opaque stained glass in muted jewel colours (deep blue, ruby, amber, forest green) with dark lead lines and a simple abstract flower-and-sun pattern, no letters, no figures.
9. Shuttered window: a casement window (like piece 5, panes chroma green) with two wooden board shutters swung open flat against the wall on either side with iron hinges, and a small wooden window box beneath holding herbs and tiny flowers.

Each piece is a complete cut-out fully inside its own cell. No text, no wall, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 11A**: เหมือนชีทก่อน + ⑥ ช่องเปิดประตูและบานกระจกเป็นเขียวล้วนเหมือนพื้นหลัง (ยกเว้นช่อง 8 กระจกสี) ⑦ ไม่มีผนังรอบ ๆ ⑧ เส้นนอนลาดขึ้นทางขวา (ถ้าลาดลงทางขวา เกมใช้ภาพกลับด้านได้ ไม่เป็นปัญหา) ⑨ ไม่มีตัวหนังสือหรือรูปคนบนกระจกสี


---

## ชีท 11B · ของแขวนผนัง (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `wall-shelf-jars` · `wall-shelf-books` · `noticeboard` · `banner-long` · `banner-guild` · `swords-shield` · `antlers` · `wall-torch` · `painting`

ใช้แทน: ชั้นผนัง (`shelf`/`herbs`) · กระดานข่าว (`board`) · ธง (`banner`) · ดาบ (`sword`) · เขากวาง (`antlers`) ที่ตอนนี้เป็นเส้นโค้ด · คบไฟและกรอบภาพเป็นของใหม่ · วาดติดผนังด้านซ้าย (หน้าผนังหัน SE เส้นขอบนอนลาดขึ้นทางขวา "/") เหมือนชีท 11A

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior: wall-hung decorations. Exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no shadow or glow on the background). No visible cell borders or grid lines, no text, no letters, no runes, no labels, no people, no scenery. The surrounding wall is NOT drawn: each piece is a cut-out that the game will hang on a wall. Flame glow stays inside the piece's own silhouette and never spills onto the green.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon. Each piece hangs flat against a wall surface that faces the lower-right (south-east) of the image: its horizontal edges therefore rise toward the right at exactly 1:2 (they go up one pixel for every two pixels moving right), its vertical edges stay perfectly vertical, and you see the front face plus a thin slice of the piece's own depth on its left and underside. Shelves, the torch and the antlers stick out of the wall a little, so you also see their top surfaces and left-hand sides in the same 2:1 isometric view. Orthographic: no perspective convergence, no fisheye.

SCALE: all pieces share one scale. One unit of wall width measures 34 pixels horizontally across the image (and rises 17 pixels over that run). Heights are real vertical pixels. In those units: the jar shelf and the book shelf are each 2 units wide (68 px) and 40 px tall including the two tiers; the notice board is 1 unit wide (34 px) and 46 px tall; the long banner is 0.7 units wide (24 px) and 78 px tall; the guild banner is 0.9 units wide (30 px) and 54 px tall; the crossed swords with shield are 1.2 units wide (41 px) and 44 px tall; the antlers are 1 unit wide (34 px) and 36 px tall; the wall torch is 0.4 units wide (14 px) and 40 px tall; the painting is 0.9 units wide (30 px) and 40 px tall. Draw each piece as large as fits in its cell while keeping these exact proportions between pieces (the whole sheet can be scaled up equally, but the pieces keep their relative sizes). Leave 10% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (wood grain, woven cloth, forged iron, parchment fibres, wax and glass). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own light and shadow). Palette: warm oak and honey-coloured wood, dark walnut, wrought iron and steel, muted russet red, deep blue and forest green cloth, cream parchment, slightly desaturated so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Wall shelf with jars, 2 units wide: two oak shelves one above the other held by iron brackets, the upper shelf with clay jars and stoppered glass bottles of herbal tinctures, the lower shelf with small sacks, a mortar and a few bundles of dried herbs hanging from the upper shelf's front edge (no labels, no writing).
2. Wall shelf with books, 2 units wide: the same two-tier oak shelf with iron brackets, leather-bound books of varied muted colours standing and leaning, a few rolled scrolls and a small brass candlestick (no writing on the spines).
3. Notice board, 1 unit wide: an oak-framed cork-and-plank board with several blank pinned parchment notes and a torn blank poster, pinned with small iron nails and a bit of string (no writing at all, only faint blurred grey lines are not allowed: leave the notes blank).
4. Long banner, narrow and tall: a russet-red cloth banner with a cream border and a swallow-tail bottom edge, hanging from a dark wooden rod with two small brass finials, a simple plain gold stripe down the middle (no emblem, no text).
5. Guild banner, shorter: a deep-blue cloth banner with a cream border hanging from an iron bar, bearing one simple stylised cream-and-gold sword-and-star emblem (a symbol only, no letters).
6. Crossed swords with shield: two steel swords crossed diagonally behind a round oak shield with an iron boss and iron rim, mounted on a small dark wooden plaque.
7. Antlers trophy: a mounted deer skull with a broad pair of branching antlers on a small carved oak shield-shaped plaque.
8. Wall torch: a wrought-iron wall sconce holding a wooden torch with a small lit flame at the top, sooty wall bracket, a little ember glow only on the torch head.
9. Framed painting: a wooden frame with a gold inner edge holding a small painted landscape of rolling green hills, a river and a distant village (painted picture only, no text, no signature).

Each piece is a complete cut-out fully inside its own cell. No text, no wall, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 11B**: เหมือนชีทก่อน + ⑥ ไม่มีตัวหนังสือบนสันหนังสือ ป้ายบอร์ด ธง ⑦ ไฟคบไฟอยู่ในตัววัตถุ ⑧ ชั้นวางเห็นด้านบนและด้านซ้ายนิดหน่อย

---

## ชีท 8 · สถานพยาบาล (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `mortar-table` · `potion-table` · `herb-cabinet` · `drawer-cabinet` · `doctor-chair` · `bandage-basket` · `folding-screen` · `wash-stand` · `herb-drying-rack`

ใช้แทน: ครก/โต๊ะยา (`mortar` `jars`) และของที่ยังเป็นโค้ดในสถานพยาบาล · เก็บไว้ใช้ในบ้านหมอ/บ้านสมุนไพรด้วย · ฉากกั้นยาว 2×1 พาดซ้ายบน→ขวาล่าง

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (a village healer's house): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no people. Nothing on any piece is written on: bottles, jars and drawers carry no labels or letters.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2. The floor footprint of one grid tile is a diamond twice as wide as it is tall. The long side of the folding screen runs from the upper-left to the lower-right of the image.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. The folding screen covers a 2x1-tile footprint (two diamonds joined along the upper-left to lower-right direction); every other piece covers 1x1 tile or less. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): mortar table about 0.55, potion table about 0.5, tall herb cabinet about 1.0, drawer cabinet about 0.75, doctor's chair seat about 0.4 with the back to 0.8, bandage basket about 0.3, folding screen about 1.0, wash stand about 0.65, drying rack about 1.0.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (wood grain, glass highlights, linen weave, brass fittings, dried leaves, wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows). Palette: warm oak and honey-coloured wood, pale sage-green and cream linen, glass bottles in muted amber, green and blue, copper and brass fittings, white bandages, slightly desaturated so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Mortar table, 1x1 tile: a sturdy oak work table with a heavy stone mortar and pestle, a small brass scale, a few loose dried leaves and a rolled bundle of herbs on the top.
2. Potion table, 1x1 tile: a small round oak table with five or six glass bottles and flasks of coloured liquids (amber, green, pale blue), a tiny alcohol burner and a clay cup.
3. Tall herb cabinet, 1x1 tile: an open-fronted oak cabinet about one tile-width high with three shelves of clay jars with cork stoppers, small linen sacks of dried herbs and a bundle of hanging leaves at the side.
4. Apothecary drawer cabinet, 1x1 tile: a low oak chest of many small square drawers with brass pulls (blank, no labels), a shallow tray with a few jars on top.
5. Doctor's chair, 1x1 tile: a sturdy oak armchair with a high back, a plain sage-green cushion on the seat and wooden armrests, empty.
6. Bandage basket, smaller than a tile: a round wicker basket holding neat rolls of white linen bandages and a folded cloth, a small jar of salve on the rim.
7. Folding screen, 2x1 tiles: a three-panel wooden room divider with cream linen panels and a simple painted green leaf border, standing slightly zig-zag, oak frame.
8. Wash stand, 1x1 tile: a wooden stand with a ceramic basin and jug, a folded white towel hanging on a side bar, a small bar of soap.
9. Herb drying rack, 1x1 tile: a freestanding wooden rack with two horizontal poles from which many bundles of dried herbs and flowers hang upside down.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 8**: เหมือนชีทก่อน + ⑥ ไม่มีตัวหนังสือบนขวด/โหล/ลิ้นชัก ⑦ ฉากกั้นกว้าง 2 ช่อง ⑧ ไม่มีสัญลักษณ์กากบาทแดงหรือรูปคน

---

## ชีท 9 · ตลาด (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `stall-red` · `stall-blue` · `stall-green` · `stall-gold` · `fruit-crate` · `veg-basket` · `sack-pile` · `cheese-table` · `price-post`

ใช้แทน: แผงขายของ (`stall` 2×1 สลับ 4 สีผ้า) ที่ตอนนี้เป็นกล่องสีล้วน · ที่เหลือเป็นของตกแต่งตลาด · **แผงทั้ง 4 ต้องเป็นโครงเดียวกันเปลี่ยนแค่สีผ้า** เพื่อให้เกมเลือกสีตามตำแหน่งได้ · แผงพาดซ้ายบน→ขวาล่าง

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (an indoor market hall): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no people. No writing anywhere: signs and price tags are blank.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT (the selling side) points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2. The floor footprint of one grid tile is a diamond twice as wide as it is tall. The long side of every stall runs from the upper-left to the lower-right of the image.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. Pieces 1 to 4 (the stalls) each cover a 2x1-tile footprint (two diamonds joined along the upper-left to lower-right direction) and are exactly the same size and shape as each other; every other piece covers 1x1 tile or less. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): the stall counter about 0.55 high, the stall's canopy poles up to about 1.5, fruit crate about 0.4, vegetable basket about 0.35, sack pile about 0.5, cheese table about 0.5, price post about 0.9.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (wood grain, striped canvas weave, fruit skins, burlap, wax rind, wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows). Palette: warm oak and honey-coloured wood, striped cloth canopies in muted brick red, deep blue, leaf green and golden yellow (each with cream stripes), natural produce colours kept slightly desaturated so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Market stall with a RED canopy, 2x1 tiles: an oak counter with a slanted striped brick-red and cream cloth canopy on four slim posts with a scalloped front edge, the counter top displaying a neat mix of loaves of bread and pastries on cloth.
2. Market stall with a BLUE canopy, 2x1 tiles: exactly the same stall frame, counter and canopy shape as piece 1, striped deep-blue and cream canopy, the counter top displaying folded bolts of cloth and spools of thread.
3. Market stall with a GREEN canopy, 2x1 tiles: exactly the same frame as piece 1, striped leaf-green and cream canopy, the counter top displaying pots, clay jugs and small potted herbs.
4. Market stall with a GOLD canopy, 2x1 tiles: exactly the same frame as piece 1, striped golden-yellow and cream canopy, the counter top displaying metalwork, small tools, horseshoes and lanterns.
5. Fruit crate, 1x1 tile: an open wooden crate overflowing with apples, pears and oranges, a few fruits resting on the front edge.
6. Vegetable basket, smaller than a tile: a large round wicker basket heaped with carrots, cabbages, turnips and leeks.
7. Sack pile, 1x1 tile: three burlap sacks of grain and flour stacked, one open sack showing golden grain, a wooden scoop in it.
8. Cheese table, 1x1 tile: a small trestle table with wheels and wedges of cheese, a wooden board with a knife, a clay butter dish, a hanging cloth cover.
9. Price post, 1x1 tile or smaller: a slim wooden post with a blank hanging wooden sign board and a small blank chalk slate, a coil of rope tied around the base, no writing at all.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 9**: เหมือนชีทก่อน + ⑥ แผง 4 แผงโครงเหมือนกันเป๊ะ เปลี่ยนแค่สีผ้าและของบนเคาน์เตอร์ ⑦ ป้ายราคาเปล่า ไม่มีตัวหนังสือ ⑧ หลังคาผ้าไม่บังเคาน์เตอร์จนมองไม่เห็นของ

---

## ชีท 10 · สมาคมนักผจญภัย (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `quest-board` · `trophy-case` · `reg-desk` · `armor-stand` · `weapon-barrel` · `map-table` · `training-dummy` · `banner-stand` · `gear-bench`

ใช้แทน: กระดานรับงาน/โต๊ะลงทะเบียน/ราวอาวุธในสมาคม และเป็นของตกแต่งใหม่ · กระดานรับงานกับโต๊ะลงทะเบียนยาว 2 ช่อง พาดซ้ายบน→ขวาล่าง

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (an adventurers' guild hall): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no letters, no labels, no people. Nothing carries writing: notices, ledgers, maps and plaques are blank or show only abstract marks.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2. The floor footprint of one grid tile is a diamond twice as wide as it is tall. The long side of every elongated piece runs from the upper-left to the lower-right of the image.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. The quest board and the registration desk each cover a 2x1-tile footprint (two diamonds joined along the upper-left to lower-right direction); the gear bench covers 2x1 as well; every other piece covers 1x1 tile or less. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): quest board about 1.1, trophy case about 1.0, registration desk about 0.65, armor stand about 1.15, weapon barrel about 0.55 (weapons rise to 0.9), map table about 0.5, training dummy about 1.1, banner stand about 1.5, gear bench about 0.35.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (wood grain, forged steel, leather, parchment, brass, rope, wear and dents). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows). Palette: warm oak and honey-coloured wood, dark walnut, steel and iron, brass and gold, cream parchment, deep blue and russet red cloth with a simple sword-and-star emblem (symbol only), slightly desaturated so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Quest board, 2x1 tiles: a free-standing wide oak frame on two sturdy legs holding a cork-and-plank board covered with many blank pinned parchment notices of different sizes and a few wanted-poster style sheets with only abstract smudged marks (no letters, no faces).
2. Trophy case, 1x1 tile: an upright glass-fronted oak cabinet with three shelves holding golden cups, a small silver shield, a monster tusk and a ribbon rosette; the glass is clear with a few highlights.
3. Registration desk, 2x1 tiles: a long heavy oak desk with a slanted writing top, an open blank ledger, an inkwell with a quill, a wax-seal stamp and a brass hand bell, a drawer front with a brass pull.
4. Armor stand, 1x1 tile: a wooden mannequin stand wearing a complete suit of dark steel plate armour with a plumed helmet, a sword hung at the hip and a shield leaning at its feet.
5. Weapon barrel, 1x1 tile: an open oak barrel with iron hoops filled with swords, spears and a bow sticking out at different angles.
6. Map table, 1x1 tile: a small sturdy oak table with a large blank-ish parchment map unrolled across it (only abstract hand-drawn coast and mountain marks, no letters), held down by a brass compass, a dagger and a candle stub.
7. Training dummy, 1x1 tile: a straw-and-burlap practice dummy on a wooden post with a crossbar, sword slashes and dents in it, a small round wooden target shield on its arm.
8. Banner stand, 1x1 tile: a slim floor-standing wooden pole on a heavy round base holding a deep-blue banner with a cream border and one simple gold sword-and-star emblem (symbol only, no letters), topped with a brass spear-tip finial.
9. Gear bench, 2x1 tiles: a long low plank bench with a leather backpack, a rolled bedroll, a coiled rope and a pair of boots resting on it.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 10**: เหมือนชีทก่อน + ⑥ ไม่มีตัวหนังสือบนป้ายประกาศ/สมุด/แผนที่ ไม่มีใบหน้าบนโปสเตอร์ ⑦ กระดานรับงาน โต๊ะลงทะเบียน ม้านั่งกว้าง 2 ช่อง ⑧ ธงมีแค่สัญลักษณ์ ไม่มีตัวหนังสือ

---

## ชีท 6 · งานฝีมือในบ้านชาวบ้าน (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `loom` · `bread-oven` · `carpenter-bench` · `log-pile` · `writing-desk` · `net-rack` · `millstone` · `spinning-wheel` · `cook-hearth`

ใช้แทน: กี่ทอผ้า (`loom`) · เตาอบ (`oven`) · ม้านั่งช่าง (`bench` 2×1) · กองฟืน (`logs` 2×1) · โต๊ะเขียนหนังสือ (`desk`) · ตาข่าย · เครื่องโม่ (`mill`) · ขนแกะ (`wool`) · เตาผิงมีหม้อ ในบ้านชาวบ้านตามอาชีพ · ม้านั่งช่างกับกองฟืนยาว 2 ช่อง พาดซ้ายบน→ขวาล่าง

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (village craftspeople's homes and workshops): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no people. Any fire or glow stays inside the object's own silhouette and never spills onto the green.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT (the working side) points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2. The floor footprint of one grid tile is a diamond twice as wide as it is tall. The long side of every elongated piece runs from the upper-left to the lower-right of the image.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. The carpenter's bench and the log pile each cover a 2x1-tile footprint (two diamonds joined along the upper-left to lower-right direction); the cooking hearth covers 1x2 tiles seen end-on along the same direction; every other piece covers 1x1 tile or less. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): loom about 1.1, bread oven about 0.7, carpenter's bench about 0.5, log pile about 0.6, writing desk about 0.7, net rack about 1.0, millstone about 0.35, spinning wheel about 0.65, cooking hearth about 0.55.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (wood grain, woven thread, rope knots, brick and clay, split log ends, wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows and its own firelight). Palette: warm oak and honey-coloured wood, dark walnut, natural undyed wool and linen, terracotta clay and soft grey stone, wrought iron, muted green, russet red and blue thread used sparingly, slightly desaturated so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Weaving loom, 1x1 tile: a tall upright oak loom frame with a half-woven cloth in blue and cream stripes, a row of taut warp threads, a shuttle and a wooden beater bar, a small basket of thread balls at its foot.
2. Bread oven, 1x1 tile: a domed clay-and-brick bread oven on a stone base with an arched mouth showing a few glowing embers, a long wooden peel leaning on it and two round loaves on a small shelf.
3. Carpenter's bench, 2x1 tiles: a long heavy workbench with a vise at one end, a hand saw, a plane, a mallet, a few wood shavings, a plank clamped on top and a pile of cut boards underneath.
4. Log pile, 2x1 tiles: a tidy stack of split firewood logs in a low wooden frame, the cut ends facing the lower-right, a chopping stump with an axe stuck in it at the near end.
5. Writing desk, 1x1 tile: a small oak scribe's desk with a slanted top, a blank open ledger, an inkwell with quill, two blank scrolls, a lit candle in a brass holder and a small drawer (no writing).
6. Net rack, 1x1 tile: a freestanding wooden frame hung with drying fishing nets, floats and a coil of rope, with a woven fish basket at its foot.
7. Millstone, smaller than a tile: a hand quern, a round grey stone mill on a low wooden stand with a wooden handle, flour dusting the stone and a small sack of grain beside it.
8. Spinning wheel, 1x1 tile: an oak spinning wheel with a large spoked wheel, treadle and a distaff wrapped with white wool, a basket of fluffy fleece beside it.
9. Cooking hearth, 1x2 tiles: a low stone-and-brick cooking hearth with a hanging iron pot over a small fire, a trivet, a kettle, a ladle hanging on an iron hook and a short stack of logs beside it.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 6**: เหมือนชีทก่อน + ⑥ ม้านั่งช่างกับกองฟืนกว้าง 2 ช่อง ⑦ ไฟในเตาอบ/เตาผิงอยู่ในตัววัตถุ ไม่เรืองบนพื้นเขียว ⑧ ไม่มีตัวหนังสือบนสมุดและม้วนกระดาษ

---

## ชีท 5B · เตาผิงและแสงสว่าง (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `fireplace-stone` · `fireplace-grand` · `fireplace-pot` · `stove-iron` · `fire-tools` · `log-basket` · `floor-lamp` · `table-lantern` · `fire-pit`

ใช้แทน: เตาผิง (`hearth` 1×2 ติดผนังซ้าย) ในโรงแรม สมาคม บ้าน · เตาเหล็ก/โคมไฟเป็นของใหม่ · **เตาผิง 3 แบบแรกติดผนังที่พาดจากล่างซ้ายไปบนขวา ("/") หน้าเตาหันไปล่างขวา** (ต่างจากชีทอื่น ๆ ที่ของยาวพาดซ้ายบน→ขวาล่าง) เพราะเตาผิงในเกมติดผนังซ้าย

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (fireplaces, stoves and lamps): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no people. Every flame, ember and glow stays strictly inside the object's own silhouette and never spills onto the green background.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT (the fire opening, the lamp's open side) points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2. The floor footprint of one grid tile is a diamond twice as wide as it is tall. SPECIAL RULE for pieces 1, 2 and 3 (the fireplaces): each is built against a wall, so its long side (its width along the wall) runs from the LOWER-LEFT to the UPPER-RIGHT of the image, and only its front face (facing lower-right) and its top are seen; the back is flat against the wall and not shown.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. Fireplaces 1 and 3 cover a 1x2-tile footprint (two diamonds joined along the lower-left to upper-right direction), fireplace 2 covers 1x3 tiles along the same direction (so it is the widest piece, about 62% of the cell width at its footprint); every other piece covers 1x1 tile or less. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): simple fireplace with chimney breast about 1.3, grand fireplace about 1.5, fireplace with pot about 1.0, iron stove about 0.9 with its pipe going up to 1.6, fire tools stand about 0.6, log basket about 0.35, floor lamp about 1.3, table lantern about 0.25, fire pit about 0.4.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (stone blocks and mortar, soot, cast iron, wrought iron scrollwork, brass, wood grain, wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows and its own flickering firelight). Palette: warm grey and sand-coloured fieldstone, dark soot, black cast iron, brass, oak wood; the only saturated colour is the orange-red fire and embers inside the fireboxes and lamps, slightly desaturated overall so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Stone fireplace, 1x2 tiles, against a wall: a plain fieldstone fireplace with a chimney breast rising to the top of the cell, a wide arched firebox with a lit log fire, a simple stone mantel shelf with two clay mugs and a candle.
2. Grand fireplace, 1x3 tiles, against a wall: a wide carved-stone fireplace with a heavy oak mantel beam, a big firebox with a roaring log fire on iron firedogs, a chimney breast above it, a pair of crossed iron fire tools leaning at one side and a small stack of logs at the other.
3. Cottage fireplace with pot, 1x2 tiles, against a wall: a low brick-and-stone hearth with a small chimney, a black iron cooking pot hanging from a swing arm over a modest fire, a kettle on the hearth stone and a ladle hanging on a hook.
4. Cast-iron stove, 1x1 tile: a squat black iron wood stove on short legs with a small glowing door and a vent, a flat top with a kettle, a stove pipe rising up and out of the top of the cell.
5. Fire tools stand, 1x1 tile or less: a slim wrought-iron stand holding a poker, tongs, a small shovel and a brush, with a coil-tipped handle design.
6. Log basket, smaller than a tile: a round wicker basket stacked with split firewood logs, a few kindling sticks across the top.
7. Floor lamp, 1x1 tile or less: a tall wrought-iron stand with a scrolled foot, topped by a glass oil lantern with a small steady flame and brass trim.
8. Table lantern, tiny: a small tin-and-glass hand lantern with a ring handle and a candle flame inside, sitting on a short wooden base (meant to stand on a table).
9. Fire pit, 1x1 tile or less: a low ring of stones holding a small campfire of crossed logs with flames, a tripod of iron rods with a hanging cauldron over it.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 5B**: เหมือนชีทก่อน + ⑥ เตาผิง 3 ช่องแรก **ยาวพาดล่างซ้าย→บนขวา** (หน้าเตาหันล่างขวา) ⑦ เตาผิงยิ่งใหญ่กว้างที่สุดในชีท ⑧ เปลวไฟอยู่ในตัววัตถุ ไม่เรืองบนพื้นเขียว

---

## ชีท 12 · ของเล็กบนโต๊ะและต้นไม้ (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `tankards` · `plate-food` · `stew-pot` · `candles-cluster` · `book-scrolls` · `wine-set` · `plant-large` · `plant-fern` · `flower-vase`

ใช้แทน: ต้นไม้ในกระถาง (`plant` ที่ตอนนี้เป็นโค้ดวาด) · และเป็นของวางบนโต๊ะ/เคาน์เตอร์ใหม่ (ชิ้น 1–6 และ 9 เล็กมาก ให้วางซ้อนบนโต๊ะได้) · **ชิ้นเล็กวาดใหญ่เต็มช่องให้ชัด เกมย่อเอง**

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (small table props and potted plants): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no labels, no people. Flames stay inside the object's own silhouette and never spill onto the green.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2.

SCALE: pieces 1 to 6 and 9 are tiny tabletop props: draw each one LARGE, filling about 60% of its cell width, with its flat base (a small circle or square resting surface) centred horizontally at about 78% of the cell height. They will be shrunk a lot in the game, so keep their silhouettes bold and simple and their details readable at small size. Pieces 7 and 8 are floor-standing potted plants: they sit on a floor tile diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width, the pot centred at 78% of the cell height; the large plant is about 1.2 tile-widths tall and the fern about 0.7. Leave at least 10% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (pewter and glass highlights, glazed clay, leaf veins, wax, parchment, wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows). Palette: pewter and brass, glazed terracotta and cream ceramic, warm oak, leaf greens, muted red wine and amber ale, cream wax and parchment, slightly desaturated so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level).

CONTENT, row by row, left to right:
1. Tankards: three chunky pewter and wooden beer tankards of different heights, one with foam running over the rim, grouped tightly on a small round wooden tray.
2. Plate of food: a round pewter plate with a hunk of rustic bread, a wedge of cheese, two apples and a small knife.
3. Stew pot: a squat iron pot with a lid slightly open and steam wisps (kept short), a ladle in it and two small wooden bowls of stew beside it on a wooden board.
4. Candle cluster: three cream wax candles of different heights in a brass dish, melted wax drips, small steady flames (the only glow).
5. Books and scrolls: a neat stack of three leather-bound books with a brass-cornered top book, a rolled parchment scroll tied with a ribbon leaning on it (no writing).
6. Wine set: a glass wine bottle with a cork, a clay jug and two glazed goblets, one filled with deep red wine, on a small round tray.
7. Large potted plant, floor-standing: a big glazed terracotta pot with a lush broad-leaved indoor plant (green leaves, a few lighter new leaves), about 1.2 tile-widths tall.
8. Potted fern: a smaller cream-coloured ceramic pot with a bushy fern, about 0.7 tile-widths tall.
9. Flower vase: a small blue-and-cream ceramic vase with a bouquet of wildflowers (daisies, lavender, poppies).

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 12**: เหมือนชีทก่อน + ⑥ ชิ้นเล็กฐานแบนเรียบวางบนโต๊ะได้ ⑦ เปลวเทียนอยู่ในตัววัตถุ ⑧ ไม่มีตัวหนังสือบนหนังสือ/ม้วนกระดาษ ⑨ ต้นไม้ 2 ต้นสูงต่างกัน

---

## ชีท 14 · พื้นและผนัง (เทกซ์เจอร์ 3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `floor-wood` · `floor-wood-dark` · `floor-stone` · `floor-tile` · `floor-dirt` · `wall-plaster` · `wall-timber` · `wall-stone` · `wall-wood`

**ต่างจากชีทอื่นทั้งหมด**: ไม่ใช่วัตถุบนพื้นเขียว · ทุกช่อง**ถูกเติมเต็มสี่เหลี่ยมจรดขอบ ไม่มีพื้นเขียว ไม่มีขอบ ไม่มีเงา** · พื้นวาดมองตรงจากด้านบน (top-down แบนราบ ไม่ใช่ isometric) ส่วนผนังวาดมองตรงจากด้านหน้า (แบนราบ) · เกมจะดึงภาพไปวางบนพื้นและผนังตามมุมกล้องเองเหมือนพรม · ต้องต่อซ้ำได้เนียน (ขอบซ้าย-ขวาและบน-ล่างต่อกันได้)

```
A TEXTURE ATLAS for a 2.5D fantasy RPG: exactly 3 columns × 3 rows of equal square cells (9 cells). Every cell is COMPLETELY FILLED edge to edge with its own seamless, tileable material texture; there is no background, no green, no gap, no border, no frame, no grid line, no margin between cells. No text, no objects, no people, no shadows, no perspective, no lighting gradient, no vignette, no baked highlights from a light source: the lighting is perfectly flat and even so that the texture repeats without visible seams or brightness changes. Each texture must tile seamlessly: its left edge continues into its right edge, and its top edge continues into its bottom edge. Do not place any unique feature (a single stain, a single knot, a single crack) near the middle: keep the pattern evenly distributed so repetition is not obvious.

CAMERA: floor textures (cells 1 to 5) are seen perfectly flat from directly above (a flat top-down orthographic map of the floor, no perspective). Wall textures (cells 6 to 9) are seen perfectly flat from directly in front (a flat elevation of the wall surface, no perspective), with horizontal courses running exactly horizontal and vertical beams exactly vertical.

SCALE: the whole cell shows an area of floor or wall that is 2 game tiles wide and 2 game tiles tall. In that area: wooden planks are about 0.25 tile wide (eight planks across a cell) and 1 tile long with staggered joints; stone flags are about 0.7 tile square; the pale floor tiles are 0.5 tile square (four across a cell); wall stone blocks are about 0.5 tile long and 0.25 tile tall; timber-frame panels show a dark beam grid every 1 tile.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art and NOT photographic. Soft clean edges with thin soft dark-brown joint lines, rich but readable material detail (wood grain, nail heads, chiselled stone, mortar, plaster brushstrokes, wear). Palette: warm honey oak floors, dark walnut, warm grey fieldstone, cream plaster and soft sage-and-cream tiles, rammed earth browns; slightly desaturated and gently muted so the textures sit behind furniture without competing with it, and match the attached reference images and the previous sheets (same outline weight, same level of detail, same wood tone).

CONTENT, row by row, left to right:
1. Honey oak plank floor: even planks with staggered end joints, visible grain, a few nail heads, mild wear, medium brightness.
2. Dark walnut plank floor: the same layout in a darker brown, slightly more worn, lower brightness.
3. Grey flagstone floor: irregular rectangular flagstones in two or three greys with thin dark mortar lines and subtle chips.
4. Pale ceramic floor tile: square cream and sage-green tiles in a checker pattern with thin grout lines and subtle glaze variation.
5. Packed earth floor: tamped brown earth with scattered small pebbles, a few straw bits and faint footprints worn into it.
6. Plaster wall: cream lime plaster with soft trowel marks, fine hairline cracks and gentle mottling, no beams.
7. Timber-frame wall: cream plaster panels between a regular grid of dark oak beams (one beam square every 1 tile, vertical posts and horizontal rails, a diagonal brace in some panels), beam grain visible.
8. Stone block wall: warm grey stone blocks laid in running-bond courses with thin mortar joints, subtle colour variation between blocks.
9. Wood panel wall: vertical oak boards with thin gaps, a horizontal rail across the middle, nail heads and gentle grain.

Every cell is a full-bleed seamless square texture. No objects, no text, no ground plane, no scenery.
```

**ตรวจรับชีท 14**: ① ทุกช่องเต็มสี่เหลี่ยม ไม่มีเขียว ไม่มีขอบ ② ไม่มีเงา/แสงไล่ระดับ (ภาพต้องเรียบเสมอกัน) ③ ถ้าเอาช่องเดียวมาวางต่อกัน 2×2 แล้วขอบต่อกันเนียน ④ พื้นมองตรงจากบน ผนังมองตรงจากหน้า (ไม่เอียง)

---

## ชีท 15 · โรงเตี๊ยมและครัว (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `roast-spit` · `kitchen-table` · `barrel-rack` · `wine-rack` · `lute-stand` · `drum-stool` · `game-table` · `pot-rack` · `mead-cask`

ใช้ใน: โรงแรม · บ้านคนทำขนม · บ้านชาวบ้าน

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (a tavern and its kitchen): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no letters, no labels, no people. Nothing carries writing. Flames and glows stay inside the object's own silhouette and never spill onto the green.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2. The floor footprint of one grid tile is a diamond twice as wide as it is tall. The long side of every elongated piece runs from the upper-left to the lower-right of the image.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. The kitchen table, the barrel rack and the game table each cover a 2x1-tile footprint (two diamonds joined along the upper-left to lower-right direction); every other piece covers 1x1 tile or less. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): roast spit about 0.75, kitchen table about 0.5, barrel rack about 0.9, wine rack about 1.1, lute stand about 0.9, drum stool about 0.45, game table about 0.5, pot rack about 1.1, mead cask about 0.7.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (wood grain, iron hoops, glazed clay, brass, cloth, wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows). Palette: warm oak and honey-coloured wood, dark walnut, black iron, copper pots, deep red and cream cloth, muted green glass, slightly desaturated so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Roast spit, 1x1 tile: two forked iron uprights with a hand crank holding a skewered roast joint and a roasting bird above a small bed of glowing coals in an iron tray.
2. Kitchen table, 2x1 tiles: a long scrubbed oak prep table with a wooden chopping board, a cleaver, a heap of chopped vegetables, a rolling pin and a flour-dusted lump of dough, a lower shelf with bowls.
3. Barrel rack, 2x1 tiles: a sturdy timber cradle holding four wine barrels in two tiers with iron hoops and small wooden taps, the barrel ends facing the lower-right.
4. Wine rack, 1x1 tile: a tall oak lattice rack with diamond cubbies, each cradling a corked wine bottle lying on its side, a few empty cubbies.
5. Lute stand, 1x1 tile or less: a slim wooden floor stand cradling a round-backed lute with strings and a decorated sound hole, a small wooden stool beside it.
6. Drum stool, smaller than a tile: a round stool with a large hand drum with stretched skin and a tambourine resting on the seat, two drumsticks crossed on top.
7. Game table, 2x1 tiles: a long plank table with a worn chessboard with carved pieces on one half and scattered dice, playing cards and a few coins on the other half.
8. Pot rack, 1x1 tile: a freestanding iron frame with hooks holding copper pots, a frying pan, ladles and a string of onions and garlic.
9. Mead cask, 1x1 tile or less: a fat oak cask lying on a low wooden stand with a brass tap and a drip tray, a pewter tankard beneath the tap.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 15**: เหมือนชีทก่อน + ① ทุกชิ้นหันหน้าขวาล่าง พื้นเขียวล้วน ② ไม่มีตัวหนังสือบนกระดานหมากรุก/ไพ่ ③ ถังเหล้าองุ่น 2×1 พาดซ้ายบน→ขวาล่าง ④ ไฟถ่านอยู่ในตัววัตถุ

---

## ชีท 16 · ห้องสมุดและนักปราชญ์ (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `big-bookcase` · `reading-chair` · `globe-stand` · `telescope` · `alchemy-table` · `scroll-rack` · `astrolabe-table` · `specimen-cabinet` · `armchair-set`

ใช้ใน: บ้านนักเรียน/อาจารย์ · สมาคม · วิหาร

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (a scholar's study and small library): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no letters, no labels, no people. Nothing carries writing. Flames and glows stay inside the object's own silhouette and never spill onto the green.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2. The floor footprint of one grid tile is a diamond twice as wide as it is tall. The long side of every elongated piece runs from the upper-left to the lower-right of the image.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. The tall bookcase and the alchemy table each cover a 2x1-tile footprint (two diamonds joined along the upper-left to lower-right direction); every other piece covers 1x1 tile or less. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): big bookcase about 1.3, reading chair about 0.8, globe stand about 0.8, telescope about 1.2, alchemy table about 0.55, scroll rack about 1.0, astrolabe table about 0.6, specimen cabinet about 1.1, armchair set about 0.7.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (leather, brass instruments, glass flasks, parchment, wood grain, wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows). Palette: dark walnut and warm oak, aged brass, deep green and burgundy leather, cream parchment, clear glass with muted blue and amber liquids, slightly desaturated so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Big bookcase, 2x1 tiles: a wide floor-to-near-ceiling oak bookcase with five shelves packed with leather books of varied muted colours, rolled scrolls and a brass candlestick, a small library ladder on a rail at one side (no writing on spines).
2. Reading chair, 1x1 tile: a high-backed wooden chair with a deep-green padded seat and back, brass studs and a folded blanket over one arm, a small open book on the seat.
3. Globe stand, 1x1 tile: a large painted terrestrial globe in a carved wooden ring stand on a pedestal, simple continents and seas in muted colours (no names, no letters).
4. Telescope, 1x1 tile: a long brass telescope on a wooden tripod pointing diagonally up, leather grip bands, a brass eyepiece.
5. Alchemy table, 2x1 tiles: a long oak bench with glass flasks of coloured liquids, a copper still, a small burner with a flame, a mortar and pestle and a rack of vials.
6. Scroll rack, 1x1 tile: a floor-standing wooden pigeonhole rack holding many rolled scrolls tied with coloured ribbons and a few wax seals.
7. Astrolabe table, 1x1 tile: a small round table with a brass astrolabe, a brass armillary sphere, a compass and a rolled star chart (no letters).
8. Specimen cabinet, 1x1 tile: a glass-fronted wooden cabinet showing a small animal skull, pinned butterflies, shells, crystals and a jar with a pale preserved plant.
9. Armchair set, 1x1 tile or less: a cosy cushioned armchair with a small round side table holding a steaming teacup and a stacked pair of books, a footstool in front.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 16**: เหมือนชีทก่อน + ① ทุกชิ้นหันหน้าขวาล่าง พื้นเขียวล้วน ② ไม่มีตัวหนังสือบนสันหนังสือ/โลก/แผนที่ ③ ตู้หนังสือกับโต๊ะนักเล่นแร่กว้าง 2 ช่อง ④ เปลวไฟเตาในตัววัตถุ

---

## ชีท 17 · ของขายในร้านและโชว์สินค้า (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `weapon-display` · `armor-display` · `potion-display` · `jewel-case` · `tool-stand` · `cloth-shelf` · `rug-barrel` · `pack-rack` · `till-scale`

ใช้ใน: ร้านค้า · โรงตีเหล็ก · ตลาด

```
A GAME SPRITE ATLAS for a 2.5D fantasy RPG interior (a shop's merchandise displays): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no floor tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no letters, no labels, no people. Nothing carries writing. Flames and glows stay inside the object's own silhouette and never spill onto the green.

CAMERA (identical for every piece): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down at the object. Orthographic: all vertical edges stay perfectly vertical, parallel edges stay parallel, no perspective convergence, no fisheye, no vanishing points. Every piece is seen from the front-right: its FRONT points to the lower-right (south-east) of the image, so you see its top, its left-hand visible side (facing lower-left) and its right-hand visible side (facing lower-right). Horizontal edges slope at exactly 1:2. The floor footprint of one grid tile is a diamond twice as wide as it is tall. The long side of every elongated piece runs from the upper-left to the lower-right of the image.

SCALE (same in every cell): one floor tile = a diamond whose width is 31% of the cell width and whose height is 15.5% of the cell width. The cloth shelf and the weapon display each cover a 2x1-tile footprint (two diamonds joined along the upper-left to lower-right direction); every other piece covers 1x1 tile or less. The lowest ground-contact point of each piece is centred horizontally in its cell and sits at about 78% of the cell height, the same baseline in all nine cells. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. A standing adult would be about 1.25 tile-widths tall (use this to judge proportions): weapon display about 1.0, armor display about 1.2, potion display about 0.55, jewel case about 0.5, tool stand about 1.0, cloth shelf about 1.1, rug barrel about 0.7, pack rack about 1.0, till with scale about 0.35.

STYLE: refined hand-painted fantasy RPG game art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (polished steel, leather, folded cloth, glass, brass, wood grain, wear). Warm amber lighting from the upper-left front: top surfaces brightest, the left visible side lit, the right visible side in mid shadow, a thin warm rim light on the top edges. No cast shadow outside the object itself (the game draws its own shadows). Palette: warm oak and honey-coloured wood, dark walnut, steel and brass, indigo, russet and cream cloth, muted green and amber glass, slightly desaturated so the pieces match the attached reference images and the previous sheets (same outline weight, same detail level, same wood tone).

CONTENT, row by row, left to right:
1. Weapon display, 2x1 tiles: a long wooden wall-less display frame with two tiers holding swords, daggers, an axe, a mace and a short bow on pegs and cradles, clean visible blades.
2. Armor display, 1x1 tile: a wooden stand with a steel helmet on top, a breastplate on a bust form, a round shield and a pair of leather gauntlets hung on pegs.
3. Potion display, 1x1 tile: a small slanted-top oak table covered in rows of corked glass potion bottles in muted red, blue, green and amber on a cloth runner, no labels.
4. Jewel case, 1x1 tile: a low glass-topped oak counter case with velvet trays showing rings, amulets and gem pieces, brass corners.
5. Tool stand, 1x1 tile: a freestanding rack with hammers, saws, a shovel, a pickaxe, a coil of rope and a lantern hanging on pegs.
6. Cloth shelf, 2x1 tiles: a wide oak shelf unit with three tiers of neatly folded bolts of cloth in indigo, russet, green, cream and gold with a few spools of thread on top.
7. Rug barrel, 1x1 tile or less: a large barrel standing upright filled with several rolled-up rugs of different patterns and a stack of folded blankets leaning beside it.
8. Pack rack, 1x1 tile: a wooden rack with leather backpacks, a bedroll, a canteen, a coil of rope and a pair of boots hanging and resting on it.
9. Till with scale, smaller than a tile: a small wooden box with a brass balance scale with two pans, a few stacked coins, a small iron cash box and a hand bell.

Each piece is a complete object fully inside its own cell. No people, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท 17**: เหมือนชีทก่อน + ① ทุกชิ้นหันหน้าขวาล่าง พื้นเขียวล้วน ② ไม่มีตัวหนังสือบนฉลากขวดยา ③ ชั้นผ้ากับตู้แสดงอาวุธกว้าง 2 ช่อง ④ ใบมีดอาวุธเห็นชัด


---

# ชุดแมพผจญภัย (ชีท W1–W3)

---

## ชีท W1 · ต้นไม้และพืช (แมพผจญภัย) (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `oak-tree` · `oak-grove` · `pine-tree` · `snow-pine` · `dead-tree` · `swamp-willow` · `autumn-tree` · `bush-cluster` · `reeds`

ใช้ใน: ป่า · หิมะ · หนองน้ำ · ทุ่งหญ้า บนแผนที่ผจญภัย · **มุมกล้อง: มองจากด้านหน้า ยกกล้อง ~35° ไม่หมุนทแยง** (ต่างจากแมพย่อยที่เป็นไอโซเมตริก 2:1) เพราะแผนที่ผจญภัยเป็นพื้นมองจากบนและวัตถุตั้งบนพื้น

```
A GAME SPRITE ATLAS for the overland adventure map of a 2.5D fantasy RPG (a sheet of trees and plants): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no ground tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no letters, no labels, no people and no animals. Flames, smoke and glows stay inside or directly above the object and never spill onto the green.

CAMERA (identical for every piece): the classic fantasy overland-map view. The map ground is painted flat from above, and every object stands on it seen from the FRONT, from a camera about 35 degrees above the horizon, with NO diagonal rotation: the object's front faces straight toward the viewer (down the image), vertical edges are perfectly vertical, and you see the front face plus a little of the top. Orthographic: no perspective convergence, no fisheye. Each piece's ground-contact point is its bottom-centre, centred horizontally in its cell and sitting at about 80% of the cell height (the same baseline in all nine cells).

SCALE: One map hex is about 100 units wide. A single oak is about 38 units tall and 30 wide; the oak grove (three trees) about 50 units tall and 70 wide; the pine about 50 tall and 22 wide; the snow pine about 50 tall and 24 wide; the dead tree about 42 tall; the swamp willow about 44 tall and 40 wide; the autumn tree about 38 tall; the bush cluster about 18 tall and 40 wide; the reeds about 24 tall and 26 wide. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. Relative sizes between the pieces matter more than absolute sizes: the game rescales the whole sheet.

STYLE: refined hand-painted fantasy RPG map art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (bark, layered leaves and needles, snow clumps, moss, wear). Soft warm daylight from the upper-left front: tops and left sides lit, right sides in gentle shadow, a thin warm rim light on the upper edges. No cast shadow outside the object itself (the game draws its own soft shadows). Palette: leaf greens, deep conifer green, snow white, bare grey-brown wood, mossy olive, warm autumn orange and amber, gently desaturated so the pieces sit naturally on a muted painted ground of sage green, tan, grey and snow white, and match the attached reference images (same outline weight, same detail level).

CONTENT, row by row, left to right:
1. Oak tree: a single round-crowned broadleaf tree with a thick trunk and layered clumps of mid-green leaves, a few lighter leaves catching the light.
2. Oak grove: three oaks of different sizes grouped close together, overlapping crowns, the largest in the middle.
3. Pine tree: a tall conical dark-green conifer with drooping layered boughs and a slim brown trunk.
4. Snow pine: the same conifer shape covered in thick white snow on every bough, a little dark green showing between, a snowy base.
5. Dead tree: a gnarled leafless grey-brown tree with twisting bare branches and a split trunk, a few fallen twigs at its base.
6. Swamp willow: a drooping willow with long trailing curtains of grey-green leaves and hanging moss, thick knotted roots rising from a small patch of dark mud.
7. Autumn tree: a round-crowned broadleaf tree in warm orange, amber and red leaves with a few leaves falling nearby.
8. Bush cluster: a low cluster of three leafy shrubs of different greens with tiny pale flowers and a few red berries.
9. Reeds: a clump of tall green reeds and cattails with brown seed heads, two lily pads at the base on a small patch of dark water.

Each piece is a complete object fully inside its own cell. No people, no animals, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท W1**: ① พื้นเขียวล้วน ไม่มีเงา ② ทุกชิ้นหันหน้าตรง ไม่เอียงทแยง ③ ต้นไม้สูงกว่าพุ่มไม้ชัดเจน ④ ไม่มีสัตว์ ไม่มีคน

---

## ชีท W2 ✅ ใช้ในเกมแล้ว (v98.51) · เนิน ภูเขา และหิน (แมพผจญภัย) (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `hill-small` · `hill-large` · `mountain` · `mountain-snow` · `mountain-range` · `boulders` · `ice-spires` · `mesa-cliff` · `marsh-mound`

ใช้ใน: เนินเขา · ภูเขา · หิมะ · หนองน้ำ บนแผนที่ผจญภัย · **มุมกล้อง: มองจากด้านหน้า ยกกล้อง ~35° ไม่หมุนทแยง** (ต่างจากแมพย่อยที่เป็นไอโซเมตริก 2:1) เพราะแผนที่ผจญภัยเป็นพื้นมองจากบนและวัตถุตั้งบนพื้น

```
A GAME SPRITE ATLAS for the overland adventure map of a 2.5D fantasy RPG (hills, mountains and rock formations): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no ground tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no letters, no labels, no people and no animals. Flames, smoke and glows stay inside or directly above the object and never spill onto the green.

CAMERA (identical for every piece): the classic fantasy overland-map view. The map ground is painted flat from above, and every object stands on it seen from the FRONT, from a camera about 35 degrees above the horizon, with NO diagonal rotation: the object's front faces straight toward the viewer (down the image), vertical edges are perfectly vertical, and you see the front face plus a little of the top. Orthographic: no perspective convergence, no fisheye. Each piece's ground-contact point is its bottom-centre, centred horizontally in its cell and sitting at about 80% of the cell height (the same baseline in all nine cells).

SCALE: One map hex is about 100 units wide. The small hill is about 22 units tall and 55 wide; the large hill about 38 tall and 80 wide; the single mountain about 70 tall and 70 wide; the snowy mountain about 80 tall and 70 wide; the mountain range (three peaks) about 80 tall and 100 wide, the widest piece; the boulders about 24 tall and 50 wide; the ice spires about 45 tall and 50 wide; the mesa cliff about 40 tall and 70 wide; the marsh mound about 18 tall and 50 wide. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. Relative sizes between the pieces matter more than absolute sizes: the game rescales the whole sheet.

STYLE: refined hand-painted fantasy RPG map art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (layered rock strata, moss, grass tufts, snow drifts, ice facets, wear). Soft warm daylight from the upper-left front: tops and left sides lit, right sides in gentle shadow, a thin warm rim light on the upper edges. No cast shadow outside the object itself (the game draws its own soft shadows). Palette: sage and olive grass, warm tan rock, cool grey granite, snow white with pale blue shadows, ice blue, red sandstone, dark mud brown, gently desaturated so the pieces sit naturally on a muted painted ground of sage green, tan, grey and snow white, and match the attached reference images (same outline weight, same detail level).

CONTENT, row by row, left to right:
1. Small hill: a low rounded grassy mound with a few tufts, a small grey rock and a faint footpath on its flank.
2. Large hill: a broad rounded hill with grass on top and a rocky outcrop of layered tan stone breaking out of its side.
3. Mountain: a single steep grey granite peak with sharp faceted faces, a few tufts of pine at its foot and a bare rocky summit.
4. Snowy mountain: a tall steep peak with a white snow cap down to its middle, grey rock showing below, long blue-shadowed snow chutes.
5. Mountain range: three peaks of different heights joined at the base, the tallest in the middle with a snow cap, the two outer ones bare grey, a few dark pines along the foot.
6. Boulders: a cluster of five rounded grey boulders of different sizes with moss patches and small grass tufts between them.
7. Ice spires: a cluster of jagged pale blue-white ice crystals of different heights with frosty glints and a snow-dusted base.
8. Mesa cliff: a flat-topped red-tan sandstone butte with horizontal strata, a few scrubby bushes on top and rubble at its foot.
9. Marsh mound: a low mud-brown mound half sunk in dark water, patches of moss and algae, two half-submerged dead logs.

Each piece is a complete object fully inside its own cell. No people, no animals, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท W2**: ① พื้นเขียวล้วน ไม่มีเงา ② ทุกชิ้นหันหน้าตรง ③ เทือกเขากว้างที่สุดในชีท ④ ยอดหิมะมีเงาน้ำเงินอ่อน ไม่ใช่ขาวล้วน

---

## ชีท W3 ✅ ใช้ในเกมแล้ว (v98.52) · จุดสนใจและที่ตั้งถิ่นฐาน (แมพผจญภัย) (3×3 = 9 ช่อง)

ลำดับช่อง → ชื่อไฟล์: `village` · `town` · `harbor` · `watchtower` · `ruins` · `mine` · `den` · `frost-camp` · `standing-stones`

ใช้ใน: หมู่บ้าน เมือง ท่าเรือ ซากปรักหักพัง เหมือง ถ้ำ ค่ายหิมะ บนแผนที่ผจญภัย · **มุมกล้อง: มองจากด้านหน้า ยกกล้อง ~35° ไม่หมุนทแยง** (ต่างจากแมพย่อยที่เป็นไอโซเมตริก 2:1) เพราะแผนที่ผจญภัยเป็นพื้นมองจากบนและวัตถุตั้งบนพื้น

```
A GAME SPRITE ATLAS for the overland adventure map of a 2.5D fantasy RPG (settlements and points of interest): exactly 3 columns × 3 rows of equal square cells (9 cells), one isolated piece per cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no vignette, no ground tile, no shadow or glow on the background). No visible cell borders or grid lines, no text, no letters, no labels, no people and no animals. Flames, smoke and glows stay inside or directly above the object and never spill onto the green.

CAMERA (identical for every piece): the classic fantasy overland-map view. The map ground is painted flat from above, and every object stands on it seen from the FRONT, from a camera about 35 degrees above the horizon, with NO diagonal rotation: the object's front faces straight toward the viewer (down the image), vertical edges are perfectly vertical, and you see the front face plus a little of the top. Orthographic: no perspective convergence, no fisheye. Each piece's ground-contact point is its bottom-centre, centred horizontally in its cell and sitting at about 80% of the cell height (the same baseline in all nine cells).

SCALE: One map hex is about 100 units wide. The village is about 38 units tall and 70 wide; the walled town about 55 tall and 90 wide, the largest piece; the harbor about 40 tall and 85 wide; the watchtower about 55 tall and 40 wide; the ruins about 36 tall and 70 wide; the mine entrance about 34 tall and 60 wide; the den about 34 tall and 60 wide; the frost camp about 30 tall and 65 wide; the standing stones about 28 tall and 60 wide. Houses are about 14 units tall, so people (never drawn) would be about 5. Leave at least 8% empty margin around every piece; nothing touches the cell edges or overlaps a neighbouring cell. Relative sizes between the pieces matter more than absolute sizes: the game rescales the whole sheet.

STYLE: refined hand-painted fantasy RPG map art, NOT pixel art. Crisp clean edges with thin soft dark-brown outlines, rich but readable material detail (thatch, timber framing, stone blocks, moss, rope, canvas, wear). Soft warm daylight from the upper-left front: tops and left sides lit, right sides in gentle shadow, a thin warm rim light on the upper edges. No cast shadow outside the object itself (the game draws its own soft shadows). Palette: warm thatch and terracotta roofs, cream plaster, grey stone, dark oak timber, canvas white and red, snow white, muted green moss, gently desaturated so the pieces sit naturally on a muted painted ground of sage green, tan, grey and snow white, and match the attached reference images (same outline weight, same detail level).

CONTENT, row by row, left to right:
1. Village: a cluster of four small timber-framed cottages with thatched and tiled roofs, a stone well, a small fenced garden and a thin curl of chimney smoke.
2. Walled town: a compact town ringed by a crenellated grey stone wall with two corner towers and a wooden gate, tiled roofs and a tall keep with a blue pennant rising inside.
3. Harbor town: a few weathered houses on stilts and a wooden jetty reaching into a small patch of blue water with two moored rowing boats and a stack of crates.
4. Watchtower: a tall round grey stone watchtower with a wooden lookout platform and a red banner, a low palisade of sharpened logs at its base.
5. Ruins: a broken grey stone arch, two crumbling wall sections and fallen blocks overgrown with ivy and moss, a dark empty doorway.
6. Mine entrance: a timber-framed tunnel mouth cut into a rocky hillside, a wooden ore cart on short rails in front, a lantern on a post and piles of grey rubble.
7. Monster den: a dark cave mouth in a mossy rock face ringed with scattered bones, claw marks on the stone and a few dead branches (no animals drawn).
8. Frost camp: three small canvas tents half-covered in snow around a dead fire pit with a ring of stones, a wooden signpost and sled with packs, no people.
9. Standing stones: a circle of seven tall weathered grey megaliths with a flat altar stone in the middle, moss and lichen on the stones, a few wildflowers at their feet.

Each piece is a complete object fully inside its own cell. No people, no animals, no text, no ground, no scenery, no opaque background.
```

**ตรวจรับชีท W3**: ① พื้นเขียวล้วน ไม่มีเงา ② ทุกชิ้นหันหน้าตรง ไม่เอียงทแยง ③ เมืองมีกำแพงใหญ่ที่สุดในชีท ④ ไม่มีคนและสัตว์ (ถ้ำมีแค่กระดูก) ⑤ ควันออกจากปล่องเท่านั้น

---

## ชีท W4 · ไทล์ป่าและพื้นที่ธรรมชาติ (แมพผจญภัย · แบบเดียวกับ W2/W3)

ลำดับช่อง → ชื่อไฟล์: `grassland` · `flower-meadow` · `forest-light` · `forest-dark` · `pine-forest` · `snow-forest` · `autumn-forest` · `swamp` · `sand-dunes`

**เหตุผล**: ต้นไม้เดี่ยวมุมตรงหน้า (W1) เล็กเกินบนแผนที่ ไทล์หกเหลี่ยมที่มีป่าทั้งช่องในภาพเดียว (ไอโซเมตริก เหมือนเนิน W2 และจุดสนใจ W3) จะดูสวยและกลืนกันกว่า · เกมวางเป็นไทล์ตามชนิดพื้นที่ สุ่มกลับด้านซ้ายขวาเพื่อไม่ให้ซ้ำ

```
A GAME SPRITE ATLAS of terrain tiles for the overland adventure map of a 2.5D fantasy RPG: exactly 3 columns × 3 rows of equal square cells (9 cells), one isometric hexagonal terrain tile per cell, each tile centred in its cell, on a perfectly flat pure chroma-green #00FF00 background in every cell (no gradient, no texture, no shadow or glow on the background). No visible cell borders or grid lines, no text, no letters, no labels, no people, no animals, no buildings, no roads, no rivers.

CAMERA (identical for every tile): 2:1 isometric (dimetric) game camera, elevated 30 degrees above the horizon, looking diagonally down. Orthographic: vertical edges stay vertical, no perspective convergence. Each tile is a regular hexagon with a vertex pointing up (pointy-top), seen in this isometric view so it appears as a flattened hexagon about 1.15 times as wide as it is tall. The ground has NO thickness, NO side walls and NO outline: it is a flat painted surface whose edge fades softly into the green, so neighbouring tiles can be laid side by side and blend. Nothing may stick out past the hexagon edge except the very tops of the tallest trees, which may rise above the upper edge.

SCALE: every hexagon is exactly the same size and fills about 86% of the cell width, centred in the cell. Relative sizes: a tree on any tile is about 22% of the tile width tall (small, like a view from afar), so a forest tile holds around 12 to 16 trees in a loose natural scattering, never in rows. Tiles must not look cut out: the ground colour is continuous to the hexagon edge.

STYLE: refined hand-painted fantasy RPG map art, NOT pixel art, matching the attached terrain and landmark tiles (same outline weight: thin soft dark-brown outlines on objects only, never on the tile edge; same level of detail, same soft warm daylight from the upper-left, tops and left sides lit). No cast shadow outside the tile. Palette: muted sage and olive greens, deep conifer green, warm tan sand, snow white with pale blue shadows, dark mud and teal water, autumn orange and amber, gently desaturated so tiles of different types sit together on one painted map.

CONTENT, row by row, left to right:
1. Grassland: an open meadow of short sage-green grass with subtle lighter and darker patches, a few tufts and two tiny grey stones, no trees.
2. Flower meadow: the same grass with many small white, yellow, purple and pink wildflowers scattered in drifts and a few taller grass clumps, no trees.
3. Light broadleaf forest: about twelve round-crowned oak and birch trees of varied sizes loosely scattered over mid-green grass with small bushes between them.
4. Dark dense forest: about sixteen tall broadleaf and fir trees packed close with overlapping crowns, deep green with shadowed undergrowth and fallen logs between them.
5. Pine forest: about fourteen tall dark-green conifers of varied heights scattered over a ground of brown needles and moss with a few grey rocks.
6. Snow forest: about twelve snow-laden pines over a white snow-covered ground with pale blue shadows, small snow drifts and a few bare shrubs.
7. Autumn forest: about twelve round-crowned trees in orange, amber, red and yellow leaves over a ground covered with fallen leaves and some green grass.
8. Swamp: dark muddy ground with patches of teal water and algae, clumps of reeds and cattails, lily pads, three drooping willows and two dead trees.
9. Sand dunes: warm tan sand with soft rippled dunes, scattered dry grass tufts, a few smooth stones and two small palm trees.

Each tile is a complete hexagon fully inside its own cell. No text, no scenery outside the hexagon, no opaque background.
```

**ตรวจรับชีท W4**: ① ไทล์หกเหลี่ยมเท่ากันทุกช่อง พื้นเขียวล้วนรอบนอก ② ขอบไทล์ไม่มีเส้นขอบและไม่มีความหนา ③ ต้นไม้เล็ก กระจายธรรมชาติ ไม่เรียงแถว ④ ไม่มีสิ่งก่อสร้าง ถนน แม่น้ำ

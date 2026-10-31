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
| 3 | ของเก็บ: ลัง · ถัง · ถังเล็ก (keg) · ตะกร้า · หีบ · ตู้เตี้ย · ชั้นสูง (shelfbox) · ชั้นวางอาวุธ/เครื่องมือ | ทุกห้อง |
| 4 | ห้องนอนและพรม: เตียง · เตียงผู้ป่วย · หีบปลายเตียง · พรมหลายขนาด (3×3 · 4×3 · ทางเดิน 1×7) | บ้าน · สถานพยาบาล · โรงแรม |
| **5A (โรงตีเหล็ก — ทำก่อนตามที่ขอ)** | โรงตีเหล็ก: เตาหลอม 2×2 · ทั่ง · ถังชุบ · เครื่องสูบลม · หินลับ · โต๊ะช่างพร้อมปากกาจับ · ถังถ่าน · กองแท่งเหล็ก · เตาไฟเปิด | โรงตีเหล็ก · บ้านช่างตีเหล็ก |
| 5 | เตาและไฟ: เตาผิง 1×2 · เตาหลอม 2×2 · ทั่ง · ถังชุบ · เตาอบขนมปัง · เตาผิงมีหม้อ | โรงแรม · โรงตีเหล็ก · บ้านคนทำขนม |
| 6 | งานฝีมือ: กี่ทอผ้า · ม้านั่งช่าง · กองฟืน · โต๊ะเขียนหนังสือ · ชั้นหนังสือ · ตาข่าย · เครื่องโม่ | บ้านชาวบ้านตามอาชีพ |
| 7 | วิหาร: แท่นบูชา · รูปปั้น · ม้านั่งยาวพร้อมพนัก (pew) · เชิงเทียนพื้น · เชิงเทียนยืน | วิหาร |
| 8 | สถานพยาบาล: ครกบด · ขวดโหล · ชั้นสมุนไพร · ถาดยา · เก้าอี้หมอ · ผ้าพันแผลม้วน | สถานพยาบาล |
| 9 | ตลาด: แผงขาย 4 สีผ้าหลังคา · กองผลไม้/ผัก · ตะกร้าผลผลิต · ป้ายราคา (ไม่มีตัวหนังสือ) | ตลาด |
| 10 | สมาคม: กระดานรับงาน · ถ้วยรางวัล · เขากวางติดผนัง · ธงสมาคม · ดาบไขว้ติดผนัง · โต๊ะลงทะเบียน | สมาคมนักผจญภัย |
| 11 | ของติดผนัง: หน้าต่าง (กลางวัน/กลางคืน) · หน้าต่างกระจกสี · ชั้นติดผนัง · กระดานข่าว · ธง | ทุกห้อง |
| 12 | ของเล็กบนโต๊ะ: แก้ว · จาน · เทียน · หนังสือ · ขวด · หม้อ · ตะเกียง (ใช้วางบนเฟอร์นิเจอร์ได้) | ทุกห้อง |
| 13 | ไร่: โรงนา · กระท่อม · เล้าไก่ · รางน้ำสัตว์ · บ่อน้ำ · หุ่นไล่กา · กองฟาง · รั้ว · ป้ายบอกทาง · กองปุ๋ย | ไร่ (กลางแจ้ง) |
| 14 | พื้นและผนัง (เทกซ์เจอร์ต่อเนื่อง): พื้นไม้กระดาน · พื้นหิน · พื้นกระเบื้อง · ผนังปูนขาว · ผนังไม้ครึ่งปูน · ผนังหิน | ทุกห้อง |

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

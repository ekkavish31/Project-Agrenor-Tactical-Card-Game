# พรอมต์ชีท Asset ภายในแมพย่อย (ทีละชีท)

เป้าหมาย: วาดของในแมพย่อย (โรงแรม · ร้านค้า · วิหาร · ตลาด · สถานพยาบาล · โรงตีเหล็ก · สมาคม · บ้านชาวบ้าน · ไร่) เป็นภาพวาดมือแทนของที่ตอนนี้ใช้โค้ดวาด ให้สไตล์เดียวกับอาคารในหมู่บ้าน

วิธีใช้: เจนทีละชีท · ทุกชีทแนบ **ภาพอ้างอิงสไตล์** ไปด้วย (`assets/village-town/inn.webp` · `assets/village-town/shop.webp` · `assets/objects/house-01.webp`) และตั้งแต่ชีท 2 แนบชีทที่ผ่านแล้วเพื่อให้สีไม้และระดับรายละเอียดตรงกัน · เสร็จแล้วตัดทีละช่องใน Asset Studio

## ข้อมูลจากเกม (ใช้กำหนดมุมกล้องและขนาด)

- **มุมกล้อง**: isometric แบบ 2:1 (dimetric) · ช่องพื้น 1 ช่อง = ข้าวหลามตัดกว้าง:สูง = 2:1 (68×34 px ในห้อง) · กล้องยกสูง **30°** เหนือขอบฟ้า · เส้นขอบแนวนอนลาดเอียง 1:2 พอดี · เส้นตั้งต้องตั้งตรงเสมอ (ไม่ใช่มุมมองเพอร์สเปกทีฟ)
- **ทิศ**: แกน u ชี้ลงขวา (SE) · แกน v ชี้ลงซ้าย (SW) · ของในห้องหันหน้าไป **SE** (ล่างขวา) · เกม**กลับภาพซ้าย-ขวา**ให้เองเมื่อต้องหัน SW → วาดแค่ทิศ SE ทิศเดียว · ของยาวให้ด้านยาวพาดจากบนซ้ายไปล่างขวา (กลับภาพแล้วจะพาดอีกแกน)
- **ของติดผนัง**: ผนังหลัง (แกน u) หันหน้าห้องไป SW · ผนังซ้าย (แกน v) หันหน้าห้องไป SE → ชีทของติดผนังวาดแบบแปะผนังหัน SE ไว้ก่อน (ผนังอีกด้านใช้ภาพกลับด้าน)
- **สเกล**: ตัวละครสูงราว 1.45 เท่าของความกว้างช่องพื้น · โต๊ะสูง ≈ 0.55 · เก้าอี้บาร์ ≈ 0.62 · สตูล ≈ 0.4 (หน่วยเป็นความกว้างช่องพื้น)
- **ไม่วาดเงาตกพื้น**: เกมวาดเงาและแสงเองด้วยโค้ด (แสงคบไฟ หน้าต่าง กลางวัน-กลางคืน)
- **พื้นหลัง**: เขียวล้วน `#00FF00` เรียบ ๆ ไม่มีไล่สี ไม่มีเงา (Asset Studio ลบพื้นเขียวให้) · ถ้าเครื่องมือเจนรองรับพื้นโปร่งใสจริง ให้ใช้ได้เลย

## สไตล์ (ใช้ซ้ำทุกชีท)

วาดมือแฟนตาซีสำหรับเกม RPG **ไม่ใช่ pixel art** · ขอบคมสะอาด เส้นขอบบางสีน้ำตาลเข้มนุ่ม · รายละเอียดวัสดุชัดแต่อ่านง่าย (ลายไม้ หัวตะปู แถบเหล็ก รอยสึก) · แสงอุ่นสีอำพันจากซ้ายบนด้านหน้า (ผิวบนสว่างสุด · ด้านซ้ายที่เห็นสว่าง · ด้านขวาที่เห็นอยู่ในเงากลาง ๆ) · โทนไม้โอ๊กสีน้ำผึ้ง ไม้วอลนัตเข้มเป็นจุดเน้น เหล็กดัด เขียวป่าและแดงสนิมใช้เล็กน้อย สีอมเทานิดหน่อยให้เข้ากับเมืองไม้ครึ่งปูนหรูแบบยุคกลาง

## แผนชีททั้งหมด (14 ชีท)

| ชีท | เนื้อหา | ใช้ในห้อง |
|---|---|---|
| **1** | โต๊ะและที่นั่ง: โต๊ะกลม · โต๊ะเหลี่ยม · โต๊ะยาว · สตูล · เก้าอี้ · ม้านั่งยาว · สตูลบาร์ · โต๊ะข้าง · ถังไวน์ใช้เป็นโต๊ะ | โรงแรม · สมาคม · บ้าน · วิหาร |
| 2 | เคาน์เตอร์และเวที: เคาน์เตอร์บาร์ (ช่วงตรง · มุม · ปลาย) · เคาน์เตอร์ร้าน · เวทีเล็ก · บันได | โรงแรม · ร้าน · สถานพยาบาล · สมาคม |
| 3 | ของเก็บ: ลัง · ถัง · ถังเล็ก (keg) · ตะกร้า · หีบ · ตู้เตี้ย · ชั้นสูง (shelfbox) · ชั้นวางอาวุธ/เครื่องมือ | ทุกห้อง |
| 4 | ห้องนอนและพรม: เตียง · เตียงผู้ป่วย · หีบปลายเตียง · พรมหลายขนาด (3×3 · 4×3 · ทางเดิน 1×7) | บ้าน · สถานพยาบาล · โรงแรม |
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

พิมพ์ "ชีทถัดไป" แล้วผมส่งพรอมต์ชีท 2 ให้

# Prompt เจนภาพบทนำ New Game ที่ยังขาด (7 ภาพ)

> เขียน 7 พ.ย. 2026 ให้ตรงกับบทใน `js/new-game-prologue-kit.js` (Kit v2) และข้อกำหนดใน `docs/NEW-GAME-PROLOGUE-KIT.md` · ภาพที่ได้แล้วอยู่ใน `assets/new-game-prologue/images/` · เมื่อได้ภาพ ใส่ไฟล์ตามชื่อด้านล่างแล้วเพิ่มรหัสใน `APPROVED_IMAGES`

## ข้อกำหนดร่วมทุกภาพ (ย้ำก่อนเจน)
- 16:9 ขนาด 1920×1080 · ไม่มีตัวอักษร ป้าย ลายน้ำ โลโก้ หรือ UI ในภาพ
- เนื้อหาสำคัญอยู่เหนือกึ่งกลางภาพ · ส่วนล่าง ~30% ให้โล่ง/มืดกว่า เพราะมีข้อความบทพูดทับ
- ห้ามมีตัวละครเห็นหน้าที่อาจถูกมองเป็นตัวเอก (ตัวเอกเลือกเพศ/หน้าตาเอง)
- ไม่เผยต้นกำเนิดผู้คน ไม่ตั้งชื่อเมือง/เผ่า/เทพ ไม่แสดงเทพปรากฏกาย ไม่ใส่ภาษา Vaelari/จารึกอ่านออก
- ดวงทอง (Elukhor) = ดวงแสงสีทองกลมๆ ลอยค้างบนฟ้า ให้แสงอบอุ่น ไม่ใช่ลางร้าย · จันทร์ม่วง Yvarn ใช้เฉพาะฉากกลางคืน

## บล็อกสไตล์ (วางต่อท้ายทุก prompt)
```
Painterly high-fantasy illustration in the style of a Japanese JRPG key visual, warm golden-hour palette, soft volumetric light rays, rich saturated greens and amber, visible painterly brush texture, highly detailed, cinematic wide composition, 16:9 landscape, 1920x1080, consistent lighting with a warm gold sun-like orb, clean lower third kept calm and slightly darker for subtitle space, no text, no letters, no watermark, no logo, no UI, no signature
```

## Negative prompt (ใช้ได้ทุกภาพ)
```
text, letters, captions, watermark, signature, logo, UI, frame, border, close-up face of a protagonist, modern objects, guns, anime chibi, photo-realistic skin, blurry, low resolution, extra limbs, deformed hands, oversaturated neon, map labels
```

---

## W01 · โลก Agrenor → `world-panorama.webp`
บท: "โลกแห่ง Agrenor... ผืนพิภพอันกว้างใหญ่ ที่ดวงทองลอยค้างส่องแสงอบอุ่นเหนือขุนเขาและสายน้ำ"
```
Epic aerial panorama of a vast fantasy world seen from high above the clouds: snowy mountain ranges fading into the far north, a great river winding through green plains and a large lake in the middle, deep forest on the far east, archipelago glints on the western sea, a hint of volcanic haze far south. A single large golden glowing orb (not a normal sun) hangs among soft clouds, casting warm gold light and long light rays across the land. No cities with visible names, no map overlay, no borders. Sense of endless scale and mystery.
```

## W02 · ดินแดนเหนือ → `northern-snowlands.webp`
บท: "ทางเหนือ ผืนหิมะและขุนเขาอันหนาวเหน็บทอดยาวไกล / ชีวิตเรียนรู้ที่จะดำรงอยู่ท่ามกลางความเย็นยะเยือก"
```
Vast frozen northern snowlands at golden hour: endless snow fields, jagged blue-white mountains, wind-swept pines half buried in snow, a frozen river, thin smoke rising from a tiny distant stone-and-fur hut, a herd of shaggy cold-climate animals walking in a line far away, a pair of small distant figures in thick furs (silhouettes only, no faces). The golden orb low on the horizon tints the snow pale gold and rose. Cold air, breath mist, quiet survival, beauty and harshness.
```

## W03 · หมู่เกาะตะวันตก → `western-archipelago.webp`
บท: "ทางตะวันตก ท้องทะเลโอบล้อมหมู่เกาะน้อยใหญ่ / เป็นเส้นทางของเรือ ผู้คน และเรื่องเล่าจากฝั่งไกล"
```
A sparkling western sea dotted with many small and large green islands, white sandy coves and rocky cliffs, a small harbor town of whitewashed houses with orange roofs on one island (no readable signs, no named city), several wooden sailing ships with cream sails crossing between the islands, seabirds, gentle waves catching the golden light of a glowing gold orb in a warm sky with scattered clouds. Feeling of trade routes, journeys and stories from far shores.
```

## W04 · ดินแดนใต้ → `southern-firelands.webp`
บท: "ทางใต้ เปลวไฟและขุนเขาหล่อหลอมภูมิประเทศอีกแบบหนึ่ง / แม้ผืนดินจะแตกต่าง ชีวิตก็ยังค้นหาหนทางของตน"
```
A dramatic southern volcanic valley: black and red-brown rock, a distant volcano with a glowing crater and a thin ash plume, rivers of slow orange lava glowing in cracks of the ground, steaming hot springs, hardy red-leaved shrubs and dark-green grass growing in the warm soil showing life persisting, a small group of distant travelers with pack animals walking a ridge path (silhouettes, no faces). Heat haze shimmer, sky in deep amber and violet, the golden orb partly veiled by ash clouds.
```

## W05 · มหาพงไพรตะวันออก → `eastern-great-forest.webp`
บท: "ส่วนทางตะวันออก มหาพงไพรทอดตัวไกลเกินขอบแผนที่ / ภายใต้ร่มไม้ยังมีเรื่องราวที่โลกภายนอกไม่อาจยืนยัน"
```
Overlooking a colossal ancient forest from a mountain pass: an endless sea of giant treetops stretching beyond the horizon, enormous trees far taller than normal trees rising above the canopy, low mist between the crowns, shafts of golden light breaking through, flocks of birds, a dark mysterious feeling in the deep shadows under the trees but still beautiful. A tall mountain wall in the foreground edge frames the view. No ruins visible, only a faint suggestion of something old hidden far in the depths (a barely visible pale spire in the mist). No people.
```

## W06 · ผู้คนหลายอารยธรรม → `civilizations.webp`
บท: "แต่โลกไม่เคยหยุดรอ บนดินแดนอันแตกต่าง ผู้คนหลายเผ่าพันธุ์สร้างบ้านเมือง / ความเชื่อ ภาษา และวิถีชีวิตของตนเองขึ้นมา"
```
A wide elevated view of several clearly different settlements in different landscapes, each with its own architecture and way of life, separated by terrain rather than gathered in one city: a stilt-house village on a lake with reed boats; a terraced stone hill town with tall towers; a nomad camp of colorful round tents on grassland; a timber longhouse village at the edge of a pine forest with smoke rising; a sun-baked adobe town in dry hills. Tiny distant villagers of varied silhouettes and clothing going about daily life (no close-ups, no named species, no distinguishing monster features). Different banners and colors per settlement, no readable writing. Warm afternoon light from a golden orb, sense of many cultures coexisting at the same time.
```

## W10 · มนุษย์อ่อนแอกว่า การ์ดช่วยให้เดินทางไกล → `traveler-card.webp`
บท: "มนุษย์อ่อนแอกว่าเผ่าพันธุ์อื่น การ์ดเวทจึงช่วยให้พวกเขาก้าวข้ามอันตรายระหว่างทาง เดินทางไกลได้มากขึ้น"
```
A lone human traveler seen from far behind and slightly below, small against the landscape, standing on a dark dangerous forest road at night, hooded travel cloak and satchel, gender-neutral silhouette, hood up, face never visible. In their raised hand a magic card glows with blue-white circuit lines and a faint circle of protective light spreads on the ground around them, keeping back dark shadowy animal shapes with faint glowing eyes at the tree line. A large pale violet moon rises behind twisted trees. Cold blue-violet night palette with the warm blue-white card light as the only bright point. Tense yet hopeful.
```

---

## วิธีใช้ผลลัพธ์
1. เซฟเป็น WebP ตามชื่อไฟล์ข้างหัวข้อ ไว้ที่ `assets/new-game-prologue/images/`
2. เพิ่มรหัสหน้า (`W01`, `W02`, … `W10`) ใน `APPROVED_IMAGES` ที่ `js/new-game-prologue-kit.js`
3. หน้าที่ได้ภาพแล้วจะเลิกขึ้น "Waiting for Pic" และใช้ลูกเล่นเปลี่ยนภาพของหน้านั้นอัตโนมัติ

# เพื่อนร่วมทีมหญิงใหม่ 2 คน: นาเดีย และ แอช · ดีไซน์ + พรอมต์ภาพ

ทั้งสองคนมีอยู่ในเกมแล้วเป็น NPC (`js/village-life.js`: นิสัย เรื่องเดิม บทพูด ตารางเวลา) แต่ **ยังไม่มีภาพสำหรับต่อสู้/เดิน** และแอชยังชวนร่วมทีมไม่ได้ · เอกสารนี้ออกแบบให้ต่างจาก **ลูน่า** ชัดเจน และเป็นพรอมต์ภาพชุดเดียวกับ `docs/PROMPTS-HERO-IDLE-MALE.md`

ภาพทั้งหมดเป็นพรอมต์สำหรับเครื่องมือสร้างภาพภายนอก (ผู้ใช้เป็นคนสร้าง/ส่งภาพ) · **กติกากล้อง 4 ทิศ ผืน 384×384 พื้นเขียว #00FF00 เท้าที่ y≈376 หัวกว้าง ≈112 px มือว่างไม่ถือของ** ใช้ตามไฟล์ตัวเอกชายทุกข้อ (ไม่ซ้ำที่นี่) · สไตล์ตาม `docs/STYLE-GUIDE.md`
แนบภาพอ้างอิงทุกคำขอ: **ลูน่า** (`assets/allies/luna.webp`) เพื่อให้ลายเส้นและโทนภาพเข้ากัน แต่สั่งชัดว่า "ดีไซน์ต่างกันโดยสิ้นเชิง" (อยู่ในพรอมต์แล้ว)

## เทียบกับลูน่า

| | ลูน่า (ที่มีอยู่) | **นาเดีย** | **แอช** |
|---|---|---|---|
| ภาพรวม | นักวิชาการ นุ่ม เงียบ | นักย่องเบา คมและว่องไว | นักล่าค่าหัว เปิดเผยและมั่นใจ |
| รูปร่าง | เรียวบาง ปกติ | **เล็กกระชับ** เตี้ยกว่าตัวเอกเล็กน้อย | **สูง ไหล่กว้าง นักกีฬา** สูงที่สุดในทีมหญิง |
| ผม | ม่วงอ่อน/ชมพูอ่อน ยาวสยาย ใส่ฮู้ด | **ดำสนิท** รวบหางม้าสูง ผ้าโพกหัวแดงเข้ม | **บลอนด์ทราย** ยาว รวบครึ่งหัวด้วยผ้าโพกสีน้ำตาล |
| สีหลัก | น้ำเงิน ม่วงอ่อน (เย็น) | **เทาถ่าน แดงเข้ม ม่วง** + เงินนิดเดียว (เย็นแต่มีแสงขอบอุ่น) | **แดงสนิม น้ำตาล ครีม ทอง** (อุ่นฉูดฉาด) |
| ชุด | เสื้อคลุมยาว ฮู้ด | แจ็กเก็ตสั้นคอสูง ผ้าคลุมครึ่งตัวสีม่วงเข้ม ถุงมือครึ่งนิ้ว | โค้ตยาวเปิดหน้า ม้วนแขนเสื้อ ผ้าคลุมพาดไหล่ข้างเดียว |
| จุดเด่นให้จำ | ไม้เท้า/จารึก | **แหวนเงินห้อยสร้อย** (ลือว่าขโมยแหวนเจ้าเมือง) | **รอยขีดนับค่าหัวบนสนับแขนซ้าย** + ใบประกาศจับพับเสียบเข็มขัด |
| สีหน้า | จริงจัง ช่างสงสัย | ยิ้มเยาะ ตาคม | ยิ้มกว้าง โอ้อวด |
| บทบาทในสนาม | นักเวทยิงไกล 4 ช่อง | ลอบตี/โจมตีด้านข้างและหลัง | ดวลหน้าสนามช่วงประชิด |
| ธาตุ (เสนอ) | ผสาน | **Dephor ราตรี** | **Caelim ไฟ** |

## นาเดีย (Nadia) · 22 ปี · นักย่องเบาเร่ร่อน
ข้อมูลเดิมในเกม: โผล่เฉพาะกลางคืนที่มุมโรงแรม · ยิ้มเยาะ ไว้ใจใครยาก นับถือแค่คนที่เก่งกว่า · ชวนร่วมทีมด้วย **การดวล** ("ข้าไม่ตามใครที่ข้าล้มได้") · มีดสั้น (`recruit:'duel'`)
สกิลประจำตัวมีอยู่แล้วใน `js/flat-battle.js`: **แทงเงา** (ประชิด 26 ดาเมจ)

### พรอมต์หลัก (วางครั้งเดียว ใช้กับทุกทิศ)
```
Full-body character sprite of a young female rogue companion for a cozy fantasy tactics RPG, semi-chibi anime proportions (about 3.5 heads tall), slim and agile build, slightly shorter than the male hero. Same art style as the attached reference character (Luna) but a COMPLETELY DIFFERENT design: clean line art, cel-shaded with soft warm lighting from the upper left, polished painterly game-sprite quality. She has a sly confident smirk and sharp violet-amber eyes fully visible, long jet-black hair in a high ponytail with a few loose bangs, a crimson bandana tied across the forehead, a fitted charcoal short jacket with a high collar and small silver buckles, a short dark-violet half-cape over the left shoulder, fingerless dark gloves, a wide belt with small pouches, dark leggings and soft knee-high boots. A small silver ring hangs on a thin chain around her neck. Palette: charcoal, crimson, violet and a touch of silver, cool and shadowy but clearly readable, with a warm amber rim light. Both hands empty and relaxed, no weapons visible (weapons are added by the game). Neutral standing pose with her weight on one leg, slightly cocky posture. Plain flat #00FF00 green background, no ground shadow, no text, no border. 384x384 canvas, full body, feet at bottom center.
```

## แอช (Ash) · 27 ปี · นักผจญภัยพเนจร / นักล่าค่าหัว
ข้อมูลเดิมในเกม: ผ่านเฟิร์นเวลทุก 8 วัน ~2 วัน · มั่นใจ ขี้อวด แต่ฝีมือจริง · อ้างว่าล้มโทรลล์บึงมาสองตัว · "ป้ายค่าหัวที่ประตูหมู่บ้านน่ะ … ของข้าแล้ว อย่าแย่งล่ะ" · ตอนนี้ **ยังชวนร่วมทีมไม่ได้** (ตั้งไว้ "ยัง")

### พรอมต์หลัก (วางครั้งเดียว ใช้กับทุกทิศ)
```
Full-body character sprite of a young adult female bounty hunter companion for a cozy fantasy tactics RPG, semi-chibi anime proportions (about 4 heads tall, tall and athletic with broad confident shoulders, the tallest woman in the party). Same art style as the attached reference character (Luna) but a COMPLETELY DIFFERENT design: clean line art, cel-shaded with soft warm golden lighting from the upper left, polished painterly game-sprite quality. She has sun-tanned skin, bright green eyes fully visible and a wide boastful grin, long sandy-blond hair half tied up with a brown bandana, a long rust-red open coat with rolled sleeves over a cream shirt, a brown cape draped over one shoulder only, leather bracers with tally marks scratched into the left one, a folded wanted-poster scrap tucked into her belt, sturdy brown boots. Palette: rust red, warm brown, cream and a little gold, warm and bold. Both hands empty, one relaxed and one resting on her hip, no weapons visible (weapons are added by the game). Neutral standing pose with a confident wide stance. Plain flat #00FF00 green background, no ground shadow, no text, no border. 384x384 canvas, full body, feet at bottom center.
```

## ต่อท้ายตามทิศ (ใช้กับทั้งสองคน · แทน "she" ตามตัวละคร)
**SW — ล่างซ้าย (สร้างก่อน ใช้เป็นต้นแบบ)**
```
Facing the lower-left of the screen (toward the camera, to the left): a three-quarter FRONT view. Her face is visible turned toward lower-left, her right shoulder nearest the camera.
```
**SE — ล่างขวา**
```
Facing the lower-right of the screen (toward the camera, to the right): a three-quarter FRONT view, the mirror direction of the SW sprite. Her face is visible turned toward lower-right, her left shoulder nearest the camera. Keep the exact same character, outfit and proportions as the attached SW reference.
```
**NW — บนซ้าย (หันหลัง)**
```
Facing the upper-left of the screen (away from the camera, to the left): a three-quarter BACK view. We see the back of her head and hair, and the full back of her jacket/coat and cape. Only a sliver of her left cheek may show. Same character, outfit and proportions as the attached SW reference.
```
**NE — บนขวา (หันหลัง)**
```
Facing the upper-right of the screen (away from the camera, to the right): a three-quarter BACK view, the mirror direction of the NW sprite. Same character, outfit and proportions as the attached SW reference.
```
ลำดับ: สร้าง SW ก่อน → ตรวจหน้าตา → ใช้ SW เป็นภาพอ้างอิงสร้างทิศอื่น (หน้าตา ชุด สัดส่วนต้องเหมือนกันทุกทิศ)

## ท่าเดิน (หลังท่ายืนผ่านแล้ว)
ชีท Female/Male Hero Walking แบบเดียวกับตัวเอก: พื้นโปร่งใส 13 เฟรม (เฟรมที่ 13 ซ้ำเฟรมแรก) เรียง 4 คอลัมน์ · ต้องมี **2 ทิศ: ล่างขวา (SE) และ บนขวา (NE)** แล้วเกมกลับด้านเป็น SW/NW ให้เอง · ตัดด้วย `tools/slice-walk-sheet.py` (เว้นช่องว่างระหว่างเฟรมก่อนถ้าชีทเรียงชิด)

## ชุดสกิลที่เสนอ (ยังไม่ใส่ในโค้ด · ปรับได้)
| | นาเดีย | แอช |
|---|---|---|
| HP / ATK / เดิน / ระยะ | 40 / 12 / 5 / 1 (ไวแต่บาง ใกล้มิล) | 52 / 13 / 4 / 1 (หนักกว่าเคียร์เล็กน้อย) |
| อาวุธใส่ได้ | มีดสั้น มีดเล่ม ดาบเรเพียร์ | ดาบ ดาบเรเพียร์ ขวาน |
| สกิลประจำตัว | **แทงเงา** (มีแล้ว: 26 ประชิด) + โบนัสโจมตีด้านข้าง/หลัง | **ดวลค่าหัว**: ประชิด 16 ดาเมจ ×1.5 กับศัตรูหัวหน้า/ตัวที่ HP สูงสุด |
| วิธีชวน | **ดวลชนะ** ตอนกลางคืนที่โรงแรม (มีแล้ว) | **แย่งค่าหัวด้วยกัน**: รับป้ายประกาศจับ (☠ `js/bounties.js`) แล้วทำสำเร็จ 2 ใบ ได้ร่วมทีม |

## สิ่งที่ต้องแก้ในโค้ดเมื่อได้ภาพ (จากการค้นโค้ด · ยังไม่ได้ทำ)
1. ใส่ไฟล์ท่ายืนที่ `assets/characters/<id>/idle-{sw,se,nw,ne}.webp` (ตัดด้วย `tools/slice-hero-sheet.py`) และท่าเดินที่ `walk-{se,ne}-NN.webp`
2. `js/town-battle.js`: เพิ่มคนใหม่ใน `ALLY_ART` และ `ALLY_OWN` (ตอนนี้มีแค่ bram luna kier mil)
3. `js/companions.js`: ย้ายนาเดียจาก `FALLBACK` เข้า `ROSTER` และเพิ่ม `CAN_EQUIP` · เพิ่มแอช
4. `js/flat-battle.js` `ALLY_SKILL`: เพิ่มสกิลแอช (นาเดียมีแล้ว) · `js/tactics-decks.js` `SIGNATURE` · `js/card-studio.js` `CEL` (ธาตุ)
5. `js/character-scale.js`: ตั้งสเกลต่อทิศจากหัวกว้าง ≈112 px แล้วปรับด้วยเครื่องมือ `scale-lineup.html`
6. `js/village-life.js`: ตั้งให้แอชชวนได้ (`recruit`) แทน "ยัง"
7. ภาพการ์ด/พอร์เทรต `assets/cards/portraits/` (ดู `js/unit-card-art.js`)

## ตะขอเนื้อเรื่อง (เสนอ · ขึ้นกับที่ผู้ใช้ตัดสินเรื่องหลายสาย)
- **นาเดีย:** แหวนที่ลือว่าขโมยมาอาจเกี่ยวกับ "G." หรือเป็นตัวแทนความไม่ไว้ใจ เหมาะกับช่องเพื่อนที่ขัดแย้ง/ความภักดีแปรผันตามสาย
- **แอช:** ค่าหัวที่เธอตามล่าอาจเป็นคนที่ตัวเอกรู้จัก ความมั่นใจเกินจริงซ่อนความกลัวล้มเหลว เหมาะกับดราม่าเพื่อนร่วมทีม

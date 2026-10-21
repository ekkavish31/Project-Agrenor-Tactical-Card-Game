# Project A — รายการภาพที่ต้องให้ AI เจน (v35)

v35 ทำระบบที่ไม่ต้องใช้ภาพครบแล้ว จุดที่ควรมีภาพจริงใช้ **ภาพวาดด้วยโค้ดแทนชั่วคราว** ไปก่อน
รายการนี้คือภาพที่ต้องเจนเพื่อแทนของชั่วคราว เรียงตามความสำคัญ เจนเสร็จแล้วนำเข้าผ่าน Asset Studio ตามชื่อไฟล์ / id ที่ระบุ

**สไตล์ร่วม (ใส่ทุก prompt):**
`hand-painted anime fantasy tactical RPG sprite, clean cel-shaded, consistent proportions and scale with the reference, feet at the bottom centre, nothing cropped, perfectly flat pure green (#00FF00) background, no shadow on the background, no gradient, no text`

ภาพอ้างอิงตัวเอก: `assets/hero.webp`, `assets/tactics/hero_se_idle.webp`

---

## 1. ท่าเดินฮีโร่ SW / NW (ด่วน — ค้างมาหลายเวอร์ชัน)
- **ตอนนี้ใช้อะไรแทน:** วงจรเดินเดิม (สลับ walk-left/right) เพราะภาพที่เจนรอบก่อนก้าวขาข้างเดียวกันซ้ำ
- **ไฟล์:** `assets/tactics/hero_sw_walk_01..06.webp`, `hero_nw_walk_01..06.webp` (ตรวจ SE/NE ชุดเดิมด้วยกฎเดียวกัน)
- **Prompt:**
  > Six-frame walk cycle sprite sheet, 6 columns × 1 row, same brown-haired amber-eyed young adventurer in green cloak and brown leather (identity: reference image), facing three-quarter view toward the bottom-left (SW) of an isometric map. Frames: 1 contact LEFT foot forward, 2 down, 3 passing (legs together), 4 contact RIGHT foot forward, 5 down, 6 passing. Legs MUST alternate: left leg forward in frame 1, right leg forward in frame 4. Opposite arm swings against the forward leg. Empty hands (weapons are attached in code). Equal cell size, same baseline, + common style.
- ทำชุด NW เหมือนกัน แต่หันหลังเฉียงไปทางซ้ายบน (เห็นหลังและผ้าคลุม)

## 2. ท่ายืนรอคำสั่งในสนาม (Idle / Ready) — ทุกฝ่าย
- **ตอนนี้ใช้อะไรแทน:** ท่าหายใจที่โค้ดสร้างจากภาพนิ่ง 8 เฟรม (อกพองยุบ น้ำหนักตัวโยกเล็กน้อย) ใช้กับมอนสเตอร์ด้วยแล้ว
- **ไฟล์:** `assets/tactics/hero_<dir>_idle_01..04.webp` (dir = se, sw, ne, nw) · เพื่อน: `tactics-<luna|bram|kier|mil>-<dir>-idle-01..04` · มอนสเตอร์: คลิป `idle` ใน atlas เดิมของแต่ละชนิด (4 เฟรม)
- **Prompt (ฮีโร่):**
  > Four-frame battle-ready idle loop, 4 columns × 1 row, same adventurer (reference), facing <SE/SW/NE/NW>. Weight on the back foot, knees slightly bent, shoulders rise and fall with breathing, cloak hem sways. Frame 1 neutral, 2 inhale (chest up 2%), 3 hold, 4 exhale with a small weight shift. Empty hands. Feet stay planted on the same pixels in all frames. + common style.
- **Prompt (มอนสเตอร์):** ใช้ prompt เดิมใน `art-production/v34/prompts.json` ของชนิดนั้น แล้วเปลี่ยนส่วน Subject เป็น `4-frame idle breathing loop, feet planted, subtle head/shoulder motion`

## 3. ท่าดีใจหลังชนะ (หลายเฟรม)
- **ตอนนี้ใช้อะไรแทน:** ใช้ท่า strike/guard/windup แล้วให้โค้ดเด้งตัวขึ้นลง
- **ไฟล์:** `assets/tactics/hero_se_victory_01..06.webp`, `tactics-<ally>-se-victory-01..06`
- **Prompt:**
  > Six-frame victory celebration, 6 columns × 1 row, same character (reference), facing SE. 1 relax, 2 crouch anticipation, 3 jump with fist raised, 4 peak (cloak flaring), 5 land, 6 confident pose with a smile. Empty hands. + common style.
- เพื่อนแต่ละคนท่าต่างกัน: Luna (หมุนไม้เท้า), Bram (ยกโล่ตะโกน), Kier (หมุนมีด), Mil (กระโดดสองมือ)

## 4. Cultist NW แบบวาดทิศตรง + windup/hit ของ SW
- **ตอนนี้ใช้อะไรแทน:** NW ใช้การกลับภาพ ส่วน SW windup ใช้ภาพ guard และ hit ใช้ idle+สั่นแทน
- **ไฟล์:** คลิป `enemy-anim-cultist-nw-*` และ `enemy-anim-cultist-sw-windup`, `-sw-hit` (ขนาดและ pivot เท่ากับคลิป SW ใน v34)
- **Prompt:** ใช้ prompt ของ Cultist SW ใน `art-production/v34/native-sw.json` แล้วเปลี่ยนทิศเป็น `facing away to the upper-left (NW), asymmetrical robe trim and hood clasp on the correct side` ส่วน windup = `staff drawn back, dark energy gathering`, hit = `recoil backward, hood tilted, one hand raised`

## 5. ท่าบอสเฉพาะความสามารถ
- **ตอนนี้ใช้อะไรแทน:** pose cast + พิธีกรรม/VFX ที่วาดด้วยโค้ด
- **ไฟล์:** คลิป `enemy-anim-<boss>-se-summon|heal|guard` แบบละ 3 เฟรม
- **บอสที่ต้องทำ:** Treant, Crystal King, Bog Hydra, Coral Golem, Frost Queen, Void King, Yeti
- **Prompt:**
  > Three-frame boss skill animation, 3 columns × 1 row, <boss name> (identity: reference atlas), facing SE. <summon: raises arms, ground glyph glows, small minions silhouettes forming | heal: inward green-gold glow, wounds closing, calm stance | guard: braces, translucent element-coloured barrier forming in front>. Frame 1 anticipation, 2 peak, 3 hold. + common style.

## 6. ฉากเดินทางกลับ (หลังจบการต่อสู้)
- **ตอนนี้ใช้อะไรแทน:** ใช้ภาพ `assets/ui/return-village-v34.png` เลื่อนแบบ parallax + เส้นถนนที่วาดด้วยโค้ด + เฟรมเดินในหมู่บ้าน (หันหน้า)
- **ไฟล์:** `assets/ui/travel-hero-walk-right-01..08.webp` และ `assets/ui/travel-layer-sky.webp`, `travel-layer-hills.webp`, `travel-layer-road.webp`
- **Prompt (ตัวละคร):**
  > Eight-frame side-view walk cycle to the RIGHT, 8 columns × 1 row, same adventurer (reference) with a travel pack, relaxed tired-but-happy walk after battle. Legs alternate correctly. + common style.
- **Prompt (ฉากหลังแยกชั้น):**
  > Seamless horizontally tileable parallax layer, 3:1 wide, hand-painted anime fantasy countryside at golden hour. Layer <sky: sunset clouds and distant village silhouette | hills: rolling green hills with trees, transparent sky | road: dirt road strip with grass edges, transparent above>. True transparent background except the sky layer, no characters, no text.

## 7. ไอคอน UI ใหม่ใน v35 (ไม่เร่ง ถ้าโค้ดดูโอเคก็ใช้ต่อได้)
- **ตอนนี้ใช้อะไรแทน:** ลูกศรเลือกทิศ, ปุ่ม ⚔ อุปกรณ์ และกรอบเตือนไม่มีอาวุธ วาดด้วยโค้ดทั้งหมด
- **ไฟล์:** `assets/ui/v35-ui-atlas.png` (4×2 ช่อง แบบเดียวกับ atlas ของ v34)
- **Prompt:**
  > Production UI sprite atlas, EXACT FOUR COLUMNS by TWO ROWS, transparent background, same antique brass frame and forest-green enamel style as the v34 control icons. TOP ROW: 1 isometric ground arrow pointing up-right (ivory), 2 same arrow highlighted gold, 3 equipment swap (sword and shield with circular arrows), 4 empty-hand warning (open gauntlet with red exclamation). BOTTOM ROW: 5 path step marker (small glowing blue diamond), 6 destination marker (gold diamond with flag), 7 attack-range marker (orange diamond), 8 target marker (red diamond with crosshair). No text, no numerals.

## 8. Skeleton — มือ/อุปกรณ์ตอนมองต่อเนื่องหลายมุม
- **ตอนนี้ใช้อะไรแทน:** ปรับทิศราย key pose ด้วยโค้ด
- **ทางแก้:** เจนคลิปของ Skeleton ใหม่ทั้งชุดตาม prompt เดิม แล้วเพิ่ม `sword held in RIGHT hand in every frame, round shield on LEFT forearm in every frame`

## 9. (v36) ไอคอนคำสั่ง 3 อัน + การ์ดคำสั่งของ AI
- **ตอนนี้ใช้อะไรแทน:** วงกลมโค้ด + emoji 👣 ⚔ 🎒 และการ์ดข้อความ
- **ไฟล์:** `assets/ui/v36-command-icons.png` (3 คอลัมน์ × 2 แถว: แถวบน = ปกติ, แถวล่าง = ถูกเลือก/สีทอง)
- **Prompt:**
  > Production UI sprite atlas, EXACT THREE COLUMNS by TWO ROWS, true transparent background, round antique brass medallions with deep forest-green enamel, ivory engraved pictograms, same style as the v34 control icons. Columns: 1 MOVE (boot print / walking feet), 2 FIGHT (crossed swords), 3 ITEM (leather satchel with potion). Top row normal, bottom row the same icons glowing gold as the selected state. No text, equal padding, centered.

## 10. (v38) ภาพการ์ดใหม่ 8 ใบ + ฉาก/หน้าต่าง slow-burn
- **ตอนนี้ใช้อะไรแทน:** ภาพการ์ดวาดด้วยโค้ด (ไอคอนบนพื้นไล่สี) · ป้าย/หน้าต่างเป็น CSS · หน้าแม่ค้าใช้ emoji 🧑‍🌾
- **การ์ด (ไฟล์ id: `tactic-card-<id>` ผ่าน Asset Studio, อัตราส่วน 7:5):**
  > Square fantasy RPG action-card illustration, warm painterly style matching the existing card art, large readable central subject, no text, no border. Subject: <backstab: a cloaked fighter striking an enemy from behind in shadow | dive: an adventurer leaping down from a cliff edge with a hammer | tide: a sword slash riding a wave of river water | formation: two allies side by side striking together | counter: a blade deflecting and riposting in a flash | evade: a figure side-stepping a strike, motion blur | firstAid: a bandage and glowing potion vial tucked in a belt | ambush: an archer hidden in tall grass, eyes in shadow>.
- **ด้านหลังการ์ดตอบโต้คว่ำหน้า:** `assets/ui/reaction-card-back.png` — ornate violet card back with gold filigree and a central eye-shaped sigil, no text.
- **แม่ค้าตลาด (หน้าบทพูด):** `assets/characters/npc/market-woman.webp` — friendly middle-aged village merchant woman, headscarf, apron, bust portrait, same anime style as the hero, transparent background.
- **ฉาก ENCOUNTER:** `assets/ui/encounter-shatter.png` — abstract swirling shards of glass and light radiating from the centre, dark edges, transparent background (ใช้ซ้อนบนเอฟเฟกต์หมุนที่มีอยู่).
- **ป้ายเริ่มเทิร์น / ป้ายชื่อท่า:** `assets/ui/turn-banner-ally.png`, `turn-banner-enemy.png`, `ability-plate.png` — long horizontal ornate banners (blue/silver for allies, crimson/gold for enemies, dark navy plate with gold trim), empty centre for text, transparent background.

## 11. (v38) พื้น "หิมะบาง" 4 ลาย
- **ตอนนี้ใช้อะไรแทน:** ลายวาดด้วยโค้ด 4 แบบ (หิมะโรยบาง · หิมะมีกรวดโผล่ · หิมะลมพัดเป็นริ้ว · เปลือกน้ำแข็งบาง) สุ่มต่อช่อง
- **ไฟล์:** id `ground-thinsnow` ผ่าน Asset Studio (แผ่นสี่เหลี่ยมจัตุรัส 2×2 = 4 ลาย ใช้ระบบ directional/animation เดิมของพื้นสนาม)
- **Prompt:**
  > Seamless square top-down ground texture tile for an isometric tactics RPG, hand-painted, EXACT 2×2 grid of four variants: 1 light dusting of snow over grey earth, 2 thin snow with small snow-capped pebbles poking through, 3 wind-swept snow with soft drift ripples, 4 thin icy crust with pale blue sheen. Soft even daylight, no strong shadows, no objects, no text, each cell tileable on all edges.

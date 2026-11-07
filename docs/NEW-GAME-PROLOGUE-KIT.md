# Agrenor — New Game Prologue Kit v1
> Status: **kit v2 merged / 18 pages · every art slot has a picture**. This is **New Game** after clicking the menu, NOT the maker logo/title-opening video.
> Current source of truth: `docs/lore/CURRENT-ERA-CANON.md` (approved section A), and game baseline/constraints.

## Playback wiring
- `index.html` loads `js/new-game-prologue-kit.js` before `js/title-screen.js`.
- `title-screen.js` reads `NewGamePrologueKit.pages` for the New Game storybook only. Legacy prose remains in source as fallback.
- Pages without an approved picture show the "Waiting for Pic" board (v98.187); `SceneArt` is only used by the legacy prologue and the BRIDGE page.
- After 13 pages, the existing hero-name form, the `BRIDGE` page, the `enter(true)` loading sequence, and Fernvale gameplay/first mother scene remain unchanged.
- Opening Intro (`js/game-intro.js`, `assets/intro/agrenor-intro.mp4`) and Title Menu are not modified.

## World storyboard v2 (merged with the old SceneArt prologue) — 18 pages
> 7 พ.ย. 2026: ผสาน Kit v1 (13 หน้า) กับบทเดิมที่ใช้ SceneArt ที่ปลอดภัยต่อ Canon แล้ว ได้ 18 หน้า · หน้าที่ขึ้น "ร่วม" ใช้ภาพของหน้าก่อนหน้า (ไม่ต้องวาดเพิ่ม)

| # | ID | Story | Image file (assets/new-game-prologue/images/) | Status |
|---|---|---|---|---|
| 1 | W01 | โลก Agrenor + ดวงทอง | `world-panorama.webp` | **ใช้แล้ว** ภาพโลกมุมสูงเห็นความโค้งของดาว 1536×1024 (แทนภาพ 452×301 เดิม) · ทิศตรง Canon: เหนือหิมะ ตะวันตกหมู่เกาะ ใต้ภูเขาไฟ ตะวันออกป่าใหญ่หลังแนวเขา แม่น้ำไหลลงใต้ผ่านทะเลสาบกลาง · มีดวงทองมุมซ้ายบน |
| 2 | W02 | ดินแดนเหนือ | `northern-snowlands.webp` | **ใช้แล้ว** (มีสัตว์ตัวใหญ่ 3 ตัวเดินบนสันเขา เป็นเงาเล็กๆ ไม่ระบุชนิด) |
| 3 | W03 | หมู่เกาะตะวันตก | `western-archipelago.webp` | **ใช้แล้ว** (เมืองท่า ประภาคาร เรือใบ · สถาปัตย์/เรือมีกลิ่นตะวันออก ไม่ระบุชื่อเมืองหรือชนชาติ) |
| 4 | W04 | ดินแดนใต้ | `southern-firelands.webp` | **ใช้แล้ว** (ภูเขาไฟ ลาวา บ่อน้ำพุร้อน พุ่มแดง คาราวานม้าเป็นเงา) |
| 5 | W05 | มหาพงไพรตะวันออก | `eastern-great-forest.webp` | **ใช้แล้ว** ภาพ 1536×1024 คมชัด (แทนภาพ 452×301) · ป่าเต็มหมอก แสงทองยามเย็น ยังไม่มีต้นไม้ยักษ์เด่น |
| 6 | W05a | เรื่องเล่าจากป่าลึก (บทเดิม · นครแสง/นครมืด) | `ancient-ruins-forest.webp` | **ใช้แล้ว** |
| 7 | W05b | อดีตที่เหลือเพียงร่องรอย (บทเดิมเรียบเรียงตาม Canon B · ภาพสลักสามร่าง) | `ancient-relief.webp` | **ใช้แล้ว** |
| 8 | W06 | ผู้คนหลายอารยธรรม | `civilizations.webp` | **ใช้แล้ว** (ห้าชุมชนต่างภูมิประเทศคั่นด้วยเส้นแสงสีรุ้ง: เมืองปราสาทหน้าผา หมู่บ้านบนน้ำ ค่ายเต็นท์ทุ่งหญ้า หมู่บ้านป่าสน เมืองหินแดงทะเลทราย · ไม่ระบุชื่อ) |
| 9 | W07 | Nor’Chorthal | `norchorthal-valley.webp` | **ใช้แล้ว** |
| 10 | W08 | ความรุ่งเรืองของมนุษย์ | `human-civilization.webp` | **ใช้แล้ว** |
| 11 | W09 | ศาสตร์การ์ดเวท | `card-crafting.webp` | **ใช้แล้ว** |
| 12 | W09a | "ว่ากันว่า" จอมเวทมนุษย์คิดค้นการ์ด (Canon A §4.1/§8) | `card-inventor-book.webp` | **ใช้แล้ว** |
| 13 | W10 | มนุษย์อ่อนแอกว่าเผ่าอื่น การ์ดช่วยให้เดินทางไกล | `traveler-card.webp` | **ใช้แล้ว** (นักเดินทางสวมฮู้ดเห็นด้านหลัง ยกการ์ดเรืองแสงสร้างโดมแสงกันเงาหมาป่า จันทร์ม่วง มีซากสะพานโค้งและปราสาทไกลๆ ไม่ระบุชื่อ) |
| 14 | W11 | เรื่องเล่าของนักเดินทาง | `travelers-stories.webp` | **ใช้แล้ว** |
| 15 | W11a | เหตุผลของนักเดินทาง (บทเดิม) | ใช้ภาพ W11 ร่วม | — |
| 16 | W12 | ถนนสู่ Fernvale: "…มุ่งสู่หมู่บ้านหนึ่ง แถบชานเมืองใหญ่" | ใช้ภาพ W08 ร่วม (`human-civilization.webp` ถนน สะพาน รถเทียมม้า เมืองมีกำแพง) | ใช้แล้ว |
| 17 | W13 | Fernvale... | `fernvale-square.webp` (ลานน้ำพุเตรียมงานเทศกาล) | **ใช้แล้ว** |
| 18 | W13a | เช้าวันหนึ่ง "เรื่องราวของเจ้า… ก็เริ่มต้นที่นี่" | `hero-house.webp` (บ้านตัวเอก) เฟดเข้า ไม่มีเอฟเฟกต์แสง · ภาพเดียวกันค้างต่อเนื่องไปหน้าตั้งชื่อและหน้า "เช้าวันแรกก่อนงานเทศกาล" แล้วเฟดเข้าเกม | **ใช้แล้ว** |

ภาพที่ผู้ใช้ส่งแล้วไม่ได้ใช้: ภาพช่างไม้ตอกแผงขาย (เห็นผู้ชายมีเครา อาจถูกมองเป็นตัวเอก), ภาพแผ่นหินใต้รากไม้ (ตัดเมื่อรวม W05b/W05c), ภาพการ์ดดึงน้ำจากไห (สำรอง) · ภาพทุกใบส่งมา 1672×941 (ไม่ใช่ 1920×1080) แสดงผลแบบ cover ได้ ผู้ใช้ยอมรับแล้ว


### การเปลี่ยนภาพ (ลูกเล่นตามอารมณ์เรื่อง · v98.187)
ทุกหน้ามี `fx` ใน `js/new-game-prologue-kit.js` (CSS `.fx-*` ใน `css/title-screen.css`) ภาพใหม่เข้าซ้อนบนภาพเดิมแล้วภาพเก่าถูกถอด · หน้าที่ใช้ภาพเดิมซ้ำไม่เปลี่ยนภาพ · `prefers-reduced-motion` = ตัดเป็นภาพทันที

| หน้า | fx | อารมณ์ |
|---|---|---|
| W01 | `bloom` | แสงทองค่อยๆ เอ่อสว่าง (ดวงทอง) |
| W02 | `frost` | ซีดเย็น ไหลลงมา (ดินแดนหิมะ) |
| W03 | `tide` | ละลายเข้าอย่างนิ่ม ซูมเข้าจากเบลอเล็กน้อย (ทะเล หมู่เกาะ · v98.201 เปลี่ยนจาก wave ที่สั่น) |
| W04 | `ember` | ไฟกะพริบวูบวาบ (แดนภูเขาไฟ) |
| W05 | `mist` | ผุดจากหมอกมืดเบลอ (มหาพงไพร) |
| W05a | `iris` | วงกลมเปิดออก (นครในตำนาน) |
| W05b | `focus` | ดึงโฟกัสจากภาพเลือน (จารึก ความทรงจำ) |
| W06 | `wipe` | ม่านรูดผ่านจากซ้าย (ผู้คนหลายเผ่า) |
| W07 | `rise` | กล้องยกขึ้นเหนือหุบเขา (Nor’Chorthal) |
| W08, W12 | `drift` | มุมมองเลื่อนไปตามถนน (เมือง/ถนน) |
| W09 | `pulse` | แฟลชฟ้าขาวสองครั้ง วงจรตื่น (การ์ดเวท) |
| W09a | `page` | พลิกหน้าหนังสือเก่า (ประวัติศาสตร์ที่เล่าเรียน) |
| W10 | `darklift` | โผล่จากความมืด (อันตรายระหว่างทาง) |
| W11 | `warm` | แสงไฟเตาอุ่นขึ้น (เล่าเรื่องรอบกองไฟ) |
| W13 | `sunrise` | แสงไล่ขึ้นจากด้านล่าง (เช้าที่ Fernvale) |
| W11a, W13a | `same` / `glow` | ใช้ภาพเดิม · W13a มีแสงทองวาบเบาๆ ตอนประโยคปิด |

### หน้าที่ยังไม่มีภาพ
ตอนนี้ครบทุกหน้า (16 ภาพสำหรับ 18 หน้า) · ถ้าเพิ่มหน้าใหม่ที่ยังไม่มีภาพ ระบบจะแสดงกระดาน "Waiting for Pic" พร้อมรหัสและชื่อหน้าโดยอัตโนมัติ

### บทที่ไม่นำกลับมาจากบทเดิม
6 หน้าแรกของบทเดิม (บรรพชนออกจากป่า ผลึกกลางอก ร่างกายกลายพันธุ์) ชนกับข้อกำหนดบทนำ ("ไม่เผยต้นทางผู้คน ไม่แสดงการกลายพันธุ์/ผลึกธาตุ") ยังเก็บเป็น `LEGACY_PROLOGUE` (fallback) ใน `title-screen.js` · ฉากวิหาร/บูชาต้นไม้ ผู้ใช้สั่งตัดแล้ว

### คำยืนยันของผู้สร้าง (7 พ.ย. 2026 · ยังไม่ได้ย้ายเข้า Canon ส่วน A)
- มนุษย์อ่อนแอกว่าเผ่าพันธุ์อื่น (ไม่ระบุเผ่าหรือตัวเลข) การ์ดเวทจึงเป็นเครื่องมือที่ช่วยให้มนุษย์ก้าวข้ามอันตรายระหว่างทางและเดินทางไกลได้มากขึ้น · ใช้ในหน้า W10 · ถ้าจะยกเป็น Canon ให้ผู้ใช้สั่งแก้ `CURRENT-ERA-CANON.md` เอง
- ภาพสลักสามร่างบนซาก (W05b) ตั้งใจสื่อถึงสามมหาเทพ โดยไม่มีข้อความยืนยัน เทพไม่ปรากฏกาย

## Production specification
- Each illustration: 1920×1080 landscape 16:9, warm painterly fantasy / anime-JRPG style, consistent light and restrained motion, no words, labels or watermark baked into the artwork.
- Maintain safe crop for dialogue at the bottom; characters/points of interest above middle; use gentle pan/crossfade not perpetual shake.
- Art images are NOT present yet; only filenames/slots exist. Do not create decorative dummy images that may later be mistaken for approved art.
- To activate one image: put reviewed `.webp` at its exact path, then add its ID (e.g. `'W07'`) to `APPROVED_IMAGES` in `js/new-game-prologue-kit.js`. It automatically replaces SceneArt for that page.
- If a named SceneArt fallback is missing in some future revision, use a supported art key from `SceneArt.scenes`.
- Recommended production sequence: W07 → W09 → W10 → W13 → W01–W06 → W08/W11/W12.

## Flow and lore constraints
1. World breadth (W01–W06): geography and cultural diversity; do not reveal the origin of ancient races.
2. Nor’Chorthal & humanity (W07–W08): human river civilization, economic and road networks. Do not imply all the world belongs to humans.
3. Magic cards (W09–W10): human craft as popularly understood. A card is a circuit; it formats the wielder's power, not an unlimited power source. Avoid revealing the ancient precursor to the art.
4. Travelers and Fernvale (W11–W13): stories travel with caravans; converge on the quiet village and on the existing first-day family/quest scenes.
5. Do NOT identify the mysterious stone from the later raid as an ancient magic card. A card-shaped stone is still a proposal, not approved canon.
6. Do not introduce new gods, city names, ancient peoples' names, Vaelari secrets, or assign a predetermined destiny to the player.

## Continuity / what this kit does NOT do
- The older prologue used myths about the ancestors and crystalline changes. The kit deliberately replaces **only its New Game narration** with current-era setting, not the world canon.
- **Mother/gift/possible paths**: in this repository the paintings `assets/intro/story/*.png` exist as assets of the **Opening Intro video**. The actual New Game handoff currently uses the hero name → BRIDGE → `js/story-data.js` opening scene. This kit **does not pretend** that the old gift/paths shots play again inside New Game. Their independent New Game treatment requires an explicit future decision to avoid duplicating the opening video.
- The tutorial chain `docs/STORY-INTRO.md` after entering Fernvale remains intact; do not rewrite save/quest logic under this artwork kit.

## Acceptance checks when images arrive
- New Game starts with W01 and advances through all 18 pages in order, without missing-image flash or jitter.
- Escape/skip, name entry, transition to mother's cutscene and game remain functional.
- Continue does NOT show this prologue.
- The Opening Intro video/music and Title Menu are unchanged.
- Review Thai text readability with 16:9 and tablet; verify images on GitHub Pages hard refresh.
- Run a browser check when possible (not included in this kit-only commit).

## Files
- `js/new-game-prologue-kit.js`: authoritative narration and image slot registry.
- `data/new-game-prologue-assets.json`: structured production manifest.
- `assets/new-game-prologue/README.md`: asset-drop instructions.

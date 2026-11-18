# แผนที่รูปภาพทั้งหมดของเกม (สร้างอัตโนมัติ)

> ไฟล์นี้สร้างโดย `node tools/build-image-index.cjs` — อย่าแก้มือ · ดัชนีเต็ม: `data/image-index.js` · กฎหมวดหมู่: `js/image-catalog.js`
> **ภาพทั้งหมด 5408 ไฟล์ (393.2 MB)** — อยู่ในที่เดิม (โค้ด/manifest/เซฟอ้างพาธเหล่านี้) แต่ **ดูและค้นได้ที่เดียว**: Asset Studio → Asset Manager → เลือกหมวดหมู่

## ที่มาของรูป (แหล่งต่าง ๆ) → หมวดเดียว
| แหล่ง | อยู่ที่ | อะไรจัดการ |
|---|---|---|
| ภาพในเกม | `assets/**` | manifest (`data/asset-manifest.json`) ลงทะเบียนเป็น slot + ไฟล์ที่โค้ดอ้างตรง ๆ |
| ภาพจาก Asset Studio | `assets/tactics/imported/**`, `assets/characters/**` | Asset Studio (ท่า/เฟรม) |
| ภาพเวอร์ชันเก่า | `assets/_versions/**` | Asset Studio เก็บไว้ย้อน |
| ภาพสนทนา | `assets/portraits/**` | story-actors.js / story-cast.js |
| แผนที่โลก/เอกสาร | `docs/lore/maps/**` | หน้าแผนที่เส้นเรื่อง |
| เก็บถาวร/ตัวอย่าง | `archive/**`, `_archive/**`, `dev/**`, `tools/out/**` | ไม่ใช้ในเกม |

## จำนวนต่อหมวดหมู่
| หมวดหมู่ | ไฟล์ | ขนาด | โฟลเดอร์หลัก | ลงทะเบียน slot | ไฟล์ซ้ำ (เนื้อหาเหมือนกัน) |
|---|---|---|---|---|---|
| 🗣 ภาพสนทนา (portrait) | 136 | 13.1 MB | `assets/portraits` 136 | 0 | 4 |
| 🧑‍🎤 ตัวเอก | 2580 | 96.6 MB | `assets/tactics` 2553 · `assets/characters` 22 · `assets/adventurer-sword-idle.webp` 1 · `assets/adventurer-unarmed-idle.webp` 1 | 2568 | 510 |
| 👥 ชาวบ้าน / NPC | 292 | 11.7 MB | `assets/village-town` 292 | 180 | 23 |
| 🤝 เพื่อนร่วมทีม | 200 | 9.7 MB | `assets/tactics` 196 · `assets/allies` 4 | 200 | 16 |
| 👹 มอนสเตอร์ | 546 | 76.7 MB | `assets/enemies` 546 | 507 | 14 |
| ⚔ ท่าต่อสู้ในสนาม (tactics) | 402 | 25.2 MB | `assets/tactics` 395 · `assets/objects` 7 | 370 | 26 |
| 🃏 การ์ด | 168 | 44.0 MB | `assets/cards` 166 · `assets/camp.webp` 1 · `assets/forge.webp` 1 | 156 | 16 |
| 🎛 UI · ไอคอน · เมนู | 185 | 5.3 MB | `assets/ui` 95 · `assets/icons` 82 · `assets/cursor-fantasy-active.png` 1 · `assets/cursor-fantasy.png` 1 | 90 | 9 |
| 🏘 หมู่บ้าน · อาคาร · ของตกแต่ง | 138 | 19.4 MB | `assets/village-town` 123 · `assets/objects` 15 | 12 | 6 |
| 🏠 ภายในอาคาร | 185 | 6.3 MB | `assets/interior` 185 | 0 | 0 |
| ⛰ ภูมิประเทศ · แผนที่โลก | 106 | 6.9 MB | `assets/terrain` 75 · `assets/world` 27 · `assets/v03` 4 | 4 | 0 |
| 🌲 ฉากสนามรบ | 10 | 6.1 MB | `assets/scenes` 7 · `assets/home.webp` 1 · `assets/market.webp` 1 · `assets/workshop.webp` 1 | 10 | 0 |
| ✨ เอฟเฟกต์ | 68 | 4.0 MB | `assets/fx` 68 | 0 | 0 |
| 🎒 ไอเทม · อาวุธ · พืชผล | 61 | 5.3 MB | `assets/crops` 36 · `assets/weapons` 7 · `assets/action-chest.webp` 1 · `assets/action-deck.webp` 1 | 25 | 1 |
| 📖 เปิดเรื่อง · อินโทร · ฉาก | 27 | 36.1 MB | `assets/new-game-prologue` 17 · `assets/intro` 10 | 0 | 0 |
| 🗺 แผนที่โลกในเอกสาร (lore) | 5 | 1.9 MB | `docs/lore` 5 | 0 | 0 |
| 🕘 ประวัติเวอร์ชัน (เก็บไว้ย้อน) | 238 | 17.2 MB | `assets/_versions` 238 | 0 | 47 |
| 🗄 เก็บถาวร · ชั่วคราว · ตัวอย่าง | 42 | 6.9 MB | `archive/old-scene` 31 · `_archive/undefined-bg` 2 · `adjbox.png` 1 · `art-production/facing-arrows-4.png` 1 | 0 | 12 |
| 📦 อื่น ๆ (ยังไม่มีหมวด) | 19 | 0.8 MB | `assets/cursor` 19 | 0 | 0 |

## หมวดย่อยในแต่ละหมวด

### 🗣 ภาพสนทนา (portrait)
- ตัวเอก · ชาวบ้าน — 104
- ตัวละครเนื้อเรื่อง (4 อารมณ์) — 32

### 🧑‍🎤 ตัวเอก
- ท่าตัวเอกที่นำเข้าจากสตูดิโอ — 2553
- ลุคตัวเอก (ชาย/หญิง) — 22
- ตัวเอก (เดิม) — 3
- ไอคอนสถานที่ / เบ็ดเตล็ด (ระดับบนสุดของ assets) — 2

### 👥 ชาวบ้าน / NPC
- ชาวบ้านในหมู่บ้าน (ท่ายืน/เดิน) — 292

### 🤝 เพื่อนร่วมทีม
- ท่าของ bram — 24
- ท่าของ kier — 24
- ท่าของ luna — 24
- ท่าของ mil — 24
- ท่าของ nadia — 20
- ท่าของ olwen — 20
- ท่าของ orla — 20
- ท่าของ ren — 20
- ท่าของ sigrid — 20
- ภาพทีม — 4

### 👹 มอนสเตอร์
- แอนิเมชันมอนสเตอร์ — 442
- มอนสเตอร์ (หน้า/หลัง) — 104

### ⚔ ท่าต่อสู้ในสนาม (tactics)
- ท่าที่นำเข้าจากสตูดิโอ (idle/walk/ท่า) — 217
- ท่าต่อสู้ · อาวุธในมือ — 178
- วัตถุ · รั้ว · บ้านจาก Workshop — 7

### 🃏 การ์ด
- ภาพการ์ดยูนิต — 55
- กรอบ · การ์ดทั่วไป — 44
- การ์ด item — 35
- การ์ด event — 12
- การ์ด elements — 10
- การ์ด skills — 9
- ไอคอนสถานที่ / เบ็ดเตล็ด (ระดับบนสุดของ assets) — 2
- การ์ด src — 1

### 🎛 UI · ไอคอน · เมนู
- UI — 95
- ไอคอน — 82
- UI / เคอร์เซอร์ — 8

### 🏘 หมู่บ้าน · อาคาร · ของตกแต่ง
- ภาพหมู่บ้านอื่น ๆ — 48
- ของตกแต่ง — 33
- ขอบ — 24
- วัตถุ · รั้ว · บ้านจาก Workshop — 15
- อาคาร — 11
- พื้น — 7

### 🏠 ภายในอาคาร
- เฟอร์นิเจอร์ · ของในห้อง — 185

### ⛰ ภูมิประเทศ · แผนที่โลก
- ภูมิประเทศ (สนามรบ) — 75
- วัตถุบนแผนที่โลก — 27
- พื้นหลัง · HUD เก่า — 4

### 🌲 ฉากสนามรบ
- ฉากพื้นที่ — 7
- ไอคอนสถานที่ / เบ็ดเตล็ด (ระดับบนสุดของ assets) — 3

### ✨ เอฟเฟกต์
- เอฟเฟกต์ — 68

### 🎒 ไอเทม · อาวุธ · พืชผล
- พืชผล — 36
- ไอเทม · ท่า (ไอคอน) — 16
- อาวุธ — 7
- ไอคอนสถานที่ / เบ็ดเตล็ด (ระดับบนสุดของ assets) — 2

### 📖 เปิดเรื่อง · อินโทร · ฉาก
- เปิดเรื่อง · อินโทร — 27

### 🗺 แผนที่โลกในเอกสาร (lore)
- แผนที่โลกที่เจ้าของวาด — 5

### 🕘 ประวัติเวอร์ชัน (เก็บไว้ย้อน)
- ประวัติของ slot — 238

### 🗄 เก็บถาวร · ชั่วคราว · ตัวอย่าง
- archive — 31
- art-production (แผ่นสไปรต์ต้นฉบับ) — 6
- _archive — 2
- dev — 2
- ไฟล์ระดับบนสุดของรีโป — 1

### 📦 อื่น ๆ (ยังไม่มีหมวด)
- assets/cursor — 19

## ไฟล์ซ้ำที่กินที่มากสุด (เนื้อหาเหมือนกันทุกไบต์ — ตรวจแล้วลบสำเนาได้ ถ้าไม่มีโค้ดอ้างพาธนั้น)
- 0.8 MB เสียไปกับสำเนา 3 ไฟล์: `assets/objects/_workshop/iron-fence3-corner/L0.webp`, `assets/objects/_workshop/iron-fence4-corner-new-2/L0.webp`, `assets/objects/_workshop/iron-fence4-corner-new/L0.webp`
- 0.6 MB เสียไปกับสำเนา 3 ไฟล์: `assets/cards/item/antidote.webp`, `assets/cards/item/momWater.webp`, `assets/cards/item/tonic.webp`
- 0.5 MB เสียไปกับสำเนา 6 ไฟล์: `assets/_versions/unified/mw02nwy3/tactics-bram-sw-idle.png`, `assets/_versions/unified/mw0uam46/tactics-bram-sw-idle.png`, `assets/_versions/unified/mw0uc858/tactics-bram-sw-idle.png` …
- 0.4 MB เสียไปกับสำเนา 4 ไฟล์: `assets/_versions/tactics-sigrid-se-idle/mw4gjiin-xa7u.webp`, `assets/_versions/unified/mw4fxa65/tactics-sigrid-se-idle.png`, `assets/_versions/unified/mw4guele/tactics-sigrid-se-idle.png` …
- 0.4 MB เสียไปกับสำเนา 4 ไฟล์: `assets/_versions/tactics-sigrid-sw-idle/mw4gjiin-xa7u.webp`, `assets/_versions/unified/mw4fxf1j/tactics-sigrid-sw-idle.png`, `assets/_versions/unified/mw4gudb7/tactics-sigrid-sw-idle.png` …
- 0.4 MB เสียไปกับสำเนา 2 ไฟล์: `assets/tactics/props/large/ancient-tree.webp`, `assets/village-town/nature/old-oak.webp`
- 0.3 MB เสียไปกับสำเนา 4 ไฟล์: `archive/old-scene/assets/adventurer-hammer-attack-v98.437.webp`, `archive/old-scene/assets/adventurer-hammer-idle-v98.437.webp`, `archive/old-scene/assets/adventurer-sword-attack-v98.437.webp` …
- 0.3 MB เสียไปกับสำเนา 2 ไฟล์: `assets/cards/item/firebomb.webp`, `assets/cards/item/oilFlask.webp`
- 0.3 MB เสียไปกับสำเนา 2 ไฟล์: `assets/cards/item/bandage.webp`, `assets/cards/item/potion.webp`
- 0.3 MB เสียไปกับสำเนา 2 ไฟล์: `assets/cards/item/crystalShard.webp`, `assets/cards/item/flashPowder.webp`
- 0.3 MB เสียไปกับสำเนา 2 ไฟล์: `assets/cards/item/iceCore.webp`, `assets/cards/item/smokeBomb.webp`
- 0.2 MB เสียไปกับสำเนา 2 ไฟล์: `assets/_versions/bandit-before-ground-v98.317/se-walk.webp`, `assets/enemies/animations/bandit/se-walk.webp`
- 0.2 MB เสียไปกับสำเนา 2 ไฟล์: `assets/cards/item/boneCharm.webp`, `assets/cards/item/whetstone.webp`
- 0.2 MB เสียไปกับสำเนา 2 ไฟล์: `assets/_versions/bandit-before-ground-v98.317/ne-walk.webp`, `assets/enemies/animations/bandit/ne-walk.webp`
- 0.2 MB เสียไปกับสำเนา 2 ไฟล์: `assets/tactics/tree.webp`, `assets/village-town/nature/broadleaf.webp`
- 0.2 MB เสียไปกับสำเนา 2 ไฟล์: `assets/portraits/hero-female-calm.webp`, `assets/portraits/hero-female-neutral.webp`
- 0.1 MB เสียไปกับสำเนา 2 ไฟล์: `assets/portraits/hero-male-calm.webp`, `assets/portraits/hero-male-neutral.webp`
- 0.1 MB เสียไปกับสำเนา 2 ไฟล์: `assets/_versions/unified/mvvihj13/tactics-bram-sw-idle.png`, `assets/_versions/unified/mvvj6rqu/tactics-bram-sw-idle.png`
- 0.1 MB เสียไปกับสำเนา 2 ไฟล์: `assets/tactics/props/pine.webp`, `assets/village-town/nature/pine.webp`
- 0.1 MB เสียไปกับสำเนา 2 ไฟล์: `assets/_versions/unified/mw2xb4ck/tactics-kier-nw-idle.png`, `assets/_versions/unified/mw2xbir2/tactics-kier-nw-idle.png`
- 0.1 MB เสียไปกับสำเนา 3 ไฟล์: `assets/tactics/imported/strike-sw-mw4kvsmf-i3pm/frame-01.webp`, `assets/tactics/imported/strike-sw-mw4kvvuh-sbyz/frame-01.webp`, `assets/tactics/imported/strike-sw-mw4kyto8-bdbh/frame-01.webp`
- 0.1 MB เสียไปกับสำเนา 3 ไฟล์: `assets/tactics/imported/hit-sw-mw4kvsmf-i3pm/frame-01.webp`, `assets/tactics/imported/hit-sw-mw4kvvuh-sbyz/frame-01.webp`, `assets/tactics/imported/hit-sw-mw4kyto8-bdbh/frame-01.webp`
- 0.1 MB เสียไปกับสำเนา 2 ไฟล์: `assets/tactics/bram_sw_idle.webp`, `assets/village-town/npc/bram/sw-stand.webp`
- 0.1 MB เสียไปกับสำเนา 2 ไฟล์: `assets/tactics/bram_se_idle.webp`, `assets/village-town/npc/bram/se-stand.webp`
- 0.1 MB เสียไปกับสำเนา 2 ไฟล์: `assets/tactics/luna_se_idle.webp`, `assets/village-town/npc/luna/se-stand.webp`

# แผนที่รูปภาพทั้งหมดของเกม (สร้างอัตโนมัติ)

> ไฟล์นี้สร้างโดย `node tools/build-image-index.cjs` — อย่าแก้มือ · ดัชนีเต็ม: `data/image-index.js` · กฎหมวดหมู่: `js/image-catalog.js`
> **ภาพทั้งหมด 6545 ไฟล์ (470.6 MB)** — อยู่ในที่เดิม (โค้ด/manifest/เซฟอ้างพาธเหล่านี้) แต่ **ดูและค้นได้ที่เดียว**: Asset Studio → Asset Manager → เลือกหมวดหมู่

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
| 🗣 ภาพสนทนา (portrait) | 207 | 29.0 MB | `assets/portraits` 204 · `assets/generated-village` 3 | 71 | 4 |
| 🧑‍🎤 ตัวเอก | 2917 | 104.9 MB | `assets/tactics` 2890 · `assets/characters` 22 · `assets/adventurer-sword-idle.webp` 1 · `assets/adventurer-unarmed-idle.webp` 1 | 2833 | 519 |
| 👥 ชาวบ้าน / NPC | 499 | 16.5 MB | `assets/village-town` 498 · `assets/generated-village` 1 | 387 | 23 |
| 🤝 เพื่อนร่วมทีม | 360 | 13.0 MB | `assets/tactics` 196 · `assets/village-town` 160 · `assets/allies` 4 | 360 | 16 |
| 👹 มอนสเตอร์ | 546 | 76.7 MB | `assets/enemies` 546 | 507 | 14 |
| ⚔ ท่าต่อสู้ในสนาม (tactics) | 622 | 30.6 MB | `assets/tactics` 614 · `assets/objects` 7 · `assets/generated-village` 1 | 589 | 33 |
| 🃏 การ์ด | 170 | 44.2 MB | `assets/cards` 168 · `assets/camp.webp` 1 · `assets/forge.webp` 1 | 158 | 16 |
| 🎛 UI · ไอคอน · เมนู | 256 | 9.1 MB | `assets/ui` 125 · `assets/icons` 90 · `assets/cursor` 33 · `assets/cursor-fantasy-active.png` 1 | 101 | 11 |
| 🏘 หมู่บ้าน · อาคาร · ของตกแต่ง | 170 | 22.6 MB | `assets/village-town` 155 · `assets/objects` 15 | 38 | 8 |
| 🏠 ภายในอาคาร | 185 | 6.3 MB | `assets/interior` 185 | 0 | 0 |
| ⛰ ภูมิประเทศ · แผนที่โลก | 113 | 9.0 MB | `assets/terrain` 77 · `assets/world` 32 · `assets/v03` 4 | 9 | 2 |
| 🌲 ฉากสนามรบ | 10 | 6.1 MB | `assets/scenes` 7 · `assets/home.webp` 1 · `assets/market.webp` 1 · `assets/workshop.webp` 1 | 10 | 0 |
| ✨ เอฟเฟกต์ | 68 | 4.0 MB | `assets/fx` 68 | 0 | 0 |
| 🎒 ไอเทม · อาวุธ · พืชผล | 61 | 5.3 MB | `assets/crops` 36 · `assets/weapons` 7 · `assets/action-chest.webp` 1 · `assets/action-deck.webp` 1 | 25 | 1 |
| 📖 เปิดเรื่อง · อินโทร · ฉาก | 66 | 64.0 MB | `assets/scenes` 33 · `assets/new-game-prologue` 17 · `assets/intro` 10 · `assets/generated-village` 6 | 39 | 0 |
| 🗺 แผนที่โลกในเอกสาร (lore) | 5 | 1.9 MB | `docs/lore` 5 | 0 | 0 |
| 🕘 ประวัติเวอร์ชัน (เก็บไว้ย้อน) | 248 | 20.5 MB | `assets/_versions` 248 | 0 | 47 |
| 🗄 เก็บถาวร · ชั่วคราว · ตัวอย่าง | 42 | 6.9 MB | `archive/old-scene` 31 · `_archive/undefined-bg` 2 · `adjbox.png` 1 · `art-production/facing-arrows-4.png` 1 | 0 | 12 |

## หมวดย่อยในแต่ละหมวด

### 🗣 ภาพสนทนา (portrait)
- ตัวเอก · ชาวบ้าน — 160
- ตัวละครเนื้อเรื่อง (4 อารมณ์) — 44
- ภาพสนทนาหมู่บ้าน — 3

### 🧑‍🎤 ตัวเอก
- ท่าตัวเอกที่นำเข้าจากสตูดิโอ — 2890
- ลุคตัวเอก (ชาย/หญิง) — 22
- ตัวเอก (เดิม) — 3
- ไอคอนสถานที่ / เบ็ดเตล็ด (ระดับบนสุดของ assets) — 2

### 👥 ชาวบ้าน / NPC
- ชาวบ้านในหมู่บ้าน (ท่ายืน/เดิน) — 498
- พนักงานร้านและกิลด์ (atlas) — 1

### 🤝 เพื่อนร่วมทีม
- ภาพหมู่บ้านอื่น ๆ — 160
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
- ท่าที่นำเข้าจากสตูดิโอ (idle/walk/ท่า) — 432
- ท่าต่อสู้ · อาวุธในมือ — 182
- วัตถุ · รั้ว · บ้านจาก Workshop — 7
- ของฟาร์มและไอคอน (atlas) — 1

### 🃏 การ์ด
- ภาพการ์ดยูนิต — 55
- กรอบ · การ์ดทั่วไป — 44
- การ์ด item — 37
- การ์ด event — 12
- การ์ด elements — 10
- การ์ด skills — 9
- ไอคอนสถานที่ / เบ็ดเตล็ด (ระดับบนสุดของ assets) — 2
- การ์ด src — 1

### 🎛 UI · ไอคอน · เมนู
- UI — 125
- ไอคอน — 90
- เคอร์เซอร์เกม — 33
- UI / เคอร์เซอร์ — 8

### 🏘 หมู่บ้าน · อาคาร · ของตกแต่ง
- ของตกแต่ง — 59
- ภาพหมู่บ้านอื่น ๆ — 48
- ขอบ — 24
- วัตถุ · รั้ว · บ้านจาก Workshop — 15
- พื้น — 13
- อาคาร — 11

### 🏠 ภายในอาคาร
- เฟอร์นิเจอร์ · ของในห้อง — 185

### ⛰ ภูมิประเทศ · แผนที่โลก
- ภูมิประเทศ (สนามรบ) — 77
- วัตถุบนแผนที่โลก — 32
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
- ฉากหลังบทสนทนาตามสถานที่ — 33
- เปิดเรื่อง · อินโทร — 27
- ฉากสนทนาหมู่บ้าน — 6

### 🗺 แผนที่โลกในเอกสาร (lore)
- แผนที่โลกที่เจ้าของวาด — 5

### 🕘 ประวัติเวอร์ชัน (เก็บไว้ย้อน)
- ประวัติของ slot — 248

### 🗄 เก็บถาวร · ชั่วคราว · ตัวอย่าง
- archive — 31
- art-production (แผ่นสไปรต์ต้นฉบับ) — 6
- _archive — 2
- dev — 2
- ไฟล์ระดับบนสุดของรีโป — 1

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
- 0.1 MB เสียไปกับสำเนา 2 ไฟล์: `assets/ui/bookturn/turn-01.webp`, `assets/ui/bookturn/turn-20.webp`
- 0.1 MB เสียไปกับสำเนา 2 ไฟล์: `assets/_versions/unified/mw2xb4ck/tactics-kier-nw-idle.png`, `assets/_versions/unified/mw2xbir2/tactics-kier-nw-idle.png`
- 0.1 MB เสียไปกับสำเนา 3 ไฟล์: `assets/tactics/imported/strike-sw-mw4kvsmf-i3pm/frame-01.webp`, `assets/tactics/imported/strike-sw-mw4kvvuh-sbyz/frame-01.webp`, `assets/tactics/imported/strike-sw-mw4kyto8-bdbh/frame-01.webp`
- 0.1 MB เสียไปกับสำเนา 3 ไฟล์: `assets/tactics/imported/hit-sw-mw4kvsmf-i3pm/frame-01.webp`, `assets/tactics/imported/hit-sw-mw4kvvuh-sbyz/frame-01.webp`, `assets/tactics/imported/hit-sw-mw4kyto8-bdbh/frame-01.webp`
- 0.1 MB เสียไปกับสำเนา 2 ไฟล์: `assets/tactics/bram_sw_idle.webp`, `assets/village-town/npc/bram/sw-stand.webp`
- 0.1 MB เสียไปกับสำเนา 2 ไฟล์: `assets/tactics/bram_se_idle.webp`, `assets/village-town/npc/bram/se-stand.webp`

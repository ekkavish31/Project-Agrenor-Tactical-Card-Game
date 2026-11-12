# ระบบปุ่มกดเก่า (Everyday Arcana) ที่ยังค้าง — ผลตรวจ 12 พ.ย. 2026 (v98.434)

## สรุปสั้น
- **หน้าตา (UI) ของระบบปุ่มกดเก่าเลิกใช้แล้วจริง** แต่ **ตรรกะยังถูกเกมปัจจุบันเรียกอยู่**: ตอนผู้เล่นกดจุดทำงานในแมพย่อย (หลอม ตี ชุบ พัก กินอาหาร ซื้อ ขาย ออร์เดอร์) `village-place.html` ส่งข้อความไปที่ `js/village-town-bridge.js` → `runPlaceAction()` ใน `index.html` ซึ่งอยู่ในสคริปต์ชุดเก่า (`location-actions` → `journey-ui` → …) แล้วคำนวณพลังงาน เวลา วัตถุดิบจาก `cards-data.js`/`core.js`
- ดังนั้นถอด 14 สคริปต์ทิ้งทั้งชุดไม่ได้ในทางเดียว ต้องย้ายตรรกะออกก่อน (ดูแผนด้านล่าง) · ที่ทำไปแล้วคือ **ตัดรายการภาพที่ไม่ควรเจน** ออกจาก manifest

## หลักฐาน (วัดจริง ไม่เดา)
1. ปิดโหลดสคริปต์ชุดเก่าทั้ง 14 ตัว (`location-actions interface-v02 journey-ui journey-core paper-cards card-drag developer editor hud-v03 collection-v03 layout-v08 village-core village-ui hand-cards`) ตอนเปิด `index.html?skipTitle=1` → เหลือ ReferenceError แค่ 2 จุด: `sharedCardBack` (เรียกจาก `js/ui.js`) กับ `renderMap` — ส่วนที่บูตต้องใช้มีน้อยมาก
2. แต่ `runPlaceAction` / `placeActions` / `entityCardMarkup` / `actionDetails` ยังถูกเรียกจากฝั่งเกมจริง: `js/village-town-bridge.js:59` (รับ action จาก iframe) · `js/card-sources.js:81` (เพิ่มปุ่ม "ร้านการ์ด" ให้ `placeActions`) · `js/story-quests.js:218` (ห่อ `runPlaceAction` สำหรับโคมไฟเทศกาล)
3. `tools/scan-asset-usage.cjs` (รันใหม่ 12 พ.ย.) พบภาพที่ "โหลดจริง" เฉพาะตอนเปิด `index.html` (เปลือกเก่าซ่อนอยู่) และไม่โหลดในหมู่บ้าน/แมพย่อย/สนามรบ

## ภาพที่ตัดแล้ว (v98.434)
รายการ `missing` ใน manifest (ไม่มีไฟล์ ไม่มีใครใช้ในเกมจริง · เป็นภาพปุ่มของระบบเก่า) — **ไม่ต้องเจน**: `action-auto` (ทำงานอัตโนมัติ) · `action-buy` (ซื้อ) · `action-cancel` (ยกเลิกงาน) · `action-recipes` (เลือกแบบ) · `action-sell` (ขาย) · `ui-edit` · ตัด 6 รายการจาก `data/asset-manifest.json` + `js/asset-manifest.js` แล้ว (prompt เดิมใน `docs/ASSET-PROMPTS.md` เก็บไว้เป็นประวัติ)

## ภาพที่อ้างโดยเปลือกเก่าเท่านั้น (ยังไม่ย้าย เพราะโค้ดเก่าที่ยังรันอยู่อ้างถึง จะ 404)
| ไฟล์ | ผู้อ้าง | แผน |
|---|---|---|
| `ui-forge` `ui-editor` `ui-fullscreen` `ui-motion` `ui-rest` `ui-smelt` `ui-upgrade` `ui-water` `action-chest` | `interface-v02` / `location-actions` / ส่วนหัว `index.html` | ย้ายเข้า `archive/old-scene/assets/` ในขั้น 2 |
| `adventurer-hammer-attack/idle` `adventurer-sword-attack` `scarecrow-left` `wip-hot` `wip-shaped` | เปลือกเก่า / `smith-wip.js` | ตรวจ `smith-wip.js` (ยังโหลดใน `village-place.html`) ก่อน |
| `freshness-faces` `battle-loot-v32` | `css/journey.css` / `css/battle-flow.css` (เก่า) | ขั้น 2 |

**ที่ยังใช้จริง ห้ามแตะ:** `ui-bag` `ui-develop` `ui-map` `action-deck` `action-orders` (แถบปุ่มหมู่บ้าน `js/town-ux.js`, `js/card-sources.js`) · `item-*` `armor-burn` `hammer-strike` `water-ball` (ภาพการ์ด `card-design`)

## สคริปต์ของระบบเก่า (รวม ≈ 180 KB) และสถานะ
| ส่วน | ไฟล์ | ใช้จริงอยู่ไหม |
|---|---|---|
| ตรรกะกิจกรรมจุดทำงาน | `location-actions` `journey-ui` `journey-core` `interface-v02` | ✔ `runPlaceAction` / `placeActions` (ต้องย้าย) |
| ตัวเลขการ์ดงาน | `cards-data` `core` (`defs`) | ✔ โรงตีเหล็กอ่านพลังงาน/นาที/ความร้อน (TODO C1) |
| วาดการ์ด/ห้องเก่า | `paper-cards` `ui` (`sharedCardBack`) `hand-cards` `card-drag` | ✘ ยกเว้น 2 ฟังก์ชันที่ยังถูกเรียก |
| หน้าจอเก่า | `village-core` `village-ui` `collection-v03` `hud-v03` `layout-v08` `developer` `editor` | ✘ ส่วนใหญ่ (ต้องดูทีละฟังก์ชัน) |

## แผนถอดที่เสนอ (รออนุมัติ — ลำดับมีผล)
1. **ขั้น 1 ย้ายตรรกะ:** สร้างไฟล์เดียว `js/station-actions.js` ที่มี `placeActions` / `runPlaceAction` และตัวเลขงาน (พลังงาน นาที ความร้อน วัตถุดิบ) แบบไม่แตะ DOM · แทนการอ่าน `cards-data` · เทสต์ใหม่ `tools/test-station-actions.cjs` ครอบทุกกิจกรรม (หลอม ตี ชุบ พัก กิน ซื้อ ขาย ออร์เดอร์ โคมไฟ) เทียบผลกับของเก่าก่อนถอด
2. **ขั้น 2 ถอดเปลือก:** ลบ DOM เปลือกเก่าใน `index.html` + ย้ายสคริปต์ทั้ง 14 เข้า `archive/old-scene/js/` + ย้ายภาพที่เหลือเฉพาะเปลือกเก่า (ตารางบน) + ลบรายการที่ manifest
3. **ขั้น 3 ตรวจ:** `node tools/check-places.cjs --browser` (149 รายการ) · e2e quick · เปิด `index.html?skipTitle=1` ต้องไม่มี pageerror · สแกน asset-usage ใหม่

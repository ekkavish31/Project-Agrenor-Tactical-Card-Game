# archive/old-scene

รูปของฉากแมพย่อยแบบปุ่มกดรุ่นเก่า (index.html โหมด forge) ที่ไม่มีหน้าไหนของเกมปัจจุบันเรียกใช้ (วัดจากการโหลดจริงของ village-town / village-place / place-interior / world-map / battle-field) ย้ายกลับได้ด้วย `git mv`.

โค้ดฉากเก่า (location-actions.js, interface-v02.js, journey-*.js, village-core.js ฯลฯ) ยังอยู่ — ดูรายการใน docs/TODO.md หมวด 13

## v98.437 · ถอดเพิ่ม (วัดจากการเล่นจริงด้วย coverage + `tools/test-station-actions.cjs`)
- `js/editor.js` (ตัวแก้ตัวเลขการ์ดงานเก่า) · `js/developer.js` (โหมดจัดวางชิ้นการ์ด/ฉากเก่า) · `js/card-drag.js` (ลากไพ่ลงฉากเก่า) · `js/interface-v02.js` (ปุ่มภาพหัวจอ + แท่นกิจกรรมด้านขวา + พรีวิวไพ่ต่อสู้ของฉากเก่า)
- CSS ที่ไม่มีกฎไหนถูกใช้ตลอดการเล่น (CSS coverage 0–1%): `battle-controls-v34` `battle-flow` `battle-card-flow` `battle-juice` `adventure` `battle-full` + `interface-v02`
- ภาพที่เหลือแต่โค้ดที่ถอดแล้วอ้าง: `ui-forge/editor/fullscreen/motion/rest/smelt/upgrade/water` · `adventurer-hammer-attack/idle` · `adventurer-sword-attack` · `scarecrow-left` · `battle-loot-v32` · `cursor-fantasy-source` (ไฟล์ที่ต่างจากสำเนาเดิมใน archive ตั้งชื่อ `-v98.437`)
- ชื่อไฟล์เหล่านี้อยู่ใน `retired` ของ manifest แล้ว — Cart เก่าเอากลับมาไม่ได้อีก (`js/manifest-merge.js`)

## v98.440 · ถอดรอบ 2
- `js/tactics-bridge.js` (สะพานสนามกริดเก่า: TacticsLab ที่ถูกเก็บไปแล้ว, expedition, `#tacticsLayer`) · `js/hud-v03.js` (HUD ตัวเลขภาพของหัวจอเก่า)
- CSS: `tactics` (`#tacticsLayer`) · `combat-ui` (HUD/หัวจอเก่า/ไพ่โฟกัส) · `location-actions` (แท่นกิจกรรม) — coverage 2–4% และองค์ประกอบที่มันจัดไม่ถูกวาดอีกแล้ว

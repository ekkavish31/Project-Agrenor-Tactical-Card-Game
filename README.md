# Project A — v94 · Agrenor Tactical Card Game

งานที่เหลือทั้งหมด + บริบทสำหรับส่งต่อ: `docs/TODO.md` (ไฟล์เดียว) · ประวัติ: `docs/CHANGELOG-TH.md`

เปิดเกม: `index.html`

## โครงสร้างโฟลเดอร์
| โฟลเดอร์ | เนื้อหา |
|---|---|
| `index.html` | ตัวเกม |
| `editor.html`, `asset-studio.html` | เครื่องมือแก้เกม (เปิดจากในเกมได้) |
| `js/` | โค้ดเกมทั้งหมด (รวม `card-design.js`, `asset-manifest.js`, `animation-data.js`) |
| `village-town.html` | หมู่บ้าน 2.5D (ในเกมเปิดเป็น iframe ของ `index.html`) |
| `village-place.html` | แผนที่ย่อยตลาด/โรงตีเหล็ก/บ้าน |
| `place-interior.html` | ห้องภายในสถานที่อื่น (โรงแรม วิหาร บ้านชาวบ้าน …) |
| `world-map.html` | แผนที่โลกหมอกดำ · `battle-field.html` = สนามรบแผนที่โลก (มีความสูง) |
| `css/` | สไตล์ทั้งหมด |
| `assets/` | ภาพ/เสียงที่เกมใช้จริง |
| `data/` | ไฟล์ JSON คู่กับข้อมูลเกม (ใช้กับ tools) |
| `dev/` | หน้าตรวจงานภาพ/แอนิเมชัน |
| `tools/` | สคริปต์ทดสอบ/จำลอง (รันด้วย node/python จากโฟลเดอร์หลัก) |
| `art-production/` | ภาพต้นฉบับที่ยังอ้างอิงอยู่ (hero-source, review v32, prompt v34) |
| `docs/` | STYLE-GUIDE, ART-TODO, STORY-INTRO, คู่มือ · `docs/history/` บันทึกติดตั้ง/แพตช์เก่า · `docs/reports/` ผลตรวจรายเวอร์ชัน · `docs/CHANGELOG-TH.md` ประวัติทุกเวอร์ชัน · `docs/TODO.md` งานที่เหลือทั้งหมด (ไฟล์เดียว) |

## กติกาสำหรับแพตช์ถัดไป
- ไฟล์ `.js` ใหม่ → ใส่ใน `js/` และเพิ่ม `<script src="js/ชื่อไฟล์.js">` ใน `index.html`
- ไฟล์ `.css` ใหม่ → ใส่ใน `css/` · ใน CSS ให้อ้างภาพเป็น `url('../assets/...')`
- ไฟล์ที่ export จาก Card Studio (`card-design.js`) → วางทับใน `js/`
- README/รายงานของแต่ละเวอร์ชัน → `docs/reports/` หรือต่อท้าย `docs/CHANGELOG-TH.md` (ไม่วางที่หน้าแรก)
- ไม่เก็บ ZIP แพตช์ไว้ในโฟลเดอร์เกม

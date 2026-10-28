# Project A — v94 · Agrenor Tactical Card Game

แผนงานฉบับเดียว: `docs/PLAN.md` · ประวัติ: `docs/CHANGELOG-TH.md`

เปิดเกม: `index.html`

## โครงสร้างโฟลเดอร์
| โฟลเดอร์ | เนื้อหา |
|---|---|
| `index.html` | ตัวเกม |
| `editor.html`, `asset-studio.html` | เครื่องมือแก้เกม (เปิดจากในเกมได้) |
| `js/` | โค้ดเกมทั้งหมด (รวม `card-design.js`, `asset-manifest.js`, `animation-data.js`) |
| `css/` | สไตล์ทั้งหมด |
| `assets/` | ภาพ/เสียงที่เกมใช้จริง |
| `data/` | ไฟล์ JSON คู่กับข้อมูลเกม (ใช้กับ tools) |
| `dev/` | หน้าตรวจงานภาพ/แอนิเมชัน |
| `tools/` | สคริปต์ทดสอบ/จำลอง (รันด้วย node/python จากโฟลเดอร์หลัก) |
| `art-production/` | ภาพต้นฉบับที่ยังอ้างอิงอยู่ (hero-source, review v32, prompt v34) |
| `docs/` | PLAN (แผนรวมฉบับเดียว), STYLE-GUIDE, ART-TODO, STORY-INTRO, คู่มือ · แผนเก่าอยู่ใน `docs/history/` · `docs/reports/` ผลตรวจรายเวอร์ชัน · `docs/CHANGELOG-TH.md` ประวัติ v01–v34 รวมไฟล์เดียว |

## กติกาสำหรับแพตช์ถัดไป
- ไฟล์ `.js` ใหม่ → ใส่ใน `js/` และเพิ่ม `<script src="js/ชื่อไฟล์.js">` ใน `index.html`
- ไฟล์ `.css` ใหม่ → ใส่ใน `css/` · ใน CSS ให้อ้างภาพเป็น `url('../assets/...')`
- ไฟล์ที่ export จาก Card Studio (`card-design.js`) → วางทับใน `js/`
- README/รายงานของแต่ละเวอร์ชัน → `docs/reports/` หรือต่อท้าย `docs/CHANGELOG-TH.md` (ไม่วางที่หน้าแรก)
- ไม่เก็บ ZIP แพตช์ไว้ในโฟลเดอร์เกม

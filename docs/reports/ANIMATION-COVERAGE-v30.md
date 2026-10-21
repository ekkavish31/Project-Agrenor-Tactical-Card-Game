# ตรวจคลิปแอนิเมชัน v30

ตรวจ metadata เทียบไฟล์จริงจาก Standard v26 + แพตช์ปัจจุบัน
คลิป qaStatus=needs-fix จะไม่ถูกเล่น: ใช้ภาพยูนิตสำรองและเอฟเฟกต์เคลื่อนไหวเดิมแทน
เป็นการป้องกันภาพผิดในเกมชั่วคราว **ยังไม่ได้วาดหรือซ่อมภาพต้นฉบับ**
รายการ needs-review ยังคงรอตรวจเพิ่ม ไม่ถือว่าผ่าน

ตรวจท่าหลัก idle/walk/windup/strike/guard/hit/down ที่มุม SE และ NE
ตัวเลขช่องที่ขาดเป็นรายการตรวจ ไม่ใช่คำสั่งว่าทุกชนิดจำเป็นต้องวาดทุกท่า

| ชนิด | คลิปที่มีไฟล์ | ปิดชั่วคราว | ช่องหลักไม่พบ |
|---|---:|---:|---:|
| dummy · หุ่นไล่กาฝึกซ้อม | 14 | 1 | 2 |
| straw · ทหารฟาง | 16 | 5 | 0 |
| archer · พลธนูฟาง | 14 | 4 | 2 |
| captain · หัวหน้าหุ่นฟาง | 14 | 6 | 0 |
| wolf · หมาป่า | 12 | 1 | 2 |
| bandit · โจรป่า | 12 | 1 | 2 |
| poacher · นักล่าเถื่อน | 14 | 1 | 2 |
| shadowWolf · หมาป่าเงา | 12 | 0 | 2 |
| alpha · จ่าฝูงหมาป่า | 12 | 0 | 2 |
| treant · พฤกษาเฒ่าคลั่ง | 16 | 0 | 2 |
| bat · ค้างคาวถ้ำ | 12 | 0 | 2 |
| kobold · โคโบลด์ขุดแร่ | 14 | 1 | 2 |
| slime · สไลม์แร่ | 12 | 1 | 2 |
| foreman · หัวหน้าคนงานโคโบลด์ | 14 | 1 | 2 |
| golem · โกเล็มหิน | 12 | 0 | 2 |
| crystalKing · ราชาโกเล็มผลึก | 16 | 1 | 2 |
| bogSlime · สไลม์บึง | 12 | 0 | 2 |
| mireBat · ค้างคาวหมอก | 12 | 0 | 2 |
| bogHunter · พรานบึง | 14 | 0 | 2 |
| swampWitch · แม่มดหนองน้ำ | 14 | 0 | 2 |
| mudTroll · โทรลล์โคลน | 12 | 0 | 2 |
| bogHydra · ไฮดราบึงพิษ | 16 | 0 | 2 |
| pirate · โจรสลัด | 12 | 0 | 2 |
| gull · นกนางนวลยักษ์ | 12 | 0 | 2 |
| seaSlime · สไลม์ทะเล | 12 | 0 | 2 |
| corsair · มือปืนสลัด | 0 | 0 | 14 |
| captainHook · กัปตันตะขอ | 0 | 0 | 14 |
| coralGolem · โกเล็มปะการัง | 0 | 0 | 14 |
| iceWolf · หมาป่าหิมะ | 0 | 0 | 14 |
| frostSlime · สไลม์เยือกแข็ง | 0 | 0 | 14 |
| snowKobold · โคโบลด์หิมะ | 0 | 0 | 14 |
| frostWolf · จ่าฝูงน้ำแข็ง | 0 | 0 | 14 |
| yeti · เยติ | 0 | 0 | 14 |
| frostQueen · ราชินีผลึกน้ำแข็ง | 0 | 0 | 14 |
| skeleton · โครงกระดูกทหาร | 0 | 0 | 14 |
| wisp · ดวงวิญญาณ | 0 | 0 | 14 |
| cultist · สาวกลัทธิมืด | 0 | 0 | 14 |
| ghostKnight · อัศวินวิญญาณ | 0 | 0 | 14 |
| gargoyle · การ์กอยล์ | 0 | 0 | 14 |
| voidKing · ราชาแห่งความว่างเปล่า | 0 | 0 | 14 |

## คลิปที่ปิดชั่วคราวตามผลตรวจเดิม
- enemy-anim-dummy-ne-down: A09
- enemy-anim-straw-se-idle: A08
- enemy-anim-straw-se-walk: A08
- enemy-anim-straw-se-windup: A08
- enemy-anim-straw-se-strike: A08
- enemy-anim-straw-se-cast: A08
- enemy-anim-archer-se-idle: A06
- enemy-anim-archer-se-walk: A06
- enemy-anim-archer-se-hit: A06
- enemy-anim-archer-se-down: A06
- enemy-anim-captain-se-idle: A07
- enemy-anim-captain-se-walk: A07
- enemy-anim-captain-se-windup: A07
- enemy-anim-captain-se-hit: A07
- enemy-anim-captain-se-down: A07
- enemy-anim-captain-se-guard: A07
- enemy-anim-wolf-ne-strike: A10
- enemy-anim-bandit-se-hit: A05
- enemy-anim-poacher-se-hit: A04
- enemy-anim-kobold-se-idle: A01
- enemy-anim-slime-se-walk: A03
- enemy-anim-foreman-se-idle: A02
- enemy-anim-crystalKing-ne-down: A11

รายละเอียดช่องที่ขาดแยกรายไฟล์อยู่ใน ANIMATION-COVERAGE-v30.json

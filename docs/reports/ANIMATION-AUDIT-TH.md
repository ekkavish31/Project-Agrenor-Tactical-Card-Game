> v33: ซ่อม A12/A13/A14 แล้ว; A15/A18 ยังเปิด ตรวจรายละเอียดล่าสุดใน ANIMATION-REVIEW-v33.md ตารางเดิมด้านล่างเป็นประวัติฐานกู้คืน

> อัปเดต v32: ตารางด้านล่างเป็นผลตรวจฐานกู้คืนเดิม ขณะนี้เปลี่ยนภาพ23คลิปแล้ว ดูสถานะล่าสุดและงานที่ยังต้องตรวจใน ANIMATION-REVIEW-v32.md

# รายงานตรวจภาพแอนิเมชัน — ชุดกู้คืน v26

ตรวจวันที่ 17 ตุลาคม 2026

**ขอบเขต:** ฐานเกม v25 ที่กู้ได้ เปิดภาพได้ 1,010 ไฟล์ และพบไฟล์ซ่อมที่เสีย 1 ไฟล์ ตรวจมอนสเตอร์ 25 ชนิด 332 คลิป / 742 เฟรม พื้นสนาม 10 คลิป / 40 เฟรม และภาพตัวเอก/เพื่อน/ท่าในเมือง ผ่านภาพรวม 59 หน้า รวมการดูเฟรมเรียงลำดับ ไม่ใช่การรับรองว่าทุกคลิปเล่นลื่นในเบราว์เซอร์แล้ว

**ส่วนที่ตรวจไม่ได้:** ต้นฉบับ v26 ที่เคยรายงานว่าครบยังหาไม่พบ จึงขาดมอนสเตอร์อีก 15 ชนิด 208 คลิป / 468 เฟรม ห้ามถือว่าภาพที่หายผ่านตรวจ

confirmed = เห็นปัญหาจากภาพหรือโครงสร้างชัดเจน; needs-review = หลักฐานยังไม่พอยืนยันด้านกายวิภาค/เวลา ต้องเปิดช้าเทียบเพิ่มเติม

| รหัส | สถานะ | ปัญหา | ไฟล์/เฟรม | แนวแก้ |
|---|---|---|---|---|
| A01 | confirmed | โคบอลด์ idle ระบุ SE แต่จมูกและลำตัวหันซ้าย ต่างจาก walk/windup/strike ที่หันขวา | enemy-anim-kobold-se-idle · 1,2 | วาด idle ใหม่เป็น SE โดยรักษามือจับพลั่วและรูปชุดเดิม |
| A02 | confirmed | หัวหน้าคนงาน idle หันซ้าย แต่ walk/strike หันขวา เกิดการกลับตัวเมื่อเริ่มเดิน | enemy-anim-foreman-se-idle · 1,2 | แก้ idle ให้ตรง SE โดยไม่กลับด้านอุปกรณ์ประจำตัว |
| A03 | confirmed | สไลม์สลับด้านของหน้าและลำตัวระหว่างเฟรม 1/3 กับ 2/4 วงจรเดินจึงเหมือนพลิกตัว | enemy-anim-slime-se-walk · 1,2,3,4 | วาดทั้งสี่เฟรมให้ตาอยู่ด้านเดียวกัน เปลี่ยนเฉพาะยืด/หดตัว |
| A04 | confirmed | พราน hit หันซ้าย ขณะที่ idle/walk/strike หันขวา ธนูย้ายข้างบนจออย่างฉับพลัน | enemy-anim-poacher-se-hit · 1 | คงแกนตัว SE และมือธนูเดิม ขยับถอยหลังเฉพาะการรับแรง |
| A05 | confirmed | โจร hit กลับไปหันซ้าย ต่างจาก idle/strike ที่หันขวา | enemy-anim-bandit-se-hit · 1 | วาดรับแรงในมุม SE เดิม |
| A06 | confirmed | พลธนูหุ่นฟาง idle/walk/hit/down หันซ้าย แต่ windup/strike/cast หันขวา | enemy-anim-archer-se-idle<br>enemy-anim-archer-se-walk<br>enemy-anim-archer-se-hit<br>enemy-anim-archer-se-down · ทั้งชุด/เทียบระหว่างท่า | เลือก SE มาตรฐานเดียวกันทั้งชุดและรักษามือจับธนู |
| A07 | confirmed | กัปตันหุ่นฟางหลายท่าหันซ้าย แต่ strike หันขวา ธง/อาวุธจึงกระโดดข้าง | enemy-anim-captain-se-idle<br>enemy-anim-captain-se-walk<br>enemy-anim-captain-se-windup<br>enemy-anim-captain-se-guard<br>enemy-anim-captain-se-hit<br>enemy-anim-captain-se-down · ทั้งชุด/เทียบระหว่างท่า | ทำ SE ให้ตรงกันทั้งชุด โดยใช้ตำแหน่งธงและมือถืออาวุธเป็นจุดอ้างอิง |
| A08 | confirmed | หุ่นฟางทหาร spear อยู่ซ้ายจอและ shield ขวาจอใน idle/walk แต่กลับข้างใน strike/cast พร้อมแกนตัวเปลี่ยน | enemy-anim-straw-se-idle<br>enemy-anim-straw-se-walk<br>enemy-anim-straw-se-windup<br>enemy-anim-straw-se-strike<br>enemy-anim-straw-se-cast · ทั้งชุด/เทียบระหว่างท่า | ล็อกมือหอก/โล่และแกน SE ให้ตรงกันก่อนวาดท่า |
| A09 | confirmed | ท่าล้มด้านหลังของหุ่นฝึกแสดงเป้าวงกลมด้านหน้าชัดเจน ต่างจาก idle NE ที่เป็นหลัง | enemy-anim-dummy-ne-down · 1,2 | วาดด้านหลังของเสื้อ/เชือกขณะล้ม ไม่แสดงเป้าด้านหน้า |
| A10 | confirmed | มีชิ้นสีอ่อนลอยแยกอยู่ด้านซ้ายของตัวหมาป่า | enemy-anim-wolf-ne-strike · 2 | ลบชิ้นที่ไม่ใช่ร่างกายจากต้นฉบับ ตรวจไม่ให้รวมเศษภาพข้างเคียงตอนตัด |
| A11 | confirmed | มีเศษคริสตัลลอยอยู่ช่วงบนเหนือร่างที่ล้ม แยกจากร่างอย่างชัดเจน | enemy-anim-crystalKing-ne-down · 2 | ตรวจ atlas ต้นฉบับและแยกชิ้นส่วนที่ติดจากเซลล์อื่น |
| A12 | needs-review | เห็นจุด/เส้นแยกเหนือหัวในภาพรวม อาจเป็นเศษเซลล์ข้างเคียง ควรเปิดเฟรมจริงขยายตรวจ | enemy-anim-bogSlime-ne-hit<br>enemy-anim-bogSlime-ne-down · ทั้งชุด/เทียบระหว่างท่า | ตรวจ alpha และส่วนเชื่อมก่อนลบ เพื่อไม่ลบเศษโคลนที่ตั้งใจวาด |
| A13 | needs-review | พลั่วดูย้ายจากมือขวาจอในเฟรม 1 ไปอยู่ซ้ายจอในเฟรม 2 ขณะมืออีกข้างเหยียดออก | enemy-anim-foreman-ne-cast · 1,2,3 | ตรวจเส้นแขนที่ถูกบังและล็อกมือพลั่วก่อนร่าย/ขว้าง |
| A14 | needs-review | ดาบใน windup อยู่แขนฝั่งซ้ายจอ แต่ idle/strike อยู่ขวาจอ อาจเป็นการเปลี่ยนมือหรือแขนหมุนหลังศีรษะ | enemy-anim-pirate-ne-windup<br>enemy-anim-pirate-ne-strike · ทั้งชุด/เทียบระหว่างท่า | เปิดช้า 0.25x เทียบข้อต่อไหล่/ศอก แล้ววาดให้ตามแขนเดียวตลอด |
| A15 | needs-review | ชุดเดิน SE/NE เดิมมีรูปขาก้าวคล้ายกันหลายเฟรม ยังไม่เห็น contact ของขาอีกข้างชัด จึงอาจเดินแบบไถล/ขาซ้ำ | tactics-hero-se-walk-1<br>tactics-hero-se-walk-2<br>tactics-hero-se-walk-3<br>tactics-hero-se-walk-4<br>tactics-hero-se-walk-5<br>tactics-hero-se-walk-6<br>tactics-hero-ne-walk-1<br>tactics-hero-ne-walk-2<br>tactics-hero-ne-walk-3<br>tactics-hero-ne-walk-4<br>tactics-hero-ne-walk-5<br>tactics-hero-ne-walk-6 · ทั้งชุด/เทียบระหว่างท่า | ตรวจ contact/ passing/ opposite contact และจุดเท้าบนพื้นในพรีวิวช้า |
| A16 | confirmed | SW/NW เดิมเป็นภาพสะท้อน SE/NE จึงกลับมือและอุปกรณ์จากต้นแบบตามหมายเหตุในรายการ asset | tactics-hero-sw-idle<br>tactics-hero-sw-walk-left<br>tactics-hero-sw-walk-right<br>tactics-hero-sw-windup<br>tactics-hero-sw-strike<br>tactics-hero-sw-guard<br>tactics-hero-sw-hit<br>tactics-hero-sw-down<br>tactics-hero-nw-idle<br>tactics-hero-nw-walk-left<br>tactics-hero-nw-walk-right<br>tactics-hero-nw-windup<br>tactics-hero-nw-strike<br>tactics-hero-nw-guard<br>tactics-hero-nw-hit<br>tactics-hero-nw-down · ทั้งชุด/เทียบระหว่างท่า | แทนด้วยชุด SW/NW วาดใหม่และตั้ง hand anchors รายเฟรม; บางรายการถูกแทนในชุดกู้คืนนี้แล้ว |
| A17 | confirmed | assets/cards/portraits/en-cultist.repair.webp เปิดภาพไม่ได้; เป็นไฟล์ซ่อมที่ไม่อยู่ในรายการ asset ที่ใช้งาน | (ดูรายละเอียด) · ทั้งชุด/เทียบระหว่างท่า | ใช้ en-cultist.webp ที่เปิดได้ ไฟล์ repair เสียถูกตัดออกจากแพ็กกู้คืนพร้อมบันทึกไว้ |
| A18 | needs-review | runtime มอนสเตอร์สร้าง SW/NW ด้วยการกลับภาพจากคู่ SE/NE จึงกลับข้างของอาวุธ/โล่ด้วย ตัวที่มีอุปกรณ์ไม่สมมาตรต้องตรวจแยก | (ดูรายละเอียด) · ทั้งชุด/เทียบระหว่างท่า | หากต้องรักษามือขวา/ซ้ายทุกมุม ต้องวาด native 4 ทิศหรือแยกอุปกรณ์จากตัว ไม่แก้ด้วยการสลับชื่อทิศ |

## ชุดตัวเอกที่สร้างใหม่

ภาพใหม่ใช้ ImageGen พร้อมต้นแบบตัวละครและคู่มือท่าทาง มีการคัดทิศผิดและจังหวะขาซ้ำออกก่อนจัดชุด ผลคัดเลือกและจุดที่ยังต้องตรวจอยู่ใน hero-production.json

เปิด animation-audit-v26.html ในโฟลเดอร์เกม เพื่อเลือกภาพ ดูทีละเฟรม ปรับความเร็วและย้อนภาพซ้อนได้ รายการ CSV ระบุ path จริงทั้งหมด ชุดต้นฉบับใหม่และ prompt อยู่ใน art-production/v26-recovery/hero-source/

รายงานนี้ไม่ได้แก้ภาพมอนสเตอร์ที่พบปัญหาโดยอัตโนมัติ เพื่อให้เห็นสภาพเดิมและเลือกแก้ตรงรายการได้

## A19 · ชุดเดินใหม่ที่ยังไม่ผ่าน

สร้าง SW/NW แล้ว 12 เฟรม พร้อม strip 6 เฟรมต่อทิศ แต่ยังยืนยันการสลับขา/แขนไม่ผ่าน จึงเก็บเป็นภาพตรวจ ไม่เปิดใช้ในสนาม ดู hero-walk-review-sw / hero-walk-review-nw ในหน้าตรวจภาพ


## สถานะหลังจัดชุด

A16 แก้ท่า SW/NW ใหม่แล้ว 12 ภาพ คงเหลือท่าเดินเดิม 4 ภาพที่ต้องแทนด้วยวงจรใหม่ ส่วน A17 ตัดไฟล์ซ่อม 0 ไบต์ที่ไม่ได้ใช้งานออกแล้ว ไม่เปลี่ยนภาพ cultist ที่ใช้งานจริง รายการอื่นยังเปิดอยู่ มี 19 กลุ่ม: พบชัดเจน 13 กลุ่ม (รวมสองรายการที่แก้แล้ว/แก้บางส่วน) และต้องตรวจเพิ่ม 6 กลุ่ม

ภาพเดิมที่มี status=final หมายถึงผลิตไว้แล้ว ไม่ใช่รับรองว่าผ่านการตรวจคุณภาพครั้งนี้ รายการที่พบปัญหามี qaStatus และ qaIssueIds ใน manifest เพิ่มไว้แล้ว

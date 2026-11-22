/* v98.946 · VENDOR KINDS — the 10 generic sellers / guild staff of the sub-maps (stations: s.vendor = { kind }). ONE list for the game (village-place.html draws them) and for Asset Studio › Animation › "NPC ร้านค้า/สมาคม".
   Pictures: assets/village-town/vendors/<kind>-<sw|se>.webp = standing · assets/village-town/vendors/<kind>-<sw|se>-<pose>.webp = the other poses (384×384, feet at y=360) — tools/build-vendor-sprites.py cuts them from the painted 8-pose sheets.
   A picture that does not exist yet falls back to the code-drawn person (look). Poses: idle2 (shifts weight, every few seconds) · talk (while the station is used) · wave (greeting when you arrive) · give (a buy: hands over goods) · offer (a sell: open hands) · work1 / work2 (the two idle "work" poses, one at random every ~12 s). */
(function (root) {
  'use strict';
  const VENDOR_KINDS = {
 m1: { name: 'พ่อค้า ก (หมวกแก๊ป)', look: { coat: '#7a5a3a', apron: '#e8dcc0', hair: '#4a3020', hat: 'cap', hatCol: '#6a4a2a', age: 40 } },
 m2: { name: 'พ่อค้า ข (มีหนวด)', look: { coat: '#4a5a6a', apron: '#d8d0b8', hair: '#2a2018', hat: 'none', beard: '#2a2018', age: 45 } },
 m3: { name: 'พ่อค้า ค (หมวกเขียว)', look: { coat: '#6a3a3a', apron: '#e8dcc0', hair: '#6a5030', hat: 'cap', hatCol: '#3a4a3a', age: 38 } },
 f1: { name: 'แม่ค้า ก (ผ้าโพกหัว)', look: { coat: '#8a4b5c', apron: '#efe2c8', hair: '#5a3a22', hat: 'scarf', hatCol: '#c9a07a', longHair: true, age: 35 } },
 f2: { name: 'แม่ค้า ข (ผ้าโพกครีม)', look: { coat: '#4a6a4a', apron: '#efe2c8', hair: '#3a2a1e', hat: 'scarf', hatCol: '#e8d6b0', longHair: true, age: 40 } },
 f3: { name: 'แม่ค้า ค (ผมยาว)', look: { coat: '#6a5a8a', apron: '#f1e6cc', hair: '#8a5a2a', hat: 'none', longHair: true, age: 32 } },
 /* v98.585 · Adventurers' Guild staff (unnamed · navy-and-gold guild coat) — js/guild-desk.js STAFF */
 g1: { name: 'ฟรีดา · เจ้าหน้าที่ทะเบียน', look: { coat: '#2f4a6a', apron: '#e8d6a8', hair: '#5a3a22', hat: 'none', longHair: true, age: 30 } },
 g2: { name: 'แกเร็ธ · เจ้าหน้าที่จัดงาน', look: { coat: '#2f4a6a', apron: '#c9a45a', hair: '#2a2018', hat: 'cap', hatCol: '#1f3048', beard: '#2a2018', age: 42 } },
 g3: { name: 'ออสวิน · ผู้ประเมินการ์ด', look: { coat: '#4a3a6a', apron: '#e8dcc0', hair: '#cfcfd6', hat: 'none', beard: '#bfbfc6', age: 60 } },
 g4: { name: 'ไนลา · ผู้ดูแลกระดานประกาศ', look: { coat: '#3a4a3a', apron: '#d8c08a', hair: '#8a5a2a', hat: 'scarf', hatCol: '#2f4a6a', longHair: true, age: 26 } }
};
  const POSES = [['', 'ยืน'], ['idle2', 'ยืน 2 (ขยับตัว)'], ['talk', 'พูดคุย'], ['wave', 'โบกมือทักทาย'], ['give', 'ยื่นของให้'], ['offer', 'แบมือรับ/เชิญ'], ['work1', 'ท่าทำงาน 1'], ['work2', 'ท่าทำงาน 2']];
  const file = (kind, dir, pose) => 'assets/village-town/vendors/' + kind + '-' + dir + (pose ? '-' + pose : '') + '.webp';
  root.VENDOR_KINDS = VENDOR_KINDS; root.VENDOR_POSES = POSES; root.vendorFile = file;
})(globalThis);

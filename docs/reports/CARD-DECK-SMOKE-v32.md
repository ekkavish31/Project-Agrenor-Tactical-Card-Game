# การจำลองด้วยสำรับจริง v32

ใช้ API เล่นไพ่จริง เดินสองครั้ง ร่าย สถานะ และช่วยฟื้น ตามนโยบายอัตโนมัติแบบเดียวกัน ใช้ทีมเริ่มต้น5ตัว ศัตรู8ตัว ทุกพื้นที่ทั้งฉากทั่วไปและบอส จำกัด500การกระทำ CT ไม่ใช้ไอเทมกระเป๋า **ตัวเลขนี้ไม่ใช่อัตราชนะของผู้เล่นจริง**

| สำรับ | พื้นที่ | ฉาก | ครั้ง | ชนะ | แพ้ | เกินเวลา | การกระทำเฉลี่ย |
|---|---|---|---:|---:|---:|---:|---:|
| balanced | forest | fight | 3 | 3 | 0 | 0 | 55 |
| balanced | forest | boss | 3 | 3 | 0 | 0 | 52 |
| balanced | mine | fight | 3 | 3 | 0 | 0 | 46 |
| balanced | mine | boss | 3 | 3 | 0 | 0 | 49 |
| balanced | swamp | fight | 3 | 3 | 0 | 0 | 54 |
| balanced | swamp | boss | 3 | 3 | 0 | 0 | 58 |
| balanced | coast | fight | 3 | 3 | 0 | 0 | 53 |
| balanced | coast | boss | 3 | 3 | 0 | 0 | 56 |
| balanced | frost | fight | 3 | 3 | 0 | 0 | 51 |
| balanced | frost | boss | 3 | 3 | 0 | 0 | 55 |
| balanced | ruins | fight | 3 | 3 | 0 | 0 | 57 |
| balanced | ruins | boss | 3 | 3 | 0 | 0 | 59 |
| melee | forest | fight | 3 | 3 | 0 | 0 | 51 |
| melee | forest | boss | 3 | 3 | 0 | 0 | 49 |
| melee | mine | fight | 3 | 3 | 0 | 0 | 41 |
| melee | mine | boss | 3 | 3 | 0 | 0 | 50 |
| melee | swamp | fight | 3 | 3 | 0 | 0 | 44 |
| melee | swamp | boss | 3 | 3 | 0 | 0 | 55 |
| melee | coast | fight | 3 | 3 | 0 | 0 | 54 |
| melee | coast | boss | 3 | 3 | 0 | 0 | 51 |
| melee | frost | fight | 3 | 3 | 0 | 0 | 54 |
| melee | frost | boss | 3 | 3 | 0 | 0 | 54 |
| melee | ruins | fight | 3 | 3 | 0 | 0 | 51 |
| melee | ruins | boss | 3 | 3 | 0 | 0 | 50 |
| magic | forest | fight | 3 | 3 | 0 | 0 | 52 |
| magic | forest | boss | 3 | 3 | 0 | 0 | 58 |
| magic | mine | fight | 3 | 3 | 0 | 0 | 42 |
| magic | mine | boss | 3 | 3 | 0 | 0 | 50 |
| magic | swamp | fight | 3 | 3 | 0 | 0 | 52 |
| magic | swamp | boss | 3 | 3 | 0 | 0 | 60 |
| magic | coast | fight | 3 | 3 | 0 | 0 | 52 |
| magic | coast | boss | 3 | 3 | 0 | 0 | 55 |
| magic | frost | fight | 3 | 3 | 0 | 0 | 56 |
| magic | frost | boss | 3 | 3 | 0 | 0 | 56 |
| magic | ruins | fight | 3 | 3 | 0 | 0 | 57 |
| magic | ruins | boss | 3 | 3 | 0 | 0 | 57 |

สั่งซ้ำ: node tools/simulate-card-decks-v32.cjs 3
ยังต้องเล่นด้วยคนบนเครื่องจริงเพื่อประเมินความสนุกและจูนระดับความยาก

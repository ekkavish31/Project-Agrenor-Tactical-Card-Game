# พรอมต์ภาพ: ไอเทมแก่นโกลาหล (9 ใบ) + การ์ดต่อสู้ธาตุ Grat (3 ใบ)

ตอนนี้เกมใช้ภาพโค้ดชั่วคราวอยู่ · พอมีภาพจริง ให้ส่งไฟล์เข้า Asset Studio ตามชื่อไฟล์ข้างล่างแล้วเกมจะหยิบไปใช้เอง

## ข้อกำหนดทั่วไป (ตาม `docs/STYLE-GUIDE.md`)
- ภาพการ์ดเป็น **1120×800 (7:5)** · วัตถุหลักชิ้นเดียวกลางภาพ เว้นขอบรอบ ๆ · ไม่มีตัวหนังสือ/กรอบ/ลายน้ำ (เกมใส่กรอบเอง)
- สไตล์วาดมือแฟนตาซี ลายเส้นสะอาด cel-shaded แสงอุ่นจากบนซ้าย เหมือน `assets/cards/item/soulGem.webp` (แนบเป็นภาพอ้างอิงสไตล์ — ใกล้ที่สุดเพราะเป็นธาตุโกลาหลเหมือนกัน)
- **ธาตุโกลาหล (Grat)**: สีม่วงชมพู (magenta-violet) · แก่นผลึกที่ "กำลังเปลี่ยนรูป" — เส้นแตกร้าวเรืองแสง ชิ้นส่วนลอยหมุน ไอควันม่วงบาง ๆ · เป็นความโกลาหลที่ **งดงาม** ไม่ใช่น่าขยะแขยง (lore: Glaethil ผลึกแห่งความเป็นไปได้)
- พื้นหลังของการ์ดไอเทม: ผ้าเข้มบนโต๊ะช่าง เหมือนไอเทมอื่นในเกม (ไม่ใช่พื้นเขียว)

## A. ไอเทมโกลาหล · 9 ภาพ → `assets/cards/item/<id>.webp`
ใช้พรอมต์ฐานเดียวกันแล้วเปลี่ยนส่วน **[ระดับ]** กับ **[สาย]**

```
Fantasy RPG item card illustration, a single [ระดับ] floating above a dark cloth on a smith's workbench, hand-painted clean line art, cel-shaded, warm amber light from the upper left, centered with generous margin, no text, no frame, no watermark. It is a crystal of CHAOS (Grat): magenta-violet translucent crystal with glowing fracture lines, tiny shards orbiting it, thin violet mist. [สาย]. Beautiful and strange, not gross. 1120x800.
```
| ระดับ | ข้อความแทน [ระดับ] |
|---|---|
| เศษ (tier 1) | `small crystal shard the size of a thumb, a few orbiting splinters` |
| แก่น (tier 2) | `fist-sized crystal core with a swirling bright heart and several orbiting shards` |
| ผลึก (tier 3) | `large faceted crystal cluster with a blazing white-violet heart, many orbiting shards and a faint ring of light` |

| สาย | ไฟล์ | ข้อความแทน [สาย] |
|---|---|---|
| ราตรี (dark) | `chaosShardDark` · `chaosCoreDark` · `chaosCrystalDark` | `Lineage of the night wolf: the crystal is tinged deep indigo with black-violet veins, a faint curved fang-like silhouette inside, crescent-moon glints` |
| น้ำแข็ง (ice) | `chaosShardIce` · `chaosCoreIce` · `chaosCrystalIce` | `Lineage of the frost: the crystal is tinged pale icy blue-violet with frost crystals growing on its surface, cold white sparkles, a thin rime of ice` |
| ผืนดิน (earth) | `chaosShardEarth` · `chaosCoreEarth` · `chaosCrystalEarth` | `Lineage of the earth golem: the crystal is embedded in a fragment of rough grey-brown stone, tinged violet-amber, rocky chips floating around it, warm cracks of glow` |

## B. การ์ดต่อสู้ธาตุ Grat · 3 ภาพ → `assets/cards/tactic-<id>.webp`
ขนาด 1120×800 เหมือนการ์ดท่าอื่น (ดู `assets/cards/tactic-quake.webp` เป็นภาพอ้างอิงมุมมอง/ขนาด)

**`tactic-chaosBolt.webp` — ประกายโกลาหล** (โจมตีไกล ระยะ 4, อ่อนแรง 50%)
```
Fantasy RPG action card illustration: a bolt of magenta-violet chaos energy leaping from an outstretched gloved hand in the lower left toward the upper right, the bolt splitting and curling unpredictably into crooked branches, tiny crystal shards trailing, dark violet mist, dramatic but clean hand-painted style, cel-shaded, warm light from upper left, centered, no text, no frame. 1120x800.
```

**`tactic-chaosRend.webp` — ฉีกกระแสโกลาหล** (ทุบรอบเป้า, ปิดเสียง 40%)
```
Fantasy RPG action card illustration: the ground and air tearing apart in a burst of magenta-violet chaos energy around an impact point, radial cracks, flying stones and crystal shards, swirling torn currents of wind and water, hand-painted clean line art, cel-shaded, warm light from upper left, centered burst, no text, no frame. 1120x800.
```

**`tactic-chaosWard.webp` — ผนึกโกลาหล** (เกราะ 12)
```
Fantasy RPG action card illustration: a protective ward made of rotating magenta-violet crystal shards and glowing rune-like sigils forming a shimmering hexagonal barrier in front of the viewer, calm order inside the swirling chaos, hand-painted clean line art, cel-shaded, warm light from upper left, centered, no text, no frame. 1120x800.
```

## เสร็จแล้วทำอะไรต่อ
1. ส่งภาพเข้า Asset Studio ตั้งสถานะ final → เกมใช้แทนภาพโค้ดให้เอง (ผูกกับ `item-<id>` / `tactic-<id>` ในรายการ asset)
2. ถ้า id ของภาพยังไม่อยู่ในรายการ asset ให้บอกผม จะเพิ่มลง manifest ให้

# พร้อมท์สร้างภาพ asset ปุ่มสไตล์ VA (Vibe Agrenor)

ใช้กับเครื่องมือสร้างภาพ (แนบภาพกรอบ `assets/ui/va-frame.webp` และริบบิ้น `assets/ui/va-ribbon.webp` เป็นภาพอ้างอิงสไตล์) · ทุกภาพ **พื้นหลังโปร่งใส (PNG/WebP มีช่องอัลฟา)** · ไม่มีตัวหนังสือในภาพ (ตัวหนังสือใส่ด้วยโค้ด) · ออกแบบให้ยืดแนวนอนได้ (9-slice) คือขอบซ้าย-ขวา-บน-ล่างหนา ~12% ของภาพ ส่วนกลางเรียบ ไม่มีลวดลายที่ห้ามยืด

**สไตล์ร่วม (ใส่ต้นพร้อมท์ทุกภาพ):**
> Game UI asset, hand-painted stylized fantasy, "Vibe Agrenor" style: warm cream parchment and stitched leather, deep red-brown leather with cream/gold dashed stitching, small brass-gold corner studs with tiny emerald-green inlays and an eight-point compass-star motif, soft top-left light, subtle paper/leather grain, clean crisp edges, slight drop shadow baked at the bottom, transparent background, no text, no characters, front view, game-ready, consistent with the reference frame and ribbon.

## 1) ปุ่มหลัก (Primary) · 1200×300 · 3 สถานะ แยก 3 ไฟล์ `va-btn-primary-{normal,hover,disabled}.webp`
> [สไตล์ร่วม] A wide rounded-rectangle button plate, deep crimson leather body with a gold dashed stitch line inset near the border, raised gold-brass rim, two tiny brass corner studs with emerald inlay on the left and right ends (NOT folded ribbon tails — a clean rectangular plate with softly rounded corners), centre area completely plain and flat so text can be placed on it. States: normal = rich crimson; hover = brighter warmer crimson with a faint gold glow along the rim; disabled = desaturated grey-brown faded leather, dull dark-bronze rim, no glow.

## 2) ปุ่มรอง (Secondary / ปุ่มปิด·ย้อนกลับ) · 1200×300 · 3 สถานะ `va-btn-secondary-{normal,hover,disabled}.webp`
> [สไตล์ร่วม] Same shape as the primary plate but cream parchment body (light warm paper colour) with a brown-red leather border and brown dashed stitching, brass corner studs, centre flat and plain for dark-brown text. States: normal, hover (slightly brighter paper + soft gold rim glow), disabled (greyed, desaturated).

## 3) ปุ่มกลมไอคอน (Round icon button) · 256×256 · `va-btn-round-{normal,hover,pressed}.webp`
> [สไตล์ร่วม] A round button medallion: crimson leather disc, gold-brass rim, thin cream dashed stitch ring just inside the rim, small compass-star engraved in the brass at the 12 o'clock rim, centre area flat and empty (icon is added later). Hover = brighter with gold glow; pressed = slightly darker and 3% smaller with the shadow reduced.

## 4) ปุ่มสี่เหลี่ยมไอคอน (Square icon tile) · 256×256 · `va-btn-square-{normal,hover,pressed}.webp`
> [สไตล์ร่วม] A rounded-square tile, cream parchment centre (flat, for a dark icon) inside a red-brown stitched leather border with brass corner studs. Hover = soft gold rim glow; pressed = slightly darker and inset.

## 5) ป้ายแท็ก (Tag chip) · 600×160 `va-tag-{lead,follower}.webp`
> [สไตล์ร่วม] A small pill/banner tag: lead = polished gold-brass plate with a cream dashed stitch edge; follower = dark red-brown leather plate with cream dashed stitch edge. Flat plain centre for a short text label, tiny notch corners, no ribbon tails.

## 6) ริบบิ้นหัวข้อแบบสั้น (Title ribbon, สั้นกว่าตัวเดิม) · 1600×320 `va-ribbon-short.webp`
> [สไตล์ร่วม] A crimson velvet-leather title ribbon with gold dashed stitching and two swallow-tail folded ends, centre long plain area for a title; slightly shorter and less tall than the reference ribbon so it fits over a window edge.

## 7) เส้นแบ่งแบบกระดาษ (Divider) · 1400×80 `va-divider.webp`
> [สไตล์ร่วม] A thin horizontal ornamental divider for a parchment panel: a fine dark-brown ink line with a small gold eight-point compass-star at the centre and tiny leaf curls at both ends, fades out at the very ends, transparent background.

## หลังได้ภาพมา
วางไฟล์ใน `assets/ui/` ตามชื่อข้างบน แล้วบอกผม — ผมจะเปลี่ยนปุ่มที่ตัดจากริบบิ้น (`va-btn.webp`) ในหน้าตั้งชื่อ/Victory และปุ่มอื่น ๆ เป็นชุดนี้ (CSS 9-slice) และบันทึกใน `AGENTS.md`

#!/usr/bin/env python3
"""python3 tools/check-character-feet.py  → docs/CHARACTER-CANVAS-REPORT-TH.md
Standard canvas for every character picture: 384×384, feet (lowest opaque row) at y=360 (anchor 0.9375, same as the hero).
Lists every standing picture whose feet are off the standard, plus its figure height, so Asset Studio > Animation can re-align them."""
import glob, os, re
from PIL import Image
STD, TOL = 360, 3
rows = []
def scan(path, who):
    try:
        im = Image.open(path).convert('RGBA')
    except Exception:
        return
    bb = im.split()[3].point(lambda v: 255 if v > 40 else 0).getbbox()
    if not bb: return
    rows.append((who, path, im.size, bb[3] - 1 if False else bb[3], bb[3] - bb[1]))
for f in sorted(glob.glob('assets/tactics/*_idle.webp')):
    n = os.path.basename(f).split('_')[0]
    if n not in ('hero',): scan(f, n)
for f in sorted(glob.glob('assets/village-town/npc/*/*-stand.webp')):
    scan(f, f.split('/')[3] + ' (หมู่บ้าน)')
for f in sorted(glob.glob('assets/tactics/imported/idle-*/frame-01.*')):
    scan(f, 'ตัวเอก/ท่ายืน ' + f.split('/')[3])
bad = [r for r in rows if r[1].endswith('.webp') or r[1].endswith('.png') if abs(r[3] - STD) > TOL]
out = ['# รายงานผืนผ้าใบตัวละคร (สร้างโดย tools/check-character-feet.py)\n',
       f'มาตรฐาน: 384×384 · เท้า (แถวพิกเซลล่างสุด) ที่ y={STD} ±{TOL} · ทั้งหมด {len(rows)} ภาพ · **ไม่ตรงมาตรฐาน {len(bad)} ภาพ**\n',
       '| ตัวละคร | ไฟล์ | ขนาดผืนผ้าใบ | เท้าที่ y | ความสูงตัว | ต้องเลื่อน (px) |', '|---|---|---|---|---|---|']
for who, p, size, foot, h in bad:
    out.append(f'| {who} | `{p}` | {size[0]}×{size[1]} | {foot} | {h} | {STD - foot:+d} |')
by = {}
for who, p, size, foot, h in rows: by.setdefault(who, []).append(h)
out += ['', '## ความสูงตัวจริงเฉลี่ยต่อตัวละคร (ใช้ดูเทียบกับ ⚖ Scale Lineup)', '', '| ตัวละคร | ภาพ | สูงเฉลี่ย (px จาก 384) |', '|---|---|---|']
for who, hs in sorted(by.items()): out.append(f'| {who} | {len(hs)} | {sum(hs)/len(hs):.0f} |')
open('docs/CHARACTER-CANVAS-REPORT-TH.md', 'w', encoding='utf8').write('\n'.join(out) + '\n')
print(len(rows), 'pictures,', len(bad), 'off standard')

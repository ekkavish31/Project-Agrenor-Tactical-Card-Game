#!/usr/bin/env python3
"""Rebuild assets/cursor/cursor-atlas.webp + the static hand cursors from assets/cursor/cursor-sheet-source.webp (the artist's 8 × 3 sheet, transparent background).
Row 0 = grab hand → fist · row 1 = magnifier with sparkle · row 2 = pointing finger tap + star.
The MAGNIFIER row is stabilised: the lens of every frame is frame 0's lens (the artist's frames drift by ±1 px), and only what really changes (sparkles, glints) is taken from the other frames,
so the lens never "breathes" while the sparkle plays.  usage: python3 tools/build-cursor-atlas.py"""
from PIL import Image
import numpy as np
src = Image.open('assets/cursor/cursor-sheet-source.webp').convert('RGBA'); CW = CH = 250
def cell(r, c): return src.crop((c * CW, r * CH, (c + 1) * CW, (r + 1) * CH))
def stabilise(cells):
    base = np.asarray(cells[0]).astype(int); out = [cells[0]]
    for im in cells[1:]:
        a = np.asarray(im).astype(int); diff = (np.abs(a[..., :3] - base[..., :3]).sum(2) > 70) | ((a[..., 3] > 60) & (base[..., 3] < 30)) | ((a[..., 3] < 30) & (base[..., 3] > 60))
        # keep only changes that are not just a 1-2 px lens shift: pixels that are 'new' light (sparkle: bright yellow / white / teal) or new opaque pixels outside frame 0's silhouette
        lum = a[..., :3].sum(2); bright = (lum > 560) | ((a[..., 1] > 150) & (a[..., 2] > 110) & (a[..., 0] < 120)) | ((a[..., 0] > 200) & (a[..., 1] > 170) & (a[..., 2] < 140))
        outside = (a[..., 3] > 60) & (base[..., 3] < 30)
        m = (diff & bright & (a[..., 3] > 60)) | outside
        res = base.copy(); res[m] = a[m]
        out.append(Image.fromarray(res.astype('uint8'), 'RGBA'))
    return out
CELL = 96; atlas = Image.new('RGBA', (CELL * 8, CELL * 3), (0, 0, 0, 0))
for r in range(3):
    cs = [cell(r, c) for c in range(8)]
    if r == 1: cs = stabilise(cs)
    bbs = [c.getchannel('A').point(lambda v: 255 if v > 60 else 0).getbbox() for c in cs]
    L = min(b[0] for b in bbs); T = min(b[1] for b in bbs); R = max(b[2] for b in bbs); B = max(b[3] for b in bbs)
    bw, bh = R - L, B - T; sc = (CELL - 6) / max(bw, bh); ox = (CELL - bw * sc) / 2; oy = (CELL - bh * sc) / 2
    for c, im in enumerate(cs):
        f = im.crop((L, T, R, B)).resize((max(1, round(bw * sc)), max(1, round(bh * sc))), Image.LANCZOS)
        atlas.alpha_composite(f, (c * CELL + round(ox), r * CELL + round(oy)))
atlas.save('assets/cursor/cursor-atlas.webp', quality=95, method=6)
def frame(r, c): return atlas.crop((c * CELL, r * CELL, (c + 1) * CELL, (r + 1) * CELL))
for name, (r, c) in {'pointer': (2, 0), 'grab': (0, 0), 'grabbing': (0, 4), 'zoom': (1, 0)}.items():
    f = frame(r, c); f.save(f'assets/cursor/{name}@2x.png'); f.resize((48, 48), Image.LANCZOS).save(f'assets/cursor/{name}.png')
print('ok')

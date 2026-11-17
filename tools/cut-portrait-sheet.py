#!/usr/bin/env python3
"""Cut a 2x2 expression sheet (transparent background, native facing left) into assets/portraits/<id>-{neutral,happy,angry,worry}.webp (512x768, bottom-centred).
Usage: tools/cut-portrait-sheet.py <sheet.webp> <id>      order: top-left neutral · top-right happy · bottom-left angry · bottom-right worry"""
import sys
from PIL import Image
src, pid = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGBA'); W, H = im.size; A = im.getchannel('A').point(lambda v: 255 if v > 24 else 0)
def gap(profile, lo, hi):   # the emptiest line in the middle band
    best = min(range(lo, hi), key=lambda i: (profile[i], abs(i - (lo + hi) // 2))); return best
cols = [sum(1 for y in range(H) if A.getpixel((x, y))) for x in range(W)]; rows = [sum(1 for x in range(W) if A.getpixel((x, y))) for y in range(H)]
cx = gap(cols, int(W * .4), int(W * .6)); cy = gap(rows, int(H * .4), int(H * .6))
cells = [(0, 0, cx, cy), (cx, 0, W, cy), (0, cy, cx, H), (cx, cy, W, H)]
crops = []
for c in cells:
    q = im.crop(c); bb = q.getchannel('A').point(lambda v: 255 if v > 24 else 0).getbbox(); crops.append(q.crop(bb))
k = min(512 / max(c.width for c in crops), 768 / max(c.height for c in crops))
for name, c in zip(['neutral', 'happy', 'angry', 'worry'], crops):
    r = c.resize((max(1, round(c.width * k)), max(1, round(c.height * k))), Image.LANCZOS); out = Image.new('RGBA', (512, 768), (0, 0, 0, 0))
    out.paste(r, ((512 - r.width) // 2, 768 - r.height), r); out.save(f'assets/portraits/{pid}-{name}.webp', 'WEBP', quality=90, method=6); print(pid, name, r.size)

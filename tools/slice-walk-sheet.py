#!/usr/bin/env python3
"""v98.72 · cut a transparent walk-cycle sheet (frames in reading order, separated by empty gaps) into 384×384 game frames.
   usage: python3 tools/slice-walk-sheet.py <sheet.png> <out-dir> <prefix> [scale=1.12] [drop-last-if-duplicate=1]
   → <out-dir>/<prefix>-01.webp …  · every frame uses the SAME scale (no size jitter) · the lowest foot sits at y=376 · x is centred on the torso (not the swinging limbs/cloak)
   If the last frame is a copy of the first (loop-closing duplicate) it is dropped."""
import sys, os
import numpy as np
from PIL import Image
src, out, prefix = sys.argv[1:4]; scale = float(sys.argv[4]) if len(sys.argv) > 4 else 1.12; drop = (sys.argv[5] != '0') if len(sys.argv) > 5 else True
im = Image.open(src).convert('RGBA'); al = np.array(im)[..., 3] > 128
def runs(mask, gap):
    idx = np.where(mask)[0]; out = []; s = p = idx[0]
    for v in idx[1:]:
        if v - p > gap: out.append((s, p)); s = v
        p = v
    out.append((s, p)); return out
frames = []
for (y0, y1) in runs(al.any(axis=1), 12):
    for (x0, x1) in runs(al[y0:y1 + 1].any(axis=0), 6): frames.append(im.crop((max(0, x0 - 4), y0, min(im.width, x1 + 5), y1 + 1)))
if drop and len(frames) > 2:
    a = np.array(frames[0].resize((100, 200)))[..., 3].astype(int); b = np.array(frames[-1].resize((100, 200)))[..., 3].astype(int)
    d = [np.abs(a - np.array(f.resize((100, 200)))[..., 3].astype(int)).mean() for f in frames[1:-1]]
    if np.abs(a - b).mean() < min(d) * .6: frames = frames[:-1]; print('dropped the duplicate last frame')
os.makedirs(out, exist_ok=True)
for i, f in enumerate(frames, 1):
    s = f.resize((max(1, round(f.width * scale)), max(1, round(f.height * scale))), Image.LANCZOS); a = np.array(s)[..., 3] > 40
    ys = np.where(a.any(axis=1))[0]; top, bot = ys[0], ys[-1]; H = bot - top + 1
    torso = a[top + int(H * .3): top + int(H * .55)]; cols = np.where(torso.any(axis=0))[0]; cx = (cols[0] + cols[-1]) / 2
    cv = Image.new('RGBA', (384, 384), (0, 0, 0, 0)); cv.alpha_composite(s, (round(192 - cx), 376 - bot))
    cv.save(f'{out}/{prefix}-{i:02d}.webp', quality=95, method=6)
print(len(frames), 'frames →', out)

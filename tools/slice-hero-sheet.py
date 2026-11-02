#!/usr/bin/env python3
"""v98.71 · cut a 4-up hero sheet (green #00FF00 background; left→right: SW, SE, NW, NE) into 384×384 game sprites.
   usage: python3 tools/slice-hero-sheet.py <sheet.webp|png> <out-dir> [pose=idle]
   → <out-dir>/<pose>-{sw,se,nw,ne}.webp · feet at y≈376 · figure 291 px tall (same as the original hero) · alpha keyed from the green."""
import sys, os
import numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]; pose = sys.argv[3] if len(sys.argv) > 3 else 'idle'
im = Image.open(src).convert('RGB'); a = np.array(im).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
gd = g - np.maximum(r, b)
alpha = np.where(gd > 110, 0, np.where(gd > 40, (110 - gd) / 70 * 255, 255)).astype(np.uint8)
rgb = a.copy(); spill = (gd > 0) & (alpha > 0); rgb[..., 1] = np.where(spill, g - np.clip(gd, 0, 255) * 3 // 4, g)
full = Image.fromarray(np.dstack([np.clip(rgb, 0, 255).astype(np.uint8), alpha]), 'RGBA')
xs = np.where((alpha > 128).any(axis=0))[0]; groups = []; s = p = xs[0]
for x in xs[1:]:
    if x - p > 25: groups.append((s, p)); s = x
    p = x
groups.append((s, p)); assert len(groups) == 4, f'expected 4 figures, found {len(groups)}: {groups}'
os.makedirs(out, exist_ok=True); H = 291
for (x0, x1), n in zip(groups, ['sw', 'se', 'nw', 'ne']):
    sub = full.crop((max(0, x0 - 6), 0, min(full.width, x1 + 7), full.height)); al = np.array(sub)[..., 3]
    ys = np.where((al > 128).any(axis=1))[0]; sub = sub.crop((0, ys[0], sub.width, ys[-1] + 1))
    sub = sub.resize((max(1, round(sub.width * H / sub.height)), H), Image.LANCZOS)
    cv = Image.new('RGBA', (384, 384), (0, 0, 0, 0)); bb = sub.getbbox(); cv.alpha_composite(sub, (round(192 - (bb[0] + bb[2]) / 2), 376 - H + 1))
    cv.save(f'{out}/{pose}-{n}.webp', quality=95, method=6); print('wrote', f'{out}/{pose}-{n}.webp')

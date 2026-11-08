#!/usr/bin/env python3
"""python3 tools/build-status-icons.py [sheet.webp]   (default: art-production/status-icons-4x4.webp)
Slices the user's status-icon sheet (4 × 4, transparent background) into assets/ui/status/<name>.webp (128×128).
Order = left→right, top→bottom. Names follow what the picture shows; js/town-battle.js maps game statuses onto them (burn, poison, freeze, slow, weak …)."""
import sys, os
import numpy as np
from PIL import Image
SRC = sys.argv[1] if len(sys.argv) > 1 else 'art-production/status-icons-4x4.webp'
im = Image.open(SRC).convert('RGBA'); a = np.array(im)[:, :, 3] > 30
def runs(v, gap=6):
    out = []; s = None; g = 0; e = 0
    for i, x in enumerate(v):
        if x:
            if s is None: s = i
            g = 0; e = i
        elif s is not None:
            g += 1
            if g >= gap: out.append((s, e + 1)); s = None
    if s is not None: out.append((s, e + 1))
    return out
boxes = []
for (y0, y1) in runs(a.any(1)):
    for (x0, x1) in runs(a[y0:y1].any(0)): boxes.append((x0, y0, x1, y1))
assert len(boxes) == 16, 'expected 16 icons, found %d' % len(boxes)
NAMES = ['poison', 'burn', 'freeze', 'slow', 'root', 'guard', 'magic', 'regen', 'disarm', 'aim', 'blocked', 'no-target', 'haste', 'attack-up', 'potion', 'armor']
os.makedirs('assets/ui/status', exist_ok=True)
for n, b in zip(NAMES, boxes):
    im.crop(b).resize((128, 128), Image.LANCZOS).save('assets/ui/status/%s.webp' % n, lossless=True, quality=100, method=6)
print('sliced', len(NAMES), 'icons → assets/ui/status/')

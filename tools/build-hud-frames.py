#!/usr/bin/env python3
"""python3 tools/build-hud-frames.py   (source: art-production/hud-frames-4x4.webp)
Slices the user's HUD frame sheet into assets/ui/frames/<name>.webp (tight crops, transparent inside the windows) and writes assets/ui/frames/frames.json
with each piece's size and the box of its picture window (fractions 0..1 of the piece) so CSS can put a portrait / text exactly inside.
 row 1: portrait-gold · portrait-gem · portrait-blue · portrait-grey          row 2: info-ally · info-foe · bar-empty · bar-red · bar-green · bar-blue
 row 3: panel3-gold · panel3-green · panel3-red · plate-pointer              row 4: plate-gold · plate-blue · plate-dark · plate-grey"""
import json, os, numpy as np
from PIL import Image, ImageDraw
im = Image.open('art-production/hud-frames-4x4.webp').convert('RGBA'); A = np.array(im)[:, :, 3] > 30
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
rows = runs(A.any(1)); assert len(rows) == 4, len(rows)
pieces = []
for ri, (y0, y1) in enumerate(rows):
    for (x0, x1) in runs(A[y0:y1].any(0)):
        if ri == 1 and x0 > 800:                       # stacked bars: split vertically
            for (a0, a1) in runs(A[y0:y1, x0:x1].any(1), 4):
                sub = A[y0 + a0:y0 + a1, x0:x1]; xs = np.where(sub.any(0))[0]; pieces.append((x0 + xs[0], y0 + a0, x0 + xs[-1] + 1, y0 + a1))
        else:
            sub = A[y0:y1, x0:x1]; ys = np.where(sub.any(1))[0]; pieces.append((x0, y0 + ys[0], x1, y0 + ys[-1] + 1))
NAMES = ['portrait-gold', 'portrait-gem', 'portrait-blue', 'portrait-grey', 'info-ally', 'info-foe', 'bar-empty', 'bar-empty2', 'bar-empty3', 'bar-red', 'bar-green', 'bar-blue',
         'panel3-gold', 'panel3-green', 'panel3-red', 'plate-pointer', 'plate-gold', 'plate-blue', 'plate-dark', 'plate-grey']
assert len(pieces) == len(NAMES), (len(pieces), len(NAMES))
os.makedirs('assets/ui/frames', exist_ok=True); meta = {}
for n, b in zip(NAMES, pieces):
    if n in ('bar-empty2', 'bar-empty3'): continue
    p = im.crop(b); p.save('assets/ui/frames/%s.webp' % n, lossless=True, quality=100, method=6)
    rec = {'w': p.width, 'h': p.height}
    if n.startswith(('portrait', 'info')):                 # the window = the transparent area connected to the centre-left region
        al = Image.fromarray((np.array(p)[:, :, 3] > 30).astype('uint8') * 255); fill = al.copy()
        for seed in [(p.width // 2, p.height // 3), (p.width // 6, p.height // 2)]:
            if fill.getpixel(seed) == 0: ImageDraw.floodfill(fill, seed, 128); break
        hole = np.array(fill) == 128; ys, xs = np.where(hole)
        if len(xs): rec['window'] = [round(xs.min() / p.width, 4), round(ys.min() / p.height, 4), round((xs.max() + 1) / p.width, 4), round((ys.max() + 1) / p.height, 4)]
    meta[n] = rec
json.dump(meta, open('assets/ui/frames/frames.json', 'w'), indent=1)
print('ok', len(meta)); [print(k, v) for k, v in meta.items() if 'window' in v]

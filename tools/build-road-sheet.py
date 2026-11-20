#!/usr/bin/env python3
"""v98.883 · cut the village road textures out of the supplied road sheet (assets/village-town/ground/road-sheet-source.webp).
   The sheet's straight pieces are slightly off the game's 2:1 grid angle, so each piece is first mapped from its own 4 corners onto an exact top-down
   rectangle (an affine un-projection = the tilt is corrected), then:
     road-sheet-cobble.webp  343×196 px = 7×4 cells (49 px per cell) · seamless · stones of two straight pieces, cross-faded at the seams
     road-sheet-curb.webp    192×192 px = 4×4 cells (48 px per cell) · 16 rows of curb blocks, each row ¼ cell deep (the block tops of the sheet's curb)
   village-town.html lays both on the (u,v) axes (pattern rotated 45° in paint space, 1 cell = 28√2 px) so the block rows sit on grid lines.
   Run:  python3 tools/build-road-sheet.py      (needs numpy + Pillow)"""
from PIL import Image
import numpy as np, random, os
ROOT = os.path.join(os.path.dirname(__file__), '..'); G = os.path.join(ROOT, 'assets/village-town/ground/')
a = np.array(Image.open(G + 'road-sheet-source.webp').convert('RGBA')).astype(float)
def unproj(tile_xy, left, top, bottom, sc=2):
    L = np.array(left, float) + tile_xy; e1 = np.array(top, float) - left; e2 = np.array(bottom, float) - left
    ow = int(round(abs(e1[0]) * sc)); oh = int(round(abs(e2[0]) * sc))        # ground length is proportional to dx on a 2:1 grid
    ys, xs = np.mgrid[0:oh, 0:ow]; px = L[0] + xs / ow * e1[0] + ys / oh * e2[0]; py = L[1] + xs / ow * e1[1] + ys / oh * e2[1]
    H, W = a.shape[:2]; px = np.clip(px, 0, W - 1.001); py = np.clip(py, 0, H - 1.001); xi = px.astype(int); yi = py.astype(int); fx = px - xi; fy = py - yi
    out = np.zeros((oh, ow, 4))
    for dy, dx, w in ((0, 0, (1 - fx) * (1 - fy)), (0, 1, fx * (1 - fy)), (1, 0, (1 - fx) * fy), (1, 1, fx * fy)): out += a[yi + dy, xi + dx] * w[..., None]
    return out[..., :3]
# corners of the straight pieces measured on the sheet: (bbox x,y), left corner, far corner along the road, near corner across it
fl = {'A': unproj(np.array([66, 4]), (0, 175), (316, 14), (98, 230)), 'C': unproj(np.array([1049, 4]), (0, 192.5), (382, 0), (95.5, 246))}
# ---- cobble: periodic by cross-fading margins
H, Wc, m = 98, 343, 18
strips = [fl['A'][38:38 + H + m, 40:40 + Wc + m], fl['C'][36:36 + H + m, 60:60 + Wc + m]]
def hwrap(s):
    out = s[:, :Wc].copy(); t = np.linspace(0, 1, m)[None, :, None]; out[:, :m] = (1 - t) * s[:, Wc:Wc + m] + t * s[:, :m]; return out
hs = [hwrap(s) for s in strips]; tile = np.zeros((H * len(hs), Wc, 3))
for j, s in enumerate(hs):
    cur = s[:H].copy(); t = np.linspace(0, 1, m)[:, None, None]; cur[:m] = (1 - t) * hs[j - 1][H:H + m] + t * cur[:m]; tile[j * H:(j + 1) * H] = cur
Image.fromarray(np.clip(tile, 0, 255).astype(np.uint8)).save(G + 'road-sheet-cobble.webp', quality=90)
# ---- curb: block tops of the near-edge strips, one ¼-cell row at a time
rng = random.Random(11); TILE, D = 192, 12
def joints(f):
    col = f[1:10].mean(2).mean(0)
    return [i for i in range(3, len(col) - 3) if col[i] == col[i - 3:i + 4].min() and col[i] < col[max(0, i - 12):i + 13].mean() - 6]
J = {k: joints(f) for k, f in fl.items()}
def row(k):
    js = J[k]
    for _ in range(200):
        i = rng.randrange(len(js) - 1)
        for j in range(i + 1, len(js)):
            if 176 <= js[j] - js[i] <= 208:
                return np.array(Image.fromarray(fl[k][0:D, js[i]:js[j]].astype(np.uint8)).resize((TILE, D), Image.LANCZOS)).astype(float)
curb = np.zeros((TILE, TILE, 3))
for r in range(TILE // D):
    x = None
    while x is None: x = row(rng.choice('AC'))
    curb[r * D:(r + 1) * D] = x
Image.fromarray(curb.astype(np.uint8)).save(G + 'road-sheet-curb.webp', quality=92)
print('ok')

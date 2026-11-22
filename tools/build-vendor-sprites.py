#!/usr/bin/env python3
"""v98.946 · cuts the painted VENDOR sheets (shop keepers / guild staff, 8 poses each, 4 columns × 2 rows) into 384×384 pictures:
   assets/village-town/vendors/<kind>-sw.webp (standing) · <kind>-sw-<pose>.webp   and the same with se (= the SW picture mirrored)
   poses in reading order: stand · idle2 · talk · wave · give · offer · work1 · work2.  Feet on y=360, centred on the feet, ONE scale per person (stand height 290 px, like the adult villagers).
   Kinds are the keys of VENDOR_KINDS (js/vendor-kinds.js): m1 m2 m3 f1 f2 f3 g1 g2 g3 g4.  The sheets are kept in assets/_versions/vendor-sheets-v98.946/<kind>.webp
   python3 tools/build-vendor-sprites.py g3=<sheet.webp> g4=<sheet.webp> …"""
import os, sys, shutil
from PIL import Image
import numpy as np
ROOT = os.path.join(os.path.dirname(__file__), '..')
OUT = os.path.join(ROOT, 'assets', 'village-town', 'vendors'); SRC = os.path.join(ROOT, 'assets', '_versions', 'vendor-sheets-v98.946')
POSES = ['',  'idle2', 'talk', 'wave', 'give', 'offer', 'work1', 'work2']
STAND_H = 290   # px of 384: the height of the existing adult villagers' standing pictures (277–303)

def runs(mask, gap):
    out = []; start = None; last = None
    for i, v in enumerate(mask):
        if v:
            if start is None: start = i
            elif i - last > gap: out.append((start, last + 1)); start = i
            last = i
    if start is not None: out.append((start, last + 1))
    return out

def cells(im):
    a = np.array(im)[..., 3] > 24; H, W = a.shape; mid = H // 2
    # the two rows: split at the emptiest row of pixels near the middle
    rows = a.sum(1); lo, hi = int(H * .35), int(H * .65); cut = lo + int(np.argmin(rows[lo:hi]))
    res = []
    for y0, y1 in ((0, cut), (cut, H)):
        band = a[y0:y1]; cols = band.sum(0) > 0; r = runs(cols, 30)
        while len(r) > 4:   # merge the closest pair of runs (a hand / prop separated from its body)
            g = [r[i + 1][0] - r[i][1] for i in range(len(r) - 1)]; i = int(np.argmin(g)); r[i:i + 2] = [(r[i][0], r[i + 1][1])]
        if len(r) != 4: raise SystemExit('expected 4 figures in a row, found %d: %s' % (len(r), r))
        for x0, x1 in r: res.append(im.crop((x0, y0, x1, y1)))
    return res

def bbox(c):
    a = np.array(c)[..., 3]; ys, xs = np.where(a > 24); return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1

def build(pid, path):
    im = Image.open(path).convert('RGBA'); cs = cells(im)
    b0 = bbox(cs[0]); sc = STAND_H / (b0[3] - b0[1])
    d = OUT; os.makedirs(d, exist_ok=True); os.makedirs(SRC, exist_ok=True); shutil.copy(path, os.path.join(SRC, pid + '.webp'))
    # feet line of every pose = the lowest opaque row of the STAND picture's figure (poses share the same ground line)
    for pose, c in zip(POSES, cs):
        a = np.array(c)[..., 3]; ys, xs = np.where(a > 24); fig = c.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        w, h = max(1, round(fig.width * sc)), max(1, round(fig.height * sc)); fig = fig.resize((w, h), Image.LANCZOS)
        can = Image.new('RGBA', (384, 384), (0, 0, 0, 0))
        # centre on the FEET (the x-centroid of the lowest 40 % of the figure), so a reaching arm / prop does not shift the person
        fa = np.array(fig)[..., 3] > 24; ly = int(h * .6); xs2 = np.where(fa[ly:].any(0))[0]; fx = float(np.average(np.where(fa[ly:])[1])) if fa[ly:].any() else w / 2
        can.alpha_composite(fig, (max(0, min(384 - w, round(192 - fx))), 360 - h))
        nm = pid + '-%s' + ('-' + pose if pose else '') + '.webp'
        can.save(os.path.join(d, nm % 'sw'), 'WEBP', quality=92, method=6)
        can.transpose(Image.FLIP_LEFT_RIGHT).save(os.path.join(d, nm % 'se'), 'WEBP', quality=92, method=6)
    print(pid, 'ok · stand scale %.3f' % sc)

if __name__ == '__main__':
    for arg in sys.argv[1:]:
        pid, path = arg.split('=', 1); build(pid, path)

#!/usr/bin/env python3
"""Straighten a book picture (keystone / perspective) so its left and right edges are vertical and its top and bottom edges horizontal.
usage: tools/deskew-book.py in.webp out.webp [--fit-rows 0.2 0.8]
The side edges are fitted on the rows between the corner ornaments (default 20 %–80 % of the height); the picture is then warped so those lines become vertical (premultiplied alpha, bicubic).
Corner ornaments are left where they are relative to the cover, only the overall trapezoid is corrected. The canvas size is kept."""
import sys, numpy as np
from PIL import Image
def solve(dst, src):
    A = []; B = []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); B.append(u)
        A.append([0, 0, 0, x, y, 1, -v * x, -v * y]); B.append(v)
    return np.linalg.solve(np.array(A, float), np.array(B, float))
def main(a, b, lo=.2, hi=.8):
    im = Image.open(a).convert('RGBA'); al = np.array(im)[:, :, 3] > 128; H, W = al.shape
    ys = np.arange(int(H * lo), int(H * hi)); L = np.array([np.where(al[y])[0].min() for y in ys]); R = np.array([np.where(al[y])[0].max() for y in ys])
    def fit(v):   # robust line fit: drop the worst 15 % residuals once
        p = np.polyfit(ys, v, 1); r = np.abs(np.polyval(p, ys) - v); k = r <= np.quantile(r, .85); return np.polyfit(ys[k], v[k], 1)
    pl, pr = fit(L), fit(R)
    cols = np.arange(int(W * .15), int(W * .85)); T = np.array([np.where(al[:, x])[0].min() for x in cols]); Bo = np.array([np.where(al[:, x])[0].max() for x in cols])
    y0, y1 = float(np.quantile(T, .5)), float(np.quantile(Bo, .5)); ym = (y0 + y1) / 2
    xl, xr = np.polyval(pl, ym), np.polyval(pr, ym)
    src = [(np.polyval(pl, y0), y0), (np.polyval(pr, y0), y0), (np.polyval(pr, y1), y1), (np.polyval(pl, y1), y1)]
    dst = [(xl, y0), (xr, y0), (xr, y1), (xl, y1)]
    print('side slopes px/row  left %.4f right %.4f' % (pl[0], pr[0]), '· rect', [round(v, 1) for v in (xl, y0, xr, y1)])
    co = solve(dst, src)
    out = im.convert('RGBa').transform((W, H), Image.PERSPECTIVE, tuple(co), Image.BICUBIC).convert('RGBA'); out.save(b, quality=92, method=6); print('saved', b, out.size)
if __name__ == '__main__':
    args = sys.argv[1:]; lo, hi = .2, .8
    if '--fit-rows' in args: i = args.index('--fit-rows'); lo, hi = float(args[i + 1]), float(args[i + 2]); del args[i:i + 3]
    main(args[0], args[1], lo, hi)

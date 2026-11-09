#!/usr/bin/env python3
"""v98.300 · cuts the painted NPC sheets (assets/_versions/npc-sheets-v98.300/) into the village's picture sets: assets/village-town/npc/<name>/<dir>-<pose>.webp (384×384, feet on y=359, centred).
   Sheet A (5 people, left → right: may · tom · lin · guard · hilda): A-front-stand → sw-stand · A-walk-back → ne-stand (+ne-walk1)
   Sheet B (5 people: marta · gus · mira · saf · bryn): B-back-stand → ne-stand · B-walk-front → sw-walk1 (+sw-stand: the front standing picture does not exist yet) · B-walk-back → ne-walk1
   SE / NW are the SW / NE pictures mirrored by the engine.  Scale: ONE factor per sheet so heights keep their relation (A 0.52 = the old sprites' size; B 0.52×0.92 because that sheet was drawn ~9 % larger).
   python3 tools/build-npc-sprites.py"""
import os
from PIL import Image
import numpy as np
SRC = os.path.join(os.path.dirname(__file__), '..', 'assets', '_versions', 'npc-sheets-v98.300')
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'village-town', 'npc')
A_NAMES = ['may', 'tom', 'lin', 'guard', 'hilda']; B_NAMES = ['marta', 'gus', 'mira', 'saf', 'bryn']
SC = {'A': .52, 'B': .52 * .92}
def cells(file, names):
    im = Image.open(os.path.join(SRC, file)).convert('RGBA'); cw = im.width // len(names)
    return {n: im.crop((i * cw, 0, (i + 1) * cw, im.height)) for i, n in enumerate(names)}
def put(name, pose, cell, sc):
    a = np.array(cell)[..., 3]; ys, xs = np.where(a > 24); box = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    fig = cell.crop(box); w, h = round(fig.width * sc), round(fig.height * sc); fig = fig.resize((w, h), Image.LANCZOS)
    can = Image.new('RGBA', (384, 384), (0, 0, 0, 0)); can.alpha_composite(fig, (192 - w // 2, 360 - h))
    d = os.path.join(OUT, name); os.makedirs(d, exist_ok=True); can.save(os.path.join(d, pose + '.webp'), 'WEBP', quality=92, method=6); return h
rep = {}
for n, c in cells('A-front-stand.webp', A_NAMES).items(): rep[n] = [put(n, 'sw-stand', c, SC['A'])]
for n, c in cells('A-walk-back.webp', A_NAMES).items(): rep[n].append(put(n, 'ne-stand', c, SC['A']))
for n, c in cells('B-back-stand.webp', B_NAMES).items(): rep[n] = [put(n, 'ne-stand', c, SC['B'])]
for n, c in cells('B-walk-front.webp', B_NAMES).items(): rep[n].append(put(n, 'sw-walk1', c, SC['B'])); put(n, 'sw-stand', c, SC['B'])
for n, c in cells('B-walk-back.webp', B_NAMES).items(): rep[n].append(put(n, 'ne-walk1', c, SC['B']))
for n, h in rep.items(): print(n, 'figure heights (px of 384):', h)

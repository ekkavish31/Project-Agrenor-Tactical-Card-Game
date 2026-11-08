#!/usr/bin/env python3
"""python3 tools/align-feet.py [--dry]   put the lowest opaque row of every CURRENT standing / walking picture of a character at y=360 of the 384 canvas
(the standard in js/char-size.js / docs/CHARACTER-CANVAS-REPORT-TH.md). Only moves pixels up/down — size and animation are untouched.
Current = manifest slots (status final) + the walk sets saved in Asset Studio (studioAllyWalks) + assets/village-town/npc/<name>/ ; old versions are left alone. Git keeps the originals."""
import json, glob, os, sys
from PIL import Image
STD = 360
dry = '--dry' in sys.argv
t = open('js/asset-manifest.js', encoding='utf8').read(); M = json.loads(t[t.index('{'):t.rindex('}') + 1])
NAMES = ['kier', 'lin', 'may', 'tom', 'guard']
files = set()
for k in NAMES:
    for a in M['assets']:
        f = a.get('file')
        if f and a.get('status') == 'final' and (a['id'].startswith(f'tactics-{k}-') and ('idle' in a['id'] or 'walk' in a['id'])): files.add(f)
    for d, c in M.get('studioAllyWalks', {}).get(k, {}).items():
        for fr in c['frames']:
            a = next((x for x in M['assets'] if x['id'] == fr.get('assetId')), None)
            files.add((a or {}).get('file') or fr.get('src'))
    files |= set(glob.glob(f'assets/village-town/npc/{k}/*.webp'))
moved = 0
for f in sorted(x for x in files if x and os.path.exists(x) and '_versions' not in x):
    twins = [f] + ([f[:-4] + '.webp'] if f.endswith('.png') and os.path.exists(f[:-4] + '.webp') else [])
    im = Image.open(f).convert('RGBA'); bb = im.split()[3].point(lambda v: 255 if v > 40 else 0).getbbox()
    if not bb or im.size != (384, 384): continue
    dy = STD - bb[3]
    if abs(dy) <= 1 or abs(dy) > 40 or bb[1] + dy < 0: continue
    print(('would move ' if dry else 'move '), f, dy)
    moved += 1
    if dry: continue
    for p in twins:
        src = Image.open(p).convert('RGBA'); out = Image.new('RGBA', src.size, (0, 0, 0, 0)); out.paste(src, (0, dy))
        out.save(p, **({'lossless': True, 'quality': 100, 'method': 6} if p.endswith('.webp') else {}))
print(moved, 'pictures', 'would move' if dry else 'moved')

#!/usr/bin/env python3
"""v98.77 · register every picture of the selectable hero looks (assets/characters/hero-male, hero-female) in the asset manifest,
so Asset Studio and every other editor list them without having to open the look first.
   python3 tools/register-hero-looks.py        (idempotent — run again after adding frames; keeps statuses/notes you set in the studio)
   Writes data/asset-manifest.json and js/asset-manifest.js in the same shape Asset Studio writes."""
import json, os, re, glob
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
J, JS = 'data/asset-manifest.json', 'js/asset-manifest.js'
M = json.load(open(J, encoding='utf-8'))
head = open(JS, encoding='utf-8').read().split('window.ASSET_MANIFEST=')[0]
have = {a['file']: a for a in M['assets'] if a.get('file')}
OWNER = {'id': 'hero', 'name': 'ตัวหลัก · Hero', 'group': 'characters'}
LOOKS = {'male': 'hero-male', 'female': 'hero-female'}
added = 0
for look, folder in LOOKS.items():
    for f in sorted(glob.glob(f'assets/characters/{folder}/*.webp') + glob.glob(f'assets/characters/{folder}/*.png')):
        if f in have: continue
        base = os.path.splitext(os.path.basename(f))[0]
        m = re.match(r'^(idle|walk)-(sw|se|nw|ne)(?:-(\d+))?$', base)
        if not m: print('skip (name not recognised):', f); continue
        pose, view, n = m.group(1), m.group(2).upper(), m.group(3)
        w, h = Image.open(f).size
        a = {'id': 'look-' + look + '-' + re.sub(r'[^a-z0-9]+', '-', f[len('assets/'):].rsplit('.', 1)[0], flags=re.I), 'file': f, 'category': 'tactics-hero', 'status': 'final',
             'size': [w, h], 'transparent': True, 'view': view, 'pose': pose, 'variant': look, 'studioOwner': OWNER, 'anchor': [0.5, 0.9375],
             'subject': f'{"male" if look == "male" else "female"} hero · {pose} facing {view}' + (f' · frame {int(n)}' if n else '')}
        if n: a.update({'clip': f'{look}.walk.{view.lower()}', 'frame': int(n)})
        M['assets'].append(a); added += 1
json.dump(M, open(J, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); open(J, 'a').write('\n')
open(JS, 'w', encoding='utf-8').write(head + 'window.ASSET_MANIFEST=' + json.dumps(M, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('registered', added, 'new pictures ·', sum(1 for a in M['assets'] if a.get('variant')), 'look pictures in total')

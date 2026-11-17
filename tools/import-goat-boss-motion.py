"""Import the existing goat extras and newly authored boss idle/walk (v98.439).
Usage: python tools/import-goat-boss-motion.py GOAT_PNG BOSS_PNG
"""
import importlib.util
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
REV = 'v98.439'


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / 'tools' / filename)
    obj = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(obj)
    return obj


def run(goat, boss):
    m = json.loads((ROOT / 'data/asset-manifest.json').read_text())
    assets = {a['id']: a for a in m['assets']}
    goat_parts = module('tutorial_stills', 'import-tutorial-art.py').sprites(goat, 6)
    boss_parts = module('tutorial_motion', 'import-tutorial-motion.py').cells(boss, 4)
    previews = []
    for kind, parts, rows, columns, canvas, reference_index in [
        ('goat', goat_parts, [(v, p) for v in ('se', 'ne') for p in ('run', 'pant', 'graze', 'bleat', 'sleep', 'happy')], 1, (512, 512), 1),
        ('pumpkinBoss', boss_parts, [('se', 'idle'), ('ne', 'idle'), ('se', 'walk'), ('ne', 'walk')], 4, (512, 288), 0),
    ]:
        ref = assets[f'enemy-anim-{kind}-se-idle']
        old = Image.open(ROOT / ref['file']).convert('RGBA').crop((0, 0, *ref['frameSize']))
        old_box = old.getbbox()
        neutral = parts[reference_index] if kind == 'goat' else parts[0]
        scale = min((old_box[3] - old_box[1]) / neutral.height,
                    (canvas[0] - 40) / max(p.width for p in parts),
                    (canvas[1] - 40) / max(p.height for p in parts), 1.15)
        baseline = round(canvas[1] * ref['pivot'][1])
        contact = Image.new('RGB', (canvas[0] * columns, canvas[1] * len(rows)), '#63746b')
        for row, (view, pose) in enumerate(rows):
            strip = Image.new('RGBA', (canvas[0] * columns, canvas[1]))
            for col in range(columns):
                part = parts[row * columns + col]
                part = part.resize((round(part.width * scale), round(part.height * scale)), Image.Resampling.LANCZOS)
                strip.alpha_composite(part, (col * canvas[0] + (canvas[0] - part.width) // 2, baseline - part.height))
            file = f'assets/enemies/animations/{kind}/{view}-{pose}-v98-439.webp'
            strip.save(ROOT / file, 'WEBP', quality=92, method=6)
            a = assets[f'enemy-anim-{kind}-{view}-{pose}']
            normalization = dict(ref['normalization'])
            normalization['motionSourceScale'] = round(scale, 6)
            a.update(file=file, status='final', size=list(strip.size), frameSize=list(canvas),
                     pivot=ref['pivot'], barHeight=ref['barHeight'], renderHeight=ref.get('renderHeight', 1),
                     artRevision=REV, normalization=normalization, qaStatus='reviewed-static', qaCheckedAt='2026-11-13',
                     animation=dict(columns=columns, rows=1, frames=columns,
                                    timings=([180, 145, 180, 145] if pose == 'idle' else [90] * 4) if columns == 4 else [650],
                                    loop=pose not in ('bleat', 'happy'), impactMs=180),
                     note='ชีตแพะเดิม 12 พ.ย. ท่าละภาพ ไม่อ้างว่าเป็นวงจรหลายเฟรม; คง 6 ท่าพื้นฐานเดิม' if kind == 'goat' else
                          'บอสฟักทอง idle/walk 4 เฟรมวาดจริงต่อท่า เทียบสเกลภาพเดิม สเกลร่วมสองมุม; SW/NW กลับด้านด้วย MonsterArt')
            contact.paste(strip, (0, row * canvas[1]), strip)
        contact.thumbnail((800, 1600)); contact.save(ROOT.parent / f'{kind}-import-preview.png')
    (ROOT / 'data/asset-manifest.json').write_text(json.dumps(m, ensure_ascii=False, indent=1) + '\n')
    (ROOT / 'js/asset-manifest.js').write_text('/* Generated asset registry; source: data/asset-manifest.json. */\nwindow.ASSET_MANIFEST=' + json.dumps(m, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print('Imported goat extras: 12 single poses; pumpkin boss: 4 clips / 16 authored frames.')


if __name__ == '__main__':
    run(*sys.argv[1:])

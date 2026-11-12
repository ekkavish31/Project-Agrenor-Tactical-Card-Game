"""Import authored 4-frame pumpkin and beetle motion sheets (v98.438).

Usage: python tools/import-tutorial-motion.py PUMPKIN_PNG BEETLE_PNG
Only slices/normalizes authored frames; never synthesizes motion by transforming
the old still. Old still files remain available. Requires Pillow/numpy/scipy.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label

ROOT = Path(__file__).resolve().parents[1]
REV = 'v98.438'


def cells(path, rows):
    sheet = Image.open(path).convert('RGBA')
    result = []
    for row in range(rows):
        for col in range(4):
            cell = sheet.crop((round(col * sheet.width / 4),
                               round(row * sheet.height / rows),
                               round((col + 1) * sheet.width / 4),
                               round((row + 1) * sheet.height / rows)))
            px = np.array(cell)
            labels, count = label(px[:, :, 3] > 32)
            assert count, (row, col, 'empty frame')
            sizes = np.bincount(labels.ravel()); sizes[0] = 0
            mask = binary_dilation(labels == sizes.argmax(), iterations=2)
            px[:, :, 3] = np.where(mask, px[:, :, 3], 0)
            cell = Image.fromarray(px)
            box = cell.getbbox()
            assert box and box[2] - box[0] > 60, (row, col, box)
            result.append(cell.crop(box))
    return result


def run(pumpkin, beetle):
    file = ROOT / 'data/asset-manifest.json'
    manifest = json.loads(file.read_text())
    assets = {a['id']: a for a in manifest['assets']}
    preview = Image.new('RGB', (4 * 384, 10 * 384), '#64746b')
    for kind, source, rows in [
            ('pumpkin', pumpkin, [('se', 'idle'), ('ne', 'idle'), ('se', 'hit'), ('ne', 'hit')]),
            ('pest', beetle, [('se', 'idle'), ('ne', 'idle'), ('se', 'walk'), ('ne', 'walk'), ('se', 'strike'), ('ne', 'strike')])]:
        parts = cells(source, len(rows))
        # Match existing idle size once per species; never fit each pose separately.
        reference = Image.open(ROOT / assets[f'enemy-anim-{kind}-se-idle']['file']).convert('RGBA')
        refbox = reference.getbbox()
        neutral_height = np.median([parts[i].height for i in range(8)])
        scale = min((refbox[3] - refbox[1]) / neutral_height,
                    340 / max(p.width for p in parts), 336 / max(p.height for p in parts), 1)
        for row, (view, pose) in enumerate(rows):
            atlas = Image.new('RGBA', (1536, 384))
            for col in range(4):
                part = parts[row * 4 + col]
                part = part.resize((round(part.width * scale), round(part.height * scale)), Image.Resampling.LANCZOS)
                atlas.alpha_composite(part, (col * 384 + (384 - part.width) // 2, 360 - part.height))
            relative = f'assets/enemies/animations/{kind}/{view}-{pose}-v98-438.webp'
            (ROOT / relative).parent.mkdir(parents=True, exist_ok=True)
            atlas.save(ROOT / relative, 'WEBP', quality=92, method=6)
            a = assets[f'enemy-anim-{kind}-{view}-{pose}']
            a.update(file=relative, size=[1536, 384], frameSize=[384, 384], artRevision=REV,
                     animation=dict(columns=4, rows=1, frames=4,
                                    timings=[180, 145, 180, 145] if pose == 'idle' else
                                            [80, 70, 70, 140] if pose == 'strike' else [90, 90, 90, 90],
                                    impactMs=150 if pose == 'strike' else 180,
                                    loop=pose in ('idle', 'walk')),
                     note='เฟรมวาดเพิ่ม 4 เฟรม/ท่า มุม SE/NE; SW/NW กลับด้านโดย MonsterArt; สเกลเดียวต่อชนิด เทียบภาพเดิม ฐาน y=360; คงท่าอื่นเดิม')
            a['normalization']['motionSourceScale'] = round(scale, 6)
            a['qaStatus'] = 'reviewed-static'
            a['qaCheckedAt'] = '2026-11-13'
            preview.paste(atlas, (0, (row + (0 if kind == 'pumpkin' else 4)) * 384), atlas)
    file.write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n')
    (ROOT / 'js/asset-manifest.js').write_text(
        '/* Generated asset registry; source: data/asset-manifest.json. */\nwindow.ASSET_MANIFEST='
        + json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + ';\n')
    preview.thumbnail((768, 1920))
    preview.save(ROOT.parent / 'tutorial-motion-preview.png')
    print('Imported 10 four-frame clips, 40 authored frames; old stills retained.')


if __name__ == '__main__':
    run(*sys.argv[1:])

"""Import the five approved NPCs from the 2026-11-12 SW/NE standing sheet.
Usage: python tools/import-villager-sheet.py SHEET.png [first|travellers|children]
Pillow/numpy/scipy are used for deterministic extraction, never redrawing art.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import binary_dilation, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
BATCHES = {
    'first': ('v98.421', 292, 'libfile_7226da7533f88191aca37da451300a52',
              [('finn', 'ฟินน์'), ('berg', 'เบิร์ก'), ('ken', 'เคน'), ('shep', 'ปิแอร์'), ('vera', 'เวร่า')]),
    'travellers': ('v98.423', 292, 'libfile_aebfb7f0fe148191acd153487a782d65',
                   [('graven', 'เกรเวน'), ('tess', 'เทส'), ('ash', 'แอช'), ('pell', 'เพลล์'), ('hugo', 'ฮิวโก้')]),
    'children': ('v98.423', 230, 'libfile_e37cec500b1c819181e6c7347e9bc492',
                 [('pim', 'พิม'), ('pip', 'ปิ๊บ')]),
}


def main(source, batch='first'):
    revision, target_height, library_id, people = BATCHES[batch]
    m = json.loads((ROOT / 'data/asset-manifest.json').read_text())
    index = {a['id']: a for a in m['assets']}
    pixels = np.array(Image.open(source).convert('RGBA'))
    labels, _ = label(pixels[:, :, 3] > 24)
    parts = []
    for number, box in enumerate(find_objects(labels), 1):
        if box is None or np.count_nonzero(labels[box] == number) < 500:
            continue
        part = pixels[box].copy()
        part[:, :, 3] *= binary_dilation(labels[box] == number, iterations=1)
        parts.append((box[0].start, box[1].start, Image.fromarray(part)))
    columns = len(people)
    assert len(parts) == columns * 2, f'Expected {columns * 2} complete figures, found {len(parts)}'
    parts.sort(key=lambda p: p[0])
    rows = [sorted(parts[:columns], key=lambda p: p[1]), sorted(parts[columns:], key=lambda p: p[1])]
    # One factor for the whole sheet keeps all heads, bodies and paired views
    # in their original proportions. Existing adult villagers are ~286–296px.
    scale = min(1, target_height / max(p[2].height for p in parts))
    for row, direction in zip(rows, ['sw', 'ne']):
        for (key, name), (_, _, part) in zip(people, row):
            part = part.resize((round(part.width * scale), round(part.height * scale)), Image.Resampling.LANCZOS)
            frame = Image.new('RGBA', (384, 384))
            frame.alpha_composite(part, ((384 - part.width) // 2, 360 - part.height))
            pair = 'se' if direction == 'sw' else 'nw'
            for d, image in [(direction, frame), (pair, ImageOps.mirror(frame))]:
                aid = f'npc-{key}-{d}-stand'
                old = index.get(aid)
                assert old is None or old.get('artRevision') == revision, f'Existing artwork requires review: {aid}'
                relative = f'assets/village-town/npc/{key}/{d}-stand.webp'
                path = ROOT / relative
                assert not path.exists() or old is not None, f'Unregistered existing image: {relative}'
                path.parent.mkdir(parents=True, exist_ok=True)
                image.save(path, 'WEBP', quality=92, method=6)
                entry = dict(id=aid, file=relative, category='allies', status='final',
                             size=[384, 384], transparent=True, view=d.upper(), pose='idle',
                             pivot=[.5, .9375], artRevision=revision, usedIn=f'NPC {name} · ยืน',
                             studioOwner=dict(id='npc:' + key, name=name, group='npcs'),
                             normalization=dict(commonScale=scale, baseline=360,
                                                sharedAcross='whole sheet, both views'),
                             sourceLibraryFile=library_id,
                             note='ท่ายืนจริง SW/NE; SE/NW กลับด้านและบันทึกไฟล์จริง; ยังไม่มีภาพก้าวขา')
                if d != direction:
                    entry['mirroredFrom'] = f'npc-{key}-{direction}-stand'
                if batch == 'children':
                    entry['ageScaleBaked'] = True  # actual smaller body in the PNG; do not shrink twice
                if old is None:
                    m['assets'].append(entry)
                else:
                    old.update(entry)
    (ROOT / 'data/asset-manifest.json').write_text(json.dumps(m, ensure_ascii=False, indent=1) + '\n')
    (ROOT / 'js/asset-manifest.js').write_text('/* Generated asset registry; source: data/asset-manifest.json. */\nwindow.ASSET_MANIFEST=' + json.dumps(m, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'Imported {columns} NPCs × 4 directions, 384px canvas, common scale {scale:.6f}, feet y=360')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'first')

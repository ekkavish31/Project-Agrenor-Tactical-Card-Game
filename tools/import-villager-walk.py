"""Import the approved short-step SW/NE sheet for Finn/Berg/Ken/Pierre/Vera.
Usage: python tools/import-villager-walk.py SHEET.png [first|travellers|children]
Scale comes from the standing sheet (1983px wide), never a per-pose fit.
Only deterministic crop/resize/placement/mirroring, no generated redraw here.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageOps
from scipy.ndimage import binary_dilation, find_objects, label

ROOT = Path(__file__).resolve().parents[1]
REV = 'v98.432'
PEOPLE = [('finn', 'ฟินน์'), ('berg', 'เบิร์ก'), ('ken', 'เคน'), ('shep', 'ปิแอร์'), ('vera', 'เวร่า')]


def head_x(image):
    a = np.array(image.getchannel('A'))
    ys, xs = np.where(a > 24)
    top, bottom = int(ys.min()), int(ys.max()) + 1
    mask = a[top:top + max(1, round((bottom - top) * .23))] > 24
    return float(np.where(mask)[1].mean())


def main(source, batch="first"):
    global REV, PEOPLE
    batches = {
        "first": (PEOPLE, 1983, "libfile_88c553453d688191be7be8e62600d31f"),
        "travellers": ([("graven", "เกรเวน"), ("tess", "เทส"), ("ash", "แอช"), ("pell", "เพลล์"), ("hugo", "ฮิวโก้")], 1983, "libfile_138164d66bbc8191911a6b3f1775406e"),
        "children": ([("pim", "พิม"), ("pip", "ปิ๊บ")], 1160, "libfile_4559fe403f50819188d11b1c5ad8f92d")
    }
    PEOPLE, reference_width, library_id = batches[batch]
    if batch != "first": REV = "v98.434"
    manifest = json.loads((ROOT / 'data/asset-manifest.json').read_text())
    assets = {a['id']: a for a in manifest['assets']}
    image = Image.open(source).convert('RGBA')
    data = np.array(image)
    labels, _ = label(data[:, :, 3] > 24)
    parts = []
    for number, box in enumerate(find_objects(labels), 1):
        if box is None or np.count_nonzero(labels[box] == number) < 500:
            continue
        pixels = data[box].copy()
        pixels[:, :, 3] *= binary_dilation(labels[box] == number, iterations=1)
        parts.append((box[0].start, box[1].start, Image.fromarray(pixels)))
    assert len(parts) == len(PEOPLE) * 2, f'Expected {len(PEOPLE) * 2} whole sprites, found {len(parts)}'
    parts.sort(key=lambda p: p[0])
    rows = [sorted(parts[:len(PEOPLE)], key=lambda p: p[1]), sorted(parts[len(PEOPLE):], key=lambda p: p[1])]
    reference_scales = {assets[f'npc-{k}-sw-stand']['normalization']['commonScale'] for k, _ in PEOPLE}
    assert len(reference_scales) == 1, 'Standing images were rescaled separately; review before import'
    standing_scale = reference_scales.pop()
    scale = standing_scale * reference_width / image.width
    for key, _ in PEOPLE:
        assert not any(w.get('frames') for w in manifest.get('studioAllyWalks', {}).get(key, {}).values()), f'{key} already has a custom walk'
    for row, view in zip(rows, ['sw', 'ne']):
        for (key, name), (_, _, part) in zip(PEOPLE, row):
            part = part.resize((round(part.width * scale), round(part.height * scale)), Image.Resampling.LANCZOS)
            standing = Image.open(ROOT / assets[f'npc-{key}-{view}-stand']['file']).convert('RGBA')
            x = round(head_x(standing) - head_x(part))
            y = 360 - part.height
            assert x >= 8 and x + part.width <= 376 and y >= 8, (key, view, part.size, x, y)
            frame = Image.new('RGBA', (384, 384))
            frame.alpha_composite(part, (x, y))
            mirror = 'se' if view == 'sw' else 'nw'
            for direction, bitmap in [(view, frame), (mirror, ImageOps.mirror(frame))]:
                aid = f'npc-{key}-{direction}-walk1'
                old = assets.get(aid)
                assert old is None or old.get('status') in ['missing', 'planned', 'code'] or old.get('artRevision') == REV, f'Existing real art needs review: {aid}'
                relative = f'assets/village-town/npc/{key}/{direction}-walk1.webp'
                path = ROOT / relative
                assert not path.exists() or old and old.get('artRevision') == REV, f'Existing file must not be overwritten: {path}'
                path.parent.mkdir(parents=True, exist_ok=True)
                bitmap.save(path, 'WEBP', quality=92, method=6)
                entry = dict(id=aid, file=relative, category='allies', status='final',
                             size=[384, 384], transparent=True, view=direction.upper(), pose='walk', frame=1,
                             pivot=[.5, .9375], artRevision=REV, usedIn=f'NPC {name} · เดินก้าวสั้น',
                             studioOwner=dict(id='npc:' + key, name=name, group='npcs'),
                             sourceLibraryFile=library_id,
                             normalization=dict(commonScale=scale, standingScale=standing_scale, referenceSheetWidth=reference_width,
                                                sourceSheetWidth=image.width, baseline=360,
                                                sharedAcross='standing and short-step poses, both views'),
                             note='1 ภาพก้าวขาต่อทิศ สลับกับภาพยืนเดิมใน runtime; ยังไม่ใช่วงจรเดินเต็ม; SE/NW เป็นไฟล์กลับด้าน')
                if batch == 'children':
                    entry['ageScaleBaked'] = True
                if direction != view:
                    entry['mirroredFrom'] = f'npc-{key}-{view}-walk1'
                if old is None:
                    manifest['assets'].append(entry)
                else:
                    old.update(entry)
                    for field in ['qaStatus', 'qaIssueIds']:
                        old.pop(field, None)
    (ROOT / 'data/asset-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + '\n')
    (ROOT / 'js/asset-manifest.js').write_text('/* Generated asset registry; source: data/asset-manifest.json. */\nwindow.ASSET_MANIFEST=' + json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'Imported {len(PEOPLE) * 4} walk images; scale {scale:.6f} shared with standing, feet y=360, heads aligned')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "first")

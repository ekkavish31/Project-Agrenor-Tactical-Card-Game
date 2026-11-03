#!/usr/bin/env python3
"""v98.90 · ตรวจ "มาตรฐานความครบของตัวละคร" (docs/STYLE-GUIDE.md → "มาตรฐานภาพต่อตัวละคร")
   ตัวละครสนามต่อสู้ (เพื่อนร่วมทีม) ต้องมีครบ 4 ทิศ (SW NW NE SE) × 6 ท่า (idle windup strike guard hit down) = 24 รูป
   และทุกรูปต้องลงทะเบียนใน data/asset-manifest.json + js/asset-manifest.js (ไม่งั้น Asset Studio มองไม่เห็น)
   python3 tools/check-character-coverage.py                    แสดงตาราง ไฟล์บนดิสก์ / ลงทะเบียนแล้ว (exit 1 ถ้ามีช่องว่าง)
   python3 tools/check-character-coverage.py --register         ลงทะเบียนไฟล์ที่มีบนดิสก์แต่ยังไม่อยู่ใน manifest
   python3 tools/check-character-coverage.py --slots            ช่องที่ยังไม่มีภาพ (รวมท่าเดิน) → ลงทะเบียนเป็น "ช่องว่าง" สถานะ missing = ยังไม่มีภาพ ใส่ไฟล์ทีหลังได้
                                                                (Asset Studio แสดงเป็นช่องว่างให้เติม ไม่ปล่อยให้แถว/คอลัมน์หายไป · ไม่สร้างภาพปลอมให้)"""
import json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
J, JS = 'data/asset-manifest.json', 'js/asset-manifest.js'
CHARS = ['bram', 'luna', 'kier', 'mil']; DIRS = ['sw', 'nw', 'ne', 'se']; POSES = ['idle', 'windup', 'strike', 'guard', 'hit', 'down']
OPP = {'sw': 'se', 'se': 'sw', 'nw': 'ne', 'ne': 'nw'}
WORD = {'sw': 'down-left (SW)', 'se': 'down-right (SE)', 'nw': 'up-left (NW, back view)', 'ne': 'up-right (NE, back view)'}
M = json.load(open(J, encoding='utf-8')); A = {a['id']: a for a in M['assets']}
path = lambda c, d, p: f'assets/tactics/{c}_{d}_{p}.webp'; aid = lambda c, d, p: f'tactics-{c}-{d}-{p}'
disk = lambda c, d, p: os.path.exists(path(c, d, p)); reg = lambda c, d, p: aid(c, d, p) in A and A[aid(c, d, p)].get('status') != 'unused'
def save():
    head = open(JS, encoding='utf-8').read().split('window.ASSET_MANIFEST=')[0]
    json.dump(M, open(J, 'w', encoding='utf-8'), ensure_ascii=False, indent=1); open(J, 'a').write('\n')
    open(JS, 'w', encoding='utf-8').write(head + 'window.ASSET_MANIFEST=' + json.dumps(M, ensure_ascii=False, separators=(',', ':')) + ';\n')
def add(c, d, p, status='final', note=None):
    tpl = next((A[aid(c, o, p)] for o in DIRS if aid(c, o, p) in A), None) or next(a for a in M['assets'] if a['id'].startswith(f'tactics-{c}-'))
    a = {**tpl, 'id': aid(c, d, p), 'file': path(c, d, p), 'status': status, 'size': [384, 384]}
    a['subject'] = re.sub(r'facing [a-z\- ]+\([A-Z]{2}[^)]*\)', 'facing ' + WORD[d], tpl.get('subject', ''))
    for k in ('qaIssueIds', 'qaStatus'): a.pop(k, None)
    if note: a['note'] = note
    if a['id'] in A: A[a['id']].update(a)
    else: M['assets'].append(a)
    A[a['id']] = a
do_reg, do_slots = '--register' in sys.argv, '--slots' in sys.argv
if do_reg:
    n = 0
    for c in CHARS:
        for d in DIRS:
            for p in POSES:
                if disk(c, d, p) and not reg(c, d, p): add(c, d, p); n += 1
    save(); print('ลงทะเบียนเพิ่ม', n, 'รูป')
if do_slots:
    n = 0
    for c in CHARS:
        for d in DIRS:
            for p in POSES:
                if not disk(c, d, p) and aid(c, d, p) not in A: add(c, d, p, 'missing', 'ช่องว่าง: ยังไม่มีภาพ — ใส่ไฟล์ตามชื่อนี้ได้เลย'); n += 1
            w = f'assets/tactics/{c}_{d}_walk_01.webp'
            if aid(c, d, 'walk-1') not in A and not os.path.exists(w):
                tpl = next(a for a in M['assets'] if a['id'].startswith(f'tactics-{c}-'))
                a = {**tpl, 'id': aid(c, d, 'walk-1'), 'file': w, 'status': 'missing', 'size': [384, 384], 'pose': 'walk', 'view': d.upper(), 'clip': f'tactics.walk.{d}', 'frame': 1, 'frames': 1,
                     'subject': re.sub(r'pose "[^"]*"[^,]*', 'pose "walk" (walk cycle frame 1)', re.sub(r'facing [a-z\- ]+\([A-Z]{2}[^)]*\)', 'facing ' + WORD[d], tpl.get('subject', ''))), 'note': 'ช่องว่าง: ยังไม่มีท่าเดิน — เติมเฟรมเดินทีหลังได้ (นำเข้าชุดเดินในตัวแก้เฟรม)'}
                for k in ('qaIssueIds', 'qaStatus'): a.pop(k, None)
                M['assets'].append(a); A[a['id']] = a; n += 1
    save(); print('ลงทะเบียนช่องว่าง', n, 'ช่อง (status=missing)')
gaps = 0
print('ตัว    ' + ''.join(f'{d.upper():>11}' for d in DIRS) + '      (ไฟล์บนดิสก์ / ลงทะเบียน · เต็ม = 6/6)')
for c in CHARS:
    cells = []
    for d in DIRS:
        k, r = sum(disk(c, d, p) for p in POSES), sum(reg(c, d, p) for p in POSES)
        cells.append(f'{k}/{r}'.rjust(11) + ('' if k == r == 6 else '*')); gaps += (k != 6) + (r != 6)
    print(f'{c:7}' + ''.join(cells))
print('✓ ครบทุกตัว' if not gaps else f'✗ ช่องว่าง {gaps} จุด (* = ยังไม่ครบ)'); sys.exit(1 if gaps else 0)

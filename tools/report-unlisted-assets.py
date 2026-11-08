#!/usr/bin/env python3
"""python3 tools/report-unlisted-assets.py  → docs/ASSET-UNLISTED-REPORT-TH.md
Picture files under assets/ that are NOT named in js/asset-manifest.js (so Asset Studio does not know them), grouped by folder and by what
data/asset-usage.js (tools/scan-asset-usage.cjs) says about them: seen loaded by the real game · named in live code · maybe (folder built in code) · nothing found.
Only a report — nothing is moved or deleted. Use the 📋 Asset Manager tab to review and delete."""
import json, os, re, collections
t = open('js/asset-manifest.js', encoding='utf8').read(); M = json.loads(t[t.index('{'):t.rindex('}') + 1])
listed = set()
def walk(o):
    if isinstance(o, str):
        if o.startswith('assets/'): listed.add(o); listed.add(re.sub(r'\.(png|webp)$', lambda m: '.webp' if m.group(1) == 'png' else '.png', o))
    elif isinstance(o, dict): [walk(v) for v in o.values()]
    elif isinstance(o, list): [walk(v) for v in o]
walk(M)
u = open('data/asset-usage.js', encoding='utf8').read(); U = json.loads(u[u.index('{'):u.rindex('}') + 1])
def cls(p):
    v = U.get(p[len('assets/'):], [])
    return 'real' if any(x.startswith('เห็น') for x in v) else 'code' if any(x.startswith('เขียน') for x in v) else 'guess' if v else 'none'
rows = []
for d, _, fs in os.walk('assets'):
    for f in fs:
        if not re.search(r'\.(png|webp|jpe?g|gif)$', f, re.I): continue
        p = os.path.join(d, f).replace('\\', '/')
        if p in listed or '/_versions/' in p: continue
        rows.append((p, cls(p)))
by = collections.defaultdict(lambda: collections.Counter())
for p, c in rows: by['/'.join(p.split('/')[:3]) if p.count('/') > 2 else '/'.join(p.split('/')[:2])][c] += 1
tot = collections.Counter(c for _, c in rows)
out = ['# รายงานไฟล์ภาพที่ไม่อยู่ใน manifest (สร้างโดย tools/report-unlisted-assets.py)\n',
       f'ทั้งหมด **{len(rows)}** ไฟล์ · เห็นเกมโหลดจริง {tot["real"]} · มีชื่อในโค้ด {tot["code"]} · อาจใช้ (โฟลเดอร์ที่โค้ดประกอบชื่อเอง) {tot["guess"]} · ไม่พบการใช้ {tot["none"]}\n',
       '**ความหมาย:** "เห็นโหลดจริง/มีชื่อในโค้ด" = ควรเพิ่มเข้า manifest เพื่อให้ Asset Studio ดูแลได้ · "ไม่พบการใช้" = ผู้สมัครลบ (ตรวจในแท็บ 📋 Asset Manager ก่อน) · "อาจใช้" = ต้องดูภาพก่อน\n',
       '| โฟลเดอร์ | เห็นโหลดจริง | มีชื่อในโค้ด | อาจใช้ | ไม่พบการใช้ | รวม |', '|---|---|---|---|---|---|']
for k, c in sorted(by.items(), key=lambda x: -sum(x[1].values())):
    out.append(f'| `{k}` | {c["real"]} | {c["code"]} | {c["guess"]} | {c["none"]} | {sum(c.values())} |')
open('docs/ASSET-UNLISTED-REPORT-TH.md', 'w', encoding='utf8').write('\n'.join(out) + '\n')
print(len(rows), dict(tot))

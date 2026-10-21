"""v15: writes ART-TODO.md — every image still to generate, grouped into batches in the recommended order.
usage: python3 tools/art-todo.py   (reads asset-manifest.json; rerun after Asset Studio exports)"""
import json, collections
M = json.load(open('data/asset-manifest.json', encoding='utf8'))
TODO = ('missing', 'code', 'temp', 'planned')
ORDER = [('allies','1 · เพื่อนร่วมทีม (ภาพในสนาม)'),('tactics-hero','2 · ตัวเอกในสนามต่อสู้ (ทิศ × ท่า)'),('enemies','3 · มอนสเตอร์ (หน้า แล้วค่อยหลัง)'),
         ('scenes','4 · พื้นหลังพื้นที่ผจญภัย'),('tactics-equipment','5 · อาวุธในมือ (สนาม)'),('items','6 · ภาพการ์ดของใช้ / ไอเทม / เหตุการณ์ / อาวุธ'),
         ('tactic-cards','7 · ภาพการ์ดเคลื่อนที่ / แอ็กชัน'),('cards','8 · อื่น ๆ')]
by = collections.defaultdict(list)
for a in M['assets']:
    if a['status'] in TODO: by[a['category']].append(a)
out = ['# ภาพที่ต้องเจน (สร้างจาก asset-manifest.json)', '',
       f"รวม {sum(len(v) for v in by.values())} ภาพ · ทำตามลำดับหมวด · ใน Asset Studio กดตัวกรอง \"ยังต้องทำ\" แล้วเลือกหลายภาพ → 🧩 ชุดคำขอ", '',
       'กติกาทุกภาพ: ดู STYLE-GUIDE.md · ภาพโปร่งใสให้ใช้พื้นเขียวล้วน #00FF00 (Asset Studio ลบให้) · ชื่อไฟล์ตามคอลัมน์ file', '']
done = set()
for cat, title in ORDER + [(c, c) for c in by if c not in dict(ORDER)]:
    if cat in done or not by.get(cat): continue
    done.add(cat); arr = sorted(by[cat], key=lambda a: a['id'])
    out += [f'## {title} — {len(arr)} ภาพ', '', '| id | file | ขนาด | โปร่งใส | สถานะ | รายละเอียด |', '|---|---|---|---|---|---|']
    for a in arr:
        sz = 'x'.join(map(str, a.get('size') or [])) or '-'
        out.append(f"| {a['id']} | {a.get('file','')} | {sz} | {'✓' if a.get('transparent') else ''} | {a['status']} | {(a.get('subject') or '').replace('|','/')[:110]} |")
    out.append('')
open('docs/ART-TODO.md', 'w', encoding='utf8').write('\n'.join(out)); print('docs/ART-TODO.md', sum(len(v) for v in by.values()))
